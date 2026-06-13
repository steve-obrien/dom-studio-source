<script setup>
import { computed, ref } from 'vue';
import {
	DomAccordion,
	DomButton,
	DomDialog,
	DomListbox,
	DomRadioGroup,
	DomToggle,
	DomTooltip,
} from '@getdom/studio/vue';
import PrivacyActionRow from '../components/PrivacyActionRow.vue';
import PrivacySignal from '../components/PrivacySignal.vue';

const visibilityOptions = [
	{
		label: 'Private profile',
		value: 'private',
		description: 'Only you and workspace admins can see personal profile fields.',
		meta: 'Most restrictive',
	},
	{
		label: 'Team visible',
		value: 'team',
		description: 'People in your workspace can see profile basics and collaboration presence.',
		meta: 'Recommended',
	},
	{
		label: 'Discoverable',
		value: 'discoverable',
		description: 'Team members can find you in people search, suggestions, and shared directories.',
		meta: 'Higher sharing',
	},
];

const retentionOptions = [
	{
		label: '90 days',
		value: '90-days',
		description: 'Short retention for activity, recommendation, and product analytics events.',
		risk: 'Low data footprint',
	},
	{
		label: '12 months',
		value: '12-months',
		description: 'Balanced retention for auditability, recommendations, and support context.',
		risk: 'Balanced default',
	},
	{
		label: 'Until account deletion',
		value: 'account-lifetime',
		description: 'Retain activity until the account is closed or a deletion request completes.',
		risk: 'Maximum history',
	},
];

const exportOptions = [
	{
		label: 'Portable JSON',
		value: 'portable-json',
		description: 'Structured profile, consent, workspace, and activity data for migration.',
		meta: 'Best for APIs',
	},
	{
		label: 'Readable archive',
		value: 'readable-archive',
		description: 'HTML and CSV files that users can inspect without developer tooling.',
		meta: 'Best for people',
	},
	{
		label: 'Account summary PDF',
		value: 'summary-pdf',
		description: 'Compact identity, billing, consent, and privacy request summary.',
		meta: 'Best for records',
	},
];

const consentControls = ref([
	{
		key: 'productAnalytics',
		label: 'Product analytics',
		description: 'Measure feature usage, reliability, and activation trends.',
		enabled: true,
		required: false,
		impact: 'Improves product quality',
	},
	{
		key: 'personalization',
		label: 'Personalized recommendations',
		description: 'Use activity patterns to rank suggestions, templates, and shortcuts.',
		enabled: true,
		required: false,
		impact: 'Improves relevance',
	},
	{
		key: 'marketing',
		label: 'Lifecycle education',
		description: 'Send product education, lifecycle messages, surveys, and beta invitations.',
		enabled: false,
		required: false,
		impact: 'Optional outreach',
	},
	{
		key: 'thirdPartyEnrichment',
		label: 'Third-party enrichment',
		description: 'Attach company firmographic data from approved processors.',
		enabled: false,
		required: false,
		impact: 'Higher data sharing',
	},
	{
		key: 'securityOperations',
		label: 'Security and fraud processing',
		description: 'Process sign-in, abuse, billing, and access signals needed to protect the account.',
		enabled: true,
		required: true,
		impact: 'Required protection',
	},
]);

const privacyNotes = [
	{
		title: 'Consent changes should be versioned',
		content: 'Store consent decisions with policy version, locale, region, actor, timestamp, and source surface so future audits can explain exactly what changed.',
	},
	{
		title: 'Required processing still needs explanation',
		content: 'Required security, billing, legal, and fraud controls can stay locked, but the UI should explain why they cannot be disabled and where users can read more.',
	},
	{
		title: 'Data rights are asynchronous workflows',
		content: 'Export, deletion, and profiling reset actions usually become backend jobs with email confirmation, rate limits, identity checks, and download expiry.',
	},
];

