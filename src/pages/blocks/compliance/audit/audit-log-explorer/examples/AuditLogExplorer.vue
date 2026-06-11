<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomDialog, DomNativeSelect, DomTextInput, DomToggle, DomTooltip } from '@getdom/studio/vue';

const environmentOptions = [
	{ label: 'All environments', value: 'all' },
	{ label: 'Production', value: 'Production' },
	{ label: 'Staging', value: 'Staging' },
	{ label: 'Development', value: 'Development' },
];

const categoryOptions = [
	{ label: 'All categories', value: 'all' },
	{ label: 'Access', value: 'Access' },
	{ label: 'Billing', value: 'Billing' },
	{ label: 'Security', value: 'Security' },
	{ label: 'Data', value: 'Data' },
];

const outcomeOptions = [
	{ label: 'Any outcome', value: 'all' },
	{ label: 'Success', value: 'Success' },
	{ label: 'Denied', value: 'Denied' },
	{ label: 'Failed', value: 'Failed' },
];

const auditEvents = [
	{
		id: 'evt_84201',
		time: '14:36',
		date: 'Today',
		actor: 'Priya Shah',
		email: 'priya@example.com',
		action: 'member.role.updated',
		description: 'Changed Jon Bell from Member to Admin',
		resource: 'Jon Bell',
		resourceType: 'Member',
		category: 'Access',
		environment: 'Production',
		outcome: 'Success',
		severity: 'High',
		ip: '203.0.113.24',
		region: 'London',
		requestId: 'req_7ae921',
		retained: true,
		metadata: [
			{ label: 'Before', value: 'Member' },
			{ label: 'After', value: 'Admin' },
			{ label: 'Reason', value: 'Temporary migration access' },
		],
	},
	{
		id: 'evt_84182',
		time: '13:12',
		date: 'Today',
		actor: 'System policy',
		email: 'security@acme.example',
		action: 'session.mfa_challenge.failed',
		description: 'Blocked sign-in after repeated failed MFA challenges',
		resource: 'Ari Patel',
		resourceType: 'Session',
		category: 'Security',
		environment: 'Production',
		outcome: 'Denied',
		severity: 'Critical',
		ip: '198.51.100.18',
		region: 'Frankfurt',
		requestId: 'req_e5c043',
		retained: true,
		metadata: [
			{ label: 'Attempts', value: '5' },
			{ label: 'Rule', value: 'mfa_lockout' },
			{ label: 'Device', value: 'Untrusted browser' },
		],
	},
	{
		id: 'evt_84144',
		time: '11:48',
		date: 'Today',
		actor: 'Maya Chen',
		email: 'maya@example.com',
		action: 'invoice.credit.applied',
		description: 'Applied goodwill credit to annual renewal invoice',
		resource: 'Acme Renewal',
		resourceType: 'Invoice',
		category: 'Billing',
		environment: 'Production',
		outcome: 'Success',
		severity: 'Medium',
		ip: '192.0.2.44',
		region: 'Dublin',
		requestId: 'req_44f120',
		retained: false,
		metadata: [
			{ label: 'Amount', value: 'USD 1,200.00' },
			{ label: 'Approver', value: 'Deal desk' },
			{ label: 'Invoice', value: 'inv_21044' },
		],
	},
	{
		id: 'evt_84097',
		time: '10:22',
		date: 'Today',
		actor: 'Jon Bell',
		email: 'jon@example.com',
		action: 'api_key.created',
		description: 'Created production API key with write scopes',
		resource: 'Server import key',
		resourceType: 'API key',
		category: 'Security',
		environment: 'Production',
		outcome: 'Success',
		severity: 'High',
		ip: '203.0.113.88',
		region: 'London',
		requestId: 'req_c620ab',
		retained: true,
		metadata: [
			{ label: 'Scopes', value: 'customers:write, invoices:read' },
			{ label: 'Expires', value: '2026-09-11' },
			{ label: 'Rotation', value: 'Required in 92 days' },
		],
	},
	{
		id: 'evt_84041',
		time: 'Yesterday',
		date: 'Jun 10',
		actor: 'Import worker',
		email: 'jobs@acme.example',
		action: 'customer.export.failed',
		description: 'Customer CSV export failed after schema validation',
		resource: 'Enterprise accounts export',
		resourceType: 'Export job',
		category: 'Data',
		environment: 'Staging',
		outcome: 'Failed',
		severity: 'Medium',
		ip: '10.0.4.12',
		region: 'Internal',
		requestId: 'req_stage_881',
		retained: false,
		metadata: [
			{ label: 'Rows', value: '18,402' },
			{ label: 'Error', value: 'missing required column: account_id' },
			{ label: 'Retryable', value: 'Yes' },
		],
	},
	{
		id: 'evt_83988',
		time: 'Yesterday',
		date: 'Jun 10',
		actor: 'Local tunnel',
		email: 'dev@acme.example',
		action: 'webhook.endpoint.updated',
		description: 'Changed development webhook URL for invoice events',
		resource: 'Checkout sandbox',
		resourceType: 'Webhook',
		category: 'Data',
		environment: 'Development',
		outcome: 'Success',
		severity: 'Low',
		ip: '127.0.0.1',
		region: 'Local',
		requestId: 'req_dev_112',
		retained: false,
		metadata: [
			{ label: 'Before', value: 'https://old-tunnel.example/hooks' },
			{ label: 'After', value: 'https://new-tunnel.example/hooks' },
			{ label: 'Events', value: 'invoice.paid, invoice.payment_failed' },
		],
	},
];

