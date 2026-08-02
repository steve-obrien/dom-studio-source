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

const apiBase = '/api/block-demos/customer-activity';
const inspectorTabs = [
	{ key: 'evidence', label: 'Evidence' },
	{ key: 'work', label: 'Work' },
];

const workspace = ref(null);
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const activeView = ref('feed');
const inspectorTab = ref('evidence');
const selectedEventId = ref('');
const accountSearch = ref('');
const eventSearch = ref('');
const eventType = ref('all');
const taskDialogOpen = ref(false);
const taskAcknowledged = ref(false);
const taskTitle = ref('Confirm export recovery ETA');
const taskDetail = ref('Ask support for the mitigation owner and customer-facing ETA before the stakeholder call.');
const taskOwnerId = ref('usr_maya');
const taskPriority = ref('urgent');
const taskDueDate = ref('2026-08-04');
const noteDialogOpen = ref(false);
const noteTitle = ref('Stakeholder call context');
const noteBody = ref('Connect the export recovery plan to the renewal outcome before Friday.');
const updateDialogOpen = ref(false);
const updateAcknowledged = ref(false);
const updateChannel = ref('email');
const updateRecipient = ref('Priya Shah <priya@northstar.example>');
const updateSubject = ref('Export recovery update and next steps');
const updateBody = ref('Hi Priya, support has isolated the export timeout and will confirm the recovery ETA before our stakeholder call. I will keep this thread updated with the owner and next checkpoint.');
const completionDialogOpen = ref(false);
const selectedTask = ref(null);
const completionNote = ref('Support confirmed the mitigation owner and customer-facing recovery checkpoint.');

const selectedAccount = computed(() => workspace.value?.selectedAccount || null);
const selectedEvent = computed(getSelectedEvent);
const filteredEvents = computed(getFilteredEvents);
const filteredAccounts = computed(getFilteredAccounts);
const mobileNavigation = computed(getMobileNavigation);
const openTasks = computed(() => workspace.value?.tasks?.filter((task) => task.status === 'open') || []);
const completedTasks = computed(() => workspace.value?.tasks?.filter((task) => task.status === 'completed') || []);
const accountOptions = computed(() => workspace.value?.accounts?.map((account) => ({
	value: account.id,
	label: account.name,
	description: `${account.owner} · ${account.healthScore} health · ${formatCurrency(account.arr)}`,
	tone: statusTone(account.status),
})) || []);
const selectedEventEvidence = computed(() => selectedEvent.value ? {
	eventId: selectedEvent.value.id,
	eventVersion: selectedEvent.value.version,
	type: selectedEvent.value.type,
	occurredAt: selectedEvent.value.occurredAt,
	source: selectedEvent.value.source,
	sourceFreshness: selectedEvent.value.sourceFreshness,
	receipt: selectedEvent.value.receipt,
	review: selectedEvent.value.reviewedAt ? {
		reviewedAt: selectedEvent.value.reviewedAt,
		reviewedBy: selectedEvent.value.reviewedBy,
		receipt: selectedEvent.value.reviewReceipt,
	} : null,
	payload: selectedEvent.value.rawData,
} : {});

onMounted(loadWorkspace);

/**
 * Loads the customer activity workspace from the repository-local API.
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
		error.value = requestError.message || 'Unable to load the customer activity workspace.';
	} finally {
		loading.value = false;
	}
}

/**
 * Sends one JSON mutation and applies its authoritative response.
 *
 * @param {string} path API path below the customer-activity base URL.
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
		error.value = requestError.message || 'Customer activity action failed.';
		if (requestError.status === 409) await refreshAfterConflict();
		return null;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Reloads current server state after an exact-revision conflict.
 *
 * @returns {Promise<void>}
 */
async function refreshAfterConflict() {
	try {
		const response = await fetch(`${apiBase}/bootstrap`);
		const data = await response.json();
		if (response.ok) setWorkspace(data);
	} catch {
		// Preserve the original conflict feedback if the recovery read also fails.
	}
}

/**
 * Replaces client workspace state while preserving a valid event selection.
 *
 * @param {object} data Authoritative API workspace.
 * @returns {void}
 */
function setWorkspace(data) {
	workspace.value = data;
	if (!data.events.some((event) => event.id === selectedEventId.value)) selectedEventId.value = data.events[0]?.id || '';
	if (data.taskPreview) {
		taskTitle.value = data.taskPreview.title;
		taskDetail.value = data.taskPreview.detail;
		taskOwnerId.value = data.taskPreview.ownerId;
		taskPriority.value = data.taskPreview.priority;
		taskDueDate.value = data.taskPreview.dueDate;
	}
	if (data.updatePreview) {
		updateChannel.value = data.updatePreview.channel;
		updateRecipient.value = data.updatePreview.recipient;
		updateSubject.value = data.updatePreview.subject;
		updateBody.value = data.updatePreview.body;
	}
}

/**
 * Persists a new account selection and returns to the feed.
 *
 * @param {string} accountId Customer account identifier.
 * @returns {Promise<void>}
 */
