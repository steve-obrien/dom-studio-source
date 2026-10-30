<script setup>
import { computed } from 'vue';
import DomCard from '../../visual/card/DomCard.vue';
import DomSparkline from '../sparkline/DomSparkline.vue';
import { chartNumber, formatChartValue } from '../_shared/chartUtils.js';

defineOptions({
	__doc: { name: 'Metric card', tag: '<DomMetricCard>', description: 'A formatted measurement, explicit comparison, and optional sparkline for reporting dashboards.', icon: 'M4 5h16v14H4zM7 15l3-3 3 1 4-5' },
});
const props = defineProps({
	label: { type: String, default: 'Revenue', _edit: { description: 'Metric name.' } },
	value: { type: Number, default: null, _edit: { description: 'Current value. Null is unavailable; zero remains zero.' } },
	format: { type: String, default: 'number', _edit: { options: ['number', 'compact', 'currency', 'percent'] } },
	currency: { type: String, default: 'GBP' },
	locale: { type: String, default: 'en-GB' },
	change: { type: Number, default: null, _edit: { description: 'Relative change as a fraction, e.g. 0.12 for +12%. Calculated by the application.' } },
	comparisonLabel: { type: String, default: 'vs previous period' },
	trend: { type: String, default: 'up-good', _edit: { options: ['up-good', 'down-good', 'neutral'], description: 'Whether an increase or decrease represents improvement.' } },
	loading: { type: Boolean, default: false },
	rows: { type: Array, default: () => [], _edit: { description: 'Optional sparkline records.' } },
	xKey: { type: String, default: 'date' },
	valueKey: { type: String, default: 'value' },
	color: { type: String, default: 'primary' },
});
const formatted = computed(() => formatChartValue(props.value, props));
const changeLabel = computed(getChangeLabel);
const tone = computed(getTone);

/** @returns {string} Signed percentage change without inventing a comparison. */
function getChangeLabel() {
	if (chartNumber(props.change) === undefined) return '';
	return new Intl.NumberFormat(props.locale, { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(props.change);
}
/** @returns {string} Semantic performance colour based on metric direction. */
function getTone() {
	if (props.trend === 'neutral' || !props.change) return 'text-muted-fg';
	return (props.change > 0) === (props.trend === 'up-good') ? 'text-success' : 'text-destructive';
}
</script>

<template>
	<DomCard padding="sm" :aria-busy="loading || undefined">
		<p class="text-sm text-muted-fg">{{ label }}</p>
		<p class="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-canvas-fg" :class="loading && 'motion-safe:animate-pulse'">{{ loading ? '…' : formatted }}</p>
		<p v-if="changeLabel && !loading" class="mt-2 flex flex-wrap items-center gap-x-2 text-xs"><span class="font-medium tabular-nums" :class="tone">{{ changeLabel }}</span><span class="text-muted-fg">{{ comparisonLabel }}</span></p>
		<DomSparkline v-if="rows.length" class="mt-5" :title="`${label} trend`" :rows="rows" :x-key="xKey" :series="[{ key: valueKey, label, color }]" :format="format" :currency="currency" :locale="locale" :loading="loading" />
		<slot />
	</DomCard>
</template>
