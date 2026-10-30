<script setup>
import { computed } from 'vue';
import { DomStatusPill } from '@getdom/studio/vue';

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

/**
 * Normalize legacy destructive tone names to the DomStatusPill tone contract.
 *
 * @returns {string} DOM Studio status tone.
 */
function getResolvedTone() {
	return props.tone === 'destructive' ? 'danger' : props.tone;
}

const resolvedTone = computed(getResolvedTone);
</script>

<template>
	<div class="flex min-w-0 items-start gap-2">
		<DomStatusPill :tone="resolvedTone" size="sm" :dot="false">{{ value }}</DomStatusPill>
		<span class="min-w-0">
			<span class="block text-xs font-semibold text-canvas-fg">{{ label }}</span>
			<span v-if="description" class="mt-0.5 block text-xs leading-5 text-muted-fg">{{ description }}</span>
		</span>
	</div>
</template>
