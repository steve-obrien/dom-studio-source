<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import { DomBreadcrumbs } from '../../lib/vue';
import DomBreadcrumbsSrc from './DomBreadcrumbs.vue?raw';
import ProjectNavigation from './examples/ProjectNavigation.vue';
import ProjectNavigationSrc from './examples/ProjectNavigation.vue?raw';
import RouterBreadcrumbs from './examples/RouterBreadcrumbs.vue';
import RouterBreadcrumbsSrc from './examples/RouterBreadcrumbs.vue?raw';

const doc = DomBreadcrumbs.__doc;
const playgroundItems = [
	{ key: 'root', label: 'Workspace' },
	{ key: 'projects', label: 'Projects' },
	{ key: 'northstar', label: 'Northstar' },
	{ key: 'settings', label: 'Settings' },
	{ key: 'api', label: 'API credentials', current: true },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Resource paths" title="Long paths collapse in the middle">
				<Example
					:source="ProjectNavigationSrc"
					filename="ProjectNavigation.vue"
					description="maxItems preserves the beginning and current end of a path. The ellipsis is an accessible disclosure control and selecting an item emits its untouched application record."
					:preview-lines="0"
				>
					<ProjectNavigation />
				</Example>
			</DocSection>

			<DocSection eyebrow="Routing" title="Vue Router destinations">
				<Example
					:source="RouterBreadcrumbsSrc"
					filename="RouterBreadcrumbs.vue"
					description="Items with to render as RouterLink destinations; href renders a native anchor; destination-free items emit navigate for application-owned routing."
					:preview-lines="0"
				>
					<RouterBreadcrumbs />
				</Example>
			</DocSection>

			<DocSection eyebrow="Playground" title="Path presentation">
				<Playground
					:inspect="DomBreadcrumbs"
					:initial="{ items: playgroundItems, maxItems: 4, separator: 'chevron', size: 'md', currentAsLink: false }"
					title="Breadcrumbs playground"
					description="Adjust collapse limits, separators, density, and current-location behavior."
				/>
			</DocSection>

			<DocSection eyebrow="Architecture" title="Destinations stay application-owned">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p><code class="text-canvas-fg">DomBreadcrumbs</code> supplies navigation semantics, collapsing, focus styles, and <code class="text-canvas-fg">aria-current</code>. It does not infer a route hierarchy or fetch ancestors.</p>
					<p>Pass a Vue Router <code class="text-canvas-fg">to</code>, native <code class="text-canvas-fg">href</code>, or listen to <code class="text-canvas-fg">navigate</code>. The final item is current by default unless another item explicitly sets <code class="text-canvas-fg">current</code>.</p>
				</div>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomBreadcrumbs" :source="DomBreadcrumbsSrc" />
				<ComponentEvents :component="DomBreadcrumbs" />
				<ComponentSlots :component="DomBreadcrumbs" :source="DomBreadcrumbsSrc" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
