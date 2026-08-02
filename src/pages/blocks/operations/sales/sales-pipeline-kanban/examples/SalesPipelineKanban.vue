<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
	DomAlert,
	DomAppBottomNav,
	DomAppShell,
	DomAppTopBar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomDrawer,
	DomEmptyState,
	DomIconButton,
	DomJsonViewer,
	DomProgress,
	DomRangeInput,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTextareaInput,
	DomTextInput,
	DomToggleButtonGroup,
} from '@getdom/studio/vue';
import DealWorkspace from '../components/DealWorkspace.vue';

const apiBase = '/api/block-demos/sales-pipeline';
const refreshIcon = 'M20 12a8 8 0 1 1-2.34-5.66M20 4v6h-6';
const filterIcon = 'M4 6h16M7 12h10M10 18h4';
const attentionModes = [
	{ value: 'all', label: 'All deals' },
	{ value: 'attention', label: 'Attention' },
	{ value: 'today', label: 'Due today' },
];

const workspace = ref(null);
const catalogs = ref({ stages: [], owners: [], regions: [], forecasts: [], activityTypes: [] });
const stages = ref([]);
const deals = ref([]);
const selectedDeal = ref(null);
const transitionPreview = ref(null);
const activity = ref([]);
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const fieldErrors = ref({});
const activeView = ref('board');
const mobileStage = ref('proposal');
const ownerFilter = ref('all');
const regionFilter = ref('all');
const attentionMode = ref('all');
const searchQuery = ref('');
const drawerOpen = ref(false);
const drawerMode = ref('filters');
const transitionOpen = ref(false);
const activityOpen = ref(false);
const transitionAcknowledged = ref(false);

const transitionDraft = reactive({
	stage: 'proposal',
	probability: 65,
	forecast: 'best_case',
	nextStep: '',
	closePlan: '',
});

const activityDraft = reactive({
	type: 'meeting',
	title: '',
	outcome: '',
	nextStep: '',
	acknowledged: false,
});

const ownerOptions = computed(() => [
	{ value: 'all', label: 'All owners', description: 'Every account executive.' },
	...catalogs.value.owners,
]);
const regionOptions = computed(() => [
	{ value: 'all', label: 'All regions', description: 'Every active territory.' },
	...catalogs.value.regions,
]);
const filteredDeals = computed(() => {
	const query = searchQuery.value.trim().toLowerCase();
	return deals.value.filter((deal) => {
		const ownerMatches = ownerFilter.value === 'all' || deal.ownerId === ownerFilter.value;
		const regionMatches = regionFilter.value === 'all' || deal.regionId === regionFilter.value;
		const attentionMatches = attentionMode.value === 'all'
			|| (attentionMode.value === 'attention' && (['overdue', 'missing'].includes(deal.activityState) || deal.stageHealth === 'stale'))
			|| (attentionMode.value === 'today' && deal.activityState === 'today');
		const queryMatches = !query || `${deal.account} ${deal.description} ${deal.owner.label} ${deal.nextStep}`.toLowerCase().includes(query);
		return ownerMatches && regionMatches && attentionMatches && queryMatches;
	});
});
const boardStages = computed(() => stages.value.map((stage) => {
	const stageDeals = filteredDeals.value.filter((deal) => deal.stage === stage.value);
	return {
		...stage,
		deals: stageDeals,
		pipelineValue: stageDeals.reduce((sum, deal) => sum + deal.value, 0),
		weightedValue: stageDeals.reduce((sum, deal) => sum + deal.weightedValue, 0),
		attentionCount: stageDeals.filter((deal) => ['overdue', 'missing'].includes(deal.activityState) || deal.stageHealth === 'stale').length,
	};
}));
const mobileStageOptions = computed(() => boardStages.value.map((stage) => ({
	value: stage.value,
	label: `${stage.label} · ${stage.deals.length}`,
	description: `${money(stage.pipelineValue)} pipeline · ${stage.attentionCount} need attention`,
})));
const activeMobileStage = computed(() => boardStages.value.find((stage) => stage.value === mobileStage.value) || boardStages.value[0]);
const mobileNavigation = computed(() => [
	{ value: 'board', label: 'Pipeline', badge: String(filteredDeals.value.length) },
	{ value: 'deal', label: 'Deal', badge: selectedDeal.value?.owner?.initials || '' },
	{ value: 'forecast', label: 'Forecast', badge: String(workspace.value?.metrics?.attention || '') },
]);
const filteredMetrics = computed(() => {
	const pipeline = filteredDeals.value.reduce((sum, deal) => sum + deal.value, 0);
	const weighted = filteredDeals.value.reduce((sum, deal) => sum + deal.weightedValue, 0);
	const commit = filteredDeals.value.filter((deal) => deal.forecast === 'commit').reduce((sum, deal) => sum + deal.value, 0);
	const attention = filteredDeals.value.filter((deal) => ['overdue', 'missing'].includes(deal.activityState) || deal.stageHealth === 'stale').length;
	return { pipeline, weighted, commit, attention };
});
const forecastEvidence = computed(() => ({
	provider: workspace.value?.forecastProvider,
	metrics: workspace.value?.metrics,
	filters: {
		owner: ownerFilter.value,
		region: regionFilter.value,
		attention: attentionMode.value,
	},
}));

