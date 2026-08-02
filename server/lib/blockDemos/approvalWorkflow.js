const currentActor = {
	id: 'usr_noah',
	name: 'Noah Kim',
	role: 'Security approver',
	group: 'Security review',
};

const requestSeeds = [
	{
		id: 'approval_req_4821',
		revision: 12,
		type: 'capacity-change',
		typeLabel: 'Capacity change',
		title: 'Raise production API limit',
		resource: 'Northstar Bank · Production gateway',
		requester: { id: 'usr_maya', name: 'Maya Chen', team: 'Enterprise Success' },
		status: 'awaiting-review',
		risk: 'high',
		due: 'Today · 16:00',
		sla: '3h 18m',
		impact: '$18.4k expansion',
		submittedAt: 'Today · 11:58',
		assignedTo: null,
		policyId: 'prod-change-v8',
		policyLabel: 'Production change policy v8',
		change: {
			field: 'monthly_request_limit',
			label: 'Monthly request limit',
			from: '75,000 requests',
			to: '250,000 requests',
			reason: 'Contracted mobile launch moves traffic from a legacy integration to the public API.',
			original: '{\n  "workspace": "northstar-bank",\n  "environment": "production",\n  "monthly_request_limit": 75000,\n  "burst_limit": 1200\n}',
			proposed: '{\n  "workspace": "northstar-bank",\n  "environment": "production",\n  "monthly_request_limit": 250000,\n  "burst_limit": 2400\n}',
			scopeAllowed: true,
		},
		evidence: [
			{ id: 'contract', label: 'Signed expansion order', value: 'order_northstar_2026.pdf', checksum: 'sha256:4d82…91ac', status: 'verified' },
			{ id: 'load-test', label: 'Production load test', value: 'run_load_8842', checksum: 'sha256:194a…fe20', status: 'verified' },
			{ id: 'rollback', label: 'Rollback runbook', value: 'runbook_gateway_limits_v4', checksum: 'sha256:8b31…7e02', status: 'verified' },
		],
		approvers: [
			{ id: 'finance', label: 'Finance review', ownerId: 'usr_jon', owner: 'Jon Bell', required: true, status: 'approved', decidedAt: 'Today · 12:18' },
			{ id: 'security', label: 'Security review', ownerId: currentActor.id, owner: currentActor.name, required: true, status: 'waiting', decidedAt: null },
			{ id: 'success', label: 'CS leadership', ownerId: 'usr_ari', owner: 'Ari Grant', required: false, status: 'watching', decidedAt: null },
		],
		windowOpen: true,
		policyEvaluation: null,
		decision: null,
		execution: null,
		timeline: [
			{ id: 'event_4821_1', actor: 'Jon Bell', action: 'Approved finance step', detail: 'Expansion order and billing account verified.', createdAt: 'Today · 12:18' },
			{ id: 'event_4821_2', actor: 'Workflow router', action: 'Requested security review', detail: 'Change crosses the production capacity threshold.', createdAt: 'Today · 12:03' },
			{ id: 'event_4821_3', actor: 'Maya Chen', action: 'Submitted request', detail: 'Mobile banking launch capacity increase.', createdAt: 'Today · 11:58' },
		],
	},
	{
		id: 'approval_req_4822',
		revision: 5,
		type: 'data-export',
		typeLabel: 'Data export',
		title: 'Export customer activity archive',
		resource: 'Acme Retail · Customer activity',
		requester: { id: 'usr_rina', name: 'Rina Shah', team: 'Data Operations' },
		status: 'blocked',
		risk: 'critical',
		due: 'Tomorrow · 10:30',
		sla: '21h 48m',
		impact: '1.8M customer events',
		submittedAt: 'Today · 09:52',
		assignedTo: currentActor.name,
		policyId: 'regulated-export-v5',
		policyLabel: 'Regulated export policy v5',
		change: {
			field: 'export_destination',
			label: 'Export destination',
			from: 'Internal warehouse',
			to: 'Vendor SFTP endpoint',
			reason: 'Quarterly compliance archive requested by customer operations.',
			original: '{\n  "destination": "warehouse://internal/acme",\n  "fields": ["event", "timestamp"]\n}',
			proposed: '{\n  "destination": "sftp://vendor/acme-archive",\n  "fields": ["event", "timestamp", "customer_id"]\n}',
			scopeAllowed: true,
		},
		evidence: [
			{ id: 'customer-approval', label: 'Customer authorization', value: 'acme_archive_request.pdf', checksum: 'sha256:0081…af12', status: 'verified' },
			{ id: 'redaction', label: 'Redaction manifest', value: 'redaction_job_9210', checksum: 'sha256:421a…6c20', status: 'verified' },
			{ id: 'dpa', label: 'Vendor DPA', value: 'Agreement missing', checksum: null, status: 'missing' },
		],
		approvers: [
			{ id: 'privacy', label: 'Privacy review', ownerId: currentActor.id, owner: currentActor.name, required: true, status: 'waiting', decidedAt: null },
			{ id: 'legal', label: 'Legal review', ownerId: 'usr_sam', owner: 'Sam Patel', required: true, status: 'waiting', decidedAt: null },
			{ id: 'data-owner', label: 'Data owner', ownerId: 'usr_rina', owner: 'Rina Shah', required: true, status: 'approved', decidedAt: 'Today · 10:02' },
		],
		windowOpen: true,
		policyEvaluation: null,
		decision: null,
		execution: null,
		timeline: [
			{ id: 'event_4822_1', actor: 'Policy agent', action: 'Flagged missing DPA', detail: 'External processor agreement is required before review.', createdAt: 'Today · 10:40' },
			{ id: 'event_4822_2', actor: 'Rina Shah', action: 'Submitted request', detail: 'Quarterly archive export.', createdAt: 'Today · 09:52' },
		],
	},
	{
		id: 'approval_req_4823',
		revision: 8,
		type: 'refund',
		typeLabel: 'Refund exception',
		title: 'Approve refund exception',
		resource: 'Invoice INV-2048 · Juniper Works',
		requester: { id: 'usr_lena', name: 'Lena Ortiz', team: 'Customer Success' },
		status: 'awaiting-review',
		risk: 'medium',
		due: '12 Jun · 17:00',
		sla: '1d 4h',
		impact: '$2,840 cash refund',
		submittedAt: 'Yesterday · 16:08',
		assignedTo: null,
		policyId: 'refund-exception-v6',
		policyLabel: 'Refund exception policy v6',
		change: {
			field: 'refund_method',
			label: 'Refund policy',
			from: '30-day account credit',
			to: 'Full cash refund after 44 days',
			reason: 'Duplicate annual renewal was charged during billing consolidation.',
			original: '{\n  "invoice": "INV-2048",\n  "refund": "account_credit",\n  "amount": 2840\n}',
			proposed: '{\n  "invoice": "INV-2048",\n  "refund": "cash",\n  "amount": 2840\n}',
			scopeAllowed: true,
		},
		evidence: [
			{ id: 'duplicate-charge', label: 'Duplicate charge proof', value: 'billing_match_4402', checksum: 'sha256:92aa…31c4', status: 'verified' },
			{ id: 'customer-note', label: 'Customer request', value: 'support_case_7721', checksum: 'sha256:110c…bb08', status: 'verified' },
		],
		approvers: [
			{ id: 'success', label: 'Success manager', ownerId: 'usr_lena', owner: 'Lena Ortiz', required: true, status: 'approved', decidedAt: 'Yesterday · 16:10' },
			{ id: 'finance', label: 'Finance review', ownerId: currentActor.id, owner: currentActor.name, required: true, status: 'waiting', decidedAt: null },
		],
		windowOpen: true,
		policyEvaluation: null,
		decision: null,
		execution: null,
		timeline: [
			{ id: 'event_4823_1', actor: 'Revenue operations', action: 'Verified duplicate charge', detail: 'Two annual renewals settled within 12 hours.', createdAt: 'Yesterday · 16:44' },
			{ id: 'event_4823_2', actor: 'Lena Ortiz', action: 'Submitted request', detail: 'Cash refund exception.', createdAt: 'Yesterday · 16:08' },
		],
	},
	{
		id: 'approval_req_4824',
		revision: 4,
		type: 'vendor-change',
		typeLabel: 'Vendor change',
		title: 'Replace vendor bank details',
		resource: 'Keystone Logistics · Payment profile',
		requester: { id: 'usr_amelia', name: 'Amelia Ross', team: 'Accounts Payable' },
		status: 'awaiting-review',
		risk: 'critical',
		due: 'Today · 14:30',
		sla: '1h 48m',
		impact: '$96k scheduled payment',
		submittedAt: 'Today · 12:12',
		assignedTo: 'Amina Yusuf',
		policyId: 'vendor-payment-v9',
		policyLabel: 'Vendor payment policy v9',
		change: {
			field: 'beneficiary_account',
			label: 'Beneficiary account',
			from: '•••• 9031 · Barclays',
			to: '•••• 1184 · HSBC',
			reason: 'Vendor submitted updated settlement instructions through onboarding.',
			original: '{\n  "bank": "Barclays",\n  "account": "•••• 9031",\n  "verified": true\n}',
			proposed: '{\n  "bank": "HSBC",\n  "account": "•••• 1184",\n  "verified": false\n}',
			scopeAllowed: false,
		},
		evidence: [
			{ id: 'vendor-form', label: 'Vendor change form', value: 'vendor_change_3391.pdf', checksum: 'sha256:42ad…9901', status: 'verified' },
			{ id: 'callback', label: 'Independent callback', value: 'Not completed', checksum: null, status: 'missing' },
		],
		approvers: [
			{ id: 'ap', label: 'Accounts payable', ownerId: 'usr_amina', owner: 'Amina Yusuf', required: true, status: 'waiting', decidedAt: null },
			{ id: 'treasury', label: 'Treasury', ownerId: 'usr_harper', owner: 'Harper Stone', required: true, status: 'waiting', decidedAt: null },
		],
		windowOpen: true,
		policyEvaluation: null,
		decision: null,
		execution: null,
		timeline: [
			{ id: 'event_4824_1', actor: 'Vendor risk service', action: 'Opened critical review', detail: 'Bank detail change precedes a scheduled payment.', createdAt: 'Today · 12:13' },
		],
	},
];

