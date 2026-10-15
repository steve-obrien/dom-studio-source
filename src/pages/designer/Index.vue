<script setup>
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
import CodeBlock from '../_layout/CodeBlock.vue';
import { nextTick, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
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
const tools = [
	{ to: '/designer/canvas', title: 'Canvas', tag: 'New', makes: 'Website pages, app screens and Vue components', description: 'A Figma-style workspace made of real HTML. Pan and zoom across artboards, design one Vue file at several widths with live components and preview data, edit its code side by side (optionally in Monaco), and export the same .vue file back.' },
	{ to: '/designer/social', title: 'Social post studio', tag: 'New', makes: 'Instagram posts and stories, LinkedIn, X and YouTube graphics', description: 'Design one post and see it live at every platform size: Instagram post and story, LinkedIn, X, YouTube and link previews. Each layer pins to an edge, the centre or both sides, so a resize reflows instead of squashing.' },
	{ to: '/designer/poster', title: 'Poster studio', makes: 'Flyers, posters and portrait graphics', description: 'Create a portrait flyer with image, text and shape layers on the shared editor model. Multi-select, align, distribute, rulers, undo and HTML export.' },
	{ to: '/designer/social-card', title: 'Social card designer', makes: 'Open Graph and link-preview images', description: 'The poster studio at link-preview sizes, with the linked HTML open. Select a source line to inspect its layer.' },
	{ to: '/designer/flowchart', title: 'Flowchart designer', makes: 'Process maps, diagrams and decision flows', description: 'An infinite workspace powered by Vue Flow. Connect editable steps, pan, zoom, navigate with a minimap and export your graph.' },
	{ to: '/designer/frames', title: 'Nested frames & HTML import', makes: 'Editable layouts from Tailwind HTML', description: 'Nest flow, flex, grid and absolute frames. Switch layouts, snap within a frame, and import Tailwind HTML into an editable canvas.' },
];
const assemblyGuide = { to: '/designer/assembly', title: 'Build your own designer', description: 'Working Vue examples and assembly documentation for combining these blocks into HTML editors, appearance controls and flowcharts.' };
const buildingBlocks = [
	{
		title: 'Editor surface',
		description: 'Where people select, arrange and lay out HTML.',
		items: [
			{ to: '/designer/stage', title: 'HTML stage', component: 'DomDesignerStage', description: 'Add selection and optional movement to your own HTML. Your application owns the content and applies style changes.' },
			{ to: '/designer/layers', title: 'Layer tree', component: 'DomDesignerLayers', description: 'The same tree used by the canvas, with selection, keyboard navigation and optional drag-and-drop.' },
			{ to: '/designer/frame', title: 'Frame layout editor', component: 'DomFrameLayoutEditor', description: 'Flow, flex, grid and absolute layout settings with an alignment pad, gap and per-side padding.' },
		],
	},
	{
		title: 'Style controls',
		description: 'Inspector panels that edit one CSS concern each.',
		items: [
			{ to: '/designer/color-swatch', title: 'Colour swatch', component: 'DomColorSwatch', description: 'The theme editor’s colour control, available independently with a CSS expression and native picker.' },
			{ to: '/designer/background-editor', title: 'Background layers', component: 'DomBackgroundEditor', description: 'Stack solid fills, linear gradients and radial gradients with independent opacity.' },
			{ to: '/designer/border-editor', title: 'CSS border editor', component: 'DomBorderEditor', description: 'Edit border width, style and colour with the shared CSS border control.' },
			{ to: '/designer/shadow-editor', title: 'CSS shadow editor', component: 'DomShadowEditor', description: 'Compose drop shadows, inner shadows and rings. Reuses the theme editor’s layer controls.' },
			{ to: '/designer/backdrop-editor', title: 'Backdrop effects', component: 'DomBackdropEditor', description: 'Blur and saturate the content behind translucent HTML elements.' },
			{ to: '/designer/typography-editor', title: 'Typography editor', component: 'DomTypographyEditor', tag: 'New', description: 'Font family, weight, size, line height, letter spacing, style, decoration, alignment and case, like Figma’s text panel.' },
		],
	},
];

const route = useRoute();

/**
 * Scrolls to the section named by the URL hash; documentation routes keep scroll position by default.
 *
 * @returns {void}
 */
function revealHashTarget() {
	if (!route.hash || typeof document === 'undefined') return;
	nextTick(() => document.getElementById(route.hash.slice(1))?.scrollIntoView({ block: 'start' }));
}

onMounted(revealHashTarget);
watch(() => route.hash, revealHashTarget);
</script>
<template>
	<DomStudioLayout>
		<DocPage name="Designer" eyebrow="Visual editing for HTML and Vue" tag="Beta" tagline="Design with the real DOM, not a picture of it. Edit website pages and the Vue output of app generators visually, then ship the same source.">
			<DocSection title="Where this is going" eyebrow="Roadmap">
				<p class="text-muted-fg">Canvas is a Figma-style designer that renders real HTML instead of drawing to a canvas element. Because every layer is DOM, a design is already the shipped markup: Tailwind classes, theme tokens and live Vue components included. The canvas and the poster studio run on one editor model: a flat map of components by id, where each component type declares the properties the inspector shows and every edit is an undoable operation. The code view is two-way, so editing the Vue source updates the design. Studio moves onto the same core next, followed by live collaboration.</p>
			</DocSection>
			<DocSection title="Tools" eyebrow="Complete editors">
				<p class="text-muted-fg">Full design apps, ready to open and use. Each one is assembled from the building blocks below, so you can copy its source as the starting point for your own.</p>
				<div class="grid gap-4 md:grid-cols-2">
					<RouterLink v-for="tool in tools" :key="tool.to" :to="tool.to" class="group flex flex-col rounded-2xl border border-border p-6 transition hover:border-primary focus-visible:ring-2 focus-visible:ring-ring">
						<h3 class="text-lg font-semibold text-canvas-fg">{{ tool.title }} <span aria-hidden="true" class="text-muted-fg transition group-hover:text-primary">→</span><span v-if="tool.tag" class="ml-2 rounded bg-primary/10 px-1.5 py-0.5 align-middle text-xs font-medium text-primary">{{ tool.tag }}</span></h3>
						<p class="mt-2 flex-1 text-sm leading-6 text-muted-fg">{{ tool.description }}</p>
						<p class="mt-4 border-t border-border pt-3 text-sm text-canvas-fg"><span class="text-xs font-semibold uppercase tracking-wider text-muted-fg">Make</span><span class="ml-2">{{ tool.makes }}</span></p>
					</RouterLink>
				</div>
			</DocSection>
			<DocSection id="building-blocks" title="Building blocks" eyebrow="Components the tools are made from" class="scroll-mt-24">
				<p class="text-muted-fg">Small, focused Vue components. Use one on its own, such as a colour swatch in a settings form, or combine several into an editor of your own.</p>
				<RouterLink :to="assemblyGuide.to" class="block rounded-xl border border-border bg-secondary p-4 transition hover:border-primary focus-visible:ring-2 focus-visible:ring-ring">
					<span class="block text-xs font-semibold uppercase tracking-wider text-muted-fg">Assembly guide</span>
					<span class="mt-1 block font-semibold text-canvas-fg">{{ assemblyGuide.title }} →</span>
					<span class="mt-1 block text-sm leading-6 text-muted-fg">{{ assemblyGuide.description }}</span>
				</RouterLink>
				<div v-for="group in buildingBlocks" :key="group.title" class="space-y-3 pt-2">
					<div>
						<h3 class="font-semibold text-canvas-fg">{{ group.title }}</h3>
						<p class="text-sm text-muted-fg">{{ group.description }}</p>
					</div>
					<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
						<RouterLink v-for="block in group.items" :key="block.to" :to="block.to" class="min-w-0 rounded-lg border border-border px-3 py-2.5 transition hover:border-primary hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring">
							<span class="flex items-center gap-2 text-sm font-medium text-canvas-fg"><span class="truncate">{{ block.title }}</span><span v-if="block.tag" class="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{{ block.tag }}</span></span>
							<code class="mt-0.5 block truncate text-xs text-muted-fg">{{ block.component }}</code>
							<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ block.description }}</span>
						</RouterLink>
					</div>
				</div>
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
