<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
	DomAlert,
	DomAppBottomNav,
	DomAppListItem,
	DomAppShell,
	DomAppTopBar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomEmptyState,
	DomIconButton,
	DomJsonViewer,
	DomProgress,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextInput,
	DomToggleButtonGroup,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/field-dispatch';
const refreshIcon = 'M20 12a8 8 0 1 1-2.34-5.66M20 4v6h-6';
const dispatchTabs = [
	{ key: 'dispatch', label: 'Dispatch' },
	{ key: 'route', label: 'Route' },
	{ key: 'activity', label: 'Activity' },
	{ key: 'evidence', label: 'Evidence' },
];
const queueModes = [
	{ label: 'Attention', value: 'attention' },
	{ label: 'Unassigned', value: 'unassigned' },
	{ label: 'All', value: 'all' },
];

const workspace = ref(null);
const catalogs = ref({ regions: [], skills: [], channels: [], routes: [] });
const routes = ref([]);
const stops = ref([]);
const selectedRoute = ref(null);
const selectedStop = ref(null);
const assignmentPreview = ref(null);
const activity = ref([]);
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const fieldErrors = ref({});
const activeView = ref('map');
const queueMode = ref('attention');
const regionFilter = ref('central');
const searchQuery = ref('');
const detailTab = ref('dispatch');
const selectedCandidateRouteId = ref('route-maya');
const reviewOpen = ref(false);
const assignmentAcknowledged = ref(false);
const messageDialogOpen = ref(false);
const messageDialog = ref(null);

const messageDraft = reactive({
	channel: 'driver_app',
	message: '',
	acknowledged: false,
});

const regionOptions = computed(() => [
	{ value: 'all', label: 'All territories', description: 'Every active route and stop.' },
	...catalogs.value.regions,
]);
const visibleRoutes = computed(() => routes.value.filter((route) => regionFilter.value === 'all' || route.territories.includes(regionFilter.value)));
const visibleMapStops = computed(() => stops.value.filter((stop) => regionFilter.value === 'all' || stop.regionId === regionFilter.value));
const queueStops = computed(() => {
	const query = searchQuery.value.trim().toLowerCase();
	return visibleMapStops.value.filter((stop) => {
		const modeMatches = queueMode.value === 'all'
			|| (queueMode.value === 'unassigned' && stop.status === 'unassigned')
			|| (queueMode.value === 'attention' && ['unassigned', 'at_risk', 'late'].includes(stop.status));
		const queryMatches = !query || `${stop.customer} ${stop.address} ${stop.routeName}`.toLowerCase().includes(query);
		return modeMatches && queryMatches;
	});
});
const candidateOptions = computed(() => (selectedStop.value?.candidates || []).map((candidate) => ({
	value: candidate.routeId,
	label: candidate.recommended ? `${candidate.name} · recommended` : candidate.name,
	description: `${candidate.arrivalLabel} arrival · ${candidate.projectedLoadPercent}% load · ${candidate.checks.filter((check) => check.status === 'failed').length || 'no'} conflicts`,
})));
const selectedCandidate = computed(() => selectedStop.value?.candidates?.find((candidate) => candidate.routeId === selectedCandidateRouteId.value) || selectedStop.value?.candidates?.[0] || null);
const routeStops = computed(() => stops.value.filter((stop) => stop.routeId === selectedRoute.value?.id).sort((left, right) => (left.etaMinutes || 9999) - (right.etaMinutes || 9999)));
const providerEvidence = computed(() => ({
	map: workspace.value?.map,
	route: selectedRoute.value?.providerEvidence,
	stop: selectedStop.value?.evidence,
	assignmentPreview: assignmentPreview.value,
}));
const mobileNavigation = computed(() => [
	{ value: 'queue', label: 'Queue', badge: String(workspace.value?.counts?.attention || '') },
	{ value: 'map', label: 'Map', badge: String(workspace.value?.counts?.activeRoutes || '') },
	{ value: 'dispatch', label: 'Dispatch', badge: assignmentPreview.value ? '1' : '' },
]);

onMounted(loadWorkspace);

/**
 * Loads the authoritative field-dispatch workspace.
 *
 * @param {boolean} clearMessages Whether visible feedback should be cleared.
 * @returns {Promise<void>}
 */
