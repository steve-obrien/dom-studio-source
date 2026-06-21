<script setup>
import { computed, ref, watch } from 'vue';
import { DomDataGrid, DomNativeSelect } from '../../../lib/vue';

const selectedSort = ref('manual');
const sort = ref(null);
const search = ref('');

const sortPresets = [
	{
		label: 'Manual header clicks',
		value: 'manual',
		sort: null,
	},
	{
		label: 'Highest volume, easiest difficulty',
		value: 'volume-easy',
		sort: {
			key: 'searchVolume',
			direction: 'desc',
			rules: [
				{ key: 'searchVolume', direction: 'desc' },
				{ key: 'difficulty', direction: 'asc' },
			],
		},
	},
	{
		label: 'Easiest difficulty, then volume',
		value: 'easy-volume',
		sort: {
			key: 'difficulty',
			direction: 'asc',
			rules: [
				{ key: 'difficulty', direction: 'asc' },
				{ key: 'searchVolume', direction: 'desc' },
			],
		},
	},
	{
		label: 'Best opportunity score',
		value: 'opportunity',
		sort: {
			key: 'opportunity',
			direction: 'desc',
			rules: [
				{ key: 'opportunity', direction: 'desc' },
				{ key: 'searchVolume', direction: 'desc' },
				{ key: 'difficulty', direction: 'asc' },
			],
		},
	},
];

const sortOptions = sortPresets.map((preset) => ({
	label: preset.label,
	value: preset.value,
}));

const columns = [
	{ key: 'keyword', label: 'Keyword', type: 'text', width: '17rem' },
	{
		key: 'intent',
		label: 'Intent',
		type: 'select',
		width: '9rem',
		options: [
			{ label: 'Commercial', value: 'commercial', tone: 'green' },
			{ label: 'Comparison', value: 'comparison', tone: 'blue' },
			{ label: 'Informational', value: 'informational', tone: 'neutral' },
			{ label: 'Transactional', value: 'transactional', tone: 'violet' },
		],
	},
	{ key: 'searchVolume', label: 'Volume', type: 'number', width: '8rem' },
	{ key: 'difficulty', label: 'Difficulty', type: 'number', width: '8rem' },
	{ key: 'opportunity', label: 'Opportunity', type: 'number', width: '9rem' },
	{ key: 'cpc', label: 'CPC', type: 'currency', currency: 'USD', locale: 'en-US', width: '7.5rem' },
];

const rows = [
	{ id: 'kw-001', keyword: 'vue data grid', intent: 'commercial', searchVolume: 5400, difficulty: 28, cpc: 5.4 },
	{ id: 'kw-002', keyword: 'javascript spreadsheet component', intent: 'comparison', searchVolume: 5400, difficulty: 43, cpc: 7.1 },
	{ id: 'kw-003', keyword: 'editable table vue', intent: 'commercial', searchVolume: 2900, difficulty: 21, cpc: 4.8 },
	{ id: 'kw-004', keyword: 'tailwind data table', intent: 'informational', searchVolume: 8100, difficulty: 61, cpc: 3.9 },
	{ id: 'kw-005', keyword: 'server side data grid', intent: 'commercial', searchVolume: 3600, difficulty: 35, cpc: 8.2 },
	{ id: 'kw-006', keyword: 'open source data grid vue', intent: 'comparison', searchVolume: 4400, difficulty: 24, cpc: 4.6 },
	{ id: 'kw-007', keyword: 'keyword clustering tool', intent: 'transactional', searchVolume: 6600, difficulty: 48, cpc: 6.7 },
	{ id: 'kw-008', keyword: 'saas dashboard table', intent: 'informational', searchVolume: 1900, difficulty: 17, cpc: 3.2 },
	{ id: 'kw-009', keyword: 'best vue table library', intent: 'comparison', searchVolume: 5400, difficulty: 31, cpc: 5.9 },
	{ id: 'kw-010', keyword: 'crm data grid', intent: 'commercial', searchVolume: 2400, difficulty: 19, cpc: 9.4 },
].map((row) => ({
	...row,
	opportunity: Math.round(row.searchVolume * ((101 - row.difficulty) / 100)),
}));

const queryPreview = computed(() => JSON.stringify({
	search: search.value,
	sort: sort.value,
}, null, 2));

watch(selectedSort, (value) => {
	const preset = sortPresets.find((item) => item.value === value) || sortPresets[0];
	sort.value = preset.sort ? cloneSort(preset.sort) : { key: '', direction: '', rules: [] };
}, { immediate: true });

function cloneSort(value) {
	return {
		...value,
		rules: value.rules.map((rule) => ({ ...rule })),
	};
}
</script>

<template>
	<div class="w-full min-w-0 space-y-4">
		<div class="flex flex-col gap-3 rounded-lg border border-border bg-canvas p-4 lg:flex-row lg:items-end lg:justify-between">
			<div class="min-w-0">
				<p class="text-sm font-semibold text-canvas-fg">Keyword opportunity sort</p>
				<p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">
					The selected preset sends ordered sort rules, so APIs can translate them to stable ORDER BY clauses.
				</p>
			</div>

			<DomNativeSelect
				v-model="selectedSort"
				class="w-full lg:w-80"
				label="Sort preset"
				:options="sortOptions"
				placeholder=""
			/>
		</div>

		<DomDataGrid
			v-model:sort="sort"
			v-model:search="search"
			:rows="rows"
			:columns="columns"
			:selectable="false"
			title="Keyword research"
			resource-label="keywords"
			height="27rem"
			multi-sort
		>
			<template #toolbar-actions>
				<span class="hidden rounded-md border border-border bg-canvas px-2.5 py-1.5 text-xs font-medium text-muted-fg lg:inline-flex">
					Multi-rule sort active
				</span>
			</template>
		</DomDataGrid>

		<pre class="max-h-64 overflow-auto rounded-lg border border-border bg-secondary/40 p-4 text-xs leading-5 text-canvas-fg">{{ queryPreview }}</pre>
	</div>
</template>
