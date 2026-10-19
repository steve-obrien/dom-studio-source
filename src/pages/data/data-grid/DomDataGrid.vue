<script>
/**
* @typedef {object} DataGridColumn
* @property {string} key Stable column id. It can match a row property, or identify a display-only column such as actions.
* @property {string} [field] Row property to read when it differs from key.
* @property {string} [label] Header label.
* @property {'text'|'number'|'date'|'boolean'|'select'|'currency'} [type] Column data type. Drives sorting, formatting, and filter controls.
* @property {string|number} [width] CSS width for the column.
* @property {'left'|'center'|'right'} [align] Cell alignment.
* @property {object|Function|string} [component] Vue component used to render cells in this column. Receives row, column, value, formatted, rowIndex, and rowKey props.
* @property {boolean} [resizable] Set false to disable drag resizing for this column.
* @property {boolean} [sortable] Set false to disable sorting.
* @property {boolean} [filterable] Set false to disable filtering for this column, hide the filter button, and omit the column from query filters.
* @property {boolean} [searchable] Set false to remove the column from global search.
* @property {Array<string|number|boolean|object>} [options] Select filter options. Objects may include label, value, and tone.
* @property {string} [currency] Currency code for currency columns.
* @property {Function} [accessor] Function that receives a row and returns the cell value.
* @property {Function} [sortAccessor] Function that receives a row and column and returns the value used for local sorting.
* @property {Function} [format] Function that receives value, row, and column and returns display text.
* @property {'left'|'right'|boolean} [pinned] Pin the column to the left or right edge so it stays visible while the grid scrolls sideways. true pins left.
* @property {boolean|Function} [editable] Allow inline editing for this column, or a function that receives row and column and decides per cell. Defaults to the grid editable prop for plain cells.
* @property {Function} [parse] Function that receives typed text and column and returns the value to store. Overrides the built-in parser for edits and paste.
* @property {Function} [validate] Function that receives value, row, and column. Return true to accept, or a message to reject the edit.
* @property {'sum'|'avg'|'count'|'min'|'max'|Function} [aggregate] Aggregate shown on group rows and the totals row. A function receives values, rows, and column.
* @property {Function} [formatAggregate] Function that receives the aggregate value, column, and aggregate kind and returns display text.
* @property {boolean} [exportable] Set false to leave the column out of CSV and Excel exports.
* @property {Function} [exportValue] Function that receives value, row, and column and returns the exported and copied value.
*/

/**
* @typedef {object} DataGridFilter
* @property {string} [type]
* @property {string} [operator]
* @property {unknown} [value]
* @property {Array<unknown>} [values]
* @property {string|number} [min]
* @property {string|number} [max]
* @property {string} [start]
* @property {string} [end]
*/

/**
* @typedef {object} DataGridSortRule
* @property {string} [key] Column key, row field, or stable custom sort id.
* @property {'asc'|'desc'} [direction]
* @property {string} [field] Row property to sort by when it differs from key.
* @property {Function} [accessor] Function that receives a row and returns the local sort value.
* @property {Function} [compare] Function that receives left row, right row, rule, and context and returns an ascending comparison result.
*/

/**
* @typedef {object} DataGridSort
* @property {string} [key]
* @property {'asc'|'desc'|''} [direction]
* @property {Array<DataGridSortRule>} [rules] Ordered sort rules for multi-column or computed local sorting and server query payloads.
*/

/**
* @typedef {object} DataGridQuery
* @property {string} search
* @property {Record<string, DataGridFilter>} filters
* @property {DataGridSort|null} sort
*/

export const dataGridProps = {
	layout: {
		type: String,
		default: 'card',
		_edit: { description: 'Card keeps the bordered container. Flush removes outer side borders, rounding and shadow; the application owns the surrounding width.', options: ['card', 'flush'] },
	},
	gutterClass: {
		type: String,
		default: 'px-3',
		_edit: { description: 'Horizontal padding classes for flush toolbar, footer and outer cell edges, such as px-4 sm:px-6 or px-[var(--page-gutter)]. Ignored in card layout.' },
	},
	rows: {
		type: Array,
		default: () => [],
		_edit: { description: 'Rows to render. Each row should be a plain object from an API, store, or database result.' },
	},
	/**
	* @type {Array<DataGridColumn>}
	*/
	columns: {
		type: Array,
		default: () => [],
		_edit: { description: 'Column definitions. Each type chooses its own sorting, formatting, and filter controls.' },
	},
	rowKey: {
		type: [String, Function],
		default: 'id',
		_edit: { description: 'Field name or function used to identify each row.' },
	},
	filters: {
		type: Object,
		default: () => ({}),
		_edit: { description: 'Controlled filter map keyed by column key.' },
	},
	sort: {
		type: [Object, Array],
		default: () => ({ key: '', direction: '' }),
		_edit: { description: 'Controlled sort state as { key, direction }, or { rules } for multi-column and computed sorting.' },
	},
	multiSort: {
		type: Boolean,
		default: false,
		_edit: { description: 'When true, header clicks toggle each sortable column inside an ordered sort.rules array.' },
	},
	search: {
		type: String,
		default: '',
		_edit: { description: 'Global search text.' },
	},
	selectedKeys: {
		type: Array,
		default: () => [],
		_edit: { description: 'Selected row keys.' },
	},
	remote: {
		type: Boolean,
		default: false,
		_edit: { description: 'When true, rows render as supplied and query-change can drive a server/API request.' },
	},
	loading: {
		type: Boolean,
		default: false,
		_edit: { description: 'Show a loading row while server data is being fetched.' },
	},
	virtualRows: {
		type: Boolean,
		default: false,
		_edit: { description: 'Render large in-memory row sets through the isolated virtual row renderer.' },
	},
	virtualRowBuffer: {
		type: Number,
		default: 50,
		_edit: { description: 'Rows kept mounted above and below the visible viewport when virtualRows is true.' },
	},
	virtualRowHeight: {
		type: Number,
		default: null,
		_edit: { description: 'Fixed row height in pixels for virtual row calculations. Defaults to the grid density.' },
	},
	selectable: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show row selection checkboxes.' },
	},
	showRowNumbers: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show spreadsheet-style row numbers.' },
	},
	showColumnLetters: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show spreadsheet-style column letters above headers.' },
	},
	stickyHeader: {
		type: Boolean,
		default: true,
		_edit: { description: 'Keep header rows visible while the grid scrolls.' },
	},
	resizableColumns: {
		type: Boolean,
		default: true,
		_edit: { description: 'Allow users to drag header dividers to resize columns.' },
	},
	minColumnWidth: {
		type: Number,
		default: 40,
		_edit: { description: 'Minimum column width in pixels while resizing. The default leaves room for the filter icon.' },
	},
	toolbar: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the title, search box, filter chips, and row count toolbar.' },
	},
	title: {
		type: String,
		default: 'Data grid',
		_edit: { description: 'Toolbar title.' },
	},
	resourceLabel: {
		type: String,
		default: 'rows',
		_edit: { description: 'Human label for the resource being rendered.' },
	},
	totalRows: {
		type: Number,
		default: null,
		_edit: { description: 'Server-side total row count when remote is true.' },
	},
	density: {
		type: String,
		default: 'compact',
		validator: (value) => ['compact', 'comfortable'].includes(value),
		_edit: { options: ['compact', 'comfortable'], description: 'Row height density.' },
	},
	height: {
		type: [String, Number],
		default: '34rem',
		_edit: { description: 'Scrollable grid height as a CSS size or pixel number.' },
	},
	emptyText: {
		type: String,
		default: 'No rows match the current filters.',
		_edit: { description: 'Message shown when no rows are visible.' },
	},
	pinnedColumns: {
		type: Object,
		default: null,
		_edit: { description: 'Controlled pin map keyed by column key, such as { account: \'left\', actions: \'right\' }. When omitted, each column\'s pinned value is used.' },
	},
	groupBy: {
		type: [String, Array],
		default: '',
		_edit: { description: 'Column key, or ordered column keys, to group rows by. Group rows show a count and each column aggregate.' },
	},
	groupsExpanded: {
		type: Boolean,
		default: true,
		_edit: { description: 'Whether groups start expanded.' },
	},
	showTotals: {
		type: Boolean,
		default: false,
		_edit: { description: 'Show a totals row pinned to the bottom with each column aggregate over the filtered rows.' },
	},
	editable: {
		type: Boolean,
		default: false,
		_edit: { description: 'Allow inline editing of plain cells. Edits emit cell-update; column editable overrides this per column.' },
	},
	cellSelection: {
		type: Boolean,
		default: false,
		_edit: { description: 'Spreadsheet cell focus: arrow-key navigation, drag or Shift range selection, copy, paste, delete and undo.' },
	},
	columnMenu: {
		type: Boolean,
		default: false,
		_edit: { description: 'Show a menu on every header with pin and group actions beside the column filter.' },
	},
	exportable: {
		type: Boolean,
		default: false,
		_edit: { description: 'Show an Export menu in the toolbar for CSV and Excel (.xlsx) downloads of the filtered, sorted rows.' },
	},
	exportFileName: {
		type: String,
		default: '',
		_edit: { description: 'Export file name without an extension. Defaults to the title.' },
	},
};
</script>

<script setup>
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, reactive, ref, useId, watch } from 'vue';
import DomPopover from '../../components/popover/DomPopover.vue';
import { resolveResourceKey, resolveResourceValue } from '../_shared/resourceRecord.js';
import DataGridVirtualRows from './DataGridVirtualRows.vue';
import { csvBlob, downloadBlob, parseTsv, toCsv, toTsv, xlsxBlob } from './gridExport.js';

defineOptions({
	__doc: {
		name: 'Data grid',
		tag: '<DomDataGrid>',
		description: `A dense spreadsheet-like grid for database records, with typed column filters, sorting, row selection, and a server-query friendly API.
		We talk about databases, rendering pipelines, virtual DOMs, and scalable app architecture. But really, they just want Excel.`,
		icon: 'M4 5h16v14H4V5Zm0 4h16M4 13h16M9 5v14M15 5v14',
		events: [
			{ name: 'update:filters', payload: 'Record<string, DataGridFilter>', description: 'Fired when a column filter is applied or cleared.' },
			{ name: 'update:sort', payload: 'DataGridSort', description: 'Fired when column sorting changes. Complex sort values may include an ordered rules array.' },
			{ name: 'update:search', payload: 'string', description: 'Fired when the toolbar search changes.' },
			{ name: 'update:selectedKeys', payload: 'Array<string | number>', description: 'Fired when row selection changes.' },
			{ name: 'query-change', payload: 'DataGridQuery', description: 'Fired with the normalized search, filters, and sort state. Use this to call a resource API.' },
			{ name: 'viewport-scroll', payload: '{ scrollTop, scrollHeight, clientHeight, remaining, atEnd }', description: 'Fired when the scrollable row viewport scrolls.' },
			{ name: 'viewport-end', payload: '{ scrollTop, scrollHeight, clientHeight, remaining, atEnd }', description: 'Fired when the scrollable row viewport reaches the bottom threshold. Useful for cursor pagination and infinite loading.' },
			{ name: 'cell-update', payload: '({ row, column, rowIndex, rowKey, value, previousValue, source })', description: 'Fired when a cell value changes: an inline edit, paste, delete, undo or redo (source), or a column component emitting update:value. The grid does not mutate rows; write value back to your data.' },
			{ name: 'cells-update', payload: '({ source, changes })', description: 'Fired once per edit, paste, delete, undo or redo with every change, after the individual cell-update events. Use it instead of cell-update to apply a batch in one step.' },
			{ name: 'range-change', payload: '({ startRow, endRow, startColumn, endColumn, rows, columns }) | null', description: 'Fired when the selected cell range changes. Indexes are visible positions.' },
			{ name: 'update:pinnedColumns', payload: 'Record<string, \'left\' | \'right\'>', description: 'Fired when a column is pinned or unpinned from the column menu.' },
			{ name: 'update:groupBy', payload: 'string | Array<string>', description: 'Fired when grouping changes from the column menu or toolbar.' },
			{ name: 'export', payload: '({ format, rows, columns, fileName })', description: 'Fired after a CSV or Excel export is built.' },
			{ name: 'cell-action', payload: '({ row, column, rowIndex, rowKey, value, formatted, action, payload })', description: 'Re-emitted when a column component emits action.' },
			{ name: 'column-resize', payload: '({ column, key, width, previousWidth, startWidth })', description: 'Fired while a header divider is dragged and a column width changes.' },
			{ name: 'column-resize-end', payload: '({ column, key, width, previousWidth, startWidth })', description: 'Fired when the user finishes resizing a column.' },
			{ name: 'render-window-change', payload: '({ startIndex, endIndex, renderedRows, totalRows, firstVisibleIndex, lastVisibleIndex })', description: 'Fired by the virtual row renderer when the mounted row window changes.' },
			{ name: 'row-click', payload: '({ row, index })', description: 'Fired when a data row is clicked.' },
		],
		slots: [
			{ name: 'cell', payload: '{ row, column, value, formatted, rowIndex, rowKey }', description: 'Custom cell renderer.' },
			{ name: 'toolbar-actions', payload: '{ query, clearFilters, exportCsv, exportExcel }', description: 'Extra controls rendered next to search and Clear filters.' },
			{ name: 'empty', description: 'Custom empty state.' },
		],
		keyboard: [
			{ keys: 'Enter / Space on a header', action: 'Toggle sort when the column is sortable.' },
			{ keys: 'Enter / Space on a filter button', action: 'Open the typed filter popover.' },
			{ keys: 'Esc', action: 'Close an open filter popover, cancel an edit, or collapse a range to the active cell.' },
			{ keys: 'Arrow keys / Tab', action: 'Move the active cell when cellSelection is on. Shift extends the range; Cmd or Ctrl jumps to the edge.' },
			{ keys: 'Enter / F2 / typing', action: 'Edit the active cell when it is editable. Enter commits and moves down; Tab commits and moves right.' },
			{ keys: 'Cmd/Ctrl + C, X, V', action: 'Copy, cut and paste the range as tab-separated text, compatible with Excel and Google Sheets.' },
			{ keys: 'Delete / Backspace', action: 'Clear editable cells in the range.' },
			{ keys: 'Cmd/Ctrl + A', action: 'Select every visible cell.' },
			{ keys: 'Cmd/Ctrl + Z, Shift + Cmd/Ctrl + Z', action: 'Undo and redo edits made in the grid.' },
		],
	},
});

const props = defineProps(dataGridProps);
const emit = defineEmits([
	'update:filters',
	'filter-change',
	'update:sort',
	'sort-change',
	'update:search',
	'query-change',
	'viewport-scroll',
	'viewport-end',
	'cell-update',
	'cell-action',
	'column-resize',
	'column-resize-end',
	'render-window-change',
	'update:selectedKeys',
	'selection-change',
	'row-click',
	'cells-update',
	'range-change',
	'update:pinnedColumns',
	'update:groupBy',
	'export',
]);

