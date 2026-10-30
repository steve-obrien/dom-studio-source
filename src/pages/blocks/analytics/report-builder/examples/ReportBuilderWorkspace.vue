<script setup>
import { computed, ref, watch } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCard,
	DomCheckbox,
	DomDialog,
	DomEmailInput,
	DomEmptyState,
	DomProgress,
	DomSelect,
	DomStatusPill,
	DomTabs,
	DomTextInput,
} from '@getdom/studio/vue';

const activeSection = ref('build');
const previewMode = ref('chart');
const selectedReportId = ref('growth');
const reportName = ref('Revenue growth');
const dataset = ref('subscriptions');
const dateRange = ref('last_30_days');
const selectedBreakdown = ref('plan');
const visibility = ref('team');
const cadence = ref('monday_9am');
const exportFormat = ref('csv');
const timezone = ref('europe_london');
const includeNotes = ref(true);
const recipientInput = ref('');
const recipients = ref(['finance@getdom.studio', 'success@getdom.studio']);
const selectedMetrics = ref(['revenue', 'active_accounts', 'expansion_mrr']);
const previewGenerated = ref(false);
const previewGeneratedAt = ref('Not generated for these changes');
const previewSampleRows = ref(0);
const draftSaved = ref(false);
const published = ref(false);
const actionNotice = ref('');
const exportNotice = ref(false);
const queryDialogOpen = ref(false);
const publishDialogOpen = ref(false);
const activitySequence = ref(4);

const sectionTabs = [
	{ key: 'build', label: 'Build' },
	{ key: 'delivery', label: 'Delivery' },
	{ key: 'activity', label: 'Activity' },
];

const previewModeOptions = [
	{ value: 'chart', label: 'Chart', description: 'Compare grouped values visually.' },
	{ value: 'table', label: 'Table', description: 'Inspect the exact grouped values.' },
];

const savedReports = [
	{
		id: 'growth',
		name: 'Revenue growth',
		owner: 'Finance',
		updated: '8 min ago',
		status: 'Ready',
		description: 'Subscription performance by plan.',
	},
	{
		id: 'activation',
		name: 'Activation funnel',
		owner: 'Product',
		updated: 'Yesterday',
		status: 'Draft',
		description: 'Account activation by acquisition source.',
	},
	{
		id: 'retention',
		name: 'Retention by cohort',
		owner: 'Success',
		updated: 'Mon 14:20',
		status: 'Scheduled',
		description: 'Logo retention by signup month.',
	},
];

const reportOptions = savedReports.map((report) => ({
	value: report.id,
	label: report.name,
	description: report.description,
	owner: report.owner,
	updated: report.updated,
	status: report.status,
}));

const datasetOptions = [
	{
		value: 'subscriptions',
		label: 'Subscriptions',
		description: 'Invoices, plans, recurring revenue, and lifecycle state.',
		freshness: 'Updated 4 min ago',
	},
	{
		value: 'accounts',
		label: 'Accounts',
		description: 'Customer ownership, plan, segment, and health attributes.',
		freshness: 'Updated 8 min ago',
	},
	{
		value: 'product_events',
		label: 'Product events',
		description: 'Approved behavioral events from the product warehouse.',
		freshness: 'Updated 12 min ago',
	},
	{
		value: 'support_cases',
		label: 'Support cases',
		description: 'Case volume, response time, topics, and satisfaction.',
		freshness: 'Updated 21 min ago',
	},
];

const dateRangeOptions = [
	{ value: 'last_7_days', label: 'Last 7 days', description: 'A short operational view.' },
	{ value: 'last_30_days', label: 'Last 30 days', description: 'A stable month-over-month view.' },
	{ value: 'quarter_to_date', label: 'Quarter to date', description: 'From the current fiscal quarter start.' },
	{ value: 'custom', label: 'Custom range', description: 'Choose explicit start and end dates in your app.' },
];

const breakdownOptions = [
	{ value: 'plan', label: 'Plan', description: 'Compare Enterprise, Growth, and Starter.' },
	{ value: 'region', label: 'Region', description: 'Group by the account billing region.' },
	{ value: 'lifecycle_stage', label: 'Lifecycle stage', description: 'Group active, onboarding, and at-risk accounts.' },
	{ value: 'owner', label: 'Owner', description: 'Group by the responsible account owner.' },
];

const visibilityOptions = [
	{ value: 'private', label: 'Private', description: 'Only you can open or edit the report.' },
	{ value: 'team', label: 'Team', description: 'Finance and Success teammates can open it.' },
	{ value: 'workspace', label: 'Workspace', description: 'Everyone with analytics access can open it.' },
];

