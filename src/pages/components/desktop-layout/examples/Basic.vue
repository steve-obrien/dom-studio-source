<script setup>
import { ref } from 'vue';
import { DomDesktopLayout } from '@getdom/studio/vue';

const active = ref('inbox');
const apps = [
	{ id: 'inbox', label: 'Inbox', icon: 'M4 5h16v14H4zM4 13h5l2 3h2l2-3h5', items: [{ id: 'unread', label: 'Unread messages' }] },
	{ id: 'files', label: 'Files', icon: 'M3 6h7l2 2h9v12H3z' },
];
const view = ref('All messages');
const sidebarSize = ref(256);

/**
 * Apply a shortcut using application-owned view state.
 * @param {{ item: { label: string } }} selection Selected shortcut.
 * @returns {void}
 */
function navigate({ item }) {
	view.value = item.label;
}
</script>

<template>
	<DomDesktopLayout v-model="active" v-model:sidebar-size="sidebarSize" :apps="apps" height="30rem" @shortcut="navigate">
		<template #sidebar="{ app }"><div class="p-5"><h2 class="text-sm font-medium">{{ app?.label }}</h2><p class="mt-4 text-xs text-muted-fg">App-owned navigation</p></div></template>
		<template #default="{ app }"><div class="p-8"><h1 class="text-xl font-medium">{{ app?.label }}</h1><p class="mt-3 text-sm text-muted-fg">{{ active === 'inbox' ? view : 'Your files' }}</p></div></template>
	</DomDesktopLayout>
</template>
