<script setup>
import { computed, ref } from 'vue';
import {
	DomAvatar,
	DomButton,
	DomCard,
	DomCommandPalette,
	DomDrawer,
	DomEmptyState,
	DomIconButton,
	DomProfileMenu,
	DomSelect,
	DomStatusPill,
	DomTabs,
	DomToggle,
} from '@getdom/studio/vue';
import { builtInIconSelectorItems } from '../../../../forms/icon-selector/iconSelectorItems.js';

const MENU_ICON = iconPath('Menu');
const SEARCH_ICON = iconPath('Search');

const workspaceOptions = [
	{ label: 'Atlas Studio', value: 'atlas', initials: 'AS', description: 'Product workspace' },
	{ label: 'Northstar Labs', value: 'northstar', initials: 'NL', description: 'Customer-success workspace' },
	{ label: 'Arcadia Health', value: 'arcadia', initials: 'AH', description: 'Healthcare account workspace' },
];

const navigationGroups = [
	{
		label: 'Workspace',
		items: [
			{ id: 'commands', label: 'Command centre', description: 'Search and run workspace actions', icon: iconPath('Search') },
			{ id: 'customers', label: 'Customers', description: 'Accounts, contacts, and health', icon: iconPath('Users'), count: 248 },
			{ id: 'projects', label: 'Projects', description: 'Plans, tasks, and files', icon: iconPath('Folder'), count: 36 },
		],
	},
	{
		label: 'Operations',
		items: [
			{ id: 'automations', label: 'Automations', description: 'Triggers, actions, and runs', icon: iconPath('Rocket'), count: 18 },
			{ id: 'reports', label: 'Reports', description: 'Product and account insights', icon: iconPath('Chart bar'), count: 9 },
			{ id: 'settings', label: 'Settings', description: 'Workspace configuration', icon: iconPath('Settings') },
		],
	},
];

const commands = [
	{
		value: 'new-project',
		label: 'Create project',
		description: 'Start a new project in Atlas Studio',
		icon: iconPath('Add'),
		type: 'Action',
	},
	{
		value: 'invite-teammate',
		label: 'Invite teammate',
		description: 'Send a workspace invitation',
		icon: iconPath('Users'),
		type: 'Action',
	},
	{
		value: 'customer-northstar',
		label: 'Open Northstar Labs',
		description: 'Customer · Health 84 · Renewal review due',
		icon: iconPath('Users'),
		type: 'Customer',
		keywords: ['account', 'renewal', 'health'],
	},
	{
		value: 'customer-arcadia',
		label: 'Open Arcadia Health',
		description: 'Customer · Critical support thread',
		icon: iconPath('Warning'),
		type: 'Customer',
		keywords: ['account', 'support', 'critical'],
	},
	{
		value: 'report-activation',
		label: 'View activation report',
		description: 'Report · Last 30 days · Updated today',
		icon: iconPath('Chart bar'),
		type: 'Report',
	},
	{
		value: 'automation-trial',
		label: 'Edit trial rescue automation',
		description: 'Automation · Active · 1,240 runs',
		icon: iconPath('Rocket'),
		type: 'Automation',
	},
	{
		value: 'billing-settings',
		label: 'Open billing settings',
		description: 'Plan, seats, usage, and invoices',
		icon: iconPath('Receipt'),
		type: 'Navigation',
	},
	{
		value: 'workspace-settings',
		label: 'Open workspace settings',
		description: 'Members, roles, integrations, and preferences',
		icon: iconPath('Settings'),
		type: 'Navigation',
	},
	{
		value: 'export-audit',
		label: 'Export audit log',
		description: 'Download workspace activity as CSV',
		icon: iconPath('Download'),
		type: 'Action',
	},
	{
		value: 'ask-atlas',
		label: 'Ask Atlas about this workspace',
		description: 'Labs · Summarise current risks and next actions',
		icon: iconPath('Sparkles'),
		type: 'Labs',
		experimental: true,
	},
];

