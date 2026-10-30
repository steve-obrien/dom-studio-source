<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import {
	DomAlert,
	DomAppBottomNav,
	DomAppShell,
	DomAppTopBar,
	DomAvatar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDatePicker,
	DomEmptyState,
	DomProgress,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/sprint-planning';
const reviewTabs = [
	{ key: 'issue', label: 'Issue' },
	{ key: 'commit', label: 'Commit' },
];

const workspace = ref(null);
const catalog = ref({ sprints: [], teams: [], owners: [], estimates: [], priorities: [] });
const sprint = ref(null);
const backlog = ref([]);
const activity = ref([]);
const selectedIssueId = ref('');
const selectedSprintId = ref('cycle_32');
const selectedTeam = ref('product');
const selectedPriority = ref('all');
const activeView = ref('sprint');
const reviewTab = ref('issue');
const loading = ref(true);
const busyAction = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const fieldErrors = ref({});
const exactMove = ref(null);
const exactPlan = ref(null);
const moveReceipt = ref(null);
const planReceipt = ref(null);
const moveAcknowledged = ref(false);
const planAcknowledged = ref(false);

const moveDraft = reactive({
	ownerId: '',
	estimate: '2',
});

const planDraft = reactive({
	goal: '',
	startsOn: '',
	endsOn: '',
});

const allIssues = computed(() => [...(sprint.value?.issues || []), ...backlog.value]);
const selectedIssue = computed(() => allIssues.value.find((issue) => issue.id === selectedIssueId.value) || null);
const filteredBacklog = computed(() => backlog.value.filter((issue) => {
	if (selectedPriority.value !== 'all' && issue.priority !== selectedPriority.value) return false;
	if (selectedTeam.value === 'platform' && !issue.id.startsWith('PLAT')) return false;
	if (selectedTeam.value === 'experience' && issue.id.startsWith('PLAT')) return false;
	return true;
}));
const mobileNavigation = computed(() => [
	{ value: 'backlog', label: 'Backlog', badge: String(backlog.value.length) },
	{ value: 'sprint', label: 'Cycle', badge: String(sprint.value?.issueCount || 0) },
	{ value: 'review', label: 'Review', badge: sprint.value?.status === 'committed' ? 'Done' : '' },
]);
const moveDestination = computed(() => selectedIssue.value?.bucket === 'sprint' ? 'backlog' : 'sprint');
const canCommitMove = computed(() => Boolean(exactMove.value) && exactMove.value.blockingChecks.length === 0 && moveAcknowledged.value);
const canCommitPlan = computed(() => Boolean(exactPlan.value) && exactPlan.value.blockingChecks.length === 0 && planAcknowledged.value);

onMounted(loadWorkspace);

watch(() => [moveDraft.ownerId, moveDraft.estimate], () => {
	exactMove.value = null;
	moveAcknowledged.value = false;
	fieldErrors.value = {};
});

watch(planDraft, () => {
	exactPlan.value = null;
	planAcknowledged.value = false;
	fieldErrors.value = {};
}, { deep: true });

/**
 * Loads the authoritative sprint-planning workspace from the local API.
 *
 * @param {boolean} clearMessages Whether existing alerts should be cleared.
 * @returns {Promise<void>}
 */
async function loadWorkspace(clearMessages = true) {
	if (clearMessages) clearFeedback();
	loading.value = true;
	try {
		const data = await requestJson(`${apiBase}/bootstrap`);
		applyWorkspace(data, data.workspace.selectedIssueId);
	} catch (requestError) {
		errorMessage.value = requestError.message || 'Unable to load sprint planning.';
	} finally {
		loading.value = false;
	}
}

/**
 * Applies an authoritative workspace response without fabricating client state.
 *
 * @param {Record<string, unknown>} data Sprint-planning API payload.
 * @param {string} preferredIssueId Issue to keep selected when available.
 * @returns {void}
 */
function applyWorkspace(data, preferredIssueId = '') {
	workspace.value = data.workspace;
	catalog.value = data.catalog || catalog.value;
	sprint.value = data.sprint;
	backlog.value = data.backlog || [];
	activity.value = data.activity || [];
	const issueId = preferredIssueId || selectedIssueId.value || data.workspace?.selectedIssueId;
	selectedIssueId.value = [...(data.sprint?.issues || []), ...(data.backlog || [])].some((issue) => issue.id === issueId)
		? issueId
		: data.sprint?.issues?.[0]?.id || data.backlog?.[0]?.id || '';
	syncIssueDraft();
	if (!planDraft.goal) syncPlanDraft();
}

/**
 * Copies the selected issue values into the move editor.
 *
 * @returns {void}
 */
function syncIssueDraft() {
	if (!selectedIssue.value) return;
	moveDraft.ownerId = selectedIssue.value.ownerId || '';
	moveDraft.estimate = String(selectedIssue.value.estimate || 1);
	exactMove.value = null;
	moveReceipt.value = null;
	moveAcknowledged.value = false;
}

/**
 * Copies the persisted sprint goal and dates into the commitment editor.
 *
 * @returns {void}
 */
function syncPlanDraft() {
	if (!sprint.value) return;
	planDraft.goal = sprint.value.goal || '';
	planDraft.startsOn = sprint.value.startsOn || '';
	planDraft.endsOn = sprint.value.endsOn || '';
	exactPlan.value = null;
	planReceipt.value = sprint.value.commitReceipt || null;
	planAcknowledged.value = false;
}

/**
 * Selects an issue and opens its inspector on compact layouts.
 *
 * @param {Record<string, unknown>} issue Issue summary selected by the operator.
 * @param {boolean} openInspector Whether to reveal the review destination.
 * @returns {void}
 */
function selectIssue(issue, openInspector = false) {
	selectedIssueId.value = issue.id;
	reviewTab.value = 'issue';
	syncIssueDraft();
	clearFeedback();
	if (openInspector) activeView.value = 'review';
}

/**
 * Requests an exact server preview for moving the selected issue.
 *
 * @returns {Promise<void>}
 */
async function previewMove() {
	if (!selectedIssue.value || !workspace.value || !sprint.value) return;
	clearFeedback();
	busyAction.value = 'preview-move';
	try {
		const data = await requestJson(`${apiBase}/issues/${selectedIssue.value.id}/preview-move`, {
			method: 'POST',
			body: JSON.stringify({
				workspaceRevision: workspace.value.revision,
				sprintVersion: sprint.value.version,
				issueVersion: selectedIssue.value.version,
				destination: moveDestination.value,
				ownerId: moveDraft.ownerId,
				estimate: Number(moveDraft.estimate),
			}),
		});
		exactMove.value = data.preview;
		moveAcknowledged.value = false;
	} catch (requestError) {
		applyRequestError(requestError, 'Unable to preview this scope move.');
	} finally {
		busyAction.value = '';
	}
}

/**
 * Commits the acknowledged issue move from its exact preview.
 *
 * @returns {Promise<void>}
 */
async function commitMove() {
	if (!selectedIssue.value || !exactMove.value || !workspace.value || !sprint.value) return;
	clearFeedback();
	busyAction.value = 'commit-move';
	try {
		const data = await requestJson(`${apiBase}/issues/${selectedIssue.value.id}/move`, {
			method: 'POST',
			body: JSON.stringify({
				workspaceRevision: workspace.value.revision,
				sprintVersion: sprint.value.version,
				issueVersion: selectedIssue.value.version,
				previewChecksum: exactMove.value.checksum,
				acknowledged: moveAcknowledged.value,
			}),
		});
		applyWorkspace(data, data.selectedIssueId);
		moveReceipt.value = data.receipt;
		successMessage.value = data.receipt.to === 'sprint'
			? `${data.receipt.issueId} is now in Cycle 32 with an audit receipt.`
			: `${data.receipt.issueId} returned to the backlog.`;
	} catch (requestError) {
		applyRequestError(requestError, 'Unable to commit this scope move.');
	} finally {
		busyAction.value = '';
	}
}

/**
 * Requests the exact server-owned sprint commitment review.
 *
 * @returns {Promise<void>}
 */
async function previewPlan() {
	if (!workspace.value || !sprint.value) return;
	clearFeedback();
	busyAction.value = 'preview-plan';
	try {
		const data = await requestJson(`${apiBase}/plan/preview`, {
			method: 'POST',
			body: JSON.stringify({
				workspaceRevision: workspace.value.revision,
				sprintVersion: sprint.value.version,
				goal: planDraft.goal,
				startsOn: planDraft.startsOn,
				endsOn: planDraft.endsOn,
			}),
		});
		exactPlan.value = data.preview;
		planAcknowledged.value = false;
	} catch (requestError) {
		applyRequestError(requestError, 'Unable to prepare the sprint review.');
	} finally {
		busyAction.value = '';
	}
}

/**
 * Commits the exact acknowledged sprint plan and preserves its receipts.
 *
 * @returns {Promise<void>}
 */
async function commitPlan() {
	if (!workspace.value || !sprint.value || !exactPlan.value) return;
	clearFeedback();
	busyAction.value = 'commit-plan';
	try {
		const data = await requestJson(`${apiBase}/plan/commit`, {
			method: 'POST',
			body: JSON.stringify({
				workspaceRevision: workspace.value.revision,
				sprintVersion: sprint.value.version,
				previewChecksum: exactPlan.value.checksum,
				acknowledged: planAcknowledged.value,
			}),
		});
		applyWorkspace(data, selectedIssueId.value);
		planReceipt.value = data.receipt;
		exactPlan.value = null;
		successMessage.value = `${data.sprint.name} committed with ${data.receipt.points} points.`;
	} catch (requestError) {
		applyRequestError(requestError, 'Unable to commit this sprint.');
	} finally {
		busyAction.value = '';
	}
}

/**
 * Opens the sprint commitment destination with the persisted draft values.
 *
 * @returns {void}
 */
function openPlanReview() {
	reviewTab.value = 'commit';
	activeView.value = 'review';
	clearFeedback();
}

/**
 * Restores the deterministic repository-local API state.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	clearFeedback();
	busyAction.value = 'reset';
	try {
		const data = await requestJson(`${apiBase}/reset`, { method: 'POST' });
		planDraft.goal = '';
		applyWorkspace(data, data.workspace.selectedIssueId);
		exactMove.value = null;
		exactPlan.value = null;
		moveReceipt.value = null;
		planReceipt.value = null;
		activeView.value = 'sprint';
		successMessage.value = 'The sprint-planning demo has been restored.';
	} catch (requestError) {
		applyRequestError(requestError, 'Unable to reset sprint planning.');
	} finally {
		busyAction.value = '';
	}
}

/**
 * Applies structured API errors to the page-level and field-level feedback.
 *
 * @param {Error & { fields?: Record<string, string[]> }} requestError Structured request error.
 * @param {string} fallbackMessage Fallback message when the API omits one.
 * @returns {void}
 */
function applyRequestError(requestError, fallbackMessage) {
	fieldErrors.value = requestError.fields || {};
	errorMessage.value = requestError.message || fallbackMessage;
}

/**
 * Clears transient API feedback and structured field errors.
 *
 * @returns {void}
 */
function clearFeedback() {
	errorMessage.value = '';
	successMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Sends a JSON request and preserves structured API error details.
 *
 * @param {string} url Request URL.
 * @param {RequestInit} options Fetch options.
 * @returns {Promise<Record<string, unknown>>} Parsed JSON response.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
		...options,
	});
	const data = await response.json();
	if (!response.ok) throw createRequestError(data, response.status);
	return data;
}

