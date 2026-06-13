<script setup>
defineProps({
	label: {
		type: String,
		required: true,
	},
	value: {
		type: [String, Number],
		required: true,
	},
	detail: {
		type: String,
		default: '',
	},
	tone: {
		type: String,
		default: 'neutral',
	},
});

const toneClasses = {
	neutral: 'border-border bg-canvas',
	success: 'border-success/25 bg-success/10',
	warning: 'border-warning/35 bg-warning/10',
	danger: 'border-destructive/25 bg-destructive/10',
	info: 'border-primary/20 bg-primary/10',
};
</script>

<template>
	<div class="rounded-2xl border p-3" :class="toneClasses[tone] || toneClasses.neutral">
		<p class="text-[11px] font-medium uppercase tracking-wide text-muted-fg">{{ label }}</p>
		<p class="mt-1 text-xl font-semibold text-canvas-fg">{{ value }}</p>
		<p v-if="detail" class="mt-1 text-xs leading-5 text-muted-fg">{{ detail }}</p>
	</div>
</template>
