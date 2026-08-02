<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
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
	DomProgress,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/incident-response';
const commandTabs = [
	{ key: 'actions', label: 'Actions' },
	{ key: 'evidence', label: 'Evidence' },
	{ key: 'timeline', label: 'Timeline' },
];
const updateTabs = [
	{ key: 'compose', label: 'Compose' },
	{ key: 'deliveries', label: 'Deliveries' },
];

const workspace = ref(null);
const incidents = ref([]);
const selectedIncident = ref(null);
const catalogs = ref({ severities: [], cadences: [], audiences: [], people: [], services: [] });
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const fieldErrors = ref({});
const activeView = ref('command');
const commandTab = ref('actions');
const updateTab = ref('compose');
const declareDialogOpen = ref(false);
const publishAcknowledged = ref(false);
const resolutionAcknowledged = ref(false);

const commandDraft = reactive({
	severity: '',
	commanderId: '',
	liaisonId: '',
	scribeId: '',
	cadenceMinutes: 30,
});
const updateDraft = reactive({
	audience: 'public',
	message: '',
	includeMetrics: true,
});
const declarationDraft = reactive({
	title: '',
	severity: 'SEV-2',
	serviceId: 'checkout_api',
	impactSummary: '',
});

const mobileNavigation = computed(() => [
	{ value: 'incidents', label: 'Incidents', badge: String(workspace.value?.counts?.open || '') },
	{ value: 'command', label: 'Command', badge: selectedIncident.value?.blockers ? String(selectedIncident.value.blockers) : '' },
	{ value: 'updates', label: 'Updates', badge: selectedIncident.value?.updates?.length ? String(selectedIncident.value.updates.length) : '' },
]);
const evidencePayload = computed(() => selectedIncident.value ? {
	sourceAlert: selectedIncident.value.sourceAlert,
	bridge: selectedIncident.value.bridge,
	monitoring: selectedIncident.value.monitoring,
	services: selectedIncident.value.services,
} : null);
const latestUpdate = computed(() => selectedIncident.value?.updates?.[0] || null);

onMounted(loadWorkspace);

/**
 * Loads the complete incident workspace from the repository-local API.
 *
 * @param {boolean} clearMessages Whether visible feedback should be cleared.
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
		error.value = requestError.message || 'Unable to load the incident command room.';
	} finally {
		loading.value = false;
	}
}

/**
 * Sends one JSON mutation and applies the authoritative response.
 *
 * @param {string} path API path below the incident-response base URL.
 * @param {Record<string, unknown>} body JSON request body.
 * @param {string} action Stable busy-state key.
 * @returns {Promise<Record<string, unknown> | null>} Updated payload or null after failure.
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
		error.value = requestError.message || 'Incident action failed.';
		fieldErrors.value = requestError.fields || {};
		if (requestError.status === 409) await refreshAfterConflict();
		return null;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Reloads authoritative state after an exact-revision conflict.
 *
 * @returns {Promise<void>}
 */
async function refreshAfterConflict() {
	try {
		const response = await fetch(`${apiBase}/bootstrap`);
		const data = await response.json();
		if (response.ok) setWorkspace(data);
	} catch {
		// Preserve the original conflict when recovery also fails.
	}
}

/**
 * Replaces client state and aligns editable drafts with server evidence.
 *
 * @param {Record<string, unknown>} data Authoritative incident workspace.
 * @returns {void}
 */
function setWorkspace(data) {
	workspace.value = data.workspace;
	incidents.value = data.incidents || [];
	selectedIncident.value = data.selectedIncident || null;
	catalogs.value = data.catalogs || { severities: [], cadences: [], audiences: [], people: [], services: [] };
	if (selectedIncident.value) setDrafts(selectedIncident.value);
	if (!selectedIncident.value?.updatePreview) publishAcknowledged.value = false;
	if (selectedIncident.value?.lifecycle !== 'monitoring') resolutionAcknowledged.value = false;
}

/**
 * Copies one incident into command and communication drafts.
 *
 * @param {Record<string, unknown>} incident Selected incident.
 * @returns {void}
 */
