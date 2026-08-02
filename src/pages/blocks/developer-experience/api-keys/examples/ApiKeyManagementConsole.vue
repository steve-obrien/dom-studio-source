<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomCodeInput,
	DomDialog,
	DomEmptyState,
	DomProgress,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTagCombobox,
	DomTextareaInput,
	DomTextInput,
} from '@getdom/studio/vue';

const loading = ref(true);
const busy = ref(false);
const bootstrap = ref(null);
const keys = ref([]);
const key = ref(null);
const selectedKeyId = ref('');
const environmentFilter = ref('all');
const searchQuery = ref('');
const activeMobileView = ref('keys');
const activeDetailTab = ref('overview');
const fieldErrors = ref({});
const errorMessage = ref('');
const successMessage = ref('');
const newKeyDialogOpen = ref(false);
const rotateDialogOpen = ref(false);
const revokeDialogOpen = ref(false);
const completeRotationDialogOpen = ref(false);
const secretDialogOpen = ref(false);
const resetDialogOpen = ref(false);
const secretReceipt = ref(null);
const createDraft = ref(createCredentialDraft());
const permissionDraft = ref(createPermissionDraft());
const rotationDraft = ref(createRotationDraft());
const revokeDraft = ref(createRevocationDraft());
const rotationCompleteAcknowledged = ref(false);

const mobileViews = [
	{ key: 'keys', label: 'Keys' },
	{ key: 'details', label: 'Details' },
	{ key: 'security', label: 'Security' },
];

const detailTabs = [
	{ key: 'overview', label: 'Overview' },
	{ key: 'permissions', label: 'Permissions' },
	{ key: 'activity', label: 'Activity' },
];

const environmentOptions = computed(getEnvironmentOptions);
const filteredKeys = computed(getFilteredKeys);
const groupedScopes = computed(getGroupedScopes);
const usagePercent = computed(getUsagePercent);
const selectedScopeCatalog = computed(getSelectedScopeCatalog);
const permissionIsDirty = computed(getPermissionIsDirty);
const securityChecks = computed(getSecurityChecks);

/**
 * Creates safe default values for the credential creation dialog.
 *
 * @returns {Record<string, unknown>} New credential draft.
 */
function createCredentialDraft() {
	return {
		name: 'Mobile checkout',
		environment: 'production',
		ownerId: 'maya',
		lifetimeDays: '30',
		scopes: ['customers:read', 'checkout:write'],
		origins: ['https://mobile.northstar.example'],
		acknowledged: false,
		adminAcknowledged: false,
	};
}

/**
 * Creates empty permission values before a credential is selected.
 *
 * @returns {{ scopes: string[], origins: string[], adminAcknowledged: boolean }} Permission draft.
 */
function createPermissionDraft() {
	return { scopes: [], origins: [], adminAcknowledged: false };
}

/**
 * Creates the default staged-rotation plan.
 *
 * @returns {{ overlapHours: string, reason: string, acknowledged: boolean }} Rotation draft.
 */
function createRotationDraft() {
	return {
		overlapHours: '24',
		reason: 'Scheduled production credential rotation',
		acknowledged: false,
	};
}

/**
 * Creates the default irreversible revocation evidence.
 *
 * @returns {{ reason: string, acknowledged: boolean }} Revocation draft.
 */
function createRevocationDraft() {
	return { reason: '', acknowledged: false };
}

/**
 * Loads the server-owned credential inventory and default detail.
 *
 * @returns {Promise<void>}
 */
async function loadWorkspace() {
	loading.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/api-keys/bootstrap');
		bootstrap.value = result;
		keys.value = result.keys || [];
		selectedKeyId.value = result.defaultKeyId || result.key?.id || '';
		applyKey(result.key);
	} catch (error) {
		errorMessage.value = error.message || 'The credential workspace could not be loaded.';
	} finally {
		loading.value = false;
	}
}

/**
 * Loads complete safe detail for a selected inventory item.
 *
 * @param {string} keyId Credential identifier.
 * @returns {Promise<void>}
 */
