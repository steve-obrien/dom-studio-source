<script setup>
import { computed, ref } from 'vue';
import DomDataGrid from '../DomDataGrid.vue';

const filters = ref({
	status: { type: 'select', values: ['active', 'trial'] },
	renewalDate: { type: 'date', start: '2026-07-01', end: '2026-09-30' },
});
const sort = ref({ key: 'arr', direction: 'desc' });
const search = ref('');
const selectedKeys = ref(['acc-1005', 'acc-1014']);
const lastQuery = ref(null);

const columns = [
	{ key: 'account', label: 'Account', type: 'text', width: '15rem' },
	{
		key: 'status',
		label: 'Status',
		type: 'select',
		width: '8.5rem',
		options: [
			{ label: 'Active', value: 'active', tone: 'green' },
			{ label: 'Trial', value: 'trial', tone: 'blue' },
			{ label: 'Paused', value: 'paused', tone: 'amber' },
			{ label: 'Risk', value: 'risk', tone: 'red' },
		],
	},
	{
		key: 'plan',
		label: 'Plan',
		type: 'select',
		width: '8.5rem',
		options: [
			{ label: 'Starter', value: 'starter', tone: 'neutral' },
			{ label: 'Growth', value: 'growth', tone: 'blue' },
			{ label: 'Scale', value: 'scale', tone: 'violet' },
			{ label: 'Enterprise', value: 'enterprise', tone: 'green' },
		],
	},
	{ key: 'owner', label: 'Owner', type: 'text', width: '11rem' },
	{ key: 'seats', label: 'Seats', type: 'number', width: '6.5rem' },
	{ key: 'arr', label: 'ARR', type: 'currency', currency: 'GBP', width: '8.5rem' },
	{
		key: 'health',
		label: 'Health',
		type: 'select',
		width: '8.25rem',
		options: [
			{ label: 'Strong', value: 'strong', tone: 'green' },
			{ label: 'Watch', value: 'watch', tone: 'amber' },
			{ label: 'Weak', value: 'weak', tone: 'red' },
		],
	},
	{ key: 'region', label: 'Region', type: 'select', width: '8rem' },
	{ key: 'renewalDate', label: 'Renewal', type: 'date', width: '9.5rem' },
	{ key: 'activeUsers', label: 'Active users', type: 'number', width: '8rem' },
	{ key: 'verified', label: 'Verified', type: 'boolean', width: '7rem' },
	{ key: 'updatedAt', label: 'Updated', type: 'date', width: '9.5rem' },
];

