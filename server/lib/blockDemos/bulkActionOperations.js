const currentOperator = {
	id: 'usr_avery',
	name: 'Avery Stone',
	initials: 'AS',
	role: 'Revenue operations manager',
	permissions: ['billing:pause', 'customer:notify', 'compliance:hold', 'success-tier:update'],
};

const approvalActor = {
	id: 'usr_rhea',
	name: 'Rhea Patel',
	initials: 'RP',
	role: 'Finance controller',
};

const actionCatalog = [
	{
		value: 'pause-billing',
		label: 'Pause billing',
		description: 'Stop upcoming charges while product access remains active.',
		impact: 'Revenue hold',
		permission: 'billing:pause',
		approvalThreshold: 10000,
		approvalOwner: approvalActor.name,
		notificationDefault: true,
	},
	{
		value: 'renewal-notice',
		label: 'Send renewal notice',
		description: 'Send account owners a renewal timeline and next action.',
		impact: 'Customer communication',
		permission: 'customer:notify',
		approvalThreshold: null,
		approvalOwner: null,
		notificationDefault: true,
	},
	{
		value: 'compliance-hold',
		label: 'Apply compliance hold',
		description: 'Prevent deletion and export changes until legal review completes.',
		impact: 'Restricted data lifecycle',
		permission: 'compliance:hold',
		approvalThreshold: 0,
		approvalOwner: 'Legal operations',
		notificationDefault: false,
	},
	{
		value: 'intensive-success',
		label: 'Move to intensive success',
		description: 'Assign the selected accounts to the intensive success programme.',
		impact: 'Service tier change',
		permission: 'success-tier:update',
		approvalThreshold: null,
		approvalOwner: null,
		notificationDefault: false,
	},
];

const accountSeeds = [
	{
		id: 'acct_arcadia',
		version: 8,
		name: 'Arcadia Health',
		owner: 'Nina Patel',
		ownerEmail: 'nina@arcadia.example',
		plan: 'Scale',
		status: 'At risk',
		revenue: 5400,
		users: 84,
		risk: 'high',
		billingStatus: 'active',
		openInvoice: true,
		complianceHold: false,
		successTier: 'standard',
		updatedAt: 'Today · 13:42',
	},
	{
		id: 'acct_harbor',
		version: 12,
		name: 'Harbor Retail',
		owner: 'Marco Ruiz',
		ownerEmail: 'marco@harbor.example',
		plan: 'Growth',
		status: 'Renewal due',
		revenue: 3180,
		users: 41,
		risk: 'medium',
		billingStatus: 'active',
		openInvoice: false,
		complianceHold: false,
		successTier: 'standard',
		updatedAt: 'Today · 12:16',
	},
	{
		id: 'acct_northstar',
		version: 4,
		name: 'Northstar Labs',
		owner: 'Avery Stone',
		ownerEmail: 'avery@northstar.example',
		plan: 'Scale',
		status: 'Open invoice',
		revenue: 4260,
		users: 63,
		risk: 'medium',
		billingStatus: 'active',
		openInvoice: true,
		complianceHold: false,
		successTier: 'standard',
		updatedAt: 'Yesterday · 17:08',
	},
	{
		id: 'acct_luma',
		version: 5,
		name: 'Luma Works',
		owner: 'Priya Shah',
		ownerEmail: 'priya@luma.example',
		plan: 'Starter',
		status: 'Healthy',
		revenue: 780,
		users: 12,
		risk: 'low',
		billingStatus: 'active',
		openInvoice: false,
		complianceHold: false,
		successTier: 'standard',
		updatedAt: 'Today · 09:31',
	},
	{
		id: 'acct_summit',
		version: 9,
		name: 'Summit Freight',
		owner: 'Jules Carter',
		ownerEmail: 'jules@summit.example',
		plan: 'Growth',
		status: 'Contract review',
		revenue: 2210,
		users: 26,
		risk: 'low',
		billingStatus: 'active',
		openInvoice: false,
		complianceHold: false,
		successTier: 'standard',
		updatedAt: '3 days ago',
	},
	{
		id: 'acct_cinder',
		version: 6,
		name: 'Cinder Labs',
		owner: 'Theo Grant',
		ownerEmail: 'theo@cinder.example',
		plan: 'Scale',
		status: 'Billing paused',
		revenue: 6100,
		users: 71,
		risk: 'high',
		billingStatus: 'paused',
		openInvoice: false,
		complianceHold: false,
		successTier: 'intensive',
		updatedAt: 'Jun 18 · 10:05',
	},
	{
		id: 'acct_brightwell',
		version: 3,
		name: 'Brightwell Studio',
		owner: 'Mina Okafor',
		ownerEmail: 'mina@brightwell.example',
		plan: 'Growth',
		status: 'Trial',
		revenue: 1420,
		users: 18,
		risk: 'low',
		billingStatus: 'trial',
		openInvoice: false,
		complianceHold: false,
		successTier: 'standard',
		updatedAt: 'Today · 08:54',
	},
	{
		id: 'acct_sable',
		version: 14,
		name: 'Sable Security',
		owner: 'Elena Rossi',
		ownerEmail: 'elena@sable.example',
		plan: 'Scale',
		status: 'Healthy',
		revenue: 4880,
		users: 72,
		risk: 'low',
		billingStatus: 'active',
		openInvoice: false,
		complianceHold: true,
		successTier: 'standard',
		updatedAt: 'Yesterday · 15:44',
	},
];

