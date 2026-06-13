<script setup>
import { computed, ref, watch } from 'vue';
import { DomButton, DomNativeSelect, DomTabs, DomTextInput, DomTextareaInput, DomToggle } from '@getdom/studio/vue';

const tabs = [
	{ key: 'all', label: 'All' },
	{ key: 'risk', label: 'Risk' },
	{ key: 'revenue', label: 'Revenue' },
	{ key: 'product', label: 'Product' },
];

const accountOptions = [
	{ label: 'Northstar Labs', value: 'northstar' },
	{ label: 'Atlas Retail Group', value: 'atlas' },
	{ label: 'Zephyr Health', value: 'zephyr' },
];

const eventTypes = [
	{ label: 'All activity', value: 'all' },
	{ label: 'Support', value: 'support' },
	{ label: 'Usage', value: 'usage' },
	{ label: 'Revenue', value: 'revenue' },
	{ label: 'Lifecycle', value: 'lifecycle' },
];

const accounts = {
	northstar: {
		name: 'Northstar Labs',
		segment: 'Scale',
		owner: 'Maya Chen',
		renewal: 'Sep 18',
		health: 82,
		arr: 'GBP 148k',
		status: 'Expansion likely',
		champion: 'Priya Shah',
		product: 'Payments platform',
		lastTouch: 'Today',
	},
	atlas: {
		name: 'Atlas Retail Group',
		segment: 'Enterprise',
		owner: 'Sam Rivera',
		renewal: 'Jul 22',
		health: 54,
		arr: 'GBP 221k',
		status: 'Recovery needed',
		champion: 'Jordan Lee',
		product: 'Operations suite',
		lastTouch: 'Yesterday',
	},
	zephyr: {
		name: 'Zephyr Health',
		segment: 'Enterprise',
		owner: 'Lena Ortiz',
		renewal: 'Oct 03',
		health: 73,
		arr: 'GBP 184k',
		status: 'Watch list',
		champion: 'Elena Ruiz',
		product: 'Clinical workflow',
		lastTouch: '2 days ago',
	},
};

