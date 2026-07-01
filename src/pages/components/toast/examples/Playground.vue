<script setup>
import { reactive } from 'vue';
import { DomButton, DomToastStack } from '@getdom/studio/vue';

let id = 0;
const data = reactive({
	duration: 3600,
	autoDismiss: false,
	layout: 'stack',
	toasts: [],
});

/**
 * Adds a toast row to the playground's editable controlled state.
 *
 * @returns {void}
 */
function pushToast() {
	id += 1;
	data.toasts = [
		...data.toasts,
		{
			id: `toast-${id}`,
			title: 'Preview toast',
			description: 'Edit this row in the inspector.',
			tone: id % 2 === 0 ? 'success' : 'default',
			duration: data.autoDismiss ? data.duration : 0,
		},
	];
}

/**
 * Removes a toast row after the stack emits its dismiss event.
 *
 * @param {string} toastId Toast id to remove.
 * @returns {void}
 */
function dismiss(toastId) {
	data.toasts = data.toasts.filter((toast) => toast.id !== toastId);
}

defineExpose({ data });
</script>

<template>
	<div class="grid gap-3">
		<DomButton variant="secondary" @click="pushToast">Add preview toast</DomButton>
		<DomToastStack v-bind="data" @dismiss="dismiss" />
	</div>
</template>
