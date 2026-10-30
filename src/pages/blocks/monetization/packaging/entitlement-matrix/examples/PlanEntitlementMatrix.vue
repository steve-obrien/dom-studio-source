<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomEmptyState,
	DomJsonViewer,
	DomNumberInput,
	DomProgress,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/entitlement-matrix';
const tabs = [
	{ key: 'matrix', label: 'Matrix' },
	{ key: 'plans', label: 'Plans' },
	{ key: 'checkout', label: 'Checkout' },
	{ key: 'release', label: 'Release' },
];

const workspace = ref(null);
const activeView = ref('matrix');
const selectedPlanId = ref('growth');
const selectedEntitlementKey = ref('automation.runs');
const checkoutPlanId = ref('growth');
const checkoutCadence = ref('annual');
const checkoutSeats = ref(15);
const checkoutAddOnIds = ref(['extra-seats']);
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const publishDialogOpen = ref(false);
const publishAcknowledged = ref(false);

const locked = computed(getLocked);
const selectedPlan = computed(getSelectedPlan);
const selectedEntitlement = computed(getSelectedEntitlement);
const planOptions = computed(buildPlanOptions);
const entitlementOptions = computed(buildEntitlementOptions);
const releaseReady = computed(getReleaseReady);
const rolloutProgress = computed(getRolloutProgress);

onMounted(loadWorkspace);

/**
 * Loads the packaging draft and its server-owned release evidence.
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
 * Saves segment and cadence context for the package draft.
 *
 * @returns {Promise<void>} Resolves after the revisioned settings update.
 */
async function saveContext() {
	if (!workspace.value || locked.value) return;
	await performMutation('context', `${apiBase}/settings`, {
		method: 'PATCH',
		body: {
			revision: workspace.value.package.revision,
			segmentId: workspace.value.package.segmentId,
			cadence: workspace.value.package.cadence,
		},
	}, 'Packaging context saved. Release evidence was cleared for the new revision.');
	checkoutCadence.value = workspace.value?.package.cadence || checkoutCadence.value;
}

/**
 * Saves commercial fields for the selected plan.
 *
 * @returns {Promise<void>} Resolves after the plan draft is persisted.
 */
async function savePlan() {
	if (!workspace.value || !selectedPlan.value || locked.value) return;
	const plan = selectedPlan.value;
	await performMutation('plan', `${apiBase}/plans/${plan.id}`, {
		method: 'PATCH',
		body: {
			revision: workspace.value.package.revision,
			name: plan.name,
			description: plan.description,
			monthlyPrice: plan.monthlyPrice,
			annualPrice: plan.annualPrice,
			includedSeats: plan.includedSeats,
			monthlyPriceId: plan.priceIds.monthly,
			annualPriceId: plan.priceIds.annual,
		},
	}, `${plan.name} commercial terms saved.`);
}

/**
 * Saves all plan values for the selected entitlement key.
 *
 * @returns {Promise<void>} Resolves after the entitlement draft is persisted.
 */
async function saveEntitlement() {
	if (!workspace.value || !selectedEntitlement.value || locked.value) return;
	await performMutation('entitlement', `${apiBase}/entitlements/${encodeURIComponent(selectedEntitlement.value.key)}`, {
		method: 'PATCH',
		body: {
			revision: workspace.value.package.revision,
			values: selectedEntitlement.value.values,
		},
	}, `${selectedEntitlement.value.label} saved across every plan.`);
}

/**
 * Calculates customer and migration impact against the live version.
 *
 * @returns {Promise<void>} Resolves after impact evidence is returned.
 */
async function calculateImpact() {
	if (!workspace.value || locked.value) return;
	await performMutation('impact', `${apiBase}/impact`, {
		method: 'POST',
		body: { revision: workspace.value.package.revision },
	}, 'Customer impact calculated for this exact revision.');
}

/**
 * Runs server-owned catalog, usage, key, and impact checks.
 *
 * @returns {Promise<void>} Resolves after validation evidence is returned.
 */
async function runReleaseChecks() {
	if (!workspace.value || locked.value) return;
	await performMutation('validate', `${apiBase}/validate`, {
		method: 'POST',
		body: { revision: workspace.value.package.revision },
	}, 'Release checks completed for this exact revision.');
}

/**
 * Creates a billing-provider checkout preview from the current draft.
 *
 * @returns {Promise<void>} Resolves after provider evidence is returned.
 */
async function createTestCheckout() {
	if (!workspace.value || locked.value) return;
	await performMutation('checkout', `${apiBase}/checkout`, {
		method: 'POST',
		body: {
			revision: workspace.value.package.revision,
			planId: checkoutPlanId.value,
			cadence: checkoutCadence.value,
			seats: checkoutSeats.value,
			addOnIds: checkoutAddOnIds.value,
		},
	}, 'Billing provider created a checkout preview for this package revision.');
}

/**
 * Opens the package publication acknowledgement dialog.
 *
 * @returns {void}
 */
