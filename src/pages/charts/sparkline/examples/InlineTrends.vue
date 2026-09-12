<script setup>
import { DomSparkline } from '@getdom/studio';
const products = [
	{ name: 'Starter', revenue: '£7,000', values: [4, 8, 6, 9, 7, 12, 14] },
	{ name: 'Growth', revenue: '£17,200', values: [12, 10, 15, 12, 16, 18, 22] },
	{ name: 'Scale', revenue: '£21,600', values: [8, 12, 9, 14, 20, 19, 25] },
];
/** Projects weekly measurements into the same record format used by full-size charts. */
function trendRows(values) { return values.map((value, index) => ({ week: `Week ${index + 1}`, value })); }
</script>
<template>
	<div class="w-full overflow-auto">
		<table class="w-full text-left text-sm"><caption class="sr-only">Revenue and seven-week trends by plan</caption>
			<thead class="text-xs text-muted-fg"><tr><th scope="col" class="py-3">Plan</th><th scope="col" class="py-3 text-right">Revenue</th><th scope="col" class="py-3 pl-6">Seven-week trend</th></tr></thead>
			<tbody><tr v-for="product in products" :key="product.name" class="border-t border-border"><th scope="row" class="py-4 font-medium">{{ product.name }}</th><td class="py-4 text-right tabular-nums">{{ product.revenue }}</td><td class="w-40 py-4 pl-6"><DomSparkline :title="`${product.name} revenue trend`" :rows="trendRows(product.values)" x-key="week" :series="[{ key: 'value', color: 'chart-2' }]" /></td></tr></tbody>
		</table>
	</div>
</template>
