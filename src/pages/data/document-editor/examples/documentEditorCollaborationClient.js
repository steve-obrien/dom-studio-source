import {
	Awareness,
	applyAwarenessUpdate,
	encodeAwarenessUpdate,
	removeAwarenessStates,
} from 'y-protocols/awareness';
import * as Y from 'yjs';

const DEFAULT_PATH = '/ws/document-editor';
const MESSAGE_DOCUMENT_UPDATE = 0;
const MESSAGE_AWARENESS_UPDATE = 1;

/**
 * Provides the Yjs document and awareness interface expected by DomDocumentEditor.
 *
 * The demo transport intentionally keeps a tiny protocol: binary messages contain
 * either a Yjs update or an awareness update, while JSON messages contain assigned
 * usernames and the room's active presence list.
 */
export class DocumentEditorCollaborationProvider {
	/**
	 * Creates a disconnected or immediately connected collaboration provider.
	 *
	 * @param {{ document?: Y.Doc, url?: string, connect?: boolean }} [options] Provider options.
	 */
	constructor(options = {}) {
		this.document = options.document || new Y.Doc();
		this.awareness = new Awareness(this.document);
		this.url = options.url || resolveDocumentEditorSocketUrl();
		this.socket = null;
		this.status = 'disconnected';
		this.synced = false;
		this.shouldInitialize = false;
		this.user = null;
		this.users = [];
		this.expiresAt = null;
		this.resetting = false;
		this.destroyed = false;
		this.listeners = new Map();
		this.handleDocumentUpdate = this.handleDocumentUpdate.bind(this);
		this.handleAwarenessUpdate = this.handleAwarenessUpdate.bind(this);
		this.handleSocketOpen = this.handleSocketOpen.bind(this);
		this.handleSocketMessage = this.handleSocketMessage.bind(this);
		this.handleSocketClose = this.handleSocketClose.bind(this);
		this.handleSocketError = this.handleSocketError.bind(this);
		this.document.on('update', this.handleDocumentUpdate);
		this.awareness.on('update', this.handleAwarenessUpdate);
		if (options.connect !== false) this.connect();
	}

	/**
	 * Subscribes to provider lifecycle or presence events.
	 *
	 * @param {string} eventName Event name.
	 * @param {Function} listener Event listener.
	 * @returns {DocumentEditorCollaborationProvider} Provider instance.
	 */
	on(eventName, listener) {
		if (!this.listeners.has(eventName)) this.listeners.set(eventName, new Set());
		this.listeners.get(eventName).add(listener);
		return this;
	}

	/**
	 * Removes a provider event listener.
	 *
	 * @param {string} eventName Event name.
	 * @param {Function} listener Event listener.
	 * @returns {DocumentEditorCollaborationProvider} Provider instance.
	 */
	off(eventName, listener) {
		this.listeners.get(eventName)?.delete(listener);
		return this;
	}

	/**
	 * Opens the WebSocket connection.
	 *
	 * @returns {void}
	 */
	connect() {
		if (this.destroyed || this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) return;
		this.setStatus('connecting');
		this.synced = false;
		this.socket = new WebSocket(this.url);
		this.socket.binaryType = 'arraybuffer';
		this.socket.addEventListener('open', this.handleSocketOpen);
		this.socket.addEventListener('message', this.handleSocketMessage);
		this.socket.addEventListener('close', this.handleSocketClose);
		this.socket.addEventListener('error', this.handleSocketError);
	}

	/**
	 * Closes the current WebSocket without destroying the Yjs document.
	 *
	 * @returns {void}
	 */
	disconnect() {
		if (!this.socket) return;
		this.socket.close(1000, 'Page left collaboration demo');
	}

	/**
	 * Tears down transport and awareness listeners.
	 *
	 * @returns {void}
	 */
	destroy() {
		if (this.destroyed) return;
		this.awareness.setLocalState(null);
		this.destroyed = true;
		this.disconnect();
		this.document.off('update', this.handleDocumentUpdate);
		this.awareness.off('update', this.handleAwarenessUpdate);
		this.awareness.destroy();
		this.listeners.clear();
	}

