const currentActor = {
	id: 'usr_noah',
	name: 'Noah Kim',
	initials: 'NK',
	role: 'Finance operations lead',
	approvalLimit: 1000,
	device: {
		id: 'device_noah_mobile',
		label: 'Noah’s iPhone',
		platform: 'iOS · mobile app',
		trusted: true,
	},
};

const requestSeeds = [
	{
		id: 'mobile_approval_724',
		revision: 7,
		type: 'expense',
		typeLabel: 'Expense exception',
		title: 'Client dinner exception',
		requester: { id: 'usr_maya', name: 'Maya Chen', initials: 'MC', team: 'Enterprise Success' },
		status: 'pending-review',
		risk: 'medium',
		due: '42m',
		dueLabel: 'Today · 17:00',
		submittedAt: 'Today · 15:18',
		source: 'Push notification · 3m ago',
		assignedTo: currentActor.name,
		ask: {
			primary: '£428.00',
			secondary: '£78 above policy',
			object: 'Northstar launch dinner',
			description: 'Dinner for five customer stakeholders after the mobile rollout planning session.',
			impact: 'Reimburses Maya on Friday payroll if approved before the daily cutoff.',
		},
		policy: {
			id: 'meal-exception-v5',
			label: 'Meals & entertainment v5',
			amount: 428,
			standardLimit: 350,
			reviewerLimit: 1000,
			scopeAllowed: true,
			requiresStepUp: true,
		},
		evidence: [
			{ id: 'receipt', label: 'Itemized receipt', value: 'Dinner-receipt.jpg', checksum: 'sha256:ac41…29fd', status: 'verified' },
			{ id: 'attendees', label: 'Customer attendees', value: '5 people · 3 customer contacts', checksum: 'sha256:7841…d2aa', status: 'verified' },
			{ id: 'opportunity', label: 'Linked opportunity', value: 'Northstar expansion · £18.4k', checksum: 'sha256:9f02…41bc', status: 'verified' },
		],
		approvers: [
			{ id: 'manager', label: 'Direct manager', owner: 'Lena Ortiz', status: 'approved', required: true, decidedAt: 'Today · 15:20' },
			{ id: 'finance', label: 'Finance operations', owner: currentActor.name, status: 'waiting', required: true, decidedAt: null },
		],
		policyEvaluation: null,
		requestInfo: null,
		decision: null,
		undo: null,
		timeline: [
			{ id: 'event_724_1', actor: 'Expense policy', action: 'Routed exception to finance', detail: 'The claim is £78 above the standard meal limit.', createdAt: 'Today · 15:21' },
			{ id: 'event_724_2', actor: 'Lena Ortiz', action: 'Approved manager step', detail: 'Customer attendees and opportunity were confirmed.', createdAt: 'Today · 15:20' },
			{ id: 'event_724_3', actor: 'Maya Chen', action: 'Submitted reimbursement', detail: 'Northstar mobile launch dinner.', createdAt: 'Today · 15:18' },
		],
	},
	{
		id: 'mobile_approval_725',
		revision: 4,
		type: 'reimbursement',
		typeLabel: 'Reimbursement',
		title: 'Airport transfer reimbursement',
		requester: { id: 'usr_ari', name: 'Ari Patel', initials: 'AP', team: 'Sales' },
		status: 'pending-review',
		risk: 'medium',
		due: '2h',
		dueLabel: 'Today · 18:30',
		submittedAt: 'Today · 13:44',
		source: 'Tasks inbox',
		assignedTo: currentActor.name,
		ask: {
			primary: '£186.20',
			secondary: 'Receipt missing',
			object: 'Heathrow transfer · ACME renewal',
			description: 'Out-of-pocket airport transfer submitted after the customer renewal workshop.',
			impact: 'Payment waits for the missing itemized receipt.',
		},
		policy: {
			id: 'ground-transport-v4',
			label: 'Ground transport v4',
			amount: 186.2,
			standardLimit: 220,
			reviewerLimit: 1000,
			scopeAllowed: true,
			requiresStepUp: false,
		},
		evidence: [
			{ id: 'receipt', label: 'Itemized receipt', value: 'Not attached', checksum: null, status: 'missing' },
			{ id: 'trip', label: 'Business trip', value: 'ACME renewal workshop', checksum: 'sha256:72d1…aa03', status: 'verified' },
		],
		approvers: [
			{ id: 'finance', label: 'Finance operations', owner: currentActor.name, status: 'waiting', required: true, decidedAt: null },
		],
		policyEvaluation: null,
		requestInfo: null,
		decision: null,
		undo: null,
		timeline: [
			{ id: 'event_725_1', actor: 'Receipt matcher', action: 'Flagged missing evidence', detail: 'No receipt matched the submitted transfer.', createdAt: 'Today · 13:45' },
			{ id: 'event_725_2', actor: 'Ari Patel', action: 'Submitted reimbursement', detail: 'Airport transfer after customer workshop.', createdAt: 'Today · 13:44' },
		],
	},
	{
		id: 'mobile_approval_726',
		revision: 3,
		type: 'access',
		typeLabel: 'Access request',
		title: 'Temporary export access',
		requester: { id: 'usr_jon', name: 'Jon Bell', initials: 'JB', team: 'Data Platform' },
		status: 'pending-review',
		risk: 'critical',
		due: 'Today',
		dueLabel: 'Today · 16:30',
		submittedAt: 'Today · 12:08',
		source: 'Security routing',
		assignedTo: currentActor.name,
		ask: {
			primary: '14-day grant',
			secondary: 'Customer PII included',
			object: 'Warehouse export role',
			description: 'Analyst requests temporary export access for a regulated customer reconciliation.',
			impact: 'The finance reviewer can inspect this request but cannot authorize its security scope.',
		},
		policy: {
			id: 'regulated-export-v6',
			label: 'Regulated export access v6',
			amount: 0,
			standardLimit: 0,
			reviewerLimit: 0,
			scopeAllowed: false,
			requiresStepUp: true,
		},
		evidence: [
			{ id: 'ticket', label: 'Access ticket', value: 'DATA-4921', checksum: 'sha256:5a04…ce21', status: 'verified' },
			{ id: 'expiry', label: 'Automatic expiry', value: '14 days', checksum: 'sha256:4d80…8a12', status: 'verified' },
		],
		approvers: [
			{ id: 'finance', label: 'Finance context', owner: currentActor.name, status: 'waiting', required: false, decidedAt: null },
			{ id: 'security', label: 'Security review', owner: 'Unassigned', status: 'blocked', required: true, decidedAt: null },
		],
		policyEvaluation: null,
		requestInfo: null,
		decision: null,
		undo: null,
		timeline: [
			{ id: 'event_726_1', actor: 'Access analyzer', action: 'Detected regulated scope', detail: 'The export role includes a customer PII table.', createdAt: 'Today · 12:09' },
			{ id: 'event_726_2', actor: 'Jon Bell', action: 'Submitted access request', detail: 'Temporary reconciliation access.', createdAt: 'Today · 12:08' },
		],
	},
	{
		id: 'mobile_approval_720',
		revision: 9,
		type: 'spend',
		typeLabel: 'Spend request',
		title: 'Design research incentive',
		requester: { id: 'usr_rina', name: 'Rina Shah', initials: 'RS', team: 'Product Design' },
		status: 'approved',
		risk: 'low',
		due: 'Done',
		dueLabel: 'Today · 11:02',
		submittedAt: 'Today · 10:42',
		source: 'Tasks inbox',
		assignedTo: currentActor.name,
		ask: {
			primary: '£240.00',
			secondary: 'Within policy',
			object: 'Six customer interviews',
			description: 'Research incentives for the onboarding usability study.',
			impact: 'Funds were issued to the research spend limit.',
		},
		policy: {
			id: 'research-incentives-v2',
			label: 'Research incentives v2',
			amount: 240,
			standardLimit: 500,
			reviewerLimit: 1000,
			scopeAllowed: true,
			requiresStepUp: false,
		},
		evidence: [
			{ id: 'study', label: 'Research plan', value: 'Onboarding study · Wave 3', checksum: 'sha256:916a…34c2', status: 'verified' },
		],
		approvers: [
			{ id: 'finance', label: 'Finance operations', owner: currentActor.name, status: 'approved', required: true, decidedAt: 'Today · 11:02' },
		],
		policyEvaluation: { id: 'policy_mobile_5190', revision: 8, ready: true, checks: [], createdAt: 'Today · 11:01' },
		requestInfo: null,
		decision: {
			id: 'mobile_decision_5191',
			action: 'approve',
			reason: 'policy-satisfied',
			note: 'Research plan and participant count verified.',
			actor: currentActor.name,
			device: currentActor.device.label,
			receipt: 'approval_receipt_5191',
			createdAt: 'Today · 11:02',
		},
		undo: { available: false, decisionId: 'mobile_decision_5191', expiresLabel: 'Undo window closed' },
		timeline: [
			{ id: 'event_720_1', actor: currentActor.name, action: 'Approved request', detail: 'approval_receipt_5191', createdAt: 'Today · 11:02' },
		],
	},
];

