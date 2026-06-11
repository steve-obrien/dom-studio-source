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
			tagline="A product delivery board for planning sprint scope, triaging backlog work, watching capacity, and making release readiness visible."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Work management" title="Sprint planning board">
				<Example
					:source="SprintPlanningBoardSrc"
					filename="SprintPlanningBoard.vue"
					presentation="iframe"
					frame-src="/blocks/work-management/sprint-planning/preview/SprintPlanningBoard"
					description="Copy this into a project management, product ops, internal tools, or agency delivery app. Replace the sample issues and lanes with your task API, then wire the action buttons to assignment, estimation, and sprint update flows."
					default-open
					:preview-lines="16"
				>
					<SprintPlanningBoard />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when users need to decide what work belongs in the next cycle, not just view tasks.
						It combines backlog triage, owner and priority context, sprint capacity, lane summaries, and release blockers in a single copyable surface.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>sprintIssues</code> with issues from Linear, Jira, GitHub Projects, Asana, or your own project API.</li>
						<li>Persist <code>selectedIssueId</code>, <code>activeView</code>, and filter values in the route when the board lives inside a larger workspace.</li>
						<li>Connect the planning actions to your estimate, assignment, status transition, sprint close, and release note workflows.</li>
						<li>Keep the summary metrics server-backed when estimates, blockers, or assignees can change concurrently.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended issue shape">
				<CodeBlock lang="js" filename="sprint-issue.js" :code="`{
\tid: 'APP-148',
\ttitle: 'Add workspace invite approval rules',
\tlane: 'Ready',
\tpriority: 'High',
\ttype: 'Feature',
\towner: 'Priya',
\testimate: 5,
\tdue: 'Jun 14',
\tblockers: ['Security review'],
\ttags: ['Admin', 'Growth'],
\tdescription: 'Let admins require approval before new domains join a workspace.'
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Board updates</h3>
						<p class="mt-2">Move cards with your drag-and-drop library or keep explicit status buttons for audit-heavy teams.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Capacity rules</h3>
						<p class="mt-2">Calculate story points, engineering days, or weighted effort on the server when multiple teams plan together.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Mobile behavior</h3>
						<p class="mt-2">The board switches to tabs so users can review one lane at a time without horizontal scrolling.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
