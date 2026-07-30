<script setup>
import { computed, nextTick, ref } from 'vue';
import { DomButton, DomStatusPill, DomWeekPlanner } from '../../../lib/vue';

const planner = ref(null);
const cursor = ref(new Date(2026, 5, 8));
const weeks = ref(3);
const yearMode = ref(false);
const renderWindow = ref({
	renderedWeeks: 3,
	totalWeeks: 3,
	start: '2026-06-08',
	end: '2026-06-28',
});
const lastAction = ref('Drag an appointment to reschedule it, or select an empty time row.');
const records = ref([
	{
		id: 'evt_1042',
		date: '2026-06-08',
		title: 'Install window',
		startTime: '09:00',
		endTime: '11:00',
		status: 'confirmed',
		tone: 'primary',
		resourceId: 'field-ops',
		meta: {
			customerId: 'cus_8821',
			location: 'Dock 4',
			owner: 'Maya Chen',
		notes: 'Replacement shutters and access lift.',
		},
	},
	{
		id: 'evt_1048',
		date: '2026-06-08',
		title: 'Site survey',
		startTime: '13:30',
		endTime: '15:00',
		status: 'tentative',
		tone: 'warning',
		resourceId: 'field-ops',
		meta: {
			customerId: 'cus_8846',
			location: 'Studio 2',
			owner: 'Noah Williams',
			notes: 'Check power and loading access.',
		},
	},
	{
		id: 'evt_1051',
		date: '2026-06-09',
		title: 'Design review',
		startTime: '10:00',
		endTime: '12:30',
		status: 'confirmed',
		tone: 'accent',
		resourceId: 'design',
		meta: {
			customerId: 'cus_8872',
			location: 'Video call',
			owner: 'Ava Brooks',
			notes: 'Approve revised material palette.',
		},
	},
	{
		id: 'evt_1055',
		date: '2026-06-10',
		title: 'Maintenance visit',
		startTime: '08:30',
		endTime: '10:00',
		status: 'confirmed',
		tone: 'success',
		resourceId: 'service',
		meta: {
			customerId: 'cus_8812',
			location: 'North lobby',
			owner: 'Leo Harris',
			notes: 'Quarterly inspection and controls test.',
		},
	},
	{
		id: 'evt_1059',
		date: '2026-06-11',
		title: 'Handover session',
		startTime: '14:00',
		endTime: '16:30',
		status: 'confirmed',
		tone: 'primary',
		resourceId: 'field-ops',
		meta: {
			customerId: 'cus_8894',
			location: 'Atrium',
			owner: 'Maya Chen',
			notes: 'Client training and completion pack.',
		},
	},
	{
		id: 'evt_1064',
		date: '2026-06-12',
		title: 'Parts collection',
		startTime: '11:00',
		endTime: '12:00',
		status: 'scheduled',
		tone: 'secondary',
		resourceId: 'field-ops',
		meta: {
			customerId: 'internal',
			location: 'West depot',
			owner: 'Noah Williams',
			notes: 'Collect motors and spare controls.',
		},
	},
	{
		id: 'evt_1070',
		date: '2026-06-15',
		title: 'Phase two begins',
		allDay: true,
		status: 'milestone',
		tone: 'accent',
		resourceId: 'field-ops',
		meta: {
			customerId: 'cus_8821',
			location: 'Dock 4',
			owner: 'Maya Chen',
			notes: 'Second-floor installation opens.',
		},
	},
	{
		id: 'evt_1074',
		date: '2026-06-16',
		title: 'Accessibility audit',
		startTime: '09:30',
		endTime: '12:00',
		status: 'confirmed',
		tone: 'success',
		resourceId: 'design',
		meta: {
			customerId: 'cus_8902',
			location: 'Civic hall',
			owner: 'Ava Brooks',
			notes: 'Review entrances, controls, and signage.',
		},
	},
	{
		id: 'evt_1079',
		date: '2026-06-18',
		title: 'Commissioning',
		startTime: '13:00',
		endTime: '16:00',
		status: 'scheduled',
		tone: 'warning',
		resourceId: 'service',
		meta: {
			customerId: 'cus_8911',
			location: 'East wing',
			owner: 'Leo Harris',
			notes: 'System calibration and sign-off.',
		},
	},
]);

