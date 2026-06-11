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
			tagline="A workspace shell with an expanded sidebar that collapses into an icon rail."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="App shell" title="Collapsible sidebar workspace">
				<Example
					:source="CollapsibleSidebarShellSrc"
					filename="CollapsibleSidebarShell.vue"
					presentation="iframe"
					frame-src="/blocks/app-shells/collapsible-sidebar-shell/preview/CollapsibleSidebarShell"
					description="Use this for SaaS workspaces that need a persistent left navigation, account switcher, and compact focus mode."
					:frame-height="820"
					default-open
				>
					<CollapsibleSidebarShell />
				</Example>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
