<script setup>
import { computed, defineComponent, Fragment, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowReactive, useSlots, watch } from 'vue';
import DomAppListItem from '../list-item/DomAppListItem.vue';

const StackScreenRenderer = defineComponent({
	name: 'DomAppStackScreenRenderer',
	props: {
		screen: { type: Object, default: null },
		component: { type: [Object, Function, String], default: null },
		helpers: { type: Object, required: true },
		childScreens: { type: Array, default: () => [] },
		loading: { type: Boolean, default: false },
		error: { type: null, default: null },
		loadingLabel: { type: String, default: 'Loading settings' },
		emptyTitle: { type: String, default: 'Select a setting' },
		emptyDescription: { type: String, default: 'Choose an item to continue.' },
	},
	/** Returns the renderer for a resolved, loading, or empty screen. */
	setup(props) {
		return () => {
			if (props.loading) return renderLoading(props.screen, props.loadingLabel);
			if (props.error) return renderError(props.error, props.helpers.retry);
			if (!props.screen) return renderEmpty(props.emptyTitle, props.emptyDescription);
			if (props.screen.slot) return props.screen.slot({ ...props.helpers, screen: props.screen });
			if (props.component) {
				return h(props.component, {
					...(props.screen.props || {}),
					...props.helpers,
					stack: props.helpers,
					screen: props.screen,
				});
			}
			if (props.childScreens.length) return renderGeneratedMenu(props.screen, props.childScreens, props.helpers);
			return renderEmpty(props.screen.title || props.emptyTitle, props.screen.description || props.emptyDescription);
		};
	},
});

/**
 * Builds accessible navigation rows for the current screen children.
 */
function renderGeneratedMenu(screen, childScreens, helpers) {
	return h('div', { class: 'overflow-hidden rounded-[1.5rem] border border-border bg-canvas' }, childScreens.map((child) => {
		const slots = child.icon ? {
			icon: () => h('span', {
				class: 'grid size-5 place-items-center',
				innerHTML: child.icon,
			}),
		} : undefined;

		return h(DomAppListItem, {
			key: child.id,
			label: child.title || child.label || child.id,
			description: child.description || '',
			meta: child.meta || '',
			chevron: true,
			disabled: child.disabled || undefined,
			class: child.disabled ? 'opacity-50' : '',
			onClick: () => {
				if (!child.disabled) helpers.openChild(screen.id, child.id);
			},
		}, slots);
	}));
}

/**
 * Renders the loading state while a screen module resolves.
 */
function renderLoading(screen, fallbackLabel) {
	return h('div', { class: 'grid min-h-64 place-items-center p-6 text-center' }, [
		h('div', { class: 'space-y-3' }, [
			h('span', {
				class: 'mx-auto block size-6 animate-spin rounded-full border-2 border-border border-t-primary',
				'aria-hidden': 'true',
			}),
			h('p', { class: 'text-sm font-medium text-canvas-fg' }, screen?.loadingTitle || fallbackLabel),
		]),
	]);
}

/**
 * Renders a recoverable screen-loading failure.
 */
function renderError(error, retry) {
	return h('div', { class: 'grid min-h-64 place-items-center p-6 text-center' }, [
		h('div', { class: 'max-w-sm space-y-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-5' }, [
			h('p', { class: 'text-sm font-semibold text-destructive' }, 'Unable to load this setting'),
			h('p', { class: 'text-xs leading-5 text-muted-fg' }, error?.message || 'The screen loader rejected.'),
			h('button', { type: 'button', class: 'min-h-11 rounded-lg px-4 font-medium text-canvas-fg focus-visible:outline-2 focus-visible:outline-ring', onClick: retry }, 'Try again'),
		]),
	]);
}

/**
 * Renders the fallback when a screen has no content.
 */
function renderEmpty(title, description) {
	return h('div', { class: 'grid min-h-64 place-items-center p-6 text-center' }, [
		h('div', { class: 'max-w-sm' }, [
			h('p', { class: 'text-sm font-semibold text-canvas-fg' }, title),
			description ? h('p', { class: 'mt-1 text-xs leading-5 text-muted-fg' }, description) : null,
		]),
	]);
}

