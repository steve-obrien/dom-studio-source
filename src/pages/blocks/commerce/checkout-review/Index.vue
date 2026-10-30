<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import CheckoutReview from './examples/CheckoutReview.vue';
import CheckoutReviewSrc from './examples/CheckoutReview.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Checkout Review Block"
			tagline="A responsive checkout review composed from DOM Studio rich selects, status, form, card, and action components."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Commerce" title="Checkout review">
				<Example
					:source="CheckoutReviewSrc"
					filename="CheckoutReview.vue"
					presentation="iframe"
					frame-src="/blocks/commerce/checkout-review/preview/CheckoutReview"
					description="Resize or expand the isolated app viewport to test the rich delivery and payment dropdowns, compact order rows, readiness checks, and sticky desktop summary."
					default-open
					:preview-lines="20"
				>
					<CheckoutReview />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block as the final confirmation step after cart, address, and payment details have been collected.
						The UI keeps order contents, fulfilment choice, payment method, discount state, buyer contact, policy checks, and the primary purchase action on one responsive surface.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Load cart lines, customer details, shipping methods, tax estimates, payment methods, inventory holds, and promo eligibility from server-owned checkout state.</li>
						<li>Persist changes such as shipping speed, gift receipt, promo code, and selected payment method by updating a checkout session before collecting payment.</li>
						<li>Keep tax, shipping, inventory, and fraud decisions server-side. Let the UI explain readiness checks, then validate the final payload immediately before payment authorization.</li>
						<li>Connect the payment action to Stripe, Adyen, Braintree, Shopify, or an internal order API using an idempotency key tied to the checkout session.</li>
						<li>Show unavailable items, expired payment methods, address restrictions, and high-risk changes inline so shoppers can recover without restarting checkout.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended checkout payload">
				<CodeBlock lang="js" filename="checkout-session.js" :code="`{
\tcheckoutId: 'chk_2048',
\tcustomer: {
\t\temail: 'alex@example.com',
\t\tshippingAddressId: 'addr_home',
\t\tpaymentMethodId: 'pm_visa_4242'
\t},
\titems: [
\t\t{ sku: 'KIT-STARTER', name: 'Starter field kit', quantity: 1, unitAmount: 12800 },
\t\t{ sku: 'BAG-TRAVEL', name: 'Travel organiser', quantity: 1, unitAmount: 4600 }
\t],
\tfulfilment: {
\t\tmethodId: 'express',
\t\tdeliveryWindow: 'Jun 14-15',
\t\tinventoryHoldExpiresAt: '2026-06-10T18:32:00Z'
\t},
\tpromo: {
\t\tcode: 'WELCOME10',
\t\tdiscountAmount: 1740
\t},
\ttotals: {
\t\tsubtotal: 17400,
\t\tshipping: 900,
\t\ttax: 3186,
\t\tdiscount: 1740,
\t\ttotal: 19746
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Payment safety</h3>
						<p class="mt-2">Disable final purchase until inventory, tax, payment, and terms checks pass. Use idempotency keys so retries cannot create duplicate orders.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Pricing accuracy</h3>
						<p class="mt-2">Treat displayed totals as a server quote. Refresh totals whenever shipping, address, promo, quantity, or payment method changes.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Reusable address selectors, payment method pickers, split shipment rows, subscription add-ons, wallet buttons, and tax explanation panels would make this block stronger.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
