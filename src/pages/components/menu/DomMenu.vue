<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { provideMenuContext, useParentMenuContext } from './menuContext.js';
import { positionSubmenuPanel } from './menuPlacement.js';
import {
	createSubmenuCloseTimer,
	focusFirstMenuItem,
	isLeavingSubmenu,
	isSubmenuCloseKey,
	isSubmenuOpenKey,
	submenuOptions,
} from './submenu.js';

defineOptions({
	__doc: {
		name: 'Menu',
		tag: '<DomMenu>',
		description: 'A roving-focus action menu for command lists, settings menus, and static menu panels.',
		slots: [
			{ name: '(default)', description: 'Custom <MenuItem> rows when you want markup-driven menus instead of the items prop.' },
			{ name: 'item', payload: '{ item, index, value, label, checked, open, hasChildren }', description: 'Custom label/body content inside the default menu row.' },
			{ name: 'item-accessory', payload: '{ item, index, value, label, checked, open, hasChildren }', description: 'Custom right-side content for rows that expose shortcuts, children, checks, or accessorySlot.' },
			{ name: 'item-row', payload: '{ item, index, value, label, checked, open, hasChildren }', description: 'Replace the full inner row markup while DomMenu keeps the interactive wrapper.' },
			{ name: 'item-label', payload: '{ item, index, value, label }', description: 'Replace the markup for non-selectable label/static rows.' },
			{ name: 'item.slot', payload: '{ item, index, value, label, checked, open, hasChildren }', description: 'Set item.slot to a named slot for per-item row markup.' },
			{ name: 'item.accessorySlot', payload: '{ item, index, value, label, checked, open, hasChildren }', description: 'Set item.accessorySlot to a named slot for per-item right-side accessory content.' },
		],
		events: [
			{ name: 'select', payload: '({ value, item })', description: 'Fired when an item is selected.' },
			{ name: 'change', payload: '({ value, checked, item })', description: 'Fired when a checkbox or radio item changes.' },
		],
	},
});

const props = defineProps({
	items: {
		type: Array,
		default: null,
		_edit: { component: 'DomJsonListInput', description: 'Menu rows. Use separator: true for dividers.', props: { compact: true } },
	},
	orientation: {
		type: String,
		default: 'vertical',
		_edit: { options: ['vertical', 'horizontal'], description: 'Arrow key direction.' },
	},
	skin: {
		type: Boolean,
		default: true,
		_edit: { description: 'Render menu with the floating skin. Disable when embedding inside a popover or dropdown.' },
	},
});
const emit = defineEmits(['select', 'change']);
const root = ref(null);
const openPath = ref('');
const submenuPanel = ref(null);
const submenuTrigger = ref(null);
const parentMenu = useParentMenuContext();
const hasItemPropRows = computed(() => Array.isArray(props.items) && props.items.length > 0);
let parentPopover = null;
let parentPopoverToggleOff = null;
const closeTimer = createSubmenuCloseTimer((value, focusBack = false) => closeSubmenu(value, focusBack));

provideMenuContext({
	select(event) {
		emit('select', event);
		parentMenu?.select?.(event);
	},
	change(event) {
		emit('change', event);
		parentMenu?.change?.(event);
	},
});

onMounted(async () => {
	await import('../../lib/headless/menu.js');
	root.value?.addEventListener('dom:select', (event) => emitSelect({
		value: event.detail.value,
		item: itemForValue(event.detail.value) || event.detail.item,
	}));
	root.value?.addEventListener('dom:change', (event) => emitChange({
		value: event.detail.value,
		checked: event.detail.checked,
		item: itemForValue(event.detail.value) || event.detail.item,
	}));
	root.value?.addEventListener('dom:submenu', (event) => {
		if (!hasItemPropRows.value) return;
		openSubmenu(event.detail.value, event.detail.item, true);
	});
	parentPopover = root.value?.closest?.('[popover]');
	if (parentPopover) {
		parentPopoverToggleOff = (event) => {
			if (event.newState === 'closed') closeActiveSubmenu(false);
		};
		parentPopover.addEventListener('toggle', parentPopoverToggleOff);
	}
});

