<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import PickupHandoffFlow from './examples/PickupHandoffFlow.vue';
import PickupHandoffFlowSrc from './examples/PickupHandoffFlow.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Pickup Handoff Block"
			tagline="A working pickup-desk section with API-backed arrivals, item staging, customer verification, readiness gates, and final handoff proof."
			tag="Reviewed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Commerce" title="Pickup handoff flow">
				<Example
					:source="PickupHandoffFlowSrc"
					filename="PickupHandoffFlow.vue"
					presentation="iframe"
					frame-src="/blocks/commerce/post-purchase/pickup-handoff/preview/PickupHandoffFlow"
					description="Copy the responsive staff handoff experience and repository-local API contract into grocery, retail, marketplace, rental, pharmacy, field-service, or BOPIS products that need a focused pickup workflow."
					default-open
					:preview-lines="18"
					frame-flush-edges
				>
					<PickupHandoffFlow />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when store staff need to take an arrived order from preparation through a verified customer handoff.
						Its Target Drive Up- and Shopify POS-inspired hierarchy puts wait time, the current blocker, and the next staff action before secondary order detail.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/pickup-handoff/orders</code> and <code>GET /api/block-demos/pickup-handoff/:orderId</code> provide the active pickup queue and normalized order detail.</li>
						<li><code>PATCH /api/block-demos/pickup-handoff/:orderId/arrival</code> persists rich <code>DomSelect</code> arrival and pickup-spot choices with the staff note.</li>
						<li><code>POST /api/block-demos/pickup-handoff/:orderId/items/:itemId/stage</code> records preparation changes, including substitutions and restricted items.</li>
						<li>The preferences and verification routes save the customer decision, contactless mode, four-digit pickup code, and any required photo-ID check.</li>
						<li><code>POST /api/block-demos/pickup-handoff/:orderId/complete</code> rejects incomplete orders and records immutable handoff proof only after every server-owned readiness check passes.</li>
						<li>The process-local demo store survives preview reloads but resets with the server. Replace it with durable order storage, authorization, event ingestion, and fraud controls in production.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended pickup payload">
				<CodeBlock lang="js" filename="pickup-handoff.js" :code="`{
\tid: 'ord_7831',
\tnumber: 'PU-7831',
\tstatus: 'arrived',
\tcustomer: { name: 'Maya Chen', vehicle: 'Blue hatchback' },
\tarrival: { method: 'curbside', spot: 'B2', note: 'Trunk is open.' },
\tverification: { codeVerifiedAt: null, requiresIdCheck: true, idCheckedAt: null },
\tpreferences: { contactless: true, substitutionsAccepted: false },
\titems: [
\t\t{ id: 'cold-bag', name: 'Chilled meal kit', ready: true, restricted: false },
\t\t{ id: 'oat-milk', name: 'Oat milk multipack', ready: false, substitution: { name: 'Barista blend multipack' } },
\t\t{ id: 'mixer-case', name: 'Sparkling mixer case', ready: true, restricted: true }
\t],
\tchecks: [
\t\t{ key: 'items', label: 'Items staged', passed: false },
\t\t{ key: 'code', label: 'Pickup code', passed: false },
\t\t{ key: 'identity', label: 'Restricted item check', passed: false }
\t],
\tprogress: 20,
\tnextAction: { key: 'items', label: 'Stage remaining items' },
\trevision: 12,
\tproof: null
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Verification rules</h3>
						<p class="mt-2">The demo API validates pickup code, optimistic revision, staged items, substitution consent, restricted-item ID, and final order state before completion.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Exception handling</h3>
						<p class="mt-2">Represent substitutions, missing items, ID checks, and late arrivals as explicit blockers with clear customer copy and staff-owned resolution events.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">QR scanning, geofence arrival, staff assignment, durable proof media, partial handoff, and realtime staging events are the natural production extensions.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