onMounted(loadWorkspace);

/**
 * Loads the authoritative revenue workspace.
 *
 * @param {boolean} clearMessages Whether visible feedback should be cleared.
 * @returns {Promise<void>}
 */
async function loadWorkspace(clearMessages = true) {
	if (clearMessages) clearFeedback();
	loading.value = true;
	try {
		const response = await fetch(`${apiBase}/bootstrap`);
		const data = await readJsonResponse(response);
		if (!response.ok) throw createRequestError(data, response.status);
		setWorkspace(data);
	} catch (requestError) {
		error.value = requestError.message || 'Unable to load the revenue workspace.';
	} finally {
		loading.value = false;
	}
}

/**
 * Sends one JSON mutation and applies the authoritative response.
 *
 * @param {string} path API path below the sales-pipeline root.
 * @param {Record<string, unknown>} body JSON request body.
 * @param {string} action Stable busy-state key.
 * @returns {Promise<Record<string, any>|null>} Updated payload or null after failure.
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
		const data = await readJsonResponse(response);
		if (!response.ok) throw createRequestError(data, response.status);
		setWorkspace(data);
		return data;
	} catch (requestError) {
		error.value = requestError.message || 'Revenue operation failed.';
		fieldErrors.value = requestError.fields || {};
		if (requestError.status === 409) await loadWorkspace(false);
		return null;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Reads a JSON response and reports an actionable server error.
 *
 * @param {Response} response Fetch response.
 * @returns {Promise<Record<string, any>>} Parsed JSON payload.
 */
async function readJsonResponse(response) {
	const contentType = response.headers.get('content-type') || '';
	if (!contentType.includes('application/json')) throw new Error(`The sales-pipeline API returned ${response.status} without JSON.`);
	return response.json();
}

/**
 * Replaces client state with one authoritative API response.
 *
 * @param {Record<string, any>} data Sales-pipeline response.
 * @returns {void}
 */
function setWorkspace(data) {
	workspace.value = data.workspace;
	catalogs.value = data.catalogs || { stages: [], owners: [], regions: [], forecasts: [], activityTypes: [] };
	stages.value = data.stages || [];
	deals.value = data.deals || [];
	selectedDeal.value = data.selectedDeal || null;
	transitionPreview.value = data.transitionPreview || null;
	activity.value = data.activity || [];
	if (data.selectedDeal) mobileStage.value = data.selectedDeal.stage;
	if (data.transitionPreview) {
		transitionDraft.stage = data.transitionPreview.draft.stage;
		transitionDraft.probability = data.transitionPreview.draft.probability;
		transitionDraft.forecast = data.transitionPreview.draft.forecast;
		transitionDraft.nextStep = data.transitionPreview.draft.nextStep;
		transitionDraft.closePlan = data.transitionPreview.draft.closePlan;
		transitionOpen.value = true;
	} else {
		transitionAcknowledged.value = false;
	}
}

