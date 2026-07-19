import { WebSocket, WebSocketServer } from 'ws';
import * as Y from 'yjs';

const DEFAULT_PATH = '/ws/document-editor';
const DEFAULT_ROOM = 'document-editor-demo';
const DEFAULT_ROOM_TTL_MS = 15 * 60 * 1000;
const DEFAULT_HEARTBEAT_INTERVAL_MS = 30 * 1000;
const DEFAULT_RATE_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_PAYLOAD_BYTES = 64 * 1024;
const DEFAULT_MAX_BUFFERED_AMOUNT_BYTES = 512 * 1024;
const DEFAULT_MAX_BYTES_PER_MINUTE = 2 * 1024 * 1024;
const DEFAULT_MAX_ROOM_BYTES = 8 * 1024 * 1024;
const DEFAULT_MAX_CONNECTIONS = 24;
const DEFAULT_MAX_MESSAGES_PER_MINUTE = 1200;
const MESSAGE_DOCUMENT_UPDATE = 0;
const MESSAGE_AWARENESS_UPDATE = 1;
const GUEST_NAMES = [
	'Amber Fox',
	'Blue Heron',
	'Cedar Finch',
	'Dusky Robin',
	'Ember Wren',
	'Forest Lark',
	'Golden Swift',
	'Harbour Tern',
];
const GUEST_COLORS = [
	'#b45309',
	'#2563eb',
	'#0f766e',
	'#7c3aed',
	'#be123c',
	'#15803d',
	'#c2410c',
	'#0369a1',
];

/**
 * Installs the hardened, anonymous document-editor demo endpoint.
 *
 * The endpoint exposes one fixed in-memory room, accepts same-origin browser
 * connections, and deliberately discards the room every 15 minutes or after
 * its last client leaves. It is a constrained product demo, not a persistence
 * or authentication boundary.
 *
 * @param {import('node:http').Server} httpServer Existing application HTTP server.
 * @param {{
 * 	path?: string,
 * 	room?: string,
 * 	allowedOrigins?: string[],
 * 	roomTtlMs?: number,
 * 	heartbeatIntervalMs?: number,
 * 	rateWindowMs?: number,
 * 	maxPayload?: number,
 * 	maxBufferedAmount?: number,
 * 	maxBytesPerMinute?: number,
 * 	maxRoomBytes?: number,
 * 	maxConnections?: number,
 * 	maxMessagesPerMinute?: number,
 * }} [options] Demo endpoint limits.
 * @returns {{ close: () => Promise<void>, path: string }} Collaboration server controls.
 */
