<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Example from '../../_layout/docs/Example.vue';
import WebhookOperationsConsole from './examples/WebhookOperationsConsole.vue';
import WebhookOperationsConsoleSrc from './examples/WebhookOperationsConsole.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Webhooks Block"
			tagline="A responsive developer operations console for endpoint setup, event subscriptions, signing-secret rotation, delivery inspection, and replay workflow."
			tag="Developer UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Developer Experience" title="Webhook operations console">
				<Example
					:source="WebhookOperationsConsoleSrc"
					filename="WebhookOperationsConsole.vue"
					presentation="iframe"
					frame-src="/blocks/webhooks/preview/WebhookOperationsConsole"
					description="Copy this into a developer dashboard, integration settings page, platform admin console, or internal delivery monitor. Replace the sample endpoint, event, and delivery arrays with your webhook API data."
					default-open
					:preview-lines="14"
				>
					<WebhookOperationsConsole />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when your product sends events to customer systems and developers need a place to configure,
						debug, and trust those deliveries. It combines endpoint settings with delivery observability so users can
						resolve failures without leaving your app.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>endpoints</code> with workspace-scoped webhook endpoints from your backend.</li>
						<li>Load event types from your event catalog so subscriptions stay aligned with server capabilities.</li>
						<li>Connect delivery rows to immutable delivery attempts and expose retry only for failed or timed-out attempts.</li>
						<li>Use the signing secret panel for one-time reveal, rotation confirmation, and copy-to-clipboard feedback.</li>
						<li>Persist test sends, retries, and subscription changes through API calls that also write audit events.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended webhook endpoint shape">
				<CodeBlock lang="js" filename="webhook-endpoint.js" :code="`{
\tid: 'we_prod_platform',
\tname: 'Production platform',
\turl: 'https://api.acme.example/webhooks/dom',
\tenvironment: 'Production',
\tstatus: 'Healthy',
\tapiVersion: '2026-06-01',
\tsecretPrefix: 'whsec_4A7K',
\tevents: ['customer.created', 'invoice.paid', 'subscription.updated'],
\tdelivery: { successRate: 99.6, latencyMs: 318, failures: 2 },
\tattempts: [
\t\t{
\t\t\tid: 'evt_1092',
\t\t\tevent: 'invoice.paid',
\t\t\tstatus: 'Delivered',
\t\t\tresponseCode: 200,
\t\t\tlatencyMs: 241,
\t\t\ttime: '2 minutes ago'
\t\t}
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Delivery model</h3>
						<p class="mt-2">Store every attempt separately from the logical event so retries keep a complete audit trail.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Security</h3>
						<p class="mt-2">Mask secrets after creation, sign payloads server-side, and show rotation state before accepting changes.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include event schema docs, endpoint health alerts, retry policy editors, and webhook test fixtures.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
