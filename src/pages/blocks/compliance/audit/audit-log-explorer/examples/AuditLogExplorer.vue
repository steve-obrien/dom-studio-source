<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomButton,
	DomDialog,
	DomDrawer,
	DomIconButton,
	DomPagination,
	DomSelect,
	DomStatusPill,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';
import AuditEventInspector from './AuditEventInspector.vue';

const searchIcon = 'M21 21l-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z';
const filterIcon = 'M4 6h16M7 12h10M10 18h4';
const exportIcon = 'M12 4v10m0 0 4-4m-4 4-4-4M5 20h14';
const alertIcon = 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4';
const bookmarkIcon = 'M6 4h12v17l-6-4-6 4V4Z';
const refreshIcon = 'M20 7h-5V2M4 17h5v5M5.5 9A7 7 0 0 1 17 5l3 2M18.5 15A7 7 0 0 1 7 19l-3-2';
const chevronIcon = 'M9 6l6 6-6 6';

const bootstrap = ref(null);
const result = ref(null);
const events = ref([]);
const page = ref(1);
const pageSize = 6;
const searchQuery = ref('');
const environment = ref('all');
const severity = ref('all');
const outcome = ref('all');
const category = ref('all');
const timeWindow = ref('7d');
const selectedViewId = ref('custom');
const selectedEventId = ref('');
const selectedEvent = ref(null);
const loading = ref(true);
const querying = ref(false);
const loadingEvent = ref(false);
const actionBusy = ref(false);
const errorMessage = ref('');
const actionMessage = ref('');
const mobileFiltersOpen = ref(false);
const mobileInspectorOpen = ref(false);
const saveViewOpen = ref(false);
const exportOpen = ref(false);
const alertOpen = ref(false);
const saveViewName = ref('');
const saveViewError = ref('');
const exportError = ref('');
const exportResult = ref(null);
const exportFormat = ref('csv');
const exportSensitive = ref(true);
const exportAcknowledged = ref(false);
const alertError = ref('');
const alertResult = ref(null);
const alertName = ref('Production risk spike');
const alertChannel = ref('#security-alerts');
const alertThreshold = ref('3');
const alertSeverity = ref('high');
let searchTimer = 0;
let applyingSavedView = false;

const controls = computed(() => bootstrap.value?.controls || {});
const savedViews = computed(() => bootstrap.value?.savedViews || []);
const viewOptions = computed(() => [
	{ value: 'custom', label: 'Custom investigation', description: 'Current unsaved filters.' },
	...savedViews.value.map((view) => ({ value: view.id, label: view.name, description: summarizeView(view) })),
]);
const activeFilterCount = computed(() => [
	environment.value !== 'all',
	severity.value !== 'all',
	outcome.value !== 'all',
	category.value !== 'all',
	timeWindow.value !== '7d',
	Boolean(searchQuery.value.trim()),
].filter(Boolean).length);
const indexedLabel = computed(() => formatRelativeTime(result.value?.indexedAt || bootstrap.value?.indexedAt));
const selectedSummary = computed(() => events.value.find((event) => event.id === selectedEventId.value));

onMounted(loadExplorer);
onBeforeUnmount(clearSearchTimer);
watch(searchQuery, scheduleSearch);

/**
 * Loads control metadata and the first server-side audit query.
 *
 * @returns {Promise<void>}
 */
async function loadExplorer() {
	loading.value = true;
	errorMessage.value = '';
	try {
		bootstrap.value = await requestJson('/api/block-demos/audit-log-explorer/bootstrap');
		await runQuery(true);
	} catch (error) {
		errorMessage.value = error.message || 'The audit workspace could not be loaded.';
	} finally {
		loading.value = false;
	}
}

/**
 * Queries server-owned audit records using the active filters and page.
 *
 * @param {boolean} [openFirst=false] Whether to inspect the first matching event.
 * @returns {Promise<void>}
 */
