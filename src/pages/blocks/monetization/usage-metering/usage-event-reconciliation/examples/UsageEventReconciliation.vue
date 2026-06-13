<script setup>
import { computed, ref } from 'vue';
import {
	DomBadge,
	DomButton,
	DomDataGrid,
	DomDialog,
	DomListbox,
	DomStatusPill,
	DomTagCombobox,
	DomToggleButtonGroup,
} from '@getdom/studio/vue';

const periodOptions = [
	{ label: 'June 2026', value: '2026-06', description: 'Open invoice preview', amount: 'GBP 38.4k' },
	{ label: 'May 2026', value: '2026-05', description: 'Finalized with adjustments', amount: 'GBP 41.1k' },
	{ label: 'April 2026', value: '2026-04', description: 'Closed archive', amount: 'GBP 36.7k' },
];

const productOptions = [
	{ label: 'AI seats', value: 'AI seats', description: 'Per-seat and agent minute meters', group: 'Core' },
	{ label: 'API calls', value: 'API calls', description: 'Platform request metering', group: 'Developer' },
	{ label: 'Storage', value: 'Storage', description: 'GB-month and retention add-ons', group: 'Infrastructure' },
	{ label: 'Workflow runs', value: 'Workflow runs', description: 'Automation execution meters', group: 'Automation' },
];

const viewOptions = [
	{ label: 'Needs review', value: 'review' },
	{ label: 'Invoice hold', value: 'hold' },
	{ label: 'All events', value: 'all' },
];

