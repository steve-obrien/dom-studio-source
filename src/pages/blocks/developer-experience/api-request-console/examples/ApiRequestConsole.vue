<script setup>
import { computed, ref } from 'vue';
import {
	DomBadge,
	DomButton,
	DomCodeInput,
	DomDialog,
	DomListbox,
	DomRangeInput,
	DomStatusPill,
	DomTagCombobox,
	DomTextareaInput,
	DomTextInput,
	DomToggleButtonGroup,
} from '@getdom/studio/vue';
import RequestTimelineItem from '../components/RequestTimelineItem.vue';
import ResponseStat from '../components/ResponseStat.vue';

const methodOptions = [
	{ label: 'GET', value: 'GET' },
	{ label: 'POST', value: 'POST' },
	{ label: 'PATCH', value: 'PATCH' },
	{ label: 'DELETE', value: 'DELETE' },
];

const environments = [
	{
		label: 'Production',
		value: 'prod',
		baseUrl: 'https://api.acme.example',
		status: 'Protected',
		detail: 'Live data, audited proxy',
		tone: 'danger',
	},
	{
		label: 'Staging',
		value: 'stage',
		baseUrl: 'https://staging-api.acme.example',
		status: 'Safe',
		detail: 'Mirrored schema, test data',
		tone: 'success',
	},
	{
		label: 'Local tunnel',
		value: 'local',
		baseUrl: 'https://dev-tunnel.example',
		status: 'Developer',
		detail: 'Forwarded to localhost',
		tone: 'info',
	},
];

const scopeOptions = [
	{ label: 'Customers read', value: 'customers:read', description: 'Lookup customer profile and metadata', group: 'Customers' },
	{ label: 'Customers write', value: 'customers:write', description: 'Update contact and lifecycle fields', group: 'Customers' },
	{ label: 'Billing read', value: 'billing:read', description: 'Inspect invoices, plans, and payment state', group: 'Billing' },
	{ label: 'Billing write', value: 'billing:write', description: 'Create invoices and adjust subscriptions', group: 'Billing' },
	{ label: 'Events replay', value: 'events:replay', description: 'Replay webhook or event deliveries', group: 'Events' },
	{ label: 'Admin command', value: 'admin:command', description: 'Run protected operational commands', group: 'Admin' },
];

const requestExamples = [
	{
		id: 'create-invoice',
		name: 'Create invoice',
		method: 'POST',
		path: '/v1/invoices',
		scopes: ['billing:write', 'customers:read'],
		body: `{
	"customerId": "cus_1842",
	"collectionMethod": "send_invoice",
	"daysUntilDue": 14,
	"lineItems": [
		{ "priceId": "price_growth", "quantity": 3 }
	]
}`,
	},
	{
		id: 'lookup-customer',
		name: 'Lookup customer',
		method: 'GET',
		path: '/v1/customers/cus_1842',
		scopes: ['customers:read'],
		body: '{\n\t"include": ["subscriptions", "riskSignals"]\n}',
	},
	{
		id: 'replay-event',
		name: 'Replay event',
		method: 'POST',
		path: '/v1/events/evt_2091/replay',
		scopes: ['events:replay'],
		body: `{
	"endpointId": "we_prod_platform",
	"reason": "Customer requested delivery replay after receiver fix"
}`,
	},
];

const method = ref('POST');
const environmentId = ref('stage');
const path = ref('/v1/invoices');
const scopes = ref(['billing:write', 'customers:read']);
const timeoutMs = ref(4500);
const body = ref(requestExamples[0].body);
const templateName = ref('Create draft invoice');
const templateNotes = ref('Use during support-assisted billing setup after confirming customer plan and tax region.');
const isSavingDialogOpen = ref(false);
const isSending = ref(false);
const sendCount = ref(12);
const selectedExampleId = ref('create-invoice');
const lastRunAt = ref('10:44');
const lastStatus = ref(201);
const lastLatency = ref(286);
const lastRequestId = ref('req_9H2kL6');

