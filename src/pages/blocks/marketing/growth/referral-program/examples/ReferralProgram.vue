<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomEmptyState,
	DomProgress,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/referral-program';
const tabs = [
	{ key: 'invite', label: 'Invite' },
	{ key: 'referrals', label: 'Referrals' },
	{ key: 'rewards', label: 'Rewards' },
	{ key: 'activity', label: 'Activity' },
];

const workspace = ref(null);
const activeView = ref('invite');
const friendEmail = ref('riley@harbor.test');
const inviteChannel = ref('email');
const statusFilter = ref('all');
const selectedReferralId = ref('ref_102');
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const redeemDialogOpen = ref(false);
const redemptionAcknowledged = ref(false);

const filteredReferrals = computed(buildFilteredReferrals);
const selectedReferral = computed(getSelectedReferral);
const rewardPreference = computed(getRewardPreference);
const statusOptions = computed(buildStatusOptions);
const transitionLabel = computed(getTransitionLabel);

onMounted(loadWorkspace);

/**
 * Loads the server-owned referral member, policy, funnel, and ledger state.
 *
 * @returns {Promise<void>} Resolves after the workspace is ready.
 */
async function loadWorkspace() {
	loading.value = true;
	error.value = '';
	try {
		applyWorkspace(await apiRequest(`${apiBase}/bootstrap`));
	} catch (requestError) {
		error.value = requestError.message;
	} finally {
		loading.value = false;
	}
}

/**
 * Persists the selected payout form and reminder preference.
 *
 * @returns {Promise<void>} Resolves after the revisioned save completes.
 */
async function savePreferences() {
	if (!workspace.value) return;
	await performMutation('preferences', `${apiBase}/preferences`, {
		method: 'PATCH',
		body: {
			revision: workspace.value.program.revision,
			rewardType: workspace.value.program.rewardType,
			autoNotify: workspace.value.program.autoNotify,
		},
	}, 'Reward preferences saved for future qualifications.');
}

/**
 * Creates an invitation and opens its lifecycle record.
 *
 * @returns {Promise<void>} Resolves after provider acceptance or validation failure.
 */
