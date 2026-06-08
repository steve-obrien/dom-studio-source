<script setup>
import { ref } from 'vue';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Demo from '../../_layout/Demo.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import { DomColorInput } from '../../lib/vue';

const accent = ref('#0ea5e9');

const usage = `<script setup>
import { DomColorInput } from '@getdom/studio/vue';
import { ref } from 'vue';
const accent = ref('#0ea5e9');
<\/script>

<template>
  <DomColorInput
    v-model="accent"
    label="Accent colour"
    description="Used for primary buttons and links."
  />
</template>`;

</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Color input"
			tagline="Native colour picker paired with a hex text field — both bound to the same value."
			tag="<DomColorInput>"
		>
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomColorInput"
					:initial="{ label: 'Brand colour', description: 'Used for accents and links.', modelValue: '#3b82f6' }"
					title="Color input playground"
					description="Edit props in the inspector — picker and hex field share the same value."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Live preview">
				<Demo>
					<div class="w-full max-w-sm space-y-3">
						<DomColorInput
							v-model="accent"
							label="Accent colour"
							description="Used for primary buttons and links."
						/>
						<div class="flex items-center gap-2 text-sm">
							<span class="size-6 rounded-md ring-1 ring-border" :style="{ background: accent }"></span>
							<code class="text-foreground">{{ accent }}</code>
						</div>
					</div>
				</Demo>
			</DocSection>

			<DocSection eyebrow="Usage" title="Vue">
				<CodeBlock :code="usage" lang="vue" />
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomColorInput" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
