<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import CardDisputeFlow from './examples/CardDisputeFlow.vue';
import CardDisputeFlowSrc from './examples/CardDisputeFlow.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Card Dispute Flow Block"
			tagline="A copyable fintech dispute intake flow for reviewing a card transaction, selecting a reason, collecting evidence, and submitting a case with clear eligibility checks."
			tag="Fintech UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Disputes" title="Card dispute flow">
				<Example
					:source="CardDisputeFlowSrc"
					filename="CardDisputeFlow.vue"
					presentation="iframe"
					frame-src="/blocks/financial-services/disputes/card-dispute-flow/preview/CardDisputeFlow"
					description="Copy this into banking, wallet, marketplace, subscription, expense, or commerce apps where customers need to dispute a charge without opening a generic support ticket."
					default-open
					:preview-lines="18"
				>
					<CardDisputeFlow />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a transaction needs a guided, auditable dispute path rather than a free-form support form.
						The mobile view keeps the selected charge, dispute reason, customer evidence, temporary card controls, and final submit action close together, while the companion case packet gives support and risk teams a larger-screen summary.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Hydrate <code>transactions</code> from your card ledger, payment processor, or billing system with stable IDs, merchant descriptors, amount, status, card, and dispute deadline fields.</li>
						<li>Return eligibility from the server. The client can explain missing evidence, deadlines, provisional credit, or card replacement options, but should not decide network dispute rules alone.</li>
						<li>Keep dispute answers structured by reason code so they can map to card-network evidence packages, merchant inquiries, billing support queues, or internal fraud review.</li>
						<li>Store uploaded evidence as separate file records linked to the case. Run malware scanning, retention policy, and redaction asynchronously without blocking the form draft.</li>
						<li>Persist every submission and card-control change as an event with actor, device context, old state, new state, and policy snapshot for audit and customer support.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended dispute payload">
				<CodeBlock lang="js" filename="card-dispute-case.js" :code="`{
\tid: 'disp_2048',
\ttransactionId: 'txn_9384',
\taccountId: 'acct_4412',
\tcardId: 'card_ending_2048',
\tstatus: 'draft',
\treasonCode: 'unauthorized',
\tamount: {
\t\tvalue: 128.40,
\t\tcurrency: 'GBP'
\t},
\tmerchant: {
\t\tdescriptor: 'Luma Cloud Services',
\t\tcategory: 'Software',
\t\tcontactedAt: null
\t},
\tanswers: {
\t\tcardInPossession: true,
\t\trecognizesMerchant: false,
\t\tdetails: 'I did not authorize this subscription charge.'
\t},
\tevidence: [
\t\t{ id: 'file_1', type: 'screenshot', status: 'uploaded' }
\t],
\tcontrols: {
\t\tfreezeCard: true,
\t\treplaceCard: false,
\t\tprovisionalCreditEligible: true
\t},
\tsubmittedAt: null
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Eligibility service</h3>
						<p class="mt-2">Calculate deadlines, provisional credit, card-network reason codes, and merchant-contact requirements in a backend service that the UI mirrors.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Evidence mapping</h3>
						<p class="mt-2">Normalize evidence into typed records such as receipt, cancellation proof, merchant conversation, tracking, and screenshot so operations teams can package cases quickly.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include file upload thumbnails, card replacement shipping, live chat escalation, network reason-code mapping, and support-agent case review variants.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
