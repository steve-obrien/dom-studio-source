<script setup>
import { computed, inject } from 'vue';
import { cssEditorContextKey } from './cssEditorContext.js';

const props = defineProps({
	title: {
		type: String,
		required: true,
	},
	meta: {
		type: String,
		default: '',
	},
	modelValue: {
		type: Boolean,
		default: true,
	},
	muted: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['update:modelValue']);
const editorContext = inject(cssEditorContextKey, null);
const framed = computed(() => editorContext?.framed.value !== false);

/**
 * Toggles the section disclosure without changing its material values.
 *
 * @returns {void}
 */
function toggleOpen() {
	emit('update:modelValue', !props.modelValue);
}
</script>

<template>
	<section
		class="text-canvas-fg"
		:class="[
			framed ? 'rounded-lg border border-border skin-card' : 'border-b border-border bg-canvas',
			muted && 'opacity-60',
		]"
	>
		<div class="grid grid-cols-[1fr_auto] items-center gap-2" :class="framed ? 'px-3 py-2' : 'px-4 py-3'">
			<button type="button" class="flex min-w-0 items-center gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" :aria-label="`${modelValue ? 'Collapse' : 'Expand'} ${title}`" :aria-expanded="modelValue" @click="toggleOpen">
				<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="size-4 shrink-0 text-muted-fg" :class="modelValue && 'rotate-90'"><path d="m6 3 5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
				<span class="min-w-0"><span class="block truncate text-sm font-semibold">{{ title }}</span><span v-if="meta" class="block text-xs text-muted-fg">{{ meta }}</span></span>
			</button>
			<div class="flex items-center gap-1">
				<slot name="actions" />
			</div>
		</div>
		<div v-if="modelValue" class="border-t border-border">
			<slot />
		</div>
	</section>
</template>
