<script setup>
import { ref } from 'vue';
import { DomButton, DomToastStack } from '@getdom/studio/vue';

let id = 0;
const toasts = ref([]);
const messages = [
	{
		tone: 'success',
		title: 'Payment captured',
		description: 'Invoice #1048 moved into the paid queue.',
	},
	{
		tone: 'default',
		title: 'New review assigned',
		description: 'Maya Patel needs a second pass on the release notes.',
	},
	{
		tone: 'warning',
		title: 'Sync waiting',
		description: 'Reconnect Linear before the next import window.',
	},
	{
		tone: 'danger',
		title: 'Deploy blocked',
		description: 'Two required checks still need attention.',
	},
];

/**
 * Adds the next realistic notification to the rack.
 *
 * @returns {void}
 */
function pushToast() {
	const message = messages[id % messages.length];
	id += 1;
	toasts.value = [
		...toasts.value,
		{
			id: `rack-${id}`,
			...message,
			duration: 0,
		},
	];
}

/**
 * Adds enough notifications to make the rack layering visible.
 *
 * @returns {void}
 */
function buildRack() {
	pushToast();
	pushToast();
	pushToast();
}

/**
 * Removes a toast after the rack emits its dismiss event.
 *
 * @param {string} toastId Toast id to remove.
 * @returns {void}
 */
function dismiss(toastId) {
	toasts.value = toasts.value.filter((toast) => toast.id !== toastId);
}

/**
 * Clears all visible rack notifications.
 *
 * @returns {void}
 */
function clearToasts() {
	toasts.value = [];
}
</script>

<template>
	<div class="flex flex-wrap gap-2">
		<DomButton variant="secondary" @click="pushToast">Add notification</DomButton>
		<DomButton variant="secondary" @click="buildRack">Build rack</DomButton>
		<DomButton variant="ghost" @click="clearToasts">Clear</DomButton>
		<DomToastStack
			:toasts="toasts"
			layout="rack"
			position="top-right"
			@dismiss="dismiss"
		/>
	</div>
</template>
