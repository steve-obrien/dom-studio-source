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
			tagline="A responsive collaboration panel for inviting people, setting object-level roles, controlling link access, and catching risky sharing changes before they go live."
			tag="Collaboration UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Collaboration" title="Share permissions panel">
				<Example
					:source="SharePermissionsPanelSrc"
					filename="SharePermissionsPanel.vue"
					presentation="iframe"
					frame-src="/blocks/collaboration/share-permissions/preview/SharePermissionsPanel"
					description="Copy this into document editors, project workspaces, customer portals, dashboards, or any SaaS app where people share a record with teammates, guests, or public-link viewers. Replace the local arrays with your resource, members, invites, policy checks, and audit events."
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
						<li>Replace <code>resource</code> with the shared object name, owner, sensitivity, and current access mode from your backend.</li>
						<li>Map <code>collaborators</code> to direct grants, inherited grants, guests, service accounts, or workspace groups.</li>
						<li>Persist role changes through a permission endpoint and re-fetch the effective access list after policy rules apply.</li>
						<li>Use <code>policyChecks</code> for product-specific safety gates such as external domains, sensitive fields, expiring links, or approval requirements.</li>
						<li>Connect pending invites to your email invitation flow, including resend, revoke, expiry, and accepted-state transitions.</li>
					</ul>
				</div>
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
						<p class="mt-2">Keep direct, inherited, group, and link-based access visibly distinct. Users need to know where a permission came from before they can safely change it.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Safety checks</h3>
						<p class="mt-2">Run server-side checks before broadening access, then show specific warnings for external collaborators, sensitive fields, compliance rules, and public links.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include reusable role badges, group pickers, approval request flows, access expiry controls, and a permission diff preview before saving.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
