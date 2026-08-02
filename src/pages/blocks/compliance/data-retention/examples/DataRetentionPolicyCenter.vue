<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomButton,
	DomCheckbox,
	DomDatePicker,
	DomDialog,
	DomDrawer,
	DomIconButton,
	DomNumberInput,
	DomRangeInput,
	DomSegmentedProgress,
	DomSelect,
	DomStatusPill,
	DomTabs,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const holdIcon = 'M7 10V7a5 5 0 0 1 10 0v3m-11 0h12v11H6V10Z';
const refreshIcon = 'M20 7h-5V2M4 17h5v5M5.5 9A7 7 0 0 1 17 5l3 2M18.5 15A7 7 0 0 1 7 19l-3-2';
const saveIcon = 'M5 4h12l2 2v14H5V4Zm3 0v5h8V4M8 15h8';
const chevronIcon = 'M9 6l6 6-6 6';
const tabs = [
	{ key: 'policy', label: 'Policy' },
	{ key: 'runs', label: 'Run history' },
];

const bootstrap = ref(null);
const workspace = ref(null);
const selectedDataClassId = ref('messages');
const selectedEnvironment = ref('production');
const activeTab = ref('policy');
const draft = ref(createEmptyDraft());
const impactPreview = ref(null);
const loading = ref(true);
const loadingPolicy = ref(false);
const actionBusy = ref(false);
const errorMessage = ref('');
const actionMessage = ref('');
const holdsOpen = ref(false);
const createHoldOpen = ref(false);
const releaseHoldOpen = ref(false);
const publishOpen = ref(false);
const discardOpen = ref(false);
const pendingSelection = ref(null);
const selectedHold = ref(null);
const releaseReason = ref('');
const holdError = ref('');
const publishError = ref('');
const publishAcknowledged = ref(false);
const publication = ref(null);
const holdDraft = ref(createEmptyHoldDraft());

const dataClasses = computed(() => bootstrap.value?.dataClasses || []);
const environmentOptions = computed(() => bootstrap.value?.environments || []);
const actionOptions = computed(() => bootstrap.value?.actionOptions || []);
const basisOptions = computed(() => bootstrap.value?.basisOptions || []);
const currentUser = computed(() => bootstrap.value?.currentUser || {});
const currentDataClass = computed(() => workspace.value?.dataClass || dataClasses.value.find((item) => item.id === selectedDataClassId.value) || {});
const policy = computed(() => workspace.value?.policy || null);
const runs = computed(() => workspace.value?.runs || []);
const activeHolds = computed(() => bootstrap.value?.holds || []);
const currentPreview = computed(() => impactPreview.value || workspace.value?.preview || null);
const dataClassOptions = computed(() => dataClasses.value.map((item) => ({
	value: item.id,
	label: item.name,
	description: `${formatCount(item.recordCount)} records · ${item.owner}`,
})));
const isDirty = computed(() => Boolean(policy.value) && configHash(draft.value) !== configHash(policy.value.config));
const checksPassed = computed(() => Boolean(currentPreview.value?.checks?.every((check) => check.status === 'passed')));
const securityApproved = computed(() => policy.value?.approvedBy?.includes('Security'));
const requiredApprovals = computed(() => policy.value?.requiredApprovals || []);
const canApprove = computed(() => !isDirty.value && policy.value?.status === 'draft' && checksPassed.value && !securityApproved.value);
const canPublish = computed(() => !isDirty.value && policy.value?.status === 'ready' && checksPassed.value);
const heldRecordTotal = computed(() => activeHolds.value.reduce((total, hold) => total + hold.recordCount, 0));
const policyStatusLabel = computed(() => ({ active: 'Active', draft: 'Draft review', ready: 'Ready to publish' }[policy.value?.status] || 'Loading'));
const primaryButtonLabel = computed(() => {
	if (isDirty.value) return 'Save draft';
	if (canApprove.value) return 'Approve draft';
	if (canPublish.value) return 'Publish policy';
	return policy.value?.status === 'active' ? 'Policy active' : 'Review policy';
});

onMounted(loadWorkspace);

/**
 * Creates the initial editable policy form value.
 *
 * @returns {Record<string, unknown>} Empty policy configuration.
 */
function createEmptyDraft() {
	return {
		retentionDays: 365,
		archiveAfterDays: 180,
		action: 'archive-delete',
		legalBasis: 'contract',
		anonymize: true,
		requireApproval: true,
	};
}

/**
 * Creates the initial legal-hold form value.
 *
 * @returns {Record<string, unknown>} Empty legal hold draft.
 */
