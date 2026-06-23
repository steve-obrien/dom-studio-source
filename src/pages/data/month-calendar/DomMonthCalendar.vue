<script>
/**
 * @typedef {object} MonthCalendarCell
 * @property {Date} date Local Date instance for the cell.
 * @property {string} value YYYY-MM-DD date key.
 * @property {number} day Day of the month.
 * @property {string} weekday Formatted weekday label.
 * @property {string} label Full accessible date label.
 * @property {boolean} currentMonth True when the date belongs to the rendered month.
 * @property {boolean} previousMonth True when the date belongs to the previous month relative to the rendered month.
 * @property {boolean} nextMonth True when the date belongs to the next month relative to the rendered month.
 * @property {boolean} adjacentMonth True when the date belongs to either adjacent month outside the rendered month.
 * @property {boolean} hidden True for adjacent dates when showAdjacentDays is false.
 * @property {string} monthValue YYYY-MM month key for the rendered month.
 * @property {number} row Zero-based week row in the grid.
 * @property {number} column Zero-based weekday column in the grid.
 * @property {boolean} today
 * @property {boolean} past
 * @property {boolean} future
 * @property {boolean} muted
 * @property {boolean} disabled
 */

/**
 * @typedef {object} MonthCalendarWeek
 * @property {number} index
 * @property {number} weekNumber ISO-8601 week number for the row.
 * @property {string} label Accessible week number label.
 * @property {Array<MonthCalendarCell>} days
 */

/**
 * @typedef {object} MonthCalendarMonth
 * @property {Date} date Local Date instance for the first day of the rendered month.
 * @property {string} value YYYY-MM month key.
 * @property {string} id Element id used to label the month grid.
 * @property {number} month Month number, 1-12.
 * @property {number} year Four-digit year.
 * @property {string} label Formatted month heading.
 * @property {Array<MonthCalendarCell>} cells Flat list of visible day cells.
 * @property {Array<MonthCalendarWeek>} weeks Day cells grouped into week rows.
 */

/**
 * @typedef {object} MonthCalendarDaySlotPayload
 * @property {MonthCalendarCell} cell
 * @property {MonthCalendarMonth} month
 * @property {MonthCalendarDragState} drag
 * @property {MonthCalendarDragAttrs} dragAttrs
 */

/**
 * @typedef {object} MonthCalendarDayClickPayload
 * @property {MonthCalendarCell} cell
 * @property {MouseEvent} event
 */

/**
 * @typedef {object} MonthCalendarDragState
 * @property {boolean} active True while a calendar drag is in progress.
 * @property {boolean} source True for the day where the drag started.
 * @property {boolean} over True for the day currently previewed as the drop target.
 * @property {MonthCalendarCell|null} sourceCell Cell where the drag started, when known.
 * @property {MonthCalendarCell|null} overCell Cell currently previewed as the drop target, when known.
 * @property {unknown} data App-owned data passed to dragAttrs.
 */

/**
 * @typedef {object} MonthCalendarDragAttrsOptions
 * @property {string} [effectAllowed] Native DataTransfer effectAllowed value.
 */

/**
 * @typedef {(data?: unknown, options?: MonthCalendarDragAttrsOptions) => Record<string, unknown>} MonthCalendarDragAttrs
 */

/**
 * @typedef {object} MonthCalendarDayDragPayload
 * @property {MonthCalendarCell} cell
 * @property {MonthCalendarCell|null} sourceCell
 * @property {MonthCalendarCell} targetCell
 * @property {string} sourceValue
 * @property {string} targetValue
 * @property {unknown} data
 * @property {DragEvent} event
 * @property {DataTransfer|null} dataTransfer
 * @property {Array<string>} types
 * @property {(type: string) => string} getData
 */

/**
 * @typedef {(cell: MonthCalendarCell) => boolean} MonthCalendarDisabledDate
 */

/**
 * @typedef {string|Array<unknown>|Record<string, boolean>|((cell: MonthCalendarCell) => unknown)} MonthCalendarDayClass
 */

