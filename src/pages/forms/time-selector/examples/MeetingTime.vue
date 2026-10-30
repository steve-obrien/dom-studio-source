<script setup>
import { ref } from 'vue';
import { DomTimeSelector } from '../../../lib/vue';

const time = ref('09:30');
</script>

<template>
	<div class="max-w-sm space-y-4">
		<DomTimeSelector
			v-model="time"
			name="meeting_time"
			label="Meeting time"
			description="Type a time or choose one from the generated list."
			:min="'08:00'"
			:max="'18:00'"
			:minute-step="15"
		/>

		<p class="rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-muted-fg">
			Stored value:
			<code class="font-mono text-canvas-fg">{{ time || 'empty' }}</code>
		</p>
	</div>
</template>
