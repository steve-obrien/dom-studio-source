const catalog = Object.freeze({
	statuses: [
		{ value: 'all', label: 'Every status' },
		{ value: 'active', label: 'Active' },
		{ value: 'draft', label: 'Draft' },
		{ value: 'paused', label: 'Paused' },
	],
	owners: [
		{ value: 'maya', label: 'Maya Chen', description: 'Lifecycle operations', initials: 'MC' },
		{ value: 'jon', label: 'Jon Bell', description: 'Revenue operations', initials: 'JB' },
		{ value: 'ari', label: 'Ari Grant', description: 'Product operations', initials: 'AG' },
		{ value: 'nora', label: 'Nora Lee', description: 'Support leadership', initials: 'NL' },
	],
	triggers: [
		{ value: 'trial.inactive', label: 'Trial became inactive', description: 'Fires when a trial has no qualifying activity for its configured window.', connectionId: 'product-events' },
		{ value: 'invoice.failed', label: 'Invoice payment failed', description: 'Fires after a provider payment attempt reaches a failed state.', connectionId: 'billing' },
		{ value: 'ticket.priority_changed', label: 'Ticket became urgent', description: 'Fires when a support ticket enters the urgent priority queue.', connectionId: 'support' },
		{ value: 'usage.dropped', label: 'Feature usage dropped', description: 'Fires when weekly product usage falls below its prior baseline.', connectionId: 'product-events' },
	],
	matchModes: [
		{ value: 'all', label: 'Match every rule', description: 'The event continues only when every condition passes.' },
		{ value: 'any', label: 'Match any rule', description: 'The event continues when at least one condition passes.' },
	],
	fields: [
		{
			value: 'plan',
			label: 'Workspace plan',
			description: 'The current commercial plan.',
			operators: [{ value: 'equals', label: 'equals' }, { value: 'not_equals', label: 'does not equal' }],
			values: [{ value: 'starter', label: 'Starter' }, { value: 'growth', label: 'Growth' }, { value: 'enterprise', label: 'Enterprise' }],
		},
		{
			value: 'lastActiveDays',
			label: 'Days since activity',
			description: 'Whole days since the latest qualifying product event.',
			operators: [{ value: 'greater_than', label: 'is greater than' }, { value: 'less_than', label: 'is less than' }],
			values: [{ value: '3', label: '3 days' }, { value: '5', label: '5 days' }, { value: '14', label: '14 days' }],
		},
		{
			value: 'health',
			label: 'Account health',
			description: 'The latest customer-health classification.',
			operators: [{ value: 'equals', label: 'equals' }, { value: 'not_equals', label: 'does not equal' }],
			values: [{ value: 'healthy', label: 'Healthy' }, { value: 'at_risk', label: 'At risk' }, { value: 'critical', label: 'Critical' }],
		},
		{
			value: 'priority',
			label: 'Ticket priority',
			description: 'The current support priority.',
			operators: [{ value: 'equals', label: 'equals' }, { value: 'not_equals', label: 'does not equal' }],
			values: [{ value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }],
		},
	],
	actionTypes: [
		{
			value: 'send_email',
			label: 'Send lifecycle email',
			description: 'Render and queue an approved customer email.',
			connectionId: 'mail',
			targets: [{ value: 'trial_nudge_v3', label: 'Trial nudge v3' }, { value: 'payment_recovery_v2', label: 'Payment recovery v2' }, { value: 'owner_checkin', label: 'Owner check-in' }],
		},
		{
			value: 'create_task',
			label: 'Create accountable task',
			description: 'Create a task in the operating queue.',
			connectionId: 'tasks',
			targets: [{ value: 'lifecycle_followup', label: 'Lifecycle follow-up' }, { value: 'finance_recovery', label: 'Finance recovery' }, { value: 'support_escalation', label: 'Support escalation' }],
		},
		{
			value: 'post_alert',
			label: 'Post team alert',
			description: 'Send a structured notification to a team channel.',
			connectionId: 'messaging',
			targets: [{ value: 'revops_alerts', label: '#revops-alerts' }, { value: 'support_war_room', label: '#support-war-room' }, { value: 'lifecycle_signals', label: '#lifecycle-signals' }],
		},
		{
			value: 'update_account',
			label: 'Update account field',
			description: 'Write one server-owned customer field.',
			connectionId: 'crm',
			targets: [{ value: 'health_at_risk', label: 'Health → At risk' }, { value: 'escalation_open', label: 'Escalation → Open' }, { value: 'recovery_started', label: 'Recovery → Started' }],
		},
	],
	fixtures: [
		{ value: 'northstar-inactive', label: 'Northstar Labs · inactive trial', description: 'Growth trial · inactive 7 days · at-risk health' },
		{ value: 'orbit-active', label: 'Orbit Systems · active enterprise', description: 'Enterprise · active today · healthy' },
		{ value: 'acme-failed-invoice', label: 'Acme Fieldworks · failed invoice', description: 'Enterprise · failed payment · at-risk health' },
	],
	connections: [
		{ id: 'product-events', name: 'Product events', status: 'healthy', detail: 'Schema v18 · received 2m ago' },
		{ id: 'billing', name: 'Billing provider', status: 'healthy', detail: 'Webhook delivery healthy' },
		{ id: 'support', name: 'Support desk', status: 'healthy', detail: 'Event stream healthy' },
		{ id: 'mail', name: 'Lifecycle mail', status: 'healthy', detail: 'Verified sender · eu-west-1' },
		{ id: 'tasks', name: 'Operating tasks', status: 'healthy', detail: 'Product operations workspace' },
		{ id: 'messaging', name: 'Team messaging', status: 'healthy', detail: 'Three approved channels' },
		{ id: 'crm', name: 'Customer CRM', status: 'healthy', detail: 'Write scope: account health' },
	],
});

