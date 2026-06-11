<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import RoadmapTimeline from './examples/RoadmapTimeline.vue';
import RoadmapTimelineSrc from './examples/RoadmapTimeline.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Roadmap Timeline Block"
			tagline="A responsive roadmap planning workspace for sequencing product initiatives, spotting dependency risk, and preparing quarter-by-quarter launch decisions."
			tag="Product UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Product management" title="Roadmap timeline workspace">
				<Example
					:source="RoadmapTimelineSrc"
					filename="RoadmapTimeline.vue"
					presentation="iframe"
					frame-src="/blocks/product-management/roadmap-timeline/preview/RoadmapTimeline"
					description="Copy this into product planning tools, customer roadmap portals, founder dashboards, or internal strategy apps. Replace the local lane, quarter, initiative, and update arrays with your roadmap API or project management data."
					default-open
					:preview-lines="16"
				>
					<RoadmapTimeline />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when product teams need to communicate what is planned, why it matters, where confidence is changing, and which dependencies can block launch.
						It is shaped for SaaS roadmap pages, customer-facing product portals, internal planning reviews, and executive status meetings.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>initiatives</code> with roadmap records from your product database, issue tracker, or planning system.</li>
						<li>Persist <code>laneId</code>, <code>start</code>, <code>span</code>, <code>status</code>, <code>confidence</code>, and <code>owner</code> through an authenticated roadmap endpoint.</li>
						<li>Model dependencies as stable initiative IDs so blockers can be calculated server-side and shown consistently in list, timeline, and detail views.</li>
						<li>Connect customer impact to CRM, feedback, support, or revenue records instead of relying on manual labels.</li>
						<li>Use the horizon and risk tabs to create saved roadmap views for leadership reviews, customer advisory boards, or release planning rituals.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended roadmap payload">
				<CodeBlock lang="js" filename="roadmap-initiative.js" :code="`{
\tid: 'initiative_ai_inbox',
\ttitle: 'AI inbox summaries',
\tlaneId: 'activation',
\tstatus: 'Build',
\towner: 'Maya Chen',
\tstart: 2,
\tspan: 2,
\tconfidence: 78,
\timpact: 'High',
\tcustomers: 36,
\trevenueInfluenced: 128000,
\tdependencies: ['initiative_event_stream'],
\tlaunchWindow: 'Q3 2026',
\tlastUpdatedAt: '2026-06-11T16:22:00Z',
\tmilestones: [
\t\t{ label: 'Prototype approved', complete: true },
\t\t{ label: 'Beta cohort selected', complete: false }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Timeline math</h3>
						<p class="mt-2">Store dates as real timestamps, then map them to quarter columns in the UI. Keep the grid derived so fiscal calendar changes do not corrupt roadmap data.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Decision history</h3>
						<p class="mt-2">Treat status, confidence, and launch-window changes as auditable planning decisions with actor, reason, and customer visibility fields.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include drag-to-reschedule, dependency connectors, customer-visible roadmap mode, capacity overlays, Jira or Linear sync, and release note handoff.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
