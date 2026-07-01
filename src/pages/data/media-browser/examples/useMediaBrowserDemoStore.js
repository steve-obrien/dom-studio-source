import { computed, reactive } from 'vue';
import { defineStore } from 'pinia';
import { createMediaBrowserMockApi } from './mediaBrowserMockApi.js';

const DEFAULT_BASE_URL = '/api/media';
const DEFAULT_FILES_BASE_URL = '/api/files';
let logCounter = 0;
let tempCounter = 0;

export const useMediaBrowserDemoStore = defineMediaBrowserStore('media-browser-demo', {
	rootId: 'media_root_brand',
	baseUrl: DEFAULT_BASE_URL,
	filesBaseUrl: DEFAULT_FILES_BASE_URL,
	api: createMediaBrowserMockApi(),
});

/**
 * Creates a configured Pinia media browser store.
 *
 * @param {string} storeId Pinia store id.
 * @param {Record<string, unknown>} options Store configuration.
 * @returns {Function} Pinia use-store function.
 */
export function defineMediaBrowserStore(storeId = 'media-browser', options = {}) {
	return defineStore(storeId, () => createMediaBrowserStore(options));
}

/**
 * Creates the Pinia setup store used by reusable media browser integrations.
 *
 * @param {Record<string, unknown>} options Store configuration.
 * @returns {Record<string, unknown>} Store state, getters, and actions.
 */
