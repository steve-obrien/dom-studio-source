<script setup>
import { computed } from 'vue';
import { DomBadge, DomStatusPill } from '../../../../../lib/vue';

const props = defineProps({
	number: {
		type: [Number, String],
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	status: {
		type: String,
		default: 'pending',
	},
});

const statusPresentation = computed(getStatusPresentation);

/**
 * Resolve the compact label and tone used for a setup stage.
 *
 * @returns {{ label: string, tone: string }} Stage presentation metadata.
 */
function getStatusPresentation() {
	return {
		complete: { label: 'Complete', tone: 'success' },
		current: { label: 'In progress', tone: 'info' },
		attention: { label: 'Review', tone: 'warning' },
		pending: { label: 'Pending', tone: 'neutral' },
	}[props.status] || { label: 'Pending', tone: 'neutral' };
}
</script>

<template>
	<span class="flex min-w-0 items-center gap-2">
		<DomBadge tone="neutral" variant="outline" size="sm">{{ number }}</DomBadge>
		<span class="truncate">{{ title }}</span>
		<span class="hidden lg:inline">
			<DomStatusPill
				:tone="statusPresentation.tone"
				:label="statusPresentation.label"
				size="sm"
			/>
		</span>
	</span>
</template>
