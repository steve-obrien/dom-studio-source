<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import UsageEventReconciliation from './examples/UsageEventReconciliation.vue';
import UsageEventReconciliationSrc from './examples/UsageEventReconciliation.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Usage Event Reconciliation Block"
			tagline="A copyable metered billing operations table for reviewing usage records, finding invoice discrepancies, selecting affected events, and creating adjustment jobs."
			tag="Billing UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Monetization / Usage Metering" title="Usage event reconciliation">
				<Example
					:source="UsageEventReconciliationSrc"
					filename="UsageEventReconciliation.vue"
					presentation="iframe"
					frame-src="/blocks/monetization/usage-metering/usage-event-reconciliation/preview/UsageEventReconciliation"
					description="Copy this into SaaS billing dashboards, usage-based pricing consoles, customer success tooling, finance review workflows, or any product that needs human review around metered events before invoice finalization."
					default-open
					:preview-lines="18"
				>
					<UsageEventReconciliation />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when usage events affect invoices, credits, overage charges, or customer trust.
						The pattern keeps period selection, product filters, typed grid search, discrepancy review, row selection, and adjustment creation in one reusable operations surface.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace the local <code>usageEvents</code> array with server-paginated usage, rating, and invoice-preview records from your billing API.</li>
						<li>Drive grid state through <code>query-change</code> so search, typed filters, sorting, and selected rows can map to SQL or warehouse-backed endpoints.</li>
						<li>Keep raw usage immutable. Store corrections as adjustment jobs that reference original event ids, reason codes, reviewer identity, and approval state.</li>
						<li>Separate metering ingestion status from billing readiness. Late, duplicate, and schema-error events should not silently change finalized invoices.</li>
						<li>Gate adjustment creation behind finance or billing-admin permissions, then write an audit event whenever selected usage changes invoice exposure.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended usage event shape">
				<CodeBlock lang="js" filename="usage-event.js" :code="`{
\tid: 'use_2048',
\tworkspaceId: 'wrk_northstar',
\tcustomer: {
\t\tid: 'cus_northstar',
\t\tname: 'Northstar Analytics',
\t\tplan: 'Enterprise'
\t},
\tproduct: 'AI seats',
\tmeter: 'agent_minutes',
\tperiod: '2026-06',
\tquantity: 18420,
\tunitPrice: 0.018,
\tinvoiceImpact: 331.56,
\tstatus: 'needs-review',
\treconciliation: {
\t\tdelta: 1280,
\t\treason: 'Backfill exceeded contract cap',
\t\tseverity: 'warning',
\t\tinvoiceHold: true
\t},
\tingestion: {
\t\tsource: 'events-api',
\t\tbatchId: 'batch_7712',
\t\treceivedAt: '2026-06-12T07:18:00Z',
\t\tschemaVersion: 'meter.v3'
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Billing boundary</h3>
						<p class="mt-2">Keep calculations server-owned. The UI can preview invoice impact, but the backend should own rating, currency, tax, credits, and contract rules.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Correction model</h3>
						<p class="mt-2">Treat corrections as append-only adjustment jobs. Link each job to original usage events and show the delta instead of mutating usage records in place.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include invoice-preview diffs, customer-visible explanations, approval routing, CSV import, warehouse drill-through, and a reusable billing adjustment drawer.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