async function sendInvite() {
	if (!workspace.value) return;
	busyAction.value = 'invite';
	error.value = '';
	notice.value = '';
	try {
		const result = await apiRequest(`${apiBase}/invites`, {
			method: 'POST',
			body: {
				revision: workspace.value.program.revision,
				email: friendEmail.value,
				channel: inviteChannel.value,
			},
		});
		applyWorkspace(result);
		selectedReferralId.value = result.receipt?.referralId || workspace.value.referrals[0]?.id || '';
		friendEmail.value = '';
		statusFilter.value = 'all';
		activeView.value = 'referrals';
		notice.value = `Invite accepted by the provider with attribution ${result.receipt?.attributionId}.`;
	} catch (requestError) {
		error.value = requestError.message;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Records a server-attributed share and copies the signed URL when permitted.
 *
 * @param {string} channel Share channel.
 * @returns {Promise<void>} Resolves after receipt creation and optional clipboard copy.
 */
async function recordShare(channel) {
	busyAction.value = `share-${channel}`;
	error.value = '';
	notice.value = '';
	try {
		const result = await apiRequest(`${apiBase}/shares`, {
			method: 'POST',
			body: { channel },
		});
		applyWorkspace(result);
		await copyText(result.receipt?.signedUrl || '');
		notice.value = `${channelLabel(channel)} share receipt ${result.receipt?.id} created.`;
	} catch (requestError) {
		error.value = requestError.message;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Advances the selected referral through one provider webhook state.
 *
 * @returns {Promise<void>} Resolves after lifecycle evidence is processed.
 */
async function advanceSelectedReferral() {
	if (!selectedReferral.value) return;
	const previousStatus = selectedReferral.value.status;
	await performMutation('advance', `${apiBase}/referrals/${selectedReferral.value.id}/advance`, {
		method: 'POST',
		body: {},
	}, previousStatus === 'trial_started'
		? 'Qualification passed. The base reward and any milestone bonus were credited.'
		: 'Provider lifecycle event processed.');
}

/**
 * Opens the balance redemption confirmation.
 *
 * @returns {void}
 */
function openRedeemDialog() {
	redemptionAcknowledged.value = false;
	redeemDialogOpen.value = true;
}

/**
 * Applies the available balance to the member's next invoice.
 *
 * @returns {Promise<void>} Resolves after the billing ledger acknowledges redemption.
 */
async function redeemBalance() {
	if (!workspace.value) return;
	await performMutation('redeem', `${apiBase}/rewards/redeem`, {
		method: 'POST',
		body: {
			revision: workspace.value.program.revision,
			acknowledged: redemptionAcknowledged.value,
		},
	}, 'Available rewards were applied to the next invoice with an immutable receipt.');
	if (!error.value) redeemDialogOpen.value = false;
}

/**
 * Restores the deterministic starting state for another complete journey.
 *
 * @returns {Promise<void>} Resolves after the example is reset.
 */
async function resetProgram() {
	await performMutation('reset', `${apiBase}/reset`, {
		method: 'POST',
		body: {},
	}, 'Referral example restored.');
	friendEmail.value = 'riley@harbor.test';
	inviteChannel.value = 'email';
	statusFilter.value = 'all';
	selectedReferralId.value = 'ref_102';
	activeView.value = 'invite';
}

/**
 * Selects a referral for lifecycle and policy inspection.
 *
 * @param {string} referralId Referral identifier.
 * @returns {void}
 */
function selectReferral(referralId) {
	selectedReferralId.value = referralId;
}

/**
 * Runs a JSON mutation with shared loading, error, and workspace handling.
 *
 * @param {string} action Busy action identifier.
 * @param {string} url API URL.
 * @param {{ method: string, body: object }} options Request options.
 * @param {string} successMessage Success notice.
 * @returns {Promise<object|null>} Parsed response or null after failure.
 */
async function performMutation(action, url, options, successMessage) {
	busyAction.value = action;
	error.value = '';
	notice.value = '';
	try {
		const result = await apiRequest(url, options);
		applyWorkspace(result);
		notice.value = successMessage;
		return result;
	} catch (requestError) {
		error.value = requestError.message;
		return null;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Replaces the local workspace with an immutable API response.
 *
 * @param {object} result Referral API payload.
 * @returns {void}
 */
function applyWorkspace(result) {
	workspace.value = result;
	if (!selectedReferralId.value && result.referrals?.length) selectedReferralId.value = result.referrals[0].id;
}

/**
 * Calls the referral JSON API and promotes HTTP errors to exceptions.
 *
 * @param {string} url API URL.
 * @param {{ method?: string, body?: object }} [options={}] Request options.
 * @returns {Promise<any>} Parsed JSON response.
 */
async function apiRequest(url, options = {}) {
	const response = await fetch(url, {
		method: options.method || 'GET',
		headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const result = await response.json();
	if (!response.ok) throw new Error(result.error || 'Referral service request failed.');
	return result;
}

/**
 * Copies text when the current browser permits clipboard access.
 *
 * @param {string} value Text to copy.
 * @returns {Promise<void>} Resolves whether or not clipboard access is available.
 */
async function copyText(value) {
	if (!value || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
	try {
		await navigator.clipboard.writeText(value);
	} catch {
		// The API receipt remains available when iframe clipboard permissions are unavailable.
	}
}

/**
 * Filters referrals by the selected lifecycle grouping.
 *
 * @returns {Array<object>} Visible referral rows.
 */
function buildFilteredReferrals() {
	if (!workspace.value) return [];
	if (statusFilter.value === 'qualified') return workspace.value.referrals.filter(isQualifiedReferral);
	if (statusFilter.value === 'active') return workspace.value.referrals.filter(isActiveReferral);
	return workspace.value.referrals;
}

/**
 * Returns whether a referral has earned its reward.
 *
 * @param {object} referral Referral row.
 * @returns {boolean} Whether the referral is qualified.
 */
function isQualifiedReferral(referral) {
	return referral.status === 'qualified';
}

/**
 * Returns whether a referral is still moving through the funnel.
 *
 * @param {object} referral Referral row.
 * @returns {boolean} Whether the referral is active.
 */
function isActiveReferral(referral) {
	return referral.status !== 'qualified';
}

/**
 * Resolves the selected referral record.
 *
 * @returns {object|null} Active referral or null.
 */
function getSelectedReferral() {
	return workspace.value?.referrals.find(matchesSelectedReferral) || workspace.value?.referrals[0] || null;
}

/**
 * Matches the current referral selection.
 *
 * @param {object} referral Referral row.
 * @returns {boolean} Whether the row is selected.
 */
function matchesSelectedReferral(referral) {
	return referral.id === selectedReferralId.value;
}

/**
 * Resolves the active reward preference metadata.
 *
 * @returns {object|null} Reward option or null.
 */
function getRewardPreference() {
	return workspace.value?.catalog.rewardOptions.find(matchesRewardPreference) || null;
}

/**
 * Matches the active reward preference.
 *
 * @param {object} option Reward option.
 * @returns {boolean} Whether the option is selected.
 */
function matchesRewardPreference(option) {
	return option.value === workspace.value?.program.rewardType;
}

/**
 * Builds status filter options with current server counts.
 *
 * @returns {Array<object>} Rich status options.
 */
function buildStatusOptions() {
	const referrals = workspace.value?.referrals || [];
	const qualified = referrals.filter(isQualifiedReferral).length;
	return [
		{ value: 'all', label: 'All referrals', description: `${referrals.length} attributed people` },
		{ value: 'active', label: 'In progress', description: `${referrals.length - qualified} still moving through the funnel` },
		{ value: 'qualified', label: 'Qualified', description: `${qualified} rewards credited` },
	];
}

/**
 * Returns the next provider event label for the selected referral.
 *
 * @returns {string} Lifecycle action label.
 */
function getTransitionLabel() {
	return {
		invited: 'Record invite opened',
		opened: 'Start referred trial',
		trial_started: 'Verify first invoice',
	}[selectedReferral.value?.status] || 'Lifecycle complete';
}

/**
 * Maps referral lifecycle state to a readable label.
 *
 * @param {string} status Referral state.
 * @returns {string} Status label.
 */
function statusLabel(status) {
	return {
		invited: 'Invited',
		opened: 'Opened',
		trial_started: 'Trial started',
		qualified: 'Qualified',
	}[status] || status;
}

/**
 * Maps referral lifecycle state to a semantic tone.
 *
 * @param {string} status Referral state.
 * @returns {string} DOM Studio status tone.
 */
function statusTone(status) {
	return {
		invited: 'neutral',
		opened: 'info',
		trial_started: 'warning',
		qualified: 'success',
	}[status] || 'neutral';
}

/**
 * Maps an activity actor to compact avatar initials.
 *
 * @param {string} actor Activity actor.
 * @returns {string} Avatar initials.
 */
function actorInitials(actor) {
	return String(actor || '')
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map(firstCharacter)
		.join('')
		.toUpperCase();
}

/**
 * Returns the first character of a text fragment.
 *
 * @param {string} value Text fragment.
 * @returns {string} First character.
 */
function firstCharacter(value) {
	return value.charAt(0);
}

/**
 * Formats a currency value using the program currency.
 *
 * @param {number} value Numeric amount.
 * @returns {string} Localized currency amount.
 */
function money(value) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: workspace.value?.program.currency || 'GBP',
		maximumFractionDigits: 0,
	}).format(Number(value || 0));
}

/**
 * Resolves a sharing channel label.
 *
 * @param {string} value Channel value.
 * @returns {string} Channel label.
 */
function channelLabel(value) {
	return workspace.value?.catalog.channelOptions.find((option) => option.value === value)?.label || value;
}
</script>

<template>
	<section class="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-canvas text-canvas-fg">
		<header class="shrink-0 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur sm:px-5">
			<div class="flex min-w-0 items-center justify-between gap-3">
				<div class="flex min-w-0 items-center gap-3">
					<DomAvatar v-if="workspace" :name="workspace.member.name" :initials="workspace.member.initials" size="sm" />
					<div class="min-w-0">
						<div class="flex min-w-0 items-center gap-2">
							<h1 class="truncate text-sm font-semibold sm:text-base">Refer &amp; earn</h1>
							<DomBadge v-if="workspace" tone="primary" size="sm" variant="soft" class="hidden sm:inline-flex">{{ workspace.program.name }}</DomBadge>
						</div>
						<p class="mt-0.5 hidden truncate text-xs text-muted-fg sm:block">Give a friend £25. Get £25 when they become a customer.</p>
					</div>
				</div>
				<DomButton variant="secondary" size="sm" :loading="busyAction === 'reset'" @click="resetProgram">Reset example</DomButton>
			</div>
		</header>

		<div v-if="loading" class="grid min-h-0 flex-1 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
			<DomSkeleton height="100%" label="Loading referral program" />
			<DomSkeleton height="100%" label="Loading policy evidence" />
		</div>

		<div v-else-if="!workspace" class="grid min-h-0 flex-1 place-items-center p-5">
			<DomEmptyState title="Referral program unavailable" :description="error || 'The referral service did not return a workspace.'">
				<DomButton @click="loadWorkspace">Try again</DomButton>
			</DomEmptyState>
		</div>

		<div v-else class="grid min-h-0 flex-1 xl:grid-cols-[minmax(0,1fr)_20rem]">
			<main class="flex min-h-0 min-w-0 flex-col overflow-hidden">
				<section class="shrink-0 border-b border-border bg-secondary/25 px-4 py-4 sm:px-6">
					<div class="mx-auto grid max-w-5xl gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
						<div class="min-w-0">
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Available rewards</p>
							<div class="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
								<p class="text-3xl font-semibold tracking-tight sm:text-4xl">{{ money(workspace.stats.availableBalance) }}</p>
								<p class="pb-1 text-sm text-muted-fg">{{ money(workspace.stats.lifetimeEarned) }} earned all time</p>
							</div>
							<div class="mt-3 flex max-w-xl items-center gap-3">
								<DomProgress :value="workspace.stats.progress" label="Next reward milestone" :show-label="false" :show-value="false" size="sm" />
								<p class="shrink-0 text-xs font-medium text-muted-fg">{{ workspace.stats.remaining }} to {{ workspace.stats.nextMilestone.label }}</p>
							</div>
						</div>
						<div class="hidden grid-cols-3 divide-x divide-border border-l border-border sm:grid">
							<div class="px-4 text-center"><p class="text-xl font-semibold">{{ workspace.stats.invited }}</p><p class="text-xs text-muted-fg">Invited</p></div>
							<div class="px-4 text-center"><p class="text-xl font-semibold">{{ workspace.stats.active }}</p><p class="text-xs text-muted-fg">Active</p></div>
							<div class="px-4 text-center"><p class="text-xl font-semibold">{{ workspace.stats.qualified }}</p><p class="text-xs text-muted-fg">Qualified</p></div>
						</div>
					</div>
				</section>

				<DomAlert v-if="error" class="m-3 shrink-0" tone="danger" title="Referral action failed" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-if="notice && !error" class="m-3 shrink-0" tone="success" title="Referral program updated" :description="notice" dismissible @dismiss="notice = ''" />

				<DomTabs v-model="activeView" :tabs="tabs" variant="page" fill class="min-h-0">
					<template #invite>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-5xl lg:grid-cols-[minmax(0,1fr)_18rem]">
								<section class="border-b border-border p-4 sm:p-6 lg:border-b-0 lg:border-r">
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Your personal invite</p>
									<h2 class="mt-2 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">Give £25. Get £25.</h2>
									<p class="mt-2 max-w-xl text-sm leading-6 text-muted-fg">Invite someone who would genuinely benefit from Northstar. Their reward appears on their first invoice; yours is credited after payment and account checks.</p>

									<div class="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_16rem]">
										<DomTextInput v-model="friendEmail" label="Friend email" type="email" autocomplete="email" description="We will attach your signed attribution code." />
										<DomSelect v-model="inviteChannel" :options="workspace.catalog.channelOptions" label="Invite channel" width="min-w-[16rem]">
											<template #option="{ option }">
												<div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div>
											</template>
										</DomSelect>
									</div>
									<div class="mt-4 flex flex-col gap-3 border-y border-border py-4 sm:flex-row sm:items-center sm:justify-between">
										<DomToggle v-model="workspace.program.autoNotify" label="Milestone reminders" description="Keep Alex updated as the friend progresses." />
										<DomButton class="sm:shrink-0" :loading="busyAction === 'invite'" :disabled="!friendEmail" @click="sendInvite">Send tracked invite</DomButton>
									</div>

									<div class="mt-6">
										<div class="flex items-center justify-between gap-3">
											<div><p class="text-sm font-semibold">Or share your signed link</p><p class="mt-1 text-xs text-muted-fg">Each action creates a campaign and terms receipt.</p></div>
											<DomBadge tone="neutral" size="sm">{{ workspace.member.referralCode }}</DomBadge>
										</div>
										<p class="mt-3 min-w-0 truncate border-y border-border bg-secondary/30 px-3 py-2.5 font-mono text-xs text-muted-fg">{{ workspace.member.inviteUrl }}</p>
										<div class="mt-3 flex flex-wrap gap-2">
											<DomButton v-for="option in workspace.catalog.channelOptions" :key="option.value" variant="secondary" size="sm" :loading="busyAction === `share-${option.value}`" @click="recordShare(option.value)">{{ option.label }}</DomButton>
										</div>
									</div>
								</section>

								<aside class="p-4 sm:p-6">
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Reward preference</p>
									<DomSelect v-model="workspace.program.rewardType" class="mt-3" :options="workspace.catalog.rewardOptions" label="Receive rewards as" width="min-w-[17rem]">
										<template #option="{ option }">
											<div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div>
										</template>
									</DomSelect>
									<p class="mt-3 text-sm leading-6 text-muted-fg">{{ rewardPreference?.description }}</p>
									<DomButton class="mt-4 w-full" variant="secondary" :loading="busyAction === 'preferences'" @click="savePreferences">Save preference</DomButton>
									<dl class="mt-6 divide-y divide-border border-y border-border text-sm">
										<div class="flex items-center justify-between gap-3 py-3"><dt class="text-muted-fg">Attribution</dt><dd class="font-medium">{{ workspace.program.attributionWindowDays }} days</dd></div>
										<div class="flex items-center justify-between gap-3 py-3"><dt class="text-muted-fg">Qualification</dt><dd class="font-medium">{{ workspace.program.qualificationWindowDays }} days</dd></div>
										<div class="flex items-center justify-between gap-3 py-3"><dt class="text-muted-fg">Policy revision</dt><dd class="font-medium">{{ workspace.program.revision }}</dd></div>
									</dl>
								</aside>
							</div>
						</div>
					</template>

					<template #referrals>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-5xl md:grid-cols-[minmax(0,1fr)_20rem]">
								<section class="min-w-0 border-b border-border md:border-b-0 md:border-r">
									<div class="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
										<div><h2 class="text-xl font-semibold">Referral journey</h2><p class="mt-1 text-sm text-muted-fg">Provider events, qualification, and reward outcomes.</p></div>
										<DomSelect v-model="statusFilter" :options="statusOptions" label="Filter" chrome="compact" width="min-w-[15rem]">
											<template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template>
										</DomSelect>
									</div>
									<div v-if="filteredReferrals.length" class="divide-y divide-border">
										<button v-for="referral in filteredReferrals" :key="referral.id" type="button" class="flex w-full min-w-0 items-center gap-3 border-l-2 px-4 py-3 text-left transition hover:bg-secondary/45 sm:px-5" :class="selectedReferral?.id === referral.id ? 'border-l-primary bg-secondary/55' : 'border-l-transparent'" @click="selectReferral(referral.id)">
											<DomAvatar :name="referral.name" size="sm" />
											<div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold">{{ referral.name }}</p><p class="mt-0.5 truncate text-xs text-muted-fg">{{ referral.email }} · {{ referral.detail }}</p></div>
											<div class="grid shrink-0 justify-items-end gap-1"><DomStatusPill :tone="statusTone(referral.status)" :label="statusLabel(referral.status)" size="sm" /><span class="text-xs font-medium">{{ referral.reward ? money(referral.reward) : referral.channel }}</span></div>
										</button>
									</div>
									<DomEmptyState v-else title="No matching referrals" description="Choose another lifecycle filter." />
								</section>

								<aside v-if="selectedReferral" class="p-4 sm:p-5">
									<div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Selected referral</p><h3 class="mt-1 text-lg font-semibold">{{ selectedReferral.name }}</h3></div><DomStatusPill :tone="statusTone(selectedReferral.status)" :label="statusLabel(selectedReferral.status)" size="sm" /></div>
									<p class="mt-2 text-sm text-muted-fg">{{ selectedReferral.email }}</p>
									<div class="mt-5 grid gap-2">
										<div v-for="step in ['invited', 'opened', 'trial_started', 'qualified']" :key="step" class="flex items-center gap-3 border-l pl-3" :class="['invited', 'opened', 'trial_started', 'qualified'].indexOf(selectedReferral.status) >= ['invited', 'opened', 'trial_started', 'qualified'].indexOf(step) ? 'border-l-primary' : 'border-l-border'">
											<span class="size-2 rounded-full" :class="['invited', 'opened', 'trial_started', 'qualified'].indexOf(selectedReferral.status) >= ['invited', 'opened', 'trial_started', 'qualified'].indexOf(step) ? 'bg-primary' : 'bg-border'" aria-hidden="true" />
											<div class="py-2"><p class="text-sm font-medium">{{ statusLabel(step) }}</p><p class="mt-0.5 text-xs text-muted-fg">{{ step === 'qualified' ? workspace.program.qualificationRule : 'Tracked by the referral provider' }}</p></div>
										</div>
									</div>
									<dl class="mt-5 divide-y divide-border border-y border-border text-sm"><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Fraud review</dt><dd class="font-medium capitalize">{{ selectedReferral.fraudState.replace('_', ' ') }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Attributed via</dt><dd class="font-medium">{{ selectedReferral.channel }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Reward</dt><dd class="font-medium">{{ money(selectedReferral.reward) }}</dd></div></dl>
									<DomButton v-if="selectedReferral.status !== 'qualified'" class="mt-5 w-full" :loading="busyAction === 'advance'" @click="advanceSelectedReferral">{{ transitionLabel }}</DomButton>
									<DomAlert v-else class="mt-5" tone="success" title="Reward credited" :description="`${money(selectedReferral.reward)} is recorded in the reward ledger.`" />
								</aside>
							</div>
						</div>
					</template>

					<template #rewards>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="mx-auto w-full max-w-5xl">
								<section class="grid gap-4 border-b border-border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-6">
									<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Reward wallet</p><p class="mt-2 text-4xl font-semibold tracking-tight">{{ money(workspace.stats.availableBalance) }}</p><p class="mt-2 text-sm text-muted-fg">Available as {{ rewardPreference?.label.toLowerCase() }}.</p></div>
									<DomButton :disabled="workspace.stats.availableBalance <= 0" @click="openRedeemDialog">Apply to next invoice</DomButton>
								</section>
								<section>
									<div class="border-b border-border px-4 py-3 sm:px-6"><h2 class="text-sm font-semibold">Ledger</h2><p class="mt-1 text-xs text-muted-fg">Server-owned credits, bonuses, and redemptions.</p></div>
									<div class="divide-y divide-border">
										<div v-for="entry in workspace.ledger" :key="entry.id" class="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-4 py-3 sm:px-6">
											<div class="min-w-0"><p class="truncate text-sm font-medium">{{ entry.label }}</p><p class="mt-0.5 truncate text-xs text-muted-fg">{{ entry.detail }} · {{ entry.createdAt }}</p></div>
											<div class="text-right"><p class="text-sm font-semibold" :class="entry.amount > 0 ? 'text-success' : 'text-canvas-fg'">{{ entry.amount > 0 ? '+' : '' }}{{ money(entry.amount) }}</p><p class="mt-0.5 text-xs capitalize text-muted-fg">{{ entry.status }}</p></div>
										</div>
									</div>
								</section>
							</div>
						</div>
					</template>

					<template #activity>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="mx-auto w-full max-w-3xl p-4 sm:p-6">
								<div><h2 class="text-xl font-semibold">Program activity</h2><p class="mt-1 text-sm text-muted-fg">Human actions, provider events, and billing evidence in one trail.</p></div>
								<div class="mt-5 divide-y divide-border border-y border-border">
									<div v-for="item in workspace.activity" :key="item.id" class="flex gap-3 py-4">
										<DomAvatar :name="item.actor" :initials="actorInitials(item.actor)" size="sm" />
										<div class="min-w-0"><p class="text-sm font-semibold">{{ item.label }}</p><p class="mt-1 text-sm leading-6 text-muted-fg">{{ item.detail }}</p><p class="mt-1 text-xs text-muted-fg">{{ item.actor }} · {{ item.createdAt }}</p></div>
									</div>
								</div>
							</div>
						</div>
					</template>
				</DomTabs>
			</main>

			<aside class="hidden min-h-0 overflow-y-auto border-l border-border bg-secondary/20 xl:block">
				<div class="border-b border-border px-5 py-5">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">How rewards work</p>
					<ol class="mt-4 grid gap-4">
						<li v-for="(step, index) in [{ title: 'Share', detail: 'A signed link records campaign and terms.' }, { title: 'Qualify', detail: 'The first paid invoice and account checks must pass.' }, { title: 'Credit', detail: 'The billing ledger applies the chosen reward.' }]" :key="step.title" class="flex gap-3"><span class="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-canvas text-xs font-semibold">{{ index + 1 }}</span><div><p class="text-sm font-semibold">{{ step.title }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ step.detail }}</p></div></li>
					</ol>
				</div>
				<div class="border-b border-border px-5 py-5">
					<div class="flex items-center justify-between gap-3"><p class="text-sm font-semibold">Program policy</p><DomBadge tone="neutral" size="sm">v{{ workspace.program.termsVersion }}</DomBadge></div>
					<p class="mt-3 text-sm leading-6 text-muted-fg">{{ workspace.program.qualificationRule }}</p>
					<dl class="mt-4 divide-y divide-border border-y border-border text-sm"><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Base reward</dt><dd class="font-medium">{{ money(workspace.program.rewardAmount) }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Qualified</dt><dd class="font-medium">{{ workspace.stats.qualified }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Next bonus</dt><dd class="font-medium">{{ money(workspace.stats.nextMilestone.bonus) }}</dd></div></dl>
				</div>
				<div class="px-5 py-5">
					<p class="text-sm font-semibold">Latest evidence</p>
					<div class="mt-3 grid gap-3 text-xs">
						<div v-if="workspace.evidence.inviteReceipt" class="border-l border-border pl-3"><p class="font-medium">Invite accepted</p><p class="mt-1 break-all text-muted-fg">{{ workspace.evidence.inviteReceipt.attributionId }}</p></div>
						<div v-if="workspace.evidence.lifecycleReceipt" class="border-l border-border pl-3"><p class="font-medium">Webhook processed</p><p class="mt-1 break-all text-muted-fg">{{ workspace.evidence.lifecycleReceipt.id }}</p></div>
						<div v-if="workspace.evidence.redemptionReceipt" class="border-l border-border pl-3"><p class="font-medium">Balance applied</p><p class="mt-1 break-all text-muted-fg">{{ workspace.evidence.redemptionReceipt.id }}</p></div>
						<p v-if="!workspace.evidence.inviteReceipt && !workspace.evidence.lifecycleReceipt && !workspace.evidence.redemptionReceipt" class="leading-5 text-muted-fg">Complete an invite, lifecycle, or reward action to see immutable receipts.</p>
					</div>
				</div>
			</aside>
		</div>

		<DomDialog v-model="redeemDialogOpen" title="Apply referral balance?" description="Billing will create an immutable ledger entry and apply the full available balance to the next Northstar invoice." size="md">
			<div class="grid gap-4">
				<div class="grid grid-cols-2 gap-3 border-y border-border py-4 text-sm"><div><p class="text-xs text-muted-fg">Available</p><p class="mt-1 font-semibold">{{ money(workspace?.stats.availableBalance) }}</p></div><div><p class="text-xs text-muted-fg">Destination</p><p class="mt-1 font-semibold">Next invoice</p></div></div>
				<DomCheckbox v-model="redemptionAcknowledged" label="Apply the full available balance" description="This demo action records a billing receipt and cannot be partially applied." />
			</div>
			<template #footer><DomButton variant="secondary" :disabled="busyAction === 'redeem'" @click="redeemDialogOpen = false">Cancel</DomButton><DomButton :disabled="!redemptionAcknowledged" :loading="busyAction === 'redeem'" @click="redeemBalance">Apply balance</DomButton></template>
		</DomDialog>
	</section>
</template>
