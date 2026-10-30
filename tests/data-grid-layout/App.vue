<script setup>
import DomDataGrid from '../../src/pages/data/data-grid/DomDataGrid.vue';

const columns = [
	{ key: 'name', label: 'Name', filterable: false, sortable: true },
	{ key: 'status', label: 'Status', filterable: false },
	{ key: 'count', label: 'Count', filterable: false, align: 'right' },
];
const rows = [{ id: 'one', name: 'Alpha', status: 'Ready', count: 42 }];
const cases = [
	{ id: 'normal' },
	{ id: 'virtual', virtualRows: true },
	{ id: 'auxiliary', selectable: true, showRowNumbers: true, showColumnLetters: true },
	{ id: 'single', columns: columns.slice(0, 1) },
	{ id: 'empty', rows: [] },
	{ id: 'loading', rows: [], loading: true },
	{ id: 'variable', gutterClass: 'px-[var(--test-gutter)]' },
	{ id: 'card', layout: 'card' },
	{ id: 'wide', columns: columns.map(column => ({ ...column, width: '20rem' })) },
];
</script>

<template>
	<main class="space-y-8 px-4 py-6 sm:px-6 [--test-gutter:28px]">
		<section v-for="item in cases" :key="item.id" :data-case="item.id">
			<h1 class="mb-4">{{ item.id }}</h1>
			<div class="-mx-4 sm:-mx-6">
				<DomDataGrid
					:rows="rows"
					:columns="columns"
					:selectable="false"
					:show-row-numbers="false"
					:show-column-letters="false"
					layout="flush"
					gutter-class="px-4 sm:px-6"
					v-bind="item"
				/>
			</div>
		</section>
	</main>
</template>