function createEmptyHoldDraft() {
	return {
		name: '',
		dataClassId: selectedDataClassId.value || 'messages',
		environment: selectedEnvironment.value || 'production',
		recordCount: 1,
		reason: '',
		expiresOn: '',
	};
}

/**
 * Loads workspace navigation followed by the selected retention policy.
 *
 * @returns {Promise<void>}
 */
async function loadWorkspace() {
	loading.value = true;
	errorMessage.value = '';
	try {
		await refreshBootstrap();
		await loadPolicy();
	} catch (error) {
		errorMessage.value = error.message || 'The retention workspace could not be loaded.';
	} finally {
		loading.value = false;
	}
}

/**
 * Refreshes data-class summaries, controls, and active legal holds.
 *
 * @returns {Promise<void>}
 */
async function refreshBootstrap() {
	bootstrap.value = await requestJson('/api/block-demos/data-retention/bootstrap');
}

/**
 * Loads one environment-specific policy, preview, holds, and run history.
 *
 * @returns {Promise<void>}
 */
async function loadPolicy() {
	loadingPolicy.value = true;
	errorMessage.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/data-retention/policies/${selectedDataClassId.value}?environment=${selectedEnvironment.value}`);
		applyWorkspace(payload);
	} catch (error) {
		errorMessage.value = error.message || 'The selected retention policy could not be loaded.';
	} finally {
		loadingPolicy.value = false;
	}
}

/**
 * Applies a policy workspace response and resets the editable form snapshot.
 *
 * @param {Record<string, unknown>} payload Policy workspace payload.
 * @returns {void}
 */
function applyWorkspace(payload) {
	workspace.value = {
		policy: payload.policy,
		dataClass: payload.dataClass,
		preview: payload.preview,
		holds: payload.holds,
		runs: payload.runs,
	};
	draft.value = cloneValue(payload.policy.config);
	impactPreview.value = payload.preview;
}

/**
 * Requests a data-class change while protecting unsaved edits.
 *
 * @param {string} dataClassId Data class identifier.
 * @returns {Promise<void>}
 */
async function requestDataClassChange(dataClassId) {
	if (dataClassId === selectedDataClassId.value) return;
	await requestSelectionChange({ dataClassId, environment: selectedEnvironment.value });
}

/**
 * Requests an environment change while protecting unsaved edits.
 *
 * @param {string} environment Environment identifier.
 * @returns {Promise<void>}
 */
async function requestEnvironmentChange(environment) {
	if (environment === selectedEnvironment.value) return;
	await requestSelectionChange({ dataClassId: selectedDataClassId.value, environment });
}

/**
 * Applies a policy selection immediately or opens the discard confirmation.
 *
 * @param {{dataClassId: string, environment: string}} selection Requested selection.
 * @returns {Promise<void>}
 */
async function requestSelectionChange(selection) {
	if (isDirty.value) {
		pendingSelection.value = selection;
		discardOpen.value = true;
		return;
	}
	await applySelection(selection);
}

/**
 * Discards local edits and applies the pending policy selection.
 *
 * @returns {Promise<void>}
 */
async function confirmDiscard() {
	if (!pendingSelection.value) return;
	const selection = pendingSelection.value;
	pendingSelection.value = null;
	discardOpen.value = false;
	await applySelection(selection);
}

/**
 * Changes the active data class and environment, then loads its policy.
 *
 * @param {{dataClassId: string, environment: string}} selection Requested selection.
 * @returns {Promise<void>}
 */
async function applySelection(selection) {
	selectedDataClassId.value = selection.dataClassId;
	selectedEnvironment.value = selection.environment;
	activeTab.value = 'policy';
	await loadPolicy();
}

/**
 * Restores the saved configuration without making an API request.
 *
 * @returns {void}
 */
function resetDraft() {
	if (!policy.value) return;
	draft.value = cloneValue(policy.value.config);
	impactPreview.value = workspace.value.preview;
	actionMessage.value = 'Unsaved changes were discarded.';
}

/**
 * Calculates impact for the current unsaved configuration.
 *
 * @returns {Promise<void>}
 */
async function calculateImpact() {
	if (actionBusy.value) return;
	actionBusy.value = true;
	errorMessage.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/data-retention/policies/${selectedDataClassId.value}/preview`, {
			method: 'POST',
			body: {
				environment: selectedEnvironment.value,
				config: draft.value,
			},
		});
		impactPreview.value = payload.preview;
		actionMessage.value = payload.message;
	} catch (error) {
		errorMessage.value = error.message || 'The impact preview could not be calculated.';
	} finally {
		actionBusy.value = false;
	}
}

/**
 * Saves the current configuration as a server-owned draft.
 *
 * @returns {Promise<void>}
 */