	/**
	 * Marks the empty-room starter content as initialized.
	 *
	 * @returns {void}
	 */
	markInitialized() {
		this.shouldInitialize = false;
	}

	/**
	 * Emits an event to registered listeners.
	 *
	 * @param {string} eventName Event name.
	 * @param {unknown} payload Event payload.
	 * @returns {void}
	 */
	emit(eventName, payload) {
		for (const listener of this.listeners.get(eventName) || []) listener(payload);
	}

	/**
	 * Sends a local Yjs document update to the room.
	 *
	 * @param {Uint8Array} update Yjs update.
	 * @param {unknown} origin Update origin.
	 * @returns {void}
	 */
	handleDocumentUpdate(update, origin) {
		if (origin === this) return;
		this.sendBinary(MESSAGE_DOCUMENT_UPDATE, update);
	}

	/**
	 * Sends local caret, selection, and identity changes to the room.
	 *
	 * @param {{ added: Array<number>, updated: Array<number>, removed: Array<number> }} changes Awareness changes.
	 * @param {unknown} origin Awareness update origin.
	 * @returns {void}
	 */
	handleAwarenessUpdate({ added, updated, removed }, origin) {
		if (origin === this) return;
		const clientIds = [...added, ...updated, ...removed];
		if (!clientIds.length) return;
		this.sendBinary(MESSAGE_AWARENESS_UPDATE, encodeAwarenessUpdate(this.awareness, clientIds));
	}

	/**
	 * Updates connection status after the socket opens.
	 *
	 * @returns {void}
	 */
	handleSocketOpen() {
		this.setStatus('connected');
	}

	/**
	 * Routes JSON control messages and binary collaboration messages.
	 *
	 * @param {MessageEvent} event Browser WebSocket message event.
	 * @returns {Promise<void>} Resolves after any Blob conversion completes.
	 */
	async handleSocketMessage(event) {
		if (typeof event.data === 'string') {
			this.handleJsonMessage(event.data);
			return;
		}
		try {
			const message = await browserDataToUint8Array(event.data);
			if (message.length < 2) return;
			const messageType = message[0];
			const payload = message.subarray(1);
			if (messageType === MESSAGE_DOCUMENT_UPDATE) {
				Y.applyUpdate(this.document, payload, this);
				if (!this.synced) {
					this.synced = true;
					this.emit('synced', { state: true });
				}
				return;
			}
			if (messageType === MESSAGE_AWARENESS_UPDATE) {
				applyAwarenessUpdate(this.awareness, payload, this);
			}
		} catch (error) {
			this.emit('error', { error });
		}
	}

	/**
	 * Clears stale remote awareness when the socket closes.
	 *
	 * @param {CloseEvent} event Browser WebSocket close event.
	 * @returns {void}
	 */
	handleSocketClose(event) {
		this.removeRemoteAwareness();
		this.socket = null;
		this.synced = false;
		this.setStatus('disconnected');
		if (event.code === 4000 && !this.resetting) {
			this.resetting = true;
			this.emit('reset', { reason: 'server', resetAt: Date.now() });
		}
		this.emit('close', { event });
	}

	/**
	 * Emits a transport error for the demo UI.
	 *
	 * @param {Event} event Browser WebSocket error event.
	 * @returns {void}
	 */
	handleSocketError(event) {
		this.emit('error', { event });
	}

	/**
	 * Applies a server control message.
	 *
	 * @param {string} rawMessage JSON message.
	 * @returns {void}
	 */
	handleJsonMessage(rawMessage) {
		let message;
		try {
			message = JSON.parse(rawMessage);
		} catch {
			return;
		}
		if (message.type === 'welcome') {
			this.user = message.user || null;
			this.shouldInitialize = Boolean(message.shouldInitialize);
			this.expiresAt = Number.isFinite(message.expiresAt) ? message.expiresAt : null;
			if (this.user) this.awareness.setLocalStateField('user', this.user);
			this.emit('user', this.user);
			return;
		}
		if (message.type === 'presence') {
			this.syncPresence(Array.isArray(message.users) ? message.users : []);
			return;
		}
		if (message.type === 'initialize') {
			this.shouldInitialize = true;
			this.emit('initialize');
			return;
		}
		if (message.type === 'reset') {
			this.resetting = true;
			this.emit('reset', {
				reason: message.reason || 'server',
				resetAt: Number.isFinite(message.resetAt) ? message.resetAt : Date.now(),
			});
		}
	}

