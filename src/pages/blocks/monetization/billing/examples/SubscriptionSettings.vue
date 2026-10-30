<script setup>
import { computed, reactive, ref } from 'vue';
import {
	DomButton,
	DomDialog,
	DomNativeSelect,
	DomStatusPill,
	DomTabs,
	DomTextInput,
} from '@getdom/studio/vue';

const sections = [
	{ key: 'payment-methods', label: 'Payment methods' },
	{ key: 'billing-history', label: 'Billing history' },
	{ key: 'preferences', label: 'Preferences' },
];

const paymentMethods = ref([
	{
		id: 'pm_visa',
		brand: 'Visa',
		lastFour: '4242',
		expires: '08 / 2028',
		owner: 'Northstar Research Ltd',
		primary: true,
	},
	{
		id: 'pm_mastercard',
		brand: 'Mastercard',
		lastFour: '4444',
		expires: '11 / 2027',
		owner: 'Maya Chen',
		primary: false,
	},
]);

const invoices = [
	{
		number: 'INV-2026-0718',
		issuedAt: '18 Jul 2026',
		description: 'Business plan · 84 seats',
		amount: '£4,788.00',
		status: 'Paid',
	},
	{
		number: 'INV-2026-0618',
		issuedAt: '18 Jun 2026',
		description: 'Business plan · 81 seats',
		amount: '£4,617.00',
		status: 'Paid',
	},
	{
		number: 'INV-2026-0518',
		issuedAt: '18 May 2026',
		description: 'Business plan · 78 seats',
		amount: '£4,446.00',
		status: 'Paid',
	},
	{
		number: 'CN-2026-0042',
		issuedAt: '03 May 2026',
		description: 'Seat adjustment credit',
		amount: '−£114.00',
		status: 'Credit',
	},
	{
		number: 'INV-2026-0418',
		issuedAt: '18 Apr 2026',
		description: 'Business plan · 80 seats',
		amount: '£4,560.00',
		status: 'Paid',
	},
];

const historyFilters = [
	{ label: 'All documents', value: 'all' },
	{ label: 'Paid invoices', value: 'paid' },
	{ label: 'Credit notes', value: 'credit' },
];

const countryOptions = [
	{ label: 'United Kingdom', value: 'GB' },
	{ label: 'United States', value: 'US' },
	{ label: 'Canada', value: 'CA' },
	{ label: 'France', value: 'FR' },
	{ label: 'Germany', value: 'DE' },
	{ label: 'Ireland', value: 'IE' },
	{ label: 'Netherlands', value: 'NL' },
];

const taxIdTypes = [
	{ label: 'GB VAT number', value: 'gb_vat' },
	{ label: 'EU VAT number', value: 'eu_vat' },
	{ label: 'US EIN', value: 'us_ein' },
	{ label: 'Canadian BN', value: 'ca_bn' },
];

const activeSection = ref('payment-methods');
const historyFilter = ref('all');
const addPaymentDialogOpen = ref(false);
const cardholderName = ref('Northstar Research Ltd');
const paymentPostcode = ref('EC2A 4NE');
const addedSampleMethod = ref(false);
const saveState = ref('ready');

const preferences = reactive({
	companyName: 'Northstar Research Ltd',
	purchaseOrder: 'PO-2026-041',
	billingEmail: 'accounts-payable@northstar.example',
	addressLine1: '41 Worship Street',
	addressLine2: 'Floor 6',
	city: 'London',
	region: 'Greater London',
	postcode: 'EC2A 2DX',
	country: 'GB',
	taxIdType: 'gb_vat',
	taxId: 'GB 123 4567 89',
});

/**
 * Returns the payment method currently used for automatic invoice collection.
 *
 * @returns {object|undefined} The primary saved payment method.
 */
const primaryPaymentMethod = computed(() => paymentMethods.value.find((method) => method.primary));

/**
 * Filters invoice and credit-note rows for the selected history view.
 *
 * @returns {Array<object>} The visible billing documents.
 */
const visibleInvoices = computed(() => {
	if (historyFilter.value === 'paid') return invoices.filter((invoice) => invoice.status === 'Paid');
	if (historyFilter.value === 'credit') return invoices.filter((invoice) => invoice.status === 'Credit');
	return invoices;
});