async function saveDraft() {
	if (!policy.value || actionBusy.value) return;
	actionBusy.value = true;
	errorMessage.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/data-retention/policies/${selectedDataClassId.value}/draft`, {
			method: 'PATCH',
			body: {
				environment: selectedEnvironment.value,
				revision: policy.value.revision,
				config: draft.value,
			},
		});
		applyWorkspace(payload);
		actionMessage.value = payload.message;
		await refreshBootstrap();
	} catch (error) {
		errorMessage.value = error.message || 'The retention draft could not be saved.';
	} finally {
		actionBusy.value = false;
	}
}

/**
 * Records Security approval for the selected saved draft.
 *
 * @returns {Promise<void>}
 */
async function approveDraft() {
	if (!policy.value || actionBusy.value) return;
	actionBusy.value = true;
	errorMessage.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/data-retention/policies/${selectedDataClassId.value}/approve`, {
			method: 'POST',
			body: { environment: selectedEnvironment.value, revision: policy.value.revision },
		});
		applyWorkspace(payload);
		actionMessage.value = payload.message;
		await refreshBootstrap();
	} catch (error) {
		errorMessage.value = error.message || 'The retention draft could not be approved.';
	} finally {
		actionBusy.value = false;
	}
}

/**
 * Opens publication review with a clean acknowledgement and proof state.
 *
 * @returns {void}
 */
function openPublishReview() {
	publishAcknowledged.value = false;
	publishError.value = '';
	publication.value = null;
	publishOpen.value = true;
}

/**
 * Publishes a signed policy version and retains the returned proof.
 *
 * @returns {Promise<void>}
 */
async function publishPolicy() {
	if (!policy.value || actionBusy.value) return;
	if (!publishAcknowledged.value) {
		publishError.value = 'Confirm that you reviewed the deletion impact and legal-hold exclusions.';
		return;
	}
	actionBusy.value = true;
	publishError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/data-retention/policies/${selectedDataClassId.value}/publish`, {
			method: 'POST',
			body: { environment: selectedEnvironment.value, revision: policy.value.revision },
		});
		applyWorkspace(payload);
		publication.value = payload.publication;
		actionMessage.value = payload.message;
		await refreshBootstrap();
	} catch (error) {
		publishError.value = error.message || 'The retention policy could not be published.';
	} finally {
		actionBusy.value = false;
	}
}

/**
 * Resolves the contextual footer action for dirty, approval, and publish states.
 *
 * @returns {Promise<void>}
 */
async function runPrimaryAction() {
	if (isDirty.value) {
		await saveDraft();
		return;
	}
	if (canApprove.value) {
		await approveDraft();
		return;
	}
	if (canPublish.value) openPublishReview();
}

/**
 * Opens the legal-hold creation form with the current policy scope selected.
 *
 * @returns {void}
 */
function openCreateHold() {
	holdDraft.value = {
		...createEmptyHoldDraft(),
		dataClassId: selectedDataClassId.value,
		environment: selectedEnvironment.value,
	};
	holdError.value = '';
	createHoldOpen.value = true;
}

/**
 * Creates a legal hold and refreshes every affected impact summary.
 *
 * @returns {Promise<void>}
 */
async function createHold() {
	if (actionBusy.value) return;
	actionBusy.value = true;
	holdError.value = '';
	try {
		const payload = await requestJson('/api/block-demos/data-retention/holds', {
			method: 'POST',
			body: holdDraft.value,
		});
		actionMessage.value = payload.message;
		createHoldOpen.value = false;
		await refreshBootstrap();
		await loadPolicy();
	} catch (error) {
		holdError.value = error.message || 'The legal hold could not be created.';
	} finally {
		actionBusy.value = false;
	}
}

/**
 * Opens the legal-hold release confirmation for one active hold.
 *
 * @param {Record<string, unknown>} hold Legal hold record.
 * @returns {void}
 */
function openReleaseHold(hold) {
	selectedHold.value = hold;
	releaseReason.value = '';
	holdError.value = '';
	releaseHoldOpen.value = true;
}

/**
 * Releases the selected legal hold and refreshes impact calculations.
 *
 * @returns {Promise<void>}
 */
async function releaseHold() {
	if (!selectedHold.value || actionBusy.value) return;
	actionBusy.value = true;
	holdError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/data-retention/holds/${selectedHold.value.id}/release`, {
			method: 'PATCH',
			body: { revision: selectedHold.value.revision, reason: releaseReason.value },
		});
		actionMessage.value = payload.message;
		releaseHoldOpen.value = false;
		selectedHold.value = null;
		await refreshBootstrap();
		await loadPolicy();
	} catch (error) {
		holdError.value = error.message || 'The legal hold could not be released.';
	} finally {
		actionBusy.value = false;
	}
}

