<script setup>
const files = [
	{ name: 'Brand', kind: 'folder', meta: '48 items' },
	{ name: 'Product shots', kind: 'folder', meta: '126 items' },
	{ name: 'hero-autumn.jpg', kind: 'image', meta: '3.2 MB', art: ['var(--chart-3)', 'var(--chart-1)'], selected: true },
	{ name: 'cafe-interior.jpg', kind: 'image', meta: '2.8 MB', art: ['var(--chart-2)', 'var(--chart-4)'], selected: true },
	{ name: 'price-list.pdf', kind: 'pdf', meta: '640 KB' },
	{ name: 'launch-teaser.mp4', kind: 'video', meta: 'Uploading', art: ['var(--chart-1)', 'var(--chart-4)'], uploading: 64 },
	{ name: 'logo-mark.svg', kind: 'image', meta: '12 KB', art: ['var(--chart-1)', 'var(--chart-2)'], selected: true },
	{ name: 'team-offsite.jpg', kind: 'image', meta: '4.1 MB', art: ['var(--chart-4)', 'var(--chart-3)'], selected: true },
];
</script>

<template>
	<div class="overflow-hidden rounded-2xl border border-border bg-canvas shadow-xl shadow-canvas-fg/5">
		<div class="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 text-xs">
			<span class="text-muted-fg">Media</span><span class="text-muted-fg" aria-hidden="true">/</span>
			<span class="text-muted-fg">Campaigns</span><span class="text-muted-fg" aria-hidden="true">/</span>
			<span class="font-semibold">Autumn 2026</span>
			<span class="ml-auto flex gap-2">
				<span class="rounded-md border border-border px-2.5 py-1.5">New folder</span>
				<span class="rounded-md bg-primary px-2.5 py-1.5 font-medium text-primary-fg">Upload</span>
			</span>
		</div>
		<div class="grid md:grid-cols-[minmax(0,1fr)_14rem]">
			<div class="grid grid-cols-2 content-start gap-3 p-4 sm:grid-cols-4">
				<div v-for="file in files" :key="file.name" class="min-w-0 rounded-xl p-1.5 text-xs" :class="file.selected ? 'bg-ring/15 ring-2 ring-ring' : ''">
					<div class="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-lg border border-border" :style="file.art ? { background: `linear-gradient(135deg, ${file.art[0]}, ${file.art[1]})` } : null" :class="!file.art && 'bg-secondary/50'">
						<span v-if="file.kind === 'folder'" class="text-3xl text-muted-fg" aria-hidden="true">▰</span>
						<span v-else-if="file.kind === 'pdf'" class="rounded bg-destructive px-1.5 py-0.5 text-[0.6rem] font-bold text-destructive-fg">PDF</span>
						<span v-else-if="file.kind === 'video'" class="grid size-8 place-items-center rounded-full bg-canvas/80 text-canvas-fg" aria-hidden="true">▶</span>
						<div v-if="file.uploading" class="absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full bg-canvas/60">
							<div class="h-full rounded-full bg-canvas" :style="{ width: `${file.uploading}%` }"></div>
						</div>
					</div>
					<div class="mt-1.5 truncate font-medium">{{ file.name }}</div>
					<div class="text-[0.65rem] text-muted-fg">{{ file.uploading ? `Uploading · ${file.uploading}%` : file.meta }}</div>
				</div>
			</div>
			<aside class="border-t border-border p-4 text-xs md:border-l md:border-t-0">
				<div class="hidden aspect-[4/3] rounded-lg md:block" style="background: linear-gradient(135deg, var(--chart-3), var(--chart-1))"></div>
				<p class="mt-3 font-semibold">hero-autumn.jpg</p>
				<p class="text-muted-fg">+ 3 more selected</p>
				<dl class="mt-3 space-y-1.5">
					<div class="flex justify-between"><dt class="text-muted-fg">Dimensions</dt><dd>2400 × 1600</dd></div>
					<div class="flex justify-between"><dt class="text-muted-fg">Size</dt><dd>3.2 MB</dd></div>
					<div class="flex justify-between"><dt class="text-muted-fg">Folder</dt><dd>Autumn 2026</dd></div>
				</dl>
				<label class="mt-3 block text-muted-fg">Alt text
					<span class="mt-1 block rounded-md border border-border px-2 py-1.5 text-canvas-fg">Latte art on an oak table</span>
				</label>
				<div class="mt-3 flex gap-2">
					<span class="flex-1 rounded-md bg-primary px-2 py-1.5 text-center font-medium text-primary-fg">Insert 4 files</span>
					<span class="rounded-md border border-border px-2 py-1.5">Move</span>
				</div>
			</aside>
		</div>
	</div>
</template>
