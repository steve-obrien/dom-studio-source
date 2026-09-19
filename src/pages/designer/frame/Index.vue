<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
const example = `<DomDesignerFrame :layout="{ mode: 'flex', gap: 24, padding: 16 }">
	<DomDesignerFrame :layout="{ mode: 'absolute' }" style="flex: 1; height: 240px">
		<p style="position: absolute; left: 16px; top: 24px">Independent layout</p>
	</DomDesignerFrame>
</DomDesignerFrame>`;
</script>

<template>
	<DomStudioLayout><DocPage name="Designer frame" eyebrow="UI designer" tag="Beta" tagline="One HTML container. Independent child layout and placement in its parent.">
		<DocSection title="Nest layouts"><p class="text-sm leading-7 text-muted-fg">An absolute canvas can contain a flex row, which can contain another absolute composition. Each frame controls only its immediate children. Absolute child layout establishes a relative containing block; the frame itself can still participate in flex or grid.</p><RouterLink to="/designer/frames" class="mt-4 inline-block text-primary underline">Open nested frames and Tailwind HTML import →</RouterLink></DocSection>
		<DocSection title="Use a frame"><CodeBlock :code="example" language="vue" /><p class="mt-4 text-sm leading-7 text-muted-fg">DomDesignerFrame renders a div by default. Use as for another native container tag. layout accepts mode (flow, flex, grid, absolute), direction, wrap, gap and padding in pixels, justify, align, columns and rows. The application owns child styles, tree operations, persistence and history. Absolute mode does not rewrite slot children: give them absolute placement. DomFrameLayoutEditor emits a new layout through v-model; the host captures child geometry before switching modes.</p></DocSection>
		<DocSection title="Scoped movement and spacing"><p class="text-sm leading-7 text-muted-fg">Opt into frame-scoped on DomDesignerStage. Mark editor containers with data-designer-frame="absolute", "flex", "grid" or "flow", alongside their unique data-designer-id. Only children whose nearest frame is absolute receive move and resize handles. Alignment snaps use that frame and its immediate children; spacing snaps use those siblings only. Other stages, including the poster, retain their existing defaults. Rotated or independently transformed ancestors remain outside the stage's supported geometry.</p></DocSection>
		<DocSection title="Switching and import"><p class="text-sm leading-7 text-muted-fg">The demo snapshots immediate child geometry when entering absolute layout and restores it on subsequent returns. Flow, flex and grid release absolute offsets so the browser can arrange children. Geometry is measured in frame coordinates, including borders and scroll offsets. The HTML importer preserves native markup, literal text, safe inline styles and Tailwind classes in a script-disabled iframe. The existing Tailwind compiler supplies utilities absent from the app build. Responsive source rules remain active until layout controls add explicit inline overrides. The import is a native HTML fragment workflow; Vue expressions, scripts, embedded documents, SVG, stylesheet tags and application behaviour are not imported. Exports are HTML fragments requiring the same Tailwind and theme styles. Edits are session-only; undo includes imports and mode changes.</p></DocSection>
	</DocPage></DomStudioLayout>
</template>
