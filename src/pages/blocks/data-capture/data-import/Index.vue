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
			tagline="A copyable CSV import workflow for mapping uploaded columns, validating records, and approving clean data before it enters an app."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Data capture" title="Customer import mapper">
				<Example
					:source="CustomerImportMapperSrc"
					filename="CustomerImportMapper.vue"
					presentation="iframe"
					frame-src="/blocks/data-capture/data-import/preview/CustomerImportMapper"
					description="Copy this into CRM, admin, billing, marketplace, or migration tools. Replace the sample columns and validation issues with your upload parser, then connect the review actions to an import job API."
					default-open
					:preview-lines="18"
				>
					<CustomerImportMapper />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when users bring external data into your product and need confidence before creating records.
						It makes upload progress, field mapping, required field coverage, validation issues, sample rows, and final approval visible in one responsive workflow.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Parse the file on the server or in a worker, then pass detected columns, row counts, sample rows, and inferred field matches into the component.</li>
						<li>Store mappings as <code>{ targetField: sourceColumn }</code> so they can be submitted directly to a bulk import endpoint.</li>
						<li>Run validation after every mapping change for required fields, duplicate identifiers, invalid dates, blocked domains, and permission-sensitive columns.</li>
						<li>Create the import as an asynchronous job and stream progress back into the summary cards after the user approves the review step.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended import payload">
				<CodeBlock lang="js" filename="customer-import-job.js" :code="`{
\tfile: {
\t\tname: 'customer-import-june.csv',
\t\trowCount: 1284,
\t\tcolumns: ['Company', 'Primary email', 'Plan', 'Renewal date']
\t},
\tmapping: {
\t\tcompanyName: 'Company',
\t\temail: 'Primary email',
\t\tplan: 'Plan',
\t\trenewalDate: 'Renewal date'
\t},
\tvalidation: {
\t\tvalidRows: 1216,
\t\twarningRows: 52,
\t\tblockedRows: 16
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Upload parsing</h3>
						<p class="mt-2">Keep file parsing outside the component. Feed it normalized columns, previews, and row-level errors so the UI remains portable.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Validation model</h3>
						<p class="mt-2">Separate warnings from blockers. Let teams import valid rows while exporting rejected rows for correction when your product allows it.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">A reusable file dropzone, async job timeline, and saved mapping presets would make this block even faster to integrate.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
