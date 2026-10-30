<script setup>
import { ref } from 'vue';
import { DomDesignerLayers } from '../../lib/vue';
const selected = ref('title');
const items = [{ id: 'card', label: 'Card', open: true, children: [{ id: 'title', label: 'Title' }, { id: 'caption', label: 'Caption' }] }];
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
const example = '<DomDesignerLayers v-model="selected" :items="layers" />';
</script>
<template>
	<DomStudioLayout>
		<DocPage name="Layer tree" eyebrow="UI designer" tag="Beta" tagline="Studio’s layer tree as an independent building block.">
			<DocSection title="Try it"><div class="max-w-xl"><DomDesignerLayers v-model="selected" :items="items" /><p class="mt-3 text-sm text-muted-fg">Selected: {{ selected }}</p></div></DocSection>
			<DocSection title="Use in your application"><p class="mb-4 text-sm leading-6 text-muted-fg">Pass DomTreeView items with unique IDs, labels and children. Bind the same selection ID to a stage. All DomTreeView attributes, slots and events pass through, including reorder, hover, open-values and external drops.</p><CodeBlock :code="example" language="vue" /><RouterLink to="/designer/social-card" class="mt-4 block text-sm text-primary">Open the complete social-card example →</RouterLink></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
