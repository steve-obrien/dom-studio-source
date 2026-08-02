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
	DomTagCombobox,
	DomTextareaInput,
	DomTextDiff,
	DomTextInput,
	DomToggleButtonGroup,
	DomTreeView,
} from '@getdom/studio/vue';

const mobileViews = [
	{ key: 'files', label: 'Files' },
	{ key: 'editor', label: 'Editor' },
	{ key: 'agent', label: 'Agent' },
	{ key: 'review', label: 'Review' },
];
const assistantTabs = [
	{ key: 'agent', label: 'Agent' },
	{ key: 'review', label: 'Review' },
];
const evidenceTabs = [
	{ key: 'terminal', label: 'Terminal' },
	{ key: 'problems', label: 'Problems' },
	{ key: 'activity', label: 'Activity' },
];

const loading = ref(true);
const busy = ref(false);
const bootstrap = ref(null);
const workspace = ref(null);
const settings = ref(null);
const files = ref([]);
const fileTree = ref([]);
const activeFile = ref(null);
const selectedFileId = ref('');
const openTabIds = ref([]);
const editorContent = ref('');
const proposal = ref(null);
const selectedChangeFileId = ref('');
const testRuns = ref([]);
const activity = ref([]);
const activeView = ref('editor');
const assistantTab = ref('agent');
const evidenceTab = ref('terminal');
const fileSearch = ref('');
const prompt = ref('Add a project pulse with active work, review state, and focused test evidence.');
const model = ref('composer-2-5');
const mode = ref('agent');
const contextFileIds = ref(['dashboard-page', 'mission-control', 'workspace-store']);
const includeTests = ref(true);
const includeRules = ref(true);
const errorMessage = ref('');
const successMessage = ref('');
const fieldErrors = ref({});
const applyDialogOpen = ref(false);
const resetDialogOpen = ref(false);
const applyAcknowledged = ref(false);
const runTestsAfterApply = ref(true);

const fileById = computed(() => new Map(files.value.map((file) => [file.id, file])));
const openFiles = computed(() => openTabIds.value.map((fileId) => fileById.value.get(fileId)).filter(Boolean));
const isDirty = computed(() => Boolean(activeFile.value && editorContent.value !== activeFile.value.content));
const latestTestRun = computed(() => testRuns.value[0] || null);
const filteredFiles = computed(() => {
	const needle = fileSearch.value.trim().toLowerCase();
	if (!needle) return files.value;
	return files.value.filter((file) => `${file.name} ${file.path}`.toLowerCase().includes(needle));
});
const selectedChange = computed(() => proposal.value?.changes?.find((change) => change.fileId === selectedChangeFileId.value) || proposal.value?.changes?.[0] || null);
const proposalReadiness = computed(() => proposal.value?.checks?.filter((check) => check.status === 'passed').length || 0);
const proposalCheckCount = computed(() => proposal.value?.checks?.length || 0);
const activeModelLabel = computed(() => optionLabel(bootstrap.value?.options.models || [], model.value));
const fileStatusTone = computed(() => activeFile.value?.statusTone || 'neutral');

/**
 * Loads the server-owned workspace and restores useful defaults.
 *
 * @returns {Promise<void>} Resolves after bootstrap state is ready.
 */
async function loadWorkspace() {
	loading.value = true;
	clearMessages();
	try {
		const result = await requestJson('/api/block-demos/cursor-workspace/bootstrap');
		applyBootstrap(result);
	} catch (error) {
		errorMessage.value = error.message;
	} finally {
		loading.value = false;
	}
}

/**
 * Applies a complete bootstrap payload to local view state.
 *
 * @param {Record<string, unknown>} result Workspace payload.
 * @returns {void}
 */
function applyBootstrap(result) {
	bootstrap.value = result;
	workspace.value = cloneValue(result.workspace);
	settings.value = cloneValue(result.settings);
	files.value = cloneValue(result.files);
	fileTree.value = cloneValue(result.fileTree);
	testRuns.value = cloneValue(result.testRuns || []);
	activity.value = cloneValue(result.activity || []);
	model.value = result.settings.model;
	mode.value = result.settings.mode;
	includeTests.value = result.settings.includeTests;
	includeRules.value = result.settings.includeRules;
	proposal.value = cloneValue(result.proposal);
	selectedChangeFileId.value = result.proposal?.changes?.[0]?.fileId || '';
	openTabIds.value = uniqueValues([result.defaultFileId, 'mission-control', 'workspace-store']);
	applyFile(result.file);
}

