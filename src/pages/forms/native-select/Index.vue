<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import { DomNativeSelect } from '../../lib/vue';
import { RouterLink } from 'vue-router';

import Workspace from './examples/Workspace.vue';
import WorkspaceSrc from './examples/Workspace.vue?raw';

const doc = DomNativeSelect.__doc;
const options = [
	{ label: 'Design system', value: 'design' },
	{ label: 'Marketing site', value: 'marketing' },
	{ label: 'Internal tools', value: 'tools' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomNativeSelect"
					:initial="{ label: 'Workspace', description: 'Choose where this should be saved.', modelValue: 'design', options }"
					title="Native select playground"
					description="Use this only when browser-native select behaviour is specifically valuable. Prefer DomSelect for rich app option rendering."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Styled native control">
				<Example
					:source="WorkspaceSrc"
					filename="Workspace.vue"
					description="This is still a real select element, so mobile platforms get their native picker UI."
				>
					<Workspace />
				</Example>
			</DocSection>

			<DocSection eyebrow="Guidance" title="Prefer rich app selects">
				<p class="text-sm leading-6 text-muted-fg">
					Most application UIs should use <code class="text-canvas-fg">DomSelect</code>, <code class="text-canvas-fg">DomListbox</code>, or
					<code class="text-canvas-fg">DomCombobox</code> so options can show descriptions, status, avatars, counts, and metadata.
					Use native select for platform picker behaviour, extreme compatibility needs, or very plain settings.
				</p>
				<RouterLink
					to="/forms/select"
					class="mt-4 inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-fg transition hover:opacity-90"
				>
					View DomSelect
				</RouterLink>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomNativeSelect" />
			</DocSection>

			<ComponentEvents :component="DomNativeSelect" />
		</DocPage>
	</DomStudioLayout>
</template>
