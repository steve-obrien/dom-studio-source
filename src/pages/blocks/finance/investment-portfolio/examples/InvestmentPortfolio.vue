<script setup>
import { computed, ref, watch } from 'vue';
import { DomButton, DomCard, DomDonutChart, DomLineChart, DomNativeSelect, DomSparkline, DomToggleButtonGroup } from '@getdom/studio';

// Example valuations in integer pence. These portfolios have no cash flows during
// the displayed periods, so value change and simple investment return coincide.
const accounts = [
	{
		id: 'personal', label: 'Personal portfolio', cash: 150000,
		holdings: [
			{ symbol: 'GLB', name: 'Global equities', color: 'chart-1', value: 2218420, day: 2204500, week: 2234000, month: 2132000, year: 1800000 },
			{ symbol: 'TECH', name: 'US technology', color: 'chart-2', value: 1236864, day: 1225590, week: 1281032, month: 1168462, year: 940000 },
			{ symbol: 'UK', name: 'UK equities', color: 'chart-3', value: 782000, day: 783520, week: 785500, month: 760000, year: 680000 },
			{ symbol: 'BOND', name: 'Government bonds', color: 'chart-4', value: 469000, day: 464238, week: 467000, month: 472000, year: 430000 },
		],
	},
	{
		id: 'retirement', label: 'Retirement portfolio', cash: 420000,
		holdings: [
			{ symbol: 'GLB', name: 'Global equities', color: 'chart-1', value: 5650012, day: 5659432, week: 5630000, month: 5500000, year: 5080000 },
			{ symbol: 'TECH', name: 'US technology', color: 'chart-2', value: 1840206, day: 1848060, week: 1862018, month: 1795000, year: 1600000 },
			{ symbol: 'UK', name: 'UK equities', color: 'chart-3', value: 1430200, day: 1432000, week: 1440000, month: 1410000, year: 1270000 },
			{ symbol: 'BOND', name: 'Government bonds', color: 'chart-4', value: 3340000, day: 3342000, week: 3351000, month: 3319042, year: 3020000 },
		],
	},
];
const periods = [
	{ value: 'day', label: 'Day', comparison: 'today', start: '2026-09-11T08:00:00Z', points: 35, volatility: 0.0015 },
	{ value: 'week', label: 'Week', comparison: 'past week', start: '2026-09-04T16:30:00Z', points: 43, volatility: 0.012 },
	{ value: 'month', label: 'Month', comparison: 'past month', start: '2026-08-11T16:30:00Z', points: 62, volatility: 0.025 },
	{ value: 'year', label: 'Year', comparison: 'past year', start: '2025-09-11T16:30:00Z', points: 91, volatility: 0.045 },
];
const asOf = '2026-09-11T16:30:00Z';
const accountId = ref('personal');
const period = ref('day');
const exportStatus = ref('');
const accountOptions = accounts.map(account => ({ value: account.id, label: account.label }));
const account = computed(getAccount);
const activePeriod = computed(getActivePeriod);
const totalValue = computed(getTotalValue);
const performance = computed(getPerformance);
const currentPerformance = computed(getCurrentPerformance);
const holdingRows = computed(getHoldingRows);
const allocation = computed(getAllocation);
const history = computed(getHistory);
const chartSeries = computed(getChartSeries);
const dateRange = computed(getDateRange);
watch([accountId, period], clearExportStatus);

/** @returns {object} The selected application-owned portfolio. */
function getAccount() { return accounts.find(item => item.id === accountId.value) || accounts[0]; }
/** @returns {object} The selected reporting window. */
function getActivePeriod() { return periods.find(item => item.value === period.value) || periods[0]; }
/** @returns {number} Current holdings plus cash, in integer pence. */
function getTotalValue() { return account.value.holdings.reduce((sum, item) => sum + item.value, account.value.cash); }

/** @returns {Array<object>} Each period's opening balance and signed value change. */
function getPerformance() {
	return periods.map(item => {
		const opening = account.value.holdings.reduce((sum, holding) => sum + holding[item.value], account.value.cash);
		const change = totalValue.value - opening;
		return { ...item, opening, change, fraction: opening > 0 ? change / opening : null };
	});
}
/** @returns {object} Performance matching the plotted period. */
function getCurrentPerformance() { return performance.value.find(item => item.value === period.value) || performance.value[0]; }

