<script setup>
import {
	computed,
	nextTick,
	onBeforeUnmount,
	onMounted,
	ref,
	watch,
} from 'vue';
import { provideScrollMenuContext } from './scrollMenuContext.js';

defineOptions({
	name: 'DomScrollMenu',
	__doc: {
		name: 'Scroll menu',
		tag: '<DomScrollMenu>',
		description: 'A smooth-scrolling table of contents that keeps real fragment links highlighted as their target headings move through a page or scroll container.',
		slots: [
			{ name: '(default)', payload: '{ activeHref }', description: 'DomScrollMenuItem rows or equivalent custom content.' },
			{ name: 'label', payload: '{ label }', description: 'Custom visible navigation label.' },
		],
		events: [
			{ name: 'update:modelValue', payload: 'href', description: 'Emitted when scrolling or navigation changes the active fragment link.' },
			{ name: 'change', payload: '{ href, target }', description: 'Emitted with the active fragment and its target element.' },
		],
	},
});

const props = defineProps({
	modelValue: {
		type: String,
		default: '',
		_edit: { description: 'Active fragment href. Use v-model when the surrounding page needs the current section.' },
	},
	as: {
		type: String,
		default: 'nav',
		_edit: { description: 'Root element rendered around the scroll menu.' },
	},
	listAs: {
		type: String,
		default: 'ul',
		_edit: { description: 'Element rendered around the menu items.' },
	},
	label: {
		type: String,
		default: 'On this page',
		_edit: { description: 'Accessible navigation label and default visible heading.' },
	},
	showLabel: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the visual navigation label above the item list.' },
	},
	scrollRoot: {
		type: [String, Object],
		default: null,
		_edit: { description: 'Optional scroll-container element or CSS selector. By default the nearest scrollable ancestor of the first target is used.' },
	},
	scrollBehavior: {
		type: String,
		default: 'smooth',
		validator: (value) => ['auto', 'smooth'].includes(value),
		_edit: { description: 'Fragment navigation behavior. Smooth scrolling respects the user’s reduced-motion preference.' },
	},
	rootMargin: {
		type: String,
		default: '0px 0px -70% 0px',
		_edit: { description: 'IntersectionObserver root margin defining the activation band. Use a negative top value to account for sticky headers.' },
	},
});

const emit = defineEmits(['update:modelValue', 'change']);
const menuRoot = ref(null);
const internalActiveHref = ref('');
const registrationVersion = ref(0);
const registeredItems = new Map();
const visibleTargets = new Map();
let intersectionObserver = null;
let observationRun = 0;
let mounted = false;
let scrollBehaviorRoot = null;
let previousScrollBehavior = '';
let scrollBehaviorRestoreTimer = null;

const activeHref = computed(() => props.modelValue || internalActiveHref.value);

/**
 * Returns a nested item's current fragment href.
 *
 * @param {object} item Registered item contract.
 * @returns {string} Current fragment href.
 */
function itemHref(item) {
	return String(item.getHref?.() || '');
}

/**
 * Reports whether a registered item is currently disabled.
 *
 * @param {object} item Registered item contract.
 * @returns {boolean} Whether the item is disabled.
 */
function itemDisabled(item) {
	return Boolean(item.isDisabled?.());
}

/**
 * Resolves a fragment href to its target element without CSS-selector escaping.
 *
 * @param {string} href Fragment href such as #installation.
 * @returns {HTMLElement|null} Matching document element.
 */
function targetForHref(href) {
	if (typeof document === 'undefined' || !href.startsWith('#')) return null;

	try {
		return document.getElementById(decodeURIComponent(href.slice(1)));
	} catch {
		return document.getElementById(href.slice(1));
	}
}

/**
 * Builds the ordered set of enabled menu items whose targets currently exist.
 *
 * @returns {Array<{ href: string, target: HTMLElement }>} Resolved scroll targets.
 */
