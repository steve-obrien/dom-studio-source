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
			tagline="A working provider-connection workspace with approved discovery, server-owned access contracts, setup proof, runtime evidence, and lifecycle controls."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Developer Experience / Platform" title="Integration marketplace">
				<Example
					:source="IntegrationMarketplaceSrc"
					filename="IntegrationMarketplace.vue"
					presentation="iframe"
					frame-src="/blocks/developer-experience/integration-marketplace/preview/IntegrationMarketplace"
					description="A Linear-, Sentry-, and Stripe-inspired connections section with responsive Catalog, Details, and Connection views backed by repository-local APIs."
					default-open
					:preview-lines="16"
				>
					<IntegrationMarketplace />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="Included application behavior">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The block treats integrations as operational application infrastructure, not decorative marketplace tiles.
						Discovery, provider detail, OAuth or credential setup, scope policy, tests, syncs, settings, requests, disconnects, and reset all cross a server API.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Search and filter an approved provider catalog through rich `DomSelect` controls, then inspect one provider without leaving the workspace.</li>
						<li>Repair paused connections or create new ones with server-owned required scopes, optional access, ownership, cadence, and processing region.</li>
						<li>Exercise expiring OAuth grants and restricted-key validation without exposing provider tokens or persisted credentials to the browser.</li>
						<li>Run connection tests and manual syncs, then inspect immutable run evidence and lifecycle activity.</li>
						<li>Request an unlisted provider, save revisioned runtime settings, handle stale writes, and disconnect with exact-name confirmation and an audit reason.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local route contract">
				<CodeBlock lang="text" filename="integration-marketplace.routes" :code="`GET   /api/block-demos/integration-marketplace/bootstrap
GET   /api/block-demos/integration-marketplace/connectors/:connectorId
POST  /api/block-demos/integration-marketplace/connectors/:connectorId/authorize
POST  /api/block-demos/integration-marketplace/connectors/:connectorId/connect
PATCH /api/block-demos/integration-marketplace/connectors/:connectorId/settings
POST  /api/block-demos/integration-marketplace/connectors/:connectorId/test
POST  /api/block-demos/integration-marketplace/connectors/:connectorId/sync
POST  /api/block-demos/integration-marketplace/connectors/:connectorId/disconnect
POST  /api/block-demos/integration-marketplace/requests
POST  /api/block-demos/integration-marketplace/reset`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Production boundaries">
				<div class="grid gap-5 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Provider boundary</h3><p class="mt-2">The demo uses deterministic grants, credentials, and sync results. Production should use provider SDKs, encrypted tokens, signed OAuth state, refresh handling, and isolated workers.</p></div>
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Policy boundary</h3><p class="mt-2">Keep required scopes, approved regions, accountable owners, and elevated-write acknowledgement server-owned. Client state must not weaken the approved contract.</p></div>
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Audit boundary</h3><p class="mt-2">Add authentication, authorization, durable connection and request storage, immutable audit events, secret rotation, webhook verification, rate limits, and retention controls.</p></div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
