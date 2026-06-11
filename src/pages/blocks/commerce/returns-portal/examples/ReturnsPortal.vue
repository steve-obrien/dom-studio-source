<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomCheckbox, DomNativeSelect, DomTextareaInput, DomTextInput } from '@getdom/studio/vue';

const orderItems = [
	{
		id: 'linen-shirt',
		name: 'Linen camp collar shirt',
		variant: 'Sage / Medium',
		sku: 'LS-204-M-SGE',
		price: 84,
		quantity: 1,
		deliveredAt: 'May 28, 2026',
		windowDaysLeft: 18,
		eligible: true,
		status: 'Eligible',
		reason: 'Return window open',
	},
	{
		id: 'canvas-tote',
		name: 'Everyday canvas tote',
		variant: 'Natural',
		sku: 'CT-118-NAT',
		price: 38,
		quantity: 1,
		deliveredAt: 'May 28, 2026',
		windowDaysLeft: 18,
		eligible: true,
		status: 'Eligible',
		reason: 'Return window open',
	},
	{
		id: 'archive-scarf',
		name: 'Archive silk scarf',
		variant: 'Limited edition',
		sku: 'AS-332-LTD',
		price: 62,
		quantity: 1,
		deliveredAt: 'May 20, 2026',
		windowDaysLeft: 10,
		eligible: false,
		status: 'Final sale',
		reason: 'Limited edition items are final sale',
	},
];

const reasonOptions = [
	{ label: 'Too large', value: 'Too large' },
	{ label: 'Too small', value: 'Too small' },
	{ label: 'Changed my mind', value: 'Changed my mind' },
	{ label: 'Arrived damaged', value: 'Arrived damaged' },
	{ label: 'Wrong item received', value: 'Wrong item received' },
];

const resolutionOptions = [
	{ label: 'Exchange for another size', value: 'Exchange' },
	{ label: 'Refund to original payment', value: 'Refund' },
	{ label: 'Store credit', value: 'Store credit' },
];

const methodOptions = [
	{ label: 'Drop-off label', value: 'Drop-off label' },
	{ label: 'Carrier pickup', value: 'Carrier pickup' },
	{ label: 'Return in store', value: 'Return in store' },
];

const activity = [
	{ label: 'Order delivered', detail: 'All eligible items delivered by DPD.', time: 'May 28, 2026' },
	{ label: 'Return window opened', detail: '30 day return period started after delivery.', time: 'May 28, 2026' },
	{ label: 'Support note added', detail: 'Customer asked about sizing guidance.', time: 'Jun 02, 2026' },
];

const selectedItemIds = ref(['linen-shirt']);
const reason = ref('Too large');
const resolution = ref('Exchange');
const returnMethod = ref('Drop-off label');
const confirmCondition = ref(true);
const notes = ref('I would like a large if it is still in stock.');
const contactEmail = ref('alex@example.com');
const submitted = ref(false);

const selectedItems = computed(() => orderItems.filter((item) => selectedItemIds.value.includes(item.id)));
const subtotal = computed(() => selectedItems.value.reduce((total, item) => total + item.price * item.quantity, 0));
const restockingFee = computed(() => (reason.value === 'Arrived damaged' || resolution.value === 'Exchange' ? 0 : Math.round(subtotal.value * 0.08)));
const shippingCredit = computed(() => (reason.value === 'Wrong item received' || reason.value === 'Arrived damaged' ? 6 : 0));
const estimatedTotal = computed(() => Math.max(0, subtotal.value + shippingCredit.value - restockingFee.value));
const readyChecks = computed(() => [
	{
		label: 'At least one eligible item selected',
		passed: selectedItems.value.length > 0,
	},
	{
		label: 'Reason and resolution selected',
		passed: Boolean(reason.value && resolution.value),
	},
	{
		label: 'Condition confirmed',
		passed: confirmCondition.value,
	},
	{
		label: 'Contact email available',
		passed: Boolean(contactEmail.value),
	},
]);
const canSubmit = computed(() => readyChecks.value.every((check) => check.passed));
const selectedCountLabel = computed(() => `${selectedItems.value.length} of ${orderItems.filter((item) => item.eligible).length} eligible selected`);

function toggleItem(item) {
	if (!item.eligible) return;
	if (selectedItemIds.value.includes(item.id)) {
		selectedItemIds.value = selectedItemIds.value.filter((id) => id !== item.id);
		return;
	}
	selectedItemIds.value = [...selectedItemIds.value, item.id];
	submitted.value = false;
}

