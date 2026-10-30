<script setup>
import { computed, ref } from 'vue';
import { DomBackgroundEditor, createBackgroundState, backgroundImageToCss } from '../../lib/vue';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
const value = ref(createBackgroundState({ fills: [{ kind: 'linear', gradientFrom: '#f4d35e', gradientTo: '#4f46e5' }] }));
if (value.value.fills[0]) value.value.fills[0].id = 'background-demo';
const css = computed(() => backgroundImageToCss(value.value));
const example = `<script setup>
import { computed, ref } from 'vue';
import { DomBackgroundEditor, createBackgroundState, backgroundImageToCss } from '@getdom/studio/vue';
const value = ref(createBackgroundState({ fills: [{ kind: 'linear', gradientFrom: '#f4d35e', gradientTo: '#4f46e5' }] }));
const css = computed(() => backgroundImageToCss(value.value));
<\/script>
<template>
	<DomBackgroundEditor v-model="value" />
	<div :style="{ backgroundImage: css }">Your HTML</div>
</template>`;
</script>
<template>
	<DomStudioLayout>
		<DocPage name="CSS background editor" eyebrow="UI designer" tag="Beta" tagline="The theme designer’s background controls as a reusable component.">
			<DocSection title="Try it"><div class="max-w-xl"><DomBackgroundEditor v-model="value" /><div class="my-8 h-44 rounded-xl border border-border p-8 text-center" :style="{ backgroundImage: css }">Layered background</div><code class="block break-all text-xs">{{ css }}</code></div></DocSection>
			<DocSection title="Use in your application"><CodeBlock :code="example" language="vue" /></DocSection>
			<DocSection title="The model"><p class="text-sm leading-6 text-muted-fg">The background record contains enabled and fills. Each fill has an id, enabled, kind (solid, linear or radial), color and alpha, plus gradientFrom, gradientTo, gradientFromAlpha, gradientToAlpha, gradientAngle, gradientFromStop and gradientToStop. Alpha and stops use 0–100; angles use degrees. Add, duplicate, hide and remove fills in the layer list. New fills are placed first. v-model emits a copied record; change emits { background, css }. The editor does not mutate your input. Use title to customize the section heading.</p></DocSection>
			<DocSection title="How the CSS works"><p class="text-sm leading-6 text-muted-fg">Each enabled fill becomes a CSS background image. Solid fills are represented as flat gradients so they can be layered legally alongside linear and radial gradients. The first fill is painted on top. Alpha exposes lower layers; hiding a fill preserves its values. The underlying background colour remains separate. These controls do not create additional DOM elements or z-index classes. The theme designer maps the same values to skin CSS variables. Other applications can bind them inline without a stage or layer IDs.</p><RouterLink to="/designer/poster" class="mt-4 block text-sm text-primary">Try it on a poster text or shape layer →</RouterLink></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