export function installDocumentEditorCollaborationServer(httpServer, options = {}) {
	const socketPath = options.path || DEFAULT_PATH;
	const roomName = options.room || DEFAULT_ROOM;
	const roomTtlMs = options.roomTtlMs || DEFAULT_ROOM_TTL_MS;
	const heartbeatIntervalMs = options.heartbeatIntervalMs || DEFAULT_HEARTBEAT_INTERVAL_MS;
	const rateWindowMs = options.rateWindowMs || DEFAULT_RATE_WINDOW_MS;
	const maxPayload = options.maxPayload || DEFAULT_MAX_PAYLOAD_BYTES;
	const maxBufferedAmount = options.maxBufferedAmount || DEFAULT_MAX_BUFFERED_AMOUNT_BYTES;
	const maxBytesPerMinute = options.maxBytesPerMinute || DEFAULT_MAX_BYTES_PER_MINUTE;
	const maxRoomBytes = options.maxRoomBytes || DEFAULT_MAX_ROOM_BYTES;
	const maxConnections = options.maxConnections || DEFAULT_MAX_CONNECTIONS;
	const maxMessagesPerMinute = options.maxMessagesPerMinute || DEFAULT_MAX_MESSAGES_PER_MINUTE;
	const allowedOrigins = new Set((options.allowedOrigins || []).map(normalizeOrigin).filter(Boolean));
	const rooms = new Map();
	const webSocketServer = new WebSocketServer({
		noServer: true,
		maxPayload,
	});
	let guestCounter = 0;

	/**
	 * Returns the active room or creates a fresh disposable room.
	 *
	 * @returns {ReturnType<typeof createRoom>} Active room state.
	 */
	function getOrCreateRoom() {
		const existingRoom = rooms.get(roomName);
		if (existingRoom && !existingRoom.closed) return existingRoom;
		const room = createRoom(roomName, Date.now() + roomTtlMs);
		rooms.set(roomName, room);
		room.expirationTimer = setTimeout(handleRoomExpiration, roomTtlMs, room);
		room.expirationTimer.unref?.();
		return room;
	}

	/**
	 * Handles only the collaboration endpoint and leaves other upgrades to Vite HMR.
	 *
	 * @param {import('node:http').IncomingMessage} request Upgrade request.
	 * @param {import('node:stream').Duplex} socket Upgrade socket.
	 * @param {Buffer} head First upgrade packet.
	 * @returns {void}
	 */
	function handleUpgrade(request, socket, head) {
		const requestUrl = parseRequestUrl(request);
		if (!requestUrl || requestUrl.pathname !== socketPath) return;
		if (!isAllowedOrigin(request, allowedOrigins)) {
			rejectUpgrade(socket, 403, 'Forbidden');
			return;
		}
		const room = rooms.get(roomName);
		if (room && !room.closed && room.clients.size >= maxConnections) {
			rejectUpgrade(socket, 503, 'Demo room is full');
			return;
		}
		webSocketServer.handleUpgrade(request, socket, head, handleUpgradeComplete);
	}

	/**
	 * Emits a normal WebSocket connection after a successful protocol upgrade.
	 *
	 * @param {import('ws').WebSocket} socket Connected WebSocket.
	 * @param {import('node:http').IncomingMessage} request Upgrade request.
	 * @returns {void}
	 */
	function handleUpgradeComplete(socket, request) {
		webSocketServer.emit('connection', socket, request);
	}

	/**
	 * Adds a newly connected browser to the single ephemeral collaboration room.
	 *
	 * @param {import('ws').WebSocket} socket Connected WebSocket.
	 * @returns {void}
	 */
	function handleConnection(socket) {
		const room = getOrCreateRoom();
		if (room.clients.size >= maxConnections) {
			socket.close(1013, 'Demo room is full');
			return;
		}
		guestCounter += 1;
		const user = createGuestUser(guestCounter);
		const shouldInitialize = assignInitializer(room, socket);
		const client = {
			user,
			isAlive: true,
			windowStartedAt: Date.now(),
			messagesInWindow: 0,
			bytesInWindow: 0,
		};

		room.clients.set(socket, client);
		sendJson(socket, {
			type: 'welcome',
			user,
			room: room.name,
			shouldInitialize,
			expiresAt: room.expiresAt,
		}, maxBufferedAmount);
		sendBinary(socket, createBinaryMessage(MESSAGE_DOCUMENT_UPDATE, Y.encodeStateAsUpdate(room.document)), maxBufferedAmount);
		broadcastPresence(room, maxBufferedAmount);

		/**
		 * Applies a client document update or relays a transient awareness update.
		 *
		 * @param {import('ws').RawData} data WebSocket payload.
		 * @param {boolean} isBinary Whether the payload is binary.
		 * @returns {void}
		 */
		function handleMessage(data, isBinary) {
			if (room.closed) return;
			if (!isBinary) {
				socket.close(1003, 'Binary messages only');
				return;
			}
			const message = rawDataToUint8Array(data);
			if (!consumeClientAllowance(client, message.byteLength, {
				rateWindowMs,
				maxMessagesPerMinute,
				maxBytesPerMinute,
			})) {
				socket.close(1008, 'Demo usage limit exceeded');
				return;
			}
			if (message.length < 2) {
				socket.close(1007, 'Malformed collaboration message');
				return;
			}
			room.receivedBytes += message.byteLength;
			if (room.receivedBytes > maxRoomBytes) {
				resetRoom(room, 'capacity');
				return;
			}
			const messageType = message[0];
			const payload = message.subarray(1);
			if (messageType === MESSAGE_DOCUMENT_UPDATE) {
				try {
					Y.applyUpdate(room.document, payload, socket);
					if (!isYDocumentEmpty(room.document)) room.initializer = null;
					broadcastBinary(room, createBinaryMessage(messageType, payload), socket, maxBufferedAmount);
				} catch {
					socket.close(1007, 'Invalid document update');
				}
				return;
			}
			if (messageType === MESSAGE_AWARENESS_UPDATE) {
				broadcastBinary(room, createBinaryMessage(messageType, payload), socket, maxBufferedAmount);
				return;
			}
			socket.close(1003, 'Unsupported collaboration message');
		}

		/**
		 * Marks the client alive after a heartbeat response.
		 *
		 * @returns {void}
		 */
		function handlePong() {
			client.isAlive = true;
		}

		/**
		 * Prevents transport errors from becoming uncaught process errors.
		 *
		 * @returns {void}
		 */
		function handleSocketError() {
			client.isAlive = false;
		}

		/**
		 * Removes a disconnected client and destroys an empty room.
		 *
		 * @returns {void}
		 */
		function handleClose() {
			room.clients.delete(socket);
			if (room.closed) return;
			if (room.clients.size === 0) {
				disposeRoom(room);
				return;
			}
			if (room.initializer === socket && isYDocumentEmpty(room.document)) {
				room.initializer = null;
				const nextSocket = room.clients.keys().next().value;
				if (nextSocket) {
					room.initializer = nextSocket;
					sendJson(nextSocket, { type: 'initialize' }, maxBufferedAmount);
				}
			}
			broadcastPresence(room, maxBufferedAmount);
		}

		socket.on('message', handleMessage);
		socket.on('pong', handlePong);
		socket.on('error', handleSocketError);
		socket.once('close', handleClose);
	}

	/**
	 * Resets a room when its disposable lifetime expires.
	 *
	 * @param {ReturnType<typeof createRoom>} room Expired room.
	 * @returns {void}
	 */
	function handleRoomExpiration(room) {
		resetRoom(room, 'scheduled');
	}

	/**
	 * Notifies connected pages and discards all collaboration state.
	 *
	 * @param {ReturnType<typeof createRoom>} room Room to reset.
	 * @param {string} reason Reset reason.
	 * @returns {void}
	 */
	function resetRoom(room, reason) {
		if (room.closed) return;
		room.closed = true;
		clearTimeout(room.expirationTimer);
		if (rooms.get(room.name) === room) rooms.delete(room.name);
		for (const socket of room.clients.keys()) {
			sendJson(socket, {
				type: 'reset',
				reason,
				resetAt: Date.now(),
			}, maxBufferedAmount);
			socket.close(4000, 'Temporary demo document reset');
		}
		room.document.destroy();
	}

	/**
	 * Discards an empty room without sending a reset notification.
	 *
	 * @param {ReturnType<typeof createRoom>} room Empty room.
	 * @returns {void}
	 */
	function disposeRoom(room) {
		if (room.closed) return;
		room.closed = true;
		clearTimeout(room.expirationTimer);
		if (rooms.get(room.name) === room) rooms.delete(room.name);
		room.document.destroy();
	}

	/**
	 * Pings healthy clients and terminates clients that missed the prior heartbeat.
	 *
	 * @returns {void}
	 */
	function runHeartbeat() {
		for (const room of rooms.values()) {
			for (const [socket, client] of room.clients) {
				if (!client.isAlive) {
					socket.terminate();
					continue;
				}
				client.isAlive = false;
				socket.ping();
			}
		}
	}

	const heartbeatTimer = setInterval(runHeartbeat, heartbeatIntervalMs);
	heartbeatTimer.unref?.();

	httpServer.on('upgrade', handleUpgrade);
	webSocketServer.on('connection', handleConnection);

	/**
	 * Closes collaboration sockets without stopping the parent HTTP server.
	 *
	 * @returns {Promise<void>} Resolves when the WebSocket server is closed.
	 */
	async function close() {
		httpServer.off('upgrade', handleUpgrade);
		clearInterval(heartbeatTimer);
		for (const room of rooms.values()) {
			room.closed = true;
			clearTimeout(room.expirationTimer);
			for (const socket of room.clients.keys()) socket.terminate();
			room.document.destroy();
		}
		rooms.clear();
		await closeWebSocketServer(webSocketServer);
	}

	return {
		close,
		path: socketPath,
	};
}