/** @returns {Array<object>} Holdings with returns and sample trends for the selected period. */
function getHoldingRows() {
	return account.value.holdings.map((item, index) => ({
		...item,
		change: item.value - item[period.value],
		fraction: item[period.value] > 0 ? (item.value - item[period.value]) / item[period.value] : null,
		weight: item.value / totalValue.value,
		history: makeHistory(item[period.value], item.value, activePeriod.value, index + 1),
	}));
}
/** @returns {Array<object>} Current asset allocation including uninvested cash. */
function getAllocation() {
	return [...account.value.holdings.map(item => ({ label: item.name, value: item.value / 100, weight: item.value / totalValue.value, color: item.color })), { label: 'Cash', value: account.value.cash / 100, weight: account.value.cash / totalValue.value, color: 'muted-fg' }];
}
/** @returns {Array<object>} Portfolio snapshots reconciled to every holding plus cash. */
function getHistory() {
	return holdingRows.value[0].history.map((point, index) => ({
		date: point.date,
		value: holdingRows.value.reduce((sum, holding) => sum + Math.round(holding.history[index].value * 100), account.value.cash) / 100,
	}));
}
/** @returns {Array<object>} Stable series identity with an explicit gain/loss colour. */
function getChartSeries() { return [{ key: 'value', label: 'Portfolio value', color: tone(currentPerformance.value.change) }]; }
/** @returns {string} The exact time window shown by the chart. */
function getDateRange() { return `${formatDate(activePeriod.value.start)} – ${formatDate(asOf)} · UTC`; }

/**
 * Creates deterministic sample data anchored to the same opening and closing
 * valuations used by the summary. Replace this with recorded account snapshots.
 * @param {number} opening Opening balance in pence.
 * @param {number} closing Closing balance in pence.
 * @param {object} window Reporting window, point count, and example volatility.
 * @param {number} [phase] Distinguishes illustrative holding price paths.
 * @returns {Array<{date: string, value: number}>} Timestamped values in pounds.
 */
function makeHistory(opening, closing, window, phase = 0) {
	const start = Date.parse(window.start);
	const end = Date.parse(asOf);
	return Array.from({ length: window.points }, (_, index) => {
		const progress = index / (window.points - 1);
		const wave = Math.sin(index * 1.7 + phase) * 0.45 + Math.sin(index * 0.6 + phase) * 0.55;
		const variation = Math.min(opening, closing) * window.volatility * wave * 4 * progress * (1 - progress);
		const value = Math.max(0, Math.round(opening + (closing - opening) * progress + variation));
		return { date: new Date(start + (end - start) * progress).toISOString(), value: value / 100 };
	});
}

