<script>
/**
 * @typedef {object} WeekPlannerCell
 * @property {Date} date Local Date instance for the day.
 * @property {string} value YYYY-MM-DD date key shared with DomMonthCalendar.
 * @property {number} day Day of the month.
 * @property {string} weekday Formatted weekday label.
 * @property {string} label Full accessible date label.
 * @property {boolean} currentMonth True when the day belongs to the anchor month.
 * @property {boolean} previousMonth True when the day is before the anchor month.
 * @property {boolean} nextMonth True when the day is after the anchor month.
 * @property {boolean} adjacentMonth True when the day is outside the anchor month.
 * @property {boolean} hidden Always false in the week planner.
 * @property {string} monthValue YYYY-MM month key.
 * @property {number} row Zero-based week index.
 * @property {number} column Zero-based weekday column.
 * @property {number} weekNumber ISO-8601 week number.
 * @property {boolean} today
 * @property {boolean} past
 * @property {boolean} future
 * @property {boolean} muted
 * @property {boolean} disabled
 */

/**
 * @typedef {object} WeekPlannerWeek
 * @property {number} index Zero-based week index.
 * @property {number} weekNumber ISO-8601 week number.
 * @property {string} label Accessible week label.
 * @property {string} value YYYY-MM-DD key for the first day in the week.
 * @property {Array<WeekPlannerCell>} days Seven ordered day cells.
 */

/**
 * @typedef {object} WeekPlannerMonth
 * @property {Date} date Local Date instance for the first day of the month.
 * @property {string} value YYYY-MM month key.
 * @property {string} id Element id for the month.
 * @property {number} month Month number, 1-12.
 * @property {number} year Four-digit year.
 * @property {string} label Formatted month label.
 * @property {Array<WeekPlannerCell>} cells Visible cells belonging to the month.
 * @property {Array<WeekPlannerWeek>} weeks Visible week fragments belonging to the month.
 */

/**
 * @typedef {object} WeekPlannerTimeSlot
 * @property {number} index Zero-based time-row index.
 * @property {number} minutes Minutes from midnight at the start of the row.
 * @property {number} endMinutes Minutes from midnight at the end of the row.
 * @property {string} time HH:mm start time.
 * @property {string} endTime HH:mm end time.
 * @property {string} label Locale-aware time label.
 */

/**
 * @typedef {object} WeekPlannerDragState
 * @property {boolean} active True while a planner drag is in progress.
 * @property {boolean} source True for the day where the drag started.
 * @property {boolean} over True for the current drop-preview day.
 * @property {WeekPlannerCell|null} sourceCell Source day when it is visible.
 * @property {WeekPlannerCell|null} overCell Current drop-preview day.
 * @property {unknown} data App-owned data passed to dragAttrs.
 * @property {string} sourceTime HH:mm source time when supplied.
 * @property {string} overTime HH:mm preview time, or an empty string for all-day.
 */

/**
 * @typedef {object} WeekPlannerDragAttrsOptions
 * @property {string} [effectAllowed] Native DataTransfer effectAllowed value.
 * @property {string} [sourceTime] HH:mm time represented by the draggable record.
 */

/**
 * @typedef {(data?: unknown, options?: WeekPlannerDragAttrsOptions) => Record<string, unknown>} WeekPlannerDragAttrs
 */

/**
 * @typedef {object} WeekPlannerDaySlotPayload
 * @property {WeekPlannerCell} cell
 * @property {WeekPlannerMonth} month
 * @property {WeekPlannerWeek} week
 * @property {Array<WeekPlannerTimeSlot>} timeSlots
 * @property {WeekPlannerDragState} drag
 * @property {WeekPlannerDragAttrs} dragAttrs
 * @property {(recordOrStartTime: Record<string, unknown>|string, endTime?: string) => Record<string, string>} rangeStyle
 */

/**
 * @typedef {object} WeekPlannerDayClickPayload
 * @property {WeekPlannerCell} cell
 * @property {string} targetTime HH:mm selected time, or an empty string for the day header or all-day row.
 * @property {number|null} targetMinutes Minutes from midnight, or null for the day header or all-day row.
 * @property {MouseEvent} event
 */

/**
 * @typedef {object} WeekPlannerTimeRangePayload
 * @property {WeekPlannerCell} cell Selected day.
 * @property {string} value YYYY-MM-DD selected date key.
 * @property {string} startTime HH:mm inclusive start time.
 * @property {string} endTime HH:mm exclusive end time.
 * @property {number} startMinutes Inclusive minutes after midnight.
 * @property {number} endMinutes Exclusive minutes after midnight.
 * @property {PointerEvent} event Native pointer event that completed the selection.
 */

/**
 * @typedef {object} WeekPlannerDayDragPayload
 * @property {WeekPlannerCell} cell
 * @property {WeekPlannerCell|null} sourceCell
 * @property {WeekPlannerCell} targetCell
 * @property {string} sourceValue
 * @property {string} targetValue
 * @property {string} sourceTime
 * @property {string} targetTime
 * @property {number|null} sourceMinutes
 * @property {number|null} targetMinutes
 * @property {unknown} data
 * @property {DragEvent} event
 * @property {DataTransfer|null} dataTransfer
 * @property {Array<string>} types
 * @property {(type: string) => string} getData
 */

/**
 * @typedef {object} WeekPlannerViewportPayload
 * @property {number} scrollLeft Horizontal scroll offset.
 * @property {number} scrollWidth Total scrollable width.
 * @property {number} clientWidth Visible viewport width.
 * @property {number} remaining Pixels remaining before the horizontal end.
 * @property {boolean} atStart Whether the viewport is at the horizontal start threshold.
 * @property {boolean} atEnd Whether the viewport is at the horizontal end threshold.
 */

/**
 * @typedef {object} WeekPlannerRenderWindowPayload
 * @property {number} startIndex Inclusive first mounted week index.
 * @property {number} endIndex Exclusive final mounted week index.
 * @property {number} firstVisibleIndex First week intersecting the viewport.
 * @property {number} lastVisibleIndex Last week intersecting the viewport.
 * @property {number} renderedWeeks Number of mounted weeks including overscan.
 * @property {number} totalWeeks Number of weeks in the loaded range.
 * @property {string} start YYYY-MM-DD key for the first mounted day.
 * @property {string} end YYYY-MM-DD key for the final mounted day.
 */

/**
 * @typedef {(cell: WeekPlannerCell) => boolean} WeekPlannerDisabledDate
 */

/**
 * @typedef {string|Array<unknown>|Record<string, boolean>|((cell: WeekPlannerCell) => unknown)} WeekPlannerDayClass
 */

/**
 * @typedef {string|Record<string, string|number>|((cell: WeekPlannerCell) => string|Record<string, string|number>|null|undefined)} WeekPlannerDayStyle
 */

