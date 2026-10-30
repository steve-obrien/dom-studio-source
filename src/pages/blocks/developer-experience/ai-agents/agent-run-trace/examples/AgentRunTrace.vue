<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomCodeInput,
	DomDialog,
	DomEmptyState,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextInput,
	DomToggleButtonGroup,
	DomTreeView,
} from '@getdom/studio/vue';
import TraceSpanRow from '../components/TraceSpanRow.vue';

const loading = ref(true);
const busy = ref(false);
const bootstrap = ref(null);
const runs = ref([]);
const run = ref(null);
const selectedRunId = ref('');
const selectedSpanId = ref('');
const mobileView = ref('trace');
const inspectorTab = ref('overview');
const environmentFilter = ref('all');
const statusFilter = ref('all');
const spanTypeFilter = ref('all');
const searchQuery = ref('');
const payload = ref(null);
const payloadAccess = ref(null);
const reviewDraft = ref(createReviewDraft());
const actionDraft = ref(createActionDraft());
const actionReceipt = ref(null);
const fieldErrors = ref({});
const errorMessage = ref('');
const successMessage = ref('');
const resetDialogOpen = ref(false);

const mobileTabs = [
	{ key: 'runs', label: 'Runs' },
	{ key: 'trace', label: 'Trace' },
	{ key: 'inspector', label: 'Inspector' },
];

const inspectorTabs = [
	{ key: 'overview', label: 'Overview' },
	{ key: 'payload', label: 'Payload' },
	{ key: 'action', label: 'Action' },
];

const actionOptions = [
	{ value: 'replay', label: 'Replay', description: 'Queue an exact-revision retry from the selected failure.' },
	{ value: 'eval', label: 'Create eval case', description: 'Turn this span into a regression case before changing production.' },
	{ value: 'export', label: 'Export trace', description: 'Create a redacted trace bundle with immutable proof.' },
];

const filteredRuns = computed(getFilteredRuns);
const traceItems = computed(getTraceItems);
const visibleSpans = computed(getVisibleSpans);
const selectedSpan = computed(getSelectedSpan);
const payloadJson = computed(getPayloadJson);
const actionTitle = computed(getActionTitle);
const issueSpans = computed(getIssueSpans);

/**
 * Creates an empty investigation handoff draft.
 *
 * @returns {{ ownerId: string, reviewState: string, note: string }} Review values.
 */
function createReviewDraft() {
	return { ownerId: 'unassigned', reviewState: 'open', note: '' };
}

/**
 * Creates a safe default trace action draft.
 *
 * @returns {{ action: string, mode: string, reason: string, acknowledged: boolean }} Action values.
 */
function createActionDraft() {
	return {
		action: 'replay',
		mode: 'from_span',
		reason: '',
		acknowledged: false,
	};
}

/**
 * Loads the API-backed run queue and its default incident.
 *
 * @returns {Promise<void>}
 */
async function loadWorkspace() {
	loading.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/agent-run-trace/bootstrap');
		bootstrap.value = result;
		runs.value = result.runs || [];
		selectedRunId.value = result.defaultRunId || runs.value[0]?.id || '';
		await loadRun(selectedRunId.value);
	} catch (error) {
		errorMessage.value = error.message || 'The trace workspace could not be loaded.';
	} finally {
		loading.value = false;
	}
}

/**
 * Loads one run and resets span-specific transient state.
 *
 * @param {string} runId Run identifier.
 * @returns {Promise<void>}
 */
