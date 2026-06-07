<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import { DomRadioGroup } from '../../lib/vue';
import Plans from './examples/Plans.vue';
import PlansSrc from './examples/Plans.vue?raw';

const options = [
	{ value: 'solo', label: 'Solo' },
	{ value: 'team', label: 'Team' },
	{ value: 'enterprise', label: 'Enterprise' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Radio group" tagline="A single-choice form control with roving focus and fully styleable options." tag="<dom-radio-group>">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomRadioGroup"
					:initial="{ modelValue: 'team', label: 'Plan', options }"
					title="Radio group playground"
					description="Use this when one option in a set must be selected."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Plans">
				<Example
					:source="PlansSrc"
					filename="Plans.vue"
					description="Radio groups work well for small, mutually exclusive option sets."
				>
					<Plans />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomRadioGroup" />
				<ComponentEvents :component="DomRadioGroup" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
