<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomDesktopLayout, DomDialog, DomDropdown, DomTextareaComposer } from '@getdom/studio/vue';

const organizations = [
	{ value: 'personal', label: 'Personal workspace', initials: 'SO', description: 'Your private workspace' },
	{ value: 'studio', label: 'DOM Studio', initials: 'DS', description: 'Product and design team' },
	{ value: 'northstar', label: 'Northstar', initials: 'NS', description: 'Client workspace' },
];
const organizationId = ref('personal');
const organization = computed(() => organizations.find(item => item.value === organizationId.value));

const catalog = [
	{ id: 'assistant', label: 'Assistant', icon: 'M4 5h16v12H9l-5 3V5Zm4 4h8M8 13h5', items: [{ id: 'new', label: 'New conversation' }, { id: 'layout', label: 'Build an app layout' }] },
	{ id: 'space', label: 'Space', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', items: [{ id: 'all', label: 'All pages' }, { id: 'favorites', label: 'Favorites' }] },
	{ id: 'code', label: 'Code', icon: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18', items: [{ id: 'layout.vue', label: 'layout.vue' }, { id: 'README.md', label: 'README.md' }] },
	{ id: 'calendar', label: 'Calendar', icon: 'M4 5h16v15H4zM8 3v4m8-4v4M4 10h16', items: [] },
];
const installed = ref(['assistant', 'space', 'code']);
const pinned = ref(['assistant', 'space', 'code']);
const active = ref('assistant');
const apps = computed(() => pinned.value.map(id => catalog.find(app => app.id === id)));
const managerOpen = ref(false);
const sidebarPosition = ref('left');
const focused = ref(false);
const selected = ref('Build an app layout');
const draft = ref('');
const messages = ref([]);
const pageNames = ['Desktop workspace', 'Product roadmap', 'Design principles', 'Getting started'];
const favoritesOnly = ref(false);
const visiblePages = computed(() => favoritesOnly.value ? pageNames.slice(0, 1) : pageNames);
const currentPage = ref('');
const files = ['layout.vue', 'app-registry.ts', 'theme.css', 'README.md'];
const currentFile = ref('layout.vue');
const source = computed(() => currentFile.value === 'README.md' ? '# Desktop workspace\n\nOne shell. Many experiences.\n\nApps own their routes, content and state.\nThe host owns installation and pinned order.' : `<script setup>\nimport { DomDesktopLayout } from '@getdom/studio/vue';\n<\/script>\n\n<template>\n\t<DomDesktopLayout\n\t\tv-model="activeApp"\n\t\t:apps="pinnedApps"\n\t>\n\t\t<template #sidebar>Navigation</template>\n\t\t<Workspace />\n\t</DomDesktopLayout>\n</template>`);

/**
 * Switch the demo organization and clear transient content from its previous context.
 * Production hosts must authorize membership and load organization-scoped data.
 * @param {string} id Selected organization identifier.
 * @returns {void}
 */
function switchOrganization(id) {
	if (!organizations.some(item => item.value === id) || id === organizationId.value) return;
	organizationId.value = id;
	messages.value = [];
	draft.value = '';
	currentPage.value = '';
	selected.value = 'New conversation';
}

/**
 * Apply a shortcut to the selected app's local navigation state.
 * @param {{ appId: string, item: { id: string, label: string } }} selection Selected shortcut.
 * @returns {void}
 */
function shortcut({ appId, item }) {
	if (appId === 'assistant') { selected.value = item.id === 'new' ? 'New conversation' : item.label; messages.value = []; }
	if (appId === 'space') { favoritesOnly.value = item.id === 'favorites'; currentPage.value = ''; }
	if (appId === 'code') currentFile.value = item.id;
}
/**
 * Install a demo app and pin its workspace for this preview session.
 * @param {string} id Catalog application identifier.
 * @returns {void}
 */
function install(id) {
	installed.value.push(id);
	pinned.value.push(id);
}
/**
 * Toggle a pin and reconcile the selected workspace with the visible rail.
 * @param {string} id Installed application identifier.
 * @returns {void}
 */
function togglePin(id) {
	if (pinned.value.includes(id)) pinned.value = pinned.value.filter(value => value !== id);
	else pinned.value.push(id);
	if (!pinned.value.includes(active.value)) active.value = pinned.value[0] || '';
}
/**
 * Remove a demo installation and reconcile its pin and selected workspace.
 * @param {string} id Installed application identifier.
 * @returns {void}
 */
function uninstall(id) {
	installed.value = installed.value.filter(value => value !== id);
	pinned.value = pinned.value.filter(value => value !== id);
	if (active.value === id) active.value = pinned.value[0] || '';
}
/**
 * Move a pinned app one position earlier without changing installed records.
 * @param {string} id Pinned application identifier.
 * @returns {void}
 */
function moveUp(id) {
	const index = pinned.value.indexOf(id);
	if (index <= 0) return;
	const next = [...pinned.value];
	[next[index - 1], next[index]] = [next[index], next[index - 1]];
	pinned.value = next;
}
/**
 * Append a local preview reply without calling an AI provider.
 * @param {string} value Submitted composer text.
 * @returns {void}
 */
function send(value) {
	if (!value.trim()) return;
	messages.value.push({ role: 'You', text: value }, { role: 'Assistant', text: 'Start with the app rail, then give each app its own navigation and stage. Use the focus control when the work needs more room. This is a local demo reply.' });
	draft.value = '';
}
/**
 * Start a fresh local conversation while preserving the selected app.
 * @returns {void}
 */
function newConversation() {
	selected.value = 'New conversation';
	messages.value = [];
}
</script>

<template>
	<DomDesktopLayout v-model="active" :apps="apps" :sidebar-position="sidebarPosition" :show-sidebar="!focused && !!active && active !== 'calendar'" @shortcut="shortcut" @manage-apps="managerOpen = true">
		<template #titlebar>
			<div class="flex h-10 items-center gap-1 sm:gap-3 border-b border-desktop-divider bg-desktop-rail px-2 sm:px-4 text-xs text-muted-fg">
				<DomDropdown :items="organizations" :focus-value="organizationId" :label="`Switch organization: ${organization.label}`" width="w-64" trigger-class="inline-flex h-8 max-w-48 min-w-0 items-center gap-2 rounded-md px-2 text-xs hover:bg-desktop-selection focus-visible:outline-2 focus-visible:outline-ring" @select="switchOrganization">
					<template #trigger><span class="grid size-5 shrink-0 place-items-center rounded bg-desktop-selection text-[10px] font-medium" aria-hidden="true">{{ organization.initials }}</span><span class="truncate">{{ organization.label }}</span></template>
					<template #item="{ item }"><span class="flex w-full items-center gap-3"><span class="grid size-8 shrink-0 place-items-center rounded-lg bg-desktop-selection text-xs" aria-hidden="true">{{ item.initials }}</span><span class="min-w-0 flex-1"><span class="block font-medium">{{ item.label }}</span><span class="block text-xs text-muted-fg">{{ item.description }}</span></span><span v-if="item.value === organizationId" class="text-xs text-muted-fg">Current</span></span></template>
				</DomDropdown>
				<div class="ml-auto flex gap-1">
					<DomButton variant="ghost" size="xs" @click="sidebarPosition = sidebarPosition === 'left' ? 'right' : 'left'">Sidebar: {{ sidebarPosition }}</DomButton>
					<DomButton variant="ghost" size="xs" :aria-pressed="focused" @click="focused = !focused">{{ focused ? 'Show navigation' : 'Focus' }}</DomButton>
				</div>
			</div>
		</template>
		<template #rail-footer><button type="button" aria-label="Workspace apps and settings" class="grid size-8 place-items-center rounded-full bg-accent text-xs font-medium" @click="managerOpen = true">SO</button></template>
		<template #sidebar="{ close }">
			<div class="flex min-h-full flex-col gap-6 p-4 text-sm">
				<div class="flex items-center justify-between"><h2 class="font-semibold">{{ catalog.find(app => app.id === active)?.label }}</h2><span class="text-muted-fg">⌘</span></div>
				<template v-if="active === 'assistant'">
					<DomButton variant="ghost" size="sm" class="justify-start" @click="newConversation(); close()">+ New conversation</DomButton>
					<div><p class="mb-2 text-xs text-muted-fg">Pinned</p><button type="button" class="w-full rounded-lg bg-desktop-selection px-3 py-2 text-left" @click="selected = 'Build an app layout'; close()">Build an app layout</button></div>
					<div><p class="mb-2 text-xs text-muted-fg">Projects</p><p class="px-3 py-2">DOM Studio</p><p class="px-3 py-2 text-muted-fg">{{ organization.label }}</p></div>
				</template>
				<template v-if="active === 'space'">
					<button type="button" class="rounded-lg px-3 py-2 text-left hover:bg-desktop-selection" :class="!favoritesOnly ? 'bg-desktop-selection' : ''" @click="favoritesOnly = false; currentPage = ''; close()">All pages</button>
					<button type="button" class="rounded-lg px-3 py-2 text-left hover:bg-desktop-selection" :class="favoritesOnly ? 'bg-desktop-selection' : ''" @click="favoritesOnly = true; currentPage = ''; close()">Favorites</button>
					<div><p class="mb-2 text-xs text-muted-fg">Recents</p><button v-for="page in pageNames" :key="page" type="button" class="w-full rounded-lg px-3 py-2 text-left hover:bg-desktop-selection" @click="currentPage = page; close()">{{ page }}</button></div>
				</template>
				<template v-if="active === 'code'"><p class="text-xs text-muted-fg">WORKSPACE</p><button v-for="file in files" :key="file" type="button" class="rounded-lg px-3 py-2 text-left font-mono text-xs hover:bg-desktop-selection" :class="file === currentFile ? 'bg-desktop-selection' : ''" @click="currentFile = file; close()">{{ file }}</button></template>
				<p class="mt-auto pt-8 text-xs text-muted-fg">Local demo · Your work stays here</p>
			</div>
		</template>
		<template v-if="active === 'assistant'">
			<div class="flex h-full min-h-0 flex-col">
				<header class="flex h-14 shrink-0 items-center border-b border-border/50 px-5 text-sm font-medium">{{ selected }}<span class="ml-auto text-xs font-normal text-muted-fg">Preview</span></header>
				<div class="min-h-0 flex-1 overflow-auto px-5 py-10">
					<div class="mx-auto max-w-2xl space-y-7">
						<div class="pt-10"><p class="mb-3 text-xs text-muted-fg">DOM STUDIO / ASSISTANT</p><h1 class="text-2xl font-medium tracking-tight">A little room to think.</h1><p class="mt-3 text-sm leading-7 text-muted-fg">Build a desktop workspace that feels quiet, focused, and entirely yours.</p></div>
						<div class="rounded-xl border border-border p-5 text-sm leading-7"><p class="font-medium">Let's give every app its own space.</p><p class="mt-2 text-muted-fg">Pinned apps live in the rail. Hover for shortcuts, select an app to open its workspace, and move or hide navigation to suit the task.</p></div>
						<div v-for="(message, index) in messages" :key="index" class="text-sm leading-7"><p class="mb-1 font-medium">{{ message.role }}</p><p class="whitespace-pre-wrap text-muted-fg">{{ message.text }}</p></div>
					</div>
				</div>
				<div class="mx-auto w-full max-w-2xl shrink-0 px-5 pb-6"><DomTextareaComposer v-model="draft" placeholder="What would you like to build?" aria-label="Message assistant" @submit="send" /><p class="mt-2 text-center text-[11px] text-muted-fg">Demo conversation · No AI requests</p></div>
			</div>
		</template>
		<div v-else-if="active === 'space'" class="mx-auto max-w-5xl px-6 py-12 sm:px-12">
			<p class="text-xs text-muted-fg">SPACE</p><h1 class="mt-3 text-2xl font-medium">{{ currentPage || (favoritesOnly ? 'Favorites' : 'All pages') }}</h1>
			<template v-if="!currentPage"><p class="mt-3 text-sm text-muted-fg">Ideas, plans, and the things you're working on.</p><div class="mt-8 grid gap-3 sm:grid-cols-3"><button v-for="title in visiblePages.slice(0, 3)" :key="title" type="button" class="rounded-xl border border-border p-5 text-left text-sm hover:bg-secondary" @click="currentPage = title">{{ title }}<span class="mt-3 block text-xs text-muted-fg">Open page →</span></button></div><div class="mt-10"><button v-for="page in visiblePages" :key="page" type="button" class="flex w-full items-center gap-3 border-b border-border/60 py-4 text-left text-sm hover:bg-secondary" @click="currentPage = page"><span class="text-muted-fg">▤</span>{{ page }}<span class="ml-auto text-xs text-muted-fg">Today</span></button></div></template>
			<div v-else class="mt-10 space-y-6 text-sm leading-7 text-muted-fg"><p>Make space for the work that matters. Keep navigation quiet and content front and center.</p><p>This page lives inside the same application shell as the assistant and editor. Your app can supply any Vue content here.</p><DomButton variant="secondary" size="sm" @click="currentPage = ''">Back to pages</DomButton></div>
		</div>
		<div v-else-if="active === 'code'" class="flex h-full flex-col"><header class="border-b border-border px-6 py-4 font-mono text-xs">{{ currentFile }}</header><pre class="flex-1 overflow-auto p-6 text-sm leading-8 text-muted-fg"><code>{{ source }}</code></pre><footer class="border-t border-border px-6 py-2 text-xs text-muted-fg">Vue · UTF-8 · Local preview</footer></div>
		<div v-else-if="active === 'calendar'" class="mx-auto max-w-4xl p-8 sm:p-12"><p class="text-xs text-muted-fg">CALENDAR</p><h1 class="mt-3 text-2xl font-medium">Your week, at a glance.</h1><p class="mt-3 text-sm text-muted-fg">A full-stage app with no secondary navigation.</p><div class="mt-10 grid gap-4 sm:grid-cols-3"><div v-for="(day, index) in ['Monday', 'Tuesday', 'Wednesday']" :key="day" class="rounded-xl border border-border p-5"><p class="text-sm font-medium">{{ day }}</p><p class="mt-6 text-xs text-muted-fg">{{ ['10:00 · Design review', '14:00 · Build session', '11:30 · Team catch-up'][index] }}</p></div></div></div>
		<div v-else class="grid h-full place-content-center gap-4 p-8 text-center"><h1 class="text-xl font-medium">Make this workspace yours.</h1><DomButton variant="secondary" @click="managerOpen = true">Choose apps</DomButton></div>
	</DomDesktopLayout>
	<DomDialog v-model="managerOpen" title="Workspace apps" description="Install demo apps and choose what appears in your rail. Changes last for this preview session.">
		<div class="space-y-3"><div v-for="app in catalog" :key="app.id" class="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3"><span class="mr-auto text-sm font-medium">{{ app.label }}</span><template v-if="installed.includes(app.id)"><DomButton variant="ghost" size="xs" :disabled="pinned.indexOf(app.id) <= 0" :aria-label="`Move ${app.label} up`" @click="moveUp(app.id)">↑</DomButton><DomButton variant="secondary" size="xs" :aria-label="`${pinned.includes(app.id) ? 'Unpin' : 'Pin'} ${app.label}`" @click="togglePin(app.id)">{{ pinned.includes(app.id) ? 'Unpin' : 'Pin' }}</DomButton><DomButton variant="ghost" size="xs" :aria-label="`Remove ${app.label}`" @click="uninstall(app.id)">Remove</DomButton></template><DomButton v-else size="xs" :aria-label="`Install ${app.label}`" @click="install(app.id)">Install</DomButton></div></div>
	</DomDialog>
</template>
