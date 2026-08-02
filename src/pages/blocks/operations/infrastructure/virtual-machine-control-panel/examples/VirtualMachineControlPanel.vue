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
	DomNumberInput,
	DomProgress,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/virtual-machine-control-panel';
const machineTabs = [
	{ key: 'overview', label: 'Overview' },
	{ key: 'activity', label: 'Activity' },
	{ key: 'evidence', label: 'Evidence' },
];
const stateOptions = [
	{ label: 'All states', value: 'all' },
	{ label: 'Running', value: 'running' },
	{ label: 'Stopped', value: 'stopped' },
	{ label: 'Provisioning', value: 'provisioning' },
	{ label: 'Booting', value: 'booting' },
	{ label: 'Verifying', value: 'verifying' },
];

const workspace = ref(null);
const machines = ref([]);
const selectedMachine = ref(null);
const provisionPreview = ref(null);
const catalogs = ref({ projects: [], regions: [], images: [], sizes: [], sshKeys: [], backupPolicies: [] });
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const fieldErrors = ref({});
const activeView = ref('machine');
const machineTab = ref('overview');
const stateFilter = ref('all');
const regionFilter = ref('all');
const showProvisionReview = ref(false);
const provisionAcknowledged = ref(false);
const powerDialogOpen = ref(false);
const snapshotDialogOpen = ref(false);
const powerDialog = ref(null);
const snapshotDialog = ref(null);

const provisionDraft = reactive({
	name: 'api-worker-04',
	projectId: 'commerce-prod',
	regionId: 'lon1',
	imageId: 'ubuntu-24-04',
	sizeId: 'balanced-4x16',
	sshKeyId: 'deploy-prod',
	backupPolicyId: 'daily-14',
	diskGb: 160,
	monitoring: true,
	deleteLock: true,
	publicIpv4: false,
	reason: 'Scale API workers before the checkout campaign starts.',
});
const powerDraft = reactive({ action: 'reboot', reason: '', acknowledged: false });
const snapshotDraft = reactive({ name: '', acknowledged: false });

const regionOptions = computed(() => [{ label: 'All regions', value: 'all' }, ...catalogs.value.regions]);
const filteredMachines = computed(() => machines.value.filter((machine) => {
	const stateMatches = stateFilter.value === 'all' || machine.state === stateFilter.value;
	const regionMatches = regionFilter.value === 'all' || machine.regionId === regionFilter.value;
	return stateMatches && regionMatches;
}));
const mobileNavigation = computed(() => [
	{ value: 'fleet', label: 'Fleet', badge: String(workspace.value?.counts?.total || '') },
	{ value: 'machine', label: 'Machine', badge: selectedMachine.value?.job?.status === 'running' ? String(selectedMachine.value.jobProgress?.percent || '') : '' },
	{ value: 'provision', label: 'Provision', badge: provisionPreview.value ? '1' : '' },
]);
const powerOptions = computed(() => selectedMachine.value?.state === 'stopped'
	? [{ label: 'Start machine', value: 'start' }]
	: [{ label: 'Reboot machine', value: 'reboot' }, { label: 'Stop machine', value: 'stop' }]);
const healthChecks = computed(() => selectedMachine.value ? [
	{ key: 'system', label: 'System reachability', value: selectedMachine.value.health.system },
	{ key: 'instance', label: 'Instance reachability', value: selectedMachine.value.health.instance },
	{ key: 'storage', label: 'Attached storage', value: selectedMachine.value.health.storage },
] : []);
const providerEvidence = computed(() => selectedMachine.value ? {
	provider: selectedMachine.value.providerEvidence,
	health: selectedMachine.value.health,
	job: selectedMachine.value.job,
	snapshots: selectedMachine.value.snapshots,
} : null);

onMounted(loadWorkspace);