defineOptions({
	__doc: {
		name: 'App stack',
		tag: '<DomAppStack>',
		description: 'A bounded screen stack with an iOS-style back button and sliding title on mobile, desktop breadcrumbs, and lazy screens. Fills the viewport by default. Inside DomAppShell, set height="100%" and disable the shell content-scroll so each screen owns scrolling.',
		slots: [
			{ name: '(default)', description: 'Optional DomAppStackScreen children used to register slot-driven screens.' },
			{ name: 'header', payload: '{ activeScreen, canGoBack, back, path }', description: 'Replace the mobile header; the header transitions with its screen.' },
			{ name: 'breadcrumb', payload: '{ crumbs, canGoBack, back, goTo, push, path }', description: 'Replace the desktop breadcrumb and back control while keeping the stack state.' },
		],
		events: [
			{ name: 'update:path', payload: '(path: Array<string>)', description: 'Fired when the active stack path changes.' },
			{ name: 'navigate', payload: '(payload: { path, previousPath, direction, screen, reason })', description: 'Fired after push, back, replace, reset, or breadcrumb navigation.' },
			{ name: 'load', payload: '(payload: { screen, component })', description: 'Fired when a lazy screen component resolves.' },
			{ name: 'error', payload: '(payload: { screen, error })', description: 'Fired when a lazy screen component rejects.' },
		],
		playground: {
			mobileSlot: 'stack',
			initial: {
				height: '100%',
				root: 'settings',
				screens: [
					{ id: 'settings', title: 'Settings', children: ['account', 'notifications'], description: '' },
					{ id: 'account', title: 'Account', description: 'Profile and preferences.', children: ['general', 'apps'] },
					{ id: 'general', title: 'General', children: ['language'], description: '' },
					{ id: 'language', title: 'Language & Region', description: 'English (UK), United Kingdom.' },
					{ id: 'apps', title: 'Apps', children: ['calendar'], description: '' },
					{ id: 'calendar', title: 'Calendar', children: ['calendar-notifications'], description: '' },
					{ id: 'calendar-notifications', title: 'Notifications', description: 'Event reminders, invitations, and shared calendars.' },
					{ id: 'notifications', title: 'Notifications', description: 'Push, email, and quiet hours.' },
				],
			},
		},
	},
});

const props = defineProps({
	height: {
		type: String,
		default: '100dvh',
		_edit: { description: 'Bounded stack height. Use 100% inside DomAppShell with content-scroll disabled, or a CSS length for an embedded stack.' },
	},
	showHeader: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the mobile back button and current screen title.' },
	},
	path: {
		type: Array,
		default: null,
		_edit: {
			component: 'DomJsonListInput',
			description: 'Controlled stack path. Use v-model:path for two-way navigation.',
		},
	},
	root: {
		type: String,
		default: '',
		_edit: { description: 'Root screen id. Defaults to the first registered screen.' },
	},
	screens: {
		type: Array,
		default: () => [],
		_edit: {
			component: 'DomJsonListInput',
			description: 'Screen records: { id, title, description, children, component, props }.',
		},
	},
	layout: {
		type: String,
		default: 'auto',
		validator: (value) => ['auto', 'mobile', 'desktop'].includes(value),
		_edit: {
			options: ['auto', 'mobile', 'desktop'],
			description: 'Resolve mobile or desktop styling automatically while keeping one full-width sliding stack.',
		},
	},
	desktopBreakpoint: {
		type: String,
		default: '768px',
		_edit: { description: 'Breakpoint used when layout is auto. Accepts a CSS length or media query.' },
	},
	showBreadcrumbs: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show desktop breadcrumbs. Mobile uses the current title and back button; showHeader controls that header.' },
	},
	animate: {
		type: Boolean,
		default: true,
		_edit: { description: 'Animate push and back transitions.' },
	},
	focusOnNavigate: {
		type: Boolean,
		default: true,
		_edit: { description: 'Move focus to the active panel after navigation.' },
	},
	loadingLabel: {
		type: String,
		default: 'Loading settings',
		_edit: { description: 'Fallback label shown while lazy screens load.' },
	},
	emptyTitle: {
		type: String,
		default: 'Select a setting',
		_edit: { description: 'Fallback title when no screen is active.' },
	},
	emptyDescription: {
		type: String,
		default: 'Choose an item to continue.',
		_edit: { description: 'Fallback description when no screen is active.' },
	},
	breadcrumbClass: {
		type: String,
		default: '',
		_edit: { group: 'Styling', description: 'Classes merged onto the default breadcrumb bar.' },
	},
	breadcrumbItemClass: {
		type: String,
		default: '',
		_edit: { group: 'Styling', description: 'Classes merged onto clickable breadcrumb items.' },
	},
	breadcrumbCurrentClass: {
		type: String,
		default: '',
		_edit: { group: 'Styling', description: 'Classes merged onto the current breadcrumb item.' },
	},
	backButtonClass: {
		type: String,
		default: '',
		_edit: { group: 'Styling', description: 'Classes merged onto the default back button.' },
	},
	mobilePanelClass: {
		type: String,
		default: '',
		_edit: { group: 'Styling', description: 'Classes merged onto the sliding panel when layout resolves to mobile.' },
	},
	desktopContentClass: {
		type: String,
		default: '',
		_edit: { group: 'Styling', description: 'Classes merged onto the sliding panel when layout resolves to desktop.' },
	},
});

