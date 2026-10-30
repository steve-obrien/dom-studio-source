const periodSeeds = [
	{
		id: '2026-06',
		label: 'June 2026',
		invoiceId: 'inv_2026_06_0042',
		provider: 'Metronome',
		status: 'grace',
		amount: 38412.80,
		closesAt: '13 Jun · 18:00 UTC',
		description: 'Draft invoice · correction window open',
	},
	{
		id: '2026-05',
		label: 'May 2026',
		invoiceId: 'inv_2026_05_0037',
		provider: 'Metronome',
		status: 'finalized',
		amount: 41108.24,
		closesAt: 'Finalized 13 May',
		description: 'Immutable invoice · 2 credit notes',
	},
	{
		id: '2026-04',
		label: 'April 2026',
		invoiceId: 'inv_2026_04_0031',
		provider: 'Metronome',
		status: 'finalized',
		amount: 36721.90,
		closesAt: 'Finalized 13 Apr',
		description: 'Immutable invoice · no exceptions',
	},
];

const caseSeeds = [
	{
		id: 'rec_2048',
		revision: 7,
		periodId: '2026-06',
		customerId: 'cus_northstar',
		customer: 'Northstar Analytics',
		plan: 'Enterprise',
		owner: 'Maya Chen',
		product: 'AI agents',
		meter: 'agent_minutes',
		source: 'Events API',
		status: 'open',
		severity: 'warning',
		invoiceHold: true,
		sourceTotal: 18420,
		ratedTotal: 17140,
		delta: 1280,
		invoiceDelta: 331.56,
		unit: 'minutes',
		reason: 'Backfill exceeded the contracted usage cap.',
		receivedAt: '12 Jun · 07:18',
		deadline: '6h 42m',
		assignee: null,
		rawEvent: {
			transactionId: 'evt_backfill_7712_18',
			eventName: 'agent_minutes',
			timestamp: '2026-06-11T23:58:12Z',
			schemaVersion: 'meter.v3',
			checksum: 'sha256:9a41…c208',
			dimensions: { region: 'eu-west', model: 'agent-pro', batch: 'backfill_7712' },
		},
		rating: {
			contractId: 'ctr_northstar_2026',
			metricId: 'metric_agent_minutes_v3',
			aggregation: 'sum',
			price: 0.25903125,
			currency: 'GBP',
			includedUnits: 17140,
		},
		timeline: [
			{ id: 'tl_2048_1', actor: 'Events API', action: 'Accepted backfill batch', detail: '1,280 units arrived after the hourly close.', createdAt: '12 Jun · 07:18' },
			{ id: 'tl_2048_2', actor: 'Reconciliation worker', action: 'Opened discrepancy', detail: 'Source total exceeded the contract baseline by 7.5%.', createdAt: '12 Jun · 07:19' },
			{ id: 'tl_2048_3', actor: 'Invoice service', action: 'Placed invoice hold', detail: 'June draft remains inside the correction window.', createdAt: '12 Jun · 07:19' },
		],
	},
	{
		id: 'rec_2053',
		revision: 3,
		periodId: '2026-06',
		customerId: 'cus_juniper',
		customer: 'Juniper Works',
		plan: 'Growth',
		owner: 'Ari Patel',
		product: 'API calls',
		meter: 'requests',
		source: 'Events API',
		status: 'schema-error',
		severity: 'danger',
		invoiceHold: true,
		sourceTotal: 221000,
		ratedTotal: 318000,
		delta: -97000,
		invoiceDelta: -77.60,
		unit: 'requests',
		reason: 'The batch omitted its tenant key and could not be attributed safely.',
		receivedAt: '10 Jun · 14:04',
		deadline: '2h 16m',
		assignee: 'Ari Patel',
		rawEvent: {
			transactionId: 'evt_api_6618',
			eventName: 'api_requests',
			timestamp: '2026-06-10T14:03:44Z',
			schemaVersion: 'meter.v2',
			checksum: 'sha256:63d2…5e10',
			dimensions: { region: 'us-east', tenant: null, batch: 'api_6618' },
		},
		rating: {
			contractId: 'ctr_juniper_growth',
			metricId: 'metric_api_requests_v4',
			aggregation: 'sum',
			price: 0.0008,
			currency: 'GBP',
			includedUnits: 318000,
		},
		timeline: [
			{ id: 'tl_2053_1', actor: 'Schema gateway', action: 'Rejected usage batch', detail: 'Required dimension tenant_id was missing.', createdAt: '10 Jun · 14:04' },
			{ id: 'tl_2053_2', actor: 'Invoice service', action: 'Placed invoice hold', detail: 'The unresolved batch could change the draft line item.', createdAt: '10 Jun · 14:05' },
		],
	},
	{
		id: 'rec_2050',
		revision: 4,
		periodId: '2026-06',
		customerId: 'cus_brightwell',
		customer: 'Brightwell Studio',
		plan: 'Growth',
		owner: 'Jon Bell',
		product: 'Storage',
		meter: 'gb_month',
		source: 'Storage ledger',
		status: 'open',
		severity: 'warning',
		invoiceHold: true,
		sourceTotal: 890,
		ratedTotal: 640,
		delta: 250,
		invoiceDelta: 112.50,
		unit: 'GB-month',
		reason: 'A retention policy changed in the middle of the billing cycle.',
		receivedAt: '11 Jun · 11:22',
		deadline: '1d 3h',
		assignee: 'Jon Bell',
		rawEvent: {
			transactionId: 'evt_storage_8801',
			eventName: 'storage_gb_month',
			timestamp: '2026-06-11T11:20:00Z',
			schemaVersion: 'storage.v2',
			checksum: 'sha256:188d…a91f',
			dimensions: { region: 'eu-west', tier: 'archive', batch: 'daily_0611' },
		},
		rating: {
			contractId: 'ctr_brightwell_growth',
			metricId: 'metric_storage_average_v2',
			aggregation: 'last',
			price: 0.45,
			currency: 'GBP',
			includedUnits: 640,
		},
		timeline: [
			{ id: 'tl_2050_1', actor: 'Storage ledger', action: 'Reported daily average', detail: 'Archive restore overlapped a retention-policy change.', createdAt: '11 Jun · 11:22' },
			{ id: 'tl_2050_2', actor: 'Reconciliation worker', action: 'Opened discrepancy', detail: '250 GB-month exceeds the contract baseline.', createdAt: '11 Jun · 11:23' },
		],
	},
	{
		id: 'rec_2051',
		revision: 5,
		periodId: '2026-06',
		customerId: 'cus_cinder',
		customer: 'Cinder Labs',
		plan: 'Scale',
		owner: 'Finance queue',
		product: 'Workflow runs',
		meter: 'runs',
		source: 'Scheduler',
		status: 'credit-pending',
		severity: 'info',
		invoiceHold: false,
		sourceTotal: 42100,
		ratedTotal: 46300,
		delta: -4200,
		invoiceDelta: -210,
		unit: 'runs',
		reason: 'Retry duplication was detected after the usage summary closed.',
		receivedAt: '11 Jun · 08:42',
		deadline: '2d 4h',
		assignee: null,
		rawEvent: {
			transactionId: 'evt_runs_retry_1142',
			eventName: 'workflow_runs',
			timestamp: '2026-06-11T08:40:02Z',
			schemaVersion: 'scheduler.v5',
			checksum: 'sha256:7dd8…301e',
			dimensions: { region: 'us-west', workflow: 'enrichment', batch: 'retry_1142' },
		},
		rating: {
			contractId: 'ctr_cinder_scale',
			metricId: 'metric_workflow_runs_v5',
			aggregation: 'count',
			price: 0.05,
			currency: 'GBP',
			includedUnits: 46300,
		},
		timeline: [
			{ id: 'tl_2051_1', actor: 'Deduplication worker', action: 'Flagged retry collision', detail: '4,200 runs share a completed source job.', createdAt: '11 Jun · 08:42' },
		],
	},
	{
		id: 'rec_2057',
		revision: 2,
		periodId: '2026-06',
		customerId: 'cus_copper',
		customer: 'Copper Bank',
		plan: 'Enterprise',
		owner: 'Security review',
		product: 'API calls',
		meter: 'requests',
		source: 'Edge counter',
		status: 'security-review',
		severity: 'danger',
		invoiceHold: true,
		sourceTotal: 1820000,
		ratedTotal: 1660000,
		delta: 160000,
		invoiceDelta: 128,
		unit: 'requests',
		reason: 'Traffic spike originated from an unverified client identifier.',
		receivedAt: '8 Jun · 18:28',
		deadline: '38m',
		assignee: 'Security review',
		rawEvent: {
			transactionId: 'evt_edge_spike_5019',
			eventName: 'api_requests',
			timestamp: '2026-06-08T18:27:19Z',
			schemaVersion: 'edge.v4',
			checksum: 'sha256:99bc…8d12',
			dimensions: { region: 'eu-central', client: 'unverified', batch: 'edge_5019' },
		},
		rating: {
			contractId: 'ctr_copper_enterprise',
			metricId: 'metric_api_requests_v4',
			aggregation: 'sum',
			price: 0.0008,
			currency: 'GBP',
			includedUnits: 1660000,
		},
		timeline: [
			{ id: 'tl_2057_1', actor: 'Anomaly service', action: 'Escalated traffic spike', detail: 'The client identifier is outside the contract allowlist.', createdAt: '8 Jun · 18:28' },
		],
	},
];

