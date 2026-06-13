<script setup>
import { computed } from 'vue';

const props = defineProps({
	label: {
		type: String,
		required: true,
	},
	value: {
		type: [String, Number],
		required: true,
	},
	description: {
		type: String,
		default: '',
	},
	tone: {
		type: String,
		default: 'neutral',
	},
});

const toneClass = computed(() => ({
	neutral: 'border-border bg-secondary text-canvas-fg',
	success: 'border-success/30 bg-success/10 text-success',
	warning: 'border-warning/30 bg-warning/10 text-warning',
	destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
}[props.tone] || 'border-border bg-secondary text-canvas-fg'));
</script>

<template>
	<div class="border-l-4 px-4 py-3" :class="toneClass">
		<p class="text-xs font-medium text-muted-fg">{{ label }}</p>
		<p class="mt-1 text-2xl font-semibold">{{ value }}</p>
		<p v-if="description" class="mt-1 text-xs leading-5 text-muted-fg">{{ description }}</p>
	</div>
</template>