const segmentCatalog = [
	{ value: 'all', label: 'All accounts', description: 'The complete account operations dataset.' },
	{ value: 'selected', label: 'Selected accounts', description: 'Only records currently included in this batch.' },
	{ value: 'at-risk', label: 'At-risk accounts', description: 'High-risk or explicitly at-risk accounts.' },
	{ value: 'open-invoice', label: 'Open invoices', description: 'Accounts with an unsettled invoice.' },
	{ value: 'billing-active', label: 'Active billing', description: 'Accounts that can receive billing actions.' },
];

const recentJobSeeds = [
	{ id: 'bulk_job_6088', action: 'Send renewal notice', status: 'completed', summary: '24 of 24 updated', actor: 'Customer success', createdAt: 'Today · 11:40' },
	{ id: 'bulk_job_6072', action: 'Apply compliance hold', status: 'completed-with-errors', summary: '18 updated · 2 conflicts', actor: 'Legal operations', createdAt: 'Yesterday · 16:12' },
	{ id: 'bulk_job_6049', action: 'Move to intensive success', status: 'cancelled', summary: 'Cancelled before processing', actor: currentOperator.name, createdAt: 'Jul 30 · 09:18' },
];

let sequence = 6100;
let bulkActionState = createState();

/**
 * Returns the current bulk action workspace.
 *
 * @returns {object} JSON-safe workspace, catalogs, current workflow, and job history.
 */
export function getBulkActionWorkspace() {
	return serializeWorkspace();
}

/**
 * Persists batch selection and configuration with exact-revision protection.
 *
 * @param {Record<string, unknown>} input Draft fields and current workspace revision.
 * @returns {object} Updated workspace or API error.
 */
export function updateBulkActionDraft(input = {}) {
	const revisionError = requireRevision(input.revision);
	if (revisionError) return revisionError;
	if (bulkActionState.job && ['queued', 'working'].includes(bulkActionState.job.status)) return error('Cancel or finish the active job before editing its source batch.', 409);
	const draftResult = buildDraftInput(input);
	if (draftResult.error) return draftResult;
	bulkActionState.draft = draftResult.draft;
	invalidatePreparedWorkflow();
	commitState(currentOperator.name, 'Updated batch draft', `${bulkActionState.draft.selectedIds.length} accounts selected.`);
	return serializeWorkspace();
}

/**
 * Creates an immutable impact preview from the current draft and source versions.
 *
 * @param {Record<string, unknown>} input Draft values and exact workspace revision.
 * @returns {object} Updated workspace with preview or API error.
 */
