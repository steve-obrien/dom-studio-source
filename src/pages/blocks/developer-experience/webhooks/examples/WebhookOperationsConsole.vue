<script setup>
import { computed, ref, watch } from 'vue';
import { DomButton, DomCard, DomNativeSelect, DomTabs, DomTextInput, DomToggle } from '@getdom/studio/vue';

const environmentOptions = [
	{ label: 'Production', value: 'Production' },
	{ label: 'Staging', value: 'Staging' },
	{ label: 'Development', value: 'Development' },
];

const tabs = [
	{ key: 'events', label: 'Events' },
	{ key: 'deliveries', label: 'Deliveries' },
	{ key: 'security', label: 'Security' },
];

const eventGroups = [
	{
		title: 'Customers',
		events: [
			{ key: 'customer.created', label: 'Customer created', description: 'A customer profile is created.' },
			{ key: 'customer.updated', label: 'Customer updated', description: 'A customer profile changes.' },
		],
	},
	{
		title: 'Billing',
		events: [
			{ key: 'invoice.paid', label: 'Invoice paid', description: 'An invoice is paid successfully.' },
			{ key: 'invoice.payment_failed', label: 'Payment failed', description: 'A payment attempt needs attention.' },
		],
	},
	{
		title: 'Subscriptions',
		events: [
			{ key: 'subscription.created', label: 'Subscription created', description: 'A subscription becomes active.' },
			{ key: 'subscription.updated', label: 'Subscription updated', description: 'Plan, quantity, or status changes.' },
		],
	},
];

const endpoints = [
	{
		id: 'we_prod_platform',
		name: 'Production platform',
		url: 'https://api.acme.example/webhooks/dom',
		environment: 'Production',
		status: 'Healthy',
		apiVersion: '2026-06-01',
		secretPrefix: 'whsec_4A7K',
		successRate: 99.6,
		latencyMs: 318,
		failures: 2,
		events: ['customer.created', 'invoice.paid', 'subscription.updated'],
		attempts: [
			{ id: 'evt_1092', event: 'invoice.paid', status: 'Delivered', responseCode: 200, latencyMs: 241, time: '2 minutes ago' },
			{ id: 'evt_1091', event: 'customer.created', status: 'Delivered', responseCode: 200, latencyMs: 289, time: '11 minutes ago' },
			{ id: 'evt_1088', event: 'invoice.payment_failed', status: 'Failed', responseCode: 500, latencyMs: 10000, time: '28 minutes ago' },
		],
	},
	{
		id: 'we_prod_crm',
		name: 'CRM enrichment',
		url: 'https://hooks.customerops.example/dom',
		environment: 'Production',
		status: 'Needs review',
		apiVersion: '2026-04-15',
		secretPrefix: 'whsec_9LM2',
		successRate: 96.8,
		latencyMs: 842,
		failures: 8,
		events: ['customer.created', 'customer.updated'],
		attempts: [
			{ id: 'evt_1077', event: 'customer.updated', status: 'Retrying', responseCode: 429, latencyMs: 1200, time: '44 minutes ago' },
			{ id: 'evt_1072', event: 'customer.created', status: 'Delivered', responseCode: 200, latencyMs: 612, time: '1 hour ago' },
			{ id: 'evt_1066', event: 'customer.updated', status: 'Failed', responseCode: 401, latencyMs: 164, time: '3 hours ago' },
		],
	},
	{
		id: 'we_stage_checkout',
		name: 'Checkout staging',
		url: 'https://staging.acme.example/webhooks/dom',
		environment: 'Staging',
		status: 'Testing',
		apiVersion: '2026-06-01',
		secretPrefix: 'whsec_TEST',
		successRate: 91.4,
		latencyMs: 511,
		failures: 5,
		events: ['invoice.paid', 'invoice.payment_failed', 'subscription.created'],
		attempts: [
			{ id: 'evt_test_211', event: 'subscription.created', status: 'Delivered', responseCode: 200, latencyMs: 333, time: '7 minutes ago' },
			{ id: 'evt_test_210', event: 'invoice.payment_failed', status: 'Failed', responseCode: 404, latencyMs: 88, time: '19 minutes ago' },
			{ id: 'evt_test_208', event: 'invoice.paid', status: 'Delivered', responseCode: 200, latencyMs: 305, time: '1 hour ago' },
		],
	},
	{
		id: 'we_dev_tunnel',
		name: 'Local tunnel',
		url: 'https://dev-tunnel.example/webhooks',
		environment: 'Development',
		status: 'Testing',
		apiVersion: '2026-06-01',
		secretPrefix: 'whsec_DEV',
		successRate: 88.2,
		latencyMs: 190,
		failures: 3,
		events: ['customer.created', 'invoice.paid'],
		attempts: [
			{ id: 'evt_dev_044', event: 'customer.created', status: 'Delivered', responseCode: 200, latencyMs: 145, time: '4 minutes ago' },
			{ id: 'evt_dev_043', event: 'invoice.paid', status: 'Retrying', responseCode: 502, latencyMs: 900, time: '14 minutes ago' },
			{ id: 'evt_dev_041', event: 'invoice.paid', status: 'Failed', responseCode: 0, latencyMs: 10000, time: '52 minutes ago' },
		],
	},
];