async function selectKey(keyId) {
	if (!keyId || keyId === key.value?.id) {
		activeMobileView.value = 'details';
		return;
	}
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/api-keys/keys/${keyId}`);
		keys.value = result.keys || keys.value;
		selectedKeyId.value = keyId;
		applyKey(result.key);
		activeDetailTab.value = 'overview';
		activeMobileView.value = 'details';
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Applies authoritative key state and resets its editable permissions.
 *
 * @param {Record<string, unknown>|null} nextKey Safe API key detail.
 * @returns {void}
 */
function applyKey(nextKey) {
	key.value = nextKey || null;
	if (!nextKey) {
		permissionDraft.value = createPermissionDraft();
		return;
	}
	selectedKeyId.value = nextKey.id;
	permissionDraft.value = {
		scopes: [...(nextKey.scopes || [])],
		origins: [...(nextKey.origins || [])],
		adminAcknowledged: nextKey.scopes?.includes('keys:admin') || false,
	};
}

/**
 * Creates a new credential through the block API.
 *
 * @returns {Promise<void>}
 */
async function createKey() {
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/api-keys/keys', {
			method: 'POST',
			body: createDraft.value,
		});
		keys.value = result.keys || keys.value;
		applyKey(result.key);
		secretReceipt.value = result.secretReceipt;
		newKeyDialogOpen.value = false;
		secretDialogOpen.value = true;
		activeMobileView.value = 'details';
		successMessage.value = result.message;
		createDraft.value = createCredentialDraft();
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Persists the selected credential permissions at its loaded revision.
 *
 * @returns {Promise<void>}
 */
async function savePermissions() {
	if (!key.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/api-keys/keys/${key.value.id}/permissions`, {
			method: 'PATCH',
			body: { revision: key.value.revision, ...permissionDraft.value },
		});
		keys.value = result.keys || keys.value;
		applyKey(result.key);
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Creates a replacement secret and bounded overlap plan.
 *
 * @returns {Promise<void>}
 */