const fixtures = Object.freeze({
	'northstar-inactive': {
		id: 'evt_trial_9812',
		eventType: 'trial.inactive',
		account: { id: 'acc_northstar', name: 'Northstar Labs', plan: 'growth', lastActiveDays: 7, health: 'at_risk', priority: 'normal', owner: 'Maya Chen' },
	},
	'orbit-active': {
		id: 'evt_usage_7731',
		eventType: 'usage.dropped',
		account: { id: 'acc_orbit', name: 'Orbit Systems', plan: 'enterprise', lastActiveDays: 0, health: 'healthy', priority: 'normal', owner: 'Jon Bell' },
	},
	'acme-failed-invoice': {
		id: 'evt_invoice_4428',
		eventType: 'invoice.failed',
		account: { id: 'acc_acme', name: 'Acme Fieldworks', plan: 'enterprise', lastActiveDays: 2, health: 'at_risk', priority: 'high', owner: 'Jon Bell' },
	},
});

const currentOperator = Object.freeze({ id: 'maya', name: 'Maya Chen', initials: 'MC', role: 'Lifecycle operations lead' });

let receiptSequence = 6100;
let eventSequence = 1400;
let testSequence = 870;
let state = createInitialState();
const draftPreviews = new Map();
const releasePreviews = new Map();

/**
 * Returns workflow summaries, catalogs, and authoritative workspace context.
 *
 * @returns {Record<string, unknown>} Automation workspace bootstrap payload.
 */
export function getWorkflowAutomationWorkspace() {
	return serializeWorkspace();
}

/**
 * Returns one complete workflow definition and execution evidence.
 *
 * @param {string} workflowId Stable workflow identifier.
 * @returns {Record<string, unknown>} Workflow detail or API error.
 */
export function getWorkflowAutomationWorkflow(workflowId) {
	const workflow = findWorkflow(workflowId);
	if (!workflow) return notFound('Workflow');
	return {
		workspaceRevision: state.revision,
		workflow: serializeWorkflow(workflow),
	};
}

/**
 * Validates and locks an exact workflow draft before persistence.
 *
 * @param {string} workflowId Stable workflow identifier.
 * @param {Record<string, unknown>} input Draft and optimistic concurrency values.
 * @returns {Record<string, unknown>} Immutable draft preview or API error.
 */
export function previewWorkflowAutomationDraft(workflowId, input = {}) {
	const workflow = findWorkflow(workflowId);
	if (!workflow) return notFound('Workflow');
	const conflict = exactMutation(workflow, input);
	if (conflict) return conflict;

	const draft = normalizeDraft(input.draft);
	const fields = validateDraft(draft);
	if (Object.keys(fields).length) return validationError(fields);

	const previousSummary = configurationSummary(workflow);
	const proposedSummary = configurationSummary(draft);
	const changes = draftChanges(workflow, draft);
	const checksum = checksumFor({
		workflowId,
		workspaceRevision: state.revision,
		workflowVersion: workflow.version,
		draft,
	});
	const preview = {
		id: `draft-${checksum.slice(-8)}`,
		checksum,
		workflowId,
		workspaceRevision: state.revision,
		workflowVersion: workflow.version,
		draft,
		previousSummary,
		proposedSummary,
		changes,
		checks: draftChecks(draft),
		createdAt: nowIso(),
	};
	draftPreviews.set(checksum, clone(preview));
	return { preview };
}

/**
 * Saves an acknowledged exact workflow draft and advances its version.
 *
 * @param {string} workflowId Stable workflow identifier.
 * @param {Record<string, unknown>} input Exact preview checksum and revisions.
 * @returns {Record<string, unknown>} Updated workspace, workflow, and save receipt.
 */
export function saveWorkflowAutomationDraft(workflowId, input = {}) {
	const workflow = findWorkflow(workflowId);
	if (!workflow) return notFound('Workflow');
	const conflict = exactMutation(workflow, input);
	if (conflict) return conflict;
	if (input.acknowledged !== true) return validationError({ acknowledged: ['Acknowledge the exact workflow definition before saving this draft.'] });

	const checksum = normalizeText(input.previewChecksum, 120);
	const preview = draftPreviews.get(checksum);
	if (!preview || preview.workflowId !== workflowId) return validationError({ previewChecksum: ['Preview this exact draft again before saving.'] });
	if (preview.workspaceRevision !== state.revision || preview.workflowVersion !== workflow.version) {
		return conflictError('The workflow changed after this preview. Reload it and review the draft again.');
	}

	Object.assign(workflow, clone(preview.draft));
	workflow.version += 1;
	workflow.updatedLabel = 'Just now';
	workflow.latestTest = workflow.latestTest ? { ...workflow.latestTest, current: false } : null;
	state.revision += 1;
	receiptSequence += 1;
	const receipt = {
		id: `draft-save-${receiptSequence}`,
		type: 'workflow.draft.saved',
		workflowId,
		workflowVersion: workflow.version,
		workspaceRevision: state.revision,
		definitionChecksum: preview.checksum,
		changeCount: preview.changes.length,
		auditReceipt: `audit:workflow-draft-${receiptSequence}`,
		createdAt: nowIso(),
	};
	workflow.lastDraftReceipt = receipt;
	appendActivity(workflow, 'Saved workflow draft', `${preview.changes.length} configuration changes · version ${workflow.version}`);
	draftPreviews.delete(checksum);
	releasePreviews.clear();
	return { ...serializeWorkspace(), workflow: serializeWorkflow(workflow), receipt: clone(receipt) };
}

