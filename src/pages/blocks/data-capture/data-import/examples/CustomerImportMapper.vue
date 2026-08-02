<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomEmptyState,
	DomProgress,
	DomRadioGroup,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextInput,
	DomToggleButtonGroup,
} from '@getdom/studio/vue';

const workspaceTabs = [
	{ key: 'mapping', label: 'Map fields' },
	{ key: 'review', label: 'Review rows' },
];

const mobileViewOptions = [
	{ value: 'map', label: 'Map' },
	{ value: 'review', label: 'Review' },
	{ value: 'run', label: 'Run' },
];

const loading = ref(true);
const busy = ref(false);
const bootstrap = ref(null);
const session = ref(null);
const activeTab = ref('mapping');
const mobileView = ref('map');
const selectedPreset = ref('hubspot_customer');
const mappingForm = ref({});
const settingsForm = ref({ batchName: '', importMode: 'valid_only', duplicatePolicy: 'merge_newer' });
const fieldErrors = ref({});
const errorMessage = ref('');
const successMessage = ref('');
const reportReceipt = ref(null);
const jobDialogOpen = ref(false);
const resetDialogOpen = ref(false);
const acknowledged = ref(false);

const canCreateJob = computed(getCanCreateJob);
const jobProgress = computed(getJobProgress);
const stages = computed(getStages);

watch(mobileView, syncWorkspaceForMobile);

/**
 * Keeps the tab workspace aligned with the compact mobile view switcher.
 *
 * @param {string} value Selected mobile workspace view.
 * @returns {void}
 */
function syncWorkspaceForMobile(value) {
	if (value === 'map') activeTab.value = 'mapping';
	if (value === 'review') activeTab.value = 'review';
}

/**
 * Resolves whether the current revision has passing server validation.
 *
 * @returns {boolean} Whether an import job can be created.
 */
function getCanCreateJob() {
	return Boolean(
		session.value?.readiness?.ready
		&& session.value?.lastValidation?.status === 'passed'
		&& session.value?.lastValidation?.sessionRevision === session.value?.revision
		&& !session.value?.job
		&& !busy.value,
	);
}

/**
 * Calculates background job completion as a percentage.
 *
 * @returns {number} Job completion from zero to one hundred.
 */
function getJobProgress() {
	if (!session.value?.job) return 0;
	return Math.round((session.value.job.processed / Math.max(1, session.value.job.total)) * 100);
}

/**
 * Builds the persistent import-stage rail from authoritative session state.
 *
 * @returns {Array<Record<string, unknown>>} Ordered import stages.
 */
function getStages() {
	if (!session.value) return [];
	const validationCurrent = session.value.lastValidation?.sessionRevision === session.value.revision;
	const job = session.value.job;
	return [
		{ id: 'upload', label: 'Upload', detail: `${session.value.file.rowCount.toLocaleString()} rows parsed`, status: 'complete' },
		{ id: 'mapping', label: 'Map fields', detail: `${session.value.mappingSummary.mappedCount}/${session.value.mappingSummary.totalCount} mapped`, status: session.value.mappingSummary.requiredMappedCount === session.value.mappingSummary.requiredCount ? 'complete' : 'attention' },
		{ id: 'validate', label: 'Validate', detail: validationCurrent ? `${session.value.readiness.passedCount}/${session.value.readiness.checks.length} checks passed` : 'Run for current revision', status: validationCurrent && session.value.lastValidation?.status === 'passed' ? 'complete' : 'attention' },
		{ id: 'import', label: 'Import', detail: job ? `${job.processed.toLocaleString()}/${job.total.toLocaleString()} processed` : 'Ready after validation', status: job?.status === 'completed' ? 'complete' : job ? 'active' : 'pending' },
	];
}

/**
 * Loads reusable import choices and the resumable server session.
 *
 * @returns {Promise<void>}
 */
async function loadBootstrap() {
	loading.value = true;
	clearFeedback();
	try {
		const payload = await requestJson('/api/block-demos/data-import/bootstrap');
		bootstrap.value = payload;
		applySession(payload.session);
	} catch (error) {
		errorMessage.value = error.message || 'The import workspace could not be loaded.';
	} finally {
		loading.value = false;
	}
}