/**
 * @typedef {string|Record<string, string|number>|((cell: MonthCalendarCell) => string|Record<string, string|number>|null|undefined)} MonthCalendarDayStyle
 */

export const monthCalendarProps = {
	startDate: {
		type: String,
		default: '',
		_edit: { group: 'Range', description: 'First date in the rendered range as YYYY-MM-DD. The first month starts on the week containing this date.' },
	},
	initialMonth: {
		type: Number,
		default: null,
		_edit: { group: 'Range', description: 'Initial month, 1-12. Used when startDate is not set.' },
	},
	initialYear: {
		type: Number,
		default: null,
		_edit: { group: 'Range', description: 'Initial year. Used when startDate is not set.' },
	},
	months: {
		type: Number,
		default: 3,
		_edit: { group: 'Range', description: 'Number of consecutive months to render.' },
	},
	locale: {
		type: String,
		default: 'en-GB',
		_edit: { description: 'Locale used for month, weekday, and date labels.' },
	},
	weekStartsOn: {
		type: Number,
		default: 1,
		_edit: { options: [0, 1, 2, 3, 4, 5, 6], description: 'First day of week. 0 is Sunday, 1 is Monday.' },
	},
	weekdayFormat: {
		type: String,
		default: 'short',
		validator: (value) => ['narrow', 'short', 'long'].includes(value),
		_edit: { options: ['narrow', 'short', 'long'], description: 'Weekday label length.' },
	},
	showAdjacentDays: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show days from the previous and next months so the grid keeps its weekday alignment.' },
	},
	fixedWeeks: {
		type: Boolean,
		default: false,
		_edit: { description: 'Render six weeks per month even when the month needs fewer rows.' },
	},
	showWeekNumbers: {
		type: Boolean,
		default: false,
		_edit: { description: 'Render ISO-8601 week numbers at the start of each week row.' },
	},
	mutedBefore: {
		type: String,
		default: '',
		_edit: { description: 'Dates before this YYYY-MM-DD value render muted.' },
	},
	mutedAfter: {
		type: String,
		default: '',
		_edit: { description: 'Dates after this YYYY-MM-DD value render muted.' },
	},
	/**
	 * @type {MonthCalendarDayClass}
	 */
	mutedDayClass: {
		type: [String, Array, Object, Function],
		default: '',
		_edit: { group: 'Styling', description: 'Classes for visible muted days. Replaces the default muted day classes.' },
	},
	/**
	 * @type {MonthCalendarDayClass}
	 */
	adjacentDayClass: {
		type: [String, Array, Object, Function],
		default: '',
		_edit: { group: 'Styling', description: 'Classes for visible previous and next month days. Overrides mutedDayClass for adjacent days.' },
	},
	min: {
		type: String,
		default: '',
		_edit: { group: 'Interaction', description: 'Minimum clickable date as YYYY-MM-DD.' },
	},
	max: {
		type: String,
		default: '',
		_edit: { group: 'Interaction', description: 'Maximum clickable date as YYYY-MM-DD.' },
	},
	clickable: {
		type: Boolean,
		default: false,
		_edit: { group: 'Interaction', description: 'Render days as keyboard-reachable buttons and emit day-click.' },
	},
	clickableAdjacentDays: {
		type: Boolean,
		default: false,
		_edit: { group: 'Interaction', description: 'Allow day-click on visible days outside the displayed month.' },
	},
	dragAndDrop: {
		type: Boolean,
		default: false,
		_edit: { group: 'Interaction', description: 'Expose dragAttrs in the day slot and emit day-drop when a draggable item is dropped onto a day.' },
	},
	dropEffect: {
		type: String,
		default: 'move',
		validator: (value) => ['copy', 'move', 'link'].includes(value),
		_edit: { group: 'Interaction', options: ['copy', 'move', 'link'], description: 'Native drop effect shown when a day can receive a dragged item.' },
	},
	/**
	 * @type {MonthCalendarDisabledDate}
	 */
	disabledDate: {
		type: Function,
		default: null,
		_edit: { group: 'Interaction', description: 'Function that receives a day cell and returns true when the day should not be clickable or droppable.' },
	},
	dayHeaders: {
		type: Boolean,
		default: true,
		_edit: { description: 'Render weekday headers.' },
	},
	/**
	 * @type {MonthCalendarDayClass}
	 */
	dayClass: {
		type: [String, Array, Object, Function],
		default: '',
		_edit: { description: 'Extra classes, or a function that receives a day cell and returns classes for the day cell.' },
	},
	/**
	 * @type {MonthCalendarDayStyle}
	 */
	dayStyle: {
		type: [String, Object, Function],
		default: '',
		_edit: { description: 'Extra styles, or a function that receives a day cell and returns styles for the day cell.' },
	},
};
</script>

