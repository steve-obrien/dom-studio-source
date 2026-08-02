<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomAppBottomNav,
	DomAppListItem,
	DomAppShell,
	DomAppTopBar,
	DomAvatar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDataGrid,
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

const apiBase = '/api/block-demos/bulk-actions';
const tabs = [
	{ key: 'select', label: 'Select' },
	{ key: 'review', label: 'Review impact' },
	{ key: 'run', label: 'Run' },
];
const columns = [
	{ key: 'name', label: 'Account', type: 'text', width: '14rem' },
	{
		key: 'status',
		label: 'Status',
		type: 'select',
		width: '9rem',
		options: [
			{ value: 'At risk', label: 'At risk', tone: 'red' },
			{ value: 'Renewal due', label: 'Renewal due', tone: 'amber' },
			{ value: 'Open invoice', label: 'Open invoice', tone: 'amber' },
			{ value: 'Healthy', label: 'Healthy', tone: 'green' },
			{ value: 'Contract review', label: 'Contract review', tone: 'blue' },
			{ value: 'Billing paused', label: 'Billing paused', tone: 'neutral' },
			{ value: 'Trial', label: 'Trial', tone: 'violet' },
			{ value: 'Compliance hold', label: 'Compliance hold', tone: 'red' },
		],
	},
	{ key: 'plan', label: 'Plan', type: 'select', width: '8rem' },
	{ key: 'owner', label: 'Owner', type: 'text', width: '10rem' },
	{ key: 'revenue', label: 'Monthly value', type: 'currency', currency: 'USD', width: '9rem' },
	{ key: 'users', label: 'Users', type: 'number', width: '6rem' },
	{
		key: 'risk',
		label: 'Risk',
		type: 'select',
		width: '7rem',
		options: [
			{ value: 'high', label: 'High', tone: 'red' },
			{ value: 'medium', label: 'Medium', tone: 'amber' },
			{ value: 'low', label: 'Low', tone: 'green' },
		],
	},
	{ key: 'version', label: 'Version', type: 'number', width: '6rem' },
];

const workspace = ref(null);
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const activeView = ref('select');
const segment = ref('all');
const search = ref('');
const actionId = ref('pause-billing');
const reason = ref('');
const notifyCustomers = ref(true);
const approvalDialogOpen = ref(false);
const approvalNote = ref('Finance review requested for the revenue hold batch.');
const queueDialogOpen = ref(false);
const queueAcknowledged = ref(false);

const selectedIds = computed(getSelectedIds);
const filteredAccounts = computed(getFilteredAccounts);
const activeAction = computed(getActiveAction);
const mobileNavigation = computed(getMobileNavigation);
const jobProgress = computed(getJobProgress);
const failedResults = computed(getFailedResults);
const previewEvidence = computed(buildPreviewEvidence);
const jobEvidence = computed(buildJobEvidence);

onMounted(loadWorkspace);

/**
 * Loads the current bulk action workspace from the deterministic API.
 *
 * @param {boolean} clearMessages Whether existing feedback should be cleared.
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
		error.value = requestError.message || 'Unable to load bulk operations.';
	} finally {
		loading.value = false;
	}
}

/**
 * Sends one mutation and refreshes the local workspace from its response.
 *
 * @param {string} path API path below the block base URL.
 * @param {Record<string, unknown>} body JSON body.
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
		error.value = requestError.message || 'Bulk operation failed.';
		if (requestError.status === 409) await refreshAfterConflict();
		return null;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Refreshes authoritative state after an exact-revision conflict.
 *
 * @returns {Promise<void>}
 */
async function refreshAfterConflict() {
	try {
		const response = await fetch(`${apiBase}/bootstrap`);
		const data = await response.json();
		if (response.ok) setWorkspace(data);
	} catch {
		// Keep the original conflict message visible when refresh also fails.
	}
}

/**
 * Replaces client state and synchronizes editable draft controls.
 *
 * @param {object} data API workspace.
 * @returns {void}
 */
function setWorkspace(data) {
	workspace.value = data;
	actionId.value = data.draft.actionId;
	reason.value = data.draft.reason;
	notifyCustomers.value = data.draft.notifyCustomers;
	if (data.job) activeView.value = 'run';
	else if (data.preview) activeView.value = 'review';
}

/**
 * Persists a complete row-selection update.
 *
 * @param {string[]} nextIds Selected account ids.
 * @returns {Promise<void>}
 */
async function saveSelection(nextIds) {
	if (!workspace.value || busyAction.value) return;
	const data = await mutateWorkspace('/draft', {
		revision: workspace.value.revision,
		selectedIds: nextIds,
	}, 'selection');
	if (data) notice.value = `${data.summary.selected} accounts selected.`;
}

