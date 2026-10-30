<script setup>
import { computed, ref } from 'vue';
import { DomBadge, DomFilterBar } from '../../../lib/vue';

const search = ref('');
const filters = ref({});
const definitions = [
	{
		key: 'plan',
		label: 'Plan',
		type: 'select',
		options: [
			{ label: 'Enterprise', value: 'enterprise' },
			{ label: 'Growth', value: 'growth' },
			{ label: 'Starter', value: 'starter' },
		],
	},
	{
		key: 'region',
		label: 'Region',
		type: 'select',
		options: ['Europe', 'North America', 'Asia Pacific'],
	},
	{ key: 'active', label: 'Active', type: 'boolean' },
];

const customers = [
	{ id: 1, name: 'Northstar Labs', owner: 'Maya Chen', plan: 'enterprise', region: 'Europe', active: true },
	{ id: 2, name: 'Arc Studio', owner: 'Priya Shah', plan: 'growth', region: 'North America', active: true },
	{ id: 3, name: 'Canopy Systems', owner: 'Owen Reed', plan: 'starter', region: 'Europe', active: false },
	{ id: 4, name: 'Harbour Health', owner: 'Nadia Ali', plan: 'enterprise', region: 'Asia Pacific', active: true },
];

const visibleCustomers = computed(filterCustomers);

/**
 * Applies the controlled query to the local demo resource collection.
 *
 * @returns {Array<Record<string, unknown>>} Matching customer rows.
 */
function filterCustomers() {
	return customers.filter(matchesCustomer);
}

/**
 * Reports whether one customer matches the controlled query.
 *
 * @param {Record<string, unknown>} customer Customer resource row.
 * @returns {boolean} True when every active query condition matches.
 */
function matchesCustomer(customer) {
	const term = search.value.trim().toLowerCase();
	if (term && !`${customer.name} ${customer.owner}`.toLowerCase().includes(term)) return false;
	if (filters.value.plan && customer.plan !== filters.value.plan) return false;
	if (filters.value.region && customer.region !== filters.value.region) return false;
	if (Object.hasOwn(filters.value, 'active') && customer.active !== filters.value.active) return false;
	return true;
}

/**
 * Converts a stored plan key into a readable label.
 *
 * @param {string} value Stored plan key.
 * @returns {string} Human-readable plan label.
 */
function planLabel(value) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}
</script>

<template>
	<div class="w-full space-y-4">
		<DomFilterBar v-model:search="search" v-model:filters="filters" :definitions="definitions" />

		<div class="grid gap-3 sm:grid-cols-2" aria-live="polite">
			<article v-for="customer in visibleCustomers" :key="customer.id" class="rounded-xl border border-border skin-card p-4">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<h3 class="truncate text-sm font-semibold text-canvas-fg">{{ customer.name }}</h3>
						<p class="mt-1 text-xs text-muted-fg">{{ customer.owner }} · {{ customer.region }}</p>
					</div>
					<DomBadge :tone="customer.active ? 'success' : 'neutral'">{{ customer.active ? 'Active' : 'Paused' }}</DomBadge>
				</div>
				<p class="mt-3 text-xs font-medium text-muted-fg">{{ planLabel(customer.plan) }} plan</p>
			</article>

			<p v-if="!visibleCustomers.length" class="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-fg sm:col-span-2">No customers match this query.</p>
		</div>
	</div>
</template>
