<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomCheckbox, DomNativeSelect, DomTextInput, DomTextareaInput, DomToggle } from '@getdom/studio/vue';

const steps = [
	{ id: 'profile', label: 'Profile', description: 'Legal identity and contact details' },
	{ id: 'documents', label: 'Evidence', description: 'Document and liveness capture' },
	{ id: 'checks', label: 'Checks', description: 'Consent, risk signals, and review notes' },
	{ id: 'review', label: 'Review', description: 'Submit a complete verification packet' },
];

const verificationTypes = [
	{ label: 'Individual customer', value: 'individual' },
	{ label: 'Business owner', value: 'business_owner' },
	{ label: 'Marketplace seller', value: 'seller' },
];

const countries = [
	{ label: 'United Kingdom', value: 'GB' },
	{ label: 'United States', value: 'US' },
	{ label: 'Ireland', value: 'IE' },
	{ label: 'Germany', value: 'DE' },
];

const documentTypes = [
	{ label: 'Passport', value: 'passport' },
	{ label: 'Driving licence', value: 'driving_licence' },
	{ label: 'National ID card', value: 'national_id' },
];

const captureMethods = [
	{ label: 'Upload', value: 'upload' },
	{ label: 'Camera', value: 'camera' },
	{ label: 'Provider link', value: 'provider_link' },
];

const activeStepId = ref('profile');
const verificationType = ref('individual');
const country = ref('GB');
const documentType = ref('passport');
const captureMethod = ref('upload');
const consentAccepted = ref(true);
const politicallyExposed = ref(false);
const submitState = ref('draft');
const selectedDocumentId = ref('identity');
const reviewerNotes = ref('Applicant is onboarding for GBP payouts. Address proof should match the payout country before approval.');

const profile = ref({
	firstName: 'Maya',
	lastName: 'Hart',
	email: 'maya@example.com',
	dateOfBirth: '1991-04-18',
	addressLine: '24 Leather Lane',
	city: 'London',
	postcode: 'EC1N 7SU',
});

const documents = ref([
	{
		id: 'identity',
		name: 'Government ID',
		status: 'Complete',
		detail: 'Passport front and details page captured.',
		fileName: 'passport-front.jpg',
		required: true,
	},
	{
		id: 'address',
		name: 'Proof of address',
		status: 'Needs upload',
		detail: 'Utility bill, bank statement, or tax letter from the last 90 days.',
		fileName: '',
		required: true,
	},
	{
		id: 'selfie',
		name: 'Selfie liveness',
		status: 'Reviewing',
		detail: 'Face match is processing with the identity provider.',
		fileName: 'liveness-session-1842',
		required: true,
	},
]);

const activityEvents = [
	{ label: 'Identity document accepted', actor: 'Verification provider', time: 'Today 17:42' },
	{ label: 'Profile details saved', actor: 'Maya Hart', time: 'Today 17:38' },
	{ label: 'Verification session created', actor: 'Onboarding API', time: 'Today 17:34' },
];

