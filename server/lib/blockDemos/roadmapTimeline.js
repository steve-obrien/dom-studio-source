const catalog = Object.freeze({
	views: [
		{ value: 'portfolio', label: 'Portfolio roadmap', description: 'Every active initiative across product teams.' },
		{ value: 'at-risk', label: 'Needs attention', description: 'Initiatives with at-risk or off-track health.' },
		{ value: 'needs-update', label: 'Update overdue', description: 'Initiatives without a current health update.' },
		{ value: 'customer-visible', label: 'Customer commitments', description: 'Initiatives approved for the customer roadmap.' },
	],
	periods: [
		{ value: '2026-q3', label: 'Q3 2026', shortLabel: 'Q3', year: '2026' },
		{ value: '2026-q4', label: 'Q4 2026', shortLabel: 'Q4', year: '2026' },
		{ value: '2027-q1', label: 'Q1 2027', shortLabel: 'Q1', year: '2027' },
		{ value: '2027-q2', label: 'Q2 2027', shortLabel: 'Q2', year: '2027' },
		{ value: '2027-q3', label: 'Q3 2027', shortLabel: 'Q3', year: '2027' },
		{ value: '2027-q4', label: 'Q4 2027', shortLabel: 'Q4', year: '2027' },
	],
	statuses: [
		{ value: 'shaping', label: 'Shaping', description: 'Problem and scope are still being explored.', tone: 'neutral' },
		{ value: 'planned', label: 'Planned', description: 'Accepted into an upcoming planning window.', tone: 'info' },
		{ value: 'in-progress', label: 'In progress', description: 'The delivery team is actively executing.', tone: 'primary' },
		{ value: 'paused', label: 'Paused', description: 'Work is intentionally stopped pending a decision.', tone: 'warning' },
		{ value: 'complete', label: 'Complete', description: 'The outcome is delivered and measured.', tone: 'success' },
	],
	health: [
		{ value: 'on-track', label: 'On track', description: 'Expected to land inside the current window.', tone: 'success' },
		{ value: 'at-risk', label: 'At risk', description: 'A named risk could move the target window.', tone: 'warning' },
		{ value: 'off-track', label: 'Off track', description: 'The current plan cannot meet its target.', tone: 'danger' },
	],
	teams: [
		{ value: 'growth', label: 'Growth', description: 'Acquisition, activation, and expansion.', color: 'primary' },
		{ value: 'core', label: 'Core product', description: 'Daily product workflows and collaboration.', color: 'success' },
		{ value: 'platform', label: 'Platform', description: 'Security, data, and shared foundations.', color: 'warning' },
	],
	owners: [
		{ value: 'usr_maya', label: 'Maya Chen', description: 'Product operations', initials: 'MC' },
		{ value: 'usr_lena', label: 'Lena Ortiz', description: 'Growth product', initials: 'LO' },
		{ value: 'usr_noah', label: 'Noah Williams', description: 'Platform product', initials: 'NW' },
		{ value: 'usr_ari', label: 'Ari Patel', description: 'Core product', initials: 'AP' },
		{ value: 'unassigned', label: 'Unassigned', description: 'Available for portfolio triage', initials: '—' },
	],
	objectives: [
		{ value: 'obj_activation', label: 'Faster activation', description: 'Reduce median time to first value below one day.' },
		{ value: 'obj_retention', label: 'Durable retention', description: 'Improve expansion readiness and renewal confidence.' },
		{ value: 'obj_enterprise', label: 'Enterprise trust', description: 'Remove security and governance blockers.' },
	],
	audiences: [
		{ value: 'product', label: 'Product & engineering', description: 'Full dates, dependencies, health, and owner context.' },
		{ value: 'executives', label: 'Executive review', description: 'Outcome, investment, health, and confidence.' },
		{ value: 'go-to-market', label: 'Go-to-market', description: 'Launch windows, customer impact, and approved messaging.' },
		{ value: 'customers', label: 'Customer roadmap', description: 'Sanitized commitments without internal delivery details.' },
	],
	updateAudiences: [
		{ value: 'product', label: 'Product team', description: 'Post to the internal product update stream.' },
		{ value: 'stakeholders', label: 'All stakeholders', description: 'Notify subscribed executives and go-to-market leads.' },
	],
});

const currentOperator = Object.freeze({
	id: 'usr_maya',
	name: 'Maya Chen',
	initials: 'MC',
	role: 'Product operations lead',
});

let state = createInitialState();
let initiativeSequence = 5300;
let updateSequence = 7600;
let eventSequence = 9100;
let receiptSequence = 4200;
let previewSequence = 2700;
const movePreviews = new Map();
const publishPreviews = new Map();

/**
 * Returns the complete portfolio roadmap with server-calculated summaries.
 *
 * @returns {Record<string, unknown>} Roadmap workspace payload.
 */
export function getRoadmapTimelineWorkspace() {
	return serializeWorkspace();
}

/**
 * Creates a validated initiative at an exact workspace revision.
 *
 * @param {Record<string, unknown>} input Initiative properties and workspace revision.
 * @returns {Record<string, unknown>} Updated workspace or API error.
 */
