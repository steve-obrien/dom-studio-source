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
			tagline="A working enterprise audit investigation workspace with server-side filters, evidence inspection, legal holds, saved views, alert rules, and verified exports."
			tag="Working API"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Compliance" title="Audit log explorer">
				<Example
					:source="AuditLogExplorerSrc"
					filename="AuditLogExplorer.vue"
					presentation="iframe"
					frame-src="/blocks/compliance/audit/audit-log-explorer/preview/AuditLogExplorer"
					description="A Vercel Activity-, Datadog Logs-, and Sentry-inspired investigation surface built as a complete responsive app section rather than a static audit-table screenshot."
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
						<li>The example already queries server-owned, paginated events through <code>/api/block-demos/audit-log-explorer/query</code>.</li>
						<li>Keep immutable event ids, actor identity, action, resource, IP address, user agent, request id, outcome, and environment in the stored record.</li>
						<li>Saved views, legal holds, alert rules, and verified exports use focused mutation endpoints with validation and optimistic revisions.</li>
						<li>The repository demo store is intentionally process-local. Replace it with durable storage, cursor pagination, role checks, and background export jobs in production.</li>
						<li>Preserve raw metadata as structured JSON and retain before/after payloads so investigators can review provider context and exact changes.</li>
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
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Event integrity</h3>
						<p class="mt-2">Append audit records from trusted backend services. Avoid client-authored audit details for security-sensitive actions.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Large datasets</h3>
						<p class="mt-2">The demo uses page-based server queries. Switch to cursor pagination and indexed search when the audit dataset becomes unbounded.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Production seam</h3>
						<p class="mt-2">Persist mutations, authorise sensitive exports, stream completed files from object storage, and forward immutable events to your SIEM.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