const recentItems = [
	{
		value: 'customer-northstar',
		label: 'Northstar Labs',
		description: 'Renewal review due in 42 days',
		meta: 'Opened 12 minutes ago',
		type: 'Customer',
		tone: 'warning',
		icon: iconPath('Users'),
	},
	{
		value: 'automation-trial',
		label: 'Trial rescue sequence',
		description: 'Active workflow · 1,240 runs',
		meta: 'Edited yesterday',
		type: 'Automation',
		tone: 'success',
		icon: iconPath('Rocket'),
	},
	{
		value: 'report-activation',
		label: 'Activation by role',
		description: 'Funnel report · Last 30 days',
		meta: 'Viewed on Monday',
		type: 'Report',
		tone: 'info',
		icon: iconPath('Chart bar'),
	},
];

const suggestedActions = [
	{
		value: 'new-project',
		label: 'Create a project',
		description: 'Start with tasks, milestones, and shared files.',
		type: 'Action',
		tone: 'primary',
		icon: iconPath('Add'),
	},
	{
		value: 'invite-teammate',
		label: 'Invite a teammate',
		description: 'Add a collaborator and choose their workspace role.',
		type: 'Action',
		tone: 'info',
		icon: iconPath('Users'),
	},
	{
		value: 'export-audit',
		label: 'Export the audit log',
		description: 'Prepare a CSV of recent workspace activity.',
		type: 'Action',
		tone: 'neutral',
		icon: iconPath('Download'),
	},
];