const activeStepIndex = computed(() => Math.max(0, steps.findIndex((step) => step.id === activeStepId.value)));
const selectedDocument = computed(() => documents.value.find((document) => document.id === selectedDocumentId.value) || documents.value[0]);
const profileReady = computed(() => Object.values(profile.value).every((value) => String(value).trim().length > 0));
const evidenceReady = computed(() => documents.value.every((document) => document.status !== 'Needs upload'));
const completedDocumentCount = computed(() => documents.value.filter((document) => document.status === 'Complete').length);
const riskScore = computed(() => {
	let score = 24;
	if (!evidenceReady.value) score += 22;
	if (politicallyExposed.value) score += 26;
	if (verificationType.value !== 'individual') score += 8;
	if (country.value !== 'GB') score += 6;
	return Math.min(score, 100);
});
const riskLabel = computed(() => {
	if (riskScore.value < 35) return 'Low';
	if (riskScore.value < 65) return 'Review';
	return 'High';
});
const riskTone = computed(() => {
	if (riskScore.value < 35) return 'text-success';
	if (riskScore.value < 65) return 'text-warning';
	return 'text-destructive';
});
const readinessChecks = computed(() => [
	{
		label: 'Profile details complete',
		detail: profileReady.value ? `${profile.value.firstName} ${profile.value.lastName}` : 'Missing required profile fields',
		ready: profileReady.value,
	},
	{
		label: 'Required evidence captured',
		detail: `${documents.value.filter((document) => document.status !== 'Needs upload').length} of ${documents.value.length} evidence items started`,
		ready: evidenceReady.value,
	},
	{
		label: 'Consent accepted',
		detail: consentAccepted.value ? 'KYC consent version 2026.02 accepted' : 'Consent is required before submission',
		ready: consentAccepted.value,
	},
	{
		label: 'Risk under manual review threshold',
		detail: `${riskLabel.value} risk score: ${riskScore.value}`,
		ready: riskScore.value < 65,
	},
]);
const readyCheckCount = computed(() => readinessChecks.value.filter((check) => check.ready).length);
const completionPercent = computed(() => Math.round((readyCheckCount.value / readinessChecks.value.length) * 100));
const completionWidth = computed(() => `${completionPercent.value}%`);
const canSubmit = computed(() => readinessChecks.value.every((check) => check.ready) && submitState.value !== 'submitted');
const statusLabel = computed(() => {
	if (submitState.value === 'submitted') return 'Submitted';
	if (canSubmit.value) return 'Ready to submit';
	return 'Needs details';
});
const riskSignals = computed(() => [
	{ label: 'Sanctions screen', value: 'Clear', tone: 'success', detail: 'No list matches found for applicant or address.' },
	{ label: 'Duplicate identity', value: evidenceReady.value ? 'Review' : 'Waiting', tone: evidenceReady.value ? 'warning' : 'muted', detail: 'One similar account uses the same payout country.' },
	{ label: 'PEP declaration', value: politicallyExposed.value ? 'Declared' : 'Clear', tone: politicallyExposed.value ? 'warning' : 'success', detail: politicallyExposed.value ? 'Route to enhanced due diligence.' : 'No PEP exposure declared.' },
	{ label: 'Device integrity', value: 'Clear', tone: 'success', detail: 'Session completed from a trusted browser context.' },
]);

function selectStep(id) {
	activeStepId.value = id;
}

function stepIsComplete(id) {
	if (id === 'profile') return profileReady.value;
	if (id === 'documents') return evidenceReady.value;
	if (id === 'checks') return consentAccepted.value && riskScore.value < 65;
	if (id === 'review') return submitState.value === 'submitted';
	return false;
}

function selectDocument(id) {
	selectedDocumentId.value = id;
	activeStepId.value = 'documents';
}

function markSelectedDocumentComplete() {
	const document = selectedDocument.value;
	document.status = 'Complete';
	document.fileName = `${document.id}-evidence.jpg`;
	document.detail = `${document.name} captured by ${captureMethods.find((method) => method.value === captureMethod.value)?.label || 'Upload'}.`;
	submitState.value = 'draft';
}

function previousStep() {
	const index = activeStepIndex.value - 1;
	if (index >= 0) activeStepId.value = steps[index].id;
}

function nextStep() {
	const index = activeStepIndex.value + 1;
	if (index < steps.length) activeStepId.value = steps[index].id;
}

function submitVerification() {
	if (!canSubmit.value) return;
	submitState.value = 'submitted';
	activeStepId.value = 'review';
}

function toneClasses(tone) {
	if (tone === 'success') return 'bg-success/15 text-success';
	if (tone === 'warning') return 'bg-warning/15 text-warning';
	if (tone === 'danger') return 'bg-destructive/15 text-destructive';
	return 'bg-secondary text-muted-fg';
}
</script>

