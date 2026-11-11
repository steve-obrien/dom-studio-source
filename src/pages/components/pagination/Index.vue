<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import ComponentGuide from '../../_layout/docs/ComponentGuide.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import { DomPagination } from '../../lib/vue';

import ResourcePages from './examples/ResourcePages.vue';
import ResourcePagesSrc from './examples/ResourcePages.vue?raw';
import LargeDataset from './examples/LargeDataset.vue';
import LargeDatasetSrc from './examples/LargeDataset.vue?raw';
import guide from './DomPagination.md?guide';

const doc = DomPagination.__doc;
const examples = {
	LargeDataset: { component: LargeDataset, source: LargeDatasetSrc },
	ResourcePages: { component: ResourcePages, source: ResourcePagesSrc },
};
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<ComponentGuide :guide="guide" :examples="examples" />

			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomPagination"
					:initial="{ page: 4, pageSize: 25, total: 286 }"
					title="Pagination playground"
					description="Keep page state in the parent, then send it with your resource query."
				/>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomPagination" />
			</DocSection>

			<ComponentEvents :component="DomPagination" />
			<ComponentKeyboard :component="DomPagination" />
		</DocPage>
	</DomStudioLayout>
</template>