const profileVisibility = ref('team');
const activityRetention = ref('12-months');
const exportFormat = ref('portable-json');
const saveState = ref('synced');
const requestDialogOpen = ref(false);
const selectedRequest = ref(null);
const lastRequest = ref('No privacy job requested yet');

const enabledOptionalControls = computed(() => consentControls.value.filter((control) => control.enabled && !control.required).length);
const disabledOptionalControls = computed(() => consentControls.value.filter((control) => !control.enabled && !control.required).length);
const highSharingCount = computed(() => {
	let count = consentControls.value.filter((control) => control.enabled && ['marketing', 'thirdPartyEnrichment'].includes(control.key)).length;
	if (profileVisibility.value === 'discoverable') count += 1;
	if (activityRetention.value === 'account-lifetime') count += 1;
	return count;
});
const protectionScore = computed(() => Math.max(58, 96 - (highSharingCount.value * 8) - (enabledOptionalControls.value * 2)));
const saveSummary = computed(() => ({
	profileVisibility: profileVisibility.value,
	activityRetention: activityRetention.value,
	exportFormat: exportFormat.value,
	enabledConsent: Object.fromEntries(consentControls.value.map((control) => [control.key, control.enabled])),
}));
const selectedRequestDescription = computed(() => selectedRequest.value?.description || 'Confirm this privacy request before creating a backend job.');
const scoreTone = computed(() => {
	if (protectionScore.value >= 86) return 'success';
	if (protectionScore.value >= 74) return 'warning';
	return 'destructive';
});

function markUnsaved() {
	saveState.value = 'unsaved';
}

function saveChanges() {
	saveState.value = 'saved';
}

function restoreDefaults() {
	profileVisibility.value = 'team';
	activityRetention.value = '12-months';
	exportFormat.value = 'portable-json';
	for (const control of consentControls.value) {
		control.enabled = ['productAnalytics', 'personalization', 'securityOperations'].includes(control.key);
	}
	saveState.value = 'unsaved';
}

function openRequest(type) {
	const requests = {
		export: {
			title: 'Request data export',
			description: `Create a ${exportFormat.value} export job for profile, consent, workspace, and activity data.`,
			confirm: 'Queue export',
		},
		reset: {
			title: 'Reset personalization profile',
			description: 'Clear recommendation signals while preserving required account, security, billing, and audit records.',
			confirm: 'Reset profile',
		},
		delete: {
			title: 'Start deletion request',
			description: 'Create a deletion review job. The backend should verify identity, legal holds, billing state, and workspace ownership before deleting data.',
			confirm: 'Start request',
			destructive: true,
		},
	};
	selectedRequest.value = requests[type];
	requestDialogOpen.value = true;
}

function confirmRequest() {
	lastRequest.value = `${selectedRequest.value.title} queued`;
	requestDialogOpen.value = false;
}
</script>

