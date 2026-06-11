<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import StepUpVerificationDialog from './examples/StepUpVerificationDialog.vue';
import StepUpVerificationDialogSrc from './examples/StepUpVerificationDialog.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Step-up Verification Dialog Block"
			tagline="A copyable security workflow for reauthenticating users before privileged or irreversible account actions."
			tag="Security"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Account security" title="Step-up verification dialog">
				<Example
					:source="StepUpVerificationDialogSrc"
					filename="StepUpVerificationDialog.vue"
					presentation="iframe"
					frame-src="/blocks/account-settings/security/step-up-verification/preview/StepUpVerificationDialog"
					description="Copy this into account settings, billing, admin, developer, compliance, or workspace security flows where users must prove identity before changing privileged state."
					default-open
					:preview-lines="18"
				>
					<StepUpVerificationDialog />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block for sensitive actions such as disabling MFA, exporting customer data, rotating production keys, changing payout details, deleting workspaces, or promoting admins.
						The surrounding action surface explains risk, while the dialog captures a fresh proof with method-specific states and an auditable unlock result.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Request a server-issued step-up challenge when the user opens the dialog. Do not trust client-only readiness checks for privileged actions.</li>
						<li>Bind the challenge to the action id, actor, session id, device fingerprint, expiration time, and the target resource being changed.</li>
						<li>Support multiple verification methods, but let your risk engine decide which methods are allowed for each action.</li>
						<li>After successful verification, return a short-lived authorization token that the final mutation must present.</li>
						<li>Record every attempt with method, result, risk score, IP, user agent, and policy snapshot for security review.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended step-up challenge">
				<CodeBlock lang="js" filename="step-up-challenge.js" :code="`{
\tid: 'stepup_8d2f',
\taction: {
\t\tid: 'disable_mfa',
\t\tlabel: 'Disable multi-factor authentication',
\t\tresourceType: 'user_security_settings',
\t\tresourceId: 'usr_2048',
\t\triskLevel: 'high'
\t},
\tactor: {
\t\tid: 'usr_2048',
\t\temail: 'olivia@northstar.example',
\t\tsessionId: 'sess_current_macbook'
\t},
\tallowedMethods: ['passkey', 'totp', 'password'],
\texpiresAt: '2026-06-11T18:08:00Z',
\tpolicy: {
\t\trequireFreshAuthWithinMinutes: 5,
\t\tblockIfSessionRisk: ['high', 'unknown'],
\t\tallowTrustedDeviceRemembering: true
\t},
\taudit: {
\t\tip: '81.2.69.142',
\t\tdeviceLabel: 'MacBook Pro / Safari',
\t\treason: 'User requested privileged account change'
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Challenge lifecycle</h3>
						<p class="mt-2">Create the challenge on demand, expire it quickly, and tie the final mutation to the verified action so tokens cannot be replayed for another change.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Method policy</h3>
						<p class="mt-2">Let backend policy choose whether passkey, TOTP, password, recovery code, or admin approval is acceptable for the requested risk level.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include WebAuthn wiring, recovery-code fallback, device trust review, lockout timers, and reusable security event rows.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
