<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
	<main class="grid min-h-screen place-items-center bg-canvas px-6 text-canvas-fg">
		<section class="w-full max-w-xl space-y-6 text-center">
			<p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg">404</p>
			<h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">Page not found</h1>
			<p class="text-lg leading-relaxed text-muted-fg">
				This DOM Studio page could not be found. The link may be outdated, or the page may have moved.
			</p>
			<RouterLink
				to="/"
				class="inline-flex rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-canvas-fg transition-colors hover:text-muted-fg"
			>
				Back to DOM Studio
			</RouterLink>
		</section>
	</main>
</template>
