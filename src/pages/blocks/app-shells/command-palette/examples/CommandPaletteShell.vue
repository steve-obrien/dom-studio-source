<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomCommandPalette, DomDropdown, DomTabs, DomToggle, DomTooltip } from '@getdom/studio/vue';

const workspaces = [
	{ label: 'Atlas Studio', value: 'atlas', initials: 'A', detail: 'Product workspace', accent: 'bg-primary' },
	{ label: 'Northstar Labs', value: 'northstar', initials: 'N', detail: 'Customer success', accent: 'bg-emerald-500' },
	{ label: 'Arcadia Health', value: 'arcadia', initials: 'H', detail: 'Healthcare account', accent: 'bg-sky-500' },
];

const sections = [
	{ label: 'Dashboard', count: '12' },
	{ label: 'Customers', count: '248' },
	{ label: 'Projects', count: '36' },
	{ label: 'Automations', count: '18' },
	{ label: 'Reports', count: '9' },
	{ label: 'Settings', count: '6' },
];

const commands = [
	{ value: 'new-project', label: 'Create project', description: 'Start a new workspace project' },
	{ value: 'invite-teammate', label: 'Invite teammate', description: 'Send a workspace invitation' },
	{ value: 'customer-northstar', label: 'Open Northstar Labs', description: 'Customer account / Health 84 / Renewal due' },
	{ value: 'customer-arcadia', label: 'Open Arcadia Health', description: 'Customer account / Critical support thread' },
	{ value: 'report-activation', label: 'View activation report', description: 'Funnel report / Last 30 days' },
	{ value: 'automation-trial', label: 'Edit trial rescue automation', description: 'Workflow / Active / 1,240 runs' },
	{ value: 'billing-settings', label: 'Open billing settings', description: 'Plan, seats, usage, and invoices' },
	{ value: 'toggle-theme', label: 'Toggle theme preference', description: 'Switch visual theme for this device' },
	{ value: 'export-audit', label: 'Export audit log', description: 'Download workspace activity as CSV' },
];

const recentItems = [
	{ label: 'Northstar Labs', type: 'Customer', status: 'Renewal review', accent: 'bg-emerald-500' },
	{ label: 'Trial rescue sequence', type: 'Automation', status: 'Active workflow', accent: 'bg-sky-500' },
	{ label: 'Activation by role', type: 'Report', status: 'Updated today', accent: 'bg-violet-500' },
];

const suggestedActions = [
	{ label: 'Create project', detail: 'Blank project with tasks and files', value: 'new-project' },
	{ label: 'Invite teammate', detail: 'Add a collaborator to this workspace', value: 'invite-teammate' },
	{ label: 'Export audit log', detail: 'Download recent account activity', value: 'export-audit' },
];

const selectedWorkspace = ref('atlas');
const paletteOpen = ref(false);
const activeTab = ref('recent');
const commandResult = ref(commands[2]);
const showExperimental = ref(true);

const workspaceLabel = computed(() => {
	return workspaces.find((workspace) => workspace.value === selectedWorkspace.value)?.label || workspaces[0].label;
});

const currentWorkspace = computed(() => {
	return workspaces.find((workspace) => workspace.value === selectedWorkspace.value) || workspaces[0];
});

const visibleCommands = computed(() => {
	if (showExperimental.value) return commands;
	return commands.filter((command) => command.value !== 'toggle-theme');
});

const resultSummary = computed(() => {
	return commandResult.value
		? `${commandResult.value.label} selected from the command palette.`
		: 'No command selected yet.';
});

function openAction(value) {
	const command = commands.find((item) => item.value === value);
	if (command) commandResult.value = command;
}

function selectWorkspace(value) {
	selectedWorkspace.value = value;
}

function onCommandSelect(event) {
	commandResult.value = event.command;
}
</script>

