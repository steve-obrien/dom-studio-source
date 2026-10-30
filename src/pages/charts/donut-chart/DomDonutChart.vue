<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { chartProps } from '../_shared/chartProps.js';
import { chartColor, chartNumber, formatChartValue } from '../_shared/chartUtils.js';
import ChartContainer from '../_shared/ChartContainer.vue';
import ChartLegend from '../_shared/ChartLegend.vue';
import ChartTooltip from '../_shared/ChartTooltip.vue';

defineOptions({
	__doc: {
		name: 'Donut chart', tag: '<DomDonutChart>',
		description: 'Compare non-negative category shares with a centre total, selectable legend, and accessible data table.',
		icon: 'M12 3v9h9A9 9 0 1 1 12 3ZM15 3.5A9 9 0 0 1 20.5 9H15z',
		slots: [{ name: 'center', payload: '{ total, formattedTotal }', description: 'Replaces the centre labels with custom content, such as an audit score out of 100. Keep content small enough to fit inside the ring.' }],
		events: [{ name: 'select', payload: '{ row, index }', description: 'Original record for the selected category.' }, { name: 'retry', description: 'Requests application data recovery.' }],
	},
});
const props = defineProps({
	rows: chartProps.rows,
	title: chartProps.title,
	description: chartProps.description,
	height: chartProps.height,
	format: chartProps.format,
	currency: chartProps.currency,
	locale: chartProps.locale,
	valueFormatter: chartProps.valueFormatter,
	loading: chartProps.loading,
	error: chartProps.error,
	emptyLabel: chartProps.emptyLabel,
	legend: chartProps.legend,
	showTable: chartProps.showTable,
	labelKey: { type: String, default: 'label', _edit: { description: 'Unique category label field; supply one row per category.' } },
	valueKey: { type: String, default: 'value', _edit: { description: 'Non-negative measurement field.' } },
	colorKey: { type: String, default: 'color', _edit: { description: 'Optional field containing a semantic token or CSS colour.' } },
	totalLabel: { type: String, default: 'Total', _edit: { description: 'Caption beneath the sum of visible categories.' } },
	arcWidth: { type: Number, default: 36, _edit: { description: 'Ring thickness in pixels.' } },
});
const emit = defineEmits(['select', 'retry']);
const renderer = shallowRef(null);
const loadError = ref('');
const hiddenKeys = ref([]);
const active = ref(null);
let disposed = false;
const items = computed(getItems);
const visibleItems = computed(() => items.value.filter((item) => !hiddenKeys.value.includes(item.key)));
const total = computed(() => visibleItems.value.some((item) => item.value !== undefined) ? visibleItems.value.reduce((sum, item) => sum + (item.value || 0), 0) : null);
const validationError = computed(getValidationError);
const tooltipItems = computed(() => active.value ? [{ ...active.value, value: formatValue(active.value.value) }] : []);
onMounted(loadRenderer);
onBeforeUnmount(() => { disposed = true; });
watch(items, () => { active.value = null; });

/** @returns {Array<object>} Categories preserving source records and missing values. */
function getItems() {
	return props.rows.flatMap((row, index) => {
		if (!row || typeof row !== 'object') return [];
		const key = String(row[props.labelKey] ?? index);
		return [{ key, label: String(row[props.labelKey] ?? 'Unlabelled'), value: chartNumber(row[props.valueKey]), color: chartColor(key, row[props.colorKey]), row, index }];
	});
}

/** @returns {string} Invalid data explanation, avoiding misleading category shares. */
function getValidationError() {
	if (items.value.some((item) => item.value < 0)) return 'Donut charts require non-negative measurements.';
	if (new Set(items.value.map((item) => item.key)).size !== items.value.length) return 'Provide one row per category; category labels must be unique.';
	return '';
}

/** @returns {Promise<void>} Loads the browser-only rendering component. */
async function loadRenderer() {
	loadError.value = '';
	try {
		const module = await import('../_shared/DonutRenderer.vue');
		if (!disposed) renderer.value = module.default;
	} catch {
		if (!disposed) loadError.value = 'The chart could not be loaded.';
	}
}

/** @returns {void} Retries the engine or delegates data recovery. */
function retry() { if (loadError.value) loadRenderer(); else emit('retry'); }
/** @param {unknown} value Measurement. @returns {string} Consistent formatted value. */
function formatValue(value) { return formatChartValue(value, props); }
/** @param {object} item Category. @returns {void} Emits the original selected record. */
function select(item) { if (item) emit('select', { row: item.row, index: item.index }); }
/** @param {string} key Category key. @returns {void} Toggles visibility while preserving one category. */
function toggle(key) {
	if (hiddenKeys.value.includes(key)) hiddenKeys.value = hiddenKeys.value.filter((item) => item !== key);
	else if (visibleItems.value.length > 1) hiddenKeys.value = [...hiddenKeys.value, key];
	active.value = null;
}
</script>

<template>
	<ChartContainer :title="title" :description="description" :height="height" :loading="loading" :error="error || validationError || loadError" :empty="total === null" :empty-label="emptyLabel" @retry="retry">
		<div class="relative" :style="{ height: `${Math.max(120, height)}px` }">
			<component :is="renderer" v-if="renderer" aria-hidden="true" :items="visibleItems.filter(item => item.value > 0)" :height="Math.max(120, height)" :total="$slots.center ? '' : formatValue(total)" :label="$slots.center ? '' : totalLabel" :arc-width="arcWidth" @inspect="active = $event" @select="select" />
			<div v-if="$slots.center" class="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
				<slot name="center" :total="total" :formatted-total="formatValue(total)" />
			</div>
			<ChartTooltip v-if="active" class="absolute right-2 top-2 z-10" :label="active.label" :items="tooltipItems" />
			<p v-if="total === 0" class="absolute inset-x-0 bottom-1 text-center text-xs text-muted-fg">No positive values for this period</p>
		</div>
		<template #legend><ChartLegend v-if="legend && !loading && !error" :items="items" :hidden-keys="hiddenKeys" @toggle="toggle" /></template>
		<template #table>
			<details v-if="showTable && items.length && !loading && !error" class="mt-3 text-xs text-muted-fg">
				<summary class="w-fit cursor-pointer rounded py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View data for {{ title }}</summary>
				<div class="mt-3 overflow-auto rounded-lg border border-border">
					<table class="w-full text-left tabular-nums"><caption class="sr-only">{{ title }}. Missing values are shown as a dash.</caption>
						<thead class="bg-secondary text-canvas-fg"><tr><th scope="col" class="px-3 py-2">Category</th><th scope="col" class="px-3 py-2 text-right">Value</th></tr></thead>
						<tbody><tr v-for="item in items" :key="item.key" class="border-t border-border"><th scope="row" class="px-3 py-2"><button type="button" class="rounded text-left font-medium underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring" @focus="active = item" @blur="active = null" @click="select(item)">{{ item.label }}</button></th><td class="px-3 py-2 text-right">{{ formatValue(item.value) }}</td></tr></tbody>
					</table>
				</div>
			</details>
		</template>
	</ChartContainer>
</template>
