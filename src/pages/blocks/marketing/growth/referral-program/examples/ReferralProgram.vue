<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomNativeSelect, DomTextInput, DomToggle } from '@getdom/studio/vue';

const rewardOptions = [
	{ label: 'GBP 25 account credit', value: 'credit' },
	{ label: 'One free month', value: 'month' },
	{ label: 'GBP 25 gift card', value: 'gift-card' },
];

const channelOptions = [
	{ label: 'Email invite', value: 'email' },
	{ label: 'Copy link', value: 'link' },
	{ label: 'Team workspace', value: 'workspace' },
];

const referralSeed = [
	{
		id: 'ref-101',
		name: 'Maya Chen',
		email: 'maya@example.com',
		status: 'qualified',
		channel: 'Email',
		detail: 'Paid first invoice on Jun 07',
		reward: 25,
	},
	{
		id: 'ref-102',
		name: 'Nora Lee',
		email: 'nora@example.com',
		status: 'pending',
		channel: 'Link',
		detail: 'Trial started, payment pending',
		reward: 0,
	},
	{
		id: 'ref-103',
		name: 'Owen Park',
		email: 'owen@example.com',
		status: 'invited',
		channel: 'Workspace',
		detail: 'Invite opened 2 hours ago',
		reward: 0,
	},
	{
		id: 'ref-104',
		name: 'Priya Shah',
		email: 'priya@example.com',
		status: 'qualified',
		channel: 'Email',
		detail: 'Converted from starter plan',
		reward: 25,
	},
	{
		id: 'ref-105',
		name: 'Sam Taylor',
		email: 'sam@example.com',
		status: 'qualified',
		channel: 'Link',
		detail: 'Qualified after team upgrade',
		reward: 25,
	},
];

const rewardCopy = {
	credit: {
		label: 'GBP 25 credit',
		detail: 'Credit is applied to the next paid invoice when a friend qualifies.',
		value: 25,
	},
	month: {
		label: 'One free month',
		detail: 'The free month is added after the referred workspace pays.',
		value: 39,
	},
	'gift-card': {
		label: 'GBP 25 gift card',
		detail: 'Gift cards are sent after the referral clears fraud review.',
		value: 25,
	},
};

const milestones = [
	{ count: 1, label: 'First reward' },
	{ count: 3, label: 'GBP 75 earned' },
	{ count: 5, label: 'Bonus reward' },
	{ count: 10, label: 'VIP tier' },
];

const referrals = ref([...referralSeed]);
const selectedReward = ref('credit');
const selectedChannel = ref('email');
const friendEmail = ref('riley@example.com');
const copyState = ref('Copy invite link');
const autoNotify = ref(true);
const statusFilter = ref('all');

const inviteUrl = 'https://app.example.com/join?ref=ALEX-2048';
const qualifiedCount = computed(() => referrals.value.filter((referral) => referral.status === 'qualified').length);
const pendingCount = computed(() => referrals.value.filter((referral) => referral.status !== 'qualified').length);
const lifetimeReward = computed(() => referrals.value.reduce((total, referral) => total + referral.reward, 0));
const nextMilestone = computed(() => milestones.find((milestone) => milestone.count > qualifiedCount.value) || milestones[milestones.length - 1]);
const progressPercent = computed(() => Math.min(100, Math.round((qualifiedCount.value / nextMilestone.value.count) * 100)));
const reward = computed(() => rewardCopy[selectedReward.value]);
const filteredReferrals = computed(() => (
	statusFilter.value === 'all'
		? referrals.value
		: referrals.value.filter((referral) => referral.status === statusFilter.value)
));
const statusOptions = computed(() => [
	{ label: `All referrals (${referrals.value.length})`, value: 'all' },
	{ label: `Qualified (${qualifiedCount.value})`, value: 'qualified' },
	{ label: `Pending (${pendingCount.value})`, value: 'pending' },
	{ label: 'Invited', value: 'invited' },
]);
const readinessChecks = computed(() => [
	{ label: 'Invite link is active', passed: true },
	{ label: 'Reward type selected', passed: Boolean(selectedReward.value) },
	{ label: 'Friend email looks ready', passed: friendEmail.value.includes('@') },
	{ label: 'Auto-notify enabled', passed: autoNotify.value },
]);
const canInvite = computed(() => readinessChecks.value.slice(0, 3).every((check) => check.passed));

