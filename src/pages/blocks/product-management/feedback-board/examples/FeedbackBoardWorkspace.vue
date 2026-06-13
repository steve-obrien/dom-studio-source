<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomNativeSelect, DomTextareaInput, DomToggle } from '@getdom/studio/vue';

const segments = [
	{ label: 'All demand', value: 'all', count: 328 },
	{ label: 'Enterprise', value: 'enterprise', count: 142 },
	{ label: 'New trials', value: 'trials', count: 86 },
	{ label: 'At risk', value: 'risk', count: 31 },
];

const requests = [
	{
		id: 'audit_exports',
		title: 'Export audit logs to CSV',
		category: 'Compliance',
		status: 'Under review',
		priority: 'High',
		owner: 'Product ops',
		window: 'Next quarter',
		votes: 184,
		accounts: 43,
		revenue: '$92k',
		trend: '+28%',
		segment: 'enterprise',
		description: 'Admins need exportable audit data for vendor reviews, SOC 2 evidence, and monthly access checks.',
	},
	{
		id: 'bulk_invites',
		title: 'Bulk teammate invites',
		category: 'Workspace',
		status: 'Planned',
		priority: 'Medium',
		owner: 'Growth',
		window: 'This month',
		votes: 126,
		accounts: 58,
		revenue: '$34k',
		trend: '+14%',
		segment: 'trials',
		description: 'Workspace owners want to invite whole teams from a CSV during setup instead of adding people one by one.',
	},
	{
		id: 'sla_alerts',
		title: 'SLA breach alerts in Slack',
		category: 'Support',
		status: 'Needs evidence',
		priority: 'Medium',
		owner: 'Support tools',
		window: 'Research',
		votes: 74,
		accounts: 19,
		revenue: '$57k',
		trend: '+9%',
		segment: 'risk',
		description: 'Support managers need high-signal alerts before response targets are missed for priority customers.',
	},
	{
		id: 'custom_roles',
		title: 'Custom workspace roles',
		category: 'Permissions',
		status: 'Inbox',
		priority: 'Low',
		owner: 'Unassigned',
		window: 'Unscheduled',
		votes: 52,
		accounts: 16,
		revenue: '$21k',
		trend: '+6%',
		segment: 'enterprise',
		description: 'Larger accounts want to create scoped roles for finance, support, and external contractor access.',
	},
];

const voters = [
	{ account: 'Arcadia Health', plan: 'Enterprise', value: '$48k ARR', source: 'Customer success' },
	{ account: 'Northstar Labs', plan: 'Scale', value: '$24k ARR', source: 'Sales call' },
	{ account: 'Harbor Retail', plan: 'Growth', value: '$12k ARR', source: 'Support ticket' },
	{ account: 'Brightdesk', plan: 'Trial', value: 'Pilot', source: 'Public board' },
];

const activity = [
	{ label: 'Status changed to under review', actor: 'Maya Chen', time: 'Today 10:20' },
	{ label: 'Enterprise segment added', actor: 'CRM sync', time: 'Today 09:45' },
	{ label: 'Comment posted to voters', actor: 'Product ops', time: 'Yesterday' },
	{ label: 'Support linked 6 tickets', actor: 'Zendesk import', time: 'Jun 9' },
];

const statusOptions = ['Inbox', 'Needs evidence', 'Under review', 'Planned', 'Shipped'];
const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
const windowOptions = ['Unscheduled', 'Research', 'This month', 'Next quarter'];

const selectedSegment = ref('all');
const selectedRequestId = ref(requests[0].id);
const selectedStatus = ref(requests[0].status);
const selectedPriority = ref(requests[0].priority);
const selectedWindow = ref(requests[0].window);
const notifyVoters = ref(true);
const internalOnly = ref(false);
const updateNote = ref('Thanks for the signal. We are validating export scope, permissions, and retention requirements with compliance-heavy teams.');

const filteredRequests = computed(() => {
	if (selectedSegment.value === 'all') return requests;
	return requests.filter((request) => request.segment === selectedSegment.value);
});
const selectedRequest = computed(() => requests.find((request) => request.id === selectedRequestId.value) || requests[0]);
const selectedSegmentRecord = computed(() => segments.find((segment) => segment.value === selectedSegment.value) || segments[0]);
const evidenceScore = computed(() => {
	let score = 35;
	if (selectedRequest.value.votes > 100) score += 20;
	if (selectedRequest.value.accounts > 30) score += 15;
	if (selectedPriority.value === 'High' || selectedPriority.value === 'Critical') score += 15;
	if (notifyVoters.value) score += 10;
	if (!internalOnly.value) score += 5;
	return Math.min(score, 100);
});
const publishSummary = computed(() => {
	const visibility = internalOnly.value ? 'internal note' : 'customer update';
	return `${selectedStatus.value} as ${visibility} for ${selectedRequest.value.votes} voters`;
});

