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
			tagline="A working decision inbox for claiming sensitive changes, evaluating server-owned policy, repairing evidence, delegating approval, and applying an immutable approved snapshot."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations" title="Approval workflow console">
				<Example
					:source="ApprovalWorkflowConsoleSrc"
					filename="ApprovalWorkflowConsole.vue"
					presentation="iframe"
					frame-src="/blocks/operations/approval-workflow/preview/ApprovalWorkflowConsole"
					description="The example is connected to a deterministic workflow API. Claim a request, run separation-of-duties and evidence checks, record a structured decision, and advance the approved snapshot through controlled execution."
					default-open
					:preview-lines="18"
				>
					<ApprovalWorkflowConsole />
				</Example>
			</DocSection>

			<DocSection eyebrow="Journey" title="What is working">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this section when a user action must be reviewed before it can affect production: plan upgrades, data exports, permission changes, launches, refunds, payouts, or compliance overrides.
						The request revision, policy result, decision, and execution snapshot are owned by the server so the interface cannot imply authority it does not have.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Claim ownership with exact-revision conflict protection before evaluating or deciding.</li>
						<li>Compare the exact configuration diff with checksummed evidence and a raw immutable manifest.</li>
						<li>Run server-owned evidence, reviewer-scope, separation-of-duties, approval-route, and execution-window checks.</li>
						<li>Recover a blocked export by verifying its missing DPA, or delegate a step to an eligible reviewer with an expiry and audit note.</li>
						<li>Record approve, request-changes, reject, or escalate decisions with structured reasons and explicit acknowledgement.</li>
						<li>Queue and advance the locked approval snapshot through gateway, monitoring, and audit-ledger surfaces to a provider-style receipt.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Example endpoints">
				<CodeBlock lang="txt" filename="approval-workflow-api.txt" :code="`GET  /api/block-demos/approval-workflow/bootstrap
POST /api/block-demos/approval-workflow/reset

POST /api/block-demos/approval-workflow/requests/:requestId/claim
POST /api/block-demos/approval-workflow/requests/:requestId/evaluate
POST /api/block-demos/approval-workflow/requests/:requestId/evidence
POST /api/block-demos/approval-workflow/requests/:requestId/delegate
POST /api/block-demos/approval-workflow/requests/:requestId/decision
POST /api/block-demos/approval-workflow/requests/:requestId/execute
POST /api/block-demos/approval-workflow/requests/:requestId/advance

// Every mutation includes the current revision.
// Stale writes return 409; invalid evidence or notes return 422.
// Missing requests return 404; separation-of-duties violations return 403.`" />
			</DocSection>

			<DocSection eyebrow="Production" title="Integration boundaries">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Policy authority</h3>
						<p class="mt-2">Replace the in-memory evaluator with your authorization and policy engine. Keep routes, quorum, overrides, and reviewer scope server-owned.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Durable evidence</h3>
						<p class="mt-2">Persist immutable input checksums, policy versions, actor identity, decisions, and execution receipts in an append-only audit store.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Real execution</h3>
						<p class="mt-2">Send the locked snapshot to an idempotent worker, require provider callbacks, and reconcile the gateway, monitoring, and audit surfaces before reporting success.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