const selectedEnvironment = ref('Production');
const selectedEndpointId = ref(endpoints[0].id);
const activeTab = ref('events');
const endpointUrl = ref(endpoints[0].url);
const apiVersion = ref(endpoints[0].apiVersion);
const selectedEvents = ref([...endpoints[0].events]);
const deliveryFilter = ref('All');
const showSecret = ref(false);
const sendTestEvent = ref(true);

const filteredEndpoints = computed(() => endpoints.filter((endpoint) => endpoint.environment === selectedEnvironment.value));
const selectedEndpoint = computed(() => endpoints.find((endpoint) => endpoint.id === selectedEndpointId.value) || filteredEndpoints.value[0] || endpoints[0]);
const filteredAttempts = computed(() => {
	if (deliveryFilter.value === 'All') return selectedEndpoint.value.attempts;
	return selectedEndpoint.value.attempts.filter((attempt) => attempt.status === deliveryFilter.value);
});
const subscribedCount = computed(() => selectedEvents.value.length);
const visibleSecret = computed(() => showSecret.value ? `${selectedEndpoint.value.secretPrefix}_rV4mH6kL1sN7xT3c` : `${selectedEndpoint.value.secretPrefix}****************`);
const healthTone = computed(() => selectedEndpoint.value.status === 'Healthy' ? 'text-emerald-700 dark:text-emerald-300' : 'text-warning');

watch(selectedEnvironment, () => {
	const firstEndpoint = filteredEndpoints.value[0];
	if (firstEndpoint) selectEndpoint(firstEndpoint);
});

function selectEndpoint(endpoint) {
	selectedEndpointId.value = endpoint.id;
	endpointUrl.value = endpoint.url;
	apiVersion.value = endpoint.apiVersion;
	selectedEvents.value = [...endpoint.events];
	activeTab.value = 'events';
}

function toggleEvent(eventKey) {
	selectedEvents.value = selectedEvents.value.includes(eventKey)
		? selectedEvents.value.filter((key) => key !== eventKey)
		: [...selectedEvents.value, eventKey];
}