/**
 * Creates an in-memory collaboration room.
 *
 * @param {string} name Fixed room identifier.
 * @param {number} expiresAt Unix timestamp at which the room resets.
 * @returns {{
 * 	name: string,
 * 	document: Y.Doc,
 * 	clients: Map<import('ws').WebSocket, Record<string, unknown>>,
 * 	initializer: import('ws').WebSocket|null,
 * 	expiresAt: number,
 * 	expirationTimer: ReturnType<typeof setTimeout>|null,
 * 	receivedBytes: number,
 * 	closed: boolean,
 * }} Room state.
 */
function createRoom(name, expiresAt) {
	return {
		name,
		document: new Y.Doc(),
		clients: new Map(),
		initializer: null,
		expiresAt,
		expirationTimer: null,
		receivedBytes: 0,
		closed: false,
	};
}

/**
 * Assigns one connected client to seed an empty document.
 *
 * @param {{ document: Y.Doc, initializer: import('ws').WebSocket|null }} room Room state.
 * @param {import('ws').WebSocket} socket Candidate initializer socket.
 * @returns {boolean} Whether this client should add the demo starter document.
 */
function assignInitializer(room, socket) {
	if (!isYDocumentEmpty(room.document) || room.initializer) return false;
	room.initializer = socket;
	return true;
}

