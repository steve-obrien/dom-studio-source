<script setup>
import { ref } from 'vue';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Demo from '../../_layout/Demo.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import { DomSelectInput } from '../../lib/vue';

const size = ref('md');

const usage = `<script setup>
import { DomSelectInput } from '@getdom/studio/vue';
import { ref } from 'vue';
const size = ref('md');
<\/script>

<template>
  <DomSelectInput
    v-model="size"
    label="Size"
    description="Three balanced sizes."
    :options="['sm', 'md', 'lg']"
  />
</template>`;

</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Select input"
			tagline="A pill-style segmented selector. Compact, keyboard-friendly, ideal for short option lists."
			tag="<DomSelectInput>"
		>
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomSelectInput"
					:initial="{ label: 'Size', description: 'Three balanced sizes.', options: ['sm', 'md', 'lg'], modelValue: 'md' }"
					title="Select input playground"
					description="Edit props in the inspector — options array and selected value update live."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Live preview">
				<Demo>
					<div class="w-full max-w-sm">
						<DomSelectInput
							v-model="size"
							label="Size"
							description="Three balanced sizes."
							:options="['sm', 'md', 'lg']"
						/>
						<p class="mt-3 text-xs text-muted-fg">Value: <code class="text-canvas-fg">{{ size }}</code></p>
					</div>
				</Demo>
			</DocSection>

			<DocSection eyebrow="Usage" title="Vue">
				<CodeBlock :code="usage" lang="vue" />
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomSelectInput" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
