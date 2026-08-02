<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDatePicker,
	DomDialog,
	DomDrawer,
	DomEmailInput,
	DomEmptyState,
	DomForm,
	DomProgress,
	DomRadioGroup,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTagCombobox,
	DomTextInput,
	DomTextareaInput,
	DomToggle,
	DomToggleButtonGroup,
} from '@getdom/studio/vue';
import FormResponseDetail from '../components/FormResponseDetail.vue';

const loading = ref(true);
const busy = ref(false);
const bootstrap = ref(null);
const form = ref(null);
const responses = ref([]);
const activeView = ref('compose');
const formDraft = ref(createEmptyFormDraft());
const submissionDraft = ref(createEmptySubmission());
const submissionConfirmation = ref(null);
const selectedResponseId = ref('');
const responseFilter = ref('all');
const responseDraft = ref(createEmptyResponseDraft());
const formErrors = ref({});
const submissionErrors = ref({});
const responseErrors = ref({});
const errorMessage = ref('');
const successMessage = ref('');
const publishDialogOpen = ref(false);
const publishAcknowledged = ref(false);
const resetDialogOpen = ref(false);
const responseDrawerOpen = ref(false);

const viewOptions = computed(getViewOptions);
const readinessProgress = computed(getReadinessProgress);
const canPublish = computed(getCanPublish);
const filteredResponses = computed(getFilteredResponses);
const currentResponse = computed(getCurrentResponse);
const responseStats = computed(getResponseStats);

/**
 * Returns compact workspace navigation with a live response count.
 *
 * @returns {Array<Record<string, string>>} Workspace view options.
 */
function getViewOptions() {
	return [
		{ value: 'compose', label: 'Compose' },
		{ value: 'live', label: 'Live form' },
		{ value: 'responses', label: `Responses ${responses.value.length}` },
	];
}

/**
 * Calculates publication readiness as a percentage.
 *
 * @returns {number} Readiness from zero to one hundred.
 */
function getReadinessProgress() {
	if (!form.value?.readiness?.checks?.length) return 0;
	return Math.round((form.value.readiness.passedCount / form.value.readiness.checks.length) * 100);
}

/**
 * Resolves whether exact-revision publication proof is available.
 *
 * @returns {boolean} Whether publication can proceed.
 */
function getCanPublish() {
	return Boolean(
		form.value
		&& form.value.status !== 'published'
		&& form.value.lastValidation?.status === 'passed'
		&& form.value.lastValidation?.formRevision === form.value.revision
		&& !busy.value,
	);
}

/**
 * Filters the response inbox using the current status choice.
 *
 * @returns {Array<Record<string, unknown>>} Visible response records.
 */
function getFilteredResponses() {
	if (responseFilter.value === 'all') return responses.value;
	return responses.value.filter((response) => response.status === responseFilter.value);
}

/**
 * Resolves the response currently open in the inspector.
 *
 * @returns {Record<string, unknown>|null} Selected response.
 */
function getCurrentResponse() {
	return responses.value.find((response) => response.id === selectedResponseId.value) || filteredResponses.value[0] || null;
}

/**
 * Summarizes response triage state for the inbox header.
 *
 * @returns {Record<string, number>} Counts by response status.
 */
function getResponseStats() {
	return {
		new: responses.value.filter((response) => response.status === 'new').length,
		qualified: responses.value.filter((response) => response.status === 'qualified').length,
		total: responses.value.length,
	};
}

/**
 * Creates a blank editable form settings draft.
 *
 * @returns {Record<string, unknown>} Empty settings draft.
 */
function createEmptyFormDraft() {
	return {
		title: '',
		description: '',
		audience: '',
		owner: '',
		closeDate: '',
		confirmationMessage: '',
		allowDrafts: false,
		spamPolicy: 'standard',
	};
}

/**
 * Creates a blank public response draft.
 *
 * @returns {Record<string, unknown>} Empty response values.
 */
