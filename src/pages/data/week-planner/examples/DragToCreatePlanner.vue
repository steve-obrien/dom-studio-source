<script setup>
import { computed, ref } from 'vue';
import {
	DomButton,
	DomDialog,
	DomStatusPill,
	DomTextInput,
	DomWeekPlanner,
} from '../../../lib/vue';

let nextEventNumber = 1;
const lastAction = ref('Drag across an empty time lane to create a draft event.');
const dialogOpen = ref(false);
const eventName = ref('');
const pendingSelection = ref(null);
const records = ref([
	{
		id: 'evt_planning',
		date: '2026-07-27',
		title: 'Weekly planning',
		startTime: '09:00',
		endTime: '10:00',
		status: 'confirmed',
		local: false,
	},
	{
		id: 'evt_review',
		date: '2026-07-29',
		title: 'Project review',
		startTime: '13:30',
		endTime: '15:00',
		status: 'confirmed',
		local: false,
	},
]);

const recordsByDate = computed(groupRecordsByDate);
const localEventCount = computed(() => records.value.filter((record) => record.local).length);
const pendingRangeLabel = computed(formatPendingRangeLabel);

/**
 * Groups the app-owned calendar records by their local date key.
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
 * Lists records for one planner day in start-time order.
 *
 * @param {string} date YYYY-MM-DD date key.
 * @returns {Array<Record<string, unknown>>} Timed records for the day.
 */
function recordsFor(date) {
	return (recordsByDate.value[date] || [])
		.slice()
		.sort((left, right) => left.startTime.localeCompare(right.startTime));
}

/**
 * Opens the event editor for a newly selected planner range.
 *
 * @param {{ value: string, startTime: string, endTime: string }} selection Completed planner selection.
 * @returns {void}
 */
function openEventDialog(selection) {
	pendingSelection.value = selection;
	eventName.value = '';
	dialogOpen.value = true;
	lastAction.value = `Selected ${selection.value}, ${selection.startTime}–${selection.endTime}. Add an event name to continue.`;
}

/**
 * Adds the named event to local application state.
 *
 * Replace the local assignment with an optimistic update plus a POST to the
 * application's calendar endpoint when persistence is required.
 *
 * @returns {void}
 */
function createEvent() {
	const selection = pendingSelection.value;
	const name = eventName.value.trim();
	if (!selection || !name) return;

	const event = {
		id: `local-${nextEventNumber}`,
		date: selection.value,
		title: name,
		startTime: selection.startTime,
		endTime: selection.endTime,
		status: 'draft',
		local: true,
	};
	nextEventNumber += 1;
	records.value = [...records.value, event];
	lastAction.value = `Created “${event.title}” on ${event.date}, ${event.startTime}–${event.endTime}.`;
	dialogOpen.value = false;

	// A production app can POST `event` here and replace its temporary id.
}

/**
 * Cancels the pending event without changing local calendar state.
 *
 * @returns {void}
 */
function cancelEventDialog() {
	dialogOpen.value = false;
	lastAction.value = 'Event creation cancelled. Drag across a time lane to try again.';
}

/**
 * Clears retained dialog fields after its close transition completes.
 *
 * @returns {void}
 */
function resetEventDraft() {
	pendingSelection.value = null;
	eventName.value = '';
}

/**
 * Formats the selected date and time range for the dialog description.
 *
 * @returns {string} Human-readable pending selection.
 */
function formatPendingRangeLabel() {
	const selection = pendingSelection.value;
	if (!selection) return 'Name the event before adding it to local state.';
	return `${selection.cell.label}, ${selection.startTime}–${selection.endTime}`;
}

/**
 * Resolves theme-aware classes for a calendar record.
 *
 * @param {Record<string, unknown>} record Calendar record.
 * @returns {string} Event card classes.
 */
function eventClass(record) {
	if (record.local) return 'border-primary/50 bg-primary/15 text-canvas-fg ring-1 ring-primary/15';
	return 'border-border bg-secondary text-canvas-fg';
}

/**
 * Formats a compact record time range.
 *
 * @param {Record<string, unknown>} record Calendar record.
 * @returns {string} HH:mm time range.
 */
function recordTimeLabel(record) {
	return `${record.startTime}–${record.endTime}`;
}
</script>

<template>
	<div class="w-full min-w-0 space-y-4" data-testid="drag-to-create-week-planner">
		<div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/25 px-4 py-3">
			<div>
				<p class="text-sm font-semibold text-canvas-fg">Drag to create</p>
				<p class="mt-0.5 text-xs text-muted-fg">{{ lastAction }}</p>
			</div>
			<DomStatusPill tone="info" data-testid="local-event-count">
				{{ localEventCount }} local {{ localEventCount === 1 ? 'event' : 'events' }}
			</DomStatusPill>
		</div>

		<DomWeekPlanner
			start-date="2026-07-27"
			:weeks="2"
			start-time="08:00"
			end-time="18:00"
			:time-step="30"
			:selection-step="5"
			:slot-height="34"
			:day-width="200"
			:viewport-height="520"
			range-selection
			@time-range-select="openEventDialog"
		>
			<template #default="{ cell, rangeStyle }">
				<article
					v-for="record in recordsFor(cell.value)"
					:key="record.id"
					class="absolute left-1.5 right-1.5 z-10 overflow-hidden rounded-lg border p-2 text-xs shadow-sm"
					:class="eventClass(record)"
					:style="rangeStyle(record)"
					:data-local-created-event="record.local ? '' : undefined"
					data-week-planner-ignore-selection
					@pointerdown.stop
				>
					<div class="flex items-start justify-between gap-2">
						<h3 class="min-w-0 truncate font-bold">{{ record.title }}</h3>
						<span class="shrink-0 text-[9px] font-semibold uppercase tracking-wide opacity-65">{{ record.status }}</span>
					</div>
					<p class="mt-1 font-semibold tabular-nums">{{ recordTimeLabel(record) }}</p>
				</article>
			</template>
		</DomWeekPlanner>

		<DomDialog
			v-model="dialogOpen"
			title="Add event"
			:description="pendingRangeLabel"
			size="sm"
			@close-complete="resetEventDraft"
		>
			<form id="drag-create-event-form" @submit.prevent="createEvent">
				<DomTextInput
					v-model="eventName"
					name="eventName"
					label="Event name"
					placeholder="Customer planning call"
					autocomplete="off"
					required
					autofocus
				/>
			</form>

			<template #footer>
				<DomButton type="button" variant="secondary" @click="cancelEventDialog">Cancel</DomButton>
				<DomButton
					type="submit"
					form="drag-create-event-form"
					:disabled="!eventName.trim()"
				>
					Add event
				</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
