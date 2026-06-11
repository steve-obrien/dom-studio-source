<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomDrawer, DomNativeSelect, DomPopover, DomTabs, DomTooltip } from '@getdom/studio/vue';

const dateRangeOptions = [
	{ label: 'Last 7 days', value: 'Last 7 days' },
	{ label: 'Last 30 days', value: 'Last 30 days' },
	{ label: 'Quarter to date', value: 'Quarter to date' },
	{ label: 'Custom range', value: 'Custom range' },
];

const segmentOptions = [
	{ label: 'All users', value: 'All users' },
	{ label: 'Paid workspaces', value: 'Paid workspaces' },
	{ label: 'Invited users', value: 'Invited users' },
	{ label: 'Mobile signup', value: 'Mobile signup' },
];

const windowOptions = [
	{ label: '24 hours', value: '24 hours' },
	{ label: '7 days', value: '7 days' },
	{ label: '14 days', value: '14 days' },
	{ label: '30 days', value: '30 days' },
];

const attributionOptions = [
	{ label: 'Any order', value: 'Any order' },
	{ label: 'Exact order', value: 'Exact order' },
	{ label: 'First touch', value: 'First touch' },
];

const insightTabs = [
	{ key: 'insights', label: 'Insights' },
	{ key: 'cohorts', label: 'Cohorts' },
];

const savedFunnels = [
	{ id: 'activation', name: 'Activation to invite', team: 'Growth', updated: '12 min ago', rate: 21.2 },
	{ id: 'checkout', name: 'Checkout completion', team: 'Revenue', updated: 'Today 09:10', rate: 63.8 },
	{ id: 'trial', name: 'Trial to upgrade', team: 'Lifecycle', updated: 'Yesterday', rate: 18.4 },
];

const funnelSteps = ref([
	{
		id: 'signup',
		label: 'Account created',
		event: 'account_created',
		count: 18420,
		conversion: 100,
		dropoff: 0,
		delta: '+3.4%',
		bar: 100,
		median: '0 min',
	},
	{
		id: 'workspace',
		label: 'Workspace created',
		event: 'workspace_created',
		count: 13980,
		conversion: 75.9,
		dropoff: 24.1,
		delta: '+1.8%',
		bar: 76,
		median: '6 min',
	},
	{
		id: 'project',
		label: 'First project created',
		event: 'project_created',
		count: 8240,
		conversion: 44.7,
		dropoff: 41.1,
		delta: '-6.2%',
		bar: 45,
		median: '38 min',
	},
	{
		id: 'invite',
		label: 'Teammate invited',
		event: 'teammate_invited',
		count: 3910,
		conversion: 21.2,
		dropoff: 52.5,
		delta: '+0.9%',
		bar: 21,
		median: '1.8 days',
	},
]);

const segments = [
	{ name: 'All users', users: '18.4k', conversion: 21.2, lift: 'Baseline', color: 'bg-primary' },
	{ name: 'Paid workspaces', users: '5.8k', conversion: 34.9, lift: '+13.7 pts', color: 'bg-emerald-500' },
	{ name: 'Invited users', users: '3.2k', conversion: 28.4, lift: '+7.2 pts', color: 'bg-sky-500' },
];

const annotations = [
	{ step: 'Workspace created', note: 'OAuth users complete this step 12 points faster than password users.', impact: 'Opportunity' },
	{ step: 'First project created', note: 'Template picker abandonment increased after the last navigation update.', impact: 'Regression' },
	{ step: 'Teammate invited', note: 'Teams with sample data invite 2.3x more collaborators in the first week.', impact: 'Growth lever' },
];

const cohorts = [
	{ name: 'Dropped before first project', size: '5,740 users', action: 'Send setup guide' },
	{ name: 'Created project, no invite', size: '4,330 users', action: 'Trigger team prompt' },
	{ name: 'High-intent paid workspaces', size: '1,204 users', action: 'Sync to CRM' },
];

