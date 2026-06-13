<script setup>
import { computed } from 'vue';

const props = defineProps({
	spent: {
		type: Number,
		required: true,
	},
	limit: {
		type: Number,
		required: true,
	},
	currency: {
		type: String,
		default: 'GBP',
	},
});

const formatter = new Intl.NumberFormat('en-GB', {
	style: 'currency',
	currency: props.currency,
	maximumFractionDigits: 0,
});

const percent = computed(() => {
	if (!props.limit) return 0;
	return Math.min(100, Math.round((props.spent / props.limit) * 100));
});

const remaining = computed(() => Math.max(0, props.limit - props.spent));
</script>

<template>
	<section class="rounded-3xl border border-border skin-card p-4">
		<div class="flex items-start justify-between gap-3">
			<div>
				<p class="text-xs font-semibold uppercase text-muted-fg">Spend limit</p>
				<h3 class="mt-1 text-xl font-semibold text-canvas-fg">{{ formatter.format(remaining) }} left</h3>
			</div>
			<p class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg">{{ percent }}%</p>
		</div>
		<div class="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
			<div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${percent}%` }"></div>
		</div>
		<div class="mt-3 flex items-center justify-between text-xs text-muted-fg">
			<span>{{ formatter.format(spent) }} spent</span>
			<span>{{ formatter.format(limit) }} limit</span>
		</div>
	</section>
</template>
