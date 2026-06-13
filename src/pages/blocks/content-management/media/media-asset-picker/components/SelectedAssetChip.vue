<script setup>
import AssetPreviewArtwork from './AssetPreviewArtwork.vue';

defineProps({
	asset: {
		type: Object,
		required: true,
	},
});

defineEmits(['preview', 'remove']);
</script>

<template>
	<div class="flex min-w-52 items-center gap-2 rounded-xl border border-border bg-secondary/70 p-2 text-left">
		<button
			type="button"
			class="grid size-11 shrink-0 overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
			:aria-label="`Preview ${asset.title}`"
			@click="$emit('preview', asset)"
		>
			<AssetPreviewArtwork :asset="asset" />
		</button>
		<button type="button" class="min-w-0 flex-1 text-left" @click="$emit('preview', asset)">
			<span class="block truncate text-xs font-semibold">{{ asset.title }}</span>
			<span class="mt-0.5 block truncate text-[11px] text-muted-fg">{{ asset.status }} / {{ asset.size }}</span>
		</button>
		<button
			type="button"
			class="grid size-8 shrink-0 place-items-center rounded-lg text-muted-fg transition hover:bg-canvas hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
			:aria-label="`Remove ${asset.title}`"
			@click="$emit('remove', asset)"
		>
			<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
				<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
			</svg>
		</button>
	</div>
</template>