/**
 * Creates a request error with API field validation metadata.
 *
 * @param {Record<string, unknown>} data Error response payload.
 * @param {number} status HTTP response status.
 * @returns {Error & { status: number, fields: Record<string, string[]> }} Structured request error.
 */
function createRequestError(data, status) {
	const error = new Error(data.message || `Request failed with status ${status}.`);
	error.status = status;
	error.fields = data.fields || {};
	return error;
}

/**
 * Returns the DOM Studio tone for an issue priority.
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

/**
 * Returns the DOM Studio tone for an issue readiness state.
 *
 * @param {string} readiness Stored issue readiness.
 * @returns {string} DOM Studio tone.
 */
function readinessTone(readiness) {
	return {
		ready: 'success',
		blocked: 'danger',
		unassigned: 'warning',
	}[readiness] || 'neutral';
}
</script>

<template>
	<DomAppShell variant="app" class="!h-dvh bg-canvas text-canvas-fg">
		<template #top>
			<DomAppTopBar
				title="Cycle 32 planning"
				:subtitle="sprint ? `${sprint.points} of ${sprint.capacity} points · ${sprint.issueCount} committed issues` : 'Product delivery'"
			>
				<template #leading>
					<div class="grid size-9 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-fg" aria-hidden="true">NS</div>
				</template>
				<template #trailing>
					<DomStatusPill v-if="sprint" :tone="sprint.status === 'committed' ? 'success' : 'warning'" size="sm">{{ sprint.status === 'committed' ? 'Committed' : 'Planning' }}</DomStatusPill>
					<DomButton class="!hidden sm:!inline-flex" size="sm" variant="secondary" :loading="busyAction === 'reset'" @click="resetWorkspace">Reset demo</DomButton>
				</template>
			</DomAppTopBar>
		</template>

		<div class="relative h-full min-h-0 overflow-hidden">
			<div v-if="errorMessage || successMessage" class="absolute inset-x-3 top-3 z-30 mx-auto max-w-2xl">
				<DomAlert v-if="errorMessage" tone="danger" variant="toast" title="Planning needs attention" :description="errorMessage" dismissible @dismiss="errorMessage = ''" />
				<DomAlert v-else tone="success" variant="toast" title="Planning updated" :description="successMessage" dismissible @dismiss="successMessage = ''" />
			</div>

			<div v-if="loading" class="grid h-full xl:grid-cols-[18rem_minmax(0,1fr)_23rem]">
				<div v-for="column in 3" :key="column" class="space-y-3 border-r border-border p-4 last:border-r-0">
					<DomSkeleton height="h-10" width="w-2/3" />
					<DomSkeleton v-for="row in 7" :key="row" height="h-14" />
				</div>
			</div>

			<DomEmptyState v-else-if="!workspace || !sprint" title="Planning workspace unavailable" description="Reload the repository-local API to restore the product-team sprint.">
				<DomButton @click="loadWorkspace">Reload workspace</DomButton>
			</DomEmptyState>

			<div v-else class="grid h-full min-h-0 min-w-0 grid-cols-1 overflow-hidden xl:grid-cols-[18rem_minmax(0,1fr)_23rem]">
				<aside
					class="h-full min-h-0 min-w-0 overflow-y-auto border-r border-border bg-muted/10"
					:class="activeView === 'backlog' ? 'block' : 'hidden xl:block'"
					aria-label="Product backlog"
				>
					<header class="border-b border-border p-4">
						<div class="flex items-center justify-between gap-3">
							<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Candidate scope</p><h2 class="mt-1 text-lg font-semibold">Backlog</h2></div>
							<DomBadge tone="neutral" variant="outline">{{ backlog.length }}</DomBadge>
						</div>
						<div class="mt-4 grid gap-3">
							<DomSelect v-model="selectedTeam" label="Team" :options="catalog.teams" width="min-w-0">
								<template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template>
							</DomSelect>
							<DomSelect v-model="selectedPriority" label="Priority" :options="catalog.priorities" width="min-w-0" />
						</div>
					</header>

					<div v-if="filteredBacklog.length" class="divide-y divide-border">
						<button
							v-for="issue in filteredBacklog"
							:key="issue.id"
							type="button"
							class="w-full border-l-2 px-4 py-4 text-left transition hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-ring"
							:class="issue.id === selectedIssueId ? 'border-l-primary bg-secondary/45' : 'border-l-transparent'"
							@click="selectIssue(issue, true)"
						>
							<div class="flex items-center justify-between gap-3"><span class="font-mono text-[11px] text-muted-fg">{{ issue.id }}</span><DomBadge :tone="priorityTone(issue.priority)" size="sm">{{ issue.priorityLabel }}</DomBadge></div>
							<p class="mt-2 text-sm font-semibold leading-5">{{ issue.title }}</p>
							<p class="mt-2 line-clamp-2 text-xs leading-5 text-muted-fg">{{ issue.description }}</p>
							<div class="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-fg"><span>{{ issue.ownerName }}</span><span>{{ issue.estimate }} pts</span></div>
						</button>
					</div>
					<DomEmptyState v-else compact title="No matching candidates" description="Change the team or priority filter to reveal more backlog work." />
				</aside>

				<main
					class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-canvas"
					:class="activeView === 'sprint' ? 'flex' : 'hidden xl:flex'"
					aria-labelledby="sprint-heading"
				>
					<header class="shrink-0 border-b border-border px-4 py-4 sm:px-6">
						<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2"><DomBadge tone="neutral" variant="outline">v{{ sprint.version }}</DomBadge><DomBadge :tone="sprint.status === 'committed' ? 'success' : 'warning'" variant="soft">{{ sprint.status }}</DomBadge></div>
								<h1 id="sprint-heading" class="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{{ sprint.name }}</h1>
								<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">{{ sprint.goal }}</p>
							</div>
							<div class="grid shrink-0 gap-3 sm:grid-cols-2 lg:w-[25rem]">
								<DomSelect v-model="selectedSprintId" label="Iteration" :options="catalog.sprints" width="min-w-0">
									<template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template>
								</DomSelect>
								<DomButton class="w-full self-end lg:w-auto" @click="openPlanReview">Review commitment</DomButton>
							</div>
						</div>
					</header>

					<section class="shrink-0 border-b border-border bg-primary/5 px-4 py-4 sm:px-6" aria-label="Sprint capacity">
						<div class="flex flex-wrap items-end justify-between gap-4">
							<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Forecast capacity</p><p class="mt-1 text-2xl font-semibold">{{ sprint.points }} <span class="text-sm font-normal text-muted-fg">/ {{ sprint.capacity }} points</span></p></div>
							<div class="text-right"><p class="text-sm font-semibold">{{ sprint.remaining }} points open</p><p class="mt-1 text-xs text-muted-fg">Velocity: {{ sprint.velocity.join(' · ') }}</p></div>
						</div>
						<DomProgress class="mt-3" :value="sprint.capacityPercent" size="sm" :tone="sprint.capacityPercent > 100 ? 'danger' : sprint.capacityPercent > 85 ? 'warning' : 'success'" />
						<div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
							<div v-for="owner in sprint.capacityRows" :key="owner.id" class="min-w-0">
								<div class="flex items-center gap-2"><DomAvatar :name="owner.name" :initials="owner.initials" size="xs" /><div class="min-w-0"><p class="truncate text-xs font-semibold">{{ owner.name }}</p><p class="text-[10px] text-muted-fg">{{ owner.planned }}/{{ owner.capacity }} pts</p></div></div>
								<DomProgress class="mt-2" :value="owner.percent" size="xs" :tone="owner.percent > 100 ? 'danger' : 'primary'" />
							</div>
						</div>
					</section>

					<div class="min-h-0 flex-1 overflow-y-auto">
						<div class="hidden grid-cols-[5rem_minmax(12rem,1fr)_7rem_6rem_6rem] gap-3 border-b border-border bg-muted/15 px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-fg md:grid">
							<span>Issue</span><span>Committed scope</span><span>Owner</span><span>Readiness</span><span class="text-right">Estimate</span>
						</div>
						<button
							v-for="issue in sprint.issues"
							:key="issue.id"
							type="button"
							class="grid w-full gap-3 border-b border-border px-4 py-4 text-left transition hover:bg-secondary/35 focus-visible:outline-2 focus-visible:outline-ring sm:px-6 md:grid-cols-[5rem_minmax(12rem,1fr)_7rem_6rem_6rem] md:items-center md:py-3"
							:class="issue.id === selectedIssueId ? 'bg-secondary/30' : ''"
							@click="selectIssue(issue, true)"
						>
							<div class="flex items-center justify-between md:block"><span class="font-mono text-xs text-muted-fg">{{ issue.id }}</span><DomBadge class="md:mt-2" :tone="priorityTone(issue.priority)" size="sm">{{ issue.priorityLabel }}</DomBadge></div>
							<div class="min-w-0"><p class="truncate text-sm font-semibold">{{ issue.title }}</p><p class="mt-1 truncate text-xs text-muted-fg">{{ issue.project }} · {{ issue.labels.join(' · ') }}</p></div>
							<p class="text-xs text-muted-fg">{{ issue.ownerName }}</p>
							<DomStatusPill :tone="readinessTone(issue.readiness)" size="sm">{{ issue.readiness }}</DomStatusPill>
							<p class="text-right text-sm font-semibold">{{ issue.estimate }} pts</p>
						</button>
					</div>

					<footer class="hidden shrink-0 border-t border-border px-6 py-3 2xl:block">
						<div class="flex items-center justify-between gap-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Planning activity</p><span class="text-[11px] text-muted-fg">r{{ workspace.revision }}</span></div>
						<div class="mt-2 grid gap-3 md:grid-cols-3"><div v-for="event in activity.slice(0, 3)" :key="event.id" class="min-w-0 border-l border-border pl-3"><p class="truncate text-xs font-semibold">{{ event.title }}</p><p class="mt-1 truncate text-[11px] text-muted-fg">{{ event.actor }} · {{ event.time }}</p></div></div>
					</footer>
				</main>

				<aside
					class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-l border-border bg-muted/10"
					:class="activeView === 'review' ? 'flex' : 'hidden xl:flex'"
					aria-label="Sprint review"
				>
					<DomTabs v-model="reviewTab" :tabs="reviewTabs" variant="page" fill class="min-h-0 flex-1">
						<template #issue>
							<div v-if="selectedIssue" class="h-full min-h-0 overflow-y-auto p-4">
								<template v-if="moveReceipt">
									<DomAlert tone="success" title="Scope updated" :description="`${moveReceipt.issueId} moved from ${moveReceipt.from} to ${moveReceipt.to}.`" />
									<dl class="mt-4 divide-y divide-border border-y border-border text-sm"><div class="py-3"><dt class="text-xs text-muted-fg">Audit receipt</dt><dd class="mt-1 font-mono text-xs">{{ moveReceipt.auditReceipt }}</dd></div><div class="py-3"><dt class="text-xs text-muted-fg">Exact preview</dt><dd class="mt-1 truncate font-mono text-xs">{{ moveReceipt.previewChecksum }}</dd></div><div class="py-3"><dt class="text-xs text-muted-fg">Sprint version</dt><dd class="mt-1 font-semibold">v{{ moveReceipt.sprintVersion }}</dd></div></dl>
									<DomButton class="mt-4 w-full" variant="secondary" @click="moveReceipt = null">Review issue</DomButton>
								</template>

								<template v-else-if="exactMove">
									<div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Exact scope preview</p><h2 class="mt-1 text-lg font-semibold">{{ exactMove.destination === 'sprint' ? 'Add to Cycle 32' : 'Return to backlog' }}</h2></div><DomBadge tone="neutral" variant="outline">{{ exactMove.currentPoints }} → {{ exactMove.nextPoints }}</DomBadge></div>
									<div class="mt-4 border-y border-border py-4"><p class="text-sm font-semibold">{{ selectedIssue.id }} · {{ selectedIssue.title }}</p><p class="mt-2 text-xs leading-5 text-muted-fg">{{ exactMove.ownerName }} · {{ exactMove.estimate }} points · capacity {{ exactMove.nextPoints }}/{{ exactMove.capacity }}</p><p class="mt-2 truncate font-mono text-[10px] text-muted-fg">{{ exactMove.checksum }}</p></div>
									<div class="mt-4 space-y-3"><div v-for="check in exactMove.checks" :key="check.key" class="flex items-start justify-between gap-3 text-sm"><span>{{ check.label }}</span><DomStatusPill :tone="check.passed ? 'success' : 'danger'" size="sm">{{ check.passed ? 'Passed' : 'Blocked' }}</DomStatusPill></div></div>
									<DomCheckbox v-model="moveAcknowledged" class="mt-5" label="Commit this exact move" description="I reviewed ownership, estimate, dependencies, capacity, and the immutable issue version." :errors="fieldErrors.acknowledged || []" />
									<DomButton class="mt-4 w-full" :disabled="!canCommitMove" :loading="busyAction === 'commit-move'" @click="commitMove">Commit scope change</DomButton>
									<DomButton class="mt-2 w-full" variant="ghost" @click="exactMove = null">Back to issue</DomButton>
								</template>

								<template v-else>
									<div class="flex items-start justify-between gap-3"><div><p class="font-mono text-xs text-muted-fg">{{ selectedIssue.id }} · v{{ selectedIssue.version }}</p><h2 class="mt-2 text-lg font-semibold leading-6">{{ selectedIssue.title }}</h2></div><DomBadge :tone="priorityTone(selectedIssue.priority)">{{ selectedIssue.priorityLabel }}</DomBadge></div>
									<p class="mt-3 text-sm leading-6 text-muted-fg">{{ selectedIssue.description }}</p>
									<div class="mt-4 flex flex-wrap gap-2"><DomStatusPill :tone="readinessTone(selectedIssue.readiness)" size="sm">{{ selectedIssue.readiness }}</DomStatusPill><DomBadge v-for="label in selectedIssue.labels" :key="label" tone="neutral" variant="outline">{{ label }}</DomBadge></div>
									<div v-if="selectedIssue.blockers.length" class="mt-4"><DomAlert tone="warning" title="Dependency unresolved" :description="selectedIssue.blockers.join(', ')" /></div>
									<section class="mt-5 border-t border-border pt-5"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Move preparation</p><div class="mt-4 grid gap-4"><DomSelect v-model="moveDraft.ownerId" label="Accountable owner" :options="catalog.owners" :errors="fieldErrors.ownerId || []" width="min-w-0"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="moveDraft.estimate" label="Estimate" :options="catalog.estimates" :errors="fieldErrors.estimate || []" width="min-w-0" /></div></section>
									<DomButton class="mt-5 w-full" :loading="busyAction === 'preview-move'" @click="previewMove">Preview {{ moveDestination === 'sprint' ? 'move to sprint' : 'return to backlog' }}</DomButton>
								</template>
							</div>
							<DomEmptyState v-else compact title="Choose an issue" description="Select backlog or sprint work to inspect its exact planning state." />
						</template>

						<template #commit>
							<div class="h-full min-h-0 overflow-y-auto p-4">
								<template v-if="planReceipt">
									<DomAlert tone="success" title="Cycle 32 committed" :description="`${planReceipt.points} points are locked to plan ${planReceipt.planChecksum}.`" />
									<dl class="mt-4 divide-y divide-border border-y border-border text-sm"><div class="py-3"><dt class="text-xs text-muted-fg">Audit receipt</dt><dd class="mt-1 font-mono text-xs">{{ planReceipt.auditReceipt }}</dd></div><div class="py-3"><dt class="text-xs text-muted-fg">Calendar receipt</dt><dd class="mt-1 font-mono text-xs">{{ planReceipt.calendarReceipt }}</dd></div><div class="py-3"><dt class="text-xs text-muted-fg">Committed issues</dt><dd class="mt-1 text-xs leading-5">{{ planReceipt.issueIds.join(' · ') }}</dd></div></dl>
									<DomButton class="mt-4 w-full" variant="secondary" @click="planReceipt = null">Review plan</DomButton>
								</template>

								<template v-else-if="exactPlan">
									<div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Exact commitment</p><h2 class="mt-1 text-lg font-semibold">Ready to lock scope</h2></div><DomBadge tone="info" variant="soft">{{ exactPlan.points }}/{{ exactPlan.capacity }} pts</DomBadge></div>
									<blockquote class="mt-4 border-l-2 border-primary pl-3 text-sm leading-6">{{ exactPlan.goal }}</blockquote>
									<p class="mt-3 font-mono text-[10px] text-muted-fg">{{ exactPlan.startsOn }} → {{ exactPlan.endsOn }}</p>
									<div class="mt-4 space-y-3 border-y border-border py-4"><div v-for="check in exactPlan.checks" :key="check.key" class="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm"><div><p class="font-medium">{{ check.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div><DomStatusPill :tone="check.passed ? 'success' : 'danger'" size="sm">{{ check.passed ? 'Passed' : 'Blocked' }}</DomStatusPill></div></div>
									<p class="mt-3 truncate font-mono text-[10px] text-muted-fg">{{ exactPlan.checksum }} · sprint v{{ exactPlan.sprintVersion }}</p>
									<DomCheckbox v-model="planAcknowledged" class="mt-5" label="Commit this exact sprint" description="I reviewed the goal, dates, ownership, dependencies, capacity, and immutable scope." :errors="fieldErrors.acknowledged || []" />
									<DomButton class="mt-4 w-full" :disabled="!canCommitPlan" :loading="busyAction === 'commit-plan'" @click="commitPlan">Commit Cycle 32</DomButton>
									<DomButton class="mt-2 w-full" variant="ghost" @click="exactPlan = null">Back to planning</DomButton>
								</template>

								<template v-else>
									<div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Sprint contract</p><h2 class="mt-1 text-lg font-semibold">Review commitment</h2></div><DomBadge :tone="sprint.status === 'committed' ? 'success' : 'warning'" variant="soft">{{ sprint.status }}</DomBadge></div>
									<p class="mt-3 text-sm leading-6 text-muted-fg">The server rechecks scope, owner capacity, dependencies, dates, and exact revisions before the cycle can be committed.</p>
									<div class="mt-5 grid gap-4"><DomTextareaInput v-model="planDraft.goal" label="Sprint goal" description="Describe the outcome this scope should produce." :rows="3" :errors="fieldErrors.goal || []" /><div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><DomDatePicker v-model="planDraft.startsOn" label="Starts" :errors="fieldErrors.startsOn || []" /><DomDatePicker v-model="planDraft.endsOn" label="Ends" :errors="fieldErrors.endsOn || []" /></div></div>
									<section class="mt-5 border-y border-border py-4"><div class="flex items-center justify-between text-sm"><span class="text-muted-fg">Planned capacity</span><span class="font-semibold">{{ sprint.points }}/{{ sprint.capacity }}</span></div><DomProgress class="mt-2" :value="sprint.capacityPercent" size="sm" :tone="sprint.capacityPercent > 100 ? 'danger' : 'primary'" /><div class="mt-3 flex items-center justify-between text-xs text-muted-fg"><span>{{ sprint.issueCount }} issues</span><span>{{ sprint.remaining }} points open</span></div></section>
									<DomButton class="mt-5 w-full" :loading="busyAction === 'preview-plan'" @click="previewPlan">Generate exact review</DomButton>
								</template>
							</div>
						</template>
					</DomTabs>
				</aside>
			</div>
		</div>

		<template #bottom>
			<DomAppBottomNav v-model="activeView" :items="mobileNavigation" class="xl:hidden" />
		</template>
	</DomAppShell>
</template>
