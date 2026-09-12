<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import DomSparkline from './DomSparkline.vue';
import InlineTrends from './examples/InlineTrends.vue';
import InlineTrendsSource from './examples/InlineTrends.vue?raw';
const doc = DomSparkline.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag" eyebrow="Data Visualisation">
			<DocSection title="Trends inside a revenue table">
				<Example :source="InlineTrendsSource" filename="InlineTrends.vue"><InlineTrends /></Example>
			</DocSection>
			<DocSection title="Working with your data">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">The compact chart hides its heading visually, but retains an accessible name and keyboard inspection. Provide a meaningful title when embedding it in a card or table. Enable showTable when a standalone data alternative is needed.</p>
				<RouterLink to="/charts" class="text-sm font-medium underline underline-offset-4">Explore Data Visualisation</RouterLink>
			</DocSection>
			<DocSection title="Reference"><ComponentProps :component="DomSparkline" /><ComponentEvents :component="DomSparkline" /><ComponentKeyboard :component="DomSparkline" /></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
