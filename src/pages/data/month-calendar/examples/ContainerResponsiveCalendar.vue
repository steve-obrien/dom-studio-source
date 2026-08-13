<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomMonthCalendar } from '../../../lib/vue';

const sidebarOpen = ref(false);
const schedule = [
	{ id: 'planning', date: '2026-08-04', label: 'Planning review' },
	{ id: 'release', date: '2026-08-12', label: 'Release window' },
	{ id: 'retro', date: '2026-08-21', label: 'Team retro' },
];

/** Schedule records keyed by the date strings exposed by DomMonthCalendar cells. */
const scheduleByDate = computed(() => Object.fromEntries(schedule.map((item) => [item.date, item])));

/**
 * Returns the schedule record rendered inside a calendar day.
 *
 * @param {string} value Calendar date key in YYYY-MM-DD format.
 * @returns {{ id: string, date: string, label: string }|undefined} Matching schedule record when present.
 */
function scheduleFor(value) {
	return scheduleByDate.value[value];
}
</script>

<template>
	<div class="w-[64rem] max-w-full space-y-4" data-testid="container-responsive-calendar-example">
		<div class="flex items-center justify-between gap-4">
			<div>
				<p class="font-semibold text-canvas-fg">Application workspace</p>
				<p class="text-sm text-muted-fg">The calendar responds to its content area, not the browser viewport.</p>
			</div>
			<DomButton
				variant="secondary"
				@click="sidebarOpen = !sidebarOpen"
			>
				{{ sidebarOpen ? 'Close sidebar' : 'Open sidebar' }}
			</DomButton>
		</div>

		<div class="flex items-start gap-4">
			<aside
				v-if="sidebarOpen"
				class="hidden w-72 shrink-0 rounded-xl border border-border bg-secondary/35 p-4 md:block"
			>
				<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Workspace sidebar</p>
				<nav class="mt-3 space-y-2 text-sm font-medium text-canvas-fg" aria-label="Example workspace">
					<div class="rounded-lg bg-canvas px-3 py-2 shadow-xs">Calendar</div>
					<div class="px-3 py-2 text-muted-fg">Projects</div>
					<div class="px-3 py-2 text-muted-fg">People</div>
				</nav>
			</aside>

			<main class="min-w-0 flex-1">
				<DomMonthCalendar
					start-date="2026-08-01"
					:months="1"
				>
					<template #default="{ cell }">
						<div
							v-if="cell.currentMonth && scheduleFor(cell.value)"
							class="rounded-lg border border-primary/20 bg-primary/10 px-2 py-1.5 text-xs font-semibold text-primary"
						>
							{{ scheduleFor(cell.value).label }}
						</div>
					</template>
				</DomMonthCalendar>
			</main>
		</div>
	</div>
</template>