async function runQuery(openFirst = false) {
	if (querying.value) return;
	querying.value = true;
	errorMessage.value = '';
	try {
		const payload = await requestJson('/api/block-demos/audit-log-explorer/query', {
			method: 'POST',
			body: { ...currentFilters(), page: page.value, pageSize },
		});
		result.value = payload;
		events.value = payload.events;
		page.value = payload.page;
		const selectionExists = payload.events.some((event) => event.id === selectedEventId.value);
		if ((openFirst || !selectionExists) && payload.events[0]) await openEvent(payload.events[0].id, false);
		if (!payload.events.length) {
			selectedEventId.value = '';
			selectedEvent.value = null;
		}
	} catch (error) {
		errorMessage.value = error.message || 'Audit events could not be queried.';
	} finally {
		querying.value = false;
	}
}

/**
 * Resets pagination before executing a changed filter query.
 *
 * @returns {Promise<void>}
 */
async function runQueryFromStart() {
	page.value = 1;
	selectedViewId.value = 'custom';
	await runQuery(true);
}

/**
 * Debounces free-text server searches while the operator types.
 *
 * @returns {void}
 */
function scheduleSearch() {
	if (applyingSavedView) return;
	selectedViewId.value = 'custom';
	clearSearchTimer();
	searchTimer = window.setTimeout(runQueryFromStart, 320);
}

/**
 * Clears the pending search timer during changes and component teardown.
 *
 * @returns {void}
 */
function clearSearchTimer() {
	if (!searchTimer) return;
	window.clearTimeout(searchTimer);
	searchTimer = 0;
}

/**
 * Loads full evidence for an event and optionally opens the compact inspector.
 *
 * @param {string} eventId Audit event identifier.
 * @param {boolean} [showMobile=true] Whether to reveal the mobile evidence drawer.
 * @returns {Promise<void>}
 */
async function openEvent(eventId, showMobile = true) {
	selectedEventId.value = eventId;
	loadingEvent.value = true;
	if (showMobile) mobileInspectorOpen.value = true;
	try {
		const payload = await requestJson(`/api/block-demos/audit-log-explorer/events/${eventId}`);
		selectedEvent.value = payload.event;
	} catch (error) {
		errorMessage.value = error.message || 'Event evidence could not be loaded.';
	} finally {
		loadingEvent.value = false;
	}
}

/**
 * Applies server-defined filters from a selected saved investigation.
 *
 * @param {string} viewId Saved view identifier.
 * @returns {Promise<void>}
 */
async function applySavedView(viewId) {
	selectedViewId.value = viewId;
	if (viewId === 'custom') return;
	const view = savedViews.value.find((item) => item.id === viewId);
	if (!view) return;
	applyingSavedView = true;
	searchQuery.value = view.filters.query || '';
	environment.value = view.filters.environment || 'all';
	severity.value = view.filters.severity || 'all';
	outcome.value = view.filters.outcome || 'all';
	category.value = view.filters.category || 'all';
	timeWindow.value = view.filters.timeWindow || '7d';
	clearSearchTimer();
	page.value = 1;
	await runQuery(true);
	applyingSavedView = false;
}

/**
 * Clears all investigation filters and restores the default seven-day view.
 *
 * @returns {Promise<void>}
 */
async function clearFilters() {
	searchQuery.value = '';
	environment.value = 'all';
	severity.value = 'all';
	outcome.value = 'all';
	category.value = 'all';
	timeWindow.value = '7d';
	selectedViewId.value = 'custom';
	mobileFiltersOpen.value = false;
	clearSearchTimer();
	page.value = 1;
	await runQuery(true);
}

/**
 * Changes the active server result page.
 *
 * @param {number} nextPage One-based page number.
 * @returns {Promise<void>}
 */
async function changePage(nextPage) {
	page.value = nextPage;
	await runQuery(true);
}

/**
 * Persists the current filter set as a reusable workspace view.
 *
 * @returns {Promise<void>}
 */
