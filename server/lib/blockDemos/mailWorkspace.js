const filterOptions = [
	{ value: 'all', label: 'All mail', description: 'Every conversation in this folder.' },
	{ value: 'unread', label: 'Unread', description: 'Conversations that still need attention.' },
	{ value: 'starred', label: 'Starred', description: 'Important conversations saved for follow-up.' },
];

const snoozeOptions = [
	{ value: 'later-today', label: 'Later today', description: 'Return to the inbox at 17:00.' },
	{ value: 'tomorrow', label: 'Tomorrow morning', description: 'Return tomorrow at 09:00.' },
	{ value: 'next-week', label: 'Next Monday', description: 'Return at 09:00 next Monday.' },
];

const labels = [
	{ value: 'vip', label: 'VIP', tone: 'warning' },
	{ value: 'finance', label: 'Finance', tone: 'success' },
	{ value: 'product', label: 'Product', tone: 'info' },
	{ value: 'launch', label: 'Launch', tone: 'neutral' },
];

const contacts = [
	{ value: 'maya@northstar.example', label: 'Maya Chen', description: 'maya@northstar.example' },
	{ value: 'leo@northstar.example', label: 'Leo Grant', description: 'leo@northstar.example' },
	{ value: 'product-ops@gettempo.example', label: 'Product Ops', description: 'product-ops@gettempo.example' },
	{ value: 'jules@studio.example', label: 'Jules Kim', description: 'jules@studio.example' },
];

const threads = new Map([
	createSeedThread({
		id: 'northstar-renewal',
		subject: 'Contract renewal timing',
		folder: 'inbox',
		unread: true,
		starred: true,
		labelIds: ['vip', 'finance'],
		updatedAt: '2026-08-01T14:42:00.000Z',
		participants: [
			createParticipant('Maya Chen', 'maya@northstar.example', 'MC'),
			createParticipant('Leo Grant', 'leo@northstar.example', 'LG'),
		],
		messages: [
			createMessage('northstar-1', 'Maya Chen', 'maya@northstar.example', false, 'Hi Nora, we are ready to renew, but Finance needs the final seat count before Friday. Could we hold the current price until then?', '2026-08-01T13:58:00.000Z'),
			createMessage('northstar-2', 'Nora Bell', 'nora@gettempo.example', true, 'Absolutely. I have held your current rate through Friday and attached the updated 80-seat estimate for review.', '2026-08-01T14:16:00.000Z'),
			createMessage('northstar-3', 'Maya Chen', 'maya@northstar.example', false, 'Perfect, thank you. I will send the confirmed seat count tomorrow morning.', '2026-08-01T14:42:00.000Z'),
		],
	}),
	createSeedThread({
		id: 'launch-checklist',
		subject: 'Launch checklist · final owners',
		folder: 'inbox',
		unread: false,
		starred: false,
		labelIds: ['launch', 'product'],
		updatedAt: '2026-08-01T12:18:00.000Z',
		participants: [createParticipant('Product Ops', 'product-ops@gettempo.example', 'PO')],
		messages: [
			createMessage('launch-1', 'Product Ops', 'product-ops@gettempo.example', false, 'The launch checklist is down to three open owners: lifecycle email, billing FAQ, and the support escalation runbook.', '2026-08-01T12:18:00.000Z'),
		],
	}),
	createSeedThread({
		id: 'keyboard-feedback',
		subject: 'Design feedback: keyboard shortcuts',
		folder: 'inbox',
		unread: true,
		starred: false,
		labelIds: ['product'],
		updatedAt: '2026-08-01T10:44:00.000Z',
		participants: [createParticipant('Jules Kim', 'jules@studio.example', 'JK')],
		messages: [
			createMessage('keyboard-1', 'Jules Kim', 'jules@studio.example', false, 'The new shortcut overlay is much clearer. I would expose archive and snooze in the first group, then keep navigation commands beneath them.', '2026-08-01T10:44:00.000Z'),
		],
	}),
	createSeedThread({
		id: 'quarterly-invoice',
		subject: 'Quarterly invoice approved',
		folder: 'archive',
		unread: false,
		starred: false,
		labelIds: ['finance'],
		updatedAt: '2026-07-31T16:22:00.000Z',
		participants: [createParticipant('Alex Morgan', 'alex@ledger.example', 'AM')],
		messages: [
			createMessage('invoice-1', 'Alex Morgan', 'alex@ledger.example', false, 'The quarterly invoice has been approved and queued for payment.', '2026-07-31T16:22:00.000Z'),
		],
	}),
	createSeedThread({
		id: 'welcome-follow-up',
		subject: 'Welcome follow-up',
		folder: 'sent',
		unread: false,
		starred: false,
		labelIds: [],
		updatedAt: '2026-07-31T11:05:00.000Z',
		participants: [createParticipant('Sam Rivera', 'sam@acme.example', 'SR')],
		messages: [
			createMessage('welcome-1', 'Nora Bell', 'nora@gettempo.example', true, 'Thanks for joining Tempo. Reply here if you would like a hand setting up your first shared inbox.', '2026-07-31T11:05:00.000Z'),
		],
	}),
	createSeedThread({
		id: 'partnership-draft',
		subject: 'Partnership follow-up',
		folder: 'drafts',
		unread: false,
		starred: false,
		labelIds: [],
		updatedAt: '2026-07-30T15:30:00.000Z',
		participants: [createParticipant('Leo Grant', 'leo@northstar.example', 'LG')],
		messages: [
			createMessage('draft-1', 'Nora Bell', 'nora@gettempo.example', true, 'Leo, here is the partnership outline we discussed. I have left the launch date open until the legal review is complete.', '2026-07-30T15:30:00.000Z', true),
		],
	}),
].map((thread) => [thread.id, thread]));

