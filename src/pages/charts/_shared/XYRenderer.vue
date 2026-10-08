<script setup>
import { computed } from 'vue';
import VisXYContainer from '@unovis/vue/containers/xy-container';
import VisAxis from '@unovis/vue/components/axis';
import VisLine from '@unovis/vue/components/line';
import VisArea from '@unovis/vue/components/area';
import VisGroupedBar, { VisGroupedBarSelectors } from '@unovis/vue/components/grouped-bar';
import VisStackedBar, { VisStackedBarSelectors } from '@unovis/vue/components/stacked-bar';
import VisCrosshair from '@unovis/vue/components/crosshair';
import VisScatter from '@unovis/vue/components/scatter';

const props = defineProps({
	points: { type: Array, required: true },
	series: { type: Array, required: true },
	kind: { type: String, default: 'line' },
	height: { type: Number, default: 280 },
	curve: { type: String, default: 'linear' },
	stacked: { type: Boolean, default: false },
	percentage: { type: Boolean, default: false },
	horizontal: { type: Boolean, default: false },
	compact: { type: Boolean, default: false },
	grid: { type: Boolean, default: true },
	xType: { type: String, default: 'category' },
	formatX: { type: Function, required: true },
	formatY: { type: Function, required: true },
});
const emit = defineEmits(['inspect']);
const accessors = computed(getAccessors);
const categoryTicks = computed(getCategoryTicks);
const valueDomain = computed(getValueDomain);
const barEvents = computed(() => ({
	[props.stacked ? VisStackedBarSelectors.bar : VisGroupedBarSelectors.bar]: { mouseover: inspectBar, click: inspectBar },
}));

/** @returns {Array<Function>} Measurement accessors for visible series. */
function getAccessors() {
	return props.series.map((item) => (point) => point.values[item.key]);
}

/** @returns {number[]|undefined} Exact categorical ticks; continuous axes choose their own. */
function getCategoryTicks() {
	return props.xType === 'category' ? props.points.map(getX) : undefined;
}

/** @returns {Array<number|undefined>} Value domain including zero for filled charts. */
function getValueDomain() {
	if (props.percentage) return [0, 100];
	if (props.kind === 'line') return [undefined, undefined];
	const values = props.points.flatMap((point) => props.series.map((item) => point.values[item.key])).filter(Number.isFinite);
	return [values.some((value) => value < 0) ? undefined : 0, values.some((value) => value > 0) ? undefined : 0];
}

/** @param {object} point Projected datum. @returns {number} Category coordinate. */
function getX(point) { return point.x; }

/** @param {unknown} _datum Unovis datum. @param {number} index Series index. @returns {string} Stable colour. */
function getColor(_datum, index) { return props.series[index]?.color || 'var(--primary)'; }

/**
 * Synchronizes inspection with the crosshair, including plot-boundary dismissal.
 * Unovis can retain the nearest datum while clearing the pointer coordinate.
 * @param {number|Date|undefined} x Pointer coordinate; absent when hidden.
 * @param {object|undefined} point Nearest datum.
 * @returns {void}
 */
function inspectPoint(x, point) { emit('inspect', x == null ? null : point || null); }

/** @param {object} datum Bar or stack datum. @returns {void} Inspects horizontal and touch-selected bars. */
function inspectBar(datum) { emit('inspect', datum.datum || datum); }
</script>

<template>
	<!-- Unovis 1.7 forwards undeclared attributes verbatim; config bindings must use camelCase. -->
	<VisXYContainer
		:data="points" :height="height" :duration="0" class="block w-full"
		:xDomain="horizontal ? valueDomain : undefined" :yDomain="horizontal ? undefined : valueDomain"
		:yDirection="horizontal ? 'south' : 'north'"
		:margin="compact ? { top: 4, bottom: 4, left: 4, right: 4 } : { top: 12, right: 12 }"
	>
		<template v-if="kind === 'line'">
			<VisLine v-for="(item, index) in series" :key="item.key" :x="getX" :y="accessors[index]" :color="item.color" :curveType="curve" :lineWidth="2" :lineDashArray="item.dashed ? [5, 4] : undefined" :duration="0" />
			<VisScatter v-if="points.length === 1" :x="getX" :y="accessors" :color="getColor" :size="24" :duration="0" />
		</template>
		<template v-else-if="kind === 'area'">
			<VisArea v-if="stacked" :x="getX" :y="accessors" :color="getColor" :curveType="curve" :opacity="0.45" :duration="0" />
			<VisArea v-for="(item, index) in stacked ? [] : series" :key="item.key" :x="getX" :y="accessors[index]" :color="item.color" :curveType="curve" :opacity="0.15" :line="true" :lineColor="item.color" :duration="0" />
		</template>
		<component
			:is="stacked ? VisStackedBar : VisGroupedBar" v-else
			:x="getX" :y="accessors" :color="getColor" :orientation="horizontal ? 'horizontal' : 'vertical'"
			:barPadding="stacked ? 0.3 : 0.1" :groupPadding="0.3" :roundedCorners="3" :barMinHeight="0" :duration="0" :events="barEvents"
		/>
		<VisAxis v-if="!compact" :key="`category-${horizontal}`" :type="horizontal ? 'y' : 'x'" :tickValues="categoryTicks" :tickFormat="formatX" :gridLine="false" :domainLine="false" :tickLine="false" :tickTextWidth="horizontal ? 90 : 72" :tickTextHideOverlapping="true" :tickTextAdaptiveSets="true" :duration="0" />
		<VisAxis v-if="!compact" :key="`value-${horizontal}`" :type="horizontal ? 'x' : 'y'" :tickFormat="formatY" :gridLine="grid" :domainLine="false" :tickLine="false" :tickTextWidth="90" :tickTextHideOverlapping="true" :numTicks="4" :duration="0" />
		<VisCrosshair v-if="!horizontal" :x="getX" :y="stacked ? [] : accessors" :yStacked="stacked ? accessors : undefined" :color="getColor" :hideWhenFarFromPointer="false" :onCrosshairMove="inspectPoint" :duration="0" />
	</VisXYContainer>
</template>