async function saveCurrentView() {
	if (actionBusy.value) return;
	actionBusy.value = true;
	saveViewError.value = '';
	try {
		const payload = await requestJson('/api/block-demos/audit-log-explorer/saved-views', {
			method: 'POST',
			body: { name: saveViewName.value, filters: currentFilters() },
		});
		bootstrap.value.savedViews.unshift(payload.view);
		selectedViewId.value = payload.view.id;
		actionMessage.value = payload.message;
		saveViewName.value = '';
		saveViewOpen.value = false;
	} catch (error) {
		saveViewError.value = error.message || 'The saved view could not be created.';
	} finally {
		actionBusy.value = false;
	}
}

/**
 * Generates an API-backed evidence export and displays its verification proof.
 *
 * @returns {Promise<void>}
 */
async function createExport() {
	if (actionBusy.value) return;
	actionBusy.value = true;
	exportError.value = '';
	exportResult.value = null;
	try {
		const payload = await requestJson('/api/block-demos/audit-log-explorer/exports', {
			method: 'POST',
			body: {
				filters: currentFilters(),
				format: exportFormat.value,
				includeSensitive: exportSensitive.value,
				acknowledgedSensitive: exportAcknowledged.value,
			},
		});
		exportResult.value = payload.job;
		actionMessage.value = payload.message;
	} catch (error) {
		exportError.value = error.message || 'The evidence export could not be created.';
	} finally {
		actionBusy.value = false;
	}
}

/**
 * Creates a server-persisted alert rule from the current risk context.
 *
 * @returns {Promise<void>}
 */
async function createAlertRule() {
	if (actionBusy.value) return;
	actionBusy.value = true;
	alertError.value = '';
	alertResult.value = null;
	try {
		const payload = await requestJson('/api/block-demos/audit-log-explorer/alert-rules', {
			method: 'POST',
			body: {
				name: alertName.value,
				channel: alertChannel.value,
				threshold: alertThreshold.value,
				severity: alertSeverity.value,
			},
		});
		alertResult.value = payload.rule;
		actionMessage.value = payload.message;
	} catch (error) {
		alertError.value = error.message || 'The alert rule could not be created.';
	} finally {
		actionBusy.value = false;
	}
}

/**
 * Synchronizes legal hold evidence returned by the inspector.
 *
 * @param {Record<string, unknown>} event Updated event detail.
 * @returns {Promise<void>}
 */
async function handleHoldUpdated(event) {
	selectedEvent.value = event;
	await runQuery(false);
}

/**
 * Returns active filter values in the API contract shape.
 *
 * @returns {Record<string, string>} Current audit filters.
 */
function currentFilters() {
	return {
		query: searchQuery.value,
		environment: environment.value,
		severity: severity.value,
		outcome: outcome.value,
		category: category.value,
		timeWindow: timeWindow.value,
	};
}

/**
 * Performs a JSON request and surfaces API validation messages.
 *
 * @param {string} url Request URL.
 * @param {{method?: string, body?: Record<string, unknown>}} [options={}] Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed response payload.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		method: options.method || 'GET',
		headers: options.body ? { 'content-type': 'application/json' } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(payload.error || `Request failed with status ${response.status}.`);
	return payload;
}

/**
 * Summarizes a saved view for rich select option copy.
 *
 * @param {Record<string, unknown>} view Saved view record.
 * @returns {string} Short filter summary.
 */
function summarizeView(view) {
	const labels = Object.entries(view.filters || {})
		.filter(([key, value]) => key !== 'query' && !['all', '7d', ''].includes(value))
		.map(([, value]) => titleCase(value));
	if (view.filters?.query) labels.push(`“${view.filters.query}”`);
	return labels.join(' · ') || 'Default investigation filters';
}

/**
 * Converts a machine value into a readable label.
 *
 * @param {string} value Machine-readable value.
 * @returns {string} Human-readable label.
 */
function titleCase(value) {
	const text = String(value || '').replaceAll('_', ' ');
	return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : '';
}