async function selectAccount(accountId) {
	if (!workspace.value || accountId === workspace.value.selectedAccountId || busyAction.value) return;
	const data = await mutateWorkspace('/accounts/select', {
		revision: workspace.value.revision,
		accountId,
	}, 'select-account');
	if (data) {
		activeView.value = 'feed';
		inspectorTab.value = 'evidence';
		notice.value = `${data.selectedAccount.name} opened at account version ${data.selectedAccount.version}.`;
	}
}

/**
 * Selects an event and opens its evidence on narrow screens.
 *
 * @param {object} event Customer activity event.
 * @param {boolean} openDetail Whether to move the mobile destination to Detail.
 * @returns {void}
 */
function selectEvent(event, openDetail = false) {
	selectedEventId.value = event.id;
	inspectorTab.value = 'evidence';
	if (openDetail) activeView.value = 'detail';
}

/**
 * Marks the selected event as reviewed through the exact-version API.
 *
 * @returns {Promise<void>}
 */
async function reviewEvent() {
	const account = selectedAccount.value;
	const event = selectedEvent.value;
	if (!workspace.value || !account || !event || event.reviewedAt) return;
	const data = await mutateWorkspace(`/events/${event.id}/review`, {
		revision: workspace.value.revision,
		accountId: account.id,
		accountVersion: account.version,
		eventVersion: event.version,
	}, 'review-event');
	if (data) notice.value = `${data.events.find((item) => item.id === event.id)?.reviewReceipt} recorded the review.`;
}

/**
 * Loads the next page of server-owned account activity.
 *
 * @returns {Promise<void>}
 */
async function loadMoreEvents() {
	const account = selectedAccount.value;
	if (!workspace.value || !account || !workspace.value.eventPage.canLoadMore) return;
	const data = await mutateWorkspace('/events/load-more', {
		revision: workspace.value.revision,
		accountId: account.id,
		accountVersion: account.version,
	}, 'load-more');
	if (data) notice.value = `${data.eventPage.visible} of ${data.eventPage.total} account events are loaded.`;
}

/**
 * Opens the task workflow with defaults derived from the selected event.
 *
 * @returns {void}
 */
function openTaskDialog() {
	const event = selectedEvent.value;
	if (!event) return;
	taskAcknowledged.value = false;
	taskTitle.value = event.type === 'support' ? 'Confirm export recovery ETA' : `Follow up: ${event.title}`;
	taskDetail.value = `Review ${event.receipt} and turn the customer impact into an owned next step.`;
	taskOwnerId.value = selectedAccount.value?.ownerId || workspace.value.currentOperator.id;
	taskPriority.value = event.importance === 'high' ? 'urgent' : 'high';
	taskDialogOpen.value = true;
}

/**
 * Creates an immutable task preview from the selected source event.
 *
 * @returns {Promise<void>}
 */
async function previewTask() {
	const account = selectedAccount.value;
	const event = selectedEvent.value;
	if (!workspace.value || !account || !event) return;
	const data = await mutateWorkspace('/tasks/preview', {
		revision: workspace.value.revision,
		accountId: account.id,
		accountVersion: account.version,
		eventId: event.id,
		eventVersion: event.version,
		title: taskTitle.value,
		detail: taskDetail.value,
		ownerId: taskOwnerId.value,
		priority: taskPriority.value,
		dueDate: taskDueDate.value,
	}, 'preview-task');
	if (data) notice.value = `${data.taskPreview.receipt} locks the task owner, date, and source evidence.`;
}

/**
 * Creates the acknowledged task from its immutable preview.
 *
 * @returns {Promise<void>}
 */
async function createTask() {
	if (!workspace.value?.taskPreview) return;
	const data = await mutateWorkspace('/tasks', {
		revision: workspace.value.revision,
		previewId: workspace.value.taskPreview.id,
		acknowledged: taskAcknowledged.value,
	}, 'create-task');
	if (data) {
		taskDialogOpen.value = false;
		taskAcknowledged.value = false;
		activeView.value = 'work';
		inspectorTab.value = 'work';
		notice.value = `${data.tasks[0].receipt} created an accountable follow-up task.`;
	}
}

/**
 * Opens one task for evidence-backed completion.
 *
 * @param {object} task Follow-up task.
 * @returns {void}
 */
function openCompletionDialog(task) {
	selectedTask.value = task;
	completionNote.value = 'Support confirmed the mitigation owner and customer-facing recovery checkpoint.';
	completionDialogOpen.value = true;
}

/**
 * Completes the selected exact-version task with a durable note.
 *
 * @returns {Promise<void>}
 */
async function completeTask() {
	if (!workspace.value || !selectedTask.value) return;
	const data = await mutateWorkspace(`/tasks/${selectedTask.value.id}/complete`, {
		revision: workspace.value.revision,
		taskVersion: selectedTask.value.version,
		note: completionNote.value,
	}, 'complete-task');
	if (data) {
		completionDialogOpen.value = false;
		selectedTask.value = null;
		notice.value = `${data.tasks.find((task) => task.status === 'completed')?.completionReceipt} completed the task.`;
	}
}

/**
 * Opens the internal-note workflow.
 *
 * @returns {void}
 */
