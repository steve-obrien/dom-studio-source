<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import DeliveryTracker from './examples/DeliveryTracker.vue';
import DeliveryTrackerSrc from './examples/DeliveryTracker.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Delivery Tracker Block"
			tagline="A working post-purchase tracker with API-backed courier events, persistent instructions, customer actions, and delivered-state proof."
			tag="Reviewed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Commerce" title="Live delivery tracker">
				<Example
					:source="DeliveryTrackerSrc"
					filename="DeliveryTracker.vue"
					presentation="iframe"
					frame-src="/blocks/commerce/post-purchase/delivery-tracker/preview/DeliveryTracker"
					description="Copy the responsive status-first experience and repository-local API contract into commerce, marketplace, logistics, field service, or appointment products that need customer-facing delivery updates."
					default-open
					:preview-lines="20"
					frame-flush-edges
				>
					<DeliveryTracker />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when customers need to understand where an order is, what happens next, and how to fix a delivery problem without contacting support.
						Its Shop- and Uber-inspired hierarchy puts the ETA and current blocker before secondary order detail, without pretending a decorative map is live tracking.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/delivery-tracker/orders</code> and <code>GET /api/block-demos/delivery-tracker/:orderId</code> provide the order list and normalized tracking detail.</li>
						<li><code>PATCH /api/block-demos/delivery-tracker/:orderId/instructions</code> persists the rich <code>DomSelect</code> drop-off choice, access code, contactless preference, and notes with optimistic revision checks.</li>
						<li><code>POST /api/block-demos/delivery-tracker/:orderId/exceptions/:exceptionId/resolve</code> validates the missing access code and removes the customer-owned blocker.</li>
						<li><code>POST /api/block-demos/delivery-tracker/:orderId/sync</code> is a deterministic demo stand-in for carrier webhooks. The server owns checkpoint transitions and delivered proof.</li>
						<li>The repository-local store survives preview reloads but resets when the server restarts. Replace it with your order database, carrier adapter, event ingestion, and authorization checks in production.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended delivery payload">
				<CodeBlock lang="js" filename="delivery-tracker.js" :code="`{
\torder: {
\t\tid: 'ord_20482',
\t\tnumber: 'GD-20482',
\t\tcustomerId: 'cus_118',
\t\tstatus: 'out_for_delivery',
\t\tetaWindow: { startsAt: '2026-06-11T16:35:00Z', endsAt: '2026-06-11T16:55:00Z' }
\t},
\tfulfilment: {
\t\tcarrier: 'Relay Courier',
\t\tcourierName: 'Nina Patel',
\t\tvehicle: 'Bike 42',
\t\ttrackingUrl: '/orders/ord_20482/track',
\t\tproofRequired: true
\t},
\tcheckpoints: [
\t\t{ key: 'packed', label: 'Packed', status: 'complete', occurredAt: '2026-06-11T12:10:00Z' },
\t\t{ key: 'handoff', label: 'Courier handoff', status: 'complete', occurredAt: '2026-06-11T15:18:00Z' },
\t\t{ key: 'nearby', label: 'Nearby', status: 'current', occurredAt: null },
\t\t{ key: 'delivered', label: 'Delivered', status: 'upcoming', occurredAt: null }
\t],
\tinstructions: {
\t\tdropoff: 'Leave with reception',
\t\taccessCode: '2048',
\t\tcontactless: true,
\t\tnotes: 'Reception closes at 18:00.'
\t},
\texceptions: [],
\tproof: null,
\trevision: 9
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Realtime updates</h3>
						<p class="mt-2">The demo sync route advances a deterministic checkpoint. In production, ingest signed carrier webhooks or a realtime stream, then map noisy events into stable customer states.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Exception rules</h3>
						<p class="mt-2">Represent each blocker as an action with a due time, owner, resolution payload, and backend validation result. This keeps support tooling and customer UI aligned.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Carrier adapters, signed webhook ingestion, durable proof media, pickup-point selection, and reschedule dialogs are the natural production extensions.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
