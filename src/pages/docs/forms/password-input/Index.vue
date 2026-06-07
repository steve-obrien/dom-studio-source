<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import { DomPasswordInput } from '../../lib/vue';

import Signup from './examples/Signup.vue';
import SignupSrc from './examples/Signup.vue?raw';

const doc = DomPasswordInput.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomPasswordInput"
					:initial="{ label: 'Create password', description: 'Use a strong password.', modelValue: 'correct-horse', showStrength: true }"
					title="Password input playground"
					description="Toggle the compromised state to preview breach messaging."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Strength and breach warning">
				<Example
					:source="SignupSrc"
					filename="Signup.vue"
					description="The field keeps the native input behaviour, with a visibility toggle and lightweight strength scoring."
				>
					<Signup />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomPasswordInput" />
			</DocSection>

			<ComponentEvents :component="DomPasswordInput" />
		</DocPage>
	</DomStudioLayout>
</template>