function setDrafts(incident) {
	commandDraft.severity = incident.severity;
	commandDraft.commanderId = incident.roles.commanderId;
	commandDraft.liaisonId = incident.roles.liaisonId;
	commandDraft.scribeId = incident.roles.scribeId;
	commandDraft.cadenceMinutes = incident.cadenceMinutes;
	updateDraft.audience = incident.updateDraft.audience;
	updateDraft.message = incident.updateDraft.message;
	updateDraft.includeMetrics = incident.updateDraft.includeMetrics;
}

/**
 * Selects an incident from the active queue.
 *
 * @param {string} incidentId Stable incident identifier.
 * @returns {Promise<void>}
 */
async function selectIncident(incidentId) {
	if (!workspace.value || incidentId === selectedIncident.value?.id || busyAction.value) return;
	const data = await mutateWorkspace('/select', {
		revision: workspace.value.revision,
		incidentId,
	}, 'select-incident');
	if (data) {
		activeView.value = 'command';
		commandTab.value = 'actions';
		updateTab.value = 'compose';
		notice.value = `${data.selectedIncident.title} opened at version ${data.selectedIncident.version}.`;
	}
}

/**
 * Saves severity, unique command roles, and update cadence.
 *
 * @returns {Promise<void>}
 */
async function saveCommand() {
	if (!workspace.value || !selectedIncident.value) return;
	const data = await mutateWorkspace(`/incidents/${selectedIncident.value.id}/command`, {
		revision: workspace.value.revision,
		incidentVersion: selectedIncident.value.version,
		...commandDraft,
	}, 'save-command');
	if (data) notice.value = `Command assignments saved in ${data.mutationReceipt.id}.`;
}

/**
 * Advances one technical action to started or completed.
 *
 * @param {Record<string, unknown>} action Response action.
 * @returns {Promise<void>}
 */
async function advanceAction(action) {
	if (!workspace.value || !selectedIncident.value) return;
	const data = await mutateWorkspace(`/incidents/${selectedIncident.value.id}/actions/${action.id}/advance`, {
		revision: workspace.value.revision,
		incidentVersion: selectedIncident.value.version,
	}, `advance-${action.id}`);
	if (data) notice.value = data.message;
}

/**
 * Refreshes monitoring evidence from the deterministic provider adapter.
 *
 * @returns {Promise<void>}
 */
async function refreshMonitoring() {
	if (!workspace.value || !selectedIncident.value) return;
	const data = await mutateWorkspace(`/incidents/${selectedIncident.value.id}/monitor/refresh`, {
		revision: workspace.value.revision,
		incidentVersion: selectedIncident.value.version,
	}, 'refresh-monitoring');
	if (data) notice.value = `${data.selectedIncident.monitoring.providerReceipt} captured ${data.selectedIncident.monitoring.errorRate}% errors.`;
}

/**
 * Creates an immutable customer-update preview.
 *
 * @returns {Promise<void>}
 */
async function previewUpdate() {
	if (!workspace.value || !selectedIncident.value) return;
	const data = await mutateWorkspace(`/incidents/${selectedIncident.value.id}/updates/preview`, {
		revision: workspace.value.revision,
		incidentVersion: selectedIncident.value.version,
		...updateDraft,
	}, 'preview-update');
	if (data) {
		activeView.value = 'updates';
		updateTab.value = 'compose';
		notice.value = `${data.selectedIncident.updatePreview.checksum} locked the communication route.`;
	}
}

/**
 * Publishes the exact preview after explicit acknowledgement.
 *
 * @returns {Promise<void>}
 */
async function publishUpdate() {
	if (!workspace.value || !selectedIncident.value?.updatePreview) return;
	const data = await mutateWorkspace(`/incidents/${selectedIncident.value.id}/updates/publish`, {
		revision: workspace.value.revision,
		incidentVersion: selectedIncident.value.version,
		previewChecksum: selectedIncident.value.updatePreview.checksum,
		acknowledged: publishAcknowledged.value,
	}, 'publish-update');
	if (data) {
		publishAcknowledged.value = false;
		notice.value = `${data.publicationReceipt.providerReceipt} delivered the customer update.`;
	}
}

/**
 * Moves the selected incident into monitoring after readiness checks pass.
 *
 * @returns {Promise<void>}
 */
