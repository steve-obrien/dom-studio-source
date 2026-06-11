<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import CampaignComposer from './examples/CampaignComposer.vue';
import CampaignComposerSrc from './examples/CampaignComposer.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Campaign Composer Block"
			tagline="A responsive lifecycle campaign workspace for drafting messages, choosing audiences, previewing channels, scheduling sends, and reviewing launch checks."
			tag="Marketing UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Marketing" title="Campaign composer workspace">
				<Example
					:source="CampaignComposerSrc"
					filename="CampaignComposer.vue"
					presentation="iframe"
					frame-src="/blocks/marketing/campaign-composer/preview/CampaignComposer"
					description="Copy this into lifecycle marketing tools, SaaS admin consoles, creator platforms, ecommerce back offices, or internal growth tools. Replace the sample campaigns, segments, previews, and checks with your messaging API and audience service."
					default-open
					:preview-lines="18"
				>
					<CampaignComposer />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a product team needs to compose and ship lifecycle messages without jumping between a campaign list, audience builder, previewer, and launch checklist.
						The layout keeps campaign selection, message content, audience reach, channel previews, send safety, and activity visible in one copyable application section.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>campaigns</code>, <code>segments</code>, <code>channels</code>, and <code>activity</code> with records from your campaign service.</li>
						<li>Persist draft edits through autosave or an explicit save endpoint with subject, preheader, body, CTA, audience rules, channel options, and schedule state.</li>
						<li>Generate previews server-side when personalization, localization, Liquid variables, or plan-specific copy can change the rendered message.</li>
						<li>Keep launch checks backend-owned so policy, consent, suppression lists, frequency caps, and required approvals are enforced consistently.</li>
						<li>Model send actions as jobs with queued, running, paused, failed, completed, and cancelled states so operators can trace every campaign launch.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended campaign payload">
				<CodeBlock lang="js" filename="campaign-composer.js" :code="`{
\tcampaign: {
\t\tid: 'cmp_activation_042',
\t\tname: 'Activation nudge',
\t\tstatus: 'draft',
\t\towner: 'Lifecycle',
\t\tgoal: 'Increase workspace activation'
\t},
\tmessage: {
\t\tsubject: 'Finish setting up your workspace',
\t\tpreheader: 'Invite your team and connect your first project.',
\t\tbody: 'Hi {{first_name}}, your workspace is almost ready.',
\t\tcta: 'Continue setup'
\t},
\taudience: {
\t\tsegments: ['trial_admins', 'invited_no_project'],
\t\texclusions: ['unsubscribed', 'recently_messaged'],
\t\testimatedReach: 18420
\t},
\tchannels: ['email', 'in_app'],
\tschedule: {
\t\tmode: 'scheduled',
\t\tsendAt: '2026-06-12T09:00:00Z',
\t\ttimezone: 'Europe/London'
\t},
\tchecks: [
\t\t{ id: 'consent', label: 'Consent and suppression lists synced', status: 'passed' },
\t\t{ id: 'frequency', label: 'Frequency cap within policy', status: 'warning' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Audience logic</h3>
						<p class="mt-2">Evaluate segment membership, exclusions, subscription consent, and frequency caps on the server. The UI should preview reach and explain policy blockers.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Preview fidelity</h3>
						<p class="mt-2">Render real email, push, and in-app previews with personalization data, locale fallbacks, dark mode, and truncation warnings before sending.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Good follow-ups include reusable audience rule builders, template token pickers, A/B test variants, holdout groups, approval gates, and send job monitors.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
