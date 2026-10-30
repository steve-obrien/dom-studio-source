<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import BulkActionReviewConsole from './examples/BulkActionReviewConsole.vue';
import BulkActionReviewConsoleSrc from './examples/BulkActionReviewConsole.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Bulk Actions Block"
			tagline="An API-backed bulk change desk for selecting exact records, reviewing immutable impact, routing approval, and recovering partial failures."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations" title="Bulk action review console">
				<Example
					:source="BulkActionReviewConsoleSrc"
					filename="BulkActionReviewConsole.vue"
					presentation="iframe"
					frame-src="/blocks/operations/bulk-actions/preview/BulkActionReviewConsole"
					description="A Shopify- and Zendesk-inspired operations section with server-owned selection, an immutable before-and-after preview, finance approval, background job progress, safe-update conflicts, retry, cancellation, and durable receipts."
					default-open
					:preview-lines="14"
				>
					<BulkActionReviewConsole />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when an operator needs to apply one sensitive change to many records without turning the UI into an unaccountable “select all and hope” action.
						The example is a complete local journey: every mutation crosses an API boundary, reloads preserve state, and the simulated worker continues past one stale record.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Persist the selected IDs, filter, action, reason, and notification intent as a revisioned server draft.</li>
						<li>Create an immutable preview that records source versions, before-and-after values, exclusions, policy checks, and an approval route.</li>
						<li>Queue only the approved preview receipt, then process each eligible record independently through safe-update checks.</li>
						<li>Keep partial successes visible and let an operator refresh and retry only the conflicting record.</li>
						<li>Retain preview, approval, job, cancellation, completion, and retry receipts in the audit history.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Working local endpoints">
				<CodeBlock lang="txt" filename="bulk-actions-api.txt" :code="`GET  /api/block-demos/bulk-actions/bootstrap
POST /api/block-demos/bulk-actions/reset
POST /api/block-demos/bulk-actions/draft
POST /api/block-demos/bulk-actions/preview
POST /api/block-demos/bulk-actions/approvals/request
POST /api/block-demos/bulk-actions/approvals/:approvalId/decide
POST /api/block-demos/bulk-actions/jobs
POST /api/block-demos/bulk-actions/jobs/:jobId/advance
POST /api/block-demos/bulk-actions/jobs/:jobId/retry
POST /api/block-demos/bulk-actions/jobs/:jobId/cancel`" />
			</DocSection>

			<DocSection eyebrow="Production" title="Replace the demo adapters">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border-t border-border pt-4">
						<h3 class="font-semibold text-canvas-fg">Durable worker</h3>
						<p class="mt-2">Replace deterministic advancement with an idempotent queue, per-record leases, retries, cancellation signals, and observable job status.</p>
					</div>
					<div class="border-t border-border pt-4">
						<h3 class="font-semibold text-canvas-fg">Authorization and approval</h3>
						<p class="mt-2">Resolve permissions, separation of duties, thresholds, and approver identity through your policy and identity services.</p>
					</div>
					<div class="border-t border-border pt-4">
						<h3 class="font-semibold text-canvas-fg">Audit and providers</h3>
						<p class="mt-2">Write receipts to durable audit storage and connect billing, notification, CRM, and export providers behind idempotency keys.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
