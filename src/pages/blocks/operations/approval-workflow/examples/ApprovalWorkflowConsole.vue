<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDatePicker,
	DomDialog,
	DomEmptyState,
	DomJsonViewer,
	DomProgress,
	DomRadioGroup,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextDiff,
	DomToggle,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/approval-workflow';
const tabs = [
	{ key: 'review', label: 'Review' },
	{ key: 'policy', label: 'Policy' },
	{ key: 'activity', label: 'Activity' },
];

const workspace = ref(null);
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const queueFilter = ref('mine');
const typeFilter = ref('all');
const selectedRequestId = ref('approval_req_4821');
const activeView = ref('review');
const decisionDialogOpen = ref(false);
const delegationDialogOpen = ref(false);
const executionDialogOpen = ref(false);
const executionAcknowledged = ref(false);
const decisionForm = ref(createDecisionForm());
const delegationForm = ref(createDelegationForm());

const selectedRequest = computed(getSelectedRequest);
const filteredRequests = computed(getFilteredRequests);
const requestOptions = computed(buildRequestOptions);
const nextAction = computed(getNextAction);
const evidencePacket = computed(buildEvidencePacket);
const executionProgress = computed(getExecutionProgress);

onMounted(loadWorkspace);
watch([queueFilter, typeFilter], ensureSelectedRequest);
watch(selectedRequestId, resetLocalForms);

/**
 * Loads the server-owned approval workspace.
 *
 * @returns {Promise<void>} Resolves after workspace hydration.
 */
async function loadWorkspace() {
	loading.value = true;
	error.value = '';
	try {
		applyWorkspace(await apiRequest(`${apiBase}/bootstrap`));
	} catch (requestError) {
		error.value = requestError.message;
	} finally {
		loading.value = false;
	}
}

/**
 * Assigns the selected request to the active reviewer.
 *
 * @returns {Promise<void>} Resolves after assignment.
 */
async function claimRequest() {
	await mutateRequest('claim', 'claim', revisionBody(), 'Approval request assigned to you.');
}

/**
 * Runs the authoritative approval policy against current evidence.
 *
 * @returns {Promise<void>} Resolves after policy evaluation.
 */
async function evaluatePolicy() {
	const result = await mutateRequest('evaluate', 'evaluate', revisionBody(), 'Policy evaluation completed.');
	if (result) activeView.value = 'policy';
}

/**
 * Verifies the missing evidence record in the blocked export branch.
 *
 * @returns {Promise<void>} Resolves after evidence verification.
 */
async function verifyEvidence() {
	const result = await mutateRequest('evidence', 'evidence', {
		...revisionBody(),
		note: 'Verified the signed processor agreement against the vendor record.',
	}, 'Missing agreement verified and attached.');
	if (result) activeView.value = 'policy';
}

/**
 * Opens a fresh structured decision dialog.
 *
 * @returns {void}
 */
function openDecisionDialog() {
	decisionForm.value = createDecisionForm(selectedRequest.value);
	decisionDialogOpen.value = true;
}

/**
 * Persists the current reviewer's structured decision.
 *
 * @returns {Promise<void>} Resolves after the decision is recorded.
 */
async function submitDecision() {
	const result = await mutateRequest('decision', 'decision', {
		...revisionBody(),
		...decisionForm.value,
	}, decisionForm.value.action === 'approve' ? 'Approval step completed.' : 'Decision recorded and requester notified.');
	if (result) {
		decisionDialogOpen.value = false;
		activeView.value = result.requests.find((request) => request.id === selectedRequestId.value)?.execution ? 'activity' : 'review';
	}
}

/**
 * Opens delegation controls for the selected approval step.
 *
 * @returns {void}
 */
function openDelegationDialog() {
	delegationForm.value = createDelegationForm();
	delegationDialogOpen.value = true;
}

/**
 * Delegates the current approval step to another eligible reviewer.
 *
 * @returns {Promise<void>} Resolves after delegation.
 */
async function delegateRequest() {
	const result = await mutateRequest('delegate', 'delegate', {
		...revisionBody(),
		...delegationForm.value,
	}, 'Approval step delegated with an expiry date.');
	if (result) delegationDialogOpen.value = false;
}

/**
 * Opens the controlled execution acknowledgement dialog.
 *
 * @returns {void}
 */
function openExecutionDialog() {
	executionAcknowledged.value = false;
	executionDialogOpen.value = true;
}

/**
 * Queues the approved change for controlled execution.
 *
 * @returns {Promise<void>} Resolves after execution is queued.
 */
