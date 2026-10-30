<script setup>
import { computed, nextTick, onMounted, ref, shallowRef, useId, useSlots } from 'vue';
import { resolveFloatingTeleportTarget } from '../../lib/vue/floatingTeleportTarget.js';

defineOptions({
	__doc: {
		name: 'Dropdown',
		tag: '<DomDropdown>',
		description: 'A menu that opens from a button — fully keyboard accessible, with focus return, optional scroll lock, and outside-click handling.',
		slots: [
			{ name: '(default)', payload: '{ close, open, toggle }', description: 'Custom panel content, usually a DomMenu composed with MenuItem rows.' },
			{ name: 'trigger', description: 'Replaces the inner content of the trigger button.' },
			{ name: 'item', payload: '{ item, index }', description: 'Replaces the rendering of each menu item.' },
			{ name: 'panel', payload: '{ close, open, toggle }', description: 'Replaces menu items with custom dropdown content, such as a tree view or form.' },
		],
		events: [
			{ name: 'select', payload: '(value: string)', description: 'Fired when a menu item is chosen.' },
		],
		keyboard: [
			{ keys: 'Enter / Space / ↓', action: 'Open menu (when trigger is focused).' },
			{ keys: '↑ / ↓', action: 'Move active item.' },
			{ keys: 'Home / End', action: 'Jump to first / last item.' },
			{ keys: 'Enter', action: 'Select active item.' },
			{ keys: 'Esc / Tab', action: 'Close menu and return focus.' },
		],
	},
});

const menuId = `dom-dropdown-${useId()}`;

const props = defineProps({
	items: {
		type: Array,
		default: () => [],
		_edit: {
			component: 'DomJsonListInput',
			description: 'Menu items shown when the dropdown opens.',
			props: {
				compact: true,
				addLabel: '+ Add item',
				schema: [
					{ key: 'label', label: 'Label', placeholder: 'Menu item', default: (index) => `Item ${index + 1}` },
					{ key: 'value', label: 'Value', placeholder: 'item-value', default: (index) => `item-${index + 1}` },
				],
			},
		},
	},
	label: {
		type: String,
		default: 'Options',
		_edit: { description: 'Trigger button label (overridden by the #trigger slot if used).' },
	},
	align: {
		type: String,
		default: 'left',
		_edit: {
			options: ['left', 'right'],
			description: 'Where the menu opens relative to the trigger.',
		},
	},
	placement: {
		type: String,
		default: 'bottom',
		_edit: {
			options: ['bottom', 'top', 'right', 'left'],
			description: 'Preferred side before collision handling.',
		},
	},
	collisionPadding: {
		type: Number,
		default: 8,
		_edit: { description: 'Viewport padding used when the menu flips or shifts.' },
	},
	floatingMode: {
		type: String,
		default: 'viewport',
		_edit: { options: ['viewport', 'anchor'], description: 'viewport keeps the menu inside the browser; anchor keeps it attached while scrolling.' },
	},
	lockScroll: {
		type: Boolean,
		default: false,
		_edit: { description: 'Lock browser scrolling while the dropdown is open.' },
	},
	width: {
		type: String,
		default: 'min-w-[12rem]',
		_edit: { description: 'Tailwind width utility for the menu (e.g. min-w-[16rem]).' },
	},
	panelType: {
		type: String,
		default: 'menu',
		_edit: {
			options: ['menu', 'tree', 'dialog', 'listbox', 'grid'],
			description: 'Accessible popup type. Use tree/dialog/etc when rendering the #panel slot.',
		},
	},
	autoFocusPanel: {
		type: Boolean,
		default: true,
		_edit: { description: 'Focus the first focusable element when opening a custom panel.' },
	},
	focusValue: {
		type: [String, Number],
		default: null,
		_edit: { description: 'Menu item value to prefer when opening from the keyboard.' },
	},
	disabled: {
		type: Boolean,
		default: false,
		_edit: { description: 'Disable the trigger and prevent the dropdown from opening.' },
	},
	triggerClass: {
		type: [String, Array, Object],
		default: null,
		_edit: { description: 'Override the trigger button classes when composing dropdowns into toolbars or compact controls.' },
	},
	showIndicator: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the chevron indicator in the trigger.' },
	},
});
const emit = defineEmits(['select']);