function openNoteDialog() {
	noteDialogOpen.value = true;
}

/**
 * Saves a durable internal note to the account timeline.
 *
 * @returns {Promise<void>}
 */
async function saveNote() {
	const account = selectedAccount.value;
	if (!workspace.value || !account) return;
	const data = await mutateWorkspace('/notes', {
		revision: workspace.value.revision,
		accountId: account.id,
		accountVersion: account.version,
		title: noteTitle.value,
		body: noteBody.value,
	}, 'save-note');
	if (data) {
		noteDialogOpen.value = false;
		selectedEventId.value = data.events[0]?.id || selectedEventId.value;
		notice.value = `${data.events[0]?.receipt} added the note to the official timeline.`;
	}
}

/**
 * Opens the customer-update workflow with event-aware copy.
 *
 * @returns {void}
 */
function openUpdateDialog() {
	const event = selectedEvent.value;
	if (!event) return;
	updateAcknowledged.value = false;
	updateSubject.value = event.type === 'support' ? 'Export recovery update and next steps' : `Update: ${event.title}`;
	updateBody.value = `Hi ${selectedAccount.value?.champion?.split(',')[0] || 'there'}, we are following up on ${event.title.toLowerCase()}. I will share the accountable owner and next checkpoint in this thread.`;
	updateDialogOpen.value = true;
}

/**
 * Creates an immutable outbound update preview.
 *
 * @returns {Promise<void>}
 */
async function previewUpdate() {
	const account = selectedAccount.value;
	const event = selectedEvent.value;
	if (!workspace.value || !account || !event) return;
	const data = await mutateWorkspace('/updates/preview', {
		revision: workspace.value.revision,
		accountId: account.id,
		accountVersion: account.version,
		eventId: event.id,
		eventVersion: event.version,
		channel: updateChannel.value,
		recipient: updateRecipient.value,
		subject: updateSubject.value,
		body: updateBody.value,
	}, 'preview-update');
	if (data) notice.value = `${data.updatePreview.receipt} locks the recipient, message, and source evidence.`;
}

/**
 * Sends an acknowledged customer update through its server-selected provider.
 *
 * @returns {Promise<void>}
 */
async function sendUpdate() {
	if (!workspace.value?.updatePreview) return;
	const data = await mutateWorkspace('/updates', {
		revision: workspace.value.revision,
		previewId: workspace.value.updatePreview.id,
		acknowledged: updateAcknowledged.value,
	}, 'send-update');
	if (data) {
		updateDialogOpen.value = false;
		updateAcknowledged.value = false;
		activeView.value = 'work';
		inspectorTab.value = 'work';
		notice.value = `${data.lastDelivery.id} confirms ${data.lastDelivery.channel} delivery.`;
	}
}

/**
 * Restores the original deterministic account activity.
 *
 * @returns {Promise<void>}
 */
