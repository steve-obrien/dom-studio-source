<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import Example from '../../../_layout/docs/Example.vue';
import CollapsibleSidebarShell from './examples/CollapsibleSidebarShell.vue';
import CollapsibleSidebarShellSrc from './examples/CollapsibleSidebarShell.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Collapsible Sidebar Shell"
			tagline="A responsive workspace shell with a desktop icon rail and a mobile navigation drawer."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="App shell" title="Collapsible sidebar workspace">
				<Example
					:source="CollapsibleSidebarShellSrc"
					filename="CollapsibleSidebarShell.vue"
					presentation="iframe"
					frame-src="/blocks/app-shells/collapsible-sidebar-shell/preview/CollapsibleSidebarShell"
					frame-flush-edges
					description="Use this for SaaS workspaces that need persistent desktop navigation, a compact focus mode, and a mobile drawer that keeps the full menu available in narrow iframe viewports."
					:frame-height="820"
					default-open
				>
					<CollapsibleSidebarShell />
				</Example>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
