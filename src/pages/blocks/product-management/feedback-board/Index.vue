<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import FeedbackBoardWorkspace from './examples/FeedbackBoardWorkspace.vue';
import FeedbackBoardWorkspaceSrc from './examples/FeedbackBoardWorkspace.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Feedback Board Block"
			tagline="A responsive product feedback workspace for collecting requests, measuring customer demand, assigning status, and planning roadmap follow-up."
			tag="Product UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Product management" title="Feedback board workspace">
				<Example
					:source="FeedbackBoardWorkspaceSrc"
					filename="FeedbackBoardWorkspace.vue"
					presentation="iframe"
					frame-src="/blocks/product-management/feedback-board/preview/FeedbackBoardWorkspace"
					description="Copy this into product portals, internal roadmap tools, customer success workspaces, or admin dashboards. Replace the local request, segment, voter, and activity arrays with your feedback API and CRM data."
					default-open
					:preview-lines="14"
				>
					<FeedbackBoardWorkspace />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when users, sales teams, support teams, or customer success teams need a shared place to capture product requests and turn them into actionable roadmap decisions.
						It is shaped for public feedback boards, private customer portals, product operations dashboards, and founder-led SaaS backlogs.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>requests</code> with feature request records from your product feedback, CRM, or support system.</li>
						<li>Connect vote counts to authenticated users or customer accounts so demand can be segmented by plan, revenue, persona, or region.</li>
						<li>Persist <code>status</code>, <code>owner</code>, <code>priority</code>, and <code>roadmapWindow</code> through a product operations endpoint with audit events.</li>
						<li>Wire comment and activity rows to customer-facing updates so voters can be notified when a request changes status.</li>
						<li>Use the segment tabs to scope demand by account type, customer health, plan tier, or strategic opportunity size.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended feedback request shape">
				<CodeBlock lang="js" filename="feedback-request.js" :code="`{
\tid: 'req_audit_exports',
\ttitle: 'Export audit logs to CSV',
\tstatus: 'Under review',
\tpriority: 'High',
\troadmapWindow: 'Next quarter',
\towner: 'Product ops',
\tcategory: 'Compliance',
\tcreatedAt: '2026-06-10T10:20:00Z',
\tvotes: {
\t\ttotal: 184,
\t\taccounts: 43,
\t\trevenueInfluenced: 92000,
\t\tcurrentUserVoted: true
\t},
\tsegments: ['Enterprise', 'Security teams'],
\tlinkedSignals: [
\t\t{ source: 'Support', count: 18 },
\t\t{ source: 'Sales', count: 7 }
\t],
\tupdates: [
\t\t{ label: 'Moved to under review', actor: 'Maya Chen', time: 'Today 10:20' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Demand quality</h3>
						<p class="mt-2">Store both raw votes and account-weighted demand so consumer volume does not hide strategic customer value.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Roadmap hygiene</h3>
						<p class="mt-2">Treat status changes as auditable decisions with owners, reasons, customer visibility, and notification behavior.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include duplicate request merging, changelog publishing, customer impact scoring, and Jira or Linear sync.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
