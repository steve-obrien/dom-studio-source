<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
	DomAgentChatShell,
	DomAgentConversationList,
	DomAlert,
	DomButton,
	DomDialog,
	DomDrawer,
	DomEmptyState,
	DomSpinner,
	DomTextareaInput,
} from '@getdom/studio/vue';
import SupportContextPanel from './SupportContextPanel.vue';
import SupportToolCard from './SupportToolCard.vue';

const agents = ref([]);
const conversations = ref([]);
const priorityOptions = ref([]);
const activeConversationId = ref('');
const activeConversation = ref(null);
const messages = ref([]);
const input = ref('');
const mode = ref('text');
const search = ref('');
const loading = ref(true);
const streaming = ref(false);
const mutating = ref(false);
const sidebarOpen = ref(false);
const asideOpen = ref(true);
const mobileContextOpen = ref(false);
const compactViewport = ref(false);
const actionError = ref('');
const resolveDialogOpen = ref(false);
const resolutionNote = ref('Customer response reviewed and ready to send.');
const toolComponents = { 'support-context': SupportToolCard };

let viewportQuery = null;
let activeController = null;

const hasWorkspace = computed(() => Boolean(activeConversation.value));

onMounted(initializeWorkspace);
onBeforeUnmount(disposeWorkspace);

/**
 * Initializes responsive state and loads the repository-local support API.
 *
 * @returns {Promise<void>} Resolves after the first conversation loads.
 */
async function initializeWorkspace() {
	viewportQuery = window.matchMedia('(max-width: 767px)');
	syncViewport(viewportQuery);
	viewportQuery.addEventListener('change', syncViewport);
	await loadWorkspace();
}

/**
 * Removes viewport listeners and cancels any active message request.
 *
 * @returns {void}
 */
function disposeWorkspace() {
	viewportQuery?.removeEventListener('change', syncViewport);
	activeController?.abort();
}

/**
 * Synchronizes navigation and context panels with the active breakpoint.
 *
 * @param {MediaQueryList|MediaQueryListEvent} query Viewport media query state.
 * @returns {void}
 */
function syncViewport(query) {
	compactViewport.value = Boolean(query.matches);
	if (compactViewport.value) {
		sidebarOpen.value = false;
		asideOpen.value = false;
		return;
	}
	mobileContextOpen.value = false;
	sidebarOpen.value = true;
	asideOpen.value = true;
}

/**
 * Loads support agents, queue summaries, and the first available conversation.
 *
 * @returns {Promise<void>} Resolves after bootstrap data is applied.
 */
async function loadWorkspace() {
	loading.value = true;
	actionError.value = '';
	try {
		const payload = await requestJson('/api/block-demos/support-copilot/bootstrap');
		agents.value = payload.agents || [];
		conversations.value = payload.conversations || [];
		priorityOptions.value = payload.priorityOptions || [];
		const targetId = activeConversationId.value || conversations.value[0]?.id;
		if (targetId) await loadConversation(targetId);
	} catch (error) {
		actionError.value = error.message;
	} finally {
		loading.value = false;
	}
}

/**
 * Loads one complete conversation and its messages.
 *
 * @param {string} conversationId Conversation identifier.
 * @returns {Promise<void>} Resolves after the conversation is selected.
 */