const decisionOptions = [
	{ value: 'approve', label: 'Approve my step', description: 'Sign off the current policy-bound approval step.' },
	{ value: 'changes', label: 'Request changes', description: 'Return the request with clear remediation instructions.' },
	{ value: 'reject', label: 'Reject request', description: 'Close the request without applying the proposed change.' },
	{ value: 'escalate', label: 'Escalate risk', description: 'Add the risk owner as a required approver.' },
];

const reasonOptions = [
	{ value: 'policy-satisfied', label: 'Policy requirements satisfied', description: 'Evidence and required checks support the decision.' },
	{ value: 'missing-evidence', label: 'More evidence required', description: 'A required contract, verification, or runbook is absent.' },
	{ value: 'risk-outside-policy', label: 'Risk outside policy', description: 'The requested scope exceeds the current reviewer authority.' },
	{ value: 'business-owner', label: 'Business owner decision', description: 'A designated accountable owner must decide.' },
];

const delegateOptions = [
	{ value: 'usr_amina', label: 'Amina Yusuf', description: 'Security and vendor-risk approver.' },
	{ value: 'usr_harper', label: 'Harper Stone', description: 'Treasury and financial-control approver.' },
	{ value: 'usr_nora', label: 'Nora Lee', description: 'Privacy and data-governance approver.' },
];

