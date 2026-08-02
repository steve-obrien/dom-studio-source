const catalog = Object.freeze({
	sprints: [
		{ value: 'cycle_32', label: 'Cycle 32', description: 'Aug 4–17 · planning' },
		{ value: 'cycle_33', label: 'Cycle 33', description: 'Aug 18–31 · upcoming' },
	],
	teams: [
		{ value: 'product', label: 'Product team', description: 'Platform, growth, and design' },
		{ value: 'platform', label: 'Platform only', description: 'Infrastructure and application foundations' },
		{ value: 'experience', label: 'Experience only', description: 'Growth and product design' },
	],
	owners: [
		{ value: 'maya', label: 'Maya Chen', description: 'Product engineering · 8 point capacity', initials: 'MC', capacity: 8 },
		{ value: 'jon', label: 'Jon Bell', description: 'Platform engineering · 8 point capacity', initials: 'JB', capacity: 8 },
		{ value: 'ari', label: 'Ari Grant', description: 'Product design · 6 point capacity', initials: 'AG', capacity: 6 },
		{ value: 'sam', label: 'Sam Rivera', description: 'Growth engineering · 6 point capacity', initials: 'SR', capacity: 6 },
	],
	estimates: [1, 2, 3, 5, 8].map((value) => ({ value: String(value), label: `${value} point${value === 1 ? '' : 's'}` })),
	priorities: [
		{ value: 'all', label: 'Every priority' },
		{ value: 'urgent', label: 'Urgent' },
		{ value: 'high', label: 'High' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'low', label: 'Low' },
	],
});

const currentOperator = Object.freeze({
	id: 'maya',
	name: 'Maya Chen',
	initials: 'MC',
	role: 'Product lead',
});

let receiptSequence = 4200;
let activitySequence = 900;
let state = createInitialState();
const movePreviews = new Map();
const planPreviews = new Map();

/**
 * Returns the complete sprint-planning workspace and server-owned catalogs.
 *
 * @returns {Record<string, unknown>} Serialized sprint-planning workspace.
 */
export function getSprintPlanningWorkspace() {
	return serializeWorkspace();
}

/**
 * Evaluates one issue move against exact revisions and team capacity.
 *
 * @param {string} issueId Stable issue identifier.
 * @param {Record<string, unknown>} input Proposed move and concurrency values.
 * @returns {Record<string, unknown>} Immutable move preview or API error.
 */
export function previewSprintIssueMove(issueId, input = {}) {
	const issue = findIssue(issueId);
	if (!issue) return notFound('Issue');
	const conflict = exactMutation(issue, input);
	if (conflict) return conflict;

	const destination = normalizeText(input.destination, 20);
	if (!['backlog', 'sprint'].includes(destination)) return validationError({ destination: ['Choose backlog or the active sprint.'] });
	if (destination === issue.bucket) return validationError({ destination: [`${issue.id} is already in ${destination === 'sprint' ? 'Cycle 32' : 'the backlog'}.`] });

	const ownerId = normalizeText(input.ownerId, 40) || issue.ownerId;
	const estimate = Number(input.estimate || issue.estimate);
	const fields = {};
	if (destination === 'sprint' && !catalog.owners.some((owner) => owner.value === ownerId)) fields.ownerId = ['Choose an accountable owner before adding work to the sprint.'];
	if (!catalog.estimates.some((option) => Number(option.value) === estimate)) fields.estimate = ['Choose a supported Fibonacci estimate.'];
	if (Object.keys(fields).length) return validationError(fields);

	const currentPoints = sprintIssues().reduce((total, row) => total + row.estimate, 0);
	const nextPoints = destination === 'sprint' ? currentPoints + estimate : currentPoints - issue.estimate;
	const owner = ownerFor(ownerId);
	const currentOwnerPoints = sprintIssues().filter((row) => row.ownerId === ownerId).reduce((total, row) => total + row.estimate, 0);
	const nextOwnerPoints = destination === 'sprint'
		? currentOwnerPoints + estimate
		: Math.max(0, currentOwnerPoints - issue.estimate);
	const checks = [
		{ key: 'assigned', label: 'Accountable owner selected', passed: destination === 'backlog' || Boolean(owner) },
		{ key: 'team-capacity', label: 'Team remains within forecast capacity', passed: nextPoints <= state.sprint.capacity },
		{ key: 'owner-capacity', label: `${owner?.label || 'Owner'} remains within individual capacity`, passed: destination === 'backlog' || nextOwnerPoints <= (owner?.capacity || 0) },
		{ key: 'dependencies', label: 'No unresolved dependencies', passed: issue.blockers.length === 0 },
	];
	const checksum = checksumFor({
		issueId,
		destination,
		ownerId,
		estimate,
		workspaceRevision: state.revision,
		sprintVersion: state.sprint.version,
		issueVersion: issue.version,
		nextPoints,
	});
	const preview = {
		id: `move-${checksum.slice(-8)}`,
		checksum,
		issueId,
		destination,
		ownerId,
		ownerName: owner?.label || 'Unassigned',
		estimate,
		workspaceRevision: state.revision,
		sprintVersion: state.sprint.version,
		issueVersion: issue.version,
		currentPoints,
		nextPoints,
		capacity: state.sprint.capacity,
		checks,
		blockingChecks: checks.filter((check) => !check.passed).map((check) => check.key),
		createdAt: nowIso(),
	};
	movePreviews.set(checksum, clone(preview));
	return { preview };
}

