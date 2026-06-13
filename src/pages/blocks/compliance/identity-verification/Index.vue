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
			tagline="A responsive KYC and identity verification flow for collecting profile details, documents, consent, risk checks, and review-ready evidence."
			tag="Compliance UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Compliance" title="Identity verification flow">
				<Example
					:source="IdentityVerificationFlowSrc"
					filename="IdentityVerificationFlow.vue"
					presentation="iframe"
					frame-src="/blocks/compliance/identity-verification/preview/IdentityVerificationFlow"
					description="Copy this into fintech onboarding, marketplaces, age-gated products, healthcare portals, creator platforms, or admin review tools that need a structured verification packet before activation."
					default-open
					:preview-lines="18"
				>
					<IdentityVerificationFlow />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a product needs to move a user from signup to a reviewable identity packet without scattering fields, document capture, and compliance checks across several screens.
						It works as a customer-facing verification step or as the front end for an internal onboarding reviewer.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>profile</code>, <code>documents</code>, <code>riskSignals</code>, and <code>activityEvents</code> with state from your verification provider, customer record, or case management API.</li>
						<li>Connect document upload actions to a provider such as Stripe Identity, Persona, Onfido, Veriff, Alloy, Middesk, or your own secure file service.</li>
						<li>Keep sanctions, PEP, duplicate identity, device, and address checks server-owned. The UI should explain readiness, not make final compliance decisions locally.</li>
						<li>Submit a signed verification packet with consent timestamp, applicant identifiers, required evidence IDs, country, provider session ID, and reviewer notes.</li>
						<li>For mobile flows, keep one step visible at a time and let users resume from the last incomplete evidence item.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended verification payload">
				<CodeBlock lang="js" filename="identity-verification-packet.js" :code="`{
\tverificationId: 'ver_2048',
\tapplicantId: 'usr_maya',
\tstatus: 'ready_for_review',
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
\tdocuments: [
\t\t{ type: 'passport', status: 'complete', evidenceId: 'ev_passport_front' },
\t\t{ type: 'proof_of_address', status: 'complete', evidenceId: 'ev_bank_statement' },
\t\t{ type: 'selfie_liveness', status: 'processing', evidenceId: 'ev_liveness_1' }
\t],
\tchecks: {
\t\tsanctions: 'clear',
\t\tpep: 'clear',
\t\tduplicateIdentity: 'review',
\t\triskScore: 38
\t},
\tconsent: {
\t\tacceptedAt: '2026-06-10T18:44:00Z',
\t\tversion: 'kyc_terms_2026_02'
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Provider handoff</h3>
						<p class="mt-2">Create a server-side provider session, pass only the client token to the browser, and persist provider evidence IDs after each upload or liveness step.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Review safety</h3>
						<p class="mt-2">Store consent, reviewer comments, decision reasons, and risk check versions so approvals and rejections can be audited later.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include document camera capture, provider session adapters, rejection reason templates, re-verification reminders, and manual review queues.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
