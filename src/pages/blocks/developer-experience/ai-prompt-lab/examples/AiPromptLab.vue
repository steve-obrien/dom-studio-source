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
	DomProgress,
	DomRangeInput,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextDiff,
	DomToggleButtonGroup,
} from '@getdom/studio/vue';

const loading = ref(true);
const busy = ref(false);
const bootstrap = ref(null);
const prompts = ref([]);
const prompt = ref(null);
const draft = ref(createDraft());
const reviewDraft = ref(createReviewDraft());
const selectedCaseId = ref('');
const activeView = ref('prompt');
const workspaceMode = ref('prompt');
const resultTab = ref('output');
const fieldErrors = ref({});
const errorMessage = ref('');
const successMessage = ref('');
const resetDialogOpen = ref(false);

const mobileViews = [
	{ key: 'dataset', label: 'Dataset' },
	{ key: 'prompt', label: 'Prompt' },
	{ key: 'results', label: 'Results' },
	{ key: 'release', label: 'Release' },
];

const workspaceModes = [
	{ value: 'prompt', label: 'Prompt' },
	{ value: 'results', label: 'Latest run' },
];

const resultTabs = [
	{ key: 'output', label: 'Output' },
	{ key: 'checks', label: 'Checks' },
	{ key: 'compare', label: 'Compare' },
];

const selectedCase = computed(getSelectedCase);
const selectedRunCase = computed(getSelectedRunCase);
const isDirty = computed(getIsDirty);
const latestRunIsCurrent = computed(getLatestRunIsCurrent);
const readinessChecks = computed(getReadinessChecks);
const passedReadinessCount = computed(() => readinessChecks.value.filter((check) => check.passed).length);
const promptStatusTone = computed(() => ({ draft: 'neutral', 'in-review': 'info', approved: 'success' }[prompt.value?.status] || 'neutral'));
const visibleCases = computed(getVisibleCases);
const caseOptions = computed(() => visibleCases.value.map((item) => ({
	value: item.id,
	label: item.name,
	description: `${item.segment} · ${capitalize(item.risk)} risk`,
})));

/**
 * Creates safe empty prompt editor values before the API loads.
 *
 * @returns {Record<string, unknown>} Empty prompt draft.
 */
function createDraft() {
	return {
		instructions: '',
		guardrails: '',
		model: '',
		tone: '',
		datasetId: '',
		temperature: 0.3,
		maxTokens: 650,
	};
}

/**
 * Creates the default release review handoff.
 *
 * @returns {{ reviewerId: string, environment: string, note: string, acknowledged: boolean }} Review values.
 */
function createReviewDraft() {
	return {
		reviewerId: 'maya',
		environment: 'staging',
		note: '',
		acknowledged: false,
	};
}

/**
 * Loads the API-backed prompt registry and default workspace.
 *
 * @returns {Promise<void>}
 */
async function loadWorkspace() {
	loading.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/ai-prompt-lab/bootstrap');
		bootstrap.value = result;
		prompts.value = result.prompts || [];
		applyPrompt(result.prompt);
	} catch (error) {
		errorMessage.value = error.message || 'The prompt registry could not be loaded.';
	} finally {
		loading.value = false;
	}
}

/**
 * Applies authoritative prompt state and resets editable values.
 *
 * @param {Record<string, unknown>} nextPrompt Updated prompt response.
 * @returns {void}
 */
function applyPrompt(nextPrompt) {
	prompt.value = nextPrompt;
	draft.value = {
		instructions: nextPrompt.instructions,
		guardrails: nextPrompt.guardrails,
		model: nextPrompt.model,
		tone: nextPrompt.tone,
		datasetId: nextPrompt.datasetId,
		temperature: nextPrompt.temperature,
		maxTokens: nextPrompt.maxTokens,
	};
	if (!nextPrompt.cases?.some((item) => item.id === selectedCaseId.value)) selectedCaseId.value = nextPrompt.cases?.[0]?.id || '';
	if (nextPrompt.review) {
		reviewDraft.value.reviewerId = nextPrompt.review.reviewerId;
		reviewDraft.value.environment = nextPrompt.review.environment;
	}
}

/**
 * Persists the current editor values against the exact loaded revision.
 *
 * @returns {Promise<void>}
 */