export function createBulkActionPreview(input = {}) {
	const revisionError = requireRevision(input.revision);
	if (revisionError) return revisionError;
	if (bulkActionState.job && ['queued', 'working'].includes(bulkActionState.job.status)) return error('Finish the active job before creating another preview.', 409);
	const draftResult = buildDraftInput(input);
	if (draftResult.error) return draftResult;
	const reason = draftResult.draft.reason.trim();
	if (reason.length < 24) return error('Add an audit reason of at least 24 characters.', 422);
	if (!draftResult.draft.selectedIds.length) return error('Select at least one account before previewing impact.', 422);
	const action = findAction(draftResult.draft.actionId);
	if (!action) return error('Choose a supported bulk action.', 422);
	if (!currentOperator.permissions.includes(action.permission)) return error('The current operator cannot run this action.', 403);
	const selectedAccounts = bulkActionState.accounts.filter((account) => draftResult.draft.selectedIds.includes(account.id));
	const lines = selectedAccounts.map((account) => buildPreviewLine(action, account));
	const eligibleLines = lines.filter((line) => line.state === 'ready');
	if (!eligibleLines.length) return error('None of the selected accounts are eligible for this action.', 422);
	bulkActionState.draft = draftResult.draft;
	const impactedRevenue = sum(eligibleLines, (line) => line.revenue);
	const approvalRequired = action.approvalThreshold !== null && impactedRevenue >= action.approvalThreshold;
	sequence += 1;
	bulkActionState.revision += 1;
	bulkActionState.preview = {
		id: `bulk_preview_${sequence}`,
		receipt: `preview_receipt_${sequence}`,
		workspaceRevision: bulkActionState.revision,
		actionId: action.value,
		actionLabel: action.label,
		impactLabel: action.impact,
		reason,
		notifyCustomers: bulkActionState.draft.notifyCustomers,
		approvalRequired,
		approvalOwner: approvalRequired ? action.approvalOwner : null,
		readyToQueue: !approvalRequired,
		selectedCount: lines.length,
		eligibleCount: eligibleLines.length,
		excludedCount: lines.length - eligibleLines.length,
		impactedRevenue,
		impactedUsers: sum(eligibleLines, (line) => line.users),
		lines,
		checks: buildPreviewChecks(action, lines, reason, approvalRequired),
		createdAt: 'Just now',
	};
	bulkActionState.approval = null;
	bulkActionState.job = null;
	bulkActionState.phase = approvalRequired ? 'preview-ready' : 'ready-to-queue';
	addActivity('Impact preview created', `${eligibleLines.length} eligible · ${lines.length - eligibleLines.length} excluded · ${bulkActionState.preview.receipt}`, currentOperator.name);
	return serializeWorkspace();
}

/**
 * Routes a sensitive preview to its accountable approver.
 *
 * @param {Record<string, unknown>} input Preview id, note, and exact workspace revision.
 * @returns {object} Updated workspace with pending approval or API error.
 */
export function requestBulkActionApproval(input = {}) {
	const revisionError = requireRevision(input.revision);
	if (revisionError) return revisionError;
	const previewError = requirePreview(input.previewId);
	if (previewError) return previewError;
	if (!bulkActionState.preview.approvalRequired) return error('This preview can be queued without an approval.', 422);
	const note = String(input.note || '').trim();
	if (note.length < 20) return error('Add an approval note of at least 20 characters.', 422);
	sequence += 1;
	bulkActionState.approval = {
		id: `bulk_approval_${sequence}`,
		previewId: bulkActionState.preview.id,
		status: 'pending',
		owner: bulkActionState.preview.approvalOwner,
		requester: currentOperator.name,
		note,
		requestedAt: 'Just now',
		decidedAt: null,
		receipt: null,
	};
	bulkActionState.phase = 'awaiting-approval';
	commitState(currentOperator.name, 'Requested batch approval', `${bulkActionState.approval.owner} must approve ${bulkActionState.preview.receipt}.`);
	return serializeWorkspace();
}

/**
 * Simulates the accountable reviewer approving or rejecting a batch preview.
 *
 * @param {string} approvalId Approval identifier.
 * @param {Record<string, unknown>} input Decision and exact workspace revision.
 * @returns {object} Updated workspace or API error.
 */
