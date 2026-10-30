<script setup>
import { ref } from 'vue';
import DomDocumentEditor from '../DomDocumentEditor.vue';
import { createLongDocumentContent } from './documentEditorLongDocument.js';

const content = ref(createLongDocumentContent());
</script>

<template>
	<div class="w-full bg-secondary/25 p-4 sm:p-6">
		<div class="mb-4 rounded-lg border border-border bg-canvas p-4 text-sm leading-6 text-muted-fg">
			<p class="font-semibold text-canvas-fg">Scroll this preview</p>
			<p class="mt-1">The document header moves away, while the formatting toolbar stays at the top of the scrolling page until the editor ends.</p>
		</div>

		<DomDocumentEditor
			v-model="content"
			title="Launch research draft"
			status="Sticky toolbar"
			:show-suggestion-rail="false"
			min-height="72rem"
		/>
	</div>
</template>

<style scoped>
:deep([data-document-editor-toolbar]) {
	backdrop-filter: blur(12px);
	background: color-mix(in oklch, var(--canvas) 92%, transparent);
	box-shadow: 0 1px 0 var(--border), 0 0.65rem 1.5rem color-mix(in oklch, var(--canvas-fg) 8%, transparent);
	position: sticky;
	top: 0;
	z-index: 20;
}
</style>