const labelOf = (item) => (item && typeof item === 'object' ? (item.label ?? item.value) : item);
const valueOf = (item) => String(item && typeof item === 'object' ? (item.value ?? item.label) : item);
const hasChildren = (item) => Array.isArray(item?.children) && item.children.length > 0;
const isCheckable = (item) => item?.type === 'checkbox' || item?.type === 'radio';
const isStaticItem = (item) => item?.type === 'label' || item?.type === 'static' || item?.static === true || item?.selectable === false;
const hasCheckAccessory = (item) => isCheckable(item) && item?.checkPlacement !== 'start';
const hasCustomAccessory = (item) => Boolean(item?.accessorySlot || item?.accessory);
const hasAccessory = (item) => hasCustomAccessory(item) || hasChildren(item) || hasCheckAccessory(item) || Boolean(item?.shortcut);
const itemTag = (item) => item?.as || (item?.href ? 'a' : 'button');
const slotNameOf = (item) => item?.slot || 'item-row';
const accessorySlotNameOf = (item) => item?.accessorySlot || item?.accessory || 'item-accessory';
const slotProps = (item, index) => {
	const value = valueOf(item);
	return {
		item,
		index,
		value,
		label: labelOf(item),
		checked: Boolean(item?.checked),
		open: openPath.value === value,
		hasChildren: hasChildren(item),
	};
};
const roleOf = (item) => {
	if (hasChildren(item)) return 'menuitem';
	if (item?.type === 'checkbox') return 'menuitemcheckbox';
	if (item?.type === 'radio') return 'menuitemradio';
	return 'menuitem';
};

function itemForValue(value) {
	return props.items?.find?.((item) => valueOf(item) === value) || null;
}

function emitSelect(event) {
	emit('select', event);
	parentMenu?.select?.(event);
}

function emitChange(event) {
	emit('change', event);
	parentMenu?.change?.(event);
}

function activeChildItems() {
	return props.items?.find?.((item) => valueOf(item) === openPath.value)?.children || [];
}

function placeSubmenu() {
	if (!submenuPanel.value || !submenuTrigger.value) return;
	positionSubmenuPanel(submenuPanel.value, submenuTrigger.value, submenuOptions());
}

function openSubmenu(value, trigger = null, focusFirst = false) {
	cancelSubmenuClose();
	openPath.value = value;
	if (trigger) submenuTrigger.value = trigger;
	nextTick(() => {
		if (!submenuTrigger.value) {
			submenuTrigger.value = root.value?.querySelector(`[data-value="${CSS.escape(value)}"]`);
		}
		placeSubmenu();
		if (focusFirst) focusFirstMenuItem(submenuPanel.value);
	});
}

function closeSubmenu(value, focusBack = true) {
	closeTimer.cancel();
	if (openPath.value === value) openPath.value = '';
	if (focusBack) root.value?.querySelector(`[data-value="${CSS.escape(value)}"]`)?.focus();
}

function closeActiveSubmenu(focusBack = true) {
	if (!openPath.value) return;
	closeSubmenu(openPath.value, focusBack);
}

function cancelSubmenuClose() {
	closeTimer.cancel();
}

function scheduleCloseSubmenu(value, focusBack = false) {
	closeTimer.schedule(value, focusBack);
}

function maybeCloseSubmenu(event, value) {
	if (!isLeavingSubmenu(event, null, submenuPanel.value)) return;
	scheduleCloseSubmenu(value, false);
}

function maybeCloseSubmenuPanel(event) {
	if (!openPath.value) return;
	if (!isLeavingSubmenu(event, submenuTrigger.value, null)) return;
	scheduleCloseSubmenu(openPath.value, false);
}

function onItemKeydown(event, item) {
	if (!hasChildren(item)) return;
	const value = valueOf(item);
	if (isSubmenuOpenKey(event)) {
		event.preventDefault();
		openSubmenu(value, event.currentTarget, true);
	}
}

function onSubmenuKeydown(event, item) {
	if (!isSubmenuCloseKey(event)) return;
	event.preventDefault();
	closeSubmenu(valueOf(item));
}

function onSelect(event) {
	if (isCheckable(event.item)) return;
	openPath.value = '';
}

function onChange() {
	// Nested DomMenu instances propagate change through menuContext.
}

function onAccessoryKeydown(event) {
	if (event.key === 'Tab' || event.key === 'Escape') return;
	event.stopPropagation();
}

function setSubmenuPanel(element) {
	submenuPanel.value = element;
	if (!element) return;
	nextTick(placeSubmenu);
}

function focusableAttrs(item) {
	const tag = itemTag(item);
	return {
		type: tag === 'button' ? 'button' : null,
		href: tag === 'a' && !item?.disabled ? item?.href : null,
		tabindex: tag === 'a' && item?.disabled ? -1 : null,
	};
}

onBeforeUnmount(() => {
	closeTimer.cancel();
	parentPopover?.removeEventListener('toggle', parentPopoverToggleOff);
	closeActiveSubmenu(false);
});
</script>

