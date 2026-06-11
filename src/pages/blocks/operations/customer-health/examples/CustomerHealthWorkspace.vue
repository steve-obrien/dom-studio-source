<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomCheckbox, DomNativeSelect, DomTextareaInput } from '@getdom/studio/vue';

const accounts = [
	{
		id: 'zephyr',
		name: 'Zephyr Health',
		segment: 'Enterprise',
		owner: 'Maya Patel',
		renewal: 'Sep 18, 2026',
		arr: 184000,
		score: 74,
		trend: -8,
		status: 'At risk',
		statusTone: 'warning',
		plan: 'Enterprise annual',
		champion: 'Elena Ruiz, VP Operations',
		licenses: { active: 118, total: 180 },
		teams: 9,
		integrations: 4,
		tickets: 7,
		p1Tickets: 2,
		nps: 18,
		lastTouch: '2 days ago',
		riskDrivers: [
			{ label: 'Core workflow adoption dropped 12%', detail: 'Three large teams stopped using approvals last week.', tone: 'warning' },
			{ label: 'Two unresolved P1 tickets', detail: 'Escalation owner assigned but no customer-facing update since Monday.', tone: 'danger' },
			{ label: 'Procurement review pending', detail: 'Security addendum was requested before renewal paperwork.', tone: 'neutral' },
		],
		opportunities: [
			{ label: 'Add field operations team', value: '+42 seats', confidence: 'High' },
			{ label: 'Activate Slack integration', value: '12 teams waiting', confidence: 'Medium' },
		],
		activity: [
			{ type: 'Support', title: 'Escalated export timeout', detail: 'Engineering linked the incident to a large account sync.', time: 'Today' },
			{ type: 'Call', title: 'Champion requested rollout guidance', detail: 'New regional managers need approval workflow training.', time: 'Jun 09' },
			{ type: 'Billing', title: 'Renewal quote opened', detail: 'Procurement viewed annual terms and security addendum.', time: 'Jun 07' },
		],
	},
	{
		id: 'northstar',
		name: 'Northstar Finance',
		segment: 'Mid-market',
		owner: 'Jon Bell',
		renewal: 'Aug 04, 2026',
		arr: 76000,
		score: 91,
		trend: 6,
		status: 'Healthy',
		statusTone: 'success',
		plan: 'Scale annual',
		champion: 'Priya Shah, RevOps Lead',
		licenses: { active: 63, total: 70 },
		teams: 6,
		integrations: 7,
		tickets: 1,
		p1Tickets: 0,
		nps: 52,
		lastTouch: '5 days ago',
		riskDrivers: [
			{ label: 'Usage expanded across teams', detail: 'Weekly active teams increased from 4 to 6.', tone: 'success' },
			{ label: 'Low support pressure', detail: 'Only one low-severity ticket remains open.', tone: 'success' },
			{ label: 'Renewal paperwork not started', detail: 'Owner should confirm budget cycle before July.', tone: 'neutral' },
		],
		opportunities: [
			{ label: 'Introduce audit log add-on', value: '+GBP 14k', confidence: 'High' },
			{ label: 'Invite finance admins', value: '+8 seats', confidence: 'Medium' },
		],
		activity: [
			{ type: 'Usage', title: 'Forecast report adopted', detail: 'Finance leadership opened the report 38 times this week.', time: 'Yesterday' },
			{ type: 'Success', title: 'QBR deck approved', detail: 'Champion approved value summary for executive review.', time: 'Jun 08' },
			{ type: 'Product', title: 'Audit log trial started', detail: 'Admin accepted a 14 day add-on trial.', time: 'Jun 03' },
		],
	},
	{
		id: 'atlas',
		name: 'Atlas Retail Group',
		segment: 'Enterprise',
		owner: 'Sam Rivera',
		renewal: 'Jul 22, 2026',
		arr: 221000,
		score: 58,
		trend: -16,
		status: 'Critical',
		statusTone: 'danger',
		plan: 'Enterprise annual',
		champion: 'Jordan Lee, CIO',
		licenses: { active: 96, total: 240 },
		teams: 4,
		integrations: 2,
		tickets: 13,
		p1Tickets: 3,
		nps: -12,
		lastTouch: '12 days ago',
		riskDrivers: [
			{ label: 'Seat activation below 45%', detail: 'Retail operations team has not completed rollout.', tone: 'danger' },
			{ label: 'Executive sponsor is inactive', detail: 'No executive touchpoint since April.', tone: 'danger' },
			{ label: 'Support backlog rising', detail: 'Three critical tickets are linked to identity provisioning.', tone: 'warning' },
		],
		opportunities: [
			{ label: 'Recover dormant stores', value: '31 locations', confidence: 'Medium' },
			{ label: 'Identity provisioning project', value: 'Blocks churn', confidence: 'High' },
		],
		activity: [
			{ type: 'Risk', title: 'Usage alert triggered', detail: 'Only 4 of 12 target teams were active this week.', time: 'Today' },
			{ type: 'Support', title: 'Identity ticket reopened', detail: 'Customer says SSO rollout still blocks new store managers.', time: 'Yesterday' },
			{ type: 'CRM', title: 'Renewal close date moved', detail: 'Forecast changed from commit to best case.', time: 'Jun 05' },
		],
	},
];

