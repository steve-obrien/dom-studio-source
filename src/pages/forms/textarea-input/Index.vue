<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import { DomTextareaInput } from '../../lib/vue';

import AutosizeTextarea from './examples/AutosizeTextarea.vue';
import AutosizeTextareaSrc from './examples/AutosizeTextarea.vue?raw';

const doc = DomTextareaInput.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomTextareaInput"
					:initial="{ label: 'Bio', description: 'A short public summary.', placeholder: 'Tell us about yourself…', rows: 2, autosize: true, maxRows: 6 }"
					title="Textarea playground"
					description="Use rows as the starting height, enable autosize for content-driven growth, and set maxRows when the field should eventually scroll."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Unlimited and bounded growth">
				<Example
					:source="AutosizeTextareaSrc"
					filename="AutosizeTextarea.vue"
					description="The same autosize API supports continuous expansion or a fixed maximum before internal scrolling begins."
					default-open
				>
					<AutosizeTextarea />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomTextareaInput" />
				<ComponentEvents :component="DomTextareaInput" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
