<script setup>
import { ref } from 'vue';
import {
	DomAvatar,
	DomButton,
	DomCard,
	DomDialog,
	DomDrawer,
	DomEmptyState,
	DomIconButton,
	DomProfileMenu,
	DomSelect,
	DomStatusPill,
} from '@getdom/studio/vue';
import { builtInIconSelectorItems } from '../../../../forms/icon-selector/iconSelectorItems.js';

const MENU_ICON = iconPath('Menu');
const openReviewCount = ref(4);

const navigationGroups = [
	{
		label: 'Workspace',
		items: [
			{ id: 'overview', label: 'Overview', description: 'Portfolio summary', icon: iconPath('Dashboard') },
			{ id: 'health', label: 'Customer health', description: 'Accounts needing review', icon: iconPath('Heart'), count: 'reviews' },
			{ id: 'accounts', label: 'Accounts', description: 'Customers and contacts', icon: iconPath('Users') },
			{ id: 'playbooks', label: 'Playbooks', description: 'Repeatable success plans', icon: iconPath('Sparkles') },
		],
	},
	{
		label: 'Operations',
		items: [
			{ id: 'tasks', label: 'Tasks', description: 'Assigned work', icon: iconPath('Check'), count: 8 },
			{ id: 'reports', label: 'Reports', description: 'Usage and outcomes', icon: iconPath('Chart bar') },
			{ id: 'automations', label: 'Automations', description: 'Scheduled workflows', icon: iconPath('Rocket') },
			{ id: 'integrations', label: 'Integrations', description: 'Connected services', icon: iconPath('Globe') },
		],
	},
	{
		label: 'Administration',
		items: [
			{ id: 'billing', label: 'Billing', description: 'Plan and invoices', icon: iconPath('Receipt') },
			{ id: 'access', label: 'Team access', description: 'Members and roles', icon: iconPath('Shield') },
			{ id: 'settings', label: 'Settings', description: 'Workspace preferences', icon: iconPath('Settings') },
		],
	},
];