function createEmptySubmission() {
	return {
		name: '',
		email: '',
		companySize: '',
		useCases: [],
		contactPreference: 'email',
		details: '',
		consent: false,
	};
}

/**
 * Creates a blank response-triage draft.
 *
 * @returns {Record<string, string>} Empty triage values.
 */
function createEmptyResponseDraft() {
	return { status: 'new', assignee: 'unassigned', note: '' };
}

/**
 * Loads the process-local form workspace and response inbox.
 *
 * @returns {Promise<void>}
 */
async function loadWorkspace() {
	loading.value = true;
	clearFeedback();
	try {
		const payload = await requestJson('/api/block-demos/form-operations/bootstrap');
		bootstrap.value = payload;
		applyForm(payload.form);
		applyResponses(payload.responses);
	} catch (error) {
		errorMessage.value = error.message || 'The form workspace could not be loaded.';
	} finally {
		loading.value = false;
	}
}

/**
 * Applies authoritative form state and refreshes editable settings.
 *
 * @param {Record<string, unknown>} nextForm Updated form payload.
 * @returns {void}
 */
function applyForm(nextForm) {
	form.value = nextForm;
	formDraft.value = {
		title: nextForm.title,
		description: nextForm.description,
		audience: nextForm.audience,
		owner: nextForm.owner,
		closeDate: nextForm.closeDate,
		confirmationMessage: nextForm.confirmationMessage,
		allowDrafts: nextForm.allowDrafts,
		spamPolicy: nextForm.spamPolicy,
	};
}

/**
 * Applies the response inbox while preserving a valid selected record.
 *
 * @param {Array<Record<string, unknown>>} nextResponses Updated responses.
 * @returns {void}
 */
function applyResponses(nextResponses) {
	responses.value = nextResponses || [];
	if (!responses.value.some((response) => response.id === selectedResponseId.value)) {
		selectedResponseId.value = responses.value[0]?.id || '';
	}
	syncResponseDraft();
}

/**
 * Saves editable form settings through the optimistic API.
 *
 * @returns {Promise<void>}
 */
async function saveForm() {
	if (!form.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/form-operations/forms/${form.value.id}`, {
			method: 'PATCH',
			body: { revision: form.value.revision, ...formDraft.value },
		});
		applyForm(payload.form);
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'The form settings could not be saved.', 'form');
	} finally {
		busy.value = false;
	}
}

/**
 * Runs server-owned publication checks for the current revision.
 *
 * @returns {Promise<void>}
 */
async function validateForm() {
	if (!form.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/form-operations/forms/${form.value.id}/validate`, {
			method: 'POST',
			body: { revision: form.value.revision },
		});
		applyForm(payload.form);
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'Publication checks could not run.', 'form');
	} finally {
		busy.value = false;
	}
}

/**
 * Opens the publication acknowledgement dialog with a clean consent state.
 *
 * @returns {void}
 */
function openPublishDialog() {
	publishAcknowledged.value = false;
	publishDialogOpen.value = true;
}

/**
 * Publishes the exact validated form revision.
 *
 * @returns {Promise<void>}
 */