const emit = defineEmits(['update:path', 'navigate', 'load', 'error']);

const slots = useSlots();
const loadedComponents = shallowReactive(new Map());
const loadErrors = shallowReactive(new Map());
const loadingScreens = reactive(new Set());
const internalPath = ref([]);
const direction = ref('forward');
const isDesktopMedia = ref(false);
const screenPanel = ref(null);
const visitedPaths = reactive(new Map());
const hasMounted = ref(false);

let removeDesktopMediaListener = null;

const propScreens = computed(() => props.screens.map(normalizeScreen).filter(Boolean));
const slottedScreens = computed(() => extractSlotScreens(slots.default?.() || []));
const allScreens = computed(() => {
	const records = [...propScreens.value];

	for (const screen of slottedScreens.value) {
		const index = records.findIndex((record) => record.id === screen.id);
		if (index >= 0) records[index] = { ...records[index], ...screen };
		else records.push(screen);
	}

	return records;
});
const screenById = computed(() => new Map(allScreens.value.map((screen) => [screen.id, screen])));
const parentById = computed(() => {
	const parents = new Map();

	for (const screen of allScreens.value) {
		if (screen.parent) parents.set(screen.id, screen.parent);
	}

	for (const screen of allScreens.value) {
		for (const childId of normalizeChildren(screen.children)) {
			if (!parents.has(childId)) parents.set(childId, screen.id);
		}
	}

	return parents;
});
const rootId = computed(() => props.root || allScreens.value[0]?.id || '');
const rawPath = computed(() => props.path ?? internalPath.value);
const resolvedPath = computed(() => normalizePath(rawPath.value));
const activeId = computed(() => resolvedPath.value.at(-1) || rootId.value);
const rootScreen = computed(() => screenById.value.get(rootId.value) || null);
const activeScreen = computed(() => screenById.value.get(activeId.value) || null);
const crumbs = computed(() => resolvedPath.value.map((id, index) => {
	const screen = screenById.value.get(id);
	return {
		id,
		index,
		title: screen?.title || screen?.label || id,
		screen,
		path: resolvedPath.value.slice(0, index + 1),
	};
}));
const canGoBack = computed(() => resolvedPath.value.length > 1);
const isDesktopLayout = computed(() => props.layout === 'desktop' || (props.layout === 'auto' && isDesktopMedia.value));
const transitionName = computed(() => (props.animate ? `dom-app-stack-${direction.value}` : ''));
const helpers = computed(() => ({
	activeId: activeId.value,
	back,
	canGoBack: canGoBack.value,
	crumbs: crumbs.value,
	direction: direction.value,
	goTo,
	layout: isDesktopLayout.value ? 'desktop' : 'mobile',
	openChild,
	path: resolvedPath.value,
	push,
	replace,
	reset,
	retry: retryActiveScreen,
}));
const breadcrumbSlotProps = computed(() => ({
	...helpers.value,
	activeScreen: activeScreen.value,
	rootScreen: rootScreen.value,
	screens: allScreens.value,
}));

watch(rootId, (id) => {
	if (id && props.path === null && !internalPath.value.length) internalPath.value = [id];
}, { immediate: true });

watch(activeScreen, (screen) => {
	if (screen) visitedPaths.set(screen.id, [...resolvedPath.value]);
	ensureLoaded(screen);
}, { immediate: true });

