<script setup>
import { computed, ref } from 'vue';
import {
	DomButton,
	DomCard,
	DomCheckbox,
	DomSelect,
	DomStatusPill,
	DomTextInput,
} from '@getdom/studio/vue';

const cartItems = [
	{
		id: 'starter-kit',
		name: 'Starter field kit',
		variant: 'Graphite / Standard',
		sku: 'KIT-STARTER',
		price: 128,
		quantity: 1,
		status: 'Reserved',
		eta: 'Ships today',
	},
	{
		id: 'travel-organiser',
		name: 'Travel organiser',
		variant: 'Olive canvas',
		sku: 'BAG-TRAVEL',
		price: 46,
		quantity: 1,
		status: 'Low stock',
		eta: '2 left',
	},
	{
		id: 'care-plan',
		name: 'Two year care plan',
		variant: 'Covers repair and replacement',
		sku: 'CARE-24',
		price: 24,
		quantity: 1,
		status: 'Digital',
		eta: 'Starts after purchase',
	},
];

const shippingOptions = [
	{ value: 'standard', label: 'Standard delivery', window: 'Jun 17-19', price: 0, detail: 'Included with this order', description: 'Jun 17-19 · Included with this order' },
	{ value: 'express', label: 'Express delivery', window: 'Jun 14-15', price: 9, detail: 'Tracked priority fulfilment', description: 'Jun 14-15 · Tracked priority fulfilment · £9' },
	{ value: 'pickup', label: 'Store pickup', window: 'Jun 13', price: 0, detail: 'Oxford Street collection desk', description: 'Jun 13 · Oxford Street collection desk' },
];

const paymentOptions = [
	{ value: 'visa', label: 'Visa ending 4242', detail: 'Expires 08/28', description: 'Personal card · Expires 08/28' },
	{ value: 'amex', label: 'Amex ending 1005', detail: 'Business card', description: 'Business card · Finance team default' },
	{ value: 'invoice', label: 'Pay by invoice', detail: 'Available for approved teams', description: 'Requires finance approval before fulfilment' },
];

const selectedShippingId = ref('express');
const selectedPaymentId = ref('visa');
const promoCode = ref('WELCOME10');
const giftReceipt = ref(true);
const acceptedTerms = ref(true);
const marketingOptIn = ref(false);
const orderPlaced = ref(false);

const selectedShipping = computed(() => shippingOptions.find((option) => option.value === selectedShippingId.value) || shippingOptions[0]);
const selectedPayment = computed(() => paymentOptions.find((option) => option.value === selectedPaymentId.value) || paymentOptions[0]);
const subtotal = computed(() => cartItems.reduce((total, item) => total + item.price * item.quantity, 0));
const discount = computed(() => promoCode.value.trim().toUpperCase() === 'WELCOME10' ? Math.round(subtotal.value * 0.1) : 0);
const shipping = computed(() => selectedShipping.value.price);
const tax = computed(() => Math.round((subtotal.value - discount.value + shipping.value) * 0.2));
const total = computed(() => subtotal.value - discount.value + shipping.value + tax.value);
const inventoryHoldMinutes = computed(() => selectedShippingId.value === 'pickup' ? 22 : 18);
const readyChecks = computed(() => [
	{
		label: 'Inventory held for all physical items',
		detail: `${inventoryHoldMinutes.value} minutes remaining`,
		passed: true,
	},
	{
		label: 'Payment method can be charged',
		detail: selectedPayment.value.detail,
		passed: selectedPaymentId.value !== 'invoice',
	},
	{
		label: 'Tax and delivery quote refreshed',
		detail: selectedShipping.value.detail,
		passed: true,
	},
	{
		label: 'Terms accepted',
		detail: 'Required before payment authorization',
		passed: acceptedTerms.value,
	},
]);
const canPlaceOrder = computed(() => readyChecks.value.every((check) => check.passed));
const orderStatusLabel = computed(() => orderPlaced.value ? 'Order ready' : canPlaceOrder.value ? 'Ready to pay' : 'Needs attention');

/**
 * Normalizes the entered promotion code and invalidates any prepared order.
 *
 * @returns {void}
 */