async function loadRun(runId) {
	if (!runId) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/agent-run-trace/runs/${runId}`);
		applyRun(result.run);
		selectedSpanId.value = defaultSpanId(result.run);
		inspectorTab.value = 'overview';
	} catch (error) {
		errorMessage.value = error.message || 'The selected run could not be loaded.';
	} finally {
		busy.value = false;
	}
}

/**
 * Applies authoritative run state and synchronizes editable review values.
 *
 * @param {Record<string, unknown>} nextRun Updated run.
 * @returns {void}
 */
function applyRun(nextRun) {
	run.value = nextRun;
	selectedRunId.value = nextRun.id;
	reviewDraft.value = {
		ownerId: nextRun.ownerId,
		reviewState: nextRun.reviewState,
		note: '',
	};
	const index = runs.value.findIndex((item) => item.id === nextRun.id);
	const summary = summarizeRun(nextRun);
	if (index >= 0) runs.value.splice(index, 1, summary);
	else runs.value.unshift(summary);
}

/**
 * Returns a list-compatible summary from a run detail response.
 *
 * @param {Record<string, unknown>} value Run detail.
 * @returns {Record<string, unknown>} Run summary.
 */
function summarizeRun(value) {
	const { spans, actions, activity, ...summary } = value;
	return summary;
}

/**
 * Chooses the most useful initial span for an investigation.
 *
 * @param {Record<string, unknown>} value Run detail.
 * @returns {string} Span identifier.
 */
function defaultSpanId(value) {
	return value.spans?.find((span) => span.status === 'failed' && span.parentId)?.id
		|| value.spans?.find((span) => span.status === 'failed')?.id
		|| value.spans?.find((span) => span.status === 'warning')?.id
		|| value.spans?.[0]?.id
		|| '';
}

/**
 * Filters the run rail by environment and outcome.
 *
 * @returns {Array<Record<string, unknown>>} Visible run summaries.
 */
function getFilteredRuns() {
	return runs.value.filter((item) => {
		const environmentMatches = environmentFilter.value === 'all' || item.environment === environmentFilter.value;
		const statusMatches = statusFilter.value === 'all' || item.status === statusFilter.value;
		return environmentMatches && statusMatches;
	});
}

/**
 * Builds and filters the trace tree for the selected run.
 *
 * @returns {Array<Record<string, unknown>>} DOM Studio tree items.
 */
function getTraceItems() {
	if (!run.value?.spans) return [];
	return filterTree(buildTree(run.value.spans));
}

/**
 * Flattens the filtered trace for count and selection recovery.
 *
 * @returns {Array<Record<string, unknown>>} Visible flat span list.
 */
function getVisibleSpans() {
	return flattenSpans(traceItems.value);
}

/**
 * Resolves the selected span from current authoritative run state.
 *
 * @returns {Record<string, unknown>|null} Selected span.
 */
function getSelectedSpan() {
	return run.value?.spans?.find((span) => span.id === selectedSpanId.value) || visibleSpans.value[0] || null;
}

/**
 * Serializes a loaded redacted payload for the code input.
 *
 * @returns {string} Formatted payload JSON.
 */
function getPayloadJson() {
	if (!payload.value) return '';
	return JSON.stringify(payload.value, null, 2);
}

/**
 * Returns the contextual action-panel title.
 *
 * @returns {string} Action title.
 */
function getActionTitle() {
	return actionOptions.find((option) => option.value === actionDraft.value.action)?.label || 'Trace action';
}

/**
 * Returns warning and failed spans that are safe retry candidates.
 *
 * @returns {Array<Record<string, unknown>>} Open issue spans.
 */
function getIssueSpans() {
	return run.value?.spans?.filter((span) => span.status !== 'ok') || [];
}

/**
 * Builds parent-linked spans into a DOM Studio tree shape.
 *
 * @param {Array<Record<string, unknown>>} spans Flat spans.
 * @returns {Array<Record<string, unknown>>} Nested spans.
 */
function buildTree(spans) {
	const nodes = new Map(spans.map((span) => [span.id, {
		...span,
		label: span.name,
		open: true,
		draggable: false,
		children: [],
	}]));
	const roots = [];
	for (const span of spans) {
		const node = nodes.get(span.id);
		if (span.parentId && nodes.has(span.parentId)) nodes.get(span.parentId).children.push(node);
		else roots.push(node);
	}
	return roots;
}

/**
 * Preserves parent context while filtering span descendants.
 *
 * @param {Array<Record<string, unknown>>} nodes Trace tree nodes.
 * @returns {Array<Record<string, unknown>>} Filtered tree.
 */
function filterTree(nodes) {
	return nodes.map((node) => {
		const children = filterTree(node.children || []);
		if (spanMatches(node) || children.length) return { ...node, children };
		return null;
	}).filter(Boolean);
}

/**
 * Tests a span against type and text filters.
 *
 * @param {Record<string, unknown>} span Trace span.
 * @returns {boolean} Whether the span should remain visible.
 */
function spanMatches(span) {
	const typeMatches = spanTypeFilter.value === 'all' || span.type === spanTypeFilter.value;
	const query = searchQuery.value.trim().toLowerCase();
	const textMatches = !query || [span.name, span.summary, ...(span.tags || [])].join(' ').toLowerCase().includes(query);
	return typeMatches && textMatches;
}

/**
 * Flattens nested trace nodes in visible order.
 *
 * @param {Array<Record<string, unknown>>} nodes Trace tree nodes.
 * @returns {Array<Record<string, unknown>>} Flat visible spans.
 */
function flattenSpans(nodes) {
	return nodes.flatMap((node) => [node, ...flattenSpans(node.children || [])]);
}

/**
 * Selects and loads a run from the run rail or rich select.
 *
 * @param {string} runId Run identifier.
 * @returns {Promise<void>}
 */
async function selectRun(runId) {
	if (!runId || runId === run.value?.id) return;
	selectedRunId.value = runId;
	await loadRun(runId);
	mobileView.value = 'trace';
}

/**
 * Selects one trace span without forcing desktop-style navigation on mobile.
 *
 * @param {string} spanId Span identifier.
 * @returns {void}
 */
function selectSpan(spanId) {
	if (!spanId) return;
	selectedSpanId.value = spanId;
}

/**
 * Opens the inspector on the current responsive surface.
 *
 * @param {string} tab Inspector tab.
 * @returns {void}
 */
function openInspector(tab = 'overview') {
	inspectorTab.value = tab;
	mobileView.value = 'inspector';
}

/**
 * Clears stale payload and action evidence when span selection changes.
 *
 * @returns {void}
 */
function handleSelectedSpanChange() {
	payload.value = null;
	payloadAccess.value = null;
	actionReceipt.value = null;
	fieldErrors.value = {};
	actionDraft.value = createActionDraft();
}

/**
 * Returns the selected span id for the watcher dependency.
 *
 * @returns {string} Selected span identifier.
 */
function getSelectedSpanId() {
	return selectedSpanId.value;
}

/**
 * Loads a redacted span payload through its privileged API seam.
 *
 * @returns {Promise<void>}
 */
async function loadPayload() {
	if (!run.value || !selectedSpan.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/agent-run-trace/runs/${run.value.id}/payload?spanId=${encodeURIComponent(selectedSpan.value.id)}`);
		payload.value = result.payload;
		payloadAccess.value = result.access;
		successMessage.value = result.message;
	} catch (error) {
		errorMessage.value = error.message || 'The redacted payload could not be loaded.';
	} finally {
		busy.value = false;
	}
}

