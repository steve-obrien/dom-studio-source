<script setup>
import { computed, ref } from 'vue';
import {
	DomButton,
	DomCard,
	DomSelect,
	DomStatusPill,
	DomTimeSelector,
	DomToggle,
} from '@getdom/studio/vue';

const channels = [
	{ key: 'email', label: 'Email' },
	{ key: 'push', label: 'Push' },
	{ key: 'sms', label: 'SMS' },
	{ key: 'inApp', label: 'In-app' },
];

const digestCadenceOptions = [
	{
		label: 'As activity happens',
		value: 'instant',
		description: 'Send each optional notification as soon as it is ready.',
		meta: 'Immediate',
	},
	{
		label: 'Daily digest',
		value: 'daily',
		description: 'Bundle lower-priority activity into one daily summary.',
		meta: 'Recommended',
	},
	{
		label: 'Weekly digest',
		value: 'weekly',
		description: 'Send one summary at the beginning of each working week.',
		meta: 'Lowest volume',
	},
	{
		label: 'Only critical alerts',
		value: 'critical',
		description: 'Pause optional digest messages and retain required alerts.',
		meta: 'Critical only',
	},
];

const timezoneOptions = [
	{
		label: 'Europe / London',
		value: 'Europe/London',
		description: 'Greenwich Mean Time or British Summer Time.',
		offset: 'UTC +0/+1',
	},
	{
		label: 'America / New York',
		value: 'America/New_York',
		description: 'Eastern Time with daylight-saving adjustments.',
		offset: 'UTC -5/-4',
	},
	{
		label: 'America / Los Angeles',
		value: 'America/Los_Angeles',
		description: 'Pacific Time with daylight-saving adjustments.',
		offset: 'UTC -8/-7',
	},
	{
		label: 'Asia / Singapore',
		value: 'Asia/Singapore',
		description: 'Singapore Standard Time.',
		offset: 'UTC +8',
	},
];

/**
 * Build a fresh notification topic model so restore actions do not retain
 * mutations from the current editing session.
 *
 * @returns {Array<object>} Preference groups with topic and channel state.
 */
function createPreferenceGroups() {
	return [
		{
			id: 'workspace',
			label: 'Workspace activity',
			description: 'Collaboration signals that keep people close to active work.',
			topics: [
				{
					key: 'mentions',
					label: 'Mentions and assignments',
					detail: 'When someone mentions you, assigns a task, or requests a review.',
					required: false,
					channels: { email: true, push: true, sms: false, inApp: true },
				},
				{
					key: 'comments',
					label: 'Thread replies',
					detail: 'Replies on conversations, records, and docs you follow.',
					required: false,
					channels: { email: false, push: true, sms: false, inApp: true },
				},
				{
					key: 'weekly-summary',
					label: 'Workspace summary',
					detail: 'A digest of completed work, open blockers, and decisions.',
					required: false,
					channels: { email: true, push: false, sms: false, inApp: true },
				},
			],
		},
		{
			id: 'account',
			label: 'Account and billing',
			description: 'Account state, invoice, and security notifications.',
			topics: [
				{
					key: 'security',
					label: 'Security and sign-in alerts',
					detail: 'New sign-ins, password changes, recovery codes, and MFA changes.',
					required: true,
					channels: { email: true, push: true, sms: true, inApp: true },
				},
				{
					key: 'billing',
					label: 'Billing and invoices',
					detail: 'Receipts, payment failures, plan changes, and renewal reminders.',
					required: true,
					channels: { email: true, push: false, sms: false, inApp: true },
				},
				{
					key: 'product',
					label: 'Product announcements',
					detail: 'Feature launches, beta invitations, and education campaigns.',
					required: false,
					channels: { email: true, push: false, sms: false, inApp: false },
				},
			],
		},
	];
}

const preferenceGroups = ref(createPreferenceGroups());
const digest = ref({
	cadence: 'daily',
	timezone: 'Europe/London',
	deliveryTime: '09:00',
});
const quietHours = ref({
	enabled: true,
	start: '18:00',
	end: '08:30',
});
const activeGroupId = ref('workspace');
const saveState = ref('synced');

