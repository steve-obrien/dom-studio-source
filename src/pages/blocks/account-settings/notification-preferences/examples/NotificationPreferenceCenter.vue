<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomNativeSelect, DomToggle } from '@getdom/studio/vue';

const channels = [
	{ key: 'email', label: 'Email' },
	{ key: 'push', label: 'Push' },
	{ key: 'sms', label: 'SMS' },
	{ key: 'inApp', label: 'In-app' },
];

const digestCadenceOptions = [
	{ label: 'As activity happens', value: 'instant' },
	{ label: 'Daily digest', value: 'daily' },
	{ label: 'Weekly digest', value: 'weekly' },
	{ label: 'Only critical alerts', value: 'critical' },
];

const timezoneOptions = [
	{ label: 'Europe / London', value: 'Europe/London' },
	{ label: 'America / New York', value: 'America/New_York' },
	{ label: 'America / Los Angeles', value: 'America/Los_Angeles' },
	{ label: 'Asia / Singapore', value: 'Asia/Singapore' },
];

const preferenceGroups = ref([
	{
		id: 'workspace',
		label: 'Workspace activity',
		description: 'Collaboration signals that help people stay close to active work.',
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
		description: 'Important account state, invoice, and security notifications.',
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
]);

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
const saveState = ref('idle');

const allTopics = computed(() => preferenceGroups.value.flatMap((group) => group.topics.map((topic) => ({ ...topic, group: group.label }))));
const activeGroup = computed(() => preferenceGroups.value.find((group) => group.id === activeGroupId.value) || preferenceGroups.value[0]);
const enabledChannelCount = computed(() => allTopics.value.reduce((count, topic) => {
	return count + channels.filter((channel) => topic.channels[channel.key]).length;
}, 0));
const optionalDisabledCount = computed(() => allTopics.value.filter((topic) => {
	return !topic.required && channels.every((channel) => !topic.channels[channel.key]);
}).length);
const requiredAlertCount = computed(() => allTopics.value.filter((topic) => topic.required).length);
const saveSummary = computed(() => {
	return {
		cadence: digest.value.cadence,
		timezone: digest.value.timezone,
		quietHours: quietHours.value.enabled ? `${quietHours.value.start}-${quietHours.value.end}` : 'off',
		enabledChannels: enabledChannelCount.value,
	};
});

function toggleTopicChannel(topic, channelKey) {
	if (topic.required && channelKey === 'email') return;
	topic.channels[channelKey] = !topic.channels[channelKey];
	saveState.value = 'unsaved';
}

function toggleAllForTopic(topic, enabled) {
	for (const channel of channels) {
		if (topic.required && channel.key === 'email') continue;
		topic.channels[channel.key] = enabled;
	}
	saveState.value = 'unsaved';
}

function setSaveState() {
	saveState.value = 'saved';
}

function statusText() {
	if (saveState.value === 'saved') return 'Preferences saved';
	if (saveState.value === 'unsaved') return 'Unsaved changes';
	return 'Synced with workspace defaults';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-5 py-5 sm:px-7">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Account settings</p>
					<h3 class="mt-2 text-2xl font-semibold tracking-tight">Notification preferences</h3>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
						Let users tune product messages by topic, channel, digest cadence, and quiet hours while preserving required alerts.
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<span
						class="rounded-full px-3 py-1 text-xs font-semibold"
						:class="saveState === 'unsaved' ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'"
					>
						{{ statusText() }}
					</span>
					<DomButton variant="secondary" size="sm">Restore defaults</DomButton>
					<DomButton size="sm" @click="setSaveState">Save changes</DomButton>
				</div>
			</div>

			<div class="mt-5 grid gap-3 md:grid-cols-3">
				<div class="border-l-4 border-primary bg-canvas px-4 py-3">
					<p class="text-xs font-medium text-muted-fg">Enabled channels</p>
					<p class="mt-1 text-2xl font-semibold tracking-tight">{{ enabledChannelCount }}</p>
				</div>
				<div class="border-l-4 border-warning bg-canvas px-4 py-3">
					<p class="text-xs font-medium text-muted-fg">Required topics</p>
					<p class="mt-1 text-2xl font-semibold tracking-tight">{{ requiredAlertCount }}</p>
				</div>
				<div class="border-l-4 border-border bg-canvas px-4 py-3">
					<p class="text-xs font-medium text-muted-fg">Fully muted optional topics</p>
					<p class="mt-1 text-2xl font-semibold tracking-tight">{{ optionalDisabledCount }}</p>
				</div>
			</div>
		</header>

		<div class="grid lg:grid-cols-[16rem_minmax(0,1fr)_20rem]">
			<nav class="border-b border-border bg-secondary/40 p-4 lg:border-b-0 lg:border-r">
				<p class="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Groups</p>
				<div class="mt-3 grid gap-1">
					<button
						v-for="group in preferenceGroups"
						:key="group.id"
						type="button"
						class="rounded-xl px-3 py-3 text-left transition hover:bg-canvas"
						:class="group.id === activeGroupId ? 'bg-canvas shadow-sm ring-1 ring-border' : 'text-muted-fg'"
						@click="activeGroupId = group.id"
					>
						<span class="block text-sm font-semibold text-canvas-fg">{{ group.label }}</span>
						<span class="mt-1 block text-xs leading-5">{{ group.topics.length }} topics</span>
					</button>
				</div>

				<div class="mt-6 border-t border-border pt-4 text-sm leading-6 text-muted-fg">
					<p class="font-semibold text-canvas-fg">Delivery rule</p>
					<p class="mt-1">Required email alerts stay enabled for security, billing, and account recovery messages.</p>
				</div>
			</nav>

			<main class="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
				<div class="border-b border-border px-4 py-4 sm:px-6">
					<h4 class="font-semibold tracking-tight">{{ activeGroup.label }}</h4>
					<p class="mt-1 text-sm leading-6 text-muted-fg">{{ activeGroup.description }}</p>
				</div>

				<div class="overflow-x-auto">
					<div class="min-w-[44rem]">
						<div class="grid grid-cols-[minmax(16rem,1fr)_repeat(4,5.5rem)_8rem] border-b border-border bg-secondary/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg sm:px-6">
							<span>Topic</span>
							<span v-for="channel in channels" :key="channel.key" class="text-center">{{ channel.label }}</span>
							<span class="text-right">Bulk</span>
						</div>

						<div
							v-for="topic in activeGroup.topics"
							:key="topic.key"
							class="grid grid-cols-[minmax(16rem,1fr)_repeat(4,5.5rem)_8rem] items-center border-b border-border px-4 py-4 last:border-b-0 sm:px-6"
						>
							<div class="min-w-0 pr-4">
								<div class="flex flex-wrap items-center gap-2">
									<p class="font-semibold">{{ topic.label }}</p>
									<span v-if="topic.required" class="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">Required</span>
								</div>
								<p class="mt-1 text-sm leading-6 text-muted-fg">{{ topic.detail }}</p>
							</div>

							<div v-for="channel in channels" :key="channel.key" class="flex justify-center">
								<button
									type="button"
									class="grid size-10 place-items-center rounded-full border transition"
									:class="[
										topic.channels[channel.key] ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-canvas text-muted-fg',
										topic.required && channel.key === 'email' ? 'cursor-not-allowed opacity-70' : 'hover:border-primary/60'
									]"
									:aria-pressed="topic.channels[channel.key]"
									:aria-label="`${topic.label} ${channel.label}`"
									@click="toggleTopicChannel(topic, channel.key)"
								>
									<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
										<path v-if="topic.channels[channel.key]" d="m5 12 4 4L19 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
										<path v-else d="M7 7 17 17M17 7 7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
									</svg>
								</button>
							</div>

							<div class="flex justify-end gap-1">
								<button type="button" class="rounded-lg border border-border px-2 py-1 text-xs font-semibold hover:border-primary/50" @click="toggleAllForTopic(topic, true)">
									All
								</button>
								<button type="button" class="rounded-lg border border-border px-2 py-1 text-xs font-semibold hover:border-primary/50" @click="toggleAllForTopic(topic, false)">
									Off
								</button>
							</div>
						</div>
					</div>
				</div>
			</main>

			<aside class="grid content-start gap-5 bg-secondary/25 p-4 sm:p-6">
				<section>
					<div class="flex items-center justify-between gap-3">
						<div>
							<h4 class="font-semibold tracking-tight">Digest delivery</h4>
							<p class="mt-1 text-sm leading-6 text-muted-fg">Bundle low-priority activity into a predictable summary.</p>
						</div>
					</div>
					<div class="mt-4 grid gap-4">
						<DomNativeSelect v-model="digest.cadence" label="Cadence" :options="digestCadenceOptions" @change="saveState = 'unsaved'" />
						<DomNativeSelect v-model="digest.timezone" label="Timezone" :options="timezoneOptions" @change="saveState = 'unsaved'" />
						<label class="grid gap-1 text-sm font-medium">
							<span>Delivery time</span>
							<input
								v-model="digest.deliveryTime"
								type="time"
								class="h-10 rounded-lg border border-border bg-canvas px-3 text-sm text-canvas-fg outline-none focus:border-primary"
								@input="saveState = 'unsaved'"
							/>
						</label>
					</div>
				</section>

				<section class="border-t border-border pt-5">
					<DomToggle v-model="quietHours.enabled" label="Quiet hours" @change="saveState = 'unsaved'" />
					<p class="mt-2 text-sm leading-6 text-muted-fg">Pause push and SMS notifications outside working hours. Required email alerts still send.</p>
					<div class="mt-4 grid grid-cols-2 gap-3">
						<label class="grid gap-1 text-sm font-medium">
							<span>Start</span>
							<input
								v-model="quietHours.start"
								type="time"
								class="h-10 rounded-lg border border-border bg-canvas px-3 text-sm text-canvas-fg outline-none focus:border-primary"
								@input="saveState = 'unsaved'"
							/>
						</label>
						<label class="grid gap-1 text-sm font-medium">
							<span>End</span>
							<input
								v-model="quietHours.end"
								type="time"
								class="h-10 rounded-lg border border-border bg-canvas px-3 text-sm text-canvas-fg outline-none focus:border-primary"
								@input="saveState = 'unsaved'"
							/>
						</label>
					</div>
				</section>

				<section class="border-t border-border pt-5">
					<h4 class="font-semibold tracking-tight">Save preview</h4>
					<dl class="mt-3 grid gap-2 text-sm">
						<div class="flex justify-between gap-4">
							<dt class="text-muted-fg">Cadence</dt>
							<dd class="font-semibold">{{ saveSummary.cadence }}</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class="text-muted-fg">Timezone</dt>
							<dd class="font-semibold">{{ saveSummary.timezone }}</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class="text-muted-fg">Quiet hours</dt>
							<dd class="font-semibold">{{ saveSummary.quietHours }}</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class="text-muted-fg">Active channels</dt>
							<dd class="font-semibold">{{ saveSummary.enabledChannels }}</dd>
						</div>
					</dl>
				</section>
			</aside>
		</div>
	</div>
</template>
