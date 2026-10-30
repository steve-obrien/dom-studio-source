<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomEmptyState,
	DomPasswordInput,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const loading = ref(true);
const busy = ref(false);
const bootstrap = ref(null);
const workspace = ref(null);
const connectors = ref([]);
const connector = ref(null);
const selectedConnectorId = ref('');
const activeMobileView = ref('catalog');
const activeDetailTab = ref('overview');
const searchQuery = ref('');
const categoryFilter = ref('all');
const statusFilter = ref('all');
const successMessage = ref('');
const errorMessage = ref('');
const fieldErrors = ref({});
const authorization = ref(null);
const receipt = ref(null);
const requestReceipt = ref(null);
const requestDialogOpen = ref(false);
const disconnectDialogOpen = ref(false);
const resetDialogOpen = ref(false);
const connectionDraft = ref(createConnectionDraft());
const requestDraft = ref(createRequestDraft());
const disconnectDraft = ref(createDisconnectDraft());

const mobileViews = [
	{ key: 'catalog', label: 'Catalog' },
	{ key: 'details', label: 'Details' },
	{ key: 'setup', label: 'Connection' },
];

const detailTabs = [
	{ key: 'overview', label: 'Overview' },
	{ key: 'access', label: 'Data access' },
	{ key: 'activity', label: 'Activity' },
];

const filteredConnectors = computed(getFilteredConnectors);
const allScopes = computed(() => connector.value ? [...connector.value.requiredScopes, ...connector.value.optionalScopes] : []);
const selectedOptionalScopes = computed(() => connector.value?.optionalScopes?.filter((scope) => connectionDraft.value.selectedScopes.includes(scope.key)) || []);
const selectedElevatedScope = computed(() => selectedOptionalScopes.value.some((scope) => scope.risk === 'elevated'));
const latestRun = computed(() => connector.value?.runs?.[0] || null);
const isConnected = computed(() => connector.value?.state === 'connected');
const needsAttention = computed(() => connector.value?.state === 'attention');
const connectionActionLabel = computed(() => needsAttention.value ? `Repair ${connector.value?.name || 'connection'}` : `Connect ${connector.value?.name || 'provider'}`);
const categoryOptions = computed(() => bootstrap.value?.options?.categories || []);
const statusOptions = computed(() => bootstrap.value?.options?.statuses || []);
const requestCategoryOptions = computed(() => categoryOptions.value.filter((option) => option.value !== 'all'));

/**
 * Creates editable connection values from a provider contract.
 *
 * @param {Record<string, unknown>|null} item Provider detail.
 * @returns {Record<string, unknown>} Connection draft.
 */
function createConnectionDraft(item = null) {
	const requiredScopes = item?.requiredScopes?.map((scope) => scope.key) || [];
	const currentScopes = item?.connection?.selectedScopes || requiredScopes;
	return {
		connectionName: item?.connection?.name || `${item?.name || 'Provider'} production`,
		ownerId: item?.connection?.ownerId || 'ari',
		cadence: item?.connection?.cadence || '1h',
		region: item?.connection?.region || 'us',
		scheduledSync: item?.connection?.scheduledSync ?? true,
		selectedScopes: [...new Set([...requiredScopes, ...currentScopes])],
		credential: item?.installMethod === 'api_key' ? 'rk_test_marketplace_123456' : '',
		authorizationId: '',
		acknowledged: false,
		elevatedAcknowledged: false,
	};
}

/**
 * Creates realistic values for a new provider request.
 *
 * @returns {Record<string, string>} Provider request draft.
 */
function createRequestDraft() {
	return {
		providerName: 'Snowflake',
		category: 'data',
		useCase: 'Export account and product-event data for governed analytics and finance reporting.',
	};
}

/**
 * Creates blank confirmation values for an irreversible disconnect.
 *
 * @returns {Record<string, unknown>} Disconnect draft.
 */
function createDisconnectDraft() {
	return { confirmName: '', reason: '', acknowledged: false };
}

/**
 * Loads the server-owned catalog and default provider.
 *
 * @returns {Promise<void>}
 */