const searchQuery = ref('');
const selectedEnvironment = ref('all');
const selectedCategory = ref('all');
const selectedOutcome = ref('all');
const includeSensitive = ref(true);
const expandedEventId = ref(auditEvents[0].id);
const exportDialogOpen = ref(false);
const exportIncludesJson = ref(true);

const filteredEvents = computed(() => {
	const query = searchQuery.value.trim().toLowerCase();

	return auditEvents.filter((event) => {
		const matchesQuery = !query || [
			event.actor,
			event.email,
			event.action,
			event.description,
			event.resource,
			event.requestId,
			event.ip,
		].join(' ').toLowerCase().includes(query);
		const matchesEnvironment = selectedEnvironment.value === 'all' || event.environment === selectedEnvironment.value;
		const matchesCategory = selectedCategory.value === 'all' || event.category === selectedCategory.value;
		const matchesOutcome = selectedOutcome.value === 'all' || event.outcome === selectedOutcome.value;
		const matchesSensitivity = includeSensitive.value || !['High', 'Critical'].includes(event.severity);

		return matchesQuery && matchesEnvironment && matchesCategory && matchesOutcome && matchesSensitivity;
	});
});

const expandedEvent = computed(() => filteredEvents.value.find((event) => event.id === expandedEventId.value) || filteredEvents.value[0]);
const highRiskCount = computed(() => filteredEvents.value.filter((event) => ['High', 'Critical'].includes(event.severity)).length);
const retainedCount = computed(() => filteredEvents.value.filter((event) => event.retained).length);
const successRate = computed(() => {
	if (!filteredEvents.value.length) return 0;
	return Math.round((filteredEvents.value.filter((event) => event.outcome === 'Success').length / filteredEvents.value.length) * 100);
});
const exportSummary = computed(() => `${filteredEvents.value.length} events / ${retainedCount.value} retained / ${highRiskCount.value} high risk`);

function toggleEvent(event) {
	expandedEventId.value = expandedEventId.value === event.id ? '' : event.id;
}

function severityClasses(severity) {
	return {
		Critical: 'bg-destructive text-destructive-fg',
		High: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
		Medium: 'bg-warning/15 text-warning',
		Low: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
	}[severity] || 'bg-secondary text-muted-fg';
}