function createMediaBrowserStore(options = {}) {
	const config = normalizeStoreOptions(options);
	const api = config.api || createMediaBrowserRestApi(config);
	const state = reactive(createInitialStoreState(config));

	seedRootState(state);

	const currentPath = computed(() => state.currentPath);
	const currentFolder = computed(() => state.rowsById[state.currentFolderId] || state.rowsById[state.rootId] || null);
	const currentFolderId = computed(() => currentFolder.value?.ulid || state.rootId);
	const items = computed(() => visibleItemsForPath(state, state.currentPath));
	const breadcrumbs = computed(() => state.breadcrumbsByPath[state.currentPath] || deriveBreadcrumbs(state.currentPath, state.rootId));
	const selectedKeys = computed(() => state.selectedKeys);
	const selectedItems = computed(() => state.selectedKeys.map((key) => state.rowsById[key]).filter(Boolean));
	const mode = computed(() => state.mode);
	const loading = computed(() => Boolean(state.loadingPaths[state.currentPath]));
	const emptyLoading = computed(() => loading.value && items.value.length === 0);
	const uploadProgress = computed(() => state.uploadProgress);
	const requestLog = computed(() => state.requestLog);
	const lastRequest = computed(() => state.lastRequest);
	const lastResponse = computed(() => state.lastResponse);

	/**
	 * Loads a folder from cache immediately, then refreshes it through the API.
	 *
	 * @param {string} path Folder path to load.
	 * @returns {Promise<void>} Resolves when the folder request settles.
	 */
	async function loadFolder(path = '/') {
		const nextPath = normalizePath(path);
		beginFolderNavigation(state, nextPath);

		const requestToken = nextRequestToken(state, nextPath);
		state.loadingPaths[nextPath] = true;

		const request = {
			rootId: state.rootId,
			path: nextPath,
		};
		const log = logRequest('GET', `${config.baseUrl}/roots/${state.rootId}/folders`, request);

		try {
			const response = await api.listFolder(request);
			if (!isCurrentRequestToken(state, nextPath, requestToken)) return;
			applyFolderResponse(state, nextPath, response);
			logResponse(log.id, response);
		} catch (error) {
			logError(log.id, error);
		} finally {
			if (isCurrentRequestToken(state, nextPath, requestToken)) {
				delete state.loadingPaths[nextPath];
			}
		}
	}

	/**
	 * Updates controlled selection keys.
	 *
	 * @param {Array<string>} keys Selected media row ids.
	 */
	function setSelectedKeys(keys) {
		state.selectedKeys = Array.isArray(keys) ? keys.map(String) : [];
	}

	/**
	 * Updates the browser display mode.
	 *
	 * @param {'grid'|'list'} nextMode Browser display mode.
	 */
	function setMode(nextMode) {
		state.mode = nextMode === 'list' ? 'list' : 'grid';
	}

	/**
	 * Creates a folder optimistically, then confirms it with the server.
	 *
	 * @param {{ path?: string, name?: string }} payload Create folder payload.
	 * @returns {Promise<Record<string, unknown>|null>} Created folder row.
	 */
	async function createFolder(payload = {}) {
		const path = normalizePath(payload.path || state.currentPath);
		const parentId = currentFolderIdForPath(state, path);
		const tempUlid = nextTempId('folder');
		const name = uniqueVisibleName(payload.name || 'New folder', visibleItemsForPath(state, path));
		const optimistic = {
			ulid: tempUlid,
			temporaryId: tempUlid,
			type: 'dir',
			name,
			path: joinPath(path, name),
			parent_id: parentId,
			file_uuid: null,
			status: 'saving',
		};

		upsertMediaItem(state, optimistic);
		prependChild(state, path, tempUlid);
		state.selectedKeys = [tempUlid];

		const request = {
			rootId: state.rootId,
			parentId,
			path,
			name,
			tempUlid,
		};
		const log = logRequest('POST', `${config.baseUrl}/folders`, request);
		try {
			const response = await api.createFolder(request);
			const row = replaceItemInPath(state, path, tempUlid, response.data);
			state.selectedKeys = [row.ulid];
			logResponse(log.id, response);
			return row;
		} catch (error) {
			removeChild(state, path, tempUlid);
			delete state.rowsById[tempUlid];
			logError(log.id, error);
			return null;
		}
	}

	/**
	 * Renames a row optimistically and lets the server return the canonical row.
	 *
	 * @param {{ item: Record<string, unknown>, name: string }} payload Rename payload.
	 * @returns {Promise<void>} Resolves when the rename response is applied.
	 */
	async function renameItem(payload) {
		const item = payload?.item;
		const name = String(payload?.name || '').trim();
		if (!item || !name) return;

		const previous = clone(state.rowsById[item.ulid] || item);
		applyVisiblePatch(state, item.ulid, renamePatch(item, name, 'saving'));

		const request = { ulid: item.ulid, name };
		const log = logRequest('PATCH', `${config.baseUrl}/${item.ulid}`, request);
		try {
			const response = await api.renameMedia(request);
			replaceItemInPath(state, parentPathFromItem(previous), item.ulid, response.data);
			logResponse(log.id, response);
		} catch (error) {
			upsertMediaItem(state, previous);
			logError(log.id, error);
		}
	}

	/**
	 * Moves rows into a target folder with an optimistic visible removal.
	 *
	 * @param {{ items: Array<Record<string, unknown>>, target: Record<string, unknown> }} payload Move payload.
	 * @returns {Promise<void>} Resolves when the move response is applied.
	 */
	async function moveItems(payload) {
		const rows = Array.isArray(payload?.items) ? payload.items : [];
		const target = payload?.target;
		if (!rows.length || !target) return;

		const sourcePath = state.currentPath;
		const targetPath = normalizePath(target.path || state.currentPath);
		const targetParentId = target.ulid || currentFolderIdForPath(state, targetPath);
		const ulids = rows.map((item) => item.ulid);
		const previousChildren = [...(state.childrenByPath[sourcePath] || [])];
		const previousTargetChildren = [...(state.childrenByPath[targetPath] || [])];
		state.childrenByPath[sourcePath] = previousChildren.filter((ulid) => !ulids.includes(ulid));
		state.selectedKeys = [];

		const request = {
			ulids,
			targetParentId,
		};
		const log = logRequest('PATCH', `${config.baseUrl}/move`, request);
		try {
			const response = await api.moveMedia(request);
			const movedIds = (response.data || [])
				.map((row) => upsertMediaItem(state, row)?.ulid)
				.filter(Boolean);
			if (movedIds.length && hasOwn(state.childrenByPath, targetPath)) {
				state.childrenByPath[targetPath] = [
					...movedIds,
					...state.childrenByPath[targetPath].filter((ulid) => !movedIds.includes(ulid)),
				];
			}
			logResponse(log.id, response);
		} catch (error) {
			state.childrenByPath[sourcePath] = previousChildren;
			if (hasOwn(state.childrenByPath, targetPath)) state.childrenByPath[targetPath] = previousTargetChildren;
			logError(log.id, error);
		}
	}

	/**
	 * Creates a folder and moves selected items into it.
	 *
	 * @param {{ items: Array<Record<string, unknown>>, path?: string }} payload Folder grouping payload.
	 * @returns {Promise<void>} Resolves after the move completes.
	 */
	async function makeFolderWithItems(payload = {}) {
		const rows = Array.isArray(payload.items) ? payload.items : selectedItems.value;
		if (!rows.length) return;
		const folder = await createFolder({
			path: payload.path || state.currentPath,
			name: 'New folder with items',
		});
		if (!folder) return;
		await moveItems({ items: rows, target: folder });
	}

	/**
	 * Updates joined file metadata through the file endpoint.
	 *
	 * @param {{ item: Record<string, unknown>, meta: Record<string, unknown> }} payload Metadata payload.
	 * @returns {Promise<void>} Resolves when the metadata response is applied.
	 */
	async function updateMetadata(payload) {
		const item = payload?.item;
		const fileUuid = item?.file_uuid;
		if (!item || !fileUuid) return;

		const previous = clone(state.rowsById[item.ulid] || item);
		applyVisiblePatch(state, item.ulid, {
			file: {
				...(item.file || {}),
				meta: {
					...(item.file?.meta || {}),
					...(payload.meta || {}),
				},
			},
			status: 'saving',
		});

		const request = {
			fileUuid,
			meta: payload.meta || {},
		};
		const log = logRequest('PATCH', `${config.filesBaseUrl}/${fileUuid}/meta`, request);
		try {
			const response = await api.updateFileMeta(request);
			applyVisiblePatch(state, item.ulid, {
				file: response.data,
				status: 'idle',
			});
			logResponse(log.id, response);
		} catch (error) {
			upsertMediaItem(state, previous);
			logError(log.id, error);
		}
	}

	/**
	 * Adds optimistic upload rows, runs the chunk-upload API, and applies server rows.
	 *
	 * @param {{ files: Array<Record<string, unknown>>, target?: Record<string, unknown>|null, path?: string }} payload Upload payload.
	 * @returns {Promise<void>} Resolves when the upload response is applied.
	 */
	async function uploadFiles(payload = {}) {
		const uploadRecords = normalizeUploadFiles(payload.files || []);
		if (!uploadRecords.length) return;

		const target = payload.target || null;
		const targetPath = normalizePath(payload.path || target?.path || state.currentPath);
		const parentId = target?.ulid || currentFolderIdForPath(state, targetPath);
		const optimisticRows = optimisticUploadRows(uploadRecords, parentId, targetPath);
		mergeUploadRows(state, targetPath, optimisticRows);
		state.uploadProgress = 1;

		const request = {
			rootId: state.rootId,
			parentId,
			path: targetPath,
			chunkSize: 5 * 1024 * 1024,
			files: uploadRecords.map(uploadRequestFile),
		};
		const log = logRequest('POST', `${config.baseUrl}/uploads`, request);
		try {
			const response = await api.uploadBatch({
				...request,
				files: uploadRecords,
				onProgress: (progress) => updateUploadProgress(state, targetPath, uploadRecords, progress),
			});
			applyVisibleRows(state, targetPath, response.visible.map(markIdleUpload));
			state.uploadProgress = 0;
			revokePreviewUrls(uploadRecords);
			logResponse(log.id, response);
		} catch (error) {
			state.uploadProgress = 0;
			revokePreviewUrls(uploadRecords);
			logError(log.id, error);
		}
	}

	/**
	 * Logs an outgoing request and stores it as the last request preview.
	 *
	 * @param {string} method HTTP method.
	 * @param {string} url REST URL.
	 * @param {Record<string, unknown>} body Request body or query object.
	 * @returns {Record<string, unknown>} Created log entry.
	 */
	function logRequest(method, url, body) {
		const entry = {
			id: ++logCounter,
			method,
			url,
			body: clone(body),
			status: 'pending',
			requestedAt: new Date().toISOString(),
			response: null,
		};
		state.lastRequest = entry;
		state.requestLog = [entry, ...state.requestLog].slice(0, 8);
		return entry;
	}

	/**
	 * Adds a response summary to an existing request log entry.
	 *
	 * @param {number} id Log entry id.
	 * @param {Record<string, unknown>} response Response payload.
	 */
	function logResponse(id, response) {
		state.lastResponse = response;
		state.requestLog = state.requestLog.map((entry) => (
			entry.id === id
				? { ...entry, status: 'success', response: clone(response) }
				: entry
		));
	}

	/**
	 * Adds an error summary to an existing request log entry.
	 *
	 * @param {number} id Log entry id.
	 * @param {Error} error Error thrown by the API.
	 */
	function logError(id, error) {
		state.requestLog = state.requestLog.map((entry) => (
			entry.id === id
				? { ...entry, status: 'error', response: { error: error.message } }
				: entry
		));
		state.lastResponse = { error: error.message };
	}

	return {
		state,
		rootId: computed(() => state.rootId),
		currentFolder,
		currentFolderId,
		currentPath,
		items,
		breadcrumbs,
		selectedKeys,
		selectedItems,
		mode,
		loading,
		emptyLoading,
		uploadProgress,
		requestLog,
		lastRequest,
		lastResponse,
		loadFolder,
		setSelectedKeys,
		setMode,
		createFolder,
		renameItem,
		moveItems,
		makeFolderWithItems,
		updateMetadata,
		uploadFiles,
	};
}

