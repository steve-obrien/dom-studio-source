<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import DeviceSecurityCenter from './examples/DeviceSecurityCenter.vue';
import DeviceSecurityCenterSrc from './examples/DeviceSecurityCenter.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Session Security Block"
			tagline="A responsive account security workspace for reviewing signed-in devices, revoking risky sessions, checking recovery coverage, and tracking recent access activity."
			tag="Account UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Account settings" title="Device security center">
				<Example
					:source="DeviceSecurityCenterSrc"
					filename="DeviceSecurityCenter.vue"
					presentation="iframe"
					frame-src="/blocks/account-settings/session-security/preview/DeviceSecurityCenter"
					description="Copy this into account settings, workspace security, consumer profile, fintech, healthcare, or admin-console products. Replace the local session, recovery, and event arrays with your authentication API data."
					default-open
					:preview-lines="16"
				>
					<DeviceSecurityCenter />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when users need a concrete way to understand account access and act on suspicious activity.
						It joins device inventory, trust status, session actions, recovery readiness, MFA/passkey controls, and immutable security events in one copyable surface.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>sessions</code> with server-issued session records including device, browser, region, IP, last activity, trust state, and revocation eligibility.</li>
						<li>Route revoke actions through a session API that invalidates refresh tokens and writes a security event with actor, target session, IP, and reason.</li>
						<li>Keep passkey, MFA, recovery email, phone, and backup-code state server-owned; the UI should render readiness and start setup flows, not decide policy locally.</li>
						<li>Send high-risk events to email, push, or in-app alerts so account owners can confirm or deny new sign-ins quickly.</li>
						<li>For regulated products, require fresh authentication before revoking all other sessions, exporting events, changing recovery methods, or disabling MFA.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended security payload">
				<CodeBlock lang="js" filename="account-security.js" :code="`{
\taccountId: 'acct_olivia',
\tsecurityScore: 86,
\tsessions: [
\t\t{
\t\t\tid: 'sess_macbook_london',
\t\t\tdevice: 'MacBook Pro',
\t\t\tbrowser: 'Safari 18',
\t\t\tplatform: 'macOS',
\t\t\tregion: 'London, UK',
\t\t\tip: '81.2.69.142',
\t\t\tlastActiveAt: '2026-06-10T17:42:00Z',
\t\t\ttrusted: true,
\t\t\tcurrent: true,
\t\t\trisk: 'Low'
\t\t}
\t],
\trecovery: {
\t\tmfaEnabled: true,
\t\tpasskeys: 2,
\t\tbackupCodesRemaining: 6,
\t\trecoveryEmailVerified: true,
\t\tphoneVerified: false
\t},
\tevents: [
\t\t{ type: 'new_device', label: 'New sign-in approved', time: 'Today 08:14', region: 'London, UK' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Session safety</h3>
						<p class="mt-2">Never trust client-selected session state alone. Revoke by server session ID and handle current-session revocation with a clear redirect path.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Risk signals</h3>
						<p class="mt-2">Calculate risk from device fingerprint, impossible travel, IP reputation, MFA result, and recent failed attempts on the backend.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include reusable re-auth dialogs, passkey setup flows, trusted-device naming, security event filters, and exportable audit logs.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
