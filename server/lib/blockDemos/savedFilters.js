const catalog = Object.freeze({
	matchModes: [
		{ value: 'all', label: 'Match every filter', description: 'Only include work that satisfies every condition.' },
		{ value: 'any', label: 'Match any filter', description: 'Include work that satisfies at least one condition.' },
	],
	visibility: [
		{ value: 'personal', label: 'Personal view', description: 'Only the owner can open or change this view.' },
		{ value: 'workspace', label: 'Workspace view', description: 'Every workspace member can discover this view.' },
		{ value: 'teams', label: 'Selected teams', description: 'Only members of the selected teams can discover this view.' },
	],
	alerts: [
		{ value: 'none', label: 'No notifications', description: 'Keep the view available without sending updates.' },
		{ value: 'added', label: 'When work enters', description: 'Notify subscribers when an issue starts matching.' },
		{ value: 'completed', label: 'When work completes', description: 'Notify subscribers when matching work is completed.' },
		{ value: 'both', label: 'Enters or completes', description: 'Notify subscribers for both changes.' },
	],
	teams: [
		{ value: 'platform', label: 'Platform', description: 'Core platform and infrastructure.' },
		{ value: 'growth', label: 'Growth', description: 'Acquisition and activation.' },
		{ value: 'design', label: 'Design systems', description: 'Product design and interface systems.' },
	],
	fields: [
		{
			value: 'team',
			label: 'Team',
			description: 'The team responsible for the issue.',
			operators: [
				{ value: 'is_any_of', label: 'is any of' },
				{ value: 'is_not', label: 'is not' },
			],
			values: [
				{ value: 'platform', label: 'Platform' },
				{ value: 'growth', label: 'Growth' },
				{ value: 'design', label: 'Design systems' },
			],
		},
		{
			value: 'status',
			label: 'Status',
			description: 'The current workflow state.',
			operators: [
				{ value: 'is_any_of', label: 'is any of' },
				{ value: 'is_not', label: 'is not' },
			],
			values: [
				{ value: 'backlog', label: 'Backlog' },
				{ value: 'todo', label: 'Todo' },
				{ value: 'in_progress', label: 'In progress' },
				{ value: 'blocked', label: 'Blocked' },
				{ value: 'done', label: 'Done' },
			],
		},
		{
			value: 'priority',
			label: 'Priority',
			description: 'The issue urgency.',
			operators: [
				{ value: 'is_any_of', label: 'is any of' },
				{ value: 'is_not', label: 'is not' },
			],
			values: [
				{ value: 'urgent', label: 'Urgent' },
				{ value: 'high', label: 'High' },
				{ value: 'medium', label: 'Medium' },
				{ value: 'low', label: 'Low' },
			],
		},
		{
			value: 'assignee',
			label: 'Assignee',
			description: 'The person responsible for the issue.',
			operators: [
				{ value: 'is_any_of', label: 'is any of' },
				{ value: 'is_not', label: 'is not' },
			],
			values: [
				{ value: 'maya', label: 'Maya Chen' },
				{ value: 'jon', label: 'Jon Bell' },
				{ value: 'ari', label: 'Ari Grant' },
				{ value: 'unassigned', label: 'Unassigned' },
			],
		},
		{
			value: 'labels',
			label: 'Label',
			description: 'Workspace labels attached to the issue.',
			operators: [
				{ value: 'includes_any', label: 'includes any' },
				{ value: 'includes_all', label: 'includes all' },
				{ value: 'includes_none', label: 'includes none' },
			],
			values: [
				{ value: 'launch', label: 'Launch' },
				{ value: 'customer', label: 'Customer' },
				{ value: 'billing', label: 'Billing' },
				{ value: 'security', label: 'Security' },
				{ value: 'mobile', label: 'Mobile' },
			],
		},
		{
			value: 'cycle',
			label: 'Cycle',
			description: 'The planning cycle containing the issue.',
			operators: [
				{ value: 'is_any_of', label: 'is any of' },
				{ value: 'is_not', label: 'is not' },
			],
			values: [
				{ value: 'cycle_31', label: 'Cycle 31' },
				{ value: 'cycle_32', label: 'Cycle 32' },
				{ value: 'no_cycle', label: 'No cycle' },
			],
		},
		{
			value: 'due',
			label: 'Due date',
			description: 'A relative due-date window.',
			operators: [
				{ value: 'is_any_of', label: 'is any of' },
				{ value: 'is_not', label: 'is not' },
			],
			values: [
				{ value: 'overdue', label: 'Overdue' },
				{ value: 'this_week', label: 'This week' },
				{ value: 'next_week', label: 'Next week' },
				{ value: 'none', label: 'No due date' },
			],
		},
	],
});