function resolvedTargets() {
	const seen = new Set();
	const targets = [];

	for (const item of registeredItems.values()) {
		const href = itemHref(item);
		if (!href || seen.has(href) || itemDisabled(item)) continue;
		const target = targetForHref(href);
		if (!target) continue;
		seen.add(href);
		targets.push({ href, target });
	}

	return targets;
}

/**
 * Reports whether an element can provide vertical scrolling for its descendants.
 *
 * @param {HTMLElement} element Candidate scroll container.
 * @returns {boolean} Whether the element is a vertical scroll container.
 */
function isScrollableElement(element) {
	if (typeof window === 'undefined') return false;
	const overflowY = window.getComputedStyle(element).overflowY;
	return /(auto|scroll|overlay)/.test(overflowY) && element.scrollHeight > element.clientHeight;
}

/**
 * Finds the nearest vertical scroll container for a target element.
 *
 * @param {HTMLElement|null} target Observed heading or section.
 * @returns {HTMLElement|null} Scroll container, or null for the viewport.
 */
function nearestScrollRoot(target) {
	let element = target?.parentElement || null;

	while (element && element !== document.documentElement) {
		if (isScrollableElement(element)) return element;
		element = element.parentElement;
	}

	return null;
}

/**
 * Resolves an explicit scroll root or discovers one from the first target.
 *
 * @param {Array<{ href: string, target: HTMLElement }>} targets Resolved target records.
 * @returns {HTMLElement|null} IntersectionObserver root, or null for the viewport.
 */
function resolveScrollRoot(targets) {
	if (typeof document === 'undefined') return null;
	if (typeof props.scrollRoot === 'string') {
		return document.querySelector(props.scrollRoot);
	}
	if (props.scrollRoot instanceof Element) return props.scrollRoot;
	return nearestScrollRoot(targets[0]?.target || null);
}

/**
 * Commits a new active fragment and tells v-model consumers about the change.
 *
 * @param {string} href Active fragment href.
 * @returns {void}
 */
function setActiveHref(href) {
	if (!href || activeHref.value === href) return;
	internalActiveHref.value = href;
	const target = targetForHref(href);
	emit('update:modelValue', href);
	emit('change', { href, target });
}

/**
 * Selects the closest visible heading inside the observer activation band.
 *
 * @param {IntersectionObserverEntry[]} entries Changed intersection records.
 * @param {IntersectionObserver} observer Active observer.
 * @returns {void}
 */
function handleIntersections(entries, observer) {
	for (const entry of entries) {
		visibleTargets.set(entry.target, entry.isIntersecting);
	}

	const rootTop = observer.root?.getBoundingClientRect().top || 0;
	const candidate = resolvedTargets()
		.filter(({ target }) => visibleTargets.get(target))
		.sort((left, right) => (
			Math.abs(left.target.getBoundingClientRect().top - rootTop)
			- Math.abs(right.target.getBoundingClientRect().top - rootTop)
		))[0];

	if (candidate) setActiveHref(candidate.href);
}

/**
 * Disconnects the active observer and clears its visible-target state.
 *
 * @returns {void}
 */
function stopObservation() {
	intersectionObserver?.disconnect();
	intersectionObserver = null;
	visibleTargets.clear();
}

/**
 * Starts observing the current set of fragment targets.
 *
 * @returns {void}
 */
function startObservation() {
	stopObservation();
	const targets = resolvedTargets();
	if (!targets.length) return;

	const hashTarget = targets.find(({ href }) => href === window.location.hash);
	setActiveHref(hashTarget?.href || activeHref.value || targets[0].href);

	if (typeof IntersectionObserver === 'undefined') return;
	const root = resolveScrollRoot(targets);

	try {
		intersectionObserver = new IntersectionObserver(handleIntersections, {
			root,
			rootMargin: props.rootMargin,
			threshold: 0,
		});
	} catch {
		intersectionObserver = new IntersectionObserver(handleIntersections, {
			root,
			rootMargin: '0px 0px -70% 0px',
			threshold: 0,
		});
	}

	for (const { target } of targets) intersectionObserver.observe(target);
}

/**
 * Refreshes observation after Vue has applied item or target changes.
 *
 * @returns {Promise<void>}
 */
