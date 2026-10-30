<script setup>
import { chartProps } from '../_shared/chartProps.js';
import XYChart from '../_shared/XYChart.vue';

defineOptions({
	__doc: {
		name: 'Line chart',
		tag: '<DomLineChart>',
		description: 'Compare trends, reporting periods, and targets with proportional time or ordered category axes.',
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
});
defineEmits(['select', 'retry']);
</script>

<template>
	<XYChart v-bind="props" kind="line" @select="$emit('select', $event)" @retry="$emit('retry')" />
</template>
