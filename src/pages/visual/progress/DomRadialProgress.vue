<script setup>
import { computed } from 'vue';

defineOptions({
	__doc: {
		name: 'Radial progress',
		tag: '<DomRadialProgress>',
		description: 'A compact circular progress meter for uploads, media processing, sync status, and inline background jobs.',
		icon: 'M12 3a9 9 0 1 1-6.36 2.64M12 3v5m0-5a9 9 0 0 1 9 9',
		playground: {
			initial: { value: 64, showValue: true, tone: 'success' },
		},
	},
});

const props = defineProps({
	value: {
		type: Number,
		default: null,
		_edit: { description: 'Current progress value. Leave empty for an empty meter.' },
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
			description: 'Progress stroke tone.',
		},
	},
	size: {
		type: [String, Number],
		default: 'md',
		_edit: {
			options: ['sm', 'md', 'lg'],
			description: 'Rendered diameter. Use a preset or a pixel number.',
		},
	},
	showValue: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the percentage inside the circle.' },
	},
});

const safeMax = computed(getSafeMax);
const clampedValue = computed(getClampedValue);
const percent = computed(getPercent);
const rootClass = computed(getRootClass);
const rootStyle = computed(getRootStyle);
const strokeClass = computed(getStrokeClass);
const strokeStyle = computed(getStrokeStyle);

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
 * Builds the root class list for the selected size preset.
 *
 * @returns {Array<string>} Vue class list.
 */
function getRootClass() {
	if (typeof props.size === 'number') return ['relative inline-grid place-items-center'];
	return [
		'relative inline-grid place-items-center',
		{
			sm: 'size-10 text-[0.625rem]',
			md: 'size-14 text-xs',
			lg: 'size-20 text-sm',
		}[props.size] || 'size-14 text-xs',
	];
}

/**
 * Builds inline dimensions when the size prop is numeric.
 *
 * @returns {Record<string, string>|undefined} Inline style object.
 */
function getRootStyle() {
	const size = Number(props.size);
	if (!Number.isFinite(size)) return undefined;
	return {
		width: `${Math.max(24, size)}px`,
		height: `${Math.max(24, size)}px`,
	};
}

/**
 * Resolves the semantic stroke color class.
 *
 * @returns {string} Stroke class.
 */
function getStrokeClass() {
	return {
		primary: 'text-primary',
		success: 'text-success',
		warning: 'text-warning',
		danger: 'text-destructive',
		neutral: 'text-muted-fg',
	}[props.tone] || 'text-primary';
}

/**
 * Builds the progress circle dash style.
 *
 * @returns {Record<string, string>} SVG stroke style.
 */
function getStrokeStyle() {
	return {
		strokeDasharray: `${percent.value} 100`,
	};
}
</script>

<template>
	<div
		:class="rootClass"
		:style="rootStyle"
		role="progressbar"
		:aria-label="label"
		:aria-valuemin="0"
		:aria-valuemax="safeMax"
		:aria-valuenow="clampedValue"
		:aria-valuetext="`${percent}%`"
	>
		<svg viewBox="0 0 36 36" class="absolute inset-0 size-full -rotate-90" aria-hidden="true">
			<circle
				cx="18"
				cy="18"
				r="15"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				class="text-secondary"
			/>
			<circle
				cx="18"
				cy="18"
				r="15"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				pathLength="100"
				:class="strokeClass"
				:style="strokeStyle"
			/>
		</svg>
		<span v-if="showValue" class="relative z-10 font-semibold text-canvas-fg">{{ percent }}%</span>
	</div>
</template>
