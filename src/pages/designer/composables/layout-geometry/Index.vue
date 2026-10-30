<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import PropsTable from '../../../_layout/PropsTable.vue';
import Example from '../../../_layout/docs/Example.vue';
import ArrangeExample from '../examples/ArrangeExample.vue';
import arrangeSource from '../examples/ArrangeExample.vue?raw';

const usage = `<script setup>
import { DomDesignerStage } from '@getdom/studio/vue';
import { DomEditorRender, useEditorSession, useLayoutGeometry } from '@getdom/studio/designer';

const session = useEditorSession({ workspace, afterChange: () => layout.refresh() });
const { selected, selection, doc } = session;
const layout = useLayoutGeometry({ session, element: (id) => findRendered(id) });
const { detected, canArrange } = layout;
<\/script>

<template>
	<DomDesignerStage v-model="selected" v-model:selection="selection" positioning frame-scoped @style-change="layout.patch">
		<DomEditorRender :doc="doc" :types="types" :detected="detected" />
	</DomDesignerStage>
	<button :disabled="!canArrange" @click="layout.align('top')">Align top</button>
	<button :disabled="!canArrange" @click="layout.distribute('horizontal')">Distribute</button>
</template>`;

const pure = `import { alignRects, boundsOf, distributeRects } from '@getdom/studio/designer';

const rects = [{ id: 'a', left: 10, top: 20, width: 40, height: 40 }, { id: 'b', left: 100, top: 90, width: 48, height: 64 }];
alignRects(rects, 'top');               // both at top 20, the top of their bounds
alignRects(rects, 'left', frameBox);     // both against the left of frameBox
distributeRects([...rects, c], 'horizontal'); // equal gaps, outer two stay put`;

const options = [
	{ name: 'session', type: 'EditorSession', default: '', description: 'The session whose selection is measured and moved.' },
	{ name: 'element', type: '(id) => HTMLElement | null', default: '', description: 'The rendered element for a node id, in the artboard being edited.' },
	{ name: 'isFrame', type: '(node) => boolean', default: 'HTML containers', description: 'Whether a node lays out children. By default div, section, article and the other HTML containers.' },
];
const returns = [
	{ name: 'align(alignment)', type: 'function', description: 'left, center, right, top, middle or bottom. One layer aligns inside its frame’s padding. Several align to the edges or centres of their own bounds, as in Figma. One undo step.' },
	{ name: 'distribute(axis)', type: 'function', description: 'horizontal or vertical. Three or more layers get equal gaps; the outer two stay where they are.' },
	{ name: 'canArrange', type: 'ComputedRef<boolean>', description: 'True when the selection shares an absolute frame, so align and distribute can place it by X and Y.' },
	{ name: 'patch(event)', type: 'function', description: 'Applies a stage style-change: a drag, resize or arrow-key nudge. Layers moved together are one undo step.' },
	{ name: 'setGeometry(key, value)', type: 'function', description: 'Sets left, top, width or height on the primary layer, for X, Y, W and H fields.' },
	{ name: 'geometry', type: 'ComputedRef', description: 'The primary layer’s box in its frame: its placement, or else as rendered.' },
	{ name: 'measure(id)', type: 'function', description: 'Any layer’s rendered box in its parent frame.' },
	{ name: 'selectedNodes', type: 'ComputedRef', description: 'The selected layers, without any that sit inside another selected layer.' },
	{ name: 'sharedParent', type: 'ComputedRef', description: 'The frame every selected layer shares, or null.' },
	{ name: 'detected', type: 'Ref', description: 'Each frame’s layout as the browser resolves it from its classes. Pass to DomEditorRender.' },
	{ name: 'refresh()', type: 'function', description: 'Reads frame layouts again after the DOM settles. Call it after changes and when an artboard renders.' },
	{ name: 'layoutOf(id), modeOf(id)', type: 'function', description: 'A frame’s layout and its mode: flow, flex, grid or absolute.' },
	{ name: 'parentMode, parentLayout', type: 'ComputedRef', description: 'The same for the primary layer’s parent, for an inspector.' },
	{ name: 'captureOperations, adoptOperations', type: 'function', description: 'Operations that record children’s boxes, so a frame can switch to absolute without anything moving.' },
];
const functions = [
	{ name: 'boundsOf(rects)', type: 'function', description: 'The smallest box around every rectangle.' },
	{ name: 'alignRects(rects, alignment, bounds?)', type: 'function', description: 'New rectangles aligned to a line of bounds (the rectangles’ own by default), rounded to whole pixels.' },
	{ name: 'distributeRects(rects, axis)', type: 'function', description: 'New rectangles with equal gaps along an axis, in the input order.' },
	{ name: 'measureFrameChild(element, frame)', type: 'function', description: 'An element’s box in its frame’s CSS pixels, allowing for borders, scrolling and zoom.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage name="useLayoutGeometry" eyebrow="Designer composable" tag="Beta" tagline="Where layers sit and how they move: drags, X/Y/W/H, and align and distribute for one layer or several.">
			<DocSection title="What it does">
				<p class="text-muted-fg">It measures layers as the browser renders them and writes their new positions through the session, so every move is undoable and reaches the code. It reads each frame’s layout from its classes, so a frame made absolute with Tailwind behaves like one set in the designer.</p>
				<p class="text-muted-fg">Locked layers (<code>node.locked</code>) stay where they are: drags, X/Y/W/H and align skip them, though they still count toward a selection’s bounds. Hidden layers (<code>node.hidden</code>) are left out of the canvas but stay in the code, and keep the place their classes give them.</p>
				<p class="text-muted-fg">Positions apply to layers in an absolute frame. Moving one adopts the frame first: every child’s current box is recorded, so nothing else jumps. Layers in flow, flex and grid frames are reordered on the stage instead.</p>
			</DocSection>
			<DocSection title="Try it" eyebrow="Example">
				<Example :source="arrangeSource" filename="ArrangeExample.vue"><ArrangeExample /></Example>
			</DocSection>
			<DocSection title="Use it">
				<CodeBlock :code="usage" language="vue" />
				<p class="text-muted-fg">Multiple selection lives in the session: <code>selected</code> is the primary layer and <code>selection</code> holds them all. Bind <code>v-model:selection</code> on the stage and <code>v-model:values</code> on DomDesignerLayers, and Shift-click works in both.</p>
			</DocSection>
			<DocSection title="API">
				<PropsTable title="Options" :rows="options" />
				<PropsTable title="Returns" :rows="returns" />
			</DocSection>
			<DocSection title="The maths on its own">
				<p class="text-muted-fg">The composable is built on plain functions over rectangles. Use them in any editor, such as one that keeps positions in its own data.</p>
				<CodeBlock :code="pure" language="js" />
				<PropsTable title="Functions" :rows="functions" />
			</DocSection>
			<DocSection title="Related">
				<p class="text-muted-fg">Snapping while dragging is part of <RouterLink to="/designer/stage" class="text-primary">DomDesignerStage</RouterLink>. <RouterLink to="/designer/composables" class="text-primary">All composables →</RouterLink></p>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
