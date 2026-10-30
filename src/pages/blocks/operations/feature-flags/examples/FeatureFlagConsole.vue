<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomAppBottomNav,
	DomAppListItem,
	DomAppShell,
	DomAppTopBar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomEmptyState,
	DomJsonViewer,
	DomRangeInput,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/feature-flags';
const evidenceTabs = [
	{ key: 'release', label: 'Release' },
	{ key: 'history', label: 'History' },
];

const workspace = ref(null);
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const activeView = ref('targeting');
const evidenceTab = ref('release');
const flagSearch = ref('');
const draftEnabled = ref(true);
const draftRollout = ref(32);
const draftSegmentId = ref('beta_scale_eu');
const draftAttribute = ref('workspace_age_days');
const draftOperator = ref('greater_than');
const draftValue = ref('14');
const draftReason = ref('Expand after checkout guardrails stayed healthy.');
const approvalAcknowledged = ref(false);
const approvalNote = ref('Guardrails and rollback evidence reviewed.');
const publishAcknowledged = ref(false);
const rollbackAcknowledged = ref(false);
const contextKey = ref('northstar-workspace-42');
const contextSegmentId = ref('beta_scale_eu');
const contextRegion = ref('eu-west');
const evaluatePreview = ref(true);
const createDialogOpen = ref(false);
const createName = ref('Regional invoices');
const createKey = ref('billing.regional_invoices');
const createDescription = ref('Enable regional invoice numbering for selected workspaces.');
const createOwnerId = ref('admin');
const createType = ref('release');

const selectedFlag = computed(() => workspace.value?.selectedFlag || null);
const config = computed(() => selectedFlag.value?.config || null);
const filteredFlags = computed(getFilteredFlags);
const mobileNavigation = computed(getMobileNavigation);
const evidencePayload = computed(getEvidencePayload);
const selectedSegment = computed(() => workspace.value?.catalogs?.segments?.find((option) => option.value === draftSegmentId.value) || null);

onMounted(loadWorkspace);

/**
 * Loads the complete feature-release workspace from the repository-local API.
 *
 * @param {boolean} clearMessages Whether visible feedback should be cleared first.
 * @returns {Promise<void>}
 */
async function loadWorkspace(clearMessages = true) {
	if (clearMessages) clearFeedback();
	loading.value = true;
	try {
		const response = await fetch(`${apiBase}/bootstrap`);
		const data = await response.json();
		if (!response.ok) throw createRequestError(data, response.status);
		setWorkspace(data);
	} catch (requestError) {
		error.value = requestError.message || 'Unable to load the feature release workspace.';
	} finally {
		loading.value = false;
	}
}

/**
 * Sends one JSON mutation and applies its authoritative workspace response.
 *
 * @param {string} path API path below the feature-flags base URL.
 * @param {Record<string, unknown>} body JSON request body.
 * @param {string} action Stable busy-state key.
 * @returns {Promise<object|null>} Updated workspace or null after failure.
 */
