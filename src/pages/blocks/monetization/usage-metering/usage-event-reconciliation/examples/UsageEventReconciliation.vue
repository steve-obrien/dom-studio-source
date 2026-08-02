<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
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
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/usage-event-reconciliation';
const tabs = [
	{ key: 'evidence', label: 'Evidence' },
	{ key: 'resolution', label: 'Resolution' },
	{ key: 'release', label: 'Release' },
];

const workspace = ref(null);
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const selectedPeriodId = ref('2026-06');
const selectedCaseId = ref('rec_2048');
const statusFilter = ref('attention');
const sourceFilter = ref('all');
const activeView = ref('evidence');
const releaseDialogOpen = ref(false);
const releaseAcknowledged = ref(false);
const resolutionForm = ref(createResolutionForm());

const selectedCase = computed(getSelectedCase);
const selectedPeriod = computed(getSelectedPeriod);
const filteredCases = computed(getFilteredCases);
const periodOptions = computed(buildPeriodOptions);
const caseOptions = computed(buildCaseOptions);
const sourceOptions = computed(buildSourceOptions);
const releaseReady = computed(getReleaseReady);
const releaseProgress = computed(getReleaseProgress);
const nextAction = computed(getNextAction);
const comparisonMaximum = computed(getComparisonMaximum);

onMounted(loadWorkspace);
watch([selectedPeriodId, statusFilter, sourceFilter], ensureSelectedCase);
watch(selectedCaseId, resetResolutionForm);

/**
 * Loads the server-owned reconciliation workspace.
 *
 * @returns {Promise<void>} Resolves after the workspace is ready.
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
 * Assigns the selected discrepancy to the current operator.
 *
 * @returns {Promise<void>} Resolves after assignment.
 */
async function claimCase() {
	if (!selectedCase.value) return;
	await mutateCase('claim', 'claim', revisionBody(), 'Case assigned to Maya Chen.');
}

/**
 * Builds immutable source-versus-rated comparison evidence.
 *
 * @returns {Promise<void>} Resolves after comparison.
 */
async function compareCase() {
	if (!selectedCase.value) return;
	const result = await mutateCase('compare', 'compare', revisionBody(), 'Source and rated usage compared.');
	if (result) activeView.value = 'evidence';
}

/**
 * Replays a schema-error event through a corrected deterministic payload.
 *
 * @returns {Promise<void>} Resolves after replay.
 */
async function replayEvent() {
	if (!selectedCase.value) return;
	await mutateCase('replay', 'replay', revisionBody(), 'Corrected usage event accepted by the ingestion gateway.');
}

/**
 * Persists an append-only adjustment proposal for the selected discrepancy.
 *
 * @returns {Promise<void>} Resolves after the proposal is created.
 */
async function proposeAdjustment() {
	if (!selectedCase.value) return;
	await mutateCase('adjustment', 'adjustments', {
		...revisionBody(),
		...resolutionForm.value,
	}, 'Append-only adjustment proposal created.');
}

/**
 * Creates a revised invoice preview for the saved adjustment.
 *
 * @returns {Promise<void>} Resolves after invoice preview generation.
 */
async function previewInvoice() {
	if (!selectedCase.value) return;
	await mutateCase('preview', 'preview', revisionBody(), 'Revised invoice preview generated.');
}

/**
 * Requests finance approval for a material correction.
 *
 * @returns {Promise<void>} Resolves after the approval request is created.
 */
async function requestApproval() {
	if (!selectedCase.value) return;
	await mutateCase('approval-request', 'approval/request', revisionBody(), 'Finance approval requested.');
}

/**
 * Records a finance approval decision.
 *
 * @param {'approved'|'rejected'} decision Approval decision.
 * @returns {Promise<void>} Resolves after the decision is recorded.
 */
async function decideApproval(decision) {
	const approval = selectedCase.value?.approval;
	if (!approval) return;
	await performMutation(`approval-${decision}`, `${apiBase}/approvals/${approval.id}/decision`, {
		method: 'POST',
		body: { revision: selectedCase.value.revision, decision },
	}, decision === 'approved' ? 'Finance approved the correction.' : 'Finance rejected the correction.');
}

/**
 * Runs authoritative source, adjustment, invoice, approval, and lifecycle checks.
 *
 * @returns {Promise<void>} Resolves after validation.
 */
async function runChecks() {
	if (!selectedCase.value) return;
	const result = await mutateCase('validate', 'validate', revisionBody(), 'Reconciliation release checks completed.');
	if (result) activeView.value = 'release';
}

/**
 * Opens the guarded release acknowledgement dialog.
 *
 * @returns {void}
 */
function openReleaseDialog() {
	releaseAcknowledged.value = false;
	releaseDialogOpen.value = true;
}

/**
 * Publishes the checked correction to the provider worker.
 *
 * @returns {Promise<void>} Resolves after the immutable release is queued.
 */
async function releaseCorrection() {
	if (!selectedCase.value) return;
	const result = await mutateCase('release', 'release', {
		...revisionBody(),
		acknowledged: releaseAcknowledged.value,
	}, 'Invoice correction queued for provider delivery.');
	if (result) {
		releaseDialogOpen.value = false;
		activeView.value = 'release';
	}
}

