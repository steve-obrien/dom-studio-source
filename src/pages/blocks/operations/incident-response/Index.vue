<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import IncidentCommandCenter from './examples/IncidentCommandCenter.vue';
import IncidentCommandCenterSrc from './examples/IncidentCommandCenter.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Incident Response Block"
			tagline="A copyable incident command center for production incidents, on-call handoffs, customer communications, and post-incident accountability."
			tag="Operations UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Reliability" title="Incident command center">
				<Example
					:source="IncidentCommandCenterSrc"
					filename="IncidentCommandCenter.vue"
					presentation="iframe"
					frame-src="/blocks/operations/incident-response/preview/IncidentCommandCenter"
					description="Copy this into SaaS admin consoles, internal tools, infrastructure products, support operations, or status-page workflows where teams need one place to coordinate an active incident."
					default-open
					:preview-lines="20"
				>
					<IncidentCommandCenter />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when your product needs a practical incident workspace instead of scattered chat messages, tickets, and status-page drafts.
						It keeps severity, ownership, impacted services, customer communications, mitigation tasks, and timeline events visible for both engineering and customer-facing teams.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Load incident records from your incident API with severity, status, commander, affected services, customer impact, task ownership, and timeline events.</li>
						<li>Connect service health to your monitoring provider so affected components and current metrics update independently from the written incident narrative.</li>
						<li>Persist each status update with audience, author, timestamp, delivery channels, and acknowledgement state before sending it to a public status page or customer email list.</li>
						<li>Keep severity transitions, task completions, and customer communications as immutable audit events so postmortems can reconstruct what happened.</li>
						<li>Gate public updates, severity downgrades, and resolution behind permission checks when the incident affects enterprise customers or regulated systems.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended incident payload">
				<CodeBlock lang="js" filename="incident-record.js" :code="`{
\tid: 'inc_2048',
\ttitle: 'Elevated checkout API errors',
\tseverity: 'SEV-2',
\tstatus: 'Mitigating',
\tcommander: 'Maya Chen',
\tstartedAt: '2026-06-10T15:42:00Z',
\tcustomerImpact: {
\t\taccountsAffected: 128,
\t\tregions: ['us-east-1', 'eu-west-1'],
\t\tsummary: 'Checkout creation intermittently returns 502 responses.'
\t},
\tservices: [
\t\t{ key: 'checkout_api', name: 'Checkout API', state: 'Degraded', errorRate: 7.8 },
\t\t{ key: 'billing_worker', name: 'Billing worker', state: 'Operational', errorRate: 0.2 }
\t],
\ttasks: [
\t\t{ id: 'task_1', owner: 'API on-call', label: 'Roll back gateway release', status: 'Done' },
\t\t{ id: 'task_2', owner: 'Support lead', label: 'Notify enterprise accounts', status: 'In progress' }
\t],
\tupdateDraft: {
\t\taudience: 'Public status page',
\t\tmessage: 'We are mitigating elevated checkout API errors and will update again in 20 minutes.'
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Incident model</h3>
						<p class="mt-2">Separate incident state from service health. Monitoring updates can change service rows while commanders keep narrative updates deliberate and reviewed.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Communication safety</h3>
						<p class="mt-2">Require audience, next-update timing, and approval status before publishing public updates or broad customer notifications.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Good follow-ups include status-page channel pickers, PagerDuty/Opsgenie sync, postmortem templates, SLA impact calculators, and runbook launchers.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