/**
 * Toggles one account from the mobile selection list.
 *
 * @param {string} accountId Account identifier.
 * @returns {Promise<void>}
 */
async function toggleAccount(accountId) {
	const nextIds = selectedIds.value.includes(accountId)
		? selectedIds.value.filter((id) => id !== accountId)
		: [...selectedIds.value, accountId];
	await saveSelection(nextIds);
}

/**
 * Selects every currently visible account.
 *
 * @returns {Promise<void>}
 */
async function selectVisibleAccounts() {
	const nextIds = [...new Set([...selectedIds.value, ...filteredAccounts.value.map((account) => account.id)])];
	await saveSelection(nextIds);
}

/**
 * Clears the current account selection.
 *
 * @returns {Promise<void>}
 */
async function clearSelection() {
	await saveSelection([]);
}

/**
 * Creates a server-owned impact preview from the current controls.
 *
 * @returns {Promise<void>}
 */
async function createPreview() {
	if (!workspace.value) return;
	const data = await mutateWorkspace('/preview', {
		revision: workspace.value.revision,
		selectedIds: selectedIds.value,
		actionId: actionId.value,
		reason: reason.value,
		notifyCustomers: notifyCustomers.value,
	}, 'preview');
	if (!data) return;
	activeView.value = 'review';
	notice.value = `Impact preview ${data.preview.receipt} created.`;
}

/**
 * Opens the approval request dialog with a useful default note.
 *
 * @returns {void}
 */
function openApprovalDialog() {
	approvalNote.value = `Finance review requested for ${workspace.value?.preview?.eligibleCount || 0} eligible accounts and ${formatCurrency(workspace.value?.preview?.impactedRevenue || 0)} in monthly value.`;
	approvalDialogOpen.value = true;
}

/**
 * Routes the current immutable preview to its accountable reviewer.
 *
 * @returns {Promise<void>}
 */
async function requestApproval() {
	if (!workspace.value?.preview) return;
	const data = await mutateWorkspace('/approvals/request', {
		revision: workspace.value.revision,
		previewId: workspace.value.preview.id,
		note: approvalNote.value,
	}, 'request-approval');
	if (!data) return;
	approvalDialogOpen.value = false;
	notice.value = `Approval routed to ${data.approval.owner}.`;
}

/**
 * Simulates the finance reviewer approving the current preview.
 *
 * @returns {Promise<void>}
 */
async function simulateApproval() {
	if (!workspace.value?.approval) return;
	const data = await mutateWorkspace(`/approvals/${workspace.value.approval.id}/decide`, {
		revision: workspace.value.revision,
		decision: 'approved',
	}, 'approve');
	if (data) notice.value = `${data.approval.owner} approved the immutable preview.`;
}

/**
 * Opens the queue confirmation dialog.
 *
 * @returns {void}
 */
function openQueueDialog() {
	queueAcknowledged.value = false;
	queueDialogOpen.value = true;
}

/**
 * Queues the current immutable preview as a background job.
 *
 * @returns {Promise<void>}
 */
async function queueJob() {
	if (!workspace.value?.preview) return;
	const data = await mutateWorkspace('/jobs', {
		revision: workspace.value.revision,
		previewId: workspace.value.preview.id,
		acknowledged: queueAcknowledged.value,
	}, 'queue');
	if (!data) return;
	queueDialogOpen.value = false;
	activeView.value = 'run';
	notice.value = `${data.job.id} queued from ${data.job.previewReceipt}.`;
}

/**
 * Advances the deterministic background worker by one stage.
 *
 * @returns {Promise<void>}
 */
async function advanceJob() {
	if (!workspace.value?.job) return;
	const data = await mutateWorkspace(`/jobs/${workspace.value.job.id}/advance`, {
		revision: workspace.value.revision,
	}, 'advance');
	if (!data) return;
	notice.value = data.job.status === 'working'
		? `${data.job.progress} of ${data.job.total} records processed.`
		: data.job.status === 'completed-with-errors'
			? 'Job completed with a safe-update conflict.'
			: 'Every eligible record completed.';
}

/**
 * Cancels a queued job before processing begins.
 *
 * @returns {Promise<void>}
 */
async function cancelJob() {
	if (!workspace.value?.job) return;
	const data = await mutateWorkspace(`/jobs/${workspace.value.job.id}/cancel`, {
		revision: workspace.value.revision,
	}, 'cancel');
	if (data) notice.value = `Queued job cancelled with ${data.job.receipt}.`;
}

/**
 * Retries one failed safe-update result against the current account version.
 *
 * @param {string} resultId Failed result identifier.
 * @returns {Promise<void>}
 */