const currentOperator = Object.freeze({
	id: 'maya',
	name: 'Maya Chen',
	initials: 'MC',
	role: 'Product operations',
});

const issues = Object.freeze([
	{ id: 'PLAT-482', title: 'Make payment retries idempotent', team: 'platform', status: 'in_progress', priority: 'urgent', assignee: 'maya', labels: ['launch', 'billing'], cycle: 'cycle_31', due: 'overdue', project: 'Billing reliability', estimate: 5, updated: '8m' },
	{ id: 'PLAT-477', title: 'Trace regional webhook delivery gaps', team: 'platform', status: 'blocked', priority: 'high', assignee: 'jon', labels: ['launch', 'customer'], cycle: 'cycle_31', due: 'this_week', project: 'Launch readiness', estimate: 3, updated: '24m' },
	{ id: 'DES-219', title: 'Confirm mobile navigation focus order', team: 'design', status: 'todo', priority: 'high', assignee: 'ari', labels: ['launch', 'mobile'], cycle: 'cycle_31', due: 'this_week', project: 'Mobile shell', estimate: 2, updated: '42m' },
	{ id: 'GROW-188', title: 'Instrument workspace invite conversion', team: 'growth', status: 'in_progress', priority: 'high', assignee: 'maya', labels: ['launch', 'customer'], cycle: 'cycle_31', due: 'next_week', project: 'Activation', estimate: 3, updated: '1h' },
	{ id: 'PLAT-463', title: 'Rotate staging signing certificate', team: 'platform', status: 'todo', priority: 'medium', assignee: 'jon', labels: ['security'], cycle: 'cycle_31', due: 'this_week', project: 'Infrastructure', estimate: 2, updated: '2h' },
	{ id: 'DES-211', title: 'Document table density tokens', team: 'design', status: 'backlog', priority: 'medium', assignee: 'ari', labels: ['customer'], cycle: 'cycle_32', due: 'none', project: 'Design system', estimate: 3, updated: 'Yesterday' },
	{ id: 'GROW-176', title: 'Ship upgrade intent score', team: 'growth', status: 'todo', priority: 'urgent', assignee: 'unassigned', labels: ['billing', 'customer'], cycle: 'cycle_32', due: 'next_week', project: 'Expansion', estimate: 5, updated: 'Yesterday' },
	{ id: 'PLAT-451', title: 'Add audit export pagination', team: 'platform', status: 'done', priority: 'high', assignee: 'maya', labels: ['security', 'customer'], cycle: 'cycle_31', due: 'none', project: 'Enterprise controls', estimate: 3, updated: 'Mon' },
	{ id: 'DES-204', title: 'Prototype compact command results', team: 'design', status: 'in_progress', priority: 'low', assignee: 'ari', labels: ['mobile'], cycle: 'cycle_32', due: 'next_week', project: 'Navigation', estimate: 2, updated: 'Mon' },
	{ id: 'GROW-164', title: 'Localize activation checklist', team: 'growth', status: 'blocked', priority: 'medium', assignee: 'jon', labels: ['customer'], cycle: 'no_cycle', due: 'overdue', project: 'International growth', estimate: 5, updated: 'Fri' },
	{ id: 'PLAT-439', title: 'Reduce session refresh contention', team: 'platform', status: 'backlog', priority: 'low', assignee: 'unassigned', labels: ['security'], cycle: 'no_cycle', due: 'none', project: 'Authentication', estimate: 8, updated: 'Jun 10' },
	{ id: 'GROW-151', title: 'Add annual-plan comparison copy', team: 'growth', status: 'done', priority: 'medium', assignee: 'maya', labels: ['billing'], cycle: 'cycle_31', due: 'none', project: 'Packaging', estimate: 2, updated: 'Jun 08' },
]);