/**
 * Loads the authoritative compute workspace from the repository-local API.
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
		error.value = requestError.message || 'Unable to load the compute workspace.';
	} finally {
		loading.value = false;
	}
}

/**
 * Sends one JSON mutation and applies the authoritative response.
 *
 * @param {string} path API path below the compute base URL.
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
		error.value = requestError.message || 'Compute operation failed.';
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
 * Replaces client state with the latest server response.
 *
 * @param {Record<string, unknown>} data Authoritative compute workspace.
 * @returns {void}
 */
function setWorkspace(data) {
	workspace.value = data.workspace;
	machines.value = data.machines || [];
	selectedMachine.value = data.selectedMachine || null;
	provisionPreview.value = data.provisionPreview || null;
	catalogs.value = data.catalogs || { projects: [], regions: [], images: [], sizes: [], sshKeys: [], backupPolicies: [] };
	if (!provisionPreview.value) {
		showProvisionReview.value = false;
		provisionAcknowledged.value = false;
	}
}

/**
 * Selects one machine from the fleet rail.
 *
 * @param {string} machineId Stable machine identifier.
 * @returns {Promise<void>}
 */
async function selectMachine(machineId) {
	if (!workspace.value || machineId === selectedMachine.value?.id || busyAction.value) return;
	const data = await mutateWorkspace('/select', {
		revision: workspace.value.revision,
		machineId,
	}, 'select-machine');
	if (data) {
		activeView.value = 'machine';
		machineTab.value = 'overview';
		notice.value = `${data.selectedMachine.name} opened at version ${data.selectedMachine.version}.`;
	}
}

/**
 * Creates an exact provisioning preview from the current draft.
 *
 * @returns {Promise<void>}
 */
async function reviewProvisionPlan() {
	if (!workspace.value) return;
	const data = await mutateWorkspace('/provision/preview', {
		revision: workspace.value.revision,
		...provisionDraft,
	}, 'preview-provision');
	if (data) {
		showProvisionReview.value = true;
		activeView.value = 'provision';
		notice.value = `${data.provisionPreview.checksum} locked the provider request.`;
	}
}

/**
 * Commits the exact acknowledged provisioning plan.
 *
 * @returns {Promise<void>}
 */
async function createVirtualMachine() {
	if (!workspace.value || !provisionPreview.value) return;
	const data = await mutateWorkspace('/provision/commit', {
		revision: workspace.value.revision,
		previewChecksum: provisionPreview.value.checksum,
		acknowledged: provisionAcknowledged.value,
	}, 'commit-provision');
	if (data) {
		activeView.value = 'machine';
		machineTab.value = 'overview';
		provisionDraft.name = nextMachineName();
		notice.value = `${data.provisionReceipt.providerId} accepted ${data.selectedMachine.name}.`;
	}
}

/**
 * Advances the selected machine's deterministic provider job.
 *
 * @returns {Promise<void>}
 */
async function advanceProvisioning() {
	if (!workspace.value || !selectedMachine.value?.job) return;
	const data = await mutateWorkspace(`/jobs/${selectedMachine.value.job.id}/advance`, {
		revision: workspace.value.revision,
		machineVersion: selectedMachine.value.version,
	}, 'advance-provision');
	if (data) notice.value = data.message;
}

/**
 * Opens the power-operation dialog with a valid default action.
 *
 * @returns {void}
 */
function openPowerDialog() {
	fieldErrors.value = {};
	powerDraft.action = selectedMachine.value?.state === 'stopped' ? 'start' : 'reboot';
	powerDraft.reason = selectedMachine.value?.state === 'stopped'
		? 'Resume this workload after the planned maintenance window.'
		: 'Apply the approved maintenance change to this workload.';
	powerDraft.acknowledged = false;
	powerDialogOpen.value = true;
	powerDialog.value?.open();
}

/**
 * Executes an acknowledged power operation.
 *
 * @returns {Promise<void>}
 */