export function decideBulkActionApproval(approvalId, input = {}) {
	const revisionError = requireRevision(input.revision);
	if (revisionError) return revisionError;
	if (!bulkActionState.approval || bulkActionState.approval.id !== approvalId) return error('Batch approval not found.', 404);
	if (bulkActionState.approval.status !== 'pending') return error('This batch approval already has a decision.', 409);
	const decision = String(input.decision || '');
	if (!['approved', 'rejected'].includes(decision)) return error('Choose an approval decision.', 422);
	sequence += 1;
	bulkActionState.approval.status = decision;
	bulkActionState.approval.decidedAt = 'Just now';
	bulkActionState.approval.receipt = `${decision}_receipt_${sequence}`;
	bulkActionState.preview.readyToQueue = decision === 'approved';
	bulkActionState.phase = decision === 'approved' ? 'ready-to-queue' : 'preview-ready';
	commitState(approvalActor.name, decision === 'approved' ? 'Approved batch preview' : 'Rejected batch preview', bulkActionState.approval.receipt);
	return serializeWorkspace();
}

/**
 * Queues an approved immutable preview as a deterministic background job.
 *
 * @param {Record<string, unknown>} input Preview id, acknowledgement, and exact workspace revision.
 * @returns {object} Updated workspace with queued job or API error.
 */
export function queueBulkActionJob(input = {}) {
	const revisionError = requireRevision(input.revision);
	if (revisionError) return revisionError;
	const previewError = requirePreview(input.previewId);
	if (previewError) return previewError;
	if (!bulkActionState.preview.readyToQueue) return error('Complete the required approval before queueing this job.', 409);
	if (input.acknowledged !== true) return error('Acknowledge the immutable preview and customer impact before queueing.', 422);
	sequence += 1;
	const results = bulkActionState.preview.lines
		.filter((line) => line.state === 'ready')
		.map((line, index) => ({
			id: `bulk_result_${sequence}_${index + 1}`,
			accountId: line.accountId,
			accountName: line.accountName,
			expectedVersion: line.expectedVersion,
			before: line.before,
			after: line.after,
			status: 'pending',
			success: null,
			error: null,
			retried: false,
		}));
	bulkActionState.job = {
		id: `bulk_job_${sequence}`,
		previewId: bulkActionState.preview.id,
		previewReceipt: bulkActionState.preview.receipt,
		actionId: bulkActionState.preview.actionId,
		actionLabel: bulkActionState.preview.actionLabel,
		status: 'queued',
		progress: 0,
		total: results.length,
		results,
		createdAt: 'Just now',
		startedAt: null,
		completedAt: null,
		receipt: null,
		retryReceipt: null,
	};
	bulkActionState.phase = 'run';
	commitState(currentOperator.name, 'Queued bulk job', `${bulkActionState.job.id} is locked to ${bulkActionState.preview.receipt}.`);
	return serializeWorkspace();
}

/**
 * Advances a queued job through deterministic safe-update processing.
 *
 * @param {string} jobId Job identifier.
 * @param {Record<string, unknown>} input Exact workspace revision.
 * @returns {object} Updated workspace or API error.
 */
export function advanceBulkActionJob(jobId, input = {}) {
	const revisionError = requireRevision(input.revision);
	if (revisionError) return revisionError;
	const jobError = requireJob(jobId);
	if (jobError) return jobError;
	if (!['queued', 'working'].includes(bulkActionState.job.status)) return error('This job cannot advance from its current state.', 409);
	if (bulkActionState.job.status === 'queued') {
		bulkActionState.job.status = 'working';
		bulkActionState.job.startedAt = 'Just now';
		simulateConcurrentAccountUpdate();
		processPendingResults(2);
		commitState('Bulk worker', 'Started bulk job', `${bulkActionState.job.progress} of ${bulkActionState.job.total} records processed.`);
		return serializeWorkspace();
	}
	processPendingResults(Number.POSITIVE_INFINITY);
	const failedCount = bulkActionState.job.results.filter((result) => result.status === 'failed').length;
	bulkActionState.job.status = failedCount ? 'completed-with-errors' : 'completed';
	bulkActionState.job.completedAt = 'Just now';
	sequence += 1;
	bulkActionState.job.receipt = `bulk_job_receipt_${sequence}`;
	bulkActionState.phase = 'results';
	commitState('Bulk worker', failedCount ? 'Completed with safe-update conflicts' : 'Completed bulk job', `${bulkActionState.job.progress} processed · ${failedCount} failed · ${bulkActionState.job.receipt}`);
	return serializeWorkspace();
}

