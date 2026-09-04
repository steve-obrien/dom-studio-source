<script setup>
import { DomButton, DomCard, DomDataGrid, DomTextInput } from '@getdom/studio';
import '@getdom/studio/style.css';

const columns = [
	{ key: 'name', label: 'Customer' },
	{ key: 'plan', label: 'Plan', type: 'select', options: ['Starter', 'Pro'] },
	{ key: 'mrr', label: 'MRR', type: 'currency', currency: 'GBP' },
];

const rows = [
	{ id: 1, name: 'Acme Ltd', plan: 'Pro', mrr: 2400 },
	{ id: 2, name: 'Northstar', plan: 'Starter', mrr: 850 },
	{ id: 3, name: 'Paper Street', plan: 'Pro', mrr: 1750 },
];
</script>

<template>
	<main class="mx-auto max-w-5xl space-y-8 p-8">
		<DomDataGrid
			:rows="rows"
			:columns="columns"
			title="Customers"
			height="24rem"
		/>

		<DomCard class="space-y-4 p-6">
			<DomTextInput name="email" label="Email" type="email" />
			<DomButton>Continue</DomButton>
		</DomCard>
	</main>
</template>
