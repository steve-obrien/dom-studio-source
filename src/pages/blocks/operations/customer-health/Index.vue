<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import CustomerHealthWorkspace from './examples/CustomerHealthWorkspace.vue';
import CustomerHealthWorkspaceSrc from './examples/CustomerHealthWorkspace.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Customer Health Block"
			tagline="A responsive customer success workspace for account health, renewal risk, adoption signals, executive context, and next-best actions."
			tag="Operations UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Customer success" title="Customer health workspace">
				<Example
					:source="CustomerHealthWorkspaceSrc"
					filename="CustomerHealthWorkspace.vue"
					presentation="iframe"
					frame-src="/blocks/operations/customer-health/preview/CustomerHealthWorkspace"
					description="Copy this into a customer success, sales, account management, or admin product. Replace the sample accounts with CRM, billing, support, usage, NPS, and lifecycle data."
					default-open
					:preview-lines="14"
				>
					<CustomerHealthWorkspace />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a team needs to understand account health quickly and decide what to do next.
						The workspace keeps renewal status, product adoption, support pressure, executive signals, and action planning visible without requiring users to jump across CRM, billing, analytics, and ticketing tools.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>accounts</code> with customer records from your CRM or workspace table, including ARR, owner, lifecycle stage, renewal date, and health score.</li>
						<li>Connect product adoption metrics to your analytics warehouse so seat activation, feature use, integrations, and key workflow completion update automatically.</li>
						<li>Feed support pressure from ticket volume, severity, SLA breaches, sentiment, and unresolved escalations.</li>
						<li>Send next-best actions to your task system, CRM activity feed, or customer success platform when an owner schedules a review or starts a save plan.</li>
						<li>Keep the risk explanation human-readable so customer-facing teams can trust why a score changed and what to inspect first.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended account health shape">
				<CodeBlock lang="js" filename="customer-health.js" :code="`{
\taccountId: 'acct_zephyr',
\tname: 'Zephyr Health',
\towner: 'Maya Patel',
\tsegment: 'Enterprise',
\tarr: 184000,
\trenewalDate: '2026-09-18',
\thealth: {
\t\tscore: 74,
\t\ttrend: -8,
\t\tstatus: 'At risk',
\t\tdrivers: [
\t\t\t{ key: 'adoption', label: 'Core workflow adoption dropped 12%', severity: 'warning' },
\t\t\t{ key: 'support', label: 'Two unresolved P1 tickets', severity: 'danger' }
\t\t]
\t},
\tusage: {
\t\tactiveSeats: 118,
\t\tlicensedSeats: 180,
\t\tweeklyActiveTeams: 9,
\t\tintegrationCount: 4
\t},
\tnextActions: [
\t\t{ id: 'exec-review', label: 'Book executive business review', done: false },
\t\t{ id: 'ticket-review', label: 'Review support escalation plan', done: true }
\t],
\tactivity: [
\t\t{ type: 'Call', body: 'Champion asked for rollout guidance.', at: 'Jun 09, 2026' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Scoring model</h3>
						<p class="mt-2">Expose both the score and its drivers. Operators need the reason behind a health change more than a decorative number.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Action workflow</h3>
						<p class="mt-2">Treat tasks as synced records with owners, due dates, completion state, and CRM notes rather than local UI-only checkboxes.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include reusable health score badges, account timeline filters, renewal forecast charts, playbook templates, and CRM sync status components.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