/**
 * Checks whether a Yjs document contains any client updates.
 *
 * @param {Y.Doc} document Yjs document.
 * @returns {boolean} True when the document has no update state.
 */
function isYDocumentEmpty(document) {
	const stateVector = Y.encodeStateVector(document);
	return stateVector.length === 1 && stateVector[0] === 0;
}

/**
 * Creates a friendly, unique guest identity for a WebSocket connection.
 *
 * @param {number} index One-based server connection index.
 * @returns {{ id: string, name: string, color: string, type: string }} Guest identity.
 */
function createGuestUser(index) {
	const poolIndex = (index - 1) % GUEST_NAMES.length;
	const cycle = Math.floor((index - 1) / GUEST_NAMES.length);
	return {
		id: `document-editor-guest-${index}`,
		name: cycle ? `${GUEST_NAMES[poolIndex]} ${cycle + 1}` : GUEST_NAMES[poolIndex],
		color: GUEST_COLORS[poolIndex],
		type: 'human',
	};
}

/**
 * Parses an upgrade request URL against a local base.
 *
 * @param {import('node:http').IncomingMessage} request Upgrade request.
 * @returns {URL|null} Parsed URL, or null for malformed input.
 */
function parseRequestUrl(request) {
	try {
		return new URL(request.url || '/', 'http://localhost');
	} catch {
		return null;
	}
}

/**
 * Normalizes an explicitly configured origin for exact comparison.
 *
 * @param {string} origin Candidate origin.
 * @returns {string} Normalized origin, or an empty string when invalid.
 */
function normalizeOrigin(origin) {
	try {
		return new URL(origin).origin;
	} catch {
		return '';
	}
}

/**
 * Accepts an explicit allowlist or, by default, a browser from the request host.
 *
 * @param {import('node:http').IncomingMessage} request Upgrade request.
 * @param {Set<string>} allowedOrigins Optional exact origin allowlist.
 * @returns {boolean} Whether the handshake origin is allowed.
 */
function isAllowedOrigin(request, allowedOrigins) {
	const origin = typeof request.headers.origin === 'string' ? normalizeOrigin(request.headers.origin) : '';
	if (!origin) return false;
	if (allowedOrigins.size) return allowedOrigins.has(origin);
	try {
		const originUrl = new URL(origin);
		return ['http:', 'https:'].includes(originUrl.protocol) && originUrl.host === request.headers.host;
	} catch {
		return false;
	}
}

/**
 * Rejects an HTTP upgrade before a WebSocket connection is established.
 *
 * @param {import('node:stream').Duplex} socket Upgrade socket.
 * @param {number} statusCode HTTP status code.
 * @param {string} reason Short response reason.
 * @returns {void}
 */
function rejectUpgrade(socket, statusCode, reason) {
	if (!socket.writable) return;
	const body = `${reason}\n`;
	socket.end([
		`HTTP/1.1 ${statusCode} ${reason}`,
		'Connection: close',
		'Content-Type: text/plain; charset=utf-8',
		`Content-Length: ${Buffer.byteLength(body)}`,
		'',
		body,
	].join('\r\n'));
}

/**
 * Consumes one client's rolling message and byte allowance.
 *
 * @param {{ windowStartedAt: number, messagesInWindow: number, bytesInWindow: number }} client Client rate state.
 * @param {number} byteLength Incoming message size.
 * @param {{ rateWindowMs: number, maxMessagesPerMinute: number, maxBytesPerMinute: number }} limits Rate limits.
 * @returns {boolean} Whether this message remains inside the demo allowance.
 */