<script setup>
import { computed, ref, useId } from 'vue';

defineOptions({
	__doc: {
		name: 'Month calendar',
		tag: '<DomMonthCalendar>',
		description: 'A large scrolling month calendar that keeps weekday grids aligned and lets each day render custom UI.',
		icon: 'M7 4v3M17 4v3M5 8h14M6 6h12v13H6V6Zm3 6h2M13 12h2M9 16h2M13 16h2',
		events: [
			{ name: 'day-click', payload: '({ cell, event })', typeRef: 'MonthCalendarDayClickPayload', description: 'Fired when a clickable day is activated.' },
			{ name: 'day-drag-start', payload: '({ cell, sourceCell, sourceValue, data, event })', typeRef: 'MonthCalendarDayDragPayload', description: 'Fired when an item using dragAttrs starts dragging from a day.' },
			{ name: 'day-drag-enter', payload: '({ cell, sourceCell, targetCell, sourceValue, targetValue, data, event })', typeRef: 'MonthCalendarDayDragPayload', description: 'Fired when a dragged item previews a day as the drop target.' },
			{ name: 'day-drag-leave', payload: '({ cell, sourceCell, targetCell, sourceValue, targetValue, data, event })', typeRef: 'MonthCalendarDayDragPayload', description: 'Fired when a dragged item leaves a previewed day.' },
			{ name: 'day-drop', payload: '({ cell, sourceCell, targetCell, sourceValue, targetValue, data, event })', typeRef: 'MonthCalendarDayDragPayload', description: 'Fired when a draggable item is dropped onto a day. The calendar does not mutate records.' },
			{ name: 'day-drag-end', payload: '({ cell, sourceCell, targetCell, sourceValue, targetValue, data, event })', typeRef: 'MonthCalendarDayDragPayload', description: 'Fired when a drag started with dragAttrs ends.' },
		],
		slots: [
			{ name: '(default)', payload: '{ cell, month, drag, dragAttrs }', typeRef: 'MonthCalendarDaySlotPayload', description: 'Custom content inside each visible calendar day. Use dragAttrs(data) on items that should be draggable.' },
			{ name: 'month-header', payload: '{ month }', description: 'Custom content rendered opposite the month title.' },
		],
		keyboard: [
			{ keys: 'Tab', action: 'Move through clickable days when clickable is enabled.' },
			{ keys: 'Enter / Space', action: 'Activate the focused day.' },
		],
	},
});

const props = defineProps(monthCalendarProps);
const emit = defineEmits(['day-click', 'day-drag-start', 'day-drag-enter', 'day-drag-leave', 'day-drop', 'day-drag-end']);
const rootId = useId();
const calendarDragType = 'application/x-dom-month-calendar-drag';

