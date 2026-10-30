<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import DocumentSigningPacket from './examples/DocumentSigningPacket.vue';
import DocumentSigningPacketSrc from './examples/DocumentSigningPacket.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Document Signing Block"
			tagline="A working signing-envelope section with version approval, exact-revision preparation, provider handoff, recipient reminders, deterministic callbacks, and completion certificates."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Documents / Agreements" title="Document signing envelope room">
				<Example
					:source="DocumentSigningPacketSrc"
					filename="DocumentSigningPacket.vue"
					presentation="iframe"
					frame-src="/blocks/documents/document-signing/preview/DocumentSigningPacket"
					description="A DocuSign-, Dropbox Sign-, and Adobe Sign-inspired envelope workspace with focused Envelopes, Document, and Details views backed by repository-local APIs."
					default-open
					:preview-lines="16"
				>
					<DocumentSigningPacket />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="Included application behavior">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The block treats document signing as a complete envelope lifecycle rather than a packet-builder screenshot.
						Document selection, exact-version approval, recipients, fields, readiness, delivery, reminders, callbacks, evidence, certificate retrieval, voiding, and reset all cross a server API.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Move between draft, in-progress, and completed envelopes while keeping the active document and evidence in context.</li>
						<li>Prepare recipients and delivery settings with rich <code>DomSelect</code> controls and exact-revision conflict protection.</li>
						<li>Place server-owned field templates on meaningful agreement content and gate sending on checksum-specific document approval.</li>
						<li>Send through a provider-style handoff, enforce signing order, issue guarded reminders, and simulate deterministic recipient callbacks.</li>
						<li>Preserve immutable activity evidence, void receipts, completion state, and a downloadable certificate across reloads.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local route contract">
				<CodeBlock lang="text" filename="document-signing.routes" :code="`GET    /api/block-demos/document-signing/bootstrap
GET    /api/block-demos/document-signing/envelopes/:envelopeId
PATCH  /api/block-demos/document-signing/envelopes/:envelopeId/settings
PATCH  /api/block-demos/document-signing/envelopes/:envelopeId/recipients/:recipientId
POST   /api/block-demos/document-signing/envelopes/:envelopeId/fields
DELETE /api/block-demos/document-signing/envelopes/:envelopeId/fields/:fieldId
POST   /api/block-demos/document-signing/envelopes/:envelopeId/documents/:documentId/approve
POST   /api/block-demos/document-signing/envelopes/:envelopeId/preflight
POST   /api/block-demos/document-signing/envelopes/:envelopeId/send
POST   /api/block-demos/document-signing/envelopes/:envelopeId/recipients/:recipientId/reminders
POST   /api/block-demos/document-signing/envelopes/:envelopeId/recipients/:recipientId/sign
POST   /api/block-demos/document-signing/envelopes/:envelopeId/void
GET    /api/block-demos/document-signing/envelopes/:envelopeId/certificate
POST   /api/block-demos/document-signing/reset`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Production boundaries">
				<div class="grid gap-5 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Document boundary</h3><p class="mt-2">The demo serves deterministic agreement content. Production should ingest and render real PDFs, scan uploads, encrypt originals and derivatives, version checksums, and keep field coordinates tied to canonical pages.</p></div>
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Provider boundary</h3><p class="mt-2">Replace simulated handoff and callbacks with an idempotent provider adapter, verified webhooks, signed recipient sessions, email delivery, reminder policy, identity checks, and retry-safe status reconciliation.</p></div>
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Evidence boundary</h3><p class="mt-2">Add authentication, organization authorization, durable encrypted storage, immutable audit retention, certificate verification, privacy controls, rate limits, legal review, and jurisdiction-specific consent rules.</p></div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
