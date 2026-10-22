<script setup>
import { computed, nextTick, ref, watch } from 'vue';

/**
 * Editable source with a line gutter and highlighted lines.
 *
 * A plain textarea over a backdrop: the backdrop draws line numbers and the
 * highlight, the textarea keeps native editing, undo, selection and
 * accessibility. Lines never wrap, so a line in the text is a row on screen.
 * The parent owns parsing; this component reports text, the cursor line and
 * the selection.
 */
defineOptions({ name: 'CodeView' });

const props = defineProps({
	modelValue: { type: String, default: '' },
	highlight: { type: Object, default: null },
	label: { type: String, default: 'Source' },
	readonly: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'cursor', 'select', 'focus', 'blur']);
const input = ref(null);
const backdrop = ref(null);
const focused = ref(false);
const lineHeight = 20;
const lines = computed(() => props.modelValue.split('\n'));
const gutter = computed(() => `${String(lines.value.length).length + 2}ch`);

/** Keeps the backdrop aligned with the textarea's scroll position. */
function syncScroll() {
	if (!backdrop.value || !input.value) return;
	backdrop.value.style.transform = `translate(${-input.value.scrollLeft}px, ${-input.value.scrollTop}px)`;
}
/** Reports the one-based line under the caret, and the selection as character offsets. */
function reportCursor() {
	const element = input.value;
	if (!element) return;
	emit('cursor', element.value.slice(0, element.selectionStart).split('\n').length);
	emit('select', { start: element.selectionStart, end: element.selectionEnd });
}
/** Tab inserts a tab instead of leaving the editor; Escape releases focus. */
function onKeydown(event) {
	if (event.key === 'Escape') { input.value.blur(); return; }
	if (event.key !== 'Tab' || event.metaKey || event.ctrlKey || event.altKey || props.readonly) return;
	event.preventDefault();
	const element = input.value;
	const { selectionStart: start, selectionEnd: end, value } = element;
	element.value = `${value.slice(0, start)}\t${value.slice(end)}`;
	element.selectionStart = element.selectionEnd = start + 1;
	emit('update:modelValue', element.value);
}
function onFocus() { focused.value = true; emit('focus'); }
function onBlur() { focused.value = false; emit('blur'); }

/** Scrolls highlighted lines into view when the selection changes elsewhere. */
watch(() => props.highlight && `${props.highlight.start}:${props.highlight.end}`, async () => {
	if (focused.value || !props.highlight || !input.value) return;
	await nextTick();
	const element = input.value;
	const top = (props.highlight.start - 1) * lineHeight;
	const bottom = props.highlight.end * lineHeight;
	if (top < element.scrollTop || bottom > element.scrollTop + element.clientHeight) element.scrollTop = Math.max(0, top - element.clientHeight / 3);
	syncScroll();
});
watch(() => props.modelValue, () => nextTick(syncScroll));

defineExpose({ focus: () => input.value?.focus() });
</script>

<template>
	<div class="relative min-h-0 overflow-hidden bg-canvas font-mono text-xs [tab-size:2]" :style="{ '--gutter': gutter, '--line': `${lineHeight}px` }">
		<div ref="backdrop" aria-hidden="true" class="pointer-events-none absolute left-0 top-0 min-w-full py-3 will-change-transform">
			<div v-for="(line, index) in lines" :key="index" class="flex h-(--line) leading-(--line)" :class="highlight && index + 1 >= highlight.start && index + 1 <= highlight.end && 'bg-primary/10'">
				<span class="w-(--gutter) shrink-0 pr-3 text-right text-muted-fg/70 select-none">{{ index + 1 }}</span>
				<span class="whitespace-pre text-transparent">{{ line || ' ' }}</span>
			</div>
		</div>
		<textarea
			ref="input"
			:value="modelValue"
			:readonly="readonly"
			:aria-label="label"
			wrap="off"
			spellcheck="false"
			autocapitalize="off"
			autocomplete="off"
			class="absolute inset-0 resize-none overflow-auto bg-transparent py-3 pr-4 pl-(--gutter) leading-(--line) whitespace-pre text-canvas-fg caret-canvas-fg outline-none"
			@input="emit('update:modelValue', $event.target.value); reportCursor()"
			@scroll="syncScroll"
			@click="reportCursor"
			@keyup="reportCursor"
			@select="reportCursor"
			@keydown="onKeydown"
			@focus="onFocus"
			@blur="onBlur"
		></textarea>
	</div>
</template>