/** @param {number} minor Amount in pence. @returns {string} GBP with penny precision. */
function money(minor) { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(minor / 100); }
/** @param {number} pounds Chart value in pounds. @returns {string} Formatted GBP value. */
function chartMoney(pounds) { return money(Math.round(pounds * 100)); }
/** @param {number} pounds Axis value. @returns {string} Compact ticks that fit a narrow portfolio chart. */
function axisMoney(pounds) { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', notation: 'compact', maximumFractionDigits: 2 }).format(pounds); }
/** @param {number} minor Signed movement in pence. @returns {string} Explicit gain or loss. */
function signedMoney(minor) { return `${minor > 0 ? '+' : minor < 0 ? '−' : ''}${money(Math.abs(minor))}`; }
/** @param {number|null} fraction Relative movement. @returns {string} Signed percentage or unavailable marker. */
function percent(fraction) { return fraction === null ? '—' : new Intl.NumberFormat('en-GB', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' }).format(fraction); }
/** @param {number} change Signed amount. @returns {string} Theme token for positive, negative, or flat performance. */
function tone(change) { return change > 0 ? 'success' : change < 0 ? 'destructive' : 'muted-fg'; }
/** @param {string|number} date Timestamp. @returns {string} Period-appropriate UTC chart label. */
function formatDate(date) {
	const options = period.value === 'day' ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', ...(period.value === 'year' ? { year: '2-digit' } : {}) };
	return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(new Date(date));
}
/** @returns {void} Clears download feedback when the account or period changes. */
function clearExportStatus() { exportStatus.value = ''; }
/** @returns {void} Downloads the currently visible portfolio history as a local CSV file. */
function exportHistory() {
	const csv = ['Timestamp (UTC),Portfolio value (GBP)', ...history.value.map(row => `${row.date},${row.value.toFixed(2)}`)].join('\n');
	const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
	const link = document.createElement('a');
	link.href = url;
	link.download = `${account.value.id}-portfolio-${period.value}.csv`;
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
	exportStatus.value = `${activePeriod.value.label} history downloaded.`;
}
</script>

<template>
	<div class="@container w-full min-w-0 space-y-6 text-canvas-fg">
		<header class="flex flex-wrap items-center justify-between gap-5">
			<div class="flex items-center gap-3">
				<span class="grid size-11 place-items-center rounded-2xl bg-primary text-primary-fg" aria-hidden="true"><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 18V6M5 18h14M8 14l4-4 3 2 4-7" /></svg></span>
				<div><h2 class="text-lg font-semibold tracking-tight">My investments</h2><p class="mt-0.5 text-xs text-muted-fg">Sample portfolios · GBP</p></div>
			</div>
			<DomNativeSelect v-model="accountId" label="Portfolio" :options="accountOptions" :register-field="false" class="w-full @lg:w-56" />
		</header>

		<div class="grid items-start gap-5 @3xl:grid-cols-[minmax(0,1fr)_16rem]">
			<DomCard padding="none" class="min-w-0 overflow-hidden">
				<div class="space-y-5 p-5 @lg:p-6">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div aria-live="polite" aria-atomic="true">
							<p class="text-sm text-muted-fg">Total portfolio value</p>
							<p class="mt-2 text-3xl font-semibold tracking-tight tabular-nums @lg:text-5xl" data-portfolio-total>{{ money(totalValue) }}</p>
							<p class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium tabular-nums" data-portfolio-change :style="{ color: `var(--${tone(currentPerformance.change)})` }">
								<span aria-hidden="true">{{ currentPerformance.change > 0 ? '↗' : currentPerformance.change < 0 ? '↘' : '→' }}</span>
								<span>{{ signedMoney(currentPerformance.change) }} ({{ percent(currentPerformance.fraction) }})</span>
								<span class="font-normal text-muted-fg">{{ activePeriod.comparison }}</span>
							</p>
						</div>
						<span class="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-fg">11 Sep 2026 · 16:30 UTC</span>
					</div>
					<DomToggleButtonGroup v-model="period" label="Performance period" :options="periods" :register-field="false" size="sm" variant="switch" />
					<DomLineChart :key="`${accountId}-${period}`" title="Portfolio value" :description="dateRange" :rows="history" x-key="date" x-type="time" :series="chartSeries" :height="240" :legend="false" :show-table="false" :value-formatter="chartMoney" :x-formatter="formatDate" :y-formatter="axisMoney" />
				</div>
				<dl class="grid gap-4 border-t border-border bg-secondary/20 p-5 @xs:grid-cols-2 @lg:p-6">
					<div><dt class="text-xs text-muted-fg">Investments</dt><dd class="mt-1.5 text-lg font-semibold tabular-nums">{{ money(totalValue - account.cash) }}</dd></div>
					<div><dt class="text-xs text-muted-fg">Available cash</dt><dd class="mt-1.5 text-lg font-semibold tabular-nums">{{ money(account.cash) }}</dd></div>
				</dl>
			</DomCard>

			<DomCard padding="sm" class="min-w-0">
				<DomDonutChart title="Asset allocation" description="Current portfolio, including cash" :rows="allocation" :height="172" :arc-width="18" :legend="false" :show-table="false" :value-formatter="chartMoney">
					<template #center><div><span class="block text-3xl font-semibold tabular-nums">{{ account.holdings.length }}</span><span class="mt-1 block text-xs text-muted-fg">investments</span></div></template>
				</DomDonutChart>
				<ul class="mt-5 space-y-3" aria-label="Allocation breakdown">
					<li v-for="item in allocation" :key="item.label" class="flex items-center gap-2 text-xs"><span class="size-2 shrink-0 rounded-full" :style="{ backgroundColor: `var(--${item.color})` }" aria-hidden="true" /><span class="min-w-0 flex-1 text-muted-fg">{{ item.label }}</span><span class="font-medium tabular-nums">{{ (item.weight * 100).toFixed(1) }}%</span></li>
				</ul>
			</DomCard>
		</div>

		<section aria-label="Performance by period" class="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
			<button v-for="item in performance" :key="item.value" type="button" class="min-w-0 rounded-xl border p-4 text-left transition hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" :class="period === item.value ? 'border-primary/35 bg-secondary/40' : 'border-border'" :aria-pressed="period === item.value" :aria-label="`Show ${item.label.toLowerCase()} performance`" @click="period = item.value">
				<span class="text-xs text-muted-fg">{{ item.label }}</span>
				<span class="mt-2 block text-xl font-semibold tabular-nums" :style="{ color: `var(--${tone(item.change)})` }">{{ percent(item.fraction) }}</span>
				<span class="mt-1 block text-xs tabular-nums text-muted-fg">{{ signedMoney(item.change) }}</span>
			</button>
		</section>

		<DomCard padding="none" class="min-w-0 overflow-hidden">
			<div class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h3 class="font-semibold">Holdings</h3><p class="mt-1 text-xs text-muted-fg">{{ activePeriod.label }} change · {{ account.holdings.length }} investments</p></div><span class="text-xs text-muted-fg">{{ money(totalValue - account.cash) }} invested</span></div>
			<table class="w-full text-left text-sm tabular-nums">
				<caption class="sr-only">{{ account.label }} holdings and {{ activePeriod.label.toLowerCase() }} value change. Cash is shown separately.</caption>
				<thead class="border-b border-border text-[11px] font-normal text-muted-fg"><tr><th scope="col" class="px-2 py-3 font-normal @xs:px-3 @lg:px-5">Investment</th><th scope="col" class="px-2 py-3 text-right font-normal">Value</th><th scope="col" class="px-2 py-3 text-right font-normal @xs:px-3 @lg:px-5">{{ activePeriod.label }} change</th><th scope="col" class="hidden px-5 py-3 text-right font-normal @3xl:table-cell">Trend</th></tr></thead>
				<tbody class="divide-y divide-border">
					<tr v-for="holding in holdingRows" :key="holding.symbol">
						<th scope="row" class="px-2 py-4 font-normal @xs:px-3 @lg:px-5"><div class="flex items-center gap-3"><span class="hidden size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-[10px] font-semibold @xl:inline-flex">{{ holding.symbol }}</span><div class="min-w-0"><p class="text-xs font-medium @lg:text-sm">{{ holding.name }}</p><p class="mt-1 text-[11px] text-muted-fg">{{ (holding.weight * 100).toFixed(1) }}% of portfolio</p></div></div></th>
						<td class="whitespace-nowrap px-2 py-4 text-right text-xs font-medium @lg:text-sm">{{ money(holding.value) }}</td>
						<td class="px-2 py-4 text-right text-xs @xs:px-3 @lg:px-5" :style="{ color: `var(--${tone(holding.change)})` }"><span class="block whitespace-nowrap font-medium">{{ signedMoney(holding.change) }}</span><span class="mt-1 block">{{ percent(holding.fraction) }}</span></td>
						<td class="hidden w-32 px-5 py-3 @3xl:table-cell"><DomSparkline :title="`${holding.name} ${activePeriod.label.toLowerCase()} trend`" :rows="holding.history" x-key="date" x-type="time" :height="40" :series="[{ key: 'value', color: tone(holding.change) }]" :value-formatter="chartMoney" /></td>
					</tr>
				</tbody>
			</table>
		</DomCard>

		<footer class="flex flex-wrap items-center justify-between gap-3">
			<p class="text-xs leading-5 text-muted-fg">Example data · All values in GBP · Value change over the selected period</p>
			<div class="flex items-center gap-3"><span role="status" class="text-xs text-muted-fg">{{ exportStatus }}</span><DomButton size="sm" variant="secondary" @click="exportHistory">Export data</DomButton></div>
		</footer>
	</div>
</template>