const decisionActions = [
	{ value: 'approve', label: 'Approve request', description: 'Confirm the current policy-bound decision.' },
	{ value: 'request-info', label: 'Request more information', description: 'Return the task with a specific evidence request.' },
	{ value: 'escalate', label: 'Escalate to specialist', description: 'Route the task to the accountable approval group.' },
	{ value: 'decline', label: 'Decline request', description: 'Close the request and notify the requester.', variant: 'danger' },
];

const reasonOptions = [
	{ value: 'policy-satisfied', label: 'Policy requirements satisfied', description: 'Evidence and review scope support approval.' },
	{ value: 'missing-evidence', label: 'Required evidence is missing', description: 'The requester must attach a receipt or verification.' },
	{ value: 'outside-authority', label: 'Outside my approval authority', description: 'A specialist or additional approver must decide.' },
	{ value: 'business-context', label: 'Business context is insufficient', description: 'More commercial or operational detail is required.' },
	{ value: 'policy-denied', label: 'Policy exception denied', description: 'The request exceeds a non-overridable policy limit.' },
];

let sequence = 5200;
let mobileApprovalState = createState();

/**
 * Returns the complete mobile approval task workspace.
 *
 * @returns {object} Approval requests, actor, catalogs, and summary.
 */
export function getMobileApprovalWorkspace() {
	return serializeWorkspace();
}