async function executeRequest() {
	const result = await mutateRequest('execute', 'execute', {
		...revisionBody(),
		acknowledged: executionAcknowledged.value,
	}, 'Approved change queued for controlled execution.');
	if (result) {
		executionDialogOpen.value = false;
		activeView.value = 'activity';
	}
}

/**
 * Advances the deterministic change worker one step.
 *
 * @returns {Promise<void>} Resolves after execution state changes.
 */
async function advanceExecution() {
	const starting = selectedRequest.value?.execution?.state === 'queued';
	const result = await mutateRequest('advance', 'advance', revisionBody(), starting ? 'Controlled change started.' : 'Controlled change completed.');
	if (result) activeView.value = 'activity';
}

/**
 * Runs the highest-value action for the current request state.
 *
 * @returns {Promise<void>|void} Action completion or immediate dialog opening.
 */
function performNextAction() {
	if (nextAction.value.key === 'claim') return claimRequest();
	if (nextAction.value.key === 'evidence') return verifyEvidence();
	if (nextAction.value.key === 'evaluate') return evaluatePolicy();
	if (nextAction.value.key === 'decision') return openDecisionDialog();
	if (nextAction.value.key === 'execute') return openExecutionDialog();
	if (nextAction.value.key === 'advance') return advanceExecution();
	activeView.value = nextAction.value.view;
}

/**
 * Restores the deterministic approval example.
 *
 * @returns {Promise<void>} Resolves after reset.
 */
async function resetWorkspace() {
	const result = await performMutation('reset', `${apiBase}/reset`, { method: 'POST', body: {} }, 'Approval example restored.');
	if (!result) return;
	queueFilter.value = 'mine';
	typeFilter.value = 'all';
	selectedRequestId.value = 'approval_req_4821';
	activeView.value = 'review';
}

/**
 * Selects a request and returns to its review surface.
 *
 * @param {string} requestId Approval request identifier.
 * @returns {void}
 */
function selectRequest(requestId) {
	selectedRequestId.value = requestId;
	activeView.value = 'review';
}

/**
 * Posts one selected-request mutation through the shared workspace handler.
 *
 * @param {string} action Busy action identifier.
 * @param {string} endpoint Selected-request endpoint suffix.
 * @param {object} body Request body.
 * @param {string} successMessage Success notice.
 * @returns {Promise<object|null>} Updated workspace or null after failure.
 */
async function mutateRequest(action, endpoint, body, successMessage) {
	if (!selectedRequest.value) return null;
	return performMutation(action, `${apiBase}/requests/${selectedRequest.value.id}/${endpoint}`, { method: 'POST', body }, successMessage);
}

/**
 * Runs a JSON mutation with shared loading and error handling.
 *
 * @param {string} action Busy action identifier.
 * @param {string} url API URL.
 * @param {{ method: string, body: object }} options Request options.
 * @param {string} successMessage Success notice.
 * @returns {Promise<object|null>} Parsed response or null after failure.
 */
