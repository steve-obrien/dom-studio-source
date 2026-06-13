<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import AiDocumentReview from './examples/AiDocumentReview.vue';
import AiDocumentReviewSrc from './examples/AiDocumentReview.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="AI Document Review Block"
			tagline="A responsive human-in-the-loop document review surface for previewing AI suggestions, accepting edits, and preserving reviewer accountability."
			tag="AI Review"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Documents" title="AI document review">
				<Example
					:source="AiDocumentReviewSrc"
					filename="AiDocumentReview.vue"
					presentation="iframe"
					frame-src="/blocks/documents/review/ai-document-review/preview/AiDocumentReview"
					description="Copy this into contract review, sales proposal, help center, policy, AI writing, or content operations apps where generated suggestions need explicit human acceptance before they change the source document."
					default-open
					:preview-lines="18"
				>
					<AiDocumentReview />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when AI should assist a reviewer without silently rewriting customer-facing or regulated content.
						The document stays central, suggestion anchors make the AI output auditable, and the active recommendation includes preview, reasoning, confidence, and accept or dismiss actions.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>documentSections</code> with your document model, including stable section IDs, reviewer status, and source text.</li>
						<li>Generate suggestions server-side from your AI gateway, then store each suggestion with original text, proposed text, rationale, confidence, policy flags, and reviewer outcome.</li>
						<li>Apply accepted suggestions as explicit document patches so undo history, version compare, comments, and approval workflows remain traceable.</li>
						<li>Keep dismissals as first-class review events. They are useful for evals, prompt tuning, and measuring overzealous or low-quality AI recommendations.</li>
						<li>Run final publication gates on the server; the readiness meter in this block should mirror backend policy, not replace it.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended review payload">
				<CodeBlock lang="js" filename="ai-document-review.js" :code="`{
\tdocument: {
\t\tid: 'doc_security_addendum_2048',
\t\ttitle: 'Security addendum',
\t\tstatus: 'ai_review',
\t\townerId: 'usr_maya',
\t\tlastReviewedAt: '2026-06-11T18:18:00Z'
\t},
\tsuggestions: [
\t\t{
\t\t\tid: 'sug_liability_plain_language',
\t\t\tsectionId: 'liability',
\t\t\ttype: 'clarity',
\t\t\tconfidence: 92,
\t\t\tseverity: 'medium',
\t\t\toriginalText: 'Vendor shall use commercially reasonable efforts...',
\t\t\tproposedText: 'Vendor will take reasonable steps...',
\t\t\trationale: 'Uses clearer customer-facing language while preserving intent.',
\t\t\tpolicyFlags: ['legal_review_required'],
\t\t\tstate: 'pending'
\t\t}
\t],
\treviewEvents: [
\t\t{
\t\t\tid: 'evt_1',
\t\t\tsuggestionId: 'sug_liability_plain_language',
\t\t\taction: 'accepted',
\t\t\treviewerId: 'usr_maya',
\t\t\tcreatedAt: '2026-06-11T18:21:00Z'
\t\t}
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Patch discipline</h3>
						<p class="mt-2">Apply accepted suggestions as targeted patches against section versions. Reject stale suggestions when the underlying section has changed.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Review evidence</h3>
						<p class="mt-2">Store confidence, prompt version, reviewer, action, and final text. This keeps AI-assisted changes explainable during customer, legal, and compliance review.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include multi-reviewer approval, redline export, live collaboration, suggestion grouping, prompt feedback, and side-by-side version compare.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