/**
 * Evaluates one request against its current evidence and reviewer authority.
 *
 * @param {string} requestId Approval request identifier.
 * @param {Record<string, unknown>} input Exact request revision.
 * @returns {object} Updated workspace or API error.
 */
export function evaluateMobileApproval(requestId, input = {}) {
	const context = getMutableRequest(requestId, input.revision);
	if (context.error) return context;
	if (isFinal(context.request)) return error('Completed requests cannot be evaluated again.', 409);
	if (context.request.assignedTo !== currentActor.name) return error('This task is assigned to another reviewer.', 403);
	const checks = buildPolicyChecks(context.request);
	sequence += 1;
	context.request.policyEvaluation = {
		id: `policy_mobile_${sequence}`,
		revision: context.request.revision + 1,
		ready: checks.every((check) => check.state !== 'blocked'),
		checks,
		policyId: context.request.policy.id,
		createdAt: 'Just now',
	};
	context.request.status = context.request.policyEvaluation.ready ? 'ready-to-decide' : 'blocked';
	commitRequest(context.request, 'Mobile policy engine', context.request.policyEvaluation.ready ? 'Policy review passed' : 'Policy review blocked', `${checks.filter((check) => check.state !== 'blocked').length}/${checks.length} checks cleared.`);
	return serializeWorkspace();
}

/**
 * Creates a short-lived device challenge for a high-risk approval.
 *
 * @param {string} requestId Approval request identifier.
 * @param {Record<string, unknown>} input Exact request revision.
 * @returns {object} Workspace and challenge details or API error.
 */
export function createMobileApprovalChallenge(requestId, input = {}) {
	const context = getMutableRequest(requestId, input.revision);
	if (context.error) return context;
	if (!context.request.policy.requiresStepUp) return error('This request does not require step-up verification.', 422);
	if (!hasCurrentPolicy(context.request)) return error('Run the current policy evaluation before step-up verification.', 409);
	sequence += 1;
	const challenge = {
		id: `mobile_challenge_${sequence}`,
		requestId,
		code: '624801',
		attemptsRemaining: 3,
		state: 'pending',
		device: currentActor.device.label,
		expiresAt: '5 minutes',
		token: null,
	};
	mobileApprovalState.challenges = mobileApprovalState.challenges.filter((item) => item.requestId !== requestId || item.state === 'verified');
	mobileApprovalState.challenges.push(challenge);
	return { ...serializeWorkspace(), challenge: publicChallenge(challenge) };
}

