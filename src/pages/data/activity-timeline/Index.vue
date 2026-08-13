<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import CodePanel from '../../_layout/docs/CodePanel.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import { DomActivityTimeline } from '../../lib/vue';
import DomActivityTimelineSrc from './DomActivityTimeline.vue?raw';
import AuditTrail from './examples/AuditTrail.vue';
import AuditTrailSrc from './examples/AuditTrail.vue?raw';
import ServerActivityTimeline from './examples/ServerActivityTimeline.vue';
import ServerActivityTimelineSrc from './examples/ServerActivityTimeline.vue?raw';
import SharedResourceActivity from './examples/SharedResourceActivity.vue';
import SharedResourceActivitySrc from './examples/SharedResourceActivity.vue?raw';
import StoreSrc from './examples/useActivityTimelineDemoStore.js?raw';
import MockApiSrc from './examples/activityTimelineMockApi.js?raw';

const doc = DomActivityTimeline.__doc;
const resourceApiCode = `// The API returns application records keyed by logical field names.
const response = await fetch('/api/releases/release-208/activity');
const result = await response.json();

// No timeline-specific DTO is required.
<DomActivityTimeline
\t:rows="result.data"
\trow-key="id"
\ttitle-key="action"
\tdescription-key="detail"
\ttimestamp-key="createdAt"
\tmeta-key="actor"
\tstatus-key="status"
\ttone-key="tone"
/>

// Response shape
{
\tdata: [
\t\t{
\t\t\tid: 'activity-104',
\t\t\taction: 'Production rollout completed',
\t\t\tdetail: 'Release 2026.08.4 reached every workspace.',
\t\t\tcreatedAt: '2026-08-12T10:42:00.000Z',
\t\t\tactor: 'Deployment worker',
\t\t\tstatus: 'completed',
\t\t\ttone: 'success',
\t\t},
\t],
\tpageInfo: {
\t\tstrategy: 'cursor',
\t\tnextCursor: 'activity-104',
\t\thasNextPage: true,
\t},
}`;

const playgroundRows = [
	{ id: 3, title: 'Deployment complete', description: 'All health checks passed.', createdAt: '10:42', actor: 'Deploy worker', status: 'completed', tone: 'success' },
	{ id: 2, title: 'Approval recorded', description: 'The release checksum was approved.', createdAt: '10:16', actor: 'Maya Chen', status: 'approved', tone: 'primary' },
	{ id: 1, title: 'Candidate created', description: 'Release evidence was assembled.', createdAt: '09:31', actor: 'Priya Shah', status: 'created', tone: 'neutral' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Resource API" title="Cursor-paginated activity store">
				<Example
					:source="ServerActivityTimelineSrc"
					filename="ServerActivityTimeline.vue"
					description="A Pinia resource store maps scope, scopeId, type, cursor, and limit onto a GET endpoint. It owns refresh, stale-request protection, filtering, pagination, deduplication, and errors; the timeline receives only rows and loading state."
					:preview-lines="0"
				>
					<ServerActivityTimeline />
				</Example>
				<div class="mt-4 grid gap-4 xl:grid-cols-2">
					<CodePanel
						class="overflow-hidden rounded-lg border border-border"
						:source="StoreSrc"
						:preview-lines="22"
						:default-open="false"
						:border-top="false"
						filename="useActivityTimelineStore.js"
						lang="js"
					/>
					<CodePanel
						class="overflow-hidden rounded-lg border border-border"
						:source="MockApiSrc"
						:preview-lines="22"
						:default-open="false"
						:border-top="false"
						filename="activityTimelineApi.js"
						lang="js"
					/>
				</div>
			</DocSection>

			<DocSection eyebrow="Shared resources" title="Timeline and grid from the same rows">
				<Example
					:source="SharedResourceActivitySrc"
					filename="SharedResourceActivity.vue"
					description="Switch between timeline and grid projections without translating the application's release-activity rows. Both components use the same stable id and logical field names."
					:preview-lines="0"
				>
					<SharedResourceActivity />
				</Example>
			</DocSection>

			<DocSection eyebrow="Field mapping" title="Audit fields and application actions">
				<Example
					:source="AuditTrailSrc"
					filename="AuditTrail.vue"
					description="Map existing action, detail, principal, outcome, and severity fields by name. The actions slot receives the untouched source row so receipt inspection stays in the application."
					:preview-lines="0"
				>
					<AuditTrail />
				</Example>
			</DocSection>

			<DocSection eyebrow="Playground" title="Presentation and states">
				<Playground
					:inspect="DomActivityTimeline"
					:initial="{ rows: playgroundRows, layout: 'stacked', density: 'comfortable', loading: false }"
					title="Activity timeline playground"
					description="Adjust layout, density, field mappings, labels, loading, and empty-state presentation without changing the resource rows."
				/>
			</DocSection>

			<DocSection eyebrow="Architecture" title="Controlled resource projection">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						<code class="text-canvas-fg">DomActivityTimeline</code> accepts the same application-owned
						<code class="text-canvas-fg">rows</code> and string-or-function
						<code class="text-canvas-fg">rowKey</code> contract as other DOM Studio data components. Field props are logical names, so an ActiveRecord-style serialized row can be rendered directly.
					</p>
					<p>
						The component preserves supplied order. The application or resource-query layer owns chronology, cursor pagination, refresh, cancellation, permissions, and persistence. The documented Pinia store is an integration example rather than part of the component contract. Passing
						<code class="text-canvas-fg">loading</code> only changes accessible presentation; it never triggers a request.
					</p>
					<p>
						The public <code class="text-canvas-fg">activityTimelineProps</code> export supports wrapper components and Studio tooling. Generated declarations also expose
						<code class="text-canvas-fg">ResourceFieldResolver</code>, <code class="text-canvas-fg">ResourceKeyResolver</code>,
						<code class="text-canvas-fg">ActivityTimelineRecord</code>, and <code class="text-canvas-fg">ActivityTimelineSlotPayload</code>.
					</p>
				</div>
				<CodePanel
					class="mt-5 overflow-hidden rounded-lg border border-border"
					:source="resourceApiCode"
					:preview-lines="0"
					:default-open="false"
					:border-top="false"
					filename="activity-resource-api.vue"
					lang="vue"
				/>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomActivityTimeline" :source="DomActivityTimelineSrc" />
				<ComponentSlots :component="DomActivityTimeline" :source="DomActivityTimelineSrc" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
