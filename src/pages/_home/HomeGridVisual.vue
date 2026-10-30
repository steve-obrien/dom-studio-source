<script setup>
import { reactive } from 'vue';

const columns = ['Side', 'Qty', 'Price', 'P&L', 'Status'];
const groups = reactive([
	{
		desk: 'Rates desk',
		open: true,
		total: '+12,480',
		rows: [
			{ symbol: 'UKT 4¼ 32', side: 'Buy', qty: '2,500,000', price: '98.412', pnl: '+8,240', status: 'Filled' },
			{ symbol: 'DBR 2½ 34', side: 'Sell', qty: '1,200,000', price: '101.06', pnl: '+5,910', status: 'Filled', editing: true },
			{ symbol: 'T 4⅛ 33', side: 'Buy', qty: '900,000', price: '99.875', pnl: '−1,670', status: 'Working' },
		],
	},
	{
		desk: 'FX desk',
		open: true,
		total: '−2,315',
		rows: [
			{ symbol: 'EUR/GBP', side: 'Sell', qty: '4,000,000', price: '0.8571', pnl: '+1,105', status: 'Filled' },
			{ symbol: 'GBP/JPY', side: 'Buy', qty: '1,500,000', price: '191.42', pnl: '−3,420', status: 'Partial' },
		],
	},
]);

/** @param {object} group Desk group to collapse or expand. @returns {void} */
function toggle(group) {
	group.open = !group.open;
}

/** @param {string} value Signed P&L text. @returns {string} Tone class. */
function tone(value) {
	return value.startsWith('+') ? 'text-success' : 'text-destructive';
}

/** @param {number} groupIndex Group position. @param {number} rowIndex Row position. @param {number} column Column position. @returns {boolean} Whether a cell is inside the sample copy range. */
function inRange(groupIndex, rowIndex, column) {
	return groupIndex === 0 && rowIndex <= 1 && column >= 1 && column <= 3;
}
</script>

<template>
	<div class="overflow-hidden rounded-2xl border border-border bg-canvas shadow-xl shadow-canvas-fg/5">
		<div class="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 text-xs">
			<span class="rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 text-muted-fg">⌕ Search trades</span>
			<span class="rounded-md border border-border px-2.5 py-1.5">Group by <strong class="font-semibold">Desk</strong></span>
			<span class="rounded-md border border-border px-2.5 py-1.5">Status <strong class="font-semibold">is any</strong></span>
			<span class="ml-auto rounded-md bg-primary px-2.5 py-1.5 font-medium text-primary-fg">Export .xlsx</span>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full min-w-[640px] border-collapse text-left text-[0.8rem] tabular-nums">
				<thead class="bg-secondary/40 text-xs text-muted-fg">
					<tr>
						<th class="sticky left-0 z-10 border-r border-border bg-secondary px-4 py-2.5 font-medium shadow-[4px_0_8px_-6px_rgb(0_0_0/0.25)]">Instrument <span aria-hidden="true">📌</span></th>
						<th v-for="column in columns" :key="column" class="px-4 py-2.5 font-medium" :class="column !== 'Side' && column !== 'Status' && 'text-right'">{{ column }}<span v-if="column === 'P&L'" aria-hidden="true"> ↓</span></th>
					</tr>
				</thead>
				<tbody>
					<template v-for="(group, groupIndex) in groups" :key="group.desk">
						<tr class="cursor-pointer border-t border-border bg-secondary/20 font-medium hover:bg-secondary/40" @click="toggle(group)">
							<td class="sticky left-0 z-10 border-r border-border bg-secondary px-4 py-2">
								<span class="inline-block w-3 text-muted-fg" aria-hidden="true">{{ group.open ? '▾' : '▸' }}</span> {{ group.desk }} <span class="font-normal text-muted-fg">· {{ group.rows.length }}</span>
							</td>
							<td colspan="3"></td>
							<td class="px-4 py-2 text-right" :class="tone(group.total)">{{ group.total }}</td>
							<td class="px-4 py-2 text-xs font-normal text-muted-fg">sum</td>
						</tr>
						<template v-if="group.open">
							<tr v-for="(row, rowIndex) in group.rows" :key="row.symbol" class="border-t border-border">
								<td class="sticky left-0 z-10 border-r border-border bg-canvas px-4 py-2 pl-8 font-medium">{{ row.symbol }}</td>
								<td class="px-4 py-2" :class="inRange(groupIndex, rowIndex, 0) && 'bg-ring/10'">{{ row.side }}</td>
								<td class="px-4 py-2 text-right" :class="inRange(groupIndex, rowIndex, 1) && 'bg-ring/10'">{{ row.qty }}</td>
								<td class="px-4 py-2 text-right" :class="inRange(groupIndex, rowIndex, 2) && 'bg-ring/10'">
									<span v-if="row.editing" class="inline-block rounded border-2 border-ring bg-canvas px-1.5 py-0.5">101.06<span class="animate-pulse" aria-hidden="true">|</span></span>
									<template v-else>{{ row.price }}</template>
								</td>
								<td class="px-4 py-2 text-right" :class="[tone(row.pnl), inRange(groupIndex, rowIndex, 3) && 'bg-ring/10']">{{ row.pnl }}</td>
								<td class="px-4 py-2"><span class="rounded-full px-2 py-0.5 text-xs" :class="row.status === 'Filled' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'">{{ row.status }}</span></td>
							</tr>
						</template>
					</template>
				</tbody>
				<tfoot>
					<tr class="border-t-2 border-border bg-secondary/40 font-semibold">
						<td class="sticky left-0 z-10 border-r border-border bg-secondary px-4 py-2.5">Total</td>
						<td colspan="3" class="px-4 py-2.5 text-right text-xs font-normal text-muted-fg">5 trades</td>
						<td class="px-4 py-2.5 text-right text-success">+10,165</td>
						<td></td>
					</tr>
				</tfoot>
			</table>
		</div>
		<div class="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-fg">
			<span><span class="inline-block size-2 rounded-sm bg-ring/40 align-middle"></span> 6 cells selected · ⌘C to copy into Excel</span>
			<span>Pinned columns · grouping · inline editing · virtual rows</span>
		</div>
	</div>
</template>
