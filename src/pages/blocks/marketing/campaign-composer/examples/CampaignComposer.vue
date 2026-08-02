<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDateTimePicker,
	DomDialog,
	DomEmptyState,
	DomNumberInput,
	DomProgress,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextInput,
	DomTextareaInput,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/campaign-composer';
const tabs = [
	{ key: 'message', label: 'Message' },
	{ key: 'audience', label: 'Audience' },
	{ key: 'preview', label: 'Preview' },
	{ key: 'launch', label: 'Launch' },
	{ key: 'results', label: 'Results' },
];
const scheduleOptions = [
	{ value: 'scheduled', label: 'Schedule for later', description: 'Queue delivery for a specific date and time' },
	{ value: 'immediate', label: 'Send after confirmation', description: 'Begin provider delivery immediately' },
];

const campaigns = ref([]);
const campaign = ref(null);
const catalog = ref(null);
const activeView = ref('message');
const previewChannel = ref('email');
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const launchDialogOpen = ref(false);
const launchAcknowledged = ref(false);
const testRecipient = ref('maya@northstar.test');

const locked = computed(() => ['scheduled', 'sending', 'completed'].includes(campaign.value?.status));
const activeCampaignOption = computed(() => campaigns.value.map((item) => ({
	value: item.id,
	label: item.name,
	description: `${statusLabel(item.status)} · ${formatNumber(item.reachable)} reachable`,
})));
const sender = computed(() => catalog.value?.senderOptions.find((option) => option.value === campaign.value?.senderId));
const segment = computed(() => catalog.value?.segmentOptions.find((option) => option.value === campaign.value?.segmentId));
const selectedPreviewChannel = computed(() => catalog.value?.channelOptions.find((channel) => channel.id === previewChannel.value));
const launchReady = computed(() => Boolean(campaign.value?.validation?.ready && campaign.value.validation.revision === campaign.value.revision));
const previewText = computed(() => String(campaign.value?.body || '').replaceAll('{{first_name}}', 'Avery').replaceAll('{{workspace_name}}', 'Northstar'));

onMounted(loadWorkspace);

/**
 * Loads the campaign list and opens the preferred draft campaign.
 *
 * @returns {Promise<void>} Resolves after the initial workspace is available.
 */
async function loadWorkspace() {
	loading.value = true;
	error.value = '';
	try {
		const result = await apiRequest(`${apiBase}/campaigns`);
		campaigns.value = result.campaigns || [];
		const preferred = campaigns.value.find((item) => item.status === 'draft') || campaigns.value[0];
		if (preferred) await selectCampaign(preferred.id);
	} catch (requestError) {
		error.value = requestError.message;
	} finally {
		loading.value = false;
	}
}

/**
 * Opens one campaign and replaces local draft state with the server response.
 *
 * @param {string} campaignId Campaign identifier.
 * @returns {Promise<void>} Resolves after the campaign workspace loads.
 */
