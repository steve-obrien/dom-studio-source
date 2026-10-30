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
			tagline="A working metered-billing investigation desk for tracing discrepancies, proposing append-only corrections, previewing invoices, collecting approval, and releasing provider updates."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Monetization / Usage Metering" title="Usage event reconciliation">
				<Example
					:source="UsageEventReconciliationSrc"
					filename="UsageEventReconciliation.vue"
					presentation="iframe"
					frame-src="/blocks/monetization/usage-metering/usage-event-reconciliation/preview/UsageEventReconciliation"
					description="Use this working section in SaaS billing operations, usage-pricing consoles, finance review, or customer-success tooling that needs auditable human review before invoice finalization."
					default-open
					:preview-lines="18"
				>
					<UsageEventReconciliation />
				</Example>
			</DocSection>

			<DocSection eyebrow="Working journey" title="From source evidence to provider receipt">
				<div class="grid gap-5 text-sm leading-7 text-muted-fg lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
					<div>
						<p>
							The example is backed by repository-local JSON endpoints rather than client-only demo state.
							A reviewer can claim one discrepancy, compare immutable source and rated totals, create an append-only correction, preview the customer invoice, collect finance approval, and publish checked evidence to a deterministic provider worker.
						</p>
						<ol class="mt-4 list-decimal space-y-2 pl-5">
							<li>Claim a discrepancy so ownership and the exact case revision are explicit.</li>
							<li>Replay rejected schema events when required, then bind source and rated evidence.</li>
							<li>Choose a correction with <code>DomRadioGroup</code>, <code>DomSelect</code>, and <code>DomTextareaInput</code>.</li>
							<li>Preview the invoice delta and route material changes through finance approval.</li>
							<li>Run five server-owned checks, acknowledge customer impact, and advance the provider rollout.</li>
						</ol>
					</div>
					<div class="border-y border-border py-4">
						<h3 class="font-semibold text-canvas-fg">Failure contracts included</h3>
						<dl class="mt-3 divide-y divide-border">
							<div class="flex justify-between gap-3 py-2"><dt>Missing case</dt><dd class="font-mono text-xs">404</dd></div>
							<div class="flex justify-between gap-3 py-2"><dt>Stale revision</dt><dd class="font-mono text-xs">409</dd></div>
							<div class="flex justify-between gap-3 py-2"><dt>Invalid proposal</dt><dd class="font-mono text-xs">422</dd></div>
							<div class="flex justify-between gap-3 py-2"><dt>Successful mutation</dt><dd class="font-mono text-xs">200</dd></div>
						</dl>
					</div>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local endpoint surface">
				<CodeBlock lang="text" filename="usage-reconciliation-api.txt" :code="`GET  /api/block-demos/usage-event-reconciliation/bootstrap
POST /api/block-demos/usage-event-reconciliation/reset
POST /api/block-demos/usage-event-reconciliation/cases/:caseId/claim
POST /api/block-demos/usage-event-reconciliation/cases/:caseId/replay
POST /api/block-demos/usage-event-reconciliation/cases/:caseId/compare
POST /api/block-demos/usage-event-reconciliation/cases/:caseId/adjustments
POST /api/block-demos/usage-event-reconciliation/cases/:caseId/preview
POST /api/block-demos/usage-event-reconciliation/cases/:caseId/approval/request
POST /api/block-demos/usage-event-reconciliation/approvals/:approvalId/decision
POST /api/block-demos/usage-event-reconciliation/cases/:caseId/validate
POST /api/block-demos/usage-event-reconciliation/cases/:caseId/release
POST /api/block-demos/usage-event-reconciliation/cases/:caseId/advance`" />
			</DocSection>

			<DocSection eyebrow="Data" title="Authoritative reconciliation case">
				<CodeBlock lang="js" filename="reconciliation-case.js" :code="`{
	id: 'rec_2048',
	revision: 7,
	periodId: '2026-06',
	customer: 'Northstar Analytics',
	product: 'AI agents',
	meter: 'agent_minutes',
	sourceTotal: 18420,
	ratedTotal: 17140,
	delta: 1280,
	invoiceDelta: 331.56,
	invoiceHold: true,
	rawEvent: {
		transactionId: 'evt_backfill_7712_18',
		checksum: 'sha256:9a41…c208',
		schemaVersion: 'meter.v3'
	},
	comparison: null,
	adjustment: null,
	invoicePreview: null,
	approval: null,
	validation: null,
	release: null
}`" />
			</DocSection>

			<DocSection eyebrow="Production boundary" title="What to replace before shipping">
				<div class="grid gap-4 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border-t border-border pt-4">
						<h3 class="font-semibold text-canvas-fg">Durable storage</h3>
						<p class="mt-2">Replace the in-memory example store with transactional usage, invoice, approval, and audit tables while preserving exact-revision conflicts.</p>
					</div>
					<div class="border-t border-border pt-4">
						<h3 class="font-semibold text-canvas-fg">Provider adapters</h3>
						<p class="mt-2">Keep rating, tax, credits, permissions, and provider idempotency server-owned. The browser should never author authoritative totals.</p>
					</div>
					<div class="border-t border-border pt-4">
						<h3 class="font-semibold text-canvas-fg">Async delivery</h3>
						<p class="mt-2">Move the deterministic rollout steps to a queue, ingest provider webhooks, and retain the immutable release receipt for customer support and audit.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