const todayValue = formatDate(new Date());
const dragState = ref(createEmptyDragState());
const resolvedWeekStartsOn = computed(() => clampWeekStartsOn(props.weekStartsOn));
const defaultMutedDayClass = 'bg-secondary/20 text-muted-fg/55';
const rangeStart = computed(() => parseDate(props.startDate));
const anchorDate = computed(() => rangeStart.value || initialDateFromProps() || new Date());
const monthLabelFormatter = computed(() => new Intl.DateTimeFormat(props.locale, {
	month: 'long',
	year: 'numeric',
}));
const dateLabelFormatter = computed(() => new Intl.DateTimeFormat(props.locale, {
	weekday: 'long',
	day: 'numeric',
	month: 'long',
	year: 'numeric',
}));
const weekdayLabelFormatter = computed(() => new Intl.DateTimeFormat(props.locale, {
	weekday: props.weekdayFormat,
}));
const weekdayLabels = computed(() => {
	const sunday = new Date(2026, 0, 4);
	return Array.from({ length: 7 }, (_, index) => {
		const offset = (index + resolvedWeekStartsOn.value) % 7;
		return weekdayLabelFormatter.value.format(addDays(sunday, offset));
	});
});
const renderedMonths = computed(() => {
	const count = clampMonthCount(props.months);
	const firstMonth = new Date(anchorDate.value.getFullYear(), anchorDate.value.getMonth(), 1);
	return Array.from({ length: count }, (_, index) => buildMonth(firstMonth, index));
});
const gridMinWidthClass = computed(() => props.showWeekNumbers ? 'md:min-w-[52rem]' : 'md:min-w-[48rem]');
const weekGridClass = computed(() => props.showWeekNumbers ? 'md:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]' : 'md:grid-cols-7');

function buildMonth(firstMonth, index) {
	const monthDate = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
	const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
	const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
	const firstVisibleDate = index === 0 && rangeStart.value
		? maxDate(monthStart, rangeStart.value)
		: monthStart;
	const gridStart = startOfWeek(firstVisibleDate, resolvedWeekStartsOn.value);
	const gridEnd = props.fixedWeeks
		? addDays(gridStart, 41)
		: endOfWeek(monthEnd, resolvedWeekStartsOn.value);
	const value = monthValue(monthStart);
	const month = {
		date: monthStart,
		value,
		id: `${rootId}-${value}`,
		month: monthStart.getMonth() + 1,
		year: monthStart.getFullYear(),
		label: monthLabelFormatter.value.format(monthStart),
		cells: [],
		weeks: [],
	};
	const cells = [];
	let cursor = gridStart;
	let indexInGrid = 0;

	while (cursor <= gridEnd) {
		const date = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
		const cell = buildCell(date, month, indexInGrid);
		cells.push(cell);
		cursor = addDays(cursor, 1);
		indexInGrid += 1;
	}

	month.cells = cells;
	month.weeks = chunkWeeks(cells);
	return month;
}

function buildCell(date, month, indexInGrid) {
	const value = formatDate(date);
	const distanceFromRenderedMonth = monthDistance(date, month.date);
	const currentMonth = distanceFromRenderedMonth === 0;
	const previousMonth = distanceFromRenderedMonth < 0;
	const nextMonth = distanceFromRenderedMonth > 0;
	const adjacentMonth = previousMonth || nextMonth;
	const hidden = !currentMonth && !props.showAdjacentDays;
	const cell = {
		date,
		value,
		day: date.getDate(),
		weekday: weekdayLabelFormatter.value.format(date),
		label: dateLabelFormatter.value.format(date),
		currentMonth,
		previousMonth,
		nextMonth,
		adjacentMonth,
		hidden,
		monthValue: month.value,
		row: Math.floor(indexInGrid / 7),
		column: indexInGrid % 7,
		today: value === todayValue,
		past: value < todayValue,
		future: value > todayValue,
		muted: false,
		disabled: false,
	};
	cell.muted = hidden || adjacentMonth || beforeBoundary(value, props.mutedBefore) || afterBoundary(value, props.mutedAfter);
	cell.disabled = hidden
		|| outsideRange(value)
		|| (!currentMonth && !props.clickableAdjacentDays)
		|| Boolean(props.disabledDate?.(cell));
	return cell;
}

