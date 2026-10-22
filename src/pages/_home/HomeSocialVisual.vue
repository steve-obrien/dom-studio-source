<script setup>
import HomeSocialPost from './HomeSocialPost.vue';

const layers = ['Brand', 'Headline', 'Badge', 'Discount', 'Button', 'Background'];
const formats = [
	{ key: 'post', label: 'Instagram post', size: '1080 × 1350', ratio: '4 / 5', layout: 'tall', width: 'w-[4.6rem]' },
	{ key: 'story', label: 'Instagram story', size: '1080 × 1920', ratio: '9 / 16', layout: 'tall', width: 'w-[3.3rem]' },
	{ key: 'linkedin', label: 'LinkedIn', size: '1200 × 627', ratio: '1.91 / 1', layout: 'wide', width: 'w-[11rem]' },
	{ key: 'youtube', label: 'YouTube', size: '1280 × 720', ratio: '16 / 9', layout: 'wide', width: 'w-[10rem]' },
];
const inspector = [['Pin across', 'Stretch'], ['Pin down', 'Centre'], ['Font', 'Condensed'], ['Size', '200']];
</script>

<template>
	<div class="overflow-hidden rounded-2xl border border-border bg-canvas shadow-xl shadow-canvas-fg/5">
		<div class="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5 text-xs">
			<span class="font-semibold">Social post studio</span>
			<span class="rounded-md border border-border px-2 py-1">Instagram post · 1080 × 1350 ▾</span>
			<span class="ml-auto flex items-center gap-3">
				<span class="hidden text-muted-fg sm:inline">Undo</span>
				<span class="hidden sm:inline">✦ Templates</span>
				<span class="rounded-md bg-primary px-2.5 py-1.5 font-medium text-primary-fg">Export</span>
			</span>
		</div>
		<div class="grid sm:grid-cols-[7.5rem_minmax(0,1fr)_9.5rem]">
			<aside class="hidden border-r border-border py-2 text-xs sm:block">
				<p class="px-3 pb-1.5 text-[0.62rem] font-medium uppercase tracking-wider text-muted-fg">Layers</p>
				<p v-for="layer in layers" :key="layer" class="mx-1.5 rounded-md px-2 py-1" :class="layer === 'Headline' ? 'bg-primary text-primary-fg' : 'text-muted-fg'">{{ layer === 'Headline' ? 'T' : '▢' }}&nbsp; {{ layer }}</p>
				<div class="mx-3 mt-3 flex flex-wrap gap-1 border-t border-border pt-3 text-[0.62rem]">
					<span class="rounded border border-border px-1.5 py-0.5">+ Text</span>
					<span class="rounded border border-border px-1.5 py-0.5">+ Image</span>
				</div>
			</aside>
			<div class="relative grid place-items-center bg-secondary/40 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] px-4 py-6 [background-size:14px_14px]">
				<div class="relative w-[13.5rem] shadow-lg">
					<HomeSocialPost layout="tall" ratio="4 / 5" selected />
				</div>
				<span class="absolute bottom-2 left-3 text-[0.62rem] text-muted-fg">Headline · 952 × 250 · snap on</span>
			</div>
			<aside class="hidden border-l border-border p-3 text-xs sm:block">
				<p class="font-semibold">Headline</p>
				<p class="text-[0.62rem] text-muted-fg">Text layer</p>
				<div class="mt-3 space-y-2">
					<label v-for="[name, value] in inspector" :key="name" class="block text-[0.62rem] text-muted-fg">{{ name }}
						<span class="mt-0.5 block rounded-md border border-border px-2 py-1 text-xs text-canvas-fg">{{ value }}</span>
					</label>
				</div>
			</aside>
		</div>
		<div class="border-t border-border px-4 py-3">
			<p class="text-xs"><span class="font-semibold">Every format</span> <span class="text-muted-fg">· live previews that follow each layer’s pins</span></p>
			<div class="mt-2.5 flex items-end gap-3 overflow-x-auto pb-1">
				<figure v-for="(format, index) in formats" :key="format.key" class="shrink-0">
					<div class="overflow-hidden rounded" :class="[format.width, index === 0 && 'ring-2 ring-canvas-fg ring-offset-2 ring-offset-canvas']">
						<HomeSocialPost :layout="format.layout" :ratio="format.ratio" />
					</div>
					<figcaption class="mt-1.5 whitespace-nowrap text-[0.62rem]"><span class="font-medium">{{ format.label }}</span> <span class="text-muted-fg">{{ format.size }}</span></figcaption>
				</figure>
			</div>
		</div>
	</div>
</template>
