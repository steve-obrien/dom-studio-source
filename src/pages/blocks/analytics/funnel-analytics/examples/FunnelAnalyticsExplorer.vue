<script setup>
import { computed, ref, watch } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCard,
	DomDialog,
	DomProgress,
	DomSelect,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomToggle,
} from '@getdom/studio/vue';

const analysisTabs = [
	{ key: 'conversion', label: 'Conversion' },
	{ key: 'segments', label: 'Segments' },
	{ key: 'follow-up', label: 'Follow-up' },
];

const dateRangeOptions = [
	{ label: 'Last 7 days', value: 'last-7-days', description: 'Fast signal from the current week.', scale: 0.25 },
	{ label: 'Last 30 days', value: 'last-30-days', description: 'Stable month-over-month working range.', scale: 1 },
	{ label: 'Quarter to date', value: 'quarter-to-date', description: 'Longer view for strategic reviews.', scale: 2.7 },
	{ label: 'Custom range', value: 'custom-range', description: 'Connect this choice to a calendar range.', scale: 1 },
];

const segmentOptions = [
	{ label: 'All users', value: 'all-users', description: 'Every eligible user in this funnel.', share: 1, conversionOffset: 0 },
	{ label: 'Paid workspaces', value: 'paid-workspaces', description: 'Workspaces with an active paid plan.', share: 0.315, conversionOffset: 13.7 },
	{ label: 'Invited users', value: 'invited-users', description: 'People who entered through an invitation.', share: 0.174, conversionOffset: 7.2 },
	{ label: 'Mobile signup', value: 'mobile-signup', description: 'Accounts created from a mobile device.', share: 0.41, conversionOffset: -4.6 },
];

const conversionWindowOptions = [
	{ label: '24 hours', value: '24-hours', description: 'Strict same-day completion.' },
	{ label: '7 days', value: '7-days', description: 'Standard activation window.' },
	{ label: '14 days', value: '14-days', description: 'Allow slower team evaluation.' },
	{ label: '30 days', value: '30-days', description: 'Include longer buying journeys.' },
];

const attributionOptions = [
	{ label: 'Any order', value: 'any-order', description: 'Count users when every event occurs in any sequence.' },
	{ label: 'Exact order', value: 'exact-order', description: 'Require events in the displayed sequence.' },
	{ label: 'First touch', value: 'first-touch', description: 'Attribute completion to the first qualifying journey.' },
];

const visibilityOptions = [
	{ label: 'Workspace', value: 'workspace', description: 'Everyone in the analytics workspace can find it.' },
	{ label: 'Growth team', value: 'growth-team', description: 'Only members of the Growth team can find it.' },
	{ label: 'Private', value: 'private', description: 'Visible only to you until it is shared.' },
];

const savedFunnels = [
	{
		id: 'activation',
		name: 'Activation to invite',
		team: 'Growth',
		updated: '12 min ago',
		freshness: '16 min ago',
		trend: '+0.9 pts',
		steps: [
			{ id: 'signup', label: 'Account created', event: 'account_created', baseCount: 18420, conversion: 100, median: '0 min', delta: '+3.4%' },
			{ id: 'workspace', label: 'Workspace created', event: 'workspace_created', baseCount: 13980, conversion: 75.9, median: '6 min', delta: '+1.8%' },
			{ id: 'project', label: 'First project created', event: 'project_created', baseCount: 8240, conversion: 44.7, median: '38 min', delta: '-6.2%' },
			{ id: 'invite', label: 'Teammate invited', event: 'teammate_invited', baseCount: 3910, conversion: 21.2, median: '1.8 days', delta: '+0.9%' },
		],
		insights: [
			{ id: 'activation-project', stepId: 'project', title: 'Template setup is the key loss', note: 'Project creation loses 41.1% of users from the previous step after the navigation update.', impact: 'Regression' },
			{ id: 'activation-invite', stepId: 'invite', title: 'Sample data supports collaboration', note: 'Workspaces with sample data invite 2.3× more teammates during the first week.', impact: 'Opportunity' },
		],
	},
	{
		id: 'checkout',
		name: 'Checkout completion',
		team: 'Revenue',
		updated: 'Today, 09:10',
		freshness: '9 min ago',
		trend: '+2.4 pts',
		steps: [
			{ id: 'checkout-started', label: 'Checkout started', event: 'checkout_started', baseCount: 12640, conversion: 100, median: '0 min', delta: '+4.1%' },
			{ id: 'shipping', label: 'Shipping submitted', event: 'shipping_submitted', baseCount: 10420, conversion: 82.4, median: '2 min', delta: '+2.8%' },
			{ id: 'payment', label: 'Payment submitted', event: 'payment_submitted', baseCount: 9030, conversion: 71.4, median: '5 min', delta: '-1.6%' },
			{ id: 'purchase', label: 'Purchase completed', event: 'purchase_completed', baseCount: 8060, conversion: 63.8, median: '7 min', delta: '+2.4%' },
		],
		insights: [
			{ id: 'checkout-payment', stepId: 'payment', title: 'Payment validation is slowing completion', note: 'Card retries add a median of three minutes before payment submission.', impact: 'Review' },
			{ id: 'checkout-shipping', stepId: 'shipping', title: 'Saved addresses reduce friction', note: 'Returning customers submit shipping details 18% faster than new customers.', impact: 'Opportunity' },
		],
	},
	{
		id: 'trial',
		name: 'Trial to upgrade',
		team: 'Lifecycle',
		updated: 'Yesterday',
		freshness: '28 min ago',
		trend: '-1.2 pts',
		steps: [
			{ id: 'trial-started', label: 'Trial started', event: 'trial_started', baseCount: 9140, conversion: 100, median: '0 min', delta: '+0.7%' },
			{ id: 'feature-used', label: 'Core feature used', event: 'core_feature_used', baseCount: 6130, conversion: 67.1, median: '4 hours', delta: '-2.1%' },
			{ id: 'limit-viewed', label: 'Plan limit viewed', event: 'plan_limit_viewed', baseCount: 2810, conversion: 30.7, median: '5.2 days', delta: '-3.4%' },
			{ id: 'upgraded', label: 'Workspace upgraded', event: 'workspace_upgraded', baseCount: 1680, conversion: 18.4, median: '8.6 days', delta: '-1.2%' },
		],
		insights: [
			{ id: 'trial-feature', stepId: 'feature-used', title: 'Early core usage predicts upgrade', note: 'Trials using the core feature on day one convert 11.8 points above baseline.', impact: 'Opportunity' },
			{ id: 'trial-limit', stepId: 'limit-viewed', title: 'Limit messaging needs attention', note: 'The plan limit view is followed by the largest relative loss in this journey.', impact: 'Regression' },
		],
	},
];