/**
 * Executes a side-effect-free sample event against the current workflow version.
 *
 * @param {string} workflowId Stable workflow identifier.
 * @param {Record<string, unknown>} input Fixture identifier and exact revisions.
 * @returns {Record<string, unknown>} Test trace and updated workflow evidence.
 */
export function testWorkflowAutomation(workflowId, input = {}) {
	const workflow = findWorkflow(workflowId);
	if (!workflow) return notFound('Workflow');
	const conflict = exactMutation(workflow, input);
	if (conflict) return conflict;

	const fixtureId = normalizeText(input.fixtureId, 80);
	const fixture = fixtures[fixtureId];
	if (!fixture) return validationError({ fixtureId: ['Choose an available sample event.'] });

	const triggerPassed = fixture.eventType === workflow.triggerId;
	const conditionResults = workflow.conditions.map((condition) => evaluateCondition(condition, fixture.account));
	const conditionsPassed = workflow.matchMode === 'any' ? conditionResults.some((result) => result.passed) : conditionResults.every((result) => result.passed);
	const routePassed = triggerPassed && conditionsPassed;
	const actionConnectionChecks = workflow.actions.filter((action) => action.enabled).map((action) => ({
		action,
		connection: connectionFor(actionTypeFor(action.type)?.connectionId),
	}));
	const connectionsPassed = actionConnectionChecks.every((entry) => entry.connection?.status === 'healthy');
	const passed = routePassed && connectionsPassed && actionConnectionChecks.length > 0;

	testSequence += 1;
	const trace = [
		{
			id: `step-trigger-${testSequence}`,
			kind: 'trigger',
			label: triggerLabel(workflow.triggerId),
			status: triggerPassed ? 'passed' : 'stopped',
			durationMs: 18,
			output: { eventId: fixture.id, receivedType: fixture.eventType, expectedType: workflow.triggerId, accountId: fixture.account.id },
		},
		{
			id: `step-rules-${testSequence}`,
			kind: 'condition',
			label: `${workflow.matchMode === 'all' ? 'All' : 'Any'} conditions`,
			status: triggerPassed && conditionsPassed ? 'passed' : 'stopped',
			durationMs: 4,
			output: { matched: conditionsPassed, mode: workflow.matchMode, checks: conditionResults },
		},
		...actionConnectionChecks.map((entry, index) => ({
			id: `step-action-${testSequence}-${index + 1}`,
			kind: 'action',
			label: actionTypeFor(entry.action.type)?.label || entry.action.type,
			status: routePassed && entry.connection?.status === 'healthy' ? 'simulated' : 'skipped',
			durationMs: 21 + (index * 7),
			output: {
				sideEffect: false,
				connection: entry.connection?.name || 'Missing connection',
				target: actionTargetLabel(entry.action.type, entry.action.target),
				accountId: fixture.account.id,
			},
		})),
	];
	const checksum = checksumFor({ workflowId, workflowVersion: workflow.version, fixtureId, trace });
	const testRun = {
		id: `test-${testSequence}`,
		workflowId,
		workflowVersion: workflow.version,
		fixtureId,
		fixtureLabel: catalog.fixtures.find((option) => option.value === fixtureId)?.label || fixtureId,
		fixture: clone(fixture),
		passed,
		matched: routePassed,
		status: passed ? 'passed' : routePassed ? 'failed' : 'stopped',
		trace,
		checksum,
		sideEffectsExecuted: 0,
		createdAt: nowIso(),
		current: true,
	};
	workflow.latestTest = testRun;
	workflow.testRuns.unshift(testRun);
	workflow.testRuns = workflow.testRuns.slice(0, 8);
	state.revision += 1;
	appendActivity(workflow, 'Ran safe workflow test', `${testRun.fixtureLabel} · ${testRun.status} · no side effects`);
	releasePreviews.clear();
	return {
		...serializeWorkspace(),
		workflow: serializeWorkflow(workflow),
		testRun: clone(testRun),
	};
}

/**
 * Builds an immutable release preview for the current tested workflow version.
 *
 * @param {string} workflowId Stable workflow identifier.
 * @param {Record<string, unknown>} input Exact workspace and workflow revisions.
 * @returns {Record<string, unknown>} Release preview or API error.
 */