/**
 * Commits one acknowledged issue move from its exact server preview.
 *
 * @param {string} issueId Stable issue identifier.
 * @param {Record<string, unknown>} input Exact preview checksum and revisions.
 * @returns {Record<string, unknown>} Updated workspace, issue, and move receipt.
 */
export function moveSprintIssue(issueId, input = {}) {
	const issue = findIssue(issueId);
	if (!issue) return notFound('Issue');
	const conflict = exactMutation(issue, input);
	if (conflict) return conflict;
	if (input.acknowledged !== true) return validationError({ acknowledged: ['Acknowledge the exact scope and capacity impact before moving this issue.'] });

	const checksum = normalizeText(input.previewChecksum, 120);
	const preview = movePreviews.get(checksum);
	if (!preview || preview.issueId !== issueId) return validationError({ previewChecksum: ['Preview this move again before committing it.'] });
	if (preview.workspaceRevision !== state.revision || preview.sprintVersion !== state.sprint.version || preview.issueVersion !== issue.version) {
		return conflictError('The sprint changed after this preview. Reload planning and preview the move again.');
	}
	if (preview.blockingChecks.length) return validationError({ previewChecksum: ['Resolve the failed capacity or dependency checks before committing this move.'] });

	const previousBucket = issue.bucket;
	issue.bucket = preview.destination;
	issue.ownerId = preview.ownerId;
	issue.estimate = preview.estimate;
	issue.version += 1;
	state.sprint.version += 1;
	state.revision += 1;
	state.sprint.status = 'planning';
	state.sprint.commitReceipt = null;
	receiptSequence += 1;
	const receipt = {
		id: `scope-${receiptSequence}`,
		type: 'sprint.scope.moved',
		issueId,
		from: previousBucket,
		to: issue.bucket,
		issueVersion: issue.version,
		sprintVersion: state.sprint.version,
		workspaceRevision: state.revision,
		previewChecksum: preview.checksum,
		auditReceipt: `audit:scope-${receiptSequence}`,
		createdAt: nowIso(),
	};
	state.lastMoveReceipt = receipt;
	appendActivity(
		preview.destination === 'sprint' ? `Added ${issue.id} to Cycle 32` : `Returned ${issue.id} to backlog`,
		`${issue.title} · ${issue.estimate} points · ${ownerFor(issue.ownerId)?.label || 'Unassigned'}`,
	);
	movePreviews.delete(checksum);
	planPreviews.clear();
	return { ...serializeWorkspace(), selectedIssueId: issue.id, receipt: clone(receipt) };
}

/**
 * Builds an immutable, server-validated preview of the exact sprint commitment.
 *
 * @param {Record<string, unknown>} input Sprint goal, dates, and exact revisions.
 * @returns {Record<string, unknown>} Exact sprint plan preview or API error.
 */