<template>
	<dom-menu
		ref="root"
		:orientation="orientation"
		class="block w-full"
		:class="skin ? 'skin-popover rounded-2xl p-1' : ''"
	>
		<slot v-if="!hasItemPropRows" />
		<template v-for="(item, index) in items" v-else :key="valueOf(item) || index">
			<hr v-if="item && item.separator" class="my-1 border-t border-border" />
			<div
				v-else-if="isStaticItem(item)"
				role="presentation"
				class="rounded-xl px-3 py-2 text-sm text-muted-fg"
			>
				<slot :name="slotNameOf(item)" v-bind="slotProps(item, index)">
					<slot name="item-label" v-bind="slotProps(item, index)">
						<span class="block truncate text-xs font-medium text-muted-fg">{{ labelOf(item) }}</span>
						<span v-if="item?.description" class="mt-0.5 block truncate text-sm font-medium text-canvas-fg">
							{{ item.description }}
						</span>
					</slot>
				</slot>
			</div>
			<div
				v-else
				class="relative"
				@mouseenter="hasChildren(item) && openSubmenu(valueOf(item), $event.currentTarget.querySelector('[role=menuitem]'))"
				@mouseleave="hasChildren(item) && maybeCloseSubmenu($event, valueOf(item))"
			>
				<div
					v-if="hasCustomAccessory(item)"
					class="flex w-full items-center gap-2 rounded-xl transition hover:bg-secondary focus-within:bg-secondary"
				>
					<component
						:is="itemTag(item)"
						v-bind="focusableAttrs(item)"
						:role="roleOf(item)"
						:data-value="valueOf(item)"
						:aria-haspopup="hasChildren(item) ? 'menu' : null"
						:aria-expanded="hasChildren(item) ? String(openPath === valueOf(item)) : null"
						:aria-checked="item?.checked == null ? null : String(item.checked)"
						:aria-disabled="item?.disabled ? 'true' : null"
						:disabled="item?.disabled || null"
						class="group/menu-item flex min-w-0 flex-1 items-center gap-3 rounded-xl py-2 pl-3 pr-1 text-left text-sm text-canvas-fg outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 data-[tone=danger]:text-destructive"
						:data-tone="item?.tone || null"
						@keydown="onItemKeydown($event, item)"
					>
						<slot :name="slotNameOf(item)" v-bind="slotProps(item, index)">
							<span class="min-w-0">
								<slot name="item" v-bind="slotProps(item, index)">{{ labelOf(item) }}</slot>
							</span>
						</slot>
					</component>
					<span data-dom-menu-accessory class="mr-2 shrink-0" @pointerdown.stop @click.stop @keydown="onAccessoryKeydown">
						<slot :name="accessorySlotNameOf(item)" v-bind="slotProps(item, index)">
							<slot name="item-accessory" v-bind="slotProps(item, index)" />
						</slot>
					</span>
				</div>
				<component
					v-else
					:is="itemTag(item)"
					v-bind="focusableAttrs(item)"
					:role="roleOf(item)"
					:data-value="valueOf(item)"
					:aria-haspopup="hasChildren(item) ? 'menu' : null"
					:aria-expanded="hasChildren(item) ? String(openPath === valueOf(item)) : null"
					:aria-checked="item?.checked == null ? null : String(item.checked)"
					:aria-disabled="item?.disabled ? 'true' : null"
					:disabled="item?.disabled || null"
					class="group/menu-item flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm text-canvas-fg outline-none transition hover:bg-secondary focus:bg-secondary aria-disabled:cursor-not-allowed aria-disabled:opacity-50 data-[tone=danger]:text-destructive"
					:data-tone="item?.tone || null"
					@keydown="onItemKeydown($event, item)"
				>
					<slot :name="slotNameOf(item)" v-bind="slotProps(item, index)">
						<span class="min-w-0">
							<slot name="item" v-bind="slotProps(item, index)">{{ labelOf(item) }}</slot>
						</span>
						<span v-if="hasAccessory(item)" class="ml-auto flex shrink-0 items-center gap-2 text-xs text-muted-fg">
							<slot :name="accessorySlotNameOf(item)" v-bind="slotProps(item, index)">
								<slot name="item-accessory" v-bind="slotProps(item, index)">
									<span v-if="item?.shortcut">{{ item.shortcut }}</span>
									<span v-if="hasChildren(item)" aria-hidden="true">›</span>
									<span
										v-else-if="hasCheckAccessory(item)"
										aria-hidden="true"
										class="transition"
										:class="item?.checked ? 'opacity-100' : 'opacity-0'"
									>✓</span>
								</slot>
							</slot>
						</span>
					</slot>
				</component>
			</div>
		</template>
	</dom-menu>

	<div
		v-if="openPath"
		:ref="setSubmenuPanel"
		data-dom-menu-submenu-panel
		class="dom-popover-panel skin-popover absolute z-50 min-w-40 rounded-2xl p-1 outline-none"
		@keydown="onSubmenuKeydown($event, { value: openPath })"
		@mouseenter="cancelSubmenuClose"
		@mouseleave="maybeCloseSubmenuPanel"
	>
		<DomMenu :items="activeChildItems()" :skin="false" @select="onSelect" @change="onChange">
			<template v-for="(_, slotName) in $slots" #[slotName]="childSlotProps">
				<slot :name="slotName" v-bind="childSlotProps" />
			</template>
		</DomMenu>
	</div>
</template>
