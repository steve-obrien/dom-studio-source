<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import MiniEditor from './examples/MiniEditor.vue';
import miniEditorSource from './examples/MiniEditor.vue?raw';

const parts = [
	{ to: '/designer/composables/editor-session', name: 'useEditorSession', description: 'The document: files and artboards, the selection, and one undo history. Every other part reads and writes through it.' },
	{ to: '/designer/composables/code-sync', name: 'useCodeSync + DomCodePanel', description: 'The Vue source of the same tree, edited both ways: typing in the code updates the design, and selections follow each other.' },
	{ to: '/designer/composables/inline-text', name: 'useInlineText', description: 'Double-click text on the stage to edit it in place, with bold, italic, underline and strike, and a live preview in the code.' },
	{ to: '/designer/composables/layout-geometry', name: 'useLayoutGeometry', description: 'Where layers sit and how they move: drags, X/Y/W/H fields, and align and distribute for a multiple selection.' },
	{ to: '/designer/composables/rich-text', name: 'Rich text model', description: 'The functions both of those edit text with: marks and edits on a flat model of a paragraph, turned into document operations.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Composables" eyebrow="UI designer" tag="Beta" tagline="The behaviour behind the Canvas, as building blocks for editors of your own.">
			<DocSection title="One document, many views">
				<p class="text-muted-fg">DomDesigner and the Social post studio are built from the same composables. A session holds the document. The stage, the layers, the inspector and the code panel are all views of it. Edits go through the session as undoable operations, so every view updates together. A fix or a feature in a composable reaches every editor built on it.</p>
				<div class="grid gap-2 sm:grid-cols-2">
					<RouterLink v-for="part in parts" :key="part.to" :to="part.to" class="min-w-0 rounded-lg border border-border px-4 py-3 transition hover:border-primary hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring">
						<code class="block truncate text-sm font-medium text-canvas-fg">{{ part.name }}</code>
						<span class="mt-1 block text-sm leading-6 text-muted-fg">{{ part.description }}</span>
					</RouterLink>
				</div>
			</DocSection>
			<DocSection title="A small editor" eyebrow="Example">
				<p class="mb-4 text-muted-fg">A stage and a code panel on one session. Double-click the text to edit it, select words and press B, or edit the code. Undo covers both.</p>
				<Example :source="miniEditorSource" filename="MiniEditor.vue" default-open><MiniEditor /></Example>
			</DocSection>
			<DocSection title="Import" eyebrow="@getdom/studio/designer">
				<p class="text-muted-fg">The composables come from <code>@getdom/studio/designer</code>, the same entry as DomDesigner. It includes the Vue template compiler, so load it on the pages where people design. The APIs are in beta and may change.</p>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
