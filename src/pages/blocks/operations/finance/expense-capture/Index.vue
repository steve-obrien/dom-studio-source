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
			tagline="A copyable mobile-first flow for reviewing receipts, editing extracted spend details, resolving policy checks, and submitting reimbursement."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Finance" title="Receipt capture flow">
				<Example
					:source="ExpenseCaptureFlowSrc"
					filename="ExpenseCaptureFlow.vue"
					presentation="iframe"
					frame-src="/blocks/operations/finance/expense-capture/preview/ExpenseCaptureFlow"
					description="Copy this into spend management, HR, marketplace, field service, or operations apps that need a fast expense submission pattern with receipt evidence and policy feedback."
					default-open
					:preview-lines="20"
				>
					<ExpenseCaptureFlow />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when users need to capture a receipt on mobile, confirm OCR results, and submit spend for reimbursement or company-card reconciliation.
						The flow keeps the receipt, extracted fields, project coding, policy checks, and final submit action close together so users can finish the task in one pass.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Hydrate the extracted merchant, total, date, tax, and currency from your OCR or card transaction matching service, then keep user edits as explicit overrides.</li>
						<li>Run policy checks on the server whenever amount, category, project, attendees, or reimbursable status changes. The UI should display results, not own the policy rules.</li>
						<li>Store the receipt asset separately from the expense record so upload retries, virus scanning, and audit retention can happen without blocking field edits.</li>
						<li>Model reimbursement and corporate-card expenses with the same payload, but use payment method and reimbursable flags to route them to the right ledger workflow.</li>
						<li>Keep the bottom action area sticky on mobile. Users should always see whether the expense is ready and what remains before submit.</li>
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

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Receipt pipeline</h3>
						<p class="mt-2">Treat upload, OCR, duplicate detection, and transaction matching as asynchronous jobs. Show confidence and missing fields without making the user wait for every enrichment step.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Policy checks</h3>
						<p class="mt-2">Return structured checks with severity, message, and blocking status. This lets the same rule engine serve mobile capture, manager approval, and finance audit screens.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include attendee split entry, mileage capture, duplicate receipt review, receipt crop tools, manager approval cards, and accounting export status.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