export function previewSprintPlan(input = {}) {
	const conflict = exactPlanMutation(input);
	if (conflict) return conflict;

	const goal = normalizeText(input.goal, 180);
	const startsOn = normalizeDate(input.startsOn);
	const endsOn = normalizeDate(input.endsOn);
	const fields = {};
	if (goal.length < 18) fields.goal = ['Write a specific sprint goal using at least 18 characters.'];
	if (!startsOn) fields.startsOn = ['Choose a valid sprint start date.'];
	if (!endsOn) fields.endsOn = ['Choose a valid sprint end date.'];
	if (startsOn && endsOn && endsOn <= startsOn) fields.endsOn = ['The sprint must end after it starts.'];
	if (Object.keys(fields).length) return validationError(fields);

	const rows = sprintIssues();
	const points = rows.reduce((total, issue) => total + issue.estimate, 0);
	const unassigned = rows.filter((issue) => !ownerFor(issue.ownerId));
	const blocked = rows.filter((issue) => issue.blockers.length);
	const ownerCapacity = capacityRows();
	const checks = [
		{ key: 'goal', label: 'Sprint goal is specific', passed: goal.length >= 18, detail: goal },
		{ key: 'scope', label: 'Sprint contains a viable scope', passed: rows.length >= 4, detail: `${rows.length} issues · ${points} points` },
		{ key: 'team-capacity', label: 'Team scope fits forecast capacity', passed: points <= state.sprint.capacity, detail: `${points} of ${state.sprint.capacity} points` },
		{ key: 'owner-capacity', label: 'Each owner remains within capacity', passed: ownerCapacity.every((owner) => owner.planned <= owner.capacity), detail: ownerCapacity.map((owner) => `${owner.name} ${owner.planned}/${owner.capacity}`).join(' · ') },
		{ key: 'ownership', label: 'Every issue has an accountable owner', passed: unassigned.length === 0, detail: unassigned.length ? unassigned.map((issue) => issue.id).join(', ') : 'All issues assigned' },
		{ key: 'dependencies', label: 'No unresolved dependencies', passed: blocked.length === 0, detail: blocked.length ? blocked.map((issue) => issue.id).join(', ') : 'All dependencies clear' },
	];
	const checksum = checksumFor({
		goal,
		startsOn,
		endsOn,
		issueVersions: rows.map((issue) => [issue.id, issue.version]),
		workspaceRevision: state.revision,
		sprintVersion: state.sprint.version,
	});
	const preview = {
		id: `plan-${checksum.slice(-8)}`,
		checksum,
		goal,
		startsOn,
		endsOn,
		workspaceRevision: state.revision,
		sprintVersion: state.sprint.version,
		issueCount: rows.length,
		points,
		capacity: state.sprint.capacity,
		checks,
		blockingChecks: checks.filter((check) => !check.passed).map((check) => check.key),
		issueIds: rows.map((issue) => issue.id),
		createdAt: nowIso(),
	};
	planPreviews.set(checksum, clone(preview));
	return { preview };
}

/**
 * Commits an acknowledged sprint from one exact, passing plan preview.
 *
 * @param {Record<string, unknown>} input Exact preview checksum and revisions.
 * @returns {Record<string, unknown>} Updated workspace and immutable commitment receipt.
 */