function outcomeClasses(outcome) {
	return {
		Success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		Denied: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
		Failed: 'bg-destructive/15 text-destructive',
	}[outcome] || 'bg-secondary text-muted-fg';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-raised px-4 py-4 sm:px-6">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div class="min-w-0">
					<p class="text-xs font-semibold uppercase text-muted-fg">Enterprise security</p>
					<h3 class="mt-1 text-2xl font-semibold tracking-tight">Audit log explorer</h3>
					<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">
						Filter account activity, inspect request evidence, and prepare audit exports without leaving the admin workspace.
					</p>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<DomTooltip text="Exports are generated as background jobs and recorded as audit events.">
						<DomButton variant="ghost" size="sm" @click="exportDialogOpen = true">
							<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M12 4v10m0 0 4-4m-4 4-4-4M5 20h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
							Export
						</DomButton>
					</DomTooltip>
					<DomButton size="sm">
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M5 12h14M12 5v14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						</svg>
						Create alert
					</DomButton>
				</div>
			</div>

			<div class="mt-5 grid gap-3 sm:grid-cols-3">
				<div class="rounded-2xl border border-border bg-background p-4">
					<p class="text-xs font-medium text-muted-fg">Matching events</p>
					<p class="mt-2 text-2xl font-semibold">{{ filteredEvents.length }}</p>
				</div>
				<div class="rounded-2xl border border-border bg-background p-4">
					<p class="text-xs font-medium text-muted-fg">Success rate</p>
					<p class="mt-2 text-2xl font-semibold">{{ successRate }}%</p>
				</div>
				<div class="rounded-2xl border border-border bg-background p-4">
					<p class="text-xs font-medium text-muted-fg">High risk</p>
					<p class="mt-2 text-2xl font-semibold">{{ highRiskCount }}</p>
				</div>
			</div>
		</header>

		<section class="border-b border-border px-4 py-4 sm:px-6">
			<div class="grid gap-3 lg:grid-cols-[minmax(12rem,1fr)_12rem_12rem_12rem_auto] lg:items-end">
				<DomTextInput v-model="searchQuery" label="Search events" placeholder="Actor, action, request id, IP..." />
				<DomNativeSelect v-model="selectedEnvironment" label="Environment" :options="environmentOptions" />
				<DomNativeSelect v-model="selectedCategory" label="Category" :options="categoryOptions" />
				<DomNativeSelect v-model="selectedOutcome" label="Outcome" :options="outcomeOptions" />
				<div class="rounded-2xl border border-border bg-secondary px-3 py-2">
					<DomToggle v-model="includeSensitive" label="Sensitive" />
				</div>
			</div>
		</section>

		<section class="overflow-x-auto">
			<table class="min-w-[58rem] w-full border-collapse text-left text-sm">
				<thead class="border-b border-border bg-secondary/70 text-xs uppercase text-muted-fg">
					<tr>
						<th class="px-4 py-3 font-semibold sm:px-6">Event</th>
						<th class="px-4 py-3 font-semibold">Actor</th>
						<th class="px-4 py-3 font-semibold">Resource</th>
						<th class="px-4 py-3 font-semibold">Signal</th>
						<th class="px-4 py-3 font-semibold">Request</th>
						<th class="px-4 py-3 text-right font-semibold">Time</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					<template v-for="event in filteredEvents" :key="event.id">
						<tr class="cursor-pointer transition hover:bg-secondary/50" @click="toggleEvent(event)">
							<td class="px-4 py-4 sm:px-6">
								<div class="flex min-w-0 items-start gap-3">
									<span class="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-fg">
										<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
											<path d="M7 4h10v16H7V4Zm3 5h4M10 13h4M10 17h2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
										</svg>
									</span>
									<span class="min-w-0">
										<span class="block truncate font-mono text-xs text-muted-fg">{{ event.action }}</span>
										<span class="mt-1 block max-w-[24rem] truncate font-medium">{{ event.description }}</span>
									</span>
								</div>
							</td>
							<td class="px-4 py-4">
								<p class="font-medium">{{ event.actor }}</p>
								<p class="mt-1 max-w-[11rem] truncate text-xs text-muted-fg">{{ event.email }}</p>
							</td>
							<td class="px-4 py-4">
								<p class="font-medium">{{ event.resource }}</p>
								<p class="mt-1 text-xs text-muted-fg">{{ event.resourceType }} / {{ event.environment }}</p>
							</td>
							<td class="px-4 py-4">
								<div class="flex flex-wrap gap-1.5">
									<span class="rounded-full px-2 py-1 text-[11px] font-semibold" :class="severityClasses(event.severity)">
										{{ event.severity }}
									</span>
									<span class="rounded-full px-2 py-1 text-[11px] font-semibold" :class="outcomeClasses(event.outcome)">
										{{ event.outcome }}
									</span>
								</div>
							</td>
							<td class="px-4 py-4">
								<p class="font-mono text-xs">{{ event.requestId }}</p>
								<p class="mt-1 text-xs text-muted-fg">{{ event.ip }}</p>
							</td>
							<td class="px-4 py-4 text-right">
								<p class="font-medium">{{ event.time }}</p>
								<p class="mt-1 text-xs text-muted-fg">{{ event.date }}</p>
							</td>
						</tr>
						<tr v-if="expandedEvent?.id === event.id" class="bg-secondary/35">
							<td colspan="6" class="px-4 py-4 sm:px-6">
								<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
									<div class="rounded-2xl border border-border bg-background p-4">
										<div class="flex flex-wrap items-center justify-between gap-3">
											<div>
												<p class="text-xs font-semibold uppercase text-muted-fg">Event metadata</p>
												<h4 class="mt-1 font-semibold">{{ event.id }}</h4>
											</div>
											<span class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg">
												{{ event.category }}
											</span>
										</div>
										<div class="mt-4 grid gap-3 sm:grid-cols-3">
											<div
												v-for="item in event.metadata"
												:key="item.label"
												class="rounded-xl border border-border bg-secondary/50 p-3"
											>
												<p class="text-xs font-medium text-muted-fg">{{ item.label }}</p>
												<p class="mt-1 break-words text-sm font-medium">{{ item.value }}</p>
											</div>
										</div>
									</div>
									<div class="rounded-2xl border border-border bg-background p-4">
										<p class="text-xs font-semibold uppercase text-muted-fg">Request context</p>
										<dl class="mt-3 space-y-2 text-sm">
											<div class="flex justify-between gap-3">
												<dt class="text-muted-fg">Region</dt>
												<dd class="font-medium">{{ event.region }}</dd>
											</div>
											<div class="flex justify-between gap-3">
												<dt class="text-muted-fg">Retained</dt>
												<dd class="font-medium">{{ event.retained ? 'Yes' : 'Standard' }}</dd>
											</div>
											<div class="flex justify-between gap-3">
												<dt class="text-muted-fg">Environment</dt>
												<dd class="font-medium">{{ event.environment }}</dd>
											</div>
										</dl>
									</div>
								</div>
							</td>
						</tr>
					</template>
				</tbody>
			</table>

			<div v-if="!filteredEvents.length" class="p-10 text-center">
				<p class="font-medium">No audit events match these filters.</p>
				<p class="mt-2 text-sm text-muted-fg">Try widening the environment, category, or sensitive-event filter.</p>
			</div>
		</section>

		<footer class="flex flex-col gap-3 border-t border-border px-4 py-4 text-sm text-muted-fg sm:flex-row sm:items-center sm:justify-between sm:px-6">
			<p>{{ exportSummary }}</p>
			<p>Cursor page 1 of 8 / 15 minute retention delay</p>
		</footer>

		<DomDialog v-model="exportDialogOpen" title="Export audit events">
			<div class="space-y-4 text-sm">
				<p class="leading-6 text-muted-fg">
					Generate a compliance export for the current filters. The export job should be written back into the audit log.
				</p>
				<div class="rounded-2xl border border-border bg-secondary p-4">
					<p class="font-semibold">{{ exportSummary }}</p>
					<p class="mt-1 text-muted-fg">Production-safe exports should expire and require admin permissions.</p>
				</div>
				<DomToggle v-model="exportIncludesJson" label="Include raw JSON metadata" />
				<div class="flex justify-end gap-2">
					<DomButton variant="ghost" @click="exportDialogOpen = false">Cancel</DomButton>
					<DomButton @click="exportDialogOpen = false">Start export</DomButton>
				</div>
			</div>
		</DomDialog>
	</div>
</template>
