<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
	DomAlert,
	DomAppBottomNav,
	DomAppShell,
	DomAppTopBar,
	DomAvatar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomEmptyState,
	DomNumberInput,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';
import { builtInIconSelectorItems } from '../../../../forms/icon-selector/iconSelectorItems.js';

const apiBase = '/api/block-demos/roadmap-timeline';
const navigationIcons = {
	timeline: iconPath('Calendar'),
	detail: iconPath('Dashboard'),
	release: iconPath('Rocket'),
};

const workspace = ref(null);
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const fieldErrors = ref({});
const selectedInitiativeId = ref('initiative_event_stream');
const activeMobileView = ref('timeline');
const viewFilter = ref('portfolio');
const searchQuery = ref('');
const showDependencies = ref(true);
const createOpen = ref(false);
const editOpen = ref(false);
const moveOpen = ref(false);
const updateOpen = ref(false);
const publishOpen = ref(false);
const resetOpen = ref(false);
const movePreview = ref(null);
const publishPreview = ref(null);
const moveAcknowledged = ref(false);
const publishAcknowledged = ref(false);
const createDraft = reactive({
	title: 'Workspace approval policies',
	summary: 'Give security teams reusable approval rules for high-risk workspace changes.',
	teamId: 'platform',
	ownerId: 'usr_noah',
	objectiveId: 'obj_enterprise',
	status: 'shaping',
	health: 'on-track',
	startPeriod: '2027-q2',
	endPeriod: '2027-q3',
	confidence: 64,
	customers: 14,
	revenue: 72000,
});
const editDraft = reactive({
	title: '',
	summary: '',
	teamId: '',
	ownerId: '',
	objectiveId: '',
	status: '',
	health: '',
	startPeriod: '',
	endPeriod: '',
	confidence: 0,
});
const visibilityDraft = reactive({
	product: true,
	executives: true,
	'go-to-market': false,
	customers: false,
});
const moveDraft = reactive({ startPeriod: '2026-q3', endPeriod: '2026-q4' });
const updateDraft = reactive({
	health: 'at-risk',
	progress: 52,
	audience: 'stakeholders',
	summary: 'Schema review is now scheduled and the reduced launch scope still protects the target window.',
	notify: true,
});
const publishDraft = reactive({ audience: 'executives', endPeriod: '2027-q2' });

const selectedInitiative = computed(() => workspace.value?.initiatives.find((initiative) => initiative.id === selectedInitiativeId.value) || workspace.value?.initiatives[0] || null);
const filteredInitiatives = computed(getFilteredInitiatives);
const visibleTeams = computed(() => (workspace.value?.catalog.teams || []).filter((team) => filteredInitiatives.value.some((initiative) => initiative.teamId === team.value)));
const mobilePeriodGroups = computed(getMobilePeriodGroups);
const mobileNavigation = computed(() => [
	{ value: 'timeline', label: 'Roadmap', iconPath: navigationIcons.timeline, badge: String(filteredInitiatives.value.length) },
	{ value: 'detail', label: 'Details', iconPath: navigationIcons.detail, badge: selectedInitiative.value?.health === 'on-track' ? '' : '!' },
	{ value: 'release', label: 'Release', iconPath: navigationIcons.release, badge: workspace.value?.publications.length ? String(workspace.value.publications.length) : '' },
]);

onMounted(loadWorkspace);

/**
 * Resolves an icon from DOM Studio's built-in icon inventory.
 *
 * @param {string} label Built-in icon label.
 * @returns {string} SVG path data accepted by DOM Studio icon components.
 */
function iconPath(label) {
	return builtInIconSelectorItems.find((item) => item.label === label)?.path || '';
}

/**
 * Loads the authoritative roadmap workspace from its repository-local API.
 *
 * @param {boolean} clearMessages Whether transient feedback should be cleared.
 * @returns {Promise<void>}
 */
async function loadWorkspace(clearMessages = true) {
	if (clearMessages) clearFeedback();
	loading.value = true;
	try {
		const data = await request('/bootstrap');
		setWorkspace(data);
	} catch (requestError) {
		error.value = requestError.message || 'Unable to load the portfolio roadmap.';
	} finally {
		loading.value = false;
	}
}

/**
 * Performs one JSON request against the roadmap demo API.
 *
 * @param {string} path API path below the roadmap base URL.
 * @param {Record<string, unknown>} [options] Fetch options and optional body.
 * @returns {Promise<Record<string, unknown>>} Parsed API response.
 */