async function retryResult(resultId) {
	if (!workspace.value?.job) return;
	const data = await mutateWorkspace(`/jobs/${workspace.value.job.id}/retry`, {
		revision: workspace.value.revision,
		resultId,
	}, 'retry');
	if (data) notice.value = `Conflict refreshed and applied with ${data.job.retryReceipt}.`;
}

/**
 * Invalidates the prepared preview and returns to editable draft state.
 *
 * @returns {Promise<void>}
 */
async function editDraft() {
	if (!workspace.value) return;
	const data = await mutateWorkspace('/draft', {
		revision: workspace.value.revision,
		actionId: actionId.value,
		reason: reason.value,
		notifyCustomers: notifyCustomers.value,
	}, 'edit');
	if (!data) return;
	activeView.value = 'select';
	notice.value = 'Preview cleared. The batch can be edited again.';
}

/**
 * Restores the deterministic workspace and starting selection.
 *
 * @returns {Promise<void>}
 */
async function resetDemo() {
	const data = await mutateWorkspace('/reset', {}, 'reset');
	if (!data) return;
	activeView.value = 'select';
	segment.value = 'all';
	search.value = '';
	notice.value = 'Bulk operations workspace restored.';
}

/**
 * Responds to mobile bottom-navigation changes.
 *
 * @param {{ value: string }} item Selected navigation item.
 * @returns {void}
 */
function changeMobileDestination(item) {
	activeView.value = item.value;
}

/**
 * Clears user-visible success and error feedback.
 *
 * @returns {void}
 */
function clearFeedback() {
	error.value = '';
	notice.value = '';
}

/**
 * Returns the server-owned selected account ids.
 *
 * @returns {string[]} Selected ids.
 */
function getSelectedIds() {
	return workspace.value?.draft?.selectedIds || [];
}

/**
 * Filters account rows for the current segment and search text.
 *
 * @returns {object[]} Visible accounts.
 */
function getFilteredAccounts() {
	if (!workspace.value) return [];
	const query = search.value.trim().toLowerCase();
	return workspace.value.accounts.filter((account) => {
		const matchesSegment = segment.value === 'all'
			|| (segment.value === 'selected' && selectedIds.value.includes(account.id))
			|| (segment.value === 'at-risk' && (account.risk === 'high' || account.status === 'At risk'))
			|| (segment.value === 'open-invoice' && account.openInvoice)
			|| (segment.value === 'billing-active' && ['active', 'trial'].includes(account.billingStatus));
		const matchesSearch = !query || [account.name, account.owner, account.plan, account.status].some((value) => String(value).toLowerCase().includes(query));
		return matchesSegment && matchesSearch;
	});
}

/**
 * Returns the selected bulk action definition.
 *
 * @returns {object|null} Action definition or null.
 */
function getActiveAction() {
	return workspace.value?.catalog?.actions.find((action) => action.value === actionId.value) || null;
}

/**
 * Builds compact mobile navigation with useful state badges.
 *
 * @returns {object[]} Mobile navigation items.
 */
function getMobileNavigation() {
	return [
		{ value: 'select', label: 'Select', badge: workspace.value?.summary?.selected ? String(workspace.value.summary.selected) : '' },
		{ value: 'review', label: 'Review', badge: workspace.value?.preview?.excludedCount ? String(workspace.value.preview.excludedCount) : '' },
		{ value: 'run', label: 'Run', badge: failedResults.value.length ? String(failedResults.value.length) : '' },
	];
}

/**
 * Calculates deterministic job progress as a percentage.
 *
 * @returns {number} Progress percentage.
 */
function getJobProgress() {
	if (!workspace.value?.job?.total) return 0;
	return Math.round((workspace.value.job.progress / workspace.value.job.total) * 100);
}

/**
 * Returns failed job results that can be retried.
 *
 * @returns {object[]} Failed results.
 */
function getFailedResults() {
	return workspace.value?.job?.results?.filter((result) => result.status === 'failed') || [];
}

/**
 * Builds the immutable preview payload shown to operators.
 *
 * @returns {object|null} Preview evidence payload or null.
 */
function buildPreviewEvidence() {
	if (!workspace.value?.preview) return null;
	return {
		workspaceRevision: workspace.value.revision,
		previewId: workspace.value.preview.id,
		receipt: workspace.value.preview.receipt,
		action: workspace.value.preview.actionId,
		reason: workspace.value.preview.reason,
		approval: workspace.value.approval,
		lines: workspace.value.preview.lines.map((line) => ({
			accountId: line.accountId,
			expectedVersion: line.expectedVersion,
			state: line.state,
			before: line.before,
			after: line.after,
		})),
	};
}

/**
 * Builds the job receipt payload shown after queueing.
 *
 * @returns {object|null} Job evidence payload or null.
 */
