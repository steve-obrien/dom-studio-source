<script setup>
import { ref } from 'vue';
import { DomDesignerStage } from '../../lib/vue';
const selected = ref('title');
const style = ref({ position: 'absolute', left: '30px', top: '40px', width: '220px', padding: '20px' });
/** Applies stage CSS changes to application-owned state. */
function patch(event) { Object.assign(style.value, event.style); }
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Example from '../../_layout/docs/Example.vue';
import EqualSpacing from './examples/EqualSpacing.vue';
import equalSpacingSource from './examples/EqualSpacing.vue?raw';
const multiExample = '<DomDesignerStage v-model="primary" v-model:selection="selection" positioning reorder @style-change="applyStyle" @reorder="moveLayer">\n\t<!-- Marked layers -->\n</DomDesignerStage>';
const example = '<DomDesignerStage v-model="selected" positioning @style-change="applyStyle">\n\t<h2 data-designer-id="title" :style="titleStyle">Real HTML</h2>\n</DomDesignerStage>';
</script>
<template>
	<DomStudioLayout>
		<DocPage name="HTML stage" eyebrow="UI designer" tag="Beta" tagline="Selection and optional absolute positioning over your own HTML.">
			<DocSection title="Try it"><div class="max-w-xl"><div class="overflow-auto"><DomDesignerStage v-model="selected" positioning class="relative h-64 min-w-[320px] rounded-xl bg-secondary" @style-change="patch"><h3 data-designer-id="title" :style="style" class="rounded-lg bg-primary text-primary-fg">Drag this HTML heading</h3></DomDesignerStage></div></div></DocSection>
			<DocSection title="Use in your application"><p class="mb-4 text-sm leading-6 text-muted-fg">Mark slot elements with unique data-designer-id values. v-model controls selection. positioning enables drag and resize and emits style-change { id, style }; apply it to your model. Use positioned containing blocks within the stage. Rotations and independently transformed ancestors are not supported in this beta. interactive passes clicks through. Apps own undo, persistence and export.</p><CodeBlock :code="example" language="vue" /><RouterLink to="/designer/social-card" class="mt-4 block text-sm text-primary">Open the complete social-card example →</RouterLink></DocSection>
			<DocSection title="Layer identity and styling"><p class="text-sm leading-6 text-muted-fg">Your application creates unique layer IDs and marks the HTML with data-designer-id. The stage reads those IDs to link selection and style-change events to your model; it does not create IDs, CSS classes or stylesheet rules. Border and shadow editors update records on the selected layer, and the application binds those values to CSS. Layer z-index controls stacking only. Editor overlays and snap guides are separate from exported content.</p></DocSection>
			<DocSection id="spacing" title="Optional equal-spacing snaps">
				<p class="text-sm leading-7 text-muted-fg">Set spacing-snapping to enable a separate translation snap stage. It defaults to false and works independently of snapping, which enables edge and centre alignment. Alignment wins on an axis; spacing fills only axes without an alignment match. Hold Control to bypass both. Equal spacing does not alter resizing or keyboard nudges.</p>
				<Example :source="equalSpacingSource" filename="EqualSpacing.vue" title="Repeat an existing gap" description="A 10px horizontal gap with independent alignment and spacing switches. The same behaviour works vertically."><EqualSpacing /></Example>
				<p class="text-sm leading-7 text-muted-fg">At pointer-down, the stage snapshots eligible visible layers, excluding itself, the dragged layer and its ancestors/descendants. A gap is a positive distance to the next non-overlapping neighbour in a shared row or column. The moving layer must overlap that shared row/column. Targets extend the gap before and after the pair; they do not distribute items, edit padding or enforce collision avoidance.</p>
				<p class="text-sm leading-7 text-muted-fg">Spacing uses the existing 6-screen-pixel acquisition and 10-screen-pixel release distances at any zoom. Rulers show the reference and repeated gaps in document pixels. The interval sweep builds O(n log n) indexes once per gesture, with O(n) targets; pointer updates search only targets within the snap range and reuse that snapshot. Turning spacing off skips its index construction entirely.</p>
			</DocSection>
			<DocSection id="multi-select" title="Multi-select and reordering">
				<p class="text-sm leading-7 text-muted-fg">Bind v-model:selection to an array of IDs to allow several layers. Shift-click (or Cmd-click) adds or removes a layer; a plain click selects one. v-model stays the primary layer, which shows the handles. Dragging it, or nudging with the arrow keys, emits a style-change for every selected layer that can be positioned, so the group moves together. Align and distribute are application operations: alignRects and distributeRects in alignGeometry.js return new positions.</p>
				<p class="text-sm leading-7 text-muted-fg">Set reorder to drag layers inside flow, flex and grid frames (elements marked data-designer-frame). A line shows where the layer will land; on release the stage emits reorder { id, parent, before }, where before is the sibling it goes in front of, or null for the end. Apply it as a move in your model. Absolute frames keep free positioning.</p>
				<CodeBlock :code="multiExample" lang="vue" filename="Selection and reorder" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
