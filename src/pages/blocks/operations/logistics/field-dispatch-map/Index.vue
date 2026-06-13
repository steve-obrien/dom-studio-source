<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import FieldDispatchMap from './examples/FieldDispatchMap.vue';
import FieldDispatchMapSrc from './examples/FieldDispatchMap.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Field Dispatch Map Block"
			tagline="A responsive, map-first operations surface for assigning field teams, reviewing route risk, and keeping stop windows on track."
			tag="Operations UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations / Logistics" title="Field dispatch map">
				<Example
					:source="FieldDispatchMapSrc"
					filename="FieldDispatchMap.vue"
					presentation="iframe"
					frame-src="/blocks/operations/logistics/field-dispatch-map/preview/FieldDispatchMap"
					description="Copy this into delivery, field-service, installation, inspection, healthcare visit, home services, or on-site support products that need a practical dispatch board."
					default-open
					:preview-lines="20"
				>
					<FieldDispatchMap />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when dispatchers need to coordinate technicians, routes, vehicles, route windows, and unassigned stops without switching between a table and a separate map.
						The composition keeps the map as the working surface, with filters above it, route health beneath it, and a bottom stop manifest for quick triage.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Copy <code>FieldDispatchMap.vue</code> together with the block-local <code>components</code> folder, or inline those small visual components in your own app.</li>
						<li>Replace the static route and stop arrays with backend records that include coordinates, service windows, vehicle constraints, skills, route status, and assignment ownership.</li>
						<li>Connect the assignment action to a command endpoint such as <code>POST /dispatch/assign-stop</code>, then refresh route capacity and ETA after server validation.</li>
						<li>Keep travel-time, traffic, vehicle capacity, and customer-window validation on the server. The UI should display recommendations, not become the source of truth.</li>
						<li>Swap the CSS map backdrop for Mapbox, Google Maps, Leaflet, or an internal geospatial canvas when production map tiles are required.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended dispatch payload">
				<CodeBlock lang="js" filename="dispatch-route.js" :code="`{
\tregion: 'central',
\ttimezone: 'Europe/London',
\troutes: [
\t\t{
\t\t\tid: 'route-maya',
\t\t\ttechnicianId: 'usr_1042',
\t\t\tname: 'Maya Chen',
\t\t\tvehicleId: 'van_14',
\t\t\tstatus: 'on_track',
\t\t\tcapacityPercent: 78,
\t\t\tskills: ['installation', 'vip', 'lift-gate'],
\t\t\tlocation: { lat: 51.518, lng: -0.102 },
\t\t\tstops: ['stop-101']
\t\t}
\t],
\tstops: [
\t\t{
\t\t\tid: 'stop-104',
\t\t\tcustomerId: 'cus_892',
\t\t\tcustomerName: 'Hearthside Lofts',
\t\t\tserviceWindow: {
\t\t\t\tstartsAt: '2026-06-11T12:00:00+01:00',
\t\t\t\tendsAt: '2026-06-11T14:00:00+01:00'
\t\t\t},
\t\t\trequirements: ['installation', 'lift-gate'],
\t\t\tstatus: 'needs_assignment',
\t\t\tlocation: { lat: 51.507, lng: -0.091 },
\t\t\tnotes: 'Building manager requested a smaller arrival window.'
\t\t}
\t],
\tassignment: {
\t\tstopId: 'stop-104',
\t\trouteId: 'route-maya',
\t\treason: 'skills_and_vehicle_match'
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Map provider</h3>
						<p class="mt-2">The example uses a CSS map-like canvas so it stays portable. In production, bind route and stop coordinates to your map SDK and keep marker controls keyboard accessible.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Dispatch commands</h3>
						<p class="mt-2">Treat assignment, reorder, hold, cancel, and message actions as auditable commands. Return validation errors for capacity, territory, customer window, and vehicle mismatch.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include drag-to-assign stops, route simulation, live driver GPS, traffic overlays, customer SMS status, proof-of-delivery uploads, and offline dispatch mode.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
