<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomEmailInput, DomNativeSelect, DomTabs, DomToggle, DomTooltip } from '@getdom/studio/vue';

const regions = ['Global', 'US East', 'Europe', 'Asia Pacific'];
const tabs = [
	{ key: 'overview', label: 'Overview' },
	{ key: 'incidents', label: 'Incidents' },
	{ key: 'subscribe', label: 'Subscribe' },
];

const services = ref([
	{
		id: 'api',
		name: 'Public API',
		description: 'REST, GraphQL, auth, and webhook APIs.',
		status: 'Degraded',
		statusDetail: 'Higher p95 latency in Europe.',
		uptime: 99.93,
		latency: '182ms',
		errorRate: '0.42%',
		region: 'Europe',
		owner: 'Platform',
		history: [100, 99, 98, 96, 97, 99, 98, 100, 99, 97, 98, 99],
	},
	{
		id: 'dashboard',
		name: 'Web dashboard',
		description: 'Customer workspace, admin tools, and reporting UI.',
		status: 'Operational',
		statusDetail: 'All routes and assets are serving normally.',
		uptime: 99.99,
		latency: '94ms',
		errorRate: '0.03%',
		region: 'Global',
		owner: 'Product',
		history: [100, 100, 99, 100, 100, 99, 100, 100, 100, 100, 99, 100],
	},
	{
		id: 'jobs',
		name: 'Background jobs',
		description: 'Imports, exports, email delivery, and billing syncs.',
		status: 'Operational',
		statusDetail: 'Queues are draining within target windows.',
		uptime: 99.97,
		latency: '1.8s',
		errorRate: '0.07%',
		region: 'Global',
		owner: 'Operations',
		history: [100, 99, 100, 100, 98, 99, 100, 100, 99, 100, 100, 100],
	},
	{
		id: 'search',
		name: 'Search indexing',
		description: 'Index refresh, autocomplete, and search ranking.',
		status: 'Maintenance',
		statusDetail: 'Planned reindex is running for older accounts.',
		uptime: 99.81,
		latency: '420ms',
		errorRate: '0.18%',
		region: 'US East',
		owner: 'Data',
		history: [98, 99, 99, 97, 100, 99, 98, 99, 96, 97, 98, 99],
	},
]);

const incidents = [
	{
		id: 'inc-481',
		title: 'Elevated API latency in Europe',
		status: 'Monitoring',
		impact: 'Partial outage',
		started: 'Today 18:05',
		updated: 'Today 19:20',
		components: ['Public API', 'Webhook delivery'],
		updates: [
			{ time: '19:20', state: 'Monitoring', body: 'Traffic is stable after moving read-heavy tenants away from the affected cache node.' },
			{ time: '18:42', state: 'Mitigating', body: 'We are failing over cache reads in eu-west and reducing retry pressure on API workers.' },
			{ time: '18:05', state: 'Investigating', body: 'We are investigating increased p95 latency and intermittent webhook delivery delays.' },
		],
	},
	{
		id: 'inc-477',
		title: 'Delayed export jobs',
		status: 'Resolved',
		impact: 'Minor delay',
		started: 'Jun 08 09:12',
		updated: 'Jun 08 10:04',
		components: ['Background jobs'],
		updates: [
			{ time: '10:04', state: 'Resolved', body: 'The export queue caught up and delayed jobs were delivered to all affected workspaces.' },
			{ time: '09:34', state: 'Monitoring', body: 'Workers were scaled out and export processing returned to the expected range.' },
		],
	},
];

const maintenanceWindows = [
	{ id: 'm1', title: 'Search reindex maintenance', date: 'Jun 12, 01:00-02:30 UTC', impact: 'Search results can lag by up to 15 minutes.', status: 'Scheduled' },
	{ id: 'm2', title: 'Billing provider certificate rotation', date: 'Jun 17, 22:00-22:20 UTC', impact: 'No customer-visible downtime expected.', status: 'Planned' },
];

const selectedServiceId = ref('api');
const selectedRegion = ref('Global');
const activeTab = ref('overview');
const subscriberEmail = ref('ops@example.com');
const subscriptionSaved = ref(false);
const channels = ref([
	{ id: 'email', label: 'Email', detail: 'Incident and maintenance updates.', enabled: true },
	{ id: 'sms', label: 'SMS', detail: 'Only major outages and security-impacting maintenance.', enabled: false },
	{ id: 'webhook', label: 'Webhook', detail: 'Send signed status events to an endpoint.', enabled: true },
	{ id: 'weekly', label: 'Weekly digest', detail: 'A Friday uptime and incident summary.', enabled: false },
]);

