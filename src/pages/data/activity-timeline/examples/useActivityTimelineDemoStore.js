import { computed, reactive } from 'vue';
import { defineStore } from 'pinia';
import { createActivityTimelineMockApi } from './activityTimelineMockApi.js';

export const useActivityTimelineDemoStore = defineActivityTimelineStore('activity-timeline-demo', {
	scope: 'release',
	scopeId: 'release_208',
	baseUrl: '/api/activity',
	api: createActivityTimelineMockApi(),
});

/**
 * Creates a configured Pinia activity resource store.
 *
 * @param {string} storeId Unique Pinia store id.
 * @param {Record<string, unknown>} options Resource and API configuration.
 * @returns {Function} Pinia use-store function.
 */
export function defineActivityTimelineStore(storeId = 'activity-timeline', options = {}) {
	return defineStore(storeId, function createConfiguredStore() {
		return createActivityTimelineStore(options);
	});
}

/**
 * Creates the setup-store contract used by the server-backed example.
 *
 * @param {Record<string, unknown>} options Resource and API configuration.
 * @returns {Record<string, unknown>} Store state, getters, and actions.
 */
function createActivityTimelineStore(options) {
	const api = options.api || createActivityTimelineRestApi(options);
	const state = reactive({
		rows: [],
		type: '',
		loading: false,
		loadingMore: false,
		nextCursor: null,
		hasNextPage: false,
		total: 0,
		error: '',
		lastRequestUrl: '',
		requestToken: 0,
	});

	const rows = computed(() => state.rows);
	const type = computed(() => state.type);
	const loading = computed(() => state.loading);
	const loadingMore = computed(() => state.loadingMore);
	const hasNextPage = computed(() => state.hasNextPage);
	const total = computed(() => state.total);
	const error = computed(() => state.error);
	const lastRequestUrl = computed(() => state.lastRequestUrl);

	/**
	 * Loads the first or next cursor page and ignores stale responses.
	 *
	 * @param {{ append?: boolean }} requestOptions Loading mode.
	 * @returns {Promise<void>} Resolves when the request settles.
	 */
	async function load(requestOptions = {}) {
		const append = Boolean(requestOptions.append);
		if (append && (!state.hasNextPage || state.loadingMore)) return;
		const token = state.requestToken + 1;
		state.requestToken = token;
		state.error = '';
		state.loading = !append;
		state.loadingMore = append;

		const request = {
			scope: options.scope,
			scopeId: options.scopeId,
			type: state.type || undefined,
			cursor: append ? state.nextCursor : undefined,
			limit: 4,
		};
		state.lastRequestUrl = requestUrl(options.baseUrl || '/api/activity', request);

		try {
			const response = await api.listActivity(request);
			if (token !== state.requestToken) return;
			state.rows = append ? mergeRows(state.rows, response.data) : response.data;
			state.nextCursor = response.pageInfo?.nextCursor || null;
			state.hasNextPage = Boolean(response.pageInfo?.hasNextPage);
			state.total = Number(response.meta?.total) || state.rows.length;
		} catch (error) {
			if (token === state.requestToken) state.error = error instanceof Error ? error.message : 'Activity could not be loaded.';
		} finally {
			if (token === state.requestToken) {
				state.loading = false;
				state.loadingMore = false;
			}
		}
	}

	/**
	 * Refreshes the first page while retaining visible rows.
	 *
	 * @returns {Promise<void>} Resolves after the refresh.
	 */
	function refresh() {
		return load({ append: false });
	}

	/**
	 * Appends the next server cursor page.
	 *
	 * @returns {Promise<void>} Resolves after pagination.
	 */
	function loadMore() {
		return load({ append: true });
	}

	/**
	 * Updates the type query and refreshes from the first cursor page.
	 *
	 * @param {string} value Requested activity type.
	 * @returns {Promise<void>} Resolves after the filtered refresh.
	 */
	function setType(value) {
		state.type = String(value || '');
		return refresh();
	}

	return {
		rows,
		type,
		loading,
		loadingMore,
		hasNextPage,
		total,
		error,
		lastRequestUrl,
		refresh,
		loadMore,
		setType,
	};
}

/**
 * Creates a fetch-based adapter for the documented activity endpoint.
 *
 * @param {Record<string, unknown>} options Resource and URL configuration.
 * @returns {{ listActivity: Function }} Activity API adapter.
 */
function createActivityTimelineRestApi(options) {
	return {
		/**
		 * Fetches one activity page from the configured resource endpoint.
		 *
		 * @param {Record<string, unknown>} request Activity query.
		 * @returns {Promise<Record<string, unknown>>} Activity response.
		 */
		async listActivity(request) {
			const response = await fetch(requestUrl(options.baseUrl || '/api/activity', request));
			if (!response.ok) throw new Error(`Activity request failed with ${response.status}.`);
			return response.json();
		},
	};
}

/**
 * Serializes the resource query into the documented endpoint shape.
 *
 * @param {string} baseUrl Activity endpoint.
 * @param {Record<string, unknown>} request Activity query.
 * @returns {string} Request URL.
 */
function requestUrl(baseUrl, request) {
	const params = new URLSearchParams();
	params.set('scope', String(request.scope));
	params.set('scopeId', String(request.scopeId));
	if (request.type) params.set('type', String(request.type));
	if (request.cursor) params.set('cursor', String(request.cursor));
	params.set('limit', String(request.limit || 20));
	return `${baseUrl}?${params.toString()}`;
}

/**
 * Merges cursor pages by stable row id.
 *
 * @param {Array<Record<string, unknown>>} current Existing rows.
 * @param {Array<Record<string, unknown>>} incoming Next cursor page.
 * @returns {Array<Record<string, unknown>>} Deduplicated rows.
 */
function mergeRows(current, incoming) {
	const rowsById = new Map();
	for (const row of [...current, ...(Array.isArray(incoming) ? incoming : [])]) rowsById.set(row.id, row);
	return [...rowsById.values()];
}
