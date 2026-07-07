<script setup>
import { computed } from 'vue';

const props = defineProps({
	tool: { type: Object, required: true },
	result: { type: Object, default: null },
});

const weather = computed(() => props.result || props.tool.result || {});
const confidenceLabel = computed(() => formatPercent(weather.value.confidence));

/**
 * Formats a decimal confidence score as a percentage.
 *
 * @param {number} value Decimal confidence score.
 * @returns {string} Percentage label.
 */
function formatPercent(value) {
	const number = Number(value);
	if (!Number.isFinite(number)) return 'Unknown';
	return `${Math.round(number * 100)}%`;
}
</script>

<template>
	<div class="overflow-hidden rounded-lg border border-primary/25 bg-canvas shadow-sm">
		<div class="flex items-start justify-between gap-4 border-b border-border bg-primary/10 p-4">
			<div class="min-w-0">
				<p class="text-xs font-semibold uppercase text-primary">Weather tool</p>
				<h3 class="mt-1 truncate text-base font-semibold text-canvas-fg">{{ weather.location || 'Unknown location' }}</h3>
				<p class="mt-1 text-sm text-muted-fg">{{ weather.condition || 'No condition supplied' }}</p>
			</div>
			<div class="grid size-12 shrink-0 place-items-center rounded-full bg-canvas text-primary shadow-sm ring-1 ring-border">
				<svg viewBox="0 0 24 24" class="size-6" fill="none" aria-hidden="true">
					<path d="M12 5v2M12 17v2M5 12h2M17 12h2M7.8 7.8l1.4 1.4M14.8 14.8l1.4 1.4M16.2 7.8l-1.4 1.4M9.2 14.8l-1.4 1.4M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</div>
		</div>
		<div class="grid grid-cols-3 divide-x divide-border text-center">
			<div class="p-3">
				<p class="text-lg font-semibold text-canvas-fg">{{ weather.temperatureC ?? '--' }} C</p>
				<p class="mt-1 text-[11px] uppercase text-muted-fg">Temp</p>
			</div>
			<div class="p-3">
				<p class="text-lg font-semibold text-canvas-fg">{{ weather.windMph ?? '--' }} mph</p>
				<p class="mt-1 text-[11px] uppercase text-muted-fg">Wind</p>
			</div>
			<div class="p-3">
				<p class="text-lg font-semibold text-canvas-fg">{{ confidenceLabel }}</p>
				<p class="mt-1 text-[11px] uppercase text-muted-fg">Confidence</p>
			</div>
		</div>
		<p v-if="weather.note" class="border-t border-border px-4 py-3 text-xs leading-5 text-muted-fg">{{ weather.note }}</p>
	</div>
</template>