const titleId = `dom-data-grid-${useId()}`;
const filterDrafts = reactive({});
const resizedColumnWidths = reactive({});
const viewportState = reactive({ scrollTop: 0, clientHeight: 0, clientWidth: 0 });
const internalFilters = ref({});
const internalSort = ref(normalizeSort(props.sort));
const internalSearch = ref(props.search || '');
const internalSelectedKeys = ref([...props.selectedKeys]);
const columnResize = ref(null);
const scrollViewport = ref(null);
const headerElement = ref(null);
const headerHeight = ref(0);
const internalPins = ref({});
const internalGroupBy = ref(normalizeGroupBy(props.groupBy));
const groupOpenState = reactive({});
const activeCell = ref(null);
const rangeAnchor = ref(null);
const editingCell = ref(null);
const editHistory = { past: [], future: [] };
let editorElement = null;
let rangeDragging = false;
let resizeListenersAttached = false;
const blankGroupKey = '\u0000blank';
const interactiveSelector = 'input, button, select, textarea, a[href], label, [contenteditable=""], [contenteditable="true"], [data-grid-interactive]';
const gridNotice = ref('');
const utilityColumnCount = computed(() => (props.selectable ? 1 : 0) + (props.showRowNumbers ? 1 : 0));
const singleCellRange = computed(() => {
	const rect = rangeRect.value;
	return !rect || (rect.top === rect.bottom && rect.left === rect.right);
});
const groupDefaultOpen = ref(props.groupsExpanded);
let noticeTimer = null;

let previousBodyCursor = '';
let previousBodyUserSelect = '';

watch(() => props.groupsExpanded, (value) => {
	groupDefaultOpen.value = value;
});

const sourceRows = computed(() => Array.isArray(props.rows) ? props.rows : []);
const normalizedColumns = computed(() => {
	const supplied = Array.isArray(props.columns) && props.columns.length
		? props.columns
		: inferColumns(sourceRows.value);

	return supplied
		.filter((column) => column && column.hidden !== true && column.key)
		.map((column) => normalizeColumn(column));
});
// Pinning is suspended when pinned columns would leave too little room to
// scroll the rest, such as a wide pinned set on a phone.
const pinsSuspended = computed(() => {
	const width = viewportState.clientWidth;
	if (!width) return false;
	const pinnedWidth = normalizedColumns.value.reduce((total, column) => total + (columnPin(column) ? columnPixelWidth(column) : 0), 0);
	if (!pinnedWidth) return false;
	const utilityWidth = (props.selectable ? 44 : 0) + (props.showRowNumbers ? 54 : 0);
	return utilityWidth + pinnedWidth > width * 0.7;
});
const visibleColumns = computed(() => {
	const left = [];
	const center = [];
	const right = [];
	for (const column of normalizedColumns.value) {
		const pinned = pinsSuspended.value ? '' : columnPin(column);
		const entry = pinned === column.pinned ? column : { ...column, pinned };
		if (pinned === 'left') left.push(entry);
		else if (pinned === 'right') right.push(entry);
		else center.push(entry);
	}
	return [...left, ...center, ...right];
});
const pinLayout = computed(() => {
	const columns = {};
	const utilityLeft = (props.selectable ? 44 : 0) + (props.showRowNumbers ? 54 : 0);
	const leftColumns = visibleColumns.value.filter((column) => column.pinned === 'left');
	const rightColumns = visibleColumns.value.filter((column) => column.pinned === 'right');
	let left = utilityLeft;
	leftColumns.forEach((column, index) => {
		columns[column.key] = { side: 'left', offset: left, edge: index === leftColumns.length - 1 };
		left += columnPixelWidth(column);
	});
	let right = 0;
	for (let index = rightColumns.length - 1; index >= 0; index -= 1) {
		const column = rightColumns[index];
		columns[column.key] = { side: 'right', offset: right, edge: index === 0 };
		right += columnPixelWidth(column);
	}
	return {
		columns,
		hasLeft: leftColumns.length > 0,
		leftWidth: leftColumns.length ? left : 0,
		rightWidth: right,
	};
});
const groupColumns = computed(() => internalGroupBy.value
	.map((key) => normalizedColumns.value.find((column) => column.key === key))
	.filter(Boolean));
const aggregateColumns = computed(() => visibleColumns.value.filter((column) => column.aggregate));
const activeFilters = computed(() => normalizeFilterMap(internalFilters.value));
const activeSortRules = computed(() => sortRules(internalSort.value));
const query = computed(() => ({
	search: internalSearch.value.trim(),
	filters: cloneFilterMap(activeFilters.value),
	sort: activeSortRules.value.length ? cloneSort(internalSort.value) : null,
}));
const filteredRows = computed(() => {
	if (props.remote) return sourceRows.value;
	return sourceRows.value.filter((row) => rowMatchesSearch(row) && rowMatchesFilters(row));
});
const displayRows = computed(() => {
	if (props.remote) return sourceRows.value;
	if (!activeSortRules.value.length) return filteredRows.value;

	return [...filteredRows.value].sort((a, b) => compareRows(a, b, activeSortRules.value));
});
const displayItems = computed(() => {
	const entries = displayRows.value.map((row, index) => ({ row, index }));
	const items = [];
	if (groupColumns.value.length) appendGroupItems(entries, 0, '', items, true);
	else for (const entry of entries) items.push(rowItem(entry));

	let line = 0;
	items.forEach((item, position) => {
		item.position = position;
		if (item.type === 'row') {
			item.line = line;
			line += 1;
		}
	});
	return items;
});
const navRows = computed(() => displayItems.value.filter((item) => item.type === 'row'));
const totalAggregates = computed(() => props.showTotals ? computeAggregates(displayRows.value) : {});
const rangeRect = computed(() => {
	if (!props.cellSelection || !activeCell.value) return null;
	const anchor = rangeAnchor.value || activeCell.value;
	return {
		top: Math.min(anchor.row, activeCell.value.row),
		bottom: Math.max(anchor.row, activeCell.value.row),
		left: Math.min(anchor.col, activeCell.value.col),
		right: Math.max(anchor.col, activeCell.value.col),
	};
});
const rangeSummary = computed(() => {
	const rect = rangeRect.value;
	if (!rect || (rect.top === rect.bottom && rect.left === rect.right)) return null;

	let count = 0;
	let numericCount = 0;
	let sum = 0;
	let numericColumn = null;
	let mixedNumeric = false;
	for (let line = rect.top; line <= Math.min(rect.bottom, rect.top + 5000); line += 1) {
		const item = navRows.value[line];
		if (!item) break;
		for (let col = rect.left; col <= rect.right; col += 1) {
			const column = visibleColumns.value[col];
			if (!column) continue;
			const value = cellValue(item.row, column);
			if (value === null || value === undefined || value === '') continue;
			count += 1;
			if (column.type !== 'number' && column.type !== 'currency') continue;
			const number = Number(value);
			if (!Number.isFinite(number)) continue;
			numericCount += 1;
			sum += number;
			if (!numericColumn) numericColumn = column;
			else if (numericColumn.type !== column.type || numericColumn.currency !== column.currency) mixedNumeric = true;
		}
	}

	const formatColumn = numericColumn && !mixedNumeric
		? { ...numericColumn, format: undefined }
		: { type: 'number', format: (value) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(value) };
	return {
		cells: (rect.bottom - rect.top + 1) * (rect.right - rect.left + 1),
		count,
		sum: numericCount ? formatValue(sum, null, formatColumn) : '',
		average: numericCount ? formatValue(sum / numericCount, null, formatColumn) : '',
	};
});
const editingError = computed(() => editingCell.value?.error || '');
const headerRowCount = computed(() => props.showColumnLetters ? 2 : 1);
const viewportStyle = computed(() => ({
	...gridHeightStyle.value,
	scrollPaddingTop: `${headerHeight.value}px`,
	scrollPaddingLeft: `${pinLayout.value.leftWidth}px`,
	scrollPaddingRight: `${pinLayout.value.rightWidth}px`,
	scrollPaddingBottom: props.showTotals ? '2.5rem' : undefined,
}));
const exportBaseName = computed(() => {
	const base = (props.exportFileName || props.title || 'data-grid').trim();
	return base.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ') || 'data-grid';
});
const remoteTotalRows = computed(() => Number.isFinite(props.totalRows) ? props.totalRows : sourceRows.value.length);
const shownRowCount = computed(() => props.remote ? sourceRows.value.length : displayRows.value.length);
const totalRowCount = computed(() => props.remote ? remoteTotalRows.value : sourceRows.value.length);
const activeFilterEntries = computed(() => visibleColumns.value
	.map((column) => ({
		column,
		filter: activeFilters.value[column.key],
		summary: filterSummary(column, activeFilters.value[column.key]),
	}))
	.filter((entry) => entry.summary));
const hasActiveFilters = computed(() => activeFilterEntries.value.length > 0 || internalSearch.value.trim().length > 0);
const selectedKeySet = computed(() => new Set(internalSelectedKeys.value));
const visibleSelectableKeys = computed(() => displayRows.value.map((row, index) => rowKey(row, index)));
const allVisibleSelected = computed(() => (
	visibleSelectableKeys.value.length > 0
	&& visibleSelectableKeys.value.every((key) => selectedKeySet.value.has(key))
));
const someVisibleSelected = computed(() => (
	visibleSelectableKeys.value.some((key) => selectedKeySet.value.has(key))
	&& !allVisibleSelected.value
));
const gridHeightStyle = computed(() => ({
	maxHeight: typeof props.height === 'number' ? `${props.height}px` : props.height,
}));
const tableStyle = computed(() => ({
	minWidth: `${tableMinWidth()}px`,
}));
const emptyColspan = computed(() => visibleColumns.value.length + (props.selectable ? 1 : 0) + (props.showRowNumbers ? 1 : 0));
const headerOffset = computed(() => props.showColumnLetters ? '1.75rem' : '0px');
const virtualRowHeightPx = computed(() => {
	const value = Number(props.virtualRowHeight);
	if (Number.isFinite(value) && value > 0) return value;
	return props.density === 'comfortable' ? 48 : 36;
});

watch(() => props.filters, (value) => {
	internalFilters.value = normalizeFilterMap(value);
	syncFilterDrafts();
}, { deep: true, immediate: true });

watch(() => props.sort, (value) => {
	internalSort.value = normalizeSort(value);
}, { deep: true });

watch(() => props.search, (value) => {
	internalSearch.value = value || '';
});

watch(() => props.selectedKeys, (value) => {
	internalSelectedKeys.value = Array.isArray(value) ? [...value] : [];
}, { deep: true });

watch(visibleColumns, () => {
	internalFilters.value = normalizeFilterMap(internalFilters.value);
	syncFilterDrafts();
}, { deep: true });
watch(query, (value) => {
	emit('query-change', cloneQuery(value));
}, { deep: true });
watch(() => [props.height, props.virtualRows, props.density, displayRows.value.length], () => {
	nextTick(refreshViewportMetrics);
});
watch(() => props.pinnedColumns, (value) => {
	internalPins.value = value && typeof value === 'object' ? normalizePinMap(value) : {};
}, { deep: true, immediate: true });
watch(() => props.groupBy, (value) => {
	internalGroupBy.value = normalizeGroupBy(value);
}, { deep: true });
watch(() => [internalSort.value, activeFilters.value, internalSearch.value, internalGroupBy.value], () => {
	editingCell.value = null;
}, { deep: true });
watch(() => [navRows.value.length, visibleColumns.value.length], ([rowCount, columnCount]) => {
	if (!activeCell.value) return;
	if (!rowCount || !columnCount) {
		clearRange();
		return;
	}
	const clamp = (cell) => cell && {
		row: Math.min(cell.row, rowCount - 1),
		col: Math.min(cell.col, columnCount - 1),
	};
	activeCell.value = clamp(activeCell.value);
	rangeAnchor.value = clamp(rangeAnchor.value);
	if (editingCell.value && (editingCell.value.line >= rowCount || editingCell.value.col >= columnCount)) editingCell.value = null;
});
watch(rangeRect, (rect) => {
	emit('range-change', rect ? rangePayload(rect) : null);
});

onBeforeUnmount(() => {
	removeColumnResizeListeners();
	columnResize.value = null;
	if (typeof document === 'undefined') return;
	document.removeEventListener('copy', onDocumentCopy);
	document.removeEventListener('cut', onDocumentCut);
	document.removeEventListener('paste', onDocumentPaste);
	document.removeEventListener('pointerup', stopRangeDrag);
	window.removeEventListener('resize', refreshViewportMetrics);
});

onMounted(() => {
	nextTick(refreshViewportMetrics);
	document.addEventListener('copy', onDocumentCopy);
	document.addEventListener('cut', onDocumentCut);
	document.addEventListener('paste', onDocumentPaste);
	document.addEventListener('pointerup', stopRangeDrag);
	window.addEventListener('resize', refreshViewportMetrics, { passive: true });
});

defineExpose({
	exportCsv,
	exportExcel,
	getRange,
	selectRange,
	clearRange,
	undo,
	redo,
	expandAllGroups: () => setAllGroups(true),
	collapseAllGroups: () => setAllGroups(false),
});

function inferColumns(rows) {
	const first = rows.find((row) => row && typeof row === 'object');
	if (!first) return [];
	return Object.keys(first).map((key) => ({
		key,
		label: labelFromKey(key),
		type: inferColumnType(rows.map((row) => row?.[key])),
	}));
}

function normalizeColumn(column) {
	const type = column.type || 'text';
	return {
		...column,
		type,
		pinned: normalizePin(column.pinned),
		label: column.label || labelFromKey(column.key),
		component: column.component ? markRaw(column.component) : null,
		width: columnWidth(column.width, type),
		align: column.align || defaultAlign(type),
		resizable: column.resizable !== false,
		sortable: column.sortable !== false,
		filterable: column.filterable !== false,
		searchable: column.searchable !== false,
	};
}

function inferColumnType(values) {
	const sample = values.find((value) => value !== null && value !== undefined && value !== '');
	if (typeof sample === 'boolean') return 'boolean';
	if (typeof sample === 'number') return 'number';
	if (typeof sample === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sample)) return 'date';
	return 'text';
}

