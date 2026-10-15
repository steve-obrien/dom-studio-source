<script setup>
import { computed, inject } from 'vue';
import { cssEditorContextKey } from './cssEditorContext.js';

/**
 * A Figma-style inspector section: a small title, optional meta text and
 * actions on the right, and a body that collapses when the title is clicked.
 * Inside a framed editor context (the theme designer) it draws as a card;
 * otherwise sections are separated by a rule.
 */
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
			framed ? 'rounded-lg border border-border skin-card' : 'border-b border-border py-3 last:border-b-0',
			muted && 'opacity-60',
		]"
	>
		<div class="flex h-6 items-center gap-2" :class="framed && 'mx-3 my-2'">
			<button type="button" class="group/section flex h-full min-w-0 flex-1 items-center gap-1 rounded text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" :aria-label="`${modelValue ? 'Collapse' : 'Expand'} ${title}`" :aria-expanded="modelValue" @click="toggleOpen">
				<span class="truncate text-[11px] font-semibold">{{ title }}</span>
				<span v-if="meta && !modelValue" class="min-w-0 truncate text-[11px] text-muted-fg">{{ meta }}</span>
				<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="size-3 shrink-0 text-muted-fg opacity-0 transition group-hover/section:opacity-100 group-focus-visible/section:opacity-100" :class="modelValue ? 'rotate-90' : ''"><path d="m6 3 5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
			</button>
			<div class="-mr-1 flex shrink-0 items-center">
				<slot name="actions" />
			</div>
		</div>
		<div v-if="modelValue" :class="framed ? 'px-3 pb-3' : 'pt-2'">
			<slot />
		</div>
	</section>
</template>
