<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import CustomerImportMapper from './examples/CustomerImportMapper.vue';
import CustomerImportMapperSrc from './examples/CustomerImportMapper.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Data Import Block"
			tagline="A working customer-import section with server-owned mappings, validation proofs, error reports, and a resumable background job."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Data capture" title="Customer import mapper">
				<Example
					:source="CustomerImportMapperSrc"
					filename="CustomerImportMapper.vue"
					presentation="iframe"
					frame-src="/blocks/data-capture/data-import/preview/CustomerImportMapper"
					description="A HubSpot- and Airtable-inspired import workspace built from DOM Studio controls. The example calls repository API routes for revisioned mapping, policy validation, CSV error reports, and deterministic worker batches."
					default-open
					:preview-lines="18"
				>
					<CustomerImportMapper />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="What is already wired">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						This is an app section rather than a screenshot. Refreshing the frame resumes process-local server state, every mutation uses an optimistic revision,
						and job creation requires passing validation for the exact current revision plus explicit acknowledgement.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/data-import/bootstrap</code> returns the parsed file, reusable choices, and resumable session.</li>
						<li>Mapping and behavior endpoints reject stale revisions and return structured field errors for inline recovery.</li>
						<li>Validation creates server proof tied to the current session revision; later edits invalidate that proof.</li>
						<li>The job endpoint queues work, while the worker endpoint advances one deterministic batch and creates a SHA-256 completion proof.</li>
						<li>The report endpoint creates a downloadable blocked-row CSV and checksum-backed receipt.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Revisioned mutation pattern">
				<CodeBlock lang="js" filename="save-import-mapping.js" :code="`const response = await fetch(
	\`/api/block-demos/data-import/sessions/\${session.id}/mapping\`,
	{
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			revision: session.revision,
			preset: 'hubspot_customer',
			mapping: {
				companyName: 'company',
				email: 'primary_email',
				stage: 'lifecycle_stage'
			}
		})
	}
);

if (response.status === 409) {
	// Replace the local draft with error.session and try again.
}`" />
			</DocSection>

			<DocSection eyebrow="Production" title="Adapting the demo service">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Upload parsing</h3>
						<p class="mt-2">Replace the seeded parsed file with object storage and a parser worker. Keep previews and inferred types in the bootstrap response.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Durable state</h3>
						<p class="mt-2">Move the process-local session into your database and retain the same revision contract to prevent conflicting edits across tabs.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Real workers</h3>
						<p class="mt-2">Send the immutable job reference to your queue and replace the manual demo tick with polling, server events, or websocket progress.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