async function loadMarketplace() {
	loading.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/integration-marketplace/bootstrap');
		bootstrap.value = result;
		workspace.value = result.workspace;
		connectors.value = result.connectors || [];
		selectedConnectorId.value = result.defaultConnectorId || result.connector?.id || '';
		applyConnector(result.connector);
	} catch (error) {
		errorMessage.value = error.message || 'The integration workspace could not be loaded.';
	} finally {
		loading.value = false;
	}
}

/**
 * Loads a selected provider and opens its focused detail view.
 *
 * @param {string} connectorId Provider identifier.
 * @returns {Promise<void>}
 */
async function selectConnector(connectorId) {
	if (!connectorId) return;
	if (connectorId === connector.value?.id) {
		activeMobileView.value = 'details';
		return;
	}
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/integration-marketplace/connectors/${connectorId}`);
		connectors.value = result.connectors || connectors.value;
		workspace.value = result.workspace || workspace.value;
		selectedConnectorId.value = connectorId;
		applyConnector(result.connector);
		activeDetailTab.value = 'overview';
		activeMobileView.value = 'details';
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Applies authoritative provider state and resets transient setup values.
 *
 * @param {Record<string, unknown>|null} nextConnector Provider detail.
 * @returns {void}
 */
function applyConnector(nextConnector) {
	connector.value = nextConnector || null;
	selectedConnectorId.value = nextConnector?.id || '';
	connectionDraft.value = createConnectionDraft(nextConnector);
	authorization.value = nextConnector?.pendingAuthorization || null;
	receipt.value = null;
}

/**
 * Starts the provider-owned OAuth approval step and keeps its short-lived grant.
 *
 * @returns {Promise<void>}
 */
async function authorizeProvider() {
	if (!connector.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/integration-marketplace/connectors/${connector.value.id}/authorize`, {
			method: 'POST',
			body: { revision: connector.value.revision },
		});
		connector.value = result.connector || connector.value;
		authorization.value = result.authorization;
		connectionDraft.value.authorizationId = result.authorization.id;
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Connects or repairs the selected provider through the validated setup route.
 *
 * @returns {Promise<void>}
 */