async function loadConversation(conversationId) {
	if (!conversationId) return;
	loading.value = true;
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/support-copilot/conversations/${encodeURIComponent(conversationId)}`);
		activeConversationId.value = conversationId;
		applyConversation(payload.conversation);
		messages.value = payload.messages || [];
		if (compactViewport.value) sidebarOpen.value = false;
	} catch (error) {
		actionError.value = error.message;
	} finally {
		loading.value = false;
	}
}

/**
 * Selects a conversation row from the agent-chat shell.
 *
 * @param {Record<string, unknown>} conversation Conversation summary.
 * @returns {Promise<void>} Resolves after the full thread loads.
 */
async function selectConversation(conversation) {
	if (!conversation?.id || conversation.id === activeConversationId.value) {
		if (compactViewport.value) sidebarOpen.value = false;
		return;
	}
	await loadConversation(conversation.id);
}

/**
 * Creates and selects a new support review thread.
 *
 * @returns {Promise<void>} Resolves after the empty thread is available.
 */
async function createConversation() {
	mutating.value = true;
	actionError.value = '';
	try {
		const payload = await requestJson('/api/block-demos/support-copilot/conversations', {
			method: 'POST',
			body: JSON.stringify({ agentId: activeConversation.value?.agentId || agents.value[0]?.id }),
		});
		applyConversation(payload.conversation, true);
		messages.value = payload.messages || [];
		input.value = '';
		if (compactViewport.value) sidebarOpen.value = false;
	} catch (error) {
		actionError.value = error.message;
	} finally {
		mutating.value = false;
	}
}

/**
 * Sends an operator prompt and replaces optimistic state with the API result.
 *
 * @param {{ content: string, mode: 'text'|'audio' }} payload Composer payload.
 * @returns {Promise<void>} Resolves after the copilot response is persisted.
 */
async function sendMessage(payload) {
	const content = String(payload.content || '').trim();
	if (!content || streaming.value || !activeConversation.value) return;

	const optimisticId = `local-${Date.now()}`;
	const previousInput = input.value;
	messages.value = [...messages.value, {
		id: optimisticId,
		role: 'user',
		authorName: 'Nora Bell',
		content,
		mode: payload.mode || mode.value,
		status: 'complete',
		createdAt: new Date().toISOString(),
	}];
	input.value = '';
	streaming.value = true;
	actionError.value = '';
	activeController = new AbortController();

	try {
		const response = await requestJson(`/api/block-demos/support-copilot/conversations/${encodeURIComponent(activeConversation.value.id)}/messages`, {
			method: 'POST',
			signal: activeController.signal,
			body: JSON.stringify({
				content,
				mode: payload.mode || mode.value,
				revision: activeConversation.value.revision,
			}),
		});
		applyConversation(response.conversation);
		messages.value = response.messages || [];
	} catch (error) {
		messages.value = messages.value.filter((message) => message.id !== optimisticId);
		if (error.name !== 'AbortError') {
			actionError.value = error.message;
			input.value = previousInput || content;
		}
	} finally {
		streaming.value = false;
		activeController = null;
	}
}

/**
 * Cancels the active message request while preserving completed history.
 *
 * @returns {void}
 */
function stopStreaming() {
	activeController?.abort();
	activeController = null;
	streaming.value = false;
}

/**
 * Applies a specialist or priority change through the optimistic API contract.
 *
 * @param {Record<string, string>} patch Settings patch.
 * @returns {Promise<void>} Resolves after the persisted conversation is applied.
 */
async function updateConversationSettings(patch) {
	if (!activeConversation.value || mutating.value) return;
	mutating.value = true;
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/support-copilot/conversations/${encodeURIComponent(activeConversation.value.id)}/settings`, {
			method: 'PATCH',
			body: JSON.stringify({ revision: activeConversation.value.revision, ...patch }),
		});
		applyConversation(payload.conversation);
	} catch (error) {
		actionError.value = error.message;
	} finally {
		mutating.value = false;
	}
}

/**
 * Saves a context-panel setting and restores the mobile drawer after a
 * teleported select option dismisses its owning overlay.
 *
 * @param {Record<string, string>} patch Settings patch.
 * @returns {Promise<void>} Resolves after the setting is saved and context restored.
 */
async function updateContextSetting(patch) {
	const restoreMobileContext = compactViewport.value && mobileContextOpen.value;
	await updateConversationSettings(patch);
	if (!restoreMobileContext) return;
	asideOpen.value = true;
	mobileContextOpen.value = true;
}

/**
 * Opens the resolution confirmation dialog.
 *
 * @returns {void}
 */
function openResolveDialog() {
	resolutionNote.value = 'Customer response reviewed and ready to send.';
	resolveDialogOpen.value = true;
}

/**
 * Resolves the active ticket through the server-owned state transition.
 *
 * @returns {Promise<void>} Resolves after the ticket is marked resolved.
 */