/**
 * Selects a deal and opens the appropriate detail surface.
 *
 * @param {string} dealId Stable deal identifier.
 * @returns {Promise<void>}
 */
async function selectDeal(dealId) {
	if (!workspace.value || busyAction.value) return;
	if (dealId !== selectedDeal.value?.id) {
		const data = await mutateWorkspace('/select', {
			revision: workspace.value.revision,
			dealId,
		}, 'select-deal');
		if (!data) return;
	}
	openSelectedDeal();
}

/**
 * Opens the selected deal as a drawer on desktop or a focused mobile view.
 *
 * @returns {void}
 */
function openSelectedDeal() {
	activeView.value = 'deal';
	mobileStage.value = selectedDeal.value?.stage || mobileStage.value;
	if (isDesktop()) {
		drawerMode.value = 'deal';
		drawerOpen.value = true;
	}
}

/**
 * Opens the responsive pipeline filter surface.
 *
 * @returns {void}
 */
function openFilters() {
	drawerMode.value = 'filters';
	drawerOpen.value = true;
}

/**
 * Opens a populated exact-transition editor.
 *
 * @returns {void}
 */
function openTransition() {
	if (!selectedDeal.value) return;
	transitionPreview.value = null;
	transitionAcknowledged.value = false;
	fieldErrors.value = {};
	transitionDraft.stage = selectedDeal.value.stage;
	transitionDraft.probability = selectedDeal.value.probability;
	transitionDraft.forecast = selectedDeal.value.forecast;
	transitionDraft.nextStep = selectedDeal.value.nextStep;
	transitionDraft.closePlan = selectedDeal.value.closePlan;
	transitionOpen.value = true;
}

/**
 * Creates a server-owned exact transition preview.
 *
 * @returns {Promise<void>}
 */
async function reviewTransition() {
	if (!workspace.value || !selectedDeal.value) return;
	const data = await mutateWorkspace('/transitions/preview', {
		revision: workspace.value.revision,
		dealId: selectedDeal.value.id,
		dealVersion: selectedDeal.value.version,
		...transitionDraft,
	}, 'preview-transition');
	if (data) notice.value = `${data.transitionPreview.checksum} locked the exact forecast impact.`;
}

/**
 * Commits one acknowledged exact transition plan.
 *
 * @returns {Promise<void>}
 */
async function commitTransition() {
	if (!workspace.value || !transitionPreview.value) return;
	const data = await mutateWorkspace('/transitions/commit', {
		revision: workspace.value.revision,
		previewChecksum: transitionPreview.value.checksum,
		acknowledged: transitionAcknowledged.value,
	}, 'commit-transition');
	if (data) {
		transitionOpen.value = false;
		notice.value = `${data.transitionReceipt.providerReceipt} synchronized ${data.selectedDeal.account}.`;
	}
}

/**
 * Returns from exact review to editable transition fields.
 *
 * @returns {void}
 */
function editTransition() {
	transitionPreview.value = null;
	transitionAcknowledged.value = false;
	fieldErrors.value = {};
}

/**
 * Opens a populated sales-activity form.
 *
 * @returns {void}
 */
function openActivity() {
	if (!selectedDeal.value) return;
	fieldErrors.value = {};
	activityDraft.type = 'meeting';
	activityDraft.title = '';
	activityDraft.outcome = '';
	activityDraft.nextStep = selectedDeal.value.nextStep;
	activityDraft.acknowledged = false;
	activityOpen.value = true;
}

/**
 * Logs one acknowledged activity with a provider receipt.
 *
 * @returns {Promise<void>}
 */
async function logActivity() {
	if (!workspace.value || !selectedDeal.value) return;
	const data = await mutateWorkspace(`/deals/${selectedDeal.value.id}/activities`, {
		revision: workspace.value.revision,
		dealVersion: selectedDeal.value.version,
		...activityDraft,
	}, 'log-activity');
	if (data) {
		activityOpen.value = false;
		notice.value = `${data.activityReceipt.providerReceipt} retained the ${data.activityReceipt.type.toLowerCase()}.`;
	}
}

