<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDatePicker,
	DomDialog,
	DomNumberInput,
	DomPositionInput,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextInput,
	DomTextareaInput,
	DomToggleButtonGroup,
} from '@getdom/studio/vue';
import LaunchChecklist from '../components/LaunchChecklist.vue';
import ProductTourCanvas from '../components/ProductTourCanvas.vue';
import TourStepRail from '../components/TourStepRail.vue';

const mobileViewOptions = [
	{ value: 'canvas', label: 'Canvas' },
	{ value: 'steps', label: 'Steps' },
	{ value: 'inspector', label: 'Inspector' },
];

const deviceOptions = [
	{ value: 'desktop', label: 'Desktop' },
	{ value: 'mobile', label: 'Mobile' },
];

const inspectorTabs = [
	{ key: 'step', label: 'Step' },
	{ key: 'setup', label: 'Setup' },
	{ key: 'checks', label: 'Checks' },
];

const loading = ref(true);
const busy = ref(false);
const bootstrap = ref(null);
const tour = ref(null);
const activeStepId = ref('');
const mobileView = ref('canvas');
const inspectorTab = ref('step');
const device = ref('desktop');
const errorMessage = ref('');
const successMessage = ref('');
const fieldErrors = ref({});
const previewSession = ref(null);
const publishDialogOpen = ref(false);
const acknowledged = ref(false);
const stepForm = ref({ title: '', body: '', cta: '', targetId: '', placement: 'bottom' });
const settingsForm = ref({ name: '', goal: '', trigger: '', segment: '', behavior: '', holdoutPercent: 10, launchDate: '', timezone: '' });

const activeStep = computed(getActiveStep);
const activeStepIndex = computed(getActiveStepIndex);
const isScheduled = computed(getIsScheduled);
const canPublish = computed(getCanPublish);

/**
 * Resolves the active authoring step from server state.
 *
 * @returns {Record<string, unknown>|null} Active step.
 */
function getActiveStep() {
	return tour.value?.steps?.find((step) => step.id === activeStepId.value) || tour.value?.steps?.[0] || null;
}

/**
 * Resolves the active step's zero-based sequence index.
 *
 * @returns {number} Active step index.
 */
function getActiveStepIndex() {
	return Math.max(0, tour.value?.steps?.findIndex((step) => step.id === activeStepId.value) ?? 0);
}

/**
 * Resolves whether the current tour has a publication receipt.
 *
 * @returns {boolean} Whether the tour is scheduled.
 */
function getIsScheduled() {
	return tour.value?.status === 'scheduled' && Boolean(tour.value?.release);
}

/**
 * Resolves whether server-calculated readiness allows publication.
 *
 * @returns {boolean} Whether publish is available.
 */
function getCanPublish() {
	return Boolean(
		tour.value?.readiness?.ready
		&& tour.value?.lastValidation?.status === 'passed'
		&& tour.value?.lastValidation?.tourRevision === tour.value?.revision
		&& !isScheduled.value
		&& !busy.value,
	);
}

/**
 * Loads the product-tour authoring contract and resumable draft.
 *
 * @returns {Promise<void>}
 */
async function loadBootstrap() {
	loading.value = true;
	clearFeedback();
	try {
		const payload = await requestJson('/api/block-demos/product-tour-builder/bootstrap');
		bootstrap.value = payload;
		applyTour(payload.tour, { preserveStep: false });
	} catch (error) {
		errorMessage.value = error.message || 'The product-tour builder could not be loaded.';
	} finally {
		loading.value = false;
	}
}

/**
 * Applies server state and synchronizes editable form values.
 *
 * @param {Record<string, unknown>} nextTour Updated tour payload.
 * @param {{ preserveStep?: boolean }} options Application options.
 * @returns {void}
 */
function applyTour(nextTour, options = {}) {
	tour.value = nextTour;
	if (!options.preserveStep || !nextTour.steps.some((step) => step.id === activeStepId.value)) {
		activeStepId.value = nextTour.steps.find((step) => step.status !== 'ready')?.id || nextTour.steps[0]?.id || '';
	}
	syncStepForm();
	settingsForm.value = {
		name: nextTour.name,
		goal: nextTour.goal,
		trigger: nextTour.trigger,
		segment: nextTour.audience.segment,
		behavior: nextTour.audience.behavior,
		holdoutPercent: nextTour.audience.holdoutPercent,
		launchDate: nextTour.schedule.launchDate,
		timezone: nextTour.schedule.timezone,
	};
}

