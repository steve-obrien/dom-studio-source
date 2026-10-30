<script setup>
import { DomAlert } from '../../../lib/vue';

const alerts = [
	{
		tone: 'info',
		title: 'Information available',
		description: 'A new policy summary is ready for review before the workflow continues.',
	},
	{
		tone: 'success',
		title: 'Changes saved',
		description: 'Your configuration is stored and will be used for the next deployment.',
	},
	{
		tone: 'warning',
		title: 'Review recommended',
		description: 'Two integrations need updated credentials before the sync window starts.',
	},
	{
		tone: 'danger',
		title: 'Action failed',
		description: 'The publish request could not complete because required fields are missing.',
	},
	{
		tone: 'default',
		title: 'General notice',
		description: 'This message is informational but not tied to a specific success or failure state.',
	},
];
</script>

<template>
	<div class="grid gap-3">
		<DomAlert
			v-for="alert in alerts"
			:key="alert.tone"
			:tone="alert.tone"
			:title="alert.title"
			:description="alert.description"
		/>
	</div>
</template>
