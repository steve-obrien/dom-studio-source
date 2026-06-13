<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import ProposalEditor from './examples/ProposalEditor.vue';
import ProposalEditorSrc from './examples/ProposalEditor.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Proposal Editor Block"
			tagline="A responsive document editor for drafting proposals, reviewing comments, checking approval gates, and publishing a client-ready packet."
			tag="Documents"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Editor" title="Collaborative proposal editor">
				<Example
					:source="ProposalEditorSrc"
					filename="ProposalEditor.vue"
					presentation="iframe"
					frame-src="/blocks/documents/proposal-editor/preview/ProposalEditor"
					description="Copy this into sales, consulting, onboarding, procurement, knowledge-base, or internal planning apps where teams need a focused editor with review workflow and publication readiness."
					default-open
					:preview-lines="18"
				>
					<ProposalEditor />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when an app needs more than a plain textarea but less than a full document product. It keeps the proposal canvas, section outline,
						active draft controls, comments, and approval gates together so teams can move from draft to client-ready output without switching tools.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace the local <code>sections</code>, <code>comments</code>, and <code>approvalGates</code> arrays with document state from your backend.</li>
						<li>Persist each section independently so autosave, permissions, review status, and version history can be scoped to the edited block.</li>
						<li>Store comments with anchors such as <code>sectionId</code>, text range, author, state, and timestamps so review notes survive document reordering.</li>
						<li>Run final approval checks server-side before publishing or exporting to PDF. Client-side readiness should be treated as guidance only.</li>
						<li>Connect publish actions to your PDF renderer, CRM opportunity, e-signature packet, or customer portal delivery workflow.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended proposal payload">
				<CodeBlock lang="js" filename="proposal-editor.js" :code="`{
\tdocument: {
\t\tid: 'proposal_2048',
\t\ttitle: 'Northstar onboarding proposal',
\t\tclient: 'Northstar Labs',
\t\tstatus: 'review',
\t\townerId: 'usr_maya',
\t\tlastSavedAt: '2026-06-11T15:58:00Z'
\t},
\tsections: [
\t\t{
\t\t\tid: 'scope',
\t\t\ttitle: 'Scope of work',
\t\t\tstatus: 'review',
\t\t\tbody: 'Migration planning, workspace setup, and enablement for the customer success team.',
\t\t\twordCount: 84
\t\t}
\t],
\tcomments: [
\t\t{
\t\t\tid: 'comment_1',
\t\t\tsectionId: 'scope',
\t\t\tauthor: 'Ari Patel',
\t\t\tbody: 'Confirm whether analytics migration is included in phase one.',
\t\t\tstate: 'open',
\t\t\tcreatedAt: '2026-06-11T15:42:00Z'
\t\t}
\t],
\tapprovalGates: [
\t\t{ key: 'pricing', label: 'Pricing approved', complete: true },
\t\t{ key: 'legal', label: 'Legal review complete', complete: false }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Autosave model</h3>
						<p class="mt-2">Save section deltas instead of the full document when possible. This keeps collaboration, undo history, and conflict handling easier to reason about.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Review anchors</h3>
						<p class="mt-2">Attach comments to stable section IDs and optional text ranges. Recompute display positions after reorder, insert, or export operations.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include rich text marks, presence cursors, compare versions, reusable approval gates, export progress, and reusable comment threads.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
