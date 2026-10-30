<script setup>
import { ref } from 'vue';
import { DomActivityTimeline, DomDataGrid, DomToggleButtonGroup } from '../../../lib/vue';

const activeView = ref('timeline');
const viewOptions = [
	{ value: 'timeline', label: 'Timeline' },
	{ value: 'grid', label: 'Data grid' },
];
const rows = ref([
	{
		id: 'activity-104',
		title: 'Production rollout completed',
		description: 'Release 2026.08.4 reached every production workspace after the final health check.',
		createdAt: '2026-08-12T10:42:00.000Z',
		actor: 'Deployment worker',
		status: 'completed',
		tone: 'success',
		category: 'deployment',
	},
	{
		id: 'activity-103',
		title: 'Approval recorded',
		description: 'Maya approved the exact release checksum and retained the policy evidence.',
		createdAt: '2026-08-12T10:16:00.000Z',
		actor: 'Maya Chen',
		status: 'approved',
		tone: 'primary',
		category: 'approval',
	},
	{
		id: 'activity-102',
		title: 'Readiness warning resolved',
		description: 'The missing rollback receipt was attached and the release returned to a ready state.',
		createdAt: '2026-08-12T09:54:00.000Z',
		actor: 'Owen Reed',
		status: 'resolved',
		tone: 'warning',
		category: 'evidence',
	},
	{
		id: 'activity-101',
		title: 'Release candidate created',
		description: 'A candidate was created from commit 93ab7a with the production configuration snapshot.',
		createdAt: '2026-08-12T09:31:00.000Z',
		actor: 'Priya Shah',
		status: 'created',
		tone: 'neutral',
		category: 'release',
	},
]);
const columns = [
	{ key: 'title', label: 'Activity', width: '18rem' },
	{ key: 'category', label: 'Category', type: 'select' },
	{ key: 'status', label: 'Status', type: 'select' },
	{ key: 'actor', label: 'Actor', type: 'select' },
	{ key: 'createdAt', label: 'Occurred', type: 'date' },
];

/**
 * Formats an ISO timestamp consistently across server and browser rendering.
 *
 * @param {unknown} value Raw resource timestamp.
 * @returns {string} London-local activity timestamp.
 */
function formatActivityTimestamp(value) {
	const date = new Date(String(value || ''));
	if (Number.isNaN(date.getTime())) return String(value || '');
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: 'Europe/London',
	}).format(date);
}
</script>

<template>
	<div class="w-full min-w-0 space-y-4" data-testid="shared-resource-activity">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<p class="text-sm font-semibold text-canvas-fg">Release activity</p>
				<p class="mt-1 text-xs text-muted-fg">One application-owned collection, two projections.</p>
			</div>
			<DomToggleButtonGroup v-model="activeView" :options="viewOptions" size="sm" aria-label="Activity view" />
		</div>

		<div v-if="activeView === 'timeline'" class="rounded-xl border border-border skin-card p-4 sm:p-5">
			<DomActivityTimeline
				:rows="rows"
				:format-timestamp="formatActivityTimestamp"
				layout="split"
				aria-label="Release activity"
			/>
		</div>

		<DomDataGrid
			v-else
			:rows="rows"
			:columns="columns"
			title="Release activity"
			resource-label="events"
			:selectable="false"
			:show-column-letters="false"
			height="25rem"
		/>

		<p class="text-xs leading-5 text-muted-fg">
			Both views receive the same <code class="text-canvas-fg">rows</code>. The timeline reads logical fields directly and preserves the order supplied by the application.
		</p>
	</div>
</template>