watch(() => props.path, (next, previous) => {
	if (next === null) return;
	direction.value = compareDirection(normalizePath(next), normalizePath(previous));
}, { deep: true });

onMounted(() => {
	// Each first visit mounts a new Transition. Animate those appearances, but
	// keep the initial screen still during the stack's own mount and hydration.
	hasMounted.value = true;
	configureDesktopMedia();
});

watch(() => props.desktopBreakpoint, () => {
	configureDesktopMedia();
});

onBeforeUnmount(() => {
	removeDesktopMediaListener?.();
});

/**
 * Normalizes an application-owned screen record without mutating it.
 */
function normalizeScreen(screen) {
	if (!screen || !screen.id) return null;
	return {
		...screen,
		id: String(screen.id),
		title: screen.title || screen.label || String(screen.id),
		children: normalizeChildren(screen.children),
	};
}

/**
 * Collects declarative screen registrations from the default slot.
 */
function extractSlotScreens(vnodes) {
	const screens = [];

	for (const vnode of vnodes) {
		if (!vnode) continue;
		if (isStackScreenVNode(vnode)) {
			const screen = normalizeScreen({
				...(vnode.props || {}),
				disabled: vnode.props?.disabled === '' ? true : vnode.props?.disabled,
				slot: vnode.children?.default,
			});
			if (screen) screens.push(screen);
			continue;
		}

		if (vnode.type === Fragment && Array.isArray(vnode.children)) {
			screens.push(...extractSlotScreens(vnode.children));
		}
	}

	return screens;
}

/**
 * Identifies a declarative screen registration vnode.
 */
function isStackScreenVNode(vnode) {
	const type = vnode?.type;
	return type?.name === 'DomAppStackScreen' || type?.__name === 'AppStackScreen';
}

/**
 * Resolves child records and identifiers into stable string ids.
 */
function normalizeChildren(children) {
	if (!Array.isArray(children)) return [];
	return children
		.map((child) => {
			if (typeof child === 'string' || typeof child === 'number') return String(child);
			return child?.id ? String(child.id) : '';
		})
		.filter(Boolean);
}

/**
 * Normalizes a controlled path and supplies the root when empty.
 */
function normalizePath(path) {
	const next = Array.isArray(path) ? path.map((item) => String(item)).filter(Boolean) : [];
	if (!next.length && rootId.value) return [rootId.value];
	return next;
}

/**
 * Compares navigation paths without changing either array.
 */
function samePath(a, b) {
	if (a.length !== b.length) return false;
	return a.every((item, index) => item === b[index]);
}

/**
 * Determines whether navigation pushes forward or returns to an ancestor.
 */
function compareDirection(next, previous = []) {
	if (next.length > previous.length && previous.every((id, index) => next[index] === id)) return 'forward';
	if (next.length < previous.length && next.every((id, index) => previous[index] === id)) return 'back';
	return next.length >= previous.length ? 'forward' : 'back';
}

/**
 * Builds an ancestry path and rejects cycles or disconnected parents.
 */
function pathToScreen(id) {
	const target = String(id || '');
	if (!target) return null;
	const root = rootId.value;
	const path = [target];
	const seen = new Set(path);
	let current = target;

	while (current && current !== root) {
		const parent = parentById.value.get(current);
		if (!parent || seen.has(parent)) return null;
		path.unshift(parent);
		seen.add(parent);
		current = parent;
	}

	if (root && path[0] !== root) return null;
	return path;
}

/**
 * Commits a navigation change and reports its direction to consumers.
 */
function commitPath(path, reason = 'navigate') {
	const previousPath = resolvedPath.value;
	const nextPath = normalizePath(path);
	if (samePath(nextPath, previousPath)) return;

	direction.value = compareDirection(nextPath, previousPath);
	if (props.path === null) internalPath.value = nextPath;
	emit('update:path', nextPath);
	emit('navigate', {
		direction: direction.value,
		path: nextPath,
		previousPath,
		reason,
		screen: screenById.value.get(nextPath.at(-1)) || null,
	});

	nextTick(focusActivePanel);
}

/**
 * Opens a screen, reusing its existing ancestry where available.
 */
function push(id) {
	const target = String(id || '');
	if (!target) return;
	const existingIndex = resolvedPath.value.indexOf(target);
	if (existingIndex >= 0) {
		commitPath(resolvedPath.value.slice(0, existingIndex + 1), 'push');
		return;
	}
	commitPath(pathToScreen(target) || [...resolvedPath.value, target], 'push');
}

