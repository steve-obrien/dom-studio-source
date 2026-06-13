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
			tagline="A responsive post-purchase return workflow with item selection, eligibility checks, refund estimates, resolution choice, and request history."
			tag="Commerce UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Commerce" title="Returns portal">
				<Example
					:source="ReturnsPortalSrc"
					filename="ReturnsPortal.vue"
					presentation="iframe"
					frame-src="/blocks/commerce/returns-portal/preview/ReturnsPortal"
					description="Copy this into an account, order detail, support, or commerce self-service area. Replace the sample order with your fulfilment, policy, inventory, refund, and carrier data."
					default-open
					:preview-lines="14"
				>
					<ReturnsPortal />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when customers need to start a return or exchange without contacting support.
						The layout keeps item selection, return reason, refund method, policy checks, and submission readiness visible in one workflow so customers understand what will happen next.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>orderItems</code> with line items from your order service, including fulfilment date, price, quantity, return window, and eligibility status.</li>
						<li>Submit selected items, reason, resolution, notes, and pickup/drop-off preference to a returns API that creates an RMA or support case.</li>
						<li>Use the eligibility checks to explain non-returnable items, final-sale products, expired windows, damaged-goods review, or policy exceptions.</li>
						<li>Connect refund estimates to your tax, discount, store-credit, payment-provider, and restocking-fee rules before presenting the final amount.</li>
						<li>Send the activity timeline from shipment tracking, label generation, warehouse inspection, refund approval, and exchange fulfilment events.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended return request shape">
				<CodeBlock lang="js" filename="return-request.js" :code="`{
\torderId: 'ORD-10482',
\titems: [
\t\t{ lineItemId: 'linen-shirt', quantity: 1, reason: 'Too large', condition: 'Unworn with tags' }
\t],
\tresolution: 'Exchange',
\trefundMethod: 'Original payment method',
\treturnMethod: 'Drop-off label',
\tnotes: 'Need one size down if available.',
\tpolicyChecks: [
\t\t{ key: 'return_window', passed: true, detail: '18 days left' },
\t\t{ key: 'item_condition', passed: true, detail: 'Customer confirmed unworn' }
\t],
\testimatedRefund: {
\t\titems: 84,
\t\tshippingCredit: 0,
\t\trestockingFee: 0,
\t\ttotal: 84,
\t\tcurrency: 'GBP'
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Eligibility rules</h3>
						<p class="mt-2">Keep customer-facing policy messages close to each line item so shoppers know why an item can or cannot be selected.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Refund accuracy</h3>
						<p class="mt-2">Treat the visible refund amount as an estimate until taxes, discounts, duties, restocking fees, and inspection outcomes are calculated server-side.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include reusable order item rows, label download states, exchange inventory pickers, carrier pickup scheduling, and photo evidence uploads.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
