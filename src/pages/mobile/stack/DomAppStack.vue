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
	setup(props) {
		return () => {
			if (props.loading) return renderLoading(props.screen, props.loadingLabel);
			if (props.error) return renderError(props.error);
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

function renderError(error) {
	return h('div', { class: 'grid min-h-64 place-items-center p-6 text-center' }, [
		h('div', { class: 'max-w-sm space-y-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-5' }, [
			h('p', { class: 'text-sm font-semibold text-destructive' }, 'Unable to load this setting'),
			h('p', { class: 'text-xs leading-5 text-muted-fg' }, error?.message || 'The screen loader rejected.'),
		]),
	]);
}

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
		description: 'A settings-style screen stack that handles slide navigation, breadcrumbs, lazy screens, and responsive panel styling.',
		slots: [
			{ name: '(default)', description: 'Optional DomAppStackScreen children used to register slot-driven screens.' },
			{ name: 'breadcrumb', payload: '{ crumbs, canGoBack, back, goTo, push, path }', description: 'Replace the breadcrumb and back control while keeping the stack state.' },
		],
		events: [
			{ name: 'update:path', payload: '(path: Array<string>)', description: 'Fired when the active stack path changes.' },
			{ name: 'navigate', payload: '(payload: { path, previousPath, direction, screen, reason })', description: 'Fired after push, back, replace, reset, or breadcrumb navigation.' },
			{ name: 'load', payload: '(payload: { screen, component })', description: 'Fired when a lazy screen component resolves.' },
			{ name: 'error', payload: '(payload: { screen, error })', description: 'Fired when a lazy screen component rejects.' },
		],
		playground: {
			mobileSlot: 'content',
			initial: {
				root: 'settings',
				screens: [
					{ id: 'settings', title: 'Settings', children: ['account', 'notifications'] },
					{ id: 'account', title: 'Account', description: 'Profile, password, and sign-in settings.' },
					{ id: 'notifications', title: 'Notifications', description: 'Push, email, and quiet hours.' },
				],
			},
		},
	},
});

const props = defineProps({
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
		_edit: { description: 'Render the default breadcrumb bar, or provide the breadcrumb slot.' },
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
const activeComponent = computed(() => componentForScreen(activeScreen.value));
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
	ensureLoaded(screen);
}, { immediate: true });

watch(() => props.path, (next, previous) => {
	if (next === null) return;
	direction.value = compareDirection(normalizePath(next), normalizePath(previous));
}, { deep: true });

onMounted(() => {
	configureDesktopMedia();
});

watch(() => props.desktopBreakpoint, () => {
	configureDesktopMedia();
});

onBeforeUnmount(() => {
	removeDesktopMediaListener?.();
});

function normalizeScreen(screen) {
	if (!screen || !screen.id) return null;
	return {
		...screen,
		id: String(screen.id),
		title: screen.title || screen.label || String(screen.id),
		children: normalizeChildren(screen.children),
	};
}

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

function isStackScreenVNode(vnode) {
	const type = vnode?.type;
	return type?.name === 'DomAppStackScreen' || type?.__name === 'AppStackScreen';
}

function normalizeChildren(children) {
	if (!Array.isArray(children)) return [];
	return children
		.map((child) => {
			if (typeof child === 'string' || typeof child === 'number') return String(child);
			return child?.id ? String(child.id) : '';
		})
		.filter(Boolean);
}

function normalizePath(path) {
	const next = Array.isArray(path) ? path.map((item) => String(item)).filter(Boolean) : [];
	if (!next.length && rootId.value) return [rootId.value];
	return next;
}

function samePath(a, b) {
	if (a.length !== b.length) return false;
	return a.every((item, index) => item === b[index]);
}

function compareDirection(next, previous = []) {
	if (next.length > previous.length && previous.every((id, index) => next[index] === id)) return 'forward';
	if (next.length < previous.length && next.every((id, index) => previous[index] === id)) return 'back';
	return next.length >= previous.length ? 'forward' : 'back';
}

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

function replace(id) {
	const target = String(id || '');
	if (!target) return;
	commitPath(pathToScreen(target) || [...resolvedPath.value.slice(0, -1), target], 'replace');
}

function back(steps = 1) {
	const count = Math.max(1, Number(steps) || 1);
	if (resolvedPath.value.length <= 1) return;
	commitPath(resolvedPath.value.slice(0, Math.max(1, resolvedPath.value.length - count)), 'back');
}

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