function deliveryClasses(status) {
	return {
		Delivered: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		Retrying: 'bg-warning/15 text-warning',
		Failed: 'bg-destructive/15 text-destructive',
	}[status] || 'bg-secondary text-muted-fg';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="flex flex-wrap items-center justify-between gap-3 border-b border-border skin-raised px-4 py-4 sm:px-5">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Developer operations</p>
				<h3 class="mt-1 text-xl font-semibold tracking-tight">Webhooks</h3>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<DomNativeSelect v-model="selectedEnvironment" :options="environmentOptions" class="w-40" />
				<DomButton size="sm">
					<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
					</svg>
					New endpoint
				</DomButton>
			</div>
		</header>

		<div class="grid min-h-[45rem] lg:grid-cols-[18rem_minmax(0,1fr)_19rem]">
			<aside class="border-b border-border skin-raised p-3 lg:border-b-0 lg:border-r">
				<div class="mb-3 grid grid-cols-3 gap-2 text-center">
					<div class="rounded-lg border border-border bg-background p-2">
						<p class="text-lg font-semibold">8</p>
						<p class="text-[11px] text-muted-fg">Endpoints</p>
					</div>
					<div class="rounded-lg border border-border bg-background p-2">
						<p class="text-lg font-semibold">42k</p>
						<p class="text-[11px] text-muted-fg">Events</p>
					</div>
					<div class="rounded-lg border border-border bg-background p-2">
						<p class="text-lg font-semibold">99.1%</p>
						<p class="text-[11px] text-muted-fg">Success</p>
					</div>
				</div>

				<div class="space-y-2">
					<button
						v-for="endpoint in filteredEndpoints"
						:key="endpoint.id"
						type="button"
						class="w-full rounded-lg border p-3 text-left transition hover:border-primary/50"
						:class="endpoint.id === selectedEndpoint.id ? 'border-primary/60 bg-primary/5' : 'border-border bg-background'"
						@click="selectEndpoint(endpoint)"
					>
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<p class="truncate text-sm font-semibold">{{ endpoint.name }}</p>
								<p class="mt-1 truncate text-xs text-muted-fg">{{ endpoint.url }}</p>
							</div>
							<span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-fg">
								{{ endpoint.events.length }}
							</span>
						</div>
						<div class="mt-3 flex items-center justify-between text-xs">
							<span :class="endpoint.status === 'Healthy' ? 'text-emerald-700 dark:text-emerald-300' : 'text-warning'">
								{{ endpoint.status }}
							</span>
							<span class="text-muted-fg">{{ endpoint.failures }} failures</span>
						</div>
					</button>
				</div>
			</aside>

			<main class="space-y-4 p-4 sm:p-5">
				<section class="grid gap-3 md:grid-cols-3">
					<DomCard class="p-4">
						<p class="text-xs font-medium text-muted-fg">Selected endpoint</p>
						<p class="mt-2 truncate text-lg font-semibold">{{ selectedEndpoint.name }}</p>
						<p class="mt-1 truncate text-xs text-muted-fg">{{ selectedEndpoint.url }}</p>
					</DomCard>
					<DomCard class="p-4">
						<p class="text-xs font-medium text-muted-fg">Delivery health</p>
						<p class="mt-2 text-lg font-semibold" :class="healthTone">{{ selectedEndpoint.successRate }}% success</p>
						<p class="mt-1 text-xs text-muted-fg">{{ selectedEndpoint.failures }} failures in 24 hours</p>
					</DomCard>
					<DomCard class="p-4">
						<p class="text-xs font-medium text-muted-fg">Median latency</p>
						<p class="mt-2 text-lg font-semibold">{{ selectedEndpoint.latencyMs }}ms</p>
						<p class="mt-1 text-xs text-muted-fg">Version {{ selectedEndpoint.apiVersion }}</p>
					</DomCard>
				</section>

				<section class="rounded-xl border border-border bg-background">
					<div class="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
						<div>
							<h4 class="font-semibold">Endpoint configuration</h4>
							<p class="mt-1 text-sm text-muted-fg">Tune the destination, subscribed events, and delivery workflow.</p>
						</div>
						<div class="flex gap-2">
							<DomButton variant="ghost" size="sm">Send test</DomButton>
							<DomButton size="sm">Save changes</DomButton>
						</div>
					</div>

					<div class="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(0,1fr)_11rem]">
						<DomTextInput v-model="endpointUrl" label="Endpoint URL" type="url" />
						<DomTextInput v-model="apiVersion" label="API version" />
					</div>

					<div class="border-b border-border px-4 pt-3">
						<DomTabs v-model="activeTab" :tabs="tabs" />
					</div>

					<div v-if="activeTab === 'events'" class="grid gap-3 p-4 md:grid-cols-3">
						<div v-for="group in eventGroups" :key="group.title" class="rounded-lg border border-border skin-raised p-3">
							<h5 class="text-sm font-semibold">{{ group.title }}</h5>
							<div class="mt-3 space-y-3">
								<label v-for="event in group.events" :key="event.key" class="flex gap-3">
									<input
										type="checkbox"
										class="mt-1 size-4 rounded border-border text-primary"
										:checked="selectedEvents.includes(event.key)"
										@change="toggleEvent(event.key)"
									>
									<span>
										<span class="block text-sm font-medium">{{ event.label }}</span>
										<span class="block font-mono text-[11px] text-muted-fg">{{ event.key }}</span>
										<span class="block text-xs leading-5 text-muted-fg">{{ event.description }}</span>
									</span>
								</label>
							</div>
						</div>
					</div>

					<div v-else-if="activeTab === 'deliveries'" class="p-4">
						<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
							<p class="text-sm text-muted-fg">Recent delivery attempts for {{ selectedEndpoint.name }}.</p>
							<div class="flex gap-2">
								<button
									v-for="filter in ['All', 'Delivered', 'Retrying', 'Failed']"
									:key="filter"
									type="button"
									class="rounded-full px-3 py-1 text-xs font-semibold transition"
									:class="deliveryFilter === filter ? 'bg-primary text-primary-fg' : 'bg-secondary text-muted-fg hover:text-fg'"
									@click="deliveryFilter = filter"
								>
									{{ filter }}
								</button>
							</div>
						</div>
						<div class="overflow-hidden rounded-lg border border-border">
							<div
								v-for="attempt in filteredAttempts"
								:key="attempt.id"
								class="grid gap-3 border-b border-border p-3 text-sm last:border-b-0 md:grid-cols-[minmax(0,1fr)_7rem_5rem_6rem_5rem]"
							>
								<div class="min-w-0">
									<p class="truncate font-medium">{{ attempt.event }}</p>
									<p class="font-mono text-xs text-muted-fg">{{ attempt.id }} / {{ attempt.time }}</p>
								</div>
								<span class="w-max rounded-full px-2 py-1 text-xs font-semibold" :class="deliveryClasses(attempt.status)">
									{{ attempt.status }}
								</span>
								<p class="text-muted-fg">{{ attempt.responseCode }}</p>
								<p class="text-muted-fg">{{ attempt.latencyMs }}ms</p>
								<DomButton v-if="attempt.status !== 'Delivered'" variant="ghost" size="sm">Retry</DomButton>
							</div>
						</div>
					</div>

					<div v-else class="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_16rem]">
						<div class="rounded-lg border border-border skin-raised p-4">
							<p class="text-sm font-semibold">Signing secret</p>
							<div class="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-3">
								<code class="min-w-0 flex-1 truncate text-xs">{{ visibleSecret }}</code>
								<DomButton variant="ghost" size="sm" @click="showSecret = !showSecret">
									{{ showSecret ? 'Hide' : 'Reveal' }}
								</DomButton>
							</div>
							<p class="mt-3 text-xs leading-5 text-muted-fg">Reveal secrets only to authorized admins and log every rotation.</p>
						</div>
						<div class="rounded-lg border border-border skin-raised p-4">
							<DomToggle v-model="sendTestEvent" label="Send a test event after saving" />
							<p class="mt-3 text-xs leading-5 text-muted-fg">Use a synthetic payload to confirm DNS, TLS, signature, and response handling.</p>
						</div>
					</div>
				</section>
			</main>

			<aside class="space-y-3 border-t border-border skin-raised p-4 lg:border-l lg:border-t-0">
				<section class="rounded-xl border border-border bg-background p-4">
					<p class="text-sm font-semibold">Readiness</p>
					<div class="mt-3 space-y-3">
						<div class="flex items-center justify-between gap-3 text-sm">
							<span class="text-muted-fg">Subscribed events</span>
							<span class="font-semibold">{{ subscribedCount }}</span>
						</div>
						<div class="flex items-center justify-between gap-3 text-sm">
							<span class="text-muted-fg">Secret rotation</span>
							<span class="font-semibold">84 days</span>
						</div>
						<div class="flex items-center justify-between gap-3 text-sm">
							<span class="text-muted-fg">Retry policy</span>
							<span class="font-semibold">3 attempts</span>
						</div>
					</div>
				</section>

				<section class="rounded-xl border border-border bg-background p-4">
					<p class="text-sm font-semibold">Launch checklist</p>
					<div class="mt-3 space-y-2">
						<label class="flex items-center gap-2 text-sm">
							<input type="checkbox" class="size-4 rounded border-border text-primary" checked>
							<span>Endpoint returns 2xx</span>
						</label>
						<label class="flex items-center gap-2 text-sm">
							<input type="checkbox" class="size-4 rounded border-border text-primary" checked>
							<span>Signature verified</span>
						</label>
						<label class="flex items-center gap-2 text-sm">
							<input type="checkbox" class="size-4 rounded border-border text-primary">
							<span>Failure alert connected</span>
						</label>
					</div>
				</section>

				<section class="rounded-xl border border-border bg-background p-4">
					<p class="text-sm font-semibold">Activity</p>
					<div class="mt-3 space-y-3 text-sm">
						<div>
							<p class="font-medium">Delivery retried</p>
							<p class="text-xs text-muted-fg">Ari Grant / 18 minutes ago</p>
						</div>
						<div>
							<p class="font-medium">Events updated</p>
							<p class="text-xs text-muted-fg">Maya Chen / Today 10:21</p>
						</div>
						<div>
							<p class="font-medium">Secret rotated</p>
							<p class="text-xs text-muted-fg">Security bot / Jun 01, 2026</p>
						</div>
					</div>
				</section>
			</aside>
		</div>
	</div>
</template>
