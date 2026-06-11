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
			tagline="A responsive packet builder for preparing signers, placing required fields, checking delivery rules, and sending documents for signature."
			tag="Documents"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Preparation" title="Document signing packet">
				<Example
					:source="DocumentSigningPacketSrc"
					filename="DocumentSigningPacket.vue"
					presentation="iframe"
					frame-src="/blocks/documents/document-signing/preview/DocumentSigningPacket"
					description="Copy this into HR onboarding, sales contracts, legal approvals, marketplace agreements, fintech consent flows, or any app that prepares documents for signature."
					default-open
					:preview-lines="18"
				>
					<DocumentSigningPacket />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when users need to assemble a signature packet without leaving the app. It keeps document context, recipients, field placement,
						delivery settings, send readiness, and activity history visible in one copyable workflow.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace the local <code>signers</code>, <code>documents</code>, and <code>placedFields</code> arrays with packet data from your document API.</li>
						<li>Persist field coordinates as page-relative percentages so placement survives responsive scaling and PDF rendering changes.</li>
						<li>Validate signer identity, required fields, message copy, reminder rules, and signing order on the server before sending.</li>
						<li>Send packets through providers such as DocuSign, Dropbox Sign, PandaDoc, Adobe Acrobat Sign, or your own certificate-backed signing service.</li>
						<li>Store immutable audit events for viewed, signed, declined, reassigned, reminder-sent, completed, and voided states.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended signing packet payload">
				<CodeBlock lang="js" filename="document-signing-packet.js" :code="`{
\tpacket: {
\t\tid: 'pkt_2048',
\t\tname: 'Offer letter and NDA',
\t\tstatus: 'draft',
\t\tdeliveryMode: 'Signing order',
\t\tmessage: 'Please review and sign before Friday.'
\t},
\tdocuments: [
\t\t{ id: 'offer', name: 'Offer Letter.pdf', pages: 4, version: 'v3' }
\t],
\tsigners: [
\t\t{
\t\t\tid: 'candidate',
\t\t\tname: 'Riley Chen',
\t\t\temail: 'riley@example.com',
\t\t\trole: 'Candidate',
\t\t\torder: 1,
\t\t\tidentityCheck: true
\t\t}
\t],
\tfields: [
\t\t{
\t\t\tid: 'field_1',
\t\t\tdocumentId: 'offer',
\t\t\tsignerId: 'candidate',
\t\t\ttype: 'signature',
\t\t\tpage: 4,
\t\t\trequired: true,
\t\t\tx: 63,
\t\t\ty: 78
\t\t}
\t],
\tauditEvents: [
\t\t{ actor: 'Mina Cook', action: 'Prepared packet', at: '2026-06-10T19:42:00Z' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Field placement</h3>
						<p class="mt-2">Store coordinates against a canonical PDF page size. The example uses percentages so fields stay attached while the preview scales.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Send safety</h3>
						<p class="mt-2">Treat client checks as guidance only. The final send endpoint should verify signer emails, required fields, document versions, and permissions.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include a PDF page renderer, drag field handles, reusable signer rows, provider adapters, certificate evidence, and decline reason flows.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
