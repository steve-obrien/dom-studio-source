<script setup>
import { computed, ref, watch } from 'vue';
import { DomButton, DomNativeSelect, DomTabs, DomTextareaInput, DomToggle } from '@getdom/studio/vue';

const severityOptions = [
	{ label: 'SEV-1 Critical', value: 'SEV-1' },
	{ label: 'SEV-2 Major', value: 'SEV-2' },
	{ label: 'SEV-3 Minor', value: 'SEV-3' },
];

const audienceOptions = [
	{ label: 'Internal only', value: 'Internal only' },
	{ label: 'Customer email', value: 'Customer email' },
	{ label: 'Public status page', value: 'Public status page' },
];

const updateCadenceOptions = [
	{ label: '15 minutes', value: 15 },
	{ label: '30 minutes', value: 30 },
	{ label: '60 minutes', value: 60 },
];

const tabs = [
	{ key: 'tasks', label: 'Tasks' },
	{ key: 'timeline', label: 'Timeline' },
];

const incidents = [
	{
		id: 'checkout-errors',
		title: 'Elevated checkout API errors',
		status: 'Mitigating',
		severity: 'SEV-2',
		commander: 'Maya Chen',
		deputy: 'Sam Patel',
		started: '42 min',
		nextUpdate: '12 min',
		impact: '128 accounts',
		region: 'US + EU',
		summary: 'Checkout creation intermittently returns 502 responses after the edge gateway deploy.',
		services: [
			{ name: 'Checkout API', state: 'Degraded', metric: '7.8% errors', trend: 'down' },
			{ name: 'Edge gateway', state: 'Degraded', metric: 'P95 2.4s', trend: 'down' },
			{ name: 'Billing worker', state: 'Operational', metric: '0.2% errors', trend: 'flat' },
		],
		tasks: [
			{ label: 'Roll back edge gateway release', owner: 'API on-call', status: 'Done', due: 'Now' },
			{ label: 'Verify checkout creation from EU test tenant', owner: 'QA lead', status: 'In progress', due: '8 min' },
			{ label: 'Prepare enterprise customer note', owner: 'Support lead', status: 'Waiting', due: '15 min' },
			{ label: 'Open postmortem draft', owner: 'Incident deputy', status: 'Waiting', due: 'After mitigation' },
		],
		timeline: [
			{ label: 'Rollback started for edge gateway v2026.06.10', actor: 'API on-call', time: 'Today 16:18' },
			{ label: 'Public status page updated', actor: 'Maya Chen', time: 'Today 16:07' },
			{ label: 'Incident promoted from SEV-3 to SEV-2', actor: 'SRE bot', time: 'Today 15:58' },
			{ label: 'Alert opened from checkout error budget burn', actor: 'Monitoring', time: 'Today 15:42' },
		],
	},
	{
		id: 'webhook-lag',
		title: 'Webhook delivery backlog',
		status: 'Investigating',
		severity: 'SEV-3',
		commander: 'Ivy Tan',
		deputy: 'Jon Bell',
		started: '1h 12m',
		nextUpdate: '24 min',
		impact: '42 accounts',
		region: 'US only',
		summary: 'Delivery attempts are delayed for large batch customers while workers drain a retry queue.',
		services: [
			{ name: 'Webhook worker', state: 'Degraded', metric: '18k queued', trend: 'down' },
			{ name: 'Events API', state: 'Operational', metric: 'P95 180ms', trend: 'flat' },
			{ name: 'Retry store', state: 'Watch', metric: '72% capacity', trend: 'up' },
		],
		tasks: [
			{ label: 'Scale webhook workers to 60 replicas', owner: 'Platform on-call', status: 'Done', due: 'Done' },
			{ label: 'Identify tenants above retry threshold', owner: 'Data ops', status: 'In progress', due: '20 min' },
			{ label: 'Draft delayed delivery customer notice', owner: 'Success ops', status: 'Waiting', due: '30 min' },
		],
		timeline: [
			{ label: 'Retry queue dropped below 20k events', actor: 'Monitoring', time: 'Today 15:54' },
			{ label: 'Workers scaled from 24 to 60 replicas', actor: 'Platform on-call', time: 'Today 15:31' },
			{ label: 'Incident opened from delivery lag alert', actor: 'SRE bot', time: 'Today 15:12' },
		],
	},
	{
		id: 'login-timeouts',
		title: 'Login timeouts for SSO tenants',
		status: 'Monitoring',
		severity: 'SEV-2',
		commander: 'Nora Lee',
		deputy: 'Ari Grant',
		started: '2h 04m',
		nextUpdate: '18 min',
		impact: '21 tenants',
		region: 'EU only',
		summary: 'SAML login latency recovered after cache failover. Team is monitoring error budget and support volume.',
		services: [
			{ name: 'Identity API', state: 'Watch', metric: 'P95 640ms', trend: 'down' },
			{ name: 'SAML broker', state: 'Operational', metric: '0.1% errors', trend: 'flat' },
			{ name: 'Session cache', state: 'Operational', metric: 'Primary healthy', trend: 'flat' },
		],
		tasks: [
			{ label: 'Confirm SAML login from affected tenants', owner: 'Support lead', status: 'In progress', due: '10 min' },
			{ label: 'Keep failover cache as primary', owner: 'Identity on-call', status: 'Done', due: 'Done' },
			{ label: 'Schedule post-incident review', owner: 'Incident deputy', status: 'Waiting', due: 'Tomorrow' },
		],
		timeline: [
			{ label: 'Customer reports slowed to baseline', actor: 'Support lead', time: 'Today 14:51' },
			{ label: 'Session cache failover completed', actor: 'Identity on-call', time: 'Today 14:29' },
			{ label: 'Incident opened by support escalation', actor: 'Ari Grant', time: 'Today 13:58' },
		],
	},
];

