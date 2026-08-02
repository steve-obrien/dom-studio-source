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
	DomNumberInput,
	DomProgress,
	DomRadioGroup,
	DomRangeInput,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/usage-limits';
const tabs = [
	{ key: 'policy', label: 'Policy' },
	{ key: 'usage', label: 'Usage' },
	{ key: 'exceptions', label: 'Exceptions' },
	{ key: 'release', label: 'Release' },
];

const workspace = ref(null);
const activeView = ref('policy');
const selectedPlanId = ref('growth');
const selectedMeterId = ref('workflow_runs');
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const exceptionDialogOpen = ref(false);
const publishDialogOpen = ref(false);
const publishAcknowledged = ref(false);
const exceptionForm = ref(createExceptionForm());

const locked = computed(getLocked);
const selectedPlan = computed(getSelectedPlan);
const selectedPolicy = computed(getSelectedPolicy);
const selectedPlanPolicies = computed(getSelectedPlanPolicies);
const planOptions = computed(buildPlanOptions);
const meterOptions = computed(buildMeterOptions);
const exceptionMeterOptions = computed(buildExceptionMeterOptions);
const approvalRequired = computed(getApprovalRequired);
const releaseReady = computed(getReleaseReady);
const rolloutProgress = computed(getRolloutProgress);
const usagePercent = computed(getUsagePercent);
const forecastPercent = computed(getForecastPercent);
const visibleExceptions = computed(getVisibleExceptions);

onMounted(loadWorkspace);
watch(selectedPlanId, handlePlanChange);

/**
 * Loads server-owned usage policies, evidence, and customer exceptions.
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
 * Saves the selected policy to an exact server revision.
 *
 * @returns {Promise<void>} Resolves after persistence.
 */
async function savePolicy() {
	if (!workspace.value || !selectedPolicy.value || locked.value) return;
	const policy = selectedPolicy.value;
	await performMutation('save', `${apiBase}/policies/${policy.planId}/${policy.meterId}`, {
		method: 'PATCH',
		body: {
			revision: workspace.value.policy.revision,
			hardLimit: policy.hardLimit,
			softThreshold: policy.softThreshold,
			overagePolicy: policy.overagePolicy,
			graceHours: policy.graceHours,
			alertChannels: policy.alertChannels,
			webhookUrl: policy.webhookUrl,
			requireApproval: policy.requireApproval,
		},
	}, `${policy.name} policy saved. Release evidence was cleared for revision ${workspace.value.policy.revision + 1}.`);
}

/**
 * Calculates forecast and customer impact for the selected policy.
 *
 * @returns {Promise<void>} Resolves after impact evidence is returned.
 */
async function calculateImpact() {
	if (!selectedPolicy.value || locked.value) return;
	await performMutation('impact', `${apiBase}/impact`, {
		method: 'POST',
		body: currentPolicyIdentity(),
	}, 'Forecast and customer impact calculated for this policy revision.');
}

/**
 * Sends a threshold test through every selected notification channel.
 *
 * @returns {Promise<void>} Resolves after delivery evidence is returned.
 */
async function testNotifications() {
	if (!selectedPolicy.value || locked.value) return;
	await performMutation('notifications', `${apiBase}/notifications`, {
		method: 'POST',
		body: currentPolicyIdentity(),
	}, 'Threshold test delivered through every configured channel.');
}

/**
 * Requests finance approval for a guarded policy change.
 *
 * @returns {Promise<void>} Resolves after the request is created.
 */
async function requestApproval() {
	if (!selectedPolicy.value || locked.value) return;
	await performMutation('approval-request', `${apiBase}/approvals/request`, {
		method: 'POST',
		body: currentPolicyIdentity(),
	}, 'Finance approval requested for this exact policy revision.');
}

/**
 * Records an approval decision as the example finance reviewer.
 *
 * @param {'approved'|'rejected'} decision Approval decision.
 * @returns {Promise<void>} Resolves after the decision is recorded.
 */
async function decideApproval(decision) {
	if (!workspace.value?.approval || locked.value) return;
	await performMutation(`approval-${decision}`, `${apiBase}/approvals/${workspace.value.approval.id}/decision`, {
		method: 'POST',
		body: { decision },
	}, decision === 'approved' ? 'Finance approved this policy revision.' : 'Finance rejected this policy revision.');
}

/**
 * Runs authoritative meter, impact, notification, and approval checks.
 *
 * @returns {Promise<void>} Resolves after validation evidence is returned.
 */
async function runChecks() {
	if (!selectedPolicy.value || locked.value) return;
	await performMutation('validate', `${apiBase}/validate`, {
		method: 'POST',
		body: currentPolicyIdentity(),
	}, 'Usage policy checks completed for this exact revision.');
}

/**
 * Opens the exception request form with useful selected-policy defaults.
 *
 * @returns {void}
 */
function openExceptionDialog() {
	exceptionForm.value = createExceptionForm();
	exceptionForm.value.meterId = selectedMeterId.value;
	const customer = workspace.value?.catalog.customerOptions.find((option) => option.value === exceptionForm.value.customerId);
	const customerPlanId = customer?.description?.startsWith('Scale') ? 'scale' : 'growth';
	const policy = workspace.value?.policies.find((candidate) => candidate.planId === customerPlanId && candidate.meterId === exceptionForm.value.meterId);
	if (policy) exceptionForm.value.hardLimit = Math.min(policy.maximum, policy.hardLimit + policy.step * 5);
	exceptionDialogOpen.value = true;
}

/**
 * Creates a revisioned temporary customer exception request.
 *
 * @returns {Promise<void>} Resolves after the request is persisted.
 */
async function createException() {
	if (!workspace.value) return;
	const result = await performMutation('exception-create', `${apiBase}/exceptions`, {
		method: 'POST',
		body: {
			revision: workspace.value.exceptionsRevision,
			...exceptionForm.value,
		},
	}, 'Customer exception request added to the approval queue.');
	if (result) {
		exceptionDialogOpen.value = false;
		activeView.value = 'exceptions';
	}
}

