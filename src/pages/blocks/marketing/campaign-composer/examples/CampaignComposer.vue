<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomPopover, DomTabs, DomToggle, DomTooltip } from '@getdom/studio/vue';

const activeCampaignId = ref('activation');
const activeTab = ref('compose');
const previewChannel = ref('Email');
const scheduled = ref(true);
const includeHoldout = ref(true);
const testMode = ref(true);
const subject = ref('Finish setting up your workspace');
const preheader = ref('Invite your team and connect your first project.');
const body = ref('Hi {{first_name}}, your workspace is almost ready. Connect a project, invite your team, and publish your first workflow before the trial checkpoint.');
const cta = ref('Continue setup');
const sendDate = ref('2026-06-12');
const sendTime = ref('09:00');
const audienceSegments = ref(['Trial admins', 'Invited but no project']);
const selectedChannels = ref(['Email', 'In-app']);
const launchState = ref('Draft saved 2 min ago');

const campaigns = [
	{ id: 'activation', name: 'Activation nudge', status: 'Draft', owner: 'Lifecycle', reach: 18420, lift: '+8.6%', updated: '2 min ago' },
	{ id: 'expansion', name: 'Usage milestone', status: 'Review', owner: 'Growth', reach: 6240, lift: '+4.1%', updated: 'Today 11:20' },
	{ id: 'winback', name: 'Dormant workspace', status: 'Paused', owner: 'Success', reach: 3910, lift: '+2.8%', updated: 'Yesterday' },
];

const segments = [
	{ name: 'Trial admins', count: 12400, detail: 'Created a workspace in the last 14 days.' },
	{ name: 'Invited but no project', count: 6020, detail: 'Accepted invite but has not connected data.' },
	{ name: 'Starter plan owners', count: 8100, detail: 'Plan has upgrade-ready usage signals.' },
	{ name: 'Recently contacted', count: -1680, detail: 'Excluded by frequency policy.' },
];

const channels = [
	{ name: 'Email', detail: 'Best for setup prompts and longer copy.', size: '620px template' },
	{ name: 'In-app', detail: 'Shown in the workspace home feed.', size: 'Inline banner' },
	{ name: 'Push', detail: 'Mobile reminder for account owners.', size: '178 characters' },
];

const checks = [
	{ label: 'Consent and suppression lists synced', status: 'Passed', detail: 'Updated 12 min ago' },
	{ label: 'Frequency cap within policy', status: 'Warning', detail: '1,680 people suppressed' },
	{ label: 'Personalization fallback provided', status: 'Passed', detail: 'first_name falls back to there' },
	{ label: 'Unsubscribe and preference links present', status: 'Passed', detail: 'Email footer validated' },
];

const activity = [
	{ label: 'Audience recalculated', detail: '18,420 reachable users after exclusions.', time: '2 min ago' },
	{ label: 'Subject updated', detail: 'Maya shortened subject for mobile inboxes.', time: '18 min ago' },
	{ label: 'Frequency policy warning', detail: 'Recently contacted segment suppressed.', time: 'Today 10:44' },
	{ label: 'Template copied', detail: 'Created from Activation baseline.', time: 'Yesterday' },
];

const tabs = [
	{ key: 'compose', label: 'Compose' },
	{ key: 'audience', label: 'Audience' },
	{ key: 'preview', label: 'Preview' },
];

const activeCampaign = computed(() => campaigns.find((campaign) => campaign.id === activeCampaignId.value) || campaigns[0]);
const estimatedReach = computed(() => {
	return segments
		.filter((segment) => audienceSegments.value.includes(segment.name))
		.reduce((total, segment) => total + segment.count, 0);
});
const readyChecks = computed(() => checks.filter((check) => check.status === 'Passed').length);
const readinessScore = computed(() => {
	let score = 34;
	if (subject.value.length > 0 && subject.value.length <= 64) score += 16;
	if (body.value.length > 120) score += 12;
	if (audienceSegments.value.length) score += 14;
	if (selectedChannels.value.length) score += 10;
	if (scheduled.value && sendDate.value && sendTime.value) score += 8;
	if (includeHoldout.value) score += 6;
	return Math.min(score, 100);
});
const previewBody = computed(() => body.value.replace('{{first_name}}', 'Avery'));
const sendSummary = computed(() => {
	if (!scheduled.value) return 'Manual launch when approved';
	return `${sendDate.value} at ${sendTime.value}`;
});

