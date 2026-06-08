<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import { DomCommandPalette } from '../../lib/vue';
import Launcher from './examples/Launcher.vue';
import LauncherSrc from './examples/Launcher.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Command palette" tagline="A keyboard-first launcher composed from dialog, filtering, and list selection patterns." tag="<DomCommandPalette>">
			<DocSection eyebrow="Demo" title="Launcher">
				<Example
					:source="LauncherSrc"
					filename="Launcher.vue"
					description="Open the palette from the button or Cmd+K, type to filter, use arrow keys, and press Enter to select."
				>
					<Launcher />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomCommandPalette" />
				<ComponentEvents :component="DomCommandPalette" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
