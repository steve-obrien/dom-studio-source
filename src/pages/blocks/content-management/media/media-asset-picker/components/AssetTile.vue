<script setup>
import { computed } from 'vue';
import { DomBadge, DomStatusPill } from '@getdom/studio/vue';
import AssetPreviewArtwork from './AssetPreviewArtwork.vue';

const props = defineProps({
	asset: {
		type: Object,
		required: true,
	},
	selected: {
		type: Boolean,
		default: false,
	},
});

defineEmits(['preview', 'toggle']);

const fileIconPath = {
	image: 'M5 5h14v14H5V5Zm3 9 2.5-3 2 2.5 1.5-2 3 4H8Zm8-5.5h.01',
	video: 'M5 6h10v12H5V6Zm10 4 5-3v10l-5-3',
	document: 'M7 4h7l4 4v12H7V4Zm7 0v5h5M10 13h5M10 17h4',
};

const statusTone = computed(() => ({
	Approved: 'success',
	Review: 'warning',
	'Needs caption': 'info',
}[props.asset.status] || 'neutral'));

const typeLabel = computed(() => ({
	image: 'Image',
	video: 'Video',
	document: 'Doc',
}[props.asset.type] || props.asset.type));
</script>

<template>
	<article
		class="group overflow-hidden rounded-2xl border bg-canvas shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
		:class="selected ? 'border-primary/70 ring-2 ring-primary/15' : 'border-border'"
	>
		<button type="button" class="block w-full text-left" @click="$emit('preview', asset)">
			<div class="relative">
				<AssetPreviewArtwork :asset="asset" />
				<span class="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
					<svg viewBox="0 0 24 24" class="size-3.5" fill="none" aria-hidden="true">
						<path :d="fileIconPath[asset.type] || fileIconPath.image" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					{{ typeLabel }}
				</span>
				<DomStatusPill class="absolute right-3 top-3" :tone="statusTone" size="sm" :dot="false">
					{{ asset.status }}
				</DomStatusPill>
			</div>
		</button>

		<div class="space-y-3 p-3">
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0">
					<h4 class="truncate text-sm font-semibold">{{ asset.title }}</h4>
					<p class="mt-1 truncate text-xs text-muted-fg">{{ asset.collectionLabel }} / {{ asset.dimensions }}</p>
				</div>
				<button
					type="button"
					class="grid size-8 shrink-0 place-items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
					:class="selected ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-canvas text-muted-fg hover:text-canvas-fg'"
					:aria-label="selected ? `Remove ${asset.title}` : `Select ${asset.title}`"
					@click="$emit('toggle', asset)"
				>
					<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path v-if="selected" d="m6 12 4 4 8-8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
						<path v-else d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
					</svg>
				</button>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<DomBadge size="sm" variant="outline">{{ asset.size }}</DomBadge>
				<DomBadge size="sm" variant="outline">{{ asset.usage }} uses</DomBadge>
				<DomBadge size="sm" variant="outline">{{ asset.updatedAt }}</DomBadge>
			</div>
			<div class="flex items-center justify-between gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-[11px] text-muted-fg">
				<span class="truncate">{{ asset.owner }}</span>
				<span class="shrink-0 font-medium text-canvas-fg">{{ asset.placement }}</span>
			</div>
		</div>
	</article>
</template>