const visibleServices = computed(() => {
	if (selectedRegion.value === 'Global') return services.value;
	return services.value.filter((service) => service.region === 'Global' || service.region === selectedRegion.value);
});
const selectedService = computed(() => services.value.find((service) => service.id === selectedServiceId.value) || services.value[0]);
const activeIncident = computed(() => incidents[0]);
const degradedCount = computed(() => services.value.filter((service) => service.status !== 'Operational').length);
const allOperational = computed(() => degradedCount.value === 0);
const enabledChannelCount = computed(() => channels.value.filter((channel) => channel.enabled).length);
const readinessChecks = computed(() => [
	{ label: 'Email address added', done: subscriberEmail.value.includes('@') },
	{ label: 'At least one channel selected', done: enabledChannelCount.value > 0 },
	{ label: 'Service filters reviewed', done: selectedRegion.value !== '' },
]);
const subscriptionReady = computed(() => readinessChecks.value.every((check) => check.done));
const averageUptime = computed(() => {
	const total = services.value.reduce((sum, service) => sum + service.uptime, 0);
	return (total / services.value.length).toFixed(2);
});

function selectService(service) {
	selectedServiceId.value = service.id;
}

function saveSubscription() {
	if (!subscriptionReady.value) return;
	subscriptionSaved.value = true;
}

function statusClasses(status) {
	if (status === 'Operational') return 'bg-success/15 text-success';
	if (status === 'Degraded') return 'bg-warning/15 text-warning';
	if (status === 'Maintenance') return 'bg-primary/15 text-primary';
	return 'bg-destructive/15 text-destructive';
}

function dotClasses(status) {
	if (status === 'Operational') return 'bg-success';
	if (status === 'Degraded') return 'bg-warning';
	if (status === 'Maintenance') return 'bg-primary';
	return 'bg-destructive';
}

