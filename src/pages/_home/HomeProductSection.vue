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
});
</script>

<template>
	<section :id="id" class="scroll-mt-20 border-t border-border" :class="tinted && 'bg-secondary/20'">
		<div class="mx-auto grid max-w-[1320px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-14 lg:py-24">
			<div class="min-w-0 lg:sticky lg:top-24 lg:self-start">
				<p class="font-mono text-xs uppercase tracking-[0.18em] text-muted-fg">{{ number }} / {{ product }}</p>
				<h2 class="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-[2.6rem]">{{ title }}</h2>
				<p class="mt-4 max-w-md text-base leading-7 text-muted-fg">{{ text }}</p>
				<ul class="mt-6 space-y-2.5 text-sm">
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
			<div class="min-w-0">
				<slot />
			</div>
		</div>
	</section>
</template>
