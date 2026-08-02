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
	DomMoneyInput,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextInput,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/feedback-board';
const detailTabs = [
	{ key: 'evidence', label: 'Customer evidence' },
	{ key: 'updates', label: 'Updates' },
	{ key: 'decision', label: 'Product decision' },
];
const navigationIcons = {
	inbox: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16v12H4V6Zm0 8h5l1.5 2h3L15 14h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
	evidence: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 19V8l8-4 8 4v11H4Zm4-7h8M8 16h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
	decision: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4h14v16H5V4Zm4 5h6M9 13h6M9 17h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const workspace = ref(null);
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const selectedIdeaId = ref('idea_audit_exports');
const viewFilter = ref('all');
const statusFilter = ref('all');
const searchQuery = ref('');
const activeMobileView = ref('inbox');
const detailTab = ref('evidence');
const captureOpen = ref(false);
const decisionOpen = ref(false);
const responseOpen = ref(false);
const mergeOpen = ref(false);
const resetOpen = ref(false);
const mergePreview = ref(null);
const mergeAcknowledged = ref(false);
const fieldErrors = ref({});
const captureDraft = reactive({
	ideaId: 'idea_audit_exports',
	title: '',
	customer: 'Copper & Finch',
	contact: 'ops@copperfinch.test',
	tier: 'Enterprise',
	arr: 68000,
	source: 'support',
	importance: 'important',
	quote: 'We need a filtered audit export before our security team can complete the quarterly access review.',
});
const decisionDraft = reactive({
	status: 'evaluating',
	publicStatus: 'under-review',
	priority: 'high',
	ownerId: 'usr_maya',
	rationale: 'Continue discovery while Security validates field-level permissions and export retention requirements.',
});
const responseDraft = reactive({
	visibility: 'public',
	message: 'We are validating the export fields and permissions with compliance-heavy teams. We will share the agreed scope here next.',
	notify: true,
});
const duplicateId = ref('');

const selectedIdea = computed(() => workspace.value?.ideas.find((idea) => idea.id === selectedIdeaId.value) || workspace.value?.ideas[0] || null);
const filteredIdeas = computed(getFilteredIdeas);
const ideaOptions = computed(getIdeaOptions);
const duplicateOptions = computed(getDuplicateOptions);
const statusOptions = computed(() => [{ value: 'all', label: 'Any status', description: 'Show every product workflow state.' }, ...(workspace.value?.catalog.statuses || [])]);
const mobileNavigation = computed(() => [
	{ value: 'inbox', label: 'Inbox', icon: navigationIcons.inbox, badge: String(filteredIdeas.value.length) },
	{ value: 'evidence', label: 'Evidence', icon: navigationIcons.evidence, badge: selectedIdea.value ? String(selectedIdea.value.insights.length) : '' },
	{ value: 'decision', label: 'Decision', icon: navigationIcons.decision },
]);

onMounted(loadWorkspace);

/**
 * Loads the feedback board from its repository-local API.
 *
 * @param {boolean} clearMessages Whether existing feedback messages should be cleared.
 * @returns {Promise<void>}
 */
async function loadWorkspace(clearMessages = true) {
	if (clearMessages) clearFeedback();
	loading.value = true;
	try {
		const data = await request('/bootstrap');
		setWorkspace(data);
	} catch (requestError) {
		error.value = requestError.message || 'Unable to load the feedback workspace.';
	} finally {
		loading.value = false;
	}
}

/**
 * Performs one JSON API request and exposes validation metadata on errors.
 *
 * @param {string} path API path below the feedback-board base URL.
 * @param {Record<string, unknown>} [options] Fetch options and optional JSON body.
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
 * Sends one feedback mutation with consistent busy, conflict, and validation handling.
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
		if (data.ideas) setWorkspace(data);
		return data;
	} catch (requestError) {
		error.value = requestError.message || 'The feedback action could not be completed.';
		fieldErrors.value = requestError.fieldErrors || {};
		if (requestError.status === 409) await refreshAfterConflict();
		return null;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Refreshes authoritative workspace data after an optimistic conflict.
 *
 * @returns {Promise<void>}
 */
async function refreshAfterConflict() {
	try {
		const data = await request('/bootstrap');
		setWorkspace(data);
	} catch {
		// Preserve the original conflict when the recovery read also fails.
	}
}

/**
 * Replaces workspace state while preserving or honoring the selected idea.
 *
 * @param {Record<string, unknown>} data Authoritative API workspace.
 * @returns {void}
 */
function setWorkspace(data) {
	workspace.value = data;
	const requestedIdeaId = data.selectedIdeaId || selectedIdeaId.value;
	selectedIdeaId.value = data.ideas.some((idea) => idea.id === requestedIdeaId) ? requestedIdeaId : data.ideas[0]?.id || '';
}

/**
 * Selects one idea and moves compact layouts to its evidence destination.
 *
 * @param {string} ideaId Idea identifier.
 * @returns {void}
 */
function selectIdea(ideaId) {
	selectedIdeaId.value = ideaId;
	detailTab.value = 'evidence';
	activeMobileView.value = 'evidence';
}

/**
 * Opens the capture dialog with the current idea preselected.
 *
 * @returns {void}
 */
function openCapture() {
	fieldErrors.value = {};
	captureDraft.ideaId = selectedIdea.value?.id || 'new';
	captureOpen.value = true;
}

/**
 * Captures a validated customer insight through the API.
 *
 * @returns {Promise<void>}
 */
async function captureInsight() {
	if (!workspace.value) return;
	const data = await mutate('/insights', 'POST', { revision: workspace.value.revision, ...captureDraft }, 'capture');
	if (!data) return;
	captureOpen.value = false;
	selectedIdeaId.value = data.selectedIdeaId;
	activeMobileView.value = 'evidence';
	detailTab.value = 'evidence';
	notice.value = `${data.insight.customer} is linked to ${selectedIdea.value.title}. Receipt ${data.receipt.id}.`;
}

/**
 * Opens the decision editor with authoritative idea properties.
 *
 * @returns {void}
 */
function openDecision() {
	if (!selectedIdea.value) return;
	fieldErrors.value = {};
	decisionDraft.status = selectedIdea.value.status;
	decisionDraft.publicStatus = selectedIdea.value.publicStatus;
	decisionDraft.priority = selectedIdea.value.priority;
	decisionDraft.ownerId = selectedIdea.value.ownerId;
	decisionOpen.value = true;
}

/**
 * Persists product workflow, public status, priority, and owner at exact versions.
 *
 * @returns {Promise<void>}
 */
async function saveDecision() {
	if (!workspace.value || !selectedIdea.value) return;
	const data = await mutate(`/ideas/${selectedIdea.value.id}`, 'PATCH', {
		revision: workspace.value.revision,
		ideaVersion: selectedIdea.value.version,
		...decisionDraft,
	}, 'decision');
	if (!data) return;
	decisionOpen.value = false;
	detailTab.value = 'decision';
	notice.value = `Product decision saved as ${selectedIdea.value.statusLabel}. Receipt ${data.receipt.id}.`;
}

/**
 * Opens the response editor with visibility-aware notification defaults.
 *
 * @returns {void}
 */
function openResponse() {
	fieldErrors.value = {};
	responseDraft.visibility = 'public';
	responseDraft.notify = true;
	responseOpen.value = true;
}

/**
 * Publishes an internal note or public response with notification evidence.
 *
 * @returns {Promise<void>}
 */
async function publishResponse() {
	if (!workspace.value || !selectedIdea.value) return;
	const data = await mutate(`/ideas/${selectedIdea.value.id}/responses`, 'POST', {
		revision: workspace.value.revision,
		ideaVersion: selectedIdea.value.version,
		...responseDraft,
	}, 'response');
	if (!data) return;
	responseOpen.value = false;
	detailTab.value = 'updates';
	const delivery = data.response.notification ? ` ${data.response.notification.recipients} contacts notified.` : '';
	notice.value = `${data.response.visibility === 'public' ? 'Public response' : 'Internal note'} saved.${delivery}`;
}

/**
 * Opens the duplicate merge workflow with a likely candidate selected.
 *
 * @returns {void}
 */
function openMerge() {
	fieldErrors.value = {};
	mergePreview.value = null;
	mergeAcknowledged.value = false;
	duplicateId.value = duplicateOptions.value[0]?.value || '';
	mergeOpen.value = true;
}

/**
 * Creates an immutable preview of the selected duplicate merge.
 *
 * @returns {Promise<void>}
 */
async function previewMerge() {
	if (!workspace.value || !selectedIdea.value) return;
	const data = await mutate(`/ideas/${selectedIdea.value.id}/merge-preview`, 'POST', {
		revision: workspace.value.revision,
		ideaVersion: selectedIdea.value.version,
		duplicateId: duplicateId.value,
	}, 'merge-preview');
	if (data) mergePreview.value = data.preview;
}

/**
 * Commits the exact and acknowledged merge preview.
 *
 * @returns {Promise<void>}
 */
async function commitMerge() {
	if (!workspace.value || !selectedIdea.value || !mergePreview.value) return;
	const data = await mutate(`/ideas/${selectedIdea.value.id}/merge`, 'POST', {
		revision: workspace.value.revision,
		ideaVersion: selectedIdea.value.version,
		previewId: mergePreview.value.id,
		acknowledged: mergeAcknowledged.value,
	}, 'merge');
	if (!data) return;
	mergeOpen.value = false;
	mergePreview.value = null;
	notice.value = `Duplicate merged with ${data.receipt.id}; customer evidence is retained on this idea.`;
}

/**
 * Restores deterministic feedback data for another product workflow demo.
 *
 * @returns {Promise<void>}
 */
async function resetDemo() {
	const data = await mutate('/reset', 'POST', {}, 'reset');
	if (!data) return;
	resetOpen.value = false;
	selectedIdeaId.value = 'idea_audit_exports';
	activeMobileView.value = 'inbox';
	detailTab.value = 'evidence';
	notice.value = 'The feedback board has been restored to its seeded API state.';
}

/**
 * Keeps mobile destinations and detail tabs synchronized.
 *
 * @param {object} item Selected bottom-navigation item.
 * @returns {void}
 */
function changeMobileDestination(item) {
	if (item.value === 'evidence') detailTab.value = 'evidence';
	if (item.value === 'decision') detailTab.value = 'decision';
}

/**
 * Filters the inbox by saved view, workflow status, and free-text query.
 *
 * @returns {Array<Record<string, unknown>>} Visible idea records.
 */
function getFilteredIdeas() {
	if (!workspace.value) return [];
	const query = searchQuery.value.trim().toLowerCase();
	return workspace.value.ideas.filter((idea) => {
		if (viewFilter.value === 'important' && idea.importantCount === 0) return false;
		if (viewFilter.value === 'enterprise' && !idea.insights.some((insight) => insight.tier === 'Enterprise')) return false;
		if (viewFilter.value === 'stale' && idea.staleDays < 14) return false;
		if (statusFilter.value !== 'all' && idea.status !== statusFilter.value) return false;
		if (!query) return true;
		const haystack = [idea.title, idea.summary, idea.topic, idea.owner, ...idea.tags, ...idea.insights.map((insight) => insight.customer)].join(' ').toLowerCase();
		return haystack.includes(query);
	});
}

/**
 * Builds destination options for new customer evidence.
 *
 * @returns {Array<Record<string, unknown>>} Idea selection options.
 */
function getIdeaOptions() {
	return [
		{ value: 'new', label: 'Create a new idea', description: 'Start a fresh product feedback record.' },
		...(workspace.value?.ideas || []).map((idea) => ({ value: idea.id, label: idea.title, description: `${idea.customerCount} customers · ${formatCurrency(idea.influencedRevenue)}` })),
	];
}

/**
 * Builds available duplicate candidates for the selected idea.
 *
 * @returns {Array<Record<string, unknown>>} Merge candidate options.
 */
function getDuplicateOptions() {
	return (workspace.value?.ideas || [])
		.filter((idea) => idea.id !== selectedIdeaId.value)
		.map((idea) => ({ value: idea.id, label: idea.title, description: `${idea.insights.length} insights · ${idea.statusLabel}` }));
}

/**
 * Creates a rich error from an API response.
 *
 * @param {Record<string, unknown>} data Parsed error body.
 * @param {number} status HTTP status.
 * @returns {Error & { status: number, fieldErrors: Record<string, string[]> }} Request error.
 */
function createRequestError(data, status) {
	const requestError = new Error(data.error || `Feedback API request failed with status ${status}.`);
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
 * Returns a semantic tone for a catalog-backed value.
 *
 * @param {string} collection Catalog collection name.
 * @param {string} value Selected catalog value.
 * @returns {string} DOM Studio semantic tone.
 */
function catalogTone(collection, value) {
	return workspace.value?.catalog[collection]?.find((option) => option.value === value)?.tone || 'neutral';
}

/**
 * Formats annual revenue for compact product evidence summaries.
 *
 * @param {number} value Revenue value.
 * @returns {string} Compact GBP value.
 */
function formatCurrency(value) {
	return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
}

/**
 * Returns the initials for an account or person label.
 *
 * @param {string} value Display label.
 * @returns {string} One or two initials.
 */
function initials(value) {
	return String(value || '').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}
</script>

<template>
	<DomAppShell class="!h-dvh bg-canvas text-canvas-fg">
		<template #top>
			<DomAppTopBar
				v-if="workspace"
				class="md:hidden"
				:title="activeMobileView === 'inbox' ? 'Feedback inbox' : selectedIdea?.title || 'Feedback detail'"
				:subtitle="`${workspace.summary.customerSignals} signals · revision ${workspace.revision}`"
			>
				<template #trailing><DomButton size="sm" @click="openCapture">Capture</DomButton></template>
			</DomAppTopBar>
			<header v-if="workspace" class="hidden h-15 min-w-0 items-center justify-between border-b border-border bg-canvas px-5 md:flex">
				<div class="flex min-w-0 items-center gap-3">
					<div class="grid size-8 shrink-0 place-items-center bg-primary text-sm font-bold text-primary-fg">V</div>
					<div class="min-w-0">
						<div class="flex items-center gap-2"><h1 class="truncate text-sm font-semibold">Voice of customer</h1><DomBadge tone="neutral" variant="soft">{{ workspace.board.name }}</DomBadge></div>
					<p class="mt-0.5 text-[11px] text-muted-fg">Customer evidence connected to decisions · API revision {{ workspace.revision }}</p>
					</div>
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<DomButton size="sm" variant="ghost" @click="resetOpen = true">Reset demo</DomButton>
					<DomButton size="sm" @click="openCapture">Capture feedback</DomButton>
				</div>
			</header>
		</template>

		<div v-if="loading" class="grid h-full min-h-0 gap-0 md:grid-cols-[21rem_minmax(0,1fr)] xl:grid-cols-[14rem_22rem_minmax(0,1fr)]">
			<DomSkeleton class="hidden h-full rounded-none xl:block" />
			<DomSkeleton class="h-full rounded-none border-r border-border" />
			<div class="hidden space-y-3 p-5 md:block"><DomSkeleton class="h-28" /><DomSkeleton class="h-96" /></div>
		</div>

		<DomEmptyState v-else-if="!workspace" title="Feedback workspace unavailable" description="Retry the local API before continuing product triage.">
			<template #actions><DomButton @click="loadWorkspace">Retry</DomButton></template>
		</DomEmptyState>

		<div v-else class="grid h-full min-h-0 min-w-0 overflow-hidden md:grid-cols-[21rem_minmax(0,1fr)] xl:grid-cols-[14rem_22rem_minmax(0,1fr)]">
			<aside class="hidden min-h-0 flex-col overflow-hidden border-r border-border bg-secondary/20 xl:flex">
				<div class="border-b border-border p-3">
					<p class="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">Saved views</p>
					<nav class="mt-2 grid gap-1" aria-label="Feedback views">
						<button
							v-for="view in workspace.catalog.views"
							:key="view.value"
							type="button"
							class="flex items-center justify-between gap-3 px-2 py-2 text-left text-xs transition hover:bg-secondary"
							:class="viewFilter === view.value ? 'bg-secondary font-semibold text-canvas-fg' : 'text-muted-fg'"
							@click="viewFilter = view.value"
						>
							<span>{{ view.label }}</span>
							<span v-if="view.value === 'stale'">{{ workspace.summary.needsFollowUp }}</span>
							<span v-else-if="view.value === 'important'">{{ workspace.summary.importantSignals }}</span>
						</button>
					</nav>
				</div>

				<div class="border-b border-border px-5 py-4">
					<p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">Board pulse</p>
					<dl class="mt-3 space-y-3 text-xs">
						<div class="flex items-baseline justify-between gap-3"><dt class="text-muted-fg">Open ideas</dt><dd class="font-semibold">{{ workspace.summary.activeIdeas }}</dd></div>
						<div class="flex items-baseline justify-between gap-3"><dt class="text-muted-fg">Signals</dt><dd class="font-semibold">{{ workspace.summary.customerSignals }}</dd></div>
						<div class="flex items-baseline justify-between gap-3"><dt class="text-muted-fg">Revenue</dt><dd class="font-semibold">{{ formatCurrency(workspace.summary.influencedRevenue) }}</dd></div>
					</dl>
				</div>

				<div class="min-h-0 flex-1 overflow-y-auto p-4">
					<p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">Recent activity</p>
					<div class="mt-3 divide-y divide-border border-y border-border">
						<div v-for="event in workspace.events.slice(0, 5)" :key="event.id" class="py-3">
							<p class="text-xs font-medium leading-5">{{ event.label }}</p>
							<p class="mt-1 text-[11px] leading-4 text-muted-fg">{{ event.detail }}</p>
							<p class="mt-1 text-[10px] text-muted-fg">{{ event.actor }} · {{ event.time }}</p>
						</div>
					</div>
				</div>

				<div class="border-t border-border p-4">
					<div class="flex items-center gap-3"><DomAvatar :name="workspace.currentOperator.name" :initials="workspace.currentOperator.initials" size="sm" /><div class="min-w-0"><p class="truncate text-xs font-semibold">{{ workspace.currentOperator.name }}</p><p class="mt-0.5 truncate text-[10px] text-muted-fg">{{ workspace.currentOperator.role }}</p></div></div>
				</div>
			</aside>

			<section
				class="min-h-0 min-w-0 flex-col overflow-hidden border-r border-border bg-canvas"
				:class="activeMobileView === 'inbox' ? 'flex' : 'hidden md:flex'"
			>
				<div class="shrink-0 border-b border-border p-3">
					<div class="feedback-search"><DomTextInput v-model="searchQuery" type="search" placeholder="Search ideas, customers, topics" aria-label="Search feedback" chrome="none" /></div>
					<div class="mt-2 grid grid-cols-2 gap-2 xl:hidden">
						<DomSelect v-model="viewFilter" :options="workspace.catalog.views" label="Saved view" chrome="compact" width="min-w-0" />
						<DomSelect v-model="statusFilter" :options="statusOptions" label="Status" chrome="compact" width="min-w-0" />
					</div>
					<div class="mt-2 hidden xl:block"><DomSelect v-model="statusFilter" :options="statusOptions" label="Workflow status" chrome="compact" width="min-w-0" /></div>
				</div>
				<div class="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2 text-[11px] text-muted-fg">
					<span>{{ filteredIdeas.length }} ideas</span>
					<span>Ordered by evidence</span>
				</div>
				<div class="min-h-0 flex-1 overflow-y-auto">
					<DomEmptyState v-if="!filteredIdeas.length" title="No feedback matches" description="Change the saved view, status, or search query." />
					<button
						v-for="idea in filteredIdeas"
						v-else
						:key="idea.id"
						type="button"
						class="group w-full border-b border-border px-4 py-4 text-left transition hover:bg-secondary/35"
						:class="idea.id === selectedIdeaId ? 'bg-primary/[0.06] shadow-[inset_3px_0_0_var(--primary)]' : ''"
						@click="selectIdea(idea.id)"
					>
						<div class="flex items-start gap-3">
							<div class="flex min-w-0 flex-1 gap-3">
								<div class="pt-0.5 text-center"><p class="text-lg font-semibold leading-none">{{ idea.customerCount }}</p><p class="mt-1 text-[9px] uppercase tracking-wide text-muted-fg">customers</p></div>
								<div class="min-w-0 flex-1">
									<div class="flex flex-wrap items-center gap-1.5"><h2 class="text-sm font-semibold leading-5">{{ idea.title }}</h2><DomStatusPill :tone="catalogTone('statuses', idea.status)" :label="idea.statusLabel" size="sm" /></div>
									<p class="mt-2 line-clamp-2 text-xs leading-5 text-muted-fg">{{ idea.summary }}</p>
									<div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-fg"><span>{{ formatCurrency(idea.influencedRevenue) }}</span><span>{{ idea.importantCount }} important</span><span>{{ idea.owner }}</span><span>{{ idea.lastActivityLabel }}</span></div>
								</div>
							</div>
						</div>
					</button>
				</div>
			</section>

			<main
				v-if="selectedIdea"
				class="min-h-0 min-w-0 flex-col overflow-hidden bg-canvas"
				:class="activeMobileView === 'inbox' ? 'hidden md:flex' : 'flex'"
			>
				<DomAlert v-if="error" class="m-3 shrink-0" tone="danger" variant="soft" title="Feedback action needs attention" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-else-if="notice" class="m-3 shrink-0" tone="success" variant="soft" title="Feedback workspace updated" :description="notice" dismissible @dismiss="notice = ''" />

				<div class="shrink-0 border-b border-border px-4 py-4 sm:px-5">
					<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2"><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">{{ selectedIdea.topic }}</p><DomBadge v-if="selectedIdea.staleDays >= 14" tone="warning" variant="soft">Needs follow-up</DomBadge><DomBadge tone="neutral" variant="soft">v{{ selectedIdea.version }}</DomBadge></div>
							<h2 class="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{{ selectedIdea.title }}</h2>
							<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">{{ selectedIdea.summary }}</p>
						</div>
						<div class="flex shrink-0 flex-wrap gap-2">
							<DomButton size="sm" variant="secondary" :disabled="!duplicateOptions.length" @click="openMerge">Merge</DomButton>
							<DomButton size="sm" variant="secondary" @click="openResponse">Respond</DomButton>
							<DomButton size="sm" @click="openDecision">Decide</DomButton>
						</div>
					</div>
					<div class="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
						<DomStatusPill :tone="catalogTone('statuses', selectedIdea.status)" :label="selectedIdea.statusLabel" />
						<DomStatusPill :tone="catalogTone('priorities', selectedIdea.priority)" :label="`${selectedIdea.priorityLabel} priority`" />
						<DomStatusPill :tone="catalogTone('publicStatuses', selectedIdea.publicStatus)" :label="`Public: ${selectedIdea.publicStatusLabel}`" />
						<span class="text-xs text-muted-fg">Owned by {{ selectedIdea.owner }}</span>
						<span v-if="selectedIdea.linkedWork" class="text-xs text-primary">{{ selectedIdea.linkedWork.key }} · {{ selectedIdea.linkedWork.state }}</span>
					</div>
				</div>

				<div class="grid shrink-0 grid-cols-4 gap-px border-b border-border bg-border text-center">
					<div class="bg-canvas px-2 py-3"><p class="text-[10px] text-muted-fg">Customers</p><p class="mt-1 text-sm font-semibold">{{ selectedIdea.customerCount }}</p></div>
					<div class="bg-canvas px-2 py-3"><p class="text-[10px] text-muted-fg">Important</p><p class="mt-1 text-sm font-semibold">{{ selectedIdea.importantCount }}</p></div>
					<div class="bg-canvas px-2 py-3"><p class="text-[10px] text-muted-fg">Revenue</p><p class="mt-1 text-sm font-semibold">{{ formatCurrency(selectedIdea.influencedRevenue) }}</p></div>
					<div class="bg-canvas px-2 py-3"><p class="text-[10px] text-muted-fg">Momentum</p><p class="mt-1 text-sm font-semibold">{{ selectedIdea.trend }}</p></div>
				</div>

				<DomTabs v-model="detailTab" :tabs="detailTabs" class="feedback-detail-tabs flex min-h-0 flex-1 flex-col overflow-hidden">
					<template #evidence>
						<div class="h-full min-h-0 overflow-y-auto">
							<div class="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6">
								<div class="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4"><div><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">Raw customer voice</p><h3 class="mt-1 font-semibold">Evidence behind this idea</h3></div><DomButton size="sm" variant="secondary" @click="openCapture">Add evidence</DomButton></div>
								<div class="divide-y divide-border">
									<article v-for="insight in selectedIdea.insights" :key="insight.id" class="grid gap-3 py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto]">
										<DomAvatar :name="insight.customer" :initials="initials(insight.customer)" size="sm" />
										<div class="min-w-0">
											<div class="flex flex-wrap items-center gap-2"><p class="text-sm font-semibold">{{ insight.customer }}</p><DomBadge v-if="insight.important" tone="warning" variant="soft">Important</DomBadge><DomBadge tone="neutral" variant="soft">{{ insight.tier }}</DomBadge></div>
											<blockquote class="mt-2 border-l-2 border-primary pl-3 text-sm leading-6">“{{ insight.quote }}”</blockquote>
											<p class="mt-3 text-[11px] text-muted-fg">{{ insight.sourceLabel }} · {{ insight.contact }} · captured by {{ insight.createdBy }}</p>
										</div>
										<div class="text-left sm:text-right"><p class="text-xs font-semibold">{{ formatCurrency(insight.arr) }}</p><p class="mt-1 text-[10px] text-muted-fg">{{ insight.time }}</p></div>
									</article>
								</div>
							</div>
						</div>
					</template>

					<template #updates>
						<div class="h-full min-h-0 overflow-y-auto">
							<div class="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
								<div class="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4"><div><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">Close the loop</p><h3 class="mt-1 font-semibold">Product notes and customer updates</h3></div><DomButton size="sm" @click="openResponse">Write update</DomButton></div>
								<DomEmptyState v-if="!selectedIdea.responses.length" title="No updates yet" description="Publish a public response or retain an internal product note.">
									<template #actions><DomButton @click="openResponse">Write first update</DomButton></template>
								</DomEmptyState>
								<div v-else class="divide-y divide-border">
									<article v-for="response in selectedIdea.responses" :key="response.id" class="grid gap-3 py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
										<DomAvatar :name="response.actor" :initials="initials(response.actor)" size="sm" />
										<div><div class="flex flex-wrap items-center gap-2"><p class="text-sm font-semibold">{{ response.actor }}</p><DomBadge :tone="response.visibility === 'public' ? 'success' : 'neutral'" variant="soft">{{ response.visibility === 'public' ? 'Public response' : response.kind === 'decision' ? 'Decision record' : 'Internal note' }}</DomBadge><span class="text-[10px] text-muted-fg">{{ response.time }}</span></div><p class="mt-2 text-sm leading-6 text-muted-fg">{{ response.message }}</p><p v-if="response.notification" class="mt-2 text-xs text-success">Delivered to {{ response.notification.recipients }} contacts · {{ response.notification.receipt.id }}</p></div>
									</article>
								</div>
							</div>
						</div>
					</template>

					<template #decision>
						<div class="h-full min-h-0 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-4xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
								<div>
									<div class="border-b border-border pb-4"><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">Decision record</p><h3 class="mt-1 font-semibold">Turn evidence into a product commitment</h3><p class="mt-2 text-sm leading-6 text-muted-fg">Internal workflow and public communication stay separate, but the API validates that committed states agree.</p></div>
									<dl class="divide-y divide-border border-b border-border text-sm">
										<div class="flex items-center justify-between gap-4 py-4"><dt class="text-muted-fg">Internal workflow</dt><dd><DomStatusPill :tone="catalogTone('statuses', selectedIdea.status)" :label="selectedIdea.statusLabel" /></dd></div>
										<div class="flex items-center justify-between gap-4 py-4"><dt class="text-muted-fg">Public board</dt><dd><DomStatusPill :tone="catalogTone('publicStatuses', selectedIdea.publicStatus)" :label="selectedIdea.publicStatusLabel" /></dd></div>
										<div class="flex items-center justify-between gap-4 py-4"><dt class="text-muted-fg">Priority</dt><dd class="font-semibold">{{ selectedIdea.priorityLabel }}</dd></div>
										<div class="flex items-center justify-between gap-4 py-4"><dt class="text-muted-fg">Accountable owner</dt><dd class="font-semibold">{{ selectedIdea.owner }}</dd></div>
										<div class="flex items-center justify-between gap-4 py-4"><dt class="text-muted-fg">Linked delivery work</dt><dd class="text-right font-semibold">{{ selectedIdea.linkedWork ? `${selectedIdea.linkedWork.key} · ${selectedIdea.linkedWork.state}` : 'Not linked' }}</dd></div>
									</dl>
									<div class="mt-5 flex flex-wrap gap-2"><DomButton @click="openDecision">Edit decision</DomButton><DomButton variant="secondary" @click="openResponse">Publish response</DomButton></div>
								</div>
								<aside>
									<p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">Decision quality</p>
									<div class="mt-3 divide-y divide-border border-y border-border text-xs">
										<div class="py-3"><div class="flex items-center justify-between gap-3"><span class="font-medium">Customer evidence</span><DomStatusPill tone="success" label="Ready" size="sm" /></div><p class="mt-1 leading-5 text-muted-fg">{{ selectedIdea.insights.length }} raw signals from {{ selectedIdea.customerCount }} customers.</p></div>
										<div class="py-3"><div class="flex items-center justify-between gap-3"><span class="font-medium">Ownership</span><DomStatusPill :tone="selectedIdea.ownerId === 'unassigned' ? 'warning' : 'success'" :label="selectedIdea.ownerId === 'unassigned' ? 'Missing' : 'Ready'" size="sm" /></div><p class="mt-1 leading-5 text-muted-fg">Committed work needs a named product owner.</p></div>
										<div class="py-3"><div class="flex items-center justify-between gap-3"><span class="font-medium">Customer loop</span><DomStatusPill :tone="selectedIdea.responses.some((response) => response.visibility === 'public') ? 'success' : 'warning'" :label="selectedIdea.responses.some((response) => response.visibility === 'public') ? 'Updated' : 'Pending'" size="sm" /></div><p class="mt-1 leading-5 text-muted-fg">Public replies can notify every attached contact.</p></div>
									</div>
								</aside>
							</div>
						</div>
					</template>
				</DomTabs>
			</main>
		</div>

		<template #bottom>
			<DomAppBottomNav v-if="workspace" v-model="activeMobileView" class="md:hidden" :items="mobileNavigation" @change="changeMobileDestination" />
		</template>
	</DomAppShell>

	<DomDialog v-if="workspace" v-model="captureOpen" title="Capture customer feedback" description="Link a raw customer signal to an existing idea or start a new feedback record." width="min(94vw, 42rem)">
		<div class="grid gap-4">
			<DomSelect v-model="captureDraft.ideaId" label="Product idea" :options="ideaOptions" searchable width="min-w-0" :errors="fieldErrors.ideaId || []"><template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template></DomSelect>
			<DomTextInput v-if="captureDraft.ideaId === 'new'" v-model="captureDraft.title" label="New idea title" :errors="fieldErrors.title || []" />
			<div class="grid gap-4 sm:grid-cols-2"><DomTextInput v-model="captureDraft.customer" label="Customer or account" :errors="fieldErrors.customer || []" /><DomTextInput v-model="captureDraft.contact" type="email" label="Customer email" :errors="fieldErrors.contact || []" /></div>
			<div class="grid gap-4 sm:grid-cols-3"><DomSelect v-model="captureDraft.source" label="Source" :options="workspace.catalog.sources" width="min-w-0" :errors="fieldErrors.source || []" /><DomSelect v-model="captureDraft.importance" label="Importance" :options="workspace.catalog.importance" width="min-w-0" :errors="fieldErrors.importance || []" /><DomMoneyInput v-model="captureDraft.arr" label="Annual revenue" currency="GBP" :min="0" :max="10000000" :step="1000" :errors="fieldErrors.arr || []" /></div>
			<DomTextareaInput v-model="captureDraft.quote" label="Customer context" description="Keep the customer’s problem, trigger, and desired outcome in their own words." :rows="5" :errors="fieldErrors.quote || []" />
		</div>
		<template #footer><DomButton variant="secondary" @click="captureOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'capture'" @click="captureInsight">Capture insight</DomButton></template>
	</DomDialog>

	<DomDialog v-if="workspace && selectedIdea" v-model="decisionOpen" title="Update product decision" :description="`${selectedIdea.title} · exact idea version ${selectedIdea.version}`" width="min(94vw, 42rem)">
		<div class="grid gap-4">
			<DomAlert tone="info" title="Internal and public states are separate" description="The API prevents Planned, Building, Shipped, and Declined states from contradicting the customer-facing status." />
			<div class="grid gap-4 sm:grid-cols-2"><DomSelect v-model="decisionDraft.status" label="Internal workflow" :options="workspace.catalog.statuses" :errors="fieldErrors.status || []" /><DomSelect v-model="decisionDraft.publicStatus" label="Public status" :options="workspace.catalog.publicStatuses" :errors="fieldErrors.publicStatus || []" /></div>
			<div class="grid gap-4 sm:grid-cols-2"><DomSelect v-model="decisionDraft.priority" label="Priority" :options="workspace.catalog.priorities" :errors="fieldErrors.priority || []" /><DomSelect v-model="decisionDraft.ownerId" label="Accountable owner" :options="workspace.catalog.owners" :errors="fieldErrors.ownerId || []" /></div>
			<DomTextareaInput v-model="decisionDraft.rationale" label="Decision rationale" description="Stored as an internal decision record with the exact prior and next state." :rows="4" :errors="fieldErrors.rationale || []" />
		</div>
		<template #footer><DomButton variant="secondary" @click="decisionOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'decision'" @click="saveDecision">Save decision</DomButton></template>
	</DomDialog>

	<DomDialog v-if="workspace && selectedIdea" v-model="responseOpen" title="Write product update" :description="`Add context for the team or close the loop with ${selectedIdea.contactCount} customer contacts.`" width="min(94vw, 38rem)">
		<div class="grid gap-4">
			<DomSelect v-model="responseDraft.visibility" label="Visibility" :options="workspace.catalog.visibility" :errors="fieldErrors.visibility || []" @update:model-value="responseDraft.notify = responseDraft.visibility === 'public'" />
			<DomTextareaInput v-model="responseDraft.message" label="Update" :description="responseDraft.visibility === 'public' ? 'Visible on the feedback portal and included in the notification.' : 'Visible only to internal product and customer teams.'" :rows="6" :errors="fieldErrors.message || []" />
			<DomCheckbox v-if="responseDraft.visibility === 'public'" v-model="responseDraft.notify" :label="`Notify ${selectedIdea.contactCount} attached contacts`" description="The API returns a delivery receipt and recipient count." :errors="fieldErrors.notify || []" />
		</div>
		<template #footer><DomButton variant="secondary" @click="responseOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'response'" @click="publishResponse">{{ responseDraft.visibility === 'public' ? 'Publish update' : 'Save note' }}</DomButton></template>
	</DomDialog>

	<DomDialog v-if="workspace && selectedIdea" v-model="mergeOpen" title="Merge duplicate feedback" :description="`Combine customer evidence into ${selectedIdea.title} without losing source context.`" width="min(94vw, 38rem)">
		<div v-if="!mergePreview" class="grid gap-4">
			<DomSelect v-model="duplicateId" label="Duplicate idea" :options="duplicateOptions" searchable :errors="fieldErrors.duplicateId || []"><template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template></DomSelect>
			<DomAlert tone="info" title="Preview first" description="The server locks both record versions and calculates moved insights, responses, unique customers, and influenced revenue." />
		</div>
		<div v-else class="grid gap-4">
			<DomAlert tone="warning" title="The duplicate leaves the active board" :description="`${mergePreview.duplicateTitle} will be merged into ${mergePreview.destinationTitle}. Its evidence remains attached to the destination.`" />
			<div class="grid grid-cols-2 gap-px border border-border bg-border text-center sm:grid-cols-4"><div class="bg-canvas p-3"><p class="text-[10px] text-muted-fg">Insights moved</p><p class="mt-1 font-semibold">{{ mergePreview.insightsMoved }}</p></div><div class="bg-canvas p-3"><p class="text-[10px] text-muted-fg">Updates moved</p><p class="mt-1 font-semibold">{{ mergePreview.responsesMoved }}</p></div><div class="bg-canvas p-3"><p class="text-[10px] text-muted-fg">Customers</p><p class="mt-1 font-semibold">{{ mergePreview.combinedCustomers }}</p></div><div class="bg-canvas p-3"><p class="text-[10px] text-muted-fg">Revenue</p><p class="mt-1 font-semibold">{{ formatCurrency(mergePreview.combinedRevenue) }}</p></div></div>
			<DomCheckbox v-model="mergeAcknowledged" label="I reviewed both exact idea versions" description="The merge will fail if either idea changes after this preview." :errors="fieldErrors.acknowledged || []" />
		</div>
		<template #footer><DomButton variant="secondary" @click="mergeOpen = false">Cancel</DomButton><DomButton v-if="!mergePreview" :loading="busyAction === 'merge-preview'" @click="previewMerge">Preview merge</DomButton><template v-else><DomButton variant="secondary" @click="mergePreview = null">Back</DomButton><DomButton :disabled="!mergeAcknowledged" :loading="busyAction === 'merge'" @click="commitMerge">Merge ideas</DomButton></template></template>
	</DomDialog>

	<DomDialog v-model="resetOpen" title="Reset the feedback workspace?" description="Restore the seeded ideas, insights, decisions, responses, and revision counters for this process-local demo.">
		<DomAlert tone="warning" title="Demo data will be restored" description="Any feedback captured or merged during this browser session will be replaced." />
		<template #footer><DomButton variant="secondary" @click="resetOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'reset'" @click="resetDemo">Reset demo</DomButton></template>
	</DomDialog>
</template>

<style scoped>
.feedback-search :deep(.skin-input) {
	border-color: transparent;
	background: color-mix(in oklch, var(--secondary) 72%, transparent);
}

.feedback-detail-tabs :deep([role="tablist"]) {
	display: none;
}

@media (min-width: 768px) {
	.feedback-detail-tabs :deep([role="tablist"]) {
		display: flex;
	}
}
</style>
