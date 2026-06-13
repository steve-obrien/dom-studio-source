<script setup>
import NavigationStatusPill from './NavigationStatusPill.vue';

defineOptions({
	name: 'PreviewMenuItem',
});

defineProps({
	item: {
		type: Object,
		required: true,
	},
	selectedId: {
		type: String,
		default: '',
	},
	depth: {
		type: Number,
		default: 0,
	},
});

defineEmits(['select']);
</script>

<template>
	<div class="grid gap-1">
		<button
			type="button"
			class="group flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm outline-none transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50"
			:class="selectedId === item.id ? 'bg-primary/10 text-canvas-fg' : 'text-muted-fg'"
			:style="{ paddingLeft: `${0.75 + depth * 0.8}rem` }"
			@click="$emit('select', item.id)"
		>
			<span class="flex min-w-0 items-center gap-2">
				<svg viewBox="0 0 24 24" class="size-4 shrink-0" fill="none" aria-hidden="true">
					<path :d="item.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
				<span class="min-w-0">
					<span class="block truncate font-medium text-canvas-fg">{{ item.label }}</span>
					<span class="block truncate text-xs text-muted-fg">{{ item.url }}</span>
				</span>
			</span>
			<NavigationStatusPill v-if="item.visibility !== 'everyone'" :tone="item.visibility === 'admins' ? 'warning' : 'primary'">
				{{ item.visibilityLabel }}
			</NavigationStatusPill>
		</button>

		<div v-if="item.children?.length" class="grid gap-1">
			<PreviewMenuItem
				v-for="child in item.children"
				:key="child.id"
				:item="child"
				:selected-id="selectedId"
				:depth="depth + 1"
				@select="$emit('select', $event)"
			/>
		</div>
	</div>
</template>
