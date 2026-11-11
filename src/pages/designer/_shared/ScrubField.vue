<script setup>
import { computed, ref, watch } from 'vue';
import { vDomTooltip } from '../../components/tooltip/vDomTooltip.js';
import InspectorIcon from './InspectorIcon.vue';
import { clampNumber, useNumberScrub } from '../../forms/_shared/useNumberScrub.js';

/**
 * Compact numeric field in the style of Figma and Penpot inspectors.
 *
 * Drag the prefix sideways to scrub the value (Shift for steps of ten), use
 * the arrow keys, or type and press Enter. With `css`, a typed CSS length
 * such as `50%` or `auto` is emitted as a string; plain numbers are numbers.
 * A `suffix` such as `%` or `px` shows after the value.
 */
const props = defineProps({
	modelValue: { type: [Number, String], default: '' },
	label: { type: String, required: true },
	icon: { type: String, default: '' },
	prefix: { type: String, default: '' },
	suffix: { type: String, default: '' },
	placeholder: { type: String, default: '' },
	min: { type: Number, default: null },
	max: { type: Number, default: null },
	step: { type: Number, default: 1 },
	css: { type: Boolean, default: false },
	disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const draft = ref(null);
/** Displays typed text until it is committed, otherwise the controlled designer value. */
const shown = computed(() => draft.value ?? (props.modelValue === null || props.modelValue === undefined ? '' : String(props.modelValue)));

/** Sends shared numeric adjustments through the designer's existing controlled model. */
function updateNumber(value) {
	draft.value = null;
	emit('update:modelValue', value);
}

/** Uses a numeric draft or placeholder when the designer currently holds a CSS value. */
function numericValue() {
	return shown.value !== '' && Number.isFinite(Number(shown.value)) ? Number(shown.value) : Number(props.placeholder) || 0;
}

const scrub = useNumberScrub({
	value: numericValue,
	restoreValue: () => props.modelValue,
	min: () => props.min,
	max: () => props.max,
	step: () => props.step,
	disabled: () => props.disabled,
	onPreview: updateNumber,
	onCancel: updateNumber,
});

/** Clears stale typed text when the application changes the designer value. */
function syncValue() {
	if (!scrub.dragging.value) draft.value = null;
}

watch(() => props.modelValue, syncValue);

/** Rounds committed designer numbers to the same bounds and steps as mouse adjustments. */
function clamp(value) {
	return clampNumber(value, props);
}

/** Commits typed text: numbers are clamped, CSS lengths pass through when allowed. */
function commit() {
	if (draft.value === null) return;
	const text = draft.value.trim();
	draft.value = null;
	if (text === '') {
		if (props.css) emit('update:modelValue', '');
		return;
	}
	if (Number.isFinite(Number(text))) emit('update:modelValue', clamp(Number(text)));
	else if (props.css) emit('update:modelValue', text);
}

/** Handles typed commits, cancellation and the shared accelerated numeric stepping. */
function onKeydown(event) {
	if (event.key === 'Enter') { commit(); event.target.blur(); }
	else if (event.key === 'Escape') { draft.value = null; event.target.blur(); }
	else if (event.key === 'ArrowUp') { event.preventDefault(); scrub.nudge(1, event.shiftKey); }
	else if (event.key === 'ArrowDown') { event.preventDefault(); scrub.nudge(-1, event.shiftKey); }
}

/** Adjusts with the wheel only after the user focuses this designer number. */
function onWheel(event) {
	if (event.currentTarget === event.currentTarget.ownerDocument.activeElement) scrub.wheel(event);
}

/** Commits typed text and clears any fractional trackpad movement on blur. */
function onBlur() {
	scrub.resetWheel();
	commit();
}
</script>

<template>
	<label class="group/scrub flex h-7 min-w-0 items-center rounded-md bg-secondary/60 text-xs ring-inset transition hover:ring-1 hover:ring-border focus-within:bg-canvas focus-within:ring-1 focus-within:ring-primary" :class="disabled && 'pointer-events-none opacity-50'">
		<span
			class="flex h-full w-7 shrink-0 cursor-ew-resize select-none items-center justify-center text-[11px] font-medium text-muted-fg group-hover/scrub:text-canvas-fg"
			v-dom-tooltip="`${label} · drag to change`"
			aria-hidden="true"
			@pointerdown="scrub.start"
			@click.capture="scrub.consumeClick"
		>
			<InspectorIcon v-if="icon" :name="icon" />
			<template v-else>{{ prefix }}</template>
		</span>
		<input
			:value="shown"
			type="text"
			inputmode="decimal"
			spellcheck="false"
			autocomplete="off"
			:aria-label="label"
			:placeholder="placeholder"
			:disabled="disabled"
			class="h-full w-full min-w-0 bg-transparent tabular-nums text-canvas-fg outline-none placeholder:text-muted-fg/70"
			:class="suffix ? 'pr-0.5' : 'pr-2'"
			@input="draft = $event.target.value"
			@keydown="onKeydown"
			@wheel="onWheel"
			@blur="onBlur"
		>
		<span v-if="suffix" class="shrink-0 select-none pr-2 text-[11px] text-muted-fg" aria-hidden="true">{{ suffix }}</span>
	</label>
</template>