/**
 * Approves or rejects one pending customer exception.
 *
 * @param {string} exceptionId Exception identifier.
 * @param {'approved'|'rejected'} decision Exception decision.
 * @returns {Promise<void>} Resolves after the decision is recorded.
 */
async function decideException(exceptionId, decision) {
	if (!workspace.value) return;
	await performMutation(`exception-${decision}`, `${apiBase}/exceptions/${exceptionId}/decision`, {
		method: 'POST',
		body: {
			revision: workspace.value.exceptionsRevision,
			decision,
		},
	}, decision === 'approved' ? 'Customer exception approved.' : 'Customer exception rejected.');
}

/**
 * Opens the guarded publication acknowledgement dialog.
 *
 * @returns {void}
 */
function openPublishDialog() {
	publishAcknowledged.value = false;
	publishDialogOpen.value = true;
}

/**
 * Publishes the checked policy into the enforcement rollout worker.
 *
 * @returns {Promise<void>} Resolves after the release receipt is created.
 */
async function publishPolicy() {
	if (!selectedPolicy.value || locked.value) return;
	const result = await performMutation('publish', `${apiBase}/publish`, {
		method: 'POST',
		body: {
			...currentPolicyIdentity(),
			acknowledged: publishAcknowledged.value,
		},
	}, 'Usage policy queued for enforcement rollout.');
	if (result) {
		publishDialogOpen.value = false;
		activeView.value = 'release';
	}
}

/**
 * Advances the deterministic enforcement worker by one rollout state.
 *
 * @returns {Promise<void>} Resolves after rollout evidence is updated.
 */
async function advanceRollout() {
	if (!workspace.value?.release) return;
	const queued = workspace.value.release.state === 'queued';
	await performMutation('advance', `${apiBase}/advance`, {
		method: 'POST',
		body: {},
	}, queued ? 'Usage enforcement propagation started.' : 'Usage policy is live across every enforcement surface.');
}

/**
 * Restores the clean deterministic usage policy example.
 *
 * @returns {Promise<void>} Resolves after reset.
 */
async function resetWorkspace() {
	const result = await performMutation('reset', `${apiBase}/reset`, {
		method: 'POST',
		body: {},
	}, 'Usage limits example restored.');
	if (!result) return;
	selectedPlanId.value = 'growth';
	selectedMeterId.value = 'workflow_runs';
	activeView.value = 'policy';
}

/**
 * Selects one meter from the desktop navigation rail.
 *
 * @param {string} meterId Meter identifier.
 * @returns {void}
 */
function selectMeter(meterId) {
	selectedMeterId.value = meterId;
}

/**
 * Keeps the current meter valid after switching plans.
 *
 * @returns {void}
 */
function handlePlanChange() {
	if (workspace.value?.policies.some(matchesSelectedPolicy)) return;
	selectedMeterId.value = workspace.value?.meters[0]?.id || '';
}

/**
 * Marks locally edited policy fields as needing a server save.
 *
 * @returns {void}
 */
function markLocalChange() {
	if (!workspace.value || locked.value) return;
	workspace.value.impact = null;
	workspace.value.notificationReceipt = null;
	workspace.value.approval = null;
	workspace.value.validation = null;
	notice.value = 'Save this policy, then rebuild impact, notification, approval, and release evidence.';
}

/**
 * Toggles one notification channel on the selected policy.
 *
 * @param {string} channel Channel identifier.
 * @param {boolean} enabled Whether the channel should be enabled.
 * @returns {void}
 */
function toggleAlertChannel(channel, enabled) {
	if (!selectedPolicy.value || locked.value) return;
	selectedPolicy.value.alertChannels = enabled
		? [...new Set([...selectedPolicy.value.alertChannels, channel])]
		: selectedPolicy.value.alertChannels.filter((candidate) => candidate !== channel);
	markLocalChange();
}

/**
 * Reports whether one notification channel is selected.
 *
 * @param {string} channel Channel identifier.
 * @returns {boolean} Whether the channel is enabled.
 */
function hasAlertChannel(channel) {
	return selectedPolicy.value?.alertChannels.includes(channel) || false;
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
 * Calls the usage-limit JSON API and promotes HTTP errors to exceptions.
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
	if (!response.ok) throw new Error(result.error || 'Usage policy service request failed.');
	return result;
}

/**
 * Replaces local state with an immutable API workspace.
 *
 * @param {object} result Usage limits API response.
 * @returns {void}
 */
function applyWorkspace(result) {
	workspace.value = result;
	if (!workspace.value.plans.some(matchesSelectedPlan)) selectedPlanId.value = workspace.value.plans[0]?.id || '';
	if (!workspace.value.policies.some(matchesSelectedPolicy)) selectedMeterId.value = workspace.value.meters[0]?.id || '';
}

/**
 * Builds the exact selected policy identity for evidence endpoints.
 *
 * @returns {{ revision: number, planId: string, meterId: string }} Current policy identity.
 */
function currentPolicyIdentity() {
	return {
		revision: workspace.value.policy.revision,
		planId: selectedPolicy.value.planId,
		meterId: selectedPolicy.value.meterId,
	};
}

/**
 * Creates the default exception form state.
 *
 * @returns {object} Exception form.
 */
function createExceptionForm() {
	return {
		customerId: 'cus_brightline',
		meterId: 'workflow_runs',
		hardLimit: 170000,
		expiresAt: '2026-08-31',
		reason: 'Migration weekend requires temporary workflow headroom.',
	};
}

/**
 * Reports whether publication has locked the policy version.
 *
 * @returns {boolean} Whether editing is locked.
 */
function getLocked() {
	return Boolean(workspace.value?.release);
}

/**
 * Returns the selected plan.
 *
 * @returns {object|null} Selected plan or null.
 */
