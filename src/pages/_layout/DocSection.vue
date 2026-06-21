<script setup>
defineProps({ title: String, eyebrow: String });
</script>

<template>
	<section class="min-w-0 space-y-4">
		<div v-if="title || eyebrow" class="min-w-0 space-y-1">
			<p v-if="eyebrow" class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg">{{ eyebrow }}</p>
			<h2 v-if="title" class="break-words text-2xl font-semibold tracking-tight text-canvas-fg">{{ title }}</h2>
		</div>
		<slot />
	</section>
</template>