/**
 * Creates a fetch-backed API adapter with the same method surface as the mock API.
 *
 * @param {Record<string, unknown>} options Adapter options.
 * @returns {Record<string, Function>} REST API adapter.
 */
export function createMediaBrowserRestApi(options = {}) {
	const config = normalizeStoreOptions(options);

	/**
	 * Lists a folder through the REST API.
	 *
	 * @param {Record<string, unknown>} request Folder request.
	 * @returns {Promise<Record<string, unknown>>} Folder response.
	 */
	function listFolder(request) {
		return requestJson('GET', `${config.baseUrl}/roots/${request.rootId}/folders?path=${encodeURIComponent(request.path)}`, null, config);
	}

	/**
	 * Creates a folder through the REST API.
	 *
	 * @param {Record<string, unknown>} request Create request.
	 * @returns {Promise<Record<string, unknown>>} Create response.
	 */
	function createFolder(request) {
		return requestJson('POST', `${config.baseUrl}/folders`, request, config);
	}

	/**
	 * Renames a media row through the REST API.
	 *
	 * @param {Record<string, unknown>} request Rename request.
	 * @returns {Promise<Record<string, unknown>>} Rename response.
	 */
	function renameMedia(request) {
		return requestJson('PATCH', `${config.baseUrl}/${request.ulid}`, request, config);
	}

	/**
	 * Moves media rows through the REST API.
	 *
	 * @param {Record<string, unknown>} request Move request.
	 * @returns {Promise<Record<string, unknown>>} Move response.
	 */
	function moveMedia(request) {
		return requestJson('PATCH', `${config.baseUrl}/move`, request, config);
	}

	/**
	 * Updates file metadata through the REST API.
	 *
	 * @param {Record<string, unknown>} request Metadata request.
	 * @returns {Promise<Record<string, unknown>>} Metadata response.
	 */
	function updateFileMeta(request) {
		return requestJson('PATCH', `${config.filesBaseUrl}/${request.fileUuid}/meta`, request, config);
	}

	/**
	 * Starts an upload batch through the REST API.
	 *
	 * @param {Record<string, unknown>} request Upload request.
	 * @returns {Promise<Record<string, unknown>>} Upload response.
	 */
	function uploadBatch(request) {
		return requestJson('POST', `${config.baseUrl}/uploads`, uploadRequestPayload(request), config);
	}

	return {
		listFolder,
		createFolder,
		renameMedia,
		moveMedia,
		updateFileMeta,
		uploadBatch,
	};
}

