<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
defineProps({
	name: { type: String, required: true },
	tagline: { type: String, required: true },
	tag: { type: String, default: '' },
	eyebrow: { type: String, default: 'Component' },
});
</script>

<template>
	<article class="max-w-full space-y-12">
		<header class="min-w-0 space-y-3 border-b border-border pb-8">
			<p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg">{{ eyebrow }}</p>
			<div class="flex min-w-0 flex-wrap items-end justify-between gap-4">
				<h1 class="min-w-0 break-words text-4xl font-bold tracking-tight text-canvas-fg sm:text-5xl">{{ route.meta.heading || name }}</h1>
				<code v-if="tag" class="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-muted-fg ring-1 ring-border">{{ tag }}</code>
			</div>
			<p class="max-w-2xl text-lg leading-relaxed text-muted-fg">{{ tagline }}</p>
		</header>
		<slot />
	</article>
</template>
