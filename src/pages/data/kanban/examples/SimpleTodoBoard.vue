<script setup>
import { ref } from 'vue';
import { DomKanban } from '../../../lib/vue';

const columns = ref([
	{ key: 'todo', label: 'To do', description: 'Ideas and unstarted work.' },
	{ key: 'doing', label: 'Doing', description: 'Work currently in progress.', limit: 3 },
	{ key: 'done', label: 'Done', description: 'Completed this week.' },
]);
const rows = ref([
	{ id: 'todo-1', title: 'Write the launch checklist', description: 'Collect owners and exit criteria.', status: 'todo', position: 0 },
	{ id: 'todo-2', title: 'Review empty states', description: 'Cover first-run and filtered results.', status: 'todo', position: 1 },
	{ id: 'todo-3', title: 'Test mobile navigation', status: 'doing', position: 0 },
	{ id: 'todo-4', title: 'Publish release notes', status: 'done', position: 0 },
]);
const lastAction = ref('Drag a card, reorder a column, or add a todo.');
let remoteId = 4;

/**
 * Simulates network latency for the creation hook example.
 *
 * @param {number} milliseconds Delay duration.
 * @returns {Promise<void>} Promise resolved after the delay.
 */
function wait(milliseconds) {
	return new Promise(function resolveAfterDelay(resolve) {
		setTimeout(resolve, milliseconds);
	});
}

/**
 * Emulates a remote POST and returns the server-owned id with the suggested fields.
 *
 * @param {{ suggestedRow: Record<string, unknown> }} request Kanban creation request.
 * @returns {Promise<Record<string, unknown>>} Persisted resource row.
 */
async function createTodo(request) {
	await wait(280);
	remoteId += 1;
	return {
		...request.suggestedRow,
		id: `todo-${remoteId}`,
		createdAt: new Date().toISOString(),
	};
}

/**
 * Emulates a remote column POST and returns the accepted definition.
 *
 * @param {{ suggestedColumn: Record<string, unknown> }} request Kanban column request.
 * @returns {Promise<Record<string, unknown>>} Persisted column definition.
 */
async function createTodoColumn(request) {
	await wait(220);
	return request.suggestedColumn;
}

/**
 * Summarizes a completed card move for the demo status line.
 *
 * @param {object} payload DomKanban card-move payload.
 * @returns {void}
 */
function recordCardMove(payload) {
	lastAction.value = `PATCH /todos/${payload.rowKey}/move → ${payload.target.columnKey} at position ${payload.target.index}`;
}

/**
 * Summarizes successful card creation for the demo status line.
 *
 * @param {object} payload DomKanban card-create payload.
 * @returns {void}
 */
function recordCardCreation(payload) {
	lastAction.value = `POST /todos → ${payload.row.id}`;
}

/**
 * Summarizes a completed column reorder for the demo status line.
 *
 * @param {object} payload DomKanban column-move payload.
 * @returns {void}
 */
function recordColumnMove(payload) {
	lastAction.value = `PATCH /todo-board/columns/order → ${payload.columnKeys.join(', ')}`;
}
</script>

<template>
	<div class="w-full min-w-0 space-y-3" data-testid="simple-todo-kanban">
		<DomKanban
			v-model:rows="rows"
			v-model:columns="columns"
			:create-card="createTodo"
			:create-column="createTodoColumn"
			board-label="Todo board"
			resource-label="todos"
			height="31rem"
			@card-move="recordCardMove"
			@card-create="recordCardCreation"
			@column-move="recordColumnMove"
		/>
		<p class="rounded-lg border border-border bg-secondary/40 px-3 py-2 font-mono text-xs leading-5 text-muted-fg" aria-live="polite">
			{{ lastAction }}
		</p>
	</div>
</template>
