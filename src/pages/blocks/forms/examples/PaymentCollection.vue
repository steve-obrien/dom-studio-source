<script setup>
import { ref } from 'vue';
import { DomButton, DomCard, DomCheckbox, DomForm, DomNativeSelect, DomNumberInput, DomTextInput } from '../../../lib/vue';

const payment = ref({
	amount: 249,
	name: 'Maya Patel',
	card: '',
	expiry: '',
	cvc: '',
	country: 'gb',
	save: true,
});

const countries = [
	{ label: 'United Kingdom', value: 'gb' },
	{ label: 'United States', value: 'us' },
	{ label: 'Ireland', value: 'ie' },
	{ label: 'Germany', value: 'de' },
];
</script>

<template>
	<DomCard padding="lg" class="w-full max-w-2xl mx-auto">
		<div class="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Payment</p>
				<h3 class="mt-2 text-2xl font-semibold tracking-tight">Collect payment</h3>
				<p class="mt-2 max-w-lg text-sm leading-6 text-muted-fg">
					A billing form layout for card details, region, amount, and save-card preference.
				</p>
			</div>
			<span class="rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">Secure checkout</span>
		</div>

		<DomForm v-model="payment" name="payment" class="mt-6 grid gap-5">
			<div class="grid gap-5 md:grid-cols-[1fr_0.7fr]">
				<DomTextInput name="name" label="Name on card" placeholder="Maya Patel" required autocomplete="cc-name" />
				<DomNumberInput name="amount" label="Amount" :min="1" :step="1" required />
			</div>

			<DomTextInput
				name="card"
				label="Card number"
				placeholder="4242 4242 4242 4242"
				required
				autocomplete="cc-number"
			/>

			<div class="grid gap-5 md:grid-cols-3">
				<DomTextInput name="expiry" label="Expiry" placeholder="MM / YY" required autocomplete="cc-exp" />
				<DomTextInput name="cvc" label="CVC" placeholder="123" required autocomplete="cc-csc" />
				<DomNativeSelect name="country" label="Country" :options="countries" placeholder="Select country" />
			</div>

			<div class="rounded-2xl border border-border bg-secondary/50 p-4">
				<DomCheckbox
					name="save"
					label="Save payment method"
					description="Store this card for future invoices and subscription renewals."
				/>
			</div>

			<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
				<p class="text-xs text-muted-fg">Card processing UI only. Wire this to your payment provider in application code.</p>
				<DomButton type="submit">Charge card</DomButton>
			</div>
		</DomForm>
	</DomCard>
</template>