/**
 * Retries one safe-update conflict against the current source version.
 *
 * @param {string} jobId Job identifier.
 * @param {Record<string, unknown>} input Failed result id and exact workspace revision.
 * @returns {object} Updated workspace or API error.
 */
export function retryBulkActionResult(jobId, input = {}) {
	const revisionError = requireRevision(input.revision);
	if (revisionError) return revisionError;
	const jobError = requireJob(jobId);
	if (jobError) return jobError;
	if (bulkActionState.job.status !== 'completed-with-errors') return error('Only completed jobs with failures can be retried.', 409);
	const result = bulkActionState.job.results.find((item) => item.id === String(input.resultId || ''));
	if (!result || result.status !== 'failed') return error('Failed job result not found.', 404);
	const account = findAccount(result.accountId);
	if (!account) return error('Source account not found.', 404);
	result.expectedVersion = account.version;
	result.error = null;
	result.status = 'pending';
	result.success = null;
	result.retried = true;
	processJobResult(result);
	bulkActionState.job.progress = bulkActionState.job.results.filter((item) => item.status !== 'pending').length;
	bulkActionState.job.status = bulkActionState.job.results.some((item) => item.status === 'failed') ? 'completed-with-errors' : 'completed';
	sequence += 1;
	bulkActionState.job.retryReceipt = `bulk_retry_receipt_${sequence}`;
	bulkActionState.phase = 'results';
	commitState(currentOperator.name, 'Retried safe-update conflict', `${result.accountName} refreshed to version ${result.expectedVersion} · ${bulkActionState.job.retryReceipt}`);
	return serializeWorkspace();
}

/**
 * Cancels a queued job before any record is processed.
 *
 * @param {string} jobId Job identifier.
 * @param {Record<string, unknown>} input Exact workspace revision.
 * @returns {object} Updated workspace or API error.
 */
export function cancelBulkActionJob(jobId, input = {}) {
	const revisionError = requireRevision(input.revision);
	if (revisionError) return revisionError;
	const jobError = requireJob(jobId);
	if (jobError) return jobError;
	if (bulkActionState.job.status !== 'queued') return error('Only a queued job can be cancelled.', 409);
	sequence += 1;
	bulkActionState.job.status = 'cancelled';
	bulkActionState.job.completedAt = 'Just now';
	bulkActionState.job.receipt = `bulk_cancel_receipt_${sequence}`;
	bulkActionState.phase = 'results';
	commitState(currentOperator.name, 'Cancelled bulk job', bulkActionState.job.receipt);
	return serializeWorkspace();
}

/**
 * Restores the deterministic bulk action workspace.
 *
 * @returns {object} Clean bulk action workspace.
 */
export function resetBulkActionWorkspace() {
	sequence = 6100;
	bulkActionState = createState();
	return serializeWorkspace();
}

/**
 * Creates clean mutable bulk action state.
 *
 * @returns {object} Initial server-owned workspace state.
 */
function createState() {
	return {
		revision: 12,
		phase: 'draft',
		accounts: clone(accountSeeds),
		draft: {
			selectedIds: ['acct_arcadia', 'acct_harbor', 'acct_northstar', 'acct_summit', 'acct_cinder'],
			actionId: 'pause-billing',
			reason: 'Pause billing while customer success confirms the renewal recovery plan.',
			notifyCustomers: true,
		},
		preview: null,
		approval: null,
		job: null,
		recentJobs: clone(recentJobSeeds),
		activity: [
			{ id: 'bulk_event_6100', action: 'Draft selection restored', detail: '5 accounts from Revenue recovery · EMEA.', actor: currentOperator.name, createdAt: 'Today · 14:04' },
			{ id: 'bulk_event_6099', action: 'Saved segment refreshed', detail: 'Source filters returned 8 current accounts.', actor: 'Segment worker', createdAt: 'Today · 14:03' },
		],
	};
}

/**
 * Serializes mutable state with catalogs and derived selection totals.
 *
 * @returns {object} JSON-safe bulk action workspace.
 */