	/**
	 * Updates active users and removes awareness states for disconnected guests.
	 *
	 * @param {Array<Record<string, unknown>>} users Server presence list.
	 * @returns {void}
	 */
	syncPresence(users) {
		this.users = users;
		const activeUserIds = new Set(users.map(getUserId).filter(Boolean));
		const staleClientIds = [];
		for (const [clientId, state] of this.awareness.getStates()) {
			if (clientId === this.document.clientID) continue;
			if (state?.user?.id && !activeUserIds.has(String(state.user.id))) staleClientIds.push(clientId);
		}
		if (staleClientIds.length) removeAwarenessStates(this.awareness, staleClientIds, this);
		this.emit('presence', { users });
		this.announceAwareness();
	}

	/**
	 * Re-announces local awareness so newly connected clients receive existing users.
	 *
	 * @returns {void}
	 */
	announceAwareness() {
		const localState = this.awareness.getLocalState();
		if (localState) this.awareness.setLocalState({ ...localState });
	}

	/**
	 * Removes all remote caret and selection states.
	 *
	 * @returns {void}
	 */
	removeRemoteAwareness() {
		const remoteClientIds = [];
		for (const clientId of this.awareness.getStates().keys()) {
			if (clientId !== this.document.clientID) remoteClientIds.push(clientId);
		}
		if (remoteClientIds.length) removeAwarenessStates(this.awareness, remoteClientIds, this);
	}

	/**
	 * Sends a framed binary message while the socket is open.
	 *
	 * @param {number} messageType Demo protocol message type.
	 * @param {Uint8Array} payload Message payload.
	 * @returns {void}
	 */
	sendBinary(messageType, payload) {
		if (this.socket?.readyState !== WebSocket.OPEN) return;
		this.socket.send(createBinaryMessage(messageType, payload));
	}

	/**
	 * Stores and emits a connection status change.
	 *
	 * @param {string} status Connection status.
	 * @returns {void}
	 */
	setStatus(status) {
		if (status === this.status) return;
		this.status = status;
		this.emit('status', { status });
	}
}

/**
 * Resolves the collaboration endpoint for the current page origin.
 *
 * @param {string} [path] WebSocket path.
 * @returns {string} Absolute ws or wss URL.
 */
export function resolveDocumentEditorSocketUrl(path = DEFAULT_PATH) {
	if (typeof window === 'undefined') return `ws://localhost${path}`;
	const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	return `${protocol}//${window.location.host}${path}`;
}

/**
 * Returns a stable user id string from a presence record.
 *
 * @param {Record<string, unknown>} user Presence user.
 * @returns {string} User id.
 */
function getUserId(user) {
	return String(user?.id || '');
}

/**
 * Prefixes a binary payload with the demo protocol message type.
 *
 * @param {number} messageType Protocol message type.
 * @param {Uint8Array} payload Binary payload.
 * @returns {Uint8Array} Framed message.
 */
function createBinaryMessage(messageType, payload) {
	const message = new Uint8Array(payload.length + 1);
	message[0] = messageType;
	message.set(payload, 1);
	return message;
}

/**
 * Converts a browser WebSocket binary payload to a Uint8Array.
 *
 * @param {ArrayBuffer|Blob|ArrayBufferView} data Browser binary payload.
 * @returns {Promise<Uint8Array>} Binary view.
 */
async function browserDataToUint8Array(data) {
	if (data instanceof Blob) return new Uint8Array(await data.arrayBuffer());
	if (data instanceof ArrayBuffer) return new Uint8Array(data);
	return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}