/**
 * Copies the active step into the inspector form.
 *
 * @returns {void}
 */
function syncStepForm() {
	const step = getActiveStep();
	if (!step) return;
	stepForm.value = {
		title: step.title,
		body: step.body,
		cta: step.cta,
		targetId: step.targetId,
		placement: step.placement,
	};
}

/**
 * Selects a tour step and prepares its inspector.
 *
 * @param {string} stepId Step identifier.
 * @returns {void}
 */
function selectStep(stepId) {
	activeStepId.value = stepId;
	syncStepForm();
	inspectorTab.value = 'step';
	if (mobileView.value === 'steps') mobileView.value = 'inspector';
	clearFeedback();
}

/**
 * Selects a target directly from the interactive app canvas.
 *
 * @param {string} targetId Registered target identifier.
 * @returns {void}
 */
function selectCanvasTarget(targetId) {
	stepForm.value.targetId = targetId;
	inspectorTab.value = 'step';
	if (mobileView.value !== 'canvas') mobileView.value = 'inspector';
	successMessage.value = 'Target selected. Save the step to validate it against the registry.';
}

/**
 * Moves to the previous step in preview order.
 *
 * @returns {void}
 */
function previousStep() {
	const nextIndex = Math.max(0, activeStepIndex.value - 1);
	selectStep(tour.value.steps[nextIndex].id);
}

/**
 * Moves to the next step in preview order.
 *
 * @returns {void}
 */
function nextStep() {
	const nextIndex = Math.min(tour.value.steps.length - 1, activeStepIndex.value + 1);
	selectStep(tour.value.steps[nextIndex].id);
}

/**
 * Saves the active step, optionally recording author review.
 *
 * @param {boolean} reviewed Whether the preview has been reviewed.
 * @returns {Promise<void>}
 */
async function saveStep(reviewed = false) {
	if (!tour.value || !activeStep.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/product-tour-builder/tours/${tour.value.id}/steps/${activeStep.value.id}`, {
			method: 'PATCH',
			body: { revision: tour.value.revision, ...stepForm.value, reviewed },
		});
		applyTour(payload.tour, { preserveStep: true });
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'The selected step could not be saved.');
	} finally {
		busy.value = false;
	}
}

/**
 * Duplicates one tour step through the API.
 *
 * @param {string} stepId Source step identifier.
 * @returns {Promise<void>}
 */
async function duplicateStep(stepId) {
	if (!tour.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/product-tour-builder/tours/${tour.value.id}/steps/${stepId}/duplicate`, {
			method: 'POST',
			body: { revision: tour.value.revision },
		});
		activeStepId.value = payload.step.id;
		applyTour(payload.tour, { preserveStep: true });
		inspectorTab.value = 'step';
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'The step could not be duplicated.');
	} finally {
		busy.value = false;
	}
}

/**
 * Saves audience, trigger, goal, and schedule settings.
 *
 * @returns {Promise<void>}
 */
async function saveSettings() {
	if (!tour.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/product-tour-builder/tours/${tour.value.id}/settings`, {
			method: 'PATCH',
			body: { revision: tour.value.revision, ...settingsForm.value },
		});
		applyTour(payload.tour, { preserveStep: true });
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'Tour setup could not be saved.');
	} finally {
		busy.value = false;
	}
}

/**
 * Runs server-owned launch checks against the current revision.
 *
 * @returns {Promise<void>}
 */
async function validateTour() {
	if (!tour.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/product-tour-builder/tours/${tour.value.id}/validate`, {
			method: 'POST',
			body: { revision: tour.value.revision },
		});
		applyTour(payload.tour, { preserveStep: true });
		inspectorTab.value = 'checks';
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'Launch checks could not run.');
	} finally {
		busy.value = false;
	}
}

/**
 * Creates an expiring preview session from the current revision.
 *
 * @returns {Promise<void>}
 */
async function createPreview() {
	if (!tour.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/product-tour-builder/tours/${tour.value.id}/previews`, {
			method: 'POST',
			body: { revision: tour.value.revision, device: device.value },
		});
		previewSession.value = payload.preview;
		successMessage.value = `${payload.message} ${payload.preview.id}.`;
	} catch (error) {
		applyRequestError(error, 'A preview session could not be created.');
	} finally {
		busy.value = false;
	}
}

/**
 * Opens the publication confirmation after server readiness is available.
 *
 * @returns {void}
 */
function openPublishDialog() {
	acknowledged.value = false;
	publishDialogOpen.value = true;
}

/**
 * Schedules a ready tour and stores immutable publication proof.
 *
 * @returns {Promise<void>}
 */
async function publishTour() {
	if (!tour.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/product-tour-builder/tours/${tour.value.id}/publish`, {
			method: 'POST',
			body: { revision: tour.value.revision, acknowledged: acknowledged.value },
		});
		applyTour(payload.tour, { preserveStep: true });
		publishDialogOpen.value = false;
		inspectorTab.value = 'checks';
		mobileView.value = 'inspector';
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'The tour could not be scheduled.');
	} finally {
		busy.value = false;
	}
}