/**
 * Applies server state and synchronizes local editable form values.
 *
 * @param {Record<string, unknown>} nextSession Updated import session.
 * @returns {void}
 */
function applySession(nextSession) {
	session.value = nextSession;
	mappingForm.value = { ...nextSession.mapping };
	settingsForm.value = { ...nextSession.settings };
	selectedPreset.value = nextSession.preset || 'blank';
	if (nextSession.job) mobileView.value = 'run';
}

/**
 * Applies a known mapping preset to the editable draft without saving it.
 *
 * @param {string} presetId Mapping preset identifier.
 * @returns {void}
 */
function applyPreset(presetId) {
	selectedPreset.value = presetId;
	if (presetId === 'minimal_accounts') {
		mappingForm.value = { companyName: 'company', email: 'primary_email', stage: 'skip', plan: 'skip', seats: 'skip', renewalDate: 'skip', owner: 'skip' };
	} else if (presetId === 'blank') {
		mappingForm.value = Object.fromEntries(bootstrap.value.options.targetFields.map((field) => [field.key, 'skip']));
	} else {
		mappingForm.value = { companyName: 'company', email: 'primary_email', stage: 'lifecycle_stage', plan: 'plan', seats: 'seats', renewalDate: 'renewal_date', owner: 'owner' };
	}
	successMessage.value = 'Preset applied to this draft. Save mappings to refresh server checks.';
	errorMessage.value = '';
}

/**
 * Saves the complete mapping through the revisioned API.
 *
 * @returns {Promise<void>}
 */
async function saveMapping() {
	if (!session.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/data-import/sessions/${session.value.id}/mapping`, {
			method: 'PATCH',
			body: { revision: session.value.revision, preset: selectedPreset.value, mapping: mappingForm.value },
		});
		applySession(payload.session);
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'The field mapping could not be saved.');
	} finally {
		busy.value = false;
	}
}

/**
 * Saves batch name, duplicate behavior, and blocked-row policy.
 *
 * @returns {Promise<void>}
 */
async function saveSettings() {
	if (!session.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/data-import/sessions/${session.value.id}/settings`, {
			method: 'PATCH',
			body: { revision: session.value.revision, ...settingsForm.value },
		});
		applySession(payload.session);
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'The import behavior could not be saved.');
	} finally {
		busy.value = false;
	}
}

/**
 * Runs server-owned readiness checks for the current revision.
 *
 * @returns {Promise<void>}
 */
async function validateImport() {
	if (!session.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/data-import/sessions/${session.value.id}/validate`, {
			method: 'POST',
			body: { revision: session.value.revision },
		});
		applySession(payload.session);
		mobileView.value = 'run';
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'Import checks could not run.');
	} finally {
		busy.value = false;
	}
}

/**
 * Generates and downloads a checksum-backed blocked-row report.
 *
 * @returns {Promise<void>}
 */
async function createErrorReport() {
	if (!session.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/data-import/sessions/${session.value.id}/error-report`, {
			method: 'POST',
			body: { revision: session.value.revision },
		});
		reportReceipt.value = payload.report;
		downloadText(payload.report.filename, payload.report.content, 'text/csv');
		successMessage.value = `${payload.message} ${payload.report.id}.`;
	} catch (error) {
		applyRequestError(error, 'The blocked-row report could not be generated.');
	} finally {
		busy.value = false;
	}
}

/**
 * Opens the final import-job acknowledgement dialog.
 *
 * @returns {void}
 */
function openJobDialog() {
	acknowledged.value = false;
	jobDialogOpen.value = true;
}

/**
 * Creates a validated background import job.
 *
 * @returns {Promise<void>}
 */
async function createJob() {
	if (!session.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/data-import/sessions/${session.value.id}/jobs`, {
			method: 'POST',
			body: { revision: session.value.revision, acknowledged: acknowledged.value },
		});
		applySession(payload.session);
		jobDialogOpen.value = false;
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'The import job could not be created.');
	} finally {
		busy.value = false;
	}
}

/**
 * Processes one worker batch for the active import job.
 *
 * @returns {Promise<void>}
 */
async function processJob() {
	if (!session.value?.job || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/data-import/sessions/${session.value.id}/jobs/${session.value.job.id}/process`, {
			method: 'POST',
			body: { jobRevision: session.value.job.revision },
		});
		applySession(payload.session);
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'The worker batch could not be processed.');
	} finally {
		busy.value = false;
	}
}

