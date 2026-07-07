<script setup>
import { computed, ref } from 'vue';
import { DomMonthCalendar } from '../../../lib/vue';

const milestones = ref([
	{ id: 'cutover-rehearsal', date: '2026-06-02', label: 'Cutover rehearsal', team: 'Platform', status: 'ready' },
	{ id: 'partner-qa-window', date: '2026-06-08', label: 'Partner QA window', team: 'Integrations', status: 'watch' },
	{ id: 'billing-dry-run', date: '2026-06-17', label: 'Billing dry run', team: 'Revenue', status: 'ready' },
	{ id: 'release-candidate', date: '2026-06-25', label: 'Release candidate', team: 'Product', status: 'critical' },
	{ id: 'eu-launch', date: '2026-07-01', label: 'EU launch', team: 'Launch', status: 'critical' },
	{ id: 'support-review', date: '2026-07-09', label: 'Support review', team: 'Success', status: 'watch' },
	{ id: 'adoption-readout', date: '2026-07-20', label: 'Adoption readout', team: 'Growth', status: 'ready' },
	{ id: 'scale-test', date: '2026-08-04', label: 'Scale test', team: 'Infrastructure', status: 'watch' },
	{ id: 'renewal-campaign', date: '2026-08-18', label: 'Renewal campaign', team: 'Revenue', status: 'ready' },
	{ id: 'regional-enablement', date: '2026-09-03', label: 'Regional enablement', team: 'Sales', status: 'ready' },
	{ id: 'reliability-review', date: '2026-10-07', label: 'Reliability review', team: 'Infrastructure', status: 'watch' },
	{ id: 'expansion-decision', date: '2026-11-12', label: 'Expansion decision', team: 'Leadership', status: 'critical' },
]);

const milestonesByDate = computed(() => groupMilestonesByDate(milestones.value));
const activeDates = computed(() => Object.keys(milestonesByDate.value).length);

/**
 * Groups milestone records by their date key.
 *
 * @param {Array<{ date: string }>} records Milestones to group for calendar lookup.
 * @returns {Record<string, Array<object>>} Milestones keyed by YYYY-MM-DD.
 */
function groupMilestonesByDate(records) {
	return records.reduce((groups, record) => {
		groups[record.date] = [...(groups[record.date] || []), record];
		return groups;
	}, {});
}

/**
 * Returns all milestones assigned to a rendered day.
 *
 * @param {string} value YYYY-MM-DD date key from the calendar cell.
 * @returns {Array<object>} Milestones for the requested date.
 */
function milestonesFor(value) {
	return milestonesByDate.value[value] || [];
}

/**
 * Creates the app-owned payload attached to a draggable milestone card.
 *
 * @param {{ id: string }} milestone Milestone being dragged.
 * @returns {{ id: string }} Minimal payload needed to move the milestone.
 */
function dragDataFor(milestone) {
	return { id: milestone.id };
}

/**
 * Moves a milestone to the date that received the drop gesture.
 *
 * @param {{ data?: { id?: string }, targetValue?: string }} payload Calendar drag/drop payload.
 * @returns {void}
 */
function moveMilestone(payload) {
	const milestoneId = payload.data?.id;
	const targetDate = payload.targetValue;
	if (!milestoneId || !targetDate) return;
	milestones.value = milestones.value.map((milestone) => {
		if (milestone.id !== milestoneId) return milestone;
		return {
			...milestone,
			date: targetDate,
		};
	});
}

/**
 * Highlights days that contain operational milestones.
 *
 * @param {import('../../../lib/vue').MonthCalendarCell} cell Rendered calendar cell.
 * @returns {string} Vue class binding for the day cell.
 */
function dayClass(cell) {
	if (!milestonesFor(cell.value).length) return '';
	return 'bg-primary/5';
}

/**
 * Resolves visual treatment for a milestone status.
 *
 * @param {{ status: string }} milestone Milestone record rendered inside a day.
 * @returns {string} Semantic status classes.
 */
function milestoneClass(milestone) {
	return {
		ready: 'border-success/20 bg-success/10 text-success',
		watch: 'border-warning/30 bg-warning/15 text-warning-fg',
		critical: 'border-destructive/20 bg-destructive/10 text-destructive',
	}[milestone.status] || 'border-border bg-secondary/45 text-canvas-fg';
}
</script>

<template>
	<div class="w-[78rem] max-w-full space-y-4" data-testid="continuous-operations-calendar-example">
		<section class="grid gap-3 rounded-lg border border-border bg-secondary/25 p-4 text-sm md:grid-cols-3">
			<div>
				<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Range</p>
				<p class="mt-1 font-bold text-canvas-fg">June-November 2026</p>
			</div>
			<div>
				<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Milestones</p>
				<p class="mt-1 font-bold text-canvas-fg">{{ milestones.length }} across {{ activeDates }} days</p>
			</div>
			<div>
				<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Owner</p>
				<p class="mt-1 font-bold text-canvas-fg">Launch operations</p>
			</div>
		</section>

		<DomMonthCalendar
			start-date="2026-06-01"
			:months="6"
			:day-class="dayClass"
			drag-and-drop
			continuous
			@day-drop="moveMilestone"
		>
			<template #month-header>
				<span>Continuous launch runway</span>
			</template>

			<template #default="{ cell, drag, dragAttrs }">
				<div v-if="milestonesFor(cell.value).length" class="space-y-2">
					<article
						v-for="milestone in milestonesFor(cell.value)"
						:key="milestone.id"
						v-bind="dragAttrs(dragDataFor(milestone))"
						class="cursor-grab rounded-lg border px-2.5 py-2 text-xs font-semibold leading-4 shadow-xs active:cursor-grabbing"
						:class="[
							milestoneClass(milestone),
							drag.source && drag.data?.id === milestone.id && 'opacity-60',
						]"
					>
						<div>{{ milestone.label }}</div>
						<div class="mt-1 font-medium opacity-75">{{ milestone.team }}</div>
					</article>
				</div>
			</template>
		</DomMonthCalendar>
	</div>
</template>
