<script setup>
import DomDataGrid from '../DomDataGrid.vue';

const columns = [
	{ key: 'title', label: 'Article', sortable: true, filterable: false },
	{ key: 'status', label: 'Status', filterable: false },
	{ key: 'words', label: 'Words', type: 'number', align: 'right', filterable: false },
];
const rows = [
	{ id: 'article-1', title: 'Designing a useful content library', status: 'Draft', words: 1200 },
	{ id: 'article-2', title: 'Keeping content aligned', status: 'Published', words: 860 },
];
</script>

<template>
	<div class="bg-canvas px-4 py-6 sm:px-6">
		<h2 class="mb-6 text-xl font-semibold text-canvas-fg">Articles</h2>
		<div class="-mx-4 sm:-mx-6">
			<DomDataGrid
				:rows="rows"
				:columns="columns"
				title="Article library"
				layout="flush"
				gutter-class="px-4 sm:px-6"
				:selectable="false"
				:show-row-numbers="false"
				:show-column-letters="false"
			/>
		</div>
	</div>
</template>
