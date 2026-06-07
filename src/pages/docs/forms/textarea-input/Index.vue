<script setup>
import { ref } from 'vue';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Demo from '../../_layout/Demo.vue';
import Playground from '../../_layout/docs/Playground.vue';
import PropsTable from '../../_layout/PropsTable.vue';
import { DomTextareaInput } from '../../lib/vue';

const bio = ref('Engineer, builder, founder.');

const usage = `<script setup>
import { DomTextareaInput } from '@getdom/studio/vue';
import { ref } from 'vue';
const bio = ref('');
<\/script>

<template>
  <DomTextareaInput
    v-model="bio"
    label="Bio"
    description="A short paragraph that appears under your name."
    :rows="4"
  />
</template>`;

const props = [
	{ name: 'v-model', type: 'string', default: "''", description: 'Bound text value.' },
	{ name: 'label', type: 'string', default: '—', description: 'Label above the textarea.' },
	{ name: 'description', type: 'string', default: '—', description: 'Hint shown below the textarea.' },
	{ name: 'rows', type: 'number', default: '3', description: 'Number of visible rows.' },
	{ name: 'placeholder', type: 'string', default: '—', description: 'Placeholder text.' },
	{ name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the textarea.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Textarea"
			tagline="Multi-line text input with the same label/description chrome as the rest of the form components."
			tag="<DomTextareaInput>"
		>
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomTextareaInput"
					:initial="{ label: 'Bio', description: 'A short public summary.', placeholder: 'Tell us about yourself…', rows: 4 }"
					title="Textarea playground"
					description="Edit props in the inspector — label, rows, and placeholder update live."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Live preview">
				<Demo>
					<div class="w-full max-w-sm">
						<DomTextareaInput
							v-model="bio"
							label="Bio"
							description="A short paragraph that appears under your name."
							:rows="4"
						/>
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
