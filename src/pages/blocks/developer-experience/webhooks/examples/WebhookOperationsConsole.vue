<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomCodeInput,
	DomDialog,
	DomEmptyState,
	DomJsonViewer,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const mobileViews = [
	{ key: 'endpoints', label: 'Endpoints' },
	{ key: 'deliveries', label: 'Deliveries' },
	{ key: 'endpoint', label: 'Endpoint' },
];
const inspectorTabs = [
	{ key: 'request', label: 'Request' },
	{ key: 'response', label: 'Response' },
	{ key: 'timeline', label: 'Timeline' },
];

const loading = ref(true);
const busy = ref(false);
const bootstrap = ref(null);
const workspace = ref(null);
const endpoints = ref([]);
const endpoint = ref(null);
const delivery = ref(null);
const selectedEndpointId = ref('');
const selectedDeliveryId = ref('');
const activeMobileView = ref('deliveries');
const inspectorTab = ref('request');
const endpointSearch = ref('');
const environmentFilter = ref('all');
const statusFilter = ref('all');
const deliveryStatusFilter = ref('all');
const deliveryEventFilter = ref('all');
const errorMessage = ref('');
const successMessage = ref('');
const fieldErrors = ref({});
const createDialogOpen = ref(false);
const testDialogOpen = ref(false);
const replayDialogOpen = ref(false);
const rotateDialogOpen = ref(false);
const secretDialogOpen = ref(false);
const disableDialogOpen = ref(false);
const enableDialogOpen = ref(false);
const resetDialogOpen = ref(false);
const secretReceipt = ref(null);
const lifecycleReceipt = ref(null);
const endpointDraft = ref(createEmptyEndpointDraft());
const createDraft = ref(createEndpointDraft());
const testDraft = ref({ eventType: 'invoice.paid' });
const replayDraft = ref({ reason: 'Destination issue remediated and payload verified.', acknowledged: false });
const rotationDraft = ref({ overlapHours: '24', reason: 'Scheduled production signing secret rotation.', acknowledged: false });
const disableDraft = ref({ confirmName: '', reason: '', acknowledged: false });
const enableAcknowledged = ref(false);

const filteredEndpoints = computed(getFilteredEndpoints);
const filteredDeliveries = computed(getFilteredDeliveries);
const environmentOptions = computed(getEnvironmentOptions);
const deliveryEventOptions = computed(getDeliveryEventOptions);
const subscribedEventOptions = computed(getSubscribedEventOptions);
const endpointIsDirty = computed(getEndpointIsDirty);

/**
 * Creates safe blank settings before endpoint detail loads.
 *
 * @returns {Record<string, unknown>} Empty endpoint settings.
 */
function createEmptyEndpointDraft() {
	return {
		name: '',
		description: '',
		url: '',
		environment: 'production',
		apiVersion: '2026-06-01',
		ownerId: 'ari',
		retryPolicy: 'standard',
		failureAlerts: true,
		selectedEvents: [],
	};
}

/**
 * Creates realistic defaults for a new endpoint dialog.
 *
 * @returns {Record<string, unknown>} New endpoint draft.
 */
function createEndpointDraft() {
	return {
		name: 'Revenue warehouse',
		description: 'Finance events for governed revenue analytics and reporting.',
		url: 'https://warehouse.northstar.example/webhooks/revenue',
		environment: 'staging',
		apiVersion: '2026-06-01',
		ownerId: 'maya',
		retryPolicy: 'fast',
		failureAlerts: false,
		selectedEvents: ['invoice.paid'],
		acknowledged: false,
	};
}

/**
 * Loads the server-owned endpoint registry and default delivery evidence.
 *
 * @returns {Promise<void>} Resolves when the workspace is ready.
 */
async function loadWorkspace() {
	loading.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/webhook-operations/bootstrap');
		bootstrap.value = result;
		workspace.value = result.workspace;
		endpoints.value = result.endpoints || [];
		selectedEndpointId.value = result.defaultEndpointId || result.endpoint?.id || '';
		applyEndpoint(result.endpoint, result.delivery);
	} catch (error) {
		handleRequestError(error);
	} finally {
		loading.value = false;
	}
}

/**
 * Loads one endpoint and its latest delivery evidence.
 *
 * @param {string} endpointId Endpoint identifier.
 * @returns {Promise<void>} Resolves after endpoint selection.
 */
async function selectEndpoint(endpointId) {
	if (!endpointId) return;
	if (endpointId === endpoint.value?.id) {
		activeMobileView.value = 'deliveries';
		return;
	}
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/webhook-operations/endpoints/${endpointId}`);
		workspace.value = result.workspace;
		endpoints.value = result.endpoints || endpoints.value;
		selectedEndpointId.value = endpointId;
		applyEndpoint(result.endpoint, result.delivery);
		activeMobileView.value = 'deliveries';
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Loads complete immutable evidence for one delivery attempt.
 *
 * @param {string} deliveryId Delivery identifier.
 * @returns {Promise<void>} Resolves after evidence selection.
 */
async function selectDelivery(deliveryId) {
	if (!endpoint.value || !deliveryId) return;
	if (deliveryId === delivery.value?.id) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/webhook-operations/endpoints/${endpoint.value.id}/deliveries/${deliveryId}`);
		endpoints.value = result.endpoints || endpoints.value;
		workspace.value = result.workspace || workspace.value;
		applyEndpoint(result.endpoint, result.delivery);
		inspectorTab.value = 'request';
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Applies authoritative endpoint state and resets editable settings.
 *
 * @param {Record<string, unknown>|null} nextEndpoint Safe endpoint detail.
 * @param {Record<string, unknown>|null} nextDelivery Selected delivery detail.
 * @returns {void}
 */
