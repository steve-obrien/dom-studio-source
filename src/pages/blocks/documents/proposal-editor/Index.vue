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
			tagline="A working proposal room with exact-revision authoring, anchored review, server-owned readiness, client delivery, view callbacks, and acceptance evidence."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Documents / Proposals" title="Client proposal room">
				<Example
					:source="ProposalEditorSrc"
					filename="ProposalEditor.vue"
					presentation="iframe"
					frame-src="/blocks/documents/proposal-editor/preview/ProposalEditor"
					description="A Qwilr-, PandaDoc-, and Notion-inspired proposal workspace with focused Proposals, Content, and Details views backed by repository-local APIs."
					default-open
					:preview-lines="16"
				>
					<ProposalEditor />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="Included application behavior">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The block treats proposal authoring as a complete client-delivery lifecycle rather than a document-editor screenshot.
						Sections, commercial line items, reviewer decisions, readiness, delivery, client views, acceptance, evidence, and reset all cross a server API.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Move between draft, sent, and accepted examples while keeping client-facing content and evidence in context.</li>
						<li>Edit sections and delivery settings with rich <code>DomSelect</code> controls and optimistic exact-revision protection.</li>
						<li>Resolve anchored comments, record required reviewer decisions, and let the server calculate six readiness gates.</li>
						<li>Add and remove line-item commercials while preserving minor-unit prices, currency, and frozen send totals.</li>
						<li>Send through a provider-style handoff, record deterministic client callbacks, and retain immutable acceptance evidence across reloads.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local route contract">
				<CodeBlock lang="text" filename="proposal-editor.routes" :code="`GET    /api/block-demos/proposal-editor/bootstrap
GET    /api/block-demos/proposal-editor/proposals/:proposalId
PATCH  /api/block-demos/proposal-editor/proposals/:proposalId/settings
PATCH  /api/block-demos/proposal-editor/proposals/:proposalId/sections/:sectionId
POST   /api/block-demos/proposal-editor/proposals/:proposalId/comments/:commentId/resolve
POST   /api/block-demos/proposal-editor/proposals/:proposalId/reviewers/:reviewerId/decision
POST   /api/block-demos/proposal-editor/proposals/:proposalId/pricing
DELETE /api/block-demos/proposal-editor/proposals/:proposalId/pricing/:itemId
POST   /api/block-demos/proposal-editor/proposals/:proposalId/preflight
POST   /api/block-demos/proposal-editor/proposals/:proposalId/send
POST   /api/block-demos/proposal-editor/proposals/:proposalId/view
POST   /api/block-demos/proposal-editor/proposals/:proposalId/accept
POST   /api/block-demos/proposal-editor/reset`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Production boundaries">
				<div class="grid gap-5 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Document boundary</h3><p class="mt-2">The demo stores structured text in process memory. Production should use durable document storage, a versioned rich-text schema, permissions, autosave or collaboration, PDF rendering, and stable comment anchors.</p></div>
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Client delivery boundary</h3><p class="mt-2">Replace simulated sending and callbacks with a retry-safe provider adapter, verified webhooks, expiring client sessions, email delivery, CRM synchronization, idempotency, and status reconciliation.</p></div>
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Commercial evidence boundary</h3><p class="mt-2">Add authentication, organization authorization, currency and tax policy, discounts, payment or e-sign adapters, immutable audit retention, privacy controls, rate limits, and jurisdiction-specific acceptance rules.</p></div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
