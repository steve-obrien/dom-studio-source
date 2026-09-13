<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { DomBarChart, DomButton, DomCard, DomLineChart, DomToggleButtonGroup } from '@getdom/studio';

// Fictional GBP bank activity. Store and calculate money in integer pence;
// convert to pounds only at the chart and display boundary.
const openingBalance = 4200000;
const cashBuffer = 2000000;
const monthlyActivity = [
	{ month: '2026-03', received: 2850000, paid: 2510000 },
	{ month: '2026-04', received: 3120000, paid: 2680000 },
	{ month: '2026-05', received: 2680000, paid: 2890000 },
	{ month: '2026-06', received: 3460000, paid: 2930000 },
	{ month: '2026-07', received: 3280000, paid: 3060000 },
	{ month: '2026-08', received: 3650000, paid: 3190000 },
];
const plannedActivity = [
	{ month: '2026-09', received: 3800000, paid: 3350000 },
	{ month: '2026-10', received: 3400000, paid: 3500000 },
	{ month: '2026-11', received: 4250000, paid: 3475000 },
	{ month: '2026-12', received: 3900000, paid: 3750000 },
	{ month: '2027-01', received: 3600000, paid: 3550000 },
	{ month: '2027-02', received: 4400000, paid: 3650000 },
];
const sampleEvents = [
	{ id: 'bank-001', label: 'Northstar · invoice paid', amount: 240000 },
	{ id: 'bank-002', label: 'Cloud hosting', amount: -18640 },
	{ id: 'bank-003', label: 'Harbour · project deposit', amount: 375000 },
	{ id: 'bank-004', label: 'Contractor payment', amount: -125000 },
	{ id: 'bank-005', label: 'Card settlement', amount: 86450 },
	{ id: 'bank-006', label: 'Equipment purchase', amount: -68000 },
	{ id: 'bank-007', label: 'Fieldwork · invoice paid', amount: 180000 },
	{ id: 'bank-008', label: 'Travel reimbursement', amount: -14250 },
];
const initialTransactions = monthlyActivity.flatMap(makeTransactions);
const transactions = ref([...initialTransactions]);
const horizon = ref('3');
const receiptAdjustment = ref(0);
const costAdjustment = ref(0);
const running = ref(false);
const eventIndex = ref(0);
const status = ref('Ready to replay 8 sample bank transactions.');
let timer = null;

const actuals = computed(getActuals);
const currentMonth = computed(getCurrentMonth);
const forecast = computed(getForecast);
const projectedMonth = computed(getProjectedMonth);
const balanceRows = computed(getBalanceRows);
const movementRows = computed(getMovementRows);
const reportRows = computed(getReportRows);
const latestTransactions = computed(getLatestTransactions);
const outlook = computed(getOutlook);
const balanceSeries = [
	{ key: 'actual', label: 'Recorded balance', color: 'chart-1' },
	{ key: 'forecast', label: 'Forecast (dashed)', color: 'chart-2', dashed: true },
	{ key: 'buffer', label: 'Cash buffer', color: 'warning', dashed: true },
];
const movementSeries = [
	{ key: 'received', label: 'Money in', color: 'success' },
	{ key: 'paid', label: 'Money out', color: 'destructive' },
];
onBeforeUnmount(stopSimulation);

/**
 * Expands each fixture month into a small, reconcilable bank ledger.
 * @param {object} month Monthly received and paid amounts in pence.
 * @returns {Array<object>} Signed transactions with stable identities and dates.
 */
function makeTransactions(month) {
	return [
		{ id: `${month.month}-retainers`, date: `${month.month}-05`, label: 'Client retainers', amount: 1800000 },
		{ id: `${month.month}-projects`, date: `${month.month}-15`, label: 'Project invoices', amount: month.received - 1800000 },
		{ id: `${month.month}-payroll`, date: `${month.month}-25`, label: 'Payroll', amount: -1900000 },
		{ id: `${month.month}-software`, date: `${month.month}-27`, label: 'Software & subscriptions', amount: -160000 },
		{ id: `${month.month}-operations`, date: `${month.month}-28`, label: 'Rent & operations', amount: -(month.paid - 2060000) },
	];
}