function applyPromo() {
	promoCode.value = promoCode.value.trim().toUpperCase();
	orderPlaced.value = false;
}

/**
 * Marks the order as prepared when every checkout readiness check passes.
 *
 * @returns {void}
 */
function placeOrder() {
	if (!canPlaceOrder.value) return;
	orderPlaced.value = true;
}

/**
 * Clears the prepared state after a buyer changes a checkout decision.
 *
 * @returns {void}
 */
function resetOrderState() {
	orderPlaced.value = false;
}

/**
 * Formats an integer amount as a whole-pound display value.
 *
 * @param {number} value Amount in pounds.
 * @returns {string} Localized GBP amount.
 */
function money(value) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		maximumFractionDigits: 0,
	}).format(value);
}
</script>

<template>
	<div class="min-h-screen bg-secondary/30 text-canvas-fg">
		<header class="border-b border-border bg-canvas">
			<div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Secure checkout / Review</p>
					<h1 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Confirm order CHK-2048</h1>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">Check delivery, payment, and the final total before authorizing this order.</p>
				</div>
				<div class="flex items-center gap-3">
					<DomStatusPill :tone="canPlaceOrder ? 'success' : 'warning'" :label="orderStatusLabel" size="sm" />
					<p class="text-xs text-muted-fg">Quote held for {{ inventoryHoldMinutes }} min</p>
				</div>
			</div>
		</header>

		<main class="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:px-8 lg:py-8">
			<div class="min-w-0 overflow-hidden border-y border-border bg-canvas sm:rounded-2xl sm:border">
				<section class="p-4 sm:p-6" aria-labelledby="checkout-items-heading">
					<div class="flex flex-wrap items-end justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Order</p>
							<h2 id="checkout-items-heading" class="mt-1 text-lg font-semibold tracking-tight">{{ cartItems.length }} reserved items</h2>
						</div>
						<p class="text-sm font-semibold tabular-nums">{{ money(subtotal) }} subtotal</p>
					</div>

					<ul class="mt-4 divide-y divide-border border-y border-border">
						<li v-for="item in cartItems" :key="item.id" class="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-4">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<h3 class="font-semibold">{{ item.name }}</h3>
									<DomStatusPill tone="neutral" :label="item.status" size="sm" />
								</div>
								<p class="mt-1 text-sm text-muted-fg">{{ item.variant }}</p>
								<p class="mt-1 text-xs text-muted-fg">{{ item.sku }} / {{ item.eta }}</p>
							</div>
							<div class="text-right text-sm">
								<p class="font-semibold tabular-nums">{{ money(item.price) }}</p>
								<p class="mt-1 text-muted-fg">Qty {{ item.quantity }}</p>
							</div>
						</li>
					</ul>
				</section>

				<section class="grid gap-6 border-t border-border p-4 sm:p-6" aria-labelledby="checkout-decisions-heading">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Fulfilment and payment</p>
						<h2 id="checkout-decisions-heading" class="mt-1 text-lg font-semibold tracking-tight">Choose how to complete the order</h2>
					</div>

					<div class="grid gap-6 lg:grid-cols-2">
						<div>
							<DomSelect v-model="selectedShippingId" :options="shippingOptions" label="Delivery method" width="min-w-[20rem]" @update:model-value="resetOrderState" />
							<div class="mt-3 border-l-2 border-primary pl-3 text-sm">
								<p class="font-semibold">{{ selectedShipping.label }} / {{ selectedShipping.window }}</p>
								<p class="mt-1 text-muted-fg">{{ selectedShipping.detail }} · {{ shipping ? money(shipping) : 'Free' }}</p>
							</div>
						</div>

						<div>
							<DomSelect v-model="selectedPaymentId" :options="paymentOptions" label="Payment method" width="min-w-[20rem]" @update:model-value="resetOrderState" />
							<div class="mt-3 border-l-2 border-primary pl-3 text-sm">
								<p class="font-semibold">{{ selectedPayment.label }}</p>
								<p class="mt-1 text-muted-fg">{{ selectedPayment.detail }}</p>
							</div>
						</div>
					</div>

					<div class="grid gap-3 border-t border-border pt-5 sm:grid-cols-[minmax(0,1fr)_auto]">
						<DomTextInput v-model="promoCode" label="Promo code" placeholder="Add a code" @keyup.enter="applyPromo" />
						<DomButton class="self-end" variant="secondary" @click="applyPromo">Apply code</DomButton>
					</div>

					<div class="grid gap-3 border-t border-border pt-5">
						<DomCheckbox v-model="giftReceipt" label="Include gift receipt" description="Hide prices on the packing slip and include return instructions." />
						<DomCheckbox v-model="marketingOptIn" label="Send order tips and restock updates" description="Optional product guidance for this purchase." />
						<DomCheckbox v-model="acceptedTerms" label="I agree to the store terms and returns policy" description="Required before payment can be authorized." @update:model-value="resetOrderState" />
					</div>
				</section>

				<section class="border-t border-border p-4 sm:p-6" aria-labelledby="checkout-checks-heading">
					<div class="flex flex-wrap items-end justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Readiness</p>
							<h2 id="checkout-checks-heading" class="mt-1 text-lg font-semibold tracking-tight">Checkout checks</h2>
						</div>
						<p class="text-xs text-muted-fg">Validated just now</p>
					</div>
					<ul class="mt-4 grid gap-x-6 gap-y-4 md:grid-cols-2">
						<li v-for="check in readyChecks" :key="check.label" class="flex items-start gap-3 text-sm">
							<DomStatusPill :tone="check.passed ? 'success' : 'warning'" :label="check.passed ? 'Ready' : 'Review'" size="sm" />
							<span class="min-w-0">
								<span class="block font-medium">{{ check.label }}</span>
								<span class="mt-0.5 block leading-5 text-muted-fg">{{ check.detail }}</span>
							</span>
						</li>
					</ul>
				</section>
			</div>

			<aside class="grid gap-5 lg:sticky lg:top-5">
				<DomCard as="section" padding="lg" aria-labelledby="checkout-total-heading">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Order total</p>
							<h2 id="checkout-total-heading" class="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{{ money(total) }}</h2>
						</div>
						<span class="text-xs font-semibold text-muted-fg">GBP</span>
					</div>

					<dl class="mt-5 grid gap-3 border-b border-border pb-5 text-sm">
						<div class="flex items-center justify-between gap-3"><dt class="text-muted-fg">Subtotal</dt><dd class="font-semibold tabular-nums">{{ money(subtotal) }}</dd></div>
						<div class="flex items-center justify-between gap-3"><dt class="text-muted-fg">Discount</dt><dd class="font-semibold tabular-nums">-{{ money(discount) }}</dd></div>
						<div class="flex items-center justify-between gap-3"><dt class="text-muted-fg">Delivery</dt><dd class="font-semibold tabular-nums">{{ money(shipping) }}</dd></div>
						<div class="flex items-center justify-between gap-3"><dt class="text-muted-fg">VAT estimate</dt><dd class="font-semibold tabular-nums">{{ money(tax) }}</dd></div>
					</dl>

					<div class="mt-5 text-sm leading-6">
						<p class="font-semibold">Ship to Alex Morgan</p>
						<p class="text-muted-fg">14 Market Street, London W1F 8ZA</p>
					</div>

					<DomButton class="mt-5 w-full" :disabled="!canPlaceOrder" @click="placeOrder">
						{{ orderPlaced ? 'Order prepared' : `Pay ${money(total)}` }}
					</DomButton>
					<p v-if="orderPlaced" class="mt-3 border-l-2 border-success pl-3 text-sm font-medium leading-6 text-success">Checkout payload is ready for payment authorization.</p>
					<p v-else-if="!canPlaceOrder" class="mt-3 border-l-2 border-warning pl-3 text-sm font-medium leading-6 text-warning">Resolve payment and terms checks before placing the order.</p>
				</DomCard>

				<div class="px-1 text-xs leading-5 text-muted-fg">
					<p class="font-semibold text-canvas-fg">Latest activity</p>
					<p class="mt-1">Tax, stock, delivery, and WELCOME10 were refreshed for this address.</p>
				</div>
			</aside>
		</main>
	</div>
</template>