export function previewWorkflowAutomationRelease(workflowId, input = {}) {
	const workflow = findWorkflow(workflowId);
	if (!workflow) return notFound('Workflow');
	const conflict = exactMutation(workflow, input);
	if (conflict) return conflict;

	const connections = requiredConnections(workflow);
	const checks = [
		{ key: 'changes', label: 'Draft differs from the published version', passed: workflow.version > workflow.publishedVersion, detail: `Draft v${workflow.version} · published v${workflow.publishedVersion || 'none'}` },
		{ key: 'test', label: 'Current version passed a safe test', passed: workflow.latestTest?.workflowVersion === workflow.version && workflow.latestTest?.passed === true, detail: workflow.latestTest ? `${workflow.latestTest.id} · ${workflow.latestTest.fixtureLabel}` : 'No current test evidence' },
		{ key: 'connections', label: 'Every required connection is healthy', passed: connections.every((connection) => connection?.status === 'healthy'), detail: connections.map((connection) => `${connection?.name || 'Missing'}: ${connection?.status || 'missing'}`).join(' · ') },
		{ key: 'owner', label: 'An accountable owner is assigned', passed: Boolean(ownerFor(workflow.ownerId)), detail: ownerFor(workflow.ownerId)?.label || 'Unassigned' },
		{ key: 'actions', label: 'At least one action is enabled', passed: workflow.actions.some((action) => action.enabled), detail: `${workflow.actions.filter((action) => action.enabled).length} enabled actions` },
		{ key: 'throttle', label: 'Repeat-run protection is configured', passed: workflow.throttleHours >= 4, detail: `${workflow.throttleHours} hour minimum wait` },
	];
	const checksum = checksumFor({
		workflowId,
		workspaceRevision: state.revision,
		workflowVersion: workflow.version,
		publishedVersion: workflow.publishedVersion,
		latestTestChecksum: workflow.latestTest?.checksum || null,
		configuration: configurationSummary(workflow),
	});
	const preview = {
		id: `release-${checksum.slice(-8)}`,
		checksum,
		workflowId,
		workspaceRevision: state.revision,
		workflowVersion: workflow.version,
		publishedVersion: workflow.publishedVersion,
		statusAfterRelease: workflow.enabledAfterRelease ? 'active' : 'paused',
		original: workflow.publishedSnapshot?.summary || 'No published workflow version.',
		proposed: configurationSummary(workflow),
		checks,
		blockingChecks: checks.filter((check) => !check.passed).map((check) => check.key),
		createdAt: nowIso(),
	};
	releasePreviews.set(checksum, clone(preview));
	return { preview };
}

/**
 * Publishes one exact acknowledged workflow release and creates immutable proof.
 *
 * @param {string} workflowId Stable workflow identifier.
 * @param {Record<string, unknown>} input Exact preview checksum and revisions.
 * @returns {Record<string, unknown>} Updated workflow and release receipt.
 */
export function publishWorkflowAutomation(workflowId, input = {}) {
	const workflow = findWorkflow(workflowId);
	if (!workflow) return notFound('Workflow');
	const conflict = exactMutation(workflow, input);
	if (conflict) return conflict;
	if (input.acknowledged !== true) return validationError({ acknowledged: ['Acknowledge the tested definition, connections, throttle, and release state before publishing.'] });

	const checksum = normalizeText(input.previewChecksum, 120);
	const preview = releasePreviews.get(checksum);
	if (!preview || preview.workflowId !== workflowId) return validationError({ previewChecksum: ['Generate this exact release preview again before publishing.'] });
	if (preview.workspaceRevision !== state.revision || preview.workflowVersion !== workflow.version) {
		return conflictError('The workflow changed after this release preview. Reload it and generate another preview.');
	}
	if (preview.blockingChecks.length) return validationError({ previewChecksum: ['Resolve every failed release check before publishing.'] });

	workflow.publishedVersion = workflow.version;
	workflow.status = preview.statusAfterRelease;
	workflow.publishedSnapshot = { version: workflow.version, summary: preview.proposed, checksum: preview.checksum, publishedAt: nowIso() };
	state.revision += 1;
	receiptSequence += 1;
	const receipt = {
		id: `workflow-release-${receiptSequence}`,
		type: 'workflow.published',
		workflowId,
		workflowVersion: workflow.version,
		workspaceRevision: state.revision,
		status: workflow.status,
		releaseChecksum: preview.checksum,
		testChecksum: workflow.latestTest.checksum,
		auditReceipt: `audit:workflow-release-${receiptSequence}`,
		runtimeReceipt: `runtime:automation-${receiptSequence}`,
		createdAt: nowIso(),
	};
	workflow.releaseReceipt = receipt;
	appendActivity(workflow, 'Published workflow release', `Version ${workflow.version} · ${workflow.status} · ${receipt.runtimeReceipt}`);
	releasePreviews.delete(checksum);
	return { ...serializeWorkspace(), workflow: serializeWorkflow(workflow), receipt: clone(receipt) };
}

/**
 * Restores the deterministic workflow-automation demonstration state.
 *
 * @returns {Record<string, unknown>} Reset automation workspace.
 */
export function resetWorkflowAutomationWorkspace() {
	state = createInitialState();
	draftPreviews.clear();
	releasePreviews.clear();
	return serializeWorkspace();
}

/**
 * Creates the deterministic process-local workflow state.
 *
 * @returns {Record<string, unknown>} Mutable automation state.
 */
