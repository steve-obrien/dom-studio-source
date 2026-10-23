<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import HtmlDesigner from './examples/HtmlDesigner.vue';
import htmlSource from './examples/HtmlDesigner.vue?raw';
import LayerAppearance from './examples/LayerAppearance.vue';
import appearanceSource from './examples/LayerAppearance.vue?raw';
import FlowDesigner from './examples/FlowDesigner.vue';
import flowSource from './examples/FlowDesigner.vue?raw';
import posterSource from '../poster/PosterStudio.vue?raw';
import posterModel from '../poster/posterModel.js?raw';
import posterTypes from '../poster/posterTypes.js?raw';
import socialSource from '../social-card/Index.vue?raw';
import fullFlowSource from '../flowchart/Index.vue?raw';

const pieces = [
	['DomSplitterPanel', '/components/splitter-panel', 'Resizes the shell panes. Bind startSize/endSize if your app wants to remember widths.'],
	['DomDesignerLayers', '/designer/layers', 'Displays your tree. Its selected ID is shared with the stage and inspector.'],
	['DomDesignerStage', '/designer/stage', 'Selects marked HTML and emits CSS patches for movement and resizing. Positioning, snapping, spacing snaps, multi-select (v-model:selection), frame-scoped movement and flow reordering (reorder) are opt-in.'],
	['DomDesignerFrame', '/designer/frame', 'A container whose children use flow, flex, grid or absolute layout. Each frame controls only its immediate children.'],
	['DomFrameLayoutEditor', '/designer/frame', 'Compact layout panel for a frame: mode, direction, a 3×3 alignment pad, gap, and padding per side. Emits a new layout through v-model.'],
	['DomColorSwatch', '/designer/color-swatch', 'Edits a CSS colour string. Bind it to the selected layer’s colour or fill.'],
	['DomBorderEditor', '/designer/border-editor', 'Edits a border record; borderToCss produces the CSS border value.'],
	['DomShadowEditor', '/designer/shadow-editor', 'Edits shadow records; shadowListToCss produces box-shadow.'],
	['DomBackgroundEditor', '/designer/background-editor', 'Edits ordered fills; backgroundImageToCss produces stacked CSS backgrounds.'],
	['DomBackdropEditor', '/designer/backdrop-editor', 'Edits blur/saturation; backdropToCss produces backdrop-filter.'],
];
const setup = "import '@getdom/studio/style.css';";
const monacoExample = `import { DomMonacoCodeView } from '@getdom/studio/designer';

// Your app installs monaco-editor and decides how it is bundled.
async function load() {
	await import('monaco-editor/min/vs/editor/editor.main.css');
	return import('monaco-editor/esm/vs/editor/editor.api');
}

// <DomDesigner :catalog="catalog" :code-editor="DomMonacoCodeView" :code-editor-props="{ load }" />`;
const designerExample = `import * as studio from '@getdom/studio/vue';
import { DomDesigner, catalogFromExports, createHttpStorage } from '@getdom/studio/designer';

// Every Dom* component becomes insertable, with an inspector generated from its props.
const catalog = catalogFromExports(studio);
// GET/PUT {endpoint}/{id}. Omit storage to save in this browser.
const storage = createHttpStorage({ endpoint: '/api/designs' });

// <DomDesigner :catalog="catalog" :storage="storage" storage-key="home-page" />`;
const flowSetup = 'npm install @vue-flow/core @vue-flow/background @vue-flow/controls @vue-flow/minimap';
const zoomExample = `<!-- Keep document coordinates separate from viewport scale. -->
<div class="overflow-auto">
	<div :style="{ width: width * zoom + 'px', height: height * zoom + 'px' }">
		<DomDesignerStage
			v-model="selected" positioning snapping
			:style="{ width: width + 'px', height: height + 'px', transform: 'scale(' + zoom + ')', transformOrigin: 'top left', position: 'relative' }"
			@style-change="applyStyle"
		>
			<!-- Render your layers here. -->
		</DomDesignerStage>
	</div>
</div>`;
const sources = [
	{ name: 'Poster studio', filename: 'src/pages/designer/poster/PosterStudio.vue', code: posterSource },
	{ name: 'Poster types and document conversion', filename: 'src/pages/designer/poster/posterTypes.js', code: posterTypes },
	{ name: 'Poster model and HTML export', filename: 'src/pages/designer/poster/posterModel.js', code: posterModel },
	{ name: 'Social card preset', filename: 'src/pages/designer/social-card/Index.vue', code: socialSource },
	{ name: 'Flowchart editor', filename: 'src/pages/designer/flowchart/Index.vue', code: fullFlowSource },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Build your own designer" eyebrow="UI designer · Assembly guide" tag="Beta" tagline="Working examples, component contracts and the application code that turns them into an editor.">
			<DocSection title="Start here">
				<p class="mb-4 text-sm leading-7 text-muted-fg">The demos are reference applications. Start with the smaller examples below, then add the behaviour your product needs. Each preview and its copyable source come from the same Vue file.</p>
				<nav class="flex flex-wrap gap-4 text-sm text-primary" aria-label="Assembly recipes"><a href="#canvas">Whole designer</a><a href="#html">HTML editor</a><a href="#appearance">Appearance</a><a href="#poster">Poster</a><a href="#social-card">Social card</a><a href="#flowchart">Flowchart</a><a href="#sources">Full source</a></nav>
				<p class="my-4 text-sm leading-7 text-muted-fg">Use the package in an existing Vue 3 application, or copy the components through the example’s Source option. The examples use Tailwind CSS v4 utilities; keep your app’s Tailwind setup scanning the files you copy. <RouterLink to="/install" class="text-primary underline">Installation guide</RouterLink>.</p>
				<CodeBlock code="npm install @getdom/studio" lang="bash" />
				<CodeBlock :code="setup" lang="javascript" filename="Application entry point" />
			</DocSection>
			<DocSection id="canvas" title="Embed the whole designer">
				<p class="mb-4 text-sm leading-7 text-muted-fg">If you want the complete canvas rather than your own editor, use DomDesigner from <code>@getdom/studio/designer</code>. It is the editor behind <RouterLink to="/designer/canvas" class="text-primary underline">the canvas demo</RouterLink>: artboards at several widths, layers, an inspector generated from component props, a Figma-style layout panel, undo, and a two-way Vue code view. The entry is separate from <code>@getdom/studio/vue</code> because it brings the Vue template compiler, so load it only where people design, ideally with defineAsyncComponent.</p>
				<CodeBlock :code="designerExample" lang="javascript" filename="Embedding DomDesigner" />
				<p class="mt-4 text-sm leading-7 text-muted-fg">Storage adapters decide where work is kept: createBrowserStorage (the default), createHttpStorage for your API or CMS, createMemoryStorage for tests, and createFileStorage with the file-storage prop to open and save project files. Pass compileCss to compile Tailwind classes that your app’s stylesheet lacks.</p>
				<p class="mt-4 text-sm leading-7 text-muted-fg">The code view is a lightweight editor by default. For a richer one, pass DomMonacoCodeView as code-editor, with a load function that imports Monaco from your own install; DOM Studio does not depend on Monaco. Both editors keep the code and stage in sync: put the caret on a line and its layer is selected on the stage; select a layer and its lines are highlighted and scrolled into view.</p>
				<CodeBlock :code="monacoExample" lang="javascript" filename="Optional Monaco code view" />
				<p class="mt-4 text-sm leading-7 text-muted-fg"> The same entry exports the editor core (documents, operations, history, Vue import and export) for building your own editor on the same model. The rest of this guide assembles editors from the individual components.</p>
			</DocSection>
			<DocSection title="Choose the pieces">
				<div class="overflow-auto"><table class="w-full text-left text-sm"><thead><tr class="border-b border-border"><th class="p-3">Component</th><th class="p-3">Responsibility</th></tr></thead><tbody><tr v-for="[name, path, role] in pieces" :key="name" class="border-b border-border"><td class="p-3 align-top"><RouterLink :to="path" class="text-primary underline">{{ name }}</RouterLink></td><td class="p-3 leading-6 text-muted-fg">{{ role }}</td></tr></tbody></table></div>
			</DocSection>
			<DocSection id="html" title="1. Connect layers, stage and inspector">
				<p class="text-sm leading-7 text-muted-fg">Keep stable IDs, content and styles in your own records. Bind one selected ID to both the tree and stage. Mark rendered elements with data-designer-id. The inspector finds that record by ID; apply each style-change { id, style } patch to it. Vue then updates the HTML. The stage does not create records, CSS classes or stylesheet rules.</p>
				<Example :source="htmlSource" filename="HtmlDesigner.vue" title="A minimal HTML editor" description="Select from the tree or stage, edit the text, drag the outline, resize its handles, or resize the sidebar." default-open><HtmlDesigner /></Example>
				<p class="text-sm leading-7 text-muted-fg">For repeated gaps, add :spacing-snapping="true" to the stage. This independent, default-off step fills axes without an alignment match while dragging. <RouterLink to="/designer/stage#spacing" class="text-primary underline">Try the equal-spacing example and copy its source →</RouterLink></p>
				<p class="text-sm leading-7 text-muted-fg">The example scrolls horizontally on narrow screens. The poster demo instead switches between Layers, Poster and Inspect tabs. Use positioning=false for selection without dragging, interactive=true to pass clicks through to preview content, and snapping=true for stage and visible-layer alignment. Hold Control to bypass snapping. Uniform stage scaling is supported; rotated layers and independently transformed ancestors are not supported in this beta.</p>
			</DocSection>
			<DocSection id="appearance" title="2. Turn control records into CSS">
				<p class="text-sm leading-7 text-muted-fg">Controls expose v-model values; serializers turn those values into CSS. In a multi-layer editor, store these records on each layer and bind the controls to the selected layer. Give every layer its own records and arrays. The controls do not apply styles to a selected DOM element themselves.</p>
				<Example :source="appearanceSource" filename="LayerAppearance.vue" title="Compose the appearance controls" description="Border, shadows, backgrounds and backdrop effects applied to one HTML element."><LayerAppearance /></Example>
				<p class="text-sm leading-7 text-muted-fg">Background fill order follows CSS: the first image is on top. Backdrop effects need translucent content to be visible. Box shadows and borders do not require a special layer class. Create fill records on the client, or assign deterministic fill IDs when server rendering.</p>
			</DocSection>
			<DocSection id="poster" title="3. Assemble the poster editor">
				<RouterLink to="/designer/poster" class="text-primary underline">Open poster demo →</RouterLink>
				<ol class="my-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-muted-fg">
					<li>Start with the HTML editor above. The poster is an editor document: a <code>poster:frame</code> root with text, image and shape layers whose x, y, width and height are document pixels. posterTypes.js declares each layer type’s inspector fields and converts the document to the poster model; posterModel.js supplies factories and style serialization.</li>
					<li>Put the layer tree in the splitter’s start slot, the scrollable stage in its default slot and the selected-layer controls in its end slot. Bind startSize and endSize independently.</li>
					<li>Use a fixed document size and scale the viewport separately. ResizeObserver recalculates “Fit” when a splitter moves. Convert style-change CSS values into numeric document coordinates before saving.</li>
					<li>Make every change an operation (setProp, insert, remove, move) and run it through the core history. Continuous edits pass a merge key so a drag or a typed value is one undo step. Viewport zoom is not a document edit.</li>
					<li>Bind <code>v-model:selection</code> on the stage for shift-click multi-select. alignRects and distributeRects in layoutGeometry.js return new positions for the selection; DesignerRulers draws rulers around the scaled artwork.</li>
					<li>Export from the model, including the serialized appearance values. Keep selection outlines, guides and editor attributes out of the output. Local uploads are embedded; linked photos remain external.</li>
				</ol>
				<CodeBlock :code="zoomExample" lang="vue" filename="Viewport pattern (inside your editor)" />
				<p class="mt-4 text-sm leading-7 text-muted-fg">Cmd/Ctrl + wheel uses a non-passive listener on the workspace, changes the zoom and compensates scroll position around the pointer. It leaves normal scrolling alone. See wheelZoom, mount and cleanup in the full source below for the complete implementation, including listener cleanup.</p>
			</DocSection>
			<DocSection id="social-card" title="4. Add a source view to a social card">
				<RouterLink to="/designer/social-card" class="text-primary underline">Open social-card demo →</RouterLink>
				<p class="mt-4 text-sm leading-7 text-muted-fg">The social card is the poster studio with a different starting document and link-preview formats, with its linked HTML open. posterHtmlLines derives one source line per layer and attaches the layer ID to it. Clicking a line selects the layer; selecting on the stage highlights the line. The source view is a projection of the document, not an editable HTML parser. For two-way editing, where changing the code updates the design, see the code view in DomDesigner above.</p>
			</DocSection>
			<DocSection id="flowchart" title="5. Assemble a flowchart editor">
				<RouterLink to="/designer/flowchart" class="text-primary underline">Open flowchart demo →</RouterLink>
				<p class="my-4 text-sm leading-7 text-muted-fg">Vue Flow owns the graph viewport, node dragging and connection geometry. DOM Studio provides the surrounding splitter, inputs and actions. There is no public DomFlowchart component: this is a composition with a separate Vue Flow dependency. Install the core and whichever companion components you use.</p>
				<CodeBlock :code="flowSetup" lang="bash" />
				<Example :source="flowSource" filename="FlowDesigner.vue" title="A minimal graph editor" description="Drag from the bottom dot of one node to the top dot of the other. Move nodes, pan empty space and use the zoom buttons."><FlowDesigner /></Example>
				<p class="text-sm leading-7 text-muted-fg">Give the graph a sized parent and an instance ID. Bind nodes and edges to application state; handle connect by adding an edge. Mount the interactive viewport after hydration. The full demo adds a node-step slot with Handle ports, an inspector, Controls and MiniMap. screenToFlowCoordinate converts a pointer or viewport centre into graph coordinates. toObject exports nodes, edges and viewport; fromObject restores a saved graph. Validate imported data in your app before restoring it.</p>
			</DocSection>
			<DocSection title="What your application owns">
				<p class="text-sm leading-7 text-muted-fg">Own the document schema, IDs, history, persistence, asset uploads, import validation and export. The poster, social-card and flowchart demos keep edits in memory until exported; they do not provide a storage service or run workflows. DomDesigner saves through the storage adapter you pass; your server still owns authentication, validation and the stored schema. For production, save the model rather than the live editor DOM, restore stable IDs, and keep selection and viewport preferences separate from document changes. The beta APIs may change.</p>
			</DocSection>
			<DocSection id="sources" title="Full demo source">
				<p class="mb-4 text-sm leading-7 text-muted-fg">These are the actual repository files, including local imports and route links. Use the starter examples above for a standalone component; use these files to inspect the complete application wiring. Poster needs its three files plus the shared editor core, designer components and serializers.</p>
				<details v-for="source in sources" :key="source.filename" class="mb-3 rounded-xl border border-border p-4"><summary class="cursor-pointer text-sm font-semibold">{{ source.name }}</summary><CodeBlock :code="source.code" :filename="source.filename" :lang="source.filename.endsWith('.js') ? 'javascript' : 'vue'" /></details>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
