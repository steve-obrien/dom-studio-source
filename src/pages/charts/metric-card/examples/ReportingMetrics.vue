<script setup>
import { DomMetricCard } from '@getdom/studio';
const revenue = [{ date: 'Apr', value: 18200 }, { date: 'May', value: 22400 }, { date: 'Jun', value: 19800 }, { date: 'Jul', value: 26800 }, { date: 'Aug', value: 24300 }, { date: 'Sep', value: 31200 }];
</script>
<template>
	<div class="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-3">
		<DomMetricCard label="Monthly revenue" :value="31200" format="currency" :change="0.284" :rows="revenue" color="chart-1" />
		<DomMetricCard label="Churn rate" :value="0.018" format="percent" :change="-0.12" trend="down-good" comparison-label="vs August" />
		<DomMetricCard label="Failed payments" :value="0" :change="-1" trend="down-good" comparison-label="vs last week" />
	</div>
</template>