async function executePowerAction() {
	if (!workspace.value || !selectedMachine.value) return;
	const data = await mutateWorkspace(`/machines/${selectedMachine.value.id}/power`, {
		revision: workspace.value.revision,
		machineVersion: selectedMachine.value.version,
		...powerDraft,
	}, 'power-action');
	if (data) {
		powerDialogOpen.value = false;
		notice.value = `${data.powerReceipt.id} completed the ${data.powerReceipt.action} operation.`;
	}
}

/**
 * Opens the snapshot dialog with a machine-scoped name.
 *
 * @returns {void}
 */
function openSnapshotDialog() {
	fieldErrors.value = {};
	snapshotDraft.name = `${selectedMachine.value?.name || 'machine'}-before-release`;
	snapshotDraft.acknowledged = false;
	snapshotDialogOpen.value = true;
	snapshotDialog.value?.open();
}

/**
 * Creates an acknowledged machine snapshot.
 *
 * @returns {Promise<void>}
 */
async function createSnapshot() {
	if (!workspace.value || !selectedMachine.value) return;
	const data = await mutateWorkspace(`/machines/${selectedMachine.value.id}/snapshots`, {
		revision: workspace.value.revision,
		machineVersion: selectedMachine.value.version,
		...snapshotDraft,
	}, 'create-snapshot');
	if (data) {
		snapshotDialogOpen.value = false;
		notice.value = `${data.snapshotReceipt.providerReceipt} retained the snapshot.`;
	}
}

/**
 * Restores the seeded compute workspace and default draft.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	const data = await mutateWorkspace('/reset', {}, 'reset-workspace');
	if (data) {
		activeView.value = 'machine';
		machineTab.value = 'overview';
		stateFilter.value = 'all';
		regionFilter.value = 'all';
		showProvisionReview.value = false;
		provisionDraft.name = 'api-worker-04';
		notice.value = 'Compute workspace restored.';
	}
}

/**
 * Returns the next unused API worker hostname.
 *
 * @returns {string} Suggested machine hostname.
 */
