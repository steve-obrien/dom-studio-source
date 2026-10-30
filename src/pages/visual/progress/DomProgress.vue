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
	showLabel: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the label above the bar. The label remains accessible when visually hidden.' },
	},
	indeterminate: {
		type: Boolean,
		default: false,
		_edit: { description: 'Show a sweeping loading bar when the total is unknown.' },
	},
});

const isIndeterminate = computed(getIsIndeterminate);
const safeMax = computed(getSafeMax);
const clampedValue = computed(getClampedValue);
const percent = computed(getPercent);
const barStyle = computed(getBarStyle);
const trackClass = computed(getTrackClass);
const barClass = computed(getBarClass);

/**
 * Resolves whether progress should use the unknown-total presentation.
 *
 * @returns {boolean} Whether progress is indeterminate.
 */
function getIsIndeterminate() {
	return props.indeterminate || props.value == null;
}

/**
 * Resolves the maximum progress value while avoiding division by zero.
 *
 * @returns {number} Safe maximum value.
 */
function getSafeMax() {
	return Math.max(1, Number(props.max) || 100);
}

/**
 * Resolves the current progress value inside the allowed range.
 *
 * @returns {number} Clamped progress value.
 */
function getClampedValue() {
	const value = Number(props.value);
	if (!Number.isFinite(value)) return 0;
	return Math.min(safeMax.value, Math.max(0, value));
}

/**
 * Converts progress into a percentage.
 *
 * @returns {number} Rounded progress percentage.
 */
function getPercent() {
	return Math.round((clampedValue.value / safeMax.value) * 100);
}

/**
 * Builds the width and highlight treatment for the active progress bar.
 *
 * @returns {Record<string, string|undefined>} Inline bar style.
 */
function getBarStyle() {
	return {
		width: isIndeterminate.value ? '30%' : `${percent.value}%`,
		backgroundImage: isIndeterminate.value
			? 'linear-gradient(90deg, transparent, currentColor, transparent)'
			: undefined,
	};
}

/**
 * Builds the track class list for the selected size.
 *
 * @returns {Array<string>} Vue class list.
 */
function getTrackClass() {
	return [
		'w-full overflow-hidden rounded-full bg-secondary',
		{
			sm: 'h-1.5',
			md: 'h-2',
			lg: 'h-3',
		}[props.size] || 'h-2',
	];
}

/**
 * Builds the active bar class list for determinate or indeterminate progress.
 *
 * @returns {Array<string|boolean>} Vue class list.
 */
function getBarClass() {
	const toneClasses = isIndeterminate.value
		? {
			primary: 'text-primary',
			success: 'text-success',
			warning: 'text-warning',
			danger: 'text-destructive',
			neutral: 'text-muted-fg',
		}
		: {
			primary: 'bg-primary',
			success: 'bg-success',
			warning: 'bg-warning',
			danger: 'bg-destructive',
			neutral: 'bg-muted-fg',
		};

	return [
		'h-full rounded-full transition-[width] duration-300',
		isIndeterminate.value && 'dom-progress-indeterminate',
		toneClasses[props.tone] || toneClasses.primary,
	];
}
</script>

<template>
	<div class="w-full">
		<div v-if="(showLabel && label) || showValue" class="mb-2 flex items-center justify-between gap-3 text-sm">
			<span v-if="showLabel && label" class="font-medium text-canvas-fg">{{ label }}</span>
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
		transform: translateX(320%);
	}
}

@media (prefers-reduced-motion: reduce) {
	.dom-progress-indeterminate {
		animation: none;
		transform: translateX(115%);
	}
}
</style>
