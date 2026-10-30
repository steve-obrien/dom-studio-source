<script setup>
import { computed, ref } from 'vue';
import { DomDataGrid, DomKanban, DomMonthCalendar } from '../../../lib/vue';

const activeView = ref('kanban');
const boardColumns = ref([
	{ key: 'backlog', label: 'Backlog' },
	{ key: 'planned', label: 'Planned' },
	{ key: 'active', label: 'Active', limit: 3 },
	{ key: 'complete', label: 'Complete' },
]);
const resources = ref([
	{ id: 'feature-101', title: 'Team invitation roles', owner: 'Maya', status: 'backlog', position: 0, dueDate: '2026-08-10', effort: 3 },
	{ id: 'feature-102', title: 'Invoice PDF export', owner: 'Owen', status: 'planned', position: 0, dueDate: '2026-08-12', effort: 5 },
	{ id: 'feature-103', title: 'Saved grid filters', owner: 'Priya', status: 'planned', position: 1, dueDate: '2026-08-15', effort: 2 },
	{ id: 'feature-104', title: 'Usage alert emails', owner: 'Maya', status: 'active', position: 0, dueDate: '2026-08-18', effort: 3 },
	{ id: 'feature-105', title: 'Workspace audit log', owner: 'Owen', status: 'active', position: 1, dueDate: '2026-08-20', effort: 8 },
	{ id: 'feature-106', title: 'Billing portal refresh', owner: 'Priya', status: 'complete', position: 0, dueDate: '2026-08-08', effort: 5 },
]);
const gridColumns = computed(() => [
	{ key: 'title', label: 'Feature', width: '18rem' },
	{ key: 'status', label: 'Board column', type: 'select', options: boardColumns.value.map(mapBoardColumnOption) },
	{ key: 'owner', label: 'Owner', type: 'select' },
	{ key: 'dueDate', label: 'Due', type: 'date' },
	{ key: 'effort', label: 'Points', type: 'number' },
]);
const resourcesByDate = computed(() => {
	const grouped = {};
	resources.value.forEach(function groupResourceByDate(resource) {
		if (!grouped[resource.dueDate]) grouped[resource.dueDate] = [];
		grouped[resource.dueDate].push(resource);
	});
	return grouped;
});

/**
 * Maps a Kanban column to the select-option shape used by DomDataGrid.
 *
 * @param {{ key: string, label: string }} column Kanban column.
 * @returns {{ value: string, label: string }} Grid select option.
 */
function mapBoardColumnOption(column) {
	return { value: column.key, label: column.label };
}

/**
 * Returns resources scheduled for a calendar date.
 *
 * @param {string} date ISO calendar date.
 * @returns {Array<Record<string, unknown>>} Resources for the date.
 */
function resourcesForDate(date) {
	return resourcesByDate.value[date] || [];
}

/**
 * Builds the month-calendar drag payload for a shared resource.
 *
 * @param {Record<string, unknown>} resource Resource row.
 * @returns {{ id: string, sourceDate: string }} Serializable drag data.
 */
function calendarDragData(resource) {
	return { id: resource.id, sourceDate: resource.dueDate };
}

/**
 * Applies a calendar reschedule to the same resource list used by grid and Kanban.
 *
 * @param {{ data?: { id?: string }, targetValue?: string }} payload Calendar drop payload.
 * @returns {void}
 */
function moveCalendarResource(payload) {
	if (!payload.data?.id || !payload.targetValue) return;
	resources.value = resources.value.map(function updateResourceDate(resource) {
		return resource.id === payload.data.id
			? { ...resource, dueDate: payload.targetValue }
			: resource;
	});
}
</script>

<template>
	<div class="w-full min-w-0 space-y-4" data-testid="shared-resource-views">
		<div class="flex flex-wrap gap-1 rounded-xl border border-border bg-secondary/40 p-1" aria-label="Resource view">
			<button
				v-for="view in [{ key: 'kanban', label: 'Kanban' }, { key: 'grid', label: 'Data grid' }, { key: 'calendar', label: 'Calendar' }]"
				:key="view.key"
				type="button"
				class="h-9 rounded-lg px-3 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
				:class="activeView === view.key ? 'bg-canvas text-canvas-fg shadow-sm ring-1 ring-border' : 'text-muted-fg hover:text-canvas-fg'"
				:aria-pressed="activeView === view.key"
				@click="activeView = view.key"
			>
				{{ view.label }}
			</button>
		</div>

		<DomKanban
			v-if="activeView === 'kanban'"
			v-model:rows="resources"
			v-model:columns="boardColumns"
			board-label="Product features"
			resource-label="features"
			:allow-add-cards="false"
			:allow-add-columns="false"
			height="30rem"
		/>

		<DomDataGrid
			v-else-if="activeView === 'grid'"
			:rows="resources"
			:columns="gridColumns"
			title="Product features"
			resource-label="features"
			:selectable="false"
			:show-column-letters="false"
			height="30rem"
		/>

		<DomMonthCalendar
			v-else
			start-date="2026-08-01"
			:months="1"
			drag-and-drop
			@day-drop="moveCalendarResource"
		>
			<template #month-header>
				<span>Drag a feature to change <code class="text-canvas-fg">dueDate</code>.</span>
			</template>
			<template #default="{ cell, drag, dragAttrs }">
				<div class="space-y-1.5">
					<article
						v-for="resource in resourcesForDate(cell.value)"
						:key="resource.id"
						v-bind="dragAttrs(calendarDragData(resource))"
						class="cursor-grab rounded-md border border-border bg-secondary/60 px-2 py-1.5 text-xs shadow-xs active:cursor-grabbing"
						:class="drag.source && drag.data?.id === resource.id && 'opacity-50'"
					>
						<p class="line-clamp-2 font-semibold text-canvas-fg">{{ resource.title }}</p>
						<p class="mt-1 text-[10px] uppercase tracking-wide text-muted-fg">{{ resource.status }}</p>
					</article>
				</div>
			</template>
		</DomMonthCalendar>

		<p class="text-xs leading-5 text-muted-fg">
			All three views receive the same <code class="text-canvas-fg">resources</code> array. Kanban maps <code class="text-canvas-fg">status</code> and <code class="text-canvas-fg">position</code>; the grid exposes status as a select column; the calendar maps <code class="text-canvas-fg">dueDate</code>.
		</p>
	</div>
</template>