let viewSequence = 730;
let eventSequence = 1700;
let receiptSequence = 8800;
let state = createInitialState();
const previews = new Map();

/**
 * Returns the saved-view workspace with compact summaries and filter catalogs.
 *
 * @returns {Record<string, unknown>} Serialized saved-view workspace.
 */
export function getSavedFiltersWorkspace() {
	return serializeWorkspace();
}

/**
 * Returns one complete saved view and its currently evaluated issue results.
 *
 * @param {string} viewId Stable saved-view identifier.
 * @returns {Record<string, unknown>} View detail payload or API error.
 */
export function getSavedFilter(viewId) {
	const view = findView(viewId);
	if (!view) return notFound('Saved view');
	return {
		workspaceRevision: state.revision,
		view: serializeView(view),
		preview: evaluateDraft(view),
	};
}

/**
 * Evaluates a draft against the issue dataset and locks its exact save payload.
 *
 * @param {string} viewId Existing view identifier or the reserved new identifier.
 * @param {Record<string, unknown>} input Draft and optimistic concurrency values.
 * @returns {Record<string, unknown>} Immutable query preview or API error.
 */
export function previewSavedFilter(viewId, input = {}) {
	const view = viewId === 'new' ? null : findView(viewId);
	if (viewId !== 'new' && !view) return notFound('Saved view');
	const conflict = exactMutation(view, input);
	if (conflict) return conflict;

	const draft = normalizeDraft(input.draft);
	const fieldErrors = validateDraft(draft);
	if (Object.keys(fieldErrors).length) return validationError(fieldErrors);

	const evaluation = evaluateDraft(draft);
	const checksum = checksumFor({
		viewId,
		workspaceRevision: state.revision,
		viewVersion: view?.version || 0,
		draft,
		evaluation: { count: evaluation.count, issueIds: evaluation.rows.map((row) => row.id) },
	});
	const preview = {
		id: `preview-${checksum.slice(-8)}`,
		checksum,
		viewId,
		workspaceRevision: state.revision,
		viewVersion: view?.version || 0,
		draft,
		...evaluation,
		createdAt: nowIso(),
		qualityChecks: qualityChecks(draft, evaluation),
	};
	previews.set(checksum, clone(preview));
	return { preview };
}

/**
 * Saves an existing view or creates a new view from an acknowledged exact preview.
 *
 * @param {string} viewId Existing view identifier or the reserved new identifier.
 * @param {Record<string, unknown>} input Exact preview checksum and concurrency values.
 * @returns {Record<string, unknown>} Updated workspace, view, preview, and audit receipt.
 */
