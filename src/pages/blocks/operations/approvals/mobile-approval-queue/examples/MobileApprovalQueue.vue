<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomActionSheet,
	DomAlert,
	DomAppBottomNav,
	DomAppListItem,
	DomAppShell,
	DomAppTopBar,
	DomAvatar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomConfirmationCodeInput,
	DomDialog,
	DomEmptyState,
	DomJsonViewer,
	DomProgress,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/mobile-approval-queue';

const detailTabs = [
	{ key: 'review', label: 'Review' },
	{ key: 'policy', label: 'Policy' },
	{ key: 'activity', label: 'Activity' },
];

const workspace = ref(null);
const selectedRequestId = ref('');
const queueFilter = ref('needs-me');
const typeFilter = ref('all');
const activeView = ref('review');
const mobileDestination = ref('tasks');
const mobileDetailOpen = ref(false);
const busyAction = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const actionSheetOpen = ref(false);
const decisionDialogOpen = ref(false);
const stepUpDialogOpen = ref(false);
const decisionAction = ref('approve');
const decisionReason = ref('policy-satisfied');
const decisionNote = ref('Reviewed the evidence, policy exception, and requester context.');
const decisionAcknowledged = ref(false);
const challenge = ref(null);
const confirmationCode = ref('');
const stepUpToken = ref('');

const selectedRequest = computed(getSelectedRequest);
const filteredRequests = computed(getFilteredRequests);
const currentPolicy = computed(getCurrentPolicy);
const policyProgress = computed(getPolicyProgress);
const nextAction = computed(getNextAction);
const auditPayload = computed(getAuditPayload);
const mobileNavItems = computed(getMobileNavItems);
const decisionDialogTitle = computed(getDecisionDialogTitle);
const decisionAcknowledgementLabel = computed(getDecisionAcknowledgementLabel);

onMounted(loadWorkspace);

/**
 * Loads the current mobile approval workspace from the example API.
 *
 * @param {boolean} clearMessages Whether to clear existing feedback first.
 * @returns {Promise<void>} Resolves after the workspace request finishes.
 */
async function loadWorkspace(clearMessages = true) {
	if (clearMessages) clearFeedback();
	busyAction.value = 'load';
	try {
		const response = await fetch(`${apiBase}/bootstrap`);
		const data = await response.json();
		if (!response.ok) throw new Error(data.error || 'The approval inbox could not be loaded.');
		setWorkspace(data);
	} catch (error) {
		errorMessage.value = error.message || 'The approval inbox could not be loaded.';
	} finally {
		busyAction.value = '';
	}
}

/**
 * Sends one revisioned workflow mutation and applies its returned workspace.
 *
 * @param {string} path API path after the base route.
 * @param {Record<string, unknown>} body JSON mutation payload.
 * @param {string} action Busy-state identifier.
 * @returns {Promise<object|null>} Parsed API payload or null after an error.
 */
