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
const example = '<DomDesignerStage v-model="selected" positioning @style-change="applyStyle">\n\t<h2 data-designer-id="title" :style="titleStyle">Real HTML</h2>\n</DomDesignerStage>';
</script>
<template>
	<DomStudioLayout>
		<DocPage name="HTML stage" eyebrow="UI designer" tag="Beta" tagline="Selection and optional absolute positioning over your own HTML.">
			<DocSection title="Try it"><div class="max-w-xl"><div class="overflow-auto"><DomDesignerStage v-model="selected" positioning class="relative h-64 min-w-[320px] rounded-xl bg-secondary" @style-change="patch"><h3 data-designer-id="title" :style="style" class="rounded-lg bg-primary text-primary-fg">Drag this HTML heading</h3></DomDesignerStage></div></div></DocSection>
			<DocSection title="Use in your application"><p class="mb-4 text-sm leading-6 text-muted-fg">Mark slot elements with unique data-designer-id values. v-model controls selection. positioning enables drag and resize and emits style-change { id, style }; apply it to your model. Use positioned containing blocks within the stage. Rotations and independently transformed ancestors are not supported in this beta. interactive passes clicks through. Apps own undo, persistence and export.</p><CodeBlock :code="example" language="vue" /><RouterLink to="/designer/social-card" class="mt-4 block text-sm text-primary">Open the complete social-card example →</RouterLink></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