async function publishForm() {
	if (!form.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/form-operations/forms/${form.value.id}/publish`, {
			method: 'POST',
			body: { revision: form.value.revision, acknowledged: publishAcknowledged.value },
		});
		applyForm(payload.form);
		publishDialogOpen.value = false;
		activeView.value = 'live';
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'The form could not be published.', 'form');
	} finally {
		busy.value = false;
	}
}

/**
 * Submits the public form through the same endpoint a production embed would use.
 *
 * @param {{ values: Record<string, unknown> }} payload DOM Studio form submission payload.
 * @returns {Promise<void>}
 */
async function submitResponse(payload) {
	if (!form.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	submissionErrors.value = {};
	try {
		const result = await requestJson(`/api/block-demos/form-operations/forms/${form.value.id}/submissions`, {
			method: 'POST',
			body: { values: payload.values },
		});
		responses.value = [result.response, ...responses.value];
		submissionConfirmation.value = result.confirmation;
		selectedResponseId.value = result.response.id;
		successMessage.value = result.message;
	} catch (error) {
		applyRequestError(error, 'The response could not be submitted.', 'submission');
	} finally {
		busy.value = false;
	}
}

/**
 * Clears a successful public response for another test submission.
 *
 * @returns {void}
 */
function resetSubmission() {
	submissionDraft.value = createEmptySubmission();
	submissionConfirmation.value = null;
	submissionErrors.value = {};
	clearFeedback();
}

/**
 * Opens a response in the desktop inspector or mobile drawer.
 *
 * @param {Record<string, unknown>} response Selected response.
 * @returns {void}
 */
function selectResponse(response) {
	selectedResponseId.value = response.id;
	syncResponseDraft();
	responseErrors.value = {};
	if (window.matchMedia('(max-width: 1023px)').matches) responseDrawerOpen.value = true;
}

/**
 * Synchronizes editable triage fields from the current response.
 *
 * @returns {void}
 */
function syncResponseDraft() {
	const response = responses.value.find((item) => item.id === selectedResponseId.value);
	responseDraft.value = response
		? { status: response.status, assignee: response.assignee, note: response.note }
		: createEmptyResponseDraft();
}

/**
 * Saves status, assignee, and internal note for the selected response.
 *
 * @returns {Promise<void>}
 */
async function saveResponse() {
	if (!form.value || !currentResponse.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	responseErrors.value = {};
	try {
		const payload = await requestJson(`/api/block-demos/form-operations/forms/${form.value.id}/responses/${currentResponse.value.id}`, {
			method: 'PATCH',
			body: { revision: currentResponse.value.revision, ...responseDraft.value },
		});
		applyResponses(payload.responses);
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'Response triage could not be saved.', 'response');
	} finally {
		busy.value = false;
	}
}

/**
 * Shows the newest submitted response in the triage workspace.
 *
 * @returns {void}
 */
function openSubmittedResponse() {
	activeView.value = 'responses';
	responseFilter.value = 'all';
	syncResponseDraft();
}

/**
 * Resets form settings, publication state, and seeded responses.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	if (!form.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/form-operations/forms/${form.value.id}/reset`, { method: 'POST' });
		applyForm(payload.form);
		applyResponses(payload.responses);
		activeView.value = 'compose';
		responseFilter.value = 'all';
		resetSubmission();
		resetDialogOpen.value = false;
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'The form workspace could not be reset.', 'form');
	} finally {
		busy.value = false;
	}
}

/**
 * Promotes a structured API error into visible and field-level recovery state.
 *
 * @param {Error & { fields?: Array<Record<string, string>>, payload?: Record<string, unknown> }} error Request error.
 * @param {string} fallback Fallback guidance.
 * @param {'form'|'submission'|'response'} target Error destination.
 * @returns {void}
 */
function applyRequestError(error, fallback, target) {
	errorMessage.value = error.message || fallback;
	const errors = Object.fromEntries((error.fields || []).map((field) => [field.field, [field.message]]));
	if (target === 'submission') submissionErrors.value = errors;
	else if (target === 'response') responseErrors.value = errors;
	else formErrors.value = errors;
	if (error.payload?.form) applyForm(error.payload.form);
	if (error.payload?.responses) applyResponses(error.payload.responses);
	if (error.payload?.response) {
		const index = responses.value.findIndex((response) => response.id === error.payload.response.id);
		if (index >= 0) responses.value.splice(index, 1, error.payload.response);
		syncResponseDraft();
	}
}

/**
 * Clears transient alerts and all field-level errors.
 *
 * @returns {void}
 */
function clearFeedback() {
	errorMessage.value = '';
	successMessage.value = '';
	formErrors.value = {};
	submissionErrors.value = {};
	responseErrors.value = {};
}

/**
 * Formats an ISO date for public availability copy.
 *
 * @param {string} value ISO date.
 * @returns {string} Localized calendar date.
 */
function formatDate(value) {
	if (!value) return 'No closing date';
	return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}

