<script setup>
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute();

const props = defineProps({
	items: { type: Array, default: () => [] },
	depth: { type: Number, default: 0 },
});

const emit = defineEmits(['navigate']);

function linkParts(to) {
	const [path, hash] = String(to || '').split('#');
	return {
		path,
		hash: hash ? `#${hash}` : '',
	};
}

function isItemActive(item) {
	const { path, hash } = linkParts(item.to);
	if (!path) return false;
	if (hash) return route.path === path && route.hash === hash;
	if (route.path !== path) return false;
	return !route.hash || Boolean(item.children?.length);
}

function hasActiveDescendant(item) {
	return item.children?.some((child) => isItemActive(child) || hasActiveDescendant(child));
}

function isBranchOpen(item) {
	return item.children?.length && (isItemActive(item) || hasActiveDescendant(item));
}

function linkClass(item) {
	return isItemActive(item)
		? 'bg-secondary text-secondary-fg'
		: 'text-muted-fg hover:bg-secondary hover:text-canvas-fg';
}

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