const actionOptions = [
	{ value: 'cancel_usage', label: 'Cancel excess usage', description: 'Append a cancelling meter event for the disputed units.' },
	{ value: 'add_usage', label: 'Add missing usage', description: 'Append a corrected event for units absent from the rated total.' },
	{ value: 'issue_credit', label: 'Issue invoice credit', description: 'Keep the usage ledger and apply a customer-facing credit.' },
	{ value: 'accept_rated', label: 'Accept rated usage', description: 'Record the discrepancy as expected without changing the invoice.' },
];

const reasonOptions = [
	{ value: 'duplicate', label: 'Duplicate or retry', description: 'The same underlying work was counted more than once.' },
	{ value: 'late_backfill', label: 'Late backfill', description: 'Usage arrived after the agreed reporting boundary.' },
	{ value: 'schema_mapping', label: 'Schema or mapping error', description: 'An event could not be attributed or rated correctly.' },
	{ value: 'service_credit', label: 'Service credit', description: 'A customer-facing credit is required for interrupted service.' },
];

let sequence = 10400;
let reconciliationState = createReconciliationState();

/**
 * Returns the complete usage reconciliation workspace.
 *
 * @returns {object} Reconciliation periods, cases, workflow options, and summary.
 */
export function getUsageReconciliationWorkspace() {
	return serializeWorkspace();
}

