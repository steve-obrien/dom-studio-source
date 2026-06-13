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

function saveScroll() {
	if (!props.persistScroll || !root.value) return;
	setSavedScroll(lockedScroll.value ?? root.value.scrollTop);
}

function rememberScroll() {
	if (!props.persistScroll || !root.value) return;
	lockedScroll.value = root.value.scrollTop;
	saveScroll();
}

function nextFrame() {
	if (typeof requestAnimationFrame === 'undefined') return Promise.resolve();
	return new Promise((resolve) => requestAnimationFrame(resolve));
}

async function restoreScroll() {
	if (!props.persistScroll) return;
	await nextTick();
	await nextFrame();
	await nextFrame();
	const saved = Number(lockedScroll.value ?? getSavedScroll());
	if (!Number.isFinite(saved)) return;
	const apply = () => {
		if (root.value) root.value.scrollTop = saved;
	};
	apply();
	setTimeout(apply, 60);
	setTimeout(() => {
		apply();
		lockedScroll.value = null;
		saveScroll();
	}, 180);
}

function storage() {
	if (typeof window === 'undefined') return null;
	try {
		return window.sessionStorage || null;
	} catch {
		return null;
	}
}

function getSavedScroll() {
	const store = storage();
	return store?.getItem(props.scrollKey) ?? savedScroll;
}

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
		<div v-for="(group, gi) in sideNavLinks" :key="group.label" :class="gi > 0 && 'mt-5'">
			<p class="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg">{{ group.label }}</p>
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
