<script setup>
import { computed, useId } from 'vue';
import { DomButton, DomStatusPill } from '@getdom/studio/vue';

const props = defineProps({
	title: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	status: {
		type: String,
		default: '',
	},
	statusTone: {
		type: String,
		default: 'neutral',
	},
	actionLabel: {
		type: String,
		required: true,
	},
	destructive: {
		type: Boolean,
		default: false,
	},
});

defineEmits(['action']);

const titleId = useId();

/**
 * Normalize legacy destructive tone names to the DomStatusPill tone contract.
 *
 * @returns {string} DOM Studio status tone.
 */
function getResolvedStatusTone() {
	return props.statusTone === 'destructive' ? 'danger' : props.statusTone;
}

const resolvedStatusTone = computed(getResolvedStatusTone);
</script>

<template>
	<article class="grid gap-4 border-b border-border py-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" :aria-labelledby="titleId">
		<div class="min-w-0">
			<div class="flex flex-wrap items-center gap-2">
				<h5 :id="titleId" class="font-semibold text-canvas-fg">{{ title }}</h5>
				<DomStatusPill v-if="status" :tone="resolvedStatusTone" size="sm">{{ status }}</DomStatusPill>
			</div>
			<p class="mt-1 text-sm leading-6 text-muted-fg">{{ description }}</p>
		</div>
		<DomButton
			size="sm"
			:variant="destructive ? 'danger' : 'secondary'"
			@click="$emit('action')"
		>
			{{ actionLabel }}
		</DomButton>
	</article>
</template>
