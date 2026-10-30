<script setup>
import CodeView from './CodeView.vue';

/**
 * DomCodePanel: the code of an editor's active file, kept in sync with the
 * stage by `useCodeSync`. It shows the same tree the stage renders: typing
 * here edits the document, a line selects its element, selected letters are
 * highlighted on the canvas, and in-place text edits move the caret here.
 *
 * Put a header or actions around it as the app needs; the panel is only the
 * code and its parse messages.
 */
defineOptions({ name: 'DomCodePanel' });

defineProps({
	/** What `useCodeSync` returns. */
	sync: { type: Object, required: true },
	/** A code view component, such as `DomMonacoCodeView`; the built-in `DomCodeView` when null. */
	editor: { type: [Object, Function], default: null },
	/** Extra props for `editor`, such as Monaco's `load`. */
	editorProps: { type: Object, default: () => ({}) },
	/** Accessible name of the code. */
	label: { type: String, default: 'Source' },
});
</script>

<template>
	<div class="flex min-h-0 flex-col">
		<component :is="editor || CodeView" :ref="(view) => { sync.view.value = view; }" v-bind="editor ? editorProps : {}" class="min-h-0 flex-1" :model-value="sync.text.value" :highlight="sync.highlight.value" :label="label" @update:model-value="sync.edit" @cursor="sync.selectLine" @select="sync.selectText" @focus="sync.enter" @blur="sync.leave" />
		<p v-if="sync.error.value || sync.warning.value" role="status" class="border-t border-border bg-secondary px-4 py-2 text-xs" :class="sync.error.value ? 'text-destructive' : 'text-muted-fg'">{{ sync.error.value || sync.warning.value }}</p>
	</div>
</template>
