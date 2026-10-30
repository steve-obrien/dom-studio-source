<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
	DomAlert,
	DomAppBottomNav,
	DomAppListItem,
	DomAppShell,
	DomAppTopBar,
	DomAvatar,
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
	DomTextareaInput,
	DomToggleButtonGroup,
	DomWeekPlanner,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/resource-scheduler';
const addIcon = 'M12 5v14M5 12h14';
const publishIcon = 'M12 16V4M7 9l5-5 5 5M5 20h14';
const scheduleModes = [
	{ value: 'schedule', label: 'Schedule' },
	{ value: 'capacity', label: 'Capacity' },
];

const workspace = ref(null);
const catalogs = ref({ resources: [], work: [], statuses: [], dates: [], times: [] });
const resources = ref([]);
const allocations = ref([]);
const selectedResource = ref(null);
const selectedAllocation = ref(null);
const allocationPreview = ref(null);
const activity = ref([]);
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const fieldErrors = ref({});
const activeView = ref('schedule');
const scheduleMode = ref('schedule');
const allocationOpen = ref(false);
const allocationAcknowledged = ref(false);
const showPreview = ref(false);
const statusDraft = ref('hold');
const statusAcknowledged = ref(false);
const publishOpen = ref(false);
const publishAcknowledged = ref(false);

const allocationDraft = reactive({
	allocationId: '',
	resourceId: '',
	workId: '',
	date: '2026-08-03',
	startTime: '09:00',
	endTime: '11:00',
	status: 'hold',
	note: '',
});

const selectedResourceAllocations = computed(() => allocations.value
	.filter((allocation) => allocation.resourceId === selectedResource.value?.id)
	.sort((left, right) => `${left.date} ${left.startTime}`.localeCompare(`${right.date} ${right.startTime}`)));
const allocationsByDate = computed(() => selectedResourceAllocations.value.reduce((groups, allocation) => {
	if (!groups[allocation.date]) groups[allocation.date] = [];
	groups[allocation.date].push(allocation);
	return groups;
}, {}));
const mobileNavigation = computed(() => [
	{ value: 'schedule', label: 'Schedule', badge: String(selectedResourceAllocations.value.length) },
	{ value: 'people', label: 'People', badge: String(resources.value.length) },
	{ value: 'assignment', label: 'Assignment', badge: selectedAllocation.value?.status === 'hold' ? '!' : '' },
]);
const previewHasFailures = computed(() => allocationPreview.value?.candidate?.checks?.some((check) => check.status === 'failed'));
const capacityResources = computed(() => [...resources.value].sort((left, right) => right.utilization - left.utilization));
const providerEvidence = computed(() => ({
	workspaceRevision: workspace.value?.revision,
	selectedResource: selectedResource.value ? {
		id: selectedResource.value.id,
		name: selectedResource.value.name,
		capacityHours: selectedResource.value.capacityHours,
		scheduledHours: selectedResource.value.scheduledHours,
		utilization: selectedResource.value.utilization,
	} : null,
	selectedAllocation: selectedAllocation.value?.evidence || null,
	publishReceipt: workspace.value?.publishReceipt || null,
	latestActivity: activity.value.slice(0, 3),
}));

onMounted(loadWorkspace);

/**
 * Loads the authoritative resource-scheduler workspace.
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
		error.value = requestError.message || 'Unable to load the resource schedule.';
	} finally {
		loading.value = false;
	}
}

/**
 * Sends one JSON mutation and applies the authoritative response.
 *
 * @param {string} path API path below the resource-scheduler root.
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
		error.value = requestError.message || 'Scheduling operation failed.';
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
	if (!contentType.includes('application/json')) throw new Error(`The resource-scheduler API returned ${response.status} without JSON.`);
	return response.json();
}

/**
 * Replaces client state with one authoritative API response.
 *
 * @param {Record<string, any>} data Resource-scheduler response.
 * @returns {void}
 */
