<script setup>
import DispatchStatusPill from './DispatchStatusPill.vue';

defineProps({
	stop: {
		type: Object,
		required: true,
	},
	active: {
		type: Boolean,
		default: false,
	},
});

const riskTone = {
	Ready: 'success',
	Watch: 'warning',
	Blocked: 'destructive',
};
</script>

<template>
	<button
		type="button"
		class="grid min-w-[17rem] gap-3 rounded-lg border border-border bg-canvas p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:min-w-0"
		:class="active && 'border-primary ring-2 ring-primary/20'"
	>
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<p class="truncate text-sm font-semibold text-canvas-fg">{{ stop.customer }}</p>
				<p class="mt-1 truncate text-xs text-muted-fg">{{ stop.address }}</p>
			</div>
			<DispatchStatusPill :tone="riskTone[stop.status] || 'neutral'">
				{{ stop.status }}
			</DispatchStatusPill>
		</div>
		<div class="grid grid-cols-3 gap-2 text-xs">
			<div>
				<p class="text-muted-fg">Window</p>
				<p class="mt-1 font-medium text-canvas-fg">{{ stop.window }}</p>
			</div>
			<div>
				<p class="text-muted-fg">ETA</p>
				<p class="mt-1 font-medium text-canvas-fg">{{ stop.eta }}</p>
			</div>
			<div>
				<p class="text-muted-fg">Load</p>
				<p class="mt-1 font-medium text-canvas-fg">{{ stop.load }}</p>
			</div>
		</div>
		<p class="line-clamp-2 text-xs leading-5 text-muted-fg">{{ stop.note }}</p>
	</button>
</template>