function submitReturn() {
	if (!canSubmit.value) return;
	submitted.value = true;
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
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-raised px-4 py-4 sm:px-6">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Returns portal</p>
					<h3 class="mt-1 text-2xl font-semibold tracking-tight">Start a return for ORD-10482</h3>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
						Select items, choose a resolution, and prepare a return request with policy checks visible before submission.
					</p>
				</div>
				<div class="grid gap-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
					<span class="font-semibold">Delivered May 28, 2026</span>
					<span class="text-muted-fg">Return window closes Jun 27</span>
				</div>
			</div>
		</header>

		<div class="grid lg:grid-cols-[minmax(0,1fr)_22rem]">
			<main class="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
				<section class="border-b border-border p-4 sm:p-6">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h4 class="font-semibold tracking-tight">Choose return items</h4>
							<p class="mt-1 text-sm text-muted-fg">{{ selectedCountLabel }}</p>
						</div>
						<span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
							{{ money(subtotal) }} selected
						</span>
					</div>

					<div class="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border">
						<button
							v-for="item in orderItems"
							:key="item.id"
							type="button"
							class="grid w-full gap-3 bg-background p-4 text-left transition hover:bg-secondary/60 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
							:class="selectedItemIds.includes(item.id) ? 'bg-primary/5' : ''"
							:disabled="!item.eligible"
							@click="toggleItem(item)"
						>
							<span
								class="mt-1 grid size-5 place-items-center rounded-md border"
								:class="selectedItemIds.includes(item.id) ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-background text-transparent'"
								aria-hidden="true"
							>
								<svg viewBox="0 0 24 24" class="size-3.5" fill="none">
									<path d="m6 12 4 4 8-8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</span>
							<span class="min-w-0">
								<span class="block font-semibold">{{ item.name }}</span>
								<span class="mt-1 block text-sm text-muted-fg">{{ item.variant }} / {{ item.sku }}</span>
								<span class="mt-2 block text-xs font-medium" :class="item.eligible ? 'text-success' : 'text-warning'">
									{{ item.status }} - {{ item.reason }}
								</span>
							</span>
							<span class="grid gap-1 text-sm sm:text-right">
								<span class="font-semibold">{{ money(item.price) }}</span>
								<span class="text-muted-fg">{{ item.windowDaysLeft }} days left</span>
							</span>
						</button>
					</div>
				</section>

				<section class="grid gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
					<div class="grid gap-4">
						<div class="grid gap-4 sm:grid-cols-2">
							<DomNativeSelect v-model="reason" label="Return reason" :options="reasonOptions" />
							<DomNativeSelect v-model="resolution" label="Preferred resolution" :options="resolutionOptions" />
							<DomNativeSelect v-model="returnMethod" label="Return method" :options="methodOptions" />
							<DomTextInput v-model="contactEmail" label="Contact email" autocomplete="email" />
						</div>
						<DomTextareaInput
							v-model="notes"
							label="Notes for the returns team"
							placeholder="Add sizing, exchange, defect, pickup, or packaging details."
							:rows="4"
						/>
						<div class="rounded-2xl bg-secondary/60 p-4">
							<DomCheckbox
								v-model="confirmCondition"
								label="Items are unused and in returnable condition"
								description="Damaged, missing, or worn items may need photo review before approval."
							/>
						</div>
					</div>

					<aside class="rounded-2xl border border-border bg-background p-4">
						<h4 class="font-semibold tracking-tight">Policy checks</h4>
						<div class="mt-4 grid gap-3">
							<div v-for="check in readyChecks" :key="check.label" class="flex items-start gap-3 text-sm">
								<span
									class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold"
									:class="check.passed ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
								>
									{{ check.passed ? 'OK' : '!' }}
								</span>
								<span class="leading-6 text-muted-fg">{{ check.label }}</span>
							</div>
						</div>
					</aside>
				</section>
			</main>

			<aside class="grid content-start gap-0 skin-raised">
				<section class="border-b border-border p-4 sm:p-6">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Estimate</p>
							<h4 class="mt-1 text-xl font-semibold">{{ money(estimatedTotal) }}</h4>
						</div>
						<span class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg">
							{{ resolution }}
						</span>
					</div>

					<div class="mt-5 grid gap-3 text-sm">
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Selected items</span>
							<span class="font-semibold">{{ money(subtotal) }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Shipping credit</span>
							<span class="font-semibold">{{ money(shippingCredit) }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Restocking fee</span>
							<span class="font-semibold">-{{ money(restockingFee) }}</span>
						</div>
					</div>

					<div class="mt-5 rounded-2xl border border-border bg-background p-4 text-sm leading-6 text-muted-fg">
						<p class="font-semibold text-fg">{{ returnMethod }}</p>
						<p class="mt-1">Label and instructions are generated after approval. Exchange requests reserve stock for 48 hours.</p>
					</div>

					<DomButton class="mt-5 w-full" :disabled="!canSubmit" @click="submitReturn">
						{{ submitted ? 'Return request prepared' : 'Prepare return request' }}
					</DomButton>
					<p v-if="submitted" class="mt-3 rounded-2xl bg-success/15 p-3 text-sm font-medium leading-6 text-success">
						Request ready. Send this payload to your returns API to create the RMA and label.
					</p>
				</section>

				<section class="border-b border-border p-4 sm:p-6">
					<h4 class="font-semibold tracking-tight">Selected items</h4>
					<div class="mt-3 grid gap-2">
						<div v-for="item in selectedItems" :key="item.id" class="rounded-xl bg-background px-3 py-2 text-sm">
							<div class="flex items-center justify-between gap-3">
								<span class="font-medium">{{ item.name }}</span>
								<span>{{ money(item.price) }}</span>
							</div>
							<p class="mt-1 text-xs text-muted-fg">{{ item.variant }}</p>
						</div>
						<p v-if="!selectedItems.length" class="text-sm leading-6 text-muted-fg">
							Select an eligible item to build the return request.
						</p>
					</div>
				</section>

				<section class="p-4 sm:p-6">
					<h4 class="font-semibold tracking-tight">Order activity</h4>
					<div class="mt-4 grid gap-4">
						<div v-for="event in activity" :key="event.label" class="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm">
							<span class="mt-1 size-2 rounded-full bg-primary"></span>
							<span>
								<span class="block font-medium">{{ event.label }}</span>
								<span class="mt-1 block leading-6 text-muted-fg">{{ event.detail }}</span>
								<span class="mt-1 block text-xs text-muted-fg">{{ event.time }}</span>
							</span>
						</div>
					</div>
				</section>
			</aside>
		</div>
	</div>
</template>
