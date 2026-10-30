<script setup>
import { chartProps } from '../_shared/chartProps.js';
import XYChart from '../_shared/XYChart.vue';

defineOptions({
	__doc: {
		name: 'Bar chart',
		tag: '<DomBarChart>',
		description: 'Compare categories with vertical or horizontal bars, grouped series, and percentage stacks.',
		icon: 'M4 4v16h16M7 14l4-5 4 3 5-7',
		events: [
			{ name: 'select', payload: '{ row, index }', description: 'Original application record selected by click or Enter.' },
			{ name: 'retry', description: 'Requests another attempt to load application data.' },
		],
		keyboard: [{ keys: 'Arrow keys / Home / End', action: 'Inspect data points.' }, { keys: 'Enter', action: 'Select the inspected record.' }],
	},
});
const props = defineProps({
	...chartProps,
	stacked: { type: Boolean, default: false, _edit: { description: 'Stack series within each category.' } },
	percentage: { type: Boolean, default: false, _edit: { description: 'Normalize non-negative visible series to a 100% stack.' } },
	horizontal: { type: Boolean, default: false, _edit: { description: 'Place category labels down the left side.' } },
});
defineEmits(['select', 'retry']);
</script>

<template>
	<XYChart v-bind="props" kind="bar" @select="$emit('select', $event)" @retry="$emit('retry')" />
</template>
