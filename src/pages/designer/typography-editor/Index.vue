<script setup>
import { computed, ref } from 'vue';
import { DomTypographyEditor, createTypography, typographyToStyle } from '../../lib/vue';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';

const typography = ref(createTypography({ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 40, lineHeight: 1.1, letterSpacing: -0.5, fontWeight: '700' }));
const style = computed(() => typographyToStyle(typography.value));
const example = `<script setup>
import { computed, ref } from 'vue';
import { DomTypographyEditor, createTypography, typographyToStyle } from '@getdom/studio/vue';
const typography = ref(createTypography({ fontSize: 40, fontWeight: '700' }));
const style = computed(() => typographyToStyle(typography.value));
<\/script>

<template>
	<DomTypographyEditor v-model="typography" />
	<h1 :style="style">Your HTML</h1>
</template>`;
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Typography editor" eyebrow="UI designer" tag="Beta" tagline="Figma-style text controls for real HTML: font, weight, size, line height, letter spacing, style, alignment, case and colour.">
			<DocSection title="Try it">
				<div class="grid gap-8 md:grid-cols-[18rem_minmax(0,1fr)]">
					<DomTypographyEditor v-model="typography" />
					<div class="min-w-0 space-y-4">
						<p class="min-h-40 rounded-xl border border-border p-6" :style="style">The quick brown fox jumps over the lazy dog.</p>
						<code class="block break-all text-xs text-muted-fg">{{ style }}</code>
					</div>
				</div>
			</DocSection>
			<DocSection title="Use in your application">
				<p class="mb-4 text-sm leading-6 text-muted-fg">Bind a typography record. typographyToStyle turns it into a Vue style object; typographyToCssProperties gives kebab-case properties for inline CSS, and typographyFromCss reads them back. The editor copies the record rather than mutating it, and emits change with { typography, style }.</p>
				<CodeBlock :code="example" language="vue" />
			</DocSection>
			<DocSection title="The typography record">
				<p class="text-sm leading-6 text-muted-fg">Keys follow CSS in camelCase: fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, color, textAlign, fontStyle, textDecoration and textTransform. Numbers are pixels for fontSize and letterSpacing, and a multiple of the font size for lineHeight. Any value can also be CSS, such as 1.25rem or 0.02em, and an empty value inherits, which is how the canvas shows text styled by classes. Pass fonts to offer your own families; a family that is not listed still shows, and Custom font accepts any stack.</p>
				<div class="mt-4 flex flex-wrap gap-4 text-sm">
					<RouterLink to="/designer/canvas" class="text-primary">Edit text on the canvas →</RouterLink>
					<RouterLink to="/designer/poster" class="text-primary">Edit poster text →</RouterLink>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
