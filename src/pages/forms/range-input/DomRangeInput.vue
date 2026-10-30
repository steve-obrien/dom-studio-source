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
		events: [
			{ name: 'update:modelValue', payload: 'number', description: 'The value changed through pointer or keyboard input.' },
			{ name: 'update:dragging', payload: 'boolean', description: 'Pointer scrubbing started or finished, including cancellation.' },
		],
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
	controlClass: {
		type: [String, Array, Object],
		default: '',
		_edit: { description: 'Classes applied to the interactive track area, including its touch target height.' },
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
const emit = defineEmits(['update:modelValue', 'update:dragging', 'focus', 'blur']);
const field = useField(props, emit, { idPrefix: 'dom-range-input' });
const control = ref(null);
const rangeInput = ref(null);
const dragging = ref(false);
const keyboardFocused = ref(false);
let dragWindow;
let dragPointerId;

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

const controlClassName = computed(() => [
	'dom-range-input__control group group/range relative min-h-7 w-full touch-none rounded-full outline-none',
	field.disabled.value || field.readOnly.value ? 'cursor-not-allowed' : 'cursor-pointer',
	(field.disabled.value || field.readOnly.value) && 'opacity-50',
	props.controlClass,
]);

const inputClass = computed(() => [
	'pointer-events-none absolute inset-x-0 top-1/2 z-10 m-0 h-8 w-full -translate-y-1/2 opacity-0',
]);

const rangeInputAttrs = computed(() => ({
	...field.inputAttrs.value,
	'aria-readonly': field.readOnly.value || undefined,
}));

const trackClassName = computed(() => [
	'pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-secondary shadow-[inset_0_1px_2px_color-mix(in_oklch,var(--border)_70%,transparent)]',
	props.trackClass,
]);

const progressClassName = computed(() => [
	'pointer-events-none absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary shadow-[inset_0_1px_2px_color-mix(in_oklch,var(--border)_70%,transparent)]',
	props.progressClass,
]);

const handleClassName = computed(() => [
	'pointer-events-none absolute top-1/2 z-0 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-sm transition duration-150',
	props.handleClass,
	dragging.value && props.activeHandleClass,
]);

/** Converts native range values to numbers without discarding unparseable input. */
function toNumber(value) {
	const number = Number(value);
	return Number.isNaN(number) ? value : number;
}

/** Commits native input changes while preserving read-only field values. */
function onInput(value, event) {
	if (field.readOnly.value) {
		event.target.value = displayValue.value;
		return;
	}

	field.onInput(toNumber(value));
}

/** Starts one primary-pointer drag in the control's owning window, including iframe previews. */
function beginDrag(event) {
	if (event.button !== 0 || !event.isPrimary || dragging.value) return;
	if (field.disabled.value || field.readOnly.value) {
		event.preventDefault();
		return;
	}

	event.preventDefault();
	keyboardFocused.value = false;
	dragging.value = true;
	rangeInput.value?.focus({ preventScroll: true });
	dragPointerId = event.pointerId;
	dragWindow = control.value.ownerDocument.defaultView;
	emit('update:dragging', true);
	updateFromPointer(event);
	dragWindow.addEventListener('pointermove', moveDrag);
	dragWindow.addEventListener('pointerup', endDrag);
	dragWindow.addEventListener('pointercancel', endDrag);
	dragWindow.addEventListener('blur', endDrag);
}

/** Follows only the pointer that started the current drag. */
function moveDrag(event) {
	if (event.pointerId !== dragPointerId) return;
	if (field.disabled.value || field.readOnly.value) {
		endDrag();
		return;
	}
	event.preventDefault();
	updateFromPointer(event);
}

/** Releases drag listeners on completion, cancellation, window blur, or unmount. */
function endDrag(event) {
	if (event?.pointerId != null && event.pointerId !== dragPointerId) return;
	const wasDragging = dragging.value;
	dragging.value = false;
	dragWindow?.removeEventListener('pointermove', moveDrag);
	dragWindow?.removeEventListener('pointerup', endDrag);
	dragWindow?.removeEventListener('pointercancel', endDrag);
	dragWindow?.removeEventListener('blur', endDrag);
	dragWindow = undefined;
	dragPointerId = undefined;
	if (wasDragging) emit('update:dragging', false);
}

/** Writes the pointer's clamped and step-aligned value to the shared field state. */
function updateFromPointer(event) {
	field.onInput(valueFromPointer(event));
}

/** Maps horizontal pointer position onto the finite numeric range. */
function valueFromPointer(event) {
	const rect = control.value?.getBoundingClientRect();
	const min = Number(props.min);
	const max = Number(props.max);
	const range = max - min;

	if (!rect?.width || !Number.isFinite(min) || !Number.isFinite(max) || range <= 0) return displayValue.value;

	const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
	return snapValue(min + ratio * range);
}

/** Implements native slider keyboard navigation with the same bounds and stepping as pointer input. */
function onKeydown(event) {
	if (field.disabled.value || field.readOnly.value) return;
	keyboardFocused.value = true;

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

/** Reveals keyboard focus while excluding the programmatic focus used during pointer scrubbing. */
function onFocus(event) {
	keyboardFocused.value = !dragging.value;
	field.onFocus(event);
}

/** Clears the keyboard indicator and preserves shared field blur and validation behavior. */
function onBlur(event) {
	keyboardFocused.value = false;
	field.onBlur(event);
}

/** Clamps a requested value and snaps it to the nearest increment relative to the minimum. */
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

/** Resolves a positive step, falling back to the native range default. */
function stepSize() {
	const step = Number(props.step);
	return Number.isFinite(step) && step > 0 ? step : 1;
}

/** Removes floating-point noise without losing precision required by the configured step. */
function roundToStep(value, step) {
	const decimals = decimalPlaces(step);
	return Number(value.toFixed(Math.min(12, decimals + 2)));
}

/** Counts decimal precision for ordinary and negative-exponent step values. */
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
				:class="controlClassName"
				:style="rangeStyle"
				:data-dragging="dragging ? 'true' : undefined"
				:data-keyboard-focus="keyboardFocused ? '' : undefined"
				@pointerdown="beginDrag"
			>
				<span aria-hidden="true" :class="trackClassName"></span>
				<span aria-hidden="true" :class="progressClassName" :style="progressStyle"></span>
				<span aria-hidden="true" :class="handleClassName" :style="handleStyle"></span>
				<input
					ref="rangeInput"
					v-bind="rangeInputAttrs"
					:aria-label="$attrs['aria-label']"
					:aria-valuetext="$attrs['aria-valuetext']"
					type="range"
					:min="min"
					:max="max"
					:step="step"
					:value="displayValue"
					:class="inputClass"
					@input="onInput($event.target.value, $event)"
					@keydown="onKeydown"
					@focus="onFocus"
					@blur="onBlur"
				/>
			</div>
			<output v-if="showValue" class="min-w-10 text-right font-mono text-xs text-muted-fg">
				{{ displayValue }}{{ suffix }}
			</output>
		</div>
	</DomField>
</template>