function serializeWorkspace() {
	const selectedAccounts = findSelectedAccounts();
	return clone({
		revision: bulkActionState.revision,
		phase: bulkActionState.phase,
		actor: currentOperator,
		accounts: bulkActionState.accounts,
		draft: bulkActionState.draft,
		preview: bulkActionState.preview,
		approval: bulkActionState.approval,
		job: bulkActionState.job,
		recentJobs: bulkActionState.recentJobs,
		activity: bulkActionState.activity,
		catalog: {
			actions: actionCatalog,
			segments: segmentCatalog,
		},
		summary: {
			selected: selectedAccounts.length,
			monthlyValue: sum(selectedAccounts, (account) => account.revenue),
			users: sum(selectedAccounts, (account) => account.users),
			highRisk: selectedAccounts.filter((account) => account.risk === 'high').length,
		},
	});
}

/**
 * Builds supported draft fields without mutating workspace state.
 *
 * @param {Record<string, unknown>} input Candidate draft values.
 * @returns {{ draft: object }|{ error: string, status: number }} Candidate draft or validation error.
 */
function buildDraftInput(input) {
	const nextDraft = clone(bulkActionState.draft);
	if (Object.hasOwn(input, 'selectedIds')) {
		if (!Array.isArray(input.selectedIds)) return error('Selected account ids must be an array.', 422);
		const selectedIds = [...new Set(input.selectedIds.map((id) => String(id)))];
		if (selectedIds.some((id) => !findAccount(id))) return error('One or more selected accounts no longer exist.', 422);
		nextDraft.selectedIds = selectedIds;
	}
	if (Object.hasOwn(input, 'actionId')) {
		const actionId = String(input.actionId || '');
		if (!findAction(actionId)) return error('Choose a supported bulk action.', 422);
		nextDraft.actionId = actionId;
	}
	if (Object.hasOwn(input, 'reason')) nextDraft.reason = String(input.reason || '');
	if (Object.hasOwn(input, 'notifyCustomers')) nextDraft.notifyCustomers = input.notifyCustomers === true;
	return { draft: nextDraft };
}

/**
 * Clears downstream artifacts after the draft changes.
 *
 * @returns {void}
 */
function invalidatePreparedWorkflow() {
	bulkActionState.preview = null;
	bulkActionState.approval = null;
	bulkActionState.job = null;
	bulkActionState.phase = 'draft';
}

/**
 * Builds one immutable before-and-after line for the selected action.
 *
 * @param {object} action Bulk action definition.
 * @param {object} account Source account.
 * @returns {object} Preview line with eligibility and source version.
 */
function buildPreviewLine(action, account) {
	const eligibility = getEligibility(action.value, account);
	const diff = buildAccountDiff(action.value, account);
	return {
		id: `preview_line_${account.id}`,
		accountId: account.id,
		accountName: account.name,
		owner: account.owner,
		revenue: account.revenue,
		users: account.users,
		risk: account.risk,
		expectedVersion: account.version,
		state: eligibility.eligible ? 'ready' : 'excluded',
		detail: eligibility.detail,
		before: diff.before,
		after: diff.after,
	};
}

/**
 * Builds server-owned policy and impact checks for one preview.
 *
 * @param {object} action Bulk action definition.
 * @param {object[]} lines Preview lines.
 * @param {string} reason Audit reason.
 * @param {boolean} approvalRequired Whether approval is required.
 * @returns {object[]} Ordered preview checks.
 */
function buildPreviewChecks(action, lines, reason, approvalRequired) {
	const excludedCount = lines.filter((line) => line.state === 'excluded').length;
	const openInvoiceCount = lines.filter((line) => findAccount(line.accountId)?.openInvoice && line.state === 'ready').length;
	return [
		createCheck('permission', 'Operator permission', 'passed', `${currentOperator.role} has ${action.permission}.`),
		createCheck('reason', 'Audit reason', reason.length >= 24 ? 'passed' : 'blocked', `${reason.length} characters stored with the preview.`),
		createCheck('versions', 'Source versions', 'passed', `${lines.length} account revisions locked for safe updates.`),
		createCheck('eligibility', 'Action eligibility', excludedCount ? 'advisory' : 'passed', excludedCount ? `${excludedCount} ineligible account will be excluded.` : 'Every selected account is eligible.'),
		createCheck('invoices', 'Open invoices', openInvoiceCount ? 'warning' : 'passed', openInvoiceCount ? `${openInvoiceCount} eligible accounts have open invoices.` : 'No eligible account has an open invoice.'),
		createCheck('approval', 'Approval route', approvalRequired ? 'warning' : 'passed', approvalRequired ? `${action.approvalOwner} must approve this immutable preview.` : 'No additional approval is required.'),
	];
}