/**
 * Formats a response timestamp as a concise relative label.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Relative time label.
 */
function formatRelative(value) {
	if (!value) return 'Unknown time';
	const minutes = Math.round((new Date(value).getTime() - Date.now()) / 60000);
	if (Math.abs(minutes) < 60) return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(minutes, 'minute');
	const hours = Math.round(minutes / 60);
	if (Math.abs(hours) < 24) return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(hours, 'hour');
	return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(Math.round(hours / 24), 'day');
}

/**
 * Resolves a semantic DOM Studio tone for a status value.
 *
 * @param {string} status Workflow status.
 * @returns {string} Semantic status tone.
 */
function statusTone(status) {
	return {
		draft: 'warning',
		published: 'success',
		new: 'info',
		reviewed: 'neutral',
		qualified: 'success',
		archived: 'warning',
	}[status] || 'neutral';
}

/**
 * Sends JSON requests and converts structured API errors into exceptions.
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

onMounted(loadWorkspace);
</script>

<template>
	<div class="h-dvh min-h-0 overflow-hidden bg-canvas text-canvas-fg">
		<div v-if="loading" class="flex h-full flex-col">
			<div class="h-16 border-b border-border p-4"><DomSkeleton variant="text" :lines="1" width="28rem" /></div>
			<div class="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_22rem]">
				<div class="p-6"><DomSkeleton variant="text" :lines="12" /></div>
				<div class="hidden border-l border-border p-5 lg:block"><DomSkeleton variant="text" :lines="9" /></div>
			</div>
		</div>

		<div v-else-if="form && bootstrap" class="flex h-full min-h-0 flex-col">
			<header class="shrink-0 border-b border-border bg-canvas">
				<div class="flex min-h-16 items-center gap-3 px-3 py-2 sm:px-4">
					<div class="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg">F</div>
					<div class="min-w-0 flex-1">
						<div class="flex min-w-0 items-center gap-2">
							<h1 class="truncate text-sm font-semibold">{{ form.title }}</h1>
							<DomStatusPill :tone="statusTone(form.status)" size="sm">{{ form.status }}</DomStatusPill>
						</div>
						<p class="truncate text-xs text-muted-fg">{{ bootstrap.workspace.area }} · Revision {{ form.revision }}</p>
					</div>
					<div class="hidden shrink-0 lg:block"><DomToggleButtonGroup v-model="activeView" label="Form workspace view" :options="viewOptions" size="sm" chrome="none" /></div>
					<div class="hidden items-center gap-2 sm:flex">
						<DomButton size="sm" variant="secondary" :loading="busy" @click="validateForm">Run checks</DomButton>
						<DomButton size="sm" :disabled="!canPublish" @click="openPublishDialog">{{ form.status === 'published' ? 'Published' : 'Publish' }}</DomButton>
					</div>
					<div class="sm:hidden"><DomButton size="sm" variant="secondary" :loading="busy" @click="validateForm">Checks</DomButton></div>
				</div>
				<div class="border-t border-border px-3 py-2 lg:hidden"><DomToggleButtonGroup v-model="activeView" label="Form workspace view" :options="viewOptions" size="sm" chrome="none" /></div>
			</header>

			<div v-if="errorMessage || successMessage" class="shrink-0 border-b border-border px-3 py-2 sm:px-4">
				<DomAlert v-if="errorMessage" tone="danger" variant="soft" title="Check the workspace" :description="errorMessage" dismissible @dismiss="errorMessage = ''" />
				<DomAlert v-else tone="success" variant="soft" title="Saved" :description="successMessage" dismissible @dismiss="successMessage = ''" />
			</div>

			<div class="min-h-0 flex-1">
				<div v-if="activeView === 'compose'" class="grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_22rem]">
					<main class="min-h-0 min-w-0 overflow-y-auto">
						<div class="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-7">
							<div class="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
								<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Compose</p><h2 class="mt-1 text-xl font-semibold">Form setup</h2><p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">Configure the public promise, routing, availability, and confirmation before publishing.</p></div>
								<div class="flex items-center gap-2"><DomStatusPill :tone="form.readiness.ready ? 'success' : 'warning'" size="sm">{{ form.readiness.passedCount }}/{{ form.readiness.checks.length }} ready</DomStatusPill><DomButton size="sm" :loading="busy" @click="saveForm">Save settings</DomButton></div>
							</div>

							<section class="border-b border-border py-6">
								<div class="mb-4"><h3 class="text-sm font-semibold">Public introduction</h3><p class="mt-1 text-xs leading-5 text-muted-fg">Set expectations before asking for respondent details.</p></div>
								<div class="grid gap-4">
									<DomTextInput v-model="formDraft.title" label="Form title" :errors="formErrors.title || []" />
									<DomTextareaInput v-model="formDraft.description" label="Description" :rows="3" :errors="formErrors.description || []" />
								</div>
							</section>

							<section class="border-b border-border py-6">
								<div class="mb-4"><h3 class="text-sm font-semibold">Routing and availability</h3><p class="mt-1 text-xs leading-5 text-muted-fg">Every response has an audience, accountable owner, and closing date.</p></div>
								<div class="grid gap-4 sm:grid-cols-2">
									<DomSelect v-model="formDraft.audience" label="Audience" :options="bootstrap.options.audiences" :errors="formErrors.audience || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
									<DomSelect v-model="formDraft.owner" label="Response owner" :options="bootstrap.options.owners" :errors="formErrors.owner || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
									<DomDatePicker v-model="formDraft.closeDate" label="Closing date" :errors="formErrors.closeDate || []" :calendar-props="{ min: '2026-08-02', max: '2027-12-31' }" />
								</div>
							</section>

							<section class="border-b border-border py-6">
								<div class="mb-4"><h3 class="text-sm font-semibold">Response behavior</h3><p class="mt-1 text-xs leading-5 text-muted-fg">Control draft recovery, abuse protection, and the successful handoff.</p></div>
								<DomTextareaInput v-model="formDraft.confirmationMessage" label="Confirmation message" :rows="3" :errors="formErrors.confirmationMessage || []" />
								<div class="mt-5 flex items-center justify-between gap-4 border-y border-border py-4"><div><p class="text-sm font-medium">Allow respondent drafts</p><p class="mt-1 text-xs leading-5 text-muted-fg">A production adapter can exchange this setting for a signed resume token.</p></div><DomToggle v-model="formDraft.allowDrafts" label="Allow respondent drafts" :chrome="false" /></div>
								<div class="mt-5"><DomRadioGroup v-model="formDraft.spamPolicy" label="Spam protection" :options="bootstrap.options.spamPolicies" :errors="formErrors.spamPolicy || []"><template #option="{ option }"><span><span class="block font-medium">{{ option.label }}</span><span class="mt-0.5 block text-xs text-muted-fg">{{ option.description }}</span></span></template></DomRadioGroup></div>
							</section>

							<section class="py-6">
								<div class="flex items-start justify-between gap-4"><div><h3 class="text-sm font-semibold">Published response schema</h3><p class="mt-1 text-xs leading-5 text-muted-fg">The API validates the same seven fields rendered by the live form.</p></div><DomBadge tone="primary" variant="soft">{{ bootstrap.fields.length }} fields</DomBadge></div>
								<div class="mt-4 divide-y divide-border border-y border-border">
									<div v-for="(field, index) in bootstrap.fields" :key="field.id" class="grid gap-3 py-4 sm:grid-cols-[2rem_minmax(0,1fr)_9rem] sm:items-center">
										<span class="grid size-7 place-items-center rounded-full border border-border text-xs font-semibold">{{ index + 1 }}</span>
										<div><div class="flex flex-wrap items-center gap-2"><p class="text-sm font-medium">{{ field.label }}</p><DomBadge v-if="field.required" tone="neutral" variant="outline">Required</DomBadge></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ field.detail }}</p></div>
										<p class="text-xs font-medium text-muted-fg sm:text-right">{{ field.type }}</p>
									</div>
								</div>
							</section>
						</div>
					</main>

					<aside class="hidden min-h-0 flex-col border-l border-border bg-secondary/15 lg:flex">
						<div class="min-h-0 flex-1 overflow-y-auto p-5">
							<div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Publication health</p><p class="mt-1 text-sm font-semibold">{{ form.readiness.passedCount }} of {{ form.readiness.checks.length }} checks pass</p></div><DomStatusPill :tone="form.readiness.ready ? 'success' : 'warning'" size="sm">{{ form.readiness.ready ? 'Ready' : 'Review' }}</DomStatusPill></div>
							<DomProgress class="mt-3" :value="readinessProgress" label="Publication readiness" :show-label="false" size="sm" />
							<div class="mt-5 divide-y divide-border border-y border-border"><div v-for="check in form.readiness.checks" :key="check.id" class="flex items-start gap-3 py-3"><span class="mt-1.5 size-2 shrink-0 rounded-full" :class="check.status === 'passed' ? 'bg-success' : 'bg-destructive'"></span><div><p class="text-sm font-medium">{{ check.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div></div></div>
							<div class="mt-5 grid gap-2"><DomButton variant="secondary" :loading="busy" @click="validateForm">Run publication checks</DomButton><DomButton :disabled="!canPublish" @click="openPublishDialog">Publish form</DomButton></div>
							<div v-if="form.publication" class="mt-5 border-t border-border pt-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Current publication</p><p class="mt-2 text-sm font-medium">{{ form.publication.version }}</p><p class="mt-1 text-xs text-muted-fg">{{ form.publication.publicUrl }}</p><code class="mt-2 block break-all text-[10px] leading-5 text-muted-fg">{{ form.publication.proof }}</code></div>
							<div class="mt-5 border-t border-border pt-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Recent activity</p><div class="mt-2 divide-y divide-border"><div v-for="event in form.activity.slice(0, 4)" :key="event.id" class="py-3"><p class="text-sm font-medium">{{ event.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p></div></div></div>
						</div>
						<div class="border-t border-border p-3"><DomButton class="w-full" size="sm" variant="ghost" @click="resetDialogOpen = true">Reset demo</DomButton></div>
					</aside>
				</div>

				<div v-else-if="activeView === 'live'" class="grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
					<main class="min-h-0 overflow-y-auto bg-secondary/20 px-4 py-5 sm:px-6 sm:py-8">
						<div class="mx-auto max-w-2xl">
							<DomAlert v-if="form.status !== 'published'" class="mb-4" tone="warning" variant="soft" title="Preview only" description="Run checks and publish this draft before testing public submission." />

							<div v-if="submissionConfirmation" class="skin-card rounded-[1.75rem] border border-border p-6 sm:p-8">
								<DomStatusPill tone="success">Response received</DomStatusPill>
								<h2 class="mt-5 text-2xl font-semibold tracking-tight">{{ submissionConfirmation.message }}</h2>
								<p class="mt-3 text-sm leading-6 text-muted-fg">Reference {{ submissionConfirmation.reference }} · The new response is already available in the triage inbox.</p>
								<div class="mt-6 border-y border-border py-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Submission proof</p><code class="mt-2 block break-all text-[11px] leading-5 text-muted-fg">{{ submissionConfirmation.proof }}</code></div>
								<div class="mt-6 flex flex-wrap gap-2"><DomButton @click="openSubmittedResponse">Review response</DomButton><DomButton variant="secondary" @click="resetSubmission">Submit another</DomButton></div>
							</div>

							<div v-else class="skin-card rounded-[1.75rem] border border-border p-5 sm:p-8">
								<div class="border-b border-border pb-6"><div class="flex items-center justify-between gap-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">DOM Studio product discovery</p><DomStatusPill :tone="form.status === 'published' ? 'success' : 'warning'" size="sm">{{ form.status === 'published' ? 'Open' : 'Preview' }}</DomStatusPill></div><h2 class="mt-3 text-2xl font-semibold tracking-tight">{{ form.title }}</h2><p class="mt-2 text-sm leading-6 text-muted-fg">{{ form.description }}</p></div>
								<DomForm v-model="submissionDraft" name="discovery" class="mt-6 grid gap-5" @submit="submitResponse">
									<div class="grid gap-5 sm:grid-cols-2"><DomTextInput name="name" label="Name" required autocomplete="name" :errors="submissionErrors.name || []" /><DomEmailInput name="email" label="Work email" required autocomplete="email" :errors="submissionErrors.email || []" /></div>
									<DomSelect name="companySize" label="Team size" :options="bootstrap.options.companySizes" :errors="submissionErrors.companySize || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
									<DomTagCombobox name="useCases" label="What are you building?" placeholder="Choose one or more use cases" :options="bootstrap.options.useCases" :errors="submissionErrors.useCases || []" clearable><template #item="{ item }"><div><p class="font-medium">{{ item.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ item.description }}</p></div></template></DomTagCombobox>
									<DomRadioGroup name="contactPreference" label="Preferred next step" :options="bootstrap.options.contactPreferences" :errors="submissionErrors.contactPreference || []" />
									<DomTextareaInput name="details" label="Project context" description="Share the product, users, constraints, and timing that matter." :rows="5" required :errors="submissionErrors.details || []" />
									<div class="border-y border-border py-4"><DomCheckbox name="consent" label="I agree to the privacy notice" description="Use this response only to follow up about DOM Studio and the project described above." :errors="submissionErrors.consent || []" /></div>
									<div class="flex flex-wrap items-center justify-between gap-3"><p class="text-xs text-muted-fg">Open until {{ formatDate(form.closeDate) }}</p><DomButton type="submit" :loading="busy" :disabled="form.status !== 'published'">Send response</DomButton></div>
								</DomForm>
							</div>
						</div>
					</main>
					<aside class="hidden min-h-0 overflow-y-auto border-l border-border p-5 lg:block">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Live contract</p><h2 class="mt-1 text-sm font-semibold">What this preview proves</h2>
						<div class="mt-4 divide-y divide-border border-y border-border"><div class="py-3"><p class="text-sm font-medium">Server availability</p><p class="mt-1 text-xs leading-5 text-muted-fg">Draft forms reject submissions until an exact revision is published.</p></div><div class="py-3"><p class="text-sm font-medium">Structured validation</p><p class="mt-1 text-xs leading-5 text-muted-fg">Required fields, option values, consent, and spam policy are checked on the server.</p></div><div class="py-3"><p class="text-sm font-medium">Immutable receipt</p><p class="mt-1 text-xs leading-5 text-muted-fg">Successful responses receive a reference and SHA-256 proof.</p></div></div>
						<div class="mt-5"><p class="text-xs text-muted-fg">Responses</p><p class="mt-1 text-2xl font-semibold">{{ responses.length }}</p></div><div class="mt-4"><p class="text-xs text-muted-fg">Owner</p><p class="mt-1 text-sm font-medium">{{ bootstrap.options.owners.find((owner) => owner.value === form.owner)?.label }}</p></div><div class="mt-4"><p class="text-xs text-muted-fg">Spam policy</p><p class="mt-1 text-sm font-medium">{{ bootstrap.options.spamPolicies.find((policy) => policy.value === form.spamPolicy)?.label }}</p></div>
					</aside>
				</div>

				<div v-else class="grid h-full min-h-0 lg:grid-cols-[21rem_minmax(0,1fr)]">
					<aside class="flex min-h-0 flex-col border-r border-border">
						<div class="shrink-0 border-b border-border p-4">
							<div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Response inbox</p><h2 class="mt-1 text-lg font-semibold">{{ responseStats.total }} submissions</h2></div><DomStatusPill tone="info" size="sm">{{ responseStats.new }} new</DomStatusPill></div>
							<div class="mt-4"><DomSelect v-model="responseFilter" label="Response status" :options="bootstrap.options.responseFilters" /></div>
						</div>
						<div v-if="filteredResponses.length" class="min-h-0 flex-1 overflow-y-auto divide-y divide-border">
							<button v-for="response in filteredResponses" :key="response.id" type="button" class="block w-full px-4 py-4 text-left transition hover:bg-secondary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60" :class="selectedResponseId === response.id ? 'bg-secondary' : ''" @click="selectResponse(response)">
								<div class="flex items-start justify-between gap-3"><p class="min-w-0 truncate text-sm font-semibold">{{ response.values.name }}</p><DomStatusPill :tone="statusTone(response.status)" size="sm">{{ response.status }}</DomStatusPill></div><p class="mt-1 truncate text-xs text-muted-fg">{{ response.values.email }}</p><p class="mt-2 line-clamp-2 text-xs leading-5 text-muted-fg">{{ response.values.details }}</p><p class="mt-2 text-[11px] text-muted-fg">{{ response.reference }} · {{ formatRelative(response.submittedAt) }}</p>
							</button>
						</div>
						<DomEmptyState v-else title="No matching responses" description="Change the status filter or submit the live form." />
					</aside>
					<main class="hidden min-h-0 lg:block"><FormResponseDetail :response="currentResponse" :draft="responseDraft" :options="bootstrap.options" :errors="responseErrors" :busy="busy" @update:draft="responseDraft = $event" @save="saveResponse" /></main>
				</div>
			</div>

			<DomDrawer v-model="responseDrawerOpen" side="right" title="Response review" width="min(100vw, 34rem)">
				<FormResponseDetail :response="currentResponse" :draft="responseDraft" :options="bootstrap.options" :errors="responseErrors" :busy="busy" @update:draft="responseDraft = $event" @save="saveResponse" />
			</DomDrawer>

			<DomDialog v-model="publishDialogOpen" title="Publish this form?" description="Confirm the exact public behavior before accepting responses." size="lg">
				<div class="space-y-4">
					<div class="grid grid-cols-3 divide-x divide-border border-y border-border py-3 text-center"><div><p class="text-lg font-semibold">{{ form.fieldCount }}</p><p class="text-xs text-muted-fg">Required fields</p></div><div><p class="text-lg font-semibold">{{ form.readiness.passedCount }}/{{ form.readiness.checks.length }}</p><p class="text-xs text-muted-fg">Checks</p></div><div><p class="text-lg font-semibold">{{ formatDate(form.closeDate) }}</p><p class="text-xs text-muted-fg">Closes</p></div></div>
					<div class="divide-y divide-border border-y border-border"><div v-for="check in form.readiness.checks" :key="check.id" class="flex items-start gap-3 py-3"><span class="mt-1.5 size-2 shrink-0 rounded-full" :class="check.status === 'passed' ? 'bg-success' : 'bg-destructive'"></span><div><p class="text-sm font-medium">{{ check.label }}</p><p class="mt-1 text-xs text-muted-fg">{{ check.detail }}</p></div></div></div>
					<DomCheckbox v-model="publishAcknowledged" label="I confirm this form is ready for public responses" description="Publishing creates a versioned URL and allows the public submission endpoint to create inbox records." />
				</div>
				<template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :disabled="!publishAcknowledged" :loading="busy" @click="publishForm">Publish form</DomButton></template>
			</DomDialog>

			<DomDialog v-model="resetDialogOpen" title="Reset the form workspace?" description="This restores the initial draft, removes the current publication, and resets the seeded response inbox.">
				<template #footer><DomButton variant="secondary" data-close>Keep workspace</DomButton><DomButton variant="danger" :loading="busy" @click="resetWorkspace">Reset demo</DomButton></template>
			</DomDialog>
		</div>

		<div v-else class="grid h-full place-items-center p-6"><DomAlert tone="danger" title="Form workspace unavailable" :description="errorMessage || 'The workspace could not be loaded.'"><template #actions><DomButton variant="secondary" @click="loadWorkspace">Try again</DomButton></template></DomAlert></div>
	</div>
</template>
