<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import DomButton from '../../../components/button/DomButton.vue';
import DomToggleButtonGroup from '../../../forms/toggle-button-group/DomToggleButtonGroup.vue';
import DomStatusPill from '../../../visual/status-pill/DomStatusPill.vue';
import DomMediaBrowser from '../DomMediaBrowser.vue';
import ImageMediaDetail from './ImageMediaDetail.vue';
import PdfMediaDetail from './PdfMediaDetail.vue';
import { useMediaBrowserDemoStore } from './useMediaBrowserDemoStore.js';

const route = useRoute();
const router = useRouter();
const store = useMediaBrowserDemoStore();
const {
	items,
	breadcrumbs,
	currentPath,
	selectedKeys,
	selectedItems,
	mode,
	loading,
	uploadProgress,
	requestLog,
	lastRequest,
	lastResponse,
} = storeToRefs(store);
const imagePickerMode = ref(false);
const pickedValue = ref('');
const demoRoot = ref(null);

const routeFolderPath = computed(() => pathFromRouteParam(route.params.folderPath));
const selectableTypes = computed(() => (imagePickerMode.value ? ['file'] : ['dir', 'file']));
const accept = computed(() => (imagePickerMode.value ? 'image/*' : ''));
const detailComponents = {
	image: {
		component: ImageMediaDetail,
		mode: 'dialog',
		width: 'min(94vw, 76rem)',
	},
	pdf: {
		component: PdfMediaDetail,
		mode: 'inline',
	},
};
const loadingLabel = computed(() => {
	if (!loading.value) return `${items.value.length} visible rows`;
	return items.value.length ? `${items.value.length} rows, refreshing` : 'Loading folder';
});
const selectionLabel = computed(() => {
	if (!selectedItems.value.length) return 'Nothing selected';
	if (selectedItems.value.length === 1) return selectedItems.value[0].name;
	return `${selectedItems.value.length} items selected`;
});
const lastRequestPreview = computed(() => formatJson(lastRequest.value?.body || {}));
const lastResponsePreview = computed(() => formatJson(lastResponse.value || {}));

onMounted(loadInitialFolder);
watch(routeFolderPath, handleRouteFolderChange);

/**
 * Loads the folder represented by the initial route.
 */
function loadInitialFolder() {
	store.loadFolder(routeFolderPath.value);
}

/**
 * Reloads media rows when the route folder path changes.
 *
 * @param {string} path Folder path from the current route.
 */
function handleRouteFolderChange(path) {
	if (normalizePath(path) === normalizePath(currentPath.value)) return;
	store.loadFolder(path);
}

/**
 * Handles breadcrumb and folder navigation without snapping the docs page to the top.
 *
 * @param {{ path: string }} payload Navigation payload.
 * @returns {Promise<void>} Resolves after router navigation is requested.
 */
async function handleNavigate(payload) {
	const scrollState = currentScrollState();
	await router.push(routePathForFolder(payload.path));
	restoreScrollState(scrollState);
}

/**
 * Stores the current selection as a picker-style value.
 */
function useSelection() {
	pickedValue.value = selectedKeys.value.join(', ');
}

/**
 * Toggles the demo between a full library and image-only picker mode.
 */
function togglePickerMode() {
	imagePickerMode.value = !imagePickerMode.value;
	store.setSelectedKeys([]);
}

/**
 * Reads the active page scroll position when the demo runs in a browser.
 *
 * @returns {{ element: Element|null, top: number, left: number }} Current scroll state.
 */
function currentScrollState() {
	if (typeof window === 'undefined') return { element: null, top: 0, left: 0 };
	const element = scrollElementForDemo();
	if (element && element !== document.documentElement && element !== document.body) {
		return {
			element,
			top: element.scrollTop,
			left: element.scrollLeft,
		};
	}
	return {
		element: null,
		top: window.scrollY || document.documentElement.scrollTop || 0,
		left: window.scrollX || document.documentElement.scrollLeft || 0,
	};
}

