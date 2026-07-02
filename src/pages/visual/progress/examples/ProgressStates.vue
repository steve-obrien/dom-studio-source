<script setup>
import { DomProgress } from '../../../lib/vue';

const jobs = [
	{
		label: 'Uploading images',
		value: 72,
		tone: 'success',
		size: 'md',
	},
	{
		label: 'Encoding video',
		value: 42,
		tone: 'primary',
		size: 'lg',
	},
	{
		label: 'Waiting for import',
		value: null,
		tone: 'neutral',
		size: 'sm',
		indeterminate: true,
	},
];
</script>

<template>
	<div class="w-full max-w-xl space-y-5">
		<DomProgress
			v-for="job in jobs"
			:key="job.label"
			:label="job.label"
			:value="job.value"
			:tone="job.tone"
			:size="job.size"
			:indeterminate="job.indeterminate"
			show-value
		/>
	</div>
</template>
