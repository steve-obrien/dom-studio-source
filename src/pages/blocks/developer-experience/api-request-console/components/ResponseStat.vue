<script setup>
defineProps({
	label: {
		type: String,
		required: true,
	},
	value: {
		type: String,
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
	neutral: 'border-border bg-canvas text-canvas-fg',
	success: 'border-success/25 bg-success/10 text-success',
	warning: 'border-warning/30 bg-warning/15 text-warning-fg',
	danger: 'border-destructive/25 bg-destructive/10 text-destructive',
	info: 'border-primary/25 bg-primary/10 text-primary',
};
</script>

<template>
	<div class="rounded-xl border p-3" :class="toneClasses[tone] || toneClasses.neutral">
		<p class="text-[11px] font-medium uppercase opacity-75">{{ label }}</p>
		<p class="mt-2 text-lg font-semibold">{{ value }}</p>
		<p v-if="detail" class="mt-1 text-xs opacity-75">{{ detail }}</p>
	</div>
</template>