function nextMachineName() {
	let number = 4;
	while (machines.value.some((machine) => machine.name === `api-worker-${String(number).padStart(2, '0')}`)) number += 1;
	return `api-worker-${String(number).padStart(2, '0')}`;
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
 * Returns a semantic tone for a provider health value.
 *
 * @param {string} value Health value.
 * @returns {string} DOM Studio tone.
 */
function healthTone(value) {
	if (value === 'passed') return 'success';
	if (value === 'pending') return 'info';
	if (value === 'not-running') return 'neutral';
	return 'danger';
}

/**
 * Returns a semantic tone for a provider job step.
 *
 * @param {string} value Job-step status.
 * @returns {string} DOM Studio tone.
 */
function jobStepTone(value) {
	return value === 'done' ? 'success' : 'neutral';
}

/**
 * Formats an ISO timestamp for the activity view.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Localized date and time.
 */
function formatTime(value) {
	if (!value) return 'Pending';
	return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
</script>

<template>
	<DomAppShell variant="app" class="!h-dvh">
		<template #top>
			<DomAppTopBar
				title="Compute"
				:subtitle="workspace ? `${workspace.counts.running} running · $${workspace.monthlySpend}/mo` : 'Infrastructure operations'"
			>
				<template #leading>
					<DomBadge tone="primary" variant="soft">VM</DomBadge>
				</template>
				<template #trailing>
					<DomBadge v-if="workspace" tone="neutral" variant="soft" class="!hidden sm:!inline-flex">r{{ workspace.revision }}</DomBadge>
					<DomButton class="!hidden sm:!inline-flex" size="sm" variant="secondary" :loading="busyAction === 'reset-workspace'" @click="resetWorkspace">Reset</DomButton>
					<DomButton class="!hidden sm:!inline-flex" size="sm" @click="activeView = 'provision'">Provision machine</DomButton>
				</template>
			</DomAppTopBar>
		</template>

		<div class="relative h-full min-h-0 overflow-hidden">
			<div v-if="error || notice" class="absolute inset-x-3 top-3 z-20 mx-auto max-w-2xl">
				<DomAlert v-if="error" tone="danger" variant="toast" title="Compute operation failed" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-else tone="success" variant="toast" title="Compute workspace updated" :description="notice" dismissible @dismiss="notice = ''" />
			</div>

			<div v-if="loading" class="grid h-full lg:grid-cols-[17rem_minmax(0,1fr)_23rem]">
				<div v-for="column in 3" :key="column" class="space-y-3 border-r border-border p-4 last:border-r-0">
					<DomSkeleton height="h-8" width="w-2/3" />
					<DomSkeleton v-for="row in 6" :key="row" height="h-16" />
				</div>
			</div>

			<DomEmptyState
				v-else-if="!workspace || !selectedMachine"
				title="Compute workspace unavailable"
				description="Reload the repository-local API to restore the machine fleet."
			>
				<DomButton @click="loadWorkspace">Reload workspace</DomButton>
			</DomEmptyState>

			<div v-else class="grid h-full min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[17rem_minmax(0,1fr)_23rem]">
				<aside
					class="h-full min-h-0 overflow-y-auto border-r border-border bg-muted/10"
					:class="activeView === 'fleet' ? 'block' : 'hidden lg:block'"
					aria-label="Virtual machine fleet"
				>
					<div class="grid grid-cols-3 border-b border-border text-center">
						<div class="px-2 py-3"><p class="text-[11px] text-muted-fg">Machines</p><p class="mt-1 text-lg font-semibold">{{ workspace.counts.total }}</p></div>
						<div class="border-l border-border px-2 py-3"><p class="text-[11px] text-muted-fg">Running</p><p class="mt-1 text-lg font-semibold">{{ workspace.counts.running }}</p></div>
						<div class="border-l border-border px-2 py-3"><p class="text-[11px] text-muted-fg">Building</p><p class="mt-1 text-lg font-semibold">{{ workspace.counts.provisioning }}</p></div>
					</div>
					<div class="grid gap-3 border-b border-border p-3">
						<DomSelect v-model="stateFilter" label="State" :options="stateOptions" />
						<DomSelect v-model="regionFilter" label="Region" :options="regionOptions" searchable />
					</div>
					<div v-if="filteredMachines.length" class="divide-y divide-border">
						<DomAppListItem
							v-for="machine in filteredMachines"
							:key="machine.id"
							:label="machine.name"
							:description="`${machine.project} · ${machine.cpu} vCPU / ${machine.memoryGb} GB`"
							:meta="`$${machine.monthlyCost}/mo`"
							:selected="machine.id === selectedMachine.id"
							@click="selectMachine(machine.id)"
						>
							<template #icon>
								<span class="size-2.5 rounded-full" :class="machine.stateMeta.tone === 'success' ? 'bg-success' : machine.stateMeta.tone === 'info' ? 'bg-primary' : 'bg-muted-fg'" aria-hidden="true"></span>
							</template>
							<template #trailing>
								<DomBadge v-if="machine.jobProgress" tone="primary" size="sm">{{ machine.jobProgress.percent }}%</DomBadge>
							</template>
						</DomAppListItem>
					</div>
					<DomEmptyState v-else compact title="No matching machines" description="Change the state or region filters." />
					<div class="p-3">
						<DomButton class="w-full" @click="activeView = 'provision'">Provision machine</DomButton>
						<DomButton class="mt-2 w-full sm:hidden" variant="ghost" :loading="busyAction === 'reset-workspace'" @click="resetWorkspace">Reset demo</DomButton>
					</div>
				</aside>

				<main
					class="flex h-full min-h-0 flex-col overflow-hidden"
					:class="activeView === 'machine' ? 'flex' : 'hidden lg:flex'"
					aria-labelledby="machine-heading"
				>
					<header class="shrink-0 border-b border-border px-4 py-4 sm:px-6">
						<div class="flex flex-wrap items-start justify-between gap-4">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<DomStatusPill :tone="selectedMachine.stateMeta.tone" :label="selectedMachine.stateMeta.label" size="sm" />
									<DomBadge tone="neutral" variant="soft">v{{ selectedMachine.version }}</DomBadge>
									<DomBadge v-if="selectedMachine.healthPassed" tone="success" variant="soft">3/3 checks</DomBadge>
								</div>
								<h1 id="machine-heading" class="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{{ selectedMachine.name }}</h1>
								<p class="mt-2 text-sm text-muted-fg">{{ selectedMachine.project }} · {{ selectedMachine.region }} · {{ selectedMachine.providerId }}</p>
							</div>
							<div class="flex flex-wrap gap-2">
								<DomButton size="sm" variant="secondary" :disabled="!selectedMachine.capabilities.canSnapshot" @click="openSnapshotDialog">Snapshot</DomButton>
								<DomButton size="sm" variant="secondary" :disabled="!selectedMachine.capabilities.canPower" @click="openPowerDialog">Power action</DomButton>
							</div>
						</div>
					</header>

					<div class="grid shrink-0 grid-cols-2 border-b border-border sm:grid-cols-4">
						<div class="border-r border-border px-4 py-3"><p class="text-[11px] uppercase tracking-wide text-muted-fg">Compute</p><p class="mt-1 text-lg font-semibold">{{ selectedMachine.cpu }} vCPU</p></div>
						<div class="border-r border-border px-4 py-3"><p class="text-[11px] uppercase tracking-wide text-muted-fg">Memory</p><p class="mt-1 text-lg font-semibold">{{ selectedMachine.memoryGb }} GB</p></div>
						<div class="border-r border-border px-4 py-3"><p class="text-[11px] uppercase tracking-wide text-muted-fg">Boot disk</p><p class="mt-1 text-lg font-semibold">{{ selectedMachine.diskGb }} GB</p></div>
						<div class="px-4 py-3"><p class="text-[11px] uppercase tracking-wide text-muted-fg">Monthly</p><p class="mt-1 text-lg font-semibold">${{ selectedMachine.monthlyCost }}</p></div>
					</div>

					<DomTabs v-model="machineTab" :tabs="machineTabs" variant="page" fill class="min-h-0 flex-1">
						<template #overview>
							<div class="h-full min-h-0 overflow-y-auto">
								<section v-if="selectedMachine.job" class="border-b border-border px-4 py-5 sm:px-6" aria-labelledby="provision-job-heading">
									<div class="flex flex-wrap items-end justify-between gap-3">
										<div>
											<h2 id="provision-job-heading" class="text-sm font-semibold">Provider provisioning</h2>
											<p class="mt-1 text-xs text-muted-fg">{{ selectedMachine.job.id }} · {{ selectedMachine.jobProgress.completed }} of {{ selectedMachine.jobProgress.total }} steps complete.</p>
										</div>
										<DomButton v-if="selectedMachine.capabilities.canAdvanceJob" size="sm" :loading="busyAction === 'advance-provision'" @click="advanceProvisioning">Refresh provider</DomButton>
									</div>
									<DomProgress class="mt-3" :value="selectedMachine.jobProgress.percent" size="sm" />
									<div class="mt-4 divide-y divide-border border-y border-border">
										<div v-for="step in selectedMachine.job.steps" :key="step.key" class="flex items-center gap-3 py-3">
											<DomStatusPill :tone="jobStepTone(step.status)" :label="step.status" size="sm" />
											<div class="min-w-0 flex-1"><p class="text-sm font-semibold">{{ step.label }}</p><p class="mt-1 truncate font-mono text-[11px] text-muted-fg">{{ step.receipt || 'Waiting for provider evidence' }}</p></div>
										</div>
									</div>
								</section>

								<section class="border-b border-border px-4 py-5 sm:px-6" aria-labelledby="health-heading">
									<div class="flex flex-wrap items-start justify-between gap-3">
										<div><h2 id="health-heading" class="text-sm font-semibold">Provider status checks</h2><p class="mt-1 text-xs text-muted-fg">System, guest, and attached-storage reachability remain distinct evidence.</p></div>
										<p class="font-mono text-[11px] text-muted-fg">{{ selectedMachine.health.providerReceipt || 'Pending provider receipt' }}</p>
									</div>
									<div class="mt-4 divide-y divide-border border-y border-border">
										<div v-for="check in healthChecks" :key="check.key" class="flex items-center justify-between gap-3 py-3">
											<p class="text-sm font-semibold">{{ check.label }}</p>
											<DomStatusPill :tone="healthTone(check.value)" :label="check.value.replace('-', ' ')" size="sm" />
										</div>
									</div>
								</section>

								<section class="grid gap-0 sm:grid-cols-2" aria-label="Machine configuration">
									<div class="border-b border-border px-4 py-5 sm:border-r sm:px-6">
										<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Configuration</p>
										<dl class="mt-3 divide-y divide-border text-sm">
											<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Image</dt><dd class="text-right font-semibold">{{ selectedMachine.image }}</dd></div>
											<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Size</dt><dd class="text-right font-semibold">{{ selectedMachine.size }}</dd></div>
											<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Private IP</dt><dd class="font-mono text-right">{{ selectedMachine.privateIp }}</dd></div>
											<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Public IP</dt><dd class="font-mono text-right">{{ selectedMachine.publicIp || 'None' }}</dd></div>
										</dl>
									</div>
									<div class="border-b border-border px-4 py-5 sm:px-6">
										<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Protection</p>
										<dl class="mt-3 divide-y divide-border text-sm">
											<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Backups</dt><dd class="text-right font-semibold">{{ selectedMachine.backupPolicy }}</dd></div>
											<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Monitoring</dt><dd class="text-right font-semibold">{{ selectedMachine.protection.monitoring ? 'Enabled' : 'Disabled' }}</dd></div>
											<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Delete lock</dt><dd class="text-right font-semibold">{{ selectedMachine.protection.deleteLock ? 'Enabled' : 'Disabled' }}</dd></div>
											<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Created</dt><dd class="text-right font-semibold">{{ formatTime(selectedMachine.createdAt) }}</dd></div>
										</dl>
									</div>
								</section>

								<section class="px-4 py-5 sm:px-6" aria-labelledby="snapshots-heading">
									<div class="flex items-center justify-between gap-3"><div><h2 id="snapshots-heading" class="text-sm font-semibold">Snapshots</h2><p class="mt-1 text-xs text-muted-fg">Immutable provider images retained for recovery.</p></div><DomBadge tone="neutral" variant="soft">{{ selectedMachine.snapshots.length }}</DomBadge></div>
									<DomEmptyState v-if="!selectedMachine.snapshots.length" compact title="No snapshots yet" description="Create a named recovery point before a risky release or maintenance change." />
									<div v-else class="mt-4 divide-y divide-border border-y border-border">
										<div v-for="snapshot in selectedMachine.snapshots" :key="snapshot.id" class="flex flex-wrap items-center justify-between gap-3 py-3"><div><p class="text-sm font-semibold">{{ snapshot.name }}</p><p class="mt-1 font-mono text-[11px] text-muted-fg">{{ snapshot.providerReceipt }}</p></div><DomStatusPill tone="success" :label="snapshot.state" size="sm" /></div>
									</div>
								</section>
							</div>
						</template>

						<template #activity>
							<div class="h-full min-h-0 overflow-y-auto px-4 py-2 sm:px-6">
								<div v-for="item in selectedMachine.activity" :key="item.id" class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 border-b border-border py-4 last:border-b-0">
									<p class="text-[11px] text-muted-fg">{{ formatTime(item.createdAt) }}</p>
									<div><div class="flex flex-wrap items-center gap-2"><p class="text-sm font-semibold">{{ item.title }}</p><DomStatusPill :tone="item.tone" label="" size="sm" /></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.detail }}</p><p class="mt-2 text-[11px] text-muted-fg">{{ item.actor }}</p></div>
								</div>
							</div>
						</template>

						<template #evidence>
							<div class="h-full min-h-0 overflow-y-auto p-4 sm:p-6">
								<DomJsonViewer :value="providerEvidence" title="Provider evidence" :filename="`${selectedMachine.id}-provider-evidence.json`" density="compact" :preview-lines="24" />
							</div>
						</template>
					</DomTabs>
				</main>

				<aside
					class="flex h-full min-h-0 flex-col overflow-hidden border-l border-border bg-muted/10"
					:class="activeView === 'provision' ? 'flex' : 'hidden lg:flex'"
					aria-label="Provision a virtual machine"
				>
					<div class="shrink-0 border-b border-border px-4 py-4">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Provider request</p>
						<h2 class="mt-1 text-lg font-semibold">Provision machine</h2>
						<p class="mt-2 text-xs leading-5 text-muted-fg">Review one exact image, size, network, access, protection, and cost plan before creating compute.</p>
					</div>

					<div class="min-h-0 flex-1 overflow-y-auto p-4">
						<form v-if="!showProvisionReview" class="grid gap-4" @submit.prevent="reviewProvisionPlan">
							<DomTextInput v-model="provisionDraft.name" label="Hostname" placeholder="api-worker-04" :errors="fieldErrors.name || []" />
							<DomSelect v-model="provisionDraft.projectId" label="Project" :options="catalogs.projects" searchable :errors="fieldErrors.projectId || []" />
							<DomSelect v-model="provisionDraft.regionId" label="Region" :options="catalogs.regions" searchable :errors="fieldErrors.regionId || []" />
							<DomSelect v-model="provisionDraft.imageId" label="Image" :options="catalogs.images" searchable :errors="fieldErrors.imageId || []" />
							<DomSelect v-model="provisionDraft.sizeId" label="Machine size" :options="catalogs.sizes" searchable :errors="fieldErrors.sizeId || []" />
							<DomNumberInput v-model="provisionDraft.diskGb" label="Boot disk GB" :min="20" :max="640" :step="20" :errors="fieldErrors.diskGb || []" />
							<DomSelect v-model="provisionDraft.sshKeyId" label="SSH key" :options="catalogs.sshKeys" searchable :errors="fieldErrors.sshKeyId || []" />
							<DomSelect v-model="provisionDraft.backupPolicyId" label="Backup policy" :options="catalogs.backupPolicies" :errors="fieldErrors.backupPolicyId || []" />
							<DomTextareaInput v-model="provisionDraft.reason" label="Provisioning reason" description="Retained with the provider request and audit receipt." :rows="4" :errors="fieldErrors.reason || []" />
							<DomToggle v-model="provisionDraft.monitoring" label="Detailed monitoring" description="Install provider metrics and alerting on first boot." />
							<DomToggle v-model="provisionDraft.deleteLock" label="Delete lock" description="Block destructive API actions until protection is removed." />
							<DomToggle v-model="provisionDraft.publicIpv4" label="Public IPv4" description="Subject to project firewall and exposure policy." />
							<DomButton type="submit" :loading="busyAction === 'preview-provision'">Review exact plan</DomButton>
						</form>

						<div v-else-if="provisionPreview" class="grid gap-5">
							<section aria-labelledby="exact-plan-heading">
								<div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Exact plan</p><h3 id="exact-plan-heading" class="mt-1 text-sm font-semibold">{{ provisionPreview.values.name }}</h3></div><DomBadge tone="primary" variant="soft">${{ provisionPreview.estimate.monthly }}/mo</DomBadge></div>
								<dl class="mt-3 divide-y divide-border border-y border-border text-xs">
									<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Project</dt><dd class="text-right font-semibold">{{ provisionPreview.providerRequest.project }}</dd></div>
									<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Region</dt><dd class="text-right font-semibold">{{ provisionPreview.providerRequest.region }}</dd></div>
									<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Image</dt><dd class="text-right font-semibold">{{ provisionPreview.providerRequest.image }}</dd></div>
									<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Size</dt><dd class="text-right font-semibold">{{ provisionPreview.providerRequest.size }}</dd></div>
									<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Projected spend</dt><dd class="text-right font-semibold">${{ provisionPreview.estimate.projectedProjectSpend }}/mo</dd></div>
									<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Checksum</dt><dd class="max-w-48 truncate text-right font-mono">{{ provisionPreview.checksum }}</dd></div>
								</dl>
							</section>

							<section aria-labelledby="policy-checks-heading">
								<h3 id="policy-checks-heading" class="text-sm font-semibold">Server policy checks</h3>
								<div class="mt-3 divide-y divide-border border-y border-border">
									<div v-for="check in provisionPreview.checks" :key="check.key" class="flex gap-3 py-3"><DomStatusPill :tone="check.status === 'passed' ? 'success' : 'danger'" :label="check.status" size="sm" class="mt-0.5" /><div><p class="text-xs font-semibold">{{ check.label }}</p><p class="mt-1 text-[11px] leading-5 text-muted-fg">{{ check.detail }}</p></div></div>
								</div>
							</section>

							<DomCheckbox v-model="provisionAcknowledged" label="Create this exact provider request" description="The image checksum, network policy, monthly estimate, and audit reason will be retained." />
							<DomButton :disabled="!provisionAcknowledged || provisionPreview.checks.some((check) => check.status !== 'passed')" :loading="busyAction === 'commit-provision'" @click="createVirtualMachine">Provision machine</DomButton>
							<DomButton variant="ghost" @click="showProvisionReview = false">Edit configuration</DomButton>
						</div>
					</div>
				</aside>
			</div>
		</div>

		<template #bottom>
			<DomAppBottomNav v-model="activeView" :items="mobileNavigation" class="lg:hidden" />
		</template>

		<template #overlay>
			<DomDialog
				ref="powerDialog"
				v-model="powerDialogOpen"
				class="pointer-events-auto"
				width="min(34rem, 94vw)"
				title="Change machine power state"
				:description="`Apply one provider operation to ${selectedMachine?.name || 'this machine'} with retained impact acknowledgement.`"
			>
				<div class="grid gap-4">
					<DomSelect v-model="powerDraft.action" label="Power action" :options="powerOptions" :errors="fieldErrors.action || []" />
					<DomTextareaInput v-model="powerDraft.reason" label="Operational reason" :rows="4" :errors="fieldErrors.reason || []" />
					<DomCheckbox v-model="powerDraft.acknowledged" label="I understand the workload impact" description="The provider receipt, actor, reason, and resulting state will be retained." :errors="fieldErrors.acknowledged || []" />
				</div>
				<template #footer>
					<DomButton variant="secondary" data-close>Cancel</DomButton>
					<DomButton variant="danger" :disabled="!powerDraft.acknowledged" :loading="busyAction === 'power-action'" @click="executePowerAction">Run power action</DomButton>
				</template>
			</DomDialog>

			<DomDialog
				ref="snapshotDialog"
				v-model="snapshotDialogOpen"
				class="pointer-events-auto"
				width="min(34rem, 94vw)"
				title="Create recovery snapshot"
				:description="`Capture the ${selectedMachine?.diskGb || 0} GB boot disk for ${selectedMachine?.name || 'this machine'}.`"
			>
				<div class="grid gap-4">
					<DomTextInput v-model="snapshotDraft.name" label="Snapshot name" :errors="fieldErrors.name || []" />
					<DomCheckbox v-model="snapshotDraft.acknowledged" label="Retain this snapshot and storage charge" description="The provider checksum and creator will be written to machine activity." :errors="fieldErrors.acknowledged || []" />
				</div>
				<template #footer>
					<DomButton variant="secondary" data-close>Cancel</DomButton>
					<DomButton :disabled="!snapshotDraft.acknowledged" :loading="busyAction === 'create-snapshot'" @click="createSnapshot">Create snapshot</DomButton>
				</template>
			</DomDialog>
		</template>
	</DomAppShell>
</template>
