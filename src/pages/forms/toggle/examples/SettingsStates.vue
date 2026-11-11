<script setup>
import { ref } from 'vue';
import { DomToggle } from '@getdom/studio/vue';

const settings = ref([
	{
		id: 'backups',
		label: 'Automatic backups',
		enabled: true,
		onDescription: 'On — A backup is saved every day.',
		offDescription: 'Off — Automatic backups are paused.',
	},
	{
		id: 'summary',
		label: 'Weekly summary',
		enabled: false,
		onDescription: 'On — A summary arrives every Monday.',
		offDescription: 'Off — No summary emails will be sent.',
	},
	{
		id: 'security',
		label: 'Security alerts',
		enabled: true,
		disabled: true,
		onDescription: 'On — Required by your organisation.',
		offDescription: 'Off — Disabled by your organisation.',
	},
	{
		id: 'public-sharing',
		label: 'Public sharing',
		enabled: false,
		disabled: true,
		onDescription: 'On — Enabled by your organisation.',
		offDescription: 'Off — Disabled by your organisation.',
	},
]);
</script>

<template>
	<div class="w-full max-w-lg divide-y divide-border rounded-xl border border-border bg-canvas">
		<div v-for="setting in settings" :key="setting.id" class="p-4 sm:p-5">
			<DomToggle
				v-model="setting.enabled"
				:label="setting.label"
				:description="setting.enabled ? setting.onDescription : setting.offDescription"
				:disabled="setting.disabled"
			/>
		</div>
	</div>
</template>