function setWorkspace(data) {
	workspace.value = data.workspace;
	catalogs.value = data.catalogs || { resources: [], work: [], statuses: [], dates: [], times: [] };
	resources.value = data.resources || [];
	allocations.value = data.allocations || [];
	selectedResource.value = data.selectedResource || null;
	selectedAllocation.value = data.selectedAllocation || null;
	allocationPreview.value = data.allocationPreview || null;
	activity.value = data.activity || [];
	statusDraft.value = data.selectedAllocation?.status || 'hold';
	statusAcknowledged.value = false;
	if (data.allocationPreview) {
		Object.assign(allocationDraft, data.allocationPreview.draft);
		showPreview.value = true;
		allocationOpen.value = true;
	}
}

/**
 * Selects one resource through the authoritative workspace.
 *
 * @param {string} resourceId Stable resource identifier.
 * @returns {Promise<void>}
 */
async function selectResource(resourceId) {
	if (!workspace.value || busyAction.value) return;
	const data = await mutateWorkspace('/select', {
		revision: workspace.value.revision,
		resourceId,
	}, 'select-resource');
	if (data) activeView.value = 'schedule';
}

/**
 * Selects one assignment and reveals its detail surface.
 *
 * @param {string} allocationId Stable allocation identifier.
 * @returns {Promise<void>}
 */
async function selectAllocation(allocationId) {
	if (!workspace.value || !selectedResource.value || busyAction.value) return;
	if (allocationId !== selectedAllocation.value?.id) {
		const data = await mutateWorkspace('/select', {
			revision: workspace.value.revision,
			resourceId: selectedResource.value.id,
			allocationId,
		}, 'select-allocation');
		if (!data) return;
	}
	if (!isDesktop()) activeView.value = 'assignment';
}

/**
 * Lists timed allocations for one planner day.
 *
 * @param {string} date YYYY-MM-DD day key.
 * @returns {Array<Record<string, any>>} Timed allocations.
 */
function allocationsForDay(date) {
	return allocationsByDate.value[date] || [];
}

/**
 * Opens a blank allocation draft for the active resource.
 *
 * @returns {void}
 */
function openCreateAllocation() {
	if (!selectedResource.value) return;
	Object.assign(allocationDraft, {
		allocationId: '',
		resourceId: selectedResource.value.id,
		workId: bestWorkForResource(selectedResource.value),
		date: '2026-08-03',
		startTime: '09:00',
		endTime: '11:00',
		status: 'hold',
		note: '',
	});
	prepareAllocationDialog();
}

/**
 * Opens a new allocation draft from a planner time-range selection.
 *
 * @param {{ value: string, startTime: string, endTime: string }} payload Planner selection payload.
 * @returns {void}
 */
function openTimeRange(payload) {
	openCreateAllocation();
	allocationDraft.date = payload.value;
	allocationDraft.startTime = payload.startTime;
	allocationDraft.endTime = payload.endTime;
}

/**
 * Opens a populated reschedule draft for the selected assignment.
 *
 * @returns {void}
 */
function openRescheduleAllocation() {
	if (!selectedAllocation.value) return;
	populateDraftFromAllocation(selectedAllocation.value);
	prepareAllocationDialog();
}

/**
 * Opens a populated reschedule draft after a planner drop.
 *
 * @param {{ data: Record<string, any>, targetValue: string, targetTime: string }} payload Planner drop payload.
 * @returns {void}
 */
function openDroppedAllocation(payload) {
	const allocation = allocations.value.find((item) => item.id === payload.data?.id);
	if (!allocation || !payload.targetValue || !payload.targetTime) return;
	populateDraftFromAllocation(allocation);
	const duration = durationInMinutes(allocation.startTime, allocation.endTime);
	allocationDraft.date = payload.targetValue;
	allocationDraft.startTime = payload.targetTime;
	allocationDraft.endTime = formatTime(Math.min(20 * 60, parseTime(payload.targetTime) + duration));
	prepareAllocationDialog();
}

/**
 * Copies an existing assignment into the editable allocation draft.
 *
 * @param {Record<string, any>} allocation Selected allocation.
 * @returns {void}
 */
