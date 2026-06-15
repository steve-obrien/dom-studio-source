<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import DomField from '../field/DomField.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';

defineOptions({
	__doc: {
		name: 'Range input',
		tag: '<DomRangeInput>',
		description: 'A compact slider input for numeric values with a stylable track and handle.',
		icon: 'M5 12h14M8 12a2 2 0 1 0 0.01 0M16 12a2 2 0 1 0 0.01 0',
		slots: [],
		playground: {
			initial: {
				label: 'Confidence',
				modelValue: 64,
				suffix: '%',
				handleClass: 'size-5 border-2 border-canvas shadow-md group-hover:scale-110',
				activeHandleClass: 'scale-125 ring-4 ring-primary/20',
			},
		},
	},
});

const props = defineProps({
	...fieldProps,
	modelValue: {
		type: [Number, String],
		default: 0,
		_edit: { description: 'Current numeric value.' },
	},
	min: {
		type: Number,
		default: 0,
		_edit: { description: 'Minimum slider value.' },
	},
	max: {
		type: Number,
		default: 100,
		_edit: { description: 'Maximum slider value.' },
	},
	step: {
		type: Number,
		default: 1,
		_edit: { description: 'Slider increment.' },
	},
	suffix: {
		type: String,
		default: '',
		_edit: { description: 'Optional unit shown beside the value.' },
	},
	showValue: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the current value beside the slider.' },
	},
	trackClass: {
		type: [String, Array, Object],
		default: '',
		_edit: { description: 'Classes applied to the visual range track.' },
	},
	progressClass: {
		type: [String, Array, Object],
		default: '',
		_edit: { description: 'Classes applied to the filled range track.' },
	},
	handleClass: {
		type: [String, Array, Object],
		default: '',
		_edit: { description: 'Classes applied to the visual slider handle.' },
	},
	activeHandleClass: {
		type: [String, Array, Object],
		default: '',
		_edit: { description: 'Additional classes applied to the handle while it is being dragged.' },
	},
});
const emit = defineEmits(['update:modelValue']);
const field = useField(props, emit, { idPrefix: 'dom-range-input' });
const control = ref(null);
const rangeInput = ref(null);
const dragging = ref(false);

const displayValue = computed(() => {
	const value = field.value.value === '' ? props.min : Number(field.value.value);
	return Number.isFinite(value) ? value : props.min;
});

const progress = computed(() => {
	const min = Number(props.min);
	const max = Number(props.max);
	const value = displayValue.value;
	const range = max - min;

	if (!Number.isFinite(min) || !Number.isFinite(max) || range <= 0) return 0;

	return Math.min(100, Math.max(0, ((value - min) / range) * 100));
});

const rangeStyle = computed(() => ({
	'--dom-range-progress': `${progress.value}%`,
}));

const progressStyle = computed(() => ({
	width: `${progress.value}%`,
}));

const handleStyle = computed(() => ({
	left: `${progress.value}%`,
}));

const controlClass = computed(() => [
	'dom-range-input__control group relative min-h-7 w-full rounded-full outline-none',
	field.disabled.value || field.readOnly.value ? 'cursor-not-allowed' : 'cursor-pointer',
	(field.disabled.value || field.readOnly.value) && 'opacity-50',
]);

const inputClass = computed(() => [
	'pointer-events-none absolute inset-x-0 top-1/2 z-10 m-0 h-8 w-full -translate-y-1/2 opacity-0',
]);

const rangeInputAttrs = computed(() => ({
	...field.inputAttrs.value,
	'aria-readonly': field.readOnly.value || undefined,
}));

const trackClassName = computed(() => [
	'dom-range-input__bar pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-secondary',
	props.trackClass,
]);

const progressClassName = computed(() => [
	'dom-range-input__bar pointer-events-none absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary',
	props.progressClass,
]);

const handleClassName = computed(() => [
	'pointer-events-none absolute top-1/2 z-0 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-sm transition duration-150',
	props.handleClass,
	dragging.value && props.activeHandleClass,
]);

function toNumber(value) {
	const number = Number(value);
	return Number.isNaN(number) ? value : number;
}

function onInput(value, event) {
	if (field.readOnly.value) {
		event.target.value = displayValue.value;
		return;
	}

	field.onInput(toNumber(value));
}

