<script setup>
import { computed, ref } from 'vue';
import { DomMoneyInput } from '../../../lib/vue';

const amount = ref('149.00');
const seats = ref('12');
const monthlyTotal = computed(() => {
	const price = Number(amount.value);
	const quantity = Number(seats.value);
	if (!Number.isFinite(price) || !Number.isFinite(quantity)) return '0.00';
	return (price * quantity).toFixed(2);
});
</script>

<template>
	<div class="w-full max-w-xl rounded-lg border border-border bg-canvas p-5 shadow-sm">
		<div class="grid gap-4 sm:grid-cols-2">
			<DomMoneyInput
				v-model="amount"
				label="Seat price"
				description="Stored as a decimal string."
				currency="GBP"
			/>
			<label class="grid gap-1 text-sm">
				<span class="font-medium text-canvas-fg">Seats</span>
				<input v-model="seats" class="skin-input h-10" inputmode="numeric" />
			</label>
		</div>
		<div class="mt-5 rounded-md border border-border bg-secondary/40 p-4">
			<p class="text-xs font-semibold uppercase text-muted-fg">Preview total</p>
			<p class="mt-1 text-2xl font-semibold tracking-tight text-canvas-fg">£{{ monthlyTotal }} / month</p>
		</div>
	</div>
</template>
