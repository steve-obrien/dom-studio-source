<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import FormOperationsWorkspace from './examples/FormOperationsWorkspace.vue';
import FormOperationsWorkspaceSrc from './examples/FormOperationsWorkspace.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Form Operations Block"
			tagline="A working form lifecycle section with revisioned composition, publication proof, public submission, and response triage."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Data capture" title="Form operations workspace">
				<Example
					:source="FormOperationsWorkspaceSrc"
					filename="FormOperationsWorkspace.vue"
					presentation="iframe"
					frame-src="/blocks/data-capture/forms/preview/FormOperationsWorkspace"
					description="A Typeform- and Airtable-inspired workspace built from DOM Studio controls. Compose a public intake, validate and publish an exact revision, submit the live form, then triage the response through repository API routes."
					default-open
					:preview-lines="20"
				>
					<FormOperationsWorkspace />
				</Example>
			</DocSection>

			<DocSection eyebrow="Lifecycle" title="What is already wired">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						This block demonstrates the whole form lifecycle instead of four disconnected layouts. Form settings, publication validation, public submissions,
						and response triage each have their own server-owned revision or receipt boundary.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Form setting saves reject stale revisions and invalidate earlier publication proof.</li>
						<li>Publication requires passing checks for the exact current revision plus explicit operator acknowledgement.</li>
						<li>The live form uses `DomForm`, rich `DomSelect`, `DomTagCombobox`, `DomRadioGroup`, and field-level server errors.</li>
						<li>Successful responses receive a reference and SHA-256 receipt before appearing in the response inbox.</li>
						<li>Response triage has an independent optimistic revision and requires a note before archival.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Publish and submit">
				<CodeBlock lang="js" filename="form-lifecycle.js" :code="`await fetch(\`/api/block-demos/form-operations/forms/\${form.id}/validate\`, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ revision: form.revision })
});

await fetch(\`/api/block-demos/form-operations/forms/\${form.id}/publish\`, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ revision: validated.revision, acknowledged: true })
});

await fetch(\`/api/block-demos/form-operations/forms/\${form.id}/submissions\`, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ values })
});`" />
			</DocSection>

			<DocSection eyebrow="Production" title="Adapting the demo service">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4"><h3 class="font-semibold text-canvas-fg">Durable definitions</h3><p class="mt-2">Move the process-local form and response records into your database while retaining independent optimistic revisions.</p></div>
					<div class="rounded-lg border border-border skin-card p-4"><h3 class="font-semibold text-canvas-fg">Public delivery</h3><p class="mt-2">Serve the published version through your application route, embed, or hosted form domain using the same submission contract.</p></div>
					<div class="rounded-lg border border-border skin-card p-4"><h3 class="font-semibold text-canvas-fg">Abuse controls</h3><p class="mt-2">Replace the deterministic email-domain check with rate limits, bot scoring, signed resume tokens, and a durable audit trail.</p></div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
