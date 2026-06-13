<script setup>
import { ref } from 'vue';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Demo from '../../_layout/Demo.vue';
import Playground from '../../_layout/docs/Playground.vue';
import PropsTable from '../../_layout/PropsTable.vue';
import { DomNumberInput } from '../../lib/vue';

const qty = ref(3);

const usage = `<script setup>
import { DomNumberInput } from '@getdom/studio/vue';
import { ref } from 'vue';
const qty = ref(1);
<\/script>

<template>
  <DomNumberInput
    v-model="qty"
    label="Quantity"
    description="Between 1 and 99."
    :min="1"
    :max="99"
  />
</template>`;

const props = [
	{ name: 'v-model', type: 'number', default: '0', description: 'Bound numeric value.' },
	{ name: 'label', type: 'string', default: '—', description: 'Label above the input.' },
	{ name: 'description', type: 'string', default: '—', description: 'Hint shown below the input.' },
	{ name: 'min / max / step', type: 'number', default: '—', description: 'Native numeric constraints.' },
	{ name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the input.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Number input"
			tagline="A labelled number field with native min / max / step support."
			tag="<DomNumberInput>"
		>
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomNumberInput"
					:initial="{ label: 'Quantity', description: 'Items per order.', min: 1, max: 99, step: 1, modelValue: 1 }"
					title="Number input playground"
					description="Edit props in the inspector — min, max, step, and label update live."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Live preview">
				<Demo>
					<div class="w-full max-w-sm">
						<DomNumberInput
							v-model="qty"
							label="Quantity"
							description="Between 1 and 99."
							:min="1"
							:max="99"
						/>
						<p class="mt-3 text-xs text-muted-fg">Value: <code class="text-canvas-fg">{{ qty }}</code></p>
					</div>
				</Demo>
			</DocSection>

			<DocSection eyebrow="Usage" title="Vue">
				<CodeBlock :code="usage" lang="vue" />
			</DocSection>

			<DocSection title="Props">
				<PropsTable :rows="props" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