async function connectProvider() {
	if (!connector.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/integration-marketplace/connectors/${connector.value.id}/connect`, {
			method: 'POST',
			body: { ...connectionDraft.value, revision: connector.value.revision },
		});
		connectors.value = result.connectors || connectors.value;
		workspace.value = result.workspace || workspace.value;
		applyConnector(result.connector);
		receipt.value = result.receipt;
		successMessage.value = result.message;
		activeMobileView.value = 'details';
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Persists runtime ownership, region, cadence, and optional scopes.
 *
 * @returns {Promise<void>}
 */
async function saveSettings() {
	if (!connector.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/integration-marketplace/connectors/${connector.value.id}/settings`, {
			method: 'PATCH',
			body: { ...connectionDraft.value, revision: connector.value.revision, acknowledged: true },
		});
		connectors.value = result.connectors || connectors.value;
		workspace.value = result.workspace || workspace.value;
		applyConnector(result.connector);
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Runs a server-side credential and required-scope check.
 *
 * @returns {Promise<void>}
 */
async function runConnectionTest() {
	if (!connector.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/integration-marketplace/connectors/${connector.value.id}/test`, {
			method: 'POST',
			body: { revision: connector.value.revision },
		});
		connectors.value = result.connectors || connectors.value;
		applyConnector(result.connector);
		if (result.run?.status === 'failed') errorMessage.value = result.message;
		else successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Runs a manual provider synchronisation and stores its evidence.
 *
 * @returns {Promise<void>}
 */
async function runSync() {
	if (!connector.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/integration-marketplace/connectors/${connector.value.id}/sync`, {
			method: 'POST',
			body: { revision: connector.value.revision },
		});
		connectors.value = result.connectors || connectors.value;
		applyConnector(result.connector);
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Toggles an optional provider scope while preserving required access.
 *
 * @param {Record<string, unknown>} scope Provider scope.
 * @returns {void}
 */
function toggleScope(scope) {
	if (scope.required) return;
	connectionDraft.value.selectedScopes = connectionDraft.value.selectedScopes.includes(scope.key)
		? connectionDraft.value.selectedScopes.filter((key) => key !== scope.key)
		: [...connectionDraft.value.selectedScopes, scope.key];
}

/**
 * Opens the disconnect confirmation for the current provider.
 *
 * @returns {void}
 */
function openDisconnectDialog() {
	disconnectDraft.value = createDisconnectDraft();
	fieldErrors.value = {};
	disconnectDialogOpen.value = true;
}

/**
 * Disconnects a provider through the exact-name confirmation route.
 *
 * @returns {Promise<void>}
 */
async function disconnectProvider() {
	if (!connector.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/integration-marketplace/connectors/${connector.value.id}/disconnect`, {
			method: 'POST',
			body: { ...disconnectDraft.value, revision: connector.value.revision },
		});
		connectors.value = result.connectors || connectors.value;
		workspace.value = result.workspace || workspace.value;
		applyConnector(result.connector);
		receipt.value = result.receipt;
		disconnectDialogOpen.value = false;
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Opens a fresh request form for an unlisted provider.
 *
 * @returns {void}
 */
function openRequestDialog() {
	requestDraft.value = createRequestDraft();
	requestReceipt.value = null;
	fieldErrors.value = {};
	requestDialogOpen.value = true;
}

/**
 * Sends an unlisted provider to platform review and keeps its receipt visible.
 *
 * @returns {Promise<void>}
 */
async function submitProviderRequest() {
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/integration-marketplace/requests', {
			method: 'POST',
			body: requestDraft.value,
		});
		workspace.value = result.workspace || workspace.value;
		requestReceipt.value = result.request;
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Restores the seeded provider catalog and operational evidence.
 *
 * @returns {Promise<void>}
 */
async function resetMarketplace() {
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/integration-marketplace/reset', { method: 'POST' });
		bootstrap.value = result;
		workspace.value = result.workspace;
		connectors.value = result.connectors || [];
		selectedConnectorId.value = result.defaultConnectorId || result.connector?.id || '';
		applyConnector(result.connector);
		resetDialogOpen.value = false;
		activeMobileView.value = 'catalog';
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Filters the compact provider rail by search, category, and lifecycle state.
 *
 * @returns {Record<string, unknown>[]} Matching provider summaries.
 */
function getFilteredConnectors() {
	const query = searchQuery.value.trim().toLowerCase();
	return connectors.value.filter((item) => {
		const matchesQuery = !query || [item.name, item.categoryLabel, item.description, item.health].join(' ').toLowerCase().includes(query);
		const matchesCategory = categoryFilter.value === 'all' || item.category === categoryFilter.value;
		const matchesStatus = statusFilter.value === 'all' || item.state === statusFilter.value;
		return matchesQuery && matchesCategory && matchesStatus;
	});
}

/**
 * Returns an owner label from the rich workspace options.
 *
 * @param {string} ownerId Owner identifier.
 * @returns {string} Human-readable owner.
 */
function ownerLabel(ownerId) {
	return bootstrap.value?.options?.owners?.find((option) => option.value === ownerId)?.label || 'Unassigned';
}

/**
 * Returns a cadence label from the rich workspace options.
 *
 * @param {string} cadence Cadence identifier.
 * @returns {string} Human-readable cadence.
 */
function cadenceLabel(cadence) {
	return bootstrap.value?.options?.cadences?.find((option) => option.value === cadence)?.label || cadence || 'Not scheduled';
}

/**
 * Formats an ISO timestamp for compact operational evidence.
 *
 * @param {string|null|undefined} value ISO timestamp.
 * @returns {string} Local timestamp or fallback.
 */
function formatTime(value) {
	if (!value) return 'Not scheduled';
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

/**
 * Formats milliseconds as concise test duration evidence.
 *
 * @param {number} value Milliseconds.
 * @returns {string} Human-readable duration.
 */
function formatDuration(value) {
	return `${Math.max(0, Number(value || 0) / 1000).toFixed(1)}s`;
}

/**
 * Converts structured request failures into field and page feedback.
 *
 * @param {Error & { data?: Record<string, unknown> }} error Request error.
 * @returns {void}
 */
function handleRequestError(error) {
	fieldErrors.value = (error.data?.fields || []).reduce((fields, issue) => {
		fields[issue.field] = [...(fields[issue.field] || []), issue.message];
		return fields;
	}, {});
	errorMessage.value = error.message || 'The integration action could not be completed.';
	if (error.data?.connector) applyConnector(error.data.connector);
	if (error.data?.connectors) connectors.value = error.data.connectors;
}

/**
 * Clears transient feedback before a new action.
 *
 * @returns {void}
 */
function clearFeedback() {
	successMessage.value = '';
	errorMessage.value = '';
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

onMounted(loadMarketplace);
</script>

<template>
	<div class="h-dvh w-full overflow-hidden bg-canvas text-canvas-fg">
		<div v-if="loading" class="flex h-full min-h-0 flex-col">
			<div class="h-16 shrink-0 border-b border-border p-4"><DomSkeleton variant="text" :lines="2" /></div>
			<div class="grid min-h-0 flex-1 lg:grid-cols-[17rem_minmax(0,1fr)_21rem]"><div class="border-r border-border p-4"><DomSkeleton variant="text" :lines="14" /></div><div class="p-6"><DomSkeleton variant="text" :lines="18" /></div><div class="border-l border-border p-4"><DomSkeleton variant="text" :lines="14" /></div></div>
		</div>

		<div v-else-if="workspace && bootstrap" class="flex h-full min-h-0 flex-col">
			<header class="shrink-0 border-b border-border bg-canvas">
				<div class="flex min-h-16 items-center gap-3 px-3 py-2 sm:px-4">
					<div class="min-w-0 flex-1"><div class="flex items-center gap-2"><h1 class="truncate text-base font-semibold sm:text-lg">Connections</h1><DomStatusPill :tone="workspace.attentionCount ? 'warning' : 'success'" size="sm">{{ workspace.attentionCount ? `${workspace.attentionCount} attention` : 'Healthy' }}</DomStatusPill></div><p class="truncate text-xs text-muted-fg">{{ workspace.name }} · {{ workspace.policy }}</p></div>
					<div class="flex shrink-0 items-center gap-2"><DomButton size="sm" variant="secondary" @click="openRequestDialog">Request integration</DomButton><div class="hidden sm:block"><DomButton size="sm" variant="ghost" @click="resetDialogOpen = true">Reset</DomButton></div></div>
				</div>
			</header>

			<div v-if="errorMessage || successMessage" class="shrink-0 border-b border-border px-3 py-2 sm:px-4"><DomAlert v-if="errorMessage" tone="danger" variant="soft" title="Connection needs attention" :description="errorMessage" dismissible @dismiss="errorMessage = ''" /><DomAlert v-else tone="success" variant="soft" title="Connection updated" :description="successMessage" dismissible @dismiss="successMessage = ''" /></div>

			<DomTabs v-model="activeMobileView" :tabs="mobileViews" variant="page" class="shrink-0 lg:hidden [&>div:last-child]:hidden" />

			<div class="grid min-h-0 flex-1 lg:grid-cols-[17rem_minmax(0,1fr)_21rem]">
				<aside class="min-h-0 min-w-0 flex-col border-r border-border bg-secondary/10 lg:flex" :class="activeMobileView === 'catalog' ? 'flex' : 'hidden'">
					<div class="shrink-0 border-b border-border p-4"><div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Approved catalog</p><p class="mt-1 text-sm font-semibold">{{ workspace.catalogCount }} providers</p></div><DomBadge tone="neutral" variant="outline">{{ workspace.connectedCount }} live</DomBadge></div><div class="mt-4"><DomTextInput v-model="searchQuery" label="Find provider" placeholder="Search catalog…" /></div><div class="mt-3 grid grid-cols-2 gap-2"><DomSelect v-model="categoryFilter" label="Category" :options="categoryOptions" width="min-w-[17rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="statusFilter" label="State" :options="statusOptions" width="min-w-[17rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div></div>
					<div class="min-h-0 flex-1 overflow-y-auto"><button v-for="item in filteredConnectors" :key="item.id" type="button" class="w-full border-b border-border px-4 py-4 text-left transition hover:bg-secondary/45" :class="selectedConnectorId === item.id ? 'bg-secondary/55' : ''" @click="selectConnector(item.id)"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="truncate text-sm font-semibold">{{ item.name }}</p><p class="mt-1 truncate text-xs text-muted-fg">{{ item.categoryLabel }} · {{ item.installMethodLabel }}</p></div><DomStatusPill :tone="item.statusTone" size="sm">{{ item.statusLabel }}</DomStatusPill></div><p class="mt-2 line-clamp-2 text-xs leading-5 text-muted-fg">{{ item.description }}</p><div class="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-fg"><span>{{ item.recordMetric }}</span><span>{{ item.health }}</span></div></button><DomEmptyState v-if="!filteredConnectors.length" class="py-16" title="No matching providers" description="Clear a filter or request a provider for platform review." /></div>
					<div class="shrink-0 border-t border-border px-4 py-3 text-xs text-muted-fg"><span class="font-medium text-canvas-fg">Least privilege</span> · required scopes stay server-owned</div>
				</aside>

				<main class="min-h-0 min-w-0 flex-col lg:flex" :class="activeMobileView === 'details' ? 'flex' : 'hidden'">
					<div v-if="connector" class="flex min-h-0 flex-1 flex-col">
						<section class="shrink-0 border-b border-border px-4 py-5 sm:px-6"><div class="flex flex-wrap items-start justify-between gap-4"><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><DomBadge tone="neutral" variant="outline">{{ connector.categoryLabel }}</DomBadge><DomStatusPill :tone="connector.statusTone" size="sm">{{ connector.statusLabel }}</DomStatusPill></div><h2 class="mt-3 text-2xl font-semibold tracking-tight">{{ connector.name }}</h2><p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">{{ connector.description }}</p></div><DomButton class="lg:hidden" size="sm" @click="activeMobileView = 'setup'">{{ isConnected ? 'Manage' : needsAttention ? 'Repair' : 'Connect' }}</DomButton></div></section>
						<div v-if="receipt" class="shrink-0 border-b border-border p-4"><DomAlert tone="success" title="Lifecycle receipt stored" :description="`${receipt.id} · ${receipt.action} · connection revision ${receipt.connectionRevision}`" /></div>
						<DomTabs v-model="activeDetailTab" :tabs="detailTabs" variant="page" fill class="min-h-0 flex-1">
							<template #overview><div class="h-full min-h-0 overflow-y-auto p-4 sm:p-6"><DomAlert v-if="needsAttention" tone="warning" title="Provider permission changed" :description="connector.attentionReason" /><DomAlert v-else-if="isConnected" tone="success" variant="soft" title="Connection is healthy" :description="`${connector.connection.accountLabel} is available to scheduled and manual workflows.`" /><DomAlert v-else tone="info" variant="soft" title="Approved and ready" :description="`${connector.installMethodLabel} setup has passed platform and security review.`" />
								<div class="mt-6 grid border-y border-border sm:grid-cols-3"><div class="py-4 sm:border-r sm:border-border sm:pr-4"><p class="text-xs text-muted-fg">Connection</p><p class="mt-1 text-sm font-semibold">{{ connector.connection?.accountLabel || connector.installMethodLabel }}</p></div><div class="border-t border-border py-4 sm:border-r sm:border-t-0 sm:px-4"><p class="text-xs text-muted-fg">Data footprint</p><p class="mt-1 text-sm font-semibold">{{ connector.recordMetric }}</p></div><div class="border-t border-border py-4 sm:border-t-0 sm:pl-4"><p class="text-xs text-muted-fg">Reliability</p><p class="mt-1 text-sm font-semibold">{{ connector.successRate }}</p></div></div>
								<div class="mt-7"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Workflow capabilities</p><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="capability in connector.capabilities" :key="capability" class="flex items-center justify-between gap-3 py-3"><p class="text-sm font-medium">{{ capability }}</p><DomBadge tone="neutral" variant="outline">Supported</DomBadge></div></div></div>
								<div class="mt-7"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Runtime contract</p><dl class="mt-3 grid gap-x-6 gap-y-4 border-y border-border py-4 sm:grid-cols-2"><div><dt class="text-xs text-muted-fg">Install method</dt><dd class="mt-1 text-sm font-medium">{{ connector.installMethodLabel }}</dd></div><div><dt class="text-xs text-muted-fg">Accountable owner</dt><dd class="mt-1 text-sm font-medium">{{ ownerLabel(connector.connection?.ownerId) }}</dd></div><div><dt class="text-xs text-muted-fg">Cadence</dt><dd class="mt-1 text-sm font-medium">{{ cadenceLabel(connector.connection?.cadence) }}</dd></div><div><dt class="text-xs text-muted-fg">Processing region</dt><dd class="mt-1 text-sm font-medium">{{ connector.connection?.region?.toUpperCase() || 'Chosen during setup' }}</dd></div></dl></div>
							</div></template>

							<template #access><div class="h-full min-h-0 overflow-y-auto p-4 sm:p-6"><div class="flex items-start justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Provider contract</p><h3 class="mt-1 text-lg font-semibold">Data access</h3><p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">Required scopes are controlled by the server. Optional access can be changed from the Connection view with elevated writes called out separately.</p></div><DomBadge tone="neutral" variant="outline">{{ allScopes.length }} scopes</DomBadge></div><div class="mt-6 divide-y divide-border border-y border-border"><div v-for="scope in allScopes" :key="scope.key" class="flex items-start justify-between gap-4 py-4"><div><div class="flex flex-wrap items-center gap-2"><p class="text-sm font-semibold">{{ scope.label }}</p><DomBadge v-if="scope.required" tone="neutral" variant="outline">Required</DomBadge><DomBadge v-else-if="scope.risk === 'elevated'" tone="warning" variant="outline">Elevated write</DomBadge><DomBadge v-else tone="info" variant="outline">Optional</DomBadge></div><p class="mt-1 text-sm leading-6 text-muted-fg">{{ scope.description }}</p><p class="mt-2 font-mono text-[11px] text-muted-fg">{{ scope.key }}</p></div><DomStatusPill :tone="connectionDraft.selectedScopes.includes(scope.key) ? 'success' : 'neutral'" size="sm">{{ connectionDraft.selectedScopes.includes(scope.key) ? 'Enabled' : 'Off' }}</DomStatusPill></div></div></div></template>

							<template #activity><div class="h-full min-h-0 overflow-y-auto p-4 sm:p-6"><div class="grid gap-8 xl:grid-cols-2"><section><div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Evidence</p><h3 class="mt-1 text-lg font-semibold">Recent runs</h3></div><DomStatusPill v-if="latestRun" :tone="latestRun.statusTone" size="sm">{{ latestRun.statusLabel }}</DomStatusPill></div><div class="mt-4 divide-y divide-border border-y border-border"><div v-for="run in connector.runs" :key="run.id" class="py-4"><div class="flex items-start justify-between gap-4"><div><p class="text-sm font-semibold">{{ run.typeLabel }}</p><p class="mt-1 text-sm leading-6 text-muted-fg">{{ run.summary }}</p></div><DomStatusPill :tone="run.statusTone" size="sm">{{ run.statusLabel }}</DomStatusPill></div><p class="mt-2 text-xs text-muted-fg">{{ formatTime(run.createdAt) }} · {{ formatDuration(run.durationMs) }} · {{ run.id }}</p></div></div></section><section><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Audit trail</p><h3 class="mt-1 text-lg font-semibold">Lifecycle activity</h3><div class="mt-4 divide-y divide-border border-y border-border"><div v-for="event in connector.activity" :key="event.id" class="py-4"><div class="flex items-start justify-between gap-4"><p class="text-sm font-semibold">{{ event.label }}</p><DomBadge :tone="event.tone" variant="outline">{{ event.actor }}</DomBadge></div><p class="mt-1 text-sm leading-6 text-muted-fg">{{ event.detail }}</p><p class="mt-2 text-xs text-muted-fg">{{ formatTime(event.createdAt) }} · {{ event.id }}</p></div></div></section></div></div></template>
						</DomTabs>
					</div>
					<DomEmptyState v-else class="m-auto" title="Choose a provider" description="Select a provider from the catalog to inspect its contract and connection state." />
				</main>

				<aside class="min-h-0 min-w-0 flex-col border-l border-border bg-secondary/10 lg:flex" :class="activeMobileView === 'setup' ? 'flex' : 'hidden'">
					<div v-if="connector" class="h-full min-h-0 overflow-y-auto p-4">
						<div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ isConnected ? 'Runtime settings' : needsAttention ? 'Repair plan' : 'Setup contract' }}</p><h2 class="mt-1 text-lg font-semibold">{{ isConnected ? 'Manage connection' : connectionActionLabel }}</h2></div><DomStatusPill :tone="connector.healthTone" size="sm">{{ connector.health }}</DomStatusPill></div>
						<p class="mt-2 text-sm leading-6 text-muted-fg">{{ isConnected ? 'Keep ownership, data access, and scheduling aligned with the provider contract.' : `Review ${connector.installMethodLabel}, required access, and processing before activation.` }}</p>

						<DomAlert v-if="needsAttention" class="mt-5" tone="warning" title="Current connection is paused" :description="connector.attentionReason" />
						<div v-if="latestRun && isConnected" class="mt-5 border-y border-border py-4"><div class="flex items-center justify-between gap-3"><div><p class="text-sm font-semibold">Latest {{ latestRun.typeLabel.toLowerCase() }}</p><p class="mt-1 text-xs text-muted-fg">{{ formatTime(latestRun.createdAt) }} · {{ formatDuration(latestRun.durationMs) }}</p></div><DomStatusPill :tone="latestRun.statusTone" size="sm">{{ latestRun.statusLabel }}</DomStatusPill></div><p class="mt-3 text-sm leading-6 text-muted-fg">{{ latestRun.summary }}</p><div class="mt-4 grid grid-cols-2 gap-2"><DomButton size="sm" variant="secondary" :loading="busy" @click="runConnectionTest">Test</DomButton><DomButton size="sm" :loading="busy" @click="runSync">Sync now</DomButton></div></div>

						<div class="mt-5 grid gap-4"><DomTextInput v-if="!isConnected" v-model="connectionDraft.connectionName" label="Connection name" :errors="fieldErrors.connectionName || []" /><DomSelect v-model="connectionDraft.ownerId" label="Accountable owner" :options="bootstrap.options.owners" :errors="fieldErrors.ownerId || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="connectionDraft.cadence" label="Sync cadence" :options="bootstrap.options.cadences" :errors="fieldErrors.cadence || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="connectionDraft.region" label="Processing region" :options="bootstrap.options.regions" :errors="fieldErrors.region || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomToggle v-model="connectionDraft.scheduledSync" label="Scheduled syncs" description="Run the selected cadence after activation." /></div>

						<div class="mt-6"><div class="flex items-center justify-between gap-3"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Optional access</p><span class="text-xs text-muted-fg">{{ selectedOptionalScopes.length }}/{{ connector.optionalScopes.length }}</span></div><div class="mt-3 grid gap-4 border-y border-border py-4"><DomCheckbox v-for="scope in connector.optionalScopes" :key="scope.key" :model-value="connectionDraft.selectedScopes.includes(scope.key)" :label="scope.label" :description="scope.description" @update:model-value="toggleScope(scope)" /></div><p v-if="fieldErrors.selectedScopes?.length" class="mt-2 text-xs text-destructive">{{ fieldErrors.selectedScopes[0] }}</p></div>

						<div v-if="!isConnected" class="mt-6"><div v-if="connector.installMethod === 'oauth'" class="border-y border-border py-4"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-semibold">Provider authorization</p><p class="mt-1 text-xs leading-5 text-muted-fg">The API returns an expiring grant; provider tokens are never exposed to this screen.</p></div><DomStatusPill :tone="authorization ? 'success' : 'neutral'" size="sm">{{ authorization ? 'Approved' : 'Required' }}</DomStatusPill></div><DomButton class="mt-4 w-full" size="sm" variant="secondary" :loading="busy" @click="authorizeProvider">{{ authorization ? 'Authorize again' : `Authorize ${connector.name}` }}</DomButton><p v-if="authorization" class="mt-2 text-xs text-muted-fg">{{ authorization.accountLabel }} · expires {{ formatTime(authorization.expiresAt) }}</p><p v-if="fieldErrors.authorizationId?.length" class="mt-2 text-xs text-destructive">{{ fieldErrors.authorizationId[0] }}</p></div><div v-else class="border-y border-border py-4"><DomPasswordInput v-model="connectionDraft.credential" :show-strength="false" :label="connector.installMethodLabel" placeholder="Paste provider credential" :errors="fieldErrors.credential || []" description="Demo restricted key: rk_test_marketplace_123456" /></div><div class="mt-5"><DomCheckbox v-model="connectionDraft.acknowledged" label="I reviewed the provider account and data access" description="Required before the server creates or repairs a connection." :errors="fieldErrors.acknowledged || []" /></div><DomButton class="mt-5 w-full" :loading="busy" @click="connectProvider">{{ connectionActionLabel }}</DomButton><DomButton v-if="needsAttention" class="mt-2 w-full" size="sm" variant="ghost" :loading="busy" @click="runConnectionTest">Retest current connection</DomButton></div>

						<div v-else class="mt-6"><DomCheckbox v-if="selectedElevatedScope" v-model="connectionDraft.elevatedAcknowledged" label="Approve elevated write access" description="Required when enabling an optional write scope." :errors="fieldErrors.elevatedAcknowledged || []" /><DomButton class="mt-4 w-full" :loading="busy" @click="saveSettings">Save connection</DomButton><button type="button" class="mt-5 w-full border-t border-border pt-5 text-left text-sm font-medium text-destructive transition hover:opacity-75" @click="openDisconnectDialog">Disconnect {{ connector.name }}</button></div>
					</div>
				</aside>
			</div>

			<DomDialog v-model="requestDialogOpen" width="min(34rem, 94vw)" title="Request an integration" description="Send an unlisted provider and concrete workflow to platform review."><div v-if="requestReceipt"><DomAlert tone="success" title="Request recorded" :description="`${requestReceipt.id} · ${requestReceipt.statusLabel}`" /><dl class="mt-5 grid gap-4 sm:grid-cols-2"><div><dt class="text-xs text-muted-fg">Provider</dt><dd class="mt-1 text-sm font-semibold">{{ requestReceipt.providerName }}</dd></div><div><dt class="text-xs text-muted-fg">Requested by</dt><dd class="mt-1 text-sm font-semibold">{{ requestReceipt.requestedBy }}</dd></div></dl></div><div v-else class="grid gap-4"><DomTextInput v-model="requestDraft.providerName" label="Provider name" :errors="fieldErrors.providerName || []" /><DomSelect v-model="requestDraft.category" label="Category" :options="requestCategoryOptions" :errors="fieldErrors.category || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomTextareaInput v-model="requestDraft.useCase" label="Workflow and data needed" :rows="4" :errors="fieldErrors.useCase || []" /></div><template #footer><DomButton variant="secondary" data-close>{{ requestReceipt ? 'Close' : 'Cancel' }}</DomButton><DomButton v-if="!requestReceipt" :loading="busy" @click="submitProviderRequest">Send request</DomButton></template></DomDialog>

			<DomDialog v-model="disconnectDialogOpen" width="min(34rem, 94vw)" :title="`Disconnect ${connector?.name || 'provider'}?`" description="This immediately stops scheduled syncs and invalidates the stored provider connection."><div class="grid gap-4"><DomAlert tone="warning" title="Connection access will stop" description="Historical sync evidence remains in the audit trail, but new workflows will fail until the provider is connected again." /><DomTextInput v-model="disconnectDraft.confirmName" :label="`Type ${connector?.name || 'the provider name'} to confirm`" :errors="fieldErrors.confirmName || []" /><DomTextareaInput v-model="disconnectDraft.reason" label="Audit reason" :rows="3" :errors="fieldErrors.reason || []" /><DomCheckbox v-model="disconnectDraft.acknowledged" label="Stop scheduled syncs and provider access" description="I understand workflows using this connection may fail." :errors="fieldErrors.acknowledged || []" /></div><template #footer><DomButton variant="secondary" data-close>Keep connection</DomButton><DomButton variant="danger" :loading="busy" @click="disconnectProvider">Disconnect</DomButton></template></DomDialog>

			<DomDialog v-model="resetDialogOpen" title="Reset the integration marketplace?" description="This restores the seeded provider catalog, connections, runs, activity, and requests."><template #footer><DomButton variant="secondary" data-close>Keep workspace</DomButton><DomButton variant="danger" :loading="busy" @click="resetMarketplace">Reset demo</DomButton></template></DomDialog>
		</div>

		<div v-else class="grid h-full place-items-center p-6"><DomAlert tone="danger" title="Integration workspace unavailable" :description="errorMessage || 'The marketplace API did not return a catalog.'"><template #actions><DomButton variant="secondary" @click="loadMarketplace">Try again</DomButton></template></DomAlert></div>
	</div>
</template>