let sequence = 6200;
let approvalState = createApprovalState();

/**
 * Returns the complete approval operations workspace.
 *
 * @returns {object} Approval requests, actor, catalogs, and summary.
 */
export function getApprovalWorkflowWorkspace() {
	return serializeWorkspace();
}

/**
 * Assigns one approval request to the current reviewer.
 *
 * @param {string} requestId Approval request identifier.
 * @param {Record<string, unknown>} input Exact request revision.
 * @returns {object} Updated workspace or API error.
 */
export function claimApprovalRequest(requestId, input = {}) {
	const context = getMutableRequest(requestId, input.revision);
	if (context.error) return context;
	if (isFinal(context.request)) return error('Completed requests cannot be reassigned.', 409);
	if (context.request.assignedTo && context.request.assignedTo !== currentActor.name) return error(`This request is assigned to ${context.request.assignedTo}.`, 409);
	context.request.assignedTo = currentActor.name;
	context.request.status = context.request.status === 'blocked' ? 'blocked' : 'in-review';
	commitRequest(context.request, currentActor.name, 'Claimed approval request', 'The current reviewer owns the next decision.');
	return serializeWorkspace();
}

/**
 * Runs the authoritative policy version against current request evidence.
 *
 * @param {string} requestId Approval request identifier.
 * @param {Record<string, unknown>} input Exact request revision.
 * @returns {object} Updated workspace and policy evidence or API error.
 */
