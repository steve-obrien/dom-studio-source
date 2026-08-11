<script setup>
import { RouterLink, useRoute } from 'vue-router';
import { computed, onMounted } from 'vue';
import { useTheme } from '../../composable/useTheme';
import BrandLockup from './BrandLockup.vue';
import ThemeToggle from './ThemeToggle.vue';
import { DomPopover } from '../lib/vue';
import AccountMenu from './AccountMenu.vue';
import { sideNavLinks } from './sideNavLinks';
const { initTheme } = useTheme();
onMounted(() => initTheme());

const route = useRoute();

const topLinks = [
	{ to: '/', label: 'Overview', exact: true },
	{ to: '/components', label: 'Components', match: '/components' },
	{ to: '/pricing', label: 'Pricing' },
];

const pageTitle = computed(() => {
	if (route.path.includes('/studio')) return 'Studio';
	if (route.path.includes('/playground')) return 'Playground';
	return 'Inspector';
});
</script>

<template>
	<div class="flex h-dvh flex-col overflow-hidden bg-canvas text-canvas-fg">
		<header class="z-30 shrink-0 border-b border-border/60 bg-canvas">
			<div class="flex h-12 items-center justify-between gap-4 px-4">
				<div class="flex min-w-0 items-center gap-4">
					<RouterLink to="/" class="flex shrink-0 items-center gap-2 text-canvas-fg">
						<BrandLockup mark-class="size-6" />
					</RouterLink>
					<span class="hidden h-4 w-px bg-border sm:block" aria-hidden="true"></span>
					<p class="truncate text-sm font-semibold tracking-tight text-canvas-fg">{{ pageTitle }}</p>
				</div>
				<nav class="flex shrink-0 items-center gap-1 text-sm">
					<RouterLink
					v-for="l in topLinks"
					:key="l.to"
					:to="l.to"
					class="hidden rounded-full px-2.5 py-1 text-xs font-medium transition sm:inline"
					:class="(l.exact ? route.path === l.to : route.path.startsWith(l.match || l.to))
						? 'bg-primary text-primary-fg'
						: 'text-muted-fg hover:text-canvas-fg'">{{ l.label }}</RouterLink>
					<ThemeToggle />
					<AccountMenu compact class="hidden md:inline-flex" />
				</nav>
			</div>
		</header>

		<div class="flex min-h-0 flex-1">
			<main class="flex min-h-0 min-w-0 flex-1 flex-col">
				<slot />
			</main>
		</div>
	</div>
</template>
