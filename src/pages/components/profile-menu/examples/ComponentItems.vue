<script setup>
import { ref } from 'vue';
import { DomProfileMenu } from '@getdom/studio/vue';
import ProfileMenuDefaultRow from './ProfileMenuDefaultRow.vue';
import ProfileMenuUsageRow from './ProfileMenuUsageRow.vue';

const selected = ref('none');
const themeMode = ref('stored preference');

const rowComponents = {
	default: ProfileMenuDefaultRow,
	usage: ProfileMenuUsageRow,
};

const items = [
	{ value: 'profile', label: 'Profile', description: 'Name, email, and avatar', icon: 'profile', href: '#profile', accessorySlot: 'theme-switcher' },
	{ value: 'usage', label: 'Plan usage', description: '8.2k of 10k events this month', percent: 82, componentName: 'usage' },
	{ value: 'billing', label: 'Billing', description: 'Invoices, seats, and payment method', icon: 'billing', href: '#billing' },
	{
		value: 'onboarding',
		label: 'Onboarding',
		description: 'Resume setup checklist',
		icon: 'onboarding',
		children: [
			{ value: 'add-website', label: 'Add website', type: 'task', href: '#add-website', completed: true },
			{ value: 'audience-competitors', label: 'Audience and competitors', type: 'task', href: '#audience-competitors', completed: false },
		],
	},
	{ separator: true },
	{ value: 'logout', label: 'Log out', description: 'End the current session', icon: 'logout', tone: 'danger' },
];

function componentFor(item) {
	return item.component || rowComponents[item.componentName] || rowComponents.default;
}
</script>

<template>
	<div class="grid gap-3">
		<DomProfileMenu
			name="Mina Patel"
			email="mina@northstar.app"
			initials="MP"
			:items="items"
			@select="selected = $event.value"
			@theme="themeMode = $event.mode"
		>
			<template #item="{ item, label, value }">
				<component :is="componentFor(item)" :item="item" :label="label" :value="value" />
			</template>
		</DomProfileMenu>

		<p class="text-xs text-muted-fg">
			Selected: <code class="text-canvas-fg">{{ selected }}</code>
			<span class="px-1 text-border">/</span>
			Theme: <code class="text-canvas-fg">{{ themeMode }}</code>
		</p>
	</div>
</template>
