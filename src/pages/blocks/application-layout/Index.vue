<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ScrollableAppShell from './examples/ScrollableAppShell.vue';
import ScrollableAppShellSrc from './examples/ScrollableAppShell.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Application Layout Block"
			tagline="A fixed application shell with a left panel that scrolls independently from the main work area."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Starter" title="Scrollable app shell">
				<Example
					:source="ScrollableAppShellSrc"
					filename="ScrollableAppShell.vue"
					presentation="iframe"
					frame-src="/blocks/application-layout/preview/ScrollableAppShell"
					description="Use this when the app needs persistent navigation or layers on the left, while the detail view scrolls on its own."
					default-open
				>
					<ScrollableAppShell />
				</Example>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
