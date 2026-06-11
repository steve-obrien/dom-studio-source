<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomCheckbox, DomNativeSelect, DomTextInput, DomTextareaInput, DomToggle } from '@getdom/studio/vue';

const releases = ref([
	{
		id: 'workflow',
		title: 'Workflow automation GA',
		status: 'Draft',
		statusTone: 'warning',
		owner: 'Mina Cook',
		date: 'Jun 12, 2026',
		audience: 'Scale and Enterprise',
		readiness: 72,
		highlights: [
			{ id: 'builder', type: 'Feature', title: 'Visual automation builder', detail: 'Teams can connect triggers, approvals, waits, and handoff tasks from one canvas.', included: true },
			{ id: 'templates', type: 'Template', title: 'Approval and handoff templates', detail: 'Start from policy review, launch checklist, access request, and renewal save-plan templates.', included: true },
			{ id: 'audit', type: 'Admin', title: 'Run history with audit events', detail: 'Every automation run records actor, changed records, duration, and retry state.', included: false },
		],
		activity: [
			{ actor: 'Mina Cook', action: 'Updated in-app preview copy', time: 'Today 14:30' },
			{ actor: 'Ravi Singh', action: 'Linked support enablement note', time: 'Today 12:10' },
			{ actor: 'Elena Brooks', action: 'Moved release to changelog draft', time: 'Yesterday' },
		],
	},
	{
		id: 'mobile',
		title: 'Mobile task inbox refresh',
		status: 'Scheduled',
		statusTone: 'success',
		owner: 'Ravi Singh',
		date: 'Jun 14, 2026',
		audience: 'All workspaces',
		readiness: 91,
		highlights: [
			{ id: 'swipe', type: 'Mobile', title: 'Swipe actions for triage', detail: 'Mark tasks done, snooze reminders, and assign owners without opening detail views.', included: true },
			{ id: 'offline', type: 'Reliability', title: 'Offline queue for updates', detail: 'Edits are queued locally and synced when the device reconnects.', included: true },
			{ id: 'badges', type: 'Polish', title: 'New priority and due-date badges', detail: 'Compact visual badges help mobile users scan urgency faster.', included: true },
		],
		activity: [
			{ actor: 'Ravi Singh', action: 'Scheduled public changelog post', time: 'Today 09:45' },
			{ actor: 'Mina Cook', action: 'Approved lifecycle email copy', time: 'Yesterday' },
			{ actor: 'Nora Allen', action: 'Added mobile screenshots', time: 'Jun 08' },
		],
	},
	{
		id: 'api',
		title: 'API version 2026-06',
		status: 'Needs review',
		statusTone: 'danger',
		owner: 'Nora Allen',
		date: 'Jun 18, 2026',
		audience: 'Developers',
		readiness: 48,
		highlights: [
			{ id: 'pagination', type: 'Breaking change', title: 'Cursor pagination is required', detail: 'List endpoints now return cursor metadata instead of page offsets.', included: true },
			{ id: 'webhook', type: 'Developer', title: 'Webhook replay endpoint', detail: 'Developers can replay delivery attempts from the dashboard or API.', included: true },
			{ id: 'docs', type: 'Docs', title: 'Migration guide and examples', detail: 'SDK snippets show the new pagination and webhook retry flow.', included: false },
		],
		activity: [
			{ actor: 'Nora Allen', action: 'Requested developer relations review', time: 'Today 11:20' },
			{ actor: 'Theo Grant', action: 'Flagged breaking-change warning', time: 'Today 10:05' },
			{ actor: 'Mina Cook', action: 'Created draft announcement', time: 'Jun 09' },
		],
	},
]);

const previewTabs = [
	{ id: 'in_app', label: 'In-app' },
	{ id: 'email', label: 'Email' },
	{ id: 'public', label: 'Public page' },
];