/**
 * Returns whether one account can receive the selected action.
 *
 * @param {string} actionId Bulk action identifier.
 * @param {object} account Source account.
 * @returns {{ eligible: boolean, detail: string }} Eligibility result.
 */
function getEligibility(actionId, account) {
	if (actionId === 'pause-billing' && account.billingStatus === 'paused') return { eligible: false, detail: 'Billing is already paused.' };
	if (actionId === 'renewal-notice' && !account.ownerEmail) return { eligible: false, detail: 'No account-owner email is available.' };
	if (actionId === 'compliance-hold' && account.complianceHold) return { eligible: false, detail: 'A compliance hold is already active.' };
	if (actionId === 'intensive-success' && account.successTier === 'intensive') return { eligible: false, detail: 'The intensive success tier is already assigned.' };
	return { eligible: true, detail: 'Ready for the immutable batch snapshot.' };
}

/**
 * Returns the before-and-after display value for an action and account.
 *
 * @param {string} actionId Bulk action identifier.
 * @param {object} account Source account.
 * @returns {{ before: string, after: string }} Human-readable diff.
 */
function buildAccountDiff(actionId, account) {
	if (actionId === 'pause-billing') return { before: account.billingStatus === 'paused' ? 'Billing paused' : 'Billing active', after: 'Billing paused' };
	if (actionId === 'renewal-notice') return { before: 'No current notice', after: 'Renewal notice queued' };
	if (actionId === 'compliance-hold') return { before: account.complianceHold ? 'Hold active' : 'No hold', after: 'Compliance hold active' };
	return { before: account.successTier === 'intensive' ? 'Intensive success' : 'Standard success', after: 'Intensive success' };
}

/**
 * Simulates one account changing after the immutable preview was created.
 *
 * @returns {void}
 */
function simulateConcurrentAccountUpdate() {
	const conflictResult = bulkActionState.job.results.find((result) => result.accountId === 'acct_northstar');
	if (!conflictResult) return;
	const account = findAccount(conflictResult.accountId);
	if (!account || account.version !== conflictResult.expectedVersion) return;
	account.version += 1;
	account.updatedAt = 'Just now · invoice reconciled';
	account.openInvoice = false;
}

/**
 * Processes a bounded number of pending job results.
 *
 * @param {number} limit Maximum number of pending results to process.
 * @returns {void}
 */
function processPendingResults(limit) {
	const pending = bulkActionState.job.results.filter((result) => result.status === 'pending').slice(0, limit);
	pending.forEach(processJobResult);
	bulkActionState.job.progress = bulkActionState.job.results.filter((result) => result.status !== 'pending').length;
}

/**
 * Applies one safe update or records an update conflict.
 *
 * @param {object} result Mutable job result.
 * @returns {void}
 */
function processJobResult(result) {
	const account = findAccount(result.accountId);
	if (!account) {
		result.status = 'failed';
		result.success = false;
		result.error = { code: 'NOT_FOUND', detail: 'The source account no longer exists.' };
		return;
	}
	if (account.version !== result.expectedVersion) {
		result.status = 'failed';
		result.success = false;
		result.error = { code: 'UPDATE_CONFLICT', detail: `Expected version ${result.expectedVersion}; current version is ${account.version}.` };
		return;
	}
	applyActionToAccount(bulkActionState.job.actionId, account);
	result.status = 'success';
	result.success = true;
	result.error = null;
	result.completedAt = 'Just now';
}

/**
 * Mutates one account according to the approved bulk action.
 *
 * @param {string} actionId Bulk action identifier.
 * @param {object} account Mutable source account.
 * @returns {void}
 */
