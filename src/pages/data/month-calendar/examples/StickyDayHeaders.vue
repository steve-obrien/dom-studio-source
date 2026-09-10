<script setup>
import { ref } from 'vue';
import { DomMonthCalendar, DomToggle } from '../../../lib/vue';

const stickyDayHeaders = ref(true);
const stickyMonthHeaders = ref(true);
const showDayNames = ref(false);
const circleToday = ref(true);
const continuous = ref(false);
</script>

<template>
	<div class="w-[78rem] max-w-full space-y-4" data-testid="sticky-day-headers-example">
		<div class="flex flex-wrap gap-x-6 gap-y-3">
			<DomToggle v-model="stickyDayHeaders" label="Sticky weekday headers" />
			<DomToggle v-model="stickyMonthHeaders" label="Sticky month titles" />
			<DomToggle v-model="showDayNames" label="Weekday names in cells" />
			<DomToggle v-model="circleToday" label="Circle around today" />
			<DomToggle v-model="continuous" label="Continuous calendar" />
		</div>
		<p class="text-sm text-muted-fg">Scroll the schedule to keep the headers in view. Today has a coloured date circle.</p>
		<div class="max-h-[36rem] overflow-auto overscroll-contain rounded-2xl border border-border px-4 pb-4" data-testid="sticky-calendar-scrollport">
			<DomMonthCalendar
				:months="3"
				:sticky-day-headers="stickyDayHeaders"
				:sticky-month-headers="stickyMonthHeaders"
				:show-day-names="showDayNames"
				:today-indicator="circleToday ? 'circle' : 'cell'"
				today-date-class="bg-destructive text-destructive-fg"
				:continuous="continuous"
				:contained-continuous-scroll="false"
			>
				<template #month-header>
					<span>Team schedule</span>
				</template>
				<template #default="{ cell }">
					<div v-if="cell.currentMonth && cell.today" class="rounded-lg border border-primary/20 bg-primary/10 px-2 py-2 text-xs font-semibold text-primary">
						Planning review
					</div>
					<div v-else-if="cell.currentMonth && cell.day % 7 === 0" class="rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs font-medium text-canvas-fg">
						Team check-in
					</div>
				</template>
			</DomMonthCalendar>
		</div>
	</div>
</template>