export function commitSprintPlan(input = {}) {
	const conflict = exactPlanMutation(input);
	if (conflict) return conflict;
	if (input.acknowledged !== true) return validationError({ acknowledged: ['Acknowledge the goal, scope, dates, ownership, and capacity before committing.'] });

	const checksum = normalizeText(input.previewChecksum, 120);
	const preview = planPreviews.get(checksum);
	if (!preview) return validationError({ previewChecksum: ['Generate the exact sprint review again before committing.'] });
	if (preview.workspaceRevision !== state.revision || preview.sprintVersion !== state.sprint.version) {
		return conflictError('The sprint changed after this review. Reload planning and generate another exact review.');
	}
	if (preview.blockingChecks.length) return validationError({ previewChecksum: ['Resolve every failed sprint readiness check before committing.'] });

	state.sprint.goal = preview.goal;
	state.sprint.startsOn = preview.startsOn;
	state.sprint.endsOn = preview.endsOn;
	state.sprint.status = 'committed';
	state.sprint.version += 1;
	state.revision += 1;
	receiptSequence += 1;
	const receipt = {
		id: `sprint-${receiptSequence}`,
		type: 'sprint.committed',
		sprintId: state.sprint.id,
		sprintVersion: state.sprint.version,
		workspaceRevision: state.revision,
		planChecksum: preview.checksum,
		issueIds: [...preview.issueIds],
		points: preview.points,
		auditReceipt: `audit:sprint-${receiptSequence}`,
		calendarReceipt: `calendar:cycle-32-${receiptSequence}`,
		createdAt: nowIso(),
	};
	state.sprint.commitReceipt = receipt;
	appendActivity('Committed Cycle 32', `${preview.issueCount} issues · ${preview.points} points · ${preview.startsOn} to ${preview.endsOn}`);
	planPreviews.delete(checksum);
	return { ...serializeWorkspace(), receipt: clone(receipt) };
}

/**
 * Restores the deterministic sprint-planning demonstration state.
 *
 * @returns {Record<string, unknown>} Reset sprint-planning workspace.
 */
export function resetSprintPlanningWorkspace() {
	state = createInitialState();
	movePreviews.clear();
	planPreviews.clear();
	return serializeWorkspace();
}

/**
 * Creates the deterministic planning workspace used by the repository-local API.
 *
 * @returns {Record<string, unknown>} Mutable process-local demonstration state.
 */
function createInitialState() {
	return {
		revision: 12,
		selectedIssueId: 'DES-238',
		sprint: {
			id: 'cycle_32',
			name: 'Cycle 32',
			version: 4,
			status: 'planning',
			goal: 'Make workspace administration safer and easier to understand.',
			startsOn: '2026-08-04',
			endsOn: '2026-08-17',
			capacity: 28,
			velocity: [24, 27, 25],
			commitReceipt: null,
		},
		issues: [
			{ id: 'PLAT-508', version: 3, title: 'Make invitation approvals policy-aware', description: 'Apply domain, role, and seat rules before workspace invitations are accepted.', bucket: 'sprint', priority: 'urgent', ownerId: 'maya', estimate: 5, project: 'Workspace trust', labels: ['Admin', 'Security'], blockers: [], confidence: 86 },
			{ id: 'PLAT-511', version: 2, title: 'Make payment retries idempotent', description: 'Prevent duplicate recovery charges when the provider retries a delayed webhook.', bucket: 'sprint', priority: 'high', ownerId: 'jon', estimate: 3, project: 'Billing reliability', labels: ['Billing', 'API'], blockers: [], confidence: 91 },
			{ id: 'DES-232', version: 5, title: 'Confirm compact navigation focus order', description: 'Ship a keyboard and screen-reader pass for the responsive application shell.', bucket: 'sprint', priority: 'high', ownerId: 'ari', estimate: 3, project: 'Mobile shell', labels: ['Accessibility', 'Mobile'], blockers: [], confidence: 88 },
			{ id: 'GROW-196', version: 2, title: 'Instrument invite activation funnel', description: 'Capture accepted, approved, and first-session events with stable attribution.', bucket: 'sprint', priority: 'medium', ownerId: 'sam', estimate: 5, project: 'Activation', labels: ['Growth', 'Analytics'], blockers: [], confidence: 78 },
			{ id: 'DES-238', version: 1, title: 'Clarify usage alert threshold states', description: 'Distinguish estimated, approaching, and exceeded limits in account settings.', bucket: 'backlog', priority: 'high', ownerId: 'ari', estimate: 2, project: 'Usage controls', labels: ['Design', 'Billing'], blockers: [], confidence: 92 },
			{ id: 'GROW-201', version: 1, title: 'Add annual plan comparison evidence', description: 'Bring savings, renewal timing, and invoice details into the upgrade decision.', bucket: 'backlog', priority: 'medium', ownerId: 'maya', estimate: 3, project: 'Packaging', labels: ['Growth', 'Billing'], blockers: [], confidence: 84 },
			{ id: 'PLAT-519', version: 2, title: 'Rotate staging signing certificate', description: 'Replace the expiring certificate and prove webhook delivery in every region.', bucket: 'backlog', priority: 'urgent', ownerId: 'jon', estimate: 5, project: 'Infrastructure', labels: ['Security', 'Release'], blockers: ['Security approval'], confidence: 61 },
			{ id: 'PLAT-524', version: 1, title: 'Backfill organization audit events', description: 'Restore missing organization events for imports created before the current schema.', bucket: 'backlog', priority: 'low', ownerId: '', estimate: 8, project: 'Enterprise controls', labels: ['Audit', 'Data'], blockers: ['Migration dry run'], confidence: 48 },
		],
		activity: [
			{ id: 'activity_903', title: 'Capacity forecast refreshed', detail: 'Cycle capacity moved from 27 to 28 points using the last three completed cycles.', actor: 'Planning service', time: '12m' },
			{ id: 'activity_902', title: 'Scoped PLAT-511', detail: 'Jon Bell estimated the retry work at 3 points and cleared the provider dependency.', actor: 'Jon Bell', time: '41m' },
			{ id: 'activity_901', title: 'Planning opened', detail: 'Maya Chen opened Cycle 32 for product-team planning.', actor: 'Maya Chen', time: 'Today' },
		],
		lastMoveReceipt: null,
	};
}

