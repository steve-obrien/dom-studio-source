<script setup>
import ForecastPill from './ForecastPill.vue';

defineProps({
	deal: {
		type: Object,
		required: true,
	},
	selected: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['select']);

function money(value) {
	return new Intl.NumberFormat('en', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(value);
}
</script>

<template>
	<button
		type="button"
		class="w-full rounded-lg border bg-background p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
		:class="selected ? 'border-primary ring-2 ring-primary/15' : 'border-border'"
		:aria-pressed="selected"
		@click="emit('select', deal)"
	>
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<p class="truncate text-sm font-semibold text-fg">{{ deal.account }}</p>
				<p class="mt-1 truncate text-xs text-muted-fg">{{ deal.description }}</p>
			</div>
			<ForecastPill :tone="deal.forecastTone" :label="deal.forecast" />
		</div>

		<div class="mt-4 flex items-end justify-between gap-3">
			<div>
				<p class="text-lg font-semibold text-fg">{{ money(deal.value) }}</p>
				<p class="mt-0.5 text-xs text-muted-fg">{{ deal.closeDate }} close</p>
			</div>
			<div class="grid size-10 place-items-center rounded-full border border-border bg-secondary text-xs font-semibold text-fg">
				{{ deal.ownerInitials }}
			</div>
		</div>

		<div class="mt-4 h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
			<div class="h-full rounded-full bg-primary" :style="{ width: `${deal.probability}%` }"></div>
		</div>
		<div class="mt-2 flex items-center justify-between gap-3 text-xs text-muted-fg">
			<span>{{ deal.probability }}% probability</span>
			<span>{{ deal.nextStep }}</span>
		</div>

		<div v-if="deal.risks.length" class="mt-3 flex flex-wrap gap-1.5">
			<span
				v-for="risk in deal.risks"
				:key="risk"
				class="rounded-full bg-warning/10 px-2 py-1 text-[0.6875rem] font-medium text-warning"
			>
				{{ risk }}
			</span>
		</div>
	</button>
</template>
