<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomButton,
	DomCheckbox,
	DomDatePicker,
	DomDialog,
	DomDrawer,
	DomIconButton,
	DomProgress,
	DomRadioGroup,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTextInput,
	DomTextareaInput,
} from '@getdom/studio/vue';

const activityIcon = 'M5 12h3l2-5 4 10 2-5h3M12 3a9 9 0 1 0 9 9';
const helpIcon = 'M12 18h.01M9.5 9a2.5 2.5 0 1 1 3.7 2.2c-.8.5-1.2 1-1.2 2.3M12 3a9 9 0 1 0 9 9';
const closeIcon = 'M6 6l12 12M18 6 6 18';
const steps = [
	{ id: 'profile', label: 'Details', description: 'Confirm your legal identity' },
	{ id: 'evidence', label: 'Evidence', description: 'Capture required documents' },
	{ id: 'checks', label: 'Checks', description: 'Consent and screening' },
	{ id: 'review', label: 'Review', description: 'Submit the complete packet' },
];

const bootstrap = ref(null);
const session = ref(null);
const activeStep = ref('profile');
const profileDraft = ref(createEmptyProfile());
const declarationDraft = ref({ pepExposure: 'not_exposed', consentAccepted: false });
const selectedEvidence = ref(null);
const captureMethod = ref('camera');
const submissionNote = ref('');
const submissionAcknowledged = ref(false);
const captureOpen = ref(false);
const submitOpen = ref(false);
const activityOpen = ref(false);
const helpOpen = ref(false);
const loading = ref(true);
const busy = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const receipt = ref(null);

const verificationTypeOptions = computed(() => bootstrap.value?.verificationTypeOptions || []);
const countryOptions = computed(() => bootstrap.value?.countryOptions || []);
const documentTypeOptions = computed(() => bootstrap.value?.documentTypeOptions || []);
const captureMethodOptions = computed(() => bootstrap.value?.captureMethodOptions || []);
const pepOptions = computed(() => bootstrap.value?.pepOptions || []);
const readinessChecks = computed(() => session.value?.readiness?.checks || []);
const verifiedEvidenceCount = computed(() => session.value?.evidence?.filter((item) => item.status === 'verified').length || 0);
const requiredEvidenceCount = computed(() => session.value?.evidence?.filter((item) => item.required).length || 0);
const remainingEvidenceCount = computed(() => Math.max(0, requiredEvidenceCount.value - verifiedEvidenceCount.value));
const activeStepIndex = computed(() => Math.max(0, steps.findIndex((step) => step.id === activeStep.value)));
const profileDirty = computed(() => Boolean(session.value) && stableHash(profileDraft.value) !== stableHash(session.value.profile));
const declarationsDirty = computed(() => Boolean(session.value) && stableHash(declarationDraft.value) !== stableHash({
	pepExposure: session.value.declarations.pepExposure,
	consentAccepted: session.value.declarations.consentAccepted,
}));
const sessionSubmitted = computed(() => session.value?.status === 'submitted');
const sessionStatusLabel = computed(() => {
	if (sessionSubmitted.value) return 'In review';
	if (session.value?.readiness?.ready) return 'Ready to submit';
	return 'In progress';
});
const sessionStatusTone = computed(() => sessionSubmitted.value ? 'success' : session.value?.readiness?.ready ? 'primary' : 'warning');

onMounted(loadVerification);

/**
 * Creates a complete empty profile shape for the loading state.
 *
 * @returns {Record<string, string>} Empty applicant profile.
 */
function createEmptyProfile() {
	return {
		verificationType: 'individual',
		country: 'GB',
		firstName: '',
		lastName: '',
		email: '',
		dateOfBirth: '',
		addressLine: '',
		city: '',
		postcode: '',
		preferredDocument: 'passport',
	};
}

/**
 * Loads provider configuration and the resumable verification session.
 *
 * @returns {Promise<void>}
 */
