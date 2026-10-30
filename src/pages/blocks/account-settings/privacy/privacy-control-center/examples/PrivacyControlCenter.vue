<script setup>
import { computed, ref } from 'vue';
import {
	DomAccordion,
	DomButton,
	DomCard,
	DomDialog,
	DomRadioGroup,
	DomSelect,
	DomStatusPill,
	DomTabs,
	DomToggle,
} from '@getdom/studio/vue';
import PrivacyActionRow from '../components/PrivacyActionRow.vue';
import PrivacySignal from '../components/PrivacySignal.vue';

const sections = [
	{ key: 'controls', label: 'Privacy settings' },
	{ key: 'rights', label: 'Data rights' },
];

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
		meta: 'Low data footprint',
		tone: 'success',
	},
	{
		label: '12 months',
		value: '12-months',
		description: 'Balanced retention for auditability, recommendations, and support context.',
		meta: 'Balanced default',
		tone: 'primary',
	},
	{
		label: 'Until account deletion',
		value: 'account-lifetime',
		description: 'Retain activity until the account is closed or a deletion request completes.',
		meta: 'Maximum history',
		tone: 'warning',
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

/**
 * Build a fresh consent model so restoring defaults does not preserve edited
 * object references from the current session.
 *
 * @returns {Array<object>} Optional and required privacy controls.
 */
function createConsentControls() {
	return [
		{
			key: 'productAnalytics',
			label: 'Product analytics',
			description: 'Measure feature usage, reliability, and activation trends.',
			enabled: true,
			required: false,
			impact: 'Improves product quality',
			tone: 'primary',
		},
		{
			key: 'personalization',
			label: 'Personalized recommendations',
			description: 'Use activity patterns to rank suggestions, templates, and shortcuts.',
			enabled: true,
			required: false,
			impact: 'Improves relevance',
			tone: 'primary',
		},
		{
			key: 'marketing',
			label: 'Lifecycle education',
			description: 'Send product education, lifecycle messages, surveys, and beta invitations.',
			enabled: false,
			required: false,
			impact: 'Optional outreach',
			tone: 'neutral',
		},
		{
			key: 'thirdPartyEnrichment',
			label: 'Third-party enrichment',
			description: 'Attach company firmographic data from approved processors.',
			enabled: false,
			required: false,
			impact: 'Higher data sharing',
			tone: 'warning',
		},
		{
			key: 'securityOperations',
			label: 'Security and fraud processing',
			description: 'Process sign-in, abuse, billing, and access signals needed to protect the account.',
			enabled: true,
			required: true,
			impact: 'Required protection',
			tone: 'warning',
		},
	];
}

const activeSection = ref('controls');
const consentControls = ref(createConsentControls());
const profileVisibility = ref('team');
const activityRetention = ref('12-months');
const exportFormat = ref('portable-json');
const saveState = ref('synced');
const requestDialogOpen = ref(false);
const selectedRequest = ref(null);
const queuedRequest = ref(null);

/**
 * Return the selected option record from a stable list.
 *
 * @param {Array<object>} options Available option records.
 * @param {string} value Selected value.
 * @returns {object|null} Matching option or null.
 */
function findOption(options, value) {
	return options.find((option) => option.value === value) || null;
}

/**
 * Count optional privacy controls that are currently enabled.
 *
 * @returns {number} Enabled optional control count.
 */
function getEnabledOptionalControls() {
	return consentControls.value.filter((control) => control.enabled && !control.required).length;
}

/**
 * Count optional privacy controls that are currently disabled.
 *
 * @returns {number} Disabled optional control count.
 */
function getDisabledOptionalControls() {
	return consentControls.value.filter((control) => !control.enabled && !control.required).length;
}

/**
 * Count choices that materially increase data sharing or retention.
 *
 * @returns {number} Higher-sharing choice count.
 */
function getHighSharingCount() {
	let count = consentControls.value.filter((control) => {
		return control.enabled && ['marketing', 'thirdPartyEnrichment'].includes(control.key);
	}).length;
	if (profileVisibility.value === 'discoverable') count += 1;
	if (activityRetention.value === 'account-lifetime') count += 1;
	return count;
}

/**
 * Describe the current privacy posture without implying a false numeric score.
 *
 * @returns {string} Human-readable privacy posture.
 */
function getPrivacyPostureLabel() {
	if (highSharingCount.value === 0) return 'Balanced';
	if (highSharingCount.value === 1) return 'Review one choice';
	return 'Review sharing';
}

/**
 * Resolve the semantic tone for the current privacy posture.
 *
 * @returns {string} DOM Studio status tone.
 */
function getPrivacyPostureTone() {
	if (highSharingCount.value === 0) return 'success';
	if (highSharingCount.value === 1) return 'warning';
	return 'danger';
}

/**
 * Resolve the user-facing save status label.
 *
 * @returns {string} Current persistence state.
 */
function getSaveStatusLabel() {
	if (saveState.value === 'saved') return 'Privacy settings saved';
	if (saveState.value === 'unsaved') return 'Unsaved changes';
	return 'Synced with policy';
}

/**
 * Resolve the semantic tone for the current save state.
 *
 * @returns {string} DOM Studio status tone.
 */
function getSaveStatusTone() {
	return saveState.value === 'unsaved' ? 'warning' : 'success';
}

/**
 * Build a human-readable settings review instead of exposing raw persistence
 * keys and enum values to the user.
 *
 * @returns {Array<{ label: string, value: string }>} Settings review rows.
 */
function getReviewRows() {
	return [
		{
			label: 'Profile visibility',
			value: findOption(visibilityOptions, profileVisibility.value)?.label || profileVisibility.value,
		},
		{
			label: 'Activity retention',
			value: findOption(retentionOptions, activityRetention.value)?.label || activityRetention.value,
		},
		{
			label: 'Export format',
			value: findOption(exportOptions, exportFormat.value)?.label || exportFormat.value,
		},
		{
			label: 'Optional processing',
			value: `${enabledOptionalControls.value} of 4 enabled`,
		},
	];
}

/**
 * Resolve the current retention option for rich selected-value rendering.
 *
 * @returns {object|null} Selected retention option.
 */
function getSelectedRetention() {
	return findOption(retentionOptions, activityRetention.value);
}

/**
 * Resolve the current export option for rich selected-value rendering.
 *
 * @returns {object|null} Selected export option.
 */
function getSelectedExport() {
	return findOption(exportOptions, exportFormat.value);
}

/**
 * Provide safe fallback copy while a privacy request is not selected.
 *
 * @returns {string} Dialog description.
 */
function getSelectedRequestDescription() {
	return selectedRequest.value?.description || 'Confirm this privacy request before creating a backend job.';
}

const enabledOptionalControls = computed(getEnabledOptionalControls);
const disabledOptionalControls = computed(getDisabledOptionalControls);
const highSharingCount = computed(getHighSharingCount);
const privacyPostureLabel = computed(getPrivacyPostureLabel);
const privacyPostureTone = computed(getPrivacyPostureTone);
const saveStatusLabel = computed(getSaveStatusLabel);
const saveStatusTone = computed(getSaveStatusTone);
const reviewRows = computed(getReviewRows);
const selectedRetention = computed(getSelectedRetention);
const selectedExport = computed(getSelectedExport);
const selectedRequestDescription = computed(getSelectedRequestDescription);

/**
 * Mark the privacy settings as changed after a form control update.
 *
 * @returns {void}
 */
function markUnsaved() {
	saveState.value = 'unsaved';
}

/**
 * Simulate persisting the current privacy settings.
 *
 * @returns {void}
 */
function saveChanges() {
	saveState.value = 'saved';
}

/**
 * Restore the example policy defaults and keep them ready for user review.
 *
 * @returns {void}
 */
function restoreDefaults() {
	profileVisibility.value = 'team';
	activityRetention.value = '12-months';
	exportFormat.value = 'portable-json';
	consentControls.value = createConsentControls();
	markUnsaved();
}

/**
 * Open the confirmation dialog for a supported data-rights request.
 *
 * @param {'export'|'reset'|'delete'} type Requested privacy workflow.
 * @returns {void}
 */
function openRequest(type) {
	const exportLabel = findOption(exportOptions, exportFormat.value)?.label || exportFormat.value;
	const requests = {
		export: {
			type: 'export',
			title: 'Request data export',
			description: `Create a ${exportLabel} archive containing profile, consent, workspace, and activity data.`,
			confirm: 'Queue export',
			result: `${exportLabel} export queued`,
			status: 'Queued',
		},
		reset: {
			type: 'reset',
			title: 'Reset personalization profile',
			description: 'Clear recommendation signals while preserving required account, security, billing, and audit records.',
			confirm: 'Reset profile',
			result: 'Personalization reset queued',
			status: 'Queued',
		},
		delete: {
			type: 'delete',
			title: 'Start deletion request',
			description: 'Create a deletion review job with identity, ownership, legal-hold, and billing checks before any data is removed.',
			confirm: 'Start request',
			result: 'Account deletion review queued',
			status: 'Needs review',
			destructive: true,
		},
	};
	selectedRequest.value = requests[type] || null;
	requestDialogOpen.value = Boolean(selectedRequest.value);
}

/**
 * Confirm the selected privacy request and expose its queued state.
 *
 * @returns {void}
 */
function confirmRequest() {
	if (!selectedRequest.value) return;
	queuedRequest.value = {
		title: selectedRequest.value.result,
		status: selectedRequest.value.status,
		tone: selectedRequest.value.destructive ? 'warning' : 'info',
		description: selectedRequest.value.destructive
			? 'Identity and account ownership must be verified before the review can proceed.'
			: 'We will email the account owner when the privacy job is ready.',
	};
	requestDialogOpen.value = false;
}
</script>

<template>
	<DomCard
		as="section"
		padding="none"
		class="text-canvas-fg shadow-xl shadow-black/5"
		aria-labelledby="privacy-control-center-title"
	>
		<header class="border-b border-border px-5 py-5 sm:px-7 sm:py-6">
			<div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
				<div class="max-w-2xl">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Account settings</p>
					<h3 id="privacy-control-center-title" class="mt-2 text-2xl font-semibold tracking-tight">Privacy control center</h3>
					<p class="mt-2 text-sm leading-6 text-muted-fg">
						Manage visibility, optional processing, retention, exports, and sensitive account-data requests.
					</p>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<div aria-live="polite">
						<DomStatusPill :tone="saveStatusTone" size="sm">{{ saveStatusLabel }}</DomStatusPill>
					</div>
					<DomButton variant="secondary" size="sm" @click="restoreDefaults">Restore defaults</DomButton>
					<DomButton size="sm" :disabled="saveState !== 'unsaved'" @click="saveChanges">Save changes</DomButton>
				</div>
			</div>

			<div class="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-4">
				<PrivacySignal
					label="Current posture"
					:value="privacyPostureLabel"
					:tone="privacyPostureTone"
					:description="highSharingCount ? `${highSharingCount} higher-sharing choices` : 'No higher-sharing choices'"
				/>
				<PrivacySignal
					label="Optional controls"
					:value="`${disabledOptionalControls} off`"
					description="User-controlled processing"
				/>
				<PrivacySignal
					label="Policy"
					value="GB · 2026-05"
					tone="primary"
					description="Current effective version"
				/>
			</div>
		</header>

		<DomTabs v-model="activeSection" :tabs="sections" variant="page" class="[&_[role=tab]]:shrink-0">
			<template #controls>
				<div class="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_21rem]">
					<main class="min-w-0">
						<section class="border-b border-border px-5 py-6 sm:px-7">
							<h4 class="text-lg font-semibold">Profile visibility</h4>
							<p class="mt-1 text-sm leading-6 text-muted-fg">
								Choose how much of your profile is discoverable inside the workspace.
							</p>

							<DomRadioGroup
								v-model="profileVisibility"
								class="mt-4"
								label="Profile visibility"
								:options="visibilityOptions"
								@update:model-value="markUnsaved"
							>
								<template #option="{ option }">
									<span class="flex min-w-0 flex-1 items-start justify-between gap-3">
										<span class="min-w-0">
											<span class="block font-semibold">{{ option.label }}</span>
											<span class="mt-1 block text-xs leading-5 opacity-80">{{ option.description }}</span>
										</span>
										<DomStatusPill tone="neutral" size="sm" :dot="false">{{ option.meta }}</DomStatusPill>
									</span>
								</template>
							</DomRadioGroup>
						</section>

						<section class="px-5 py-6 sm:px-7">
							<div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
								<div>
									<h4 class="text-lg font-semibold">Optional processing</h4>
									<p class="mt-1 text-sm leading-6 text-muted-fg">
										Control non-essential uses while preserving processing required for safety and account operations.
									</p>
								</div>
								<p class="text-sm font-medium text-muted-fg">{{ enabledOptionalControls }} of 4 enabled</p>
							</div>

							<div class="mt-4 border-y border-border">
								<fieldset
									v-for="control in consentControls"
									:key="control.key"
									class="grid gap-3 border-b border-border py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
								>
									<legend class="sr-only">{{ control.label }}</legend>
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<h5 class="font-semibold">{{ control.label }}</h5>
											<DomStatusPill :tone="control.tone" size="sm" :dot="false">{{ control.impact }}</DomStatusPill>
										</div>
										<p class="mt-1 text-sm leading-6 text-muted-fg">{{ control.description }}</p>
									</div>
									<DomToggle
										v-model="control.enabled"
										:label="control.enabled ? 'Enabled' : 'Disabled'"
										:description="control.required ? 'Required by policy' : ''"
										:disabled="control.required"
										size="sm"
										@update:model-value="markUnsaved"
									/>
								</fieldset>
							</div>
						</section>
					</main>

					<aside class="border-t border-border bg-secondary/25 p-5 lg:border-l lg:border-t-0">
						<div class="lg:sticky lg:top-4">
							<h4 class="font-semibold tracking-tight">Review settings</h4>
							<p class="mt-1 text-sm leading-6 text-muted-fg">Global data choices and the values that will be saved.</p>

							<div class="mt-4 grid gap-4">
								<DomSelect
									v-model="activityRetention"
									label="Activity retention"
									:options="retentionOptions"
									width="w-[min(22rem,calc(100vw-2rem))]"
									@update:model-value="markUnsaved"
								>
									<template #value>
										<span v-if="selectedRetention" class="flex min-w-0 items-center justify-between gap-3">
											<span class="truncate font-medium">{{ selectedRetention.label }}</span>
											<DomStatusPill :tone="selectedRetention.tone" size="sm" :dot="false">{{ selectedRetention.meta }}</DomStatusPill>
										</span>
									</template>
									<template #option="{ option }">
										<span class="block">
											<span class="flex items-center justify-between gap-3">
												<span class="font-medium">{{ option.label }}</span>
												<span class="text-xs opacity-75">{{ option.meta }}</span>
											</span>
											<span class="mt-1 block text-xs leading-5 opacity-75">{{ option.description }}</span>
										</span>
									</template>
								</DomSelect>

								<DomSelect
									v-model="exportFormat"
									label="Export format"
									:options="exportOptions"
									width="w-[min(22rem,calc(100vw-2rem))]"
									@update:model-value="markUnsaved"
								>
									<template #value>
										<span v-if="selectedExport" class="flex min-w-0 items-center justify-between gap-3">
											<span class="truncate font-medium">{{ selectedExport.label }}</span>
											<span class="shrink-0 text-xs text-muted-fg">{{ selectedExport.meta }}</span>
										</span>
									</template>
									<template #option="{ option }">
										<span class="block">
											<span class="flex items-center justify-between gap-3">
												<span class="font-medium">{{ option.label }}</span>
												<span class="text-xs opacity-75">{{ option.meta }}</span>
											</span>
											<span class="mt-1 block text-xs leading-5 opacity-75">{{ option.description }}</span>
										</span>
									</template>
								</DomSelect>
							</div>

							<dl class="mt-5 grid gap-2 border-t border-border pt-4 text-sm">
								<div v-for="row in reviewRows" :key="row.label" class="flex justify-between gap-4">
									<dt class="text-muted-fg">{{ row.label }}</dt>
									<dd class="max-w-40 text-right font-semibold">{{ row.value }}</dd>
								</div>
							</dl>
						</div>
					</aside>
				</div>
			</template>

			<template #rights>
				<div class="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_21rem]">
					<main class="min-w-0 px-5 py-6 sm:px-7">
						<h4 class="text-lg font-semibold">Data rights actions</h4>
						<p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">
							Start explicit, auditable jobs for exports, personalization resets, and account-data deletion.
						</p>

						<div class="mt-4 border-y border-border">
							<PrivacyActionRow
								title="Download account data"
								description="Create an archive using the selected export format and notify the account owner when it is ready."
								status="Available"
								status-tone="success"
								action-label="Request export"
								@action="openRequest('export')"
							/>
							<PrivacyActionRow
								title="Reset recommendation profile"
								description="Clear personalization signals while preserving required operational, security, billing, and audit records."
								status="No open job"
								action-label="Reset profile"
								@action="openRequest('reset')"
							/>
							<PrivacyActionRow
								title="Start account-data deletion"
								description="Begin a reviewed deletion workflow with identity checks, ownership review, legal holds, and a cancellation window."
								status="Sensitive"
								status-tone="danger"
								action-label="Start request"
								destructive
								@action="openRequest('delete')"
							/>
						</div>
					</main>

					<aside class="border-t border-border bg-secondary/25 p-5 lg:border-l lg:border-t-0">
						<section aria-live="polite">
							<div class="flex flex-wrap items-center gap-2">
								<h4 class="font-semibold tracking-tight">Latest request</h4>
								<DomStatusPill v-if="queuedRequest" :tone="queuedRequest.tone" size="sm">{{ queuedRequest.status }}</DomStatusPill>
							</div>
							<template v-if="queuedRequest">
								<p class="mt-3 font-semibold">{{ queuedRequest.title }}</p>
								<p class="mt-1 text-sm leading-6 text-muted-fg">{{ queuedRequest.description }}</p>
							</template>
							<p v-else class="mt-2 text-sm leading-6 text-muted-fg">No privacy request has been started in this session.</p>
						</section>

						<section class="mt-5 border-t border-border pt-5">
							<h4 class="font-semibold tracking-tight">Policy explainers</h4>
							<p class="mt-1 text-sm leading-6 text-muted-fg">Implementation guidance for auditable privacy workflows.</p>
							<DomAccordion class="mt-3" :items="privacyNotes" />
						</section>
					</aside>
				</div>
			</template>
		</DomTabs>

		<footer class="flex flex-col gap-2 border-t border-border px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-7">
			<p class="leading-6 text-muted-fg">
				Effective policy <span class="font-semibold text-canvas-fg">privacy-2026-05</span> for region <span class="font-semibold text-canvas-fg">GB</span>.
			</p>
			<DomButton variant="ghost" size="sm" @click="activeSection = 'rights'">
				Review data rights
			</DomButton>
		</footer>

		<DomDialog
			v-model="requestDialogOpen"
			:title="selectedRequest?.title || 'Confirm privacy request'"
			:description="selectedRequestDescription"
		>
			<div class="space-y-4 text-sm leading-6 text-muted-fg">
				<div>
					<p class="font-semibold text-canvas-fg">What happens next</p>
					<p class="mt-1">
						This creates a backend job, stores an audit event against the current policy, and emails the account owner as the request progresses.
					</p>
				</div>
				<dl class="grid gap-2 border-y border-border py-3">
					<div class="flex justify-between gap-4">
						<dt>Export format</dt>
						<dd class="font-semibold text-canvas-fg">{{ selectedExport?.label }}</dd>
					</div>
					<div class="flex justify-between gap-4">
						<dt>Retention window</dt>
						<dd class="font-semibold text-canvas-fg">{{ selectedRetention?.label }}</dd>
					</div>
					<div class="flex justify-between gap-4">
						<dt>Profile visibility</dt>
						<dd class="font-semibold text-canvas-fg">{{ findOption(visibilityOptions, profileVisibility)?.label }}</dd>
					</div>
				</dl>
			</div>
			<template #footer>
				<DomButton variant="secondary" data-close>Cancel</DomButton>
				<DomButton :variant="selectedRequest?.destructive ? 'danger' : 'primary'" @click="confirmRequest">
					{{ selectedRequest?.confirm || 'Confirm' }}
				</DomButton>
			</template>
		</DomDialog>
	</DomCard>
</template>
