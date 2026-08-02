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
			tagline="A working incident command room with provider evidence, accountable response actions, reviewed customer communications, and a guarded resolution lifecycle."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Reliability" title="Incident command center">
				<Example
					:source="IncidentCommandCenterSrc"
					filename="IncidentCommandCenter.vue"
					presentation="iframe"
					frame-src="/blocks/operations/incident-response/preview/IncidentCommandCenter"
					description="A PagerDuty-, Statuspage-, and Rootly-inspired command room that lets responders assign command roles, complete mitigation actions, refresh provider evidence, publish an acknowledged update, and resolve from retained proof."
					default-open
					:preview-lines="20"
				>
					<IncidentCommandCenter />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="Working repository-local API">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The example calls real repository-local endpoints backed by deterministic process memory. Server code owns the workspace revision, incident version, role constraints, readiness checks, communication checksum, lifecycle gates, provider-style receipts, and reload persistence.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/incident-response/bootstrap</code> returns the incident queue, selected command room, catalogs, capabilities, and current exact revisions.</li>
						<li><code>POST /select</code>, <code>/declare</code>, and <code>/incidents/:id/command</code> create and coordinate accountable response rooms.</li>
						<li>Action and monitoring endpoints record mitigation receipts and independent provider observations instead of mutating a client fixture.</li>
						<li>Preview and publish endpoints bind acknowledgement to one exact message, audience, metric snapshot, and checksum before issuing delivery receipts.</li>
						<li>The status endpoint enforces mitigation, monitoring, two stable samples, customer communication, and final acknowledgement before resolution.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Exact mutation contract">
				<CodeBlock lang="js" filename="publish-incident-update.js" :code="`await fetch('/api/block-demos/incident-response/incidents/inc_2048/updates/publish', {
	method: 'POST',
	headers: { 'content-type': 'application/json' },
	body: JSON.stringify({
		revision: 87,
		incidentVersion: 15,
		previewChecksum: 'sha256:demo-4ea955d0',
		acknowledged: true
	})
});

// Returns authoritative state plus immutable delivery evidence.
// Stale workspace or incident versions return HTTP 409.`" />
			</DocSection>

			<DocSection eyebrow="Production" title="Adapter boundaries">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Durable incident store</h3>
						<p class="mt-2">Replace process memory with your database and transaction boundary while retaining exact workspace and incident revisions for conflict detection.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Provider adapters</h3>
						<p class="mt-2">Map monitoring, bridge, paging, status-page, email, and postmortem providers behind idempotent commands that retain their external receipts.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Identity and policy</h3>
						<p class="mt-2">Resolve actors from the authenticated session, authorize every mutation, and move severity, audience, escalation, and resolution requirements into organization policy.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
