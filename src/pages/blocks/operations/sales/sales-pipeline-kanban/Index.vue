<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import SalesPipelineKanban from './examples/SalesPipelineKanban.vue';
import SalesPipelineKanbanSrc from './examples/SalesPipelineKanban.vue?raw';
import DealStageColumnSrc from './components/DealStageColumn.vue?raw';
import DealCardSrc from './components/DealCard.vue?raw';
import ForecastPillSrc from './components/ForecastPill.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Sales Pipeline Kanban Block"
			tagline="A copyable CRM pipeline board for deal filtering, stage review, forecast math, and close-plan editing."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations" title="Sales pipeline kanban">
				<Example
					:source="SalesPipelineKanbanSrc"
					filename="SalesPipelineKanban.vue"
					presentation="iframe"
					frame-src="/blocks/operations/sales/sales-pipeline-kanban/preview/SalesPipelineKanban"
					description="Copy this into CRM, sales operations, partner marketplace, recruiting, agency, or customer-success apps that need a high-signal pipeline board with realistic forecast and deal-review behavior."
					default-open
					:preview-lines="18"
				>
					<SalesPipelineKanban />
				</Example>
			</DocSection>

			<DocSection eyebrow="Local components" title="Copy the helper components">
				<div class="grid gap-4 xl:grid-cols-3">
					<CodeBlock lang="vue" filename="components/DealStageColumn.vue" :code="DealStageColumnSrc" />
					<CodeBlock lang="vue" filename="components/DealCard.vue" :code="DealCardSrc" />
					<CodeBlock lang="vue" filename="components/ForecastPill.vue" :code="ForecastPillSrc" />
				</div>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when teams need to qualify opportunities, compare forecast by stage, and quickly open a deal to update owner notes,
						next step, stage, probability, or stakeholder context. It works for CRM products, sales-led SaaS dashboards, agency pipelines,
						recruiting pipelines, partner onboarding, enterprise quote rooms, and customer expansion workflows.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Keep stage definitions server-owned so probability defaults, exit criteria, and required fields can evolve without redeploying the UI.</li>
						<li>Persist stage changes as explicit commands with previous stage, new stage, actor, timestamp, and forecast impact.</li>
						<li>Calculate weighted forecast from canonical opportunity value and probability on the server; the client preview is for operator feedback.</li>
						<li>Model owners, regions, deal tags, risk flags, and close plans as structured fields so the same data can power dashboards, reminders, and exec reviews.</li>
						<li>Use the dialog flow for edits that need validation. Promote drag-to-stage only after backend transition rules and conflict messages are ready.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended deal payload">
				<CodeBlock lang="js" filename="sales-pipeline.js" :code="`{
\tworkspaceId: 'ws_revenue_2048',
\tview: {
\t\tmode: 'forecast',
\t\townerIds: ['usr_ada', 'usr_maya'],
\t\tregions: ['emea'],
\t\tshowExecutiveCommit: true
\t},
\tstages: [
\t\t{ id: 'qualified', label: 'Qualified', defaultProbability: 25 },
\t\t{ id: 'solution', label: 'Solution fit', defaultProbability: 45 },
\t\t{ id: 'proposal', label: 'Proposal', defaultProbability: 65 },
\t\t{ id: 'legal', label: 'Legal review', defaultProbability: 80 },
\t\t{ id: 'commit', label: 'Commit', defaultProbability: 90 }
\t],
\tdeals: [
\t\t{
\t\t\tid: 'deal_northstar',
\t\t\taccountId: 'acct_northstar',
\t\t\taccount: 'Northstar Labs',
\t\t\tstage: 'proposal',
\t\t\tvalue: 128000,
\t\t\tcurrency: 'USD',
\t\t\tprobability: 65,
\t\t\tforecast: 'Best case',
\t\t\townerId: 'usr_ada',
\t\t\tregion: 'emea',
\t\t\tcloseDate: 'Jun 28',
\t\t\tnextStep: 'Security review',
\t\t\trisks: ['Legal', 'Security'],
\t\t\tstakeholders: ['CFO', 'VP Product'],
\t\t\tclosePlan: 'Confirm security exception path, then send final order form.'
\t\t}
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Transition rules</h3>
						<p class="mt-2">Gate stage changes with server-side exit criteria. Proposal and commit stages usually need pricing approval, legal state, primary buyer, and close date checks.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Forecast quality</h3>
						<p class="mt-2">Separate seller-entered probability from model-generated health scores. Store overrides and reason codes so revenue leaders can inspect forecast drift.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful next steps include drag-to-stage, activity sync, stale-deal nudges, quote PDF generation, mutual action plans, renewal pipelines, and reusable kanban column helpers.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