const undoTokens = new Map();
let threadSequence = 4200;
let messageSequence = 8400;

/**
 * Returns the complete mail workspace navigation and thread summaries.
 *
 * @returns {{ folders: Array<object>, threads: Array<object>, filterOptions: Array<object>, snoozeOptions: Array<object>, labels: Array<object>, contacts: Array<object>, currentUser: object }} Mail workspace payload.
 */
export function getMailWorkspace() {
	return {
		folders: createFolders(),
		threads: [...threads.values()].sort(sortByUpdatedAt).map(serializeThreadSummary),
		filterOptions: cloneValue(filterOptions),
		snoozeOptions: cloneValue(snoozeOptions),
		labels: cloneValue(labels),
		contacts: cloneValue(contacts),
		currentUser: {
			name: 'Nora Bell',
			email: 'nora@gettempo.example',
			initials: 'NB',
		},
	};
}

/**
 * Returns a single mail thread with its complete message history.
 *
 * @param {string} threadId Thread identifier.
 * @returns {{ thread?: object, error?: string, status?: number }} Thread result.
 */
export function getMailThread(threadId) {
	const thread = findThread(threadId);
	if (!thread) return notFound();
	return { thread: serializeThread(thread) };
}

/**
 * Updates mutable thread state with an optimistic revision check.
 *
 * @param {string} threadId Thread identifier.
 * @param {Record<string, unknown>} input Thread state mutation.
 * @returns {{ thread?: object, error?: string, status?: number }} Updated thread or API error.
 */
export function updateMailThreadState(threadId, input = {}) {
	const thread = findThread(threadId);
	if (!thread) return notFound();
	const revisionError = validateRevision(thread, input.revision);
	if (revisionError) return revisionError;
	let changed = false;

	if (input.unread !== undefined) {
		thread.unread = Boolean(input.unread);
		changed = true;
	}
	if (input.starred !== undefined) {
		thread.starred = Boolean(input.starred);
		changed = true;
	}
	if (input.labels !== undefined) {
		if (!Array.isArray(input.labels) || input.labels.some((labelId) => !labels.some((label) => label.value === labelId))) {
			return { error: 'Choose labels from the available workspace labels.', status: 422 };
		}
		thread.labelIds = [...new Set(input.labels.map(String))];
		changed = true;
	}
	if (!changed) return { error: 'No thread state was supplied.', status: 422 };
	touchThread(thread);
	return { thread: serializeThread(thread) };
}

