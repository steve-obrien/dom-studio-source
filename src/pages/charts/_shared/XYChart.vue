<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { chartProps } from './chartProps.js';
import { chartPoints, chartSeries, formatChartValue, percentagePoints } from './chartUtils.js';
import ChartContainer from './ChartContainer.vue';
import ChartLegend from './ChartLegend.vue';
import ChartTooltip from './ChartTooltip.vue';
import CompactChartTooltip from './CompactChartTooltip.vue';

const props = defineProps({
	...chartProps,
	kind: { type: String, default: 'line' },
	stacked: { type: Boolean, default: false },
	percentage: { type: Boolean, default: false },
	horizontal: { type: Boolean, default: false },
	compact: { type: Boolean, default: false },
	tooltip: { type: Boolean, default: true },
});
const emit = defineEmits(['retry', 'select']);
const renderer = shallowRef(null);
const loadError = ref('');
const hiddenKeys = ref([]);
const inspected = ref(null);
const plot = ref(null);
let disposed = false;
const allSeries = computed(() => chartSeries(props.series));
const visibleSeries = computed(() => allSeries.value.filter((item) => !hiddenKeys.value.includes(item.key)));
const points = computed(() => chartPoints(props.rows, props.xKey, props.xType, allSeries.value));
const renderPoints = computed(() => props.percentage ? percentagePoints(points.value, visibleSeries.value) : points.value);
const hasData = computed(() => points.value.some((point) => visibleSeries.value.some((item) => Number.isFinite(point.values[item.key]))));
const validationError = computed(() => props.percentage && points.value.some((point) => visibleSeries.value.some((item) => point.values[item.key] < 0)) ? 'Percentage stacks require non-negative measurements.' : '');
const tooltipItems = computed(() => inspected.value ? visibleSeries.value.map((item) => ({ ...item, value: formatValue(inspected.value.values[item.key]) })) : []);
const safeHeight = computed(() => Math.max(props.compact ? 32 : 120, props.height));

onMounted(loadRenderer);
onBeforeUnmount(() => { disposed = true; });
watch(points, () => { inspected.value = null; });

/** Loads the drawing engine only in the browser, preserving SSR-safe imports. @returns {Promise<void>} */
async function loadRenderer() {
	loadError.value = '';
	try {
		const module = await import('./XYRenderer.vue');
		if (!disposed) renderer.value = module.default;
	} catch {
		if (!disposed) loadError.value = 'The chart could not be loaded.';
	}
}

/** Retries an engine failure or delegates application data recovery. @returns {void} */
function retry() {
	if (loadError.value) loadRenderer();
	else emit('retry');
}

/** @param {string} key Series key. @returns {void} Toggles a series while preserving at least one. */
function toggleSeries(key) {
	if (hiddenKeys.value.includes(key)) hiddenKeys.value = hiddenKeys.value.filter((entry) => entry !== key);
	else if (visibleSeries.value.length > 1) hiddenKeys.value = [...hiddenKeys.value, key];
}

/** @param {unknown} value Measurement. @returns {string} Formatted measurement. */
function formatValue(value) { return formatChartValue(value, props); }

/** @param {number} value Numeric axis tick. @returns {string} Value-axis label. */
function formatAxisValue(value) {
	if (props.yFormatter) return String(props.yFormatter(value));
	return props.percentage ? `${Math.round(value)}%` : formatValue(value);
}

/** @param {unknown} value Raw horizontal value. @returns {string} Category, date, or number label. */
function formatLabel(value) {
	if (props.xFormatter) return String(props.xFormatter(value));
	if (props.xType === 'time') return new Intl.DateTimeFormat(props.locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(value));
	return String(value ?? '—');
}

/** @param {number} value Numeric axis coordinate. @returns {string} Axis tick label. */
function formatAxisLabel(value) {
	return formatLabel(props.xType === 'category' ? props.rows[Math.round(value)]?.[props.xKey] : value);
}

/** @param {object|null} point Hovered point. @returns {void} Updates the shared tooltip. */
function inspect(point) { inspected.value = point ? points.value.find((entry) => entry.index === point.index) || null : null; }