function buildJobEvidence() {
	if (!workspace.value?.job) return null;
	return {
		jobId: workspace.value.job.id,
		previewReceipt: workspace.value.job.previewReceipt,
		status: workspace.value.job.status,
		progress: workspace.value.job.progress,
		total: workspace.value.job.total,
		receipt: workspace.value.job.receipt,
		retryReceipt: workspace.value.job.retryReceipt,
		results: workspace.value.job.results,
	};
}

/**
 * Creates an Error carrying the HTTP status returned by the demo API.
 *
 * @param {Record<string, unknown>} data API response.
 * @param {number} status HTTP status.
 * @returns {Error & { status: number }} Request error.
 */
function createRequestError(data, status) {
	const requestError = new Error(String(data.error || 'Bulk operation failed.'));
	requestError.status = status;
	return requestError;
}

/**
 * Formats a number as whole-dollar currency.
 *
 * @param {number} value Currency value.
 * @returns {string} Formatted currency.
 */
function formatCurrency(value) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(Number(value || 0));
}

/**
 * Returns a readable label for a workflow phase or job state.
 *
 * @param {string} status Status value.
 * @returns {string} Human-readable label.
 */
function statusLabel(status) {
	const labels = {
		draft: 'Draft',
		'preview-ready': 'Preview ready',
		'awaiting-approval': 'Awaiting approval',
		'ready-to-queue': 'Ready to queue',
		run: 'Queued',
		results: 'Results',
		pending: 'Pending',
		approved: 'Approved',
		rejected: 'Rejected',
		queued: 'Queued',
		working: 'Working',
		completed: 'Completed',
		'completed-with-errors': 'Completed with errors',
		cancelled: 'Cancelled',
		success: 'Updated',
		failed: 'Conflict',
		ready: 'Ready',
		excluded: 'Excluded',
		passed: 'Passed',
		warning: 'Warning',
		advisory: 'Advisory',
		blocked: 'Blocked',
	};
	return labels[status] || String(status || '').replaceAll('-', ' ');
}

/**
 * Returns a DOM Studio tone for a workflow status.
 *
 * @param {string} status Status value.
 * @returns {string} DOM Studio tone.
 */
function statusTone(status) {
	if (['completed', 'success', 'approved', 'passed', 'ready-to-queue'].includes(status)) return 'success';
	if (['failed', 'rejected', 'blocked', 'completed-with-errors'].includes(status)) return 'danger';
	if (['queued', 'working', 'pending', 'awaiting-approval', 'warning', 'advisory', 'preview-ready'].includes(status)) return 'warning';
	return 'neutral';
}

/**
 * Returns a DOM Studio tone for account risk.
 *
 * @param {string} risk Account risk.
 * @returns {string} DOM Studio tone.
 */
function riskTone(risk) {
	if (risk === 'high') return 'danger';
	if (risk === 'medium') return 'warning';
	return 'success';
}
</script>

