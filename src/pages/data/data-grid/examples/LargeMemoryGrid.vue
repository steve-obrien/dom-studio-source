<script setup>
import { computed, ref } from 'vue';
import { DomDataGrid } from '../../../lib/vue';

const rows = createRows(10000);
const renderWindow = ref({
	startIndex: 0,
	endIndex: 0,
	renderedRows: 0,
	totalRows: rows.length,
});

const columns = [
	{ key: 'id', label: 'Event', type: 'number', width: '7rem' },
	{ key: 'account', label: 'Account', type: 'text', width: '15rem' },
	{
		key: 'service',
		label: 'Service',
		type: 'select',
		width: '11rem',
		options: ['Billing API', 'Checkout', 'Identity', 'Mail', 'Storage', 'Analytics'],
	},
	{
		key: 'status',
		label: 'Status',
		type: 'select',
		width: '9rem',
		options: [
			{ label: 'Healthy', value: 'healthy', tone: 'green' },
			{ label: 'Delayed', value: 'delayed', tone: 'amber' },
			{ label: 'Failed', value: 'failed', tone: 'red' },
			{ label: 'Queued', value: 'queued', tone: 'blue' },
		],
	},
	{
		key: 'region',
		label: 'Region',
		type: 'select',
		width: '8rem',
		options: ['UK', 'EU', 'US', 'CA', 'AU'],
	},
	{ key: 'requests', label: 'Requests', type: 'number', width: '9rem' },
	{ key: 'spend', label: 'Spend', type: 'currency', width: '9rem' },
	{ key: 'updatedAt', label: 'Updated', type: 'date', width: '9.5rem' },
];

const renderedRange = computed(() => {
	const window = renderWindow.value;
	if (!window.totalRows) return '0';
	return `${(window.startIndex + 1).toLocaleString()}-${window.endIndex.toLocaleString()}`;
});

function createRows(count) {
	const accounts = ['Atlas Works', 'Northstar Labs', 'Pioneer Health', 'Evergreen Finance', 'Lunar Retail', 'Cobalt Systems'];
	const services = ['Billing API', 'Checkout', 'Identity', 'Mail', 'Storage', 'Analytics'];
	const statuses = ['healthy', 'delayed', 'queued', 'healthy', 'healthy', 'failed'];
	const regions = ['UK', 'EU', 'US', 'CA', 'AU'];

	return Array.from({ length: count }, (_, index) => {
		const accountIndex = index % accounts.length;
		const serviceIndex = (index * 3) % services.length;
		const day = (index % 28) + 1;
		const month = ((index % 6) + 1).toString().padStart(2, '0');

		return {
			id: index + 1,
			account: `${accounts[accountIndex]} ${Math.floor(index / accounts.length) + 1}`,
			service: services[serviceIndex],
			status: statuses[index % statuses.length],
			region: regions[index % regions.length],
			requests: 2500 + ((index * 97) % 92000),
			spend: 150 + ((index * 37) % 18000),
			updatedAt: `2026-${month}-${day.toString().padStart(2, '0')}`,
		};
	});
}

function updateRenderWindow(value) {
	renderWindow.value = value;
}
</script>

<template>
	<DomDataGrid
		virtual-rows
		:virtual-row-buffer="50"
		:rows="rows"
		:columns="columns"
		:selectable="false"
		title="Usage events"
		resource-label="events"
		height="34rem"
		@render-window-change="updateRenderWindow"
	>
		<template #toolbar-actions>
			<div class="hidden flex-wrap items-center gap-2 text-xs font-medium lg:flex">
				<span class="rounded-md border border-border bg-canvas px-2.5 py-1.5 text-muted-fg">
					{{ rows.length.toLocaleString() }} in memory
				</span>
				<span data-virtual-rendered class="rounded-md border border-border bg-canvas px-2.5 py-1.5 text-muted-fg">
					{{ renderWindow.renderedRows }} mounted
				</span>
				<span data-virtual-range class="rounded-md border border-border bg-canvas px-2.5 py-1.5 text-muted-fg">
					{{ renderedRange }}
				</span>
			</div>
		</template>
	</DomDataGrid>
</template>
