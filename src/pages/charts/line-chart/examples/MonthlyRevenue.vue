<script setup>
import { ref } from 'vue';
import { DomLineChart } from '@getdom/studio';
const rows = [
	{ month: 'Apr', revenue: 18200, target: 22000, subscriptions: 12400, services: 5800 },
	{ month: 'May', revenue: 22400, target: 22000, subscriptions: 14600, services: 7800 },
	{ month: 'Jun', revenue: 19800, target: 22000, subscriptions: 13800, services: 6000 },
	{ month: 'Jul', revenue: 26800, target: 22000, subscriptions: 18400, services: 8400 },
	{ month: 'Aug', revenue: 24300, target: 22000, subscriptions: 17500, services: 6800 },
	{ month: 'Sep', revenue: 31200, target: 22000, subscriptions: 21600, services: 9600 },
];
const selected = ref(null);
const series = [{ key: 'revenue', label: 'Revenue', color: 'chart-1' }, { key: 'target', label: 'Monthly target', color: 'muted-fg', dashed: true }];
</script>
<template>
	<div class="w-full">
		<DomLineChart title="Revenue against target" description="April–September 2026 · GBP" :rows="rows" x-key="month" :series="series" format="currency" @select="selected = $event.row" />
		<p v-if="selected" class="mt-3 text-xs text-muted-fg">Selected reporting month: {{ selected.month }}</p>
	</div>
</template>
