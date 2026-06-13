<script setup>
import { computed, ref, watch } from 'vue';
import {
	DomButton,
	DomDialog,
	DomNativeSelect,
	DomTabs,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const categoryOptions = [
	{ label: 'All categories', value: 'All' },
	{ label: 'CRM', value: 'CRM' },
	{ label: 'Support', value: 'Support' },
	{ label: 'Communication', value: 'Communication' },
	{ label: 'Data warehouse', value: 'Data warehouse' },
	{ label: 'Finance', value: 'Finance' },
];

const sortOptions = [
	{ label: 'Recommended', value: 'recommended' },
	{ label: 'Most installed', value: 'installs' },
	{ label: 'Newest', value: 'newest' },
];

const installTabs = [
	{ key: 'overview', label: 'Overview' },
	{ key: 'permissions', label: 'Permissions' },
	{ key: 'activity', label: 'Activity' },
];

const connectors = [
	{
		id: 'salesforce',
		name: 'Salesforce',
		category: 'CRM',
		description: 'Sync accounts, contacts, owners, opportunities, and lifecycle stages.',
		status: 'Installed',
		owner: 'Maya Chen',
		lastSyncAt: '8 minutes ago',
		health: 'Healthy',
		installCount: 18420,
		rating: '4.9',
		recommended: true,
		newest: false,
		accent: 'bg-sky-500',
		capabilities: ['Account enrichment', 'Opportunity signals', 'Two-way contacts'],
		metrics: [
			{ label: 'Success rate', value: '99.2%' },
			{ label: 'Records synced', value: '18.4k' },
			{ label: 'Next sync', value: '7m' },
		],
		scopes: [
			{ key: 'accounts.read', label: 'Read accounts', description: 'Import account names, domains, tiers, and owners.', enabled: true, required: true },
			{ key: 'contacts.read', label: 'Read contacts', description: 'Import contact names, emails, roles, and lifecycle status.', enabled: true, required: true },
			{ key: 'opportunities.read', label: 'Read opportunities', description: 'Use open pipeline for health and expansion signals.', enabled: true, required: false },
			{ key: 'contacts.write', label: 'Write contact updates', description: 'Push lifecycle stage and product activity updates back.', enabled: false, required: false },
		],
		activity: [
			{ label: '18,420 records synced', actor: 'Sync worker', time: '8 minutes ago', tone: 'success' },
			{ label: 'Opportunity scope enabled', actor: 'Maya Chen', time: 'Yesterday', tone: 'neutral' },
			{ label: 'OAuth token refreshed', actor: 'System', time: 'Jun 08', tone: 'neutral' },
		],
	},
	{
		id: 'zendesk',
		name: 'Zendesk',
		category: 'Support',
		description: 'Bring ticket volume, SLA state, CSAT, and customer support history into account views.',
		status: 'Needs review',
		owner: 'Support Ops',
		lastSyncAt: '2 hours ago',
		health: 'Permission issue',
		installCount: 12890,
		rating: '4.7',
		recommended: true,
		newest: false,
		accent: 'bg-emerald-500',
		capabilities: ['Ticket timeline', 'SLA alerts', 'Internal notes'],
		metrics: [
			{ label: 'Success rate', value: '91.7%' },
			{ label: 'Records synced', value: '4.8k' },
			{ label: 'Next sync', value: 'Paused' },
		],
		scopes: [
			{ key: 'tickets.read', label: 'Read tickets', description: 'Import ticket metadata, requester, tags, and SLA state.', enabled: true, required: true },
			{ key: 'users.read', label: 'Read users', description: 'Match requesters to contacts in the workspace.', enabled: true, required: true },
			{ key: 'comments.read', label: 'Read comments', description: 'Show recent conversation context in account timelines.', enabled: false, required: false },
			{ key: 'tickets.write', label: 'Write ticket notes', description: 'Create internal notes from customer success workflows.', enabled: false, required: false },
		],
		activity: [
			{ label: 'Sync paused after permission error', actor: 'Monitoring', time: '2 hours ago', tone: 'warning' },
			{ label: 'Tickets imported', actor: 'Sync worker', time: '4 hours ago', tone: 'success' },
			{ label: 'Admin notified for reconnect', actor: 'System', time: 'Today 09:20', tone: 'neutral' },
		],
	},
	{
		id: 'slack',
		name: 'Slack',
		category: 'Communication',
		description: 'Send alerts, route approvals, and create customer-room notifications.',
		status: 'Available',
		owner: 'Not connected',
		lastSyncAt: 'Never',
		health: 'Ready to install',
		installCount: 22800,
		rating: '4.8',
		recommended: true,
		newest: false,
		accent: 'bg-violet-500',
		capabilities: ['Approval routing', 'Channel alerts', 'Slash commands'],
		metrics: [
			{ label: 'Install type', value: 'OAuth' },
			{ label: 'Setup time', value: '4m' },
			{ label: 'Admin consent', value: 'Optional' },
		],
		scopes: [
			{ key: 'channels.read', label: 'Read channels', description: 'Select destinations for alerts and approvals.', enabled: true, required: true },
			{ key: 'chat.write', label: 'Send messages', description: 'Post workflow updates into selected channels.', enabled: true, required: true },
			{ key: 'users.read', label: 'Read workspace users', description: 'Map app users to Slack members for mentions.', enabled: false, required: false },
			{ key: 'commands.write', label: 'Install shortcuts', description: 'Add command shortcuts for support and approval actions.', enabled: false, required: false },
		],
		activity: [
			{ label: 'Connector reviewed by security', actor: 'Ari Grant', time: 'Jun 06', tone: 'neutral' },
			{ label: 'Install requested by Sales Ops', actor: 'Nina Patel', time: 'Jun 04', tone: 'neutral' },
			{ label: 'Provider catalog updated', actor: 'System', time: 'Jun 01', tone: 'neutral' },
		],
	},
	{
		id: 'bigquery',
		name: 'BigQuery',
		category: 'Data warehouse',
		description: 'Export product events, account snapshots, and billing state into warehouse tables.',
		status: 'Installed',
		owner: 'Data Platform',
		lastSyncAt: '22 minutes ago',
		health: 'Healthy',
		installCount: 9400,
		rating: '4.6',
		recommended: false,
		newest: false,
		accent: 'bg-amber-500',
		capabilities: ['Warehouse export', 'Schema checks', 'Daily compaction'],
		metrics: [
			{ label: 'Success rate', value: '98.6%' },
			{ label: 'Rows exported', value: '2.6m' },
			{ label: 'Next sync', value: '38m' },
		],
		scopes: [
			{ key: 'datasets.write', label: 'Write datasets', description: 'Create and update managed analytics datasets.', enabled: true, required: true },
			{ key: 'tables.write', label: 'Write tables', description: 'Append events and account snapshots to tables.', enabled: true, required: true },
			{ key: 'jobs.read', label: 'Read job status', description: 'Check export job state and surface failed runs.', enabled: true, required: false },
			{ key: 'datasets.read', label: 'Read datasets', description: 'Inspect existing schemas before migration.', enabled: false, required: false },
		],
		activity: [
			{ label: 'Export job completed', actor: 'Sync worker', time: '22 minutes ago', tone: 'success' },
			{ label: 'Schema drift warning resolved', actor: 'Data Platform', time: 'Yesterday', tone: 'success' },
			{ label: 'Hourly cadence enabled', actor: 'Maya Chen', time: 'Jun 07', tone: 'neutral' },
		],
	},
	{
		id: 'stripe',
		name: 'Stripe',
		category: 'Finance',
		description: 'Import subscription state, invoices, payment risk, and customer revenue metrics.',
		status: 'Available',
		owner: 'Not connected',
		lastSyncAt: 'Never',
		health: 'Ready to install',
		installCount: 17200,
		rating: '4.9',
		recommended: false,
		newest: true,
		accent: 'bg-indigo-500',
		capabilities: ['MRR snapshots', 'Invoice timeline', 'Payment status'],
		metrics: [
			{ label: 'Install type', value: 'API key' },
			{ label: 'Setup time', value: '6m' },
			{ label: 'Admin consent', value: 'Required' },
		],
		scopes: [
			{ key: 'customers.read', label: 'Read customers', description: 'Match billing customers to product accounts.', enabled: true, required: true },
			{ key: 'subscriptions.read', label: 'Read subscriptions', description: 'Import plan, renewal, and cancellation state.', enabled: true, required: true },
			{ key: 'invoices.read', label: 'Read invoices', description: 'Show open, paid, and failed invoice history.', enabled: true, required: false },
			{ key: 'webhooks.write', label: 'Create webhooks', description: 'Register billing event callbacks automatically.', enabled: false, required: false },
		],
		activity: [
			{ label: 'Provider added to marketplace', actor: 'Platform team', time: 'Today 11:08', tone: 'success' },
			{ label: 'Security review completed', actor: 'Risk review', time: 'Yesterday', tone: 'neutral' },
			{ label: 'Webhook templates published', actor: 'System', time: 'Jun 08', tone: 'neutral' },
		],
	},
	{
		id: 'hubspot',
		name: 'HubSpot',
		category: 'CRM',
		description: 'Map companies, contacts, deals, and marketing lifecycle stages into your workspace.',
		status: 'Available',
		owner: 'Not connected',
		lastSyncAt: 'Never',
		health: 'Ready to install',
		installCount: 15100,
		rating: '4.7',
		recommended: false,
		newest: true,
		accent: 'bg-orange-500',
		capabilities: ['Deal sync', 'Company fields', 'Marketing lifecycle'],
		metrics: [
			{ label: 'Install type', value: 'OAuth' },
			{ label: 'Setup time', value: '5m' },
			{ label: 'Admin consent', value: 'Required' },
		],
		scopes: [
			{ key: 'crm.objects.contacts.read', label: 'Read contacts', description: 'Import contact identity, lifecycle stage, and owner.', enabled: true, required: true },
			{ key: 'crm.objects.companies.read', label: 'Read companies', description: 'Import company firmographics and account ownership.', enabled: true, required: true },
			{ key: 'crm.objects.deals.read', label: 'Read deals', description: 'Bring pipeline amount and stage into customer health.', enabled: false, required: false },
			{ key: 'crm.objects.contacts.write', label: 'Write contact updates', description: 'Push product-qualified lifecycle changes back.', enabled: false, required: false },
		],
		activity: [
			{ label: 'Connector added to catalog', actor: 'Platform team', time: 'Today 08:30', tone: 'success' },
			{ label: 'Field mapping template drafted', actor: 'Solutions', time: 'Yesterday', tone: 'neutral' },
			{ label: 'OAuth app approved', actor: 'Security', time: 'Jun 09', tone: 'neutral' },
		],
	},
];

const selectedCategory = ref('All');
const selectedSort = ref('recommended');
const searchQuery = ref('');
const selectedConnectorId = ref(connectors[0].id);
const dialogOpen = ref(false);
const activeTab = ref('overview');
const selectedScopes = ref([]);
const scheduledSync = ref(true);
const installedIds = ref(connectors.filter((connector) => connector.status === 'Installed').map((connector) => connector.id));

const selectedConnector = computed(() => connectors.find((connector) => connector.id === selectedConnectorId.value) || connectors[0]);
const selectedRequiredCount = computed(() => selectedConnector.value.scopes.filter((scope) => scope.required && selectedScopes.value.includes(scope.key)).length);
const requiredScopeCount = computed(() => selectedConnector.value.scopes.filter((scope) => scope.required).length);
const optionalScopeCount = computed(() => selectedScopes.value.length - selectedRequiredCount.value);
const dialogStatus = computed(() => installedIds.value.includes(selectedConnector.value.id) ? 'Installed' : selectedConnector.value.status);
const primaryActionLabel = computed(() => {
	if (dialogStatus.value === 'Needs review') return 'Reconnect';
	if (dialogStatus.value === 'Installed') return 'Save settings';
	return 'Connect integration';
});
const filteredConnectors = computed(() => {
	const query = searchQuery.value.trim().toLowerCase();
	const filtered = connectors.filter((connector) => {
		const matchesCategory = selectedCategory.value === 'All' || connector.category === selectedCategory.value;
		const matchesQuery = !query || [
			connector.name,
			connector.category,
			connector.description,
			...connector.capabilities,
		].join(' ').toLowerCase().includes(query);

		return matchesCategory && matchesQuery;
	});

	return [...filtered].sort((a, b) => {
		if (selectedSort.value === 'installs') return b.installCount - a.installCount;
		if (selectedSort.value === 'newest') return Number(b.newest) - Number(a.newest);
		return Number(b.recommended) - Number(a.recommended) || b.installCount - a.installCount;
	});
});
const featuredConnectors = computed(() => connectors.filter((connector) => connector.recommended).slice(0, 3));
const installedCount = computed(() => installedIds.value.length);
const reviewCount = computed(() => connectors.filter((connector) => connector.status === 'Needs review').length);

watch(selectedConnector, syncDialogState, { immediate: true });

function openConnector(connector) {
	selectedConnectorId.value = connector.id;
	activeTab.value = 'overview';
	dialogOpen.value = true;
}

function syncDialogState() {
	selectedScopes.value = selectedConnector.value.scopes.filter((scope) => scope.enabled).map((scope) => scope.key);
	scheduledSync.value = selectedConnector.value.status !== 'Available';
}

function toggleScope(scope) {
	if (scope.required) return;
	selectedScopes.value = selectedScopes.value.includes(scope.key)
		? selectedScopes.value.filter((key) => key !== scope.key)
		: [...selectedScopes.value, scope.key];
}

function saveConnector() {
	if (!installedIds.value.includes(selectedConnector.value.id)) {
		installedIds.value = [...installedIds.value, selectedConnector.value.id];
	}
	dialogOpen.value = false;
}

function displayStatus(connector) {
	return installedIds.value.includes(connector.id) ? 'Installed' : connector.status;
}

function statusClasses(status) {
	return {
		Installed: 'bg-success/15 text-success',
		'Needs review': 'bg-warning/15 text-warning',
		Available: 'bg-secondary text-muted-fg',
	}[status] || 'bg-secondary text-muted-fg';
}

function activityClasses(tone) {
	return {
		success: 'bg-success',
		warning: 'bg-warning',
		neutral: 'bg-muted-fg',
	}[tone] || 'bg-muted-fg';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-lg border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<section class="border-b border-border bg-secondary/35 px-4 py-5 sm:px-6">
			<div class="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
				<div class="max-w-3xl">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Developer platform</p>
					<h3 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Integration marketplace</h3>
					<p class="mt-2 text-sm leading-6 text-muted-fg">
						Help teams discover approved connectors, understand data access, and launch healthy syncs without sending them through a dense settings console.
					</p>
				</div>
				<div class="grid gap-2 text-sm sm:grid-cols-3 xl:min-w-[28rem]">
					<div class="rounded-lg border border-border bg-canvas/80 px-3 py-2">
						<p class="text-xs text-muted-fg">Catalog</p>
						<p class="mt-1 font-semibold">{{ connectors.length }} connectors</p>
					</div>
					<div class="rounded-lg border border-border bg-canvas/80 px-3 py-2">
						<p class="text-xs text-muted-fg">Installed</p>
						<p class="mt-1 font-semibold">{{ installedCount }} live</p>
					</div>
					<div class="rounded-lg border border-border bg-canvas/80 px-3 py-2">
						<p class="text-xs text-muted-fg">Attention</p>
						<p class="mt-1 font-semibold">{{ reviewCount }} review</p>
					</div>
				</div>
			</div>
		</section>

		<section class="border-b border-border px-4 py-4 sm:px-6">
			<div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem]">
				<DomTextInput v-model="searchQuery" label="Search connectors" placeholder="Search by provider, category, or capability" />
				<DomNativeSelect v-model="selectedCategory" :options="categoryOptions" label="Category" />
				<DomNativeSelect v-model="selectedSort" :options="sortOptions" label="Sort" />
			</div>
		</section>

		<section class="grid gap-6 p-4 sm:p-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
			<aside class="space-y-5">
				<div>
					<div class="flex items-center justify-between gap-3">
						<h4 class="font-semibold">Recommended</h4>
						<span class="text-xs font-medium text-muted-fg">{{ featuredConnectors.length }} picks</span>
					</div>
					<div class="mt-3 space-y-2">
						<button
							v-for="connector in featuredConnectors"
							:key="`featured-${connector.id}`"
							type="button"
							class="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary/35 p-3 text-left transition hover:border-primary/50 hover:bg-primary/5"
							@click="openConnector(connector)"
						>
							<span class="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-semibold text-white" :class="connector.accent">
								{{ connector.name.charAt(0) }}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-semibold">{{ connector.name }}</span>
								<span class="mt-1 block truncate text-xs text-muted-fg">{{ connector.capabilities[0] }}</span>
							</span>
						</button>
					</div>
				</div>

				<div class="rounded-lg border border-border skin-card p-4">
					<h4 class="font-semibold">Install readiness</h4>
					<div class="mt-4 space-y-3 text-sm">
						<div class="flex items-start gap-2">
							<span class="mt-1.5 size-2 rounded-full bg-success"></span>
							<p>Show exactly which data scopes each provider requests.</p>
						</div>
						<div class="flex items-start gap-2">
							<span class="mt-1.5 size-2 rounded-full bg-primary"></span>
							<p>Route available connectors into OAuth or API key setup.</p>
						</div>
						<div class="flex items-start gap-2">
							<span class="mt-1.5 size-2 rounded-full bg-warning"></span>
							<p>Surface reconnect work before background syncs silently fail.</p>
						</div>
					</div>
				</div>
			</aside>

			<main class="min-w-0">
				<div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h4 class="text-lg font-semibold">Browse connectors</h4>
						<p class="mt-1 text-sm text-muted-fg">{{ filteredConnectors.length }} matching providers</p>
					</div>
					<DomButton size="sm" variant="secondary">
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						</svg>
						Request connector
					</DomButton>
				</div>

				<div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
					<button
						v-for="connector in filteredConnectors"
						:key="connector.id"
						type="button"
						class="group flex min-h-[17rem] flex-col rounded-lg border border-border bg-canvas p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-black/10"
						@click="openConnector(connector)"
					>
						<span class="flex items-start justify-between gap-3">
							<span class="flex min-w-0 items-start gap-3">
								<span class="grid size-11 shrink-0 place-items-center rounded-lg text-base font-semibold text-white" :class="connector.accent">
									{{ connector.name.charAt(0) }}
								</span>
								<span class="min-w-0">
									<span class="block truncate font-semibold">{{ connector.name }}</span>
									<span class="mt-1 block text-xs font-medium text-muted-fg">{{ connector.category }}</span>
								</span>
							</span>
							<span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" :class="statusClasses(displayStatus(connector))">
								{{ displayStatus(connector) }}
							</span>
						</span>

						<span class="mt-4 block text-sm leading-6 text-muted-fg">{{ connector.description }}</span>

						<span class="mt-4 flex flex-wrap gap-2">
							<span
								v-for="capability in connector.capabilities"
								:key="capability"
								class="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-fg"
							>
								{{ capability }}
							</span>
						</span>

						<span class="mt-auto grid gap-2 pt-5 text-xs text-muted-fg sm:grid-cols-3">
							<span class="rounded-lg bg-secondary/50 px-2.5 py-2">
								<span class="block font-medium text-canvas-fg">{{ connector.rating }}</span>
								<span>Rating</span>
							</span>
							<span class="rounded-lg bg-secondary/50 px-2.5 py-2">
								<span class="block font-medium text-canvas-fg">{{ connector.installCount.toLocaleString() }}</span>
								<span>Installs</span>
							</span>
							<span class="rounded-lg bg-secondary/50 px-2.5 py-2">
								<span class="block font-medium text-canvas-fg">{{ connector.health }}</span>
								<span>Health</span>
							</span>
						</span>
					</button>
				</div>

				<div v-if="!filteredConnectors.length" class="rounded-lg border border-dashed border-border p-8 text-center">
					<p class="font-semibold">No connectors match this search.</p>
					<p class="mt-2 text-sm text-muted-fg">Try another category or request a provider from your platform team.</p>
				</div>
			</main>
		</section>

		<DomDialog
			v-model="dialogOpen"
			:title="`${selectedConnector.name} integration`"
			:description="selectedConnector.description"
		>
			<div class="space-y-5">
				<div class="flex items-start justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-3">
					<div class="flex min-w-0 gap-3">
						<span class="grid size-10 shrink-0 place-items-center rounded-lg font-semibold text-white" :class="selectedConnector.accent">
							{{ selectedConnector.name.charAt(0) }}
						</span>
						<div class="min-w-0">
							<p class="font-semibold">{{ selectedConnector.category }}</p>
							<p class="mt-1 text-xs text-muted-fg">{{ selectedConnector.owner }} / {{ selectedConnector.lastSyncAt }}</p>
						</div>
					</div>
					<span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" :class="statusClasses(dialogStatus)">
						{{ dialogStatus }}
					</span>
				</div>

				<DomTabs v-model="activeTab" :tabs="installTabs">
					<template #overview>
						<div class="space-y-4">
							<div class="grid gap-2 sm:grid-cols-3">
								<div
									v-for="metric in selectedConnector.metrics"
									:key="metric.label"
									class="rounded-lg border border-border p-3"
								>
									<p class="text-xs text-muted-fg">{{ metric.label }}</p>
									<p class="mt-1 font-semibold">{{ metric.value }}</p>
								</div>
							</div>
							<div>
								<h5 class="text-sm font-semibold">Best for</h5>
								<div class="mt-2 flex flex-wrap gap-2">
									<span
										v-for="capability in selectedConnector.capabilities"
										:key="`dialog-${capability}`"
										class="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-fg"
									>
										{{ capability }}
									</span>
								</div>
							</div>
						</div>
					</template>

					<template #permissions>
						<div class="space-y-4">
							<div class="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
								<p class="font-semibold">{{ selectedRequiredCount }} of {{ requiredScopeCount }} required scopes selected</p>
								<p class="mt-1 text-muted-fg">{{ optionalScopeCount }} optional scopes enabled for richer workflows.</p>
							</div>
							<div class="divide-y divide-border rounded-lg border border-border">
								<label
									v-for="scope in selectedConnector.scopes"
									:key="scope.key"
									class="flex gap-3 p-3"
									:class="scope.required ? 'bg-secondary/30' : 'bg-canvas'"
								>
									<input
										type="checkbox"
										class="mt-1 size-4 rounded border-border text-primary"
										:checked="selectedScopes.includes(scope.key)"
										:disabled="scope.required"
										@change="toggleScope(scope)"
									>
									<span class="min-w-0 flex-1">
										<span class="flex flex-wrap items-center gap-2">
											<span class="text-sm font-medium">{{ scope.label }}</span>
											<span v-if="scope.required" class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-fg">Required</span>
										</span>
										<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ scope.description }}</span>
									</span>
								</label>
							</div>
							<DomToggle
								v-model="scheduledSync"
								label="Run scheduled syncs after install"
								description="Turn this off when an admin must review mapping before the first job."
							/>
						</div>
					</template>

					<template #activity>
						<div class="divide-y divide-border rounded-lg border border-border">
							<div
								v-for="event in selectedConnector.activity"
								:key="`${event.label}-${event.time}`"
								class="flex items-start justify-between gap-3 p-3"
							>
								<div class="flex min-w-0 gap-3">
									<span class="mt-1.5 size-2.5 shrink-0 rounded-full" :class="activityClasses(event.tone)"></span>
									<div class="min-w-0">
										<p class="text-sm font-medium">{{ event.label }}</p>
										<p class="mt-1 text-xs text-muted-fg">{{ event.actor }}</p>
									</div>
								</div>
								<p class="shrink-0 text-xs text-muted-fg">{{ event.time }}</p>
							</div>
						</div>
					</template>
				</DomTabs>
			</div>

			<template #footer>
				<DomButton variant="secondary" data-close>Cancel</DomButton>
				<DomButton @click="saveConnector">{{ primaryActionLabel }}</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
