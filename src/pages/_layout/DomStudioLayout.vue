<script setup>
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useTheme } from '../../composable/useTheme';
import ThemeToggle from './ThemeToggle.vue';
import BrandLockup from './BrandLockup.vue';
import SideNav from './SideNav.vue';
import { sideNavLinks } from './sideNavLinks.js';
import { isLibraryActive, isNavigationItemActive, libraryNavigation, pricingLink, primaryNavigation } from './siteNavigation.js';
import DomPopover from '../components/popover/DomPopover.vue';
import DomMenuStack from '../components/menu-stack/DomMenuStack.vue';
import DomStudioFooter from './DomStudioFooter.vue';
import AccountMenu from './AccountMenu.vue';
import { getGlobalSearchCommands } from './globalSearch.js';
import { getComponentNavigationSection, getComponentRecordByRoute } from './componentManager.js';
import DomLiquidGlassSurface from '../lib/vue/_internal/DomLiquidGlassSurface.vue';
import { LIQUID_GLASS_EFFECTS } from '../lib/vue/_internal/liquidGlassConfig.js';

/**
 * Loads the global search surface only after the user opens it.
 *
 * @returns {Promise<object>} Vue SFC module.
 */
function loadCommandPalette() {
	return import('../components/command-palette/DomCommandPalette.vue');
}

const DomCommandPalette = defineAsyncComponent(loadCommandPalette);
const props = defineProps({
	fullWidth: { type: Boolean, default: false },
});

const globalSearchOpenEvent = 'dom-studio:open-global-search';
const { initTheme } = useTheme();

const route = useRoute();
const router = useRouter();
const isMounted = ref(false);
const mobileMenuOpen = ref(false);
const mobileMenu = ref(null);
const searchOpen = ref(false);
const searchReady = ref(false);
const isHeaderFloating = ref(false);
const searchCommands = getGlobalSearchCommands();
const STICKY_HEADER_THRESHOLD = 8;
const sidebarRoutePrefixes = [
	'/ai',
	'/blocks',
	'/component-spec',
	'/components',
	'/data',
	'/charts',
	'/dev',
	'/designer',
	'/forms',
	'/headless',
	'/icons',
	'/install',
	'/mobile',
	'/tools',
	'/theming',
	'/visual',
];

const wideContentRoutePrefixes = [
	'/blocks',
	'/components',
	'/data',
	'/charts',
	'/dev',
	'/designer',
	'/forms',
	'/headless',
	'/icons',
	'/mobile',
	'/tools',
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

const libraryMenu = ref(null);
const libraryMenuOpen = ref(false);
const libraryActive = computed(() => isLibraryActive(route.path));

/** Converts sidebar groups into stable nested pages, retaining branch overview links. */
function menuItems(items, prefix) {
	return items.map((item, index) => {
		const id = `${prefix}-${index}`;
		return {
			id,
			label: item.label,
			to: item.to,
			...(item.children?.length ? { children: [
				...(item.to ? [{ id: `${id}-overview`, label: `${item.label} overview`, to: item.to }] : []),
				...menuItems(item.children, id),
			] } : {}),
		};
	});
}

const mobileNavigation = sideNavLinks.map((group, index) => ({
	id: `section-${index}`,
	label: group.label,
	children: menuItems(group.items, `section-${index}`),
}));

const detailsPanel = ref(null);
const sidebarCollapsed = ref(false);
const SIDEBAR_COLLAPSED_KEY = 'dom-studio-side-nav-collapsed';

/**
 * Reads the desktop documentation-sidebar preference when browser storage is available.
 *
 * @returns {void}
 */
function restoreSidebarPreference() {
	if (typeof window === 'undefined') return;
	try {
		sidebarCollapsed.value = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
	} catch {
		// Keep the expanded default when storage is unavailable.
	}
}

/**
 * Expands or collapses the desktop documentation sidebar and persists the choice.
 *
 * @returns {void}
 */
function toggleSidebar() {
	sidebarCollapsed.value = !sidebarCollapsed.value;
	try {
		window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed.value));
	} catch {
		// The in-memory state still works when storage is unavailable.
	}
}

