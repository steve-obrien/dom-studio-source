<script setup>
import { RouterLink, useRoute } from 'vue-router';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useTheme } from '../../../composable/useTheme';
import ThemeToggle from './ThemeToggle.vue';
import { DomDrawer, DomButton } from '@getdom/studio/vue';
import BrandLockup from './BrandLockup.vue';
import SideNav from './SideNav.vue';
import DomStudioFooter from './DomStudioFooter.vue';
import AccountMenu from './AccountMenu.vue';

const props = defineProps({
	fullWidth: { type: Boolean, default: false },
});

const { initTheme } = useTheme();

const route = useRoute();
// Sidebar reads from nav.js — show on all DOM Studio doc pages except pricing.
const showSidebar = computed(() => !props.fullWidth && (
	route.path.startsWith('/docs')
	&& route.path !== '/docs/pricing'
));


const topLinks = [
	{ to: '/docs', label: 'Overview', exact: true },
	{ to: '/docs/ai', label: 'AI' },
	{ to: '/docs/theming', label: 'Theming' },
	{ to: '/docs/components/button', label: 'Components', match: '/docs/components' },
	{ to: '/docs/visual/card', label: 'Visual', match: '/docs/visual' },
	{ to: '/docs/blocks/dashboard', label: 'Blocks', match: '/docs/blocks' },
	{ to: '/docs/pricing', label: 'Pricing' },
];

const mobileMenuOpen = ref(false);
const isMounted = ref(false);
const detailsPanel = ref(null);

function scrollDetailsToTop() {
	if (detailsPanel.value) detailsPanel.value.scrollTo({ top: 0 });
}

watch(() => route.fullPath, async () => {
	await nextTick();
	scrollDetailsToTop();
});

onMounted(() => {
	isMounted.value = true;
	initTheme();
});
</script>

<template>
	<div
		class="min-h-screen bg-background text-foreground"
		:class="showSidebar && 'md:fixed md:inset-0 md:overflow-hidden'"
	>
		<header class="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
			<div class="mx-auto flex h-16 w-full min-w-0 items-center justify-between gap-3 px-4 sm:px-6">
				<RouterLink to="/docs" class="flex min-w-0 items-center gap-2 text-foreground">
					<BrandLockup show-badge />
				</RouterLink>
				<!-- Mobile menu-->
				<DomButton class="shrink-0 md:hidden" variant="secondary" @click="mobileMenuOpen = true">Menu</DomButton>
				<Teleport v-if="isMounted" to="body">
					<DomDrawer v-model="mobileMenuOpen" side="left" title="Menu" width="min(88vw, var(--container-xs))">
						<div class="space-y-6 p-4 text-sm text-muted-foreground">
							<nav class="grid gap-1">
								<RouterLink
									v-for="l in topLinks"
									:key="l.to"
									:to="l.to"
									class="rounded-lg px-3 py-2 font-medium transition"
									:class="(l.exact ? route.path === l.to : route.path.startsWith(l.match || l.to))
										? 'bg-primary text-primary-foreground'
										: 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
									@click="mobileMenuOpen = false"
								>{{ l.label }}</RouterLink>
							</nav>
							<div class="border-t border-border pt-4">
								<AccountMenu />
							</div>
							<SideNav v-if="showSidebar" class="block w-full shrink-0" />
						</div>
					</DomDrawer>
				</Teleport>
				<nav class="hidden min-w-0 items-center gap-1 text-sm md:flex">
					<RouterLink
						v-for="l in topLinks"
						:key="l.to"
						:to="l.to"
						class="rounded-full px-3 py-1.5 font-medium transition"
						:class="(l.exact ? route.path === l.to : route.path.startsWith(l.match || l.to))
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground'"
					>{{ l.label }}</RouterLink>
					<div class="ml-2">
						<ThemeToggle />
					</div>
					<AccountMenu class="ml-2" />
				</nav>
			</div>
		</header>

		<div v-if="showSidebar" class="w-full px-4">
			<div class="flex min-h-0 gap-12 py-10 md:h-[calc(100vh-4rem)] md:overflow-hidden md:py-0">
				<SideNav persist-scroll class="docs-sidebar w-56 shrink-0 md:h-full md:overflow-y-auto md:py-10 md:pr-2" />

				<main ref="detailsPanel" class="min-h-0 min-w-0 flex-1 md:h-full md:overflow-y-auto md:py-10 md:pr-2">
					<div class="mx-auto w-full max-w-4xl">
						<slot />
					</div>
					<DomStudioFooter class="mt-16" />
				</main>
			</div>
		</div>

		<div v-else class="w-full px-4">
			<div class="flex gap-12 py-10" :class="fullWidth && 'py-6'">
				<main class="min-w-0 flex-1">
					<div class="mx-auto w-full max-w-4xl">
						<slot />
					</div>
				</main>
			</div>
		</div>

		<DomStudioFooter v-if="!showSidebar" />
	</div>
</template>
