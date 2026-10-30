<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import DomAppStack from './DomAppStack.vue';
import source from './DomAppStack.vue?raw';
import SettingsStack from '../examples/SettingsStack.vue';
import settingsSource from '../examples/SettingsStack.vue?raw';

const doc = DomAppStack.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tag="doc.tag" :tagline="doc.description">
			<DocSection eyebrow="Example" title="Settings stack">
				<p class="max-w-3xl text-sm leading-6 text-muted-fg">Stack screens can contain any Vue content. This example combines a profile header, navigation rows, forms, and working settings switches across five levels.</p>
				<Example
					:source="settingsSource"
					title="Account and app settings"
					description="Explore Account → General → Language & Region, or Account → Apps → Calendar → Notifications. Settings stay as you left them when you go back. Switch to the Desktop preset to see the full breadcrumb path."
					filename="SettingsStack.vue"
					source-path="src/pages/mobile/examples/SettingsStack.vue"
					presentation="mobile"
					device-title="Settings stack"
					:frame-height="680"
					:preview-lines="16"
				>
					<SettingsStack />
				</Example>
			</DocSection>

			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomAppStack"
					:initial="doc.playground.initial"
					presentation="mobile"
					title="App stack playground"
					description="Adjust the props to explore sizing, content, and behaviour."
				/>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomAppStack" :source="source" />
			</DocSection>
			<ComponentSlots :component="DomAppStack" />
			<ComponentEvents :component="DomAppStack" :source="source" />
		</DocPage>
	</DomStudioLayout>
</template>