function barClasses(point) {
	if (point >= 99) return 'bg-success';
	if (point >= 97) return 'bg-warning';
	return 'bg-destructive';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-lg border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-4 py-4 sm:px-6">
			<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
				<div>
					<div class="flex flex-wrap items-center gap-2">
						<span class="grid size-2.5 rounded-full" :class="allOperational ? 'bg-success' : 'bg-warning'"></span>
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Acme Cloud status</p>
					</div>
					<h3 class="mt-2 text-2xl font-semibold tracking-tight">
						{{ allOperational ? 'All systems operational' : 'Some systems need attention' }}
					</h3>
					<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">
						Live component health, maintenance notices, and incident updates for customers and internal stakeholders.
					</p>
				</div>
				<div class="grid gap-2 sm:grid-cols-[10rem_auto]">
					<DomNativeSelect v-model="selectedRegion" label="Region" :options="regions" />
					<DomButton size="sm" @click="activeTab = 'subscribe'">
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M5 8a7 7 0 0 1 14 0c0 8 3 7 3 9H2c0-2 3-1 3-9ZM9.5 20a3 3 0 0 0 5 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
						Subscribe
					</DomButton>
				</div>
			</div>
		</header>

		<section class="grid divide-y divide-border border-b border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
			<div class="px-4 py-4 sm:px-6">
				<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Components</p>
				<p class="mt-2 text-2xl font-semibold">{{ services.length - degradedCount }}/{{ services.length }} healthy</p>
			</div>
			<div class="px-4 py-4 sm:px-6">
				<div class="flex items-center gap-2">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">30 day uptime</p>
					<DomTooltip text="Average uptime across public components." placement="top">
						<button type="button" class="grid size-5 place-items-center rounded-full border border-border text-[11px] text-muted-fg">?</button>
					</DomTooltip>
				</div>
				<p class="mt-2 text-2xl font-semibold">{{ averageUptime }}%</p>
			</div>
			<div class="px-4 py-4 sm:px-6">
				<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Last checked</p>
				<p class="mt-2 text-2xl font-semibold">19:42 UTC</p>
			</div>
		</section>

		<div class="grid min-h-[48rem] lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_21rem]">
			<aside class="border-b border-border skin-card lg:border-b-0 lg:border-r">
				<div class="p-3">
					<p class="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Component health</p>
					<div class="divide-y divide-border rounded-lg border border-border bg-canvas">
						<button
							v-for="service in visibleServices"
							:key="service.id"
							type="button"
							class="grid w-full gap-3 px-3 py-3 text-left transition hover:bg-secondary/40"
							:class="selectedServiceId === service.id ? 'bg-primary/10' : ''"
							@click="selectService(service)"
						>
							<span class="flex items-start justify-between gap-3">
								<span class="min-w-0">
									<span class="block truncate text-sm font-semibold">{{ service.name }}</span>
									<span class="mt-1 block text-xs text-muted-fg">{{ service.owner }} / {{ service.region }}</span>
								</span>
								<span class="mt-1 size-2.5 shrink-0 rounded-full" :class="dotClasses(service.status)"></span>
							</span>
							<span class="grid grid-cols-12 items-end gap-1" aria-label="Recent uptime">
								<span
									v-for="(point, index) in service.history"
									:key="`${service.id}-${index}`"
									class="min-h-2 rounded-sm"
									:class="barClasses(point)"
									:style="{ height: `${Math.max(18, point - 82)}px` }"
								></span>
							</span>
						</button>
					</div>
				</div>
			</aside>

			<main class="min-w-0 border-b border-border xl:border-b-0 xl:border-r">
				<section class="border-b border-border px-4 py-4 sm:px-6">
					<div class="flex flex-wrap items-start justify-between gap-4">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="statusClasses(selectedService.status)">
									{{ selectedService.status }}
								</span>
								<span class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg">
									{{ selectedService.uptime }}% uptime
								</span>
							</div>
							<h4 class="mt-3 text-2xl font-semibold tracking-tight">{{ selectedService.name }}</h4>
							<p class="mt-1 text-sm leading-6 text-muted-fg">{{ selectedService.description }}</p>
						</div>
						<div class="grid grid-cols-2 gap-3 text-right">
							<div>
								<p class="text-xs text-muted-fg">Latency</p>
								<p class="mt-1 text-sm font-semibold">{{ selectedService.latency }}</p>
							</div>
							<div>
								<p class="text-xs text-muted-fg">Error rate</p>
								<p class="mt-1 text-sm font-semibold">{{ selectedService.errorRate }}</p>
							</div>
						</div>
					</div>
				</section>

				<section class="p-4 sm:p-6">
					<DomTabs v-model="activeTab" :tabs="tabs">
						<template #overview>
							<div class="grid gap-5">
								<div class="rounded-lg border border-border bg-secondary/30 p-4">
									<div class="flex flex-wrap items-center justify-between gap-3">
										<div>
											<h5 class="text-base font-semibold">{{ selectedService.statusDetail }}</h5>
											<p class="mt-1 text-sm leading-6 text-muted-fg">Status is calculated from synthetic checks, queue depth, error rate, and customer-facing latency.</p>
										</div>
										<DomButton variant="secondary" size="sm">View metrics</DomButton>
									</div>
								</div>

								<div>
									<div class="flex flex-wrap items-center justify-between gap-3">
										<div>
											<h5 class="text-base font-semibold">Scheduled maintenance</h5>
											<p class="mt-1 text-sm text-muted-fg">Planned work customers should know about before it starts.</p>
										</div>
										<span class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg">
											{{ maintenanceWindows.length }} upcoming
										</span>
									</div>
									<div class="mt-4 divide-y divide-border rounded-lg border border-border">
										<div v-for="window in maintenanceWindows" :key="window.id" class="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_8rem]">
											<div>
												<div class="flex flex-wrap items-center gap-2">
													<h6 class="text-sm font-semibold">{{ window.title }}</h6>
													<span class="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">{{ window.status }}</span>
												</div>
												<p class="mt-1 text-sm leading-6 text-muted-fg">{{ window.impact }}</p>
											</div>
											<p class="text-sm font-medium text-muted-fg md:text-right">{{ window.date }}</p>
										</div>
									</div>
								</div>
							</div>
						</template>

						<template #incidents>
							<div class="space-y-5">
								<div class="flex flex-wrap items-center justify-between gap-3">
									<div>
										<h5 class="text-base font-semibold">{{ activeIncident.title }}</h5>
										<p class="mt-1 text-sm text-muted-fg">{{ activeIncident.impact }} / {{ activeIncident.status }} / Updated {{ activeIncident.updated }}</p>
									</div>
									<DomButton variant="secondary" size="sm">Follow incident</DomButton>
								</div>

								<ol class="relative space-y-4 border-l border-border pl-5">
									<li v-for="update in activeIncident.updates" :key="`${activeIncident.id}-${update.time}`" class="relative">
										<span class="absolute -left-[1.65rem] top-1.5 size-3 rounded-full border-2 border-canvas" :class="dotClasses(update.state === 'Resolved' ? 'Operational' : 'Degraded')"></span>
										<div class="flex flex-wrap items-center gap-2">
											<p class="text-sm font-semibold">{{ update.state }}</p>
											<p class="text-xs text-muted-fg">{{ update.time }}</p>
										</div>
										<p class="mt-1 text-sm leading-6 text-muted-fg">{{ update.body }}</p>
									</li>
								</ol>

								<div class="divide-y divide-border rounded-lg border border-border">
									<div v-for="incident in incidents" :key="incident.id" class="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_8rem]">
										<div>
											<p class="text-sm font-semibold">{{ incident.title }}</p>
											<p class="mt-1 text-xs text-muted-fg">{{ incident.components.join(', ') }} / Started {{ incident.started }}</p>
										</div>
										<p class="text-sm font-medium text-muted-fg md:text-right">{{ incident.status }}</p>
									</div>
								</div>
							</div>
						</template>

						<template #subscribe>
							<div class="grid gap-5">
								<div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
									<DomEmailInput v-model="subscriberEmail" label="Subscriber email" placeholder="ops@example.com" />
									<DomButton class="self-end" :disabled="!subscriptionReady" @click="saveSubscription">
										{{ subscriptionSaved ? 'Saved' : 'Save alerts' }}
									</DomButton>
								</div>

								<div class="divide-y divide-border rounded-lg border border-border">
									<div v-for="channel in channels" :key="channel.id" class="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
										<div>
											<p class="text-sm font-semibold">{{ channel.label }}</p>
											<p class="mt-1 text-sm leading-6 text-muted-fg">{{ channel.detail }}</p>
										</div>
										<DomToggle v-model="channel.enabled" :label="channel.enabled ? 'On' : 'Off'" />
									</div>
								</div>

								<div class="rounded-lg border border-border bg-secondary/30 p-4">
									<p class="text-sm font-semibold">Subscription checks</p>
									<div class="mt-3 grid gap-2">
										<div v-for="check in readinessChecks" :key="check.label" class="flex items-center gap-2 text-sm">
											<span class="grid size-5 place-items-center rounded-full text-[11px] font-bold" :class="check.done ? 'bg-success text-success-fg' : 'bg-secondary text-muted-fg'">
												{{ check.done ? 'Y' : '-' }}
											</span>
											<span class="text-muted-fg">{{ check.label }}</span>
										</div>
									</div>
								</div>
							</div>
						</template>
					</DomTabs>
				</section>
			</main>

			<aside class="skin-card p-4">
				<div class="grid gap-5">
					<section>
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Current incident</p>
						<h5 class="mt-2 text-lg font-semibold">{{ activeIncident.title }}</h5>
						<p class="mt-2 text-sm leading-6 text-muted-fg">{{ activeIncident.updates[0].body }}</p>
						<div class="mt-4 flex flex-wrap gap-2">
							<span v-for="component in activeIncident.components" :key="component" class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg">
								{{ component }}
							</span>
						</div>
					</section>

					<section class="border-t border-border pt-5">
						<div class="flex items-center justify-between gap-3">
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Public message</p>
							<span class="rounded-full bg-warning/15 px-2 py-1 text-xs font-semibold text-warning">Monitoring</span>
						</div>
						<p class="mt-3 text-sm leading-6 text-muted-fg">
							We are monitoring elevated API latency in Europe after moving traffic away from the affected cache node.
						</p>
						<div class="mt-4 grid gap-2">
							<DomButton size="sm" @click="activeTab = 'incidents'">Read updates</DomButton>
							<DomButton variant="secondary" size="sm" @click="activeTab = 'subscribe'">Manage alerts</DomButton>
						</div>
					</section>

					<section class="border-t border-border pt-5">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Trust signals</p>
						<div class="mt-3 grid gap-3 text-sm">
							<div class="flex items-center justify-between gap-3">
								<span class="text-muted-fg">Historical uptime</span>
								<span class="font-semibold">{{ averageUptime }}%</span>
							</div>
							<div class="flex items-center justify-between gap-3">
								<span class="text-muted-fg">Open incidents</span>
								<span class="font-semibold">1</span>
							</div>
							<div class="flex items-center justify-between gap-3">
								<span class="text-muted-fg">Subscribers</span>
								<span class="font-semibold">12,804</span>
							</div>
						</div>
					</section>
				</div>
			</aside>
		</div>
	</div>
</template>