export function saveSavedFilter(viewId, input = {}) {
	const existingView = viewId === 'new' ? null : findView(viewId);
	if (viewId !== 'new' && !existingView) return notFound('Saved view');
	const conflict = exactMutation(existingView, input);
	if (conflict) return conflict;
	if (input.acknowledged !== true) return validationError({ acknowledged: ['Acknowledge the exact query, audience, and notification behavior before saving.'] });

	const checksum = normalizeText(input.previewChecksum, 120);
	const preview = previews.get(checksum);
	if (!preview || preview.viewId !== viewId) return validationError({ previewChecksum: ['Preview these changes again before saving.'] });
	if (preview.workspaceRevision !== state.revision || preview.viewVersion !== (existingView?.version || 0)) {
		return conflictError('The view changed after this preview. Reload it and preview again.');
	}

	let view = existingView;
	const created = !view;
	if (!view) {
		viewSequence += 1;
		view = {
			id: `view_${viewSequence}`,
			version: 0,
			ownerId: currentOperator.id,
			favorite: true,
			activity: [],
		};
		state.views.unshift(view);
	}
	Object.assign(view, clone(preview.draft));
	view.version += 1;
	view.updatedAt = nowIso();
	view.updatedLabel = 'Just now';
	appendViewActivity(view, created ? 'Created saved view' : 'Saved query changes', `${preview.count} matching issues · ${visibilityLabel(view)}`);
	state.revision += 1;
	state.selectedViewId = view.id;
	receiptSequence += 1;
	const receipt = {
		id: `view-save-${receiptSequence}`,
		type: created ? 'view.created' : 'view.updated',
		viewId: view.id,
		viewVersion: view.version,
		workspaceRevision: state.revision,
		queryChecksum: preview.checksum,
		auditReceipt: `audit:view-${receiptSequence}`,
		subscriptionReceipt: view.alertMode === 'none' ? null : `notify:view-${receiptSequence}`,
		createdAt: nowIso(),
	};
	state.lastReceipt = receipt;
	previews.delete(checksum);

	return {
		...serializeWorkspace(),
		selectedViewId: view.id,
		view: serializeView(view),
		preview: evaluateDraft(view),
		receipt: clone(receipt),
	};
}

/**
 * Toggles whether a saved view appears in the operator's favorite navigation.
 *
 * @param {string} viewId Stable saved-view identifier.
 * @param {Record<string, unknown>} input Exact workspace and view revisions.
 * @returns {Record<string, unknown>} Updated workspace and view.
 */
export function toggleSavedFilterFavorite(viewId, input = {}) {
	const view = findView(viewId);
	if (!view) return notFound('Saved view');
	const conflict = exactMutation(view, input);
	if (conflict) return conflict;
	view.favorite = input.favorite === true;
	view.version += 1;
	view.updatedAt = nowIso();
	view.updatedLabel = 'Just now';
	appendViewActivity(view, view.favorite ? 'Added to favorites' : 'Removed from favorites', 'Personal navigation preference updated.');
	state.revision += 1;
	state.selectedViewId = view.id;
	return {
		...serializeWorkspace(),
		selectedViewId: view.id,
		view: serializeView(view),
		preview: evaluateDraft(view),
	};
}

/**
 * Restores the deterministic saved-filter demonstration state.
 *
 * @returns {Record<string, unknown>} Reset workspace.
 */
export function resetSavedFiltersWorkspace() {
	state = createInitialState();
	previews.clear();
	return serializeWorkspace();
}

/**
 * Creates the seeded saved-view workspace.
 *
 * @returns {Record<string, unknown>} Mutable process-local state.
 */
