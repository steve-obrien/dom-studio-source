<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import PrivacyControlCenter from './examples/PrivacyControlCenter.vue';
import PrivacyControlCenterSrc from './examples/PrivacyControlCenter.vue?raw';
import PrivacyActionRowSrc from './components/PrivacyActionRow.vue?raw';
import PrivacySignalSrc from './components/PrivacySignal.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Privacy Control Center Block"
			tagline="A responsive, policy-aware settings workflow for privacy choices and auditable data-rights requests."
			tag="Reviewed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Account Settings" title="Responsive privacy control center">
				<Example
					:source="PrivacyControlCenterSrc"
					filename="PrivacyControlCenter.vue"
					presentation="iframe"
					frame-src="/blocks/account-settings/privacy/privacy-control-center/preview/PrivacyControlCenter"
					description="A contained account-settings surface that separates day-to-day privacy choices from sensitive data-rights jobs. It uses DOM Studio tabs, rich selects, toggles, status pills, buttons, and dialogs while keeping the save review human-readable at every viewport."
					default-open
					:preview-lines="16"
				>
					<PrivacyControlCenter />
				</Example>
			</DocSection>

			<DocSection eyebrow="Local components" title="Copy the helper rows">
				<div class="grid gap-4 lg:grid-cols-2">
					<CodeBlock lang="vue" filename="components/PrivacySignal.vue" :code="PrivacySignalSrc" />
					<CodeBlock lang="vue" filename="components/PrivacyActionRow.vue" :code="PrivacyActionRowSrc" />
				</div>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block for SaaS, marketplace, community, fintech, health, education, or productivity apps where
						users need to understand and change how their personal data is collected, retained, exported, or deleted.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Separate reversible settings from asynchronous data-rights jobs so the primary task stays focused.</li>
						<li>Use `DomSelect` for retention and export-format choices that benefit from descriptions and status metadata.</li>
						<li>Load consent controls from policy-backed server data, not hard-coded client assumptions.</li>
						<li>Keep required security, billing, fraud, and legal notices separate from optional personalization controls.</li>
						<li>Require server confirmation for export, deletion, profiling reset, and account-data portability requests.</li>
						<li>Persist every change with policy version, actor, timestamp, source surface, and effective region.</li>
						<li>Render helper rows with DOM Studio buttons and status pills, and show a human-readable review instead of raw payload values.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended privacy payload">
				<CodeBlock lang="js" filename="privacy-settings.js" :code="`{
\tuserId: 'usr_2038',
\tpolicyVersion: 'privacy-2026-05',
\tregion: 'GB',
\tprofileVisibility: 'team',
\tactivityRetention: '12-months',
\texportFormat: 'portable-json',
\tconsent: {
\t\tproductAnalytics: true,
\t\tpersonalization: true,
\t\tmarketing: false,
\t\tthirdPartyEnrichment: false,
\t\tteamDiscovery: true
\t},
\trequests: [
\t\t{
\t\t\ttype: 'data_export',
\t\t\tformat: 'portable-json',
\t\t\tstatus: 'queued',
\t\t\trequestedAt: '2026-06-11T18:40:00Z'
\t\t}
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Policy ownership</h3>
						<p class="mt-2">Drive labels, descriptions, and disabled states from your privacy policy service so legal copy and UI state stay aligned.</p>
					</div>
					<div class="border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Sensitive actions</h3>
						<p class="mt-2">Data export, deletion, and profiling reset should create backend jobs with email confirmation and rate limiting.</p>
					</div>
					<div class="border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include consent history, regional policy variants, download expiry states, delegated admin review, and reusable privacy rows.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
