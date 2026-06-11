<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import TeamAccessConsole from './examples/TeamAccessConsole.vue';
import TeamAccessConsoleSrc from './examples/TeamAccessConsole.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Team Members Block"
			tagline="A copyable team administration surface for inviting users, changing roles, monitoring seats, and keeping workspace access secure."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations" title="Team access console">
				<Example
					:source="TeamAccessConsoleSrc"
					filename="TeamAccessConsole.vue"
					presentation="iframe"
					frame-src="/blocks/operations/team-members/preview/TeamAccessConsole"
					description="Copy this into SaaS settings, admin portals, B2B dashboards, internal tools, or workspace products. Replace the seeded members and roles with your account API, then connect invites, role updates, and deactivation actions to your access-control backend."
					default-open
					:preview-lines="20"
				>
					<TeamAccessConsole />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a customer needs to manage who can access a workspace. It keeps the most common account-admin jobs together:
						invite teammates, review pending invites, change roles, see seat usage, and spot risky access states before they become support tickets.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Load members, pending invites, roles, and seat limits from your workspace settings endpoint.</li>
						<li>Submit invites as an async job so you can show delivery, domain-policy, and license-limit errors inline.</li>
						<li>Persist role changes immediately or stage them behind a confirmation dialog when the target role has billing or security impact.</li>
						<li>Log sensitive actions such as owner transfer, role downgrade, invite resend, and member removal to your account audit trail.</li>
						<li>Scope destructive actions by permission: hide owner-only actions for admins, and disable self-removal for the current user.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended access payload">
				<CodeBlock lang="js" filename="workspace-access.js" :code="`{
\tworkspace: {
\t\tid: 'wrk_northstar',
\t\tname: 'Northstar Labs',
\t\tseatLimit: 12,
\t\trequireSso: true,
\t\tallowedDomains: ['northstar.example']
\t},
\tmembers: [
\t\t{
\t\t\tid: 'usr_amelia',
\t\t\tname: 'Amelia Hart',
\t\t\temail: 'amelia@northstar.example',
\t\t\trole: 'Owner',
\t\t\tstatus: 'Active',
\t\t\tlastSeenAt: '2026-06-10T08:42:00Z',
\t\t\tmfaEnabled: true
\t\t}
\t],
\tinvites: [
\t\t{
\t\t\tid: 'inv_lena',
\t\t\temail: 'lena@northstar.example',
\t\t\trole: 'Editor',
\t\t\tstatus: 'Pending',
\t\t\texpiresAt: '2026-06-17T12:00:00Z'
\t\t}
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Access rules</h3>
						<p class="mt-2">Keep role capabilities server-owned. The UI should render descriptions from your policy model, but the API must enforce every permission change.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Billing impact</h3>
						<p class="mt-2">Connect the seat meter to billing rules so upgrades, pending invites, guest seats, and inactive users are counted exactly the way your plan does.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">A reusable permission matrix, SCIM directory sync panel, owner-transfer dialog, and bulk member actions would extend this block for larger teams.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
