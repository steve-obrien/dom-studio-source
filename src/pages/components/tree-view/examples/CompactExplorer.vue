<script setup>
import { ref } from 'vue';
import { DomTreeView } from '../../../lib/vue';

const folderIcon = 'M4 6h6l2 2h8v10H4V6Z';
const fileIcon = 'M6 4h8l4 4v12H6V4Zm8 0v5h5';

const selected = ref('grid-columns');

function folder(id, label, children, open = true) {
	return { id, label, icon: folderIcon, open, children };
}

function file(id, label) {
	return { id, label, icon: fileIcon };
}

const files = ref([
	folder('packages', 'packages', [
		folder('studio', 'studio', [
			folder('studio-src', 'src', [
				folder('data-grid', 'data-grid', [
					folder('grid-features', 'features', [
						folder('grid-columns-dir', 'columns', [
							file('grid-columns', 'useColumns.js'),
							file('grid-pinning', 'usePinning.js'),
							file('grid-resize', 'useResize.js'),
						]),
						folder('grid-rows', 'rows', [
							file('grid-grouping', 'useGrouping.js'),
							file('grid-tree-data', 'useTreeData.js'),
						], false),
						file('grid-filters', 'filters.js'),
					]),
					file('grid-vue', 'DomDataGrid.vue'),
				]),
				folder('scheduler', 'scheduler', [
					file('scheduler-vue', 'DomScheduler.vue'),
				], false),
				file('studio-index', 'index.js'),
			]),
			file('studio-package', 'package.json'),
		]),
		folder('now', 'now', [
			file('now-server', 'server.js'),
		], false),
	]),
	folder('server', 'server', [
		file('server-api', 'api'),
	], false),
	file('readme', 'README.md'),
]);
</script>

<template>
	<div class="w-full max-w-72 overflow-hidden rounded-xl border border-border bg-canvas">
		<div class="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Explorer</div>
		<div class="max-h-96 overflow-auto p-1">
			<DomTreeView
				v-model="selected"
				v-model:items="files"
				density="dense"
				:indent="8"
				guides="hover"
				selection="subtle"
				:chrome="false"
				label="Compact explorer"
			/>
		</div>
	</div>
</template>