/**
 * Verifies one mobile approval challenge and issues a single-use token.
 *
 * @param {string} requestId Approval request identifier.
 * @param {Record<string, unknown>} input Challenge identifier and confirmation code.
 * @returns {object} Workspace and verified challenge or API error.
 */
export function verifyMobileApprovalChallenge(requestId, input = {}) {
	const targetRequest = findRequest(requestId);
	if (!targetRequest) return error('Approval request not found.', 404);
	const challenge = mobileApprovalState.challenges.find((item) => item.id === String(input.challengeId || '') && item.requestId === requestId);
	if (!challenge || challenge.state !== 'pending') return error('Start a new device verification challenge.', 409);
	if (String(input.code || '') !== challenge.code) {
		challenge.attemptsRemaining -= 1;
		return error(challenge.attemptsRemaining > 0 ? `Code did not match. ${challenge.attemptsRemaining} attempts remain.` : 'Verification challenge locked.', 422);
	}
	sequence += 1;
	challenge.state = 'verified';
	challenge.token = `mobile_step_up_${sequence}`;
	challenge.verifiedAt = 'Just now';
	return { ...serializeWorkspace(), challenge: publicChallenge(challenge), stepUpToken: challenge.token };
}

/**
 * Records an approve, request-information, decline, or escalation decision.
 *
 * @param {string} requestId Approval request identifier.
 * @param {Record<string, unknown>} input Structured decision and exact revision.
 * @returns {object} Updated workspace or API error.
 */
export function decideMobileApproval(requestId, input = {}) {
	const context = getMutableRequest(requestId, input.revision);
	if (context.error) return context;
	const targetRequest = context.request;
	if (isFinal(targetRequest)) return error('This task already has a final decision.', 409);
	if (targetRequest.assignedTo !== currentActor.name) return error('Only the assigned reviewer can decide this task.', 403);
	if (targetRequest.requester.id === currentActor.id) return error('Separation of duties prevents self-approval.', 403);
	const action = String(input.action || '');
	const reason = String(input.reason || '');
	const note = String(input.note || '').trim();
	if (!decisionActions.some((option) => option.value === action)) return error('Choose a supported decision.', 422);
	if (!reasonOptions.some((option) => option.value === reason)) return error('Choose a decision reason.', 422);
	if (note.length < 20) return error('Add a decision note of at least 20 characters.', 422);
	if (action === 'approve') return approveRequest(targetRequest, { reason, note, acknowledged: input.acknowledged === true, stepUpToken: String(input.stepUpToken || '') });
	if (action === 'request-info') return requestMoreInformation(targetRequest, { reason, note });
	if (action === 'decline') return declineRequest(targetRequest, { reason, note, acknowledged: input.acknowledged === true });
	return escalateRequest(targetRequest, { reason, note });
}

/**
 * Reverses an eligible mobile decision during the deterministic undo window.
 *
 * @param {string} requestId Approval request identifier.
 * @param {Record<string, unknown>} input Exact revision and decision identifier.
 * @returns {object} Updated workspace or API error.
 */
export function undoMobileApprovalDecision(requestId, input = {}) {
	const context = getMutableRequest(requestId, input.revision);
	if (context.error) return context;
	if (!context.request.undo?.available || context.request.undo.decisionId !== String(input.decisionId || '')) return error('The undo window is no longer available.', 409);
	const reversedDecision = context.request.decision;
	context.request.undo.available = false;
	context.request.undo.reversedAt = 'Just now';
	context.request.decision = null;
	context.request.policyEvaluation = null;
	context.request.status = 'pending-review';
	commitRequest(context.request, currentActor.name, 'Undid mobile decision', `${reversedDecision.action} ${reversedDecision.receipt} was reversed before settlement.`);
	return serializeWorkspace();
}

/**
 * Simulates a requester supplying the missing evidence after an information request.
 *
 * @param {string} requestId Approval request identifier.
 * @param {Record<string, unknown>} input Exact revision and evidence note.
 * @returns {object} Updated workspace or API error.
 */
