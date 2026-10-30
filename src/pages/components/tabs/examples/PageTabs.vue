<script setup>
import { ref } from 'vue';
import { DomButton, DomTabs } from '../../../lib/vue';

const active = ref('dashboard-page');
const openTabs = ref([
	{ key: 'dashboard-page', label: 'page.tsx', path: 'src/app/dashboard/page.tsx', status: 'modified' },
	{ key: 'mission-control', label: 'MissionControl.tsx', path: 'src/components/MissionControl.tsx', status: 'added' },
	{ key: 'agent-client', label: 'agent-client.ts', path: 'src/lib/agent-client.ts', status: '' },
]);
const availableTabs = [
	{ key: 'dashboard-page', label: 'page.tsx', path: 'src/app/dashboard/page.tsx', status: 'modified' },
	{ key: 'mission-control', label: 'MissionControl.tsx', path: 'src/components/MissionControl.tsx', status: 'added' },
	{ key: 'agent-client', label: 'agent-client.ts', path: 'src/lib/agent-client.ts', status: '' },
	{ key: 'task-card', label: 'TaskCard.tsx', path: 'src/components/TaskCard.tsx', status: 'modified' },
];

function openTab(tab) {
	if (!openTabs.value.some((item) => item.key === tab.key)) openTabs.value.push(tab);
	active.value = tab.key;
}

function statusClass(status) {
	if (status === 'added') return 'bg-success';
	if (status === 'modified') return 'bg-warning';
	return 'bg-muted-fg/40';
}
</script>

<template>
	<div class="w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-canvas shadow-sm">
		<DomTabs v-model="active" :tabs="openTabs" variant="page">
			<template #tab="{ tab }">
				<span class="size-2 shrink-0 rounded-full" :class="statusClass(tab.status)"></span>
				<span class="min-w-0 truncate">{{ tab.label }}</span>
			</template>
			<template #dashboard-page>
				<div class="p-5 text-sm text-muted-fg">
					<p class="font-mono text-xs text-primary">src/app/dashboard/page.tsx</p>
					<p class="mt-3 leading-6">Page tabs sit flush with the panel, so they work well for editor files, browser-like workspaces, and record pages.</p>
				</div>
			</template>
			<template #mission-control>
				<div class="p-5 text-sm text-muted-fg">
					<p class="font-mono text-xs text-primary">src/components/MissionControl.tsx</p>
					<p class="mt-3 leading-6">Use the tab slot to add status dots, icons, or compact metadata while keeping the headless tab behavior intact.</p>
				</div>
			</template>
			<template #agent-client>
				<div class="p-5 text-sm text-muted-fg">
					<p class="font-mono text-xs text-primary">src/lib/agent-client.ts</p>
					<p class="mt-3 leading-6">The same component can switch between pill navigation and page-style workspace navigation with the variant prop.</p>
				</div>
			</template>
			<template #task-card>
				<div class="p-5 text-sm text-muted-fg">
					<p class="font-mono text-xs text-primary">src/components/TaskCard.tsx</p>
					<p class="mt-3 leading-6">Tabs can be added from reactive arrays as users open new pages or files.</p>
				</div>
			</template>
		</DomTabs>
		<div class="flex flex-wrap gap-2 border-t border-border bg-secondary/40 p-3">
			<DomButton
				v-for="tab in availableTabs"
				:key="tab.key"
				size="sm"
				variant="secondary"
				@click="openTab(tab)"
			>
				Open {{ tab.label }}
			</DomButton>
		</div>
	</div>
</template>
