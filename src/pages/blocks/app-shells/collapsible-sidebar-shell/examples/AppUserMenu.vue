<script setup>
import { computed } from 'vue';
import { DomProfileMenu } from '@getdom/studio/vue';

const props = defineProps({
	layout: {
		type: String,
		default: 'sidebar',
		validator: (value) => ['sidebar', 'header'].includes(value),
	},
	collapsed: {
		type: Boolean,
		default: false,
	},
	label: {
		type: String,
		default: 'Open user menu',
	},
});

const profileMenuItems = [
	{
		type: 'label',
		value: 'signed-in-as',
		label: 'Logged in as',
		description: 'steve@example.com',
	},
	{ separator: true },
	{
		value: 'profile',
		label: 'Profile',
		description: 'Account details and preferences',
		icon: 'profile',
		href: '#profile',
		accessorySlot: 'theme-switcher',
	},
	{
		value: 'organisation',
		label: 'Organisation',
		description: 'People, roles, and workspace access',
		icon: 'profile',
		href: '#organisation',
	},
	{
		value: 'onboarding',
		label: 'Workspace setup',
		description: 'Review the remaining setup tasks',
		icon: 'onboarding',
		children: [
			{ value: 'website', label: 'Connect website', type: 'task', completed: true, href: '#website' },
			{ value: 'publishing', label: 'Configure publishing', type: 'task', completed: true, href: '#publishing' },
			{ value: 'search-console', label: 'Connect Search Console', type: 'task', completed: false, href: '#search-console' },
		],
	},
	{ separator: true },
	{
		value: 'logout',
		label: 'Log out',
		description: 'End the current session',
		icon: 'logout',
		tone: 'danger',
	},
];

const headerLayout = computed(() => props.layout === 'header');
const profileMenuClass = computed(() => [
	'block',
	'[&>button]:rounded-xl [&>button]:bg-transparent [&>button]:shadow-none [&>button]:hover:bg-canvas/70',
	headerLayout.value
		? 'w-auto [&>button]:size-10 [&>button]:justify-center [&>button]:px-0 [&>button>span>span:nth-child(2)]:sr-only [&>button>svg]:hidden'
		: props.collapsed
			? 'w-full [&>button]:w-full [&>button]:justify-center [&>button]:px-0 [&>button>span>span:nth-child(2)]:sr-only [&>button>svg]:hidden'
			: 'w-full [&>button]:w-full [&>button]:justify-start [&>button]:px-2 [&>button>span]:flex-1',
]);
</script>

<template>
	<DomProfileMenu
		name="Steve O’Brien"
		email="steve@example.com"
		initials="SO"
		:show-name="!headerLayout && !collapsed"
		:show-email="!headerLayout && !collapsed"
		:trigger-label="label"
		:items="profileMenuItems"
		:class="profileMenuClass"
		:placement="headerLayout ? 'bottom' : 'top'"
		:align="headerLayout ? 'right' : 'left'"
		width="min-w-[19rem]"
	/>
</template>