/**
 * Saves investigation ownership and state through the optimistic API.
 *
 * @returns {Promise<void>}
 */
async function saveReview() {
	if (!run.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/agent-run-trace/runs/${run.value.id}/review`, {
			method: 'PATCH',
			body: { revision: run.value.revision, ...reviewDraft.value },
		});
		applyRun(result.run);
		if (result.runs) runs.value = result.runs;
		successMessage.value = result.message;
	} catch (error) {
		applyRequestError(error, 'The investigation handoff could not be saved.');
	} finally {
		busy.value = false;
	}
}

/**
 * Creates the selected replay, eval, or export action.
 *
 * @param {string|null} directAction Optional action shortcut.
 * @returns {Promise<void>}
 */
async function createAction(directAction = null) {
	if (!run.value || !selectedSpan.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	const action = directAction || actionDraft.value.action;
	try {
		const result = await requestJson(`/api/block-demos/agent-run-trace/runs/${run.value.id}/actions`, {
			method: 'POST',
			body: {
				revision: run.value.revision,
				spanId: selectedSpan.value.id,
				action,
				mode: actionDraft.value.mode,
				reason: actionDraft.value.reason,
				acknowledged: directAction === 'export' ? false : actionDraft.value.acknowledged,
			},
		});
		applyRun(result.run);
		if (result.runs) runs.value = result.runs;
		actionReceipt.value = result.receipt;
		actionDraft.value = createActionDraft();
		inspectorTab.value = 'action';
		successMessage.value = result.message;
	} catch (error) {
		applyRequestError(error, 'The trace action could not be created.');
	} finally {
		busy.value = false;
	}
}

/**
 * Opens the replay action with a useful issue span selected.
 *
 * @returns {void}
 */
function prepareReplay() {
	const issue = issueSpans.value.find((span) => span.id === selectedSpanId.value) || issueSpans.value[0];
	if (issue) selectedSpanId.value = issue.id;
	actionDraft.value = createActionDraft();
	openInspector('action');
}

/**
 * Resets all process-local run mutations and returns to the default incident.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	if (busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/agent-run-trace/reset', { method: 'POST' });
		bootstrap.value = { ...bootstrap.value, ...result };
		runs.value = result.runs || [];
		applyRun(result.run);
		selectedSpanId.value = defaultSpanId(result.run);
		payload.value = null;
		payloadAccess.value = null;
		actionReceipt.value = null;
		actionDraft.value = createActionDraft();
		mobileView.value = 'trace';
		inspectorTab.value = 'overview';
		resetDialogOpen.value = false;
		successMessage.value = result.message;
	} catch (error) {
		errorMessage.value = error.message || 'The trace workspace could not be reset.';
	} finally {
		busy.value = false;
	}
}

/**
 * Promotes structured API errors into visible recovery state.
 *
 * @param {Error & { fields?: Array<Record<string, string>>, payload?: Record<string, unknown> }} error Request error.
 * @param {string} fallback Fallback message.
 * @returns {void}
 */
function applyRequestError(error, fallback) {
	errorMessage.value = error.message || fallback;
	fieldErrors.value = Object.fromEntries((error.fields || []).map((field) => [field.field, [field.message]]));
	if (error.payload?.run) applyRun(error.payload.run);
	if (error.payload?.runs) runs.value = error.payload.runs;
}

/**
 * Clears transient success, error, and field-level feedback.
 *
 * @returns {void}
 */
function clearFeedback() {
	errorMessage.value = '';
	successMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Formats milliseconds into a compact trace duration.
 *
 * @param {number} value Milliseconds.
 * @returns {string} Compact duration.
 */
function formatDuration(value) {
	return Number(value) >= 1000 ? `${(Number(value) / 1000).toFixed(2)}s` : `${value}ms`;
}

/**
 * Formats a US-dollar amount for trace cost display.
 *
 * @param {number} value Dollar amount.
 * @returns {string} Currency label.
 */
function formatCost(value) {
	return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 3 }).format(Number(value || 0));
}

/**
 * Formats a token count with a compact suffix.
 *
 * @param {number} value Token count.
 * @returns {string} Compact count.
 */
function formatTokens(value) {
	return Number(value) >= 1000 ? `${(Number(value) / 1000).toFixed(1)}k` : String(value || 0);
}

/**
 * Formats an ISO timestamp as local time.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Localized time.
 */
function formatTime(value) {
	if (!value) return 'Unknown time';
	return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value));
}

/**
 * Resolves a review-state tone for DOM Studio status components.
 *
 * @param {string} value Review state.
 * @returns {string} Semantic tone.
 */
function reviewTone(value) {
	return { open: 'warning', investigating: 'info', resolved: 'success' }[value] || 'neutral';
}

/**
 * Resolves an option label from a bootstrap collection.
 *
 * @param {Array<Record<string, string>>} options Option collection.
 * @param {string} value Selected value.
 * @returns {string} Option label.
 */
function optionLabel(options, value) {
	return options?.find((option) => option.value === value)?.label || value;
}

/**
 * Sends JSON requests and converts structured errors into exceptions.
 *
 * @param {string} url API route.
 * @param {{ method?: string, body?: Record<string, unknown> }} options Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed response.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		method: options.method || 'GET',
		headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const result = await response.json();
	if (!response.ok || result.error) {
		const error = new Error(result.error?.message || `Request failed with ${response.status}.`);
		error.fields = result.error?.fields || [];
		error.payload = result.error || result;
		throw error;
	}
	return result;
}

watch(getSelectedSpanId, handleSelectedSpanChange);
onMounted(loadWorkspace);
</script>

<template>
	<div class="h-dvh min-h-0 overflow-hidden bg-canvas text-canvas-fg">
		<div v-if="loading" class="flex h-full flex-col">
			<div class="flex h-16 items-center border-b border-border px-4"><DomSkeleton variant="text" :lines="1" width="28rem" /></div>
			<div class="grid min-h-0 flex-1 xl:grid-cols-[17rem_minmax(0,1fr)_21rem]">
				<div class="hidden border-r border-border p-4 xl:block"><DomSkeleton variant="text" :lines="10" /></div>
				<div class="p-5"><DomSkeleton variant="text" :lines="14" /></div>
				<div class="hidden border-l border-border p-4 xl:block"><DomSkeleton variant="text" :lines="10" /></div>
			</div>
		</div>

		<div v-else-if="run && bootstrap" class="flex h-full min-h-0 flex-col">
			<header class="shrink-0 border-b border-border bg-canvas">
				<div class="flex min-h-16 items-center gap-3 px-3 py-2 sm:px-4">
					<div class="min-w-0 flex-1">
						<div class="flex min-w-0 items-center gap-2">
							<h1 class="truncate text-sm font-semibold sm:text-base">{{ run.title }}</h1>
							<DomStatusPill :tone="run.statusTone" size="sm">{{ run.statusLabel }}</DomStatusPill>
						</div>
						<p class="truncate text-xs text-muted-fg">{{ run.id }} · {{ run.environment }} · rev {{ run.revision }}</p>
					</div>
					<div class="hidden w-72 xl:block">
						<DomSelect :model-value="selectedRunId" label="Current run" :options="runs.map((item) => ({ value: item.id, label: item.title, description: `${item.statusLabel} · ${formatDuration(item.durationMs)}`, tone: item.statusTone }))" searchable width="min-w-[20rem]" @update:model-value="selectRun">
							<template #option="{ option }"><div class="flex items-start justify-between gap-3"><div><p class="font-medium">{{ option.label }}</p><p class="mt-1 text-xs opacity-70">{{ option.description }}</p></div><span class="mt-1 size-2 rounded-full" :class="option.tone === 'danger' ? 'bg-destructive' : option.tone === 'warning' ? 'bg-warning' : 'bg-success'"></span></div></template>
						</DomSelect>
					</div>
					<div class="flex shrink-0 items-center gap-2">
						<DomButton class="hidden sm:inline-flex" size="sm" variant="secondary" :loading="busy" @click="createAction('export')">Export</DomButton>
						<DomButton size="sm" @click="prepareReplay">Replay</DomButton>
					</div>
				</div>
			</header>

			<div v-if="errorMessage || successMessage" class="shrink-0 border-b border-border px-3 py-2 sm:px-4">
				<DomAlert v-if="errorMessage" tone="danger" variant="soft" title="Check this trace" :description="errorMessage" dismissible @dismiss="errorMessage = ''" />
				<DomAlert v-else tone="success" variant="soft" title="Trace updated" :description="successMessage" dismissible @dismiss="successMessage = ''" />
			</div>

			<DomTabs v-model="mobileView" :tabs="mobileTabs" variant="page" class="shrink-0 xl:hidden [&>div:last-child]:hidden" />

			<div class="flex min-h-0 flex-1">
				<aside class="min-h-0 w-full shrink-0 flex-col border-r border-border bg-secondary/10 xl:flex xl:w-68" :class="mobileView === 'runs' ? 'flex' : 'hidden'">
					<div class="shrink-0 border-b border-border p-4">
						<div class="flex items-center justify-between gap-3">
							<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Run queue</p><p class="mt-1 text-sm font-semibold">{{ filteredRuns.length }} recent runs</p></div>
							<DomBadge tone="neutral" variant="outline">30d</DomBadge>
						</div>
						<div class="mt-4 grid gap-3">
							<DomSelect v-model="environmentFilter" label="Environment" :options="bootstrap.options.environments" width="min-w-[16rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
							<DomSelect v-model="statusFilter" label="Outcome" :options="bootstrap.options.statuses" width="min-w-[16rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
						</div>
					</div>
					<nav v-if="filteredRuns.length" class="min-h-0 flex-1 divide-y divide-border overflow-y-auto" aria-label="Agent runs">
						<button v-for="item in filteredRuns" :key="item.id" type="button" class="w-full border-l-2 px-4 py-4 text-left transition hover:bg-secondary/45" :class="item.id === run.id ? 'border-l-primary bg-secondary/55' : 'border-l-transparent'" @click="selectRun(item.id)">
							<div class="flex items-start justify-between gap-3"><p class="min-w-0 truncate text-sm font-semibold">{{ item.title }}</p><DomStatusPill :tone="item.statusTone" size="sm">{{ item.statusLabel }}</DomStatusPill></div>
							<p class="mt-1 truncate text-xs text-muted-fg">{{ item.agent }}</p>
							<div class="mt-3 flex items-center justify-between text-[11px] text-muted-fg"><span>{{ formatTime(item.startedAt) }}</span><span>{{ formatDuration(item.durationMs) }} · {{ formatCost(item.costUsd) }}</span></div>
						</button>
					</nav>
					<DomEmptyState v-else class="m-auto" title="No runs match" description="Change an environment or outcome filter." />
					<div class="shrink-0 border-t border-border p-3"><DomButton class="w-full" size="sm" variant="ghost" @click="resetDialogOpen = true">Reset demo data</DomButton></div>
				</aside>

				<main class="min-h-0 min-w-0 flex-1 flex-col" :class="mobileView === 'trace' ? 'flex' : 'hidden xl:flex'">
					<div class="shrink-0 border-b border-border px-4 py-4 sm:px-5">
						<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Trace waterfall</p><DomStatusPill :tone="reviewTone(run.reviewState)" size="sm">{{ optionLabel(bootstrap.options.reviewStates, run.reviewState) }}</DomStatusPill></div>
								<h2 class="mt-1 text-lg font-semibold tracking-tight">{{ run.agent }}</h2>
								<p class="mt-1 max-w-3xl text-xs leading-5 text-muted-fg sm:text-sm">{{ run.summary }}</p>
							</div>
							<div class="grid grid-cols-4 divide-x divide-border border-y border-border py-2 text-center lg:w-[25rem]">
								<div><p class="text-xs font-semibold">{{ formatDuration(run.durationMs) }}</p><p class="mt-0.5 text-[10px] text-muted-fg">Duration</p></div>
								<div><p class="text-xs font-semibold">{{ formatTokens(run.tokenCount) }}</p><p class="mt-0.5 text-[10px] text-muted-fg">Tokens</p></div>
								<div><p class="text-xs font-semibold">{{ formatCost(run.costUsd) }}</p><p class="mt-0.5 text-[10px] text-muted-fg">Cost</p></div>
								<div><p class="text-xs font-semibold">{{ run.issueCount }}</p><p class="mt-0.5 text-[10px] text-muted-fg">Issues</p></div>
							</div>
						</div>
						<div class="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_13rem]">
							<DomTextInput v-model="searchQuery" label="Search trace" placeholder="Span name, tag, or summary" />
							<DomSelect v-model="spanTypeFilter" label="Span type" :options="bootstrap.options.spanTypes" width="min-w-[15rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
						</div>
					</div>

					<div class="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-secondary/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-fg sm:px-5 md:grid-cols-[minmax(16rem,0.9fr)_minmax(18rem,1fr)]">
						<span>{{ visibleSpans.length }} spans</span>
						<div class="hidden grid-cols-4 md:grid"><span>0ms</span><span class="text-center">{{ Math.round(run.durationMs * 0.33) }}ms</span><span class="text-center">{{ Math.round(run.durationMs * 0.66) }}ms</span><span class="text-right">{{ run.durationMs }}ms</span></div>
						<DomButton class="md:hidden" size="sm" variant="ghost" @click="openInspector('overview')">Inspect</DomButton>
					</div>

					<div class="min-h-0 flex-1 overflow-y-auto">
						<DomTreeView v-if="traceItems.length" v-model="selectedSpanId" :items="traceItems" :draggable="false" :chrome="false" label="Agent run trace spans" @select="selectSpan($event.value)">
							<template #row="{ item, open, selected, toggle }"><TraceSpanRow :item="item" :open="open" :selected="selected" :toggle="toggle" :total-duration="run.durationMs" /></template>
						</DomTreeView>
						<DomEmptyState v-else class="m-auto max-w-md py-16" title="No matching spans" description="Clear the search or choose another span type to restore this trace." />
					</div>

					<div v-if="selectedSpan" class="shrink-0 border-t border-border bg-canvas px-4 py-3 sm:px-5">
						<div class="flex items-center gap-3">
							<span class="size-2 shrink-0 rounded-full" :class="selectedSpan.statusTone === 'danger' ? 'bg-destructive' : selectedSpan.statusTone === 'warning' ? 'bg-warning' : 'bg-success'"></span>
							<div class="min-w-0 flex-1"><p class="truncate text-sm font-medium">{{ selectedSpan.name }}</p><p class="truncate text-xs text-muted-fg">{{ selectedSpan.summary }}</p></div>
							<DomButton size="sm" variant="secondary" @click="openInspector('overview')">Inspect span</DomButton>
						</div>
					</div>
				</main>

				<aside class="min-h-0 w-full shrink-0 flex-col border-l border-border bg-canvas xl:flex xl:w-84" :class="mobileView === 'inspector' ? 'flex' : 'hidden'">
					<div v-if="selectedSpan" class="flex min-h-0 flex-1 flex-col">
						<div class="shrink-0 border-b border-border px-4 py-4">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Span inspector</p><h2 class="mt-1 truncate text-base font-semibold">{{ selectedSpan.name }}</h2></div>
								<DomStatusPill :tone="selectedSpan.statusTone" size="sm">{{ selectedSpan.statusLabel }}</DomStatusPill>
							</div>
							<p class="mt-2 text-xs leading-5 text-muted-fg">{{ selectedSpan.summary }}</p>
						</div>

						<DomTabs v-model="inspectorTab" :tabs="inspectorTabs" variant="page" fill class="min-h-0 flex-1">
							<template #overview>
								<div class="min-h-0 flex-1 overflow-y-auto p-4">
									<div class="grid grid-cols-2 divide-x divide-border border-y border-border py-3 text-center">
										<div><p class="text-sm font-semibold">{{ formatDuration(selectedSpan.durationMs) }}</p><p class="mt-1 text-[10px] text-muted-fg">Duration</p></div>
										<div><p class="text-sm font-semibold">{{ formatCost(selectedSpan.costUsd) }}</p><p class="mt-1 text-[10px] text-muted-fg">Cost</p></div>
									</div>
									<dl class="mt-4 divide-y divide-border border-y border-border text-xs">
										<div class="flex items-center justify-between gap-3 py-3"><dt class="text-muted-fg">Type</dt><dd class="font-medium">{{ selectedSpan.type }}</dd></div>
										<div class="flex items-center justify-between gap-3 py-3"><dt class="text-muted-fg">Tokens</dt><dd class="font-medium">{{ formatTokens(selectedSpan.tokens) }}</dd></div>
										<div class="flex items-center justify-between gap-3 py-3"><dt class="text-muted-fg">Prompt version</dt><dd class="truncate font-mono text-[11px]">{{ run.promptVersion }}</dd></div>
										<div class="flex items-center justify-between gap-3 py-3"><dt class="text-muted-fg">Payload</dt><dd><DomBadge tone="success" variant="outline">Redacted</DomBadge></dd></div>
									</dl>
									<div class="mt-5"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Investigation</p><div class="mt-3 grid gap-3"><DomSelect v-model="reviewDraft.ownerId" label="Owner" :options="bootstrap.options.owners" :errors="fieldErrors.ownerId || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="reviewDraft.reviewState" label="State" :options="bootstrap.options.reviewStates" :errors="fieldErrors.reviewState || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomTextareaInput v-if="reviewDraft.reviewState === 'resolved'" v-model="reviewDraft.note" label="Conclusion" :rows="3" :errors="fieldErrors.note || []" /><DomButton size="sm" variant="secondary" :loading="busy" @click="saveReview">Save investigation</DomButton></div></div>
									<div class="mt-5"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Recent evidence</p><div class="mt-2 divide-y divide-border border-y border-border"><div v-for="event in run.activity.slice(0, 4)" :key="event.id" class="py-3"><p class="text-xs font-medium">{{ event.label }}</p><p class="mt-1 text-[11px] leading-5 text-muted-fg">{{ event.detail }}</p></div></div></div>
								</div>
							</template>

							<template #payload>
								<div class="min-h-0 flex-1 overflow-y-auto p-4">
									<DomAlert tone="warning" variant="soft" title="Privileged boundary" description="Payloads load separately, remain redacted, and return an access proof for the current operator." />
									<div v-if="payload" class="mt-4">
										<DomCodeInput :model-value="payloadJson" label="Redacted span payload" readonly :rows="16" />
										<div v-if="payloadAccess" class="mt-4 border-y border-border py-3"><p class="text-xs font-medium">Access {{ payloadAccess.id }}</p><p class="mt-1 text-[11px] text-muted-fg">{{ payloadAccess.actor }} · {{ formatTime(payloadAccess.accessedAt) }}</p><code class="mt-2 block break-all text-[10px] leading-4 text-muted-fg">{{ payloadAccess.proof }}</code></div>
									</div>
									<div v-else class="mt-5"><p class="text-sm font-medium">Payload not loaded</p><p class="mt-1 text-xs leading-5 text-muted-fg">The run list exposes safe span metadata only. Load this payload to exercise the separate authorization seam.</p><DomButton class="mt-4" size="sm" :loading="busy" @click="loadPayload">Load redacted payload</DomButton></div>
								</div>
							</template>

							<template #action>
								<div class="min-h-0 flex-1 overflow-y-auto p-4">
									<div v-if="actionReceipt" class="border-y border-success/35 bg-success/8 py-4">
										<div class="flex items-center justify-between gap-3"><p class="text-sm font-semibold">{{ actionReceipt.label }}</p><DomStatusPill tone="success" size="sm">{{ actionReceipt.state }}</DomStatusPill></div>
										<p class="mt-2 text-xs leading-5 text-muted-fg">{{ actionReceipt.spanName }} · source revision {{ actionReceipt.sourceRevision }}</p>
										<p v-if="actionReceipt.filename" class="mt-2 font-mono text-xs">{{ actionReceipt.filename }}</p>
										<code class="mt-3 block break-all text-[10px] leading-4 text-muted-fg">{{ actionReceipt.proof }}</code>
									</div>
									<div class="mt-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ actionTitle }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">Actions are attached to {{ selectedSpan.name }} and source revision {{ run.revision }}.</p></div>
									<div class="mt-4 grid gap-4">
										<DomSelect v-model="actionDraft.action" label="Action" :options="actionOptions" :errors="fieldErrors.action || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
										<DomSelect v-if="actionDraft.action === 'replay'" v-model="actionDraft.mode" label="Replay scope" :options="bootstrap.options.replayModes" :errors="fieldErrors.mode || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
										<DomTextareaInput v-if="actionDraft.action !== 'export'" v-model="actionDraft.reason" label="Operator reason" description="Visible in audit logs and downstream job metadata." :rows="4" :errors="fieldErrors.reason || []" />
										<DomCheckbox v-if="actionDraft.action !== 'export'" v-model="actionDraft.acknowledged" label="I confirm the span, source revision, and payload boundary" description="The server rejects replay and eval creation without explicit acknowledgement." :errors="fieldErrors.acknowledged || []" />
										<DomButton :loading="busy" @click="createAction()">Create {{ actionTitle.toLowerCase() }}</DomButton>
									</div>
								</div>
							</template>
						</DomTabs>
					</div>
					<DomEmptyState v-else class="m-auto" title="Choose a span" description="Select a trace row to inspect its evidence and actions." />
				</aside>
			</div>

			<DomDialog v-model="resetDialogOpen" title="Reset the trace workspace?" description="This removes process-local investigation updates and action receipts, then restores the seeded incident queue.">
				<template #footer><DomButton variant="secondary" data-close>Keep workspace</DomButton><DomButton variant="danger" :loading="busy" @click="resetWorkspace">Reset demo</DomButton></template>
			</DomDialog>
		</div>

		<div v-else class="grid h-full place-items-center p-6"><DomAlert tone="danger" title="Trace workspace unavailable" :description="errorMessage || 'The agent trace API did not return a run.'"><template #actions><DomButton variant="secondary" @click="loadWorkspace">Try again</DomButton></template></DomAlert></div>
	</div>
</template>

<style scoped>
:deep([role="treeitem"]) {
	border-radius: 0;
}

:deep([role="treeitem"][aria-selected="true"]) {
	background: color-mix(in srgb, var(--secondary) 72%, transparent);
	color: var(--canvas-fg);
}
</style>