function openPublishDialog() {
	publishAcknowledged.value = false;
	publishDialogOpen.value = true;
}

/**
 * Publishes the current checked draft into the rollout worker.
 *
 * @returns {Promise<void>} Resolves after immutable release evidence is returned.
 */
async function publishDraft() {
	if (!workspace.value || locked.value) return;
	await performMutation('publish', `${apiBase}/publish`, {
		method: 'POST',
		body: {
			revision: workspace.value.package.revision,
			acknowledged: publishAcknowledged.value,
		},
	}, 'Package version queued for entitlement propagation.');
	if (!error.value) {
		publishDialogOpen.value = false;
		activeView.value = 'release';
	}
}

/**
 * Advances the deterministic release worker by one propagation state.
 *
 * @returns {Promise<void>} Resolves after rollout evidence is updated.
 */
async function advanceRollout() {
	if (!workspace.value?.release) return;
	const queued = workspace.value.release.state === 'queued';
	await performMutation('advance', `${apiBase}/advance`, {
		method: 'POST',
		body: {},
	}, queued ? 'Catalog and runtime propagation started.' : 'Package version is live across every enforcement surface.');
}

/**
 * Restores the deterministic package draft for another complete journey.
 *
 * @returns {Promise<void>} Resolves after reset.
 */
async function resetWorkspace() {
	await performMutation('reset', `${apiBase}/reset`, {
		method: 'POST',
		body: {},
	}, 'Packaging example restored.');
	selectedPlanId.value = 'growth';
	selectedEntitlementKey.value = 'automation.runs';
	checkoutPlanId.value = 'growth';
	checkoutCadence.value = 'annual';
	checkoutSeats.value = 15;
	checkoutAddOnIds.value = ['extra-seats'];
	activeView.value = 'matrix';
}

/**
 * Selects one plan for editing and compact matrix display.
 *
 * @param {string} planId Plan identifier.
 * @returns {void}
 */
function selectPlan(planId) {
	selectedPlanId.value = planId;
}

/**
 * Selects one stable entitlement for editing.
 *
 * @param {string} entitlementKey Entitlement key.
 * @returns {void}
 */
function selectEntitlement(entitlementKey) {
	selectedEntitlementKey.value = entitlementKey;
}

/**
 * Toggles an add-on in the checkout preview request.
 *
 * @param {string} addOnId Add-on identifier.
 * @returns {void}
 */
function toggleCheckoutAddOn(addOnId) {
	checkoutAddOnIds.value = checkoutAddOnIds.value.includes(addOnId)
		? checkoutAddOnIds.value.filter((id) => id !== addOnId)
		: [...checkoutAddOnIds.value, addOnId];
}

/**
 * Clears client evidence when an unsaved field changes.
 *
 * @returns {void}
 */