export function provideMobileApprovalEvidence(requestId, input = {}) {
	const context = getMutableRequest(requestId, input.revision);
	if (context.error) return context;
	if (context.request.status !== 'waiting-on-requester') return error('Request more information before receiving replacement evidence.', 409);
	const note = String(input.note || '').trim();
	if (note.length < 12) return error('Add an evidence note of at least 12 characters.', 422);
	const missingEvidence = context.request.evidence.find((item) => item.status === 'missing');
	if (!missingEvidence) return error('This task has no missing evidence.', 422);
	sequence += 1;
	missingEvidence.status = 'verified';
	missingEvidence.value = 'Heathrow-transfer-receipt.jpg';
	missingEvidence.checksum = `sha256:mobile-evidence-${sequence}`;
	context.request.ask.secondary = 'Receipt verified';
	context.request.ask.impact = 'Payment can continue after the refreshed policy review.';
	context.request.requestInfo.state = 'resolved';
	context.request.requestInfo.resolvedAt = 'Just now';
	context.request.policyEvaluation = null;
	context.request.status = 'pending-review';
	commitRequest(context.request, context.request.requester.name, `Added ${missingEvidence.label}`, note);
	return serializeWorkspace();
}

/**
 * Restores the deterministic mobile approval example.
 *
 * @returns {object} Clean mobile approval workspace.
 */
export function resetMobileApprovalWorkspace() {
	sequence = 5200;
	mobileApprovalState = createState();
	return serializeWorkspace();
}

/**
 * Creates clean mutable mobile approval state.
 *
 * @returns {object} Mobile task state.
 */
function createState() {
	return {
		requests: clone(requestSeeds),
		challenges: [],
		activity: [
			{ id: 'activity_mobile_1', actor: 'Tasks router', action: 'Prioritized three approvals', detail: 'Two spend decisions and one specialist escalation need attention.', createdAt: 'Today · 15:21' },
			{ id: 'activity_mobile_2', actor: 'Push service', action: 'Delivered expense exception', detail: 'Client dinner exception opened on Noah’s trusted device.', createdAt: 'Today · 15:22' },
		],
	};
}

/**
 * Serializes task state with safe catalogs and derived summary counts.
 *
 * @returns {object} JSON-safe mobile approval workspace.
 */
function serializeWorkspace() {
	const openRequests = mobileApprovalState.requests.filter((request) => !isFinal(request));
	const activeRequests = openRequests.filter((request) => request.status !== 'escalated');
	return clone({
		requests: mobileApprovalState.requests,
		activity: mobileApprovalState.activity,
		actor: currentActor,
		catalog: {
			queueOptions: [
				{ value: 'needs-me', label: 'Needs me', description: 'Active tasks assigned to your approval step.' },
				{ value: 'due-soon', label: 'Due soon', description: 'Tasks due today or within two hours.' },
				{ value: 'blocked', label: 'Blocked', description: 'Missing evidence or specialist authority.' },
				{ value: 'done', label: 'Done', description: 'Approved and declined mobile decisions.' },
			],
			typeOptions: [
				{ value: 'all', label: 'All task types', description: 'Expenses, reimbursements, spend, and access.' },
				...uniqueTypeOptions(mobileApprovalState.requests),
			],
			decisionActions,
			reasonOptions,
		},
		summary: {
			pending: activeRequests.filter((request) => ['pending-review', 'ready-to-decide'].includes(request.status)).length,
			dueSoon: activeRequests.filter((request) => ['42m', '2h', 'Today'].includes(request.due)).length,
			blocked: activeRequests.filter((request) => ['blocked', 'waiting-on-requester'].includes(request.status)).length,
			completed: mobileApprovalState.requests.filter(isFinal).length,
		},
	});
}

/**
 * Approves a policy-ready request after acknowledgement and optional step-up.
 *
 * @param {object} targetRequest Mutable approval request.
 * @param {object} decision Structured approval fields.
 * @returns {object} Updated workspace or API error.
 */