const profileMenuItems = [
	{
		type: 'label',
		value: 'signed-in-as',
		label: 'Logged in as',
		description: 'maya@atlas.studio',
	},
	{ separator: true },
	{
		value: 'profile',
		label: 'Profile',
		description: 'Account details and preferences',
		icon: 'profile',
		href: '#profile',
	},
	{
		value: 'shortcuts',
		label: 'Keyboard shortcuts',
		description: 'Review workspace key commands',
		icon: 'onboarding',
	},
	{
		value: 'setup',
		label: 'Workspace setup',
		description: 'Two tasks remain',
		icon: 'onboarding',
		children: [
			{ value: 'invite', label: 'Invite the customer-success team', type: 'task', completed: true },
			{ value: 'reports', label: 'Pin key reports', type: 'task', completed: true },
			{ value: 'shortcuts', label: 'Publish team shortcuts', type: 'task', completed: false },
			{ value: 'search', label: 'Connect customer search', type: 'task', completed: false },
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

const selectedWorkspace = ref('atlas');
const activePage = ref(navigationGroups[0].items[0]);
const activeTab = ref('recent');
const paletteOpen = ref(false);
const mobileNavigationOpen = ref(false);
const labsEnabled = ref(true);
const commandResult = ref(commands[2]);
const interfaceNotice = ref('');

/**
 * Resolve an icon from DOM Studio's built-in icon inventory.
 *
 * @param {string} label Built-in icon label.
 * @returns {string} SVG path data accepted by DOM Studio icon components.
 */
function iconPath(label) {
	return builtInIconSelectorItems.find((item) => item.label === label)?.path || '';
}

/**
 * Resolve the workspace record represented by the current select value.
 *
 * @returns {{ label: string, value: string, initials: string, description: string }} Active workspace.
 */
const currentWorkspace = computed(() => {
	return workspaceOptions.find((workspace) => workspace.value === selectedWorkspace.value) || workspaceOptions[0];
});

/**
 * Filter experimental commands while the labs command source is disabled.
 *
 * @returns {Array<Object>} Commands available to the palette.
 */
const visibleCommands = computed(() => {
	if (labsEnabled.value) return commands;
	return commands.filter((command) => !command.experimental);
});

/**
 * Describe the most recently executed command for the result panel.
 *
 * @returns {string} Human-readable command result.
 */
const resultSummary = computed(() => {
	return `${commandResult.value.label} is ready in ${currentWorkspace.value.label}.`;
});

/**
 * Open the global command palette.
 *
 * @returns {void}
 */
function openCommandPalette() {
	paletteOpen.value = true;
}

/**
 * Open the temporary navigation drawer used at narrow iframe widths.
 *
 * @returns {void}
 */
function openMobileNavigation() {
	mobileNavigationOpen.value = true;
}

/**
 * Select an application destination and dismiss temporary navigation.
 *
 * @param {{ id: string, label: string, description: string, icon: string }} page Destination record.
 * @returns {void}
 */
function selectPage(page) {
	activePage.value = page;
	mobileNavigationOpen.value = false;
	interfaceNotice.value = '';
}

/**
 * Execute one of the block's mock commands and surface its result.
 *
 * @param {Object} command Command record to execute.
 * @returns {void}
 */
function runCommand(command) {
	if (!command) return;
	commandResult.value = command;
	activePage.value = navigationGroups[0].items[0];
	interfaceNotice.value = `${command.label} selected. In an application, route or dispatch the command here.`;
}

/**
 * Handle a command selected through DomCommandPalette.
 *
 * @param {{ command?: Object }} event Command palette selection payload.
 * @returns {void}
 */
function onCommandSelect(event) {
	runCommand(event.command);
}

/**
 * Reflect the rich workspace selection in the example status region.
 *
 * @param {{ label?: string }} event DOM Studio select event.
 * @returns {void}
 */
function onWorkspaceSelect(event) {
	interfaceNotice.value = `${event.label || currentWorkspace.value.label} is now the active workspace.`;
}

/**
 * Reflect profile-menu actions without navigating away from the example.
 *
 * @param {{ value?: string, item?: { label?: string } }} event DOM Studio profile-menu selection payload.
 * @returns {void}
 */
function handleProfileAction(event) {
	const label = event?.item?.label || event?.value || 'Account action';
	interfaceNotice.value = `${label} selected in this example.`;
}
</script>

<template>
	<div class="h-dvh min-h-[38rem] overflow-hidden bg-canvas text-canvas-fg">
		<div class="grid h-full min-w-0 grid-rows-[minmax(0,1fr)] md:grid-cols-[16.5rem_minmax(0,1fr)]">
			<aside class="hidden min-h-0 min-w-0 flex-col border-r border-border bg-secondary/55 md:flex">
				<div class="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
					<DomAvatar name="Atlas Studio" initials="AS" size="sm" shape="rounded" />
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold">Atlas Studio</p>
						<p class="truncate text-xs text-muted-fg">Command workspace</p>
					</div>
				</div>

				<div class="shrink-0 border-b border-border p-3">
					<DomSelect
						v-model="selectedWorkspace"
						label="Workspace"
						:options="workspaceOptions"
						width="min-w-[17rem]"
						@select="onWorkspaceSelect"
					>
						<template #value="{ option, label }">
							<span class="flex min-w-0 items-center gap-2">
								<DomAvatar
									:name="option?.label || label"
									:initials="option?.initials"
									size="xs"
									shape="rounded"
								/>
								<span class="truncate">{{ label }}</span>
							</span>
						</template>
						<template #option="{ option }">
							<span class="flex min-w-0 items-center gap-3">
								<DomAvatar :name="option.label" :initials="option.initials" size="xs" shape="rounded" />
								<span class="min-w-0">
									<span class="block truncate text-sm font-medium">{{ option.label }}</span>
									<span class="mt-0.5 block truncate text-xs text-muted-fg">{{ option.description }}</span>
								</span>
							</span>
						</template>
					</DomSelect>
				</div>

				<nav class="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Workspace navigation">
					<div v-for="group in navigationGroups" :key="group.label" class="not-first:mt-5">
						<p class="mb-1 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-fg">
							{{ group.label }}
						</p>
						<div class="space-y-1">
							<button
								v-for="item in group.items"
								:key="item.id"
								type="button"
								class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition"
								:class="activePage.id === item.id
									? 'bg-canvas font-semibold text-canvas-fg shadow-sm ring-1 ring-border/70'
									: 'text-muted-fg hover:bg-canvas/65 hover:text-canvas-fg'"
								:aria-current="activePage.id === item.id ? 'page' : undefined"
								@click="selectPage(item)"
							>
								<DomIconButton
									as="span"
									:icon="item.icon"
									label=""
									size="xs"
									class="pointer-events-none"
									aria-hidden="true"
								/>
								<span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
								<DomStatusPill
									v-if="item.count"
									tone="neutral"
									:label="String(item.count)"
									size="sm"
									:dot="false"
								/>
							</button>
						</div>
					</div>
				</nav>

				<div class="shrink-0 border-t border-border p-3">
					<DomProfileMenu
						name="Maya Chen"
						email="maya@atlas.studio"
						initials="MC"
						show-name
						show-email
						:items="profileMenuItems"
						placement="top"
						align="left"
						width="min-w-[19rem]"
						class="block w-full [&>button]:w-full [&>button]:justify-start [&>button]:rounded-xl [&>button]:bg-transparent [&>button]:px-2 [&>button]:shadow-none [&>button]:hover:bg-canvas/70 [&>button>span]:flex-1"
						@select="handleProfileAction"
					/>
				</div>
			</aside>

			<section class="flex h-full min-w-0 flex-col">
				<header class="flex h-16 shrink-0 items-center gap-2 border-b border-border px-3 md:hidden">
					<DomIconButton
						:icon="MENU_ICON"
						label="Open workspace navigation"
						size="sm"
						:aria-expanded="mobileNavigationOpen ? 'true' : 'false'"
						@click="openMobileNavigation"
					/>
					<div class="flex min-w-0 flex-1 items-center gap-2.5">
						<DomAvatar :name="currentWorkspace.label" :initials="currentWorkspace.initials" size="xs" shape="rounded" />
						<div class="min-w-0">
							<p class="truncate text-sm font-semibold">{{ currentWorkspace.label }}</p>
							<p class="truncate text-[0.68rem] text-muted-fg">{{ activePage.label }}</p>
						</div>
					</div>
					<DomIconButton :icon="SEARCH_ICON" label="Open command palette" size="sm" @click="openCommandPalette" />
					<DomProfileMenu
						name="Maya Chen"
						email="maya@atlas.studio"
						initials="MC"
						:show-name="false"
						:show-email="false"
						trigger-label="Open user menu"
						:items="profileMenuItems"
						placement="bottom"
						align="right"
						width="min-w-[19rem]"
						class="block [&>button]:size-10 [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-transparent [&>button]:px-0 [&>button]:shadow-none [&>button>span>span:nth-child(2)]:sr-only [&>button>svg]:hidden"
						@select="handleProfileAction"
					/>
				</header>

				<main class="min-h-0 flex-1 overflow-y-auto">
					<div class="mx-auto w-full max-w-[92rem] p-4 sm:p-6 lg:p-8">
						<div class="max-w-3xl">
							<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Global launcher</p>
							<h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{{ activePage.label }}</h1>
							<p class="mt-2 text-sm leading-6 text-muted-fg">
								{{ activePage.id === 'commands'
									? 'Find a destination, record, or action without leaving the work already in progress.'
									: activePage.description + '. The command launcher remains available from every destination.' }}
							</p>
						</div>

						<button
							type="button"
							class="skin-input mt-6 flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring/60"
							aria-label="Search pages, customers, reports, and actions"
							@click="openCommandPalette"
						>
							<DomIconButton
								as="span"
								:icon="SEARCH_ICON"
								label=""
								size="sm"
								class="pointer-events-none"
								aria-hidden="true"
							/>
							<span class="min-w-0 flex-1 truncate text-sm text-muted-fg">
								Search pages, customers, reports, and actions…
							</span>
							<kbd class="hidden shrink-0 rounded-md border border-border bg-secondary px-2 py-1 text-xs font-semibold text-muted-fg sm:inline-flex">
								⌘ K
							</kbd>
						</button>

						<p
							v-if="interfaceNotice"
							class="mt-4 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success"
							role="status"
						>
							{{ interfaceNotice }}
						</p>

						<template v-if="activePage.id === 'commands'">
							<div class="mt-8 grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_21rem]">
								<section class="min-w-0" aria-labelledby="command-content-heading">
									<div class="flex flex-wrap items-end justify-between gap-3">
										<div>
											<h2 id="command-content-heading" class="text-lg font-semibold tracking-tight">Useful starting points</h2>
											<p class="mt-1 text-sm text-muted-fg">Open recent work or run a common action directly.</p>
										</div>
										<DomButton size="sm" @click="openCommandPalette">Open palette</DomButton>
									</div>

									<DomTabs
										v-model="activeTab"
										class="mt-5"
										:tabs="[
											{ key: 'recent', label: 'Recent' },
											{ key: 'suggested', label: 'Suggested' },
										]"
									>
										<template #recent>
											<ul class="divide-y divide-border border-y border-border" aria-label="Recent workspace items">
												<li v-for="item in recentItems" :key="item.value">
													<button
														type="button"
														class="flex w-full min-w-0 flex-col gap-3 py-4 text-left transition hover:bg-secondary/45 sm:flex-row sm:items-center sm:px-3"
														@click="runCommand(commands.find((command) => command.value === item.value))"
													>
														<span class="flex min-w-0 flex-1 items-start gap-3">
															<DomIconButton
																as="span"
																:icon="item.icon"
																label=""
																size="sm"
																variant="secondary"
																class="pointer-events-none"
																aria-hidden="true"
															/>
															<span class="min-w-0">
																<span class="flex flex-wrap items-center gap-2">
																	<span class="truncate text-sm font-semibold">{{ item.label }}</span>
																	<DomStatusPill :tone="item.tone" :label="item.type" size="sm" :dot="false" />
																</span>
																<span class="mt-1 block text-sm text-muted-fg">{{ item.description }}</span>
															</span>
														</span>
														<span class="shrink-0 pl-11 text-xs text-muted-fg sm:pl-0">{{ item.meta }}</span>
													</button>
												</li>
											</ul>
										</template>

										<template #suggested>
											<ul class="divide-y divide-border border-y border-border" aria-label="Suggested workspace actions">
												<li v-for="item in suggestedActions" :key="item.value">
													<button
														type="button"
														class="flex w-full min-w-0 items-start gap-3 py-4 text-left transition hover:bg-secondary/45 sm:px-3"
														@click="runCommand(commands.find((command) => command.value === item.value))"
													>
														<DomIconButton
															as="span"
															:icon="item.icon"
															label=""
															size="sm"
															variant="secondary"
															class="pointer-events-none"
															aria-hidden="true"
														/>
														<span class="min-w-0 flex-1">
															<span class="flex flex-wrap items-center gap-2">
																<span class="text-sm font-semibold">{{ item.label }}</span>
																<DomStatusPill :tone="item.tone" :label="item.type" size="sm" :dot="false" />
															</span>
															<span class="mt-1 block text-sm leading-6 text-muted-fg">{{ item.description }}</span>
														</span>
													</button>
												</li>
											</ul>
										</template>
									</DomTabs>
								</section>

								<aside class="min-w-0 space-y-6 xl:border-l xl:border-border xl:pl-8" aria-labelledby="last-command-heading">
									<DomCard padding="md">
										<div class="flex items-center justify-between gap-3">
											<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Last command</p>
											<DomStatusPill tone="success" label="Ready" size="sm" />
										</div>
										<h2 id="last-command-heading" class="mt-3 text-lg font-semibold tracking-tight">{{ commandResult.label }}</h2>
										<p class="mt-2 text-sm leading-6 text-muted-fg">{{ commandResult.description }}</p>
										<p class="mt-3 text-xs text-muted-fg">{{ resultSummary }}</p>
										<DomButton class="mt-5" size="sm" variant="secondary" @click="runCommand(commandResult)">
											Run again
										</DomButton>
									</DomCard>

									<section aria-labelledby="command-settings-heading">
										<h2 id="command-settings-heading" class="text-sm font-semibold">Command sources</h2>
										<DomToggle
											v-model="labsEnabled"
											label="Labs commands"
											description="Include experimental workspace actions."
											class="mt-3 w-full justify-between border-y border-border py-4 [&>dom-toggle]:order-2 [&>span]:order-1"
										/>
									</section>
								</aside>
							</div>
						</template>

						<DomEmptyState
							v-else
							class="mt-8"
							:title="`${activePage.label} is ready to compose`"
							:description="`The shell has switched to ${activePage.label.toLowerCase()}. The global launcher remains one click or keyboard shortcut away.`"
							:icon="activePage.icon"
							align="left"
							size="lg"
						>
							<template #actions>
								<DomButton @click="openCommandPalette">Find a command</DomButton>
								<DomButton variant="secondary" @click="selectPage(navigationGroups[0].items[0])">
									Return to command centre
								</DomButton>
							</template>
						</DomEmptyState>
					</div>
				</main>
			</section>
		</div>

		<DomDrawer
			v-model="mobileNavigationOpen"
			class="md:hidden"
			side="left"
			width="min(88vw, 20rem)"
		>
			<template #header>
				<div class="flex min-w-0 items-center gap-3">
					<DomAvatar name="Atlas Studio" initials="AS" size="sm" shape="rounded" />
					<div class="min-w-0">
						<h2 class="truncate text-sm font-semibold">Atlas Studio</h2>
						<p class="truncate text-xs text-muted-fg">Command workspace</p>
					</div>
				</div>
			</template>

			<div class="flex h-full min-h-0 flex-col">
				<div class="shrink-0 border-b border-border p-4">
					<DomSelect
						v-model="selectedWorkspace"
						label="Workspace"
						:options="workspaceOptions"
						width="min-w-[17rem]"
						@select="onWorkspaceSelect"
					>
						<template #value="{ option, label }">
							<span class="flex min-w-0 items-center gap-2">
								<DomAvatar
									:name="option?.label || label"
									:initials="option?.initials"
									size="xs"
									shape="rounded"
								/>
								<span class="truncate">{{ label }}</span>
							</span>
						</template>
						<template #option="{ option }">
							<span class="flex min-w-0 items-center gap-3">
								<DomAvatar :name="option.label" :initials="option.initials" size="xs" shape="rounded" />
								<span class="min-w-0">
									<span class="block truncate text-sm font-medium">{{ option.label }}</span>
									<span class="mt-0.5 block truncate text-xs text-muted-fg">{{ option.description }}</span>
								</span>
							</span>
						</template>
					</DomSelect>
				</div>

				<nav class="min-h-0 flex-1 px-3 py-4" aria-label="Mobile workspace navigation">
					<div v-for="group in navigationGroups" :key="group.label" class="not-first:mt-5">
						<p class="mb-1 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-fg">
							{{ group.label }}
						</p>
						<div class="space-y-1">
							<button
								v-for="item in group.items"
								:key="item.id"
								type="button"
								class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition"
								:class="activePage.id === item.id
									? 'bg-secondary font-semibold text-secondary-fg'
									: 'text-muted-fg hover:bg-secondary hover:text-canvas-fg'"
								:aria-current="activePage.id === item.id ? 'page' : undefined"
								@click="selectPage(item)"
							>
								<DomIconButton
									as="span"
									:icon="item.icon"
									label=""
									size="xs"
									class="pointer-events-none"
									aria-hidden="true"
								/>
								<span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
								<DomStatusPill
									v-if="item.count"
									tone="neutral"
									:label="String(item.count)"
									size="sm"
									:dot="false"
								/>
							</button>
						</div>
					</div>
				</nav>
			</div>

			<template #footer>
				<DomProfileMenu
					name="Maya Chen"
					email="maya@atlas.studio"
					initials="MC"
					show-name
					show-email
					:items="profileMenuItems"
					placement="top"
					align="left"
					width="min-w-[19rem]"
					class="block w-full [&>button]:w-full [&>button]:justify-start [&>button]:rounded-xl [&>button]:bg-transparent [&>button]:px-2 [&>button]:shadow-none [&>button>span]:flex-1"
					@select="handleProfileAction"
				/>
			</template>
		</DomDrawer>

		<DomCommandPalette
			v-model="paletteOpen"
			:commands="visibleCommands"
			placeholder="Search pages, customers, reports, and actions..."
			@select="onCommandSelect"
		/>
	</div>
</template>
