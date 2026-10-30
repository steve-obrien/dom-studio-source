<script setup>
import { computed, ref } from 'vue';
import {
	DomAppBottomNav,
	DomAppListItem,
	DomAppShell,
	DomAppTopBar,
	DomActionSheet,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const activeTab = ref('home');
const query = ref('');
const notifications = ref(true);
const sheetOpen = ref(false);
const selectedTask = ref('');
const lastAction = ref('');

const icons = {
	home: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
	inbox: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16v12H4V6Zm0 8h5l1.5 2h3L15 14h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
	settings: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" stroke-width="1.8"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L14.5 3h-4l-.3 3.1a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7.4 7.4 0 0 0 1.7 1l.3 3.1h4l.3-3.1a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
};

const navItems = [
	{ value: 'home', label: 'Home', icon: icons.home },
	{ value: 'inbox', label: 'Inbox', icon: icons.inbox, badge: '3' },
	{ value: 'settings', label: 'Settings', icon: icons.settings },
];

const tasks = [
	{ label: 'Sync Capacitor status bar', description: 'Match the native chrome to the DOM Studio theme.', meta: 'Now' },
	{ label: 'Review keyboard-aware form', description: 'Keep submit actions visible above the mobile keyboard.', meta: 'Today' },
	{ label: 'Ship mobile app shell', description: 'Use safe areas, bottom nav, and one scroll container.', meta: 'Fri' },
	{ label: 'Add native share action', description: 'Pair a row action with the Capacitor Share plugin.', meta: 'Fri' },
	{ label: 'Tune haptics', description: 'Use light impact feedback for destructive and confirm actions.', meta: 'Next' },
	{ label: 'Capture camera flow', description: 'Sketch the image picker and preview confirmation screen.', meta: 'Next' },
];

const filteredTasks = computed(() => {
	if (!query.value) return tasks;
	return tasks.filter((task) => task.label.toLowerCase().includes(query.value.toLowerCase()));
});

const actions = [
	{ label: 'Share project', description: 'Open the native share sheet', value: 'share' },
	{ label: 'Duplicate screen', value: 'duplicate' },
	{ label: 'Delete draft', value: 'delete', variant: 'danger' },
];

/** Opens the local demo actions for the selected task or the whole project. */
function openActions(task = '') {
	selectedTask.value = task;
	sheetOpen.value = true;
}

/** Shows the chosen demo action without pretending to call a native plugin. */
function selectAction(action) {
	lastAction.value = `${action.label} selected. Connect this action to your application.`;
}
</script>

<template>
	<DomAppShell>
		<template #top>
			<DomAppTopBar :title="activeTab === 'home' ? 'DOM Studio' : activeTab === 'inbox' ? 'Inbox' : 'Settings'" subtitle="Mobile workspace">
				<template #trailing>
					<button
						type="button"
						class="grid size-11 place-items-center rounded-full bg-secondary text-canvas-fg active:scale-95"
						aria-label="More actions"
						@click="openActions()"
					>
						<svg class="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path d="M4 10a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm6 0a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm6 0a2 2 0 1 1 4 0 2 2 0 0 1-4 0Z" />
						</svg>
					</button>
				</template>
			</DomAppTopBar>
		</template>

		<section v-if="activeTab === 'home'" class="space-y-4 p-4">
			<div class="rounded-[1.75rem] bg-primary p-5 text-primary-fg shadow-xl shadow-black/10">
				<p class="text-xs font-medium uppercase tracking-[0.16em] opacity-80">Today</p>
				<h2 class="mt-2 text-2xl font-semibold tracking-tight">Build mobile primitives.</h2>
				<p class="mt-2 text-sm leading-6 opacity-85">A web UI system, tuned for Capacitor screens and native app rhythms.</p>
			</div>

			<div class="mobile-task-search">
				<DomTextInput
					v-model="query"
					type="search"
					placeholder="Search mobile tasks"
					aria-label="Search mobile tasks"
				/>
			</div>

			<div class="overflow-hidden rounded-[1.5rem] border border-border bg-canvas">
				<DomAppListItem
					v-for="task in filteredTasks"
					:key="task.label"
					:label="task.label"
					:description="task.description"
					:meta="task.meta"
					chevron
					@click="openActions(task.label)"
				>
					<template #icon>
						<svg class="size-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
							<path d="m5 10 3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</template>
				</DomAppListItem>
			</div>

			<div class="overflow-hidden rounded-[1.5rem] border border-border bg-canvas">
				<DomAppListItem as="div" label="Push notifications" description="Demo row using an existing DOM Studio toggle.">
					<template #trailing>
						<DomToggle v-model="notifications" label="Push notifications" chrome="none" />
					</template>
				</DomAppListItem>
				<DomAppListItem label="Native share" description="Pair this row with Capacitor Share." chevron @click="openActions()" />
			</div>
		</section>
		<section v-else-if="activeTab === 'inbox'" class="space-y-4 p-4">
			<h2 class="text-lg font-semibold">Needs your attention</h2>
			<div class="overflow-hidden rounded-2xl border border-border">
				<DomAppListItem v-for="task in tasks.slice(0, 3)" :key="task.label" :label="task.label" :description="task.description" chevron @click="openActions(task.label)" />
			</div>
		</section>
		<section v-else class="space-y-4 p-4">
			<h2 class="text-lg font-semibold">Workspace preferences</h2>
			<div class="overflow-hidden rounded-2xl border border-border">
				<DomAppListItem as="div" label="Push notifications" description="Activity and updates from your workspace.">
					<template #trailing><DomToggle v-model="notifications" label="Push notifications" chrome="none" /></template>
				</DomAppListItem>
				<DomAppListItem label="Project actions" description="Share, duplicate, or delete a draft." chevron @click="openActions()" />
			</div>
		</section>
		<p v-if="lastAction" role="status" class="px-4 pb-4 text-sm text-muted-fg">{{ lastAction }}</p>

		<template #bottom>
			<DomAppBottomNav v-model="activeTab" :items="navItems" />
		</template>

		<template #overlay>
			<DomActionSheet
				v-model="sheetOpen"
				:title="selectedTask || 'Project actions'"
				description="Use for app commands that should stay near the thumb."
				:actions="actions"
				@select="selectAction"
			/>
		</template>
	</DomAppShell>
</template>

<style scoped>
.mobile-task-search :deep(.skin-input) {
	height: 3rem;
	border-radius: 1rem;
	background: color-mix(in oklch, var(--secondary) 80%, transparent);
	font-size: 1rem;
}
</style>
