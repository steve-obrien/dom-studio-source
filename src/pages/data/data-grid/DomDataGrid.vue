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
};
</script>

<script setup>
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, reactive, ref, useId, watch } from 'vue';
import DomPopover from '../../components/popover/DomPopover.vue';
import DataGridVirtualRows from './DataGridVirtualRows.vue';

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
			{ name: 'cell-update', payload: '({ row, column, rowIndex, rowKey, value, previousValue })', description: 'Re-emitted when a column component emits update:value.' },
			{ name: 'cell-action', payload: '({ row, column, rowIndex, rowKey, value, formatted, action, payload })', description: 'Re-emitted when a column component emits action.' },
			{ name: 'column-resize', payload: '({ column, key, width, previousWidth, startWidth })', description: 'Fired while a header divider is dragged and a column width changes.' },
			{ name: 'column-resize-end', payload: '({ column, key, width, previousWidth, startWidth })', description: 'Fired when the user finishes resizing a column.' },
			{ name: 'render-window-change', payload: '({ startIndex, endIndex, renderedRows, totalRows, firstVisibleIndex, lastVisibleIndex })', description: 'Fired by the virtual row renderer when the mounted row window changes.' },
			{ name: 'row-click', payload: '({ row, index })', description: 'Fired when a data row is clicked.' },
		],
		slots: [
			{ name: 'cell', payload: '{ row, column, value, formatted, rowIndex, rowKey }', description: 'Custom cell renderer.' },
			{ name: 'toolbar-actions', payload: '{ query, clearFilters }', description: 'Extra controls rendered next to search and Clear filters.' },
			{ name: 'empty', description: 'Custom empty state.' },
		],
		keyboard: [
			{ keys: 'Enter / Space on a header', action: 'Toggle sort when the column is sortable.' },
			{ keys: 'Enter / Space on a filter button', action: 'Open the typed filter popover.' },
			{ keys: 'Esc', action: 'Close an open filter popover.' },
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
]);

const titleId = `dom-data-grid-${useId()}`;
const filterDrafts = reactive({});
const resizedColumnWidths = reactive({});
const viewportState = reactive({ scrollTop: 0, clientHeight: 0 });
const internalFilters = ref({});
const internalSort = ref(normalizeSort(props.sort));
const internalSearch = ref(props.search || '');
const internalSelectedKeys = ref([...props.selectedKeys]);
const columnResize = ref(null);
const scrollViewport = ref(null);
let resizeListenersAttached = false;
let previousBodyCursor = '';
let previousBodyUserSelect = '';

const sourceRows = computed(() => Array.isArray(props.rows) ? props.rows : []);
const normalizedColumns = computed(() => {
	const supplied = Array.isArray(props.columns) && props.columns.length
		? props.columns
		: inferColumns(sourceRows.value);

	return supplied
		.filter((column) => column && column.hidden !== true && column.key)
		.map((column) => normalizeColumn(column));
});
const visibleColumns = computed(() => normalizedColumns.value);
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

onBeforeUnmount(() => {
	removeColumnResizeListeners();
	columnResize.value = null;
});

