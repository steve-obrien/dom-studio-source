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
	DomDatePicker,
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
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/customer-health';
const tabs = [
	{ key: 'portfolio', label: 'Portfolio' },
	{ key: 'health', label: 'Health evidence' },
	{ key: 'timeline', label: 'Timeline' },
	{ key: 'plan', label: 'Recovery plan' },
];

const workspace = ref(null);
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const activeView = ref('health');
const segment = ref('my-book');
const search = ref('');
const planDialogOpen = ref(false);
const planTemplateId = ref('renewal-recovery');
const planOwnerId = ref('usr_maya');
const planDueDate = ref('2026-08-28');
const planObjective = ref('Restore executive confidence and prove a credible path to renewal.');
const planNote = ref('Coordinate the sponsor, support escalation, adoption recovery, and commercial evidence in one accountable plan.');
const planAcknowledged = ref(false);
const taskDialogOpen = ref(false);
const selectedTask = ref(null);
const taskCompletionNote = ref('Elena confirmed the executive sponsor meeting and accepted the recovery agenda.');
const activityDialogOpen = ref(false);
const activityType = ref('customer-call');
const activityTitle = ref('Sponsor recovery call confirmed');
const activityDetail = ref('Elena confirmed the executive sponsor and the August 12 working session.');

const selectedAccount = computed(() => workspace.value?.selectedAccount || null);
const filteredAccounts = computed(getFilteredAccounts);
const mobileNavigation = computed(getMobileNavigation);
const planEvidence = computed(getPlanEvidence);
const healthEvidence = computed(getHealthEvidence);
const completedTasks = computed(() => selectedAccount.value?.plan?.tasks?.filter((task) => task.status === 'completed').length || 0);
const canRefreshHealth = computed(() => Boolean(selectedAccount.value?.plan && completedTasks.value > 0 && !selectedAccount.value.lastHealthRefreshReceipt));

onMounted(loadWorkspace);

/**
 * Loads the customer health workspace from the repository-local API.
 *
 * @param {boolean} clearMessages Whether feedback should be cleared before loading.
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
		error.value = requestError.message || 'Unable to load the customer health workspace.';
	} finally {
		loading.value = false;
	}
}

/**
 * Sends one workspace mutation and applies its authoritative response.
 *
 * @param {string} path API path below the customer-health base URL.
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
		error.value = requestError.message || 'Customer health action failed.';
		if (requestError.status === 409) await refreshAfterConflict();
		return null;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Reloads current state after an exact-revision conflict.
 *
 * @returns {Promise<void>}
 */
async function refreshAfterConflict() {
	try {
		const response = await fetch(`${apiBase}/bootstrap`);
		const data = await response.json();
		if (response.ok) setWorkspace(data);
	} catch {
		// Preserve the original conflict message when the recovery read also fails.
	}
}

/**
 * Replaces client workspace state and keeps form defaults aligned.
 *
 * @param {object} data Authoritative API workspace.
 * @returns {void}
 */
function setWorkspace(data) {
	workspace.value = data;
	planOwnerId.value = data.selectedAccount.ownerId || data.currentOperator.id;
	if (data.preview) {
		planTemplateId.value = data.preview.templateId;
		planOwnerId.value = data.preview.ownerId;
		planDueDate.value = data.preview.dueDate;
		planObjective.value = data.preview.objective;
		planNote.value = data.preview.note;
		activeView.value = 'plan';
	}
}

/**
 * Selects one account and opens its health evidence.
 *
 * @param {string} accountId Customer account identifier.
 * @returns {Promise<void>}
 */
async function selectAccount(accountId) {
	if (!workspace.value || accountId === workspace.value.selectedAccountId || busyAction.value) {
		activeView.value = 'health';
		return;
	}
	const data = await mutateWorkspace('/accounts/select', {
		revision: workspace.value.revision,
		accountId,
	}, 'select-account');
	if (data) {
		activeView.value = 'health';
		notice.value = `${data.selectedAccount.name} opened with evidence version ${data.selectedAccount.version}.`;
	}
}

/**
 * Opens the success-plan configuration dialog with contextual defaults.
 *
 * @returns {void}
 */
function openPlanDialog() {
	if (!selectedAccount.value) return;
	planOwnerId.value = selectedAccount.value.ownerId;
	planAcknowledged.value = false;
	planDialogOpen.value = true;
}

/**
 * Creates an immutable success-plan preview.
 *
 * @returns {Promise<void>}
 */
async function previewPlan() {
	if (!workspace.value || !selectedAccount.value) return;
	const data = await mutateWorkspace('/plans/preview', {
		revision: workspace.value.revision,
		accountId: selectedAccount.value.id,
		accountVersion: selectedAccount.value.version,
		templateId: planTemplateId.value,
		ownerId: planOwnerId.value,
		dueDate: planDueDate.value,
		objective: planObjective.value,
		note: planNote.value,
	}, 'preview-plan');
	if (data) {
		planDialogOpen.value = false;
		activeView.value = 'plan';
		notice.value = `${data.preview.receipt} locks the account evidence, owner, dates, and tasks.`;
	}
}

/**
 * Launches the acknowledged immutable plan preview.
 *
 * @returns {Promise<void>}
 */