async function savePrompt() {
	if (!prompt.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/ai-prompt-lab/prompts/${prompt.value.id}`, {
			method: 'PATCH',
			body: { revision: prompt.value.revision, ...draft.value },
		});
		prompts.value = result.prompts || prompts.value;
		applyPrompt(result.prompt);
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Creates a new editable prompt version from the loaded revision.
 *
 * @returns {Promise<void>}
 */
async function duplicatePrompt() {
	if (!prompt.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/ai-prompt-lab/prompts/${prompt.value.id}/duplicate`, {
			method: 'POST',
			body: { revision: prompt.value.revision },
		});
		prompts.value = result.prompts || prompts.value;
		applyPrompt(result.prompt);
		workspaceMode.value = 'prompt';
		activeView.value = 'prompt';
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Runs the selected registered dataset against the saved prompt revision.
 *
 * @returns {Promise<void>}
 */
async function runSuite() {
	if (!prompt.value) return;
	clearFeedback();
	if (isDirty.value) {
		errorMessage.value = 'Save this draft before running it so the result can be reproduced from an exact registry revision.';
		return;
	}
	busy.value = true;
	try {
		const result = await requestJson('/api/block-demos/ai-prompt-lab/runs', {
			method: 'POST',
			body: {
				promptId: prompt.value.id,
				revision: prompt.value.revision,
				datasetId: draft.value.datasetId,
			},
		});
		prompts.value = result.prompts || prompts.value;
		applyPrompt(result.prompt);
		workspaceMode.value = 'results';
		activeView.value = 'results';
		resultTab.value = 'output';
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Sends a tested revision to the selected human reviewer.
 *
 * @returns {Promise<void>}
 */
async function requestReview() {
	if (!prompt.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/ai-prompt-lab/prompts/${prompt.value.id}/request-review`, {
			method: 'POST',
			body: {
				revision: prompt.value.revision,
				...reviewDraft.value,
			},
		});
		prompts.value = result.prompts || prompts.value;
		applyPrompt(result.prompt);
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Restores the seeded prompt registry after confirmation.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/ai-prompt-lab/reset', { method: 'POST' });
		bootstrap.value = result;
		prompts.value = result.prompts || [];
		applyPrompt(result.prompt);
		reviewDraft.value = createReviewDraft();
		workspaceMode.value = 'prompt';
		activeView.value = 'prompt';
		resetDialogOpen.value = false;
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Resolves the selected dataset case.
 *
 * @returns {Record<string, unknown>|null} Selected evaluation fixture.
 */
function getSelectedCase() {
	return visibleCases.value.find((item) => item.id === selectedCaseId.value) || visibleCases.value[0] || null;
}

/**
 * Filters registered cases to the selected dataset definition.
 *
 * @returns {Array<Record<string, unknown>>} Cases included in the selected dataset.
 */
function getVisibleCases() {
	const cases = prompt.value?.cases || [];
	return draft.value.datasetId === 'launch-smoke' ? cases.filter((item) => item.risk === 'high') : cases;
}

/**
 * Resolves run evidence corresponding to the selected dataset case.
 *
 * @returns {Record<string, unknown>|null} Selected evaluated case.
 */
function getSelectedRunCase() {
	return prompt.value?.latestRun?.cases?.find((item) => item.id === selectedCaseId.value) || prompt.value?.latestRun?.cases?.[0] || null;
}

/**
 * Compares editable values with the authoritative registry draft.
 *
 * @returns {boolean} Whether the editor has unsaved changes.
 */
function getIsDirty() {
	if (!prompt.value) return false;
	return ['instructions', 'guardrails', 'model', 'tone', 'datasetId', 'temperature', 'maxTokens']
		.some((key) => draft.value[key] !== prompt.value[key]);
}

/**
 * Checks whether the latest run is accepted evidence for the current workflow state.
 *
 * @returns {boolean} Whether run evidence is current.
 */
function getLatestRunIsCurrent() {
	if (!prompt.value?.latestRun) return false;
	if (prompt.value.review?.sourceRunId === prompt.value.latestRun.id) return true;
	return prompt.value.latestRun.promptRevision === prompt.value.revision - 1;
}

/**
 * Builds server-aligned release readiness signals.
 *
 * @returns {Array<{ label: string, detail: string, passed: boolean }>} Release checks.
 */
function getReadinessChecks() {
	return [
		{ label: 'Saved registry revision', detail: isDirty.value ? 'Unsaved editor changes' : `Revision ${prompt.value?.revision || '—'}`, passed: !isDirty.value },
		{ label: 'Current evaluation run', detail: prompt.value?.latestRun?.id || 'No run yet', passed: latestRunIsCurrent.value },
		{ label: 'Quality threshold', detail: `${prompt.value?.latestRun?.score || 0}% · minimum 90%`, passed: (prompt.value?.latestRun?.score || 0) >= 90 },
		{ label: 'Human release owner', detail: optionLabel(bootstrap.value?.options?.reviewers, reviewDraft.value.reviewerId), passed: Boolean(reviewDraft.value.reviewerId) },
	];
}

/**
 * Selects a case and opens the most useful run view on compact layouts.
 *
 * @param {string} caseId Evaluation case identifier.
 * @returns {void}
 */
function selectCase(caseId) {
	selectedCaseId.value = caseId;
	resultTab.value = 'output';
}

/**
 * Converts structured field errors into DOM Studio field error collections.
 *
 * @param {Array<Record<string, string>>} fields API field errors.
 * @returns {void}
 */
function applyFieldErrors(fields = []) {
	fieldErrors.value = Object.fromEntries(fields.map((field) => [field.field, [field.message]]));
}

/**
 * Applies recovery state from API conflicts and exposes user-facing feedback.
 *
 * @param {Error & { fields?: Array<Record<string, string>>, payload?: Record<string, unknown> }} error Request error.
 * @returns {void}
 */
function handleRequestError(error) {
	applyFieldErrors(error.fields || []);
	if (error.payload?.prompt) applyPrompt(error.payload.prompt);
	if (error.payload?.prompts) prompts.value = error.payload.prompts;
	errorMessage.value = error.message || 'The prompt action could not be completed.';
}

/**
 * Clears transient success, error, and field feedback.
 *
 * @returns {void}
 */
function clearFeedback() {
	errorMessage.value = '';
	successMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Resolves a semantic status tone for an evaluation case.
 *
 * @param {string} status Evaluation status.
 * @returns {string} DOM Studio tone.
 */
function runTone(status) {
	return status === 'passed' ? 'success' : status === 'failed' ? 'danger' : 'warning';
}

/**
 * Resolves a semantic tone for a case risk level.
 *
 * @param {string} risk Risk level.
 * @returns {string} DOM Studio tone.
 */
function riskTone(risk) {
	return { high: 'danger', medium: 'warning', low: 'neutral' }[risk] || 'neutral';
}

/**
 * Capitalizes a short status label.
 *
 * @param {unknown} value Raw label.
 * @returns {string} Capitalized label.
 */
function capitalize(value) {
	const text = String(value || '');
	return text ? `${text[0].toUpperCase()}${text.slice(1)}` : '';
}

/**
 * Formats a USD cost signal.
 *
 * @param {unknown} value Numeric cost.
 * @returns {string} Currency label.
 */
function formatCost(value) {
	return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 3 }).format(Number(value) || 0);
}

/**
 * Formats an ISO timestamp for compact run metadata.
 *
 * @param {unknown} value Timestamp.
 * @returns {string} Localized time.
 */
function formatTime(value) {
	if (!value) return 'Not run';
	return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(String(value)));
}

/**
 * Returns a human-readable label from an option collection.
 *
 * @param {Array<Record<string, string>>|undefined} options Option collection.
 * @param {string} value Selected value.
 * @returns {string} Option label.
 */
function optionLabel(options, value) {
	return options?.find((option) => option.value === value)?.label || value || 'Not selected';
}

/**
 * Sends JSON requests and converts structured API errors into exceptions.
 *
 * @param {string} url API route.
 * @param {{ method?: string, body?: Record<string, unknown> }} options Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed API response.
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

watch(activeView, (value) => {
	if (value === 'prompt' || value === 'results') workspaceMode.value = value;
});

watch(() => draft.value.datasetId, () => {
	if (!visibleCases.value.some((item) => item.id === selectedCaseId.value)) selectedCaseId.value = visibleCases.value[0]?.id || '';
});

onMounted(loadWorkspace);
</script>

<template>
	<div class="h-dvh min-h-0 overflow-hidden bg-canvas text-canvas-fg">
		<div v-if="loading" class="flex h-full flex-col">
			<div class="flex h-16 items-center border-b border-border px-4"><DomSkeleton variant="text" :lines="1" width="28rem" /></div>
			<div class="grid min-h-0 flex-1 lg:grid-cols-[16rem_minmax(0,1fr)_22rem]">
				<div class="hidden border-r border-border p-4 lg:block"><DomSkeleton variant="text" :lines="12" /></div>
				<div class="p-5"><DomSkeleton variant="text" :lines="16" /></div>
				<div class="hidden border-l border-border p-4 lg:block"><DomSkeleton variant="text" :lines="12" /></div>
			</div>
		</div>

		<div v-else-if="prompt && bootstrap" class="flex h-full min-h-0 flex-col">
			<header class="shrink-0 border-b border-border bg-canvas">
				<div class="flex min-h-16 items-center gap-3 px-3 py-2 sm:px-4">
					<div class="min-w-0 flex-1">
						<div class="flex min-w-0 items-center gap-2">
							<h1 class="truncate text-sm font-semibold sm:text-base">{{ prompt.name }}</h1>
							<DomStatusPill :tone="promptStatusTone" size="sm">{{ prompt.status === 'in-review' ? 'In review' : 'Draft' }}</DomStatusPill>
							<DomBadge v-if="isDirty" tone="warning" variant="outline">Unsaved</DomBadge>
						</div>
						<p class="truncate text-xs text-muted-fg">Prompt registry · v{{ prompt.version }} · rev {{ prompt.revision }} · production v{{ prompt.deployedVersion }}</p>
					</div>
					<div class="flex shrink-0 items-center gap-2">
						<DomButton class="hidden sm:inline-flex" size="sm" variant="secondary" :loading="busy" @click="duplicatePrompt">Duplicate</DomButton>
						<DomButton data-testid="run-suite" size="sm" :loading="busy" :disabled="prompt.status === 'in-review'" @click="runSuite">Run suite</DomButton>
					</div>
				</div>
			</header>

			<div v-if="errorMessage || successMessage" class="shrink-0 border-b border-border px-3 py-2 sm:px-4">
				<DomAlert v-if="errorMessage" tone="danger" variant="soft" title="Prompt action needs attention" :description="errorMessage" dismissible @dismiss="errorMessage = ''" />
				<DomAlert v-else tone="success" variant="soft" title="Prompt workspace updated" :description="successMessage" dismissible @dismiss="successMessage = ''" />
			</div>

			<DomTabs v-model="activeView" :tabs="mobileViews" variant="page" class="shrink-0 lg:hidden [&>div:last-child]:hidden" />

			<div class="flex min-h-0 flex-1">
				<aside class="min-h-0 w-full shrink-0 flex-col border-r border-border bg-secondary/10 lg:flex lg:w-64" :class="activeView === 'dataset' ? 'flex' : 'hidden'">
					<div class="shrink-0 border-b border-border p-4">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Test dataset</p>
						<div class="mt-3">
							<DomSelect v-model="draft.datasetId" label="Dataset" :options="bootstrap.options.datasets" :errors="fieldErrors.datasetId || []" width="min-w-[18rem]">
								<template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template>
							</DomSelect>
						</div>
						<div class="mt-4 flex items-center justify-between text-xs text-muted-fg"><span>{{ visibleCases.length }} production cases</span><span>{{ prompt.latestRun?.passedCount || 0 }}/{{ prompt.latestRun?.caseCount || visibleCases.length }} passed</span></div>
					</div>

					<nav class="min-h-0 flex-1 divide-y divide-border overflow-y-auto" aria-label="Evaluation cases">
						<button v-for="testCase in visibleCases" :key="testCase.id" type="button" class="w-full border-l-2 px-4 py-4 text-left transition hover:bg-secondary/45" :class="testCase.id === selectedCaseId ? 'border-l-primary bg-secondary/55' : 'border-l-transparent'" @click="selectCase(testCase.id)">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0"><p class="truncate text-sm font-semibold">{{ testCase.name }}</p><p class="mt-1 truncate text-xs text-muted-fg">{{ testCase.segment }}</p></div>
								<DomBadge :tone="riskTone(testCase.risk)" variant="outline">{{ capitalize(testCase.risk) }}</DomBadge>
							</div>
							<div v-if="prompt.latestRun?.cases?.find((item) => item.id === testCase.id)" class="mt-3">
								<DomProgress :value="prompt.latestRun.cases.find((item) => item.id === testCase.id).score" :label="`${testCase.name} score`" :tone="runTone(prompt.latestRun.cases.find((item) => item.id === testCase.id).status)" size="sm" :show-label="false" />
								<div class="mt-2 flex items-center justify-between text-[11px] text-muted-fg"><span>{{ prompt.latestRun.cases.find((item) => item.id === testCase.id).score }}% quality</span><span>{{ capitalize(prompt.latestRun.cases.find((item) => item.id === testCase.id).status) }}</span></div>
							</div>
						</button>
					</nav>

					<div class="shrink-0 border-t border-border p-3"><DomButton class="w-full" size="sm" variant="ghost" @click="resetDialogOpen = true">Reset demo data</DomButton></div>
				</aside>

				<main class="min-h-0 min-w-0 flex-1 flex-col" :class="activeView === 'prompt' || activeView === 'results' ? 'flex' : 'hidden lg:flex'">
					<div class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
						<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Experiment</p><p class="mt-1 text-sm font-semibold">Version {{ prompt.version }} workspace</p></div>
						<DomToggleButtonGroup v-model="workspaceMode" :options="workspaceModes" label="Workspace view" size="sm" chrome="none" />
					</div>

					<section v-if="workspaceMode === 'prompt'" class="min-h-0 flex-1 overflow-y-auto">
						<div class="mx-auto max-w-4xl p-4 sm:p-5 lg:p-6">
							<DomAlert v-if="prompt.status === 'in-review'" tone="info" variant="soft" title="Version locked for review" description="Duplicate this version to create another editable draft without changing the submitted evidence." />
							<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
								<div><h2 class="text-xl font-semibold tracking-tight">Prompt instructions</h2><p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">Define an observable policy, then run it against production-derived cases before release.</p></div>
								<DomButton size="sm" variant="secondary" :loading="busy" :disabled="!isDirty || prompt.status === 'in-review'" @click="savePrompt">Save revision</DomButton>
							</div>

							<div class="mt-5">
								<DomCodeInput v-model="draft.instructions" label="Instructions" lang="text" :rows="14" :editor="false" :read-only="prompt.status === 'in-review'" :errors="fieldErrors.instructions || []" description="Use registered variables and describe the expected decision boundary." />
							</div>

							<div class="mt-5">
								<DomTextareaInput v-model="draft.guardrails" label="System guardrails" :rows="4" :read-only="prompt.status === 'in-review'" :errors="fieldErrors.guardrails || []" description="These constraints are stored with every run snapshot." />
							</div>

							<div class="mt-5 border-y border-border py-5">
								<div class="grid gap-4 sm:grid-cols-2">
									<DomSelect v-model="draft.model" label="Model" :options="bootstrap.options.models" :read-only="prompt.status === 'in-review'" :errors="fieldErrors.model || []" width="min-w-[18rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
									<DomSelect v-model="draft.tone" label="Response tone" :options="bootstrap.options.tones" :read-only="prompt.status === 'in-review'" :errors="fieldErrors.tone || []" width="min-w-[18rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
								</div>
								<div class="mt-5 grid gap-5 sm:grid-cols-2">
									<DomRangeInput v-model="draft.temperature" label="Temperature" :min="0" :max="1" :step="0.1" :disabled="prompt.status === 'in-review'" :errors="fieldErrors.temperature || []" />
									<DomRangeInput v-model="draft.maxTokens" label="Max tokens" :min="250" :max="1200" :step="50" :disabled="prompt.status === 'in-review'" :errors="fieldErrors.maxTokens || []" />
								</div>
							</div>

							<div class="mt-5">
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Registered variables</p>
								<div class="mt-3 flex flex-wrap gap-2"><DomBadge v-for="variable in prompt.variables" :key="variable" tone="neutral" variant="outline"><code>{{ '{' + variable + '}' }}</code></DomBadge></div>
							</div>
						</div>
					</section>

					<section v-else class="min-h-0 flex-1 overflow-y-auto">
						<div v-if="prompt.latestRun && selectedRunCase" class="mx-auto max-w-5xl p-4 sm:p-5 lg:p-6">
							<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
								<div>
									<div class="flex flex-wrap items-center gap-2"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ prompt.latestRun.id }}</p><DomStatusPill :tone="prompt.latestRun.statusTone" size="sm">{{ prompt.latestRun.statusLabel }}</DomStatusPill></div>
									<h2 class="mt-2 text-xl font-semibold tracking-tight">Evaluation evidence</h2>
									<p class="mt-1 text-sm text-muted-fg">Prompt v{{ prompt.latestRun.promptVersion }} · source revision {{ prompt.latestRun.promptRevision }} · {{ formatTime(prompt.latestRun.createdAt) }}</p>
								</div>
								<div class="grid grid-cols-3 divide-x divide-border border-y border-border py-2 text-center lg:w-[25rem]">
									<div><p class="text-lg font-semibold">{{ prompt.latestRun.score }}%</p><p class="text-[10px] text-muted-fg">Quality</p></div>
									<div><p class="text-lg font-semibold">{{ prompt.latestRun.latencyMs }}ms</p><p class="text-[10px] text-muted-fg">Latency</p></div>
									<div><p class="text-lg font-semibold">{{ formatCost(prompt.latestRun.costUsd) }}</p><p class="text-[10px] text-muted-fg">Cost</p></div>
								</div>
							</div>

							<div class="mt-5 lg:hidden"><DomSelect v-model="selectedCaseId" label="Evaluation case" :options="caseOptions" width="min-w-[20rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div>

							<div class="mt-5 border-y border-border py-4">
								<div class="flex flex-wrap items-start justify-between gap-3">
									<div><h3 class="font-semibold">{{ selectedRunCase.name }}</h3><p class="mt-1 max-w-3xl text-sm leading-6 text-muted-fg">{{ selectedRunCase.input }}</p></div>
									<div class="flex items-center gap-2"><DomBadge :tone="riskTone(selectedRunCase.risk)" variant="outline">{{ capitalize(selectedRunCase.risk) }} risk</DomBadge><DomStatusPill :tone="runTone(selectedRunCase.status)" size="sm">{{ selectedRunCase.score }}%</DomStatusPill></div>
								</div>
							</div>

							<DomTabs v-model="resultTab" :tabs="resultTabs" variant="page" class="mt-2">
								<template #output><div class="py-5"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Generated response</p><p class="mt-3 whitespace-pre-line text-sm leading-7">{{ selectedRunCase.output }}</p><dl class="mt-5 grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-3"><div><dt class="text-xs text-muted-fg">Model</dt><dd class="mt-1 font-medium">{{ optionLabel(bootstrap.options.models, selectedRunCase.model) }}</dd></div><div><dt class="text-xs text-muted-fg">Latency</dt><dd class="mt-1 font-medium">{{ selectedRunCase.latencyMs }}ms</dd></div><div><dt class="text-xs text-muted-fg">Cost</dt><dd class="mt-1 font-medium">{{ formatCost(selectedRunCase.costUsd) }}</dd></div></dl></div></template>
								<template #checks><div class="divide-y divide-border border-y border-border"><div v-for="check in selectedRunCase.expected" :key="check.label" class="flex items-center justify-between gap-3 py-4"><div><p class="text-sm font-medium">{{ check.label }}</p><p class="mt-1 text-xs text-muted-fg">Assertion evaluated from output evidence</p></div><DomStatusPill :tone="runTone(check.status)" size="sm">{{ capitalize(check.status) }}</DomStatusPill></div></div></template>
								<template #compare><div class="py-5"><DomTextDiff :original="selectedRunCase.baseline" :proposed="selectedRunCase.output" original-label="Production v5" proposed-label="Candidate output" view="inline" format="text" /></div></template>
							</DomTabs>
						</div>
						<DomEmptyState v-else class="m-auto max-w-md py-16" title="No evaluation run" description="Save the prompt, then run a registered dataset to create reproducible evidence."><template #actions><DomButton @click="workspaceMode = 'prompt'">Open prompt</DomButton></template></DomEmptyState>
					</section>
				</main>

				<aside class="min-h-0 w-full shrink-0 flex-col border-l border-border bg-secondary/10 lg:flex lg:w-88" :class="activeView === 'release' ? 'flex' : 'hidden'">
					<div class="min-h-0 flex-1 overflow-y-auto p-4">
						<div class="flex items-start justify-between gap-3">
							<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Release gate</p><h2 class="mt-1 text-lg font-semibold">Ready for review</h2></div>
							<DomStatusPill :tone="passedReadinessCount === readinessChecks.length ? 'success' : 'warning'" size="sm">{{ passedReadinessCount }}/{{ readinessChecks.length }}</DomStatusPill>
						</div>
						<p class="mt-2 text-sm leading-6 text-muted-fg">A reviewer receives the exact prompt version, evaluation run, environment, and operator note.</p>

						<div class="mt-5 divide-y divide-border border-y border-border">
							<div v-for="check in readinessChecks" :key="check.label" class="flex items-start gap-3 py-3">
								<span class="mt-1.5 size-2 shrink-0 rounded-full" :class="check.passed ? 'bg-success' : 'bg-warning'" aria-hidden="true"></span>
								<div><p class="text-sm font-medium">{{ check.label }}</p><p class="mt-0.5 text-xs text-muted-fg">{{ check.detail }}</p></div>
							</div>
						</div>

						<div v-if="prompt.review" class="mt-5 border-y border-primary/30 bg-primary/8 py-4">
							<div class="flex items-center justify-between gap-3"><p class="text-sm font-semibold">Review requested</p><DomStatusPill tone="info" size="sm">In review</DomStatusPill></div>
							<p class="mt-2 text-xs leading-5 text-muted-fg">{{ prompt.review.reviewerName }} · {{ optionLabel(bootstrap.options.environments, prompt.review.environment) }} · {{ prompt.review.sourceRunId }}</p>
							<p class="mt-3 text-sm leading-6">{{ prompt.review.note }}</p>
						</div>

						<div v-else class="mt-5 grid gap-4">
							<DomSelect v-model="reviewDraft.reviewerId" label="Reviewer" :options="bootstrap.options.reviewers" :errors="fieldErrors.reviewerId || []" width="min-w-[18rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
							<DomSelect v-model="reviewDraft.environment" label="Release environment" :options="bootstrap.options.environments" width="min-w-[18rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
							<DomTextareaInput v-model="reviewDraft.note" label="Review note" :rows="4" :errors="fieldErrors.note || []" placeholder="Explain what changed and what the reviewer should verify." />
							<DomCheckbox v-model="reviewDraft.acknowledged" label="I confirm the tested revision and rollout scope" description="The server rejects a handoff without this explicit confirmation." :errors="fieldErrors.acknowledged || []" />
							<DomAlert v-if="fieldErrors.run?.length" tone="warning" variant="soft" title="Run evidence required" :description="fieldErrors.run[0]" />
							<DomButton data-testid="request-review" :loading="busy" @click="requestReview">Request human review</DomButton>
						</div>

						<div class="mt-7">
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Version history</p>
							<div class="mt-2 divide-y divide-border border-y border-border"><div v-for="version in prompt.versions" :key="version.version" class="flex items-start justify-between gap-3 py-3"><div><p class="text-sm font-medium">{{ version.label }} · {{ version.note }}</p><p class="mt-1 text-xs text-muted-fg">{{ version.createdAt }}</p></div><DomBadge :tone="version.status === 'live' ? 'success' : version.status === 'in-review' ? 'primary' : 'neutral'" variant="outline">{{ capitalize(version.status) }}</DomBadge></div></div>
						</div>

						<div class="mt-7">
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Recent activity</p>
							<div class="mt-2 divide-y divide-border border-y border-border"><div v-for="event in prompt.activity.slice(0, 4)" :key="event.id" class="py-3"><p class="text-sm font-medium">{{ event.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p><p class="mt-1 text-[11px] text-muted-fg">{{ event.actor }} · {{ event.createdAt }}</p></div></div>
						</div>
					</div>
				</aside>
			</div>

			<DomDialog v-model="resetDialogOpen" title="Reset the prompt lab?" description="This clears process-local prompt edits, runs, and review handoffs, then restores the seeded registry state.">
				<template #footer><DomButton variant="secondary" data-close>Keep workspace</DomButton><DomButton variant="danger" :loading="busy" @click="resetWorkspace">Reset demo</DomButton></template>
			</DomDialog>
		</div>

		<div v-else class="grid h-full place-items-center p-6"><DomAlert tone="danger" title="Prompt workspace unavailable" :description="errorMessage || 'The prompt API did not return a workspace.'"><template #actions><DomButton variant="secondary" @click="loadWorkspace">Try again</DomButton></template></DomAlert></div>
	</div>
</template>
