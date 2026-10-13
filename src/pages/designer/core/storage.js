/**
 * Storage adapters: where a design is kept.
 *
 * Editors never touch localStorage, files or an API directly. They talk to an
 * adapter, so the same canvas can save in the browser, write `.vue` files in
 * a project, or store documents in a database like a CMS:
 *
 * ```js
 * {
 * 	load(id) => Promise<value | null>,
 * 	save(id, value, { operations }) => Promise<void>,
 * 	subscribe?(id, onChange) => unsubscribe,   // remote edits, for collaboration
 * 	list?() => Promise<Array<{ id, name? }>>,
 * }
 * ```
 *
 * `value` is whatever the editor saves: a canvas workspace, a poster
 * document, or a single file. `operations` are the edits since the last save,
 * for adapters that store an edit log or forward edits to collaborators;
 * adapters that store snapshots can ignore them.
 *
 * Format adapters (`vueAdapter.js`) turn documents into source and back.
 * Storage adapters only move values. The file adapter joins the two: it
 * stores source text, and the editor parses it on load.
 */

/**
 * Saves in this browser's localStorage. Failures (private mode, quota) are
 * reported to `onError` and never thrown, so editing continues in memory.
 *
 * @param {{ prefix?: string, storage?: Storage, onError?: (error: Error) => void }} [options] Key prefix (keys are prefix + id) and storage.
 * @returns {object} Storage adapter.
 */
export function createBrowserStorage({ prefix = 'dom-studio:', storage = globalThis.localStorage, onError = () => {} } = {}) {
	const key = (id) => `${prefix}${id}`;
	return {
		kind: 'browser',
		async load(id) {
			try {
				const raw = storage?.getItem(key(id));
				return raw ? JSON.parse(raw) : null;
			} catch (error) {
				onError(error);
				return null;
			}
		},
		async save(id, value) {
			try {
				storage?.setItem(key(id), JSON.stringify(value));
			} catch (error) {
				onError(error);
			}
		},
		async list() {
			const ids = [];
			for (let index = 0; index < (storage?.length || 0); index += 1) {
				const name = storage.key(index);
				if (name?.startsWith(prefix)) ids.push({ id: name.slice(prefix.length) });
			}
			return ids;
		},
	};
}

/**
 * Keeps values in memory and notifies subscribers of every save: a stand-in
 * for a collaborative backend in tests and demos.
 *
 * @returns {object} Storage adapter.
 */
export function createMemoryStorage() {
	const values = new Map();
	// JSON, not structuredClone: editor values are often reactive proxies, which structuredClone refuses.
	const copy = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));
	const listeners = new Map();
	return {
		kind: 'memory',
		async load(id) {
			return values.has(id) ? copy(values.get(id)) : null;
		},
		async save(id, value, { operations = [], origin = null } = {}) {
			values.set(id, copy(value));
			for (const listener of listeners.get(id) || []) if (listener.origin !== origin || origin === null) listener.onChange({ value: copy(value), operations });
		},
		subscribe(id, onChange, { origin = null } = {}) {
			const listener = { onChange, origin };
			if (!listeners.has(id)) listeners.set(id, new Set());
			listeners.get(id).add(listener);
			return () => listeners.get(id).delete(listener);
		},
		async list() {
			return [...values.keys()].map((id) => ({ id }));
		},
	};
}

/**
 * Stores JSON documents behind an HTTP API: the database or CMS adapter.
 *
 * `GET {endpoint}/{id}` returns `{ value }` (404 when new); `PUT` sends
 * `{ value, operations }`; `GET {endpoint}` returns `{ items: [{ id, name }] }`.
 * The server owns authentication, validation and the schema.
 *
 * @param {{ endpoint: string, fetch?: typeof fetch, headers?: Record<string, string> }} options API location.
 * @returns {object} Storage adapter.
 */
export function createHttpStorage({ endpoint, fetch: request = globalThis.fetch, headers = {} }) {
	const url = (id) => `${endpoint.replace(/\/$/, '')}/${encodeURIComponent(id)}`;
	return {
		kind: 'http',
		async load(id) {
			const response = await request(url(id), { headers: { accept: 'application/json', ...headers } });
			if (response.status === 404) return null;
			if (!response.ok) throw new Error(`Could not load ${id}: ${response.status}`);
			return (await response.json()).value ?? null;
		},
		async save(id, value, { operations = [] } = {}) {
			const response = await request(url(id), { method: 'PUT', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify({ value, operations }) });
			if (!response.ok) throw new Error(`Could not save ${id}: ${response.status}`);
		},
		async list() {
			const response = await request(endpoint, { headers: { accept: 'application/json', ...headers } });
			if (!response.ok) throw new Error(`Could not list documents: ${response.status}`);
			return (await response.json()).items || [];
		},
	};
}

/**
 * Reads and writes source files, such as `.vue` templates in a project.
 * Values are source text; ids are paths relative to the server's folder.
 *
 * `GET {endpoint}?path=` returns `{ path, source }`; `PUT {endpoint}` sends
 * `{ path, source }`; `GET {endpoint}` returns `{ files: [{ path }] }`.
 * The dev server provides this endpoint (`fileStorageServer.js`).
 *
 * @param {{ endpoint?: string, fetch?: typeof fetch }} [options] API location.
 * @returns {object} Storage adapter.
 */
export function createFileStorage({ endpoint = '/__designer/files', fetch: request = globalThis.fetch } = {}) {
	return {
		kind: 'file',
		async load(path) {
			const response = await request(`${endpoint}?path=${encodeURIComponent(path)}`);
			if (response.status === 404) return null;
			if (!response.ok) throw new Error(await response.text());
			return (await response.json()).source;
		},
		async save(path, source) {
			const response = await request(endpoint, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path, source }) });
			if (!response.ok) throw new Error(await response.text());
		},
		async list() {
			const response = await request(endpoint);
			if (!response.ok) throw new Error(`File storage is not available here (${response.status}).`);
			return ((await response.json()).files || []).map((file) => ({ id: file.path, name: file.path }));
		},
	};
}

/**
 * Batches saves: the latest value is written after `delay` ms of quiet, with
 * every operation since the previous write.
 *
 * @param {object} adapter Storage adapter.
 * @param {{ delay?: number, onError?: (error: Error) => void }} [options] Delay and error handler.
 * @returns {{ queue: (id: string, value: unknown, operations?: Array<object>) => void, flush: () => Promise<void> }}
 */
export function createSaver(adapter, { delay = 500, onError = () => {} } = {}) {
	let timer = null;
	let pending = null;
	async function flush() {
		clearTimeout(timer);
		timer = null;
		if (!pending) return;
		const { id, value, operations } = pending;
		pending = null;
		try {
			await adapter.save(id, value, { operations });
		} catch (error) {
			onError(error);
		}
	}
	return {
		queue(id, value, operations = []) {
			if (pending && pending.id !== id) flush();
			pending = { id, value, operations: [...(pending?.id === id ? pending.operations : []), ...operations] };
			clearTimeout(timer);
			timer = setTimeout(flush, delay);
		},
		flush,
	};
}
