<script>
/**
 * @typedef {object} MonthCalendarCell
 * @property {Date} date Local Date instance for the cell.
 * @property {string} value YYYY-MM-DD date key.
 * @property {number} day Day of the month.
 * @property {string} weekday Formatted weekday label.
 * @property {string} label Full accessible date label.
 * @property {boolean} currentMonth True when the date belongs to the rendered month.
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
 */

/**
 * @typedef {object} MonthCalendarDayClickPayload
 * @property {MonthCalendarCell} cell
 * @property {MouseEvent} event
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
	/**
	 * @type {MonthCalendarDisabledDate}
	 */
	disabledDate: {
		type: Function,
		default: null,
		_edit: { group: 'Interaction', description: 'Function that receives a day cell and returns true when the day should not be clickable.' },
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
import { computed, useId } from 'vue';

defineOptions({
	__doc: {
		name: 'Month calendar',
		tag: '<DomMonthCalendar>',
		description: 'A large scrolling month calendar that keeps weekday grids aligned and lets each day render custom UI.',
		icon: 'M7 4v3M17 4v3M5 8h14M6 6h12v13H6V6Zm3 6h2M13 12h2M9 16h2M13 16h2',
		events: [
			{ name: 'day-click', payload: '({ cell, event })', typeRef: 'MonthCalendarDayClickPayload', description: 'Fired when a clickable day is activated.' },
		],
		slots: [
			{ name: '(default)', payload: '{ cell, month }', typeRef: 'MonthCalendarDaySlotPayload', description: 'Custom content inside each visible calendar day.' },
			{ name: 'month-header', payload: '{ month }', description: 'Custom content rendered opposite the month title.' },
		],
		keyboard: [
			{ keys: 'Tab', action: 'Move through clickable days when clickable is enabled.' },
			{ keys: 'Enter / Space', action: 'Activate the focused day.' },
		],
	},
});

const props = defineProps(monthCalendarProps);
const emit = defineEmits(['day-click']);
const rootId = useId();

const todayValue = formatDate(new Date());
const resolvedWeekStartsOn = computed(() => clampWeekStartsOn(props.weekStartsOn));
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
	const currentMonth = date.getMonth() + 1 === month.month && date.getFullYear() === month.year;
	const hidden = !currentMonth && !props.showAdjacentDays;
	const cell = {
		date,
		value,
		day: date.getDate(),
		weekday: weekdayLabelFormatter.value.format(date),
		label: dateLabelFormatter.value.format(date),
		currentMonth,
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
	cell.muted = hidden || !currentMonth || beforeBoundary(value, props.mutedBefore) || afterBoundary(value, props.mutedAfter);
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
		weeks.push({
			index: weeks.length,
			days: cells.slice(index, index + 7),
		});
	}
	return weeks;
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

function dayClassFor(cell) {
	if (!props.dayClass) return '';
	if (typeof props.dayClass === 'function') return props.dayClass(cell);
	return props.dayClass;
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
					class="md:min-w-[48rem]"
				>
					<div v-if="dayHeaders" role="row" class="hidden md:grid md:grid-cols-7 border-b border-border bg-secondary/30">
						<div
							v-for="(weekday, index) in weekdayLabels"
							:key="weekday"
							role="columnheader"
							class="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-fg"
							:class="index > 0 && 'border-l border-border'"
						>
							{{ weekday }}
						</div>
					</div>

					<div
						v-for="week in month.weeks"
						:key="week.index"
						role="row"
						class="grid grid-cols-1 md:grid-cols-7 "
					>
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
							:data-muted="cell.muted ? '' : undefined"
							:data-today="cell.today ? '' : undefined"
							class="flex min-h-30 w-full min-w-0 flex-col items-stretch justify-start p-3 text-left outline-none transition sm:min-h-38 lg:min-h-44"
							:class="[
								(cell.row > 0 || cell.column > 0) && 'border-t border-border',
								cell.row === 0 && cell.column > 0 && 'md:border-t-0',
								cell.column > 0 && 'md:border-l md:border-border',
								cell.hidden && 'pointer-events-none bg-secondary/20 text-transparent',
								!cell.hidden && cell.muted && 'bg-secondary/20 text-muted-fg/55',
								!cell.hidden && !cell.muted && 'text-canvas-fg',
								clickable && !cell.disabled && 'cursor-pointer hover:bg-secondary/50 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
								clickable && cell.disabled && 'cursor-not-allowed opacity-55',
								!clickable && 'cursor-default',
								cell.today && !cell.hidden && 'ring-2 ring-inset ring-ring/40',
								dayClassFor(cell),
							]"
							:style="dayStyleFor(cell)"
							@click="onDayClick(cell, $event)"
						>
							<template v-if="!cell.hidden">
								<div class="flex items-start justify-between gap-2">
									<span class="text-base font-bold leading-none">{{ cell.day }}</span>
									<span class="text-sm font-bold lowercase leading-none">{{ cell.weekday }}</span>
								</div>
								<div class="mt-3 min-h-0">
									<slot :cell="cell" :month="month" />
								</div>
							</template>
						</component>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>
