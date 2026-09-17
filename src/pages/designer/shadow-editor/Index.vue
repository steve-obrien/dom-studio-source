<script setup>
import { computed, ref } from 'vue';
import { DomShadowEditor, createShadow, shadowListToCss } from '../../lib/vue';
const shadows = ref([{ ...createShadow(), id: 'example-shadow' }]);
const css = computed(() => shadowListToCss(shadows.value));
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
const example = '<DomShadowEditor v-model="shadows" />';
</script>
<template>
	<DomStudioLayout>
		<DocPage name="CSS shadow editor" eyebrow="UI designer" tag="Beta" tagline="Build CSS box shadows using the same layers as the theme editor.">
			<DocSection title="Try it"><div class="max-w-xl"><DomShadowEditor v-model="shadows" /><div class="m-10 rounded-xl border border-border bg-canvas p-8 text-center" :style="{ boxShadow: css }">Live shadow</div><code class="block break-all text-xs">{{ css }}</code></div></DocSection>
			<DocSection title="Use in your application"><p class="mb-4 text-sm leading-6 text-muted-fg">Import createShadow and shadowListToCss from @getdom/studio/vue. Each layer has id, enabled, kind (drop, inset or ring), color, alpha (0–100), x, y, blur and spread in pixels. The editor emits new arrays and change events with { layers, css }. It never mutates your input array.</p><CodeBlock :code="example" language="vue" /><RouterLink to="/designer/social-card" class="mt-4 block text-sm text-primary">Open the complete social-card example →</RouterLink></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