async function loadWorkspace(clearMessages = true) {
	if (clearMessages) clearFeedback();
	loading.value = true;
	try {
		const response = await fetch(`${apiBase}/bootstrap`);
		const data = await response.json();
		if (!response.ok) throw createRequestError(data, response.status);
		setWorkspace(data);
	} catch (requestError) {
		error.value = requestError.message || 'Unable to load the field-dispatch workspace.';
	} finally {
		loading.value = false;
	}
}

/**
 * Sends one JSON mutation and applies the authoritative response.
 *
 * @param {string} path API path below the field-dispatch base URL.
 * @param {Record<string, unknown>} body JSON request body.
 * @param {string} action Stable busy-state key.
 * @returns {Promise<Record<string, unknown>|null>} Updated payload or null after failure.
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
		if (!response.ok) throw createRequestError(data, response.status);
		setWorkspace(data);
		return data;
	} catch (requestError) {
		error.value = requestError.message || 'Dispatch operation failed.';
		fieldErrors.value = requestError.fields || {};
		if (requestError.status === 409) await loadWorkspace(false);
		return null;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Replaces client state with one authoritative API response.
 *
 * @param {Record<string, unknown>} data Dispatch workspace payload.
 * @returns {void}
 */
function setWorkspace(data) {
	workspace.value = data.workspace;
	catalogs.value = data.catalogs || { regions: [], skills: [], channels: [], routes: [] };
	routes.value = data.routes || [];
	stops.value = data.stops || [];
	selectedRoute.value = data.selectedRoute || null;
	selectedStop.value = data.selectedStop || null;
	assignmentPreview.value = data.assignmentPreview || null;
	activity.value = data.activity || [];
	if (data.assignmentPreview) {
		selectedCandidateRouteId.value = data.assignmentPreview.routeId;
		reviewOpen.value = true;
	} else {
		assignmentAcknowledged.value = false;
		reviewOpen.value = false;
		selectedCandidateRouteId.value = data.selectedStop?.candidates?.find((candidate) => candidate.recommended)?.routeId
			|| data.selectedRoute?.id
			|| data.selectedStop?.candidates?.[0]?.routeId
			|| '';
	}
}

/**
 * Selects one stop from the queue or map.
 *
 * @param {string} stopId Stable stop identifier.
 * @returns {Promise<void>}
 */
async function selectStop(stopId) {
	if (!workspace.value || stopId === selectedStop.value?.id || busyAction.value) {
		activeView.value = 'dispatch';
		return;
	}
	const data = await mutateWorkspace('/select/stop', {
		revision: workspace.value.revision,
		stopId,
	}, 'select-stop');
	if (data) {
		activeView.value = 'dispatch';
		detailTab.value = 'dispatch';
		notice.value = `${data.selectedStop.customer} opened at version ${data.selectedStop.version}.`;
	}
}

/**
 * Selects one technician route from the live map.
 *
 * @param {string} routeId Stable route identifier.
 * @returns {Promise<void>}
 */
async function selectRoute(routeId) {
	if (!workspace.value || routeId === selectedRoute.value?.id || busyAction.value) return;
	const data = await mutateWorkspace('/select/route', {
		revision: workspace.value.revision,
		routeId,
	}, 'select-route');
	if (data) {
		selectedCandidateRouteId.value = routeId;
		detailTab.value = 'route';
		notice.value = `${data.selectedRoute.name}'s live route opened.`;
	}
}

/**
 * Creates an exact server-owned assignment plan.
 *
 * @returns {Promise<void>}
 */
async function reviewAssignment() {
	if (!workspace.value || !selectedStop.value || !selectedCandidate.value) return;
	const route = routes.value.find((item) => item.id === selectedCandidateRouteId.value);
	if (!route) return;
	const data = await mutateWorkspace('/assignments/preview', {
		revision: workspace.value.revision,
		stopId: selectedStop.value.id,
		stopVersion: selectedStop.value.version,
		routeId: route.id,
		routeVersion: route.version,
	}, 'preview-assignment');
	if (data) {
		reviewOpen.value = true;
		activeView.value = 'dispatch';
		notice.value = `${data.assignmentPreview.checksum} locked the exact route plan.`;
	}
}

/**
 * Commits one acknowledged exact assignment plan.
 *
 * @returns {Promise<void>}
 */