function createInitialState() {
	return {
		revision: 23,
		selectedViewId: 'view_launch_risk',
		lastReceipt: null,
		views: [
			{
				id: 'view_launch_risk',
				version: 5,
				name: 'Launch risks',
				description: 'Urgent and high-priority launch work that has not reached Done.',
				ownerId: 'maya',
				visibility: 'workspace',
				teamIds: [],
				matchMode: 'all',
				alertMode: 'added',
				favorite: true,
				rules: [
					{ id: 'rule_priority', field: 'priority', operator: 'is_any_of', values: ['urgent', 'high'] },
					{ id: 'rule_status', field: 'status', operator: 'is_not', values: ['done'] },
					{ id: 'rule_label', field: 'labels', operator: 'includes_any', values: ['launch'] },
				],
				updatedAt: '2026-08-02T09:42:00.000Z',
				updatedLabel: '18m',
				activity: [
					{ id: 'event_1701', title: 'Raised priority threshold', detail: 'The view now includes urgent and high-priority work.', actor: 'Maya Chen', time: '18m' },
					{ id: 'event_1700', title: 'Shared with workspace', detail: 'The view became discoverable to all workspace members.', actor: 'Maya Chen', time: 'Yesterday' },
				],
			},
			{
				id: 'view_unassigned_cycle',
				version: 3,
				name: 'Unassigned this cycle',
				description: 'Current-cycle issues that still need an owner.',
				ownerId: 'jon',
				visibility: 'teams',
				teamIds: ['platform', 'growth'],
				matchMode: 'all',
				alertMode: 'added',
				favorite: true,
				rules: [
					{ id: 'rule_cycle', field: 'cycle', operator: 'is_any_of', values: ['cycle_31', 'cycle_32'] },
					{ id: 'rule_owner', field: 'assignee', operator: 'is_any_of', values: ['unassigned'] },
				],
				updatedAt: '2026-08-01T14:18:00.000Z',
				updatedLabel: 'Yesterday',
				activity: [
					{ id: 'event_1694', title: 'Added Growth team', detail: 'Growth members can now discover the view.', actor: 'Jon Bell', time: 'Yesterday' },
				],
			},
			{
				id: 'view_customer_blockers',
				version: 2,
				name: 'Customer blockers',
				description: 'Blocked customer-facing work across active teams.',
				ownerId: 'ari',
				visibility: 'personal',
				teamIds: [],
				matchMode: 'all',
				alertMode: 'none',
				favorite: false,
				rules: [
					{ id: 'rule_blocked', field: 'status', operator: 'is_any_of', values: ['blocked'] },
					{ id: 'rule_customer', field: 'labels', operator: 'includes_any', values: ['customer'] },
				],
				updatedAt: '2026-07-30T11:06:00.000Z',
				updatedLabel: 'Jul 30',
				activity: [
					{ id: 'event_1687', title: 'Created private view', detail: 'Only Ari Grant can discover this view.', actor: 'Ari Grant', time: 'Jul 30' },
				],
			},
		],
	};
}

/**
 * Serializes workspace navigation, catalogs, counts, and the latest receipt.
 *
 * @returns {Record<string, unknown>} Public workspace payload.
 */
function serializeWorkspace() {
	const summaries = state.views.map((view) => serializeViewSummary(view));
	return {
		workspace: {
			name: 'Northstar Product',
			revision: state.revision,
			selectedViewId: state.selectedViewId,
			operator: currentOperator,
			counts: {
				total: summaries.length,
				favorites: summaries.filter((view) => view.favorite).length,
				shared: summaries.filter((view) => view.visibility !== 'personal').length,
			},
		},
		views: summaries,
		catalog,
		lastReceipt: clone(state.lastReceipt),
	};
}

/**
 * Serializes one compact view for the navigation rail.
 *
 * @param {Record<string, unknown>} view Saved view record.
 * @returns {Record<string, unknown>} Navigation summary.
 */
function serializeViewSummary(view) {
	const evaluation = evaluateDraft(view);
	return {
		id: view.id,
		version: view.version,
		name: view.name,
		description: view.description,
		ownerId: view.ownerId,
		ownerName: personName(view.ownerId),
		visibility: view.visibility,
		visibilityLabel: visibilityLabel(view),
		favorite: view.favorite,
		updatedLabel: view.updatedLabel,
		matchCount: evaluation.count,
		alertMode: view.alertMode,
	};
}

/**
 * Serializes one complete saved view.
 *
 * @param {Record<string, unknown>} view Saved view record.
 * @returns {Record<string, unknown>} Complete public view.
 */
function serializeView(view) {
	return {
		...clone(view),
		ownerName: personName(view.ownerId),
		visibilityLabel: visibilityLabel(view),
		shareUrl: `/northstar/views/${view.id}`,
		capabilities: {
			canEdit: view.ownerId === currentOperator.id || view.visibility !== 'personal',
			canShare: view.ownerId === currentOperator.id,
		},
	};
}