function consumeClientAllowance(client, byteLength, limits) {
	const now = Date.now();
	if (now - client.windowStartedAt >= limits.rateWindowMs) {
		client.windowStartedAt = now;
		client.messagesInWindow = 0;
		client.bytesInWindow = 0;
	}
	client.messagesInWindow += 1;
	client.bytesInWindow += byteLength;
	return client.messagesInWindow <= limits.maxMessagesPerMinute
		&& client.bytesInWindow <= limits.maxBytesPerMinute;
}

/**
 * Broadcasts the current server-assigned identities to every room client.
 *
 * @param {{ clients: Map<import('ws').WebSocket, { user: Record<string, unknown> }> }} room Room state.
 * @param {number} maxBufferedAmount Maximum allowed outbound buffer.
 * @returns {void}
 */
function broadcastPresence(room, maxBufferedAmount) {
	const users = Array.from(room.clients.values(), getClientUser);
	for (const socket of room.clients.keys()) sendJson(socket, { type: 'presence', users }, maxBufferedAmount);
}

/**
 * Returns the user from a room client record.
 *
 * @param {{ user: Record<string, unknown> }} client Client record.
 * @returns {Record<string, unknown>} Assigned user.
 */
function getClientUser(client) {
	return client.user;
}

/**
 * Broadcasts binary data to every open room socket except an optional sender.
 *
 * @param {{ clients: Map<import('ws').WebSocket, unknown> }} room Room state.
 * @param {Uint8Array} message Binary message.
 * @param {import('ws').WebSocket|null} excludedSocket Socket to exclude.
 * @param {number} maxBufferedAmount Maximum allowed outbound buffer.
 * @returns {void}
 */
function broadcastBinary(room, message, excludedSocket, maxBufferedAmount) {
	for (const socket of room.clients.keys()) {
		if (socket !== excludedSocket) sendBinary(socket, message, maxBufferedAmount);
	}
}

/**
 * Prefixes a Yjs or awareness payload with the demo protocol message type.
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
 * Sends JSON to an open WebSocket while protecting the process from slow clients.
 *
 * @param {import('ws').WebSocket} socket Target socket.
 * @param {Record<string, unknown>} payload JSON payload.
 * @param {number} maxBufferedAmount Maximum allowed outbound buffer.
 * @returns {boolean} Whether the payload was queued.
 */
function sendJson(socket, payload, maxBufferedAmount) {
	return sendPayload(socket, JSON.stringify(payload), false, maxBufferedAmount);
}

/**
 * Sends binary data to an open WebSocket while protecting the process from slow clients.
 *
 * @param {import('ws').WebSocket} socket Target socket.
 * @param {Uint8Array} payload Binary payload.
 * @param {number} maxBufferedAmount Maximum allowed outbound buffer.
 * @returns {boolean} Whether the payload was queued.
 */
function sendBinary(socket, payload, maxBufferedAmount) {
	return sendPayload(socket, payload, true, maxBufferedAmount);
}

/**
 * Queues an outbound message or closes a client whose write buffer is too large.
 *
 * @param {import('ws').WebSocket} socket Target socket.
 * @param {string|Uint8Array} payload Outbound payload.
 * @param {boolean} binary Whether the payload is binary.
 * @param {number} maxBufferedAmount Maximum allowed outbound buffer.
 * @returns {boolean} Whether the payload was queued.
 */
function sendPayload(socket, payload, binary, maxBufferedAmount) {
	if (socket.readyState !== WebSocket.OPEN) return false;
	if (socket.bufferedAmount > maxBufferedAmount) {
		socket.close(1013, 'Client is receiving too slowly');
		return false;
	}
	socket.send(payload, { binary });
	return true;
}

/**
 * Normalizes ws RawData into a Uint8Array without losing buffer offsets.
 *
 * @param {import('ws').RawData} data Raw WebSocket data.
 * @returns {Uint8Array} Binary view.
 */
function rawDataToUint8Array(data) {
	if (Array.isArray(data)) {
		const buffer = Buffer.concat(data);
		return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
	}
	if (data instanceof ArrayBuffer) return new Uint8Array(data);
	return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

/**
 * Closes a ws server and tolerates a server that never started listening itself.
 *
 * @param {WebSocketServer} webSocketServer WebSocket server.
 * @returns {Promise<void>} Resolves after close completes.
 */
function closeWebSocketServer(webSocketServer) {
	return new Promise((resolve) => {
		webSocketServer.close(resolve);
	});
}
