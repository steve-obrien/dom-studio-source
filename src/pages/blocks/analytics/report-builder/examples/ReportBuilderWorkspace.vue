<script setup>
import { computed, ref } from 'vue';
import { DomButton } from '@getdom/studio/vue';

const selectedReportId = ref('growth');
const dataset = ref('Subscriptions');
const dateRange = ref('Last 30 days');
const chartType = ref('Bar');
const visibility = ref('Team');
const cadence = ref('Every Monday');
const exportFormat = ref('CSV');
const includeNotes = ref(true);
const recipientInput = ref('');
const recipients = ref(['finance@getdom.studio', 'success@getdom.studio']);
const selectedMetrics = ref(['Revenue', 'Active accounts', 'Expansion MRR']);
const selectedBreakdown = ref('Plan');
const selectedRows = ref(['Enterprise', 'Growth', 'Starter']);

const savedReports = [
	{ id: 'growth', name: 'Revenue growth', owner: 'Finance', updated: '8 min ago', status: 'Ready' },
	{ id: 'activation', name: 'Activation funnel', owner: 'Product', updated: 'Yesterday', status: 'Draft' },
	{ id: 'retention', name: 'Retention by cohort', owner: 'Success', updated: 'Mon 14:20', status: 'Scheduled' },
];

const datasets = ['Subscriptions', 'Accounts', 'Product events', 'Support cases'];
const dateRanges = ['Last 7 days', 'Last 30 days', 'Quarter to date', 'Custom'];
const chartTypes = ['Bar', 'Line', 'Table'];
const visibilityOptions = ['Private', 'Team', 'Workspace'];
const cadences = ['Manual', 'Every Monday', 'First of month'];
const exportFormats = ['CSV', 'XLSX', 'PDF'];
const breakdowns = ['Plan', 'Region', 'Lifecycle stage', 'Owner'];

const metricCatalog = [
	{ label: 'Revenue', description: 'Recognized revenue for the selected period.', trend: '+12.4%', value: '$84.2k' },
	{ label: 'Active accounts', description: 'Accounts with qualifying activity.', trend: '+8.1%', value: '1,284' },
	{ label: 'Expansion MRR', description: 'Net monthly expansion from existing customers.', trend: '+18.7%', value: '$12.8k' },
	{ label: 'Churned MRR', description: 'Recurring revenue lost in the period.', trend: '-3.2%', value: '$4.1k' },
];

const previewRows = [
	{ segment: 'Enterprise', revenue: '$42.8k', accounts: 84, retention: '119%', bar: 92 },
	{ segment: 'Growth', revenue: '$27.6k', accounts: 318, retention: '108%', bar: 68 },
	{ segment: 'Starter', revenue: '$13.8k', accounts: 882, retention: '94%', bar: 42 },
];

const activity = [
	{ label: 'Preview generated', detail: '842 rows sampled from subscriptions.', time: '2 min ago' },
	{ label: 'Recipient added', detail: 'finance@getdom.studio added to Monday export.', time: '18 min ago' },
	{ label: 'Metric changed', detail: 'Expansion MRR added by Maya.', time: 'Today 09:14' },
];

const selectedReport = computed(() => savedReports.find((report) => report.id === selectedReportId.value) || savedReports[0]);
const selectedMetricDetails = computed(() => metricCatalog.filter((metric) => selectedMetrics.value.includes(metric.label)));
const readinessScore = computed(() => {
	let score = 40;
	if (selectedMetrics.value.length) score += 20;
	if (selectedBreakdown.value) score += 10;
	if (recipients.value.length && cadence.value !== 'Manual') score += 15;
	if (selectedRows.value.length) score += 10;
	if (includeNotes.value) score += 5;
	return Math.min(score, 100);
});
const activePreviewRows = computed(() => previewRows.filter((row) => selectedRows.value.includes(row.segment)));
const scheduleSummary = computed(() => cadence.value === 'Manual' ? 'Manual export only' : `${cadence.value} as ${exportFormat.value}`);

