<script setup>
defineProps({
	items: { type: Array, default: () => [] },
	hiddenKeys: { type: Array, default: () => [] },
});
defineEmits(['toggle']);
</script>

<template>
	<div class="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2" role="group" aria-label="Chart legend">
		<button
			v-for="item in items" :key="item.key" type="button"
			class="inline-flex min-h-9 min-w-0 items-center gap-2 rounded-md px-1 text-xs text-muted-fg transition hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			:aria-pressed="!hiddenKeys.includes(item.key)"
			:class="hiddenKeys.includes(item.key) && 'opacity-45'"
			@click="$emit('toggle', item.key)"
		>
			<span class="h-0.5 w-4 shrink-0 border-t-2" :style="{ borderColor: item.color, borderStyle: item.dashed ? 'dashed' : 'solid' }" aria-hidden="true" />
			<span :class="hiddenKeys.includes(item.key) && 'line-through'">{{ item.label }}</span>
		</button>
	</div>
</template>
