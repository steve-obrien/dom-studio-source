<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomCheckbox, DomNativeSelect, DomTextInput } from '@getdom/studio/vue';

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
	{ value: 'standard', label: 'Standard delivery - Jun 17-19', price: 0, detail: 'Included with this order' },
	{ value: 'express', label: 'Express delivery - Jun 14-15', price: 9, detail: 'Tracked priority fulfilment' },
	{ value: 'pickup', label: 'Store pickup - Jun 13', price: 0, detail: 'Oxford Street collection desk' },
];

const paymentOptions = [
	{ value: 'visa', label: 'Visa ending 4242', detail: 'Expires 08/28' },
	{ value: 'amex', label: 'Amex ending 1005', detail: 'Business card' },
	{ value: 'invoice', label: 'Pay by invoice', detail: 'Available for approved teams' },
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

function applyPromo() {
	promoCode.value = promoCode.value.trim().toUpperCase();
	orderPlaced.value = false;
}

function placeOrder() {
	if (!canPlaceOrder.value) return;
	orderPlaced.value = true;
}

function money(value) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		maximumFractionDigits: 0,
	}).format(value);
}
</script>

<template>
	<div class="w-full max-w-7xl overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-4 py-4 sm:px-6">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Checkout review</p>
					<h3 class="mt-1 text-2xl font-semibold tracking-tight">Confirm order CHK-2048</h3>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
						Review fulfilment, payment, discount, risk checks, and the final amount before authorizing payment.
					</p>
				</div>
				<div class="grid gap-1 rounded-2xl border border-border bg-canvas px-4 py-3 text-sm">
					<span class="font-semibold">{{ orderStatusLabel }}</span>
					<span class="text-muted-fg">Quote expires in {{ inventoryHoldMinutes }} minutes</span>
				</div>
			</div>
		</header>

		<div class="grid lg:grid-cols-[minmax(0,1fr)_23rem]">
			<main class="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
				<section class="border-b border-border p-4 sm:p-6">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h4 class="font-semibold tracking-tight">Items in this order</h4>
							<p class="mt-1 text-sm text-muted-fg">{{ cartItems.length }} items reserved for checkout</p>
						</div>
						<span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
							{{ money(subtotal) }} subtotal
						</span>
					</div>

					<div class="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border">
						<div
							v-for="item in cartItems"
							:key="item.id"
							class="grid gap-3 bg-canvas p-4 sm:grid-cols-[minmax(0,1fr)_8rem_auto]"
						>
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<h5 class="font-semibold">{{ item.name }}</h5>
									<span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-fg">{{ item.status }}</span>
								</div>
								<p class="mt-1 text-sm text-muted-fg">{{ item.variant }}</p>
								<p class="mt-2 text-xs font-medium text-muted-fg">{{ item.sku }} / {{ item.eta }}</p>
							</div>
							<div class="text-sm sm:text-right">
								<p class="font-semibold">{{ money(item.price) }}</p>
								<p class="mt-1 text-muted-fg">Qty {{ item.quantity }}</p>
							</div>
							<div class="grid size-10 place-items-center rounded-xl bg-secondary text-muted-fg" aria-hidden="true">
								<svg viewBox="0 0 24 24" class="size-5" fill="none">
									<path d="M7 8h10l-1 11H8L7 8Zm2-3h6l2 3H7l2-3Zm2 7v3M14 12v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</div>
						</div>
					</div>
				</section>

				<section class="grid gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
					<div class="grid gap-5">
						<div class="grid gap-4 md:grid-cols-2">
							<DomNativeSelect v-model="selectedShippingId" label="Delivery method" :options="shippingOptions" @change="orderPlaced = false" />
							<DomNativeSelect v-model="selectedPaymentId" label="Payment method" :options="paymentOptions" @change="orderPlaced = false" />
						</div>

						<div class="grid gap-3 rounded-2xl bg-secondary/60 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
							<DomTextInput v-model="promoCode" label="Promo code" placeholder="Add a code" @keyup.enter="applyPromo" />
							<DomButton class="self-end" variant="secondary" @click="applyPromo">Apply</DomButton>
						</div>

						<div class="grid gap-3 rounded-2xl bg-secondary/50 p-4">
							<DomCheckbox
								v-model="giftReceipt"
								label="Include gift receipt"
								description="Hide prices on the packing slip and include return instructions."
							/>
							<DomCheckbox
								v-model="marketingOptIn"
								label="Send order tips and restock updates"
								description="Optional product guidance for this purchase."
							/>
							<DomCheckbox
								v-model="acceptedTerms"
								label="I agree to the store terms and returns policy"
								description="Required before payment can be authorized."
							/>
						</div>
					</div>

					<aside class="rounded-2xl border border-border bg-canvas p-4">
						<h4 class="font-semibold tracking-tight">Checkout checks</h4>
						<div class="mt-4 grid gap-3">
							<div v-for="check in readyChecks" :key="check.label" class="flex items-start gap-3 text-sm">
								<span
									class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold"
									:class="check.passed ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
								>
									{{ check.passed ? 'OK' : '!' }}
								</span>
								<span class="min-w-0">
									<span class="block font-medium text-canvas-fg">{{ check.label }}</span>
									<span class="mt-0.5 block leading-5 text-muted-fg">{{ check.detail }}</span>
								</span>
							</div>
						</div>
					</aside>
				</section>
			</main>

			<aside class="grid content-start skin-card">
				<section class="border-b border-border p-4 sm:p-6">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Order total</p>
							<h4 class="mt-1 text-3xl font-semibold tracking-tight">{{ money(total) }}</h4>
						</div>
						<span class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg">
							GBP
						</span>
					</div>

					<div class="mt-5 grid gap-3 text-sm">
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Subtotal</span>
							<span class="font-semibold">{{ money(subtotal) }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Discount</span>
							<span class="font-semibold">-{{ money(discount) }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Delivery</span>
							<span class="font-semibold">{{ money(shipping) }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">VAT estimate</span>
							<span class="font-semibold">{{ money(tax) }}</span>
						</div>
					</div>

					<div class="mt-5 rounded-2xl border border-border bg-canvas p-4 text-sm leading-6">
						<p class="font-semibold">{{ selectedShipping.label }}</p>
						<p class="mt-1 text-muted-fg">{{ selectedShipping.detail }}</p>
						<p class="mt-3 font-semibold">{{ selectedPayment.label }}</p>
						<p class="mt-1 text-muted-fg">{{ selectedPayment.detail }}</p>
					</div>

					<DomButton class="mt-5 w-full" :disabled="!canPlaceOrder" @click="placeOrder">
						{{ orderPlaced ? 'Order prepared' : `Pay ${money(total)}` }}
					</DomButton>
					<p v-if="orderPlaced" class="mt-3 rounded-2xl bg-success/15 p-3 text-sm font-medium leading-6 text-success">
						Checkout payload is ready for payment authorization and order creation.
					</p>
					<p v-else-if="!canPlaceOrder" class="mt-3 rounded-2xl bg-warning/15 p-3 text-sm font-medium leading-6 text-warning">
						Resolve payment and terms checks before placing the order.
					</p>
				</section>

				<section class="border-b border-border p-4 sm:p-6">
					<h4 class="font-semibold tracking-tight">Ship to</h4>
					<div class="mt-3 rounded-2xl bg-canvas p-4 text-sm leading-6">
						<p class="font-semibold">Alex Morgan</p>
						<p class="mt-1 text-muted-fg">14 Market Street, London W1F 8ZA</p>
						<p class="mt-1 text-muted-fg">alex@example.com</p>
					</div>
				</section>

				<section class="p-4 sm:p-6">
					<h4 class="font-semibold tracking-tight">Activity</h4>
					<div class="mt-4 grid gap-4">
						<div class="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm">
							<span class="mt-1 size-2 rounded-full bg-primary"></span>
							<span>
								<span class="block font-medium">Quote refreshed</span>
								<span class="mt-1 block leading-6 text-muted-fg">Tax, stock, and delivery options checked for this address.</span>
							</span>
						</div>
						<div class="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm">
							<span class="mt-1 size-2 rounded-full bg-primary"></span>
							<span>
								<span class="block font-medium">Promo validated</span>
								<span class="mt-1 block leading-6 text-muted-fg">WELCOME10 applies to all physical items in the cart.</span>
							</span>
						</div>
					</div>
				</section>
			</aside>
		</div>
	</div>
</template>