/** Closes the mobile popover when desktop navigation replaces its trigger. */
function closeMenuAtDesktopWidth() {
	if (window.innerWidth >= 1024) mobileMenu.value?.close();
	else libraryMenu.value?.close();
}

/**
 * Updates the condensed header treatment from either viewport or docs-panel scrolling.
 *
 * @returns {void}
 */
function updateStickyHeaderState() {
	if (typeof window === 'undefined') return;
	const scrollTop = Math.max(
		window.scrollY || document.documentElement.scrollTop || 0,
		detailsPanel.value?.scrollTop || 0,
	);
	isHeaderFloating.value = scrollTop > STICKY_HEADER_THRESHOLD;
}

/**
 * Moves the sticky-header scroll listener when Vue replaces the docs panel.
 *
 * @param {HTMLElement|null} nextPanel Newly rendered docs scroll panel.
 * @param {HTMLElement|null} previousPanel Previously rendered docs scroll panel.
 * @returns {void}
 */
function connectDetailsPanelScroll(nextPanel, previousPanel) {
	previousPanel?.removeEventListener('scroll', updateStickyHeaderState);
	nextPanel?.addEventListener('scroll', updateStickyHeaderState, { passive: true });
	updateStickyHeaderState();
}

/**
 * Checks whether a header navigation item matches the current route.
 *
 * @param {{ match?: string[], to: string }} link Navigation item.
 * @returns {boolean} Whether the item is active.
 */
function isTopLinkActive(link) {
	const component = getComponentRecordByRoute(route.path);
	if (component && getComponentNavigationSection(component) === 'ai') return link.to === '/ai';
	return isNavigationItemActive(link, route.path);
}

/**
 * Scrolls the fixed docs detail panel back to the top after route changes.
 *
 * @returns {void}
 */
function scrollDetailsToTop() {
	if (detailsPanel.value) detailsPanel.value.scrollTo({ top: 0 });
}

/**
 * Opens the global command palette.
 *
 * @returns {void}
 */
function openGlobalSearch() {
	searchReady.value = true;
	searchOpen.value = true;
}

/**
 * Runs a selected global-search command.
 *
 * @param {{ command?: { to?: string }, value?: string }} event Search select event.
 * @returns {void}
 */
function runGlobalSearch(event) {
	const target = event.command?.to || event.value;
	if (typeof target !== 'string' || !target.startsWith('/')) return;
	router.push(target);
}

watch(() => route.path, async () => {
	mobileMenu.value?.close();
	libraryMenu.value?.close();
	await nextTick();
	scrollDetailsToTop();
	updateStickyHeaderState();
});
watch(detailsPanel, connectDetailsPanelScroll, { flush: 'post' });

onMounted(() => {
	isMounted.value = true;
	initTheme();
	restoreSidebarPreference();
	if (typeof window === 'undefined') return;
	window.addEventListener(globalSearchOpenEvent, openGlobalSearch);
	window.addEventListener('scroll', updateStickyHeaderState, { passive: true });
	window.addEventListener('resize', closeMenuAtDesktopWidth, { passive: true });
	updateStickyHeaderState();
});

onBeforeUnmount(() => {
	if (typeof window === 'undefined') return;
	window.removeEventListener(globalSearchOpenEvent, openGlobalSearch);
	window.removeEventListener('scroll', updateStickyHeaderState);
	window.removeEventListener('resize', closeMenuAtDesktopWidth);
	detailsPanel.value?.removeEventListener('scroll', updateStickyHeaderState);
});
</script>