/**
 * Normalizes client-owned draft values into the API query grammar.
 *
 * @param {Record<string, unknown>} input Untrusted draft input.
 * @returns {Record<string, unknown>} Normalized draft.
 */
function normalizeDraft(input = {}) {
	const rules = Array.isArray(input.rules) ? input.rules.slice(0, 8).map((rule, index) => ({
		id: normalizeText(rule?.id, 80) || `rule_${index + 1}`,
		field: normalizeText(rule?.field, 40),
		operator: normalizeText(rule?.operator, 40),
		values: Array.isArray(rule?.values) ? [...new Set(rule.values.map((value) => normalizeText(value, 80)).filter(Boolean))].slice(0, 8) : [],
	})) : [];
	return {
		name: normalizeText(input.name, 80),
		description: normalizeText(input.description, 240),
		ownerId: currentOperator.id,
		visibility: normalizeText(input.visibility, 30),
		teamIds: Array.isArray(input.teamIds) ? [...new Set(input.teamIds.map((value) => normalizeText(value, 40)).filter(Boolean))].slice(0, 6) : [],
		matchMode: normalizeText(input.matchMode, 20),
		alertMode: normalizeText(input.alertMode, 30),
		favorite: input.favorite === true,
		rules,
	};
}

/**
 * Validates a saved-view draft against server-owned fields and permissions.
 *
 * @param {Record<string, unknown>} draft Normalized saved-view draft.
 * @returns {Record<string, string[]>} Field-level validation errors.
 */
function validateDraft(draft) {
	const fieldErrors = {};
	if (draft.name.length < 4) fieldErrors.name = ['Give the view a name of at least 4 characters.'];
	if (draft.description.length < 12) fieldErrors.description = ['Describe what belongs in this view using at least 12 characters.'];
	if (!catalog.visibility.some((option) => option.value === draft.visibility)) fieldErrors.visibility = ['Choose who can discover this view.'];
	if (!catalog.matchModes.some((option) => option.value === draft.matchMode)) fieldErrors.matchMode = ['Choose how filter conditions combine.'];
	if (!catalog.alerts.some((option) => option.value === draft.alertMode)) fieldErrors.alertMode = ['Choose a supported notification behavior.'];
	if (!draft.rules.length) fieldErrors.rules = ['Add at least one filter condition.'];
	if (draft.rules.length > 6) fieldErrors.rules = ['Use at most 6 conditions in this demonstration view.'];
	if (draft.visibility === 'teams' && !draft.teamIds.length) fieldErrors.teamIds = ['Choose at least one team for a team-scoped view.'];
	if (draft.visibility !== 'teams' && draft.teamIds.length) fieldErrors.teamIds = ['Team access can only be set on a selected-teams view.'];
	if (draft.visibility === 'personal' && draft.alertMode !== 'none') fieldErrors.alertMode = ['Personal views do not publish workspace notifications.'];
	if (draft.teamIds.some((teamId) => !catalog.teams.some((team) => team.value === teamId))) fieldErrors.teamIds = ['Choose teams that exist in this workspace.'];

	for (const [index, rule] of draft.rules.entries()) {
		const field = fieldFor(rule.field);
		if (!field) {
			fieldErrors[`rules.${index}.field`] = ['Choose an available filter field.'];
			continue;
		}
		if (!field.operators.some((operator) => operator.value === rule.operator)) fieldErrors[`rules.${index}.operator`] = ['Choose an operator supported by this field.'];
		if (!rule.values.length) fieldErrors[`rules.${index}.values`] = ['Choose at least one value.'];
		if (rule.values.some((value) => !field.values.some((option) => option.value === value))) fieldErrors[`rules.${index}.values`] = ['Choose values supported by this field.'];
	}
	return fieldErrors;
}