/**
 * Assigns one discrepancy case to the current billing operator.
 *
 * @param {string} caseId Reconciliation case identifier.
 * @param {Record<string, unknown>} input Exact case revision.
 * @returns {object} Updated workspace or API error.
 */
export function claimUsageReconciliationCase(caseId, input = {}) {
	const context = getMutableCase(caseId, input.revision);
	if (context.error) return context;
	if (context.case.release) return error('Released cases cannot be reassigned.', 409);
	if (context.case.assignee && context.case.assignee !== 'Maya Chen') return error(`This case is assigned to ${context.case.assignee}.`, 409);
	context.case.assignee = 'Maya Chen';
	context.case.status = context.case.status === 'schema-error' ? 'schema-error' : 'investigating';
	commitCase(context.case, 'Maya Chen', 'Claimed reconciliation case', 'Billing operations now owns the next decision.');
	return serializeWorkspace();
}

/**
 * Compares immutable source usage with the current rated invoice quantity.
 *
 * @param {string} caseId Reconciliation case identifier.
 * @param {Record<string, unknown>} input Exact case revision.
 * @returns {object} Updated workspace and comparison evidence or API error.
 */
export function compareUsageReconciliationCase(caseId, input = {}) {
	const context = getMutableCase(caseId, input.revision);
	if (context.error) return context;
	if (!context.case.assignee) return error('Claim the case before comparing evidence.', 409);
	if (context.case.release) return error('Released evidence is immutable.', 409);
	sequence += 1;
	context.case.comparison = {
		id: `cmp_${sequence}`,
		revision: context.case.revision + 1,
		sourceTotal: context.case.sourceTotal,
		ratedTotal: context.case.ratedTotal,
		delta: context.case.delta,
		invoiceDelta: context.case.invoiceDelta,
		segments: buildComparisonSegments(context.case),
		sourceChecksum: context.case.rawEvent.checksum,
		ratingContract: context.case.rating.contractId,
		createdAt: 'Just now',
	};
	commitCase(context.case, 'Reconciliation worker', 'Compared source and rated usage', `${formatNumber(Math.abs(context.case.delta))} ${context.case.unit} need a decision.`);
	return serializeWorkspace();
}

