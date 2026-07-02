<script setup>
import { DomRadialProgress } from '../../../lib/vue';

const meters = [
	{
		label: 'Image upload',
		value: 86,
		tone: 'success',
		size: 'lg',
	},
	{
		label: 'Document sync',
		value: 52,
		tone: 'primary',
		size: 'md',
	},
	{
		label: 'Processing warning',
		value: 31,
		tone: 'warning',
		size: 'md',
	},
	{
		label: 'Compact transfer',
		value: 68,
		tone: 'neutral',
		size: 'sm',
		showValue: false,
	},
];
</script>

<template>
	<div class="flex flex-wrap items-center justify-center gap-6">
		<div
			v-for="meter in meters"
			:key="meter.label"
			class="flex min-w-28 flex-col items-center gap-3 text-center"
		>
			<DomRadialProgress
				:label="meter.label"
				:value="meter.value"
				:tone="meter.tone"
				:size="meter.size"
				:show-value="meter.showValue !== false"
			/>
			<p class="text-xs font-medium text-muted-fg">{{ meter.label }}</p>
		</div>
	</div>
</template>