function initialDateFromProps() {
	const year = Number(props.initialYear);
	const month = Number(props.initialMonth);
	if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
	const clampedMonth = Math.min(12, Math.max(1, Math.round(month)));
	return new Date(year, clampedMonth - 1, 1);
}

function parseDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
	const [year, month, day] = value.split('-').map(Number);
	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
	return date;
}

function pad(value) {
	return String(value).padStart(2, '0');
}

function formatDate(date) {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthValue(date) {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/**
 * Returns the number of calendar months between a day and its rendered month.
 *
 * @param {Date} date Date represented by the rendered cell.
 * @param {Date} monthDate First day of the rendered month.
 * @returns {number} Negative for previous-month cells, positive for next-month cells, and zero for current-month cells.
 */
function monthDistance(date, monthDate) {
	return ((date.getFullYear() - monthDate.getFullYear()) * 12) + date.getMonth() - monthDate.getMonth();
}

function clampWeekStartsOn(value) {
	const day = Number(value);
	if (!Number.isFinite(day)) return 1;
	return Math.min(6, Math.max(0, Math.round(day)));
}

function clampMonthCount(value) {
	const count = Number(value);
	if (!Number.isFinite(count)) return 1;
	return Math.min(120, Math.max(1, Math.round(count)));
}

function addDays(date, days) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function maxDate(a, b) {
	return a > b ? a : b;
}

function startOfWeek(date, weekStartsOn) {
	const offset = (date.getDay() - weekStartsOn + 7) % 7;
	return addDays(date, -offset);
}

function endOfWeek(date, weekStartsOn) {
	return addDays(startOfWeek(date, weekStartsOn), 6);
}

function chunkWeeks(cells) {
	const weeks = [];
	for (let index = 0; index < cells.length; index += 7) {
		const days = cells.slice(index, index + 7);
		const weekNumber = isoWeekNumberForWeek(days);
		weeks.push({
			index: weeks.length,
			weekNumber,
			label: `Week ${weekNumber}`,
			days,
		});
	}
	return weeks;
}

function isoWeekNumberForWeek(days) {
	const thursday = days.find((cell) => cell.date.getDay() === 4)?.date || days[0]?.date || new Date();
	return isoWeekNumber(thursday);
}

function isoWeekNumber(date) {
	const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const day = target.getDay() || 7;
	target.setDate(target.getDate() + 4 - day);
	const yearStart = new Date(target.getFullYear(), 0, 1);
	return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
}

function isDateBoundary(value) {
	return /^\d{4}-\d{2}-\d{2}$/.test(value || '');
}

function beforeBoundary(value, boundary) {
	return isDateBoundary(boundary) && value < boundary;
}

function afterBoundary(value, boundary) {
	return isDateBoundary(boundary) && value > boundary;
}

function outsideRange(value) {
	return beforeBoundary(value, props.min) || afterBoundary(value, props.max);
}

function createEmptyDragState() {
	return {
		active: false,
		sourceCell: null,
		overCell: null,
		data: null,
	};
}

function dragAttrsFor(cell) {
	return (data = null, options = {}) => {
		if (!canStartDrag(cell)) {
			return {
				draggable: false,
			};
		}

		return {
			draggable: true,
			'data-dom-month-calendar-drag': '',
			onDragstart: (event) => onItemDragStart(cell, data, options, event),
			onDragend: (event) => onItemDragEnd(cell, data, event),
		};
	};
}

function dragStateFor(cell) {
	const state = dragState.value;
	return {
		active: state.active,
		source: isDragSource(cell),
		over: isDropTarget(cell),
		sourceCell: state.sourceCell,
		overCell: state.overCell,
		data: state.data,
	};
}

function canStartDrag(cell) {
	return props.dragAndDrop && !cell.hidden && !cell.disabled;
}

function canDropOnCell(cell) {
	return props.dragAndDrop && !cell.hidden && !cell.disabled;
}

function isDragSource(cell) {
	return dragState.value.sourceCell?.value === cell.value;
}

function isDropTarget(cell) {
	return dragState.value.overCell?.value === cell.value;
}

function onItemDragStart(cell, data, options, event) {
	if (!canStartDrag(cell)) {
		event.preventDefault();
		return;
	}

	dragState.value = {
		active: true,
		sourceCell: cell,
		overCell: null,
		data,
	};

	if (event.dataTransfer) {
		event.dataTransfer.effectAllowed = options.effectAllowed || 'move';
		safeSetData(event, calendarDragType, serializeDragData({
			sourceValue: cell.value,
			sourceMonth: cell.monthValue,
			data,
		}));
		safeSetData(event, 'text/plain', plainTextForDrag(data, cell));
	}

	emit('day-drag-start', dragPayload(cell, event));
}

function onItemDragEnd(cell, data, event) {
	emit('day-drag-end', {
		...dragPayload(cell, event),
		data,
	});
	dragState.value = createEmptyDragState();
}

function onDayDragEnter(cell, event) {
	if (!canDropOnCell(cell)) return;
	event.preventDefault();
	applyDropEffect(event);
	if (!isDropTarget(cell)) {
		dragState.value = {
			...dragState.value,
			active: true,
			overCell: cell,
		};
		emit('day-drag-enter', dragPayload(cell, event));
	}
}

function onDayDragOver(cell, event) {
	if (!canDropOnCell(cell)) return;
	event.preventDefault();
	applyDropEffect(event);
	if (!isDropTarget(cell)) {
		dragState.value = {
			...dragState.value,
			active: true,
			overCell: cell,
		};
	}
}

function onDayDragLeave(cell, event) {
	if (!isDropTarget(cell) || event.currentTarget.contains(event.relatedTarget)) return;
	emit('day-drag-leave', dragPayload(cell, event));
	const nextState = {
		...dragState.value,
		overCell: null,
	};
	dragState.value = nextState.sourceCell ? nextState : createEmptyDragState();
}

function onDayDrop(cell, event) {
	if (!canDropOnCell(cell)) return;
	event.preventDefault();
	applyDropEffect(event);
	emit('day-drop', dragPayload(cell, event));
	const nextState = {
		...dragState.value,
		overCell: null,
	};
	dragState.value = nextState.sourceCell ? nextState : createEmptyDragState();
}

function applyDropEffect(event) {
	if (event.dataTransfer) event.dataTransfer.dropEffect = props.dropEffect;
}

function plainTextForDrag(data, cell) {
	if (typeof data === 'string') return data;
	if (data && typeof data === 'object' && 'id' in data) return String(data.id);
	return cell.value;
}

function serializeDragData(payload) {
	try {
		return JSON.stringify(payload);
	} catch {
		return JSON.stringify({
			sourceValue: payload.sourceValue,
			sourceMonth: payload.sourceMonth,
		});
	}
}

function dragPayload(cell, event) {
	const transferPayload = dragTransferPayload(event);
	const sourceValue = dragState.value.sourceCell?.value || transferPayload.sourceValue || transferPayload.sourceDate || '';
	const data = dragState.value.data ?? transferPayload.data ?? null;
	return {
		cell,
		targetCell: cell,
		sourceCell: dragState.value.sourceCell || cellForValue(sourceValue),
		sourceValue,
		targetValue: cell.value,
		data,
		event,
		dataTransfer: event.dataTransfer,
		types: dataTransferTypes(event),
		getData: (type) => safeGetData(event, type),
	};
}

function dragTransferPayload(event) {
	const payload = safeGetData(event, calendarDragType);
	if (!payload) return {};
	try {
		const parsed = JSON.parse(payload);
		return parsed && typeof parsed === 'object' ? parsed : { data: parsed };
	} catch {
		return {};
	}
}

function cellForValue(value) {
	if (!value) return null;
	for (const month of renderedMonths.value) {
		const cell = month.cells.find((day) => day.value === value);
		if (cell) return cell;
	}
	return null;
}

function dataTransferTypes(event) {
	return Array.from(event.dataTransfer?.types || []);
}

function safeGetData(event, type) {
	try {
		return event.dataTransfer?.getData(type) || '';
	} catch {
		return '';
	}
}

function safeSetData(event, type, value) {
	try {
		event.dataTransfer?.setData(type, value);
	} catch {
		// Some browsers reject non-string payloads or unavailable drag stores.
	}
}

/**
 * Resolves a class prop that may be static or computed from the day cell.
 *
 * @param {MonthCalendarDayClass} classValue Class prop value to resolve.
 * @param {MonthCalendarCell} cell Day cell passed to function class props.
 * @returns {unknown} Class value accepted by Vue's class binding.
 */
function resolveDayClass(classValue, cell) {
	if (!classValue) return '';
	if (typeof classValue === 'function') return classValue(cell);
	return classValue;
}

/**
 * Chooses the base visual state classes for a day cell.
 *
 * @param {MonthCalendarCell} cell Day cell being rendered.
 * @returns {unknown} Class value for the cell's default, muted, adjacent, or hidden state.
 */
function stateDayClassFor(cell) {
	if (cell.hidden) return 'pointer-events-none bg-secondary/20 text-transparent';
	if (cell.adjacentMonth) return adjacentDayClassFor(cell);
	if (cell.muted) return mutedDayClassFor(cell);
	return 'text-canvas-fg';
}

/**
 * Resolves classes for a muted current-month day.
 *
 * @param {MonthCalendarCell} cell Day cell being rendered.
 * @returns {unknown} Custom muted classes when provided, otherwise the component default.
 */
function mutedDayClassFor(cell) {
	return props.mutedDayClass ? resolveDayClass(props.mutedDayClass, cell) : defaultMutedDayClass;
}

/**
 * Resolves classes for a visible previous or next month day.
 *
 * @param {MonthCalendarCell} cell Day cell being rendered.
 * @returns {unknown} Adjacent classes, muted classes, or the component default in priority order.
 */
function adjacentDayClassFor(cell) {
	if (props.adjacentDayClass) return resolveDayClass(props.adjacentDayClass, cell);
	if (props.mutedDayClass) return resolveDayClass(props.mutedDayClass, cell);
	return defaultMutedDayClass;
}

/**
 * Resolves consumer-supplied classes for a day cell.
 *
 * @param {MonthCalendarCell} cell Day cell being rendered.
 * @returns {unknown} Class value accepted by Vue's class binding.
 */
function dayClassFor(cell) {
	return resolveDayClass(props.dayClass, cell);
}

function dayStyleFor(cell) {
	if (!props.dayStyle) return '';
	if (typeof props.dayStyle === 'function') return props.dayStyle(cell);
	return props.dayStyle;
}

function onDayClick(cell, event) {
	if (!props.clickable || cell.disabled) return;
	emit('day-click', { cell, event });
}
</script>

<template>
	<div class="w-full min-w-0 space-y-10">
		<section
			v-for="month in renderedMonths"
			:key="month.value"
			class="min-w-0"
		>
			<header class="mb-4 flex flex-wrap items-end justify-between gap-3">
				<h2 :id="month.id" class="text-3xl font-bold tracking-tight text-canvas-fg">{{ month.label }}</h2>
				<div class="text-sm font-medium text-muted-fg">
					<slot name="month-header" :month="month" />
				</div>
			</header>

			<div class="overflow-x-auto rounded-2xl border border-border bg-canvas">
				<div
					role="grid"
					:aria-labelledby="month.id"
					class="min-w-0"
					:class="gridMinWidthClass"
				>
					<div
						v-if="dayHeaders"
						role="row"
						class="hidden border-b border-border bg-secondary/30 md:grid"
						:class="weekGridClass"
					>
						<div
							v-if="showWeekNumbers"
							role="columnheader"
							class="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-fg"
						>
							Week
						</div>
						<div
							v-for="(weekday, index) in weekdayLabels"
							:key="weekday"
							role="columnheader"
							class="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-fg"
							:class="(index > 0 || showWeekNumbers) && 'border-l border-border'"
						>
							{{ weekday }}
						</div>
					</div>

					<div
						v-for="week in month.weeks"
						:key="week.index"
						role="row"
						class="grid grid-cols-1"
						:class="weekGridClass"
					>
						<div
							v-if="showWeekNumbers"
							role="rowheader"
							:aria-label="week.label"
							class="flex min-h-10 items-center justify-between gap-3 bg-secondary/35 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-fg sm:min-h-12 md:min-h-30 md:flex-col md:items-start md:justify-start md:py-3 lg:min-h-44"
							:class="week.index > 0 && 'border-t border-border'"
						>
							<span class="text-base leading-none tabular-nums">{{ week.weekNumber }}</span>
						</div>
						<component
							:is="clickable ? 'button' : 'div'"
							v-for="cell in week.days"
							:key="cell.value"
							:type="clickable ? 'button' : undefined"
							:role="cell.hidden ? undefined : 'gridcell'"
							:tabindex="clickable && !cell.disabled ? 0 : undefined"
							:disabled="clickable && cell.disabled ? true : undefined"
							:aria-hidden="cell.hidden ? 'true' : undefined"
							:aria-label="cell.hidden ? undefined : cell.label"
							:aria-current="cell.today ? 'date' : undefined"
							:aria-disabled="clickable && cell.disabled ? 'true' : undefined"
							:data-date="cell.hidden ? undefined : cell.value"
							:data-current-month="cell.currentMonth ? '' : undefined"
							:data-adjacent-month="cell.adjacentMonth ? '' : undefined"
							:data-previous-month="cell.previousMonth ? '' : undefined"
							:data-next-month="cell.nextMonth ? '' : undefined"
							:data-muted="cell.muted ? '' : undefined"
							:data-today="cell.today ? '' : undefined"
							:data-drag-source="isDragSource(cell) ? '' : undefined"
							:data-drop-target="isDropTarget(cell) ? '' : undefined"
							class="flex min-h-30 w-full min-w-0 flex-col items-stretch justify-start p-3 text-left outline-none transition sm:min-h-38 lg:min-h-44"
							:class="[
								(showWeekNumbers || cell.row > 0 || cell.column > 0) && 'border-t border-border',
								cell.row === 0 && (showWeekNumbers || cell.column > 0) && 'md:border-t-0',
								(cell.column > 0 || showWeekNumbers) && 'md:border-l md:border-border',
								stateDayClassFor(cell),
								clickable && !cell.disabled && 'cursor-pointer hover:bg-secondary/50 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
								clickable && cell.disabled && 'cursor-not-allowed opacity-55',
								!clickable && 'cursor-default',
								cell.today && !cell.hidden && 'ring-2 ring-inset ring-ring/40',
								dayClassFor(cell),
								dragAndDrop && dragState.active && canDropOnCell(cell) && !isDropTarget(cell) && 'bg-primary/5',
								dragAndDrop && isDropTarget(cell) && 'bg-primary/10 ring-2 ring-inset ring-ring/60',
								dragAndDrop && isDragSource(cell) && 'opacity-75',
							]"
							:style="dayStyleFor(cell)"
							@click="onDayClick(cell, $event)"
							@dragenter="onDayDragEnter(cell, $event)"
							@dragover="onDayDragOver(cell, $event)"
							@dragleave="onDayDragLeave(cell, $event)"
							@drop="onDayDrop(cell, $event)"
						>
							<template v-if="!cell.hidden">
								<div class="flex items-start justify-between gap-2">
									<span class="text-base font-bold leading-none tabular-nums">{{ cell.day }}</span>
									<span class="text-base lowercase leading-none tabular-nums">{{ cell.weekday }}</span>
								</div>
								<div class="mt-3 min-h-0">
									<slot
										:cell="cell"
										:month="month"
										:drag="dragStateFor(cell)"
										:dragAttrs="dragAttrsFor(cell)"
									/>
								</div>
							</template>
						</component>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>
