<script setup>
import { computed, ref } from 'vue';
import { DomBackdropEditor, createBackdrop, backdropToCss } from '../../lib/vue';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
const value = ref(createBackdrop({ enabled: true, blur: 12, saturate: 1.2 }));
const css = computed(() => backdropToCss(value.value));
const example = `<script setup>
import { computed, ref } from 'vue';
import { DomBackdropEditor, createBackdrop, backdropToCss } from '@getdom/studio/vue';
const value = ref(createBackdrop({ enabled: true, blur: 12, saturate: 1.2 }));
const css = computed(() => backdropToCss(value.value));
<\/script>
<template>
	<DomBackdropEditor v-model="value" />
	<div :style="{ backdropFilter: css, WebkitBackdropFilter: css }">Your HTML</div>
</template>`;
</script>
<template>
	<DomStudioLayout>
		<DocPage name="CSS backdrop editor" eyebrow="UI designer" tag="Beta" tagline="The theme designer’s backdrop controls as a reusable component.">
			<DocSection title="Try it"><div class="max-w-xl"><DomBackdropEditor v-model="value" /><div class="relative my-8 overflow-hidden rounded-xl bg-[repeating-linear-gradient(45deg,var(--primary)_0_12px,var(--secondary)_12px_24px)] p-8"><div class="rounded-xl border border-border bg-canvas/30 p-8 text-center" :style="{ backdropFilter: css, WebkitBackdropFilter: css }">Filtered backdrop</div></div><code class="block break-all text-xs">{{ css }}</code></div></DocSection>
			<DocSection title="Use in your application"><CodeBlock :code="example" language="vue" /></DocSection>
			<DocSection title="The model"><p class="text-sm leading-6 text-muted-fg">The backdrop record contains enabled, blur and saturate. Hiding the effect preserves its settings. Bind the serialized CSS to backdropFilter and WebkitBackdropFilter. The editor exposes blur from 0–40px and saturation from 0.5–1.8. v-model emits a copied record; change emits { backdrop, css }. The editor does not mutate your input. Use title to customize the section heading.</p></DocSection>
			<DocSection title="How the CSS works"><p class="text-sm leading-6 text-muted-fg">Backdrop filters affect pixels behind the element, not its own text or children. Use a transparent or translucent fill so the effect is visible. An opaque background covers the filtered result. Blur is measured in pixels; saturation is a multiplier, where 1 leaves saturation unchanged. This differs from the poster image filters, which affect the image itself. The theme designer maps the same values to skin CSS variables. Other applications can bind them inline without a stage or layer IDs.</p><RouterLink to="/designer/poster" class="mt-4 block text-sm text-primary">Try it on a poster text or shape layer →</RouterLink></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
