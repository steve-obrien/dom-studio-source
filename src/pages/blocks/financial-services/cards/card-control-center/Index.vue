<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import CardControlCenter from './examples/CardControlCenter.vue';
import CardControlCenterSrc from './examples/CardControlCenter.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Card Control Center Block"
			tagline="A working card-operations desk with revisioned policies, immediate freeze controls, travel notices, step-up detail reveal, replacement lifecycle, and immutable evidence."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Financial services / Cards" title="Card operations desk">
				<Example
					:source="CardControlCenterSrc"
					filename="CardControlCenter.vue"
					presentation="iframe"
					frame-src="/blocks/financial-services/cards/card-control-center/preview/CardControlCenter"
					description="A Revolut-, Wise-, and Stripe Issuing-inspired card workspace with focused Cards, Controls, and Activity views backed by repository-local APIs."
					default-open
					:preview-lines="16"
				>
					<CardControlCenter />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="Included application behavior">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The block treats card controls as an operational product surface rather than a local settings mock.
						Card inventory, policy revisions, status changes, travel notices, step-up detail reveal, replacement, evidence, and reset all cross a server API.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Move between active, frozen, and replacing card examples while preserving each card's policy, activity, and receipts.</li>
						<li>Freeze or unfreeze immediately with server-owned authorization, an exact revision, a required reason, and a durable receipt.</li>
						<li>Change spend limits, cadence, merchant policy, and authorization controls through rich <code>DomSelect</code> and DOM Studio form controls.</li>
						<li>Add validated travel notices and reveal PAN or CVC only after a single-use confirmation-code challenge.</li>
						<li>Order a replacement with reason, delivery choice, acknowledgement, lifecycle state, and immutable evidence.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local route contract">
				<CodeBlock lang="text" filename="card-control-center.routes" :code="`GET   /api/block-demos/card-control-center/bootstrap
GET   /api/block-demos/card-control-center/cards/:cardId
PATCH /api/block-demos/card-control-center/cards/:cardId/policy
POST  /api/block-demos/card-control-center/cards/:cardId/status
POST  /api/block-demos/card-control-center/cards/:cardId/travel-notices
POST  /api/block-demos/card-control-center/cards/:cardId/reveal-challenges
POST  /api/block-demos/card-control-center/cards/:cardId/reveal-challenges/:challengeId
POST  /api/block-demos/card-control-center/cards/:cardId/replacement
POST  /api/block-demos/card-control-center/reset`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Production boundaries">
				<div class="grid gap-5 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Issuer boundary</h3><p class="mt-2">The demo uses deterministic process-local records. Production should authenticate every actor, authorize the account and card, reconcile processor webhooks, model pending authorizations, and persist idempotent operations in durable storage.</p></div>
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Sensitive-data boundary</h3><p class="mt-2">Keep PAN and CVC inside an issuer token vault or PCI-scoped reveal surface. Add secure challenge delivery, HSM-backed secrets, strict expiry, rate limits, fraud controls, and complete secret redaction.</p></div>
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Evidence boundary</h3><p class="mt-2">Replace process memory with transactional revisions, distributed locking, immutable audit retention, signed receipts, compliance review, support tooling, and jurisdiction-specific travel and replacement policy.</p></div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