const rows = [
	{ id: 'acc-1001', account: 'Northstar Analytics', status: 'active', plan: 'enterprise', owner: 'Amelia Hart', seats: 142, arr: 184000, health: 'strong', region: 'EMEA', renewalDate: '2026-08-19', activeUsers: 118, verified: true, updatedAt: '2026-06-10' },
	{ id: 'acc-1002', account: 'Atlas Finance', status: 'active', plan: 'scale', owner: 'Ravi Patel', seats: 84, arr: 96500, health: 'watch', region: 'NA', renewalDate: '2026-07-28', activeUsers: 62, verified: true, updatedAt: '2026-06-08' },
	{ id: 'acc-1003', account: 'Brightwell Studio', status: 'trial', plan: 'growth', owner: 'Mina Okafor', seats: 18, arr: 21400, health: 'strong', region: 'EMEA', renewalDate: '2026-09-14', activeUsers: 16, verified: false, updatedAt: '2026-06-09' },
	{ id: 'acc-1004', account: 'Cinder Labs', status: 'risk', plan: 'scale', owner: 'Theo Grant', seats: 67, arr: 81200, health: 'weak', region: 'APAC', renewalDate: '2026-10-03', activeUsers: 29, verified: true, updatedAt: '2026-06-05' },
	{ id: 'acc-1005', account: 'Orchid Health', status: 'active', plan: 'enterprise', owner: 'Laura Chen', seats: 232, arr: 268000, health: 'strong', region: 'NA', renewalDate: '2026-09-22', activeUsers: 211, verified: true, updatedAt: '2026-06-11' },
	{ id: 'acc-1006', account: 'Juniper Works', status: 'paused', plan: 'growth', owner: 'Sam Rivera', seats: 31, arr: 38200, health: 'watch', region: 'LATAM', renewalDate: '2026-11-17', activeUsers: 12, verified: false, updatedAt: '2026-05-30' },
	{ id: 'acc-1007', account: 'Signal Harbor', status: 'active', plan: 'scale', owner: 'Nora Ellis', seats: 96, arr: 112900, health: 'strong', region: 'EMEA', renewalDate: '2026-08-02', activeUsers: 88, verified: true, updatedAt: '2026-06-07' },
	{ id: 'acc-1008', account: 'Pioneer Retail', status: 'trial', plan: 'starter', owner: 'Miles Brooks', seats: 9, arr: 7800, health: 'watch', region: 'NA', renewalDate: '2026-07-12', activeUsers: 6, verified: false, updatedAt: '2026-06-03' },
	{ id: 'acc-1009', account: 'Forge Robotics', status: 'active', plan: 'enterprise', owner: 'Priya Singh', seats: 188, arr: 224500, health: 'strong', region: 'APAC', renewalDate: '2026-09-04', activeUsers: 169, verified: true, updatedAt: '2026-06-10' },
	{ id: 'acc-1010', account: 'Lakehouse Legal', status: 'risk', plan: 'growth', owner: 'Jon Bell', seats: 27, arr: 29600, health: 'weak', region: 'EMEA', renewalDate: '2026-06-26', activeUsers: 11, verified: true, updatedAt: '2026-05-28' },
	{ id: 'acc-1011', account: 'Verde Energy', status: 'active', plan: 'scale', owner: 'Iris Morgan', seats: 121, arr: 136800, health: 'watch', region: 'NA', renewalDate: '2026-10-21', activeUsers: 94, verified: true, updatedAt: '2026-06-01' },
	{ id: 'acc-1012', account: 'Kite Education', status: 'trial', plan: 'starter', owner: 'Owen Price', seats: 14, arr: 11800, health: 'strong', region: 'EMEA', renewalDate: '2026-08-31', activeUsers: 13, verified: false, updatedAt: '2026-06-06' },
	{ id: 'acc-1013', account: 'Evergreen Supply', status: 'paused', plan: 'growth', owner: 'Fatima Noor', seats: 44, arr: 48700, health: 'watch', region: 'APAC', renewalDate: '2026-12-05', activeUsers: 18, verified: true, updatedAt: '2026-05-24' },
	{ id: 'acc-1014', account: 'Mercury Media', status: 'active', plan: 'enterprise', owner: 'Caleb Stone', seats: 176, arr: 201300, health: 'strong', region: 'NA', renewalDate: '2026-07-09', activeUsers: 151, verified: true, updatedAt: '2026-06-09' },
	{ id: 'acc-1015', account: 'Sable Security', status: 'active', plan: 'scale', owner: 'Elena Rossi', seats: 72, arr: 88900, health: 'strong', region: 'EMEA', renewalDate: '2026-09-29', activeUsers: 70, verified: true, updatedAt: '2026-06-02' },
	{ id: 'acc-1016', account: 'Copper Bank', status: 'risk', plan: 'enterprise', owner: 'Daniel Kim', seats: 205, arr: 241900, health: 'weak', region: 'NA', renewalDate: '2026-08-07', activeUsers: 132, verified: true, updatedAt: '2026-05-31' },
	{ id: 'acc-1017', account: 'Bluejay Travel', status: 'trial', plan: 'growth', owner: 'Tara Lewis', seats: 22, arr: 24800, health: 'watch', region: 'LATAM', renewalDate: '2026-07-19', activeUsers: 17, verified: false, updatedAt: '2026-06-04' },
	{ id: 'acc-1018', account: 'Mosaic Civic', status: 'active', plan: 'starter', owner: 'George White', seats: 16, arr: 15800, health: 'strong', region: 'EMEA', renewalDate: '2026-09-11', activeUsers: 15, verified: true, updatedAt: '2026-06-10' },
	{ id: 'acc-1019', account: 'Harbor FreightOps', status: 'active', plan: 'scale', owner: 'Nadia Cole', seats: 109, arr: 121400, health: 'watch', region: 'APAC', renewalDate: '2026-10-13', activeUsers: 83, verified: true, updatedAt: '2026-06-07' },
	{ id: 'acc-1020', account: 'Quartz Design Co', status: 'paused', plan: 'starter', owner: 'Hugo Martin', seats: 11, arr: 9200, health: 'weak', region: 'EMEA', renewalDate: '2026-11-02', activeUsers: 4, verified: false, updatedAt: '2026-05-21' },
	{ id: 'acc-1021', account: 'Anchor Cloud', status: 'active', plan: 'enterprise', owner: 'Sofia Jensen', seats: 264, arr: 310000, health: 'strong', region: 'NA', renewalDate: '2026-07-31', activeUsers: 240, verified: true, updatedAt: '2026-06-11' },
	{ id: 'acc-1022', account: 'Violet Manufacturing', status: 'trial', plan: 'scale', owner: 'Kai Foster', seats: 58, arr: 65400, health: 'watch', region: 'APAC', renewalDate: '2026-08-24', activeUsers: 43, verified: false, updatedAt: '2026-06-01' },
	{ id: 'acc-1023', account: 'Summit Grocery', status: 'active', plan: 'growth', owner: 'Maeve Walsh', seats: 36, arr: 41800, health: 'strong', region: 'NA', renewalDate: '2026-09-16', activeUsers: 34, verified: true, updatedAt: '2026-06-06' },
	{ id: 'acc-1024', account: 'Redwood Insurance', status: 'risk', plan: 'scale', owner: 'Imani Reed', seats: 91, arr: 104200, health: 'weak', region: 'EMEA', renewalDate: '2026-07-07', activeUsers: 49, verified: true, updatedAt: '2026-05-29' },
];

const queryPreview = computed(() => JSON.stringify(lastQuery.value || {
	search: search.value,
	filters: filters.value,
	sort: sort.value,
}, null, 2));
</script>

<template>
	<div class="w-full min-w-0">
		<DomDataGrid
			v-model:filters="filters"
			v-model:sort="sort"
			v-model:search="search"
			v-model:selected-keys="selectedKeys"
			:rows="rows"
			:columns="columns"
			title="Customer accounts"
			resource-label="accounts"
			height="35rem"
			@query-change="lastQuery = $event"
		>
			<template #toolbar-actions>
				<div class="hidden items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-fg lg:flex">
					<span class="size-2 rounded-full bg-emerald-500"></span>
					SQL-ready query state
				</div>
			</template>
		</DomDataGrid>

		<div class="mt-4 grid gap-3 rounded-lg border border-border bg-background p-4 text-sm lg:grid-cols-[minmax(0,1fr)_20rem]">
			<div>
				<p class="font-semibold text-fg">Resource API shape</p>
				<p class="mt-1 leading-6 text-muted-fg">
					The grid can filter locally today, but the same <code class="text-fg">query-change</code> payload can be sent to a resource endpoint for SQL-backed search, where, order, and pagination later.
				</p>
			</div>
			<pre class="max-h-48 overflow-auto rounded-md border border-border bg-secondary/40 p-3 text-xs leading-5 text-fg">{{ queryPreview }}</pre>
		</div>
	</div>
</template>
