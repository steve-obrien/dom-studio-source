<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { DomDrawer, DomIconButton, vDomTooltip } from '@getdom/studio/vue';
import { builtInIconSelectorItems } from '../../../../forms/icon-selector/iconSelectorItems.js';

const props = defineProps({
	collapsed: {
		type: Boolean,
		default: false,
	},
	expandedWidth: {
		type: [Number, String],
		default: 248,
	},
	collapsedWidth: {
		type: [Number, String],
		default: 64,
	},
});

const emit = defineEmits(['update:collapsed']);

const COLLAPSE_ICON = iconPath('Chevron left');
const EXPAND_ICON = iconPath('Chevron right');
const MENU_ICON = iconPath('Menu');

const mobileNavigationOpen = ref(false);
const desktopMediaQuery = ref(null);
const sidebarWidth = computed(() => toCssLength(props.collapsed ? props.collapsedWidth : props.expandedWidth));

/**
 * Resolve an icon from DOM Studio's built-in icon inventory.
 *
 * @param {string} label Built-in icon label.
 * @returns {string} SVG path data accepted by DomIconButton.
 */
function iconPath(label) {
	return builtInIconSelectorItems.find((item) => item.label === label)?.path || '';
}

/**
 * Convert numeric layout widths into CSS pixel lengths while preserving
 * caller-supplied CSS values such as rems and custom properties.
 *
 * @param {number|string} value Width supplied through the shell props.
 * @returns {string} CSS-compatible length.
 */
function toCssLength(value) {
	return typeof value === 'number' ? `${value}px` : value;
}

/**
 * Toggle the persistent desktop sidebar without changing the mobile drawer.
 *
 * @param {MouseEvent} [event] Triggering pointer event.
 * @returns {void}
 */
function toggleCollapsed(event) {
	emit('update:collapsed', !props.collapsed);
	event?.currentTarget?.blur();
}

/**
 * Open the temporary navigation drawer used below the desktop breakpoint.
 *
 * @returns {void}
 */
function openMobileNavigation() {
	mobileNavigationOpen.value = true;
}

/**
 * Close the temporary mobile navigation drawer.
 *
 * @returns {void}
 */
function closeMobileNavigation() {
	mobileNavigationOpen.value = false;
}

/**
 * Close mobile navigation after a real destination link is activated.
 *
 * @param {MouseEvent} event Bubbling click from the slotted navigation.
 * @returns {void}
 */
function handleMobileNavigationClick(event) {
	if (event.target instanceof Element && event.target.closest('a[href]')) {
		closeMobileNavigation();
	}
}

/**
 * Remove an open mobile overlay when the viewport reaches desktop width.
 *
 * @param {MediaQueryListEvent|MediaQueryList} event Desktop media-query state.
 * @returns {void}
 */
function handleDesktopMediaChange(event) {
	if (event.matches) closeMobileNavigation();
}

/**
 * Register the responsive breakpoint listener after client hydration.
 *
 * @returns {void}
 */
function mountDesktopMediaQuery() {
	desktopMediaQuery.value = window.matchMedia('(min-width: 768px)');
	desktopMediaQuery.value.addEventListener('change', handleDesktopMediaChange);
	handleDesktopMediaChange(desktopMediaQuery.value);
}

/**
 * Remove the responsive breakpoint listener before unmounting the shell.
 *
 * @returns {void}
 */
function unmountDesktopMediaQuery() {
	desktopMediaQuery.value?.removeEventListener('change', handleDesktopMediaChange);
}

onMounted(mountDesktopMediaQuery);
onBeforeUnmount(unmountDesktopMediaQuery);
</script>

<template>
	<div class="h-dvh min-h-[32rem] overflow-hidden bg-canvas text-canvas-fg">
		<div
			class="grid h-full min-w-0 grid-rows-[minmax(0,1fr)] md:grid-cols-[var(--app-sidebar-width)_minmax(0,1fr)] md:transition-[grid-template-columns] md:duration-300 md:ease-out"
			:style="{ '--app-sidebar-width': sidebarWidth }"
		>
			<aside class="group/sidebar hidden min-h-0 min-w-0 flex-col border-r border-border bg-secondary md:flex">
				<div class="relative flex h-16 shrink-0 items-center border-b border-border px-3" :class="collapsed ? 'justify-center' : 'gap-3'">
					<slot name="brand" :collapsed="collapsed" :mobile="false" />
					<DomIconButton
						v-dom-tooltip.right="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
						size="sm"
						variant="ghost"
						:label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
						:icon="collapsed ? EXPAND_ICON : COLLAPSE_ICON"
						:class="collapsed
							? 'absolute inset-0 m-auto bg-secondary opacity-0 shadow-sm transition-opacity group-hover/sidebar:opacity-100 focus:opacity-100'
							: 'ml-auto'"
						@click="toggleCollapsed"
					/>
				</div>

				<div class="min-h-0 flex-1">
					<slot name="sidebar" :collapsed="collapsed" :mobile="false" />
				</div>
			</aside>

			<section class="flex h-full min-w-0 flex-col bg-canvas">
				<header class="flex h-16 shrink-0 items-center gap-3 border-b border-border px-3 md:hidden">
					<DomIconButton
						:icon="MENU_ICON"
						label="Open navigation menu"
						size="sm"
						variant="ghost"
						:aria-expanded="mobileNavigationOpen ? 'true' : 'false'"
						@click="openMobileNavigation"
					/>
					<div class="min-w-0 flex-1">
						<slot name="brand" :collapsed="false" :mobile="true" />
					</div>
					<slot name="mobile-actions" />
				</header>

				<main class="min-h-0 flex-1 overflow-y-auto">
					<slot name="content" />
				</main>
			</section>
		</div>

		<DomDrawer
			v-model="mobileNavigationOpen"
			class="md:hidden"
			side="left"
			title="Workspace navigation"
			width="min(88vw, 20rem)"
		>
			<div class="flex h-full min-h-0 flex-col" @click="handleMobileNavigationClick">
				<div class="flex min-h-16 shrink-0 items-center border-b border-border px-4">
					<slot name="brand" :collapsed="false" :mobile="true" />
				</div>
				<div class="min-h-0 flex-1">
					<slot name="sidebar" :collapsed="false" :mobile="true" />
				</div>
			</div>
		</DomDrawer>
	</div>
</template>
