<script setup>
import { computed, ref } from 'vue';
import DomDropdown from '../dropdown/DomDropdown.vue';
import DomMenu from '../menu/DomMenu.vue';
import DomMenuItem from '../menu/DomMenuItem.vue';
import DomMenuLabel from '../menu/DomMenuLabel.vue';
import DomMenuSeparator from '../menu/DomMenuSeparator.vue';
import DomAvatar from '../../visual/avatar/DomAvatar.vue';
import DomThemeSwitcher from '../theme-switcher/DomThemeSwitcher.vue';
import DomProfileMenuItemContent from './DomProfileMenuItemContent.vue';

defineOptions({
	__doc: {
		name: 'Profile menu',
		tag: '<DomProfileMenu>',
		description: 'A signed-in account trigger with avatar, email, and app profile actions.',
		playground: {
			initial: {
				name: 'Mina Patel',
				email: 'mina@northstar.app',
				initials: 'MP',
				showName: false,
			},
		},
		slots: [
			{ name: 'trigger', payload: '{ name, email, initials }', description: 'Replace the avatar and identity text inside the dropdown trigger.' },
			{ name: 'item', payload: '{ item, label, value }', description: 'Replace the markup for selectable data-driven menu items. Useful for resolving item.component or item.componentName to a custom row component.' },
			{ name: 'item-label', payload: '{ item, label, value }', description: 'Replace the markup for non-selectable data-driven label/static rows.' },
		],
		events: [
			{ name: 'select', payload: '({ value, item })', description: 'Fired when an action item is chosen.' },
			{ name: 'change', payload: '({ value, checked, item })', description: 'Fired when a checkbox or radio menu item changes.' },
			{ name: 'update:themeMode', payload: '(mode: "dark" | "light" | "system")', description: 'Fired when the embedded theme switcher changes.' },
			{ name: 'profile', payload: '({ value, item })', description: 'Fired when the profile action is chosen.' },
			{ name: 'onboarding', payload: '({ value, item })', description: 'Fired when the onboarding action is chosen.' },
			{ name: 'theme', payload: '({ value, item, mode })', description: 'Fired when the theme mode changes, or when a plain theme item is chosen.' },
			{ name: 'logout', payload: '({ value, item })', description: 'Fired when the logout action is chosen.' },
		],
	},
});

const profileItem = { value: 'profile', label: 'Profile', description: 'Account details and preferences', icon: 'profile', href: '#profile' };
const onboardingItem = { value: 'onboarding', label: 'Onboarding', description: 'Resume setup checklist', icon: 'onboarding' };
const logoutItem = { value: 'logout', label: 'Log out', description: 'End the current session', icon: 'logout', tone: 'danger' };
const onboardingTaskItems = [
	{ value: 'add-website', label: 'Add website', type: 'task', href: '#add-website', completed: true },
	{ value: 'audience-competitors', label: 'Audience and competitors', type: 'task', href: '#audience-competitors', completed: false },
	{ value: 'integrate-blog', label: 'Integrate blog', type: 'task', href: '#integrate-blog', completed: false },
	{ value: 'connect-search-console', label: 'Connect Google search console', type: 'task', href: '#connect-search-console', completed: false },
];

const iconPaths = {
	profile: [
		'M20 21a8 8 0 0 0-16 0',
		'M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
	],
	onboarding: [
		'M9 11l3 3L22 4',
		'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
	],
	theme: [
		'M12 3a9 9 0 1 0 9 9 6 6 0 0 1-9-9z',
	],
	logout: [
		'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4',
		'M16 17l5-5-5-5',
		'M21 12H9',
	],
};