function approveRequest(targetRequest, decision) {
	if (!hasCurrentPolicy(targetRequest) || !targetRequest.policyEvaluation.ready) return error('Run the current policy evaluation before approval.', 409);
	if (!decision.acknowledged) return error('Acknowledge the evidence, policy result, and payment impact.', 422);
	if (targetRequest.policy.requiresStepUp && !consumeStepUpToken(targetRequest.id, decision.stepUpToken)) return error('Verify this trusted device before approval.', 401);
	sequence += 1;
	const decisionId = `mobile_decision_${sequence}`;
	const receipt = `approval_receipt_${sequence}`;
	targetRequest.decision = {
		id: decisionId,
		action: 'approve',
		reason: decision.reason,
		note: decision.note,
		actor: currentActor.name,
		device: currentActor.device.label,
		policyRunId: targetRequest.policyEvaluation.id,
		receipt,
		createdAt: 'Just now',
	};
	targetRequest.status = 'approved';
	targetRequest.undo = { available: true, decisionId, expiresLabel: '6 second demo window' };
	const currentStep = targetRequest.approvers.find((approver) => approver.owner === currentActor.name && approver.status === 'waiting');
	if (currentStep) {
		currentStep.status = 'approved';
		currentStep.decidedAt = 'Just now';
	}
	commitRequest(targetRequest, currentActor.name, 'Approved from trusted mobile device', receipt);
	return serializeWorkspace();
}

/**
 * Returns a request to its owner with a durable information request.
 *
 * @param {object} targetRequest Mutable approval request.
 * @param {object} decision Structured request-information fields.
 * @returns {object} Updated workspace.
 */
function requestMoreInformation(targetRequest, decision) {
	sequence += 1;
	targetRequest.requestInfo = {
		id: `information_request_${sequence}`,
		state: 'delivered',
		reason: decision.reason,
		note: decision.note,
		channel: 'push + email',
		createdAt: 'Just now',
	};
	targetRequest.status = 'waiting-on-requester';
	targetRequest.policyEvaluation = null;
	commitRequest(targetRequest, currentActor.name, 'Requested more information', targetRequest.requestInfo.id);
	return serializeWorkspace();
}

/**
 * Declines a reviewed request and preserves an undoable decision receipt.
 *
 * @param {object} targetRequest Mutable approval request.
 * @param {object} decision Structured decline fields.
 * @returns {object} Updated workspace or API error.
 */
function declineRequest(targetRequest, decision) {
	if (!decision.acknowledged) return error('Acknowledge that the requester will be notified.', 422);
	sequence += 1;
	const decisionId = `mobile_decision_${sequence}`;
	const receipt = `decline_receipt_${sequence}`;
	targetRequest.decision = { id: decisionId, action: 'decline', ...decision, actor: currentActor.name, device: currentActor.device.label, receipt, createdAt: 'Just now' };
	targetRequest.status = 'declined';
	targetRequest.undo = { available: true, decisionId, expiresLabel: '6 second demo window' };
	commitRequest(targetRequest, currentActor.name, 'Declined mobile approval', receipt);
	return serializeWorkspace();
}

/**
 * Routes an out-of-scope request to its specialist approval group.
 *
 * @param {object} targetRequest Mutable approval request.
 * @param {object} decision Structured escalation fields.
 * @returns {object} Updated workspace.
 */
function escalateRequest(targetRequest, decision) {
	const securityStep = targetRequest.approvers.find((approver) => approver.id === 'security');
	if (securityStep) {
		securityStep.owner = 'Amina Yusuf';
		securityStep.status = 'waiting';
	}
	sequence += 1;
	targetRequest.decision = { id: `mobile_decision_${sequence}`, action: 'escalate', ...decision, actor: currentActor.name, device: currentActor.device.label, receipt: `escalation_receipt_${sequence}`, createdAt: 'Just now' };
	targetRequest.status = 'escalated';
	targetRequest.assignedTo = 'Amina Yusuf';
	commitRequest(targetRequest, currentActor.name, 'Escalated to security review', targetRequest.decision.receipt);
	return serializeWorkspace();
}

/**
 * Builds evidence, authority, route, and device checks for one request.
 *
 * @param {object} targetRequest Approval request.
 * @returns {Array<object>} Policy check records.
 */
