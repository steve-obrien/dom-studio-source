import { computed, reactive } from 'vue';
import { defineStore } from 'pinia';
import { createDocumentEditorMockApi } from './documentEditorMockApi.js';

const DEFAULT_BASE_URL = '/api/documents';
let logCounter = 0;

export const useDocumentEditorDemoStore = defineDocumentEditorStore('document-editor-demo', {
	baseUrl: DEFAULT_BASE_URL,
	api: createDocumentEditorMockApi(),
});

/**
 * Creates a configured Pinia store for document editor workflows.
 *
 * @param {string} storeId Pinia store id.
 * @param {Record<string, unknown>} options Store configuration.
 * @returns {Function} Pinia use-store function.
 */
export function defineDocumentEditorStore(storeId = 'document-editor', options = {}) {
	return defineStore(storeId, () => createDocumentEditorStore(options));
}

/**
 * Creates a fetch-backed API adapter matching the demo API contract.
 *
 * @param {Record<string, unknown>} config API configuration.
 * @returns {Record<string, Function>} API adapter.
 */
export function createDocumentEditorRestApi(config = {}) {
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
		if (!response.ok) throw new Error(`Document editor request failed with ${response.status}.`);
		return response.json();
	}

	return {
		loadDocument: (request) => requestJson(`/${encodeURIComponent(request.documentId || 'default')}`),
		saveDocument: (request) => requestJson(`/${encodeURIComponent(request.documentId || 'default')}`, {
			method: 'PUT',
			body: JSON.stringify(request || {}),
		}),
		rewriteSelection: (request) => requestJson(`/${encodeURIComponent(request.documentId || 'default')}/rewrite`, {
			method: 'POST',
			body: JSON.stringify(request || {}),
		}),
	};
}

/**
 * Creates the Pinia setup store used by the document editor docs and integrations.
 *
 * @param {Record<string, unknown>} options Store configuration.
 * @returns {Record<string, unknown>} Store state, getters, and actions.
 */
function createDocumentEditorStore(options = {}) {
	const config = normalizeStoreOptions(options);
	const api = config.api || createDocumentEditorRestApi(config);
	const state = reactive(createInitialState(config));

	const document = computed(() => state.document);
	const content = computed(() => state.document?.content || null);
	const title = computed(() => state.document?.title || 'Untitled document');
	const revision = computed(() => state.document?.revision || 0);
	const loading = computed(() => state.loading);
	const saving = computed(() => state.saving);
	const rewriting = computed(() => state.rewriting);
	const savedAt = computed(() => state.savedAt);
	const requestLog = computed(() => state.requestLog);
	const lastRequest = computed(() => state.lastRequest);
	const lastResponse = computed(() => state.lastResponse);

	/**
	 * Loads the demo document from the configured API.
	 *
	 * @returns {Promise<void>} Resolves after the document is applied.
	 */
	async function load() {
		const log = logRequest(state, 'GET', `${config.baseUrl}/${state.documentId}`, { documentId: state.documentId });
		state.loading = true;
		try {
			const response = await api.loadDocument({ documentId: state.documentId });
			state.document = response.document || null;
			state.savedAt = state.document?.updatedAt || '';
			logResponse(state, log.id, response);
		} catch (error) {
			logError(state, log.id, error);
		} finally {
			state.loading = false;
		}
	}

	/**
	 * Saves the current editor payload through the configured API.
	 *
	 * @param {{ content: Record<string, unknown>|string, html?: string, text?: string }} payload Save payload.
	 * @returns {Promise<void>} Resolves when the save request settles.
	 */
	async function save(payload = {}) {
		const request = {
			documentId: state.documentId,
			content: payload.content,
			html: payload.html,
			text: payload.text,
		};
		const log = logRequest(state, 'PUT', `${config.baseUrl}/${state.documentId}`, request);
		state.saving = true;
		try {
			const response = await api.saveDocument(request);
			state.document = response.document || state.document;
			state.savedAt = state.document?.updatedAt || new Date().toISOString();
			logResponse(state, log.id, response);
		} catch (error) {
			logError(state, log.id, error);
		} finally {
			state.saving = false;
		}
	}

	/**
	 * Requests an AI rewrite for the selected editor text.
	 *
	 * @param {{ selectedText?: string, instruction?: string }} payload Rewrite payload.
	 * @returns {Promise<Record<string, unknown>|null>} Suggestion response, or null on failure.
	 */
	async function rewrite(payload = {}) {
		const request = {
			documentId: state.documentId,
			selectedText: payload.selectedText || '',
			instruction: payload.instruction || '',
		};
		const log = logRequest(state, 'POST', `${config.baseUrl}/${state.documentId}/rewrite`, request);
		state.rewriting = true;
		try {
			const response = await api.rewriteSelection(request);
			logResponse(state, log.id, response);
			return response.suggestion || null;
		} catch (error) {
			logError(state, log.id, error);
			return null;
		} finally {
			state.rewriting = false;
		}
	}

	/**
	 * Applies a local editor content update without persisting it.
	 *
	 * @param {Record<string, unknown>|string} value Editor content value.
	 * @returns {void}
	 */
	function setContent(value) {
		if (!state.document) return;
		state.document = {
			...state.document,
			content: value,
		};
	}

	return {
		document,
		content,
		title,
		revision,
		loading,
		saving,
		rewriting,
		savedAt,
		requestLog,
		lastRequest,
		lastResponse,
		load,
		save,
		rewrite,
		setContent,
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
		documentId: options.documentId || 'doc_launch_brief',
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
		documentId: config.documentId,
		document: null,
		loading: false,
		saving: false,
		rewriting: false,
		savedAt: '',
		requestLog: [],
		lastRequest: null,
		lastResponse: null,
	};
}

/**
 * Records a request in the demo API log.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} method HTTP-like method.
 * @param {string} url Request URL.
 * @param {Record<string, unknown>} payload Request payload.
 * @returns {Record<string, unknown>} Request log entry.
 */
function logRequest(state, method, url, payload = {}) {
	logCounter += 1;
	const entry = {
		id: `document-editor-log-${logCounter}`,
		method,
		url,
		payload,
		status: 'pending',
		createdAt: new Date().toISOString(),
	};
	state.lastRequest = entry;
	state.requestLog = [entry, ...state.requestLog].slice(0, 8);
	return entry;
}

/**
 * Records a successful response in the demo API log.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} id Request log id.
 * @param {Record<string, unknown>} response Response payload.
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
 * Records a failed response in the demo API log.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} id Request log id.
 * @param {unknown} error Error value.
 * @returns {void}
 */
function logError(state, id, error) {
	const entry = state.requestLog.find((item) => item.id === id);
	if (!entry) return;
	entry.status = 'error';
	entry.error = error?.message || String(error || 'Request failed.');
	entry.completedAt = new Date().toISOString();
	state.lastResponse = { error: entry.error };
}