const selectedReleaseId = ref('workflow');
const activePreview = ref('in_app');
const headline = ref('Workflow automation is now generally available');
const summary = ref('Create approval paths, escalation rules, and follow-up tasks without writing scripts.');
const audience = ref('Scale and Enterprise');
const schedule = ref('Friday 09:00');
const owner = ref('Product marketing');
const requestApproval = ref(true);
const publishState = ref('Draft');
const channels = ref([
	{ id: 'in_app', label: 'In-app announcement', detail: 'Show in the product feed and workspace home.', enabled: true, owner: 'Product' },
	{ id: 'email', label: 'Lifecycle email', detail: 'Send to admins and saved audience segments.', enabled: true, owner: 'Lifecycle' },
	{ id: 'public', label: 'Public changelog', detail: 'Publish on the marketing changelog page.', enabled: true, owner: 'Docs' },
	{ id: 'slack', label: 'Community digest', detail: 'Queue a short post for community and Slack users.', enabled: false, owner: 'Community' },
]);

const selectedRelease = computed(() => releases.value.find((release) => release.id === selectedReleaseId.value) || releases.value[0]);
const selectedHighlights = computed(() => selectedRelease.value.highlights.filter((item) => item.included));
const enabledChannels = computed(() => channels.value.filter((channel) => channel.enabled));
const channelCount = computed(() => enabledChannels.value.length);
const completionChecks = computed(() => [
	{ label: 'Headline and summary are ready', done: headline.value.length >= 12 && summary.value.length >= 40, detail: 'Avoid vague announcements before publish.' },
	{ label: 'At least two release notes selected', done: selectedHighlights.value.length >= 2, detail: 'Give customers enough context to act.' },
	{ label: 'Audience and schedule selected', done: Boolean(audience.value && schedule.value), detail: 'Every announcement needs a delivery window.' },
	{ label: 'One or more channels enabled', done: channelCount.value > 0, detail: 'Choose where customers will see the update.' },
	{ label: 'Approval policy satisfied', done: !requestApproval.value || owner.value !== '', detail: 'Assign an owner for final review.' },
]);
const readiness = computed(() => Math.round((completionChecks.value.filter((check) => check.done).length / completionChecks.value.length) * 100));
const publishDisabled = computed(() => readiness.value < 100);
const previewCopy = computed(() => {
	if (activePreview.value === 'email') return `${summary.value} Here is what changed and how your team can start using it.`;
	if (activePreview.value === 'public') return `${summary.value} This release is available to ${audience.value.toLowerCase()} from ${schedule.value}.`;
	return summary.value;
});

function selectRelease(release) {
	selectedReleaseId.value = release.id;
	headline.value = release.title;
	summary.value = release.highlights.map((item) => item.title).slice(0, 2).join('. ') + '.';
	audience.value = release.audience;
	publishState.value = release.status;
}

function toggleHighlight(item) {
	item.included = !item.included;
}

function saveDraft() {
	publishState.value = 'Draft saved';
}

function schedulePublish() {
	if (publishDisabled.value) return;
	publishState.value = 'Scheduled';
}

