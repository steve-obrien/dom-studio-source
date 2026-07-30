<script setup>
import { computed, watch } from 'vue';
import { calculateVirtualWindow } from '../_shared/calculateVirtualWindow';

defineOptions({
	name: 'DataGridVirtualRows',
});

const props = defineProps({
	rows: {
		type: Array,
		default: () => [],
	},
	columns: {
		type: Array,
		default: () => [],
	},
	rowKey: {
		type: Function,
		required: true,
	},
	cellValue: {
		type: Function,
		required: true,
	},
	formattedCell: {
		type: Function,
		required: true,
	},
	cellAlignClass: {
		type: Function,
		required: true,
	},
	rowDensityClass: {
		type: Function,
		required: true,
	},
	selectedKeys: {
		type: Array,
		default: () => [],
	},
	selectable: {
		type: Boolean,
		default: true,
	},
	showRowNumbers: {
		type: Boolean,
		default: true,
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
	'row-click',
	'toggle-row-selection',
]);

const selectedKeySet = computed(() => new Set(props.selectedKeys));
const columnSpan = computed(() => props.columns.length + (props.selectable ? 1 : 0) + (props.showRowNumbers ? 1 : 0));
const safeRowHeight = computed(() => {
	const value = Number(props.rowHeight);
	return Number.isFinite(value) && value > 0 ? value : 36;
});
const safeBufferRows = computed(() => {
	const value = Math.floor(Number(props.bufferRows));
	return Number.isFinite(value) && value > 0 ? value : 0;
});
const rowWindow = computed(() => {
	const window = calculateVirtualWindow({
		itemCount: props.rows.length,
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
const renderedRows = computed(() => {
	const { startIndex, endIndex } = rowWindow.value;
	return props.rows.slice(startIndex, endIndex).map((row, offset) => ({
		row,
		index: startIndex + offset,
	}));
});

watch(rowWindow, (value) => {
	emit('render-window-change', { ...value });
}, { immediate: true });

/**
 * Resolves the stable key for a rendered row.
 *
 * @param {unknown} row Row record.
 * @param {number} index Absolute row index.
 * @returns {string|number} Consumer-provided row key.
 */
function resolvedRowKey(row, index) {
	return props.rowKey(row, index);
}

/**
 * Checks whether a rendered row is selected.
 *
 * @param {unknown} row Row record.
 * @param {number} index Absolute row index.
 * @returns {boolean} Whether the row key is selected.
 */
function rowSelected(row, index) {
	return selectedKeySet.value.has(resolvedRowKey(row, index));
}

/**
 * Builds the fixed-height style for a rendered row.
 *
 * @returns {{ height: string }} Row height style.
 */
function rowStyle() {
	return { height: `${safeRowHeight.value}px` };
}

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
		<tr v-if="rowWindow.topSpacerHeight" aria-hidden="true">
			<td :colspan="columnSpan" class="border-0 p-0" :style="spacerStyle(rowWindow.topSpacerHeight)"></td>
		</tr>

		<tr
			v-for="item in renderedRows"
			:key="resolvedRowKey(item.row, item.index)"
			class="group bg-canvas transition hover:bg-secondary/45"
			:class="rowSelected(item.row, item.index) && 'bg-sky-500/5'"
			:aria-rowindex="item.index + 1"
			:aria-selected="rowSelected(item.row, item.index) || undefined"
			:style="rowStyle()"
			@click="emit('row-click', { row: item.row, index: item.index })"
		>
			<td
				v-if="selectable"
				class="border-b border-r border-border px-2 text-center"
				:class="rowDensityClass()"
				@click.stop
			>
				<input
					type="checkbox"
					class="size-4 rounded border-border accent-primary"
					:checked="rowSelected(item.row, item.index)"
					:aria-label="`Select row ${item.index + 1}`"
					@change="emit('toggle-row-selection', { row: item.row, index: item.index })"
				/>
			</td>
			<td
				v-if="showRowNumbers"
				class="border-b border-r border-border bg-secondary/25 px-2 text-center text-xs font-medium text-muted-fg"
				:class="rowDensityClass()"
			>
				{{ item.index + 1 }}
			</td>
			<td
				v-for="column in columns"
				:key="column.key"
				class="overflow-hidden border-b border-r border-border px-3 align-middle last:border-r-0"
				:class="[cellAlignClass(column), rowDensityClass()]"
			>
				<slot
					name="cell"
					:row="item.row"
					:column="column"
					:value="cellValue(item.row, column)"
					:formatted="formattedCell(item.row, column)"
					:row-index="item.index"
					:row-key="resolvedRowKey(item.row, item.index)"
				/>
			</td>
		</tr>

		<tr v-if="rowWindow.bottomSpacerHeight" aria-hidden="true">
			<td :colspan="columnSpan" class="border-0 p-0" :style="spacerStyle(rowWindow.bottomSpacerHeight)"></td>
		</tr>
	</tbody>
</template>
