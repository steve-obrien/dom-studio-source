<script setup>
import {
	computed,
	onBeforeUnmount,
	onMounted,
	onUpdated,
	ref,
	watch,
} from 'vue';
import { useScrollMenuContext } from './scrollMenuContext.js';

defineOptions({
	name: 'DomScrollMenuItem',
	__doc: {
		name: 'Scroll menu item',
		tag: '<DomScrollMenuItem>',
		description: 'A fragment-link wrapper that registers either its href prop or a slotted anchor with the parent DomScrollMenu scrollspy.',
		slots: [
			{ name: '(default)', payload: '{ active, href }', description: 'Link contents when href is set, or one custom fragment anchor when href is omitted.' },
		],
		events: [
			{ name: 'navigate', payload: '{ href, active }', description: 'Emitted when the fragment link is activated with an unmodified primary click.' },
		],
	},
});

const props = defineProps({
	href: {
		type: String,
		default: '',
		validator: (value) => !value || (value.startsWith('#') && value.length > 1),
		_edit: { description: 'Optional fragment href shorthand, including the leading #. Omit it when the slot provides its own anchor.' },
	},
	as: {
		type: String,
		default: 'li',
		_edit: { description: 'Element wrapping the anchor. Use li with the default DomScrollMenu list.' },
	},
	depth: {
		type: Number,
		default: 0,
		_edit: { description: 'Visual nesting depth for subordinate page headings.' },
	},
	disabled: {
		type: Boolean,
		default: false,
		_edit: { description: 'Remove the fragment link from navigation and scrollspy selection.' },
	},
});

const emit = defineEmits(['navigate']);
const context = useScrollMenuContext();
const itemToken = Symbol('DomScrollMenuItem');
const itemRoot = ref(null);
const slottedHref = ref('');
let slottedAnchor = null;
const depthClasses = {
	0: '[&>a]:pl-4',
	1: '[&>a]:pl-7',
	2: '[&>a]:pl-10',
	3: '[&>a]:pl-13',
};
const resolvedHref = computed(() => props.href || slottedHref.value);
const active = computed(() => Boolean(context?.isItemActive(resolvedHref.value)));
const itemClasses = computed(() => [
	'min-w-0',
	'[&>a]:-ml-px [&>a]:block [&>a]:border-l [&>a]:py-1.5 [&>a]:pr-3 [&>a]:text-sm [&>a]:leading-5 [&>a]:outline-none [&>a]:transition',
	'[&>a:focus-visible]:rounded-r-md [&>a:focus-visible]:ring-2 [&>a:focus-visible]:ring-ring/50',
	depthClasses[Math.min(Math.max(props.depth, 0), 3)] || depthClasses[0],
	active.value
		? '[&>a]:border-primary [&>a]:font-semibold [&>a]:text-canvas-fg'
		: '[&>a]:border-transparent [&>a]:font-normal [&>a]:text-muted-fg [&>a:hover]:border-border [&>a:hover]:text-canvas-fg',
	props.disabled && '[&>a]:cursor-not-allowed [&>a]:opacity-50',
]);

/**
 * Returns the item's current fragment href for parent registration.
 *
 * @returns {string} Fragment href.
 */
function getHref() {
	return resolvedHref.value;
}

/**
 * Returns the item's current disabled state for parent registration.
 *
 * @returns {boolean} Whether the item is disabled.
 */
function isDisabled() {
	return props.disabled;
}

/**
 * Removes scroll-menu-owned state from a previously discovered slotted anchor.
 *
 * @param {HTMLAnchorElement|null} anchor Previously managed anchor.
 * @returns {void}
 */
function clearSlottedAnchorState(anchor) {
	if (!anchor) return;
	if (anchor.getAttribute('aria-current') === 'location') anchor.removeAttribute('aria-current');
	anchor.removeAttribute('aria-disabled');
	anchor.removeAttribute('data-active');
	anchor.removeAttribute('data-dom-scroll-menu-link');
}

/**
 * Applies current-location and disabled semantics to the discovered slot anchor.
 *
 * @returns {void}
 */
function syncSlottedAnchorState() {
	if (!slottedAnchor) return;
	slottedAnchor.toggleAttribute('data-active', active.value);
	slottedAnchor.setAttribute('data-dom-scroll-menu-link', '');

	if (active.value) slottedAnchor.setAttribute('aria-current', 'location');
	else if (slottedAnchor.getAttribute('aria-current') === 'location') slottedAnchor.removeAttribute('aria-current');

	if (props.disabled) slottedAnchor.setAttribute('aria-disabled', 'true');
	else slottedAnchor.removeAttribute('aria-disabled');
}

/**
 * Discovers the first fragment anchor rendered directly through the default slot.
 *
 * @returns {void}
 */
function discoverSlottedAnchor() {
	if (props.href || !itemRoot.value) {
		clearSlottedAnchorState(slottedAnchor);
		slottedAnchor = null;
		if (slottedHref.value) slottedHref.value = '';
		return;
	}

	const nextAnchor = itemRoot.value.querySelector('a[href^="#"]');
	if (nextAnchor !== slottedAnchor) {
		clearSlottedAnchorState(slottedAnchor);
		slottedAnchor = nextAnchor;
	}

	const nextHref = slottedAnchor?.getAttribute('href') || '';
	if (nextHref !== slottedHref.value) {
		slottedHref.value = nextHref;
		context?.refreshItems();
	}
	syncSlottedAnchorState();
}

/**
 * Handles selection while leaving scrolling and URL updates to the real anchor.
 *
 * @param {MouseEvent} event Anchor click event.
 * @returns {void}
 */
function handleClick(event) {
	const anchor = event.target.closest?.('a[href^="#"]');
	if (!anchor || !itemRoot.value?.contains(anchor)) return;
	if (props.disabled) {
		event.preventDefault();
		return;
	}
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
	const href = anchor.getAttribute('href') || resolvedHref.value;
	context?.activateItem(href);
	emit('navigate', { href, active: true });
}

const unregister = context?.registerItem({
	token: itemToken,
	getHref,
	isDisabled,
});

watch(() => [props.href, props.disabled], () => {
	discoverSlottedAnchor();
	context?.refreshItems();
});
watch(active, syncSlottedAnchorState);

onMounted(discoverSlottedAnchor);
onUpdated(discoverSlottedAnchor);

onBeforeUnmount(() => {
	clearSlottedAnchorState(slottedAnchor);
	unregister?.();
});
</script>

<template>
	<component
		:is="as"
		ref="itemRoot"
		:data-active="active ? '' : undefined"
		:class="itemClasses"
		@click="handleClick"
	>
		<a
			v-if="href"
			:href="disabled ? undefined : href"
			:aria-current="active ? 'location' : undefined"
			:aria-disabled="disabled ? 'true' : undefined"
			:tabindex="disabled ? -1 : undefined"
			:data-active="active ? '' : undefined"
		>
			<slot :active="active" :href="resolvedHref" />
		</a>
		<slot v-else :active="active" :href="resolvedHref" />
	</component>
</template>
