<script setup>
import { computed, ref } from 'vue';
import {
	DomField,
	DomForm,
	DomGridFieldLayout,
	DomNumberInput,
	DomTextInput,
} from '@getdom/studio/vue';
import InvoiceLetterFieldLayout from './InvoiceLetterFieldLayout.vue';

const invoice = ref({
	number: 'INV-2026-014',
	client: 'Bright Studio',
	contact: 'billing@bright.example',
	due: '30 June 2026',
	lineItems: [
		{ description: 'Design system audit', quantity: 1, rate: 1200 },
		{ description: 'Form component implementation', quantity: 2, rate: 850 },
		{ description: 'Documentation pass', quantity: 1, rate: 450 },
	],
});

const total = computed(() => invoice.value.lineItems.reduce((sum, item) => (
	sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0)
), 0));

function lineTotal(item) {
	return (Number(item.quantity) || 0) * (Number(item.rate) || 0);
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
	<DomForm
		v-model="invoice"
		name="invoice"
		class="w-full max-w-4xl space-y-6"
	>
		<DomField :field-layout="InvoiceLetterFieldLayout" :chrome="false">
			<div class="grid gap-6 lg:grid-cols-[1fr_18rem]">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg">Invoice to</p>
					<DomTextInput name="client" label="Client" />
					<DomTextInput name="contact" label="Contact" />
				</div>
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg">Details</p>
					<DomTextInput name="number" label="Number" />
					<DomTextInput name="due" label="Due" />
				</div>
			</div>
		</DomField>

		<div class="overflow-x-auto">
			<div class="min-w-[44rem]">
				<div class="grid grid-cols-[minmax(0,1.5fr)_5rem_7rem_7rem] gap-2 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wider text-muted-fg">
					<span>Item</span>
					<span>Qty</span>
					<span>Rate</span>
					<span class="text-right">Total</span>
				</div>

				<DomForm
					v-for="(item, index) in invoice.lineItems"
					:key="index"
					:name="`lineItems.${index}`"
					class="grid grid-cols-[minmax(0,1.5fr)_5rem_7rem_7rem] gap-2 border-b border-border/70 py-3"
				>
					<DomField :field-layout="DomGridFieldLayout" :chrome="false">
						<DomTextInput
							:id="`line-${index}-description`"
							name="description"
							label="Item"
						/>
						<DomNumberInput
							:id="`line-${index}-quantity`"
							name="quantity"
							label="Quantity"
							:min="1"
						/>
						<DomNumberInput
							:id="`line-${index}-rate`"
							name="rate"
							label="Rate"
							:min="0"
							:step="50"
						/>
						<DomField
							:id="`line-${index}-total-field`"
							label="Line total"
							:html-for="`line-${index}-total`"
						>
							<output
								:id="`line-${index}-total`"
								class="flex h-10 items-center justify-end rounded-md border border-input bg-secondary/50 px-3 text-sm font-semibold text-fg"
							>
								{{ money(lineTotal(item)) }}
							</output>
						</DomField>
					</DomField>
				</DomForm>
			</div>
		</div>

		<div class="flex justify-end">
			<div class="w-full max-w-xs space-y-2 text-sm">
				<div class="flex justify-between text-muted-fg">
					<span>Subtotal</span>
					<span>{{ money(total) }}</span>
				</div>
				<div class="flex justify-between border-t border-border pt-3 text-lg font-semibold text-fg">
					<span>Total</span>
					<span>{{ money(total) }}</span>
				</div>
			</div>
		</div>
	</DomForm>
</template>
