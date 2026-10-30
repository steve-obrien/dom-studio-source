<script setup>
import { ref } from 'vue';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Demo from '../../_layout/Demo.vue';
import Playground from '../../_layout/docs/Playground.vue';
import PropsTable from '../../_layout/PropsTable.vue';
import { DomTextInput } from '../../lib/vue';

const name = ref('Alex Morgan');

const usage = `<script setup>
import { DomTextInput } from '@getdom/studio/vue';
import { ref } from 'vue';
const name = ref('');
<\/script>

<template>
  <DomTextInput
    v-model="name"
    label="Display name"
    description="Shown publicly on your profile."
    placeholder="DOM Studio"
  />
</template>`;

const props = [
	{ name: 'v-model', type: 'string', default: "''", description: 'Bound text value.' },
	{ name: 'label', type: 'string', default: '—', description: 'Small label above the input.' },
	{ name: 'description', type: 'string', default: '—', description: 'Hint shown below the input.' },
	{ name: 'placeholder', type: 'string', default: '—', description: 'Input placeholder text.' },
	{ name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the input.' },
	{ name: 'required', type: 'boolean', default: 'false', description: 'Render a small required indicator next to the label.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Text input"
			tagline="A labelled single-line text field, wrapped in DomField so the label and description are uniform across forms."
			tag="<DomTextInput>"
		>
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomTextInput"
					:initial="{ label: 'Display name', description: 'Shown on your profile.', placeholder: 'Your name' }"
					title="Text input playground"
					description="Edit props in the inspector — label, description, placeholder, and disabled state update live."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Live preview">
				<Demo>
					<div class="w-full max-w-sm">
						<DomTextInput
							v-model="name"
							label="Display name"
							description="Shown publicly on your profile."
							placeholder="DOM Studio"
						/>
						<p class="mt-3 text-xs text-muted-fg">Value: <code class="text-canvas-fg">{{ name }}</code></p>
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