function reset(id = rootId.value) {
	const target = String(id || '');
	commitPath(pathToScreen(target) || (target ? [target] : []), 'reset');
}

function openChild(parentId, childId) {
	const parentPath = pathToScreen(parentId) || resolvedPath.value;
	commitPath([...parentPath, String(childId)], 'push');
}

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

function isLazyScreenComponent(component) {
	return typeof component === 'function';
}

function componentForScreen(screen) {
	if (!screen) return null;
	if (loadedComponents.has(screen.id)) return loadedComponents.get(screen.id);
	if (screen.loader || isLazyScreenComponent(screen.component)) return null;
	return screen.component || null;
}

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

function isScreenLoading(screen) {
	return !!screen && loadingScreens.has(screen.id);
}

function screenError(screen) {
	return screen ? loadErrors.get(screen.id) : null;
}

function focusActivePanel() {
	if (!props.focusOnNavigate) return;
	screenPanel.value?.focus?.({ preventScroll: true });
}

function mediaQueryForBreakpoint(value) {
	const text = String(value || '').trim();
	if (!text) return '(min-width: 768px)';
	if (text.startsWith('(')) return text;
	return `(min-width: ${text})`;
}

function configureDesktopMedia() {
	if (typeof window === 'undefined') return;
	removeDesktopMediaListener?.();

	const query = window.matchMedia(mediaQueryForBreakpoint(props.desktopBreakpoint));
	const update = () => {
		isDesktopMedia.value = query.matches;
	};

	update();
	if (query.addEventListener) query.addEventListener('change', update);
	else query.addListener(update);
	removeDesktopMediaListener = () => {
		if (query.removeEventListener) query.removeEventListener('change', update);
		else query.removeListener(update);
	};
}
</script>

<template>
	<div
		data-dom-app-stack
		class="flex h-full min-h-[28rem] w-full flex-col overflow-hidden bg-canvas text-canvas-fg"
	>
		<slot
			v-if="showBreadcrumbs"
			name="breadcrumb"
			v-bind="breadcrumbSlotProps"
		>
			<nav
				class="flex min-h-12 items-center gap-2 border-b border-border bg-canvas/95 px-2 backdrop-blur"
				:class="breadcrumbClass"
				aria-label="Settings path"
			>
				<button
					v-if="canGoBack"
					type="button"
					class="inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-sm font-medium text-canvas-fg transition hover:bg-secondary active:scale-95"
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
							class="max-w-36 truncate rounded-full px-2.5 py-1.5 font-medium text-muted-fg transition hover:bg-secondary hover:text-canvas-fg"
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

		<div class="relative min-h-0 flex-1 overflow-hidden">
			<Transition :name="transitionName">
				<section
					:key="activeId || 'empty'"
					ref="screenPanel"
					tabindex="-1"
					data-dom-app-stack-pane
					class="absolute inset-0 min-h-0 overflow-y-auto outline-none [-webkit-overflow-scrolling:touch]"
					:class="[isDesktopLayout ? 'p-4 md:p-6' : 'p-4', isDesktopLayout ? desktopContentClass : mobilePanelClass]"
					:aria-busy="isScreenLoading(activeScreen) ? 'true' : undefined"
				>
					<StackScreenRenderer
						:screen="activeScreen"
						:component="activeComponent"
						:helpers="helpers"
						:child-screens="childScreensFor(activeScreen)"
						:loading="isScreenLoading(activeScreen)"
						:error="screenError(activeScreen)"
						:loading-label="loadingLabel"
						:empty-title="emptyTitle"
						:empty-description="emptyDescription"
					/>
				</section>
			</Transition>
		</div>
	</div>
</template>

<style scoped>
[data-dom-app-stack-pane] {
	backface-visibility: hidden;
	will-change: transform, opacity;
}

.dom-app-stack-forward-enter-active,
.dom-app-stack-back-enter-active {
	pointer-events: none;
	transition:
		transform 360ms cubic-bezier(0.4, 0, 0.2, 1),
		opacity 220ms ease;
}

.dom-app-stack-forward-leave-active,
.dom-app-stack-back-leave-active {
	pointer-events: none;
	transition:
		transform 360ms cubic-bezier(0.4, 0, 0.2, 1),
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