/**
 * Refreshes CRM and forecast provider evidence.
 *
 * @returns {Promise<void>}
 */
async function refreshForecast() {
	if (!workspace.value) return;
	const data = await mutateWorkspace('/forecast/refresh', {
		revision: workspace.value.revision,
	}, 'refresh-forecast');
	if (data) notice.value = `${data.workspace.forecastProvider.providerReceipt} reconciled ${data.workspace.metrics.openDeals} opportunities.`;
}

/**
 * Restores the deterministic revenue workspace and local filters.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	const data = await mutateWorkspace('/reset', {}, 'reset-workspace');
	if (data) {
		ownerFilter.value = 'all';
		regionFilter.value = 'all';
		attentionMode.value = 'all';
		searchQuery.value = '';
		activeView.value = 'board';
		drawerOpen.value = false;
		notice.value = 'Revenue workspace restored.';
	}
}

/**
 * Clears visible feedback and field errors.
 *
 * @returns {void}
 */
function clearFeedback() {
	error.value = '';
	notice.value = '';
	fieldErrors.value = {};
}

/**
 * Creates an Error carrying HTTP status and field messages.
 *
 * @param {Record<string, any>} data Error payload.
 * @param {number} status HTTP status.
 * @returns {Error & {status: number, fields?: Record<string, string[]>}} Request error.
 */
function createRequestError(data, status) {
	const fieldMessages = Object.values(data.fields || {}).flat().join(' ');
	const requestError = new Error([data.message, fieldMessages].filter(Boolean).join(' ') || `Request failed with status ${status}.`);
	requestError.status = status;
	requestError.fields = data.fields || {};
	return requestError;
}

/**
 * Formats an integer currency value for compact display.
 *
 * @param {number} value Currency value in dollars.
 * @returns {string} Compact currency label.
 */
function money(value) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		notation: Math.abs(value || 0) >= 100000 ? 'compact' : 'standard',
		maximumFractionDigits: Math.abs(value || 0) >= 100000 ? 1 : 0,
	}).format(value || 0);
}

/**
 * Formats an ISO date as a concise close date.
 *
 * @param {string} value ISO date.
 * @returns {string} Formatted date label.
 */
