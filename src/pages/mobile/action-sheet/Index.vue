<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import DomActionSheet from './DomActionSheet.vue';
import source from './DomActionSheet.vue?raw';
import DesktopActionSheet from './examples/DesktopActionSheet.vue';
import exampleSource from './examples/DesktopActionSheet.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Action sheet" tag="<DomActionSheet>" :tagline="DomActionSheet.__doc.description">
			<DocSection title="Mobile actions">
				<Playground :inspect="DomActionSheet" :initial="DomActionSheet.__doc.playground.initial" presentation="mobile" title="Action sheet playground" />
			</DocSection>
			<DocSection title="A desktop action sheet">
				<p class="text-sm leading-6 text-muted-fg">No app wrapper is required. The standalone sheet overlays the viewport and limits its width on desktop. In a DomAppShell, use its overlay slot to contain the sheet. Long lists scroll inside the sheet while Cancel stays visible. Escape, the backdrop, Cancel, and the handle dismiss it; focus returns to the opener.</p>
				<Example :source="exampleSource" title="Document actions" filename="DesktopActionSheet.vue" presentation="iframe" :frame-height="520">
					<DesktopActionSheet />
				</Example>
			</DocSection>
			<DocSection title="Reference">
				<ComponentProps :component="DomActionSheet" :source="source" />
			</DocSection>
			<ComponentEvents :component="DomActionSheet" :source="source" />
		</DocPage>
	</DomStudioLayout>
</template>