/**
 * Advances the deterministic provider delivery worker one step.
 *
 * @returns {Promise<void>} Resolves after rollout state changes.
 */
async function advanceRelease() {
	if (!selectedCase.value?.release) return;
	const starting = selectedCase.value.release.state === 'queued';
	await mutateCase('advance', 'advance', {}, starting ? 'Provider correction submitted.' : 'Usage and invoice correction completed.');
}

/**
 * Restores the deterministic reconciliation example.
 *
 * @returns {Promise<void>} Resolves after reset.
 */
async function resetWorkspace() {
	const result = await performMutation('reset', `${apiBase}/reset`, { method: 'POST', body: {} }, 'Reconciliation example restored.');
	if (!result) return;
	selectedPeriodId.value = '2026-06';
	selectedCaseId.value = 'rec_2048';
	statusFilter.value = 'attention';
	sourceFilter.value = 'all';
	activeView.value = 'evidence';
}

/**
 * Selects a queue case and returns focus to its evidence.
 *
 * @param {string} caseId Reconciliation case identifier.
 * @returns {void}
 */
function selectCase(caseId) {
	selectedCaseId.value = caseId;
	activeView.value = 'evidence';
}

/**
 * Posts one selected-case mutation through the shared workspace handler.
 *
 * @param {string} action Busy action identifier.
 * @param {string} endpoint Selected-case endpoint suffix.
 * @param {object} body Request body.
 * @param {string} successMessage Success notice.
 * @returns {Promise<object|null>} Updated workspace or null after failure.
 */
async function mutateCase(action, endpoint, body, successMessage) {
	return performMutation(action, `${apiBase}/cases/${selectedCase.value.id}/${endpoint}`, {
		method: 'POST',
		body,
	}, successMessage);
}

/**
 * Runs a JSON mutation with shared loading, error, and workspace handling.
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
 * Calls the reconciliation JSON API and promotes HTTP errors to exceptions.
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
	if (!response.ok) throw new Error(result.error || 'Reconciliation request failed.');
	return result;
}

/**
 * Replaces local state with the latest immutable API workspace.
 *
 * @param {object} result Reconciliation workspace.
 * @returns {void}
 */
function applyWorkspace(result) {
	workspace.value = result;
	ensureSelectedCase();
}

/**
 * Returns the exact selected-case revision body.
 *
 * @returns {{ revision: number }} Revision payload.
 */
function revisionBody() {
	return { revision: selectedCase.value.revision };
}

/**
 * Keeps the selected case inside the active period and filters.
 *
 * @returns {void}
 */
function ensureSelectedCase() {
	if (!workspace.value) return;
	if (filteredCases.value.some((candidate) => candidate.id === selectedCaseId.value)) return;
	selectedCaseId.value = filteredCases.value[0]?.id || '';
}

/**
 * Restores useful resolution defaults when the selected case changes.
 *
 * @returns {void}
 */
function resetResolutionForm() {
	resolutionForm.value = createResolutionForm(selectedCase.value);
	notice.value = '';
	error.value = '';
}

/**
 * Creates resolution form defaults for one discrepancy case.
 *
 * @param {object|null} [targetCase=null] Selected reconciliation case.
 * @returns {object} Resolution form.
 */
function createResolutionForm(targetCase = null) {
	return {
		action: targetCase?.delta < 0 ? 'add_usage' : 'cancel_usage',
		reason: targetCase?.status === 'schema-error' ? 'schema_mapping' : targetCase?.delta < 0 ? 'duplicate' : 'late_backfill',
		note: targetCase?.status === 'schema-error'
			? 'Replay the corrected event with the required customer dimension.'
			: 'Cancel units reported outside the contracted reconciliation boundary.',
	};
}

/**
 * Returns the selected reconciliation case.
 *
 * @returns {object|null} Selected case or null.
 */
function getSelectedCase() {
	return workspace.value?.cases.find((candidate) => candidate.id === selectedCaseId.value) || null;
}

/**
 * Returns the selected billing period.
 *
 * @returns {object|null} Selected period or null.
 */
function getSelectedPeriod() {
	return workspace.value?.periods.find((candidate) => candidate.id === selectedPeriodId.value) || null;
}

/**
 * Applies period, workflow-state, and source filters to the case queue.
 *
 * @returns {Array<object>} Filtered reconciliation cases.
 */
function getFilteredCases() {
	return (workspace.value?.cases || []).filter((candidate) => {
		if (candidate.periodId !== selectedPeriodId.value) return false;
		if (sourceFilter.value !== 'all' && candidate.source !== sourceFilter.value) return false;
		if (statusFilter.value === 'holds') return candidate.invoiceHold;
		if (statusFilter.value === 'attention') return candidate.status !== 'reconciled';
		return true;
	});
}

/**
 * Builds rich billing-period select options.
 *
 * @returns {Array<object>} Period options.
 */
function buildPeriodOptions() {
	return (workspace.value?.periods || []).map((period) => ({
		value: period.id,
		label: period.label,
		description: `${period.description} · ${formatMoney(period.amount)}`,
	}));
}

/**
 * Builds rich selected-case options for compact layouts.
 *
 * @returns {Array<object>} Case options.
 */
