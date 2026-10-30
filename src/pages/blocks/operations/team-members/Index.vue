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
			tagline="A working people-administration section with directory, invitation, access-policy, role-change, suspension, export, and audit APIs."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations" title="Team access console">
				<Example
					:source="TeamAccessConsoleSrc"
					filename="TeamAccessConsole.vue"
					presentation="iframe"
					frame-src="/blocks/operations/team-members/preview/TeamAccessConsole"
					description="A responsive people directory inspired by focused administration tools rather than a reduced full-screen screenshot. Every visible action calls the repository-local team-access API, returns server-owned validation and receipts, and survives a browser reload for the life of the demo process."
					default-open
					:preview-lines="20"
				>
					<TeamAccessConsole />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="Working application contract">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						This example is backed by process-local API state rather than component-only mock data. It demonstrates the lifecycle boundary an account administrator actually needs:
						load a compact directory, hydrate one access record, preview sensitive changes, commit an exact revision, and recover when another view wins a conflict.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Invitations enforce work-email, domain, external-guest, team, expiry, duplicate, and paid-seat rules on the server.</li>
						<li>Role changes use preview then commit, so capability and billing impact are reviewed against an exact member and workspace version.</li>
						<li>Suspension revokes sessions and API tokens, records an audit reason, and returns a durable receipt before reactivation is allowed.</li>
						<li>Policy changes, retries, cancellations, CSV exports, and reset are real endpoints with conflict and failure states.</li>
						<li>The process-local adapter is replaceable: keep these payloads and move state, authorization, mail delivery, and audit storage behind production services.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local routes">
				<CodeBlock lang="txt" filename="team-access-api.txt" :code="`GET    /api/block-demos/team-access/workspace
GET    /api/block-demos/team-access/members/:memberId
POST   /api/block-demos/team-access/invites
POST   /api/block-demos/team-access/invites/:inviteId/resend
DELETE /api/block-demos/team-access/invites/:inviteId
POST   /api/block-demos/team-access/members/:memberId/role/preview
POST   /api/block-demos/team-access/members/:memberId/role/commit
POST   /api/block-demos/team-access/members/:memberId/suspend
POST   /api/block-demos/team-access/members/:memberId/reactivate
PATCH  /api/block-demos/team-access/policies/:policyId
GET    /api/block-demos/team-access/export
POST   /api/block-demos/team-access/reset`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-5 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border-t border-border pt-4">
						<h3 class="font-semibold text-canvas-fg">Access rules</h3>
						<p class="mt-2">The UI renders role descriptions and previews from the shared catalog, while the API remains authoritative for ownership, seat, guest, and revision checks.</p>
					</div>
					<div class="border-t border-border pt-4">
						<h3 class="font-semibold text-canvas-fg">Billing impact</h3>
						<p class="mt-2">Paid-seat commitment includes active paid roles and pending paid invitations. Guests remain team-scoped and do not consume the same seat kind.</p>
					</div>
					<div class="border-t border-border pt-4">
						<h3 class="font-semibold text-canvas-fg">Production boundary</h3>
						<p class="mt-2">Replace process memory with your user directory, authorization service, identity provider, mail provider, billing meter, and immutable audit store without changing the page flow.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
