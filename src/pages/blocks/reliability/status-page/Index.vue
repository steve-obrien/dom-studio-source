<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import StatusPageCenter from './examples/StatusPageCenter.vue';
import StatusPageCenterSrc from './examples/StatusPageCenter.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Status Page Block"
			tagline="A copyable customer-facing status page for communicating uptime, service health, scheduled maintenance, and incident history."
			tag="Reliability UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Transparency" title="Status page center">
				<Example
					:source="StatusPageCenterSrc"
					filename="StatusPageCenter.vue"
					presentation="iframe"
					frame-src="/blocks/reliability/status-page/preview/StatusPageCenter"
					description="Copy this into SaaS products, developer platforms, marketplaces, fintech portals, or API businesses that need a trustworthy public health page."
					default-open
					:preview-lines="20"
				>
					<StatusPageCenter />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when customers need to understand whether your product is healthy without opening a support ticket.
						It combines current component state, recent uptime, maintenance notices, subscriber controls, and incident history in one responsive surface.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>services</code> with component health from your monitoring, synthetic checks, or status-page API.</li>
						<li>Drive <code>selectedRegion</code> from customer region, API cluster, or workspace data when health differs by geography.</li>
						<li>Persist subscriber preferences to your notification system, then send email, SMS, webhook, Slack, or in-app alerts from backend events.</li>
						<li>Keep incident history immutable and attach public updates to incident IDs so customers can audit what changed and when.</li>
						<li>Use scheduled maintenance rows for planned work and make them link to detailed maintenance pages when the blast radius is high.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended status payload">
				<CodeBlock lang="js" filename="status-page-payload.js" :code="`{
\tpage: {
\t\tname: 'Acme Cloud Status',
\t\tregion: 'Europe',
\t\tlastCheckedAt: '2026-06-10T19:42:00Z',
\t\tsubscriptionChannels: ['email', 'sms', 'webhook']
\t},
\tservices: [
\t\t{
\t\t\tid: 'api',
\t\t\tname: 'Public API',
\t\t\tstatus: 'Degraded',
\t\t\tuptime: 99.93,
\t\t\tlatency: '182ms',
\t\t\tregions: ['Europe', 'US East'],
\t\t\thistory: [96, 98, 99, 100, 97, 99, 98]
\t\t}
\t],
\tincidents: [
\t\t{
\t\t\tid: 'inc_2048',
\t\t\ttitle: 'Elevated API latency',
\t\t\tstatus: 'Monitoring',
\t\t\tstartedAt: '2026-06-10T18:05:00Z',
\t\t\tupdates: [
\t\t\t\t{ time: '19:20', message: 'Latency is recovering after cache failover.' }
\t\t\t]
\t\t}
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Health model</h3>
						<p class="mt-2">Separate component health from incidents. Automated checks can update service rows while humans author customer-facing incident updates deliberately.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Subscriber flow</h3>
						<p class="mt-2">Confirm email ownership before saving alert preferences, and expose unsubscribe tokens from every notification channel.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Good follow-ups include uptime sparklines, component detail pages, Atom/RSS feeds, webhook signing, and incident update approval workflows.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