const activityEvents = [
	{
		id: 'evt-1802',
		accountId: 'northstar',
		type: 'support',
		lane: 'risk',
		time: '14:24',
		date: 'Today',
		title: 'Export timeout escalated',
		source: 'Help desk',
		actor: 'Ari Patel',
		summary: 'Customer reported failed exports on two enterprise workspaces.',
		impact: 'Renewal risk if unresolved before the Friday stakeholder call.',
		importance: 'high',
		meta: [
			{ label: 'Ticket', value: 'SUP-4821' },
			{ label: 'Workspace', value: 'Northstar EU' },
			{ label: 'SLA', value: '4h remaining' },
		],
		actions: ['Open ticket', 'Create owner task'],
	},
	{
		id: 'evt-1789',
		accountId: 'northstar',
		type: 'usage',
		lane: 'product',
		time: '11:10',
		date: 'Today',
		title: 'Forecast report adoption jumped',
		source: 'Product analytics',
		actor: 'Finance workspace',
		summary: 'Weekly forecast report opened 42 times by nine finance managers.',
		impact: 'Strong expansion signal for the analytics add-on.',
		importance: 'positive',
		meta: [
			{ label: 'Feature', value: 'Forecast reports' },
			{ label: 'Active users', value: '+18%' },
			{ label: 'Teams', value: 'Finance, RevOps' },
		],
		actions: ['Log expansion signal', 'Message champion'],
	},
	{
		id: 'evt-1772',
		accountId: 'northstar',
		type: 'revenue',
		lane: 'revenue',
		time: '09:18',
		date: 'Today',
		title: 'Procurement opened renewal quote',
		source: 'CRM',
		actor: 'Northstar procurement',
		summary: 'Annual quote was viewed twice and security addendum was downloaded.',
		impact: 'Commercial review is active; owner should confirm budget timing.',
		importance: 'medium',
		meta: [
			{ label: 'Opportunity', value: 'REN-2048' },
			{ label: 'Stage', value: 'Legal review' },
			{ label: 'Close date', value: 'Sep 18' },
		],
		actions: ['Open CRM', 'Draft follow-up'],
	},
	{
		id: 'evt-1755',
		accountId: 'northstar',
		type: 'lifecycle',
		lane: 'product',
		time: '16:46',
		date: 'Yesterday',
		title: 'Champion clicked release note',
		source: 'Lifecycle campaign',
		actor: 'Priya Shah',
		summary: 'The analytics release note was opened from the monthly product digest.',
		impact: 'Good timing for an add-on demo invite.',
		importance: 'positive',
		meta: [
			{ label: 'Campaign', value: 'June analytics digest' },
			{ label: 'CTA', value: 'View report builder' },
			{ label: 'Device', value: 'Desktop' },
		],
		actions: ['Send demo invite', 'Add campaign note'],
	},
	{
		id: 'evt-1704',
		accountId: 'atlas',
		type: 'support',
		lane: 'risk',
		time: '10:05',
		date: 'Today',
		title: 'Identity ticket reopened',
		source: 'Help desk',
		actor: 'Jordan Lee',
		summary: 'Store managers still cannot complete SSO setup for new regions.',
		impact: 'Rollout remains blocked for 31 stores.',
		importance: 'high',
		meta: [
			{ label: 'Ticket', value: 'SUP-4760' },
			{ label: 'Stores blocked', value: '31' },
			{ label: 'Owner', value: 'Platform support' },
		],
		actions: ['Escalate incident', 'Book sponsor call'],
	},
	{
		id: 'evt-1652',
		accountId: 'zephyr',
		type: 'usage',
		lane: 'product',
		time: '13:32',
		date: 'Yesterday',
		title: 'Approvals workflow usage dipped',
		source: 'Product analytics',
		actor: 'Clinical operations',
		summary: 'Weekly active reviewers declined across three regional teams.',
		impact: 'Adoption risk before the October renewal.',
		importance: 'medium',
		meta: [
			{ label: 'Workflow', value: 'Approvals' },
			{ label: 'Change', value: '-12%' },
			{ label: 'Region', value: 'Europe' },
		],
		actions: ['Create adoption task', 'Open playbook'],
	},
];

const quickNotes = ref([
	{ label: 'Ask support for export ETA', done: true },
	{ label: 'Confirm procurement review owner', done: false },
	{ label: 'Send analytics add-on demo slots', done: false },
]);

const selectedAccountId = ref('northstar');
const activeTab = ref('all');
const selectedType = ref('all');
const searchQuery = ref('');
const expandedEventId = ref('evt-1802');
const showInternalNotes = ref(true);
const ownerNote = ref('Summarize export status before the stakeholder call and connect analytics adoption to the renewal plan.');
const taskCreated = ref(false);

const selectedAccount = computed(() => accounts[selectedAccountId.value]);
const accountEvents = computed(() => activityEvents.filter((event) => event.accountId === selectedAccountId.value));
const visibleEvents = computed(() => {
	const query = searchQuery.value.trim().toLowerCase();

	return accountEvents.value.filter((event) => {
		const matchesTab = activeTab.value === 'all' || event.lane === activeTab.value;
		const matchesType = selectedType.value === 'all' || event.type === selectedType.value;
		const matchesSearch = !query || [
			event.title,
			event.summary,
			event.source,
			event.actor,
			event.impact,
		].join(' ').toLowerCase().includes(query);

		return matchesTab && matchesType && matchesSearch;
	});
});
const expandedEvent = computed(() => visibleEvents.value.find((event) => event.id === expandedEventId.value) || visibleEvents.value[0]);
const highRiskCount = computed(() => accountEvents.value.filter((event) => event.importance === 'high').length);
const positiveCount = computed(() => accountEvents.value.filter((event) => event.importance === 'positive').length);
const completedNotes = computed(() => quickNotes.value.filter((note) => note.done).length);
const readiness = computed(() => Math.round((completedNotes.value / quickNotes.value.length) * 100));

