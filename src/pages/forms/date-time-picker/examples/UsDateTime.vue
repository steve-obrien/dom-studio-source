<script setup>
import { ref } from 'vue';
import { DomDateTimePicker } from '../../../lib/vue';

const dateTime = ref('2026-11-24T14:30');
</script>

<template>
	<div class="max-w-sm space-y-4">
		<DomDateTimePicker
			v-model="dateTime"
			name="delivery_at"
			label="Delivery window"
			description="Use US date parsing and 12-hour time labels."
			date-format="mm/dd/yyyy"
			time-format="12h"
			:minute-step="30"
			:calendar-props="{ locale: 'en-US', weekStartsOn: 0 }"
		/>

		<p class="rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-muted-fg">
			Stored value:
			<code class="font-mono text-canvas-fg">{{ dateTime || 'empty' }}</code>
		</p>
	</div>
</template>
