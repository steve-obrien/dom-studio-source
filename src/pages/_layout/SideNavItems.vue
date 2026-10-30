<script setup>
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute();

const props = defineProps({
	items: { type: Array, default: () => [] },
	depth: { type: Number, default: 0 },
});

const emit = defineEmits(['navigate']);

/**
 * Splits a navigation destination into its route path and optional hash.
 *
 * @param {string} to Navigation destination.
 * @returns {{ path: string, hash: string }} Normalized route location parts.
 */
function linkParts(to) {
	const [path, hash] = String(to || '').split('#');
	return {
		path,
		hash: hash ? `#${hash}` : '',
	};
}

/**
 * Checks whether an item or its parent branch should use active styling.
 *
 * @param {object} item Sidebar navigation item.
 * @returns {boolean} Whether the item is active for the current route.
 */
function isItemActive(item) {
	const { path, hash } = linkParts(item.to);
	if (!path) return false;
	if (hash) return route.path === path && route.hash === hash;
	// Page links remain active at section anchors; URL hashes are absent in SSR.
	return route.path === path;
}

/**
 * Checks whether an item is the exact current route and hash destination.
 *
 * @param {object} item Sidebar navigation item.
 * @returns {boolean} Whether the item is the exact current destination.
 */
function isItemCurrent(item) {
	const { path, hash } = linkParts(item.to);
	if (!path || route.path !== path) return false;
	return !hash || route.hash === hash;
}

/**
 * Checks whether any nested navigation item matches the current route.
 *
 * @param {object} item Sidebar navigation item.
 * @returns {boolean} Whether the item contains an active descendant.
 */
function hasActiveDescendant(item) {
	return item.children?.some((child) => isItemActive(child) || hasActiveDescendant(child));
}

/**
 * Checks whether a nested navigation branch should be expanded.
 *
 * @param {object} item Sidebar navigation item.
 * @returns {boolean} Whether the branch should render its children.
 */
function isBranchOpen(item) {
	return item.children?.length && (isItemActive(item) || hasActiveDescendant(item));
}

/**
 * Returns route-aware color classes for a sidebar item.
 *
 * @param {object} item Sidebar navigation item.
 * @returns {string} Tailwind classes for the current active state.
 */
function linkClass(item) {
	return isItemActive(item)
		? 'bg-secondary text-secondary-fg'
		: 'text-muted-fg hover:bg-secondary hover:text-canvas-fg';
}

/**
 * Returns indentation-aware sizing classes for the current navigation depth.
 *
 * @returns {string} Tailwind sizing classes.
 */
function linkSizeClass() {
	return props.depth === 0
		? 'rounded-lg px-3 py-1.5'
		: 'rounded-md px-2 py-1';
}
</script>

<template>
	<div :class="props.depth === 0 ? 'space-y-0.5' : 'ml-5 mt-0.5 space-y-0.5 border-l border-border pl-2'">
		<div v-for="item in props.items" :key="item.to || item.label">
			<RouterLink
				:to="item.to"
				class="flex items-center justify-between gap-2 text-sm font-medium transition"
				:class="[linkClass(item), linkSizeClass()]"
				:aria-current="isItemCurrent(item) ? 'page' : undefined"
				:data-side-nav-current="isItemCurrent(item) ? 'true' : undefined"
				@mousedown.prevent="emit('navigate')"
				@click="emit('navigate')"
			>
				<span class="flex min-w-0 items-center gap-2">
					<svg
						v-if="item.icon && props.depth === 0"
						width="16"
						height="16"
						class="size-4 shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						aria-hidden="true"
					>
						<path :d="item.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					<span class="truncate">{{ item.label }}</span>
				</span>
				<span v-if="item.count" class="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-fg">
					{{ item.count }}
				</span>
				<span v-else-if="item.tag" class="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success dark:text-success">
					{{ item.tag }}
				</span>
			</RouterLink>

			<SideNavItems
				v-if="isBranchOpen(item)"
				:items="item.children"
				:depth="props.depth + 1"
				@navigate="emit('navigate')"
			/>
		</div>
	</div>
</template>
