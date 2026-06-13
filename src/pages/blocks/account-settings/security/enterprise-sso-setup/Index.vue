<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import EnterpriseSsoSetup from './examples/EnterpriseSsoSetup.vue';
import EnterpriseSsoSetupSrc from './examples/EnterpriseSsoSetup.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Enterprise SSO Setup Block"
			tagline="A copyable enterprise security wizard for configuring SAML or OIDC, verifying domains, mapping groups, and testing rollout readiness."
			tag="Security"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Account Settings / Security" title="Enterprise SSO setup">
				<Example
					:source="EnterpriseSsoSetupSrc"
					filename="EnterpriseSsoSetup.vue"
					presentation="iframe"
					frame-src="/blocks/account-settings/security/enterprise-sso-setup/preview/EnterpriseSsoSetup"
					description="Copy this into workspace administration, enterprise account settings, B2B onboarding, developer platforms, or customer success consoles where admins need to configure identity provider access with confidence."
					default-open
					:preview-lines="18"
				>
					<EnterpriseSsoSetup />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when enterprise customers need a guided security setup instead of a pile of disconnected inputs.
						The pattern keeps provider selection, verified login domains, metadata exchange, group mapping, rollout checks, and connection testing in one sequential admin workflow.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace the local provider, domain, metadata, and mapping arrays with records from your enterprise account or organization settings API.</li>
						<li>Keep SSO activation server-owned. The UI should submit a draft configuration, run a test assertion, then require a privileged activation mutation.</li>
						<li>Store verified domains separately from identity provider metadata so domain ownership checks can be reused for SCIM, email routing, and workspace claims.</li>
						<li>Model group mappings as stable ids, not display names, because identity provider group names often change after rollout.</li>
						<li>Log every metadata upload, test result, activation, fallback-method change, and forced-login policy update as security audit events.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended SSO configuration shape">
				<CodeBlock lang="js" filename="enterprise-sso-config.js" :code="`{
\tid: 'sso_northstar_saml',
\tworkspaceId: 'wrk_northstar',
\tstatus: 'testing',
\tprovider: {
\t\ttype: 'saml',
\t\tname: 'Northstar Okta',
\t\tentityId: 'http://www.okta.com/exk2d9sso',
\t\tssoUrl: 'https://northstar.okta.com/app/saml/sso'
\t},
\tdomains: [
\t\t{ domain: 'northstar.example', status: 'verified' },
\t\t{ domain: 'northstar-analytics.example', status: 'pending_dns' }
\t],
\tmetadata: {
\t\tcertificateFingerprint: 'D4:71:9A:...',
\t\texpiresAt: '2027-05-28T00:00:00Z',
\t\tacsUrl: 'https://app.example.com/sso/saml/acs/sso_northstar_saml'
\t},
\tgroupMappings: [
\t\t{ providerGroupId: '00g-admins', role: 'admin', defaultSeat: 'enterprise' },
\t\t{ providerGroupId: '00g-analysts', role: 'member', defaultSeat: 'viewer' }
\t],
\trollout: {
\t\trequireSsoForDomains: true,
\t\tallowPasswordFallbackUntil: '2026-07-01T00:00:00Z',
\t\tnotifyAdminsBeforeActivation: true
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Activation boundary</h3>
						<p class="mt-2">Treat setup as a draft until a server-side test assertion succeeds. Activation should require admin permissions and a recent step-up challenge.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Recovery access</h3>
						<p class="mt-2">Keep break-glass admins, support impersonation policy, and password fallback explicit so a bad IdP rollout does not lock the customer out.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include SCIM provisioning, certificate rotation alerts, just-in-time role previews, IdP-specific setup templates, and reusable security checklist rows.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