async function markMonitoring() {
	await transitionIncident('monitoring', false);
}

/**
 * Resolves the selected incident with immutable evidence.
 *
 * @returns {Promise<void>}
 */
async function resolveIncident() {
	await transitionIncident('resolved', resolutionAcknowledged.value);
}

/**
 * Applies one server-owned lifecycle transition.
 *
 * @param {string} transition Lifecycle transition.
 * @param {boolean} acknowledged Whether final evidence is acknowledged.
 * @returns {Promise<void>}
 */
async function transitionIncident(transition, acknowledged) {
	if (!workspace.value || !selectedIncident.value) return;
	const data = await mutateWorkspace(`/incidents/${selectedIncident.value.id}/status`, {
		revision: workspace.value.revision,
		incidentVersion: selectedIncident.value.version,
		transition,
		acknowledged,
	}, `transition-${transition}`);
	if (data) {
		resolutionAcknowledged.value = false;
		notice.value = data.message;
	}
}

/**
 * Opens a clean incident declaration form.
 *
 * @returns {void}
 */
function openDeclaration() {
	fieldErrors.value = {};
	declarationDraft.title = '';
	declarationDraft.severity = 'SEV-2';
	declarationDraft.serviceId = 'checkout_api';
	declarationDraft.impactSummary = '';
	declareDialogOpen.value = true;
}

/**
 * Declares a new incident through the repository-local API.
 *
 * @returns {Promise<void>}
 */
async function declareIncident() {
	if (!workspace.value) return;
	const data = await mutateWorkspace('/declare', {
		revision: workspace.value.revision,
		...declarationDraft,
	}, 'declare-incident');
	if (data) {
		declareDialogOpen.value = false;
		activeView.value = 'command';
		notice.value = `${data.selectedIncident.id} declared with ${data.selectedIncident.bridge.providerReceipt}.`;
	}
}

/**
 * Restores the seeded incident command room.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	const data = await mutateWorkspace('/reset', {}, 'reset-workspace');
	if (data) {
		activeView.value = 'command';
		commandTab.value = 'actions';
		updateTab.value = 'compose';
		notice.value = 'Incident command room restored.';
	}
}

/**
 * Clears visible feedback and field errors.
 *
 * @returns {void}
 */
function clearFeedback() {
	error.value = '';
	notice.value = '';
	fieldErrors.value = {};
}

/**
 * Creates an Error carrying HTTP status and field messages.
 *
 * @param {Record<string, unknown>} data Error payload.
 * @param {number} status HTTP status.
 * @returns {Error & {status: number, fields?: Record<string, string[]>}} Request error.
 */
function createRequestError(data, status) {
	const fieldMessages = Object.values(data.fields || {}).flat().join(' ');
	const requestError = new Error([data.message, fieldMessages].filter(Boolean).join(' ') || `Request failed with status ${status}.`);
	requestError.status = status;
	requestError.fields = data.fields || {};
	return requestError;
}

/**
 * Returns a semantic tone for an action status.
 *
 * @param {string} status Action status.
 * @returns {string} DOM Studio tone.
 */
function actionTone(status) {
	if (status === 'done') return 'success';
	if (status === 'in_progress') return 'info';
	return 'neutral';
}

/**
 * Returns a semantic tone for a response check.
 *
 * @param {string} status Check status.
 * @returns {string} DOM Studio tone.
 */
function checkTone(status) {
	if (status === 'passed') return 'success';
	if (status === 'warning') return 'warning';
	return 'danger';
}

/**
 * Returns a semantic tone for service health.
 *
 * @param {string} state Service state.
 * @returns {string} DOM Studio tone.
 */
function serviceTone(state) {
	if (state === 'Operational') return 'success';
	if (state === 'Watch') return 'info';
	if (state === 'Major outage') return 'danger';
	return 'warning';
}

/**
 * Formats an ISO timestamp for the activity rail.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Localized time.
 */