function selectCampaign(campaign) {
	activeCampaignId.value = campaign.id;
	launchState.value = `${campaign.name} opened`;
	if (campaign.id === 'expansion') {
		subject.value = 'Your team just crossed a usage milestone';
		preheader.value = 'See what changed and where to go next.';
		body.value = 'Hi {{first_name}}, your workspace usage is accelerating. Review the milestone, share the result with your team, and unlock the next workflow.';
		cta.value = 'View milestone';
	}
	if (campaign.id === 'winback') {
		subject.value = 'Pick up where your workspace left off';
		preheader.value = 'Your projects and teammates are still waiting.';
		body.value = 'Hi {{first_name}}, your workspace is ready when you are. Start from your saved project and use the checklist to get back on track.';
		cta.value = 'Return to workspace';
	}
	if (campaign.id === 'activation') {
		subject.value = 'Finish setting up your workspace';
		preheader.value = 'Invite your team and connect your first project.';
		body.value = 'Hi {{first_name}}, your workspace is almost ready. Connect a project, invite your team, and publish your first workflow before the trial checkpoint.';
		cta.value = 'Continue setup';
	}
}

function toggleSegment(segment) {
	audienceSegments.value = audienceSegments.value.includes(segment)
		? audienceSegments.value.filter((item) => item !== segment)
		: [...audienceSegments.value, segment];
	launchState.value = 'Audience draft changed';
}

function toggleChannel(channel) {
	selectedChannels.value = selectedChannels.value.includes(channel)
		? selectedChannels.value.filter((item) => item !== channel)
		: [...selectedChannels.value, channel];
	previewChannel.value = selectedChannels.value[0] || 'Email';
	launchState.value = 'Channel settings changed';
}

function insertToken(token, close) {
	body.value = `${body.value} ${token}`.trim();
	launchState.value = `${token} inserted`;
	close();
}

function saveDraft() {
	launchState.value = 'Draft saved just now';
}

function queueLaunch() {
	launchState.value = testMode.value ? 'Test send queued' : 'Campaign scheduled';
}
</script>

