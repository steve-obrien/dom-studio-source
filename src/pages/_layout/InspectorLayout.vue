<script setup>
import { RouterLink, useRoute } from 'vue-router';
import { computed, onMounted, ref } from 'vue';
import { useTheme } from '../../composable/useTheme';
import BrandLockup from './BrandLockup.vue';
import ThemeToggle from './ThemeToggle.vue';
import { DomDrawer } from '../lib/vue';
import AccountMenu from './AccountMenu.vue';
import SideNav from './SideNav.vue';
const { initTheme } = useTheme();
onMounted(() => initTheme());

const route = useRoute();
const navigationOpen = ref(false);

const topLinks = [
	{ to: '/', label: 'Overview', exact: true },
	{ to: '/components', label: 'Components', match: '/components' },
	{ to: '/pricing', label: 'Pricing' },
];

const pageTitle = computed(() => {
	if (route.path === '/theming/editor') return 'Theme editor';
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
					<button
						type="button"
						class="grid size-8 shrink-0 place-items-center rounded-md text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
						:aria-expanded="navigationOpen"
						aria-label="Open documentation navigation"
						@click="navigationOpen = true"
					>
						<svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M4 5h16v14H4V5Zm5 0v14" />
						</svg>
					</button>
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
					<div class="hidden md:block">
						<AccountMenu compact />
					</div>
				</nav>
			</div>
		</header>

		<div class="flex min-h-0 flex-1">
			<main class="flex min-h-0 min-w-0 flex-1 flex-col">
				<slot />
			</main>
		</div>


		<DomDrawer
			v-model="navigationOpen"
			side="left"
			title="Documentation"
			width="min(19rem, calc(100vw - 2rem))"
		>
			<SideNav class="px-3 py-4" @click="navigationOpen = false" />
		</DomDrawer>
	</div>
</template>
