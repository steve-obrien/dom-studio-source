<script setup>
import { computed, ref, useId, useSlots, watch } from 'vue';
import DomPopover from '../popover/DomPopover.vue';
import DomSplitterPanel from '../splitter-panel/DomSplitterPanel.vue';

defineOptions({
	__doc: {
		name: 'Desktop layout',
		tag: '<DomDesktopLayout>',
		description: 'A minimal desktop workspace with a controlled pinned app rail, hover shortcuts, an optional sidebar, and an independent stage.',
		slots: [
			{ name: 'titlebar', description: 'Optional native host title bar. The host owns window controls and drag regions.' },
			{ name: 'sidebar', payload: '{ app, close }', description: 'App-specific navigation; placed left or right and shown as an overlay on mobile.' },
			{ name: '(default)', payload: '{ app }', description: 'The active app workspace. The application owns state retention and routing.' },
			{ name: 'rail-footer', description: 'Account or settings actions at the bottom of the rail.' },
		],
		events: [
			{ name: 'update:modelValue', payload: 'string', description: 'Selected app ID.' },
			{ name: 'shortcut', payload: '{ appId, item }', description: 'An app submenu entry was selected.' },
			{ name: 'update:sidebarSize', payload: 'number', description: 'Sidebar width in pixels after pointer or keyboard resizing.' },
			{ name: 'manage-apps', description: 'Open application-owned installation and pinning controls.' },
		],
	},
});
const props = defineProps({
	modelValue: { type: String, default: '' },
	apps: { type: Array, default: () => [], _edit: { description: 'Ordered pinned apps: unique id, label, SVG path icon, optional items with id and label.' } },
	height: { type: String, default: '100dvh', _edit: { description: 'Use 100% only inside a parent with an explicit height.' } },
	sidebarPosition: { type: String, default: 'left', _edit: { options: ['left', 'right'], description: 'Which side of the workspace contains app navigation.' } },
	sidebarWidth: { type: String, default: '16rem', _edit: { description: 'Compact overlay width as a CSS length.' } },
	sidebarSize: { type: Number, default: 256, _edit: { description: 'Desktop sidebar width in pixels. Bind v-model:sidebarSize to save user resizing.' } },
	minSidebarSize: { type: Number, default: 180 },
	minWorkspaceSize: { type: Number, default: 280 },
	showSidebar: { type: Boolean, default: true },
});
const emit = defineEmits(['update:modelValue', 'shortcut', 'manage-apps', 'update:sidebarSize']);
const slots = useSlots();
const sidebarId = useId();
const mobileSidebar = ref(false);
const sidebarPx = ref(props.sidebarSize);
const activeApp = computed(() => props.apps.find(app => app.id === props.modelValue) || null);
const hasSidebar = computed(() => props.showSidebar && !!slots.sidebar);
watch(() => props.sidebarSize, syncSidebarSize);

/**
 * Apply a host-controlled sidebar width without changing app selection.
 * @param {number} size Requested width in CSS pixels.
 * @returns {void}
 */
function syncSidebarSize(size) {
	sidebarPx.value = size;
}

/**
 * Retain the user's width when focus mode temporarily hides navigation.
 * @param {number} size Clamped splitter width in CSS pixels.
 * @returns {void}
 */
function resizeSidebar(size) {
	if (!hasSidebar.value) return;
	sidebarPx.value = size;
	emit('update:sidebarSize', size);
}

/**
 * Select an application without mutating host-owned records.
 * @param {string} id Application identifier.
 * @returns {void}
 */
function selectApp(id) {
	mobileSidebar.value = false;
	emit('update:modelValue', id);
}
/**
 * Select a shortcut and delegate routing to the host.
 * @param {{ id: string }} app Pinned application record.
 * @param {{ id: string, label: string }} item Shortcut record.
 * @param {() => void} close Popover dismissal helper.
 * @returns {void}
 */
function selectShortcut(app, item, close) {
	selectApp(app.id);
	emit('shortcut', { appId: app.id, item });
	close();
}
/**
 * Dismiss compact navigation after selection or an Escape key press.
 * @returns {void}
 */
function closeSidebar() {
	mobileSidebar.value = false;
}
</script>

