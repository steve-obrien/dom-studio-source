<script setup>
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
import CodeBlock from '../_layout/CodeBlock.vue';
const embedExample = `<script setup>
import * as studio from '@getdom/studio/vue';
import { DomDesigner, catalogFromExports, createHttpStorage } from '@getdom/studio/designer';

// Every DOM Studio component can be inserted; add your own to the same object.
const catalog = catalogFromExports(studio);
// Keep work in your database: GET and PUT /api/designs/:id with { value }.
const storage = createHttpStorage({ endpoint: '/api/designs' });
<\/script>

<template>
	<div class="h-dvh">
		<DomDesigner :catalog="catalog" :storage="storage" storage-key="home-page" title="Home page" />
	</div>
</template>`;
const links = [
	{ to: '/designer/canvas', title: 'Canvas', tag: 'New', description: 'A Figma-style workspace made of real HTML. Pan and zoom across artboards, design one Vue file at several widths with live components and preview data, edit its code side by side (optionally in Monaco), and export the same .vue file back.' },
	{ to: '/designer/frames', title: 'Nested frames & HTML import', description: 'Nest flow, flex, grid and absolute frames. Switch layouts, snap within a frame, and import Tailwind HTML into an editable canvas.' },
	{ to: '/designer/assembly', title: 'Build your own designer', description: 'Working Vue examples and assembly documentation for HTML editors, appearance controls and flowcharts.' },
	{ to: '/designer/flowchart', title: 'Flowchart designer', description: 'An infinite workspace powered by Vue Flow. Connect editable steps, pan, zoom, navigate with a minimap and export your graph.' },
	{ to: '/designer/social', title: 'Social post studio', tag: 'New', description: 'Design one post and see it live at every platform size: Instagram post and story, LinkedIn, X, YouTube and link previews. Each layer pins to an edge, the centre or both sides, so a resize reflows instead of squashing.' },
	{ to: '/designer/poster', title: 'Poster studio', description: 'Create a portrait flyer with image, text and shape layers on the shared editor model. Multi-select, align, distribute, rulers, undo and HTML export.' },
	{ to: '/designer/social-card', title: 'Social card designer', description: 'The poster studio at link-preview sizes, with the linked HTML open. Select a source line to inspect its layer.' },
	{ to: '/designer/color-swatch', title: 'Colour swatch', description: 'The theme editor’s colour control, available independently with a CSS expression and native picker.' },
	{ to: '/designer/background-editor', title: 'Background layers', description: 'Stack solid fills, linear gradients and radial gradients with independent opacity.' },
	{ to: '/designer/backdrop-editor', title: 'Backdrop effects', description: 'Blur and saturate the content behind translucent HTML elements.' },
	{ to: '/designer/border-editor', title: 'CSS border editor', description: 'Edit border width, style and colour with the shared CSS border control.' },
	{ to: '/designer/shadow-editor', title: 'CSS shadow editor', description: 'Compose drop shadows, inner shadows and rings. Reuses the theme editor’s layer controls.' },
	{ to: '/designer/stage', title: 'HTML stage', description: 'Add selection and optional movement to your own HTML. Your application owns the content and applies style changes.' },
	{ to: '/designer/layers', title: 'Layer tree', description: 'The same tree used by the canvas, with selection, keyboard navigation and optional drag-and-drop.' },
];
</script>
<template>
	<DomStudioLayout>
		<DocPage name="Designer" eyebrow="Visual editing for HTML and Vue" tag="Beta" tagline="Design with the real DOM, not a picture of it. Edit website pages and the Vue output of app generators visually, then ship the same source.">
			<DocSection title="Where this is going" eyebrow="Roadmap">
				<p class="text-muted-fg">Canvas is a Figma-style designer that renders real HTML instead of drawing to a canvas element. Because every layer is DOM, a design is already the shipped markup: Tailwind classes, theme tokens and live Vue components included. The canvas and the poster studio run on one editor model: a flat map of components by id, where each component type declares the properties the inspector shows and every edit is an undoable operation. The code view is two-way, so editing the Vue source updates the design. Studio moves onto the same core next, followed by live collaboration.</p>
			</DocSection>
			<DocSection title="Start with a working example" eyebrow="HTML you can edit">
				<div class="grid gap-4 md:grid-cols-2"><RouterLink v-for="link in links" :key="link.to" :to="link.to" class="rounded-xl border border-border p-5 transition hover:border-primary focus-visible:ring-2 focus-visible:ring-ring"><h3 class="font-semibold">{{ link.title }} →<span v-if="link.tag" class="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">{{ link.tag }}</span></h3><p class="mt-2 text-sm leading-6 text-muted-fg">{{ link.description }}</p></RouterLink></div>
			</DocSection>
			<DocSection title="Embed the designer" eyebrow="@getdom/studio/designer">
				<p class="mb-4 text-muted-fg">The canvas is the <code>DomDesigner</code> component, so you can put it in your own product. Give it the components people may insert and a storage adapter: this browser by default, your API for a CMS (<code>createHttpStorage</code>), or project files (<code>createFileStorage</code>). The entry also exports the editor core: documents, operations, history, and Vue import and export with source maps. It includes the Vue template compiler, so load it only on pages where people design.</p>
				<CodeBlock :code="embedExample" language="vue" />
			</DocSection>
			<DocSection title="A small, composable beta" eyebrow="Ownership">
				<p class="text-muted-fg">Use the controls individually or combine them for social cards, banners and other creation tools. Normal HTML layout stays normal HTML. Enable absolute movement only on stages that need it. The host application owns undo, persistence, asset handling and publishing; the beta APIs may change.</p>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