function toneClass(tone) {
	if (tone === 'success') return 'bg-success/15 text-success';
	if (tone === 'danger') return 'bg-destructive/15 text-destructive';
	return 'bg-warning/15 text-warning';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-lg border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-raised px-4 py-4 sm:px-6">
			<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Changelog publisher</p>
					<h3 class="mt-1 text-2xl font-semibold tracking-tight">Release notes, previews, and launch checks</h3>
					<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">
						Prepare customer-facing announcements across in-app, email, public changelog, and community channels.
					</p>
				</div>
				<div class="grid gap-2 sm:grid-cols-[10rem_8rem]">
					<DomNativeSelect
						v-model="schedule"
						label="Schedule"
						:options="['Friday 09:00', 'Monday 10:00', 'Next deploy', 'Manual publish']"
					/>
					<DomButton :disabled="publishDisabled" @click="schedulePublish">
						{{ publishState === 'Scheduled' ? 'Scheduled' : 'Schedule' }}
					</DomButton>
				</div>
			</div>
		</header>

		<div class="grid min-h-[46rem] lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)_22rem]">
			<aside class="border-b border-border skin-raised lg:border-b-0 lg:border-r">
				<div class="flex gap-2 overflow-x-auto p-3 lg:grid">
					<button
						v-for="release in releases"
						:key="release.id"
						type="button"
						class="min-w-64 rounded-lg px-3 py-3 text-left transition hover:bg-background lg:min-w-0"
						:class="selectedReleaseId === release.id ? 'bg-background shadow-sm ring-1 ring-border' : ''"
						@click="selectRelease(release)"
					>
						<div class="flex items-start justify-between gap-3">
							<span class="min-w-0">
								<span class="block truncate text-sm font-semibold">{{ release.title }}</span>
								<span class="mt-1 block text-xs text-muted-fg">{{ release.date }} / {{ release.owner }}</span>
							</span>
							<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="toneClass(release.statusTone)">
								{{ release.status }}
							</span>
						</div>
						<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
							<div class="h-full rounded-full bg-primary" :style="{ width: `${release.readiness}%` }"></div>
						</div>
						<p class="mt-2 text-xs text-muted-fg">{{ release.audience }}</p>
					</button>
				</div>
			</aside>

			<main class="min-w-0 border-b border-border xl:border-b-0 xl:border-r">
				<section class="border-b border-border p-4 sm:p-6">
					<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_13rem]">
						<div class="grid gap-4">
							<DomTextInput v-model="headline" label="Announcement headline" placeholder="What changed?" />
							<DomTextareaInput
								v-model="summary"
								label="Short summary"
								description="Use the customer benefit, not only the internal project name."
								placeholder="Describe why this release matters."
							/>
						</div>
						<div class="grid content-start gap-3 rounded-lg border border-border bg-secondary/40 p-4">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Readiness</p>
								<div class="mt-3 flex items-end gap-2">
									<span class="text-4xl font-semibold tracking-tight">{{ readiness }}%</span>
									<span class="pb-1 text-xs font-medium text-muted-fg">{{ channelCount }} channels</span>
								</div>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-background">
								<div class="h-full rounded-full bg-primary" :style="{ width: `${readiness}%` }"></div>
							</div>
							<p class="text-xs font-medium text-muted-fg">State: {{ publishState }}</p>
							<DomButton variant="secondary" size="sm" @click="saveDraft">Save draft</DomButton>
						</div>
					</div>
				</section>

				<section class="grid border-b border-border lg:grid-cols-[minmax(0,1fr)_16rem]">
					<div class="p-4 sm:p-6">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div>
								<h4 class="text-base font-semibold">Release notes</h4>
								<p class="mt-1 text-sm text-muted-fg">Choose which shipped items become customer-facing copy.</p>
							</div>
							<span class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg">
								{{ selectedHighlights.length }} included
							</span>
						</div>
						<div class="mt-4 divide-y divide-border rounded-lg border border-border">
							<button
								v-for="item in selectedRelease.highlights"
								:key="item.id"
								type="button"
								class="grid w-full gap-3 px-4 py-3 text-left transition hover:bg-secondary/40 sm:grid-cols-[auto_minmax(0,1fr)]"
								@click="toggleHighlight(item)"
							>
								<span
									class="mt-1 grid size-5 place-items-center rounded border text-xs font-bold"
									:class="item.included ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-background text-muted-fg'"
									aria-hidden="true"
								>
									<span v-if="item.included" class="size-2 rounded-full bg-current"></span>
								</span>
								<span>
									<span class="flex flex-wrap items-center gap-2">
										<span class="font-medium">{{ item.title }}</span>
										<span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-fg">{{ item.type }}</span>
									</span>
									<span class="mt-1 block text-sm leading-6 text-muted-fg">{{ item.detail }}</span>
								</span>
							</button>
						</div>
					</div>

					<div class="border-t border-border skin-raised p-4 lg:border-l lg:border-t-0">
						<div class="grid gap-4">
							<DomNativeSelect v-model="audience" label="Audience" :options="['All workspaces', 'Scale and Enterprise', 'Developers', 'Beta customers']" />
							<DomNativeSelect v-model="owner" label="Review owner" :options="['Product marketing', 'Lifecycle', 'Docs', 'Customer success']" />
							<DomToggle
								v-model="requestApproval"
								label="Require approval"
								description="Keep enabled for breaking changes, beta launches, and paid-plan announcements."
							/>
						</div>
					</div>
				</section>

				<section class="p-4 sm:p-6">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h4 class="text-base font-semibold">Channel preview</h4>
							<p class="mt-1 text-sm text-muted-fg">Review how the same entry reads in each destination.</p>
						</div>
						<div class="flex rounded-full border border-border bg-secondary p-1">
							<button
								v-for="tab in previewTabs"
								:key="tab.id"
								type="button"
								class="rounded-full px-3 py-1 text-xs font-semibold transition"
								:class="activePreview === tab.id ? 'bg-background text-fg shadow-sm' : 'text-muted-fg hover:text-fg'"
								@click="activePreview = tab.id"
							>
								{{ tab.label }}
							</button>
						</div>
					</div>

					<div class="mt-4 overflow-hidden rounded-lg border border-border">
						<div class="border-b border-border bg-secondary/40 px-4 py-3">
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">
								{{ activePreview === 'email' ? 'Lifecycle email' : activePreview === 'public' ? 'Public changelog' : 'In-app feed' }}
							</p>
						</div>
						<div class="space-y-4 p-4">
							<div>
								<p class="text-lg font-semibold tracking-tight">{{ headline }}</p>
								<p class="mt-2 text-sm leading-6 text-muted-fg">{{ previewCopy }}</p>
							</div>
							<div class="divide-y divide-border rounded-lg border border-border">
								<div v-for="item in selectedHighlights" :key="item.id" class="px-3 py-3">
									<p class="text-sm font-semibold">{{ item.title }}</p>
									<p class="mt-1 text-sm leading-6 text-muted-fg">{{ item.detail }}</p>
								</div>
							</div>
							<div class="flex flex-wrap gap-2 text-xs font-medium text-muted-fg">
								<span class="rounded-full bg-secondary px-2.5 py-1">{{ audience }}</span>
								<span class="rounded-full bg-secondary px-2.5 py-1">{{ schedule }}</span>
								<span class="rounded-full bg-secondary px-2.5 py-1">{{ owner }}</span>
							</div>
						</div>
					</div>
				</section>
			</main>

			<aside class="skin-raised">
				<section class="border-b border-border p-4">
					<h4 class="text-sm font-semibold">Channels</h4>
					<div class="mt-4 grid gap-3">
						<div v-for="channel in channels" :key="channel.id" class="rounded-lg border border-border bg-background p-3">
							<DomCheckbox v-model="channel.enabled" :label="channel.label" :description="channel.detail" />
							<p class="mt-3 text-xs font-medium text-muted-fg">Owner: {{ channel.owner }}</p>
						</div>
					</div>
				</section>

				<section class="border-b border-border p-4">
					<h4 class="text-sm font-semibold">Publish checks</h4>
					<div class="mt-4 divide-y divide-border rounded-lg border border-border bg-background">
						<div v-for="check in completionChecks" :key="check.label" class="grid grid-cols-[auto_minmax(0,1fr)] gap-3 px-3 py-3">
							<span
								class="mt-0.5 grid size-5 place-items-center rounded-full text-xs font-bold"
								:class="check.done ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
							>
								{{ check.done ? 'OK' : '!' }}
							</span>
							<span>
								<span class="block text-sm font-medium">{{ check.label }}</span>
								<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ check.detail }}</span>
							</span>
						</div>
					</div>
				</section>

				<section class="p-4">
					<h4 class="text-sm font-semibold">Activity</h4>
					<div class="mt-4 grid gap-3">
						<div v-for="event in selectedRelease.activity" :key="`${event.actor}-${event.time}`" class="border-l border-border pl-3">
							<p class="text-sm font-medium">{{ event.action }}</p>
							<p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.actor }} / {{ event.time }}</p>
						</div>
					</div>
				</section>
			</aside>
		</div>
	</div>
</template>
