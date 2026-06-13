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
			tagline="A copyable post-purchase tracking surface for live order status, courier handoff, delivery instructions, and customer-visible exceptions."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Commerce" title="Live delivery tracker">
				<Example
					:source="DeliveryTrackerSrc"
					filename="DeliveryTracker.vue"
					presentation="iframe"
					frame-src="/blocks/commerce/post-purchase/delivery-tracker/preview/DeliveryTracker"
					description="Copy this into commerce, marketplace, food delivery, logistics, field service, or appointment apps that need a customer-facing delivery status view."
					default-open
					:preview-lines="20"
				>
					<DeliveryTracker />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when customers need to understand where an order is, what happens next, and how to fix delivery problems without contacting support.
						The block keeps ETA, route progress, courier details, delivery notes, exception handling, and order context in one compact surface.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Load fulfilment state from your order API with a normalized status, ETA window, courier assignment, handoff location, route checkpoints, and proof-of-delivery requirements.</li>
						<li>Persist delivery instructions separately from the order line items so customers can update access codes, drop-off preferences, and contact rules close to delivery time.</li>
						<li>Model exceptions as explicit customer actions, such as missing access code, address confirmation, weather delay acknowledgement, pickup fallback, or failed delivery reschedule.</li>
						<li>Connect courier updates through polling, webhooks, or a realtime channel, then collapse noisy events into a few customer-readable timeline steps.</li>
						<li>Keep final fulfilment decisions server-owned. The UI can collect intent, but the backend should validate cutoff windows, carrier rules, fraud checks, and refund eligibility.</li>
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
\texceptions: [
\t\t{ key: 'access_code', severity: 'warning', actionRequired: true, resolved: false }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Realtime updates</h3>
						<p class="mt-2">Use carrier webhooks or a realtime stream for raw events, then map them into stable customer states so the view does not flicker between noisy courier scans.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Exception rules</h3>
						<p class="mt-2">Represent each blocker as an action with a due time, owner, resolution payload, and backend validation result. This keeps support tooling and customer UI aligned.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Reusable route maps, carrier adapters, proof-of-delivery capture, pickup-point selection, and reschedule dialogs would make this block stronger.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