async function loadVerification() {
	loading.value = true;
	errorMessage.value = '';
	try {
		const [bootstrapPayload, sessionPayload] = await Promise.all([
			requestJson('/api/block-demos/identity-verification/bootstrap'),
			requestJson('/api/block-demos/identity-verification/session'),
		]);
		bootstrap.value = bootstrapPayload;
		applySession(sessionPayload.session, { resume: true });
	} catch (error) {
		errorMessage.value = error.message || 'The verification session could not be loaded.';
	} finally {
		loading.value = false;
	}
}

/**
 * Applies a server session and refreshes editable drafts.
 *
 * @param {Record<string, unknown>} nextSession Server-owned session.
 * @param {{resume?: boolean}} options Application options.
 * @returns {void}
 */
function applySession(nextSession, options = {}) {
	session.value = nextSession;
	profileDraft.value = cloneValue(nextSession.profile);
	declarationDraft.value = {
		pepExposure: nextSession.declarations.pepExposure,
		consentAccepted: nextSession.declarations.consentAccepted,
	};
	receipt.value = nextSession.receipt || receipt.value;
	if (options.resume) activeStep.value = nextSession.nextStep || 'profile';
}

/**
 * Moves to a named verification step.
 *
 * @param {string} stepId Step identifier.
 * @returns {void}
 */
function selectStep(stepId) {
	activeStep.value = stepId;
	errorMessage.value = '';
	successMessage.value = '';
}

/**
 * Reports whether a server-owned readiness gate is complete.
 *
 * @param {string} stepId Step identifier.
 * @returns {boolean} True when the step is complete.
 */
function stepIsComplete(stepId) {
	if (stepId === 'review') return sessionSubmitted.value;
	if (stepId === 'checks') {
		return readinessChecks.value.filter((check) => ['checks', 'consent'].includes(check.id)).every((check) => check.ready);
	}
	return readinessChecks.value.find((check) => check.id === stepId)?.ready === true;
}

/**
 * Saves validated applicant profile data and advances to evidence.
 *
 * @returns {Promise<void>}
 */
async function saveProfile() {
	if (!session.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson('/api/block-demos/identity-verification/session/profile', {
			method: 'PATCH',
			body: { revision: session.value.revision, profile: profileDraft.value },
		});
		applySession(payload.session);
		successMessage.value = payload.message;
		activeStep.value = 'evidence';
	} catch (error) {
		errorMessage.value = error.message || 'Your profile could not be saved.';
	} finally {
		busy.value = false;
	}
}

/**
 * Opens the secure provider capture dialog for one evidence item.
 *
 * @param {Record<string, unknown>} evidence Evidence item.
 * @returns {void}
 */
function openEvidenceCapture(evidence) {
	selectedEvidence.value = evidence;
	captureMethod.value = evidence.method || 'camera';
	errorMessage.value = '';
	captureOpen.value = true;
}

/**
 * Completes one evidence capture through the demo provider API.
 *
 * @returns {Promise<void>}
 */