function populateDraftFromAllocation(allocation) {
	Object.assign(allocationDraft, {
		allocationId: allocation.id,
		resourceId: allocation.resourceId,
		workId: allocation.workId,
		date: allocation.date,
		startTime: allocation.startTime,
		endTime: allocation.endTime,
		status: allocation.status,
		note: allocation.note,
	});
}

/**
 * Resets preview-only state and opens the allocation dialog.
 *
 * @returns {void}
 */
function prepareAllocationDialog() {
	allocationPreview.value = null;
	allocationAcknowledged.value = false;
	showPreview.value = false;
	fieldErrors.value = {};
	allocationOpen.value = true;
}

/**
 * Requests server-owned availability and capacity checks.
 *
 * @returns {Promise<void>}
 */
async function reviewAllocation() {
	if (!workspace.value) return;
	const existing = allocations.value.find((allocation) => allocation.id === allocationDraft.allocationId);
	const data = await mutateWorkspace('/allocations/preview', {
		revision: workspace.value.revision,
		allocationVersion: existing?.version || 0,
		...allocationDraft,
	}, 'preview-allocation');
	if (data) notice.value = `${data.allocationPreview.checksum} retained the exact capacity checks.`;
}

/**
 * Returns from exact preview to editable allocation fields.
 *
 * @returns {void}
 */
function editAllocation() {
	showPreview.value = false;
	allocationAcknowledged.value = false;
	fieldErrors.value = {};
}

/**
 * Commits one acknowledged exact allocation preview.
 *
 * @returns {Promise<void>}
 */
async function commitAllocation() {
	if (!workspace.value || !allocationPreview.value) return;
	const data = await mutateWorkspace('/allocations/commit', {
		revision: workspace.value.revision,
		previewChecksum: allocationPreview.value.checksum,
		acknowledged: allocationAcknowledged.value,
	}, 'commit-allocation');
	if (data) {
		allocationOpen.value = false;
		activeView.value = isDesktop() ? 'schedule' : 'assignment';
		notice.value = `${data.allocationReceipt.providerReceipt} synchronized the exact assignment.`;
	}
}

/**
 * Updates the selected assignment status at an exact version.
 *
 * @returns {Promise<void>}
 */
async function updateStatus() {
	if (!workspace.value || !selectedAllocation.value) return;
	const data = await mutateWorkspace(`/allocations/${selectedAllocation.value.id}/status`, {
		revision: workspace.value.revision,
		allocationVersion: selectedAllocation.value.version,
		status: statusDraft.value,
		acknowledged: statusAcknowledged.value,
	}, 'update-status');
	if (data) notice.value = `${data.selectedAllocation.providerReceipt} retained the status change.`;
}

/**
 * Opens the schedule publication confirmation.
 *
 * @returns {void}
 */
function openPublish() {
	publishAcknowledged.value = false;
	fieldErrors.value = {};
	publishOpen.value = true;
}

/**
 * Publishes pending changes through the demo provider adapter.
 *
 * @returns {Promise<void>}
 */
async function publishSchedule() {
	if (!workspace.value) return;
	const data = await mutateWorkspace('/schedule/publish', {
		revision: workspace.value.revision,
		acknowledged: publishAcknowledged.value,
	}, 'publish-schedule');
	if (data) {
		publishOpen.value = false;
		notice.value = `${data.publishReceipt.providerReceipt} delivered ${data.publishReceipt.changes} schedule change${data.publishReceipt.changes === 1 ? '' : 's'}.`;
	}
}

/**
 * Restores the deterministic scheduler workspace.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	const data = await mutateWorkspace('/reset', {}, 'reset-workspace');
	if (data) {
		activeView.value = 'schedule';
		scheduleMode.value = 'schedule';
		allocationOpen.value = false;
		publishOpen.value = false;
		notice.value = 'Resource schedule restored.';
	}
}

/**
 * Selects a realistic default work item supported by one resource.
 *
 * @param {Record<string, any>} resource Selected resource.
 * @returns {string} Work option identifier.
 */