/**
 * Applies a structured API error and refreshes stale tour state when available.
 *
 * @param {Error & { fields?: Array<Record<string, string>>, payload?: Record<string, unknown> }} error Request error.
 * @param {string} fallback Fallback guidance.
 * @returns {void}
 */
function applyRequestError(error, fallback) {
	errorMessage.value = error.message || fallback;
	fieldErrors.value = Object.fromEntries((error.fields || []).map((field) => [field.field, [field.message]]));
	if (error.payload?.tour) applyTour(error.payload.tour, { preserveStep: true });
}

/**
 * Clears transient feedback and field errors.
 *
 * @returns {void}
 */
function clearFeedback() {
	errorMessage.value = '';
	successMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Resolves a selected option label.
 *
 * @param {Array<Record<string, unknown>>} options Available options.
 * @param {string} value Selected value.
 * @returns {string} Human-readable label.
 */
function optionLabel(options, value) {
	return options?.find((option) => option.value === value)?.label || value || 'Not set';
}

/**
 * Formats an ISO timestamp as a concise local date and time.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Local label.
 */
function formatDateTime(value) {
	if (!value) return 'Not yet';
	return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

/**
 * Sends JSON to the demo API and promotes structured errors into exceptions.
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
			<div class="h-16 border-b border-border p-4"><DomSkeleton variant="text" :lines="1" width="18rem" /></div>
			<div class="grid min-h-0 flex-1 lg:grid-cols-[15rem_minmax(0,1fr)_21rem]">
				<div class="hidden border-r border-border p-4 lg:block"><DomSkeleton variant="text" :lines="6" /></div>
				<div class="p-5"><DomSkeleton height="28rem" /></div>
				<div class="hidden border-l border-border p-4 lg:block"><DomSkeleton variant="text" :lines="8" /></div>
			</div>
		</div>

		<div v-else-if="tour && bootstrap" class="flex h-full min-h-0 flex-col">
			<header class="shrink-0 border-b border-border bg-canvas">
				<div class="flex min-h-16 items-center gap-3 px-3 py-2 sm:px-4">
					<DomAvatar name="Northstar" initials="N" shape="rounded" size="sm" />
					<div class="min-w-0 flex-1">
						<div class="flex min-w-0 items-center gap-2">
							<h1 class="truncate text-sm font-semibold">{{ tour.name }}</h1>
							<span class="hidden sm:inline-flex"><DomStatusPill :tone="isScheduled ? 'success' : 'warning'" size="sm">{{ isScheduled ? 'Scheduled' : 'Draft' }}</DomStatusPill></span>
						</div>
						<p class="truncate text-xs text-muted-fg">Revision {{ tour.revision }} · {{ tour.readyStepCount }}/{{ tour.steps.length }} steps ready</p>
					</div>

					<div class="hidden sm:block"><DomToggleButtonGroup v-model="device" label="Preview device" :options="deviceOptions" size="sm" chrome="none" /></div>
					<div class="hidden shrink-0 items-center gap-2 sm:flex">
						<DomButton size="sm" variant="secondary" :loading="busy" @click="createPreview">Preview</DomButton>
						<DomButton size="sm" variant="secondary" :loading="busy" @click="validateTour">Run checks</DomButton>
						<DomButton size="sm" :disabled="!canPublish" @click="openPublishDialog">{{ isScheduled ? 'Scheduled' : 'Publish' }}</DomButton>
					</div>
					<div class="shrink-0 sm:hidden"><DomButton size="sm" :disabled="!canPublish" @click="openPublishDialog">{{ isScheduled ? 'Scheduled' : 'Publish' }}</DomButton></div>
				</div>
				<div class="flex items-center gap-2 border-t border-border px-3 py-2 sm:hidden">
					<div class="min-w-0 flex-1 overflow-x-auto"><DomToggleButtonGroup v-model="device" label="Preview device" :options="deviceOptions" size="sm" chrome="none" /></div>
					<div class="shrink-0"><DomButton size="sm" variant="secondary" :loading="busy" @click="createPreview">Preview</DomButton></div>
					<div class="shrink-0"><DomButton size="sm" variant="secondary" :loading="busy" @click="validateTour">Checks</DomButton></div>
				</div>
				<div class="border-t border-border px-3 py-2 lg:hidden">
					<DomToggleButtonGroup v-model="mobileView" label="Builder view" :options="mobileViewOptions" size="sm" chrome="none" />
				</div>
			</header>

			<div v-if="errorMessage || successMessage" class="shrink-0 border-b border-border px-3 py-2 sm:px-4">
				<DomAlert v-if="errorMessage" tone="danger" variant="soft" title="Check the tour" :description="errorMessage" dismissible @dismiss="errorMessage = ''" />
				<DomAlert v-else tone="success" variant="soft" title="Saved" :description="successMessage" dismissible @dismiss="successMessage = ''" />
			</div>

			<div class="min-h-0 flex-1 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)_21rem]">
				<aside
					class="min-h-0 flex-col border-r border-border bg-secondary/15"
					:class="mobileView === 'steps' ? 'flex h-full' : 'hidden lg:flex'"
				>
					<TourStepRail :steps="tour.steps" :active-step-id="activeStepId" :busy="busy" @select="selectStep" @duplicate="duplicateStep" />
				</aside>

				<main
					class="min-h-0 min-w-0 flex-col"
					:class="mobileView === 'canvas' ? 'flex h-full' : 'hidden lg:flex'"
				>
					<ProductTourCanvas
						v-if="activeStep"
						:step="{ ...activeStep, ...stepForm }"
						:device="device"
						:step-number="activeStepIndex + 1"
						:step-count="tour.steps.length"
						:preview-session="previewSession"
						@select-target="selectCanvasTarget"
						@previous="previousStep"
						@next="nextStep"
					/>
				</main>

				<aside
					class="min-h-0 flex-col border-l border-border bg-canvas"
					:class="mobileView === 'inspector' ? 'flex h-full' : 'hidden lg:flex'"
				>
					<DomTabs v-model="inspectorTab" :tabs="inspectorTabs" variant="page" fill>
						<template #step>
							<form class="min-h-0 flex-1 overflow-y-auto p-4" @submit.prevent="saveStep(false)">
								<div class="flex items-start justify-between gap-3">
									<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Selected moment</p><h2 class="mt-1 text-sm font-semibold">Step {{ activeStepIndex + 1 }}</h2></div>
									<DomStatusPill :tone="activeStep.status === 'ready' ? 'success' : 'warning'" size="sm">{{ activeStep.status === 'ready' ? 'Ready' : 'Review' }}</DomStatusPill>
								</div>
								<div class="mt-5 grid gap-4">
									<DomTextInput v-model="stepForm.title" label="Step title" :errors="fieldErrors.title || []" required />
									<DomTextareaInput v-model="stepForm.body" label="Tooltip body" :rows="4" :errors="fieldErrors.body || []" required />
									<DomTextInput v-model="stepForm.cta" label="CTA label" :errors="fieldErrors.cta || []" required />
									<DomSelect v-model="stepForm.targetId" label="Product target" :options="bootstrap.options.targets" searchable width="min-w-[19rem]" :errors="fieldErrors.targetId || []">
										<template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.screen }} · {{ option.description }}</p></div></template>
									</DomSelect>
									<DomPositionInput v-model="stepForm.placement" label="Tooltip placement" description="Preferred side before collision handling." />
								</div>
								<div class="mt-6 grid gap-2 border-t border-border pt-4">
									<DomButton type="submit" variant="secondary" :loading="busy">Save draft</DomButton>
									<DomButton type="button" :loading="busy" @click="saveStep(true)">Save & mark reviewed</DomButton>
								</div>
							</form>
						</template>

						<template #setup>
							<form class="min-h-0 flex-1 overflow-y-auto p-4" @submit.prevent="saveSettings">
								<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Tour setup</p><h2 class="mt-1 text-sm font-semibold">Audience & schedule</h2></div>
								<div class="mt-5 grid gap-4">
									<DomTextInput v-model="settingsForm.name" label="Tour name" :errors="fieldErrors.name || []" />
									<DomSelect v-model="settingsForm.goal" label="Goal" :options="bootstrap.options.goals" width="min-w-[18rem]" />
									<DomSelect v-model="settingsForm.trigger" label="Trigger" :options="bootstrap.options.triggers" width="min-w-[18rem]" />
									<DomSelect v-model="settingsForm.segment" label="Audience segment" :options="bootstrap.options.segments" width="min-w-[19rem]">
										<template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.count.toLocaleString() }} accounts · {{ option.description }}</p></div></template>
									</DomSelect>
									<DomSelect v-model="settingsForm.behavior" label="Eligibility rule" :options="bootstrap.options.behaviors" width="min-w-[19rem]" />
									<DomNumberInput v-model="settingsForm.holdoutPercent" label="Experiment holdout" description="Percentage excluded as a control group." :min="5" :max="50" :errors="fieldErrors.holdoutPercent || []" />
									<DomDatePicker v-model="settingsForm.launchDate" label="Launch date" :errors="fieldErrors.launchDate || []" />
									<DomSelect v-model="settingsForm.timezone" label="Timezone" :options="bootstrap.options.timezones" searchable width="min-w-[18rem]" />
								</div>
								<div class="mt-5 border-y border-border py-4">
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Estimated reach</p>
									<p class="mt-1 text-2xl font-semibold">{{ tour.reach.reach.toLocaleString() }}</p>
									<p class="mt-1 text-xs leading-5 text-muted-fg">{{ tour.reach.holdout.toLocaleString() }} eligible accounts remain in the experiment holdout.</p>
								</div>
								<DomButton class="mt-5 w-full" type="submit" :loading="busy">Save setup</DomButton>
							</form>
						</template>

						<template #checks>
							<div class="min-h-0 flex-1 overflow-y-auto p-4">
								<LaunchChecklist :checks="tour.readiness.checks" />
								<div class="mt-5 grid gap-2">
									<DomButton variant="secondary" :loading="busy" @click="validateTour">Run server checks</DomButton>
									<DomButton variant="secondary" :loading="busy" @click="createPreview">Create {{ device }} preview</DomButton>
									<DomButton :disabled="!canPublish" @click="openPublishDialog">Publish tour</DomButton>
								</div>

								<div v-if="previewSession" class="mt-5 border-t border-border pt-4">
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Preview proof</p>
									<p class="mt-2 text-sm font-medium">{{ previewSession.id }}</p>
									<p class="mt-1 text-xs leading-5 text-muted-fg">Revision {{ previewSession.tourRevision }} · expires {{ formatDateTime(previewSession.expiresAt) }}</p>
								</div>

								<div v-if="tour.release" class="mt-5 border-y border-success/30 bg-success/5 py-4">
									<DomStatusPill tone="success">Scheduled</DomStatusPill>
									<p class="mt-3 text-sm font-semibold">{{ tour.release.reference }}</p>
									<p class="mt-1 text-xs leading-5 text-muted-fg">Audience evaluation begins {{ formatDateTime(tour.release.scheduledFor) }}.</p>
									<code class="mt-3 block break-all rounded-lg bg-secondary px-3 py-2 text-[11px] leading-5">{{ tour.release.proof }}</code>
								</div>
							</div>
						</template>
					</DomTabs>
				</aside>
			</div>
		</div>

		<div v-else class="grid h-full place-items-center p-6">
			<DomAlert class="max-w-lg" tone="danger" title="Builder unavailable" :description="errorMessage || 'The tour draft could not be loaded.'">
				<template #actions><DomButton variant="secondary" @click="loadBootstrap">Try again</DomButton></template>
			</DomAlert>
		</div>

		<DomDialog v-model="publishDialogOpen" title="Publish product tour" description="Confirm the current audience, schedule, and server-owned launch checks before creating the release.">
			<div v-if="tour" class="space-y-4">
				<div class="grid gap-3 sm:grid-cols-2">
					<div class="border-y border-border py-3"><p class="text-xs font-semibold uppercase tracking-wider text-muted-fg">Eligible audience</p><p class="mt-1 text-lg font-semibold">{{ tour.reach.reach.toLocaleString() }}</p></div>
					<div class="border-y border-border py-3"><p class="text-xs font-semibold uppercase tracking-wider text-muted-fg">Launch date</p><p class="mt-1 text-lg font-semibold">{{ tour.schedule.launchDate }}</p></div>
				</div>
				<LaunchChecklist :checks="tour.readiness.checks" />
				<DomCheckbox v-model="acknowledged" label="I confirm the audience and schedule" description="Publishing creates an immutable scheduled release for this revision." />
			</div>
			<template #footer>
				<DomButton variant="secondary" data-close>Cancel</DomButton>
				<DomButton :disabled="!acknowledged" :loading="busy" @click="publishTour">Schedule tour</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
