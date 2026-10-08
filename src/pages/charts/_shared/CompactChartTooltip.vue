<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { applyFloatingPosition, autoUpdateFloating } from '../../lib/headless/floating.js';
import ChartTooltip from './ChartTooltip.vue';

const props = defineProps({
	anchor: { type: Object, required: true },
	label: { type: String, default: '' },
	items: { type: Array, default: () => [] },
});
const panel = ref(null);
let stopPositioning;

/** Positions the compact tooltip outside the plot and within the viewport. @returns {void} */
function position() {
	applyFloatingPosition(props.anchor, panel.value, { placement: 'top', align: 'center', offset: 8, padding: 8 });
}

/** Opens in the top layer so table overflow cannot clip chart values. @returns {void} */
function open() {
	panel.value.showPopover();
	position();
	stopPositioning = autoUpdateFloating(props.anchor, panel.value, position);
}

/** Releases scroll/resize observers when inspection ends or the chart unmounts. @returns {void} */
function cleanup() {
	stopPositioning?.();
}

onMounted(open);
onBeforeUnmount(cleanup);
</script>

<template>
	<div ref="panel" popover="manual" class="pointer-events-none m-0 w-max max-w-[calc(100vw-1rem)] overflow-visible border-0 bg-transparent p-0 text-canvas-fg">
		<ChartTooltip :label="label" :items="items" />
	</div>
</template>
