<script setup>
import { useId } from 'vue';
import DomButton from '../../components/button/DomButton.vue';
import DomEmptyState from '../../visual/empty-state/DomEmptyState.vue';
import DomSkeleton from '../../visual/skeleton/DomSkeleton.vue';

defineProps({
	title: { type: String, default: 'Chart' },
	description: { type: String, default: '' },
	height: { type: Number, default: 280 },
	loading: { type: Boolean, default: false },
	error: { type: String, default: '' },
	empty: { type: Boolean, default: false },
	emptyLabel: { type: String, default: 'No data for this period' },
	compact: { type: Boolean, default: false },
});
defineEmits(['retry']);
const titleId = useId();
</script>

<template>
	<figure class="m-0 min-w-0 w-full" :aria-labelledby="titleId" :aria-busy="loading || undefined">
		<figcaption :class="compact ? 'sr-only' : 'mb-5'">
			<div :id="titleId" class="text-sm font-semibold text-canvas-fg">{{ title }}</div>
			<p v-if="description" class="mt-1 text-sm leading-6 text-muted-fg">{{ description }}</p>
		</figcaption>
		<div class="relative min-w-0" :style="{ minHeight: `${Math.max(32, height)}px` }">
			<div v-if="loading" role="status" class="flex h-full items-end gap-3 p-4" :style="{ height: `${Math.max(32, height)}px` }">
				<span class="sr-only">Loading {{ title }}</span>
				<DomSkeleton v-for="size in [45, 70, 55, 85, 65, 95, 75]" :key="size" aria-hidden="true" class="flex-1" :style="{ height: `${size}%` }" />
			</div>
			<div v-else-if="error" role="alert" class="grid place-content-center gap-3 text-center" :style="{ minHeight: `${Math.max(80, height)}px` }">
				<p class="text-sm text-muted-fg">{{ error }}</p>
				<DomButton size="sm" variant="secondary" class="justify-self-center" @click="$emit('retry')">Try again</DomButton>
			</div>
			<div v-else-if="empty" class="grid place-content-center" :style="{ minHeight: `${Math.max(32, height)}px` }">
				<p v-if="compact" class="text-xs text-muted-fg">{{ emptyLabel }}</p>
				<DomEmptyState v-else :title="emptyLabel" description="Choose another period or check back when measurements are available." size="sm" />
			</div>
			<slot v-else />
		</div>
		<slot name="legend" />
		<slot name="table" />
	</figure>
</template>

<style scoped>
/* Unovis draws SVG attributes from inherited variables, including in dark themes. */
figure {
	--vis-font-family: inherit;
	--vis-color-main: var(--primary);
	--vis-axis-tick-label-color: var(--muted-fg);
	--vis-axis-label-color: var(--muted-fg);
	--vis-axis-grid-color: var(--border);
	--vis-axis-domain-color: var(--border);
	--vis-crosshair-line-stroke-color: var(--muted-fg);
	--vis-donut-central-label-text-color: var(--canvas-fg);
	--vis-donut-central-sub-label-text-color: var(--muted-fg);
	--vis-donut-background-color: var(--secondary);
}

@media (prefers-reduced-motion: reduce) {
	figure {
		--vis-axis-tick-label-hide-transition: none;
	}
}
</style>
