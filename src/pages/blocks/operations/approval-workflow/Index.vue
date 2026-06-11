<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import ApprovalWorkflowConsole from './examples/ApprovalWorkflowConsole.vue';
import ApprovalWorkflowConsoleSrc from './examples/ApprovalWorkflowConsole.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Approval Workflow Block"
			tagline="A copyable approval console for reviewing sensitive changes, checking policy requirements, collecting approver sign-off, and leaving an auditable decision trail."
			tag="Operations UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations" title="Approval workflow console">
				<Example
					:source="ApprovalWorkflowConsoleSrc"
					filename="ApprovalWorkflowConsole.vue"
					presentation="iframe"
					frame-src="/blocks/operations/approval-workflow/preview/ApprovalWorkflowConsole"
					description="Copy this into admin tools, finance portals, security consoles, launch review flows, HR systems, or any app where risky changes need structured review before they take effect. Replace the sample requests, policy checks, approvers, and audit events with your workflow API."
					default-open
					:preview-lines="18"
				>
					<ApprovalWorkflowConsole />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a user action should not immediately apply: plan upgrades, data exports, permission changes, production launches, refund exceptions, vendor payouts, or compliance overrides.
						The layout keeps the request queue, selected change, policy checks, approver status, decision controls, and activity history visible without forcing users through a modal-only flow.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Load pending requests with requester, object, impact, status, due time, risk level, and normalized change details.</li>
						<li>Render server-owned <code>policyChecks</code> so the UI can explain why a request is blocked, reviewable, or ready to approve.</li>
						<li>Persist approve, reject, request-changes, and escalation actions as workflow events with actor, note, previous status, and next status.</li>
						<li>Keep approver requirements server-side. The UI should show who has signed off, who is required next, and whether the current user can decide.</li>
						<li>Connect the activity stream to your audit log so high-risk decisions remain traceable for admins, customers, and compliance reviews.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended approval payload">
				<CodeBlock lang="js" filename="approval-workflow.js" :code="`{
\trequest: {
\t\tid: 'approval_req_4821',
\t\ttitle: 'Raise production API limit',
\t\trequester: 'Maya Chen',
\t\tteam: 'Enterprise Success',
\t\tstatus: 'Needs security',
\t\trisk: 'High',
\t\tdueAt: '2026-06-11T16:00:00Z'
\t},
\tchange: {
\t\tobject: 'Workspace northstar-bank',
\t\tfrom: '75,000 requests / month',
\t\tto: '250,000 requests / month',
\t\treason: 'Contracted launch traffic for mobile rollout'
\t},
\tapprovers: [
\t\t{ id: 'finance', name: 'Finance review', required: true, status: 'approved' },
\t\t{ id: 'security', name: 'Security review', required: true, status: 'waiting' }
\t],
\tpolicyChecks: [
\t\t{ id: 'contract', label: 'Contract value verified', status: 'passed' },
\t\t{ id: 'abuse', label: 'Abuse controls reviewed', status: 'warning' }
\t],
\tauditEvents: [
\t\t{ label: 'Finance approved', actor: 'Jon Bell', time: 'Today 12:18' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Workflow rules</h3>
						<p class="mt-2">Keep approval requirements, override rights, and escalation rules in your backend. The client should display eligibility, not define authority.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Decision quality</h3>
						<p class="mt-2">Require structured notes for rejection, escalation, or risky approvals. Show the exact change diff close to the primary action.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include reusable approval stepper components, diff viewers, SLA reminders, delegation rules, and bulk approval queues.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
