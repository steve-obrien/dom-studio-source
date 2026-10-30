<script setup>
import { chartProps } from '../_shared/chartProps.js';
import XYChart from '../_shared/XYChart.vue';

defineOptions({
	__doc: {
		name: 'Area chart',
		tag: '<DomAreaChart>',
		description: 'Show volume over time as overlapping or stacked areas.',
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
	stacked: { type: Boolean, default: false, _edit: { description: 'Stack visible series on a shared baseline.' } },
});
defineEmits(['select', 'retry']);
</script>

<template>
	<XYChart v-bind="props" kind="area" @select="$emit('select', $event)" @retry="$emit('retry')" />
</template>