export function evaluateApprovalRequest(requestId, input = {}) {
	const context = getMutableRequest(requestId, input.revision);
	if (context.error) return context;
	if (context.request.assignedTo !== currentActor.name) return error('Claim the request before evaluating policy.', 409);
	if (isFinal(context.request)) return error('Completed request evidence is immutable.', 409);
	const checks = buildPolicyChecks(context.request);
	sequence += 1;
	context.request.policyEvaluation = {
		id: `policy_run_${sequence}`,
		revision: context.request.revision + 1,
		policyId: context.request.policyId,
		ready: checks.every((check) => check.state === 'passed'),
		checks,
		matchedRoute: buildMatchedRoute(context.request),
		createdAt: 'Just now',
	};
	context.request.status = context.request.policyEvaluation.ready ? 'ready-for-decision' : 'blocked';
	commitRequest(context.request, 'Policy engine', context.request.policyEvaluation.ready ? 'Passed approval policy' : 'Blocked approval policy', `${checks.filter((check) => check.state === 'passed').length}/${checks.length} checks passed.`);
	return serializeWorkspace();
}

/**
 * Records the current reviewer's structured decision.
 *
 * @param {string} requestId Approval request identifier.
 * @param {Record<string, unknown>} input Decision, reason, note, and exact revision.
 * @returns {object} Updated workspace or API error.
 */
export function decideApprovalRequest(requestId, input = {}) {
	const context = getMutableRequest(requestId, input.revision);
	if (context.error) return context;
	const targetRequest = context.request;
	if (targetRequest.assignedTo !== currentActor.name) return error('Only the assigned reviewer can decide this request.', 409);
	if (targetRequest.requester.id === currentActor.id) return error('Separation of duties prevents self-approval.', 403);
	if (isFinal(targetRequest)) return error('This request already has a final decision.', 409);
	const action = String(input.action || '');
	const reason = String(input.reason || '');
	const note = String(input.note || '').trim();
	if (!decisionOptions.some((option) => option.value === action)) return error('Choose a supported decision.', 422);
	if (!reasonOptions.some((option) => option.value === reason)) return error('Choose a decision reason.', 422);
	if (note.length < 20) return error('Add a decision note of at least 20 characters.', 422);
	if (action === 'approve') return approveRequestStep(targetRequest, { reason, note, acknowledged: input.acknowledged === true, notifyRequester: input.notifyRequester !== false, createFollowUp: input.createFollowUp === true });
	if (action === 'changes') return requestChanges(targetRequest, { reason, note, notifyRequester: input.notifyRequester !== false });
	if (action === 'reject') return rejectRequest(targetRequest, { reason, note, notifyRequester: input.notifyRequester !== false });
	return escalateRequest(targetRequest, { reason, note });
}

/**
 * Verifies the missing vendor agreement for the blocked export example.
 *
 * @param {string} requestId Approval request identifier.
 * @param {Record<string, unknown>} input Exact revision and verification note.
 * @returns {object} Updated workspace or API error.
 */
