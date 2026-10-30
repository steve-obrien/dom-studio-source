<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import LoginPanel from './examples/LoginPanel.vue';
import LoginPanelSrc from './examples/LoginPanel.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Login Block"
			tagline="A complete workspace gateway with password and passwordless entry, second-factor verification, session proof, workspace selection, handoff, and sign-out."
			tag="Working API"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Conversion" title="Secure workspace gateway">
				<Example
					:source="LoginPanelSrc"
					filename="LoginPanel.vue"
					presentation="iframe"
					frame-src="/blocks/conversion/login/preview/LoginPanel"
					description="Copy this into a SaaS product, internal platform, customer portal, or multi-workspace app that needs a complete authentication handoff rather than a static credential form."
					default-open
					:preview-lines="14"
				>
					<LoginPanel />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How the working section fits together">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when authentication needs to carry real workspace and session context into the application. The demo owns password validation, rate limits, code verification, passwordless recovery, session reads, workspace authorization, handoff proof, and revocation through focused routes.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/login/bootstrap</code> returns product identity, security policy, recent access context, and documented demo credentials.</li>
						<li><code>POST /api/block-demos/login/sessions</code> validates password credentials, tracks failed attempts, and creates an expiring MFA challenge.</li>
						<li><code>POST /api/block-demos/login/challenges</code> creates the passwordless recovery path without duplicating the verification UI or revealing whether an email is registered.</li>
						<li>The challenge verification route enforces expiry, attempt limits, and single use before issuing an authenticated session receipt.</li>
						<li>Session routes support reload reads, authorized workspace handoff, immutable proof, and explicit sign-out revocation.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Authenticated handoff receipt">
				<CodeBlock lang="js" filename="workspace-handoff.js" :code="`{
	session: {
		id: 'northstar-session-43',
		status: 'ready',
		method: 'Password + MFA',
		workspaceId: 'northstar-labs',
		revision: 2,
		expiresAt: '2026-08-02T05:58:00.000Z'
	},
	workspace: {
		id: 'northstar-labs',
		label: 'Northstar Labs',
		role: 'Member'
	},
	handoff: {
		path: '/workspace/northstar-labs',
		proof: '5f2a4f91bf095703'
	},
	receipt: {
		id: 'receipt-northstar-session-43',
		checksum: '66a5e6d24de4b56c'
	}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Identity provider</h3>
						<p class="mt-2">Replace the process-local member lookup with Auth0, Clerk, WorkOS, Cognito, an OIDC provider, or your application auth service while preserving the demonstrated challenge states.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Workspace handoff</h3>
						<p class="mt-2">Keep workspace authorization server-owned. The client chooses only from returned memberships and receives a scoped handoff after verification.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Production boundary</h3>
						<p class="mt-2">Add password hashing, secure cookies, CSRF protection, durable sessions, real email delivery, device records, audit events, and provider-backed MFA before production use.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