function labelFromKey(key) {
	return String(key)
		.replace(/[_-]+/g, ' ')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

function columnWidth(width, type) {
	if (typeof width === 'number') return `${width}px`;
	if (typeof width === 'string' && width.trim()) return width;

	return {
		boolean: '7rem',
		currency: '8.5rem',
		date: '9.5rem',
		number: '7rem',
		select: '9rem',
	}[type] || '13rem';
}

function defaultAlign(type) {
	if (type === 'number' || type === 'currency') return 'right';
	if (type === 'boolean') return 'center';
	return 'left';
}

function tableMinWidth() {
	const utilityWidth = (props.selectable ? 44 : 0) + (props.showRowNumbers ? 54 : 0);
	const columnWidthTotal = visibleColumns.value.reduce((total, column) => total + columnPixelWidth(column), 0);
	return Math.max(720, utilityWidth + columnWidthTotal);
}

function columnWidthStyle(column) {
	return `${columnPixelWidth(column)}px`;
}

function columnPixelWidth(column) {
	const resizedWidth = resizedColumnWidths[column.key];
	return Number.isFinite(resizedWidth) ? resizedWidth : numericWidth(column.width);
}

function numericWidth(width) {
	if (typeof width === 'number') return width;
	const value = Number.parseFloat(width);
	if (Number.isFinite(value)) {
		if (String(width).includes('rem')) return value * 16;
		return value;
	}
	return 160;
}

function minimumColumnWidth() {
	const value = Number(props.minColumnWidth);
	return Number.isFinite(value) && value > 0 ? value : 40;
}

function canResizeColumn(column) {
	return props.resizableColumns && column.resizable !== false;
}

function startColumnResize(column, event) {
	if (!canResizeColumn(column)) return;

	event.preventDefault();
	event.stopPropagation();

	const startWidth = columnPixelWidth(column);
	columnResize.value = {
		key: column.key,
		column,
		startX: event.clientX,
		startWidth,
		width: startWidth,
	};

	addColumnResizeListeners();
}

function addColumnResizeListeners() {
	if (typeof document === 'undefined') return;
	if (resizeListenersAttached) removeColumnResizeListeners();

	resizeListenersAttached = true;
	previousBodyCursor = document.body.style.cursor;
	previousBodyUserSelect = document.body.style.userSelect;
	document.body.style.cursor = 'col-resize';
	document.body.style.userSelect = 'none';
	document.addEventListener('pointermove', updateColumnResize);
	document.addEventListener('pointerup', finishColumnResize);
	document.addEventListener('pointercancel', finishColumnResize);
}

function removeColumnResizeListeners() {
	if (!resizeListenersAttached || typeof document === 'undefined') return;

	resizeListenersAttached = false;
	document.removeEventListener('pointermove', updateColumnResize);
	document.removeEventListener('pointerup', finishColumnResize);
	document.removeEventListener('pointercancel', finishColumnResize);
	document.body.style.cursor = previousBodyCursor;
	document.body.style.userSelect = previousBodyUserSelect;
}

function updateColumnResize(event) {
	const resize = columnResize.value;
	if (!resize) return;

	event.preventDefault();

	const width = Math.max(
		minimumColumnWidth(),
		Math.round(resize.startWidth + event.clientX - resize.startX),
	);

	if (width === resize.width) return;

	const previousWidth = resize.width;
	resize.width = width;
	resizedColumnWidths[resize.key] = width;

	emit('column-resize', {
		column: resize.column,
		key: resize.key,
		width,
		previousWidth,
		startWidth: resize.startWidth,
	});
}

function finishColumnResize(event) {
	if (event) event.preventDefault();

	const resize = columnResize.value;
	removeColumnResizeListeners();
	if (!resize) return;

	columnResize.value = null;
	emit('column-resize-end', {
		column: resize.column,
		key: resize.key,
		width: resize.width,
		previousWidth: resize.startWidth,
		startWidth: resize.startWidth,
	});
}

/**
 * Resolves the stable key used by selection and row rendering.
 *
 * @param {Record<string, unknown>} row Resource row to identify.
 * @param {number} index Source row index.
 * @returns {string|number} Stable row key.
 */
function rowKey(row, index) {
	return resolveResourceKey(row, props.rowKey, index);
}

/**
 * Reads a column value through its accessor or logical resource field.
 *
 * @param {Record<string, unknown>} row Resource row to inspect.
 * @param {DataGridColumn} column Column definition.
 * @returns {unknown} Raw cell value.
 */
function cellValue(row, column) {
	if (typeof column.accessor === 'function') return column.accessor(row, column);
	return resolveResourceValue(row, column.field || column.key);
}

function formattedCell(row, column) {
	return formatValue(cellValue(row, column), row, column);
}

/**
 * Formats a raw value with a column's formatter and type defaults.
 *
 * @param {unknown} value Raw value.
 * @param {Record<string, unknown>|null} row Row the value belongs to, or null for aggregates.
 * @param {DataGridColumn} column Column definition.
 * @returns {string} Display text.
 */
function formatValue(value, row, column) {
	if (typeof column.format === 'function') return column.format(value, row, column);
	if (value === null || value === undefined || value === '') return '';

	if (column.type === 'currency') {
		const amount = Number(value);
		if (!Number.isFinite(amount)) return String(value);
		return new Intl.NumberFormat(column.locale || 'en-GB', {
			style: 'currency',
			currency: column.currency || 'GBP',
			maximumFractionDigits: Math.abs(amount) >= 1000 ? 0 : 2,
		}).format(amount);
	}

	if (column.type === 'number') {
		const number = Number(value);
		return Number.isFinite(number) ? new Intl.NumberFormat(column.locale || 'en-GB').format(number) : String(value);
	}

	if (column.type === 'date') return formatDateValue(value, column.locale);
	if (column.type === 'boolean') return value ? 'Yes' : 'No';
	if (column.type === 'select') return optionLabel(column, value);
	return String(value);
}

function formatDateValue(value, locale = 'en-GB') {
	const date = dateFromValue(value);
	if (!date) return String(value || '');
	return new Intl.DateTimeFormat(locale, {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(date);
}

function dateFromValue(value) {
	if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
		const [year, month, day] = value.slice(0, 10).split('-').map(Number);
		const date = new Date(year, month - 1, day);
		return Number.isNaN(date.getTime()) ? null : date;
	}
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function dateKey(value) {
	const date = dateFromValue(value);
	if (!date) return '';
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

function optionRecords(column) {
	if (Array.isArray(column.options) && column.options.length) {
		return column.options.map((option) => normalizeOption(option));
	}

	const seen = new Set();
	return sourceRows.value
		.map((row) => cellValue(row, column))
		.filter((value) => value !== null && value !== undefined && value !== '')
		.filter((value) => {
			const key = String(value);
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		})
		.map((value) => normalizeOption(value));
}

function normalizeOption(option) {
	if (option && typeof option === 'object') {
		return {
			...option,
			value: option.value ?? option.label,
			label: option.label ?? option.value,
		};
	}
	return { value: option, label: String(option) };
}

function optionLabel(column, value) {
	const option = optionRecords(column).find((item) => String(item.value) === String(value));
	return option?.label ?? String(value ?? '');
}

function optionTone(column, value) {
	const option = optionRecords(column).find((item) => String(item.value) === String(value));
	return option?.tone || '';
}

function toneClass(tone) {
	return {
		blue: 'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300',
		green: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
		amber: 'bg-amber-500/15 text-amber-800 ring-amber-500/20 dark:text-amber-300',
		red: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300',
		violet: 'bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300',
		neutral: 'bg-secondary text-muted-fg ring-border',
	}[tone] || 'bg-secondary text-muted-fg ring-border';
}

function normalizeSort(sort) {
	const source = Array.isArray(sort) ? { rules: sort } : sort && typeof sort === 'object' ? sort : {};
	const parentDirection = normalizeSortDirection(source.direction);
	const rules = Array.isArray(source.rules)
		? source.rules
			.map((rule) => normalizeSortRule(rule, parentDirection || 'asc'))
			.filter(Boolean)
		: [];

	if (rules.length) {
		return {
			...source,
			key: source.key ? String(source.key) : rules[0].key,
			direction: parentDirection || rules[0].direction,
			rules,
		};
	}

	const direction = normalizeSortDirection(source.direction);
	const key = direction ? String(source.key || '') : '';
	return {
		...source,
		key,
		direction: key ? direction : '',
	};
}

function normalizeSortRule(rule, fallbackDirection = '') {
	if (!rule || typeof rule !== 'object') return null;

	const direction = normalizeSortDirection(rule.direction) || fallbackDirection;
	const key = rule.key !== undefined && rule.key !== null && rule.key !== ''
		? String(rule.key)
		: rule.field !== undefined && rule.field !== null && rule.field !== ''
			? String(rule.field)
			: '';

	if (!direction || (!key && typeof rule.accessor !== 'function' && typeof rule.compare !== 'function')) return null;

	return {
		...rule,
		key,
		direction,
	};
}

function normalizeSortDirection(direction) {
	return direction === 'desc' ? 'desc' : direction === 'asc' ? 'asc' : '';
}

function sortRules(sort) {
	if (!sort || typeof sort !== 'object') return [];
	if (Array.isArray(sort.rules) && sort.rules.length) return sort.rules;
	if (!sort.key || !sort.direction) return [];
	return [normalizeSortRule(sort)].filter(Boolean);
}

function toggleSort(column) {
	if (!column.sortable) return;
	if (props.multiSort) {
		toggleMultiSort(column);
		return;
	}

	const current = internalSort.value;
	let next = { key: column.key, direction: 'asc' };

	if (current.key === column.key && current.direction === 'asc') {
		next = { key: column.key, direction: 'desc' };
	} else if (current.key === column.key && current.direction === 'desc') {
		next = { key: '', direction: '' };
	}

	internalSort.value = normalizeSort(next);
	emit('update:sort', cloneSort(internalSort.value));
	emit('sort-change', cloneSort(internalSort.value));
}

function toggleMultiSort(column) {
	const rules = activeSortRules.value.map((rule) => ({ ...rule }));
	const ruleIndex = rules.findIndex((rule) => rule.key === column.key);

	if (ruleIndex === -1) {
		rules.push(sortRuleForColumn(column, 'asc'));
	} else if (rules[ruleIndex].direction === 'asc') {
		rules[ruleIndex] = { ...rules[ruleIndex], direction: 'desc' };
	} else {
		rules.splice(ruleIndex, 1);
	}

	const next = sortFromRules(rules);
	internalSort.value = normalizeSort(next);
	emit('update:sort', cloneSort(internalSort.value));
	emit('sort-change', cloneSort(internalSort.value));
}

function sortRuleForColumn(column, direction) {
	return {
		key: column.key,
		direction,
		...(column.field && column.field !== column.key ? { field: column.field } : {}),
	};
}

function sortFromRules(rules) {
	const firstRule = rules[0];
	return {
		key: firstRule?.key || '',
		direction: firstRule?.direction || '',
		rules,
	};
}

function ariaSort(column) {
	const primaryRule = activeSortRules.value[0];
	if (!primaryRule || primaryRule.key !== column.key) {
		return activeSortRules.value.some((rule) => rule.key === column.key) ? 'other' : 'none';
	}

	return primaryRule.direction === 'asc' ? 'ascending' : 'descending';
}

function sortDirectionForColumn(column) {
	if (internalSort.value.key === column.key && internalSort.value.direction) return internalSort.value.direction;
	const rule = activeSortRules.value.find((item) => item.key === column.key);
	return rule?.direction || '';
}

function sortRankForColumn(column) {
	const index = activeSortRules.value.findIndex((rule) => rule.key === column.key);
	return index >= 0 ? index + 1 : 0;
}

function sortButtonLabel(column) {
	const direction = sortDirectionForColumn(column);
	if (direction === 'asc') return `Sort ${column.label} descending`;
	if (direction === 'desc') return props.multiSort ? `Remove ${column.label} sort` : `Clear ${column.label} sort`;
	return `Sort ${column.label} ascending`;
}

function compareRows(a, b, rules) {
	for (const rule of rules) {
		const result = compareRowsByRule(a, b, rule);
		if (result !== 0) return result;
	}
	return 0;
}

function compareRowsByRule(a, b, rule) {
	const column = visibleColumns.value.find((item) => item.key === rule.key);

	if (typeof rule.compare === 'function') {
		const result = Number(rule.compare(a, b, rule, { column, columns: visibleColumns.value }));
		if (Number.isFinite(result) && result !== 0) return rule.direction === 'desc' ? result * -1 : result;
		return 0;
	}

	const av = sortableValue(sortRuleValue(a, column, rule), column || rule);
	const bv = sortableValue(sortRuleValue(b, column, rule), column || rule);
	const result = av > bv ? 1 : av < bv ? -1 : 0;
	return rule.direction === 'desc' ? result * -1 : result;
}

function sortRuleValue(row, column, rule) {
	if (typeof rule.accessor === 'function') return rule.accessor(row, column || rule);
	if (column && typeof column.sortAccessor === 'function') return column.sortAccessor(row, column);
	if (column) return cellValue(row, column);
	return row?.[rule.field || rule.key];
}

function sortableValue(value, column) {
	if (value === null || value === undefined || value === '') return '';
	if (column.type === 'number' || column.type === 'currency') {
		const number = Number(value);
		return Number.isFinite(number) ? number : 0;
	}
	if (column.type === 'date') return dateKey(value);
	if (column.type === 'boolean') return value ? 1 : 0;
	return String(value).toLowerCase();
}

function rowMatchesSearch(row) {
	const needle = internalSearch.value.trim().toLowerCase();
	if (!needle) return true;

	return visibleColumns.value
		.filter((column) => column.searchable)
		.some((column) => String(formattedCell(row, column)).toLowerCase().includes(needle));
}

function rowMatchesFilters(row) {
	return visibleColumns.value.every((column) => rowMatchesFilter(row, column));
}

function rowMatchesFilter(row, column) {
	if (!column.filterable) return true;

	const filter = activeFilters.value[column.key];
	if (!isFilterActive(filter, column)) return true;

	const value = cellValue(row, column);
	const type = column.type;

	if (type === 'number' || type === 'currency') {
		const number = Number(value);
		if (!Number.isFinite(number)) return false;
		if (filter.min !== '' && filter.min !== null && filter.min !== undefined && number < Number(filter.min)) return false;
		if (filter.max !== '' && filter.max !== null && filter.max !== undefined && number > Number(filter.max)) return false;
		return true;
	}

	if (type === 'date') {
		const key = dateKey(value);
		if (!key) return false;
		if (filter.start && key < filter.start) return false;
		if (filter.end && key > filter.end) return false;
		return true;
	}

	if (type === 'boolean') {
		if (filter.value === '' || filter.value === null || filter.value === undefined) return true;
		return Boolean(value) === parseBoolean(filter.value);
	}

	if (type === 'select') {
		const values = Array.isArray(filter.values) ? filter.values : [];
		if (!values.length) return true;
		return values.some((item) => String(item) === String(value));
	}

	const haystack = String(value ?? '').toLowerCase();
	const needle = String(filter.value ?? '').trim().toLowerCase();
	if (!needle) return true;
	if (filter.operator === 'equals') return haystack === needle;
	if (filter.operator === 'starts') return haystack.startsWith(needle);
	return haystack.includes(needle);
}

function parseBoolean(value) {
	return value === true || value === 'true';
}

function defaultFilterForColumn(column) {
	if (column.type === 'number' || column.type === 'currency') return { type: column.type, min: '', max: '' };
	if (column.type === 'date') return { type: 'date', start: '', end: '' };
	if (column.type === 'boolean') return { type: 'boolean', value: '' };
	if (column.type === 'select') return { type: 'select', values: [] };
	return { type: 'text', operator: 'contains', value: '' };
}

function normalizeFilter(column, filter) {
	return {
		...defaultFilterForColumn(column),
		...(filter || {}),
		type: column.type,
	};
}

function normalizeFilterMap(filters) {
	const next = {};
	const source = filters && typeof filters === 'object' ? filters : {};
	for (const column of visibleColumns.value) {
		if (!column.filterable) continue;

		const filter = normalizeFilter(column, source[column.key]);
		if (isFilterActive(filter, column)) next[column.key] = filter;
	}
	return next;
}

function isFilterActive(filter, column) {
	if (!filter) return false;
	const type = column?.type || filter.type;
	if (type === 'number' || type === 'currency') return filter.min !== '' && filter.min !== null && filter.min !== undefined || filter.max !== '' && filter.max !== null && filter.max !== undefined;
	if (type === 'date') return Boolean(filter.start || filter.end);
	if (type === 'boolean') return filter.value !== '' && filter.value !== null && filter.value !== undefined;
	if (type === 'select') return Array.isArray(filter.values) && filter.values.length > 0;
	return String(filter.value ?? '').trim().length > 0;
}

function syncFilterDrafts() {
	const availableKeys = new Set(visibleColumns.value.filter((column) => column.filterable).map((column) => column.key));
	for (const key of Object.keys(filterDrafts)) {
		if (!availableKeys.has(key)) delete filterDrafts[key];
	}

	for (const column of visibleColumns.value) {
		if (!column.filterable) continue;

		filterDrafts[column.key] = {
			...defaultFilterForColumn(column),
			...(internalFilters.value[column.key] || {}),
		};
	}
}

function applyFilter(column) {
	if (!column.filterable) return;

	const draft = filterDrafts[column.key] || defaultFilterForColumn(column);
	const next = {
		...internalFilters.value,
		[column.key]: normalizeFilter(column, draft),
	};

	if (!isFilterActive(next[column.key], column)) delete next[column.key];
	setFilters(next);
}

function clearColumnFilter(column) {
	const next = { ...internalFilters.value };
	delete next[column.key];
	setFilters(next);
	filterDrafts[column.key] = defaultFilterForColumn(column);
}

function clearFilters() {
	setFilters({});
	internalSearch.value = '';
	emit('update:search', '');
	syncFilterDrafts();
}

function setFilters(next) {
	internalFilters.value = normalizeFilterMap(next);
	const cloned = cloneFilterMap(internalFilters.value);
	emit('update:filters', cloned);
	emit('filter-change', cloned);
}

function updateSearch(value) {
	internalSearch.value = value;
	emit('update:search', value);
}

function filterSummary(column, filter) {
	if (!isFilterActive(filter, column)) return '';
	if (column.type === 'number' || column.type === 'currency') {
		const min = filter.min !== '' && filter.min !== null && filter.min !== undefined ? `>= ${filter.min}` : '';
		const max = filter.max !== '' && filter.max !== null && filter.max !== undefined ? `<= ${filter.max}` : '';
		return [min, max].filter(Boolean).join(' ');
	}
	if (column.type === 'date') {
		if (filter.start && filter.end) return `${filter.start} to ${filter.end}`;
		if (filter.start) return `From ${filter.start}`;
		return `Until ${filter.end}`;
	}
	if (column.type === 'boolean') return parseBoolean(filter.value) ? 'Yes' : 'No';
	if (column.type === 'select') return filter.values.map((value) => optionLabel(column, value)).join(', ');
	return `${filter.operator === 'equals' ? '=' : filter.operator === 'starts' ? 'Starts' : 'Contains'} ${filter.value}`;
}

function cloneFilterMap(filters) {
	return Object.fromEntries(Object.entries(filters || {}).map(([key, value]) => [key, cloneFilter(value)]));
}

function cloneFilter(filter) {
	return {
		...filter,
		...(Array.isArray(filter?.values) ? { values: [...filter.values] } : {}),
	};
}

function cloneQuery(value) {
	return {
		search: value.search,
		filters: cloneFilterMap(value.filters),
		sort: cloneSort(value.sort),
	};
}

function cloneSort(sort) {
	if (!sort) return null;
	return {
		...sort,
		...(Array.isArray(sort.rules) ? { rules: sort.rules.map((rule) => ({ ...rule })) } : {}),
	};
}

function toggleDraftOption(column, value) {
	const draft = filterDrafts[column.key];
	if (!draft) return;
	const values = new Set(Array.isArray(draft.values) ? draft.values.map(String) : []);
	const key = String(value);
	if (values.has(key)) values.delete(key);
	else values.add(key);
	draft.values = [...values];
}

function setDraftBoolean(column, value) {
	if (!filterDrafts[column.key]) filterDrafts[column.key] = defaultFilterForColumn(column);
	filterDrafts[column.key].value = value;
}

function toggleRowSelection(row, index) {
	const key = rowKey(row, index);
	const next = new Set(internalSelectedKeys.value);
	if (next.has(key)) next.delete(key);
	else next.add(key);
	setSelectedKeys([...next]);
}

function toggleVisibleSelection() {
	if (allVisibleSelected.value) {
		const visible = new Set(visibleSelectableKeys.value);
		setSelectedKeys(internalSelectedKeys.value.filter((key) => !visible.has(key)));
		return;
	}

	setSelectedKeys([...new Set([...internalSelectedKeys.value, ...visibleSelectableKeys.value])]);
}

function setSelectedKeys(keys) {
	internalSelectedKeys.value = keys;
	const cloned = [...keys];
	emit('update:selectedKeys', cloned);
	emit('selection-change', cloned);
}

function rowSelected(row, index) {
	return selectedKeySet.value.has(rowKey(row, index));
}

function columnLetter(index) {
	let value = '';
	let number = index + 1;
	while (number > 0) {
		const modulo = (number - 1) % 26;
		value = String.fromCharCode(65 + modulo) + value;
		number = Math.floor((number - modulo) / 26);
	}
	return value;
}

function cellAlignClass(column) {
	return {
		left: 'text-left',
		center: 'text-center',
		right: 'text-right tabular-nums',
	}[column.align] || 'text-left';
}

function rowDensityClass() {
	return props.density === 'comfortable' ? 'h-12' : 'h-9';
}

function refreshViewportMetrics() {
	if (!scrollViewport.value) return;
	updateViewportMetrics(scrollViewport.value);
}

function updateViewportMetrics(element) {
	viewportState.scrollTop = element.scrollTop;
	viewportState.clientHeight = element.clientHeight;
	viewportState.clientWidth = element.clientWidth;
	if (headerElement.value) headerHeight.value = headerElement.value.offsetHeight;
}

function onViewportScroll(event) {
	const element = event.currentTarget;
	updateViewportMetrics(element);

	const remaining = Math.max(0, element.scrollHeight - element.scrollTop - element.clientHeight);
	const payload = {
		scrollTop: element.scrollTop,
		scrollHeight: element.scrollHeight,
		clientHeight: element.clientHeight,
		remaining,
		atEnd: remaining <= 32,
	};

	emit('viewport-scroll', payload);
	if (payload.atEnd) emit('viewport-end', payload);
}

function cellContext(row, column, rowIndex) {
	return {
		row,
		column,
		value: cellValue(row, column),
		formatted: formattedCell(row, column),
		rowIndex,
		rowKey: rowKey(row, rowIndex),
	};
}

function onCellComponentUpdate(row, column, rowIndex, value) {
	emit('cell-update', {
		...cellContext(row, column, rowIndex),
		value,
		previousValue: cellValue(row, column),
		source: 'component',
	});
}

function onCellComponentAction(row, column, rowIndex, payload) {
	emit('cell-action', {
		...cellContext(row, column, rowIndex),
		action: payload?.action ?? payload?.type ?? payload,
		payload,
	});
}

/**
 * Normalises a column pin value.
 *
 * @param {unknown} value Pin value from a column or pin map.
 * @returns {'left'|'right'|''} Pinned side, or empty when unpinned.
 */
function normalizePin(value) {
	if (value === true || value === 'left') return 'left';
	if (value === 'right') return 'right';
	return '';
}

function normalizePinMap(map) {
	return Object.fromEntries(Object.entries(map).map(([key, value]) => [key, normalizePin(value)]));
}

function columnPin(column) {
	if (props.pinnedColumns && typeof props.pinnedColumns === 'object') return internalPins.value[column.key] || '';
	if (Object.hasOwn(internalPins.value, column.key)) return internalPins.value[column.key];
	return column.pinned || '';
}

/**
 * Pins a column from the column menu and emits the full pin map.
 *
 * @param {DataGridColumn} column Column to pin.
 * @param {'left'|'right'|''} side Side to pin to, or empty to unpin.
 */
function setColumnPin(column, side) {
	const pin = normalizePin(side);
	const next = {};
	for (const item of normalizedColumns.value) {
		const value = item.key === column.key ? pin : columnPin(item);
		if (value) next[item.key] = value;
	}
	internalPins.value = props.pinnedColumns ? next : { ...internalPins.value, [column.key]: pin };
	emit('update:pinnedColumns', next);
}

function pinInfo(column) {
	return pinLayout.value.columns[column.key] || null;
}

function pinStyle(column) {
	const pin = pinInfo(column);
	return pin ? { [pin.side]: `${pin.offset}px` } : null;
}

function utilityPinStyle(kind) {
	if (!pinLayout.value.hasLeft) return null;
	return { left: kind === 'number' && props.selectable ? '44px' : '0px' };
}

function pinAttrs(column) {
	const pin = pinInfo(column);
	if (!pin) return {};
	return pin.edge ? { 'data-pin': pin.side, 'data-pin-edge': pin.side } : { 'data-pin': pin.side };
}

function utilityPinAttrs() {
	return pinLayout.value.hasLeft ? { 'data-pin': 'left' } : {};
}

function bodyCellPositionClass(column) {
	return pinInfo(column) ? 'sticky z-10' : 'relative';
}

function utilityCellPositionClass() {
	return pinLayout.value.hasLeft ? 'sticky z-10' : '';
}

/**
 * Classes for header cells, which may stick to the top, a side, or both.
 *
 * @param {boolean} pinned Whether the cell is pinned to a side.
 * @param {string} background Background classes used while sticky.
 * @returns {string|Array<string>} Header cell classes.
 */
function headerCellClass(pinned, background) {
	if (!props.stickyHeader && !pinned) return '';
	return ['sticky', pinned ? 'z-30' : 'z-20', background];
}

function headerCellStyle(top, sideStyle) {
	if (!props.stickyHeader) return sideStyle;
	return { top, ...(sideStyle || {}) };
}

function normalizeGroupBy(value) {
	const keys = Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : [];
	return [...new Set(keys.map(String).filter(Boolean))];
}

/**
 * Sets the grouped columns and emits them in the shape the parent supplied.
 *
 * @param {Array<string>} keys Ordered column keys.
 */
function setGroupBy(keys) {
	internalGroupBy.value = normalizeGroupBy(keys);
	const next = typeof props.groupBy === 'string' && internalGroupBy.value.length <= 1
		? internalGroupBy.value[0] || ''
		: [...internalGroupBy.value];
	emit('update:groupBy', next);
}

function toggleGroupColumn(column) {
	const keys = internalGroupBy.value;
	setGroupBy(keys.includes(column.key) ? keys.filter((key) => key !== column.key) : [...keys, column.key]);
}

function isGroupedColumn(column) {
	return internalGroupBy.value.includes(column.key);
}

function rowItem(entry) {
	return { type: 'row', row: entry.row, index: entry.index, key: `row:${rowKey(entry.row, entry.index)}` };
}

function groupValueKey(value, column) {
	if (value === null || value === undefined || value === '') return blankGroupKey;
	if (column.type === 'date') return dateKey(value) || String(value);
	if (column.type === 'boolean') return value ? 'true' : 'false';
	return String(value);
}

function groupExpanded(id) {
	return id in groupOpenState ? groupOpenState[id] : groupDefaultOpen.value;
}

/**
 * Builds group header items and their rows, in the order rows first appear.
 *
 * @param {Array<{ row: object, index: number }>} entries Sorted rows with their display index.
 * @param {number} level Group depth.
 * @param {string} parentId Parent group id.
 * @param {Array<object>} items Output list.
 * @param {boolean} respectCollapse Skip rows inside collapsed groups.
 */
function appendGroupItems(entries, level, parentId, items, respectCollapse) {
	const column = groupColumns.value[level];
	if (!column) {
		for (const entry of entries) items.push(rowItem(entry));
		return;
	}

	const buckets = new Map();
	for (const entry of entries) {
		const value = cellValue(entry.row, column);
		const key = groupValueKey(value, column);
		let bucket = buckets.get(key);
		if (!bucket) {
			bucket = { value, entries: [] };
			buckets.set(key, bucket);
		}
		bucket.entries.push(entry);
	}

	for (const [key, bucket] of orderedGroupBuckets(buckets, column)) {
		const id = `${parentId}/${column.key}:${key}`;
		const expanded = groupExpanded(id);
		const rows = bucket.entries.map((entry) => entry.row);
		items.push({
			type: 'group',
			id,
			key: `group:${id}`,
			level,
			column,
			value: bucket.value,
			label: key === blankGroupKey ? '(Blank)' : formatValue(bucket.value, rows[0], column) || String(bucket.value),
			count: rows.length,
			entries: bucket.entries,
			aggregates: respectCollapse ? computeAggregates(rows) : {},
			expanded,
		});
		if (expanded || !respectCollapse) appendGroupItems(bucket.entries, level + 1, id, items, respectCollapse);
	}
}

/**
 * Orders groups by their value, ascending, with blanks last. When the primary
 * sort is on the grouped column its direction applies, so edits to other
 * columns never reshuffle the groups.
 *
 * @param {Map<string, { value: unknown }>} buckets Groups keyed by value key.
 * @param {DataGridColumn} column Grouped column.
 * @returns {Array<[string, object]>} Ordered group entries.
 */
function orderedGroupBuckets(buckets, column) {
	const rule = activeSortRules.value[0];
	const direction = rule && rule.key === column.key && rule.direction === 'desc' ? -1 : 1;
	return [...buckets.entries()].sort(([leftKey, left], [rightKey, right]) => {
		if (leftKey === blankGroupKey || rightKey === blankGroupKey) return leftKey === rightKey ? 0 : leftKey === blankGroupKey ? 1 : -1;
		const a = sortableValue(left.value, column);
		const b = sortableValue(right.value, column);
		return (a > b ? 1 : a < b ? -1 : 0) * direction;
	});
}

function toggleGroup(item) {
	groupOpenState[item.id] = !item.expanded;
}

function setAllGroups(open) {
	for (const key of Object.keys(groupOpenState)) delete groupOpenState[key];
	groupDefaultOpen.value = open;
}

function groupRowKeys(item) {
	return item.entries.map((entry) => rowKey(entry.row, entry.index));
}

function groupSelectionState(item) {
	const keys = groupRowKeys(item);
	const selected = keys.filter((key) => selectedKeySet.value.has(key)).length;
	return { all: selected > 0 && selected === keys.length, some: selected > 0 && selected < keys.length };
}

function toggleGroupSelection(item) {
	const keys = groupRowKeys(item);
	if (groupSelectionState(item).all) {
		const remove = new Set(keys);
		setSelectedKeys(internalSelectedKeys.value.filter((key) => !remove.has(key)));
		return;
	}
	setSelectedKeys([...new Set([...internalSelectedKeys.value, ...keys])]);
}

function rowIndent(column, columnIndex) {
	if (columnIndex !== 0 || !groupColumns.value.length) return null;
	return { paddingLeft: `${12 + groupColumns.value.length * 16}px` };
}

/**
 * Aggregates every aggregate column over a set of rows.
 *
 * @param {Array<object>} rows Rows to aggregate.
 * @returns {Record<string, unknown>} Aggregate values keyed by column key.
 */
function computeAggregates(rows) {
	const result = {};
	for (const column of aggregateColumns.value) result[column.key] = aggregateValue(rows, column);
	return result;
}

function aggregateValue(rows, column) {
	if (typeof column.aggregate === 'function') return column.aggregate(rows.map((row) => cellValue(row, column)), rows, column);
	if (column.aggregate === 'count') return rows.length;

	const isDate = column.type === 'date';
	let total = 0;
	let count = 0;
	let min = null;
	let max = null;
	for (const row of rows) {
		const raw = cellValue(row, column);
		if (raw === null || raw === undefined || raw === '') continue;
		const value = isDate ? dateKey(raw) : Number(raw);
		if (isDate ? !value : !Number.isFinite(value)) continue;
		count += 1;
		if (!isDate) total += value;
		if (min === null || value < min) min = value;
		if (max === null || value > max) max = value;
	}

	if (!count) return null;
	if (column.aggregate === 'min') return min;
	if (column.aggregate === 'max') return max;
	if (isDate) return null;
	if (column.aggregate === 'avg') return total / count;
	return total;
}

function formatAggregate(value, column) {
	if (value === null || value === undefined || value === '') return '';
	const kind = typeof column.aggregate === 'function' ? 'custom' : column.aggregate;
	if (typeof column.formatAggregate === 'function') return column.formatAggregate(value, column, kind);
	if (kind === 'count') return new Intl.NumberFormat(column.locale || 'en-GB').format(value);
	return formatValue(value, null, { ...column, format: undefined });
}

function aggregateLabel(column) {
	return { sum: 'Sum', avg: 'Average', count: 'Count', min: 'Minimum', max: 'Maximum' }[column.aggregate] || 'Total';
}

function cellInRange(line, col) {
	const rect = rangeRect.value;
	return Boolean(rect) && line >= rect.top && line <= rect.bottom && col >= rect.left && col <= rect.right;
}

function focusCell() {
	return rangeAnchor.value || activeCell.value;
}

/**
 * Attributes for a data cell: column index, pin side, and range state.
 *
 * @param {{ line: number }} item Row item.
 * @param {DataGridColumn} column Column definition.
 * @param {number} col Visible column index.
 * @returns {Record<string, string|number|undefined>} Cell attributes.
 */
function cellAttrs(item, column, col) {
	const attrs = { 'aria-colindex': col + 1 + utilityColumnCount.value, ...pinAttrs(column) };
	if (!props.cellSelection) return attrs;

	const focus = focusCell();
	const inRange = cellInRange(item.line, col);
	attrs['data-cell'] = `${item.line}:${col}`;
	attrs['aria-selected'] = inRange ? 'true' : 'false';
	if (inRange && !singleCellRange.value) attrs['data-in-range'] = '';
	if (focus && focus.row === item.line && focus.col === col) attrs['data-active'] = '';
	return attrs;
}

function isInteractiveTarget(target, boundary) {
	const element = target instanceof Element ? target.closest(interactiveSelector) : null;
	return Boolean(element) && element !== boundary && Boolean(boundary?.contains(element));
}

function focusGrid() {
	scrollViewport.value?.focus({ preventScroll: true });
}

function gridHasFocus() {
	const viewport = scrollViewport.value;
	if (!viewport || typeof document === 'undefined') return false;
	const active = document.activeElement;
	return viewport.contains(active) && (active === viewport || !isInteractiveTarget(active, viewport));
}

function onCellPointerDown(item, col, event) {
	if (!props.cellSelection || event.button !== 0) return;
	if (isInteractiveTarget(event.target, event.currentTarget)) return;
	if (editingCell.value && !(editingCell.value.line === item.line && editingCell.value.col === col)) commitEdit(null, { refocus: false });
	if (editingCell.value) return;

	const cell = { row: item.line, col };
	if (event.shiftKey && activeCell.value) {
		if (!rangeAnchor.value) rangeAnchor.value = { ...activeCell.value };
		activeCell.value = cell;
	} else {
		activeCell.value = cell;
		rangeAnchor.value = { ...cell };
	}
	rangeDragging = true;
	focusGrid();
}

function onCellPointerEnter(item, col) {
	if (!rangeDragging || !props.cellSelection) return;
	if (activeCell.value?.row === item.line && activeCell.value?.col === col) return;
	activeCell.value = { row: item.line, col };
}

function stopRangeDrag() {
	rangeDragging = false;
}

function onCellDoubleClick(item, column, col, event) {
	if (!props.cellSelection && !props.editable) return;
	if (isInteractiveTarget(event.target, event.currentTarget)) return;
	startEdit(item, column, col);
}

/**
 * Moves the range head to a cell, collapsing the range unless extending.
 *
 * @param {number} row Visible row position.
 * @param {number} col Visible column index.
 * @param {boolean} [extend] Keep the anchor and extend the range.
 */
function moveTo(row, col, extend = false) {
	const lastRow = navRows.value.length - 1;
	const lastCol = visibleColumns.value.length - 1;
	if (lastRow < 0 || lastCol < 0) return;

	const cell = {
		row: Math.max(0, Math.min(lastRow, row)),
		col: Math.max(0, Math.min(lastCol, col)),
	};
	if (extend) {
		if (!rangeAnchor.value) rangeAnchor.value = { ...activeCell.value };
	} else {
		rangeAnchor.value = { ...cell };
	}
	activeCell.value = cell;
	scrollCellIntoView(cell.row, cell.col);
}

function moveActive(rowDelta, colDelta, { extend = false, jump = false, wrap = false } = {}) {
	const origin = extend ? activeCell.value : focusCell();
	if (!origin) {
		moveTo(0, 0);
		return;
	}

	const lastRow = navRows.value.length - 1;
	const lastCol = visibleColumns.value.length - 1;
	let row = jump ? (rowDelta < 0 ? 0 : rowDelta > 0 ? lastRow : origin.row) : origin.row + rowDelta;
	let col = jump ? (colDelta < 0 ? 0 : colDelta > 0 ? lastCol : origin.col) : origin.col + colDelta;
	if (wrap && col > lastCol && row < lastRow) {
		col = 0;
		row += 1;
	} else if (wrap && col < 0 && row > 0) {
		col = lastCol;
		row -= 1;
	}
	moveTo(row, col, extend);
}

function scrollCellIntoView(row, col) {
	nextTick(() => {
		const viewport = scrollViewport.value;
		if (!viewport) return;
		const selector = `[data-cell="${row}:${col}"]`;
		const cell = viewport.querySelector(selector);
		if (cell || !props.virtualRows) {
			cell?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
			return;
		}

		const item = navRows.value[row];
		if (!item) return;
		viewport.scrollTop = Math.max(0, item.position * virtualRowHeightPx.value - viewport.clientHeight / 2);
		updateViewportMetrics(viewport);
		nextTick(() => viewport.querySelector(selector)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
	});
}

function pageRowCount() {
	const height = scrollViewport.value?.clientHeight || 0;
	return Math.max(1, Math.floor((height - headerHeight.value) / virtualRowHeightPx.value) - 1);
}

function onGridKeydown(event) {
	if (!props.cellSelection || editingCell.value || event.defaultPrevented) return;
	if (event.target !== scrollViewport.value && isInteractiveTarget(event.target, scrollViewport.value)) return;

	const mod = event.metaKey || event.ctrlKey;
	const key = event.key;
	const lower = key.length === 1 ? key.toLowerCase() : key;

	if (mod && lower === 'z') {
		event.preventDefault();
		if (event.shiftKey) redo();
		else undo();
		return;
	}
	if (mod && lower === 'y') {
		event.preventDefault();
		redo();
		return;
	}
	if (!navRows.value.length || !visibleColumns.value.length) return;
	if (mod && lower === 'a') {
		event.preventDefault();
		selectAll();
		return;
	}

	const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
	if (moves[key]) {
		event.preventDefault();
		if (!activeCell.value) moveTo(0, 0);
		else moveActive(moves[key][0], moves[key][1], { extend: event.shiftKey, jump: mod });
		return;
	}

	const focus = focusCell();
	if (!focus) return;

	if (key === 'Tab') {
		event.preventDefault();
		moveActive(0, event.shiftKey ? -1 : 1, { wrap: true });
	} else if (key === 'Home' || key === 'End') {
		event.preventDefault();
		const row = mod ? (key === 'Home' ? 0 : navRows.value.length - 1) : activeCell.value.row;
		moveTo(row, key === 'Home' ? 0 : visibleColumns.value.length - 1, event.shiftKey);
	} else if (key === 'PageDown' || key === 'PageUp') {
		event.preventDefault();
		moveActive((key === 'PageDown' ? 1 : -1) * pageRowCount(), 0, { extend: event.shiftKey });
	} else if (key === 'Enter' || key === 'F2') {
		event.preventDefault();
		if (!startEditAt(focus) && key === 'Enter') moveActive(event.shiftKey ? -1 : 1, 0);
	} else if (key === 'Delete' || key === 'Backspace') {
		event.preventDefault();
		clearRangeValues('delete');
	} else if (key === 'Escape') {
		if (!singleCellRange.value) {
			event.preventDefault();
			activeCell.value = { ...focus };
			rangeAnchor.value = { ...focus };
		}
	} else if (!mod && !event.altKey && key.length === 1) {
		if (startEditAt(focus, key)) event.preventDefault();
	}
}

function selectAll() {
	rangeAnchor.value = { row: 0, col: 0 };
	activeCell.value = { row: navRows.value.length - 1, col: visibleColumns.value.length - 1 };
}

/**
 * Selects a cell range. Columns may be visible indexes or column keys.
 *
 * @param {{ startRow: number, endRow?: number, startColumn: number|string, endColumn?: number|string }} range Range to select.
 */
function selectRange(range) {
	if (!range || !navRows.value.length) return;
	const columnIndex = (value) => typeof value === 'string'
		? visibleColumns.value.findIndex((column) => column.key === value)
		: Number(value);
	const startCol = columnIndex(range.startColumn ?? 0);
	const endCol = columnIndex(range.endColumn ?? range.startColumn ?? 0);
	if (startCol < 0 || endCol < 0) return;
	rangeAnchor.value = { row: Math.max(0, Number(range.startRow) || 0), col: startCol };
	moveTo(Number(range.endRow ?? range.startRow) || 0, endCol, true);
}

function clearRange() {
	activeCell.value = null;
	rangeAnchor.value = null;
	editingCell.value = null;
}

function rangePayload(rect) {
	return {
		startRow: rect.top,
		endRow: rect.bottom,
		startColumn: rect.left,
		endColumn: rect.right,
		rows: navRows.value.slice(rect.top, rect.bottom + 1).map((item) => item.row),
		columns: visibleColumns.value.slice(rect.left, rect.right + 1).map((column) => column.key),
	};
}

function getRange() {
	return rangeRect.value ? rangePayload(rangeRect.value) : null;
}

function showNotice(message) {
	gridNotice.value = message;
	if (noticeTimer) clearTimeout(noticeTimer);
	noticeTimer = setTimeout(() => {
		gridNotice.value = '';
	}, 4000);
}

/**
 * Plain value used for clipboard copy and CSV: raw numbers, ISO dates,
 * TRUE/FALSE booleans and option labels, so spreadsheets keep the types.
 *
 * @param {Record<string, unknown>} row Row record.
 * @param {DataGridColumn} column Column definition.
 * @returns {string|number} Plain cell value.
 */
function plainValue(row, column) {
	const value = cellValue(row, column);
	if (typeof column.exportValue === 'function') return column.exportValue(value, row, column);
	if (value === null || value === undefined || value === '') return '';
	if (column.type === 'number' || column.type === 'currency') {
		const number = Number(value);
		return Number.isFinite(number) ? number : String(value);
	}
	if (column.type === 'date') return dateKey(value) || String(value);
	if (column.type === 'boolean') return value ? 'TRUE' : 'FALSE';
	if (column.type === 'select') return optionLabel(column, value);
	if (typeof value === 'object') return formattedCell(row, column);
	return String(value);
}

function rangeText() {
	const rect = rangeRect.value;
	const rows = [];
	for (let line = rect.top; line <= rect.bottom; line += 1) {
		const item = navRows.value[line];
		if (!item) break;
		const cells = [];
		for (let col = rect.left; col <= rect.right; col += 1) {
			const column = visibleColumns.value[col];
			cells.push(column ? plainValue(item.row, column) : '');
		}
		rows.push(cells);
	}
	return toTsv(rows);
}

function canUseClipboard() {
	return props.cellSelection && !editingCell.value && Boolean(rangeRect.value) && gridHasFocus();
}

function onDocumentCopy(event) {
	if (!canUseClipboard() || !event.clipboardData) return;
	event.clipboardData.setData('text/plain', rangeText());
	event.preventDefault();
	const summary = rangeSummary.value;
	showNotice(`Copied ${summary ? summary.cells : 1} ${summary && summary.cells !== 1 ? 'cells' : 'cell'}`);
}

function onDocumentCut(event) {
	if (!canUseClipboard() || !event.clipboardData) return;
	event.clipboardData.setData('text/plain', rangeText());
	event.preventDefault();
	clearRangeValues('cut');
}

function onDocumentPaste(event) {
	if (!canUseClipboard() || !event.clipboardData) return;
	const text = event.clipboardData.getData('text/plain');
	if (!text) return;
	event.preventDefault();
	pasteText(text);
}

/**
 * Pastes tab-separated text at the range. A copied block repeats to fill a
 * larger range when it divides evenly, as spreadsheets do.
 *
 * @param {string} text Clipboard text.
 */
function pasteText(text) {
	const rect = rangeRect.value;
	const matrix = parseTsv(text);
	if (!rect || !matrix.length) return;

	const sourceHeight = matrix.length;
	const sourceWidth = Math.max(...matrix.map((row) => row.length));
	const rectHeight = rect.bottom - rect.top + 1;
	const rectWidth = rect.right - rect.left + 1;
	const fill = rectHeight * rectWidth > 1 && rectHeight % sourceHeight === 0 && rectWidth % sourceWidth === 0;
	const height = fill ? rectHeight : sourceHeight;
	const width = fill ? rectWidth : sourceWidth;
	const changes = [];
	let skipped = 0;

	for (let rowOffset = 0; rowOffset < height; rowOffset += 1) {
		const item = navRows.value[rect.top + rowOffset];
		if (!item) break;
		for (let colOffset = 0; colOffset < width; colOffset += 1) {
			const column = visibleColumns.value[rect.left + colOffset];
			if (!column) break;
			if (!isCellEditable(item.row, column)) {
				skipped += 1;
				continue;
			}
			const raw = matrix[rowOffset % sourceHeight][colOffset % sourceWidth] ?? '';
			const parsed = parseInput(raw, column, item.row);
			if (parsed.error || validationMessage(parsed.value, item.row, column)) {
				skipped += 1;
				continue;
			}
			changes.push(buildChange(item, column, parsed.value));
		}
	}

	const applied = applyChanges(changes, 'paste');
	const lastRow = Math.min(navRows.value.length - 1, rect.top + height - 1);
	const lastCol = Math.min(visibleColumns.value.length - 1, rect.left + width - 1);
	rangeAnchor.value = { row: rect.top, col: rect.left };
	activeCell.value = { row: lastRow, col: lastCol };
	showNotice(`Pasted ${applied} ${applied === 1 ? 'cell' : 'cells'}${skipped ? `, skipped ${skipped} read-only or invalid` : ''}`);
}

function clearRangeValues(source) {
	const rect = rangeRect.value;
	if (!rect) return;
	const changes = [];
	for (let line = rect.top; line <= rect.bottom; line += 1) {
		const item = navRows.value[line];
		if (!item) break;
		for (let col = rect.left; col <= rect.right; col += 1) {
			const column = visibleColumns.value[col];
			if (column && isCellEditable(item.row, column)) changes.push(buildChange(item, column, column.type === 'boolean' ? false : null));
		}
	}
	applyChanges(changes, source);
}

function isCellEditable(row, column) {
	if (typeof column.editable === 'function') return Boolean(column.editable(row, column));
	if (column.editable !== undefined) return Boolean(column.editable);
	return props.editable && !column.component && typeof column.accessor !== 'function';
}

function buildChange(item, column, value) {
	return {
		row: item.row,
		column,
		rowIndex: item.index,
		rowKey: rowKey(item.row, item.index),
		value,
		previousValue: cellValue(item.row, column),
	};
}

function emptyValue(value) {
	return value === null || value === undefined || value === '';
}

function sameValue(left, right) {
	if (emptyValue(left) || emptyValue(right)) return emptyValue(left) && emptyValue(right);
	return left === right || String(left) === String(right);
}

/**
 * Emits cell changes and records them for undo. The grid never mutates rows;
 * parents apply `value` to their data.
 *
 * @param {Array<object>} changes Changes from buildChange.
 * @param {string} source editor, paste, delete, cut, undo or redo.
 * @param {{ record?: boolean }} [options] Whether to add the batch to undo history.
 * @returns {number} Number of changes emitted.
 */
function applyChanges(changes, source, { record = true } = {}) {
	const effective = changes.filter((change) => !sameValue(change.value, change.previousValue));
	if (!effective.length) return 0;

	for (const change of effective) {
		emit('cell-update', {
			...change,
			formatted: formatValue(change.value, change.row, change.column),
			source,
		});
	}
	emit('cells-update', { source, changes: effective.map((change) => ({ ...change })) });

	if (record) {
		editHistory.past.push(effective.map((change) => ({
			rowKey: change.rowKey,
			columnKey: change.column.key,
			value: change.value,
			previousValue: change.previousValue,
		})));
		if (editHistory.past.length > 100) editHistory.past.shift();
		editHistory.future = [];
	}
	return effective.length;
}

function findRowByKey(key) {
	const lists = [displayRows.value, sourceRows.value];
	for (const rows of lists) {
		for (let index = 0; index < rows.length; index += 1) {
			if (rowKey(rows[index], index) === key) return { row: rows[index], index };
		}
	}
	return null;
}

function historyChanges(entry, direction) {
	return entry.map((record) => {
		const found = findRowByKey(record.rowKey);
		const column = normalizedColumns.value.find((item) => item.key === record.columnKey);
		if (!found || !column) return null;
		return {
			row: found.row,
			column,
			rowIndex: found.index,
			rowKey: record.rowKey,
			value: direction === 'undo' ? record.previousValue : record.value,
			previousValue: cellValue(found.row, column),
		};
	}).filter(Boolean);
}

function undo() {
	const entry = editHistory.past.pop();
	if (!entry) return false;
	const count = applyChanges(historyChanges(entry, 'undo'), 'undo', { record: false });
	editHistory.future.push(entry);
	showNotice(`Undid ${count} ${count === 1 ? 'change' : 'changes'}`);
	return true;
}

function redo() {
	const entry = editHistory.future.pop();
	if (!entry) return false;
	const count = applyChanges(historyChanges(entry, 'redo'), 'redo', { record: false });
	editHistory.past.push(entry);
	showNotice(`Redid ${count} ${count === 1 ? 'change' : 'changes'}`);
	return true;
}

/**
 * Parses typed or pasted text into a column value.
 *
 * @param {unknown} input Text from the editor or clipboard.
 * @param {DataGridColumn} column Column definition.
 * @param {Record<string, unknown>} row Row being edited.
 * @returns {{ value?: unknown, error?: string }} Parsed value or an error.
 */
function parseInput(input, column, row) {
	if (typeof column.parse === 'function') {
		try {
			return { value: column.parse(input, column, row) };
		} catch (error) {
			return { error: error?.message || `Invalid ${column.label}` };
		}
	}

	const text = String(input ?? '');
	const trimmed = text.trim();
	if (!trimmed) return { value: null };

	if (column.type === 'number' || column.type === 'currency') {
		const cleaned = trimmed.replace(/[^\d.eE+-]/g, '');
		const number = Number(cleaned);
		return cleaned && Number.isFinite(number) ? { value: number } : { error: `${column.label} must be a number` };
	}
	if (column.type === 'date') {
		const key = dateKey(trimmed);
		return key ? { value: key } : { error: `${column.label} must be a date` };
	}
	if (column.type === 'boolean') {
		const value = trimmed.toLowerCase();
		if (['true', 'yes', 'y', '1', 'x'].includes(value)) return { value: true };
		if (['false', 'no', 'n', '0'].includes(value)) return { value: false };
		return { error: `${column.label} must be yes or no` };
	}
	if (column.type === 'select') {
		const options = optionRecords(column);
		const value = trimmed.toLowerCase();
		const match = options.find((option) => String(option.value).toLowerCase() === value)
			|| options.find((option) => String(option.label).toLowerCase() === value);
		if (match) return { value: match.value };
		if (Array.isArray(column.options) && column.options.length) {
			return { error: `${column.label} must be one of ${options.slice(0, 6).map((option) => option.label).join(', ')}` };
		}
		return { value: trimmed };
	}
	return { value: text };
}

function validationMessage(value, row, column) {
	if (typeof column.validate !== 'function') return '';
	const result = column.validate(value, row, column);
	if (result === true || result === undefined || result === null) return '';
	if (result === false) return `Invalid ${column.label}`;
	return String(result);
}

function startEditAt(cell, initial) {
	const item = navRows.value[cell.row];
	const column = visibleColumns.value[cell.col];
	if (!item || !column) return false;
	return startEdit(item, column, cell.col, initial);
}

/**
 * Opens the inline editor for a cell. Booleans toggle instead of opening one.
 *
 * @param {object} item Row item.
 * @param {DataGridColumn} column Column definition.
 * @param {number} col Visible column index.
 * @param {string} [initial] Character that started the edit; replaces the value.
 * @returns {boolean} Whether editing started.
 */
function startEdit(item, column, col, initial) {
	if (!isCellEditable(item.row, column)) return false;

	if (column.type === 'boolean') {
		if (initial !== undefined && initial !== ' ') return false;
		activeCell.value = { row: item.line, col };
		rangeAnchor.value = { row: item.line, col };
		applyChanges([buildChange(item, column, !cellValue(item.row, column))], 'editor');
		return true;
	}

	const replace = initial !== undefined && column.type !== 'select' && column.type !== 'date';
	activeCell.value = { row: item.line, col };
	rangeAnchor.value = { row: item.line, col };
	editingCell.value = {
		line: item.line,
		col,
		columnKey: column.key,
		draft: replace ? initial : editorDraft(item.row, column),
		error: '',
	};
	nextTick(() => {
		if (!editorElement) return;
		editorElement.focus({ preventScroll: true });
		if (!replace && typeof editorElement.select === 'function') editorElement.select();
	});
	return true;
}

function editorDraft(row, column) {
	const value = cellValue(row, column);
	if (value === null || value === undefined) return '';
	if (column.type === 'date') return dateKey(value);
	return String(value);
}

function isEditingCell(item, col) {
	return Boolean(editingCell.value) && editingCell.value.line === item.line && editingCell.value.col === col;
}

function setEditorElement(element) {
	editorElement = element;
}

/**
 * Commits the open editor. Invalid values keep the editor open with a message.
 *
 * @param {{ row: number, col: number }|null} move Where to move after committing.
 * @param {{ refocus?: boolean }} [options] Whether to return focus to the grid.
 * @returns {boolean} Whether the edit closed.
 */
function commitEdit(move = null, { refocus = true } = {}) {
	const edit = editingCell.value;
	if (!edit) return true;

	const item = navRows.value[edit.line];
	const column = visibleColumns.value[edit.col];
	if (!item || !column || column.key !== edit.columnKey) {
		editingCell.value = null;
		return true;
	}

	const parsed = parseInput(edit.draft, column, item.row);
	const error = parsed.error || validationMessage(parsed.value, item.row, column);
	if (error) {
		edit.error = error;
		if (refocus) nextTick(() => editorElement?.focus({ preventScroll: true }));
		return false;
	}

	editingCell.value = null;
	applyChanges([buildChange(item, column, parsed.value)], 'editor');
	if (move) moveActive(move.row, move.col, { wrap: move.col !== 0 });
	if (refocus) focusGrid();
	return true;
}

function cancelEdit() {
	editingCell.value = null;
	focusGrid();
}

function onEditorKeydown(event) {
	event.stopPropagation();
	if (event.key === 'Enter') {
		event.preventDefault();
		commitEdit({ row: event.shiftKey ? -1 : 1, col: 0 });
	} else if (event.key === 'Tab') {
		event.preventDefault();
		commitEdit({ row: 0, col: event.shiftKey ? -1 : 1 });
	} else if (event.key === 'Escape') {
		event.preventDefault();
		cancelEdit();
	} else if (editingCell.value?.error) {
		editingCell.value.error = '';
	}
}

function onEditorBlur() {
	if (editingCell.value) commitEdit(null, { refocus: false });
}

function exportColumns() {
	return visibleColumns.value.filter((column) => column.exportable !== false);
}

function exportRows(onlySelected) {
	const entries = displayRows.value.map((row, index) => ({ row, index }));
	let ordered = entries;
	if (groupColumns.value.length) {
		const items = [];
		appendGroupItems(entries, 0, '', items, false);
		ordered = items.filter((item) => item.type === 'row');
	}
	if (onlySelected) ordered = ordered.filter((entry) => selectedKeySet.value.has(rowKey(entry.row, entry.index)));
	return ordered.map((entry) => entry.row);
}

function exportCellValue(row, column) {
	if (typeof column.exportValue === 'function') return column.exportValue(cellValue(row, column), row, column);
	if (column.type === 'boolean') {
		const value = cellValue(row, column);
		return emptyValue(value) ? '' : Boolean(value);
	}
	return plainValue(row, column);
}

/**
 * Exports the filtered, sorted (and grouped) rows as CSV.
 *
 * @param {{ onlySelected?: boolean, fileName?: string, download?: boolean }} [options] Export options.
 * @returns {string} CSV text.
 */
function exportCsv(options = {}) {
	const columns = exportColumns();
	const rows = exportRows(options.onlySelected);
	const csv = toCsv(columns.map((column) => column.label), rows.map((row) => columns.map((column) => plainValue(row, column))));
	const fileName = options.fileName || `${exportBaseName.value}.csv`;
	if (options.download !== false) downloadBlob(csvBlob(csv), fileName);
	emit('export', { format: 'csv', rows: rows.length, columns: columns.length, fileName });
	showNotice(`Exported ${rows.length} ${rows.length === 1 ? 'row' : 'rows'} to CSV`);
	return csv;
}

/**
 * Exports the filtered, sorted (and grouped) rows as an Excel workbook with
 * typed number, currency, date and boolean cells.
 *
 * @param {{ onlySelected?: boolean, fileName?: string, download?: boolean }} [options] Export options.
 * @returns {Blob} XLSX file.
 */
function exportExcel(options = {}) {
	const columns = exportColumns();
	const rows = exportRows(options.onlySelected);
	const blob = xlsxBlob({
		name: props.title,
		columns: columns.map((column) => ({
			label: column.label,
			type: column.type,
			width: columnPixelWidth(column),
			currency: column.currency,
			locale: column.locale,
		})),
		rows: rows.map((row) => columns.map((column) => exportCellValue(row, column))),
	});
	const fileName = options.fileName || `${exportBaseName.value}.xlsx`;
	if (options.download !== false) downloadBlob(blob, fileName);
	emit('export', { format: 'xlsx', rows: rows.length, columns: columns.length, fileName });
	showNotice(`Exported ${rows.length} ${rows.length === 1 ? 'row' : 'rows'} to Excel`);
	return blob;
}

function hasColumnMenu(column) {
	return column.filterable || props.columnMenu;
}
</script>

<template>
	<section
		class="dom-data-grid overflow-hidden border-border bg-canvas text-canvas-fg"
		:class="layout === 'flush' ? 'border-y' : 'rounded-lg border shadow-sm'"
		:data-layout="layout"
		:aria-labelledby="titleId"
	>
		<header v-if="toolbar" class="border-b border-border bg-secondary/35 py-3" :class="layout === 'flush' ? gutterClass : 'px-3'">
			<div class="flex flex-wrap items-center gap-3">
				<div class="min-w-0 flex-1">
					<h2 :id="titleId" class="truncate text-sm font-semibold tracking-tight text-canvas-fg">{{ title }}</h2>
					<p class="mt-0.5 text-xs text-muted-fg">
						{{ shownRowCount }} of {{ totalRowCount }} {{ resourceLabel }}
						<span v-if="remote">from resource API</span>
					</p>
				</div>

				<label class="relative min-w-[14rem] flex-1 sm:max-w-xs">
					<span class="sr-only">Search rows</span>
					<svg class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-fg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
					</svg>
					<input
						:value="internalSearch"
						type="search"
						class="skin-input h-9 rounded-md pl-9"
						placeholder="Search rows"
						@input="updateSearch($event.target.value)"
					/>
				</label>

				<slot name="toolbar-actions" :query="query" :clear-filters="clearFilters" :export-csv="exportCsv" :export-excel="exportExcel" />

				<DomPopover
					v-if="exportable"
					position="bottom-end"
					width="w-64"
					padding="p-1"
					:arrow="false"
				>
					<template #trigger>
						<button
							type="button"
							class="skin-control inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold transition hover:brightness-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
						>
							<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
							Export
						</button>
					</template>
					<template #default="{ close }">
						<div class="grid gap-0.5 text-sm">
							<button
								type="button"
								class="grid gap-0.5 rounded-md px-3 py-2 text-left transition hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
								@click="exportExcel(); close();"
							>
								<span class="font-semibold text-canvas-fg">Excel workbook</span>
								<span class="text-xs text-muted-fg">.xlsx with typed numbers, dates and currency</span>
							</button>
							<button
								type="button"
								class="grid gap-0.5 rounded-md px-3 py-2 text-left transition hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
								@click="exportCsv(); close();"
							>
								<span class="font-semibold text-canvas-fg">CSV</span>
								<span class="text-xs text-muted-fg">Comma-separated, UTF-8</span>
							</button>
							<button
								v-if="internalSelectedKeys.length"
								type="button"
								class="grid gap-0.5 rounded-md border-t border-border px-3 py-2 text-left transition hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
								@click="exportExcel({ onlySelected: true }); close();"
							>
								<span class="font-semibold text-canvas-fg">Selected rows to Excel</span>
								<span class="text-xs text-muted-fg">{{ internalSelectedKeys.length }} selected</span>
							</button>
						</div>
					</template>
				</DomPopover>

				<button
					v-if="hasActiveFilters"
					type="button"
					class="skin-control inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold transition hover:brightness-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
					@click="clearFilters"
				>
					<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
					</svg>
					Clear filters
				</button>
			</div>

			<div v-if="activeFilterEntries.length || groupColumns.length" class="mt-3 flex flex-wrap items-center gap-2">
				<span
					v-for="column in groupColumns"
					:key="`group-${column.key}`"
					class="inline-flex max-w-full items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2 py-1 text-xs font-medium text-canvas-fg"
				>
					<svg class="size-3.5 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="M4 6h16M8 12h12M12 18h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
					</svg>
					<span class="truncate">Grouped by {{ column.label }}</span>
					<button
						type="button"
						class="grid size-4 shrink-0 place-items-center rounded text-current/70 transition hover:bg-primary/15 hover:text-current focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
						:aria-label="`Stop grouping by ${column.label}`"
						@click="toggleGroupColumn(column)"
					>
						<svg class="size-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						</svg>
					</button>
				</span>
				<span v-if="groupColumns.length" class="inline-flex gap-1">
					<button type="button" class="rounded-md px-2 py-1 text-xs font-medium text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" @click="setAllGroups(true)">Expand all</button>
					<button type="button" class="rounded-md px-2 py-1 text-xs font-medium text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" @click="setAllGroups(false)">Collapse all</button>
				</span>
				<span
					v-for="entry in activeFilterEntries"
					:key="entry.column.key"
					class="inline-flex max-w-full items-center gap-1.5 rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-xs font-medium text-sky-800 dark:text-sky-200"
				>
					<span class="truncate">{{ entry.column.label }}: {{ entry.summary }}</span>
					<button
						type="button"
						class="grid size-4 shrink-0 place-items-center rounded text-current/70 transition hover:bg-sky-500/15 hover:text-current focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
						:aria-label="`Clear ${entry.column.label} filter`"
						@click="clearColumnFilter(entry.column)"
					>
						<svg class="size-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						</svg>
					</button>
				</span>
			</div>
		</header>

		<div
			ref="scrollViewport"
			class="overflow-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
			data-grid-viewport
			:class="!showTotals && 'pb-3'"
			:style="viewportStyle"
			:tabindex="cellSelection ? 0 : undefined"
			@scroll="onViewportScroll"
			@keydown="onGridKeydown"
		>
			<table
				class="w-full table-fixed border-separate border-spacing-0 text-sm"
				:class="cellSelection && 'select-none'"
				:style="tableStyle"
				:role="cellSelection ? 'grid' : undefined"
				:aria-labelledby="titleId"
				:aria-multiselectable="cellSelection || undefined"
				:aria-rowcount="navRows.length + headerRowCount"
				:aria-colcount="visibleColumns.length + utilityColumnCount"
			>
				<colgroup>
					<col v-if="selectable" class="w-11" />
					<col v-if="showRowNumbers" class="w-[3.375rem]" />
					<col
						v-for="column in visibleColumns"
						:key="column.key"
						:style="{ width: columnWidthStyle(column), minWidth: columnWidthStyle(column) }"
					/>
				</colgroup>

				<thead ref="headerElement" class="text-xs">
					<tr v-if="showColumnLetters" class="bg-secondary/60 text-muted-fg" :class="layout === 'flush' && gutterClass" aria-rowindex="1">
						<th
							v-if="selectable"
							class="border-b border-r border-border px-2 py-1.5 font-semibold"
							:class="headerCellClass(pinLayout.hasLeft, 'bg-secondary')"
							:style="headerCellStyle('0px', utilityPinStyle('select'))"
						></th>
						<th
							v-if="showRowNumbers"
							class="border-b border-r border-border px-2 py-1.5 text-center font-semibold"
							:class="headerCellClass(pinLayout.hasLeft, 'bg-secondary')"
							:style="headerCellStyle('0px', utilityPinStyle('number'))"
						></th>
						<th
							v-for="(column, columnIndex) in visibleColumns"
							:key="`${column.key}-letter`"
							class="border-b border-r border-border px-2 py-1.5 text-center font-semibold last:border-r-0"
							:class="headerCellClass(Boolean(pinInfo(column)), 'bg-secondary')"
							:style="headerCellStyle('0px', pinStyle(column))"
							:data-pin-edge="pinInfo(column)?.edge ? pinInfo(column).side : undefined"
						>
							{{ columnLetter(columnIndex) }}
						</th>
					</tr>

					<tr class="bg-canvas text-muted-fg" :class="layout === 'flush' && gutterClass" :aria-rowindex="headerRowCount">
						<th
							v-if="selectable"
							class="border-b border-r border-border px-2 text-center"
							:class="headerCellClass(pinLayout.hasLeft, 'bg-canvas')"
							:style="headerCellStyle(headerOffset, utilityPinStyle('select'))"
						>
							<input
								type="checkbox"
								class="size-4 rounded border-border text-primary accent-primary"
								:checked="allVisibleSelected"
								:aria-checked="someVisibleSelected ? 'mixed' : allVisibleSelected"
								aria-label="Select visible rows"
								@change="toggleVisibleSelection"
							/>
						</th>
						<th
							v-if="showRowNumbers"
							class="border-b border-r border-border px-2 text-center font-semibold"
							:class="headerCellClass(pinLayout.hasLeft, 'bg-canvas')"
							:style="headerCellStyle(headerOffset, utilityPinStyle('number'))"
						>
							#
						</th>
						<th
							v-for="column in visibleColumns"
							:key="column.key"
							scope="col"
							class="relative overflow-hidden border-b border-r border-border px-0 text-left align-middle last:border-r-0"
							:aria-sort="ariaSort(column)"
							:class="headerCellClass(Boolean(pinInfo(column)), 'bg-canvas')"
							:style="headerCellStyle(headerOffset, pinStyle(column))"
							:data-pin-edge="pinInfo(column)?.edge ? pinInfo(column).side : undefined"
						>
							<div
								class="relative flex min-w-0 items-center overflow-hidden px-1 py-1.5"
								:class="hasColumnMenu(column) ? 'pr-9' : 'pr-1'"
							>
								<button
									type="button"
									class="flex min-w-0 w-full items-center gap-1.5 overflow-hidden rounded-md px-1 py-1 text-left font-semibold text-canvas-fg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
									:class="column.sortable ? 'hover:bg-secondary' : 'cursor-default'"
									:disabled="!column.sortable"
									:aria-label="sortButtonLabel(column)"
									:title="sortButtonLabel(column)"
									@click="toggleSort(column)"
								>
									<svg
										v-if="column.pinned"
										class="size-3 shrink-0 text-primary"
										viewBox="0 0 24 24"
										fill="none"
										aria-hidden="true"
									>
										<path d="M9 4h6l-1 6 3 3H7l3-3-1-6Zm3 9v7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
									<span class="truncate">{{ column.label }}</span>
									<span
										v-if="multiSort && sortRankForColumn(column)"
										class="grid size-4 shrink-0 place-items-center rounded bg-primary text-[10px] font-semibold leading-none text-primary-fg"
										aria-hidden="true"
									>
										{{ sortRankForColumn(column) }}
									</span>
									<svg
										v-if="column.sortable"
										class="size-3.5 shrink text-muted-fg"
										viewBox="0 0 24 24"
										fill="none"
										aria-hidden="true"
									>
										<path
											v-if="sortDirectionForColumn(column) === 'asc'"
											d="m7 14 5-5 5 5"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											v-else-if="sortDirectionForColumn(column) === 'desc'"
											d="m7 10 5 5 5-5"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											v-else
											d="m8 9 4-4 4 4M16 15l-4 4-4-4"
											stroke="currentColor"
											stroke-width="1.8"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								</button>

								<div v-if="hasColumnMenu(column)" class="absolute right-1 top-1/2 -translate-y-1/2">
									<DomPopover
										position="bottom-end"
										width="w-[20rem]"
										padding="p-0"
										:arrow="false"
									>
										<template #trigger>
											<button
												type="button"
												class="relative grid size-7 shrink-0 place-items-center rounded-md border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
												:class="activeFilters[column.key]
													? 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300'
													: 'border-transparent text-muted-fg hover:border-border hover:bg-secondary hover:text-canvas-fg'"
												:aria-label="column.filterable ? `Filter ${column.label}` : `${column.label} column menu`"
											>
												<svg v-if="column.filterable" class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
													<path d="M4 5h16l-6.2 7.1V18l-3.6 1.8v-7.7L4 5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
												</svg>
												<svg v-else class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
													<circle cx="12" cy="6" r="1.6" />
													<circle cx="12" cy="12" r="1.6" />
													<circle cx="12" cy="18" r="1.6" />
												</svg>
												<span
													v-if="activeFilters[column.key]"
													class="absolute right-1 top-1 size-1.5 rounded-full bg-sky-500"
												></span>
											</button>
										</template>

										<template #default="{ close }">
											<div v-if="columnMenu" class="grid gap-3 border-b border-border p-4 text-sm">
												<p class="font-semibold text-canvas-fg">{{ column.label }}</p>
												<div class="grid gap-1.5">
													<span class="text-xs font-medium text-muted-fg">Pin column</span>
													<div class="grid grid-cols-3 gap-1 rounded-md border border-border bg-secondary/40 p-1">
														<button
															v-for="option in [{ label: 'Left', value: 'left' }, { label: 'None', value: '' }, { label: 'Right', value: 'right' }]"
															:key="option.label"
															type="button"
															class="h-8 rounded px-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
															:class="(column.pinned || '') === option.value ? 'bg-canvas text-canvas-fg shadow-xs' : 'text-muted-fg hover:text-canvas-fg'"
															:aria-pressed="(column.pinned || '') === option.value"
															@click="setColumnPin(column, option.value)"
														>
															{{ option.label }}
														</button>
													</div>
												</div>
												<button
													type="button"
													class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-xs font-semibold transition hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
													@click="toggleGroupColumn(column); close();"
												>
													<svg class="size-4 text-muted-fg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
														<path d="M4 6h16M8 12h12M12 18h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
													</svg>
													{{ isGroupedColumn(column) ? `Stop grouping by ${column.label}` : `Group by ${column.label}` }}
												</button>
											</div>

											<div v-if="column.filterable && filterDrafts[column.key]" class="grid gap-4 p-4 text-sm">
												<div>
													<p class="font-semibold text-canvas-fg">Filter {{ column.label }}</p>
												</div>

												<div v-if="column.type === 'number' || column.type === 'currency'" class="grid grid-cols-2 gap-3">
													<label class="grid gap-1.5">
														<span class="text-xs font-medium text-muted-fg">Minimum</span>
														<input v-model="filterDrafts[column.key].min" type="number" class="skin-input h-9 rounded-md" placeholder="Any" />
													</label>
													<label class="grid gap-1.5">
														<span class="text-xs font-medium text-muted-fg">Maximum</span>
														<input v-model="filterDrafts[column.key].max" type="number" class="skin-input h-9 rounded-md" placeholder="Any" />
													</label>
												</div>

												<div v-else-if="column.type === 'date'" class="grid grid-cols-2 gap-3">
													<label class="grid gap-1.5">
														<span class="text-xs font-medium text-muted-fg">From</span>
														<input v-model="filterDrafts[column.key].start" type="date" class="skin-input h-9 rounded-md" />
													</label>
													<label class="grid gap-1.5">
														<span class="text-xs font-medium text-muted-fg">To</span>
														<input v-model="filterDrafts[column.key].end" type="date" class="skin-input h-9 rounded-md" />
													</label>
												</div>

												<div v-else-if="column.type === 'boolean'" class="grid grid-cols-3 gap-1 rounded-md border border-border bg-secondary/40 p-1">
													<button
														v-for="option in [{ label: 'Any', value: '' }, { label: 'Yes', value: true }, { label: 'No', value: false }]"
														:key="option.label"
														type="button"
														class="h-8 rounded px-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
														:class="filterDrafts[column.key].value === option.value ? 'bg-canvas text-canvas-fg shadow-xs' : 'text-muted-fg hover:text-canvas-fg'"
														@click="setDraftBoolean(column, option.value)"
													>
														{{ option.label }}
													</button>
												</div>

												<div v-else-if="column.type === 'select'" class="grid gap-2">
													<p class="text-xs font-medium text-muted-fg">Values</p>
													<div class="max-h-52 overflow-y-auto rounded-md border border-border bg-canvas p-1">
														<label
															v-for="option in optionRecords(column)"
															:key="String(option.value)"
															class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition hover:bg-secondary"
														>
															<input
																type="checkbox"
																class="size-4 rounded border-border accent-primary"
																:checked="filterDrafts[column.key].values?.map(String).includes(String(option.value))"
																@change="toggleDraftOption(column, option.value)"
															/>
															<span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
															<span v-if="option.tone" class="size-2 rounded-full" :class="toneClass(option.tone)"></span>
														</label>
													</div>
												</div>

												<div v-else class="grid gap-3">
													<label class="grid gap-1.5">
														<span class="text-xs font-medium text-muted-fg">Match</span>
														<select v-model="filterDrafts[column.key].operator" class="skin-input h-9 rounded-md">
															<option value="contains">Contains</option>
															<option value="equals">Equals</option>
															<option value="starts">Starts with</option>
														</select>
													</label>
													<label class="grid gap-1.5">
														<span class="text-xs font-medium text-muted-fg">Value</span>
														<input v-model="filterDrafts[column.key].value" type="text" class="skin-input h-9 rounded-md" placeholder="Search this column" />
													</label>
												</div>

												<div class="flex items-center justify-between gap-2 border-t border-border pt-3">
													<button
														type="button"
														class="inline-flex h-9 items-center rounded-md px-3 text-xs font-semibold text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
														@click="clearColumnFilter(column); close();"
													>
														Clear
													</button>
													<button
														type="button"
														class="skin-action inline-flex h-9 items-center rounded-md px-3 text-xs font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
														@click="applyFilter(column); close();"
													>
														Apply filter
													</button>
												</div>
											</div>
										</template>
									</DomPopover>
								</div>
							</div>
							<span
								v-if="canResizeColumn(column)"
								class="absolute inset-y-0 right-0 z-30 block w-2 cursor-col-resize touch-none transition-opacity"
								:class="columnResize?.key === column.key ? 'opacity-100' : 'opacity-0 hover:opacity-100'"
								@pointerdown="startColumnResize(column, $event)"
								@click.stop
							>
								<span class="mx-auto block h-full w-px bg-primary/60"></span>
							</span>
						</th>
					</tr>
				</thead>

				<tbody v-if="loading || !displayRows.length">
					<tr v-if="loading" :class="layout === 'flush' && gutterClass">
						<td :colspan="emptyColspan" class="border-b border-border px-4 py-10 text-center text-sm text-muted-fg">
							Loading {{ resourceLabel }}...
						</td>
					</tr>
					<tr v-else :class="layout === 'flush' && gutterClass">
						<td :colspan="emptyColspan" class="px-4 py-12 text-center text-sm text-muted-fg">
							<slot name="empty">{{ emptyText }}</slot>
						</td>
					</tr>
				</tbody>

				<DataGridVirtualRows
					v-else
					:items="displayItems"
					:item-key="(item) => item.key"
					:enabled="virtualRows"
					:column-span="emptyColspan"
					:scroll-top="viewportState.scrollTop"
					:viewport-height="viewportState.clientHeight"
					:row-height="virtualRowHeightPx"
					:buffer-rows="virtualRowBuffer"
					@render-window-change="emit('render-window-change', $event)"
				>
					<template #row="{ item, rowHeight }">
						<tr
							v-if="item.type === 'group'"
							class="bg-secondary/40 font-medium text-canvas-fg"
							:class="layout === 'flush' && gutterClass"
							data-grid-group
							:aria-expanded="item.expanded"
							:aria-level="item.level + 1"
							:style="rowHeight ? { height: `${rowHeight}px` } : null"
						>
							<td
								v-if="selectable"
								class="border-b border-r border-border px-2 text-center"
								:class="[rowDensityClass(), utilityCellPositionClass()]"
								:style="utilityPinStyle('select')"
								v-bind="utilityPinAttrs()"
							>
								<input
									type="checkbox"
									class="size-4 rounded border-border accent-primary"
									:checked="groupSelectionState(item).all"
									:indeterminate="groupSelectionState(item).some"
									:aria-label="`Select ${item.count} rows in ${item.label}`"
									@change="toggleGroupSelection(item)"
								/>
							</td>
							<td
								v-if="showRowNumbers"
								class="border-b border-r border-border px-2"
								:class="[rowDensityClass(), utilityCellPositionClass()]"
								:style="utilityPinStyle('number')"
								v-bind="utilityPinAttrs()"
							></td>
							<td
								v-for="(column, columnIndex) in visibleColumns"
								:key="column.key"
								class="border-b border-r border-border px-3 align-middle last:border-r-0"
								:class="[cellAlignClass(column), rowDensityClass(), bodyCellPositionClass(column), columnIndex === 0 ? 'overflow-visible' : 'overflow-hidden']"
								:style="pinStyle(column)"
								v-bind="pinAttrs(column)"
							>
								<button
									v-if="columnIndex === 0"
									type="button"
									class="flex w-max min-w-0 items-center gap-1.5 whitespace-nowrap rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
									:style="{ paddingLeft: `${item.level * 16}px` }"
									:aria-label="`${item.expanded ? 'Collapse' : 'Expand'} ${item.column.label} ${item.label}`"
									:title="`${item.column.label}: ${item.label}`"
									@click="toggleGroup(item)"
								>
									<svg class="size-3.5 shrink-0 text-muted-fg transition-transform" :class="item.expanded && 'rotate-90'" viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
									<span class="font-semibold">{{ item.label }}</span>
									<span class="shrink-0 rounded bg-canvas px-1.5 text-[11px] font-semibold tabular-nums text-muted-fg ring-1 ring-border">{{ item.count }}</span>
								</button>
								<span
									v-else-if="column.aggregate"
									class="block truncate font-semibold"
									:title="`${aggregateLabel(column)} of ${column.label}`"
								>{{ formatAggregate(item.aggregates[column.key], column) }}</span>
							</td>
						</tr>

						<tr
							v-else
							class="group bg-canvas transition hover:bg-secondary/45"
							:class="[rowSelected(item.row, item.index) && 'bg-primary/5', layout === 'flush' && gutterClass]"
							data-grid-row
							:aria-rowindex="item.line + headerRowCount + 1"
							:aria-selected="rowSelected(item.row, item.index) || undefined"
							:style="rowHeight ? { height: `${rowHeight}px` } : null"
							@click="emit('row-click', { row: item.row, index: item.index })"
						>
							<td
								v-if="selectable"
								class="border-b border-r border-border px-2 text-center"
								:class="[rowDensityClass(), utilityCellPositionClass()]"
								:style="utilityPinStyle('select')"
								v-bind="utilityPinAttrs()"
								@click.stop
							>
								<input
									type="checkbox"
									class="size-4 rounded border-border accent-primary"
									:checked="rowSelected(item.row, item.index)"
									:aria-label="`Select row ${item.line + 1}`"
									@change="toggleRowSelection(item.row, item.index)"
								/>
							</td>
							<td
								v-if="showRowNumbers"
								class="border-b border-r border-border bg-secondary/25 px-2 text-center text-xs font-medium text-muted-fg"
								:class="[rowDensityClass(), utilityCellPositionClass()]"
								:style="utilityPinStyle('number')"
								v-bind="utilityPinAttrs()"
							>
								{{ item.line + 1 }}
							</td>
							<td
								v-for="(column, columnIndex) in visibleColumns"
								:key="column.key"
								class="overflow-hidden border-b border-r border-border px-3 align-middle last:border-r-0"
								:class="[cellAlignClass(column), rowDensityClass(), bodyCellPositionClass(column)]"
								:style="[pinStyle(column), rowIndent(column, columnIndex)]"
								v-bind="cellAttrs(item, column, columnIndex)"
								@pointerdown="onCellPointerDown(item, columnIndex, $event)"
								@pointerenter="onCellPointerEnter(item, columnIndex)"
								@dblclick="onCellDoubleClick(item, column, columnIndex, $event)"
							>
								<template v-if="isEditingCell(item, columnIndex)">
									<select
										v-if="column.type === 'select'"
										:ref="setEditorElement"
										v-model="editingCell.draft"
										class="absolute inset-0 z-10 h-full w-full border-0 bg-canvas px-2 text-sm text-canvas-fg outline-2 -outline-offset-2"
										:class="editingCell.error ? 'outline-destructive' : 'outline-primary'"
										:aria-label="`Edit ${column.label}`"
										:aria-invalid="Boolean(editingCell.error) || undefined"
										:title="editingCell.error || undefined"
										@keydown="onEditorKeydown"
										@blur="onEditorBlur"
										@click.stop
									>
										<option value="">-</option>
										<option v-for="option in optionRecords(column)" :key="String(option.value)" :value="String(option.value)">{{ option.label }}</option>
									</select>
									<input
										v-else
										:ref="setEditorElement"
										v-model="editingCell.draft"
										:type="column.type === 'date' ? 'date' : 'text'"
										:inputmode="column.type === 'number' || column.type === 'currency' ? 'decimal' : undefined"
										class="absolute inset-0 z-10 h-full w-full border-0 bg-canvas px-3 text-sm text-canvas-fg outline-2 -outline-offset-2"
										:class="[editingCell.error ? 'outline-destructive' : 'outline-primary', cellAlignClass(column)]"
										:aria-label="`Edit ${column.label}`"
										:aria-invalid="Boolean(editingCell.error) || undefined"
										:title="editingCell.error || undefined"
										@keydown="onEditorKeydown"
										@blur="onEditorBlur"
										@click.stop
									/>
								</template>
								<slot
									v-else
									name="cell"
									:row="item.row"
									:column="column"
									:value="cellValue(item.row, column)"
									:formatted="formattedCell(item.row, column)"
									:row-index="item.index"
									:row-key="rowKey(item.row, item.index)"
								>
									<component
										:is="column.component"
										v-if="column.component"
										:row="item.row"
										:column="column"
										:value="cellValue(item.row, column)"
										:formatted="formattedCell(item.row, column)"
										:row-index="item.index"
										:row-key="rowKey(item.row, item.index)"
										@update:value="onCellComponentUpdate(item.row, column, item.index, $event)"
										@action="onCellComponentAction(item.row, column, item.index, $event)"
									/>
									<span v-else-if="column.type === 'boolean'" class="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1" :class="cellValue(item.row, column) ? toneClass('green') : toneClass('neutral')">
										{{ formattedCell(item.row, column) }}
									</span>
									<span v-else-if="column.type === 'select'" class="inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ring-1" :class="toneClass(optionTone(column, cellValue(item.row, column)))">
										<span class="size-1.5 rounded-full bg-current opacity-70"></span>
										<span class="truncate">{{ formattedCell(item.row, column) }}</span>
									</span>
									<span v-else-if="formattedCell(item.row, column)" class="block max-w-full truncate">{{ formattedCell(item.row, column) }}</span>
									<span v-else class="text-muted-fg/60">-</span>
								</slot>
							</td>
						</tr>
					</template>
				</DataGridVirtualRows>

				<tfoot v-if="showTotals && !loading && displayRows.length" class="text-xs">
					<tr :class="layout === 'flush' && gutterClass" data-grid-totals>
						<td
							v-if="selectable"
							class="sticky bottom-0 border-r border-t border-border bg-secondary px-2"
							:class="pinLayout.hasLeft ? 'z-30' : 'z-20'"
							:style="utilityPinStyle('select')"
						></td>
						<td
							v-if="showRowNumbers"
							class="sticky bottom-0 border-r border-t border-border bg-secondary px-2 text-center font-semibold text-muted-fg"
							:class="pinLayout.hasLeft ? 'z-30' : 'z-20'"
							:style="utilityPinStyle('number')"
						>
							&Sigma;
						</td>
						<td
							v-for="(column, columnIndex) in visibleColumns"
							:key="column.key"
							class="sticky bottom-0 h-9 overflow-hidden border-r border-t border-border bg-secondary px-3 font-semibold text-canvas-fg last:border-r-0"
							:class="[cellAlignClass(column), pinInfo(column) ? 'z-30' : 'z-20']"
							:style="pinStyle(column)"
							:data-pin-edge="pinInfo(column)?.edge ? pinInfo(column).side : undefined"
							:title="column.aggregate ? `${aggregateLabel(column)} of ${column.label}` : undefined"
						>
							<span v-if="column.aggregate" class="block truncate">{{ formatAggregate(totalAggregates[column.key], column) }}</span>
							<span v-else-if="columnIndex === 0" class="block truncate text-muted-fg">Total</span>
						</td>
					</tr>
				</tfoot>
			</table>
		</div>

		<footer class="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-secondary/25 py-2 text-xs text-muted-fg" :class="layout === 'flush' ? gutterClass : 'px-3'">
			<span>{{ visibleColumns.length }} columns<template v-if="groupColumns.length"> · {{ displayItems.length - navRows.length }} groups</template></span>
			<span v-if="editingError" class="font-medium text-destructive" role="alert">{{ editingError }}</span>
			<span v-else-if="gridNotice" aria-live="polite">{{ gridNotice }}</span>
			<span v-else-if="rangeSummary" class="flex flex-wrap gap-x-3 tabular-nums" aria-live="polite">
				<span>Count {{ rangeSummary.count }}</span>
				<span v-if="rangeSummary.sum">Sum {{ rangeSummary.sum }}</span>
				<span v-if="rangeSummary.average">Average {{ rangeSummary.average }}</span>
			</span>
			<span v-else-if="internalSelectedKeys.length">{{ internalSelectedKeys.length }} selected</span>
			<span v-else>Ready</span>
		</footer>
	</section>
</template>

<style scoped>
/* Row padding does not affect table layout. Only the two outer cell edges
 * inherit it, so responsive/custom utility classes remain application-owned.
 * Direct table ancestry prevents these rules leaking into nested cell content. */
[data-layout="flush"] > [data-grid-viewport] > table > :deep(:is(thead, tbody, tfoot) > tr:not([aria-hidden="true"]) > :is(th, td):first-child) {
	padding-left: inherit;
}

[data-layout="flush"] > [data-grid-viewport] > table > :deep(:is(thead, tbody, tfoot) > tr:not([aria-hidden="true"]) > :is(th, td):last-child) {
	padding-right: inherit;
}

/* The sortable header has two inner wrappers; remove their extra edge inset
 * so the label starts on the same gutter as the toolbar and body cells. */
[data-layout="flush"] > [data-grid-viewport] > table > thead > tr > th:first-child > div,
[data-layout="flush"] > [data-grid-viewport] > table > thead > tr > th:first-child > div > button {
	padding-left: 0;
}

[data-layout="flush"] > [data-grid-viewport] > table > thead > tr > th:last-child > div:not(.pr-9),
[data-layout="flush"] > [data-grid-viewport] > table > thead > tr > th:last-child > div > button {
	padding-right: 0;
}

/* Pinned body cells sit above scrolling cells, so they need an opaque base.
 * The row's hover, selection and group tints are layered on top as a
 * gradient so pinned and scrolling cells read as one row. */
td[data-pin] {
	background-color: var(--canvas);
}

tr[data-grid-row]:hover > td[data-pin] {
	background-image: linear-gradient(color-mix(in oklab, var(--secondary) 45%, transparent), color-mix(in oklab, var(--secondary) 45%, transparent));
}

tr[data-grid-row][aria-selected="true"] > td[data-pin] {
	background-image: linear-gradient(color-mix(in oklab, var(--primary) 5%, transparent), color-mix(in oklab, var(--primary) 5%, transparent));
}

tr[data-grid-group] > td[data-pin] {
	background-image: linear-gradient(color-mix(in oklab, var(--secondary) 40%, transparent), color-mix(in oklab, var(--secondary) 40%, transparent));
}

tr[data-grid-row] > td[data-pin].bg-secondary\/25 {
	background-image: linear-gradient(color-mix(in oklab, var(--secondary) 25%, transparent), color-mix(in oklab, var(--secondary) 25%, transparent));
}

/* A soft edge where pinned columns meet the scrolling area. */
[data-pin-edge="left"] {
	box-shadow: 6px 0 8px -6px color-mix(in oklab, var(--canvas-fg) 22%, transparent);
}

[data-pin-edge="right"] {
	box-shadow: -6px 0 8px -6px color-mix(in oklab, var(--canvas-fg) 22%, transparent);
}

/* Range selection is drawn over any cell background, pinned or not. */
td[data-in-range] {
	background-image: linear-gradient(color-mix(in oklab, var(--primary) 12%, transparent), color-mix(in oklab, var(--primary) 12%, transparent)) !important;
}

td[data-active] {
	outline: 2px solid var(--primary);
	outline-offset: -2px;
}

[data-grid-viewport]:not(:focus-within) td[data-active] {
	outline-color: color-mix(in oklab, var(--primary) 45%, transparent);
}
</style>