export function verifyApprovalEvidence(requestId, input = {}) {
	const context = getMutableRequest(requestId, input.revision);
	if (context.error) return context;
	if (context.request.assignedTo !== currentActor.name) return error('Only the assigned reviewer can verify evidence.', 409);
	const note = String(input.note || '').trim();
	if (note.length < 12) return error('Add a verification note of at least 12 characters.', 422);
	const missingEvidence = context.request.evidence.find((item) => item.status === 'missing');
	if (!missingEvidence) return error('This request has no missing evidence.', 422);
	sequence += 1;
	missingEvidence.status = 'verified';
	missingEvidence.value = missingEvidence.id === 'dpa' ? 'vendor_dpa_2026.pdf' : 'verification_receipt.pdf';
	missingEvidence.checksum = `sha256:evidence-${sequence}`;
	context.request.policyEvaluation = null;
	context.request.status = 'in-review';
	commitRequest(context.request, currentActor.name, `Verified ${missingEvidence.label}`, note);
	return serializeWorkspace();
}

/**
 * Delegates the current approval step to an eligible reviewer until a fixed date.
 *
 * @param {string} requestId Approval request identifier.
 * @param {Record<string, unknown>} input Delegate, expiry date, note, and exact revision.
 * @returns {object} Updated workspace or API error.
 */
export function delegateApprovalRequest(requestId, input = {}) {
	const context = getMutableRequest(requestId, input.revision);
	if (context.error) return context;
	if (context.request.assignedTo !== currentActor.name) return error('Only the assigned reviewer can delegate this request.', 409);
	if (isFinal(context.request)) return error('Completed requests cannot be delegated.', 409);
	const delegate = delegateOptions.find((option) => option.value === String(input.delegateId || ''));
	const until = String(input.until || '');
	const note = String(input.note || '').trim();
	if (!delegate) return error('Choose an eligible delegate.', 422);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return error('Choose a delegation end date.', 422);
	if (note.length < 12) return error('Add a delegation note of at least 12 characters.', 422);
	context.request.assignedTo = delegate.label;
	const currentStep = findCurrentApprover(context.request);
	if (currentStep) {
		currentStep.ownerId = delegate.value;
		currentStep.owner = delegate.label;
	}
	context.request.delegation = { from: currentActor.name, to: delegate.label, until, note, createdAt: 'Just now' };
	context.request.status = 'delegated';
	commitRequest(context.request, currentActor.name, 'Delegated approval step', `${delegate.label} · until ${until}`);
	return serializeWorkspace();
}

/**
 * Queues an approved request for controlled execution after explicit acknowledgement.
 *
 * @param {string} requestId Approval request identifier.
 * @param {Record<string, unknown>} input Exact revision and impact acknowledgement.
 * @returns {object} Updated workspace or API error.
 */
export function executeApprovalRequest(requestId, input = {}) {
	const context = getMutableRequest(requestId, input.revision);
	if (context.error) return context;
	if (context.request.status !== 'approved' || context.request.execution?.state !== 'ready') return error('Complete required approvals before execution.', 409);
	if (context.request.execution.lockedRevision !== context.request.revision) return error('The execution snapshot is stale. Re-run approval checks.', 409);
	if (input.acknowledged !== true) return error('Acknowledge the production and customer impact before execution.', 422);
	context.request.execution.state = 'queued';
	context.request.execution.revision = context.request.revision + 1;
	context.request.execution.queuedBy = currentActor.name;
	context.request.execution.queuedAt = 'Just now';
	commitRequest(context.request, currentActor.name, 'Queued controlled change', context.request.execution.checksum);
	return serializeWorkspace();
}

/**
 * Advances a queued change through applying and completed execution states.
 *
 * @param {string} requestId Approval request identifier.
 * @param {Record<string, unknown>} input Exact request revision.
 * @returns {object} Updated workspace or API error.
 */
export function advanceApprovalExecution(requestId, input = {}) {
	const context = getMutableRequest(requestId, input.revision);
	if (context.error) return context;
	const execution = context.request.execution;
	if (!execution || !['queued', 'applying'].includes(execution.state)) return error('Queue the approved change before advancing execution.', 409);
	if (execution.state === 'queued') {
		execution.state = 'applying';
		execution.revision = context.request.revision + 1;
		execution.surfaces = [
			{ id: 'gateway', label: 'API gateway', state: 'applying', detail: 'Updating production capacity policy.' },
			{ id: 'monitoring', label: 'Monitoring', state: 'ready', detail: 'Alert thresholds prepared.' },
			{ id: 'audit', label: 'Audit ledger', state: 'ready', detail: 'Decision evidence locked.' },
		];
		commitRequest(context.request, 'Change worker', 'Started controlled execution', 'Gateway update is applying.');
		return serializeWorkspace();
	}
	execution.state = 'completed';
	execution.revision = context.request.revision + 1;
	execution.completedAt = 'Just now';
	execution.providerReceipt = `change_receipt_${++sequence}`;
	execution.surfaces = execution.surfaces.map((surface) => ({ ...surface, state: 'completed' }));
	context.request.status = 'applied';
	commitRequest(context.request, 'Change worker', 'Completed controlled execution', `${execution.providerReceipt} · all surfaces confirmed.`);
	return serializeWorkspace();
}