/**
 * Maps event severity to a DOM Studio semantic tone.
 *
 * @param {string} value Event severity.
 * @returns {string} Status pill tone.
 */
function severityTone(value) {
	return { critical: 'danger', high: 'warning', medium: 'info', low: 'neutral' }[value] || 'neutral';
}

/**
 * Maps event outcome to a DOM Studio semantic tone.
 *
 * @param {string} value Event outcome.
 * @returns {string} Status pill tone.
 */
function outcomeTone(value) {
	return { success: 'success', denied: 'warning', failed: 'danger' }[value] || 'neutral';
}

/**
 * Formats an event timestamp as a compact list value.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Readable date and time.
 */
function formatEventTime(value) {
	if (!value) return '';
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}

/**
 * Formats an indexed timestamp as a concise recency label.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Relative index freshness.
 */
function formatRelativeTime(value) {
	if (!value) return 'index pending';
	const seconds = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 1000));
	if (seconds < 60) return `indexed ${seconds}s ago`;
	return `indexed ${Math.round(seconds / 60)}m ago`;
}
</script>

<template>
	<div class="flex h-dvh min-h-[38rem] w-full flex-col overflow-hidden bg-canvas text-canvas-fg">
		<header class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-3 sm:px-5">
			<div class="flex min-w-0 items-center gap-3">
				<div class="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-fg">T</div>
				<div class="min-w-0">
					<div class="flex items-center gap-2">
						<h1 class="truncate text-sm font-semibold">Audit trail</h1>
						<span class="hidden text-xs text-muted-fg sm:inline">/ {{ bootstrap?.workspace?.name || 'Tempo' }}</span>
					</div>
					<p class="truncate text-[0.68rem] text-muted-fg">Immutable security evidence · {{ indexedLabel }}</p>
				</div>
			</div>

			<div class="flex shrink-0 items-center gap-1 sm:gap-2">
				<DomIconButton class="sm:hidden" :icon="filterIcon" label="Open filters" size="sm" :active="activeFilterCount > 0" @click="mobileFiltersOpen = true" />
				<DomIconButton :icon="refreshIcon" label="Refresh audit events" size="sm" :loading="querying" @click="runQuery(false)" />
				<DomButton class="hidden sm:inline-flex" variant="secondary" size="sm" @click="alertOpen = true">
					<DomIconButton as="span" :icon="alertIcon" label="" size="xs" class="pointer-events-none -ml-1" aria-hidden="true" />
					Alert
				</DomButton>
				<DomButton size="sm" @click="exportOpen = true">
					<DomIconButton as="span" :icon="exportIcon" label="" size="xs" class="pointer-events-none -ml-1" aria-hidden="true" />
					Export
				</DomButton>
			</div>
		</header>

		<section class="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 border-b border-border bg-secondary/25 px-3 py-2 text-xs sm:px-5" aria-label="Audit query summary">
			<p><span class="font-semibold text-canvas-fg">{{ result?.total ?? 0 }}</span> <span class="text-muted-fg">matching</span></p>
			<p><span class="font-semibold text-destructive">{{ result?.stats?.critical ?? 0 }}</span> <span class="text-muted-fg">critical</span></p>
			<p><span class="font-semibold text-canvas-fg">{{ result?.stats?.highRisk ?? 0 }}</span> <span class="text-muted-fg">high risk</span></p>
			<p><span class="font-semibold text-canvas-fg">{{ result?.stats?.successRate ?? 0 }}%</span> <span class="text-muted-fg">successful</span></p>
			<p class="ml-auto hidden text-muted-fg sm:block">Query {{ result?.queryId || 'pending' }}</p>
		</section>

		<section class="hidden shrink-0 items-end gap-2 border-b border-border px-4 py-3 md:flex">
			<DomTextInput v-model="searchQuery" class="min-w-52 flex-1" label="Search events" placeholder="Actor, action, request, IP…" />
			<DomSelect v-model="selectedViewId" label="Saved view" :options="viewOptions" width="min-w-[18rem]" @update:model-value="applySavedView">
				<template #option="{ option }">
					<p class="font-medium">{{ option.label }}</p>
					<p class="mt-1 text-xs opacity-75">{{ option.description }}</p>
				</template>
			</DomSelect>
			<DomSelect v-model="environment" label="Environment" :options="controls.environments || []" width="min-w-[16rem]" @update:model-value="runQueryFromStart">
				<template #option="{ option }"><p class="font-medium">{{ option.label }}</p><p class="mt-1 text-xs opacity-75">{{ option.description }}</p></template>
			</DomSelect>
			<DomSelect v-model="severity" label="Severity" :options="controls.severities || []" width="min-w-[16rem]" @update:model-value="runQueryFromStart">
				<template #option="{ option }"><p class="font-medium">{{ option.label }}</p><p class="mt-1 text-xs opacity-75">{{ option.description }}</p></template>
			</DomSelect>
			<DomIconButton :icon="bookmarkIcon" label="Save current view" variant="secondary" @click="saveViewOpen = true" />
		</section>

		<DomAlert
			v-if="errorMessage"
			class="m-3 shrink-0"
			tone="danger"
			title="Audit data needs attention"
			:description="errorMessage"
		/>
		<DomAlert
			v-if="actionMessage"
			class="m-3 shrink-0"
			tone="success"
			title="Workspace updated"
			:description="actionMessage"
			dismissible
			@dismiss="actionMessage = ''"
		/>

		<div class="flex min-h-0 flex-1">
			<main class="flex min-w-0 flex-1 flex-col" aria-label="Audit events">
				<div class="flex shrink-0 items-center justify-between gap-3 border-b border-border px-3 py-2.5 md:hidden">
					<div class="relative min-w-0 flex-1">
						<DomTextInput v-model="searchQuery" label="Search audit events" placeholder="Search events…" />
					</div>
					<DomButton variant="secondary" size="sm" @click="mobileFiltersOpen = true">
						Filters<span v-if="activeFilterCount"> · {{ activeFilterCount }}</span>
					</DomButton>
				</div>

				<div class="min-h-0 flex-1 overflow-y-auto">
					<div v-if="loading" class="grid min-h-72 place-items-center text-sm text-muted-fg">Loading audit evidence…</div>
					<div v-else-if="events.length" class="divide-y divide-border">
						<button
							v-for="event in events"
							:key="event.id"
							type="button"
							class="group grid w-full gap-3 px-3 py-3 text-left transition hover:bg-secondary/45 sm:grid-cols-[8.5rem_minmax(0,1fr)_10rem_7rem] sm:items-center sm:px-5"
							:class="selectedEventId === event.id ? 'bg-primary/7 shadow-[inset_3px_0_0_var(--primary)]' : ''"
							@click="openEvent(event.id)"
						>
							<div class="flex min-w-0 items-center gap-2 sm:block">
								<p class="shrink-0 text-xs font-medium sm:text-sm">{{ formatEventTime(event.createdAt) }}</p>
								<p class="truncate font-mono text-[0.65rem] text-muted-fg sm:mt-1">{{ event.id }}</p>
							</div>
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<DomAvatar :name="event.actor.name" :initials="event.actor.initials" size="xs" />
									<p class="truncate text-sm font-semibold">{{ event.description }}</p>
								</div>
								<p class="mt-1 truncate pl-8 font-mono text-[0.68rem] text-muted-fg">{{ event.action }} · {{ event.actor.name }}</p>
							</div>
							<div class="hidden min-w-0 sm:block">
								<p class="truncate text-xs font-medium">{{ event.resource.name }}</p>
								<p class="mt-1 truncate text-[0.68rem] text-muted-fg">{{ event.resource.type }} · {{ event.environment }}</p>
							</div>
							<div class="flex items-center justify-between gap-2 sm:justify-end">
								<div class="flex flex-wrap items-center gap-1.5">
									<DomStatusPill :tone="severityTone(event.severity)" :label="titleCase(event.severity)" size="sm" />
									<DomStatusPill :tone="outcomeTone(event.outcome)" :label="titleCase(event.outcome)" size="sm" :dot="false" />
								</div>
								<DomIconButton as="span" :icon="chevronIcon" label="" size="xs" class="pointer-events-none sm:hidden" aria-hidden="true" />
							</div>
						</button>
					</div>
					<div v-else class="grid min-h-72 place-items-center p-8 text-center">
						<div>
							<p class="text-sm font-semibold">No events match this investigation</p>
							<p class="mt-2 text-sm text-muted-fg">Clear a filter or broaden the search window.</p>
							<DomButton class="mt-4" variant="secondary" size="sm" @click="clearFilters">Clear filters</DomButton>
						</div>
					</div>
				</div>

				<footer class="shrink-0 border-t border-border px-3 py-3 sm:px-5">
					<DomPagination
						:page="page"
						:page-size="pageSize"
						:total="result?.total || 0"
						:disabled="querying"
						compact
						@update:page="changePage"
					/>
				</footer>
			</main>

			<aside class="hidden min-h-0 w-[34rem] shrink-0 overflow-y-auto border-l border-border lg:block" aria-label="Selected event evidence">
				<AuditEventInspector :event="selectedEvent" :loading="loadingEvent" @hold-updated="handleHoldUpdated" />
			</aside>
		</div>

		<DomDrawer v-model="mobileFiltersOpen" title="Investigation filters" side="right" width="min(92vw, 25rem)">
			<div class="space-y-5 p-4">
				<DomSelect v-model="selectedViewId" label="Saved view" :options="viewOptions" width="min-w-[18rem] max-w-[calc(100vw-3rem)]" @update:model-value="applySavedView">
					<template #option="{ option }"><p class="font-medium">{{ option.label }}</p><p class="mt-1 text-xs opacity-75">{{ option.description }}</p></template>
				</DomSelect>
				<DomSelect v-model="environment" label="Environment" :options="controls.environments || []" width="min-w-[18rem] max-w-[calc(100vw-3rem)]" />
				<DomSelect v-model="severity" label="Severity" :options="controls.severities || []" width="min-w-[18rem] max-w-[calc(100vw-3rem)]" />
				<DomSelect v-model="outcome" label="Outcome" :options="controls.outcomes || []" width="min-w-[18rem] max-w-[calc(100vw-3rem)]" />
				<DomSelect v-model="category" label="Category" :options="controls.categories || []" width="min-w-[18rem] max-w-[calc(100vw-3rem)]" searchable />
				<DomSelect v-model="timeWindow" label="Time window" :options="controls.timeWindows || []" width="min-w-[18rem] max-w-[calc(100vw-3rem)]" />
			</div>
			<template #footer>
				<div class="flex items-center justify-between gap-3">
					<DomButton variant="ghost" size="sm" @click="clearFilters">Clear</DomButton>
					<DomButton size="sm" @click="mobileFiltersOpen = false; runQueryFromStart()">Apply {{ activeFilterCount ? `${activeFilterCount} filters` : 'filters' }}</DomButton>
				</div>
			</template>
		</DomDrawer>

		<DomDrawer v-model="mobileInspectorOpen" :title="selectedSummary?.action || 'Event evidence'" side="right" width="min(96vw, 34rem)" class="lg:hidden">
			<AuditEventInspector :event="selectedEvent" :loading="loadingEvent" @hold-updated="handleHoldUpdated" />
		</DomDrawer>

		<DomDialog v-model="saveViewOpen" title="Save investigation view" description="Keep this server-side filter set available to every security admin." size="sm">
			<DomAlert v-if="saveViewError" class="mb-4" tone="danger" title="View was not saved" :description="saveViewError" />
			<DomTextInput v-model="saveViewName" label="View name" placeholder="e.g. Quarterly access review" />
			<div class="mt-4 border-y border-border py-3 text-xs text-muted-fg">
				{{ result?.total || 0 }} matching events · {{ activeFilterCount }} active filters
			</div>
			<template #footer>
				<DomButton variant="secondary" @click="saveViewOpen = false">Cancel</DomButton>
				<DomButton :loading="actionBusy" @click="saveCurrentView">Save view</DomButton>
			</template>
		</DomDialog>

		<DomDialog v-model="exportOpen" title="Export audit evidence" description="Generate a verified evidence file from the current server-side investigation." size="md">
			<div v-if="!exportResult" class="space-y-5">
				<DomAlert v-if="exportError" tone="danger" title="Export needs attention" :description="exportError" />
				<DomSelect v-model="exportFormat" label="File format" :options="[{ value: 'csv', label: 'CSV', description: 'Review in a spreadsheet or upload to a GRC tool.' }, { value: 'json', label: 'JSON', description: 'Preserve nested metadata for programmatic analysis.' }]" width="min-w-[20rem] max-w-[calc(100vw-4rem)]">
					<template #option="{ option }"><p class="font-medium">{{ option.label }}</p><p class="mt-1 text-xs opacity-75">{{ option.description }}</p></template>
				</DomSelect>
				<DomToggle v-model="exportSensitive" label="Include sensitive metadata" description="Adds actor email, IP address, user agent, and raw provider metadata." />
				<DomToggle v-if="exportSensitive" v-model="exportAcknowledged" label="I am authorised to export sensitive evidence" description="This acknowledgement is stored with the export job." />
				<div class="border-y border-border py-3 text-sm">
					<p class="font-medium">{{ result?.total || 0 }} matching events</p>
					<p class="mt-1 text-xs text-muted-fg">Current filters and a SHA-256 verification checksum will be included.</p>
				</div>
			</div>
			<DomAlert v-else tone="success" title="Evidence package is ready" :description="`${exportResult.filename} · ${exportResult.eventCount} events`">
				<template #actions>
					<div class="mt-3 space-y-1 font-mono text-xs">
						<p>{{ exportResult.id }}</p>
						<p class="break-all text-muted-fg">{{ exportResult.checksum }}</p>
					</div>
				</template>
			</DomAlert>
			<template #footer>
				<DomButton variant="secondary" @click="exportOpen = false">{{ exportResult ? 'Close' : 'Cancel' }}</DomButton>
				<DomButton v-if="!exportResult" :loading="actionBusy" @click="createExport">Generate export</DomButton>
			</template>
		</DomDialog>

		<DomDialog v-model="alertOpen" title="Create audit alert" description="Notify a security channel when high-risk audit traffic crosses a threshold." size="md">
			<div v-if="!alertResult" class="space-y-5">
				<DomAlert v-if="alertError" tone="danger" title="Alert rule needs attention" :description="alertError" />
				<DomTextInput v-model="alertName" label="Rule name" />
				<div class="grid gap-4 sm:grid-cols-2">
					<DomSelect v-model="alertSeverity" label="Minimum severity" :options="(controls.severities || []).filter((option) => option.value !== 'all')" width="min-w-[16rem] max-w-[calc(100vw-4rem)]" />
					<DomTextInput v-model="alertThreshold" label="Events in 15 minutes" type="number" />
				</div>
				<DomTextInput v-model="alertChannel" label="Notification channel" description="Use an email address or a channel beginning with #." />
			</div>
			<DomAlert v-else tone="success" title="Alert monitoring is active" :description="`${alertResult.name} · ${alertResult.threshold} events / ${alertResult.window} · ${alertResult.channel}`" />
			<template #footer>
				<DomButton variant="secondary" @click="alertOpen = false">{{ alertResult ? 'Close' : 'Cancel' }}</DomButton>
				<DomButton v-if="!alertResult" :loading="actionBusy" @click="createAlertRule">Create alert</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
