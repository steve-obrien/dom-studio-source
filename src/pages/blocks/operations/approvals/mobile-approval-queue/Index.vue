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
			tagline="A working mobile approvals app for triaging tasks, evaluating policy, recovering evidence, verifying a trusted device, and recording auditable decisions."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Approvals" title="Mobile approval queue">
				<Example
					:source="MobileApprovalQueueSrc"
					filename="MobileApprovalQueue.vue"
					presentation="iframe"
					frame-src="/blocks/operations/approvals/mobile-approval-queue/preview/MobileApprovalQueue"
					description="This deterministic API-backed example behaves as a focused mobile task inbox and a wider desktop review workspace. Run policy, request missing evidence, verify the demo device, approve with a receipt, undo the decision, or route regulated work to a specialist."
					default-open
					:preview-lines="18"
				>
					<MobileApprovalQueue />
				</Example>
			</DocSection>

			<DocSection eyebrow="Journey" title="What is working">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when approval work must remain useful away from a desk without turning into a reduced screenshot of the desktop product.
						The responsive app keeps the mobile Tasks inbox focused, then adds queue and context rails when the iframe or expanded viewer has room.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Filter a live queue with rich <code>DomSelect</code> controls and open the same request in a focused mobile detail or split desktop workspace.</li>
						<li>Inspect checksummed evidence, requester context, policy route, risk, business impact, and the immutable activity payload.</li>
						<li>Run a server-owned policy evaluation with exact-revision conflict protection before any approval can be recorded.</li>
						<li>Complete the deterministic six-digit trusted-device challenge, then submit a structured reason, note, and acknowledgement.</li>
						<li>Undo an eligible decision, request missing evidence and simulate its recovery, or escalate work outside the finance reviewer’s authority.</li>
						<li>Reload without losing state, reset the complete journey, and receive actionable 401, 403, 404, 409, and 422 API errors.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Example endpoints">
				<CodeBlock lang="txt" filename="mobile-approval-queue-api.txt" :code="`GET  /api/block-demos/mobile-approval-queue/bootstrap
POST /api/block-demos/mobile-approval-queue/reset

POST /api/block-demos/mobile-approval-queue/requests/:requestId/evaluate
POST /api/block-demos/mobile-approval-queue/requests/:requestId/challenge
POST /api/block-demos/mobile-approval-queue/requests/:requestId/verify
POST /api/block-demos/mobile-approval-queue/requests/:requestId/decision
POST /api/block-demos/mobile-approval-queue/requests/:requestId/undo
POST /api/block-demos/mobile-approval-queue/requests/:requestId/evidence

// Every state-changing request carries the exact request revision.
// Device tokens are request-bound and single-use.
// Decision receipts retain policy, evidence, actor, and device context.`" />
			</DocSection>

			<DocSection eyebrow="Production" title="Integration boundaries">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Policy authority</h3>
						<p class="mt-2">Replace the in-memory evaluator with your authorization and policy service. Reviewer scope, separation of duties, and routes must remain server-owned.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Identity and step-up</h3>
						<p class="mt-2">Replace the visible demo code with a passkey, platform biometric, or identity-provider session. Bind the result to actor, device, request, and expiry.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Durable delivery</h3>
						<p class="mt-2">Persist the event ledger and receipt in durable storage, send notifications through a provider, and enforce undo windows against server time and settlement state.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
