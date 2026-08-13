<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import { DomStepper } from '../../lib/vue';
import DomStepperSrc from './DomStepper.vue?raw';
import CheckoutProgress from './examples/CheckoutProgress.vue';
import CheckoutProgressSrc from './examples/CheckoutProgress.vue?raw';
import ReviewWorkflow from './examples/ReviewWorkflow.vue';
import ReviewWorkflowSrc from './examples/ReviewWorkflow.vue?raw';

const doc = DomStepper.__doc;
const playgroundItems = [
	{ key: 'details', label: 'Details', description: 'Basic information' },
	{ key: 'permissions', label: 'Permissions', description: 'Roles and access' },
	{ key: 'review', label: 'Review', description: 'Confirm changes', optional: true },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Workflow" title="Controlled checkout progress">
				<Example
					:source="CheckoutProgressSrc"
					filename="CheckoutProgress.vue"
					description="The application owns the active key and form state. Linear navigation permits completed steps and the next incomplete step while Back and Continue remain ordinary application actions."
					:preview-lines="0"
				>
					<CheckoutProgress />
				</Example>
			</DocSection>

			<DocSection eyebrow="Orientation" title="Vertical review workflow">
				<Example
					:source="ReviewWorkflowSrc"
					filename="ReviewWorkflow.vue"
					description="Descriptions, explicit completed states, and optional steps work in the vertical presentation without changing the controlled API."
					:preview-lines="0"
				>
					<ReviewWorkflow />
				</Example>
			</DocSection>

			<DocSection eyebrow="Playground" title="States and layout">
				<Playground
					:inspect="DomStepper"
					:initial="{ items: playgroundItems, modelValue: 'permissions', orientation: 'horizontal', clickable: true, linear: false, showDescriptions: true, size: 'md' }"
					title="Stepper playground"
					description="Adjust controlled selection, orientation, linear navigation, descriptions, and indicator size."
				/>
			</DocSection>

			<DocSection eyebrow="Architecture" title="Progress presentation, not workflow state">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p><code class="text-canvas-fg">DomStepper</code> owns accessible progress navigation and derived presentation states. The application owns validation, persistence, form data, routing, and whether moving forward is allowed.</p>
					<p>Use explicit item statuses for server-reported completion or error states. Without them, steps before the controlled key are complete, the matching step is current, and later steps are upcoming.</p>
				</div>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomStepper" :source="DomStepperSrc" />
				<ComponentEvents :component="DomStepper" />
				<ComponentSlots :component="DomStepper" :source="DomStepperSrc" />
				<ComponentKeyboard :component="DomStepper" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