const props = defineProps({
	name: {
		type: String,
		default: '',
		_edit: { description: 'User display name used for avatar fallback and optional trigger text.' },
	},
	email: {
		type: String,
		default: '',
		_edit: { description: 'Signed-in email shown in the trigger by default.' },
	},
	avatar: {
		type: String,
		default: '',
		_edit: { description: 'Avatar image URL.' },
	},
	initials: {
		type: String,
		default: '',
		_edit: { description: 'Explicit initials for the avatar fallback.' },
	},
	triggerLabel: {
		type: String,
		default: '',
		_edit: { description: 'Fallback trigger text when no email or name is available.' },
	},
	showName: {
		type: Boolean,
		default: false,
		_edit: { description: 'Show the name in the trigger. When email is also shown, it appears as secondary text.' },
	},
	showEmail: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the email address in the trigger.' },
	},
	avatarSize: {
		type: String,
		default: 'sm',
		_edit: { options: ['xs', 'sm', 'md'], description: 'Avatar size inside the trigger.' },
	},
	themeMode: {
		type: String,
		default: null,
		_edit: { options: ['dark', 'light', 'system'], description: 'Optional controlled theme mode for the embedded theme switcher. Omit it to use the stored DOM Studio preference.' },
	},
	themeControl: {
		type: Boolean,
		default: true,
		_edit: { description: 'Render a segmented dark / light / system control as a profile row accessory.' },
	},
	items: {
		type: Array,
		default: null,
		_edit: {
			component: 'DomJsonListInput',
			description: 'Optional data-driven menu rows. Use separator: true, type: "label" for static rows, children for submenus, shortcut for right-side commands, accessorySlot for custom right-side content, and componentName as a marker for the #item slot.',
			props: {
				compact: true,
				addLabel: '+ Add action',
				schema: [
					{ key: 'label', label: 'Label', placeholder: 'Profile', default: (index) => ['Profile', 'Onboarding', 'Log out'][index] || `Action ${index + 1}` },
					{ key: 'value', label: 'Value', placeholder: 'profile', default: (index) => ['profile', 'onboarding', 'logout'][index] || `action-${index + 1}` },
					{ key: 'href', label: 'Href', placeholder: '/settings/profile' },
					{ key: 'description', label: 'Description', placeholder: 'Account details and preferences' },
					{ key: 'icon', label: 'Icon', placeholder: 'profile' },
					{ key: 'shortcut', label: 'Shortcut', placeholder: '⌘K' },
					{ key: 'accessorySlot', label: 'Accessory slot', placeholder: 'theme-switcher' },
					{ key: 'componentName', label: 'Component', placeholder: 'usage' },
					{ key: 'type', label: 'Type', placeholder: 'label' },
					{ key: 'tone', label: 'Tone', placeholder: 'danger' },
				],
			},
		},
	},
	align: {
		type: String,
		default: 'right',
		_edit: { options: ['left', 'right'], description: 'Where the menu opens relative to the trigger.' },
	},
	placement: {
		type: String,
		default: 'bottom',
		_edit: { options: ['bottom', 'top', 'right', 'left'], description: 'Preferred side before collision handling.' },
	},
	width: {
		type: String,
		default: 'min-w-[18rem]',
		_edit: { description: 'Tailwind width utility for the dropdown panel.' },
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
});

const emit = defineEmits(['select', 'change', 'update:themeMode', 'profile', 'onboarding', 'theme', 'logout']);
const dropdown = ref(null);
const actionEvents = new Set(['profile', 'onboarding', 'theme', 'logout']);

const hasCustomItems = computed(() => Array.isArray(props.items) && props.items.length > 0);
const accountSummary = computed(() => props.email || props.name || '');
const defaultMenuItems = computed(() => cleanSeparators([
	...(accountSummary.value ? [{ type: 'label', value: 'account-summary', label: 'Logged in as', description: accountSummary.value }, { separator: true }] : []),
	profileItem,
	{ ...onboardingItem, children: onboardingTaskItems },
	{ separator: true },
	logoutItem,
]));
const panelItems = computed(() => {
	if (!Array.isArray(props.items)) return [];
	return cleanSeparators(props.items.map((item) => normalizeMenuItem(item)).filter(Boolean));
});
const activeMenuItems = computed(() => hasCustomItems.value ? panelItems.value : defaultMenuItems.value);

const avatarName = computed(() => props.name || props.email || props.triggerLabel || 'Account');
const triggerPrimary = computed(() => {
	if (props.showName && props.name) return props.name;
	if (props.showEmail && props.email) return props.email;
	return props.triggerLabel || props.email || props.name || 'Account';
});
const triggerSecondary = computed(() => {
	if (!props.showName || !props.showEmail || !props.name || !props.email) return '';
	return props.email;
});

function labelOf(item) {
	if (item && typeof item === 'object') return item.label ?? item.value;
	return item;
}

function itemValueOf(item) {
	if (item && typeof item === 'object') return item.value ?? item.label;
	return item;
}

function isSeparator(item) {
	return Boolean(item && typeof item === 'object' && item.separator);
}

function isThemeItem(item) {
	return props.themeControl && String(itemValueOf(item)) === 'theme';
}

function normalizeMenuItem(item) {
	if (isSeparator(item)) return item;
	if (!item || typeof item !== 'object') return item;

	const value = String(itemValueOf(item));
	const next = { ...item };
	if (props.themeControl && value === 'theme') next.accessorySlot = next.accessorySlot || 'theme-switcher';
	if (Array.isArray(next.children) && next.children.length) {
		next.children = cleanSeparators(next.children.map((child) => normalizeMenuItem(child)).filter(Boolean));
	}
	return next;
}

function cleanSeparators(items) {
	return items.reduce((result, item) => {
		if (!isSeparator(item)) return [...result, item];
		if (!result.length || isSeparator(result[result.length - 1])) return result;
		return [...result, item];
	}, []).filter((item, index, list) => !isSeparator(item) || index < list.length - 1);
}

function itemForValue(value, items = activeMenuItems.value) {
	for (const item of items) {
		if (isSeparator(item)) continue;
		if (String(itemValueOf(item)) === String(value)) return item;
		if (Array.isArray(item?.children)) {
			const child = itemForValue(value, item.children);
			if (child) return child;
		}
	}
	return null;
}

