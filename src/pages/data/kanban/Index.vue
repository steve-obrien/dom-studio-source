<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodePanel from '../../_layout/docs/CodePanel.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import DomKanban from './DomKanban.vue';
import DomKanbanSrc from './DomKanban.vue?raw';
import SimpleTodoBoard from './examples/SimpleTodoBoard.vue';
import SimpleTodoBoardSrc from './examples/SimpleTodoBoard.vue?raw';
import SharedResourceViews from './examples/SharedResourceViews.vue';
import SharedResourceViewsSrc from './examples/SharedResourceViews.vue?raw';
import RichProjectBoard from './examples/RichProjectBoard.vue';
import RichProjectBoardSrc from './examples/RichProjectBoard.vue?raw';
import ProjectFeatureCardSrc from './examples/ProjectFeatureCard.vue?raw';

const doc = DomKanban.__doc;

const sharedResourceCode = `const resources = ref([
	{
		id: 'feature-104',
		title: 'Usage alert emails',
		status: 'active',
		position: 0,
		dueDate: '2026-08-18',
		owner: 'Maya',
	},
]);

const boardColumns = [
	{ key: 'backlog', label: 'Backlog' },
	{ key: 'active', label: 'Active' },
	{ key: 'complete', label: 'Complete' },
];

// One application-owned list, projected by each component.
<DomKanban
	v-model:rows="resources"
	:columns="boardColumns"
	column-key="status"
	order-key="position"
/>

<DomDataGrid
	:rows="resources"
	:columns="[
		{ key: 'title', label: 'Feature' },
		{ key: 'status', label: 'Board column', type: 'select' },
		{ key: 'dueDate', label: 'Due', type: 'date' },
	]"
/>

<DomMonthCalendar>
	<template #default="{ cell }">
		<FeatureCard
			v-for="resource in resources.filter((row) => row.dueDate === cell.value)"
			:key="resource.id"
			:resource="resource"
		/>
	</template>
</DomMonthCalendar>`;

const mutationApiCode = `// Create a card. The hook may return the complete server row or only its id.
POST /api/resources/features
{
	data: {
		title: 'Usage alert emails',
		status: 'active',
		position: 2,
	}
}

// Response consumed by createCard(request).
{
	data: {
		id: 'feature-104',
		title: 'Usage alert emails',
		status: 'active',
		position: 2,
	}
}

// Persist card-move. Complete affected orders make the transaction unambiguous.
PATCH /api/resources/features/feature-104/move
{
	changes: { status: 'validation', position: 0 },
	orders: [
		{ columnKey: 'active', rowKeys: ['feature-102', 'feature-107'] },
		{ columnKey: 'validation', rowKeys: ['feature-104', 'feature-106'] },
	],
}

// Persist view configuration independently from resource rows.
PATCH /api/resource-views/product-board/columns
{
	columnKeys: ['backlog', 'active', 'validation', 'complete'],
}`;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Demo" title="A practical todo board">
				<Example
					:source="SimpleTodoBoardSrc"
					filename="SimpleTodoBoard.vue"
					description="Drag cards between columns or to any insertion point, reorder columns by their grip, and add local columns or cards. The createCard hook emulates a remote POST and returns the server-owned id before update:rows is emitted."
					:preview-lines="0"
				>
					<SimpleTodoBoard />
				</Example>
			</DocSection>

			<DocSection eyebrow="Shared resources" title="One list across Kanban, grid, and calendar">
				<Example
					:source="SharedResourceViewsSrc"
					filename="SharedResourceViews.vue"
					description="The view switch belongs to the application because each view may have different query, pagination, and editing rules. The underlying feature records do not change shape: status and position drive Kanban, status remains a normal grid column, and dueDate drives the calendar."
					:preview-lines="0"
				>
					<SharedResourceViews />
				</Example>

				<CodePanel
					class="mt-5 overflow-hidden rounded-lg border border-border"
					:source="sharedResourceCode"
					:preview-lines="0"
					:default-open="false"
					:border-top="false"
					filename="shared-resource-views.vue"
					lang="vue"
				/>
			</DocSection>

			<DocSection eyebrow="Custom cards" title="Application-defined feature cards">
				<Example
					:source="RichProjectBoardSrc"
					filename="RichProjectBoard.vue"
					description="Pass cardComponent for a reusable application card, set component on an individual column, or use the card slot for inline control. DomKanban retains ordering, keyboard movement, focus, and drag semantics around the custom renderer."
					:preview-lines="0"
				>
					<RichProjectBoard />
				</Example>

				<CodePanel
					class="mt-5 overflow-hidden rounded-lg border border-border"
					:source="ProjectFeatureCardSrc"
					:preview-lines="0"
					:default-open="false"
					:border-top="false"
					filename="ProjectFeatureCard.vue"
					lang="vue"
				/>
			</DocSection>

			<DocSection eyebrow="Architecture" title="Controlled data and transport boundaries">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						<code class="text-canvas-fg">DomKanban</code> never sends a request and never mutates a supplied row. A successful interaction emits an immutable <code class="text-canvas-fg">update:rows</code> projection for local or optimistic state plus a detailed <code class="text-canvas-fg">card-move</code> payload for persistence. Use <code class="text-canvas-fg">v-model:rows</code> for a local board, or listen to the payload and reconcile it through a store for server data.
					</p>
					<p>
						The move payload includes minimal <code class="text-canvas-fg">changes</code> for the moved row and complete key-only <code class="text-canvas-fg">orders</code> for every affected column. A backend can update the status field and all affected positions in one transaction without reconstructing intent from neighbouring records.
					</p>
					<p>
						Card and column creation use optional promise-aware hooks because the component sometimes needs a server id before it can publish the next controlled array. A hook can POST the suggested record and return the complete saved resource or only its id. Rejections leave the composer open and emit a typed error event.
					</p>
					<p>
						View orchestration stays above the components. A data grid may paginate a million rows remotely, while a Kanban usually requests one scoped board and a calendar requests a date window. Keeping the switcher application-owned avoids pretending those queries are interchangeable while preserving one resource schema.
					</p>
				</div>

				<CodePanel
					class="mt-5 overflow-hidden rounded-lg border border-border"
					:source="mutationApiCode"
					:preview-lines="0"
					:default-open="false"
					:border-top="false"
					filename="kanban-resource-api.http"
					lang="http"
				/>
			</DocSection>

			<DocSection title="Reference">
				<div class="space-y-8">
					<ComponentProps :component="DomKanban" :source="DomKanbanSrc" />
					<ComponentEvents :component="DomKanban" :source="DomKanbanSrc" />
					<ComponentSlots :component="DomKanban" :source="DomKanbanSrc" />
					<ComponentKeyboard :component="DomKanban" />
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
