<script setup>
import { ref } from 'vue';
import { DomAreaChart, DomToggle } from '@getdom/studio';
const rows = [
	{ month: 'Apr', revenue: 18200, target: 22000, subscriptions: 12400, services: 5800 },
	{ month: 'May', revenue: 22400, target: 22000, subscriptions: 14600, services: 7800 },
	{ month: 'Jun', revenue: 19800, target: 22000, subscriptions: 13800, services: 6000 },
	{ month: 'Jul', revenue: 26800, target: 22000, subscriptions: 18400, services: 8400 },
	{ month: 'Aug', revenue: 24300, target: 22000, subscriptions: 17500, services: 6800 },
	{ month: 'Sep', revenue: 31200, target: 22000, subscriptions: 21600, services: 9600 },
];
const stacked = ref(true);
const series = [{ key: 'subscriptions', label: 'Subscriptions', color: 'chart-1' }, { key: 'services', label: 'Services', color: 'chart-2' }];
</script>
<template>
	<div class="w-full space-y-5">
		<DomToggle v-model="stacked" label="Stack revenue streams" />
		<DomAreaChart title="Where revenue comes from" description="Monthly revenue by stream · GBP" :rows="rows" x-key="month" :series="series" format="currency" :stacked="stacked" />
	</div>
</template>