/**
 * Appends a proposed correction without mutating the original usage event.
 *
 * @param {string} caseId Reconciliation case identifier.
 * @param {Record<string, unknown>} input Resolution action, reason, note, and revision.
 * @returns {object} Updated workspace and adjustment proposal or API error.
 */
export function createUsageReconciliationAdjustment(caseId, input = {}) {
	const context = getMutableCase(caseId, input.revision);
	if (context.error) return context;
	if (!context.case.comparison || context.case.comparison.revision !== context.case.revision) return error('Compare current source and rated usage before proposing a resolution.', 409);
	if (context.case.release) return error('Released cases cannot be changed.', 409);
	const action = String(input.action || '');
	const reason = String(input.reason || '');
	const note = String(input.note || '').trim();
	if (!actionOptions.some((option) => option.value === action)) return error('Choose a supported resolution action.', 422);
	if (!reasonOptions.some((option) => option.value === reason)) return error('Choose a reconciliation reason.', 422);
	if (note.length < 12) return error('Add a reviewer note of at least 12 characters.', 422);
	const quantity = calculateAdjustmentQuantity(context.case, action);
	const amount = calculateAdjustmentAmount(context.case, action);
	sequence += 1;
	context.case.adjustment = {
		id: `adj_${sequence}`,
		revision: context.case.revision + 1,
		action,
		reason,
		note,
		quantity,
		amount,
		currency: 'GBP',
		sourceEventId: context.case.rawEvent.transactionId,
		appendOnly: true,
		createdBy: 'Maya Chen',
		createdAt: 'Just now',
	};
	context.case.invoicePreview = null;
	context.case.approval = null;
	context.case.validation = null;
	context.case.status = 'resolution-draft';
	commitCase(context.case, 'Maya Chen', 'Proposed append-only adjustment', `${optionLabel(actionOptions, action)} · ${formatMoney(amount)}`);
	return serializeWorkspace();
}

/**
 * Creates a deterministic invoice preview for the current adjustment revision.
 *
 * @param {string} caseId Reconciliation case identifier.
 * @param {Record<string, unknown>} input Exact case revision.
 * @returns {object} Updated workspace and invoice preview or API error.
 */
export function previewUsageReconciliationInvoice(caseId, input = {}) {
	const context = getMutableCase(caseId, input.revision);
	if (context.error) return context;
	if (!context.case.adjustment || context.case.adjustment.revision !== context.case.revision) return error('Save a current adjustment before previewing the invoice.', 409);
	if (context.case.release) return error('Released invoice evidence is immutable.', 409);
	const period = reconciliationState.periods.find((candidate) => candidate.id === context.case.periodId);
	const originalLineAmount = roundMoney(context.case.ratedTotal * context.case.rating.price);
	sequence += 1;
	context.case.invoicePreview = {
		id: `preview_${sequence}`,
		revision: context.case.revision + 1,
		adjustmentId: context.case.adjustment.id,
		invoiceId: period.invoiceId,
		originalInvoiceTotal: period.amount,
		originalLineAmount,
		adjustmentAmount: context.case.adjustment.amount,
		revisedLineAmount: roundMoney(originalLineAmount + context.case.adjustment.amount),
		revisedInvoiceTotal: roundMoney(period.amount + context.case.adjustment.amount),
		currency: 'GBP',
		taxRecalculated: true,
		provider: period.provider,
		createdAt: 'Just now',
	};
	context.case.approval = null;
	context.case.validation = null;
	context.case.status = requiresApproval(context.case) ? 'approval-needed' : 'ready-for-checks';
	commitCase(context.case, 'Invoice service', 'Generated revised invoice preview', `${period.invoiceId} · ${formatMoney(context.case.invoicePreview.revisedInvoiceTotal)}`);
	return serializeWorkspace();
}

