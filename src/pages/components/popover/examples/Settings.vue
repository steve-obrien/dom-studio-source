<script setup>
import { ref } from 'vue';
import { DomPopover, DomToggle } from '@getdom/studio/vue';

const notifications = ref(true);
const digest = ref(false);
const sound = ref(true);
</script>

<template>
	<div class="flex flex-col gap-4">
		<div>Data: {{ notifications }}, {{ digest }}, {{ sound }}</div>
		<DomPopover class="text-left" label="Notifications" position="bottom" width="min-w-[18rem]">
			<h3 class="text-sm font-semibold tracking-tight text-fg">Notification preferences</h3>
			<div class="mt-3 space-y-3 flex flex-col gap-2">
				<DomToggle v-model="notifications" label="Push notifications" description="Alerts in the menu bar." />
				<DomToggle v-model="digest" label="Weekly digest" description="Sent Mondays at 8am local time." />
				<DomToggle v-model="sound" label="Play sound" />
			</div>
		</DomPopover>
	</div>
</template>