async function selectCampaign(campaignId) {
	if (!campaignId || busyAction.value) return;
	busyAction.value = 'select';
	error.value = '';
	notice.value = '';
	try {
		const result = await apiRequest(`${apiBase}/${campaignId}`);
		applyWorkspace(result);
		activeView.value = result.campaign.status === 'completed' ? 'results' : 'message';
		previewChannel.value = result.campaign.channels[0] || 'email';
	} catch (requestError) {
		error.value = requestError.message;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Persists all editable campaign fields using optimistic revision control.
 *
 * @returns {Promise<void>} Resolves after the draft is saved or an error is shown.
 */
async function saveDraft() {
	if (!campaign.value || locked.value) return;
	await performMutation('save', `${apiBase}/${campaign.value.id}/draft`, {
		method: 'PATCH',
		body: draftPayload(),
	}, 'Campaign draft saved. Launch evidence from older revisions was cleared.');
}

/**
 * Runs authoritative consent, audience, message, and schedule checks.
 *
 * @returns {Promise<void>} Resolves after validation evidence is returned.
 */
async function runChecks() {
	if (!campaign.value || locked.value) return;
	await performMutation('validate', `${apiBase}/${campaign.value.id}/validate`, {
		method: 'POST',
		body: { revision: campaign.value.revision },
	}, 'Launch checks completed for this exact revision.');
}

/**
 * Sends a provider-style test message to the entered recipient.
 *
 * @returns {Promise<void>} Resolves after a test receipt or error is returned.
 */
async function sendTest() {
	if (!campaign.value || locked.value) return;
	await performMutation('test', `${apiBase}/${campaign.value.id}/test`, {
		method: 'POST',
		body: { revision: campaign.value.revision, recipient: testRecipient.value },
	}, `Test accepted for ${testRecipient.value}.`);
}

/**
 * Opens the acknowledgement dialog for a checked campaign revision.
 *
 * @returns {void}
 */
function openLaunchDialog() {
	activeView.value = 'launch';
	launchAcknowledged.value = false;
	launchDialogOpen.value = true;
}

/**
 * Launches the current checked revision and stores the immutable receipt.
 *
 * @returns {Promise<void>} Resolves after the launch state is returned.
 */
async function confirmLaunch() {
	if (!campaign.value || locked.value) return;
	const scheduleMode = campaign.value.scheduleMode;
	await performMutation('launch', `${apiBase}/${campaign.value.id}/launch`, {
		method: 'POST',
		body: {
			revision: campaign.value.revision,
			acknowledged: launchAcknowledged.value,
		},
	}, scheduleMode === 'immediate' ? 'Campaign delivery started.' : 'Campaign scheduled with a launch receipt.');
	if (!error.value) launchDialogOpen.value = false;
}

/**
 * Advances the deterministic delivery worker for scheduled or sending examples.
 *
 * @returns {Promise<void>} Resolves after provider state advances.
 */
async function advanceDelivery() {
	if (!campaign.value?.launch) return;
	await performMutation('advance', `${apiBase}/${campaign.value.id}/advance`, {
		method: 'POST',
		body: {},
	}, campaign.value.launch.state === 'scheduled' ? 'Scheduled delivery is now processing.' : 'Delivery completed and results are available.');
	if (!error.value && campaign.value?.status === 'completed') activeView.value = 'results';
}

/**
 * Restores the selected campaign to its seeded example state.
 *
 * @returns {Promise<void>} Resolves after the campaign is restored.
 */
async function resetCampaign() {
	if (!campaign.value) return;
	await performMutation('reset', `${apiBase}/${campaign.value.id}/reset`, {
		method: 'POST',
		body: {},
	}, 'Campaign example restored.');
	activeView.value = campaign.value?.status === 'completed' ? 'results' : 'message';
}

/**
 * Toggles an audience exclusion in the editable draft.
 *
 * @param {string} exclusionId Exclusion identifier.
 * @returns {void}
 */
function toggleExclusion(exclusionId) {
	if (!campaign.value || locked.value) return;
	campaign.value.exclusionIds = campaign.value.exclusionIds.includes(exclusionId)
		? campaign.value.exclusionIds.filter((id) => id !== exclusionId)
		: [...campaign.value.exclusionIds, exclusionId];
	invalidateLocalEvidence();
}

/**
 * Toggles a campaign delivery channel in the editable draft.
 *
 * @param {string} channelId Channel identifier.
 * @returns {void}
 */
function toggleChannel(channelId) {
	if (!campaign.value || locked.value) return;
	campaign.value.channels = campaign.value.channels.includes(channelId)
		? campaign.value.channels.filter((id) => id !== channelId)
		: [...campaign.value.channels, channelId];
	if (!campaign.value.channels.includes(previewChannel.value)) previewChannel.value = campaign.value.channels[0] || channelId;
	invalidateLocalEvidence();
}

/**
 * Marks server evidence as stale after a local field change.
 *
 * @returns {void}
 */
function invalidateLocalEvidence() {
	if (!campaign.value) return;
	campaign.value.validation = null;
	notice.value = 'Save the draft to recalculate authoritative audience and launch evidence.';
}

/**
 * Runs a campaign mutation with shared error, loading, and summary refresh behavior.
 *
 * @param {string} action Busy action identifier.
 * @param {string} url API route.
 * @param {{ method: string, body: object }} options Request options.
 * @param {string} successMessage Human-readable success notice.
 * @returns {Promise<void>} Resolves when mutation handling finishes.
 */
async function performMutation(action, url, options, successMessage) {
	busyAction.value = action;
	error.value = '';
	notice.value = '';
	try {
		const result = await apiRequest(url, options);
		applyWorkspace(result);
		await refreshCampaigns();
		notice.value = successMessage;
	} catch (requestError) {
		error.value = requestError.message;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Refreshes campaign summaries without disturbing the active draft.
 *
 * @returns {Promise<void>} Resolves after summaries are replaced.
 */
async function refreshCampaigns() {
	const result = await apiRequest(`${apiBase}/campaigns`);
	campaigns.value = result.campaigns || [];
}

/**
 * Applies a campaign API workspace while preserving response immutability.
 *
 * @param {{ campaign?: object, catalog?: object }} result API workspace.
 * @returns {void}
 */
function applyWorkspace(result) {
	if (result.campaign) campaign.value = result.campaign;
	if (result.catalog) catalog.value = result.catalog;
}

/**
 * Builds the complete editable campaign payload for a revisioned save.
 *
 * @returns {object} Draft mutation payload.
 */
function draftPayload() {
	const current = campaign.value;
	return {
		revision: current.revision,
		name: current.name,
		subject: current.subject,
		preheader: current.preheader,
		body: current.body,
		ctaLabel: current.ctaLabel,
		senderId: current.senderId,
		segmentId: current.segmentId,
		exclusionIds: current.exclusionIds,
		channels: current.channels,
		scheduleMode: current.scheduleMode,
		sendAt: current.sendAt,
		timezone: current.timezone,
		holdoutPercentage: current.holdoutPercentage,
	};
}

/**
 * Calls a JSON API and promotes server errors to normal exceptions.
 *
 * @param {string} url API route.
 * @param {{ method?: string, body?: object }} [options={}] Request options.
 * @returns {Promise<any>} Parsed response body.
 */
async function apiRequest(url, options = {}) {
	const response = await fetch(url, {
		method: options.method || 'GET',
		headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const result = await response.json();
	if (!response.ok) throw new Error(result.error || 'Campaign service request failed.');
	return result;
}

/**
 * Maps campaign workflow state to a readable label.
 *
 * @param {string} status Campaign status.
 * @returns {string} Human-readable status.
 */
function statusLabel(status) {
	return {
		draft: 'Draft',
		scheduled: 'Scheduled',
		sending: 'Sending',
		completed: 'Completed',
	}[status] || status;
}

/**
 * Maps campaign workflow state to a semantic DOM Studio tone.
 *
 * @param {string} status Campaign status.
 * @returns {string} Status tone.
 */
function statusTone(status) {
	return {
		draft: 'neutral',
		scheduled: 'info',
		sending: 'warning',
		completed: 'success',
	}[status] || 'neutral';
}

/**
 * Maps validation state to a semantic DOM Studio tone.
 *
 * @param {string} state Validation state.
 * @returns {string} Status tone.
 */
function checkTone(state) {
	return state === 'passed' ? 'success' : state === 'warning' ? 'warning' : 'danger';
}

/**
 * Formats a numeric count for campaign summaries.
 *
 * @param {number} value Numeric count.
 * @returns {string} English-formatted count.
 */
function formatNumber(value) {
	return Number(value || 0).toLocaleString('en-GB');
}

/**
 * Formats a percentage from a numerator and denominator.
 *
 * @param {number} value Numerator.
 * @param {number} total Denominator.
 * @returns {string} One-decimal percentage.
 */
function formatRate(value, total) {
	if (!total) return '0.0%';
	return `${((Number(value || 0) / total) * 100).toFixed(1)}%`;
}
</script>

<template>
	<section class="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-canvas text-canvas-fg">
		<header class="shrink-0 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur sm:px-5">
			<div class="flex min-w-0 items-center justify-between gap-3">
				<div class="min-w-0">
					<div class="flex min-w-0 items-center gap-2">
						<p class="min-w-0 truncate text-sm font-semibold sm:text-base"><span class="sm:hidden">Campaigns</span><span class="hidden sm:inline">Campaign operations</span></p>
						<DomBadge class="hidden sm:inline-flex" tone="primary" size="sm" variant="soft">Northstar</DomBadge>
					</div>
					<p class="mt-0.5 hidden truncate text-xs text-muted-fg sm:block">Draft, prove, and deliver lifecycle messages from one workspace.</p>
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<DomButton v-if="campaign && !locked" variant="secondary" size="sm" :loading="busyAction === 'save'" @click="saveDraft">Save</DomButton>
					<DomButton v-if="campaign && !locked" size="sm" :disabled="!launchReady" @click="openLaunchDialog">{{ campaign.scheduleMode === 'immediate' ? 'Send' : 'Schedule' }}</DomButton>
					<DomButton v-if="campaign && locked" variant="secondary" size="sm" :loading="busyAction === 'reset'" @click="resetCampaign">Reset example</DomButton>
				</div>
			</div>
			<div v-if="campaigns.length" class="mt-3 lg:hidden">
				<DomSelect
					:model-value="campaign?.id || ''"
					:options="activeCampaignOption"
					label="Campaign"
					chrome="compact"
					width="min-w-[min(22rem,calc(100vw-2rem))]"
					@update:model-value="selectCampaign"
				>
					<template #option="{ option }">
						<div class="min-w-0 py-0.5">
							<p class="truncate text-sm font-semibold">{{ option.label }}</p>
							<p class="mt-0.5 truncate text-xs opacity-75">{{ option.description }}</p>
						</div>
					</template>
				</DomSelect>
			</div>
		</header>

		<div v-if="loading" class="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[16rem_minmax(0,1fr)_20rem]">
			<DomSkeleton height="100%" label="Loading campaigns" />
			<DomSkeleton height="100%" label="Loading composer" />
			<DomSkeleton height="100%" label="Loading delivery evidence" />
		</div>

		<div v-else-if="!campaign" class="grid min-h-0 flex-1 place-items-center p-5">
			<DomEmptyState title="Campaigns unavailable" :description="error || 'The campaign service did not return an editable campaign.'">
				<DomButton @click="loadWorkspace">Try again</DomButton>
			</DomEmptyState>
		</div>

		<div v-else class="grid min-h-0 flex-1 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_20rem]">
			<aside class="hidden min-h-0 overflow-y-auto border-r border-border bg-secondary/20 lg:block">
				<div class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur">
					<div>
						<p class="text-sm font-semibold">Campaigns</p>
						<p class="mt-0.5 text-xs text-muted-fg">{{ campaigns.length }} live examples</p>
					</div>
					<DomBadge tone="neutral" size="sm">{{ campaigns.length }}</DomBadge>
				</div>
				<nav aria-label="Campaigns" class="divide-y divide-border">
					<button
						v-for="item in campaigns"
						:key="item.id"
						type="button"
						class="group block w-full border-l-2 px-4 py-4 text-left transition hover:bg-secondary/60"
						:class="campaign.id === item.id ? 'border-l-primary bg-secondary/70' : 'border-l-transparent'"
						@click="selectCampaign(item.id)"
					>
						<div class="flex items-start justify-between gap-2">
							<p class="min-w-0 text-sm font-semibold leading-5">{{ item.name }}</p>
							<span class="mt-1 size-1.5 shrink-0 rounded-full" :class="item.status === 'completed' ? 'bg-success' : item.status === 'draft' ? 'bg-muted-fg' : 'bg-primary'" />
						</div>
						<p class="mt-1 text-xs text-muted-fg">{{ item.owner }} · {{ item.updatedLabel }}</p>
						<div class="mt-3 flex items-center justify-between gap-2 text-xs">
							<span class="font-medium">{{ formatNumber(item.reachable) }} reachable</span>
							<span class="text-muted-fg">{{ item.channels.length }} channels</span>
						</div>
					</button>
				</nav>
			</aside>

			<main class="flex min-h-0 min-w-0 flex-col overflow-hidden bg-canvas">
				<div class="shrink-0 border-b border-border px-4 py-3 sm:px-5">
					<div class="flex min-w-0 flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex min-w-0 items-center gap-2">
								<h1 class="truncate text-lg font-semibold tracking-tight sm:text-xl">{{ campaign.name }}</h1>
								<DomStatusPill :tone="statusTone(campaign.status)" :label="statusLabel(campaign.status)" size="sm" />
							</div>
							<p class="mt-1 max-w-3xl text-xs leading-5 text-muted-fg sm:text-sm">{{ campaign.goal }}</p>
						</div>
						<p class="shrink-0 text-xs font-medium text-muted-fg">Revision {{ campaign.revision }}</p>
					</div>
				</div>

				<DomAlert v-if="error" class="m-3 shrink-0" tone="danger" title="Campaign action failed" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-if="notice && !error" class="m-3 shrink-0" :tone="notice.includes('Save the draft') ? 'warning' : 'success'" title="Campaign updated" :description="notice" dismissible @dismiss="notice = ''" />

				<DomTabs v-model="activeView" :tabs="tabs" variant="page" fill class="min-h-0">
					<template #message>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-4xl gap-5 p-4 sm:p-5">
								<div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,.7fr)]">
									<DomTextInput v-model="campaign.name" label="Campaign name" description="Internal only" :disabled="locked" @update:model-value="invalidateLocalEvidence" />
									<DomSelect v-model="campaign.senderId" :options="catalog.senderOptions" label="Sender" :disabled="locked" width="min-w-[18rem]" @update:model-value="invalidateLocalEvidence">
										<template #option="{ option }">
											<div class="py-0.5">
												<p class="text-sm font-semibold">{{ option.label }}</p>
												<p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p>
											</div>
										</template>
									</DomSelect>
								</div>

								<div class="border-t border-border pt-5">
									<div class="mb-4 flex items-center justify-between gap-3">
										<div>
											<h2 class="text-sm font-semibold">Email message</h2>
											<p class="mt-1 text-xs text-muted-fg">Personalization fallbacks and unsubscribe controls are added by the delivery service.</p>
										</div>
										<DomBadge tone="neutral" size="sm">{{ campaign.subject.length }}/64 subject</DomBadge>
									</div>
									<div class="grid gap-4">
										<DomTextInput v-model="campaign.subject" label="Subject" :disabled="locked" @update:model-value="invalidateLocalEvidence" />
										<DomTextInput v-model="campaign.preheader" label="Preheader" :disabled="locked" @update:model-value="invalidateLocalEvidence" />
										<DomTextareaInput v-model="campaign.body" label="Message" description="Available tokens: {{first_name}} and {{workspace_name}}" :rows="8" :disabled="locked" @update:model-value="invalidateLocalEvidence" />
										<div class="max-w-sm">
											<DomTextInput v-model="campaign.ctaLabel" label="Call to action" :disabled="locked" @update:model-value="invalidateLocalEvidence" />
										</div>
									</div>
								</div>
							</div>
						</div>
					</template>

					<template #audience>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-4xl gap-5 p-4 sm:p-5">
								<div class="grid gap-4 sm:grid-cols-2">
									<div class="border-b border-border pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
										<p class="text-xs font-medium text-muted-fg">Selected segment</p>
										<p class="mt-1 text-2xl font-semibold tracking-tight">{{ formatNumber(campaign.audience.segment) }}</p>
										<p class="mt-1 text-xs text-muted-fg">{{ segment?.label }}</p>
									</div>
									<div>
										<p class="text-xs font-medium text-muted-fg">Estimated delivery</p>
										<p class="mt-1 text-2xl font-semibold tracking-tight">{{ formatNumber(campaign.audience.reachable) }}</p>
										<p class="mt-1 text-xs text-muted-fg">{{ formatNumber(campaign.audience.excluded) }} excluded · {{ formatNumber(campaign.audience.holdout) }} held out</p>
									</div>
								</div>

								<DomSelect v-model="campaign.segmentId" :options="catalog.segmentOptions" label="Audience segment" :disabled="locked" searchable width="min-w-[min(25rem,calc(100vw-2rem))]" @update:model-value="invalidateLocalEvidence">
									<template #option="{ option }">
										<div class="py-0.5">
											<p class="text-sm font-semibold">{{ option.label }}</p>
											<p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p>
										</div>
									</template>
								</DomSelect>

								<div class="border-t border-border pt-5">
									<h2 class="text-sm font-semibold">Safety exclusions</h2>
									<p class="mt-1 text-xs text-muted-fg">Evaluated again by the server when delivery begins.</p>
									<div class="mt-4 grid gap-4 sm:grid-cols-2">
										<DomCheckbox
											v-for="option in catalog.exclusionOptions"
											:key="option.value"
											:model-value="campaign.exclusionIds.includes(option.value)"
											:label="option.label"
											:description="option.description"
											:disabled="locked"
											@update:model-value="toggleExclusion(option.value)"
										/>
									</div>
								</div>

								<div class="max-w-xs border-t border-border pt-5">
									<DomNumberInput v-model="campaign.holdoutPercentage" label="Measurement holdout" description="0–20% stays unsent for lift measurement" :min="0" :max="20" :step="1" :disabled="locked" @update:model-value="invalidateLocalEvidence" />
								</div>
							</div>
						</div>
					</template>

					<template #preview>
						<div class="min-h-0 flex-1 overflow-y-auto bg-secondary/25">
							<div class="mx-auto grid w-full max-w-4xl gap-5 p-4 sm:p-5">
								<div class="flex flex-wrap items-center justify-between gap-3">
									<div>
										<h2 class="text-sm font-semibold">Rendered delivery preview</h2>
										<p class="mt-1 text-xs text-muted-fg">Sample profile: Avery at Northstar.</p>
									</div>
									<DomSelect v-model="previewChannel" :options="catalog.channelOptions.map((channel) => ({ value: channel.id, label: channel.label, description: channel.description }))" label="Preview channel" chrome="compact" width="min-w-[16rem]" />
								</div>

								<div v-if="previewChannel === 'email'" class="mx-auto w-full max-w-2xl overflow-hidden border border-border bg-canvas shadow-xl shadow-black/5">
									<div class="border-b border-border bg-secondary/40 px-4 py-3 text-xs text-muted-fg sm:px-6">
										<p><span class="font-semibold text-canvas-fg">From:</span> {{ sender?.label }}</p>
										<p class="mt-1"><span class="font-semibold text-canvas-fg">Subject:</span> {{ campaign.subject || 'No subject yet' }}</p>
									</div>
									<div class="px-5 py-8 sm:px-10 sm:py-10">
										<p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Northstar workspace</p>
										<h3 class="mt-3 text-2xl font-semibold tracking-tight">{{ campaign.subject || 'Add a subject' }}</h3>
										<p class="mt-2 text-sm text-muted-fg">{{ campaign.preheader || 'Add preview text to improve inbox clarity.' }}</p>
										<p class="mt-6 whitespace-pre-line text-sm leading-7 text-canvas-fg/85">{{ previewText || 'Add message content to render this preview.' }}</p>
										<DomButton class="mt-6">{{ campaign.ctaLabel || 'Call to action' }}</DomButton>
									</div>
									<div class="border-t border-border px-5 py-4 text-xs leading-5 text-muted-fg sm:px-10">Sent because you manage a Northstar workspace. Update preferences or unsubscribe.</div>
								</div>

								<div v-else-if="previewChannel === 'in-app'" class="mx-auto w-full max-w-2xl border border-border bg-canvas p-5 shadow-lg">
									<div class="flex items-start justify-between gap-4">
										<div>
											<p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Recommended next step</p>
											<h3 class="mt-2 text-lg font-semibold">{{ campaign.subject }}</h3>
											<p class="mt-2 line-clamp-3 text-sm leading-6 text-muted-fg">{{ previewText }}</p>
										</div>
										<DomBadge tone="info" size="sm">In app</DomBadge>
									</div>
									<DomButton class="mt-4" size="sm">{{ campaign.ctaLabel }}</DomButton>
								</div>

								<div v-else class="mx-auto w-full max-w-sm border border-border bg-canvas px-4 py-4 shadow-lg">
									<div class="flex items-start gap-3">
										<div class="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg">N</div>
										<div class="min-w-0">
											<p class="text-sm font-semibold">Northstar</p>
											<p class="mt-1 text-sm leading-5 text-muted-fg">{{ campaign.subject }} — {{ campaign.preheader }}</p>
										</div>
									</div>
								</div>

								<DomAlert v-if="selectedPreviewChannel && !campaign.channels.includes(previewChannel)" tone="warning" title="Preview only" :description="`${selectedPreviewChannel.label} is not enabled for this campaign.`" />
							</div>
						</div>
					</template>

					<template #launch>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-4xl gap-5 p-4 sm:p-5">
								<div class="grid gap-4 sm:grid-cols-2">
									<DomSelect v-model="campaign.scheduleMode" :options="scheduleOptions" label="Delivery" :disabled="locked" width="min-w-[18rem]" @update:model-value="invalidateLocalEvidence" />
									<DomSelect v-model="campaign.timezone" :options="catalog.timezoneOptions" label="Timezone" :disabled="locked" width="min-w-[18rem]" @update:model-value="invalidateLocalEvidence" />
								</div>
								<DomDateTimePicker v-if="campaign.scheduleMode === 'scheduled'" v-model="campaign.sendAt" label="Send date and time" description="Demo accepts dates in 2026" :disabled="locked" @update:model-value="invalidateLocalEvidence" />

								<div class="border-t border-border pt-5">
									<div class="flex flex-wrap items-center justify-between gap-3">
										<div>
											<h2 class="text-sm font-semibold">Delivery channels</h2>
											<p class="mt-1 text-xs text-muted-fg">Every channel creates its own traceable provider dispatch.</p>
										</div>
										<DomBadge tone="neutral" size="sm">{{ campaign.channels.length }} enabled</DomBadge>
									</div>
									<div class="mt-4 grid gap-4 sm:grid-cols-3">
										<DomCheckbox
											v-for="channel in catalog.channelOptions"
											:key="channel.id"
											:model-value="campaign.channels.includes(channel.id)"
											:label="channel.label"
											:description="channel.description"
											:disabled="locked"
											@update:model-value="toggleChannel(channel.id)"
										/>
									</div>
								</div>

								<div class="border-t border-border pt-5">
									<div class="flex flex-wrap items-center justify-between gap-3">
										<div>
											<h2 class="text-sm font-semibold">Server launch checks</h2>
											<p class="mt-1 text-xs text-muted-fg">Proof is bound to revision {{ campaign.validation?.revision ?? campaign.revision }}.</p>
										</div>
										<DomButton v-if="!locked" variant="secondary" size="sm" :loading="busyAction === 'validate'" @click="runChecks">Run checks</DomButton>
									</div>
									<div class="mt-4 divide-y divide-border border-y border-border">
										<div v-for="check in campaign.checks" :key="check.id" class="flex items-start justify-between gap-4 py-3">
											<div class="min-w-0">
												<p class="text-sm font-medium">{{ check.label }}</p>
												<p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p>
											</div>
											<DomStatusPill :tone="checkTone(check.state)" :label="check.state" size="sm" />
										</div>
									</div>
								</div>

								<div v-if="!locked" class="grid gap-3 border-t border-border pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
									<DomTextInput v-model="testRecipient" type="email" label="Test recipient" description="Returns a provider acceptance receipt; no real email is sent" />
									<DomButton variant="secondary" :loading="busyAction === 'test'" @click="sendTest">Send test</DomButton>
								</div>

								<div v-if="campaign.testReceipt" class="border-l-2 border-success pl-4 text-sm">
									<p class="font-semibold">Test accepted</p>
									<p class="mt-1 text-xs leading-5 text-muted-fg">{{ campaign.testReceipt.providerMessageId }} · {{ campaign.testReceipt.recipient }} · revision {{ campaign.testReceipt.revision }}</p>
								</div>

								<div v-if="campaign.launch" class="border-t border-border pt-5">
									<div class="flex flex-wrap items-center justify-between gap-3">
										<div>
											<p class="text-sm font-semibold">{{ campaign.launch.label }}</p>
											<p class="mt-1 text-xs text-muted-fg">Receipt {{ campaign.launch.id }} · {{ formatNumber(campaign.launch.audience.reachable) }} reachable</p>
										</div>
										<DomButton v-if="campaign.launch.state !== 'completed'" size="sm" :loading="busyAction === 'advance'" @click="advanceDelivery">Advance demo delivery</DomButton>
									</div>
									<div class="mt-4 divide-y divide-border border-y border-border">
										<div v-for="dispatch in campaign.launch.dispatches" :key="dispatch.channelId" class="flex items-center justify-between gap-3 py-3 text-sm">
											<span>{{ dispatch.label }}</span>
											<DomStatusPill :tone="dispatch.state === 'delivered' ? 'success' : dispatch.state === 'processing' ? 'warning' : 'info'" :label="dispatch.state" size="sm" />
										</div>
									</div>
								</div>

								<DomButton v-if="!locked" class="justify-self-start" :disabled="!launchReady" @click="openLaunchDialog">Review and {{ campaign.scheduleMode === 'immediate' ? 'send' : 'schedule' }}</DomButton>
							</div>
						</div>
					</template>

					<template #results>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div v-if="campaign.results" class="mx-auto grid w-full max-w-4xl gap-6 p-4 sm:p-5">
								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-success">Delivery complete</p>
									<h2 class="mt-2 text-2xl font-semibold tracking-tight">{{ formatNumber(campaign.results.delivered) }} messages delivered</h2>
									<p class="mt-2 text-sm text-muted-fg">Engagement remains attributable for {{ campaign.results.attributionWindow }}. These deterministic results let the block demonstrate the post-send section.</p>
								</div>
								<div class="grid grid-cols-2 border-y border-border sm:grid-cols-4">
									<div v-for="metric in [
										{ label: 'Opened', value: campaign.results.opened },
										{ label: 'Clicked', value: campaign.results.clicked },
										{ label: 'Converted', value: campaign.results.converted },
										{ label: 'Unsubscribed', value: campaign.results.unsubscribed },
									]" :key="metric.label" class="border-b border-border p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
										<p class="text-xs text-muted-fg">{{ metric.label }}</p>
										<p class="mt-1 text-xl font-semibold">{{ formatRate(metric.value, campaign.results.delivered) }}</p>
										<p class="mt-1 text-xs text-muted-fg">{{ formatNumber(metric.value) }} people</p>
									</div>
								</div>
								<div>
									<div class="flex items-center justify-between gap-3 text-sm">
										<span class="font-medium">Delivery rate</span>
										<span class="text-muted-fg">{{ campaign.results.failures }} permanent failures</span>
									</div>
									<DomProgress class="mt-3" :value="campaign.results.delivered" :max="campaign.results.delivered + campaign.results.failures" label="Delivery rate" :show-label="false" :show-value="true" tone="success" />
								</div>
							</div>
							<DomEmptyState v-else class="m-auto" title="No results yet" description="Launch this campaign and advance its provider delivery to populate the post-send report.">
								<DomButton v-if="campaign.launch && campaign.launch.state !== 'completed'" @click="advanceDelivery">Advance demo delivery</DomButton>
								<DomButton v-else-if="!locked" variant="secondary" @click="activeView = 'launch'">Prepare launch</DomButton>
							</DomEmptyState>
						</div>
					</template>
				</DomTabs>
			</main>

			<aside class="hidden min-h-0 overflow-y-auto border-l border-border bg-secondary/20 xl:block">
				<div class="border-b border-border px-4 py-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<p class="text-sm font-semibold">Launch control</p>
							<p class="mt-1 text-xs text-muted-fg">Server evidence for revision {{ campaign.validation?.revision ?? campaign.revision }}</p>
						</div>
						<span class="grid size-11 place-items-center rounded-full border border-border bg-canvas text-sm font-semibold">{{ campaign.readiness.score }}</span>
					</div>
					<DomProgress class="mt-4" :value="campaign.readiness.score" label="Readiness" :show-label="false" :show-value="false" :tone="campaign.readiness.blocked ? 'danger' : 'success'" />
				</div>

				<div class="border-b border-border px-4 py-4">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Audience proof</p>
					<dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
						<div><dt class="text-xs text-muted-fg">Segment</dt><dd class="mt-1 font-semibold">{{ formatNumber(campaign.audience.segment) }}</dd></div>
						<div><dt class="text-xs text-muted-fg">Reachable</dt><dd class="mt-1 font-semibold">{{ formatNumber(campaign.audience.reachable) }}</dd></div>
						<div><dt class="text-xs text-muted-fg">Excluded</dt><dd class="mt-1 font-semibold">{{ formatNumber(campaign.audience.excluded) }}</dd></div>
						<div><dt class="text-xs text-muted-fg">Holdout</dt><dd class="mt-1 font-semibold">{{ formatNumber(campaign.audience.holdout) }}</dd></div>
					</dl>
				</div>

				<div class="border-b border-border px-4 py-4">
					<div class="flex items-center justify-between gap-3">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Checks</p>
						<span class="text-xs text-muted-fg">{{ campaign.readiness.passed }} passed</span>
					</div>
					<div class="mt-3 grid gap-3">
						<div v-for="check in campaign.checks" :key="check.id" class="flex items-start gap-2">
							<span class="mt-1.5 size-2 shrink-0 rounded-full" :class="check.state === 'passed' ? 'bg-success' : check.state === 'warning' ? 'bg-warning' : 'bg-destructive'" />
							<div class="min-w-0">
								<p class="text-sm font-medium">{{ check.label }}</p>
								<p class="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-fg">{{ check.detail }}</p>
							</div>
						</div>
					</div>
				</div>

				<div class="px-4 py-4">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Activity</p>
					<div class="mt-3 grid gap-4">
						<div v-for="item in campaign.activity.slice(0, 5)" :key="item.id" class="border-l border-border pl-3">
							<p class="text-sm font-medium">{{ item.action }}</p>
							<p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.detail }}</p>
							<p class="mt-1 text-[11px] text-muted-fg">{{ item.actor }} · {{ item.time }}</p>
						</div>
					</div>
				</div>
			</aside>
		</div>

		<DomDialog v-model="launchDialogOpen" :title="campaign?.scheduleMode === 'immediate' ? 'Start campaign delivery?' : 'Schedule this campaign?'" description="The server will bind the current audience, checks, schedule, and channel configuration to an immutable launch receipt." size="md">
			<div v-if="campaign" class="grid gap-4">
				<div class="grid grid-cols-2 gap-3 border-y border-border py-4 text-sm">
					<div><p class="text-xs text-muted-fg">Reachable</p><p class="mt-1 font-semibold">{{ formatNumber(campaign.audience.reachable) }}</p></div>
					<div><p class="text-xs text-muted-fg">Channels</p><p class="mt-1 font-semibold">{{ campaign.channels.length }}</p></div>
					<div><p class="text-xs text-muted-fg">Delivery</p><p class="mt-1 font-semibold">{{ campaign.scheduleMode === 'immediate' ? 'Immediately' : campaign.sendAt }}</p></div>
					<div><p class="text-xs text-muted-fg">Evidence</p><p class="mt-1 font-semibold">Revision {{ campaign.revision }}</p></div>
				</div>
				<DomCheckbox v-model="launchAcknowledged" label="I reviewed the audience, delivery window, and enabled channels" description="Campaigns cannot be edited after they enter delivery." />
			</div>
			<template #footer>
				<DomButton variant="secondary" :disabled="busyAction === 'launch'" @click="launchDialogOpen = false">Cancel</DomButton>
				<DomButton :disabled="!launchAcknowledged" :loading="busyAction === 'launch'" @click="confirmLaunch">{{ campaign?.scheduleMode === 'immediate' ? 'Start delivery' : 'Schedule campaign' }}</DomButton>
			</template>
		</DomDialog>
	</section>
</template>