/**
 * Requests finance approval for a material invoice correction.
 *
 * @param {string} caseId Reconciliation case identifier.
 * @param {Record<string, unknown>} input Exact case revision.
 * @returns {object} Updated workspace and approval request or API error.
 */
export function requestUsageReconciliationApproval(caseId, input = {}) {
	const context = getMutableCase(caseId, input.revision);
	if (context.error) return context;
	if (!context.case.invoicePreview || context.case.invoicePreview.revision !== context.case.revision) return error('Generate a current invoice preview before requesting approval.', 409);
	if (!requiresApproval(context.case)) return error('This correction is inside automated finance guardrails.', 422);
	if (context.case.release) return error('Released approvals are immutable.', 409);
	sequence += 1;
	context.case.approval = {
		id: `approval_${sequence}`,
		revision: context.case.revision + 1,
		status: 'pending',
		requestedBy: 'Maya Chen',
		reviewer: 'Finance controller',
		reason: `Invoice impact ${formatMoney(context.case.adjustment.amount)} exceeds the £250 manual threshold.`,
		createdAt: 'Just now',
	};
	context.case.validation = null;
	context.case.status = 'waiting-approval';
	commitCase(context.case, 'Maya Chen', 'Requested finance approval', `${context.case.customer} · Finance controller`);
	return serializeWorkspace();
}

/**
 * Records a finance decision for one current correction approval.
 *
 * @param {string} approvalId Approval identifier.
 * @param {Record<string, unknown>} input Approval decision.
 * @returns {object} Updated workspace or API error.
 */
export function decideUsageReconciliationApproval(approvalId, input = {}) {
	const targetCase = reconciliationState.cases.find((candidate) => candidate.approval?.id === approvalId);
	if (!targetCase) return error('Approval request not found.', 404);
	if (targetCase.release) return error('Released approvals are immutable.', 409);
	if (targetCase.approval.status !== 'pending') return error('This approval already has a decision.', 409);
	if (Number(input.revision) !== targetCase.revision || targetCase.approval.revision !== targetCase.revision) return conflict(targetCase);
	const decision = String(input.decision || '');
	if (!['approved', 'rejected'].includes(decision)) return error('Choose approve or reject.', 422);
	targetCase.approval.status = decision;
	targetCase.approval.decidedBy = 'Finance controller';
	targetCase.approval.decidedAt = 'Just now';
	targetCase.validation = null;
	targetCase.status = decision === 'approved' ? 'ready-for-checks' : 'resolution-draft';
	commitCase(targetCase, 'Finance controller', `${decision === 'approved' ? 'Approved' : 'Rejected'} invoice correction`, `${targetCase.customer} · ${formatMoney(targetCase.adjustment.amount)}`);
	return serializeWorkspace();
}

/**
 * Retries a schema-error event through a deterministic corrected payload.
 *
 * @param {string} caseId Reconciliation case identifier.
 * @param {Record<string, unknown>} input Exact case revision.
 * @returns {object} Updated workspace and replay receipt or API error.
 */
export function replayUsageReconciliationEvent(caseId, input = {}) {
	const context = getMutableCase(caseId, input.revision);
	if (context.error) return context;
	if (context.case.status !== 'schema-error') return error('Only schema-error cases can be replayed.', 422);
	if (!context.case.assignee) return error('Claim the case before replaying its event.', 409);
	sequence += 1;
	context.case.replay = {
		id: `replay_${sequence}`,
		revision: context.case.revision + 1,
		originalEventId: context.case.rawEvent.transactionId,
		correctedTransactionId: `${context.case.rawEvent.transactionId}_r1`,
		correctedDimension: 'tenant_id=cus_juniper',
		status: 'accepted',
		createdAt: 'Just now',
	};
	context.case.status = 'investigating';
	commitCase(context.case, 'Ingestion gateway', 'Accepted corrected event replay', context.case.replay.correctedTransactionId);
	return serializeWorkspace();
}