watch([selectedAccountId, activeTab, selectedType, searchQuery], () => {
	if (visibleEvents.value.some((event) => event.id === expandedEventId.value)) return;
	expandedEventId.value = visibleEvents.value[0]?.id || '';
});

function toggleEvent(event) {
	expandedEventId.value = expandedEventId.value === event.id ? '' : event.id;
}

function createTask() {
	taskCreated.value = true;
}

function importanceClasses(importance) {
	if (importance === 'high') return 'bg-destructive/15 text-destructive';
	if (importance === 'positive') return 'bg-success/15 text-success';
	if (importance === 'medium') return 'bg-warning/15 text-warning';
	return 'bg-secondary text-muted-fg';
}

function eventIconPath(type) {
	if (type === 'support') return 'M5 6h14v9H9l-4 4V6Zm4 3h6M9 12h4';
	if (type === 'usage') return 'M5 19V5M5 19h14M9 15V9M13 15V7M17 15v-4';
	if (type === 'revenue') return 'M6 7h12M6 12h12M8 17h8M12 4v16';
	return 'M5 8h14M5 12h10M5 16h14';
}
</script>

<template>
	<div class="w-full bg-secondary/40 p-3 text-canvas-fg sm:p-5 lg:p-8">
		<div class="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
			<section class="min-w-0 overflow-hidden rounded-lg border border-border bg-canvas shadow-2xl shadow-black/10">
				<header class="border-b border-border skin-card px-4 py-4 sm:px-6">
					<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-end">
						<div>
							<div class="flex flex-wrap items-center gap-2">
								<span class="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
									<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
										<path d="M5 5h14v4H5V5Zm0 7h10v4H5v-4Zm0 7h14M18 12h1M18 16h1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</span>
								<p class="text-xs font-semibold uppercase text-muted-fg">Customer timeline</p>
							</div>
							<h3 class="mt-3 text-2xl font-semibold">{{ selectedAccount.name }}</h3>
							<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">
								{{ selectedAccount.product }} account owned by {{ selectedAccount.owner }}. Champion: {{ selectedAccount.champion }}.
							</p>
						</div>
						<div class="grid gap-2 sm:grid-cols-2">
							<DomNativeSelect v-model="selectedAccountId" label="Account" :options="accountOptions" />
							<DomNativeSelect v-model="selectedType" label="Event type" :options="eventTypes" />
						</div>
					</div>
				</header>

				<section class="grid divide-y divide-border border-b border-border sm:grid-cols-4 sm:divide-x sm:divide-y-0">
					<div class="p-4 sm:p-5">
						<p class="text-xs font-semibold uppercase text-muted-fg">Health</p>
						<p class="mt-2 text-2xl font-semibold">{{ selectedAccount.health }}</p>
						<div class="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
							<div class="h-full rounded-full bg-primary" :style="{ width: `${selectedAccount.health}%` }"></div>
						</div>
					</div>
					<div class="p-4 sm:p-5">
						<p class="text-xs font-semibold uppercase text-muted-fg">ARR</p>
						<p class="mt-2 text-2xl font-semibold">{{ selectedAccount.arr }}</p>
						<p class="mt-1 text-sm text-muted-fg">{{ selectedAccount.segment }}</p>
					</div>
					<div class="p-4 sm:p-5">
						<p class="text-xs font-semibold uppercase text-muted-fg">Renewal</p>
						<p class="mt-2 text-2xl font-semibold">{{ selectedAccount.renewal }}</p>
						<p class="mt-1 text-sm text-muted-fg">{{ selectedAccount.status }}</p>
					</div>
					<div class="p-4 sm:p-5">
						<p class="text-xs font-semibold uppercase text-muted-fg">Signals</p>
						<p class="mt-2 text-2xl font-semibold">{{ highRiskCount }} risk</p>
						<p class="mt-1 text-sm text-muted-fg">{{ positiveCount }} positive</p>
					</div>
				</section>

				<section class="border-b border-border px-4 py-3 sm:px-6">
					<div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
						<DomTabs v-model="activeTab" :tabs="tabs" />
						<DomTextInput v-model="searchQuery" label="Search activity" placeholder="Ticket, feature, owner..." />
					</div>
				</section>

				<section class="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
					<div class="min-w-0 border-b border-border p-4 sm:p-6 lg:border-b-0 lg:border-r">
						<div v-if="visibleEvents.length" class="relative grid gap-4">
							<div class="absolute bottom-3 left-5 top-3 w-px bg-border" aria-hidden="true"></div>
							<article
								v-for="event in visibleEvents"
								:key="event.id"
								class="relative grid gap-3 pl-10"
							>
								<button
									type="button"
									class="absolute left-0 top-4 z-10 grid size-10 place-items-center rounded-full border border-border bg-canvas text-muted-fg shadow-sm transition hover:border-primary/40 hover:text-primary"
									:class="expandedEventId === event.id ? 'border-primary/40 text-primary' : ''"
									@click="toggleEvent(event)"
								>
									<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
										<path :d="eventIconPath(event.type)" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
									<span class="sr-only">Toggle {{ event.title }}</span>
								</button>

								<div class="rounded-lg border border-border bg-canvas p-4 transition hover:border-primary/30">
									<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
										<div class="min-w-0">
											<div class="flex flex-wrap items-center gap-2">
												<span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="importanceClasses(event.importance)">
													{{ event.importance }}
												</span>
												<span class="text-xs font-medium text-muted-fg">{{ event.date }} at {{ event.time }}</span>
												<span class="text-xs font-medium text-muted-fg">{{ event.source }}</span>
											</div>
											<h4 class="mt-3 text-base font-semibold">{{ event.title }}</h4>
											<p class="mt-2 text-sm leading-6 text-muted-fg">{{ event.summary }}</p>
										</div>
										<DomButton size="sm" variant="secondary" @click="toggleEvent(event)">
											{{ expandedEventId === event.id ? 'Collapse' : 'Review' }}
										</DomButton>
									</div>

									<div v-if="expandedEventId === event.id" class="mt-4 grid gap-4 border-t border-border pt-4">
										<div class="rounded-lg bg-secondary/60 p-4">
											<p class="text-xs font-semibold uppercase text-muted-fg">Impact</p>
											<p class="mt-2 text-sm leading-6">{{ event.impact }}</p>
										</div>
										<div class="grid gap-3 sm:grid-cols-3">
											<div
												v-for="item in event.meta"
												:key="`${event.id}-${item.label}`"
												class="rounded-lg border border-border p-3"
											>
												<p class="text-xs font-semibold uppercase text-muted-fg">{{ item.label }}</p>
												<p class="mt-1 text-sm font-medium">{{ item.value }}</p>
											</div>
										</div>
										<div class="flex flex-wrap gap-2">
											<DomButton
												v-for="action in event.actions"
												:key="`${event.id}-${action}`"
												size="sm"
												variant="secondary"
												@click="action === 'Create owner task' || action === 'Create adoption task' ? createTask() : null"
											>
												{{ action }}
											</DomButton>
										</div>
									</div>
								</div>
							</article>
						</div>

						<div v-else class="rounded-lg border border-dashed border-border p-8 text-center">
							<p class="text-sm font-semibold">No events match these filters</p>
							<p class="mt-2 text-sm text-muted-fg">Clear the type filter or search query to widen the timeline.</p>
						</div>
					</div>

					<aside class="grid content-start gap-4 bg-secondary/30 p-4 sm:p-6">
						<div class="rounded-lg border border-border bg-canvas p-4">
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="text-xs font-semibold uppercase text-muted-fg">Next best action</p>
									<h4 class="mt-2 font-semibold">Prepare renewal touchpoint</h4>
								</div>
								<span class="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
									{{ readiness }}%
								</span>
							</div>
							<div class="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
								<div class="h-full rounded-full bg-primary" :style="{ width: `${readiness}%` }"></div>
							</div>
							<div class="mt-4 grid gap-2">
								<label
									v-for="note in quickNotes"
									:key="note.label"
									class="flex items-start gap-2 rounded-md border border-border p-3 text-sm"
								>
									<input
										type="checkbox"
										v-model="note.done"
										class="mt-1 size-4 rounded border-border text-primary focus:ring-ring"
									>
									<span>{{ note.label }}</span>
								</label>
							</div>
							<DomButton class="mt-4 w-full" :disabled="taskCreated" @click="createTask">
								{{ taskCreated ? 'Task created' : 'Create owner task' }}
							</DomButton>
						</div>

						<div class="rounded-lg border border-border bg-canvas p-4">
							<div class="flex items-center justify-between gap-3">
								<div>
									<p class="text-xs font-semibold uppercase text-muted-fg">Internal notes</p>
									<p class="mt-1 text-sm text-muted-fg">Visible to success and support teams.</p>
								</div>
								<DomToggle v-model="showInternalNotes" label="Show notes" />
							</div>
							<DomTextareaInput
								v-if="showInternalNotes"
								v-model="ownerNote"
								class="mt-4"
								label="Owner note"
								:rows="4"
							/>
						</div>

						<div v-if="expandedEvent" class="rounded-lg border border-border bg-canvas p-4">
							<p class="text-xs font-semibold uppercase text-muted-fg">Focused event</p>
							<h4 class="mt-2 font-semibold">{{ expandedEvent.title }}</h4>
							<p class="mt-2 text-sm leading-6 text-muted-fg">{{ expandedEvent.impact }}</p>
							<div class="mt-4 flex flex-wrap gap-2">
								<span
									v-for="action in expandedEvent.actions"
									:key="`focused-${action}`"
									class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg"
								>
									{{ action }}
								</span>
							</div>
						</div>
					</aside>
				</section>
			</section>

			<aside class="grid content-start gap-4">
				<section class="rounded-lg border border-border bg-canvas p-4 shadow-xl shadow-black/5 lg:sticky lg:top-4">
					<div class="flex items-start gap-3">
						<div class="grid size-11 place-items-center rounded-lg bg-success/15 text-success">
							<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
								<path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM4 20a4 4 0 0 1 8 0M13 19a3.5 3.5 0 0 1 7 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</div>
						<div class="min-w-0">
							<p class="text-sm font-semibold">{{ selectedAccount.name }}</p>
							<p class="mt-1 text-sm text-muted-fg">{{ selectedAccount.segment }} / {{ selectedAccount.product }}</p>
						</div>
					</div>

					<div class="mt-5 grid gap-3 text-sm">
						<div class="flex justify-between gap-3 border-b border-border pb-3">
							<span class="text-muted-fg">Owner</span>
							<span class="font-medium">{{ selectedAccount.owner }}</span>
						</div>
						<div class="flex justify-between gap-3 border-b border-border pb-3">
							<span class="text-muted-fg">Champion</span>
							<span class="font-medium">{{ selectedAccount.champion }}</span>
						</div>
						<div class="flex justify-between gap-3 border-b border-border pb-3">
							<span class="text-muted-fg">Last touch</span>
							<span class="font-medium">{{ selectedAccount.lastTouch }}</span>
						</div>
						<div class="flex justify-between gap-3">
							<span class="text-muted-fg">Timeline events</span>
							<span class="font-medium">{{ accountEvents.length }}</span>
						</div>
					</div>

					<div class="mt-5 grid grid-cols-2 gap-2">
						<DomButton size="sm" variant="secondary">Open CRM</DomButton>
						<DomButton size="sm">Send update</DomButton>
					</div>
				</section>
			</aside>
		</div>
	</div>
</template>
