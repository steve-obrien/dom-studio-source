<script setup>
import { computed, ref, watch } from 'vue';
import { DomButton, DomNativeSelect, DomTabs, DomToggle, DomTooltip } from '@getdom/studio/vue';

const metricTabs = [
	{ key: 'activation', label: 'Activation' },
	{ key: 'workspace', label: 'Workspace use' },
	{ key: 'billing', label: 'Billing' },
];

const segmentOptions = [
	{ value: 'all', label: 'All signup cohorts' },
	{ value: 'selfServe', label: 'Self-serve teams' },
	{ value: 'salesLed', label: 'Sales-led accounts' },
	{ value: 'aiApps', label: 'AI app builders' },
];

const periodLabels = ['W0', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6'];

const cohorts = [
	{
		id: 'jun-01',
		label: 'Jun 1',
		range: 'Jun 1-7',
		size: 1480,
		revenue: 51600,
		source: 'Template gallery',
		activation: [100, 71, 62, 54, 48, 43, 39],
		workspace: [100, 66, 58, 51, 45, 40, 36],
		billing: [100, 82, 78, 72, 66, 61, 57],
		note: 'Template import kept teams active after week two.',
		action: 'Promote checklist templates in onboarding.',
	},
	{
		id: 'may-25',
		label: 'May 25',
		range: 'May 25-31',
		size: 1325,
		revenue: 47100,
		source: 'AI builder launch',
		activation: [100, 68, 57, 47, 39, 34, 31],
		workspace: [100, 63, 52, 43, 36, 32, 28],
		billing: [100, 79, 73, 68, 61, 56, 52],
		note: 'Strong launch interest, but week four dropped below target.',
		action: 'Add triggered examples after the first failed build.',
	},
	{
		id: 'may-18',
		label: 'May 18',
		range: 'May 18-24',
		size: 1194,
		revenue: 43800,
		source: 'Partner webinar',
		activation: [100, 74, 65, 58, 52, 48, 44],
		workspace: [100, 69, 61, 55, 50, 46, 42],
		billing: [100, 84, 79, 74, 70, 65, 61],
		note: 'Partner cohorts retained better when admins invited teams early.',
		action: 'Keep invite prompts visible through week three.',
	},
	{
		id: 'may-11',
		label: 'May 11',
		range: 'May 11-17',
		size: 1542,
		revenue: 49200,
		source: 'Paid search',
		activation: [100, 61, 49, 40, 33, 29, 25],
		workspace: [100, 58, 46, 37, 31, 27, 23],
		billing: [100, 76, 69, 62, 55, 51, 47],
		note: 'Paid search cohort needed more domain-specific starter flows.',
		action: 'Split first-run setup by app type and intent.',
	},
	{
		id: 'may-04',
		label: 'May 4',
		range: 'May 4-10',
		size: 1280,
		revenue: 38400,
		source: 'Organic docs',
		activation: [100, 70, 60, 52, 46, 41, 37],
		workspace: [100, 65, 56, 49, 43, 38, 34],
		billing: [100, 81, 75, 69, 64, 58, 54],
		note: 'Docs visitors stayed active when they copied a complete block.',
		action: 'Surface integration notes before signup completes.',
	},
];

const benchmarkByMetric = {
	activation: { weekOne: 66, weekFour: 42, target: 'Activation target' },
	workspace: { weekOne: 62, weekFour: 38, target: 'Usage target' },
	billing: { weekOne: 78, weekFour: 60, target: 'Revenue target' },
};

const segmentAdjustments = {
	all: 0,
	selfServe: -3,
	salesLed: 6,
	aiApps: 4,
};

const activeMetric = ref('activation');
const selectedSegment = ref('all');
const revenueMode = ref(false);
const showBenchmarks = ref(true);
const selectedCellId = ref('may-25-4');

const activeBenchmark = computed(() => benchmarkByMetric[activeMetric.value]);
const adjustedRows = computed(() => cohorts.map((cohort) => {
	const adjustment = segmentAdjustments[selectedSegment.value] || 0;
	const values = cohort[activeMetric.value].map((value, index) => {
		const segmentLift = index === 0 ? 0 : adjustment;
		const revenueLift = revenueMode.value && index > 0 ? 5 : 0;
		return Math.max(0, Math.min(100, value + segmentLift + revenueLift));
	});

	return {
		...cohort,
		values,
		cells: values.map((rate, period) => ({
			id: `${cohort.id}-${period}`,
			cohortId: cohort.id,
			period,
			rate,
			retainedUsers: Math.round(cohort.size * (rate / 100)),
			retainedRevenue: Math.round(cohort.revenue * (rate / 100)),
		})),
	};
}));

const selectedCell = computed(() => {
	return adjustedRows.value.flatMap((row) => row.cells).find((cell) => cell.id === selectedCellId.value)
		|| adjustedRows.value[1].cells[4];
});

const selectedRow = computed(() => adjustedRows.value.find((row) => row.id === selectedCell.value.cohortId) || adjustedRows.value[0]);
const weekOneAverage = computed(() => average(adjustedRows.value.map((row) => row.values[1])));
const weekFourAverage = computed(() => average(adjustedRows.value.map((row) => row.values[4])));
const strongestCohort = computed(() => adjustedRows.value.reduce((best, row) => row.values[4] > best.values[4] ? row : best, adjustedRows.value[0]));
const riskCohorts = computed(() => adjustedRows.value.filter((row) => row.values[4] < activeBenchmark.value.weekFour));
const selectedDelta = computed(() => selectedCell.value.rate - targetForPeriod(selectedCell.value.period));
const selectedStatus = computed(() => {
	if (selectedCell.value.period === 0) return 'Baseline';
	if (selectedDelta.value >= 6) return 'Ahead';
	if (selectedDelta.value >= 0) return 'On track';
	return 'Needs attention';
});
const selectedInsight = computed(() => {
	if (selectedCell.value.period === 0) return 'Every cohort starts at 100 percent. Use later periods to compare repeat value.';
	if (selectedDelta.value >= 6) return `${selectedRow.value.label} is outperforming the benchmark. Package the journey as a reusable onboarding path.`;
	if (selectedDelta.value >= 0) return `${selectedRow.value.label} is close to target. Watch the next period before changing the lifecycle flow.`;
	return `${selectedRow.value.label} is ${Math.abs(selectedDelta.value)} points below target. Review source quality and activation friction.`;
});
const payloadPreview = computed(() => ({
	metric: activeMetric.value,
	segment: selectedSegment.value,
	mode: revenueMode.value ? 'revenue_retention' : 'user_retention',
	selectedCohortId: selectedRow.value.id,
	selectedPeriod: selectedCell.value.period,
	retentionRate: selectedCell.value.rate,
}));

watch([activeMetric, selectedSegment, revenueMode], () => {
	if (!adjustedRows.value.some((row) => row.cells.some((cell) => cell.id === selectedCellId.value))) {
		selectedCellId.value = adjustedRows.value[0].cells[1].id;
	}
});

function selectCell(cell) {
	selectedCellId.value = cell.id;
}

function average(values) {
	return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function targetForPeriod(period) {
	if (period === 0) return 100;
	if (period === 1) return activeBenchmark.value.weekOne;
	if (period >= 4) return activeBenchmark.value.weekFour;
	return Math.round((activeBenchmark.value.weekOne + activeBenchmark.value.weekFour) / 2);
}

function cellColor(rate) {
	const lightness = 96 - Math.max(0, Math.min(100, rate)) * 0.42;
	const saturation = 42 + Math.max(0, Math.min(100, rate)) * 0.26;
	return `hsl(166 ${saturation}% ${lightness}%)`;
}

function cellTextClass(rate) {
	return rate >= 58 ? 'text-emerald-950' : rate >= 38 ? 'text-slate-800' : 'text-rose-950';
}

function statusClasses(status) {
	return {
		Ahead: 'bg-success/15 text-success',
		'On track': 'bg-primary/10 text-primary',
		'Needs attention': 'bg-warning/15 text-warning',
		Baseline: 'bg-secondary text-muted-fg',
	}[status] || 'bg-secondary text-muted-fg';
}

function formatNumber(value) {
	return new Intl.NumberFormat('en-GB').format(value);
}

function formatCurrency(value) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		maximumFractionDigits: 0,
	}).format(value);
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-lg border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<section class="border-b border-border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/.14),transparent_34%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--secondary)/.72))] px-4 py-5 sm:px-6 lg:px-7">
			<div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-muted-fg">
						<span>Retention analytics</span>
						<span class="h-1 w-1 rounded-full bg-muted-fg/50"></span>
						<span>{{ revenueMode ? 'Revenue mode' : 'User mode' }}</span>
					</div>
					<h3 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Cohort retention heatmap</h3>
					<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">
						Compare cohort quality by week, inspect outliers, and send the right insight to product, lifecycle, or customer success teams.
					</p>
				</div>

				<div class="grid gap-2 sm:grid-cols-3 xl:min-w-[34rem]">
					<div class="rounded-lg border border-border bg-background/82 p-3">
						<p class="text-xs font-medium text-muted-fg">Week 1 average</p>
						<p class="mt-1 text-2xl font-semibold">{{ weekOneAverage }}%</p>
						<p class="mt-1 text-xs text-muted-fg">Target {{ activeBenchmark.weekOne }}%</p>
					</div>
					<div class="rounded-lg border border-border bg-background/82 p-3">
						<p class="text-xs font-medium text-muted-fg">Week 4 average</p>
						<p class="mt-1 text-2xl font-semibold">{{ weekFourAverage }}%</p>
						<p class="mt-1 text-xs text-muted-fg">{{ riskCohorts.length }} cohorts under target</p>
					</div>
					<div class="rounded-lg border border-border bg-background/82 p-3">
						<p class="text-xs font-medium text-muted-fg">Best cohort</p>
						<p class="mt-1 text-2xl font-semibold">{{ strongestCohort.values[4] }}%</p>
						<p class="mt-1 text-xs text-muted-fg">{{ strongestCohort.label }} from {{ strongestCohort.source }}</p>
					</div>
				</div>
			</div>
		</section>

		<section class="grid gap-4 border-b border-border bg-background px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_15rem_auto] lg:items-end lg:px-7">
			<div class="min-w-0">
				<p class="mb-2 text-xs font-semibold uppercase text-muted-fg">Metric family</p>
				<DomTabs v-model="activeMetric" :tabs="metricTabs" />
			</div>
			<DomNativeSelect v-model="selectedSegment" label="Segment" :options="segmentOptions" />
			<div class="grid gap-3 rounded-lg border border-border bg-secondary/55 p-3 sm:grid-cols-2 lg:min-w-[18rem]">
				<label class="flex items-center justify-between gap-3 text-sm font-medium">
					<span>Revenue view</span>
					<DomToggle v-model="revenueMode" aria-label="Show revenue retention" />
				</label>
				<label class="flex items-center justify-between gap-3 text-sm font-medium">
					<span>Benchmarks</span>
					<DomToggle v-model="showBenchmarks" aria-label="Show benchmark markers" />
				</label>
			</div>
		</section>

		<section class="grid gap-0 xl:grid-cols-[minmax(0,1fr)_21rem]">
			<div class="min-w-0 border-b border-border xl:border-b-0 xl:border-r">
				<div class="hidden overflow-x-auto sm:block">
					<div class="min-w-[58rem] p-4 sm:p-6 lg:p-7">
						<div class="grid grid-cols-[10.5rem_repeat(7,minmax(4.75rem,1fr))] items-center gap-2">
							<div class="text-xs font-semibold uppercase text-muted-fg">Cohort</div>
							<div v-for="period in periodLabels" :key="period" class="text-center text-xs font-semibold uppercase text-muted-fg">
								{{ period }}
							</div>

							<template v-for="row in adjustedRows" :key="row.id">
								<div class="rounded-lg border border-border bg-secondary/45 p-3">
									<div class="flex items-center justify-between gap-2">
										<p class="font-semibold">{{ row.label }}</p>
										<span class="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-fg">{{ row.range }}</span>
									</div>
									<p class="mt-1 truncate text-xs text-muted-fg">{{ row.source }}</p>
									<p class="mt-2 text-xs font-medium text-muted-fg">
										{{ formatNumber(row.size) }} users / {{ formatCurrency(row.revenue) }}
									</p>
								</div>

								<DomTooltip
									v-for="cell in row.cells"
									:key="cell.id"
									:text="`${row.label} ${periodLabels[cell.period]}: ${cell.rate}% retained`"
								>
									<button
										type="button"
										class="relative grid min-h-[4.8rem] place-items-center rounded-lg border p-2 text-center transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
										:class="[
											cell.id === selectedCell.id ? 'border-primary shadow-lg shadow-primary/15' : 'border-transparent',
											cellTextClass(cell.rate)
										]"
										:style="{ backgroundColor: cellColor(cell.rate) }"
										@click="selectCell(cell)"
									>
										<span class="text-lg font-semibold">{{ cell.rate }}%</span>
										<span class="text-[11px] font-semibold opacity-75">
											{{ revenueMode ? formatCurrency(cell.retainedRevenue) : formatNumber(cell.retainedUsers) }}
										</span>
										<span
											v-if="showBenchmarks && cell.period > 0 && cell.rate < targetForPeriod(cell.period)"
											class="absolute right-1.5 top-1.5 size-2 rounded-full bg-warning"
											aria-label="Below benchmark"
										></span>
									</button>
								</DomTooltip>
							</template>
						</div>
					</div>
				</div>

				<div class="grid gap-3 border-t border-border bg-secondary/35 p-4 sm:hidden">
					<div v-for="row in adjustedRows" :key="`${row.id}-mobile`" class="rounded-lg border border-border bg-background p-4">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="font-semibold">{{ row.label }}</p>
								<p class="mt-1 text-sm text-muted-fg">{{ row.source }}</p>
							</div>
							<span class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg">{{ row.values[4] }}% W4</span>
						</div>
						<div class="mt-4 grid grid-cols-7 gap-1.5">
							<button
								v-for="cell in row.cells"
								:key="`${cell.id}-mobile`"
								type="button"
								class="grid aspect-square place-items-center rounded-md border text-[11px] font-bold"
								:class="cell.id === selectedCell.id ? 'border-primary' : 'border-transparent'"
								:style="{ backgroundColor: cellColor(cell.rate) }"
								@click="selectCell(cell)"
							>
								{{ cell.rate }}
							</button>
						</div>
					</div>
				</div>
			</div>

			<aside class="grid content-start gap-4 bg-secondary/35 p-4 sm:p-6 lg:p-7">
				<div class="rounded-lg border border-border bg-background p-4 shadow-sm">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase text-muted-fg">Selected cell</p>
							<h4 class="mt-1 text-xl font-semibold">{{ selectedRow.label }} / W{{ selectedCell.period }}</h4>
						</div>
						<span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="statusClasses(selectedStatus)">
							{{ selectedStatus }}
						</span>
					</div>

					<div class="mt-4 grid grid-cols-2 gap-2">
						<div class="rounded-lg bg-secondary/70 p-3">
							<p class="text-xs text-muted-fg">Retention</p>
							<p class="mt-1 text-2xl font-semibold">{{ selectedCell.rate }}%</p>
						</div>
						<div class="rounded-lg bg-secondary/70 p-3">
							<p class="text-xs text-muted-fg">{{ revenueMode ? 'Revenue' : 'Users' }}</p>
							<p class="mt-1 text-2xl font-semibold">
								{{ revenueMode ? formatCurrency(selectedCell.retainedRevenue) : formatNumber(selectedCell.retainedUsers) }}
							</p>
						</div>
					</div>

					<p class="mt-4 text-sm leading-6 text-muted-fg">{{ selectedInsight }}</p>
					<div class="mt-4 rounded-lg border border-border bg-secondary/45 p-3 text-sm leading-6">
						<p class="font-semibold text-fg">{{ selectedRow.note }}</p>
						<p class="mt-2 text-muted-fg">{{ selectedRow.action }}</p>
					</div>
				</div>

				<div class="rounded-lg border border-border bg-background p-4">
					<p class="text-xs font-semibold uppercase text-muted-fg">Benchmarks</p>
					<div class="mt-3 grid gap-3 text-sm">
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Week 1 target</span>
							<span class="font-semibold">{{ activeBenchmark.weekOne }}%</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Week 4 target</span>
							<span class="font-semibold">{{ activeBenchmark.weekFour }}%</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Current delta</span>
							<span class="font-semibold" :class="selectedDelta < 0 ? 'text-warning' : 'text-success'">
								{{ selectedDelta > 0 ? '+' : '' }}{{ selectedDelta }} pts
							</span>
						</div>
					</div>
				</div>

				<div class="rounded-lg border border-border bg-background p-4">
					<p class="text-xs font-semibold uppercase text-muted-fg">Action payload</p>
					<pre class="mt-3 overflow-x-auto rounded-lg bg-fg p-3 text-xs leading-5 text-background">{{ JSON.stringify(payloadPreview, null, 2) }}</pre>
					<DomButton class="mt-4 w-full" variant="secondary">
						Save investigation
					</DomButton>
				</div>
			</aside>
		</section>
	</div>
</template>