function markLocalChange() {
	if (!workspace.value || locked.value) return;
	workspace.value.validation = null;
	workspace.value.impact = null;
	workspace.value.checkoutReceipt = null;
	notice.value = 'Save this change, then recalculate impact and release evidence.';
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
 * Replaces local state with an immutable API workspace.
 *
 * @param {object} result Packaging API response.
 * @returns {void}
 */
function applyWorkspace(result) {
	workspace.value = result;
	if (!workspace.value.plans.some(matchesSelectedPlan)) selectedPlanId.value = workspace.value.plans[0]?.id || '';
	if (!workspace.value.entitlements.some(matchesSelectedEntitlement)) selectedEntitlementKey.value = workspace.value.entitlements[0]?.key || '';
}

/**
 * Calls the packaging JSON API and promotes HTTP errors to exceptions.
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
	if (!response.ok) throw new Error(result.error || 'Packaging service request failed.');
	return result;
}

/**
 * Reports whether the package has entered its immutable release lifecycle.
 *
 * @returns {boolean} Whether editing is locked.
 */
function getLocked() {
	return Boolean(workspace.value?.release);
}

/**
 * Returns the selected plan record.
 *
 * @returns {object|null} Selected plan or null.
 */
function getSelectedPlan() {
	return workspace.value?.plans.find(matchesSelectedPlan) || workspace.value?.plans[0] || null;
}

/**
 * Matches the active plan identifier.
 *
 * @param {object} plan Plan record.
 * @returns {boolean} Whether the plan is selected.
 */
function matchesSelectedPlan(plan) {
	return plan.id === selectedPlanId.value;
}

/**
 * Returns the selected entitlement record.
 *
 * @returns {object|null} Selected entitlement or null.
 */
function getSelectedEntitlement() {
	return workspace.value?.entitlements.find(matchesSelectedEntitlement) || workspace.value?.entitlements[0] || null;
}

/**
 * Matches the active entitlement key.
 *
 * @param {object} entitlement Entitlement record.
 * @returns {boolean} Whether the entitlement is selected.
 */
function matchesSelectedEntitlement(entitlement) {
	return entitlement.key === selectedEntitlementKey.value;
}

/**
 * Builds rich plan options for compact selection controls.
 *
 * @returns {Array<object>} Plan options.
 */
function buildPlanOptions() {
	return (workspace.value?.plans || []).map(buildPlanOption);
}

/**
 * Converts one plan into a rich select option.
 *
 * @param {object} plan Plan record.
 * @returns {object} Select option.
 */
function buildPlanOption(plan) {
	return {
		value: plan.id,
		label: plan.name,
		description: `${formatMoney(planPrice(plan))} / seat · ${formatNumber(plan.customerCount)} customers`,
	};
}

/**
 * Builds rich entitlement options for compact selection controls.
 *
 * @returns {Array<object>} Entitlement options.
 */
function buildEntitlementOptions() {
	return (workspace.value?.entitlements || []).map(buildEntitlementOption);
}

/**
 * Converts one entitlement into a rich select option.
 *
 * @param {object} entitlement Entitlement record.
 * @returns {object} Select option.
 */
function buildEntitlementOption(entitlement) {
	return {
		value: entitlement.key,
		label: entitlement.label,
		description: `${entitlement.group} · ${entitlement.key}`,
	};
}

/**
 * Returns entitlements in one display group.
 *
 * @param {string} group Group label.
 * @returns {Array<object>} Matching entitlements.
 */
function entitlementsForGroup(group) {
	return workspace.value?.entitlements.filter((entitlement) => entitlement.group === group) || [];
}

/**
 * Reports whether all current release prerequisites exist.
 *
 * @returns {boolean} Whether publication can begin.
 */
function getReleaseReady() {
	const revision = workspace.value?.package.revision;
	return Boolean(
		!locked.value
		&& workspace.value?.impact?.revision === revision
		&& workspace.value?.validation?.revision === revision
		&& workspace.value?.validation?.ready
		&& workspace.value?.checkoutReceipt?.revision === revision,
	);
}

/**
 * Converts rollout state into a progress percentage.
 *
 * @returns {number} Rollout percentage.
 */
function getRolloutProgress() {
	return { queued: 20, propagating: 65, completed: 100 }[workspace.value?.release?.state] || 0;
}

/**
 * Resolves the displayed price for a plan under the package cadence.
 *
 * @param {object} plan Plan record.
 * @returns {number} Monthly-equivalent price.
 */
function planPrice(plan) {
	return workspace.value?.package.cadence === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
}

/**
 * Formats a plan or checkout amount in USD.
 *
 * @param {number} value Numeric amount.
 * @returns {string} Currency string.
 */
function formatMoney(value) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(Number(value || 0));
}

/**
 * Formats a numeric count for package summaries.
 *
 * @param {number} value Numeric count.
 * @returns {string} Localized count.
 */
function formatNumber(value) {
	return Number(value || 0).toLocaleString('en-US');
}

/**
 * Formats a raw entitlement value for the comparison matrix.
 *
 * @param {boolean|number|string} value Entitlement value.
 * @returns {string} Readable value.
 */
function formatEntitlementValue(value) {
	if (value === true) return 'Included';
	if (value === false) return 'Not included';
	if (typeof value === 'number') return formatNumber(value);
	return String(value);
}

/**
 * Maps workflow state to a readable label.
 *
 * @param {string} status Package status.
 * @returns {string} Status label.
 */
function statusLabel(status) {
	return {
		draft: 'Draft',
		publishing: 'Publishing',
		published: 'Published',
		public: 'Public',
		recommended: 'Recommended',
		sales_assisted: 'Sales assisted',
	}[status] || status;
}

/**
 * Maps workflow state to a semantic DOM Studio tone.
 *
 * @param {string} status Package or plan status.
 * @returns {string} Status tone.
 */
function statusTone(status) {
	return {
		draft: 'neutral',
		publishing: 'warning',
		published: 'success',
		public: 'info',
		recommended: 'primary',
		sales_assisted: 'success',
		archived: 'neutral',
	}[status] || 'neutral';
}

/**
 * Maps validation state to a semantic tone.
 *
 * @param {string} state Validation state.
 * @returns {string} Status tone.
 */
function checkTone(state) {
	return state === 'passed' ? 'success' : state === 'warning' ? 'warning' : 'danger';
}
</script>

