<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { productIconForPath, productIconSrc } from './productIcons.js';

const route = useRoute();
const props = defineProps({
	name: { type: String, required: true },
	tagline: { type: String, required: true },
	tag: { type: String, default: '' },
	eyebrow: { type: String, default: 'Component' },
	// Product icon id; defaults to the product this route belongs to.
	icon: { type: String, default: undefined },
});
const iconSrc = computed(() => productIconSrc(props.icon ?? productIconForPath(route.path)));
</script>

<template>
	<article class="max-w-full space-y-12">
		<header class="min-w-0 space-y-3 border-b border-border pb-8">
			<img v-if="iconSrc" :src="iconSrc" width="112" height="112" alt="" class="-ml-2 size-24 sm:size-28">
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
