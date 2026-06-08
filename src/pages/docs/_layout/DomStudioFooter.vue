<script setup>
import { RouterLink } from 'vue-router';
import BrandMark from './BrandMark.vue';
</script>

<template>
	<footer class="border-t border-border/60">
		<div class="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 px-4 py-10 text-sm text-muted-foreground sm:px-6 lg:flex-row lg:items-center">
			<div class="flex min-w-0 items-center gap-3">
				<BrandMark class="size-6 shrink-0" />
				<span>© {{ new Date().getFullYear() }} DOM Studio</span>
			</div>
			<div class="flex max-w-full flex-wrap items-center gap-x-5 gap-y-2">
				<RouterLink to="/docs" class="hover:text-foreground">Overview</RouterLink>
				<RouterLink to="/docs/ai" class="hover:text-foreground">AI</RouterLink>
				<RouterLink to="/docs/theming" class="hover:text-foreground">Theming</RouterLink>
				<RouterLink to="/docs/components/button" class="hover:text-foreground">Components</RouterLink>
				<RouterLink to="/docs/visual/card" class="hover:text-foreground">Visual</RouterLink>
				<RouterLink to="/docs/blocks/dashboard" class="hover:text-foreground">Blocks</RouterLink>
				<RouterLink to="/docs/pricing" class="hover:text-foreground">Pricing</RouterLink>
				<a href="https://github.com/steve-obrien/getdom-studio" target="_blank" rel="noopener" class="hover:text-foreground">GitHub</a>
			</div>
		</div>
	</footer>
</template>