const usageEvents = [
	{ id: 'use_2048', customer: 'Northstar Analytics', plan: 'Enterprise', product: 'AI seats', meter: 'agent_minutes', period: '2026-06', quantity: 18420, expected: 17140, delta: 1280, invoiceImpact: 331.56, status: 'needs-review', severity: 'warning', source: 'events-api', invoiceHold: true, reviewer: 'Maya Chen', receivedAt: '2026-06-12', reason: 'Backfill exceeded contract cap' },
	{ id: 'use_2049', customer: 'Atlas Finance', plan: 'Scale', product: 'API calls', meter: 'requests', period: '2026-06', quantity: 928000, expected: 928000, delta: 0, invoiceImpact: 742.40, status: 'rated', severity: 'ok', source: 'edge-counter', invoiceHold: false, reviewer: 'Auto-rated', receivedAt: '2026-06-12', reason: 'Matched warehouse total' },
	{ id: 'use_2050', customer: 'Brightwell Studio', plan: 'Growth', product: 'Storage', meter: 'gb_month', period: '2026-06', quantity: 890, expected: 640, delta: 250, invoiceImpact: 112.50, status: 'needs-review', severity: 'warning', source: 'storage-ledger', invoiceHold: true, reviewer: 'Jon Bell', receivedAt: '2026-06-11', reason: 'Retention policy changed mid-cycle' },
	{ id: 'use_2051', customer: 'Cinder Labs', plan: 'Scale', product: 'Workflow runs', meter: 'runs', period: '2026-06', quantity: 42100, expected: 46300, delta: -4200, invoiceImpact: -210.00, status: 'credit-pending', severity: 'info', source: 'scheduler', invoiceHold: false, reviewer: 'Finance queue', receivedAt: '2026-06-11', reason: 'Retry duplication already credited' },
	{ id: 'use_2052', customer: 'Orchid Health', plan: 'Enterprise', product: 'AI seats', meter: 'seat_hours', period: '2026-06', quantity: 3310, expected: 3310, delta: 0, invoiceImpact: 1588.80, status: 'rated', severity: 'ok', source: 'identity-sync', invoiceHold: false, reviewer: 'Auto-rated', receivedAt: '2026-06-10', reason: 'Seat roster matched contract' },
	{ id: 'use_2053', customer: 'Juniper Works', plan: 'Growth', product: 'API calls', meter: 'requests', period: '2026-06', quantity: 221000, expected: 318000, delta: -97000, invoiceImpact: -77.60, status: 'schema-error', severity: 'danger', source: 'events-api', invoiceHold: true, reviewer: 'Ari Patel', receivedAt: '2026-06-10', reason: 'Missing tenant key in batch' },
	{ id: 'use_2054', customer: 'Signal Harbor', plan: 'Scale', product: 'Workflow runs', meter: 'runs', period: '2026-06', quantity: 58800, expected: 58800, delta: 0, invoiceImpact: 2940.00, status: 'rated', severity: 'ok', source: 'scheduler', invoiceHold: false, reviewer: 'Auto-rated', receivedAt: '2026-06-09', reason: 'Rated against current package' },
	{ id: 'use_2055', customer: 'Forge Robotics', plan: 'Enterprise', product: 'Storage', meter: 'gb_month', period: '2026-06', quantity: 4120, expected: 3980, delta: 140, invoiceImpact: 63.00, status: 'needs-review', severity: 'warning', source: 'storage-ledger', invoiceHold: false, reviewer: 'Mina Okafor', receivedAt: '2026-06-09', reason: 'Archive restore overlapped billing window' },
	{ id: 'use_2056', customer: 'Lakehouse Legal', plan: 'Growth', product: 'AI seats', meter: 'agent_minutes', period: '2026-06', quantity: 6420, expected: 9900, delta: -3480, invoiceImpact: -62.64, status: 'credit-pending', severity: 'info', source: 'events-api', invoiceHold: false, reviewer: 'Finance queue', receivedAt: '2026-06-08', reason: 'Service credit for outage window' },
	{ id: 'use_2057', customer: 'Copper Bank', plan: 'Enterprise', product: 'API calls', meter: 'requests', period: '2026-06', quantity: 1820000, expected: 1660000, delta: 160000, invoiceImpact: 128.00, status: 'needs-review', severity: 'danger', source: 'edge-counter', invoiceHold: true, reviewer: 'Security review', receivedAt: '2026-06-08', reason: 'Traffic spike from unverified client id' },
	{ id: 'use_2058', customer: 'Mercury Media', plan: 'Scale', product: 'Workflow runs', meter: 'runs', period: '2026-06', quantity: 37600, expected: 37600, delta: 0, invoiceImpact: 1880.00, status: 'rated', severity: 'ok', source: 'scheduler', invoiceHold: false, reviewer: 'Auto-rated', receivedAt: '2026-06-07', reason: 'No discrepancy detected' },
	{ id: 'use_2059', customer: 'Redwood Insurance', plan: 'Scale', product: 'Storage', meter: 'gb_month', period: '2026-06', quantity: 2100, expected: 2600, delta: -500, invoiceImpact: -225.00, status: 'credit-pending', severity: 'info', source: 'storage-ledger', invoiceHold: false, reviewer: 'Jon Bell', receivedAt: '2026-06-07', reason: 'Legacy data migrated out of paid tier' },
];

const selectedPeriod = ref('2026-06');
const selectedProducts = ref(['AI seats', 'API calls']);
const viewMode = ref('review');
const gridFilters = ref({
	status: { type: 'select', values: ['needs-review', 'schema-error'] },
});
const gridSort = ref({ key: 'invoiceImpact', direction: 'desc' });
const gridSearch = ref('');
const selectedKeys = ref(['use_2048', 'use_2050']);
const lastQuery = ref(null);
const adjustmentDialogOpen = ref(false);
const adjustmentMode = ref('Hold invoice');

const columns = [
	{ key: 'customer', label: 'Customer', type: 'text', width: '13rem' },
	{
		key: 'status',
		label: 'Status',
		type: 'select',
		width: '9.5rem',
		options: [
			{ label: 'Rated', value: 'rated', tone: 'green' },
			{ label: 'Needs review', value: 'needs-review', tone: 'amber' },
			{ label: 'Credit pending', value: 'credit-pending', tone: 'blue' },
			{ label: 'Schema error', value: 'schema-error', tone: 'red' },
		],
	},
	{ key: 'product', label: 'Product', type: 'select', width: '10rem' },
	{ key: 'meter', label: 'Meter', type: 'text', width: '10rem' },
	{ key: 'quantity', label: 'Quantity', type: 'number', width: '8rem' },
	{ key: 'expected', label: 'Expected', type: 'number', width: '8rem' },
	{ key: 'delta', label: 'Delta', type: 'number', width: '7rem' },
	{ key: 'invoiceImpact', label: 'Invoice impact', type: 'currency', currency: 'GBP', width: '9.5rem' },
	{ key: 'invoiceHold', label: 'Hold', type: 'boolean', width: '6rem' },
	{ key: 'source', label: 'Source', type: 'select', width: '9rem' },
	{ key: 'reviewer', label: 'Reviewer', type: 'text', width: '10rem' },
	{ key: 'receivedAt', label: 'Received', type: 'date', width: '9rem' },
];

