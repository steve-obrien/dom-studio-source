<script setup>
import { ref } from 'vue';
import { DomButton, DomToastStack, useToasts } from '@getdom/studio/vue';
import AvatarToast from './toasts/AvatarToast.vue';
import SoftwareUpdateToast from './toasts/SoftwareUpdateToast.vue';

const { toasts, show, dismiss } = useToasts();
const lastAction = ref('none');

function showAvatarToast() {
	show(AvatarToast, {
		avatar: 'https://i.pravatar.cc/96?img=5',
		name: 'Maya Patel',
		role: 'Senior product designer',
	}, {
		tone: 'success',
		duration: 0,
	});
}

function showUpdateToast() {
	show(SoftwareUpdateToast, {
		version: 'DOM Studio 2.4',
		size: '48 MB',
	}, {
		duration: 3000,
	});
}

function onAction(event) {
	lastAction.value = [event.action, event.value || event.person || event.version].filter(Boolean).join(': ');
	if (event.action !== 'dismiss') dismiss(event.id);
}
</script>

<template>
	<div class="grid gap-3">
		<div class="flex flex-wrap gap-2">
			<DomButton variant="secondary" @click="showAvatarToast">Avatar toast</DomButton>
			<DomButton variant="secondary" @click="showUpdateToast">Software update</DomButton>
		</div>
		<p class="text-xs text-muted-fg">Action: <code class="text-canvas-fg">{{ lastAction }}</code></p>
		<DomToastStack
			:toasts="toasts"
			position="bottom-right"
			@dismiss="dismiss"
			@action="onAction"
		/>
	</div>
</template>
