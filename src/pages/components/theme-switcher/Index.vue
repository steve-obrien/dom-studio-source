<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import { DomThemeSwitcher } from '../../lib/vue';

import SettingsRow from './examples/SettingsRow.vue';
import SettingsRowSrc from './examples/SettingsRow.vue?raw';
import AppToolbar from './examples/AppToolbar.vue';
import AppToolbarSrc from './examples/AppToolbar.vue?raw';

const doc = DomThemeSwitcher.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomThemeSwitcher"
					:initial="doc.playground.initial"
					title="Theme switcher playground"
					description="The switcher stores the selected DOM Studio theme preference and updates the document theme."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Settings row">
				<Example
					:source="SettingsRowSrc"
					filename="SettingsRow.vue"
					description="Use the labelled row where a menu or settings surface needs to show the current theme preference."
				>
					<SettingsRow />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Toolbar control">
				<Example
					:source="AppToolbarSrc"
					filename="AppToolbar.vue"
					description="Hide the label when the segmented control sits in compact app chrome."
				>
					<AppToolbar />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomThemeSwitcher" />
				<ComponentEvents :component="DomThemeSwitcher" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