function buildCaseOptions() {
	return filteredCases.value.map((targetCase) => ({
		value: targetCase.id,
		label: targetCase.customer,
		description: `${targetCase.product} · ${formatSignedNumber(targetCase.delta)} ${targetCase.unit}`,
	}));
}

/**
 * Builds the source filter options.
 *
 * @returns {Array<object>} Source options.
 */
function buildSourceOptions() {
	return [
		{ value: 'all', label: 'All sources', description: 'Every ingestion pipeline.' },
		...(workspace.value?.catalog.sourceOptions || []).map((option) => ({ ...option, description: 'Usage ingestion source.' })),
	];
}

/**
 * Reports whether the selected case can publish its current validation.
 *
 * @returns {boolean} Whether release is ready.
 */
function getReleaseReady() {
	return Boolean(selectedCase.value?.validation?.ready && selectedCase.value.validation.revision === selectedCase.value.revision && !selectedCase.value.release);
}

/**
 * Maps provider rollout state to progress.
 *
 * @returns {number} Rollout percentage.
 */
function getReleaseProgress() {
	return { queued: 20, 'provider-updating': 68, completed: 100 }[selectedCase.value?.release?.state] || 0;
}

/**
 * Returns the highest-value next action for the selected case.
 *
 * @returns {{ label: string, detail: string, view: string }} Next action.
 */
function getNextAction() {
	const targetCase = selectedCase.value;
	if (!targetCase) return { label: 'Choose a case', detail: 'Select a discrepancy to investigate.', view: 'evidence' };
	if (!targetCase.assignee) return { label: 'Claim case', detail: 'Assign ownership before changing billing evidence.', view: 'evidence' };
	if (targetCase.status === 'schema-error' && !targetCase.replay) return { label: 'Replay corrected event', detail: 'Repair the missing dimension before comparison.', view: 'evidence' };
	if (!targetCase.comparison) return { label: 'Compare evidence', detail: 'Bind immutable source and rated totals.', view: 'evidence' };
	if (!targetCase.adjustment) return { label: 'Propose resolution', detail: 'Create an append-only correction.', view: 'resolution' };
	if (!targetCase.invoicePreview) return { label: 'Preview invoice', detail: 'Recalculate the customer-facing draft.', view: 'resolution' };
	if (requiresApproval(targetCase) && !targetCase.approval) return { label: 'Request approval', detail: 'Material corrections need finance review.', view: 'resolution' };
	if (targetCase.approval?.status === 'pending') return { label: 'Finance decision', detail: 'Approval is waiting in the controller queue.', view: 'resolution' };
	if (!targetCase.validation?.ready) return { label: 'Run release checks', detail: 'Verify source, adjustment, invoice, approval, and window.', view: 'release' };
	if (!targetCase.release) return { label: 'Release correction', detail: 'Publish immutable evidence to the provider worker.', view: 'release' };
	if (targetCase.release.state !== 'completed') return { label: 'Advance provider delivery', detail: 'Complete usage and invoice propagation.', view: 'release' };
	return { label: 'Reconciliation complete', detail: 'Usage, invoice, and audit evidence agree.', view: 'release' };
}

/**
 * Returns the largest comparison quantity for progress scaling.
 *
 * @returns {number} Maximum comparison quantity.
 */
function getComparisonMaximum() {
	return Math.max(selectedCase.value?.sourceTotal || 0, selectedCase.value?.ratedTotal || 0, 1);
}

/**
 * Reports whether a case correction exceeds finance guardrails.
 *
 * @param {object} targetCase Reconciliation case.
 * @returns {boolean} Whether approval is required.
 */
function requiresApproval(targetCase) {
	return Math.abs(Number(targetCase.adjustment?.amount || 0)) > 250 || targetCase.severity === 'danger';
}

/**
 * Maps workflow status to a semantic DOM Studio tone.
 *
 * @param {string} status Workflow status.
 * @returns {string} Semantic tone.
 */
function statusTone(status) {
	return {
		open: 'warning',
		investigating: 'info',
		'schema-error': 'danger',
		'credit-pending': 'info',
		'security-review': 'danger',
		'resolution-draft': 'warning',
		'approval-needed': 'warning',
		'waiting-approval': 'warning',
		'ready-for-checks': 'info',
		'ready-to-release': 'success',
		blocked: 'danger',
		publishing: 'warning',
		reconciled: 'success',
		pending: 'warning',
		approved: 'success',
		rejected: 'danger',
		queued: 'neutral',
		'provider-updating': 'warning',
		completed: 'success',
		passed: 'success',
		grace: 'warning',
		finalized: 'neutral',
	}[status] || 'neutral';
}

/**
 * Formats workflow status into readable title case.
 *
 * @param {string} status Workflow status.
 * @returns {string} Readable label.
 */
function statusLabel(status) {
	return String(status || '').split(/[-_]/).map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(' ');
}

/**
 * Formats a numeric count.
 *
 * @param {number} value Numeric value.
 * @returns {string} Localized number.
 */
function formatNumber(value) {
	return Number(value || 0).toLocaleString('en-GB');
}

/**
 * Formats a signed numeric delta.
 *
 * @param {number} value Numeric delta.
 * @returns {string} Signed localized number.
 */
function formatSignedNumber(value) {
	const numeric = Number(value || 0);
	return `${numeric > 0 ? '+' : ''}${numeric.toLocaleString('en-GB')}`;
}

