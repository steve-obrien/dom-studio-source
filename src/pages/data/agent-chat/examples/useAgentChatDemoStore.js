import { computed, reactive } from 'vue';
import { defineStore } from 'pinia';
import { createAgentChatMockApi } from './agentChatMockApi.js';

const DEFAULT_BASE_URL = '/api/agent-chat';
let logCounter = 0;

export const useAgentChatDemoStore = defineAgentChatStore('agent-chat-demo', {
	baseUrl: DEFAULT_BASE_URL,
	api: createAgentChatMockApi(),
});

/**
 * Creates a configured Pinia store for agent chat workflows.
 *
 * @param {string} storeId Pinia store id.
 * @param {Record<string, unknown>} options Store configuration.
 * @returns {Function} Pinia use-store function.
 */
export function defineAgentChatStore(storeId = 'agent-chat', options = {}) {
	return defineStore(storeId, () => createAgentChatStore(options));
}

/**
 * Creates a fetch-backed API adapter matching the demo API contract.
 *
 * @param {Record<string, unknown>} config API configuration.
 * @returns {Record<string, Function>} API adapter.
 */
export function createAgentChatRestApi(config = {}) {
	const baseUrl = String(config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');

	/**
	 * Requests JSON and throws for non-2xx responses.
	 *
	 * @param {string} path Request path.
	 * @param {RequestInit} init Fetch options.
	 * @returns {Promise<Record<string, unknown>>} Parsed JSON response.
	 */
	async function requestJson(path, init = {}) {
		const response = await fetch(`${baseUrl}${path}`, {
			headers: {
				'Content-Type': 'application/json',
				...(init.headers || {}),
			},
			...init,
		});
		if (!response.ok) throw new Error(`Agent chat request failed with ${response.status}.`);
		return response.json();
	}

	return {
		bootstrap: () => requestJson('/bootstrap'),
		getConversation: (request) => requestJson(`/conversations/${encodeURIComponent(request.conversationId)}`),
		createConversation: (request) => requestJson('/conversations', {
			method: 'POST',
			body: JSON.stringify(request || {}),
		}),
		streamMessage: (request) => requestJson(`/conversations/${encodeURIComponent(request.conversationId)}/messages`, {
			method: 'POST',
			signal: request.signal,
			body: JSON.stringify({
				content: request.content,
				mode: request.mode,
			}),
		}),
	};
}

/**
 * Creates the Pinia setup store used by the agent chat docs and integrations.
 *
 * @param {Record<string, unknown>} options Store configuration.
 * @returns {Record<string, unknown>} Store state, getters, and actions.
 */
function createAgentChatStore(options = {}) {
	const config = normalizeStoreOptions(options);
	const api = config.api || createAgentChatRestApi(config);
	const state = reactive(createInitialState(config));
	let activeController = null;
	let activeStreamId = 0;

	const agents = computed(() => state.agents);
	const conversations = computed(() => state.conversations);
	const activeConversationId = computed(() => state.activeConversationId);
	const activeConversation = computed(() => state.conversations.find((conversation) => conversation.id === state.activeConversationId) || null);
	const activeMessages = computed(() => state.messagesByConversationId[state.activeConversationId] || []);
	const activeAgent = computed(() => state.agents.find((agent) => agent.id === activeConversation.value?.agentId) || null);
	const input = computed(() => state.input);
	const mode = computed(() => state.mode);
	const search = computed(() => state.search);
	const loading = computed(() => state.loading);
	const streaming = computed(() => state.streaming);
	const sidebarOpen = computed(() => state.sidebarOpen);
	const asideOpen = computed(() => state.asideOpen);
	const sidebarSize = computed(() => state.sidebarSize);
	const asideSize = computed(() => state.asideSize);
	const requestLog = computed(() => state.requestLog);
	const lastRequest = computed(() => state.lastRequest);
	const lastResponse = computed(() => state.lastResponse);

	/**
	 * Loads agents and conversation summaries from the API.
	 *
	 * @returns {Promise<void>} Resolves after bootstrap data is applied.
	 */
	async function load() {
		const log = logRequest(state, 'GET', `${config.baseUrl}/bootstrap`);
		state.loading = true;
		try {
			const response = await api.bootstrap();
			state.agents = Array.isArray(response.agents) ? response.agents : [];
			state.conversations = Array.isArray(response.conversations) ? response.conversations : [];
			if (!state.activeConversationId && state.conversations[0]) {
				state.activeConversationId = state.conversations[0].id;
			}
			logResponse(state, log.id, response);
			if (state.activeConversationId) await loadConversation(state.activeConversationId);
		} catch (error) {
			logError(state, log.id, error);
		} finally {
			state.loading = false;
		}
	}

	/**
	 * Loads the full message list for a conversation.
	 *
	 * @param {string} conversationId Conversation id.
	 * @returns {Promise<void>} Resolves after messages are applied.
	 */
	async function loadConversation(conversationId) {
		if (!conversationId) return;
		const log = logRequest(state, 'GET', `${config.baseUrl}/conversations/${conversationId}`, { conversationId });
		state.loading = true;
		try {
			const response = await api.getConversation({ conversationId });
			upsertConversation(state, response.conversation);
			state.messagesByConversationId[conversationId] = Array.isArray(response.messages) ? response.messages : [];
			logResponse(state, log.id, response);
		} catch (error) {
			logError(state, log.id, error);
		} finally {
			state.loading = false;
		}
	}

	/**
	 * Selects a conversation and loads messages when needed.
	 *
	 * @param {string|Record<string, unknown>} conversation Conversation id or row.
	 * @returns {Promise<void>} Resolves after selection work completes.
	 */
	async function selectConversation(conversation) {
		const conversationId = typeof conversation === 'string' ? conversation : conversation?.id;
		if (!conversationId || conversationId === state.activeConversationId) return;
		state.activeConversationId = conversationId;
		if (!state.messagesByConversationId[conversationId]) await loadConversation(conversationId);
	}

	/**
	 * Creates and selects a new conversation.
	 *
	 * @param {Record<string, unknown>} payload Create payload.
	 * @returns {Promise<Record<string, unknown>|null>} Created conversation.
	 */
	async function createConversation(payload = {}) {
		const request = {
			title: payload.title || 'New agent thread',
			agentId: payload.agentId || activeAgent.value?.id || state.agents[0]?.id,
		};
		const log = logRequest(state, 'POST', `${config.baseUrl}/conversations`, request);
		try {
			const response = await api.createConversation(request);
			upsertConversation(state, response.conversation, true);
			state.messagesByConversationId[response.conversation.id] = Array.isArray(response.messages) ? response.messages : [];
			state.activeConversationId = response.conversation.id;
			state.input = '';
			logResponse(state, log.id, response);
			return response.conversation;
		} catch (error) {
			logError(state, log.id, error);
			return null;
		}
	}

	/**
	 * Sends a user message and applies streamed assistant updates.
	 *
	 * @param {{ content?: string, mode?: 'text'|'audio' }} payload Submit payload.
	 * @returns {Promise<void>} Resolves when the stream finishes or stops.
	 */
	async function sendMessage(payload = {}) {
		const content = String(payload.content || state.input || '').trim();
		if (!content || state.streaming) return;

		if (!state.activeConversationId) {
			const created = await createConversation({ title: titleFromPrompt(content) });
			if (!created) return;
		}

		const conversationId = state.activeConversationId;
		const userMessage = createLocalUserMessage(content, payload.mode || state.mode);
		appendMessage(state, conversationId, userMessage);
		state.input = '';
		state.streaming = true;
		patchConversation(state, conversationId, {
			status: 'streaming',
			mode: payload.mode || state.mode,
			updatedAt: new Date().toISOString(),
		});

		activeController = typeof AbortController === 'undefined' ? null : new AbortController();
		const streamId = activeStreamId + 1;
		activeStreamId = streamId;
		state.activeStreamId = streamId;

		const request = {
			conversationId,
			content,
			mode: payload.mode || state.mode,
			userMessage,
			signal: activeController?.signal,
		};
		const log = logRequest(state, 'POST', `${config.baseUrl}/conversations/${conversationId}/messages`, {
			conversationId,
			content,
			mode: request.mode,
		});

		try {
			const response = await api.streamMessage(request, {
				onAssistantStart: (message) => upsertStreamMessage(state, streamId, conversationId, message),
				onPart: (messageId, part) => upsertStreamPart(state, streamId, conversationId, messageId, part),
				onTextDelta: (messageId, partId, chunk) => appendStreamText(state, streamId, conversationId, messageId, partId, chunk),
				onAssistantDone: (message) => upsertStreamMessage(state, streamId, conversationId, message),
			});
			if (streamId !== activeStreamId) return;
			upsertConversation(state, response.conversation);
			upsertMessage(state, conversationId, response.message);
			logResponse(state, log.id, response);
		} catch (error) {
			if (error?.name === 'AbortError') {
				markActiveStreamCancelled(state, conversationId);
				logResponse(state, log.id, { cancelled: true });
			} else {
				patchConversation(state, conversationId, { status: 'error' });
				logError(state, log.id, error);
			}
		} finally {
			if (streamId === activeStreamId) {
				state.streaming = false;
				state.activeStreamId = 0;
				activeController = null;
			}
		}
	}

	/**
	 * Stops the active streaming response.
	 *
	 * @returns {void}
	 */
	function stopStreaming() {
		activeController?.abort();
		activeController = null;
		state.streaming = false;
		activeStreamId += 1;
		state.activeStreamId = activeStreamId;
		if (state.activeConversationId) markActiveStreamCancelled(state, state.activeConversationId);
	}

	/**
	 * Updates the composer input value.
	 *
	 * @param {string} value Composer value.
	 * @returns {void}
	 */
	function setInput(value) {
		state.input = value;
	}

	/**
	 * Updates the active input mode.
	 *
	 * @param {'text'|'audio'} value Input mode.
	 * @returns {void}
	 */
	function setMode(value) {
		state.mode = value === 'audio' ? 'audio' : 'text';
	}

	/**
	 * Updates the conversation search value.
	 *
	 * @param {string} value Search value.
	 * @returns {void}
	 */
	function setSearch(value) {
		state.search = value;
	}

	/**
	 * Updates sidebar visibility.
	 *
	 * @param {boolean} value Visibility state.
	 * @returns {void}
	 */
	function setSidebarOpen(value) {
		state.sidebarOpen = Boolean(value);
	}

	/**
	 * Updates aside visibility.
	 *
	 * @param {boolean} value Visibility state.
	 * @returns {void}
	 */
	function setAsideOpen(value) {
		state.asideOpen = Boolean(value);
	}

	/**
	 * Updates sidebar splitter width.
	 *
	 * @param {number} value Width in pixels.
	 * @returns {void}
	 */
	function setSidebarSize(value) {
		state.sidebarSize = clampNumber(value, 220, 520);
	}

	/**
	 * Updates aside splitter width.
	 *
	 * @param {number} value Width in pixels.
	 * @returns {void}
	 */
	function setAsideSize(value) {
		state.asideSize = clampNumber(value, 260, 560);
	}

	/**
	 * Records a tool action in the demo log.
	 *
	 * @param {Record<string, unknown>} payload Tool action payload.
	 * @returns {void}
	 */
	function handleToolAction(payload) {
		const log = logRequest(state, 'UI', 'tool-action', payload);
		logResponse(state, log.id, { accepted: true });
	}

	return {
		agents,
		conversations,
		activeConversationId,
		activeConversation,
		activeMessages,
		activeAgent,
		input,
		mode,
		search,
		loading,
		streaming,
		sidebarOpen,
		asideOpen,
		sidebarSize,
		asideSize,
		requestLog,
		lastRequest,
		lastResponse,
		load,
		loadConversation,
		selectConversation,
		createConversation,
		sendMessage,
		stopStreaming,
		setInput,
		setMode,
		setSearch,
		setSidebarOpen,
		setAsideOpen,
		setSidebarSize,
		setAsideSize,
		handleToolAction,
	};
}

/**
 * Normalizes store options.
 *
 * @param {Record<string, unknown>} options Store options.
 * @returns {Record<string, unknown>} Normalized options.
 */
function normalizeStoreOptions(options = {}) {
	return {
		baseUrl: options.baseUrl || DEFAULT_BASE_URL,
		api: options.api || null,
		sidebarOpen: options.sidebarOpen !== false,
		asideOpen: options.asideOpen !== false,
		sidebarSize: Number(options.sidebarSize || 300),
		asideSize: Number(options.asideSize || 340),
		mode: options.mode === 'audio' ? 'audio' : 'text',
	};
}

/**
 * Creates the initial reactive store state.
 *
 * @param {Record<string, unknown>} config Normalized config.
 * @returns {Record<string, unknown>} Store state.
 */
function createInitialState(config) {
	return {
		agents: [],
		conversations: [],
		messagesByConversationId: {},
		activeConversationId: '',
		input: '',
		mode: config.mode,
		search: '',
		loading: false,
		streaming: false,
		activeStreamId: 0,
		sidebarOpen: config.sidebarOpen,
		asideOpen: config.asideOpen,
		sidebarSize: config.sidebarSize,
		asideSize: config.asideSize,
		requestLog: [],
		lastRequest: null,
		lastResponse: null,
	};
}

/**
 * Creates a local user message for optimistic rendering.
 *
 * @param {string} content User content.
 * @param {'text'|'audio'} mode Message mode.
 * @returns {Record<string, unknown>} Message record.
 */
function createLocalUserMessage(content, mode = 'text') {
	const message = {
		id: `local_user_${Date.now()}`,
		role: 'user',
		content,
		status: 'complete',
		mode,
		createdAt: new Date().toISOString(),
	};
	if (mode === 'audio') {
		message.parts = [
			{
				id: `local_audio_${Date.now()}`,
				type: 'audio',
				label: 'Audio message',
				status: 'complete',
				text: `Transcript: ${content}`,
			},
		];
	}
	return message;
}

/**
 * Inserts or updates a conversation record.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {Record<string, unknown>} conversation Conversation record.
 * @param {boolean} prepend Whether to place new records first.
 * @returns {void}
 */
function upsertConversation(state, conversation, prepend = false) {
	if (!conversation?.id) return;
	const index = state.conversations.findIndex((item) => item.id === conversation.id);
	if (index >= 0) {
		state.conversations[index] = {
			...state.conversations[index],
			...conversation,
		};
		return;
	}
	if (prepend) state.conversations.unshift(conversation);
	else state.conversations.push(conversation);
}

/**
 * Applies a partial update to a conversation.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} conversationId Conversation id.
 * @param {Record<string, unknown>} patch Partial fields.
 * @returns {void}
 */
function patchConversation(state, conversationId, patch) {
	const conversation = state.conversations.find((item) => item.id === conversationId);
	if (!conversation) return;
	Object.assign(conversation, patch);
}

/**
 * Appends a message to a conversation.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} conversationId Conversation id.
 * @param {Record<string, unknown>} message Message record.
 * @returns {void}
 */
function appendMessage(state, conversationId, message) {
	const messages = ensureMessages(state, conversationId);
	if (!messages.some((item) => item.id === message.id)) messages.push(message);
}

/**
 * Inserts or updates a message for a conversation.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} conversationId Conversation id.
 * @param {Record<string, unknown>} message Message record.
 * @returns {void}
 */
function upsertMessage(state, conversationId, message) {
	if (!message?.id) return;
	const messages = ensureMessages(state, conversationId);
	const index = messages.findIndex((item) => item.id === message.id);
	if (index >= 0) {
		messages[index] = {
			...messages[index],
			...message,
		};
		return;
	}
	messages.push(message);
}

/**
 * Applies a streamed message when the stream is still current.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {number} streamId Stream id.
 * @param {string} conversationId Conversation id.
 * @param {Record<string, unknown>} message Message record.
 * @returns {void}
 */
function upsertStreamMessage(state, streamId, conversationId, message) {
	if (!isCurrentStream(state, streamId)) return;
	upsertMessage(state, conversationId, message);
}

/**
 * Inserts or updates a streamed message part.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {number} streamId Stream id.
 * @param {string} conversationId Conversation id.
 * @param {string} messageId Message id.
 * @param {Record<string, unknown>} part Message part.
 * @returns {void}
 */
function upsertStreamPart(state, streamId, conversationId, messageId, part) {
	if (!isCurrentStream(state, streamId)) return;
	const message = findMessage(state, conversationId, messageId);
	if (!message) return;
	if (!Array.isArray(message.parts)) message.parts = [];
	const index = message.parts.findIndex((item) => item.id === part.id);
	if (index >= 0) message.parts[index] = { ...message.parts[index], ...part };
	else message.parts.push(part);
}

/**
 * Appends streamed text to a text part.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {number} streamId Stream id.
 * @param {string} conversationId Conversation id.
 * @param {string} messageId Message id.
 * @param {string} partId Part id.
 * @param {string} chunk Text chunk.
 * @returns {void}
 */
function appendStreamText(state, streamId, conversationId, messageId, partId, chunk) {
	if (!isCurrentStream(state, streamId)) return;
	const message = findMessage(state, conversationId, messageId);
	if (!message) return;
	const part = (message.parts || []).find((item) => item.id === partId);
	if (!part) return;
	part.text = `${part.text || ''}${chunk}`;
}

/**
 * Marks the active assistant message and conversation as cancelled.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} conversationId Conversation id.
 * @returns {void}
 */
function markActiveStreamCancelled(state, conversationId) {
	const messages = ensureMessages(state, conversationId);
	const message = [...messages].reverse().find((item) => item.role === 'assistant' && item.status === 'streaming');
	if (message) {
		message.status = 'cancelled';
		for (const part of Array.isArray(message.parts) ? message.parts : []) {
			if (part.status === 'running' || part.status === 'streaming') part.status = 'cancelled';
		}
	}
	patchConversation(state, conversationId, { status: 'idle' });
}

/**
 * Checks whether a stream id is still current.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {number} streamId Stream id.
 * @returns {boolean} True when the stream should mutate state.
 */
function isCurrentStream(state, streamId) {
	return state.streaming && state.activeStreamId === streamId;
}

/**
 * Finds a message by id.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} conversationId Conversation id.
 * @param {string} messageId Message id.
 * @returns {Record<string, unknown>|undefined} Matching message.
 */
function findMessage(state, conversationId, messageId) {
	return ensureMessages(state, conversationId).find((message) => message.id === messageId);
}

/**
 * Ensures a conversation message array exists.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} conversationId Conversation id.
 * @returns {Array<Record<string, unknown>>} Message array.
 */
function ensureMessages(state, conversationId) {
	if (!state.messagesByConversationId[conversationId]) state.messagesByConversationId[conversationId] = [];
	return state.messagesByConversationId[conversationId];
}

/**
 * Creates a request log entry.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} method Request method.
 * @param {string} url Request URL.
 * @param {unknown} payload Request payload.
 * @returns {Record<string, unknown>} Log entry.
 */
function logRequest(state, method, url, payload = null) {
	logCounter += 1;
	const entry = {
		id: `agent_chat_log_${logCounter}`,
		method,
		url,
		payload,
		status: 'pending',
		requestedAt: new Date().toISOString(),
		response: null,
		error: null,
	};
	state.requestLog.unshift(entry);
	state.requestLog = state.requestLog.slice(0, 12);
	state.lastRequest = entry;
	return entry;
}

/**
 * Marks a request log entry as successful.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} id Log entry id.
 * @param {unknown} response Response payload.
 * @returns {void}
 */
function logResponse(state, id, response) {
	const entry = state.requestLog.find((item) => item.id === id);
	if (!entry) return;
	entry.status = 'complete';
	entry.response = response;
	entry.completedAt = new Date().toISOString();
	state.lastResponse = response;
}

/**
 * Marks a request log entry as failed.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} id Log entry id.
 * @param {Error} error Error object.
 * @returns {void}
 */
function logError(state, id, error) {
	const entry = state.requestLog.find((item) => item.id === id);
	if (!entry) return;
	entry.status = 'error';
	entry.error = error?.message || String(error);
	entry.completedAt = new Date().toISOString();
	state.lastResponse = { error: entry.error };
}

/**
 * Creates a short title from a prompt.
 *
 * @param {string} prompt User prompt.
 * @returns {string} Title text.
 */
function titleFromPrompt(prompt) {
	const normalized = String(prompt || '').trim().replace(/\s+/g, ' ');
	if (!normalized) return 'New agent thread';
	return normalized.length > 42 ? `${normalized.slice(0, 39)}...` : normalized;
}

/**
 * Clamps a number inside a range.
 *
 * @param {number} value Source number.
 * @param {number} min Minimum value.
 * @param {number} max Maximum value.
 * @returns {number} Clamped value.
 */
function clampNumber(value, min, max) {
	const number = Number(value);
	if (!Number.isFinite(number)) return min;
	return Math.min(Math.max(number, min), max);
}