const selectedFunnelId = ref('activation');
const selectedStepId = ref('project');
const selectedDateRange = ref('last-30-days');
const selectedSegment = ref('all-users');
const comparisonSegment = ref('paid-workspaces');
const conversionWindow = ref('7-days');
const attribution = ref('exact-order');
const includeBotTraffic = ref(false);
const activeTab = ref('conversion');
const queryDialogOpen = ref(false);
const saveDialogOpen = ref(false);
const insightDraft = ref('');
const insightVisibility = ref('workspace');
const savedInsights = ref([]);
const actionNotice = ref('');
const exportNotice = ref(false);

const selectedFunnel = computed(getSelectedFunnel);
const selectedDateRangeOption = computed(getSelectedDateRangeOption);
const selectedSegmentOption = computed(getSelectedSegmentOption);
const comparisonSegmentOption = computed(getComparisonSegmentOption);
const selectedWindowOption = computed(getSelectedWindowOption);
const selectedAttributionOption = computed(getSelectedAttributionOption);
const funnelOptions = computed(getFunnelOptions);
const visibleSteps = computed(getVisibleSteps);
const selectedStep = computed(getSelectedStep);
const largestDropoffStep = computed(getLargestDropoffStep);
const finalStep = computed(getFinalStep);
const comparisonConversion = computed(getComparisonConversion);
const comparisonDelta = computed(getComparisonDelta);
const segmentRows = computed(getSegmentRows);
const visibleInsights = computed(getVisibleInsights);
const cohortRows = computed(getCohortRows);
const csvHref = computed(getCsvHref);

watch(selectedFunnelId, onSelectedFunnelChange);
watch(
	[selectedDateRange, selectedSegment, comparisonSegment, conversionWindow, attribution, includeBotTraffic],
	onQueryControlChange,
);

/**
 * Return the active saved funnel definition.
 *
 * @returns {object} Selected funnel definition.
 */
function getSelectedFunnel() {
	return savedFunnels.find((funnel) => funnel.id === selectedFunnelId.value) || savedFunnels[0];
}

/**
 * Return metadata for the selected date range.
 *
 * @returns {object} Selected date range option.
 */
function getSelectedDateRangeOption() {
	return dateRangeOptions.find((option) => option.value === selectedDateRange.value) || dateRangeOptions[1];
}

/**
 * Return metadata for the primary analysis segment.
 *
 * @returns {object} Selected segment option.
 */
function getSelectedSegmentOption() {
	return segmentOptions.find((option) => option.value === selectedSegment.value) || segmentOptions[0];
}

/**
 * Return metadata for the comparison segment.
 *
 * @returns {object} Comparison segment option.
 */
function getComparisonSegmentOption() {
	return segmentOptions.find((option) => option.value === comparisonSegment.value) || segmentOptions[1];
}