<template>
	<div class="min-h-[42rem] w-full overflow-hidden rounded-lg border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<div class="grid min-h-[42rem] lg:grid-cols-[15rem_minmax(0,1fr)]">
			<aside class="hidden border-r border-border skin-raised lg:flex lg:flex-col">
				<div class="border-b border-border p-4">
					<div class="flex items-center gap-3">
						<span
							class="grid size-9 place-items-center rounded-lg text-sm font-semibold text-white"
							:class="currentWorkspace.accent"
						>{{ currentWorkspace.initials }}</span>
						<div class="min-w-0">
							<p class="truncate text-sm font-semibold">{{ workspaceLabel }}</p>
							<p class="truncate text-xs text-muted-fg">Command-ready shell</p>
						</div>
					</div>
					<DomDropdown
						:items="workspaces"
						width="min-w-[13rem]"
						class="mt-4"
						@select="selectWorkspace"
					>
						<template #trigger>
							<span class="flex min-w-[10.75rem] items-center justify-between gap-3">
								<span class="flex min-w-0 items-center gap-2">
									<span
										class="grid size-5 shrink-0 place-items-center rounded-md text-[10px] font-semibold text-white"
										:class="currentWorkspace.accent"
									>{{ currentWorkspace.initials }}</span>
									<span class="truncate">{{ currentWorkspace.label }}</span>
								</span>
							</span>
						</template>

						<template #item="{ item }">
							<div class="flex items-center gap-3">
								<span
									class="grid size-7 shrink-0 place-items-center rounded-lg text-xs font-semibold text-white"
									:class="item.accent"
								>{{ item.initials }}</span>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-fg">{{ item.label }}</p>
									<p class="truncate text-xs text-muted-fg">{{ item.detail }}</p>
								</div>
								<span
									v-if="item.value === selectedWorkspace"
									class="grid size-5 place-items-center rounded-full bg-primary/15 text-primary"
									aria-hidden="true"
								>
									<svg viewBox="0 0 20 20" class="size-3.5" fill="none">
										<path d="m5 10 3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</span>
							</div>
						</template>
					</DomDropdown>
				</div>

				<nav class="flex-1 space-y-1 p-3">
					<button
						v-for="section in sections"
						:key="section.label"
						type="button"
						class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-fg transition first:bg-secondary first:text-secondary-fg hover:bg-secondary hover:text-fg"
					>
						<span>{{ section.label }}</span>
						<span class="text-xs">{{ section.count }}</span>
					</button>
				</nav>

				<div class="border-t border-border p-3">
					<DomTooltip text="Open the same palette from anywhere with Cmd+K or Ctrl+K.">
						<DomButton variant="secondary" class="w-full justify-start" size="sm" @click="paletteOpen = true">
							<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M5 6h14M5 12h9M5 18h6M17 14l3 3-3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
							Command menu
						</DomButton>
					</DomTooltip>
				</div>
			</aside>

			<main class="min-w-0">
				<header class="border-b border-border bg-background/90 p-4 backdrop-blur sm:p-5">
					<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div>
							<p class="text-xs font-semibold uppercase text-muted-fg">Global launcher</p>
							<h2 class="mt-1 text-2xl font-semibold text-fg">Command palette workspace</h2>
						</div>
						<div class="flex flex-wrap items-center gap-2">
							<DomToggle v-model="showExperimental" label="Labs actions" />
							<DomButton variant="secondary" @click="paletteOpen = true">
								<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<path d="M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm4.5 10.5L20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
								</svg>
								Search actions
							</DomButton>
							<kbd class="rounded border border-border bg-secondary px-2 py-1 text-xs font-semibold text-muted-fg">Cmd K</kbd>
						</div>
					</div>
				</header>

				<div class="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
					<section class="space-y-4">
						<div class="rounded-lg border border-border skin-raised p-4">
							<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<h3 class="text-lg font-semibold text-fg">Quick entry point</h3>
									<p class="mt-1 text-sm leading-6 text-muted-fg">Expose global navigation without making every destination permanent sidebar chrome.</p>
								</div>
								<DomButton @click="paletteOpen = true">Open palette</DomButton>
							</div>
							<div class="mt-4 rounded-lg border border-border bg-background p-3">
								<div class="flex items-center gap-3">
									<svg class="size-5 shrink-0 text-muted-fg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<path d="M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm4.5 10.5L20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
									</svg>
									<button
										type="button"
										class="min-w-0 flex-1 text-left text-sm text-muted-fg"
										@click="paletteOpen = true"
									>
										Search customers, reports, automations, settings...
									</button>
									<span class="hidden rounded border border-border bg-secondary px-2 py-1 text-xs font-semibold text-muted-fg sm:inline-flex">Ctrl K</span>
								</div>
							</div>
						</div>

						<DomTabs v-model="activeTab" :tabs="[
							{ key: 'recent', label: 'Recent work' },
							{ key: 'actions', label: 'Suggested actions' },
							{ key: 'routing', label: 'Routing result' },
						]">
							<template #recent>
								<div class="grid gap-3 md:grid-cols-3">
									<button
										v-for="item in recentItems"
										:key="item.label"
										type="button"
										class="rounded-lg border border-border bg-background p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
										@click="openAction(item.label === 'Northstar Labs' ? 'customer-northstar' : item.label === 'Trial rescue sequence' ? 'automation-trial' : 'report-activation')"
									>
										<span class="flex items-center gap-2 text-xs font-semibold text-muted-fg">
											<span class="size-2 rounded-full" :class="item.accent"></span>
											{{ item.type }}
										</span>
										<span class="mt-3 block text-sm font-semibold text-fg">{{ item.label }}</span>
										<span class="mt-1 block text-xs text-muted-fg">{{ item.status }}</span>
									</button>
								</div>
							</template>

							<template #actions>
								<div class="grid gap-3 md:grid-cols-3">
									<button
										v-for="action in suggestedActions"
										:key="action.value"
										type="button"
										class="rounded-lg border border-border bg-background p-4 text-left transition hover:border-primary/50 hover:bg-secondary"
										@click="openAction(action.value)"
									>
										<span class="text-sm font-semibold text-fg">{{ action.label }}</span>
										<span class="mt-2 block text-sm leading-6 text-muted-fg">{{ action.detail }}</span>
									</button>
								</div>
							</template>

							<template #routing>
								<div class="rounded-lg border border-border bg-background p-4">
									<p class="text-xs font-semibold uppercase text-muted-fg">Selection handler</p>
									<p class="mt-2 text-lg font-semibold text-fg">{{ resultSummary }}</p>
									<p class="mt-2 text-sm leading-6 text-muted-fg">
										In production, map this value to router navigation, dialog launchers, async jobs, or copy-to-clipboard actions.
									</p>
								</div>
							</template>
						</DomTabs>
					</section>

					<aside class="space-y-4">
						<section class="rounded-lg border border-border skin-raised p-4">
							<h3 class="text-sm font-semibold text-fg">Command coverage</h3>
							<div class="mt-4 space-y-3">
								<div class="flex items-center justify-between text-sm">
									<span class="text-muted-fg">Navigation</span>
									<span class="font-semibold text-fg">4 commands</span>
								</div>
								<div class="h-2 overflow-hidden rounded-full bg-secondary">
									<div class="h-full w-[82%] rounded-full bg-primary"></div>
								</div>
								<div class="flex items-center justify-between text-sm">
									<span class="text-muted-fg">Records</span>
									<span class="font-semibold text-fg">2 recent</span>
								</div>
								<div class="h-2 overflow-hidden rounded-full bg-secondary">
									<div class="h-full w-[58%] rounded-full bg-emerald-500"></div>
								</div>
								<div class="flex items-center justify-between text-sm">
									<span class="text-muted-fg">Actions</span>
									<span class="font-semibold text-fg">3 ready</span>
								</div>
								<div class="h-2 overflow-hidden rounded-full bg-secondary">
									<div class="h-full w-[70%] rounded-full bg-sky-500"></div>
								</div>
							</div>
						</section>

						<section class="rounded-lg border border-border bg-background p-4">
							<p class="text-xs font-semibold uppercase text-muted-fg">Last selected</p>
							<h3 class="mt-2 text-lg font-semibold text-fg">{{ commandResult.label }}</h3>
							<p class="mt-2 text-sm leading-6 text-muted-fg">{{ commandResult.description }}</p>
							<div class="mt-4 flex flex-wrap gap-2">
								<span class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg">Route-safe</span>
								<span class="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Permission checked</span>
							</div>
						</section>
					</aside>
				</div>
			</main>
		</div>

		<DomCommandPalette
			v-model="paletteOpen"
			:commands="visibleCommands"
			placeholder="Search pages, customers, reports, and actions..."
			@select="onCommandSelect"
		/>
	</div>
</template>