/**
 * Restores page scroll after route navigation and any immediate route scroll behavior.
 *
 * @param {{ element: Element|null, top: number, left: number }} state Scroll state to restore.
 */
function restoreScrollState(state) {
	if (typeof window === 'undefined') return;
	const restore = () => {
		const element = state.element && document.contains(state.element)
			? state.element
			: scrollElementForDemo();
		if (element && element !== document.documentElement && element !== document.body) {
			element.scrollTo({ top: state.top, left: state.left, behavior: 'auto' });
			return;
		}
		window.scrollTo({ top: state.top, left: state.left, behavior: 'auto' });
	};
	window.requestAnimationFrame(() => {
		restore();
		window.requestAnimationFrame(restore);
	});
}

/**
 * Finds the nearest scroll container that owns the demo's page position.
 *
 * @returns {Element|null} Scrollable page element or null when unavailable.
 */
function scrollElementForDemo() {
	if (typeof window === 'undefined') return null;
	const root = demoRoot.value;
	if (!root) return document.scrollingElement || document.documentElement;
	let element = root.parentElement;
	while (element && element !== document.body) {
		const style = window.getComputedStyle(element);
		const overflow = `${style.overflowY} ${style.overflow}`;
		if (/(auto|scroll|overlay)/.test(overflow) && element.scrollHeight > element.clientHeight) return element;
		element = element.parentElement;
	}
	return document.scrollingElement || document.documentElement;
}

/**
 * Converts a Vue Router catch-all param into a media path.
 *
 * @param {string|Array<string>} value Route param value.
 * @returns {string} Media folder path.
 */
function pathFromRouteParam(value) {
	const parts = Array.isArray(value) ? value : [value].filter(Boolean);
	const path = parts.join('/');
	return path ? normalizePath(`/${path.split('/').map(decodeSegment).join('/')}`) : '/';
}

/**
 * Builds the docs route for a media folder path.
 *
 * @param {string} path Media folder path.
 * @returns {string} Browser route path.
 */
function routePathForFolder(path) {
	const normalized = normalizePath(path);
	if (normalized === '/') return '/data/media-browser';
	const encoded = normalized
		.split('/')
		.filter(Boolean)
		.map((segment) => encodeURIComponent(segment))
		.join('/');
	return `/data/media-browser/${encoded}`;
}

/**
 * Normalizes a media path for route comparisons.
 *
 * @param {string} path Media path.
 * @returns {string} Normalized path.
 */
function normalizePath(path) {
	const value = String(path || '/').replace(/\/+/g, '/').replace(/\/$/, '');
	return value.startsWith('/') ? value || '/' : `/${value}`;
}

/**
 * Decodes one route path segment.
 *
 * @param {string} segment Encoded route segment.
 * @returns {string} Decoded segment.
 */
function decodeSegment(segment) {
	try {
		return decodeURIComponent(segment);
	} catch {
		return segment;
	}
}

/**
 * Formats a value as JSON for the request preview panel.
 *
 * @param {unknown} value Value to display.
 * @returns {string} Pretty JSON.
 */
function formatJson(value) {
	return JSON.stringify(value || {}, null, 2);
}
</script>