const periodOptions = [
	{ value: '7', label: 'Last 7 days', description: 'Use recent product signals and conversations.' },
	{ value: '30', label: 'Last 30 days', description: 'Balance new activity with an established baseline.' },
	{ value: 'quarter', label: 'Last quarter', description: 'Review longer-term adoption and renewal movement.' },
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
		value: 'workspace',
		label: 'Workspace settings',
		description: 'Team, billing, and integrations',
		icon: 'onboarding',
		href: '#workspace',
	},
	{
		value: 'setup',
		label: 'Workspace setup',
		description: 'Two onboarding tasks remain',
		icon: 'onboarding',
		children: [
			{ value: 'team', label: 'Invite customer-success team', type: 'task', completed: true },
			{ value: 'health-score', label: 'Configure health score', type: 'task', completed: true },
			{ value: 'renewals', label: 'Connect renewal dates', type: 'task', completed: false },
			{ value: 'playbook', label: 'Publish risk playbook', type: 'task', completed: false },
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

const healthMetrics = [
	{ label: 'Healthy accounts', value: '82%', change: '+4.8%', detail: '204 of 248 accounts' },
	{ label: 'Needs attention', value: '12', change: '-3', detail: '4 require review today' },
	{ label: 'Expansion signal', value: '$42k', change: '+12%', detail: 'Potential annual revenue' },
];

const accounts = ref([
	{
		name: 'Northstar Labs',
		initials: 'NL',
		plan: 'Enterprise · renewal in 42 days',
		detail: 'Product adoption fell after the analytics team changed.',
		status: 'High risk',
		tone: 'danger',
		score: 38,
		trend: '−18',
		lastTouch: '6 days ago',
		owner: 'Maya Chen',
		ownerInitials: 'MC',
		reviewed: false,
	},
	{
		name: 'Meridian Health',
		initials: 'MH',
		plan: 'Growth · renewal in 73 days',
		detail: 'Two champions have not completed onboarding.',
		status: 'At risk',
		tone: 'warning',
		score: 54,
		trend: '−9',
		lastTouch: 'Yesterday',
		owner: 'Alex Morgan',
		ownerInitials: 'AM',
		reviewed: false,
	},
	{
		name: 'Willow Finance',
		initials: 'WF',
		plan: 'Enterprise · renewal in 118 days',
		detail: 'API usage is healthy, but weekly active users are down.',
		status: 'Watch',
		tone: 'info',
		score: 67,
		trend: '−4',
		lastTouch: '3 hours ago',
		owner: 'Priya Shah',
		ownerInitials: 'PS',
		reviewed: false,
	},
	{
		name: 'Juniper Works',
		initials: 'JW',
		plan: 'Growth · renewal in 156 days',
		detail: 'Admin engagement recovered after a new success plan.',
		status: 'Recovering',
		tone: 'success',
		score: 74,
		trend: '+11',
		lastTouch: '35 minutes ago',
		owner: 'Maya Chen',
		ownerInitials: 'MC',
		reviewed: false,
	},
]);

const activity = [
	{ actor: 'MC', title: 'Maya added a Northstar review note', meta: '12 minutes ago' },
	{ actor: 'AM', title: 'Alex scheduled a Meridian check-in', meta: '48 minutes ago' },
	{ actor: 'PS', title: 'Priya updated the Willow success plan', meta: '2 hours ago' },
	{ actor: 'AT', title: 'Atlas automation recalculated 248 scores', meta: 'Today, 09:30' },
];

const activePage = ref(navigationGroups[0].items[1]);
const reportingPeriod = ref('30');
const mobileNavigationOpen = ref(false);
const reviewDialogOpen = ref(false);
const selectedAccount = ref(null);
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
 * Select a destination and dismiss the temporary mobile navigation.
 *
 * @param {{ id: string, label: string, description: string, icon: string }} page Navigation destination.
 * @returns {void}
 */
function selectPage(page) {
	activePage.value = page;
	mobileNavigationOpen.value = false;
	interfaceNotice.value = '';
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
 * Start an account review from either the primary action or an account row.
 *
 * @param {Object} [account] Account to place into the review dialog.
 * @returns {void}
 */
function startReview(account = accounts.value.find((item) => !item.reviewed)) {
	selectPage(navigationGroups[0].items[1]);
	selectedAccount.value = account || accounts.value[0];
	reviewDialogOpen.value = true;
}

/**
 * Close the account review without changing its completion state.
 *
 * @returns {void}
 */
function closeReview() {
	reviewDialogOpen.value = false;
}

/**
 * Mark the selected account review as complete and update its visible status.
 *
 * @returns {void}
 */
function completeReview() {
	if (!selectedAccount.value) return;
	const wasReviewed = selectedAccount.value.reviewed;
	selectedAccount.value.reviewed = true;
	selectedAccount.value.status = 'Reviewed';
	selectedAccount.value.tone = 'success';
	if (!wasReviewed) openReviewCount.value = Math.max(0, openReviewCount.value - 1);
	interfaceNotice.value = `${selectedAccount.value.name} is reviewed and ready for the next customer-success action.`;
	reviewDialogOpen.value = false;
}

/**
 * Simulate preparing the current health report for export.
 *
 * @returns {void}
 */
function prepareExport() {
	interfaceNotice.value = 'The customer health report is ready to download.';
}

/**
 * Reflect profile-menu actions in the demo without navigating away.
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
	<div class="h-dvh min-h-[36rem] overflow-hidden bg-canvas text-canvas-fg">
		<div class="grid h-full min-w-0 grid-rows-[minmax(0,1fr)] md:grid-cols-[17rem_minmax(0,1fr)]">
			<aside class="hidden min-h-0 min-w-0 flex-col border-r border-border bg-secondary/55 md:flex">
				<div class="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
					<DomAvatar name="Atlas Studio" initials="AS" size="sm" shape="rounded" />
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold">Atlas Studio</p>
						<p class="truncate text-xs text-muted-fg">Customer success</p>
					</div>
				</div>

				<div class="shrink-0 px-3 pt-3">
					<DomButton class="w-full justify-start" size="sm" @click="startReview()">
						Review next account
					</DomButton>
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
								class="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition"
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
								<span
									v-if="item.count"
									class="grid min-w-5 place-items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.68rem] font-semibold text-primary"
								>
									{{ item.count === 'reviews' ? openReviewCount : item.count }}
								</span>
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
				<header class="flex h-16 shrink-0 items-center gap-3 border-b border-border px-3 md:hidden">
					<DomIconButton
						:icon="MENU_ICON"
						label="Open workspace navigation"
						size="sm"
						:aria-expanded="mobileNavigationOpen ? 'true' : 'false'"
						@click="openMobileNavigation"
					/>
					<div class="flex min-w-0 flex-1 items-center gap-2.5">
						<DomAvatar name="Atlas Studio" initials="AS" size="xs" shape="rounded" />
						<div class="min-w-0">
							<p class="truncate text-sm font-semibold">Atlas Studio</p>
							<p class="truncate text-[0.68rem] text-muted-fg">{{ activePage.label }}</p>
						</div>
					</div>
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
					<div class="mx-auto w-full max-w-[96rem] p-4 sm:p-6 lg:p-8">
						<div class="flex flex-col gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
							<div class="max-w-2xl">
								<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Customer success</p>
								<h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{{ activePage.label }}</h1>
								<p class="mt-2 text-sm leading-6 text-muted-fg">
									{{ activePage.id === 'health'
										? 'Prioritise accounts that need a human check-in before risk becomes churn.'
										: activePage.description + '. This destination is included to demonstrate working shell navigation.' }}
								</p>
							</div>

							<div v-if="activePage.id === 'health'" class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
								<DomSelect
									v-model="reportingPeriod"
									label="Reporting period"
									:options="periodOptions"
									class="w-full sm:w-56"
									align="right"
									width="min-w-[18rem]"
								>
									<template #option="{ option }">
										<span class="block">
											<span class="block text-sm font-medium">{{ option.label }}</span>
											<span class="mt-0.5 block text-xs text-muted-fg">{{ option.description }}</span>
										</span>
									</template>
								</DomSelect>
								<DomButton variant="secondary" size="sm" @click="prepareExport">
									Export report
								</DomButton>
							</div>
						</div>

						<p
							v-if="interfaceNotice"
							class="mt-5 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success"
							role="status"
						>
							{{ interfaceNotice }}
						</p>

						<template v-if="activePage.id === 'health'">
							<section class="mt-7 border-y border-border" aria-labelledby="health-summary-heading">
								<h2 id="health-summary-heading" class="sr-only">Customer health summary</h2>
								<div class="grid sm:grid-cols-3">
									<div
										v-for="(metric, index) in healthMetrics"
										:key="metric.label"
										class="py-5 sm:px-5 sm:first:pl-0 sm:last:pr-0"
										:class="index ? 'border-t border-border sm:border-l sm:border-t-0' : ''"
									>
										<div class="flex items-baseline justify-between gap-3">
											<p class="text-sm font-medium text-muted-fg">{{ metric.label }}</p>
											<span class="text-xs font-semibold text-success">{{ metric.change }}</span>
										</div>
										<p class="mt-2 text-3xl font-semibold tracking-tight">{{ metric.value }}</p>
										<p class="mt-1 text-xs text-muted-fg">
											{{ metric.label === 'Needs attention' ? `${openReviewCount} require review today` : metric.detail }}
										</p>
									</div>
								</div>
							</section>

							<div class="mt-8 grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
								<section class="min-w-0" aria-labelledby="accounts-heading">
									<div class="flex flex-wrap items-end justify-between gap-3">
										<div>
											<div class="flex items-center gap-2">
												<h2 id="accounts-heading" class="text-lg font-semibold tracking-tight">Accounts needing attention</h2>
												<DomStatusPill tone="warning" :label="`${openReviewCount} open`" size="sm" :dot="false" />
											</div>
											<p class="mt-1 text-sm text-muted-fg">Ordered by health risk and renewal proximity.</p>
										</div>
										<DomButton size="sm" @click="startReview()">Review next</DomButton>
									</div>

									<DomCard class="mt-4" padding="none">
										<ul class="divide-y divide-border" aria-label="Accounts requiring health review">
											<li v-for="account in accounts" :key="account.name" class="p-4 sm:p-5">
												<div class="flex min-w-0 items-start gap-3">
													<DomAvatar :name="account.name" :initials="account.initials" size="sm" shape="rounded" />
													<div class="min-w-0 flex-1">
														<div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
															<h3 class="truncate text-sm font-semibold">{{ account.name }}</h3>
															<DomStatusPill :tone="account.tone" :label="account.status" size="sm" />
														</div>
														<p class="mt-0.5 text-xs text-muted-fg">{{ account.plan }}</p>
														<p class="mt-2 text-sm leading-6 text-muted-fg">{{ account.detail }}</p>

														<dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-4">
															<div>
																<dt class="text-muted-fg">Health score</dt>
																<dd class="mt-1 font-semibold">{{ account.score }}/100</dd>
															</div>
															<div>
																<dt class="text-muted-fg">30-day trend</dt>
																<dd class="mt-1 font-semibold" :class="account.trend.startsWith('+') ? 'text-success' : 'text-destructive'">
																	{{ account.trend }}
																</dd>
															</div>
															<div>
																<dt class="text-muted-fg">Last touch</dt>
																<dd class="mt-1 font-semibold">{{ account.lastTouch }}</dd>
															</div>
															<div>
																<dt class="text-muted-fg">Owner</dt>
																<dd class="mt-1 flex items-center gap-1.5 font-semibold">
																	<DomAvatar :name="account.owner" :initials="account.ownerInitials" size="xs" />
																	<span class="truncate">{{ account.owner }}</span>
																</dd>
															</div>
														</dl>
													</div>
												</div>
												<div class="mt-4 flex justify-end">
													<DomButton
														:variant="account.reviewed ? 'secondary' : 'primary'"
														size="sm"
														@click="startReview(account)"
													>
														{{ account.reviewed ? 'Review again' : 'Review account' }}
													</DomButton>
												</div>
											</li>
										</ul>
									</DomCard>
								</section>

								<aside class="min-w-0 xl:border-l xl:border-border xl:pl-8" aria-labelledby="activity-heading">
									<div class="flex items-center justify-between gap-3">
										<h2 id="activity-heading" class="text-lg font-semibold tracking-tight">Recent activity</h2>
										<DomStatusPill tone="success" label="Live" size="sm" pulse />
									</div>
									<ol class="mt-4 space-y-5">
										<li v-for="item in activity" :key="item.title" class="flex gap-3">
											<DomAvatar :name="item.actor" :initials="item.actor" size="xs" />
											<div class="min-w-0">
												<p class="text-sm leading-5">{{ item.title }}</p>
												<p class="mt-1 text-xs text-muted-fg">{{ item.meta }}</p>
											</div>
										</li>
									</ol>
									<DomButton class="mt-5" variant="secondary" size="sm" @click="selectPage(navigationGroups[1].items[0])">
										View assigned tasks
									</DomButton>
								</aside>
							</div>
						</template>

						<DomEmptyState
							v-else
							class="mt-8"
							:title="`${activePage.label} is ready to compose`"
							:description="`The shell has switched to ${activePage.label.toLowerCase()}. Replace this focused placeholder with the matching DOM Studio data, form, or workflow components.`"
							:icon="activePage.icon"
							align="left"
							size="lg"
						>
							<template #actions>
								<DomButton @click="selectPage(navigationGroups[0].items[1])">Return to customer health</DomButton>
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
						<p class="truncate text-xs text-muted-fg">Customer success</p>
					</div>
				</div>
			</template>

			<div class="flex h-full min-h-0 flex-col">
				<div class="shrink-0 px-4 pt-4">
					<DomButton class="w-full justify-start" size="sm" @click="startReview()">
						Review next account
					</DomButton>
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
								<span
									v-if="item.count"
									class="grid min-w-5 place-items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.68rem] font-semibold text-primary"
								>
									{{ item.count === 'reviews' ? openReviewCount : item.count }}
								</span>
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

		<DomDialog
			v-model="reviewDialogOpen"
			:title="selectedAccount ? `Review ${selectedAccount.name}` : 'Review account'"
			description="Capture the next human action before this account moves further into risk."
			size="lg"
		>
			<div v-if="selectedAccount" class="space-y-5">
				<div class="flex items-start gap-3 rounded-xl bg-secondary/60 p-4">
					<DomAvatar :name="selectedAccount.name" :initials="selectedAccount.initials" size="md" shape="rounded" />
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-2">
							<p class="font-semibold">{{ selectedAccount.name }}</p>
							<DomStatusPill :tone="selectedAccount.tone" :label="selectedAccount.status" size="sm" />
						</div>
						<p class="mt-1 text-sm text-muted-fg">{{ selectedAccount.plan }}</p>
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Why this surfaced</p>
						<p class="mt-2 text-sm leading-6">{{ selectedAccount.detail }}</p>
					</div>
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Suggested next step</p>
						<p class="mt-2 text-sm leading-6">Schedule a 30-minute outcome review with the account champion and owner.</p>
					</div>
				</div>

				<div class="border-t border-border pt-4">
					<p class="text-sm font-medium">Review checklist</p>
					<ul class="mt-3 space-y-2 text-sm text-muted-fg">
						<li class="flex items-center gap-2">
							<DomStatusPill tone="success" label="Usage signals checked" size="sm" />
						</li>
						<li class="flex items-center gap-2">
							<DomStatusPill tone="success" label="Account owner confirmed" size="sm" />
						</li>
						<li class="flex items-center gap-2">
							<DomStatusPill tone="warning" label="Customer follow-up needed" size="sm" />
						</li>
					</ul>
				</div>
			</div>

			<template #footer>
				<DomButton variant="secondary" @click="closeReview">Not now</DomButton>
				<DomButton @click="completeReview">Mark review complete</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
