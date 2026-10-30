<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomAppBottomNav,
	DomAppListItem,
	DomAppTopBar,
	DomAvatar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomDrawer,
	DomEmptyState,
	DomIconButton,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTextareaInput,
	DomTextInput,
	DomToggleButtonGroup,
} from '@getdom/studio/vue';
import SupportTicketDetails from './SupportTicketDetails.vue';

const workspaceRevision = ref(0);
const catalogs = ref({ views: [], assignees: [], priorities: [], resolutionCodes: [] });
const summary = ref({ open: 0, mine: 0, unassigned: 0, attention: 0, resolved: 0, csat: 0 });
const tickets = ref([]);
const activeTicket = ref(null);
const selectedTicketId = ref('');
const selectedView = ref('attention');
const searchQuery = ref('');
const mobileView = ref('inbox');
const compactViewport = ref(false);
const loadingWorkspace = ref(true);
const loadingTicket = ref(false);
const busyAction = ref('');
const actionError = ref('');
const fieldErrors = ref({});
const composerMode = ref('public');
const replyDraft = ref('');
const detailsDrawerOpen = ref(false);
const resolveDialogOpen = ref(false);
const resolutionCode = ref('solved');
const resolutionNote = ref('Customer can invite both teammates after the verified domain-policy update.');
const resolutionAcknowledged = ref(false);

let viewportQuery = null;

const filteredTickets = computed(() => tickets.value.filter(matchesSelectedView).filter(matchesSearch));
const currentAssignee = computed(() => catalogs.value.assignees?.find((option) => option.value === activeTicket.value?.assigneeId) || null);
const failedMessages = computed(() => activeTicket.value?.messages?.filter((message) => message.status === 'failed') || []);
const isResolved = computed(() => activeTicket.value?.state === 'resolved');
const viewOptions = computed(() => catalogs.value.views?.map((view) => ({
	...view,
	label: `${view.label} · ${viewCount(view.value)}`,
})) || []);
const mobileNavigation = computed(() => [
	{ value: 'inbox', label: 'Inbox', badge: String(filteredTickets.value.length || '') },
	{ value: 'conversation', label: 'Conversation' },
	{ value: 'details', label: 'Details', badge: failedMessages.value.length ? String(failedMessages.value.length) : '' },
]);
const composerOptions = [
	{ value: 'public', label: 'Customer reply' },
	{ value: 'internal', label: 'Internal note' },
];

onMounted(initializeWorkspace);
onBeforeUnmount(disposeWorkspace);

/**
 * Initializes breakpoint state before loading the support API.
 *
 * @returns {Promise<void>} Resolves when the first ticket is ready.
 */
async function initializeWorkspace() {
	viewportQuery = window.matchMedia('(max-width: 767px)');
	syncViewport(viewportQuery);
	viewportQuery.addEventListener('change', syncViewport);
	await loadWorkspace();
}

/**
 * Removes the responsive media-query listener.
 *
 * @returns {void}
 */
function disposeWorkspace() {
	viewportQuery?.removeEventListener('change', syncViewport);
}

/**
 * Synchronizes the mobile navigation state with the current viewport.
 *
 * @param {MediaQueryList|MediaQueryListEvent} query Media query state.
 * @returns {void}
 */
function syncViewport(query) {
	compactViewport.value = Boolean(query.matches);
	if (!compactViewport.value) mobileView.value = 'conversation';
	else if (!selectedTicketId.value) mobileView.value = 'inbox';
}

/**
 * Loads queue summaries and then hydrates the selected ticket detail.
 *
 * @param {string} preferredTicketId Optional ticket to preserve across reloads.
 * @returns {Promise<void>} Resolves after workspace state is applied.
 */
async function loadWorkspace(preferredTicketId = '') {
	loadingWorkspace.value = true;
	actionError.value = '';
	try {
		const payload = await requestJson('/api/block-demos/support-center/workspace');
		workspaceRevision.value = payload.workspaceRevision;
		catalogs.value = payload.catalogs || catalogs.value;
		summary.value = payload.summary || summary.value;
		tickets.value = payload.tickets || [];
		const targetId = preferredTicketId || selectedTicketId.value || payload.selectedTicketId || tickets.value[0]?.id;
		if (targetId) await loadTicket(targetId, false);
	} catch (error) {
		actionError.value = error.message;
	} finally {
		loadingWorkspace.value = false;
	}
}