/**
 * Normalizes store and API adapter options.
 *
 * @param {Record<string, unknown>} options Raw options.
 * @returns {Record<string, unknown>} Normalized options.
 */
function normalizeStoreOptions(options = {}) {
	return {
		rootId: String(options.rootId || 'media_root'),
		baseUrl: String(options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, ''),
		filesBaseUrl: String(options.filesBaseUrl || DEFAULT_FILES_BASE_URL).replace(/\/$/, ''),
		api: options.api || null,
		mode: options.mode === 'list' ? 'list' : 'grid',
		fetchOptions: options.fetchOptions || {},
		headers: options.headers || {},
	};
}

/**
 * Creates the initial reactive store object.
 *
 * @param {Record<string, unknown>} config Normalized store config.
 * @returns {Record<string, unknown>} Initial state object.
 */
function createInitialStoreState(config) {
	return {
		rootId: config.rootId,
		currentPath: '/',
		currentFolderId: config.rootId,
		rowsById: {},
		filesById: {},
		folderIdByPath: {},
		childrenByPath: {},
		breadcrumbsByPath: {},
		selectedKeys: [],
		mode: config.mode,
		loadingPaths: {},
		uploadProgress: 0,
		requestLog: [],
		lastRequest: null,
		lastResponse: null,
		requestTokensByPath: {},
		requestCounter: 0,
	};
}

/**
 * Seeds the root folder before the first API response arrives.
 *
 * @param {Record<string, unknown>} state Store state.
 */
function seedRootState(state) {
	const root = {
		ulid: state.rootId,
		type: 'root',
		path: '/',
		parent_id: null,
		file_uuid: null,
		name: 'Root',
		file: null,
		status: 'idle',
	};
	upsertMediaItem(state, root);
	state.childrenByPath['/'] = state.childrenByPath['/'] || [];
	state.breadcrumbsByPath['/'] = [{ label: 'Root', path: '/', ulid: state.rootId }];
	state.folderIdByPath['/'] = state.rootId;
}

