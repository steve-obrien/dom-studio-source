<script setup>
defineOptions({
	name: 'LiquidGlassDragHandle',
	__doc: {
		description: 'An experiment-local pointer and keyboard handle for moving a liquid-glass test surface.',
	},
});

defineProps({
	label: {
		type: String,
		default: 'Move liquid glass surface',
	},
});
</script>

<template>
	<button
		type="button"
		data-drag-handle
		:aria-label="label"
		title="Drag to move · Arrow keys to nudge · Home to reset"
		class="grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-full border border-canvas-fg/20 bg-canvas/25 p-0 text-canvas-fg/60 hover:bg-canvas/45 hover:text-canvas-fg focus-visible:bg-canvas/45 focus-visible:text-canvas-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas-fg/35 active:cursor-grabbing"
	>
		<svg viewBox="0 0 20 20" aria-hidden="true" class="size-4 fill-current">
			<circle cx="7" cy="6" r="1" />
			<circle cx="13" cy="6" r="1" />
			<circle cx="7" cy="10" r="1" />
			<circle cx="13" cy="10" r="1" />
			<circle cx="7" cy="14" r="1" />
			<circle cx="13" cy="14" r="1" />
		</svg>
	</button>
</template>