const plannerStartDate = computed(formatPlannerStartDate);
const plannerFocusDate = computed(() => formatDate(cursor.value));
const plannerWeeks = computed(resolvePlannerWeeks);
const plannerMin = computed(() => yearMode.value ? `${cursor.value.getFullYear()}-01-01` : '');
const plannerMax = computed(() => yearMode.value ? `${cursor.value.getFullYear()}-12-31` : '');
const recordsByDate = computed(groupRecordsByDate);
const rangeLabel = computed(formatVisibleRange);
const renderStatus = computed(formatRenderStatus);
const monthFormatter = new Intl.DateTimeFormat('en-GB', {
	month: 'long',
	year: 'numeric',
});

/**
 * Formats the first date represented by the current planner mode.
 *
 * @returns {string} YYYY-MM-DD planner start date.
 */
function formatPlannerStartDate() {
	if (yearMode.value) return `${cursor.value.getFullYear()}-01-01`;
	return formatDate(cursor.value);
}

/**
 * Resolves the number of weeks represented by the current planner mode.
 *
 * @returns {number} Consecutive week count.
 */
function resolvePlannerWeeks() {
	return yearMode.value ? weeksCoveringYear(cursor.value.getFullYear()) : weeks.value;
}

/**
 * Groups the shared calendar record shape by its date key.
 *
 * @returns {Record<string, Array<Record<string, unknown>>>} Records keyed by YYYY-MM-DD.
 */
function groupRecordsByDate() {
	return records.value.reduce((groups, record) => {
		if (!groups[record.date]) groups[record.date] = [];
		groups[record.date].push(record);
		return groups;
	}, {});
}

/**
 * Lists timed records for a planner day.
 *
 * @param {string} date YYYY-MM-DD day key.
 * @returns {Array<Record<string, unknown>>} Timed records ordered by start time.
 */
function timedRecordsFor(date) {
	return (recordsByDate.value[date] || [])
		.filter((record) => !record.allDay)
		.sort((left, right) => left.startTime.localeCompare(right.startTime));
}

/**
 * Lists all-day records for a planner day.
 *
 * @param {string} date YYYY-MM-DD day key.
 * @returns {Array<Record<string, unknown>>} All-day records.
 */
function allDayRecordsFor(date) {
	return (recordsByDate.value[date] || []).filter((record) => record.allDay);
}

/**
 * Navigates the visible range by the current number of rendered weeks.
 *
 * @param {number} direction Negative for previous and positive for next.
 * @returns {void}
 */
function navigate(direction) {
	cursor.value = yearMode.value
		? new Date(cursor.value.getFullYear() + direction, cursor.value.getMonth(), cursor.value.getDate())
		: addDays(cursor.value, direction * weeks.value * 7);
}

/**
 * Returns the planner to today's date and current time.
 *
 * @returns {void}
 */
function goToToday() {
	cursor.value = new Date();
	nextTick(() => {
		planner.value?.scrollToToday({ align: 'center', behavior: 'smooth' });
	});
}

/**
 * Changes how many fixed-width weeks the planner renders and leaves year mode.
 *
 * @param {number} value Requested week count.
 * @returns {void}
 */
function setWeeks(value) {
	yearMode.value = false;
	weeks.value = value;
}

/**
 * Switches to a virtualized full-year date range.
 *
 * @returns {void}
 */
function showFullYear() {
	yearMode.value = true;
	nextTick(() => {
		planner.value?.scrollToDate(cursor.value, { align: 'center' });
	});
}

/**
 * Formats the visible range summary used above the planner.
 *
 * @returns {string} Visible month or month range.
 */
function formatVisibleRange() {
	if (yearMode.value) return `${cursor.value.getFullYear()} full year`;
	const start = startOfWeek(cursor.value, 1);
	const end = addDays(start, (weeks.value * 7) - 1);
	const startLabel = monthFormatter.format(start);
	const endLabel = monthFormatter.format(end);
	return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}

/**
 * Formats the virtual render-window summary shown above the planner.
 *
 * @returns {string} Mounted and available week summary.
 */
function formatRenderStatus() {
	if (!yearMode.value) return `${weeks.value} fixed-width week${weeks.value === 1 ? '' : 's'}`;
	return `${renderWindow.value.renderedWeeks} of ${renderWindow.value.totalWeeks} weeks mounted · ${renderWindow.value.start} – ${renderWindow.value.end}`;
}

/**
 * Stores the planner's mounted virtual week window.
 *
 * @param {{ renderedWeeks: number, totalWeeks: number, start: string, end: string }} value Render window.
 * @returns {void}
 */
function updateRenderWindow(value) {
	renderWindow.value = value;
}

/**
 * Calculates how many Monday-led weeks touch a calendar year.
 *
 * @param {number} year Four-digit year.
 * @returns {number} Week groups required to cover the year.
 */
