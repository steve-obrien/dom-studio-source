<script setup>
defineProps({
	title: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		default: '',
	},
	value: {
		type: String,
		default: '',
	},
	icon: {
		type: String,
		default: '',
	},
	interactive: {
		type: Boolean,
		default: false,
	},
});

defineEmits(['click']);
</script>

<template>
	<component
		:is="interactive ? 'button' : 'div'"
		type="button"
		class="flex w-full items-center gap-3 rounded-2xl border border-border bg-canvas p-3 text-left transition"
		:class="interactive && 'hover:border-primary/40 hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'"
		@click="$emit('click')"
	>
		<span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary text-canvas-fg">
			<svg v-if="icon" viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
				<path :d="icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</span>
		<span class="min-w-0 flex-1">
			<span class="block truncate text-sm font-semibold text-canvas-fg">{{ title }}</span>
			<span v-if="description" class="mt-0.5 block text-xs leading-5 text-muted-fg">{{ description }}</span>
		</span>
		<span v-if="$slots.trailing" class="shrink-0">
			<slot name="trailing" />
		</span>
		<span v-else-if="value" class="shrink-0 text-xs font-semibold text-muted-fg">{{ value }}</span>
	</component>
</template>
