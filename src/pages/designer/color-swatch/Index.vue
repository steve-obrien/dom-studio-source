<script setup>
import { ref } from 'vue';
import { DomColorSwatch } from '../../lib/vue';
const colour = ref('var(--primary)');
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
const example = '<DomColorSwatch v-model="colour" label="Brand colour" />';
</script>
<template>
	<DomStudioLayout>
		<DocPage name="Colour swatch" eyebrow="UI designer" tag="Beta" tagline="The theme editor colour control, usable on its own.">
			<DocSection title="Try it"><div class="max-w-xl"><DomColorSwatch v-model="colour" label="Brand colour" /><div class="mt-4 h-20 rounded-xl" :style="{ background: colour }"></div></div></DocSection>
			<DocSection title="Use in your application"><p class="mb-4 text-sm leading-6 text-muted-fg">Bind a CSS colour string. The text field preserves CSS expressions such as var(--primary); the native picker commits a colour. Invalid text restores the previous value.</p><CodeBlock :code="example" language="vue" /><RouterLink to="/designer/social-card" class="mt-4 block text-sm text-primary">Open the complete social-card example →</RouterLink></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