<template>
	<div ref="demoRoot" class="w-[90rem] max-w-full space-y-4" data-testid="media-library-demo">
		<section class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_22rem]">
			<div class="rounded-lg border border-border bg-canvas p-4">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="text-xs font-semibold uppercase text-muted-fg">Pinia-driven media library</p>
						<h3 class="mt-1 text-xl font-semibold text-canvas-fg">{{ currentPath }}</h3>
						<p class="mt-1 text-sm text-muted-fg">Route-aware folder path: /data/media-browser{{ currentPath === '/' ? '' : currentPath }}</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<DomStatusPill
							:tone="loading ? 'info' : 'success'"
							:label="loadingLabel"
							:pulse="loading"
							size="sm"
						/>
						<DomButton size="sm" variant="secondary" @click="togglePickerMode">
							{{ imagePickerMode ? 'Library mode' : 'Image picker mode' }}
						</DomButton>
					</div>
				</div>

				<div class="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3 text-sm">
					<span class="font-medium text-canvas-fg">Detached selection control</span>
					<span class="text-muted-fg">{{ selectionLabel }}</span>
					<DomButton size="sm" variant="primary" :disabled="!selectedKeys.length" @click="useSelection">
						Use selection
					</DomButton>
					<span v-if="pickedValue" class="min-w-0 truncate font-mono text-xs text-muted-fg">value={{ pickedValue }}</span>
				</div>
			</div>

			<div class="rounded-lg border border-border bg-canvas p-4">
				<p class="text-xs font-semibold uppercase text-muted-fg">Recent REST calls</p>
				<ul class="mt-3 space-y-2" aria-live="polite">
					<li
						v-for="entry in requestLog.slice(0, 4)"
						:key="entry.id"
						class="rounded-lg bg-secondary/35 px-3 py-2 text-xs"
					>
						<div class="flex items-center justify-between gap-3">
							<span class="font-mono font-semibold text-canvas-fg">{{ entry.method }} {{ entry.url }}</span>
							<span class="rounded-full px-2 py-0.5 font-medium" :class="entry.status === 'success' ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary'">{{ entry.status }}</span>
						</div>
					</li>
				</ul>
			</div>
		</section>

		<DomMediaBrowser
			:items="items"
			:breadcrumbs="breadcrumbs"
			:current-path="currentPath"
			:selected-keys="selectedKeys"
			:mode="mode"
			:loading="loading"
			:upload-progress="uploadProgress || null"
			:selectable-types="selectableTypes"
			:accept="accept"
			:detail-components="detailComponents"
			title="Brand media"
			@update:selected-keys="store.setSelectedKeys"
			@update:mode="store.setMode"
			@navigate="handleNavigate"
			@create-folder="store.createFolder"
			@rename="store.renameItem"
			@move="store.moveItems"
			@upload="store.uploadFiles"
			@metadata-update="store.updateMetadata"
			@make-folder-with-items="store.makeFolderWithItems"
		>
			<template #toolbar="{ selectedItems: toolbarSelection, mode: toolbarMode, setMode, viewModeOptions }">
				<DomButton size="sm" variant="secondary" @click="store.createFolder()">
					New folder
				</DomButton>
				<DomButton size="sm" variant="secondary" :disabled="!toolbarSelection.length" @click="store.makeFolderWithItems({ items: toolbarSelection })">
					Folder from selection
				</DomButton>
				<DomButton size="sm" variant="primary" :disabled="!selectedKeys.length" @click="useSelection">
					Select
				</DomButton>
				<DomToggleButtonGroup
					:model-value="toolbarMode"
					:options="viewModeOptions"
					label="Media layout"
					chrome="none"
					size="icon-sm"
					variant="switch"
					@update:model-value="setMode"
				>
					<template #option="{ option }">
						<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
							<path :d="option.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
						<span class="sr-only">{{ option.label }}</span>
					</template>
				</DomToggleButtonGroup>
			</template>
		</DomMediaBrowser>

		<section class="grid gap-4 lg:grid-cols-2">
			<div class="min-w-0 rounded-lg border border-border bg-canvas p-4">
				<p class="text-sm font-semibold text-canvas-fg">Last request body</p>
				<pre class="mt-3 max-h-80 overflow-auto rounded-lg bg-secondary/45 p-3 text-xs text-canvas-fg">{{ lastRequestPreview }}</pre>
			</div>
			<div class="min-w-0 rounded-lg border border-border bg-canvas p-4">
				<p class="text-sm font-semibold text-canvas-fg">Last response</p>
				<pre class="mt-3 max-h-80 overflow-auto rounded-lg bg-secondary/45 p-3 text-xs text-canvas-fg">{{ lastResponsePreview }}</pre>
			</div>
		</section>
	</div>
</template>