/**
 * Serializes state with derived scope, capacity, and catalog evidence.
 *
 * @returns {Record<string, unknown>} Display-ready planning workspace.
 */
function serializeWorkspace() {
	const sprintRows = sprintIssues().map((issue) => serializeIssue(issue));
	const backlogRows = state.issues.filter((issue) => issue.bucket === 'backlog').map((issue) => serializeIssue(issue));
	const points = sprintRows.reduce((total, issue) => total + issue.estimate, 0);
	return {
		workspace: {
			revision: state.revision,
			name: 'Northstar',
			operator: clone(currentOperator),
			selectedIssueId: state.selectedIssueId,
		},
		catalog: clone(catalog),
		sprint: {
			...clone(state.sprint),
			issueCount: sprintRows.length,
			points,
			remaining: state.sprint.capacity - points,
			capacityPercent: Math.round((points / state.sprint.capacity) * 100),
			issues: sprintRows,
			capacityRows: capacityRows(),
		},
		backlog: backlogRows,
		activity: clone(state.activity),
		lastMoveReceipt: clone(state.lastMoveReceipt),
	};
}

/**
 * Returns active sprint issues in stable source order.
 *
 * @returns {Array<Record<string, unknown>>} Active sprint issues.
 */
function sprintIssues() {
	return state.issues.filter((issue) => issue.bucket === 'sprint');
}

/**
 * Builds display-ready per-owner capacity evidence.
 *
 * @returns {Array<Record<string, unknown>>} Capacity rows for each owner.
 */
function capacityRows() {
	return catalog.owners.map((owner) => {
		const planned = sprintIssues().filter((issue) => issue.ownerId === owner.value).reduce((total, issue) => total + issue.estimate, 0);
		return {
			id: owner.value,
			name: owner.label,
			initials: owner.initials,
			capacity: owner.capacity,
			planned,
			percent: Math.round((planned / owner.capacity) * 100),
			remaining: owner.capacity - planned,
		};
	});
}

/**
 * Adds owner labels and display metadata to one issue.
 *
 * @param {Record<string, unknown>} issue Source issue.
 * @returns {Record<string, unknown>} Display-ready issue.
 */
function serializeIssue(issue) {
	const owner = ownerFor(issue.ownerId);
	return {
		...clone(issue),
		ownerName: owner?.label || 'Unassigned',
		ownerInitials: owner?.initials || '—',
		priorityLabel: issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1),
		readiness: issue.blockers.length ? 'blocked' : issue.ownerId ? 'ready' : 'unassigned',
	};
}

/**
 * Validates exact workspace, sprint, and issue versions for an issue mutation.
 *
 * @param {Record<string, unknown>} issue Current issue record.
 * @param {Record<string, unknown>} input Mutation concurrency values.
 * @returns {Record<string, unknown> | null} Conflict response when stale.
 */
