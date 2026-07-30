<script setup>
import { computed, ref } from 'vue';
import {
	DomAvatar,
	DomButton,
	DomCard,
	DomEmailInput,
	DomIconButton,
	DomPasswordInput,
	DomSelect,
	DomStatusPill,
	DomUrlInput,
	vDomTooltip,
} from '@getdom/studio/vue';
import { builtInIconSelectorItems } from '../../../../forms/icon-selector/iconSelectorItems.js';
import AppLayoutSidebar from './AppLayoutSidebar.vue';
import AppUserMenu from './AppUserMenu.vue';

const DELETE_ICON = iconPath('Close');
const CHEVRON_DOWN_ICON = iconPath('Chevron down');

const navItems = [
	{ id: 'dashboard', label: 'Dashboard', icon: iconPath('Dashboard') },
	{ id: 'websites', label: 'Websites', icon: iconPath('Globe') },
	{ id: 'planner', label: 'Content planner', icon: iconPath('Calendar') },
	{ id: 'publishing', label: 'Publishing', icon: iconPath('Upload') },
];

const metrics = [
	{ label: 'Tracked keywords', value: '31', context: '8 moved this week' },
	{ label: 'Articles planned', value: '12', context: 'Across the next 14 days' },
	{ label: 'Monthly usage', value: 'usage', context: 'Article generations' },
];

const plannerItems = [
	{ id: 'service-pages', date: '10 Jun', type: 'Guide', title: 'A practical guide to service pages', searches: 1769, difficulty: 27, status: 'Ready' },
	{ id: 'agency-tips', date: '11 Jun', type: 'Listicle', title: 'Seven agency reporting habits', searches: 1820, difficulty: 34, status: 'Needs brief' },
	{ id: 'content-audit', date: '12 Jun', type: 'Playbook', title: 'Run a useful content audit', searches: 1360, difficulty: 23, status: 'Ready' },
	{ id: 'seo-mistakes', date: '13 Jun', type: 'Comparison', title: 'SEO mistakes that slow growth', searches: 1679, difficulty: 38, status: 'Ready' },
];

const roleOptions = [
	{ label: 'Editor', value: 'editor', description: 'Can plan, generate, and edit content.' },
	{ label: 'Admin', value: 'admin', description: 'Can also manage people and integrations.' },
	{ label: 'Viewer', value: 'viewer', description: 'Read-only access to this workspace.' },
];

const providerOptions = [
	{ label: 'Webhook', value: 'webhook', description: 'Send signed publish and update events.' },
	{ label: 'WordPress', value: 'wordpress', description: 'Publish directly to a connected site.' },
	{ label: 'Custom API', value: 'custom-api', description: 'Use your own content delivery endpoint.' },
];

const collapsed = ref(false);
const activeNav = ref('planner');
const usageCount = ref(7);
const generatedIds = ref([]);
const inviteEmail = ref('colleague@example.com');
const inviteRole = ref('editor');
const provider = ref('webhook');
const webhookUrl = ref('https://example.com/hooks/content');
const accessToken = ref('studio-demo-token');
const integrationState = ref('Ready');
const teamMembers = ref([
	{ id: 'steve', name: 'Steve O’Brien', email: 'steve@example.com', role: 'Owner', state: 'active' },
	{ id: 'maya', name: 'Maya Chen', email: 'maya@example.com', role: 'Editor', state: 'active' },
]);

const activeSection = computed(() => navItems.find((item) => item.id === activeNav.value)?.label || 'Content planner');
const usageValue = computed(() => `${usageCount.value} / 30`);

/**
 * Resolve an icon from DOM Studio's built-in icon inventory.
 *
 * @param {string} label Built-in icon label.
 * @returns {string} SVG path data accepted by DomIconButton.
 */
function iconPath(label) {
	return builtInIconSelectorItems.find((item) => item.label === label)?.path || '';
}

/**
 * Mark the selected application destination while preserving the link's
 * native semantics for modifier clicks and context menus.
 *
 * @param {{ id: string }} item Navigation destination.
 * @returns {void}
 */