function applyEndpoint(nextEndpoint, nextDelivery = null) {
	endpoint.value = nextEndpoint || null;
	if (!nextEndpoint) {
		endpointDraft.value = createEmptyEndpointDraft();
		delivery.value = null;
		selectedDeliveryId.value = '';
		return;
	}
	selectedEndpointId.value = nextEndpoint.id;
	endpointDraft.value = endpointSettings(nextEndpoint);
	const deliveryCandidate = nextDelivery || nextEndpoint.deliveries?.find((item) => item.id === selectedDeliveryId.value) || nextEndpoint.deliveries?.[0] || null;
	delivery.value = deliveryCandidate;
	selectedDeliveryId.value = deliveryCandidate?.id || '';
	if (nextEndpoint.selectedEvents?.length && !nextEndpoint.selectedEvents.includes(testDraft.value.eventType)) {
		testDraft.value.eventType = nextEndpoint.selectedEvents[0];
	}
}

/**
 * Converts endpoint detail into editable settings fields.
 *
 * @param {Record<string, unknown>} value Endpoint detail.
 * @returns {Record<string, unknown>} Editable endpoint settings.
 */
function endpointSettings(value) {
	return {
		name: value.name,
		description: value.description,
		url: value.url,
		environment: value.environment,
		apiVersion: value.apiVersion,
		ownerId: value.ownerId,
		retryPolicy: value.retryPolicy,
		failureAlerts: value.failureAlerts,
		selectedEvents: [...(value.selectedEvents || [])],
	};
}

/**
 * Creates a new endpoint and opens its one-time signing-secret receipt.
 *
 * @returns {Promise<void>} Resolves after endpoint creation.
 */