function exactMutation(issue, input) {
	if (Number(input.workspaceRevision) !== state.revision) return conflictError(`Workspace revision changed to ${state.revision}. Reload planning.`);
	if (Number(input.sprintVersion) !== state.sprint.version) return conflictError(`Sprint version changed to ${state.sprint.version}. Reload Cycle 32.`);
	if (Number(input.issueVersion) !== issue.version) return conflictError(`${issue.id} changed to version ${issue.version}. Reload the issue.`);
	return null;
}

/**
 * Validates exact workspace and sprint versions for a plan mutation.
 *
 * @param {Record<string, unknown>} input Mutation concurrency values.
 * @returns {Record<string, unknown> | null} Conflict response when stale.
 */
function exactPlanMutation(input) {
	if (Number(input.workspaceRevision) !== state.revision) return conflictError(`Workspace revision changed to ${state.revision}. Reload planning.`);
	if (Number(input.sprintVersion) !== state.sprint.version) return conflictError(`Sprint version changed to ${state.sprint.version}. Reload Cycle 32.`);
	return null;
}

/**
 * Adds one immutable planning activity entry.
 *
 * @param {string} title Activity title.
 * @param {string} detail Activity detail.
 * @returns {void}
 */
function appendActivity(title, detail) {
	activitySequence += 1;
	state.activity.unshift({ id: `activity_${activitySequence}`, title, detail, actor: currentOperator.name, time: 'Just now' });
}

/**
 * Finds one issue by stable identifier.
 *
 * @param {string} issueId Stable issue identifier.
 * @returns {Record<string, unknown> | null} Matching issue or null.
 */
function findIssue(issueId) {
	return state.issues.find((issue) => issue.id === issueId) || null;
}

/**
 * Finds one owner catalog entry by stable identifier.
 *
 * @param {string} ownerId Stable owner identifier.
 * @returns {Record<string, unknown> | null} Matching owner or null.
 */
function ownerFor(ownerId) {
	return catalog.owners.find((owner) => owner.value === ownerId) || null;
}

/**
 * Normalizes a bounded single-line text value.
 *
 * @param {unknown} value Untrusted value.
 * @param {number} maxLength Maximum returned length.
 * @returns {string} Normalized text.
 */
function normalizeText(value, maxLength) {
	return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

/**
 * Normalizes a date-only string or returns an empty string.
 *
 * @param {unknown} value Untrusted date value.
 * @returns {string} ISO date-only value or an empty string.
 */
function normalizeDate(value) {
	const date = normalizeText(value, 10);
	return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

/**
 * Returns the current ISO timestamp.
 *
 * @returns {string} ISO timestamp.
 */
function nowIso() {
	return new Date().toISOString();
}

/**
 * Creates a deterministic checksum for an exact preview payload.
 *
 * @param {unknown} value Serializable value.
 * @returns {string} Demonstration checksum.
 */
function checksumFor(value) {
	const source = JSON.stringify(value);
	let hash = 2166136261;
	for (let index = 0; index < source.length; index += 1) {
		hash ^= source.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return `sha256:demo-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Creates a JSON-safe clone.
 *
 * @param {unknown} value Serializable value.
 * @returns {unknown} Cloned value.
 */
function clone(value) {
	if (value == null) return value;
	return JSON.parse(JSON.stringify(value));
}

/**
 * Creates a structured validation response.
 *
 * @param {Record<string, string[]>} fields Field-level validation messages.
 * @returns {Record<string, unknown>} Validation response.
 */
function validationError(fields) {
	return { error: 'validation_failed', status: 422, message: 'Review the highlighted sprint-planning fields.', fields };
}

/**
 * Creates an optimistic-concurrency response.
 *
 * @param {string} message Conflict explanation.
 * @returns {Record<string, unknown>} Conflict response.
 */
function conflictError(message) {
	return { error: 'revision_conflict', status: 409, message };
}

/**
 * Creates a not-found response.
 *
 * @param {string} resource Resource label.
 * @returns {Record<string, unknown>} Not-found response.
 */
function notFound(resource) {
	return { error: 'not_found', status: 404, message: `${resource} was not found.` };
}