/**
 * Archives a thread and returns a one-use token for undo.
 *
 * @param {string} threadId Thread identifier.
 * @param {Record<string, unknown>} input Archive request.
 * @returns {{ thread?: object, undoToken?: string, error?: string, status?: number }} Archive result.
 */
export function archiveMailThread(threadId, input = {}) {
	const thread = findThread(threadId);
	if (!thread) return notFound();
	const revisionError = validateRevision(thread, input.revision);
	if (revisionError) return revisionError;
	const previousFolder = thread.folder;
	const undoToken = `undo-${thread.id}-${Date.now()}`;
	undoTokens.set(undoToken, { threadId: thread.id, previousFolder });
	thread.folder = 'archive';
	thread.snoozedUntil = null;
	touchThread(thread);
	return { thread: serializeThread(thread), undoToken };
}

/**
 * Restores a recently archived thread by consuming its undo token.
 *
 * @param {string} threadId Thread identifier.
 * @param {Record<string, unknown>} input Restore request.
 * @returns {{ thread?: object, error?: string, status?: number }} Restore result.
 */
export function restoreMailThread(threadId, input = {}) {
	const thread = findThread(threadId);
	if (!thread) return notFound();
	const entry = undoTokens.get(String(input.undoToken || ''));
	if (!entry || entry.threadId !== thread.id) return { error: 'This archive action can no longer be undone.', status: 409 };
	thread.folder = entry.previousFolder;
	undoTokens.delete(String(input.undoToken));
	touchThread(thread);
	return { thread: serializeThread(thread) };
}

/**
 * Snoozes a thread until a supported schedule and removes it from the inbox.
 *
 * @param {string} threadId Thread identifier.
 * @param {Record<string, unknown>} input Snooze request.
 * @returns {{ thread?: object, error?: string, status?: number }} Snooze result.
 */
export function snoozeMailThread(threadId, input = {}) {
	const thread = findThread(threadId);
	if (!thread) return notFound();
	const revisionError = validateRevision(thread, input.revision);
	if (revisionError) return revisionError;
	if (!snoozeOptions.some((option) => option.value === input.schedule)) return { error: 'Choose a supported snooze time.', status: 422 };
	thread.folder = 'snoozed';
	thread.snoozedUntil = resolveSnoozeTime(String(input.schedule));
	touchThread(thread);
	return { thread: serializeThread(thread) };
}

/**
 * Appends a reply from the current operator to a thread.
 *
 * @param {string} threadId Thread identifier.
 * @param {Record<string, unknown>} input Reply payload.
 * @returns {{ thread?: object, error?: string, status?: number }} Reply result.
 */
export function replyToMailThread(threadId, input = {}) {
	const thread = findThread(threadId);
	if (!thread) return notFound();
	const revisionError = validateRevision(thread, input.revision);
	if (revisionError) return revisionError;
	const body = normalizeText(input.body, 5000);
	if (!body) return { error: 'Write a reply before sending.', status: 422 };
	messageSequence += 1;
	const createdAt = new Date().toISOString();
	thread.messages.push(createMessage(`message-${messageSequence}`, 'Nora Bell', 'nora@gettempo.example', true, body, createdAt));
	thread.folder = thread.folder === 'drafts' ? 'sent' : thread.folder;
	thread.unread = false;
	thread.updatedAt = createdAt;
	touchThread(thread, false);
	return { thread: serializeThread(thread) };
}

/**
 * Sends a new conversation or persists it as a draft.
 *
 * @param {Record<string, unknown>} input Compose request.
 * @returns {{ thread?: object, error?: string, status?: number }} Compose result.
 */