async function resetDemo() {
	const data = await mutateWorkspace('/reset', {}, 'reset');
	if (data) {
		activeView.value = 'feed';
		inspectorTab.value = 'evidence';
		eventType.value = 'all';
		eventSearch.value = '';
		accountSearch.value = '';
		notice.value = 'Customer activity demo restored.';
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
 * Filters the server-visible event page by rich local controls.
 *
 * @returns {object[]} Visible activity events.
 */
function getFilteredEvents() {
	if (!workspace.value) return [];
	const query = eventSearch.value.trim().toLowerCase();
	return workspace.value.events.filter((event) => {
		const matchesType = eventType.value === 'all' || event.type === eventType.value;
		const matchesSearch = !query || [event.title, event.summary, event.source, event.actor, event.receipt].some((value) => String(value).toLowerCase().includes(query));
		return matchesType && matchesSearch;
	});
}

/**
 * Filters the account rail by account, owner, or segment.
 *
 * @returns {object[]} Visible account options.
 */
function getFilteredAccounts() {
	if (!workspace.value) return [];
	const query = accountSearch.value.trim().toLowerCase();
	return workspace.value.accounts.filter((account) => !query || [account.name, account.owner, account.segment].some((value) => String(value).toLowerCase().includes(query)));
}

/**
 * Returns the selected event or a stable fallback from the visible page.
 *
 * @returns {object|null} Selected event.
 */
function getSelectedEvent() {
	if (!workspace.value) return null;
	return workspace.value.events.find((event) => event.id === selectedEventId.value) || workspace.value.events[0] || null;
}

/**
 * Returns focused mobile destinations with useful work counts.
 *
 * @returns {object[]} Bottom navigation items.
 */
function getMobileNavigation() {
	return [
		{ value: 'feed', label: 'Feed', badge: workspace.value?.summary?.unreviewed || undefined },
		{ value: 'detail', label: 'Detail' },
		{ value: 'work', label: 'Work', badge: workspace.value?.summary?.openTasks || undefined },
	];
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
	return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(Number(value || 0));
}

/**
 * Formats one ISO date for concise customer-success UI.
 *
 * @param {string} value ISO date.
 * @returns {string} Human-readable date.
 */
function formatDate(value) {
	if (!value) return 'Not set';
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00.000Z`));
}

/**
 * Maps internal keys to readable labels.
 *
 * @param {string} value Internal key.
 * @returns {string} Human-readable label.
 */
function humanize(value) {
	return String(value || 'Unknown').replaceAll('-', ' ').replace(/^./, (character) => character.toUpperCase());
}

/**
 * Maps workflow and account states to semantic DOM Studio tones.
 *
 * @param {string} status Internal status or importance.
 * @returns {string} DOM Studio tone.
 */
function statusTone(status) {
	if (['healthy', 'positive', 'completed', 'passed', 'delivered'].includes(status)) return 'success';
	if (['high', 'urgent', 'at-risk'].includes(status)) return 'danger';
	if (['medium', 'monitoring', 'open'].includes(status)) return 'warning';
	if (['product', 'revenue', 'support', 'lifecycle', 'work'].includes(status)) return 'info';
	return 'neutral';
}
</script>

<template>
	<DomAppShell class="!h-dvh">
		<template #top>
			<DomAppTopBar v-if="workspace" class="md:hidden" :title="selectedAccount?.name || 'Customer activity'" :subtitle="`${workspace.summary.unreviewed} unreviewed · ${workspace.summary.openTasks} open tasks`" large>
				<template #trailing><DomButton size="sm" variant="ghost" :loading="busyAction === 'reset'" @click="resetDemo">Reset</DomButton></template>
			</DomAppTopBar>
			<header v-if="workspace" class="hidden min-w-0 items-center justify-between gap-5 border-b border-border px-5 py-3 md:flex">
				<div class="min-w-0"><div class="flex items-center gap-2"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Customer success</p><DomStatusPill :tone="statusTone(selectedAccount?.status)" :label="humanize(selectedAccount?.status)" size="sm" /></div><h1 class="mt-1 truncate text-xl font-semibold">Account activity inbox</h1></div>
				<div class="flex shrink-0 items-center gap-3"><p class="hidden text-xs text-muted-fg lg:block">Workspace revision {{ workspace.revision }} · {{ workspace.updatedAt }}</p><DomButton size="sm" variant="secondary" :loading="busyAction === 'reset'" @click="resetDemo">Reset demo</DomButton></div>
			</header>
		</template>

		<div v-if="loading" class="grid h-full min-h-0 gap-4 p-4 md:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[15rem_minmax(0,1fr)_21rem]">
			<DomSkeleton class="hidden h-full xl:block" /><div class="space-y-3"><DomSkeleton class="h-24" /><DomSkeleton class="h-96" /></div><DomSkeleton class="hidden h-full md:block" />
		</div>

		<DomEmptyState v-else-if="!workspace" title="Customer activity unavailable" description="Reload the API-backed workspace to continue.">
			<template #actions><DomButton @click="loadWorkspace">Retry</DomButton></template>
		</DomEmptyState>

		<div v-else class="grid h-full min-h-0 min-w-0 md:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[15rem_minmax(0,1fr)_21rem]">
			<aside class="hidden min-h-0 flex-col overflow-hidden border-r border-border xl:flex">
				<div class="shrink-0 border-b border-border p-3"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Account book</p><DomTextInput v-model="accountSearch" class="mt-3" label="Find account" placeholder="Name, owner, segment" /></div>
				<div class="min-h-0 flex-1 overflow-y-auto">
					<DomAppListItem v-for="account in filteredAccounts" :key="account.id" :label="account.name" :description="`${account.owner} · ${account.segment}`" :meta="`${account.daysToRenewal}d`" :selected="account.id === workspace.selectedAccountId" @click="selectAccount(account.id)">
						<template #icon><DomAvatar :name="account.name" :initials="account.initials" size="sm" /></template>
						<template #trailing><div class="text-right"><DomStatusPill :tone="statusTone(account.status)" :label="String(account.healthScore)" size="sm" /><p v-if="account.unreviewedCount" class="mt-1 text-[10px] text-muted-fg">{{ account.unreviewedCount }} new</p></div></template>
					</DomAppListItem>
				</div>
				<div class="shrink-0 border-t border-border p-4"><DomAvatar :name="workspace.currentOperator.name" :initials="workspace.currentOperator.initials" size="sm" /><p class="mt-3 text-sm font-semibold">{{ workspace.currentOperator.name }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ workspace.currentOperator.role }}</p></div>
			</aside>

			<main class="flex min-h-0 min-w-0 flex-col overflow-hidden">
				<DomAlert v-if="error" class="mx-3 mt-3" tone="danger" title="Customer activity action failed" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-else-if="notice" class="mx-3 mt-3" tone="success" title="Account record updated" :description="notice" dismissible @dismiss="notice = ''" />

				<section v-if="activeView === 'feed' || activeView === 'detail' || activeView === 'work'" class="flex h-full min-h-0 flex-col md:hidden">
					<div v-if="activeView === 'feed'" class="flex h-full min-h-0 flex-col">
						<div class="shrink-0 border-b border-border p-3"><DomSelect :model-value="workspace.selectedAccountId" label="Account" :options="accountOptions" searchable width="min-w-0" @update:model-value="selectAccount"><template #option="{ option }"><div><p class="font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><div class="mt-3 grid grid-cols-[minmax(0,1fr)_9rem] gap-2"><DomTextInput v-model="eventSearch" type="search" label="Search" placeholder="Event or receipt" /><DomSelect v-model="eventType" label="Type" :options="workspace.catalog.eventTypes" width="min-w-[14rem]" /></div></div>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="grid grid-cols-4 gap-px border-b border-border bg-border"><div class="bg-canvas p-2.5"><p class="text-[10px] text-muted-fg">Health</p><p class="mt-1 font-semibold">{{ selectedAccount.healthScore }}</p></div><div class="bg-canvas p-2.5"><p class="text-[10px] text-muted-fg">Events</p><p class="mt-1 font-semibold">{{ workspace.summary.totalEvents }}</p></div><div class="bg-canvas p-2.5"><p class="text-[10px] text-muted-fg">New</p><p class="mt-1 font-semibold">{{ workspace.summary.unreviewed }}</p></div><div class="bg-canvas p-2.5"><p class="text-[10px] text-muted-fg">Tasks</p><p class="mt-1 font-semibold">{{ workspace.summary.openTasks }}</p></div></div>
							<DomEmptyState v-if="!filteredEvents.length" title="No activity matches" description="Change the rich event type or search filter." />
							<button v-for="event in filteredEvents" v-else :key="event.id" type="button" class="w-full border-b border-border px-4 py-4 text-left transition hover:bg-secondary/40" @click="selectEvent(event, true)"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><DomStatusPill :tone="statusTone(event.importance)" :label="humanize(event.importance)" size="sm" /><span class="text-[11px] text-muted-fg">{{ event.displayTime }} · {{ event.source }}</span></div><h2 class="mt-2 text-sm font-semibold">{{ event.title }}</h2><p class="mt-1 line-clamp-2 text-xs leading-5 text-muted-fg">{{ event.summary }}</p></div><span v-if="!event.reviewedAt" class="mt-1 size-2 shrink-0 rounded-full bg-primary" aria-label="Unreviewed"></span></div></button>
							<div v-if="workspace.eventPage.canLoadMore" class="p-4"><DomButton class="w-full" variant="secondary" :loading="busyAction === 'load-more'" @click="loadMoreEvents">Load older activity</DomButton></div>
						</div>
					</div>

					<div v-else-if="activeView === 'detail'" class="h-full min-h-0 overflow-y-auto p-4">
						<DomEmptyState v-if="!selectedEvent" title="No event selected" description="Choose an account activity from Feed first." />
						<div v-else class="grid gap-5"><div><div class="flex flex-wrap items-center gap-2"><DomStatusPill :tone="statusTone(selectedEvent.importance)" :label="humanize(selectedEvent.importance)" /><DomBadge tone="neutral" variant="soft">v{{ selectedEvent.version }}</DomBadge></div><h2 class="mt-3 text-xl font-semibold">{{ selectedEvent.title }}</h2><p class="mt-2 text-sm leading-6 text-muted-fg">{{ selectedEvent.summary }}</p></div><DomAlert :tone="statusTone(selectedEvent.importance)" title="Account impact" :description="selectedEvent.impact" /><dl class="divide-y divide-border border-y border-border text-sm"><div v-for="item in selectedEvent.metadata" :key="item.label" class="flex justify-between gap-4 py-3"><dt class="text-muted-fg">{{ item.label }}</dt><dd class="text-right font-semibold">{{ item.value }}</dd></div></dl><div class="grid grid-cols-2 gap-2"><DomButton variant="secondary" :disabled="Boolean(selectedEvent.reviewedAt)" :loading="busyAction === 'review-event'" @click="reviewEvent">{{ selectedEvent.reviewedAt ? 'Reviewed' : 'Mark reviewed' }}</DomButton><DomButton @click="openTaskDialog">Create task</DomButton><DomButton variant="secondary" @click="openNoteDialog">Add note</DomButton><DomButton @click="openUpdateDialog">Send update</DomButton></div><DomJsonViewer :value="selectedEventEvidence" title="Immutable event evidence" :filename="`${selectedEvent.id}.json`" :preview-lines="12" density="compact" /></div>
					</div>

					<div v-else class="h-full min-h-0 overflow-y-auto p-4">
						<div class="flex items-end justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Account work</p><h2 class="mt-1 text-xl font-semibold">Follow-through</h2></div><DomButton size="sm" variant="secondary" @click="openNoteDialog">Add note</DomButton></div>
						<DomAlert v-if="workspace.lastDelivery" class="mt-4" tone="success" title="Customer update delivered" :description="`${workspace.lastDelivery.id} · ${workspace.lastDelivery.recipient}`" />
						<section class="mt-5"><div class="flex items-center justify-between gap-3"><h3 class="font-semibold">Open tasks</h3><DomBadge tone="warning" variant="soft">{{ openTasks.length }}</DomBadge></div><DomEmptyState v-if="!openTasks.length" class="mt-3" title="No open follow-ups" description="Create one from a source event in Detail." /><div v-else class="mt-3 divide-y divide-border border-y border-border"><article v-for="task in openTasks" :key="task.id" class="py-4"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-semibold">{{ task.title }}</p><p class="mt-1 text-xs text-muted-fg">{{ task.owner }} · due {{ formatDate(task.dueDate) }}</p></div><DomStatusPill :tone="statusTone(task.priority)" :label="humanize(task.priority)" size="sm" /></div><p class="mt-2 text-sm leading-6 text-muted-fg">{{ task.detail }}</p><DomButton class="mt-3" size="sm" variant="secondary" @click="openCompletionDialog(task)">Complete with evidence</DomButton></article></div></section>
						<section v-if="completedTasks.length" class="mt-6"><h3 class="font-semibold">Completed</h3><div class="mt-3 divide-y divide-border border-y border-border"><article v-for="task in completedTasks" :key="task.id" class="py-3"><div class="flex items-center justify-between gap-3"><p class="text-sm font-medium">{{ task.title }}</p><DomStatusPill tone="success" label="Complete" size="sm" /></div><p class="mt-1 text-xs text-muted-fg">{{ task.completionReceipt }}</p></article></div></section>
					</div>
				</section>

				<section class="hidden h-full min-h-0 flex-col md:flex">
					<div class="shrink-0 border-b border-border p-4"><div class="flex flex-wrap items-end justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Official account record</p><h2 class="mt-1 text-xl font-semibold">{{ selectedAccount.name }}</h2><p class="mt-1 text-xs text-muted-fg">{{ selectedAccount.owner }} · {{ formatCurrency(selectedAccount.arr) }} ARR · renews {{ formatDate(selectedAccount.renewalDate) }}</p></div><div class="grid grid-cols-3 gap-px overflow-hidden border border-border bg-border"><div class="bg-canvas px-3 py-2 text-center"><p class="text-[10px] text-muted-fg">Health</p><p class="font-semibold">{{ selectedAccount.healthScore }}</p></div><div class="bg-canvas px-3 py-2 text-center"><p class="text-[10px] text-muted-fg">New</p><p class="font-semibold">{{ workspace.summary.unreviewed }}</p></div><div class="bg-canvas px-3 py-2 text-center"><p class="text-[10px] text-muted-fg">Tasks</p><p class="font-semibold">{{ workspace.summary.openTasks }}</p></div></div></div><div class="mt-4 grid grid-cols-[minmax(0,1fr)_12rem] gap-3"><DomTextInput v-model="eventSearch" type="search" label="Search activity" placeholder="Event, source, receipt" /><DomSelect v-model="eventType" label="Event type" :options="workspace.catalog.eventTypes" width="min-w-[16rem]"><template #option="{ option }"><div><p class="font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div></div>
					<div class="min-h-0 flex-1 overflow-y-auto">
						<DomEmptyState v-if="!filteredEvents.length" title="No activity matches" description="Change the event type or search filter." />
						<button v-for="event in filteredEvents" v-else :key="event.id" type="button" class="group grid w-full grid-cols-[5.5rem_minmax(0,1fr)] border-b border-border text-left transition hover:bg-secondary/40" :class="event.id === selectedEvent?.id ? 'bg-secondary/60' : ''" @click="selectEvent(event)"><div class="border-r border-border px-3 py-4"><p class="text-[11px] font-medium text-muted-fg">{{ event.displayTime.split(' · ')[0] }}</p><p class="mt-1 text-[11px] text-muted-fg">{{ event.displayTime.split(' · ')[1] || '' }}</p><span class="mt-3 block size-2 rounded-full" :class="event.reviewedAt ? 'bg-border' : 'bg-primary'" :aria-label="event.reviewedAt ? 'Reviewed' : 'Unreviewed'"></span></div><div class="min-w-0 px-4 py-4"><div class="flex flex-wrap items-center gap-2"><DomStatusPill :tone="statusTone(event.importance)" :label="humanize(event.importance)" size="sm" /><DomBadge tone="neutral" variant="soft">{{ event.source }}</DomBadge><span class="ml-auto text-[11px] text-muted-fg">{{ event.receipt }}</span></div><h3 class="mt-2 text-sm font-semibold group-hover:text-primary">{{ event.title }}</h3><p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.summary }}</p><div v-if="event.actionStatus || event.reviewedAt" class="mt-2 flex flex-wrap gap-2"><DomBadge v-if="event.actionStatus" tone="success" variant="soft">{{ event.actionStatus }}</DomBadge><span v-if="event.reviewedAt" class="text-[11px] text-muted-fg">Reviewed by {{ event.reviewedBy }}</span></div></div></button>
						<div v-if="workspace.eventPage.canLoadMore" class="p-4"><DomButton class="w-full" variant="secondary" :loading="busyAction === 'load-more'" @click="loadMoreEvents">Load older activity · {{ workspace.eventPage.visible }} of {{ workspace.eventPage.total }}</DomButton></div>
					</div>
				</section>
			</main>

			<aside class="hidden min-h-0 flex-col overflow-hidden border-l border-border md:flex">
				<DomEmptyState v-if="!selectedEvent" title="Select an event" description="Choose an activity to inspect evidence and create work." />
				<template v-else>
					<div class="shrink-0 border-b border-border p-4"><div class="flex flex-wrap items-center gap-2"><DomStatusPill :tone="statusTone(selectedEvent.importance)" :label="humanize(selectedEvent.importance)" size="sm" /><DomBadge tone="neutral" variant="soft">Event v{{ selectedEvent.version }}</DomBadge></div><h2 class="mt-3 text-base font-semibold">{{ selectedEvent.title }}</h2><p class="mt-2 text-xs leading-5 text-muted-fg">{{ selectedEvent.impact }}</p></div>
					<DomTabs v-model="inspectorTab" :tabs="inspectorTabs" class="activity-inspector-tabs flex min-h-0 flex-1 flex-col overflow-hidden">
						<template #evidence><div class="h-full min-h-0 overflow-y-auto p-4"><div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Source lineage</p><p class="mt-2 text-sm font-semibold">{{ selectedEvent.source }}</p><p class="mt-1 text-xs text-muted-fg">{{ selectedEvent.sourceFreshness }}</p></div><DomStatusPill tone="success" label="Delivered" size="sm" /></div><dl class="mt-4 divide-y divide-border border-y border-border text-xs"><div v-for="item in selectedEvent.metadata" :key="item.label" class="flex justify-between gap-4 py-3"><dt class="text-muted-fg">{{ item.label }}</dt><dd class="text-right font-semibold">{{ item.value }}</dd></div></dl><div class="mt-4 grid grid-cols-2 gap-2"><DomButton variant="secondary" size="sm" :disabled="Boolean(selectedEvent.reviewedAt)" :loading="busyAction === 'review-event'" @click="reviewEvent">{{ selectedEvent.reviewedAt ? 'Reviewed' : 'Mark reviewed' }}</DomButton><DomButton size="sm" @click="openTaskDialog">Create task</DomButton><DomButton variant="secondary" size="sm" @click="openNoteDialog">Add note</DomButton><DomButton size="sm" @click="openUpdateDialog">Send update</DomButton></div><DomJsonViewer class="mt-5" :value="selectedEventEvidence" title="Immutable event" :filename="`${selectedEvent.id}.json`" :preview-lines="10" density="compact" /></div></template>
						<template #work><div class="h-full min-h-0 overflow-y-auto p-4"><DomAlert v-if="workspace.lastDelivery" tone="success" title="Update delivered" :description="`${workspace.lastDelivery.id} · ${workspace.lastDelivery.recipient}`" /><div class="mt-4 flex items-center justify-between gap-3"><h3 class="text-sm font-semibold">Open follow-ups</h3><DomBadge tone="warning" variant="soft">{{ openTasks.length }}</DomBadge></div><DomEmptyState v-if="!openTasks.length" class="mt-3" title="No open tasks" description="Create an accountable task from the selected event." /><div v-else class="mt-3 divide-y divide-border border-y border-border"><article v-for="task in openTasks" :key="task.id" class="py-3"><div class="flex items-start justify-between gap-3"><p class="text-sm font-semibold">{{ task.title }}</p><DomStatusPill :tone="statusTone(task.priority)" :label="humanize(task.priority)" size="sm" /></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ task.owner }} · due {{ formatDate(task.dueDate) }}</p><DomButton class="mt-3" size="sm" variant="secondary" @click="openCompletionDialog(task)">Complete with evidence</DomButton></article></div><div class="mt-5 grid grid-cols-2 gap-2"><DomButton size="sm" variant="secondary" @click="openNoteDialog">Add note</DomButton><DomButton size="sm" @click="openUpdateDialog">Send update</DomButton></div></div></template>
					</DomTabs>
				</template>
			</aside>
		</div>

		<template #bottom><DomAppBottomNav v-if="workspace" v-model="activeView" class="md:hidden" :items="mobileNavigation" @change="changeMobileDestination" /></template>
	</DomAppShell>

	<DomDialog v-if="workspace && selectedAccount && selectedEvent" v-model="taskDialogOpen" title="Create follow-up task" :description="`Turn ${selectedEvent.receipt} into accountable work for ${selectedAccount.name}.`" size="lg">
		<div v-if="workspace.taskPreview" class="grid gap-4"><DomAlert tone="warning" title="Immutable task preview" :description="`${workspace.taskPreview.receipt} locks event v${workspace.taskPreview.eventVersion}, owner, due date, and priority.`" /><dl class="grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-3"><div><dt class="text-xs text-muted-fg">Owner</dt><dd class="mt-1 font-semibold">{{ workspace.taskPreview.owner }}</dd></div><div><dt class="text-xs text-muted-fg">Priority</dt><dd class="mt-1 font-semibold">{{ humanize(workspace.taskPreview.priority) }}</dd></div><div><dt class="text-xs text-muted-fg">Due</dt><dd class="mt-1 font-semibold">{{ formatDate(workspace.taskPreview.dueDate) }}</dd></div></dl><div class="divide-y divide-border border-y border-border"><div v-for="check in workspace.taskPreview.checks" :key="check.id" class="py-3"><div class="flex items-start justify-between gap-3"><p class="text-sm font-medium">{{ check.label }}</p><DomStatusPill :tone="statusTone(check.state)" :label="humanize(check.state)" size="sm" /></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div></div><DomCheckbox v-model="taskAcknowledged" label="I reviewed the owner, due date, priority, and source evidence" /></div>
		<div v-else class="grid gap-4"><DomTextInput v-model="taskTitle" label="Task title" /><DomTextareaInput v-model="taskDetail" label="Outcome and context" :rows="3" /><div class="grid gap-4 sm:grid-cols-3"><DomSelect v-model="taskOwnerId" label="Owner" :options="workspace.catalog.owners" width="min-w-0"><template #option="{ option }"><div><p class="font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="taskPriority" label="Priority" :options="workspace.catalog.priorities" width="min-w-0"><template #option="{ option }"><div><p class="font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomDatePicker v-model="taskDueDate" label="Due date" /></div></div>
		<template #footer><DomButton variant="secondary" @click="taskDialogOpen = false">Cancel</DomButton><DomButton v-if="workspace.taskPreview" :disabled="!taskAcknowledged" :loading="busyAction === 'create-task'" @click="createTask">Create task</DomButton><DomButton v-else :loading="busyAction === 'preview-task'" @click="previewTask">Preview task</DomButton></template>
	</DomDialog>

	<DomDialog v-if="workspace && selectedAccount" v-model="noteDialogOpen" title="Add internal note" :description="`Write durable account context for ${selectedAccount.name}.`" size="md">
		<div class="grid gap-4"><DomTextInput v-model="noteTitle" label="Note title" /><DomTextareaInput v-model="noteBody" label="Internal context" description="Written to the official account timeline with an immutable receipt." :rows="5" /></div>
		<template #footer><DomButton variant="secondary" @click="noteDialogOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'save-note'" @click="saveNote">Save note</DomButton></template>
	</DomDialog>

	<DomDialog v-if="workspace && selectedEvent" v-model="updateDialogOpen" title="Send customer update" :description="`Preview the exact message and provider route for ${selectedEvent.receipt}.`" size="lg">
		<div v-if="workspace.updatePreview" class="grid gap-4"><DomAlert tone="warning" title="Immutable delivery preview" :description="`${workspace.updatePreview.receipt} locks the recipient, message, channel, and event evidence.`" /><div class="border-y border-border py-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ workspace.updatePreview.channel }} · {{ workspace.updatePreview.recipient }}</p><h3 class="mt-3 font-semibold">{{ workspace.updatePreview.subject }}</h3><p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-fg">{{ workspace.updatePreview.body }}</p></div><div class="divide-y divide-border border-y border-border"><div v-for="check in workspace.updatePreview.checks" :key="check.id" class="py-3"><div class="flex items-start justify-between gap-3"><p class="text-sm font-medium">{{ check.label }}</p><DomStatusPill :tone="statusTone(check.state)" :label="humanize(check.state)" size="sm" /></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div></div><DomCheckbox v-model="updateAcknowledged" label="I reviewed the recipient, message, delivery route, and source evidence" /></div>
		<div v-else class="grid gap-4"><div class="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]"><DomSelect v-model="updateChannel" label="Delivery channel" :options="workspace.catalog.channels" width="min-w-0"><template #option="{ option }"><div><p class="font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomTextInput v-model="updateRecipient" label="Recipient" /></div><DomTextInput v-model="updateSubject" label="Subject" /><DomTextareaInput v-model="updateBody" label="Customer update" :rows="6" /></div>
		<template #footer><DomButton variant="secondary" @click="updateDialogOpen = false">Cancel</DomButton><DomButton v-if="workspace.updatePreview" :disabled="!updateAcknowledged" :loading="busyAction === 'send-update'" @click="sendUpdate">Send update</DomButton><DomButton v-else :loading="busyAction === 'preview-update'" @click="previewUpdate">Preview delivery</DomButton></template>
	</DomDialog>

	<DomDialog v-if="selectedTask" v-model="completionDialogOpen" title="Complete follow-up task" :description="selectedTask.title" size="md">
		<div class="grid gap-4"><dl class="grid grid-cols-2 gap-3 border-y border-border py-4 text-sm"><div><dt class="text-xs text-muted-fg">Owner</dt><dd class="mt-1 font-semibold">{{ selectedTask.owner }}</dd></div><div><dt class="text-xs text-muted-fg">Due</dt><dd class="mt-1 font-semibold">{{ formatDate(selectedTask.dueDate) }}</dd></div></dl><DomTextareaInput v-model="completionNote" label="Completion evidence" description="Written to the account timeline and task receipt." :rows="4" /></div>
		<template #footer><DomButton variant="secondary" @click="completionDialogOpen = false">Cancel</DomButton><DomButton :loading="busyAction === 'complete-task'" @click="completeTask">Complete task</DomButton></template>
	</DomDialog>
</template>

<style scoped>
.activity-inspector-tabs :deep([role="tablist"]) {
	flex-shrink: 0;
}
</style>