function bestWorkForResource(resource) {
	return catalogs.value.work.find((work) => !work.skill || resource.skills.includes(work.skill))?.value || catalogs.value.work[0]?.value || '';
}

/**
 * Returns planner drag metadata for one assignment.
 *
 * @param {Record<string, any>} allocation Allocation record.
 * @returns {Record<string, string>} Serializable drag data.
 */
function dragDataFor(allocation) {
	return {
		id: allocation.id,
		date: allocation.date,
		startTime: allocation.startTime,
		endTime: allocation.endTime,
		title: allocation.title,
	};
}

/**
 * Resolves semantic planner classes for one assignment.
 *
 * @param {Record<string, any>} allocation Allocation record.
 * @returns {string} Theme-aware event classes.
 */
function allocationToneClass(allocation) {
	return {
		confirmed: 'border-success/45 bg-success/12 text-canvas-fg',
		hold: 'border-warning/50 bg-warning/15 text-canvas-fg',
		completed: 'border-border bg-secondary text-muted-fg',
	}[allocation.status] || 'border-border bg-secondary text-canvas-fg';
}

/**
 * Resolves a semantic status tone.
 *
 * @param {string} status Allocation status.
 * @returns {string} DOM Studio status tone.
 */
function statusTone(status) {
	return { confirmed: 'success', hold: 'warning', completed: 'neutral' }[status] || 'neutral';
}

/**
 * Resolves a semantic policy-check tone.
 *
 * @param {string} status Policy-check status.
 * @returns {string} DOM Studio status tone.
 */
function checkTone(status) {
	return { passed: 'success', warning: 'warning', failed: 'danger' }[status] || 'neutral';
}

/**
 * Formats one assignment time range.
 *
 * @param {Record<string, any>} allocation Allocation record.
 * @returns {string} Compact time range.
 */
function allocationTimeLabel(allocation) {
	return `${allocation.startTime}–${allocation.endTime}`;
}

/**
 * Formats one YYYY-MM-DD date for assignment detail.
 *
 * @param {string} value Date key.
 * @returns {string} Human-readable date.
 */
