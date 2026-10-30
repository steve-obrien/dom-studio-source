<script setup>
import { computed } from 'vue';

const props = defineProps({
	item: {
		type: Object,
		default: () => ({}),
	},
	label: {
		type: String,
		default: '',
	},
});

const percent = computed(() => Math.max(0, Math.min(100, Number(props.item?.percent || 0))));
const barStyle = computed(() => ({ width: `${percent.value}%` }));
</script>

<template>
	<span class="flex min-w-0 items-center gap-3">
		<span class="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
			<svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M4 19V5" />
				<path d="M8 19v-7" />
				<path d="M12 19V9" />
				<path d="M16 19v-4" />
				<path d="M20 19V7" />
			</svg>
		</span>
		<span class="min-w-0 flex-1">
			<span class="flex items-center justify-between gap-3">
				<span class="truncate font-medium">{{ label }}</span>
				<span class="shrink-0 text-xs font-semibold text-muted-fg">{{ percent }}%</span>
			</span>
			<span class="mt-0.5 block truncate text-xs text-muted-fg">{{ item.description }}</span>
			<span class="mt-2 block h-1.5 overflow-hidden rounded-full bg-secondary">
				<span class="block h-full rounded-full bg-primary" :style="barStyle" />
			</span>
		</span>
	</span>
</template>