<template>
	<div class="w-full overflow-hidden border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-5 py-5 sm:px-7">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase text-muted-fg">Account settings</p>
					<h3 class="mt-2 text-2xl font-semibold">Privacy control center</h3>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
						Give users a clear place to manage consent, profile visibility, retention, exports, and sensitive privacy requests.
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<span
						class="rounded-full px-3 py-1 text-xs font-semibold"
						:class="saveState === 'unsaved' ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'"
					>
						{{ saveState === 'unsaved' ? 'Unsaved changes' : saveState === 'saved' ? 'Privacy saved' : 'Synced with policy' }}
					</span>
					<DomTooltip text="Reset optional controls and policy choices to the workspace defaults.">
						<DomButton variant="secondary" size="sm" @click="restoreDefaults">Restore defaults</DomButton>
					</DomTooltip>
					<DomButton size="sm" @click="saveChanges">Save privacy settings</DomButton>
				</div>
			</div>

			<div class="mt-5 grid gap-3 md:grid-cols-3">
				<PrivacySignal
					label="Protection score"
					:value="`${protectionScore}%`"
					:tone="scoreTone"
					description="Falls as more optional sharing controls are enabled."
				/>
				<PrivacySignal
					label="Optional controls off"
					:value="disabledOptionalControls"
					tone="neutral"
					description="User-controlled consent areas currently disabled."
				/>
				<PrivacySignal
					label="High sharing choices"
					:value="highSharingCount"
					:tone="highSharingCount > 1 ? 'warning' : 'success'"
					description="Marketing, enrichment, discoverability, or long retention."
				/>
			</div>
		</header>

		<main class="grid gap-0">
			<section class="border-b border-border px-5 py-6 sm:px-7">
				<div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
					<div>
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<h4 class="text-lg font-semibold">Profile visibility</h4>
								<p class="mt-1 text-sm leading-6 text-muted-fg">
									Control how much of the profile is discoverable inside the product.
								</p>
							</div>
						</div>
						<DomRadioGroup
							v-model="profileVisibility"
							class="mt-4"
							label="Profile visibility"
							:options="visibilityOptions"
							@update:model-value="markUnsaved"
						>
							<template #option="{ option }">
								<span class="min-w-0">
									<span class="block font-semibold">{{ option.label }}</span>
									<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ option.description }}</span>
								</span>
								<span class="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-fg">
									{{ option.meta }}
								</span>
							</template>
						</DomRadioGroup>
					</div>

					<div class="border border-border bg-secondary/40 p-4">
						<h5 class="font-semibold">Review payload</h5>
						<p class="mt-1 text-sm leading-6 text-muted-fg">
							Show a compact version of the data you will persist before the user saves.
						</p>
						<pre class="mt-3 max-h-48 overflow-auto bg-canvas p-3 text-xs leading-5 text-muted-fg">{{ saveSummary }}</pre>
					</div>
				</div>
			</section>

			<section class="border-b border-border px-5 py-6 sm:px-7">
				<div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h4 class="text-lg font-semibold">Consent controls</h4>
						<p class="mt-1 text-sm leading-6 text-muted-fg">
							Let users opt in or out while preserving processing needed for safety and account operations.
						</p>
					</div>
					<p class="text-sm font-medium text-muted-fg">{{ enabledOptionalControls }} optional enabled</p>
				</div>

				<div class="mt-4 border-y border-border">
					<div
						v-for="control in consentControls"
						:key="control.key"
						class="grid gap-3 border-b border-border py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_13rem_8rem] md:items-center"
					>
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<h5 class="font-semibold">{{ control.label }}</h5>
								<span v-if="control.required" class="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
									Required
								</span>
							</div>
							<p class="mt-1 text-sm leading-6 text-muted-fg">{{ control.description }}</p>
						</div>
						<p class="text-sm text-muted-fg">{{ control.impact }}</p>
						<div class="flex md:justify-end">
							<DomToggle
								v-model="control.enabled"
								:label="control.enabled ? 'On' : 'Off'"
								:description="control.required ? 'Locked' : ''"
								:disabled="control.required"
								@update:model-value="markUnsaved"
							/>
						</div>
					</div>
				</div>
			</section>

			<section class="border-b border-border px-5 py-6 sm:px-7">
				<div class="grid gap-5 lg:grid-cols-2">
					<div>
						<h4 class="text-lg font-semibold">Retention window</h4>
						<p class="mt-1 text-sm leading-6 text-muted-fg">
							Choose how long activity and recommendation signals remain available.
						</p>
						<DomListbox
							v-model="activityRetention"
							class="mt-4"
							label="Activity retention"
							:options="retentionOptions"
							@update:model-value="markUnsaved"
						>
							<template #option="{ option }">
								<span class="flex min-w-0 items-start justify-between gap-3">
									<span class="min-w-0">
										<span class="block font-semibold">{{ option.label }}</span>
										<span class="mt-1 block text-xs leading-5 opacity-80">{{ option.description }}</span>
									</span>
									<span class="shrink-0 text-xs font-semibold opacity-80">{{ option.risk }}</span>
								</span>
							</template>
						</DomListbox>
					</div>

					<div>
						<h4 class="text-lg font-semibold">Export format</h4>
						<p class="mt-1 text-sm leading-6 text-muted-fg">
							Offer formats that support both human review and account portability.
						</p>
						<DomListbox
							v-model="exportFormat"
							class="mt-4"
							label="Export format"
							:options="exportOptions"
							@update:model-value="markUnsaved"
						>
							<template #option="{ option }">
								<span class="flex min-w-0 items-start justify-between gap-3">
									<span class="min-w-0">
										<span class="block font-semibold">{{ option.label }}</span>
										<span class="mt-1 block text-xs leading-5 opacity-80">{{ option.description }}</span>
									</span>
									<span class="shrink-0 text-xs font-semibold opacity-80">{{ option.meta }}</span>
								</span>
							</template>
						</DomListbox>
					</div>
				</div>
			</section>

			<section class="border-b border-border px-5 py-6 sm:px-7">
				<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
					<div>
						<h4 class="text-lg font-semibold">Data rights actions</h4>
						<p class="mt-1 text-sm leading-6 text-muted-fg">
							Move sensitive privacy actions into explicit confirmation jobs instead of silent client-only state changes.
						</p>
						<div class="mt-4 border-y border-border">
							<PrivacyActionRow
								title="Download account data"
								description="Create an export job using the selected format and notify the user when the archive is ready."
								status="Available"
								status-tone="success"
								action-label="Request export"
								@action="openRequest('export')"
							/>
							<PrivacyActionRow
								title="Reset recommendation profile"
								description="Clear personalization signals while keeping required operational, security, and billing records."
								status="No open job"
								action-label="Reset"
								@action="openRequest('reset')"
							/>
							<PrivacyActionRow
								title="Start account data deletion"
								description="Begin an auditable deletion workflow with identity checks, ownership review, legal holds, and cancellation windows."
								status="Sensitive"
								status-tone="destructive"
								action-label="Start request"
								destructive
								@action="openRequest('delete')"
							/>
						</div>
					</div>

					<div class="border border-border bg-secondary/40 p-4">
						<h5 class="font-semibold">Latest request</h5>
						<p class="mt-2 text-sm leading-6 text-muted-fg">{{ lastRequest }}</p>
						<div class="mt-4 border-t border-border pt-4">
							<h5 class="font-semibold">Policy explainers</h5>
							<DomAccordion class="mt-3" :items="privacyNotes" multiple />
						</div>
					</div>
				</div>
			</section>
		</main>

		<div class="sticky bottom-0 flex flex-col gap-3 border-t border-border skin-popover px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
			<p class="text-sm leading-6 text-muted-fg">
				Effective policy <span class="font-semibold text-canvas-fg">privacy-2026-05</span> for region <span class="font-semibold text-canvas-fg">GB</span>.
			</p>
			<div class="flex flex-wrap gap-2">
				<DomButton variant="secondary" @click="restoreDefaults">Restore defaults</DomButton>
				<DomButton @click="saveChanges">Save privacy settings</DomButton>
			</div>
		</div>

		<DomDialog
			v-model="requestDialogOpen"
			:title="selectedRequest?.title || 'Confirm privacy request'"
			:description="selectedRequestDescription"
		>
			<div class="space-y-3 text-sm leading-6 text-muted-fg">
				<p>
					This should create a backend job, notify the user, and store an audit event with the current policy version.
				</p>
				<div class="border border-border bg-secondary/40 p-3">
					<p class="font-semibold text-canvas-fg">Job context</p>
					<p class="mt-1">Export format: {{ exportFormat }}</p>
					<p>Retention window: {{ activityRetention }}</p>
					<p>Visibility: {{ profileVisibility }}</p>
				</div>
			</div>
			<template #footer>
				<DomButton variant="secondary" data-close>Cancel</DomButton>
				<DomButton :variant="selectedRequest?.destructive ? 'danger' : 'primary'" @click="confirmRequest">
					{{ selectedRequest?.confirm || 'Confirm' }}
				</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
