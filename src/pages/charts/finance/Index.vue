<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import InvestmentPortfolio from '../../blocks/finance/investment-portfolio/examples/InvestmentPortfolio.vue';
import InvestmentPortfolioSource from '../../blocks/finance/investment-portfolio/examples/InvestmentPortfolio.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Finance & portfolios" eyebrow="Data Visualisation" tag="Banking & investing" tagline="Balances, portfolio performance, and investment holdings. Clear numbers, useful comparisons, and a view that works from desktop to mobile.">
			<DocSection title="Investment portfolio" eyebrow="Interactive example">
				<Example :source="InvestmentPortfolioSource" filename="InvestmentPortfolio.vue" source-path="src/pages/blocks/finance/investment-portfolio/examples/InvestmentPortfolio.vue" :preview-lines="0" description="Explore two sample portfolios. Day, week, month, and year controls update the chart, gains and losses, and holding performance together."><InvestmentPortfolio /></Example>
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
