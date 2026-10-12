<script setup>
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
const links = [
	{ to: '/designer/canvas', title: 'Canvas', tag: 'New', description: 'A Figma-style workspace made of real HTML. Pan and zoom across artboards, design one Vue file at several widths, use live DOM Studio components and export the same .vue file back.' },
	{ to: '/designer/frames', title: 'Nested frames & HTML import', description: 'Nest flow, flex, grid and absolute frames. Switch layouts, snap within a frame, and import Tailwind HTML into an editable canvas.' },
	{ to: '/designer/assembly', title: 'Build your own designer', description: 'Working Vue examples and assembly documentation for HTML editors, appearance controls and flowcharts.' },
	{ to: '/designer/flowchart', title: 'Flowchart designer', description: 'An infinite workspace powered by Vue Flow. Connect editable steps, pan, zoom, navigate with a minimap and export your graph.' },
	{ to: '/designer/poster', title: 'Poster studio', description: 'Create a portrait flyer with editable image, text and shape layers, typography, filters, zoom, undo and HTML export.' },
	{ to: '/designer/social-card', title: 'Social card designer', description: 'A small HTML creation tool with linked layers, properties and source. Move and resize with an absolute-positioned bounding box.' },
	{ to: '/designer/studio', title: 'Studio', description: 'The existing Vue editor: code, layers and a live stage, with component insertion and source editing.' },
	{ to: '/designer/color-swatch', title: 'Colour swatch', description: 'The theme editor’s colour control, available independently with a CSS expression and native picker.' },
	{ to: '/designer/background-editor', title: 'Background layers', description: 'Stack solid fills, linear gradients and radial gradients with independent opacity.' },
	{ to: '/designer/backdrop-editor', title: 'Backdrop effects', description: 'Blur and saturate the content behind translucent HTML elements.' },
	{ to: '/designer/border-editor', title: 'CSS border editor', description: 'Edit border width, style and colour with the shared CSS border control.' },
	{ to: '/designer/shadow-editor', title: 'CSS shadow editor', description: 'Compose drop shadows, inner shadows and rings. Reuses the theme editor’s layer controls.' },
	{ to: '/designer/stage', title: 'HTML stage', description: 'Add selection and optional movement to your own HTML. Your application owns the content and applies style changes.' },
	{ to: '/designer/layers', title: 'Layer tree', description: 'The same tree used by Studio, with selection, keyboard navigation and optional drag-and-drop.' },
];
</script>
<template>
	<DomStudioLayout>
		<DocPage name="Designer" eyebrow="Visual editing for HTML and Vue" tag="Beta" tagline="Design with the real DOM, not a picture of it. Edit website pages and the Vue output of app generators visually, then ship the same source.">
			<DocSection title="Where this is going" eyebrow="Roadmap">
				<p class="text-muted-fg">Canvas is the first slice of a Figma-style designer that renders real HTML instead of drawing to a canvas element. Because every layer is DOM, a design is already the shipped markup: Tailwind classes, theme tokens and live Vue components included. The demos below are converging on one editor model: a flat map of components by id, where each component type declares the properties the inspector shows. The canvas, poster studio, social card and Studio become presets of one workspace sharing snapping, history, preview data and live collaboration.</p>
			</DocSection>
			<DocSection title="Start with a working example" eyebrow="HTML you can edit">
				<div class="grid gap-4 md:grid-cols-2"><RouterLink v-for="link in links" :key="link.to" :to="link.to" class="rounded-xl border border-border p-5 transition hover:border-primary focus-visible:ring-2 focus-visible:ring-ring"><h3 class="font-semibold">{{ link.title }} →<span v-if="link.tag" class="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">{{ link.tag }}</span></h3><p class="mt-2 text-sm leading-6 text-muted-fg">{{ link.description }}</p></RouterLink></div>
			</DocSection>
			<DocSection title="A small, composable beta" eyebrow="Ownership">
				<p class="text-muted-fg">Use the controls individually or combine them for social cards, banners and other creation tools. Normal HTML layout stays normal HTML. Enable absolute movement only on stages that need it. The host application owns undo, persistence, asset handling and publishing; the beta APIs may change.</p>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
