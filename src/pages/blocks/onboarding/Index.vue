<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import WorkspaceOnboarding from './examples/WorkspaceOnboarding.vue';
import WorkspaceOnboardingSrc from './examples/WorkspaceOnboarding.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Onboarding Blocks"
			tagline="Production-shaped setup flows for converting a new signup into an activated workspace."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Activation" title="Workspace setup wizard">
				<Example
					:source="WorkspaceOnboardingSrc"
					filename="WorkspaceOnboarding.vue"
					presentation="iframe"
					frame-src="/blocks/onboarding/preview/WorkspaceOnboarding"
					description="A responsive onboarding wizard with step progress, goal selection, invite collection, and a launch-ready summary. Adapt the steps to capture the few fields that unlock value in your product."
					default-open
					:preview-lines="12"
				>
					<WorkspaceOnboarding />
				</Example>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
