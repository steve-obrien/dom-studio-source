<script setup>
import { computed, ref } from 'vue';
import { DomShadowEditor, createShadow, shadowListToCss } from '../../lib/vue';
const shadows = ref([{ ...createShadow(), id: 'example-shadow' }]);
const css = computed(() => shadowListToCss(shadows.value));
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
const example = `<script setup>
import { computed, ref } from 'vue';
import { DomShadowEditor, createShadow, shadowListToCss } from '@getdom/studio/vue';
const shadows = ref([createShadow()]);
const style = computed(() => ({ boxShadow: shadowListToCss(shadows.value) }));
<\/script>

<template>
	<DomShadowEditor v-model="shadows" />
	<div :style="style">Your HTML</div>
</template>`;
</script>
<template>
	<DomStudioLayout>
		<DocPage name="CSS shadow editor" eyebrow="UI designer" tag="Beta" tagline="Build CSS box shadows using the same layers as the theme editor.">
			<DocSection title="Try it"><div class="max-w-xl"><DomShadowEditor v-model="shadows" /><div class="m-10 rounded-xl border border-border bg-canvas p-8 text-center" :style="{ boxShadow: css }">Live shadow</div><code class="block break-all text-xs">{{ css }}</code></div></DocSection>
			<DocSection title="Use in your application"><p class="mb-4 text-sm leading-6 text-muted-fg">Import createShadow and shadowListToCss from @getdom/studio/vue. Each layer has id, enabled, kind (drop, inset or ring), color, alpha (0–100), x, y, blur and spread in pixels. The editor emits new arrays and change events with { layers, css }. It never mutates your input array.</p><CodeBlock :code="example" language="vue" /><RouterLink to="/designer/social-card" class="mt-4 block text-sm text-primary">Open the complete social-card example →</RouterLink></DocSection>
			<DocSection title="How shadows reach your HTML"><p class="text-sm leading-6 text-muted-fg">The editor updates shadow records. shadowListToCss serializes enabled records into a comma-separated CSS box-shadow value, in list order: the first shadow is painted on top. Drop shadows sit outside the box, inset shadows inside it, and rings use spread without an offset or blur. These are CSS box shadows, not the filter: drop-shadow effect that follows an image’s opaque pixels. Shadows do not change layout dimensions.</p><p class="mt-3 text-sm leading-6 text-muted-fg">Bind the result to the element’s boxShadow style. No unique class or stage is required. Shadow record IDs identify rows in the editor; they are not CSS selectors. In the poster, the selected layer owns its shadows, and Vue applies the resulting inline style. z-index only determines layer stacking.</p></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
