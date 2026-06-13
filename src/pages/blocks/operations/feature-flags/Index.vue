<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import FeatureFlagConsole from './examples/FeatureFlagConsole.vue';
import FeatureFlagConsoleSrc from './examples/FeatureFlagConsole.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Feature Flags Block"
			tagline="A copyable release operations console for controlling feature rollouts, targeting customer segments, and watching safety metrics before a launch goes broad."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations" title="Feature flag rollout console">
				<Example
					:source="FeatureFlagConsoleSrc"
					filename="FeatureFlagConsole.vue"
					presentation="iframe"
					frame-src="/blocks/operations/feature-flags/preview/FeatureFlagConsole"
					description="Copy this into product operations tools, admin portals, developer platforms, experimentation dashboards, or internal release consoles. Replace the sample flags, environments, and guardrails with your feature-management API."
					default-open
					:preview-lines="20"
				>
					<FeatureFlagConsole />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when product, engineering, or customer-success teams need to release functionality gradually.
						It combines flag selection, environment state, rollout percentage, audience targeting, safety checks, and recent activity in one responsive surface.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Load flags from your feature-management service with environment-specific state, rollout percentage, rules, owners, and last evaluation time.</li>
						<li>Submit rollout changes through a reviewed mutation that records the actor, reason, environment, previous value, and new value.</li>
						<li>Keep targeting rules server-owned. Let the UI edit normalized rule drafts, then validate them against your API before enabling production traffic.</li>
						<li>Connect guardrail metrics to observability data such as error rate, conversion, latency, support tickets, and experiment exposure volume.</li>
						<li>Gate production enablement behind approvals, change windows, incident status, or customer contract rules when your release policy requires it.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended flag payload">
				<CodeBlock lang="js" filename="feature-flag-rollout.js" :code="`{
\tflag: {
\t\tkey: 'checkout.wallet_express',
\t\tname: 'Express wallet checkout',
\t\towner: 'Growth engineering',
\t\tstatus: 'Monitoring',
\t\tenvironment: 'production',
\t\trollout: 32,
\t\tupdatedAt: '2026-06-10T12:20:00Z'
\t},
\ttargeting: {
\t\tsegments: ['Beta customers', 'EU workspaces'],
\t\texcludeSegments: ['Enterprise contracts'],
\t\trules: [
\t\t\t{ attribute: 'plan', operator: 'in', value: ['Growth', 'Scale'] },
\t\t\t{ attribute: 'workspace_age_days', operator: 'greater_than', value: 14 }
\t\t]
\t},
\tguardrails: {
\t\terrorRate: 0.18,
\t\tp95LatencyMs: 184,
\t\tconversionLift: 4.7,
\t\texposureCount: 12840
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Release safety</h3>
						<p class="mt-2">Write every rollout change to an audit trail and make rollback a first-class action. Production flags should never depend on client-only state.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Rule validation</h3>
						<p class="mt-2">Validate segment size, attribute names, and mutually exclusive rules before saving. Show estimated audience impact near the save action.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">A reusable rule builder, approval workflow drawer, experiment result panel, and flag dependency graph would make this block stronger for larger teams.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