<template>
	<div class="w-full max-w-7xl overflow-hidden rounded-lg border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-raised px-5 py-5 sm:px-7">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Identity verification</p>
					<h3 class="mt-2 text-2xl font-semibold tracking-tight">Verify Maya Hart</h3>
					<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">
						Collect applicant details, required evidence, consent, and risk signals before sending the verification packet to review.
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<span
						class="rounded-full px-3 py-1 text-xs font-semibold"
						:class="submitState === 'submitted' ? 'bg-success/15 text-success' : canSubmit ? 'bg-primary/15 text-primary' : 'bg-warning/15 text-warning'"
					>
						{{ statusLabel }}
					</span>
					<DomButton variant="secondary" size="sm" @click="activeStepId = 'checks'">Review checks</DomButton>
					<DomButton size="sm" :disabled="!canSubmit" @click="submitVerification">Submit packet</DomButton>
				</div>
			</div>
		</header>

		<section class="grid border-b border-border bg-secondary/20 text-sm sm:grid-cols-3">
			<div class="border-b border-border px-5 py-4 sm:border-b-0 sm:border-r">
				<p class="text-xs font-medium text-muted-fg">Readiness</p>
				<div class="mt-2 flex items-end justify-between gap-3">
					<p class="text-2xl font-semibold tracking-tight">{{ completionPercent }}%</p>
					<p class="text-xs text-muted-fg">{{ readyCheckCount }} of {{ readinessChecks.length }} checks</p>
				</div>
				<div class="mt-3 h-2 overflow-hidden rounded-full bg-background">
					<div class="h-full rounded-full bg-primary" :style="{ width: completionWidth }"></div>
				</div>
			</div>
			<div class="border-b border-border px-5 py-4 sm:border-b-0 sm:border-r">
				<p class="text-xs font-medium text-muted-fg">Evidence</p>
				<p class="mt-2 text-2xl font-semibold tracking-tight">{{ completedDocumentCount }}/{{ documents.length }}</p>
				<p class="mt-1 text-xs text-muted-fg">Complete documents, uploads, and liveness capture</p>
			</div>
			<div class="px-5 py-4">
				<p class="text-xs font-medium text-muted-fg">Risk</p>
				<p class="mt-2 text-2xl font-semibold tracking-tight" :class="riskTone">{{ riskLabel }} {{ riskScore }}</p>
				<p class="mt-1 text-xs text-muted-fg">Sanctions, PEP, duplicate, and device signals</p>
			</div>
		</section>

		<div class="grid lg:grid-cols-[18rem_minmax(0,1fr)_22rem]">
			<aside class="border-b border-border bg-secondary/30 lg:border-b-0 lg:border-r">
				<div class="px-5 py-4">
					<h4 class="text-sm font-semibold">Verification steps</h4>
					<p class="mt-1 text-xs leading-5 text-muted-fg">Use as a guided flow or keep visible for reviewer navigation.</p>
				</div>
				<nav class="grid">
					<button
						v-for="(step, index) in steps"
						:key="step.id"
						type="button"
						class="border-t border-border px-5 py-4 text-left transition hover:bg-background/70"
						:class="activeStepId === step.id ? 'bg-background' : ''"
						@click="selectStep(step.id)"
					>
						<div class="flex items-start gap-3">
							<span
								class="grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold"
								:class="stepIsComplete(step.id) ? 'border-success/30 bg-success/15 text-success' : activeStepId === step.id ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border bg-background text-muted-fg'"
							>
								{{ stepIsComplete(step.id) ? 'OK' : index + 1 }}
							</span>
							<span class="min-w-0">
								<span class="block text-sm font-semibold">{{ step.label }}</span>
								<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ step.description }}</span>
							</span>
						</div>
					</button>
				</nav>
				<div class="border-t border-border px-5 py-4 text-xs leading-5 text-muted-fg">
					<p class="font-semibold text-fg">Packet ID ver_2048</p>
					<p class="mt-1">Provider session expires in 42 minutes.</p>
				</div>
			</aside>

			<main class="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
				<section v-if="activeStepId === 'profile'" class="p-5 sm:p-6">
					<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<h4 class="text-lg font-semibold tracking-tight">Applicant profile</h4>
							<p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">Collect the legal identity fields your provider or compliance team needs before starting evidence checks.</p>
						</div>
						<span class="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-fg">
							{{ verificationType.replace('_', ' ') }}
						</span>
					</div>

					<div class="mt-6 grid gap-4 md:grid-cols-2">
						<DomNativeSelect v-model="verificationType" label="Verification type" :options="verificationTypes" placeholder="" />
						<DomNativeSelect v-model="country" label="Country of residence" :options="countries" placeholder="" />
						<DomTextInput v-model="profile.firstName" label="Legal first name" autocomplete="given-name" />
						<DomTextInput v-model="profile.lastName" label="Legal last name" autocomplete="family-name" />
						<DomTextInput v-model="profile.email" label="Email address" type="email" autocomplete="email" />
						<DomTextInput v-model="profile.dateOfBirth" label="Date of birth" type="date" />
						<DomTextInput v-model="profile.addressLine" label="Address line" autocomplete="address-line1" />
						<DomTextInput v-model="profile.city" label="City" autocomplete="address-level2" />
						<DomTextInput v-model="profile.postcode" label="Postcode" autocomplete="postal-code" />
						<DomNativeSelect v-model="documentType" label="Preferred ID document" :options="documentTypes" placeholder="" />
					</div>
				</section>

				<section v-else-if="activeStepId === 'documents'" class="p-5 sm:p-6">
					<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<h4 class="text-lg font-semibold tracking-tight">Evidence capture</h4>
							<p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">Let users upload, scan, or complete provider-hosted evidence while keeping reviewers aware of each item state.</p>
						</div>
						<div class="inline-grid grid-cols-3 overflow-hidden rounded-full border border-border bg-secondary p-1 text-xs font-semibold">
							<button
								v-for="method in captureMethods"
								:key="method.value"
								type="button"
								class="rounded-full px-3 py-1.5 transition"
								:class="captureMethod === method.value ? 'bg-background text-fg shadow-sm' : 'text-muted-fg hover:text-fg'"
								@click="captureMethod = method.value"
							>
								{{ method.label }}
							</button>
						</div>
					</div>

					<div class="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
						<div class="overflow-hidden rounded-lg border border-border">
							<button
								v-for="document in documents"
								:key="document.id"
								type="button"
								class="grid w-full gap-2 border-t border-border px-4 py-4 text-left first:border-t-0 transition hover:bg-secondary/40 sm:grid-cols-[minmax(0,1fr)_auto]"
								:class="selectedDocumentId === document.id ? 'bg-secondary/50' : 'bg-background'"
								@click="selectDocument(document.id)"
							>
								<span class="min-w-0">
									<span class="flex flex-wrap items-center gap-2">
										<span class="font-semibold">{{ document.name }}</span>
										<span v-if="document.required" class="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">Required</span>
									</span>
									<span class="mt-1 block text-sm leading-6 text-muted-fg">{{ document.detail }}</span>
									<span v-if="document.fileName" class="mt-2 block text-xs font-medium text-muted-fg">{{ document.fileName }}</span>
								</span>
								<span
									class="h-fit rounded-full px-2.5 py-1 text-xs font-semibold"
									:class="document.status === 'Complete' ? 'bg-success/15 text-success' : document.status === 'Reviewing' ? 'bg-warning/15 text-warning' : 'bg-secondary text-muted-fg'"
								>
									{{ document.status }}
								</span>
							</button>
						</div>

						<div class="border border-border bg-secondary/30 p-4">
							<p class="text-sm font-semibold">{{ selectedDocument.name }}</p>
							<p class="mt-2 text-sm leading-6 text-muted-fg">{{ selectedDocument.detail }}</p>
							<div class="mt-4 grid min-h-36 place-items-center border border-dashed border-border bg-background p-4 text-center">
								<div>
									<p class="text-sm font-semibold">{{ captureMethods.find((method) => method.value === captureMethod)?.label }} evidence</p>
									<p class="mt-1 text-xs leading-5 text-muted-fg">Connect this action to secure upload, camera capture, or a provider-hosted session.</p>
								</div>
							</div>
							<DomButton class="mt-4 w-full" variant="secondary" @click="markSelectedDocumentComplete">
								Mark evidence captured
							</DomButton>
						</div>
					</div>
				</section>

				<section v-else-if="activeStepId === 'checks'" class="p-5 sm:p-6">
					<div>
						<h4 class="text-lg font-semibold tracking-tight">Risk checks and consent</h4>
						<p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">Expose risk signals in plain language and collect the declarations required before compliance review.</p>
					</div>

					<div class="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
						<div class="overflow-hidden rounded-lg border border-border">
							<div
								v-for="signal in riskSignals"
								:key="signal.label"
								class="grid gap-2 border-t border-border px-4 py-4 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto]"
							>
								<div>
									<p class="font-semibold">{{ signal.label }}</p>
									<p class="mt-1 text-sm leading-6 text-muted-fg">{{ signal.detail }}</p>
								</div>
								<span class="h-fit rounded-full px-2.5 py-1 text-xs font-semibold" :class="toneClasses(signal.tone)">
									{{ signal.value }}
								</span>
							</div>
						</div>

						<div class="space-y-5">
							<div class="border border-border bg-secondary/30 p-4">
								<DomToggle
									v-model="politicallyExposed"
									label="Politically exposed person"
									description="Route declared exposure to enhanced due diligence."
								/>
							</div>
							<div class="border border-border bg-secondary/30 p-4">
								<DomCheckbox
									v-model="consentAccepted"
									label="Verification consent accepted"
									description="Applicant agrees to identity checks, provider processing, and document retention policy."
								/>
							</div>
							<DomTextareaInput
								v-model="reviewerNotes"
								label="Reviewer notes"
								:rows="5"
								placeholder="Add context for manual review."
							/>
						</div>
					</div>
				</section>

				<section v-else class="p-5 sm:p-6">
					<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<h4 class="text-lg font-semibold tracking-tight">Submit verification packet</h4>
							<p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">Review readiness and submit a single packet to your provider, compliance queue, or onboarding API.</p>
						</div>
						<span
							class="rounded-full px-3 py-1 text-xs font-semibold"
							:class="submitState === 'submitted' ? 'bg-success/15 text-success' : canSubmit ? 'bg-primary/15 text-primary' : 'bg-warning/15 text-warning'"
						>
							{{ statusLabel }}
						</span>
					</div>

					<div class="mt-6 overflow-hidden rounded-lg border border-border">
						<div
							v-for="check in readinessChecks"
							:key="check.label"
							class="grid gap-2 border-t border-border px-4 py-4 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto]"
						>
							<div>
								<p class="font-semibold">{{ check.label }}</p>
								<p class="mt-1 text-sm leading-6 text-muted-fg">{{ check.detail }}</p>
							</div>
							<span
								class="h-fit rounded-full px-2.5 py-1 text-xs font-semibold"
								:class="check.ready ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
							>
								{{ check.ready ? 'Ready' : 'Needed' }}
							</span>
						</div>
					</div>

					<div class="mt-6 border border-border bg-secondary/30 p-4">
						<p class="text-sm font-semibold">Packet summary</p>
						<div class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
							<div>
								<p class="text-muted-fg">Applicant</p>
								<p class="mt-1 font-semibold">{{ profile.firstName }} {{ profile.lastName }}</p>
							</div>
							<div>
								<p class="text-muted-fg">Country</p>
								<p class="mt-1 font-semibold">{{ country }}</p>
							</div>
							<div>
								<p class="text-muted-fg">Evidence items</p>
								<p class="mt-1 font-semibold">{{ documents.filter((document) => document.status !== 'Needs upload').length }} attached</p>
							</div>
							<div>
								<p class="text-muted-fg">Risk score</p>
								<p class="mt-1 font-semibold" :class="riskTone">{{ riskScore }}</p>
							</div>
						</div>
						<DomButton class="mt-5 w-full sm:w-auto" :disabled="!canSubmit" @click="submitVerification">
							{{ submitState === 'submitted' ? 'Packet submitted' : 'Submit for review' }}
						</DomButton>
					</div>
				</section>

				<div class="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
					<DomButton variant="ghost" :disabled="activeStepIndex === 0" @click="previousStep">Back</DomButton>
					<DomButton variant="secondary" :disabled="activeStepIndex === steps.length - 1" @click="nextStep">Continue</DomButton>
				</div>
			</main>

			<aside class="bg-secondary/20">
				<section class="border-b border-border p-5">
					<div class="flex items-start justify-between gap-3">
						<div>
							<h4 class="text-sm font-semibold">Applicant packet</h4>
							<p class="mt-1 text-xs leading-5 text-muted-fg">Live summary for resume, review, and support handoff.</p>
						</div>
						<span class="rounded-full bg-background px-2 py-1 text-xs font-semibold text-muted-fg">KYC</span>
					</div>
					<div class="mt-4 space-y-3 text-sm">
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Name</span>
							<span class="font-semibold">{{ profile.firstName }} {{ profile.lastName }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Email</span>
							<span class="truncate font-semibold">{{ profile.email }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Type</span>
							<span class="font-semibold">{{ verificationType.replace('_', ' ') }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Country</span>
							<span class="font-semibold">{{ country }}</span>
						</div>
					</div>
				</section>

				<section class="border-b border-border p-5">
					<h4 class="text-sm font-semibold">Required evidence</h4>
					<div class="mt-4 grid gap-3">
						<button
							v-for="document in documents"
							:key="document.id"
							type="button"
							class="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-3 text-left transition hover:border-primary/40"
							@click="selectDocument(document.id)"
						>
							<span class="min-w-0">
								<span class="block truncate text-sm font-semibold">{{ document.name }}</span>
								<span class="mt-0.5 block text-xs text-muted-fg">{{ document.status }}</span>
							</span>
							<span
								class="size-2.5 shrink-0 rounded-full"
								:class="document.status === 'Complete' ? 'bg-success' : document.status === 'Reviewing' ? 'bg-warning' : 'bg-muted-fg'"
							></span>
						</button>
					</div>
				</section>

				<section class="p-5">
					<h4 class="text-sm font-semibold">Activity history</h4>
					<div class="mt-4 space-y-4">
						<div v-for="event in activityEvents" :key="event.label" class="border-l-2 border-border pl-3">
							<p class="text-sm font-semibold">{{ event.label }}</p>
							<p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.actor }} - {{ event.time }}</p>
						</div>
					</div>
				</section>
			</aside>
		</div>
	</div>
</template>
