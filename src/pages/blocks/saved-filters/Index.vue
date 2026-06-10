<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Example from '../../_layout/docs/Example.vue';
import SavedFilterBuilder from './examples/SavedFilterBuilder.vue';
import SavedFilterBuilderSrc from './examples/SavedFilterBuilder.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Saved Filters Block"
			tagline="A responsive workspace for building reusable views, combining filter rules, previewing matching records, and sharing saved segments."
			tag="Productivity UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Work Management" title="Saved filter builder">
				<Example
					:source="SavedFilterBuilderSrc"
					filename="SavedFilterBuilder.vue"
					presentation="iframe"
					frame-src="/blocks/saved-filters/preview/SavedFilterBuilder"
					description="Copy this into a CRM, admin table, issue tracker, analytics product, or marketplace dashboard where people need reusable filtered views. Replace the local arrays with your records, fields, operators, saved views, and permission model."
					default-open
					:preview-lines="14"
				>
					<SavedFilterBuilder />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a product has dense records and users need more than a one-off search box.
						It gives teams a copyable structure for field filters, saved views, ownership, share status, preview rows, and change history.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>savedViews</code> with workspace or user-owned view records from your backend.</li>
						<li>Map <code>filterFields</code> to the fields your API can query, including allowed operators and value options.</li>
						<li>Apply rule changes optimistically in the UI, then persist them through a save endpoint when the user updates the view.</li>
						<li>Connect preview rows to a debounced search endpoint that returns counts, sample records, and warnings for expensive filters.</li>
						<li>Use the visibility and owner values to decide whether a view is personal, team-shared, locked, or editable.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended saved view shape">
				<CodeBlock lang="js" filename="saved-view.js" :code="`{
\tid: 'view_high_value_trials',
\tname: 'High-value trials',
\tdescription: 'Trials with enterprise fit and recent product activity.',
\towner: 'Maya Chen',
\tvisibility: 'Team',
\tupdatedAt: 'Today 10:18',
\tmatchMode: 'all',
\trules: [
\t\t{ id: 'rule_1', field: 'Plan fit', operator: 'is', value: 'Enterprise' },
\t\t{ id: 'rule_2', field: 'Product usage', operator: 'above', value: '70%' }
\t],
\tmetrics: { matches: 128, conversion: '18.4%', revenue: '$94k' },
\tactivity: [
\t\t{ label: 'Rule added', actor: 'Maya Chen', time: 'Today 10:18' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Rule evaluation</h3>
						<p class="mt-2">Keep the UI rule model close to your API query grammar so saved views can be reused across tables, exports, alerts, and automations.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Sharing model</h3>
						<p class="mt-2">Treat team views as shared objects with ownership, edit permissions, and audit events instead of plain local preferences.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include a reusable rule row component, nested rule groups, saved-view permissions, export actions, and alert subscriptions.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