/**
 * Runs authoritative reconciliation, invoice, approval, and lifecycle checks.
 *
 * @param {string} caseId Reconciliation case identifier.
 * @param {Record<string, unknown>} input Exact case revision.
 * @returns {object} Updated workspace and validation evidence or API error.
 */
export function validateUsageReconciliationCase(caseId, input = {}) {
	const context = getMutableCase(caseId, input.revision);
	if (context.error) return context;
	if (context.case.release) return error('Released checks are immutable.', 409);
	const period = reconciliationState.periods.find((candidate) => candidate.id === context.case.periodId);
	const checks = [
		createCheck('source', 'Immutable source evidence', Boolean(context.case.comparison?.sourceChecksum), context.case.comparison?.sourceChecksum || 'Compare source usage first.'),
		createCheck('adjustment', 'Append-only adjustment', Boolean(context.case.adjustment?.appendOnly && context.case.adjustment.revision <= context.case.revision), context.case.adjustment?.id || 'Save a correction proposal.'),
		createCheck('preview', 'Current invoice preview', Boolean(context.case.invoicePreview?.adjustmentId === context.case.adjustment?.id), context.case.invoicePreview?.invoiceId || 'Generate a current invoice preview.'),
		createCheck('approval', 'Finance approval', !requiresApproval(context.case) || context.case.approval?.status === 'approved', requiresApproval(context.case) ? (context.case.approval?.status || 'Approval needed') : 'Inside automated threshold'),
		createCheck('window', 'Invoice correction window', period?.status === 'grace', period?.description || 'Invoice period not found.'),
	];
	sequence += 1;
	context.case.validation = {
		id: `checks_${sequence}`,
		revision: context.case.revision + 1,
		ready: checks.every((check) => check.state === 'passed'),
		checks,
		createdAt: 'Just now',
	};
	context.case.status = context.case.validation.ready ? 'ready-to-release' : 'blocked';
	commitCase(context.case, 'Release checks', context.case.validation.ready ? 'Passed reconciliation checks' : 'Blocked reconciliation release', `${checks.filter((check) => check.state === 'passed').length}/${checks.length} checks passed.`);
	return serializeWorkspace();
}

/**
 * Publishes an immutable reconciliation receipt to the provider rollout worker.
 *
 * @param {string} caseId Reconciliation case identifier.
 * @param {Record<string, unknown>} input Exact case revision and acknowledgement.
 * @returns {object} Updated workspace and release receipt or API error.
 */
export function releaseUsageReconciliationCase(caseId, input = {}) {
	const context = getMutableCase(caseId, input.revision);
	if (context.error) return context;
	if (context.case.release) return error('This reconciliation case is already released.', 409);
	if (!context.case.validation?.ready || context.case.validation.revision !== context.case.revision) return error('Run current release checks before publishing the correction.', 409);
	if (input.acknowledged !== true) return error('Acknowledge the customer and invoice impact before release.', 422);
	sequence += 1;
	context.case.release = {
		id: `release_${sequence}`,
		revision: context.case.revision + 1,
		state: 'queued',
		label: `Correction ${context.case.adjustment.id}`,
		checksum: `sha256:release-${sequence}-usage`,
		provider: 'Metronome',
		providerRequestId: null,
		createdBy: 'Maya Chen',
		createdAt: 'Just now',
	};
	context.case.status = 'publishing';
	commitCase(context.case, 'Maya Chen', 'Queued invoice correction', `${context.case.release.label} · ${context.case.release.checksum}`);
	return serializeWorkspace();
}

/**
 * Advances one queued provider correction through deterministic rollout states.
 *
 * @param {string} caseId Reconciliation case identifier.
 * @returns {object} Updated workspace or API error.
 */
