<script setup>
defineProps({
	tone: {
		type: String,
		default: 'neutral',
	},
	label: {
		type: String,
		required: true,
	},
});
</script>

<template>
	<span
		class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
		:class="{
			'border-border bg-secondary text-muted-fg': tone === 'neutral',
			'border-success/30 bg-success/10 text-success': tone === 'success',
			'border-warning/30 bg-warning/10 text-warning': tone === 'warning',
			'border-destructive/30 bg-destructive/10 text-destructive': tone === 'danger',
			'border-primary/30 bg-primary/10 text-primary': tone === 'primary',
		}"
	>
		<span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
		{{ label }}
	</span>
</template>