export function createRoadmapInitiative(input = {}) {
	const conflict = validateWorkspaceRevision(input);
	if (conflict) return conflict;

	const draft = normalizeInitiativeInput(input);
	const fieldErrors = validateInitiativeDraft(draft);
	if (Object.keys(fieldErrors).length) return validationError(fieldErrors);

	initiativeSequence += 1;
	const initiative = {
		id: `initiative_${initiativeSequence}`,
		version: 1,
		...draft,
		progress: 0,
		customers: Math.max(0, Number(input.customers || 0)),
		revenue: Math.max(0, Number(input.revenue || 0)),
		visibility: ['product', 'executives'],
		dependencies: [],
		milestones: [
			{ id: `milestone_${initiativeSequence}_scope`, label: 'Scope approved', complete: false },
			{ id: `milestone_${initiativeSequence}_launch`, label: 'Launch readiness', complete: false },
		],
		updates: [],
		lastUpdateDays: 0,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
	state.initiatives.unshift(initiative);
	appendEvent('Created roadmap initiative', initiative.title, 'success');
	touchWorkspace();

	return {
		...serializeWorkspace(),
		selectedInitiativeId: initiative.id,
		receipt: createReceipt('roadmap.initiative-created', initiative.id),
	};
}

/**
 * Updates initiative ownership, strategy, visibility, and delivery state.
 *
 * @param {string} initiativeId Initiative identifier.
 * @param {Record<string, unknown>} input Planning properties and optimistic revisions.
 * @returns {Record<string, unknown>} Updated workspace or API error.
 */
export function updateRoadmapInitiative(initiativeId, input = {}) {
	const initiative = findInitiative(initiativeId);
	if (!initiative) return { error: 'Roadmap initiative not found.', status: 404 };
	const conflict = validateInitiativeMutation(initiative, input);
	if (conflict) return conflict;

	const draft = normalizeInitiativeInput({ ...initiative, ...input });
	const fieldErrors = validateInitiativeDraft(draft, initiative.id);
	const visibility = normalizeStringList(input.visibility);
	if (!visibility.length) fieldErrors.visibility = ['Choose at least one roadmap audience.'];
	if (visibility.some((value) => !catalog.audiences.some((option) => option.value === value))) fieldErrors.visibility = ['Choose only supported roadmap audiences.'];
	if (draft.status === 'complete' && initiative.milestones.some((milestone) => !milestone.complete)) fieldErrors.status = ['Complete every launch milestone before closing this initiative.'];
	if (draft.status === 'in-progress' && draft.ownerId === 'unassigned') fieldErrors.ownerId = ['Active work needs one accountable lead.'];
	if (visibility.includes('customers') && draft.status === 'shaping') fieldErrors.visibility = ['Shaping work cannot be promised on the customer roadmap.'];
	if (Object.keys(fieldErrors).length) return validationError(fieldErrors);

	const previous = pickPlanningState(initiative);
	Object.assign(initiative, draft, { visibility, version: initiative.version + 1, updatedAt: new Date().toISOString() });
	if (draft.status === 'complete') initiative.progress = 100;
	appendEvent('Updated initiative plan', `${initiative.title} · ${optionLabel(catalog.statuses, initiative.status)}`, 'info');
	touchWorkspace();

	return {
		...serializeWorkspace(),
		selectedInitiativeId: initiative.id,
		receipt: createReceipt('roadmap.initiative-updated', initiative.id, { previous, next: pickPlanningState(initiative) }),
	};
}

/**
 * Creates an immutable schedule-change preview with dependency and capacity impact.
 *
 * @param {string} initiativeId Initiative identifier.
 * @param {Record<string, unknown>} input Proposed start and end periods with revisions.
 * @returns {Record<string, unknown>} Schedule preview or API error.
 */
export function previewRoadmapMove(initiativeId, input = {}) {
	const initiative = findInitiative(initiativeId);
	if (!initiative) return { error: 'Roadmap initiative not found.', status: 404 };
	const conflict = validateInitiativeMutation(initiative, input);
	if (conflict) return conflict;

	const startPeriod = normalizeText(input.startPeriod, 40);
	const endPeriod = normalizeText(input.endPeriod, 40);
	const fieldErrors = validatePeriodRange(startPeriod, endPeriod);
	if (Object.keys(fieldErrors).length) return validationError(fieldErrors);

	const startIndex = periodIndex(startPeriod);
	const endIndex = periodIndex(endPeriod);
	const blockingDependencies = initiative.dependencies
		.map(findInitiative)
		.filter(Boolean)
		.filter((dependency) => periodIndex(dependency.endPeriod) >= startIndex)
		.map((dependency) => ({ id: dependency.id, title: dependency.title, endPeriod: dependency.endPeriod, endLabel: optionLabel(catalog.periods, dependency.endPeriod) }));
	const downstream = state.initiatives
		.filter((candidate) => candidate.dependencies.includes(initiative.id) && periodIndex(candidate.startPeriod) <= endIndex)
		.map((candidate) => ({ id: candidate.id, title: candidate.title, startPeriod: candidate.startPeriod, startLabel: optionLabel(catalog.periods, candidate.startPeriod) }));
	const overlappingTeamWork = state.initiatives
		.filter((candidate) => candidate.id !== initiative.id && candidate.teamId === initiative.teamId)
		.filter((candidate) => rangesOverlap(startIndex, endIndex, periodIndex(candidate.startPeriod), periodIndex(candidate.endPeriod)))
		.map((candidate) => ({ id: candidate.id, title: candidate.title, window: `${optionLabel(catalog.periods, candidate.startPeriod)} – ${optionLabel(catalog.periods, candidate.endPeriod)}` }));
	const warnings = [];
	if (blockingDependencies.length) warnings.push(`${blockingDependencies.length} dependency finishes inside the proposed window.`);
	if (downstream.length) warnings.push(`${downstream.length} downstream initiative may need a new target.`);
	if (overlappingTeamWork.length >= 2) warnings.push(`${optionLabel(catalog.teams, initiative.teamId)} would have ${overlappingTeamWork.length + 1} concurrent initiatives.`);

	previewSequence += 1;
	const preview = {
		id: `roadmap_move_${previewSequence}`,
		initiativeId: initiative.id,
		initiativeVersion: initiative.version,
		workspaceRevision: state.revision,
		initiativeTitle: initiative.title,
		current: { startPeriod: initiative.startPeriod, endPeriod: initiative.endPeriod, label: periodRangeLabel(initiative.startPeriod, initiative.endPeriod) },
		next: { startPeriod, endPeriod, label: periodRangeLabel(startPeriod, endPeriod) },
		blockingDependencies,
		downstream,
		overlappingTeamWork,
		warnings,
		createdAt: new Date().toISOString(),
	};
	movePreviews.set(preview.id, preview);
	return { preview: cloneValue(preview) };
}

/**
 * Commits an exact schedule preview after any risk is acknowledged.
 *
 * @param {string} initiativeId Initiative identifier.
 * @param {Record<string, unknown>} input Preview identifier and acknowledgement.
 * @returns {Record<string, unknown>} Updated workspace or API error.
 */
export function commitRoadmapMove(initiativeId, input = {}) {
	const initiative = findInitiative(initiativeId);
	if (!initiative) return { error: 'Roadmap initiative not found.', status: 404 };
	const preview = movePreviews.get(normalizeText(input.previewId, 100));
	if (!preview || preview.initiativeId !== initiative.id) return { error: 'Create a fresh schedule preview before moving this initiative.', status: 409, conflict: true };
	if (preview.workspaceRevision !== state.revision || preview.initiativeVersion !== initiative.version) return { error: 'This schedule preview is stale. Review the current roadmap again.', status: 409, conflict: true };
	if (preview.warnings.length && input.acknowledged !== true) return validationError({ acknowledged: ['Acknowledge the dependency and capacity impact before rescheduling.'] });

	initiative.startPeriod = preview.next.startPeriod;
	initiative.endPeriod = preview.next.endPeriod;
	initiative.version += 1;
	initiative.updatedAt = new Date().toISOString();
	appendEvent('Rescheduled initiative', `${initiative.title} · ${preview.current.label} → ${preview.next.label}`, preview.warnings.length ? 'warning' : 'success');
	movePreviews.delete(preview.id);
	touchWorkspace();

	return {
		...serializeWorkspace(),
		selectedInitiativeId: initiative.id,
		receipt: createReceipt('roadmap.initiative-rescheduled', initiative.id, { current: preview.current, next: preview.next, warnings: preview.warnings }),
	};
}

/**
 * Posts a health update with progress and notification delivery evidence.
 *
 * @param {string} initiativeId Initiative identifier.
 * @param {Record<string, unknown>} input Health update and optimistic revisions.
 * @returns {Record<string, unknown>} Updated workspace or API error.
 */
export function createRoadmapUpdate(initiativeId, input = {}) {
	const initiative = findInitiative(initiativeId);
	if (!initiative) return { error: 'Roadmap initiative not found.', status: 404 };
	const conflict = validateInitiativeMutation(initiative, input);
	if (conflict) return conflict;

	const health = normalizeText(input.health, 40);
	const audience = normalizeText(input.audience, 40);
	const summary = normalizeText(input.summary, 1600);
	const progress = Number(input.progress);
	const notify = input.notify === true;
	const fieldErrors = {};
	if (!catalog.health.some((option) => option.value === health)) fieldErrors.health = ['Choose the current initiative health.'];
	if (!catalog.updateAudiences.some((option) => option.value === audience)) fieldErrors.audience = ['Choose an update audience.'];
	if (!Number.isFinite(progress) || progress < 0 || progress > 100) fieldErrors.progress = ['Enter progress between 0 and 100.'];
	if (summary.length < 24) fieldErrors.summary = ['Write at least 24 characters explaining progress, risk, or the next decision.'];
	if (audience === 'product' && notify) fieldErrors.notify = ['Product-only updates stay in the workspace and do not send stakeholder notifications.'];
	if (Object.keys(fieldErrors).length) return validationError(fieldErrors);

	updateSequence += 1;
	const notification = audience === 'stakeholders' && notify ? {
		status: 'delivered',
		recipients: 18,
		receipt: createReceipt('roadmap.update-notified', initiative.id),
	} : null;
	const update = {
		id: `roadmap_update_${updateSequence}`,
		health,
		healthLabel: optionLabel(catalog.health, health),
		progress: Math.round(progress),
		audience,
		audienceLabel: optionLabel(catalog.updateAudiences, audience),
		summary,
		actor: currentOperator.name,
		time: 'Just now',
		createdAt: new Date().toISOString(),
		notification,
	};
	initiative.health = health;
	initiative.progress = update.progress;
	initiative.lastUpdateDays = 0;
	initiative.updates.unshift(update);
	initiative.version += 1;
	initiative.updatedAt = update.createdAt;
	appendEvent('Posted initiative update', `${initiative.title} · ${update.healthLabel}`, health === 'on-track' ? 'success' : 'warning');
	touchWorkspace();

	return {
		...serializeWorkspace(),
		selectedInitiativeId: initiative.id,
		update: cloneValue(update),
		receipt: createReceipt('roadmap.update-posted', update.id),
	};
}

/**
 * Creates an immutable audience-specific roadmap publication preview.
 *
 * @param {Record<string, unknown>} input Audience, planning window, and revision.
 * @returns {Record<string, unknown>} Publication preview or API error.
 */
export function previewRoadmapPublication(input = {}) {
	const conflict = validateWorkspaceRevision(input);
	if (conflict) return conflict;

	const audience = normalizeText(input.audience, 40);
	const endPeriod = normalizeText(input.endPeriod, 40);
	const fieldErrors = {};
	if (!catalog.audiences.some((option) => option.value === audience)) fieldErrors.audience = ['Choose a supported roadmap audience.'];
	if (periodIndex(endPeriod) < 0) fieldErrors.endPeriod = ['Choose the last period included in the release.'];
	if (Object.keys(fieldErrors).length) return validationError(fieldErrors);

	const candidates = state.initiatives.filter((initiative) => periodIndex(initiative.startPeriod) <= periodIndex(endPeriod));
	const included = candidates.filter((initiative) => initiative.visibility.includes(audience));
	const excluded = candidates.filter((initiative) => !initiative.visibility.includes(audience));
	const warnings = [];
	const stale = included.filter((initiative) => initiative.lastUpdateDays > 14);
	const uncertain = included.filter((initiative) => initiative.confidence < 60 || initiative.health === 'off-track');
	if (stale.length) warnings.push(`${stale.length} included initiative needs a current health update.`);
	if (uncertain.length) warnings.push(`${uncertain.length} included initiative has low confidence or is off track.`);
	if (audience === 'customers' && included.length < 2) warnings.push('The customer roadmap contains fewer than two approved commitments.');

	previewSequence += 1;
	const preview = {
		id: `roadmap_publish_${previewSequence}`,
		workspaceRevision: state.revision,
		audience,
		audienceLabel: optionLabel(catalog.audiences, audience),
		endPeriod,
		endPeriodLabel: optionLabel(catalog.periods, endPeriod),
		included: included.map((initiative) => ({ id: initiative.id, version: initiative.version, title: initiative.title, window: audience === 'customers' ? optionLabel(catalog.periods, initiative.endPeriod) : periodRangeLabel(initiative.startPeriod, initiative.endPeriod), health: initiative.health, confidence: initiative.confidence })),
		excluded: excluded.map((initiative) => ({ id: initiative.id, title: initiative.title })),
		redactions: audience === 'customers' ? ['Owner names', 'Exact start periods', 'Internal health notes', 'Revenue influence'] : audience === 'go-to-market' ? ['Internal dependency notes'] : [],
		warnings,
		createdAt: new Date().toISOString(),
	};
	publishPreviews.set(preview.id, preview);
	return { preview: cloneValue(preview) };
}

/**
 * Publishes an exact roadmap audience preview and returns immutable release evidence.
 *
 * @param {Record<string, unknown>} input Preview identifier and warning acknowledgement.
 * @returns {Record<string, unknown>} Updated workspace or API error.
 */
export function commitRoadmapPublication(input = {}) {
	const preview = publishPreviews.get(normalizeText(input.previewId, 100));
	if (!preview) return { error: 'Create a fresh roadmap preview before publishing.', status: 409, conflict: true };
	if (preview.workspaceRevision !== state.revision) return { error: 'This roadmap preview is stale. Review the latest portfolio before publishing.', status: 409, conflict: true };
	if (preview.included.some((item) => findInitiative(item.id)?.version !== item.version)) return { error: 'An included initiative changed after this preview.', status: 409, conflict: true };
	if (preview.warnings.length && input.acknowledged !== true) return validationError({ acknowledged: ['Acknowledge the stale or uncertain commitments before publishing.'] });

	const receipt = createReceipt('roadmap.audience-published', preview.audience, { includedIds: preview.included.map((item) => item.id), endPeriod: preview.endPeriod, redactions: preview.redactions });
	state.publications.unshift({
		id: receipt.id,
		audience: preview.audience,
		audienceLabel: preview.audienceLabel,
		endPeriod: preview.endPeriod,
		endPeriodLabel: preview.endPeriodLabel,
		itemCount: preview.included.length,
		publishedAt: new Date().toISOString(),
		publishedBy: currentOperator.name,
	});
	publishPreviews.delete(preview.id);
	appendEvent('Published roadmap audience', `${preview.audienceLabel} · ${preview.included.length} initiatives`, 'success');
	touchWorkspace();

	return { ...serializeWorkspace(), receipt };
}

/**
 * Restores the deterministic roadmap workspace for another demo run.
 *
 * @returns {Record<string, unknown>} Reset roadmap workspace.
 */
export function resetRoadmapTimelineWorkspace() {
	state = createInitialState();
	movePreviews.clear();
	publishPreviews.clear();
	return serializeWorkspace();
}

/**
 * Creates the deterministic mutable roadmap seed.
 *
 * @returns {Record<string, unknown>} Initial roadmap state.
 */
function createInitialState() {
	return {
		revision: 19,
		updatedAt: '2026-08-02T09:40:00.000Z',
		board: {
			id: 'board_portfolio-roadmap',
			name: 'Product portfolio',
			description: 'Outcomes, delivery windows, and stakeholder commitments.',
			fiscalYear: 'FY27',
		},
		initiatives: createInitiativeSeeds(),
		publications: [
			{ id: 'receipt_4198', audience: 'executives', audienceLabel: 'Executive review', endPeriod: '2027-q2', endPeriodLabel: 'Q2 2027', itemCount: 4, publishedAt: '2026-07-29T15:20:00.000Z', publishedBy: 'Maya Chen' },
		],
		events: [
			{ id: 'event_9100', label: 'Flagged schedule risk', detail: 'Event stream API · schema governance', actor: 'Noah Williams', time: '43m', tone: 'warning' },
			{ id: 'event_9099', label: 'Published executive roadmap', detail: 'FY27 operating review · 4 initiatives', actor: 'Maya Chen', time: 'Jul 29', tone: 'success' },
			{ id: 'event_9098', label: 'Posted health update', detail: 'Customer health score v2 · On track', actor: 'Ari Patel', time: 'Jul 28', tone: 'info' },
		],
	};
}

/**
 * Returns realistic portfolio initiatives with dependencies and health history.
 *
 * @returns {Array<Record<string, unknown>>} Seed initiative records.
 */
function createInitiativeSeeds() {
	return [
		{
			id: 'initiative_event_stream', version: 7, title: 'Event stream API', summary: 'Normalize product events for automations, exports, and AI workflows.', teamId: 'platform', ownerId: 'usr_noah', objectiveId: 'obj_enterprise', status: 'in-progress', health: 'at-risk', startPeriod: '2026-q3', endPeriod: '2026-q4', confidence: 54, progress: 46, customers: 22, revenue: 176000, visibility: ['product', 'executives', 'go-to-market'], dependencies: [], lastUpdateDays: 1, createdAt: '2026-04-14T09:00:00.000Z', updatedAt: '2026-08-02T08:57:00.000Z',
			milestones: [{ id: 'milestone_event_catalog', label: 'Event catalog reviewed', complete: true }, { id: 'milestone_throughput', label: 'Throughput test passed', complete: false }, { id: 'milestone_webhook_parity', label: 'Webhook parity confirmed', complete: false }],
			updates: [{ id: 'roadmap_update_7597', health: 'at-risk', healthLabel: 'At risk', progress: 46, audience: 'stakeholders', audienceLabel: 'All stakeholders', summary: 'Schema governance is two weeks late; the team is protecting the Q4 launch by reducing the first event catalog.', actor: 'Noah Williams', time: '43m', createdAt: '2026-08-02T08:57:00.000Z', notification: { status: 'delivered', recipients: 18, receipt: { id: 'receipt_4197' } } }],
		},
		{
			id: 'initiative_ai_inbox', version: 9, title: 'AI inbox summaries', summary: 'Turn long customer threads into evidence-backed next actions and ownership.', teamId: 'core', ownerId: 'usr_maya', objectiveId: 'obj_activation', status: 'in-progress', health: 'on-track', startPeriod: '2026-q4', endPeriod: '2027-q1', confidence: 82, progress: 68, customers: 36, revenue: 128000, visibility: ['product', 'executives', 'go-to-market', 'customers'], dependencies: ['initiative_event_stream'], lastUpdateDays: 4, createdAt: '2026-05-20T10:00:00.000Z', updatedAt: '2026-07-29T13:40:00.000Z',
			milestones: [{ id: 'milestone_eval_set', label: 'Prompt eval set ready', complete: true }, { id: 'milestone_beta_cohort', label: 'Beta cohort selected', complete: true }, { id: 'milestone_audit_controls', label: 'Admin audit controls', complete: false }],
			updates: [{ id: 'roadmap_update_7590', health: 'on-track', healthLabel: 'On track', progress: 68, audience: 'stakeholders', audienceLabel: 'All stakeholders', summary: 'The beta cohort is confirmed and evaluation accuracy remains above the launch threshold.', actor: 'Maya Chen', time: '4d', createdAt: '2026-07-29T13:40:00.000Z', notification: null }],
		},
		{
			id: 'initiative_customer_health', version: 6, title: 'Customer health score v2', summary: 'Combine usage, renewal risk, support history, and champion activity into an explainable score.', teamId: 'core', ownerId: 'usr_ari', objectiveId: 'obj_retention', status: 'planned', health: 'on-track', startPeriod: '2027-q1', endPeriod: '2027-q2', confidence: 78, progress: 24, customers: 54, revenue: 310000, visibility: ['product', 'executives', 'go-to-market', 'customers'], dependencies: ['initiative_event_stream'], lastUpdateDays: 5, createdAt: '2026-06-02T09:30:00.000Z', updatedAt: '2026-07-28T14:20:00.000Z',
			milestones: [{ id: 'milestone_health_fields', label: 'Model fields mapped', complete: true }, { id: 'milestone_playbooks', label: 'Success playbooks drafted', complete: false }, { id: 'milestone_renewal_alerts', label: 'Renewal alerts validated', complete: false }],
			updates: [{ id: 'roadmap_update_7588', health: 'on-track', healthLabel: 'On track', progress: 24, audience: 'product', audienceLabel: 'Product team', summary: 'The model inputs are agreed; research is now validating how success managers explain score changes.', actor: 'Ari Patel', time: '5d', createdAt: '2026-07-28T14:20:00.000Z', notification: null }],
		},
		{
			id: 'initiative_personalization', version: 4, title: 'Workspace personalization', summary: 'Tailor setup and product guidance to company shape, role, and intended outcome.', teamId: 'growth', ownerId: 'usr_lena', objectiveId: 'obj_activation', status: 'shaping', health: 'on-track', startPeriod: '2026-q3', endPeriod: '2026-q4', confidence: 66, progress: 18, customers: 18, revenue: 84000, visibility: ['product', 'executives'], dependencies: [], lastUpdateDays: 19, createdAt: '2026-06-18T11:00:00.000Z', updatedAt: '2026-07-14T10:15:00.000Z',
			milestones: [{ id: 'milestone_baseline', label: 'Activation baseline approved', complete: true }, { id: 'milestone_experiment', label: 'Experiment cohort agreed', complete: false }],
			updates: [{ id: 'roadmap_update_7561', health: 'on-track', healthLabel: 'On track', progress: 18, audience: 'product', audienceLabel: 'Product team', summary: 'Research supports role-based setup, but the first experiment still needs a measurable activation event.', actor: 'Lena Ortiz', time: '19d', createdAt: '2026-07-14T10:15:00.000Z', notification: null }],
		},
		{
			id: 'initiative_admin_roles', version: 5, title: 'Granular admin roles', summary: 'Give enterprise admins scoped permissions for finance, support, security, and contractors.', teamId: 'platform', ownerId: 'usr_noah', objectiveId: 'obj_enterprise', status: 'planned', health: 'off-track', startPeriod: '2027-q2', endPeriod: '2027-q3', confidence: 48, progress: 12, customers: 29, revenue: 96000, visibility: ['product', 'executives', 'go-to-market'], dependencies: ['initiative_event_stream'], lastUpdateDays: 22, createdAt: '2026-06-24T10:00:00.000Z', updatedAt: '2026-07-11T15:30:00.000Z',
			milestones: [{ id: 'milestone_permission_matrix', label: 'Permission matrix accepted', complete: true }, { id: 'milestone_scim_mapping', label: 'SCIM role mapping', complete: false }, { id: 'milestone_audit_export', label: 'Audit export compatibility', complete: false }],
			updates: [{ id: 'roadmap_update_7544', health: 'off-track', healthLabel: 'Off track', progress: 12, audience: 'stakeholders', audienceLabel: 'All stakeholders', summary: 'The policy engine contract is unresolved and the current Q3 target requires a scope or staffing decision.', actor: 'Noah Williams', time: '22d', createdAt: '2026-07-11T15:30:00.000Z', notification: { status: 'delivered', recipients: 18, receipt: { id: 'receipt_4170' } } }],
		},
	];
}

/**
 * Serializes mutable state and derives labels, summaries, and relationship data.
 *
 * @returns {Record<string, unknown>} Public roadmap workspace.
 */
function serializeWorkspace() {
	const initiatives = state.initiatives.map(serializeInitiative);
	return {
		revision: state.revision,
		updatedAt: state.updatedAt,
		board: cloneValue(state.board),
		catalog: cloneValue(catalog),
		currentOperator: cloneValue(currentOperator),
		initiatives,
		publications: cloneValue(state.publications),
		events: cloneValue(state.events),
		summary: {
			activeInitiatives: initiatives.filter((initiative) => initiative.status !== 'complete').length,
			atRisk: initiatives.filter((initiative) => ['at-risk', 'off-track'].includes(initiative.health)).length,
			needsUpdate: initiatives.filter((initiative) => initiative.lastUpdateDays > 14).length,
			customerCommitments: initiatives.filter((initiative) => initiative.visibility.includes('customers')).length,
			influencedRevenue: initiatives.reduce((total, initiative) => total + initiative.revenue, 0),
		},
	};
}

/**
 * Adds display labels and resolved relationships to one initiative.
 *
 * @param {Record<string, unknown>} initiative Mutable initiative record.
 * @returns {Record<string, unknown>} Serialized initiative.
 */
function serializeInitiative(initiative) {
	return {
		...cloneValue(initiative),
		team: optionLabel(catalog.teams, initiative.teamId),
		teamColor: catalog.teams.find((option) => option.value === initiative.teamId)?.color || 'neutral',
		owner: optionLabel(catalog.owners, initiative.ownerId),
		ownerInitials: catalog.owners.find((option) => option.value === initiative.ownerId)?.initials || '—',
		objective: optionLabel(catalog.objectives, initiative.objectiveId),
		statusLabel: optionLabel(catalog.statuses, initiative.status),
		healthLabel: optionLabel(catalog.health, initiative.health),
		startLabel: optionLabel(catalog.periods, initiative.startPeriod),
		endLabel: optionLabel(catalog.periods, initiative.endPeriod),
		windowLabel: periodRangeLabel(initiative.startPeriod, initiative.endPeriod),
		dependencyItems: initiative.dependencies.map(findInitiative).filter(Boolean).map((dependency) => ({ id: dependency.id, title: dependency.title, health: dependency.health, healthLabel: optionLabel(catalog.health, dependency.health), endLabel: optionLabel(catalog.periods, dependency.endPeriod) })),
		downstreamCount: state.initiatives.filter((candidate) => candidate.dependencies.includes(initiative.id)).length,
	};
}

/**
 * Normalizes initiative planning fields from an API payload.
 *
 * @param {Record<string, unknown>} input Initiative-like input.
 * @returns {Record<string, unknown>} Normalized initiative draft.
 */
function normalizeInitiativeInput(input) {
	return {
		title: normalizeText(input.title, 140),
		summary: normalizeText(input.summary, 1200),
		teamId: normalizeText(input.teamId, 60),
		ownerId: normalizeText(input.ownerId, 80),
		objectiveId: normalizeText(input.objectiveId, 80),
		status: normalizeText(input.status, 40),
		health: normalizeText(input.health, 40),
		startPeriod: normalizeText(input.startPeriod, 40),
		endPeriod: normalizeText(input.endPeriod, 40),
		confidence: Math.round(Number(input.confidence)),
	};
}

/**
 * Validates core initiative properties and dependency cycles.
 *
 * @param {Record<string, unknown>} draft Normalized initiative draft.
 * @param {string} [initiativeId] Existing initiative identifier.
 * @returns {Record<string, string[]>} Field validation errors.
 */
function validateInitiativeDraft(draft, initiativeId = '') {
	const fieldErrors = validatePeriodRange(draft.startPeriod, draft.endPeriod);
	if (draft.title.length < 6) fieldErrors.title = ['Enter an initiative title of at least 6 characters.'];
	if (draft.summary.length < 20) fieldErrors.summary = ['Describe the intended outcome in at least 20 characters.'];
	if (!catalog.teams.some((option) => option.value === draft.teamId)) fieldErrors.teamId = ['Choose an accountable product team.'];
	if (!catalog.owners.some((option) => option.value === draft.ownerId)) fieldErrors.ownerId = ['Choose an accountable initiative lead.'];
	if (!catalog.objectives.some((option) => option.value === draft.objectiveId)) fieldErrors.objectiveId = ['Connect this initiative to a portfolio objective.'];
	if (!catalog.statuses.some((option) => option.value === draft.status)) fieldErrors.status = ['Choose a delivery status.'];
	if (!catalog.health.some((option) => option.value === draft.health)) fieldErrors.health = ['Choose the current delivery health.'];
	if (!Number.isFinite(draft.confidence) || draft.confidence < 0 || draft.confidence > 100) fieldErrors.confidence = ['Enter confidence between 0 and 100.'];
	if (initiativeId && draft.ownerId === 'unassigned' && draft.status === 'in-progress') fieldErrors.ownerId = ['Active work needs one accountable lead.'];
	return fieldErrors;
}

/**
 * Validates that two roadmap periods exist and are chronological.
 *
 * @param {string} startPeriod Proposed start period.
 * @param {string} endPeriod Proposed end period.
 * @returns {Record<string, string[]>} Period validation errors.
 */
function validatePeriodRange(startPeriod, endPeriod) {
	const fieldErrors = {};
	if (periodIndex(startPeriod) < 0) fieldErrors.startPeriod = ['Choose a valid start period.'];
	if (periodIndex(endPeriod) < 0) fieldErrors.endPeriod = ['Choose a valid end period.'];
	if (!fieldErrors.startPeriod && !fieldErrors.endPeriod && periodIndex(endPeriod) < periodIndex(startPeriod)) fieldErrors.endPeriod = ['The target period cannot be before the start period.'];
	return fieldErrors;
}

/**
 * Validates an exact workspace revision.
 *
 * @param {Record<string, unknown>} input Request input.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function validateWorkspaceRevision(input) {
	if (Number(input.revision) !== state.revision) return { error: 'The roadmap changed in another planning session. Reload the current portfolio before saving.', status: 409, conflict: true, currentRevision: state.revision };
	return null;
}

/**
 * Validates exact workspace and initiative revisions.
 *
 * @param {Record<string, unknown>} initiative Current initiative.
 * @param {Record<string, unknown>} input Request input.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function validateInitiativeMutation(initiative, input) {
	const workspaceConflict = validateWorkspaceRevision(input);
	if (workspaceConflict) return workspaceConflict;
	if (Number(input.initiativeVersion) !== initiative.version) return { error: 'This initiative changed after you opened it. Review the latest planning state before saving.', status: 409, conflict: true, currentVersion: initiative.version };
	return null;
}

/**
 * Finds an initiative by identifier.
 *
 * @param {string} initiativeId Initiative identifier.
 * @returns {Record<string, unknown>|undefined} Initiative record.
 */
function findInitiative(initiativeId) {
	return state.initiatives.find((initiative) => initiative.id === initiativeId);
}

/**
 * Appends a bounded portfolio activity event.
 *
 * @param {string} label Event label.
 * @param {string} detail Event detail.
 * @param {string} tone Semantic tone.
 * @returns {void}
 */
function appendEvent(label, detail, tone) {
	eventSequence += 1;
	state.events.unshift({ id: `event_${eventSequence}`, label, detail, actor: currentOperator.name, time: 'Just now', tone });
	state.events = state.events.slice(0, 12);
}

/**
 * Advances the workspace revision and timestamp.
 *
 * @returns {void}
 */
function touchWorkspace() {
	state.revision += 1;
	state.updatedAt = new Date().toISOString();
}

/**
 * Creates immutable evidence for a completed roadmap operation.
 *
 * @param {string} event Receipt event name.
 * @param {string} subjectId Receipt subject identifier.
 * @param {Record<string, unknown>} [details] Additional evidence.
 * @returns {Record<string, unknown>} Receipt.
 */
function createReceipt(event, subjectId, details = {}) {
	receiptSequence += 1;
	return { id: `receipt_${receiptSequence}`, event, subjectId, actorId: currentOperator.id, createdAt: new Date().toISOString(), details: cloneValue(details) };
}

/**
 * Creates a consistent validation error response.
 *
 * @param {Record<string, string[]>} fieldErrors Field error map.
 * @returns {Record<string, unknown>} Validation response.
 */
function validationError(fieldErrors) {
	return { error: 'Review the highlighted roadmap fields.', status: 422, fieldErrors };
}

/**
 * Returns the index of one supported planning period.
 *
 * @param {string} value Period value.
 * @returns {number} Zero-based period index or -1.
 */
function periodIndex(value) {
	return catalog.periods.findIndex((period) => period.value === value);
}

/**
 * Formats a compact planning-window label.
 *
 * @param {string} startPeriod Start period value.
 * @param {string} endPeriod End period value.
 * @returns {string} Human-readable period range.
 */
function periodRangeLabel(startPeriod, endPeriod) {
	const start = optionLabel(catalog.periods, startPeriod);
	const end = optionLabel(catalog.periods, endPeriod);
	return startPeriod === endPeriod ? start : `${start} – ${end}`;
}

/**
 * Tests whether two inclusive period ranges overlap.
 *
 * @param {number} firstStart First start index.
 * @param {number} firstEnd First end index.
 * @param {number} secondStart Second start index.
 * @param {number} secondEnd Second end index.
 * @returns {boolean} Whether the ranges overlap.
 */
function rangesOverlap(firstStart, firstEnd, secondStart, secondEnd) {
	return firstStart <= secondEnd && secondStart <= firstEnd;
}

/**
 * Extracts the auditable planning subset of an initiative.
 *
 * @param {Record<string, unknown>} initiative Initiative record.
 * @returns {Record<string, unknown>} Planning subset.
 */
function pickPlanningState(initiative) {
	return { title: initiative.title, teamId: initiative.teamId, ownerId: initiative.ownerId, objectiveId: initiative.objectiveId, status: initiative.status, health: initiative.health, confidence: initiative.confidence, visibility: cloneValue(initiative.visibility) };
}

/**
 * Returns the label for a catalog value.
 *
 * @param {Array<Record<string, unknown>>} options Catalog options.
 * @param {string} value Selected value.
 * @returns {string} Display label.
 */
function optionLabel(options, value) {
	return options.find((option) => option.value === value)?.label || value || 'Not set';
}

/**
 * Normalizes bounded user text.
 *
 * @param {unknown} value Raw value.
 * @param {number} maxLength Maximum retained characters.
 * @returns {string} Trimmed text.
 */
function normalizeText(value, maxLength) {
	return String(value ?? '').trim().slice(0, maxLength);
}

/**
 * Normalizes an array of unique bounded strings.
 *
 * @param {unknown} value Raw array value.
 * @returns {string[]} Normalized strings.
 */
function normalizeStringList(value) {
	if (!Array.isArray(value)) return [];
	return [...new Set(value.map((item) => normalizeText(item, 80)).filter(Boolean))];
}

/**
 * Deep-clones JSON-safe demo values.
 *
 * @param {unknown} value Value to clone.
 * @returns {unknown} Cloned value.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}
