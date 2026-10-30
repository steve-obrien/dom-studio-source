<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomCodeInput,
	DomDialog,
	DomEmptyState,
	DomJsonViewer,
	DomRangeInput,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTagCombobox,
	DomTextareaInput,
	DomTextInput,
	DomToggleButtonGroup,
} from '@getdom/studio/vue';

const mobileViews = [
	{ key: 'library', label: 'Library' },
	{ key: 'request', label: 'Request' },
	{ key: 'response', label: 'Response' },
	{ key: 'context', label: 'Context' },
];
const libraryModes = [
	{ label: 'Templates', value: 'templates' },
	{ label: 'History', value: 'history' },
];
const requestTabs = [
	{ key: 'body', label: 'Body' },
	{ key: 'authorization', label: 'Authorization' },
	{ key: 'headers', label: 'Headers' },
];
const responseTabs = [
	{ key: 'response-body', label: 'Body' },
	{ key: 'response-headers', label: 'Headers' },
	{ key: 'timeline', label: 'Timeline' },
];

const loading = ref(true);
const busy = ref(false);
const bootstrap = ref(null);
const selectedTemplate = ref(null);
const selectedRun = ref(null);
const selectedTemplateId = ref('');
const selectedRunId = ref('');
const activeView = ref('request');
const libraryMode = ref('templates');
const requestTab = ref('body');
const responseTab = ref('response-body');
const searchQuery = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const fieldErrors = ref({});
const saveDialogOpen = ref(false);
const productionDialogOpen = ref(false);
const resetDialogOpen = ref(false);
const productionAcknowledged = ref(false);
const saveDraft = ref({ name: '', description: '', collectionId: 'billing', visibility: 'team' });
const draft = ref(createEmptyDraft());

const templates = computed(() => bootstrap.value?.templates || []);
const runs = computed(() => bootstrap.value?.runs || []);
const selectedEnvironment = computed(() => bootstrap.value?.options.environments.find((item) => item.value === draft.value.environmentId) || null);
const resolvedUrl = computed(() => `${selectedEnvironment.value?.baseUrl || ''}${draft.value.path || '/'}`);
const isProductionWrite = computed(() => draft.value.environmentId === 'production' && draft.value.method !== 'GET');
const filteredTemplates = computed(() => filterItems(templates.value, searchQuery.value, ['name', 'description', 'method', 'path']));
const filteredRuns = computed(() => filterItems(runs.value, searchQuery.value, ['requestId', 'method', 'path', 'statusLabel']));
const isTemplateDirty = computed(() => {
	if (!selectedTemplate.value) return false;
	return JSON.stringify(templateRequestFields(selectedTemplate.value)) !== JSON.stringify(templateRequestFields(draft.value));
});
const responseSummary = computed(() => selectedRun.value ? `${selectedRun.value.statusLabel} · ${selectedRun.value.latencyMs}ms` : 'No response yet');
const rateLimitRemaining = computed(() => selectedRun.value?.response.headers['x-ratelimit-remaining'] || '—');

/**
 * Creates the blank request draft used before the bootstrap response arrives.
 *
 * @returns {Record<string, unknown>} Empty request draft.
 */
function createEmptyDraft() {
	return {
		templateId: null,
		method: 'GET',
		environmentId: 'staging',
		path: '/v1/customers/{{customer_id}}',
		authMode: 'workspace-key',
		scopes: ['customers:read'],
		headers: '{\n\t"Accept": "application/json"\n}',
		body: '{}',
		timeoutMs: 3000,
	};
}

/**
 * Loads the server-owned console workspace.
 *
 * @returns {Promise<void>} Resolves after workspace state is ready.
 */
async function loadWorkspace() {
	loading.value = true;
	clearMessages();
	try {
		const result = await requestJson('/api/block-demos/api-request-console/bootstrap');
		bootstrap.value = result;
		applyTemplate(result.template);
		selectedRun.value = result.run;
		selectedRunId.value = result.run?.id || '';
	} catch (error) {
		errorMessage.value = error.message;
	} finally {
		loading.value = false;
	}
}

