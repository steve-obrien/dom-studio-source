<script setup>
import { ref } from 'vue';
import { DomButton, DomMonthCalendar } from '../../../lib/vue';

const continuous = ref(false);
const weekNumbers = ref(false);
const bottomBorder = ref(false);
const events = {
	'2026-06-01': 'Planning review',
	'2026-06-07': 'Release window',
	'2026-06-08': 'Design review',
};
</script>

<template>
	<div class="w-full space-y-4">
		<div class="flex flex-wrap gap-2">
			<DomButton variant="secondary" :aria-pressed="continuous" @click="continuous = !continuous">Continuous: {{ continuous ? 'on' : 'off' }}</DomButton>
			<DomButton variant="secondary" :aria-pressed="weekNumbers" @click="weekNumbers = !weekNumbers">Week numbers: {{ weekNumbers ? 'on' : 'off' }}</DomButton>
			<DomButton variant="secondary" :aria-pressed="bottomBorder" @click="bottomBorder = !bottomBorder">Bottom border: {{ bottomBorder ? 'on' : 'off' }}</DomButton>
		</div>
		<div class="overflow-clip rounded-xl border border-border bg-canvas" data-testid="flush-calendar-frame">
			<header class="px-4 py-5 sm:px-6">
				<h3 class="font-semibold text-canvas-fg">Team schedule</h3>
				<p class="text-sm text-muted-fg">The frame and calendar share their outer edges and content gutter.</p>
			</header>
			<DomMonthCalendar
				layout="flush"
				gutter-class="px-4 sm:px-6"
				:bottom-border="bottomBorder"
				:continuous="continuous"
				:show-week-numbers="weekNumbers"
				:contained-continuous-scroll="false"
				start-date="2026-06-01"
				:months="1"
				:show-day-names="false"
			>
				<template #default="{ cell }">
					<div v-if="events[cell.value]" class="rounded-md border border-primary/20 bg-primary/10 p-2 text-xs font-medium text-primary" data-calendar-event>
						{{ events[cell.value] }}
					</div>
				</template>
			</DomMonthCalendar>
		</div>
	</div>
</template>