/**
 * Replaces the active destination with the requested screen.
 */
function replace(id) {
	const target = String(id || '');
	if (!target) return;
	commitPath(pathToScreen(target) || [...resolvedPath.value.slice(0, -1), target], 'replace');
}

/**
 * Returns the requested number of levels without leaving the root.
 */
function back(steps = 1) {
	const count = Math.max(1, Number(steps) || 1);
	if (resolvedPath.value.length <= 1) return;
	commitPath(resolvedPath.value.slice(0, Math.max(1, resolvedPath.value.length - count)), 'back');
}

/**
 * Navigates to a breadcrumb index or registered screen id.
 */
function goTo(target) {
	if (typeof target === 'number') {
		const index = Math.max(0, Math.min(target, resolvedPath.value.length - 1));
		commitPath(resolvedPath.value.slice(0, index + 1), 'breadcrumb');
		return;
	}

	const id = String(target || '');
	if (!id) return;
	const existingIndex = resolvedPath.value.indexOf(id);
	if (existingIndex >= 0) {
		commitPath(resolvedPath.value.slice(0, existingIndex + 1), 'breadcrumb');
		return;
	}
	commitPath(pathToScreen(id) || [...resolvedPath.value, id], 'breadcrumb');
}

/**
 * Resets navigation to the root or another registered destination.
 */
function reset(id = rootId.value) {
	const target = String(id || '');
	commitPath(pathToScreen(target) || (target ? [target] : []), 'reset');
}

/**
 * Opens a child under its declared parent path.
 */
function openChild(parentId, childId) {
	const parentPath = pathToScreen(parentId) || resolvedPath.value;
	commitPath([...parentPath, String(childId)], 'push');
}

/**
 * Resolves the unique child records belonging to a screen.
 */
function childScreensFor(screen) {
	if (!screen) return [];
	const childIds = [
		...normalizeChildren(screen.children),
		...allScreens.value.filter((item) => item.parent === screen.id).map((item) => item.id),
	];
	return [...new Set(childIds)]
		.map((id) => screenById.value.get(id))
		.filter(Boolean);
}

/**
 * Detects the documented function-based lazy screen loader.
 */
function isLazyScreenComponent(component) {
	return typeof component === 'function';
}

/**
 * Returns a resolved component without invoking its loader during render.
 */
function componentForScreen(screen) {
	if (!screen) return null;
	if (loadedComponents.has(screen.id)) return loadedComponents.get(screen.id);
	if (screen.loader || isLazyScreenComponent(screen.component)) return null;
	return screen.component || null;
}

/**
 * Loads each asynchronous screen once and records success or failure.
 */
async function ensureLoaded(screen) {
	if (!screen || screen.slot || loadedComponents.has(screen.id) || loadingScreens.has(screen.id)) return;
	const loader = screen.loader || (isLazyScreenComponent(screen.component) ? screen.component : null);
	if (!loader) return;

	loadingScreens.add(screen.id);
	loadErrors.delete(screen.id);

	try {
		const module = await loader();
		const component = module?.default || module;
		loadedComponents.set(screen.id, component);
		emit('load', { screen, component });
	} catch (error) {
		loadErrors.set(screen.id, error);
		emit('error', { screen, error });
	} finally {
		loadingScreens.delete(screen.id);
	}
}

/**
 * Reports whether the requested screen has a pending loader.
 */
function isScreenLoading(screen) {
	return !!screen && loadingScreens.has(screen.id);
}

/**
 * Returns the most recent loader error for a screen.
 */
function screenError(screen) {
	return screen ? loadErrors.get(screen.id) : null;
}

/**
 * Focuses the visible screen without moving its retained scroll position.
 */
function focusActivePanel() {
	if (!props.focusOnNavigate) return;
	screenPanel.value?.querySelector('[data-dom-app-stack-screen]:not([inert]) [data-dom-app-stack-pane]')?.focus({ preventScroll: true });
}

/** Retries the active loader after a recoverable failure. */
function retryActiveScreen() {
	ensureLoaded(activeScreen.value);
}