async function mutateWorkspace(path, body, action) {
	clearFeedback();
	busyAction.value = action;
	try {
		const response = await fetch(`${apiBase}${path}`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body),
		});
		const data = await response.json();
		if (!response.ok) throw createRequestError(data, response.status);
		setWorkspace(data);
		return data;
	} catch (requestError) {
		error.value = requestError.message || 'Feature release action failed.';
		if (requestError.status === 409) await refreshAfterConflict();
		return null;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Reloads authoritative server state after an exact-revision conflict.
 *
 * @returns {Promise<void>}
 */
async function refreshAfterConflict() {
	try {
		const response = await fetch(`${apiBase}/bootstrap`);
		const data = await response.json();
		if (response.ok) setWorkspace(data);
	} catch {
		// Preserve the original conflict message when recovery also fails.
	}
}

/**
 * Replaces client state and aligns the editable draft with API evidence.
 *
 * @param {object} data Authoritative feature-release workspace.
 * @returns {void}
 */
function setWorkspace(data) {
	workspace.value = data;
	const source = data.preview?.draft || data.selectedFlag?.config;
	if (source) setDraft(source);
	if (!data.preview) {
		approvalAcknowledged.value = false;
		publishAcknowledged.value = false;
		evaluatePreview.value = false;
	}
	if (!data.rollbackPreview) rollbackAcknowledged.value = false;
}

/**
 * Copies a live or previewed configuration into the release editor.
 *
 * @param {object} source Configuration fields.
 * @returns {void}
 */
function setDraft(source) {
	draftEnabled.value = Boolean(source.enabled);
	draftRollout.value = Number(source.rollout || 0);
	draftSegmentId.value = source.audienceSegmentId || 'internal';
	draftAttribute.value = source.rule?.attribute || 'plan';
	draftOperator.value = source.rule?.operator || 'is_one_of';
	draftValue.value = source.rule?.value || 'Scale';
	if (source.reason) draftReason.value = source.reason;
}

/**
 * Selects one flag while preserving exact workspace state.
 *
 * @param {string} flagId Feature flag identifier.
 * @returns {Promise<void>}
 */
async function selectFlag(flagId) {
	if (!workspace.value || flagId === workspace.value.selectedFlagId || busyAction.value) return;
	const data = await mutateWorkspace('/select', {
		revision: workspace.value.revision,
		flagId,
		environmentId: workspace.value.selectedEnvironmentId,
	}, 'select-flag');
	if (data) {
		activeView.value = 'targeting';
		evidenceTab.value = 'release';
		notice.value = `${data.selectedFlag.key} opened at configuration version ${data.selectedFlag.config.version}.`;
	}
}

/**
 * Selects one environment through the server-owned workspace context.
 *
 * @param {string} environmentId Environment identifier.
 * @returns {Promise<void>}
 */
async function selectEnvironment(environmentId) {
	if (!workspace.value || environmentId === workspace.value.selectedEnvironmentId || busyAction.value) return;
	const data = await mutateWorkspace('/select', {
		revision: workspace.value.revision,
		flagId: workspace.value.selectedFlagId,
		environmentId,
	}, 'select-environment');
	if (data) notice.value = `${data.selectedFlag.name} switched to ${environmentLabel(environmentId)}.`;
}

/**
 * Keeps disabled flags at zero traffic and gives enabled drafts a safe starting percentage.
 *
 * @param {boolean} enabled Next serving state.
 * @returns {void}
 */
function updateEnabledDraft(enabled) {
	draftEnabled.value = Boolean(enabled);
	if (!draftEnabled.value) draftRollout.value = 0;
	else if (draftRollout.value === 0) draftRollout.value = 10;
}

/**
 * Restores the editor to the current live configuration.
 *
 * @returns {void}
 */
function restoreLiveDraft() {
	if (!config.value) return;
	setDraft(config.value);
	clearFeedback();
	notice.value = 'The editor now matches the live configuration.';
}

/**
 * Previews the rollout, audience, and rule changes through the API.
 *
 * @returns {Promise<void>}
 */
async function previewChange() {
	if (!workspace.value || !selectedFlag.value || !config.value) return;
	const data = await mutateWorkspace('/changes/preview', {
		revision: workspace.value.revision,
		flagId: selectedFlag.value.id,
		environmentId: workspace.value.selectedEnvironmentId,
		flagVersion: config.value.version,
		enabled: draftEnabled.value,
		rollout: draftRollout.value,
		audienceSegmentId: draftSegmentId.value,
		attribute: draftAttribute.value,
		operator: draftOperator.value,
		value: draftValue.value,
		reason: draftReason.value,
	}, 'preview-change');
	if (data) {
		activeView.value = 'release';
		evidenceTab.value = 'release';
		notice.value = `${data.preview.checksum} locks ${data.preview.changes.length} proposed changes and ${formatNumber(data.preview.estimatedContexts)} estimated contexts.`;
	}
}

/**
 * Requests production approval for the current immutable preview.
 *
 * @returns {Promise<void>}
 */
async function requestApproval() {
	if (!workspace.value?.preview) return;
	const data = await mutateWorkspace('/approvals', {
		revision: workspace.value.revision,
		previewId: workspace.value.preview.id,
		acknowledged: approvalAcknowledged.value,
	}, 'request-approval');
	if (data) notice.value = `${data.approval.id} was routed to ${data.approval.reviewer}.`;
}

/**
 * Records the simulated independent release manager's decision.
 *
 * @param {'approved'|'rejected'} decision Approval decision.
 * @returns {Promise<void>}
 */
async function decideApproval(decision) {
	if (!workspace.value?.approval) return;
	const data = await mutateWorkspace(`/approvals/${workspace.value.approval.id}/decision`, {
		revision: workspace.value.revision,
		decision,
		note: approvalNote.value,
	}, `approval-${decision}`);
	if (data) notice.value = `${data.approval.reviewer} ${decision} ${data.approval.checksum}.`;
}

/**
 * Publishes the acknowledged and approved release preview.
 *
 * @returns {Promise<void>}
 */
async function publishChange() {
	if (!workspace.value?.preview) return;
	const data = await mutateWorkspace('/publish', {
		revision: workspace.value.revision,
		previewId: workspace.value.preview.id,
		checksum: workspace.value.preview.checksum,
		acknowledged: publishAcknowledged.value,
	}, 'publish-change');
	if (data) notice.value = `${data.publishReceipt.id} reached ${data.publishReceipt.evaluatorsAcknowledged} evaluators and entered monitoring.`;
}

/**
 * Advances the deterministic post-release monitoring window.
 *
 * @returns {Promise<void>}
 */
async function advanceMonitoring() {
	if (!workspace.value || !selectedFlag.value || !config.value) return;
	const data = await mutateWorkspace('/monitoring/advance', currentContext(), 'advance-monitoring');
	if (data) notice.value = `${data.monitoringReceipt.id} completed the ${data.monitoringReceipt.window} monitoring window.`;
}

/**
 * Evaluates a test context against the live or current preview configuration.
 *
 * @returns {Promise<void>}
 */
async function evaluateContext() {
	if (!workspace.value) return;
	const data = await mutateWorkspace('/evaluations', {
		revision: workspace.value.revision,
		contextKey: contextKey.value,
		segmentId: contextSegmentId.value,
		region: contextRegion.value,
		usePreview: evaluatePreview.value,
	}, 'evaluate-context');
	if (data) notice.value = `${data.evaluation.receipt} served ${data.evaluation.variation} from ${data.evaluation.configuration.toLowerCase()} targeting.`;
}

/**
 * Creates a rollback preview from the latest published restore point.
 *
 * @returns {Promise<void>}
 */
async function previewRollback() {
	if (!workspace.value || !selectedFlag.value || !config.value) return;
	const data = await mutateWorkspace('/rollbacks/preview', currentContext(), 'preview-rollback');
	if (data) notice.value = `${data.rollbackPreview.checksum} locks the restore from ${data.rollbackPreview.current.rollout}% to ${data.rollbackPreview.restore.rollout}%.`;
}

/**
 * Restores the exact previous configuration after acknowledgement.
 *
 * @returns {Promise<void>}
 */
async function rollbackChange() {
	if (!workspace.value?.rollbackPreview) return;
	const data = await mutateWorkspace('/rollbacks', {
		revision: workspace.value.revision,
		previewId: workspace.value.rollbackPreview.id,
		checksum: workspace.value.rollbackPreview.checksum,
		acknowledged: rollbackAcknowledged.value,
	}, 'rollback-change');
	if (data) notice.value = `${data.rollbackReceipt.id} restored the prior configuration and entered monitoring.`;
}

/**
 * Creates a disabled flag and selects its production configuration.
 *
 * @returns {Promise<void>}
 */
async function createFlag() {
	if (!workspace.value) return;
	const data = await mutateWorkspace('/flags', {
		revision: workspace.value.revision,
		name: createName.value,
		key: createKey.value,
		description: createDescription.value,
		ownerId: createOwnerId.value,
		type: createType.value,
	}, 'create-flag');
	if (data) {
		createDialogOpen.value = false;
		activeView.value = 'targeting';
		notice.value = `${data.createReceipt.id} created ${data.createReceipt.flagKey} disabled in every environment.`;
	}
}

/**
 * Restores all feature-release demo state.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	const data = await mutateWorkspace('/reset', {}, 'reset-workspace');
	if (data) {
		activeView.value = 'targeting';
		evidenceTab.value = 'release';
		notice.value = `Demo reset to workspace revision ${data.revision}.`;
	}
}

/**
 * Returns exact context fields required by configuration mutations.
 *
 * @returns {object} Current workspace, flag, environment, and configuration revisions.
 */
function currentContext() {
	return {
		revision: workspace.value.revision,
		flagId: selectedFlag.value.id,
		environmentId: workspace.value.selectedEnvironmentId,
		flagVersion: config.value.version,
	};
}

/**
 * Filters flag inventory rows against name, key, and owner.
 *
 * @returns {Array<object>} Visible feature flags.
 */
function getFilteredFlags() {
	const query = flagSearch.value.trim().toLowerCase();
	const flags = workspace.value?.flags || [];
	if (!query) return flags;
	return flags.filter((flag) => [flag.name, flag.key, flag.owner].some((value) => String(value).toLowerCase().includes(query)));
}

/**
 * Builds narrow-screen primary navigation with useful workflow badges.
 *
 * @returns {Array<object>} Bottom navigation items.
 */
function getMobileNavigation() {
	return [
		{ value: 'flags', label: 'Flags', badge: workspace.value?.flags?.length ? String(workspace.value.flags.length) : '' },
		{ value: 'targeting', label: 'Targeting' },
		{ value: 'release', label: 'Release', badge: workspace.value?.approval?.status === 'pending' ? '1' : workspace.value?.preview ? '•' : '' },
	];
}

/**
 * Builds the latest immutable evidence payload for JSON inspection.
 *
 * @returns {object} Current release, monitoring, rollback, and evaluation proof.
 */
function getEvidencePayload() {
	if (!workspace.value) return {};
	return {
		workspaceRevision: workspace.value.revision,
		flagKey: selectedFlag.value?.key,
		environment: workspace.value.selectedEnvironmentId,
		configurationVersion: config.value?.version,
		preview: workspace.value.preview ? {
			id: workspace.value.preview.id,
			checksum: workspace.value.preview.checksum,
			sourceVersion: workspace.value.preview.sourceVersion,
		} : null,
		approval: workspace.value.approval,
		publication: workspace.value.publishReceipt,
		monitoring: workspace.value.monitoringReceipt,
		rollback: workspace.value.rollbackReceipt,
		evaluation: workspace.value.evaluation,
	};
}

/**
 * Resolves a semantic status tone.
 *
 * @param {string} status Release or check status.
 * @returns {string} DOM Studio semantic tone.
 */
function statusTone(status) {
	return {
		healthy: 'success',
		passed: 'success',
		approved: 'success',
		monitoring: 'primary',
		pending: 'warning',
		warning: 'warning',
		watch: 'warning',
		breach: 'danger',
		rejected: 'danger',
		paused: 'neutral',
		draft: 'neutral',
	}[status] || 'neutral';
}

/**
 * Formats a machine status as readable label text.
 *
 * @param {unknown} value Machine status.
 * @returns {string} Human-readable status.
 */
function statusLabel(value) {
	const text = String(value || 'unknown').replaceAll('-', ' ');
	return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Resolves an environment label from the server catalog.
 *
 * @param {string} environmentId Environment identifier.
 * @returns {string} Human-readable environment label.
 */
function environmentLabel(environmentId) {
	return workspace.value?.catalogs?.environments?.find((option) => option.value === environmentId)?.label || environmentId;
}

/**
 * Formats a number for compact operational evidence.
 *
 * @param {unknown} value Numeric value.
 * @returns {string} Locale-formatted number.
 */
function formatNumber(value) {
	return new Intl.NumberFormat('en-GB').format(Number(value || 0));
}

/**
 * Clears visible success and error feedback.
 *
 * @returns {void}
 */
function clearFeedback() {
	error.value = '';
	notice.value = '';
}

/**
 * Creates an Error with the originating HTTP status attached.
 *
 * @param {object} data API response payload.
 * @param {number} status HTTP status code.
 * @returns {Error & {status?: number}} Request error.
 */
function createRequestError(data, status) {
	const requestError = new Error(data?.error || `Request failed with status ${status}.`);
	requestError.status = status;
	return requestError;
}
</script>

<template>
	<DomAppShell class="!h-dvh">
		<template #top>
			<DomAppTopBar
				title="Release control"
				:subtitle="workspace && selectedFlag ? `${selectedFlag.name} · ${environmentLabel(workspace.selectedEnvironmentId)}` : 'Feature flags'"
			>
				<template #leading>
					<div class="grid size-9 place-items-center rounded-xl bg-primary text-xs font-bold text-primary-fg">RC</div>
				</template>
				<template #trailing>
					<DomBadge v-if="workspace" tone="neutral" size="sm" class="hidden sm:inline-flex">r{{ workspace.revision }}</DomBadge>
					<DomButton class="hidden sm:inline-flex" size="sm" variant="secondary" :loading="busyAction === 'reset-workspace'" @click="resetWorkspace">Reset</DomButton>
					<DomButton class="hidden sm:inline-flex" size="sm" @click="createDialogOpen = true">Create flag</DomButton>
				</template>
			</DomAppTopBar>
		</template>

		<div v-if="loading" class="grid min-h-full gap-0 lg:grid-cols-[15rem_minmax(0,1fr)_20rem]">
			<div v-for="column in 3" :key="column" class="space-y-3 border-r border-border p-4 last:border-r-0">
				<DomSkeleton class="h-10" />
				<DomSkeleton v-for="row in 5" :key="row" class="h-16" />
			</div>
		</div>

		<DomEmptyState
			v-else-if="!workspace || !selectedFlag || !config"
			title="Release workspace unavailable"
			description="Reload the repository-local demo API to restore feature flags and environments."
		>
			<DomButton @click="loadWorkspace">Reload workspace</DomButton>
		</DomEmptyState>

		<div v-else class="min-h-full lg:grid lg:h-full lg:grid-cols-[15rem_minmax(0,1fr)_20rem]">
			<aside
				class="min-h-full border-r border-border bg-muted/15 lg:block lg:min-h-0 lg:overflow-y-auto"
				:class="activeView === 'flags' ? 'block' : 'hidden'"
			>
				<div class="sticky top-0 z-10 border-b border-border bg-canvas/95 p-3 backdrop-blur">
					<DomSelect
						:model-value="workspace.selectedEnvironmentId"
						:options="workspace.catalogs.environments"
						label="Environment"
						chrome="none"
						width="min-w-[17rem]"
						@update:model-value="selectEnvironment"
					>
						<template #value="{ option }">
							<div v-if="option" class="min-w-0">
								<p class="truncate text-sm font-semibold">{{ option.label }}</p>
								<p class="truncate text-[11px] text-muted-fg">{{ option.description }}</p>
							</div>
						</template>
						<template #option="{ option, selected }">
							<div class="min-w-0 py-0.5">
								<p class="text-sm font-medium" :class="selected && 'font-semibold'">{{ option.label }}</p>
								<p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p>
							</div>
						</template>
					</DomSelect>
					<DomTextInput v-model="flagSearch" class="mt-2" placeholder="Search flags or owners" aria-label="Search feature flags" chrome="none" />
				</div>

				<div class="divide-y divide-border">
					<DomAppListItem
						v-for="flag in filteredFlags"
						:key="flag.id"
						:label="flag.name"
						:description="flag.key"
						:meta="`${flag.rollout}%`"
						:selected="flag.id === workspace.selectedFlagId"
						@click="selectFlag(flag.id)"
					>
						<template #leading>
							<span class="size-2.5 rounded-full" :class="statusTone(flag.status) === 'success' ? 'bg-success' : statusTone(flag.status) === 'warning' ? 'bg-warning' : statusTone(flag.status) === 'primary' ? 'bg-primary' : 'bg-muted-fg/50'"></span>
						</template>
					</DomAppListItem>
				</div>

				<DomEmptyState v-if="!filteredFlags.length" title="No flags found" description="Try a flag key, product area, or owner." compact />
				<div class="p-3">
					<DomButton class="w-full" variant="secondary" @click="createDialogOpen = true">Create flag</DomButton>
					<DomButton class="mt-2 w-full sm:hidden" variant="ghost" :loading="busyAction === 'reset-workspace'" @click="resetWorkspace">Reset demo</DomButton>
				</div>
			</aside>

			<main
				class="min-h-full bg-canvas lg:block lg:min-h-0 lg:overflow-y-auto"
				:class="activeView === 'targeting' ? 'block' : 'hidden'"
			>
				<header class="border-b border-border px-4 py-4 sm:px-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<DomStatusPill :tone="statusTone(config.status)" :pulse="config.status === 'monitoring'" size="sm">{{ statusLabel(config.status) }}</DomStatusPill>
								<DomBadge tone="neutral" size="sm">{{ selectedFlag.owner }}</DomBadge>
								<DomBadge :tone="selectedFlag.risk === 'high' ? 'danger' : selectedFlag.risk === 'medium' ? 'warning' : 'success'" size="sm">{{ statusLabel(selectedFlag.risk) }} risk</DomBadge>
							</div>
							<h2 class="mt-2 truncate text-xl font-semibold tracking-tight">{{ selectedFlag.name }}</h2>
							<p class="mt-1 font-mono text-xs text-muted-fg">{{ selectedFlag.key }}</p>
						</div>
						<div class="text-right text-xs text-muted-fg">
							<p>{{ formatNumber(config.evaluations) }} evaluations</p>
							<p class="mt-1">v{{ config.version }} · {{ config.updatedAt }}</p>
						</div>
					</div>
					<p class="mt-3 max-w-3xl text-sm leading-6 text-muted-fg">{{ selectedFlag.description }}</p>
				</header>

				<div class="divide-y divide-border">
					<section class="p-4 sm:p-5">
						<div class="flex items-start justify-between gap-4">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Serving</p>
								<h3 class="mt-1 text-base font-semibold">Live configuration draft</h3>
								<p class="mt-1 text-xs leading-5 text-muted-fg">Previewing locks the exact configuration version, customer impact, and rollback evidence.</p>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-xs font-medium">{{ draftEnabled ? 'Enabled' : 'Disabled' }}</span>
								<DomToggle :model-value="draftEnabled" aria-label="Flag enabled in selected environment" @update:model-value="updateEnabledDraft" />
							</div>
						</div>

						<div class="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_15rem] sm:items-end">
							<DomRangeInput v-model="draftRollout" label="Percentage rollout" :disabled="!draftEnabled" :min="0" :max="100" :step="1" suffix="%" />
							<DomSelect v-model="draftSegmentId" :options="workspace.catalogs.segments" label="Audience segment" searchable width="min-w-[20rem]">
								<template #option="{ option }">
									<div class="py-0.5"><p class="text-sm font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div>
								</template>
							</DomSelect>
						</div>
						<div v-if="selectedSegment" class="mt-2 flex items-center justify-between gap-3 text-xs text-muted-fg">
							<span>{{ selectedSegment.description }}</span>
							<span class="shrink-0 font-medium text-canvas-fg">{{ draftRollout }}% served</span>
						</div>
					</section>

					<section class="p-4 sm:p-5">
						<div class="flex items-center justify-between gap-3">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Targeting rule</p>
								<h3 class="mt-1 text-base font-semibold">Match context attributes</h3>
							</div>
							<DomBadge tone="primary" size="sm">Then serve Available</DomBadge>
						</div>
						<div class="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
							<DomSelect v-model="draftAttribute" :options="workspace.catalogs.attributes" label="Attribute" width="min-w-[18rem]" />
							<DomSelect v-model="draftOperator" :options="workspace.catalogs.operators" label="Operator" width="min-w-[16rem]" />
							<DomTextInput v-model="draftValue" label="Value" placeholder="Scale, Growth" />
						</div>
						<DomTextareaInput v-model="draftReason" class="mt-4" label="Release reason" description="Included in approval, audit, and rollback evidence." :rows="3" />
						<div class="mt-4 flex flex-wrap justify-end gap-2">
							<DomButton variant="ghost" @click="restoreLiveDraft">Restore live values</DomButton>
							<DomButton :loading="busyAction === 'preview-change'" @click="previewChange">Review change</DomButton>
						</div>
					</section>

					<section class="p-4 sm:p-5">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Evaluator</p>
								<h3 class="mt-1 text-base font-semibold">Test a context before release</h3>
								<p class="mt-1 text-xs text-muted-fg">The API returns a stable rollout bucket and the exact targeting reason.</p>
							</div>
							<DomCheckbox v-model="evaluatePreview" :disabled="!workspace.preview" label="Use current preview" description="Otherwise evaluate the live configuration." />
						</div>
						<div class="mt-4 grid gap-3 md:grid-cols-3">
							<DomTextInput v-model="contextKey" label="Context key" />
							<DomSelect v-model="contextSegmentId" :options="workspace.catalogs.contextSegments" label="Test segment" width="min-w-[18rem]" />
							<DomSelect v-model="contextRegion" :options="workspace.catalogs.regions" label="Region" width="min-w-[15rem]" />
						</div>
						<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
							<div v-if="workspace.evaluation" class="flex min-w-0 items-start gap-3">
								<DomStatusPill :tone="workspace.evaluation.matched ? 'success' : 'neutral'" size="sm">{{ workspace.evaluation.variation }}</DomStatusPill>
								<div class="min-w-0 text-xs"><p class="font-medium">Bucket {{ workspace.evaluation.bucket }} · {{ workspace.evaluation.configuration }}</p><p class="mt-1 text-muted-fg">{{ workspace.evaluation.reason }}</p></div>
							</div>
							<p v-else class="text-xs text-muted-fg">No test evaluation has been run for this workspace revision.</p>
							<DomButton variant="secondary" :loading="busyAction === 'evaluate-context'" @click="evaluateContext">Evaluate context</DomButton>
						</div>
					</section>
				</div>
			</main>

			<aside
				class="min-h-full border-l border-border bg-muted/10 lg:block lg:min-h-0 lg:overflow-y-auto"
				:class="activeView === 'release' ? 'block' : 'hidden'"
			>
				<DomTabs v-model="evidenceTab" :tabs="evidenceTabs" aria-label="Release evidence" class="p-3">
					<template #release>
						<div class="space-y-4 pt-3">
							<section>
								<div class="flex items-end justify-between gap-3">
									<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Readiness</p><p class="mt-1 text-sm font-semibold">Release checks</p></div>
									<p class="text-2xl font-semibold tracking-tight">{{ selectedFlag.readiness.score }}%</p>
								</div>
								<div class="mt-3 divide-y divide-border border-y border-border">
									<div v-for="check in selectedFlag.readiness.checks" :key="check.id" class="flex items-start gap-3 py-3">
										<DomStatusPill :tone="statusTone(check.state)" :dot="true" size="sm">{{ statusLabel(check.state) }}</DomStatusPill>
										<div class="min-w-0"><p class="text-xs font-semibold">{{ check.label }}</p><p class="mt-1 text-[11px] leading-4 text-muted-fg">{{ check.detail }}</p></div>
									</div>
								</div>
							</section>

							<section>
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Guardrails</p>
								<div class="mt-2 divide-y divide-border border-y border-border">
									<div v-for="item in config.metrics" :key="item.id" class="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3 text-xs">
										<div><p class="font-semibold">{{ item.label }}</p><p class="mt-1 text-muted-fg">{{ item.trend }} · threshold {{ item.threshold }}</p></div>
										<div class="text-right"><p class="font-semibold">{{ item.value }}</p><DomStatusPill class="mt-1" :tone="statusTone(item.state)" size="sm">{{ statusLabel(item.state) }}</DomStatusPill></div>
									</div>
								</div>
							</section>

							<section v-if="workspace.preview" class="border-t border-border pt-4">
								<div class="flex items-center justify-between gap-3">
									<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Change set</p><p class="mt-1 font-mono text-[11px]">{{ workspace.preview.checksum }}</p></div>
									<DomBadge :tone="workspace.preview.requiresApproval ? 'warning' : 'success'" size="sm">{{ workspace.preview.requiresApproval ? 'Approval required' : 'Auto-approved' }}</DomBadge>
								</div>
								<div class="mt-3 divide-y divide-border rounded-lg border border-border bg-canvas px-3">
									<div v-for="change in workspace.preview.changes" :key="change.field" class="py-2.5 text-xs">
										<p class="font-semibold">{{ change.label }}</p>
										<p class="mt-1 text-muted-fg"><span class="line-through">{{ change.before }}</span> → <span class="font-medium text-canvas-fg">{{ change.after }}</span></p>
									</div>
								</div>
								<p class="mt-2 text-xs text-muted-fg">{{ formatNumber(workspace.preview.estimatedContexts) }} estimated contexts · {{ workspace.preview.draft.reason || draftReason }}</p>
							</section>

							<section v-if="workspace.preview && workspace.preview.requiresApproval && !workspace.approval" class="space-y-3 border-t border-border pt-4">
								<DomCheckbox v-model="approvalAcknowledged" label="I reviewed customer exposure" description="The rollback path and guardrail evidence will be included with the request." />
								<DomButton class="w-full" :disabled="!approvalAcknowledged" :loading="busyAction === 'request-approval'" @click="requestApproval">Request production approval</DomButton>
							</section>

							<section v-if="workspace.approval" class="space-y-3 border-t border-border pt-4">
								<div class="flex items-center justify-between gap-3"><p class="text-sm font-semibold">Production approval</p><DomStatusPill :tone="statusTone(workspace.approval.status)" size="sm">{{ statusLabel(workspace.approval.status) }}</DomStatusPill></div>
								<p class="text-xs leading-5 text-muted-fg">Requested by {{ workspace.approval.requestedBy }} · reviewer {{ workspace.approval.reviewer }}</p>
								<template v-if="workspace.approval.status === 'pending'">
									<DomTextareaInput v-model="approvalNote" label="Reviewer note" :rows="2" />
									<div class="grid grid-cols-2 gap-2"><DomButton variant="secondary" :loading="busyAction === 'approval-rejected'" @click="decideApproval('rejected')">Reject</DomButton><DomButton :loading="busyAction === 'approval-approved'" @click="decideApproval('approved')">Approve as Ava</DomButton></div>
								</template>
								<p v-else class="rounded-lg bg-secondary/60 p-3 text-xs leading-5">{{ workspace.approval.decisionNote }}</p>
							</section>

							<section v-if="workspace.preview && (!workspace.preview.requiresApproval || workspace.approval?.status === 'approved')" class="space-y-3 border-t border-border pt-4">
								<DomCheckbox v-model="publishAcknowledged" label="Publish this exact change" :description="`Configuration ${workspace.preview.sourceVersion} will change evaluated ${environmentLabel(workspace.selectedEnvironmentId).toLowerCase()} traffic.`" />
								<DomButton class="w-full" :disabled="!publishAcknowledged" :loading="busyAction === 'publish-change'" @click="publishChange">Publish to {{ environmentLabel(workspace.selectedEnvironmentId) }}</DomButton>
							</section>

							<DomAlert v-if="workspace.publishReceipt" tone="success" title="Release published" :description="`${workspace.publishReceipt.id} reached ${workspace.publishReceipt.evaluatorsAcknowledged} evaluators.`">
								<template #actions><DomButton v-if="config.status === 'monitoring' && !workspace.rollbackReceipt" size="sm" variant="secondary" :loading="busyAction === 'advance-monitoring'" @click="advanceMonitoring">Advance 30 min monitoring</DomButton></template>
							</DomAlert>

							<DomAlert v-if="workspace.monitoringReceipt" tone="success" title="Guardrails passed" :description="`${workspace.monitoringReceipt.id} completed the ${workspace.monitoringReceipt.window} window.`" />
							<DomAlert v-if="workspace.rollbackReceipt" tone="warning" title="Configuration restored" :description="`${workspace.rollbackReceipt.id} restored version ${workspace.rollbackReceipt.configurationVersion}.`">
								<template #actions><DomButton v-if="config.status === 'monitoring'" size="sm" variant="secondary" :loading="busyAction === 'advance-monitoring'" @click="advanceMonitoring">Advance rollback monitoring</DomButton></template>
							</DomAlert>

							<section v-if="config.previousSnapshot" class="space-y-3 border-t border-border pt-4">
								<div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Recovery</p><p class="mt-1 text-sm font-semibold">Previous configuration</p></div><DomBadge tone="neutral" size="sm">{{ config.previousSnapshot.rollout }}%</DomBadge></div>
								<template v-if="workspace.rollbackPreview">
									<p class="text-xs text-muted-fg">Restore {{ workspace.rollbackPreview.current.rollout }}% → {{ workspace.rollbackPreview.restore.rollout }}% using {{ workspace.rollbackPreview.checksum }}.</p>
									<DomCheckbox v-model="rollbackAcknowledged" label="I understand traffic will change" />
									<DomButton class="w-full" variant="danger" :disabled="!rollbackAcknowledged" :loading="busyAction === 'rollback-change'" @click="rollbackChange">Restore previous configuration</DomButton>
								</template>
								<DomButton v-else class="w-full" variant="secondary" :loading="busyAction === 'preview-rollback'" @click="previewRollback">Preview rollback</DomButton>
							</section>

							<DomJsonViewer v-if="workspace.publishReceipt || workspace.evaluation || workspace.rollbackReceipt" :value="evidencePayload" title="Provider evidence" filename="release-evidence.json" density="compact" :preview-lines="12" />
						</div>
					</template>

					<template #history>
						<div class="pt-3">
							<div v-for="item in workspace.activity" :key="item.id" class="relative border-l border-border pb-5 pl-5 text-sm last:pb-0">
								<span class="absolute -left-[5px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-canvas"></span>
								<div class="flex items-baseline justify-between gap-3"><p class="font-semibold">{{ item.title }}</p><span class="shrink-0 text-[11px] text-muted-fg">{{ item.time }}</span></div>
								<p class="mt-1 text-xs text-muted-fg">{{ item.actor }} · {{ item.detail }}</p>
							</div>
						</div>
					</template>
				</DomTabs>
			</aside>
		</div>

		<template #bottom>
			<DomAppBottomNav v-if="workspace" v-model="activeView" class="lg:hidden" :items="mobileNavigation" />
		</template>

		<template #overlay>
			<div v-if="error || notice" class="pointer-events-none absolute inset-x-3 top-3 z-30 flex justify-center">
				<DomAlert
					class="pointer-events-auto w-full max-w-xl shadow-lg"
					:tone="error ? 'danger' : 'success'"
					:title="error ? 'Action needs attention' : 'Workspace updated'"
					:description="error || notice"
					dismissible
					@dismiss="clearFeedback"
				/>
			</div>
		</template>
	</DomAppShell>

	<DomDialog v-if="workspace" v-model="createDialogOpen" title="Create feature flag" description="Start disabled in every environment, then preview targeting and exposure before publication." size="lg">
		<div class="grid gap-4 sm:grid-cols-2">
			<DomTextInput v-model="createName" label="Flag name" />
			<DomTextInput v-model="createKey" label="Flag key" />
			<DomSelect v-model="createOwnerId" :options="workspace.catalogs.owners" label="Owner" width="min-w-[18rem]" />
			<DomSelect v-model="createType" :options="workspace.catalogs.flagTypes" label="Flag type" width="min-w-[18rem]" />
			<DomTextareaInput v-model="createDescription" class="sm:col-span-2" label="Behavior controlled" :rows="3" />
		</div>
		<template #footer>
			<DomButton variant="secondary" @click="createDialogOpen = false">Cancel</DomButton>
			<DomButton :loading="busyAction === 'create-flag'" @click="createFlag">Create disabled flag</DomButton>
		</template>
	</DomDialog>
</template>