function selectRequest(request) {
	selectedRequestId.value = request.id;
	selectedStatus.value = request.status;
	selectedPriority.value = request.priority;
	selectedWindow.value = request.window;
}

function statusClass(status) {
	if (status === 'Planned' || status === 'Shipped') return 'bg-success/15 text-success';
	if (status === 'Under review') return 'bg-primary/15 text-primary';
	if (status === 'Needs evidence') return 'bg-warning/15 text-warning';
	return 'bg-secondary text-muted-fg';
}
</script>

<template>
	<section class="min-h-screen bg-canvas text-canvas-fg">
		<div class="mx-auto flex w-full max-w-7xl flex-col border-x border-border bg-canvas shadow-2xl shadow-black/10">
			<header class="border-b border-border px-4 py-4 sm:px-6">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div class="min-w-0">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Product operations</p>
						<h1 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Feedback board</h1>
						<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">Triage feature requests, understand customer demand, and publish roadmap updates from one responsive workspace.</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<DomButton variant="secondary">Merge duplicate</DomButton>
						<DomButton>Publish update</DomButton>
					</div>
				</div>
			</header>

			<div class="grid min-h-[46rem] lg:grid-cols-[18rem_minmax(0,1fr)_22rem]">
				<aside class="border-b border-border skin-card lg:border-b-0 lg:border-r">
					<div class="border-b border-border px-4 py-4">
						<div class="flex items-center justify-between gap-3">
							<h2 class="text-sm font-semibold">Demand segments</h2>
							<span class="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-muted-fg">{{ selectedSegmentRecord.count }}</span>
						</div>
					</div>
					<nav class="grid gap-1 p-2">
						<button
							v-for="segment in segments"
							:key="segment.value"
							type="button"
							class="flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm transition hover:bg-secondary"
							:class="selectedSegment === segment.value ? 'bg-secondary text-secondary-fg' : 'text-muted-fg'"
							@click="selectedSegment = segment.value"
						>
							<span class="font-medium text-canvas-fg">{{ segment.label }}</span>
							<span class="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-muted-fg">{{ segment.count }}</span>
						</button>
					</nav>
					<div class="border-t border-border p-4">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Health signal</p>
						<div class="mt-4 grid grid-cols-2 gap-3 text-sm">
							<div>
								<p class="text-xs text-muted-fg">Open requests</p>
								<p class="mt-1 text-xl font-semibold">{{ filteredRequests.length }}</p>
							</div>
							<div>
								<p class="text-xs text-muted-fg">Total votes</p>
								<p class="mt-1 text-xl font-semibold">{{ selectedSegmentRecord.count }}</p>
							</div>
						</div>
					</div>
				</aside>

				<main class="min-w-0">
					<div class="border-b border-border px-4 py-4 sm:px-6">
						<div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
							<div>
								<p class="text-sm font-semibold">Requests</p>
								<p class="mt-1 text-sm text-muted-fg">Sorted by weighted demand, customer value, and recent activity.</p>
							</div>
							<div class="grid grid-cols-3 overflow-hidden rounded-xl border border-border text-center text-sm">
								<div class="px-3 py-2">
									<p class="text-xs text-muted-fg">Votes</p>
									<p class="mt-1 font-semibold">{{ selectedRequest.votes }}</p>
								</div>
								<div class="border-l border-border px-3 py-2">
									<p class="text-xs text-muted-fg">Accounts</p>
									<p class="mt-1 font-semibold">{{ selectedRequest.accounts }}</p>
								</div>
								<div class="border-l border-border px-3 py-2">
									<p class="text-xs text-muted-fg">Revenue</p>
									<p class="mt-1 font-semibold">{{ selectedRequest.revenue }}</p>
								</div>
							</div>
						</div>
					</div>

					<div class="grid xl:grid-cols-[minmax(0,1fr)_18rem]">
						<section class="border-b border-border p-3 sm:p-4 xl:border-b-0 xl:border-r">
							<div class="grid gap-2">
								<button
									v-for="request in filteredRequests"
									:key="request.id"
									type="button"
									class="rounded-xl border p-4 text-left transition hover:border-primary/50"
									:class="selectedRequestId === request.id ? 'border-primary/60 bg-primary/5' : 'border-border bg-canvas'"
									@click="selectRequest(request)"
								>
									<span class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
										<span class="min-w-0">
											<span class="flex flex-wrap items-center gap-2">
												<span class="text-sm font-semibold">{{ request.title }}</span>
												<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusClass(request.status)">{{ request.status }}</span>
											</span>
											<span class="mt-2 block text-sm leading-6 text-muted-fg">{{ request.description }}</span>
										</span>
										<span class="shrink-0 text-right">
											<span class="block text-lg font-semibold">{{ request.votes }}</span>
											<span class="text-xs text-muted-fg">votes</span>
										</span>
									</span>
									<span class="mt-4 grid gap-2 text-xs text-muted-fg sm:grid-cols-4">
										<span>{{ request.category }}</span>
										<span>{{ request.accounts }} accounts</span>
										<span>{{ request.revenue }} influenced</span>
										<span>{{ request.trend }} this month</span>
									</span>
								</button>
							</div>
						</section>

						<section class="p-4">
							<div class="flex items-center justify-between gap-3">
								<h2 class="text-sm font-semibold">Customer demand</h2>
								<span class="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{{ selectedRequest.trend }}</span>
							</div>
							<div class="mt-4 space-y-3">
								<div v-for="voter in voters" :key="voter.account" class="border-b border-border pb-3 last:border-b-0">
									<div class="flex items-start justify-between gap-3">
										<div>
											<p class="text-sm font-semibold">{{ voter.account }}</p>
											<p class="mt-1 text-xs text-muted-fg">{{ voter.plan }} / {{ voter.source }}</p>
										</div>
										<span class="text-xs font-semibold text-muted-fg">{{ voter.value }}</span>
									</div>
								</div>
							</div>
						</section>
					</div>
				</main>

				<aside class="border-t border-border skin-card lg:border-l lg:border-t-0">
					<div class="border-b border-border px-4 py-4">
						<h2 class="text-sm font-semibold">Decision panel</h2>
						<p class="mt-1 text-sm leading-6 text-muted-fg">{{ selectedRequest.title }}</p>
					</div>

					<div class="space-y-5 p-4">
						<div class="grid gap-3">
							<label class="block">
								<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Status</span>
								<DomNativeSelect v-model="selectedStatus" :options="statusOptions" class="mt-1" />
							</label>
							<label class="block">
								<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Priority</span>
								<DomNativeSelect v-model="selectedPriority" :options="priorityOptions" class="mt-1" />
							</label>
							<label class="block">
								<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Roadmap window</span>
								<DomNativeSelect v-model="selectedWindow" :options="windowOptions" class="mt-1" />
							</label>
						</div>

						<div class="border-y border-border py-4">
							<div class="flex items-center justify-between text-sm">
								<span class="font-medium">Evidence score</span>
								<span class="font-semibold">{{ evidenceScore }}%</span>
							</div>
							<div class="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
								<div class="h-full rounded-full bg-primary" :style="{ width: `${evidenceScore}%` }"></div>
							</div>
							<p class="mt-2 text-xs leading-5 text-muted-fg">Combines votes, accounts, revenue signal, status quality, and update readiness.</p>
						</div>

						<div class="space-y-3">
							<label class="flex items-center justify-between gap-4">
								<span>
									<span class="block text-sm font-medium">Notify voters</span>
									<span class="block text-xs text-muted-fg">Send status updates to subscribed customers.</span>
								</span>
								<DomToggle v-model="notifyVoters" aria-label="Notify voters" />
							</label>
							<label class="flex items-center justify-between gap-4">
								<span>
									<span class="block text-sm font-medium">Internal only</span>
									<span class="block text-xs text-muted-fg">Hide this note from public boards.</span>
								</span>
								<DomToggle v-model="internalOnly" aria-label="Internal only" />
							</label>
						</div>

						<label class="block">
							<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Update note</span>
							<DomTextareaInput v-model="updateNote" class="mt-2" rows="5" />
						</label>

						<div class="rounded-xl border border-border bg-canvas p-3">
							<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Ready to publish</p>
							<p class="mt-2 text-sm leading-6">{{ publishSummary }}</p>
						</div>

						<div>
							<h3 class="text-sm font-semibold">Activity</h3>
							<div class="mt-3 space-y-3">
								<div v-for="event in activity" :key="`${event.label}-${event.time}`" class="border-l border-border pl-3">
									<p class="text-sm font-medium">{{ event.label }}</p>
									<p class="mt-1 text-xs text-muted-fg">{{ event.actor }} / {{ event.time }}</p>
								</div>
							</div>
						</div>
					</div>
				</aside>
			</div>
		</div>
	</section>
</template>
