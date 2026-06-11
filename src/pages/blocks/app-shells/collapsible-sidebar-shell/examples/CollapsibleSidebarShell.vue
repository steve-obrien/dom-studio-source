<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomEmailInput, DomNativeSelect, DomTextInput, DomTooltip, DomUrlInput } from '@getdom/studio/vue';
import AppLayoutSidebar from './AppLayoutSidebar.vue';

const navItems = [
	{ id: 'dashboard', label: 'Dashboard', icon: 'M4 5h6v6H4V5Zm10 0h6v6h-6V5ZM4 15h6v4H4v-4Zm10 0h6v4h-6v-4Z' },
	{ id: 'websites', label: 'Websites', icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.2-2.2 3.4-5.2 3.4-9S14.2 5.2 12 3m0 18c-2.2-2.2-3.4-5.2-3.4-9S9.8 5.2 12 3M3.6 9h16.8M3.6 15h16.8' },
	{ id: 'planner', label: 'Planner', icon: 'M7 3v3m10-3v3M4.5 8h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm3 7h2m2 0h2m-6 4h2m2 0h2' },
	{ id: 'social', label: 'Social Studio', icon: 'M18 8a3 3 0 1 0-2.8-4.1M6 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 11.3l6.8 4.4M15.5 7.4 8.5 9.6' },
];

const stats = [
	{ label: 'Tracked keywords', value: '31', color: 'text-teal-600', icon: 'M10.5 18a7.5 7.5 0 1 1 5.3-2.2L21 21' },
	{ label: 'Planned articles', value: '30', color: 'text-indigo-600', icon: 'M7 3v3m10-3v3M5 8h14M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm3 7h2m2 0h2m-6 4h2m2 0h2' },
	{ label: 'Monthly usage', value: 'usage', color: 'text-orange-600', icon: 'M8 3h6l4 4v14H8V3Zm6 0v5h4M10.5 12h5M10.5 16h5' },
	{ label: 'Publishing', value: 'None', color: 'text-emerald-600', icon: 'M8 13a4 4 0 0 1 0-5m8 0a4 4 0 0 1 0 5M5.5 16.5a8 8 0 0 1 0-12m13 0a8 8 0 0 1 0 12M12 10v10' },
];

const plannerItems = [
	{ id: 'flex-services', date: 'Wed 10 Jun', type: 'Guide', title: 'Flex Services', searches: 1769, difficulty: 27, opportunity: 58 },
	{ id: 'agency-tips', date: 'Thu 11 Jun', type: 'Listicle', title: 'Agency Tips', searches: 1820, difficulty: 34, opportunity: 57 },
	{ id: 'digital-examples', date: 'Fri 12 Jun', type: 'Educational', title: 'Digital Examples', searches: 1360, difficulty: 23, opportunity: 56 },
	{ id: 'flex-mistakes', date: 'Sat 13 Jun', type: 'Comparison', title: 'Flex Mistakes', searches: 1679, difficulty: 38, opportunity: 56 },
	{ id: 'flex-audit', date: 'Sun 14 Jun', type: 'FAQ', title: 'Flex Audit', searches: 2027, difficulty: 48, opportunity: 56 },
	{ id: 'flex-agency', date: 'Mon 15 Jun', type: 'Guide', title: 'Flex Agency', searches: 1133, difficulty: 19, opportunity: 56 },
];

const roleOptions = [
	{ label: 'Editor', value: 'editor' },
	{ label: 'Admin', value: 'admin' },
	{ label: 'Viewer', value: 'viewer' },
];

const providerOptions = [
	{ label: 'Webhook', value: 'webhook' },
	{ label: 'WordPress', value: 'wordpress' },
	{ label: 'Custom API', value: 'custom-api' },
];

const collapsed = ref(false);
const activeNav = ref('planner');
const usageCount = ref(0);
const generatedIds = ref([]);
const inviteEmail = ref('colleague@example.com');
const inviteRole = ref('editor');
const provider = ref('webhook');
const webhookUrl = ref('https://example.com/webhook');
const accessToken = ref('standard-token');
const integrationState = ref('Ready');
const teamMembers = ref([
	{ id: 'steve', name: 'Steve', email: 'steven.a.obrien@gmail.com', role: 'owner', state: 'active' },
	{ id: 'test', name: 'Test User', email: 'test@example.com', role: 'owner', state: 'active' },
	{ id: 'pending', name: 'pending@example.com', email: 'Pending', role: 'editor', state: 'pending' },
]);

const activeSection = computed(() => navItems.find((item) => item.id === activeNav.value)?.label || 'Planner');
const usageValue = computed(() => `${usageCount.value} / 30`);

function toggleSidebar(event) {
	collapsed.value = !collapsed.value;
	event?.currentTarget?.blur();
}

function selectNav(item) {
	activeNav.value = item.id;
}

function navButtonClass(item) {
	const active = item.id === activeNav.value;
	return [
		'group flex h-9 items-center rounded-md text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
		collapsed.value ? 'mx-auto w-9 justify-center' : 'w-full gap-2 px-2 text-left',
		active ? 'bg-secondary text-fg' : 'text-muted-fg hover:bg-secondary hover:text-fg',
	];
}

function generateArticle(item) {
	if (!generatedIds.value.includes(item.id)) {
		generatedIds.value = [...generatedIds.value, item.id];
		usageCount.value = Math.min(30, usageCount.value + 1);
	}
}

function isGenerated(item) {
	return generatedIds.value.includes(item.id);
}

function inviteUser() {
	const email = inviteEmail.value.trim();
	if (!email) return;

	teamMembers.value = [
		...teamMembers.value,
		{
			id: `${email}-${Date.now()}`,
			name: email,
			email: 'Pending',
			role: inviteRole.value,
			state: 'pending',
		},
	];
	inviteEmail.value = '';
}

function removeMember(member) {
	teamMembers.value = teamMembers.value.filter((item) => item.id !== member.id);
}

function saveIntegration() {
	integrationState.value = 'Saved';
}
</script>

<template>
	<AppLayoutSidebar :collapsed="collapsed">
		<template #sidebar>
			<div class="flex h-16 items-center border-b border-border px-3" :class="collapsed ? 'justify-center' : 'gap-3'">
				<span class="grid size-8 shrink-0 place-items-center rounded-md bg-fg text-sm font-bold text-background">F</span>
				<div v-if="!collapsed" class="min-w-0">
					<p class="truncate text-sm font-semibold">Flex SEO Agent</p>
					<p class="truncate text-xs text-muted-fg">by Flex Digital</p>
				</div>
			</div>

			<div class="border-b border-border p-3">
				<button
					type="button"
					class="flex h-11 w-full items-center rounded-md text-left transition hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
					:class="collapsed ? 'justify-center' : 'gap-3 px-2'"
				>
					<span class="grid size-8 shrink-0 place-items-center rounded-md bg-fg text-sm font-bold text-background">F</span>
					<span v-if="!collapsed" class="min-w-0 flex-1">
						<span class="block truncate text-sm font-semibold">Flex Digital</span>
						<span class="block truncate text-xs text-muted-fg">https://flex-digital.net</span>
					</span>
					<svg v-if="!collapsed" class="size-4 shrink-0 text-muted-fg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="m8 10 4-4 4 4m0 4-4 4-4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>

			<nav class="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Workspace navigation">
				<p v-if="!collapsed" class="px-2 pb-1 text-xs font-semibold text-muted-fg">Platform</p>
				<template v-for="item in navItems" :key="item.id">
					<DomTooltip v-if="collapsed" :text="item.label" placement="right">
						<button
							type="button"
							:class="navButtonClass(item)"
							:aria-label="item.label"
							:aria-current="item.id === activeNav ? 'page' : undefined"
							@click="selectNav(item)"
						>
							<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path :d="item.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</button>
					</DomTooltip>
					<button
						v-else
						type="button"
						:class="navButtonClass(item)"
						:aria-current="item.id === activeNav ? 'page' : undefined"
						@click="selectNav(item)"
					>
						<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path :d="item.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
						<span class="truncate">{{ item.label }}</span>
					</button>
				</template>
			</nav>

			<div class="space-y-2 border-t border-border p-3">
				<DomTooltip :text="collapsed ? 'Flex Digital workspace' : 'Current workspace'" placement="right">
					<button
						type="button"
						class="flex h-9 w-full items-center rounded-md text-sm text-muted-fg transition hover:bg-secondary hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
						:class="collapsed ? 'justify-center' : 'gap-2 px-2 text-left'"
						:aria-label="collapsed ? 'Flex Digital workspace' : undefined"
					>
						<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2-2.1 3-5.1 3-9s-1-6.9-3-9m0 18c-2-2.1-3-5.1-3-9s1-6.9 3-9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
						<span v-if="!collapsed" class="truncate">Flex Digital</span>
					</button>
				</DomTooltip>
				<button
					type="button"
					class="flex h-10 w-full items-center rounded-md text-sm transition hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
					:class="collapsed ? 'justify-center' : 'gap-2 px-2 text-left'"
				>
					<span class="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-xs font-semibold text-fg">S</span>
					<span v-if="!collapsed" class="min-w-0 flex-1 truncate">Steve</span>
					<svg v-if="!collapsed" class="size-4 shrink-0 text-muted-fg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="m8 10 4-4 4 4m0 4-4 4-4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>
		</template>

		<template #content>
			<header class="flex h-16 items-center justify-between border-b border-border px-4">
				<button
					type="button"
					class="grid size-8 place-items-center rounded-md text-muted-fg transition hover:bg-secondary hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
					:aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
					:title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
					@click="toggleSidebar"
				>
					<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="M4 5h16v14H4V5Zm5 0v14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
						<path :d="collapsed ? 'm13 9 3 3-3 3' : 'm16 9-3 3 3 3'" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
				<p class="text-xs font-medium text-muted-fg">{{ activeSection }}</p>
			</header>

			<div class="h-[calc(100vh-4rem)] overflow-y-auto">
				<section class="px-4 py-5 sm:px-6">
					<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
						<div class="min-w-0">
							<p class="truncate text-sm text-muted-fg">https://flex-digital.net</p>
							<h1 class="mt-1 text-3xl font-semibold">Flex Digital</h1>
							<p class="mt-2 text-sm text-muted-fg">Digital agency SEO automation.</p>
						</div>
						<div class="flex flex-wrap gap-2">
							<DomButton variant="secondary" size="sm">Start Stripe trial</DomButton>
							<DomButton variant="secondary" size="sm">Refresh</DomButton>
						</div>
					</div>

					<div class="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
						<article
							v-for="stat in stats"
							:key="stat.label"
							class="rounded-md border border-border bg-background p-5 shadow-sm"
						>
							<svg class="size-5" :class="stat.color" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path :d="stat.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
							<p class="mt-4 text-sm text-muted-fg">{{ stat.label }}</p>
							<p class="mt-1 text-2xl font-semibold">{{ stat.value === 'usage' ? usageValue : stat.value }}</p>
						</article>
					</div>

					<div class="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
						<section class="min-w-0">
							<div class="flex items-end justify-between gap-4">
								<h2 class="text-xl font-semibold">Content planner</h2>
								<p class="hidden text-sm text-muted-fg sm:block">Sorted by planned date</p>
							</div>

							<div class="mt-3 space-y-3">
								<article
									v-for="item in plannerItems"
									:key="item.id"
									class="flex flex-col gap-4 rounded-md border border-border bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
								>
									<div class="min-w-0">
										<p class="text-xs font-semibold uppercase text-muted-fg">{{ item.date }} - {{ item.type }}</p>
										<h3 class="mt-2 text-base font-semibold">{{ item.title }}</h3>
										<p class="mt-1 text-sm text-muted-fg">
											{{ item.searches }} monthly searches - difficulty {{ item.difficulty }} - opportunity {{ item.opportunity }}
										</p>
									</div>
									<div class="flex shrink-0 gap-2">
										<DomButton variant="secondary" size="sm">Instructions</DomButton>
										<DomButton
											:variant="isGenerated(item) ? 'secondary' : 'primary'"
											size="sm"
											@click="generateArticle(item)"
										>
											{{ isGenerated(item) ? 'Queued' : 'Generate' }}
										</DomButton>
									</div>
								</article>
							</div>
						</section>

						<aside class="space-y-4">
							<section class="rounded-md border border-border bg-background p-4 shadow-sm">
								<div class="flex items-start justify-between gap-3">
									<div>
										<h2 class="text-lg font-semibold">Team access</h2>
										<p class="mt-1 text-sm text-muted-fg">Invite people to work on this website workspace.</p>
									</div>
									<svg class="size-5 shrink-0 text-teal-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<path d="M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 12-7m2-1v6m-3-3h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</div>
								<div class="mt-4 space-y-3">
									<DomEmailInput v-model="inviteEmail" label="Email address" placeholder="colleague@example.com" />
									<DomNativeSelect v-model="inviteRole" label="Role" :options="roleOptions" />
									<DomButton size="sm" @click="inviteUser">
										<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
											<path d="M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 12-7m2-1v6m-3-3h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
										</svg>
										Invite user
									</DomButton>
								</div>

								<div class="mt-4 space-y-2">
									<div
										v-for="member in teamMembers"
										:key="member.id"
										class="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
										:class="member.state === 'pending' && 'border-dashed'"
									>
										<div class="min-w-0">
											<p class="truncate text-sm font-semibold">{{ member.name }}</p>
											<p class="truncate text-xs text-muted-fg">{{ member.email }} - {{ member.role }}</p>
										</div>
										<button
											v-if="member.id !== 'steve'"
											type="button"
											class="grid size-8 shrink-0 place-items-center rounded-md text-muted-fg transition hover:bg-secondary hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
											:aria-label="`Remove ${member.name}`"
											@click="removeMember(member)"
										>
											<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
												<path d="M6 7h12m-10 0 .8 13h6.4L16 7M10 7V4h4v3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
											</svg>
										</button>
										<svg v-else class="size-4 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
											<path d="m5 12 4 4L19 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
										</svg>
									</div>
								</div>
							</section>

							<section class="rounded-md border border-border bg-background p-4 shadow-sm">
								<h2 class="text-lg font-semibold">Publishing integration</h2>
								<p class="mt-1 text-sm text-muted-fg">One integration per website. Webhook supports publish and update events now.</p>
								<div class="mt-4 space-y-3">
									<DomNativeSelect v-model="provider" label="Provider" :options="providerOptions" />
									<DomUrlInput v-model="webhookUrl" label="Webhook URL" />
									<DomTextInput v-model="accessToken" label="Access token" />
									<div class="flex items-center justify-between gap-3">
										<span class="text-sm font-medium text-muted-fg">Status: {{ integrationState }}</span>
										<DomButton variant="secondary" size="sm" @click="saveIntegration">Save</DomButton>
									</div>
								</div>
							</section>
						</aside>
					</div>
				</section>
			</div>
		</template>
	</AppLayoutSidebar>
</template>