/**
 * Return every topic in one list for aggregate status calculations.
 *
 * @returns {Array<object>} All preference topics.
 */
function getAllTopics() {
	const topics = [];
	for (const group of preferenceGroups.value) topics.push(...group.topics);
	return topics;
}

/**
 * Resolve the currently selected preference group.
 *
 * @returns {object} Active preference group.
 */
function getActiveGroup() {
	return preferenceGroups.value.find((group) => group.id === activeGroupId.value) || preferenceGroups.value[0];
}

/**
 * Build rich options for the category selector.
 *
 * @returns {Array<object>} Select-ready preference group options.
 */
function getGroupOptions() {
	return preferenceGroups.value.map((group) => ({
		value: group.id,
		label: group.label,
		description: group.description,
		topicCount: group.topics.length,
	}));
}

/**
 * Count the enabled delivery routes across all topics and channels.
 *
 * @returns {number} Enabled topic-channel combinations.
 */
function getEnabledChannelCount() {
	let count = 0;
	for (const topic of getAllTopics()) {
		for (const channel of channels) {
			if (topic.channels[channel.key]) count += 1;
		}
	}
	return count;
}

/**
 * Count optional topics that currently have every delivery channel disabled.
 *
 * @returns {number} Fully muted optional topic count.
 */
function getOptionalDisabledCount() {
	let count = 0;
	for (const topic of getAllTopics()) {
		if (topic.required) continue;
		if (channels.every((channel) => !topic.channels[channel.key])) count += 1;
	}
	return count;
}

/**
 * Count topics that retain a required email route.
 *
 * @returns {number} Required topic count.
 */
function getRequiredAlertCount() {
	return getAllTopics().filter((topic) => topic.required).length;
}

/**
 * Build the compact persistence preview shown beside the controls.
 *
 * @returns {object} Current global delivery settings.
 */
function getSaveSummary() {
	return {
		cadence: digest.value.cadence,
		timezone: digest.value.timezone,
		quietHours: quietHours.value.enabled ? `${quietHours.value.start}–${quietHours.value.end}` : 'Off',
		enabledChannels: getEnabledChannelCount(),
	};
}

/**
 * Resolve the user-facing save status label.
 *
 * @returns {string} Current save status.
 */
function getSaveStatusLabel() {
	if (saveState.value === 'saved') return 'Preferences saved';
	if (saveState.value === 'unsaved') return 'Unsaved changes';
	return 'Synced with workspace';
}

/**
 * Resolve the semantic tone used by the save status pill.
 *
 * @returns {string} DOM Studio status tone.
 */
function getSaveStatusTone() {
	return saveState.value === 'unsaved' ? 'warning' : 'success';
}

const activeGroup = computed(getActiveGroup);
const groupOptions = computed(getGroupOptions);
const enabledChannelCount = computed(getEnabledChannelCount);
const optionalDisabledCount = computed(getOptionalDisabledCount);
const requiredAlertCount = computed(getRequiredAlertCount);
const saveSummary = computed(getSaveSummary);
const saveStatusLabel = computed(getSaveStatusLabel);
const saveStatusTone = computed(getSaveStatusTone);

/**
 * Count active channels for one notification topic.
 *
 * @param {object} topic Notification topic record.
 * @returns {number} Enabled channel count.
 */
function topicEnabledCount(topic) {
	return channels.filter((channel) => topic.channels[channel.key]).length;
}

/**
 * Mark the settings surface as changed after a form control update.
 *
 * @returns {void}
 */
function markUnsaved() {
	saveState.value = 'unsaved';
}

/**
 * Apply one boolean state to a topic's delivery routes while preserving the
 * required email route for operational notifications.
 *
 * @param {object} topic Notification topic record.
 * @param {boolean} enabled Desired channel state.
 * @returns {void}
 */
function setTopicChannels(topic, enabled) {
	for (const channel of channels) {
		topic.channels[channel.key] = topic.required && channel.key === 'email' ? true : enabled;
	}
	markUnsaved();
}

/**
 * Restore the sample workspace defaults and keep the result ready for review.
 *
 * @returns {void}
 */
