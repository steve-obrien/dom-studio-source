<script setup>
import { ref } from 'vue';
import { DomProfileMenu } from '@getdom/studio/vue';

const selected = ref('none');
const themeMode = ref('stored preference');

const items = [
	{ type: 'label', value: 'signed-in-as', label: 'Logged in as', description: 'alex@example.com' },
	{ separator: true },
	{ value: 'profile', label: 'Profile', description: 'Account details and preferences', icon: 'profile', href: '#profile', accessorySlot: 'theme-switcher' },
	{
		value: 'onboarding',
		label: 'Onboarding',
		description: 'Resume setup checklist',
		icon: 'onboarding',
		children: [
			{ value: 'add-website', label: 'Add website', type: 'task', href: '#add-website', completed: true },
			{ value: 'audience-competitors', label: 'Audience and competitors', type: 'task', href: '#audience-competitors', completed: false },
			{ value: 'integrate-blog', label: 'Integrate blog', type: 'task', href: '#integrate-blog', completed: false },
			{ value: 'connect-search-console', label: 'Connect Google search console', type: 'task', href: '#connect-search-console', completed: false },
		],
	},
	{ separator: true },
	{ value: 'logout', label: 'Log out', description: 'End the current session', icon: 'logout', tone: 'danger' },
];
</script>

<template>
	<div class="grid gap-3">
		<DomProfileMenu
			name="Steven O'Brien"
			email="alex@example.com"
			initials="SO"
			:items="items"
			@select="selected = $event.value"
			@theme="themeMode = $event.mode"
		/>

		<p class="text-xs text-muted-fg">
			Selected: <code class="text-canvas-fg">{{ selected }}</code>
			<span class="px-1 text-border">/</span>
			Theme: <code class="text-canvas-fg">{{ themeMode }}</code>
		</p>
	</div>
</template>