function toggleMetric(metric) {
	selectedMetrics.value = selectedMetrics.value.includes(metric)
		? selectedMetrics.value.filter((item) => item !== metric)
		: [...selectedMetrics.value, metric];
}

function toggleRow(segment) {
	selectedRows.value = selectedRows.value.includes(segment)
		? selectedRows.value.filter((item) => item !== segment)
		: [...selectedRows.value, segment];
}

function addRecipient() {
	const nextRecipient = recipientInput.value.trim();
	if (!nextRecipient || recipients.value.includes(nextRecipient)) return;
	recipients.value = [...recipients.value, nextRecipient];
	recipientInput.value = '';
}

function removeRecipient(recipient) {
	recipients.value = recipients.value.filter((item) => item !== recipient);
}
</script>

<template>
	<section class="min-h-screen bg-canvas text-canvas-fg">
		<div class="mx-auto flex w-full max-w-7xl flex-col border-x border-border bg-canvas shadow-2xl shadow-black/10">
			<header class="border-b border-border px-4 py-4 sm:px-6">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div class="min-w-0">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Analytics</p>
						<h1 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Report builder</h1>
						<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">Build reusable reports from approved metrics, preview the output, and schedule delivery without sending users into raw SQL.</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<DomButton variant="secondary">Save draft</DomButton>
						<DomButton>Publish report</DomButton>
					</div>
				</div>
			</header>

			<div class="grid min-h-[44rem] lg:grid-cols-[17rem_minmax(0,1fr)_21rem]">
				<aside class="border-b border-border skin-card lg:border-b-0 lg:border-r">
					<div class="border-b border-border px-4 py-4">
						<div class="flex items-center justify-between gap-3">
							<h2 class="text-sm font-semibold">Saved reports</h2>
							<span class="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-muted-fg">{{ savedReports.length }}</span>
						</div>
					</div>
					<nav class="grid gap-1 p-2">
						<button
							v-for="report in savedReports"
							:key="report.id"
							type="button"
							class="rounded-lg px-3 py-3 text-left transition hover:bg-secondary"
							:class="selectedReportId === report.id ? 'bg-secondary text-secondary-fg' : 'text-muted-fg'"
							@click="selectedReportId = report.id"
						>
							<span class="flex items-start justify-between gap-3">
								<span class="min-w-0">
									<span class="block truncate text-sm font-semibold text-canvas-fg">{{ report.name }}</span>
									<span class="mt-1 block text-xs">{{ report.owner }} / {{ report.updated }}</span>
								</span>
								<span class="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-muted-fg">{{ report.status }}</span>
							</span>
						</button>
					</nav>
				</aside>

				<main class="min-w-0">
					<div class="border-b border-border px-4 py-4 sm:px-6">
						<div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
							<div class="min-w-0">
								<p class="text-sm font-semibold">{{ selectedReport.name }}</p>
								<p class="mt-1 text-sm leading-6 text-muted-fg">Owner: {{ selectedReport.owner }} / Last changed {{ selectedReport.updated }}</p>
							</div>
							<div class="grid gap-3 sm:grid-cols-3">
								<label class="block">
									<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Dataset</span>
									<select v-model="dataset" class="mt-1 block w-full rounded-lg border border-input bg-canvas px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
										<option v-for="item in datasets" :key="item">{{ item }}</option>
									</select>
								</label>
								<label class="block">
									<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Range</span>
									<select v-model="dateRange" class="mt-1 block w-full rounded-lg border border-input bg-canvas px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
										<option v-for="item in dateRanges" :key="item">{{ item }}</option>
									</select>
								</label>
								<label class="block">
									<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Breakdown</span>
									<select v-model="selectedBreakdown" class="mt-1 block w-full rounded-lg border border-input bg-canvas px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
										<option v-for="item in breakdowns" :key="item">{{ item }}</option>
									</select>
								</label>
							</div>
						</div>
					</div>

					<div class="grid gap-0 xl:grid-cols-[18rem_minmax(0,1fr)]">
						<section class="border-b border-border p-4 sm:p-6 xl:border-b-0 xl:border-r">
							<div class="flex items-center justify-between gap-3">
								<h2 class="text-sm font-semibold">Metrics</h2>
								<span class="text-xs font-medium text-muted-fg">{{ selectedMetrics.length }} selected</span>
							</div>
							<div class="mt-4 grid gap-2">
								<button
									v-for="metric in metricCatalog"
									:key="metric.label"
									type="button"
									class="rounded-lg border px-3 py-3 text-left transition hover:border-ring"
									:class="selectedMetrics.includes(metric.label) ? 'border-primary bg-primary/10' : 'border-border bg-canvas'"
									@click="toggleMetric(metric.label)"
								>
									<span class="flex items-start justify-between gap-3">
										<span>
											<span class="block text-sm font-semibold">{{ metric.label }}</span>
											<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ metric.description }}</span>
										</span>
										<span class="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-fg">{{ metric.trend }}</span>
									</span>
								</button>
							</div>
						</section>

						<section class="min-w-0 p-4 sm:p-6">
							<div class="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
								<div>
									<h2 class="text-sm font-semibold">Preview</h2>
									<p class="mt-1 text-sm text-muted-fg">{{ dataset }} / {{ dateRange }} / grouped by {{ selectedBreakdown }}</p>
								</div>
								<div class="inline-grid grid-cols-3 rounded-lg border border-border p-1">
									<button
										v-for="type in chartTypes"
										:key="type"
										type="button"
										class="rounded-md px-3 py-1.5 text-xs font-semibold transition"
										:class="chartType === type ? 'bg-primary text-primary-fg' : 'text-muted-fg hover:bg-secondary hover:text-canvas-fg'"
										@click="chartType = type"
									>
										{{ type }}
									</button>
								</div>
							</div>

							<div class="grid gap-3 border-b border-border py-4 sm:grid-cols-3">
								<div v-for="metric in selectedMetricDetails" :key="metric.label" class="min-w-0">
									<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">{{ metric.label }}</p>
									<p class="mt-1 text-2xl font-semibold tracking-tight">{{ metric.value }}</p>
									<p class="mt-1 text-xs font-medium text-emerald-600">{{ metric.trend }}</p>
								</div>
							</div>

							<div class="overflow-hidden">
								<div v-if="chartType !== 'Table'" class="space-y-3 py-5">
									<button
										v-for="row in previewRows"
										:key="row.segment"
										type="button"
										class="grid w-full grid-cols-[6.5rem_1fr_4rem] items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-secondary"
										:class="selectedRows.includes(row.segment) ? 'text-canvas-fg' : 'text-muted-fg opacity-60'"
										@click="toggleRow(row.segment)"
									>
										<span class="truncate text-sm font-medium">{{ row.segment }}</span>
										<span class="h-3 overflow-hidden rounded-full bg-secondary">
											<span class="block h-full rounded-full bg-primary transition-all" :style="{ width: `${selectedRows.includes(row.segment) ? row.bar : 8}%` }"></span>
										</span>
										<span class="text-right text-sm font-semibold">{{ row.revenue }}</span>
									</button>
								</div>

								<div v-else class="overflow-x-auto py-4">
									<table class="min-w-full text-left text-sm">
										<thead class="border-b border-border text-xs uppercase tracking-[0.12em] text-muted-fg">
											<tr>
												<th class="py-2 pr-4 font-semibold">Segment</th>
												<th class="py-2 pr-4 font-semibold">Revenue</th>
												<th class="py-2 pr-4 font-semibold">Accounts</th>
												<th class="py-2 font-semibold">Retention</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-border">
											<tr v-for="row in activePreviewRows" :key="row.segment">
												<td class="py-3 pr-4 font-medium">{{ row.segment }}</td>
												<td class="py-3 pr-4">{{ row.revenue }}</td>
												<td class="py-3 pr-4">{{ row.accounts }}</td>
												<td class="py-3">{{ row.retention }}</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</section>
					</div>
				</main>

				<aside class="border-t border-border skin-card lg:border-l lg:border-t-0">
					<section class="border-b border-border p-4">
						<div class="flex items-center justify-between gap-3">
							<h2 class="text-sm font-semibold">Readiness</h2>
							<span class="text-sm font-semibold">{{ readinessScore }}%</span>
						</div>
						<div class="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
							<div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${readinessScore}%` }"></div>
						</div>
						<div class="mt-4 grid gap-2 text-sm">
							<p class="flex items-center justify-between gap-3"><span class="text-muted-fg">Metrics selected</span><strong>{{ selectedMetrics.length }}</strong></p>
							<p class="flex items-center justify-between gap-3"><span class="text-muted-fg">Preview rows</span><strong>{{ activePreviewRows.length }}</strong></p>
							<p class="flex items-center justify-between gap-3"><span class="text-muted-fg">Delivery</span><strong>{{ scheduleSummary }}</strong></p>
						</div>
					</section>

					<section class="border-b border-border p-4">
						<h2 class="text-sm font-semibold">Sharing</h2>
						<div class="mt-4 grid gap-3">
							<label class="block">
								<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Visibility</span>
								<select v-model="visibility" class="mt-1 block w-full rounded-lg border border-input bg-canvas px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
									<option v-for="item in visibilityOptions" :key="item">{{ item }}</option>
								</select>
							</label>
							<form class="flex gap-2" @submit.prevent="addRecipient">
								<label class="min-w-0 flex-1">
									<span class="sr-only">Recipient email</span>
									<input v-model="recipientInput" type="email" class="block w-full rounded-lg border border-input bg-canvas px-3 py-2 text-sm outline-none placeholder:text-muted-fg focus:border-ring focus:ring-2 focus:ring-ring/20" placeholder="person@example.com" />
								</label>
								<DomButton type="submit" variant="secondary">Add</DomButton>
							</form>
							<div class="flex flex-wrap gap-2">
								<button v-for="recipient in recipients" :key="recipient" type="button" class="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-fg" @click="removeRecipient(recipient)">
									{{ recipient }} x
								</button>
							</div>
						</div>
					</section>

					<section class="border-b border-border p-4">
						<h2 class="text-sm font-semibold">Schedule</h2>
						<div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
							<label class="block">
								<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Cadence</span>
								<select v-model="cadence" class="mt-1 block w-full rounded-lg border border-input bg-canvas px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
									<option v-for="item in cadences" :key="item">{{ item }}</option>
								</select>
							</label>
							<label class="block">
								<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Format</span>
								<select v-model="exportFormat" class="mt-1 block w-full rounded-lg border border-input bg-canvas px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
									<option v-for="item in exportFormats" :key="item">{{ item }}</option>
								</select>
							</label>
						</div>
						<label class="mt-4 flex items-center justify-between gap-3 rounded-lg bg-secondary px-3 py-2 text-sm">
							<span>Include report notes</span>
							<input v-model="includeNotes" type="checkbox" class="size-4 accent-current" />
						</label>
					</section>

					<section class="p-4">
						<h2 class="text-sm font-semibold">Activity</h2>
						<div class="mt-4 grid gap-3">
							<div v-for="event in activity" :key="event.label" class="border-l border-border pl-3">
								<p class="text-sm font-medium">{{ event.label }}</p>
								<p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p>
								<p class="mt-1 text-xs font-medium text-muted-fg">{{ event.time }}</p>
							</div>
						</div>
					</section>
				</aside>
			</div>
		</div>
	</section>
</template>
