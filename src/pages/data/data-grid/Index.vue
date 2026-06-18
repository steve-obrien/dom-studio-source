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
import LargeMemoryGrid from './examples/LargeMemoryGrid.vue';
import LargeMemoryGridSrc from './examples/LargeMemoryGrid.vue?raw';
import ServerResourceGrid from './examples/ServerResourceGrid.vue';
import ServerResourceGridSrc from './examples/ServerResourceGrid.vue?raw';
import CustomColumnComponents from './examples/CustomColumnComponents.vue';
import CustomColumnComponentsSrc from './examples/CustomColumnComponents.vue?raw';
import EditNameCellSrc from './examples/EditNameCell.vue?raw';
import RowActionsCellSrc from './examples/RowActionsCell.vue?raw';

const doc = DomDataGrid.__doc;

const resourceApiCode = `// Request
{
\tresource: 'customers',
\tquery: {
\t\tsearch: 'atlas',
\t\tfilters: {
\t\t\tstatus: { type: 'select', values: ['active', 'trial'] },
\t\t\tarr: { type: 'currency', min: 50000, max: 250000 },
\t\t},
\t\tsort: { key: 'updatedAt', direction: 'desc' },
\t},
\tpagination: {
\t\tstrategy: 'page',
\t\tpage: 2,
\t\tpageSize: 25,
\t},
}

// Same endpoint for forever scrolling.
{
\tresource: 'customers',
\tquery,
\tpagination: {
\t\tstrategy: 'cursor',
\t\tcursor: 'customer:25',
\t\tlimit: 25,
\t},
}

// Response
{
\tdata: [
\t\t/* normalized customer rows */
\t],
\tpageInfo: {
\t\tstrategy: 'page',
\t\tpage: 2,
\t\tpageSize: 25,
\t\tpageCount: 8,
\t\ttotal: 184,
\t\treturned: 25,
\t\thasNextPage: true,
\t\thasPreviousPage: true,
\t\tnextCursor: 'customer:50',
\t},
\tmeta: {
\t\tresource: 'customers',
\t\trequestedAt: '2026-06-17T10:00:00.000Z',
\t\ttotal: 184,
\t\treturned: 25,
\t\tquery,
\t},
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

			<DocSection eyebrow="Large memory" title="Virtual rows for in-memory data">
				<Example
					:source="LargeMemoryGridSrc"
					filename="LargeMemoryGrid.vue"
					description="Use virtualRows when a large local array is already in memory. The grid keeps the full 10,000-row data set available for client-side search, filters, and sort, while the isolated virtual row renderer mounts only the visible rows plus the configured buffer."
					default-open
				>
					<LargeMemoryGrid />
				</Example>
			</DocSection>

			<DocSection eyebrow="Remote data" title="Server pagination and forever scrolling">
				<Example
					:source="ServerResourceGridSrc"
					filename="ServerResourceGrid.vue"
					description="The same resource endpoint handles page-number navigation and cursor-based forever scrolling. The grid sends search, filters, and sort; pagination adds either page/pageSize or cursor/limit."
					default-open
				>
					<ServerResourceGrid />
				</Example>
			</DocSection>

			<DocSection eyebrow="Custom cells" title="Column components and row actions">
				<Example
					:source="CustomColumnComponentsSrc"
					filename="CustomColumnComponents.vue"
					description="Set column.component to a Vue component. The component receives row, column, value, formatted, rowIndex, and rowKey. Display-only columns such as actions still use a stable key, but do not need a matching row property."
					default-open
				>
					<CustomColumnComponents />
				</Example>

				<div class="mt-5 grid gap-4 lg:grid-cols-2">
					<div class="min-w-0">
						<p class="mb-2 text-sm font-semibold text-canvas-fg">EditNameCell.vue</p>
						<CodeBlock :code="EditNameCellSrc" lang="vue" />
					</div>
					<div class="min-w-0">
						<p class="mb-2 text-sm font-semibold text-canvas-fg">RowActionsCell.vue</p>
						<CodeBlock :code="RowActionsCellSrc" lang="vue" />
					</div>
				</div>
			</DocSection>

			<DocSection eyebrow="Architecture" title="Resource query API">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The component filters client-side by default so it works immediately with local rows. Set
						<code class="text-canvas-fg">remote</code> when the grid should render API results exactly as supplied and use
						<code class="text-canvas-fg">query-change</code> to request a SQL-backed resource. Keep pagination beside the grid query so the same endpoint can support numbered pages, previous/next controls, and cursor-fed scrolling.
					</p>
					<p>
						Use <code class="text-canvas-fg">virtualRows</code> when rows are already held in memory but the DOM should stay small. It swaps the table body to a dedicated virtual row renderer, using <code class="text-canvas-fg">virtualRowBuffer</code> to keep extra rows mounted above and below the viewport.
					</p>
					<p>
						For custom rendering, add <code class="text-canvas-fg">component</code> to a column definition. The column
						<code class="text-canvas-fg">key</code> is the stable column id; set <code class="text-canvas-fg">field</code> when the component should read a different row property, or omit it for display-only columns such as row actions.
					</p>
					<p>
						Column definitions are the contract. A date column gets a date-range filter, numeric columns get min/max, boolean columns get a yes/no segmented control, and select columns can render known options from the resource schema.
						Set <code class="text-canvas-fg">filterable: false</code> on display-only or operational columns so they stay out of the filter UI and resource query.
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
