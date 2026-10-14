<script setup>
import { computed, ref, watch } from 'vue';
import { vDomTooltip } from '../../components/tooltip/vDomTooltip.js';
import InspectorIcon from './InspectorIcon.vue';

/**
 * Compact numeric field in the style of Figma and Penpot inspectors.
 *
 * Drag the prefix sideways to scrub the value (Shift for steps of ten), use
 * the arrow keys, or type and press Enter. With `css`, a typed CSS length
 * such as `50%` or `auto` is emitted as a string; plain numbers are numbers.
 */
const props = defineProps({
	modelValue: { type: [Number, String], default: '' },
	label: { type: String, required: true },
	icon: { type: String, default: '' },
	prefix: { type: String, default: '' },
	placeholder: { type: String, default: '' },
	min: { type: Number, default: null },
	max: { type: Number, default: null },
	step: { type: Number, default: 1 },
	css: { type: Boolean, default: false },
	disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const draft = ref(null);
const scrubbing = ref(false);
const shown = computed(() => draft.value ?? (props.modelValue === null || props.modelValue === undefined ? '' : String(props.modelValue)));
const numeric = computed(() => props.modelValue !== '' && Number.isFinite(Number(props.modelValue)));

watch(() => props.modelValue, () => { if (!scrubbing.value) draft.value = null; });

function clamp(value) {
	let next = Math.round(value / props.step) * props.step;
	if (props.min !== null) next = Math.max(props.min, next);
	if (props.max !== null) next = Math.min(props.max, next);
	return Number(next.toFixed(4));
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

function nudge(event, direction) {
	const base = Number.isFinite(Number(shown.value)) && shown.value !== '' ? Number(shown.value) : Number(props.placeholder) || 0;
	draft.value = null;
	emit('update:modelValue', clamp(base + direction * props.step * (event.shiftKey ? 10 : 1)));
}

function onKeydown(event) {
	if (event.key === 'Enter') { commit(); event.target.blur(); }
	else if (event.key === 'Escape') { draft.value = null; event.target.blur(); }
	else if (event.key === 'ArrowUp') { event.preventDefault(); nudge(event, 1); }
	else if (event.key === 'ArrowDown') { event.preventDefault(); nudge(event, -1); }
}

/** Dragging the prefix changes the value by one step per two pixels. */
function onScrubStart(event) {
	if (props.disabled || event.button !== 0) return;
	const start = numeric.value ? Number(props.modelValue) : Number(props.placeholder) || 0;
	const origin = event.clientX;
	const target = event.currentTarget;
	target.setPointerCapture(event.pointerId);
	scrubbing.value = true;
	const move = (moveEvent) => {
		const delta = Math.round((moveEvent.clientX - origin) / 2) * (moveEvent.shiftKey ? 10 : 1);
		emit('update:modelValue', clamp(start + delta * props.step));
	};
	const end = () => {
		scrubbing.value = false;
		target.removeEventListener('pointermove', move);
		target.removeEventListener('pointerup', end);
		target.removeEventListener('pointercancel', end);
	};
	target.addEventListener('pointermove', move);
	target.addEventListener('pointerup', end);
	target.addEventListener('pointercancel', end);
	event.preventDefault();
}
</script>

<template>
	<label class="group/scrub flex h-7 min-w-0 items-center rounded-md bg-secondary/60 text-xs ring-inset transition hover:ring-1 hover:ring-border focus-within:bg-canvas focus-within:ring-1 focus-within:ring-primary" :class="disabled && 'pointer-events-none opacity-50'">
		<span
			class="flex h-full w-7 shrink-0 cursor-ew-resize select-none items-center justify-center text-[11px] font-medium text-muted-fg group-hover/scrub:text-canvas-fg"
			v-dom-tooltip="`${label} · drag to change`"
			aria-hidden="true"
			@pointerdown="onScrubStart"
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
			class="h-full w-full min-w-0 bg-transparent pr-2 tabular-nums text-canvas-fg outline-none placeholder:text-muted-fg/70"
			@input="draft = $event.target.value"
			@keydown="onKeydown"
			@blur="commit"
		>
	</label>
</template>
