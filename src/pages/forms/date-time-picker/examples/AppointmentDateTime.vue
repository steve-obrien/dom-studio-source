<script setup>
import { ref } from 'vue';
import { DomDateTimePicker } from '../../../lib/vue';

const dateTime = ref('2026-06-18T09:30');
</script>

<template>
	<div class="max-w-sm space-y-4">
		<DomDateTimePicker
			v-model="dateTime"
			name="appointment_at"
			label="Appointment"
			description="Type a date and time or choose both from the popover."
			date-format="dd/mm/yyyy"
			:minute-step="15"
			min="2026-06-01T08:00"
			max="2026-06-30T18:00"
			:calendar-props="{ min: '2026-06-01', max: '2026-06-30' }"
		/>

		<p class="rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-muted-fg">
			Stored value:
			<code class="font-mono text-canvas-fg">{{ dateTime || 'empty' }}</code>
		</p>
	</div>
</template>