async function launchPlan() {
	if (!workspace.value?.preview) return;
	const data = await mutateWorkspace('/plans', {
		revision: workspace.value.revision,
		previewId: workspace.value.preview.id,
		acknowledged: planAcknowledged.value,
	}, 'launch-plan');
	if (data) {
		planAcknowledged.value = false;
		activeView.value = 'plan';
		notice.value = `${data.selectedAccount.plan.receipt} launched ${data.selectedAccount.plan.tasks.length} accountable tasks.`;
	}
}

/**
 * Opens the completion dialog for one exact-version plan task.
 *
 * @param {object} task Success-plan task.
 * @returns {void}
 */
function openTaskDialog(task) {
	selectedTask.value = task;
	taskCompletionNote.value = task.key === 'support'
		? 'Support published the P1 recovery update and confirmed the next customer checkpoint.'
		: 'Elena confirmed the executive sponsor meeting and accepted the recovery agenda.';
	taskDialogOpen.value = true;
}

/**
 * Completes one exact-version success-plan task.
 *
 * @returns {Promise<void>}
 */
async function completeTask() {
	const account = selectedAccount.value;
	const task = selectedTask.value;
	if (!workspace.value || !account?.plan || !task) return;
	const data = await mutateWorkspace(`/plans/${account.plan.id}/tasks/${task.id}`, {
		revision: workspace.value.revision,
		accountId: account.id,
		accountVersion: account.version,
		planVersion: account.plan.version,
		taskVersion: task.version,
		note: taskCompletionNote.value,
	}, 'complete-task');
	if (data) {
		taskDialogOpen.value = false;
		selectedTask.value = null;
		activeView.value = 'plan';
		notice.value = `Task completed. Plan progress is now ${data.selectedAccount.plan.progress}%.`;
	}
}

/**
 * Synchronizes the active success plan to the CRM adapter.
 *
 * @returns {Promise<void>}
 */
async function syncPlan() {
	const account = selectedAccount.value;
	if (!workspace.value || !account?.plan) return;
	const data = await mutateWorkspace(`/plans/${account.plan.id}/sync`, {
		revision: workspace.value.revision,
		accountId: account.id,
		accountVersion: account.version,
	}, 'sync-plan');
	if (data) notice.value = `${data.selectedAccount.plan.crmSync.receipt} linked the plan to ${data.selectedAccount.plan.crmSync.recordId}.`;
}

/**
 * Opens the account activity dialog.
 *
 * @returns {void}
 */
function openActivityDialog() {
	activityDialogOpen.value = true;
}

/**
 * Adds a validated activity to the customer timeline.
 *
 * @returns {Promise<void>}
 */
async function logActivity() {
	const account = selectedAccount.value;
	if (!workspace.value || !account) return;
	const data = await mutateWorkspace('/activities', {
		revision: workspace.value.revision,
		accountId: account.id,
		accountVersion: account.version,
		type: activityType.value,
		title: activityTitle.value,
		detail: activityDetail.value,
	}, 'log-activity');
	if (data) {
		activityDialogOpen.value = false;
		activeView.value = 'timeline';
		notice.value = `${data.selectedAccount.activity[0].receipt} added the customer update.`;
	}
}

/**
 * Recalculates health from current source evidence after recovery work.
 *
 * @returns {Promise<void>}
 */
async function refreshHealth() {
	const account = selectedAccount.value;
	if (!workspace.value || !account) return;
	const previousScore = account.healthScore;
	const data = await mutateWorkspace('/health/refresh', {
		revision: workspace.value.revision,
		accountId: account.id,
		accountVersion: account.version,
	}, 'refresh-health');
	if (data) {
		activeView.value = 'health';
		notice.value = `${data.selectedAccount.lastHealthRefreshReceipt} moved health from ${previousScore} to ${data.selectedAccount.healthScore}.`;
	}
}

/**
 * Restores the deterministic demo and its original account evidence.
 *
 * @returns {Promise<void>}
 */
async function resetDemo() {
	const data = await mutateWorkspace('/reset', {}, 'reset');
	if (data) {
		activeView.value = 'health';
		segment.value = 'my-book';
		search.value = '';
		planAcknowledged.value = false;
		notice.value = 'Customer health demo restored.';
	}
}

/**
 * Applies a mobile bottom-navigation destination.
 *
 * @param {object|string} item Navigation item or key.
 * @returns {void}
 */
function changeMobileDestination(item) {
	activeView.value = typeof item === 'string' ? item : item?.value || item?.key || activeView.value;
}

/**
 * Filters the server portfolio by the selected segment and search query.
 *
 * @returns {object[]} Visible accounts.
 */
function getFilteredAccounts() {
	if (!workspace.value) return [];
	const query = search.value.trim().toLowerCase();
	return workspace.value.accounts.filter((account) => {
		const matchesSegment = segment.value === 'all'
			|| (segment.value === 'my-book' && account.ownerId === workspace.value.currentOperator.id)
			|| (segment.value === 'needs-attention' && ['critical', 'at-risk'].includes(account.status))
			|| (segment.value === 'renewing-soon' && account.daysToRenewal <= 90);
		const matchesSearch = !query || [account.name, account.segment, account.owner, account.industry].some((value) => String(value).toLowerCase().includes(query));
		return matchesSegment && matchesSearch;
	});
}

