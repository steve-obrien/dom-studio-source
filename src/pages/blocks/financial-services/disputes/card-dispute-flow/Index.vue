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
			tagline="A working dispute-resolution workspace with transaction triage, exact-revision intake, verified evidence, server eligibility, card protection, provisional credit, and immutable case receipts."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Financial services / Disputes" title="Card dispute resolution workspace">
				<Example
					:source="CardDisputeFlowSrc"
					filename="CardDisputeFlow.vue"
					presentation="iframe"
					frame-src="/blocks/financial-services/disputes/card-dispute-flow/preview/CardDisputeFlow"
					description="A Monzo-, Revolut-, and Stripe disputes-inspired workspace with focused Transactions, Claim, Evidence, and Case views backed by repository-local APIs."
					default-open
					:preview-lines="16"
				>
					<CardDisputeFlow />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="Included application behavior">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The block treats charge disputes as a complete resolution workflow rather than a local support form.
						Transaction detail, exact-revision intake, typed evidence, eligibility checks, card protection, filing, provisional credit, immutable receipts, and reset all cross a server API.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Move between untouched, draft, submitted, and pending transaction examples while preserving claim and case lifecycle state.</li>
						<li>Capture network-mappable reason codes and structured answers through rich <code>DomSelect</code> and DOM Studio form controls.</li>
						<li>Add and remove typed evidence records with verification status, notes, checksums, exact revisions, and immutable mutation receipts.</li>
						<li>Run server-owned filing-window, statement, evidence, merchant-contact, reason-proof, and card-protection checks before submission.</li>
						<li>Freeze or replace compromised credentials immediately, then create a locked case, operations queue handoff, and provisional-credit decision.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local route contract">
				<CodeBlock lang="text" filename="card-dispute-flow.routes" :code="`GET    /api/block-demos/card-dispute-flow/bootstrap
GET    /api/block-demos/card-dispute-flow/transactions/:transactionId
PATCH  /api/block-demos/card-dispute-flow/transactions/:transactionId/claim
POST   /api/block-demos/card-dispute-flow/transactions/:transactionId/evidence
DELETE /api/block-demos/card-dispute-flow/transactions/:transactionId/evidence/:evidenceId
POST   /api/block-demos/card-dispute-flow/transactions/:transactionId/preflight
POST   /api/block-demos/card-dispute-flow/transactions/:transactionId/protection
POST   /api/block-demos/card-dispute-flow/transactions/:transactionId/submit
POST   /api/block-demos/card-dispute-flow/reset`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Production boundaries">
				<div class="grid gap-5 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Network boundary</h3><p class="mt-2">The demo uses deterministic policy decisions. Production should authenticate the actor, authorize the account and card, reconcile processor data, map current network rules, manage representment deadlines, and make every filing idempotent.</p></div>
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Evidence boundary</h3><p class="mt-2">Store real files privately with signed upload sessions, malware scanning, MIME validation, redaction, retention, legal hold, immutable checksums, access logging, and case-scoped authorization.</p></div>
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Money and support boundary</h3><p class="mt-2">Connect provisional credits to a double-entry ledger, issuer policy, regulatory timing, clawback handling, customer notifications, escalation queues, durable audit storage, and operations decision tooling.</p></div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