function weeksCoveringYear(year) {
	const firstWeekStart = startOfWeek(new Date(year, 0, 1), 1);
	const finalWeekStart = startOfWeek(new Date(year, 11, 31), 1);
	const dayDistance = Math.round((
		Date.UTC(finalWeekStart.getFullYear(), finalWeekStart.getMonth(), finalWeekStart.getDate())
		- Date.UTC(firstWeekStart.getFullYear(), firstWeekStart.getMonth(), firstWeekStart.getDate())
	) / 86400000);
	return Math.floor(dayDistance / 7) + 1;
}

/**
 * Builds the app-owned drag payload for a calendar record.
 *
 * @param {Record<string, unknown>} record Calendar record.
 * @returns {Record<string, unknown>} Serializable drag metadata.
 */
function dragDataFor(record) {
	return {
		id: record.id,
		date: record.date,
		startTime: record.startTime || '',
		endTime: record.endTime || '',
		title: record.title,
		allDay: Boolean(record.allDay),
	};
}

/**
 * Moves one record to the target date and time without affecting other records.
 *
 * @param {{ data: Record<string, unknown>, targetValue: string, targetTime: string }} payload Planner drop payload.
 * @returns {void}
 */
function moveRecord({ data, targetValue, targetTime }) {
	if (!data?.id || !targetValue) return;
	const sourceRecord = records.value.find((record) => record.id === data.id);
	if (!sourceRecord) return;

	const duration = durationInMinutes(sourceRecord);
	records.value = records.value.map((record) => {
		if (record.id !== data.id) return record;
		if (!targetTime) {
			return {
				...record,
				date: targetValue,
				allDay: true,
				startTime: '',
				endTime: '',
			};
		}

		const startMinutes = parseTime(targetTime);
		return {
			...record,
			date: targetValue,
			allDay: false,
			startTime: targetTime,
			endTime: formatTime(Math.min(1440, startMinutes + duration)),
		};
	});

	lastAction.value = targetTime
		? `Moved “${sourceRecord.title}” to ${targetValue} at ${targetTime}.`
		: `Moved “${sourceRecord.title}” to the all-day row on ${targetValue}.`;
}

/**
 * Records selection of an empty time row.
 *
 * @param {{ cell: { value: string }, targetTime: string }} payload Planner click payload.
 * @returns {void}
 */
function selectTime({ cell, targetTime }) {
	if (!targetTime) return;
	lastAction.value = `Selected ${cell.value} at ${targetTime} for a new appointment.`;
}

/**
 * Calculates the duration of a timed record.
 *
 * @param {Record<string, unknown>} record Calendar record.
 * @returns {number} Duration in minutes, with a one-hour fallback.
 */
function durationInMinutes(record) {
	const start = parseTime(record.startTime);
	const end = parseTime(record.endTime, true);
	return start !== null && end !== null && end > start ? end - start : 60;
}

/**
 * Resolves semantic classes for an appointment tone.
 *
 * @param {Record<string, unknown>} record Calendar record.
 * @returns {string} Theme-aware event classes.
 */
function eventToneClass(record) {
	const tones = {
		primary: 'border-primary/35 bg-primary/10 text-canvas-fg',
		accent: 'border-accent/50 bg-accent/20 text-canvas-fg',
		success: 'border-success/40 bg-success/10 text-canvas-fg',
		warning: 'border-warning/45 bg-warning/15 text-canvas-fg',
		secondary: 'border-border bg-secondary text-canvas-fg',
	};
	return tones[record.tone] || tones.secondary;
}

/**
 * Formats a compact time range for an appointment.
 *
 * @param {Record<string, unknown>} record Calendar record.
 * @returns {string} HH:mm time range.
 */
function recordTimeLabel(record) {
	return `${record.startTime}–${record.endTime}`;
}

/**
 * Parses HH:mm into minutes after midnight.
 *
 * @param {string} value Time key.
 * @param {boolean} [allowEndOfDay] Whether 24:00 is valid.
 * @returns {number|null} Minutes after midnight or null.
 */
function parseTime(value, allowEndOfDay = false) {
	const match = /^(\d{2}):(\d{2})$/.exec(value || '');
	if (!match) return null;
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (allowEndOfDay && hours === 24 && minutes === 0) return 1440;
	if (hours > 23 || minutes > 59) return null;
	return (hours * 60) + minutes;
}

/**
 * Formats minutes after midnight as HH:mm.
 *
 * @param {number} minutes Minutes after midnight.
 * @returns {string} Time key.
 */
