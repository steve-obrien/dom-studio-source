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
			tagline="A responsive SaaS admin surface for quota configuration, overage policy, customer exceptions, alerting, and billing guardrails."
			tag="Monetization UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Monetization" title="Usage limit manager">
				<Example
					:source="UsageLimitManagerSrc"
					filename="UsageLimitManager.vue"
					presentation="iframe"
					frame-src="/blocks/monetization/usage-limits/preview/UsageLimitManager"
					description="Copy this into a billing admin, plan settings page, customer success console, or internal revenue operations tool. Replace the local plan, meter, exception, and audit arrays with your product usage API data."
					default-open
					:preview-lines="14"
				>
					<UsageLimitManager />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when your product sells metered usage and admins need a clear place to set limits before customers hit billing or service surprises.
						It works for AI credits, workflow runs, seats, storage, messages, API requests, and other product meters.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>plans</code> with plan or workspace records from your billing and entitlement service.</li>
						<li>Replace <code>meters</code> with server-defined usage meters so labels, units, hard caps, and reset windows stay consistent.</li>
						<li>Persist limit edits through a policy endpoint that validates plan maximums, customer overrides, and billing permissions.</li>
						<li>Connect exception rows to customer success approvals so temporary increases have owners, expiry dates, and audit history.</li>
						<li>Send alert thresholds to your notification system so account owners get warnings before usage is blocked or charged.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended limit policy shape">
				<CodeBlock lang="js" filename="usage-limit-policy.js" :code="`{
\tworkspaceId: 'wrk_northstar',
\tplanId: 'growth',
\tmeter: 'workflow_runs',
\tunit: 'runs',
\tperiod: 'monthly',
\tlimit: 120000,
\tsoftLimit: 96000,
\toveragePolicy: 'charge',
\toverageRate: 0.008,
\tgracePeriodHours: 24,
\talerts: {
\t\tenabled: true,
\t\tthresholds: [80, 95, 100],
\t\trecipients: ['owner', 'billing_admin']
\t},
\texceptions: [
\t\t{
\t\t\tcustomerId: 'cus_arcadia',
\t\t\tlimit: 180000,
\t\t\texpiresAt: '2026-07-01',
\t\t\tapprovedBy: 'Revenue ops'
\t\t}
\t],
\tauditEvents: [
\t\t{ label: 'Workflow run limit raised', actor: 'Maya Chen', time: 'Today 11:20' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Entitlements</h3>
						<p class="mt-2">Treat the UI value as a draft until the backend confirms the plan cap, override scope, and billing authorization.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Customer safety</h3>
						<p class="mt-2">Show soft limits, hard limits, alert thresholds, and grace windows together so teams understand the user impact of each rule.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include reusable meter charts, entitlement diff previews, approval routing, and forecast-based limit suggestions.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