/** @returns {Array<object>} Monthly bank totals and rolling balances, derived from the same ledger. */
function getActuals() {
	let balance = openingBalance;
	return monthlyActivity.map(month => {
		const entries = transactions.value.filter(item => item.date.startsWith(month.month));
		const received = entries.reduce((sum, item) => sum + Math.max(0, item.amount), 0);
		const paid = entries.reduce((sum, item) => sum + Math.max(0, -item.amount), 0);
		const opening = balance;
		balance += received - paid;
		return { month: month.month, received, paid, net: received - paid, opening, closing: balance, type: 'Recorded' };
	});
}
/** @returns {object} August activity and the latest recorded bank balance. */
function getCurrentMonth() { return actuals.value.at(-1); }

/**
 * Applies scenario changes to planned cash receipts and payments, never actuals.
 * Each month opens at the previous close; the first opens at the bank balance.
 * @returns {Array<object>} Monthly projections, including negative balances.
 */
function getForecast() {
	let balance = currentMonth.value.closing;
	return plannedActivity.slice(0, Number(horizon.value)).map(month => {
		const received = Math.round(month.received * (1 + receiptAdjustment.value / 100));
		const paid = Math.round(month.paid * (1 + costAdjustment.value / 100));
		const opening = balance;
		balance += received - paid;
		return { month: month.month, received, paid, net: received - paid, opening, closing: balance, type: 'Forecast' };
	});
}
/** @returns {object} Closing forecast for the selected horizon. */
function getProjectedMonth() { return forecast.value.at(-1); }

/** @returns {Array<object>} Separate actual and forecast lines meeting at the last recorded balance. */
function getBalanceRows() {
	return [
		{ month: '2026-02', actual: openingBalance / 100, forecast: null, buffer: cashBuffer / 100 },
		...actuals.value.map((row, index) => ({ month: row.month, actual: row.closing / 100, forecast: index === actuals.value.length - 1 ? row.closing / 100 : null, buffer: cashBuffer / 100 })),
		...forecast.value.map(row => ({ month: row.month, actual: null, forecast: row.closing / 100, buffer: cashBuffer / 100 })),
	];
}
/** @returns {Array<object>} Recorded incoming and outgoing cash as positive comparison bars. */
function getMovementRows() { return actuals.value.map(row => ({ month: row.month, received: row.received / 100, paid: row.paid / 100 })); }
/** @returns {Array<object>} Complete reconciliation table, with recorded and projected periods labelled. */
function getReportRows() { return [...actuals.value, ...forecast.value]; }
/** @returns {Array<object>} Six most recent entries, newest first; source ledger remains unchanged. */
function getLatestTransactions() { return [...transactions.value].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 6); }

/** @returns {object} A cash warning based on the first projected month below zero or the chosen buffer. */
function getOutlook() {
	const negative = forecast.value.find(row => row.closing < 0);
	if (negative) return { tone: 'destructive', title: `Cash shortfall in ${monthLabel(negative.month)}`, description: `Projected month-end balance is ${money(negative.closing)}. Review receipt timing and planned payments.` };
	const belowBuffer = forecast.value.find(row => row.closing < cashBuffer);
	if (belowBuffer) return { tone: 'warning', title: `Below your buffer in ${monthLabel(belowBuffer.month)}`, description: `Projected month-end balance is ${money(belowBuffer.closing)}, below the ${money(cashBuffer)} cash buffer.` };
	return { tone: 'success', title: 'Above your cash buffer', description: `Every projected month closes above the ${money(cashBuffer)} buffer under these assumptions.` };
}

/**
 * Demonstrates an idempotent bank-event update to application-owned reactive data.
 * Real integrations should validate and reconcile events in their service layer.
 * @param {object} transaction A posted bank event with a stable id and signed amount.
 * @returns {boolean} Whether this previously unseen transaction was applied.
 */
function applyTransaction(transaction) {
	if (transactions.value.some(item => item.id === transaction.id)) return false;
	transactions.value = [...transactions.value, transaction];
	return true;
}

