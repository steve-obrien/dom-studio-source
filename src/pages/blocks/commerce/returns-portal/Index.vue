<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import ReturnsPortal from './examples/ReturnsPortal.vue';
import ReturnsPortalSrc from './examples/ReturnsPortal.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Returns Portal Block"
			tagline="A working self-service return section with API-backed eligibility, saved drafts, exchange stock, refund estimates, submission proof, and request history."
			tag="Reviewed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Commerce" title="Returns portal">
				<Example
					:source="ReturnsPortalSrc"
					filename="ReturnsPortal.vue"
					presentation="iframe"
					frame-src="/blocks/commerce/returns-portal/preview/ReturnsPortal"
					description="Copy this Loop- and Amazon-inspired guided return into an account, order detail, support, or commerce self-service area. The responsive workflow uses repository-local APIs instead of a prepared screenshot state."
					default-open
					:preview-lines="14"
					frame-flush-edges
				>
					<ReturnsPortal />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when customers need to start a return or exchange without contacting support.
						The step-led layout keeps the current decision focused while a live summary explains eligibility, exchange stock, refund value, return method, and submission readiness.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/returns-portal/orders</code> and <code>GET /api/block-demos/returns-portal/:orderId</code> provide order choices, return eligibility, exchange inventory, saved drafts, estimates, and existing request proof.</li>
						<li><code>PATCH /api/block-demos/returns-portal/:orderId/draft</code> validates every selected item, reason, resolution, exchange size, return method, email, and optimistic revision before persisting the workflow.</li>
						<li><code>POST /api/block-demos/returns-portal/:orderId/submit</code> reruns server-owned readiness checks and creates immutable return proof only after every requirement passes.</li>
						<li>Final-sale items, invalid exchange options, stale revisions, invalid contact details, and incomplete submissions return actionable API errors.</li>
						<li>The example store is process-local so saved drafts and approved returns survive reloads while the dev server is running. Production should replace it with authenticated order, RMA, payment, inventory, and carrier services.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended return request shape">
				<CodeBlock lang="js" filename="return-request.js" :code="`{
\torderId: 'ord_10482',
\trevision: 10,
\titems: [
\t\t{ lineItemId: 'linen-shirt', quantity: 1, reason: 'too-large' }
\t],
\tresolution: 'exchange',
\texchangeOption: 'linen-shirt-large',
\treturnMethod: 'drop-off',
\tcontactEmail: 'alex@example.com',
\tnotes: 'Please reserve one size larger.',
\tconditionConfirmed: true,
\tpolicyChecks: [
\t\t{ key: 'items', passed: true, detail: '1 eligible item selected' },
\t\t{ key: 'condition', passed: true, detail: 'Customer confirmed returnable condition' }
\t],
\testimatedRefund: {
\t\tsubtotal: 84,
\t\tbonus: 0,
\t\tfee: 0,
\t\ttotal: 84,
\t\tcurrency: 'GBP'
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Eligibility rules</h3>
						<p class="mt-2">The demo API already rejects final-sale items and invalid exchange sizes. Add authentication, order ownership, return-window dates, and policy-version evidence at the production boundary.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Refund accuracy</h3>
						<p class="mt-2">Treat the visible refund amount as an estimate until taxes, discounts, duties, restocking fees, and inspection outcomes are calculated server-side.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include durable RMA storage, idempotent submissions, real carrier labels, pickup scheduling, photo evidence, warehouse inspection, and payment-provider refund webhooks.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
