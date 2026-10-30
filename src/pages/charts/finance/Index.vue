<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import InvestmentPortfolio from '../../blocks/finance/investment-portfolio/examples/InvestmentPortfolio.vue';
import InvestmentPortfolioSource from '../../blocks/finance/investment-portfolio/examples/InvestmentPortfolio.vue?raw';
import CashflowReport from '../../blocks/finance/cashflow-report/examples/CashflowReport.vue';
import CashflowReportSource from '../../blocks/finance/cashflow-report/examples/CashflowReport.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Finance & cashflow" eyebrow="Data Visualisation" tag="Banking & investing" tagline="Portfolio performance, bank money in and out, and cash projections. Interactive financial reports with clear numbers and useful comparisons.">
			<nav aria-label="Finance examples" class="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
				<a href="#investment-portfolio" class="underline underline-offset-4">Investment portfolio</a>
				<a href="#cashflow-report" class="underline underline-offset-4">Cashflow report</a>
				<a href="#dynamic-data" class="underline underline-offset-4">Dynamic data</a>
			</nav>
			<DocSection id="investment-portfolio" class="scroll-mt-28" title="Investment portfolio" eyebrow="Interactive example">
				<Example :source="InvestmentPortfolioSource" filename="InvestmentPortfolio.vue" source-path="src/pages/blocks/finance/investment-portfolio/examples/InvestmentPortfolio.vue" :preview-lines="0" description="Explore two sample portfolios. Day, week, month, and year controls update the chart, gains and losses, and holding performance together."><InvestmentPortfolio /></Example>
			</DocSection>
			<DocSection id="cashflow-report" class="scroll-mt-28" title="Cashflow report" eyebrow="Banking & forecasting">
				<Example :source="CashflowReportSource" filename="CashflowReport.vue" source-path="src/pages/blocks/finance/cashflow-report/examples/CashflowReport.vue" :preview-lines="0" description="Compare bank receipts and payments, explore a three- or six-month cash forecast, and replay transactions to see the report change."><CashflowReport /></Example>
				<RouterLink to="/blocks/finance/cashflow-report" class="text-sm font-medium underline underline-offset-4">Open the cashflow report block</RouterLink>
			</DocSection>
			<DocSection id="dynamic-data" class="scroll-mt-28" title="Dynamic data" eyebrow="Reactive chart examples">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">Use Start simulation or Add transaction in the cashflow example to replay sample bank events. Incoming and outgoing transactions update the ledger, summary values, bars, recorded balance, forecast, and monthly report together. Pause stops the feed; Reset demo restores the original data and assumptions.</p>
				<div class="grid gap-5 md:grid-cols-3">
					<div><h3 class="text-sm font-semibold">Update your records</h3><p class="mt-2 text-sm leading-6 text-muted-fg">The example appends each transaction to a Vue ref after checking its stable ID. Use your API or event subscription in place of the sample feed.</p></div>
					<div><h3 class="text-sm font-semibold">Derive each view</h3><p class="mt-2 text-sm leading-6 text-muted-fg">Computed values aggregate the same records for summaries and charts. Forecasts start from the latest bank balance and use separate planned cash movements.</p></div>
					<div><h3 class="text-sm font-semibold">Pass reactive rows</h3><p class="mt-2 text-sm leading-6 text-muted-fg">Charts redraw when their rows change. Keep series keys stable and clean up polling or subscriptions when leaving the view, as the demo does with its timer.</p></div>
				</div>
			</DocSection>
			<DocSection title="Build your finance view">
				<div class="grid gap-4 md:grid-cols-3">
					<RouterLink to="/charts/line-chart" class="rounded-xl border border-border p-5 transition hover:bg-secondary/30"><h3 class="text-sm font-semibold">Portfolio value</h3><p class="mt-2 text-sm leading-6 text-muted-fg">Time-series charts with precise currency tooltips, period controls, and signed changes.</p></RouterLink>
					<RouterLink to="/charts/donut-chart" class="rounded-xl border border-border p-5 transition hover:bg-secondary/30"><h3 class="text-sm font-semibold">Asset allocation</h3><p class="mt-2 text-sm leading-6 text-muted-fg">A current snapshot of investments and cash, with a custom centre label.</p></RouterLink>
					<RouterLink to="/charts/sparkline" class="rounded-xl border border-border p-5 transition hover:bg-secondary/30"><h3 class="text-sm font-semibold">Holding trends</h3><p class="mt-2 text-sm leading-6 text-muted-fg">Compact charts beside each investment, coloured to match its gain or loss.</p></RouterLink>
				</div>
			</DocSection>
			<DocSection title="Keep balances and returns consistent">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">Total value includes investments and cash. Each period compares its opening value with the current total, and the chart uses those same endpoints. These sample portfolios have no deposits or withdrawals during the reporting periods. When connecting real accounts, supply cash-flow-adjusted returns from your service, preserve currency and valuation timestamps, and treat a missing opening balance as unavailable.</p>
				<RouterLink to="/blocks/finance/investment-portfolio" class="text-sm font-medium underline underline-offset-4">Open the investment portfolio block</RouterLink>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