const root = ref(null);
const isMounted = ref(false);
const teleportTarget = shallowRef(null);
const slots = useSlots();
const hasDefaultPanel = computed(() => Boolean(slots.default && !slots.panel));
const hasCustomPanel = computed(() => Boolean(slots.panel || slots.default));

onMounted(async () => {
	teleportTarget.value = resolveFloatingTeleportTarget(root.value);
	isMounted.value = true;
	await nextTick();
	await import('../../lib/headless/dropdown.js');
	root.value?.addEventListener('dom:select', (e) => emit('select', e.detail.value));
});

/**
 * Resolve the visible label for a dropdown item.
 *
 * @param {string|number|Record<string, unknown>} item Dropdown item definition.
 * @returns {unknown} Item label, value fallback, or primitive item.
 */
function labelOf(item) {
	return item && typeof item === 'object' ? (item.label ?? item.value) : item;
}

/**
 * Resolve the submitted value for a dropdown item.
 *
 * @param {string|number|Record<string, unknown>} item Dropdown item definition.
 * @returns {unknown} Item value, label fallback, or primitive item.
 */
function valueOf(item) {
	return item && typeof item === 'object' ? (item.value ?? item.label) : item;
}

/**
 * Open the dropdown panel programmatically.
 *
 * @returns {void}
 */
function open() {
	if (root.value) root.value.open = true;
}

/**
 * Close the dropdown panel programmatically.
 *
 * @returns {void}
 */
function close() {
	if (root.value) root.value.open = false;
}

/**
 * Toggle the dropdown panel programmatically.
 *
 * @returns {void}
 */
function toggle() {
	root.value?.toggle?.();
}

/**
 * Forward custom panel selections and close one-shot menu rows.
 *
 * @param {CustomEvent<{ value?: string, item?: Element }>} event Selection event from nested menu primitives.
 * @returns {void}
 */
function onPanelDomSelect(event) {
	if (!slots.default) return;
	emit('select', event.detail?.value);
	const role = event.detail?.item?.getAttribute?.('role');
	if (role === 'menuitemcheckbox' || role === 'menuitemradio') return;
	close();
}

defineExpose({
	open,
	close,
	toggle,
});
</script>

<template>
	<dom-dropdown
		ref="root"
		:data-menu-id="menuId"
		:align="align"
		:offset="4"
		:placement="placement"
		:collision-padding="collisionPadding"
		:floating-mode="floatingMode"
		:lock-scroll="lockScroll ? '' : null"
		class="relative inline-block"
	>
		<button
			slot="trigger"
			type="button"
			:disabled="disabled || null"
			:class="triggerClass || 'skin-control inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition hover:brightness-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-50'"
		>
			<slot name="trigger">{{ label }}</slot>
			<svg v-if="showIndicator" viewBox="0 0 20 20" class="size-4 opacity-70" fill="none">
				<path d="M6 8l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>
		<Teleport :to="teleportTarget || 'body'" :disabled="!isMounted || !teleportTarget">
			<div
				:id="menuId"
				popover="manual"
				class="dom-dropdown-menu dom-floating-transition"
				:class="[width, hasDefaultPanel ? '' : 'skin-popover rounded-2xl p-1']"
				:data-composite-panel="hasCustomPanel ? 'true' : null"
				:data-haspopup="hasCustomPanel ? panelType : null"
				:data-autofocus-panel="autoFocusPanel ? null : 'false'"
				:data-focus-value="focusValue === null || focusValue === undefined || focusValue === '' ? null : String(focusValue)"
				@dom:select="onPanelDomSelect"
			>
				<slot v-if="$slots.panel" name="panel" :close="close" :open="open" :toggle="toggle" />
				<slot v-else-if="$slots.default" :close="close" :open="open" :toggle="toggle" />
				<template v-else>
					<template v-for="(item, i) in items" :key="valueOf(item) ?? i">
						<hr v-if="item && item.separator" class="my-1 border-t border-border" />
						<button
							v-else
							role="menuitem"
							:data-value="valueOf(item)"
							class="block w-full rounded-xl px-3 py-2 text-left text-sm outline-none transition hover:bg-accent focus:bg-accent"
						>
							<slot name="item" :item="item" :index="i">{{ labelOf(item) }}</slot>
						</button>
					</template>
				</template>
			</div>
		</Teleport>
	</dom-dropdown>
</template>
