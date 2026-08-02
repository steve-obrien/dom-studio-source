<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import ExpenseCaptureFlow from './examples/ExpenseCaptureFlow.vue';
import ExpenseCaptureFlowSrc from './examples/ExpenseCaptureFlow.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Expense Capture Block"
			tagline="A working spend inbox for receipt evidence, card matching, policy review, approval, and accounting settlement."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Finance" title="Expense operations inbox">
				<Example
					:source="ExpenseCaptureFlowSrc"
					filename="ExpenseCaptureFlow.vue"
					presentation="iframe"
					frame-src="/blocks/operations/finance/expense-capture/preview/ExpenseCaptureFlow"
					description="A responsive Ramp-, Brex-, and Expensify-inspired app section. Select an expense, confirm provider evidence, edit accounting fields, preview the immutable route, submit it, record approval, and export or reimburse it through the repository-local API."
					default-open
					:preview-lines="20"
				>
					<ExpenseCaptureFlow />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="Working API journey">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						This demo is backed by a deterministic, process-memory API rather than client-only fixtures. The server owns revisions, receipt verification, card matches, policy results, immutable previews, approvals, accounting exports, and reimbursement settlement receipts.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/expense-capture/bootstrap</code> returns the inbox, catalogs, selected expense, capabilities, policy results, and exact versions.</li>
						<li><code>POST .../details</code>, <code>.../receipt/refresh</code>, and <code>.../match</code> create authoritative evidence and re-evaluate the expense.</li>
						<li><code>POST .../preview</code> locks an immutable route and checksum; <code>.../submit</code> requires that exact checksum and an explicit acknowledgement.</li>
						<li><code>POST .../advance</code> records manager approval, then emits either an accounting export receipt or a reimbursement settlement receipt.</li>
						<li>Every mutation checks workspace and expense revisions, returns a conflict when stale, and survives browser reloads for the life of the server process.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended expense payload">
				<CodeBlock lang="js" filename="expense-capture.js" :code="`{
\tid: 'exp_2048',
\tstatus: 'draft',
\treceipt: {
\t\tid: 'file_receipt_18',
\t\turl: '/files/file_receipt_18',
\t\tmimeType: 'image/jpeg',
\t\textractedAt: '2026-06-11T09:42:00Z',
\t\tconfidence: 0.91
\t},
\tmerchant: 'Northstar Coffee',
\tamount: {
\t\tvalue: 42.80,
\t\tcurrency: 'GBP',
\t\ttaxIncluded: true
\t},
\tspentAt: '2026-06-10',
\tcategory: 'meals',
\tprojectId: 'proj_launch',
\tpaymentMethod: 'company_card',
\treimbursable: false,
\tnotes: 'Client workshop breakfast before launch planning.',
\tpolicyChecks: [
\t\t{ key: 'receipt_present', status: 'passed' },
\t\t{ key: 'meal_limit', status: 'warning', limit: 35 },
\t\t{ key: 'project_required', status: 'passed' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Architecture" title="Production boundaries">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Evidence adapters</h3>
						<p class="mt-2">Replace the deterministic camera, upload, email, card, and accounting adapters with signed provider calls. Retain source IDs, checksums, timestamps, and the original receipt asset.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Server authority</h3>
						<p class="mt-2">Keep policy rules, accounting mappings, approver selection, payout routing, and revision checks on the server. The UI explains decisions and submits intentions; it does not manufacture them.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Durable storage</h3>
						<p class="mt-2">Move the in-memory state to expenses, evidence, decisions, audit events, and settlement tables. Use idempotency keys and an outbox for provider delivery and webhook reconciliation.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