export const weekPlannerProps = {
	startDate: {
		type: String,
		default: '',
		_edit: { group: 'Range', description: 'Date inside the first rendered week as YYYY-MM-DD.' },
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
	weeks: {
		type: Number,
		default: 3,
		_edit: { group: 'Range', description: 'Number of consecutive weeks to render as fixed-width day columns.' },
	},
	initialScrollDate: {
		type: String,
		default: '',
		_edit: { group: 'Range', description: 'Date to reveal after mount or a range reset. Useful when a virtual year starts before the focused date.' },
	},
	virtualWeeks: {
		type: Boolean,
		default: false,
		_edit: { group: 'Range', description: 'Mount only the horizontally visible weeks plus the configured buffer.' },
	},
	virtualWeekBuffer: {
		type: Number,
		default: 2,
		_edit: { group: 'Range', description: 'Extra weeks mounted before and after the visible horizontal window.' },
	},
	locale: {
		type: String,
		default: 'en-GB',
		_edit: { description: 'Locale used for weekday, date, month, and time labels.' },
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
	startTime: {
		type: String,
		default: '07:00',
		_edit: { group: 'Time grid', description: 'First visible time as HH:mm.' },
	},
	endTime: {
		type: String,
		default: '20:00',
		_edit: { group: 'Time grid', description: 'Exclusive final visible time as HH:mm. Use 24:00 to include the full day.' },
	},
	timeStep: {
		type: Number,
		default: 60,
		_edit: { group: 'Time grid', description: 'Minutes represented by each horizontal time row.' },
	},
	slotHeight: {
		type: Number,
		default: 56,
		_edit: { group: 'Time grid', description: 'Pixel height of each time row.' },
	},
	dayWidth: {
		type: Number,
		default: 192,
		_edit: { group: 'Layout', description: 'Fixed pixel width of every day swim lane. Additional weeks scroll horizontally.' },
	},
	timeRailWidth: {
		type: Number,
		default: 72,
		_edit: { group: 'Layout', description: 'Pixel width of the sticky time-label rail.' },
	},
	viewportHeight: {
		type: Number,
		default: 640,
		_edit: { group: 'Layout', description: 'Pixel height of the internal two-axis scroll viewport.' },
	},
	showWeekNumbers: {
		type: Boolean,
		default: false,
		_edit: { group: 'Layout', description: 'Show the ISO week number on the first day of each week.' },
	},
	showAllDayRow: {
		type: Boolean,
		default: true,
		_edit: { group: 'Layout', description: 'Render a sticky all-day row above the timed grid.' },
	},
	showCurrentTime: {
		type: Boolean,
		default: true,
		_edit: { group: 'Layout', description: 'Show a live current-time line in today’s time lane when the current time is visible.' },
	},
	loading: {
		type: Boolean,
		default: false,
		_edit: { group: 'State', description: 'Show an in-viewport loading indicator while the app fetches the requested render window.' },
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
	min: {
		type: String,
		default: '',
		_edit: { group: 'Interaction', description: 'Minimum clickable or droppable date as YYYY-MM-DD.' },
	},
	max: {
		type: String,
		default: '',
		_edit: { group: 'Interaction', description: 'Maximum clickable or droppable date as YYYY-MM-DD.' },
	},
	clickable: {
		type: Boolean,
		default: false,
		_edit: { group: 'Interaction', description: 'Emit day-click with the selected day and snapped time.' },
	},
	rangeSelection: {
		type: Boolean,
		default: false,
		_edit: { group: 'Interaction', description: 'Allow mouse or pen dragging across a time lane and emit time-range-select.' },
	},
	selectionStep: {
		type: Number,
		default: 5,
		_edit: { group: 'Interaction', description: 'Minutes used to snap drag-created time ranges independently of the visible time rows.' },
	},
	dragAndDrop: {
		type: Boolean,
		default: false,
		_edit: { group: 'Interaction', description: 'Expose dragAttrs and emit day-drop with the target day and snapped time.' },
	},
	dropEffect: {
		type: String,
		default: 'move',
		validator: (value) => ['copy', 'move', 'link'].includes(value),
		_edit: { group: 'Interaction', options: ['copy', 'move', 'link'], description: 'Native drop effect shown when a time lane can receive a dragged item.' },
	},
	/**
	 * @type {WeekPlannerDisabledDate}
	 */
	disabledDate: {
		type: Function,
		default: null,
		_edit: { group: 'Interaction', description: 'Function that receives a day cell and returns true when the day should not be clickable or droppable.' },
	},
	/**
	 * @type {WeekPlannerDayClass}
	 */
	dayClass: {
		type: [String, Array, Object, Function],
		default: '',
		_edit: { group: 'Styling', description: 'Extra classes, or a function that receives a day cell and returns classes for the day lane.' },
	},
	/**
	 * @type {WeekPlannerDayStyle}
	 */
	dayStyle: {
		type: [String, Object, Function],
		default: '',
		_edit: { group: 'Styling', description: 'Extra styles, or a function that receives a day cell and returns styles for the day lane.' },
	},
};
</script>

<script setup>
import {
	computed,
	nextTick,
	onBeforeUnmount,
	onMounted,
	ref,
	useId,
	watch,
} from 'vue';
import { calculateVirtualWindow } from '../_shared/calculateVirtualWindow';

defineOptions({
	__doc: {
		name: 'Week planner',
		tag: '<DomWeekPlanner>',
		description: 'A fixed-width week scheduler with days as horizontally scrolling swim lanes and time chunks as rows.',
		icon: 'M7 4v3M17 4v3M5 8h14M6 6h12v13H6V6Zm4 5h6M9 16h4',
		events: [
			{ name: 'day-click', payload: '({ cell, targetTime, targetMinutes, event })', typeRef: 'WeekPlannerDayClickPayload', description: 'Fired when a clickable day header, all-day cell, or timed row is activated.' },
			{ name: 'time-range-select', payload: '({ cell, value, startTime, endTime, startMinutes, endMinutes, event })', typeRef: 'WeekPlannerTimeRangePayload', description: 'Fired after a mouse or pen drag selects a snapped time range. The planner does not create or persist records.' },
			{ name: 'day-drag-start', payload: '({ cell, sourceValue, sourceTime, data, event })', typeRef: 'WeekPlannerDayDragPayload', description: 'Fired when an item using dragAttrs starts dragging.' },
			{ name: 'day-drag-enter', payload: '({ sourceCell, targetCell, targetValue, targetTime, data, event })', typeRef: 'WeekPlannerDayDragPayload', description: 'Fired when a draggable item previews a day and time.' },
				{ name: 'day-drag-leave', payload: '({ sourceCell, targetCell, targetValue, targetTime, data, event })', typeRef: 'WeekPlannerDayDragPayload', description: 'Fired when a draggable item leaves a day lane.' },
				{ name: 'day-drop', payload: '({ sourceCell, targetCell, sourceValue, targetValue, sourceTime, targetTime, data, event })', typeRef: 'WeekPlannerDayDragPayload', description: 'Fired when an item is dropped. The planner does not mutate records.' },
				{ name: 'day-drag-end', payload: '({ sourceCell, targetCell, sourceValue, targetValue, sourceTime, targetTime, data, event })', typeRef: 'WeekPlannerDayDragPayload', description: 'Fired when a drag started with dragAttrs ends.' },
				{ name: 'viewport-scroll', payload: '({ scrollLeft, scrollWidth, clientWidth, remaining, atStart, atEnd })', typeRef: 'WeekPlannerViewportPayload', description: 'Fired while the internal two-axis viewport scrolls horizontally.' },
				{ name: 'viewport-end', payload: '({ scrollLeft, scrollWidth, clientWidth, remaining, atStart, atEnd })', typeRef: 'WeekPlannerViewportPayload', description: 'Fired when horizontal scrolling reaches the end threshold. Apps can append another date range.' },
				{ name: 'render-window-change', payload: '({ startIndex, endIndex, renderedWeeks, totalWeeks, start, end })', typeRef: 'WeekPlannerRenderWindowPayload', description: 'Fired when the mounted virtual week window changes so apps can fetch its record range.' },
			],
		slots: [
			{ name: '(default)', payload: '{ cell, month, week, timeSlots, drag, dragAttrs, rangeStyle }', typeRef: 'WeekPlannerDaySlotPayload', description: 'Timed content layer for each day. Use rangeStyle(record) with records containing startTime and endTime.' },
			{ name: 'day-header', payload: '{ cell, month, week }', description: 'Custom day-column header content.' },
			{ name: 'all-day', payload: '{ cell, month, week, drag, dragAttrs }', description: 'All-day content rendered above the timed rows.' },
			{ name: 'time-label', payload: '{ slot }', description: 'Custom sticky time-rail label.' },
			{ name: 'corner', payload: '{ range }', description: 'Content above the sticky time rail.' },
		],
		keyboard: [
			{ keys: 'Tab', action: 'Move through day headers, all-day cells, and time rows when clickable is enabled.' },
			{ keys: 'Enter / Space', action: 'Activate the focused day or time row.' },
		],
	},
});

const props = defineProps(weekPlannerProps);
const emit = defineEmits([
	'day-click',
	'time-range-select',
	'day-drag-start',
	'day-drag-enter',
	'day-drag-leave',
	'day-drop',
	'day-drag-end',
	'viewport-scroll',
	'viewport-end',
	'render-window-change',
]);
const rootId = useId();
const calendarDragType = 'application/x-dom-month-calendar-drag';
const mounted = ref(false);
const now = ref(new Date());
const dragState = ref(createEmptyDragState());
const timeSelection = ref(createEmptyTimeSelection());
const scrollViewport = ref(null);
const viewportState = ref({
	scrollLeft: 0,
	clientWidth: 0,
});
let currentTimeTimer = null;
let viewportResizeObserver = null;
let timeSelectionLane = null;
const resolvedWeekStartsOn = computed(resolveWeekStartsOn);
const anchorDate = computed(resolveAnchorDate);
const normalizedTimeRange = computed(resolveTimeRange);
const allWeeks = computed(buildVisibleWeeks);
const weekRenderWindow = computed(buildWeekRenderWindow);
const visibleWeeks = computed(renderVisibleWeeks);
const visibleDays = computed(flattenVisibleDays);
const loadedRange = computed(buildLoadedRange);
const visibleRange = computed(buildVisibleRange);
const timeSlots = computed(buildTimeSlots);
const plannerHeight = computed(calculatePlannerHeight);
const plannerGridStyle = computed(buildPlannerGridStyle);
const viewportStyle = computed(buildViewportStyle);
const monthRecords = computed(buildMonthRecords);
const rangeLabel = computed(formatRangeLabel);
const todayValue = computed(() => formatDate(now.value));
const currentTimeVisible = computed(isCurrentTimeVisible);
const currentTimeStyle = computed(buildCurrentTimeStyle);
const timeSelectionStyle = computed(buildTimeSelectionStyle);
const weekByIndex = computed(indexVisibleWeeks);

const weekdayLabelFormatter = computed(createWeekdayLabelFormatter);
const dateLabelFormatter = computed(createDateLabelFormatter);
const monthLabelFormatter = computed(createMonthLabelFormatter);
const rangeLabelFormatter = computed(createRangeLabelFormatter);
const timeLabelFormatter = computed(createTimeLabelFormatter);

watch(weekRenderWindow, emitRenderWindowChange, { immediate: true });
watch(
	() => [props.startDate, props.initialMonth, props.initialYear, props.weeks, props.virtualWeeks, props.initialScrollDate],
	scheduleInitialScroll,
);

onMounted(mountPlanner);
onBeforeUnmount(unmountPlanner);

defineExpose({
	scrollToDate,
	scrollToTime,
	scrollToToday,
});

/**
 * Resolves the configured first day of week.
 *
 * @returns {number} Weekday index from zero to six.
 */
function resolveWeekStartsOn() {
	return clampNumber(props.weekStartsOn, 0, 6, 1);
}

/**
 * Resolves the date used to select the first visible week.
 *
 * @returns {Date} Local anchor date.
 */
function resolveAnchorDate() {
	return parseDate(props.startDate) || initialDateFromProps() || new Date();
}

/**
 * Creates the locale-aware weekday formatter.
 *
 * @returns {Intl.DateTimeFormat} Weekday formatter.
 */
function createWeekdayLabelFormatter() {
	return new Intl.DateTimeFormat(props.locale, {
		weekday: props.weekdayFormat,
	});
}

/**
 * Creates the locale-aware accessible date formatter.
 *
 * @returns {Intl.DateTimeFormat} Full date formatter.
 */
function createDateLabelFormatter() {
	return new Intl.DateTimeFormat(props.locale, {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
}

/**
 * Creates the locale-aware month formatter used by slot payloads.
 *
 * @returns {Intl.DateTimeFormat} Month formatter.
 */
function createMonthLabelFormatter() {
	return new Intl.DateTimeFormat(props.locale, {
		month: 'long',
		year: 'numeric',
	});
}

/**
 * Creates the compact formatter used for the visible-range label.
 *
 * @returns {Intl.DateTimeFormat} Range endpoint formatter.
 */
function createRangeLabelFormatter() {
	return new Intl.DateTimeFormat(props.locale, {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

/**
 * Creates the locale-aware time formatter used by the sticky rail.
 *
 * @returns {Intl.DateTimeFormat} Time formatter.
 */
function createTimeLabelFormatter() {
	return new Intl.DateTimeFormat(props.locale, {
		hour: 'numeric',
		minute: '2-digit',
	});
}

/**
 * Normalizes the visible time range and row dimensions.
 *
 * @returns {{ startMinutes: number, endMinutes: number, stepMinutes: number, selectionStepMinutes: number, slotHeight: number }} Time-grid configuration.
 */
function resolveTimeRange() {
	const startMinutes = parseTime(props.startTime, false) ?? 420;
	const requestedEnd = parseTime(props.endTime, true) ?? 1200;
	const endMinutes = requestedEnd > startMinutes ? requestedEnd : Math.min(1440, startMinutes + 60);
	return {
		startMinutes,
		endMinutes,
		stepMinutes: clampNumber(props.timeStep, 5, 720, 60),
		selectionStepMinutes: clampNumber(props.selectionStep, 1, 720, 5),
		slotHeight: clampNumber(props.slotHeight, 24, 160, 56),
	};
}

/**
 * Builds the requested consecutive weeks and their compatible day-cell payloads.
 *
 * @returns {Array<WeekPlannerWeek>} Visible week records.
 */
function buildVisibleWeeks() {
	const firstDate = startOfWeek(anchorDate.value, resolvedWeekStartsOn.value);
	const count = clampNumber(props.weeks, 1, 520, 3);
	const weeks = [];

	for (let weekIndex = 0; weekIndex < count; weekIndex += 1) {
		const weekStart = addDays(firstDate, weekIndex * 7);
		const days = Array.from({ length: 7 }, (_, column) => buildCell(addDays(weekStart, column), weekIndex, column));
		const weekNumber = isoWeekNumberForWeek(days);
		weeks.push({
			index: weekIndex,
			weekNumber,
			label: `Week ${weekNumber}`,
			value: formatDate(weekStart),
			days,
		});
	}

	return weeks;
}

/**
 * Calculates the mounted horizontal week window.
 *
 * This uses the same fixed-item virtual window calculation as DomDataGrid,
 * translated to horizontal week groups instead of vertical rows.
 *
 * @returns {ReturnType<typeof calculateVirtualWindow>} Virtual week window.
 */
function buildWeekRenderWindow() {
	const totalWeeks = allWeeks.value.length;
	const weekWidth = clampNumber(props.dayWidth, 144, 480, 192) * 7;

	if (!props.virtualWeeks) {
		return calculateVirtualWindow({
			itemCount: totalWeeks,
			itemSize: weekWidth,
			scrollOffset: 0,
			viewportSize: totalWeeks * weekWidth,
			overscan: 0,
		});
	}

	const railWidth = clampNumber(props.timeRailWidth, 56, 160, 72);
	return calculateVirtualWindow({
		itemCount: totalWeeks,
		itemSize: weekWidth,
		scrollOffset: viewportState.value.scrollLeft,
		viewportSize: Math.max(0, viewportState.value.clientWidth - railWidth),
		overscan: clampNumber(props.virtualWeekBuffer, 0, 12, 2),
	});
}

/**
 * Slices the available weeks to the mounted virtual window.
 *
 * @returns {Array<WeekPlannerWeek>} Mounted week records.
 */
function renderVisibleWeeks() {
	const window = weekRenderWindow.value;
	return allWeeks.value.slice(window.startIndex, window.endIndex);
}

/**
 * Flattens visible weeks into ordered day columns.
 *
 * @returns {Array<WeekPlannerCell>} Ordered day cells.
 */
function flattenVisibleDays() {
	return visibleWeeks.value.flatMap((week) => week.days);
}

/**
 * Builds the complete loaded date range before horizontal virtualization.
 *
 * @returns {{ start: string, end: string, startDate: Date|null, endDate: Date|null, weeks: number }} Loaded range.
 */
function buildLoadedRange() {
	const firstWeek = allWeeks.value[0] || null;
	const lastWeek = allWeeks.value[allWeeks.value.length - 1] || null;
	const firstCell = firstWeek?.days?.[0] || null;
	const lastCell = lastWeek?.days?.[lastWeek.days.length - 1] || null;
	return {
		start: firstCell?.value || '',
		end: lastCell?.value || '',
		startDate: firstCell?.date || null,
		endDate: lastCell?.date || null,
		weeks: allWeeks.value.length,
	};
}

/**
 * Builds the inclusive visible date range for fetching and the corner slot.
 *
 * @returns {{ start: string, end: string, startDate: Date|null, endDate: Date|null, weeks: number }} Visible range.
 */
function buildVisibleRange() {
	const firstCell = visibleDays.value[0] || null;
	const lastCell = visibleDays.value[visibleDays.value.length - 1] || null;
	return {
		start: firstCell?.value || '',
		end: lastCell?.value || '',
		startDate: firstCell?.date || null,
		endDate: lastCell?.date || null,
		weeks: visibleWeeks.value.length,
	};
}

/**
 * Indexes mounted weeks by their stable absolute week index.
 *
 * @returns {Map<number, WeekPlannerWeek>} Week records keyed by absolute index.
 */
function indexVisibleWeeks() {
	return new Map(visibleWeeks.value.map((week) => [week.index, week]));
}

/**
 * Builds one day cell with the same date identity and boundary state used by DomMonthCalendar.
 *
 * @param {Date} date Date represented by the column.
 * @param {number} weekIndex Zero-based visible week index.
 * @param {number} column Zero-based weekday column.
 * @returns {WeekPlannerCell} Planner day payload.
 */
function buildCell(date, weekIndex, column) {
	const value = formatDate(date);
	const anchorMonth = new Date(anchorDate.value.getFullYear(), anchorDate.value.getMonth(), 1);
	const distance = monthDistance(date, anchorMonth);
	const cell = {
		date,
		value,
		day: date.getDate(),
		weekday: weekdayLabelFormatter.value.format(date),
		label: dateLabelFormatter.value.format(date),
		currentMonth: distance === 0,
		previousMonth: distance < 0,
		nextMonth: distance > 0,
		adjacentMonth: distance !== 0,
		hidden: false,
		monthValue: monthValue(date),
		row: weekIndex,
		column,
		weekNumber: isoWeekNumber(date),
		today: value === todayValue.value,
		past: value < todayValue.value,
		future: value > todayValue.value,
		muted: beforeBoundary(value, props.mutedBefore) || afterBoundary(value, props.mutedAfter),
		disabled: false,
	};
	cell.disabled = outsideRange(value) || Boolean(props.disabledDate?.(cell));
	return cell;
}

/**
 * Builds one month record for every month represented by the visible day columns.
 *
 * @returns {Map<string, WeekPlannerMonth>} Month records keyed by YYYY-MM.
 */
function buildMonthRecords() {
	const months = new Map();

	for (const cell of visibleDays.value) {
		if (!months.has(cell.monthValue)) {
			const date = new Date(cell.date.getFullYear(), cell.date.getMonth(), 1);
			months.set(cell.monthValue, {
				date,
				value: cell.monthValue,
				id: `${rootId}-${cell.monthValue}`,
				month: date.getMonth() + 1,
				year: date.getFullYear(),
				label: monthLabelFormatter.value.format(date),
				cells: [],
				weeks: [],
			});
		}
		months.get(cell.monthValue).cells.push(cell);
	}

	for (const week of visibleWeeks.value) {
		for (const month of months.values()) {
			const days = week.days.filter((cell) => cell.monthValue === month.value);
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
 * Resolves the month payload for a day slot.
 *
 * @param {WeekPlannerCell} cell Day whose month record is needed.
 * @returns {WeekPlannerMonth} Month record.
 */
function monthForCell(cell) {
	return monthRecords.value.get(cell.monthValue);
}

/**
 * Resolves the week payload for a day slot.
 *
 * @param {WeekPlannerCell} cell Day whose week record is needed.
 * @returns {WeekPlannerWeek} Week record.
 */
function weekForCell(cell) {
	return weekByIndex.value.get(cell.row);
}

/**
 * Builds the horizontal time rows.
 *
 * @returns {Array<WeekPlannerTimeSlot>} Ordered time-slot rows.
 */
function buildTimeSlots() {
	const range = normalizedTimeRange.value;
	const slots = [];

	for (let minutes = range.startMinutes; minutes < range.endMinutes; minutes += range.stepMinutes) {
		const endMinutes = Math.min(range.endMinutes, minutes + range.stepMinutes);
		slots.push({
			index: slots.length,
			minutes,
			endMinutes,
			time: formatTimeKey(minutes),
			endTime: formatTimeKey(endMinutes),
			label: formatTimeLabel(minutes),
		});
	}

	return slots;
}

/**
 * Calculates the pixel height of the timed grid.
 *
 * @returns {number} Timed grid height in pixels.
 */
function calculatePlannerHeight() {
	const range = normalizedTimeRange.value;
	return ((range.endMinutes - range.startMinutes) / range.stepMinutes) * range.slotHeight;
}

/**
 * Builds the fixed-width grid columns used by the header, all-day row, and body.
 *
 * @returns {Record<string, string>} Inline grid style.
 */
function buildPlannerGridStyle() {
	const railWidth = clampNumber(props.timeRailWidth, 56, 160, 72);
	const dayWidth = clampNumber(props.dayWidth, 144, 480, 192);
	const window = weekRenderWindow.value;
	const columns = [`${railWidth}px`];

	if (window.beforeSpacerSize) columns.push(`${window.beforeSpacerSize}px`);
	if (visibleDays.value.length) columns.push(`repeat(${visibleDays.value.length}, ${dayWidth}px)`);
	if (window.afterSpacerSize) columns.push(`${window.afterSpacerSize}px`);

	return {
		gridTemplateColumns: columns.join(' '),
	};
}

/**
 * Builds the explicit internal scrollport dimensions.
 *
 * A fixed height is intentional here: documentation iframes and application
 * shells can otherwise size themselves to the full time grid, leaving the
 * planner without a vertical scroll boundary.
 *
 * @returns {Record<string, string>} Scroll viewport style.
 */
function buildViewportStyle() {
	return {
		height: `${clampNumber(props.viewportHeight, 320, 1200, 640)}px`,
		maxHeight: 'calc(100dvh - 6rem)',
	};
}

/**
 * Checks whether the live current time falls inside the configured time grid.
 *
 * @returns {boolean} Whether the current-time line should be positioned.
 */
function isCurrentTimeVisible() {
	const minutes = minutesForDate(now.value);
	const range = normalizedTimeRange.value;
	return minutes >= range.startMinutes && minutes <= range.endMinutes;
}

/**
 * Builds the vertical position of the live current-time line.
 *
 * @returns {Record<string, string>} Absolute positioning style.
 */
function buildCurrentTimeStyle() {
	const range = normalizedTimeRange.value;
	const pixelsPerMinute = range.slotHeight / range.stepMinutes;
	const minutes = Math.min(range.endMinutes, Math.max(range.startMinutes, minutesForDate(now.value)));
	return {
		top: `${(minutes - range.startMinutes) * pixelsPerMinute}px`,
	};
}

/**
 * Formats the inclusive visible date range.
 *
 * @returns {string} Human-readable planner range.
 */
function formatRangeLabel() {
	const range = visibleRange.value;
	if (!range.startDate || !range.endDate) return 'Week planner';
	return `${rangeLabelFormatter.value.format(range.startDate)} – ${rangeLabelFormatter.value.format(range.endDate)}`;
}

/**
 * Formats a time-rail label from minutes after midnight.
 *
 * @param {number} minutes Minutes after midnight.
 * @returns {string} Locale-aware time label.
 */
function formatTimeLabel(minutes) {
	const date = new Date(2026, 0, 1, 0, minutes);
	return timeLabelFormatter.value.format(date);
}

/**
 * Resolves CSS positioning for a record or explicit start and end time.
 *
 * @param {Record<string, unknown>|string} recordOrStartTime Record with startTime/endTime, or an HH:mm start time.
 * @param {string} [explicitEndTime] HH:mm end time when the first argument is a string.
 * @returns {Record<string, string>} Absolute-positioning style for a timed record.
 */
function rangeStyle(recordOrStartTime, explicitEndTime = '') {
	const startTime = typeof recordOrStartTime === 'string' ? recordOrStartTime : String(recordOrStartTime?.startTime || '');
	const endTime = typeof recordOrStartTime === 'string' ? explicitEndTime : String(recordOrStartTime?.endTime || '');
	const startMinutes = parseTime(startTime, false);
	const endMinutes = parseTime(endTime, true);
	const range = normalizedTimeRange.value;

	if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
		return {
			display: 'none',
		};
	}

	const visibleStart = Math.max(range.startMinutes, startMinutes);
	const visibleEnd = Math.min(range.endMinutes, endMinutes);
	if (visibleEnd <= visibleStart) {
		return {
			display: 'none',
		};
	}

	const pixelsPerMinute = range.slotHeight / range.stepMinutes;
	return {
		top: `${(visibleStart - range.startMinutes) * pixelsPerMinute}px`,
		height: `${Math.max(20, (visibleEnd - visibleStart) * pixelsPerMinute)}px`,
		pointerEvents: 'auto',
	};
}

/**
 * Builds the vertical placement of the active drag-selection preview.
 *
 * @returns {Record<string, string>} Absolute positioning style.
 */
function buildTimeSelectionStyle() {
	if (!timeSelection.value.active) return { display: 'none' };
	const range = normalizedTimeRange.value;
	const pixelsPerMinute = range.slotHeight / range.stepMinutes;
	return {
		top: `${(timeSelection.value.startMinutes - range.startMinutes) * pixelsPerMinute}px`,
		height: `${Math.max(2, (timeSelection.value.endMinutes - timeSelection.value.startMinutes) * pixelsPerMinute)}px`,
	};
}

/**
 * Resolves the proportional height of one time row, including a partial final row.
 *
 * @param {WeekPlannerTimeSlot} slot Time row being rendered.
 * @returns {Record<string, string>} Time-row height style.
 */
function timeSlotStyle(slot) {
	const range = normalizedTimeRange.value;
	const rowMinutes = slot.endMinutes - slot.minutes;
	return {
		height: `${(rowMinutes / range.stepMinutes) * range.slotHeight}px`,
	};
}

/**
 * Resolves consumer-supplied classes for a day lane.
 *
 * @param {WeekPlannerCell} cell Day lane being rendered.
 * @returns {unknown} Vue-compatible class binding.
 */
function dayClassFor(cell) {
	if (typeof props.dayClass === 'function') return props.dayClass(cell);
	return props.dayClass;
}

/**
 * Resolves consumer-supplied styles for a day lane.
 *
 * @param {WeekPlannerCell} cell Day lane being rendered.
 * @returns {string|Record<string, string|number>} Vue-compatible style binding.
 */
function dayStyleFor(cell) {
	if (typeof props.dayStyle === 'function') return props.dayStyle(cell);
	return props.dayStyle;
}

/**
 * Emits a date-only day-click from a day header or all-day cell.
 *
 * @param {WeekPlannerCell} cell Activated day.
 * @param {MouseEvent} event Native click event.
 * @returns {void}
 */
function onUntimedDayClick(cell, event) {
	if (!props.clickable || cell.disabled) return;
	emit('day-click', {
		cell,
		targetTime: '',
		targetMinutes: null,
		event,
	});
}

/**
 * Emits a timed day-click from a time row.
 *
 * @param {WeekPlannerCell} cell Activated day.
 * @param {WeekPlannerTimeSlot} slot Activated time row.
 * @param {MouseEvent} event Native click event.
 * @returns {void}
 */
function onTimeSlotClick(cell, slot, event) {
	if (!props.clickable || cell.disabled) return;
	emit('day-click', {
		cell,
		targetTime: slot.time,
		targetMinutes: slot.minutes,
		event,
	});
}

/**
 * Creates the inert time-selection state.
 *
 * @returns {{ active: boolean, cell: null, anchorMinutes: null, startMinutes: null, endMinutes: null, pointerId: null }} Empty state.
 */
function createEmptyTimeSelection() {
	return {
		active: false,
		cell: null,
		anchorMinutes: null,
		startMinutes: null,
		endMinutes: null,
		pointerId: null,
	};
}

/**
 * Starts a snapped time-range selection in one day lane.
 *
 * Touch pointers remain available for native two-axis scrolling. Applications
 * can mark interactive event content with data-week-planner-ignore-selection.
 *
 * @param {WeekPlannerCell} cell Day lane where selection starts.
 * @param {PointerEvent} event Native pointer event.
 * @returns {void}
 */
function onTimeSelectionStart(cell, event) {
	if (!props.rangeSelection || cell.disabled || event.button !== 0 || event.pointerType === 'touch') return;
	if (!(event.currentTarget instanceof HTMLElement) || isIgnoredTimeSelectionTarget(event.target)) return;

	event.preventDefault();
	cancelTimeSelection();
	timeSelectionLane = event.currentTarget;
	const anchorMinutes = minutesFromClientY(
		timeSelectionLane,
		event.clientY,
		normalizedTimeRange.value.selectionStepMinutes,
	);
	timeSelection.value = buildTimeSelection(cell, anchorMinutes, anchorMinutes, event.pointerId);

	if (typeof window !== 'undefined') {
		window.addEventListener('pointermove', onTimeSelectionMove, { passive: false });
		window.addEventListener('pointerup', onTimeSelectionEnd);
		window.addEventListener('pointercancel', cancelTimeSelection);
	}
}

/**
 * Updates the active selection while the pointer moves vertically.
 *
 * @param {PointerEvent} event Native pointer event.
 * @returns {void}
 */
function onTimeSelectionMove(event) {
	const selection = timeSelection.value;
	if (!selection.active || event.pointerId !== selection.pointerId || !(timeSelectionLane instanceof HTMLElement)) return;

	event.preventDefault();
	const currentMinutes = minutesFromClientY(
		timeSelectionLane,
		event.clientY,
		normalizedTimeRange.value.selectionStepMinutes,
	);
	timeSelection.value = buildTimeSelection(selection.cell, selection.anchorMinutes, currentMinutes, selection.pointerId);
}

/**
 * Emits the completed range and clears the temporary selection preview.
 *
 * @param {PointerEvent} event Native pointer event.
 * @returns {void}
 */
function onTimeSelectionEnd(event) {
	const selection = timeSelection.value;
	if (!selection.active || event.pointerId !== selection.pointerId) return;

	if (timeSelectionLane instanceof HTMLElement) {
		const currentMinutes = minutesFromClientY(
			timeSelectionLane,
			event.clientY,
			normalizedTimeRange.value.selectionStepMinutes,
		);
		timeSelection.value = buildTimeSelection(selection.cell, selection.anchorMinutes, currentMinutes, selection.pointerId);
	}

	const completed = timeSelection.value;
	emit('time-range-select', {
		cell: completed.cell,
		value: completed.cell.value,
		startTime: formatTimeKey(completed.startMinutes),
		endTime: formatTimeKey(completed.endMinutes),
		startMinutes: completed.startMinutes,
		endMinutes: completed.endMinutes,
		event,
	});
	cancelTimeSelection();
}

/**
 * Clears active range selection and removes its global pointer listeners.
 *
 * @returns {void}
 */
function cancelTimeSelection() {
	if (typeof window !== 'undefined') {
		window.removeEventListener('pointermove', onTimeSelectionMove);
		window.removeEventListener('pointerup', onTimeSelectionEnd);
		window.removeEventListener('pointercancel', cancelTimeSelection);
	}
	timeSelection.value = createEmptyTimeSelection();
	timeSelectionLane = null;
}

/**
 * Builds a normalized selection with a minimum duration of one time step.
 *
 * @param {WeekPlannerCell} cell Selected day.
 * @param {number} anchorMinutes Snapped starting row.
 * @param {number} currentMinutes Snapped current row.
 * @param {number} pointerId Active pointer identifier.
 * @returns {{ active: boolean, cell: WeekPlannerCell, anchorMinutes: number, startMinutes: number, endMinutes: number, pointerId: number }} Active selection.
 */
function buildTimeSelection(cell, anchorMinutes, currentMinutes, pointerId) {
	const range = normalizedTimeRange.value;
	const selectionStep = range.selectionStepMinutes;
	const startMinutes = Math.min(anchorMinutes, currentMinutes);
	const endMinutes = Math.min(
		range.endMinutes,
		Math.max(anchorMinutes, currentMinutes) + selectionStep,
	);
	return {
		active: true,
		cell,
		anchorMinutes,
		startMinutes,
		endMinutes,
		pointerId,
	};
}

/**
 * Checks whether interactive app content should keep ownership of the pointer.
 *
 * @param {EventTarget|null} target Native event target.
 * @returns {boolean} Whether planner range selection should be skipped.
 */
function isIgnoredTimeSelectionTarget(target) {
	if (!(target instanceof Element)) return false;
	return Boolean(target.closest('[draggable="true"], [data-week-planner-ignore-selection]'));
}

/**
 * Creates the inert planner drag state.
 *
 * @returns {{ active: boolean, sourceCell: null, overCell: null, sourceMinutes: null, overMinutes: null, data: null }} Empty state.
 */
function createEmptyDragState() {
	return {
		active: false,
		sourceCell: null,
		overCell: null,
		sourceMinutes: null,
		overMinutes: null,
		data: null,
	};
}

/**
 * Builds a slot helper that makes app-rendered records draggable.
 *
 * @param {WeekPlannerCell} cell Day that owns the record.
 * @returns {WeekPlannerDragAttrs} Drag-attribute helper.
 */
function dragAttrsFor(cell) {
	return (data = null, options = {}) => {
		if (!canUseDay(cell)) {
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
 * Resolves the public drag state for one day slot.
 *
 * @param {WeekPlannerCell} cell Day receiving scoped drag state.
 * @returns {WeekPlannerDragState} Scoped drag state.
 */
function dragStateFor(cell) {
	const state = dragState.value;
	return {
		active: state.active,
		source: state.sourceCell?.value === cell.value,
		over: state.overCell?.value === cell.value,
		sourceCell: state.sourceCell,
		overCell: state.overCell,
		data: state.data,
		sourceTime: timeKeyOrEmpty(state.sourceMinutes),
		overTime: timeKeyOrEmpty(state.overMinutes),
	};
}

/**
 * Checks whether a day supports click and drag interactions.
 *
 * @param {WeekPlannerCell} cell Candidate day.
 * @returns {boolean} True when the day is enabled and drag-and-drop is active.
 */
function canUseDay(cell) {
	return props.dragAndDrop && !cell.disabled;
}

/**
 * Handles the start of an app-owned record drag.
 *
 * @param {WeekPlannerCell} cell Source day.
 * @param {unknown} data App-owned record metadata.
 * @param {WeekPlannerDragAttrsOptions} options Native drag options.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onItemDragStart(cell, data, options, event) {
	if (!canUseDay(cell)) {
		event.preventDefault();
		return;
	}

	const sourceTime = options.sourceTime || timeFromData(data);
	const sourceMinutes = parseTime(sourceTime, false);
	dragState.value = {
		active: true,
		sourceCell: cell,
		overCell: null,
		sourceMinutes,
		overMinutes: null,
		data,
	};

	if (event.dataTransfer) {
		event.dataTransfer.effectAllowed = options.effectAllowed || 'move';
		safeSetData(event, calendarDragType, serializeDragData({
			sourceValue: cell.value,
			sourceMonth: cell.monthValue,
			sourceTime,
			data,
		}));
		safeSetData(event, 'text/plain', plainTextForDrag(data, cell));
	}

	emit('day-drag-start', dragPayload(cell, sourceMinutes, event));
}

/**
 * Handles the end of a record drag and clears planner state.
 *
 * @param {WeekPlannerCell} cell Source day.
 * @param {unknown} data App-owned record metadata.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onItemDragEnd(cell, data, event) {
	emit('day-drag-end', {
		...dragPayload(cell, dragState.value.overMinutes, event),
		data,
	});
	dragState.value = createEmptyDragState();
}

/**
 * Handles drag entry into an all-day cell.
 *
 * @param {WeekPlannerCell} cell Candidate day.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onAllDayDragEnter(cell, event) {
	updateDropTarget(cell, null, event, true);
}

/**
 * Handles drag movement over an all-day cell.
 *
 * @param {WeekPlannerCell} cell Candidate day.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onAllDayDragOver(cell, event) {
	updateDropTarget(cell, null, event, false);
}

/**
 * Handles drag entry into a timed day lane.
 *
 * @param {WeekPlannerCell} cell Candidate day.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onTimedDragEnter(cell, event) {
	updateDropTarget(cell, minutesFromPointer(event), event, true);
}

/**
 * Handles drag movement over a timed day lane.
 *
 * @param {WeekPlannerCell} cell Candidate day.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onTimedDragOver(cell, event) {
	updateDropTarget(cell, minutesFromPointer(event), event, false);
}

/**
 * Updates the current drop-preview day and time.
 *
 * @param {WeekPlannerCell} cell Candidate target day.
 * @param {number|null} minutes Snapped target minutes, or null for all-day.
 * @param {DragEvent} event Native drag event.
 * @param {boolean} emitEntry Whether a changed target should emit day-drag-enter.
 * @returns {void}
 */
function updateDropTarget(cell, minutes, event, emitEntry) {
	if (!canUseDay(cell)) return;
	event.preventDefault();
	applyDropEffect(event);
	const changed = dragState.value.overCell?.value !== cell.value || dragState.value.overMinutes !== minutes;
	dragState.value = {
		...dragState.value,
		active: true,
		overCell: cell,
		overMinutes: minutes,
	};
	if (changed && emitEntry) emit('day-drag-enter', dragPayload(cell, minutes, event));
}

/**
 * Handles dragleave without clearing state for transitions between descendants.
 *
 * @param {WeekPlannerCell} cell Day being left.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onDayDragLeave(cell, event) {
	if (dragState.value.overCell?.value !== cell.value || event.currentTarget.contains(event.relatedTarget)) return;
	emit('day-drag-leave', dragPayload(cell, dragState.value.overMinutes, event));
	dragState.value = {
		...dragState.value,
		overCell: null,
		overMinutes: null,
	};
}

/**
 * Handles a drop into an all-day cell.
 *
 * @param {WeekPlannerCell} cell Target day.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onAllDayDrop(cell, event) {
	onDayDrop(cell, null, event);
}

/**
 * Handles a drop into a timed day lane.
 *
 * @param {WeekPlannerCell} cell Target day.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onTimedDrop(cell, event) {
	onDayDrop(cell, minutesFromPointer(event), event);
}

/**
 * Emits a completed drop without mutating application records.
 *
 * @param {WeekPlannerCell} cell Target day.
 * @param {number|null} minutes Snapped target minutes, or null for all-day.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onDayDrop(cell, minutes, event) {
	if (!canUseDay(cell)) return;
	event.preventDefault();
	applyDropEffect(event);
	emit('day-drop', dragPayload(cell, minutes, event));
	dragState.value = {
		...dragState.value,
		overCell: null,
		overMinutes: null,
	};
}

/**
 * Calculates a snapped target time from the pointer position inside a day lane.
 *
 * @param {DragEvent} event Native drag event.
 * @returns {number} Snapped minutes after midnight.
 */
function minutesFromPointer(event) {
	const target = event.currentTarget;
	if (!(target instanceof HTMLElement)) return normalizedTimeRange.value.startMinutes;
	return minutesFromClientY(target, event.clientY);
}

/**
 * Calculates a snapped time from a client Y coordinate inside a day lane.
 *
 * @param {HTMLElement} target Timed day lane.
 * @param {number} clientY Pointer client Y coordinate.
 * @param {number} [stepMinutes] Minutes represented by each snap interval.
 * @returns {number} Snapped minutes after midnight.
 */
function minutesFromClientY(target, clientY, stepMinutes = normalizedTimeRange.value.stepMinutes) {
	const bounds = target.getBoundingClientRect();
	const relativeY = Math.max(0, Math.min(bounds.height, clientY - bounds.top));
	const range = normalizedTimeRange.value;
	const rawMinutes = range.startMinutes + ((relativeY / Math.max(1, bounds.height)) * (range.endMinutes - range.startMinutes));
	const normalizedStep = Math.max(1, stepMinutes);
	const snapped = range.startMinutes + (Math.floor((rawMinutes - range.startMinutes) / normalizedStep) * normalizedStep);
	return Math.max(range.startMinutes, Math.min(range.endMinutes - normalizedStep, snapped));
}

/**
 * Builds the public payload shared by all planner drag events.
 *
 * @param {WeekPlannerCell} cell Target or source day.
 * @param {number|null} targetMinutes Target minutes, or null for all-day.
 * @param {DragEvent} event Native drag event.
 * @returns {WeekPlannerDayDragPayload} Public drag payload.
 */
function dragPayload(cell, targetMinutes, event) {
	const transferPayload = dragTransferPayload(event);
	const sourceValue = dragState.value.sourceCell?.value || transferPayload.sourceValue || transferPayload.sourceDate || '';
	const sourceTime = timeKeyOrEmpty(dragState.value.sourceMinutes) || transferPayload.sourceTime || timeFromData(transferPayload.data);
	const sourceMinutes = parseTime(sourceTime, false);
	const data = dragState.value.data ?? transferPayload.data ?? null;
	return {
		cell,
		targetCell: cell,
		sourceCell: dragState.value.sourceCell || cellForValue(sourceValue),
		sourceValue,
		targetValue: cell.value,
		sourceTime,
		targetTime: timeKeyOrEmpty(targetMinutes),
		sourceMinutes,
		targetMinutes,
		data,
		event,
		dataTransfer: event.dataTransfer,
		types: dataTransferTypes(event),
		getData: (type) => safeGetData(event, type),
	};
}

/**
 * Applies the configured native drop effect.
 *
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function applyDropEffect(event) {
	if (event.dataTransfer) event.dataTransfer.dropEffect = props.dropEffect;
}

/**
 * Reads the shared DOM Studio calendar transfer payload.
 *
 * @param {DragEvent} event Native drag event.
 * @returns {Record<string, unknown>} Parsed drag payload.
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
 * Serializes app-owned drag data with a date-and-time fallback.
 *
 * @param {{ sourceValue: string, sourceMonth: string, sourceTime: string, data: unknown }} payload Drag payload.
 * @returns {string} JSON transfer value.
 */
function serializeDragData(payload) {
	try {
		return JSON.stringify(payload);
	} catch {
		return JSON.stringify({
			sourceValue: payload.sourceValue,
			sourceMonth: payload.sourceMonth,
			sourceTime: payload.sourceTime,
		});
	}
}

/**
 * Chooses a plain-text fallback for native transfer compatibility.
 *
 * @param {unknown} data App-owned drag data.
 * @param {WeekPlannerCell} cell Source day.
 * @returns {string} Plain-text transfer value.
 */
function plainTextForDrag(data, cell) {
	if (typeof data === 'string') return data;
	if (data && typeof data === 'object' && 'id' in data) return String(data.id);
	return cell.value;
}

/**
 * Extracts a record start time when one is present.
 *
 * @param {unknown} data App-owned drag data.
 * @returns {string} HH:mm time or an empty string.
 */
function timeFromData(data) {
	return data && typeof data === 'object' && 'startTime' in data ? String(data.startTime || '') : '';
}

/**
 * Finds a visible cell by date key.
 *
 * @param {string} value YYYY-MM-DD key.
 * @returns {WeekPlannerCell|null} Visible day or null.
 */
function cellForValue(value) {
	return visibleDays.value.find((cell) => cell.value === value) || null;
}

/**
 * Safely lists native DataTransfer types.
 *
 * @param {DragEvent} event Native drag event.
 * @returns {Array<string>} Transfer types.
 */
function dataTransferTypes(event) {
	return Array.from(event.dataTransfer?.types || []);
}

/**
 * Safely reads a native DataTransfer value.
 *
 * @param {DragEvent} event Native drag event.
 * @param {string} type Transfer MIME type.
 * @returns {string} Stored value or an empty string.
 */
function safeGetData(event, type) {
	try {
		return event.dataTransfer?.getData(type) || '';
	} catch {
		return '';
	}
}

/**
 * Safely writes a native DataTransfer value.
 *
 * @param {DragEvent} event Native drag event.
 * @param {string} type Transfer MIME type.
 * @param {string} value Transfer value.
 * @returns {void}
 */
function safeSetData(event, type, value) {
	try {
		event.dataTransfer?.setData(type, value);
	} catch {
		// Some browsers reject unavailable or custom drag data stores.
	}
}

/**
 * Starts live-time updates and viewport measurement after client mount.
 *
 * @returns {void}
 */
function mountPlanner() {
	mounted.value = true;
	updateCurrentTime();
	refreshViewportMetrics();

	if (typeof ResizeObserver !== 'undefined' && scrollViewport.value) {
		viewportResizeObserver = new ResizeObserver(refreshViewportMetrics);
		viewportResizeObserver.observe(scrollViewport.value);
	}

	if (typeof window !== 'undefined') {
		currentTimeTimer = window.setInterval(updateCurrentTime, 30000);
		scheduleInitialScroll();
	}
}

/**
 * Releases live-time and viewport observers.
 *
 * @returns {void}
 */
function unmountPlanner() {
	mounted.value = false;
	viewportResizeObserver?.disconnect();
	viewportResizeObserver = null;
	cancelTimeSelection();

	if (currentTimeTimer !== null && typeof window !== 'undefined') {
		window.clearInterval(currentTimeTimer);
		currentTimeTimer = null;
	}
}

/**
 * Refreshes the reactive clock used by the current-time line and day state.
 *
 * @returns {void}
 */
function updateCurrentTime() {
	now.value = new Date();
}

/**
 * Reads the internal scrollport width and horizontal offset.
 *
 * @returns {void}
 */
function refreshViewportMetrics() {
	const element = scrollViewport.value;
	if (!element) return;
	viewportState.value = {
		scrollLeft: element.scrollLeft,
		clientWidth: element.clientWidth,
	};
}

/**
 * Emits horizontal scroll state while preserving native vertical scrolling.
 *
 * @param {Event} event Native scroll event.
 * @returns {void}
 */
function onViewportScroll(event) {
	const element = event.currentTarget;
	if (!(element instanceof HTMLElement)) return;
	viewportState.value = {
		scrollLeft: element.scrollLeft,
		clientWidth: element.clientWidth,
	};
	const payload = viewportPayload(element);
	emit('viewport-scroll', payload);
	if (payload.atEnd) emit('viewport-end', payload);
}

/**
 * Builds the public horizontal scroll payload.
 *
 * @param {HTMLElement} element Planner scroll viewport.
 * @returns {{
 *	scrollLeft: number,
 *	scrollWidth: number,
 *	clientWidth: number,
 *	remaining: number,
 *	atStart: boolean,
 *	atEnd: boolean,
 * }} Horizontal viewport state.
 */
function viewportPayload(element) {
	const remaining = Math.max(0, element.scrollWidth - element.scrollLeft - element.clientWidth);
	return {
		scrollLeft: element.scrollLeft,
		scrollWidth: element.scrollWidth,
		clientWidth: element.clientWidth,
		remaining,
		atStart: element.scrollLeft <= 48,
		atEnd: remaining <= 48,
	};
}

/**
 * Emits the mounted week window and its requestable date range.
 *
 * @param {ReturnType<typeof calculateVirtualWindow>} window Virtual week window.
 * @returns {void}
 */
function emitRenderWindowChange(window) {
	const firstWeek = allWeeks.value[window.startIndex] || null;
	const lastWeek = allWeeks.value[Math.max(window.startIndex, window.endIndex - 1)] || null;
	const firstCell = firstWeek?.days?.[0] || null;
	const lastCell = lastWeek?.days?.[lastWeek.days.length - 1] || null;
	emit('render-window-change', {
		startIndex: window.startIndex,
		endIndex: window.endIndex,
		firstVisibleIndex: window.firstVisibleIndex,
		lastVisibleIndex: window.lastVisibleIndex,
		renderedWeeks: window.renderedItems,
		totalWeeks: window.totalItems,
		start: firstCell?.value || '',
		end: lastCell?.value || '',
	});
}

/**
 * Schedules the configured initial date to be revealed after rendering.
 *
 * @returns {void}
 */
function scheduleInitialScroll() {
	if (!props.initialScrollDate || typeof window === 'undefined') return;
	nextTick(() => {
		window.requestAnimationFrame(() => {
			scrollToDate(props.initialScrollDate, { align: 'center' });
		});
	});
}

/**
 * Scrolls a loaded date into the horizontal viewport.
 *
 * @param {string|Date} value Date key or local Date.
 * @param {{ align?: 'start'|'center'|'end', behavior?: ScrollBehavior }} [options] Scroll alignment.
 * @returns {boolean} Whether the requested date belongs to the loaded range.
 */
function scrollToDate(value, options = {}) {
	const element = scrollViewport.value;
	const date = value instanceof Date ? value : parseDate(value);
	if (!element || !date || !loadedRange.value.startDate || !loadedRange.value.endDate) return false;
	if (date < loadedRange.value.startDate || date > loadedRange.value.endDate) return false;

	const dayIndex = differenceInCalendarDays(date, loadedRange.value.startDate);
	const dayWidth = clampNumber(props.dayWidth, 144, 480, 192);
	const railWidth = clampNumber(props.timeRailWidth, 56, 160, 72);
	const availableWidth = Math.max(dayWidth, element.clientWidth - railWidth);
	const dayOffset = dayIndex * dayWidth;
	const align = options.align || 'center';
	let left = dayOffset;

	if (align === 'center') left -= (availableWidth - dayWidth) / 2;
	if (align === 'end') left -= availableWidth - dayWidth;

	element.scrollTo({
		left: Math.max(0, left),
		top: element.scrollTop,
		behavior: options.behavior || 'auto',
	});
	return true;
}

/**
 * Scrolls a loaded time into the vertical viewport.
 *
 * @param {string|Date} value HH:mm key or Date whose local time should be used.
 * @param {{ align?: 'start'|'center'|'end', behavior?: ScrollBehavior }} [options] Scroll alignment.
 * @returns {boolean} Whether the requested time belongs to the configured grid.
 */
function scrollToTime(value, options = {}) {
	const element = scrollViewport.value;
	const timeGrid = element?.querySelector('[data-week-planner-time-grid]');
	const minutes = value instanceof Date ? minutesForDate(value) : parseTime(value, false);
	const range = normalizedTimeRange.value;
	if (!element || !(timeGrid instanceof HTMLElement) || minutes === null) return false;
	if (minutes < range.startMinutes || minutes > range.endMinutes) return false;

	const pixelsPerMinute = range.slotHeight / range.stepMinutes;
	const timeOffset = timeGrid.offsetTop + ((minutes - range.startMinutes) * pixelsPerMinute);
	const align = options.align || 'center';
	let top = timeOffset;

	if (align === 'center') top -= element.clientHeight / 2;
	if (align === 'end') top -= element.clientHeight;

	element.scrollTo({
		left: element.scrollLeft,
		top: Math.max(0, top),
		behavior: options.behavior || 'auto',
	});
	return true;
}

/**
 * Returns the planner to today's date and current local time.
 *
 * @param {{ align?: 'start'|'center'|'end', behavior?: ScrollBehavior }} [options] Scroll alignment.
 * @returns {boolean} Whether today belongs to the loaded date range.
 */
function scrollToToday(options = {}) {
	const date = new Date();
	const found = scrollToDate(date, options);
	if (found && isCurrentTimeVisible()) scrollToTime(date, options);
	return found;
}

/**
 * Returns minutes after midnight for a local Date.
 *
 * @param {Date} date Local date and time.
 * @returns {number} Fractional minutes after midnight.
 */
function minutesForDate(date) {
	return (date.getHours() * 60) + date.getMinutes() + (date.getSeconds() / 60);
}

/**
 * Calculates whole local calendar days between two dates without DST drift.
 *
 * @param {Date} date Later date.
 * @param {Date} origin Earlier date.
 * @returns {number} Signed whole-day distance.
 */
function differenceInCalendarDays(date, origin) {
	const dateUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
	const originUtc = Date.UTC(origin.getFullYear(), origin.getMonth(), origin.getDate());
	return Math.round((dateUtc - originUtc) / 86400000);
}

/**
 * Builds the initial date from initialYear and initialMonth.
 *
 * @returns {Date|null} First day of the configured month or null.
 */
function initialDateFromProps() {
	const year = Number(props.initialYear);
	const month = Number(props.initialMonth);
	if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
	return new Date(year, clampNumber(month, 1, 12, 1) - 1, 1);
}

/**
 * Parses a YYYY-MM-DD string into a validated local Date.
 *
 * @param {string} value Candidate date key.
 * @returns {Date|null} Parsed date or null.
 */
function parseDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
	const [year, month, day] = value.split('-').map(Number);
	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
	return date;
}

/**
 * Parses an HH:mm time string into minutes after midnight.
 *
 * @param {string} value Candidate time.
 * @param {boolean} allowEndOfDay Whether 24:00 is valid.
 * @returns {number|null} Minutes after midnight or null.
 */
function parseTime(value, allowEndOfDay) {
	const match = /^(\d{2}):(\d{2})$/.exec(value || '');
	if (!match) return null;
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (allowEndOfDay && hours === 24 && minutes === 0) return 1440;
	if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
	return (hours * 60) + minutes;
}

/**
 * Formats minutes after midnight as an HH:mm key.
 *
 * @param {number} minutes Minutes after midnight.
 * @returns {string} HH:mm time key.
 */
function formatTimeKey(minutes) {
	if (minutes === 1440) return '24:00';
	const normalized = Math.max(0, Math.min(1439, Math.round(minutes)));
	return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
}

/**
 * Formats nullable minutes as a time key.
 *
 * @param {number|null|undefined} minutes Minutes after midnight.
 * @returns {string} HH:mm time or an empty string.
 */
function timeKeyOrEmpty(minutes) {
	return Number.isFinite(minutes) ? formatTimeKey(minutes) : '';
}

/**
 * Left-pads a numeric date or time part.
 *
 * @param {number} value Numeric part.
 * @returns {string} Two-digit value.
 */
function pad(value) {
	return String(value).padStart(2, '0');
}

/**
 * Formats a local Date as YYYY-MM-DD.
 *
 * @param {Date} date Date to format.
 * @returns {string} Date key.
 */
function formatDate(date) {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Formats a local Date as YYYY-MM.
 *
 * @param {Date} date Date to format.
 * @returns {string} Month key.
 */
function monthValue(date) {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/**
 * Returns the calendar-month distance between a date and anchor month.
 *
 * @param {Date} date Candidate date.
 * @param {Date} monthDate First day of the anchor month.
 * @returns {number} Signed month distance.
 */
function monthDistance(date, monthDate) {
	return ((date.getFullYear() - monthDate.getFullYear()) * 12) + date.getMonth() - monthDate.getMonth();
}

/**
 * Adds whole local calendar days.
 *
 * @param {Date} date Starting date.
 * @param {number} days Number of days to add.
 * @returns {Date} Offset local date.
 */
function addDays(date, days) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Finds the first date in the week containing a date.
 *
 * @param {Date} date Date inside the week.
 * @param {number} weekStartsOn First weekday index.
 * @returns {Date} Local week start.
 */
function startOfWeek(date, weekStartsOn) {
	const offset = (date.getDay() - weekStartsOn + 7) % 7;
	return addDays(date, -offset);
}

/**
 * Resolves the ISO week number represented by a week.
 *
 * @param {Array<WeekPlannerCell>} days Seven day cells.
 * @returns {number} ISO-8601 week number.
 */
function isoWeekNumberForWeek(days) {
	const thursday = days.find((cell) => cell.date.getDay() === 4)?.date || days[0]?.date || new Date();
	return isoWeekNumber(thursday);
}

/**
 * Calculates the ISO-8601 week number for a local date.
 *
 * @param {Date} date Candidate date.
 * @returns {number} ISO week number.
 */
function isoWeekNumber(date) {
	const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const day = target.getDay() || 7;
	target.setDate(target.getDate() + 4 - day);
	const yearStart = new Date(target.getFullYear(), 0, 1);
	return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
}

/**
 * Checks whether a value has the YYYY-MM-DD boundary shape.
 *
 * @param {string} value Candidate boundary.
 * @returns {boolean} True when the boundary can be lexically compared.
 */
function isDateBoundary(value) {
	return /^\d{4}-\d{2}-\d{2}$/.test(value || '');
}

/**
 * Checks whether a date key is before a configured boundary.
 *
 * @param {string} value Date key.
 * @param {string} boundary Boundary key.
 * @returns {boolean} True when the date is before the boundary.
 */
function beforeBoundary(value, boundary) {
	return isDateBoundary(boundary) && value < boundary;
}

/**
 * Checks whether a date key is after a configured boundary.
 *
 * @param {string} value Date key.
 * @param {string} boundary Boundary key.
 * @returns {boolean} True when the date is after the boundary.
 */
function afterBoundary(value, boundary) {
	return isDateBoundary(boundary) && value > boundary;
}

/**
 * Checks whether a date key is outside the interactive range.
 *
 * @param {string} value Date key.
 * @returns {boolean} True when the date is before min or after max.
 */
function outsideRange(value) {
	return beforeBoundary(value, props.min) || afterBoundary(value, props.max);
}

/**
 * Clamps a numeric prop into a supported integer range.
 *
 * @param {number} value Candidate number.
 * @param {number} min Minimum value.
 * @param {number} max Maximum value.
 * @param {number} fallback Fallback when the value is not finite.
 * @returns {number} Rounded and clamped value.
 */
function clampNumber(value, min, max, fallback) {
	const number = Number(value);
	if (!Number.isFinite(number)) return fallback;
	return Math.min(max, Math.max(min, Math.round(number)));
}
</script>

<template>
	<div class="w-full min-w-0" data-dom-week-planner>
		<h2 :id="`${rootId}-label`" class="sr-only">{{ rangeLabel }}</h2>

		<div
			ref="scrollViewport"
			tabindex="0"
			class="relative overflow-auto overscroll-contain rounded-2xl border border-border bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
			:style="viewportStyle"
			:aria-busy="loading ? 'true' : undefined"
			:aria-label="`Week planner, ${rangeLabel}`"
			@scroll.passive="onViewportScroll"
		>
			<div
				v-if="loading"
				class="pointer-events-none sticky top-3 left-full z-50 h-0 w-0"
				data-week-planner-loading
			>
				<div class="absolute top-0 right-3 flex w-max items-center gap-2 rounded-full border border-border bg-canvas/95 px-3 py-1.5 text-[10px] font-semibold text-muted-fg shadow-sm backdrop-blur">
					<span class="size-2 animate-pulse rounded-full bg-primary"></span>
					Loading dates
				</div>
			</div>

			<div class="w-max min-w-full">
				<div
					role="row"
					class="sticky top-0 z-30 grid border-b border-border bg-canvas shadow-sm"
					:style="plannerGridStyle"
				>
					<div
						role="columnheader"
						class="sticky left-0 z-40 flex min-w-0 items-end border-r border-border bg-secondary px-3 py-3"
					>
						<slot name="corner" :range="visibleRange">
							<span class="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-fg">{{ rangeLabel }}</span>
						</slot>
					</div>

					<div
						v-if="weekRenderWindow.beforeSpacerSize"
						aria-hidden="true"
						class="h-18 border-r border-border bg-secondary/15"
					></div>

					<component
						:is="clickable ? 'button' : 'div'"
						v-for="cell in visibleDays"
						:key="`header-${cell.value}`"
						:type="clickable ? 'button' : undefined"
						role="columnheader"
						:disabled="clickable && cell.disabled ? true : undefined"
						:aria-label="cell.label"
						:aria-current="cell.today ? 'date' : undefined"
						:data-date="cell.value"
						:data-week-start="cell.column === 0 ? weekForCell(cell).value : undefined"
						class="relative flex h-18 min-w-0 items-center justify-between gap-2 border-l border-border px-3 py-2 text-left outline-none first:border-l-0"
						:class="[
							cell.column === 0 && cell.row > 0 && 'border-l-2 border-l-muted',
							cell.today ? 'bg-primary/10' : 'bg-secondary/30',
							cell.muted && 'text-muted-fg/55',
							clickable && !cell.disabled && 'cursor-pointer hover:bg-secondary/60 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
							clickable && cell.disabled && 'cursor-not-allowed opacity-55',
						]"
						@click="onUntimedDayClick(cell, $event)"
					>
						<slot name="day-header" :cell="cell" :month="monthForCell(cell)" :week="weekForCell(cell)">
							<div class="min-w-0">
								<span class="block truncate text-[10px] font-semibold uppercase tracking-wide text-muted-fg">{{ cell.weekday }}</span>
								<span class="mt-0.5 block truncate text-xs font-semibold text-canvas-fg">{{ monthForCell(cell).label }}</span>
							</div>
							<span
								class="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums"
								:class="cell.today ? 'bg-primary text-primary-fg' : 'bg-canvas text-canvas-fg'"
							>
								{{ cell.day }}
							</span>
							<span v-if="showWeekNumbers && cell.column === 0" class="block text-[9px] font-bold text-muted-fg">
								W{{ cell.weekNumber }}
							</span>
						</slot>
					</component>

					<div
						v-if="weekRenderWindow.afterSpacerSize"
						aria-hidden="true"
						class="h-18 border-l border-border bg-secondary/15"
					></div>
				</div>

				<div
					v-if="showAllDayRow"
					role="row"
					class="sticky top-18 z-20 grid border-b border-border bg-canvas shadow-sm"
					:style="plannerGridStyle"
				>
					<div
						role="rowheader"
						class="sticky left-0 z-30 flex min-h-14 items-center justify-end border-r border-border bg-canvas px-3 text-[10px] font-semibold uppercase tracking-wide text-muted-fg"
					>
						All day
					</div>

					<div
						v-if="weekRenderWindow.beforeSpacerSize"
						aria-hidden="true"
						class="min-h-14 border-r border-border bg-secondary/10"
					></div>

					<component
						:is="clickable ? 'button' : 'div'"
						v-for="cell in visibleDays"
						:key="`all-day-${cell.value}`"
						:type="clickable ? 'button' : undefined"
						role="gridcell"
						:disabled="clickable && cell.disabled ? true : undefined"
						:aria-label="`All day, ${cell.label}`"
						class="min-h-14 min-w-0 border-l border-border p-1.5 text-left outline-none"
						:class="[
							cell.column === 0 && cell.row > 0 && 'border-l-2 border-l-muted',
							cell.muted && 'bg-secondary/20 text-muted-fg/55',
							clickable && !cell.disabled && 'cursor-pointer hover:bg-secondary/50 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
							clickable && cell.disabled && 'cursor-not-allowed opacity-55',
							dragAndDrop && dragState.overCell?.value === cell.value && dragState.overMinutes === null && 'bg-primary/10 ring-2 ring-inset ring-ring/60',
						]"
						@click="onUntimedDayClick(cell, $event)"
						@dragenter="onAllDayDragEnter(cell, $event)"
						@dragover="onAllDayDragOver(cell, $event)"
						@dragleave="onDayDragLeave(cell, $event)"
						@drop="onAllDayDrop(cell, $event)"
					>
						<slot
							name="all-day"
							:cell="cell"
							:month="monthForCell(cell)"
							:week="weekForCell(cell)"
							:drag="dragStateFor(cell)"
							:dragAttrs="dragAttrsFor(cell)"
						/>
					</component>

					<div
						v-if="weekRenderWindow.afterSpacerSize"
						aria-hidden="true"
						class="min-h-14 border-l border-border bg-secondary/10"
					></div>
				</div>

				<div
					role="grid"
					:aria-labelledby="`${rootId}-label`"
					class="grid"
					:style="plannerGridStyle"
					data-week-planner-time-grid
				>
					<div
						role="rowheader"
						class="sticky left-0 z-20 border-r border-border bg-canvas"
						:style="{ height: `${plannerHeight}px` }"
					>
						<div
							v-for="slot in timeSlots"
							:key="`time-${slot.time}`"
							class="relative border-b border-border"
							:style="timeSlotStyle(slot)"
						>
							<div class="absolute -top-2.5 right-2 bg-canvas px-1 text-[10px] font-medium tabular-nums text-muted-fg">
								<slot name="time-label" :slot="slot">{{ slot.label }}</slot>
							</div>
						</div>
					</div>

					<div
						v-if="weekRenderWindow.beforeSpacerSize"
						aria-hidden="true"
						class="border-r border-border bg-secondary/5"
						:style="{ height: `${plannerHeight}px` }"
					></div>

					<div
						v-for="cell in visibleDays"
						:key="`lane-${cell.value}`"
						class="relative min-w-0 border-l border-border"
						:class="[
							cell.column === 0 && cell.row > 0 && 'border-l-2 border-l-muted',
							cell.muted && 'bg-secondary/20 text-muted-fg/55',
							cell.disabled && 'opacity-60',
							rangeSelection && !cell.disabled && 'cursor-crosshair select-none',
							dragAndDrop && dragState.active && !cell.disabled && dragState.overCell?.value !== cell.value && 'bg-primary/5',
						]"
						:style="[dayStyleFor(cell), { height: `${plannerHeight}px` }]"
						:data-date="cell.value"
						:data-today="cell.today ? '' : undefined"
						:data-muted="cell.muted ? '' : undefined"
						:data-drag-source="dragState.sourceCell?.value === cell.value ? '' : undefined"
						:data-drop-target="dragState.overCell?.value === cell.value ? '' : undefined"
						@pointerdown="onTimeSelectionStart(cell, $event)"
						@dragenter="onTimedDragEnter(cell, $event)"
						@dragover="onTimedDragOver(cell, $event)"
						@dragleave="onDayDragLeave(cell, $event)"
						@drop="onTimedDrop(cell, $event)"
					>
						<component
							:is="clickable ? 'button' : 'div'"
							v-for="slot in timeSlots"
							:key="`${cell.value}-${slot.time}`"
							:type="clickable ? 'button' : undefined"
							role="gridcell"
							:disabled="clickable && cell.disabled ? true : undefined"
							:aria-label="`${cell.label}, ${slot.label}`"
							class="block w-full border-b border-border text-left outline-none"
							:class="[
								dayClassFor(cell),
								clickable && !cell.disabled && 'cursor-pointer hover:bg-secondary/40 focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
								clickable && cell.disabled && 'cursor-not-allowed',
								dragAndDrop && dragState.overCell?.value === cell.value && dragState.overMinutes === slot.minutes && 'bg-primary/10 ring-2 ring-inset ring-ring/60',
							]"
							:style="timeSlotStyle(slot)"
							@click="onTimeSlotClick(cell, slot, $event)"
						/>

							<div
								v-if="mounted && showCurrentTime && cell.today && currentTimeVisible"
							class="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-destructive shadow-sm"
							:style="currentTimeStyle"
							:aria-label="`Current time ${formatTimeKey(minutesForDate(now))}`"
							data-current-time
						>
								<span class="absolute -top-1 -left-1 size-2.5 rounded-full bg-destructive ring-2 ring-canvas"></span>
							</div>

							<div
								v-if="rangeSelection && timeSelection.active && timeSelection.cell?.value === cell.value"
								class="pointer-events-none absolute inset-x-1.5 z-30 overflow-hidden rounded-lg border-2 border-primary bg-primary/15 px-2 py-1 text-[10px] font-bold tabular-nums text-primary shadow-sm"
								:style="timeSelectionStyle"
								:aria-label="`Selected ${formatTimeKey(timeSelection.startMinutes)} to ${formatTimeKey(timeSelection.endMinutes)}`"
								data-time-range-selection
							>
								{{ formatTimeKey(timeSelection.startMinutes) }}–{{ formatTimeKey(timeSelection.endMinutes) }}
							</div>

							<div class="pointer-events-none absolute inset-0 z-10">
							<slot
								:cell="cell"
								:month="monthForCell(cell)"
								:week="weekForCell(cell)"
								:timeSlots="timeSlots"
								:drag="dragStateFor(cell)"
								:dragAttrs="dragAttrsFor(cell)"
								:rangeStyle="rangeStyle"
							/>
						</div>
					</div>

					<div
						v-if="weekRenderWindow.afterSpacerSize"
						aria-hidden="true"
						class="border-l border-border bg-secondary/5"
						:style="{ height: `${plannerHeight}px` }"
					></div>
				</div>
			</div>
		</div>
	</div>
</template>