function createInitialState() {
	return {
		revision: 21,
		selectedWorkflowId: 'trial-rescue',
		workflows: [
			{
				id: 'trial-rescue',
				version: 12,
				publishedVersion: 11,
				status: 'active',
				name: 'Trial rescue',
				description: 'Re-engage promising trials after product activity drops.',
				ownerId: 'maya',
				triggerId: 'trial.inactive',
				throttleHours: 24,
				matchMode: 'all',
				enabledAfterRelease: true,
				conditions: [
					{ id: 'cond_plan', field: 'plan', operator: 'equals', value: 'growth' },
					{ id: 'cond_activity', field: 'lastActiveDays', operator: 'greater_than', value: '5' },
				],
				actions: [
					{ id: 'act_email', type: 'send_email', target: 'trial_nudge_v3', enabled: true },
					{ id: 'act_task', type: 'create_task', target: 'lifecycle_followup', enabled: true },
				],
				metrics: { runsThisMonth: 1240, successRate: 98.8, medianDurationMs: 184 },
				publishedSnapshot: { version: 11, summary: 'When a trial became inactive, match Growth plans inactive over 5 days, then send Trial nudge v2 and create Lifecycle follow-up. Wait 12 hours between runs.', checksum: 'sha256:demo-published-v11', publishedAt: '2026-07-24T10:18:00.000Z' },
				latestTest: { id: 'test-842', workflowVersion: 11, fixtureLabel: 'Northstar Labs · inactive trial', passed: true, checksum: 'sha256:demo-test-v11', current: false, createdAt: '2026-07-24T10:12:00.000Z' },
				testRuns: [],
				productionRuns: [
					{ id: 'run_9981', status: 'success', record: 'Lucent Health', startedAt: 'Today 10:42', duration: '172ms', version: 11 },
					{ id: 'run_9978', status: 'success', record: 'Fieldwork OS', startedAt: 'Today 09:18', duration: '189ms', version: 11 },
					{ id: 'run_9966', status: 'failed', record: 'Atlas Deck', startedAt: 'Yesterday', duration: '2.4s', version: 11, error: 'Mail provider returned 429; retry queued.' },
				],
				activity: [
					{ id: 'event_1403', title: 'Draft changed', detail: 'Throttle increased from 12 to 24 hours and email template moved to v3.', actor: 'Maya Chen', time: '28m' },
					{ id: 'event_1402', title: 'Production retry completed', detail: 'run_9966 succeeded on its second provider attempt.', actor: 'Workflow runtime', time: 'Yesterday' },
					{ id: 'event_1401', title: 'Version 11 published', detail: 'Two conditions and two actions released to production.', actor: 'Maya Chen', time: 'Jul 24' },
				],
				updatedLabel: '28m',
				lastDraftReceipt: null,
				releaseReceipt: null,
			},
			{
				id: 'payment-recovery',
				version: 4,
				publishedVersion: 0,
				status: 'draft',
				name: 'Payment recovery',
				description: 'Create accountable follow-up after a provider payment failure.',
				ownerId: 'jon',
				triggerId: 'invoice.failed',
				throttleHours: 12,
				matchMode: 'all',
				enabledAfterRelease: true,
				conditions: [{ id: 'cond_payment_plan', field: 'plan', operator: 'equals', value: 'enterprise' }],
				actions: [
					{ id: 'act_payment_task', type: 'create_task', target: 'finance_recovery', enabled: true },
					{ id: 'act_payment_alert', type: 'post_alert', target: 'revops_alerts', enabled: true },
				],
				metrics: { runsThisMonth: 0, successRate: 0, medianDurationMs: 0 },
				publishedSnapshot: null,
				latestTest: null,
				testRuns: [],
				productionRuns: [],
				activity: [{ id: 'event_1411', title: 'Draft created', detail: 'Started from the failed-payment recovery template.', actor: 'Jon Bell', time: 'Today' }],
				updatedLabel: 'Today',
				lastDraftReceipt: null,
				releaseReceipt: null,
			},
			{
				id: 'urgent-ticket-handoff',
				version: 8,
				publishedVersion: 8,
				status: 'paused',
				name: 'Urgent ticket handoff',
				description: 'Route urgent at-risk accounts into the support war room.',
				ownerId: 'nora',
				triggerId: 'ticket.priority_changed',
				throttleHours: 4,
				matchMode: 'all',
				enabledAfterRelease: false,
				conditions: [
					{ id: 'cond_ticket_priority', field: 'priority', operator: 'equals', value: 'urgent' },
					{ id: 'cond_ticket_health', field: 'health', operator: 'equals', value: 'at_risk' },
				],
				actions: [
					{ id: 'act_ticket_alert', type: 'post_alert', target: 'support_war_room', enabled: true },
					{ id: 'act_ticket_update', type: 'update_account', target: 'escalation_open', enabled: true },
				],
				metrics: { runsThisMonth: 312, successRate: 94.2, medianDurationMs: 241 },
				publishedSnapshot: { version: 8, summary: 'When a ticket became urgent, match urgent priority and at-risk health, then alert #support-war-room and set Escalation to Open. Wait 4 hours between runs.', checksum: 'sha256:demo-published-v8', publishedAt: '2026-07-18T15:22:00.000Z' },
				latestTest: { id: 'test-814', workflowVersion: 8, fixtureLabel: 'Support escalation fixture', passed: true, checksum: 'sha256:demo-test-v8', current: true, createdAt: '2026-07-18T15:18:00.000Z' },
				testRuns: [],
				productionRuns: [{ id: 'run_9821', status: 'success', record: 'Mariner Cloud', startedAt: 'Jul 30', duration: '233ms', version: 8 }],
				activity: [{ id: 'event_1421', title: 'Workflow paused', detail: 'Support policy review opened for urgent account handoffs.', actor: 'Nora Lee', time: 'Yesterday' }],
				updatedLabel: 'Yesterday',
				lastDraftReceipt: null,
				releaseReceipt: null,
			},
		],
	};
}