async function rotateKey() {
	if (!key.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/api-keys/keys/${key.value.id}/rotate`, {
			method: 'POST',
			body: { revision: key.value.revision, ...rotationDraft.value },
		});
		keys.value = result.keys || keys.value;
		applyKey(result.key);
		secretReceipt.value = result.secretReceipt;
		rotateDialogOpen.value = false;
		secretDialogOpen.value = true;
		successMessage.value = result.message;
		rotationDraft.value = createRotationDraft();
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Disables the previous secret after replacement traffic is confirmed.
 *
 * @returns {Promise<void>}
 */
async function completeRotation() {
	if (!key.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/api-keys/keys/${key.value.id}/rotation-complete`, {
			method: 'POST',
			body: { revision: key.value.revision, acknowledged: rotationCompleteAcknowledged.value },
		});
		keys.value = result.keys || keys.value;
		applyKey(result.key);
		completeRotationDialogOpen.value = false;
		rotationCompleteAcknowledged.value = false;
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Permanently revokes the loaded credential.
 *
 * @returns {Promise<void>}
 */
async function revokeKey() {
	if (!key.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/api-keys/keys/${key.value.id}/revoke`, {
			method: 'POST',
			body: { revision: key.value.revision, ...revokeDraft.value },
		});
		keys.value = result.keys || keys.value;
		applyKey(result.key);
		revokeDialogOpen.value = false;
		revokeDraft.value = createRevocationDraft();
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Restores the seeded credential inventory for another full workflow.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/api-keys/reset', { method: 'POST' });
		bootstrap.value = { ...bootstrap.value, ...result };
		keys.value = result.keys || [];
		applyKey(result.key);
		selectedKeyId.value = result.defaultKeyId || result.key?.id || '';
		resetDialogOpen.value = false;
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Copies the one-time secret while it remains in client memory.
 *
 * @returns {Promise<void>}
 */
async function copySecret() {
	if (!secretReceipt.value?.secret) return;
	try {
		await navigator.clipboard.writeText(secretReceipt.value.secret);
		successMessage.value = 'Secret copied. Store it in your secret manager before closing this receipt.';
	} catch {
		errorMessage.value = 'Clipboard access was unavailable. Select the secret and copy it manually.';
	}
}

/**
 * Closes and clears the one-time secret receipt from client memory.
 *
 * @returns {void}
 */
function closeSecretReceipt() {
	secretDialogOpen.value = false;
	secretReceipt.value = null;
}

/**
 * Opens a lifecycle dialog with clean transient validation state.
 *
 * @param {'create'|'rotate'|'revoke'|'complete'} action Lifecycle action.
 * @returns {void}
 */
function openLifecycleDialog(action) {
	clearFeedback();
	if (action === 'create') newKeyDialogOpen.value = true;
	if (action === 'rotate') rotateDialogOpen.value = true;
	if (action === 'revoke') revokeDialogOpen.value = true;
	if (action === 'complete') completeRotationDialogOpen.value = true;
}

/**
 * Returns environment filters with the current credential counts.
 *
 * @returns {Array<Record<string, string>>} Rich environment options.
 */
function getEnvironmentOptions() {
	return (bootstrap.value?.options?.environments || []).map((option) => ({
		...option,
		description: `${option.description} ${option.value === 'all' ? keys.value.length : keys.value.filter((item) => item.environment === option.value).length} keys.`,
	}));
}

/**
 * Filters the inventory by environment and search query.
 *
 * @returns {Array<Record<string, unknown>>} Visible credential summaries.
 */
function getFilteredKeys() {
	const query = searchQuery.value.trim().toLowerCase();
	return keys.value.filter((item) => {
		const environmentMatches = environmentFilter.value === 'all' || item.environment === environmentFilter.value;
		const queryMatches = !query || `${item.name} ${item.prefix} ${ownerLabel(item.ownerId)}`.toLowerCase().includes(query);
		return environmentMatches && queryMatches;
	});
}

/**
 * Groups the server scope catalog for least-privilege editing.
 *
 * @returns {Array<{ name: string, scopes: Array<Record<string, unknown>> }>} Grouped scopes.
 */
function getGroupedScopes() {
	const groups = new Map();
	for (const scope of bootstrap.value?.options?.scopes || []) {
		if (!groups.has(scope.group)) groups.set(scope.group, []);
		groups.get(scope.group).push(scope);
	}
	return [...groups.entries()].map(([name, scopes]) => ({ name, scopes }));
}

/**
 * Returns the selected credential usage as a bounded percentage.
 *
 * @returns {number} Usage percentage.
 */
function getUsagePercent() {
	if (!key.value?.limit) return 0;
	return Math.min(100, Math.round((key.value.requests / key.value.limit) * 100));
}

/**
 * Returns catalog metadata for the credential's selected scopes.
 *
 * @returns {Array<Record<string, unknown>>} Selected scope definitions.
 */
function getSelectedScopeCatalog() {
	return (bootstrap.value?.options?.scopes || []).filter((scope) => key.value?.scopes?.includes(scope.value));
}

/**
 * Compares editable permissions with the server-owned credential state.
 *
 * @returns {boolean} Whether permission values changed.
 */
function getPermissionIsDirty() {
	if (!key.value) return false;
	return JSON.stringify([...permissionDraft.value.scopes].sort()) !== JSON.stringify([...(key.value.scopes || [])].sort())
		|| JSON.stringify([...permissionDraft.value.origins].sort()) !== JSON.stringify([...(key.value.origins || [])].sort());
}

/**
 * Builds compact security posture checks from credential evidence.
 *
 * @returns {Array<Record<string, unknown>>} Security checks.
 */
function getSecurityChecks() {
	if (!key.value) return [];
	return [
		{ label: 'Bounded lifetime', detail: `Expires ${formatDate(key.value.expiresAt)}`, passed: Boolean(key.value.expiresAt) },
		{ label: 'Accountable owner', detail: ownerLabel(key.value.ownerId), passed: Boolean(key.value.ownerId) },
		{ label: 'Network boundary', detail: `${key.value.origins?.length || 0} allowed origins`, passed: key.value.environment !== 'production' || Boolean(key.value.origins?.length) },
		{ label: 'Least privilege', detail: `${key.value.scopes?.length || 0} granted scopes`, passed: !key.value.scopes?.includes('keys:admin') },
	];
}

/**
 * Toggles one catalog scope within an editable permission object.
 *
 * @param {Record<string, unknown>} draft Reactive permission or creation draft.
 * @param {string} scopeValue Scope identifier.
 * @returns {void}
 */
function toggleScope(draft, scopeValue) {
	draft.scopes = draft.scopes.includes(scopeValue)
		? draft.scopes.filter((value) => value !== scopeValue)
		: [...draft.scopes, scopeValue];
}

/**
 * Returns the display label for an option value.
 *
 * @param {Array<Record<string, string>>|undefined} options Available options.
 * @param {string} value Stored value.
 * @returns {string} Option label.
 */
function optionLabel(options, value) {
	return options?.find((option) => option.value === value)?.label || value || 'Not selected';
}

/**
 * Returns the accountable owner label for an identifier.
 *
 * @param {string} ownerId Owner identifier.
 * @returns {string} Owner label.
 */
function ownerLabel(ownerId) {
	return optionLabel(bootstrap.value?.options?.owners, ownerId);
}

/**
 * Formats an ISO timestamp for compact application metadata.
 *
 * @param {unknown} value Timestamp.
 * @returns {string} Localized date or fallback.
 */
function formatDate(value) {
	if (!value) return 'Never';
	return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(String(value)));
}

/**
 * Formats an ISO timestamp with date and time evidence.
 *
 * @param {unknown} value Timestamp.
 * @returns {string} Localized timestamp or fallback.
 */
function formatDateTime(value) {
	if (!value) return 'Never used';
	return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(String(value)));
}

/**
 * Capitalizes a short environment label.
 *
 * @param {unknown} value Raw label.
 * @returns {string} Capitalized label.
 */
function capitalize(value) {
	const text = String(value || '');
	return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : '';
}

/**
 * Resolves a semantic risk tone for DOM Studio badges.
 *
 * @param {string} risk Scope risk.
 * @returns {string} Semantic tone.
 */
function riskTone(risk) {
	return { standard: 'neutral', elevated: 'info', critical: 'danger' }[risk] || 'neutral';
}

/**
 * Converts structured API field errors into DOM Studio field collections.
 *
 * @param {Array<Record<string, string>>} fields API field errors.
 * @returns {void}
 */
function applyFieldErrors(fields = []) {
	fieldErrors.value = Object.fromEntries(fields.map((field) => [field.field, [field.message]]));
}

/**
 * Applies API conflict recovery state and user-facing feedback.
 *
 * @param {Error & { fields?: Array<Record<string, string>>, payload?: Record<string, unknown> }} error Request error.
 * @returns {void}
 */
function handleRequestError(error) {
	applyFieldErrors(error.fields || []);
	if (error.payload?.keys) keys.value = error.payload.keys;
	if (error.payload?.key) applyKey(error.payload.key);
	errorMessage.value = error.message || 'The credential action could not be completed.';
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
 * Sends JSON requests and converts structured API errors into exceptions.
 *
 * @param {string} url API route.
 * @param {{ method?: string, body?: Record<string, unknown> }} options Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed API response.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		method: options.method || 'GET',
		headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const result = await response.json();
	if (!response.ok || result.error) {
		const error = new Error(result.error?.message || `Request failed with ${response.status}.`);
		error.fields = result.error?.fields || [];
		error.payload = result.error || result;
		throw error;
	}
	return result;
}

watch(() => createDraft.value.environment, (environment) => {
	if (environment !== 'production' && createDraft.value.origins[0] === 'https://mobile.northstar.example') createDraft.value.origins = [];
});

onMounted(loadWorkspace);
</script>

<template>
	<div class="h-dvh min-h-0 overflow-hidden bg-canvas text-canvas-fg">
		<div v-if="loading" class="flex h-full flex-col">
			<div class="flex h-16 items-center border-b border-border px-4"><DomSkeleton variant="text" :lines="1" width="28rem" /></div>
			<div class="grid min-h-0 flex-1 lg:grid-cols-[17rem_minmax(0,1fr)_20rem]">
				<div class="hidden border-r border-border p-4 lg:block"><DomSkeleton variant="text" :lines="13" /></div>
				<div class="p-5"><DomSkeleton variant="text" :lines="17" /></div>
				<div class="hidden border-l border-border p-4 lg:block"><DomSkeleton variant="text" :lines="13" /></div>
			</div>
		</div>

		<div v-else-if="bootstrap && key" class="flex h-full min-h-0 flex-col">
			<header class="shrink-0 border-b border-border bg-canvas">
				<div class="flex min-h-16 items-center gap-3 px-3 py-2 sm:px-4">
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold sm:text-base">{{ bootstrap.workspace.name }}</p>
						<p class="truncate text-xs text-muted-fg">{{ bootstrap.workspace.area }} · secrets never return after creation</p>
					</div>
					<div class="flex shrink-0 items-center gap-2">
						<DomButton class="hidden sm:inline-flex" size="sm" variant="ghost" @click="resetDialogOpen = true">Reset demo</DomButton>
						<DomButton data-testid="new-key" size="sm" @click="openLifecycleDialog('create')">New key</DomButton>
					</div>
				</div>
			</header>

			<div v-if="errorMessage || successMessage" class="shrink-0 border-b border-border px-3 py-2 sm:px-4">
				<DomAlert v-if="errorMessage" tone="danger" variant="soft" title="Credential action needs attention" :description="errorMessage" dismissible @dismiss="errorMessage = ''" />
				<DomAlert v-else tone="success" variant="soft" title="Credential workspace updated" :description="successMessage" dismissible @dismiss="successMessage = ''" />
			</div>

			<DomTabs v-model="activeMobileView" :tabs="mobileViews" variant="page" class="shrink-0 lg:hidden [&>div:last-child]:hidden" />

			<div class="flex min-h-0 flex-1">
				<aside class="min-h-0 w-full shrink-0 flex-col border-r border-border bg-secondary/10 lg:flex lg:w-68" :class="activeMobileView === 'keys' ? 'flex' : 'hidden'">
					<div class="shrink-0 border-b border-border p-3">
						<DomSelect v-model="environmentFilter" label="Environment" :options="environmentOptions" width="min-w-[18rem]">
							<template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template>
						</DomSelect>
						<div class="mt-3"><DomTextInput v-model="searchQuery" type="search" label="Find a credential" placeholder="Name, prefix, or owner" /></div>
					</div>

					<nav class="min-h-0 flex-1 divide-y divide-border overflow-y-auto" aria-label="API key inventory">
						<button v-for="item in filteredKeys" :key="item.id" type="button" class="w-full border-l-2 px-4 py-4 text-left transition hover:bg-secondary/45" :class="item.id === key.id ? 'border-l-primary bg-secondary/55' : 'border-l-transparent'" @click="selectKey(item.id)">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0"><p class="truncate text-sm font-semibold">{{ item.name }}</p><p class="mt-1 truncate font-mono text-[11px] text-muted-fg">{{ item.prefix }}••••</p></div>
								<DomStatusPill :tone="item.statusTone" size="sm">{{ item.statusLabel }}</DomStatusPill>
							</div>
							<div class="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-fg"><span class="truncate">{{ ownerLabel(item.ownerId) }}</span><span class="shrink-0">{{ capitalize(item.environment) }}</span></div>
						</button>
					</nav>
					<DomEmptyState v-if="!filteredKeys.length" class="m-auto px-5 py-10" title="No matching keys" description="Try another environment or search term." />
				</aside>

				<main class="min-h-0 min-w-0 flex-1 flex-col" :class="activeMobileView === 'details' ? 'flex' : 'hidden lg:flex'">
					<div class="shrink-0 border-b border-border px-4 py-4 sm:px-5">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2"><h1 class="truncate text-lg font-semibold tracking-tight">{{ key.name }}</h1><DomStatusPill :tone="key.statusTone" size="sm">{{ key.statusLabel }}</DomStatusPill><DomBadge tone="neutral" variant="outline">{{ capitalize(key.environment) }}</DomBadge></div>
								<p class="mt-1 break-all font-mono text-xs text-muted-fg">{{ key.prefix }}•••••••• · rev {{ key.revision }}</p>
							</div>
							<div class="flex shrink-0 gap-2"><DomButton size="sm" variant="secondary" :disabled="key.status === 'revoked' || key.status === 'rotating'" @click="openLifecycleDialog('rotate')">Rotate</DomButton><DomButton size="sm" variant="ghost" :disabled="key.status === 'revoked'" @click="openLifecycleDialog('revoke')">Revoke</DomButton></div>
						</div>
					</div>

					<div v-if="key.status === 'rotating'" class="shrink-0 border-b border-warning/30 bg-warning/8 px-4 py-3 sm:px-5">
						<div class="flex flex-wrap items-center justify-between gap-3"><div><p class="text-sm font-semibold">Replacement overlap is active</p><p class="mt-1 text-xs text-muted-fg">Deploy {{ key.rotation.replacementPrefix }} before {{ formatDateTime(key.rotation.overlapEndsAt) }}.</p></div><DomButton size="sm" variant="secondary" @click="openLifecycleDialog('complete')">Complete rotation</DomButton></div>
					</div>

					<DomTabs v-model="activeDetailTab" :tabs="detailTabs" variant="page" class="shrink-0 [&>div:last-child]:hidden" />

					<section class="min-h-0 flex-1 overflow-y-auto">
						<div v-if="activeDetailTab === 'overview'" class="mx-auto max-w-4xl p-4 sm:p-5 lg:p-6">
							<div class="grid grid-cols-2 divide-x divide-border border-y border-border py-3 text-center sm:grid-cols-4">
								<div class="px-2"><p class="text-lg font-semibold">{{ key.requests.toLocaleString() }}</p><p class="text-[10px] text-muted-fg">Requests</p></div>
								<div class="px-2"><p class="text-lg font-semibold">{{ usagePercent }}%</p><p class="text-[10px] text-muted-fg">Plan usage</p></div>
								<div class="border-t border-border px-2 pt-3 sm:border-t-0 sm:pt-0"><p class="text-lg font-semibold">{{ key.errorRate }}%</p><p class="text-[10px] text-muted-fg">Error rate</p></div>
								<div class="border-t border-border px-2 pt-3 sm:border-t-0 sm:pt-0"><p class="text-lg font-semibold">{{ key.scopes.length }}</p><p class="text-[10px] text-muted-fg">Scopes</p></div>
							</div>

							<div class="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
								<div><p class="text-xs font-medium text-muted-fg">Owner</p><p class="mt-1 text-sm font-semibold">{{ ownerLabel(key.ownerId) }}</p></div>
								<div><p class="text-xs font-medium text-muted-fg">Last used</p><p class="mt-1 text-sm font-semibold">{{ formatDateTime(key.lastUsedAt) }}</p></div>
								<div><p class="text-xs font-medium text-muted-fg">Created</p><p class="mt-1 text-sm font-semibold">{{ formatDate(key.createdAt) }}</p></div>
								<div><p class="text-xs font-medium text-muted-fg">Expires</p><p class="mt-1 text-sm font-semibold">{{ formatDate(key.expiresAt) }}</p></div>
								<div class="sm:col-span-2"><p class="text-xs font-medium text-muted-fg">Fingerprint</p><code class="mt-1 block break-all text-sm font-semibold">{{ key.fingerprint }}</code></div>
							</div>

							<div class="mt-7 border-y border-border py-5">
								<div class="flex items-center justify-between gap-3"><div><p class="text-sm font-semibold">Monthly usage</p><p class="mt-1 text-xs text-muted-fg">{{ key.requests.toLocaleString() }} of {{ key.limit.toLocaleString() }} requests</p></div><DomStatusPill :tone="usagePercent > 80 ? 'warning' : 'success'" size="sm">{{ usagePercent > 80 ? 'Watch' : 'Healthy' }}</DomStatusPill></div>
								<DomProgress class="mt-4" :value="usagePercent" label="Monthly request usage" :show-label="false" size="sm" :tone="usagePercent > 80 ? 'warning' : 'primary'" />
							</div>

							<div class="mt-6"><div class="flex items-center justify-between gap-3"><h2 class="text-sm font-semibold">Granted permissions</h2><DomButton size="sm" variant="ghost" @click="activeDetailTab = 'permissions'">Edit permissions</DomButton></div><div class="mt-3 flex flex-wrap gap-2"><DomBadge v-for="scope in selectedScopeCatalog" :key="scope.value" :tone="riskTone(scope.risk)" variant="outline">{{ scope.label }}</DomBadge></div></div>
						</div>

						<div v-else-if="activeDetailTab === 'permissions'" class="mx-auto max-w-4xl p-4 sm:p-5 lg:p-6">
							<div class="flex flex-wrap items-start justify-between gap-3"><div><h2 class="text-xl font-semibold tracking-tight">Permissions</h2><p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">Grant the smallest scope set and bind production credentials to explicit HTTPS origins.</p></div><DomButton data-testid="save-permissions" size="sm" :loading="busy" :disabled="!permissionIsDirty || key.status === 'revoked'" @click="savePermissions">Save permissions</DomButton></div>
							<DomAlert v-if="key.status === 'revoked'" class="mt-5" tone="danger" variant="soft" title="Revoked credential" description="Permissions remain visible as audit evidence but can no longer be edited." />
							<div class="mt-6 grid gap-6 md:grid-cols-2">
								<section v-for="group in groupedScopes" :key="group.name">
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ group.name }}</p>
									<div class="mt-2 divide-y divide-border border-y border-border">
										<DomCheckbox v-for="scope in group.scopes" :key="scope.value" :model-value="permissionDraft.scopes.includes(scope.value)" class="py-3" :label="scope.label" :description="scope.description" :disabled="key.status === 'revoked'" @update:model-value="toggleScope(permissionDraft, scope.value)" />
									</div>
								</section>
							</div>
							<div class="mt-6 border-t border-border pt-5"><DomTagCombobox v-model="permissionDraft.origins" label="Allowed origins" placeholder="Add an origin" allow-custom clearable :disabled="key.status === 'revoked'" :errors="fieldErrors.origins || []" description="Production credentials accept HTTPS origins only." /></div>
							<div v-if="permissionDraft.scopes.includes('keys:admin')" class="mt-5"><DomCheckbox v-model="permissionDraft.adminAcknowledged" label="I confirm this credential can manage other API keys" description="This critical scope can create, rotate, and revoke credentials." :errors="fieldErrors.adminAcknowledged || []" /></div>
							<DomAlert v-if="fieldErrors.scopes?.length" class="mt-5" tone="warning" variant="soft" title="Choose valid scopes" :description="fieldErrors.scopes[0]" />
						</div>

						<div v-else class="mx-auto max-w-4xl p-4 sm:p-5 lg:p-6">
							<div><h2 class="text-xl font-semibold tracking-tight">Activity</h2><p class="mt-1 text-sm text-muted-fg">Credential lifecycle and request evidence retained for {{ bootstrap.policy.auditRetention }}.</p></div>
							<div class="mt-6 divide-y divide-border border-y border-border">
								<div v-for="event in key.events" :key="event.id" class="py-4"><div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-sm font-semibold">{{ event.label }}</p><p class="mt-1 text-sm leading-6 text-muted-fg">{{ event.detail }}</p></div><p class="text-xs text-muted-fg">{{ event.time }}</p></div><p class="mt-2 text-[11px] text-muted-fg">{{ event.actor }}</p></div>
							</div>
						</div>
					</section>
				</main>

				<aside class="min-h-0 w-full shrink-0 flex-col border-l border-border bg-secondary/10 lg:flex lg:w-80" :class="activeMobileView === 'security' ? 'flex' : 'hidden'">
					<div class="min-h-0 flex-1 overflow-y-auto p-4">
						<div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Security posture</p><h2 class="mt-1 text-lg font-semibold">Credential controls</h2></div><DomStatusPill :tone="securityChecks.every((check) => check.passed) ? 'success' : 'warning'" size="sm">{{ securityChecks.filter((check) => check.passed).length }}/{{ securityChecks.length }}</DomStatusPill></div>
						<p class="mt-2 text-sm leading-6 text-muted-fg">Server-owned policy, bounded access, and explicit lifecycle evidence for this credential.</p>
						<div class="mt-5 divide-y divide-border border-y border-border"><div v-for="check in securityChecks" :key="check.label" class="flex items-start justify-between gap-3 py-3"><div><p class="text-sm font-medium">{{ check.label }}</p><p class="mt-1 text-xs text-muted-fg">{{ check.detail }}</p></div><DomStatusPill :tone="check.passed ? 'success' : 'warning'" size="sm">{{ check.passed ? 'Pass' : 'Review' }}</DomStatusPill></div></div>

						<div class="mt-7"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Network boundary</p><div class="mt-2 divide-y divide-border border-y border-border"><div v-for="origin in key.origins" :key="origin" class="break-all py-3 font-mono text-xs">{{ origin }}</div><p v-if="!key.origins.length" class="py-3 text-sm text-muted-fg">No origin restriction configured.</p></div></div>

						<div class="mt-7"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Workspace policy</p><dl class="mt-2 divide-y divide-border border-y border-border text-sm"><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Maximum lifetime</dt><dd class="font-medium">{{ bootstrap.policy.maxLifetimeDays }} days</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Default overlap</dt><dd class="font-medium">{{ bootstrap.policy.rotationOverlapHours }} hours</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Audit retention</dt><dd class="font-medium">{{ bootstrap.policy.auditRetention }}</dd></div></dl></div>

						<div class="mt-7 grid gap-2"><DomButton variant="secondary" :disabled="key.status === 'revoked' || key.status === 'rotating'" @click="openLifecycleDialog('rotate')">Stage a rotation</DomButton><DomButton variant="ghost" :disabled="key.status === 'revoked'" @click="openLifecycleDialog('revoke')">Revoke credential</DomButton></div>
					</div>
				</aside>
			</div>

			<DomDialog v-model="newKeyDialogOpen" width="min(44rem, 94vw)" title="Create API key" description="Set an owner, bounded lifetime, least-privilege scopes, and production network boundary before the server creates secret material.">
				<div class="grid gap-4 sm:grid-cols-2"><DomTextInput v-model="createDraft.name" label="Credential name" placeholder="Application or workload" :errors="fieldErrors.name || []" /><DomSelect v-model="createDraft.environment" label="Environment" :options="bootstrap.options.environments.filter((option) => option.value !== 'all')" :errors="fieldErrors.environment || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="createDraft.ownerId" label="Accountable owner" :options="bootstrap.options.owners" :errors="fieldErrors.ownerId || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="createDraft.lifetimeDays" label="Credential lifetime" :options="bootstrap.options.lifetimes" :errors="fieldErrors.lifetimeDays || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div>
				<div class="mt-5"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Permission scopes</p><div class="mt-2 grid gap-x-5 sm:grid-cols-2"><DomCheckbox v-for="scope in bootstrap.options.scopes" :key="scope.value" :model-value="createDraft.scopes.includes(scope.value)" class="border-b border-border py-3" :label="scope.label" :description="scope.description" @update:model-value="toggleScope(createDraft, scope.value)" /></div><p v-if="fieldErrors.scopes?.length" class="mt-2 text-xs text-destructive">{{ fieldErrors.scopes[0] }}</p></div>
				<div class="mt-5"><DomTagCombobox v-model="createDraft.origins" label="Allowed origins" placeholder="Add an origin" allow-custom clearable :errors="fieldErrors.origins || []" description="Required for production; use the complete HTTPS origin." /></div>
				<div v-if="createDraft.scopes.includes('keys:admin')" class="mt-5"><DomCheckbox v-model="createDraft.adminAcknowledged" label="I confirm this key can manage other credentials" description="The API rejects this critical scope without explicit acknowledgement." :errors="fieldErrors.adminAcknowledged || []" /></div>
				<div class="mt-5 border-y border-border py-4"><DomCheckbox v-model="createDraft.acknowledged" label="I will store the one-time secret securely" description="Only a SHA-256 hash remains on the server after this response." :errors="fieldErrors.acknowledged || []" /></div>
				<template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton data-testid="create-key" :loading="busy" @click="createKey">Create one-time secret</DomButton></template>
			</DomDialog>

			<DomDialog v-model="rotateDialogOpen" width="min(36rem, 94vw)" title="Stage credential rotation" description="Create a replacement secret while the previous credential remains valid for a bounded deployment window.">
				<DomSelect v-model="rotationDraft.overlapHours" label="Overlap window" :options="bootstrap.options.overlaps" :errors="fieldErrors.overlapHours || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
				<div class="mt-4"><DomTextareaInput v-model="rotationDraft.reason" label="Rotation reason" :rows="3" :errors="fieldErrors.reason || []" placeholder="Describe the deploy or security event." /></div>
				<div class="mt-4 border-y border-border py-4"><DomCheckbox v-model="rotationDraft.acknowledged" label="I have a replacement deployment plan" description="The old and replacement credentials remain valid during the overlap." :errors="fieldErrors.acknowledged || []" /></div>
				<template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton data-testid="rotate-key" :loading="busy" @click="rotateKey">Create replacement</DomButton></template>
			</DomDialog>

			<DomDialog v-model="secretDialogOpen" width="min(40rem, 94vw)" title="Copy the one-time secret" description="This full credential exists only in the current API response and is cleared when you close this receipt." :close-button="false">
				<DomAlert tone="warning" variant="soft" title="You cannot reveal this secret again" description="Store it in a secret manager, deploy it to the intended workload, then remove it from local notes and chat." />
				<div class="mt-5"><DomCodeInput :model-value="secretReceipt?.secret || ''" label="Secret value" lang="text" :rows="4" :editor="false" read-only /></div>
				<dl class="mt-5 grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-2"><div><dt class="text-xs text-muted-fg">Fingerprint</dt><dd class="mt-1 break-all font-mono font-medium">{{ secretReceipt?.fingerprint }}</dd></div><div><dt class="text-xs text-muted-fg">Receipt</dt><dd class="mt-1 break-all font-mono font-medium">{{ secretReceipt?.id }}</dd></div></dl>
				<template #footer><DomButton variant="secondary" @click="closeSecretReceipt">I stored it</DomButton><DomButton data-testid="copy-secret" @click="copySecret">Copy secret</DomButton></template>
			</DomDialog>

			<DomDialog v-model="completeRotationDialogOpen" width="min(34rem, 94vw)" title="End the credential overlap?" description="The previous credential stops authorizing requests immediately after this action.">
				<DomAlert tone="info" variant="soft" title="Verify replacement traffic first" :description="`Confirm requests are using ${key.rotation?.replacementPrefix || 'the replacement prefix'} before ending the overlap.`" />
				<div class="mt-5"><DomCheckbox v-model="rotationCompleteAcknowledged" label="Replacement traffic is serving as expected" description="The server records the disabled prefix in the audit trail." :errors="fieldErrors.rotationComplete || []" /></div>
				<template #footer><DomButton variant="secondary" data-close>Keep overlap</DomButton><DomButton data-testid="complete-rotation" :loading="busy" @click="completeRotation">Disable previous key</DomButton></template>
			</DomDialog>

			<DomDialog v-model="revokeDialogOpen" width="min(34rem, 94vw)" title="Revoke API key?" description="Revocation is immediate and cannot be undone. Existing integrations using this credential will fail.">
				<DomTextareaInput v-model="revokeDraft.reason" label="Revocation reason" :rows="3" :errors="fieldErrors.reason || []" placeholder="Record the incident, offboarding, or replacement evidence." />
				<div class="mt-5 border-y border-border py-4"><DomCheckbox v-model="revokeDraft.acknowledged" label="I understand requests will stop working" description="The server requires explicit confirmation and records this operator action." :errors="fieldErrors.acknowledged || []" /></div>
				<template #footer><DomButton variant="secondary" data-close>Keep active</DomButton><DomButton data-testid="revoke-key" variant="danger" :loading="busy" @click="revokeKey">Revoke permanently</DomButton></template>
			</DomDialog>

			<DomDialog v-model="resetDialogOpen" title="Reset the credential workspace?" description="This clears process-local credential changes, receipts, rotations, and revocations, then restores the seeded inventory.">
				<template #footer><DomButton variant="secondary" data-close>Keep workspace</DomButton><DomButton variant="danger" :loading="busy" @click="resetWorkspace">Reset demo</DomButton></template>
			</DomDialog>
		</div>

		<div v-else class="grid h-full place-items-center p-6"><DomAlert tone="danger" title="Credential workspace unavailable" :description="errorMessage || 'The API did not return credential state.'"><template #actions><DomButton variant="secondary" @click="loadWorkspace">Try again</DomButton></template></DomAlert></div>
	</div>
</template>