const selectedFunnelId = ref('activation');
const selectedStepId = ref('project');
const selectedDateRange = ref('Last 30 days');
const selectedSegment = ref('All users');
const comparisonSegment = ref('Paid workspaces');
const conversionWindow = ref('7 days');
const attribution = ref('Exact order');
const activeTab = ref('insights');
const includeBotTraffic = ref(false);
const showDrawer = ref(false);
const savedNote = ref('');

const selectedFunnel = computed(() => savedFunnels.find((funnel) => funnel.id === selectedFunnelId.value) || savedFunnels[0]);
const selectedStep = computed(() => funnelSteps.value.find((step) => step.id === selectedStepId.value) || funnelSteps.value[0]);
const finalStep = computed(() => funnelSteps.value[funnelSteps.value.length - 1]);
const largestDropoffStep = computed(() => funnelSteps.value.slice(1).reduce((largest, step) => step.dropoff > largest.dropoff ? step : largest, funnelSteps.value[1]));
const conversionSummary = computed(() => `${finalStep.value.conversion}% convert in ${conversionWindow.value}`);
const queryReadiness = computed(() => {
	let score = 55;
	if (selectedSegment.value !== comparisonSegment.value) score += 15;
	if (attribution.value === 'Exact order') score += 10;
	if (!includeBotTraffic.value) score += 10;
	if (funnelSteps.value.length >= 4) score += 10;
	return Math.min(score, 100);
});
const stepRows = computed(() => funnelSteps.value.map((step, index) => ({
	...step,
	previous: index === 0 ? 100 : Math.round((step.count / funnelSteps.value[index - 1].count) * 1000) / 10,
})));

function selectFunnel(funnel) {
	selectedFunnelId.value = funnel.id;
	selectedStepId.value = funnel.id === 'checkout' ? 'workspace' : 'project';
	savedNote.value = '';
}

function selectStep(step) {
	selectedStepId.value = step.id;
}

function moveStep(step, direction) {
	const index = funnelSteps.value.findIndex((item) => item.id === step.id);
	const nextIndex = index + direction;
	if (index < 0 || nextIndex < 0 || nextIndex >= funnelSteps.value.length) return;
	const nextSteps = [...funnelSteps.value];
	const [item] = nextSteps.splice(index, 1);
	nextSteps.splice(nextIndex, 0, item);
	funnelSteps.value = nextSteps;
}

function saveInsight() {
	savedNote.value = `Saved ${selectedStep.value.label} insight for ${selectedSegment.value}`;
	showDrawer.value = false;
}

function deltaClass(delta) {
	return delta.startsWith('-') ? 'text-destructive' : 'text-emerald-600';
}
</script>