async function refreshObservation() {
	const run = ++observationRun;
	await nextTick();
	if (!mounted || run !== observationRun) return;
	startObservation();
}

/**
 * Registers a nested DomScrollMenuItem with this scrollspy.
 *
 * @param {{ token: symbol, getHref: Function, isDisabled: Function }} item Nested item contract.
 * @returns {Function} Cleanup callback that unregisters the item.
 */
function registerItem(item) {
	registeredItems.set(item.token, item);
	registrationVersion.value += 1;

	return () => {
		registeredItems.delete(item.token);
		registrationVersion.value += 1;
	};
}

/**
 * Requests target resolution again after an item prop changes.
 *
 * @returns {void}
 */
function refreshItems() {
	registrationVersion.value += 1;
}

/**
 * Reports whether a fragment link is the current scrollspy selection.
 *
 * @param {string} href Fragment href.
 * @returns {boolean} Whether the link is active.
 */
function isItemActive(href) {
	return activeHref.value === href;
}

/**
 * Restores the scroll root's inline behavior after native fragment navigation starts.
 *
 * @returns {void}
 */
function restoreScrollBehavior() {
	if (scrollBehaviorRestoreTimer !== null) {
		window.clearTimeout(scrollBehaviorRestoreTimer);
		scrollBehaviorRestoreTimer = null;
	}

	if (scrollBehaviorRoot?.style.scrollBehavior === 'smooth') {
		scrollBehaviorRoot.style.scrollBehavior = previousScrollBehavior;
	}

	scrollBehaviorRoot = null;
	previousScrollBehavior = '';
}

/**
 * Temporarily enables native smooth scrolling on the resolved scroll root.
 *
 * @param {string} href Fragment href.
 * @returns {void}
 */
function prepareScrollBehavior(href) {
	restoreScrollBehavior();
	if (props.scrollBehavior !== 'smooth') return;
	if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

	const target = targetForHref(href);
	if (!target) return;
	const root = resolveScrollRoot([{ href, target }]) || document.documentElement;
	if (!root?.style) return;

	scrollBehaviorRoot = root;
	previousScrollBehavior = root.style.scrollBehavior;
	root.style.scrollBehavior = 'smooth';
	scrollBehaviorRestoreTimer = window.setTimeout(restoreScrollBehavior, 1000);
}

/**
 * Selects an item and prepares its scroll root for native anchor navigation.
 *
 * @param {string} href Fragment href.
 * @returns {void}
 */
function activateItem(href) {
	setActiveHref(href);
	prepareScrollBehavior(href);
}

/**
 * Syncs selection when browser history changes the page fragment.
 *
 * @returns {void}
 */
function handleHashChange() {
	const href = window.location.hash;
	const ownsHref = resolvedTargets().some((item) => item.href === href);
	if (ownsHref) setActiveHref(href);
}

provideScrollMenuContext({
	activateItem,
	isItemActive,
	refreshItems,
	registerItem,
});

watch(registrationVersion, refreshObservation);
watch(() => [props.scrollRoot, props.rootMargin], refreshObservation);
watch(() => props.scrollBehavior, restoreScrollBehavior);
watch(() => props.modelValue, (value) => {
	if (value) internalActiveHref.value = value;
});

onMounted(() => {
	mounted = true;
	window.addEventListener('hashchange', handleHashChange);
	refreshObservation();
});

onBeforeUnmount(() => {
	mounted = false;
	observationRun += 1;
	window.removeEventListener('hashchange', handleHashChange);
	restoreScrollBehavior();
	stopObservation();
});
</script>

<template>
	<component
		:is="as"
		ref="menuRoot"
		:aria-label="label"
		:role="as === 'nav' ? undefined : 'navigation'"
		class="min-w-0"
	>
		<div
			v-if="showLabel"
			class="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg"
		>
			<slot name="label" :label="label">{{ label }}</slot>
		</div>
		<component
			:is="listAs"
			class="border-l border-border"
		>
			<slot :active-href="activeHref" />
		</component>
	</component>
</template>