async function resolveConversation() {
	if (!activeConversation.value || mutating.value) return;
	mutating.value = true;
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/support-copilot/conversations/${encodeURIComponent(activeConversation.value.id)}/resolve`, {
			method: 'POST',
			body: JSON.stringify({ revision: activeConversation.value.revision, note: resolutionNote.value }),
		});
		applyConversation(payload.conversation);
		resolveDialogOpen.value = false;
		closeMobileContext();
	} catch (error) {
		actionError.value = error.message;
	} finally {
		mutating.value = false;
	}
}

/**
 * Reopens the active resolved ticket.
 *
 * @returns {Promise<void>} Resolves after the ticket is open again.
 */
async function reopenConversation() {
	await runConversationAction('reopen');
}

/**
 * Retries the most recent failed copilot response.
 *
 * @returns {Promise<void>} Resolves after recovered messages are applied.
 */
async function retryConversation() {
	await runConversationAction('retry', true);
}

/**
 * Runs a revision-checked conversation lifecycle action.
 *
 * @param {'retry'|'reopen'} action Lifecycle action.
 * @param {boolean} applyMessages Whether the response includes a message list.
 * @returns {Promise<void>} Resolves after API state is applied.
 */
async function runConversationAction(action, applyMessages = false) {
	if (!activeConversation.value || mutating.value) return;
	mutating.value = true;
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/support-copilot/conversations/${encodeURIComponent(activeConversation.value.id)}/${action}`, {
			method: 'POST',
			body: JSON.stringify({ revision: activeConversation.value.revision }),
		});
		applyConversation(payload.conversation);
		if (applyMessages) messages.value = payload.messages || [];
	} catch (error) {
		actionError.value = error.message;
	} finally {
		mutating.value = false;
	}
}

/**
 * Handles actions emitted by custom tool renderers.
 *
 * @param {{ action?: string }} payload Tool action payload.
 * @returns {void}
 */
function handleToolAction(payload) {
	if (payload?.action === 'retry') retryConversation();
}

/**
 * Updates desktop aside state or opens the mobile context drawer.
 *
 * @param {boolean} value Requested context visibility.
 * @returns {void}
 */
function setAsideOpen(value) {
	if (compactViewport.value) {
		mobileContextOpen.value = Boolean(value);
		asideOpen.value = Boolean(value);
		return;
	}
	asideOpen.value = Boolean(value);
}

/**
 * Closes the mobile drawer and synchronizes the shell context toggle.
 *
 * @returns {void}
 */
function closeMobileContext() {
	mobileContextOpen.value = false;
	asideOpen.value = false;
}

/**
 * Inserts or updates a full conversation and its sidebar summary.
 *
 * @param {Record<string, unknown>} conversation Full conversation record.
 * @param {boolean} prepend Whether a new summary should be placed first.
 * @returns {void}
 */
function applyConversation(conversation, prepend = false) {
	if (!conversation?.id) return;
	activeConversation.value = conversation;
	activeConversationId.value = conversation.id;
	const summary = conversationSummary(conversation);
	const index = conversations.value.findIndex((item) => item.id === conversation.id);
	if (index >= 0) conversations.value[index] = { ...conversations.value[index], ...summary };
	else if (prepend) conversations.value = [summary, ...conversations.value];
	else conversations.value = [...conversations.value, summary];
}

/**
 * Creates the agent-chat sidebar shape from a full conversation record.
 *
 * @param {Record<string, unknown>} conversation Full conversation.
 * @returns {Record<string, unknown>} Conversation summary.
 */
function conversationSummary(conversation) {
	return {
		id: conversation.id,
		ticketId: conversation.ticketId,
		title: conversation.title,
		summary: conversation.summary,
		agentId: conversation.agentId,
		status: conversation.status,
		ticketState: conversation.ticketState,
		priority: conversation.priority,
		unreadCount: conversation.unreadCount,
		updatedAt: conversation.updatedAt,
		labels: [conversation.priority, conversation.customer?.company, conversation.ticketState].filter(Boolean),
	};
}

/**
 * Requests JSON and converts non-success responses into actionable errors.
 *
 * @param {string} path Request path.
 * @param {RequestInit} init Fetch options.
 * @returns {Promise<Record<string, unknown>>} Parsed response payload.
 */
async function requestJson(path, init = {}) {
	const response = await fetch(path, {
		headers: {
			'Content-Type': 'application/json',
			...(init.headers || {}),
		},
		...init,
	});
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		const error = new Error(payload.error || `Support request failed with ${response.status}.`);
		error.status = response.status;
		throw error;
	}
	return payload;
}
</script>

