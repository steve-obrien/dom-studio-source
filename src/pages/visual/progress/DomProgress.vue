<script setup>
import { computed } from 'vue';

defineOptions({
	__doc: {
		name: 'Progress',
		tag: '<DomProgress>',
		description: 'An accessible progress bar for uploads, imports, background jobs, and completion meters.',
		icon: 'M5 12h14M5 12a3 3 0 0 1 3-3h8a3 3 0 0 1 0 6H8a3 3 0 0 1-3-3Z',
		playground: {
			initial: { value: 68, showValue: true },
		},
	},
});

const props = defineProps({
	value: {
		type: Number,
		default: null,
		_edit: { description: 'Current progress value. Leave empty for indeterminate progress.' },
	},
	max: {
		type: Number,
		default: 100,
		_edit: { description: 'Maximum progress value.' },
	},
	label: {
		type: String,
		default: 'Progress',
		_edit: { description: 'Accessible progress label.' },
	},
	tone: {
		type: String,
		default: 'primary',
		_edit: {
			options: ['primary', 'success', 'warning', 'danger', 'neutral'],
			description: 'Filled bar tone.',
		},
	},
	size: {
		type: String,
		default: 'md',
		_edit: {
			options: ['sm', 'md', 'lg'],
			description: 'Track height.',
		},
	},
	showValue: {
		type: Boolean,
		default: false,
		_edit: { description: 'Show a percentage label beside the title.' },
	},
	indeterminate: {
		type: Boolean,
		default: false,
		_edit: { description: 'Show an indeterminate loading bar.' },
	},
});

const isIndeterminate = computed(() => props.indeterminate || props.value == null);
const safeMax = computed(() => Math.max(1, Number(props.max) || 100));
const clampedValue = computed(() => {
	const value = Number(props.value);
	if (!Number.isFinite(value)) return 0;
	return Math.min(safeMax.value, Math.max(0, value));
});
const percent = computed(() => Math.round((clampedValue.value / safeMax.value) * 100));
const barStyle = computed(() => ({
	width: isIndeterminate.value ? '40%' : `${percent.value}%`,
}));
const trackClass = computed(() => [
	'w-full overflow-hidden rounded-full bg-secondary',
	{
		sm: 'h-1.5',
		md: 'h-2',
		lg: 'h-3',
	}[props.size] || 'h-2',
]);
const barClass = computed(() => [
	'h-full rounded-full transition-[width] duration-300',
	isIndeterminate.value && 'dom-progress-indeterminate',
	{
		primary: 'bg-primary',
		success: 'bg-success',
		warning: 'bg-warning',
		danger: 'bg-destructive',
		neutral: 'bg-muted-fg',
	}[props.tone] || 'bg-primary',
]);
</script>

<template>
	<div class="w-full">
		<div v-if="label || showValue" class="mb-2 flex items-center justify-between gap-3 text-sm">
			<span class="font-medium text-canvas-fg">{{ label }}</span>
			<span v-if="showValue && !isIndeterminate" class="text-xs font-medium text-muted-fg">{{ percent }}%</span>
		</div>
		<div
			:class="trackClass"
			role="progressbar"
			:aria-label="label"
			:aria-valuemin="0"
			:aria-valuemax="safeMax"
			:aria-valuenow="isIndeterminate ? undefined : clampedValue"
			:aria-valuetext="isIndeterminate ? 'Loading' : `${percent}%`"
		>
			<div :class="barClass" :style="barStyle"></div>
		</div>
	</div>
</template>

<style scoped>
.dom-progress-indeterminate {
	animation: dom-progress-slide 1.35s ease-in-out infinite;
}

@keyframes dom-progress-slide {
	0% {
		transform: translateX(-100%);
	}

	100% {
		transform: translateX(260%);
	}
}
</style>
