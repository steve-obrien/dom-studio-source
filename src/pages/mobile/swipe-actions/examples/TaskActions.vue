<script setup>
import { ref } from 'vue';
import { DomAppListItem, DomSwipeActions } from '@getdom/studio/vue';

const result = ref('');
const tasks = ref([
	{ id: 1, label: 'Review the project notes', description: 'Mara shared an update this morning.', complete: false },
	{ id: 2, label: 'Book the workshop room', description: 'Tuesday, 10:00 to 11:30.', complete: false },
]);
const endActions = [
	{ value: 'remind', label: 'Remind me' },
	{ value: 'share', label: 'Share', disabled: true },
];

/** Updates local task state or acknowledges a reminder action in this example. */
function act(task, { action }) {
	if (action.value === 'complete') task.complete = !task.complete;
	result.value = action.value === 'complete' ? `${task.label}: ${task.complete ? 'complete' : 'reopened'}.` : `Reminder selected for ${task.label}.`;
}
</script>

<template>
	<div class="mx-auto w-full max-w-xl space-y-4 p-4">
		<div class="divide-y divide-border overflow-hidden rounded-2xl border border-border">
			<DomSwipeActions v-for="task in tasks" :key="task.id" :label="task.label" :start-actions="[{ value: 'complete', label: task.complete ? 'Reopen' : 'Complete', variant: 'success', fullSwipe: true }]" :end-actions="endActions" full-swipe group="task-example" @action="act(task, $event)">
				<DomAppListItem as="div" :label="task.label" :description="task.description" :meta="task.complete ? 'Done' : ''" />
			</DomSwipeActions>
		</div>
		<p class="text-xs leading-6 text-muted-fg">Swipe right to complete. Swipe left for reminders. The Actions button shows both sides, including a disabled sharing action.</p>
		<p v-if="result" role="status" class="text-sm text-canvas-fg">{{ result }}</p>
	</div>
</template>
