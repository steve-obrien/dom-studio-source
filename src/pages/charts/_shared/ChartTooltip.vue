<script setup>
defineProps({
	label: { type: String, default: '' },
	items: { type: Array, default: () => [] },
});
</script>

<template>
	<div class="pointer-events-none max-w-full rounded-lg border border-border skin-popover px-3 py-2 text-xs shadow-lg">
		<p class="mb-2 truncate font-medium text-canvas-fg">{{ label }}</p>
		<dl class="space-y-1.5">
			<div v-for="item in items" :key="item.key" class="flex items-center justify-between gap-5">
				<dt class="flex min-w-0 items-center gap-2 text-muted-fg"><span class="size-2 shrink-0 rounded-sm" :style="{ background: item.color }" /><span class="truncate">{{ item.label }}</span></dt>
				<dd class="shrink-0 font-medium tabular-nums text-canvas-fg">{{ item.value }}</dd>
			</div>
		</dl>
	</div>
</template>