/** Observes the actual stack width, including when embedded in a desktop pane or iframe. */
function configureDesktopMedia() {
	const element = screenPanel.value;
	const view = element?.ownerDocument.defaultView;
	if (!element || !view) return;
	removeDesktopMediaListener?.();
	const breakpoint = String(props.desktopBreakpoint || '768px').trim();
	if (breakpoint.startsWith('(')) {
		const query = view.matchMedia(breakpoint);
		/** Synchronizes an explicitly supplied media-query breakpoint. */
		const update = () => { isDesktopMedia.value = query.matches; };
		update();
		query.addEventListener('change', update);
		removeDesktopMediaListener = () => query.removeEventListener('change', update);
		return;
	}
	const probe = element.ownerDocument.createElement('span');
	probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;height:0;';
	probe.style.width = breakpoint;
	element.appendChild(probe);
	/** Resolves a CSS-length breakpoint against the component's own container. */
	const update = () => { isDesktopMedia.value = element.clientWidth >= (probe.getBoundingClientRect().width || 768); };
	const observer = new view.ResizeObserver(update);
	observer.observe(element);
	observer.observe(probe);
	update();
	removeDesktopMediaListener = () => {
		observer.disconnect();
		probe.remove();
	};
}

</script>

<template>
	<div
		data-dom-app-stack
		ref="screenPanel"
		class="[&_input]:text-base [&_textarea]:text-base [&_select]:text-base relative flex min-h-0 min-w-0 w-full flex-col overflow-hidden bg-canvas text-canvas-fg pt-[var(--dom-safe-area-top,env(safe-area-inset-top,0px))] pb-[var(--dom-safe-area-bottom,env(safe-area-inset-bottom,0px))] pl-[var(--dom-safe-area-left,env(safe-area-inset-left,0px))] pr-[var(--dom-safe-area-right,env(safe-area-inset-right,0px))]"
		:style="{ height }"
	>
		<slot
			v-if="isDesktopLayout && showBreadcrumbs"
			name="breadcrumb"
			v-bind="breadcrumbSlotProps"
		>
			<nav
				class="flex min-h-12 shrink-0 items-center gap-2 border-b border-border bg-canvas/95 px-2 backdrop-blur"
				:class="breadcrumbClass"
				aria-label="Settings path"
			>
				<button
					v-if="canGoBack"
					type="button"
					class="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-2.5 text-sm font-medium text-canvas-fg transition hover:bg-secondary active:scale-95"
					:class="backButtonClass"
					@click="back()"
				>
					<svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path d="M12.7 4.3a1 1 0 0 1 0 1.4L8.42 10l4.3 4.3a1 1 0 0 1-1.42 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.42 0Z" />
					</svg>
					<span>Back</span>
				</button>

				<ol class="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm">
					<li
						v-for="(crumb, index) in crumbs"
						:key="`${crumb.id}:${index}`"
						class="flex min-w-0 items-center gap-1"
					>
						<button
							v-if="index < crumbs.length - 1"
							type="button"
							class="min-h-11 max-w-36 truncate rounded-full px-2.5 py-1.5 font-medium text-muted-fg transition hover:bg-secondary hover:text-canvas-fg"
							:class="breadcrumbItemClass"
							@click="goTo(index)"
						>{{ crumb.title }}</button>
						<span
							v-else
							class="max-w-44 truncate rounded-full bg-secondary px-2.5 py-1.5 font-semibold text-canvas-fg"
							:class="breadcrumbCurrentClass"
							aria-current="page"
						>{{ crumb.title }}</span>
						<svg
							v-if="index < crumbs.length - 1"
							class="size-3 shrink-0 text-muted-fg"
							viewBox="0 0 20 20"
							fill="currentColor"
							aria-hidden="true"
						>
							<path d="M7.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L11.58 10 7.3 5.7a1 1 0 0 1 0-1.4Z" />
						</svg>
					</li>
				</ol>
			</nav>
		</slot>

		<div class="relative min-h-0 flex-1 overflow-hidden [--dom-safe-area-top:0px] [--dom-safe-area-bottom:0px] [--dom-safe-area-left:0px] [--dom-safe-area-right:0px]">
			<Transition
				v-for="[id, screenPath] in visitedPaths"
				:key="id"
				:name="transitionName"
				:appear="hasMounted && animate"
				@after-enter="focusActivePanel"
			>
				<section
					v-show="id === activeId"
					:data-dom-app-stack-screen="id"
					:inert="id !== activeId"
					class="absolute inset-0 flex min-h-0 flex-col bg-canvas"
				>
					<slot v-if="!isDesktopLayout && showHeader" name="header" v-bind="{ ...breadcrumbSlotProps, activeScreen: screenById.get(id), path: screenPath, canGoBack: screenPath.length > 1 }">
						<header class="grid min-h-11 shrink-0 grid-cols-[1fr_minmax(0,2fr)_1fr] items-center border-b border-border bg-canvas/95 px-2">
							<button
								v-if="screenPath.length > 1"
								type="button"
								class="inline-flex min-h-11 min-w-11 items-center gap-0.5 justify-self-start rounded-lg pr-2 text-sm text-primary active:opacity-60 focus-visible:outline-2 focus-visible:outline-ring"
								:class="backButtonClass"
								:aria-label="`Back to ${screenById.get(screenPath.at(-2))?.title || 'previous page'}`"
								@click="back()"
							>
								<svg class="size-6 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path d="M12.7 4.3a1 1 0 0 1 0 1.4L8.42 10l4.3 4.3a1 1 0 0 1-1.42 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.42 0Z" />
								</svg>
								<span>Back</span>
							</button>
							<span v-else aria-hidden="true"></span>
							<h1 class="truncate text-center text-base font-semibold tracking-tight">{{ screenById.get(id)?.title || emptyTitle }}</h1>
						</header>
					</slot>
					<div
						data-dom-app-stack-pane
						tabindex="-1"
						:aria-label="screenById.get(id)?.title"
						class="min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none"
						:class="[isDesktopLayout ? 'p-6' : 'p-3', isDesktopLayout ? desktopContentClass : mobilePanelClass]"
						:aria-busy="isScreenLoading(screenById.get(id)) ? 'true' : undefined"
					>
						<StackScreenRenderer
							:screen="screenById.get(id)"
							:component="componentForScreen(screenById.get(id))"
							:helpers="helpers"
							:child-screens="childScreensFor(screenById.get(id))"
							:loading="isScreenLoading(screenById.get(id))"
							:error="screenError(screenById.get(id))"
							:loading-label="loadingLabel"
							:empty-title="emptyTitle"
							:empty-description="emptyDescription"
						/>
					</div>
				</section>
			</Transition>
			<div v-if="!activeScreen" class="p-6 text-center text-sm text-muted-fg">{{ emptyTitle }}</div>
		</div>
	</div>