const selectedIncidentId = ref(incidents[0].id);
const selectedSeverity = ref(incidents[0].severity);
const selectedAudience = ref('Public status page');
const updateCadence = ref(30);
const activeTab = ref('tasks');
const notifyEnterprise = ref(true);
const requireApproval = ref(true);
const includeMetrics = ref(false);
const updateDraft = ref('We are mitigating elevated checkout API errors. Checkout creation may fail intermittently for some customers while rollback and verification continue.');
const publishedUpdate = ref('');

const selectedIncident = computed(() => incidents.find((incident) => incident.id === selectedIncidentId.value) || incidents[0]);
const completedTasks = computed(() => selectedIncident.value.tasks.filter((task) => task.status === 'Done').length);
const readinessPercent = computed(() => Math.round((completedTasks.value / selectedIncident.value.tasks.length) * 100));
const affectedServices = computed(() => selectedIncident.value.services.filter((service) => service.state !== 'Operational').length);
const canPublish = computed(() => updateDraft.value.trim().length >= 40 && (!requireApproval.value || selectedAudience.value === 'Internal only' || selectedIncident.value.status !== 'Investigating'));
const updateSummary = computed(() => `${selectedAudience.value} update queued for ${selectedIncident.value.title}`);

watch(selectedIncident, (incident) => {
	selectedSeverity.value = incident.severity;
	activeTab.value = 'tasks';
	publishedUpdate.value = '';
	updateDraft.value = `We are ${incident.status.toLowerCase()} ${incident.title.toLowerCase()}. ${incident.summary}`;
});

function selectIncident(incident) {
	selectedIncidentId.value = incident.id;
}

function publishUpdate() {
	if (!canPublish.value) return;
	publishedUpdate.value = updateSummary.value;
}

function severityClasses(severity) {
	return {
		'SEV-1': 'bg-destructive/15 text-destructive',
		'SEV-2': 'bg-warning/15 text-warning',
		'SEV-3': 'bg-primary/10 text-primary',
	}[severity] || 'bg-secondary text-muted-fg';
}