export function composeMailThread(input = {}) {
	const action = input.action === 'draft' ? 'draft' : 'send';
	const recipients = Array.isArray(input.recipients) ? [...new Set(input.recipients.map((value) => String(value).trim()).filter(Boolean))] : [];
	const subject = normalizeText(input.subject, 120);
	const body = normalizeText(input.body, 5000);
	if (action === 'send' && !recipients.length) return { error: 'Add at least one recipient.', status: 422 };
	if (recipients.some((email) => !isEmail(email))) return { error: 'Use a valid email address for every recipient.', status: 422 };
	if (action === 'send' && !subject) return { error: 'Add a subject before sending.', status: 422 };
	if (!body) return { error: action === 'draft' ? 'Write something before saving this draft.' : 'Write a message before sending.', status: 422 };

	threadSequence += 1;
	messageSequence += 1;
	const createdAt = new Date().toISOString();
	const participantRecords = recipients.map((email) => contactForEmail(email));
	const thread = createSeedThread({
		id: `mail-${threadSequence}`,
		subject: subject || '(No subject)',
		folder: action === 'draft' ? 'drafts' : 'sent',
		unread: false,
		starred: false,
		labelIds: [],
		updatedAt: createdAt,
		participants: participantRecords.length ? participantRecords : [createParticipant('Unaddressed draft', '', 'UD')],
		messages: [createMessage(`message-${messageSequence}`, 'Nora Bell', 'nora@gettempo.example', true, body, createdAt, action === 'draft')],
	});
	threads.set(thread.id, thread);
	return { thread: serializeThread(thread) };
}

/**
 * Creates a seed thread with normalized mutable state.
 *
 * @param {Record<string, unknown>} values Seed values.
 * @returns {object} Mail thread record.
 */
function createSeedThread(values) {
	return {
		revision: 1,
		snoozedUntil: null,
		...values,
		labelIds: [...(values.labelIds || [])],
		participants: cloneValue(values.participants || []),
		messages: cloneValue(values.messages || []),
	};
}

/**
 * Creates one participant record.
 *
 * @param {string} name Participant name.
 * @param {string} email Participant email.
 * @param {string} initials Participant initials.
 * @returns {object} Participant record.
 */
function createParticipant(name, email, initials) {
	return { name, email, initials };
}

/**
 * Creates one message record.
 *
 * @param {string} id Message identifier.
 * @param {string} from Sender name.
 * @param {string} email Sender email.
 * @param {boolean} own Whether the message belongs to the current user.
 * @param {string} body Message body.
 * @param {string} createdAt ISO timestamp.
 * @param {boolean} [draft=false] Whether the message is an unsent draft.
 * @returns {object} Message record.
 */
function createMessage(id, from, email, own, body, createdAt, draft = false) {
	return { id, from, email, own, body, createdAt, draft };
}

/**
 * Returns a mail thread by identifier.
 *
 * @param {string} threadId Thread identifier.
 * @returns {object|null} Matching thread or null.
 */
function findThread(threadId) {
	return threads.get(String(threadId || '')) || null;
}

/**
 * Produces dynamic navigation folders and message counts.
 *
 * @returns {Array<object>} Folder navigation records.
 */