<template>
	<section class="relative flex h-dvh min-h-[32rem] w-full min-w-0 flex-col overflow-hidden bg-canvas text-canvas-fg">
		<div v-if="loading && !hasWorkspace" class="grid h-full place-items-center">
			<div class="flex items-center gap-3 text-sm text-muted-fg">
				<DomSpinner size="sm" />
				Loading support workspace
			</div>
		</div>

		<DomEmptyState
			v-else-if="!hasWorkspace"
			class="m-auto max-w-lg"
			title="Support workspace unavailable"
			description="The repository-local demo API did not return a conversation. Retry after the dev server is ready."
		>
			<DomButton @click="loadWorkspace">Retry</DomButton>
		</DomEmptyState>

		<DomAgentChatShell
			v-else
			v-model="input"
			class="!rounded-none !border-0 !shadow-none"
			:conversations="conversations"
			:conversation="activeConversation"
			:messages="messages"
			:agents="agents"
			:active-conversation-id="activeConversationId"
			:mode="mode"
			:search="search"
			:loading="loading"
			:streaming="streaming"
			:sidebar-open="sidebarOpen"
			:aside-open="asideOpen"
			:sidebar-size="296"
			:aside-size="352"
			:min-sidebar="248"
			:min-conversation="360"
			:min-aside="304"
			:tool-components="toolComponents"
			title="Relay support copilot"
			@update:mode="mode = $event"
			@update:search="search = $event"
			@update:sidebar-open="sidebarOpen = $event"
			@update:aside-open="setAsideOpen"
			@select-conversation="selectConversation"
			@new-conversation="createConversation"
			@submit="sendMessage"
			@stop="stopStreaming"
			@tool-action="handleToolAction"
		>
			<template #sidebar>
				<DomAgentConversationList
					class="h-full"
					title="Support queue"
					:conversations="conversations"
					:agents="agents"
					:active-conversation-id="activeConversationId"
					:search="search"
					:loading="loading"
					empty-text="No tickets match this search."
					@update:search="search = $event"
					@select="selectConversation"
					@new="createConversation"
				/>
			</template>

			<template #aside>
				<SupportContextPanel
					:conversation="activeConversation"
					:agents="agents"
					:priority-options="priorityOptions"
					:busy="mutating"
					closable
					@close="setAsideOpen(false)"
					@update-agent="updateContextSetting({ agentId: $event })"
					@update-priority="updateContextSetting({ priority: $event })"
					@resolve="openResolveDialog"
					@reopen="reopenConversation"
					@retry="retryConversation"
				/>
			</template>
		</DomAgentChatShell>

		<DomAlert
			v-if="actionError"
			class="absolute inset-x-3 bottom-3 z-40 mx-auto max-w-2xl"
			tone="danger"
			variant="toast"
			title="Support action could not be completed"
			:description="actionError"
			dismissible
			@dismiss="actionError = ''"
		/>

		<DomDrawer
			v-model="mobileContextOpen"
			side="right"
			width="min(100vw, 24rem)"
			@close="closeMobileContext"
		>
			<SupportContextPanel
				:conversation="activeConversation"
				:agents="agents"
				:priority-options="priorityOptions"
				:busy="mutating"
				closable
				@close="closeMobileContext"
				@update-agent="updateContextSetting({ agentId: $event })"
				@update-priority="updateContextSetting({ priority: $event })"
				@resolve="openResolveDialog"
				@reopen="reopenConversation"
				@retry="retryConversation"
			/>
		</DomDrawer>

		<DomDialog
			v-model="resolveDialogOpen"
			title="Resolve this ticket?"
			description="The conversation, tool evidence, and customer context stay available if the ticket is reopened."
			width="min(94vw, 34rem)"
		>
			<DomTextareaInput
				v-model="resolutionNote"
				label="Resolution note"
				:rows="3"
				placeholder="Summarize the outcome for the support timeline."
			/>
			<template #footer>
				<DomButton variant="secondary" :disabled="mutating" @click="resolveDialogOpen = false">Keep open</DomButton>
				<DomButton :loading="mutating" @click="resolveConversation">Resolve ticket</DomButton>
			</template>
		</DomDialog>
	</section>
</template>