<template>
	<section class="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-canvas text-canvas-fg">
		<header class="shrink-0 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur sm:px-5">
			<div class="flex min-w-0 items-center justify-between gap-3">
				<div class="min-w-0">
					<div class="flex min-w-0 items-center gap-2"><h1 class="truncate text-sm font-semibold sm:text-base">Packaging control</h1><DomBadge v-if="workspace" tone="primary" size="sm" variant="soft">v{{ workspace.package.version }}</DomBadge></div>
					<p class="mt-0.5 hidden truncate text-xs text-muted-fg sm:block">Price catalog, runtime gates, customer impact, and release evidence.</p>
				</div>
				<div class="flex shrink-0 items-center gap-2"><DomButton variant="secondary" size="sm" :loading="busyAction === 'reset'" @click="resetWorkspace">Reset</DomButton><DomButton v-if="workspace && !locked" size="sm" :disabled="!releaseReady" @click="openPublishDialog">Publish v{{ workspace.package.version }}</DomButton><DomStatusPill v-else-if="workspace" :tone="statusTone(workspace.package.status)" :label="statusLabel(workspace.package.status)" size="sm" /></div>
			</div>
			<div v-if="workspace" class="mt-3 flex min-w-0 gap-2 lg:hidden">
				<DomSelect v-model="selectedPlanId" :options="planOptions" label="Plan" chrome="compact" width="min-w-[min(13rem,calc(50vw-1rem))]"><template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template></DomSelect>
				<DomSelect v-model="selectedEntitlementKey" :options="entitlementOptions" label="Entitlement" chrome="compact" width="min-w-[min(15rem,calc(50vw-1rem))]"><template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template></DomSelect>
			</div>
		</header>

		<div v-if="loading" class="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_20rem]"><DomSkeleton height="100%" label="Loading package versions" /><DomSkeleton height="100%" label="Loading entitlement matrix" /><DomSkeleton class="hidden xl:block" height="100%" label="Loading draft inspector" /></div>
		<div v-else-if="!workspace" class="grid min-h-0 flex-1 place-items-center p-5"><DomEmptyState title="Packaging workspace unavailable" :description="error || 'The packaging service did not return a draft.'"><DomButton @click="loadWorkspace">Try again</DomButton></DomEmptyState></div>

		<div v-else class="grid min-h-0 flex-1 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_20rem]">
			<aside class="hidden min-h-0 overflow-y-auto border-r border-border bg-secondary/20 lg:block">
				<div class="border-b border-border px-4 py-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Versions</p><div class="mt-3 divide-y divide-border border-y border-border"><button v-for="version in workspace.versions" :key="version.id" type="button" class="flex w-full items-center justify-between gap-3 py-3 text-left"><div><p class="text-sm font-medium">{{ version.label }}</p><p class="mt-0.5 text-xs text-muted-fg">{{ version.detail }}</p></div><span class="size-2 rounded-full" :class="version.version === workspace.package.version ? 'bg-primary' : version.status === 'published' ? 'bg-success' : 'bg-border'" aria-hidden="true" /></button></div></div>
				<div class="px-4 py-4"><div class="flex items-center justify-between gap-3"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Plans</p><DomBadge tone="neutral" size="sm">{{ workspace.plans.length }}</DomBadge></div><nav aria-label="Plans" class="mt-3 divide-y divide-border border-y border-border"><button v-for="plan in workspace.plans" :key="plan.id" type="button" class="block w-full border-l-2 py-3 pl-3 pr-1 text-left transition hover:bg-secondary/50" :class="selectedPlanId === plan.id ? 'border-l-primary bg-secondary/60' : 'border-l-transparent'" @click="selectPlan(plan.id)"><div class="flex items-center justify-between gap-2"><p class="text-sm font-semibold">{{ plan.name }}</p><span class="text-xs font-medium">{{ formatMoney(planPrice(plan)) }}</span></div><p class="mt-1 text-xs text-muted-fg">{{ formatNumber(plan.customerCount) }} customers · {{ plan.includedSeats }} seats</p></button></nav></div>
			</aside>

			<main class="flex min-h-0 min-w-0 flex-col overflow-hidden">
				<section class="shrink-0 border-b border-border bg-secondary/25 px-4 py-3 sm:px-5"><div class="flex min-w-0 flex-wrap items-start justify-between gap-3"><div class="min-w-0"><div class="flex min-w-0 items-center gap-2"><h2 class="truncate text-lg font-semibold">{{ workspace.package.name }}</h2><DomStatusPill :tone="statusTone(workspace.package.status)" :label="statusLabel(workspace.package.status)" size="sm" /></div><p class="mt-1 text-xs text-muted-fg">Live v{{ workspace.package.liveVersion }} · draft revision {{ workspace.package.revision }} · {{ workspace.package.owner }}</p></div><div class="grid grid-cols-3 divide-x divide-border text-center text-xs"><div class="px-3"><p class="font-semibold text-canvas-fg">{{ workspace.summary.entitlementCount }}</p><p class="text-muted-fg">Keys</p></div><div class="px-3"><p class="font-semibold text-canvas-fg">{{ workspace.summary.meteredCount }}</p><p class="text-muted-fg">Metered</p></div><div class="px-3"><p class="font-semibold text-canvas-fg">{{ workspace.summary.unsavedChanges }}</p><p class="text-muted-fg">Changes</p></div></div></div></section>
				<DomAlert v-if="error" class="m-3 shrink-0" tone="danger" title="Packaging action failed" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-if="notice && !error" class="m-3 shrink-0" :tone="notice.startsWith('Save this') ? 'warning' : 'success'" title="Packaging updated" :description="notice" dismissible @dismiss="notice = ''" />

				<DomTabs v-model="activeView" :tabs="tabs" variant="page" fill class="min-h-0">
					<template #matrix>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="hidden min-w-[44rem] md:block">
								<table class="w-full border-separate border-spacing-0 text-sm"><thead><tr><th class="sticky top-0 z-20 w-[18rem] border-b border-r border-border bg-canvas px-4 py-3 text-left">Entitlement</th><th v-for="plan in workspace.plans" :key="plan.id" class="sticky top-0 z-10 min-w-36 border-b border-border bg-canvas px-4 py-3 text-left"><button type="button" class="w-full text-left" @click="selectPlan(plan.id)"><span class="font-semibold">{{ plan.name }}</span><span class="mt-0.5 block text-xs font-normal text-muted-fg">{{ formatMoney(planPrice(plan)) }} / seat</span></button></th></tr></thead><tbody v-for="group in workspace.catalog.groups" :key="group"><tr><td :colspan="workspace.plans.length + 1" class="border-b border-border bg-secondary/60 px-4 py-2.5"><p class="text-xs font-semibold uppercase tracking-[0.14em]">{{ group }}</p></td></tr><tr v-for="entitlement in entitlementsForGroup(group)" :key="entitlement.key" class="group"><th class="border-b border-r border-border bg-canvas p-0 text-left align-top"><button type="button" class="block w-full border-l-2 px-4 py-3 text-left" :class="selectedEntitlementKey === entitlement.key ? 'border-l-primary bg-secondary/55' : 'border-l-transparent'" @click="selectEntitlement(entitlement.key)"><span class="font-medium">{{ entitlement.label }}</span><span class="mt-0.5 block text-xs font-normal text-muted-fg">{{ entitlement.key }}</span></button></th><td v-for="plan in workspace.plans" :key="`${entitlement.key}-${plan.id}`" class="border-b border-border px-4 py-3 align-middle group-hover:bg-secondary/25" :class="selectedPlanId === plan.id ? 'bg-primary/5' : ''"><DomStatusPill v-if="typeof entitlement.values[plan.id] === 'boolean'" :tone="entitlement.values[plan.id] ? 'success' : 'neutral'" :label="formatEntitlementValue(entitlement.values[plan.id])" size="sm" /><span v-else class="font-medium">{{ formatEntitlementValue(entitlement.values[plan.id]) }}</span><p v-if="entitlement.metered" class="mt-0.5 text-xs text-muted-fg">Monthly meter</p></td></tr></tbody></table>
							</div>

							<div class="md:hidden"><div class="border-b border-border px-4 py-3"><p class="text-sm font-semibold">{{ selectedPlan.name }} entitlements</p><p class="mt-1 text-xs text-muted-fg">Tap a row to edit its values across all plans.</p></div><div v-for="group in workspace.catalog.groups" :key="`mobile-${group}`"><p class="border-b border-border bg-secondary/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]">{{ group }}</p><button v-for="entitlement in entitlementsForGroup(group)" :key="`mobile-${entitlement.key}`" type="button" class="flex w-full items-center justify-between gap-3 border-b border-l-2 border-border px-4 py-3 text-left" :class="selectedEntitlementKey === entitlement.key ? 'border-l-primary bg-secondary/55' : 'border-l-transparent'" @click="selectEntitlement(entitlement.key)"><div class="min-w-0"><p class="truncate text-sm font-medium">{{ entitlement.label }}</p><p class="mt-0.5 truncate text-xs text-muted-fg">{{ entitlement.key }}</p></div><DomStatusPill v-if="typeof entitlement.values[selectedPlan.id] === 'boolean'" :tone="entitlement.values[selectedPlan.id] ? 'success' : 'neutral'" :label="formatEntitlementValue(entitlement.values[selectedPlan.id])" size="sm" /><span v-else class="shrink-0 text-sm font-semibold">{{ formatEntitlementValue(entitlement.values[selectedPlan.id]) }}</span></button></div></div>

							<section v-if="selectedEntitlement" class="border-t border-border p-4 sm:p-5 xl:hidden"><div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Edit entitlement</p><h3 class="mt-1 text-lg font-semibold">{{ selectedEntitlement.label }}</h3><p class="mt-1 text-xs text-muted-fg">{{ selectedEntitlement.key }}</p></div><DomBadge :tone="selectedEntitlement.metered ? 'warning' : 'neutral'" size="sm">{{ selectedEntitlement.valueType }}</DomBadge></div><p class="mt-3 text-sm leading-6 text-muted-fg">{{ selectedEntitlement.detail }}</p><div class="mt-5 grid gap-4 sm:grid-cols-3"><div v-for="plan in workspace.plans" :key="`editor-${plan.id}`"><DomToggle v-if="selectedEntitlement.valueType === 'boolean'" v-model="selectedEntitlement.values[plan.id]" :label="plan.name" description="Included in this plan" :disabled="locked" @update:model-value="markLocalChange" /><DomNumberInput v-else-if="selectedEntitlement.valueType === 'limit'" v-model="selectedEntitlement.values[plan.id]" :label="plan.name" :min="0" :step="1" :disabled="locked" @update:model-value="markLocalChange" /><DomTextInput v-else v-model="selectedEntitlement.values[plan.id]" :label="plan.name" :disabled="locked" @update:model-value="markLocalChange" /></div></div><DomButton class="mt-5" :disabled="locked" :loading="busyAction === 'entitlement'" @click="saveEntitlement">Save entitlement values</DomButton></section>
						</div>
					</template>

					<template #plans>
						<div class="min-h-0 flex-1 overflow-y-auto"><div class="mx-auto grid w-full max-w-4xl gap-5 p-4 sm:p-5"><div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_16rem]"><DomSelect v-model="selectedPlanId" :options="planOptions" label="Plan to edit" width="min-w-[17rem]"><template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template></DomSelect><DomStatusPill class="self-end" :tone="statusTone(selectedPlan.status)" :label="statusLabel(selectedPlan.status)" /></div><section class="border-y border-border py-5"><div class="grid gap-4 sm:grid-cols-2"><DomTextInput v-model="selectedPlan.name" label="Plan name" :disabled="locked" @update:model-value="markLocalChange" /><DomNumberInput v-model="selectedPlan.includedSeats" label="Included seats" :min="1" :step="1" :disabled="locked" @update:model-value="markLocalChange" /><div class="sm:col-span-2"><DomTextInput v-model="selectedPlan.description" label="Customer fit" :disabled="locked" @update:model-value="markLocalChange" /></div><DomNumberInput v-model="selectedPlan.monthlyPrice" label="Monthly price per seat" :min="1" :step="1" prefix="$" :disabled="locked" @update:model-value="markLocalChange" /><DomNumberInput v-model="selectedPlan.annualPrice" label="Annual monthly equivalent" :min="1" :step="1" prefix="$" :disabled="locked" @update:model-value="markLocalChange" /><DomTextInput v-model="selectedPlan.priceIds.monthly" label="Monthly price ID" :disabled="locked" @update:model-value="markLocalChange" /><DomTextInput v-model="selectedPlan.priceIds.annual" label="Annual price ID" :disabled="locked" @update:model-value="markLocalChange" /></div><div class="mt-5 flex flex-wrap gap-2"><DomButton :disabled="locked" :loading="busyAction === 'plan'" @click="savePlan">Save plan</DomButton><DomButton variant="secondary" @click="activeView = 'checkout'; checkoutPlanId = selectedPlan.id">Preview checkout</DomButton></div></section><section><div class="flex items-start justify-between gap-4"><div><h3 class="text-sm font-semibold">Package context</h3><p class="mt-1 text-xs text-muted-fg">Segment affects positioning; cadence selects the active billing catalog.</p></div><DomBadge tone="neutral" size="sm">Revision {{ workspace.package.revision }}</DomBadge></div><div class="mt-4 grid gap-4 sm:grid-cols-2"><DomSelect v-model="workspace.package.segmentId" :options="workspace.catalog.segmentOptions" label="Customer segment" width="min-w-[17rem]"><template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="workspace.package.cadence" :options="workspace.catalog.cadenceOptions" label="Billing cadence" width="min-w-[17rem]"><template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template></DomSelect></div><DomButton class="mt-4" variant="secondary" :disabled="locked" :loading="busyAction === 'context'" @click="saveContext">Save context</DomButton></section></div></div>
					</template>

					<template #checkout>
						<div class="min-h-0 flex-1 overflow-y-auto"><div class="mx-auto grid w-full max-w-4xl gap-5 p-4 sm:p-5"><div><h3 class="text-xl font-semibold">Test checkout</h3><p class="mt-1 text-sm text-muted-fg">Ask the billing provider to price the exact draft catalog before release.</p></div><section class="grid gap-4 border-y border-border py-5 sm:grid-cols-3"><DomSelect v-model="checkoutPlanId" :options="planOptions" label="Plan" width="min-w-[16rem]" /><DomSelect v-model="checkoutCadence" :options="workspace.catalog.cadenceOptions" label="Cadence" width="min-w-[16rem]" /><DomNumberInput v-model="checkoutSeats" label="Seats" :min="1" :step="1" /><div class="sm:col-span-3"><p class="text-sm font-medium">Add-ons</p><div class="mt-3 grid gap-3 sm:grid-cols-2"><DomCheckbox v-for="option in workspace.catalog.addOnOptions" :key="option.value" :model-value="checkoutAddOnIds.includes(option.value)" :label="option.label" :description="option.description" @update:model-value="toggleCheckoutAddOn(option.value)" /></div></div><div class="sm:col-span-3"><DomButton :disabled="locked" :loading="busyAction === 'checkout'" @click="createTestCheckout">Create provider preview</DomButton></div></section><section v-if="workspace.checkoutReceipt" class="grid gap-5 md:grid-cols-[minmax(0,1fr)_18rem]"><div><div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Provider receipt</p><h4 class="mt-1 text-lg font-semibold">{{ workspace.checkoutReceipt.planName }} checkout ready</h4></div><DomStatusPill tone="success" label="Ready" /></div><dl class="mt-4 divide-y divide-border border-y border-border text-sm"><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Session</dt><dd class="font-mono text-xs">{{ workspace.checkoutReceipt.providerSessionId }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Price ID</dt><dd class="font-mono text-xs">{{ workspace.checkoutReceipt.priceId }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Monthly equivalent</dt><dd class="font-semibold">{{ formatMoney(workspace.checkoutReceipt.monthlyTotal) }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Invoice total</dt><dd class="font-semibold">{{ formatMoney(workspace.checkoutReceipt.invoiceTotal) }}</dd></div></dl></div><DomJsonViewer :value="workspace.checkoutReceipt" :expanded-depth="2" /></section><DomEmptyState v-else title="No checkout proof yet" description="Create a provider preview to bind plan, cadence, seats, add-ons, and price ID to this package revision." /></div></div>
					</template>

					<template #release>
						<div class="min-h-0 flex-1 overflow-y-auto"><div class="mx-auto grid w-full max-w-4xl gap-5 p-4 sm:p-5"><div class="flex flex-wrap items-start justify-between gap-3"><div><h3 class="text-xl font-semibold">Release package v{{ workspace.package.version }}</h3><p class="mt-1 text-sm text-muted-fg">Prove customer impact, policy checks, checkout mapping, and rollout.</p></div><DomStatusPill :tone="statusTone(workspace.package.status)" :label="statusLabel(workspace.package.status)" /></div><section v-if="!workspace.release" class="grid gap-4 sm:grid-cols-2"><div class="border-y border-border py-4"><div class="flex items-center justify-between gap-3"><p class="font-semibold">Customer impact</p><DomStatusPill :tone="workspace.impact ? (workspace.impact.breakingChanges ? 'warning' : 'success') : 'neutral'" :label="workspace.impact ? 'Calculated' : 'Needed'" size="sm" /></div><p class="mt-2 text-sm leading-6 text-muted-fg">{{ workspace.impact ? `${formatNumber(workspace.impact.affectedWorkspaces)} workspaces · ${workspace.impact.changedCells} changes · ${workspace.impact.breakingChanges} breaking` : 'Compare this draft with live v3 and identify migrations.' }}</p><DomButton class="mt-4" variant="secondary" :loading="busyAction === 'impact'" @click="calculateImpact">Calculate impact</DomButton></div><div class="border-y border-border py-4"><div class="flex items-center justify-between gap-3"><p class="font-semibold">Release checks</p><DomStatusPill :tone="workspace.validation?.ready ? 'success' : 'neutral'" :label="workspace.validation?.ready ? 'Passed' : 'Needed'" size="sm" /></div><p class="mt-2 text-sm leading-6 text-muted-fg">Billing IDs, runtime keys, usage meters, and impact evidence must agree.</p><DomButton class="mt-4" variant="secondary" :disabled="!workspace.impact" :loading="busyAction === 'validate'" @click="runReleaseChecks">Run checks</DomButton></div><div v-if="workspace.validation" class="sm:col-span-2 divide-y divide-border border-y border-border"><div v-for="check in workspace.validation.checks" :key="check.id" class="flex items-center justify-between gap-4 py-3"><div><p class="text-sm font-medium">{{ check.label }}</p><p class="mt-0.5 text-xs text-muted-fg">{{ check.detail }}</p></div><DomStatusPill :tone="checkTone(check.state)" :label="check.state" size="sm" /></div></div><div class="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p class="text-sm text-muted-fg">Checkout proof: <span class="font-medium text-canvas-fg">{{ workspace.checkoutReceipt ? workspace.checkoutReceipt.providerSessionId : 'needed' }}</span></p><DomButton :disabled="!releaseReady" @click="openPublishDialog">Publish package v{{ workspace.package.version }}</DomButton></div></section><section v-else class="grid gap-5"><div class="border-y border-border py-5"><div class="flex items-start justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Release receipt</p><h4 class="mt-1 text-xl font-semibold">{{ workspace.release.label }}</h4><p class="mt-2 text-sm text-muted-fg">{{ workspace.release.checksum }} · {{ formatNumber(workspace.release.affectedWorkspaces) }} affected workspaces</p></div><DomStatusPill :tone="workspace.release.state === 'completed' ? 'success' : 'warning'" :label="workspace.release.state" :pulse="workspace.release.state !== 'completed'" /></div><DomProgress class="mt-5" :value="rolloutProgress" label="Entitlement propagation" :show-value="true" :tone="workspace.release.state === 'completed' ? 'success' : 'primary'" /></div><div class="grid gap-3 sm:grid-cols-3"><div v-for="surface in [{ label: 'Billing catalog', detail: 'Price IDs and checkout products' }, { label: 'Runtime gates', detail: 'API and application entitlements' }, { label: 'Usage gateway', detail: 'Metered monthly limits' }]" :key="surface.label" class="border-t border-border pt-3"><p class="text-sm font-semibold">{{ surface.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ surface.detail }}</p><DomStatusPill class="mt-3" :tone="workspace.release.state === 'completed' ? 'success' : workspace.release.state === 'propagating' ? 'warning' : 'neutral'" :label="workspace.release.state === 'completed' ? 'Live' : workspace.release.state === 'propagating' ? 'Updating' : 'Queued'" size="sm" /></div></div><DomButton v-if="workspace.release.state !== 'completed'" :loading="busyAction === 'advance'" @click="advanceRollout">{{ workspace.release.state === 'queued' ? 'Start propagation' : 'Complete rollout' }}</DomButton><DomAlert v-else tone="success" title="Package version is live" description="Billing, runtime gates, and usage enforcement now share the same versioned entitlement contract." /></section><section><p class="text-sm font-semibold">Activity</p><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="item in workspace.activity.slice(0, 8)" :key="item.id" class="py-3"><p class="text-sm font-medium">{{ item.action }}</p><p class="mt-0.5 text-xs leading-5 text-muted-fg">{{ item.detail }}</p><p class="mt-0.5 text-[11px] text-muted-fg">{{ item.actor }} · {{ item.createdAt }}</p></div></div></section></div></div>
					</template>
				</DomTabs>
			</main>

			<aside v-if="selectedEntitlement" class="hidden min-h-0 overflow-y-auto border-l border-border bg-secondary/20 xl:block"><div class="border-b border-border px-4 py-4"><div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Entitlement inspector</p><h3 class="mt-1 text-lg font-semibold">{{ selectedEntitlement.label }}</h3></div><DomBadge :tone="selectedEntitlement.metered ? 'warning' : 'neutral'" size="sm">{{ selectedEntitlement.valueType }}</DomBadge></div><p class="mt-2 break-all font-mono text-xs text-muted-fg">{{ selectedEntitlement.key }}</p><p class="mt-3 text-sm leading-6 text-muted-fg">{{ selectedEntitlement.detail }}</p></div><div class="grid gap-4 border-b border-border px-4 py-4"><div v-for="plan in workspace.plans" :key="`side-${plan.id}`"><DomToggle v-if="selectedEntitlement.valueType === 'boolean'" v-model="selectedEntitlement.values[plan.id]" :label="plan.name" description="Included in this plan" :disabled="locked" @update:model-value="markLocalChange" /><DomNumberInput v-else-if="selectedEntitlement.valueType === 'limit'" v-model="selectedEntitlement.values[plan.id]" :label="plan.name" :min="0" :step="1" :disabled="locked" @update:model-value="markLocalChange" /><DomTextInput v-else v-model="selectedEntitlement.values[plan.id]" :label="plan.name" :disabled="locked" @update:model-value="markLocalChange" /></div><DomButton :disabled="locked" :loading="busyAction === 'entitlement'" @click="saveEntitlement">Save entitlement values</DomButton></div><div class="px-4 py-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Release evidence</p><dl class="mt-3 divide-y divide-border border-y border-border text-sm"><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Impact</dt><dd class="font-medium">{{ workspace.impact?.id || 'Needed' }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Checks</dt><dd class="font-medium">{{ workspace.validation?.ready ? 'Passed' : 'Needed' }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Checkout</dt><dd class="max-w-32 truncate font-medium">{{ workspace.checkoutReceipt?.providerSessionId || 'Needed' }}</dd></div></dl></div></aside>
		</div>

		<DomDialog v-model="publishDialogOpen" title="Publish package version 4?" description="The server will bind the customer impact, package checks, provider checkout, and entitlement values to an immutable release receipt." size="md"><div v-if="workspace" class="grid gap-4"><div class="grid grid-cols-2 gap-3 border-y border-border py-4 text-sm"><div><p class="text-xs text-muted-fg">Changes</p><p class="mt-1 font-semibold">{{ workspace.impact?.changedCells }}</p></div><div><p class="text-xs text-muted-fg">Affected</p><p class="mt-1 font-semibold">{{ formatNumber(workspace.impact?.affectedWorkspaces) }}</p></div><div><p class="text-xs text-muted-fg">Breaking</p><p class="mt-1 font-semibold">{{ workspace.impact?.breakingChanges }}</p></div><div><p class="text-xs text-muted-fg">Checkout</p><p class="mt-1 truncate font-mono text-xs">{{ workspace.checkoutReceipt?.providerSessionId }}</p></div></div><DomCheckbox v-model="publishAcknowledged" label="I reviewed customer impact and runtime enforcement" description="Published versions are immutable and propagate to billing, application gates, and usage meters." /></div><template #footer><DomButton variant="secondary" :disabled="busyAction === 'publish'" @click="publishDialogOpen = false">Cancel</DomButton><DomButton :disabled="!publishAcknowledged" :loading="busyAction === 'publish'" @click="publishDraft">Publish version</DomButton></template></DomDialog>
	</section>
</template>
