<script setup>
import { RouterLink } from 'vue-router';

defineProps({
	id: { type: String, required: true },
	number: { type: String, required: true },
	product: { type: String, required: true },
	title: { type: String, required: true },
	text: { type: String, required: true },
	features: { type: Array, default: () => [] },
	to: { type: String, required: true },
	link: { type: String, required: true },
	more: { type: Array, default: () => [] },
	tinted: { type: Boolean, default: false },
	/** Lets large application demos use the page width while keeping the introduction readable. */
	wideDemo: { type: Boolean, default: false },
});
</script>

<template>
	<section :id="id" class="scroll-mt-20 border-t border-border" :class="tinted && 'bg-secondary/20'">
		<div class="grid min-w-0 gap-10 py-16 lg:gap-14 lg:py-24">
			<div class="mx-auto grid w-full min-w-0 max-w-[1320px] gap-x-14 px-5 sm:px-8 lg:grid-cols-2">
				<div>
				<img :src="`/media/product-icons-3d/${id}.webp`" width="128" height="128" alt="" loading="lazy" class="-ml-3 mb-3 size-28 sm:size-32">
				<p class="font-mono text-xs uppercase tracking-[0.18em] text-muted-fg">{{ number }} / {{ product }}</p>
				<h2 class="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-[2.6rem]">{{ title }}</h2>
				<p class="mt-4 max-w-md text-base leading-7 text-muted-fg">{{ text }}</p>
				</div>
				<div class="lg:pt-8">
				<ul class="mt-6 space-y-2.5 text-sm sm:columns-2 sm:gap-8 lg:mt-0 [&>li]:mb-2.5 [&>li]:break-inside-avoid">
					<li v-for="feature in features" :key="feature" class="flex gap-3">
						<span class="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-success/15 text-[0.6rem] text-success" aria-hidden="true">✓</span>
						<span>{{ feature }}</span>
					</li>
				</ul>
				<div class="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
					<RouterLink :to="to" class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-fg hover:opacity-90">{{ link }} <span aria-hidden="true">→</span></RouterLink>
					<RouterLink v-for="item in more" :key="item.to" :to="item.to" class="text-sm font-medium text-muted-fg underline decoration-border underline-offset-4 hover:text-canvas-fg">{{ item.label }}</RouterLink>
				</div>
				</div>
			</div>
			<div class="mx-auto w-full min-w-0 px-5 sm:px-8" :class="!wideDemo && 'max-w-[1320px]'">
				<slot />
			</div>
		</div>
	</section>
</template>