const cadenceOptions = [
	{ value: 'manual', label: 'Manual only', description: 'No scheduled delivery.' },
	{ value: 'monday_9am', label: 'Every Monday at 09:00', description: 'Send a weekly operating snapshot.' },
	{ value: 'first_of_month', label: 'First of each month', description: 'Send the completed prior-month report.' },
];

const exportFormatOptions = [
	{ value: 'csv', label: 'CSV', description: 'Raw rows for analysis and spreadsheet workflows.' },
	{ value: 'xlsx', label: 'XLSX', description: 'Formatted workbook with summary and data sheets.' },
	{ value: 'pdf', label: 'PDF', description: 'Read-only report for wider distribution.' },
];

const timezoneOptions = [
	{ value: 'europe_london', label: 'Europe/London', description: 'GMT or BST depending on the delivery date.' },
	{ value: 'america_new_york', label: 'America/New York', description: 'Eastern Time with daylight saving.' },
	{ value: 'utc', label: 'UTC', description: 'A stable shared reference for global teams.' },
];

const metricCatalog = [
	{
		value: 'revenue',
		label: 'Revenue',
		description: 'Recognized revenue in the selected period.',
		trend: '+12.4%',
		amount: '$84.2k',
		tone: 'success',
	},
	{
		value: 'active_accounts',
		label: 'Active accounts',
		description: 'Accounts with qualifying activity.',
		trend: '+8.1%',
		amount: '1,284',
		tone: 'success',
	},
	{
		value: 'expansion_mrr',
		label: 'Expansion MRR',
		description: 'Net monthly expansion from existing customers.',
		trend: '+18.7%',
		amount: '$12.8k',
		tone: 'success',
	},
	{
		value: 'churned_mrr',
		label: 'Churned MRR',
		description: 'Recurring revenue lost in the period.',
		trend: '-3.2%',
		amount: '$4.1k',
		tone: 'warning',
	},
];

const previewRows = [
	{ segment: 'Enterprise', revenue: '$42.8k', accounts: 84, retention: '119%', bar: 92 },
	{ segment: 'Growth', revenue: '$27.6k', accounts: 318, retention: '108%', bar: 68 },
	{ segment: 'Starter', revenue: '$13.8k', accounts: 882, retention: '94%', bar: 42 },
];

const activity = ref([
	{
		id: 1,
		label: 'Report opened',
		detail: 'Revenue growth is ready for a fresh preview.',
		time: 'Just now',
		tone: 'info',
	},
	{
		id: 2,
		label: 'Recipient added',
		detail: 'finance@getdom.studio receives the Monday export.',
		time: '18 min ago',
		tone: 'success',
	},
	{
		id: 3,
		label: 'Metric changed',
		detail: 'Expansion MRR was added by Maya.',
		time: 'Today 09:14',
		tone: 'neutral',
	},
]);

const selectedReport = computed(getSelectedReport);
const selectedDatasetOption = computed(getSelectedDatasetOption);
const selectedDateRangeOption = computed(getSelectedDateRangeOption);
const selectedBreakdownOption = computed(getSelectedBreakdownOption);
const selectedMetricDetails = computed(getSelectedMetricDetails);
const readinessScore = computed(getReadinessScore);
const readinessTone = computed(getReadinessTone);
const readinessLabel = computed(getReadinessLabel);
const currentStatusTone = computed(getCurrentStatusTone);
const currentStatusLabel = computed(getCurrentStatusLabel);
const scheduleSummary = computed(getScheduleSummary);
const querySignature = computed(getQuerySignature);
const csvHref = computed(getCsvHref);

watch(selectedReportId, syncSelectedReport);
watch(querySignature, markPreviewStale);

/**
 * Resolve the full saved-report record for the active report identifier.
 *
 * @returns {{ id: string, name: string, owner: string, updated: string, status: string, description: string }} Active report record.
 */
function getSelectedReport() {
	return savedReports.find((report) => report.id === selectedReportId.value) || savedReports[0];
}

/**
 * Resolve the active dataset option for summaries and rich selected-value content.
 *
 * @returns {{ value: string, label: string, description: string, freshness: string }} Active dataset option.
 */
function getSelectedDatasetOption() {
	return datasetOptions.find((option) => option.value === dataset.value) || datasetOptions[0];
}

/**
 * Resolve the active date-range option.
 *
 * @returns {{ value: string, label: string, description: string }} Active range option.
 */
function getSelectedDateRangeOption() {
	return dateRangeOptions.find((option) => option.value === dateRange.value) || dateRangeOptions[0];
}

/**
 * Resolve the active breakdown option.
 *
 * @returns {{ value: string, label: string, description: string }} Active breakdown option.
 */
function getSelectedBreakdownOption() {
	return breakdownOptions.find((option) => option.value === selectedBreakdown.value) || breakdownOptions[0];
}

