<script setup>
import { sideNavLinks } from './sideNavLinks';
import { useRoute } from 'vue-router';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import SideNavItems from './SideNavItems.vue';

const route = useRoute();
const props = defineProps({
	persistScroll: { type: Boolean, default: false },
	scrollKey: { type: String, default: 'dom-studio-side-nav-scroll' },
});

const root = ref(null);
const lockedScroll = ref(null);
let savedScroll = 0;
const DESKTOP_TOP_INSET = 80;
const EDGE_INSET = 12;

/**
 * Persists the current sidebar scroll position when scroll persistence is enabled.
 *
 * @returns {void}
 */
function saveScroll() {
	if (!props.persistScroll || !root.value) return;
	setSavedScroll(lockedScroll.value ?? root.value.scrollTop);
}

/**
 * Locks the current scroll position while a sidebar-driven route change renders.
 *
 * @returns {void}
 */
function rememberScroll() {
	if (!props.persistScroll || !root.value) return;
	lockedScroll.value = root.value.scrollTop;
	saveScroll();
}

/**
 * Waits for one browser animation frame when the DOM API is available.
 *
 * @returns {Promise<void>} Resolves after the next animation frame.
 */
function nextFrame() {
	if (typeof requestAnimationFrame === 'undefined') return Promise.resolve();
	return new Promise((resolve) => requestAnimationFrame(resolve));
}

/**
 * Restores persisted scroll before revealing the active route in the sidebar.
 *
 * @returns {Promise<void>} Resolves after the sidebar has synchronized with the route.
 */
async function restoreScroll() {
	await nextTick();
	await nextFrame();
	await nextFrame();
	if (!props.persistScroll) {
		revealActiveLink();
		return;
	}
	const saved = Number(lockedScroll.value ?? getSavedScroll());
	if (!Number.isFinite(saved)) {
		revealActiveLink();
		return;
	}
	const synchronize = () => {
		if (!root.value) return;
		root.value.scrollTop = saved;
		revealActiveLink();
	};
	synchronize();
	setTimeout(synchronize, 60);
	setTimeout(() => {
		synchronize();
		lockedScroll.value = null;
		saveScroll();
	}, 180);
}

/**
 * Moves the sidebar just enough to show the active link and its section heading.
 *
 * @returns {void}
 */
function revealActiveLink() {
	const sidebar = root.value;
	const activeLink = sidebar?.querySelector?.('[data-side-nav-current="true"]');
	if (!sidebar || !activeLink) return;

	const scrollContainer = findScrollContainer(sidebar);
	const sidebarRect = scrollContainer.getBoundingClientRect();
	const activeRect = activeLink.getBoundingClientRect();
	const sectionLabel = activeLink.closest('[data-side-nav-group]')?.querySelector('[data-side-nav-group-label]');
	const sectionRect = sectionLabel?.getBoundingClientRect();
	const topInset = scrollContainer === sidebar ? DESKTOP_TOP_INSET : EDGE_INSET;
	const visibleTop = sidebarRect.top + topInset;
	const visibleBottom = sidebarRect.bottom - EDGE_INSET;
	const activeIsVisible = activeRect.top >= visibleTop && activeRect.bottom <= visibleBottom;
	const sectionIsVisible = !sectionRect || (sectionRect.top >= visibleTop && sectionRect.bottom <= visibleBottom);
	if (activeIsVisible && sectionIsVisible) return;

	const availableHeight = visibleBottom - visibleTop;
	const sectionFitsWithActive = sectionRect && activeRect.bottom - sectionRect.top <= availableHeight;
	const targetRect = sectionFitsWithActive ? sectionRect : activeRect;
	scrollContainer.scrollTop += targetRect.top - visibleTop;
}

/**
 * Finds the nearest element that owns vertical scrolling for the sidebar.
 *
 * @param {HTMLElement} sidebar Sidebar root element.
 * @returns {HTMLElement} Scrollable sidebar or mobile-menu container.
 */
function findScrollContainer(sidebar) {
	if (typeof window === 'undefined') return sidebar;
	let candidate = sidebar;
	while (candidate) {
		const overflowY = window.getComputedStyle(candidate).overflowY;
		if (/(auto|scroll)/.test(overflowY) && candidate.scrollHeight > candidate.clientHeight) return candidate;
		candidate = candidate.parentElement;
	}
	return sidebar;
}

/**
 * Returns session storage when browser privacy settings permit access.
 *
 * @returns {Storage|null} Session storage, or null when unavailable.
 */
function storage() {
	if (typeof window === 'undefined') return null;
	try {
		return window.sessionStorage || null;
	} catch {
		return null;
	}
}

/**
 * Reads the persisted sidebar scroll position.
 *
 * @returns {string|number} Persisted storage value or the in-memory fallback.
 */
function getSavedScroll() {
	const store = storage();
	return store?.getItem(props.scrollKey) ?? savedScroll;
}

/**
 * Stores the latest sidebar scroll position with an in-memory fallback.
 *
 * @param {number} value Sidebar scroll offset in pixels.
 * @returns {void}
 */
function setSavedScroll(value) {
	savedScroll = value;
	try {
		storage()?.setItem(props.scrollKey, String(value));
	} catch {
		// Ignore storage failures and keep the in-memory fallback.
	}
}

onMounted(restoreScroll);
watch(() => route.fullPath, restoreScroll);

onBeforeUnmount(saveScroll);
</script>

<template>
	<aside ref="root" @scroll.passive="saveScroll">
		<div v-for="(group, gi) in sideNavLinks" :key="group.label" data-side-nav-group :class="gi > 0 && 'mt-5'">
			<div data-side-nav-group-label class="flex items-center gap-2 px-3">
				<p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg">{{ group.label }}</p>
				<span
					v-if="group.badge"
					class="rounded-full bg-warning/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-warning"
				>
					{{ group.badge }}
				</span>
			</div>
			<nav class="mt-2">
				<SideNavItems :items="group.items" @navigate="rememberScroll" />
			</nav>
		</div>
		<div class="mt-8 rounded-2xl border border-border bg-gradient-to-br from-secondary to-transparent p-4">
			<p class="text-xs font-semibold uppercase tracking-wider text-muted-fg">Pro</p>
			<p class="mt-1 text-sm font-medium text-canvas-fg">Get every blueprint, template &amp; pre-built app.</p>
			<RouterLink to="/pricing" class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-canvas-fg hover:underline">
				View pricing →
			</RouterLink>
		</div>
	</aside>
</template>
