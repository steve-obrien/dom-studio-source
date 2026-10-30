<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import Example from '../../../_layout/docs/Example.vue';
import CashflowReport from './examples/CashflowReport.vue';
import CashflowReportSource from './examples/CashflowReport.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Cashflow report" eyebrow="Finance blocks" tag="Banking & forecasting" tagline="Bank receipts, payments, and projected cash balances, with adjustable assumptions and a simulated transaction feed.">
			<DocSection title="Cashflow overview">
				<Example :source="CashflowReportSource" filename="CashflowReport.vue" :preview-lines="0" description="Adjust the forecast or replay bank activity to watch the balances, charts, and monthly report update together."><CashflowReport /></Example>
			</DocSection>
			<DocSection title="Connect bank data">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">Replace the sample ledger with posted transactions and a reconciled opening balance in the same currency. The application owns fetching, event validation, deduplication, and reconciliation. Keep amounts in integer minor units, distinguish posted activity from planned receipts and payments, and replace the demo timer with your API or event subscription. The example applies each event once by its stable transaction ID and clears the timer when it is paused or unmounted.</p>
				<a href="/charts/finance#cashflow-report" class="text-sm font-medium underline underline-offset-4">Explore finance charts</a>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
