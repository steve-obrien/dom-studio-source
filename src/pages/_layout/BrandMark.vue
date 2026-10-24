<script setup>
import { computed, useId } from 'vue';
import darkSvg from './brand-mark-dark.svg?raw';
import lightSvg from './brand-mark-light.svg?raw';

const props = defineProps({
	title: { type: String, default: '' },
});

// Gradient, mask and clip ids must be unique per instance on the page.
const baseId = useId();
const scope = (svg) => svg.replace(/(id="|url\(#)(ds[ld]-)/g, `$1${baseId}-$2`);
const light = computed(() => scope(lightSvg));
const dark = computed(() => scope(darkSvg));
</script>

<template>
	<span
		class="inline-block"
		:role="props.title ? 'img' : undefined"
		:aria-hidden="props.title ? undefined : 'true'"
		:aria-label="props.title || undefined"
	>
		<span class="block size-full dark:hidden [&>svg]:size-full" v-html="light" />
		<span class="hidden size-full dark:block [&>svg]:size-full" v-html="dark" />
	</span>
</template>