async function captureEvidence() {
	if (!session.value || !selectedEvidence.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/identity-verification/session/evidence/${selectedEvidence.value.id}/capture`, {
			method: 'POST',
			body: { revision: session.value.revision, method: captureMethod.value },
		});
		applySession(payload.session);
		successMessage.value = payload.message;
		captureOpen.value = false;
		selectedEvidence.value = null;
	} catch (error) {
		if (error.payload?.session) applySession(error.payload.session);
		errorMessage.value = error.message || 'The evidence provider could not complete this capture.';
	} finally {
		busy.value = false;
	}
}

/**
 * Saves consent and PEP declarations before screening.
 *
 * @returns {Promise<void>}
 */
async function saveDeclarations() {
	if (!session.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson('/api/block-demos/identity-verification/session/declarations', {
			method: 'PATCH',
			body: { revision: session.value.revision, ...declarationDraft.value },
		});
		applySession(payload.session);
		successMessage.value = payload.message;
	} catch (error) {
		errorMessage.value = error.message || 'Your declarations could not be saved.';
	} finally {
		busy.value = false;
	}
}

/**
 * Runs server-owned sanctions, PEP, duplicate, and device screening.
 *
 * @returns {Promise<void>}
 */
async function runChecks() {
	if (!session.value || busy.value) return;
	if (declarationsDirty.value) {
		await saveDeclarations();
		if (errorMessage.value) return;
	}
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson('/api/block-demos/identity-verification/session/checks', {
			method: 'POST',
			body: { revision: session.value.revision },
		});
		applySession(payload.session);
		successMessage.value = payload.message;
	} catch (error) {
		errorMessage.value = error.message || 'Screening checks could not be completed.';
	} finally {
		busy.value = false;
	}
}

/**
 * Opens the submission confirmation when the packet is ready.
 *
 * @returns {void}
 */
function openSubmitReview() {
	submissionAcknowledged.value = false;
	submissionNote.value = '';
	errorMessage.value = '';
	submitOpen.value = true;
}

/**
 * Submits the complete packet and preserves returned receipt evidence.
 *
 * @returns {Promise<void>}
 */
async function submitPacket() {
	if (!session.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson('/api/block-demos/identity-verification/session/submit', {
			method: 'POST',
			body: {
				revision: session.value.revision,
				acknowledged: submissionAcknowledged.value,
				note: submissionNote.value,
			},
		});
		applySession(payload.session);
		receipt.value = payload.receipt;
		successMessage.value = payload.message;
		submitOpen.value = false;
		activeStep.value = 'review';
	} catch (error) {
		errorMessage.value = error.message || 'The verification packet could not be submitted.';
	} finally {
		busy.value = false;
	}
}

/**
 * Requests scoped support without transmitting evidence contents.
 *
 * @returns {Promise<void>}
 */
async function requestSupport() {
	if (!session.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson('/api/block-demos/identity-verification/session/support', {
			method: 'POST',
			body: { revision: session.value.revision, step: activeStep.value },
		});
		applySession(payload.session);
		successMessage.value = `${payload.message} Reference ${payload.supportRequest.id}.`;
		helpOpen.value = false;
	} catch (error) {
		errorMessage.value = error.message || 'Verification support could not be requested.';
	} finally {
		busy.value = false;
	}
}

/**
 * Clears action feedback before a new mutation.
 *
 * @returns {void}
 */
function clearFeedback() {
	errorMessage.value = '';
	successMessage.value = '';
}

/**
 * Performs a JSON request and raises API messages as ordinary errors.
 *
 * @param {string} url Request URL.
 * @param {{method?: string, body?: unknown}} options Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed response payload.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		method: options.method || 'GET',
		headers: options.body === undefined ? undefined : { 'content-type': 'application/json' },
		body: options.body === undefined ? undefined : JSON.stringify(options.body),
	});
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		const error = new Error(payload.error || `Request failed with status ${response.status}.`);
		error.payload = payload;
		throw error;
	}
	return payload;
}

/**
 * Returns a stable JSON representation for dirty-state comparison.
 *
 * @param {unknown} value JSON-safe value.
 * @returns {string} Stable representation.
 */
function stableHash(value) {
	return JSON.stringify(value || null);
}

/**
 * Clones a JSON-safe value.
 *
 * @param {unknown} value Serializable value.
 * @returns {unknown} Detached clone.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}

/**
 * Resolves a status-pill tone for evidence state.
 *
 * @param {string} status Evidence status.
 * @returns {string} DOM Studio tone.
 */
function evidenceTone(status) {
	if (status === 'verified') return 'success';
	if (status === 'needs_retry') return 'danger';
	return 'warning';
}

/**
 * Resolves a status-pill tone for screening state.
 *
 * @param {string} status Screening status.
 * @returns {string} DOM Studio tone.
 */
function checkTone(status) {
	if (status === 'clear') return 'success';
	if (status === 'review') return 'warning';
	if (status === 'blocked') return 'danger';
	return 'muted';
}

/**
 * Resolves the risk status tone.
 *
 * @param {string} level Risk level.
 * @returns {string} DOM Studio tone.
 */
function riskTone(level) {
	if (level === 'low') return 'success';
	if (level === 'high') return 'danger';
	return 'warning';
}

/**
 * Formats an ISO timestamp for compact session context.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Local date and time.
 */
function formatDateTime(value) {
	if (!value) return 'Not available';
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}

/**
 * Formats a machine value as a readable label.
 *
 * @param {string} value Machine-readable value.
 * @returns {string} Human-readable label.
 */
function titleCase(value) {
	const text = String(value || '').replaceAll('_', ' ').replaceAll('-', ' ');
	return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : '';
}
</script>

<template>
	<div class="flex h-dvh min-h-[40rem] w-full flex-col overflow-hidden bg-canvas text-canvas-fg">
		<header class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-3 sm:px-5">
			<div class="flex min-w-0 items-center gap-3">
				<div class="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-fg">A</div>
				<div class="min-w-0">
					<div class="flex items-center gap-2">
						<h1 class="truncate text-sm font-semibold">Atlas Verify</h1>
						<span class="hidden text-xs text-muted-fg sm:inline">Secure identity session</span>
					</div>
					<p class="truncate text-[0.68rem] text-muted-fg">{{ session?.id || 'Loading verification' }}</p>
				</div>
			</div>

			<div class="flex items-center gap-1.5">
				<DomStatusPill v-if="session" :tone="sessionStatusTone" :label="sessionStatusLabel" size="sm" />
				<DomIconButton :icon="activityIcon" label="Session activity" variant="ghost" size="sm" @click="activityOpen = true" />
				<DomIconButton :icon="helpIcon" label="Verification help" variant="ghost" size="sm" @click="helpOpen = true" />
				<DomAvatar :name="bootstrap?.currentUser?.name || 'Maya Hart'" size="sm" />
			</div>
		</header>

		<div class="flex min-h-0 flex-1">
			<aside class="hidden w-64 shrink-0 flex-col border-r border-border bg-secondary/20 md:flex">
				<div class="border-b border-border p-5">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Your progress</p>
					<p class="mt-2 text-2xl font-semibold">{{ session?.readiness?.percent || 0 }}%</p>
					<DomProgress class="mt-3" :value="session?.readiness?.percent || 0" label="Verification progress" :show-label="false" size="sm" />
					<p class="mt-3 text-xs leading-5 text-muted-fg">Your answers are saved after each completed step.</p>
				</div>

				<nav class="flex-1 py-2" aria-label="Verification steps">
					<button
						v-for="(step, index) in steps"
						:key="step.id"
						type="button"
						class="flex w-full items-start gap-3 border-l-2 px-5 py-4 text-left transition"
						:class="activeStep === step.id ? 'border-primary bg-canvas' : 'border-transparent hover:bg-canvas/60'"
						@click="selectStep(step.id)"
					>
						<span
							class="grid size-6 shrink-0 place-items-center rounded-full border text-[0.68rem] font-semibold"
							:class="stepIsComplete(step.id) ? 'border-success/35 bg-success/15 text-success' : activeStep === step.id ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-canvas text-muted-fg'"
						>
							{{ index + 1 }}
						</span>
						<span class="min-w-0">
							<span class="block text-sm font-semibold">{{ step.label }}</span>
							<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ step.description }}</span>
						</span>
					</button>
				</nav>

				<div class="border-t border-border p-5 text-xs leading-5 text-muted-fg">
					<p class="font-semibold text-canvas-fg">Encrypted verification</p>
					<p class="mt-1">Session expires {{ formatDateTime(session?.expiresAt) }}.</p>
				</div>
			</aside>

			<main class="flex min-w-0 flex-1 flex-col">
				<nav class="grid h-14 shrink-0 grid-cols-4 border-b border-border md:hidden" aria-label="Verification steps">
					<button
						v-for="(step, index) in steps"
						:key="step.id"
						type="button"
						class="relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[0.65rem] font-semibold text-muted-fg"
						:class="activeStep === step.id && 'text-canvas-fg'"
						@click="selectStep(step.id)"
					>
						<span class="grid size-5 place-items-center rounded-full border text-[0.6rem]" :class="stepIsComplete(step.id) ? 'border-success/35 bg-success/15 text-success' : activeStep === step.id ? 'border-primary bg-primary text-primary-fg' : 'border-border'">
							{{ index + 1 }}
						</span>
						<span class="truncate">{{ step.label }}</span>
						<span v-if="activeStep === step.id" class="absolute inset-x-2 bottom-0 h-0.5 bg-primary"></span>
					</button>
				</nav>

				<div class="min-h-0 flex-1 overflow-y-auto">
					<div v-if="loading" class="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-7 sm:py-8">
						<DomSkeleton class="h-7 w-52" />
						<DomSkeleton class="h-16 w-full" />
						<DomSkeleton v-for="index in 4" :key="index" class="h-12 w-full" />
					</div>

					<div v-else-if="!session" class="mx-auto w-full max-w-2xl px-4 py-8">
						<DomAlert tone="danger" title="Verification is unavailable" :description="errorMessage">
							<template #actions><DomButton size="sm" variant="secondary" @click="loadVerification">Try again</DomButton></template>
						</DomAlert>
					</div>

					<div v-else class="mx-auto w-full max-w-3xl px-4 py-5 sm:px-7 sm:py-7">
						<DomAlert v-if="errorMessage" class="mb-5" tone="danger" title="This step needs attention" :description="errorMessage" dismissible @dismiss="errorMessage = ''" />
						<DomAlert v-if="successMessage" class="mb-5" tone="success" title="Progress saved" :description="successMessage" dismissible @dismiss="successMessage = ''" />

						<section v-if="activeStep === 'profile'">
							<div class="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Step 1 of 4</p>
									<h2 class="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Confirm your details</h2>
									<p class="mt-2 max-w-xl text-sm leading-6 text-muted-fg">Use your legal identity exactly as it appears on your chosen document.</p>
								</div>
								<DomStatusPill :tone="profileDirty ? 'warning' : 'success'" :label="profileDirty ? 'Unsaved changes' : 'Saved'" size="sm" />
							</div>

							<div class="grid gap-5 py-6 sm:grid-cols-2">
								<DomSelect v-model="profileDraft.verificationType" label="Verification type" :options="verificationTypeOptions" width="min-w-[19rem] max-w-[calc(100vw-3rem)]">
									<template #option="{ option }"><p class="font-medium">{{ option.label }}</p><p class="mt-1 text-xs opacity-75">{{ option.description }}</p></template>
								</DomSelect>
								<DomSelect v-model="profileDraft.country" label="Country of residence" :options="countryOptions" searchable width="min-w-[19rem] max-w-[calc(100vw-3rem)]">
									<template #option="{ option }"><p class="font-medium">{{ option.label }}</p><p class="mt-1 text-xs opacity-75">{{ option.description }}</p></template>
								</DomSelect>
								<DomTextInput v-model="profileDraft.firstName" label="Legal first name" autocomplete="given-name" />
								<DomTextInput v-model="profileDraft.lastName" label="Legal last name" autocomplete="family-name" />
								<DomTextInput v-model="profileDraft.email" label="Email address" type="email" autocomplete="email" />
								<DomDatePicker v-model="profileDraft.dateOfBirth" label="Date of birth" description="Applicants must be at least 18." />
								<DomTextInput v-model="profileDraft.addressLine" class="sm:col-span-2" label="Residential address" autocomplete="address-line1" />
								<DomTextInput v-model="profileDraft.city" label="City" autocomplete="address-level2" />
								<DomTextInput v-model="profileDraft.postcode" label="Postcode" autocomplete="postal-code" />
								<DomSelect v-model="profileDraft.preferredDocument" class="sm:col-span-2" label="Identity document" :options="documentTypeOptions" width="min-w-[19rem] max-w-[calc(100vw-3rem)]">
									<template #option="{ option }"><p class="font-medium">{{ option.label }}</p><p class="mt-1 text-xs opacity-75">{{ option.description }}</p></template>
								</DomSelect>
							</div>

							<div class="flex justify-end border-t border-border pt-5">
								<DomButton :loading="busy" @click="saveProfile">Save and continue</DomButton>
							</div>
						</section>

						<section v-else-if="activeStep === 'evidence'">
							<div class="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Step 2 of 4</p>
									<h2 class="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Capture your evidence</h2>
									<p class="mt-2 max-w-xl text-sm leading-6 text-muted-fg">The demo provider checks document quality, authenticity, liveness, and face match.</p>
								</div>
								<DomStatusPill :tone="remainingEvidenceCount ? 'warning' : 'success'" :label="remainingEvidenceCount ? `${remainingEvidenceCount} remaining` : 'All verified'" size="sm" />
							</div>

							<DomAlert class="my-5" tone="info" title="Your document contents stay with the verification provider" :description="bootstrap?.provider?.privacyMessage" />

							<div class="divide-y divide-border border-y border-border">
								<div v-for="evidence in session.evidence" :key="evidence.id" class="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<h3 class="text-sm font-semibold">{{ evidence.name }}</h3>
											<DomStatusPill :tone="evidenceTone(evidence.status)" :label="evidence.statusLabel" size="sm" />
										</div>
										<p class="mt-2 text-sm leading-6 text-muted-fg">{{ evidence.description }}</p>
										<p class="mt-1 text-xs leading-5" :class="evidence.status === 'needs_retry' ? 'text-destructive' : 'text-muted-fg'">{{ evidence.providerMessage }}</p>
									</div>
									<DomButton v-if="evidence.status !== 'verified'" class="shrink-0" size="sm" variant="secondary" @click="openEvidenceCapture(evidence)">
										{{ evidence.status === 'needs_retry' ? 'Try again' : 'Start capture' }}
									</DomButton>
									<div v-else class="shrink-0 text-right text-xs text-muted-fg">
										<p>{{ titleCase(evidence.method) }}</p>
										<p class="mt-1">{{ formatDateTime(evidence.updatedAt) }}</p>
									</div>
								</div>
							</div>

							<div class="flex flex-col-reverse gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
								<DomButton variant="ghost" @click="selectStep('profile')">Back to details</DomButton>
								<DomButton :disabled="remainingEvidenceCount > 0" @click="selectStep('checks')">Continue to checks</DomButton>
							</div>
						</section>

						<section v-else-if="activeStep === 'checks'">
							<div class="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Step 3 of 4</p>
									<h2 class="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Consent and screening</h2>
									<p class="mt-2 max-w-xl text-sm leading-6 text-muted-fg">Confirm the declaration, then run the checks that travel with your review packet.</p>
								</div>
								<DomStatusPill :tone="stepIsComplete('checks') ? 'success' : 'warning'" :label="stepIsComplete('checks') ? 'Checks complete' : 'Action needed'" size="sm" />
							</div>

							<div class="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
								<div class="space-y-5">
									<DomSelect v-model="declarationDraft.pepExposure" label="Are you a politically exposed person?" :options="pepOptions" width="min-w-[20rem] max-w-[calc(100vw-3rem)]">
										<template #option="{ option }"><p class="font-medium">{{ option.label }}</p><p class="mt-1 text-xs opacity-75">{{ option.description }}</p></template>
									</DomSelect>
									<DomCheckbox
										v-model="declarationDraft.consentAccepted"
										label="I consent to identity verification"
										description="I agree to provider processing, screening, and evidence retention under identity terms 2026.08."
									/>
									<div class="flex flex-wrap gap-2">
										<DomButton variant="secondary" :loading="busy" :disabled="!declarationsDirty" @click="saveDeclarations">Save declaration</DomButton>
										<DomButton :loading="busy" :disabled="!declarationDraft.pepExposure" @click="runChecks">Run screening checks</DomButton>
									</div>
								</div>

								<div class="border-l-2 border-border pl-4">
									<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Current risk</p>
									<div class="mt-3 flex items-baseline gap-2">
										<p class="text-3xl font-semibold">{{ session.risk.score }}</p>
										<DomStatusPill :tone="riskTone(session.risk.level)" :label="titleCase(session.risk.level)" size="sm" />
									</div>
									<p class="mt-3 text-xs leading-5 text-muted-fg">{{ session.risk.explanation }}</p>
								</div>
							</div>

							<div class="divide-y divide-border border-y border-border">
								<div v-for="check in session.checks" :key="check.id" class="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
									<div>
										<p class="text-sm font-semibold">{{ check.name }}</p>
										<p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p>
									</div>
									<DomStatusPill :tone="checkTone(check.status)" :label="check.result" size="sm" />
								</div>
							</div>

							<div class="flex justify-end pt-5">
								<DomButton :disabled="!stepIsComplete('checks')" @click="selectStep('review')">Review packet</DomButton>
							</div>
						</section>

						<section v-else>
							<div class="border-b border-border pb-5">
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Step 4 of 4</p>
								<h2 class="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{{ sessionSubmitted ? 'Your verification is in review' : 'Review your packet' }}</h2>
								<p class="mt-2 max-w-xl text-sm leading-6 text-muted-fg">{{ sessionSubmitted ? 'Your submitted evidence and screening results are locked while the review team makes a decision.' : 'Check the four readiness gates before sending your evidence to manual review.' }}</p>
							</div>

							<DomAlert v-if="sessionSubmitted && receipt" class="my-5" tone="success" title="Packet submitted securely" :description="`${receipt.reviewLane} · decision expected by ${formatDateTime(receipt.estimatedDecisionAt)}`">
								<template #actions>
									<div class="mt-3 space-y-1 font-mono text-xs">
										<p>{{ receipt.packetId }}</p>
										<p class="break-all text-muted-fg">{{ receipt.checksum }}</p>
									</div>
								</template>
							</DomAlert>

							<div class="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
								<div class="divide-y divide-border border-y border-border">
									<div v-for="check in readinessChecks" :key="check.id" class="flex items-start justify-between gap-4 py-4">
										<div>
											<p class="text-sm font-semibold">{{ check.label }}</p>
											<p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p>
										</div>
										<DomStatusPill :tone="check.ready ? 'success' : 'warning'" :label="check.ready ? 'Ready' : 'Needed'" size="sm" />
									</div>
								</div>

								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Packet summary</p>
									<dl class="mt-4 space-y-3 text-sm">
										<div class="flex justify-between gap-3"><dt class="text-muted-fg">Applicant</dt><dd class="text-right font-semibold">{{ session.profile.firstName }} {{ session.profile.lastName }}</dd></div>
										<div class="flex justify-between gap-3"><dt class="text-muted-fg">Country</dt><dd class="font-semibold">{{ session.profile.country }}</dd></div>
										<div class="flex justify-between gap-3"><dt class="text-muted-fg">Evidence</dt><dd class="font-semibold">{{ verifiedEvidenceCount }}/{{ requiredEvidenceCount }}</dd></div>
										<div class="flex justify-between gap-3"><dt class="text-muted-fg">Risk</dt><dd class="font-semibold">{{ session.risk.score }} · {{ titleCase(session.risk.level) }}</dd></div>
									</dl>
								</div>
							</div>

							<div v-if="!sessionSubmitted" class="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
								<p class="text-xs leading-5 text-muted-fg">Submission locks the current evidence revision and creates a receipt.</p>
								<DomButton :disabled="!session.readiness.ready" @click="openSubmitReview">Submit for review</DomButton>
							</div>
						</section>
					</div>
				</div>
			</main>
		</div>

		<DomDialog v-model="captureOpen" :title="selectedEvidence ? `Capture ${selectedEvidence.name}` : 'Capture evidence'" description="Choose how to continue with the secure verification provider." size="lg">
			<DomAlert v-if="errorMessage" class="mb-5" tone="danger" title="Capture was not accepted" :description="errorMessage" />
			<DomRadioGroup v-model="captureMethod" label="Capture method" :options="captureMethodOptions">
				<template #option="{ option }">
					<span><span class="block font-medium">{{ option.label }}</span><span class="mt-1 block text-xs leading-5 text-muted-fg">{{ option.description }}</span></span>
				</template>
			</DomRadioGroup>
			<div class="mt-5 border-l-2 border-primary/40 pl-4 text-xs leading-5 text-muted-fg">
				<p class="font-semibold text-canvas-fg">Demo provider handoff</p>
				<p class="mt-1">The API returns evidence status, an opaque provider reference, capture method, and verification timestamp.</p>
			</div>
			<template #footer>
				<DomButton variant="secondary" @click="captureOpen = false">Cancel</DomButton>
				<DomButton :loading="busy" @click="captureEvidence">Start secure capture</DomButton>
			</template>
		</DomDialog>

		<DomDialog v-model="submitOpen" title="Submit verification packet?" description="The current profile, evidence references, consent, and screening results will be locked for manual review." size="lg">
			<DomAlert v-if="errorMessage" class="mb-5" tone="danger" title="Packet was not submitted" :description="errorMessage" />
			<div class="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
				<div class="bg-canvas p-4"><p class="text-xs text-muted-fg">Evidence</p><p class="mt-1 font-semibold">{{ verifiedEvidenceCount }} verified</p></div>
				<div class="bg-canvas p-4"><p class="text-xs text-muted-fg">Screening</p><p class="mt-1 font-semibold">{{ session?.checks?.filter((check) => check.status !== 'pending').length || 0 }} completed</p></div>
				<div class="bg-canvas p-4"><p class="text-xs text-muted-fg">Review lane</p><p class="mt-1 font-semibold">{{ session?.risk?.level === 'high' ? 'Enhanced' : 'Standard' }}</p></div>
			</div>
			<DomTextareaInput v-model="submissionNote" class="mt-5" label="Optional context for the reviewer" :rows="3" placeholder="Add information that may help the review." />
			<DomCheckbox v-model="submissionAcknowledged" class="mt-5" label="I reviewed the profile, evidence, and consent summary" description="This acknowledgement is included in the immutable packet receipt." />
			<template #footer>
				<DomButton variant="secondary" @click="submitOpen = false">Cancel</DomButton>
				<DomButton :loading="busy" @click="submitPacket">Submit packet</DomButton>
			</template>
		</DomDialog>

		<DomDrawer v-model="activityOpen" title="Session activity" side="right" width="min(94vw, 30rem)">
			<div class="p-4 sm:p-5">
				<div class="border-b border-border pb-4">
					<p class="text-sm font-semibold">{{ session?.activity?.length || 0 }} recorded events</p>
					<p class="mt-1 text-xs leading-5 text-muted-fg">Every saved step and provider result is attached to this session revision.</p>
				</div>
				<div class="divide-y divide-border">
					<div v-for="event in session?.activity || []" :key="event.id" class="py-4">
						<p class="text-sm font-semibold">{{ event.label }}</p>
						<p class="mt-1 text-xs text-muted-fg">{{ event.actor }} · {{ formatDateTime(event.createdAt) }}</p>
					</div>
				</div>
			</div>
		</DomDrawer>

		<DomDrawer v-model="helpOpen" title="Verification help" side="right" width="min(94vw, 28rem)">
			<div class="p-5">
				<div class="flex items-start justify-between gap-4 border-b border-border pb-5">
					<div>
						<h2 class="font-semibold">{{ bootstrap?.support?.title }}</h2>
						<p class="mt-2 text-sm leading-6 text-muted-fg">{{ bootstrap?.support?.description }}</p>
					</div>
					<DomIconButton :icon="closeIcon" label="Close help" variant="ghost" size="sm" @click="helpOpen = false" />
				</div>
				<div class="space-y-5 py-5 text-sm leading-6">
					<div><p class="font-semibold">Accepted address evidence</p><p class="mt-1 text-muted-fg">Use a bank statement, utility bill, or tax letter issued within the last 90 days.</p></div>
					<div><p class="font-semibold">Camera access</p><p class="mt-1 text-muted-fg">You can continue on another device if this browser cannot use a camera.</p></div>
					<div><p class="font-semibold">Support response</p><p class="mt-1 text-muted-fg">{{ bootstrap?.support?.availability }}</p></div>
				</div>
				<DomButton class="w-full" variant="secondary" :loading="busy" @click="requestSupport">Message verification support</DomButton>
			</div>
		</DomDrawer>
	</div>
</template>
