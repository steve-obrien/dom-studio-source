<script setup>
import { ref } from 'vue';
import { DomTimeSelector } from '../../../lib/vue';

const time = ref('14:30');
</script>

<template>
	<div class="max-w-sm space-y-4">
		<DomTimeSelector
			v-model="time"
			name="handoff_time"
			label="Handoff time"
			description="Display options in 12-hour time while storing HH:mm."
			time-format="12h"
			:min="'09:00'"
			:max="'17:00'"
			:minute-step="30"
		/>

		<p class="rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-muted-fg">
			Stored value:
			<code class="font-mono text-canvas-fg">{{ time || 'empty' }}</code>
		</p>
	</div>
</template>