async function commitAssignment() {
	if (!workspace.value || !assignmentPreview.value) return;
	const data = await mutateWorkspace('/assignments/commit', {
		revision: workspace.value.revision,
		previewChecksum: assignmentPreview.value.checksum,
		acknowledged: assignmentAcknowledged.value,
	}, 'commit-assignment');
	if (data) {
		detailTab.value = 'dispatch';
		notice.value = `${data.assignmentReceipt.providerReceipt} dispatched ${data.selectedStop.customer}.`;
	}
}

/**
 * Refreshes server-owned GPS and ETA evidence.
 *
 * @returns {Promise<void>}
 */
async function refreshLiveRoutes() {
	if (!workspace.value) return;
	const data = await mutateWorkspace('/live/refresh', {
		revision: workspace.value.revision,
	}, 'refresh-live');
	if (data) notice.value = `${data.workspace.map.providerReceipt} reconciled ${data.workspace.counts.activeRoutes} routes.`;
}

/**
 * Opens the route-update dialog with a route-specific message.
 *
 * @returns {void}
 */
function openRouteUpdate() {
	fieldErrors.value = {};
	messageDraft.channel = 'driver_app';
	messageDraft.message = selectedStop.value?.routeId === selectedRoute.value?.id
		? `${selectedStop.value.customer} is now on your route for ${selectedStop.value.eta}. Use the confirmed loading entrance and acknowledge in the driver app.`
		: `Dispatch reviewed your route. Continue to ${selectedRoute.value?.nextStop} for the ${selectedRoute.value?.nextEta} arrival.`;
	messageDraft.acknowledged = false;
	messageDialogOpen.value = true;
	messageDialog.value?.open();
}

/**
 * Sends one acknowledged route update through the selected provider channel.
 *
 * @returns {Promise<void>}
 */
async function sendRouteUpdate() {
	if (!workspace.value || !selectedRoute.value) return;
	const data = await mutateWorkspace(`/routes/${selectedRoute.value.id}/notify`, {
		revision: workspace.value.revision,
		routeVersion: selectedRoute.value.version,
		...messageDraft,
	}, 'send-route-update');
	if (data) {
		messageDialogOpen.value = false;
		notice.value = `${data.routeUpdateReceipt.providerReceipt} delivered to ${data.selectedRoute.name}.`;
	}
}

/**
 * Restores the deterministic dispatch workspace and initial filters.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	const data = await mutateWorkspace('/reset', {}, 'reset-workspace');
	if (data) {
		regionFilter.value = 'central';
		queueMode.value = 'attention';
		searchQuery.value = '';
		activeView.value = 'map';
		detailTab.value = 'dispatch';
		notice.value = 'Field dispatch workspace restored.';
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
 * @param {Record<string, unknown>} data Error payload.
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
 * Formats an ISO timestamp for the activity view.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Localized date and time.
 */
