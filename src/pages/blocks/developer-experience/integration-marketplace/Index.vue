<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import IntegrationMarketplace from './examples/IntegrationMarketplace.vue';
import IntegrationMarketplaceSrc from './examples/IntegrationMarketplace.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Integration Marketplace Block"
			tagline="A responsive app-directory pattern for discovering connectors, reviewing permissions, and launching integration installs."
			tag="Platform UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Developer Experience" title="Integration marketplace">
				<Example
					:source="IntegrationMarketplaceSrc"
					filename="IntegrationMarketplace.vue"
					presentation="iframe"
					frame-src="/blocks/developer-experience/integration-marketplace/preview/IntegrationMarketplace"
					description="Copy this into a settings area, developer console, onboarding flow, or platform marketplace where customers need to discover integrations before entering an install workflow."
					default-open
					:preview-lines="14"
				>
					<IntegrationMarketplace />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when an app needs a central place for customers to discover integrations, compare provider capabilities, review requested data access, and launch the right install path.
						The layout keeps discovery tile-first, then moves setup detail into a focused dialog so the catalog does not become another dense admin console.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>connectors</code> with provider catalog records from your backend, including category, install status, health, scopes, and capabilities.</li>
						<li>Use the primary dialog action to branch into OAuth, API key entry, admin consent, or reconnect flows based on connector status.</li>
						<li>Persist optional scope choices and scheduled-sync preference before creating tokens or starting background jobs.</li>
						<li>Connect the activity tab to audit events such as install, token refresh, failed sync, reconnect, scope change, and provider review.</li>
						<li>Keep required scopes server-defined so client-side edits cannot weaken the permissions needed for a safe integration.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended connector shape">
				<CodeBlock lang="js" filename="integration-connector.js" :code="`{
\tid: 'salesforce',
\tname: 'Salesforce',
\tcategory: 'CRM',
\tdescription: 'Sync accounts, contacts, owners, opportunities, and lifecycle stages.',
\tstatus: 'Installed',
\towner: 'Maya Chen',
\tlastSyncAt: '8 minutes ago',
\thealth: 'Healthy',
\tinstallCount: 18420,
\trating: '4.9',
\trecommended: true,
\tcapabilities: ['Account enrichment', 'Opportunity signals', 'Two-way contacts'],
\tmetrics: [
\t\t{ label: 'Success rate', value: '99.2%' },
\t\t{ label: 'Records synced', value: '18.4k' },
\t\t{ label: 'Next sync', value: '7m' }
\t],
\tscopes: [
\t\t{ key: 'contacts.read', label: 'Read contacts', enabled: true, required: true },
\t\t{ key: 'contacts.write', label: 'Write contacts', enabled: false, required: false }
\t],
\tactivity: [
\t\t{ label: 'Contacts synced', actor: 'Sync worker', time: '8 minutes ago' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Connection flows</h3>
						<p class="mt-2">Route each connector to the correct install method from the dialog: OAuth redirect, embedded consent, API key entry, reconnect, or admin-approved installation.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Catalog quality</h3>
						<p class="mt-2">Store provider capability tags, install counts, setup time, review state, and health in your catalog so search and recommendations stay useful.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include reusable provider icons, OAuth callback states, field mapping steps, compare mode, install-request approvals, and error remediation checklists.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
