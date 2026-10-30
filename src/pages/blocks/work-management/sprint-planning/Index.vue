<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import SprintPlanningBoard from './examples/SprintPlanningBoard.vue';
import SprintPlanningBoardSrc from './examples/SprintPlanningBoard.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Sprint Planning Block"
			tagline="A complete product planning room for composing sprint scope, validating capacity, and committing an exact plan through a repository-local API."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Work management" title="Sprint planning room">
				<Example
					:source="SprintPlanningBoardSrc"
					filename="SprintPlanningBoard.vue"
					presentation="iframe"
					frame-src="/blocks/work-management/sprint-planning/preview/SprintPlanningBoard"
					description="A Linear-, Jira-, and GitHub Projects-inspired planning section with backlog filters, responsive destinations, rich DOM Studio controls, API-backed scope moves, exact revisions, capacity and dependency checks, immutable sprint previews, and commitment receipts."
					default-open
					:preview-lines="16"
				>
					<SprintPlanningBoard />
				</Example>
			</DocSection>

			<DocSection eyebrow="Workflow" title="What is working">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when teams must make and preserve a real planning decision. The example loads its state from a repository-local API, lets an operator move issues through an exact preview, and only commits the sprint after the server validates ownership, capacity, dependencies, dates, and optimistic revisions.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Move backlog work into or out of Cycle 32 with exact workspace, sprint, and issue versions.</li>
						<li>Change the accountable owner and Fibonacci estimate with <code>DomSelect</code> before previewing scope impact.</li>
						<li>Review team and individual capacity, unresolved dependencies, ownership, the sprint goal, and dates before committing.</li>
						<li>Reload committed process-local state and inspect immutable scope, audit, and calendar receipts.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local lifecycle">
				<CodeBlock lang="txt" filename="sprint-planning-api.txt" :code="`GET  /api/block-demos/sprint-planning/bootstrap
POST /api/block-demos/sprint-planning/issues/:issueId/preview-move
POST /api/block-demos/sprint-planning/issues/:issueId/move
POST /api/block-demos/sprint-planning/plan/preview
POST /api/block-demos/sprint-planning/plan/commit
POST /api/block-demos/sprint-planning/reset`" />
			</DocSection>

			<DocSection eyebrow="Production handoff" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Storage boundary</h3>
						<p class="mt-2">The demo is process-local. Replace the in-memory module with transactional sprint and issue records while preserving its exact-preview contract.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Concurrency</h3>
						<p class="mt-2">Keep workspace, sprint, and issue versions authoritative so a stale browser cannot overwrite planning changes made by another operator.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Responsive behavior</h3>
						<p class="mt-2">Backlog, Cycle, and Review are first-class compact destinations, while expanded viewers keep the three planning contexts visible together.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
