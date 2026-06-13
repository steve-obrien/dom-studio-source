<script setup>
import DealCard from './DealCard.vue';

defineProps({
	stage: {
		type: Object,
		required: true,
	},
	deals: {
		type: Array,
		default: () => [],
	},
	selectedDealId: {
		type: String,
		default: '',
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
	<section class="flex min-h-[34rem] min-w-[18rem] flex-col rounded-lg border border-border bg-secondary/35">
		<header class="border-b border-border p-4">
			<div class="flex items-start justify-between gap-3">
				<div>
					<h3 class="font-semibold text-canvas-fg">{{ stage.label }}</h3>
					<p class="mt-1 text-xs text-muted-fg">{{ stage.description }}</p>
				</div>
				<span class="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-muted-fg">{{ deals.length }}</span>
			</div>
			<div class="mt-4 grid grid-cols-2 gap-2 text-xs">
				<div class="rounded-md bg-canvas p-2">
					<p class="text-muted-fg">Pipeline</p>
					<p class="mt-1 font-semibold text-canvas-fg">{{ money(deals.reduce((sum, deal) => sum + deal.value, 0)) }}</p>
				</div>
				<div class="rounded-md bg-canvas p-2">
					<p class="text-muted-fg">Weighted</p>
					<p class="mt-1 font-semibold text-canvas-fg">{{ money(deals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0)) }}</p>
				</div>
			</div>
		</header>

		<div class="flex-1 space-y-3 overflow-y-auto p-3">
			<DealCard
				v-for="deal in deals"
				:key="deal.id"
				:deal="deal"
				:selected="selectedDealId === deal.id"
				@select="emit('select', $event)"
			/>
			<div v-if="!deals.length" class="grid min-h-40 place-items-center rounded-lg border border-dashed border-border bg-canvas/60 p-4 text-center text-sm text-muted-fg">
				No matching deals in this stage.
			</div>
		</div>
	</section>
</template>