/**
 * Starts folder navigation using local cache before the network response returns.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} path Folder path.
 */
function beginFolderNavigation(state, path) {
	state.currentPath = path;
	state.currentFolderId = state.folderIdByPath[path] || (path === '/' ? state.rootId : state.currentFolderId);
	state.selectedKeys = [];
	if (!hasOwn(state.childrenByPath, path)) state.childrenByPath[path] = [];
	if (!state.breadcrumbsByPath[path]) state.breadcrumbsByPath[path] = deriveBreadcrumbs(path, state.rootId);
}

/**
 * Applies a folder API response to the reactive cache.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} path Requested folder path.
 * @param {Record<string, unknown>} response API response.
 */
function applyFolderResponse(state, path, response) {
	const responsePath = normalizePath(response?.meta?.path || path);
	const folder = upsertMediaItem(state, response.folder);
	state.currentFolderId = state.currentPath === responsePath ? folder.ulid : state.currentFolderId;
	state.folderIdByPath[responsePath] = folder.ulid;
	applyVisibleRows(state, responsePath, response.data || []);
	state.breadcrumbsByPath[responsePath] = normalizeBreadcrumbRows(response.breadcrumbs || deriveBreadcrumbs(responsePath, state.rootId));
}

/**
 * Applies the canonical visible rows for one folder path.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} path Folder path.
 * @param {Array<Record<string, unknown>>} rows Visible rows.
 */
function applyVisibleRows(state, path, rows) {
	const ids = [];
	for (const row of rows) {
		const saved = upsertMediaItem(state, row);
		ids.push(saved.ulid);
	}
	state.childrenByPath[normalizePath(path)] = ids;
}

/**
 * Inserts or updates a media row while preserving object identity.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {Record<string, unknown>} row Media row.
 * @returns {Record<string, unknown>} Reactive media row.
 */
function upsertMediaItem(state, row = {}) {
	const key = String(row.ulid || row.temporaryId || '');
	if (!key) return null;
	const file = row.file ? upsertFileRecord(state, row.file) : null;
	const next = {
		...row,
		ulid: key,
		name: row.name || file?.name || pathBasename(row.path),
		file,
		status: row.status || 'idle',
	};
	if (state.rowsById[key]) {
		Object.assign(state.rowsById[key], next);
	} else {
		state.rowsById[key] = next;
	}
	if (['root', 'dir'].includes(next.type)) {
		state.folderIdByPath[normalizePath(next.path)] = key;
	}
	return state.rowsById[key];
}

/**
 * Inserts or updates a file row while preserving object identity.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {Record<string, unknown>} file File row.
 * @returns {Record<string, unknown>} Reactive file row.
 */
function upsertFileRecord(state, file = {}) {
	const key = String(file.ulid || file.uuid || '');
	if (!key) return { ...file };
	if (state.filesById[key]) {
		Object.assign(state.filesById[key], file);
	} else {
		state.filesById[key] = { ...file, ulid: key };
	}
	return state.filesById[key];
}

/**
 * Replaces one child id in a folder with a canonical media row.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} path Folder path.
 * @param {string} oldUlid Optimistic row id.
 * @param {Record<string, unknown>} nextItem Canonical row.
 * @returns {Record<string, unknown>} Saved row.
 */
function replaceItemInPath(state, path, oldUlid, nextItem) {
	const saved = upsertMediaItem(state, nextItem);
	const normalizedPath = normalizePath(path);
	const ids = state.childrenByPath[normalizedPath] || [];
	state.childrenByPath[normalizedPath] = ids.map((id) => (String(id) === String(oldUlid) ? saved.ulid : id));
	if (String(oldUlid) !== String(saved.ulid)) delete state.rowsById[oldUlid];
	return saved;
}

/**
 * Applies a partial update to a visible row.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} ulid Media row id.
 * @param {Record<string, unknown>} patch Partial row patch.
 */
function applyVisiblePatch(state, ulid, patch) {
	const row = state.rowsById[ulid];
	if (!row) return;
	const { file, ...rest } = patch;
	Object.assign(row, rest);
	if (file) row.file = upsertFileRecord(state, file);
}

/**
 * Returns visible rows for a folder path.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} path Folder path.
 * @returns {Array<Record<string, unknown>>} Visible media rows.
 */
function visibleItemsForPath(state, path) {
	return (state.childrenByPath[normalizePath(path)] || [])
		.map((ulid) => state.rowsById[ulid])
		.filter(Boolean);
}

/**
 * Prepends a child id to a folder path.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} path Folder path.
 * @param {string} ulid Media row id.
 */
