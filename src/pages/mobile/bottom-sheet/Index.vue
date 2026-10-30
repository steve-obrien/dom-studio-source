<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import DomBottomSheet from './DomBottomSheet.vue';
import source from './DomBottomSheet.vue?raw';
import ReadingSheet from './examples/ReadingSheet.vue';
import exampleSource from './examples/ReadingSheet.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Bottom sheet" tag="<DomBottomSheet>" :tagline="DomBottomSheet.__doc.description">
			<DocSection title="Read, expand, and reply">
				<Example :source="exampleSource" title="Project discussion" filename="ReadingSheet.vue" presentation="iframe" :frame-height="680"><ReadingSheet /></Example>
			</DocSection>
			<DocSection title="Sizing and interaction">
				<div class="max-w-2xl space-y-4 text-sm leading-7 text-muted-fg">
					<p><code>snapPoints</code> are fractions of the available sheet viewport, capped to leave a top safe-area gap. This example uses <code>[0, 0.4, 0.7, 0.95]</code>. Zero enables drag dismissal. Without zero, dragging stops at the smallest visible height. Escape and Close remain available.</p>
					<p>Drag the handle to resize; the body keeps native scrolling at every height. Click the handle to cycle, or focus it and use Arrow Up/Down, Home, and End. Focusing an input expands the sheet to its largest stop. An interrupted gesture restores the previous stop.</p>
					<p>Use <code>v-model:snapPoint</code> for a controlled height. Otherwise the sheet resets to <code>initialSnapPoint</code> on each open. Content remains mounted, so unsent input survives dismissal.</p>
					<p>The standalone sheet teleports to its document body. Inside <code>DomAppShell</code>, put it in <code>#overlay</code> for containment, safe areas, and the shell’s keyboard sizing. Explicit <code>contained</code> requires a positioned, sized parent. The <code>footer</code> stays pinned while the body scrolls.</p>
					<p><a href="/mobile/inbox?preview=1" class="font-medium text-canvas-fg underline underline-offset-4">Try the full-screen inbox</a> for the combined swipe, sheet, and reply flow. Check software keyboard behaviour on target devices; an iframe preview cannot reproduce its containing page’s visual viewport.</p>
				</div>
			</DocSection>
			<DocSection title="Reference"><ComponentProps :component="DomBottomSheet" :source="source" /><ComponentSlots :component="DomBottomSheet" /><ComponentEvents :component="DomBottomSheet" /><ComponentKeyboard :component="DomBottomSheet" /></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