/**
 * Serializes workspace navigation, catalogs, and aggregate metrics.
 *
 * @returns {Record<string, unknown>} Display-ready workspace payload.
 */
function serializeWorkspace() {
	const summaries = state.workflows.map((workflow) => serializeWorkflowSummary(workflow));
	return {
		workspace: {
			revision: state.revision,
			name: 'Northstar automation',
			operator: clone(currentOperator),
			selectedWorkflowId: state.selectedWorkflowId,
			counts: {
				total: summaries.length,
				active: summaries.filter((workflow) => workflow.status === 'active').length,
				draft: summaries.filter((workflow) => workflow.status === 'draft').length,
				paused: summaries.filter((workflow) => workflow.status === 'paused').length,
			},
		},
		catalog: clone(catalog),
		workflows: summaries,
	};
}

/**
 * Serializes one workflow with display metadata and evidence.
 *
 * @param {Record<string, unknown>} workflow Workflow record.
 * @returns {Record<string, unknown>} Display-ready workflow.
 */
function serializeWorkflow(workflow) {
	return {
		...serializeWorkflowSummary(workflow),
		description: workflow.description,
		ownerId: workflow.ownerId,
		triggerId: workflow.triggerId,
		throttleHours: workflow.throttleHours,
		matchMode: workflow.matchMode,
		enabledAfterRelease: workflow.enabledAfterRelease,
		conditions: clone(workflow.conditions),
		actions: clone(workflow.actions),
		publishedSnapshot: clone(workflow.publishedSnapshot),
		latestTest: clone(workflow.latestTest),
		testRuns: clone(workflow.testRuns),
		productionRuns: clone(workflow.productionRuns),
		activity: clone(workflow.activity),
		lastDraftReceipt: clone(workflow.lastDraftReceipt),
		releaseReceipt: clone(workflow.releaseReceipt),
		configurationSummary: configurationSummary(workflow),
		requiredConnections: requiredConnections(workflow).map((connection) => clone(connection)),
	};
}

/**
 * Serializes a compact workflow navigation summary.
 *
 * @param {Record<string, unknown>} workflow Workflow record.
 * @returns {Record<string, unknown>} Workflow summary.
 */
function serializeWorkflowSummary(workflow) {
	return {
		id: workflow.id,
		version: workflow.version,
		publishedVersion: workflow.publishedVersion,
		status: workflow.status,
		name: workflow.name,
		description: workflow.description,
		ownerName: ownerFor(workflow.ownerId)?.label || 'Unassigned',
		ownerInitials: ownerFor(workflow.ownerId)?.initials || '—',
		triggerName: triggerLabel(workflow.triggerId),
		metrics: clone(workflow.metrics),
		updatedLabel: workflow.updatedLabel,
		hasUnpublishedChanges: workflow.version > workflow.publishedVersion,
	};
}

/**
 * Normalizes an untrusted workflow draft.
 *
 * @param {unknown} value Untrusted workflow draft.
 * @returns {Record<string, unknown>} Normalized draft.
 */
function normalizeDraft(value) {
	const draft = value && typeof value === 'object' ? value : {};
	return {
		name: normalizeText(draft.name, 80),
		description: normalizeText(draft.description, 180),
		ownerId: normalizeText(draft.ownerId, 40),
		triggerId: normalizeText(draft.triggerId, 80),
		throttleHours: Math.round(Number(draft.throttleHours)),
		matchMode: normalizeText(draft.matchMode, 20),
		enabledAfterRelease: draft.enabledAfterRelease === true,
		conditions: Array.isArray(draft.conditions) ? draft.conditions.slice(0, 6).map((condition, index) => ({
			id: normalizeText(condition.id, 60) || `condition_${index + 1}`,
			field: normalizeText(condition.field, 60),
			operator: normalizeText(condition.operator, 60),
			value: normalizeText(condition.value, 80),
		})) : [],
		actions: Array.isArray(draft.actions) ? draft.actions.slice(0, 6).map((action, index) => ({
			id: normalizeText(action.id, 60) || `action_${index + 1}`,
			type: normalizeText(action.type, 60),
			target: normalizeText(action.target, 100),
			enabled: action.enabled === true,
		})) : [],
	};
}

/**
 * Validates one normalized workflow draft against server-owned catalogs.
 *
 * @param {Record<string, unknown>} draft Normalized workflow draft.
 * @returns {Record<string, string[]>} Field-level validation errors.
 */
