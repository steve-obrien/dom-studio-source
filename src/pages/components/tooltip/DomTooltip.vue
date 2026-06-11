<script setup>
import { onMounted, ref } from 'vue';

defineProps({
	text: {
		type: String,
		required: true,
		_edit: { description: 'Tooltip body. Keep it short — one line works best.' },
	},
	placement: {
		type: String,
		default: 'top',
		_edit: {
			options: ['top', 'bottom', 'left', 'right'],
			description: 'Position of the bubble relative to the trigger.',
		},
	},
	delay: {
		type: Number,
		default: 120,
		_edit: { description: 'Open delay in milliseconds — stops flicker when sweeping the cursor across.' },
	},
	offset: {
		type: Number,
		default: 6,
		_edit: { description: 'Gap in pixels between the trigger and tooltip.' },
	},
	collisionPadding: {
		type: Number,
		default: 8,
		_edit: { description: 'Viewport padding used when the tooltip flips or shifts.' },
	},
	floatingMode: {
		type: String,
		default: 'viewport',
		_edit: { options: ['viewport', 'anchor'], description: 'viewport keeps the tooltip inside the browser; anchor keeps it attached while scrolling.' },
	},
});

const root = ref(null);
onMounted(async () => { await import('../../lib/headless/tooltip.js'); });
</script>

<template>
	<dom-tooltip
		ref="root"
		:text="text"
		:placement="placement"
		:delay="delay"
		:offset="offset"
		:collision-padding="collisionPadding"
		:floating-mode="floatingMode"
	>
		<slot />
	</dom-tooltip>
</template>
