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
 * @property {string} [activeMonthValue] Month key used by continuous mode's sticky month header.
 * @property {Array<string>} [monthBoundaryValues] Date keys where a visible continuous month segment starts.
 * @property {Array<string>} [monthLabels] Month labels that start or become visible in a continuous row.
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
	continuous: {
		type: Boolean,
		default: false,
		_edit: { description: 'Render one continuous week grid across the range instead of separated month blocks with repeated adjacent days.' },
	},
	containedContinuousScroll: {
		type: Boolean,
		default: true,
		_edit: { description: 'Constrain continuous mode to its own scrollport. Disable when a parent layout already owns the vertical scroll.' },
	},
	hoverableDays: {
		type: Boolean,
		default: true,
		_edit: { description: 'Apply the default hover background to clickable day cells.' },
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';

defineOptions({
	__doc: {
		name: 'Month calendar',
		tag: '<DomMonthCalendar>',
		description: 'A large scrolling month calendar that keeps weekday grids aligned, supports continuous date streams, and lets each day render custom UI.',
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
			{ name: 'month-header', payload: '{ month }', description: 'Custom content rendered opposite separated month titles or above a continuous range.' },
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
const activeContinuousMonthValue = ref('');
const calendarRoot = ref(null);
const externalContinuousScrollHost = ref(null);
const resolvedWeekStartsOn = computed(() => clampWeekStartsOn(props.weekStartsOn));
const defaultMutedDayClass = 'bg-secondary/20 text-muted-fg/55';
const rangeStart = computed(() => parseDate(props.startDate));
const anchorDate = computed(() => rangeStart.value || initialDateFromProps() || new Date());
const calendarRange = computed(() => resolveCalendarRange());
const monthLabelFormatter = computed(() => new Intl.DateTimeFormat(props.locale, {
	month: 'long',
	year: 'numeric',
}));
const continuousMonthLabelFormatter = computed(() => new Intl.DateTimeFormat(props.locale, {
	month: 'short',
	year: '2-digit',
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
	const range = calendarRange.value;
	return Array.from({ length: range.count }, (_, index) => buildMonth(range.firstMonth, index));
});
const continuousWeeks = computed(() => buildContinuousWeeks(calendarRange.value));
const continuousMonths = computed(() => collectContinuousMonths(continuousWeeks.value));
const firstContinuousMonth = computed(() => continuousMonths.value.values().next().value || null);
const firstContinuousMonthLabel = computed(() => firstContinuousMonth.value ? continuousMonthLabelForDate(firstContinuousMonth.value.date) : 'Month');
const continuousHeaderMonthLabel = computed(() => {
	const month = continuousMonths.value.get(activeContinuousMonthValue.value) || firstContinuousMonth.value;
	return month ? continuousMonthLabelForDate(month.date) : firstContinuousMonthLabel.value;
});
const calendarSections = computed(() => props.continuous ? [buildContinuousSection()] : renderedMonths.value.map((month) => ({
	key: month.value,
	id: month.id,
	label: month.label,
	month,
	weeks: month.weeks,
	continuous: false,
})));
const calendarCells = computed(() => props.continuous
	? continuousWeeks.value.flatMap((week) => week.days)
	: renderedMonths.value.flatMap((month) => month.cells));
const hasRowRail = computed(() => props.showWeekNumbers || props.continuous);
const rowRailHeaderLabel = computed(() => {
	if (!props.continuous) return 'Week';
	return continuousHeaderMonthLabel.value;
});
const gridMinWidthClass = computed(() => {
	if (props.continuous) return 'md:min-w-[56rem]';
	return hasRowRail.value ? 'md:min-w-[52rem]' : 'md:min-w-[48rem]';
});
const weekGridClass = computed(() => {
	if (props.continuous) return 'md:grid-cols-[5.5rem_repeat(7,minmax(0,1fr))]';
	return hasRowRail.value ? 'md:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]' : 'md:grid-cols-7';
});

onMounted(() => {
	nextTick(configureExternalContinuousScrollTracking);
});

onBeforeUnmount(() => {
	removeExternalContinuousScrollTracking();
});

watch(
	() => [props.continuous, props.containedContinuousScroll, props.startDate, props.months, props.weekStartsOn],
	() => {
		nextTick(configureExternalContinuousScrollTracking);
	},
	{ flush: 'post' },
);

/**
 * Resolves the month and date range that all rendered calendar modes share.
 *
 * @returns {{ count: number, firstMonth: Date, firstVisibleDate: Date, lastMonth: Date, lastDate: Date }} Normalized range metadata.
 */
function resolveCalendarRange() {
	const count = clampMonthCount(props.months);
	const firstMonth = new Date(anchorDate.value.getFullYear(), anchorDate.value.getMonth(), 1);
	const firstVisibleDate = rangeStart.value ? maxDate(firstMonth, rangeStart.value) : firstMonth;
	const lastMonth = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + count - 1, 1);
	const lastDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
	return {
		count,
		firstMonth,
		firstVisibleDate,
		lastMonth,
		lastDate,
	};
}

/**
 * Creates a month record used for labels, ARIA relationships, slots, and docs payloads.
 *
 * @param {Date} monthStart First day of the month represented by the record.
 * @returns {MonthCalendarMonth} Month metadata with mutable cells and weeks arrays.
 */
function createMonthRecord(monthStart) {
	const value = monthValue(monthStart);
	return {
		date: monthStart,
		value,
		id: `${rootId}-${value}`,
		month: monthStart.getMonth() + 1,
		year: monthStart.getFullYear(),
		label: monthLabelFormatter.value.format(monthStart),
		cells: [],
		weeks: [],
	};
}

/**
 * Builds one separated month grid for the default stacked calendar layout.
 *
 * @param {Date} firstMonth First month in the rendered range.
 * @param {number} index Zero-based month offset from the first rendered month.
 * @returns {MonthCalendarMonth} Month record with visible cells and week rows.
 */
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
	const month = createMonthRecord(monthStart);
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

/**
 * Builds one day cell and applies range, muted, disabled, and adjacent-month state.
 *
 * @param {Date} date Date represented by the cell.
 * @param {MonthCalendarMonth} month Month context for the cell.
 * @param {number} indexInGrid Zero-based cell index inside the rendered grid.
 * @param {{ continuous?: boolean, rangeStart?: Date, rangeEnd?: Date }} [options] Layout-specific cell options.
 * @returns {MonthCalendarCell} Calendar cell payload passed to rendering and slots.
 */
function buildCell(date, month, indexInGrid, options = {}) {
	const value = formatDate(date);
	const continuous = Boolean(options.continuous);
	const previousMonth = continuous ? date < options.rangeStart : monthDistance(date, month.date) < 0;
	const nextMonth = continuous ? date > options.rangeEnd : monthDistance(date, month.date) > 0;
	const adjacentMonth = previousMonth || nextMonth;
	const currentMonth = !adjacentMonth;
	const hidden = continuous ? adjacentMonth : !currentMonth && !props.showAdjacentDays;
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
	cell.muted = hidden || (!continuous && adjacentMonth) || beforeBoundary(value, props.mutedBefore) || afterBoundary(value, props.mutedAfter);
	cell.disabled = hidden
		|| outsideRange(value)
		|| (!continuous && !currentMonth && !props.clickableAdjacentDays)
		|| Boolean(props.disabledDate?.(cell));
	return cell;
}

/**
 * Builds a single week stream for continuous mode without duplicating month-edge dates.
 *
 * @param {{ firstVisibleDate: Date, lastDate: Date }} range Normalized calendar range.
 * @returns {Array<MonthCalendarWeek>} Continuous weeks with subtle month labels attached.
 */
function buildContinuousWeeks(range) {
	const cells = [];
	const gridStart = startOfWeek(range.firstVisibleDate, resolvedWeekStartsOn.value);
	const gridEnd = endOfWeek(range.lastDate, resolvedWeekStartsOn.value);
	let cursor = gridStart;
	let indexInGrid = 0;

	while (cursor <= gridEnd) {
		const date = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
		const month = createMonthRecord(firstDayOfMonth(date));
		cells.push(buildCell(date, month, indexInGrid, {
			continuous: true,
			rangeStart: range.firstVisibleDate,
			rangeEnd: range.lastDate,
		}));
		cursor = addDays(cursor, 1);
		indexInGrid += 1;
	}

	return chunkWeeks(cells).map((week) => {
		const boundaryCells = continuousBoundaryCellsForWeek(week, range);
		return {
			...week,
			activeMonthValue: continuousActiveMonthValueForWeek(week, range),
			monthBoundaryValues: boundaryCells.map((cell) => cell.value),
			monthLabels: continuousMonthLabelsForBoundaryCells(boundaryCells),
		};
	});
}

/**
 * Collects month records from the continuous week stream for day-slot payloads.
 *
 * @param {Array<MonthCalendarWeek>} weeks Continuous weeks to group by cell month.
 * @returns {Map<string, MonthCalendarMonth>} Month records keyed by YYYY-MM.
 */
function collectContinuousMonths(weeks) {
	const months = new Map();

	for (const week of weeks) {
		for (const cell of week.days) {
			if (cell.hidden) continue;
			if (!months.has(cell.monthValue)) {
				months.set(cell.monthValue, createMonthRecord(firstDayOfMonth(cell.date)));
			}
			months.get(cell.monthValue).cells.push(cell);
		}
	}

	for (const week of weeks) {
		for (const month of months.values()) {
			const days = week.days.filter((cell) => !cell.hidden && cell.monthValue === month.value);
			if (days.length) {
				month.weeks.push({
					...week,
					days,
				});
			}
		}
	}

	return months;
}

/**
 * Builds the synthetic section used by continuous mode's single-grid template path.
 *
 * @returns {{ key: string, id: string, label: string, month: MonthCalendarMonth, weeks: Array<MonthCalendarWeek>, continuous: boolean }} Render section metadata.
 */
function buildContinuousSection() {
	const firstMonth = continuousMonths.value.values().next().value || createMonthRecord(calendarRange.value.firstMonth);
	return {
		key: 'continuous',
		id: `${rootId}-continuous`,
		label: 'Continuous calendar',
		month: firstMonth,
		weeks: continuousWeeks.value,
		continuous: true,
	};
}

/**
 * Lists cells that begin visible continuous month segments in a week row.
 *
 * @param {MonthCalendarWeek} week Week row being rendered.
 * @param {{ firstVisibleDate: Date }} range Normalized calendar range.
 * @returns {Array<MonthCalendarCell>} Boundary cells that start a visible month segment.
 */
function continuousBoundaryCellsForWeek(week, range) {
	const firstVisibleValue = formatDate(range.firstVisibleDate);
	return week.days
		.filter((cell) => !cell.hidden && (cell.day === 1 || cell.value === firstVisibleValue));
}

/**
 * Formats the visible continuous-mode month label with a compact year.
 *
 * @param {Date} date Date inside the month being labelled.
 * @returns {string} Locale-aware month label such as Jun 26.
 */
function continuousMonthLabelForDate(date) {
	return continuousMonthLabelFormatter.value.format(firstDayOfMonth(date));
}

/**
 * Lists month labels that should appear in the continuous mode row rail.
 *
 * @param {Array<MonthCalendarCell>} boundaryCells Cells that begin visible month segments.
 * @returns {Array<string>} Month labels that begin or become visible in the row.
 */
function continuousMonthLabelsForBoundaryCells(boundaryCells) {
	return boundaryCells.map((cell) => continuousMonthLabelForDate(cell.date));
}

/**
 * Chooses the month that should label the sticky row rail while a continuous row is at the top.
 *
 * @param {MonthCalendarWeek} week Week row being inspected.
 * @param {{ firstVisibleDate: Date }} range Normalized calendar range.
 * @returns {string} Month key that should represent the row in the sticky header.
 */
function continuousActiveMonthValueForWeek(week, range) {
	const firstVisibleValue = formatDate(range.firstVisibleDate);
	const firstVisibleCell = week.days.find((cell) => !cell.hidden && cell.value === firstVisibleValue);
	const monthStartCell = week.days.find((cell) => !cell.hidden && cell.day === 1);
	const fallbackCell = week.days.find((cell) => !cell.hidden);
	return (firstVisibleCell || monthStartCell || fallbackCell)?.monthValue || '';
}

/**
 * Resolves the month payload that should be exposed for a rendered day cell.
 *
 * @param {MonthCalendarCell} cell Day cell being rendered.
 * @param {MonthCalendarMonth} fallbackMonth Section month used by the default layout.
 * @returns {MonthCalendarMonth} Month context for the day slot.
 */
function monthForCell(cell, fallbackMonth) {
	if (!props.continuous) return fallbackMonth;
	return continuousMonths.value.get(cell.monthValue) || fallbackMonth;
}

/**
 * Creates a local Date for the first day of the month containing the provided date.
 *
 * @param {Date} date Date whose month should be normalized.
 * @returns {Date} First day of the date's month.
 */
function firstDayOfMonth(date) {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Resolves the accessible label for the row header rail.
 *
 * @param {MonthCalendarWeek} week Week row being rendered.
 * @returns {string} ARIA label combining month and week information where available.
 */
function rowHeaderLabelFor(week) {
	const monthLabel = week.monthLabels?.join(', ') || '';
	if (props.continuous && monthLabel && props.showWeekNumbers) return `${monthLabel}, ${week.label}`;
	if (props.continuous && monthLabel) return monthLabel;
	return week.label;
}

/**
 * Builds the initial month date from the separate initialYear and initialMonth props.
 *
 * @returns {Date|null} First day of the configured month, or null when the props are incomplete.
 */
function initialDateFromProps() {
	const year = Number(props.initialYear);
	const month = Number(props.initialMonth);
	if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
	const clampedMonth = Math.min(12, Math.max(1, Math.round(month)));
	return new Date(year, clampedMonth - 1, 1);
}

/**
 * Parses a YYYY-MM-DD string into a local Date while rejecting invalid calendar dates.
 *
 * @param {string} value Date string to parse.
 * @returns {Date|null} Parsed local date, or null when invalid.
 */
function parseDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
	const [year, month, day] = value.split('-').map(Number);
	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
	return date;
}

/**
 * Left-pads a numeric date part to two digits.
 *
 * @param {number} value Numeric date part.
 * @returns {string} Two-digit string.
 */
function pad(value) {
	return String(value).padStart(2, '0');
}

/**
 * Formats a local Date as a YYYY-MM-DD date key.
 *
 * @param {Date} date Date to format.
 * @returns {string} Date key used by slots, events, and data attributes.
 */
function formatDate(date) {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Formats a local Date as a YYYY-MM month key.
 *
 * @param {Date} date Date whose month should be formatted.
 * @returns {string} Month key used for grouping cells.
 */
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

/**
 * Normalizes the first day of week into the supported 0-6 range.
 *
 * @param {number} value Candidate first day of week.
 * @returns {number} Clamped weekday index where 0 is Sunday.
 */
function clampWeekStartsOn(value) {
	const day = Number(value);
	if (!Number.isFinite(day)) return 1;
	return Math.min(6, Math.max(0, Math.round(day)));
}

/**
 * Normalizes the requested month count to a bounded positive integer.
 *
 * @param {number} value Candidate month count.
 * @returns {number} Month count between 1 and 120.
 */
function clampMonthCount(value) {
	const count = Number(value);
	if (!Number.isFinite(count)) return 1;
	return Math.min(120, Math.max(1, Math.round(count)));
}

/**
 * Adds whole calendar days using local-date arithmetic.
 *
 * @param {Date} date Starting date.
 * @param {number} days Number of days to add.
 * @returns {Date} New local Date offset by the requested days.
 */
function addDays(date, days) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Returns the later of two local Date values.
 *
 * @param {Date} a First date.
 * @param {Date} b Second date.
 * @returns {Date} Later date.
 */
function maxDate(a, b) {
	return a > b ? a : b;
}

/**
 * Finds the first date in the week containing a date.
 *
 * @param {Date} date Date inside the target week.
 * @param {number} weekStartsOn First day of week where 0 is Sunday.
 * @returns {Date} Local Date at the start of the week.
 */
function startOfWeek(date, weekStartsOn) {
	const offset = (date.getDay() - weekStartsOn + 7) % 7;
	return addDays(date, -offset);
}

/**
 * Finds the last date in the week containing a date.
 *
 * @param {Date} date Date inside the target week.
 * @param {number} weekStartsOn First day of week where 0 is Sunday.
 * @returns {Date} Local Date at the end of the week.
 */
function endOfWeek(date, weekStartsOn) {
	return addDays(startOfWeek(date, weekStartsOn), 6);
}

/**
 * Splits a flat cell list into seven-day week rows.
 *
 * @param {Array<MonthCalendarCell>} cells Calendar cells ordered by date.
 * @returns {Array<MonthCalendarWeek>} Week rows with ISO week labels.
 */
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

/**
 * Resolves the ISO week number represented by a row of day cells.
 *
 * @param {Array<MonthCalendarCell>} days Day cells in a week row.
 * @returns {number} ISO-8601 week number.
 */
function isoWeekNumberForWeek(days) {
	const thursday = days.find((cell) => cell.date.getDay() === 4)?.date || days[0]?.date || new Date();
	return isoWeekNumber(thursday);
}

/**
 * Calculates an ISO-8601 week number for a local date.
 *
 * @param {Date} date Date whose ISO week should be calculated.
 * @returns {number} ISO-8601 week number.
 */
function isoWeekNumber(date) {
	const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const day = target.getDay() || 7;
	target.setDate(target.getDate() + 4 - day);
	const yearStart = new Date(target.getFullYear(), 0, 1);
	return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
}

/**
 * Checks whether a string is shaped like a YYYY-MM-DD date boundary.
 *
 * @param {string} value Candidate boundary value.
 * @returns {boolean} True when the value can be compared as a date key.
 */
function isDateBoundary(value) {
	return /^\d{4}-\d{2}-\d{2}$/.test(value || '');
}

/**
 * Checks whether a date key falls before a configured boundary.
 *
 * @param {string} value Date key to compare.
 * @param {string} boundary Boundary date key.
 * @returns {boolean} True when the boundary is valid and value is earlier.
 */
function beforeBoundary(value, boundary) {
	return isDateBoundary(boundary) && value < boundary;
}

/**
 * Checks whether a date key falls after a configured boundary.
 *
 * @param {string} value Date key to compare.
 * @param {string} boundary Boundary date key.
 * @returns {boolean} True when the boundary is valid and value is later.
 */
function afterBoundary(value, boundary) {
	return isDateBoundary(boundary) && value > boundary;
}

/**
 * Checks whether a date key is outside the interactive min and max range.
 *
 * @param {string} value Date key to test.
 * @returns {boolean} True when the day is before min or after max.
 */
function outsideRange(value) {
	return beforeBoundary(value, props.min) || afterBoundary(value, props.max);
}

/**
 * Creates the inert drag state used before, after, or outside a drag gesture.
 *
 * @returns {MonthCalendarDragState} Empty drag state.
 */
function createEmptyDragState() {
	return {
		active: false,
		sourceCell: null,
		overCell: null,
		data: null,
	};
}

/**
 * Builds a slot helper that returns drag attributes for app-rendered day content.
 *
 * @param {MonthCalendarCell} cell Cell that owns the draggable content.
 * @returns {MonthCalendarDragAttrs} Function exposed through the day slot.
 */
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

/**
 * Resolves drag state booleans for a specific day cell.
 *
 * @param {MonthCalendarCell} cell Cell being rendered.
 * @returns {MonthCalendarDragState & { source: boolean, over: boolean }} Drag state scoped to the cell.
 */
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

/**
 * Checks whether a drag can begin from a cell.
 *
 * @param {MonthCalendarCell} cell Candidate drag source cell.
 * @returns {boolean} True when drag-and-drop is enabled and the cell is interactive.
 */
function canStartDrag(cell) {
	return props.dragAndDrop && !cell.hidden && !cell.disabled;
}

/**
 * Checks whether a cell can receive the current dragged item.
 *
 * @param {MonthCalendarCell} cell Candidate drop target cell.
 * @returns {boolean} True when drag-and-drop is enabled and the cell is interactive.
 */
function canDropOnCell(cell) {
	return props.dragAndDrop && !cell.hidden && !cell.disabled;
}

/**
 * Checks whether a cell is the active drag source.
 *
 * @param {MonthCalendarCell} cell Cell being rendered.
 * @returns {boolean} True when the active drag began from this date.
 */
function isDragSource(cell) {
	return dragState.value.sourceCell?.value === cell.value;
}

/**
 * Checks whether a cell is the current drop preview target.
 *
 * @param {MonthCalendarCell} cell Cell being rendered.
 * @returns {boolean} True when the active drag is over this date.
 */
function isDropTarget(cell) {
	return dragState.value.overCell?.value === cell.value;
}

/**
 * Handles native dragstart for an app-rendered item inside a day cell.
 *
 * @param {MonthCalendarCell} cell Source day cell.
 * @param {unknown} data App-owned data passed through dragAttrs.
 * @param {MonthCalendarDragAttrsOptions} options Native transfer options.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
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

/**
 * Handles native dragend and clears calendar drag state.
 *
 * @param {MonthCalendarCell} cell Source day cell.
 * @param {unknown} data App-owned data passed through dragAttrs.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onItemDragEnd(cell, data, event) {
	emit('day-drag-end', {
		...dragPayload(cell, event),
		data,
	});
	dragState.value = createEmptyDragState();
}

/**
 * Handles dragenter for a day cell and emits a target preview event.
 *
 * @param {MonthCalendarCell} cell Candidate drop target cell.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
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

/**
 * Handles dragover for a day cell and keeps the drop effect current.
 *
 * @param {MonthCalendarCell} cell Candidate drop target cell.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
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

/**
 * Handles dragleave for a day cell without clearing state for child transitions.
 *
 * @param {MonthCalendarCell} cell Cell being left.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onDayDragLeave(cell, event) {
	if (!isDropTarget(cell) || event.currentTarget.contains(event.relatedTarget)) return;
	emit('day-drag-leave', dragPayload(cell, event));
	const nextState = {
		...dragState.value,
		overCell: null,
	};
	dragState.value = nextState.sourceCell ? nextState : createEmptyDragState();
}

/**
 * Handles a completed drop onto a day cell.
 *
 * @param {MonthCalendarCell} cell Drop target cell.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
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

/**
 * Applies the configured native drop effect to the active drag event.
 *
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function applyDropEffect(event) {
	if (event.dataTransfer) event.dataTransfer.dropEffect = props.dropEffect;
}

/**
 * Chooses a plain-text fallback payload for browser drag data stores.
 *
 * @param {unknown} data App-owned drag data.
 * @param {MonthCalendarCell} cell Source day cell.
 * @returns {string} Text payload for native transfer compatibility.
 */
function plainTextForDrag(data, cell) {
	if (typeof data === 'string') return data;
	if (data && typeof data === 'object' && 'id' in data) return String(data.id);
	return cell.value;
}

/**
 * Serializes app drag data while falling back to date-only metadata when needed.
 *
 * @param {{ sourceValue: string, sourceMonth: string, data: unknown }} payload Drag payload to serialize.
 * @returns {string} JSON string safe for a DataTransfer store.
 */
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

/**
 * Builds the payload emitted for calendar drag events.
 *
 * @param {MonthCalendarCell} cell Target or source cell associated with the event.
 * @param {DragEvent} event Native drag event.
 * @returns {MonthCalendarDayDragPayload} Public drag event payload.
 */
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

/**
 * Reads the DOM Studio calendar payload from a native drag transfer.
 *
 * @param {DragEvent} event Native drag event.
 * @returns {Record<string, unknown>} Parsed drag payload, or an empty object.
 */
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

/**
 * Finds the currently rendered cell for a date key.
 *
 * @param {string} value YYYY-MM-DD date key.
 * @returns {MonthCalendarCell|null} Matching visible or hidden cell, when rendered.
 */
function cellForValue(value) {
	if (!value) return null;
	return calendarCells.value.find((day) => day.value === value) || null;
}

/**
 * Safely lists DataTransfer types from a drag event.
 *
 * @param {DragEvent} event Native drag event.
 * @returns {Array<string>} DataTransfer types available to the drop handler.
 */
function dataTransferTypes(event) {
	return Array.from(event.dataTransfer?.types || []);
}

/**
 * Safely reads one DataTransfer payload type.
 *
 * @param {DragEvent} event Native drag event.
 * @param {string} type DataTransfer MIME type.
 * @returns {string} Stored payload, or an empty string when unavailable.
 */
function safeGetData(event, type) {
	try {
		return event.dataTransfer?.getData(type) || '';
	} catch {
		return '';
	}
}

/**
 * Safely writes one DataTransfer payload type.
 *
 * @param {DragEvent} event Native drag event.
 * @param {string} type DataTransfer MIME type.
 * @param {string} value Payload value to store.
 * @returns {void}
 */
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

/**
 * Resolves the subtle partial month divider used by continuous mode.
 *
 * @param {MonthCalendarCell} cell Day cell being rendered.
 * @param {MonthCalendarWeek} week Week row containing the day cell.
 * @returns {string} Classes that mark the visible month segment edges, or an empty string.
 */
function continuousMonthDividerClassFor(cell, week) {
	if (cell.hidden || !week.monthBoundaryValues?.length) return '';
	const boundaryCells = week.days.filter((day) => week.monthBoundaryValues.includes(day.value));
	const incomingBoundary = boundaryCells.find((boundary) => boundary.monthValue === cell.monthValue && cell.column >= boundary.column);
	const outgoingBoundary = boundaryCells.find((boundary) => cell.monthValue !== boundary.monthValue && cell.column < boundary.column);
	const classes = [];

	if (incomingBoundary) {
		classes.push('dom-month-calendar__day--continuous-month-segment');
		if (cell.value === incomingBoundary.value && incomingBoundary.column > 0) {
			classes.push('dom-month-calendar__day--continuous-month-start');
		}
	}

	if (outgoingBoundary) {
		classes.push('dom-month-calendar__day--continuous-month-outgoing');
	}

	return classes.join(' ');
}

/**
 * Tracks the month represented by the top visible row inside a continuous calendar scrollport.
 *
 * @param {{ continuous?: boolean }} section Render section receiving the scroll event.
 * @param {Event} event Native scroll event from the section wrapper.
 * @returns {void}
 */
function onSectionScroll(section, event) {
	if (!section.continuous || !props.containedContinuousScroll) return;
	const scrollHost = event.currentTarget;
	if (!(scrollHost instanceof HTMLElement)) return;
	updateActiveContinuousMonthForScrollHost(scrollHost, scrollHost);
}

/**
 * Attaches active-month tracking to the nearest parent scrollport when continuous mode is externally scrolled.
 *
 * @returns {void}
 */
function configureExternalContinuousScrollTracking() {
	removeExternalContinuousScrollTracking();
	if (!props.continuous || props.containedContinuousScroll) {
		activeContinuousMonthValue.value = '';
		return;
	}

	const sectionElement = getContinuousSectionElement();
	const scrollHost = sectionElement ? findNearestVerticalScrollHost(sectionElement) : null;
	if (!sectionElement || !scrollHost) return;

	externalContinuousScrollHost.value = scrollHost;
	scrollHost.addEventListener('scroll', onExternalContinuousScroll, { passive: true });
	updateActiveContinuousMonthForScrollHost(scrollHost, sectionElement);
}

/**
 * Removes the external scroll listener used by parent-owned continuous scrolling.
 *
 * @returns {void}
 */
function removeExternalContinuousScrollTracking() {
	if (!externalContinuousScrollHost.value) return;
	externalContinuousScrollHost.value.removeEventListener('scroll', onExternalContinuousScroll);
	externalContinuousScrollHost.value = null;
}

/**
 * Updates the sticky month label when the parent-owned scrollport moves.
 *
 * @returns {void}
 */
function onExternalContinuousScroll() {
	const sectionElement = getContinuousSectionElement();
	const scrollHost = externalContinuousScrollHost.value;
	if (!sectionElement || !scrollHost) return;
	updateActiveContinuousMonthForScrollHost(scrollHost, sectionElement);
}

/**
 * Resolves the rendered continuous calendar section element.
 *
 * @returns {HTMLElement|null} Continuous calendar wrapper element.
 */
function getContinuousSectionElement() {
	const element = calendarRoot.value?.querySelector('[data-continuous-section]');
	return element instanceof HTMLElement ? element : null;
}

/**
 * Finds the closest ancestor that can own vertical scrolling for an externally contained calendar.
 *
 * @param {HTMLElement} element Calendar section element.
 * @returns {HTMLElement|null} Nearest vertical scroll host.
 */
function findNearestVerticalScrollHost(element) {
	let current = element.parentElement;
	while (current) {
		const overflowY = getComputedStyle(current).overflowY;
		if (/(auto|scroll|overlay)/.test(overflowY)) return current;
		current = current.parentElement;
	}
	return null;
}

/**
 * Tracks the month represented by the top visible row inside the supplied scroll host.
 *
 * @param {HTMLElement} scrollHost Element owning vertical scroll.
 * @param {HTMLElement} scope Element containing the continuous week rows.
 * @returns {void}
 */
function updateActiveContinuousMonthForScrollHost(scrollHost, scope) {
	const scopedRows = Array.from(scope.querySelectorAll('[data-continuous-week-row]'));
	if (!scopedRows.length) return;

	const hostTop = scrollHost.getBoundingClientRect().top;
	const header = scope.querySelector('[data-continuous-day-headers]');
	const headerHeight = header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;
	const activationTop = hostTop + headerHeight + 1;
	const activeRow = scopedRows.reduce((current, row) => {
		if (!(row instanceof HTMLElement)) return current;
		return row.getBoundingClientRect().top <= activationTop ? row : current;
	}, scopedRows[0]);
	const monthValue = activeRow instanceof HTMLElement ? activeRow.dataset.activeMonth : '';
	if (monthValue) activeContinuousMonthValue.value = monthValue;
}

/**
 * Resolves consumer-supplied inline styles for a day cell.
 *
 * @param {MonthCalendarCell} cell Day cell being rendered.
 * @returns {string|Record<string, string|number>} Style value accepted by Vue's style binding.
 */
function dayStyleFor(cell) {
	if (!props.dayStyle) return '';
	if (typeof props.dayStyle === 'function') return props.dayStyle(cell);
	return props.dayStyle;
}

/**
 * Emits day-click when clickable mode allows activation for a cell.
 *
 * @param {MonthCalendarCell} cell Day cell being activated.
 * @param {MouseEvent} event Native click event.
 * @returns {void}
 */
function onDayClick(cell, event) {
	if (!props.clickable || cell.disabled) return;
	emit('day-click', { cell, event });
}
</script>

<template>
	<div ref="calendarRoot" class="w-full min-w-0 space-y-10">
		<section
			v-for="section in calendarSections"
			:key="section.key"
			class="min-w-0"
		>
			<header
				v-if="!section.continuous"
				class="mb-4 flex flex-wrap items-end justify-between gap-3"
			>
				<h2 :id="section.id" class="text-3xl font-bold tracking-tight text-canvas-fg">{{ section.label }}</h2>
				<div class="text-sm font-medium text-muted-fg">
					<slot name="month-header" :month="section.month" />
				</div>
			</header>
			<header
				v-else-if="$slots['month-header']"
				class="mb-3 flex justify-end text-sm font-medium text-muted-fg"
			>
				<h2 :id="section.id" class="sr-only">{{ section.label }}</h2>
				<slot name="month-header" :month="section.month" />
			</header>
			<h2 v-else :id="section.id" class="sr-only">{{ section.label }}</h2>

			<div
				class="rounded-2xl border border-border bg-canvas"
				:data-continuous-section="section.continuous ? '' : undefined"
				:class="[
					section.continuous && containedContinuousScroll && 'max-h-[70vh] overflow-auto overscroll-contain',
					section.continuous && !containedContinuousScroll && 'overflow-x-auto md:overflow-visible',
					!section.continuous && 'overflow-x-auto',
				]"
				@scroll.passive="onSectionScroll(section, $event)"
			>
				<div
					role="grid"
					:aria-labelledby="section.id"
					class="min-w-0"
					:class="gridMinWidthClass"
				>
					<div
						v-if="dayHeaders"
						role="row"
						:data-continuous-day-headers="section.continuous ? '' : undefined"
						class="hidden border-b border-border md:grid"
						:class="[
							weekGridClass,
							section.continuous ? 'sticky top-0 z-20 bg-secondary shadow-sm' : 'bg-secondary/30',
						]"
					>
						<div
							v-if="hasRowRail"
							role="columnheader"
							class="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-fg"
						>
							{{ rowRailHeaderLabel }}
						</div>
						<div
							v-for="(weekday, index) in weekdayLabels"
							:key="weekday"
							role="columnheader"
							class="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-fg"
							:class="(index > 0 || hasRowRail) && 'border-l border-border'"
						>
							{{ weekday }}
						</div>
					</div>

					<div
						v-for="week in section.weeks"
						:key="week.index"
						role="row"
						:data-continuous-week-row="section.continuous ? '' : undefined"
						:data-active-month="section.continuous ? week.activeMonthValue : undefined"
						class="grid grid-cols-1"
						:class="weekGridClass"
					>
						<div
							v-if="hasRowRail"
							role="rowheader"
							:aria-label="rowHeaderLabelFor(week)"
							class="flex min-h-10 items-center justify-between gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-fg sm:min-h-12 md:min-h-30 md:flex-col md:items-start md:justify-start md:py-3 lg:min-h-44"
							:class="[
								week.index > 0 && 'border-t border-border',
								section.continuous ? 'bg-canvas' : 'bg-secondary/35',
								section.continuous && week.monthLabels?.length && 'bg-secondary/20',
							]"
						>
							<div v-if="section.continuous && week.monthLabels?.length" class="space-y-1">
								<span
									v-for="label in week.monthLabels"
									:key="label"
									class="block text-[11px] font-bold leading-tight text-canvas-fg/70"
								>
									{{ label }}
								</span>
							</div>
							<span v-if="showWeekNumbers" class="text-base leading-none tabular-nums">{{ week.weekNumber }}</span>
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
								(hasRowRail || cell.row > 0 || cell.column > 0) && 'border-t border-border',
								cell.row === 0 && (hasRowRail || cell.column > 0) && 'md:border-t-0',
								(cell.column > 0 || hasRowRail) && 'md:border-l md:border-border',
								stateDayClassFor(cell),
								clickable && !cell.disabled && 'cursor-pointer focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
								clickable && !cell.disabled && hoverableDays && 'hover:bg-secondary/50',
								clickable && cell.disabled && 'cursor-not-allowed opacity-55',
								!clickable && 'cursor-default',
								cell.today && !cell.hidden && 'ring-2 ring-inset ring-ring/40',
								dayClassFor(cell),
								dragAndDrop && dragState.active && canDropOnCell(cell) && !isDropTarget(cell) && 'bg-primary/5',
								dragAndDrop && isDropTarget(cell) && 'bg-primary/10 ring-2 ring-inset ring-ring/60',
								dragAndDrop && isDragSource(cell) && 'opacity-75',
								section.continuous && continuousMonthDividerClassFor(cell, week),
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
										:month="monthForCell(cell, section.month)"
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

<style scoped>
@media (min-width: 48rem) {
	.dom-month-calendar__day--continuous-month-segment,
	.dom-month-calendar__day--continuous-month-start,
	.dom-month-calendar__day--continuous-month-outgoing {
		--dom-month-calendar-boundary-color: var(--dom-calendar-continuous-month-border, var(--muted));
		background-image:
			var(--dom-month-calendar-boundary-top, none),
			var(--dom-month-calendar-boundary-left, none),
			var(--dom-month-calendar-boundary-bottom, none);
		background-position:
			top,
			left top,
			bottom;
		background-repeat:
			no-repeat,
			no-repeat,
			no-repeat;
		background-size:
			var(--dom-month-calendar-boundary-top-size, 0 0),
			var(--dom-month-calendar-boundary-left-size, 0 0),
			var(--dom-month-calendar-boundary-bottom-size, 0 0);
	}

	.dom-month-calendar__day--continuous-month-segment {
		--dom-month-calendar-boundary-top: linear-gradient(var(--dom-month-calendar-boundary-color), var(--dom-month-calendar-boundary-color));
		--dom-month-calendar-boundary-top-size: 100% 2px;
	}

	.dom-month-calendar__day--continuous-month-start {
		--dom-month-calendar-boundary-left: linear-gradient(var(--dom-month-calendar-boundary-color), var(--dom-month-calendar-boundary-color));
		--dom-month-calendar-boundary-left-size: 2px 100%;
	}

	.dom-month-calendar__day--continuous-month-outgoing {
		--dom-month-calendar-boundary-bottom: linear-gradient(var(--dom-month-calendar-boundary-color), var(--dom-month-calendar-boundary-color));
		--dom-month-calendar-boundary-bottom-size: 100% 2px;
	}
}
</style>