function buildPolicyChecks(targetRequest) {
	const evidenceComplete = targetRequest.evidence.every((item) => item.status === 'verified');
	const amountWithinAuthority = targetRequest.policy.amount <= targetRequest.policy.reviewerLimit;
	return [
		createCheck('evidence', 'Required evidence', evidenceComplete ? 'passed' : 'blocked', evidenceComplete ? `${targetRequest.evidence.length} checksummed items` : 'One required attachment is missing.'),
		createCheck('separation', 'Separation of duties', targetRequest.requester.id !== currentActor.id ? 'passed' : 'blocked', `${targetRequest.requester.name} requested · ${currentActor.name} reviews`),
		createCheck('scope', 'Reviewer authority', targetRequest.policy.scopeAllowed && amountWithinAuthority ? 'passed' : 'blocked', targetRequest.policy.scopeAllowed ? `Within ${currentActor.role.toLowerCase()} limit.` : 'A security reviewer owns this scope.'),
		createCheck('exception', 'Policy exception', targetRequest.policy.amount > targetRequest.policy.standardLimit ? 'advisory' : 'passed', targetRequest.policy.amount > targetRequest.policy.standardLimit ? `${targetRequest.ask.secondary}; explicit approval required.` : 'Within standard policy.'),
		createCheck('device', 'Trusted decision device', currentActor.device.trusted ? 'passed' : 'blocked', `${currentActor.device.label} · ${currentActor.device.platform}`),
	];
}

/**
 * Creates one semantic mobile policy check.
 *
 * @param {string} id Check identifier.
 * @param {string} label Check label.
 * @param {'passed'|'advisory'|'blocked'} state Check state.
 * @param {string} detail Supporting policy evidence.
 * @returns {object} Policy check.
 */
function createCheck(id, label, state, detail) {
	return { id, label, state, detail };
}

/**
 * Reports whether a request has a policy evaluation for its current revision.
 *
 * @param {object} targetRequest Approval request.
 * @returns {boolean} Whether the policy receipt is current.
 */
function hasCurrentPolicy(targetRequest) {
	return Boolean(targetRequest.policyEvaluation && targetRequest.policyEvaluation.revision === targetRequest.revision);
}

/**
 * Consumes a verified, single-use step-up token for one request.
 *
 * @param {string} requestId Approval request identifier.
 * @param {string} token Step-up token.
 * @returns {boolean} Whether a matching token was consumed.
 */
function consumeStepUpToken(requestId, token) {
	const challenge = mobileApprovalState.challenges.find((item) => item.requestId === requestId && item.token === token && item.state === 'verified');
	if (!challenge) return false;
	challenge.state = 'consumed';
	return true;
}

/**
 * Returns safe challenge data while withholding the verification token.
 *
 * @param {object} challenge Internal challenge.
 * @returns {object} Public challenge details.
 */
function publicChallenge(challenge) {
	return {
		id: challenge.id,
		requestId: challenge.requestId,
		state: challenge.state,
		attemptsRemaining: challenge.attemptsRemaining,
		device: challenge.device,
		expiresAt: challenge.expiresAt,
		demoCode: challenge.code,
		verifiedAt: challenge.verifiedAt || null,
	};
}

/**
 * Returns unique request-type select options.
 *
 * @param {Array<object>} requests Approval requests.
 * @returns {Array<object>} Rich request-type options.
 */
function uniqueTypeOptions(requests) {
	return [...new Map(requests.map((request) => [request.type, { value: request.type, label: request.typeLabel, description: `Show ${request.typeLabel.toLowerCase()} tasks.` }])).values()];
}

/**
 * Returns a mutable request after validating existence and exact revision.
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
 * Finds one request by identifier.
 *
 * @param {string} requestId Approval request identifier.
 * @returns {object|null} Matching request or null.
 */
function findRequest(requestId) {
	return mobileApprovalState.requests.find((request) => request.id === requestId) || null;
}

/**
 * Reports whether a request is in a terminal state.
 *
 * @param {object} targetRequest Approval request.
 * @returns {boolean} Whether no further standard decision is expected.
 */
function isFinal(targetRequest) {
	return ['approved', 'declined'].includes(targetRequest.status);
}

/**
 * Commits a request mutation and appends request and workspace activity.
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
	const event = { id: `mobile_event_${sequence}`, actor, action, detail, createdAt: 'Just now' };
	targetRequest.timeline.unshift(event);
	mobileApprovalState.activity.unshift({ ...event, requestId: targetRequest.id, title: targetRequest.title });
}

/**
 * Creates an exact-revision conflict response.
 *
 * @param {object} targetRequest Current approval request.
 * @returns {object} Conflict response.
 */
function conflict(targetRequest) {
	return { error: `Task changed. Refresh revision ${targetRequest.revision} before continuing.`, status: 409, currentRevision: targetRequest.revision };
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