async function performMutation(action, url, options, successMessage) {
	busyAction.value = action;
	error.value = '';
	notice.value = '';
	try {
		const result = await apiRequest(url, options);
		applyWorkspace(result);
		notice.value = successMessage;
		return result;
	} catch (requestError) {
		error.value = requestError.message;
		return null;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Calls the approval JSON API and promotes HTTP errors to exceptions.
 *
 * @param {string} url API URL.
 * @param {{ method?: string, body?: object }} [options={}] Request options.
 * @returns {Promise<any>} Parsed JSON body.
 */
async function apiRequest(url, options = {}) {
	const response = await fetch(url, {
		method: options.method || 'GET',
		headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const result = await response.json();
	if (!response.ok) throw new Error(result.error || 'Approval workflow request failed.');
	return result;
}

/**
 * Replaces local state with the latest server workspace.
 *
 * @param {object} result Approval workspace.
 * @returns {void}
 */
function applyWorkspace(result) {
	workspace.value = result;
	ensureSelectedRequest();
}

/**
 * Returns the exact selected-request revision body.
 *
 * @returns {{ revision: number }} Revision payload.
 */
function revisionBody() {
	return { revision: selectedRequest.value.revision };
}

/**
 * Keeps the selected request inside the active filters.
 *
 * @returns {void}
 */
function ensureSelectedRequest() {
	if (!workspace.value) return;
	if (filteredRequests.value.some((request) => request.id === selectedRequestId.value)) return;
	selectedRequestId.value = filteredRequests.value[0]?.id || '';
}

/**
 * Restores request-specific form defaults and transient feedback.
 *
 * @returns {void}
 */
function resetLocalForms() {
	decisionForm.value = createDecisionForm(selectedRequest.value);
	delegationForm.value = createDelegationForm();
	notice.value = '';
	error.value = '';
}

/**
 * Creates structured decision defaults for one request.
 *
 * @param {object|null} [targetRequest=null] Selected approval request.
 * @returns {object} Decision form.
 */
function createDecisionForm(targetRequest = null) {
	const blocked = targetRequest?.status === 'blocked';
	return {
		action: blocked ? 'changes' : 'approve',
		reason: blocked ? 'missing-evidence' : 'policy-satisfied',
		note: blocked
			? 'Please attach the missing agreement and rerun the policy evaluation.'
			: 'Policy evidence, rollback coverage, and required approver routing were reviewed.',
		notifyRequester: true,
		createFollowUp: true,
		acknowledged: false,
	};
}

/**
 * Creates delegation form defaults.
 *
 * @returns {object} Delegation form.
 */
function createDelegationForm() {
	return {
		delegateId: 'usr_amina',
		until: '2026-06-14',
		note: 'Cover this approval step while I am unavailable.',
	};
}

/**
 * Returns the selected approval request.
 *
 * @returns {object|null} Selected request or null.
 */
function getSelectedRequest() {
	return workspace.value?.requests.find((request) => request.id === selectedRequestId.value) || null;
}

/**
 * Applies queue and request-type filters.
 *
 * @returns {Array<object>} Filtered approval requests.
 */
function getFilteredRequests() {
	return (workspace.value?.requests || []).filter((request) => {
		if (typeFilter.value !== 'all' && request.type !== typeFilter.value) return false;
		if (queueFilter.value === 'blocked') return request.status === 'blocked';
		if (queueFilter.value === 'decided') return ['approved', 'rejected', 'applied'].includes(request.status);
		if (queueFilter.value === 'mine') return request.assignedTo === workspace.value.actor.name || request.approvers.some((approver) => approver.ownerId === workspace.value.actor.id && approver.status === 'waiting');
		return !['rejected', 'applied'].includes(request.status);
	});
}

/**
 * Builds rich compact request select options.
 *
 * @returns {Array<object>} Request options.
 */
function buildRequestOptions() {
	return filteredRequests.value.map((request) => ({
		value: request.id,
		label: request.title,
		description: `${request.resource} · ${request.due}`,
	}));
}

/**
 * Builds immutable evidence payload data for the JSON viewer.
 *
 * @returns {object} Evidence packet.
 */
function buildEvidencePacket() {
	if (!selectedRequest.value) return {};
	return {
		requestId: selectedRequest.value.id,
		revision: selectedRequest.value.revision,
		policy: selectedRequest.value.policyId,
		evidence: selectedRequest.value.evidence.map((item) => ({ id: item.id, checksum: item.checksum, status: item.status })),
	};
}

/**
 * Returns the next safe action for the selected request.
 *
 * @returns {{ key: string, label: string, detail: string, view: string }} Next action.
 */
function getNextAction() {
	const request = selectedRequest.value;
	if (!request) return { key: 'view', label: 'Choose a request', detail: 'Select an approval from the inbox.', view: 'review' };
	if (!request.assignedTo) return { key: 'claim', label: 'Claim review', detail: 'Take ownership before evaluating or deciding.', view: 'review' };
	if (request.assignedTo !== workspace.value.actor.name) return { key: 'view', label: `Assigned to ${request.assignedTo}`, detail: 'Open the activity trail or choose another request.', view: 'activity' };
	if (request.execution?.state === 'ready') return { key: 'execute', label: 'Start controlled change', detail: 'Acknowledge impact and queue the locked snapshot.', view: 'activity' };
	if (['queued', 'applying'].includes(request.execution?.state)) return { key: 'advance', label: request.execution.state === 'queued' ? 'Begin execution' : 'Complete execution', detail: 'Advance the deterministic change worker.', view: 'activity' };
	if (request.status === 'applied') return { key: 'view', label: 'Change applied', detail: 'Review immutable execution proof.', view: 'activity' };
	if (request.evidence.some((item) => item.status === 'missing')) return { key: 'evidence', label: 'Verify missing evidence', detail: 'Attach the required agreement before policy evaluation.', view: 'policy' };
	if (!request.policyEvaluation || request.policyEvaluation.revision !== request.revision) return { key: 'evaluate', label: 'Run policy evaluation', detail: `Evaluate ${request.policyLabel}.`, view: 'policy' };
	if (request.policyEvaluation.ready && !request.decision) return { key: 'decision', label: 'Review decision', detail: 'Record a structured, policy-bound decision.', view: 'review' };
	if (request.status === 'blocked') return { key: 'view', label: 'Policy blocked', detail: 'Review failed checks before deciding.', view: 'policy' };
	return { key: 'view', label: statusLabel(request.status), detail: 'Review the latest request activity.', view: 'activity' };
}

/**
 * Maps execution state to a progress percentage.
 *
 * @returns {number} Execution percentage.
 */
function getExecutionProgress() {
	return { ready: 0, queued: 18, applying: 64, completed: 100 }[selectedRequest.value?.execution?.state] || 0;
}

/**
 * Reports whether the decision dialog can submit.
 *
 * @returns {boolean} Whether the form passes client-side guardrails.
 */
function canSubmitDecision() {
	return decisionForm.value.note.trim().length >= 20 && (decisionForm.value.action !== 'approve' || decisionForm.value.acknowledged);
}

/**
 * Calculates request readiness from policy and required approver evidence.
 *
 * @param {object} request Approval request.
 * @returns {number} Readiness percentage.
 */
function readinessPercent(request) {
	const policyChecks = request.policyEvaluation?.checks || [];
	const requiredApprovers = request.approvers.filter((approver) => approver.required);
	const complete = policyChecks.filter((check) => check.state === 'passed').length + requiredApprovers.filter((approver) => approver.status === 'approved').length;
	const total = policyChecks.length + requiredApprovers.length;
	return total ? Math.round((complete / total) * 100) : Math.round((requiredApprovers.filter((approver) => approver.status === 'approved').length / Math.max(requiredApprovers.length, 1)) * 100);
}

/**
 * Maps workflow state to a semantic DOM Studio tone.
 *
 * @param {string} status Workflow status.
 * @returns {string} Semantic tone.
 */
function statusTone(status) {
	return {
		'awaiting-review': 'warning',
		'in-review': 'info',
		'ready-for-decision': 'success',
		blocked: 'danger',
		approved: 'success',
		rejected: 'danger',
		'changes-requested': 'warning',
		escalated: 'warning',
		delegated: 'info',
		'waiting-approval': 'warning',
		applied: 'success',
		waiting: 'neutral',
		watching: 'neutral',
		passed: 'success',
		missing: 'danger',
		verified: 'success',
		ready: 'info',
		queued: 'neutral',
		applying: 'warning',
		completed: 'success',
		high: 'warning',
		critical: 'danger',
		medium: 'info',
	}[status] || 'neutral';
}

/**
 * Formats machine status into readable title case.
 *
 * @param {string} status Workflow status.
 * @returns {string} Readable label.
 */
function statusLabel(status) {
	return String(status || '').split(/[-_]/).map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(' ');
}
</script>

<template>
	<section class="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-canvas text-canvas-fg">
		<header class="shrink-0 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur sm:px-5">
			<div class="flex min-w-0 items-center justify-between gap-3">
				<div class="min-w-0">
					<div class="flex min-w-0 items-center gap-2">
						<h1 class="truncate text-sm font-semibold sm:text-base">Decision inbox</h1>
						<DomBadge tone="primary" variant="soft" size="sm">Policy-bound</DomBadge>
					</div>
					<p class="mt-0.5 hidden truncate text-xs text-muted-fg sm:block">Review sensitive changes without separating evidence, authority, and execution.</p>
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<div v-if="workspace" class="hidden items-center divide-x divide-border text-center text-xs md:flex">
						<div class="px-3"><p class="font-semibold">{{ workspace.summary.open }}</p><p class="text-muted-fg">Open</p></div>
						<div class="px-3"><p class="font-semibold">{{ workspace.summary.needsMe }}</p><p class="text-muted-fg">Need me</p></div>
						<div class="px-3"><p class="font-semibold">{{ workspace.summary.blocked }}</p><p class="text-muted-fg">Blocked</p></div>
					</div>
					<DomButton size="sm" variant="secondary" :loading="busyAction === 'reset'" @click="resetWorkspace">Reset</DomButton>
				</div>
			</div>
			<div v-if="workspace" class="mt-3 grid min-w-0 grid-cols-2 gap-2 xl:hidden">
				<DomSelect v-model="queueFilter" :options="workspace.catalog.queueOptions" label="Queue" chrome="compact" width="min-w-0" />
				<DomSelect v-model="typeFilter" :options="workspace.catalog.typeOptions" label="Type" chrome="compact" width="min-w-0" />
				<div class="col-span-2">
					<DomSelect v-model="selectedRequestId" :options="requestOptions" label="Request" chrome="compact" width="min-w-0">
						<template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template>
					</DomSelect>
				</div>
			</div>
		</header>

		<div v-if="loading" class="grid min-h-0 flex-1 gap-4 p-4 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
			<DomSkeleton height="100%" label="Loading approval inbox" />
			<DomSkeleton height="100%" label="Loading selected request" />
			<DomSkeleton class="hidden xl:block" height="100%" label="Loading decision context" />
		</div>

		<div v-else-if="workspace" class="grid min-h-0 flex-1 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
			<aside class="hidden min-h-0 border-r border-border bg-secondary/10 xl:flex xl:flex-col">
				<div class="grid gap-3 border-b border-border p-4">
					<DomSelect v-model="queueFilter" :options="workspace.catalog.queueOptions" label="Queue" width="min-w-0" />
					<DomSelect v-model="typeFilter" :options="workspace.catalog.typeOptions" label="Request type" width="min-w-0" />
				</div>
				<div class="flex items-center justify-between border-b border-border px-4 py-3">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Approvals</p>
					<DomBadge tone="neutral" variant="soft" size="sm">{{ filteredRequests.length }}</DomBadge>
				</div>
				<nav class="min-h-0 flex-1 overflow-y-auto" aria-label="Approval requests">
					<button v-for="request in filteredRequests" :key="request.id" type="button" class="grid w-full gap-2 border-b border-border px-4 py-3 text-left transition hover:bg-secondary/60" :class="request.id === selectedRequestId ? 'border-l-2 border-l-primary bg-secondary/70' : 'border-l-2 border-l-transparent'" @click="selectRequest(request.id)">
						<span class="flex items-start justify-between gap-3"><span class="min-w-0"><span class="block truncate text-sm font-semibold">{{ request.title }}</span><span class="mt-1 block truncate text-xs text-muted-fg">{{ request.resource }}</span></span><DomStatusPill :tone="statusTone(request.risk)" :label="statusLabel(request.risk)" size="sm" /></span>
						<span class="flex items-center justify-between gap-3 text-xs text-muted-fg"><span>{{ request.requester.name }}</span><span>{{ request.sla }}</span></span>
					</button>
				</nav>
			</aside>

			<main class="flex min-h-0 min-w-0 flex-col overflow-hidden">
				<template v-if="selectedRequest">
					<div class="shrink-0 border-b border-border px-4 py-3 sm:px-5">
						<div class="flex min-w-0 items-start justify-between gap-3">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2"><DomStatusPill :tone="statusTone(selectedRequest.status)" :label="statusLabel(selectedRequest.status)" size="sm" /><DomStatusPill :tone="statusTone(selectedRequest.risk)" :label="`${statusLabel(selectedRequest.risk)} risk`" size="sm" /></div>
								<h2 class="mt-2 truncate text-lg font-semibold">{{ selectedRequest.title }}</h2>
								<p class="mt-0.5 truncate text-xs text-muted-fg">{{ selectedRequest.id }} · revision {{ selectedRequest.revision }} · {{ selectedRequest.resource }}</p>
							</div>
							<div class="hidden shrink-0 items-center gap-5 text-right text-xs sm:flex"><div><p class="font-semibold">{{ selectedRequest.impact }}</p><p class="text-muted-fg">Impact</p></div><div><p class="font-semibold">{{ selectedRequest.sla }}</p><p class="text-muted-fg">SLA</p></div></div>
						</div>
						<div class="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 xl:hidden"><p class="text-xs text-muted-fg">{{ nextAction.detail }}</p><DomButton size="sm" :loading="Boolean(busyAction)" @click="performNextAction">{{ nextAction.label }}</DomButton></div>
					</div>

					<DomAlert v-if="error" class="mx-4 mt-3 sm:mx-5" tone="danger" title="Approval request failed" :description="error" dismissible @dismiss="error = ''" />
					<DomAlert v-else-if="notice" class="mx-4 mt-3 sm:mx-5" tone="success" title="Workflow updated" :description="notice" dismissible @dismiss="notice = ''" />

					<DomTabs v-model="activeView" :tabs="tabs" class="flex min-h-0 flex-1 flex-col overflow-hidden">
						<template #review>
							<div class="min-h-0 flex-1 overflow-y-auto">
								<div class="mx-auto grid w-full max-w-5xl gap-5 p-4 sm:p-5">
									<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Requested change</p><h3 class="mt-2 text-xl font-semibold">{{ selectedRequest.change.label }}</h3><p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">{{ selectedRequest.change.reason }}</p></div>
									<div class="grid gap-3 border-y border-border py-4 sm:grid-cols-3"><div><p class="text-xs text-muted-fg">Current</p><p class="mt-1 text-sm font-semibold">{{ selectedRequest.change.from }}</p></div><div><p class="text-xs text-muted-fg">Requested</p><p class="mt-1 text-sm font-semibold text-primary">{{ selectedRequest.change.to }}</p></div><div><p class="text-xs text-muted-fg">Business impact</p><p class="mt-1 text-sm font-semibold">{{ selectedRequest.impact }}</p></div></div>
									<DomTextDiff :original="selectedRequest.change.original" :proposed="selectedRequest.change.proposed" original-label="Current configuration" proposed-label="Requested configuration" view="inline" format="text" />
									<section class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]">
										<div><div class="flex items-center justify-between gap-3"><h4 class="font-semibold">Evidence packet</h4><DomStatusPill :tone="selectedRequest.evidence.every((item) => item.status === 'verified') ? 'success' : 'danger'" :label="`${selectedRequest.evidence.filter((item) => item.status === 'verified').length}/${selectedRequest.evidence.length} verified`" size="sm" /></div><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="item in selectedRequest.evidence" :key="item.id" class="flex items-start justify-between gap-4 py-3"><div class="min-w-0"><p class="text-sm font-medium">{{ item.label }}</p><p class="mt-1 truncate text-xs text-muted-fg">{{ item.value }} · {{ item.checksum || 'No checksum' }}</p></div><DomStatusPill :tone="statusTone(item.status)" :label="statusLabel(item.status)" size="sm" /></div></div></div>
										<DomJsonViewer :value="evidencePacket" title="Immutable evidence manifest" :filename="`${selectedRequest.id}-evidence.json`" :preview-lines="9" density="compact" />
									</section>
								</div>
							</div>
						</template>

						<template #policy>
							<div class="min-h-0 flex-1 overflow-y-auto">
								<div class="mx-auto grid w-full max-w-4xl gap-5 p-4 sm:p-5">
									<div class="flex flex-wrap items-start justify-between gap-3"><div><h3 class="text-xl font-semibold">{{ selectedRequest.policyLabel }}</h3><p class="mt-1 text-sm leading-6 text-muted-fg">The server evaluates immutable evidence, separation of duties, reviewer authority, route, and execution window.</p></div><DomButton variant="secondary" :disabled="selectedRequest.assignedTo !== workspace.actor.name" :loading="busyAction === 'evaluate'" @click="evaluatePolicy">{{ selectedRequest.policyEvaluation ? 'Refresh evaluation' : 'Run policy evaluation' }}</DomButton></div>
									<DomAlert v-if="selectedRequest.evidence.some((item) => item.status === 'missing')" tone="danger" title="Required evidence is missing" description="The external processor agreement must be verified before the policy can pass."><DomButton size="sm" :loading="busyAction === 'evidence'" @click="verifyEvidence">Verify DPA evidence</DomButton></DomAlert>
									<DomEmptyState v-if="!selectedRequest.policyEvaluation" title="Policy has not run" description="Claim this request and evaluate the current revision before recording a decision." />
									<template v-else>
										<div class="flex items-center justify-between border-y border-border py-4"><div><p class="text-xs text-muted-fg">Evaluation receipt</p><p class="mt-1 font-mono text-sm">{{ selectedRequest.policyEvaluation.id }}</p></div><DomStatusPill :tone="selectedRequest.policyEvaluation.ready ? 'success' : 'danger'" :label="selectedRequest.policyEvaluation.ready ? 'Ready for decision' : 'Blocked'" /></div>
										<div class="divide-y divide-border border-y border-border"><div v-for="check in selectedRequest.policyEvaluation.checks" :key="check.id" class="flex items-start justify-between gap-4 py-3"><div><p class="text-sm font-medium">{{ check.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div><DomStatusPill :tone="statusTone(check.state)" :label="statusLabel(check.state)" size="sm" /></div></div>
									</template>
									<section><div class="flex items-center justify-between gap-3"><h4 class="font-semibold">Approval route</h4><p class="text-xs text-muted-fg">Required steps cannot self-approve</p></div><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="(approver, index) in selectedRequest.approvers" :key="approver.id" class="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-start gap-3 py-3"><div class="grid size-7 place-items-center rounded-full border border-border text-xs font-semibold">{{ index + 1 }}</div><div><p class="text-sm font-medium">{{ approver.label }}</p><p class="mt-1 text-xs text-muted-fg">{{ approver.owner }} · {{ approver.required ? 'Required' : 'Observer' }}</p></div><DomStatusPill :tone="statusTone(approver.status)" :label="statusLabel(approver.status)" size="sm" /></div></div></section>
								</div>
							</div>
						</template>

						<template #activity>
							<div class="min-h-0 flex-1 overflow-y-auto">
								<div class="mx-auto grid w-full max-w-4xl gap-5 p-4 sm:p-5">
									<section v-if="selectedRequest.execution" class="grid gap-4 border-y border-border py-5"><div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Controlled execution</p><h3 class="mt-1 text-xl font-semibold">{{ selectedRequest.execution.id }}</h3><p class="mt-2 text-sm text-muted-fg">{{ selectedRequest.execution.checksum }} · locked to policy and approval evidence</p></div><DomStatusPill :tone="statusTone(selectedRequest.execution.state)" :label="statusLabel(selectedRequest.execution.state)" :pulse="['queued', 'applying'].includes(selectedRequest.execution.state)" /></div><DomProgress :value="executionProgress" label="Controlled change rollout" :show-value="true" :tone="selectedRequest.execution.state === 'completed' ? 'success' : 'primary'" /><div v-if="selectedRequest.execution.surfaces.length" class="grid gap-3 sm:grid-cols-3"><div v-for="surface in selectedRequest.execution.surfaces" :key="surface.id" class="border-t border-border pt-3"><div class="flex items-start justify-between gap-2"><p class="text-sm font-semibold">{{ surface.label }}</p><DomStatusPill :tone="statusTone(surface.state)" :label="statusLabel(surface.state)" size="sm" /></div><p class="mt-2 text-xs leading-5 text-muted-fg">{{ surface.detail }}</p></div></div><p v-if="selectedRequest.execution.providerReceipt" class="font-mono text-xs text-success">{{ selectedRequest.execution.providerReceipt }}</p></section>
									<DomEmptyState v-else title="No execution receipt yet" description="A controlled execution snapshot appears after every required approver signs off." />
									<section><h3 class="font-semibold">Request activity</h3><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="event in selectedRequest.timeline" :key="event.id" class="py-3"><div class="flex items-start justify-between gap-3"><p class="text-sm font-medium">{{ event.action }}</p><span class="shrink-0 text-[11px] text-muted-fg">{{ event.createdAt }}</span></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p><p class="mt-1 text-[11px] text-muted-fg">{{ event.actor }}</p></div></div></section>
								</div>
							</div>
						</template>
					</DomTabs>
				</template>
				<div v-else class="grid min-h-0 flex-1 place-items-center p-5"><DomEmptyState title="No requests in this view" description="Choose another queue or request type to continue." /></div>
			</main>

			<aside v-if="selectedRequest" class="hidden min-h-0 overflow-y-auto border-l border-border bg-secondary/10 xl:block">
				<div class="border-b border-border p-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Next action</p><h3 class="mt-1 text-lg font-semibold">{{ nextAction.label }}</h3><p class="mt-2 text-sm leading-6 text-muted-fg">{{ nextAction.detail }}</p><DomButton class="mt-4" size="sm" :loading="Boolean(busyAction)" @click="performNextAction">{{ nextAction.label }}</DomButton><DomButton v-if="selectedRequest.assignedTo === workspace.actor.name && !['rejected', 'applied'].includes(selectedRequest.status)" class="mt-2" size="sm" variant="ghost" @click="openDelegationDialog">Delegate step</DomButton></div>
				<div class="border-b border-border p-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Request context</p><dl class="mt-3 divide-y divide-border border-y border-border text-sm"><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Requester</dt><dd class="font-medium">{{ selectedRequest.requester.name }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Submitted</dt><dd class="font-medium">{{ selectedRequest.submittedAt }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Due</dt><dd class="font-medium">{{ selectedRequest.due }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Assignee</dt><dd class="font-medium">{{ selectedRequest.assignedTo || 'Unassigned' }}</dd></div></dl></div>
				<div class="border-b border-border p-4"><div class="flex items-center justify-between gap-3"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Readiness</p><span class="text-sm font-semibold">{{ readinessPercent(selectedRequest) }}%</span></div><DomProgress class="mt-3" :value="readinessPercent(selectedRequest)" label="Approval readiness" :show-label="false" /><p class="mt-3 text-xs leading-5 text-muted-fg">{{ selectedRequest.policyEvaluation?.matchedRoute || selectedRequest.policyLabel }}</p></div>
				<div class="p-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Current reviewer</p><p class="mt-2 text-sm font-semibold">{{ workspace.actor.name }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ workspace.actor.role }} · self-approval disabled</p></div>
			</aside>
		</div>

		<DomAlert v-else class="m-4" tone="danger" title="Approval workspace unavailable" :description="error || 'The approval API did not return a workspace.'" />

		<DomDialog v-if="workspace" v-model="decisionDialogOpen" title="Record approval decision" description="The server binds this decision to the current request revision, policy run, and approver step." size="lg">
			<div v-if="selectedRequest" class="grid gap-4">
				<DomRadioGroup v-model="decisionForm.action" :options="workspace.catalog.decisionOptions" label="Decision"><template #option="{ option }"><span><span class="block text-sm font-semibold">{{ option.label }}</span><span class="mt-0.5 block text-xs leading-5 text-muted-fg">{{ option.description }}</span></span></template></DomRadioGroup>
				<DomSelect v-model="decisionForm.reason" :options="workspace.catalog.reasonOptions" label="Reason" width="min-w-0"><template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template></DomSelect>
				<DomTextareaInput v-model="decisionForm.note" label="Decision note" :rows="3" description="Explain the evidence, risk, and next step for the immutable audit trail." />
				<div class="grid gap-3 border-y border-border py-4 sm:grid-cols-2"><DomToggle v-model="decisionForm.notifyRequester" label="Notify requester" description="Deliver the decision and note." /><DomToggle v-model="decisionForm.createFollowUp" label="Create follow-up" description="Track post-approval verification." /></div>
				<DomCheckbox v-if="decisionForm.action === 'approve'" v-model="decisionForm.acknowledged" label="I reviewed the change, evidence, policy result, and customer impact" description="Approval locks this exact revision for controlled execution." />
			</div>
			<template #footer><DomButton variant="secondary" @click="decisionDialogOpen = false">Cancel</DomButton><DomButton :disabled="!canSubmitDecision()" :loading="busyAction === 'decision'" @click="submitDecision">Record decision</DomButton></template>
		</DomDialog>

		<DomDialog v-if="workspace" v-model="delegationDialogOpen" title="Delegate approval step" description="Delegation changes the assigned approver without weakening policy or separation-of-duties checks." size="md">
			<div class="grid gap-4"><DomSelect v-model="delegationForm.delegateId" :options="workspace.catalog.delegateOptions" label="Delegate" width="min-w-0"><template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template></DomSelect><DomDatePicker v-model="delegationForm.until" label="Delegation ends" /><DomTextareaInput v-model="delegationForm.note" label="Delegation note" :rows="3" /></div>
			<template #footer><DomButton variant="secondary" @click="delegationDialogOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'delegate'" @click="delegateRequest">Delegate step</DomButton></template>
		</DomDialog>

		<DomDialog v-if="workspace" v-model="executionDialogOpen" title="Start controlled change?" description="The approved configuration, policy receipt, and approver evidence are locked to this execution." size="md">
			<div v-if="selectedRequest" class="grid gap-4"><div class="grid grid-cols-2 gap-3 border-y border-border py-4 text-sm"><div><p class="text-xs text-muted-fg">Request</p><p class="mt-1 font-semibold">{{ selectedRequest.id }}</p></div><div><p class="text-xs text-muted-fg">Impact</p><p class="mt-1 font-semibold">{{ selectedRequest.impact }}</p></div><div><p class="text-xs text-muted-fg">Policy</p><p class="mt-1 font-semibold">{{ selectedRequest.policyId }}</p></div><div><p class="text-xs text-muted-fg">Snapshot</p><p class="mt-1 font-mono text-xs">{{ selectedRequest.execution?.checksum }}</p></div></div><DomCheckbox v-model="executionAcknowledged" label="I understand this applies the approved production change" description="The worker will update the gateway, monitoring, and immutable audit ledger." /></div>
			<template #footer><DomButton variant="secondary" @click="executionDialogOpen = false">Cancel</DomButton><DomButton :disabled="!executionAcknowledged" :loading="busyAction === 'execute'" @click="executeRequest">Queue controlled change</DomButton></template>
		</DomDialog>
	</section>
</template>
