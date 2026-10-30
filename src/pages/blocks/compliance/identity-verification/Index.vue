<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import IdentityVerificationFlow from './examples/IdentityVerificationFlow.vue';
import IdentityVerificationFlowSrc from './examples/IdentityVerificationFlow.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Identity Verification Block"
			tagline="A Persona- and Stripe Identity-inspired verification section with working profile, evidence, screening, support, and submission APIs."
			tag="Working API"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Compliance" title="Identity verification flow">
				<Example
					:source="IdentityVerificationFlowSrc"
					filename="IdentityVerificationFlow.vue"
					presentation="iframe"
					frame-src="/blocks/compliance/identity-verification/preview/IdentityVerificationFlow"
					description="Use the complete resumable section in fintech onboarding, marketplaces, creator payouts, or regulated account activation. The example already reads and mutates a process-local verification provider API."
					default-open
					:preview-lines="18"
				>
					<IdentityVerificationFlow />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="Working API included">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a product needs to move an applicant from signup to a reviewable identity packet without scattering fields, provider capture, consent, and screening across disconnected screens. The included API supports resume state, optimistic revisions, provider failure recovery, support requests, immutable evidence references, and receipt-backed submission.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/identity-verification/bootstrap</code> supplies provider context and rich verification, country, document, capture, and declaration options.</li>
						<li>Session endpoints validate and save the profile, consent, PEP declaration, support requests, and optimistic revisions.</li>
						<li>Evidence capture returns provider references and recoverable quality errors; screening remains server-owned.</li>
						<li>Submission requires every readiness gate plus an explicit acknowledgement, then returns a packet ID, review lane, decision estimate, and checksum.</li>
						<li>Replace the process-local store and demo provider with durable encrypted storage, real provider sessions, authorization, webhooks, and auditable reviewer decisions in production.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended verification payload">
				<CodeBlock lang="js" filename="identity-verification-packet.js" :code="`{
\tverificationId: 'ver_2048',
\tapplicantId: 'usr_maya',
\trevision: 7,
\tstatus: 'submitted',
\ttype: 'individual',
\tcountry: 'GB',
\tprofile: {
\t\tlegalName: 'Maya Hart',
\t\temail: 'maya@example.com',
\t\tdateOfBirth: '1991-04-18',
\t\taddress: {
\t\t\tline1: '24 Leather Lane',
\t\t\tcity: 'London',
\t\t\tpostalCode: 'EC1N 7SU',
\t\t\tcountry: 'GB'
\t\t}
\t},
\tevidence: [
\t\t{ id: 'identity', status: 'verified', providerRef: 'ev_identity_7834211' },
\t\t{ id: 'address', status: 'verified', providerRef: 'ev_address_4928123' },
\t\t{ id: 'selfie', status: 'verified', providerRef: 'ev_selfie_4928168' }
\t],
\tchecks: {
\t\tsanctions: 'clear',
\t\tpep: 'clear',
\t\tduplicateIdentity: 'review',
\t\triskScore: 38
\t},
\tdeclarations: {
\t\tpepExposure: 'not_exposed',
\t\tconsentAccepted: true,
\t\tconsentVersion: 'identity_terms_2026_08'
\t},
\treceipt: {
\t\tpacketId: 'packet_iv_maya_2048',
\t\treviewLane: 'Standard manual review',
\t\tchecksum: 'sha256:...'
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Provider handoff</h3>
						<p class="mt-2">The demo already models a server-owned provider boundary. Replace it with Stripe Identity, Persona, Onfido, Veriff, or another adapter while preserving opaque evidence references.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Review safety</h3>
						<p class="mt-2">Store consent, reviewer comments, decision reasons, and risk check versions so approvals and rejections can be audited later.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Production follow-ups include camera framing, webhook reconciliation, rejection reason templates, re-verification reminders, and manual reviewer queues.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
