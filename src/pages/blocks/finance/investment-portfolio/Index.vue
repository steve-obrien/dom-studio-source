<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import Example from '../../../_layout/docs/Example.vue';
import InvestmentPortfolio from './examples/InvestmentPortfolio.vue';
import InvestmentPortfolioSource from './examples/InvestmentPortfolio.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Investment portfolio" eyebrow="Finance blocks" tag="Banking & investing" tagline="A banking-style portfolio with current value, period performance, asset allocation, and investment holdings.">
			<DocSection title="Portfolio overview">
				<Example :source="InvestmentPortfolioSource" filename="InvestmentPortfolio.vue" :preview-lines="0" description="Switch portfolios or reporting periods to update the chart and all matching returns. Export data downloads the selected history as CSV."><InvestmentPortfolio /></Example>
			</DocSection>
			<DocSection title="Connect portfolio data">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">Replace the example accounts and generated histories with timestamped valuations from your service. Store monetary values in minor units and return current cash, holding values, and period opening balances in the same currency. The examples contain no deposits or withdrawals; applications with cash flows must supply an appropriate return calculation.</p>
				<RouterLink to="/charts/finance" class="text-sm font-medium underline underline-offset-4">Explore finance charts</RouterLink>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