/**
 * Restores the deterministic approval workflow example.
 *
 * @returns {object} Clean approval workspace.
 */
export function resetApprovalWorkflow() {
	sequence = 6200;
	approvalState = createApprovalState();
	return serializeWorkspace();
}

/**
 * Creates clean mutable approval state from canonical request seeds.
 *
 * @returns {object} Approval workspace state.
 */
function createApprovalState() {
	return {
		requests: clone(requestSeeds),
		activity: [
			{ id: 'activity_1', actor: 'Workflow router', action: 'Routed four sensitive changes', detail: 'Two decisions need Noah Kim.', createdAt: 'Today · 12:13' },
			{ id: 'activity_2', actor: 'SLA service', action: 'Prioritized vendor payment change', detail: 'Critical request due in under two hours.', createdAt: 'Today · 12:14' },
		],
	};
}

/**
 * Serializes state with review catalogs and derived queue counts.
 *
 * @returns {object} JSON-safe approval workspace.
 */
function serializeWorkspace() {
	const openRequests = approvalState.requests.filter((request) => !isFinal(request));
	return clone({
		...approvalState,
		actor: currentActor,
		catalog: {
			queueOptions: [
				{ value: 'mine', label: 'Needs me', description: 'Assigned or routed to your approval step.' },
				{ value: 'open', label: 'All open', description: 'Every active approval request.' },
				{ value: 'blocked', label: 'Blocked', description: 'Missing evidence or failed policy checks.' },
				{ value: 'decided', label: 'Decided', description: 'Approved, rejected, or applied requests.' },
			],
			typeOptions: [
				{ value: 'all', label: 'All request types', description: 'Capacity, data, refund, and vendor changes.' },
				...uniqueTypeOptions(approvalState.requests),
			],
			decisionOptions,
			reasonOptions,
			delegateOptions,
		},
		summary: {
			open: openRequests.length,
			needsMe: openRequests.filter(needsCurrentActor).length,
			blocked: openRequests.filter((request) => request.status === 'blocked').length,
			executing: openRequests.filter((request) => ['queued', 'applying'].includes(request.execution?.state)).length,
			urgent: openRequests.filter((request) => request.risk === 'critical').length,
		},
	});
}

/**
 * Approves the current actor's step and locks execution when all required steps pass.
 *
 * @param {object} targetRequest Mutable approval request.
 * @param {object} decision Structured decision fields.
 * @returns {object} Updated workspace or API error.
 */
function approveRequestStep(targetRequest, decision) {
	if (!targetRequest.policyEvaluation?.ready || targetRequest.policyEvaluation.revision !== targetRequest.revision) return error('Run the current policy evaluation before approving.', 409);
	if (!decision.acknowledged) return error('Acknowledge the change impact before approval.', 422);
	const currentStep = findCurrentApprover(targetRequest);
	if (!currentStep) return error('The current reviewer has no pending approval step.', 409);
	currentStep.status = 'approved';
	currentStep.decidedAt = 'Just now';
	currentStep.decisionNote = decision.note;
	targetRequest.decision = { action: 'approve', ...decision, actor: currentActor.name, createdAt: 'Just now' };
	const allRequiredApproved = targetRequest.approvers.filter((approver) => approver.required).every((approver) => approver.status === 'approved');
	if (allRequiredApproved) {
		sequence += 1;
		targetRequest.status = 'approved';
		targetRequest.execution = {
			id: `execution_${sequence}`,
			state: 'ready',
			lockedRevision: targetRequest.revision + 1,
			policyRunId: targetRequest.policyEvaluation.id,
			changeField: targetRequest.change.field,
			checksum: `sha256:approval-${sequence}`,
			surfaces: [],
			createdAt: 'Just now',
		};
		commitRequest(targetRequest, currentActor.name, 'Approved final required step', `Execution ${targetRequest.execution.id} is locked to this evidence.`);
		return serializeWorkspace();
	}
	targetRequest.status = 'waiting-approval';
	commitRequest(targetRequest, currentActor.name, 'Approved review step', 'The next required approver has been notified.');
	return serializeWorkspace();
}

