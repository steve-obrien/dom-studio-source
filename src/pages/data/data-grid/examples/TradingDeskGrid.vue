<script setup>
import { ref } from 'vue';
import { DomDataGrid } from '../../../lib/vue';

defineProps({
	/** Shares the surrounding card's frame and keeps the edit history inside its footer. */
	embedded: { type: Boolean, default: false },
});

const rows = ref(createPositions(2500));
const groupBy = ref('desk');
const pinnedColumns = ref({ ticker: 'left', pnl: 'right' });
const changes = ref([]);

const columns = [
	{ key: 'ticker', label: 'Ticker', width: '8rem', editable: false },
	{ key: 'instrument', label: 'Instrument', width: '13rem', editable: false },
	{
		key: 'desk',
		label: 'Desk',
		type: 'select',
		width: '8.5rem',
		options: ['Equities', 'Rates', 'Credit', 'FX', 'Commodities'],
	},
	{
		key: 'region',
		label: 'Region',
		type: 'select',
		width: '7.5rem',
		options: ['EMEA', 'Americas', 'APAC'],
	},
	{
		key: 'quantity',
		label: 'Quantity',
		type: 'number',
		width: '7.5rem',
		aggregate: 'sum',
		validate: (value) => value === null || (Number.isInteger(value) && value >= 0) || 'Quantity must be a whole number of 0 or more',
	},
	{
		key: 'price',
		label: 'Price',
		type: 'currency',
		currency: 'USD',
		locale: 'en-US',
		width: '7.5rem',
		aggregate: 'avg',
		validate: (value) => value === null || value > 0 || 'Price must be above zero',
	},
	{
		key: 'marketValue',
		label: 'Market value',
		type: 'currency',
		currency: 'USD',
		locale: 'en-US',
		width: '9rem',
		aggregate: 'sum',
		accessor: (row) => Math.round((row.quantity || 0) * (row.price || 0)),
	},
	{
		key: 'change',
		label: 'Day %',
		type: 'number',
		width: '7.5rem',
		aggregate: 'avg',
		format: (value) => formatPercent(value),
		formatAggregate: (value) => formatPercent(value),
	},
	{
		key: 'status',
		label: 'Status',
		type: 'select',
		width: '8rem',
		options: [
			{ label: 'Open', value: 'open', tone: 'green' },
			{ label: 'Hedged', value: 'hedged', tone: 'blue' },
			{ label: 'Review', value: 'review', tone: 'amber' },
			{ label: 'Breach', value: 'breach', tone: 'red' },
		],
	},
	{ key: 'trader', label: 'Trader', width: '9rem' },
	{ key: 'tradeDate', label: 'Trade date', type: 'date', width: '8.5rem', aggregate: 'max' },
	{ key: 'settled', label: 'Settled', type: 'boolean', width: '6.5rem', aggregate: 'count' },
	{
		key: 'pnl',
		label: 'P&L',
		type: 'currency',
		currency: 'USD',
		locale: 'en-US',
		width: '8.5rem',
		aggregate: 'sum',
		accessor: (row) => Math.round((row.quantity || 0) * (row.price || 0) * (row.change || 0) / 100),
	},
];

/**
 * Applies one cell change. The grid emits changes; the data stays yours.
 *
 * @param {{ row: object, column: object, value: unknown, previousValue: unknown, source: string }} change Cell change.
 * @returns {void}
 */
function applyChange({ row, column, value }) {
	row[column.field || column.key] = value;
}

/**
 * Keeps the four latest edit summaries visible below the grid.
 *
 * @param {{ source: string, changes: Array<object> }} payload Completed batch of cell changes.
 * @returns {void}
 */
function logChanges({ source, changes: batch }) {
	const [first] = batch;
	const summary = batch.length === 1
		? `${first.row.ticker} ${first.column.label}: ${first.previousValue ?? 'empty'} → ${first.value ?? 'empty'}`
		: `${batch.length} cells`;
	changes.value = [{ id: `${Date.now()}-${Math.random()}`, source, summary }, ...changes.value].slice(0, 4);
}

