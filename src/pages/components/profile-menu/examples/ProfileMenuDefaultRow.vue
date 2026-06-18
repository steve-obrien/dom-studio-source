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

const iconPaths = {
	profile: ['M20 21a8 8 0 0 0-16 0', 'M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
	billing: ['M4 7h16', 'M5 7l1.2 12h11.6L19 7', 'M9 11v4', 'M15 11v4'],
	onboarding: ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
	logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
};

const isTask = computed(() => props.item?.type === 'task' || props.item?.task === true || props.item?.completed !== undefined);
const isComplete = computed(() => Boolean(props.item?.completed));
const paths = computed(() => props.item?.paths || iconPaths[props.item?.icon || props.item?.value] || []);
</script>

<template>
	<span class="flex min-w-0 items-center gap-3">
		<span v-if="isTask" class="grid size-4 shrink-0 place-items-center rounded-full border" :class="isComplete ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-canvas text-muted-fg'" aria-hidden="true">
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
			<span v-if="item?.description" class="mt-0.5 block truncate text-xs" :class="item?.tone === 'danger' ? 'text-destructive/80' : 'text-muted-fg'">
				{{ item.description }}
			</span>
		</span>
	</span>
</template>
