<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import Example from '../../../_layout/docs/Example.vue';
import ScrollableAppShell from './examples/ScrollableAppShell.vue';
import ScrollableAppShellSrc from './examples/ScrollableAppShell.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Application Layout Block"
			tagline="A responsive customer-health shell with independent navigation, mobile access, and a focused review workflow."
			tag="Reviewed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="App shell" title="Responsive customer-health workspace">
				<Example
					:source="ScrollableAppShellSrc"
					filename="ScrollableAppShell.vue"
					presentation="iframe"
					frame-src="/blocks/app-shells/application-layout/preview/ScrollableAppShell"
					description="Use this composition for application screens with persistent desktop navigation and a viewport-owned work area. At narrow iframe widths the sidebar becomes a flush-edge DomDrawer, while DomSelect, DomProfileMenu, DomStatusPill, DomDialog, and account rows compose a realistic review workflow."
					frame-flush-edges
					default-open
				>
					<ScrollableAppShell />
				</Example>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
