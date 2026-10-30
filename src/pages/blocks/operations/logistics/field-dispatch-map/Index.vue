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
			tagline="A working field-service operations section with live routes, exact assignment review, driver communications, provider evidence, and a repository-local API."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations / Logistics" title="Field dispatch map">
				<Example
					:source="FieldDispatchMapSrc"
					filename="FieldDispatchMap.vue"
					presentation="iframe"
					frame-src="/blocks/operations/logistics/field-dispatch-map/preview/FieldDispatchMap"
					description="Exercise the complete dispatch path: triage the attention queue, inspect live routes, review an exact assignment, dispatch the stop, message the technician, and verify retained provider evidence."
					default-open
					:preview-lines="20"
				>
					<FieldDispatchMap />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when dispatchers need to coordinate technicians, vehicles, customer windows, and unassigned work without moving between disconnected tools.
						Its map-first live board and attention queue take cues from ServiceTitan and Onfleet, while exact checks and retained operational evidence make the example useful beyond a visual mock.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Copy <code>FieldDispatchMap.vue</code>; all navigation, fields, statuses, dialogs, progress, feedback, and evidence views use public DOM Studio components.</li>
						<li>Start from <code>GET /api/block-demos/field-dispatch/bootstrap</code>, then keep the returned workspace revision and route or stop versions with every command.</li>
						<li>Use the preview endpoint before commit. It locks the exact stop, route, versions, arrival, capacity, skills, vehicle capability, territory, and customer-window checks behind one checksum.</li>
						<li>Refresh provider-owned GPS evidence separately from assignment state, and retain delivery receipts for every driver-facing update.</li>
						<li>Replace the deterministic in-memory adapter with your database, map, routing, telemetry, and messaging providers without changing the UI contract.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Working assignment contract">
				<CodeBlock lang="js" filename="dispatch-assignment.js" :code="`const workspace = await fetch(
	'/api/block-demos/field-dispatch/bootstrap'
).then((response) => response.json())

const preview = await fetch(
	'/api/block-demos/field-dispatch/assignments/preview',
	{
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			revision: workspace.workspace.revision,
			stopId: workspace.selectedStop.id,
			stopVersion: workspace.selectedStop.version,
			routeId: workspace.selectedRoute.id,
			routeVersion: workspace.selectedRoute.version
		})
	}
).then((response) => response.json())

const committed = await fetch(
	'/api/block-demos/field-dispatch/assignments/commit',
	{
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			revision: preview.workspace.revision,
			previewChecksum: preview.assignmentPreview.checksum,
			acknowledged: true
		})
	}
).then((response) => response.json())

console.log(committed.assignmentReceipt.providerReceipt)`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Map provider</h3>
						<p class="mt-2">The demo uses a generated cartographic raster with accessible DOM Studio marker controls. Production adapters can bind the same route and stop positions to Mapbox, Google Maps, Leaflet, or an internal SDK.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Server authority</h3>
						<p class="mt-2">The API owns revisions, entity versions, assignment checks, checksums, receipts, and conflicts. The browser renders recommendations and submits acknowledged commands; it never becomes dispatch truth.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Production boundary</h3>
						<p class="mt-2">Move the process-memory store to durable transactions, execute route optimization asynchronously, validate provider webhooks, authorize every territory, and keep an immutable operator audit before production use.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