/**
 * Filter the metric catalog to the metrics currently included in the report.
 *
 * @returns {Array<{ value: string, label: string, description: string, trend: string, amount: string, tone: string }>} Active metric definitions.
 */
function getSelectedMetricDetails() {
	return metricCatalog.filter((metric) => selectedMetrics.value.includes(metric.value));
}

/**
 * Calculate publish readiness from report identity, query, delivery, and preview state.
 *
 * @returns {number} Readiness percentage from zero to one hundred.
 */
function getReadinessScore() {
	let score = 0;
	if (reportName.value.trim()) score += 15;
	if (dataset.value) score += 10;
	if (dateRange.value) score += 10;
	if (selectedMetrics.value.length) score += 25;
	if (selectedBreakdown.value) score += 10;
	if (recipients.value.length) score += 10;
	if (cadence.value !== 'manual') score += 10;
	if (previewGenerated.value) score += 10;
	return score;
}

/**
 * Return the semantic progress tone for the current readiness score.
 *
 * @returns {'success'|'warning'|'primary'} Progress tone.
 */
function getReadinessTone() {
	if (readinessScore.value === 100) return 'success';
	if (readinessScore.value < 70) return 'warning';
	return 'primary';
}

/**
 * Summarize the most important remaining readiness requirement.
 *
 * @returns {string} Human-readable readiness guidance.
 */
function getReadinessLabel() {
	if (!reportName.value.trim()) return 'Add a report name';
	if (!selectedMetrics.value.length) return 'Choose at least one metric';
	if (!recipients.value.length) return 'Add a delivery recipient';
	if (cadence.value === 'manual') return 'Choose a delivery schedule';
	if (!previewGenerated.value) return 'Run a fresh preview';
	return 'Ready to publish';
}

/**
 * Resolve the semantic status tone for unsaved, previewed, and published states.
 *
 * @returns {'success'|'warning'|'neutral'} Status-pill tone.
 */
function getCurrentStatusTone() {
	if (published.value) return 'success';
	if (previewGenerated.value) return 'success';
	if (draftSaved.value) return 'neutral';
	return 'warning';
}

/**
 * Resolve the visible workflow status for the current report definition.
 *
 * @returns {string} Current workflow label.
 */
function getCurrentStatusLabel() {
	if (published.value) return 'Published';
	if (previewGenerated.value) return 'Preview ready';
	if (draftSaved.value) return 'Draft saved';
	return 'Changes not previewed';
}

/**
 * Describe the configured delivery cadence and export format.
 *
 * @returns {string} Delivery summary.
 */
function getScheduleSummary() {
	const selectedCadence = cadenceOptions.find((option) => option.value === cadence.value);
	const selectedFormat = exportFormatOptions.find((option) => option.value === exportFormat.value);
	if (cadence.value === 'manual') return `Manual ${selectedFormat?.label || 'export'}`;
	return `${selectedCadence?.label || 'Scheduled'} · ${selectedFormat?.label || 'export'}`;
}

/**
 * Serialize query-affecting controls so preview freshness can be invalidated after changes.
 *
 * @returns {string} Stable query signature for Vue's watcher.
 */
function getQuerySignature() {
	return JSON.stringify({
		report: selectedReportId.value,
		name: reportName.value,
		dataset: dataset.value,
		dateRange: dateRange.value,
		breakdown: selectedBreakdown.value,
		metrics: selectedMetrics.value,
	});
}

/**
 * Build a downloadable CSV data URL for the currently visible preview rows.
 *
 * @returns {string} Encoded CSV data URL.
 */
function getCsvHref() {
	const header = 'Segment,Revenue,Accounts,Retention';
	const rows = previewRows.map((row) => [row.segment, row.revenue, row.accounts, row.retention].join(','));
	return `data:text/csv;charset=utf-8,${encodeURIComponent([header, ...rows].join('\n'))}`;
}

/**
 * Determine whether a metric is included in the report definition.
 *
 * @param {string} metricValue Metric identifier.
 * @returns {boolean} Whether the metric is selected.
 */
function isMetricSelected(metricValue) {
	return selectedMetrics.value.includes(metricValue);
}

/**
 * Add or remove a metric in response to a DOM Studio checkbox change.
 *
 * @param {string} metricValue Metric identifier.
 * @param {boolean} checked Whether the metric should be included.
 * @returns {void}
 */
function toggleMetric(metricValue, checked) {
	if (checked && !selectedMetrics.value.includes(metricValue)) {
		selectedMetrics.value = [...selectedMetrics.value, metricValue];
		return;
	}
	if (!checked) {
		selectedMetrics.value = selectedMetrics.value.filter((value) => value !== metricValue);
	}
}

