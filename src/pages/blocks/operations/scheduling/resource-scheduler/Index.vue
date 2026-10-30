<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import ResourceScheduleBoard from './examples/ResourceScheduleBoard.vue';
import ResourceScheduleBoardSrc from './examples/ResourceScheduleBoard.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Resource Scheduler Block"
			tagline="A working workforce scheduling section with exact resource capacity, API-owned availability checks, assignment receipts, and responsive operator views."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations" title="Resource scheduling desk">
				<Example
					:source="ResourceScheduleBoardSrc"
					filename="ResourceScheduleBoard.vue"
					presentation="iframe"
					frame-src="/blocks/operations/scheduling/resource-scheduler/preview/ResourceScheduleBoard"
					description="A Float-inspired scheduling desk built around DomWeekPlanner: choose a resource, select or drag time, review server-owned availability and capacity, save the exact assignment, then publish pending changes."
					default-open
					:preview-lines="20"
				>
					<ResourceScheduleBoard />
				</Example>
			</DocSection>

			<DocSection eyebrow="Workflow" title="What is fully working">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The repository-local API owns the schedule, exact workspace and assignment versions, capacity calculations, policy checks, immutable previews, provider receipts, and publication state. Reloading the iframe keeps committed mutations for the life of the server process.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Use rich <code>DomSelect</code> controls to move between people, customer work, dates, half-hour boundaries, and assignment states.</li>
						<li>Drag across empty <code>DomWeekPlanner</code> time to start an exact assignment, or drag existing work to open a reschedule review without mutating the calendar early.</li>
						<li>Preview server-owned overlap, skill, service-area, working-hours, daily-capacity, and weekly-capacity checks before an acknowledged commit.</li>
						<li>Persist status transitions, provider receipts, exact versions, and unpublished change counts; completed work is retained as evidence.</li>
						<li>Publish the exact pending change set through a deterministic workforce-provider adapter, then inspect its receipt in <code>DomJsonViewer</code>.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local contract">
				<CodeBlock lang="txt" filename="resource-scheduler-api.txt" :code="`GET  /api/block-demos/resource-scheduler/bootstrap
POST /api/block-demos/resource-scheduler/select
POST /api/block-demos/resource-scheduler/allocations/preview
POST /api/block-demos/resource-scheduler/allocations/commit
POST /api/block-demos/resource-scheduler/allocations/:allocationId/status
POST /api/block-demos/resource-scheduler/schedule/publish
POST /api/block-demos/resource-scheduler/reset

Mutation contract
{
	revision: 18,
	allocationVersion: 6,
	resourceId: 'resource_maya',
	workId: 'work_northstar',
	date: '2026-08-03',
	startTime: '08:30',
	endTime: '12:00',
	status: 'confirmed',
	note: 'Replacement shutters and site induction are confirmed.'
}`" />
			</DocSection>

			<DocSection eyebrow="Composition" title="DOM Studio components demonstrated">
				<div class="space-y-3 text-sm leading-7 text-muted-fg">
					<p><code>DomAppShell</code>, <code>DomAppTopBar</code>, and <code>DomAppBottomNav</code> make the section fill its iframe at every viewport rather than shrinking a desktop screenshot.</p>
					<p><code>DomWeekPlanner</code> owns fixed-width date lanes, time geometry, range selection, horizontal overflow, and drag payloads. The application owns records, validation, revisions, and persistence.</p>
					<p><code>DomAppListItem</code>, <code>DomAvatar</code>, <code>DomProgress</code>, and <code>DomStatusPill</code> create a compact capacity rail; <code>DomDialog</code>, <code>DomCheckbox</code>, <code>DomAlert</code>, and <code>DomJsonViewer</code> carry the governed mutation and evidence workflow.</p>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
