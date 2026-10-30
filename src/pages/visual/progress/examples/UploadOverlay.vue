<script setup>
import { DomRadialProgress } from '../../../lib/vue';

const uploads = [
	{
		name: 'homepage-hero.jpg',
		type: 'image/jpeg',
		progress: 78,
		tone: 'success',
	},
	{
		name: 'brand-guidelines.pdf',
		type: 'application/pdf',
		progress: 44,
		tone: 'primary',
	},
	{
		name: 'product-gallery.png',
		type: 'image/png',
		progress: 91,
		tone: 'success',
	},
];
</script>

<template>
	<div class="grid w-full gap-4 sm:grid-cols-3">
		<article
			v-for="upload in uploads"
			:key="upload.name"
			class="overflow-hidden rounded-lg border border-border bg-secondary/35 p-3"
		>
			<div class="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-md bg-canvas/60">
				<div class="grid size-14 place-items-center rounded-2xl bg-secondary text-muted-fg ring-1 ring-border">
					<svg viewBox="0 0 24 24" class="size-8" fill="none" aria-hidden="true">
						<path d="M7 3.75h7l3 3v13.5H7V3.75Zm7 0v3h3M9.5 12.5h5M9.5 15.5h3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</div>
				<div class="absolute inset-0 grid place-items-center bg-canvas/50 backdrop-blur-[1px]">
					<DomRadialProgress
						:label="`${upload.name} upload progress`"
						:value="upload.progress"
						:tone="upload.tone"
						size="lg"
					/>
				</div>
			</div>
			<div class="mt-3 min-w-0 text-center">
				<p class="truncate text-sm font-semibold text-canvas-fg">{{ upload.name }}</p>
				<p class="mt-1 text-xs text-muted-fg">{{ upload.type }} - {{ upload.progress }}%</p>
			</div>
		</article>
	</div>
</template>