function prependChild(state, path, ulid) {
	const normalizedPath = normalizePath(path);
	const ids = state.childrenByPath[normalizedPath] || [];
	state.childrenByPath[normalizedPath] = [ulid, ...ids.filter((id) => id !== ulid)];
}

/**
 * Removes a child id from a folder path.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} path Folder path.
 * @param {string} ulid Media row id.
 */
function removeChild(state, path, ulid) {
	const normalizedPath = normalizePath(path);
	state.childrenByPath[normalizedPath] = (state.childrenByPath[normalizedPath] || []).filter((id) => id !== ulid);
}

/**
 * Merges optimistic upload rows into a folder cache.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} path Folder path.
 * @param {Array<Record<string, unknown>>} rows Upload rows.
 */
function mergeUploadRows(state, path, rows) {
	for (const row of rows) upsertMediaItem(state, row);
	const normalizedPath = normalizePath(path);
	const uploadIds = rows.map((row) => row.ulid);
	const existing = state.childrenByPath[normalizedPath] || [];
	state.childrenByPath[normalizedPath] = [...uploadIds, ...existing.filter((id) => !uploadIds.includes(id))];
}

/**
 * Applies upload progress to optimistic rows.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} path Folder path.
 * @param {Array<Record<string, unknown>>} uploadRecords Upload records.
 * @param {{ overall?: number, files?: Array<Record<string, unknown>> }} progress Progress payload.
 */
function updateUploadProgress(state, path, uploadRecords, progress) {
	state.uploadProgress = clampProgress(progress?.overall);
	const fileProgress = new Map((progress?.files || []).map((file) => [String(file.tempUlid), clampProgress(file.progress)]));
	const folderProgress = folderProgressByName(uploadRecords, fileProgress);
	for (const item of visibleItemsForPath(state, path)) {
		if (item.status !== 'uploading') continue;
		if (fileProgress.has(item.ulid)) item.uploadProgress = fileProgress.get(item.ulid);
		else if (folderProgress.has(String(item.name).toLowerCase())) item.uploadProgress = folderProgress.get(String(item.name).toLowerCase());
		else item.uploadProgress = state.uploadProgress;
	}
}

/**
 * Averages nested upload progress by top-level folder name.
 *
 * @param {Array<Record<string, unknown>>} uploadRecords Upload records.
 * @param {Map<string, number>} fileProgress Progress keyed by temp id.
 * @returns {Map<string, number>} Progress keyed by folder name.
 */
function folderProgressByName(uploadRecords, fileProgress) {
	const grouped = new Map();
	for (const record of uploadRecords) {
		if (!Array.isArray(record.pathSegments) || record.pathSegments.length < 2) continue;
		const folder = String(record.pathSegments[0]).toLowerCase();
		const progress = fileProgress.get(record.tempUlid) || 0;
		const values = grouped.get(folder) || [];
		values.push(progress);
		grouped.set(folder, values);
	}
	return new Map([...grouped.entries()].map(([folder, values]) => [
		folder,
		Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
	]));
}

/**
 * Resolves the current folder id for a path.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} path Folder path.
 * @returns {string} Folder id.
 */
function currentFolderIdForPath(state, path) {
	return state.folderIdByPath[normalizePath(path)] || state.currentFolderId || state.rootId;
}

/**
 * Creates a patch for an optimistically renamed row.
 *
 * @param {Record<string, unknown>} item Media row being renamed.
 * @param {string} name New display name.
 * @param {string} status Optimistic status.
 * @returns {Record<string, unknown>} Partial row patch.
 */
function renamePatch(item, name, status) {
	const parentPath = parentPathFromItem(item);
	const patch = {
		name,
		path: joinPath(parentPath, name),
		status,
	};
	if (item.type === 'file') {
		patch.file = {
			...(item.file || {}),
			name,
		};
	}
	return patch;
}

/**
 * Normalizes dropped files and assigns temporary upload ids.
 *
 * @param {Array<Record<string, unknown>>} files Dropped files from the component.
 * @returns {Array<Record<string, unknown>>} Upload records.
 */
function normalizeUploadFiles(files) {
	return files.map((record) => ({
		...record,
		tempUlid: nextTempId('upload'),
		name: record.name || record.file?.name || 'upload.bin',
		previewUrl: createPreviewUrl(record.file),
		pathSegments: Array.isArray(record.pathSegments) && record.pathSegments.length
			? record.pathSegments
			: [record.name || record.file?.name || 'upload.bin'],
	}));
}

/**
 * Creates a temporary browser preview URL for image uploads.
 *
 * @param {File|undefined} file Browser file.
 * @returns {string} Object URL or empty string.
 */
