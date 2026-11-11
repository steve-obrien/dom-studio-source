<script setup>
import { computed, ref, useAttrs } from 'vue';
import { useNumberScrub } from '../_shared/useNumberScrub.js';

defineOptions({ inheritAttrs: false });
const props = defineProps({
	modelValue: { type: [Number, String], default: '' },
	type: { type: String, default: 'number' },
	min: { type: Number, default: null },
	max: { type: Number, default: null },
	step: { type: Number, default: 1 },
	disabled: { type: Boolean, default: false },
	readOnly: { type: Boolean, default: false },
	scrubbable: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'keydown', 'scrub-end']);
const attrs = useAttrs();
const input = ref(null);

/** Forwards native input semantics while keeping outer dimensions on the control wrapper. */
const inputAttrs = computed(() => {
	const { class: classes, style, ...native } = attrs;
	return native;
});

/**
 * Publishes a numeric preview without committing any application action.
 *
 * @param {number|string} value New model value or cancellation restoration.
 */
function update(value) {
	emit('update:modelValue', value);
}

/**
 * Separately reports the end of a drag for applications with expensive side effects.
 *
 * @param {number} value Final adjusted number.
 */
function commitScrub(value) {
	emit('scrub-end', value);
}

const scrub = useNumberScrub({
	value: () => props.modelValue,
	min: () => props.min,
	max: () => props.max,
	step: () => props.step,
	disabled: () => !props.scrubbable || props.disabled || props.readOnly,
	onPreview: update,
	onCommit: commitScrub,
	onCancel: update,
});

/**
 * Preserves raw page text or the existing number-input model contract as requested.
 *
 * @param {Event} event Native text editing event.
 */
function onInput(event) {
	const value = event.target.value;
	update(props.type === 'text' || value === '' ? value : Number(value));
}

/**
 * Supplies bounded keyboard stepping for scrub controls, including raw-text page fields.
 *
 * @param {KeyboardEvent} event Native keyboard event.
 */
function onKeydown(event) {
	if (props.scrubbable && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
		event.preventDefault();
		scrub.nudge(event.key === 'ArrowUp' ? 1 : -1, event.shiftKey);
	}
	emit('keydown', event);
}

/**
 * Changes values only when this field owns focus, leaving ordinary page scrolling intact.
 *
 * @param {WheelEvent} event Native non-passive wheel event.
 */
function onWheel(event) {
	if (props.scrubbable && input.value === input.value?.ownerDocument.activeElement) scrub.wheel(event);
}

/**
 * Clears accumulated wheel movement and forwards normal form blur state.
 *
 * @param {FocusEvent} event Native blur event.
 */
function onBlur(event) {
	scrub.resetWheel();
	emit('blur', event);
}

/** Focuses the editable number without changing it. */
function focus() {
	input.value?.focus();
}

/** Selects the editable text for replacement, including raw-text pagination values. */
function select() {
	input.value?.select();
}

defineExpose({ focus, select });
</script>

<template>
	<div
		class="skin-input flex h-10 min-w-0 items-center px-0 focus-within:ring-2 focus-within:ring-ring/60"
		:class="[attrs.class, disabled && 'cursor-not-allowed opacity-40']"
		:style="attrs.style"
		:data-invalid="attrs['aria-invalid'] === true || attrs['aria-invalid'] === 'true' ? '' : undefined"
	>
		<span
			v-if="scrubbable"
			aria-hidden="true"
			title="Drag to adjust · Shift for larger steps"
			class="flex h-full w-5 shrink-0 cursor-ew-resize select-none items-center justify-center text-muted-fg hover:text-canvas-fg"
			:class="(disabled || readOnly) && 'pointer-events-none'"
			@pointerdown="scrub.start"
			@click.capture="scrub.consumeClick"
			@click="focus"
		>
			<svg class="size-3" viewBox="0 0 16 16" fill="none"><path d="m5 5-3 3 3 3m6-6 3 3-3 3M2 8h12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" /></svg>
		</span>
		<input
			v-bind="inputAttrs"
			ref="input"
			:value="modelValue"
			:type="type"
			:min="min"
			:max="max"
			:step="step"
			:disabled="disabled"
			:readonly="readOnly"
			class="h-full w-full min-w-0 bg-transparent pr-2 text-inherit tabular-nums outline-none placeholder:text-muted-fg"
			:class="scrubbable ? 'pl-0' : 'pl-3'"
			@input="onInput"
			@keydown="onKeydown"
			@wheel="onWheel"
			@focus="emit('focus', $event)"
			@blur="onBlur"
		/>
	</div>
</template>