async function mutateWorkspace(path, body, action) {
	clearFeedback();
	busyAction.value = action;
	try {
		const response = await fetch(`${apiBase}${path}`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body),
		});
		const data = await response.json();
		if (!response.ok) {
			errorMessage.value = data.error || 'The workflow action could not be completed.';
			if (response.status === 409) await refreshAfterConflict();
			return null;
		}
		setWorkspace(data);
		return data;
	} catch (error) {
		errorMessage.value = error.message || 'The workflow action could not be completed.';
		return null;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Refreshes authoritative state after a stale-revision response.
 *
 * @returns {Promise<void>} Resolves after the latest workspace is applied.
 */
async function refreshAfterConflict() {
	try {
		const response = await fetch(`${apiBase}/bootstrap`);
		const data = await response.json();
		if (response.ok) setWorkspace(data);
	} catch {
		// The original conflict message remains the useful recovery guidance.
	}
}

/**
 * Applies workspace data while preserving a valid request selection.
 *
 * @param {object} data Workspace returned by the API.
 * @returns {void}
 */
function setWorkspace(data) {
	workspace.value = data;
	const selectionStillExists = data.requests.some((request) => request.id === selectedRequestId.value);
	if (!selectionStillExists) selectedRequestId.value = data.requests[0]?.id || '';
}

/**
 * Selects one approval task and opens its focused mobile detail view.
 *
 * @param {object} request Approval request.
 * @returns {void}
 */
function selectRequest(request) {
	selectedRequestId.value = request.id;
	activeView.value = request.decision ? 'activity' : 'review';
	mobileDestination.value = 'tasks';
	mobileDetailOpen.value = true;
	challenge.value = null;
	confirmationCode.value = '';
	stepUpToken.value = '';
	clearFeedback();
}

/**
 * Returns from a focused task to the mobile queue.
 *
 * @returns {void}
 */
function goBackToQueue() {
	mobileDetailOpen.value = false;
	activeView.value = 'review';
	clearFeedback();
}

/**
 * Responds to primary mobile navigation changes.
 *
 * @param {{ value: string }} item Selected navigation item.
 * @returns {void}
 */
function changeMobileDestination(item) {
	mobileDestination.value = item.value;
	if (item.value === 'tasks') mobileDetailOpen.value = false;
	clearFeedback();
}

/**
 * Runs the selected request through the server-owned policy evaluator.
 *
 * @returns {Promise<void>} Resolves after evaluation finishes.
 */
async function evaluatePolicy() {
	if (!selectedRequest.value) return;
	const data = await mutateWorkspace(`/requests/${selectedRequest.value.id}/evaluate`, { revision: selectedRequest.value.revision }, 'evaluate');
	if (!data) return;
	activeView.value = 'policy';
	successMessage.value = selectedRequest.value.policyEvaluation?.ready ? 'Policy review passed. The decision options are ready.' : 'Policy review found a blocking requirement.';
}

/**
 * Opens the mobile decision action sheet.
 *
 * @returns {void}
 */
function openDecisionActions() {
	actionSheetOpen.value = true;
	clearFeedback();
}

/**
 * Routes an action-sheet choice into step-up or the decision dialog.
 *
 * @param {{ value: string }} action Selected decision action.
 * @returns {Promise<void>} Resolves after any required challenge is created.
 */
async function chooseDecisionAction(action) {
	decisionAction.value = action.value;
	decisionReason.value = defaultReasonForAction(action.value);
	decisionNote.value = defaultNoteForAction(action.value);
	decisionAcknowledged.value = false;
	if (action.value === 'approve' && selectedRequest.value?.policy.requiresStepUp && !stepUpToken.value) {
		await startStepUpChallenge();
		return;
	}
	decisionDialogOpen.value = true;
}

/**
 * Creates a trusted-device step-up challenge for the current request.
 *
 * @returns {Promise<void>} Resolves after the challenge is shown.
 */
async function startStepUpChallenge() {
	if (!selectedRequest.value) return;
	const data = await mutateWorkspace(`/requests/${selectedRequest.value.id}/challenge`, { revision: selectedRequest.value.revision }, 'challenge');
	if (!data) return;
	challenge.value = data.challenge;
	confirmationCode.value = '';
	stepUpDialogOpen.value = true;
}

/**
 * Verifies the six-digit device challenge and opens approval confirmation.
 *
 * @returns {Promise<void>} Resolves after verification finishes.
 */
async function verifyStepUpChallenge() {
	if (!selectedRequest.value || !challenge.value) return;
	const data = await mutateWorkspace(`/requests/${selectedRequest.value.id}/verify`, {
		challengeId: challenge.value.id,
		code: confirmationCode.value,
	}, 'verify');
	if (!data) return;
	challenge.value = data.challenge;
	stepUpToken.value = data.stepUpToken;
	stepUpDialogOpen.value = false;
	decisionDialogOpen.value = true;
	successMessage.value = `${data.challenge.device} verified for this one decision.`;
}

/**
 * Submits the structured decision for the selected task.
 *
 * @returns {Promise<void>} Resolves after the decision is recorded.
 */
async function submitDecision() {
	if (!selectedRequest.value) return;
	const data = await mutateWorkspace(`/requests/${selectedRequest.value.id}/decision`, {
		revision: selectedRequest.value.revision,
		action: decisionAction.value,
		reason: decisionReason.value,
		note: decisionNote.value,
		acknowledged: decisionAcknowledged.value,
		stepUpToken: stepUpToken.value,
	}, 'decision');
	if (!data) return;
	decisionDialogOpen.value = false;
	actionSheetOpen.value = false;
	stepUpToken.value = '';
	challenge.value = null;
	activeView.value = 'activity';
	successMessage.value = `${decisionActionLabel(decisionAction.value)} recorded with an immutable receipt.`;
}

/**
 * Reverses the selected decision during its deterministic undo window.
 *
 * @returns {Promise<void>} Resolves after the decision is reversed.
 */
async function undoDecision() {
	if (!selectedRequest.value?.undo?.available) return;
	const data = await mutateWorkspace(`/requests/${selectedRequest.value.id}/undo`, {
		revision: selectedRequest.value.revision,
		decisionId: selectedRequest.value.undo.decisionId,
	}, 'undo');
	if (!data) return;
	activeView.value = 'review';
	successMessage.value = 'The decision was reversed before settlement. Re-evaluate before deciding again.';
}

/**
 * Simulates the requester supplying a missing receipt or attachment.
 *
 * @returns {Promise<void>} Resolves after evidence is added.
 */
async function receiveEvidence() {
	if (!selectedRequest.value) return;
	const data = await mutateWorkspace(`/requests/${selectedRequest.value.id}/evidence`, {
		revision: selectedRequest.value.revision,
		note: 'Requester supplied the missing itemized receipt from the mobile reminder.',
	}, 'evidence');
	if (!data) return;
	activeView.value = 'review';
	successMessage.value = 'Missing evidence received. Run the policy review again.';
}

/**
 * Runs the safest next action for the selected request state.
 *
 * @returns {Promise<void>|void} Pending mutation when the action uses the API.
 */
function performNextAction() {
	if (nextAction.value.key === 'evaluate') return evaluatePolicy();
	if (nextAction.value.key === 'decision') return openDecisionActions();
	if (nextAction.value.key === 'evidence') return receiveEvidence();
	if (nextAction.value.key === 'undo') return undoDecision();
	activeView.value = nextAction.value.view;
}

/**
 * Restores the deterministic mobile approval data and starting selection.
 *
 * @returns {Promise<void>} Resolves after reset finishes.
 */
async function resetDemo() {
	const data = await mutateWorkspace('/reset', {}, 'reset');
	if (!data) return;
	selectedRequestId.value = data.requests[0]?.id || '';
	queueFilter.value = 'needs-me';
	typeFilter.value = 'all';
	activeView.value = 'review';
	mobileDestination.value = 'tasks';
	mobileDetailOpen.value = false;
	challenge.value = null;
	confirmationCode.value = '';
	stepUpToken.value = '';
	successMessage.value = 'Mobile approval tasks restored.';
}

/**
 * Clears transient success and error feedback.
 *
 * @returns {void}
 */
function clearFeedback() {
	errorMessage.value = '';
	successMessage.value = '';
}

/**
 * Returns the selected request or the first available task.
 *
 * @returns {object|null} Selected approval request.
 */
function getSelectedRequest() {
	if (!workspace.value) return null;
	return workspace.value.requests.find((request) => request.id === selectedRequestId.value) || workspace.value.requests[0] || null;
}

/**
 * Filters the task inbox by queue and request type.
 *
 * @returns {Array<object>} Visible approval requests.
 */
function getFilteredRequests() {
	if (!workspace.value) return [];
	return workspace.value.requests.filter((request) => {
		if (typeFilter.value !== 'all' && request.type !== typeFilter.value) return false;
		if (queueFilter.value === 'done') return isFinalRequest(request);
		if (isFinalRequest(request)) return false;
		if (queueFilter.value === 'needs-me') return request.assignedTo === workspace.value.actor.name;
		if (queueFilter.value === 'due-soon') return ['42m', '2h', 'Today'].includes(request.due);
		if (queueFilter.value === 'blocked') return ['blocked', 'waiting-on-requester', 'escalated'].includes(request.status);
		return true;
	});
}

/**
 * Returns the selected request's policy receipt only when its revision matches.
 *
 * @returns {object|null} Current policy evaluation.
 */
function getCurrentPolicy() {
	const request = selectedRequest.value;
	if (!request?.policyEvaluation || request.policyEvaluation.revision !== request.revision) return null;
	return request.policyEvaluation;
}

/**
 * Converts current policy checks into a readiness percentage.
 *
 * @returns {number} Policy readiness percentage.
 */
function getPolicyProgress() {
	if (!currentPolicy.value) return 20;
	const checks = currentPolicy.value.checks || [];
	if (!checks.length) return currentPolicy.value.ready ? 100 : 20;
	return Math.round((checks.filter((check) => check.state !== 'blocked').length / checks.length) * 100);
}

/**
 * Resolves the safest next action for the selected task.
 *
 * @returns {{ key: string, label: string, detail: string, view: string }} Next action definition.
 */
function getNextAction() {
	const request = selectedRequest.value;
	if (!request) return { key: 'view', label: 'Choose a task', detail: 'Open an approval from the inbox.', view: 'review' };
	if (request.undo?.available) return { key: 'undo', label: 'Undo decision', detail: request.undo.expiresLabel, view: 'activity' };
	if (request.status === 'waiting-on-requester') return { key: 'evidence', label: 'Receive demo evidence', detail: 'Simulate the requester answering the mobile reminder.', view: 'review' };
	if (request.status === 'escalated') return { key: 'view', label: 'Specialist notified', detail: `Assigned to ${request.assignedTo}.`, view: 'activity' };
	if (isFinalRequest(request)) return { key: 'view', label: statusLabel(request.status), detail: 'Review the immutable mobile decision receipt.', view: 'activity' };
	if (!currentPolicy.value) return { key: 'evaluate', label: 'Run policy review', detail: `Evaluate ${request.policy.label}.`, view: 'policy' };
	return { key: 'decision', label: currentPolicy.value.ready ? 'Review decision' : 'Review options', detail: currentPolicy.value.ready ? 'Choose an auditable mobile response.' : 'Request evidence or escalate the blocking condition.', view: 'policy' };
}

/**
 * Builds the focused audit payload shown in the activity view.
 *
 * @returns {object} Current request, policy, and decision evidence.
 */
function getAuditPayload() {
	const request = selectedRequest.value;
	if (!request) return {};
	return {
		requestId: request.id,
		revision: request.revision,
		policyRunId: request.policyEvaluation?.id || null,
		decision: request.decision,
		evidence: request.evidence.map((item) => ({ id: item.id, status: item.status, checksum: item.checksum })),
		device: workspace.value?.actor.device,
	};
}

/**
 * Builds mobile navigation with the current open-task badge.
 *
 * @returns {Array<object>} Bottom-navigation items.
 */
function getMobileNavItems() {
	return [
		{ value: 'tasks', label: 'Tasks', badge: workspace.value?.summary.pending ? String(workspace.value.summary.pending) : '' },
		{ value: 'activity', label: 'Activity' },
		{ value: 'profile', label: 'You' },
	];
}

/**
 * Returns the active decision dialog title.
 *
 * @returns {string} Human-readable dialog title.
 */
function getDecisionDialogTitle() {
	return {
		approve: 'Approve this request?',
		'request-info': 'Request more information',
		escalate: 'Escalate to a specialist',
		decline: 'Decline this request?',
	}[decisionAction.value] || 'Review decision';
}

/**
 * Returns the acknowledgement copy required for the active decision.
 *
 * @returns {string} Acknowledgement label.
 */
function getDecisionAcknowledgementLabel() {
	if (decisionAction.value === 'approve') return 'I reviewed the evidence, policy result, and payment impact';
	if (decisionAction.value === 'decline') return 'I understand the requester will be notified immediately';
	return 'I reviewed the request context and routing impact';
}

/**
 * Returns a default structured reason for one action.
 *
 * @param {string} action Decision action.
 * @returns {string} Reason value.
 */
function defaultReasonForAction(action) {
	return {
		approve: 'policy-satisfied',
		'request-info': 'missing-evidence',
		escalate: 'outside-authority',
		decline: 'policy-denied',
	}[action] || 'business-context';
}

/**
 * Returns a realistic default note for one action.
 *
 * @param {string} action Decision action.
 * @returns {string} Decision note.
 */
function defaultNoteForAction(action) {
	return {
		approve: 'Reviewed the evidence, policy exception, and requester context.',
		'request-info': 'Please attach the missing itemized receipt before finance review.',
		escalate: 'Security must own the regulated export access decision.',
		decline: 'The request exceeds a non-overridable policy requirement.',
	}[action] || '';
}

/**
 * Maps workflow status to display copy.
 *
 * @param {string} status Workflow status.
 * @returns {string} Display label.
 */
function statusLabel(status) {
	return {
		'pending-review': 'Needs review',
		'ready-to-decide': 'Ready',
		blocked: 'Blocked',
		'waiting-on-requester': 'Waiting on requester',
		escalated: 'Escalated',
		approved: 'Approved',
		declined: 'Declined',
	}[status] || String(status || 'Unknown').replaceAll('-', ' ');
}

/**
 * Maps workflow status to a semantic DOM Studio tone.
 *
 * @param {string} status Workflow status.
 * @returns {string} Status-pill tone.
 */
function statusTone(status) {
	return {
		'pending-review': 'warning',
		'ready-to-decide': 'success',
		blocked: 'danger',
		'waiting-on-requester': 'info',
		escalated: 'warning',
		approved: 'success',
		declined: 'danger',
	}[status] || 'neutral';
}

/**
 * Maps request risk to a semantic DOM Studio tone.
 *
 * @param {string} risk Request risk.
 * @returns {string} Risk tone.
 */
function riskTone(risk) {
	return { low: 'success', medium: 'warning', high: 'danger', critical: 'danger' }[risk] || 'neutral';
}

/**
 * Maps policy check state to a semantic DOM Studio tone.
 *
 * @param {string} state Policy-check state.
 * @returns {string} Status tone.
 */
function checkTone(state) {
	return { passed: 'success', advisory: 'warning', blocked: 'danger' }[state] || 'neutral';
}

/**
 * Reports whether a request has a terminal approve or decline state.
 *
 * @param {object} request Approval request.
 * @returns {boolean} Whether the request is complete.
 */
function isFinalRequest(request) {
	return ['approved', 'declined'].includes(request.status);
}

/**
 * Converts one decision action to display copy.
 *
 * @param {string} action Decision action.
 * @returns {string} Display label.
 */
function decisionActionLabel(action) {
	return {
		approve: 'Approval',
		'request-info': 'Information request',
		escalate: 'Escalation',
		decline: 'Decline decision',
	}[action] || 'Decision';
}
</script>

<template>
	<div class="relative flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-canvas text-canvas-fg">
		<div v-if="!workspace" class="grid min-h-0 flex-1 md:grid-cols-[22rem_minmax(0,1fr)]">
			<div class="space-y-4 border-r border-border p-4"><DomSkeleton class="h-14" /><DomSkeleton class="h-20" /><DomSkeleton v-for="index in 5" :key="index" class="h-16" /></div>
			<div class="space-y-5 p-6"><DomSkeleton class="h-16" /><DomSkeleton class="h-28" /><DomSkeleton class="h-48" /></div>
		</div>

		<div v-else class="grid min-h-0 flex-1 md:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)_20rem]">
			<aside
				class="min-h-0 flex-col border-r border-border bg-canvas"
				:class="mobileDestination === 'tasks' && !mobileDetailOpen ? 'flex' : 'hidden md:flex'"
			>
				<DomAppTopBar title="Approvals" :subtitle="`${workspace.summary.pending} tasks need you`" large>
					<template #trailing><DomButton size="sm" variant="ghost" :loading="busyAction === 'reset'" @click="resetDemo">Reset</DomButton></template>
				</DomAppTopBar>
				<div class="grid grid-cols-3 divide-x divide-border border-b border-border text-center">
					<div class="px-2 py-3"><p class="text-lg font-semibold">{{ workspace.summary.pending }}</p><p class="text-[11px] text-muted-fg">Pending</p></div>
					<div class="px-2 py-3"><p class="text-lg font-semibold">{{ workspace.summary.dueSoon }}</p><p class="text-[11px] text-muted-fg">Due soon</p></div>
					<div class="px-2 py-3"><p class="text-lg font-semibold">{{ workspace.summary.blocked }}</p><p class="text-[11px] text-muted-fg">Blocked</p></div>
				</div>
				<div class="grid grid-cols-2 gap-2 border-b border-border p-3">
					<DomSelect v-model="queueFilter" label="Queue" :options="workspace.catalog.queueOptions" width="min-w-[16rem]" />
					<DomSelect v-model="typeFilter" label="Type" :options="workspace.catalog.typeOptions" width="min-w-[16rem]" />
				</div>
				<nav v-if="filteredRequests.length" class="min-h-0 flex-1 overflow-y-auto" aria-label="Approval tasks">
					<DomAppListItem
						v-for="request in filteredRequests"
						:key="request.id"
						:label="request.title"
						:description="`${request.ask.primary} · ${request.ask.secondary}`"
						:meta="request.due"
						:selected="request.id === selectedRequest.id"
						chevron
						@click="selectRequest(request)"
					>
						<template #icon><DomAvatar :name="request.requester.name" :initials="request.requester.initials" size="sm" /></template>
						<template #trailing><DomStatusPill :tone="riskTone(request.risk)" :label="request.risk" size="sm" /></template>
					</DomAppListItem>
				</nav>
				<div v-else class="p-4"><DomEmptyState title="No matching tasks" description="Change the queue or task-type filter to continue." /></div>
			</aside>

			<main
				class="min-h-0 flex-col bg-canvas"
				:class="mobileDestination === 'tasks' && mobileDetailOpen ? 'flex' : 'hidden md:flex'"
			>
				<DomAppShell>
					<template #top>
						<DomAppTopBar :title="selectedRequest.title" :subtitle="selectedRequest.ask.object">
							<template #leading><DomButton class="md:hidden" size="sm" variant="ghost" @click="goBackToQueue">Back</DomButton></template>
							<template #trailing><DomStatusPill :tone="statusTone(selectedRequest.status)" :label="statusLabel(selectedRequest.status)" size="sm" /></template>
						</DomAppTopBar>
					</template>

					<div class="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
						<div class="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2"><DomBadge tone="neutral" variant="outline">{{ selectedRequest.typeLabel }}</DomBadge><DomStatusPill :tone="riskTone(selectedRequest.risk)" :label="`${selectedRequest.risk} risk`" size="sm" /></div>
								<p class="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{{ selectedRequest.ask.primary }}</p>
								<p class="mt-1 text-sm text-muted-fg">{{ selectedRequest.ask.secondary }}</p>
							</div>
							<div class="flex items-center gap-3 text-right"><div><p class="text-sm font-medium">{{ selectedRequest.requester.name }}</p><p class="text-xs text-muted-fg">{{ selectedRequest.requester.team }}</p></div><DomAvatar :name="selectedRequest.requester.name" :initials="selectedRequest.requester.initials" /></div>
						</div>

						<DomAlert v-if="errorMessage" class="mt-4" tone="danger" title="Action needs attention" :description="errorMessage" dismissible @dismiss="errorMessage = ''" />
						<DomAlert v-if="successMessage" class="mt-4" tone="success" title="Workflow updated" :description="successMessage" dismissible @dismiss="successMessage = ''" />

						<DomTabs v-model="activeView" class="mt-5" :tabs="detailTabs" variant="page">
							<template #review>
								<div class="space-y-7 py-5">
									<section><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Request</p><h2 class="mt-2 text-xl font-semibold">{{ selectedRequest.ask.object }}</h2><p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">{{ selectedRequest.ask.description }}</p></section>
									<section class="grid grid-cols-3 divide-x divide-border border-y border-border py-4 text-sm"><div class="pr-3"><p class="text-xs text-muted-fg">Due</p><p class="mt-1 font-medium">{{ selectedRequest.dueLabel }}</p></div><div class="px-3"><p class="text-xs text-muted-fg">Submitted</p><p class="mt-1 font-medium">{{ selectedRequest.submittedAt }}</p></div><div class="pl-3"><p class="text-xs text-muted-fg">Revision</p><p class="mt-1 font-mono font-medium">{{ selectedRequest.revision }}</p></div></section>
									<section><div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Evidence</p><h3 class="mt-1 font-semibold">Review before deciding</h3></div><DomStatusPill :tone="selectedRequest.evidence.every((item) => item.status === 'verified') ? 'success' : 'danger'" :label="`${selectedRequest.evidence.filter((item) => item.status === 'verified').length}/${selectedRequest.evidence.length} verified`" size="sm" /></div><div class="mt-3 border-y border-border"><DomAppListItem v-for="item in selectedRequest.evidence" :key="item.id" as="div" :label="item.label" :description="item.checksum || 'No checksum available'" :meta="item.value"><template #trailing><DomStatusPill :tone="item.status === 'verified' ? 'success' : 'danger'" :label="item.status" size="sm" /></template></DomAppListItem></div></section>
									<DomAlert tone="info" title="Business impact" :description="selectedRequest.ask.impact" />
								</div>
							</template>

							<template #policy>
								<div class="py-5">
									<DomEmptyState v-if="!currentPolicy" title="Policy review not run" :description="`Evaluate ${selectedRequest.policy.label} against evidence, reviewer authority, route, and this trusted device.`"><template #actions><DomButton :loading="busyAction === 'evaluate'" @click="evaluatePolicy">Run policy review</DomButton></template></DomEmptyState>
									<div v-else class="space-y-6"><div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Policy receipt</p><h3 class="mt-1 text-xl font-semibold">{{ selectedRequest.policy.label }}</h3><p class="mt-1 font-mono text-xs text-muted-fg">{{ currentPolicy.id }}</p></div><DomStatusPill :tone="currentPolicy.ready ? 'success' : 'danger'" :label="currentPolicy.ready ? 'Ready to decide' : 'Blocked'" /></div><DomProgress :value="policyProgress" label="Mobile decision readiness" show-value :tone="currentPolicy.ready ? 'success' : 'danger'" /><div class="divide-y divide-border border-y border-border"><div v-for="check in currentPolicy.checks" :key="check.id" class="flex items-start justify-between gap-4 py-4"><div><p class="text-sm font-medium">{{ check.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div><DomStatusPill :tone="checkTone(check.state)" :label="check.state" size="sm" /></div></div><section><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Approval route</p><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="step in selectedRequest.approvers" :key="step.id" class="flex items-center justify-between gap-4 py-3"><div><p class="text-sm font-medium">{{ step.label }}</p><p class="text-xs text-muted-fg">{{ step.owner }}</p></div><DomStatusPill :tone="step.status === 'approved' ? 'success' : step.status === 'blocked' ? 'danger' : 'warning'" :label="step.status" size="sm" /></div></div></section></div>
								</div>
							</template>

							<template #activity>
								<div class="space-y-7 py-5">
									<DomAlert v-if="selectedRequest.decision" :tone="statusTone(selectedRequest.status)" :title="`${decisionActionLabel(selectedRequest.decision.action)} recorded`" :description="`${selectedRequest.decision.receipt} · ${selectedRequest.decision.device}`"><template v-if="selectedRequest.undo?.available" #actions><DomButton size="sm" variant="secondary" :loading="busyAction === 'undo'" @click="undoDecision">Undo decision</DomButton></template></DomAlert>
									<DomAlert v-if="selectedRequest.requestInfo" tone="info" :title="selectedRequest.requestInfo.state === 'resolved' ? 'Information received' : 'Requester notified'" :description="`${selectedRequest.requestInfo.id} · ${selectedRequest.requestInfo.channel}`" />
									<section><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Immutable activity</p><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="event in selectedRequest.timeline" :key="event.id" class="py-3"><div class="flex items-start justify-between gap-3"><p class="text-sm font-medium">{{ event.action }}</p><span class="shrink-0 text-[11px] text-muted-fg">{{ event.createdAt }}</span></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p><p class="mt-1 text-[11px] text-muted-fg">{{ event.actor }}</p></div></div></section>
									<DomJsonViewer :value="auditPayload" title="Mobile decision evidence" :filename="`${selectedRequest.id}-audit.json`" :preview-lines="12" density="compact" />
								</div>
							</template>
						</DomTabs>
					</div>

					<template #bottom>
						<div class="border-t border-border bg-canvas px-4 py-3 sm:px-6"><div class="mx-auto flex max-w-4xl items-center justify-between gap-3"><div class="min-w-0"><p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Next action</p><p class="truncate text-sm font-medium">{{ nextAction.detail }}</p></div><DomButton class="shrink-0" :loading="Boolean(busyAction)" @click="performNextAction">{{ nextAction.label }}</DomButton></div></div>
					</template>
				</DomAppShell>
			</main>

			<aside class="hidden min-h-0 overflow-y-auto border-l border-border xl:block">
				<div class="border-b border-border p-5"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Request context</p><dl class="mt-3 divide-y divide-border text-sm"><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Assigned</dt><dd class="text-right font-medium">{{ selectedRequest.assignedTo }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Source</dt><dd class="text-right font-medium">{{ selectedRequest.source }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Policy</dt><dd class="text-right font-medium">{{ selectedRequest.policy.label }}</dd></div></dl></div>
				<div class="border-b border-border p-5"><div class="flex items-center gap-3"><DomAvatar :name="workspace.actor.name" :initials="workspace.actor.initials" /><div><p class="text-sm font-semibold">{{ workspace.actor.name }}</p><p class="text-xs text-muted-fg">{{ workspace.actor.role }}</p></div></div><DomAlert class="mt-4" tone="success" title="Trusted decision device" :description="`${workspace.actor.device.label} · ${workspace.actor.device.platform}`" /></div>
				<div class="p-5"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Mobile safety</p><ul class="mt-3 space-y-3 text-sm leading-6 text-muted-fg"><li>Exact request revisions prevent stale decisions.</li><li>High-risk approval tokens are single-use and request-bound.</li><li>Receipts preserve policy, evidence, actor, and device context.</li></ul></div>
			</aside>

			<section v-if="mobileDestination === 'activity'" class="min-h-0 flex-1 flex-col md:hidden">
				<DomAppTopBar title="Activity" subtitle="Recent mobile workflow events" large />
				<div class="min-h-0 flex-1 overflow-y-auto"><DomAppListItem v-for="event in workspace.activity" :key="event.id" as="div" :label="event.action" :description="event.detail" :meta="event.createdAt"><template #trailing><DomStatusPill tone="neutral" :label="event.actor" size="sm" /></template></DomAppListItem></div>
			</section>

			<section v-if="mobileDestination === 'profile'" class="min-h-0 flex-1 flex-col md:hidden">
				<DomAppTopBar title="You" subtitle="Mobile approval identity" large />
				<div class="space-y-5 p-5"><div class="flex items-center gap-4"><DomAvatar :name="workspace.actor.name" :initials="workspace.actor.initials" size="xl" /><div><h2 class="text-xl font-semibold">{{ workspace.actor.name }}</h2><p class="text-sm text-muted-fg">{{ workspace.actor.role }}</p></div></div><DomAlert tone="success" title="Trusted device" :description="`${workspace.actor.device.label} · ${workspace.actor.device.platform}`" /><div class="divide-y divide-border border-y border-border text-sm"><div class="flex justify-between gap-3 py-3"><span class="text-muted-fg">Approval limit</span><span class="font-medium">£{{ workspace.actor.approvalLimit.toLocaleString() }}</span></div><div class="flex justify-between gap-3 py-3"><span class="text-muted-fg">Step-up</span><span class="font-medium">Required for exceptions</span></div></div></div>
			</section>
		</div>

		<DomAppBottomNav v-if="workspace" v-model="mobileDestination" class="md:hidden" :items="mobileNavItems" @change="changeMobileDestination" />

		<DomActionSheet
			v-if="workspace"
			v-model="actionSheetOpen"
			title="Choose a response"
			:description="`${selectedRequest.title} · revision ${selectedRequest.revision}`"
			:actions="workspace.catalog.decisionActions"
			@select="chooseDecisionAction"
		/>

		<DomDialog v-if="workspace" v-model="stepUpDialogOpen" title="Verify this trusted device" :description="`A single-use code is required before approving ${selectedRequest.title}.`" size="md">
			<div class="space-y-4"><DomAlert tone="info" title="Demo verification code" :description="challenge ? `${challenge.demoCode} · expires in ${challenge.expiresAt}` : 'Creating challenge…'" /><DomConfirmationCodeInput v-model="confirmationCode" label="Six-digit code" character-set="numeric" :length="6" :separator-after="3" :invalid="Boolean(errorMessage)" :error="errorMessage" /><p class="text-xs leading-5 text-muted-fg">Production apps should replace this deterministic challenge with a passkey, platform biometric, or provider-owned step-up session.</p></div>
			<template #footer><DomButton data-close variant="secondary">Cancel</DomButton><DomButton :disabled="confirmationCode.length !== 6" :loading="busyAction === 'verify'" @click="verifyStepUpChallenge">Verify device</DomButton></template>
		</DomDialog>

		<DomDialog v-if="workspace" v-model="decisionDialogOpen" :title="decisionDialogTitle" :description="`${selectedRequest.title} · ${selectedRequest.ask.primary}`" size="lg">
			<div class="space-y-4"><DomSelect v-model="decisionReason" label="Reason" :options="workspace.catalog.reasonOptions" width="min-w-[18rem]" /><DomTextareaInput v-model="decisionNote" label="Decision note" description="Stored with the request, policy, actor, device, and receipt." :rows="4" /><DomCheckbox v-model="decisionAcknowledged" :label="decisionAcknowledgementLabel" /><DomAlert :tone="decisionAction === 'decline' ? 'warning' : 'info'" :title="decisionActionLabel(decisionAction)" :description="decisionAction === 'approve' ? 'The API consumes the single-use step-up token and opens a short undo window.' : 'The requester or specialist route will be updated immediately.'" /></div>
			<template #footer><DomButton data-close variant="secondary">Cancel</DomButton><DomButton :variant="decisionAction === 'decline' ? 'secondary' : 'primary'" :disabled="!decisionAcknowledged" :loading="busyAction === 'decision'" @click="submitDecision">{{ decisionActionLabel(decisionAction) }}</DomButton></template>
		</DomDialog>
	</div>
</template>
