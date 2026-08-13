<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import CodePanel from '../../_layout/docs/CodePanel.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import { DomFilterBar } from '../../lib/vue';
import DomFilterBarSrc from './DomFilterBar.vue?raw';
import CustomerDirectory from './examples/CustomerDirectory.vue';
import CustomerDirectorySrc from './examples/CustomerDirectory.vue?raw';

const doc = DomFilterBar.__doc;
const definitions = [
	{ key: 'status', label: 'Status', type: 'select', options: ['Active', 'Paused', 'Archived'] },
	{ key: 'ownerId', label: 'Owner', type: 'select', options: [{ label: 'Maya Chen', value: 'usr_42' }, { label: 'Owen Reed', value: 'usr_86' }] },
	{ key: 'billable', label: 'Billable', type: 'boolean' },
];
const resourceQueryCode = `// FilterBarQuery is intentionally transport-neutral.
function loadProjects(query) {
	const params = new URLSearchParams();
	if (query.search) params.set('search', query.search);
	for (const [key, value] of Object.entries(query.filters)) {
		params.set(\`filter[\${key}]\`, String(value));
	}
	return fetch(\`/api/projects?\${params}\`).then((response) => response.json());
}

// Example request
GET /api/projects?search=northstar&filter[status]=Active&filter[ownerId]=usr_42

// Server response remains the resource collection's own contract.
{
	data: [
		{ id: 'project_208', name: 'Northstar', status: 'Active', ownerId: 'usr_42' },
	],
	meta: { total: 1 },
}`;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Data workflows" title="Controlled customer query">
				<Example
					:source="CustomerDirectorySrc"
					filename="CustomerDirectory.vue"
					description="The filter bar owns accessible controls and emits a stable query. The resource layer decides whether to filter local rows, update a route, call an API, or dispatch a Pinia action."
					:preview-lines="0"
				>
					<CustomerDirectory />
				</Example>
			</DocSection>

			<DocSection eyebrow="Playground" title="Definitions and controlled values">
				<Playground
					:inspect="DomFilterBar"
					:initial="{ definitions, filters: { status: 'Active' }, search: '', searchable: true, density: 'comfortable', disabled: false }"
					title="Filter bar playground"
					description="Edit logical definitions, active filter values, free-text search, density, labels, and disabled state."
				/>
			</DocSection>

			<DocSection eyebrow="API shape" title="Map one query at the resource boundary">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p><code class="text-canvas-fg">DomFilterBar</code> is a Data component because its public value is a query contract shared by grids, lists, timelines, search results, and resource stores—not merely the arrangement of form controls.</p>
					<p>The emitted <code class="text-canvas-fg">FilterBarQuery</code> contains normalized <code class="text-canvas-fg">search</code> text and logical <code class="text-canvas-fg">filters</code>. Translate that object once at the API or store boundary. Debouncing, route synchronization, cancellation, persistence, and result loading remain application responsibilities.</p>
				</div>
				<CodePanel
					class="mt-5 overflow-hidden rounded-lg border border-border"
					:source="resourceQueryCode"
					:preview-lines="0"
					:default-open="false"
					:border-top="false"
					filename="project-resource-query.js"
					lang="js"
				/>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomFilterBar" :source="DomFilterBarSrc" />
				<ComponentEvents :component="DomFilterBar" />
				<ComponentSlots :component="DomFilterBar" :source="DomFilterBarSrc" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
