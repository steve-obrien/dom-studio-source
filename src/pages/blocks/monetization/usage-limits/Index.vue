<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import UsageLimitManager from './examples/UsageLimitManager.vue';
import UsageLimitManagerSrc from './examples/UsageLimitManager.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Usage Limits Block"
			tagline="A working usage-governance section for forecasting customer impact, editing enforcement policy, proving alert delivery, approving exceptions, and publishing one versioned runtime contract."
			tag="API-backed governance"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Monetization" title="Usage limit manager">
				<Example
					:source="UsageLimitManagerSrc"
					filename="UsageLimitManager.vue"
					presentation="iframe"
					frame-src="/blocks/monetization/usage-limits/preview/UsageLimitManager"
					description="Use this Vercel- and Stripe-inspired operations section when product, finance, and customer teams need one auditable path from a metered policy edit to runtime enforcement."
					default-open
					:preview-lines="18"
				>
					<UsageLimitManager />
				</Example>
			</DocSection>

			<DocSection eyebrow="Working journey" title="What this example proves">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The example is a complete repository-local application section, not a client-only quota screenshot. It loads one server-owned policy workspace and keeps the exact revision attached to impact, notification, approval, validation, and release evidence.
					</p>
					<ol class="list-decimal space-y-2 pl-5">
						<li>Select a plan and meter, then edit its hard limit, warning threshold, enforcement action, grace window, approval rule, and notification channels.</li>
						<li>Save with optimistic revision protection and calculate server-owned account, forecast, billing, and interruption impact.</li>
						<li>Send a safe threshold test through the configured channels and bind the delivery receipt to the saved revision.</li>
						<li>Request and decide finance approval when an edit crosses a manual guardrail or can interrupt customer usage.</li>
						<li>Create independently revisioned customer exceptions with owners, expiry dates, reasons, and approval decisions.</li>
						<li>Run authoritative checks, acknowledge customer impact, publish an immutable receipt, and advance the usage gateway, billing meter, and notifications to version 6.</li>
					</ol>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local contract">
				<CodeBlock lang="txt" filename="usage-limits-endpoints.txt" :code="`GET   /api/block-demos/usage-limits/bootstrap
PATCH /api/block-demos/usage-limits/policies/:planId/:meterId
POST  /api/block-demos/usage-limits/impact
POST  /api/block-demos/usage-limits/notifications
POST  /api/block-demos/usage-limits/approvals/request
POST  /api/block-demos/usage-limits/approvals/:approvalId/decision
POST  /api/block-demos/usage-limits/validate
POST  /api/block-demos/usage-limits/exceptions
POST  /api/block-demos/usage-limits/exceptions/:exceptionId/decision
POST  /api/block-demos/usage-limits/publish
POST  /api/block-demos/usage-limits/advance
POST  /api/block-demos/usage-limits/reset`" />
			</DocSection>

			<DocSection eyebrow="Production boundary" title="What to replace in a real application">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Durable policy storage</h3>
						<p class="mt-2">The demo store is process-local and deterministic. Replace it with transactional policy versions, authorization, durable audit events, and persisted optimistic revisions.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Usage and billing authority</h3>
						<p class="mt-2">Replace the deterministic forecast and receipts with your usage ledger, billing provider, notification service, customer ownership, and finance approval systems.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Enforcement rollout</h3>
						<p class="mt-2">Replace the deterministic worker steps with queued, idempotent propagation and reconciliation across the gateway, billing meter, notifications, rollback tooling, and incident monitoring.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
