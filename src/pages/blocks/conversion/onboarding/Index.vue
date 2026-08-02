<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import Example from '../../../_layout/docs/Example.vue';
import WorkspaceOnboarding from './examples/WorkspaceOnboarding.vue';
import WorkspaceOnboardingSrc from './examples/WorkspaceOnboarding.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Onboarding Workspace"
			tagline="A resumable, API-backed activation section that turns a signup into a configured workspace."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Activation" title="Workspace activation flow">
				<Example
					:source="WorkspaceOnboardingSrc"
					filename="WorkspaceOnboarding.vue"
					presentation="iframe"
					frame-src="/blocks/conversion/onboarding/preview/WorkspaceOnboarding"
					description="A responsive Notion- and Linear-inspired setup workspace with revisioned saves, rich DOM Studio selects, source connection, scoped invitations, server-owned readiness, immutable launch proof, and a useful post-launch handoff."
					default-open
					:preview-lines="12"
				>
					<WorkspaceOnboarding />
				</Example>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