/**
 * Returns a request to its owner with remediation instructions.
 *
 * @param {object} targetRequest Mutable approval request.
 * @param {object} decision Structured decision fields.
 * @returns {object} Updated workspace.
 */
function requestChanges(targetRequest, decision) {
	targetRequest.decision = { action: 'changes', ...decision, actor: currentActor.name, createdAt: 'Just now' };
	targetRequest.status = 'changes-requested';
	targetRequest.policyEvaluation = null;
	targetRequest.notification = decision.notifyRequester ? { id: `notice_${++sequence}`, state: 'delivered', channel: 'email', createdAt: 'Just now' } : null;
	commitRequest(targetRequest, currentActor.name, 'Requested changes', decision.note);
	return serializeWorkspace();
}

/**
 * Rejects a request and preserves an immutable decision record.
 *
 * @param {object} targetRequest Mutable approval request.
 * @param {object} decision Structured decision fields.
 * @returns {object} Updated workspace.
 */
function rejectRequest(targetRequest, decision) {
	targetRequest.decision = { action: 'reject', ...decision, actor: currentActor.name, createdAt: 'Just now' };
	targetRequest.status = 'rejected';
	targetRequest.notification = decision.notifyRequester ? { id: `notice_${++sequence}`, state: 'delivered', channel: 'email', createdAt: 'Just now' } : null;
	commitRequest(targetRequest, currentActor.name, 'Rejected request', decision.note);
	return serializeWorkspace();
}

/**
 * Adds the risk owner as a required approver.
 *
 * @param {object} targetRequest Mutable approval request.
 * @param {object} decision Structured decision fields.
 * @returns {object} Updated workspace.
 */
function escalateRequest(targetRequest, decision) {
	if (!targetRequest.approvers.some((approver) => approver.id === 'risk-owner')) {
		targetRequest.approvers.push({ id: 'risk-owner', label: 'Risk owner', ownerId: 'usr_amina', owner: 'Amina Yusuf', required: true, status: 'waiting', decidedAt: null });
	}
	targetRequest.decision = { action: 'escalate', ...decision, actor: currentActor.name, createdAt: 'Just now' };
	targetRequest.status = 'escalated';
	commitRequest(targetRequest, currentActor.name, 'Escalated to risk owner', decision.note);
	return serializeWorkspace();
}

/**
 * Builds policy checks from authoritative request evidence.
 *
 * @param {object} targetRequest Approval request.
 * @returns {Array<object>} Policy check records.
 */
function buildPolicyChecks(targetRequest) {
	const evidenceComplete = targetRequest.evidence.every((item) => item.status === 'verified');
	return [
		createCheck('evidence', 'Required evidence verified', evidenceComplete, evidenceComplete ? `${targetRequest.evidence.length} immutable artifacts` : 'One or more required artifacts are missing.'),
		createCheck('separation', 'Separation of duties', targetRequest.requester.id !== currentActor.id, `${targetRequest.requester.name} requested · ${currentActor.name} reviews`),
		createCheck('scope', 'Reviewer authority covers scope', targetRequest.change.scopeAllowed, targetRequest.change.scopeAllowed ? `${currentActor.group} may decide this change.` : 'A different approval group owns this scope.'),
		createCheck('route', 'Required approval route', Boolean(findCurrentApprover(targetRequest)), targetRequest.policyLabel),
		createCheck('window', 'Execution window open', targetRequest.windowOpen, targetRequest.windowOpen ? `Due ${targetRequest.due}` : 'The approved change window is closed.'),
	];
}

