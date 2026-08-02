<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import WebhookOperationsConsole from './examples/WebhookOperationsConsole.vue';
import WebhookOperationsConsoleSrc from './examples/WebhookOperationsConsole.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Webhooks Block"
			tagline="A working webhook delivery section with endpoint contracts, immutable attempt evidence, test sends, guarded replays, one-time secret rotation, and lifecycle controls."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Developer Experience / Platform" title="Webhook delivery operations">
				<Example
					:source="WebhookOperationsConsoleSrc"
					filename="WebhookOperationsConsole.vue"
					presentation="iframe"
					frame-src="/blocks/developer-experience/webhooks/preview/WebhookOperationsConsole"
					description="A Svix-, Stripe-, and GitHub-inspired delivery workspace with responsive Endpoints, Deliveries, and Endpoint views backed by repository-local APIs."
					default-open
					:preview-lines="16"
				>
					<WebhookOperationsConsole />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="Included application behavior">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The block treats webhook operations as a delivery investigation and endpoint-lifecycle workflow rather than a settings screenshot.
						Endpoint discovery, signed test sends, immutable request and response evidence, replay, configuration, secret rotation, disablement, enablement, and reset all cross a server API.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Filter an endpoint registry with rich <code>DomSelect</code> controls, then inspect delivery health without leaving the workspace.</li>
						<li>Review signed request, destination response, and timing evidence for an immutable delivery attempt.</li>
						<li>Create an endpoint with server-owned event subscriptions and receive its signing secret exactly once.</li>
						<li>Send a synthetic subscribed event, replay a failed delivery into a new attempt, and preserve the failed source evidence.</li>
						<li>Save endpoint contracts at exact revisions, rotate signing material with bounded overlap, and guard disablement with exact-name confirmation.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Repository-local route contract">
				<CodeBlock lang="text" filename="webhook-operations.routes" :code="`GET   /api/block-demos/webhook-operations/bootstrap
POST  /api/block-demos/webhook-operations/endpoints
GET   /api/block-demos/webhook-operations/endpoints/:endpointId
PATCH /api/block-demos/webhook-operations/endpoints/:endpointId
POST  /api/block-demos/webhook-operations/endpoints/:endpointId/test
POST  /api/block-demos/webhook-operations/endpoints/:endpointId/secret-rotations
POST  /api/block-demos/webhook-operations/endpoints/:endpointId/disable
POST  /api/block-demos/webhook-operations/endpoints/:endpointId/enable
GET   /api/block-demos/webhook-operations/endpoints/:endpointId/deliveries/:deliveryId
POST  /api/block-demos/webhook-operations/endpoints/:endpointId/deliveries/:deliveryId/replay
POST  /api/block-demos/webhook-operations/reset`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Production boundaries">
				<div class="grid gap-5 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Dispatch boundary</h3><p class="mt-2">The demo creates deterministic delivery evidence. Production should queue frozen event snapshots, enforce egress allowlists, sign server-side, cap payloads, and isolate per-customer delivery workers.</p></div>
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Secret boundary</h3><p class="mt-2">Keep full signing material encrypted and reveal it only at creation or rotation. Store audit-safe prefixes and fingerprints separately from the delivery worker’s decrypt path.</p></div>
					<div class="border-y border-border py-4"><h3 class="font-semibold text-canvas-fg">Evidence boundary</h3><p class="mt-2">Add authentication, organization authorization, durable event and attempt records, retention, redaction, replay idempotency, abuse limits, alert delivery, and immutable operator audit events.</p></div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
