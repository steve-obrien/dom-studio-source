<script setup>
import { ref } from 'vue';
import { DomDataGrid } from '../../../lib/vue';
import EditNameCell from './EditNameCell.vue';
import RowActionsCell from './RowActionsCell.vue';

const rows = ref([
	{ id: 'usr-1001', name: 'Maya Chen', email: 'maya@example.com', role: 'Product', status: 'pending', lastActive: '2026-06-17' },
	{ id: 'usr-1002', name: 'Jon Bell', email: 'jon@example.com', role: 'Engineering', status: 'active', lastActive: '2026-06-16' },
	{ id: 'usr-1003', name: 'Priya Shah', email: 'priya@example.com', role: 'Design', status: 'active', lastActive: '2026-06-12' },
	{ id: 'usr-1004', name: 'Noah Reed', email: 'noah@example.com', role: 'Support', status: 'paused', lastActive: '2026-06-08' },
	{ id: 'usr-1005', name: 'Amina Yusuf', email: 'amina@example.com', role: 'Operations', status: 'pending', lastActive: '2026-06-06' },
	{ id: 'usr-1006', name: 'Leo Morgan', email: 'leo@example.com', role: 'Sales', status: 'active', lastActive: '2026-06-04' },
]);
const lastEvent = ref('Custom cell events will appear here.');

const columns = [
	{
		key: 'name',
		label: 'User',
		type: 'text',
		width: '18rem',
		component: EditNameCell,
	},
	{ key: 'role', label: 'Team', type: 'text', width: '10rem' },
	{
		key: 'status',
		label: 'Status',
		type: 'select',
		width: '8rem',
		options: [
			{ label: 'Active', value: 'active', tone: 'green' },
			{ label: 'Pending', value: 'pending', tone: 'amber' },
			{ label: 'Paused', value: 'paused', tone: 'neutral' },
		],
	},
	{ key: 'lastActive', label: 'Last active', type: 'date', width: '9rem' },
	{
		key: 'actions',
		label: 'Actions',
		width: '13rem',
		align: 'right',
		sortable: false,
		filterable: false,
		searchable: false,
		component: RowActionsCell,
	},
];

function handleCellUpdate(event) {
	const target = rows.value.find((row) => row.id === event.row.id);
	if (!target) return;

	const field = event.column.field || event.column.key;
	target[field] = event.value;
	lastEvent.value = `Saved ${event.column.label.toLowerCase()} for ${target.id}: ${event.value}`;
}

function handleCellAction(event) {
	const target = rows.value.find((row) => row.id === event.row.id);
	if (!target) return;

	if (event.action === 'approve') {
		target.status = 'active';
		lastEvent.value = `Approved ${target.name} (${target.id}).`;
		return;
	}

	if (event.action === 'delete') {
		rows.value = rows.value.filter((row) => row.id !== target.id);
		lastEvent.value = `Deleted ${target.name} (${target.id}).`;
		return;
	}

	lastEvent.value = `Viewing ${target.name} (${target.id}).`;
}
</script>

<template>
	<div class="w-full min-w-0">
		<DomDataGrid
			:rows="rows"
			:columns="columns"
			:selectable="false"
			:show-row-numbers="false"
			:show-column-letters="false"
			title="Team members"
			resource-label="users"
			height="22rem"
			@cell-update="handleCellUpdate"
			@cell-action="handleCellAction"
		>
			<template #toolbar-actions>
				<span class="hidden rounded-md border border-border bg-canvas px-2.5 py-1.5 text-xs font-medium text-muted-fg lg:inline-flex">
					{{ lastEvent }}
				</span>
			</template>
		</DomDataGrid>
	</div>
</template>