/**
 * Evaluates a saved-view draft and returns query evidence and matching issues.
 *
 * @param {Record<string, unknown>} draft Saved view or normalized draft.
 * @returns {Record<string, unknown>} Query preview.
 */
function evaluateDraft(draft) {
	const normalizedRules = Array.isArray(draft.rules) ? draft.rules : [];
	const rows = issues.filter((issue) => {
		if (!normalizedRules.length) return true;
		const results = normalizedRules.map((rule) => matchesRule(issue, rule));
		return draft.matchMode === 'any' ? results.some(Boolean) : results.every(Boolean);
	}).map((issue) => serializeIssue(issue));
	const points = rows.reduce((total, issue) => total + issue.estimate, 0);
	return {
		count: rows.length,
		points,
		query: queryFor(draft),
		queryCost: normalizedRules.length > 4 ? 'moderate' : 'low',
		rows,
		statusCounts: countBy(rows, 'status'),
	};
}

/**
 * Checks whether one issue satisfies one normalized filter rule.
 *
 * @param {Record<string, unknown>} issue Source issue.
 * @param {Record<string, unknown>} rule Filter condition.
 * @returns {boolean} Whether the issue matches.
 */
function matchesRule(issue, rule) {
	const actual = issue[rule.field];
	const values = Array.isArray(rule.values) ? rule.values : [];
	if (Array.isArray(actual)) {
		if (rule.operator === 'includes_all') return values.every((value) => actual.includes(value));
		if (rule.operator === 'includes_none') return values.every((value) => !actual.includes(value));
		return values.some((value) => actual.includes(value));
	}
	if (rule.operator === 'is_not') return !values.includes(actual);
	return values.includes(actual);
}

/**
 * Serializes one issue with display labels.
 *
 * @param {Record<string, unknown>} issue Source issue.
 * @returns {Record<string, unknown>} Display-ready issue.
 */
function serializeIssue(issue) {
	return {
		...issue,
		teamLabel: optionLabel(catalog.teams, issue.team),
		statusLabel: fieldValueLabel('status', issue.status),
		priorityLabel: fieldValueLabel('priority', issue.priority),
		assigneeLabel: fieldValueLabel('assignee', issue.assignee),
		cycleLabel: fieldValueLabel('cycle', issue.cycle),
		labelNames: issue.labels.map((label) => fieldValueLabel('labels', label)),
	};
}

/**
 * Builds a readable server-owned query expression for the preview.
 *
 * @param {Record<string, unknown>} draft Saved-view draft.
 * @returns {string} Query expression.
 */
function queryFor(draft) {
	if (!draft.rules?.length) return 'ALL ISSUES';
	const joiner = draft.matchMode === 'any' ? ' OR ' : ' AND ';
	return draft.rules.map((rule) => {
		const values = rule.values.map((value) => `"${fieldValueLabel(rule.field, value)}"`).join(', ');
		return `${fieldFor(rule.field)?.label || rule.field} ${operatorLabel(rule.field, rule.operator)} (${values})`;
	}).join(joiner);
}

/**
 * Returns readiness checks attached to an immutable preview.
 *
 * @param {Record<string, unknown>} draft Saved-view draft.
 * @param {Record<string, unknown>} evaluation Query evaluation.
 * @returns {Array<Record<string, unknown>>} Preview quality checks.
 */
function qualityChecks(draft, evaluation) {
	return [
		{ label: 'Query grammar is valid', passed: true },
		{ label: 'Audience is explicit', passed: draft.visibility !== 'teams' || draft.teamIds.length > 0 },
		{ label: 'Notification behavior is explicit', passed: Boolean(draft.alertMode) },
		{ label: 'Preview returned matching work', passed: evaluation.count > 0 },
	];
}

/**
 * Validates optimistic workspace and view versions for one mutation.
 *
 * @param {Record<string, unknown> | null} view Existing view or null for creation.
 * @param {Record<string, unknown>} input Mutation input.
 * @returns {Record<string, unknown> | null} Conflict response when stale.
 */
