<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import AuditLogExplorer from './examples/AuditLogExplorer.vue';
import AuditLogExplorerSrc from './examples/AuditLogExplorer.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Audit Log Explorer Block"
			tagline="A copyable enterprise audit trail for filtering security events, reviewing request metadata, and exporting compliance evidence."
			tag="Admin UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Compliance" title="Audit log explorer">
				<Example
					:source="AuditLogExplorerSrc"
					filename="AuditLogExplorer.vue"
					presentation="iframe"
					frame-src="/blocks/compliance/audit/audit-log-explorer/preview/AuditLogExplorer"
					description="Copy this into B2B SaaS, developer tools, admin consoles, AI products, marketplaces, fintech apps, or any app that needs customer-visible audit events."
					default-open
					:preview-lines="18"
				>
					<AuditLogExplorer />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when admins, security teams, or customer success teams need to inspect who changed what, when it happened,
						which resource was affected, and whether the event needs retention for a compliance export.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace the local <code>auditEvents</code> array with server-paginated events from your audit, access, billing, or security API.</li>
						<li>Keep immutable event ids, actor identity, action, resource, IP address, user agent, request id, outcome, and environment in the stored record.</li>
						<li>Use cursor pagination and backend filtering for production data. The example filters locally only to keep the block copyable.</li>
						<li>Gate export actions behind role checks, date-range limits, and an export job endpoint that writes an audit event for the export itself.</li>
						<li>Preserve raw metadata as structured JSON so support and security teams can investigate without losing provider-specific context.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended audit event payload">
				<CodeBlock lang="js" filename="audit-event.js" :code="`{
\tid: 'evt_84201',
\tworkspaceId: 'wrk_123',
\tenvironment: 'Production',
\taction: 'member.role.updated',
\tcategory: 'Access',
\tseverity: 'High',
\toutcome: 'Success',
\tactor: {
\t\tid: 'usr_104',
\t\tname: 'Priya Shah',
\t\temail: 'priya@example.com',
\t\trole: 'Workspace admin'
\t},
\tresource: {
\t\ttype: 'Member',
\t\tid: 'usr_552',
\t\tname: 'Jon Bell'
\t},
\trequest: {
\t\tid: 'req_7ae921',
\t\tip: '203.0.113.24',
\t\tuserAgent: 'Chrome / macOS',
\t\tregion: 'London'
\t},
\tmetadata: {
\t\tbefore: { role: 'Member' },
\t\tafter: { role: 'Admin' },
\t\treason: 'Temporary migration access'
\t},
\tcreatedAt: '2026-06-11T14:36:00Z'
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Event integrity</h3>
						<p class="mt-2">Append audit records from trusted backend services. Avoid client-authored audit details for security-sensitive actions.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Large datasets</h3>
						<p class="mt-2">Move search, severity filters, and date windows to your API. Keep the table stable while cursor pages stream in.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Good follow-ups include saved investigations, SIEM forwarding, export job history, diff viewers, and alert rule creation from a selected event.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