/**
 * Returns mobile navigation items with useful account-state metadata.
 *
 * @returns {object[]} Bottom-navigation items.
 */
function getMobileNavigation() {
	return [
		{ value: 'portfolio', label: 'Accounts' },
		{ value: 'health', label: 'Health', badge: selectedAccount.value?.healthScore },
		{ value: 'timeline', label: 'Timeline' },
		{ value: 'plan', label: 'Plan', badge: selectedAccount.value?.plan ? `${selectedAccount.value.plan.progress}%` : undefined },
	];
}

/**
 * Returns immutable success-plan evidence for DOM Studio JSON inspection.
 *
 * @returns {object} Preview or active-plan evidence.
 */
function getPlanEvidence() {
	if (workspace.value?.preview) {
		return {
			previewId: workspace.value.preview.id,
			previewReceipt: workspace.value.preview.receipt,
			accountVersion: workspace.value.preview.accountVersion,
			owner: workspace.value.preview.owner,
			dueDate: workspace.value.preview.dueDate,
			checks: workspace.value.preview.checks,
			tasks: workspace.value.preview.tasks,
		};
	}
	const plan = selectedAccount.value?.plan;
	if (!plan) return {};
	return {
		planId: plan.id,
		version: plan.version,
		status: plan.status,
		previewReceipt: plan.previewReceipt,
		planReceipt: plan.receipt,
		progress: plan.progress,
		crmSync: plan.crmSync,
		lastHealthRefreshReceipt: plan.lastHealthRefreshReceipt,
		tasks: plan.tasks,
	};
}

/**
 * Returns scorecard evidence with source freshness and weights.
 *
 * @returns {object} Selected account scorecard evidence.
 */
function getHealthEvidence() {
	const account = selectedAccount.value;
	if (!account) return {};
	return {
		accountId: account.id,
		accountVersion: account.version,
		healthScore: account.healthScore,
		previousScore: account.previousScore,
		status: account.status,
		measures: account.measures.map((measure) => ({
			id: measure.id,
			score: measure.score,
			weight: measure.weight,
			source: measure.source,
			freshness: measure.freshness,
		})),
		lastHealthRefreshReceipt: account.lastHealthRefreshReceipt,
	};
}

/**
 * Clears visible request feedback.
 *
 * @returns {void}
 */
function clearFeedback() {
	error.value = '';
	notice.value = '';
}

/**
 * Creates an error carrying the HTTP status for conflict recovery.
 *
 * @param {object} data API response payload.
 * @param {number} status HTTP status.
 * @returns {Error & {status: number}} Request error.
 */
function createRequestError(data, status) {
	const requestError = new Error(data?.error || `Request failed with status ${status}.`);
	requestError.status = status;
	return requestError;
}

/**
 * Formats annual recurring revenue in British pounds.
 *
 * @param {number} value Currency value.
 * @returns {string} Formatted currency.
 */
function formatCurrency(value) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		maximumFractionDigits: 0,
	}).format(Number(value || 0));
}

/**
 * Formats an ISO date for concise customer-success UI.
 *
 * @param {string} value ISO date.
 * @returns {string} Human-readable date.
 */
