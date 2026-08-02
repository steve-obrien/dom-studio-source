<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import DataRetentionPolicyCenter from './examples/DataRetentionPolicyCenter.vue';
import DataRetentionPolicyCenterSrc from './examples/DataRetentionPolicyCenter.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Data Retention Block"
			tagline="A Google Vault- and AWS lifecycle-inspired control plane with working policy, legal-hold, approval, and publishing APIs."
			tag="Working API"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Compliance" title="Data retention policy center">
				<Example
					:source="DataRetentionPolicyCenterSrc"
					filename="DataRetentionPolicyCenter.vue"
					presentation="iframe"
					frame-src="/blocks/compliance/data-retention/preview/DataRetentionPolicyCenter"
					description="Use the complete control plane as a workspace admin, privacy console, or internal compliance section. The example already reads and mutates process-local policy, legal-hold, approval, publication, and run-history APIs."
					default-open
					:preview-lines="14"
				>
					<DataRetentionPolicyCenter />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="Working API included">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when customers need visible control over how long product data is kept before archive, anonymization, or deletion. Its included API supports server-calculated impact, optimistic revisions, approvals, publication proof, legal-hold creation and release, and reload persistence for the lifetime of the demo process.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/data-retention/bootstrap</code> supplies environments, data classes, rich select options, user context, and active legal holds.</li>
						<li>Policy endpoints calculate impact, save revisioned drafts, record Security approval, and return signed publication evidence.</li>
						<li>Legal-hold endpoints validate creation and release, then recalculate affected lifecycle totals.</li>
						<li>Replace the process-local store with durable policy and hold tables, authorization checks, and background deletion jobs in production.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended policy shape">
				<CodeBlock lang="js" filename="retention-policy.js" :code="`{
\tid: 'policy_customer_messages',
\tworkspaceId: 'wrk_123',
\tdataClass: 'Customer messages',
\tenvironment: 'Production',
\tretentionDays: 365,
\taction: 'anonymize',
\tarchiveAfterDays: 180,
\tlegalHoldIds: ['hold_enterprise_dispute'],
\tdeletePreview: {
\t\trecords: 18420,
\t\tfirstRunAt: '2026-06-17T02:00:00Z',
\t\tblockedByHolds: 240
\t},
\treview: {
\t\tstatus: 'ready',
\t\towner: 'Priya Shah',
\t\tapprovedBy: ['Security', 'Legal']
\t},
\tauditEvents: [
\t\t{ label: 'Retention changed to 365 days', actor: 'Priya Shah', time: 'Today 10:18' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Deletion previews</h3>
						<p class="mt-2">Calculate affected records on the server. Treat client totals as preview-only until a signed policy version is created.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Legal holds</h3>
						<p class="mt-2">Model holds independently from retention rules so litigation, abuse, fraud, or billing investigations can block deletion safely.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Production follow-ups include durable revision history, policy diff viewers, role-based approval routing, queued lifecycle jobs, and DPA export summaries.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