const selectedEnvironment = computed(() => environments.find((item) => item.value === environmentId.value) || environments[1]);
const selectedExample = computed(() => requestExamples.find((item) => item.id === selectedExampleId.value) || requestExamples[0]);
const fullUrl = computed(() => `${selectedEnvironment.value.baseUrl}${path.value || '/'}`);
const parsedBody = computed(() => {
	try {
		return { valid: true, value: JSON.parse(body.value || '{}'), error: '' };
	} catch (error) {
		return { valid: false, value: null, error: error.message };
	}
});
const responseTone = computed(() => {
	if (!parsedBody.value.valid) return 'danger';
	if (lastStatus.value >= 400) return 'danger';
	if (lastStatus.value >= 300) return 'warning';
	return 'success';
});
const responseBody = computed(() => {
	const payload = parsedBody.value.valid ? parsedBody.value.value : { parseError: parsedBody.value.error };
	return JSON.stringify({
		id: method.value === 'GET' ? 'cus_1842' : 'in_4928',
		object: method.value === 'GET' ? 'customer' : 'invoice',
		status: parsedBody.value.valid ? 'created' : 'rejected',
		request: {
			method: method.value,
			url: fullUrl.value,
			scopes: scopes.value,
			timeoutMs: timeoutMs.value,
		},
		payload,
		diagnostics: {
			requestId: lastRequestId.value,
			latencyMs: lastLatency.value,
			proxy: selectedEnvironment.value.label,
			audited: true,
		},
	}, null, 2);
});
const curlSnippet = computed(() => `curl -X ${method.value} "${fullUrl.value}" \\
	-H "Authorization: Bearer $API_KEY" \\
	-H "Content-Type: application/json" \\
	-H "Idempotency-Key: demo-${sendCount.value}" \\
	--max-time ${(Number(timeoutMs.value) / 1000).toFixed(1)} \\
	-d '${body.value.replace(/\n/g, '')}'`);
const timeline = computed(() => [
	{
		step: 'Validate request body',
		status: parsedBody.value.valid ? 'complete' : 'warning',
		time: '12ms',
		detail: parsedBody.value.valid ? 'JSON parsed and required content headers attached.' : parsedBody.value.error,
	},
	{
		step: 'Authorize requested scopes',
		status: scopes.value.length ? 'complete' : 'warning',
		time: '34ms',
		detail: scopes.value.length ? `${scopes.value.length} scopes checked against the selected environment.` : 'Add at least one scope before running privileged calls.',
	},
	{
		step: 'Proxy request to API edge',
		status: isSending.value ? 'active' : 'complete',
		time: `${Math.max(80, Number(timeoutMs.value) - 3920)}ms`,
		detail: `Sent through ${selectedEnvironment.value.label.toLowerCase()} with request audit capture enabled.`,
	},
	{
		step: 'Persist run log',
		status: 'complete',
		time: '18ms',
		detail: `Stored as ${lastRequestId.value} for replay, support review, and rate-limit analysis.`,
	},
]);

function applyExample(example) {
	selectedExampleId.value = example.id;
	method.value = example.method;
	path.value = example.path;
	scopes.value = [...example.scopes];
	body.value = example.body;
	templateName.value = example.name;
}

function sendRequest() {
	isSending.value = true;
	window.setTimeout(() => {
		sendCount.value += 1;
		lastRunAt.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		lastLatency.value = parsedBody.value.valid ? 220 + ((sendCount.value * 37) % 180) : 64;
		lastStatus.value = parsedBody.value.valid ? (method.value === 'DELETE' ? 202 : method.value === 'GET' ? 200 : 201) : 400;
		lastRequestId.value = `req_${String(sendCount.value).padStart(4, '0')}K`;
		isSending.value = false;
	}, 520);
}

