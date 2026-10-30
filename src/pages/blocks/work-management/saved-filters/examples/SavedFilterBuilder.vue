<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import {
	DomAlert,
	DomAppBottomNav,
	DomAppShell,
	DomAppTopBar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomEmptyState,
	DomProgress,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTagCombobox,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/saved-filters';
const resultTabs = [
	{ key: 'results', label: 'Matching work' },
	{ key: 'activity', label: 'View activity' },
];

const workspace = ref(null);
const views = ref([]);
const catalogs = ref({ matchModes: [], visibility: [], alerts: [], teams: [], fields: [] });
const selectedView = ref(null);
const results = ref({ count: 0, points: 0, query: '', queryCost: 'low', rows: [], statusCounts: {} });
const exactPreview = ref(null);
const saveReceipt = ref(null);
const loading = ref(true);
const detailLoading = ref(false);
const busyAction = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const fieldErrors = ref({});
const viewSearch = ref('');
const resultSearch = ref('');
const activeView = ref('results');
const activeTab = ref('results');
const previewAcknowledged = ref(false);
const syncingDraft = ref(false);

const draft = reactive({
	name: '',
	description: '',
	visibility: 'workspace',
	teamIds: [],
	matchMode: 'all',
	alertMode: 'added',
	favorite: true,
	rules: [],
});

const filteredViews = computed(() => {
	const query = viewSearch.value.trim().toLowerCase();
	if (!query) return views.value;
	return views.value.filter((view) => [view.name, view.description, view.ownerName, view.visibilityLabel]
		.some((value) => String(value || '').toLowerCase().includes(query)));
});
const favoriteViews = computed(() => filteredViews.value.filter((view) => view.favorite));
const workspaceViews = computed(() => filteredViews.value.filter((view) => !view.favorite));
const isNewView = computed(() => selectedView.value?.id === 'new');
const currentViewId = computed(() => selectedView.value?.id || 'new');
const visibleRows = computed(() => {
	const query = resultSearch.value.trim().toLowerCase();
	if (!query) return results.value.rows || [];
	return (results.value.rows || []).filter((issue) => [
		issue.id,
		issue.title,
		issue.teamLabel,
		issue.assigneeLabel,
		issue.project,
		...(issue.labelNames || []),
	].some((value) => String(value || '').toLowerCase().includes(query)));
});
const mobileNavigation = computed(() => [
	{ value: 'views', label: 'Views', badge: String(views.value.length) },
	{ value: 'results', label: 'Results', badge: String(results.value.count || 0) },
	{ value: 'builder', label: isNewView.value ? 'Create' : 'Query', badge: draft.rules.length ? String(draft.rules.length) : '' },
]);
const fieldOptions = computed(() => catalogs.value.fields || []);
const draftPayload = computed(() => ({
	name: draft.name,
	description: draft.description,
	visibility: draft.visibility,
	teamIds: [...draft.teamIds],
	matchMode: draft.matchMode,
	alertMode: draft.alertMode,
	favorite: draft.favorite,
	rules: draft.rules.map((rule) => ({
		id: rule.id,
		field: rule.field,
		operator: rule.operator,
		values: [...rule.values],
	})),
}));
const hasDraftChanges = computed(() => {
	if (isNewView.value) return true;
	if (!selectedView.value) return false;
	const persisted = {
		name: selectedView.value.name,
		description: selectedView.value.description,
		visibility: selectedView.value.visibility,
		teamIds: selectedView.value.teamIds,
		matchMode: selectedView.value.matchMode,
		alertMode: selectedView.value.alertMode,
		favorite: selectedView.value.favorite,
		rules: selectedView.value.rules,
	};
	return JSON.stringify(draftPayload.value) !== JSON.stringify(persisted);
});
const completion = computed(() => {
	let completed = 0;
	if (draft.name.trim().length >= 4) completed += 1;
	if (draft.description.trim().length >= 12) completed += 1;
	if (draft.rules.length) completed += 1;
	if (draft.visibility !== 'teams' || draft.teamIds.length) completed += 1;
	return Math.round((completed / 4) * 100);
});

onMounted(loadWorkspace);

watch(draft, () => {
	if (syncingDraft.value) return;
	exactPreview.value = null;
	saveReceipt.value = null;
	previewAcknowledged.value = false;
	fieldErrors.value = {};
}, { deep: true });

/**
 * Loads the saved-view navigation and opens the server-selected view.
 *
 * @param {boolean} clearMessages Whether to clear existing feedback.
 * @returns {Promise<void>}
 */
async function loadWorkspace(clearMessages = true) {
	if (clearMessages) clearFeedback();
	loading.value = true;
	try {
		const response = await fetch(`${apiBase}/bootstrap`);
		const data = await response.json();
		if (!response.ok) throw createRequestError(data, response.status);
		applyWorkspace(data);
		await loadView(data.workspace.selectedViewId, false);
	} catch (requestError) {
		errorMessage.value = requestError.message || 'Unable to load saved views.';
	} finally {
		loading.value = false;
	}
}

/**
 * Loads one saved view with its current server-evaluated results.
 *
 * @param {string} viewId Stable saved-view identifier.
 * @param {boolean} moveToResults Whether compact layouts should open results.
 * @returns {Promise<void>}
 */
async function loadView(viewId, moveToResults = true) {
	if (!viewId) return;
	clearFeedback();
	detailLoading.value = true;
	try {
		const response = await fetch(`${apiBase}/views/${viewId}`);
		const data = await response.json();
		if (!response.ok) throw createRequestError(data, response.status);
		selectedView.value = data.view;
		results.value = data.preview;
		if (workspace.value) {
			workspace.value.revision = data.workspaceRevision;
			workspace.value.selectedViewId = viewId;
		}
		syncDraft(data.view);
		activeTab.value = 'results';
		resultSearch.value = '';
		if (moveToResults) activeView.value = 'results';
	} catch (requestError) {
		errorMessage.value = requestError.message || 'Unable to load this saved view.';
	} finally {
		detailLoading.value = false;
	}
}

/**
 * Applies workspace summaries and catalogs from an authoritative API response.
 *
 * @param {Record<string, unknown>} data Workspace payload.
 * @returns {void}
 */
function applyWorkspace(data) {
	workspace.value = data.workspace;
	views.value = data.views || [];
	catalogs.value = data.catalog || catalogs.value;
}

/**
 * Copies a persisted view into the editable draft without invalidating previews.
 *
 * @param {Record<string, unknown>} view Saved-view detail.
 * @returns {void}
 */
function syncDraft(view) {
	syncingDraft.value = true;
	draft.name = view.name || '';
	draft.description = view.description || '';
	draft.visibility = view.visibility || 'personal';
	draft.teamIds = [...(view.teamIds || [])];
	draft.matchMode = view.matchMode || 'all';
	draft.alertMode = view.alertMode || 'none';
	draft.favorite = view.favorite === true;
	draft.rules = (view.rules || []).map((rule) => ({ ...rule, values: [...(rule.values || [])] }));
	exactPreview.value = null;
	saveReceipt.value = null;
	previewAcknowledged.value = false;
	fieldErrors.value = {};
	requestAnimationFrame(() => {
		syncingDraft.value = false;
	});
}

/**
 * Starts a new saved-view draft with a useful launch-work condition.
 *
 * @returns {void}
 */
function startNewView() {
	clearFeedback();
	selectedView.value = {
		id: 'new',
		version: 0,
		name: 'New saved view',
		description: '',
		ownerName: workspace.value?.operator?.name || 'Maya Chen',
		visibility: 'personal',
		teamIds: [],
		matchMode: 'all',
		alertMode: 'none',
		favorite: true,
		rules: [],
		activity: [],
		capabilities: { canEdit: true, canShare: true },
	};
	results.value = { count: 0, points: 0, query: 'Preview the draft to evaluate matching work.', queryCost: 'low', rows: [], statusCounts: {} };
	syncDraft({
		...selectedView.value,
		name: 'Launch follow-up',
		description: 'A focused view for launch work that needs follow-up.',
		rules: [{ id: `rule_${Date.now()}`, field: 'labels', operator: 'includes_any', values: ['launch'] }],
	});
	activeView.value = 'builder';
}

/**
 * Requests a server-evaluated, immutable preview for the current draft.
 *
 * @returns {Promise<void>}
 */
async function previewChanges() {
	clearFeedback();
	busyAction.value = 'preview';
	try {
		const data = await postJson(`${apiBase}/views/${currentViewId.value}/preview`, exactPayload({ draft: draftPayload.value }));
		exactPreview.value = data.preview;
		results.value = data.preview;
		previewAcknowledged.value = false;
		successMessage.value = `${data.preview.count} matching issues evaluated against the exact query.`;
	} catch (requestError) {
		handleRequestError(requestError);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Commits the acknowledged exact preview as a new or updated saved view.
 *
 * @returns {Promise<void>}
 */
async function saveView() {
	if (!exactPreview.value) return;
	clearFeedback();
	busyAction.value = 'save';
	try {
		const data = await postJson(`${apiBase}/views/${currentViewId.value}/save`, exactPayload({
			previewChecksum: exactPreview.value.checksum,
			acknowledged: previewAcknowledged.value,
		}));
		applyWorkspace(data);
		selectedView.value = data.view;
		results.value = data.preview;
		exactPreview.value = null;
		previewAcknowledged.value = false;
		syncDraft(data.view);
		saveReceipt.value = data.receipt;
		successMessage.value = `Saved ${data.view.name} with audit receipt ${data.receipt.auditReceipt}.`;
		activeView.value = 'builder';
	} catch (requestError) {
		handleRequestError(requestError);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Toggles the favorite state using exact optimistic-concurrency values.
 *
 * @returns {Promise<void>}
 */
async function toggleFavorite() {
	if (!selectedView.value || isNewView.value) return;
	clearFeedback();
	busyAction.value = 'favorite';
	try {
		const data = await postJson(`${apiBase}/views/${selectedView.value.id}/favorite`, exactPayload({ favorite: !selectedView.value.favorite }));
		applyWorkspace(data);
		selectedView.value = data.view;
		results.value = data.preview;
		syncDraft(data.view);
		successMessage.value = data.view.favorite ? 'Added this view to favorites.' : 'Removed this view from favorites.';
	} catch (requestError) {
		handleRequestError(requestError);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Restores the deterministic saved-filter demonstration state.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	clearFeedback();
	busyAction.value = 'reset';
	try {
		const data = await postJson(`${apiBase}/reset`, {});
		applyWorkspace(data);
		await loadView(data.workspace.selectedViewId, false);
		successMessage.value = 'Saved-view demo reset.';
	} catch (requestError) {
		handleRequestError(requestError);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Adds one valid filter condition using the first field not already in the query.
 *
 * @returns {void}
 */
function addRule() {
	const usedFields = new Set(draft.rules.map((rule) => rule.field));
	const field = catalogs.value.fields.find((candidate) => !usedFields.has(candidate.value)) || catalogs.value.fields[0];
	if (!field) return;
	draft.rules.push({
		id: `rule_${Date.now()}`,
		field: field.value,
		operator: field.operators[0]?.value || 'is_any_of',
		values: field.values[0] ? [field.values[0].value] : [],
	});
}

/**
 * Removes one filter condition while preserving at least one editable row.
 *
 * @param {string} ruleId Stable client rule identifier.
 * @returns {void}
 */
function removeRule(ruleId) {
	if (draft.rules.length <= 1) return;
	draft.rules = draft.rules.filter((rule) => rule.id !== ruleId);
}

/**
 * Resets dependent operator and value choices after a field changes.
 *
 * @param {Record<string, unknown>} rule Editable rule.
 * @param {string} fieldId New field identifier.
 * @returns {void}
 */
function updateRuleField(rule, fieldId) {
	const field = fieldConfig(fieldId);
	if (!field) return;
	rule.field = field.value;
	rule.operator = field.operators[0]?.value || 'is_any_of';
	rule.values = field.values[0] ? [field.values[0].value] : [];
}

/**
 * Returns the catalog definition for one filter field.
 *
 * @param {string} fieldId Field identifier.
 * @returns {Record<string, unknown> | null} Field definition.
 */
function fieldConfig(fieldId) {
	return catalogs.value.fields.find((field) => field.value === fieldId) || null;
}

/**
 * Returns allowed operators for one editable rule.
 *
 * @param {Record<string, unknown>} rule Editable rule.
 * @returns {Array<Record<string, unknown>>} Operator options.
 */
function operatorOptions(rule) {
	return fieldConfig(rule.field)?.operators || [];
}

/**
 * Returns allowed values for one editable rule.
 *
 * @param {Record<string, unknown>} rule Editable rule.
 * @returns {Array<Record<string, unknown>>} Value options.
 */
function valueOptions(rule) {
	return fieldConfig(rule.field)?.values || [];
}

/**
 * Builds exact workspace and view revision values for one mutation.
 *
 * @param {Record<string, unknown>} extra Additional request values.
 * @returns {Record<string, unknown>} Mutation payload.
 */
function exactPayload(extra = {}) {
	return {
		workspaceRevision: workspace.value?.revision,
		viewVersion: isNewView.value ? 0 : selectedView.value?.version,
		...extra,
	};
}

/**
 * Sends one JSON POST request and converts API errors into structured exceptions.
 *
 * @param {string} path API endpoint.
 * @param {Record<string, unknown>} body JSON request body.
 * @returns {Promise<Record<string, unknown>>} Parsed response body.
 */
async function postJson(path, body) {
	const response = await fetch(path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	const data = await response.json();
	if (!response.ok) throw createRequestError(data, response.status);
	return data;
}

/**
 * Handles validation, revision conflicts, and ordinary request failures.
 *
 * @param {Error & { status?: number, fields?: Record<string, string[]> }} requestError Request error.
 * @returns {void}
 */
function handleRequestError(requestError) {
	fieldErrors.value = requestError.fields || {};
	errorMessage.value = requestError.message || 'Unable to update this saved view.';
	if (requestError.status === 409) reloadAfterConflict();
}

/**
 * Reloads the current view after an optimistic-concurrency conflict.
 *
 * @returns {Promise<void>}
 */
async function reloadAfterConflict() {
	if (isNewView.value) {
		await loadWorkspace(false);
		return;
	}
	const response = await fetch(`${apiBase}/bootstrap`);
	const data = await response.json();
	if (response.ok) applyWorkspace(data);
	await loadView(selectedView.value.id, false);
}

/**
 * Creates a request error with status and field-level validation metadata.
 *
 * @param {Record<string, unknown>} data API error body.
 * @param {number} status HTTP status code.
 * @returns {Error & { status?: number, fields?: Record<string, string[]> }} Request error.
 */
function createRequestError(data, status) {
	const requestError = new Error(data.message || data.error || `Request failed with status ${status}.`);
	requestError.status = status;
	requestError.fields = data.fields || {};
	return requestError;
}

/**
 * Clears visible feedback and field errors.
 *
 * @returns {void}
 */
function clearFeedback() {
	errorMessage.value = '';
	successMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Maps issue status to a semantic status-pill tone.
 *
 * @param {string} status Stored issue status.
 * @returns {string} DOM Studio tone.
 */
function statusTone(status) {
	return {
		backlog: 'neutral',
		todo: 'info',
		in_progress: 'primary',
		blocked: 'danger',
		done: 'success',
	}[status] || 'neutral';
}

/**
 * Maps issue priority to a semantic badge tone.
 *
 * @param {string} priority Stored issue priority.
 * @returns {string} DOM Studio tone.
 */
function priorityTone(priority) {
	return {
		urgent: 'danger',
		high: 'warning',
		medium: 'info',
		low: 'neutral',
	}[priority] || 'neutral';
}
</script>

<template>
	<DomAppShell variant="app" class="!h-dvh bg-canvas text-canvas-fg">
		<template #top>
			<DomAppTopBar
				title="Saved views"
				:subtitle="workspace ? `${workspace.counts.total} views · ${workspace.counts.shared} shared` : 'Issue workspace'"
			>
				<template #leading>
					<div class="grid size-9 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-fg" aria-hidden="true">NV</div>
				</template>
				<template #trailing>
					<DomBadge v-if="workspace" class="!hidden sm:!inline-flex" tone="neutral" variant="outline">r{{ workspace.revision }}</DomBadge>
					<DomButton class="!hidden sm:!inline-flex" size="sm" variant="secondary" :loading="busyAction === 'reset'" @click="resetWorkspace">Reset demo</DomButton>
				</template>
			</DomAppTopBar>
		</template>

		<div class="relative h-full min-h-0 overflow-hidden">
			<div v-if="errorMessage || successMessage" class="absolute inset-x-3 top-3 z-20 mx-auto max-w-2xl">
				<DomAlert v-if="errorMessage" tone="danger" variant="toast" title="Saved view needs attention" :description="errorMessage" dismissible @dismiss="errorMessage = ''" />
				<DomAlert v-else tone="success" variant="toast" title="Saved view updated" :description="successMessage" dismissible @dismiss="successMessage = ''" />
			</div>

			<div v-if="loading" class="grid h-full xl:grid-cols-[16rem_minmax(0,1fr)_23rem]">
				<div v-for="column in 3" :key="column" class="space-y-3 border-r border-border p-4 last:border-r-0">
					<DomSkeleton height="h-10" width="w-2/3" />
					<DomSkeleton v-for="row in 7" :key="row" height="h-14" />
				</div>
			</div>

			<DomEmptyState v-else-if="!workspace || !selectedView" title="Saved views unavailable" description="Reload the repository-local API to restore the issue workspace.">
				<DomButton @click="loadWorkspace">Reload workspace</DomButton>
			</DomEmptyState>

			<div v-else class="grid h-full min-h-0 grid-cols-1 overflow-hidden xl:grid-cols-[16rem_minmax(0,1fr)_23rem]">
				<aside
					class="h-full min-h-0 overflow-y-auto border-r border-border bg-muted/10"
					:class="activeView === 'views' ? 'block' : 'hidden xl:block'"
					aria-label="Saved views"
				>
					<div class="border-b border-border p-3">
						<div class="flex items-center justify-between gap-3">
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Issue views</p>
							<DomButton size="sm" variant="ghost" @click="startNewView">New</DomButton>
						</div>
						<DomTextInput v-model="viewSearch" class="mt-3" label="Find a view" placeholder="Name, owner, audience…" />
					</div>

					<section class="py-3" aria-labelledby="favorite-views-heading">
						<div class="flex items-center justify-between px-4">
							<h2 id="favorite-views-heading" class="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-fg">Favorites</h2>
							<span class="text-[11px] text-muted-fg">{{ favoriteViews.length }}</span>
						</div>
						<div class="mt-2">
							<button
								v-for="view in favoriteViews"
								:key="view.id"
								type="button"
								class="w-full border-l-2 px-4 py-3 text-left transition hover:bg-secondary/45 focus-visible:outline-2 focus-visible:outline-ring"
								:class="view.id === selectedView.id ? 'border-l-primary bg-secondary/55' : 'border-l-transparent'"
								@click="loadView(view.id)"
							>
								<div class="flex items-start justify-between gap-3">
									<p class="min-w-0 truncate text-sm font-semibold">{{ view.name }}</p>
									<span class="shrink-0 font-mono text-[11px] text-muted-fg">{{ view.matchCount }}</span>
								</div>
								<p class="mt-1 truncate text-[11px] text-muted-fg">{{ view.visibilityLabel }} · {{ view.updatedLabel }}</p>
							</button>
						</div>
					</section>

					<section v-if="workspaceViews.length" class="border-t border-border py-3" aria-labelledby="workspace-views-heading">
						<div class="flex items-center justify-between px-4">
							<h2 id="workspace-views-heading" class="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-fg">Other views</h2>
							<span class="text-[11px] text-muted-fg">{{ workspaceViews.length }}</span>
						</div>
						<div class="mt-2">
							<button
								v-for="view in workspaceViews"
								:key="view.id"
								type="button"
								class="w-full border-l-2 px-4 py-3 text-left transition hover:bg-secondary/45 focus-visible:outline-2 focus-visible:outline-ring"
								:class="view.id === selectedView.id ? 'border-l-primary bg-secondary/55' : 'border-l-transparent'"
								@click="loadView(view.id)"
							>
								<div class="flex items-start justify-between gap-3"><p class="min-w-0 truncate text-sm font-semibold">{{ view.name }}</p><span class="font-mono text-[11px] text-muted-fg">{{ view.matchCount }}</span></div>
								<p class="mt-1 truncate text-[11px] text-muted-fg">{{ view.ownerName }} · {{ view.visibilityLabel }}</p>
							</button>
						</div>
					</section>

					<DomEmptyState v-if="!filteredViews.length" compact title="No matching views" description="Try another name, owner, or audience." />
					<div class="border-t border-border p-3 sm:hidden"><DomButton class="w-full" variant="ghost" :loading="busyAction === 'reset'" @click="resetWorkspace">Reset demo</DomButton></div>
				</aside>

				<main
					class="flex h-full min-h-0 flex-col overflow-hidden"
					:class="activeView === 'results' ? 'flex' : 'hidden xl:flex'"
					aria-labelledby="saved-view-heading"
				>
					<div v-if="detailLoading" class="grid h-full place-items-center p-6"><div class="w-full max-w-2xl space-y-4"><DomSkeleton height="h-9" width="w-2/3" /><DomSkeleton height="h-16" /><DomSkeleton v-for="row in 6" :key="row" height="h-12" /></div></div>
					<template v-else>
						<header class="shrink-0 border-b border-border px-4 py-4 sm:px-6">
							<div class="flex flex-wrap items-start justify-between gap-4">
								<div class="min-w-0 flex-1">
									<div class="flex flex-wrap items-center gap-2">
										<DomBadge :tone="isNewView ? 'warning' : 'neutral'" :variant="isNewView ? 'soft' : 'outline'">{{ isNewView ? 'Unsaved' : selectedView.visibilityLabel }}</DomBadge>
										<DomBadge v-if="!isNewView" tone="neutral" variant="outline">v{{ selectedView.version }}</DomBadge>
										<DomBadge v-if="hasDraftChanges" tone="warning" variant="soft">Draft changes</DomBadge>
									</div>
									<h1 id="saved-view-heading" class="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{{ draft.name || selectedView.name }}</h1>
									<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">{{ draft.description || selectedView.description }}</p>
								</div>
								<div class="flex shrink-0 items-center gap-2">
									<DomButton v-if="!isNewView" size="sm" variant="ghost" :loading="busyAction === 'favorite'" @click="toggleFavorite">{{ selectedView.favorite ? 'Unfavorite' : 'Favorite' }}</DomButton>
									<DomButton size="sm" variant="secondary" @click="activeView = 'builder'">Edit query</DomButton>
								</div>
							</div>
						</header>

						<section class="shrink-0 border-b border-border px-4 py-3 sm:px-6" aria-label="Active query">
							<div class="flex flex-wrap items-center gap-2">
								<span class="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ draft.matchMode === 'all' ? 'All' : 'Any' }}</span>
								<DomBadge v-for="rule in draft.rules" :key="rule.id" tone="neutral" variant="outline">
									{{ fieldConfig(rule.field)?.label }} {{ operatorOptions(rule).find((option) => option.value === rule.operator)?.label }} {{ rule.values.map((value) => valueOptions(rule).find((option) => option.value === value)?.label || value).join(', ') }}
								</DomBadge>
							</div>
						</section>

						<DomTabs v-model="activeTab" :tabs="resultTabs" variant="page" fill class="min-h-0 flex-1">
							<template #results>
								<div class="flex h-full min-h-0 flex-col overflow-hidden">
									<div class="grid shrink-0 gap-3 border-b border-border px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
										<DomTextInput v-model="resultSearch" label="Search these results" placeholder="Issue, project, assignee, label…" />
										<div class="flex items-center gap-5 text-right text-sm">
											<div><p class="font-semibold">{{ results.count }}</p><p class="text-[11px] text-muted-fg">Issues</p></div>
											<div><p class="font-semibold">{{ results.points }}</p><p class="text-[11px] text-muted-fg">Points</p></div>
											<div><p class="font-semibold capitalize">{{ results.queryCost }}</p><p class="text-[11px] text-muted-fg">Query cost</p></div>
										</div>
									</div>

									<div v-if="visibleRows.length" class="min-h-0 flex-1 overflow-y-auto">
										<div class="hidden grid-cols-[5rem_minmax(10rem,1fr)_7rem_6rem] gap-3 border-b border-border bg-muted/15 px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-fg md:grid 2xl:grid-cols-[6rem_minmax(12rem,1fr)_8rem_7rem_6rem]">
											<span>Issue</span><span>Title</span><span>Assignee</span><span>Status</span><span class="hidden text-right 2xl:block">Updated</span>
										</div>
										<button
											v-for="issue in visibleRows"
											:key="issue.id"
											type="button"
											class="grid w-full gap-3 border-b border-border px-4 py-4 text-left transition hover:bg-secondary/35 focus-visible:outline-2 focus-visible:outline-ring sm:px-6 md:grid-cols-[5rem_minmax(10rem,1fr)_7rem_6rem] md:items-center md:py-3 2xl:grid-cols-[6rem_minmax(12rem,1fr)_8rem_7rem_6rem]"
										>
											<div class="flex items-center justify-between gap-3 md:block"><span class="font-mono text-xs text-muted-fg">{{ issue.id }}</span><div class="md:mt-2"><DomBadge :tone="priorityTone(issue.priority)" size="sm">{{ issue.priorityLabel }}</DomBadge></div></div>
											<div class="min-w-0"><p class="truncate text-sm font-semibold">{{ issue.title }}</p><p class="mt-1 truncate text-xs text-muted-fg">{{ issue.project }} · {{ issue.teamLabel }} · {{ issue.cycleLabel }}</p></div>
											<p class="text-xs text-muted-fg">{{ issue.assigneeLabel }}</p>
											<DomStatusPill :tone="statusTone(issue.status)" size="sm">{{ issue.statusLabel }}</DomStatusPill>
											<p class="hidden text-right font-mono text-[11px] text-muted-fg 2xl:block">{{ issue.updated }}</p>
										</button>
									</div>
									<DomEmptyState v-else compact title="No matching issues" description="Adjust the result search or preview a broader query." />
								</div>
							</template>

							<template #activity>
								<div class="h-full min-h-0 overflow-y-auto px-4 py-2 sm:px-6">
									<div v-if="selectedView.activity?.length" class="divide-y divide-border">
										<div v-for="event in selectedView.activity" :key="event.id" class="grid grid-cols-[6rem_minmax(0,1fr)] gap-4 py-5">
											<p class="font-mono text-[11px] text-muted-fg">{{ event.time }}</p>
											<div><p class="text-sm font-semibold">{{ event.title }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p><p class="mt-2 text-[11px] text-muted-fg">{{ event.actor }}</p></div>
										</div>
									</div>
									<DomEmptyState v-else compact title="No saved activity" description="The first save will create an immutable view event." />
								</div>
							</template>
						</DomTabs>
					</template>
				</main>

				<aside
					class="flex h-full min-h-0 flex-col overflow-hidden border-l border-border bg-muted/10"
					:class="activeView === 'builder' ? 'flex' : 'hidden xl:flex'"
					aria-label="Saved view query editor"
				>
					<header class="shrink-0 border-b border-border px-4 py-4">
						<div class="flex items-start justify-between gap-3">
							<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ exactPreview ? 'Exact preview' : isNewView ? 'Create view' : 'Query editor' }}</p><h2 class="mt-1 text-lg font-semibold">{{ exactPreview ? 'Review before saving' : isNewView ? 'New saved view' : 'Edit this view' }}</h2></div>
							<DomBadge :tone="hasDraftChanges ? 'warning' : 'success'" variant="soft">{{ hasDraftChanges ? 'Unsaved' : 'Saved' }}</DomBadge>
						</div>
					</header>

					<div class="min-h-0 flex-1 overflow-y-auto p-4">
						<template v-if="saveReceipt">
							<DomAlert tone="success" title="View saved" :description="`${saveReceipt.auditReceipt} preserved query version ${saveReceipt.viewVersion}.`" />
							<dl class="mt-4 divide-y divide-border border-y border-border text-sm">
								<div class="py-3"><dt class="text-xs text-muted-fg">Save receipt</dt><dd class="mt-1 font-mono text-xs">{{ saveReceipt.id }}</dd></div>
								<div class="py-3"><dt class="text-xs text-muted-fg">Query checksum</dt><dd class="mt-1 truncate font-mono text-xs">{{ saveReceipt.queryChecksum }}</dd></div>
								<div class="py-3"><dt class="text-xs text-muted-fg">Notifications</dt><dd class="mt-1 font-mono text-xs">{{ saveReceipt.subscriptionReceipt || 'Disabled' }}</dd></div>
							</dl>
							<DomButton class="mt-4 w-full" variant="secondary" @click="saveReceipt = null">Edit again</DomButton>
						</template>

						<template v-else-if="exactPreview">
							<DomAlert tone="info" title="Server-evaluated query" :description="`${exactPreview.count} issues · ${exactPreview.points} points · ${exactPreview.queryCost} query cost.`" />
							<div class="mt-4 border-y border-border py-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Exact query</p><p class="mt-2 break-words font-mono text-xs leading-6">{{ exactPreview.query }}</p><p class="mt-2 truncate font-mono text-[10px] text-muted-fg">{{ exactPreview.checksum }} · view v{{ exactPreview.viewVersion }}</p></div>
							<section class="border-b border-border py-4">
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Readiness</p>
								<div class="mt-3 space-y-3"><div v-for="check in exactPreview.qualityChecks" :key="check.label" class="flex items-center justify-between gap-3 text-sm"><span>{{ check.label }}</span><DomStatusPill :tone="check.passed ? 'success' : 'danger'" size="sm">{{ check.passed ? 'Passed' : 'Review' }}</DomStatusPill></div></div>
							</section>
							<DomCheckbox v-model="previewAcknowledged" class="mt-4" label="Save this exact view" description="I reviewed the query, audience, notification behavior, matching issue count, and immutable view version." :errors="fieldErrors.acknowledged || []" />
							<DomButton class="mt-4 w-full" :disabled="!previewAcknowledged" :loading="busyAction === 'save'" @click="saveView">{{ isNewView ? 'Create saved view' : 'Save exact changes' }}</DomButton>
							<DomButton class="mt-2 w-full" variant="ghost" @click="exactPreview = null">Back to editor</DomButton>
						</template>

						<template v-else>
							<div class="grid gap-4">
								<DomTextInput v-model="draft.name" label="View name" placeholder="Launch risks" :errors="fieldErrors.name || []" />
								<DomTextareaInput v-model="draft.description" label="Purpose" description="Tell teammates what belongs in this view." :rows="3" :errors="fieldErrors.description || []" />
							</div>

							<section class="mt-5 border-t border-border pt-5">
								<div class="flex items-end justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Filter formula</p><p class="mt-1 text-xs text-muted-fg">Server-owned fields and operators</p></div><DomButton size="sm" variant="ghost" :disabled="draft.rules.length >= 6" @click="addRule">Add filter</DomButton></div>
								<DomSelect v-model="draft.matchMode" class="mt-4" label="Condition logic" :options="catalogs.matchModes" :errors="fieldErrors.matchMode || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
								<div class="mt-4 divide-y divide-border border-y border-border">
									<div v-for="(rule, index) in draft.rules" :key="rule.id" class="py-4">
										<div class="mb-3 flex items-center justify-between gap-3"><p class="text-xs font-semibold text-muted-fg">Condition {{ index + 1 }}</p><DomButton size="sm" variant="ghost" :disabled="draft.rules.length === 1" @click="removeRule(rule.id)">Remove</DomButton></div>
										<div class="grid gap-3">
											<DomSelect :model-value="rule.field" label="Field" :options="fieldOptions" :errors="fieldErrors[`rules.${index}.field`] || []" @update:model-value="updateRuleField(rule, $event)"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
											<DomSelect v-model="rule.operator" label="Operator" :options="operatorOptions(rule)" :errors="fieldErrors[`rules.${index}.operator`] || []" />
											<DomTagCombobox v-model="rule.values" label="Values" placeholder="Choose one or more…" :options="valueOptions(rule)" :errors="fieldErrors[`rules.${index}.values`] || []" clearable />
										</div>
									</div>
								</div>
								<p v-for="message in fieldErrors.rules || []" :key="message" class="mt-2 text-xs text-destructive">{{ message }}</p>
							</section>

							<section class="mt-5 border-t border-border pt-5">
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Audience and updates</p>
								<div class="mt-4 grid gap-4">
									<DomSelect v-model="draft.visibility" label="Discoverability" :options="catalogs.visibility" :errors="fieldErrors.visibility || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
									<DomTagCombobox v-if="draft.visibility === 'teams'" v-model="draft.teamIds" label="Teams with access" placeholder="Add teams…" :options="catalogs.teams" :errors="fieldErrors.teamIds || []" clearable />
									<DomSelect v-model="draft.alertMode" label="Subscriber updates" :options="catalogs.alerts" :errors="fieldErrors.alertMode || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
									<DomToggle v-model="draft.favorite" label="Favorite this view" description="Keep it in the top group of personal navigation." />
								</div>
							</section>

							<section class="mt-5 border-t border-border pt-5">
								<div class="flex items-center justify-between text-sm"><span class="text-muted-fg">Draft completeness</span><span class="font-semibold">{{ completion }}%</span></div>
								<DomProgress class="mt-2" :value="completion" size="sm" :tone="completion === 100 ? 'success' : 'primary'" />
								<DomButton class="mt-4 w-full" :loading="busyAction === 'preview'" @click="previewChanges">Preview exact query</DomButton>
							</section>
						</template>
					</div>
				</aside>
			</div>
		</div>

		<template #bottom>
			<DomAppBottomNav v-model="activeView" :items="mobileNavigation" class="xl:hidden" />
		</template>
	</DomAppShell>
</template>