function itemFromMenuEvent(event) {
	if (event.item && !event.item.nodeType) return event.item;
	return itemForValue(event.value);
}

function iconFor(item) {
	if (!item || typeof item !== 'object') return [];
	return iconPaths[item.icon || item.value] || [];
}

function onThemeModeUpdate(mode) {
	emit('update:themeMode', mode);
}

function onThemeChange(event) {
	const item = itemForValue('theme') || itemForValue('profile');
	emit('theme', { value: 'theme', item, mode: event.mode, theme: event.theme });
}

function onMenuChange(event) {
	const item = itemFromMenuEvent(event);
	const payload = { ...event, item };
	emit('change', payload);
}

function onMenuSelect(event) {
	const item = itemFromMenuEvent(event);
	if (isThemeItem(item)) return;
	emitSelection(event.value, item);
}

function emitSelection(value, item = itemForValue(value)) {
	const payload = { value, item };
	emit('select', payload);
	if (actionEvents.has(String(value))) emit(String(value), payload);
}

function open() {
	dropdown.value?.open?.();
}

function close() {
	dropdown.value?.close?.();
}

function toggle() {
	dropdown.value?.toggle?.();
}

defineExpose({
	open,
	close,
	toggle,
});
</script>

<template>
	<DomDropdown
		ref="dropdown"
		:items="panelItems"
		:align="align"
		:placement="placement"
		:collision-padding="collisionPadding"
		:floating-mode="floatingMode"
		:lock-scroll="lockScroll"
		:width="width"
		:auto-focus-panel="false"
		panel-type="dialog"
	>
		<template #trigger>
			<slot name="trigger" :name="name" :email="email" :initials="initials">
				<span class="flex min-w-0 items-center gap-2">
					<DomAvatar :src="avatar" :name="avatarName" :initials="initials" :alt="name ? `${name} avatar` : ''" :size="avatarSize" />
					<span class="grid min-w-0 text-left leading-tight">
						<span class="truncate" :class="triggerSecondary ? 'text-[13px] font-semibold' : 'text-sm'">{{ triggerPrimary }}</span>
						<span v-if="triggerSecondary" class="truncate text-xs font-normal text-muted-fg">{{ triggerSecondary }}</span>
					</span>
				</span>
			</slot>
		</template>

		<DomMenu v-if="hasCustomItems" :items="panelItems" @select="onMenuSelect" @change="onMenuChange">
			<template #item="{ item, label, value }">
				<slot name="item" :item="item" :label="label" :value="value">
					<DomProfileMenuItemContent :item="item" :label="label" :paths="iconFor(item)" />
				</slot>
			</template>

			<template #item-label="{ item, label, value }">
				<slot name="item-label" :item="item" :label="label" :value="value">
					<span class="block text-xs font-medium text-muted-fg">{{ label }}</span>
					<span v-if="item?.description" class="mt-0.5 block truncate text-sm font-medium text-canvas-fg">
						{{ item.description }}
					</span>
				</slot>
			</template>

			<template #theme-switcher>
				<DomThemeSwitcher
					:model-value="themeMode"
					:show-label="false"
					size="icon-sm"
					@update:model-value="onThemeModeUpdate"
					@change="onThemeChange"
				/>
			</template>
		</DomMenu>

		<DomMenu v-else @select="onMenuSelect" @change="onMenuChange">
			<DomMenuLabel v-if="accountSummary">
				<span class="block text-[11px] font-medium uppercase text-muted-fg">Logged in as</span>
				<span class="mt-0.5 block truncate text-sm font-medium text-canvas-fg">{{ accountSummary }}</span>
			</DomMenuLabel>
			<DomMenuSeparator v-if="accountSummary" />

			<DomMenuItem :value="profileItem.value" :href="profileItem.href">
				<DomProfileMenuItemContent :item="profileItem" :label="profileItem.label" :paths="iconFor(profileItem)" />
				<template v-if="themeControl" #accessory>
					<DomThemeSwitcher
						:model-value="themeMode"
						:show-label="false"
						size="icon-sm"
						@update:model-value="onThemeModeUpdate"
						@change="onThemeChange"
					/>
				</template>
			</DomMenuItem>

			<DomMenuItem :value="onboardingItem.value">
				<DomProfileMenuItemContent :item="onboardingItem" :label="onboardingItem.label" :paths="iconFor(onboardingItem)" />
				<template #submenu>
					<DomMenuItem
						v-for="task in onboardingTaskItems"
						:key="task.value"
						:value="task.value"
						:href="task.href"
					>
						<DomProfileMenuItemContent :item="task" :label="task.label" />
					</DomMenuItem>
				</template>
			</DomMenuItem>

			<DomMenuSeparator />

			<DomMenuItem :value="logoutItem.value" :tone="logoutItem.tone">
				<DomProfileMenuItemContent :item="logoutItem" :label="logoutItem.label" :paths="iconFor(logoutItem)" />
			</DomMenuItem>
		</DomMenu>
	</DomDropdown>
</template>
