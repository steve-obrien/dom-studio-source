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
			tagline="A responsive operations console for selecting records, previewing impact, satisfying safety checks, and executing admin changes."
			tag="Operations UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations" title="Bulk action review console">
				<Example
					:source="BulkActionReviewConsoleSrc"
					filename="BulkActionReviewConsole.vue"
					presentation="iframe"
					frame-src="/blocks/operations/bulk-actions/preview/BulkActionReviewConsole"
					description="Copy this into an admin table, customer operations workspace, lifecycle automation screen, or support back office. Replace the local account, action, check, and activity arrays with your own records and workflow policy."
					default-open
					:preview-lines="14"
				>
					<BulkActionReviewConsole />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when an operator needs to make the same sensitive change to many records at once.
						It fits customer lifecycle tools, user administration, billing operations, moderation queues, CRM cleanup, and data governance screens.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>accounts</code> with records from the table or segment your operator is acting on.</li>
						<li>Replace <code>bulkActions</code> with server-approved operations, including whether each action needs approval, notes, or a dry run.</li>
						<li>Calculate <code>safetyChecks</code> on the server from permissions, billing impact, customer state, and irreversible side effects.</li>
						<li>Submit the selected IDs, action ID, reason, notification preference, and dry-run flag to a queued job endpoint.</li>
						<li>Refresh activity from your job system so partial failures, retries, approvals, and audit events remain visible after execution.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended bulk job payload">
				<CodeBlock lang="js" filename="bulk-action-job.js" :code="`{
\tworkspaceId: 'wrk_ops',
\taction: 'pause_billing',
\trecordType: 'account',
\trecordIds: ['acct_arcadia', 'acct_harbor', 'acct_northstar'],
\tmode: 'queued',
\tdryRun: true,
\treason: 'Customer success cleanup after contract review',
\tnotifyCustomers: false,
\trequiresApproval: true,
\tsafetyChecks: [
\t\t{ id: 'permission', status: 'passed', label: 'Operator can manage billing' },
\t\t{ id: 'balance', status: 'warning', label: '2 accounts have open invoices' },
\t\t{ id: 'audit', status: 'passed', label: 'Reason is captured for audit' }
\t],
\testimatedImpact: {
\t\trecords: 3,
\t\tmonthlyRevenuePaused: 12840,
\t\tcustomersNotified: 0
\t},
\tauditEvents: [
\t\t{ label: 'Dry run generated', actor: 'Avery Stone', time: 'Today 14:10' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Safety checks</h3>
						<p class="mt-2">Keep irreversible actions behind server-side policy checks, required reasons, dry runs, and approval states.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Job handling</h3>
						<p class="mt-2">Run execution through a background queue so progress, partial failure, retry, and cancellation states are visible.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include reusable selection toolbars, job progress timelines, approval routing, and rollback previews.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