<template>
	<DomAppShell class="h-dvh">
		<template #top>
			<DomAppTopBar v-if="workspace" class="md:hidden" title="Bulk operations" :subtitle="`${workspace.summary.selected} accounts selected`" large>
				<template #trailing><DomButton size="sm" variant="ghost" :loading="busyAction === 'reset'" @click="resetDemo">Reset</DomButton></template>
			</DomAppTopBar>
			<header v-if="workspace" class="hidden min-w-0 items-center justify-between gap-5 border-b border-border px-5 py-3 md:flex">
				<div class="min-w-0">
					<div class="flex items-center gap-2"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Account operations</p><DomStatusPill :tone="statusTone(workspace.phase)" :label="statusLabel(workspace.phase)" size="sm" /></div>
					<h1 class="mt-1 truncate text-xl font-semibold">Bulk change desk</h1>
				</div>
				<div class="flex shrink-0 items-center gap-3">
					<p class="hidden text-xs text-muted-fg lg:block">Workspace revision {{ workspace.revision }}</p>
					<DomButton size="sm" variant="secondary" :loading="busyAction === 'reset'" @click="resetDemo">Reset demo</DomButton>
				</div>
			</header>
		</template>

		<div v-if="loading" class="grid h-full min-h-0 gap-4 p-4 md:grid-cols-[minmax(0,1fr)_17rem]">
			<div class="space-y-3"><DomSkeleton class="h-16" /><DomSkeleton class="h-96" /></div>
			<DomSkeleton class="hidden h-full md:block" />
		</div>

		<DomEmptyState v-else-if="!workspace" title="Bulk operations unavailable" description="Reload the API-backed workspace to continue.">
			<template #actions><DomButton @click="loadWorkspace">Retry</DomButton></template>
		</DomEmptyState>

		<div v-else class="grid h-full min-h-0 min-w-0 md:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[12rem_minmax(0,1fr)_18rem]">
			<aside class="hidden min-h-0 flex-col border-r border-border xl:flex">
				<div class="border-b border-border px-4 py-4">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Workflow</p>
					<p class="mt-1 text-sm font-semibold">Revenue recovery</p>
				</div>
				<nav class="p-2" aria-label="Bulk operation stages">
					<button v-for="(tab, index) in tabs" :key="tab.key" type="button" class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition" :class="activeView === tab.key ? 'bg-secondary font-semibold text-canvas-fg' : 'text-muted-fg hover:bg-secondary/60 hover:text-canvas-fg'" @click="activeView = tab.key">
						<span class="grid size-6 place-items-center rounded-full border border-border text-[11px]">{{ index + 1 }}</span>
						{{ tab.label }}
					</button>
				</nav>
				<div class="mt-auto border-t border-border p-4">
					<DomAvatar :name="workspace.actor.name" :initials="workspace.actor.initials" size="sm" />
					<p class="mt-3 text-sm font-semibold">{{ workspace.actor.name }}</p>
					<p class="mt-1 text-xs leading-5 text-muted-fg">{{ workspace.actor.role }}</p>
				</div>
			</aside>

			<main class="flex min-h-0 min-w-0 flex-col overflow-hidden">
				<DomAlert v-if="error" class="mx-3 mt-3 sm:mx-4" tone="danger" title="Bulk operation failed" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-else-if="notice" class="mx-3 mt-3 sm:mx-4" tone="success" title="Workspace updated" :description="notice" dismissible @dismiss="notice = ''" />

				<DomTabs v-model="activeView" :tabs="tabs" class="bulk-workspace-tabs flex min-h-0 flex-1 flex-col overflow-hidden">
					<template #select>
						<div class="flex h-full min-h-0 flex-col overflow-hidden">
							<div class="shrink-0 border-b border-border px-3 py-3 sm:px-4">
								<div class="flex flex-wrap items-center justify-between gap-3">
									<div><h2 class="font-semibold">Choose the exact records</h2><p class="mt-1 text-xs text-muted-fg">Selection is stored server-side and invalidates stale previews.</p></div>
									<div class="flex items-center gap-2"><DomBadge tone="primary" variant="soft">{{ workspace.summary.selected }} selected</DomBadge><DomButton size="sm" variant="ghost" :disabled="!selectedIds.length || Boolean(busyAction)" @click="clearSelection">Clear</DomButton><DomButton size="sm" variant="secondary" :disabled="!filteredAccounts.length || Boolean(busyAction)" @click="selectVisibleAccounts">Select visible</DomButton></div>
								</div>
								<div class="mt-3 grid gap-3 sm:grid-cols-2">
									<DomSelect v-model="segment" label="Segment" :options="workspace.catalog.segments" />
									<DomTextInput v-model="search" label="Search accounts" placeholder="Name, owner, plan, or status" />
								</div>
							</div>

							<div class="hidden min-h-0 flex-1 p-4 md:block">
								<DomDataGrid
									:rows="filteredAccounts"
									:columns="columns"
									:selected-keys="selectedIds"
									:loading="busyAction === 'selection'"
									:toolbar="false"
									:show-row-numbers="false"
									:show-column-letters="false"
									title="Account selection"
									resource-label="accounts"
									height="calc(100dvh - 18rem)"
									@update:selected-keys="saveSelection"
								/>
							</div>

							<div class="min-h-0 flex-1 overflow-y-auto md:hidden">
								<DomEmptyState v-if="!filteredAccounts.length" title="No accounts match" description="Change the segment or search text." />
								<DomAppListItem v-for="account in filteredAccounts" v-else :key="account.id" :label="account.name" :description="`${account.owner} · ${account.plan} · ${formatCurrency(account.revenue)}`" :meta="`v${account.version}`" :selected="selectedIds.includes(account.id)" @click="toggleAccount(account.id)">
									<template #icon><span class="text-xs font-semibold">{{ account.name.split(' ').map((part) => part[0]).join('').slice(0, 2) }}</span></template>
									<template #trailing><div class="flex items-center gap-2"><DomStatusPill :tone="riskTone(account.risk)" :label="account.risk" size="sm" /><DomCheckbox :model-value="selectedIds.includes(account.id)" :aria-label="`Select ${account.name}`" @click.stop @update:model-value="toggleAccount(account.id)" /></div></template>
								</DomAppListItem>
							</div>

							<div class="shrink-0 border-t border-border px-3 py-3 sm:px-4">
								<div class="flex items-center justify-between gap-3"><div><p class="text-sm font-semibold">{{ formatCurrency(workspace.summary.monthlyValue) }} monthly value</p><p class="text-xs text-muted-fg">{{ workspace.summary.users }} users · {{ workspace.summary.highRisk }} high risk</p></div><DomButton :disabled="!selectedIds.length" @click="activeView = 'review'">Review impact</DomButton></div>
							</div>
						</div>
					</template>

					<template #review>
						<div class="h-full min-h-0 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-5xl gap-5 p-4 sm:p-5">
								<section v-if="!workspace.preview" class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
									<div class="space-y-4">
										<div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Batch definition</p><h2 class="mt-1 text-xl font-semibold">Define one change for {{ workspace.summary.selected }} accounts</h2><p class="mt-2 text-sm leading-6 text-muted-fg">The server will snapshot each source version, exclude ineligible records, and calculate the approval route.</p></div>
										<DomSelect v-model="actionId" label="Bulk action" :options="workspace.catalog.actions" />
										<div class="border-y border-border py-4"><p class="text-sm font-semibold">{{ activeAction?.impact }}</p><p class="mt-1 text-sm leading-6 text-muted-fg">{{ activeAction?.description }}</p></div>
										<DomTextareaInput v-model="reason" label="Audit reason" description="Stored with the immutable preview, approval, job, and per-record results." :rows="4" />
										<div class="flex items-center justify-between gap-4 border-y border-border py-4"><div><p class="text-sm font-medium">Notify account owners</p><p class="mt-1 text-xs text-muted-fg">Delivery intent is locked into the preview.</p></div><DomToggle v-model="notifyCustomers" aria-label="Notify account owners" /></div>
										<DomButton :loading="busyAction === 'preview'" :disabled="!selectedIds.length" @click="createPreview">Create impact preview</DomButton>
									</div>
									<aside class="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Current selection</p><dl class="mt-3 divide-y divide-border text-sm"><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Accounts</dt><dd class="font-semibold">{{ workspace.summary.selected }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Monthly value</dt><dd class="font-semibold">{{ formatCurrency(workspace.summary.monthlyValue) }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Users</dt><dd class="font-semibold">{{ workspace.summary.users }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">High risk</dt><dd class="font-semibold">{{ workspace.summary.highRisk }}</dd></div></dl><DomButton class="mt-4" size="sm" variant="ghost" @click="activeView = 'select'">Edit selection</DomButton></aside>
								</section>

								<template v-else>
									<section class="grid gap-4 border-y border-border py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
										<div><div class="flex flex-wrap items-center gap-2"><DomStatusPill :tone="workspace.preview.readyToQueue ? 'success' : 'warning'" :label="workspace.preview.readyToQueue ? 'Ready to queue' : workspace.approval?.status === 'pending' ? 'Awaiting approval' : 'Approval required'" /><DomBadge tone="neutral" variant="soft">{{ workspace.preview.receipt }}</DomBadge></div><h2 class="mt-3 text-xl font-semibold">{{ workspace.preview.actionLabel }}</h2><p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">{{ workspace.preview.reason }}</p></div>
										<DomButton size="sm" variant="ghost" :loading="busyAction === 'edit'" @click="editDraft">Edit batch</DomButton>
									</section>

									<section class="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border sm:grid-cols-4">
										<div class="bg-canvas p-4"><p class="text-xs text-muted-fg">Selected</p><p class="mt-1 text-xl font-semibold">{{ workspace.preview.selectedCount }}</p></div>
										<div class="bg-canvas p-4"><p class="text-xs text-muted-fg">Eligible</p><p class="mt-1 text-xl font-semibold text-success">{{ workspace.preview.eligibleCount }}</p></div>
										<div class="bg-canvas p-4"><p class="text-xs text-muted-fg">Excluded</p><p class="mt-1 text-xl font-semibold">{{ workspace.preview.excludedCount }}</p></div>
										<div class="bg-canvas p-4"><p class="text-xs text-muted-fg">Value affected</p><p class="mt-1 text-xl font-semibold">{{ formatCurrency(workspace.preview.impactedRevenue) }}</p></div>
									</section>

									<section class="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(17rem,0.7fr)]">
										<div><div class="flex items-center justify-between gap-3"><h3 class="font-semibold">Per-account impact</h3><p class="text-xs text-muted-fg">Safe-update versions locked</p></div><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="line in workspace.preview.lines" :key="line.id" class="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,0.8fr)_auto] sm:items-center"><div><p class="text-sm font-medium">{{ line.accountName }}</p><p class="mt-1 text-xs text-muted-fg">{{ line.owner }} · source v{{ line.expectedVersion }}</p></div><div class="text-xs"><p><span class="text-muted-fg">Before</span> · {{ line.before }}</p><p class="mt-1"><span class="text-muted-fg">After</span> · {{ line.after }}</p></div><DomStatusPill :tone="line.state === 'ready' ? 'success' : 'neutral'" :label="statusLabel(line.state)" size="sm" /></div></div></div>
										<div><h3 class="font-semibold">Server checks</h3><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="check in workspace.preview.checks" :key="check.id" class="py-3"><div class="flex items-start justify-between gap-3"><p class="text-sm font-medium">{{ check.label }}</p><DomStatusPill :tone="statusTone(check.state)" :label="statusLabel(check.state)" size="sm" /></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div></div></div>
									</section>

									<DomAlert v-if="workspace.preview.approvalRequired && !workspace.approval" tone="warning" title="Finance approval is required" :description="`${workspace.preview.approvalOwner} must approve this exact preview before it can be queued.`"><DomButton size="sm" @click="openApprovalDialog">Request approval</DomButton></DomAlert>
									<DomAlert v-else-if="workspace.approval?.status === 'pending'" tone="info" title="Approval request delivered" :description="`${workspace.approval.owner} received ${workspace.preview.receipt}. The demo reviewer can now decide it.`"><DomButton size="sm" :loading="busyAction === 'approve'" @click="simulateApproval">Simulate finance approval</DomButton></DomAlert>
									<DomAlert v-else-if="workspace.preview.readyToQueue" tone="success" title="Immutable preview is approved" :description="workspace.approval ? `${workspace.approval.receipt} is bound to ${workspace.preview.receipt}.` : 'No additional approval was required.'"><DomButton size="sm" @click="openQueueDialog">Queue background job</DomButton></DomAlert>
									<DomJsonViewer :value="previewEvidence" title="Immutable preview evidence" :filename="`${workspace.preview.id}.json`" :preview-lines="10" density="compact" />
								</template>
							</div>
						</div>
					</template>

					<template #run>
						<div class="h-full min-h-0 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-5xl gap-5 p-4 sm:p-5">
								<DomEmptyState v-if="!workspace.job" title="No background job yet" description="Create an impact preview, satisfy its approval route, and queue the immutable snapshot.">
									<template #actions><DomButton @click="activeView = 'review'">Review impact</DomButton></template>
								</DomEmptyState>

								<template v-else>
									<section class="grid gap-4 border-y border-border py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"><div><div class="flex flex-wrap items-center gap-2"><DomStatusPill :tone="statusTone(workspace.job.status)" :label="statusLabel(workspace.job.status)" :pulse="['queued', 'working'].includes(workspace.job.status)" /><DomBadge tone="neutral" variant="soft">{{ workspace.job.id }}</DomBadge></div><h2 class="mt-3 text-xl font-semibold">{{ workspace.job.actionLabel }}</h2><p class="mt-2 text-sm text-muted-fg">Locked to {{ workspace.job.previewReceipt }}</p></div><div class="flex flex-wrap gap-2"><DomButton v-if="workspace.job.status === 'queued'" size="sm" variant="secondary" :loading="busyAction === 'cancel'" @click="cancelJob">Cancel queued job</DomButton><DomButton v-if="workspace.job.status === 'queued'" size="sm" :loading="busyAction === 'advance'" @click="advanceJob">Start processing</DomButton><DomButton v-else-if="workspace.job.status === 'working'" size="sm" :loading="busyAction === 'advance'" @click="advanceJob">Continue worker</DomButton><DomButton v-else size="sm" variant="ghost" @click="resetDemo">Start another batch</DomButton></div></section>

									<DomProgress :value="jobProgress" label="Background job progress" show-value :tone="workspace.job.status === 'completed' ? 'success' : workspace.job.status === 'completed-with-errors' ? 'danger' : 'primary'" />

									<DomAlert v-if="workspace.job.status === 'completed-with-errors'" tone="danger" title="One account changed after preview" description="The worker skipped the stale row, finished every other account, and preserved a retry path." />
									<DomAlert v-else-if="workspace.job.status === 'completed'" tone="success" title="Every eligible account is updated" :description="workspace.job.retryReceipt ? `${workspace.job.receipt} completed; ${workspace.job.retryReceipt} reconciled the conflict.` : `${workspace.job.receipt} records the completed batch.`" />
									<DomAlert v-else-if="workspace.job.status === 'cancelled'" tone="neutral" title="Job cancelled before processing" :description="`${workspace.job.receipt} proves that no selected account was changed.`" />

									<section><div class="flex items-center justify-between gap-3"><h3 class="font-semibold">Per-account results</h3><p class="text-xs text-muted-fg">{{ workspace.job.progress }} of {{ workspace.job.total }} processed</p></div><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="result in workspace.job.results" :key="result.id" class="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,0.75fr)_auto] sm:items-center"><div><p class="text-sm font-medium">{{ result.accountName }}</p><p class="mt-1 text-xs text-muted-fg">Expected source v{{ result.expectedVersion }}<span v-if="result.retried"> · refreshed</span></p></div><div><p class="text-xs"><span class="text-muted-fg">Change</span> · {{ result.before }} → {{ result.after }}</p><p v-if="result.error" class="mt-1 text-xs text-destructive">{{ result.error.code }} · {{ result.error.detail }}</p></div><div class="flex items-center gap-2"><DomStatusPill :tone="statusTone(result.status)" :label="statusLabel(result.status)" size="sm" /><DomButton v-if="result.status === 'failed'" size="sm" variant="secondary" :loading="busyAction === 'retry'" @click="retryResult(result.id)">Refresh & retry</DomButton></div></div></div></section>

									<DomJsonViewer :value="jobEvidence" title="Job status and result receipt" :filename="`${workspace.job.id}.json`" :preview-lines="12" density="compact" />
								</template>
							</div>
						</div>
					</template>
				</DomTabs>
			</main>

			<aside class="hidden min-h-0 flex-col overflow-y-auto border-l border-border md:flex">
				<div class="border-b border-border p-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Current batch</p><dl class="mt-3 divide-y divide-border text-sm"><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Selected</dt><dd class="font-semibold">{{ workspace.summary.selected }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Monthly value</dt><dd class="font-semibold">{{ formatCurrency(workspace.summary.monthlyValue) }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">High risk</dt><dd class="font-semibold">{{ workspace.summary.highRisk }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Action</dt><dd class="text-right font-semibold">{{ activeAction?.label }}</dd></div></dl></div>
				<div class="border-b border-border p-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Safety contract</p><ul class="mt-3 space-y-3 text-xs leading-5 text-muted-fg"><li>Each row carries an exact source version.</li><li>Ineligible rows are excluded before approval.</li><li>Safe-update conflicts never block other rows.</li><li>Receipts bind preview, approval, job, and retry.</li></ul></div>
				<div class="p-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Recent jobs</p><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="job in workspace.recentJobs" :key="job.id" class="py-3"><div class="flex items-start justify-between gap-2"><p class="text-sm font-medium">{{ job.action }}</p><DomStatusPill :tone="statusTone(job.status)" :label="statusLabel(job.status)" size="sm" /></div><p class="mt-1 text-xs text-muted-fg">{{ job.summary }}</p><p class="mt-1 text-[11px] text-muted-fg">{{ job.actor }} · {{ job.createdAt }}</p></div></div></div>
			</aside>
		</div>

		<template #bottom>
			<DomAppBottomNav v-if="workspace" v-model="activeView" class="md:hidden" :items="mobileNavigation" @change="changeMobileDestination" />
		</template>
	</DomAppShell>

	<DomDialog v-if="workspace?.preview" v-model="approvalDialogOpen" title="Request finance approval" :description="`${workspace.preview.receipt} will be routed without allowing the source selection to drift.`" size="md">
		<div class="space-y-4"><div class="grid grid-cols-2 gap-3 border-y border-border py-4 text-sm"><div><p class="text-xs text-muted-fg">Eligible accounts</p><p class="mt-1 font-semibold">{{ workspace.preview.eligibleCount }}</p></div><div><p class="text-xs text-muted-fg">Monthly value</p><p class="mt-1 font-semibold">{{ formatCurrency(workspace.preview.impactedRevenue) }}</p></div></div><DomTextareaInput v-model="approvalNote" label="Approval note" description="Stored with the finance route and immutable preview." :rows="4" /></div>
		<template #footer><DomButton variant="secondary" @click="approvalDialogOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'request-approval'" @click="requestApproval">Request approval</DomButton></template>
	</DomDialog>

	<DomDialog v-if="workspace?.preview" v-model="queueDialogOpen" title="Queue this background job?" :description="`${workspace.preview.eligibleCount} eligible account versions will be processed independently.`" size="md">
		<div class="space-y-4"><div class="grid grid-cols-2 gap-3 border-y border-border py-4 text-sm"><div><p class="text-xs text-muted-fg">Preview</p><p class="mt-1 font-mono text-xs">{{ workspace.preview.receipt }}</p></div><div><p class="text-xs text-muted-fg">Approval</p><p class="mt-1 font-mono text-xs">{{ workspace.approval?.receipt || 'Not required' }}</p></div></div><DomCheckbox v-model="queueAcknowledged" label="I reviewed the immutable preview and customer impact" description="The worker will skip source-version conflicts and continue processing other rows." /></div>
		<template #footer><DomButton variant="secondary" @click="queueDialogOpen = false">Cancel</DomButton><DomButton :disabled="!queueAcknowledged" :loading="busyAction === 'queue'" @click="queueJob">Queue background job</DomButton></template>
	</DomDialog>
</template>

<style scoped>
.bulk-workspace-tabs :deep([role="tablist"]) {
	display: none;
}

@media (min-width: 768px) {
	.bulk-workspace-tabs :deep([role="tablist"]) {
		display: flex;
	}
}
</style>
