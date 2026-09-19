<script setup>
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
const links = [
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
		<DocPage name="UI designer" eyebrow="Tools for building creation tools" tag="Beta" tagline="Build small design tools with real HTML. Bring a stage, layers and focused CSS controls into your own application.">
			<DocSection title="Start with a working example" eyebrow="HTML you can edit">
				<div class="grid gap-4 md:grid-cols-2"><RouterLink v-for="link in links" :key="link.to" :to="link.to" class="rounded-xl border border-border p-5 transition hover:border-primary focus-visible:ring-2 focus-visible:ring-ring"><h3 class="font-semibold">{{ link.title }} →</h3><p class="mt-2 text-sm leading-6 text-muted-fg">{{ link.description }}</p></RouterLink></div>
			</DocSection>
			<DocSection title="A small, composable beta" eyebrow="Ownership">
				<p class="text-muted-fg">Use the controls individually or combine them for social cards, banners and other creation tools. Normal HTML layout stays normal HTML. Enable absolute movement only on stages that need it. The host application owns undo, persistence, asset handling and publishing; the beta APIs may change.</p>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