/**
 * Sync the editable title when the user switches to another saved report.
 *
 * @returns {void}
 */
function syncSelectedReport() {
	reportName.value = selectedReport.value.name;
	published.value = false;
	draftSaved.value = false;
	actionNotice.value = '';
}

/**
 * Mark the current preview stale after a query-affecting field changes.
 *
 * @returns {void}
 */
function markPreviewStale() {
	previewGenerated.value = false;
	previewGeneratedAt.value = 'Not generated for these changes';
	previewSampleRows.value = 0;
	published.value = false;
	draftSaved.value = false;
}

/**
 * Generate a local preview result and expose a clear completion state.
 *
 * @returns {void}
 */
function runPreview() {
	if (!selectedMetrics.value.length) {
		actionNotice.value = 'Choose at least one metric before generating a preview.';
		return;
	}
	previewGenerated.value = true;
	previewGeneratedAt.value = 'Generated just now';
	previewSampleRows.value = 791 + (selectedMetrics.value.length * 17);
	actionNotice.value = `Preview generated from ${selectedDatasetOption.value.label} with ${selectedMetrics.value.length} metrics.`;
	recordActivity(
		'Preview generated',
		`${previewSampleRows.value.toLocaleString()} rows sampled from ${selectedDatasetOption.value.label.toLowerCase()}.`,
		'success',
	);
}

/**
 * Persist the local example as a draft and record the visible result.
 *
 * @returns {void}
 */
function saveDraft() {
	draftSaved.value = true;
	actionNotice.value = `${reportName.value || 'Untitled report'} saved as a draft.`;
	recordActivity('Draft saved', 'The current query and delivery settings were saved locally.', 'neutral');
}

/**
 * Open the publish confirmation after verifying that the preview is current.
 *
 * @returns {void}
 */
function openPublishDialog() {
	if (!previewGenerated.value) {
		actionNotice.value = 'Run a fresh preview before publishing this report.';
		return;
	}
	publishDialogOpen.value = true;
}

/**
 * Confirm publication, close the dialog, and record the resulting state.
 *
 * @returns {void}
 */
function publishReport() {
	published.value = true;
	draftSaved.value = true;
	publishDialogOpen.value = false;
	actionNotice.value = `${reportName.value} is published to ${visibility.value}.`;
	recordActivity('Report published', `${scheduleSummary.value} is now active for ${recipients.value.length} recipients.`, 'success');
}

/**
 * Add a unique email recipient to scheduled delivery.
 *
 * @returns {void}
 */
function addRecipient() {
	const nextRecipient = recipientInput.value.trim().toLowerCase();
	if (!nextRecipient || recipients.value.includes(nextRecipient)) return;
	recipients.value = [...recipients.value, nextRecipient];
	recipientInput.value = '';
	actionNotice.value = `${nextRecipient} added to scheduled delivery.`;
	recordActivity('Recipient added', `${nextRecipient} can receive the ${exportFormat.value.toUpperCase()} export.`, 'info');
}

/**
 * Remove an email recipient from scheduled delivery.
 *
 * @param {string} recipient Email address to remove.
 * @returns {void}
 */
function removeRecipient(recipient) {
	recipients.value = recipients.value.filter((item) => item !== recipient);
	actionNotice.value = `${recipient} removed from scheduled delivery.`;
	recordActivity('Recipient removed', `${recipient} will no longer receive this report.`, 'warning');
}

/**
 * Append a newest-first activity record for a meaningful report action.
 *
 * @param {string} label Short activity label.
 * @param {string} detail Supporting activity detail.
 * @param {'success'|'warning'|'neutral'|'info'} tone Semantic event tone.
 * @returns {void}
 */
function recordActivity(label, detail, tone) {
	activity.value = [
		{
			id: activitySequence.value,
			label,
			detail,
			time: 'Just now',
			tone,
		},
		...activity.value,
	];
	activitySequence.value += 1;
}

/**
 * Show a durable success message when the local CSV export is downloaded.
 *
 * @returns {void}
 */
function onExport() {
	exportNotice.value = true;
	recordActivity('CSV downloaded', 'The current preview rows were exported for offline analysis.', 'info');
}
</script>