function formatTime(value) {
	if (!value) return 'Pending';
	return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
</script>

<template>
	<DomAppShell variant="app" class="!h-dvh">
		<template #top>
			<DomAppTopBar
				title="Dispatch desk"
				:subtitle="workspace ? `${workspace.dateLabel} · ${workspace.counts.activeRoutes} active routes` : 'Field operations'"
			>
				<template #leading>
					<DomBadge tone="primary" variant="soft">FD</DomBadge>
				</template>
				<template #trailing>
					<DomBadge v-if="workspace" tone="neutral" variant="soft" class="!hidden sm:!inline-flex">r{{ workspace.revision }}</DomBadge>
					<DomIconButton :icon="refreshIcon" label="Refresh live routes" size="sm" :loading="busyAction === 'refresh-live'" @click="refreshLiveRoutes" />
					<DomButton class="!hidden sm:!inline-flex" size="sm" variant="secondary" :loading="busyAction === 'reset-workspace'" @click="resetWorkspace">Reset</DomButton>
				</template>
			</DomAppTopBar>
		</template>

		<div class="relative h-full min-h-0 overflow-hidden">
			<div v-if="error || notice" class="absolute inset-x-3 top-3 z-50 mx-auto max-w-2xl">
				<DomAlert v-if="error" tone="danger" variant="toast" title="Dispatch operation failed" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-else tone="success" variant="toast" title="Dispatch workspace updated" :description="notice" dismissible @dismiss="notice = ''" />
			</div>

			<div v-if="loading" class="grid h-full lg:grid-cols-[18rem_minmax(0,1fr)_23rem]">
				<div v-for="column in 3" :key="column" class="space-y-3 border-r border-border p-4 last:border-r-0">
					<DomSkeleton height="h-8" width="w-2/3" />
					<DomSkeleton v-for="row in 6" :key="row" height="h-16" />
				</div>
			</div>

			<DomEmptyState v-else-if="!workspace || !selectedRoute || !selectedStop" title="Dispatch workspace unavailable" description="Reload the repository-local API to restore field operations.">
				<DomButton @click="loadWorkspace">Reload workspace</DomButton>
			</DomEmptyState>

			<div v-else class="grid h-full min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[18rem_minmax(0,1fr)_23rem]">
				<aside
					class="h-full min-h-0 overflow-y-auto border-r border-border bg-muted/10"
					:class="activeView === 'queue' ? 'block' : 'hidden lg:block'"
					aria-label="Dispatch attention queue"
				>
					<div class="border-b border-border p-4">
						<div class="flex items-start justify-between gap-3">
							<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Operations queue</p><h2 class="mt-1 text-lg font-semibold">Needs attention</h2></div>
							<DomBadge tone="warning" variant="soft">{{ workspace.counts.attention }}</DomBadge>
						</div>
						<div class="mt-4 grid gap-3">
							<DomSelect v-model="regionFilter" label="Territory" :options="regionOptions" searchable />
							<DomTextInput v-model="searchQuery" label="Find stop" placeholder="Customer or address" />
							<DomToggleButtonGroup v-model="queueMode" :options="queueModes" label="Queue view" size="sm" />
						</div>
					</div>

					<div v-if="queueStops.length" class="divide-y divide-border">
						<DomAppListItem
							v-for="stop in queueStops"
							:key="stop.id"
							:label="stop.customer"
							:description="`${stop.routeName} · ${stop.window} · ${stop.stateMeta.label}`"
							:selected="stop.id === selectedStop.id"
							@click="selectStop(stop.id)"
						>
							<template #icon><DomBadge :tone="stop.stateMeta.tone" variant="soft">{{ stop.number }}</DomBadge></template>
						</DomAppListItem>
					</div>
					<DomEmptyState v-else compact title="No matching stops" description="Change the territory, queue, or search filters." />
					<div class="p-3 sm:hidden"><DomButton class="w-full" variant="ghost" :loading="busyAction === 'reset-workspace'" @click="resetWorkspace">Reset demo</DomButton></div>
				</aside>

				<main
					class="flex h-full min-h-0 flex-col overflow-hidden bg-secondary"
					:class="activeView === 'map' ? 'flex' : 'hidden lg:flex'"
					aria-label="Live field service map"
				>
					<header class="shrink-0 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur sm:px-5">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div><p class="text-sm font-semibold">{{ regionOptions.find((option) => option.value === regionFilter)?.label || 'All territories' }}</p><p class="mt-1 text-xs text-muted-fg">{{ workspace.map.providerReceipt }} · {{ workspace.map.traffic }} traffic</p></div>
							<div class="flex items-center gap-2"><DomStatusPill tone="success" label="Live GPS" size="sm" /><DomBadge tone="neutral" variant="soft">{{ visibleRoutes.length }} routes</DomBadge></div>
						</div>
					</header>

					<section class="relative min-h-0 flex-1 overflow-hidden" aria-label="Interactive route map">
						<img :src="workspace.map.asset" alt="" aria-hidden="true" class="absolute inset-0 size-full object-cover" />
						<div class="pointer-events-none absolute inset-0 bg-black/10" aria-hidden="true"></div>

						<div class="absolute left-3 top-3 z-30 flex items-center gap-2 rounded-full border border-white/20 bg-black/65 p-1 text-white shadow-lg backdrop-blur">
							<DomIconButton :icon="refreshIcon" label="Refresh GPS positions" size="sm" :loading="busyAction === 'refresh-live'" class="!text-white hover:!bg-white/15" @click="refreshLiveRoutes" />
							<span class="pr-3 text-xs font-medium">Updated live</span>
						</div>

						<div class="absolute right-3 top-3 z-30 max-w-56 rounded-lg border border-white/20 bg-black/70 p-3 text-white shadow-lg backdrop-blur">
							<p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">Dispatch focus</p>
							<p class="mt-1 text-sm font-semibold">{{ selectedStop.customer }}</p>
							<p class="mt-1 text-xs leading-5 text-white/70">{{ selectedStop.stateMeta.label }} · {{ selectedStop.window }}</p>
						</div>

						<DomButton
							v-for="route in visibleRoutes"
							:key="route.id"
							size="sm"
							variant="secondary"
							class="absolute z-20 !size-10 !min-w-0 !p-0 shadow-xl ring-4 ring-black/20"
							:class="route.id === selectedRoute.id && '!ring-primary/70'"
							:style="{ left: `${route.x}%`, top: `${route.y}%`, transform: 'translate(-50%, -50%)' }"
							:aria-label="`Open ${route.name} route`"
							@click="selectRoute(route.id)"
						>{{ route.initials }}</DomButton>

						<DomButton
							v-for="stop in visibleMapStops"
							:key="stop.id"
							size="sm"
							:variant="stop.status === 'unassigned' ? 'primary' : 'secondary'"
							class="absolute z-10 !size-7 !min-w-0 !p-0 text-xs shadow-lg ring-2 ring-black/25"
							:class="stop.id === selectedStop.id && '!size-9 !ring-4 !ring-primary/70'"
							:style="{ left: `${stop.x}%`, top: `${stop.y}%`, transform: 'translate(-50%, -50%)' }"
							:aria-label="`Open stop ${stop.number}, ${stop.customer}`"
							@click="selectStop(stop.id)"
						>{{ stop.number }}</DomButton>

						<div class="absolute inset-x-3 bottom-3 z-30 rounded-xl border border-white/20 bg-black/75 p-3 text-white shadow-xl backdrop-blur sm:left-3 sm:right-auto sm:w-80">
							<div class="flex items-center justify-between gap-3"><div><p class="text-sm font-semibold">{{ selectedRoute.name }}</p><p class="mt-1 text-xs text-white/65">{{ selectedRoute.vehicle }} · {{ selectedRoute.nextStop }} at {{ selectedRoute.nextEta }}</p></div><DomStatusPill :tone="selectedRoute.stateMeta.tone" :label="selectedRoute.stateMeta.label" size="sm" /></div>
							<DomProgress class="mt-3" :value="selectedRoute.loadPercent" size="sm" />
						</div>
					</section>
				</main>

				<aside
					class="flex h-full min-h-0 flex-col overflow-hidden border-l border-border bg-canvas"
					:class="activeView === 'dispatch' ? 'flex' : 'hidden lg:flex'"
					aria-labelledby="dispatch-detail-heading"
				>
					<header class="shrink-0 border-b border-border p-4">
						<div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Stop {{ selectedStop.number }} · v{{ selectedStop.version }}</p><h2 id="dispatch-detail-heading" class="mt-1 truncate text-lg font-semibold">{{ selectedStop.customer }}</h2><p class="mt-1 truncate text-xs text-muted-fg">{{ selectedStop.address }}</p></div><DomStatusPill :tone="selectedStop.stateMeta.tone" :label="selectedStop.stateMeta.label" size="sm" /></div>
					</header>

					<DomTabs v-model="detailTab" :tabs="dispatchTabs" variant="page" fill class="min-h-0 flex-1">
						<template #dispatch>
							<div class="h-full min-h-0 overflow-y-auto p-4">
								<div class="grid grid-cols-2 divide-x divide-border border-y border-border text-sm">
									<div class="py-3 pr-3"><p class="text-xs text-muted-fg">Customer window</p><p class="mt-1 font-semibold">{{ selectedStop.window }}</p></div>
									<div class="py-3 pl-3"><p class="text-xs text-muted-fg">Current ETA</p><p class="mt-1 font-semibold">{{ selectedStop.eta }}</p></div>
								</div>
								<p class="mt-4 text-sm leading-6 text-muted-fg">{{ selectedStop.note }}</p>
								<div class="mt-3 flex flex-wrap gap-2"><DomBadge v-for="requirement in selectedStop.requirementsMeta" :key="requirement.value" tone="neutral" variant="soft">{{ requirement.label }}</DomBadge></div>

								<div v-if="selectedStop.canAssign && !reviewOpen" class="mt-5 border-t border-border pt-5">
									<div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Assignment engine</p><h3 class="mt-1 text-sm font-semibold">Choose a route</h3></div><DomBadge v-if="selectedCandidate?.recommended" tone="success" variant="soft">Best match</DomBadge></div>
									<DomSelect v-model="selectedCandidateRouteId" class="mt-4" label="Technician route" :options="candidateOptions" searchable @update:model-value="reviewOpen = false" />
									<div v-if="selectedCandidate" class="mt-4 divide-y divide-border border-y border-border">
										<div class="flex justify-between gap-3 py-3 text-sm"><span class="text-muted-fg">Projected arrival</span><span class="font-semibold">{{ selectedCandidate.arrivalLabel }}</span></div>
										<div class="flex justify-between gap-3 py-3 text-sm"><span class="text-muted-fg">Travel</span><span class="font-semibold">{{ selectedCandidate.travelMinutes }} min</span></div>
										<div class="flex justify-between gap-3 py-3 text-sm"><span class="text-muted-fg">Projected load</span><span class="font-semibold">{{ selectedCandidate.projectedLoadPercent }}%</span></div>
										<div class="flex justify-between gap-3 py-3 text-sm"><span class="text-muted-fg">Server checks</span><span class="font-semibold">{{ selectedCandidate.checks.filter((check) => check.status === 'passed').length }}/{{ selectedCandidate.checks.length }} passed</span></div>
									</div>
									<DomButton class="mt-4 w-full" :loading="busyAction === 'preview-assignment'" @click="reviewAssignment">Review exact assignment</DomButton>
								</div>

								<div v-else-if="selectedStop.canAssign && assignmentPreview" class="mt-5 border-t border-border pt-5">
									<div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Exact assignment</p><h3 class="mt-1 text-sm font-semibold">{{ assignmentPreview.stop.customer }} → {{ assignmentPreview.route.name }}</h3></div><DomBadge tone="primary" variant="soft">{{ assignmentPreview.candidate.arrivalLabel }}</DomBadge></div>
									<dl class="mt-4 divide-y divide-border border-y border-border text-sm"><div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Route version</dt><dd class="font-semibold">v{{ assignmentPreview.routeVersion }}</dd></div><div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Projected load</dt><dd class="font-semibold">{{ assignmentPreview.candidate.projectedLoadPercent }}%</dd></div><div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Checksum</dt><dd class="max-w-44 truncate font-mono text-xs">{{ assignmentPreview.checksum }}</dd></div></dl>
									<div class="mt-4 divide-y divide-border border-y border-border"><div v-for="check in assignmentPreview.candidate.checks" :key="check.key" class="flex gap-3 py-3"><DomStatusPill :tone="check.status === 'passed' ? 'success' : 'danger'" :label="check.status" size="sm" /><div><p class="text-xs font-semibold">{{ check.label }}</p><p class="mt-1 text-[11px] leading-5 text-muted-fg">{{ check.detail }}</p></div></div></div>
									<DomCheckbox v-model="assignmentAcknowledged" class="mt-4" label="Dispatch this exact stop and route" description="The customer window, provider evidence, route load, and operator will be retained." :errors="fieldErrors.acknowledged || []" />
									<DomButton class="mt-4 w-full" :disabled="!assignmentAcknowledged || assignmentPreview.candidate.checks.some((check) => check.status !== 'passed')" :loading="busyAction === 'commit-assignment'" @click="commitAssignment">Dispatch stop</DomButton>
									<DomButton class="mt-2 w-full" variant="ghost" @click="reviewOpen = false">Edit route choice</DomButton>
								</div>

								<div v-else class="mt-5 border-t border-border pt-5">
									<DomAlert tone="success" variant="soft" title="Stop is on a live route" :description="`${selectedStop.routeName} owns the ${selectedStop.eta} arrival. Provider receipt ${selectedStop.evidence.providerReceipt || 'pending'}.`" />
									<DomButton class="mt-4 w-full" @click="openRouteUpdate">Send route update</DomButton>
								</div>
							</div>
						</template>

						<template #route>
							<div class="h-full min-h-0 overflow-y-auto p-4">
								<div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Selected route · v{{ selectedRoute.version }}</p><h3 class="mt-1 text-lg font-semibold">{{ selectedRoute.name }}</h3><p class="mt-1 text-xs text-muted-fg">{{ selectedRoute.role }}</p></div><DomStatusPill :tone="selectedRoute.stateMeta.tone" :label="selectedRoute.stateMeta.label" size="sm" /></div>
								<div class="mt-4 divide-y divide-border border-y border-border text-sm"><div class="flex justify-between gap-3 py-3"><span class="text-muted-fg">Vehicle</span><span class="font-semibold">{{ selectedRoute.vehicle }}</span></div><div class="flex justify-between gap-3 py-3"><span class="text-muted-fg">Shift</span><span class="font-semibold">{{ selectedRoute.shift }}</span></div><div class="flex justify-between gap-3 py-3"><span class="text-muted-fg">Last GPS</span><span class="font-semibold">{{ selectedRoute.lastSeenLabel }}</span></div><div class="flex justify-between gap-3 py-3"><span class="text-muted-fg">Route load</span><span class="font-semibold">{{ selectedRoute.loadPercent }}%</span></div></div>
								<DomProgress class="mt-3" :value="selectedRoute.loadPercent" size="sm" />
								<div class="mt-4 flex flex-wrap gap-2"><DomBadge v-for="skill in selectedRoute.skillsMeta" :key="skill.value" tone="neutral" variant="soft">{{ skill.label }}</DomBadge></div>
								<h4 class="mt-6 text-sm font-semibold">Route manifest</h4>
								<div class="mt-2 divide-y divide-border border-y border-border"><DomAppListItem v-for="stop in routeStops" :key="stop.id" :label="stop.customer" :description="`${stop.window} · ${stop.address}`" :meta="stop.eta" :selected="stop.id === selectedStop.id" @click="selectStop(stop.id)"><template #icon><DomBadge :tone="stop.stateMeta.tone" variant="soft">{{ stop.number }}</DomBadge></template></DomAppListItem></div>
								<DomButton class="mt-4 w-full" variant="secondary" @click="openRouteUpdate">Message technician</DomButton>
							</div>
						</template>

						<template #activity>
							<div class="h-full min-h-0 overflow-y-auto px-4 py-2">
								<div v-for="item in activity" :key="item.id" class="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 border-b border-border py-4 last:border-b-0"><p class="text-[11px] text-muted-fg">{{ formatTime(item.createdAt) }}</p><div><div class="flex items-center gap-2"><p class="text-sm font-semibold">{{ item.title }}</p><DomStatusPill :tone="item.tone" label="" size="sm" /></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.detail }}</p><p class="mt-2 text-[11px] text-muted-fg">{{ item.actor }}</p></div></div>
							</div>
						</template>

						<template #evidence>
							<div class="h-full min-h-0 overflow-y-auto p-4"><DomJsonViewer :value="providerEvidence" title="Dispatch provider evidence" :filename="`${selectedStop.id}-dispatch-evidence.json`" density="compact" :preview-lines="22" /></div>
						</template>
					</DomTabs>
				</aside>
			</div>
		</div>

		<template #bottom>
			<DomAppBottomNav v-model="activeView" :items="mobileNavigation" class="lg:hidden" />
		</template>

		<template #overlay>
			<DomDialog
				ref="messageDialog"
				v-model="messageDialogOpen"
				class="pointer-events-auto"
				width="min(36rem, 94vw)"
				title="Send route update"
				:description="`Deliver one retained operational update to ${selectedRoute?.name || 'the selected technician'}.`"
			>
				<div class="grid gap-4">
					<DomSelect v-model="messageDraft.channel" label="Delivery channel" :options="catalogs.channels" :errors="fieldErrors.channel || []" />
					<DomTextareaInput v-model="messageDraft.message" label="Driver-facing update" description="Keep the instruction specific, actionable, and safe to read on the move." :rows="5" :errors="fieldErrors.message || []" />
					<DomCheckbox v-model="messageDraft.acknowledged" label="I reviewed the route and driver impact" description="The channel, message, actor, provider receipt, and delivery time will be retained." :errors="fieldErrors.acknowledged || []" />
				</div>
				<template #footer>
					<DomButton variant="secondary" data-close>Cancel</DomButton>
					<DomButton :disabled="!messageDraft.acknowledged" :loading="busyAction === 'send-route-update'" @click="sendRouteUpdate">Send update</DomButton>
				</template>
			</DomDialog>
		</template>
	</DomAppShell>
</template>