function formatTime(minutes) {
	if (minutes >= 1440) return '24:00';
	return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/**
 * Formats a local date as YYYY-MM-DD.
 *
 * @param {Date} date Date to format.
 * @returns {string} Date key.
 */
function formatDate(date) {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Left-pads a date or time part.
 *
 * @param {number} value Numeric value.
 * @returns {string} Two-digit value.
 */
function pad(value) {
	return String(value).padStart(2, '0');
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
</script>

<template>
	<div class="w-full min-w-0 space-y-4" data-testid="team-week-planner-example">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<p class="text-sm font-semibold text-canvas-fg">{{ rangeLabel }}</p>
				<p class="mt-0.5 text-xs text-muted-fg">{{ renderStatus }}</p>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<DomButton size="sm" variant="secondary" @click="navigate(-1)">
					{{ yearMode ? 'Previous year' : 'Previous' }}
				</DomButton>
				<DomButton size="sm" variant="primary" @click="goToToday">Today</DomButton>
				<DomButton size="sm" variant="secondary" @click="navigate(1)">
					{{ yearMode ? 'Next year' : 'Next' }}
				</DomButton>
				<div class="ml-1 flex flex-wrap items-center rounded-lg border border-border bg-secondary/30 p-1" aria-label="Planner date range">
					<DomButton
						v-for="value in [1, 2, 3]"
						:key="value"
						size="sm"
						:variant="!yearMode && weeks === value ? 'primary' : 'ghost'"
						@click="setWeeks(value)"
					>
						{{ value }} {{ value === 1 ? 'week' : 'weeks' }}
					</DomButton>
					<DomButton
						size="sm"
						:variant="yearMode ? 'primary' : 'ghost'"
						@click="showFullYear"
					>
						Full year
					</DomButton>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2 rounded-lg border border-border bg-secondary/25 px-3 py-2">
			<DomStatusPill tone="info">App-owned state</DomStatusPill>
			<p class="min-w-0 truncate text-xs text-muted-fg">{{ lastAction }}</p>
		</div>

		<DomWeekPlanner
			ref="planner"
			:start-date="plannerStartDate"
			:initial-scroll-date="plannerFocusDate"
			:weeks="plannerWeeks"
			:min="plannerMin"
			:max="plannerMax"
			:virtual-weeks="yearMode"
			:virtual-week-buffer="2"
			:start-time="'07:00'"
			:end-time="'19:00'"
			:time-step="60"
			:slot-height="62"
			:day-width="208"
			:viewport-height="560"
			show-week-numbers
			clickable
			drag-and-drop
			@day-click="selectTime"
			@day-drop="moveRecord"
			@render-window-change="updateRenderWindow"
		>
			<template #all-day="{ cell, drag, dragAttrs }">
				<article
					v-for="record in allDayRecordsFor(cell.value)"
					:key="record.id"
					v-bind="dragAttrs(dragDataFor(record))"
					class="cursor-grab rounded-md border px-2 py-1 text-[10px] font-semibold shadow-xs active:cursor-grabbing"
					:class="[
						eventToneClass(record),
						drag.source && drag.data?.id === record.id && 'opacity-60 ring-2 ring-ring/40',
					]"
					@click.stop
				>
					{{ record.title }}
				</article>
			</template>

			<template #default="{ cell, drag, dragAttrs, rangeStyle }">
				<article
					v-for="record in timedRecordsFor(cell.value)"
					:key="record.id"
					v-bind="dragAttrs(dragDataFor(record), { sourceTime: record.startTime })"
					class="absolute left-1.5 right-1.5 z-10 cursor-grab overflow-hidden rounded-lg border p-2 text-xs shadow-sm transition hover:z-20 hover:shadow-md active:cursor-grabbing"
					:class="[
						eventToneClass(record),
						drag.source && drag.data?.id === record.id && 'opacity-60 ring-2 ring-ring/40',
					]"
					:style="rangeStyle(record)"
					@click.stop
				>
					<div class="flex items-start justify-between gap-2">
						<h3 class="min-w-0 truncate font-bold">{{ record.title }}</h3>
						<span class="shrink-0 text-[9px] font-semibold uppercase tracking-wide opacity-65">{{ record.status }}</span>
					</div>
					<p class="mt-1 font-semibold tabular-nums">{{ recordTimeLabel(record) }}</p>
					<div class="mt-1 space-y-0.5 text-[10px] leading-4 opacity-75">
						<p class="truncate">{{ record.meta.location }}</p>
						<p class="truncate">{{ record.meta.owner }}</p>
						<p class="line-clamp-2">{{ record.meta.notes }}</p>
					</div>
				</article>
			</template>
		</DomWeekPlanner>
	</div>
</template>