onMounted(() => {
	nextTick(refreshViewportMetrics);
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

function rowKey(row, index) {
	if (typeof props.rowKey === 'function') return props.rowKey(row, index);
	const key = row?.[props.rowKey];
	return key ?? index;
}

function cellValue(row, column) {
	if (typeof column.accessor === 'function') return column.accessor(row, column);
	return row?.[column.field || column.key];
}

function formattedCell(row, column) {
	const value = cellValue(row, column);
	if (typeof column.format === 'function') return column.format(value, row, column);
	if (value === null || value === undefined || value === '') return '';

	if (column.type === 'currency') {
		const amount = Number(value);
		if (!Number.isFinite(amount)) return String(value);
		return new Intl.NumberFormat(column.locale || 'en-GB', {
			style: 'currency',
			currency: column.currency || 'GBP',
			maximumFractionDigits: amount >= 1000 ? 0 : 2,
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
	});
}

function onCellComponentAction(row, column, rowIndex, payload) {
	emit('cell-action', {
		...cellContext(row, column, rowIndex),
		action: payload?.action ?? payload?.type ?? payload,
		payload,
	});
}
</script>

<template>
	<section
		class="dom-data-grid overflow-hidden rounded-lg border border-border bg-canvas text-canvas-fg shadow-sm"
		:aria-labelledby="titleId"
	>
		<header v-if="toolbar" class="border-b border-border bg-secondary/35 px-3 py-3">
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

				<slot name="toolbar-actions" :query="query" :clear-filters="clearFilters" />

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

			<div v-if="activeFilterEntries.length" class="mt-3 flex flex-wrap gap-2">
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

		<div ref="scrollViewport" class="overflow-auto" :style="gridHeightStyle" @scroll="onViewportScroll">
			<table class="w-full table-fixed border-separate border-spacing-0 text-sm" :style="tableStyle">
				<colgroup>
					<col v-if="selectable" class="w-11" />
					<col v-if="showRowNumbers" class="w-[3.375rem]" />
					<col
						v-for="column in visibleColumns"
						:key="column.key"
						:style="{ width: columnWidthStyle(column), minWidth: columnWidthStyle(column) }"
					/>
				</colgroup>

				<thead class="text-xs">
					<tr v-if="showColumnLetters" class="bg-secondary/60 text-muted-fg">
						<th
							v-if="selectable"
							class="border-b border-r border-border px-2 py-1.5 font-semibold"
							:class="stickyHeader && 'sticky top-0 z-20 bg-secondary/95 backdrop-blur'"
						></th>
						<th
							v-if="showRowNumbers"
							class="border-b border-r border-border px-2 py-1.5 text-center font-semibold"
							:class="stickyHeader && 'sticky top-0 z-20 bg-secondary/95 backdrop-blur'"
						></th>
						<th
							v-for="(column, columnIndex) in visibleColumns"
							:key="`${column.key}-letter`"
							class="border-b border-r border-border px-2 py-1.5 text-center font-semibold last:border-r-0"
							:class="stickyHeader && 'sticky top-0 z-20 bg-secondary/95 backdrop-blur'"
						>
							{{ columnLetter(columnIndex) }}
						</th>
					</tr>

					<tr class="bg-canvas text-muted-fg">
						<th
							v-if="selectable"
							class="border-b border-r border-border px-2 text-center"
							:class="stickyHeader && 'sticky z-20 bg-canvas/95 backdrop-blur'"
							:style="stickyHeader ? { top: headerOffset } : null"
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
							:class="stickyHeader && 'sticky z-20 bg-canvas/95 backdrop-blur'"
							:style="stickyHeader ? { top: headerOffset } : null"
						>
							#
						</th>
						<th
							v-for="column in visibleColumns"
							:key="column.key"
							scope="col"
							class="relative overflow-hidden border-b border-r border-border px-0 text-left align-middle last:border-r-0"
							:aria-sort="ariaSort(column)"
							:class="stickyHeader && 'sticky z-20 bg-canvas/95 backdrop-blur'"
							:style="stickyHeader ? { top: headerOffset } : null"
						>
							<div
								class="relative flex min-w-0 items-center overflow-hidden px-1 py-1.5"
								:class="column.filterable ? 'pr-9' : 'pr-1'"
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

								<div v-if="column.filterable" class="absolute right-1 top-1/2 -translate-y-1/2">
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
												:aria-label="`Filter ${column.label}`"
											>
												<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
													<path d="M4 5h16l-6.2 7.1V18l-3.6 1.8v-7.7L4 5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
												</svg>
												<span
													v-if="activeFilters[column.key]"
													class="absolute right-1 top-1 size-1.5 rounded-full bg-sky-500"
												></span>
											</button>
										</template>

										<template #default="{ close }">
											<div v-if="filterDrafts[column.key]" class="grid gap-4 p-4 text-sm">
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

				<DataGridVirtualRows
					v-if="virtualRows && !loading && displayRows.length"
					:rows="displayRows"
					:columns="visibleColumns"
					:row-key="rowKey"
					:cell-value="cellValue"
					:formatted-cell="formattedCell"
					:cell-align-class="cellAlignClass"
					:row-density-class="rowDensityClass"
					:selected-keys="internalSelectedKeys"
					:selectable="selectable"
					:show-row-numbers="showRowNumbers"
					:scroll-top="viewportState.scrollTop"
					:viewport-height="viewportState.clientHeight"
					:row-height="virtualRowHeightPx"
					:buffer-rows="virtualRowBuffer"
					@toggle-row-selection="toggleRowSelection($event.row, $event.index)"
					@row-click="emit('row-click', { row: $event.row, index: $event.index })"
					@render-window-change="emit('render-window-change', $event)"
				>
					<template #cell="{ row, column, value, formatted, rowIndex, rowKey: currentRowKey }">
						<slot
							name="cell"
							:row="row"
							:column="column"
							:value="value"
							:formatted="formatted"
							:row-index="rowIndex"
							:row-key="currentRowKey"
						>
							<component
								:is="column.component"
								v-if="column.component"
								:row="row"
								:column="column"
								:value="value"
								:formatted="formatted"
								:row-index="rowIndex"
								:row-key="currentRowKey"
								@update:value="onCellComponentUpdate(row, column, rowIndex, $event)"
								@action="onCellComponentAction(row, column, rowIndex, $event)"
							/>
							<span v-else-if="column.type === 'boolean'" class="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1" :class="value ? toneClass('green') : toneClass('neutral')">
								{{ formatted }}
							</span>
							<span v-else-if="column.type === 'select'" class="inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ring-1" :class="toneClass(optionTone(column, value))">
								<span class="size-1.5 rounded-full bg-current opacity-70"></span>
								<span class="truncate">{{ formatted }}</span>
							</span>
							<span v-else-if="formatted" class="block max-w-full truncate">{{ formatted }}</span>
							<span v-else class="text-muted-fg/60">-</span>
						</slot>
					</template>
				</DataGridVirtualRows>

				<tbody v-else>
					<tr v-if="loading">
						<td :colspan="emptyColspan" class="border-b border-border px-4 py-10 text-center text-sm text-muted-fg">
							Loading {{ resourceLabel }}...
						</td>
					</tr>
					<tr v-else-if="!displayRows.length">
						<td :colspan="emptyColspan" class="px-4 py-12 text-center text-sm text-muted-fg">
							<slot name="empty">{{ emptyText }}</slot>
						</td>
					</tr>
					<template v-else>
						<tr
							v-for="(row, rowIndex) in displayRows"
							:key="rowKey(row, rowIndex)"
							class="group bg-canvas transition hover:bg-secondary/45"
							:class="rowSelected(row, rowIndex) && 'bg-sky-500/5'"
							:aria-selected="rowSelected(row, rowIndex) || undefined"
							@click="emit('row-click', { row, index: rowIndex })"
						>
							<td v-if="selectable" class="border-b border-r border-border px-2 text-center" :class="rowDensityClass()" @click.stop>
								<input
									type="checkbox"
									class="size-4 rounded border-border accent-primary"
									:checked="rowSelected(row, rowIndex)"
									:aria-label="`Select row ${rowIndex + 1}`"
									@change="toggleRowSelection(row, rowIndex)"
								/>
							</td>
							<td
								v-if="showRowNumbers"
								class="border-b border-r border-border bg-secondary/25 px-2 text-center text-xs font-medium text-muted-fg"
								:class="rowDensityClass()"
							>
								{{ rowIndex + 1 }}
							</td>
							<td
								v-for="column in visibleColumns"
								:key="column.key"
								class="overflow-hidden border-b border-r border-border px-3 align-middle last:border-r-0"
								:class="[cellAlignClass(column), rowDensityClass()]"
							>
								<slot
									name="cell"
									:row="row"
									:column="column"
									:value="cellValue(row, column)"
									:formatted="formattedCell(row, column)"
									:row-index="rowIndex"
									:row-key="rowKey(row, rowIndex)"
								>
									<component
										:is="column.component"
										v-if="column.component"
										:row="row"
										:column="column"
										:value="cellValue(row, column)"
										:formatted="formattedCell(row, column)"
										:row-index="rowIndex"
										:row-key="rowKey(row, rowIndex)"
										@update:value="onCellComponentUpdate(row, column, rowIndex, $event)"
										@action="onCellComponentAction(row, column, rowIndex, $event)"
									/>
									<span v-else-if="column.type === 'boolean'" class="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1" :class="cellValue(row, column) ? toneClass('green') : toneClass('neutral')">
										{{ formattedCell(row, column) }}
									</span>
									<span v-else-if="column.type === 'select'" class="inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ring-1" :class="toneClass(optionTone(column, cellValue(row, column)))">
										<span class="size-1.5 rounded-full bg-current opacity-70"></span>
										<span class="truncate">{{ formattedCell(row, column) }}</span>
									</span>
									<span v-else-if="formattedCell(row, column)" class="block max-w-full truncate">{{ formattedCell(row, column) }}</span>
									<span v-else class="text-muted-fg/60">-</span>
								</slot>
							</td>
						</tr>
					</template>
				</tbody>
			</table>
		</div>

		<footer class="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-secondary/25 px-3 py-2 text-xs text-muted-fg">
			<span>{{ visibleColumns.length }} columns</span>
			<span v-if="internalSelectedKeys.length">{{ internalSelectedKeys.length }} selected</span>
			<span v-else>Ready</span>
		</footer>
	</section>
</template>
