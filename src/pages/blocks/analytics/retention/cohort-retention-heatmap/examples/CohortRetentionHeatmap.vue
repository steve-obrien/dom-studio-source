<script setup>
import { computed, ref, watch } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCard,
	DomDialog,
	DomProgress,
	DomRadioGroup,
	DomSelect,
	DomStatusPill,
	DomTextareaInput,
	DomToggle,
	DomToggleButtonGroup,
	DomTooltip,
} from '@getdom/studio/vue';

const metricTabs = [
	{ key: 'activation', value: 'activation', label: 'Activation' },
	{ key: 'workspace', value: 'workspace', label: 'Workspace use' },
	{ key: 'billing', value: 'billing', label: 'Billing' },
];

const segmentOptions = [
	{
		value: 'all',
		label: 'All signup cohorts',
		description: 'Every eligible workspace created in the selected weeks.',
		meta: '6,821 users',
	},
	{
		value: 'selfServe',
		label: 'Self-serve teams',
		description: 'Workspaces that started without sales assistance.',
		meta: '4,204 users',
	},
	{
		value: 'salesLed',
		label: 'Sales-led accounts',
		description: 'Accounts with an opportunity or assisted onboarding.',
		meta: '1,638 users',
	},
	{
		value: 'aiApps',
		label: 'AI app builders',
		description: 'Teams that created an AI-powered project in week zero.',
		meta: '979 users',
	},
];

const destinationOptions = [
	{
		value: 'product',
		label: 'Product follow-up',
		description: 'Create a product investigation for the activation team.',
	},
	{
		value: 'lifecycle',
		label: 'Lifecycle experiment',
		description: 'Send the cohort context to the lifecycle workspace.',
	},
	{
		value: 'success',
		label: 'Customer success list',
		description: 'Prepare retained or at-risk accounts for outreach.',
	},
];