const visibleUsageEvents = computed(() => usageEvents.filter((event) => {
	if (event.period !== selectedPeriod.value) return false;
	if (selectedProducts.value.length && !selectedProducts.value.includes(event.product)) return false;
	if (viewMode.value === 'review') return ['needs-review', 'schema-error', 'credit-pending'].includes(event.status);
	if (viewMode.value === 'hold') return event.invoiceHold;
	return true;
}));
const selectedEvents = computed(() => usageEvents.filter((event) => selectedKeys.value.includes(event.id)));
const totalInvoiceImpact = computed(() => visibleUsageEvents.value.reduce((total, event) => total + event.invoiceImpact, 0));
const holdCount = computed(() => visibleUsageEvents.value.filter((event) => event.invoiceHold).length);
const reviewCount = computed(() => visibleUsageEvents.value.filter((event) => event.status !== 'rated').length);
const selectedImpact = computed(() => selectedEvents.value.reduce((total, event) => total + event.invoiceImpact, 0));
const queryPreview = computed(() => JSON.stringify(lastQuery.value || {
	search: gridSearch.value,
	filters: gridFilters.value,
	sort: gridSort.value,
}, null, 2));
const selectedSummary = computed(() => {
	if (!selectedEvents.value.length) return 'Select rows to create an adjustment job.';
	return `${selectedEvents.value.length} events selected, ${formatCurrency(selectedImpact.value)} invoice exposure.`;
});

function statusTone(status) {
	return {
		rated: 'success',
		'needs-review': 'warning',
		'credit-pending': 'info',
		'schema-error': 'danger',
	}[status] || 'neutral';
}

function severityClasses(severity) {
	return {
		ok: 'bg-success/15 text-success ring-success/20',
		info: 'bg-primary/10 text-canvas-fg ring-primary/15',
		warning: 'bg-warning/20 text-warning-fg ring-warning/30',
		danger: 'bg-destructive/15 text-destructive ring-destructive/20',
	}[severity] || 'bg-secondary text-muted-fg ring-border';
}

function formatCurrency(value) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
	}).format(value);
}

function openAdjustmentDialog(mode) {
	adjustmentMode.value = mode;
	adjustmentDialogOpen.value = true;
}

