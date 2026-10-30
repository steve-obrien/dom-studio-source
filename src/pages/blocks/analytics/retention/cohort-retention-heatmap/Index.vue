<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import CohortRetentionHeatmap from './examples/CohortRetentionHeatmap.vue';
import CohortRetentionHeatmapSrc from './examples/CohortRetentionHeatmap.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Cohort Retention Heatmap Block"
			tagline="A focused retention investigation workspace with responsive cohort comparison, rich selectors, accessible heatmap cells, and a working follow-up flow."
			tag="Reviewed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Analytics" title="Cohort retention heatmap">
				<Example
					:source="CohortRetentionHeatmapSrc"
					filename="CohortRetentionHeatmap.vue"
					presentation="iframe"
					frame-src="/blocks/analytics/retention/cohort-retention-heatmap/preview/CohortRetentionHeatmap"
					description="Copy this full-screen composition into product analytics and customer success tools where teams need to compare retention, isolate one cohort on smaller screens, and turn a selected cell into a follow-up."
					frame-flush-edges
					default-open
					:preview-lines="20"
				>
					<CohortRetentionHeatmap />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when teams need a fast read on activation quality, repeat usage, and early churn across cohorts.
						The matrix keeps cohort size, week-by-week retention, benchmark deltas, and a selected-cell insight together without forcing users into a complex reporting builder.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>cohorts</code> with server-generated cohort rows keyed by cohort start date, segment, acquisition source, plan, or activation milestone.</li>
						<li>Calculate retention on the backend from event streams, subscription state, or account activity. The UI should display trusted aggregates, not run analytics queries in the browser.</li>
						<li>Keep segment and compact-cohort choices in rich <code>DomSelect</code> controls so labels, counts, and explanatory context remain visible.</li>
						<li>On narrow viewports, show one selected cohort with its insight immediately below instead of shrinking or horizontally clipping the full matrix.</li>
						<li>Expose both user retention and revenue retention when monetization matters. Keep the same cohort IDs so users can compare behavior and commercial impact.</li>
						<li>Connect selected cells to saved investigations, experiment links, customer lists, lifecycle campaigns, or product work items so insight can become action.</li>
						<li>For large datasets, page or virtualize cohort rows and cache heatmap queries by segment, metric, granularity, and timezone.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended cohort payload">
				<CodeBlock lang="js" filename="cohort-retention.js" :code="`{
\tmetric: 'activated_users',
\tsegment: 'self_serve_teams',
\tgranularity: 'week',
\ttimezone: 'Europe/London',
\tcohorts: [
\t\t{
\t\t\tid: 'cohort_2026_05_04',
\t\t\tlabel: 'May 4',
\t\t\tstartsAt: '2026-05-04T00:00:00+01:00',
\t\t\tusers: 1280,
\t\t\trevenueAtStart: 38400,
\t\t\tretention: [
\t\t\t\t{ period: 0, retainedUsers: 1280, retainedRevenue: 38400 },
\t\t\t\t{ period: 1, retainedUsers: 845, retainedRevenue: 31490 },
\t\t\t\t{ period: 2, retainedUsers: 704, retainedRevenue: 29120 }
\t\t\t],
\t\t\tannotations: [
\t\t\t\t{ period: 2, label: 'Onboarding checklist experiment launched' }
\t\t\t]
\t\t}
\t],
\tbenchmarks: {
\t\tweekOneTarget: 64,
\t\tweekFourTarget: 38,
\t\triskThreshold: 30
\t}
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Cohort definitions</h3>
						<p class="mt-2">Define cohorts server-side and freeze each row's membership. Changing cohort logic retroactively can make retention trends impossible to trust.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Action linkage</h3>
						<p class="mt-2">Let selected cells open customer lists, experiment notes, or saved filters. Retention blocks are more valuable when they lead directly to product work.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include rolling cohorts, daily granularity, annotation overlays, CSV export, customer drilldown, experiment markers, and benchmark bands by segment.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