function createFolders() {
	return [
		{ id: 'inbox', label: 'Inbox', count: countFolder('inbox'), icon: 'M4 6h16v12H4V6Zm0 0 8 7 8-7' },
		{ id: 'starred', label: 'Starred', count: [...threads.values()].filter((thread) => thread.starred).length, icon: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2-4.5-4.4 6.2-.9L12 3Z' },
		{ id: 'snoozed', label: 'Snoozed', count: countFolder('snoozed'), icon: 'M12 7v5l3 2M5 4l2 2M19 4l-2 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z' },
		{ id: 'sent', label: 'Sent', count: countFolder('sent'), icon: 'm4 12 16-8-6 16-2-7-8-1Zm8 1 8-9' },
		{ id: 'drafts', label: 'Drafts', count: countFolder('drafts'), icon: 'M5 4h10l4 4v12H5V4Zm10 0v4h4M8 12h8M8 16h5' },
		{ id: 'archive', label: 'Archive', count: countFolder('archive'), icon: 'M4 7h16v13H4V7Zm-1-3h18v3H3V4Zm6 7h6' },
	];
}

/**
 * Counts threads in one folder.
 *
 * @param {string} folder Folder identifier.
 * @returns {number} Thread count.
 */
function countFolder(folder) {
	return [...threads.values()].filter((thread) => thread.folder === folder).length;
}

/**
 * Serializes a thread for the list view.
 *
 * @param {object} thread Thread record.
 * @returns {object} Thread summary.
 */
function serializeThreadSummary(thread) {
	const latestMessage = thread.messages[thread.messages.length - 1] || {};
	return {
		id: thread.id,
		revision: thread.revision,
		subject: thread.subject,
		folder: thread.folder,
		unread: thread.unread,
		starred: thread.starred,
		labels: thread.labelIds.map(labelForId).filter(Boolean),
		participants: cloneValue(thread.participants),
		preview: latestMessage.body || '',
		updatedAt: thread.updatedAt,
		snoozedUntil: thread.snoozedUntil,
	};
}

/**
 * Serializes a complete thread for the reader.
 *
 * @param {object} thread Thread record.
 * @returns {object} Complete thread payload.
 */
function serializeThread(thread) {
	return {
		...serializeThreadSummary(thread),
		messages: cloneValue(thread.messages),
	};
}

/**
 * Returns a label record for an identifier.
 *
 * @param {string} labelId Label identifier.
 * @returns {object|null} Matching label or null.
 */
function labelForId(labelId) {
	return labels.find((label) => label.value === labelId) || null;
}

/**
 * Creates a participant from a known or custom email address.
 *
 * @param {string} email Participant email.
 * @returns {object} Participant record.
 */
function contactForEmail(email) {
	const contact = contacts.find((item) => item.value === email);
	if (contact) return createParticipant(contact.label, contact.value, initialsForName(contact.label));
	const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
	return createParticipant(name, email, initialsForName(name));
}

/**
 * Derives short initials from a display name.
 *
 * @param {string} name Display name.
 * @returns {string} Up to two initials.
 */
function initialsForName(name) {
	return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '??';
}

/**
 * Converts a snooze preset into a deterministic ISO timestamp.
 *
 * @param {string} schedule Snooze preset.
 * @returns {string} ISO timestamp.
 */
function resolveSnoozeTime(schedule) {
	const base = new Date();
	if (schedule === 'later-today') {
		base.setHours(17, 0, 0, 0);
		if (base.getTime() <= Date.now()) base.setDate(base.getDate() + 1);
		return base.toISOString();
	}
	if (schedule === 'tomorrow') {
		base.setDate(base.getDate() + 1);
		base.setHours(9, 0, 0, 0);
		return base.toISOString();
	}
	const daysUntilMonday = ((8 - base.getDay()) % 7) || 7;
	base.setDate(base.getDate() + daysUntilMonday);
	base.setHours(9, 0, 0, 0);
	return base.toISOString();
}

/**
 * Validates a client revision against server state.
 *
 * @param {object} thread Thread record.
 * @param {unknown} revision Client revision.
 * @returns {{ error: string, status: number }|null} Conflict response or null.
 */
function validateRevision(thread, revision) {
	if (Number(revision) === thread.revision) return null;
	return { error: 'This conversation changed in another view. Reload it and try again.', status: 409 };
}

/**
 * Advances thread revision and update time.
 *
 * @param {object} thread Thread record.
 * @param {boolean} [updateTimestamp=true] Whether to update the message ordering timestamp.
 * @returns {void}
 */
function touchThread(thread, updateTimestamp = true) {
	thread.revision += 1;
	if (updateTimestamp) thread.updatedAt = new Date().toISOString();
}

/**
 * Sorts thread records with the most recently updated first.
 *
 * @param {object} left Left record.
 * @param {object} right Right record.
 * @returns {number} Sort comparator result.
 */
function sortByUpdatedAt(left, right) {
	return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}

/**
 * Returns a conventional missing-thread error.
 *
 * @returns {{ error: string, status: number }} Not-found result.
 */
function notFound() {
	return { error: 'Mail thread not found.', status: 404 };
}

/**
 * Normalizes user-supplied text for demo storage.
 *
 * @param {unknown} value Candidate text.
 * @param {number} maxLength Maximum retained length.
 * @returns {string} Trimmed text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').trim().slice(0, maxLength);
}

/**
 * Validates a practical email address shape for the demo API.
 *
 * @param {string} value Candidate email.
 * @returns {boolean} Whether the email is usable.
 */
function isEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

/**
 * Deep-clones JSON-compatible demo data.
 *
 * @template T
 * @param {T} value Value to clone.
 * @returns {T} Independent clone.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}