const playbookOptions = [
	{ label: 'Renewal save plan', value: 'Renewal save plan' },
	{ label: 'Executive business review', value: 'Executive business review' },
	{ label: 'Expansion discovery', value: 'Expansion discovery' },
	{ label: 'Adoption rescue', value: 'Adoption rescue' },
];

const selectedAccountId = ref('zephyr');
const selectedTab = ref('signals');
const playbook = ref('Renewal save plan');
const ownerNote = ref('Confirm sponsor availability, summarize unresolved P1 tickets, and propose a two-week adoption recovery plan.');
const showOnlyRisks = ref(false);
const tasks = ref([
	{ id: 'sponsor', label: 'Book sponsor call with current champion', done: false },
	{ id: 'support', label: 'Send escalation update for unresolved P1 tickets', done: true },
	{ id: 'adoption', label: 'Prepare adoption rescue plan for inactive teams', done: false },
	{ id: 'renewal', label: 'Attach risk summary to renewal opportunity', done: false },
]);

const selectedAccount = computed(() => accounts.find((account) => account.id === selectedAccountId.value) || accounts[0]);
const adoptionRate = computed(() => Math.round((selectedAccount.value.licenses.active / selectedAccount.value.licenses.total) * 100));
const visibleDrivers = computed(() => {
	if (!showOnlyRisks.value) return selectedAccount.value.riskDrivers;
	return selectedAccount.value.riskDrivers.filter((driver) => driver.tone === 'warning' || driver.tone === 'danger');
});
const completedTaskCount = computed(() => tasks.value.filter((task) => task.done).length);
const readiness = computed(() => Math.round((completedTaskCount.value / tasks.value.length) * 100));
const summaryMetrics = computed(() => [
	{ label: 'ARR', value: money(selectedAccount.value.arr), detail: selectedAccount.value.plan },
	{ label: 'Renewal', value: selectedAccount.value.renewal, detail: `${selectedAccount.value.lastTouch} since last touch` },
	{ label: 'Adoption', value: `${adoptionRate.value}%`, detail: `${selectedAccount.value.licenses.active}/${selectedAccount.value.licenses.total} seats active` },
	{ label: 'Support', value: `${selectedAccount.value.tickets} open`, detail: `${selectedAccount.value.p1Tickets} priority incidents` },
]);

function money(value) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		maximumFractionDigits: 0,
	}).format(value);
}

function scoreToneClass(tone) {
	if (tone === 'success') return 'bg-success/15 text-success';
	if (tone === 'danger') return 'bg-destructive/15 text-destructive';
	if (tone === 'warning') return 'bg-warning/15 text-warning';
	return 'bg-secondary text-muted-fg';
}

