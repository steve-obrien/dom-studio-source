<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import SharePermissionsPanel from './examples/SharePermissionsPanel.vue';
import SharePermissionsPanelSrc from './examples/SharePermissionsPanel.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Share Permissions Block"
			tagline="An API-backed, people-first sharing panel with rich roles, general access safeguards, reviewable changes, and focused mobile views."
			tag="Reviewed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Collaboration" title="Share permissions panel">
				<Example
					:source="SharePermissionsPanelSrc"
					filename="SharePermissionsPanel.vue"
					presentation="iframe"
					frame-src="/blocks/collaboration/share-permissions/preview/SharePermissionsPanel"
					description="Copy this working app section into document editors, project workspaces, customer portals, or dashboards where people share a resource with teammates, guests, or link viewers. The example is wired to repository-local read, update, invite, and revoke APIs."
					frame-flush-edges
					default-open
					:preview-lines="14"
				>
					<SharePermissionsPanel />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block for object-level access control: sharing a project, report, folder, roadmap, workspace view, design file, or client deliverable.
						It separates primary sharing actions from policy warnings, active collaborators, pending invites, and audit history so the permission model is easy to understand.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>The people-first hierarchy is inspired by mature sharing workflows such as Figma and Google Drive: invite first, effective grants next, and broader link access in a quieter secondary pane.</li>
						<li>Replace the process-local demo store with your permission tables or service while retaining the resource, collaborator, invitation, and activity payload.</li>
						<li>Map <code>collaborators</code> to direct grants, inherited grants, guests, service accounts, or workspace groups. Keep the access source visible so users know what they can safely change.</li>
						<li>Persist role changes through the PATCH endpoint and re-fetch effective access after server-side policy rules apply.</li>
						<li>Use <code>policyChecks</code> for product-specific safety gates such as external domains, sensitive fields, expiring links, or approval requirements.</li>
						<li>Connect pending invites to your email invitation flow, including resend, revoke, expiry, and accepted-state transitions.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Working app-section contract">
				<CodeBlock lang="js" filename="share-permissions-api.js" :code="`// Read the selector and one effective permission resource
GET /api/block-demos/share-permissions/resources
GET /api/block-demos/share-permissions/:resourceId

// Apply link, safeguard, and collaborator-role changes
PATCH /api/block-demos/share-permissions/:resourceId
{
\tlinkAccess: 'restricted',
\tlinkExpiry: '30d',
\trequireApproval: true,
\tallowDownload: false,
\tnotifyPeople: true,
\troles: [{ id: 'jon', role: 'Can comment' }]
}

// Create or revoke a pending invitation
POST /api/block-demos/share-permissions/:resourceId/invitations
{ email: 'client@example.com', role: 'Can view' }

DELETE /api/block-demos/share-permissions/:resourceId/invitations/:inviteId`" />
				<p class="mt-4 text-sm leading-7 text-muted-fg">
					The documentation demo uses an in-memory server store so it works without database setup and persists across browser reloads for the lifetime of the dev server.
					A production integration should put the same routes behind authentication, authorization, durable permission storage, email delivery, and immutable audit events.
				</p>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended permission payload">
				<CodeBlock lang="js" filename="share-permissions.js" :code="`{
\tresource: {
\t\tid: 'report_q3_pipeline',
\t\tname: 'Q3 enterprise pipeline review',
\t\ttype: 'Report',
\t\towner: 'Maya Chen',
\t\tsensitivity: 'Internal',
\t\tlinkAccess: 'restricted'
\t},
\tcollaborators: [
\t\t{ id: 'user_1', name: 'Jon Bell', email: 'jon@example.com', role: 'Can edit', source: 'Direct' },
\t\t{ id: 'group_1', name: 'Revenue team', email: '12 members', role: 'Can view', source: 'Group' }
\t],
\tpendingInvites: [
\t\t{ id: 'invite_1', email: 'client@example.com', role: 'Can comment', expiresAt: 'Jun 17, 2026' }
\t],
\tpolicyChecks: [
\t\t{ id: 'external_domain', label: 'External domain review', status: 'warning' }
\t],
\tauditEvents: [
\t\t{ label: 'Link access changed', actor: 'Maya Chen', time: 'Today 10:24' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Permission model</h3>
						<p class="mt-2">Keep direct, inherited, group, and link-based access visibly distinct. The API must return effective access after policy rules apply.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Safety checks</h3>
						<p class="mt-2">Run server-side checks before broadening access, then return specific errors for external collaborators, confidential resources, and public links.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Production boundary</h3>
						<p class="mt-2">Replace the demo store with durable grants, policy checks, email delivery, authorization, and append-only audit history without changing the UI contract.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