function saveTemplate() {
	isSavingDialogOpen.value = false;
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-4 py-4 sm:px-5">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div class="min-w-0">
					<p class="text-xs font-semibold uppercase text-muted-fg">Developer workbench</p>
					<h3 class="mt-1 text-xl font-semibold">API request console</h3>
					<p class="mt-1 max-w-3xl text-sm leading-6 text-muted-fg">
						Compose customer-safe API calls, test payloads through a proxy, and save reusable request templates.
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<DomDialog
						v-model="isSavingDialogOpen"
						title="Save request template"
						description="Name this request and add guidance for teammates before it becomes reusable."
					>
						<template #trigger>
							<DomButton variant="secondary" size="sm">Save template</DomButton>
						</template>
						<div class="space-y-4">
							<DomTextInput v-model="templateName" label="Template name" />
							<DomTextareaInput v-model="templateNotes" label="Notes" :rows="4" />
						</div>
						<template #footer>
							<DomButton data-close variant="ghost" size="sm">Cancel</DomButton>
							<DomButton size="sm" @click="saveTemplate">Save template</DomButton>
						</template>
					</DomDialog>
					<DomButton size="sm" :loading="isSending" @click="sendRequest">
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M7 5v14l11-7L7 5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
						</svg>
						Send request
					</DomButton>
				</div>
			</div>

			<div class="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-[minmax(0,1fr)_minmax(13rem,0.35fr)]">
				<div class="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
					<DomToggleButtonGroup v-model="method" :options="methodOptions" label="Method" size="sm" chrome="none" />
					<DomTextInput v-model="path" label="Request path" />
				</div>
				<div class="rounded-2xl border border-border bg-canvas p-3">
					<p class="text-xs font-medium text-muted-fg">Resolved URL</p>
					<p class="mt-1 break-all font-mono text-xs leading-5 text-canvas-fg">{{ fullUrl }}</p>
				</div>
			</div>
		</header>

		<div class="grid gap-0 xl:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.55fr)]">
			<main class="min-w-0">
				<section class="grid gap-4 border-b border-border p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
					<div class="space-y-4">
						<div class="grid gap-4 md:grid-cols-2">
							<DomListbox v-model="environmentId" :options="environments" label="Environment">
								<template #option="{ option }">
									<span class="flex min-w-0 items-start justify-between gap-3">
										<span class="min-w-0">
											<span class="block text-sm font-semibold">{{ option.label }}</span>
											<span class="mt-0.5 block truncate text-xs opacity-75">{{ option.detail }}</span>
										</span>
										<DomBadge :tone="option.tone" variant="soft" size="sm">{{ option.status }}</DomBadge>
									</span>
								</template>
							</DomListbox>

							<div class="grid content-start gap-4">
								<DomRangeInput v-model="timeoutMs" label="Timeout budget" :min="1000" :max="10000" :step="500" suffix="ms" />
								<DomTagCombobox
									v-model="scopes"
									:options="scopeOptions"
									label="Required scopes"
									placeholder="Add scope"
									clearable
								>
									<template #item="{ item }">
										<span class="block">
											<span class="flex items-center justify-between gap-3">
												<span class="font-medium">{{ item.label }}</span>
												<span class="text-[11px] text-muted-fg">{{ item.group }}</span>
											</span>
											<span class="mt-0.5 block text-xs text-muted-fg">{{ item.description }}</span>
										</span>
									</template>
								</DomTagCombobox>
							</div>
						</div>

						<div class="grid gap-4 lg:grid-cols-2">
							<DomCodeInput v-model="body" label="Request JSON" lang="json" :rows="14" :editor="false" />
							<DomCodeInput :model-value="curlSnippet" label="Generated curl" lang="text" :rows="14" :editor="false" read-only />
						</div>
					</div>

					<aside class="rounded-2xl border border-border skin-card p-3">
						<div class="flex items-center justify-between gap-3">
							<div>
								<p class="text-sm font-semibold">Templates</p>
								<p class="mt-1 text-xs text-muted-fg">Start from a safe request shape.</p>
							</div>
							<DomStatusPill size="sm" tone="success">Synced</DomStatusPill>
						</div>
						<div class="mt-3 space-y-2">
							<button
								v-for="example in requestExamples"
								:key="example.id"
								type="button"
								class="w-full rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-ring"
								:class="example.id === selectedExample.id ? 'border-primary bg-primary/5' : 'border-border bg-canvas hover:border-primary/40'"
								@click="applyExample(example)"
							>
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="truncate text-sm font-semibold">{{ example.name }}</p>
										<p class="mt-1 truncate font-mono text-xs text-muted-fg">{{ example.path }}</p>
									</div>
									<DomBadge tone="neutral" variant="outline" size="sm">{{ example.method }}</DomBadge>
								</div>
								<p class="mt-2 text-xs text-muted-fg">{{ example.scopes.length }} scopes required</p>
							</button>
						</div>
					</aside>
				</section>

				<section class="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
					<div class="space-y-4">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p class="text-sm font-semibold">Response diagnostics</p>
								<p class="mt-1 text-xs text-muted-fg">Last run {{ lastRunAt }} through {{ selectedEnvironment.label }}.</p>
							</div>
							<DomStatusPill :tone="responseTone" :pulse="isSending">
								{{ isSending ? 'Sending' : `${lastStatus} response` }}
							</DomStatusPill>
						</div>

						<div class="grid gap-3 sm:grid-cols-3">
							<ResponseStat label="Status" :value="String(lastStatus)" :detail="parsedBody.valid ? 'Accepted by proxy' : 'Invalid JSON'" :tone="responseTone" />
							<ResponseStat label="Latency" :value="`${lastLatency}ms`" detail="Edge round trip" tone="info" />
							<ResponseStat label="Request ID" :value="lastRequestId" detail="Audit log key" />
						</div>

						<ol class="space-y-3 rounded-2xl border border-border bg-canvas p-4">
							<RequestTimelineItem
								v-for="item in timeline"
								:key="item.step"
								:step="item.step"
								:status="item.status"
								:time="item.time"
								:detail="item.detail"
							/>
						</ol>
					</div>

					<DomCodeInput :model-value="responseBody" label="Response body" lang="json" :rows="20" :editor="false" read-only />
				</section>
			</main>
		</div>
	</div>
</template>
