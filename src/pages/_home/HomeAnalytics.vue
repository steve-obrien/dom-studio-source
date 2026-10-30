<script setup>
import { computed, ref } from 'vue';
import { DomAreaChart, DomDonutChart, DomMetricCard, DomToggle } from '../lib/vue';

const stacked = ref(true);
const rows = [
	{ month: 'Apr', subscriptions: 12400, services: 5800 },
	{ month: 'May', subscriptions: 14600, services: 7800 },
	{ month: 'Jun', subscriptions: 13800, services: 6000 },
	{ month: 'Jul', subscriptions: 18400, services: 8400 },
	{ month: 'Aug', subscriptions: 17500, services: 6800 },
	{ month: 'Sep', subscriptions: 21600, services: 9600 },
];
const series = [{ key: 'subscriptions', label: 'Subscriptions', color: 'chart-1' }, { key: 'services', label: 'Services', color: 'chart-2' }];
const sources = [{ label: 'Organic', value: 8240, color: 'chart-1' }, { label: 'Direct', value: 3620, color: 'chart-2' }, { label: 'Referral', value: 2180, color: 'chart-4' }];
const selected = ref(null);
const revenue = computed(revenueRows);

/** @returns {Array<{ date: string, value: number }>} Monthly totals for the revenue sparkline. */
function revenueRows() {
	return rows.map(toRevenueRow);
}

/** @param {object} row Monthly revenue streams. @returns {{ date: string, value: number }} Combined revenue. */
function toRevenueRow(row) {
	return { date: row.month, value: row.subscriptions + row.services };
}

/** @param {{ row: { label: string } }} event Selected acquisition channel. @returns {void} */
function selectChannel(event) {
	selected.value = event.row.label;
}
</script>

<template>
	<div class="space-y-5">
		<div class="grid gap-3 sm:grid-cols-3">
			<DomMetricCard label="Monthly revenue" :value="31200" format="currency" :change="0.284" :rows="revenue" color="chart-1" />
			<DomMetricCard label="Active subscriptions" :value="1248" :change="0.162" />
			<DomMetricCard label="Churn rate" :value="0.018" format="percent" :change="-0.12" trend="down-good" />
		</div>
		<div class="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
			<div class="min-w-0 rounded-2xl border border-border bg-canvas p-4 sm:p-5">
				<DomAreaChart title="A little momentum. A lot of possibility." description="Sample revenue · April–September 2026 · GBP" :rows="rows" x-key="month" :series="series" :stacked="stacked" format="currency" :height="220" />
				<div class="mt-3 border-t border-border pt-3"><DomToggle v-model="stacked" label="Stack revenue streams" /></div>
			</div>
			<div class="min-w-0 rounded-2xl border border-border bg-canvas p-4 sm:p-5">
				<DomDonutChart title="Every journey starts somewhere." description="Sample acquisition channels" :rows="sources" total-label="Visitors" :height="220" @select="selectChannel" />
				<p class="mt-3 text-xs text-muted-fg" aria-live="polite">{{ selected ? `Selected: ${selected}` : 'Select a channel to explore. Try the chart legends, too.' }}</p>
			</div>
		</div>
	</div>
</template>
