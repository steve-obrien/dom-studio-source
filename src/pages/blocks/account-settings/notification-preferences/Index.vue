<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import NotificationPreferenceCenter from './examples/NotificationPreferenceCenter.vue';
import NotificationPreferenceCenterSrc from './examples/NotificationPreferenceCenter.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Notification Preferences Block"
			tagline="A responsive account settings surface for channel preferences, quiet hours, digest cadence, required account alerts, and save-state review."
			tag="Settings UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Account Settings" title="Notification preference center">
				<Example
					:source="NotificationPreferenceCenterSrc"
					filename="NotificationPreferenceCenter.vue"
					presentation="iframe"
					frame-src="/blocks/account-settings/notification-preferences/preview/NotificationPreferenceCenter"
					description="Copy this into an account settings page, customer portal, SaaS workspace preferences screen, or mobile-first profile area. Replace the sample preference groups, channels, and digest settings with your own notification API data."
					default-open
					:preview-lines="14"
				>
					<NotificationPreferenceCenter />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when users need granular control over product, team, billing, and security messages without
						accidentally disabling required account notices. The matrix layout makes it easy to scan event groups while
						the side pane keeps global delivery rules visible.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>preferenceGroups</code> with notification topics from your backend or customer messaging platform.</li>
						<li>Persist channel changes as explicit user preferences keyed by topic and channel.</li>
						<li>Keep required operational alerts separate from optional marketing or workflow notifications.</li>
						<li>Connect digest cadence, quiet hours, and timezone fields to user profile settings.</li>
						<li>Show a preview payload before saving so users understand which channels will change.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended preference payload">
				<CodeBlock lang="js" filename="notification-preferences.js" :code="`{
\tuserId: 'usr_2038',
\ttimezone: 'Europe/London',
\tquietHours: {
\t\tenabled: true,
\t\tstart: '18:00',
\t\tend: '08:30'
\t},
\tdigest: {
\t\tcadence: 'daily',
\t\tdeliveryTime: '09:00',
\t\tchannels: ['email']
\t},
\ttopics: [
\t\t{
\t\t\tkey: 'mentions',
\t\t\tlabel: 'Mentions and assignments',
\t\t\tcategory: 'Workspace',
\t\t\trequired: false,
\t\t\tchannels: { email: true, push: true, sms: false, inApp: true }
\t\t},
\t\t{
\t\t\tkey: 'security',
\t\t\tlabel: 'Security and sign-in alerts',
\t\t\tcategory: 'Account',
\t\t\trequired: true,
\t\t\tchannels: { email: true, push: true, sms: true, inApp: true }
\t\t}
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Preference model</h3>
						<p class="mt-2">Store user overrides separately from workspace defaults so admins can change defaults without erasing personal choices.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Required alerts</h3>
						<p class="mt-2">Disable controls only for legally or operationally required notifications, and explain the reason in supporting copy.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include reusable channel toggles, notification preview emails, per-project overrides, and unsubscribe token handling.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
