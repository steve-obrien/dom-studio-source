<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import ReportBuilderWorkspace from './examples/ReportBuilderWorkspace.vue';
import ReportBuilderWorkspaceSrc from './examples/ReportBuilderWorkspace.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Report Builder Block"
			tagline="A responsive reporting workspace for choosing metrics, breakdowns, date ranges, previewing results, and scheduling exports."
			tag="Analytics UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Analytics" title="Report builder workspace">
				<Example
					:source="ReportBuilderWorkspaceSrc"
					filename="ReportBuilderWorkspace.vue"
					presentation="iframe"
					frame-src="/blocks/analytics/report-builder/preview/ReportBuilderWorkspace"
					description="Copy this into analytics products, admin dashboards, success workspaces, or internal ops tools. Replace the local report definitions with your metrics catalog, query builder, preview endpoint, and sharing model."
					default-open
					:preview-lines="14"
				>
					<ReportBuilderWorkspace />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when customers need to build reusable reports without learning a query language.
						It is shaped for SaaS analytics, ecommerce reporting, customer success health dashboards, marketing attribution, and product-led growth workspaces.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>metricCatalog</code>, <code>breakdowns</code>, and <code>savedReports</code> with backend-provided definitions scoped to the current account and user permissions.</li>
						<li>Wire the preview action to a short-running query endpoint that returns chart points, table rows, totals, sampling status, and warnings.</li>
						<li>Persist scheduled delivery through a report subscription endpoint with recipients, cadence, export format, timezone, and permission checks.</li>
						<li>Gate destructive changes, shared reports, and cross-workspace datasets behind explicit review states and audit events.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended report payload">
				<CodeBlock lang="js" filename="report-definition.js" :code="`{
\tid: 'rep_revenue_growth',
\tname: 'Revenue growth by segment',
\tdataset: 'Subscriptions',
\tdateRange: 'last_30_days',
\tchartType: 'bar',
\tmetrics: ['monthly_recurring_revenue', 'net_revenue_retention'],
\tbreakdowns: ['plan', 'region'],
\tfilters: [
\t\t{ field: 'account_status', operator: 'equals', value: 'active' }
\t],
\tsharing: {
\t\tvisibility: 'team',
\t\trecipients: ['finance@getdom.studio'],
\t\tcadence: 'monday_9am',
\t\tformat: 'csv'
\t},
\tpreview: {
\t\tstatus: 'ready',
\t\trows: 842,
\t\tgeneratedAt: '2026-06-10T09:30:00Z',
\t\twarnings: []
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Metric catalog</h3>
						<p class="mt-2">Keep metric labels, descriptions, compatible datasets, and calculation rules server-owned so copied report definitions stay stable.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Preview safety</h3>
						<p class="mt-2">Return sampled previews quickly, then run full exports asynchronously with completion notifications and retryable job records.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Good follow-ups include reusable filter builders, chart editors, query warnings, dashboard pinning, and scheduled export monitors.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