function selectNav(item) {
	activeNav.value = item.id;
}

/**
 * Assemble responsive navigation styles for expanded, collapsed, and drawer
 * presentations.
 *
 * @param {{ id: string }} item Navigation destination.
 * @param {boolean} sidebarCollapsed Whether the desktop rail is collapsed.
 * @param {boolean} mobile Whether the navigation is rendered in the drawer.
 * @returns {Array<string|boolean>} Classes for the destination link.
 */
function navLinkClass(item, sidebarCollapsed, mobile) {
	const showLabel = !sidebarCollapsed || mobile;
	return [
		'group flex min-h-10 items-center rounded-xl text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-ring/60',
		showLabel ? 'w-full gap-3 px-3' : 'mx-auto w-10 justify-center',
		item.id === activeNav.value
			? 'bg-canvas text-canvas-fg shadow-sm ring-1 ring-border/70'
			: 'text-muted-fg hover:bg-canvas/70 hover:text-canvas-fg',
	];
}

/**
 * Queue a planned article once and update the visible usage total.
 *
 * @param {{ id: string }} item Planner item to generate.
 * @returns {void}
 */
function generateArticle(item) {
	if (generatedIds.value.includes(item.id)) return;
	generatedIds.value = [...generatedIds.value, item.id];
	usageCount.value = Math.min(30, usageCount.value + 1);
}

/**
 * Determine whether a planner item has already been queued.
 *
 * @param {{ id: string }} item Planner item to inspect.
 * @returns {boolean} Whether generation has been requested.
 */
function isGenerated(item) {
	return generatedIds.value.includes(item.id);
}

/**
 * Add a pending workspace member from the invite controls.
 *
 * @returns {void}
 */
function inviteUser() {
	const email = inviteEmail.value.trim();
	if (!email) return;

	teamMembers.value = [
		...teamMembers.value,
		{
			id: `${email}-${Date.now()}`,
			name: email,
			email: 'Invitation pending',
			role: roleOptions.find((option) => option.value === inviteRole.value)?.label || 'Editor',
			state: 'pending',
		},
	];
	inviteEmail.value = '';
}

/**
 * Remove a non-owner workspace member from the example state.
 *
 * @param {{ id: string }} member Team member to remove.
 * @returns {void}
 */
function removeMember(member) {
	teamMembers.value = teamMembers.value.filter((item) => item.id !== member.id);
}

/**
 * Persist the example integration state and expose confirmation in the UI.
 *
 * @returns {void}
 */
function saveIntegration() {
	integrationState.value = 'Saved';
}
</script>