/**
 * Selects a file from the DOM Studio tree.
 *
 * @param {{ item?: Record<string, unknown>, value?: string }} payload Tree selection payload.
 * @returns {Promise<void>} Resolves after file detail loads.
 */
async function selectTreeFile(payload) {
	if (!payload?.item || payload.item.kind !== 'file') return;
	await openFile(String(payload.value || payload.item.id));
}

/**
 * Loads one file and adds it to the open tab set.
 *
 * @param {string} fileId File identifier.
 * @returns {Promise<void>} Resolves after the file is active.
 */
async function openFile(fileId) {
	if (!fileById.value.has(fileId)) return;
	busy.value = true;
	clearMessages();
	try {
		const result = await requestJson(`/api/block-demos/cursor-workspace/files/${fileId}`);
		files.value = result.files;
		workspace.value = result.workspace;
		if (!openTabIds.value.includes(fileId)) openTabIds.value.push(fileId);
		applyFile(result.file);
		activeView.value = 'editor';
	} catch (error) {
		captureApiError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Applies one loaded file to the editor.
 *
 * @param {Record<string, unknown>} file Repository file.
 * @returns {void}
 */
function applyFile(file) {
	if (!file) return;
	activeFile.value = cloneValue(file);
	selectedFileId.value = file.id;
	editorContent.value = file.content;
	fieldErrors.value = {};
}

/**
 * Saves the active editor through the revisioned file API.
 *
 * @returns {Promise<void>} Resolves after persistence or conflict recovery.
 */
async function saveFile() {
	if (!activeFile.value) return;
	busy.value = true;
	clearMessages();
	try {
		const result = await requestJson(`/api/block-demos/cursor-workspace/files/${activeFile.value.id}`, {
			method: 'PATCH',
			body: JSON.stringify({ revision: activeFile.value.revision, content: editorContent.value }),
		});
		files.value = result.files;
		workspace.value = result.workspace;
		activity.value = result.activity;
		applyFile(result.file);
		successMessage.value = result.message;
	} catch (error) {
		if (error.data?.file) {
			files.value = error.data.files;
			workspace.value = error.data.workspace;
			applyFile(error.data.file);
		}
		captureApiError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Saves the current model and context defaults.
 *
 * @returns {Promise<void>} Resolves after settings persistence.
 */
async function saveDefaults() {
	if (!settings.value) return;
	busy.value = true;
	clearMessages();
	try {
		const result = await requestJson('/api/block-demos/cursor-workspace/settings', {
			method: 'PATCH',
			body: JSON.stringify({ revision: settings.value.revision, model: model.value, mode: mode.value, includeTests: includeTests.value, includeRules: includeRules.value }),
		});
		settings.value = result.settings;
		activity.value = result.activity;
		successMessage.value = result.message;
	} catch (error) {
		if (error.data?.settings) settings.value = error.data.settings;
		captureApiError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Creates a server-owned agent proposal from the selected repository context.
 *
 * @returns {Promise<void>} Resolves after the answer or proposal is ready.
 */
async function runAgent() {
	busy.value = true;
	clearMessages();
	try {
		const result = await requestJson('/api/block-demos/cursor-workspace/agent-runs', {
			method: 'POST',
			body: JSON.stringify({
				prompt: prompt.value,
				model: model.value,
				mode: mode.value,
				contextFileIds: contextFileIds.value,
				includeTests: includeTests.value,
				includeRules: includeRules.value,
				workspaceRevision: workspace.value.revision,
			}),
		});
		proposal.value = result.proposal;
		workspace.value = result.workspace;
		activity.value = result.activity;
		selectedChangeFileId.value = result.proposal.changes?.[0]?.fileId || '';
		assistantTab.value = result.proposal.changes?.length ? 'review' : 'agent';
		activeView.value = result.proposal.changes?.length ? 'review' : 'agent';
		successMessage.value = result.message;
	} catch (error) {
		if (error.data?.workspace) workspace.value = error.data.workspace;
		if (error.data?.files) files.value = error.data.files;
		captureApiError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Runs focused repository checks and exposes terminal evidence.
 *
 * @returns {Promise<void>} Resolves after test evidence is recorded.
 */
async function runTests() {
	busy.value = true;
	clearMessages();
	try {
		const result = await requestJson('/api/block-demos/cursor-workspace/tests', {
			method: 'POST',
			body: JSON.stringify({ workspaceRevision: workspace.value.revision, tests: ['MissionControl.test.tsx', 'workspace-store.test.ts'] }),
		});
		testRuns.value = result.testRuns;
		workspace.value = result.workspace;
		activity.value = result.activity;
		evidenceTab.value = 'terminal';
		successMessage.value = result.message;
	} catch (error) {
		if (error.data?.workspace) workspace.value = error.data.workspace;
		captureApiError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Opens the explicit patch application confirmation.
 *
 * @returns {void}
 */
function openApplyDialog() {
	applyAcknowledged.value = false;
	runTestsAfterApply.value = true;
	fieldErrors.value = {};
	applyDialogOpen.value = true;
}

/**
 * Applies the reviewed proposal and refreshes all affected workspace evidence.
 *
 * @returns {Promise<void>} Resolves after application or stale-revision recovery.
 */
async function applyProposal() {
	if (!proposal.value) return;
	busy.value = true;
	clearMessages();
	try {
		const result = await requestJson(`/api/block-demos/cursor-workspace/proposals/${proposal.value.id}/apply`, {
			method: 'POST',
			body: JSON.stringify({ workspaceRevision: workspace.value.revision, acknowledged: applyAcknowledged.value, runTests: runTestsAfterApply.value }),
		});
		proposal.value = result.proposal;
		workspace.value = result.workspace;
		files.value = result.files;
		testRuns.value = result.testRuns;
		activity.value = result.activity;
		applyFile(result.file);
		applyDialogOpen.value = false;
		activeView.value = 'editor';
		evidenceTab.value = 'terminal';
		successMessage.value = result.message;
	} catch (error) {
		if (error.data?.proposal) proposal.value = error.data.proposal;
		if (error.data?.workspace) workspace.value = error.data.workspace;
		if (error.data?.files) files.value = error.data.files;
		captureApiError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Restores the seeded developer workspace.
 *
 * @returns {Promise<void>} Resolves after reset completes.
 */
async function resetWorkspace() {
	busy.value = true;
	clearMessages();
	try {
		const result = await requestJson('/api/block-demos/cursor-workspace/reset', { method: 'POST' });
		applyBootstrap(result);
		resetDialogOpen.value = false;
		successMessage.value = result.message;
	} catch (error) {
		captureApiError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Synchronizes compact top-level views with the right-hand workspace tabs.
 *
 * @param {string} value Active compact view.
 * @returns {void}
 */
function syncAssistantView(value) {
	if (value === 'agent' || value === 'review') assistantTab.value = value;
}

/**
 * Keeps the compact top-level view aligned with agent and review tab changes.
 *
 * @param {string} value Active assistant tab.
 * @returns {void}
 */
function syncMobileView(value) {
	if (activeView.value === 'agent' || activeView.value === 'review') activeView.value = value;
}

/**
 * Returns a rich option label.
 *
 * @param {Array<Record<string, unknown>>} options Option list.
 * @param {string} value Selected value.
 * @returns {string} Option label.
 */
function optionLabel(options, value) {
	return options.find((option) => option.value === value)?.label || value;
}

/**
 * Formats an ISO timestamp for compact workspace display.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Local display time.
 */
function formatTime(value) {
	return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

/**
 * Capitalizes one status value for display.
 *
 * @param {string} value Status value.
 * @returns {string} Display label.
 */
function capitalize(value) {
	const text = String(value || '');
	return text ? `${text[0].toUpperCase()}${text.slice(1)}` : '';
}

/**
 * Clears transient page and field messages.
 *
 * @returns {void}
 */
function clearMessages() {
	errorMessage.value = '';
	successMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Maps structured API errors to visible page and field feedback.
 *
 * @param {Error & { data?: Record<string, unknown> }} error Request failure.
 * @returns {void}
 */
function captureApiError(error) {
	errorMessage.value = error.message;
	fieldErrors.value = Object.fromEntries((error.data?.fields || []).map((item) => [item.field, [item.message]]));
}

/**
 * Performs a JSON request while preserving structured error evidence.
 *
 * @param {string} url API URL.
 * @param {RequestInit} options Fetch options.
 * @returns {Promise<Record<string, unknown>>} Parsed response.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
	const data = await response.json();
	if (!response.ok || data.error) {
		const error = new Error(data.message || `Request failed with ${response.status}.`);
		error.data = data;
		throw error;
	}
	return data;
}

/**
 * Returns unique non-empty values while preserving order.
 *
 * @param {unknown[]} values Candidate values.
 * @returns {string[]} Unique strings.
 */
function uniqueValues(values) {
	return [...new Set(values.map((value) => String(value || '')).filter(Boolean))];
}

/**
 * Creates a detached JSON-safe value.
 *
 * @template T
 * @param {T} value Source value.
 * @returns {T} Detached value.
 */
function cloneValue(value) {
	return value == null ? value : JSON.parse(JSON.stringify(value));
}

watch(activeView, syncAssistantView);
watch(assistantTab, syncMobileView);
onMounted(loadWorkspace);
</script>

<template>
	<div class="h-dvh min-h-0 overflow-hidden bg-canvas text-canvas-fg">
		<div v-if="loading" class="flex h-full flex-col">
			<div class="flex h-16 items-center border-b border-border px-4"><DomSkeleton variant="text" :lines="1" width="30rem" /></div>
			<div class="grid min-h-0 flex-1 lg:grid-cols-[16rem_minmax(0,1fr)_22rem]"><div class="hidden border-r border-border p-4 lg:block"><DomSkeleton variant="text" :lines="14" /></div><div class="p-5"><DomSkeleton variant="text" :lines="18" /></div><div class="hidden border-l border-border p-4 lg:block"><DomSkeleton variant="text" :lines="14" /></div></div>
		</div>

		<div v-else-if="workspace && bootstrap" class="flex h-full min-h-0 flex-col">
			<header class="shrink-0 border-b border-border bg-canvas">
				<div class="flex min-h-16 items-center gap-3 px-3 py-2 sm:px-4">
					<div class="min-w-0 flex-1">
						<div class="flex min-w-0 items-center gap-2"><h1 class="truncate text-sm font-semibold sm:text-base">{{ workspace.name }}</h1><DomStatusPill :tone="workspace.statusTone" size="sm">{{ workspace.statusLabel }}</DomStatusPill><DomBadge v-if="isDirty" tone="warning" variant="outline">Unsaved</DomBadge></div>
						<p class="truncate text-xs text-muted-fg">{{ workspace.repository }} · {{ workspace.branch }} · repo rev {{ workspace.revision }}</p>
					</div>
					<div class="flex shrink-0 items-center gap-2"><div class="hidden sm:block"><DomButton size="sm" variant="secondary" :loading="busy" @click="runTests">Run tests</DomButton></div><DomButton v-if="isDirty" size="sm" :loading="busy" @click="saveFile">Save file</DomButton><DomButton v-else size="sm" variant="secondary" @click="activeView = 'agent'">Ask agent</DomButton></div>
				</div>
			</header>

			<div v-if="errorMessage || successMessage" class="shrink-0 border-b border-border px-3 py-2 sm:px-4"><DomAlert v-if="errorMessage" tone="danger" variant="soft" title="Workspace action needs attention" :description="errorMessage" dismissible @dismiss="errorMessage = ''" /><DomAlert v-else tone="success" variant="soft" title="Workspace updated" :description="successMessage" dismissible @dismiss="successMessage = ''" /></div>

			<DomTabs v-model="activeView" :tabs="mobileViews" variant="page" class="shrink-0 lg:hidden [&>div:last-child]:hidden" />

			<div class="flex min-h-0 flex-1">
				<aside class="min-h-0 w-full shrink-0 flex-col border-r border-border bg-secondary/10 lg:flex lg:w-64" :class="activeView === 'files' ? 'flex' : 'hidden'">
					<div class="shrink-0 border-b border-border p-4"><div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Repository</p><p class="mt-1 text-sm font-semibold">{{ workspace.repository }}</p></div><DomBadge tone="neutral" variant="outline">{{ workspace.changedFileCount }} changed</DomBadge></div><div class="mt-3"><DomTextInput v-model="fileSearch" label="Find file" placeholder="Search repository…" /></div></div>
					<div class="min-h-0 flex-1 overflow-y-auto p-2"><DomTreeView v-if="!fileSearch" v-model="selectedFileId" v-model:items="fileTree" :chrome="false" density="compact" label="Project files" @select="selectTreeFile" /><div v-else class="divide-y divide-border"><button v-for="file in filteredFiles" :key="file.id" type="button" class="w-full px-3 py-3 text-left transition hover:bg-secondary/45" @click="openFile(file.id)"><div class="flex items-start justify-between gap-3"><p class="truncate text-sm font-medium">{{ file.name }}</p><DomBadge :tone="file.statusTone" variant="outline">{{ file.statusLabel }}</DomBadge></div><p class="mt-1 truncate font-mono text-[11px] text-muted-fg">{{ file.path }}</p></button><DomEmptyState v-if="!filteredFiles.length" class="py-12" title="No matching files" description="Try a filename or path segment." /></div></div>
					<div class="shrink-0 border-t border-border p-4"><div class="flex items-center justify-between text-xs"><span class="text-muted-fg">Indexed files</span><span class="font-semibold">{{ workspace.indexedFileCount.toLocaleString() }}</span></div><div class="mt-2 flex items-center justify-between text-xs"><span class="text-muted-fg">Last index</span><span class="font-semibold">{{ formatTime(workspace.indexedAt) }}</span></div><DomButton class="mt-4 w-full" size="sm" variant="ghost" @click="resetDialogOpen = true">Reset workspace</DomButton></div>
				</aside>

				<main class="min-h-0 min-w-0 flex-1 flex-col" :class="activeView === 'editor' ? 'flex' : 'hidden lg:flex'">
					<div class="flex shrink-0 items-end overflow-x-auto border-b border-border bg-secondary/10 px-2 pt-2" role="tablist" aria-label="Open files"><button v-for="file in openFiles" :key="file.id" type="button" role="tab" :aria-selected="activeFile?.id === file.id" class="group flex h-9 min-w-0 max-w-56 items-center gap-2 border border-transparent border-b-border px-3 text-xs text-muted-fg transition hover:bg-secondary/45" :class="activeFile?.id === file.id ? 'border-x-border border-t-border border-b-canvas bg-canvas text-canvas-fg' : ''" @click="openFile(file.id)"><span class="truncate">{{ file.name }}</span><span v-if="file.status !== 'clean'" class="font-semibold" :class="file.status === 'added' ? 'text-success' : 'text-warning'">{{ file.status === 'added' ? 'A' : 'M' }}</span></button></div>

					<section v-if="activeFile" class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
						<div class="flex flex-wrap items-start justify-between gap-3"><div class="min-w-0"><div class="flex min-w-0 items-center gap-2"><h2 class="truncate text-sm font-semibold">{{ activeFile.name }}</h2><DomStatusPill :tone="fileStatusTone" size="sm">{{ activeFile.statusLabel }}</DomStatusPill></div><p class="mt-1 truncate font-mono text-xs text-muted-fg">{{ activeFile.path }} · file rev {{ activeFile.revision }}</p></div><div class="flex items-center gap-2"><DomButton size="sm" variant="secondary" :loading="busy" @click="runTests">Test</DomButton><DomButton size="sm" :disabled="!isDirty" :loading="busy" @click="saveFile">Save</DomButton></div></div>
						<div class="mt-4"><DomCodeInput v-model="editorContent" label="File content" :lang="activeFile.language" :rows="16" :editor="false" :errors="fieldErrors.content || []" description="Saves use the exact server file revision and recover from stale writes." /></div>
					</section>

					<section class="h-56 shrink-0 border-t border-border bg-secondary/10"><DomTabs v-model="evidenceTab" :tabs="evidenceTabs" variant="page" fill>
						<template #terminal><div class="h-full min-h-0 overflow-y-auto bg-canvas p-4 font-mono text-xs leading-6"><div v-if="latestTestRun"><div class="mb-3 flex items-center justify-between gap-3"><span class="text-muted-fg">{{ latestTestRun.id }} · repo rev {{ latestTestRun.workspaceRevision }}</span><DomStatusPill :tone="latestTestRun.statusTone" size="sm">{{ latestTestRun.statusLabel }}</DomStatusPill></div><p v-for="line in latestTestRun.output" :key="line" :class="line.startsWith('PASS') ? 'text-success' : line.startsWith('FAIL') ? 'text-destructive' : 'text-muted-fg'">{{ line }}</p></div><DomEmptyState v-else title="No test evidence" description="Run focused checks against the current repository revision." /></div></template>
						<template #problems><div class="h-full overflow-y-auto p-4"><DomEmptyState v-if="latestTestRun?.status === 'passed'" title="No current problems" :description="`All ${latestTestRun.testCount} focused checks passed at repository revision ${latestTestRun.workspaceRevision}.`" /><DomAlert v-else tone="danger" title="Focused tests failed" description="Open Terminal to inspect the server-owned failure evidence." /></div></template>
						<template #activity><div class="h-full divide-y divide-border overflow-y-auto px-4"><div v-for="event in activity" :key="event.id" class="flex items-start justify-between gap-4 py-3"><div><p class="text-sm font-medium">{{ event.label }}</p><p class="mt-1 text-xs text-muted-fg">{{ event.detail }}</p></div><p class="shrink-0 text-[11px] text-muted-fg">{{ event.actor }}</p></div></div></template>
					</DomTabs></section>
				</main>

				<aside class="min-h-0 w-full shrink-0 flex-col border-l border-border bg-secondary/10 lg:flex lg:w-88" :class="activeView === 'agent' || activeView === 'review' ? 'flex' : 'hidden'">
					<DomTabs v-model="assistantTab" :tabs="assistantTabs" variant="page" fill class="min-h-0 flex-1">
						<template #agent><div class="h-full min-h-0 overflow-y-auto p-4"><div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Change session</p><h2 class="mt-1 text-lg font-semibold">Plan with context</h2></div><DomStatusPill tone="info" size="sm">{{ activeModelLabel }}</DomStatusPill></div><p class="mt-2 text-sm leading-6 text-muted-fg">Ask a repository-aware agent, then review exact file diffs before anything is applied.</p>
							<div class="mt-5"><DomToggleButtonGroup v-model="mode" :options="bootstrap.options.modes" label="Agent mode" size="sm" chrome="none" /></div>
							<div class="mt-5"><DomSelect v-model="model" label="Model" :options="bootstrap.options.models" :errors="fieldErrors.model || []" width="min-w-[19rem]"><template #option="{ option }"><div class="flex items-start justify-between gap-3"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div><span class="shrink-0 text-[11px] opacity-60">{{ option.context }}</span></div></template></DomSelect></div>
							<div class="mt-5"><DomTagCombobox v-model="contextFileIds" :options="bootstrap.options.contextFiles" label="Repository context" placeholder="Add file" :errors="fieldErrors.contextFileIds || []" clearable><template #item="{ item }"><div><p class="font-medium">{{ item.label }}</p><p class="mt-0.5 text-xs text-muted-fg">{{ item.description }}</p></div></template></DomTagCombobox></div>
							<div class="mt-5"><DomTextareaInput v-model="prompt" label="Change request" :rows="5" :errors="fieldErrors.prompt || []" placeholder="Describe the outcome and safety boundary." /></div>
							<div class="mt-5 grid gap-4 border-y border-border py-4"><DomCheckbox v-model="includeRules" label="Include repository rules" description="Use the four checked-in project instructions." /><DomCheckbox v-model="includeTests" label="Include test evidence" description="Attach the latest focused test output to context." /></div>
							<div class="mt-5 grid grid-cols-2 gap-2"><DomButton variant="secondary" :loading="busy" @click="saveDefaults">Save defaults</DomButton><DomButton data-testid="run-agent" :loading="busy" @click="runAgent">Run agent</DomButton></div>
							<div v-if="proposal?.messages?.length" class="mt-7"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Latest conversation</p><div class="mt-2 divide-y divide-border border-y border-border"><div v-for="message in proposal.messages" :key="`${message.role}-${message.body}`" class="py-4"><div class="flex items-center justify-between gap-3"><p class="text-sm font-semibold">{{ message.author }}</p><p class="text-[11px] text-muted-fg">{{ message.meta }}</p></div><p class="mt-2 text-sm leading-6 text-muted-fg">{{ message.body }}</p></div></div></div>
						</div></template>

						<template #review><div class="h-full min-h-0 overflow-y-auto p-4"><div v-if="proposal"><div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ proposal.id }}</p><h2 class="mt-1 text-lg font-semibold">Review proposed patch</h2></div><DomStatusPill :tone="proposal.statusTone" size="sm">{{ proposal.statusLabel }}</DomStatusPill></div><p class="mt-2 text-sm leading-6 text-muted-fg">{{ proposal.summary }}</p>
							<div v-if="proposal.changes?.length" class="mt-5"><DomSelect v-model="selectedChangeFileId" label="Changed file" :options="proposal.changes.map((change) => ({ value: change.fileId, label: change.file.split('/').pop(), description: change.summary }))" width="min-w-[19rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div>
							<div v-if="selectedChange" class="mt-5"><div class="mb-3 flex items-center justify-between gap-3"><p class="truncate font-mono text-xs text-muted-fg">{{ selectedChange.file }}</p><p class="shrink-0 text-xs"><span class="text-success">+{{ selectedChange.additions }}</span> <span class="text-destructive">−{{ selectedChange.deletions }}</span></p></div><DomTextDiff :original="selectedChange.original" :proposed="selectedChange.proposed" original-label="Current" proposed-label="Proposed" view="inline" format="text" /></div>
							<div class="mt-6"><div class="flex items-center justify-between gap-3"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Run checks</p><DomStatusPill :tone="proposalReadiness === proposalCheckCount ? 'success' : 'warning'" size="sm">{{ proposalReadiness }}/{{ proposalCheckCount }}</DomStatusPill></div><div class="mt-2 divide-y divide-border border-y border-border"><div v-for="check in proposal.checks" :key="check.label" class="flex items-start justify-between gap-3 py-3"><div><p class="text-sm font-medium">{{ check.label }}</p><p class="mt-1 text-xs text-muted-fg">{{ check.detail }}</p></div><DomBadge :tone="check.status === 'passed' ? 'success' : 'warning'" variant="outline">{{ capitalize(check.status) }}</DomBadge></div></div></div>
							<div v-if="proposal.receipt" class="mt-6 border-y border-success/35 bg-success/5 py-4"><div class="flex items-center justify-between gap-3"><p class="text-sm font-semibold">Patch applied</p><DomStatusPill tone="success" size="sm">Rollback ready</DomStatusPill></div><p class="mt-2 font-mono text-xs text-muted-fg">{{ proposal.receipt.id }}</p><p class="mt-2 text-sm text-muted-fg">{{ proposal.receipt.filesChanged }} files · repository revision {{ proposal.receipt.workspaceRevision }}</p></div>
							<div v-else-if="proposal.status === 'proposed'" class="mt-6"><DomButton class="w-full" data-testid="apply-proposal" @click="openApplyDialog">Review and apply {{ proposal.changes.length }} files</DomButton><p class="mt-2 text-center text-xs text-muted-fg">Exact repository revision {{ proposal.workspaceRevision }} required.</p></div>
							<DomAlert v-else-if="proposal.status === 'answered'" class="mt-6" tone="info" title="No patch created" description="Ask mode returned repository guidance without proposing file mutations." />
						</div><DomEmptyState v-else class="py-16" title="No agent proposal" description="Run an Edit or Agent request to create reviewable file diffs."><template #actions><DomButton @click="activeView = 'agent'">Open agent</DomButton></template></DomEmptyState></div></template>
					</DomTabs>
				</aside>
			</div>

			<DomDialog v-model="applyDialogOpen" title="Apply reviewed agent patch" :description="`This writes ${proposal?.changes?.length || 0} files against repository revision ${workspace.revision}. A rollback receipt is stored with the result.`"><div class="grid gap-4"><DomAlert tone="warning" variant="soft" title="Repository write" description="If the workspace changed after generation, the server rejects this patch and asks for a fresh agent run." /><DomCheckbox v-model="applyAcknowledged" label="I reviewed each changed file and the repository revision" description="Required before the server writes the proposed content." :errors="fieldErrors.acknowledged || []" /><DomCheckbox v-model="runTestsAfterApply" label="Run focused tests after applying" description="Store MissionControl and workspace-store evidence with the application receipt." /></div><template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :disabled="!applyAcknowledged" :loading="busy" @click="applyProposal">Apply patch</DomButton></template></DomDialog>

			<DomDialog v-model="resetDialogOpen" title="Reset the developer workspace?" description="This clears process-local file edits, agent proposals, settings, tests, and activity, then restores the seeded repository."><template #footer><DomButton variant="secondary" data-close>Keep workspace</DomButton><DomButton variant="danger" :loading="busy" @click="resetWorkspace">Reset demo</DomButton></template></DomDialog>
		</div>

		<div v-else class="grid h-full place-items-center p-6"><DomAlert tone="danger" title="Developer workspace unavailable" :description="errorMessage || 'The workspace API did not return a repository.'"><template #actions><DomButton variant="secondary" @click="loadWorkspace">Try again</DomButton></template></DomAlert></div>
	</div>
</template>