function getSelectedPlan() {
	return workspace.value?.plans.find(matchesSelectedPlan) || workspace.value?.plans[0] || null;
}

/**
 * Matches the selected plan identifier.
 *
 * @param {object} plan Plan record.
 * @returns {boolean} Whether the plan is selected.
 */
function matchesSelectedPlan(plan) {
	return plan.id === selectedPlanId.value;
}

/**
 * Returns the selected plan and meter policy.
 *
 * @returns {object|null} Selected policy or null.
 */
function getSelectedPolicy() {
	return workspace.value?.policies.find(matchesSelectedPolicy) || null;
}

/**
 * Matches the selected plan and meter identifiers.
 *
 * @param {object} policy Usage policy.
 * @returns {boolean} Whether the policy is selected.
 */
function matchesSelectedPolicy(policy) {
	return policy.planId === selectedPlanId.value && policy.meterId === selectedMeterId.value;
}

/**
 * Returns every meter policy for the selected plan.
 *
 * @returns {Array<object>} Selected-plan policies.
 */
function getSelectedPlanPolicies() {
	return workspace.value?.policies.filter((policy) => policy.planId === selectedPlanId.value) || [];
}

/**
 * Builds rich plan options for DOM Studio selects.
 *
 * @returns {Array<object>} Plan options.
 */
function buildPlanOptions() {
	return (workspace.value?.plans || []).map(buildPlanOption);
}

/**
 * Converts one plan into a rich option.
 *
 * @param {object} plan Plan record.
 * @returns {object} Select option.
 */
function buildPlanOption(plan) {
	return {
		value: plan.id,
		label: `${plan.name} plan`,
		description: `${formatNumber(plan.customers)} customers · ${formatMoney(plan.monthlyRevenue)} MRR`,
	};
}

/**
 * Builds rich meter options for the selected plan.
 *
 * @returns {Array<object>} Meter options.
 */
function buildMeterOptions() {
	return selectedPlanPolicies.value.map(buildMeterOption);
}

/**
 * Builds rich meter options for exception creation.
 *
 * @returns {Array<object>} Meter options.
 */
function buildExceptionMeterOptions() {
	return (workspace.value?.meters || []).map((meter) => ({
		value: meter.id,
		label: meter.name,
		description: `${meter.period} · ${meter.unit}`,
	}));
}

/**
 * Converts one policy into a rich meter option.
 *
 * @param {object} policy Usage policy.
 * @returns {object} Select option.
 */
function buildMeterOption(policy) {
	return {
		value: policy.meterId,
		label: policy.name,
		description: `${formatNumber(policy.current)} of ${formatNumber(policy.hardLimit)} ${policy.unit}`,
	};
}

/**
 * Reports whether the selected policy needs human approval.
 *
 * @returns {boolean} Whether approval is required.
 */
function getApprovalRequired() {
	const policy = selectedPolicy.value;
	return Boolean(policy && (policy.requireApproval || policy.hardLimit > policy.recommended || policy.overagePolicy === 'pause'));
}

/**
 * Reports whether the current policy has all publication evidence.
 *
 * @returns {boolean} Whether publication is ready.
 */
function getReleaseReady() {
	const validation = workspace.value?.validation;
	return Boolean(
		!locked.value
		&& validation?.ready
		&& validation.revision === workspace.value?.policy.revision
		&& validation.planId === selectedPlanId.value
		&& validation.meterId === selectedMeterId.value,
	);
}

/**
 * Converts rollout state into a progress percentage.
 *
 * @returns {number} Rollout percentage.
 */
function getRolloutProgress() {
	return { queued: 20, propagating: 68, completed: 100 }[workspace.value?.release?.state] || 0;
}

/**
 * Calculates current usage as a percentage of the hard limit.
 *
 * @returns {number} Current usage percentage.
 */
function getUsagePercent() {
	return percentage(selectedPolicy.value?.current, selectedPolicy.value?.hardLimit);
}

/**
 * Calculates forecast usage as a percentage of the hard limit.
 *
 * @returns {number} Forecast usage percentage.
 */
function getForecastPercent() {
	return percentage(selectedPolicy.value?.forecast, selectedPolicy.value?.hardLimit);
}

/**
 * Returns customer exceptions relevant to the selected plan first.
 *
 * @returns {Array<object>} Ordered exception records.
 */
function getVisibleExceptions() {
	return [...(workspace.value?.exceptions || [])].sort((left, right) => {
		const leftSelected = left.planId === selectedPlanId.value ? 1 : 0;
		const rightSelected = right.planId === selectedPlanId.value ? 1 : 0;
		return rightSelected - leftSelected;
	});
}

/**
 * Calculates a safe rounded percentage.
 *
 * @param {number} value Current value.
 * @param {number} maximum Maximum value.
 * @returns {number} Rounded percentage.
 */
function percentage(value, maximum) {
	if (!Number(maximum)) return 0;
	return Math.max(0, Math.round((Number(value || 0) / Number(maximum)) * 100));
}

/**
 * Formats a numeric count.
 *
 * @param {number} value Numeric value.
 * @returns {string} Localized number.
 */
function formatNumber(value) {
	return Number(value || 0).toLocaleString('en-US');
}

/**
 * Formats a monetary amount in USD.
 *
 * @param {number} value Monetary amount.
 * @returns {string} Compact currency string.
 */
function formatMoney(value) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		notation: Number(value || 0) >= 10000 ? 'compact' : 'standard',
		maximumFractionDigits: 1,
	}).format(Number(value || 0));
}

/**
 * Formats a date-only value for display.
 *
 * @param {string} value ISO date.
 * @returns {string} Human-readable date.
 */
