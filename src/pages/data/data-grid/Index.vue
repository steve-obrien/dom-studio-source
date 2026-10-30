<script setup>
import { ref } from 'vue';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import ComponentQuickStart from '../../_layout/docs/ComponentQuickStart.vue';
import ComponentGuide from '../../_layout/docs/ComponentGuide.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentMethods from '../../_layout/docs/ComponentMethods.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import DomDataGrid from './DomDataGrid.vue';
import DomDataGridSrc from './DomDataGrid.vue?raw';
import guide from './DomDataGrid.md?guide';

const doc = DomDataGrid.__doc;
const installationMethod = ref('npm');

// The guide's <!-- example: Name --> markers pick from these by file name.
const exampleComponents = import.meta.glob('./examples/*.vue', { eager: true, import: 'default' });
const exampleSources = import.meta.glob('./examples/*.vue', { eager: true, query: '?raw', import: 'default' });
const examples = Object.fromEntries(Object.keys(exampleComponents).map((file) => [
	file.replace(/^\.\/examples\/|\.vue$/g, ''),
	{ component: exampleComponents[file], source: exampleSources[file] },
]));
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<ComponentQuickStart component-name="DomDataGrid" />

			<ComponentGuide v-model:installation-method="installationMethod" :guide="guide" :examples="examples" />

			<DocSection title="Reference">
				<ComponentProps :component="DomDataGrid" :source="DomDataGridSrc" />
				<ComponentEvents :component="DomDataGrid" :source="DomDataGridSrc" />
				<ComponentSlots :component="DomDataGrid" :source="DomDataGridSrc" />
				<ComponentMethods :component="DomDataGrid" />
				<ComponentKeyboard :component="DomDataGrid" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