function statusClasses(status) {
	return {
		Mitigating: 'bg-warning/15 text-warning',
		Investigating: 'bg-primary/10 text-primary',
		Monitoring: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		Done: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		'In progress': 'bg-primary/10 text-primary',
		Waiting: 'bg-secondary text-muted-fg',
		Operational: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		Degraded: 'bg-warning/15 text-warning',
		Watch: 'bg-primary/10 text-primary',
	}[status] || 'bg-secondary text-muted-fg';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-4 py-4 sm:px-6">
			<div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Reliability operations</p>
					<h3 class="mt-1 text-2xl font-semibold tracking-tight">Incident command center</h3>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
						Coordinate active incidents with service health, owners, customer impact, communication review, and timeline evidence in one workspace.
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<DomNativeSelect v-model="selectedSeverity" :options="severityOptions" class="w-40" />
					<DomButton size="sm" variant="secondary">
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						</svg>
						New incident
					</DomButton>
				</div>
			</div>
		</header>

		<div class="grid min-h-[46rem] lg:grid-cols-[19rem_minmax(0,1fr)_22rem]">
			<aside class="border-b border-border skin-card lg:border-b-0 lg:border-r">
				<div class="grid grid-cols-3 border-b border-border text-center text-sm">
					<div class="px-3 py-3">
						<p class="text-xs text-muted-fg">Open</p>
						<p class="mt-1 text-lg font-semibold">{{ incidents.length }}</p>
					</div>
					<div class="border-l border-border px-3 py-3">
						<p class="text-xs text-muted-fg">SEV-2+</p>
						<p class="mt-1 text-lg font-semibold">2</p>
					</div>
					<div class="border-l border-border px-3 py-3">
						<p class="text-xs text-muted-fg">On call</p>
						<p class="mt-1 text-lg font-semibold">7</p>
					</div>
				</div>

				<div class="p-3">
					<p class="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Active incidents</p>
					<div class="space-y-2">
						<button
							v-for="incident in incidents"
							:key="incident.id"
							type="button"
							class="w-full rounded-xl border p-3 text-left transition hover:border-primary/50"
							:class="incident.id === selectedIncident.id ? 'border-primary/60 bg-primary/5' : 'border-border bg-canvas'"
							@click="selectIncident(incident)"
						>
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="truncate text-sm font-semibold">{{ incident.title }}</p>
									<p class="mt-1 text-xs text-muted-fg">{{ incident.impact }} affected</p>
								</div>
								<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="severityClasses(incident.severity)">
									{{ incident.severity }}
								</span>
							</div>
							<div class="mt-3 flex items-center justify-between text-xs">
								<span class="rounded-full px-2 py-0.5 font-semibold" :class="statusClasses(incident.status)">
									{{ incident.status }}
								</span>
								<span class="text-muted-fg">Next {{ incident.nextUpdate }}</span>
							</div>
						</button>
					</div>
				</div>
			</aside>

			<main class="min-w-0">
				<section class="border-b border-border px-4 py-5 sm:px-6">
					<div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
						<div>
							<div class="flex flex-wrap items-center gap-2">
								<span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="severityClasses(selectedSeverity)">
									{{ selectedSeverity }}
								</span>
								<span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="statusClasses(selectedIncident.status)">
									{{ selectedIncident.status }}
								</span>
							</div>
							<h4 class="mt-3 text-xl font-semibold tracking-tight">{{ selectedIncident.title }}</h4>
							<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">{{ selectedIncident.summary }}</p>
						</div>
						<div class="grid grid-cols-3 overflow-hidden rounded-xl border border-border text-center text-sm">
							<div class="px-3 py-3">
								<p class="text-xs text-muted-fg">Duration</p>
								<p class="mt-1 font-semibold">{{ selectedIncident.started }}</p>
							</div>
							<div class="border-l border-border px-3 py-3">
								<p class="text-xs text-muted-fg">Region</p>
								<p class="mt-1 font-semibold">{{ selectedIncident.region }}</p>
							</div>
							<div class="border-l border-border px-3 py-3">
								<p class="text-xs text-muted-fg">Services</p>
								<p class="mt-1 font-semibold">{{ affectedServices }}</p>
							</div>
						</div>
					</div>
				</section>

				<section class="grid border-b border-border md:grid-cols-3">
					<div class="border-b border-border px-4 py-4 sm:px-6 md:border-b-0 md:border-r">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Commander</p>
						<p class="mt-2 font-semibold">{{ selectedIncident.commander }}</p>
						<p class="mt-1 text-sm text-muted-fg">Deputy: {{ selectedIncident.deputy }}</p>
					</div>
					<div class="border-b border-border px-4 py-4 sm:px-6 md:border-b-0 md:border-r">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Customer impact</p>
						<p class="mt-2 font-semibold">{{ selectedIncident.impact }}</p>
						<p class="mt-1 text-sm text-muted-fg">Impacted region: {{ selectedIncident.region }}</p>
					</div>
					<div class="px-4 py-4 sm:px-6">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Task readiness</p>
						<div class="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
							<div class="h-full rounded-full bg-primary" :style="{ width: `${readinessPercent}%` }"></div>
						</div>
						<p class="mt-2 text-sm text-muted-fg">{{ completedTasks }} of {{ selectedIncident.tasks.length }} tasks complete</p>
					</div>
				</section>

				<section class="border-b border-border px-4 py-5 sm:px-6">
					<div class="flex items-center justify-between gap-4">
						<div>
							<h5 class="font-semibold tracking-tight">Affected services</h5>
							<p class="mt-1 text-sm text-muted-fg">Current component health from monitoring and incident annotations.</p>
						</div>
						<DomButton size="sm" variant="secondary">Open metrics</DomButton>
					</div>
					<div class="mt-4 divide-y divide-border rounded-xl border border-border">
						<div
							v-for="service in selectedIncident.services"
							:key="service.name"
							class="grid gap-3 px-3 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_7rem_7rem_4rem] sm:items-center"
						>
							<div class="min-w-0">
								<p class="truncate font-medium">{{ service.name }}</p>
								<p class="mt-1 text-xs text-muted-fg">Linked to monitor and runbook</p>
							</div>
							<span class="w-fit rounded-full px-2 py-0.5 text-xs font-semibold" :class="statusClasses(service.state)">
								{{ service.state }}
							</span>
							<span class="text-muted-fg">{{ service.metric }}</span>
							<span class="text-xs font-semibold" :class="service.trend === 'up' ? 'text-warning' : 'text-success'">
								{{ service.trend }}
							</span>
						</div>
					</div>
				</section>

				<section class="px-4 py-5 sm:px-6">
					<DomTabs v-model="activeTab" :tabs="tabs" />
					<div v-if="activeTab === 'tasks'" class="mt-4 divide-y divide-border rounded-xl border border-border">
						<div
							v-for="task in selectedIncident.tasks"
							:key="task.label"
							class="grid gap-3 px-3 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_7rem_6rem] sm:items-center"
						>
							<div>
								<p class="font-medium">{{ task.label }}</p>
								<p class="mt-1 text-xs text-muted-fg">{{ task.owner }}</p>
							</div>
							<span class="w-fit rounded-full px-2 py-0.5 text-xs font-semibold" :class="statusClasses(task.status)">
								{{ task.status }}
							</span>
							<span class="text-muted-fg">{{ task.due }}</span>
						</div>
					</div>
					<div v-else class="mt-4 divide-y divide-border rounded-xl border border-border">
						<div v-for="event in selectedIncident.timeline" :key="`${event.label}-${event.time}`" class="px-3 py-3 text-sm">
							<div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
								<p class="font-medium">{{ event.label }}</p>
								<span class="text-xs text-muted-fg">{{ event.time }}</span>
							</div>
							<p class="mt-1 text-xs text-muted-fg">{{ event.actor }}</p>
						</div>
					</div>
				</section>
			</main>

			<aside class="border-t border-border skin-card lg:border-l lg:border-t-0">
				<section class="border-b border-border px-4 py-5">
					<h5 class="font-semibold tracking-tight">Status update</h5>
					<p class="mt-2 text-sm leading-6 text-muted-fg">Prepare the next incident update with audience, cadence, and approval controls.</p>
					<div class="mt-4 space-y-3">
						<DomNativeSelect v-model="selectedAudience" :options="audienceOptions" />
						<DomNativeSelect v-model="updateCadence" :options="updateCadenceOptions" />
						<DomTextareaInput v-model="updateDraft" label="Update draft" rows="6" />
					</div>
					<div class="mt-4 divide-y divide-border rounded-xl border border-border">
						<label class="flex items-center justify-between gap-4 px-3 py-3">
							<span>
								<span class="block text-sm font-medium">Notify enterprise accounts</span>
								<span class="block text-xs text-muted-fg">Send account-scoped email updates.</span>
							</span>
							<DomToggle v-model="notifyEnterprise" aria-label="Notify enterprise accounts" />
						</label>
						<label class="flex items-center justify-between gap-4 px-3 py-3">
							<span>
								<span class="block text-sm font-medium">Require comms approval</span>
								<span class="block text-xs text-muted-fg">Block public drafts until reviewed.</span>
							</span>
							<DomToggle v-model="requireApproval" aria-label="Require communications approval" />
						</label>
						<label class="flex items-center justify-between gap-4 px-3 py-3">
							<span>
								<span class="block text-sm font-medium">Include live metrics</span>
								<span class="block text-xs text-muted-fg">Attach current error and latency snapshot.</span>
							</span>
							<DomToggle v-model="includeMetrics" aria-label="Include live metrics" />
						</label>
					</div>
					<DomButton class="mt-4 w-full" :disabled="!canPublish" @click="publishUpdate">
						Publish update
					</DomButton>
					<p v-if="publishedUpdate" class="mt-3 rounded-xl bg-success/10 px-3 py-2 text-sm font-medium text-success">
						{{ publishedUpdate }}
					</p>
					<p v-else-if="!canPublish" class="mt-3 rounded-xl bg-warning/10 px-3 py-2 text-sm font-medium text-warning">
						Add a detailed update or switch to internal-only before publishing.
					</p>
				</section>

				<section class="border-b border-border px-4 py-5">
					<h5 class="font-semibold tracking-tight">Response checks</h5>
					<div class="mt-4 space-y-3 text-sm">
						<div class="flex items-start gap-3">
							<span class="mt-1 size-2 rounded-full bg-success"></span>
							<div>
								<p class="font-medium">Commander assigned</p>
								<p class="text-xs text-muted-fg">{{ selectedIncident.commander }} owns coordination.</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<span class="mt-1 size-2 rounded-full bg-success"></span>
							<div>
								<p class="font-medium">Customer impact captured</p>
								<p class="text-xs text-muted-fg">{{ selectedIncident.impact }} across {{ selectedIncident.region }}.</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<span class="mt-1 size-2 rounded-full" :class="readinessPercent > 60 ? 'bg-success' : 'bg-warning'"></span>
							<div>
								<p class="font-medium">Mitigation tasks moving</p>
								<p class="text-xs text-muted-fg">{{ readinessPercent }}% of response tasks complete.</p>
							</div>
						</div>
					</div>
				</section>

				<section class="px-4 py-5">
					<h5 class="font-semibold tracking-tight">Activity history</h5>
					<div class="mt-4 space-y-4">
						<div v-for="event in selectedIncident.timeline.slice(0, 3)" :key="event.label" class="border-l border-border pl-3 text-sm">
							<p class="font-medium">{{ event.label }}</p>
							<p class="mt-1 text-xs text-muted-fg">{{ event.actor }} / {{ event.time }}</p>
						</div>
					</div>
				</section>
			</aside>
		</div>
	</div>
</template>