/**
 * Formats a percentage with two decimals and a positive sign when applicable.
 *
 * @param {unknown} value Percentage value to display.
 * @returns {string} Formatted percentage, or an empty string for a non-finite value.
 */
function formatPercent(value) {
	const number = Number(value);
	if (!Number.isFinite(number)) return '';
	return `${number > 0 ? '+' : ''}${number.toFixed(2)}%`;
}

/**
 * Creates repeatable sample positions for trading, grouping and editing demos.
 *
 * @param {number} count Number of positions to generate.
 * @returns {Array<object>} Application-owned trading positions.
 */
function createPositions(count) {
	const desks = ['Equities', 'Rates', 'Credit', 'FX', 'Commodities'];
	const regions = ['EMEA', 'Americas', 'APAC'];
	const statuses = ['open', 'open', 'open', 'hedged', 'review', 'breach'];
	const traders = ['A. Hart', 'R. Patel', 'M. Okafor', 'T. Grant', 'L. Chen', 'S. Rivera', 'N. Ellis', 'P. Singh'];
	const names = {
		Equities: ['Northstar Analytics', 'Orchid Health', 'Forge Robotics', 'Signal Harbor', 'Mercury Media'],
		Rates: ['UST 10Y', 'Gilt 2034', 'Bund 2033', 'JGB 10Y', 'OAT 2035'],
		Credit: ['Atlas Finance 5.25%', 'Verde Energy 4.1%', 'Copper Bank FRN', 'Juniper 6.0% HY', 'Sable 3.8% IG'],
		FX: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF'],
		Commodities: ['Brent Dec', 'Gold spot', 'Copper 3M', 'Nat gas Jan', 'Wheat Mar'],
	};
	let seed = 42;
	/** Advances the seeded random sequence. @returns {number} Value from zero up to one. */
	const random = () => {
		seed = (seed * 16807) % 2147483647;
		return (seed - 1) / 2147483646;
	};

	return Array.from({ length: count }, (_, index) => {
		const desk = desks[index % desks.length];
		const instrument = names[desk][Math.floor(random() * 5)];
		const day = String(1 + Math.floor(random() * 28)).padStart(2, '0');
		const month = String(7 + Math.floor(random() * 3)).padStart(2, '0');
		return {
			id: `pos-${10000 + index}`,
			ticker: `${desk.slice(0, 2).toUpperCase()}${String(1000 + index).slice(-4)}`,
			instrument,
			desk,
			region: regions[Math.floor(random() * regions.length)],
			quantity: Math.round(50 + random() * 9950),
			price: Math.round((5 + random() * 495) * 100) / 100,
			change: Math.round((random() * 8 - 4) * 100) / 100,
			status: statuses[Math.floor(random() * statuses.length)],
			trader: traders[Math.floor(random() * traders.length)],
			tradeDate: `2026-${month}-${day}`,
			settled: random() > 0.3,
		};
	});
}
</script>

<template>
	<div class="grid min-w-0" :class="!embedded && 'gap-3'">
		<DomDataGrid
			:layout="embedded ? 'flush' : 'card'"
			gutter-class="px-4"
			:class="embedded && 'border-t-0!'"
			v-model:group-by="groupBy"
			v-model:pinned-columns="pinnedColumns"
			:rows="rows"
			:columns="columns"
			title="Trading desk positions"
			resource-label="positions"
			height="36rem"
			virtual-rows
			editable
			cell-selection
			column-menu
			exportable
			show-totals
			multi-sort
			@cell-update="applyChange"
			@cells-update="logChanges"
		/>

		<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-fg" :class="embedded && 'px-4 py-3'">
			<span class="font-semibold text-canvas-fg">Recent edits</span>
			<span v-if="!changes.length">Double-click a cell, type over it, or paste a block from a spreadsheet.</span>
			<span v-for="change in changes" :key="change.id" class="tabular-nums">
				<span class="font-medium text-canvas-fg">{{ change.source }}</span> {{ change.summary }}
			</span>
		</div>
	</div>
</template>