/**
 * Applies a saved request to the composer.
 *
 * @param {Record<string, unknown>} template Saved template.
 * @returns {void}
 */
function applyTemplate(template) {
	if (!template) return;
	selectedTemplate.value = structuredClone(template);
	selectedTemplateId.value = template.id;
	draft.value = { ...templateRequestFields(template), templateId: template.id };
	fieldErrors.value = {};
	activeView.value = 'request';
}

/**
 * Loads an immutable run into the response inspector.
 *
 * @param {Record<string, unknown>} run Request run.
 * @returns {void}
 */
function inspectRun(run) {
	selectedRun.value = structuredClone(run);
	selectedRunId.value = run.id;
	responseTab.value = 'response-body';
	activeView.value = 'response';
}

/**
 * Rehydrates the composer from a prior run for safe replay.
 *
 * @returns {void}
 */
function loadRunRequest() {
	if (!selectedRun.value) return;
	draft.value = {
		templateId: selectedRun.value.templateId,
		method: selectedRun.value.method,
		environmentId: selectedRun.value.environmentId,
		path: selectedRun.value.path,
		authMode: selectedRun.value.authMode,
		scopes: [...selectedRun.value.scopes],
		headers: JSON.stringify(selectedRun.value.headers || {}, null, 2),
		body: JSON.stringify(selectedRun.value.body || {}, null, 2),
		timeoutMs: selectedRun.value.timeoutMs,
	};
	activeView.value = 'request';
	successMessage.value = 'Prior request loaded. Review the environment and authorization before sending.';
}

/**
 * Dispatches immediately or opens the protected production confirmation.
 *
 * @returns {Promise<void>} Resolves after send routing is complete.
 */
async function requestSend() {
	if (isProductionWrite.value && !productionAcknowledged.value) {
		productionDialogOpen.value = true;
		return;
	}
	await sendRequest();
}

/**
 * Sends the draft through the server-owned proxy and records the run.
 *
 * @returns {Promise<void>} Resolves after response evidence is stored.
 */
