<script setup>
const props = defineProps({
	tone: {
		type: String,
		default: 'neutral',
	},
});

const toneClasses = {
	success: 'bg-success/10 text-success ring-success/25',
	warning: 'bg-warning/10 text-warning ring-warning/25',
	destructive: 'bg-destructive/10 text-destructive ring-destructive/25',
	primary: 'bg-primary/10 text-primary ring-primary/25',
	neutral: 'bg-secondary text-muted-fg ring-border',
};
</script>

<template>
	<span
		class="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1"
		:class="toneClasses[props.tone] || toneClasses.neutral"
	>
		<span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
		<slot />
	</span>
</template>