/** @returns {void} Adds the next dated sample event; all computed reports refresh together. */
function addTransaction() {
	const event = sampleEvents[eventIndex.value];
	if (!event) return;
	const minute = String(eventIndex.value + 1).padStart(2, '0');
	applyTransaction({ ...event, date: `2026-08-31T12:${minute}:00Z` });
	eventIndex.value += 1;
	status.value = `${event.label}: ${signedMoney(event.amount)}. ${eventIndex.value} of ${sampleEvents.length} sample transactions applied.`;
	if (eventIndex.value === sampleEvents.length) stopSimulation();
}

/** @returns {void} Starts or pauses the finite demo feed; nothing runs until explicitly started. */
function toggleSimulation() {
	if (running.value) {
		stopSimulation();
		status.value = `Simulation paused. ${eventIndex.value} of ${sampleEvents.length} sample transactions applied.`;
		return;
	}
	if (eventIndex.value >= sampleEvents.length) return;
	running.value = true;
	addTransaction();
	if (running.value) timer = window.setInterval(addTransaction, 2500);
}

/** @returns {void} Releases the demo timer on pause, completion, reset, or component unmount. */
function stopSimulation() {
	if (timer !== null) window.clearInterval(timer);
	timer = null;
	running.value = false;
}

/** @returns {void} Restores the initial ledger, horizon, and forecast assumptions. */
function resetDemo() {
	stopSimulation();
	transactions.value = [...initialTransactions];
	eventIndex.value = 0;
	horizon.value = '3';
	receiptAdjustment.value = 0;
	costAdjustment.value = 0;
	status.value = 'Demo reset. Ready to replay 8 sample bank transactions.';
}

