<script setup>
const formats = [
	{ key: 'story', label: 'Instagram story', ratio: '9 / 16', layout: 'tall' },
	{ key: 'post', label: 'Instagram post', ratio: '4 / 5', layout: 'tall' },
	{ key: 'linkedin', label: 'LinkedIn', ratio: '1.91 / 1', layout: 'wide' },
	{ key: 'youtube', label: 'YouTube thumbnail', ratio: '16 / 9', layout: 'wide' },
];
const industries = ['Retail', 'Restaurant', 'Fitness', 'Real estate', 'Beauty', 'Events'];
const story = formats[0];
const post = formats[1];
const landscapes = formats.slice(2);
</script>

<template>
	<div class="overflow-hidden rounded-2xl border border-border bg-canvas shadow-xl shadow-canvas-fg/5">
		<div class="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 text-xs">
			<span class="font-semibold">Autumn edit</span>
			<span class="text-muted-fg">Retail template</span>
			<span class="ml-auto flex flex-wrap gap-2">
				<span class="rounded-md border border-border px-2.5 py-1.5">✦ Generate templates</span>
				<span class="rounded-md bg-primary px-2.5 py-1.5 font-medium text-primary-fg">Export 4 sizes</span>
			</span>
		</div>
		<div class="grid grid-cols-[minmax(0,0.62fr)_minmax(0,0.9fr)_minmax(0,1.25fr)] items-start gap-3 bg-secondary/40 p-4 sm:gap-4 sm:p-6">
			<template v-for="format in [story, post]" :key="format.key">
				<figure class="min-w-0 [container-type:inline-size]">
					<div class="relative flex flex-col items-center justify-between overflow-hidden rounded-lg bg-[#b5462f] p-[8cqw] text-center text-[#fff6ea] shadow-md" :style="{ aspectRatio: format.ratio }">
						<p class="text-[5cqw] font-bold uppercase tracking-[0.3em] opacity-80">Bean & Leaf</p>
						<div>
							<p class="text-[17cqw] font-black uppercase leading-[0.85] tracking-tight">Autumn<br />edit</p>
							<p class="mx-auto mt-[6cqw] grid size-[34cqw] place-items-center rounded-full bg-[#fff6ea] text-[9cqw] font-black leading-none text-[#b5462f]">30%<br /><span class="text-[5cqw] tracking-widest">OFF</span></p>
						</div>
						<p class="rounded-full bg-[#fff6ea] px-[6cqw] py-[2.5cqw] text-[5.5cqw] font-bold text-[#b5462f]">Shop the edit</p>
					</div>
					<figcaption class="mt-2 truncate text-[0.68rem] text-muted-fg">{{ format.label }}</figcaption>
				</figure>
			</template>
			<div class="min-w-0 space-y-4">
				<figure v-for="format in landscapes" :key="format.key" class="[container-type:inline-size]">
					<div class="relative flex items-center justify-between gap-[4cqw] overflow-hidden rounded-lg bg-[#b5462f] px-[6cqw] text-[#fff6ea] shadow-md" :style="{ aspectRatio: format.ratio }">
						<div>
							<p class="text-[3cqw] font-bold uppercase tracking-[0.3em] opacity-80">Bean & Leaf</p>
							<p class="mt-[1.5cqw] text-[9cqw] font-black uppercase leading-[0.85] tracking-tight">Autumn<br />edit</p>
							<p class="mt-[3cqw] inline-block rounded-full bg-[#fff6ea] px-[3.5cqw] py-[1.4cqw] text-[3cqw] font-bold text-[#b5462f]">Shop the edit</p>
						</div>
						<p class="grid size-[22cqw] shrink-0 place-items-center rounded-full bg-[#fff6ea] text-[6cqw] font-black leading-none text-[#b5462f]">30%<br /><span class="text-[3cqw] tracking-widest">OFF</span></p>
					</div>
					<figcaption class="mt-2 truncate text-[0.68rem] text-muted-fg">{{ format.label }}</figcaption>
				</figure>
			</div>
		</div>
		<div class="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3 text-xs">
			<span class="text-muted-fg">Templates</span>
			<span v-for="(industry, index) in industries" :key="industry" class="rounded-full border border-border px-2.5 py-1" :class="index === 0 && 'bg-secondary font-medium'">{{ industry }}</span>
		</div>
	</div>
</template>