<template>
	<AppLayoutSidebar v-model:collapsed="collapsed">
		<template #brand="{ collapsed: sidebarCollapsed, mobile }">
			<div class="flex min-w-0 items-center gap-3" :class="sidebarCollapsed && !mobile ? 'justify-center' : ''">
				<DomAvatar name="Flex SEO Agent" initials="F" shape="rounded" size="sm" />
				<div v-if="!sidebarCollapsed || mobile" class="min-w-0">
					<p class="truncate text-sm font-semibold">Flex SEO Agent</p>
					<p class="truncate text-xs text-muted-fg">Flex Digital workspace</p>
				</div>
			</div>
		</template>

		<template #mobile-actions>
			<AppUserMenu layout="header" label="Open mobile user menu" />
		</template>

		<template #sidebar="{ collapsed: sidebarCollapsed, mobile }">
			<div class="flex h-full min-h-0 flex-col">
				<div class="border-b border-border p-3">
					<button
						type="button"
						class="flex min-h-11 w-full items-center rounded-xl outline-none transition hover:bg-canvas/70 focus-visible:ring-2 focus-visible:ring-ring/60"
						:class="sidebarCollapsed && !mobile ? 'justify-center' : 'gap-3 px-2 text-left'"
						:aria-label="sidebarCollapsed && !mobile ? 'Flex Digital workspace' : undefined"
					>
						<DomAvatar name="Flex Digital" initials="FD" shape="rounded" size="sm" />
						<span v-if="!sidebarCollapsed || mobile" class="min-w-0 flex-1">
							<span class="block truncate text-sm font-semibold">Flex Digital</span>
							<span class="block truncate text-xs text-muted-fg">flex-digital.net</span>
						</span>
						<DomIconButton
							v-if="!sidebarCollapsed || mobile"
							as="span"
							:icon="CHEVRON_DOWN_ICON"
							label=""
							size="xs"
							class="pointer-events-none"
							aria-hidden="true"
						/>
					</button>
				</div>

				<nav class="min-h-0 flex-1 space-y-1 overflow-y-auto p-3" aria-label="Workspace navigation">
					<p v-if="!sidebarCollapsed || mobile" class="px-3 pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Workspace</p>
					<a
						v-for="item in navItems"
						:key="item.id"
						v-dom-tooltip.right="sidebarCollapsed && !mobile ? item.label : null"
						:href="`#${item.id}`"
						:class="navLinkClass(item, sidebarCollapsed, mobile)"
						:aria-label="sidebarCollapsed && !mobile ? item.label : undefined"
						:aria-current="item.id === activeNav ? 'page' : undefined"
						@click="selectNav(item)"
					>
						<DomIconButton
							as="span"
							:icon="item.icon"
							label=""
							size="xs"
							class="pointer-events-none"
							aria-hidden="true"
						/>
						<span v-if="!sidebarCollapsed || mobile" class="truncate">{{ item.label }}</span>
					</a>
				</nav>

				<div class="border-t border-border p-3">
					<AppUserMenu
						:collapsed="sidebarCollapsed && !mobile"
						label="Open sidebar user menu"
					/>
				</div>
			</div>
		</template>

		<template #content>
			<header class="sticky top-0 z-10 hidden h-16 items-center justify-between border-b border-border bg-canvas/95 px-6 backdrop-blur md:flex">
				<div class="flex min-w-0 items-center gap-3">
					<p class="truncate text-sm font-semibold">{{ activeSection }}</p>
					<DomStatusPill tone="success" label="Workspace healthy" size="sm" />
				</div>
				<AppUserMenu layout="header" label="Open header user menu" />
			</header>

			<div class="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
				<section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div class="min-w-0">
						<p class="text-sm font-medium text-primary">flex-digital.net</p>
						<h1 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Plan the next publishing cycle</h1>
						<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">Review planned topics, invite editors, and keep delivery connected without leaving the workspace.</p>
					</div>
					<div class="flex shrink-0 flex-wrap gap-2">
						<DomButton variant="secondary" size="sm">Refresh data</DomButton>
						<DomButton size="sm">Add topic</DomButton>
					</div>
				</section>

				<DomCard as="section" padding="none" class="mt-6" aria-labelledby="workspace-metrics">
					<h2 id="workspace-metrics" class="sr-only">Workspace metrics</h2>
					<dl class="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
						<div v-for="metric in metrics" :key="metric.label" class="p-4 sm:p-5">
							<dt class="text-sm font-medium text-muted-fg">{{ metric.label }}</dt>
							<dd class="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{{ metric.value === 'usage' ? usageValue : metric.value }}</dd>
							<p class="mt-1 text-xs text-muted-fg">{{ metric.context }}</p>
						</div>
					</dl>
				</DomCard>

				<div class="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
					<DomCard as="section" padding="none" aria-labelledby="content-plan-heading">
						<div class="flex items-start justify-between gap-4 border-b border-border p-4 sm:p-5">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Next 7 days</p>
								<h2 id="content-plan-heading" class="mt-1 text-lg font-semibold">Content plan</h2>
							</div>
							<DomStatusPill tone="info" label="4 topics" size="sm" :dot="false" />
						</div>

						<div class="divide-y divide-border">
							<article
								v-for="item in plannerItems"
								:key="item.id"
								class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5"
							>
								<time class="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary text-xs font-semibold text-secondary-fg">
									<span>{{ item.date.split(' ')[0] }}</span>
									<span class="uppercase">{{ item.date.split(' ')[1] }}</span>
								</time>
								<div class="min-w-0 flex-1">
									<div class="flex flex-wrap items-center gap-2">
										<p class="truncate text-sm font-semibold">{{ item.title }}</p>
										<DomStatusPill
											:tone="item.status === 'Ready' ? 'success' : 'warning'"
											:label="item.status"
											size="sm"
											:dot="false"
										/>
									</div>
									<p class="mt-1 text-xs text-muted-fg">{{ item.type }} · {{ item.searches.toLocaleString() }} searches · difficulty {{ item.difficulty }}</p>
								</div>
								<DomButton
									class="w-full sm:w-auto"
									:variant="isGenerated(item) ? 'secondary' : 'primary'"
									size="sm"
									:disabled="item.status !== 'Ready'"
									@click="generateArticle(item)"
								>
									{{ isGenerated(item) ? 'Queued' : item.status === 'Ready' ? 'Generate' : 'Add brief' }}
								</DomButton>
							</article>
						</div>
					</DomCard>

					<aside class="space-y-5">
						<DomCard as="section" padding="p-4 sm:p-5" aria-labelledby="team-access-heading">
							<div class="flex items-start justify-between gap-3">
								<div>
									<h2 id="team-access-heading" class="text-lg font-semibold">Team access</h2>
									<p class="mt-1 text-sm leading-5 text-muted-fg">Invite an editor to this workspace.</p>
								</div>
								<DomStatusPill tone="neutral" :label="`${teamMembers.length} people`" size="sm" :dot="false" />
							</div>

							<div class="mt-4 space-y-3">
								<DomEmailInput v-model="inviteEmail" label="Email address" placeholder="colleague@example.com" />
								<DomSelect v-model="inviteRole" label="Role" :options="roleOptions" width="min-w-[18rem]">
									<template #option="{ option }">
										<div>
											<p class="font-medium">{{ option.label }}</p>
											<p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p>
										</div>
									</template>
								</DomSelect>
								<DomButton class="w-full" size="sm" @click="inviteUser">Send invitation</DomButton>
							</div>

							<ul class="mt-4 divide-y divide-border border-t border-border" aria-label="Workspace members">
								<li v-for="member in teamMembers" :key="member.id" class="flex items-center gap-3 py-3">
									<DomAvatar :name="member.name" size="sm" />
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-semibold">{{ member.name }}</p>
										<p class="truncate text-xs text-muted-fg">{{ member.email }} · {{ member.role }}</p>
									</div>
									<DomStatusPill v-if="member.state === 'pending'" tone="warning" label="Pending" size="sm" :dot="false" />
									<DomIconButton
										v-else-if="member.id !== 'steve'"
										:icon="DELETE_ICON"
										:label="`Remove ${member.name}`"
										size="xs"
										variant="ghost"
										@click="removeMember(member)"
									/>
								</li>
							</ul>
						</DomCard>

						<DomCard as="section" padding="p-4 sm:p-5" aria-labelledby="publishing-heading">
							<div class="flex items-start justify-between gap-3">
								<div>
									<h2 id="publishing-heading" class="text-lg font-semibold">Publishing</h2>
									<p class="mt-1 text-sm leading-5 text-muted-fg">Choose how approved content is delivered.</p>
								</div>
								<DomStatusPill :tone="integrationState === 'Saved' ? 'success' : 'info'" :label="integrationState" size="sm" />
							</div>

							<div class="mt-4 space-y-3">
								<DomSelect v-model="provider" label="Provider" :options="providerOptions" width="min-w-[19rem]">
									<template #option="{ option }">
										<div>
											<p class="font-medium">{{ option.label }}</p>
											<p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p>
										</div>
									</template>
								</DomSelect>
								<DomUrlInput v-model="webhookUrl" label="Webhook URL" />
								<DomPasswordInput v-model="accessToken" label="Access token" />
								<DomButton class="w-full" variant="secondary" size="sm" @click="saveIntegration">Save connection</DomButton>
							</div>
						</DomCard>
					</aside>
				</div>
			</div>
		</template>
	</AppLayoutSidebar>
</template>