async function createEndpoint() {
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/webhook-operations/endpoints', { method: 'POST', body: createDraft.value });
		workspace.value = result.workspace;
		endpoints.value = result.endpoints || [];
		applyEndpoint(result.endpoint, result.delivery);
		secretReceipt.value = result.secretReceipt;
		createDialogOpen.value = false;
		secretDialogOpen.value = true;
		createDraft.value = createEndpointDraft();
		activeMobileView.value = 'endpoint';
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Persists the selected endpoint contract at its current revision.
 *
 * @returns {Promise<void>} Resolves after settings persistence.
 */
async function saveEndpoint() {
	if (!endpoint.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/webhook-operations/endpoints/${endpoint.value.id}`, {
			method: 'PATCH',
			body: { revision: endpoint.value.revision, ...endpointDraft.value },
		});
		applyMutationResult(result);
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Sends a synthetic subscribed event and opens its immutable evidence.
 *
 * @returns {Promise<void>} Resolves after test delivery.
 */
async function sendTest() {
	if (!endpoint.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/webhook-operations/endpoints/${endpoint.value.id}/test`, {
			method: 'POST',
			body: { revision: endpoint.value.revision, eventType: testDraft.value.eventType },
		});
		applyMutationResult(result);
		testDialogOpen.value = false;
		activeMobileView.value = 'deliveries';
		inspectorTab.value = 'request';
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Replays the selected failed delivery into a new immutable attempt.
 *
 * @returns {Promise<void>} Resolves after replay completion.
 */
async function replayDelivery() {
	if (!endpoint.value || !delivery.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/webhook-operations/endpoints/${endpoint.value.id}/deliveries/${delivery.value.id}/replay`, {
			method: 'POST',
			body: { revision: endpoint.value.revision, ...replayDraft.value },
		});
		applyMutationResult(result);
		lifecycleReceipt.value = result.receipt;
		replayDialogOpen.value = false;
		replayDraft.value = { reason: 'Destination issue remediated and payload verified.', acknowledged: false };
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Rotates the endpoint signing secret and opens its one-time receipt.
 *
 * @returns {Promise<void>} Resolves after rotation.
 */
async function rotateSecret() {
	if (!endpoint.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/webhook-operations/endpoints/${endpoint.value.id}/secret-rotations`, {
			method: 'POST',
			body: { revision: endpoint.value.revision, ...rotationDraft.value },
		});
		applyMutationResult(result);
		secretReceipt.value = result.secretReceipt;
		rotateDialogOpen.value = false;
		secretDialogOpen.value = true;
		rotationDraft.value = { overlapHours: '24', reason: 'Scheduled production signing secret rotation.', acknowledged: false };
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Disables the selected endpoint after exact confirmation.
 *
 * @returns {Promise<void>} Resolves after disablement.
 */
async function disableEndpoint() {
	if (!endpoint.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/webhook-operations/endpoints/${endpoint.value.id}/disable`, {
			method: 'POST',
			body: { revision: endpoint.value.revision, ...disableDraft.value },
		});
		applyMutationResult(result);
		lifecycleReceipt.value = result.receipt;
		disableDialogOpen.value = false;
		disableDraft.value = { confirmName: '', reason: '', acknowledged: false };
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Re-enables the selected endpoint after explicit acknowledgement.
 *
 * @returns {Promise<void>} Resolves after enablement.
 */
async function enableEndpoint() {
	if (!endpoint.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/webhook-operations/endpoints/${endpoint.value.id}/enable`, {
			method: 'POST',
			body: { revision: endpoint.value.revision, acknowledged: enableAcknowledged.value },
		});
		applyMutationResult(result);
		lifecycleReceipt.value = result.receipt;
		enableDialogOpen.value = false;
		enableAcknowledged.value = false;
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Restores the seeded endpoint registry and delivery evidence.
 *
 * @returns {Promise<void>} Resolves after reset.
 */
async function resetWorkspace() {
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/webhook-operations/reset', { method: 'POST' });
		bootstrap.value = result;
		workspace.value = result.workspace;
		endpoints.value = result.endpoints || [];
		selectedEndpointId.value = result.defaultEndpointId || result.endpoint?.id || '';
		applyEndpoint(result.endpoint, result.delivery);
		resetDialogOpen.value = false;
		activeMobileView.value = 'deliveries';
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Applies mutation payload state from the webhook service.
 *
 * @param {Record<string, unknown>} result Mutation response.
 * @returns {void}
 */
function applyMutationResult(result) {
	workspace.value = result.workspace || workspace.value;
	endpoints.value = result.endpoints || endpoints.value;
	applyEndpoint(result.endpoint || endpoint.value, result.delivery || null);
}

/**
 * Opens the replay dialog with clean operator evidence.
 *
 * @returns {void}
 */
function openReplayDialog() {
	clearFeedback();
	replayDraft.value = { reason: 'Destination issue remediated and payload verified.', acknowledged: false };
	replayDialogOpen.value = true;
}

/**
 * Opens the disablement dialog with the selected endpoint context.
 *
 * @returns {void}
 */
function openDisableDialog() {
	clearFeedback();
	disableDraft.value = { confirmName: '', reason: '', acknowledged: false };
	disableDialogOpen.value = true;
}

/**
 * Closes and clears one-time secret material from browser state.
 *
 * @returns {void}
 */
function closeSecretReceipt() {
	secretDialogOpen.value = false;
	secretReceipt.value = null;
}

/**
 * Copies current one-time secret material when browser clipboard access is available.
 *
 * @returns {Promise<void>} Resolves after copy feedback.
 */
async function copySecret() {
	if (!secretReceipt.value?.secret) return;
	try {
		await navigator.clipboard.writeText(secretReceipt.value.secret);
		successMessage.value = 'One-time signing secret copied. Store it in the destination secret manager.';
	} catch {
		errorMessage.value = 'Clipboard access is unavailable. Select the secret value and copy it manually.';
	}
}

/**
 * Toggles an event subscription in a settings draft.
 *
 * @param {Record<string, unknown>} draft Endpoint draft ref value.
 * @param {string} eventType Event catalog key.
 * @returns {void}
 */
function toggleEvent(draft, eventType) {
	draft.selectedEvents = draft.selectedEvents.includes(eventType)
		? draft.selectedEvents.filter((value) => value !== eventType)
		: [...draft.selectedEvents, eventType];
}

/**
 * Returns endpoint inventory rows matching search and rich filters.
 *
 * @returns {Record<string, unknown>[]} Filtered endpoint summaries.
 */
function getFilteredEndpoints() {
	const query = endpointSearch.value.trim().toLowerCase();
	return endpoints.value.filter((item) => {
		const matchesQuery = !query || [item.name, item.url, item.description, item.environmentLabel].join(' ').toLowerCase().includes(query);
		const matchesEnvironment = environmentFilter.value === 'all' || item.environment === environmentFilter.value;
		const matchesStatus = statusFilter.value === 'all' || item.status === statusFilter.value;
		return matchesQuery && matchesEnvironment && matchesStatus;
	});
}

/**
 * Returns delivery rows matching current status and event filters.
 *
 * @returns {Record<string, unknown>[]} Filtered delivery summaries.
 */
function getFilteredDeliveries() {
	return (endpoint.value?.deliveries || []).filter((item) => {
		const matchesStatus = deliveryStatusFilter.value === 'all' || item.status === deliveryStatusFilter.value;
		const matchesEvent = deliveryEventFilter.value === 'all' || item.eventType === deliveryEventFilter.value;
		return matchesStatus && matchesEvent;
	});
}

/**
 * Adds an all-environments choice to the server-owned environment list.
 *
 * @returns {Record<string, unknown>[]} Endpoint environment filters.
 */
function getEnvironmentOptions() {
	return [{ value: 'all', label: 'All environments', description: 'Production and non-production endpoints.' }, ...(bootstrap.value?.options.environments || [])];
}

/**
 * Builds event filters from the server-owned event catalog.
 *
 * @returns {Record<string, unknown>[]} Delivery event filters.
 */
function getDeliveryEventOptions() {
	return [{ value: 'all', label: 'All events', description: 'Every subscribed event type.' }, ...(bootstrap.value?.options.events || [])];
}

/**
 * Returns test event choices restricted to selected endpoint subscriptions.
 *
 * @returns {Record<string, unknown>[]} Subscribed event options.
 */
function getSubscribedEventOptions() {
	return (bootstrap.value?.options.events || []).filter((item) => endpoint.value?.selectedEvents?.includes(item.value));
}

/**
 * Compares editable endpoint settings with authoritative detail.
 *
 * @returns {boolean} Whether settings have changed.
 */
function getEndpointIsDirty() {
	if (!endpoint.value) return false;
	return JSON.stringify(endpointSettings(endpoint.value)) !== JSON.stringify(endpointDraft.value);
}

/**
 * Converts structured API failures into field feedback and conflict recovery state.
 *
 * @param {Error & { data?: Record<string, unknown> }} error Request error.
 * @returns {void}
 */
function handleRequestError(error) {
	fieldErrors.value = (error.data?.fields || []).reduce((fields, issue) => {
		fields[issue.field] = [...(fields[issue.field] || []), issue.message];
		return fields;
	}, {});
	if (error.data?.workspace) workspace.value = error.data.workspace;
	if (error.data?.endpoints) endpoints.value = error.data.endpoints;
	if (error.data?.endpoint) applyEndpoint(error.data.endpoint, error.data.delivery || null);
	errorMessage.value = error.message || 'The webhook action could not be completed.';
}

/**
 * Clears transient action and validation feedback.
 *
 * @returns {void}
 */
function clearFeedback() {
	errorMessage.value = '';
	successMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Sends JSON requests and preserves structured API failures.
 *
 * @param {string} url API URL.
 * @param {{ method?: string, body?: unknown }} options Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed response.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		method: options.method || 'GET',
		headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
		body: options.body === undefined ? undefined : JSON.stringify(options.body),
	});
	const data = await response.json();
	if (!response.ok || data.error) {
		const error = new Error(data.message || `Request failed with status ${response.status}.`);
		error.data = data;
		throw error;
	}
	return data;
}

/**
 * Returns a human-readable option label.
 *
 * @param {ReadonlyArray<Record<string, unknown>>} options Option list.
 * @param {string} value Option value.
 * @returns {string} Matching label or fallback.
 */
function optionLabel(options, value) {
	return String(options?.find((item) => item.value === value)?.label || value || '—');
}

/**
 * Formats an ISO timestamp for compact operational evidence.
 *
 * @param {string|null|undefined} value ISO timestamp.
 * @returns {string} Local timestamp or fallback.
 */
function formatTime(value) {
	if (!value) return 'No delivery yet';
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

/**
 * Formats a timestamp as a concise relative age.
 *
 * @param {string|null|undefined} value ISO timestamp.
 * @returns {string} Relative time label.
 */
function relativeTime(value) {
	if (!value) return 'Never';
	const minutes = Math.round((new Date(value).getTime() - Date.now()) / 60000);
	if (Math.abs(minutes) < 60) return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(minutes, 'minute');
	const hours = Math.round(minutes / 60);
	if (Math.abs(hours) < 24) return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(hours, 'hour');
	return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round(hours / 24), 'day');
}

onMounted(loadWorkspace);
</script>

<template>
	<div class="h-dvh min-h-0 overflow-hidden bg-canvas text-canvas-fg">
		<div v-if="loading" class="flex h-full min-h-0 flex-col">
			<div class="h-16 shrink-0 border-b border-border p-4"><DomSkeleton variant="text" :lines="2" /></div>
			<div class="grid min-h-0 flex-1 lg:grid-cols-[17rem_minmax(0,1fr)_22rem]"><div class="hidden border-r border-border p-4 lg:block"><DomSkeleton variant="text" :lines="14" /></div><div class="p-5"><DomSkeleton variant="text" :lines="18" /></div><div class="hidden border-l border-border p-4 lg:block"><DomSkeleton variant="text" :lines="14" /></div></div>
		</div>

		<div v-else-if="bootstrap && endpoint" class="flex h-full min-h-0 flex-col">
			<header class="shrink-0 border-b border-border bg-canvas">
				<div class="flex min-h-16 items-center gap-3 px-3 py-2 sm:px-4">
					<div class="min-w-0 flex-1"><div class="flex items-center gap-2"><h1 class="truncate text-base font-semibold sm:text-lg">Webhooks</h1><DomStatusPill :tone="workspace.attentionCount ? 'warning' : 'success'" size="sm">{{ workspace.attentionCount ? `${workspace.attentionCount} attention` : 'Healthy' }}</DomStatusPill></div><p class="truncate text-xs text-muted-fg">{{ workspace.name }} · signed delivery evidence · {{ workspace.successRate }}% success</p></div>
					<div class="flex shrink-0 items-center gap-2"><div class="hidden sm:block"><DomButton size="sm" variant="ghost" @click="resetDialogOpen = true">Reset</DomButton></div><DomButton size="sm" @click="createDialogOpen = true"><span class="hidden sm:inline">New endpoint</span><span class="sm:hidden">New</span></DomButton></div>
				</div>
			</header>

			<div v-if="errorMessage || successMessage" class="shrink-0 border-b border-border px-3 py-2 sm:px-4">
				<DomAlert v-if="errorMessage" tone="danger" variant="soft" title="Webhook action needs attention" :description="errorMessage" dismissible @dismiss="errorMessage = ''" />
				<DomAlert v-else tone="success" variant="soft" title="Webhook operations updated" :description="successMessage" dismissible @dismiss="successMessage = ''" />
			</div>

			<DomTabs v-model="activeMobileView" :tabs="mobileViews" variant="page" class="shrink-0 lg:hidden [&>div:last-child]:hidden" />

			<div class="flex min-h-0 flex-1">
				<aside class="min-h-0 w-full shrink-0 flex-col border-r border-border bg-secondary/10 lg:flex lg:w-68" :class="activeMobileView === 'endpoints' ? 'flex' : 'hidden'">
					<div class="shrink-0 border-b border-border p-3"><div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Endpoint registry</p><p class="mt-1 text-sm font-semibold">{{ workspace.activeCount }} active / {{ workspace.endpointCount }} total</p></div><DomBadge tone="neutral" variant="outline">{{ workspace.deliveryCount.toLocaleString() }} events</DomBadge></div><div class="mt-3"><DomTextInput v-model="endpointSearch" type="search" label="Find endpoint" placeholder="Name, URL, or owner" /></div><div class="mt-3 grid grid-cols-2 gap-2"><DomSelect v-model="environmentFilter" label="Environment" :options="environmentOptions" width="min-w-[17rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="statusFilter" label="State" :options="bootstrap.options.statuses" width="min-w-[17rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div></div>
					<nav class="min-h-0 flex-1 divide-y divide-border overflow-y-auto" aria-label="Webhook endpoints">
						<button v-for="item in filteredEndpoints" :key="item.id" type="button" class="w-full border-l-2 px-4 py-4 text-left transition hover:bg-secondary/45 focus-visible:outline-2 focus-visible:outline-ring" :class="item.id === endpoint.id ? 'border-l-primary bg-secondary/55' : 'border-l-transparent'" @click="selectEndpoint(item.id)"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="truncate text-sm font-semibold">{{ item.name }}</p><p class="mt-1 truncate font-mono text-[11px] text-muted-fg">{{ item.url }}</p></div><DomStatusPill :tone="item.statusTone" size="sm">{{ item.statusLabel }}</DomStatusPill></div><div class="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-fg"><span>{{ item.environmentLabel }} · {{ item.eventCount }} events</span><span class="shrink-0">{{ item.successRate }}%</span></div></button>
					</nav>
					<DomEmptyState v-if="!filteredEndpoints.length" class="m-auto px-5 py-10" title="No matching endpoints" description="Try another environment, state, or search term." />
				</aside>

				<main class="min-h-0 min-w-0 flex-1 flex-col" :class="activeMobileView === 'deliveries' ? 'flex' : 'hidden lg:flex'">
					<div class="shrink-0 border-b border-border px-4 py-3 sm:px-5"><div class="flex flex-wrap items-start justify-between gap-3"><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><h2 class="truncate text-lg font-semibold">{{ endpoint.name }}</h2><DomStatusPill :tone="endpoint.statusTone" size="sm">{{ endpoint.statusLabel }}</DomStatusPill><DomBadge tone="neutral" variant="outline">{{ endpoint.environmentLabel }}</DomBadge></div><p class="mt-1 truncate font-mono text-xs text-muted-fg" :title="endpoint.url">{{ endpoint.url }}</p></div><div class="flex shrink-0 gap-2"><DomButton size="sm" variant="secondary" :disabled="!endpoint.enabled" @click="testDialogOpen = true">Send test</DomButton><DomButton v-if="delivery?.canReplay" size="sm" @click="openReplayDialog">Replay</DomButton></div></div><div class="mt-3 grid grid-cols-3 divide-x divide-border border-y border-border py-2 text-center"><div><p class="text-sm font-semibold">{{ endpoint.metrics.successRate }}%</p><p class="text-[10px] text-muted-fg">24h success</p></div><div><p class="text-sm font-semibold">{{ endpoint.metrics.failureCount }}</p><p class="text-[10px] text-muted-fg">Failed</p></div><div><p class="text-sm font-semibold">{{ endpoint.metrics.medianLatencyMs }}ms</p><p class="text-[10px] text-muted-fg">Median</p></div></div></div>

					<div class="shrink-0 border-b border-border p-3"><div class="grid grid-cols-2 gap-2"><DomSelect v-model="deliveryStatusFilter" label="Delivery state" :options="bootstrap.options.deliveryStatuses" width="min-w-[17rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="deliveryEventFilter" label="Event type" :options="deliveryEventOptions" searchable width="min-w-[20rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.value }}</p></div></template></DomSelect></div></div>

					<div class="h-52 shrink-0 overflow-y-auto border-b border-border sm:h-56 lg:h-[42%] lg:min-h-48 lg:flex-none" aria-label="Delivery attempts">
						<button v-for="item in filteredDeliveries" :key="item.id" type="button" class="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 border-l-2 border-b border-border px-4 py-3 text-left transition hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-ring sm:grid-cols-[minmax(0,1fr)_7rem_4rem_5rem]" :class="item.id === selectedDeliveryId ? 'border-l-primary bg-secondary/50' : 'border-l-transparent'" @click="selectDelivery(item.id)"><div class="min-w-0"><div class="flex items-center gap-2"><p class="truncate text-sm font-semibold">{{ item.eventType }}</p><DomBadge v-if="item.isTest" tone="info" variant="outline">Test</DomBadge></div><p class="mt-1 truncate font-mono text-[11px] text-muted-fg">{{ item.id }} · {{ relativeTime(item.occurredAt) }}</p></div><DomStatusPill class="self-start sm:self-center" :tone="item.statusTone" size="sm">{{ item.statusLabel }}</DomStatusPill><p class="hidden self-center text-xs text-muted-fg sm:block">HTTP {{ item.responseCode }}</p><p class="hidden self-center text-right text-xs text-muted-fg sm:block">{{ item.latencyMs }}ms</p></button>
						<DomEmptyState v-if="!filteredDeliveries.length" class="py-10" title="No matching deliveries" description="Change the state or event filter, or send a synthetic test." />
					</div>

					<section v-if="delivery" class="flex min-h-0 flex-1 flex-col"><div class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Immutable delivery evidence</p><div class="mt-1 flex items-center gap-2"><h3 class="font-mono text-xs font-semibold">{{ delivery.id }}</h3><DomStatusPill :tone="delivery.statusTone" size="sm">{{ delivery.statusLabel }}</DomStatusPill></div></div><p class="text-xs text-muted-fg">Attempt {{ delivery.attemptCount }} · {{ formatTime(delivery.occurredAt) }}</p></div><DomTabs v-model="inspectorTab" :tabs="inspectorTabs" variant="page" fill class="min-h-0 flex-1"><template #request><div class="h-full min-h-0 overflow-y-auto p-4"><DomJsonViewer :value="delivery.request" title="Signed request" :filename="`${delivery.id}-request.json`" :preview-lines="12" density="compact" /></div></template><template #response><div class="h-full min-h-0 overflow-y-auto p-4"><DomAlert :tone="delivery.status === 'delivered' ? 'success' : 'warning'" variant="soft" :title="delivery.summary" :description="`HTTP ${delivery.responseCode} · ${delivery.latencyMs}ms · ${delivery.signature.algorithm}`" /><DomJsonViewer class="mt-4" :value="delivery.response" title="Destination response" :filename="`${delivery.id}-response.json`" :preview-lines="10" density="compact" /></div></template><template #timeline><div class="h-full min-h-0 divide-y divide-border overflow-y-auto px-4"><div v-for="step in delivery.timeline" :key="step.label" class="flex items-start justify-between gap-4 py-4"><div><p class="text-sm font-medium">{{ step.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ step.detail }}</p></div><div class="shrink-0 text-right"><DomStatusPill :tone="step.tone" size="sm">{{ step.tone === 'danger' ? 'Failed' : 'Passed' }}</DomStatusPill><p class="mt-1 font-mono text-[11px] text-muted-fg">{{ step.duration }}</p></div></div></div></template></DomTabs></section>
					<DomEmptyState v-else class="m-auto" title="No delivery evidence" description="Send a subscribed test event to inspect its signed request and response." />
				</main>

				<aside class="min-h-0 w-full shrink-0 flex-col border-l border-border bg-secondary/10 lg:flex lg:w-88" :class="activeMobileView === 'endpoint' ? 'flex' : 'hidden'">
					<div class="min-h-0 flex-1 overflow-y-auto p-4"><div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Endpoint contract</p><h2 class="mt-1 text-lg font-semibold">Configuration</h2></div><span class="font-mono text-[11px] text-muted-fg">rev {{ endpoint.revision }}</span></div><DomAlert v-if="endpoint.status === 'degraded'" class="mt-4" tone="warning" variant="soft" title="Recent delivery failures" :description="`${endpoint.metrics.failureCount} deliveries failed in the current 24-hour window. Inspect and replay only after remediation.`" /><DomAlert v-if="!endpoint.enabled" class="mt-4" tone="info" variant="soft" title="Delivery is disabled" description="Existing evidence remains available, but new events are not dispatched." />

						<div class="mt-5 grid gap-4"><DomTextInput v-model="endpointDraft.name" label="Endpoint name" :read-only="!endpoint.enabled" :errors="fieldErrors.name || []" /><DomTextInput v-model="endpointDraft.url" type="url" label="Destination URL" :read-only="!endpoint.enabled" :errors="fieldErrors.url || []" /><DomTextareaInput v-model="endpointDraft.description" label="Purpose" :rows="3" :read-only="!endpoint.enabled" :errors="fieldErrors.description || []" /><div class="grid grid-cols-2 gap-3"><DomSelect v-model="endpointDraft.environment" label="Environment" :options="bootstrap.options.environments" :read-only="!endpoint.enabled" :errors="fieldErrors.environment || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="endpointDraft.apiVersion" label="API version" :options="bootstrap.options.versions" :read-only="!endpoint.enabled" :errors="fieldErrors.apiVersion || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div><DomSelect v-model="endpointDraft.ownerId" label="Accountable owner" :options="bootstrap.options.owners" :read-only="!endpoint.enabled" :errors="fieldErrors.ownerId || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="endpointDraft.retryPolicy" label="Retry policy" :options="bootstrap.options.retryPolicies" :read-only="!endpoint.enabled" :errors="fieldErrors.retryPolicy || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomToggle v-model="endpointDraft.failureAlerts" label="Failure alerts" description="Notify the accountable owner when delivery health degrades." :disabled="!endpoint.enabled" /><p v-if="fieldErrors.failureAlerts?.length" class="text-xs text-destructive">{{ fieldErrors.failureAlerts[0] }}</p></div>

						<div class="mt-7"><div class="flex items-center justify-between gap-3"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Event subscriptions</p><span class="text-xs text-muted-fg">{{ endpointDraft.selectedEvents.length }}/{{ bootstrap.options.events.length }}</span></div><div class="mt-2 divide-y divide-border border-y border-border"><DomCheckbox v-for="event in bootstrap.options.events" :key="event.value" :model-value="endpointDraft.selectedEvents.includes(event.value)" class="py-3" :label="event.label" :description="`${event.value} · ${event.description}`" :disabled="!endpoint.enabled" @update:model-value="toggleEvent(endpointDraft, event.value)" /></div><p v-if="fieldErrors.selectedEvents?.length" class="mt-2 text-xs text-destructive">{{ fieldErrors.selectedEvents[0] }}</p></div>

						<div class="mt-6"><DomButton v-if="endpoint.enabled" class="w-full" :loading="busy" :disabled="!endpointIsDirty" @click="saveEndpoint">Save endpoint</DomButton><DomButton v-else class="w-full" @click="enableDialogOpen = true">Enable endpoint</DomButton></div>

						<div class="mt-7 border-t border-border pt-5"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-semibold">Signing secret</p><p class="mt-1 font-mono text-[11px] text-muted-fg">{{ endpoint.secret.prefix }}•••• · {{ endpoint.secret.ageDays }} days old</p></div><DomStatusPill :tone="endpoint.secret.rotatingUntil ? 'warning' : 'success'" size="sm">{{ endpoint.secret.rotatingUntil ? 'Rotating' : 'Active' }}</DomStatusPill></div><p v-if="endpoint.secret.rotatingUntil" class="mt-2 text-xs leading-5 text-muted-fg">Previous prefix {{ endpoint.secret.previousPrefix }} remains valid until {{ formatTime(endpoint.secret.rotatingUntil) }}.</p><DomButton class="mt-4 w-full" size="sm" variant="secondary" :disabled="!endpoint.enabled" @click="rotateDialogOpen = true">Rotate signing secret</DomButton></div>

						<div class="mt-7"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Recent activity</p><div class="mt-2 divide-y divide-border border-y border-border"><div v-for="item in endpoint.activity.slice(0, 4)" :key="item.id" class="py-3"><div class="flex items-start justify-between gap-3"><p class="text-sm font-medium">{{ item.title }}</p><span class="shrink-0 text-[11px] text-muted-fg">{{ relativeTime(item.createdAt) }}</span></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.detail }} · {{ item.actor }}</p></div></div></div>

						<button v-if="endpoint.enabled" type="button" class="mt-7 w-full border-t border-border pt-5 text-left text-sm font-medium text-destructive transition hover:opacity-75" @click="openDisableDialog">Disable {{ endpoint.name }}</button></div>
				</aside>
			</div>

			<DomDialog v-model="createDialogOpen" width="min(46rem, 94vw)" title="Create webhook endpoint" description="Define a destination, accountable owner, server catalog subscriptions, and one-time signing secret boundary.">
				<div class="grid gap-4 sm:grid-cols-2"><DomTextInput v-model="createDraft.name" label="Endpoint name" :errors="fieldErrors.name || []" /><DomTextInput v-model="createDraft.url" type="url" label="Destination URL" :errors="fieldErrors.url || []" /><div class="sm:col-span-2"><DomTextareaInput v-model="createDraft.description" label="Purpose" :rows="3" :errors="fieldErrors.description || []" /></div><DomSelect v-model="createDraft.environment" label="Environment" :options="bootstrap.options.environments" :errors="fieldErrors.environment || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="createDraft.apiVersion" label="API version" :options="bootstrap.options.versions" :errors="fieldErrors.apiVersion || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="createDraft.ownerId" label="Accountable owner" :options="bootstrap.options.owners" :errors="fieldErrors.ownerId || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="createDraft.retryPolicy" label="Retry policy" :options="bootstrap.options.retryPolicies" :errors="fieldErrors.retryPolicy || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div><div class="mt-5"><DomToggle v-model="createDraft.failureAlerts" label="Failure alerts" description="Production endpoints require an accountable alert route." /><p v-if="fieldErrors.failureAlerts?.length" class="mt-2 text-xs text-destructive">{{ fieldErrors.failureAlerts[0] }}</p></div><div class="mt-5"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Event subscriptions</p><div class="mt-2 grid gap-x-5 sm:grid-cols-2"><DomCheckbox v-for="event in bootstrap.options.events" :key="event.value" :model-value="createDraft.selectedEvents.includes(event.value)" class="border-b border-border py-3" :label="event.label" :description="`${event.value} · ${event.description}`" @update:model-value="toggleEvent(createDraft, event.value)" /></div><p v-if="fieldErrors.selectedEvents?.length" class="mt-2 text-xs text-destructive">{{ fieldErrors.selectedEvents[0] }}</p></div><div class="mt-5 border-y border-border py-4"><DomCheckbox v-model="createDraft.acknowledged" label="I will store the one-time secret securely" description="The full secret exists only in the creation response; the demo keeps a fingerprint." :errors="fieldErrors.acknowledged || []" /></div>
				<template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :loading="busy" @click="createEndpoint">Create endpoint</DomButton></template>
			</DomDialog>

			<DomDialog v-model="testDialogOpen" title="Send a signed test event" description="Create a synthetic event, sign it with the current endpoint secret, and store the delivery evidence."><DomSelect v-model="testDraft.eventType" label="Subscribed event" :options="subscribedEventOptions" :errors="fieldErrors.eventType || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.value }} · {{ option.description }}</p></div></template></DomSelect><DomAlert class="mt-4" tone="info" variant="soft" title="Synthetic payload" description="No customer data is sent. The server creates a deterministic test object and immutable attempt." /><template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :loading="busy" @click="sendTest">Send test</DomButton></template></DomDialog>

			<DomDialog v-model="replayDialogOpen" title="Replay failed delivery?" description="A replay creates a new signed attempt. The failed source delivery remains immutable."><DomAlert tone="warning" variant="soft" :title="delivery?.eventType || 'Selected event'" :description="`${delivery?.id || ''} · HTTP ${delivery?.responseCode || '—'} · ${delivery?.summary || ''}`" /><div class="mt-4"><DomTextareaInput v-model="replayDraft.reason" label="Remediation evidence" :rows="3" :errors="fieldErrors.reason || []" /></div><div class="mt-4 border-y border-border py-4"><DomCheckbox v-model="replayDraft.acknowledged" label="I verified the destination and payload boundary" description="The replay uses the original event snapshot with the current signing secret." :errors="fieldErrors.acknowledged || []" /></div><template #footer><DomButton variant="secondary" data-close>Keep failed evidence</DomButton><DomButton :loading="busy" @click="replayDelivery">Create replay</DomButton></template></DomDialog>

			<DomDialog v-model="rotateDialogOpen" title="Rotate signing secret" description="Create replacement signing material while the previous prefix remains valid for a bounded deployment window."><DomSelect v-model="rotationDraft.overlapHours" label="Overlap window" :options="bootstrap.options.overlaps" :errors="fieldErrors.overlapHours || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><div class="mt-4"><DomTextareaInput v-model="rotationDraft.reason" label="Rotation reason" :rows="3" :errors="fieldErrors.reason || []" /></div><div class="mt-4 border-y border-border py-4"><DomCheckbox v-model="rotationDraft.acknowledged" label="I have a replacement deployment plan" description="Both prefixes verify signatures only during the selected overlap." :errors="fieldErrors.acknowledged || []" /></div><template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :loading="busy" @click="rotateSecret">Create replacement</DomButton></template></DomDialog>

			<DomDialog v-model="secretDialogOpen" width="min(40rem, 94vw)" title="Store the one-time signing secret" description="This full value exists only in the current API response and is cleared when you close the receipt." :close-button="false"><DomAlert tone="warning" variant="soft" title="You cannot reveal this secret again" description="Store it in the destination secret manager, deploy it, then remove it from local notes and chat." /><div class="mt-5"><DomCodeInput :model-value="secretReceipt?.secret || ''" label="Signing secret" lang="text" :rows="4" :editor="false" read-only /></div><dl class="mt-5 grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-2"><div><dt class="text-xs text-muted-fg">Fingerprint</dt><dd class="mt-1 break-all font-mono font-medium">{{ secretReceipt?.fingerprint }}</dd></div><div><dt class="text-xs text-muted-fg">Receipt</dt><dd class="mt-1 font-mono font-medium">{{ secretReceipt?.id }}</dd></div></dl><template #footer><DomButton variant="secondary" @click="closeSecretReceipt">I stored it</DomButton><DomButton @click="copySecret">Copy secret</DomButton></template></DomDialog>

			<DomDialog v-model="disableDialogOpen" :title="`Disable ${endpoint.name}?`" description="New events stop immediately. Existing delivery evidence remains available for investigation."><DomTextInput v-model="disableDraft.confirmName" :label="`Type ${endpoint.name} to confirm`" :errors="fieldErrors.confirmName || []" /><div class="mt-4"><DomTextareaInput v-model="disableDraft.reason" label="Audit reason" :rows="3" :errors="fieldErrors.reason || []" /></div><div class="mt-4 border-y border-border py-4"><DomCheckbox v-model="disableDraft.acknowledged" label="I understand new deliveries will stop" description="Downstream systems may become stale while this endpoint is disabled." :errors="fieldErrors.acknowledged || []" /></div><template #footer><DomButton variant="secondary" data-close>Keep active</DomButton><DomButton variant="danger" :loading="busy" @click="disableEndpoint">Disable endpoint</DomButton></template></DomDialog>

			<DomDialog v-model="enableDialogOpen" :title="`Enable ${endpoint.name}?`" description="Resume signed event deliveries using the current destination and subscription contract."><DomCheckbox v-model="enableAcknowledged" label="I reviewed the destination, secret, and subscriptions" description="Send a synthetic test after enabling to verify delivery health." :errors="fieldErrors.acknowledged || []" /><template #footer><DomButton variant="secondary" data-close>Keep disabled</DomButton><DomButton :loading="busy" @click="enableEndpoint">Enable endpoint</DomButton></template></DomDialog>

			<DomDialog v-model="resetDialogOpen" title="Reset webhook operations?" description="This clears process-local endpoints, deliveries, rotations, receipts, and activity, then restores the seeded workspace."><template #footer><DomButton variant="secondary" data-close>Keep workspace</DomButton><DomButton variant="danger" :loading="busy" @click="resetWorkspace">Reset demo</DomButton></template></DomDialog>
		</div>
	</div>
</template>
