<script setup>
import { computed } from 'vue';
import DomBadge from '../badge/DomBadge.vue';

defineOptions({
	__doc: {
		name: 'Status pill',
		tag: '<DomStatusPill>',
		description: 'A badge with an optional status dot for live state, severity, and workflow labels.',
		playground: {
			initial: { label: 'Live', tone: 'success', dot: true },
		},
		slots: [
			{ name: '(default)', description: 'Status label.' },
		],
	},
});

const props = defineProps({
	tone: {
		type: String,
		default: 'neutral',
		_edit: {
			options: ['neutral', 'primary', 'success', 'warning', 'danger', 'info'],
			description: 'Semantic status tone.',
		},
	},
	label: {
		type: String,
		default: 'Status',
		_edit: { description: 'Fallback label when no default slot is provided.' },
	},
	size: {
		type: String,
		default: 'md',
		_edit: { options: ['sm', 'md', 'lg'], description: 'Pill density.' },
	},
	variant: {
		type: String,
		default: 'soft',
		_edit: { options: ['soft', 'solid', 'outline'], description: 'Visual weight.' },
	},
	dot: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show a leading state dot.' },
	},
	pulse: {
		type: Boolean,
		default: false,
		_edit: { description: 'Animate the dot for live or active states.' },
	},
});

const dotClasses = computed(() => ({
	neutral: 'bg-muted-fg',
	primary: 'bg-primary',
	success: 'bg-success',
	warning: 'bg-warning',
	danger: 'bg-destructive',
	info: 'bg-primary',
}[props.tone] || 'bg-muted-fg'));
</script>

<template>
	<DomBadge :tone="tone" :size="size" :variant="variant">
		<span
			v-if="dot"
			class="size-1.5 rounded-full"
			:class="[dotClasses, pulse && 'animate-pulse']"
			aria-hidden="true"
		></span>
		<slot>{{ label }}</slot>
	</DomBadge>
</template>