function beginDrag(event) {
	if (field.disabled.value || field.readOnly.value) {
		event.preventDefault();
		return;
	}

	event.preventDefault();
	rangeInput.value?.focus({ preventScroll: true });
	dragging.value = true;
	updateFromPointer(event);
	window.addEventListener('pointermove', moveDrag);
	window.addEventListener('pointerup', endDrag, { once: true });
	window.addEventListener('pointercancel', endDrag, { once: true });
}

function moveDrag(event) {
	event.preventDefault();
	updateFromPointer(event);
}

function endDrag() {
	dragging.value = false;
	window.removeEventListener('pointermove', moveDrag);
	window.removeEventListener('pointerup', endDrag);
	window.removeEventListener('pointercancel', endDrag);
}

function updateFromPointer(event) {
	field.onInput(valueFromPointer(event));
}

function valueFromPointer(event) {
	const rect = control.value?.getBoundingClientRect();
	const min = Number(props.min);
	const max = Number(props.max);
	const range = max - min;

	if (!rect || !Number.isFinite(min) || !Number.isFinite(max) || range <= 0) return displayValue.value;

	const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
	return snapValue(min + ratio * range);
}

function onKeydown(event) {
	if (field.disabled.value || field.readOnly.value) return;

	const step = stepSize();
	const current = displayValue.value;
	const min = Number(props.min);
	const max = Number(props.max);
	let next;

	if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step;
	else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step;
	else if (event.key === 'PageUp') next = current + step * 10;
	else if (event.key === 'PageDown') next = current - step * 10;
	else if (event.key === 'Home' && Number.isFinite(min)) next = min;
	else if (event.key === 'End' && Number.isFinite(max)) next = max;
	else return;

	event.preventDefault();
	field.onInput(snapValue(next));
}

function snapValue(value) {
	const min = Number(props.min);
	const max = Number(props.max);
	const step = stepSize();
	let next = value;

	if (Number.isFinite(min)) next = Math.max(min, next);
	if (Number.isFinite(max)) next = Math.min(max, next);
	if (Number.isFinite(min) && step > 0) next = min + Math.round((next - min) / step) * step;
	if (Number.isFinite(min)) next = Math.max(min, next);
	if (Number.isFinite(max)) next = Math.min(max, next);

	return roundToStep(next, step);
}

function stepSize() {
	const step = Number(props.step);
	return Number.isFinite(step) && step > 0 ? step : 1;
}

function roundToStep(value, step) {
	const decimals = decimalPlaces(step);
	return Number(value.toFixed(Math.min(12, decimals + 2)));
}

function decimalPlaces(value) {
	const text = String(value);
	if (text.includes('e-')) return Number(text.split('e-')[1]) || 0;
	const decimal = text.split('.')[1];
	return decimal ? decimal.length : 0;
}

onBeforeUnmount(endDrag);
</script>

<template>
	<DomField v-bind="field.fieldAttrs.value" :chrome="chrome">
		<div class="flex w-full items-center gap-3">
			<div
				ref="control"
				:class="controlClass"
				:style="rangeStyle"
				:data-dragging="dragging ? 'true' : undefined"
				@pointerdown="beginDrag"
			>
				<span aria-hidden="true" :class="trackClassName"></span>
				<span aria-hidden="true" :class="progressClassName" :style="progressStyle"></span>
				<span aria-hidden="true" :class="handleClassName" :style="handleStyle"></span>
				<input
					ref="rangeInput"
					v-bind="rangeInputAttrs"
					type="range"
					:min="min"
					:max="max"
					:step="step"
					:value="displayValue"
					:class="inputClass"
					@input="onInput($event.target.value, $event)"
					@keydown="onKeydown"
					@focus="field.onFocus"
					@blur="field.onBlur"
				/>
			</div>
			<output v-if="showValue" class="min-w-10 text-right font-mono text-xs text-muted-fg">
				{{ displayValue }}{{ suffix }}
			</output>
		</div>
	</DomField>
</template>

<style scoped>
.dom-range-input__bar {
	box-shadow: inset 0 1px 2px color-mix(in oklch, var(--border) 70%, transparent);
}
</style>