<template>
	<section class="min-h-screen bg-canvas text-canvas-fg">
		<div class="mx-auto flex w-full max-w-7xl flex-col border-x border-border bg-canvas shadow-2xl shadow-black/10">
			<header class="border-b border-border px-4 py-4 sm:px-6">
				<div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
					<div class="min-w-0">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Lifecycle marketing</p>
						<h1 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Campaign composer</h1>
						<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">Draft lifecycle messages, choose reachable audiences, preview every channel, and clear launch checks before scheduling a send.</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<DomButton variant="secondary" @click="saveDraft">Save draft</DomButton>
						<DomButton :disabled="readinessScore < 80" @click="queueLaunch">{{ testMode ? 'Send test' : 'Schedule' }}</DomButton>
					</div>
				</div>
			</header>

			<div class="grid min-h-[45rem] lg:grid-cols-[18rem_minmax(0,1fr)_21rem]">
				<aside class="border-b border-border skin-card lg:border-b-0 lg:border-r">
					<div class="border-b border-border px-4 py-4">
						<div class="flex items-center justify-between gap-3">
							<h2 class="text-sm font-semibold">Campaigns</h2>
							<span class="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-muted-fg">{{ campaigns.length }}</span>
						</div>
					</div>
					<nav class="grid gap-1 p-2">
						<button
							v-for="campaign in campaigns"
							:key="campaign.id"
							type="button"
							class="rounded-lg px-3 py-3 text-left transition hover:bg-secondary"
							:class="activeCampaignId === campaign.id ? 'bg-secondary text-secondary-fg' : 'text-muted-fg'"
							@click="selectCampaign(campaign)"
						>
							<span class="flex items-start justify-between gap-3">
								<span class="min-w-0">
									<span class="block truncate text-sm font-semibold text-canvas-fg">{{ campaign.name }}</span>
									<span class="mt-1 block text-xs">{{ campaign.owner }} / {{ campaign.updated }}</span>
								</span>
								<span class="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-muted-fg">{{ campaign.status }}</span>
							</span>
							<span class="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
								<span>{{ campaign.reach.toLocaleString() }} reach</span>
								<span class="font-semibold text-emerald-600">{{ campaign.lift }}</span>
							</span>
						</button>
					</nav>
				</aside>

				<main class="min-w-0">
					<div class="border-b border-border px-4 py-4 sm:px-6">
						<div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
							<div class="min-w-0">
								<p class="text-sm font-semibold">{{ activeCampaign.name }}</p>
								<p class="mt-1 text-sm leading-6 text-muted-fg">Goal: increase activation with timely, consent-aware reminders.</p>
							</div>
							<div class="grid gap-3 sm:grid-cols-2">
								<label class="block">
									<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Send date</span>
									<input v-model="sendDate" type="date" class="mt-1 block w-full rounded-lg border border-input bg-canvas px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
								</label>
								<label class="block">
									<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Send time</span>
									<input v-model="sendTime" type="time" class="mt-1 block w-full rounded-lg border border-input bg-canvas px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
								</label>
							</div>
						</div>
					</div>

					<div class="p-4 sm:p-6">
						<DomTabs v-model="activeTab" :tabs="tabs">
							<template #compose>
								<div class="grid gap-5">
									<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem]">
										<label class="block">
											<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Subject</span>
											<input v-model="subject" class="mt-1 block w-full rounded-lg border border-input bg-canvas px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
											<span class="mt-1 block text-xs text-muted-fg">{{ subject.length }} / 64 recommended characters</span>
										</label>
										<label class="block">
											<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">CTA</span>
											<input v-model="cta" class="mt-1 block w-full rounded-lg border border-input bg-canvas px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
										</label>
									</div>

									<label class="block">
										<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Preheader</span>
										<input v-model="preheader" class="mt-1 block w-full rounded-lg border border-input bg-canvas px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
									</label>

									<div>
										<div class="flex flex-wrap items-center justify-between gap-3">
											<label for="campaign-body" class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Message body</label>
											<DomPopover width="min-w-[16rem] max-w-[18rem]" padding="p-2" position="bottom-end">
												<template #trigger>
													<button type="button" class="skin-control inline-flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold">
														Insert token
													</button>
												</template>
												<template #default="{ close }">
													<div class="grid gap-1">
														<button
															v-for="token in ['{{first_name}}', '{{workspace_name}}', '{{trial_days_left}}']"
															:key="token"
															type="button"
															class="rounded-md px-3 py-2 text-left text-sm hover:bg-secondary"
															@click="insertToken(token, close)"
														>
															{{ token }}
														</button>
													</div>
												</template>
											</DomPopover>
										</div>
										<textarea id="campaign-body" v-model="body" rows="7" class="mt-2 block w-full resize-none rounded-lg border border-input bg-canvas px-3 py-3 text-sm leading-6 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
									</div>
								</div>
							</template>

							<template #audience>
								<div class="grid gap-5">
									<div class="grid gap-3 sm:grid-cols-3">
										<div class="border-b border-border pb-3 sm:border-b-0 sm:border-r sm:pb-0">
											<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Reach</p>
											<p class="mt-1 text-2xl font-semibold tracking-tight">{{ estimatedReach.toLocaleString() }}</p>
										</div>
										<div class="border-b border-border pb-3 sm:border-b-0 sm:border-r sm:pb-0">
											<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Holdout</p>
											<p class="mt-1 text-2xl font-semibold tracking-tight">{{ includeHoldout ? '10%' : 'Off' }}</p>
										</div>
										<div>
											<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Policy</p>
											<p class="mt-1 text-2xl font-semibold tracking-tight">{{ readyChecks }}/{{ checks.length }}</p>
										</div>
									</div>

									<div class="divide-y divide-border rounded-lg border border-border">
										<button
											v-for="segment in segments"
											:key="segment.name"
											type="button"
											class="grid w-full gap-3 px-4 py-3 text-left transition hover:bg-secondary sm:grid-cols-[1fr_auto]"
											@click="toggleSegment(segment.name)"
										>
											<span>
												<span class="flex flex-wrap items-center gap-2">
													<span class="text-sm font-semibold">{{ segment.name }}</span>
													<span v-if="segment.count < 0" class="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning-fg">Exclusion</span>
												</span>
												<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ segment.detail }}</span>
											</span>
											<span class="flex items-center gap-3 justify-self-start sm:justify-self-end">
												<span class="text-sm font-semibold">{{ Math.abs(segment.count).toLocaleString() }}</span>
												<span class="grid size-5 place-items-center rounded border" :class="audienceSegments.includes(segment.name) ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-canvas'">
													<span v-if="audienceSegments.includes(segment.name)" class="text-[10px] font-bold">OK</span>
												</span>
											</span>
										</button>
									</div>

									<div class="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
										<DomToggle v-model="includeHoldout" label="Reserve holdout group" description="Keep 10% unsent for lift measurement." />
										<DomToggle v-model="testMode" label="Test mode" description="Queue internal seed sends only." />
									</div>
								</div>
							</template>

							<template #preview>
								<div class="grid gap-5 xl:grid-cols-[14rem_minmax(0,1fr)]">
									<div class="divide-y divide-border rounded-lg border border-border">
										<button
											v-for="channel in channels"
											:key="channel.name"
											type="button"
											class="grid w-full gap-2 px-4 py-3 text-left transition hover:bg-secondary"
											:class="previewChannel === channel.name ? 'bg-secondary' : ''"
											@click="previewChannel = channel.name"
										>
											<span class="flex items-center justify-between gap-3">
												<span class="text-sm font-semibold">{{ channel.name }}</span>
												<span class="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-muted-fg">{{ channel.size }}</span>
											</span>
											<span class="text-xs leading-5 text-muted-fg">{{ channel.detail }}</span>
										</button>
									</div>

									<div class="overflow-hidden rounded-lg border border-border bg-secondary/40">
										<div class="border-b border-border px-4 py-3">
											<div class="flex flex-wrap items-center justify-between gap-3">
												<p class="text-sm font-semibold">{{ previewChannel }} preview</p>
												<div class="flex flex-wrap gap-2">
													<button
														v-for="channel in channels"
														:key="channel.name"
														type="button"
														class="rounded-full border px-3 py-1 text-xs font-semibold transition"
														:class="selectedChannels.includes(channel.name) ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-canvas text-muted-fg'"
														@click="toggleChannel(channel.name)"
													>
														{{ channel.name }}
													</button>
												</div>
											</div>
										</div>
										<div class="p-4 sm:p-6">
											<div class="mx-auto max-w-lg rounded-lg border border-border bg-canvas shadow-lg">
												<div class="border-b border-border px-5 py-4">
													<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">{{ activeCampaign.owner }}</p>
													<h2 class="mt-2 text-xl font-semibold tracking-tight">{{ subject }}</h2>
													<p class="mt-2 text-sm leading-6 text-muted-fg">{{ preheader }}</p>
												</div>
												<div class="px-5 py-5">
													<p class="text-sm leading-7 text-muted-fg">{{ previewBody }}</p>
													<button type="button" class="mt-5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-fg">{{ cta }}</button>
												</div>
												<div class="border-t border-border px-5 py-3 text-xs text-muted-fg">Preference link and unsubscribe footer included automatically.</div>
											</div>
										</div>
									</div>
								</div>
							</template>
						</DomTabs>
					</div>
				</main>

				<aside class="border-t border-border skin-card lg:border-l lg:border-t-0">
					<div class="border-b border-border px-4 py-4">
						<div class="flex items-center justify-between gap-3">
							<div>
								<h2 class="text-sm font-semibold">Launch readiness</h2>
								<p class="mt-1 text-xs text-muted-fg">{{ launchState }}</p>
							</div>
							<DomTooltip text="Score combines content, audience, channel, schedule, and measurement readiness." placement="left">
								<span class="grid size-11 place-items-center rounded-full border border-border bg-canvas text-sm font-semibold">{{ readinessScore }}</span>
							</DomTooltip>
						</div>
						<div class="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
							<div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${readinessScore}%` }" />
						</div>
					</div>

					<div class="divide-y divide-border">
						<div class="px-4 py-4">
							<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Schedule</p>
							<p class="mt-2 text-sm font-semibold">{{ sendSummary }}</p>
							<div class="mt-3">
								<DomToggle v-model="scheduled" label="Scheduled send" description="Turn off to keep this as a manual launch." />
							</div>
						</div>

						<div class="px-4 py-4">
							<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Checks</p>
							<div class="mt-3 grid gap-3">
								<div v-for="check in checks" :key="check.label" class="flex items-start gap-3">
									<span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold" :class="check.status === 'Passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-warning/20 text-warning-fg'">
										{{ check.status === 'Passed' ? 'OK' : '!' }}
									</span>
									<span class="min-w-0">
										<span class="block text-sm font-medium">{{ check.label }}</span>
										<span class="mt-0.5 block text-xs leading-5 text-muted-fg">{{ check.detail }}</span>
									</span>
								</div>
							</div>
						</div>

						<div class="px-4 py-4">
							<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Activity</p>
							<div class="mt-3 grid gap-3">
								<div v-for="item in activity" :key="item.label" class="border-l border-border pl-3">
									<p class="text-sm font-medium">{{ item.label }}</p>
									<p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.detail }}</p>
									<p class="mt-1 text-[11px] font-semibold text-muted-fg">{{ item.time }}</p>
								</div>
							</div>
						</div>
					</div>
				</aside>
			</div>
		</div>
	</section>
</template>