export function advanceUsageReconciliationRelease(caseId) {
	const targetCase = findCase(caseId);
	if (!targetCase) return error('Reconciliation case not found.', 404);
	if (!targetCase.release) return error('Release the correction before advancing provider delivery.', 409);
	if (targetCase.release.state === 'completed') return error('Provider correction is already complete.', 409);
	if (targetCase.release.state === 'queued') {
		targetCase.release.state = 'provider-updating';
		sequence += 1;
		targetCase.release.providerRequestId = `met_req_${sequence}`;
		commitCase(targetCase, 'Provider worker', 'Submitted meter event adjustment', targetCase.release.providerRequestId);
		return serializeWorkspace();
	}
	targetCase.release.state = 'completed';
	targetCase.release.completedAt = 'Just now';
	targetCase.status = 'reconciled';
	targetCase.invoiceHold = false;
	commitCase(targetCase, 'Provider worker', 'Completed invoice correction', 'Usage, invoice preview, and audit ledger now agree.');
	return serializeWorkspace();
}

/**
 * Restores the deterministic reconciliation example.
 *
 * @returns {object} Clean reconciliation workspace.
 */
export function resetUsageReconciliation() {
	sequence = 10400;
	reconciliationState = createReconciliationState();
	return serializeWorkspace();
}

/**
 * Creates clean mutable state from the canonical seed data.
 *
 * @returns {object} Reconciliation state.
 */
function createReconciliationState() {
	return {
		periods: clone(periodSeeds),
		cases: clone(caseSeeds),
		activity: [
			{ id: 'activity_1', actor: 'Reconciliation worker', action: 'Opened five discrepancy cases', detail: 'June draft invoice · correction window open', createdAt: 'Today · 07:19' },
			{ id: 'activity_2', actor: 'Invoice service', action: 'Applied four invoice holds', detail: '£494.46 gross exposure under review', createdAt: 'Today · 07:20' },
		],
	};
}

/**
 * Serializes state with derived queue and finance summary values.
 *
 * @returns {object} JSON-safe reconciliation workspace.
 */
function serializeWorkspace() {
	const openCases = reconciliationState.cases.filter((candidate) => candidate.status !== 'reconciled');
	return clone({
		...reconciliationState,
		catalog: {
			actionOptions,
			reasonOptions,
			statusOptions: [
				{ value: 'attention', label: 'Needs attention', description: 'Open, schema, approval, and blocked cases.' },
				{ value: 'holds', label: 'Invoice holds', description: 'Cases currently blocking invoice finalization.' },
				{ value: 'all', label: 'All cases', description: 'Include released and resolved work.' },
			],
			sourceOptions: [...new Set(reconciliationState.cases.map((candidate) => candidate.source))].map((source) => ({ value: source, label: source })),
		},
		summary: {
			openCases: openCases.length,
			invoiceHolds: reconciliationState.cases.filter((candidate) => candidate.invoiceHold).length,
			grossExposure: roundMoney(openCases.reduce((total, candidate) => total + Math.abs(candidate.invoiceDelta), 0)),
			approvalQueue: reconciliationState.cases.filter((candidate) => candidate.approval?.status === 'pending').length,
			urgentCases: reconciliationState.cases.filter((candidate) => candidate.severity === 'danger' && candidate.status !== 'reconciled').length,
		},
	});
}

/**
 * Returns one case after validating existence and exact revision.
 *
 * @param {string} caseId Reconciliation case identifier.
 * @param {unknown} revision Expected case revision.
 * @returns {{ case: object }|{ error: string, status: number, currentRevision?: number }} Case context or API error.
 */
function getMutableCase(caseId, revision) {
	const targetCase = findCase(caseId);
	if (!targetCase) return error('Reconciliation case not found.', 404);
	if (Number(revision) !== targetCase.revision) return conflict(targetCase);
	return { case: targetCase };
}

/**
 * Finds one reconciliation case.
 *
 * @param {string} caseId Reconciliation case identifier.
 * @returns {object|null} Matching case or null.
 */
function findCase(caseId) {
	return reconciliationState.cases.find((candidate) => candidate.id === caseId) || null;
}

/**
 * Commits a case mutation, increments its revision, and appends activity.
 *
 * @param {object} targetCase Mutable reconciliation case.
 * @param {string} actor Activity actor.
 * @param {string} action Activity action.
 * @param {string} detail Activity detail.
 * @returns {void}
 */