<template>
	<div
		class="min-h-screen bg-canvas text-canvas-fg"
		:class="showSidebar && 'md:fixed md:inset-0 md:overflow-hidden'"
	>
		<header
			class="sticky z-30 overflow-hidden transition-[top,margin,border-radius,box-shadow,background-color] duration-300 ease-out"
			:class="LIQUID_GLASS_EFFECTS.stickyHeader && isHeaderFloating
				? 'top-3 mx-3 rounded-[2rem] shadow-xl'
				: 'top-0 border-b border-border/60 bg-canvas/80 backdrop-blur'"
		>
			<DomLiquidGlassSurface
				v-if="LIQUID_GLASS_EFFECTS.stickyHeader && isHeaderFloating"
				:refraction="34"
				class="pointer-events-none absolute inset-0"
				:style="{
					'--dom-liquid-glass-position': 'absolute',
					'--dom-liquid-glass-radius': '2rem',
					'--dom-liquid-glass-surface-fill': 'color-mix(in oklch, var(--canvas) 48%, transparent)',
					'--dom-liquid-glass-shadow': 'none',
				}"
				aria-hidden="true"
			/>

			<div class="relative z-[1] mx-auto flex h-16 w-full min-w-0 items-center justify-between gap-3 px-4 sm:px-6">
				<RouterLink to="/" class="flex min-w-0 items-center gap-2 text-canvas-fg">
					<BrandLockup />
				</RouterLink>
				<nav class="hidden min-w-0 items-center gap-1 text-sm lg:flex">
					<RouterLink
						v-for="l in primaryNavigation"
						:key="l.to"
						:to="l.to"
						:title="l.description"
						class="rounded-full px-2.5 py-1.5 font-medium transition xl:px-3"
						:class="isTopLinkActive(l)
							? 'bg-primary text-primary-fg'
							: 'text-muted-fg hover:text-canvas-fg'"
					>{{ l.label }}</RouterLink>
					<span class="mx-1 h-4 w-px bg-border" aria-hidden="true"></span>
					<button
						id="library-menu-trigger"
						type="button"
						class="flex items-center gap-1 rounded-full px-2.5 py-1.5 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 xl:px-3"
						:class="libraryActive
							? 'bg-secondary text-canvas-fg'
							: 'text-muted-fg hover:text-canvas-fg'"
						:aria-expanded="libraryMenuOpen"
						aria-controls="library-menu"
						aria-haspopup="true"
					>
						Library
						<svg viewBox="0 0 24 24" class="size-3.5 transition" :class="libraryMenuOpen && 'rotate-180'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="m7 10 5 5 5-5" />
						</svg>
					</button>
					<RouterLink
						:to="pricingLink.to"
						class="rounded-full px-2.5 py-1.5 font-medium transition xl:px-3"
						:class="isTopLinkActive(pricingLink)
							? 'bg-primary text-primary-fg'
							: 'text-muted-fg hover:text-canvas-fg'"
					>{{ pricingLink.label }}</RouterLink>
					<button
						type="button"
						class="ml-1 grid size-9 shrink-0 place-items-center rounded-full border border-border bg-secondary text-sm font-medium text-muted-fg transition hover:bg-accent hover:text-accent-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 xl:ml-2 xl:flex xl:w-auto xl:gap-2 xl:px-3"
						aria-label="Search DOM Studio"
						title="Search DOM Studio"
						@click="openGlobalSearch"
					>
						<svg viewBox="0 0 24 24" class="size-4 shrink-0" fill="none" aria-hidden="true">
							<path d="M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm4.5 10.5L20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						</svg>
						<span class="hidden xl:inline">Search</span>
						<kbd class="hidden rounded border border-border bg-canvas px-1.5 py-0.5 text-[11px] font-semibold text-muted-fg xl:inline">⌘K</kbd>
					</button>
					<div class="ml-1 xl:ml-2">
						<ThemeToggle />
					</div>
					<div class="ml-1 xl:hidden">
						<AccountMenu compact />
					</div>
					<div class="ml-2 hidden xl:block">
						<AccountMenu />
					</div>
				</nav>
				<div class="flex shrink-0 items-center gap-1 lg:hidden">
					<button
						type="button"
						class="grid size-9 place-items-center rounded-full text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
						aria-label="Search DOM Studio"
						title="Search DOM Studio"
						@click="openGlobalSearch"
					>
						<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
							<path d="M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm4.5 10.5L20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						</svg>
					</button>
					<ThemeToggle />
					<button
						type="button"
						class="grid size-9 place-items-center rounded-full text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
						id="mobile-site-menu-trigger"
						:aria-expanded="mobileMenuOpen"
						aria-controls="mobile-site-menu"
						:aria-label="mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'"
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
		</header>

		<DomPopover
			ref="libraryMenu"
			trigger-id="library-menu-trigger"
			position="bottom-start"
			:arrow="false"
			width="w-[min(34rem,calc(100vw-2rem))]"
			padding="p-0"
			@open="libraryMenuOpen = true"
			@close="libraryMenuOpen = false"
		>
			<template #default="{ close }">
				<div id="library-menu" class="grid gap-0 sm:grid-cols-[1.4fr_1fr]">
					<section
						v-for="(group, index) in libraryNavigation"
						:key="group.label"
						class="p-3"
						:class="index && 'border-t border-border bg-secondary/40 sm:border-t-0 sm:border-l'"
					>
						<h2 class="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-fg">{{ group.label }}</h2>
						<ul class="grid gap-0.5">
							<li v-for="item in group.items" :key="item.to">
								<RouterLink
									:to="item.to"
									class="block rounded-md px-2 py-1.5 transition hover:bg-accent hover:text-accent-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
									:class="isNavigationItemActive(item, route.path) && 'bg-accent text-accent-fg'"
									@click="close"
								>
									<span class="block text-sm font-medium">{{ item.label }}</span>
									<span class="block text-xs leading-5 text-muted-fg">{{ item.description }}</span>
								</RouterLink>
							</li>
						</ul>
					</section>
				</div>
			</template>
		</DomPopover>

		<DomPopover
			ref="mobileMenu"
			trigger-id="mobile-site-menu-trigger"
			position="bottom-end"
			:arrow="false"
			:flip="false"
			width="w-[min(24rem,calc(100vw-2rem))]"
			padding="p-0"
			@open="mobileMenuOpen = true"
			@close="mobileMenuOpen = false"
		>
			<template #default="{ close }">
				<div id="mobile-site-menu" class="overflow-hidden rounded-lg">
					<DomMenuStack
						v-if="mobileMenuOpen"
						title="Explore DOM Studio"
						:items="mobileNavigation"
						height="min(32rem, calc(100dvh - 10rem))"
						class="border-0"
						@select="close"
					/>
					<div class="flex items-center justify-between border-t border-border px-4 py-3">
						<ThemeToggle />
						<AccountMenu compact />
					</div>
				</div>
			</template>
		</DomPopover>

		<div v-if="showSidebar" class="w-full px-4 md:-mt-16">
			<div class="flex min-h-0 min-w-0 gap-0 py-10 md:h-screen md:gap-6 md:overflow-hidden md:py-0">
				<aside
					class="docs-sidebar hidden shrink-0 transition-[width] duration-200 md:block md:h-full md:pt-[5.25rem]"
					:class="sidebarCollapsed ? 'w-10' : 'w-56'"
				>
					<div class="flex h-10 items-center" :class="sidebarCollapsed ? 'justify-center' : 'justify-end pr-2'">
						<button
							type="button"
							class="grid size-8 place-items-center rounded-md text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
							:aria-label="sidebarCollapsed ? 'Expand documentation navigation' : 'Collapse documentation navigation'"
							:title="sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'"
							@click="toggleSidebar"
						>
							<svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M4 5h16v14H4V5Zm5 0v14" />
								<path v-if="sidebarCollapsed" d="m13 9 3 3-3 3" />
								<path v-else d="m16 9-3 3 3 3" />
							</svg>
						</button>
					</div>
					<SideNav
						v-show="!sidebarCollapsed"
						persist-scroll
						class="h-[calc(100%-2.5rem)] overflow-y-auto pb-10 pr-2"
					/>
				</aside>

				<main ref="detailsPanel" class="min-h-0 min-w-0 flex-1 md:h-full md:overflow-y-auto md:pb-10 md:pt-[6.5rem] md:pr-2">
					<div class="mx-auto w-full min-w-0" :class="contentMaxWidthClass">
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
		<DomCommandPalette
			v-if="isMounted && searchReady"
			v-model="searchOpen"
			:commands="searchCommands"
			shortcut=""
			placeholder="Search pages, components, blocks..."
			@select="runGlobalSearch"
		/>
	</div>
</template>