</template>

<style scoped>
[data-dom-app-stack-screen] {
	backface-visibility: hidden;
}

.dom-app-stack-forward-enter-active,
.dom-app-stack-back-leave-active {
	z-index: 2;
}

.dom-app-stack-forward-leave-active,
.dom-app-stack-back-enter-active {
	z-index: 1;
}

.dom-app-stack-forward-enter-active,
.dom-app-stack-back-enter-active {
	pointer-events: none;
	transition:
		transform 320ms cubic-bezier(0.32, 0.72, 0, 1),
		opacity 220ms ease;
}

.dom-app-stack-forward-leave-active,
.dom-app-stack-back-leave-active {
	pointer-events: none;
	transition:
		transform 320ms cubic-bezier(0.32, 0.72, 0, 1),
		opacity 140ms ease 180ms;
}

.dom-app-stack-forward-enter-from {
	opacity: 0.98;
	transform: translate3d(100%, 0, 0);
}

.dom-app-stack-forward-leave-to {
	opacity: 0;
	transform: translate3d(-24%, 0, 0);
}

.dom-app-stack-back-enter-from {
	opacity: 0.72;
	transform: translate3d(-24%, 0, 0);
}

.dom-app-stack-back-leave-to {
	opacity: 0;
	transform: translate3d(100%, 0, 0);
}

@media (prefers-reduced-motion: reduce) {
	.dom-app-stack-forward-enter-active,
	.dom-app-stack-forward-leave-active,
	.dom-app-stack-back-enter-active,
	.dom-app-stack-back-leave-active {
		transition-delay: 0ms;
		transition-duration: 1ms;
	}

	.dom-app-stack-forward-enter-from,
	.dom-app-stack-forward-leave-to,
	.dom-app-stack-back-enter-from,
	.dom-app-stack-back-leave-to {
		opacity: 1;
		transform: none;
	}
}
</style>
