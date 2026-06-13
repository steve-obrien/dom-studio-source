<script setup>
import { RouterLink, useRoute } from 'vue-router';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useTheme } from '../../composable/useTheme';
import ThemeToggle from './ThemeToggle.vue';
import BrandLockup from './BrandLockup.vue';
import SideNav from './SideNav.vue';
import DomStudioFooter from './DomStudioFooter.vue';
import AccountMenu from './AccountMenu.vue';

const props = defineProps({
	fullWidth: { type: Boolean, default: false },
});

const { initTheme } = useTheme();

const route = useRoute();
const mobileMenuOpen = ref(false);
const sidebarRoutePrefixes = [
	'/ai',
	'/blocks',
	'/component-spec',
	'/components',
	'/forms',
	'/headless',
	'/mobile',
	'/theming',
	'/visual',
];

const wideContentRoutePrefixes = [
	'/blocks',
	'/components',
	'/forms',
	'/headless',
	'/mobile',
	'/visual',
];

const showSidebar = computed(() => !props.fullWidth && sidebarRoutePrefixes.some((prefix) => (
	route.path === prefix || route.path.startsWith(`${prefix}/`)
)));

const contentMaxWidthClass = computed(() => (
	wideContentRoutePrefixes.some((prefix) => route.path === prefix || route.path.startsWith(`${prefix}/`))
		? 'max-w-none'
		: 'max-w-4xl'
));

const topLinks = [
	{ to: '/', label: 'Overview', exact: true },
	{ to: '/ai', label: 'AI' },
	{ to: '/theming', label: 'Theming' },
	{ to: '/components/button', label: 'Components', match: '/components' },
	{ to: '/visual/card', label: 'Visual', match: '/visual' },
	{ to: '/blocks', label: 'Blocks', match: '/blocks' },
	{ to: '/pricing', label: 'Pricing' },
	{ to: '/blog', label: 'Blog' },
];

const detailsPanel = ref(null);

function isTopLinkActive(link) {
	return link.exact
		? route.path === link.to
		: route.path.startsWith(link.match || link.to);
}

function scrollDetailsToTop() {
	if (detailsPanel.value) detailsPanel.value.scrollTo({ top: 0 });
}

watch(() => route.fullPath, async () => {
	mobileMenuOpen.value = false;
	await nextTick();
	scrollDetailsToTop();
});

onMounted(() => {
	initTheme();
});
</script>

<template>
	<div
		class="min-h-screen bg-canvas text-canvas-fg"
		:class="showSidebar && 'md:fixed md:inset-0 md:overflow-hidden'"
	>
		<header class="sticky top-0 z-30 border-b border-border/60 bg-canvas/80 backdrop-blur">
			<div class="mx-auto flex h-16 w-full min-w-0 items-center justify-between gap-3 px-4 sm:px-6">
				<RouterLink to="/" class="flex min-w-0 items-center gap-2 text-canvas-fg">
					<BrandLockup show-badge />
				</RouterLink>
				<nav class="hidden min-w-0 items-center gap-1 text-sm md:flex">
					<RouterLink
						v-for="l in topLinks"
						:key="l.to"
						:to="l.to"
						class="rounded-full px-3 py-1.5 font-medium transition"
						:class="isTopLinkActive(l)
							? 'bg-primary text-primary-fg'
							: 'text-muted-fg hover:text-canvas-fg'"
					>{{ l.label }}</RouterLink>
					<div class="ml-2">
						<ThemeToggle />
					</div>
					<AccountMenu class="ml-2" />
				</nav>
				<div class="flex shrink-0 items-center gap-1 md:hidden">
					<ThemeToggle />
					<button
						type="button"
						class="grid size-9 place-items-center rounded-full text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
						:aria-expanded="mobileMenuOpen"
						aria-controls="mobile-site-menu"
						:aria-label="mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'"
						@click="mobileMenuOpen = !mobileMenuOpen"
					>
						<svg
							v-if="!mobileMenuOpen"
							viewBox="0 0 24 24"
							class="size-5"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M4 7h16M4 12h16M4 17h16" />
						</svg>
						<svg
							v-else
							viewBox="0 0 24 24"
							class="size-5"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M6 6l12 12M18 6 6 18" />
						</svg>
					</button>
				</div>
			</div>
			<div
				v-if="mobileMenuOpen"
				id="mobile-site-menu"
				class="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border/60 bg-canvas/95 shadow-lg backdrop-blur md:hidden"
			>
				<nav class="grid gap-1 px-4 py-3 text-sm">
					<RouterLink
						v-for="l in topLinks"
						:key="l.to"
						:to="l.to"
						class="rounded-lg px-3 py-2 font-medium transition"
						:class="isTopLinkActive(l)
							? 'bg-primary text-primary-fg'
							: 'text-muted-fg hover:bg-secondary hover:text-canvas-fg'"
					>{{ l.label }}</RouterLink>
				</nav>
				<div v-if="showSidebar" class="border-t border-border/60 px-4 py-4">
					<SideNav
						persist-scroll
						scroll-key="dom-studio-mobile-side-nav-scroll"
					/>
				</div>
				<div class="flex items-center justify-between border-t border-border/60 px-4 py-3">
					<ThemeToggle />
					<AccountMenu compact />
				</div>
			</div>
		</header>

		<div v-if="showSidebar" class="w-full px-4">
			<div class="flex min-h-0 gap-12 py-10 md:h-[calc(100vh-4rem)] md:overflow-hidden md:py-0">
				<SideNav persist-scroll class="docs-sidebar w-56 shrink-0 md:h-full md:overflow-y-auto md:py-10 md:pr-2" />

				<main ref="detailsPanel" class="min-h-0 min-w-0 flex-1 md:h-full md:overflow-y-auto md:py-10 md:pr-2">
					<div class="mx-auto w-full" :class="contentMaxWidthClass">
						<slot />
					</div>
					<DomStudioFooter class="mt-16" />
				</main>
			</div>
		</div>

		<div v-else class="w-full px-4">
			<div class="flex gap-12 py-10" :class="fullWidth && 'py-6'">
				<main class="min-w-0 flex-1">
					<div class="mx-auto w-full" :class="contentMaxWidthClass">
						<slot />
					</div>
				</main>
			</div>
		</div>

		<DomStudioFooter v-if="!showSidebar" />
	</div>
</template>
