<script setup>
import { computed, watch } from 'vue';
import { calculateVirtualWindow } from '../_shared/calculateVirtualWindow';

defineOptions({
	name: 'DataGridVirtualRows',
});

/**
 * Windowed table body for DomDataGrid. The grid owns row markup through the
 * `row` slot, so data rows and group rows render the same way whether or not
 * virtualisation is on; this component only decides which items are mounted.
 */
const props = defineProps({
	items: {
		type: Array,
		default: () => [],
	},
	itemKey: {
		type: Function,
		required: true,
	},
	enabled: {
		type: Boolean,
		default: true,
	},
	columnSpan: {
		type: Number,
		default: 1,
	},
	scrollTop: {
		type: Number,
		default: 0,
	},
	viewportHeight: {
		type: Number,
		default: 0,
	},
	rowHeight: {
		type: Number,
		default: 36,
	},
	bufferRows: {
		type: Number,
		default: 50,
	},
});

const emit = defineEmits([
	'render-window-change',
]);

const safeRowHeight = computed(() => {
	const value = Number(props.rowHeight);
	return Number.isFinite(value) && value > 0 ? value : 36;
});
const safeBufferRows = computed(() => {
	const value = Math.floor(Number(props.bufferRows));
	return Number.isFinite(value) && value > 0 ? value : 0;
});
const rowWindow = computed(() => {
	if (!props.enabled) return null;

	const window = calculateVirtualWindow({
		itemCount: props.items.length,
		itemSize: safeRowHeight.value,
		scrollOffset: props.scrollTop,
		viewportSize: props.viewportHeight,
		overscan: safeBufferRows.value,
	});

	return {
		startIndex: window.startIndex,
		endIndex: window.endIndex,
		firstVisibleIndex: window.firstVisibleIndex,
		lastVisibleIndex: window.lastVisibleIndex,
		renderedRows: window.renderedItems,
		totalRows: window.totalItems,
		rowHeight: window.itemSize,
		bufferRows: window.overscan,
		viewportRows: window.viewportItems,
		topSpacerHeight: window.beforeSpacerSize,
		bottomSpacerHeight: window.afterSpacerSize,
	};
});
const renderedItems = computed(() => {
	if (!rowWindow.value) return props.items.map((item, index) => ({ item, index }));

	const { startIndex, endIndex } = rowWindow.value;
	return props.items.slice(startIndex, endIndex).map((item, offset) => ({
		item,
		index: startIndex + offset,
	}));
});

watch(rowWindow, (value) => {
	if (value) emit('render-window-change', { ...value });
}, { immediate: true });

/**
 * Builds the fixed-height style for a virtual spacer row.
 *
 * @param {number} height Spacer height in pixels.
 * @returns {{ height: string }} Spacer height style.
 */
function spacerStyle(height) {
	return { height: `${height}px` };
}
</script>

<template>
	<tbody>
		<tr v-if="rowWindow?.topSpacerHeight" aria-hidden="true">
			<td :colspan="columnSpan" class="border-0 p-0" :style="spacerStyle(rowWindow.topSpacerHeight)"></td>
		</tr>

		<template v-for="entry in renderedItems" :key="itemKey(entry.item, entry.index)">
			<slot name="row" :item="entry.item" :index="entry.index" :row-height="enabled ? safeRowHeight : null" />
		</template>

		<tr v-if="rowWindow?.bottomSpacerHeight" aria-hidden="true">
			<td :colspan="columnSpan" class="border-0 p-0" :style="spacerStyle(rowWindow.bottomSpacerHeight)"></td>
		</tr>
	</tbody>
</template>
