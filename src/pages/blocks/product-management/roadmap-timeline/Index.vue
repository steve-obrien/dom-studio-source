<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import Example from '../../../_layout/docs/Example.vue';
import RoadmapTimeline from './examples/RoadmapTimeline.vue';
import RoadmapTimelineSrc from './examples/RoadmapTimeline.vue?raw';

const endpoints = [
	['GET', '/bootstrap', 'Read initiatives, dependencies, health history, audience releases, catalogs, and portfolio summaries.'],
	['POST', '/initiatives', 'Create a validated initiative with an outcome, team, owner, objective, and planning window.'],
	['PATCH', '/initiatives/:id', 'Persist exact-revision planning, health, ownership, confidence, and audience visibility.'],
	['POST', '/initiatives/:id/move-preview', 'Calculate dependency, downstream, and team-capacity impact for a proposed window.'],
	['POST', '/initiatives/:id/move', 'Commit an acknowledged schedule preview or reject stale planning evidence.'],
	['POST', '/initiatives/:id/updates', 'Post health and progress with optional stakeholder delivery evidence.'],
	['POST', '/publish-preview', 'Build a frozen audience view with inclusion, exclusion, redaction, and warning details.'],
	['POST', '/publish', 'Release an exact audience preview and retain an immutable publication receipt.'],
];
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Roadmap Timeline Block"
			tagline="A complete portfolio-planning section with initiatives, dependency-aware schedule previews, health updates, and audience-specific roadmap releases."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Product management" title="Portfolio roadmap workspace">
				<Example
					:source="RoadmapTimelineSrc"
					filename="RoadmapTimeline.vue"
					presentation="iframe"
					frame-src="/blocks/product-management/roadmap-timeline/preview/RoadmapTimeline"
					description="This is a working app section rather than a timeline screenshot: create an initiative, edit its planning contract, preview dependency impact, post a health update, publish an audience view, reload persisted state, and exercise validation or exact-revision conflicts through HTTP endpoints."
					default-open
					:preview-lines="14"
				>
					<RoadmapTimeline />
				</Example>
			</DocSection>

			<DocSection eyebrow="Review" title="What changed in this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The earlier example rendered local arrays as a long card dashboard, used native selects, exposed incorrect selected values, and forced the desktop timeline to scroll sideways on a phone.
						The reviewed version combines Linear’s dense project timeline and detail inspector with Productboard’s audience-aware roadmap publishing model.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>DomAppShell</code> owns the viewport, internal panels own scrolling, and compact layouts switch to quarter-grouped roadmap, initiative detail, and release destinations.</li>
						<li><code>DomSelect</code> replaces every native select with searchable, descriptive choices for views, owners, teams, objectives, health, periods, and audiences.</li>
						<li>The timeline keeps initiative-level planning separate from issue delivery while surfacing progress, health, ownership, dependencies, milestones, customer impact, and confidence.</li>
						<li>Schedule changes are previewed against upstream dependencies, downstream targets, concurrent team work, and exact record revisions before commit.</li>
						<li>Health updates and audience releases return notification and publication evidence rather than ending at an inert button.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Working roadmap lifecycle">
				<div class="overflow-hidden border border-border text-sm">
					<div class="grid grid-cols-[7rem_minmax(0,1fr)] gap-px bg-border sm:grid-cols-[7rem_16rem_minmax(0,1fr)]">
						<div class="bg-secondary p-3 font-semibold">Method</div>
						<div class="hidden bg-secondary p-3 font-semibold sm:block">Endpoint</div>
						<div class="bg-secondary p-3 font-semibold">Responsibility</div>
						<template v-for="endpoint in endpoints" :key="endpoint[1]">
							<div class="bg-canvas p-3 font-mono text-xs">{{ endpoint[0] }}</div>
							<div class="hidden bg-canvas p-3 font-mono text-xs sm:block">{{ endpoint[1] }}</div>
							<div class="bg-canvas p-3 leading-6 text-muted-fg">{{ endpoint[2] }}</div>
						</template>
					</div>
				</div>
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-px overflow-hidden border border-border bg-border text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="bg-canvas p-4"><h3 class="font-semibold text-canvas-fg">Planning certainty</h3><p class="mt-2">Keep broad periods when a project is uncertain. Exact dates belong in delivery systems and should only appear when the planning confidence supports them.</p></div>
					<div class="bg-canvas p-4"><h3 class="font-semibold text-canvas-fg">Audience contracts</h3><p class="mt-2">Store audience visibility independently from status. A customer roadmap needs server-owned inclusion and redaction rules, not a client-side display filter.</p></div>
					<div class="bg-canvas p-4"><h3 class="font-semibold text-canvas-fg">Production adapter</h3><p class="mt-2">The demo retains process-local state. Replace the server module with authenticated database models, project-system sync, durable delivery jobs, and immutable audit storage.</p></div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