function applyActionToAccount(actionId, account) {
	if (actionId === 'pause-billing') {
		account.billingStatus = 'paused';
		account.status = 'Billing paused';
	} else if (actionId === 'renewal-notice') {
		account.lastNoticeAt = 'Just now';
	} else if (actionId === 'compliance-hold') {
		account.complianceHold = true;
		account.status = 'Compliance hold';
	} else {
		account.successTier = 'intensive';
	}
	account.version += 1;
	account.updatedAt = 'Just now';
}

/**
 * Creates one policy check.
 *
 * @param {string} id Stable check identifier.
 * @param {string} label Human-readable check label.
 * @param {string} state Check state.
 * @param {string} detail Supporting evidence.
 * @returns {object} Policy check.
 */
function createCheck(id, label, state, detail) {
	return { id, label, state, detail };
}

/**
 * Commits one workspace revision and activity event.
 *
 * @param {string} actor Activity actor.
 * @param {string} action Activity action.
 * @param {string} detail Activity detail.
 * @returns {void}
 */
function commitState(actor, action, detail) {
	bulkActionState.revision += 1;
	addActivity(action, detail, actor);
}

/**
 * Adds one newest-first workspace activity event.
 *
 * @param {string} action Activity action.
 * @param {string} detail Activity detail.
 * @param {string} actor Activity actor.
 * @returns {void}
 */
function addActivity(action, detail, actor) {
	sequence += 1;
	bulkActionState.activity.unshift({ id: `bulk_event_${sequence}`, action, detail, actor, createdAt: 'Just now' });
}

/**
 * Validates the exact workspace revision.
 *
 * @param {unknown} revision Candidate revision.
 * @returns {object|null} Conflict response or null.
 */
function requireRevision(revision) {
	if (Number(revision) === bulkActionState.revision) return null;
	return {
		error: 'This bulk-operation workspace changed. Refresh before continuing.',
		status: 409,
		conflict: {
			expectedRevision: bulkActionState.revision,
			receivedRevision: Number(revision),
		},
	};
}

/**
 * Validates the active immutable preview.
 *
 * @param {unknown} previewId Candidate preview id.
 * @returns {object|null} API error or null.
 */
function requirePreview(previewId) {
	if (bulkActionState.preview && bulkActionState.preview.id === String(previewId || '')) return null;
	return error('Impact preview not found. Create a current preview first.', 404);
}

/**
 * Validates the active bulk job.
 *
 * @param {string} jobId Candidate job id.
 * @returns {object|null} API error or null.
 */
function requireJob(jobId) {
	if (bulkActionState.job && bulkActionState.job.id === jobId) return null;
	return error('Bulk job not found.', 404);
}

/**
 * Returns the selected account records in source order.
 *
 * @returns {object[]} Selected accounts.
 */
function findSelectedAccounts() {
	return bulkActionState.accounts.filter((account) => bulkActionState.draft.selectedIds.includes(account.id));
}

/**
 * Finds an account by id.
 *
 * @param {string} accountId Account identifier.
 * @returns {object|null} Mutable account or null.
 */
function findAccount(accountId) {
	return bulkActionState.accounts.find((account) => account.id === accountId) || null;
}

/**
 * Finds an action definition by id.
 *
 * @param {string} actionId Action identifier.
 * @returns {object|null} Action definition or null.
 */
function findAction(actionId) {
	return actionCatalog.find((action) => action.value === actionId) || null;
}

/**
 * Sums numeric values from a collection.
 *
 * @param {object[]} items Source items.
 * @param {(item: object) => number} accessor Numeric accessor.
 * @returns {number} Sum of values.
 */
function sum(items, accessor) {
	return items.reduce((total, item) => total + Number(accessor(item) || 0), 0);
}

/**
 * Creates a consistent API error object.
 *
 * @param {string} message Error message.
 * @param {number} status HTTP status.
 * @returns {{ error: string, status: number }} API error.
 */
function error(message, status) {
	return { error: message, status };
}

/**
 * Creates a JSON-safe structural clone.
 *
 * @param {unknown} value Value to clone.
 * @returns {any} Cloned value.
 */
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}
