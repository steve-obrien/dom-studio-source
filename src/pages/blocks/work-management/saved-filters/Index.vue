<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import SavedFilterBuilder from './examples/SavedFilterBuilder.vue';
import SavedFilterBuilderSrc from './examples/SavedFilterBuilder.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Saved Filters Block"
			tagline="An API-backed saved-view workspace for server-owned query rules, live issue results, explicit sharing, subscriber updates, exact previews, and auditable saves."
			tag="Productivity UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Work Management" title="Saved filter builder">
				<Example
					:source="SavedFilterBuilderSrc"
					filename="SavedFilterBuilder.vue"
					presentation="iframe"
					frame-src="/blocks/work-management/saved-filters/preview/SavedFilterBuilder"
					description="Copy this into an issue tracker, CRM, admin table, analytics product, or marketplace dashboard where people need reusable views backed by an authoritative query and permission model."
					default-open
					:preview-lines="20"
				>
					<SavedFilterBuilder />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a product has dense records and users need more than a one-off search box.
						The responsive composition keeps view discovery, live records, query editing, permissions, subscriptions, and immutable save evidence available without shrinking a three-column desktop dashboard into the iframe.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Load compact saved-view summaries first, then fetch one complete view and its evaluated records from the detail endpoint.</li>
						<li>Expose server-owned fields, operators, and allowed values through rich <code>DomSelect</code> and <code>DomTagCombobox</code> controls.</li>
						<li>Evaluate a draft against the API dataset before saving so the user can inspect matching work, query cost, permissions, and notification behavior.</li>
						<li>Persist only an acknowledged preview checksum at exact workspace and view revisions, returning structured validation or recoverable conflicts when state changes.</li>
						<li>Treat favorites, workspace or team visibility, subscriptions, activity, and audit receipts as product data instead of local presentation state.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended API payload">
				<CodeBlock lang="js" filename="saved-view.js" :code="`{
\tworkspace: { revision: 23, selectedViewId: 'view_launch_risk' },
\tview: {
\t\tid: 'view_launch_risk',
\t\tversion: 5,
\t\tname: 'Launch risks',
\t\tvisibility: 'workspace',
\t\talertMode: 'added'
\t},
\tmatchMode: 'all',
\trules: [
\t\t{ field: 'priority', operator: 'is_any_of', values: ['urgent', 'high'] },
\t\t{ field: 'status', operator: 'is_not', values: ['done'] }
\t],
\tpreview: {
\t\tchecksum: 'sha256:demo-de87b61a',
\t\tcount: 4,
\t\tpoints: 13,
\t\tqueryCost: 'low'
\t},
\treceipt: { id: 'view-save-8801', auditReceipt: 'audit:view-8801' }
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Query authority</h3>
						<p class="mt-2">Keep field, operator, value, cost, and permission rules authoritative on the server so saved views can safely power tables, exports, alerts, and automations.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Exact saves</h3>
						<p class="mt-2">Lock the evaluated query, matching count, audience, notifications, and view version into a checksum before applying a material shared-view change.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Responsive composition</h3>
						<p class="mt-2">Desktop exposes Views, Results, and Query together. Embedded and mobile widths make them first-class destinations through <code>DomAppBottomNav</code>.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
