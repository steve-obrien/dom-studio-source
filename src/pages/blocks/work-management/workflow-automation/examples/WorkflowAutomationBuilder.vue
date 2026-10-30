<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import {
	DomAlert,
	DomAppBottomNav,
	DomAppShell,
	DomAppTopBar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomEmptyState,
	DomJsonViewer,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextDiff,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/workflow-automation';
const inspectorTabs = [
	{ key: 'test', label: 'Test' },
	{ key: 'release', label: 'Release' },
	{ key: 'activity', label: 'Activity' },
];
const throttleOptions = Array.from({ length: 18 }, (_, index) => {
	const value = String((index + 1) * 4);
	return { value, label: `${value} hours`, description: index === 0 ? 'Minimum repeat-run protection' : `Wait ${value} hours before the same account can run again.` };
});

const workspace = ref(null);
const catalog = ref(createEmptyCatalog());
const workflows = ref([]);
const workflow = ref(null);
const loading = ref(true);
const workflowLoading = ref(false);
const busyAction = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const fieldErrors = ref({});
const selectedStatus = ref('all');
const workflowSearch = ref('');
const activeView = ref('build');
const inspectorTab = ref('test');
const fixtureId = ref('northstar-inactive');
const selectedTraceId = ref('');
const testRun = ref(null);
const draftPreview = ref(null);
const draftDialogOpen = ref(false);
const draftAcknowledged = ref(false);
const releasePreview = ref(null);
const releaseAcknowledged = ref(false);
const releaseReceipt = ref(null);
const resetDialogOpen = ref(false);
const draft = reactive(createEmptyDraft());

const filteredWorkflows = computed(filterWorkflows);
const selectedTrace = computed(resolveSelectedTrace);
const hasDraftChanges = computed(resolveHasDraftChanges);
const mobileNavigation = computed(createMobileNavigation);

watch(activeView, syncInspectorDestination);

onMounted(loadWorkspace);

/**
 * Creates an empty catalog that keeps the template stable before the API loads.
 *
 * @returns {Record<string, Array<Record<string, unknown>>>} Empty workflow catalogs.
 */
function createEmptyCatalog() {
	return {
		statuses: [],
		owners: [],
		triggers: [],
		matchModes: [],
		fields: [],
		actionTypes: [],
		fixtures: [],
		connections: [],
	};
}

/**
 * Creates the mutable workflow draft shape used by the composer.
 *
 * @returns {Record<string, unknown>} Empty workflow draft.
 */
function createEmptyDraft() {
	return {
		name: '',
		description: '',
		ownerId: '',
		triggerId: '',
		throttleHours: '24',
		matchMode: 'all',
		enabledAfterRelease: true,
		conditions: [],
		actions: [],
	};
}

/**
 * Filters workflow navigation by status and free-text search.
 *
 * @returns {Array<Record<string, unknown>>} Matching workflow summaries.
 */
function filterWorkflows() {
	const query = workflowSearch.value.trim().toLowerCase();
	return workflows.value.filter((item) => {
		if (selectedStatus.value !== 'all' && item.status !== selectedStatus.value) return false;
		if (!query) return true;
		return [item.name, item.description, item.ownerName, item.triggerName]
			.some((value) => String(value || '').toLowerCase().includes(query));
	});
}

/**
 * Resolves the selected trace row from the latest safe test.
 *
 * @returns {Record<string, unknown>|null} Selected trace or first trace row.
 */
function resolveSelectedTrace() {
	const trace = testRun.value?.trace || [];
	return trace.find((step) => step.id === selectedTraceId.value) || trace[0] || null;
}

/**
 * Checks whether the local draft differs from the authoritative workflow definition.
 *
 * @returns {boolean} Whether at least one editable value changed.
 */
function resolveHasDraftChanges() {
	if (!workflow.value) return false;
	return JSON.stringify(draftPayload()) !== JSON.stringify(workflowPayload(workflow.value));
}

/**
 * Builds compact-screen destinations with useful evidence badges.
 *
 * @returns {Array<Record<string, string>>} Bottom navigation items.
 */
function createMobileNavigation() {
	return [
		{ value: 'workflows', label: 'Workflows', badge: String(filteredWorkflows.value.length) },
		{ value: 'build', label: 'Build', badge: hasDraftChanges.value ? '•' : '' },
		{ value: 'test', label: 'Test', badge: workflow.value?.latestTest?.current ? '✓' : '' },
		{ value: 'release', label: 'Release', badge: workflow.value?.hasUnpublishedChanges ? '1' : '' },
	];
}

/**
 * Keeps the right-hand inspector aligned with compact-screen navigation.
 *
 * @param {string} destination Newly selected primary destination.
 * @returns {void}
 */
function syncInspectorDestination(destination) {
	if (['test', 'release', 'activity'].includes(destination)) inspectorTab.value = destination;
}

/**
 * Loads workflow summaries, option catalogs, and the initially selected workflow.
 *
 * @returns {Promise<void>}
 */
async function loadWorkspace() {
	clearFeedback();
	loading.value = true;
	try {
		const data = await requestJson('/bootstrap');
		applyWorkspace(data);
		await loadWorkflow(data.workspace.selectedWorkflowId, false);
	} catch (requestError) {
		errorMessage.value = requestError.message || 'Unable to load the workflow workspace.';
	} finally {
		loading.value = false;
	}
}

/**
 * Loads one authoritative workflow definition and its execution evidence.
 *
 * @param {string} workflowId Stable workflow identifier.
 * @param {boolean} [moveToBuilder=true] Whether compact screens should open the builder.
 * @returns {Promise<void>}
 */
async function loadWorkflow(workflowId, moveToBuilder = true) {
	if (!workflowId) return;
	clearFeedback();
	workflowLoading.value = true;
	try {
		const data = await requestJson(`/workflows/${workflowId}`);
		workflow.value = data.workflow;
		if (workspace.value) workspace.value.revision = data.workspaceRevision;
		syncDraft(data.workflow);
		testRun.value = data.workflow.testRuns?.[0] || null;
		selectedTraceId.value = testRun.value?.trace?.[0]?.id || '';
		if (moveToBuilder) activeView.value = 'build';
	} catch (requestError) {
		errorMessage.value = requestError.message || 'Unable to load this workflow.';
	} finally {
		workflowLoading.value = false;
	}
}

/**
 * Sends a JSON request and converts structured API failures into normal errors.
 *
 * @param {string} path API path below the workflow automation base URL.
 * @param {Record<string, unknown>|null} [body=null] Optional JSON request body.
 * @returns {Promise<Record<string, unknown>>} Parsed successful response.
 */
async function requestJson(path, body = null) {
	const options = body == null ? {} : {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	};
	const response = await fetch(`${apiBase}${path}`, options);
	const data = await response.json();
	if (!response.ok) throw createRequestError(data, response.status);
	return data;
}

/**
 * Creates an Error carrying status and field-level API evidence.
 *
 * @param {Record<string, unknown>} data Structured API response.
 * @param {number} status HTTP response status.
 * @returns {Error & { status?: number, fields?: Record<string, string[]> }} Request error.
 */
function createRequestError(data, status) {
	const requestError = new Error(data.message || `Request failed with status ${status}.`);
	requestError.status = status;
	requestError.fields = data.fields || {};
	return requestError;
}

/**
 * Applies authoritative workspace summaries and catalogs from an API response.
 *
 * @param {Record<string, unknown>} data Workflow workspace payload.
 * @returns {void}
 */
function applyWorkspace(data) {
	if (data.workspace) workspace.value = data.workspace;
	if (data.catalog) catalog.value = data.catalog;
	if (data.workflows) workflows.value = data.workflows;
}

/**
 * Copies one authoritative workflow into the editable local composer.
 *
 * @param {Record<string, unknown>} source Authoritative workflow definition.
 * @returns {void}
 */
function syncDraft(source) {
	Object.assign(draft, workflowPayload(source));
	draft.throttleHours = String(source.throttleHours);
	draft.conditions = cloneItems(source.conditions || []);
	draft.actions = cloneItems(source.actions || []);
	draftPreview.value = null;
	draftAcknowledged.value = false;
	releasePreview.value = null;
	releaseAcknowledged.value = false;
	releaseReceipt.value = source.hasUnpublishedChanges ? null : source.releaseReceipt || null;
	fieldErrors.value = {};
}

/**
 * Returns editable workflow fields in their server contract shape.
 *
 * @param {Record<string, unknown>} source Workflow definition.
 * @returns {Record<string, unknown>} Editable workflow payload.
 */
function workflowPayload(source) {
	return {
		name: source.name,
		description: source.description,
		ownerId: source.ownerId,
		triggerId: source.triggerId,
		throttleHours: Number(source.throttleHours),
		matchMode: source.matchMode,
		enabledAfterRelease: source.enabledAfterRelease,
		conditions: cloneItems(source.conditions || []),
		actions: cloneItems(source.actions || []),
	};
}

/**
 * Returns the current local draft in its normalized API shape.
 *
 * @returns {Record<string, unknown>} Workflow draft payload.
 */
function draftPayload() {
	return {
		name: draft.name,
		description: draft.description,
		ownerId: draft.ownerId,
		triggerId: draft.triggerId,
		throttleHours: Number(draft.throttleHours),
		matchMode: draft.matchMode,
		enabledAfterRelease: draft.enabledAfterRelease,
		conditions: cloneItems(draft.conditions),
		actions: cloneItems(draft.actions),
	};
}

/**
 * Creates independent shallow copies of flat workflow records.
 *
 * @param {Array<Record<string, unknown>>} items Records to clone.
 * @returns {Array<Record<string, unknown>>} Cloned records.
 */
function cloneItems(items) {
	return items.map((item) => ({ ...item }));
}

/**
 * Returns exact mutation revisions required by every write endpoint.
 *
 * @returns {{ workspaceRevision: number, workflowVersion: number }} Mutation revisions.
 */
function exactMutationBody() {
	return {
		workspaceRevision: workspace.value.revision,
		workflowVersion: workflow.value.version,
	};
}

/**
 * Asks the API to validate and lock the exact local draft for review.
 *
 * @returns {Promise<void>}
 */
async function previewDraft() {
	clearFeedback();
	busyAction.value = 'preview-draft';
	try {
		const data = await requestJson(`/workflows/${workflow.value.id}/draft-preview`, {
			...exactMutationBody(),
			draft: draftPayload(),
		});
		draftPreview.value = data.preview;
		draftAcknowledged.value = false;
		draftDialogOpen.value = true;
	} catch (requestError) {
		handleMutationError(requestError, 'Unable to preview this workflow draft.');
	} finally {
		busyAction.value = '';
	}
}

/**
 * Persists the acknowledged immutable draft preview and advances its version.
 *
 * @returns {Promise<void>}
 */
async function saveDraft() {
	clearFeedback();
	busyAction.value = 'save-draft';
	try {
		const data = await requestJson(`/workflows/${workflow.value.id}/draft-save`, {
			...exactMutationBody(),
			previewChecksum: draftPreview.value.checksum,
			acknowledged: draftAcknowledged.value,
		});
		applyWorkspace(data);
		workflow.value = data.workflow;
		syncDraft(data.workflow);
		draftDialogOpen.value = false;
		successMessage.value = `Draft v${data.workflow.version} saved with ${data.receipt.auditReceipt}.`;
	} catch (requestError) {
		handleMutationError(requestError, 'Unable to save this workflow draft.');
	} finally {
		busyAction.value = '';
	}
}

/**
 * Runs a server-side sample event without executing external side effects.
 *
 * @returns {Promise<void>}
 */
async function runSafeTest() {
	clearFeedback();
	busyAction.value = 'run-test';
	try {
		const data = await requestJson(`/workflows/${workflow.value.id}/test`, {
			...exactMutationBody(),
			fixtureId: fixtureId.value,
		});
		applyWorkspace(data);
		workflow.value = data.workflow;
		testRun.value = data.testRun;
		selectedTraceId.value = data.testRun.trace[0]?.id || '';
		releasePreview.value = null;
		releaseReceipt.value = null;
		successMessage.value = `${data.testRun.fixtureLabel} ${data.testRun.status}; ${data.testRun.sideEffectsExecuted} side effects executed.`;
		inspectorTab.value = 'test';
		activeView.value = 'test';
	} catch (requestError) {
		handleMutationError(requestError, 'Unable to run the safe workflow test.');
	} finally {
		busyAction.value = '';
	}
}

/**
 * Generates exact release evidence and server-owned readiness checks.
 *
 * @returns {Promise<void>}
 */
async function previewRelease() {
	clearFeedback();
	busyAction.value = 'preview-release';
	try {
		const data = await requestJson(`/workflows/${workflow.value.id}/release-preview`, exactMutationBody());
		releasePreview.value = data.preview;
		releaseAcknowledged.value = false;
		releaseReceipt.value = null;
		inspectorTab.value = 'release';
		activeView.value = 'release';
	} catch (requestError) {
		handleMutationError(requestError, 'Unable to generate a release preview.');
	} finally {
		busyAction.value = '';
	}
}

/**
 * Publishes the exact tested release and retains its audit/runtime receipts.
 *
 * @returns {Promise<void>}
 */
async function publishRelease() {
	clearFeedback();
	busyAction.value = 'publish-release';
	try {
		const data = await requestJson(`/workflows/${workflow.value.id}/publish`, {
			...exactMutationBody(),
			previewChecksum: releasePreview.value.checksum,
			acknowledged: releaseAcknowledged.value,
		});
		applyWorkspace(data);
		workflow.value = data.workflow;
		syncDraft(data.workflow);
		releaseReceipt.value = data.receipt;
		successMessage.value = `Version ${data.workflow.version} published with ${data.receipt.runtimeReceipt}.`;
		inspectorTab.value = 'release';
		activeView.value = 'release';
	} catch (requestError) {
		handleMutationError(requestError, 'Unable to publish this workflow release.');
	} finally {
		busyAction.value = '';
	}
}

/**
 * Restores deterministic process-local demonstration state.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	clearFeedback();
	busyAction.value = 'reset-workspace';
	try {
		const data = await requestJson('/reset', {});
		applyWorkspace(data);
		resetDialogOpen.value = false;
		testRun.value = null;
		releaseReceipt.value = null;
		await loadWorkflow(data.workspace.selectedWorkflowId, false);
		successMessage.value = 'Workflow workspace restored to its seeded revision.';
	} catch (requestError) {
		handleMutationError(requestError, 'Unable to reset the workflow workspace.');
	} finally {
		busyAction.value = '';
	}
}

/**
 * Applies a structured mutation error and reloads state after a revision conflict.
 *
 * @param {Error & { status?: number, fields?: Record<string, string[]> }} requestError API error.
 * @param {string} fallbackMessage Fallback message for unknown failures.
 * @returns {void}
 */
function handleMutationError(requestError, fallbackMessage) {
		errorMessage.value = requestError.message || fallbackMessage;
		fieldErrors.value = requestError.fields || {};
		if (requestError.status === 409) loadWorkspace();
}

/**
 * Clears visible success, error, and field-level feedback.
 *
 * @returns {void}
 */
function clearFeedback() {
		errorMessage.value = '';
	successMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Adds a supported condition to the rule path.
 *
 * @returns {void}
 */
function addCondition() {
	const nextField = catalog.value.fields.find((field) => !draft.conditions.some((condition) => condition.field === field.value)) || catalog.value.fields[0];
	if (!nextField || draft.conditions.length >= 6) return;
	draft.conditions.push({
		id: `condition_${Date.now()}`,
		field: nextField.value,
		operator: nextField.operators[0].value,
		value: nextField.values[0].value,
	});
}

/**
 * Removes one condition while retaining a valid minimum rule path.
 *
 * @param {string} conditionId Stable local condition identifier.
 * @returns {void}
 */
function removeCondition(conditionId) {
	if (draft.conditions.length <= 1) return;
	draft.conditions = draft.conditions.filter((condition) => condition.id !== conditionId);
}

/**
 * Resets operator and value when a condition field changes.
 *
 * @param {Record<string, unknown>} condition Mutable condition row.
 * @param {string} fieldId Newly selected field identifier.
 * @returns {void}
 */
function updateConditionField(condition, fieldId) {
	const nextField = fieldConfig(fieldId);
	condition.field = fieldId;
	condition.operator = nextField?.operators[0]?.value || '';
	condition.value = nextField?.values[0]?.value || '';
}

/**
 * Adds a supported action to the execution sequence.
 *
 * @returns {void}
 */
function addAction() {
	const actionType = catalog.value.actionTypes[0];
	if (!actionType || draft.actions.length >= 6) return;
	draft.actions.push({
		id: `action_${Date.now()}`,
		type: actionType.value,
		target: actionType.targets[0].value,
		enabled: true,
	});
}

/**
 * Removes one action while retaining a valid minimum execution sequence.
 *
 * @param {string} actionId Stable local action identifier.
 * @returns {void}
 */
function removeAction(actionId) {
	if (draft.actions.length <= 1) return;
	draft.actions = draft.actions.filter((action) => action.id !== actionId);
}

/**
 * Resets the destination when an action type changes.
 *
 * @param {Record<string, unknown>} action Mutable action row.
 * @param {string} type Newly selected action type.
 * @returns {void}
 */
function updateActionType(action, type) {
	const nextType = actionTypeConfig(type);
	action.type = type;
	action.target = nextType?.targets[0]?.value || '';
}

/**
 * Finds a condition-field catalog record.
 *
 * @param {string} fieldId Stable field identifier.
 * @returns {Record<string, unknown>|null} Matching field configuration.
 */
function fieldConfig(fieldId) {
	return catalog.value.fields.find((field) => field.value === fieldId) || null;
}

/**
 * Finds an action-type catalog record.
 *
 * @param {string} type Stable action type.
 * @returns {Record<string, unknown>|null} Matching action configuration.
 */
function actionTypeConfig(type) {
	return catalog.value.actionTypes.find((action) => action.value === type) || null;
}

/**
 * Returns condition operator options for one row.
 *
 * @param {Record<string, unknown>} condition Condition row.
 * @returns {Array<Record<string, unknown>>} Supported operators.
 */
function operatorOptions(condition) {
	return fieldConfig(condition.field)?.operators || [];
}

/**
 * Returns condition value options for one row.
 *
 * @param {Record<string, unknown>} condition Condition row.
 * @returns {Array<Record<string, unknown>>} Supported values.
 */
function conditionValueOptions(condition) {
	return fieldConfig(condition.field)?.values || [];
}

/**
 * Returns action destination options for one row.
 *
 * @param {Record<string, unknown>} action Action row.
 * @returns {Array<Record<string, unknown>>} Supported destinations.
 */
function actionTargetOptions(action) {
	return actionTypeConfig(action.type)?.targets || [];
}

/**
 * Maps workflow status to a semantic DOM Studio tone.
 *
 * @param {string} status Workflow state.
 * @returns {string} Semantic tone.
 */
function statusTone(status) {
	return { active: 'success', draft: 'info', paused: 'warning' }[status] || 'neutral';
}

/**
 * Maps trace state to a semantic DOM Studio tone.
 *
 * @param {string} status Trace state.
 * @returns {string} Semantic tone.
 */
function traceTone(status) {
	return { passed: 'success', simulated: 'info', stopped: 'warning', skipped: 'neutral', failed: 'danger' }[status] || 'neutral';
}

/**
 * Returns a concise status label for screen readers and visible pills.
 *
 * @param {string} status Machine-readable status.
 * @returns {string} Human-readable status.
 */
function statusLabel(status) {
	return String(status || '').replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
}
</script>

<template>
	<DomAppShell variant="app" class="!h-dvh bg-canvas text-canvas-fg">
		<template #top>
			<DomAppTopBar :title="workspace?.name || 'Automation operations'" :subtitle="workflow ? `${workflow.name} · draft v${workflow.version}` : 'Loading workflow registry'">
				<template #leading>
					<div class="grid size-10 place-items-center rounded-xl bg-primary text-sm font-black text-primary-fg" aria-hidden="true">A</div>
				</template>
				<template #trailing>
					<DomBadge v-if="workflow" :tone="workflow.hasUnpublishedChanges ? 'warning' : 'success'" variant="soft" class="hidden sm:inline-flex">{{ workflow.hasUnpublishedChanges ? `v${workflow.version} draft` : `v${workflow.publishedVersion} live` }}</DomBadge>
					<DomButton size="sm" variant="ghost" @click="resetDialogOpen = true">Reset demo</DomButton>
				</template>
			</DomAppTopBar>
		</template>

		<div v-if="loading" class="grid h-full place-items-center p-6">
			<div class="grid w-full max-w-5xl gap-4 lg:grid-cols-[17rem_minmax(0,1fr)_24rem]">
				<DomSkeleton height="h-[34rem]" /><DomSkeleton height="h-[34rem]" /><DomSkeleton height="h-[34rem]" />
			</div>
		</div>

		<div v-else-if="workspace && workflow" class="flex h-full min-h-0 flex-col overflow-hidden">
			<div v-if="errorMessage || successMessage" class="shrink-0 border-b border-border px-3 py-2 sm:px-4">
				<DomAlert v-if="errorMessage" tone="danger" variant="soft" title="Automation request needs attention" :description="errorMessage" />
				<DomAlert v-else tone="success" variant="soft" title="Automation evidence updated" :description="successMessage" />
			</div>

			<div class="grid min-h-0 flex-1 xl:grid-cols-[17rem_minmax(0,1fr)_24rem]">
				<aside
					class="h-full min-h-0 flex-col overflow-hidden border-r border-border bg-muted/10"
					:class="activeView === 'workflows' ? 'flex' : 'hidden xl:flex'"
					aria-label="Workflow registry"
				>
					<div class="shrink-0 border-b border-border p-3">
						<div class="grid grid-cols-3 divide-x divide-border border-y border-border py-3 text-center">
							<div><p class="text-lg font-semibold">{{ workspace.counts.active }}</p><p class="text-[10px] text-muted-fg">Active</p></div>
							<div><p class="text-lg font-semibold">{{ workspace.counts.draft }}</p><p class="text-[10px] text-muted-fg">Draft</p></div>
							<div><p class="text-lg font-semibold">{{ workspace.counts.paused }}</p><p class="text-[10px] text-muted-fg">Paused</p></div>
						</div>
						<div class="mt-3 grid gap-3">
							<DomTextInput v-model="workflowSearch" type="search" label="Find workflow" placeholder="Name, owner, trigger…" />
							<DomSelect v-model="selectedStatus" label="Lifecycle" :options="catalog.statuses" width="min-w-[15rem]" />
						</div>
					</div>
					<div v-if="filteredWorkflows.length" class="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
						<button
							v-for="item in filteredWorkflows"
							:key="item.id"
							type="button"
							class="w-full border-l-2 px-4 py-4 text-left transition hover:bg-secondary/50 focus-visible:outline-2 focus-visible:outline-ring"
							:class="item.id === workflow.id ? 'border-l-primary bg-secondary/55' : 'border-l-transparent'"
							@click="loadWorkflow(item.id)"
						>
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0"><p class="truncate text-sm font-semibold">{{ item.name }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.description }}</p></div>
								<DomStatusPill :tone="statusTone(item.status)" size="sm">{{ statusLabel(item.status) }}</DomStatusPill>
							</div>
							<div class="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted-fg"><span>{{ item.ownerName }}</span><span>v{{ item.version }} · {{ item.updatedLabel }}</span></div>
						</button>
					</div>
					<DomEmptyState v-else compact title="No matching workflows" description="Adjust lifecycle or search filters." />
				</aside>

				<main
					class="h-full min-h-0 min-w-0 flex-col overflow-hidden"
					:class="activeView === 'build' ? 'flex' : 'hidden xl:flex'"
					aria-labelledby="workflow-builder-heading"
				>
					<div v-if="workflowLoading" class="grid h-full place-items-center p-6"><div class="w-full max-w-2xl space-y-4"><DomSkeleton height="h-10" width="w-2/3" /><DomSkeleton height="h-36" /><DomSkeleton height="h-56" /></div></div>
					<template v-else>
						<header class="shrink-0 border-b border-border px-4 py-4 sm:px-6">
							<div class="flex flex-wrap items-start justify-between gap-4">
								<div class="min-w-0">
									<div class="flex flex-wrap items-center gap-2"><DomBadge tone="neutral" variant="outline">Draft v{{ workflow.version }}</DomBadge><DomBadge v-if="workflow.hasUnpublishedChanges" tone="warning" variant="soft">Unpublished changes</DomBadge><DomStatusPill :tone="statusTone(workflow.status)" size="sm">{{ statusLabel(workflow.status) }}</DomStatusPill></div>
									<h1 id="workflow-builder-heading" class="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Build the rule path</h1>
									<p class="mt-1 max-w-2xl text-sm text-muted-fg">Compose an event, explicit gates, and ordered effects. Save a versioned draft before testing and release.</p>
								</div>
								<DomButton :disabled="!hasDraftChanges" :loading="busyAction === 'preview-draft'" @click="previewDraft">Review draft</DomButton>
							</div>
						</header>

						<div class="min-h-0 flex-1 overflow-y-auto">
							<section class="border-b border-border px-4 py-5 sm:px-6" aria-labelledby="workflow-settings-heading">
								<div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Identity</p><h2 id="workflow-settings-heading" class="mt-1 text-lg font-semibold">Outcome and ownership</h2></div><div class="grid size-9 place-items-center rounded-full bg-secondary text-xs font-bold" :title="workflow.ownerName">{{ workflow.ownerInitials }}</div></div>
								<div class="mt-4 grid gap-4 sm:grid-cols-2">
									<DomTextInput v-model="draft.name" label="Workflow name" :errors="fieldErrors.name || []" />
									<DomSelect v-model="draft.ownerId" label="Accountable owner" :options="catalog.owners" :errors="fieldErrors.ownerId || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
									<DomTextareaInput v-model="draft.description" class="sm:col-span-2" label="Operational outcome" :rows="2" :errors="fieldErrors.description || []" />
								</div>
							</section>

							<section class="relative px-4 py-6 sm:px-6" aria-labelledby="workflow-path-heading">
								<div class="absolute bottom-8 left-[2.15rem] top-16 w-px bg-border sm:left-[3.15rem]" aria-hidden="true"></div>
								<div class="relative flex gap-4 sm:gap-5">
									<div class="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-fg">1</div>
									<div class="min-w-0 flex-1 pb-7">
										<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Listen</p><h2 id="workflow-path-heading" class="mt-1 text-lg font-semibold">Event trigger</h2>
										<div class="mt-4 grid gap-4 sm:grid-cols-2">
											<DomSelect v-model="draft.triggerId" label="Source event" :options="catalog.triggers" :errors="fieldErrors.triggerId || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
											<DomSelect v-model="draft.throttleHours" label="Repeat-run wait" :options="throttleOptions" :errors="fieldErrors.throttleHours || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
										</div>
									</div>
								</div>

								<div class="relative flex gap-4 sm:gap-5">
									<div class="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold">2</div>
									<div class="min-w-0 flex-1 pb-7">
										<div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Gate</p><h2 class="mt-1 text-lg font-semibold">Rule path</h2></div><DomSelect v-model="draft.matchMode" label="Condition logic" :options="catalog.matchModes" width="min-w-[15rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div>
										<div class="mt-4 divide-y divide-border border-y border-border">
											<div v-for="(condition, index) in draft.conditions" :key="condition.id" class="py-4">
												<div class="flex items-center justify-between gap-3"><p class="text-xs font-semibold text-muted-fg">Rule {{ index + 1 }}</p><DomButton size="sm" variant="ghost" :disabled="draft.conditions.length <= 1" @click="removeCondition(condition.id)">Remove</DomButton></div>
												<div class="mt-2 grid gap-3 sm:grid-cols-3">
													<DomSelect :model-value="condition.field" label="Field" :options="catalog.fields" :errors="fieldErrors[`conditions.${index}.field`] || []" @update:model-value="updateConditionField(condition, $event)"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
													<DomSelect v-model="condition.operator" label="Operator" :options="operatorOptions(condition)" :errors="fieldErrors[`conditions.${index}.operator`] || []" />
													<DomSelect v-model="condition.value" label="Value" :options="conditionValueOptions(condition)" :errors="fieldErrors[`conditions.${index}.value`] || []" />
												</div>
											</div>
										</div>
										<DomButton class="mt-3" size="sm" variant="secondary" :disabled="draft.conditions.length >= 6" @click="addCondition">Add rule</DomButton>
									</div>
								</div>

								<div class="relative flex gap-4 sm:gap-5">
									<div class="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold">3</div>
									<div class="min-w-0 flex-1">
										<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Act</p><h2 class="mt-1 text-lg font-semibold">Ordered effects</h2>
										<div class="mt-4 divide-y divide-border border-y border-border">
											<div v-for="(action, index) in draft.actions" :key="action.id" class="py-4">
												<div class="flex items-center justify-between gap-3"><p class="text-xs font-semibold text-muted-fg">Action {{ index + 1 }}</p><div class="flex items-center gap-2"><DomToggle v-model="action.enabled" label="Enabled" /><DomButton size="sm" variant="ghost" :disabled="draft.actions.length <= 1" @click="removeAction(action.id)">Remove</DomButton></div></div>
												<div class="mt-2 grid gap-3 sm:grid-cols-2">
													<DomSelect :model-value="action.type" label="Effect" :options="catalog.actionTypes" :errors="fieldErrors[`actions.${index}.type`] || []" @update:model-value="updateActionType(action, $event)"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect>
													<DomSelect v-model="action.target" label="Destination" :options="actionTargetOptions(action)" :errors="fieldErrors[`actions.${index}.target`] || []" />
												</div>
											</div>
										</div>
										<div class="mt-3 flex flex-wrap items-center justify-between gap-3"><DomButton size="sm" variant="secondary" :disabled="draft.actions.length >= 6" @click="addAction">Add action</DomButton><DomToggle v-model="draft.enabledAfterRelease" label="Activate after release" description="Otherwise publish this version paused." /></div>
									</div>
								</div>
							</section>
						</div>
					</template>
				</main>

				<aside
					class="h-full min-h-0 flex-col overflow-hidden border-l border-border bg-muted/10"
					:class="['test', 'release', 'activity'].includes(activeView) ? 'flex' : 'hidden xl:flex'"
					aria-label="Workflow evidence"
				>
					<DomTabs v-model="inspectorTab" :tabs="inspectorTabs" variant="page" fill class="min-h-0 flex-1">
						<template #test>
							<div class="h-full min-h-0 overflow-y-auto p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Sample event</p><h2 class="mt-1 text-lg font-semibold">Safe execution trace</h2><p class="mt-2 text-xs leading-5 text-muted-fg">The API evaluates a server fixture and connection health. External providers receive nothing.</p>
								<div class="mt-4"><DomSelect v-model="fixtureId" label="Fixture" :options="catalog.fixtures"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div>
								<DomButton class="mt-3 w-full" :loading="busyAction === 'run-test'" @click="runSafeTest">Run safe test</DomButton>
								<template v-if="testRun">
									<DomAlert class="mt-4" :tone="testRun.passed ? 'success' : 'warning'" :title="testRun.passed ? 'Test evidence passed' : 'Execution path stopped'" :description="`${testRun.fixtureLabel} · ${testRun.sideEffectsExecuted} side effects · ${testRun.checksum}`" />
									<div class="mt-4 divide-y divide-border border-y border-border">
										<button v-for="step in testRun.trace" :key="step.id" type="button" class="flex w-full items-start justify-between gap-3 px-1 py-3 text-left hover:bg-secondary/40" :class="step.id === selectedTrace?.id && 'bg-secondary/55'" @click="selectedTraceId = step.id"><div><p class="text-sm font-semibold">{{ step.label }}</p><p class="mt-1 font-mono text-[11px] text-muted-fg">{{ step.durationMs }}ms · {{ step.kind }}</p></div><DomStatusPill :tone="traceTone(step.status)" size="sm">{{ statusLabel(step.status) }}</DomStatusPill></button>
									</div>
									<DomJsonViewer v-if="selectedTrace" class="mt-4" :value="selectedTrace.output" title="Step output" :filename="`${selectedTrace.id}.json`" :preview-lines="12" density="compact" />
								</template>
								<DomEmptyState v-else compact class="mt-5" title="No current test evidence" description="Run a safe sample before releasing this version." />
							</div>
						</template>

						<template #release>
							<div class="h-full min-h-0 overflow-y-auto p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Version boundary</p><h2 class="mt-1 text-lg font-semibold">Release exact evidence</h2><p class="mt-2 text-xs leading-5 text-muted-fg">Publish only the tested definition, healthy connections, owner, throttle, and selected runtime state.</p>
								<template v-if="releaseReceipt">
									<DomAlert class="mt-4" tone="success" title="Release is live" :description="`Version ${releaseReceipt.workflowVersion} published ${releaseReceipt.status}.`" />
									<dl class="mt-4 divide-y divide-border border-y border-border text-sm"><div class="py-3"><dt class="text-xs text-muted-fg">Audit receipt</dt><dd class="mt-1 break-all font-mono text-xs">{{ releaseReceipt.auditReceipt }}</dd></div><div class="py-3"><dt class="text-xs text-muted-fg">Runtime receipt</dt><dd class="mt-1 break-all font-mono text-xs">{{ releaseReceipt.runtimeReceipt }}</dd></div><div class="py-3"><dt class="text-xs text-muted-fg">Test checksum</dt><dd class="mt-1 break-all font-mono text-xs">{{ releaseReceipt.testChecksum }}</dd></div></dl>
								</template>
								<template v-else-if="releasePreview">
									<div class="mt-4 space-y-3"><div v-for="check in releasePreview.checks" :key="check.key" class="border-b border-border pb-3"><div class="flex items-start justify-between gap-3"><p class="text-sm font-medium">{{ check.label }}</p><DomStatusPill :tone="check.passed ? 'success' : 'danger'" size="sm">{{ check.passed ? 'Passed' : 'Blocked' }}</DomStatusPill></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div></div>
									<DomTextDiff class="mt-4" :original="releasePreview.original" :proposed="releasePreview.proposed" original-label="Published" proposed-label="Release candidate" view="inline" format="text" />
									<DomCheckbox v-model="releaseAcknowledged" class="mt-4" label="Publish this tested definition" description="I reviewed the release checks, exact diff, runtime state, and current workflow version." :errors="fieldErrors.acknowledged || []" />
									<DomButton class="mt-4 w-full" :disabled="releasePreview.blockingChecks.length > 0 || !releaseAcknowledged" :loading="busyAction === 'publish-release'" @click="publishRelease">Publish version {{ releasePreview.workflowVersion }}</DomButton>
								</template>
								<template v-else>
									<div class="mt-4 divide-y divide-border border-y border-border"><div v-for="connection in workflow.requiredConnections" :key="connection.id" class="flex items-start justify-between gap-3 py-3"><div><p class="text-sm font-medium">{{ connection.name }}</p><p class="mt-1 text-xs text-muted-fg">{{ connection.detail }}</p></div><DomStatusPill :tone="connection.status === 'healthy' ? 'success' : 'danger'" size="sm">{{ statusLabel(connection.status) }}</DomStatusPill></div></div>
									<DomButton class="mt-4 w-full" :loading="busyAction === 'preview-release'" @click="previewRelease">Generate release preview</DomButton>
								</template>
							</div>
						</template>

						<template #activity>
							<div class="h-full min-h-0 overflow-y-auto p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Immutable history</p><h2 class="mt-1 text-lg font-semibold">Operations activity</h2>
								<div class="mt-4 divide-y divide-border border-y border-border"><div v-for="event in workflow.activity" :key="event.id" class="py-4"><div class="flex items-start justify-between gap-3"><p class="text-sm font-semibold">{{ event.title }}</p><p class="font-mono text-[11px] text-muted-fg">{{ event.time }}</p></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p><p class="mt-2 text-[11px] text-muted-fg">{{ event.actor }}</p></div></div>
								<section class="mt-6"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Production executions</p><div v-if="workflow.productionRuns.length" class="mt-3 divide-y divide-border border-y border-border"><div v-for="run in workflow.productionRuns" :key="run.id" class="flex items-start justify-between gap-3 py-3"><div><p class="text-sm font-medium">{{ run.record }}</p><p class="mt-1 font-mono text-[11px] text-muted-fg">{{ run.id }} · v{{ run.version }} · {{ run.duration }}</p></div><DomStatusPill :tone="run.status === 'success' ? 'success' : 'danger'" size="sm">{{ statusLabel(run.status) }}</DomStatusPill></div></div><DomEmptyState v-else compact class="mt-3" title="No production executions" description="This workflow has not run in production yet." /></section>
							</div>
						</template>
					</DomTabs>
				</aside>
			</div>
		</div>

		<DomEmptyState v-else title="Workflow workspace unavailable" description="Reset the demonstration or reload this preview." />

		<template #bottom>
			<DomAppBottomNav v-model="activeView" :items="mobileNavigation" class="xl:hidden" />
		</template>

		<DomDialog v-model="draftDialogOpen" title="Save exact workflow draft" description="The API validated and locked this exact definition against the current workspace and workflow versions." width="min(94vw, 58rem)">
			<template v-if="draftPreview">
				<div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
					<DomTextDiff :original="draftPreview.previousSummary" :proposed="draftPreview.proposedSummary" original-label="Current draft" proposed-label="Proposed draft" view="inline" format="text" />
					<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Exact changes</p><ul class="mt-3 space-y-2 text-sm"><li v-for="change in draftPreview.changes" :key="change" class="border-b border-border pb-2 last:border-b-0">{{ change }}</li></ul><p class="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Server checks</p><div class="mt-3 space-y-3"><div v-for="check in draftPreview.checks" :key="check.label" class="flex items-start justify-between gap-3 text-sm"><span>{{ check.label }}</span><DomStatusPill :tone="check.passed ? 'success' : 'danger'" size="sm">{{ check.passed ? 'Passed' : 'Blocked' }}</DomStatusPill></div></div><p class="mt-4 break-all font-mono text-[10px] text-muted-fg">{{ draftPreview.checksum }}</p></div>
				</div>
				<DomCheckbox v-model="draftAcknowledged" class="mt-5" label="Save this exact version" description="I reviewed the trigger, rules, action destinations, throttle, owner, and release state." :errors="fieldErrors.acknowledged || []" />
			</template>
			<template #footer><DomButton variant="secondary" data-close>Keep editing</DomButton><DomButton :disabled="!draftAcknowledged" :loading="busyAction === 'save-draft'" @click="saveDraft">Save versioned draft</DomButton></template>
		</DomDialog>

		<DomDialog v-model="resetDialogOpen" title="Reset automation operations?" description="This clears process-local drafts, tests, releases, and receipts, then restores the seeded workflow registry.">
			<template #footer><DomButton variant="secondary" data-close>Keep workspace</DomButton><DomButton variant="danger" :loading="busyAction === 'reset-workspace'" @click="resetWorkspace">Reset demo</DomButton></template>
		</DomDialog>
	</DomAppShell>
</template>