/** @param {KeyboardEvent} event Chart navigation key. @returns {void} Inspects or selects a datum. */
function navigate(event) {
	if (!hasData.value) return;
	const index = Math.max(0, points.value.findIndex((point) => point.index === inspected.value?.index));
	let next = index;
	if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.min(points.value.length - 1, index + 1);
	else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = Math.max(0, index - 1);
	else if (event.key === 'Home') next = 0;
	else if (event.key === 'End') next = points.value.length - 1;
	else if (event.key === 'Escape') { inspected.value = null; return; }
	else if (event.key === 'Enter' || event.key === ' ') { selectPoint(); event.preventDefault(); return; }
	else return;
	event.preventDefault();
	inspected.value = points.value[next];
}

/** @returns {void} Emits the original application record selected by the user. */
function selectPoint() {
	if (inspected.value) emit('select', { row: inspected.value.row, index: inspected.value.index });
}

/** @param {Event} event Accessible scrubber input. @returns {void} Inspects a data point on touch or keyboard. */
function scrub(event) { inspected.value = points.value[Number(event.target.value)]; }
</script>

<template>
	<ChartContainer :title="title" :description="description" :height="safeHeight" :compact="compact" :loading="loading" :error="error || validationError || loadError" :empty="!hasData" :empty-label="emptyLabel" @retry="retry">
		<div
			ref="plot"
			class="relative rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			:style="{ height: `${safeHeight}px` }" tabindex="0" role="group"
			:aria-label="`${title}. Use arrow keys to inspect values; Enter selects a row.`"
			@keydown="navigate" @focus="inspect(inspected || points[0])" @blur="inspect(null)" @mouseleave="inspect(null)" @click="selectPoint"
		>
			<div aria-hidden="true">
				<component :is="renderer" v-if="renderer" :key="`${kind}-${horizontal}-${stacked}-${percentage}`" :points="renderPoints" :series="visibleSeries" :kind="kind" :height="safeHeight" :curve="curve" :stacked="stacked || percentage" :percentage="percentage" :horizontal="horizontal" :compact="compact" :grid="grid" :x-type="xType" :format-x="formatAxisLabel" :format-y="formatAxisValue" @inspect="inspect" />
				<div v-else class="h-full w-full" />
			</div>
			<CompactChartTooltip v-if="inspected && tooltip && compact" :anchor="plot" :label="formatLabel(inspected.row[xKey])" :items="tooltipItems" />
			<ChartTooltip v-else-if="inspected && tooltip" class="absolute right-2 top-2 z-10" :label="formatLabel(inspected.row[xKey])" :items="tooltipItems" />
			<span class="sr-only" aria-live="polite">{{ inspected ? `${formatLabel(inspected.row[xKey])}: ${tooltipItems.map(item => `${item.label} ${item.value}`).join(', ')}` : '' }}</span>
		</div>
		<template #legend>
			<ChartLegend v-if="legend && !loading && !error && allSeries.length" :items="allSeries" :hidden-keys="hiddenKeys" @toggle="toggleSeries" />
		</template>
		<template #table>
			<details v-if="showTable && !loading && !error && points.length" class="mt-3 text-xs text-muted-fg">
				<summary class="w-fit cursor-pointer rounded py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View data for {{ title }}</summary>
				<label v-if="points.length > 1" class="mt-3 flex items-center gap-3">Inspect data<input type="range" min="0" :max="points.length - 1" :value="Math.max(0, points.findIndex(point => point.index === inspected?.index))" class="min-w-0 flex-1 accent-primary" @input="scrub" /></label>
				<div class="mt-3 max-h-80 overflow-auto rounded-lg border border-border" tabindex="0" :aria-label="`${title} data table`">
					<table class="w-full text-left text-xs tabular-nums">
						<caption class="sr-only">{{ title }}. Missing measurements are shown as a dash.{{ percentage ? ' Original measurements before percentage normalization.' : '' }}</caption>
						<thead class="sticky top-0 bg-secondary text-canvas-fg"><tr><th scope="col" class="px-3 py-2">{{ xKey }}</th><th v-for="item in allSeries" :key="item.key" scope="col" class="px-3 py-2 text-right">{{ item.label }}</th></tr></thead>
						<tbody><tr v-for="point in points" :key="point.index" class="border-t border-border"><th scope="row" class="whitespace-nowrap px-3 py-2 font-medium">{{ formatLabel(point.row[xKey]) }}</th><td v-for="item in allSeries" :key="item.key" class="whitespace-nowrap px-3 py-2 text-right">{{ formatValue(point.values[item.key]) }}</td></tr></tbody>
					</table>
				</div>
			</details>
		</template>
	</ChartContainer>
</template>
