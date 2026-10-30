<script setup>
import { ref } from 'vue';
import { DomBarChart, DomNativeSelect, DomToggle } from '@getdom/studio';
const layout = ref('grouped');
const horizontal = ref(false);
const rows = [{ plan: 'Starter', new: 4800, returning: 2200 }, { plan: 'Growth', new: 7400, returning: 9800 }, { plan: 'Scale', new: 6200, returning: 15400 }, { plan: 'Enterprise', new: 12500, returning: 18200 }];
const series = [{ key: 'new', label: 'New accounts', color: 'chart-1' }, { key: 'returning', label: 'Returning accounts', color: 'chart-2' }];
</script>
<template>
	<div class="w-full space-y-5">
		<div class="flex flex-wrap items-end gap-5"><DomNativeSelect v-model="layout" label="Bar layout" :options="[{ value: 'grouped', label: 'Grouped' }, { value: 'stacked', label: 'Stacked' }, { value: 'percentage', label: 'Percentage' }]" /><DomToggle v-model="horizontal" label="Horizontal bars" /></div>
		<DomBarChart title="Revenue by plan" description="New and returning accounts · September 2026" :rows="rows" x-key="plan" :series="series" :horizontal="horizontal" :stacked="layout === 'stacked'" :percentage="layout === 'percentage'" format="currency" />
	</div>
</template>