function scoreBarClass(score) {
	if (score >= 85) return 'bg-success';
	if (score >= 65) return 'bg-warning';
	return 'bg-destructive';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-raised px-4 py-4 sm:px-6">
			<div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Customer health</p>
					<h3 class="mt-1 text-2xl font-semibold tracking-tight">Renewal risk and account recovery</h3>
					<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">
						Review customer health, adoption signals, support pressure, and action readiness from one success workspace.
					</p>
				</div>
				<div class="grid gap-2 sm:grid-cols-[13rem_auto] sm:items-end">
					<DomNativeSelect
						v-model="selectedAccountId"
						label="Account"
						:options="accounts.map((account) => ({ label: account.name, value: account.id }))"
					/>
					<DomButton>Open CRM record</DomButton>
				</div>
			</div>
		</header>

		<div class="grid xl:grid-cols-[16rem_minmax(0,1fr)_22rem]">
			<aside class="border-b border-border skin-raised xl:border-b-0 xl:border-r">
				<div class="flex gap-2 overflow-x-auto p-3 xl:grid xl:gap-1">
					<button
						v-for="account in accounts"
						:key="account.id"
						type="button"
						class="min-w-56 rounded-2xl px-3 py-3 text-left transition hover:bg-background xl:min-w-0"
						:class="selectedAccountId === account.id ? 'bg-background shadow-sm ring-1 ring-border' : ''"
						@click="selectedAccountId = account.id"
					>
						<div class="flex items-start justify-between gap-3">
							<span class="min-w-0">
								<span class="block truncate text-sm font-semibold">{{ account.name }}</span>
								<span class="mt-1 block text-xs text-muted-fg">{{ account.segment }} / {{ account.owner }}</span>
							</span>
							<span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="scoreToneClass(account.statusTone)">
								{{ account.score }}
							</span>
						</div>
						<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
							<div class="h-full rounded-full" :class="scoreBarClass(account.score)" :style="{ width: `${account.score}%` }"></div>
						</div>
					</button>
				</div>
			</aside>

			<main class="min-w-0 border-b border-border xl:border-b-0 xl:border-r">
				<section class="border-b border-border p-4 sm:p-6">
					<div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
						<div>
							<div class="flex flex-wrap items-center gap-2">
								<h4 class="text-xl font-semibold tracking-tight">{{ selectedAccount.name }}</h4>
								<span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="scoreToneClass(selectedAccount.statusTone)">
									{{ selectedAccount.status }}
								</span>
								<span class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg">
									{{ selectedAccount.trend > 0 ? '+' : '' }}{{ selectedAccount.trend }} this month
								</span>
							</div>
							<p class="mt-2 text-sm leading-6 text-muted-fg">
								Owned by {{ selectedAccount.owner }}. Champion: {{ selectedAccount.champion }}.
							</p>
						</div>
						<div class="grid min-w-40 gap-2">
							<div class="flex items-end gap-3">
								<span class="text-5xl font-semibold tracking-tight">{{ selectedAccount.score }}</span>
								<span class="pb-2 text-sm font-medium text-muted-fg">health score</span>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-secondary">
								<div class="h-full rounded-full" :class="scoreBarClass(selectedAccount.score)" :style="{ width: `${selectedAccount.score}%` }"></div>
							</div>
						</div>
					</div>

					<div class="mt-6 grid divide-y divide-border overflow-hidden rounded-2xl border border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
						<div v-for="metric in summaryMetrics" :key="metric.label" class="bg-background p-4">
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ metric.label }}</p>
							<p class="mt-2 text-lg font-semibold">{{ metric.value }}</p>
							<p class="mt-1 text-sm leading-6 text-muted-fg">{{ metric.detail }}</p>
						</div>
					</div>
				</section>

				<section class="border-b border-border px-4 sm:px-6">
					<div class="flex gap-2 overflow-x-auto py-3">
						<button
							v-for="tab in [
								{ id: 'signals', label: 'Health signals' },
								{ id: 'timeline', label: 'Timeline' },
								{ id: 'expansion', label: 'Expansion' },
							]"
							:key="tab.id"
							type="button"
							class="rounded-full px-3 py-1.5 text-sm font-medium transition"
							:class="selectedTab === tab.id ? 'bg-primary text-primary-fg' : 'bg-secondary text-muted-fg hover:text-fg'"
							@click="selectedTab = tab.id"
						>
							{{ tab.label }}
						</button>
					</div>
				</section>

				<section v-if="selectedTab === 'signals'" class="p-4 sm:p-6">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h4 class="font-semibold tracking-tight">Score drivers</h4>
							<p class="mt-1 text-sm text-muted-fg">Explain why the account moved and what an owner should inspect first.</p>
						</div>
						<DomCheckbox v-model="showOnlyRisks" label="Risks only" />
					</div>
					<div class="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border">
						<div v-for="driver in visibleDrivers" :key="driver.label" class="grid gap-3 bg-background p-4 sm:grid-cols-[auto_minmax(0,1fr)]">
							<span class="mt-1 size-3 rounded-full" :class="scoreBarClass(driver.tone === 'success' ? 90 : driver.tone === 'warning' ? 72 : 42)"></span>
							<span>
								<span class="block font-semibold">{{ driver.label }}</span>
								<span class="mt-1 block text-sm leading-6 text-muted-fg">{{ driver.detail }}</span>
							</span>
						</div>
					</div>
				</section>

				<section v-else-if="selectedTab === 'timeline'" class="p-4 sm:p-6">
					<h4 class="font-semibold tracking-tight">Recent activity</h4>
					<div class="mt-4 grid gap-4">
						<div v-for="event in selectedAccount.activity" :key="`${event.type}-${event.title}`" class="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 text-sm">
							<span class="mt-1 rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-muted-fg">{{ event.type }}</span>
							<span>
								<span class="block font-semibold">{{ event.title }}</span>
								<span class="mt-1 block leading-6 text-muted-fg">{{ event.detail }}</span>
							</span>
							<span class="text-xs font-medium text-muted-fg">{{ event.time }}</span>
						</div>
					</div>
				</section>

				<section v-else class="p-4 sm:p-6">
					<h4 class="font-semibold tracking-tight">Expansion and save opportunities</h4>
					<div class="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border">
						<div v-for="opportunity in selectedAccount.opportunities" :key="opportunity.label" class="flex flex-wrap items-center justify-between gap-3 bg-background p-4">
							<span>
								<span class="block font-semibold">{{ opportunity.label }}</span>
								<span class="mt-1 block text-sm text-muted-fg">Confidence: {{ opportunity.confidence }}</span>
							</span>
							<span class="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{{ opportunity.value }}</span>
						</div>
					</div>
				</section>
			</main>

			<aside class="grid content-start skin-raised">
				<section class="border-b border-border p-4 sm:p-6">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Next best action</p>
					<h4 class="mt-1 text-lg font-semibold">Launch {{ playbook.toLowerCase() }}</h4>
					<div class="mt-4">
						<DomNativeSelect v-model="playbook" label="Playbook" :options="playbookOptions" />
					</div>
					<div class="mt-4">
						<DomTextareaInput v-model="ownerNote" label="Owner note" :rows="5" />
					</div>
				</section>

				<section class="border-b border-border p-4 sm:p-6">
					<div class="flex items-center justify-between gap-3">
						<h4 class="font-semibold tracking-tight">Readiness</h4>
						<span class="text-sm font-semibold">{{ readiness }}%</span>
					</div>
					<div class="mt-3 h-2 overflow-hidden rounded-full bg-background">
						<div class="h-full rounded-full bg-primary" :style="{ width: `${readiness}%` }"></div>
					</div>
					<div class="mt-4 grid gap-3">
						<DomCheckbox
							v-for="task in tasks"
							:key="task.id"
							v-model="task.done"
							:label="task.label"
						/>
					</div>
				</section>

				<section class="p-4 sm:p-6">
					<h4 class="font-semibold tracking-tight">Account context</h4>
					<div class="mt-4 grid gap-3 text-sm">
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Weekly active teams</span>
							<span class="font-semibold">{{ selectedAccount.teams }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Connected integrations</span>
							<span class="font-semibold">{{ selectedAccount.integrations }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">NPS</span>
							<span class="font-semibold">{{ selectedAccount.nps }}</span>
						</div>
					</div>
					<DomButton class="mt-5 w-full">Create success plan</DomButton>
				</section>
			</aside>
		</div>
	</div>
</template>