/**
 * Loads one complete ticket and optionally focuses the mobile conversation.
 *
 * @param {string} ticketId Ticket identifier.
 * @param {boolean} focusConversation Whether to switch mobile views after selection.
 * @returns {Promise<void>} Resolves after ticket detail is applied.
 */
async function loadTicket(ticketId, focusConversation = true) {
	if (!ticketId) return;
	loadingTicket.value = true;
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/support-center/tickets/${encodeURIComponent(ticketId)}`);
		workspaceRevision.value = payload.workspaceRevision;
		activeTicket.value = payload.ticket;
		selectedTicketId.value = payload.ticket.id;
		if (focusConversation && compactViewport.value) mobileView.value = 'conversation';
	} catch (error) {
		actionError.value = error.message;
	} finally {
		loadingTicket.value = false;
	}
}

/**
 * Selects a queue row and loads its full conversation.
 *
 * @param {string} ticketId Ticket identifier.
 * @returns {Promise<void>} Resolves after ticket selection.
 */
async function selectTicket(ticketId) {
	if (ticketId === selectedTicketId.value && activeTicket.value) {
		if (compactViewport.value) mobileView.value = 'conversation';
		return;
	}
	await loadTicket(ticketId);
}

/**
 * Sends the composer as a public response or an internal teammate note.
 *
 * @returns {Promise<void>} Resolves after the API result is persisted.
 */
async function sendReply() {
	if (!activeTicket.value || busyAction.value) return;
	const content = replyDraft.value.trim();
	fieldErrors.value = {};
	busyAction.value = 'send-message';
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/support-center/tickets/${encodeURIComponent(activeTicket.value.id)}/messages`, {
			method: 'POST',
			body: JSON.stringify(mutationPayload({ content, mode: composerMode.value })),
		});
		applyMutation(payload);
		replyDraft.value = '';
	} catch (error) {
		await handleMutationError(error);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Saves an assignee or priority patch through the triage API.
 *
 * @param {Record<string, string>} patch Routing values.
 * @returns {Promise<void>} Resolves after the ticket is updated.
 */
async function updateRouting(patch) {
	if (!activeTicket.value || busyAction.value) return;
	busyAction.value = 'update-routing';
	actionError.value = '';
	fieldErrors.value = {};
	try {
		const payload = await requestJson(`/api/block-demos/support-center/tickets/${encodeURIComponent(activeTicket.value.id)}/triage`, {
			method: 'PATCH',
			body: JSON.stringify(mutationPayload(patch)),
		});
		applyMutation(payload);
	} catch (error) {
		await handleMutationError(error);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Retries one failed outbound provider message in place.
 *
 * @param {string} messageId Failed message identifier.
 * @returns {Promise<void>} Resolves after delivery evidence is available.
 */
async function retryMessage(messageId) {
	if (!activeTicket.value || busyAction.value) return;
	busyAction.value = `retry-${messageId}`;
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/support-center/tickets/${encodeURIComponent(activeTicket.value.id)}/messages/${encodeURIComponent(messageId)}/retry`, {
			method: 'POST',
			body: JSON.stringify(mutationPayload()),
		});
		applyMutation(payload);
	} catch (error) {
		await handleMutationError(error);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Opens the guarded resolution review with ticket-specific defaults.
 *
 * @returns {void}
 */
function openResolveDialog() {
	resolutionCode.value = activeTicket.value?.priority === 'urgent' ? 'bug-linked' : 'solved';
	resolutionNote.value = activeTicket.value?.id === 'SUP-2048'
		? 'Customer can invite both teammates after the verified domain-policy update.'
		: 'Customer outcome and provider delivery evidence were reviewed by support.';
	resolutionAcknowledged.value = false;
	fieldErrors.value = {};
	resolveDialogOpen.value = true;
}

/**
 * Resolves the selected ticket after server-owned checks pass.
 *
 * @returns {Promise<void>} Resolves after the lifecycle transition.
 */
async function resolveTicket() {
	if (!activeTicket.value || busyAction.value) return;
	busyAction.value = 'resolve';
	actionError.value = '';
	fieldErrors.value = {};
	try {
		const payload = await requestJson(`/api/block-demos/support-center/tickets/${encodeURIComponent(activeTicket.value.id)}/resolve`, {
			method: 'POST',
			body: JSON.stringify(mutationPayload({
				code: resolutionCode.value,
				note: resolutionNote.value,
				acknowledged: resolutionAcknowledged.value,
			})),
		});
		applyMutation(payload);
		resolveDialogOpen.value = false;
	} catch (error) {
		await handleMutationError(error);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Reopens a resolved ticket for another customer follow-up.
 *
 * @returns {Promise<void>} Resolves after the lifecycle transition.
 */
async function reopenTicket() {
	if (!activeTicket.value || busyAction.value) return;
	busyAction.value = 'reopen';
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/support-center/tickets/${encodeURIComponent(activeTicket.value.id)}/reopen`, {
			method: 'POST',
			body: JSON.stringify(mutationPayload()),
		});
		applyMutation(payload);
	} catch (error) {
		await handleMutationError(error);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Restores the deterministic server workspace and first active ticket.
 *
 * @returns {Promise<void>} Resolves after reset state is applied.
 */
async function resetDemo() {
	if (busyAction.value) return;
	busyAction.value = 'reset';
	actionError.value = '';
	try {
		const payload = await requestJson('/api/block-demos/support-center/reset', { method: 'POST' });
		workspaceRevision.value = payload.workspaceRevision;
		catalogs.value = payload.catalogs || catalogs.value;
		summary.value = payload.summary || summary.value;
		tickets.value = payload.tickets || [];
		selectedView.value = 'attention';
		searchQuery.value = '';
		await loadTicket(payload.selectedTicketId || tickets.value[0]?.id, false);
	} catch (error) {
		actionError.value = error.message;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Opens the responsive ticket-detail surface for the current viewport.
 *
 * @returns {void}
 */
function openDetails() {
	if (compactViewport.value) {
		mobileView.value = 'details';
		return;
	}
	detailsDrawerOpen.value = true;
}

/**
 * Returns to the mobile inbox from a focused ticket view.
 *
 * @returns {void}
 */
function returnToInbox() {
	mobileView.value = 'inbox';
}

/**
 * Applies one successful API mutation to list, detail, and health state.
 *
 * @param {Record<string, unknown>} payload API mutation payload.
 * @returns {void}
 */
function applyMutation(payload) {
	workspaceRevision.value = payload.workspaceRevision;
	activeTicket.value = payload.ticket;
	selectedTicketId.value = payload.ticket.id;
	if (payload.summary) summary.value = payload.summary;
	if (payload.tickets) tickets.value = payload.tickets;
	fieldErrors.value = {};
}

/**
 * Handles validation and exact-revision conflicts with focused recovery.
 *
 * @param {Error & { status?: number, fieldErrors?: object }} error Request error.
 * @returns {Promise<void>} Resolves after optional conflict recovery.
 */
async function handleMutationError(error) {
	fieldErrors.value = error.fieldErrors || {};
	actionError.value = error.message;
	if (error.status !== 409 || !activeTicket.value) return;
	await loadWorkspace(activeTicket.value.id);
}

/**
 * Creates the exact revision fields required by every ticket mutation.
 *
 * @param {Record<string, unknown>} values Additional mutation values.
 * @returns {Record<string, unknown>} Versioned mutation payload.
 */
function mutationPayload(values = {}) {
	return {
		workspaceRevision: workspaceRevision.value,
		ticketVersion: activeTicket.value?.version,
		...values,
	};
}

/**
 * Checks one ticket against the selected saved inbox view.
 *
 * @param {Record<string, unknown>} ticket Ticket summary.
 * @returns {boolean} True when the ticket belongs in the view.
 */
function matchesSelectedView(ticket) {
	if (selectedView.value === 'all') return ticket.state !== 'resolved';
	if (selectedView.value === 'mine') return ticket.state !== 'resolved' && ticket.assigneeId === 'nora-bell';
	if (selectedView.value === 'unassigned') return ticket.state !== 'resolved' && ticket.assigneeId === 'unassigned';
	if (selectedView.value === 'attention') return ticket.state !== 'resolved' && (ticket.priority === 'urgent' || ticket.sla.state === 'breached' || ticket.hasFailedDelivery);
	if (selectedView.value === 'resolved') return ticket.state === 'resolved';
	return true;
}

/**
 * Checks one ticket against the current queue search query.
 *
 * @param {Record<string, unknown>} ticket Ticket summary.
 * @returns {boolean} True when searchable fields contain the query.
 */
function matchesSearch(ticket) {
	const needle = searchQuery.value.trim().toLowerCase();
	if (!needle) return true;
	return [ticket.id, ticket.subject, ticket.customer?.name, ticket.customer?.company, ticket.lastMessage]
		.filter(Boolean)
		.some((value) => String(value).toLowerCase().includes(needle));
}

/**
 * Returns the live count for one saved inbox view.
 *
 * @param {string} view View identifier.
 * @returns {number} Matching ticket count.
 */
function viewCount(view) {
	return {
		mine: summary.value.mine,
		all: summary.value.open,
		unassigned: summary.value.unassigned,
		attention: summary.value.attention,
		resolved: summary.value.resolved,
	}[view] || 0;
}

/**
 * Resolves the status-pill tone for a ticket priority.
 *
 * @param {string} priority Priority identifier.
 * @returns {string} DOM Studio status tone.
 */
function priorityTone(priority) {
	return catalogs.value.priorities?.find((option) => option.value === priority)?.tone || 'neutral';
}

/**
 * Resolves the queue metadata shown for one ticket.
 *
 * @param {Record<string, unknown>} ticket Ticket summary.
 * @returns {string} Concise customer and SLA metadata.
 */
function ticketMeta(ticket) {
	return `${ticket.customer.company} · ${ticket.sla.label}`;
}

/**
 * Formats a provider message state for display.
 *
 * @param {string} status Message status.
 * @returns {string} Human-readable message state.
 */
function messageStatus(status) {
	return {
		received: 'Received',
		delivered: 'Delivered',
		saved: 'Internal only',
		failed: 'Delivery failed',
	}[status] || status;
}

/**
 * Requests JSON and converts non-success responses into actionable errors.
 *
 * @param {string} path API path.
 * @param {RequestInit} init Fetch options.
 * @returns {Promise<Record<string, unknown>>} Parsed response payload.
 */
async function requestJson(path, init = {}) {
	const response = await fetch(path, {
		headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
		...init,
	});
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		const error = new Error(payload.error || `Support request failed with ${response.status}.`);
		error.status = response.status;
		error.fieldErrors = payload.fieldErrors || {};
		throw error;
	}
	return payload;
}
</script>

<template>
	<section class="relative flex h-dvh min-h-[40rem] w-full min-w-0 flex-col overflow-hidden bg-canvas text-canvas-fg">
		<DomAppTopBar
			class="md:hidden"
			:title="mobileView === 'inbox' ? 'Support inbox' : activeTicket?.subject || 'Conversation'"
			:subtitle="mobileView === 'inbox' ? `${summary.open} open · ${summary.attention} need attention` : activeTicket ? `${activeTicket.id} · ${activeTicket.customer.company}` : 'Loading ticket'"
		>
			<template v-if="mobileView !== 'inbox'" #leading>
				<DomIconButton label="Back to support inbox" variant="ghost" size="sm" icon="M15 18l-6-6 6-6" @click="returnToInbox" />
			</template>
			<template #trailing>
				<DomIconButton v-if="activeTicket && mobileView === 'conversation'" label="Open ticket details" variant="ghost" size="sm" icon="M12 17v-5M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" @click="openDetails" />
			</template>
		</DomAppTopBar>

		<header class="hidden h-14 shrink-0 items-center justify-between border-b border-border px-4 md:flex">
			<div class="flex min-w-0 items-center gap-3">
				<DomAvatar name="Relay support" initials="R" size="sm" />
				<div class="min-w-0">
					<p class="truncate text-sm font-semibold">Relay support</p>
					<p class="truncate text-[11px] text-muted-fg">Service desk · live demo API</p>
				</div>
			</div>
			<div class="flex items-center gap-4 text-xs">
				<span class="text-muted-fg"><strong class="text-canvas-fg">{{ summary.open }}</strong> open</span>
				<span class="text-muted-fg"><strong :class="summary.attention ? 'text-destructive' : 'text-canvas-fg'">{{ summary.attention }}</strong> need attention</span>
				<span class="text-muted-fg"><strong class="text-canvas-fg">{{ summary.csat }}%</strong> CSAT</span>
				<DomAvatar name="Nora Bell" initials="NB" size="sm" />
			</div>
		</header>

		<div v-if="loadingWorkspace && !tickets.length" class="grid min-h-0 flex-1 gap-0 md:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)_20rem]">
			<div class="space-y-4 border-r border-border p-4"><DomSkeleton variant="text" :lines="2" /><DomSkeleton v-for="index in 5" :key="index" height="5rem" /></div>
			<div class="space-y-6 p-5"><DomSkeleton variant="text" :lines="3" /><DomSkeleton height="12rem" /><DomSkeleton height="9rem" /></div>
			<div class="hidden border-l border-border p-4 xl:block"><DomSkeleton variant="text" :lines="6" /></div>
		</div>

		<DomEmptyState
			v-else-if="!tickets.length"
			class="m-auto max-w-lg"
			title="Support workspace unavailable"
			description="The repository-local API did not return a ticket queue. Retry after the screenshot server is ready."
		>
			<DomButton @click="loadWorkspace">Retry workspace</DomButton>
		</DomEmptyState>

		<div v-else class="grid min-h-0 flex-1 md:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)_20rem]">
			<aside
				v-show="!compactViewport || mobileView === 'inbox'"
				class="flex min-h-0 flex-col border-border bg-canvas md:border-r"
			>
				<div class="shrink-0 space-y-3 border-b border-border p-3">
					<DomSelect v-model="selectedView" label="Saved view" :options="viewOptions" width="min-w-[18rem]">
						<template #option="{ option }"><div><p class="font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template>
					</DomSelect>
					<DomTextInput v-model="searchQuery" type="search" label="Search inbox" placeholder="Ticket, customer, or message" />
					<div class="grid grid-cols-3 gap-px overflow-hidden border-y border-border bg-border text-center">
						<div class="bg-canvas px-2 py-2"><p class="text-sm font-semibold">{{ summary.mine }}</p><p class="text-[10px] text-muted-fg">Mine</p></div>
						<div class="bg-canvas px-2 py-2"><p class="text-sm font-semibold" :class="summary.attention ? 'text-destructive' : ''">{{ summary.attention }}</p><p class="text-[10px] text-muted-fg">Attention</p></div>
						<div class="bg-canvas px-2 py-2"><p class="text-sm font-semibold">{{ summary.csat }}%</p><p class="text-[10px] text-muted-fg">CSAT</p></div>
					</div>
				</div>

				<div class="min-h-0 flex-1 overflow-y-auto">
					<DomEmptyState v-if="!filteredTickets.length" title="No tickets in this view" description="Try another saved view or clear the inbox search.">
						<DomButton variant="secondary" size="sm" @click="searchQuery = ''; selectedView = 'all'">Show all open</DomButton>
					</DomEmptyState>
					<DomAppListItem
						v-for="ticket in filteredTickets"
						v-else
						:key="ticket.id"
						:label="ticket.subject"
						:description="ticketMeta(ticket)"
						:meta="ticket.unreadCount ? `${ticket.unreadCount} new` : ''"
						:selected="ticket.id === selectedTicketId"
						@click="selectTicket(ticket.id)"
					>
						<template #icon><DomAvatar :name="ticket.customer.name" :initials="ticket.customer.initials" size="sm" /></template>
						<template #trailing>
							<div class="flex flex-col items-end gap-1">
								<DomStatusPill :tone="ticket.hasFailedDelivery ? 'danger' : priorityTone(ticket.priority)" size="sm">{{ ticket.hasFailedDelivery ? 'Retry' : ticket.priority }}</DomStatusPill>
								<span class="text-[10px] uppercase tracking-wide text-muted-fg">{{ ticket.channel }}</span>
							</div>
						</template>
					</DomAppListItem>
				</div>

				<footer class="hidden shrink-0 items-center justify-between border-t border-border px-3 py-2 md:flex">
					<p class="text-[11px] text-muted-fg">{{ filteredTickets.length }} visible</p>
					<DomButton variant="ghost" size="sm" :loading="busyAction === 'reset'" @click="resetDemo">Reset demo</DomButton>
				</footer>
			</aside>

			<main
				v-show="!compactViewport || mobileView === 'conversation'"
				class="flex min-h-0 min-w-0 flex-col bg-canvas"
			>
				<div v-if="loadingTicket && !activeTicket" class="space-y-5 p-5"><DomSkeleton variant="text" :lines="3" /><DomSkeleton height="11rem" /><DomSkeleton height="8rem" /></div>
				<DomEmptyState v-else-if="!activeTicket" class="m-auto" title="Choose a ticket" description="Select a support conversation from the inbox to start work." />
				<template v-else>
					<header class="hidden shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 md:flex">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<DomBadge size="sm" tone="neutral">{{ activeTicket.id }}</DomBadge>
								<DomStatusPill :tone="priorityTone(activeTicket.priority)" size="sm">{{ activeTicket.priority }}</DomStatusPill>
								<DomStatusPill :tone="isResolved ? 'success' : failedMessages.length ? 'danger' : 'info'" size="sm">{{ isResolved ? 'Resolved' : failedMessages.length ? 'Delivery failed' : activeTicket.sla.label }}</DomStatusPill>
							</div>
							<h1 class="mt-2 truncate text-xl font-semibold tracking-tight">{{ activeTicket.subject }}</h1>
							<p class="mt-1 truncate text-xs text-muted-fg">{{ activeTicket.customer.name }} at {{ activeTicket.customer.company }} · {{ activeTicket.channel }}</p>
						</div>
						<div class="flex shrink-0 items-center gap-2">
							<DomButton class="xl:hidden" variant="secondary" size="sm" @click="openDetails">Details</DomButton>
							<DomButton v-if="isResolved" variant="secondary" size="sm" :loading="busyAction === 'reopen'" @click="reopenTicket">Reopen</DomButton>
							<DomButton v-else size="sm" :disabled="Boolean(failedMessages.length)" @click="openResolveDialog">Resolve</DomButton>
						</div>
					</header>

					<DomAlert
						v-if="actionError"
						class="m-3 shrink-0"
						tone="danger"
						variant="soft"
						title="Support action needs attention"
						:description="actionError"
						dismissible
						@dismiss="actionError = ''"
					/>

					<div class="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
						<div class="mx-auto max-w-3xl space-y-5">
							<div class="flex items-center gap-3 text-xs text-muted-fg">
								<div class="h-px flex-1 bg-border"></div>
								<span>Conversation via {{ activeTicket.channel }}</span>
								<div class="h-px flex-1 bg-border"></div>
							</div>

							<article
								v-for="message in activeTicket.messages"
								:key="message.id"
								class="flex gap-3"
								:class="message.role === 'internal' ? 'border-l-2 border-warning/50 bg-warning/5 py-3 pl-3' : ''"
							>
								<DomAvatar :name="message.author" :initials="message.authorInitials" size="sm" />
								<div class="min-w-0 flex-1">
									<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
										<p class="text-sm font-semibold">{{ message.author }}</p>
										<span class="text-[11px] text-muted-fg">{{ message.displayTime }}</span>
										<DomStatusPill v-if="message.role !== 'customer'" :tone="message.status === 'failed' ? 'danger' : message.role === 'internal' ? 'warning' : 'success'" size="sm">{{ messageStatus(message.status) }}</DomStatusPill>
									</div>
									<p class="mt-2 whitespace-pre-line text-sm leading-6" :class="message.role === 'customer' ? 'text-canvas-fg' : 'text-muted-fg'">{{ message.body }}</p>
									<DomAlert v-if="message.status === 'failed'" class="mt-3" tone="danger" title="Customer reply was not delivered" :description="message.failure">
										<template #actions><DomButton variant="danger" size="sm" :loading="busyAction === `retry-${message.id}`" @click="retryMessage(message.id)">Retry existing reply</DomButton></template>
									</DomAlert>
									<p v-else-if="message.providerReceipt" class="mt-2 font-mono text-[10px] text-muted-fg">{{ message.providerReceipt.id }}</p>
								</div>
							</article>

							<DomAlert v-if="isResolved" tone="success" title="Ticket resolved" :description="activeTicket.resolution?.note || 'The customer outcome is complete.'" />
						</div>
					</div>

					<footer class="shrink-0 border-t border-border bg-canvas px-3 py-3 sm:px-5">
						<div class="mx-auto max-w-3xl">
							<template v-if="!isResolved">
								<div class="mb-2 flex items-center justify-between gap-3">
									<DomToggleButtonGroup v-model="composerMode" label="Message visibility" :options="composerOptions" size="sm" />
									<div class="hidden items-center gap-2 text-xs text-muted-fg sm:flex">
										<DomAvatar v-if="currentAssignee" :name="currentAssignee.label" :initials="currentAssignee.initials" size="xs" />
										<span>{{ currentAssignee?.label || 'Unassigned' }}</span>
									</div>
								</div>
								<DomTextareaInput
									v-model="replyDraft"
									:label="composerMode === 'public' ? 'Reply to customer' : 'Internal teammate note'"
									:placeholder="composerMode === 'public' ? 'Give the customer a clear next step…' : 'Leave evidence or context for the support team…'"
									:rows="compactViewport ? 2 : 3"
									:errors="fieldErrors.content || []"
								/>
								<div class="mt-2 flex items-center justify-between gap-3">
									<p class="text-[11px] leading-4 text-muted-fg">{{ composerMode === 'public' ? `Delivered through ${activeTicket.channel} with a provider receipt.` : 'Visible only to support teammates.' }}</p>
									<DomButton :variant="composerMode === 'public' ? 'primary' : 'secondary'" :loading="busyAction === 'send-message'" @click="sendReply">{{ composerMode === 'public' ? 'Send reply' : 'Save note' }}</DomButton>
								</div>
							</template>
							<div v-else class="flex items-center justify-between gap-3">
								<p class="text-xs text-muted-fg">{{ activeTicket.resolution?.label }} · {{ activeTicket.resolution?.receipt?.id }}</p>
								<DomButton variant="secondary" :loading="busyAction === 'reopen'" @click="reopenTicket">Reopen ticket</DomButton>
							</div>
						</div>
					</footer>
				</template>
			</main>

			<div v-show="compactViewport && mobileView === 'details'" class="min-h-0 md:hidden">
				<SupportTicketDetails :ticket="activeTicket" :catalogs="catalogs" :busy="Boolean(busyAction)" @update-routing="updateRouting" @resolve="openResolveDialog" @reopen="reopenTicket" />
			</div>

			<div class="hidden min-h-0 border-l border-border xl:block">
				<SupportTicketDetails :ticket="activeTicket" :catalogs="catalogs" :busy="Boolean(busyAction)" @update-routing="updateRouting" @resolve="openResolveDialog" @reopen="reopenTicket" />
			</div>
		</div>

		<DomAppBottomNav v-if="compactViewport && tickets.length" v-model="mobileView" class="shrink-0 md:hidden" :items="mobileNavigation" />

		<DomDrawer v-model="detailsDrawerOpen" side="right" width="min(94vw, 22rem)">
			<SupportTicketDetails :ticket="activeTicket" :catalogs="catalogs" :busy="Boolean(busyAction)" @update-routing="updateRouting" @resolve="openResolveDialog" @reopen="reopenTicket" />
		</DomDrawer>

		<DomDialog v-model="resolveDialogOpen" title="Resolve this support ticket?" description="Review the customer outcome and delivery state before closing the conversation." width="min(94vw, 36rem)">
			<div class="space-y-4">
				<DomAlert v-if="failedMessages.length" tone="danger" title="Delivery evidence is incomplete" description="Retry the failed customer reply before resolving this ticket." />
				<DomSelect v-model="resolutionCode" label="Resolution outcome" :options="catalogs.resolutionCodes || []" :errors="fieldErrors.code || []" width="min-w-[20rem]">
					<template #option="{ option }"><div><p class="font-semibold">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template>
				</DomSelect>
				<DomTextareaInput v-model="resolutionNote" label="Verified customer outcome" description="Written to the immutable ticket receipt and activity timeline." :rows="4" :errors="fieldErrors.note || []" />
				<DomCheckbox v-model="resolutionAcknowledged" label="I reviewed the customer outcome and provider delivery evidence" :errors="fieldErrors.acknowledged || []" />
			</div>
			<template #footer>
				<DomButton variant="secondary" :disabled="busyAction === 'resolve'" @click="resolveDialogOpen = false">Keep open</DomButton>
				<DomButton :loading="busyAction === 'resolve'" :disabled="Boolean(failedMessages.length)" @click="resolveTicket">Resolve ticket</DomButton>
			</template>
		</DomDialog>
	</section>
</template>
