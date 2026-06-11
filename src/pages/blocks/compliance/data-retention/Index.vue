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
			tagline="A responsive compliance workspace for configuring data lifecycle rules, legal holds, deletion previews, and audit-ready policy changes."
			tag="Admin UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Compliance" title="Data retention policy center">
				<Example
					:source="DataRetentionPolicyCenterSrc"
					filename="DataRetentionPolicyCenter.vue"
					presentation="iframe"
					frame-src="/blocks/compliance/data-retention/preview/DataRetentionPolicyCenter"
					description="Copy this into a workspace admin, privacy console, security settings page, or internal compliance tool. Replace the local arrays with your data classes, retention rules, legal holds, deletion jobs, and audit events."
					default-open
					:preview-lines="14"
				>
					<DataRetentionPolicyCenter />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when customers need visible control over how long product data is kept before archive, anonymization, or deletion.
						It is shaped for B2B SaaS, healthcare operations, fintech admin, analytics products, and any app where retention decisions need reviewable safety checks.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>dataClasses</code> with backend-defined data domains such as messages, files, audit logs, support tickets, or analytics events.</li>
						<li>Persist rule updates through a policy version endpoint, then recalculate deletion previews on the server before enabling publish.</li>
						<li>Keep legal holds as separate records that override lifecycle actions until released by an authorized user.</li>
						<li>Wire the publish action to a confirmation dialog that lists affected records, next deletion window, active holds, and rollback policy.</li>
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
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Deletion previews</h3>
						<p class="mt-2">Calculate affected records on the server. Treat client totals as preview-only until a signed policy version is created.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Legal holds</h3>
						<p class="mt-2">Model holds independently from retention rules so litigation, abuse, fraud, or billing investigations can block deletion safely.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Good follow-ups include reusable policy diff viewers, approval routing, DPA export summaries, and deletion job monitors.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