/**
 * Formats a GBP monetary amount.
 *
 * @param {number} value Monetary amount.
 * @returns {string} Formatted currency.
 */
function formatMoney(value) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		maximumFractionDigits: 2,
	}).format(Number(value || 0));
}

/**
 * Converts a quantity into a comparison percentage.
 *
 * @param {number} value Quantity.
 * @returns {number} Percentage of the current comparison maximum.
 */
function comparisonPercent(value) {
	return Math.round((Number(value || 0) / comparisonMaximum.value) * 100);
}
</script>

<template>
	<section class="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-canvas text-canvas-fg">
		<header class="shrink-0 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur sm:px-5">
			<div class="flex min-w-0 items-center justify-between gap-3">
				<div class="min-w-0">
					<div class="flex min-w-0 items-center gap-2">
						<h1 class="truncate text-sm font-semibold sm:text-base">Usage reconciliation</h1>
						<DomBadge v-if="selectedPeriod" tone="warning" variant="soft" size="sm">{{ statusLabel(selectedPeriod.status) }}</DomBadge>
					</div>
					<p class="mt-0.5 hidden truncate text-xs text-muted-fg sm:block">Investigate source discrepancies before the invoice correction window closes.</p>
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<div v-if="workspace" class="hidden items-center divide-x divide-border text-center text-xs md:flex">
						<div class="px-3"><p class="font-semibold">{{ workspace.summary.openCases }}</p><p class="text-muted-fg">Open</p></div>
						<div class="px-3"><p class="font-semibold">{{ workspace.summary.invoiceHolds }}</p><p class="text-muted-fg">Holds</p></div>
						<div class="px-3"><p class="font-semibold">{{ formatMoney(workspace.summary.grossExposure) }}</p><p class="text-muted-fg">Exposure</p></div>
					</div>
					<DomButton size="sm" variant="secondary" :loading="busyAction === 'reset'" @click="resetWorkspace">Reset</DomButton>
				</div>
			</div>
			<div v-if="workspace" class="mt-3 grid min-w-0 grid-cols-2 gap-2 xl:hidden">
				<DomSelect v-model="selectedPeriodId" :options="periodOptions" label="Period" chrome="compact" width="min-w-0">
					<template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template>
				</DomSelect>
				<DomSelect v-model="statusFilter" :options="workspace.catalog.statusOptions" label="Queue" chrome="compact" width="min-w-0" />
				<div class="col-span-2"><DomSelect v-model="selectedCaseId" :options="caseOptions" label="Case" chrome="compact" width="min-w-0"><template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template></DomSelect></div>
			</div>
		</header>

		<div v-if="loading" class="grid min-h-0 flex-1 gap-4 p-4 xl:grid-cols-[18rem_minmax(0,1fr)_21rem]">
			<DomSkeleton height="100%" label="Loading discrepancy queue" />
			<DomSkeleton height="100%" label="Loading reconciliation evidence" />
			<DomSkeleton class="hidden xl:block" height="100%" label="Loading case guidance" />
		</div>
		<div v-else-if="!workspace" class="grid min-h-0 flex-1 place-items-center p-5">
			<DomEmptyState title="Reconciliation unavailable" :description="error || 'The reconciliation service did not return a workspace.'"><DomButton @click="loadWorkspace">Try again</DomButton></DomEmptyState>
		</div>

		<div v-else class="grid min-h-0 flex-1 xl:grid-cols-[18rem_minmax(0,1fr)_21rem]">
			<aside class="hidden min-h-0 overflow-y-auto border-r border-border bg-secondary/15 xl:block">
				<div class="grid gap-3 border-b border-border p-4">
					<DomSelect v-model="selectedPeriodId" :options="periodOptions" label="Billing period" width="min-w-[14rem]"><template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template></DomSelect>
					<DomSelect v-model="statusFilter" :options="workspace.catalog.statusOptions" label="Queue" width="min-w-[14rem]" />
					<DomSelect v-model="sourceFilter" :options="sourceOptions" label="Source" width="min-w-[14rem]" />
				</div>
				<div class="px-4 py-4">
					<div class="flex items-center justify-between gap-3"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Discrepancies</p><DomBadge tone="neutral" size="sm">{{ filteredCases.length }}</DomBadge></div>
					<nav aria-label="Reconciliation cases" class="mt-3 divide-y divide-border border-y border-border">
						<button v-for="targetCase in filteredCases" :key="targetCase.id" type="button" class="block w-full border-l-2 py-3 pl-3 pr-1 text-left transition hover:bg-secondary/50" :class="selectedCaseId === targetCase.id ? 'border-l-primary bg-secondary/60' : 'border-l-transparent'" @click="selectCase(targetCase.id)">
							<div class="flex items-start justify-between gap-2"><p class="truncate text-sm font-semibold">{{ targetCase.customer }}</p><DomStatusPill :tone="statusTone(targetCase.status)" :label="statusLabel(targetCase.status)" size="sm" /></div>
							<p class="mt-1 truncate text-xs text-muted-fg">{{ targetCase.product }} · {{ targetCase.source }}</p>
							<div class="mt-2 flex items-center justify-between gap-3 text-xs"><span :class="targetCase.delta > 0 ? 'text-warning-fg' : 'text-primary'">{{ formatSignedNumber(targetCase.delta) }} {{ targetCase.unit }}</span><span class="text-muted-fg">{{ targetCase.deadline }}</span></div>
						</button>
					</nav>
				</div>
			</aside>

			<main class="flex min-h-0 min-w-0 flex-col overflow-hidden">
				<section v-if="selectedCase" class="shrink-0 border-b border-border bg-secondary/20 px-4 py-3 sm:px-5">
					<div class="flex min-w-0 flex-wrap items-start justify-between gap-3">
						<div class="min-w-0"><div class="flex min-w-0 items-center gap-2"><h2 class="truncate text-lg font-semibold">{{ selectedCase.customer }}</h2><DomStatusPill :tone="statusTone(selectedCase.status)" :label="statusLabel(selectedCase.status)" size="sm" /></div><p class="mt-1 truncate text-xs text-muted-fg">{{ selectedCase.id }} · {{ selectedCase.product }} / {{ selectedCase.meter }} · revision {{ selectedCase.revision }}</p></div>
						<div class="grid grid-cols-3 divide-x divide-border text-center text-xs"><div class="px-3"><p class="font-semibold">{{ formatSignedNumber(selectedCase.delta) }}</p><p class="text-muted-fg">Units</p></div><div class="px-3"><p class="font-semibold">{{ formatMoney(selectedCase.invoiceDelta) }}</p><p class="text-muted-fg">Exposure</p></div><div class="px-3"><p class="font-semibold">{{ selectedCase.deadline }}</p><p class="text-muted-fg">SLA</p></div></div>
					</div>
				</section>
				<DomAlert v-if="error" class="m-3 shrink-0" tone="danger" title="Reconciliation action failed" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-if="notice && !error" class="m-3 shrink-0" tone="success" title="Reconciliation updated" :description="notice" dismissible @dismiss="notice = ''" />

				<DomTabs v-if="selectedCase" v-model="activeView" :tabs="tabs" variant="page" fill class="min-h-0">
					<template #evidence>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-5xl gap-5 p-4 sm:p-5">
								<div class="flex flex-wrap items-start justify-between gap-3"><div><h3 class="text-xl font-semibold">Source versus rated usage</h3><p class="mt-1 text-sm leading-6 text-muted-fg">Trace one immutable event through ingestion, aggregation, contract rating, and the draft invoice.</p></div><div class="flex gap-2"><DomButton v-if="!selectedCase.assignee" :loading="busyAction === 'claim'" @click="claimCase">Claim case</DomButton><DomButton v-else-if="selectedCase.status === 'schema-error' && !selectedCase.replay" :loading="busyAction === 'replay'" @click="replayEvent">Replay corrected event</DomButton><DomButton v-else variant="secondary" :disabled="Boolean(selectedCase.release)" :loading="busyAction === 'compare'" @click="compareCase">{{ selectedCase.comparison ? 'Refresh comparison' : 'Compare evidence' }}</DomButton></div></div>
								<section class="grid gap-5 border-y border-border py-5 md:grid-cols-2">
									<div><div class="flex items-center justify-between gap-3"><p class="text-sm font-semibold">Source ledger</p><p class="text-sm font-semibold">{{ formatNumber(selectedCase.sourceTotal) }}</p></div><DomProgress class="mt-3" :value="comparisonPercent(selectedCase.sourceTotal)" label="Source ledger quantity" :show-label="false" size="lg" tone="primary" /><p class="mt-2 text-xs leading-5 text-muted-fg">{{ selectedCase.source }} · {{ selectedCase.rawEvent.transactionId }} · {{ selectedCase.rawEvent.checksum }}</p></div>
									<div><div class="flex items-center justify-between gap-3"><p class="text-sm font-semibold">Rated invoice usage</p><p class="text-sm font-semibold">{{ formatNumber(selectedCase.ratedTotal) }}</p></div><DomProgress class="mt-3" :value="comparisonPercent(selectedCase.ratedTotal)" label="Rated invoice quantity" :show-label="false" size="lg" :tone="selectedCase.delta ? 'warning' : 'success'" /><p class="mt-2 text-xs leading-5 text-muted-fg">{{ selectedCase.rating.contractId }} · {{ selectedCase.rating.metricId }} · {{ selectedCase.rating.aggregation }}</p></div>
								</section>
								<DomAlert :tone="selectedCase.severity === 'danger' ? 'danger' : 'warning'" :title="`${formatSignedNumber(selectedCase.delta)} ${selectedCase.unit} discrepancy`" :description="selectedCase.reason" />
								<section v-if="selectedCase.comparison"><div class="flex items-center justify-between gap-3"><h4 class="font-semibold">Comparison receipt</h4><DomStatusPill tone="success" label="Bound to source" size="sm" /></div><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="segment in selectedCase.comparison.segments" :key="segment.id" class="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-4 py-3 text-sm"><div><p class="font-medium">{{ segment.label }}</p><p class="mt-0.5 text-xs text-muted-fg">{{ segment.state === 'matched' ? 'Agrees across source and rating' : 'Needs a resolution decision' }}</p></div><p>{{ formatNumber(segment.source) }} source</p><p>{{ formatNumber(segment.rated) }} rated</p></div></div></section>
								<section class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]"><div><h4 class="font-semibold">Event contract</h4><DomJsonViewer class="mt-3" :value="selectedCase.rawEvent" title="Immutable source event" :filename="`${selectedCase.rawEvent.transactionId}.json`" :preview-lines="11" density="compact" /></div><div><h4 class="font-semibold">Case timeline</h4><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="item in selectedCase.timeline.slice(0, 6)" :key="item.id" class="py-3"><div class="flex items-start justify-between gap-3"><p class="text-sm font-medium">{{ item.action }}</p><span class="shrink-0 text-[11px] text-muted-fg">{{ item.createdAt }}</span></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.detail }}</p><p class="mt-1 text-[11px] text-muted-fg">{{ item.actor }}</p></div></div></div></section>
							</div>
						</div>
					</template>

					<template #resolution>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-4xl gap-5 p-4 sm:p-5">
								<div><h3 class="text-xl font-semibold">Propose an append-only correction</h3><p class="mt-1 text-sm leading-6 text-muted-fg">Preserve the original meter event, record the decision, and preview the customer-facing invoice before release.</p></div>
								<DomEmptyState v-if="!selectedCase.comparison" title="Comparison evidence needed" description="Bind the immutable source event to the current rated quantity before choosing a correction."><DomButton :disabled="!selectedCase.assignee" :loading="busyAction === 'compare'" @click="compareCase">Compare evidence</DomButton></DomEmptyState>
								<template v-else>
									<section v-if="!selectedCase.adjustment" class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]"><DomRadioGroup v-model="resolutionForm.action" :options="workspace.catalog.actionOptions" label="Resolution action"><template #option="{ option }"><span class="min-w-0"><span class="block text-sm font-semibold">{{ option.label }}</span><span class="mt-0.5 block text-xs leading-5 text-muted-fg">{{ option.description }}</span></span></template></DomRadioGroup><div class="grid content-start gap-4"><DomSelect v-model="resolutionForm.reason" :options="workspace.catalog.reasonOptions" label="Reason" width="min-w-[15rem]"><template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template></DomSelect><div class="border-y border-border py-3 text-sm"><div class="flex justify-between gap-3"><span class="text-muted-fg">Units</span><span class="font-semibold">{{ formatSignedNumber(selectedCase.delta > 0 ? -selectedCase.delta : Math.abs(selectedCase.delta)) }}</span></div><div class="mt-2 flex justify-between gap-3"><span class="text-muted-fg">Exposure</span><span class="font-semibold">{{ formatMoney(-Math.abs(selectedCase.invoiceDelta)) }}</span></div></div></div><div class="lg:col-span-2"><DomTextareaInput v-model="resolutionForm.note" label="Reviewer note" :rows="3" description="Explain why this correction is safe for the customer and invoice ledger." /></div><div class="lg:col-span-2 flex justify-end"><DomButton :loading="busyAction === 'adjustment'" @click="proposeAdjustment">Create adjustment proposal</DomButton></div></section>
									<section v-else class="border-y border-border py-5"><div class="flex flex-wrap items-start justify-between gap-4"><div><div class="flex items-center gap-2"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Adjustment receipt</p><DomStatusPill tone="success" label="Append only" size="sm" /></div><h4 class="mt-1 text-lg font-semibold">{{ selectedCase.adjustment.id }}</h4><p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">{{ selectedCase.adjustment.note }}</p></div><DomButton v-if="!selectedCase.invoicePreview" :loading="busyAction === 'preview'" @click="previewInvoice">Preview revised invoice</DomButton></div><dl class="mt-4 grid gap-3 sm:grid-cols-3"><div class="border-t border-border pt-3"><dt class="text-xs text-muted-fg">Action</dt><dd class="mt-1 text-sm font-semibold">{{ statusLabel(selectedCase.adjustment.action) }}</dd></div><div class="border-t border-border pt-3"><dt class="text-xs text-muted-fg">Quantity</dt><dd class="mt-1 text-sm font-semibold">{{ formatSignedNumber(selectedCase.adjustment.quantity) }}</dd></div><div class="border-t border-border pt-3"><dt class="text-xs text-muted-fg">Invoice change</dt><dd class="mt-1 text-sm font-semibold">{{ formatMoney(selectedCase.adjustment.amount) }}</dd></div></dl></section>
									<section v-if="selectedCase.invoicePreview"><div class="flex items-center justify-between gap-3"><h4 class="font-semibold">Invoice preview</h4><DomStatusPill tone="success" label="Tax recalculated" size="sm" /></div><div class="mt-3 grid gap-4 border-y border-border py-5 sm:grid-cols-[1fr_auto_1fr]"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Current draft</p><p class="mt-2 text-2xl font-semibold">{{ formatMoney(selectedCase.invoicePreview.originalInvoiceTotal) }}</p><p class="mt-1 text-xs text-muted-fg">{{ selectedCase.invoicePreview.invoiceId }}</p></div><div class="hidden place-items-center px-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg sm:grid">Becomes</div><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">After correction</p><p class="mt-2 text-2xl font-semibold text-success">{{ formatMoney(selectedCase.invoicePreview.revisedInvoiceTotal) }}</p><p class="mt-1 text-xs text-muted-fg">{{ formatMoney(selectedCase.invoicePreview.adjustmentAmount) }} adjustment</p></div></div></section>
									<section v-if="selectedCase.invoicePreview && requiresApproval(selectedCase)" class="border-y border-border py-5"><div class="flex flex-wrap items-start justify-between gap-4"><div><div class="flex items-center gap-2"><h4 class="font-semibold">Finance approval</h4><DomStatusPill :tone="statusTone(selectedCase.approval?.status || 'pending')" :label="selectedCase.approval?.status ? statusLabel(selectedCase.approval.status) : 'Needed'" size="sm" /></div><p class="mt-2 text-sm leading-6 text-muted-fg">{{ selectedCase.approval?.reason || 'Material invoice corrections require a finance controller decision.' }}</p></div><DomButton v-if="!selectedCase.approval" :loading="busyAction === 'approval-request'" @click="requestApproval">Request approval</DomButton><div v-else-if="selectedCase.approval.status === 'pending'" class="flex gap-2"><DomButton variant="secondary" :loading="busyAction === 'approval-rejected'" @click="decideApproval('rejected')">Reject</DomButton><DomButton :loading="busyAction === 'approval-approved'" @click="decideApproval('approved')">Approve as finance</DomButton></div><p v-else class="text-sm font-medium">{{ selectedCase.approval.decidedBy }} · {{ selectedCase.approval.decidedAt }}</p></div></section>
									<div v-if="selectedCase.invoicePreview" class="flex flex-wrap items-center justify-between gap-3"><p class="text-sm text-muted-fg">Every receipt remains attached to case revision {{ selectedCase.revision }}.</p><DomButton :disabled="requiresApproval(selectedCase) && selectedCase.approval?.status !== 'approved'" @click="activeView = 'release'">Review release</DomButton></div>
								</template>
							</div>
						</div>
					</template>

					<template #release>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-4xl gap-5 p-4 sm:p-5">
								<div class="flex flex-wrap items-start justify-between gap-3"><div><h3 class="text-xl font-semibold">Release invoice correction</h3><p class="mt-1 text-sm leading-6 text-muted-fg">Verify immutable evidence before the draft invoice leaves its correction window.</p></div><DomStatusPill :tone="statusTone(selectedCase.release?.state || selectedCase.status)" :label="statusLabel(selectedCase.release?.state || selectedCase.status)" /></div>
								<section v-if="!selectedCase.release" class="grid gap-5"><div class="flex flex-wrap items-center justify-between gap-3 border-y border-border py-4"><div><h4 class="font-semibold">Authoritative checks</h4><p class="mt-1 text-sm text-muted-fg">Source, adjustment, invoice, approval, and correction window must agree.</p></div><DomButton variant="secondary" :disabled="!selectedCase.invoicePreview" :loading="busyAction === 'validate'" @click="runChecks">Run release checks</DomButton></div><div v-if="selectedCase.validation" class="divide-y divide-border border-y border-border"><div v-for="check in selectedCase.validation.checks" :key="check.id" class="flex items-center justify-between gap-4 py-3"><div><p class="text-sm font-medium">{{ check.label }}</p><p class="mt-0.5 text-xs text-muted-fg">{{ check.detail }}</p></div><DomStatusPill :tone="statusTone(check.state)" :label="statusLabel(check.state)" size="sm" /></div></div><DomEmptyState v-else title="No release evidence yet" description="Complete the comparison, append-only correction, invoice preview, and required approval before running checks." /><div class="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p class="text-sm text-muted-fg">{{ selectedPeriod.description }} · {{ selectedPeriod.closesAt }}</p><DomButton :disabled="!releaseReady" @click="openReleaseDialog">Release correction</DomButton></div></section>
								<section v-else class="grid gap-5"><div class="border-y border-border py-5"><div class="flex items-start justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Immutable release receipt</p><h4 class="mt-1 text-xl font-semibold">{{ selectedCase.release.label }}</h4><p class="mt-2 text-sm text-muted-fg">{{ selectedCase.release.checksum }} · {{ selectedCase.release.providerRequestId || 'Provider request queued' }}</p></div><DomStatusPill :tone="statusTone(selectedCase.release.state)" :label="statusLabel(selectedCase.release.state)" :pulse="selectedCase.release.state !== 'completed'" /></div><DomProgress class="mt-5" :value="releaseProgress" label="Provider correction rollout" :show-value="true" :tone="selectedCase.release.state === 'completed' ? 'success' : 'primary'" /></div><div class="grid gap-3 sm:grid-cols-3"><div v-for="surface in [{ label: 'Usage ledger', detail: 'Append-only meter adjustment' }, { label: 'Invoice draft', detail: 'Line item and tax recalculation' }, { label: 'Audit trail', detail: 'Decision and provider evidence' }]" :key="surface.label" class="border-t border-border pt-3"><p class="text-sm font-semibold">{{ surface.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ surface.detail }}</p><DomStatusPill class="mt-3" :tone="selectedCase.release.state === 'completed' ? 'success' : selectedCase.release.state === 'provider-updating' ? 'warning' : 'neutral'" :label="selectedCase.release.state === 'completed' ? 'Reconciled' : selectedCase.release.state === 'provider-updating' ? 'Updating' : 'Queued'" size="sm" /></div></div><DomButton v-if="selectedCase.release.state !== 'completed'" :loading="busyAction === 'advance'" @click="advanceRelease">{{ selectedCase.release.state === 'queued' ? 'Submit provider correction' : 'Complete reconciliation' }}</DomButton><DomAlert v-else tone="success" title="Invoice reconciliation complete" description="The usage ledger, draft invoice, and immutable audit evidence now agree. The invoice hold has been cleared." /></section>
								<section><p class="text-sm font-semibold">Case activity</p><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="item in selectedCase.timeline.slice(0, 8)" :key="item.id" class="py-3"><div class="flex items-start justify-between gap-3"><p class="text-sm font-medium">{{ item.action }}</p><span class="shrink-0 text-[11px] text-muted-fg">{{ item.createdAt }}</span></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.detail }}</p><p class="mt-1 text-[11px] text-muted-fg">{{ item.actor }}</p></div></div></section>
							</div>
						</div>
					</template>
				</DomTabs>
				<div v-else class="grid min-h-0 flex-1 place-items-center p-5"><DomEmptyState title="No discrepancies in this view" description="Choose another period, queue state, or source to continue reconciliation." /></div>
			</main>

			<aside v-if="selectedCase" class="hidden min-h-0 overflow-y-auto border-l border-border bg-secondary/15 xl:block">
				<div class="border-b border-border px-4 py-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Next action</p><h3 class="mt-1 text-lg font-semibold">{{ nextAction.label }}</h3><p class="mt-2 text-sm leading-6 text-muted-fg">{{ nextAction.detail }}</p><DomButton class="mt-4" variant="secondary" size="sm" @click="activeView = nextAction.view">Open {{ statusLabel(nextAction.view) }}</DomButton></div>
				<div class="border-b border-border px-4 py-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Invoice window</p><dl class="mt-3 divide-y divide-border border-y border-border text-sm"><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Invoice</dt><dd class="font-mono text-xs">{{ selectedPeriod.invoiceId }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Provider</dt><dd class="font-medium">{{ selectedPeriod.provider }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Closes</dt><dd class="font-medium">{{ selectedPeriod.closesAt }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Hold</dt><dd class="font-medium">{{ selectedCase.invoiceHold ? 'Active' : 'Clear' }}</dd></div></dl></div>
				<div class="border-b border-border px-4 py-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Evidence chain</p><dl class="mt-3 divide-y divide-border border-y border-border text-sm"><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Source</dt><dd class="max-w-36 truncate font-medium">{{ selectedCase.comparison?.id || 'Needed' }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Adjustment</dt><dd class="max-w-36 truncate font-medium">{{ selectedCase.adjustment?.id || 'Needed' }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Invoice</dt><dd class="max-w-36 truncate font-medium">{{ selectedCase.invoicePreview?.id || 'Needed' }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Approval</dt><dd class="font-medium">{{ requiresApproval(selectedCase) ? statusLabel(selectedCase.approval?.status || 'needed') : 'Automatic' }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Checks</dt><dd class="font-medium">{{ selectedCase.validation?.ready ? 'Passed' : 'Needed' }}</dd></div></dl></div>
				<div class="px-4 py-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Customer context</p><p class="mt-2 text-sm font-semibold">{{ selectedCase.customer }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ selectedCase.plan }} · {{ selectedCase.owner }} · {{ selectedCase.source }}</p><div class="mt-4 flex items-center justify-between border-y border-border py-3"><span class="text-sm text-muted-fg">Invoice exposure</span><span class="text-sm font-semibold">{{ formatMoney(selectedCase.invoiceDelta) }}</span></div></div>
			</aside>
		</div>

		<DomDialog v-model="releaseDialogOpen" title="Release this invoice correction?" description="The server will bind the source checksum, append-only adjustment, finance decision, and invoice preview to an immutable provider receipt." size="md">
			<div v-if="selectedCase" class="grid gap-4"><div class="grid grid-cols-2 gap-3 border-y border-border py-4 text-sm"><div><p class="text-xs text-muted-fg">Customer</p><p class="mt-1 font-semibold">{{ selectedCase.customer }}</p></div><div><p class="text-xs text-muted-fg">Adjustment</p><p class="mt-1 font-semibold">{{ formatMoney(selectedCase.adjustment?.amount) }}</p></div><div><p class="text-xs text-muted-fg">Invoice after</p><p class="mt-1 font-semibold">{{ formatMoney(selectedCase.invoicePreview?.revisedInvoiceTotal) }}</p></div><div><p class="text-xs text-muted-fg">Provider</p><p class="mt-1 font-semibold">{{ selectedPeriod.provider }}</p></div></div><DomCheckbox v-model="releaseAcknowledged" label="I reviewed the customer and invoice impact" description="Released reconciliation evidence is immutable and clears the invoice hold only after provider completion." /></div>
			<template #footer><DomButton variant="secondary" :disabled="busyAction === 'release'" @click="releaseDialogOpen = false">Cancel</DomButton><DomButton :disabled="!releaseAcknowledged" :loading="busyAction === 'release'" @click="releaseCorrection">Release correction</DomButton></template>
		</DomDialog>
	</section>
</template>
