<script setup>
import { computed } from 'vue';
import { DomBadge, DomStatusPill } from '../../../../../lib/vue';

const props = defineProps({
	source: {
		type: String,
		required: true,
	},
	target: {
		type: String,
		required: true,
	},
	count: {
		type: String,
		default: '',
	},
	status: {
		type: String,
		default: 'synced',
	},
});

const tone = computed(() => ({
	synced: 'success',
	review: 'warning',
	blocked: 'danger',
}[props.status] || 'neutral'));

const label = computed(() => ({
	synced: 'Synced',
	review: 'Review',
	blocked: 'Blocked',
}[props.status] || props.status));
</script>

<template>
	<div class="grid gap-3 rounded-2xl border border-border bg-canvas p-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
		<div class="min-w-0">
			<p class="text-xs font-semibold uppercase text-muted-fg">IdP group</p>
			<p class="mt-1 truncate text-sm font-semibold text-canvas-fg">{{ source }}</p>
		</div>
		<svg viewBox="0 0 24 24" class="hidden size-5 text-muted-fg sm:block" fill="none" aria-hidden="true">
			<path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
		<div class="min-w-0">
			<p class="text-xs font-semibold uppercase text-muted-fg">Workspace role</p>
			<p class="mt-1 truncate text-sm font-semibold text-canvas-fg">{{ target }}</p>
		</div>
		<div class="flex items-center gap-2 sm:justify-end">
			<DomBadge v-if="count" tone="neutral" variant="outline">{{ count }}</DomBadge>
			<DomStatusPill :tone="tone" size="sm" :label="label" />
		</div>
	</div>
</template>