function createPreviewUrl(file) {
	if (!file || !String(file.type || '').startsWith('image/') || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return '';
	return URL.createObjectURL(file);
}

/**
 * Revokes temporary browser preview URLs.
 *
 * @param {Array<Record<string, unknown>>} records Upload records.
 */
function revokePreviewUrls(records) {
	if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') return;
	for (const record of records) {
		if (record.previewUrl) URL.revokeObjectURL(record.previewUrl);
	}
}

/**
 * Creates visible optimistic upload rows for files and top-level folders.
 *
 * @param {Array<Record<string, unknown>>} files Upload file records.
 * @param {string} parentId Target parent id.
 * @param {string} targetPath Target folder path.
 * @returns {Array<Record<string, unknown>>} Optimistic media rows.
 */
function optimisticUploadRows(files, parentId, targetPath) {
	const rows = [];
	const folderNames = new Set();
	for (const file of files) {
		if (file.pathSegments.length > 1) {
			const folderName = file.pathSegments[0];
			const folderKey = folderName.toLowerCase();
			if (folderNames.has(folderKey)) continue;
			folderNames.add(folderKey);
			rows.push({
				ulid: nextTempId('upload-folder'),
				type: 'dir',
				name: folderName,
				path: joinPath(targetPath, folderName),
				parent_id: parentId,
				file_uuid: null,
				status: 'uploading',
				uploadProgress: 1,
			});
			continue;
		}

		rows.push({
			ulid: file.tempUlid,
			type: 'file',
			name: file.name,
			path: joinPath(targetPath, file.name),
			parent_id: parentId,
			file_uuid: null,
			status: 'uploading',
			uploadProgress: 1,
			previewUrl: file.previewUrl,
			file: {
				ulid: file.tempUlid,
				name: file.name,
				mimeType: file.file?.type || '',
				size: file.file?.size || 0,
				previewUrl: file.previewUrl,
				thumbnailUrl: file.previewUrl,
				meta: {},
			},
		});
	}
	return rows;
}

/**
 * Marks a completed upload row as idle.
 *
 * @param {Record<string, unknown>} item Media row.
 * @returns {Record<string, unknown>} Idle row.
 */
function markIdleUpload(item) {
	return {
		...item,
		status: 'idle',
		uploadProgress: 0,
	};
}

/**
 * Strips browser File objects out of the visible request preview.
 *
 * @param {Record<string, unknown>} file Upload record.
 * @returns {Record<string, unknown>} Serializable upload request file.
 */
function uploadRequestFile(file) {
	return {
		tempUlid: file.tempUlid,
		name: file.name,
		relativePath: file.relativePath || file.name,
		pathSegments: file.pathSegments,
		size: file.file?.size || 0,
		mimeType: file.file?.type || '',
	};
}

/**
 * Builds a serializable upload request payload for the REST adapter.
 *
 * @param {Record<string, unknown>} request Upload request.
 * @returns {Record<string, unknown>} Serializable upload body.
 */
function uploadRequestPayload(request) {
	return {
		rootId: request.rootId,
		parentId: request.parentId,
		path: request.path,
		chunkSize: request.chunkSize,
		files: (request.files || []).map(uploadRequestFile),
	};
}

/**
 * Sends a JSON REST request.
 *
 * @param {string} method HTTP method.
 * @param {string} url Request URL.
 * @param {Record<string, unknown>|null} body Request body.
 * @param {Record<string, unknown>} config REST config.
 * @returns {Promise<Record<string, unknown>>} Parsed JSON response.
 */
async function requestJson(method, url, body, config) {
	const response = await fetch(url, {
		...(config.fetchOptions || {}),
		method,
		headers: {
			'content-type': 'application/json',
			...(config.headers || {}),
			...(config.fetchOptions?.headers || {}),
		},
		body: body ? JSON.stringify(body) : undefined,
	});
	if (!response.ok) throw new Error(`Media API request failed with ${response.status}`);
	return response.json();
}

/**
 * Generates the next request token for a path.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} path Folder path.
 * @returns {number} Request token.
 */
function nextRequestToken(state, path) {
	state.requestCounter += 1;
	state.requestTokensByPath[path] = state.requestCounter;
	return state.requestCounter;
}

/**
 * Checks whether a request token still owns a path.
 *
 * @param {Record<string, unknown>} state Store state.
 * @param {string} path Folder path.
 * @param {number} token Request token.
 * @returns {boolean} True when the token is current.
 */
function isCurrentRequestToken(state, path, token) {
	return state.requestTokensByPath[path] === token;
}

/**
 * Normalizes API breadcrumb rows.
 *
 * @param {Array<Record<string, unknown>>} breadcrumbs Breadcrumb rows.
 * @returns {Array<Record<string, unknown>>} Normalized breadcrumbs.
 */
function normalizeBreadcrumbRows(breadcrumbs) {
	return breadcrumbs.map((crumb, index) => ({
		label: crumb.label || (index === 0 ? 'Root' : pathBasename(crumb.path)),
		path: normalizePath(crumb.path),
		ulid: crumb.ulid || null,
	}));
}

/**
 * Derives breadcrumbs immediately from a path before the server responds.
 *
 * @param {string} path Folder path.
 * @param {string} rootId Root media id.
 * @returns {Array<Record<string, unknown>>} Derived breadcrumbs.
 */
function deriveBreadcrumbs(path, rootId) {
	const segments = normalizePath(path).split('/').filter(Boolean);
	const breadcrumbs = [{ label: 'Root', path: '/', ulid: rootId }];
	let cursor = '';
	for (const segment of segments) {
		cursor = `${cursor}/${segment}`;
		breadcrumbs.push({
			label: decodeSegment(segment),
			path: cursor,
			ulid: null,
		});
	}
	return breadcrumbs;
}

/**
 * Decodes a path segment for breadcrumb labels.
 *
 * @param {string} segment Path segment.
 * @returns {string} Decoded segment.
 */
function decodeSegment(segment) {
	try {
		return decodeURIComponent(segment);
	} catch {
		return segment;
	}
}

/**
 * Resolves a row's parent path.
 *
 * @param {Record<string, unknown>} item Media row.
 * @returns {string} Parent path.
 */
function parentPathFromItem(item) {
	const parts = String(item.path || '').split('/').filter(Boolean);
	parts.pop();
	return parts.length ? `/${parts.join('/')}` : '/';
}

/**
 * Joins a parent path and child name.
 *
 * @param {string} parentPath Parent media path.
 * @param {string} name Child name.
 * @returns {string} Joined media path.
 */
function joinPath(parentPath, name) {
	const parent = normalizePath(parentPath);
	const child = String(name || '').trim().replace(/^\/+|\/+$/g, '') || 'Untitled';
	return parent === '/' ? `/${child}` : `${parent}/${child}`;
}

/**
 * Normalizes a path into the media path contract.
 *
 * @param {string} path Path-like value.
 * @returns {string} Slash-prefixed path.
 */
function normalizePath(path) {
	const normalized = String(path || '/').trim().replace(/\/+/g, '/').replace(/\/$/, '');
	return normalized.startsWith('/') ? normalized || '/' : `/${normalized}`;
}

/**
 * Returns the last segment of a media path.
 *
 * @param {string} path Media path.
 * @returns {string} Path basename.
 */
function pathBasename(path) {
	const segments = String(path || '').split('/').filter(Boolean);
	return decodeSegment(segments[segments.length - 1] || 'Root');
}

/**
 * Generates a unique visible folder name.
 *
 * @param {string} requestedName Desired name.
 * @param {Array<Record<string, unknown>>} rows Currently visible media rows.
 * @returns {string} Unique visible name.
 */
function uniqueVisibleName(requestedName, rows = []) {
	const base = String(requestedName || 'New folder').trim() || 'New folder';
	const names = new Set(rows.map((item) => String(item.name || '').toLowerCase()));
	if (!names.has(base.toLowerCase())) return base;
	let index = 2;
	while (names.has(`${base} ${index}`.toLowerCase())) index += 1;
	return `${base} ${index}`;
}

/**
 * Generates a temporary client id.
 *
 * @param {string} prefix Id prefix.
 * @returns {string} Temporary id.
 */
function nextTempId(prefix) {
	tempCounter += 1;
	return `temp_${prefix}_${tempCounter.toString(36)}`;
}

/**
 * Clamps a progress value to a percentage.
 *
 * @param {number} value Raw progress value.
 * @returns {number} Percentage.
 */
function clampProgress(value) {
	const number = Number(value);
	if (!Number.isFinite(number)) return 0;
	return Math.min(100, Math.max(0, Math.round(number)));
}

/**
 * Checks whether an object owns a key.
 *
 * @param {object} value Object to inspect.
 * @param {string} key Property key.
 * @returns {boolean} True when the object owns the key.
 */
function hasOwn(value, key) {
	return Object.prototype.hasOwnProperty.call(value, key);
}

/**
 * Creates a structured clone that tolerates plain demo records.
 *
 * @param {unknown} value Value to clone.
 * @returns {unknown} Cloned value.
 */
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}