function restoreDefaults() {
	preferenceGroups.value = createPreferenceGroups();
	digest.value = {
		cadence: 'daily',
		timezone: 'Europe/London',
		deliveryTime: '09:00',
	};
	quietHours.value = {
		enabled: true,
		start: '18:00',
		end: '08:30',
	};
	activeGroupId.value = 'workspace';
	markUnsaved();
}

/**
 * Simulate persistence after the user reviews their notification settings.
 *
 * @returns {void}
 */
function savePreferences() {
	saveState.value = 'saved';
}
</script>

<template>
	<DomCard
		as="section"
		padding="none"
		class="text-canvas-fg shadow-xl shadow-black/5"
		aria-labelledby="notification-preferences-title"
	>
		<header class="border-b border-border px-5 py-5 sm:px-7 sm:py-6">
			<div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
				<div class="max-w-2xl">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Account settings</p>
					<h3 id="notification-preferences-title" class="mt-2 text-2xl font-semibold tracking-tight">
						Notification preferences
					</h3>
					<p class="mt-2 text-sm leading-6 text-muted-fg">
						Choose how product and account updates reach you without losing required security or billing notices.
					</p>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<div aria-live="polite">
						<DomStatusPill :tone="saveStatusTone" size="sm">{{ saveStatusLabel }}</DomStatusPill>
					</div>
					<DomButton variant="secondary" size="sm" @click="restoreDefaults">Restore defaults</DomButton>
					<DomButton size="sm" :disabled="saveState !== 'unsaved'" @click="savePreferences">Save changes</DomButton>
				</div>
			</div>

			<div class="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-sm">
				<span><strong class="font-semibold text-canvas-fg">{{ enabledChannelCount }}</strong> <span class="text-muted-fg">delivery routes</span></span>
				<span><strong class="font-semibold text-canvas-fg">{{ requiredAlertCount }}</strong> <span class="text-muted-fg">required topics</span></span>
				<span><strong class="font-semibold text-canvas-fg">{{ optionalDisabledCount }}</strong> <span class="text-muted-fg">fully muted</span></span>
			</div>
		</header>

		<div class="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_21rem]">
			<main class="min-w-0">
				<section class="border-b border-border px-5 py-5 sm:px-7">
					<div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,20rem)] sm:items-end">
						<div>
							<h4 class="text-lg font-semibold tracking-tight">Notification topics</h4>
							<p class="mt-1 text-sm leading-6 text-muted-fg">
								Tune each category, then choose the delivery routes that make sense for each topic.
							</p>
						</div>

						<DomSelect
							v-model="activeGroupId"
							label="Preference category"
							:options="groupOptions"
							width="w-[min(24rem,calc(100vw-2rem))]"
						>
							<template #value="{ option }">
								<span v-if="option" class="flex min-w-0 items-center justify-between gap-3">
									<span class="truncate font-medium">{{ option.label }}</span>
									<span class="shrink-0 text-xs text-muted-fg">{{ option.topicCount }} topics</span>
								</span>
							</template>
							<template #option="{ option, selected }">
								<span class="flex min-w-0 items-start justify-between gap-4">
									<span class="min-w-0">
										<span class="block font-medium">{{ option.label }}</span>
										<span class="mt-1 block text-xs leading-5 opacity-75">{{ option.description }}</span>
									</span>
									<DomStatusPill v-if="selected" tone="success" size="sm">Active</DomStatusPill>
								</span>
							</template>
						</DomSelect>
					</div>
				</section>

				<section aria-live="polite">
					<div class="border-b border-border bg-secondary/35 px-5 py-3 sm:px-7">
						<p class="text-sm font-semibold">{{ activeGroup.label }}</p>
						<p class="mt-0.5 text-xs leading-5 text-muted-fg">{{ activeGroup.description }}</p>
					</div>

					<article
						v-for="topic in activeGroup.topics"
						:key="topic.key"
						class="border-b border-border px-5 py-5 last:border-b-0 sm:px-7"
					>
						<div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<h5 class="font-semibold">{{ topic.label }}</h5>
									<DomStatusPill v-if="topic.required" tone="warning" size="sm">Required email</DomStatusPill>
									<DomStatusPill tone="neutral" size="sm" :dot="false">
										{{ topicEnabledCount(topic) }}/{{ channels.length }} channels
									</DomStatusPill>
								</div>
								<p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">{{ topic.detail }}</p>
							</div>

							<div class="flex shrink-0 flex-wrap gap-2">
								<DomButton variant="ghost" size="xs" @click="setTopicChannels(topic, true)">All on</DomButton>
								<DomButton variant="secondary" size="xs" @click="setTopicChannels(topic, false)">
									{{ topic.required ? 'Required only' : 'Mute' }}
								</DomButton>
							</div>
						</div>

						<fieldset class="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
							<legend class="sr-only">Delivery channels for {{ topic.label }}</legend>
							<DomToggle
								v-for="channel in channels"
								:key="channel.key"
								v-model="topic.channels[channel.key]"
								:label="channel.label"
								:description="topic.required && channel.key === 'email' ? 'Required' : ''"
								:disabled="topic.required && channel.key === 'email'"
								size="sm"
								@update:model-value="markUnsaved"
							/>
						</fieldset>
					</article>
				</section>
			</main>

			<aside class="border-t border-border bg-secondary/25 lg:border-l lg:border-t-0">
				<section class="border-b border-border p-5">
					<h4 class="font-semibold tracking-tight">Digest delivery</h4>
					<p class="mt-1 text-sm leading-6 text-muted-fg">Bundle lower-priority activity into a predictable summary.</p>

					<div class="mt-4 grid gap-4">
						<DomSelect
							v-model="digest.cadence"
							label="Cadence"
							:options="digestCadenceOptions"
							width="w-[min(22rem,calc(100vw-2rem))]"
							@update:model-value="markUnsaved"
						>
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
							v-model="digest.timezone"
							label="Timezone"
							:options="timezoneOptions"
							width="w-[min(22rem,calc(100vw-2rem))]"
							@update:model-value="markUnsaved"
						>
							<template #option="{ option }">
								<span class="block">
									<span class="flex items-center justify-between gap-3">
										<span class="font-medium">{{ option.label }}</span>
										<span class="text-xs opacity-75">{{ option.offset }}</span>
									</span>
									<span class="mt-1 block text-xs leading-5 opacity-75">{{ option.description }}</span>
								</span>
							</template>
						</DomSelect>

						<DomTimeSelector
							v-model="digest.deliveryTime"
							label="Delivery time"
							:minute-step="30"
							@update:model-value="markUnsaved"
						/>
					</div>
				</section>

				<section class="border-b border-border p-5">
					<DomToggle
						v-model="quietHours.enabled"
						label="Quiet hours"
						description="Pause push and SMS outside working hours."
						@update:model-value="markUnsaved"
					/>
					<div class="mt-4 grid grid-cols-2 gap-3">
						<DomTimeSelector
							v-model="quietHours.start"
							label="Start"
							:minute-step="30"
							:disabled="!quietHours.enabled"
							@update:model-value="markUnsaved"
						/>
						<DomTimeSelector
							v-model="quietHours.end"
							label="End"
							:minute-step="30"
							:disabled="!quietHours.enabled"
							@update:model-value="markUnsaved"
						/>
					</div>
					<p class="mt-3 text-xs leading-5 text-muted-fg">Required email alerts continue during quiet hours.</p>
				</section>

				<section class="p-5">
					<h4 class="font-semibold tracking-tight">Save preview</h4>
					<dl class="mt-3 grid gap-2 text-sm">
						<div class="flex justify-between gap-4">
							<dt class="text-muted-fg">Cadence</dt>
							<dd class="font-semibold">{{ saveSummary.cadence }}</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class="text-muted-fg">Timezone</dt>
							<dd class="max-w-40 truncate text-right font-semibold">{{ saveSummary.timezone }}</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class="text-muted-fg">Quiet hours</dt>
							<dd class="font-semibold">{{ saveSummary.quietHours }}</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class="text-muted-fg">Delivery routes</dt>
							<dd class="font-semibold">{{ saveSummary.enabledChannels }}</dd>
						</div>
					</dl>
				</section>
			</aside>
		</div>
	</DomCard>
</template>