function createAdjustmentJob() {
	adjustmentDialogOpen.value = false;
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-4 py-4 sm:px-5">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div class="min-w-0">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Billing operations</p>
					<h3 class="mt-1 text-xl font-semibold tracking-tight">Usage event reconciliation</h3>
					<p class="mt-1 max-w-3xl text-sm leading-6 text-muted-fg">
						Review metered usage before invoice finalization, catch source discrepancies, and package selected events into adjustment jobs.
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<DomStatusPill :tone="holdCount ? 'warning' : 'success'" :pulse="holdCount > 0">
						{{ holdCount }} invoice holds
					</DomStatusPill>
					<DomButton size="sm" :disabled="!selectedEvents.length" @click="openAdjustmentDialog('Create adjustment')">
						Create adjustment
					</DomButton>
				</div>
			</div>

			<div class="mt-5 grid gap-3 md:grid-cols-3">
				<div class="rounded-2xl border border-border bg-canvas p-4">
					<p class="text-xs font-medium text-muted-fg">Invoice exposure</p>
					<p class="mt-2 text-2xl font-semibold tracking-tight">{{ formatCurrency(totalInvoiceImpact) }}</p>
					<p class="mt-1 text-xs text-muted-fg">Visible usage impact</p>
				</div>
				<div class="rounded-2xl border border-border bg-canvas p-4">
					<p class="text-xs font-medium text-muted-fg">Rows needing review</p>
					<p class="mt-2 text-2xl font-semibold tracking-tight">{{ reviewCount }}</p>
					<p class="mt-1 text-xs text-muted-fg">Credits, schema errors, and deltas</p>
				</div>
				<div class="rounded-2xl border border-border bg-canvas p-4">
					<p class="text-xs font-medium text-muted-fg">Selected exposure</p>
					<p class="mt-2 text-2xl font-semibold tracking-tight">{{ formatCurrency(selectedImpact) }}</p>
					<p class="mt-1 text-xs text-muted-fg">{{ selectedKeys.length }} selected events</p>
				</div>
			</div>
		</header>

		<section class="border-b border-border bg-secondary/25 px-4 py-4 sm:px-5">
			<div class="grid gap-4 xl:grid-cols-[18rem_minmax(18rem,1fr)_auto] xl:items-end">
				<DomListbox v-model="selectedPeriod" :options="periodOptions" label="Billing period" chrome="minimal">
					<template #option="{ option }">
						<span class="flex min-w-0 items-center justify-between gap-3">
							<span class="min-w-0">
								<span class="block truncate font-semibold">{{ option.label }}</span>
								<span class="block truncate text-xs opacity-80">{{ option.description }}</span>
							</span>
							<span class="shrink-0 rounded-full bg-canvas/70 px-2 py-1 text-[11px] font-semibold ring-1 ring-border">{{ option.amount }}</span>
						</span>
					</template>
				</DomListbox>

				<DomTagCombobox
					v-model="selectedProducts"
					:options="productOptions"
					label="Products"
					placeholder="Filter products..."
					clearable
					chrome="minimal"
				>
					<template #item="{ item }">
						<div class="flex min-w-0 items-center justify-between gap-3">
							<span class="min-w-0">
								<span class="block truncate font-medium">{{ item.label }}</span>
								<span class="block truncate text-xs text-muted-fg">{{ item.description }}</span>
							</span>
							<span class="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-fg ring-1 ring-border">{{ item.group }}</span>
						</div>
					</template>
				</DomTagCombobox>

				<DomToggleButtonGroup v-model="viewMode" :options="viewOptions" label="View mode" size="sm" chrome="minimal" />
			</div>
		</section>

		<section class="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
			<div class="min-w-0">
				<DomDataGrid
					v-model:filters="gridFilters"
					v-model:sort="gridSort"
					v-model:search="gridSearch"
					v-model:selected-keys="selectedKeys"
					:rows="visibleUsageEvents"
					:columns="columns"
					title="Metered events"
					resource-label="events"
					height="32rem"
					@query-change="lastQuery = $event"
				>
					<template #toolbar-actions>
						<DomBadge tone="info" variant="outline">
							Query-ready
						</DomBadge>
					</template>

					<template #cell="{ row, column, formatted, value }">
						<span v-if="column.key === 'customer'" class="block min-w-0">
							<span class="block truncate font-medium text-canvas-fg">{{ row.customer }}</span>
							<span class="block truncate text-xs text-muted-fg">{{ row.plan }} plan</span>
						</span>
						<DomStatusPill v-else-if="column.key === 'status'" :tone="statusTone(value)" size="sm">
							{{ formatted }}
						</DomStatusPill>
						<span v-else-if="column.key === 'delta'" class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1" :class="severityClasses(row.severity)">
							{{ value > 0 ? '+' : '' }}{{ formatted }}
						</span>
						<span v-else-if="column.key === 'invoiceImpact'" class="font-semibold" :class="value < 0 ? 'text-success' : 'text-canvas-fg'">
							{{ formatted }}
						</span>
						<span v-else-if="column.key === 'invoiceHold'" class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1" :class="value ? 'bg-warning/20 text-warning-fg ring-warning/30' : 'bg-secondary text-muted-fg ring-border'">
							{{ value ? 'Hold' : 'Clear' }}
						</span>
						<span v-else class="truncate">{{ formatted || '-' }}</span>
					</template>
				</DomDataGrid>
			</div>

			<aside class="space-y-4">
				<div class="rounded-2xl border border-border skin-card p-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Selection</p>
							<h4 class="mt-1 text-base font-semibold">Adjustment queue</h4>
						</div>
						<DomBadge :tone="selectedEvents.length ? 'primary' : 'neutral'">{{ selectedEvents.length }}</DomBadge>
					</div>
					<p class="mt-3 text-sm leading-6 text-muted-fg">{{ selectedSummary }}</p>
					<div class="mt-4 grid gap-2">
						<DomButton size="sm" class="w-full justify-center" :disabled="!selectedEvents.length" @click="openAdjustmentDialog('Hold invoice')">Hold invoice</DomButton>
						<DomButton size="sm" variant="secondary" class="w-full justify-center" :disabled="!selectedEvents.length" @click="openAdjustmentDialog('Issue credit')">Issue credit</DomButton>
					</div>
				</div>

				<div class="rounded-2xl border border-border bg-canvas p-4">
					<p class="text-sm font-semibold">Resource query</p>
					<p class="mt-1 text-xs leading-5 text-muted-fg">Send this payload to your usage events endpoint for server-side filtering, sort, and pagination.</p>
					<pre class="mt-3 max-h-56 overflow-auto rounded-xl border border-border bg-secondary/50 p-3 text-xs leading-5 text-canvas-fg">{{ queryPreview }}</pre>
				</div>

				<div class="rounded-2xl border border-border bg-canvas p-4">
					<p class="text-sm font-semibold">Review reasons</p>
					<div class="mt-3 space-y-3">
						<div v-for="event in selectedEvents.slice(0, 3)" :key="event.id" class="rounded-xl bg-secondary/60 p-3">
							<div class="flex items-center justify-between gap-3">
								<p class="truncate text-xs font-semibold text-canvas-fg">{{ event.customer }}</p>
								<span class="shrink-0 text-xs text-muted-fg">{{ event.id }}</span>
							</div>
							<p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.reason }}</p>
						</div>
						<p v-if="!selectedEvents.length" class="rounded-xl bg-secondary/60 p-3 text-xs leading-5 text-muted-fg">
							Selected rows will show the billing reason and correction context here.
						</p>
					</div>
				</div>
			</aside>
		</section>

		<DomDialog v-model="adjustmentDialogOpen" :title="adjustmentMode" description="Create an auditable billing adjustment from the selected usage events.">
			<div class="space-y-4">
				<div class="rounded-2xl border border-border bg-secondary/50 p-4">
					<div class="grid gap-3 text-sm sm:grid-cols-3">
						<div>
							<p class="text-xs text-muted-fg">Events</p>
							<p class="mt-1 font-semibold">{{ selectedEvents.length }}</p>
						</div>
						<div>
							<p class="text-xs text-muted-fg">Invoice exposure</p>
							<p class="mt-1 font-semibold">{{ formatCurrency(selectedImpact) }}</p>
						</div>
						<div>
							<p class="text-xs text-muted-fg">Period</p>
							<p class="mt-1 font-semibold">{{ selectedPeriod }}</p>
						</div>
					</div>
				</div>
				<div class="space-y-2 text-sm leading-6 text-muted-fg">
					<p>Recommended production workflow:</p>
					<ul class="list-disc space-y-1 pl-5">
						<li>POST selected event ids, reason code, reviewer note, and desired action to an adjustment-job endpoint.</li>
						<li>Recompute invoice preview on the server, then require approval when the exposure crosses policy thresholds.</li>
						<li>Append audit events for both the job creation and the final invoice change.</li>
					</ul>
				</div>
				<div class="flex flex-wrap justify-end gap-2">
					<DomButton variant="secondary" @click="adjustmentDialogOpen = false">Cancel</DomButton>
					<DomButton @click="createAdjustmentJob">Create job</DomButton>
				</div>
			</div>
		</DomDialog>
	</div>
</template>
