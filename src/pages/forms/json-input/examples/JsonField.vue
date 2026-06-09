<script setup>
import { ref } from 'vue';
import { DomJsonInput } from '../../../lib/vue';

const value = ref({
	name: 'DOM Studio',
	plan: 'Pro',
	flags: {
		studio: true,
		ai: true,
	},
});
</script>

<template>
	<div class="w-full max-w-2xl space-y-4">
		<DomJsonInput
			v-model="value"
			label="Feature config"
			description="Valid JSON emits parsed data. Invalid JSON is held locally until fixed."
			:rows="10"
		/>
		<pre class="overflow-auto rounded-xl border border-border bg-secondary/50 p-3 text-xs text-muted-fg">{{ value }}</pre>
	</div>
</template>