/**
 * Resets the demonstration session after explicit confirmation.
 *
 * @returns {Promise<void>}
 */
async function resetSession() {
	if (!session.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/data-import/sessions/${session.value.id}/reset`, { method: 'POST' });
		applySession(payload.session);
		activeTab.value = 'mapping';
		mobileView.value = 'map';
		reportReceipt.value = null;
		resetDialogOpen.value = false;
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'The import session could not be reset.');
	} finally {
		busy.value = false;
	}
}

/**
 * Promotes a structured API error into visible recovery guidance.
 *
 * @param {Error & { fields?: Array<Record<string, string>>, payload?: Record<string, unknown> }} error Request error.
 * @param {string} fallback Fallback guidance.
 * @returns {void}
 */
function applyRequestError(error, fallback) {
	errorMessage.value = error.message || fallback;
	fieldErrors.value = Object.fromEntries((error.fields || []).map((field) => [field.field, [field.message]]));
	if (error.payload?.session) applySession(error.payload.session);
}

/**
 * Clears transient alerts and field-level errors.
 *
 * @returns {void}
 */
function clearFeedback() {
	errorMessage.value = '';
	successMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Returns a semantic status tone for workflow state.
 *
 * @param {string} status Workflow status.
 * @returns {string} DOM Studio status tone.
 */
function statusTone(status) {
	return {
		complete: 'success',
		active: 'info',
		attention: 'warning',
		pending: 'neutral',
		ready: 'success',
		warning: 'warning',
		blocked: 'danger',
		info: 'info',
		queued: 'neutral',
		running: 'info',
		completed: 'success',
	}[status] || 'neutral';
}

/**
 * Formats a byte count for file metadata.
 *
 * @param {number} value Byte count.
 * @returns {string} Compact file-size label.
 */
function formatBytes(value) {
	if (!Number.isFinite(value)) return '—';
	return `${(value / 1024).toFixed(1)} KB`;
}

/**
 * Formats an ISO timestamp as a concise local date and time.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Localized date and time.
 */
function formatDateTime(value) {
	if (!value) return 'Not yet';
	return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

/**
 * Downloads generated text with a user-visible filename.
 *
 * @param {string} filename Download filename.
 * @param {string} content Download content.
 * @param {string} mimeType MIME type.
 * @returns {void}
 */
function downloadText(filename, content, mimeType) {
	const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

/**
 * Sends JSON to the demo API and converts structured errors into exceptions.
 *
 * @param {string} url API route.
 * @param {{ method?: string, body?: Record<string, unknown> }} options Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed response payload.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		method: options.method || 'GET',
		headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const payload = await response.json();
	if (!response.ok || payload.error) {
		const error = new Error(payload.error?.message || `Request failed with ${response.status}.`);
		error.fields = payload.error?.fields || [];
		error.payload = payload.error || payload;
		throw error;
	}
	return payload;
}

onMounted(loadBootstrap);
</script>

<template>
	<div class="h-dvh min-h-[40rem] overflow-hidden bg-canvas text-canvas-fg">
		<div v-if="loading" class="flex h-full flex-col">
			<div class="h-16 border-b border-border p-4"><DomSkeleton variant="text" :lines="1" width="22rem" /></div>
			<div class="grid min-h-0 flex-1 lg:grid-cols-[13rem_minmax(0,1fr)_21rem]">
				<div class="hidden border-r border-border p-4 lg:block"><DomSkeleton variant="text" :lines="6" /></div>
				<div class="p-5"><DomSkeleton variant="text" :lines="10" /></div>
				<div class="hidden border-l border-border p-4 lg:block"><DomSkeleton variant="text" :lines="8" /></div>
			</div>
		</div>

		<div v-else-if="session && bootstrap" class="flex h-full min-h-0 flex-col">
			<header class="shrink-0 border-b border-border bg-canvas">
				<div class="flex min-h-16 items-center gap-3 px-3 py-2 sm:px-4">
					<div class="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg">CSV</div>
					<div class="min-w-0 flex-1">
						<div class="flex min-w-0 items-center gap-2">
							<h1 class="truncate text-sm font-semibold">{{ session.file.name }}</h1>
							<span class="hidden sm:inline-flex"><DomStatusPill tone="success" size="sm">Parsed</DomStatusPill></span>
						</div>
						<p class="truncate text-xs text-muted-fg">{{ session.file.rowCount.toLocaleString() }} rows · {{ session.file.columnCount }} columns · Revision {{ session.revision }}</p>
					</div>
					<div class="hidden items-center gap-2 sm:flex">
						<DomButton size="sm" variant="secondary" :loading="busy" @click="createErrorReport">Error report</DomButton>
						<DomButton size="sm" variant="secondary" :loading="busy" @click="validateImport">Run checks</DomButton>
						<DomButton size="sm" :disabled="!canCreateJob" @click="openJobDialog">Create job</DomButton>
					</div>
					<div class="shrink-0 sm:hidden"><DomButton size="sm" variant="secondary" :loading="busy" @click="validateImport">Checks</DomButton></div>
				</div>
				<div class="border-t border-border px-3 py-2 lg:hidden">
					<DomToggleButtonGroup v-model="mobileView" label="Import workspace view" :options="mobileViewOptions" size="sm" chrome="none" />
				</div>
			</header>

			<div v-if="errorMessage || successMessage" class="shrink-0 border-b border-border px-3 py-2 sm:px-4">
				<DomAlert v-if="errorMessage" tone="danger" variant="soft" title="Check the import" :description="errorMessage" dismissible @dismiss="errorMessage = ''" />
				<DomAlert v-else tone="success" variant="soft" title="Saved" :description="successMessage" dismissible @dismiss="successMessage = ''" />
			</div>

			<div class="min-h-0 flex-1 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)_21rem]">
				<aside class="hidden min-h-0 flex-col border-r border-border bg-secondary/15 lg:flex">
					<div class="border-b border-border px-4 py-4">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Customer import</p>
						<p class="mt-1 text-sm font-semibold">August migration</p>
					</div>
					<nav class="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Import stages">
						<div v-for="(stage, index) in stages" :key="stage.id" class="relative flex gap-3 pb-6 last:pb-0">
							<span v-if="index < stages.length - 1" class="absolute left-3.5 top-8 h-[calc(100%-1.25rem)] w-px bg-border"></span>
							<span class="relative z-10 grid size-7 shrink-0 place-items-center rounded-full border border-border bg-canvas text-xs font-semibold">{{ index + 1 }}</span>
							<div class="min-w-0 pt-0.5">
								<div class="flex items-center gap-2"><p class="text-sm font-semibold">{{ stage.label }}</p><span class="size-2 rounded-full" :class="stage.status === 'complete' ? 'bg-success' : stage.status === 'active' ? 'bg-primary' : stage.status === 'attention' ? 'bg-warning' : 'bg-muted-fg/35'"></span></div>
								<p class="mt-1 text-xs leading-5 text-muted-fg">{{ stage.detail }}</p>
							</div>
						</div>
					</nav>
					<div class="border-t border-border p-3"><DomButton class="w-full" size="sm" variant="ghost" @click="resetDialogOpen = true">Start over</DomButton></div>
				</aside>

				<main
					class="min-h-0 min-w-0 flex-col"
					:class="mobileView === 'run' ? 'hidden lg:flex' : 'flex h-full'"
				>
					<DomTabs v-model="activeTab" class="[&_[role=tablist]]:hidden lg:[&_[role=tablist]]:flex" :tabs="workspaceTabs" variant="page" fill>
						<template #mapping>
							<div class="min-h-0 flex-1 overflow-y-auto">
								<div class="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
									<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Field mapping</p><h2 class="mt-1 text-lg font-semibold">Match customer fields</h2><p class="mt-1 text-sm text-muted-fg">Each parsed column can feed one customer field.</p></div>
									<div class="flex min-w-0 items-end gap-2">
										<div class="min-w-0 flex-1 sm:w-64"><DomSelect v-model="selectedPreset" label="Mapping preset" :options="bootstrap.options.presets" width="min-w-[18rem]" @update:model-value="applyPreset" /></div>
										<div class="shrink-0 pb-0.5"><DomButton size="sm" :loading="busy" @click="saveMapping">Save mapping</DomButton></div>
									</div>
								</div>

								<div class="divide-y divide-border">
									<div v-for="field in bootstrap.options.targetFields" :key="field.key" class="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_18rem] md:items-center">
										<div class="min-w-0">
											<div class="flex flex-wrap items-center gap-2">
												<p class="text-sm font-semibold">{{ field.label }}</p>
												<DomBadge v-if="field.required" tone="primary" variant="soft">Required</DomBadge>
												<DomBadge tone="neutral" variant="outline">{{ field.type }}</DomBadge>
											</div>
											<p class="mt-1 text-xs leading-5 text-muted-fg">{{ field.description }}</p>
										</div>
										<DomSelect v-model="mappingForm[field.key]" :label="`Source column for ${field.label}`" :options="bootstrap.options.sourceColumns" :errors="fieldErrors[field.key] || []" width="min-w-[19rem]">
											<template #value="{ option, label }"><div class="flex min-w-0 items-center justify-between gap-2"><span class="truncate">{{ label }}</span><span v-if="option?.detectedType && option.value !== 'skip'" class="text-xs text-muted-fg">{{ option.detectedType }}</span></div></template>
											<template #option="{ option }"><div class="min-w-0"><div class="flex items-center justify-between gap-3"><p class="font-medium">{{ option.label }}</p><span v-if="option.value !== 'skip'" class="text-xs opacity-70">{{ option.detectedType }}</span></div><p class="mt-0.5 truncate text-xs opacity-70">{{ option.sample }}</p></div></template>
										</DomSelect>
									</div>
								</div>
							</div>
						</template>

						<template #review>
							<div class="min-h-0 flex-1 overflow-y-auto">
								<div class="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
									<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Row review</p><h2 class="mt-1 text-lg font-semibold">Sample of parsed records</h2><p class="mt-1 text-sm text-muted-fg">Server normalization and merge decisions are shown before a job exists.</p></div>
									<DomStatusPill :tone="session.analysis.blockedRows ? 'warning' : 'success'" size="sm">{{ session.analysis.blockedRows }} blocked</DomStatusPill>
								</div>

								<div class="hidden min-w-[48rem] grid-cols-[1.2fr_1.45fr_0.8fr_0.7fr_0.6fr_7rem] gap-3 border-b border-border bg-secondary/30 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg sm:grid">
									<span>Company</span><span>Email</span><span>Stage</span><span>Plan</span><span>Seats</span><span>Status</span>
								</div>
								<div class="hidden min-w-[48rem] divide-y divide-border sm:block">
									<div v-for="row in session.previewRows" :key="row.id" class="grid grid-cols-[1.2fr_1.45fr_0.8fr_0.7fr_0.6fr_7rem] gap-3 px-4 py-3 text-sm">
										<div class="min-w-0"><p class="truncate font-medium">{{ row.company }}</p><p class="mt-0.5 truncate text-xs text-muted-fg">{{ row.note }}</p></div>
										<span class="truncate text-muted-fg">{{ row.email || 'Missing' }}</span><span class="text-muted-fg">{{ row.stage }}</span><span class="text-muted-fg">{{ row.plan }}</span><span class="text-muted-fg">{{ row.seats }}</span><DomStatusPill :tone="statusTone(row.status)" size="sm">{{ row.status }}</DomStatusPill>
									</div>
								</div>

								<div class="divide-y divide-border sm:hidden">
									<div v-for="row in session.previewRows" :key="row.id" class="px-4 py-4">
										<div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="truncate text-sm font-semibold">{{ row.company }}</p><p class="mt-1 truncate text-xs text-muted-fg">{{ row.email || 'Missing email' }}</p></div><DomStatusPill :tone="statusTone(row.status)" size="sm">{{ row.status }}</DomStatusPill></div>
										<div class="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-fg"><span>{{ row.stage }}</span><span>{{ row.plan }}</span><span>{{ row.seats }} seats</span></div>
										<p class="mt-2 text-xs leading-5 text-muted-fg">{{ row.note }}</p>
									</div>
								</div>

								<DomEmptyState v-if="!session.previewRows.length" title="No rows to review" description="Return to mapping and choose a parsed source column." />
							</div>
						</template>
					</DomTabs>
				</main>

				<aside
					class="min-h-0 flex-col border-l border-border bg-canvas"
					:class="mobileView === 'run' ? 'flex h-full' : 'hidden lg:flex'"
				>
					<div class="min-h-0 flex-1 overflow-y-auto p-4">
						<div class="flex items-start justify-between gap-3">
							<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Import readiness</p><h2 class="mt-1 text-sm font-semibold">{{ session.readiness.passedCount }} of {{ session.readiness.checks.length }} checks pass</h2></div>
							<DomStatusPill :tone="session.readiness.ready ? 'success' : 'warning'" size="sm">{{ session.readiness.ready ? 'Ready' : 'Review' }}</DomStatusPill>
						</div>
						<DomProgress class="mt-3" :value="Math.round((session.readiness.passedCount / session.readiness.checks.length) * 100)" label="Import readiness" :show-label="false" size="sm" />

						<div class="mt-4 grid grid-cols-3 divide-x divide-border border-y border-border py-3 text-center">
							<div><p class="text-lg font-semibold">{{ session.analysis.validRows.toLocaleString() }}</p><p class="text-[11px] text-muted-fg">Valid</p></div>
							<div><p class="text-lg font-semibold">{{ session.analysis.warningRows }}</p><p class="text-[11px] text-muted-fg">Warnings</p></div>
							<div><p class="text-lg font-semibold">{{ session.analysis.blockedRows }}</p><p class="text-[11px] text-muted-fg">Blocked</p></div>
						</div>

						<div v-if="!session.job" class="mt-5">
							<DomTextInput v-model="settingsForm.batchName" label="Batch name" :errors="fieldErrors.batchName || []" />
							<DomRadioGroup v-model="settingsForm.importMode" class="mt-4" label="Blocked-row behavior" :options="bootstrap.options.importModes" :errors="fieldErrors.importMode || []" />
							<div class="mt-4"><DomSelect v-model="settingsForm.duplicatePolicy" label="Existing customers" :options="bootstrap.options.duplicatePolicies" :errors="fieldErrors.duplicatePolicy || []" width="min-w-[19rem]">
								<template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template>
							</DomSelect></div>
							<div class="mt-4"><DomButton class="w-full" variant="secondary" :loading="busy" @click="saveSettings">Save behavior</DomButton></div>

							<div class="mt-5 divide-y divide-border border-y border-border">
								<div v-for="issue in session.analysis.issues" :key="issue.id" class="flex items-start gap-3 py-3">
									<span class="mt-1.5 size-2 shrink-0 rounded-full" :class="issue.status === 'blocked' ? 'bg-destructive' : issue.status === 'warning' ? 'bg-warning' : 'bg-primary'"></span>
									<div class="min-w-0 flex-1"><div class="flex items-start justify-between gap-3"><p class="text-sm font-medium">{{ issue.title }}</p><DomBadge :tone="statusTone(issue.status)" variant="soft">{{ issue.count }}</DomBadge></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ issue.detail }}</p></div>
								</div>
							</div>

							<div class="mt-5 grid gap-2">
								<DomButton variant="secondary" :loading="busy" @click="validateImport">Run server checks</DomButton>
								<DomButton variant="secondary" :loading="busy" @click="createErrorReport">Download blocked rows</DomButton>
								<DomButton :disabled="!canCreateJob" @click="openJobDialog">Create import job</DomButton>
							</div>
						</div>

						<div v-else class="mt-5">
							<div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ session.job.reference }}</p><p class="mt-1 text-lg font-semibold">Background import</p></div><DomStatusPill :tone="statusTone(session.job.status)">{{ session.job.status }}</DomStatusPill></div>
							<div class="mt-4"><div class="flex justify-between text-xs text-muted-fg"><span>{{ session.job.processed.toLocaleString() }} processed</span><span>{{ jobProgress }}%</span></div><DomProgress class="mt-2" :value="jobProgress" label="Import job progress" :show-label="false" /></div>
							<div class="mt-4 grid grid-cols-2 divide-x divide-border border-y border-border py-3 text-center"><div><p class="text-xl font-semibold">{{ session.job.created.toLocaleString() }}</p><p class="text-xs text-muted-fg">Created</p></div><div><p class="text-xl font-semibold">{{ session.job.updated.toLocaleString() }}</p><p class="text-xs text-muted-fg">Updated</p></div></div>
							<DomButton v-if="session.job.status !== 'completed'" class="mt-4 w-full" :loading="busy" @click="processJob">Process next batch</DomButton>
							<div v-else class="mt-4 border-y border-success/30 bg-success/5 py-4"><DomStatusPill tone="success">Complete</DomStatusPill><p class="mt-3 text-sm font-semibold">Import proof</p><code class="mt-2 block break-all text-[11px] leading-5 text-muted-fg">{{ session.job.proof }}</code></div>
							<div class="mt-5 divide-y divide-border border-y border-border"><div v-for="event in session.job.activity" :key="event.id" class="py-3"><p class="text-sm font-medium">{{ event.label }}</p><p class="mt-1 text-xs text-muted-fg">{{ event.detail }} · {{ formatDateTime(event.createdAt) }}</p></div></div>
						</div>

						<div v-if="reportReceipt" class="mt-5 border-t border-border pt-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Latest report</p><p class="mt-2 text-sm font-medium">{{ reportReceipt.filename }}</p><p class="mt-1 text-xs text-muted-fg">{{ reportReceipt.rowCount }} rows · {{ reportReceipt.id }}</p><code class="mt-2 block break-all text-[10px] leading-5 text-muted-fg">{{ reportReceipt.checksum }}</code></div>
					</div>
					<div class="border-t border-border p-3 lg:hidden"><DomButton class="w-full" variant="ghost" @click="resetDialogOpen = true">Start over</DomButton></div>
				</aside>
			</div>
		</div>

		<div v-else class="grid h-full place-items-center p-6">
			<DomAlert tone="danger" title="Import unavailable" :description="errorMessage || 'The import session could not be loaded.'">
				<template #actions><DomButton variant="secondary" @click="loadBootstrap">Try again</DomButton></template>
			</DomAlert>
		</div>

		<DomDialog v-model="jobDialogOpen" title="Create customer import job" description="Confirm the server-calculated scope before queuing background writes.">
			<div v-if="session" class="space-y-4">
				<div class="grid grid-cols-3 divide-x divide-border border-y border-border py-3 text-center"><div><p class="text-lg font-semibold">{{ session.analysis.validRows.toLocaleString() }}</p><p class="text-xs text-muted-fg">Will import</p></div><div><p class="text-lg font-semibold">{{ session.analysis.existingRows }}</p><p class="text-xs text-muted-fg">Existing</p></div><div><p class="text-lg font-semibold">{{ session.analysis.blockedRows }}</p><p class="text-xs text-muted-fg">Skipped</p></div></div>
				<div class="divide-y divide-border border-y border-border"><div v-for="check in session.readiness.checks" :key="check.id" class="flex items-start gap-3 py-3"><span class="mt-1.5 size-2 rounded-full" :class="check.status === 'passed' ? 'bg-success' : 'bg-warning'"></span><div><p class="text-sm font-medium">{{ check.label }}</p><p class="mt-1 text-xs text-muted-fg">{{ check.detail }}</p></div></div></div>
				<DomCheckbox v-model="acknowledged" label="I confirm this import scope" description="The job can create and update customer records using the selected duplicate policy." />
			</div>
			<template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :disabled="!acknowledged" :loading="busy" @click="createJob">Queue import job</DomButton></template>
		</DomDialog>

		<DomDialog v-model="resetDialogOpen" title="Start this import over?" description="This resets mappings, validation, job progress, and generated receipts to the parsed sample file.">
			<template #footer><DomButton variant="secondary" data-close>Keep import</DomButton><DomButton variant="danger" :loading="busy" @click="resetSession">Reset import</DomButton></template>
		</DomDialog>
	</div>
</template>
