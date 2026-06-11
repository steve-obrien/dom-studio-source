<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import MobileApprovalQueue from './examples/MobileApprovalQueue.vue';
import MobileApprovalQueueSrc from './examples/MobileApprovalQueue.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Mobile Approval Queue Block"
			tagline="A copyable mobile-first approval flow for reviewing high-priority requests, checking policy context, and making auditable decisions from a bottom sheet."
			tag="Mobile workflow"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Approvals" title="Mobile approval queue">
				<Example
					:source="MobileApprovalQueueSrc"
					filename="MobileApprovalQueue.vue"
					presentation="iframe"
					frame-src="/blocks/operations/approvals/mobile-approval-queue/preview/MobileApprovalQueue"
					description="Copy this into finance, HR, procurement, IT admin, marketplace, field operations, or release management apps where managers need to approve requests quickly on mobile without losing policy context."
					default-open
					:preview-lines="18"
				>
					<MobileApprovalQueue />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when approval work happens away from a desk: expense exceptions, discount approvals, access changes, purchase requests, incident communications, vendor payouts, or production releases.
						The layout prioritizes one-handed triage with request cards, concise risk context, and a decision sheet that keeps approve, decline, and escalation actions close to the thumb zone.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>approvalRequests</code> with server-backed requests that include requester, business object, amount or scope, due time, risk, policy checks, and required evidence.</li>
						<li>Keep decision eligibility on the server. The client should display whether the current user can approve, decline, request changes, or escalate.</li>
						<li>Persist every action as an audit event with actor, device context, previous state, next state, note, and policy snapshot.</li>
						<li>Use push notifications or deep links to open a specific request, then hydrate the same payload for desktop review surfaces if deeper investigation is needed.</li>
						<li>Keep decline and escalation reasons structured so analytics can reveal broken policies, training gaps, or recurring request quality issues.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended approval payload">
				<CodeBlock lang="js" filename="mobile-approval-request.js" :code="`{
\tid: 'approval-mobile-724',
\ttype: 'expense_exception',
\ttitle: 'Client dinner exception',
\trequester: {
\t\tid: 'usr_maya',
\t\tname: 'Maya Chen',
\t\tteam: 'Enterprise Success'
\t},
\tstatus: 'pending',
\trisk: 'medium',
\tdueAt: '2026-06-11T17:00:00Z',
\tsummary: {
\t\tamount: 428,
\t\tcurrency: 'GBP',
\t\tobjectLabel: 'Northstar launch dinner',
\t\tpolicyDelta: 'GBP 78 above meal policy'
\t},
\tpolicyChecks: [
\t\t{ key: 'receipt', label: 'Receipt attached', status: 'passed' },
\t\t{ key: 'limit', label: 'Meal limit exceeded', status: 'warning' },
\t\t{ key: 'customer', label: 'Customer attendee listed', status: 'passed' }
\t],
\tevidence: [
\t\t{ label: 'Receipt', value: 'Dinner-receipt.jpg' },
\t\t{ label: 'Opportunity', value: 'Northstar expansion' }
\t],
\tallowedActions: ['approve', 'decline', 'escalate']
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Mobile action safety</h3>
						<p class="mt-2">Require an explicit review state before approval on high-risk requests. Keep irreversible actions behind a server confirmation or one-time token.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Notification routing</h3>
						<p class="mt-2">Store deep-link targets by request id and queue filter so push notifications can open the right card while preserving the approver context.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include swipe gestures, delegated approvals, biometric re-auth, offline decision drafts, and reusable policy-check chips.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