function formatDate(value) {
	return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

/**
 * Calculates the duration between two HH:mm values.
 *
 * @param {string} startTime Interval start.
 * @param {string} endTime Interval end.
 * @returns {number} Duration in minutes.
 */
function durationInMinutes(startTime, endTime) {
	return Math.max(30, parseTime(endTime) - parseTime(startTime));
}

/**
 * Parses HH:mm into minutes after midnight.
 *
 * @param {string} value Time key.
 * @returns {number} Minutes after midnight.
 */
function parseTime(value) {
	const [hours, minutes] = String(value || '00:00').split(':').map(Number);
	return (hours * 60) + minutes;
}

/**
 * Formats minutes after midnight as HH:mm.
 *
 * @param {number} minutes Minutes after midnight.
 * @returns {string} Time key.
 */
function formatTime(minutes) {
	return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/**
 * Reports whether the current browser is at the desktop application breakpoint.
 *
 * @returns {boolean} True at desktop widths.
 */
function isDesktop() {
	return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
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
</script>

<template>
	<DomAppShell variant="app" class="!h-dvh" data-testid="resource-scheduler">
		<template #top>
			<DomAppTopBar title="Resource schedule" :subtitle="workspace ? workspace.weekLabel : 'Workforce planning'">
				<template #leading><DomBadge tone="primary" variant="soft">RS</DomBadge></template>
				<template #trailing>
					<DomBadge v-if="workspace?.unpublishedChanges" tone="warning" variant="soft" class="!hidden sm:!inline-flex">{{ workspace.unpublishedChanges }} unpublished</DomBadge>
					<DomIconButton :icon="addIcon" label="Create assignment" size="sm" variant="primary" @click="openCreateAllocation" />
					<DomIconButton :icon="publishIcon" label="Publish schedule changes" size="sm" variant="secondary" class="sm:!hidden" :disabled="!workspace?.unpublishedChanges" @click="openPublish" />
					<DomButton class="!hidden sm:!inline-flex" size="sm" :disabled="!workspace?.unpublishedChanges" @click="openPublish">Publish changes</DomButton>
				</template>
			</DomAppTopBar>
		</template>

		<div class="relative h-full min-h-0 overflow-hidden">
			<div v-if="error || notice" class="absolute inset-x-3 top-3 z-50 mx-auto max-w-2xl">
				<DomAlert v-if="error" tone="danger" variant="toast" title="Scheduling operation failed" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-else tone="success" variant="toast" title="Schedule updated" :description="notice" dismissible @dismiss="notice = ''" />
			</div>

			<div v-if="loading" class="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[17rem_minmax(0,1fr)_22rem]">
				<div class="hidden space-y-3 border-r border-border p-4 lg:block"><DomSkeleton height="h-8" /><DomSkeleton v-for="row in 5" :key="row" height="h-16" /></div>
				<div class="space-y-3 p-3"><DomSkeleton height="h-12" /><DomSkeleton height="h-[34rem]" /></div>
				<div class="hidden space-y-3 border-l border-border p-4 lg:block"><DomSkeleton height="h-8" /><DomSkeleton height="h-32" /><DomSkeleton height="h-48" /></div>
			</div>

			<DomEmptyState v-else-if="!workspace || !selectedResource" title="Resource schedule unavailable" description="Reload the repository-local API to restore the scheduling workspace.">
				<DomButton @click="loadWorkspace">Reload schedule</DomButton>
			</DomEmptyState>

			<section v-else class="h-full min-h-0 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)_22rem]">
				<aside :class="activeView === 'people' ? 'block' : 'hidden lg:block'" class="h-full min-h-0 overflow-y-auto border-r border-border bg-muted/10">
					<header class="sticky top-0 z-10 border-b border-border bg-canvas p-4">
						<div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">People</p><p class="mt-1 text-sm font-semibold">{{ workspace.summary.scheduledHours }}h of {{ workspace.summary.capacityHours }}h</p></div><DomStatusPill :tone="workspace.summary.overCapacity ? 'danger' : 'success'" :label="workspace.summary.overCapacity ? `${workspace.summary.overCapacity} over capacity` : `${workspace.summary.utilization}% planned`" size="sm" /></div>
						<DomProgress class="mt-3" :value="workspace.summary.utilization" :max="100" tone="primary" size="sm" :show-label="false" />
					</header>
					<div class="divide-y divide-border">
						<DomAppListItem
							v-for="resource in resources"
							:key="resource.id"
							:label="resource.name"
							:description="`${resource.role} · ${resource.scheduledHours}h / ${resource.capacityHours}h`"
							:meta="`${resource.assignmentCount} jobs`"
							:selected="resource.id === selectedResource.id"
							@click="selectResource(resource.id)"
						>
							<template #icon><DomAvatar :initials="resource.initials" size="sm" /></template>
							<template #trailing><DomStatusPill :tone="resource.capacityTone" :label="`${resource.utilization}%`" size="sm" /></template>
						</DomAppListItem>
					</div>
					<div class="p-4"><DomButton class="w-full" variant="ghost" size="sm" :loading="busyAction === 'reset-workspace'" @click="resetWorkspace">Reset demo workspace</DomButton></div>
				</aside>

				<main :class="activeView === 'schedule' ? 'flex' : 'hidden lg:flex'" class="h-full min-h-0 min-w-0 flex-col overflow-hidden bg-canvas">
					<header class="shrink-0 border-b border-border px-3 py-3 sm:px-4">
						<div class="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
							<DomSelect class="lg:hidden" :model-value="selectedResource.id" label="Resource" :options="catalogs.resources" searchable width="min-w-0" @update:model-value="selectResource" />
							<div class="hidden min-w-0 lg:block"><div class="flex items-center gap-2"><h2 class="truncate text-lg font-semibold">{{ selectedResource.name }}</h2><DomStatusPill :tone="selectedResource.capacityTone" :label="`${selectedResource.utilization}% planned`" size="sm" /></div><p class="mt-1 truncate text-xs text-muted-fg">{{ selectedResource.role }} · {{ selectedResource.skills.join(', ') }} · {{ selectedResource.timezone }}</p></div>
							<DomToggleButtonGroup v-model="scheduleMode" label="Planner view" :options="scheduleModes" size="sm" chrome="none" />
						</div>
						<div class="mt-3 flex items-center gap-3"><div class="min-w-0 flex-1"><DomProgress :value="selectedResource.utilization" :max="100" :tone="selectedResource.capacityTone === 'danger' ? 'danger' : selectedResource.capacityTone === 'warning' ? 'warning' : 'primary'" size="sm" :label="`${selectedResource.scheduledHours}h scheduled`" :show-value="true" /></div><p class="hidden shrink-0 text-xs text-muted-fg sm:block">{{ selectedResource.remainingHours >= 0 ? `${selectedResource.remainingHours}h available` : `${Math.abs(selectedResource.remainingHours)}h overtime` }}</p></div>
					</header>

					<div v-if="scheduleMode === 'schedule'" class="min-h-0 flex-1 overflow-auto p-2 sm:p-3">
						<div class="mb-2 flex items-center justify-between gap-3 px-1"><div><p class="text-sm font-semibold">Week schedule</p><p class="text-xs text-muted-fg">Drag work to reschedule, or drag across empty time to create.</p></div><DomButton size="sm" variant="secondary" @click="openCreateAllocation">New assignment</DomButton></div>
						<DomWeekPlanner
							start-date="2026-08-03"
							:weeks="1"
							:start-time="'07:00'"
							:end-time="'20:00'"
							:time-step="60"
							:selection-step="30"
							:slot-height="58"
							:day-width="168"
							:time-rail-width="60"
							:viewport-height="650"
							range-selection
							drag-and-drop
							@time-range-select="openTimeRange"
							@day-drop="openDroppedAllocation"
						>
							<template #default="{ cell, drag, dragAttrs, rangeStyle }">
								<article
									v-for="allocation in allocationsForDay(cell.value)"
									:key="allocation.id"
									v-bind="dragAttrs(dragDataFor(allocation), { sourceTime: allocation.startTime })"
									role="button"
									tabindex="0"
									class="absolute left-1.5 right-1.5 z-10 cursor-grab overflow-hidden rounded-lg border p-2 text-left text-xs shadow-sm transition hover:z-20 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
									:class="[allocationToneClass(allocation), allocation.id === selectedAllocation?.id && 'ring-2 ring-ring/40', drag.source && drag.data?.id === allocation.id && 'opacity-60']"
									:style="rangeStyle(allocation)"
									@click.stop="selectAllocation(allocation.id)"
									@keydown.enter.stop="selectAllocation(allocation.id)"
								>
									<div class="flex items-start justify-between gap-1"><h3 class="min-w-0 truncate font-bold">{{ allocation.title }}</h3><span class="shrink-0 text-[9px] font-semibold uppercase tracking-wide opacity-70">{{ allocation.status }}</span></div>
									<p class="mt-1 font-semibold tabular-nums">{{ allocationTimeLabel(allocation) }}</p>
									<p class="mt-1 truncate text-[10px] opacity-75">{{ allocation.location }}</p>
								</article>
							</template>
						</DomWeekPlanner>
					</div>

					<div v-else class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
						<div class="mx-auto max-w-3xl"><div class="flex items-end justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Capacity order</p><h2 class="mt-1 text-xl font-semibold">Find room before moving work</h2></div><DomStatusPill :tone="workspace.summary.overCapacity ? 'danger' : 'success'" :label="`${workspace.summary.overCapacity} over capacity`" /></div>
							<div class="mt-5 overflow-hidden border-y border-border">
								<DomAppListItem v-for="resource in capacityResources" :key="resource.id" :label="resource.name" :description="`${resource.scheduledHours}h planned · ${resource.remainingHours >= 0 ? `${resource.remainingHours}h available` : `${Math.abs(resource.remainingHours)}h overtime`}`" :meta="resource.role" chevron @click="selectResource(resource.id)"><template #icon><DomAvatar :initials="resource.initials" size="sm" /></template><template #trailing><div class="w-28"><DomProgress :value="resource.utilization" :max="100" :tone="resource.capacityTone === 'danger' ? 'danger' : resource.capacityTone === 'warning' ? 'warning' : 'success'" size="sm" :show-label="false" /><p class="mt-1 text-right text-[10px] font-semibold">{{ resource.utilization }}%</p></div></template></DomAppListItem>
							</div></div>
					</div>
				</main>

				<aside :class="activeView === 'assignment' ? 'block' : 'hidden lg:block'" class="h-full min-h-0 overflow-y-auto border-l border-border bg-muted/10">
					<DomEmptyState v-if="!selectedAllocation" class="h-full" title="Choose an assignment" description="Select scheduled work to inspect its exact version, capacity evidence, and provider receipt." />
					<div v-else>
						<header class="border-b border-border bg-canvas p-4"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Assignment</p><h2 class="mt-1 truncate text-lg font-semibold">{{ selectedAllocation.title }}</h2><p class="mt-1 text-xs text-muted-fg">{{ formatDate(selectedAllocation.date) }} · {{ allocationTimeLabel(selectedAllocation) }}</p></div><DomStatusPill :tone="statusTone(selectedAllocation.status)" :label="selectedAllocation.statusMeta.label" size="sm" /></div></header>
						<div class="space-y-5 p-4">
							<dl class="divide-y divide-border border-y border-border text-sm"><div class="flex justify-between gap-4 py-3"><dt class="text-muted-fg">Resource</dt><dd class="text-right font-semibold">{{ selectedAllocation.resource.name }}</dd></div><div class="flex justify-between gap-4 py-3"><dt class="text-muted-fg">Customer</dt><dd class="text-right font-semibold">{{ selectedAllocation.customer }}</dd></div><div class="flex justify-between gap-4 py-3"><dt class="text-muted-fg">Location</dt><dd class="text-right font-semibold">{{ selectedAllocation.location }}</dd></div><div class="flex justify-between gap-4 py-3"><dt class="text-muted-fg">Duration</dt><dd class="text-right font-semibold">{{ selectedAllocation.durationHours }}h</dd></div></dl>
							<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Delivery context</p><p class="mt-2 text-sm leading-6">{{ selectedAllocation.note }}</p></div>
							<div class="grid grid-cols-2 gap-2"><DomButton variant="secondary" size="sm" @click="openRescheduleAllocation">Reschedule</DomButton><DomButton size="sm" @click="openCreateAllocation">Add work</DomButton></div>
							<div class="border-t border-border pt-5"><DomSelect v-model="statusDraft" label="Assignment status" :options="catalogs.statuses" /><DomCheckbox v-if="statusDraft === 'completed'" v-model="statusAcknowledged" class="mt-3" label="Retain completion evidence" description="The completed assignment cannot be reopened in this demo." :errors="fieldErrors.acknowledged || []" /><DomButton class="mt-3 w-full" variant="secondary" :loading="busyAction === 'update-status'" :disabled="statusDraft === selectedAllocation.status" @click="updateStatus">Save status</DomButton></div>
							<DomJsonViewer :value="providerEvidence" title="Schedule evidence" :filename="`${selectedAllocation.id}-schedule-evidence.json`" density="compact" :preview-lines="12" />
						</div>
					</div>
				</aside>
			</section>
		</div>

		<template #bottom><DomAppBottomNav v-if="workspace" v-model="activeView" class="lg:hidden" :items="mobileNavigation" /></template>

		<DomDialog v-model="allocationOpen" :title="allocationDraft.allocationId ? 'Reschedule assignment' : 'Create assignment'" description="The API checks availability, skills, service area, working hours, and capacity before anything is saved." size="lg">
			<div v-if="!showPreview || !allocationPreview" class="grid gap-4">
				<div class="grid gap-4 sm:grid-cols-2"><DomSelect v-model="allocationDraft.resourceId" label="Resource" :options="catalogs.resources" searchable :errors="fieldErrors.resourceId || []" /><DomSelect v-model="allocationDraft.workId" label="Scheduled work" :options="catalogs.work" searchable :errors="fieldErrors.workId || []"><template #option="{ option }"><div><p class="font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div>
				<div class="grid gap-4 sm:grid-cols-3"><DomSelect v-model="allocationDraft.date" label="Date" :options="catalogs.dates" :errors="fieldErrors.date || []" /><DomSelect v-model="allocationDraft.startTime" label="Start" :options="catalogs.times" :errors="fieldErrors.startTime || []" /><DomSelect v-model="allocationDraft.endTime" label="End" :options="catalogs.times" :errors="fieldErrors.endTime || []" /></div>
				<DomSelect v-model="allocationDraft.status" label="Initial status" :options="catalogs.statuses" :errors="fieldErrors.status || []"><template #option="{ option }"><div><p class="font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
				<DomTextareaInput v-model="allocationDraft.note" label="Delivery context" description="Retained with the schedule receipt." placeholder="Access, customer, equipment, and handover details." :rows="4" :errors="fieldErrors.note || []" />
			</div>
			<div v-else class="space-y-4">
				<DomAlert :tone="previewHasFailures ? 'danger' : 'success'" :title="previewHasFailures ? 'Resolve blocking checks' : 'Assignment can be saved'" :description="previewHasFailures ? 'The API found a skill, region, or availability conflict.' : `${allocationPreview.candidate.impact.projectedWeekHours}h of ${allocationPreview.candidate.impact.capacityHours}h will be planned for ${allocationPreview.resource.name}.`" />
				<div class="overflow-hidden border-y border-border"><div v-for="check in allocationPreview.candidate.checks" :key="check.key" class="flex items-start justify-between gap-4 border-b border-border px-1 py-3 last:border-b-0"><div><p class="text-sm font-semibold">{{ check.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div><DomStatusPill :tone="checkTone(check.status)" :label="check.status" size="sm" /></div></div>
				<DomCheckbox v-model="allocationAcknowledged" label="Confirm exact assignment and capacity impact" description="The resource, interval, work, checks, actor, preview checksum, and provider receipt will be retained." :errors="fieldErrors.acknowledged || fieldErrors.policy || []" />
			</div>
			<template #footer>
				<DomButton v-if="showPreview && allocationPreview" variant="secondary" @click="editAllocation">Edit assignment</DomButton>
				<DomButton v-if="!showPreview || !allocationPreview" :loading="busyAction === 'preview-allocation'" @click="reviewAllocation">Review availability</DomButton>
				<DomButton v-else :loading="busyAction === 'commit-allocation'" :disabled="previewHasFailures" @click="commitAllocation">Save assignment</DomButton>
			</template>
		</DomDialog>

		<DomDialog v-model="publishOpen" title="Publish schedule changes" :description="`Deliver ${workspace?.unpublishedChanges || 0} pending change${workspace?.unpublishedChanges === 1 ? '' : 's'} to the workforce schedule adapter.`" size="sm">
			<div class="space-y-4"><DomAlert tone="warning" title="Customer-facing operation" description="Confirmed assignments may notify delivery teams and customers in a production integration." /><DomCheckbox v-model="publishAcknowledged" label="Publish the exact pending change set" description="The actor, revision, change count, adapter, timestamp, and provider receipt will be retained." :errors="fieldErrors.acknowledged || []" /></div>
			<template #footer><DomButton variant="secondary" @click="publishOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'publish-schedule'" @click="publishSchedule">Publish changes</DomButton></template>
		</DomDialog>
	</DomAppShell>
</template>