/**
 * Performs a JSON request and surfaces API validation messages.
 *
 * @param {string} url Request URL.
 * @param {{method?: string, body?: Record<string, unknown>}} [options={}] Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed response payload.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		method: options.method || 'GET',
		headers: options.body ? { 'content-type': 'application/json' } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(payload.error || `Request failed with status ${response.status}.`);
	return payload;
}

/**
 * Returns a stable JSON signature for policy equality checks.
 *
 * @param {Record<string, unknown>} config Policy configuration.
 * @returns {string} Stable configuration signature.
 */
function configHash(config) {
	return JSON.stringify({
		retentionDays: Number(config?.retentionDays || 0),
		archiveAfterDays: Number(config?.archiveAfterDays || 0),
		action: String(config?.action || ''),
		legalBasis: String(config?.legalBasis || ''),
		anonymize: Boolean(config?.anonymize),
		requireApproval: Boolean(config?.requireApproval),
	});
}

/**
 * Creates a detached copy of JSON-safe state.
 *
 * @param {unknown} value Serializable value.
 * @returns {unknown} Detached clone.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}

/**
 * Maps policy state to a DOM Studio semantic tone.
 *
 * @param {string} status Policy state.
 * @returns {string} Status pill tone.
 */
function policyTone(status) {
	return { active: 'success', draft: 'warning', ready: 'primary' }[status] || 'neutral';
}

/**
 * Maps risk state to a DOM Studio semantic tone.
 *
 * @param {string} risk Data risk.
 * @returns {string} Status pill tone.
 */
function riskTone(risk) {
	return { high: 'danger', medium: 'warning', low: 'neutral' }[risk] || 'neutral';
}

/**
 * Maps execution state to a DOM Studio semantic tone.
 *
 * @param {string} status Run state.
 * @returns {string} Status pill tone.
 */
function runTone(status) {
	return { complete: 'success', scheduled: 'primary', paused: 'warning', failed: 'danger' }[status] || 'neutral';
}

/**
 * Formats a record count for compact interface copy.
 *
 * @param {number} value Record count.
 * @returns {string} Formatted count.
 */