function formatDate(value) {
	if (!value) return 'Not set';
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00.000Z`));
}

/**
 * Maps internal status keys to readable labels.
 *
 * @param {string} status Status key.
 * @returns {string} Human-readable label.
 */
function statusLabel(status) {
	const labels = {
		'active': 'Active',
		'advisory': 'Advisory',
		'at-risk': 'At risk',
		'blocked-by-risk': 'Blocked by risk',
		'completed': 'Completed',
		'critical': 'Critical',
		'discovery': 'Discovery',
		'healthy': 'Healthy',
		'mitigating': 'Mitigating',
		'monitoring': 'Monitoring',
		'not-started': 'Not started',
		'open': 'Open',
		'passed': 'Passed',
		'pending': 'Pending',
		'synced': 'Synced',
	};
	return labels[status] || String(status || 'Unknown').replaceAll('-', ' ');
}

/**
 * Maps account and workflow statuses to semantic DOM Studio tones.
 *
 * @param {string} status Status key.
 * @returns {string} DOM Studio tone.
 */
function statusTone(status) {
	if (['healthy', 'completed', 'passed', 'synced'].includes(status)) return 'success';
	if (['critical', 'blocked-by-risk'].includes(status)) return 'danger';
	if (['at-risk', 'high', 'open', 'pending'].includes(status)) return 'warning';
	if (['active', 'medium', 'mitigating', 'monitoring', 'discovery'].includes(status)) return 'info';
	return 'neutral';
}
</script>

<template>
	<DomAppShell class="h-dvh">
		<template #top>
			<DomAppTopBar
				v-if="workspace"
				class="md:hidden"
				:title="selectedAccount?.name || 'Customer health'"
				:subtitle="selectedAccount ? `${statusLabel(selectedAccount.status)} · ${selectedAccount.healthScore} health` : 'Portfolio loading'"
				large
			>
				<template #trailing><DomButton size="sm" variant="ghost" :loading="busyAction === 'reset'" @click="resetDemo">Reset</DomButton></template>
			</DomAppTopBar>
			<header v-if="workspace" class="hidden min-w-0 items-center justify-between gap-5 border-b border-border px-5 py-3 md:flex">
				<div class="min-w-0">
					<div class="flex items-center gap-2"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Customer success</p><DomStatusPill :tone="statusTone(selectedAccount?.status)" :label="statusLabel(selectedAccount?.status)" size="sm" /></div>
					<h1 class="mt-1 truncate text-xl font-semibold">Account recovery desk</h1>
				</div>
				<div class="flex shrink-0 items-center gap-3">
					<p class="hidden text-xs text-muted-fg lg:block">Workspace revision {{ workspace.revision }}</p>
					<DomButton size="sm" variant="secondary" :loading="busyAction === 'reset'" @click="resetDemo">Reset demo</DomButton>
				</div>
			</header>
		</template>

		<div v-if="loading" class="grid h-full min-h-0 gap-4 p-4 md:grid-cols-[minmax(0,1fr)_18rem]">
			<div class="space-y-3"><DomSkeleton class="h-20" /><DomSkeleton class="h-96" /></div>
			<DomSkeleton class="hidden h-full md:block" />
		</div>

		<DomEmptyState v-else-if="!workspace" title="Customer health unavailable" description="Reload the API-backed workspace to continue.">
			<template #actions><DomButton @click="loadWorkspace">Retry</DomButton></template>
		</DomEmptyState>

		<div v-else class="grid h-full min-h-0 min-w-0 md:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[15rem_minmax(0,1fr)_19rem]">
			<aside class="hidden min-h-0 flex-col overflow-hidden border-r border-border xl:flex">
				<div class="shrink-0 border-b border-border p-3">
					<DomSelect v-model="segment" label="Portfolio" :options="workspace.catalog.segments" width="min-w-0" />
					<DomTextInput v-model="search" class="mt-3" label="Search accounts" placeholder="Name, owner, segment" />
				</div>
				<div class="min-h-0 flex-1 overflow-y-auto">
					<button
						v-for="account in filteredAccounts"
						:key="account.id"
						type="button"
						class="w-full border-b border-border px-3 py-3 text-left transition hover:bg-secondary/50"
						:class="account.id === workspace.selectedAccountId ? 'bg-secondary/80' : ''"
						@click="selectAccount(account.id)"
					>
						<div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="truncate text-sm font-semibold">{{ account.name }}</p><p class="mt-1 truncate text-xs text-muted-fg">{{ account.owner }} · {{ account.segment }}</p></div><DomStatusPill :tone="statusTone(account.status)" :label="account.healthScore" size="sm" /></div>
						<div class="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-fg"><span>{{ formatCurrency(account.arr) }}</span><span>{{ account.daysToRenewal }}d to renewal</span></div>
					</button>
				</div>
				<div class="shrink-0 border-t border-border p-4">
					<DomAvatar :name="workspace.currentOperator.name" :initials="workspace.currentOperator.initials" size="sm" />
					<p class="mt-3 text-sm font-semibold">{{ workspace.currentOperator.name }}</p>
					<p class="mt-1 text-xs leading-5 text-muted-fg">{{ workspace.currentOperator.role }}</p>
				</div>
			</aside>

			<main class="flex min-h-0 min-w-0 flex-col overflow-hidden">
				<DomAlert v-if="error" class="mx-3 mt-3 sm:mx-4" tone="danger" title="Customer health action failed" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-else-if="notice" class="mx-3 mt-3 sm:mx-4" tone="success" title="Account workspace updated" :description="notice" dismissible @dismiss="notice = ''" />

				<DomTabs v-model="activeView" :tabs="tabs" class="customer-health-tabs flex min-h-0 flex-1 flex-col overflow-hidden">
					<template #portfolio>
						<div class="flex h-full min-h-0 flex-col overflow-hidden">
							<div class="shrink-0 border-b border-border p-4 sm:p-5">
								<div class="flex flex-wrap items-end justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Portfolio triage</p><h2 class="mt-1 text-xl font-semibold">Decide where attention goes next</h2><p class="mt-2 text-sm text-muted-fg">Server evidence is summarized without hiding the account-level scorecard.</p></div><DomBadge tone="warning" variant="soft">{{ workspace.portfolio.needsAttention }} need attention</DomBadge></div>
								<div class="mt-4 grid grid-cols-2 gap-px overflow-hidden border border-border bg-border sm:grid-cols-4">
									<div class="bg-canvas p-3"><p class="text-xs text-muted-fg">Accounts</p><p class="mt-1 text-xl font-semibold">{{ workspace.portfolio.totalAccounts }}</p></div>
									<div class="bg-canvas p-3"><p class="text-xs text-muted-fg">Needs attention</p><p class="mt-1 text-xl font-semibold text-warning">{{ workspace.portfolio.needsAttention }}</p></div>
									<div class="bg-canvas p-3"><p class="text-xs text-muted-fg">ARR at risk</p><p class="mt-1 text-xl font-semibold">{{ formatCurrency(workspace.portfolio.arrAtRisk) }}</p></div>
									<div class="bg-canvas p-3"><p class="text-xs text-muted-fg">Renewing in 90d</p><p class="mt-1 text-xl font-semibold">{{ workspace.portfolio.renewingSoon }}</p></div>
								</div>
								<div class="mt-4 grid gap-3 xl:hidden sm:grid-cols-2"><DomSelect v-model="segment" label="Portfolio" :options="workspace.catalog.segments" /><DomTextInput v-model="search" label="Search accounts" placeholder="Name, owner, segment" /></div>
							</div>
							<div class="min-h-0 flex-1 overflow-y-auto">
								<DomEmptyState v-if="!filteredAccounts.length" title="No accounts match" description="Change the portfolio filter or search text." />
								<DomAppListItem v-for="account in filteredAccounts" v-else :key="account.id" :label="account.name" :description="`${account.owner} · ${account.segment} · ${formatCurrency(account.arr)}`" :meta="`${account.daysToRenewal}d`" :selected="account.id === workspace.selectedAccountId" @click="selectAccount(account.id)">
									<template #icon><DomAvatar :name="account.name" :initials="account.initials" size="sm" /></template>
									<template #trailing><div class="flex items-center gap-2"><DomStatusPill :tone="statusTone(account.status)" :label="statusLabel(account.status)" size="sm" /><span class="w-7 text-right text-sm font-semibold">{{ account.healthScore }}</span></div></template>
								</DomAppListItem>
							</div>
						</div>
					</template>

					<template #health>
						<div class="h-full min-h-0 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-5xl gap-5 p-4 sm:p-5">
								<section class="grid gap-4 border-b border-border pb-5 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-start">
									<div><div class="flex flex-wrap items-center gap-2"><DomStatusPill :tone="statusTone(selectedAccount.status)" :label="statusLabel(selectedAccount.status)" /><DomBadge tone="neutral" variant="soft">Account v{{ selectedAccount.version }}</DomBadge></div><h2 class="mt-3 text-2xl font-semibold">{{ selectedAccount.name }}</h2><p class="mt-2 text-sm leading-6 text-muted-fg">{{ selectedAccount.segment }} · {{ selectedAccount.industry }} · owned by {{ selectedAccount.owner }}</p><p class="text-sm leading-6 text-muted-fg">Champion: {{ selectedAccount.champion }}</p></div>
									<div><div class="flex items-end gap-2"><p class="text-5xl font-semibold tracking-tight">{{ selectedAccount.healthScore }}</p><p class="pb-2 text-xs text-muted-fg">weighted health</p></div><DomProgress class="mt-2" :value="selectedAccount.healthScore" :label="`${selectedAccount.name} health`" :tone="statusTone(selectedAccount.status)" /><p class="mt-2 text-xs text-muted-fg">{{ selectedAccount.healthScore - selectedAccount.previousScore > 0 ? '+' : '' }}{{ selectedAccount.healthScore - selectedAccount.previousScore }} since prior score</p></div>
								</section>

								<section class="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border sm:grid-cols-4">
									<div class="bg-canvas p-3"><p class="text-xs text-muted-fg">ARR</p><p class="mt-1 font-semibold">{{ formatCurrency(selectedAccount.arr) }}</p><p class="mt-1 text-xs text-muted-fg">{{ selectedAccount.integrations }} connected sources</p></div>
									<div class="bg-canvas p-3"><p class="text-xs text-muted-fg">Renewal</p><p class="mt-1 font-semibold">{{ formatDate(selectedAccount.renewalDate) }}</p><p class="mt-1 text-xs text-muted-fg">{{ selectedAccount.daysToRenewal }} days</p></div>
									<div class="bg-canvas p-3"><p class="text-xs text-muted-fg">Adoption</p><p class="mt-1 font-semibold">{{ selectedAccount.activeSeats }}/{{ selectedAccount.licensedSeats }}</p><p class="mt-1 text-xs text-muted-fg">{{ selectedAccount.weeklyActiveTeams }} active teams</p></div>
									<div class="bg-canvas p-3"><p class="text-xs text-muted-fg">Support</p><p class="mt-1 font-semibold">{{ selectedAccount.openTickets }} open</p><p class="mt-1 text-xs text-muted-fg">{{ selectedAccount.priorityTickets }} priority</p></div>
								</section>

								<DomAlert v-if="selectedAccount.risk" :tone="statusTone(selectedAccount.risk.severity)" :title="selectedAccount.risk.label" :description="selectedAccount.risk.detail">
									<div class="flex flex-wrap items-center gap-2"><DomStatusPill :tone="statusTone(selectedAccount.risk.status)" :label="statusLabel(selectedAccount.risk.status)" size="sm" /><span class="text-xs text-muted-fg">Owner {{ selectedAccount.risk.owner }} · due {{ formatDate(selectedAccount.risk.dueDate) }}</span><DomButton v-if="!selectedAccount.plan" size="sm" @click="openPlanDialog">Create recovery plan</DomButton></div>
								</DomAlert>

								<section>
									<div class="flex flex-wrap items-end justify-between gap-3"><div><h3 class="font-semibold">Weighted scorecard</h3><p class="mt-1 text-xs text-muted-fg">Every measure includes its contribution, source, and freshness.</p></div><DomButton size="sm" variant="secondary" :disabled="!canRefreshHealth" :loading="busyAction === 'refresh-health'" @click="refreshHealth">Refresh after intervention</DomButton></div>
									<div class="mt-3 divide-y divide-border border-y border-border">
										<div v-for="measure in selectedAccount.measures" :key="measure.id" class="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-center">
											<div><div class="flex flex-wrap items-center gap-2"><p class="text-sm font-semibold">{{ measure.label }}</p><DomStatusPill :tone="statusTone(measure.status)" :label="statusLabel(measure.status)" size="sm" /><span class="text-xs text-muted-fg">{{ measure.weight }}% weight</span></div><p class="mt-2 text-sm leading-6 text-muted-fg">{{ measure.detail }}</p><p class="mt-2 text-[11px] text-muted-fg">{{ measure.source }} · {{ measure.freshness }}</p></div>
											<div><div class="flex items-baseline justify-between"><span class="text-2xl font-semibold">{{ measure.score }}</span><span class="text-xs" :class="measure.trend < 0 ? 'text-destructive' : 'text-success'">{{ measure.trend > 0 ? '+' : '' }}{{ measure.trend }}</span></div><DomProgress class="mt-2" :value="measure.score" :label="`${measure.label} score`" :tone="statusTone(measure.status)" /></div>
										</div>
									</div>
								</section>

								<section><div class="flex items-center justify-between gap-3"><h3 class="font-semibold">Score history</h3><p class="text-xs text-muted-fg">Six evidence checkpoints</p></div><div class="mt-3 grid grid-cols-3 gap-px overflow-hidden border border-border bg-border sm:grid-cols-6"><div v-for="point in selectedAccount.scoreHistory" :key="`${point.label}-${point.score}`" class="bg-canvas p-3 text-center"><p class="text-xs text-muted-fg">{{ point.label }}</p><p class="mt-1 text-lg font-semibold">{{ point.score }}</p></div></div></section>

								<DomJsonViewer :value="healthEvidence" title="Health source contract" :filename="`${selectedAccount.id}-health.json`" :preview-lines="10" density="compact" />
							</div>
						</div>
					</template>

					<template #timeline>
						<div class="h-full min-h-0 overflow-y-auto">
							<div class="mx-auto w-full max-w-4xl p-4 sm:p-5">
								<div class="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Official account record</p><h2 class="mt-1 text-xl font-semibold">{{ selectedAccount.name }} timeline</h2><p class="mt-2 text-sm text-muted-fg">Customer interactions, automatic evidence, plan work, and connector receipts in one ordered record.</p></div><DomButton @click="openActivityDialog">Log activity</DomButton></div>
								<div class="divide-y divide-border">
									<article v-for="activity in selectedAccount.activity" :key="activity.id" class="grid gap-3 py-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
										<div><DomStatusPill tone="neutral" :label="activity.type" size="sm" /><p class="mt-2 text-xs text-muted-fg">{{ activity.time }}</p></div>
										<div><div class="flex flex-wrap items-start justify-between gap-2"><h3 class="text-sm font-semibold">{{ activity.title }}</h3><DomBadge tone="neutral" variant="soft">{{ activity.source }}</DomBadge></div><p class="mt-2 text-sm leading-6 text-muted-fg">{{ activity.detail }}</p><p class="mt-2 text-[11px] text-muted-fg">{{ activity.actor }} · {{ activity.receipt }}</p></div>
									</article>
								</div>
							</div>
						</div>
					</template>

					<template #plan>
						<div class="h-full min-h-0 overflow-y-auto">
							<div class="mx-auto grid w-full max-w-5xl gap-5 p-4 sm:p-5">
								<DomEmptyState v-if="!selectedAccount.plan && !workspace.preview" title="No active recovery plan" description="Create an accountable plan from the current health evidence, open risk, renewal date, and playbook template.">
									<template #actions><DomButton @click="openPlanDialog">Create recovery plan</DomButton></template>
								</DomEmptyState>

								<template v-else-if="workspace.preview">
									<section class="grid gap-4 border-b border-border pb-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"><div><div class="flex flex-wrap items-center gap-2"><DomStatusPill tone="warning" label="Preview" /><DomBadge tone="neutral" variant="soft">{{ workspace.preview.receipt }}</DomBadge></div><h2 class="mt-3 text-xl font-semibold">{{ workspace.preview.templateLabel }}</h2><p class="mt-2 text-sm leading-6 text-muted-fg">{{ workspace.preview.objective }}</p><p class="mt-2 text-xs text-muted-fg">{{ workspace.preview.owner }} · due {{ formatDate(workspace.preview.dueDate) }} · account v{{ workspace.preview.accountVersion }}</p></div><DomButton size="sm" variant="secondary" @click="openPlanDialog">Edit configuration</DomButton></section>
									<section class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
										<div><div class="flex items-center justify-between gap-3"><h3 class="font-semibold">Plan tasks</h3><p class="text-xs text-muted-fg">{{ workspace.preview.tasks.length }} owned actions</p></div><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="task in workspace.preview.tasks" :key="task.id" class="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><p class="text-sm font-medium">{{ task.label }}</p><p class="mt-1 text-xs text-muted-fg">{{ task.category }} · {{ task.owner }}</p></div><p class="text-xs font-medium">{{ formatDate(task.dueDate) }}</p></div></div></div>
										<div><h3 class="font-semibold">Server checks</h3><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="check in workspace.preview.checks" :key="check.id" class="py-3"><div class="flex items-start justify-between gap-3"><p class="text-sm font-medium">{{ check.label }}</p><DomStatusPill :tone="statusTone(check.state)" :label="statusLabel(check.state)" size="sm" /></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div></div></div>
									</section>
									<DomAlert tone="warning" title="Launch this immutable plan?" description="Launching creates accountable tasks, links the current risk, and writes an audit receipt."><DomCheckbox v-model="planAcknowledged" label="I reviewed the outcome, owner, tasks, and recovery dates" /><DomButton class="mt-3" :disabled="!planAcknowledged" :loading="busyAction === 'launch-plan'" @click="launchPlan">Launch recovery plan</DomButton></DomAlert>
									<DomJsonViewer :value="planEvidence" title="Immutable plan preview" :filename="`${workspace.preview.id}.json`" :preview-lines="12" density="compact" />
								</template>

								<template v-else-if="selectedAccount.plan">
									<section class="grid gap-4 border-b border-border pb-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"><div><div class="flex flex-wrap items-center gap-2"><DomStatusPill tone="success" :label="statusLabel(selectedAccount.plan.status)" /><DomBadge tone="neutral" variant="soft">{{ selectedAccount.plan.receipt }}</DomBadge></div><h2 class="mt-3 text-xl font-semibold">{{ selectedAccount.plan.name }}</h2><p class="mt-2 text-sm leading-6 text-muted-fg">{{ selectedAccount.plan.objective }}</p><p class="mt-2 text-xs text-muted-fg">{{ selectedAccount.plan.owner }} · due {{ formatDate(selectedAccount.plan.dueDate) }} · plan v{{ selectedAccount.plan.version }}</p></div><div class="flex flex-wrap gap-2"><DomButton v-if="selectedAccount.plan.crmSync.status !== 'synced'" size="sm" variant="secondary" :loading="busyAction === 'sync-plan'" @click="syncPlan">Sync to CRM</DomButton><DomButton size="sm" :disabled="!canRefreshHealth" :loading="busyAction === 'refresh-health'" @click="refreshHealth">Refresh health</DomButton></div></section>
									<DomProgress :value="selectedAccount.plan.progress" label="Recovery plan progress" show-value tone="primary" />
									<DomAlert v-if="selectedAccount.plan.crmSync.status === 'synced'" tone="success" title="Plan synchronized to CRM" :description="`${selectedAccount.plan.crmSync.receipt} linked ${selectedAccount.plan.crmSync.recordId}.`" />
									<section><div class="flex items-center justify-between gap-3"><h3 class="font-semibold">Accountable tasks</h3><p class="text-xs text-muted-fg">{{ completedTasks }} of {{ selectedAccount.plan.tasks.length }} complete</p></div><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="task in selectedAccount.plan.tasks" :key="task.id" class="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><div class="flex flex-wrap items-center gap-2"><p class="text-sm font-medium">{{ task.label }}</p><DomStatusPill :tone="statusTone(task.status)" :label="statusLabel(task.status)" size="sm" /></div><p class="mt-1 text-xs text-muted-fg">{{ task.category }} · {{ task.owner }} · due {{ formatDate(task.dueDate) }}</p><p v-if="task.completionReceipt" class="mt-1 text-[11px] text-muted-fg">{{ task.completionReceipt }} · {{ task.completedAt }}</p></div><DomButton v-if="task.status !== 'completed'" size="sm" variant="secondary" @click="openTaskDialog(task)">Complete task</DomButton></div></div></section>
									<DomAlert v-if="selectedAccount.lastHealthRefreshReceipt" tone="success" title="Health checkpoint refreshed" :description="`${selectedAccount.lastHealthRefreshReceipt} records the intervention recalculation at ${selectedAccount.healthScore}.`" />
									<DomJsonViewer :value="planEvidence" title="Success plan and provider receipts" :filename="`${selectedAccount.plan.id}.json`" :preview-lines="12" density="compact" />
								</template>
							</div>
						</div>
					</template>
				</DomTabs>
			</main>

			<aside class="hidden min-h-0 flex-col overflow-y-auto border-l border-border md:flex">
				<div class="border-b border-border p-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Current account</p><div class="mt-3 flex items-center gap-3"><DomAvatar :name="selectedAccount.name" :initials="selectedAccount.initials" size="md" /><div class="min-w-0"><p class="truncate text-sm font-semibold">{{ selectedAccount.name }}</p><p class="mt-1 text-xs text-muted-fg">{{ selectedAccount.segment }} · {{ selectedAccount.owner }}</p></div></div><dl class="mt-3 divide-y divide-border text-sm"><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">ARR</dt><dd class="font-semibold">{{ formatCurrency(selectedAccount.arr) }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Renewal</dt><dd class="font-semibold">{{ selectedAccount.daysToRenewal }} days</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">NPS</dt><dd class="font-semibold">{{ selectedAccount.nps }}</dd></div><div class="flex justify-between gap-3 py-3"><dt class="text-muted-fg">Last touch</dt><dd class="text-right font-semibold">{{ selectedAccount.lastTouch }}</dd></div></dl></div>
				<div class="border-b border-border p-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Next best action</p><template v-if="selectedAccount.plan"><p class="mt-3 text-sm font-semibold">Continue {{ selectedAccount.plan.templateLabel.toLowerCase() }}</p><p class="mt-2 text-xs leading-5 text-muted-fg">{{ selectedAccount.plan.progress }}% complete with {{ selectedAccount.plan.tasks.length - completedTasks }} tasks remaining.</p><DomButton class="mt-4 w-full" size="sm" @click="activeView = 'plan'">Open recovery plan</DomButton></template><template v-else><p class="mt-3 text-sm font-semibold">Create a recovery plan</p><p class="mt-2 text-xs leading-5 text-muted-fg">Lock the current scorecard, risk, owner, and renewal window into accountable tasks.</p><DomButton class="mt-4 w-full" size="sm" @click="openPlanDialog">Create plan</DomButton></template></div>
				<div class="border-b border-border p-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Source freshness</p><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="measure in selectedAccount.measures" :key="measure.id" class="py-3"><div class="flex items-start justify-between gap-3"><p class="text-xs font-medium">{{ measure.source }}</p><DomStatusPill tone="success" label="Current" size="sm" /></div><p class="mt-1 text-[11px] text-muted-fg">{{ measure.freshness }}</p></div></div></div>
				<div class="p-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Account actions</p><div class="mt-3 grid gap-2"><DomButton size="sm" variant="secondary" @click="openActivityDialog">Log activity</DomButton><DomButton size="sm" variant="ghost" @click="activeView = 'timeline'">View timeline</DomButton></div></div>
			</aside>
		</div>

		<template #bottom>
			<DomAppBottomNav v-if="workspace" v-model="activeView" class="md:hidden" :items="mobileNavigation" @change="changeMobileDestination" />
		</template>
	</DomAppShell>

	<DomDialog v-if="workspace && selectedAccount" v-model="planDialogOpen" title="Create recovery plan" :description="`Preview an exact plan for ${selectedAccount.name} before launching any tasks.`" size="lg">
		<div class="grid gap-4">
			<DomSelect v-model="planTemplateId" label="Playbook template" :options="workspace.catalog.playbooks" width="min-w-0"><template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }} · {{ option.taskCount }} tasks</p></div></template></DomSelect>
			<div class="grid gap-4 sm:grid-cols-2"><DomSelect v-model="planOwnerId" label="Accountable owner" :options="workspace.catalog.owners" width="min-w-0"><template #option="{ option }"><div class="py-0.5"><p class="text-sm font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div></template></DomSelect><DomDatePicker v-model="planDueDate" label="Plan due date" /></div>
			<DomTextareaInput v-model="planObjective" label="Customer outcome" description="The measurable outcome the account team and customer should understand." :rows="3" />
			<DomTextareaInput v-model="planNote" label="Internal context" description="Stored with the immutable preview and plan receipt." :rows="3" />
		</div>
		<template #footer><DomButton variant="secondary" @click="planDialogOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'preview-plan'" @click="previewPlan">Preview plan</DomButton></template>
	</DomDialog>

	<DomDialog v-if="selectedTask" v-model="taskDialogOpen" title="Complete success-plan task" :description="selectedTask.label" size="md">
		<div class="space-y-4"><div class="grid grid-cols-2 gap-3 border-y border-border py-4 text-sm"><div><p class="text-xs text-muted-fg">Owner</p><p class="mt-1 font-semibold">{{ selectedTask.owner }}</p></div><div><p class="text-xs text-muted-fg">Due</p><p class="mt-1 font-semibold">{{ formatDate(selectedTask.dueDate) }}</p></div></div><DomTextareaInput v-model="taskCompletionNote" label="Completion note" description="Written to the official account timeline with a receipt." :rows="4" /></div>
		<template #footer><DomButton variant="secondary" @click="taskDialogOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'complete-task'" @click="completeTask">Complete task</DomButton></template>
	</DomDialog>

	<DomDialog v-if="workspace && selectedAccount" v-model="activityDialogOpen" title="Log customer activity" :description="`Add a durable update to ${selectedAccount.name}.`" size="md">
		<div class="grid gap-4"><DomSelect v-model="activityType" label="Activity type" :options="workspace.catalog.activities" /><DomTextInput v-model="activityTitle" label="Activity title" /><DomTextareaInput v-model="activityDetail" label="Account update" description="Include the customer commitment, decision, or next checkpoint." :rows="4" /></div>
		<template #footer><DomButton variant="secondary" @click="activityDialogOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'log-activity'" @click="logActivity">Log activity</DomButton></template>
	</DomDialog>
</template>

<style scoped>
.customer-health-tabs :deep([role="tablist"]) {
	display: none;
}

@media (min-width: 768px) {
	.customer-health-tabs :deep([role="tablist"]) {
		display: flex;
	}
}
</style>
