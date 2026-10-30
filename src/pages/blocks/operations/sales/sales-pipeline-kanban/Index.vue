<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import SalesPipelineKanban from './examples/SalesPipelineKanban.vue';
import SalesPipelineKanbanSrc from './examples/SalesPipelineKanban.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Sales Pipeline Kanban Block"
			tagline="A working revenue-operations section with a compact pipeline, exact governed transitions, forecast impact, activity receipts, and a repository-local API."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations / Sales" title="Sales pipeline kanban">
				<Example
					:source="SalesPipelineKanbanSrc"
					filename="SalesPipelineKanban.vue"
					presentation="iframe"
					frame-src="/blocks/operations/sales/sales-pipeline-kanban/preview/SalesPipelineKanban"
					description="Exercise the full revenue workflow: triage activity risk, inspect a deal, prepare an exact stage change, review forecast impact and exit criteria, synchronize it to CRM, log the next activity, and verify retained evidence."
					default-open
					:preview-lines="20"
				>
					<SalesPipelineKanban />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when sellers and revenue operators need one high-density view of stage, value, forecast, activity urgency, and deal evidence.
						The compact configurable board takes cues from Attio, Pipedrive activity prioritization, and Salesforce forecast categories without reproducing their product chrome.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Copy <code>SalesPipelineKanban.vue</code> and <code>DealWorkspace.vue</code>; navigation, filters, drawers, dialogs, fields, statuses, progress, feedback, and evidence use public DOM Studio components.</li>
						<li>Start from <code>GET /api/block-demos/sales-pipeline/bootstrap</code>, then include the current workspace revision and deal version with every mutation.</li>
						<li>Create a transition preview before commit. The server locks stage movement, buyer, next step, close plan, date, approvals, forecast category, and weighted impact behind one checksum.</li>
						<li>Keep sales activity separate from stage changes. The example retains the activity type, outcome, next step, actor, deal version, and engagement-provider receipt.</li>
						<li>Replace the deterministic process-memory adapter with durable CRM, sales-engagement, forecast, and audit providers without changing the UI contract.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Working transition contract">
				<CodeBlock lang="js" filename="deal-transition.js" :code="`const workspace = await fetch(
	'/api/block-demos/sales-pipeline/bootstrap'
).then((response) => response.json())

const deal = workspace.selectedDeal
const preview = await fetch(
	'/api/block-demos/sales-pipeline/transitions/preview',
	{
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			revision: workspace.workspace.revision,
			dealId: deal.id,
			dealVersion: deal.version,
			stage: 'legal',
			probability: 80,
			forecast: 'best_case',
			nextStep: 'Complete legal intake review',
			closePlan: deal.closePlan
		})
	}
).then((response) => response.json())

const committed = await fetch(
	'/api/block-demos/sales-pipeline/transitions/commit',
	{
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			revision: preview.workspace.revision,
			previewChecksum: preview.transitionPreview.checksum,
			acknowledged: true
		})
	}
).then((response) => response.json())

console.log(committed.transitionReceipt.providerReceipt)`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Board density</h3>
						<p class="mt-2">Five governed stages remain visible at desktop widths. Compact viewports switch to a stage selector and focused Pipeline, Deal, and Forecast views instead of shrinking or clipping the board.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Server authority</h3>
						<p class="mt-2">The API owns revisions, deal versions, stage rules, approvals, checksums, forecast math, and conflicts. The browser renders evidence and submits acknowledged commands.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Production boundary</h3>
						<p class="mt-2">Move the store to durable transactions, authorize every territory and deal, execute CRM writes idempotently, validate webhooks, and retain immutable before-and-after audit records before production use.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