<template>
	<div class="flex min-h-0 min-w-0 flex-col overflow-hidden bg-canvas text-canvas-fg" :style="{ height }">
		<div v-if="$slots.titlebar" class="shrink-0"><slot name="titlebar" /></div>
		<div class="relative flex min-h-0 flex-1">
			<nav aria-label="Pinned apps" class="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-desktop-divider bg-desktop-rail px-2 py-3">
				<DomPopover v-for="app in apps" :key="app.id" trigger="hover" position="end-top" :arrow="false" width="w-56" padding="p-2">
					<template #trigger>
						<button type="button" :aria-label="app.label" :aria-current="modelValue === app.id ? 'page' : undefined" class="grid size-10 place-items-center rounded-xl text-muted-fg transition hover:bg-desktop-selection focus-visible:outline-2 focus-visible:outline-ring" :class="modelValue === app.id ? 'bg-desktop-selection text-canvas-fg' : ''" @click="selectApp(app.id)">
							<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="size-5"><path :d="app.icon || 'M5 5h14v14H5z'" /></svg>
						</button>
					</template>
					<template #default="{ close }">
						<p class="px-2 py-2 text-xs font-semibold text-muted-fg">{{ app.label }}</p>
						<button type="button" class="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-desktop-selection focus-visible:outline-2 focus-visible:outline-ring" @click="selectApp(app.id); close()">Open {{ app.label }}</button>
						<button v-for="item in app.items" :key="item.id" type="button" class="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-desktop-selection focus-visible:outline-2 focus-visible:outline-ring" @click="selectShortcut(app, item, close)">{{ item.label }}</button>
					</template>
				</DomPopover>
				<button type="button" aria-label="Manage apps" class="grid size-10 place-items-center rounded-xl text-xl text-muted-fg hover:bg-desktop-selection focus-visible:outline-2 focus-visible:outline-ring" @click="emit('manage-apps')">+</button>
				<div class="mt-auto"><slot name="rail-footer" /></div>
			</nav>
			<div class="relative flex min-w-0 flex-1 flex-col">
				<div v-if="hasSidebar" class="flex h-11 shrink-0 items-center border-b border-border px-3 md:hidden">
					<button type="button" :aria-controls="sidebarId" :aria-expanded="mobileSidebar" class="rounded px-2 py-1 text-sm hover:bg-desktop-selection focus-visible:outline-2 focus-visible:outline-ring" @click="mobileSidebar = !mobileSidebar">{{ mobileSidebar ? 'Close navigation' : 'Open navigation' }}</button>
				</div>
				<DomSplitterPanel
					class="relative !flex min-h-0 !min-w-0 flex-1 [&>section]:contents md:!grid md:[&>section]:block"
					:reverse="sidebarPosition === 'right'"
					:start-size="hasSidebar ? sidebarPx : 0"
					:min-start="hasSidebar ? minSidebarSize : 0"
					:min-main="minWorkspaceSize"
					:handle-size="hasSidebar ? 6 : 0"
					:handle-class="hasSidebar ? '!hidden md:!flex bg-transparent hover:bg-desktop-selection focus-visible:bg-desktop-selection data-[dragging=true]:bg-desktop-selection transition' : '!hidden'"
					@update:start-size="resizeSidebar"
					@keydown.esc="closeSidebar"
				>
					<template #start>
						<aside v-if="hasSidebar" :id="sidebarId" aria-label="App navigation" class="absolute inset-y-0 z-20 overflow-y-auto border-desktop-divider bg-desktop-sidebar md:static md:block md:h-full md:w-full" :class="[mobileSidebar ? 'block' : 'hidden', sidebarPosition === 'right' ? 'right-0 border-l md:border-l-0' : 'left-0 border-r md:border-r-0']" :style="{ '--compact-sidebar-width': `min(${sidebarWidth}, calc(100% - 2rem))` }">
							<slot name="sidebar" :app="activeApp" :close="closeSidebar" />
						</aside>
					</template>
					<template #start-handle><span class="h-full w-px bg-desktop-divider" /></template>
					<button v-if="mobileSidebar && hasSidebar" type="button" aria-label="Dismiss navigation" class="absolute inset-0 z-10 bg-canvas-fg/15 md:hidden" @click="closeSidebar" />
					<main class="h-full min-h-0 min-w-0 flex-1 overflow-auto"><slot :app="activeApp" /></main>
				</DomSplitterPanel>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* The overlay width belongs to compact navigation; the splitter owns desktop tracks. */
@media (width < 48rem) {
	aside {
		width: var(--compact-sidebar-width);
	}
}
</style>