function formatCount(value) {
	return new Intl.NumberFormat('en-GB', { notation: value >= 100000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(Number(value || 0));
}

/**
 * Formats a byte total with an appropriate binary unit.
 *
 * @param {number} value Byte total.
 * @returns {string} Human-readable size.
 */
function formatBytes(value) {
	const bytes = Number(value || 0);
	if (bytes >= 1000000000) return `${(bytes / 1000000000).toFixed(1)} GB`;
	if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
	return `${bytes} B`;
}

/**
 * Formats an ISO timestamp for policy and job context.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Local date and time.
 */
function formatDateTime(value) {
	if (!value) return 'Not scheduled';
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}

/**
 * Formats a machine value as a readable label.
 *
 * @param {string} value Machine-readable value.
 * @returns {string} Human-readable label.
 */
function titleCase(value) {
	const text = String(value || '').replaceAll('-', ' ').replaceAll('_', ' ');
	return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : '';
}
</script>

<template>
	<div class="flex h-dvh min-h-[40rem] w-full flex-col overflow-hidden bg-canvas text-canvas-fg">
		<header class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-3 sm:px-5">
			<div class="flex min-w-0 items-center gap-3">
				<div class="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-fg">T</div>
				<div class="min-w-0">
					<div class="flex items-center gap-2">
						<h1 class="truncate text-sm font-semibold">Retention control</h1>
						<span class="hidden text-xs text-muted-fg sm:inline">/ {{ bootstrap?.workspace?.name || 'Tempo' }}</span>
					</div>
					<p class="truncate text-[0.68rem] text-muted-fg">Data lifecycle, legal holds, and deletion evidence</p>
				</div>
			</div>

			<div class="flex shrink-0 items-center gap-1.5">
				<DomSelect
					:model-value="selectedEnvironment"
					class="hidden sm:block"
					label="Environment"
					chrome="none"
					:options="environmentOptions"
					width="min-w-[17rem]"
					@update:model-value="requestEnvironmentChange"
				>
					<template #option="{ option }">
						<p class="font-medium">{{ option.label }}</p>
						<p class="mt-1 text-xs opacity-75">{{ option.description }}</p>
					</template>
				</DomSelect>
				<DomIconButton :icon="refreshIcon" label="Refresh policy" size="sm" :loading="loadingPolicy" @click="loadPolicy" />
				<DomButton variant="secondary" size="sm" @click="holdsOpen = true">
					<DomIconButton as="span" :icon="holdIcon" label="" size="xs" class="pointer-events-none -ml-1" aria-hidden="true" />
					<span class="hidden sm:inline">Legal holds</span>
					<span class="sm:hidden">Holds</span>
					<span class="text-muted-fg">{{ activeHolds.length }}</span>
				</DomButton>
			</div>
		</header>

		<section class="shrink-0 border-b border-border p-3 md:hidden">
			<div class="grid grid-cols-2 gap-2">
				<DomSelect
					:model-value="selectedDataClassId"
					label="Data class"
					:options="dataClassOptions"
					width="min-w-[18rem] max-w-[calc(100vw-2rem)]"
					@update:model-value="requestDataClassChange"
				>
					<template #option="{ option }"><p class="font-medium">{{ option.label }}</p><p class="mt-1 text-xs opacity-75">{{ option.description }}</p></template>
				</DomSelect>
				<DomSelect
					:model-value="selectedEnvironment"
					label="Environment"
					:options="environmentOptions"
					width="min-w-[17rem] max-w-[calc(100vw-2rem)]"
					@update:model-value="requestEnvironmentChange"
				>
					<template #option="{ option }"><p class="font-medium">{{ option.label }}</p><p class="mt-1 text-xs opacity-75">{{ option.description }}</p></template>
				</DomSelect>
			</div>
		</section>

		<div class="flex min-h-0 flex-1">
			<aside class="hidden w-[18rem] shrink-0 flex-col border-r border-border bg-secondary/20 md:flex" aria-label="Data classes">
				<div class="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Data classes</p>
					<span class="text-xs text-muted-fg">{{ dataClasses.length }}</span>
				</div>
				<nav class="min-h-0 flex-1 overflow-y-auto">
					<button
						v-for="item in dataClasses"
						:key="item.id"
						type="button"
						class="group w-full border-b border-border px-4 py-3 text-left transition hover:bg-canvas/70"
						:class="selectedDataClassId === item.id ? 'bg-canvas shadow-[inset_3px_0_0_var(--primary)]' : ''"
						@click="requestDataClassChange(item.id)"
					>
						<div class="flex items-start gap-3">
							<DomIconButton as="span" :icon="item.icon" label="" size="xs" class="pointer-events-none mt-0.5" aria-hidden="true" />
							<div class="min-w-0 flex-1">
								<div class="flex items-center justify-between gap-2">
									<p class="truncate text-sm font-semibold">{{ item.name }}</p>
									<DomStatusPill :tone="policyTone(item.status)" :label="titleCase(item.status)" size="sm" :dot="false" />
								</div>
								<p class="mt-1 line-clamp-2 text-xs leading-5 text-muted-fg">{{ item.description }}</p>
								<div class="mt-2 flex items-center gap-2 text-[0.68rem] text-muted-fg">
									<span>{{ formatCount(item.recordCount) }} records</span>
									<span>·</span>
									<span>{{ item.owner }}</span>
									<span v-if="item.holdCount">· {{ item.holdCount }} held</span>
								</div>
							</div>
						</div>
					</button>
				</nav>
				<div class="border-t border-border p-4">
					<p class="text-xs font-medium">{{ formatCount(heldRecordTotal) }} records protected</p>
					<p class="mt-1 text-[0.68rem] text-muted-fg">Across {{ activeHolds.length }} active legal holds</p>
				</div>
			</aside>

			<main class="flex min-w-0 flex-1 flex-col overflow-hidden">
				<div v-if="loading" class="grid min-h-0 flex-1 place-items-center text-sm text-muted-fg">Loading retention policies…</div>

				<template v-else>
					<section class="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<h2 class="truncate text-base font-semibold">{{ currentDataClass.name }}</h2>
								<DomStatusPill :tone="policyTone(policy?.status)" :label="policyStatusLabel" size="sm" />
								<DomStatusPill :tone="riskTone(currentDataClass.risk)" :label="`${titleCase(currentDataClass.risk)} risk`" size="sm" :dot="false" />
							</div>
							<p class="mt-1 truncate text-xs text-muted-fg">Version {{ policy?.version }} · {{ currentDataClass.owner }} · updated by {{ policy?.updatedBy }}</p>
						</div>
						<div class="flex shrink-0 items-center gap-2 text-xs text-muted-fg">
							<span>{{ formatCount(currentDataClass.recordCount) }} records</span>
							<span>·</span>
							<span>Next run {{ formatDateTime(policy?.nextRunAt) }}</span>
						</div>
					</section>

					<DomAlert v-if="errorMessage" class="mx-3 mt-3 shrink-0" tone="danger" title="Retention policy needs attention" :description="errorMessage" />
					<DomAlert v-if="actionMessage" class="mx-3 mt-3 shrink-0" tone="success" title="Retention workspace updated" :description="actionMessage" dismissible @dismiss="actionMessage = ''" />

					<DomTabs v-model="activeTab" :tabs="tabs" variant="page" fill>
						<template #policy>
							<div class="min-h-0 flex-1 overflow-y-auto">
								<section class="border-b border-border px-4 py-4 sm:px-5">
									<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
										<div>
											<p class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-fg">Current impact</p>
											<h3 class="mt-1 text-sm font-semibold">Where records go in the next lifecycle window</h3>
										</div>
										<DomButton variant="secondary" size="sm" :loading="actionBusy" @click="calculateImpact">Calculate impact</DomButton>
									</div>
									<DomSegmentedProgress
										v-if="currentPreview"
										class="mt-4"
										:segments="currentPreview.segments"
										:value="currentPreview.eligibleRecords"
										:max="currentPreview.totalRecords"
										label="records evaluated"
										size="lg"
									/>
									<div v-if="currentPreview" class="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-3 text-xs sm:grid-cols-4">
										<div><p class="text-muted-fg">Deletion eligible</p><p class="mt-1 font-semibold">{{ formatCount(currentPreview.deleteEligible) }}</p></div>
										<div><p class="text-muted-fg">Protected by holds</p><p class="mt-1 font-semibold text-warning">{{ formatCount(currentPreview.holdProtected) }}</p></div>
										<div><p class="text-muted-fg">Storage affected</p><p class="mt-1 font-semibold">{{ formatBytes(currentPreview.estimatedBytes) }}</p></div>
										<div><p class="text-muted-fg">First run</p><p class="mt-1 font-semibold">{{ formatDateTime(currentPreview.firstRunAt) }}</p></div>
									</div>
								</section>

								<section class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
									<div class="px-4 py-5 sm:px-5 lg:border-r lg:border-border">
										<div class="grid gap-6 sm:grid-cols-2">
											<DomRangeInput v-model="draft.retentionDays" label="Retention window" description="How long records remain available before final lifecycle action." :min="30" :max="1095" :step="30" suffix=" days" />
											<DomRangeInput v-model="draft.archiveAfterDays" label="Archive after" description="When eligible records move out of primary storage." :min="30" :max="Math.max(30, Number(draft.retentionDays) - 30)" :step="30" suffix=" days" />
											<DomSelect v-model="draft.action" label="Lifecycle action" :options="actionOptions" width="min-w-[20rem] max-w-[calc(100vw-3rem)]">
												<template #option="{ option }"><p class="font-medium">{{ option.label }}</p><p class="mt-1 text-xs opacity-75">{{ option.description }}</p></template>
											</DomSelect>
											<DomSelect v-model="draft.legalBasis" label="Legal basis" :options="basisOptions" width="min-w-[20rem] max-w-[calc(100vw-3rem)]">
												<template #option="{ option }"><p class="font-medium">{{ option.label }}</p><p class="mt-1 text-xs opacity-75">{{ option.description }}</p></template>
											</DomSelect>
										</div>
										<div class="mt-5 grid gap-4 border-y border-border py-4 sm:grid-cols-2">
											<DomToggle v-model="draft.anonymize" label="Anonymize personal fields" description="Remove personal identifiers before permanent deletion." />
											<DomToggle v-model="draft.requireApproval" label="Require Legal and Security approval" description="Block publication until both control owners approve." />
										</div>
									</div>

									<aside class="border-t border-border px-4 py-5 sm:px-5 lg:border-t-0" aria-label="Policy safety checks">
										<div class="flex items-center justify-between gap-3">
											<h3 class="text-sm font-semibold">Safety checks</h3>
											<DomStatusPill :tone="checksPassed ? 'success' : 'warning'" :label="checksPassed ? 'All passed' : 'Review needed'" size="sm" />
										</div>
										<div class="mt-4 divide-y divide-border border-y border-border">
											<div v-for="check in currentPreview?.checks || []" :key="check.id" class="py-3">
												<div class="flex items-center justify-between gap-3">
													<p class="text-xs font-medium">{{ check.label }}</p>
													<DomStatusPill :tone="check.status === 'passed' ? 'success' : 'warning'" :label="titleCase(check.status)" size="sm" />
												</div>
												<p class="mt-1 text-[0.68rem] leading-5 text-muted-fg">{{ check.detail }}</p>
											</div>
										</div>
										<div class="mt-4">
											<p class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-fg">Approvals</p>
											<div class="mt-2 flex flex-wrap gap-2">
												<DomStatusPill
													v-for="role in requiredApprovals"
													:key="role"
													:tone="policy?.approvedBy?.includes(role) ? 'success' : 'warning'"
													:label="`${role} ${policy?.approvedBy?.includes(role) ? 'approved' : 'pending'}`"
													size="sm"
												/>
												<span v-if="!requiredApprovals.length" class="text-xs text-muted-fg">Approval not required</span>
											</div>
										</div>
									</aside>
								</section>
							</div>
						</template>

						<template #runs>
							<div class="min-h-0 flex-1 overflow-y-auto">
								<div class="border-b border-border px-4 py-4 sm:px-5">
									<h3 class="text-sm font-semibold">Policy and lifecycle activity</h3>
									<p class="mt-1 text-xs text-muted-fg">Every calculation, approval, published version, and job state for this data class.</p>
								</div>
								<div class="divide-y divide-border">
									<div v-for="run in runs" :key="run.id" class="grid gap-3 px-4 py-4 sm:grid-cols-[9rem_minmax(0,1fr)_8rem] sm:items-center sm:px-5">
										<div>
											<p class="text-xs font-medium">{{ formatDateTime(run.startedAt) }}</p>
											<p class="mt-1 font-mono text-[0.65rem] text-muted-fg">{{ run.id }}</p>
										</div>
										<div class="min-w-0">
											<p class="truncate text-sm font-semibold">{{ run.label }}</p>
											<p class="mt-1 text-xs leading-5 text-muted-fg">{{ run.detail }}</p>
										</div>
										<DomStatusPill :tone="runTone(run.status)" :label="titleCase(run.status)" size="sm" />
									</div>
								</div>
							</div>
						</template>
					</DomTabs>

					<footer class="flex shrink-0 flex-col gap-3 border-t border-border bg-canvas px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
						<div class="min-w-0">
							<p class="text-xs font-medium">
								{{ isDirty ? 'Unsaved policy changes' : policy?.status === 'active' ? `Version ${policy.version} is active` : policyStatusLabel }}
							</p>
							<p class="mt-1 truncate text-[0.68rem] text-muted-fg">
								{{ isDirty ? 'Calculate impact, then save this policy draft.' : `Revision ${policy?.revision} · next run ${formatDateTime(policy?.nextRunAt)}` }}
							</p>
						</div>
						<div class="flex items-center justify-end gap-2">
							<DomButton v-if="isDirty" variant="ghost" size="sm" @click="resetDraft">Discard</DomButton>
							<DomButton v-if="isDirty" variant="secondary" size="sm" :loading="actionBusy" @click="calculateImpact">Calculate</DomButton>
							<DomButton
								size="sm"
								:variant="isDirty || canApprove || canPublish ? 'primary' : 'secondary'"
								:disabled="!isDirty && !canApprove && !canPublish"
								:loading="actionBusy"
								@click="runPrimaryAction"
							>
								<DomIconButton v-if="isDirty" as="span" :icon="saveIcon" label="" size="xs" class="pointer-events-none -ml-1" aria-hidden="true" />
								{{ primaryButtonLabel }}
							</DomButton>
						</div>
					</footer>
				</template>
			</main>
		</div>

		<DomDrawer v-model="holdsOpen" title="Legal holds" side="right" width="min(94vw, 34rem)">
			<div class="p-4 sm:p-5">
				<div class="flex items-start justify-between gap-4 border-b border-border pb-4">
					<div>
						<p class="text-sm font-semibold">{{ activeHolds.length }} active holds</p>
						<p class="mt-1 text-xs leading-5 text-muted-fg">{{ formatCount(heldRecordTotal) }} records are excluded from matching deletion jobs.</p>
					</div>
					<DomButton size="sm" @click="openCreateHold">Add legal hold</DomButton>
				</div>

				<div class="divide-y divide-border">
					<div v-for="hold in activeHolds" :key="hold.id" class="py-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<p class="text-sm font-semibold">{{ hold.name }}</p>
									<DomStatusPill tone="warning" :label="hold.expiresOn ? `Until ${hold.expiresOn}` : 'No expiry'" size="sm" />
								</div>
								<p class="mt-2 text-xs leading-5 text-muted-fg">{{ hold.reason }}</p>
								<p class="mt-2 text-xs"><span class="font-medium">{{ hold.dataClassName }}</span> · {{ formatCount(hold.recordCount) }} records · {{ titleCase(hold.environment) }}</p>
							</div>
							<DomButton variant="ghost" size="sm" @click="openReleaseHold(hold)">Release</DomButton>
						</div>
					</div>
				</div>
			</div>
		</DomDrawer>

		<DomDialog v-model="createHoldOpen" title="Add legal hold" description="Protect matching records from archive and deletion jobs until the hold is released." size="lg">
			<DomAlert v-if="holdError" class="mb-4" tone="danger" title="Legal hold needs attention" :description="holdError" />
			<div class="grid gap-5 sm:grid-cols-2">
				<DomTextInput v-model="holdDraft.name" class="sm:col-span-2" label="Hold name" placeholder="e.g. Contract dispute evidence" />
				<DomSelect v-model="holdDraft.dataClassId" label="Data class" :options="dataClassOptions" width="min-w-[18rem] max-w-[calc(100vw-4rem)]" />
				<DomSelect v-model="holdDraft.environment" label="Environment" :options="environmentOptions" width="min-w-[17rem] max-w-[calc(100vw-4rem)]" />
				<DomNumberInput v-model="holdDraft.recordCount" label="Records in scope" :min="1" />
				<DomDatePicker v-model="holdDraft.expiresOn" label="Expiry date" description="Leave blank for an indefinite hold." />
				<DomTextInput v-model="holdDraft.reason" class="sm:col-span-2" label="Preservation reason" placeholder="Explain why deletion must be suspended" />
			</div>
			<template #footer>
				<DomButton variant="secondary" @click="createHoldOpen = false">Cancel</DomButton>
				<DomButton :loading="actionBusy" @click="createHold">Create hold</DomButton>
			</template>
		</DomDialog>

		<DomDialog v-model="releaseHoldOpen" :title="selectedHold ? `Release ${selectedHold.name}` : 'Release legal hold'" description="Released records become eligible for the next matching lifecycle run." size="sm">
			<DomAlert v-if="holdError" class="mb-4" tone="danger" title="Hold was not released" :description="holdError" />
			<DomTextInput v-model="releaseReason" label="Release reason" placeholder="e.g. Investigation closed" />
			<template #footer>
				<DomButton variant="secondary" @click="releaseHoldOpen = false">Cancel</DomButton>
				<DomButton variant="danger" :loading="actionBusy" @click="releaseHold">Release hold</DomButton>
			</template>
		</DomDialog>

		<DomDialog v-model="publishOpen" title="Publish retention policy" description="Create a signed policy version and schedule its first lifecycle run." size="lg">
			<div v-if="!publication" class="space-y-5">
				<DomAlert v-if="publishError" tone="danger" title="Policy cannot be published" :description="publishError" />
				<div class="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
					<div class="bg-canvas p-4"><p class="text-xs text-muted-fg">Version</p><p class="mt-1 font-semibold">{{ policy?.version }} → {{ (policy?.version || 0) + 1 }}</p></div>
					<div class="bg-canvas p-4"><p class="text-xs text-muted-fg">Deletion eligible</p><p class="mt-1 font-semibold">{{ formatCount(currentPreview?.deleteEligible) }}</p></div>
					<div class="bg-canvas p-4"><p class="text-xs text-muted-fg">Protected by holds</p><p class="mt-1 font-semibold text-warning">{{ formatCount(currentPreview?.holdProtected) }}</p></div>
				</div>
				<div class="border-y border-border py-4">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Approval evidence</p>
					<div class="mt-3 flex flex-wrap gap-2">
						<DomStatusPill v-for="role in requiredApprovals" :key="role" :tone="policy?.approvedBy?.includes(role) ? 'success' : 'warning'" :label="`${role} ${policy?.approvedBy?.includes(role) ? 'approved' : 'pending'}`" size="sm" />
					</div>
				</div>
				<DomCheckbox v-model="publishAcknowledged" label="I reviewed the deletion impact and legal-hold exclusions" description="The acknowledgement is included in the signed policy publication evidence." />
			</div>
			<DomAlert v-else tone="success" title="Policy version published" :description="`Version ${publication.version} is active · first run ${formatDateTime(publication.nextRunAt)}`">
				<template #actions>
					<div class="mt-3 space-y-1 font-mono text-xs">
						<p>{{ publication.policyId }}</p>
						<p class="break-all text-muted-fg">{{ publication.checksum }}</p>
					</div>
				</template>
			</DomAlert>
			<template #footer>
				<DomButton variant="secondary" @click="publishOpen = false">{{ publication ? 'Close' : 'Cancel' }}</DomButton>
				<DomButton v-if="!publication" :loading="actionBusy" @click="publishPolicy">Publish version {{ (policy?.version || 0) + 1 }}</DomButton>
			</template>
		</DomDialog>

		<DomDialog v-model="discardOpen" title="Discard unsaved policy changes?" description="Your saved draft remains unchanged." size="sm">
			<p class="text-sm leading-6 text-muted-fg">Switching data class or environment will replace the values currently in the editor.</p>
			<template #footer>
				<DomButton variant="secondary" @click="discardOpen = false; pendingSelection = null">Keep editing</DomButton>
				<DomButton variant="danger" @click="confirmDiscard">Discard and switch</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