async function request(path, options = {}) {
	const response = await fetch(`${apiBase}${path}`, {
		method: options.method || 'GET',
		headers: options.body ? { 'content-type': 'application/json' } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const data = await response.json();
	if (!response.ok) throw createRequestError(data, response.status);
	return data;
}

/**
 * Sends a roadmap mutation with shared busy, validation, and conflict handling.
 *
 * @param {string} path Mutation API path.
 * @param {string} method HTTP method.
 * @param {Record<string, unknown>} body JSON request body.
 * @param {string} action Stable busy-state key.
 * @returns {Promise<Record<string, unknown>|null>} API result or null after failure.
 */
async function mutate(path, method, body, action) {
	clearFeedback();
	busyAction.value = action;
	try {
		const data = await request(path, { method, body });
		if (data.initiatives) setWorkspace(data);
		return data;
	} catch (requestError) {
		error.value = requestError.message || 'The roadmap action could not be completed.';
		fieldErrors.value = requestError.fieldErrors || {};
		if (requestError.status === 409) await refreshAfterConflict();
		return null;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Refreshes authoritative workspace state after an optimistic conflict.
 *
 * @returns {Promise<void>}
 */
async function refreshAfterConflict() {
	try {
		setWorkspace(await request('/bootstrap'));
	} catch {
		// Preserve the original conflict when recovery also fails.
	}
}

/**
 * Replaces workspace state while preserving a valid initiative selection.
 *
 * @param {Record<string, unknown>} data Authoritative roadmap workspace.
 * @returns {void}
 */
function setWorkspace(data) {
	workspace.value = data;
	const requestedId = data.selectedInitiativeId || selectedInitiativeId.value;
	selectedInitiativeId.value = data.initiatives.some((initiative) => initiative.id === requestedId) ? requestedId : data.initiatives[0]?.id || '';
}

/**
 * Selects an initiative and opens its details on compact layouts.
 *
 * @param {string} initiativeId Initiative identifier.
 * @returns {void}
 */
function selectInitiative(initiativeId) {
	selectedInitiativeId.value = initiativeId;
	activeMobileView.value = 'detail';
}

/**
 * Creates a new portfolio initiative through the API.
 *
 * @returns {Promise<void>}
 */
async function createInitiative() {
	if (!workspace.value) return;
	const data = await mutate('/initiatives', 'POST', { revision: workspace.value.revision, ...createDraft }, 'create');
	if (!data) return;
	createOpen.value = false;
	selectedInitiativeId.value = data.selectedInitiativeId;
	activeMobileView.value = 'detail';
	notice.value = `Initiative created with ${data.receipt.id}.`;
}

/**
 * Opens the planning editor with the initiative's current API values.
 *
 * @returns {void}
 */
function openEdit() {
	if (!selectedInitiative.value) return;
	fieldErrors.value = {};
	Object.assign(editDraft, {
		title: selectedInitiative.value.title,
		summary: selectedInitiative.value.summary,
		teamId: selectedInitiative.value.teamId,
		ownerId: selectedInitiative.value.ownerId,
		objectiveId: selectedInitiative.value.objectiveId,
		status: selectedInitiative.value.status,
		health: selectedInitiative.value.health,
		startPeriod: selectedInitiative.value.startPeriod,
		endPeriod: selectedInitiative.value.endPeriod,
		confidence: selectedInitiative.value.confidence,
	});
	for (const audience of workspace.value.catalog.audiences) visibilityDraft[audience.value] = selectedInitiative.value.visibility.includes(audience.value);
	editOpen.value = true;
}

/**
 * Persists exact initiative planning properties and audience visibility.
 *
 * @returns {Promise<void>}
 */
async function saveInitiative() {
	if (!workspace.value || !selectedInitiative.value) return;
	const visibility = workspace.value.catalog.audiences.filter((audience) => visibilityDraft[audience.value]).map((audience) => audience.value);
	const data = await mutate(`/initiatives/${selectedInitiative.value.id}`, 'PATCH', {
		revision: workspace.value.revision,
		initiativeVersion: selectedInitiative.value.version,
		...editDraft,
		visibility,
	}, 'edit');
	if (!data) return;
	editOpen.value = false;
	notice.value = `Planning state saved with ${data.receipt.id}.`;
}

/**
 * Opens the schedule workflow with the initiative's current planning window.
 *
 * @returns {void}
 */
function openMove() {
	if (!selectedInitiative.value) return;
	fieldErrors.value = {};
	moveDraft.startPeriod = selectedInitiative.value.startPeriod;
	moveDraft.endPeriod = selectedInitiative.value.endPeriod;
	movePreview.value = null;
	moveAcknowledged.value = false;
	moveOpen.value = true;
}

/**
 * Previews dependency and team-capacity impact for a schedule change.
 *
 * @returns {Promise<void>}
 */
async function previewMove() {
	if (!workspace.value || !selectedInitiative.value) return;
	const data = await mutate(`/initiatives/${selectedInitiative.value.id}/move-preview`, 'POST', {
		revision: workspace.value.revision,
		initiativeVersion: selectedInitiative.value.version,
		...moveDraft,
	}, 'move-preview');
	if (data) movePreview.value = data.preview;
}

/**
 * Commits the exact schedule preview after risk acknowledgement.
 *
 * @returns {Promise<void>}
 */
async function commitMove() {
	if (!workspace.value || !selectedInitiative.value || !movePreview.value) return;
	const data = await mutate(`/initiatives/${selectedInitiative.value.id}/move`, 'POST', {
		previewId: movePreview.value.id,
		acknowledged: moveAcknowledged.value,
	}, 'move');
	if (!data) return;
	moveOpen.value = false;
	movePreview.value = null;
	notice.value = `Schedule committed with ${data.receipt.id}.`;
}

/**
 * Opens the health-update composer with current initiative values.
 *
 * @returns {void}
 */
function openUpdate() {
	if (!selectedInitiative.value) return;
	fieldErrors.value = {};
	updateDraft.health = selectedInitiative.value.health;
	updateDraft.progress = selectedInitiative.value.progress;
	updateDraft.audience = 'stakeholders';
	updateDraft.notify = true;
	updateOpen.value = true;
}

/**
 * Posts an initiative health update and optional stakeholder notification.
 *
 * @returns {Promise<void>}
 */
async function postUpdate() {
	if (!workspace.value || !selectedInitiative.value) return;
	const data = await mutate(`/initiatives/${selectedInitiative.value.id}/updates`, 'POST', {
		revision: workspace.value.revision,
		initiativeVersion: selectedInitiative.value.version,
		...updateDraft,
	}, 'update');
	if (!data) return;
	updateOpen.value = false;
	const delivery = data.update.notification ? ` ${data.update.notification.recipients} stakeholders notified.` : '';
	notice.value = `Health update posted.${delivery}`;
}

/**
 * Opens the audience publication workflow with a fresh preview state.
 *
 * @returns {void}
 */
function openPublish() {
	fieldErrors.value = {};
	publishPreview.value = null;
	publishAcknowledged.value = false;
	publishOpen.value = true;
}

/**
 * Builds an immutable audience-specific publication preview.
 *
 * @returns {Promise<void>}
 */
async function previewPublication() {
	if (!workspace.value) return;
	const data = await mutate('/publish-preview', 'POST', { revision: workspace.value.revision, ...publishDraft }, 'publish-preview');
	if (data) publishPreview.value = data.preview;
}

/**
 * Publishes the exact roadmap preview and records its receipt.
 *
 * @returns {Promise<void>}
 */
async function publishRoadmap() {
	if (!publishPreview.value) return;
	const data = await mutate('/publish', 'POST', { previewId: publishPreview.value.id, acknowledged: publishAcknowledged.value }, 'publish');
	if (!data) return;
	publishOpen.value = false;
	publishPreview.value = null;
	activeMobileView.value = 'release';
	notice.value = `Roadmap released with ${data.receipt.id}.`;
}

/**
 * Restores the deterministic roadmap workspace.
 *
 * @returns {Promise<void>}
 */
async function resetDemo() {
	const data = await mutate('/reset', 'POST', {}, 'reset');
	if (!data) return;
	resetOpen.value = false;
	selectedInitiativeId.value = 'initiative_event_stream';
	activeMobileView.value = 'timeline';
	notice.value = 'The seeded portfolio roadmap has been restored.';
}

/**
 * Filters initiatives by saved view and search query.
 *
 * @returns {Array<Record<string, unknown>>} Visible initiatives.
 */
function getFilteredInitiatives() {
	if (!workspace.value) return [];
	const query = searchQuery.value.trim().toLowerCase();
	return workspace.value.initiatives.filter((initiative) => {
		if (viewFilter.value === 'at-risk' && !['at-risk', 'off-track'].includes(initiative.health)) return false;
		if (viewFilter.value === 'needs-update' && initiative.lastUpdateDays <= 14) return false;
		if (viewFilter.value === 'customer-visible' && !initiative.visibility.includes('customers')) return false;
		if (!query) return true;
		return [initiative.title, initiative.summary, initiative.team, initiative.owner, initiative.objective].join(' ').toLowerCase().includes(query);
	});
}

/**
 * Returns visible initiatives for one portfolio team.
 *
 * @param {string} teamId Team identifier.
 * @returns {Array<Record<string, unknown>>} Team initiatives.
 */
function initiativesForTeam(teamId) {
	return filteredInitiatives.value.filter((initiative) => initiative.teamId === teamId).sort((first, second) => periodIndex(first.startPeriod) - periodIndex(second.startPeriod));
}

/**
 * Groups compact-layout initiative cards by their starting period.
 *
 * @returns {Array<Record<string, unknown>>} Period groups.
 */
function getMobilePeriodGroups() {
	if (!workspace.value) return [];
	return workspace.value.catalog.periods.map((period) => ({
		...period,
		initiatives: filteredInitiatives.value.filter((initiative) => initiative.startPeriod === period.value),
	})).filter((period) => period.initiatives.length);
}

/**
 * Builds CSS grid placement for a timeline initiative.
 *
 * @param {Record<string, unknown>} initiative Initiative record.
 * @returns {Record<string, string>} CSS grid placement.
 */
function initiativeStyle(initiative) {
	const start = periodIndex(initiative.startPeriod) + 1;
	const span = Math.max(1, periodIndex(initiative.endPeriod) - periodIndex(initiative.startPeriod) + 1);
	return { gridColumn: `${start} / span ${span}` };
}

/**
 * Returns the zero-based catalog index for a planning period.
 *
 * @param {string} value Period value.
 * @returns {number} Period index.
 */
function periodIndex(value) {
	return workspace.value?.catalog.periods.findIndex((period) => period.value === value) ?? -1;
}

/**
 * Returns semantic status tone from the API catalog.
 *
 * @param {string} collection Catalog collection name.
 * @param {string} value Selected catalog value.
 * @returns {string} DOM Studio tone.
 */
function catalogTone(collection, value) {
	return workspace.value?.catalog[collection]?.find((option) => option.value === value)?.tone || 'neutral';
}

/**
 * Returns static theme classes for a portfolio team.
 *
 * @param {string} color Team color key.
 * @returns {string} Tailwind classes.
 */
function teamColorClass(color) {
	if (color === 'primary') return 'bg-primary text-primary';
	if (color === 'success') return 'bg-success text-success';
	if (color === 'warning') return 'bg-warning text-warning';
	return 'bg-primary text-primary';
}

/**
 * Creates a rich error from an API response.
 *
 * @param {Record<string, unknown>} data Parsed response body.
 * @param {number} status HTTP status.
 * @returns {Error & { status: number, fieldErrors: Record<string, string[]> }} Request error.
 */
function createRequestError(data, status) {
	const requestError = new Error(data.error || `Roadmap API request failed with status ${status}.`);
	requestError.status = status;
	requestError.fieldErrors = data.fieldErrors || {};
	return requestError;
}

/**
 * Clears transient messages and field errors.
 *
 * @returns {void}
 */
function clearFeedback() {
	error.value = '';
	notice.value = '';
	fieldErrors.value = {};
}

/**
 * Formats influenced revenue for compact summaries.
 *
 * @param {number} value Revenue value.
 * @returns {string} Compact GBP value.
 */
function formatCurrency(value) {
	return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
}
</script>

<template>
	<DomAppShell class="!h-dvh bg-canvas text-canvas-fg">
		<template #top>
			<DomAppTopBar
				v-if="workspace"
				class="lg:hidden"
				:title="activeMobileView === 'timeline' ? 'Portfolio roadmap' : activeMobileView === 'detail' ? selectedInitiative?.title || 'Initiative' : 'Roadmap releases'"
				:subtitle="`${workspace.board.fiscalYear} · API revision ${workspace.revision}`"
			>
				<template #trailing><DomButton size="sm" @click="activeMobileView === 'release' ? openPublish() : createOpen = true">{{ activeMobileView === 'release' ? 'Publish' : 'New' }}</DomButton></template>
			</DomAppTopBar>
			<header v-if="workspace" class="hidden h-14 min-w-0 items-center justify-between border-b border-border px-4 lg:flex">
				<div class="flex min-w-0 items-center gap-3">
					<div class="grid size-8 shrink-0 place-items-center bg-canvas-fg text-xs font-bold text-canvas">R</div>
					<div class="min-w-0"><div class="flex items-center gap-2"><h1 class="truncate text-sm font-semibold">{{ workspace.board.name }}</h1><DomBadge tone="neutral" variant="soft">{{ workspace.board.fiscalYear }}</DomBadge></div><p class="mt-0.5 text-[10px] text-muted-fg">{{ workspace.board.description }} · revision {{ workspace.revision }}</p></div>
				</div>
				<div class="flex shrink-0 items-center gap-2"><DomButton size="sm" variant="ghost" @click="resetOpen = true">Reset</DomButton><DomButton size="sm" variant="secondary" @click="openPublish">Publish view</DomButton><DomButton size="sm" @click="createOpen = true">New initiative</DomButton></div>
			</header>
		</template>

		<div v-if="loading" class="grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[13rem_minmax(0,1fr)_20rem]"><DomSkeleton class="hidden h-full rounded-none xl:block" /><DomSkeleton class="h-full rounded-none" /><DomSkeleton class="hidden h-full rounded-none lg:block" /></div>

		<DomEmptyState v-else-if="!workspace" title="Roadmap unavailable" description="Retry the local planning API before continuing the portfolio review."><template #actions><DomButton @click="loadWorkspace">Retry</DomButton></template></DomEmptyState>

		<div v-else class="grid h-full min-h-0 min-w-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[13rem_minmax(0,1fr)_20rem]">
			<aside class="hidden min-h-0 flex-col overflow-hidden border-r border-border bg-secondary/20 xl:flex">
				<div class="border-b border-border p-3">
					<p class="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">Portfolio views</p>
					<nav class="mt-2 grid gap-1" aria-label="Roadmap views">
						<button v-for="view in workspace.catalog.views" :key="view.value" type="button" class="flex items-center justify-between gap-2 px-2 py-2 text-left text-xs transition hover:bg-secondary" :class="viewFilter === view.value ? 'bg-secondary font-semibold' : 'text-muted-fg'" @click="viewFilter = view.value">
							<span>{{ view.label }}</span><span v-if="view.value === 'at-risk'">{{ workspace.summary.atRisk }}</span><span v-else-if="view.value === 'needs-update'">{{ workspace.summary.needsUpdate }}</span><span v-else-if="view.value === 'customer-visible'">{{ workspace.summary.customerCommitments }}</span>
						</button>
					</nav>
				</div>
				<div class="border-b border-border p-4"><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">Portfolio pulse</p><dl class="mt-3 space-y-3 text-xs"><div class="flex justify-between"><dt class="text-muted-fg">Active</dt><dd class="font-semibold">{{ workspace.summary.activeInitiatives }}</dd></div><div class="flex justify-between"><dt class="text-muted-fg">At risk</dt><dd class="font-semibold text-warning">{{ workspace.summary.atRisk }}</dd></div><div class="flex justify-between"><dt class="text-muted-fg">Revenue</dt><dd class="font-semibold">{{ formatCurrency(workspace.summary.influencedRevenue) }}</dd></div></dl></div>
				<div class="min-h-0 flex-1 overflow-y-auto p-4"><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">Recent decisions</p><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="event in workspace.events.slice(0, 6)" :key="event.id" class="py-3"><p class="text-xs font-medium leading-5">{{ event.label }}</p><p class="mt-1 text-[11px] leading-4 text-muted-fg">{{ event.detail }}</p><p class="mt-1 text-[10px] text-muted-fg">{{ event.actor }} · {{ event.time }}</p></div></div></div>
				<div class="border-t border-border p-4"><div class="flex items-center gap-3"><DomAvatar :name="workspace.currentOperator.name" :initials="workspace.currentOperator.initials" size="sm" /><div class="min-w-0"><p class="truncate text-xs font-semibold">{{ workspace.currentOperator.name }}</p><p class="mt-0.5 truncate text-[10px] text-muted-fg">{{ workspace.currentOperator.role }}</p></div></div></div>
			</aside>

			<section class="min-h-0 min-w-0 flex-col overflow-hidden border-r border-border" :class="activeMobileView === 'timeline' ? 'flex' : 'hidden lg:flex'">
				<DomAlert v-if="error" class="m-3 shrink-0" tone="danger" variant="soft" title="Roadmap action needs attention" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-else-if="notice" class="m-3 shrink-0" tone="success" variant="soft" title="Portfolio updated" :description="notice" dismissible @dismiss="notice = ''" />
				<div class="shrink-0 border-b border-border px-3 py-3 sm:px-4">
					<div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_13rem_auto]">
						<div class="roadmap-search"><DomTextInput v-model="searchQuery" type="search" placeholder="Search initiatives, owners, objectives" aria-label="Search roadmap" chrome="none" /></div>
						<DomSelect v-model="viewFilter" :options="workspace.catalog.views" label="Portfolio view" chrome="compact" width="min-w-0" />
						<label class="flex items-center justify-between gap-3 border border-border px-3 py-2 text-xs"><span class="text-muted-fg">Dependencies</span><DomToggle v-model="showDependencies" aria-label="Show roadmap dependencies" /></label>
					</div>
				</div>
				<div class="grid shrink-0 grid-cols-4 gap-px border-b border-border bg-border text-center"><div class="bg-canvas px-2 py-2.5"><p class="text-[9px] text-muted-fg">Active</p><p class="mt-1 text-sm font-semibold">{{ workspace.summary.activeInitiatives }}</p></div><div class="bg-canvas px-2 py-2.5"><p class="text-[9px] text-muted-fg">At risk</p><p class="mt-1 text-sm font-semibold text-warning">{{ workspace.summary.atRisk }}</p></div><div class="bg-canvas px-2 py-2.5"><p class="text-[9px] text-muted-fg">Stale</p><p class="mt-1 text-sm font-semibold">{{ workspace.summary.needsUpdate }}</p></div><div class="bg-canvas px-2 py-2.5"><p class="text-[9px] text-muted-fg">Customer</p><p class="mt-1 text-sm font-semibold">{{ workspace.summary.customerCommitments }}</p></div></div>

				<div class="min-h-0 flex-1 overflow-auto">
					<DomEmptyState v-if="!filteredInitiatives.length" title="No initiatives match" description="Change the saved view or search query." />
					<div v-else class="hidden min-w-[70rem] sm:block">
						<div class="sticky top-0 z-10 grid grid-cols-[10rem_repeat(6,minmax(9rem,1fr))] border-b border-border bg-canvas text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-fg">
							<div class="px-4 py-3">Team</div><div v-for="period in workspace.catalog.periods" :key="period.value" class="border-l border-border px-3 py-3"><span>{{ period.shortLabel }}</span><span class="ml-1 font-normal">{{ period.year }}</span></div>
						</div>
						<div v-for="team in visibleTeams" :key="team.value" class="grid grid-cols-[10rem_minmax(0,1fr)] border-b border-border">
							<div class="px-4 py-4"><div class="flex items-center gap-2"><span class="size-2 rounded-full" :class="teamColorClass(team.color)"></span><h2 class="text-xs font-semibold">{{ team.label }}</h2></div><p class="mt-2 text-[10px] leading-4 text-muted-fg">{{ team.description }}</p></div>
							<div class="timeline-lane grid grid-cols-6 gap-x-2 gap-y-2 border-l border-border p-2" :style="{ gridTemplateRows: `repeat(${Math.max(1, initiativesForTeam(team.value).length)}, minmax(4.2rem, auto))` }">
								<button v-for="initiative in initiativesForTeam(team.value)" :key="initiative.id" type="button" class="group min-w-0 border border-border bg-canvas px-3 py-2 text-left shadow-sm transition hover:border-primary/50" :class="initiative.id === selectedInitiativeId ? 'border-primary shadow-[inset_3px_0_0_var(--primary)]' : ''" :style="initiativeStyle(initiative)" @click="selectInitiative(initiative.id)">
									<div class="flex items-start justify-between gap-2"><span class="min-w-0 truncate text-xs font-semibold">{{ initiative.title }}</span><span class="mt-1 size-2 shrink-0 rounded-full" :class="initiative.health === 'on-track' ? 'bg-success' : initiative.health === 'at-risk' ? 'bg-warning' : 'bg-destructive'"></span></div>
									<div class="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-muted-fg"><span>{{ initiative.owner }}</span><span>{{ initiative.progress }}%</span></div>
									<div class="mt-2 h-1 overflow-hidden rounded-full bg-secondary"><span class="block h-full bg-primary" :style="{ width: `${initiative.progress}%` }"></span></div>
									<p v-if="showDependencies && initiative.dependencyItems.length" class="mt-1.5 truncate text-[9px] text-warning">↳ {{ initiative.dependencyItems.map((item) => item.title).join(', ') }}</p>
								</button>
							</div>
						</div>
					</div>

					<div class="divide-y divide-border sm:hidden">
						<section v-for="period in mobilePeriodGroups" :key="period.value" class="px-4 py-4"><div class="flex items-center justify-between"><div><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">Starts {{ period.label }}</p><h2 class="mt-1 text-sm font-semibold">{{ period.initiatives.length }} initiative{{ period.initiatives.length === 1 ? '' : 's' }}</h2></div><span class="h-px w-12 bg-border"></span></div>
							<div class="mt-3 divide-y divide-border border-y border-border"><button v-for="initiative in period.initiatives" :key="initiative.id" type="button" class="w-full py-4 text-left" @click="selectInitiative(initiative.id)"><div class="flex items-start gap-3"><span class="mt-1 size-2.5 shrink-0 rounded-full" :class="initiative.health === 'on-track' ? 'bg-success' : initiative.health === 'at-risk' ? 'bg-warning' : 'bg-destructive'"></span><div class="min-w-0 flex-1"><div class="flex items-start justify-between gap-3"><h3 class="text-sm font-semibold">{{ initiative.title }}</h3><span class="text-[10px] text-muted-fg">{{ initiative.progress }}%</span></div><p class="mt-1 line-clamp-2 text-xs leading-5 text-muted-fg">{{ initiative.summary }}</p><div class="mt-2 flex flex-wrap items-center gap-2"><DomStatusPill :tone="catalogTone('health', initiative.health)" :label="initiative.healthLabel" size="sm" /><span class="text-[10px] text-muted-fg">{{ initiative.windowLabel }} · {{ initiative.team }}</span></div></div></div></button></div>
						</section>
					</div>
				</div>
			</section>

			<aside v-if="selectedInitiative" class="min-h-0 min-w-0 flex-col overflow-hidden bg-canvas" :class="activeMobileView === 'detail' ? 'flex' : 'hidden lg:flex'">
				<DomAlert v-if="error" class="m-3 shrink-0 lg:hidden" tone="danger" variant="soft" title="Roadmap action needs attention" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-else-if="notice" class="m-3 shrink-0 lg:hidden" tone="success" variant="soft" title="Portfolio updated" :description="notice" dismissible @dismiss="notice = ''" />
				<div class="min-h-0 flex-1 overflow-y-auto">
					<div class="border-b border-border p-4"><div class="flex items-center justify-between gap-3"><div class="flex items-center gap-2"><span class="size-2.5 rounded-full" :class="selectedInitiative.health === 'on-track' ? 'bg-success' : selectedInitiative.health === 'at-risk' ? 'bg-warning' : 'bg-destructive'"></span><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">{{ selectedInitiative.team }}</p></div><DomBadge tone="neutral" variant="soft">v{{ selectedInitiative.version }}</DomBadge></div><h2 class="mt-3 text-lg font-semibold tracking-tight">{{ selectedInitiative.title }}</h2><p class="mt-2 text-xs leading-5 text-muted-fg">{{ selectedInitiative.summary }}</p><div class="mt-3 flex flex-wrap gap-1.5"><DomStatusPill :tone="catalogTone('statuses', selectedInitiative.status)" :label="selectedInitiative.statusLabel" size="sm" /><DomStatusPill :tone="catalogTone('health', selectedInitiative.health)" :label="selectedInitiative.healthLabel" size="sm" /></div></div>
					<div class="grid grid-cols-3 gap-px border-b border-border bg-border text-center"><div class="bg-canvas p-3"><p class="text-[9px] text-muted-fg">Progress</p><p class="mt-1 text-sm font-semibold">{{ selectedInitiative.progress }}%</p></div><div class="bg-canvas p-3"><p class="text-[9px] text-muted-fg">Confidence</p><p class="mt-1 text-sm font-semibold">{{ selectedInitiative.confidence }}%</p></div><div class="bg-canvas p-3"><p class="text-[9px] text-muted-fg">Accounts</p><p class="mt-1 text-sm font-semibold">{{ selectedInitiative.customers }}</p></div></div>
					<div class="border-b border-border p-4"><div class="flex flex-wrap gap-2"><DomButton size="sm" @click="openUpdate">Post update</DomButton><DomButton size="sm" variant="secondary" @click="openEdit">Edit plan</DomButton><DomButton size="sm" variant="ghost" @click="openMove">Reschedule</DomButton></div></div>
					<dl class="divide-y divide-border border-b border-border px-4 text-xs"><div class="flex items-start justify-between gap-4 py-3"><dt class="text-muted-fg">Window</dt><dd class="text-right font-semibold">{{ selectedInitiative.windowLabel }}</dd></div><div class="flex items-start justify-between gap-4 py-3"><dt class="text-muted-fg">Lead</dt><dd class="flex items-center gap-2 text-right font-semibold"><DomAvatar :name="selectedInitiative.owner" :initials="selectedInitiative.ownerInitials" size="xs" />{{ selectedInitiative.owner }}</dd></div><div class="flex items-start justify-between gap-4 py-3"><dt class="text-muted-fg">Objective</dt><dd class="max-w-44 text-right font-semibold">{{ selectedInitiative.objective }}</dd></div><div class="flex items-start justify-between gap-4 py-3"><dt class="text-muted-fg">Revenue</dt><dd class="font-semibold">{{ formatCurrency(selectedInitiative.revenue) }}</dd></div></dl>
					<div class="border-b border-border p-4"><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">Milestones</p><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="milestone in selectedInitiative.milestones" :key="milestone.id" class="flex items-start gap-3 py-3"><span class="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border text-[9px]" :class="milestone.complete ? 'border-success bg-success text-success-fg' : 'border-border text-muted-fg'">{{ milestone.complete ? '✓' : '' }}</span><div><p class="text-xs font-medium">{{ milestone.label }}</p><p class="mt-0.5 text-[10px] text-muted-fg">{{ milestone.complete ? 'Complete' : 'Open launch gate' }}</p></div></div></div></div>
					<div v-if="showDependencies" class="border-b border-border p-4"><div class="flex items-center justify-between"><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">Dependencies</p><span class="text-[10px] text-muted-fg">{{ selectedInitiative.dependencyItems.length }}</span></div><p v-if="!selectedInitiative.dependencyItems.length" class="mt-3 text-xs text-muted-fg">No upstream initiative blocks this window.</p><div v-else class="mt-3 divide-y divide-border border-y border-border"><button v-for="dependency in selectedInitiative.dependencyItems" :key="dependency.id" type="button" class="flex w-full items-center justify-between gap-3 py-3 text-left" @click="selectInitiative(dependency.id)"><div><p class="text-xs font-medium">{{ dependency.title }}</p><p class="mt-0.5 text-[10px] text-muted-fg">Targets {{ dependency.endLabel }}</p></div><DomStatusPill :tone="catalogTone('health', dependency.health)" :label="dependency.healthLabel" size="sm" /></button></div></div>
					<div class="p-4"><div class="flex items-center justify-between"><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">Latest update</p><span class="text-[10px] text-muted-fg">{{ selectedInitiative.lastUpdateDays ? `${selectedInitiative.lastUpdateDays}d ago` : 'Just now' }}</span></div><article v-if="selectedInitiative.updates[0]" class="mt-3 border-l-2 border-primary pl-3"><p class="text-xs leading-5">{{ selectedInitiative.updates[0].summary }}</p><p class="mt-2 text-[10px] text-muted-fg">{{ selectedInitiative.updates[0].actor }} · {{ selectedInitiative.updates[0].audienceLabel }}</p><p v-if="selectedInitiative.updates[0].notification" class="mt-1 text-[10px] text-success">Delivered to {{ selectedInitiative.updates[0].notification.recipients }} stakeholders</p></article></div>
				</div>
			</aside>

			<section v-if="activeMobileView === 'release'" class="min-h-0 flex-1 overflow-y-auto lg:hidden">
				<DomAlert v-if="error" class="m-3" tone="danger" variant="soft" title="Release needs attention" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-else-if="notice" class="m-3" tone="success" variant="soft" title="Roadmap released" :description="notice" dismissible @dismiss="notice = ''" />
				<div class="px-4 py-5"><div class="flex items-end justify-between gap-3 border-b border-border pb-4"><div><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">Audience snapshots</p><h2 class="mt-1 text-lg font-semibold">Published roadmaps</h2><p class="mt-2 text-xs leading-5 text-muted-fg">Release the right planning detail to product, executives, go-to-market, or customers.</p></div><DomButton size="sm" @click="openPublish">Publish</DomButton></div><div class="divide-y divide-border"><article v-for="publication in workspace.publications" :key="publication.id" class="py-5"><div class="flex items-start justify-between gap-3"><div><h3 class="text-sm font-semibold">{{ publication.audienceLabel }}</h3><p class="mt-1 text-xs text-muted-fg">Through {{ publication.endPeriodLabel }} · {{ publication.itemCount }} initiatives</p></div><DomStatusPill tone="success" label="Published" size="sm" /></div><p class="mt-3 text-[10px] text-muted-fg">{{ publication.publishedBy }} · {{ publication.id }}</p></article></div></div>
			</section>
		</div>

		<template #bottom><DomAppBottomNav v-if="workspace" v-model="activeMobileView" class="lg:hidden" :items="mobileNavigation" /></template>
	</DomAppShell>

	<DomDialog v-if="workspace" v-model="createOpen" title="Create roadmap initiative" description="Start with an outcome, accountable team, and planning window. The API returns a durable creation receipt." width="min(94vw, 44rem)">
		<div class="grid gap-4"><DomTextInput v-model="createDraft.title" label="Initiative title" :errors="fieldErrors.title || []" /><DomTextareaInput v-model="createDraft.summary" label="Intended outcome" :rows="3" :errors="fieldErrors.summary || []" /><div class="grid gap-4 sm:grid-cols-2"><DomSelect v-model="createDraft.teamId" label="Product team" :options="workspace.catalog.teams" :errors="fieldErrors.teamId || []" /><DomSelect v-model="createDraft.ownerId" label="Initiative lead" :options="workspace.catalog.owners" searchable :errors="fieldErrors.ownerId || []" /></div><DomSelect v-model="createDraft.objectiveId" label="Portfolio objective" :options="workspace.catalog.objectives" :errors="fieldErrors.objectiveId || []" /><div class="grid gap-4 sm:grid-cols-2"><DomSelect v-model="createDraft.status" label="Delivery status" :options="workspace.catalog.statuses" :errors="fieldErrors.status || []" /><DomSelect v-model="createDraft.health" label="Health" :options="workspace.catalog.health" :errors="fieldErrors.health || []" /></div><div class="grid gap-4 sm:grid-cols-3"><DomSelect v-model="createDraft.startPeriod" label="Start" :options="workspace.catalog.periods" :errors="fieldErrors.startPeriod || []" /><DomSelect v-model="createDraft.endPeriod" label="Target" :options="workspace.catalog.periods" :errors="fieldErrors.endPeriod || []" /><DomNumberInput v-model="createDraft.confidence" label="Confidence" suffix="%" :min="0" :max="100" :errors="fieldErrors.confidence || []" /></div></div>
		<template #footer><DomButton variant="secondary" @click="createOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'create'" @click="createInitiative">Create initiative</DomButton></template>
	</DomDialog>

	<DomDialog v-if="workspace && selectedInitiative" v-model="editOpen" title="Edit initiative plan" :description="`${selectedInitiative.title} · exact version ${selectedInitiative.version}`" width="min(94vw, 46rem)">
		<div class="grid gap-4"><DomAlert tone="info" title="Planning and publication stay connected" description="The API rejects active work without an owner, completed work with open milestones, and shaping work exposed to customers." /><DomTextInput v-model="editDraft.title" label="Initiative title" :errors="fieldErrors.title || []" /><DomTextareaInput v-model="editDraft.summary" label="Outcome summary" :rows="3" :errors="fieldErrors.summary || []" /><div class="grid gap-4 sm:grid-cols-2"><DomSelect v-model="editDraft.teamId" label="Product team" :options="workspace.catalog.teams" :errors="fieldErrors.teamId || []" /><DomSelect v-model="editDraft.ownerId" label="Initiative lead" :options="workspace.catalog.owners" searchable :errors="fieldErrors.ownerId || []" /></div><div class="grid gap-4 sm:grid-cols-2"><DomSelect v-model="editDraft.status" label="Status" :options="workspace.catalog.statuses" :errors="fieldErrors.status || []" /><DomSelect v-model="editDraft.health" label="Health" :options="workspace.catalog.health" :errors="fieldErrors.health || []" /></div><div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]"><DomSelect v-model="editDraft.objectiveId" label="Portfolio objective" :options="workspace.catalog.objectives" :errors="fieldErrors.objectiveId || []" /><DomNumberInput v-model="editDraft.confidence" label="Confidence" suffix="%" :min="0" :max="100" :errors="fieldErrors.confidence || []" /></div><fieldset><legend class="text-xs font-semibold text-canvas-fg">Visible roadmap audiences</legend><div class="mt-2 grid gap-2 sm:grid-cols-2"><DomCheckbox v-for="audience in workspace.catalog.audiences" :key="audience.value" v-model="visibilityDraft[audience.value]" :label="audience.label" :description="audience.description" /></div><p v-if="fieldErrors.visibility" class="mt-2 text-xs text-destructive">{{ fieldErrors.visibility[0] }}</p></fieldset></div>
		<template #footer><DomButton variant="secondary" @click="editOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'edit'" @click="saveInitiative">Save plan</DomButton></template>
	</DomDialog>

	<DomDialog v-if="workspace && selectedInitiative" v-model="moveOpen" title="Reschedule initiative" :description="`Preview dependency and team-capacity impact for ${selectedInitiative.title}.`" width="min(94vw, 40rem)">
		<div v-if="!movePreview" class="grid gap-4"><div class="grid gap-4 sm:grid-cols-2"><DomSelect v-model="moveDraft.startPeriod" label="Start period" :options="workspace.catalog.periods" :errors="fieldErrors.startPeriod || []" /><DomSelect v-model="moveDraft.endPeriod" label="Target period" :options="workspace.catalog.periods" :errors="fieldErrors.endPeriod || []" /></div><DomAlert tone="info" title="Preview first" description="The server checks upstream dependencies, downstream targets, and overlapping team work against exact revisions." /></div>
		<div v-else class="grid gap-4"><div class="grid grid-cols-2 gap-px border border-border bg-border text-center"><div class="bg-canvas p-3"><p class="text-[10px] text-muted-fg">Current</p><p class="mt-1 text-xs font-semibold">{{ movePreview.current.label }}</p></div><div class="bg-canvas p-3"><p class="text-[10px] text-muted-fg">Proposed</p><p class="mt-1 text-xs font-semibold">{{ movePreview.next.label }}</p></div></div><DomAlert :tone="movePreview.warnings.length ? 'warning' : 'success'" :title="movePreview.warnings.length ? 'Planning impact found' : 'Schedule is clear'" :description="movePreview.warnings.length ? movePreview.warnings.join(' ') : 'No dependency or team-capacity conflicts were found.'" /><div v-if="movePreview.blockingDependencies.length || movePreview.downstream.length" class="divide-y divide-border border-y border-border text-xs"><div v-for="item in movePreview.blockingDependencies" :key="item.id" class="flex justify-between gap-4 py-3"><span>{{ item.title }}</span><span class="text-warning">Ends {{ item.endLabel }}</span></div><div v-for="item in movePreview.downstream" :key="item.id" class="flex justify-between gap-4 py-3"><span>{{ item.title }}</span><span class="text-muted-fg">Starts {{ item.startLabel }}</span></div></div><DomCheckbox v-if="movePreview.warnings.length" v-model="moveAcknowledged" label="I reviewed the schedule impact" description="The commit will fail if the workspace or initiative changes after this preview." :errors="fieldErrors.acknowledged || []" /></div>
		<template #footer><DomButton variant="secondary" @click="moveOpen = false">Cancel</DomButton><DomButton v-if="!movePreview" :loading="busyAction === 'move-preview'" @click="previewMove">Preview move</DomButton><template v-else><DomButton variant="secondary" @click="movePreview = null">Back</DomButton><DomButton :disabled="movePreview.warnings.length && !moveAcknowledged" :loading="busyAction === 'move'" @click="commitMove">Commit schedule</DomButton></template></template>
	</DomDialog>

	<DomDialog v-if="workspace && selectedInitiative" v-model="updateOpen" title="Post initiative update" :description="`Report health and progress for ${selectedInitiative.title}.`" width="min(94vw, 40rem)">
		<div class="grid gap-4"><div class="grid gap-4 sm:grid-cols-2"><DomSelect v-model="updateDraft.health" label="Current health" :options="workspace.catalog.health" :errors="fieldErrors.health || []" /><DomNumberInput v-model="updateDraft.progress" label="Progress" suffix="%" :min="0" :max="100" :errors="fieldErrors.progress || []" /></div><DomSelect v-model="updateDraft.audience" label="Update audience" :options="workspace.catalog.updateAudiences" :errors="fieldErrors.audience || []" @update:model-value="updateDraft.notify = updateDraft.audience === 'stakeholders'" /><DomTextareaInput v-model="updateDraft.summary" label="Progress, risk, and next decision" :rows="5" :errors="fieldErrors.summary || []" /><DomCheckbox v-if="updateDraft.audience === 'stakeholders'" v-model="updateDraft.notify" label="Notify 18 subscribed stakeholders" description="The API returns recipient count and delivery evidence." :errors="fieldErrors.notify || []" /></div>
		<template #footer><DomButton variant="secondary" @click="updateOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'update'" @click="postUpdate">Post update</DomButton></template>
	</DomDialog>

	<DomDialog v-if="workspace" v-model="publishOpen" title="Publish roadmap view" description="Create a frozen audience preview before releasing current portfolio commitments." width="min(94vw, 42rem)">
		<div v-if="!publishPreview" class="grid gap-4"><DomSelect v-model="publishDraft.audience" label="Audience" :options="workspace.catalog.audiences" :errors="fieldErrors.audience || []" /><DomSelect v-model="publishDraft.endPeriod" label="Publish through" :options="workspace.catalog.periods" :errors="fieldErrors.endPeriod || []" /><DomAlert tone="info" title="Audience rules are server-owned" description="The preview filters approved initiatives and lists redactions, stale updates, and low-confidence commitments." /></div>
		<div v-else class="grid gap-4"><div class="grid grid-cols-3 gap-px border border-border bg-border text-center"><div class="bg-canvas p-3"><p class="text-[10px] text-muted-fg">Included</p><p class="mt-1 font-semibold">{{ publishPreview.included.length }}</p></div><div class="bg-canvas p-3"><p class="text-[10px] text-muted-fg">Excluded</p><p class="mt-1 font-semibold">{{ publishPreview.excluded.length }}</p></div><div class="bg-canvas p-3"><p class="text-[10px] text-muted-fg">Redactions</p><p class="mt-1 font-semibold">{{ publishPreview.redactions.length }}</p></div></div><DomAlert :tone="publishPreview.warnings.length ? 'warning' : 'success'" :title="publishPreview.warnings.length ? 'Publication review needed' : 'Audience view is ready'" :description="publishPreview.warnings.length ? publishPreview.warnings.join(' ') : `${publishPreview.included.length} initiatives are ready for ${publishPreview.audienceLabel}.`" /><div class="max-h-48 overflow-y-auto divide-y divide-border border-y border-border"><div v-for="item in publishPreview.included" :key="item.id" class="flex items-center justify-between gap-3 py-3 text-xs"><div><p class="font-medium">{{ item.title }}</p><p class="mt-0.5 text-[10px] text-muted-fg">{{ item.window }}</p></div><span>{{ item.confidence }}%</span></div></div><p v-if="publishPreview.redactions.length" class="text-xs leading-5 text-muted-fg">Redacted: {{ publishPreview.redactions.join(', ') }}.</p><DomCheckbox v-if="publishPreview.warnings.length" v-model="publishAcknowledged" label="Publish with the reviewed warnings" description="The release will fail if any included initiative changes after this preview." :errors="fieldErrors.acknowledged || []" /></div>
		<template #footer><DomButton variant="secondary" @click="publishOpen = false">Cancel</DomButton><DomButton v-if="!publishPreview" :loading="busyAction === 'publish-preview'" @click="previewPublication">Preview audience</DomButton><template v-else><DomButton variant="secondary" @click="publishPreview = null">Back</DomButton><DomButton :disabled="publishPreview.warnings.length && !publishAcknowledged" :loading="busyAction === 'publish'" @click="publishRoadmap">Publish roadmap</DomButton></template></template>
	</DomDialog>

	<DomDialog v-model="resetOpen" title="Reset the portfolio roadmap?" description="Restore the seeded initiatives, updates, publications, and exact revisions for this process-local demo."><DomAlert tone="warning" title="Demo data will be restored" description="Initiatives, schedule changes, updates, and releases created in this server process will be replaced." /><template #footer><DomButton variant="secondary" @click="resetOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'reset'" @click="resetDemo">Reset demo</DomButton></template></DomDialog>
</template>

<style scoped>
.roadmap-search :deep(.skin-input) {
	border-color: transparent;
	background: color-mix(in oklch, var(--secondary) 72%, transparent);
}

.timeline-lane {
	background-image: repeating-linear-gradient(to right, transparent 0, transparent calc(16.6667% - 1px), var(--border) calc(16.6667% - 1px), var(--border) 16.6667%);
}
</style>
