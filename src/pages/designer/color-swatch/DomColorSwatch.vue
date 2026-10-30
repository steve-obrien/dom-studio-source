<script setup>
import { computed, inject, onMounted, ref, useId, watch } from 'vue';
import { cssColorToHex, cssColorWithAlpha, hexToOklch } from '../../lib/css/color.js';
import { cssEditorContextKey, resolveEditorColor } from '../_shared/cssEditorContext.js';
import { isSafeCssColor } from '../_shared/cssValue.js';

defineOptions({
	__doc: {
		name: 'Color swatch',
		description: 'Beta Figma-style colour field: a swatch that opens the picker, an editable CSS colour and an optional opacity.',
		events: [
			{ name: 'update:modelValue', payload: 'string', description: 'A valid CSS colour, from the picker or typed.' },
			{ name: 'update:alpha', payload: 'number', description: 'Opacity from 0 to 100, when `alpha` is bound.' },
		],
	},
});

const props = defineProps({
	modelValue: { type: String, default: '#000000', _edit: { description: 'CSS colour. Expressions such as var(--primary) are kept as typed.' } },
	label: { type: String, default: 'Colour' },
	alpha: { type: Number, default: null, _edit: { description: 'Opacity from 0 to 100. Bind with v-model:alpha to show the opacity field.' } },
	hideLabel: { type: Boolean, default: false },
	placeholder: { type: String, default: '' },
	disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'update:alpha']);
const context = inject(cssEditorContextKey, null);
const id = useId();
const mounted = ref(false);
const draft = ref(props.modelValue);
const alphaDraft = ref(null);
const resolvedColor = computed(() => resolveEditorColor(props.modelValue, context?.colorVariables.value));
const nativeValue = computed(() => {
	// Browser-dependent colour functions can only be resolved after hydration.
	if (!mounted.value && !/^#|^oklch\(|^rgba?\(/i.test(resolvedColor.value)) return '#000000';
	return cssColorToHex(resolvedColor.value);
});
const swatch = computed(() => {
	const color = props.alpha === null ? resolvedColor.value : cssColorWithAlpha(resolvedColor.value, props.alpha);
	return { background: `linear-gradient(${color}, ${color}), repeating-conic-gradient(var(--border) 0 25%, var(--canvas) 0 50%) 0 0 / 8px 8px` };
});

/** Keeps the editable expression aligned when the value changes elsewhere. */
function syncDraft(value) {
	draft.value = value;
}

/** Commits a valid CSS colour expression or restores the previous value. */
function commitDraft() {
	const value = draft.value.trim();
	if (value === props.modelValue) return;
	if (isSafeCssColor(resolveEditorColor(value, context?.colorVariables.value)) || /^var\(\s*--[\w-]+\s*\)$/.test(value)) emit('update:modelValue', value);
	else draft.value = props.modelValue;
}

/** The picker keeps OKLCH values in OKLCH. */
function pick(value) {
	emit('update:modelValue', /^oklch\(/i.test(props.modelValue.trim()) ? hexToOklch(value) : value);
}

/** Commits a typed opacity, clamped to 0–100. */
function commitAlpha() {
	if (alphaDraft.value === null) return;
	const value = Number.parseFloat(alphaDraft.value);
	alphaDraft.value = null;
	if (Number.isFinite(value)) emit('update:alpha', Math.round(Math.min(100, Math.max(0, value))));
}

/** Arrow keys nudge the opacity by 1, or 10 with Shift. */
function nudgeAlpha(event, direction) {
	event.preventDefault();
	alphaDraft.value = null;
	emit('update:alpha', Math.min(100, Math.max(0, (props.alpha ?? 100) + direction * (event.shiftKey ? 10 : 1))));
}

/** Enables browser colour resolution after the initial server/client render. */
function enableBrowserColors() {
	mounted.value = true;
}

watch(() => props.modelValue, syncDraft);
onMounted(enableBrowserColors);
</script>

<template>
	<div class="min-w-0" :class="disabled && 'pointer-events-none opacity-50'">
		<label v-if="!hideLabel" :for="id" class="mb-1 block text-[11px] text-muted-fg">{{ label }}</label>
		<div class="flex h-7 min-w-0 items-center rounded-md bg-secondary/60 text-xs ring-inset transition hover:ring-1 hover:ring-border focus-within:bg-canvas focus-within:ring-1 focus-within:ring-primary">
			<slot name="swatch" :style="swatch">
				<span class="relative ml-1.5 size-4 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-inset ring-canvas-fg/15" :style="swatch">
					<input
						type="color"
						:value="nativeValue"
						:aria-label="`${label}: pick a colour`"
						:disabled="disabled"
						class="absolute inset-0 size-full cursor-pointer opacity-0"
						@input="pick($event.target.value)"
					>
				</span>
			</slot>
			<input
				:id="id"
				v-model="draft"
				:aria-label="hideLabel ? label : undefined"
				:title="modelValue"
				:placeholder="placeholder"
				:disabled="disabled"
				spellcheck="false"
				autocomplete="off"
				class="h-full min-w-0 flex-1 bg-transparent px-2 font-mono text-[11px] text-canvas-fg outline-none placeholder:font-sans placeholder:text-muted-fg/70"
				@blur="commitDraft"
				@keydown.enter.prevent="commitDraft(); $event.target.blur()"
				@keydown.escape="draft = modelValue; $event.target.blur()"
			>
			<template v-if="alpha !== null">
				<span class="h-4 w-px shrink-0 bg-border" aria-hidden="true"></span>
				<input
					:value="alphaDraft ?? alpha"
					type="text"
					inputmode="numeric"
					:aria-label="`${label} opacity`"
					:disabled="disabled"
					class="h-full w-9 shrink-0 bg-transparent pl-2 text-right tabular-nums text-canvas-fg outline-none"
					@input="alphaDraft = $event.target.value"
					@blur="commitAlpha"
					@keydown.enter.prevent="commitAlpha(); $event.target.blur()"
					@keydown.up="nudgeAlpha($event, 1)"
					@keydown.down="nudgeAlpha($event, -1)"
				>
				<span class="shrink-0 pl-0.5 pr-2 text-[11px] text-muted-fg" aria-hidden="true">%</span>
			</template>
		</div>
	</div>
</template>
