<script setup>
defineProps({
	icon: {
		type: String,
		required: true,
	},
	label: {
		type: String,
		required: true,
	},
});
</script>

<template>
	<button type="button" class="icon-button" :aria-label="label" :title="label">
		<svg v-if="icon === 'duplicate'" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path d="M8 8h10v10H8V8Z" stroke="currentColor" stroke-width="1.8" />
			<path d="M6 16H4V4h12v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
		<svg v-else-if="icon === 'eye'" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="1.8" />
		</svg>
		<svg v-else-if="icon === 'eye-off'" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path d="M3 3l18 18M10.6 10.6A3 3 0 0 0 13.4 13.4M7.1 7.8C4.1 9.4 2.5 12 2.5 12s3.5 6 9.5 6c1.6 0 3-.4 4.2-1M19.1 15.1c1.6-1.4 2.4-3.1 2.4-3.1s-3.5-6-9.5-6c-.8 0-1.6.1-2.3.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
		<svg v-else-if="icon === 'remove'" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
		</svg>
		<svg v-else-if="icon === 'plus'" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
		</svg>
		<svg v-else-if="icon === 'minus'" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path d="M5 12h14" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
		</svg>
	</button>
</template>

<style scoped>
.icon-button {
	display: inline-flex;
	width: 1.75rem;
	height: 1.75rem;
	align-items: center;
	justify-content: center;
	border-radius: 0.375rem;
	color: var(--muted-fg);
	font-size: 0.875rem;
	line-height: 1;
	transition: background-color 140ms ease, color 140ms ease;
}

.icon-button svg {
	width: 1rem;
	height: 1rem;
}

.icon-button:hover {
	background: var(--secondary);
	color: var(--secondary-fg);
}
</style>
