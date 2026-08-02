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
			tagline="A working contract-review desk with cited AI findings, exact-revision human decisions, reviewer gates, immutable release evidence, and redline receipts."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Documents / Review" title="AI-assisted contract review desk">
				<Example
					:source="AiDocumentReviewSrc"
					filename="AiDocumentReview.vue"
					presentation="iframe"
					frame-src="/blocks/documents/review/ai-document-review/preview/AiDocumentReview"
					description="An Ironclad-, Harvey-, and GitHub-review-inspired contract workspace with focused Documents, Contract, and Review views backed by repository-local APIs."
					default-open
					:preview-lines="16"
				>
					<AiDocumentReview />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="Included application behavior">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The block treats AI review as a complete governed document workflow rather than a local rewrite preview.
						Policy settings, analysis, cited findings, human decisions, clause patches, reviewer gates, release, redline exports, evidence, and reset all cross a server API.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Move between in-review, ready, and released examples while preserving the selected clause and its evidence.</li>
						<li>Review rich <code>DomTextDiff</code> comparisons with source text, policy citations, confidence, rationale, and prompt provenance.</li>
						<li>Accept or dismiss findings at an exact revision, requiring explicit acknowledgement before a high-risk patch is applied.</li>
						<li>Change policy packs and jurisdictions with rich <code>DomSelect</code> controls that correctly invalidate stale analysis.</li>
						<li>Require server preflight and named reviewer approval before creating immutable release and redline export receipts.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local route contract">
				<CodeBlock lang="text" filename="ai-document-review.routes" :code="`GET   /api/block-demos/ai-document-review/bootstrap
GET   /api/block-demos/ai-document-review/documents/:documentId
PATCH /api/block-demos/ai-document-review/documents/:documentId/settings
POST  /api/block-demos/ai-document-review/documents/:documentId/analysis
POST  /api/block-demos/ai-document-review/documents/:documentId/findings/:findingId/decision
POST  /api/block-demos/ai-document-review/documents/:documentId/reviewers/:reviewerId/decision
POST  /api/block-demos/ai-document-review/documents/:documentId/preflight
POST  /api/block-demos/ai-document-review/documents/:documentId/release
POST  /api/block-demos/ai-document-review/documents/:documentId/export
POST  /api/block-demos/ai-document-review/reset`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Production boundaries">
				<div class="grid gap-5 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Document boundary</h3><p class="mt-2">The demo uses deterministic structured clauses. Production should ingest and scan real files, preserve canonical source bytes, store versioned rich text or PDF coordinates, encrypt derivatives, and reject stale anchors.</p></div>
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">AI boundary</h3><p class="mt-2">Replace the deterministic analysis with a private AI gateway, policy retrieval, redaction, prompt and model pinning, evals, citation validation, spend controls, safe retries, and human-review thresholds.</p></div>
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Evidence boundary</h3><p class="mt-2">Add authentication, organization and matter authorization, durable storage, immutable audit retention, malware scanning, privacy controls, legal holds, verified exports, rate limits, and jurisdiction-specific review policy.</p></div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
