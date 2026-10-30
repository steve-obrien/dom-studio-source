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
	paths: {
		type: Array,
		default: () => [],
	},
});

const isTask = computed(() => props.item?.type === 'task' || props.item?.task === true || props.item?.completed !== undefined);
const isComplete = computed(() => Boolean(props.item?.completed));
</script>

<template>
	<span class="flex min-w-0 items-center gap-3">
		<span v-if="isTask" class="grid size-4 shrink-0 place-items-center rounded-full border text-primary" :class="isComplete ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-canvas text-muted-fg'" aria-hidden="true">
			<svg v-if="isComplete" viewBox="0 0 16 16" class="size-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.2l2.7 2.7 6.3-6.6" /></svg>
		</span>
		<span v-else class="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-fg" :class="item?.tone === 'danger' ? 'bg-destructive/10 text-destructive' : ''">
			<svg v-if="paths.length" viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path v-for="path in paths" :key="path" :d="path" />
			</svg>
			<span v-else class="size-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
		</span>
		<span class="min-w-0 flex-1">
			<span class="block truncate font-medium" :class="isComplete ? 'text-muted-fg line-through decoration-border decoration-2' : ''">{{ label }}</span>
			<span
				v-if="item?.description"
				class="mt-0.5 block truncate text-xs"
				:class="item?.tone === 'danger' ? 'text-destructive/80' : 'text-muted-fg'"
			>
				{{ item.description }}
			</span>
		</span>
	</span>
</template>