function formatTime(value) {
	if (!value) return '';
	return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
</script>

<template>
	<DomAppShell variant="app" class="!h-dvh">
		<template #top>
			<DomAppTopBar
				title="Incident room"
				:subtitle="selectedIncident ? `${selectedIncident.severity} · ${selectedIncident.statusMeta.label} · ${selectedIncident.elapsedLabel}` : 'Reliability operations'"
			>
				<template #leading>
					<div class="grid size-9 place-items-center rounded-md bg-destructive text-xs font-bold text-destructive-fg" aria-hidden="true">IR</div>
				</template>
				<template #trailing>
					<DomBadge v-if="workspace" tone="neutral" variant="soft" class="!hidden sm:!inline-flex">r{{ workspace.revision }}</DomBadge>
					<DomButton class="!hidden sm:!inline-flex" size="sm" variant="secondary" :loading="busyAction === 'reset-workspace'" @click="resetWorkspace">Reset</DomButton>
					<DomButton class="!hidden sm:!inline-flex" size="sm" variant="danger" @click="openDeclaration">Declare incident</DomButton>
				</template>
			</DomAppTopBar>
		</template>

		<div class="relative h-full min-h-0 overflow-hidden">
			<div v-if="error || notice" class="absolute inset-x-3 top-3 z-20 mx-auto max-w-2xl">
				<DomAlert v-if="error" tone="danger" variant="toast" title="Incident action failed" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-else tone="success" variant="toast" title="Command room updated" :description="notice" dismissible @dismiss="notice = ''" />
			</div>

			<div v-if="loading" class="grid h-full lg:grid-cols-[16rem_minmax(0,1fr)_23rem]">
				<div v-for="column in 3" :key="column" class="space-y-3 border-r border-border p-4 last:border-r-0">
					<DomSkeleton height="h-8" width="w-2/3" />
					<DomSkeleton v-for="row in 6" :key="row" height="h-16" />
				</div>
			</div>

			<DomEmptyState
				v-else-if="!workspace || !selectedIncident"
				title="Incident command room unavailable"
				description="Reload the repository-local API to restore the response workspace."
			>
				<DomButton @click="loadWorkspace">Reload workspace</DomButton>
			</DomEmptyState>

			<div v-else class="grid h-full min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[16rem_minmax(0,1fr)_23rem]">
				<aside
					class="h-full min-h-0 overflow-y-auto border-r border-border bg-muted/10"
					:class="activeView === 'incidents' ? 'block' : 'hidden lg:block'"
					aria-label="Active incidents"
				>
					<div class="grid grid-cols-3 border-b border-border text-center">
						<div class="px-2 py-3"><p class="text-[11px] text-muted-fg">Open</p><p class="mt-1 text-lg font-semibold">{{ workspace.counts.open }}</p></div>
						<div class="border-l border-border px-2 py-3"><p class="text-[11px] text-muted-fg">SEV-2+</p><p class="mt-1 text-lg font-semibold">{{ workspace.counts.major }}</p></div>
						<div class="border-l border-border px-2 py-3"><p class="text-[11px] text-muted-fg">Needs update</p><p class="mt-1 text-lg font-semibold">{{ workspace.counts.needsUpdate }}</p></div>
					</div>
					<div class="border-b border-border px-3 py-3">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Live incidents</p>
						<p class="mt-1 text-xs leading-5 text-muted-fg">Service alerts promoted into accountable response rooms.</p>
					</div>
					<div class="divide-y divide-border">
						<DomAppListItem
							v-for="incident in incidents"
							:key="incident.id"
							:label="incident.title"
							:description="`${incident.severity} · ${incident.serviceName} · ${incident.accountsAffected} affected`"
							:meta="incident.nextUpdateLabel"
							:selected="incident.id === selectedIncident.id"
							@click="selectIncident(incident.id)"
						>
							<template #icon>
								<span
									class="size-2.5 rounded-full"
									:class="incident.severity === 'SEV-1' ? 'bg-destructive' : incident.severity === 'SEV-2' ? 'bg-warning' : 'bg-primary'"
									aria-hidden="true"
								></span>
							</template>
							<template #trailing>
								<DomBadge v-if="incident.blockers" tone="danger" size="sm">{{ incident.blockers }}</DomBadge>
							</template>
						</DomAppListItem>
					</div>
					<div class="p-3">
						<DomButton class="w-full" variant="danger" @click="openDeclaration">Declare incident</DomButton>
						<DomButton class="mt-2 w-full sm:hidden" variant="ghost" :loading="busyAction === 'reset-workspace'" @click="resetWorkspace">Reset demo</DomButton>
					</div>
				</aside>

				<main
					class="flex h-full min-h-0 flex-col overflow-hidden"
					:class="activeView === 'command' ? 'flex' : 'hidden lg:flex'"
					aria-labelledby="incident-heading"
				>
					<header class="shrink-0 border-b border-border px-4 py-4 sm:px-6">
						<div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<DomStatusPill :tone="selectedIncident.severityMeta.tone" :label="selectedIncident.severityMeta.label" size="sm" />
									<DomStatusPill :tone="selectedIncident.statusMeta.tone" :label="selectedIncident.statusMeta.label" size="sm" />
									<DomBadge tone="neutral" variant="soft">v{{ selectedIncident.version }}</DomBadge>
								</div>
								<h1 id="incident-heading" class="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{{ selectedIncident.title }}</h1>
								<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">{{ selectedIncident.customerImpact.summary }}</p>
							</div>
							<div class="text-center sm:text-right">
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ selectedIncident.bridge.label }}</p>
								<p class="mt-1 font-mono text-xs">{{ selectedIncident.bridge.providerReceipt }}</p>
								<p class="mt-2 text-xs text-muted-fg">{{ selectedIncident.sourceAlert.provider }} · {{ selectedIncident.sourceAlert.id }}</p>
							</div>
						</div>
					</header>

					<div class="grid shrink-0 grid-cols-2 border-b border-border sm:grid-cols-4">
						<div class="border-r border-border px-4 py-3"><p class="text-[11px] uppercase tracking-wide text-muted-fg">Error rate</p><p class="mt-1 text-lg font-semibold">{{ selectedIncident.monitoring.errorRate }}%</p></div>
						<div class="border-r border-border px-4 py-3"><p class="text-[11px] uppercase tracking-wide text-muted-fg">P95 latency</p><p class="mt-1 text-lg font-semibold">{{ selectedIncident.monitoring.p95Ms }}ms</p></div>
						<div class="border-r border-border px-4 py-3"><p class="text-[11px] uppercase tracking-wide text-muted-fg">Accounts</p><p class="mt-1 text-lg font-semibold">{{ selectedIncident.customerImpact.accountsAffected }}</p></div>
						<div class="px-4 py-3"><p class="text-[11px] uppercase tracking-wide text-muted-fg">Stable samples</p><p class="mt-1 text-lg font-semibold">{{ selectedIncident.monitoring.stableSamples }}/2</p></div>
					</div>

					<DomTabs v-model="commandTab" :tabs="commandTabs" variant="page" fill class="min-h-0 flex-1">
						<template #actions>
							<div class="h-full min-h-0 overflow-y-auto">
								<section class="border-b border-border px-4 py-5 sm:px-6" aria-labelledby="command-roles-heading">
									<div class="flex flex-wrap items-center justify-between gap-3">
										<div>
											<h2 id="command-roles-heading" class="text-sm font-semibold">Command assignments</h2>
											<p class="mt-1 text-xs text-muted-fg">One owner per role keeps decisions and communication accountable.</p>
										</div>
										<DomButton size="sm" variant="secondary" :loading="busyAction === 'save-command'" :disabled="!selectedIncident.capabilities.canEdit" @click="saveCommand">Save command</DomButton>
									</div>
									<div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
										<DomSelect v-model="commandDraft.severity" label="Severity" :options="catalogs.severities" :disabled="!selectedIncident.capabilities.canEdit" />
										<DomSelect v-model="commandDraft.commanderId" label="Commander" :options="catalogs.people" searchable :errors="fieldErrors.commanderId || fieldErrors.roles || []" :disabled="!selectedIncident.capabilities.canEdit" />
										<DomSelect v-model="commandDraft.liaisonId" label="Customer liaison" :options="catalogs.people" searchable :errors="fieldErrors.liaisonId || fieldErrors.roles || []" :disabled="!selectedIncident.capabilities.canEdit" />
										<DomSelect v-model="commandDraft.scribeId" label="Scribe" :options="catalogs.people" searchable :errors="fieldErrors.scribeId || fieldErrors.roles || []" :disabled="!selectedIncident.capabilities.canEdit" />
									</div>
								</section>

								<section class="border-b border-border px-4 py-5 sm:px-6" aria-labelledby="response-actions-heading">
									<div class="flex items-end justify-between gap-4">
										<div>
											<h2 id="response-actions-heading" class="text-sm font-semibold">Response actions</h2>
											<p class="mt-1 text-xs text-muted-fg">{{ selectedIncident.actionProgress.completed }} of {{ selectedIncident.actionProgress.total }} required actions complete.</p>
										</div>
										<p class="text-sm font-semibold">{{ selectedIncident.actionProgress.percent }}%</p>
									</div>
									<DomProgress class="mt-3" :value="selectedIncident.actionProgress.percent" size="sm" />
									<div class="mt-4 divide-y divide-border border-y border-border">
										<div v-for="action in selectedIncident.actions" :key="action.id" class="flex flex-wrap items-center gap-3 py-3">
											<DomStatusPill :tone="actionTone(action.status)" :label="action.status.replace('_', ' ')" size="sm" />
											<div class="min-w-48 flex-1">
												<p class="text-sm font-semibold">{{ action.label }}</p>
												<p class="mt-1 text-xs text-muted-fg">{{ action.owner }}<span v-if="action.receipt"> · {{ action.receipt }}</span></p>
											</div>
											<DomBadge v-if="action.required" tone="neutral" variant="soft" size="sm">Required</DomBadge>
											<DomButton
												v-if="action.kind === 'technical' && action.status !== 'done' && selectedIncident.capabilities.canEdit"
												size="sm"
												variant="secondary"
												:loading="busyAction === `advance-${action.id}`"
												@click="advanceAction(action)"
											>{{ action.status === 'waiting' ? 'Start' : 'Complete' }}</DomButton>
											<DomButton v-else-if="action.kind === 'communication' && action.status !== 'done'" size="sm" variant="ghost" @click="activeView = 'updates'">Open update</DomButton>
										</div>
									</div>
								</section>

								<section class="px-4 py-5 sm:px-6" aria-labelledby="service-evidence-heading">
									<div class="flex flex-wrap items-center justify-between gap-3">
										<div>
											<h2 id="service-evidence-heading" class="text-sm font-semibold">Service evidence</h2>
											<p class="mt-1 text-xs text-muted-fg">Provider observations remain separate from the incident narrative.</p>
										</div>
										<DomButton size="sm" variant="secondary" :loading="busyAction === 'refresh-monitoring'" :disabled="!selectedIncident.capabilities.canRefreshMonitoring" @click="refreshMonitoring">Refresh Datadog</DomButton>
									</div>
									<div class="mt-4 divide-y divide-border border-y border-border">
										<div v-for="service in selectedIncident.services" :key="service.id" class="grid gap-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_7rem_11rem] sm:items-center">
											<div><p class="font-semibold">{{ service.name }}</p><p class="mt-1 text-xs font-mono text-muted-fg">{{ service.monitorReceipt }}</p></div>
											<DomStatusPill :tone="serviceTone(service.state)" :label="service.state" size="sm" />
											<p class="text-xs text-muted-fg sm:text-right">{{ service.metric }}</p>
										</div>
									</div>
								</section>
							</div>
						</template>

						<template #evidence>
							<div class="h-full min-h-0 overflow-y-auto p-4 sm:p-6">
								<div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
									<section>
										<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Server readiness</p>
										<div class="mt-3 divide-y divide-border border-y border-border">
											<div v-for="check in selectedIncident.responseChecks" :key="check.key" class="flex gap-3 py-4">
												<DomStatusPill :tone="checkTone(check.status)" :label="check.status" size="sm" class="mt-0.5" />
												<div><p class="text-sm font-semibold">{{ check.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div>
											</div>
										</div>
									</section>
									<DomJsonViewer :value="evidencePayload" title="Provider evidence" :filename="`${selectedIncident.id}-provider-evidence.json`" density="compact" :preview-lines="18" />
								</div>
							</div>
						</template>

						<template #timeline>
							<div class="h-full min-h-0 overflow-y-auto px-4 py-2 sm:px-6">
								<div v-for="item in selectedIncident.activity" :key="item.id" class="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 border-b border-border py-4 last:border-b-0">
									<p class="text-xs font-mono text-muted-fg">{{ formatTime(item.createdAt) }}</p>
									<div>
										<div class="flex flex-wrap items-center gap-2"><p class="text-sm font-semibold">{{ item.title }}</p><DomStatusPill :tone="item.tone" label="" size="sm" /></div>
										<p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.detail }}</p>
										<p class="mt-2 text-[11px] text-muted-fg">{{ item.actor }}</p>
									</div>
								</div>
							</div>
						</template>
					</DomTabs>
				</main>

				<aside
					class="flex h-full min-h-0 flex-col overflow-hidden border-l border-border bg-muted/10"
					:class="activeView === 'updates' ? 'flex' : 'hidden lg:flex'"
					aria-label="Incident updates and lifecycle"
				>
					<div class="shrink-0 border-b border-border px-4 py-4">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Customer liaison</p>
						<h2 class="mt-1 text-lg font-semibold">Incident updates</h2>
						<p class="mt-2 text-xs leading-5 text-muted-fg">Preview the exact audience, components, metrics, and delivery channels before publishing.</p>
					</div>

					<DomTabs v-model="updateTab" :tabs="updateTabs" variant="page" fill class="min-h-0 flex-1">
						<template #compose>
							<div class="h-full min-h-0 overflow-y-auto p-4">
								<div class="grid gap-4">
									<DomSelect v-model="updateDraft.audience" label="Audience" :options="catalogs.audiences" :errors="fieldErrors.audience || []" :disabled="!selectedIncident.capabilities.canEdit" />
									<DomSelect v-model="commandDraft.cadenceMinutes" label="Next update cadence" :options="catalogs.cadences" :errors="fieldErrors.cadenceMinutes || []" :disabled="!selectedIncident.capabilities.canEdit" />
									<DomTextareaInput v-model="updateDraft.message" label="Customer-facing update" description="Describe impact, response, and when customers should expect another update." :rows="6" :errors="fieldErrors.message || []" :disabled="!selectedIncident.capabilities.canEdit" />
									<DomToggle v-model="updateDraft.includeMetrics" label="Include live recovery metrics" description="Attach the current provider snapshot to the immutable delivery record." :disabled="!selectedIncident.capabilities.canEdit" />
									<DomButton :loading="busyAction === 'preview-update'" :disabled="!selectedIncident.capabilities.canPreviewUpdate" @click="previewUpdate">Review exact update</DomButton>
								</div>

								<section v-if="selectedIncident.updatePreview" class="mt-5 border-t border-border pt-5" aria-labelledby="update-preview-heading">
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Immutable communication</p>
									<h3 id="update-preview-heading" class="mt-2 text-sm font-semibold">{{ selectedIncident.updatePreview.audienceLabel }}</h3>
									<dl class="mt-3 divide-y divide-border text-xs">
										<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Recipients</dt><dd class="text-right font-semibold">{{ selectedIncident.updatePreview.recipients }}</dd></div>
										<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Channels</dt><dd class="text-right font-semibold">{{ selectedIncident.updatePreview.channels.join(', ') }}</dd></div>
										<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Approved by</dt><dd class="text-right font-semibold">{{ selectedIncident.updatePreview.approvedBy }}</dd></div>
										<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Checksum</dt><dd class="max-w-48 truncate text-right font-mono">{{ selectedIncident.updatePreview.checksum }}</dd></div>
									</dl>
									<DomCheckbox v-model="publishAcknowledged" class="mt-4" label="Publish this exact message and audience" description="Provider delivery receipts will be retained with the incident timeline." />
									<DomButton class="mt-4 w-full" :disabled="!publishAcknowledged" :loading="busyAction === 'publish-update'" @click="publishUpdate">Publish update</DomButton>
								</section>

								<DomAlert
									v-if="latestUpdate"
									class="mt-5"
									tone="success"
									variant="soft"
									title="Latest update delivered"
									:description="`${latestUpdate.audienceLabel} · ${latestUpdate.providerReceipt}`"
								/>

								<section class="mt-5 border-t border-border pt-5" aria-labelledby="lifecycle-heading">
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Lifecycle gate</p>
									<h3 id="lifecycle-heading" class="mt-2 text-sm font-semibold">{{ selectedIncident.statusMeta.label }}</h3>
									<p class="mt-2 text-xs leading-5 text-muted-fg">{{ selectedIncident.blockers ? `${selectedIncident.blockers} response checks still block the next transition.` : 'All authoritative checks are ready.' }}</p>
									<DomButton v-if="selectedIncident.capabilities.canTransitionMonitoring" class="mt-4 w-full" :loading="busyAction === 'transition-monitoring'" @click="markMonitoring">Move to monitoring</DomButton>
									<div v-else-if="selectedIncident.lifecycle === 'monitoring' && !selectedIncident.resolution" class="mt-4">
										<DomCheckbox v-model="resolutionAcknowledged" label="Resolve with this exact evidence" description="Customer impact, monitoring samples, response actions, and communication receipts are retained." />
										<DomButton class="mt-4 w-full" variant="danger" :disabled="!selectedIncident.capabilities.canResolve || !resolutionAcknowledged" :loading="busyAction === 'transition-resolved'" @click="resolveIncident">Resolve incident</DomButton>
									</div>
									<DomAlert v-else-if="selectedIncident.resolution" class="mt-4" tone="success" title="Incident resolved" :description="`${selectedIncident.resolution.id} · ${selectedIncident.resolution.postmortemId}`" />
								</section>
							</div>
						</template>

						<template #deliveries>
							<div class="h-full min-h-0 overflow-y-auto p-4">
								<DomEmptyState v-if="!selectedIncident.updates.length" compact title="No customer updates" description="Preview and publish a reviewed message to create delivery evidence." />
								<div v-else class="divide-y divide-border border-y border-border">
									<div v-for="update in selectedIncident.updates" :key="update.id" class="py-4">
										<div class="flex items-center justify-between gap-3"><DomStatusPill tone="success" label="Delivered" size="sm" /><p class="text-[11px] text-muted-fg">{{ formatTime(update.publishedAt) }}</p></div>
										<p class="mt-3 text-sm font-semibold">{{ update.audienceLabel }}</p>
										<p class="mt-2 text-xs leading-5 text-muted-fg">{{ update.message }}</p>
										<p class="mt-3 font-mono text-[11px] text-muted-fg">{{ update.providerReceipt }}</p>
									</div>
								</div>
								<DomJsonViewer v-if="latestUpdate" class="mt-5" :value="latestUpdate" title="Latest delivery evidence" :filename="`${selectedIncident.id}-latest-update.json`" density="compact" :preview-lines="14" />
							</div>
						</template>
					</DomTabs>
				</aside>
			</div>
		</div>

		<template #bottom>
			<DomAppBottomNav v-model="activeView" :items="mobileNavigation" class="lg:hidden" />
		</template>

		<template #overlay>
			<DomDialog
				v-model="declareDialogOpen"
				width="min(40rem, 94vw)"
				title="Declare an incident"
				description="Create the response room, source alert evidence, responder bridge, and initial accountable actions."
			>
				<div class="grid gap-4 sm:grid-cols-2">
					<DomTextInput v-model="declarationDraft.title" class="sm:col-span-2" label="Incident title" :errors="fieldErrors.title || []" />
					<DomSelect v-model="declarationDraft.severity" label="Severity" :options="catalogs.severities" :errors="fieldErrors.severity || []" />
					<DomSelect v-model="declarationDraft.serviceId" label="Affected service" :options="catalogs.services" searchable :errors="fieldErrors.serviceId || []" />
					<DomTextareaInput v-model="declarationDraft.impactSummary" class="sm:col-span-2" label="Known customer impact" description="State what customers experience; uncertainty is acceptable when named." :rows="4" :errors="fieldErrors.impactSummary || []" />
				</div>
				<template #footer>
					<DomButton variant="secondary" data-close>Cancel</DomButton>
					<DomButton variant="danger" :loading="busyAction === 'declare-incident'" @click="declareIncident">Declare incident</DomButton>
				</template>
			</DomDialog>
		</template>
	</DomAppShell>
</template>