/**
 * Creates one semantic policy check.
 *
 * @param {string} id Check identifier.
 * @param {string} label Check label.
 * @param {boolean} passed Whether the check passed.
 * @param {string} detail Supporting evidence.
 * @returns {object} Policy check record.
 */
function createCheck(id, label, passed, detail) {
	return { id, label, state: passed ? 'passed' : 'blocked', detail };
}

/**
 * Describes the approval route matched by the request policy.
 *
 * @param {object} targetRequest Approval request.
 * @returns {string} Human-readable route.
 */
function buildMatchedRoute(targetRequest) {
	return targetRequest.approvers.filter((approver) => approver.required).map((approver) => approver.label).join(' → ');
}

/**
 * Returns the pending approval step owned by the current actor.
 *
 * @param {object} targetRequest Approval request.
 * @returns {object|null} Pending approver step or null.
 */
function findCurrentApprover(targetRequest) {
	return targetRequest.approvers.find((approver) => approver.ownerId === currentActor.id && approver.status === 'waiting') || null;
}

/**
 * Reports whether a request currently needs the active reviewer.
 *
 * @param {object} targetRequest Approval request.
 * @returns {boolean} Whether the actor owns or is routed to the request.
 */
function needsCurrentActor(targetRequest) {
	return targetRequest.assignedTo === currentActor.name || Boolean(findCurrentApprover(targetRequest));
}

/**
 * Returns unique request-type select options.
 *
 * @param {Array<object>} requests Approval requests.
 * @returns {Array<object>} Rich request-type options.
 */
function uniqueTypeOptions(requests) {
	return [...new Map(requests.map((request) => [request.type, { value: request.type, label: request.typeLabel, description: `Review ${request.typeLabel.toLowerCase()} requests.` }])).values()];
}

/**
 * Returns one request after validating existence and exact revision.
 *
 * @param {string} requestId Approval request identifier.
 * @param {unknown} revision Expected revision.
 * @returns {{ request: object }|{ error: string, status: number, currentRevision?: number }} Request context or API error.
 */
function getMutableRequest(requestId, revision) {
	const targetRequest = findRequest(requestId);
	if (!targetRequest) return error('Approval request not found.', 404);
	if (Number(revision) !== targetRequest.revision) return conflict(targetRequest);
	return { request: targetRequest };
}

/**
 * Finds one approval request.
 *
 * @param {string} requestId Approval request identifier.
 * @returns {object|null} Matching request or null.
 */
function findRequest(requestId) {
	return approvalState.requests.find((request) => request.id === requestId) || null;
}

/**
 * Reports whether a request has reached an immutable terminal state.
 *
 * @param {object} targetRequest Approval request.
 * @returns {boolean} Whether request mutations are closed.
 */
function isFinal(targetRequest) {
	return ['rejected', 'applied'].includes(targetRequest.status);
}

/**
 * Commits a request mutation, increments revision, and appends activity evidence.
 *
 * @param {object} targetRequest Mutable approval request.
 * @param {string} actor Activity actor.
 * @param {string} action Activity action.
 * @param {string} detail Activity detail.
 * @returns {void}
 */
function commitRequest(targetRequest, actor, action, detail) {
	targetRequest.revision += 1;
	sequence += 1;
	const event = { id: `event_${sequence}`, actor, action, detail, createdAt: 'Just now' };
	targetRequest.timeline.unshift(event);
	approvalState.activity.unshift({ ...event, requestId: targetRequest.id, title: targetRequest.title });
}

/**
 * Creates a revision-conflict error.
 *
 * @param {object} targetRequest Current approval request.
 * @returns {object} Conflict response.
 */
function conflict(targetRequest) {
	return { error: `Request changed. Refresh revision ${targetRequest.revision} before continuing.`, status: 409, currentRevision: targetRequest.revision };
}

/**
 * Creates a standard API error response.
 *
 * @param {string} message Human-readable error.
 * @param {number} status HTTP status.
 * @returns {{ error: string, status: number }} API error.
 */
function error(message, status) {
	return { error: message, status };
}

/**
 * Creates a detached copy safe for API serialization.
 *
 * @param {unknown} value Value to clone.
 * @returns {any} Detached value.
 */
function clone(value) {
	return structuredClone(value);
}