<template>
	<section class="min-h-dvh bg-canvas text-canvas-fg">
		<header class="border-b border-border bg-canvas">
			<div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
				<div class="max-w-3xl">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Analytics</p>
					<h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Build a report people can reuse</h1>
					<p class="mt-2 text-sm leading-6 text-muted-fg">
						Choose governed metrics, verify a representative preview, then schedule the same definition for your team.
					</p>
				</div>
				<div class="grid grid-cols-2 gap-2 sm:flex">
					<DomButton variant="secondary" @click="saveDraft">Save draft</DomButton>
					<DomButton :disabled="!previewGenerated" @click="openPublishDialog">Publish report</DomButton>
				</div>
			</div>
		</header>

		<main class="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5">
			<DomAlert
				v-if="actionNotice"
				:tone="previewGenerated || draftSaved || published ? 'success' : 'warning'"
				title="Report updated"
				:description="actionNotice"
				dismissible
				@dismiss="actionNotice = ''"
			/>
			<DomAlert
				v-if="exportNotice"
				tone="success"
				title="Report CSV downloaded"
				description="The export contains the segments and values currently visible in the preview."
				dismissible
				@dismiss="exportNotice = false"
			/>

			<DomCard padding="p-4 sm:p-5">
				<div class="hidden gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-5">
					<DomSelect
						v-model="selectedReportId"
						label="Saved report"
						:options="reportOptions"
						width="min-w-[22rem]"
					>
						<template #value="{ option }">
							<span class="flex min-w-0 items-center justify-between gap-3">
								<span class="min-w-0">
									<span class="block truncate font-medium">{{ option?.label }}</span>
									<span class="mt-0.5 block truncate text-xs text-muted-fg">{{ option?.owner }} · {{ option?.updated }}</span>
								</span>
								<DomBadge size="sm" tone="neutral">{{ option?.status }}</DomBadge>
							</span>
						</template>
						<template #option="{ option, selected }">
							<span class="block min-w-0">
								<span class="flex items-start justify-between gap-3">
									<span class="min-w-0">
										<span class="block truncate font-medium">{{ option.label }}</span>
										<span class="mt-1 block text-xs text-muted-fg">{{ option.description }}</span>
									</span>
									<DomBadge :tone="selected ? 'success' : 'neutral'" size="sm">{{ selected ? 'Selected' : option.status }}</DomBadge>
								</span>
								<span class="mt-2 block text-xs text-muted-fg">{{ option.owner }} · {{ option.updated }}</span>
							</span>
						</template>
					</DomSelect>
					<DomTextInput
						v-model="reportName"
						label="Report name"
						description="Used in saved reports and delivery."
					/>
					<DomSelect
						v-model="dataset"
						label="Dataset"
						:options="datasetOptions"
						width="min-w-[22rem]"
					>
						<template #option="{ option, selected }">
							<span class="block">
								<span class="flex items-center justify-between gap-3">
									<span class="font-medium">{{ option.label }}</span>
									<DomBadge v-if="selected" tone="success" size="sm">Selected</DomBadge>
								</span>
								<span class="mt-1 block text-xs text-muted-fg">{{ option.description }}</span>
								<span class="mt-2 block text-xs font-medium text-muted-fg">{{ option.freshness }}</span>
							</span>
						</template>
					</DomSelect>
					<DomSelect
						v-model="dateRange"
						label="Date range"
						:options="dateRangeOptions"
						width="min-w-[18rem]"
					/>
					<DomSelect
						v-model="selectedBreakdown"
						label="Breakdown"
						:options="breakdownOptions"
						width="min-w-[20rem]"
					/>
				</div>

				<div class="grid gap-4 lg:hidden">
					<DomSelect
						v-model="selectedReportId"
						label="Saved report"
						:options="reportOptions"
						width="min-w-[20rem]"
					>
						<template #value="{ option }">
							<span class="flex min-w-0 items-center justify-between gap-3">
								<span class="min-w-0">
									<span class="block truncate font-medium">{{ option?.label }}</span>
									<span class="mt-0.5 block truncate text-xs text-muted-fg">{{ option?.owner }} · {{ option?.updated }}</span>
								</span>
								<DomBadge size="sm" tone="neutral">{{ option?.status }}</DomBadge>
							</span>
						</template>
						<template #option="{ option, selected }">
							<span class="block">
								<span class="flex items-center justify-between gap-3">
									<span class="font-medium">{{ option.label }}</span>
									<DomBadge :tone="selected ? 'success' : 'neutral'" size="sm">{{ selected ? 'Selected' : option.status }}</DomBadge>
								</span>
								<span class="mt-1 block text-xs text-muted-fg">{{ option.description }}</span>
							</span>
						</template>
					</DomSelect>
					<div class="flex flex-wrap items-center gap-2">
						<DomBadge tone="neutral" size="sm">{{ selectedDatasetOption.label }}</DomBadge>
						<DomBadge tone="neutral" size="sm">{{ selectedDateRangeOption.label }}</DomBadge>
						<DomBadge tone="neutral" size="sm">By {{ selectedBreakdownOption.label }}</DomBadge>
						<DomButton size="sm" variant="secondary" @click="queryDialogOpen = true">Edit setup</DomButton>
					</div>
				</div>

				<div class="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex flex-wrap items-center gap-2">
						<DomStatusPill :tone="currentStatusTone" :label="currentStatusLabel" size="sm" />
						<DomBadge tone="neutral" size="sm">{{ selectedMetricDetails.length }} metrics</DomBadge>
						<DomBadge tone="neutral" size="sm">{{ previewGeneratedAt }}</DomBadge>
					</div>
					<DomButton :disabled="!selectedMetrics.length" @click="runPreview">Run preview</DomButton>
				</div>
			</DomCard>

			<DomTabs v-model="activeSection" :tabs="sectionTabs">
				<template #build>
					<div class="grid gap-4 xl:grid-cols-[19rem_minmax(0,1fr)]">
						<DomCard class="order-2 xl:order-1" padding="p-4 sm:p-5">
							<div class="flex items-start justify-between gap-3">
								<div>
									<h2 class="text-base font-semibold">Metrics</h2>
									<p class="mt-1 text-sm text-muted-fg">Choose the measures included in this report.</p>
								</div>
								<DomBadge tone="neutral" size="sm">{{ selectedMetricDetails.length }} selected</DomBadge>
							</div>
							<div class="mt-4 divide-y divide-border">
								<div
									v-for="metric in metricCatalog"
									:key="metric.value"
									class="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
								>
									<DomCheckbox
										:model-value="isMetricSelected(metric.value)"
										:label="metric.label"
										:description="metric.description"
										@update:model-value="toggleMetric(metric.value, $event)"
									/>
									<div class="shrink-0 text-right">
										<p class="text-sm font-semibold">{{ metric.amount }}</p>
										<DomBadge class="mt-1" :tone="metric.tone" size="sm">{{ metric.trend }}</DomBadge>
									</div>
								</div>
							</div>
						</DomCard>

						<DomCard class="order-1 xl:order-2" padding="p-4 sm:p-5">
							<div class="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<div class="flex flex-wrap items-center gap-2">
										<h2 class="text-base font-semibold">Preview</h2>
										<DomStatusPill
											:tone="previewGenerated ? 'success' : 'warning'"
											:label="previewGenerated ? 'Fresh' : 'Needs refresh'"
											size="sm"
										/>
									</div>
									<p class="mt-2 text-sm leading-6 text-muted-fg">
										{{ selectedDatasetOption.label }} · {{ selectedDateRangeOption.label }} · grouped by {{ selectedBreakdownOption.label }}
									</p>
								</div>
								<div class="flex flex-wrap items-end gap-2">
									<DomSelect
										v-model="previewMode"
										label="Preview format"
										chrome="none"
										:options="previewModeOptions"
										width="min-w-[12rem]"
									/>
									<DomButton
										v-if="previewGenerated"
										as="a"
										:href="csvHref"
										:download="`${selectedReport.id}-preview.csv`"
										size="sm"
										variant="secondary"
										@click="onExport"
									>
										Download CSV
									</DomButton>
									<DomButton size="sm" @click="runPreview">{{ previewGenerated ? 'Refresh preview' : 'Run preview' }}</DomButton>
								</div>
							</div>

							<div v-if="selectedMetricDetails.length" class="grid grid-cols-3 gap-px overflow-hidden border-b border-border bg-border">
								<div
									v-for="metric in selectedMetricDetails.slice(0, 3)"
									:key="metric.value"
									class="min-w-0 bg-canvas py-4 pr-3 sm:p-4"
								>
									<p class="truncate text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-fg sm:text-xs">{{ metric.label }}</p>
									<p class="mt-2 truncate text-lg font-semibold tracking-tight sm:text-2xl">{{ metric.amount }}</p>
									<p class="mt-1 text-xs font-medium" :class="metric.tone === 'warning' ? 'text-warning-fg' : 'text-success'">{{ metric.trend }}</p>
								</div>
							</div>

							<DomEmptyState
								v-if="!selectedMetricDetails.length"
								class="mt-4"
								title="Choose a metric to preview"
								description="Select at least one approved metric before running this report."
								size="sm"
							>
								<template #actions>
									<DomButton size="sm" variant="secondary" @click="toggleMetric('revenue', true)">Add Revenue</DomButton>
								</template>
							</DomEmptyState>

							<div v-else-if="previewMode === 'chart'" class="mt-5 space-y-4" aria-label="Revenue by plan chart">
								<div
									v-for="row in previewRows"
									:key="row.segment"
									class="grid grid-cols-[minmax(5.5rem,8rem)_minmax(4rem,1fr)_auto] items-center gap-3"
								>
									<span class="truncate text-sm font-medium">{{ row.segment }}</span>
									<span class="h-3 overflow-hidden rounded-full bg-secondary">
										<span class="block h-full rounded-full bg-primary" :style="{ width: `${row.bar}%` }"></span>
									</span>
									<span class="text-right text-sm font-semibold">{{ row.revenue }}</span>
								</div>
							</div>

							<div v-else class="mt-5">
								<div class="hidden overflow-x-auto sm:block">
									<table class="min-w-full text-left text-sm">
										<thead class="border-b border-border text-xs uppercase tracking-[0.12em] text-muted-fg">
											<tr>
												<th class="py-2 pr-4 font-semibold">Plan</th>
												<th class="py-2 pr-4 text-right font-semibold">Revenue</th>
												<th class="py-2 pr-4 text-right font-semibold">Accounts</th>
												<th class="py-2 text-right font-semibold">Retention</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-border">
											<tr v-for="row in previewRows" :key="row.segment">
												<td class="py-3 pr-4 font-medium">{{ row.segment }}</td>
												<td class="py-3 pr-4 text-right">{{ row.revenue }}</td>
												<td class="py-3 pr-4 text-right">{{ row.accounts }}</td>
												<td class="py-3 text-right">{{ row.retention }}</td>
											</tr>
										</tbody>
									</table>
								</div>
								<div class="divide-y divide-border sm:hidden">
									<div v-for="row in previewRows" :key="row.segment" class="grid grid-cols-3 gap-3 py-3 first:pt-0 last:pb-0">
										<div class="col-span-3 flex items-center justify-between gap-3">
											<span class="font-medium">{{ row.segment }}</span>
											<strong>{{ row.revenue }}</strong>
										</div>
										<div>
											<p class="text-xs text-muted-fg">Accounts</p>
											<p class="mt-1 text-sm font-medium">{{ row.accounts }}</p>
										</div>
										<div>
											<p class="text-xs text-muted-fg">Retention</p>
											<p class="mt-1 text-sm font-medium">{{ row.retention }}</p>
										</div>
									</div>
								</div>
							</div>

							<div class="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-sm text-muted-fg sm:flex-row sm:items-center sm:justify-between">
								<p>{{ previewGenerated ? `${previewSampleRows.toLocaleString()} sampled rows` : 'Run a preview to validate these changes.' }}</p>
								<p class="font-medium text-canvas-fg">{{ previewGeneratedAt }}</p>
							</div>
						</DomCard>
					</div>
				</template>

				<template #delivery>
					<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]">
						<DomCard padding="p-4 sm:p-5">
							<div>
								<h2 class="text-base font-semibold">Share and schedule</h2>
								<p class="mt-1 text-sm leading-6 text-muted-fg">Keep access, recipients, timing, and file format attached to the saved report definition.</p>
							</div>

							<div class="mt-5 grid gap-4 sm:grid-cols-2">
								<DomSelect
									v-model="visibility"
									label="Visibility"
									:options="visibilityOptions"
									width="min-w-[20rem]"
								/>
								<DomSelect
									v-model="cadence"
									label="Cadence"
									:options="cadenceOptions"
									width="min-w-[22rem]"
								/>
								<DomSelect
									v-model="exportFormat"
									label="Export format"
									:options="exportFormatOptions"
									width="min-w-[22rem]"
								/>
								<DomSelect
									v-model="timezone"
									label="Timezone"
									:options="timezoneOptions"
									width="min-w-[22rem]"
								/>
							</div>

							<div class="mt-5 border-t border-border pt-5">
								<h3 class="text-sm font-semibold">Recipients</h3>
								<form class="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]" @submit.prevent="addRecipient">
									<DomEmailInput
										v-model="recipientInput"
										label="Recipient email"
										placeholder="person@example.com"
									/>
									<DomButton class="self-end" type="submit" variant="secondary">Add recipient</DomButton>
								</form>
								<div class="mt-3 flex flex-wrap gap-2">
									<DomButton
										v-for="recipient in recipients"
										:key="recipient"
										size="sm"
										variant="secondary"
										:aria-label="`Remove ${recipient}`"
										@click="removeRecipient(recipient)"
									>
										{{ recipient }} ×
									</DomButton>
								</div>
								<DomCheckbox
									v-model="includeNotes"
									class="mt-5"
									label="Include report notes"
									description="Add the saved insight summary to scheduled exports."
								/>
							</div>
						</DomCard>

						<DomCard padding="p-4 sm:p-5">
							<div class="flex items-start justify-between gap-3">
								<div>
									<h2 class="text-base font-semibold">Publish readiness</h2>
									<p class="mt-1 text-sm text-muted-fg">{{ readinessLabel }}</p>
								</div>
								<DomStatusPill :tone="readinessScore === 100 ? 'success' : 'warning'" :label="`${readinessScore}%`" size="sm" />
							</div>
							<DomProgress
								class="mt-5"
								:value="readinessScore"
								:tone="readinessTone"
								label="Report readiness"
								:show-label="false"
							/>
							<dl class="mt-5 divide-y divide-border text-sm">
								<div class="flex items-start justify-between gap-4 py-3 first:pt-0">
									<dt class="text-muted-fg">Query</dt>
									<dd class="text-right font-medium">{{ selectedMetricDetails.length }} metrics · {{ selectedBreakdownOption.label }}</dd>
								</div>
								<div class="flex items-start justify-between gap-4 py-3">
									<dt class="text-muted-fg">Preview</dt>
									<dd class="text-right font-medium">{{ previewGenerated ? 'Fresh' : 'Required' }}</dd>
								</div>
								<div class="flex items-start justify-between gap-4 py-3">
									<dt class="text-muted-fg">Delivery</dt>
									<dd class="max-w-52 text-right font-medium">{{ scheduleSummary }}</dd>
								</div>
								<div class="flex items-start justify-between gap-4 py-3 last:pb-0">
									<dt class="text-muted-fg">Recipients</dt>
									<dd class="text-right font-medium">{{ recipients.length }}</dd>
								</div>
							</dl>
							<DomButton class="mt-5 w-full" :disabled="readinessScore !== 100" @click="openPublishDialog">
								Publish report
							</DomButton>
						</DomCard>
					</div>
				</template>

				<template #activity>
					<DomCard padding="p-4 sm:p-5">
						<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<h2 class="text-base font-semibold">Report activity</h2>
								<p class="mt-1 text-sm leading-6 text-muted-fg">Recent definition, delivery, preview, and publishing changes for this report.</p>
							</div>
							<DomBadge tone="neutral">{{ activity.length }} events</DomBadge>
						</div>
						<div class="mt-5 divide-y divide-border">
							<article
								v-for="event in activity"
								:key="event.id"
								class="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start sm:gap-4"
							>
								<DomStatusPill :tone="event.tone" :label="event.label" size="sm" />
								<div>
									<h3 class="text-sm font-semibold">{{ event.label }}</h3>
									<p class="mt-1 text-sm leading-6 text-muted-fg">{{ event.detail }}</p>
								</div>
								<time class="text-xs font-medium text-muted-fg">{{ event.time }}</time>
							</article>
						</div>
					</DomCard>
				</template>
			</DomTabs>
		</main>

		<DomDialog
			v-model="queryDialogOpen"
			title="Report setup"
			description="Change the report identity, governed dataset, date range, and grouping for this example."
			size="lg"
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<DomTextInput
					v-model="reportName"
					class="sm:col-span-2"
					label="Report name"
					description="Used in saved reports and scheduled delivery."
				/>
				<DomSelect
					v-model="dataset"
					label="Dataset"
					:options="datasetOptions"
					width="min-w-[22rem]"
				>
					<template #option="{ option, selected }">
						<span class="block">
							<span class="flex items-center justify-between gap-3">
								<span class="font-medium">{{ option.label }}</span>
								<DomBadge v-if="selected" tone="success" size="sm">Selected</DomBadge>
							</span>
							<span class="mt-1 block text-xs text-muted-fg">{{ option.description }}</span>
							<span class="mt-2 block text-xs font-medium text-muted-fg">{{ option.freshness }}</span>
						</span>
					</template>
				</DomSelect>
				<DomSelect
					v-model="dateRange"
					label="Date range"
					:options="dateRangeOptions"
					width="min-w-[19rem]"
				/>
				<DomSelect
					v-model="selectedBreakdown"
					class="sm:col-span-2"
					label="Breakdown"
					:options="breakdownOptions"
					width="min-w-[22rem]"
				/>
			</div>
			<template #footer>
				<DomButton data-close variant="secondary">Close</DomButton>
				<DomButton data-close @click="runPreview">Apply and preview</DomButton>
			</template>
		</DomDialog>

		<DomDialog
			v-model="publishDialogOpen"
			title="Publish this report?"
			:description="`${reportName} will be available to ${visibility} and delivered using the saved schedule.`"
			size="md"
		>
			<div class="space-y-4">
				<DomProgress
					:value="readinessScore"
					:tone="readinessTone"
					label="Publish readiness"
					show-value
				/>
				<DomAlert
					tone="neutral"
					title="Integration boundary"
					description="In production, persist the report definition, create the delivery subscription, and emit an audit event through your reporting API."
					:icon="false"
				/>
			</div>
			<template #footer>
				<DomButton data-close variant="secondary">Cancel</DomButton>
				<DomButton :disabled="readinessScore !== 100" @click="publishReport">Confirm publish</DomButton>
			</template>
		</DomDialog>
	</section>
</template>
