<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import AiCollaborationShell from './examples/AiCollaborationShell.vue';
import AiCollaborationShellSrc from './examples/AiCollaborationShell.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="AI Collaboration Shell Block"
			tagline="A responsive supervised-AI workspace that keeps source context, model suggestions, approval boundaries, and the current human decision in view."
			tag="AI Shell UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="App Shells / AI Workspaces" title="AI collaboration shell">
				<Example
					:source="AiCollaborationShellSrc"
					filename="AiCollaborationShell.vue"
					presentation="iframe"
					frame-src="/blocks/app-shells/ai-workspaces/ai-collaboration-shell/preview/AiCollaborationShell"
					description="Copy this into copilots, agent consoles, research workspaces, or human-review queues. The desktop workstream rail becomes a rich DomSelect inside narrower iframes, while DomCard, DomTabs, DomStatusPill, DomToggle, and DomButton compose the review workflow. Replace the local arrays with goals, suggestions, approvals, context sources, and audit events from your backend."
					default-open
					:preview-lines="14"
				>
					<AiCollaborationShell />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when an AI workflow needs a visible contract between the model and the people supervising it.
						The shell keeps objectives, accepted context, suggested actions, human approvals, and follow-up activity in one operational surface.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Store model suggestions separately from approved changes so humans can compare, annotate, reject, or batch-apply them.</li>
						<li>Attach every suggestion to the context sources, policy checks, model version, and confidence signals that produced it.</li>
						<li>Route high-risk changes through approval states before allowing the assistant to write to production systems.</li>
						<li>Keep the activity trail append-only so model actions, human decisions, and external system updates can be audited later.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended collaboration event shape">
				<CodeBlock lang="js" filename="ai-collaboration-event.js" :code="`{
\tid: 'event_1428',
\tworkspaceId: 'renewal-rescue',
\tgoalId: 'draft-retention-plan',
\ttype: 'suggestion.approved',
\tactor: {
\t\tkind: 'human',
\t\tname: 'Maya Chen'
\t},
\tmodel: {
\t\tname: 'gpt-4.1',
\t\tversion: 'policy-summarizer-v12'
\t},
\tsuggestion: {
\t\tid: 'sg_309',
\t\tlabel: 'Add concession guardrail',
\t\tconfidence: 0.87,
\t\trisk: 'medium',
\t\tcontextSourceIds: ['crm-renewal-note', 'billing-policy']
\t},
\tapproval: {
\t\tstatus: 'approved',
\t\treviewer: 'Maya Chen',
\t\tnote: 'Matches renewal playbook.'
\t},
\tcreatedAt: '2026-06-11T12:14:00Z'
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Context boundary</h3>
						<p class="mt-2">Show which sources the assistant can use, which sources are stale, and which require human confirmation before generation.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Decision states</h3>
						<p class="mt-2">Model suggestions should move through proposed, edited, approved, applied, rejected, and reverted states.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include shared cursors, prompt traces, source diffs, branchable plans, and batch approval controls.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
