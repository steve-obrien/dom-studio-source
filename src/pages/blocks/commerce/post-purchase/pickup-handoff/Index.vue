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
			tagline="A mobile-first post-purchase flow for local pickup arrival, order verification, item readiness, substitutions, and contactless handoff."
			tag="Commerce UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Commerce" title="Pickup handoff flow">
				<Example
					:source="PickupHandoffFlowSrc"
					filename="PickupHandoffFlow.vue"
					presentation="iframe"
					frame-src="/blocks/commerce/post-purchase/pickup-handoff/preview/PickupHandoffFlow"
					description="Copy this into grocery, retail, marketplace, rental, pharmacy, field-service, or BOPIS apps that need a focused customer pickup experience. Replace the sample order with your fulfilment state, verification rules, item exceptions, and handoff events."
					default-open
					:preview-lines="18"
				>
					<PickupHandoffFlow />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when customers or field staff need to complete a pickup without opening a full admin workspace.
						The layout keeps arrival method, pickup code, item readiness, substitutions, ID checks, and handoff completion inside a compact mobile flow with a sticky action sheet.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Load pickup state from your order API with customer-facing ETA, store location, parking bay, verification rules, item readiness, and exception requirements.</li>
						<li>Verify pickup codes server-side before completing a handoff. Treat the code field as intent capture, not proof by itself.</li>
						<li>Model each item with readiness, substitution, temperature, restricted-item, and staff-note fields so fulfilment teams can explain delays clearly.</li>
						<li>Persist arrival method and bay updates quickly through a lightweight endpoint or realtime channel so staff can stage the order.</li>
						<li>Write handoff events to the order timeline with actor, timestamp, verification method, exception state, and proof details for support and fraud review.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended pickup payload">
				<CodeBlock lang="js" filename="pickup-handoff.js" :code="`{
\torder: {
\t\tid: 'ord_7831',
\t\tnumber: 'PU-7831',
\t\tcustomerName: 'Maya Chen',
\t\tstatus: 'arrived',
\t\tpickupWindow: { startsAt: '2026-06-11T16:30:00Z', endsAt: '2026-06-11T17:00:00Z' }
\t},
\tlocation: {
\t\tname: 'Soho Market',
\t\taddress: '18 Broadwick Street',
\t\tbay: 'B2',
\t\tarrivalMethod: 'Curbside'
\t},
\tverification: {
\t\tpickupCode: '4821',
\t\trequiresIdCheck: true,
\t\tverifiedAt: null
\t},
\titems: [
\t\t{ id: 'cold-bag', name: 'Chilled meal kit', quantity: 1, ready: true, temperature: 'Cold chain' },
\t\t{ id: 'oat-milk', name: 'Oat milk multipack', quantity: 2, ready: false, substitution: 'Barista blend' }
\t],
\thandoff: {
\t\tcontactless: true,
\t\tsubstitutionsAccepted: true,
\t\tcompletedAt: null,
\t\tevents: []
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Verification rules</h3>
						<p class="mt-2">Keep the UI optimistic, but complete handoff only after the backend validates pickup code, order state, restricted-item checks, and pickup window rules.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Exception handling</h3>
						<p class="mt-2">Represent substitutions, missing items, ID checks, and late arrivals as explicit blockers with clear customer copy and staff-owned resolution events.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include QR scanning, geofence arrival, staff assignment, proof photo capture, partial handoff, and realtime kitchen or warehouse status.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