/**
 * Makes a saved payment method the organization default.
 *
 * @param {string} methodId - The payment method identifier to make primary.
 * @returns {void}
 */
function makeDefaultPaymentMethod(methodId) {
	paymentMethods.value = paymentMethods.value.map((method) => ({
		...method,
		primary: method.id === methodId,
	}));
}

/**
 * Simulates confirming a provider-hosted payment method setup.
 *
 * @returns {void}
 */
function confirmPaymentMethod() {
	if (!addedSampleMethod.value) {
		paymentMethods.value.push({
			id: 'pm_amex',
			brand: 'Amex',
			lastFour: '0005',
			expires: '09 / 2029',
			owner: cardholderName.value,
			primary: false,
		});
		addedSampleMethod.value = true;
	}

	addPaymentDialogOpen.value = false;
}

/**
 * Marks the current organization billing profile as persisted.
 *
 * @returns {void}
 */
function saveBillingPreferences() {
	saveState.value = 'complete';
}
</script>

<template>
	<section class="min-h-screen bg-canvas p-3 text-canvas-fg sm:p-6 lg:p-8" data-testid="organization-billing-block">
		<div class="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-border skin-card shadow-xl shadow-black/5">
			<header class="border-b border-border px-4 py-5 sm:px-7 sm:py-6">
				<div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
					<div class="flex min-w-0 items-center gap-4">
						<div class="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-fg shadow-sm">
							NR
						</div>
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-fg">
								<span>Organization settings</span>
								<svg viewBox="0 0 16 16" class="size-3" fill="none" aria-hidden="true">
									<path d="m6 3 5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
								<span>Billing</span>
							</div>
							<div class="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
								<h1 class="truncate text-xl font-bold tracking-tight sm:text-2xl">Northstar Research</h1>
								<DomStatusPill label="Organization owner" tone="neutral" size="sm" variant="outline" />
							</div>
							<p class="mt-1 text-sm text-muted-fg">org_northstar_7f29 · Business plan</p>
						</div>
					</div>

					<div class="flex flex-wrap items-center gap-3">
						<div class="mr-2 hidden text-right md:block">
							<p class="text-sm font-semibold">£4,788.00 / month</p>
							<p class="mt-0.5 text-xs text-muted-fg">Next invoice 18 Aug 2026</p>
						</div>
						<DomButton type="button" variant="secondary">Manage plan</DomButton>
					</div>
				</div>
			</header>

			<DomTabs v-model="activeSection" :tabs="sections" variant="page" class="[&_[role=tab]]:shrink-0">
				<template #payment-methods>
					<div class="grid gap-8 px-4 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:py-8">
						<main class="min-w-0">
							<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<h2 class="text-lg font-bold tracking-tight">Payment methods</h2>
									<p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">
										Manage how Northstar Research pays recurring invoices. Your primary method is charged automatically.
									</p>
								</div>
								<DomButton type="button" class="shrink-0" @click="addPaymentDialogOpen = true">
									<svg viewBox="0 0 20 20" class="size-4" fill="none" aria-hidden="true">
										<path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
									</svg>
									Add payment method
								</DomButton>
							</div>

							<div class="mt-5 space-y-3">
								<article
									v-for="method in paymentMethods"
									:key="method.id"
									class="rounded-2xl border p-4 transition sm:p-5"
									:class="method.primary ? 'border-primary/35 bg-primary/[0.035]' : 'border-border bg-canvas'"
								>
									<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
										<div class="flex min-w-0 items-center gap-4">
											<div class="grid h-10 w-16 shrink-0 place-items-center rounded-lg border border-border bg-canvas text-xs font-black uppercase tracking-tight shadow-sm" aria-hidden="true">
												{{ method.brand === 'Mastercard' ? 'MC' : method.brand }}
											</div>
											<div class="min-w-0">
												<div class="flex flex-wrap items-center gap-2">
													<h3 class="text-sm font-semibold">{{ method.brand }} •••• {{ method.lastFour }}</h3>
													<DomStatusPill
														v-if="method.primary"
														label="Primary"
														tone="success"
														size="sm"
													/>
												</div>
												<p class="mt-1 text-sm text-muted-fg">
													Expires {{ method.expires }} <span aria-hidden="true">·</span> {{ method.owner }}
												</p>
											</div>
										</div>

										<div class="flex shrink-0 items-center gap-2">
											<DomButton
												v-if="!method.primary"
												type="button"
												variant="secondary"
												size="sm"
												@click="makeDefaultPaymentMethod(method.id)"
											>
												Make primary
											</DomButton>
											<DomButton type="button" variant="ghost" size="sm">Edit</DomButton>
										</div>
									</div>
								</article>
							</div>

							<div class="mt-6 rounded-2xl border border-border bg-secondary/45 p-4 sm:p-5">
								<div class="flex items-start gap-3">
									<div class="grid size-9 shrink-0 place-items-center rounded-full bg-success/15 text-success">
										<svg viewBox="0 0 20 20" class="size-4" fill="none" aria-hidden="true">
											<path d="M6.5 9V7a3.5 3.5 0 0 1 7 0v2M5 9h10v8H5V9Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
										</svg>
									</div>
									<div>
										<h3 class="text-sm font-semibold">Payment details are handled securely</h3>
										<p class="mt-1 text-sm leading-6 text-muted-fg">
											Card details are collected by the payment provider and are never sent through your application server.
										</p>
									</div>
								</div>
							</div>
						</main>

						<aside class="space-y-4">
							<div class="rounded-2xl border border-border bg-canvas p-5">
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Automatic payment</p>
								<p class="mt-3 text-sm font-semibold">
									{{ primaryPaymentMethod?.brand }} ending {{ primaryPaymentMethod?.lastFour }}
								</p>
								<p class="mt-1 text-sm leading-6 text-muted-fg">We’ll charge this method when the next invoice is finalized.</p>
								<div class="mt-4 border-t border-border pt-4">
									<div class="flex items-center justify-between gap-3 text-sm">
										<span class="text-muted-fg">Next invoice</span>
										<span class="font-medium">18 Aug</span>
									</div>
									<div class="mt-2 flex items-center justify-between gap-3 text-sm">
										<span class="text-muted-fg">Estimate</span>
										<span class="font-medium">£4,788.00</span>
									</div>
								</div>
							</div>

							<div class="rounded-2xl border border-border bg-canvas p-5">
								<h3 class="text-sm font-semibold">Who can manage billing?</h3>
								<p class="mt-2 text-sm leading-6 text-muted-fg">
									Organization owners can change payment methods and invoice details. Billing viewers have read-only access.
								</p>
								<DomButton type="button" variant="ghost" size="sm" class="mt-3 -ml-2">Manage roles</DomButton>
							</div>
						</aside>
					</div>
				</template>

				<template #billing-history>
					<div class="px-4 py-6 sm:px-7 lg:py-8">
						<div class="grid gap-4 sm:grid-cols-3">
							<div class="rounded-2xl border border-border bg-canvas p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Last payment</p>
								<p class="mt-2 text-xl font-bold tracking-tight">£4,788.00</p>
								<p class="mt-1 text-sm text-muted-fg">Paid 18 Jul 2026</p>
							</div>
							<div class="rounded-2xl border border-border bg-canvas p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Current balance</p>
								<p class="mt-2 text-xl font-bold tracking-tight">£0.00</p>
								<p class="mt-1 text-sm text-muted-fg">No payment due</p>
							</div>
							<div class="rounded-2xl border border-border bg-canvas p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Next invoice</p>
								<p class="mt-2 text-xl font-bold tracking-tight">18 Aug 2026</p>
								<p class="mt-1 text-sm text-muted-fg">Estimated £4,788.00</p>
							</div>
						</div>

						<section class="mt-8">
							<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
								<div>
									<h2 class="text-lg font-bold tracking-tight">Billing history</h2>
									<p class="mt-1 text-sm leading-6 text-muted-fg">Invoices, receipts, and credit notes for this organization.</p>
								</div>
								<div class="flex flex-wrap items-end gap-2">
									<DomNativeSelect
										v-model="historyFilter"
										label="Document type"
										:options="historyFilters"
										class="min-w-44"
									/>
									<DomButton type="button" variant="secondary">Download CSV</DomButton>
								</div>
							</div>

							<div class="mt-5 overflow-hidden rounded-2xl border border-border bg-canvas">
								<div class="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)_8rem_7rem_4rem] gap-4 border-b border-border bg-secondary/50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-fg md:grid">
									<span>Document</span>
									<span>Description</span>
									<span>Amount</span>
									<span>Status</span>
									<span class="sr-only">Download</span>
								</div>
								<article
									v-for="invoice in visibleInvoices"
									:key="invoice.number"
									class="grid gap-3 border-b border-border px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)_8rem_7rem_4rem] md:items-center md:gap-4 md:px-5"
								>
									<div class="min-w-0">
										<p class="truncate text-sm font-semibold">{{ invoice.number }}</p>
										<p class="mt-0.5 text-xs text-muted-fg">{{ invoice.issuedAt }}</p>
									</div>
									<p class="text-sm text-muted-fg">{{ invoice.description }}</p>
									<p class="text-sm font-medium">{{ invoice.amount }}</p>
									<DomStatusPill
										:label="invoice.status"
										:tone="invoice.status === 'Paid' ? 'success' : 'neutral'"
										size="sm"
									/>
									<DomButton type="button" variant="ghost" size="sm" :aria-label="`Download ${invoice.number} PDF`">PDF</DomButton>
								</article>
							</div>

							<div class="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-fg">
								<svg viewBox="0 0 20 20" class="mt-0.5 size-4 shrink-0" fill="none" aria-hidden="true">
									<circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4" />
									<path d="M10 9v4M10 6.5v.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
								</svg>
								<p>Billing detail changes apply to future invoices. Previously issued documents keep the details recorded when they were finalized.</p>
							</div>
						</section>
					</div>
				</template>

				<template #preferences>
					<form class="px-4 py-6 sm:px-7 lg:py-8" @input="saveState = 'ready'" @submit.prevent="saveBillingPreferences">
						<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<h2 class="text-lg font-bold tracking-tight">Billing preferences</h2>
								<p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">
									These organization details appear on future invoices and help calculate the correct business tax treatment.
								</p>
							</div>
							<DomStatusPill label="Tax ID verified" tone="success" size="sm" />
						</div>

						<div class="divide-y divide-border">
							<section class="grid gap-5 py-7 lg:grid-cols-[15rem_minmax(0,1fr)]">
								<div>
									<h3 class="text-sm font-semibold">Invoice identity</h3>
									<p class="mt-2 text-sm leading-6 text-muted-fg">The legal entity and finance contact shown on billing documents.</p>
								</div>
								<div class="grid gap-4 sm:grid-cols-2">
									<DomTextInput
										v-model="preferences.companyName"
										label="Company name"
										autocomplete="organization"
										class="sm:col-span-2"
									/>
									<DomTextInput
										v-model="preferences.purchaseOrder"
										label="Purchase order"
										description="Optional. Added to future invoices."
										placeholder="PO number"
									/>
									<DomTextInput
										v-model="preferences.billingEmail"
										label="Billing email"
										type="email"
										autocomplete="email"
										description="Receives invoices and payment notices."
									/>
								</div>
							</section>

							<section class="grid gap-5 py-7 lg:grid-cols-[15rem_minmax(0,1fr)]">
								<div>
									<h3 class="text-sm font-semibold">Primary business address</h3>
									<p class="mt-2 text-sm leading-6 text-muted-fg">Used as the customer billing address and for location-based tax calculation.</p>
								</div>
								<div class="grid gap-4 sm:grid-cols-2">
									<DomTextInput
										v-model="preferences.addressLine1"
										label="Address line 1"
										autocomplete="address-line1"
										class="sm:col-span-2"
									/>
									<DomTextInput
										v-model="preferences.addressLine2"
										label="Address line 2"
										autocomplete="address-line2"
										class="sm:col-span-2"
									/>
									<DomTextInput v-model="preferences.city" label="City" autocomplete="address-level2" />
									<DomTextInput v-model="preferences.region" label="State, county, or region" autocomplete="address-level1" />
									<DomTextInput v-model="preferences.postcode" label="Postal code" autocomplete="postal-code" />
									<DomNativeSelect
										v-model="preferences.country"
										label="Country"
										autocomplete="country"
										:options="countryOptions"
									/>
								</div>
							</section>

							<section class="grid gap-5 py-7 lg:grid-cols-[15rem_minmax(0,1fr)]">
								<div>
									<h3 class="text-sm font-semibold">Business tax ID</h3>
									<p class="mt-2 text-sm leading-6 text-muted-fg">Validated tax identifiers are included on eligible invoices.</p>
								</div>
								<div>
									<div class="grid gap-4 sm:grid-cols-[13rem_minmax(0,1fr)]">
										<DomNativeSelect v-model="preferences.taxIdType" label="Tax ID type" :options="taxIdTypes" />
										<DomTextInput
											v-model="preferences.taxId"
											label="Tax ID"
											description="Validation can take a few moments after saving."
										/>
									</div>
									<div class="mt-4 flex items-start gap-3 rounded-2xl border border-success/25 bg-success/[0.06] p-4">
										<div class="grid size-8 shrink-0 place-items-center rounded-full bg-success/15 text-success">
											<svg viewBox="0 0 20 20" class="size-4" fill="none" aria-hidden="true">
												<path d="m5.5 10 3 3 6-7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
											</svg>
										</div>
										<div>
											<p class="text-sm font-semibold">Verified for invoice use</p>
											<p class="mt-1 text-sm leading-6 text-muted-fg">
												This ID will appear on future invoices for Northstar Research Ltd. Tax treatment remains subject to local rules.
											</p>
										</div>
									</div>
								</div>
							</section>
						</div>

						<footer class="-mx-4 -mb-6 flex flex-col gap-3 border-t border-border bg-secondary/35 px-4 py-4 sm:-mx-7 sm:-mb-8 sm:flex-row sm:items-center sm:justify-between sm:px-7">
							<p class="text-xs leading-5 text-muted-fg">Only organization owners can update billing and tax information.</p>
							<DomButton type="submit">
								{{ saveState === 'complete' ? 'Preferences saved' : 'Save preferences' }}
							</DomButton>
						</footer>
					</form>
				</template>
			</DomTabs>
		</div>

		<DomDialog
			v-model="addPaymentDialogOpen"
			title="Add payment method"
			description="Add a payment method for Northstar Research. It will not become primary until you choose it."
		>
			<div class="space-y-5">
				<DomTextInput v-model="cardholderName" label="Name on card" autocomplete="cc-name" />

				<div>
					<label class="text-sm font-medium text-canvas-fg">Card information</label>
					<div class="mt-2 overflow-hidden rounded-xl border border-input bg-canvas shadow-sm">
						<div class="flex items-center justify-between gap-4 border-b border-border px-3 py-3 text-sm">
							<span class="tracking-wider text-muted-fg">4242 4242 4242 4242</span>
							<span class="text-xs font-bold text-muted-fg">VISA</span>
						</div>
						<div class="grid grid-cols-2 divide-x divide-border text-sm text-muted-fg">
							<span class="px-3 py-3">MM / YY</span>
							<span class="px-3 py-3">CVC</span>
						</div>
					</div>
					<p class="mt-2 flex items-center gap-1.5 text-xs text-muted-fg">
						<svg viewBox="0 0 16 16" class="size-3.5" fill="none" aria-hidden="true">
							<path d="M5 7V5a3 3 0 0 1 6 0v2M4 7h8v6H4V7Z" stroke="currentColor" stroke-width="1.3" />
						</svg>
						Secure fields are hosted by Stripe in production.
					</p>
				</div>

				<DomTextInput v-model="paymentPostcode" label="Billing postal code" autocomplete="postal-code" />
			</div>

			<template #footer>
				<DomButton type="button" variant="secondary" data-close>Cancel</DomButton>
				<DomButton type="button" @click="confirmPaymentMethod">Add payment method</DomButton>
			</template>
		</DomDialog>
	</section>
</template>