/**
 * Return metadata for the selected conversion window.
 *
 * @returns {object} Conversion window option.
 */
function getSelectedWindowOption() {
	return conversionWindowOptions.find((option) => option.value === conversionWindow.value) || conversionWindowOptions[1];
}

/**
 * Return metadata for the selected attribution rule.
 *
 * @returns {object} Attribution option.
 */
function getSelectedAttributionOption() {
	return attributionOptions.find((option) => option.value === attribution.value) || attributionOptions[1];
}

/**
 * Adapt saved funnel records for the rich DOM Studio select.
 *
 * @returns {Array<object>} Select-compatible funnel options.
 */
function getFunnelOptions() {
	return savedFunnels.map((funnel) => ({
		...funnel,
		value: funnel.id,
		label: funnel.name,
		description: `${funnel.team} · Updated ${funnel.updated}`,
		conversion: funnel.steps[funnel.steps.length - 1].conversion,
	}));
}

/**
 * Calculate the visible funnel result from the selected mock query controls.
 *
 * @returns {Array<object>} Query-adjusted funnel steps.
 */
function getVisibleSteps() {
	const steps = selectedFunnel.value.steps;
	const finalIndex = Math.max(1, steps.length - 1);
	const botScale = includeBotTraffic.value ? 1.025 : 1;
	const firstCount = Math.round(
		steps[0].baseCount
		* selectedDateRangeOption.value.scale
		* selectedSegmentOption.value.share
		* botScale,
	);

	return steps.map((step, index, collection) => {
		const progressThroughFunnel = index / finalIndex;
		const conversion = roundToOne(
			clamp(step.conversion + selectedSegmentOption.value.conversionOffset * progressThroughFunnel, 1, 100),
		);
		const count = index === 0 ? firstCount : Math.round(firstCount * conversion / 100);
		const previousCount = index === 0
			? firstCount
			: Math.round(
				firstCount
				* clamp(
					collection[index - 1].conversion
					+ selectedSegmentOption.value.conversionOffset * ((index - 1) / finalIndex),
					1,
					100,
				)
				/ 100,
			);
		const fromPrevious = index === 0 ? 100 : roundToOne(count / Math.max(1, previousCount) * 100);

		return {
			...step,
			count,
			conversion,
			fromPrevious,
			dropoff: index === 0 ? 0 : roundToOne(100 - fromPrevious),
		};
	});
}

/**
 * Return the query-adjusted selected step.
 *
 * @returns {object} Selected funnel step.
 */
function getSelectedStep() {
	return visibleSteps.value.find((step) => step.id === selectedStepId.value) || visibleSteps.value[0];
}

/**
 * Identify the largest loss between adjacent funnel steps.
 *
 * @returns {object} Funnel step with the largest relative drop-off.
 */
function getLargestDropoffStep() {
	return visibleSteps.value.slice(1).reduce(
		(largest, step) => step.dropoff > largest.dropoff ? step : largest,
		visibleSteps.value[1],
	);
}

/**
 * Return the final step in the active funnel result.
 *
 * @returns {object} Final funnel step.
 */
function getFinalStep() {
	return visibleSteps.value[visibleSteps.value.length - 1];
}

/**
 * Calculate final conversion for the selected comparison segment.
 *
 * @returns {number} Comparison segment conversion rate.
 */
function getComparisonConversion() {
	const baseConversion = selectedFunnel.value.steps[selectedFunnel.value.steps.length - 1].conversion;
	return roundToOne(clamp(baseConversion + comparisonSegmentOption.value.conversionOffset, 1, 100));
}

/**
 * Calculate the difference between primary and comparison conversion.
 *
 * @returns {number} Percentage-point difference.
 */
function getComparisonDelta() {
	return roundToOne(finalStep.value.conversion - comparisonConversion.value);
}

/**
 * Build comparable rows for each available segment.
 *
 * @returns {Array<object>} Segment comparison rows.
 */
function getSegmentRows() {
	const firstStep = selectedFunnel.value.steps[0];
	const lastStep = selectedFunnel.value.steps[selectedFunnel.value.steps.length - 1];

	return segmentOptions.map((segment) => {
		const users = Math.round(
			firstStep.baseCount
			* selectedDateRangeOption.value.scale
			* segment.share
			* (includeBotTraffic.value ? 1.025 : 1),
		);
		const conversion = roundToOne(clamp(lastStep.conversion + segment.conversionOffset, 1, 100));

		return {
			...segment,
			users,
			conversion,
			delta: roundToOne(conversion - lastStep.conversion),
		};
	});
}

/**
 * Combine generated and locally saved insights for the active funnel.
 *
 * @returns {Array<object>} Visible insight records.
 */