function exactMutation(view, input) {
	const workspaceRevision = Number(input.workspaceRevision);
	const viewVersion = Number(input.viewVersion);
	if (workspaceRevision !== state.revision) return conflictError(`Workspace revision changed from ${workspaceRevision} to ${state.revision}. Reload saved views.`);
	if (viewVersion !== (view?.version || 0)) return conflictError(`View version changed from ${viewVersion} to ${view?.version || 0}. Reload this view.`);
	return null;
}

/**
 * Adds an immutable activity item to a saved view.
 *
 * @param {Record<string, unknown>} view Saved view record.
 * @param {string} title Activity title.
 * @param {string} detail Activity detail.
 * @returns {void}
 */
function appendViewActivity(view, title, detail) {
	eventSequence += 1;
	view.activity.unshift({ id: `event_${eventSequence}`, title, detail, actor: currentOperator.name, time: 'Just now' });
}

/**
 * Finds one view by stable identifier.
 *
 * @param {string} viewId Stable view identifier.
 * @returns {Record<string, unknown> | null} Matching view.
 */
function findView(viewId) {
	return state.views.find((view) => view.id === viewId) || null;
}

/**
 * Finds one field definition by query key.
 *
 * @param {string} fieldId Field key.
 * @returns {Record<string, unknown> | null} Matching field definition.
 */
function fieldFor(fieldId) {
	return catalog.fields.find((field) => field.value === fieldId) || null;
}

/**
 * Returns a display label for one field value.
 *
 * @param {string} fieldId Field key.
 * @param {string} value Stored value.
 * @returns {string} Display label.
 */
function fieldValueLabel(fieldId, value) {
	return optionLabel(fieldFor(fieldId)?.values || [], value);
}

/**
 * Returns the display label for one field operator.
 *
 * @param {string} fieldId Field key.
 * @param {string} value Stored operator.
 * @returns {string} Operator label.
 */
function operatorLabel(fieldId, value) {
	return optionLabel(fieldFor(fieldId)?.operators || [], value);
}

/**
 * Returns a display label from an option catalog.
 *
 * @param {Array<Record<string, unknown>>} options Available options.
 * @param {string} value Stored value.
 * @returns {string} Display label or the original value.
 */
function optionLabel(options, value) {
	return options.find((option) => option.value === value)?.label || value;
}

/**
 * Returns a human-readable visibility summary.
 *
 * @param {Record<string, unknown>} view Saved view.
 * @returns {string} Visibility label.
 */
function visibilityLabel(view) {
	if (view.visibility === 'workspace') return 'Workspace';
	if (view.visibility === 'personal') return 'Personal';
	const labels = view.teamIds.map((teamId) => optionLabel(catalog.teams, teamId));
	return labels.length ? labels.join(', ') : 'Selected teams';
}

/**
 * Returns a person label for known demonstration operators.
 *
 * @param {string} personId Stored person identifier.
 * @returns {string} Person label.
 */
function personName(personId) {
	return {
		maya: 'Maya Chen',
		jon: 'Jon Bell',
		ari: 'Ari Grant',
		unassigned: 'Unassigned',
	}[personId] || personId;
}

/**
 * Counts rows by one property.
 *
 * @param {Array<Record<string, unknown>>} rows Result rows.
 * @param {string} key Property to count.
 * @returns {Record<string, number>} Counts keyed by property value.
 */
function countBy(rows, key) {
	return rows.reduce((counts, row) => {
		counts[row[key]] = (counts[row[key]] || 0) + 1;
		return counts;
	}, {});
}

/**
 * Normalizes bounded single-line text.
 *
 * @param {unknown} value Untrusted value.
 * @param {number} maxLength Maximum returned length.
 * @returns {string} Normalized text.
 */
function normalizeText(value, maxLength) {
	return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
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
	return { error: 'validation_failed', status: 422, message: 'Review the highlighted saved-view fields.', fields };
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
