<script setup>
import { computed, ref } from 'vue';
import { DomAreaChart, DomBarChart, DomCard, DomDateRangePicker, DomDonutChart, DomMetricCard } from '@getdom/studio';

const period = ref({ start: '2026-09-01', end: '2026-09-30' });
const comparison = ref('none');
// Deterministic sample data keeps the example identical during SSR and hydration.
const dailyRows = Array.from({ length: 30 }, (_, index) => ({
	date: `2026-09-${String(index + 1).padStart(2, '0')}`,
	organic: Math.round(210 + index * 7 + Math.sin(index * 0.7) * 65),
	direct: Math.round(110 + index * 3 + Math.cos(index * 0.9) * 32),
}));
const sources = [{ label: 'Organic search', value: 8240, color: 'chart-1' }, { label: 'Direct', value: 3620, color: 'chart-2' }, { label: 'Referral', value: 2180, color: 'chart-3' }, { label: 'Email', value: 1460, color: 'chart-4' }];
const plans = [{ plan: 'Starter', new: 4800, recurring: 2200 }, { plan: 'Growth', new: 7400, recurring: 9800 }, { plan: 'Scale', new: 6200, recurring: 15400 }];
const trafficSeries = [{ key: 'organic', label: 'Organic search', color: 'chart-1' }, { key: 'direct', label: 'Direct', color: 'chart-2' }];
const revenueSeries = [{ key: 'new', label: 'New accounts', color: 'chart-1' }, { key: 'recurring', label: 'Recurring', color: 'chart-2' }];
const selectedRows = computed(getSelectedRows);
const visitorRows = computed(() => selectedRows.value.map((row) => ({ date: row.date, value: row.organic + row.direct })));
const visitors = computed(() => selectedRows.value.reduce((total, row) => total + row.organic + row.direct, 0));
const organic = computed(() => selectedRows.value.reduce((total, row) => total + row.organic, 0));
const description = computed(() => `${period.value.start} to ${period.value.end} · Daily visitors`);

/** @returns {Array<object>} Filters application records using inclusive reporting dates. */
function getSelectedRows() { return dailyRows.filter((row) => row.date >= period.value.start && row.date <= period.value.end); }
</script>

<template>
	<div class="w-full space-y-5">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div><p class="text-sm font-semibold">Traffic overview</p><p class="mt-1 text-xs text-muted-fg">Example workspace · September 2026</p></div>
			<DomDateRangePicker v-model="period" v-model:comparison="comparison" :show-comparison="false" anchor-date="2026-09-30" min="2026-09-01" max="2026-09-30" />
		</div>
		<div class="grid gap-4 sm:grid-cols-3">
			<DomMetricCard label="Visitors" :value="visitors" :rows="visitorRows" color="chart-1" />
			<DomMetricCard label="Organic share" :value="visitors ? organic / visitors : null" format="percent" />
			<DomMetricCard label="Days in view" :value="selectedRows.length" />
		</div>
		<DomCard padding="sm"><DomAreaChart title="Audience growth" :description="description" :rows="selectedRows" x-key="date" x-type="time" :series="trafficSeries" stacked /></DomCard>
		<div class="grid gap-4 xl:grid-cols-2">
			<DomCard padding="sm"><DomBarChart title="Revenue by plan" description="Full September · GBP" :rows="plans" x-key="plan" :series="revenueSeries" format="currency" :height="240" /></DomCard>
			<DomCard padding="sm"><DomDonutChart title="Acquisition channels" description="Full September · All channels" :rows="sources" :height="240" total-label="Visitors" /></DomCard>
		</div>
	</div>
</template>