function validateDraft(draft) {
	const fields = {};
	if (draft.name.length < 4) fields.name = ['Use at least four characters for the workflow name.'];
	if (draft.description.length < 12) fields.description = ['Explain the workflow outcome using at least 12 characters.'];
	if (!ownerFor(draft.ownerId)) fields.ownerId = ['Choose an accountable workflow owner.'];
	if (!triggerFor(draft.triggerId)) fields.triggerId = ['Choose a supported trigger event.'];
	if (!catalog.matchModes.some((option) => option.value === draft.matchMode)) fields.matchMode = ['Choose supported condition logic.'];
	if (!Number.isFinite(draft.throttleHours) || draft.throttleHours < 4 || draft.throttleHours > 72) fields.throttleHours = ['Choose a repeat-run wait from 4 to 72 hours.'];
	if (!draft.conditions.length) fields.conditions = ['Add at least one condition.'];
	if (!draft.actions.length) fields.actions = ['Add at least one action.'];
	if (!draft.actions.some((action) => action.enabled)) fields.actions = ['Enable at least one action.'];

	for (const [index, condition] of draft.conditions.entries()) {
		const field = fieldFor(condition.field);
		if (!field) {
			fields[`conditions.${index}.field`] = ['Choose a supported event field.'];
			continue;
		}
		if (!field.operators.some((operator) => operator.value === condition.operator)) fields[`conditions.${index}.operator`] = ['Choose an operator supported by this field.'];
		if (!field.values.some((option) => option.value === condition.value)) fields[`conditions.${index}.value`] = ['Choose a value supported by this field.'];
	}

	for (const [index, action] of draft.actions.entries()) {
		const actionType = actionTypeFor(action.type);
		if (!actionType) {
			fields[`actions.${index}.type`] = ['Choose a supported workflow action.'];
			continue;
		}
		if (!actionType.targets.some((option) => option.value === action.target)) fields[`actions.${index}.target`] = ['Choose a destination supported by this action.'];
	}
	return fields;
}

/**
 * Returns readiness checks for a normalized workflow draft.
 *
 * @param {Record<string, unknown>} draft Normalized workflow draft.
 * @returns {Array<Record<string, unknown>>} Draft readiness checks.
 */
function draftChecks(draft) {
	return [
		{ label: 'Trigger schema is supported', passed: Boolean(triggerFor(draft.triggerId)) },
		{ label: 'Condition grammar is valid', passed: draft.conditions.every((condition) => Boolean(fieldFor(condition.field))) },
		{ label: 'Action destinations are explicit', passed: draft.actions.every((action) => Boolean(actionTypeFor(action.type)?.targets.some((target) => target.value === action.target))) },
		{ label: 'Repeat-run protection is active', passed: draft.throttleHours >= 4 },
		{ label: 'Accountable owner is assigned', passed: Boolean(ownerFor(draft.ownerId)) },
	];
}

/**
 * Returns human-readable changes between a workflow and proposed draft.
 *
 * @param {Record<string, unknown>} workflow Existing workflow.
 * @param {Record<string, unknown>} draft Proposed workflow draft.
 * @returns {string[]} Change summaries.
 */
function draftChanges(workflow, draft) {
	const changes = [];
	if (workflow.name !== draft.name) changes.push(`Name: ${workflow.name} → ${draft.name}`);
	if (workflow.description !== draft.description) changes.push('Outcome description changed');
	if (workflow.ownerId !== draft.ownerId) changes.push(`Owner: ${ownerFor(workflow.ownerId)?.label || 'Unassigned'} → ${ownerFor(draft.ownerId)?.label || 'Unassigned'}`);
	if (workflow.triggerId !== draft.triggerId) changes.push(`Trigger: ${triggerLabel(workflow.triggerId)} → ${triggerLabel(draft.triggerId)}`);
	if (workflow.throttleHours !== draft.throttleHours) changes.push(`Throttle: ${workflow.throttleHours}h → ${draft.throttleHours}h`);
	if (workflow.matchMode !== draft.matchMode) changes.push(`Condition logic: ${workflow.matchMode} → ${draft.matchMode}`);
	if (workflow.enabledAfterRelease !== draft.enabledAfterRelease) changes.push(`Release state: ${draft.enabledAfterRelease ? 'active' : 'paused'}`);
	if (JSON.stringify(workflow.conditions) !== JSON.stringify(draft.conditions)) changes.push('Condition path changed');
	if (JSON.stringify(workflow.actions) !== JSON.stringify(draft.actions)) changes.push('Action sequence changed');
	return changes.length ? changes : ['No definition changes'];
}

/**
 * Creates a readable workflow definition summary.
 *
 * @param {Record<string, unknown>} workflow Workflow or normalized draft.
 * @returns {string} Human-readable workflow definition.
 */
function configurationSummary(workflow) {
	const conditions = (workflow.conditions || []).map((condition) => `${fieldFor(condition.field)?.label || condition.field} ${operatorLabel(condition.field, condition.operator)} ${fieldValueLabel(condition.field, condition.value)}`).join(workflow.matchMode === 'any' ? ' OR ' : ' AND ');
	const actions = (workflow.actions || []).filter((action) => action.enabled).map((action) => `${actionTypeFor(action.type)?.label || action.type} → ${actionTargetLabel(action.type, action.target)}`).join(', then ');
	return `When ${triggerLabel(workflow.triggerId)}, ${workflow.matchMode === 'any' ? 'match any' : 'match all'}: ${conditions}. Then ${actions}. Wait ${workflow.throttleHours} hours between runs.`;
}

/**
 * Evaluates one condition against a fixture account.
 *
 * @param {Record<string, unknown>} condition Workflow condition.
 * @param {Record<string, unknown>} account Fixture account values.
 * @returns {Record<string, unknown>} Condition evaluation evidence.
 */
