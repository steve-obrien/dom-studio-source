<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import { DomPagination } from '../../lib/vue';

import ResourcePages from './examples/ResourcePages.vue';
import ResourcePagesSrc from './examples/ResourcePages.vue?raw';

const doc = DomPagination.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomPagination"
					:initial="{ page: 4, pageSize: 25, total: 286 }"
					title="Pagination playground"
					description="Keep page state in the parent, then send it with your resource query."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Resource page navigation">
				<Example
					:source="ResourcePagesSrc"
					filename="ResourcePages.vue"
					description="Use DomPagination beside data grids, audit logs, search results, and API-backed resource lists."
				>
					<ResourcePages />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomPagination" />
			</DocSection>

			<ComponentEvents :component="DomPagination" />
		</DocPage>
	</DomStudioLayout>
</template>
