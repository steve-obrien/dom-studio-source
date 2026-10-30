<script setup>
import VisSingleContainer from '@unovis/vue/containers/single-container';
import VisDonut, { VisDonutSelectors } from '@unovis/vue/components/donut';

defineProps({
	items: { type: Array, required: true },
	height: { type: Number, default: 260 },
	total: { type: String, default: '' },
	label: { type: String, default: 'Total' },
	arcWidth: { type: Number, default: 36 },
});
const emit = defineEmits(['inspect', 'select']);
const events = { [VisDonutSelectors.segment]: { mouseover: inspect, mouseout: clear, click: select } };

/** @param {object} item Chart category. @returns {number} Segment value. */
function value(item) { return item.value; }
/** @param {object} item Chart category. @returns {string} Stable segment colour. */
function color(item) { return item.color; }
/** @param {object} item Chart category. @returns {string} Stable segment identity. */
function id(item) { return item.key; }
/** @param {object} datum Unovis arc datum. @returns {void} Shows category detail. */
function inspect(datum) { emit('inspect', datum.data || datum); }
/** @returns {void} Hides category detail. */
function clear() { emit('inspect', null); }
/** @param {object} datum Unovis arc datum. @returns {void} Selects the category. */
function select(datum) { emit('select', datum.data || datum); }
</script>

<template>
	<VisSingleContainer :data="items" :height="height" :duration="0" class="block w-full">
		<VisDonut :value="value" :color="color" :id="id" :arc-width="arcWidth" :pad-angle="0.025" :corner-radius="3" :central-label="total" :central-sub-label="label" :events="events" :duration="0" />
	</VisSingleContainer>
</template>