/** @param {number} minor Amount in pence. @returns {string} GBP with penny precision. */
function money(minor) { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(minor / 100); }
/** @param {number} minor Signed amount in pence. @returns {string} Explicit incoming or outgoing cash. */
function signedMoney(minor) { return `${minor > 0 ? '+' : minor < 0 ? '−' : ''}${money(Math.abs(minor))}`; }
/** @param {number} pounds Chart measurement. @returns {string} GBP preserving penny precision in tooltips and tables. */
function chartMoney(pounds) { return money(Math.round(pounds * 100)); }
/** @param {number} pounds Value-axis measurement. @returns {string} Compact GBP tick label. */
function axisMoney(pounds) { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', notation: 'compact', maximumFractionDigits: 1 }).format(pounds); }
/** @param {string} month ISO year-month. @returns {string} Explicit month and year across forecast boundaries. */
function monthLabel(month) { return new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`)); }
/** @param {string} date ISO date or timestamp. @returns {string} Bank posting date in UTC. */
function transactionDate(date) { return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(date)); }
</script>

<template>
	<section aria-label="Cashflow reporting demo" class="@container w-full min-w-0 space-y-5 text-canvas-fg">
		<DomCard padding="none" class="overflow-hidden">
			<div class="flex flex-wrap items-start justify-between gap-4 border-b border-border p-4 @md:p-6">
				<div>
					<p class="text-xs font-medium uppercase tracking-wider text-muted-fg">Business banking · GBP</p>
					<h3 class="mt-2 text-xl font-semibold tracking-tight">Cashflow overview</h3>
					<p class="mt-1 text-sm text-muted-fg">Recorded through 31 Aug 2026 · Sample account</p>
				</div>
				<span class="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium">Interactive demo</span>
			</div>
			<div class="grid gap-6 p-4 @md:grid-cols-2 @md:p-6 @3xl:grid-cols-4">
				<div><p class="text-xs text-muted-fg">Cash in bank</p><p class="mt-2 text-3xl font-semibold tracking-tight tabular-nums" data-cashflow="balance">{{ money(currentMonth.closing) }}</p><p class="mt-2 text-xs text-muted-fg">Opening August: {{ money(currentMonth.opening) }}</p></div>
				<div><p class="text-xs text-muted-fg">Money in · August</p><p class="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-success" data-cashflow="received">+{{ money(currentMonth.received) }}</p><p class="mt-2 text-xs text-muted-fg">Posted receipts</p></div>
				<div><p class="text-xs text-muted-fg">Money out · August</p><p class="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-destructive" data-cashflow="paid">−{{ money(currentMonth.paid) }}</p><p class="mt-2 text-xs text-muted-fg">Posted payments</p></div>
				<div><p class="text-xs text-muted-fg">Net cashflow · August</p><p class="mt-2 text-2xl font-semibold tracking-tight tabular-nums" :class="currentMonth.net < 0 ? 'text-destructive' : 'text-success'" data-cashflow="net">{{ signedMoney(currentMonth.net) }}</p><p class="mt-2 text-xs text-muted-fg">Money in minus money out</p></div>
			</div>
			<div class="space-y-3 border-t border-border bg-secondary/20 p-4 @md:px-6">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<p class="inline-flex items-center gap-2 text-xs font-medium"><span class="size-2 rounded-full" :class="running ? 'bg-success' : 'bg-muted-fg'" aria-hidden="true" />Simulated bank feed · {{ running ? 'Demo running' : eventIndex === sampleEvents.length ? 'Replay complete' : 'Demo paused' }}</p>
					<div class="flex flex-wrap gap-2">
						<DomButton size="sm" :disabled="eventIndex === sampleEvents.length" @click="toggleSimulation">{{ running ? 'Pause simulation' : 'Start simulation' }}</DomButton>
						<DomButton size="sm" variant="secondary" :disabled="running || eventIndex === sampleEvents.length" @click="addTransaction">Add transaction</DomButton>
						<DomButton size="sm" variant="ghost" @click="resetDemo">Reset demo</DomButton>
					</div>
				</div>
				<p role="status" class="min-h-5 text-xs leading-5 text-muted-fg">{{ status }}</p>
			</div>
		</DomCard>

		<DomCard padding="none" class="p-4 @md:p-6">
			<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
				<div><p class="text-xs text-muted-fg">Projected cash · {{ monthLabel(projectedMonth.month) }}</p><p class="mt-2 text-3xl font-semibold tracking-tight tabular-nums" :class="projectedMonth.closing < 0 ? 'text-destructive' : ''" data-cashflow="projection">{{ money(projectedMonth.closing) }}</p><p class="mt-2 text-xs text-muted-fg">{{ signedMoney(projectedMonth.closing - currentMonth.closing) }} from the recorded balance</p></div>
				<div class="shrink-0"><DomToggleButtonGroup v-model="horizon" label="Forecast horizon" :options="[{ value: '3', label: '3 months' }, { value: '6', label: '6 months' }]" size="sm" /></div>
			</div>
			<DomLineChart title="Cash balance & projection" description="Month-end balances. The dashed forecast starts at your last recorded balance." :rows="balanceRows" x-key="month" :series="balanceSeries" format="currency" currency="GBP" :x-formatter="monthLabel" :value-formatter="chartMoney" :y-formatter="axisMoney" :height="290" />
			<div class="mt-6 grid gap-6 border-t border-border pt-5 @lg:grid-cols-2">
				<label class="block text-sm"><span class="flex items-center justify-between gap-2 font-medium">Expected receipts <output class="text-xs tabular-nums text-muted-fg">{{ receiptAdjustment > 0 ? '+' : '' }}{{ receiptAdjustment }}%</output></span><input v-model.number="receiptAdjustment" aria-label="Expected receipts adjustment" type="range" min="-40" max="40" step="5" class="mt-4 w-full cursor-pointer accent-primary" /><span class="mt-1 block text-xs text-muted-fg">Adjust planned incoming cash</span></label>
				<label class="block text-sm"><span class="flex items-center justify-between gap-2 font-medium">Expected payments <output class="text-xs tabular-nums text-muted-fg">{{ costAdjustment > 0 ? '+' : '' }}{{ costAdjustment }}%</output></span><input v-model.number="costAdjustment" aria-label="Expected payments adjustment" type="range" min="-20" max="40" step="5" class="mt-4 w-full cursor-pointer accent-primary" /><span class="mt-1 block text-xs text-muted-fg">Adjust planned outgoing cash</span></label>
			</div>
			<div class="mt-5 rounded-xl border border-border bg-secondary/30 p-4" :style="{ borderLeft: `3px solid var(--${outlook.tone})` }">
				<p class="text-sm font-semibold" :style="{ color: `var(--${outlook.tone})` }">{{ outlook.title }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ outlook.description }}</p>
			</div>
			<p class="mt-4 text-xs leading-5 text-muted-fg">Forecasts use illustrative scheduled receipts and payments, adjusted by the sliders. They show month-end cash, so a shortfall within a month may not appear.</p>
		</DomCard>

		<DomCard padding="none" class="p-4 @md:p-6">
			<DomBarChart title="Bank money in & out" description="Recorded monthly cash movements. Both bars show positive amounts; net cashflow is money in minus money out." :rows="movementRows" x-key="month" :series="movementSeries" format="currency" currency="GBP" :x-formatter="monthLabel" :value-formatter="chartMoney" :y-formatter="axisMoney" :height="230" />
		</DomCard>

		<DomCard padding="none" class="overflow-hidden">
			<div class="p-4 @md:p-6">
				<h4 class="text-sm font-semibold">Recent bank activity</h4><p class="mt-1 max-w-xl text-xs leading-5 text-muted-fg">Replay sample receipts and payments dated 31 August using the controls above. Each event updates the bank balance, August totals, both charts, and the forecast.</p>
			</div>
			<ul class="divide-y divide-border border-t border-border" aria-label="Recent bank transactions">
				<li v-for="item in latestTransactions" :key="item.id" class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 @md:px-6">
					<div class="min-w-0"><p class="text-sm font-medium">{{ item.label }}</p><p class="mt-1 text-xs text-muted-fg">{{ transactionDate(item.date) }} · {{ item.amount >= 0 ? 'Received' : 'Paid' }}</p></div>
					<p class="text-sm font-medium whitespace-nowrap tabular-nums" :class="item.amount >= 0 ? 'text-success' : 'text-destructive'">{{ signedMoney(item.amount) }}</p>
				</li>
			</ul>
			<p class="border-t border-border px-4 py-3 text-xs text-muted-fg @md:px-6">Latest 6 of {{ transactions.length }} sample transactions. Simulation only; no bank connection.</p>
		</DomCard>

		<DomCard padding="none" class="overflow-hidden">
			<div class="border-b border-border p-4 @md:px-6"><h4 class="text-sm font-semibold">Monthly cashflow report</h4><p class="mt-1 text-xs leading-5 text-muted-fg">Opening cash + money in − money out = closing cash. Forecast rows use your current assumptions.</p></div>
			<div class="overflow-x-auto" tabindex="0" role="region" aria-label="Monthly cashflow report table">
				<table class="w-full whitespace-nowrap text-left text-xs tabular-nums">
					<caption class="sr-only">Monthly bank reconciliation, in GBP. Recorded activity followed by forecast periods.</caption>
					<thead class="bg-secondary/40 text-muted-fg"><tr><th scope="col" class="px-4 py-3">Month / status</th><th scope="col" class="px-4 py-3 text-right">Opening</th><th scope="col" class="px-4 py-3 text-right">Money in</th><th scope="col" class="px-4 py-3 text-right">Money out</th><th scope="col" class="px-4 py-3 text-right">Net cashflow</th><th scope="col" class="px-4 py-3 text-right">Closing</th></tr></thead>
					<tbody class="divide-y divide-border"><tr v-for="row in reportRows" :key="row.month" :class="row.type === 'Forecast' ? 'bg-secondary/20' : ''"><th scope="row" class="px-4 py-3 font-medium">{{ monthLabel(row.month) }}<span class="mt-1 block text-[10px] font-normal text-muted-fg">{{ row.type }}</span></th><td class="px-4 py-3 text-right">{{ money(row.opening) }}</td><td class="px-4 py-3 text-right">{{ money(row.received) }}</td><td class="px-4 py-3 text-right">{{ money(row.paid) }}</td><td class="px-4 py-3 text-right" :class="row.net < 0 ? 'text-destructive' : 'text-success'">{{ signedMoney(row.net) }}</td><td class="px-4 py-3 text-right font-semibold" :class="row.closing < 0 ? 'text-destructive' : ''">{{ money(row.closing) }}</td></tr></tbody>
				</table>
			</div>
		</DomCard>
	</section>
</template>
