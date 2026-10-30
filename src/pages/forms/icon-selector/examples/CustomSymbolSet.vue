<script setup>
import { ref } from 'vue';
import { DomIconSelector } from '../../../lib/vue';

const selectedSymbol = ref('priority-high');
const symbols = [
	{
		label: 'High priority',
		value: 'priority-high',
		group: 'Status',
		emoji: '🔥',
		keywords: 'urgent risk',
	},
	{
		label: 'Ready to ship',
		value: 'ready',
		group: 'Status',
		path: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM8.5 12.5l2.5 2.5 4.5-5',
		keywords: 'done approved',
	},
	{
		label: 'Needs review',
		value: 'review',
		group: 'Workflow',
		path: 'M12 4l9 16H3L12 4ZM12 9v4M12 17h.01',
		keywords: 'warning check',
	},
];
</script>

<template>
	<DomIconSelector
		v-model="selectedSymbol"
		kind="custom"
		label="Workflow symbol"
		description="Custom rows can mix emoji, SVG path data, labels, groups, and keywords."
		:items="symbols"
	/>
</template>