async function sendRequest() {
	busy.value = true;
	clearMessages();
	try {
		const result = await requestJson('/api/block-demos/api-request-console/runs', {
			method: 'POST',
			body: JSON.stringify({ ...draft.value, productionAcknowledged: productionAcknowledged.value }),
		});
		bootstrap.value.runs = result.runs;
		bootstrap.value.templates = result.templates;
		selectedRun.value = result.run;
		selectedRunId.value = result.run.id;
		productionDialogOpen.value = false;
		productionAcknowledged.value = false;
		successMessage.value = result.message;
		responseTab.value = 'response-body';
		activeView.value = 'response';
	} catch (error) {
		captureApiError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Saves request changes back to the selected template revision.
 *
 * @returns {Promise<void>} Resolves after template persistence.
 */
async function saveChanges() {
	if (!selectedTemplate.value) return;
	busy.value = true;
	clearMessages();
	try {
		const payload = { ...selectedTemplate.value, ...draft.value, revision: selectedTemplate.value.revision };
		const result = await requestJson(`/api/block-demos/api-request-console/templates/${selectedTemplate.value.id}`, {
			method: 'PATCH',
			body: JSON.stringify(payload),
		});
		bootstrap.value.templates = result.templates;
		applyTemplate(result.template);
		successMessage.value = result.message;
	} catch (error) {
		if (error.data?.template) {
			bootstrap.value.templates = error.data.templates;
			applyTemplate(error.data.template);
		}
		captureApiError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Opens the save-as dialog with useful defaults.
 *
 * @returns {void}
 */
function openSaveDialog() {
	saveDraft.value = {
		name: selectedTemplate.value ? `${selectedTemplate.value.name} copy` : 'New API request',
		description: selectedTemplate.value?.description || 'Reusable request for the developer platform team.',
		collectionId: selectedTemplate.value?.collectionId || 'operations',
		visibility: selectedTemplate.value?.visibility || 'team',
	};
	fieldErrors.value = {};
	saveDialogOpen.value = true;
}

/**
 * Creates a new saved template from the current composer state.
 *
 * @returns {Promise<void>} Resolves after template creation.
 */
async function createTemplate() {
	busy.value = true;
	clearMessages();
	try {
		const result = await requestJson('/api/block-demos/api-request-console/templates', {
			method: 'POST',
			body: JSON.stringify({ ...draft.value, ...saveDraft.value }),
		});
		bootstrap.value.templates = result.templates;
		applyTemplate(result.template);
		saveDialogOpen.value = false;
		successMessage.value = result.message;
	} catch (error) {
		captureApiError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Restores the seeded workspace through the reset API.
 *
 * @returns {Promise<void>} Resolves after reset completes.
 */
async function resetWorkspace() {
	busy.value = true;
	clearMessages();
	try {
		const result = await requestJson('/api/block-demos/api-request-console/reset', { method: 'POST' });
		bootstrap.value = result;
		applyTemplate(result.template);
		selectedRun.value = result.run;
		selectedRunId.value = result.run?.id || '';
		resetDialogOpen.value = false;
		successMessage.value = result.message;
	} catch (error) {
		captureApiError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Extracts comparable request fields from a template or draft.
 *
 * @param {Record<string, unknown>} source Template or draft.
 * @returns {Record<string, unknown>} Request fields.
 */
function templateRequestFields(source) {
	return {
		method: source.method,
		environmentId: source.environmentId,
		path: source.path,
		authMode: source.authMode,
		scopes: [...(source.scopes || [])],
		headers: source.headers,
		body: source.body,
		timeoutMs: source.timeoutMs,
	};
}

/**
 * Filters list records across a set of searchable fields.
 *
 * @param {Array<Record<string, unknown>>} items Source records.
 * @param {string} query Search query.
 * @param {string[]} fields Searchable fields.
 * @returns {Array<Record<string, unknown>>} Matching records.
 */
function filterItems(items, query, fields) {
	const needle = String(query || '').trim().toLowerCase();
	if (!needle) return items;
	return items.filter((item) => fields.some((field) => String(item[field] || '').toLowerCase().includes(needle)));
}

/**
 * Returns a registered option label.
 *
 * @param {Array<Record<string, unknown>>} options Option records.
 * @param {string} value Selected value.
 * @returns {string} Display label.
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
 * Formats a JSON value for the code editor.
 *
 * @param {unknown} value JSON value.
 * @returns {string} Pretty JSON source.
 */
function formatJson(value) {
	return typeof value === 'string' ? value : JSON.stringify(value || {}, null, 2);
}

/**
 * Clears transient messages and field errors.
 *
 * @returns {void}
 */
function clearMessages() {
	errorMessage.value = '';
	successMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Maps structured API errors into visible page and field feedback.
 *
 * @param {Error & { data?: Record<string, unknown> }} error Request failure.
 * @returns {void}
 */
function captureApiError(error) {
	errorMessage.value = error.message;
	fieldErrors.value = Object.fromEntries((error.data?.fields || []).map((item) => [item.field, [item.message]]));
}

/**
 * Performs a JSON request and preserves structured API failure evidence.
 *
 * @param {string} url API URL.
 * @param {RequestInit} options Fetch options.
 * @returns {Promise<Record<string, unknown>>} Parsed response.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
		...options,
	});
	const data = await response.json();
	if (!response.ok || data.error) {
		const error = new Error(data.message || `Request failed with ${response.status}.`);
		error.data = data;
		throw error;
	}
	return data;
}

onMounted(loadWorkspace);
</script>

<template>
	<div class="h-dvh min-h-0 overflow-hidden bg-canvas text-canvas-fg">
		<div v-if="loading" class="flex h-full flex-col">
			<div class="flex h-16 items-center border-b border-border px-4"><DomSkeleton variant="text" :lines="1" width="30rem" /></div>
			<div class="grid min-h-0 flex-1 lg:grid-cols-[17rem_minmax(0,1fr)_20rem]">
				<div class="hidden border-r border-border p-4 lg:block"><DomSkeleton variant="text" :lines="14" /></div>
				<div class="p-5"><DomSkeleton variant="text" :lines="18" /></div>
				<div class="hidden border-l border-border p-4 lg:block"><DomSkeleton variant="text" :lines="12" /></div>
			</div>
		</div>

		<div v-else-if="bootstrap" class="flex h-full min-h-0 flex-col">
			<header class="shrink-0 border-b border-border bg-canvas">
				<div class="flex min-h-16 items-center gap-3 px-3 py-2 sm:px-4">
					<div class="min-w-0 flex-1">
						<div class="flex min-w-0 items-center gap-2">
							<h1 class="truncate text-sm font-semibold sm:text-base">API request console</h1>
							<DomStatusPill tone="success" size="sm">Proxy online</DomStatusPill>
							<DomBadge v-if="isTemplateDirty" tone="warning" variant="outline">Unsaved</DomBadge>
						</div>
						<p class="truncate text-xs text-muted-fg">{{ bootstrap.workspace.name }} · {{ bootstrap.workspace.proxy }}</p>
					</div>
					<div class="flex shrink-0 items-center gap-2">
						<DomButton class="hidden sm:inline-flex" size="sm" variant="secondary" @click="openSaveDialog">Save as</DomButton>
						<DomButton v-if="isTemplateDirty" class="hidden md:inline-flex" size="sm" variant="secondary" :loading="busy" @click="saveChanges">Save changes</DomButton>
						<DomButton data-testid="send-request" size="sm" :loading="busy" @click="requestSend">Send request</DomButton>
					</div>
				</div>
			</header>

			<div v-if="errorMessage || successMessage" class="shrink-0 border-b border-border px-3 py-2 sm:px-4">
				<DomAlert v-if="errorMessage" tone="danger" variant="soft" title="Request needs attention" :description="errorMessage" dismissible @dismiss="errorMessage = ''" />
				<DomAlert v-else tone="success" variant="soft" title="Workspace updated" :description="successMessage" dismissible @dismiss="successMessage = ''" />
			</div>

			<DomTabs v-model="activeView" :tabs="mobileViews" variant="page" class="shrink-0 lg:hidden [&>div:last-child]:hidden" />

			<div class="flex min-h-0 flex-1">
				<aside class="min-h-0 w-full shrink-0 flex-col border-r border-border bg-secondary/10 lg:flex lg:w-68" :class="activeView === 'library' ? 'flex' : 'hidden'">
					<div class="shrink-0 border-b border-border p-3">
						<DomToggleButtonGroup v-model="libraryMode" :options="libraryModes" label="Library view" size="sm" chrome="none" />
						<div class="mt-3"><DomTextInput v-model="searchQuery" label="Search library" placeholder="Path, method, request ID…" /></div>
					</div>

					<nav v-if="libraryMode === 'templates'" class="min-h-0 flex-1 divide-y divide-border overflow-y-auto" aria-label="Request templates">
						<button v-for="template in filteredTemplates" :key="template.id" type="button" class="w-full border-l-2 px-4 py-4 text-left transition hover:bg-secondary/45 focus-visible:outline-2 focus-visible:outline-ring" :class="template.id === selectedTemplateId ? 'border-l-primary bg-secondary/55' : 'border-l-transparent'" @click="applyTemplate(template)">
							<div class="flex items-start justify-between gap-3"><p class="min-w-0 truncate text-sm font-semibold">{{ template.name }}</p><DomBadge tone="neutral" variant="outline">{{ template.method }}</DomBadge></div>
							<p class="mt-1 truncate font-mono text-xs text-muted-fg">{{ template.path }}</p>
							<p class="mt-2 line-clamp-2 text-xs leading-5 text-muted-fg">{{ template.description }}</p>
						</button>
						<DomEmptyState v-if="!filteredTemplates.length" class="px-4 py-12" title="No matching templates" description="Try a method, path, or template name." />
					</nav>

					<nav v-else class="min-h-0 flex-1 divide-y divide-border overflow-y-auto" aria-label="Request history">
						<button v-for="run in filteredRuns" :key="run.id" type="button" class="w-full border-l-2 px-4 py-4 text-left transition hover:bg-secondary/45 focus-visible:outline-2 focus-visible:outline-ring" :class="run.id === selectedRunId ? 'border-l-primary bg-secondary/55' : 'border-l-transparent'" @click="inspectRun(run)">
							<div class="flex items-start justify-between gap-3"><p class="min-w-0 truncate font-mono text-xs font-semibold">{{ run.requestId }}</p><DomStatusPill :tone="run.statusTone" size="sm">{{ run.status }}</DomStatusPill></div>
							<p class="mt-2 truncate text-sm font-medium">{{ run.method }} {{ run.path }}</p>
							<p class="mt-1 text-xs text-muted-fg">{{ formatTime(run.ranAt) }} · {{ run.latencyMs }}ms</p>
						</button>
						<DomEmptyState v-if="!filteredRuns.length" class="px-4 py-12" title="No matching runs" description="Try a path or request identifier." />
					</nav>

					<div class="shrink-0 border-t border-border p-3"><DomButton class="w-full" size="sm" variant="ghost" @click="resetDialogOpen = true">Reset demo data</DomButton></div>
				</aside>

				<main class="min-h-0 min-w-0 flex-1 flex-col" :class="activeView === 'request' || activeView === 'response' ? 'flex' : 'hidden lg:flex'">
					<section class="min-h-0 flex-1 flex-col border-b border-border lg:flex" :class="activeView === 'request' ? 'flex' : 'hidden'">
						<div class="shrink-0 border-b border-border px-4 py-3 sm:px-5">
							<div class="grid min-w-0 gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
								<DomSelect v-model="draft.method" label="Method" :options="bootstrap.options.methods" :errors="fieldErrors.method || []" width="min-w-[12rem]"><template #option="{ option }"><div><p class="font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
								<DomTextInput v-model="draft.path" label="Request path" :errors="fieldErrors.path || []" />
							</div>
							<p class="mt-2 truncate font-mono text-xs text-muted-fg" :title="resolvedUrl">{{ resolvedUrl }}</p>
						</div>

						<DomTabs v-model="requestTab" :tabs="requestTabs" variant="page" fill class="min-h-0 flex-1">
							<template #body><div class="h-full min-h-0 overflow-y-auto p-4 sm:p-5"><DomCodeInput v-model="draft.body" label="Request JSON" lang="json" :rows="13" :editor="false" :errors="fieldErrors.body || []" description="Template variables are resolved by the server proxy." /></div></template>
							<template #authorization>
								<div class="h-full min-h-0 overflow-y-auto p-4 sm:p-5">
									<div class="grid gap-5 xl:grid-cols-2">
										<DomSelect v-model="draft.environmentId" label="Environment" :options="bootstrap.options.environments" :errors="fieldErrors.environmentId || []" width="min-w-[20rem]"><template #option="{ option }"><div class="flex items-start justify-between gap-3"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div><DomBadge :tone="option.tone" variant="soft">{{ option.status }}</DomBadge></div></template></DomSelect>
										<DomSelect v-model="draft.authMode" label="Authorization" :options="bootstrap.options.auth" :errors="fieldErrors.authMode || []" width="min-w-[20rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
									</div>
									<div class="mt-5"><DomTagCombobox v-model="draft.scopes" :options="bootstrap.options.scopes" label="Granted scopes" placeholder="Add scope" :errors="fieldErrors.scopes || []" clearable><template #item="{ item }"><div><div class="flex items-center justify-between gap-3"><p class="font-medium">{{ item.label }}</p><span class="text-[11px] text-muted-fg">{{ item.group }}</span></div><p class="mt-0.5 text-xs text-muted-fg">{{ item.description }}</p></div></template></DomTagCombobox></div>
									<div class="mt-5 border-t border-border pt-5"><DomRangeInput v-model="draft.timeoutMs" label="Timeout budget" :min="1000" :max="10000" :step="500" suffix="ms" :errors="fieldErrors.timeoutMs || []" /></div>
								</div>
							</template>
							<template #headers><div class="h-full min-h-0 overflow-y-auto p-4 sm:p-5"><DomCodeInput v-model="draft.headers" label="Request headers" lang="json" :rows="11" :editor="false" :errors="fieldErrors.headers || []" description="Authorization is injected by the proxy and is never persisted in visible source." /></div></template>
						</DomTabs>
						<div class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
							<p class="text-xs text-muted-fg">{{ draft.timeoutMs }}ms timeout · {{ draft.scopes.length }} scopes · {{ selectedEnvironment?.status }}</p>
							<div class="flex items-center gap-2"><DomButton size="sm" variant="secondary" @click="openSaveDialog">Save as</DomButton><DomButton v-if="isTemplateDirty" size="sm" variant="secondary" :loading="busy" @click="saveChanges">Save changes</DomButton><DomButton size="sm" :loading="busy" @click="requestSend">Send</DomButton></div>
						</div>
					</section>

					<section class="min-h-0 flex-1 flex-col lg:flex" :class="activeView === 'response' ? 'flex' : 'hidden'">
						<div class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
							<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Latest response</p><div class="mt-1 flex items-center gap-2"><h2 class="text-sm font-semibold">{{ responseSummary }}</h2><DomStatusPill v-if="selectedRun" :tone="selectedRun.statusTone" size="sm">{{ selectedRun.status }}</DomStatusPill></div></div>
							<DomButton v-if="selectedRun" size="sm" variant="secondary" @click="loadRunRequest">Load request</DomButton>
						</div>
						<DomTabs v-if="selectedRun" v-model="responseTab" :tabs="responseTabs" variant="page" fill class="min-h-0 flex-1">
							<template #response-body><div class="h-full min-h-0 overflow-y-auto p-4"><DomJsonViewer :value="selectedRun.response.body" title="Response body" filename="response.json" :preview-lines="18" /></div></template>
							<template #response-headers><div class="h-full min-h-0 overflow-y-auto p-4"><DomJsonViewer :value="selectedRun.response.headers" title="Response headers" filename="headers.json" :preview-lines="18" /></div></template>
							<template #timeline><div class="h-full min-h-0 divide-y divide-border overflow-y-auto border-y border-border px-4"><div v-for="step in selectedRun.timeline" :key="step.label" class="flex items-start justify-between gap-4 py-4"><div><p class="text-sm font-medium">{{ step.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ step.detail }}</p></div><div class="shrink-0 text-right"><DomStatusPill :tone="step.status === 'warning' ? 'warning' : 'success'" size="sm">{{ step.status }}</DomStatusPill><p class="mt-1 font-mono text-[11px] text-muted-fg">{{ step.duration }}</p></div></div></div></template>
						</DomTabs>
						<DomEmptyState v-else class="m-auto max-w-md py-12" title="No request evidence" description="Send a registered request to inspect body, headers, and proxy timeline."><template #actions><DomButton @click="activeView = 'request'">Compose request</DomButton></template></DomEmptyState>
					</section>
				</main>

				<aside class="min-h-0 w-full shrink-0 flex-col border-l border-border bg-secondary/10 lg:flex lg:w-80" :class="activeView === 'context' ? 'flex' : 'hidden'">
					<div class="min-h-0 flex-1 overflow-y-auto p-4">
						<div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Environment</p><h2 class="mt-1 text-lg font-semibold">{{ selectedEnvironment?.label }}</h2></div><DomStatusPill :tone="selectedEnvironment?.tone" size="sm">{{ selectedEnvironment?.status }}</DomStatusPill></div>
						<p class="mt-2 text-sm leading-6 text-muted-fg">{{ selectedEnvironment?.description }}</p>
						<div class="mt-5 divide-y divide-border border-y border-border"><div v-for="variable in selectedEnvironment?.variables" :key="variable.name" class="flex items-center justify-between gap-3 py-3"><div><p class="font-mono text-xs font-semibold">{{ variable.name }}</p><p class="mt-1 text-xs text-muted-fg">{{ variable.secret ? 'Server secret' : 'Public variable' }}</p></div><code class="text-xs">{{ variable.value }}</code></div></div>

						<div class="mt-7"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Security boundary</p><dl class="mt-2 divide-y divide-border border-y border-border text-sm"><div class="flex items-start justify-between gap-4 py-3"><dt class="text-muted-fg">Credentials</dt><dd class="text-right font-medium">{{ bootstrap.policy.credentials }}</dd></div><div class="flex items-start justify-between gap-4 py-3"><dt class="text-muted-fg">Run history</dt><dd class="text-right font-medium">{{ bootstrap.policy.historyRetention }}</dd></div><div class="flex items-start justify-between gap-4 py-3"><dt class="text-muted-fg">Production writes</dt><dd class="text-right font-medium">Explicit confirmation</dd></div></dl></div>

						<div v-if="selectedRun" class="mt-7"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Current evidence</p><dl class="mt-2 divide-y divide-border border-y border-border text-sm"><div class="flex items-center justify-between gap-4 py-3"><dt class="text-muted-fg">Request ID</dt><dd class="font-mono text-xs font-semibold">{{ selectedRun.requestId }}</dd></div><div class="flex items-center justify-between gap-4 py-3"><dt class="text-muted-fg">Rate remaining</dt><dd class="font-semibold">{{ rateLimitRemaining }}</dd></div><div class="flex items-center justify-between gap-4 py-3"><dt class="text-muted-fg">Region</dt><dd class="font-semibold">{{ selectedRun.response.headers['x-proxy-region'] }}</dd></div><div class="flex items-center justify-between gap-4 py-3"><dt class="text-muted-fg">Ran at</dt><dd class="text-right font-semibold">{{ formatTime(selectedRun.ranAt) }}</dd></div></dl></div>

						<div v-if="selectedTemplate" class="mt-7"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Selected template</p><div class="mt-2 border-y border-border py-4"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-semibold">{{ selectedTemplate.name }}</p><p class="mt-1 text-xs text-muted-fg">{{ optionLabel(bootstrap.options.collections, selectedTemplate.collectionId) }} · rev {{ selectedTemplate.revision }}</p></div><DomBadge tone="neutral" variant="outline">{{ selectedTemplate.visibility }}</DomBadge></div><p class="mt-3 text-sm leading-6 text-muted-fg">{{ selectedTemplate.description }}</p></div></div>
					</div>
				</aside>
			</div>

			<DomDialog v-model="saveDialogOpen" title="Save request template" description="Store a reusable server-proxied request for this workspace.">
				<div class="grid gap-4"><DomTextInput v-model="saveDraft.name" label="Template name" :errors="fieldErrors.name || []" /><DomTextareaInput v-model="saveDraft.description" label="When to use this request" :rows="3" :errors="fieldErrors.description || []" /><div class="grid gap-4 sm:grid-cols-2"><DomSelect v-model="saveDraft.collectionId" label="Collection" :options="bootstrap.options.collections" :errors="fieldErrors.collectionId || []" width="min-w-[16rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="saveDraft.visibility" label="Visibility" :options="bootstrap.options.visibility" :errors="fieldErrors.visibility || []" width="min-w-[16rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div></div>
				<template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :loading="busy" @click="createTemplate">Save template</DomButton></template>
			</DomDialog>

			<DomDialog v-model="productionDialogOpen" title="Confirm production write" description="This request targets live customer data. The server records the operator, exact request snapshot, response, and environment.">
				<DomAlert tone="warning" variant="soft" title="Live request" :description="`${draft.method} ${resolvedUrl}`" />
				<div class="mt-4"><DomCheckbox v-model="productionAcknowledged" label="I reviewed the live method, path, payload, and granted scopes" description="This acknowledgement is required by the server before dispatch." :errors="fieldErrors.productionAcknowledged || []" /></div>
				<template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton variant="danger" :disabled="!productionAcknowledged" :loading="busy" @click="sendRequest">Send to production</DomButton></template>
			</DomDialog>

			<DomDialog v-model="resetDialogOpen" title="Reset the API console?" description="This clears process-local templates and runs, then restores the seeded developer workspace.">
				<template #footer><DomButton variant="secondary" data-close>Keep workspace</DomButton><DomButton variant="danger" :loading="busy" @click="resetWorkspace">Reset demo</DomButton></template>
			</DomDialog>
		</div>

		<div v-else class="grid h-full place-items-center p-6"><DomAlert tone="danger" title="API console unavailable" :description="errorMessage || 'The block API did not return a workspace.'"><template #actions><DomButton variant="secondary" @click="loadWorkspace">Try again</DomButton></template></DomAlert></div>
	</div>
</template>
