<script setup>
import { computed, ref } from 'vue';
import { DomBorderEditor, createDesignerBorder, borderToCss } from '../../lib/vue';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
const border = ref(createDesignerBorder({ width: 3 }));
const css = computed(() => borderToCss(border.value));
const example = `<script setup>
import { computed, ref } from 'vue';
import { DomBorderEditor, createDesignerBorder, borderToCss } from '@getdom/studio/vue';
const border = ref(createDesignerBorder({ width: 3 }));
const style = computed(() => ({ border: borderToCss(border.value), boxSizing: 'border-box' }));
<\/script>

<template>
	<DomBorderEditor v-model="border" />
	<div :style="style">Your HTML</div>
</template>`;
</script>

<template>
	<DomStudioLayout>
		<DocPage name="CSS border editor" eyebrow="UI designer" tag="Beta" tagline="A reusable border control for real HTML, shared with the CSS button creator.">
			<DocSection title="Try it"><div class="max-w-xl"><DomBorderEditor v-model="border" /><div class="m-8 rounded-xl bg-secondary p-8 text-center" :style="{ border: css, boxSizing: 'border-box' }">Live border</div><code class="block break-all text-xs">{{ css }}</code></div></DocSection>
			<DocSection title="Use in your application"><CodeBlock :code="example" language="vue" /></DocSection>
			<DocSection title="The border model"><p class="text-sm leading-6 text-muted-fg">The record contains enabled, width in pixels, style (solid, dashed, dotted, double or none), and color as a CSS colour. Hiding a border preserves its settings. v-model emits a new record; change emits { border, css }. The editor copies incoming state rather than mutating your object. title defaults to Border and maxWidth defaults to 40 pixels. This control applies one border to all four sides; radius and per-side borders are separate concerns.</p></DocSection>
			<DocSection title="How styles reach your HTML"><p class="text-sm leading-6 text-muted-fg">The control edits data, not a stylesheet. Bind borderToCss(border) to your element’s border style. No stage, layer ID or generated CSS class is required. In a designer, your application identifies the selected layer and passes its border record to the control. Use border-box sizing to keep the outer dimensions fixed as the border grows; the available content area gets smaller. Borders affect the box model, unlike outer box shadows.</p><RouterLink to="/designer/poster" class="mt-4 block text-sm text-primary">Try borders on poster layers →</RouterLink></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