function commitCase(targetCase, actor, action, detail) {
	targetCase.revision += 1;
	sequence += 1;
	const event = { id: `tl_${sequence}`, actor, action, detail, createdAt: 'Just now' };
	targetCase.timeline.unshift(event);
	reconciliationState.activity.unshift({ ...event, caseId: targetCase.id, customer: targetCase.customer });
}

/**
 * Builds source-segment evidence for a deterministic comparison.
 *
 * @param {object} targetCase Reconciliation case.
 * @returns {Array<object>} Comparison segments.
 */
function buildComparisonSegments(targetCase) {
	const baseline = Math.min(targetCase.sourceTotal, targetCase.ratedTotal);
	return [
		{ id: 'baseline', label: 'Matched usage', source: baseline, rated: baseline, state: 'matched' },
		{ id: 'delta', label: targetCase.delta > 0 ? 'Excess source units' : 'Missing rated units', source: Math.max(0, targetCase.delta), rated: Math.max(0, -targetCase.delta), state: 'discrepancy' },
	];
}

/**
 * Calculates the append-only quantity for a resolution action.
 *
 * @param {object} targetCase Reconciliation case.
 * @param {string} action Resolution action.
 * @returns {number} Signed quantity.
 */
function calculateAdjustmentQuantity(targetCase, action) {
	if (action === 'cancel_usage') return -Math.abs(targetCase.delta);
	if (action === 'add_usage') return Math.abs(targetCase.delta);
	return 0;
}

/**
 * Calculates the invoice amount for a resolution action.
 *
 * @param {object} targetCase Reconciliation case.
 * @param {string} action Resolution action.
 * @returns {number} Signed monetary adjustment.
 */
function calculateAdjustmentAmount(targetCase, action) {
	if (action === 'accept_rated') return 0;
	if (action === 'issue_credit') return -Math.abs(targetCase.invoiceDelta);
	if (action === 'cancel_usage') return -Math.abs(targetCase.invoiceDelta);
	return Math.abs(targetCase.invoiceDelta);
}

/**
 * Reports whether the current correction needs finance approval.
 *
 * @param {object} targetCase Reconciliation case.
 * @returns {boolean} Whether manual approval is required.
 */
function requiresApproval(targetCase) {
	return Math.abs(Number(targetCase.adjustment?.amount || 0)) > 250 || targetCase.severity === 'danger';
}

/**
 * Creates one release-check record.
 *
 * @param {string} id Check identifier.
 * @param {string} label Check label.
 * @param {boolean} passed Whether the check passed.
 * @param {string} detail Supporting detail.
 * @returns {object} Check record.
 */
function createCheck(id, label, passed, detail) {
	return { id, label, state: passed ? 'passed' : 'blocked', detail };
}

/**
 * Returns an option label for a value.
 *
 * @param {Array<object>} options Option records.
 * @param {string} value Selected value.
 * @returns {string} Matching label.
 */
function optionLabel(options, value) {
	return options.find((option) => option.value === value)?.label || value;
}

/**
 * Creates a revision-conflict API error.
 *
 * @param {object} targetCase Current case.
 * @returns {object} Conflict error.
 */
function conflict(targetCase) {
	return { error: `Case changed. Refresh revision ${targetCase.revision} before continuing.`, status: 409, currentRevision: targetCase.revision };
}

/**
 * Creates a standard API error.
 *
 * @param {string} message Error message.
 * @param {number} status HTTP status.
 * @returns {object} API error.
 */
function error(message, status) {
	return { error: message, status };
}

/**
 * Formats an integer count.
 *
 * @param {number} value Numeric value.
 * @returns {string} Localized number.
 */
function formatNumber(value) {
	return Number(value || 0).toLocaleString('en-GB');
}

/**
 * Formats a GBP amount.
 *
 * @param {number} value Monetary value.
 * @returns {string} Formatted amount.
 */
function formatMoney(value) {
	return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 2 }).format(Number(value || 0));
}

/**
 * Rounds monetary values to two decimal places.
 *
 * @param {number} value Monetary value.
 * @returns {number} Rounded value.
 */
function roundMoney(value) {
	return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

/**
 * Produces JSON-safe independent data.
 *
 * @param {unknown} value Serializable value.
 * @returns {any} Cloned value.
 */
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}