function formatDate(value) {
	if (!value) return 'No expiry';
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

/**
 * Formats the selected overage action.
 *
 * @param {string} value Overage action.
 * @returns {string} Human-readable action.
 */
function overageLabel(value) {
	return {
		charge: 'Bill overages',
		grace: 'Allow grace, then pause',
		pause: 'Pause new usage',
	}[value] || value;
}

/**
 * Maps workflow states to semantic DOM Studio tones.
 *
 * @param {string} status Workflow state.
 * @returns {string} Semantic tone.
 */
function statusTone(status) {
	return {
		draft: 'neutral',
		publishing: 'warning',
		published: 'success',
		pending: 'warning',
		approved: 'success',
		rejected: 'danger',
		queued: 'neutral',
		propagating: 'warning',
		completed: 'success',
		passed: 'success',
		blocked: 'danger',
	}[status] || 'neutral';
}

/**
 * Maps policy forecast state to a semantic tone.
 *
 * @param {object} policy Usage policy.
 * @returns {string} Semantic tone.
 */
function forecastTone(policy) {
	return policy.forecast > policy.hardLimit ? 'warning' : 'success';
}

/**
 * Maps policy forecast state to readable copy.
 *
 * @param {object} policy Usage policy.
 * @returns {string} Forecast label.
 */
function forecastLabel(policy) {
	return policy.forecast > policy.hardLimit ? 'Forecast risk' : 'On track';
}
</script>

<template>
	<section class="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-canvas text-canvas-fg">
		<header class="shrink-0 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur sm:px-5">
			<div class="flex min-w-0 items-center justify-between gap-3">
				<div class="min-w-0">
					<div class="flex min-w-0 items-center gap-2">
						<h1 class="truncate text-sm font-semibold sm:text-base">Usage guardrails</h1>
						<DomBadge v-if="workspace" tone="primary" size="sm" variant="soft">v{{ workspace.policy.version }}</DomBadge>
					</div>
					<p class="mt-0.5 hidden truncate text-xs text-muted-fg sm:block">Forecast, alert, approve, and enforce every metered policy.</p>
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<DomButton variant="secondary" size="sm" :loading="busyAction === 'reset'" @click="resetWorkspace">Reset</DomButton>
					<DomButton v-if="workspace && !locked" size="sm" :disabled="!releaseReady" @click="openPublishDialog">Publish v{{ workspace.policy.version }}</DomButton>
					<DomStatusPill v-else-if="workspace" :tone="statusTone(workspace.policy.status)" :label="workspace.policy.status" size="sm" />
				</div>
			</div>
			<div v-if="workspace" class="mt-3 grid min-w-0 grid-cols-2 gap-2 lg:hidden">
				<DomSelect v-model="selectedPlanId" :options="planOptions" label="Plan" chrome="compact" width="min-w-0">
					<template #option="{ option }">
						<div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div>
					</template>
				</DomSelect>
				<DomSelect v-model="selectedMeterId" :options="meterOptions" label="Meter" chrome="compact" width="min-w-0">
					<template #option="{ option }">
						<div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div>
					</template>
				</DomSelect>
			</div>
		</header>

		<div v-if="loading" class="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_20rem]">
			<DomSkeleton height="100%" label="Loading usage meters" />
			<DomSkeleton height="100%" label="Loading usage policy" />
			<DomSkeleton class="hidden xl:block" height="100%" label="Loading forecast evidence" />
		</div>
		<div v-else-if="!workspace" class="grid min-h-0 flex-1 place-items-center p-5">
			<DomEmptyState title="Usage policy unavailable" :description="error || 'The usage policy service did not return a workspace.'">
				<DomButton @click="loadWorkspace">Try again</DomButton>
			</DomEmptyState>
		</div>

		<div v-else class="grid min-h-0 flex-1 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_20rem]">
			<aside class="hidden min-h-0 overflow-y-auto border-r border-border bg-secondary/20 lg:block">
				<div class="border-b border-border px-4 py-4">
					<DomSelect v-model="selectedPlanId" :options="planOptions" label="Plan" width="min-w-[12rem]">
						<template #option="{ option }">
							<div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div>
						</template>
					</DomSelect>
					<dl class="mt-4 grid grid-cols-2 divide-x divide-border border-y border-border py-3 text-sm">
						<div class="pr-3"><dt class="text-xs text-muted-fg">Customers</dt><dd class="mt-1 font-semibold">{{ formatNumber(selectedPlan.customers) }}</dd></div>
						<div class="pl-3"><dt class="text-xs text-muted-fg">MRR</dt><dd class="mt-1 font-semibold">{{ formatMoney(selectedPlan.monthlyRevenue) }}</dd></div>
					</dl>
				</div>
				<nav aria-label="Usage meters" class="px-4 py-4">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Meters</p>
					<div class="mt-3 divide-y divide-border border-y border-border">
						<button v-for="policy in selectedPlanPolicies" :key="policy.id" type="button" class="block w-full border-l-2 py-3 pl-3 pr-1 text-left transition hover:bg-secondary/50" :class="selectedMeterId === policy.meterId ? 'border-l-primary bg-secondary/60' : 'border-l-transparent'" @click="selectMeter(policy.meterId)">
							<div class="flex items-start justify-between gap-2"><p class="text-sm font-semibold">{{ policy.name }}</p><DomStatusPill :tone="forecastTone(policy)" :label="forecastLabel(policy)" size="sm" /></div>
							<DomProgress class="mt-3" :value="Math.min(100, percentage(policy.current, policy.hardLimit))" :label="`${policy.name} usage`" :show-label="false" size="sm" :tone="forecastTone(policy)" />
							<p class="mt-2 text-xs text-muted-fg">{{ formatNumber(policy.current) }} / {{ formatNumber(policy.hardLimit) }} {{ policy.unit }}</p>
						</button>
					</div>
				</nav>
				<div class="border-t border-border px-4 py-4 text-sm">
					<div class="flex items-center justify-between gap-3"><span>Pending exceptions</span><DomBadge tone="warning" size="sm">{{ workspace.summary.pendingExceptions }}</DomBadge></div>
					<div class="mt-3 flex items-center justify-between gap-3"><span>Active exceptions</span><DomBadge tone="success" size="sm">{{ workspace.summary.activeExceptions }}</DomBadge></div>
				</div>
			</aside>

			<main class="flex min-h-0 min-w-0 flex-col overflow-hidden">
				<section v-if="selectedPolicy" class="shrink-0 border-b border-border bg-secondary/25 px-4 py-3 sm:px-5">
					<div class="flex min-w-0 flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex min-w-0 items-center gap-2"><h2 class="truncate text-lg font-semibold">{{ selectedPolicy.name }}</h2><DomStatusPill :tone="forecastTone(selectedPolicy)" :label="forecastLabel(selectedPolicy)" size="sm" /></div>
							<p class="mt-1 text-xs text-muted-fg">{{ selectedPlan.name }} · {{ workspace.policy.cycleLabel }} · revision {{ workspace.policy.revision }}</p>
						</div>
						<div class="grid grid-cols-3 divide-x divide-border text-center text-xs">
							<div class="px-3"><p class="font-semibold text-canvas-fg">{{ usagePercent }}%</p><p class="text-muted-fg">Used</p></div>
							<div class="px-3"><p class="font-semibold text-canvas-fg">{{ forecastPercent }}%</p><p class="text-muted-fg">Forecast</p></div>
							<div class="px-3"><p class="font-semibold text-canvas-fg">{{ selectedPolicy.trend }}</p><p class="text-muted-fg">Trend</p></div>
						</div>
					</div>
				</section>
				<DomAlert v-if="error" class="m-3 shrink-0" tone="danger" title="Usage policy action failed" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-if="notice && !error" class="m-3 shrink-0" :tone="notice.startsWith('Save this') ? 'warning' : 'success'" title="Usage policy updated" :description="notice" dismissible @dismiss="notice = ''" />

				<DomTabs v-if="selectedPolicy" v-model="activeView" :tabs="tabs" variant="page" fill class="min-h-0">
					<template #policy>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-4xl gap-5 p-4 sm:p-5">
								<div><h3 class="text-xl font-semibold">Set the enforcement contract</h3><p class="mt-1 text-sm leading-6 text-muted-fg">Keep the customer warning, billing behavior, and runtime action in one versioned policy.</p></div>
								<section class="grid gap-5 border-y border-border py-5 md:grid-cols-[minmax(0,1fr)_15rem]">
									<div><DomNumberInput v-model="selectedPolicy.hardLimit" label="Hard limit" :min="selectedPolicy.current + selectedPolicy.step" :max="selectedPolicy.maximum" :step="selectedPolicy.step" :suffix="selectedPolicy.unit" :disabled="locked" @update:model-value="markLocalChange" /><p class="mt-2 text-xs leading-5 text-muted-fg">Current {{ formatNumber(selectedPolicy.current) }} · forecast {{ formatNumber(selectedPolicy.forecast) }} · recommended {{ formatNumber(selectedPolicy.recommended) }} {{ selectedPolicy.unit }}</p></div>
									<div class="grid grid-cols-2 divide-x divide-border border-y border-border py-3 text-sm"><div class="pr-3"><p class="text-xs text-muted-fg">Maximum</p><p class="mt-1 font-semibold">{{ formatNumber(selectedPolicy.maximum) }}</p></div><div class="pl-3"><p class="text-xs text-muted-fg">Headroom</p><p class="mt-1 font-semibold">{{ formatNumber(Math.max(0, selectedPolicy.hardLimit - selectedPolicy.current)) }}</p></div></div>
									<div class="md:col-span-2"><DomRangeInput v-model="selectedPolicy.softThreshold" label="First warning threshold" :min="50" :max="95" :step="5" suffix="%" :disabled="locked" @update:model-value="markLocalChange" /><p class="mt-2 text-xs text-muted-fg">Warn at {{ formatNumber(Math.round(selectedPolicy.hardLimit * selectedPolicy.softThreshold / 100)) }} {{ selectedPolicy.unit }}.</p></div>
								</section>
								<section class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
									<DomRadioGroup v-model="selectedPolicy.overagePolicy" :options="workspace.catalog.overageOptions" label="Action at the hard limit" :disabled="locked" @update:model-value="markLocalChange">
										<template #option="{ option }"><span class="min-w-0"><span class="block text-sm font-semibold">{{ option.label }}</span><span class="mt-0.5 block text-xs leading-5 text-muted-fg">{{ option.description }}</span></span></template>
									</DomRadioGroup>
									<div class="grid content-start gap-4"><DomSelect v-model="selectedPolicy.graceHours" :options="workspace.catalog.graceOptions" label="Grace window" width="min-w-[15rem]" :disabled="locked"><template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template></DomSelect><DomToggle v-model="selectedPolicy.requireApproval" label="Always require approval" description="Route every edit through finance." :disabled="locked" @update:model-value="markLocalChange" /></div>
								</section>
								<section class="border-y border-border py-5">
									<div><h4 class="font-semibold">Threshold delivery</h4><p class="mt-1 text-sm text-muted-fg">A saved policy must prove at least one warning channel before publication.</p></div>
									<div class="mt-4 grid gap-3 sm:grid-cols-3"><DomCheckbox v-for="channel in workspace.catalog.alertChannels" :key="channel.value" :model-value="hasAlertChannel(channel.value)" :label="channel.label" :description="channel.description" :disabled="locked" @update:model-value="toggleAlertChannel(channel.value, $event)" /></div>
									<DomTextInput v-if="hasAlertChannel('webhook')" v-model="selectedPolicy.webhookUrl" class="mt-4" label="Threshold webhook URL" placeholder="https://example.com/webhooks/usage" :disabled="locked" @update:model-value="markLocalChange" />
								</section>
								<div class="flex flex-wrap items-center justify-between gap-3"><p class="text-sm text-muted-fg">{{ approvalRequired ? 'This draft will need finance approval.' : 'This draft remains inside automated guardrails.' }}</p><div class="flex gap-2"><DomButton variant="secondary" @click="activeView = 'release'">Review release</DomButton><DomButton :disabled="locked" :loading="busyAction === 'save'" @click="savePolicy">Save policy</DomButton></div></div>
							</div>
						</div>
					</template>

					<template #usage>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-4xl gap-5 p-4 sm:p-5">
								<div><h3 class="text-xl font-semibold">Forecast the billing cycle</h3><p class="mt-1 text-sm text-muted-fg">Usage gateway data and the current policy share the same selected meter.</p></div>
								<section class="border-y border-border py-5"><div class="flex items-center justify-between gap-3"><p class="text-sm font-semibold">Current usage</p><p class="text-sm font-semibold">{{ formatNumber(selectedPolicy.current) }} / {{ formatNumber(selectedPolicy.hardLimit) }} {{ selectedPolicy.unit }}</p></div><DomProgress class="mt-3" :value="Math.min(100, usagePercent)" :label="`${selectedPolicy.name} current usage`" :show-label="false" size="lg" :tone="forecastTone(selectedPolicy)" /><div class="mt-4 grid grid-cols-3 divide-x divide-border text-center"><div><p class="text-xs text-muted-fg">Current</p><p class="mt-1 text-sm font-semibold">{{ usagePercent }}%</p></div><div><p class="text-xs text-muted-fg">Forecast</p><p class="mt-1 text-sm font-semibold">{{ forecastPercent }}%</p></div><div><p class="text-xs text-muted-fg">Resets</p><p class="mt-1 text-sm font-semibold">31 Aug</p></div></div></section>
								<section><h4 class="text-sm font-semibold">Forecast checkpoints</h4><div class="mt-3 divide-y divide-border border-y border-border text-sm"><div v-for="checkpoint in [{ label: 'Today', value: selectedPolicy.current, detail: 'Usage ledger' }, { label: `Warning at ${selectedPolicy.softThreshold}%`, value: Math.round(selectedPolicy.hardLimit * selectedPolicy.softThreshold / 100), detail: 'Notification gateway' }, { label: 'Cycle forecast', value: selectedPolicy.forecast, detail: selectedPolicy.forecast > selectedPolicy.hardLimit ? 'Crosses the hard limit' : 'Inside the hard limit' }, { label: 'Hard limit', value: selectedPolicy.hardLimit, detail: overageLabel(selectedPolicy.overagePolicy) }]" :key="checkpoint.label" class="grid grid-cols-[1fr_auto] gap-4 py-3"><div><p class="font-medium">{{ checkpoint.label }}</p><p class="mt-0.5 text-xs text-muted-fg">{{ checkpoint.detail }}</p></div><p class="font-semibold">{{ formatNumber(checkpoint.value) }} {{ selectedPolicy.unit }}</p></div></div></section>
								<section class="grid gap-4 sm:grid-cols-3"><div class="border-t border-border pt-3"><p class="text-xs text-muted-fg">Accounts near limit</p><p class="mt-1 text-xl font-semibold">{{ selectedPolicy.risk.near }}</p><p class="mt-1 text-xs text-muted-fg">Need owner attention</p></div><div class="border-t border-border pt-3"><p class="text-xs text-muted-fg">Forecast crossings</p><p class="mt-1 text-xl font-semibold">{{ selectedPolicy.forecast > selectedPolicy.hardLimit ? selectedPolicy.risk.crossing : 0 }}</p><p class="mt-1 text-xs text-muted-fg">Before cycle reset</p></div><div class="border-t border-border pt-3"><p class="text-xs text-muted-fg">Overage rate</p><p class="mt-1 text-xl font-semibold">{{ formatMoney(selectedPolicy.overageRate) }}</p><p class="mt-1 text-xs text-muted-fg">Per {{ selectedPolicy.unit.replace(/s$/, '') }}</p></div></section>
							</div>
						</div>
					</template>

					<template #exceptions>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-5xl gap-5 p-4 sm:p-5">
								<div class="flex flex-wrap items-start justify-between gap-3"><div><h3 class="text-xl font-semibold">Customer exceptions</h3><p class="mt-1 text-sm text-muted-fg">Temporary limits keep one account moving without changing its plan default.</p></div><DomButton @click="openExceptionDialog">New exception</DomButton></div>
								<div v-if="visibleExceptions.length" class="divide-y divide-border border-y border-border"><article v-for="exception in visibleExceptions" :key="exception.id" class="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"><div><div class="flex items-center gap-2"><h4 class="text-sm font-semibold">{{ exception.customerName }}</h4><DomStatusPill :tone="statusTone(exception.status)" :label="exception.status" size="sm" /></div><p class="mt-1 text-xs text-muted-fg">{{ exception.planName }} · {{ exception.owner }}</p></div><div><p class="text-sm font-medium">{{ exception.meterName }} · {{ formatNumber(exception.hardLimit) }} {{ exception.unit }}</p><p class="mt-1 text-xs text-muted-fg">Expires {{ formatDate(exception.expiresAt) }} · {{ exception.reason }}</p></div><div v-if="exception.status === 'pending'" class="flex items-start gap-2"><DomButton size="sm" variant="secondary" :loading="busyAction === 'exception-rejected'" @click="decideException(exception.id, 'rejected')">Reject</DomButton><DomButton size="sm" :loading="busyAction === 'exception-approved'" @click="decideException(exception.id, 'approved')">Approve</DomButton></div><p v-else class="text-xs text-muted-fg sm:text-right">{{ exception.decidedBy }}<br>{{ exception.decidedAt }}</p></article></div>
								<DomEmptyState v-else title="No customer exceptions" description="Create a temporary, expiring exception without changing the plan policy." />
							</div>
						</div>
					</template>

					<template #release>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-4xl gap-5 p-4 sm:p-5">
								<div class="flex flex-wrap items-start justify-between gap-3"><div><h3 class="text-xl font-semibold">Release policy v{{ workspace.policy.version }}</h3><p class="mt-1 text-sm text-muted-fg">Prove forecast impact, delivery, approval, and enforcement before publication.</p></div><DomStatusPill :tone="statusTone(workspace.policy.status)" :label="workspace.policy.status" /></div>
								<section v-if="!workspace.release" class="grid gap-4 sm:grid-cols-2">
									<div class="border-y border-border py-4"><div class="flex items-center justify-between gap-3"><p class="font-semibold">Customer impact</p><DomStatusPill :tone="workspace.impact ? 'success' : 'neutral'" :label="workspace.impact ? 'Calculated' : 'Needed'" size="sm" /></div><p class="mt-2 text-sm leading-6 text-muted-fg">{{ workspace.impact ? `${workspace.impact.affectedAccounts} accounts · ${workspace.impact.forecastCrossingAccounts} forecast crossings · ${formatNumber(workspace.impact.projectedOverage)} excess ${selectedPolicy.unit}` : 'Compare forecast, billing, and interruption impact for the saved revision.' }}</p><DomButton class="mt-4" variant="secondary" :loading="busyAction === 'impact'" @click="calculateImpact">Calculate impact</DomButton></div>
									<div class="border-y border-border py-4"><div class="flex items-center justify-between gap-3"><p class="font-semibold">Threshold delivery</p><DomStatusPill :tone="workspace.notificationReceipt ? 'success' : 'neutral'" :label="workspace.notificationReceipt ? 'Delivered' : 'Needed'" size="sm" /></div><p class="mt-2 text-sm leading-6 text-muted-fg">{{ workspace.notificationReceipt ? `${workspace.notificationReceipt.deliveries.length} channels proved at ${workspace.notificationReceipt.threshold}%` : 'Send a safe test through every selected notification channel.' }}</p><DomButton class="mt-4" variant="secondary" :loading="busyAction === 'notifications'" @click="testNotifications">Send threshold test</DomButton></div>
									<div v-if="approvalRequired" class="border-y border-border py-4 sm:col-span-2"><div class="flex flex-wrap items-start justify-between gap-4"><div><div class="flex items-center gap-2"><p class="font-semibold">Finance approval</p><DomStatusPill :tone="statusTone(workspace.approval?.status || 'pending')" :label="workspace.approval?.status || 'Needed'" size="sm" /></div><p class="mt-2 text-sm leading-6 text-muted-fg">{{ workspace.approval?.reason || 'This draft can interrupt customer usage or crosses a manual guardrail.' }}</p></div><div v-if="!workspace.approval"><DomButton :disabled="!workspace.impact" :loading="busyAction === 'approval-request'" @click="requestApproval">Request approval</DomButton></div><div v-else-if="workspace.approval.status === 'pending'" class="flex gap-2"><DomButton variant="secondary" :loading="busyAction === 'approval-rejected'" @click="decideApproval('rejected')">Reject</DomButton><DomButton :loading="busyAction === 'approval-approved'" @click="decideApproval('approved')">Approve as finance</DomButton></div><p v-else class="text-sm font-medium">{{ workspace.approval.decidedBy }} · {{ workspace.approval.decidedAt }}</p></div></div>
									<div class="sm:col-span-2 border-y border-border py-4"><div class="flex flex-wrap items-center justify-between gap-3"><div><div class="flex items-center gap-2"><p class="font-semibold">Release checks</p><DomStatusPill :tone="workspace.validation?.ready ? 'success' : 'neutral'" :label="workspace.validation?.ready ? 'Passed' : 'Needed'" size="sm" /></div><p class="mt-2 text-sm text-muted-fg">Meter contract, current impact, alert delivery, and approval must agree.</p></div><DomButton variant="secondary" :loading="busyAction === 'validate'" @click="runChecks">Run checks</DomButton></div><div v-if="workspace.validation" class="mt-4 divide-y divide-border border-y border-border"><div v-for="check in workspace.validation.checks" :key="check.id" class="flex items-center justify-between gap-4 py-3"><div><p class="text-sm font-medium">{{ check.label }}</p><p class="mt-0.5 text-xs text-muted-fg">{{ check.detail }}</p></div><DomStatusPill :tone="statusTone(check.state)" :label="check.state" size="sm" /></div></div></div>
									<div class="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p class="text-sm text-muted-fg">Revision {{ workspace.policy.revision }} · {{ workspace.summary.changedPolicyCount }} changed policy</p><DomButton :disabled="!releaseReady" @click="openPublishDialog">Publish policy v{{ workspace.policy.version }}</DomButton></div>
								</section>
								<section v-else class="grid gap-5"><div class="border-y border-border py-5"><div class="flex items-start justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Release receipt</p><h4 class="mt-1 text-xl font-semibold">{{ workspace.release.label }}</h4><p class="mt-2 text-sm text-muted-fg">{{ workspace.release.checksum }} · {{ selectedPlan.name }} · {{ selectedPolicy.name }}</p></div><DomStatusPill :tone="statusTone(workspace.release.state)" :label="workspace.release.state" :pulse="workspace.release.state !== 'completed'" /></div><DomProgress class="mt-5" :value="rolloutProgress" label="Usage enforcement rollout" :show-value="true" :tone="workspace.release.state === 'completed' ? 'success' : 'primary'" /></div><div class="grid gap-3 sm:grid-cols-3"><div v-for="surface in [{ label: 'Usage gateway', detail: 'Hard limit and grace window' }, { label: 'Billing meter', detail: 'Overage rate and invoice events' }, { label: 'Notifications', detail: 'Threshold recipients and webhook' }]" :key="surface.label" class="border-t border-border pt-3"><p class="text-sm font-semibold">{{ surface.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ surface.detail }}</p><DomStatusPill class="mt-3" :tone="workspace.release.state === 'completed' ? 'success' : workspace.release.state === 'propagating' ? 'warning' : 'neutral'" :label="workspace.release.state === 'completed' ? 'Live' : workspace.release.state === 'propagating' ? 'Updating' : 'Queued'" size="sm" /></div></div><DomButton v-if="workspace.release.state !== 'completed'" :loading="busyAction === 'advance'" @click="advanceRollout">{{ workspace.release.state === 'queued' ? 'Start rollout' : 'Complete rollout' }}</DomButton><DomAlert v-else tone="success" title="Usage policy is live" description="The usage gateway, billing meter, and notification service now share the same versioned enforcement contract." /></section>
								<section><p class="text-sm font-semibold">Activity</p><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="item in workspace.activity.slice(0, 8)" :key="item.id" class="py-3"><p class="text-sm font-medium">{{ item.action }}</p><p class="mt-0.5 text-xs leading-5 text-muted-fg">{{ item.detail }}</p><p class="mt-0.5 text-[11px] text-muted-fg">{{ item.actor }} · {{ item.createdAt }}</p></div></div></section>
							</div>
						</div>
					</template>
				</DomTabs>
			</main>

			<aside v-if="selectedPolicy" class="hidden min-h-0 overflow-y-auto border-l border-border bg-secondary/20 xl:block">
				<div class="border-b border-border px-4 py-4"><div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Cycle forecast</p><h3 class="mt-1 text-lg font-semibold">{{ formatNumber(selectedPolicy.forecast) }} {{ selectedPolicy.unit }}</h3></div><DomStatusPill :tone="forecastTone(selectedPolicy)" :label="forecastLabel(selectedPolicy)" size="sm" /></div><p class="mt-2 text-sm leading-6 text-muted-fg">{{ selectedPolicy.description }}</p><DomProgress class="mt-4" :value="Math.min(100, forecastPercent)" :label="`${selectedPolicy.name} forecast`" :show-value="true" :tone="forecastTone(selectedPolicy)" /></div>
				<div class="border-b border-border px-4 py-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Policy effect</p><dl class="mt-3 divide-y divide-border border-y border-border text-sm"><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Warning</dt><dd class="font-medium">{{ selectedPolicy.softThreshold }}%</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Hard limit</dt><dd class="font-medium">{{ formatNumber(selectedPolicy.hardLimit) }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Action</dt><dd class="max-w-40 text-right font-medium">{{ overageLabel(selectedPolicy.overagePolicy) }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Approval</dt><dd class="font-medium">{{ approvalRequired ? 'Required' : 'Automatic' }}</dd></div></dl></div>
				<div class="px-4 py-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Release evidence</p><dl class="mt-3 divide-y divide-border border-y border-border text-sm"><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Impact</dt><dd class="max-w-36 truncate font-medium">{{ workspace.impact?.id || 'Needed' }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Delivery</dt><dd class="max-w-36 truncate font-medium">{{ workspace.notificationReceipt?.id || 'Needed' }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Approval</dt><dd class="font-medium">{{ approvalRequired ? (workspace.approval?.status || 'Needed') : 'Not required' }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Checks</dt><dd class="font-medium">{{ workspace.validation?.ready ? 'Passed' : 'Needed' }}</dd></div></dl></div>
			</aside>
		</div>

		<DomDialog v-model="exceptionDialogOpen" title="Request a customer exception" description="Create a temporary, expiring limit without changing the plan default." size="lg">
			<div class="grid gap-4 sm:grid-cols-2"><DomSelect v-model="exceptionForm.customerId" :options="workspace?.catalog.customerOptions || []" label="Customer" width="min-w-[17rem]"><template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="exceptionForm.meterId" :options="exceptionMeterOptions" label="Meter" width="min-w-[17rem]" /><DomNumberInput v-model="exceptionForm.hardLimit" label="Temporary hard limit" :min="1" :step="1" /><DomDatePicker v-model="exceptionForm.expiresAt" label="Expires on" /><div class="sm:col-span-2"><DomTextareaInput v-model="exceptionForm.reason" label="Reason" :rows="3" /></div></div>
			<template #footer><DomButton variant="secondary" :disabled="busyAction === 'exception-create'" @click="exceptionDialogOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'exception-create'" @click="createException">Create request</DomButton></template>
		</DomDialog>

		<DomDialog v-model="publishDialogOpen" title="Publish usage policy version 6?" description="The server will bind the forecast, alert delivery, approval, and enforcement values to an immutable release receipt." size="md">
			<div v-if="workspace && selectedPolicy" class="grid gap-4"><div class="grid grid-cols-2 gap-3 border-y border-border py-4 text-sm"><div><p class="text-xs text-muted-fg">Hard limit</p><p class="mt-1 font-semibold">{{ formatNumber(selectedPolicy.hardLimit) }}</p></div><div><p class="text-xs text-muted-fg">Forecast</p><p class="mt-1 font-semibold">{{ formatNumber(selectedPolicy.forecast) }}</p></div><div><p class="text-xs text-muted-fg">Accounts</p><p class="mt-1 font-semibold">{{ workspace.impact?.affectedAccounts }}</p></div><div><p class="text-xs text-muted-fg">Action</p><p class="mt-1 font-semibold">{{ overageLabel(selectedPolicy.overagePolicy) }}</p></div></div><DomCheckbox v-model="publishAcknowledged" label="I reviewed billing and customer interruption impact" description="Published policies are immutable and propagate to usage, billing, and notification services." /></div>
			<template #footer><DomButton variant="secondary" :disabled="busyAction === 'publish'" @click="publishDialogOpen = false">Cancel</DomButton><DomButton :disabled="!publishAcknowledged" :loading="busyAction === 'publish'" @click="publishPolicy">Publish policy</DomButton></template>
		</DomDialog>
	</section>
</template>