function formatDate(value) {
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

/**
 * Returns a compact activity status label for pipeline cards.
 *
 * @param {string} state Activity state.
 * @returns {string} Short status label.
 */
function activityLabel(state) {
	return { overdue: 'Overdue', today: 'Today', future: 'Scheduled', missing: 'No activity' }[state] || 'Unknown';
}

/**
 * Returns a semantic top-border class for one stage.
 *
 * @param {string} tone Semantic stage tone.
 * @returns {string} Tailwind border utility.
 */
function stageBorderClass(tone) {
	return {
		primary: 'border-t-primary',
		warning: 'border-t-warning',
		success: 'border-t-success',
		neutral: 'border-t-border',
	}[tone] || 'border-t-border';
}

/**
 * Reports whether the current browser is at the desktop application breakpoint.
 *
 * @returns {boolean} True at desktop widths.
 */
function isDesktop() {
	return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
}
</script>

<template>
	<DomAppShell variant="app" class="!h-dvh">
		<template #top>
			<DomAppTopBar
				title="Revenue desk"
				:subtitle="workspace ? `${workspace.period} · ${workspace.metrics.openDeals} open opportunities` : 'Sales operations'"
			>
				<template #leading><DomBadge tone="primary" variant="soft">RD</DomBadge></template>
				<template #trailing>
					<DomBadge v-if="workspace" tone="neutral" variant="soft" class="!hidden sm:!inline-flex">r{{ workspace.revision }}</DomBadge>
					<DomIconButton :icon="filterIcon" label="Open pipeline filters" size="sm" class="lg:!hidden" @click="openFilters" />
					<DomIconButton :icon="refreshIcon" label="Refresh CRM forecast" size="sm" :loading="busyAction === 'refresh-forecast'" @click="refreshForecast" />
					<DomButton class="!hidden lg:!inline-flex" size="sm" variant="secondary" :loading="busyAction === 'reset-workspace'" @click="resetWorkspace">Reset</DomButton>
				</template>
			</DomAppTopBar>
		</template>

		<div class="relative h-full min-h-0 overflow-hidden">
			<div v-if="error || notice" class="absolute inset-x-3 top-3 z-50 mx-auto max-w-2xl">
				<DomAlert v-if="error" tone="danger" variant="toast" title="Revenue operation failed" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-else tone="success" variant="toast" title="Revenue workspace updated" :description="notice" dismissible @dismiss="notice = ''" />
			</div>

			<div v-if="loading" class="grid h-full grid-cols-1 lg:grid-cols-5">
				<div v-for="column in 5" :key="column" class="space-y-3 border-r border-border p-3 last:border-r-0"><DomSkeleton height="h-10" /><DomSkeleton v-for="row in 5" :key="row" height="h-24" /></div>
			</div>

			<DomEmptyState v-else-if="!workspace || !selectedDeal" title="Revenue workspace unavailable" description="Reload the repository-local API to restore the sales pipeline.">
				<DomButton @click="loadWorkspace">Reload workspace</DomButton>
			</DomEmptyState>

			<section v-else class="flex h-full min-h-0 flex-col bg-canvas">
				<header class="shrink-0 border-b border-border bg-muted/10">
					<div class="grid grid-cols-4 divide-x divide-border border-b border-border px-2 py-2 sm:px-4">
						<div class="px-2 sm:px-3"><p class="text-[10px] uppercase tracking-[0.12em] text-muted-fg">Pipeline</p><p class="mt-1 text-sm font-semibold sm:text-base">{{ money(filteredMetrics.pipeline) }}</p></div>
						<div class="px-2 sm:px-3"><p class="text-[10px] uppercase tracking-[0.12em] text-muted-fg">Weighted</p><p class="mt-1 text-sm font-semibold sm:text-base">{{ money(filteredMetrics.weighted) }}</p></div>
						<div class="px-2 sm:px-3"><p class="text-[10px] uppercase tracking-[0.12em] text-muted-fg">Commit</p><p class="mt-1 text-sm font-semibold sm:text-base">{{ money(filteredMetrics.commit) }}</p></div>
						<div class="px-2 sm:px-3"><p class="text-[10px] uppercase tracking-[0.12em] text-muted-fg">Attention</p><p class="mt-1 text-sm font-semibold text-warning sm:text-base">{{ filteredMetrics.attention }}</p></div>
					</div>

					<div class="hidden grid-cols-[minmax(15rem,1.4fr)_minmax(11rem,1fr)_minmax(11rem,1fr)_auto] items-end gap-3 p-3 lg:grid">
						<DomTextInput v-model="searchQuery" label="Find deal" placeholder="Account, owner, or next step" />
						<DomSelect v-model="ownerFilter" label="Owner" :options="ownerOptions" searchable />
						<DomSelect v-model="regionFilter" label="Region" :options="regionOptions" searchable />
						<DomToggleButtonGroup v-model="attentionMode" label="Work queue" :options="attentionModes" size="sm" />
					</div>
				</header>

				<div
					class="min-h-0 flex-1"
					:class="activeView === 'board' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'"
				>
					<div class="hidden min-h-0 flex-1 grid-cols-5 divide-x divide-border lg:grid">
						<section v-for="stage in boardStages" :key="stage.value" class="flex min-w-0 flex-col border-t-2" :class="stageBorderClass(stage.tone)">
							<header class="shrink-0 border-b border-border px-3 py-3">
								<div class="flex items-start justify-between gap-2"><div class="min-w-0"><h2 class="truncate text-sm font-semibold">{{ stage.label }}</h2><p class="mt-1 truncate text-[11px] text-muted-fg">{{ money(stage.pipelineValue) }} · {{ money(stage.weightedValue) }} weighted</p></div><DomBadge :tone="stage.attentionCount ? 'warning' : 'neutral'" variant="soft">{{ stage.deals.length }}</DomBadge></div>
							</header>
							<div class="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
								<DomButton
									v-for="deal in stage.deals"
									:key="deal.id"
									variant="ghost"
									class="!h-auto w-full !justify-start !rounded-md !border !border-border/70 !p-3 !text-left hover:!bg-secondary/70"
									:class="deal.id === selectedDeal.id && '!border-primary/60 !bg-primary/5 !ring-1 !ring-primary/20'"
									:aria-pressed="deal.id === selectedDeal.id"
									@click="selectDeal(deal.id)"
								>
									<div class="w-full min-w-0">
										<div class="flex items-start justify-between gap-2"><div class="min-w-0"><p class="truncate text-sm font-semibold">{{ deal.account }}</p><p class="mt-1 truncate text-[11px] text-muted-fg">{{ deal.nextStep }}</p></div><DomBadge tone="neutral" variant="soft">{{ deal.owner.initials }}</DomBadge></div>
										<div class="mt-3 flex items-end justify-between gap-2"><div><p class="text-base font-semibold">{{ money(deal.value) }}</p><p class="mt-0.5 text-[10px] text-muted-fg">Close {{ formatDate(deal.closeDate) }}</p></div><DomStatusPill :tone="deal.activityMeta.tone" :label="activityLabel(deal.activityState)" size="sm" /></div>
										<DomProgress class="mt-3" :value="deal.probability" size="sm" />
										<div class="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-fg"><span>{{ deal.forecastMeta.label }}</span><span :class="deal.stageHealth === 'stale' && 'text-warning'">{{ deal.daysInStage }}d in stage</span></div>
									</div>
								</DomButton>
								<DomEmptyState v-if="!stage.deals.length" compact title="No matching deals" description="Change the filters or open another queue." />
							</div>
						</section>
					</div>

					<div class="flex h-full min-h-0 flex-col lg:hidden">
						<div class="shrink-0 border-b border-border p-3"><DomSelect v-model="mobileStage" label="Pipeline stage" :options="mobileStageOptions" /></div>
						<div class="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
							<DomButton
								v-for="deal in activeMobileStage.deals"
								:key="deal.id"
								variant="ghost"
								class="!h-auto w-full !justify-start !rounded-md !border !border-border !p-4 !text-left"
								:aria-pressed="deal.id === selectedDeal.id"
								@click="selectDeal(deal.id)"
							>
								<div class="w-full min-w-0"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="truncate font-semibold">{{ deal.account }}</p><p class="mt-1 truncate text-xs text-muted-fg">{{ deal.nextStep }}</p></div><DomStatusPill :tone="deal.activityMeta.tone" :label="activityLabel(deal.activityState)" size="sm" /></div><div class="mt-4 flex items-end justify-between gap-3"><div><p class="text-lg font-semibold">{{ money(deal.value) }}</p><p class="mt-1 text-xs text-muted-fg">{{ deal.owner.label }} · close {{ formatDate(deal.closeDate) }}</p></div><DomBadge :tone="deal.forecastMeta.tone" variant="soft">{{ deal.forecastMeta.label }}</DomBadge></div><DomProgress class="mt-3" :value="deal.probability" size="sm" /></div>
							</DomButton>
							<DomEmptyState v-if="!activeMobileStage.deals.length" compact title="No matching deals" description="Change the filters or choose another stage." />
						</div>
					</div>
				</div>

				<div v-if="activeView === 'deal'" class="h-full min-h-0 lg:hidden">
					<DealWorkspace :deal="selectedDeal" :activity="activity" :forecast-provider="workspace.forecastProvider" @review-transition="openTransition" @log-activity="openActivity" />
				</div>

				<div v-if="activeView === 'forecast'" class="h-full min-h-0 overflow-y-auto p-4 lg:hidden">
					<div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Forecast evidence</p><h2 class="mt-1 text-xl font-semibold">{{ workspace.period }}</h2></div><DomStatusPill tone="success" label="Synchronized" size="sm" /></div>
					<div class="mt-5 divide-y divide-border border-y border-border"><div v-for="stage in stages" :key="stage.value" class="py-4"><div class="flex items-center justify-between gap-3"><div><p class="text-sm font-semibold">{{ stage.label }}</p><p class="mt-1 text-xs text-muted-fg">{{ stage.count }} deals · {{ money(stage.weightedValue) }} weighted</p></div><DomBadge :tone="stage.attentionCount ? 'warning' : 'neutral'" variant="soft">{{ stage.attentionCount }} attention</DomBadge></div><DomProgress class="mt-3" :value="workspace.metrics.pipeline ? stage.pipelineValue / workspace.metrics.pipeline * 100 : 0" size="sm" /></div></div>
					<div class="mt-5"><DomJsonViewer :value="forecastEvidence" title="Forecast provider evidence" filename="forecast-evidence.json" density="compact" :preview-lines="18" /></div>
				</div>
			</section>
		</div>

		<template #bottom><DomAppBottomNav v-model="activeView" :items="mobileNavigation" class="lg:hidden" /></template>

		<template #overlay>
			<DomDrawer
				v-model="drawerOpen"
				:title="drawerMode === 'deal' ? selectedDeal?.account || 'Deal workspace' : 'Pipeline filters'"
				:side="drawerMode === 'deal' ? 'right' : 'left'"
				:width="drawerMode === 'deal' ? 'min(96vw, 28rem)' : 'min(92vw, 24rem)'"
				:static="true"
				class="pointer-events-auto"
				:class="drawerMode === 'filters' && 'lg:hidden'"
			>
				<div v-if="drawerMode === 'filters'" class="grid gap-4 p-1"><DomTextInput v-model="searchQuery" label="Find deal" placeholder="Account, owner, or next step" /><DomSelect v-model="ownerFilter" label="Owner" :options="ownerOptions" searchable /><DomSelect v-model="regionFilter" label="Region" :options="regionOptions" searchable /><DomToggleButtonGroup v-model="attentionMode" label="Work queue" :options="attentionModes" size="sm" /><DomButton variant="ghost" :loading="busyAction === 'reset-workspace'" @click="resetWorkspace">Reset demo</DomButton></div>
				<DealWorkspace v-else-if="selectedDeal" :deal="selectedDeal" :activity="activity" :forecast-provider="workspace?.forecastProvider" @review-transition="openTransition" @log-activity="openActivity" />
			</DomDrawer>

			<DomDialog v-model="transitionOpen" class="pointer-events-auto" width="min(42rem, 94vw)" title="Review deal transition" :description="`Prepare an exact, auditable CRM update for ${selectedDeal?.account || 'the selected deal'}.`">
				<div v-if="selectedDeal && !transitionPreview" class="grid gap-4">
					<div class="flex items-start justify-between gap-3 border-y border-border py-3"><div><p class="font-semibold">{{ selectedDeal.account }}</p><p class="mt-1 text-xs text-muted-fg">{{ selectedDeal.stageMeta.label }} · v{{ selectedDeal.version }} · {{ money(selectedDeal.value) }}</p></div><DomStatusPill :tone="selectedDeal.forecastMeta.tone" :label="selectedDeal.forecastMeta.label" size="sm" /></div>
					<div class="grid gap-4 sm:grid-cols-2"><DomSelect v-model="transitionDraft.stage" label="Target stage" :options="selectedDeal.stageTargetOptions" :errors="fieldErrors.stage || []" /><DomSelect v-model="transitionDraft.forecast" label="Forecast category" :options="catalogs.forecasts" :errors="fieldErrors.forecast || []" /></div>
					<DomRangeInput v-model="transitionDraft.probability" label="Seller probability" description="The server retains both seller probability and stage defaults." :min="0" :max="100" :step="5" suffix="%" :errors="fieldErrors.probability || []" />
					<DomTextInput v-model="transitionDraft.nextStep" label="Next step" :errors="fieldErrors.nextStep || []" />
					<DomTextareaInput v-model="transitionDraft.closePlan" label="Close plan" description="Retain the buyer, seller, and approval milestones used by the forecast." :rows="5" :errors="fieldErrors.closePlan || []" />
				</div>

				<div v-else-if="transitionPreview" class="grid gap-4">
					<DomAlert v-if="transitionPreview.candidate.checks.some((check) => check.status === 'failed')" tone="danger" variant="soft" title="Transition is blocked" description="Resolve the failed policy checks before this CRM update can be committed." />
					<div class="grid grid-cols-3 divide-x divide-border border-y border-border text-sm"><div class="py-3 pr-3"><p class="text-xs text-muted-fg">Target stage</p><p class="mt-1 font-semibold">{{ transitionPreview.targetStage.label }}</p></div><div class="px-3 py-3"><p class="text-xs text-muted-fg">Weighted forecast</p><p class="mt-1 font-semibold">{{ money(transitionPreview.candidate.projectedWeighted) }}</p></div><div class="py-3 pl-3"><p class="text-xs text-muted-fg">Impact</p><p class="mt-1 font-semibold" :class="transitionPreview.candidate.forecastDelta >= 0 ? 'text-success' : 'text-warning'">{{ transitionPreview.candidate.forecastDelta >= 0 ? '+' : '' }}{{ money(transitionPreview.candidate.forecastDelta) }}</p></div></div>
					<div class="divide-y divide-border border-y border-border"><div v-for="check in transitionPreview.candidate.checks" :key="check.key" class="flex gap-3 py-3"><DomStatusPill :tone="check.status === 'passed' ? 'success' : 'danger'" :label="check.status" size="sm" /><div><p class="text-sm font-semibold">{{ check.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div></div></div>
					<p class="truncate font-mono text-[10px] text-muted-fg">{{ transitionPreview.checksum }}</p>
					<DomCheckbox v-model="transitionAcknowledged" label="Save this exact stage and forecast update" description="The before state, checks, forecast impact, actor, and CRM receipt will be retained." :errors="fieldErrors.acknowledged || []" />
				</div>

				<template #footer>
					<DomButton v-if="transitionPreview" variant="secondary" @click="editTransition">Edit details</DomButton>
					<DomButton v-else variant="secondary" data-close>Cancel</DomButton>
					<DomButton v-if="transitionPreview" :disabled="!transitionAcknowledged || transitionPreview.candidate.checks.some((check) => check.status !== 'passed')" :loading="busyAction === 'commit-transition'" @click="commitTransition">Save to CRM</DomButton>
					<DomButton v-else :loading="busyAction === 'preview-transition'" @click="reviewTransition">Review exact transition</DomButton>
				</template>
			</DomDialog>

			<DomDialog v-model="activityOpen" class="pointer-events-auto" width="min(38rem, 94vw)" title="Log sales activity" :description="`Retain one material touchpoint for ${selectedDeal?.account || 'the selected deal'}.`">
				<div class="grid gap-4"><DomSelect v-model="activityDraft.type" label="Activity type" :options="catalogs.activityTypes" :errors="fieldErrors.type || []" /><DomTextInput v-model="activityDraft.title" label="Summary" placeholder="Legal intake completed" :errors="fieldErrors.title || []" /><DomTextareaInput v-model="activityDraft.outcome" label="Outcome" placeholder="What changed, and what did the buyer confirm?" :rows="4" :errors="fieldErrors.outcome || []" /><DomTextInput v-model="activityDraft.nextStep" label="Next step" :errors="fieldErrors.nextStep || []" /><DomCheckbox v-model="activityDraft.acknowledged" label="I reviewed this activity record" description="The type, outcome, next step, actor, deal version, and provider receipt will be retained." :errors="fieldErrors.acknowledged || []" /></div>
				<template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :disabled="!activityDraft.acknowledged" :loading="busyAction === 'log-activity'" @click="logActivity">Retain activity</DomButton></template>
			</DomDialog>
		</template>
	</DomAppShell>
</template>