function getVisibleInsights() {
	return [
		...savedInsights.value.filter((insight) => insight.funnelId === selectedFunnelId.value),
		...selectedFunnel.value.insights,
	];
}

/**
 * Build useful cohort actions from the current funnel result.
 *
 * @returns {Array<object>} Cohort action rows.
 */
function getCohortRows() {
	const lostAtLargestStep = Math.max(
		0,
		visibleSteps.value[visibleSteps.value.indexOf(largestDropoffStep.value) - 1]?.count - largestDropoffStep.value.count,
	);
	const incomplete = Math.max(0, visibleSteps.value[0].count - finalStep.value.count);

	return [
		{
			id: 'largest-dropoff',
			name: `Dropped before ${largestDropoffStep.value.label}`,
			size: lostAtLargestStep,
			action: 'Create recovery cohort',
		},
		{
			id: 'not-converted',
			name: `Started but did not reach ${finalStep.value.label}`,
			size: incomplete,
			action: 'Create incomplete cohort',
		},
	];
}

/**
 * Build a downloadable CSV data URL for the current funnel result.
 *
 * @returns {string} Encoded CSV data URL.
 */
function getCsvHref() {
	const header = ['Step', 'Event', 'Users', 'Overall conversion', 'From previous', 'Drop-off', 'Median time'];
	const rows = visibleSteps.value.map((step) => [
		step.label,
		step.event,
		step.count,
		`${step.conversion}%`,
		`${step.fromPrevious}%`,
		`${step.dropoff}%`,
		step.median,
	]);
	const csv = [header, ...rows]
		.map((row) => row.map(escapeCsvCell).join(','))
		.join('\n');
	return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

/**
 * Reset step selection and transient feedback when another funnel is chosen.
 *
 * @returns {void}
 */
function onSelectedFunnelChange() {
	const steps = selectedFunnel.value.steps;
	selectedStepId.value = steps[Math.min(2, steps.length - 1)].id;
	activeTab.value = 'conversion';
	actionNotice.value = '';
	exportNotice.value = false;
}

/**
 * Clear stale feedback when any query control changes.
 *
 * @returns {void}
 */
function onQueryControlChange() {
	actionNotice.value = '';
	exportNotice.value = false;
}

/**
 * Select one funnel step for detailed analysis.
 *
 * @param {object} step Funnel step.
 * @returns {void}
 */
function selectStep(step) {
	selectedStepId.value = step.id;
}

/**
 * Open the query settings dialog.
 *
 * @returns {void}
 */
function openQuerySettings() {
	queryDialogOpen.value = true;
}

/**
 * Confirm query settings and describe the updated mock query.
 *
 * @returns {void}
 */
function applyQuerySettings() {
	queryDialogOpen.value = false;
	actionNotice.value = `Query updated: ${selectedWindowOption.value.label}, ${selectedAttributionOption.value.label.toLowerCase()}, bot traffic ${includeBotTraffic.value ? 'included' : 'excluded'}.`;
}

/**
 * Restore the default working query.
 *
 * @returns {void}
 */
function resetQuery() {
	selectedDateRange.value = 'last-30-days';
	selectedSegment.value = 'all-users';
	comparisonSegment.value = 'paid-workspaces';
	conversionWindow.value = '7-days';
	attribution.value = 'exact-order';
	includeBotTraffic.value = false;
	actionNotice.value = 'Default funnel query restored.';
}

/**
 * Prepare an editable note for the selected funnel step.
 *
 * @returns {void}
 */
function openSaveDialog() {
	insightDraft.value = `${selectedStep.value.label} loses ${selectedStep.value.dropoff}% from the previous step. Investigate this step with the ${selectedSegmentOption.value.label.toLowerCase()} segment.`;
	insightVisibility.value = 'workspace';
	saveDialogOpen.value = true;
}

/**
 * Persist a local insight example and expose it in the follow-up tab.
 *
 * @returns {void}
 */
function saveInsight() {
	const note = insightDraft.value.trim();
	if (!note) return;
	savedInsights.value.unshift({
		id: `saved-${Date.now()}`,
		funnelId: selectedFunnelId.value,
		stepId: selectedStepId.value,
		title: `Saved note: ${selectedStep.value.label}`,
		note,
		impact: 'Saved',
	});
	saveDialogOpen.value = false;
	activeTab.value = 'follow-up';
	actionNotice.value = `Insight saved to ${getVisibilityLabel(insightVisibility.value)}.`;
}

/**
 * Record that a cohort action was prepared from the current result.
 *
 * @param {object} cohort Cohort definition.
 * @returns {void}
 */
function createCohort(cohort) {
	activeTab.value = 'follow-up';
	actionNotice.value = `${cohort.name} is ready for a server-side cohort creation request.`;
}

/**
 * Confirm that the CSV export was requested.
 *
 * @returns {void}
 */
function onExport() {
	exportNotice.value = true;
}

/**
 * Return the label for a saved insight visibility value.
 *
 * @param {string} value Visibility value.
 * @returns {string} Human-readable visibility label.
 */
function getVisibilityLabel(value) {
	return visibilityOptions.find((option) => option.value === value)?.label || 'Workspace';
}

/**
 * Return a semantic tone for an insight impact.
 *
 * @param {string} impact Insight impact label.
 * @returns {string} DOM Studio status tone.
 */
function getImpactTone(impact) {
	if (impact === 'Regression') return 'danger';
	if (impact === 'Opportunity') return 'success';
	if (impact === 'Saved') return 'primary';
	return 'warning';
}

/**
 * Return a semantic tone for a percentage-point delta.
 *
 * @param {number} delta Percentage-point difference.
 * @returns {string} DOM Studio status tone.
 */
function getDeltaTone(delta) {
	if (delta > 0) return 'success';
	if (delta < 0) return 'danger';
	return 'neutral';
}

/**
 * Format a signed percentage-point value.
 *
 * @param {number} value Percentage-point value.
 * @returns {string} Signed human-readable value.
 */
function formatDelta(value) {
	if (value > 0) return `+${value} pts`;
	if (value < 0) return `${value} pts`;
	return 'Baseline';
}

/**
 * Format a compact signed delta for narrow summary cells.
 *
 * @param {number} value Percentage-point value.
 * @returns {string} Compact signed value.
 */
function formatShortDelta(value) {
	if (value > 0) return `+${value}`;
	return String(value);
}

/**
 * Round a number to one decimal place.
 *
 * @param {number} value Raw number.
 * @returns {number} Rounded number.
 */
function roundToOne(value) {
	return Math.round(value * 10) / 10;
}

/**
 * Clamp a number inside an inclusive range.
 *
 * @param {number} value Raw number.
 * @param {number} minimum Minimum allowed value.
 * @param {number} maximum Maximum allowed value.
 * @returns {number} Clamped number.
 */
function clamp(value, minimum, maximum) {
	return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Escape one CSV value for safe download.
 *
 * @param {unknown} value Raw CSV value.
 * @returns {string} Quoted CSV cell.
 */
function escapeCsvCell(value) {
	return `"${String(value ?? '').replaceAll('"', '""')}"`;
}
</script>

<template>
	<section class="min-h-dvh bg-canvas text-canvas-fg">
		<header class="border-b border-border bg-canvas">
			<div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
				<div class="max-w-3xl">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Product analytics</p>
					<h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Find the step blocking conversion</h1>
					<p class="mt-2 text-sm leading-6 text-muted-fg">
						Build a trustworthy funnel query, compare one audience, and turn the largest loss into a follow-up action.
					</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<DomButton variant="secondary" @click="openQuerySettings">Query settings</DomButton>
					<DomButton @click="openSaveDialog">Save insight</DomButton>
				</div>
			</div>
		</header>

		<main class="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5">
			<DomAlert
				v-if="actionNotice"
				tone="success"
				title="Analysis updated"
				:description="actionNotice"
				dismissible
				@dismiss="actionNotice = ''"
			/>
			<DomAlert
				v-if="exportNotice"
				tone="success"
				title="Funnel CSV downloaded"
				description="The export contains the steps and query-adjusted values currently visible in this example."
				dismissible
				@dismiss="exportNotice = false"
			/>

			<DomCard padding="p-4 sm:p-5">
				<div class="grid gap-4 lg:grid-cols-[minmax(18rem,1.25fr)_repeat(3,minmax(10rem,0.75fr))]">
					<DomSelect
						v-model="selectedFunnelId"
						label="Saved funnel"
						:options="funnelOptions"
						width="min-w-[22rem]"
					>
						<template #value="{ option }">
							<span class="flex min-w-0 items-center justify-between gap-3">
								<span class="min-w-0">
									<span class="block truncate font-medium">{{ option?.label }}</span>
									<span class="mt-0.5 block truncate text-xs text-muted-fg">{{ option?.team }} · {{ option?.updated }}</span>
								</span>
								<DomStatusPill :tone="getDeltaTone(Number(option?.trend?.replace(/[^\d.-]/g, '')))" :label="option?.trend" size="sm" />
							</span>
						</template>
						<template #option="{ option, selected }">
							<span class="block min-w-0">
								<span class="flex items-start justify-between gap-3">
									<span class="min-w-0">
										<span class="block truncate font-medium">{{ option.label }}</span>
										<span class="mt-1 block text-xs text-muted-fg">{{ option.description }}</span>
									</span>
									<DomBadge tone="neutral" size="sm">{{ option.conversion }}%</DomBadge>
								</span>
								<DomBadge v-if="selected" class="mt-2" tone="success" size="sm">Selected</DomBadge>
							</span>
						</template>
					</DomSelect>

					<DomSelect
						v-model="selectedDateRange"
						class="hidden lg:block"
						label="Date range"
						:options="dateRangeOptions"
						width="min-w-[17rem]"
					/>
					<DomSelect
						v-model="selectedSegment"
						class="hidden lg:block"
						label="Segment"
						:options="segmentOptions"
						width="min-w-[19rem]"
					/>
					<DomSelect
						v-model="comparisonSegment"
						class="hidden lg:block"
						label="Compare with"
						:options="segmentOptions"
						width="min-w-[19rem]"
					/>
				</div>

				<div class="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex flex-wrap gap-2">
						<DomStatusPill tone="success" :label="`Fresh ${selectedFunnel.freshness}`" size="sm" />
						<DomBadge tone="neutral" size="sm">{{ selectedDateRangeOption.label }}</DomBadge>
						<DomBadge tone="neutral" size="sm">{{ selectedSegmentOption.label }}</DomBadge>
						<DomBadge tone="neutral" size="sm">vs {{ comparisonSegmentOption.label }}</DomBadge>
					</div>
					<div class="flex flex-wrap gap-2">
						<DomButton class="lg:hidden" size="sm" variant="secondary" @click="openQuerySettings">Edit query</DomButton>
						<DomButton size="sm" variant="ghost" @click="resetQuery">Reset</DomButton>
					</div>
				</div>
			</DomCard>

			<section class="grid grid-cols-4 gap-px overflow-hidden rounded-xl border border-border bg-border" aria-label="Funnel summary">
				<div class="min-w-0 bg-canvas p-3 sm:p-4">
					<p class="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-fg sm:text-xs sm:tracking-[0.12em]">Started</p>
					<p class="mt-2 truncate text-base font-semibold sm:text-xl">{{ visibleSteps[0].count.toLocaleString() }}</p>
				</div>
				<div class="min-w-0 bg-canvas p-3 sm:p-4">
					<p class="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-fg sm:text-xs sm:tracking-[0.12em]">Completed</p>
					<p class="mt-2 truncate text-base font-semibold sm:text-xl">{{ finalStep.count.toLocaleString() }}</p>
				</div>
				<div class="min-w-0 bg-canvas p-3 sm:p-4">
					<p class="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-fg sm:text-xs sm:tracking-[0.12em]">Conversion</p>
					<p class="mt-2 truncate text-base font-semibold sm:text-xl">{{ finalStep.conversion }}%</p>
				</div>
				<div class="min-w-0 bg-canvas p-3 sm:p-4">
					<p class="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-fg sm:text-xs sm:tracking-[0.12em]">Vs compare (pts)</p>
					<div class="mt-2">
						<DomStatusPill :tone="getDeltaTone(comparisonDelta)" :label="formatShortDelta(comparisonDelta)" size="sm" />
					</div>
				</div>
			</section>

			<DomTabs v-model="activeTab" :tabs="analysisTabs">
				<template #conversion>
					<div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
						<DomCard padding="p-0">
							<div class="border-b border-border p-4 sm:p-5">
								<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
									<div>
										<h2 class="font-semibold">Conversion path</h2>
										<p class="mt-1 text-sm leading-6 text-muted-fg">
											Each row shows overall conversion and the loss from its previous step.
										</p>
									</div>
									<DomStatusPill
										tone="warning"
										:label="`${largestDropoffStep.dropoff}% largest loss`"
										size="sm"
									/>
								</div>
							</div>

							<div class="divide-y divide-border">
								<button
									v-for="(step, index) in visibleSteps"
									:key="step.id"
									type="button"
									class="grid w-full gap-3 border-l-2 px-4 py-4 text-left transition hover:bg-secondary/60 sm:grid-cols-[minmax(0,1fr)_7rem_7rem] sm:items-center sm:px-5"
									:class="selectedStepId === step.id ? 'border-l-primary bg-primary/5' : 'border-l-transparent'"
									:aria-pressed="selectedStepId === step.id"
									@click="selectStep(step)"
								>
									<span class="min-w-0">
										<span class="flex flex-wrap items-center gap-2">
											<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Step {{ index + 1 }}</span>
											<DomStatusPill
												v-if="index > 0"
												:tone="step.id === largestDropoffStep.id ? 'warning' : 'neutral'"
												:label="`${step.fromPrevious}% from previous`"
												size="sm"
											/>
										</span>
										<span class="mt-2 block font-medium">{{ step.label }}</span>
										<span class="mt-1 block truncate text-xs text-muted-fg">{{ step.event }}</span>
										<DomProgress
											class="mt-3"
											:value="step.conversion"
											:label="`${step.label} overall conversion`"
											:tone="step.id === largestDropoffStep.id ? 'warning' : 'primary'"
											size="sm"
											:show-label="false"
										/>
									</span>
									<span>
										<span class="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Users</span>
										<strong class="mt-1 block text-lg">{{ step.count.toLocaleString() }}</strong>
									</span>
									<span>
										<span class="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Overall</span>
										<strong class="mt-1 block text-lg">{{ step.conversion }}%</strong>
									</span>
								</button>
							</div>
						</DomCard>

						<DomCard padding="p-4 sm:p-5">
							<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Selected step</p>
							<h2 class="mt-2 text-lg font-semibold">{{ selectedStep.label }}</h2>
							<p class="mt-1 text-sm text-muted-fg">{{ selectedStep.event }}</p>

							<DomAlert
								v-if="selectedStep.id === largestDropoffStep.id"
								class="mt-4"
								tone="warning"
								title="Largest relative loss"
								:description="`${selectedStep.dropoff}% of users from the previous step do not reach this event.`"
							/>

							<dl class="mt-4 divide-y divide-border border-y border-border text-sm">
								<div class="flex items-center justify-between gap-4 py-3">
									<dt class="text-muted-fg">Users reached</dt>
									<dd class="font-semibold">{{ selectedStep.count.toLocaleString() }}</dd>
								</div>
								<div class="flex items-center justify-between gap-4 py-3">
									<dt class="text-muted-fg">From previous</dt>
									<dd class="font-semibold">{{ selectedStep.fromPrevious }}%</dd>
								</div>
								<div class="flex items-center justify-between gap-4 py-3">
									<dt class="text-muted-fg">Median time</dt>
									<dd class="font-semibold">{{ selectedStep.median }}</dd>
								</div>
								<div class="flex items-center justify-between gap-4 py-3">
									<dt class="text-muted-fg">Trend</dt>
									<dd>
										<DomStatusPill
											:tone="getDeltaTone(Number(selectedStep.delta.replace(/[^\d.-]/g, '')))"
											:label="selectedStep.delta"
											size="sm"
										/>
									</dd>
								</div>
							</dl>

							<div class="mt-4 grid gap-2">
								<DomButton variant="secondary" @click="openSaveDialog">Save step insight</DomButton>
								<DomButton
									variant="secondary"
									@click="createCohort({
										name: `Dropped before ${selectedStep.label}`,
										size: Math.max(0, visibleSteps[0].count - selectedStep.count),
									})"
								>
									Prepare cohort
								</DomButton>
							</div>
						</DomCard>
					</div>
				</template>

				<template #segments>
					<DomCard padding="p-0">
						<div class="border-b border-border p-4 sm:p-5">
							<h2 class="font-semibold">Segment comparison</h2>
							<p class="mt-1 text-sm leading-6 text-muted-fg">
								Compare the same funnel definition across eligible audiences without changing the event sequence.
							</p>
						</div>
						<div class="divide-y divide-border">
							<div
								v-for="segment in segmentRows"
								:key="segment.value"
								class="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_8rem_8rem] sm:items-center sm:px-5"
							>
								<div class="min-w-0">
									<div class="flex flex-wrap items-center gap-2">
										<p class="font-medium">{{ segment.label }}</p>
										<DomStatusPill v-if="segment.value === selectedSegment" tone="primary" label="Primary" size="sm" />
										<DomStatusPill v-if="segment.value === comparisonSegment" tone="info" label="Comparison" size="sm" />
									</div>
									<p class="mt-1 text-sm text-muted-fg">{{ segment.description }}</p>
									<DomProgress
										class="mt-3"
										:value="segment.conversion"
										:label="`${segment.label} conversion`"
										:tone="segment.value === selectedSegment ? 'primary' : 'neutral'"
										size="sm"
										:show-label="false"
									/>
								</div>
								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Started</p>
									<p class="mt-1 font-semibold">{{ segment.users.toLocaleString() }}</p>
								</div>
								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Converted</p>
									<div class="mt-1 flex flex-wrap items-center gap-2">
										<strong>{{ segment.conversion }}%</strong>
										<DomStatusPill :tone="getDeltaTone(segment.delta)" :label="formatDelta(segment.delta)" size="sm" />
									</div>
								</div>
							</div>
						</div>
					</DomCard>
				</template>

				<template #follow-up>
					<div class="grid gap-5 lg:grid-cols-2">
						<DomCard padding="p-4 sm:p-5">
							<div class="flex items-start justify-between gap-3">
								<div>
									<h2 class="font-semibold">Insights</h2>
									<p class="mt-1 text-sm leading-6 text-muted-fg">Generated findings and notes saved from this funnel.</p>
								</div>
								<DomBadge tone="neutral" size="sm">{{ visibleInsights.length }}</DomBadge>
							</div>
							<div class="mt-4 divide-y divide-border border-y border-border">
								<article v-for="insight in visibleInsights" :key="insight.id" class="py-4">
									<div class="flex flex-wrap items-center justify-between gap-2">
										<h3 class="font-medium">{{ insight.title }}</h3>
										<DomStatusPill :tone="getImpactTone(insight.impact)" :label="insight.impact" size="sm" />
									</div>
									<p class="mt-2 text-sm leading-6 text-muted-fg">{{ insight.note }}</p>
								</article>
							</div>
							<DomButton class="mt-4" variant="secondary" @click="openSaveDialog">Add insight</DomButton>
						</DomCard>

						<DomCard padding="p-4 sm:p-5">
							<h2 class="font-semibold">Cohort actions</h2>
							<p class="mt-1 text-sm leading-6 text-muted-fg">
								Prepare a server-owned cohort from the current query and result counts.
							</p>
							<div class="mt-4 divide-y divide-border border-y border-border">
								<div v-for="cohort in cohortRows" :key="cohort.id" class="py-4">
									<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										<div>
											<p class="font-medium">{{ cohort.name }}</p>
											<p class="mt-1 text-sm text-muted-fg">{{ cohort.size.toLocaleString() }} users</p>
										</div>
										<DomButton size="sm" variant="secondary" @click="createCohort(cohort)">{{ cohort.action }}</DomButton>
									</div>
								</div>
							</div>
						</DomCard>
					</div>
				</template>
			</DomTabs>

			<div class="flex flex-col gap-3 border-t border-border pt-5 text-sm text-muted-fg sm:flex-row sm:items-center sm:justify-between">
				<p>
					{{ selectedAttributionOption.label }} · {{ selectedWindowOption.label }} conversion window · Bot traffic {{ includeBotTraffic ? 'included' : 'excluded' }}
				</p>
				<DomButton
					as="a"
					:href="csvHref"
					:download="`${selectedFunnel.id}-funnel.csv`"
					size="sm"
					variant="secondary"
					@click="onExport"
				>
					Download CSV
				</DomButton>
			</div>
		</main>

		<DomDialog
			v-model="queryDialogOpen"
			title="Query settings"
			description="Change the audience, time range, attribution rule, and conversion window for this local example."
			size="lg"
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<DomSelect
					v-model="selectedDateRange"
					label="Date range"
					description="Controls the mock result volume."
					:options="dateRangeOptions"
					width="min-w-[19rem]"
				/>
				<DomSelect
					v-model="selectedSegment"
					label="Primary segment"
					description="The audience shown in the conversion path."
					:options="segmentOptions"
					width="min-w-[20rem]"
				/>
				<DomSelect
					v-model="comparisonSegment"
					label="Compare with"
					description="Used for the percentage-point comparison."
					:options="segmentOptions"
					width="min-w-[20rem]"
				/>
				<DomSelect
					v-model="conversionWindow"
					label="Conversion window"
					description="Maximum time allowed between first and final events."
					:options="conversionWindowOptions"
					width="min-w-[20rem]"
				/>
				<DomSelect
					v-model="attribution"
					class="sm:col-span-2"
					label="Attribution"
					description="Defines how event order qualifies a conversion."
					:options="attributionOptions"
					width="min-w-[22rem]"
				/>
				<div class="rounded-xl border border-border p-4 sm:col-span-2">
					<DomToggle
						v-model="includeBotTraffic"
						label="Include identified bot traffic"
						description="Keep this disabled for normal product-behaviour analysis."
					/>
				</div>
			</div>
			<template #footer>
				<DomButton data-close variant="secondary">Cancel</DomButton>
				<DomButton @click="applyQuerySettings">Apply settings</DomButton>
			</template>
		</DomDialog>

		<DomDialog
			v-model="saveDialogOpen"
			title="Save funnel insight"
			:description="`Capture why ${selectedStep.label} matters before the team changes the query.`"
			size="lg"
		>
			<div class="grid gap-4">
				<DomTextareaInput
					v-model="insightDraft"
					label="Insight note"
					description="State the evidence and the next investigation."
					:rows="5"
				/>
				<DomSelect
					v-model="insightVisibility"
					label="Visibility"
					:options="visibilityOptions"
					width="min-w-[20rem]"
				/>
				<DomAlert
					tone="neutral"
					title="Integration boundary"
					description="Save the funnel definition, query controls, selected step, author, and note through your analytics insight API."
					:icon="false"
				/>
			</div>
			<template #footer>
				<DomButton data-close variant="secondary">Cancel</DomButton>
				<DomButton :disabled="!insightDraft.trim()" @click="saveInsight">Save insight</DomButton>
			</template>
		</DomDialog>
	</section>
</template>