<template>
	<section class="min-h-screen bg-background text-fg">
		<div class="mx-auto flex w-full max-w-7xl flex-col overflow-hidden border-x border-border bg-background shadow-2xl shadow-black/10">
			<header class="border-b border-border skin-raised px-4 py-4 sm:px-6">
				<div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
					<div class="min-w-0">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Product analytics</p>
						<h1 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Funnel explorer</h1>
						<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">Compare conversion paths, inspect the largest drop-off, and turn funnel findings into cohorts or saved team insights.</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<DomPopover position="bottom-end">
							<template #trigger>
								<DomButton variant="secondary">
									<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
									</svg>
									Query settings
								</DomButton>
							</template>
							<div class="w-72 p-4">
								<h2 class="text-sm font-semibold">Query settings</h2>
								<div class="mt-4 grid gap-3">
									<label class="block">
										<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Conversion window</span>
										<DomNativeSelect v-model="conversionWindow" :options="windowOptions" class="mt-1 w-full" />
									</label>
									<label class="block">
										<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Attribution</span>
										<DomNativeSelect v-model="attribution" :options="attributionOptions" class="mt-1 w-full" />
									</label>
									<label class="flex items-center justify-between gap-3 rounded-lg bg-secondary px-3 py-2 text-sm">
										<span>Include bot traffic</span>
										<input v-model="includeBotTraffic" type="checkbox" class="size-4 accent-current" />
									</label>
								</div>
							</div>
						</DomPopover>
						<DomButton @click="showDrawer = true">
							<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
							</svg>
							Save insight
						</DomButton>
					</div>
				</div>
			</header>

			<div class="grid min-h-[48rem] lg:grid-cols-[17rem_minmax(0,1fr)_22rem]">
				<aside class="border-b border-border skin-raised lg:border-b-0 lg:border-r">
					<div class="border-b border-border px-4 py-4">
						<div class="flex items-center justify-between gap-3">
							<h2 class="text-sm font-semibold">Saved funnels</h2>
							<span class="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-muted-fg">{{ savedFunnels.length }}</span>
						</div>
					</div>
					<nav class="grid gap-1 p-2">
						<button
							v-for="funnel in savedFunnels"
							:key="funnel.id"
							type="button"
							class="rounded-lg px-3 py-3 text-left transition hover:bg-secondary"
							:class="selectedFunnelId === funnel.id ? 'bg-secondary text-secondary-fg' : 'text-muted-fg'"
							@click="selectFunnel(funnel)"
						>
							<span class="block truncate text-sm font-semibold text-fg">{{ funnel.name }}</span>
							<span class="mt-1 flex items-center justify-between gap-3 text-xs">
								<span>{{ funnel.team }} / {{ funnel.updated }}</span>
								<strong class="text-fg">{{ funnel.rate }}%</strong>
							</span>
						</button>
					</nav>
					<div class="border-t border-border p-4">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Current run</p>
						<div class="mt-3 space-y-2 text-sm">
							<p class="flex items-center justify-between gap-3"><span class="text-muted-fg">Readiness</span><strong>{{ queryReadiness }}%</strong></p>
							<div class="h-2 overflow-hidden rounded-full bg-secondary">
								<div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${queryReadiness}%` }"></div>
							</div>
							<p class="text-xs leading-5 text-muted-fg">Fresh results from 16 minutes ago. Bot traffic is {{ includeBotTraffic ? 'included' : 'excluded' }}.</p>
						</div>
					</div>
				</aside>

				<main class="min-w-0">
					<div class="border-b border-border px-4 py-4 sm:px-6">
						<div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
							<div class="min-w-0">
								<p class="text-sm font-semibold">{{ selectedFunnel.name }}</p>
								<p class="mt-1 text-sm leading-6 text-muted-fg">{{ conversionSummary }} / {{ attribution }} / compared with {{ comparisonSegment }}</p>
							</div>
							<div class="grid gap-3 sm:grid-cols-3">
								<label class="block">
									<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Date range</span>
									<DomNativeSelect v-model="selectedDateRange" :options="dateRangeOptions" class="mt-1 w-full" />
								</label>
								<label class="block">
									<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Segment</span>
									<DomNativeSelect v-model="selectedSegment" :options="segmentOptions" class="mt-1 w-full" />
								</label>
								<label class="block">
									<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Compare</span>
									<DomNativeSelect v-model="comparisonSegment" :options="segmentOptions" class="mt-1 w-full" />
								</label>
							</div>
						</div>
					</div>

					<section class="border-b border-border p-4 sm:p-6">
						<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<div>
								<h2 class="text-sm font-semibold">Conversion path</h2>
								<p class="mt-1 text-sm text-muted-fg">Largest drop-off: {{ largestDropoffStep.label }} loses {{ largestDropoffStep.dropoff }}%.</p>
							</div>
							<div class="flex flex-wrap gap-2">
								<span class="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-fg">{{ selectedDateRange }}</span>
								<span class="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-fg">{{ conversionWindow }}</span>
							</div>
						</div>

						<div class="mt-5 grid gap-3 xl:grid-cols-4">
							<button
								v-for="(step, index) in funnelSteps"
								:key="step.id"
								type="button"
								class="min-w-0 rounded-lg border p-4 text-left transition hover:border-ring"
								:class="selectedStepId === step.id ? 'border-primary bg-primary/10' : 'border-border bg-background'"
								@click="selectStep(step)"
							>
								<span class="flex items-start justify-between gap-3">
									<span class="min-w-0">
										<span class="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Step {{ index + 1 }}</span>
										<span class="mt-2 block truncate text-sm font-semibold">{{ step.label }}</span>
										<span class="mt-1 block truncate text-xs text-muted-fg">{{ step.event }}</span>
									</span>
									<DomTooltip :text="`Move ${step.label} earlier or later in the funnel`">
										<span class="inline-flex rounded-full bg-secondary p-1 text-muted-fg">
											<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
												<path d="M8 7h8M8 12h8M8 17h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
											</svg>
										</span>
									</DomTooltip>
								</span>
								<span class="mt-4 block h-2 overflow-hidden rounded-full bg-secondary">
									<span class="block h-full rounded-full bg-primary transition-all" :style="{ width: `${step.bar}%` }"></span>
								</span>
								<span class="mt-3 flex items-end justify-between gap-3">
									<strong class="text-2xl tracking-tight">{{ step.conversion }}%</strong>
									<span class="text-xs font-semibold" :class="deltaClass(step.delta)">{{ step.delta }}</span>
								</span>
							</button>
						</div>
					</section>

					<section class="grid gap-0 xl:grid-cols-[minmax(0,1fr)_17rem]">
						<div class="min-w-0 p-4 sm:p-6">
							<div class="overflow-x-auto">
								<table class="min-w-full text-left text-sm">
									<thead class="border-b border-border text-xs uppercase tracking-[0.12em] text-muted-fg">
										<tr>
											<th class="py-2 pr-4 font-semibold">Step</th>
											<th class="py-2 pr-4 font-semibold">Users</th>
											<th class="py-2 pr-4 font-semibold">From previous</th>
											<th class="py-2 pr-4 font-semibold">Drop-off</th>
											<th class="py-2 font-semibold">Median time</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-border">
										<tr
											v-for="step in stepRows"
											:key="step.id"
											class="cursor-pointer transition hover:bg-secondary"
											:class="selectedStepId === step.id ? 'bg-secondary/70' : ''"
											@click="selectStep(step)"
										>
											<td class="py-3 pr-4">
												<p class="font-medium">{{ step.label }}</p>
												<p class="mt-1 text-xs text-muted-fg">{{ step.event }}</p>
											</td>
											<td class="py-3 pr-4 font-semibold">{{ step.count.toLocaleString() }}</td>
											<td class="py-3 pr-4">{{ step.previous }}%</td>
											<td class="py-3 pr-4">{{ step.dropoff }}%</td>
											<td class="py-3">{{ step.median }}</td>
										</tr>
									</tbody>
								</table>
							</div>

							<div class="mt-5 rounded-lg border border-border p-4">
								<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
									<div>
										<h2 class="text-sm font-semibold">Selected step</h2>
										<p class="mt-1 text-sm text-muted-fg">{{ selectedStep.label }} / {{ selectedStep.count.toLocaleString() }} users reached this point.</p>
									</div>
									<div class="flex gap-2">
										<DomButton size="sm" variant="secondary" @click="moveStep(selectedStep, -1)">Move up</DomButton>
										<DomButton size="sm" variant="secondary" @click="moveStep(selectedStep, 1)">Move down</DomButton>
									</div>
								</div>
								<div class="mt-4 grid gap-3 sm:grid-cols-3">
									<div class="rounded-lg bg-secondary p-3">
										<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Conversion</p>
										<p class="mt-1 text-xl font-semibold">{{ selectedStep.conversion }}%</p>
									</div>
									<div class="rounded-lg bg-secondary p-3">
										<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Drop-off</p>
										<p class="mt-1 text-xl font-semibold">{{ selectedStep.dropoff }}%</p>
									</div>
									<div class="rounded-lg bg-secondary p-3">
										<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Median time</p>
										<p class="mt-1 text-xl font-semibold">{{ selectedStep.median }}</p>
									</div>
								</div>
								<p v-if="savedNote" class="mt-4 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">{{ savedNote }}</p>
							</div>
						</div>

						<aside class="border-t border-border skin-raised p-4 xl:border-l xl:border-t-0">
							<h2 class="text-sm font-semibold">Segment comparison</h2>
							<div class="mt-4 grid gap-3">
								<div v-for="segment in segments" :key="segment.name" class="rounded-lg border border-border bg-background p-3">
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0">
											<p class="truncate text-sm font-semibold">{{ segment.name }}</p>
											<p class="mt-1 text-xs text-muted-fg">{{ segment.users }} users</p>
										</div>
										<span class="text-sm font-semibold">{{ segment.conversion }}%</span>
									</div>
									<div class="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
										<div class="h-full rounded-full transition-all" :class="segment.color" :style="{ width: `${segment.conversion * 2}%` }"></div>
									</div>
									<p class="mt-2 text-xs font-semibold text-muted-fg">{{ segment.lift }}</p>
								</div>
							</div>
						</aside>
					</section>
				</main>

				<aside class="border-t border-border skin-raised lg:border-l lg:border-t-0">
					<div class="p-4">
						<DomTabs v-model="activeTab" :tabs="insightTabs">
							<template #insights>
								<section>
									<h2 class="text-sm font-semibold">Generated insights</h2>
									<div class="mt-4 grid gap-3">
										<article v-for="annotation in annotations" :key="annotation.step" class="rounded-lg border border-border bg-background p-3">
											<div class="flex items-start justify-between gap-3">
												<h3 class="text-sm font-semibold">{{ annotation.step }}</h3>
												<span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-fg">{{ annotation.impact }}</span>
											</div>
											<p class="mt-2 text-xs leading-5 text-muted-fg">{{ annotation.note }}</p>
										</article>
									</div>
								</section>
							</template>
							<template #cohorts>
								<section>
									<h2 class="text-sm font-semibold">Cohort actions</h2>
									<div class="mt-4 grid gap-3">
										<article v-for="cohort in cohorts" :key="cohort.name" class="rounded-lg border border-border bg-background p-3">
											<h3 class="text-sm font-semibold">{{ cohort.name }}</h3>
											<p class="mt-1 text-xs text-muted-fg">{{ cohort.size }}</p>
											<DomButton class="mt-3 w-full" size="sm" variant="secondary">{{ cohort.action }}</DomButton>
										</article>
									</div>
								</section>
							</template>
						</DomTabs>
					</div>
				</aside>
			</div>
		</div>

		<DomDrawer v-model="showDrawer" title="Save funnel insight" side="right">
			<div class="space-y-5 p-5">
				<div>
					<p class="text-sm font-semibold">{{ selectedStep.label }}</p>
					<p class="mt-1 text-sm leading-6 text-muted-fg">Save this step finding for {{ selectedSegment }} so the team can revisit it from the analytics home.</p>
				</div>
				<label class="block">
					<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Insight note</span>
					<textarea class="mt-2 min-h-32 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">Investigate the setup template screen because this step has the highest drop-off in the current funnel.</textarea>
				</label>
				<div class="rounded-lg bg-secondary p-3 text-sm leading-6 text-muted-fg">
					This will save the funnel definition, active range, segment comparison, selected step, and note.
				</div>
				<div class="flex justify-end gap-2">
					<DomButton variant="secondary" @click="showDrawer = false">Cancel</DomButton>
					<DomButton @click="saveInsight">Save insight</DomButton>
				</div>
			</div>
		</DomDrawer>
	</section>
</template>