function evaluateCondition(condition, account) {
	const actual = account[condition.field];
	const expected = condition.field === 'lastActiveDays' ? Number(condition.value) : condition.value;
	let passed = false;
	if (condition.operator === 'equals') passed = actual === expected;
	if (condition.operator === 'not_equals') passed = actual !== expected;
	if (condition.operator === 'greater_than') passed = Number(actual) > Number(expected);
	if (condition.operator === 'less_than') passed = Number(actual) < Number(expected);
	return {
		conditionId: condition.id,
		field: condition.field,
		operator: condition.operator,
		expected,
		actual,
		passed,
	};
}

/**
 * Returns unique trigger and action connections required by a workflow.
 *
 * @param {Record<string, unknown>} workflow Workflow definition.
 * @returns {Array<Record<string, unknown> | null>} Required connections.
 */
function requiredConnections(workflow) {
	const ids = new Set([triggerFor(workflow.triggerId)?.connectionId]);
	for (const action of workflow.actions || []) {
		if (action.enabled) ids.add(actionTypeFor(action.type)?.connectionId);
	}
	return [...ids].filter(Boolean).map((connectionId) => connectionFor(connectionId));
}

/**
 * Adds an immutable activity entry to one workflow.
 *
 * @param {Record<string, unknown>} workflow Workflow record.
 * @param {string} title Activity title.
 * @param {string} detail Activity detail.
 * @returns {void}
 */
function appendActivity(workflow, title, detail) {
	eventSequence += 1;
	workflow.activity.unshift({ id: `event_${eventSequence}`, title, detail, actor: currentOperator.name, time: 'Just now' });
}

/**
 * Validates exact workspace and workflow versions for one mutation.
 *
 * @param {Record<string, unknown>} workflow Current workflow record.
 * @param {Record<string, unknown>} input Mutation concurrency values.
 * @returns {Record<string, unknown> | null} Conflict response when stale.
 */
function exactMutation(workflow, input) {
	if (Number(input.workspaceRevision) !== state.revision) return conflictError(`Workspace revision changed to ${state.revision}. Reload automations.`);
	if (Number(input.workflowVersion) !== workflow.version) return conflictError(`${workflow.name} changed to version ${workflow.version}. Reload this workflow.`);
	return null;
}

/**
 * Finds one workflow by stable identifier.
 *
 * @param {string} workflowId Stable workflow identifier.
 * @returns {Record<string, unknown> | null} Matching workflow or null.
 */
function findWorkflow(workflowId) {
	return state.workflows.find((workflow) => workflow.id === workflowId) || null;
}

/**
 * Finds one owner catalog entry.
 *
 * @param {string} ownerId Stable owner identifier.
 * @returns {Record<string, unknown> | null} Matching owner or null.
 */
function ownerFor(ownerId) {
	return catalog.owners.find((owner) => owner.value === ownerId) || null;
}

/**
 * Finds one trigger catalog entry.
 *
 * @param {string} triggerId Stable trigger identifier.
 * @returns {Record<string, unknown> | null} Matching trigger or null.
 */
function triggerFor(triggerId) {
	return catalog.triggers.find((trigger) => trigger.value === triggerId) || null;
}

/**
 * Finds one condition field catalog entry.
 *
 * @param {string} fieldId Stable field identifier.
 * @returns {Record<string, unknown> | null} Matching field or null.
 */
function fieldFor(fieldId) {
	return catalog.fields.find((field) => field.value === fieldId) || null;
}

/**
 * Finds one action type catalog entry.
 *
 * @param {string} actionType Stable action type identifier.
 * @returns {Record<string, unknown> | null} Matching action type or null.
 */
function actionTypeFor(actionType) {
	return catalog.actionTypes.find((action) => action.value === actionType) || null;
}

/**
 * Finds one connection catalog entry.
 *
 * @param {string} connectionId Stable connection identifier.
 * @returns {Record<string, unknown> | null} Matching connection or null.
 */
function connectionFor(connectionId) {
	return catalog.connections.find((connection) => connection.id === connectionId) || null;
}

/**
 * Returns a trigger display label.
 *
 * @param {string} triggerId Stable trigger identifier.
 * @returns {string} Trigger label or identifier.
 */
function triggerLabel(triggerId) {
	return triggerFor(triggerId)?.label || triggerId;
}

/**
 * Returns an operator display label for one field.
 *
 * @param {string} fieldId Stable field identifier.
 * @param {string} operatorId Stable operator identifier.
 * @returns {string} Operator label or identifier.
 */
function operatorLabel(fieldId, operatorId) {
	return fieldFor(fieldId)?.operators.find((operator) => operator.value === operatorId)?.label || operatorId;
}

/**
 * Returns a display label for one field value.
 *
 * @param {string} fieldId Stable field identifier.
 * @param {string} value Stable field value.
 * @returns {string} Field value label or original value.
 */
function fieldValueLabel(fieldId, value) {
	return fieldFor(fieldId)?.values.find((option) => option.value === value)?.label || value;
}

/**
 * Returns a display label for one action target.
 *
 * @param {string} actionType Stable action type identifier.
 * @param {string} target Stable action target identifier.
 * @returns {string} Target label or original value.
 */
function actionTargetLabel(actionType, target) {
	return actionTypeFor(actionType)?.targets.find((option) => option.value === target)?.label || target;
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
 * Creates a deterministic checksum for exact preview evidence.
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
	return { error: 'validation_failed', status: 422, message: 'Review the highlighted automation fields.', fields };
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
