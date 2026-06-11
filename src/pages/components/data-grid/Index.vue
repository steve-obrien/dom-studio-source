<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import DomDataGrid from './DomDataGrid.vue';
import DomDataGridSrc from './DomDataGrid.vue?raw';
import CustomerDatabase from './examples/CustomerDatabase.vue';
import CustomerDatabaseSrc from './examples/CustomerDatabase.vue?raw';

const doc = DomDataGrid.__doc;

const resourceApiCode = `const columns = [
\t{ key: 'account', type: 'text', width: '15rem' },
\t{ key: 'renewalDate', type: 'date' },
\t{ key: 'arr', type: 'currency', currency: 'GBP' },
\t{ key: 'status', type: 'select', options: ['active', 'trial', 'paused'] },
];

async function loadAccounts(query) {
\tconst params = new URLSearchParams({
\t\tsearch: query.search,
\t\tsort: query.sort ? JSON.stringify(query.sort) : '',
\t\tfilters: JSON.stringify(query.filters),
\t});

\treturn fetch(\`/api/resources/accounts?\${params}\`).then((response) => response.json());
}`;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Demo" title="Database-style account table">
				<Example
					:source="CustomerDatabaseSrc"
					filename="CustomerDatabase.vue"
					description="Column filters use typed controls: date columns open a date range, number columns use min/max, select columns use checklist filters, and applied filters are visible in both the header and toolbar."
					default-open
				>
					<CustomerDatabase />
				</Example>
			</DocSection>

			<DocSection eyebrow="Architecture" title="Resource query API">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The component filters client-side by default so it works immediately with local rows. Set
						<code class="text-fg">remote</code> when the grid should render API results exactly as supplied and use
						<code class="text-fg">query-change</code> to request a SQL-backed resource.
					</p>
					<p>
						Column definitions are the contract. A date column gets a date-range filter, numeric columns get min/max, boolean columns get a yes/no segmented control, and select columns can render known options from the resource schema.
					</p>
				</div>
				<CodeBlock class="mt-5" :code="resourceApiCode" lang="js" />
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomDataGrid" :source="DomDataGridSrc" />
				<ComponentEvents :component="DomDataGrid" :source="DomDataGridSrc" />
				<ComponentSlots :component="DomDataGrid" :source="DomDataGridSrc" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