function copyInvite() {
	copyState.value = 'Link copied';
	window.setTimeout(() => {
		copyState.value = 'Copy invite link';
	}, 1600);
}

function sendInvite() {
	if (!canInvite.value) return;

	const name = friendEmail.value.split('@')[0]
		.split(/[._-]/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ') || 'New friend';

	referrals.value = [
		{
			id: `ref-${Date.now()}`,
			name,
			email: friendEmail.value,
			status: 'invited',
			channel: channelOptions.find((option) => option.value === selectedChannel.value)?.label.replace(' invite', '') || 'Link',
			detail: autoNotify.value ? 'Invite sent with reward reminder' : 'Invite created without reminder',
			reward: 0,
		},
		...referrals.value,
	];
	friendEmail.value = '';
	statusFilter.value = 'all';
}

function statusClass(status) {
	if (status === 'qualified') return 'bg-success/15 text-success';
	if (status === 'pending') return 'bg-warning/15 text-warning';
	return 'bg-secondary text-muted-fg';
}

function money(value) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		maximumFractionDigits: 0,
	}).format(value);
}
</script>

<template>
	<div class="w-full bg-[radial-gradient(circle_at_top_left,rgb(219_234_254),transparent_34%),linear-gradient(135deg,rgb(248_250_252),rgb(240_253_250))] px-3 py-4 text-canvas-fg dark:bg-[radial-gradient(circle_at_top_left,rgb(30_64_175),transparent_32%),linear-gradient(135deg,rgb(15_23_42),rgb(6_78_59))] sm:px-6 lg:px-8">
		<section class="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(0,1fr)_23rem]">
			<div class="overflow-hidden rounded-lg border border-border bg-canvas shadow-2xl shadow-black/10">
				<header class="relative overflow-hidden border-b border-border p-5 sm:p-7">
					<div class="absolute inset-y-0 right-0 hidden w-1/2 bg-[linear-gradient(135deg,transparent,rgb(14_165_233_/_0.12))] sm:block" aria-hidden="true" />
					<div class="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
						<div class="max-w-2xl">
							<p class="text-xs font-semibold uppercase text-muted-fg">Referral program</p>
							<h3 class="mt-2 text-3xl font-semibold sm:text-4xl">Invite friends. Earn rewards.</h3>
							<p class="mt-3 text-sm leading-6 text-muted-fg sm:text-base">
								Share your personal invite link, track every friend from invite to paid conversion, and unlock the next reward tier.
							</p>
						</div>
						<div class="grid w-full gap-2 rounded-lg border border-border bg-canvas/90 p-4 shadow-sm backdrop-blur sm:max-w-xs">
							<div class="flex items-center justify-between gap-3">
								<span class="text-sm text-muted-fg">Lifetime rewards</span>
								<span class="text-2xl font-semibold">{{ money(lifetimeReward) }}</span>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-secondary">
								<div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${progressPercent}%` }" />
							</div>
							<p class="text-xs leading-5 text-muted-fg">
								{{ qualifiedCount }} qualified. {{ nextMilestone.count - qualifiedCount }} more to unlock {{ nextMilestone.label }}.
							</p>
						</div>
					</div>
				</header>

				<div class="grid gap-5 p-4 sm:p-6">
					<section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<div
							v-for="milestone in milestones"
							:key="milestone.count"
							class="rounded-lg border p-4"
							:class="qualifiedCount >= milestone.count ? 'border-primary bg-primary/10' : 'border-border bg-secondary/50'"
						>
							<div class="flex items-center justify-between gap-3">
								<span class="grid size-9 place-items-center rounded-full bg-canvas text-sm font-bold">
									{{ milestone.count }}
								</span>
								<span class="text-xs font-semibold uppercase text-muted-fg">Refs</span>
							</div>
							<p class="mt-4 font-semibold">{{ milestone.label }}</p>
							<p class="mt-1 text-sm text-muted-fg">{{ qualifiedCount >= milestone.count ? 'Unlocked' : 'In progress' }}</p>
						</div>
					</section>

					<section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
						<div class="rounded-lg border border-border bg-canvas p-4 sm:p-5">
							<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<p class="text-xs font-semibold uppercase text-muted-fg">Share invite</p>
									<h4 class="mt-1 text-xl font-semibold">Send a referral</h4>
								</div>
								<span class="w-fit rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
									{{ reward.label }}
								</span>
							</div>

							<div class="mt-5 grid gap-4 lg:grid-cols-2">
								<DomTextInput v-model="friendEmail" label="Friend email" type="email" autocomplete="email" />
								<DomNativeSelect v-model="selectedChannel" label="Invite channel" :options="channelOptions" />
								<DomNativeSelect v-model="selectedReward" label="Reward type" :options="rewardOptions" />
								<label class="grid gap-1 text-sm">
									<span class="font-medium text-canvas-fg">Invite link</span>
									<span class="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2">
										<span class="truncate text-muted-fg">{{ inviteUrl }}</span>
									</span>
								</label>
							</div>

							<div class="mt-5 flex flex-col gap-3 rounded-lg bg-secondary/60 p-4 sm:flex-row sm:items-center sm:justify-between">
								<DomToggle v-model="autoNotify" label="Send reward reminder" description="Email a reminder when the friend starts a trial." />
								<div class="flex shrink-0 gap-2">
									<DomButton variant="secondary" @click="copyInvite">{{ copyState }}</DomButton>
									<DomButton :disabled="!canInvite" @click="sendInvite">Send invite</DomButton>
								</div>
							</div>
						</div>

						<aside class="rounded-lg border border-border bg-canvas p-4 sm:p-5">
							<p class="text-xs font-semibold uppercase text-muted-fg">Reward policy</p>
							<h4 class="mt-1 text-lg font-semibold">{{ reward.label }}</h4>
							<p class="mt-2 text-sm leading-6 text-muted-fg">{{ reward.detail }}</p>
							<div class="mt-4 grid gap-2 text-sm">
								<div
									v-for="check in readinessChecks"
									:key="check.label"
									class="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
								>
									<span class="text-muted-fg">{{ check.label }}</span>
									<span :class="check.passed ? 'text-success' : 'text-warning'" class="font-semibold">
										{{ check.passed ? 'Ready' : 'Needed' }}
									</span>
								</div>
							</div>
						</aside>
					</section>
				</div>
			</div>

			<aside class="grid content-start gap-4">
				<section class="rounded-lg border border-border bg-canvas p-4 shadow-xl shadow-black/10 sm:p-5">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase text-muted-fg">Referral status</p>
							<h4 class="mt-1 text-xl font-semibold">{{ referrals.length }} friends invited</h4>
						</div>
						<span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
							{{ pendingCount }} pending
						</span>
					</div>
					<div class="mt-4">
						<DomNativeSelect v-model="statusFilter" label="Filter referrals" :options="statusOptions" />
					</div>
					<div class="mt-4 grid gap-3">
						<article
							v-for="referral in filteredReferrals"
							:key="referral.id"
							class="rounded-lg border border-border bg-canvas p-3"
						>
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<h5 class="truncate font-semibold">{{ referral.name }}</h5>
									<p class="truncate text-sm text-muted-fg">{{ referral.email }}</p>
								</div>
								<span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize" :class="statusClass(referral.status)">
									{{ referral.status }}
								</span>
							</div>
							<div class="mt-3 flex items-center justify-between gap-3 text-sm">
								<span class="text-muted-fg">{{ referral.detail }}</span>
								<span class="font-semibold">{{ referral.reward ? money(referral.reward) : referral.channel }}</span>
							</div>
						</article>
						<p v-if="!filteredReferrals.length" class="rounded-lg border border-dashed border-border p-4 text-sm text-muted-fg">
							No referrals match this status yet.
						</p>
					</div>
				</section>

				<section class="rounded-lg border border-border bg-canvas p-4 shadow-xl shadow-black/10 sm:p-5">
					<p class="text-xs font-semibold uppercase text-muted-fg">Growth readout</p>
					<div class="mt-4 grid gap-3 text-sm">
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Qualified referrals</span>
							<span class="font-semibold">{{ qualifiedCount }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Pending or invited</span>
							<span class="font-semibold">{{ pendingCount }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Current reward</span>
							<span class="font-semibold">{{ money(reward.value) }}</span>
						</div>
					</div>
					<div class="mt-4 rounded-lg bg-secondary/70 p-3 text-sm leading-6 text-muted-fg">
						<p class="font-semibold text-canvas-fg">Qualification rule</p>
						<p>Reward posts after the referred workspace pays its first invoice and passes duplicate-account review.</p>
					</div>
				</section>
			</aside>
		</section>
	</div>
</template>