const periodLabels = ['W0', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6'];

const cohorts = [
	{
		id: 'jun-01',
		label: 'Jun 1',
		range: 'Jun 1–7',
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
		range: 'May 25–31',
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
		range: 'May 18–24',
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
		range: 'May 11–17',
		size: 1542,
		revenue: 49200,
		source: 'Paid search',
		activation: [100, 61, 49, 40, 33, 29, 25],
		workspace: [100, 58, 46, 37, 31, 27, 23],
		billing: [100, 76, 69, 62, 55, 51, 47],
		note: 'Paid search cohorts needed more domain-specific starter flows.',
		action: 'Split first-run setup by app type and intent.',
	},
	{
		id: 'may-04',
		label: 'May 4',
		range: 'May 4–10',
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
const selectedCohortId = ref('may-25');
const investigationDialogOpen = ref(false);
const investigationNote = ref('');
const investigationDestination = ref('product');
const investigationSaved = ref(false);
const actionNotice = ref('');
const exportNotice = ref(false);

const activeBenchmark = computed(getActiveBenchmark);
const activeMetricLabel = computed(getActiveMetricLabel);
const selectedSegmentOption = computed(getSelectedSegmentOption);
const adjustedRows = computed(getAdjustedRows);
const selectedCell = computed(getSelectedCell);
const selectedRow = computed(getSelectedRow);
const selectedCohortRow = computed(getSelectedCohortRow);
const mobileCohortOptions = computed(getMobileCohortOptions);
const weekOneAverage = computed(getWeekOneAverage);
const weekFourAverage = computed(getWeekFourAverage);
const strongestCohort = computed(getStrongestCohort);
const riskCohorts = computed(getRiskCohorts);
const selectedDelta = computed(getSelectedDelta);
const selectedStatus = computed(getSelectedStatus);
const selectedStatusTone = computed(getSelectedStatusTone);
const selectedInsight = computed(getSelectedInsight);
const selectedCountLabel = computed(getSelectedCountLabel);
const payloadPreview = computed(getPayloadPreview);
const querySignature = computed(getQuerySignature);
const csvHref = computed(getCsvHref);

watch(selectedCohortId, syncSelectedCohort);
watch(querySignature, markInvestigationStale);

/**
 * Resolve the benchmark definition for the active retention metric.
 *
 * @returns {{ weekOne: number, weekFour: number, target: string }} Active benchmark definition.
 */
function getActiveBenchmark() {
	return benchmarkByMetric[activeMetric.value];
}

/**
 * Resolve the readable label for the active metric tab.
 *
 * @returns {string} Active metric label.
 */
function getActiveMetricLabel() {
	return metricTabs.find((metric) => metric.key === activeMetric.value)?.label || metricTabs[0].label;
}

/**
 * Resolve the rich segment option selected by the user.
 *
 * @returns {{ value: string, label: string, description: string, meta: string }} Active segment option.
 */
function getSelectedSegmentOption() {
	return segmentOptions.find((option) => option.value === selectedSegment.value) || segmentOptions[0];
}

/**
 * Apply segment and revenue-mode adjustments to the server-shaped cohort rows.
 *
 * @returns {Array<object>} Cohort rows with display values and interactive cell records.
 */
function getAdjustedRows() {
	const adjustment = segmentAdjustments[selectedSegment.value] || 0;
	return cohorts.map((cohort) => {
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
	});
}

/**
 * Resolve the selected heatmap cell while retaining a safe fallback.
 *
 * @returns {object} Selected cell record.
 */
function getSelectedCell() {
	return adjustedRows.value
		.flatMap((row) => row.cells)
		.find((cell) => cell.id === selectedCellId.value)
		|| adjustedRows.value[1].cells[4];
}

/**
 * Resolve the cohort row that owns the selected cell.
 *
 * @returns {object} Selected cohort row.
 */
function getSelectedRow() {
	return adjustedRows.value.find((row) => row.id === selectedCell.value.cohortId) || adjustedRows.value[0];
}

/**
 * Resolve the single cohort shown in the compact mobile heatmap.
 *
 * @returns {object} Active compact cohort row.
 */
function getSelectedCohortRow() {
	return adjustedRows.value.find((row) => row.id === selectedCohortId.value) || adjustedRows.value[0];
}

/**
 * Build rich mobile cohort choices using the currently adjusted week-four value.
 *
 * @returns {Array<{ value: string, label: string, description: string, rate: number, source: string }>} Mobile cohort options.
 */
function getMobileCohortOptions() {
	return adjustedRows.value.map((row) => ({
		value: row.id,
		label: `${row.label} cohort`,
		description: `${row.source} · ${formatNumber(row.size)} starting users`,
		rate: row.values[4],
		source: row.source,
	}));
}

/**
 * Calculate the average week-one retention across the visible cohorts.
 *
 * @returns {number} Rounded week-one average.
 */
function getWeekOneAverage() {
	return average(adjustedRows.value.map((row) => row.values[1]));
}

/**
 * Calculate the average week-four retention across the visible cohorts.
 *
 * @returns {number} Rounded week-four average.
 */
function getWeekFourAverage() {
	return average(adjustedRows.value.map((row) => row.values[4]));
}

/**
 * Find the cohort with the highest week-four retention.
 *
 * @returns {object} Strongest cohort row.
 */
function getStrongestCohort() {
	return adjustedRows.value.reduce(
		(best, row) => row.values[4] > best.values[4] ? row : best,
		adjustedRows.value[0],
	);
}

/**
 * Return cohorts that fall below the active week-four benchmark.
 *
 * @returns {Array<object>} Cohorts below target.
 */
function getRiskCohorts() {
	return adjustedRows.value.filter((row) => row.values[4] < activeBenchmark.value.weekFour);
}

/**
 * Calculate the selected cell's percentage-point distance from its benchmark.
 *
 * @returns {number} Signed percentage-point delta.
 */
function getSelectedDelta() {
	return selectedCell.value.rate - targetForPeriod(selectedCell.value.period);
}

/**
 * Resolve the human-readable selected-cell status.
 *
 * @returns {'Baseline'|'Ahead'|'On track'|'Needs attention'} Selected-cell status.
 */
function getSelectedStatus() {
	if (selectedCell.value.period === 0) return 'Baseline';
	if (selectedDelta.value >= 6) return 'Ahead';
	if (selectedDelta.value >= 0) return 'On track';
	return 'Needs attention';
}

/**
 * Resolve a semantic DOM Studio tone for the selected-cell status.
 *
 * @returns {'neutral'|'success'|'primary'|'warning'} Status tone.
 */
function getSelectedStatusTone() {
	return {
		Baseline: 'neutral',
		Ahead: 'success',
		'On track': 'primary',
		'Needs attention': 'warning',
	}[selectedStatus.value] || 'neutral';
}

/**
 * Explain what the selected cell means and what the team should inspect next.
 *
 * @returns {string} Selected-cell insight.
 */
function getSelectedInsight() {
	if (selectedCell.value.period === 0) {
		return 'Every cohort starts at 100%. Choose a later week to compare repeat value.';
	}
	if (selectedDelta.value >= 6) {
		return `${selectedRow.value.label} is ${selectedDelta.value} points above target. Package the journey as a reusable onboarding path.`;
	}
	if (selectedDelta.value >= 0) {
		return `${selectedRow.value.label} is close to target. Watch the next period before changing the lifecycle flow.`;
	}
	return `${selectedRow.value.label} is ${Math.abs(selectedDelta.value)} points below target. Review source quality and activation friction.`;
}

/**
 * Format the selected retained-user or retained-revenue value.
 *
 * @returns {string} Display value for the selected cohort cell.
 */
function getSelectedCountLabel() {
	return revenueMode.value
		? formatCurrency(selectedCell.value.retainedRevenue)
		: formatNumber(selectedCell.value.retainedUsers);
}

/**
 * Build the integration payload represented by the selected cell and action.
 *
 * @returns {object} Investigation payload preview.
 */
function getPayloadPreview() {
	return {
		metric: activeMetric.value,
		segment: selectedSegment.value,
		mode: revenueMode.value ? 'revenue_retention' : 'user_retention',
		selectedCohortId: selectedRow.value.id,
		selectedPeriod: selectedCell.value.period,
		retentionRate: selectedCell.value.rate,
		destination: investigationDestination.value,
	};
}

/**
 * Serialize selection-affecting state so a saved investigation can be invalidated.
 *
 * @returns {string} Stable query and cell signature.
 */
function getQuerySignature() {
	return JSON.stringify({
		metric: activeMetric.value,
		segment: selectedSegment.value,
		revenueMode: revenueMode.value,
		cell: selectedCellId.value,
	});
}

/**
 * Build a downloadable CSV data URL for the adjusted cohort matrix.
 *
 * @returns {string} Encoded cohort CSV data URL.
 */
function getCsvHref() {
	const header = ['Cohort', 'Source', 'Users', ...periodLabels].join(',');
	const rows = adjustedRows.value.map((row) => [
		row.label,
		row.source,
		row.size,
		...row.values,
	].join(','));
	return `data:text/csv;charset=utf-8,${encodeURIComponent([header, ...rows].join('\n'))}`;
}

/**
 * Select a heatmap cell and keep the compact cohort selector aligned with it.
 *
 * @param {object} cell Cohort cell record.
 * @returns {void}
 */
function selectCell(cell) {
	selectedCellId.value = cell.id;
	selectedCohortId.value = cell.cohortId;
	actionNotice.value = '';
}

/**
 * Preserve the current period while switching the compact mobile cohort.
 *
 * @param {string} cohortId Selected cohort identifier.
 * @returns {void}
 */
function syncSelectedCohort(cohortId) {
	const row = adjustedRows.value.find((candidate) => candidate.id === cohortId);
	if (!row) return;
	const period = Math.min(selectedCell.value.period, row.cells.length - 1);
	selectedCellId.value = row.cells[period].id;
}

/**
 * Mark the previous investigation stale when the analysis selection changes.
 *
 * @returns {void}
 */
function markInvestigationStale() {
	investigationSaved.value = false;
}

/**
 * Calculate a rounded average for a non-empty numeric array.
 *
 * @param {number[]} values Numeric values to average.
 * @returns {number} Rounded arithmetic mean.
 */
function average(values) {
	return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

/**
 * Resolve the benchmark target for a cohort period.
 *
 * @param {number} period Zero-based cohort period.
 * @returns {number} Benchmark percentage for the period.
 */
function targetForPeriod(period) {
	if (period === 0) return 100;
	if (period === 1) return activeBenchmark.value.weekOne;
	if (period >= 4) return activeBenchmark.value.weekFour;
	return Math.round((activeBenchmark.value.weekOne + activeBenchmark.value.weekFour) / 2);
}

/**
 * Build a theme-token heatmap fill based on distance from the period target.
 *
 * @param {object} cell Cohort cell record.
 * @returns {{ backgroundColor: string }} Theme-aware cell style.
 */
function getCellStyle(cell) {
	const delta = cell.rate - targetForPeriod(cell.period);
	let token = '--primary';
	if (cell.period === 0 || delta >= 6) token = '--success';
	else if (delta < -8) token = '--destructive';
	else if (delta < 0) token = '--warning';
	const strength = Math.round(18 + (Math.max(0, Math.min(100, cell.rate)) * 0.32));
	return {
		backgroundColor: `color-mix(in srgb, var(${token}) ${strength}%, var(--canvas))`,
	};
}

/**
 * Build a precise accessible label for an interactive retention cell.
 *
 * @param {object} row Cohort row.
 * @param {object} cell Cohort cell record.
 * @returns {string} Accessible cell label.
 */
function getCellLabel(row, cell) {
	const benchmarkState = cell.period === 0
		? 'baseline'
		: cell.rate >= targetForPeriod(cell.period) ? 'at or above benchmark' : 'below benchmark';
	return `${row.label}, week ${cell.period}: ${cell.rate}% retained, ${benchmarkState}`;
}

/**
 * Format a signed percentage-point delta for visible benchmark copy.
 *
 * @param {number} value Signed percentage-point delta.
 * @returns {string} Formatted delta.
 */
function formatDelta(value) {
	return `${value > 0 ? '+' : ''}${value} pts`;
}

/**
 * Format an integer using the British English locale.
 *
 * @param {number} value Numeric value.
 * @returns {string} Localized integer.
 */
function formatNumber(value) {
	return new Intl.NumberFormat('en-GB').format(value);
}

/**
 * Format a whole-pound currency value.
 *
 * @param {number} value Numeric currency value.
 * @returns {string} Localized GBP value.
 */
function formatCurrency(value) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		maximumFractionDigits: 0,
	}).format(value);
}

/**
 * Open the investigation composer with a relevant suggested action.
 *
 * @returns {void}
 */
function openInvestigationDialog() {
	investigationNote.value = selectedRow.value.action;
	investigationDialogOpen.value = true;
}

/**
 * Save the local investigation example and expose its result in the workspace.
 *
 * @returns {void}
 */
function saveInvestigation() {
	if (!investigationNote.value.trim()) return;
	investigationSaved.value = true;
	investigationDialogOpen.value = false;
	actionNotice.value = `${selectedRow.value.label} / W${selectedCell.value.period} saved to ${investigationDestination.value}.`;
}

/**
 * Show confirmation after the adjusted cohort matrix is downloaded.
 *
 * @returns {void}
 */
function onExport() {
	exportNotice.value = true;
}
</script>

<template>
	<section class="min-h-dvh bg-canvas text-canvas-fg">
		<header class="border-b border-border">
			<div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
				<div class="max-w-3xl">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Retention analytics</p>
						<DomStatusPill tone="success" label="Updated 6 min ago" size="sm" />
					</div>
					<h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Find the cohort losing repeat value</h1>
					<p class="mt-2 hidden text-sm leading-6 text-muted-fg sm:block">
						Compare weekly retention, inspect one outlier, and turn the evidence into a product, lifecycle, or customer-success follow-up.
					</p>
				</div>
				<div class="grid grid-cols-2 gap-2 sm:flex">
					<DomButton
						as="a"
						:href="csvHref"
						:download="`${activeMetric}-${selectedSegment}-cohorts.csv`"
						variant="secondary"
						@click="onExport"
					>
						Download CSV
					</DomButton>
					<DomButton @click="openInvestigationDialog">Save investigation</DomButton>
				</div>
			</div>
		</header>

		<main class="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5">
			<DomAlert
				v-if="actionNotice"
				tone="success"
				title="Investigation saved"
				:description="actionNotice"
				dismissible
				@dismiss="actionNotice = ''"
			/>
			<DomAlert
				v-if="exportNotice"
				tone="success"
				title="Cohort CSV downloaded"
				description="The export contains the adjusted cohort values currently visible in this example."
				dismissible
				@dismiss="exportNotice = false"
			/>

			<DomCard padding="p-4 sm:p-5">
				<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)_auto] lg:items-end">
					<div class="min-w-0">
						<p class="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Metric family</p>
						<DomToggleButtonGroup
							v-model="activeMetric"
							:options="metricTabs"
							label="Metric family"
							chrome="none"
							size="sm"
							variant="switch"
						/>
					</div>

					<DomSelect
						v-model="selectedSegment"
						label="Segment"
						:options="segmentOptions"
						width="min-w-[23rem]"
					>
						<template #value="{ option }">
							<span class="flex min-w-0 items-center justify-between gap-3">
								<span class="truncate font-medium">{{ option?.label }}</span>
								<DomBadge tone="neutral" size="sm">{{ option?.meta }}</DomBadge>
							</span>
						</template>
						<template #option="{ option, selected }">
							<span class="block">
								<span class="flex items-start justify-between gap-3">
									<span class="font-medium">{{ option.label }}</span>
									<DomBadge :tone="selected ? 'success' : 'neutral'" size="sm">{{ selected ? 'Selected' : option.meta }}</DomBadge>
								</span>
								<span class="mt-1 block text-xs text-muted-fg">{{ option.description }}</span>
							</span>
						</template>
					</DomSelect>

					<div class="grid grid-cols-2 gap-4 rounded-xl border border-border bg-secondary/45 p-3">
						<DomToggle
							v-model="revenueMode"
							label="Revenue"
							description="Retained value"
							size="sm"
						/>
						<DomToggle
							v-model="showBenchmarks"
							label="Targets"
							description="Show markers"
							size="sm"
						/>
					</div>
				</div>

				<div class="mt-4 hidden grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid">
					<div class="min-w-0 bg-canvas p-3 sm:p-4">
						<p class="truncate text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-fg sm:text-xs">Week 1</p>
						<p class="mt-2 text-lg font-semibold sm:text-2xl">{{ weekOneAverage }}%</p>
						<p class="mt-1 truncate text-xs text-muted-fg">Target {{ activeBenchmark.weekOne }}%</p>
					</div>
					<div class="min-w-0 bg-canvas p-3 sm:p-4">
						<p class="truncate text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-fg sm:text-xs">Week 4</p>
						<p class="mt-2 text-lg font-semibold sm:text-2xl">{{ weekFourAverage }}%</p>
						<p class="mt-1 truncate text-xs text-muted-fg">{{ riskCohorts.length }} below target</p>
					</div>
					<div class="min-w-0 bg-canvas p-3 sm:p-4">
						<p class="truncate text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-fg sm:text-xs">Best cohort</p>
						<p class="mt-2 text-lg font-semibold sm:text-2xl">{{ strongestCohort.values[4] }}%</p>
						<p class="mt-1 truncate text-xs text-muted-fg">{{ strongestCohort.label }} · {{ strongestCohort.source }}</p>
					</div>
				</div>
				<div class="mt-4 flex flex-wrap gap-2 sm:hidden" aria-label="Retention summary">
					<DomBadge tone="neutral">W1 {{ weekOneAverage }}%</DomBadge>
					<DomBadge :tone="weekFourAverage >= activeBenchmark.weekFour ? 'success' : 'warning'">W4 {{ weekFourAverage }}%</DomBadge>
					<DomBadge tone="neutral">Best {{ strongestCohort.values[4] }}%</DomBadge>
				</div>
			</DomCard>

			<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
				<DomCard padding="p-4 sm:p-5">
					<div class="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<h2 class="text-base font-semibold">{{ activeMetricLabel }} retention by signup week</h2>
							<p class="mt-1 text-sm leading-6 text-muted-fg">
								{{ selectedSegmentOption.label }} · {{ revenueMode ? 'retained revenue' : 'retained users' }}
							</p>
						</div>
						<div class="flex flex-wrap gap-2">
							<DomBadge tone="neutral" size="sm">{{ adjustedRows.length }} cohorts</DomBadge>
							<DomBadge tone="neutral" size="sm">{{ periodLabels.length }} weeks</DomBadge>
						</div>
					</div>

					<div class="hidden pt-4 lg:block" role="grid" aria-label="Cohort retention heatmap">
						<div class="grid grid-cols-[9.5rem_repeat(7,minmax(3.25rem,1fr))] items-center gap-2 px-1" role="row">
							<div role="columnheader" class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Cohort</div>
							<div
								v-for="period in periodLabels"
								:key="period"
								role="columnheader"
								class="text-center text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg"
							>
								{{ period }}
							</div>
						</div>

						<div
							v-for="row in adjustedRows"
							:key="row.id"
							role="row"
							class="mt-2 grid grid-cols-[9.5rem_repeat(7,minmax(3.25rem,1fr))] items-stretch gap-2 border-t border-border pt-2"
						>
							<div role="rowheader" class="min-w-0 py-2 pr-2">
								<div class="flex items-center justify-between gap-2">
									<p class="font-semibold">{{ row.label }}</p>
									<DomBadge tone="neutral" size="sm">{{ row.range }}</DomBadge>
								</div>
								<p class="mt-1 truncate text-xs text-muted-fg">{{ row.source }}</p>
								<p class="mt-2 text-xs font-medium text-muted-fg">{{ formatNumber(row.size) }} users</p>
							</div>

							<div v-for="cell in row.cells" :key="cell.id" role="gridcell">
								<DomTooltip :text="getCellLabel(row, cell)">
									<button
										type="button"
										class="relative grid min-h-[4.75rem] w-full place-items-center rounded-xl border p-2 text-center text-canvas-fg transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
										:class="cell.id === selectedCell.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'"
										:style="getCellStyle(cell)"
										:aria-label="getCellLabel(row, cell)"
										:aria-pressed="cell.id === selectedCell.id"
										@click="selectCell(cell)"
									>
										<span class="text-base font-semibold">{{ cell.rate }}%</span>
										<span class="text-[0.625rem] font-medium opacity-75">
											{{ revenueMode ? formatCurrency(cell.retainedRevenue) : formatNumber(cell.retainedUsers) }}
										</span>
										<span
											v-if="showBenchmarks && cell.period > 0 && cell.rate < targetForPeriod(cell.period)"
											class="absolute right-1.5 top-1.5 size-2 rounded-full bg-warning"
											aria-hidden="true"
										></span>
									</button>
								</DomTooltip>
							</div>
						</div>
					</div>

					<div class="pt-4 lg:hidden">
						<DomSelect
							v-model="selectedCohortId"
							label="Cohort"
							description="Choose one cohort to keep its selected cell and insight together."
							:options="mobileCohortOptions"
							width="min-w-[21rem]"
						>
							<template #value="{ option }">
								<span class="flex min-w-0 items-center justify-between gap-3">
									<span class="truncate font-medium">{{ option?.label }}</span>
									<DomBadge :tone="option?.rate >= activeBenchmark.weekFour ? 'success' : 'warning'" size="sm">{{ option?.rate }}% W4</DomBadge>
								</span>
							</template>
							<template #option="{ option, selected }">
								<span class="block">
									<span class="flex items-center justify-between gap-3">
										<span class="font-medium">{{ option.label }}</span>
										<DomBadge :tone="option.rate >= activeBenchmark.weekFour ? 'success' : 'warning'" size="sm">{{ option.rate }}% W4</DomBadge>
									</span>
									<span class="mt-1 block text-xs text-muted-fg">{{ option.description }}</span>
									<DomBadge v-if="selected" class="mt-2" tone="success" size="sm">Selected</DomBadge>
								</span>
							</template>
						</DomSelect>

						<div class="mt-4 grid grid-cols-7 gap-1 text-center text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-muted-fg">
							<span v-for="period in periodLabels" :key="`${period}-compact`">{{ period }}</span>
						</div>
						<div class="mt-2 grid grid-cols-7 gap-1">
							<button
								v-for="cell in selectedCohortRow.cells"
								:key="`${cell.id}-compact`"
								type="button"
								class="relative grid aspect-square min-h-10 place-items-center rounded-lg border text-xs font-semibold text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
								:class="cell.id === selectedCell.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'"
								:style="getCellStyle(cell)"
								:aria-label="getCellLabel(selectedCohortRow, cell)"
								:aria-pressed="cell.id === selectedCell.id"
								@click="selectCell(cell)"
							>
								{{ cell.rate }}
								<span
									v-if="showBenchmarks && cell.period > 0 && cell.rate < targetForPeriod(cell.period)"
									class="absolute right-1 top-1 size-1.5 rounded-full bg-warning"
									aria-hidden="true"
								></span>
							</button>
						</div>
						<div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-fg">
							<DomBadge tone="neutral" size="sm">{{ selectedCohortRow.range }}</DomBadge>
							<span>{{ selectedCohortRow.source }}</span>
							<span>·</span>
							<span>{{ formatNumber(selectedCohortRow.size) }} starting users</span>
						</div>
					</div>
				</DomCard>

				<DomCard as="aside" padding="p-4 sm:p-5">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Selected cell</p>
							<h2 class="mt-1 text-xl font-semibold">{{ selectedRow.label }} · W{{ selectedCell.period }}</h2>
						</div>
						<DomStatusPill :tone="selectedStatusTone" :label="selectedStatus" size="sm" />
					</div>

					<div class="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
						<div class="bg-canvas p-3">
							<p class="text-xs text-muted-fg">Retention</p>
							<p class="mt-1 text-2xl font-semibold">{{ selectedCell.rate }}%</p>
						</div>
						<div class="min-w-0 bg-canvas p-3">
							<p class="text-xs text-muted-fg">{{ revenueMode ? 'Revenue' : 'Users' }}</p>
							<p class="mt-1 truncate text-2xl font-semibold">{{ selectedCountLabel }}</p>
						</div>
					</div>

					<DomProgress
						class="mt-4"
						:value="selectedCell.rate"
						:tone="selectedDelta < 0 ? 'warning' : 'success'"
						:label="`W${selectedCell.period} retention`"
						:show-label="false"
					/>

					<p class="mt-4 text-sm leading-6 text-muted-fg">{{ selectedInsight }}</p>

					<div class="mt-4 border-t border-border pt-4">
						<p class="text-sm font-semibold">{{ selectedRow.note }}</p>
						<p class="mt-2 text-sm leading-6 text-muted-fg">{{ selectedRow.action }}</p>
					</div>

					<dl class="mt-4 divide-y divide-border border-y border-border text-sm">
						<div class="flex items-center justify-between gap-3 py-3">
							<dt class="text-muted-fg">Week 1 target</dt>
							<dd class="font-semibold">{{ activeBenchmark.weekOne }}%</dd>
						</div>
						<div class="flex items-center justify-between gap-3 py-3">
							<dt class="text-muted-fg">Week 4 target</dt>
							<dd class="font-semibold">{{ activeBenchmark.weekFour }}%</dd>
						</div>
						<div class="flex items-center justify-between gap-3 py-3">
							<dt class="text-muted-fg">Selected delta</dt>
							<dd class="font-semibold" :class="selectedDelta < 0 ? 'text-warning-fg' : 'text-success'">{{ formatDelta(selectedDelta) }}</dd>
						</div>
					</dl>

					<div class="mt-4 grid gap-2">
						<DomButton @click="openInvestigationDialog">{{ investigationSaved ? 'Update investigation' : 'Save investigation' }}</DomButton>
						<DomBadge v-if="investigationSaved" class="justify-self-center" tone="success">Investigation saved</DomBadge>
					</div>
				</DomCard>
			</div>
		</main>

		<DomDialog
			v-model="investigationDialogOpen"
			title="Save cohort investigation"
			:description="`Capture why ${selectedRow.label} at week ${selectedCell.period} matters and route it to the right team.`"
			size="lg"
		>
			<div class="grid gap-4">
				<DomTextareaInput
					v-model="investigationNote"
					label="Investigation note"
					description="State the evidence and the next action."
					:rows="4"
				/>
				<DomRadioGroup
					v-model="investigationDestination"
					label="Destination"
					:options="destinationOptions"
				>
					<template #option="{ option }">
						<div class="min-w-0">
							<p class="font-medium text-canvas-fg">{{ option.label }}</p>
							<p class="mt-1 text-xs leading-5 text-muted-fg">{{ option.description }}</p>
						</div>
					</template>
				</DomRadioGroup>
				<DomAlert
					tone="neutral"
					title="Integration boundary"
					:description="`Persist this payload through your analytics workflow API: ${JSON.stringify(payloadPreview)}.`"
					:icon="false"
				/>
			</div>
			<template #footer>
				<DomButton data-close variant="secondary">Cancel</DomButton>
				<DomButton :disabled="!investigationNote.trim()" @click="saveInvestigation">Save investigation</DomButton>
			</template>
		</DomDialog>
	</section>
</template>
