const catalogs = Object.freeze({
	views: [
		{ value: 'mine', label: 'My inbox', description: 'Open tickets assigned to Nora.' },
		{ value: 'all', label: 'All open', description: 'Every active support conversation.' },
		{ value: 'unassigned', label: 'Unassigned', description: 'Tickets waiting for a teammate.' },
		{ value: 'attention', label: 'Needs attention', description: 'Breached, urgent, or failed delivery.' },
		{ value: 'resolved', label: 'Resolved', description: 'Recently completed conversations.' },
	],
	assignees: [
		{ value: 'nora-bell', label: 'Nora Bell', description: 'Customer support · 4 active', initials: 'NB', tone: 'success' },
		{ value: 'maya-chen', label: 'Maya Chen', description: 'Technical support · 3 active', initials: 'MC', tone: 'info' },
		{ value: 'luca-reed', label: 'Luca Reed', description: 'Billing support · 2 active', initials: 'LR', tone: 'warning' },
		{ value: 'unassigned', label: 'Unassigned', description: 'Return this ticket to team triage.', initials: '—', tone: 'neutral' },
	],
	priorities: [
		{ value: 'urgent', label: 'Urgent', description: 'Customer blocked or SLA already breached.', tone: 'danger' },
		{ value: 'high', label: 'High', description: 'Resolve inside the current support shift.', tone: 'warning' },
		{ value: 'normal', label: 'Normal', description: 'Handle in the standard support queue.', tone: 'info' },
		{ value: 'low', label: 'Low', description: 'Useful follow-up without immediate impact.', tone: 'neutral' },
	],
	resolutionCodes: [
		{ value: 'solved', label: 'Solved', description: 'The customer has a verified path forward.' },
		{ value: 'guidance', label: 'Guidance provided', description: 'No product change was required.' },
		{ value: 'bug-linked', label: 'Bug linked', description: 'A tracked product issue owns the follow-up.' },
		{ value: 'billing-adjusted', label: 'Billing adjusted', description: 'A credit, refund, or invoice correction was recorded.' },
	],
});

let workspaceRevision = 1;
let messageSequence = 8500;
let receiptSequence = 4100;
let tickets = createSeedTickets();

/**
 * Returns the support queue, filter catalogs, and aggregate service health.
 *
 * @returns {Record<string, unknown>} Support-center workspace payload.
 */
export function getSupportCenterWorkspace() {
	return {
		workspaceRevision,
		catalogs: cloneValue(catalogs),
		summary: createWorkspaceSummary(),
		tickets: [...tickets.values()].sort(sortTickets).map(serializeTicketSummary),
		selectedTicketId: [...tickets.values()].sort(sortTickets)[0]?.id || '',
	};
}

/**
 * Returns one complete ticket with messages, activity, and customer context.
 *
 * @param {string} ticketId Ticket identifier.
 * @returns {Record<string, unknown>} Ticket result or API error.
 */
export function getSupportCenterTicket(ticketId) {
	const ticket = tickets.get(String(ticketId || ''));
	if (!ticket) return { error: 'Support ticket not found.', status: 404 };
	ticket.unreadCount = 0;
	return { workspaceRevision, ticket: serializeTicket(ticket) };
}

/**
 * Updates assignment and priority for one support ticket.
 *
 * @param {string} ticketId Ticket identifier.
 * @param {Record<string, unknown>} input Requested triage values.
 * @returns {Record<string, unknown>} Updated ticket workspace or API error.
 */
export function updateSupportCenterTriage(ticketId, input = {}) {
	const ticket = tickets.get(String(ticketId || ''));
	if (!ticket) return { error: 'Support ticket not found.', status: 404 };
	const conflict = validateMutation(ticket, input);
	if (conflict) return conflict;
	if (ticket.state === 'resolved') return { error: 'Reopen this ticket before changing its routing.', status: 409 };

	const updates = [];
	if (input.assigneeId !== undefined) {
		if (!catalogs.assignees.some((option) => option.value === input.assigneeId)) return fieldError('assigneeId', 'Choose an available support teammate.');
		ticket.assigneeId = String(input.assigneeId);
		updates.push(`Assigned to ${catalogLabel(catalogs.assignees, ticket.assigneeId)}`);
	}
	if (input.priority !== undefined) {
		if (!catalogs.priorities.some((option) => option.value === input.priority)) return fieldError('priority', 'Choose a supported priority.');
		ticket.priority = String(input.priority);
		updates.push(`Set ${catalogLabel(catalogs.priorities, ticket.priority)} priority`);
	}
	if (!updates.length) return { error: 'No triage changes were supplied.', status: 422 };

	ticket.activity.unshift(createActivity('Nora Bell', 'Updated ticket routing', updates.join(' · ')));
	touchTicket(ticket);
	return createMutationResult(ticket);
}

/**
 * Adds either a customer-visible response or an internal teammate note.
 *
 * @param {string} ticketId Ticket identifier.
 * @param {Record<string, unknown>} input Message payload.
 * @returns {Record<string, unknown>} Updated ticket workspace or API error.
 */
export function createSupportCenterMessage(ticketId, input = {}) {
	const ticket = tickets.get(String(ticketId || ''));
	if (!ticket) return { error: 'Support ticket not found.', status: 404 };
	const conflict = validateMutation(ticket, input);
	if (conflict) return conflict;
	if (ticket.state === 'resolved') return { error: 'Reopen this ticket before adding another response.', status: 409 };

	const mode = input.mode === 'internal' ? 'internal' : 'public';
	const content = String(input.content || '').trim();
	const minimumLength = mode === 'internal' ? 4 : 12;
	if (content.length < minimumLength) return fieldError('content', `Write at least ${minimumLength} characters before sending.`);
	if (content.length > 3000) return fieldError('content', 'Keep support messages under 3,000 characters.');

	messageSequence += 1;
	const message = {
		id: `msg-${messageSequence}`,
		author: 'Nora Bell',
		authorInitials: 'NB',
		role: mode === 'internal' ? 'internal' : 'agent',
		body: content,
		createdAt: new Date().toISOString(),
		displayTime: 'Just now',
		status: mode === 'internal' ? 'saved' : 'delivered',
		providerReceipt: mode === 'internal' ? null : createProviderReceipt('message.delivered', ticket.id),
	};
	ticket.messages.push(message);
	ticket.lastMessage = content;
	ticket.state = mode === 'public' ? 'waiting' : ticket.state;
	ticket.activity.unshift(createActivity('Nora Bell', mode === 'internal' ? 'Added an internal note' : 'Sent a customer reply', mode === 'internal' ? 'Visible only to support teammates.' : `Delivered through ${ticket.channel}.`));
	touchTicket(ticket);
	return { ...createMutationResult(ticket), message: cloneValue(message) };
}

/**
 * Retries one failed outbound provider delivery without duplicating content.
 *
 * @param {string} ticketId Ticket identifier.
 * @param {string} messageId Message identifier.
 * @param {Record<string, unknown>} input Revision payload.
 * @returns {Record<string, unknown>} Updated ticket workspace or API error.
 */
export function retrySupportCenterMessage(ticketId, messageId, input = {}) {
	const ticket = tickets.get(String(ticketId || ''));
	if (!ticket) return { error: 'Support ticket not found.', status: 404 };
	const conflict = validateMutation(ticket, input);
	if (conflict) return conflict;
	const message = ticket.messages.find((candidate) => candidate.id === String(messageId || ''));
	if (!message) return { error: 'Support message not found.', status: 404 };
	if (message.status !== 'failed') return { error: 'Only failed outbound messages can be retried.', status: 409 };

	message.status = 'delivered';
	message.failure = null;
	message.providerReceipt = createProviderReceipt('message.retry-delivered', ticket.id);
	ticket.state = 'waiting';
	ticket.activity.unshift(createActivity('Nora Bell', 'Retried a failed reply', `The ${ticket.channel} provider accepted the existing message.`));
	touchTicket(ticket);
	return { ...createMutationResult(ticket), message: cloneValue(message) };
}

/**
 * Resolves a ticket after validating delivery state and human acknowledgement.
 *
 * @param {string} ticketId Ticket identifier.
 * @param {Record<string, unknown>} input Resolution values.
 * @returns {Record<string, unknown>} Updated ticket workspace or API error.
 */
export function resolveSupportCenterTicket(ticketId, input = {}) {
	const ticket = tickets.get(String(ticketId || ''));
	if (!ticket) return { error: 'Support ticket not found.', status: 404 };
	const conflict = validateMutation(ticket, input);
	if (conflict) return conflict;
	if (ticket.state === 'resolved') return { error: 'This ticket is already resolved.', status: 409 };
	if (ticket.messages.some((message) => message.status === 'failed')) return { error: 'Retry the failed customer reply before resolving this ticket.', status: 409 };
	if (!catalogs.resolutionCodes.some((option) => option.value === input.code)) return fieldError('code', 'Choose a resolution outcome.');
	const note = normalizeText(input.note, 500);
	if (note.length < 12) return fieldError('note', 'Explain the verified customer outcome in at least 12 characters.');
	if (input.acknowledged !== true) return fieldError('acknowledged', 'Confirm that the customer outcome and delivery evidence were reviewed.');

	ticket.state = 'resolved';
	ticket.resolution = {
		code: String(input.code),
		label: catalogLabel(catalogs.resolutionCodes, input.code),
		note,
		resolvedBy: 'Nora Bell',
		resolvedAt: new Date().toISOString(),
		receipt: createProviderReceipt('ticket.resolved', ticket.id),
	};
	ticket.activity.unshift(createActivity('Nora Bell', 'Resolved the ticket', `${ticket.resolution.label} · ${note}`));
	touchTicket(ticket);
	return createMutationResult(ticket);
}

/**
 * Reopens a resolved support ticket for a new customer follow-up.
 *
 * @param {string} ticketId Ticket identifier.
 * @param {Record<string, unknown>} input Revision payload.
 * @returns {Record<string, unknown>} Updated ticket workspace or API error.
 */
export function reopenSupportCenterTicket(ticketId, input = {}) {
	const ticket = tickets.get(String(ticketId || ''));
	if (!ticket) return { error: 'Support ticket not found.', status: 404 };
	const conflict = validateMutation(ticket, input);
	if (conflict) return conflict;
	if (ticket.state !== 'resolved') return { error: 'This ticket is already open.', status: 409 };

	ticket.state = 'open';
	ticket.resolution = null;
	ticket.activity.unshift(createActivity('Nora Bell', 'Reopened the ticket', 'The customer conversation is active again.'));
	touchTicket(ticket);
	return createMutationResult(ticket);
}

/**
 * Restores the deterministic support-center demo dataset.
 *
 * @returns {Record<string, unknown>} Fresh workspace payload.
 */
export function resetSupportCenterWorkspace() {
	workspaceRevision += 1;
	tickets = createSeedTickets();
	return getSupportCenterWorkspace();
}

/**
 * Creates the deterministic customer support dataset used by the demo API.
 *
 * @returns {Map<string, Record<string, unknown>>} Seed ticket store.
 */
function createSeedTickets() {
	const seed = [
		createTicket({
			id: 'SUP-2048',
			subject: 'Cannot invite the design team',
			lastMessage: 'Both teammates use our company domain, but Invite fails immediately.',
			state: 'open',
			priority: 'high',
			assigneeId: 'nora-bell',
			channel: 'chat',
			unreadCount: 2,
			updatedAt: '2026-08-02T09:42:00.000Z',
			sla: { state: 'due', label: '28 min left', progress: 76 },
			customer: { name: 'Priya Shah', initials: 'PS', company: 'Northstar Labs', email: 'priya@northstar.example', plan: 'Scale', value: '£42k ARR', locale: 'London · GMT+1', health: 'At risk' },
			tags: ['Access', 'Workspace'],
			messages: [
				customerMessage('msg-8101', 'Priya Shah', 'PS', 'We are onboarding six designers today. Four invites worked, but two fail immediately.', 'Today · 09:24'),
				agentMessage('msg-8102', 'Nora Bell', 'NB', 'I can help with that. I am checking the workspace policy and recent invite attempts now.', 'Today · 09:31'),
				customerMessage('msg-8103', 'Priya Shah', 'PS', 'Both teammates use our company domain, but Invite fails immediately.', 'Today · 09:42'),
			],
			activity: [createActivity('Relay policy service', 'Found a domain-policy mismatch', 'Two rejected invites used a domain missing from the current allowlist.'), createActivity('Nora Bell', 'Claimed the conversation', 'Moved from Unassigned to My inbox.')],
		}),
		createTicket({
			id: 'SUP-2042',
			subject: 'Invoice export is missing tax IDs',
			lastMessage: 'The German rows still have blank VAT IDs in this month’s CSV.',
			state: 'open',
			priority: 'urgent',
			assigneeId: 'luca-reed',
			channel: 'email',
			unreadCount: 1,
			updatedAt: '2026-08-02T09:18:00.000Z',
			sla: { state: 'breached', label: 'Breached by 12 min', progress: 100 },
			customer: { name: 'Jon Bell', initials: 'JB', company: 'Harbor Finance', email: 'jon@harbor.example', plan: 'Business', value: '£18k ARR', locale: 'Berlin · GMT+2', health: 'Healthy' },
			tags: ['Billing', 'Exports'],
			messages: [customerMessage('msg-8201', 'Jon Bell', 'JB', 'The German rows still have blank VAT IDs in this month’s CSV.', 'Today · 09:18')],
			activity: [createActivity('Billing monitor', 'Raised an SLA alert', 'The first-response target has been exceeded by 12 minutes.')],
		}),
		createTicket({
			id: 'SUP-2039',
			subject: 'Webhook retries after a successful deploy',
			lastMessage: 'Your reply is ready, but email delivery failed and needs a safe retry.',
			state: 'open',
			priority: 'normal',
			assigneeId: 'maya-chen',
			channel: 'email',
			unreadCount: 0,
			updatedAt: '2026-08-02T08:56:00.000Z',
			sla: { state: 'on-track', label: '2h 14m left', progress: 34 },
			customer: { name: 'Remy Ford', initials: 'RF', company: 'Atlas Robotics', email: 'remy@atlas.example', plan: 'Enterprise', value: '£96k ARR', locale: 'Bristol · GMT+1', health: 'Expansion' },
			tags: ['API', 'Webhook'],
			messages: [
				customerMessage('msg-8301', 'Remy Ford', 'RF', 'We still receive duplicate retry events after returning a 200 response.', 'Today · 08:22'),
				failedAgentMessage('msg-8302', 'Maya Chen', 'MC', 'I found the duplicate delivery window and linked your request IDs to the engineering incident. You do not need to change your endpoint.', 'Today · 08:56'),
			],
			activity: [createActivity('Relay Mail', 'Customer reply failed', 'Provider timeout · existing message can be retried without duplication.'), createActivity('Maya Chen', 'Linked incident INC-148', 'Engineering has the request IDs and retry window.')],
		}),
		createTicket({
			id: 'SUP-2027',
			subject: 'Seat credit confirmed',
			lastMessage: 'The £480 service credit is visible on the next invoice.',
			state: 'resolved',
			priority: 'low',
			assigneeId: 'nora-bell',
			channel: 'chat',
			unreadCount: 0,
			updatedAt: '2026-08-01T16:20:00.000Z',
			sla: { state: 'met', label: 'Resolved in 38 min', progress: 100 },
			customer: { name: 'Amina Okafor', initials: 'AO', company: 'Kindred Studio', email: 'amina@kindred.example', plan: 'Scale', value: '£24k ARR', locale: 'Leeds · GMT+1', health: 'Healthy' },
			tags: ['Billing', 'Credit'],
			messages: [customerMessage('msg-8401', 'Amina Okafor', 'AO', 'Can you confirm the unused seat credit?', 'Yesterday · 15:42'), agentMessage('msg-8402', 'Nora Bell', 'NB', 'The £480 service credit is approved and is now visible on your next invoice.', 'Yesterday · 16:18')],
			activity: [createActivity('Nora Bell', 'Resolved the ticket', 'Billing adjusted · customer confirmed the credit.')],
			resolution: { code: 'billing-adjusted', label: 'Billing adjusted', note: 'The £480 service credit is visible on the next invoice.', resolvedBy: 'Nora Bell', resolvedAt: '2026-08-01T16:20:00.000Z', receipt: { id: 'rcpt-support-3901', event: 'ticket.resolved', provider: 'Relay Support API' } },
		}),
	];
	return new Map(seed.map((ticket) => [ticket.id, ticket]));
}

/**
 * Normalizes a seed ticket into the stored support ticket contract.
 *
 * @param {Record<string, unknown>} input Seed ticket values.
 * @returns {Record<string, unknown>} Stored ticket.
 */
function createTicket(input) {
	return {
		version: 1,
		resolution: null,
		messages: [],
		activity: [],
		...input,
	};
}

/**
 * Creates a customer-authored message.
 *
 * @param {string} id Message identifier.
 * @param {string} author Author name.
 * @param {string} authorInitials Author initials.
 * @param {string} body Message body.
 * @param {string} displayTime Readable time.
 * @returns {Record<string, unknown>} Customer message.
 */
function customerMessage(id, author, authorInitials, body, displayTime) {
	return { id, author, authorInitials, role: 'customer', body, displayTime, status: 'received', providerReceipt: null };
}

/**
 * Creates a successfully delivered teammate message.
 *
 * @param {string} id Message identifier.
 * @param {string} author Author name.
 * @param {string} authorInitials Author initials.
 * @param {string} body Message body.
 * @param {string} displayTime Readable time.
 * @returns {Record<string, unknown>} Teammate message.
 */
function agentMessage(id, author, authorInitials, body, displayTime) {
	return { id, author, authorInitials, role: 'agent', body, displayTime, status: 'delivered', providerReceipt: { id: `${id}-receipt`, event: 'message.delivered', provider: 'Relay Support API' } };
}

/**
 * Creates a retryable failed outbound teammate message.
 *
 * @param {string} id Message identifier.
 * @param {string} author Author name.
 * @param {string} authorInitials Author initials.
 * @param {string} body Message body.
 * @param {string} displayTime Readable time.
 * @returns {Record<string, unknown>} Failed teammate message.
 */
function failedAgentMessage(id, author, authorInitials, body, displayTime) {
	return { id, author, authorInitials, role: 'agent', body, displayTime, status: 'failed', failure: 'Email provider timed out before acknowledgement.', providerReceipt: null };
}

/**
 * Creates an audit timeline entry.
 *
 * @param {string} actor Activity actor.
 * @param {string} action Activity title.
 * @param {string} detail Activity detail.
 * @returns {Record<string, string>} Activity entry.
 */
function createActivity(actor, action, detail) {
	return { id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, actor, action, detail, time: 'Just now' };
}

/**
 * Returns summary metrics derived from the current ticket store.
 *
 * @returns {Record<string, number>} Support health metrics.
 */
function createWorkspaceSummary() {
	const values = [...tickets.values()];
	return {
		open: values.filter((ticket) => ticket.state !== 'resolved').length,
		mine: values.filter((ticket) => ticket.state !== 'resolved' && ticket.assigneeId === 'nora-bell').length,
		unassigned: values.filter((ticket) => ticket.state !== 'resolved' && ticket.assigneeId === 'unassigned').length,
		attention: values.filter(needsAttention).length,
		resolved: values.filter((ticket) => ticket.state === 'resolved').length,
		csat: 94,
	};
}

/**
 * Returns whether a ticket belongs in the needs-attention view.
 *
 * @param {Record<string, unknown>} ticket Stored ticket.
 * @returns {boolean} True when urgent, breached, or carrying failed delivery.
 */
function needsAttention(ticket) {
	return ticket.state !== 'resolved' && (ticket.priority === 'urgent' || ticket.sla.state === 'breached' || ticket.messages.some((message) => message.status === 'failed'));
}

/**
 * Creates the mutation response shared by ticket lifecycle actions.
 *
 * @param {Record<string, unknown>} ticket Updated ticket.
 * @returns {Record<string, unknown>} Mutation payload.
 */
function createMutationResult(ticket) {
	return {
		workspaceRevision,
		ticket: serializeTicket(ticket),
		summary: createWorkspaceSummary(),
		tickets: [...tickets.values()].sort(sortTickets).map(serializeTicketSummary),
	};
}

/**
 * Advances workspace and ticket versions after a successful mutation.
 *
 * @param {Record<string, unknown>} ticket Updated ticket.
 * @returns {void}
 */
function touchTicket(ticket) {
	workspaceRevision += 1;
	ticket.version += 1;
	ticket.updatedAt = new Date().toISOString();
	ticket.unreadCount = 0;
}

/**
 * Validates exact workspace and ticket revisions before a mutation.
 *
 * @param {Record<string, unknown>} ticket Stored ticket.
 * @param {Record<string, unknown>} input Mutation payload.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function validateMutation(ticket, input) {
	if (Number(input.workspaceRevision) !== workspaceRevision || Number(input.ticketVersion) !== ticket.version) {
		return { error: 'This support queue changed in another view. Reload the latest ticket before continuing.', status: 409, conflict: true };
	}
	return null;
}

/**
 * Creates a field-addressable validation response.
 *
 * @param {string} field Field name.
 * @param {string} message Validation message.
 * @returns {Record<string, unknown>} Validation response.
 */
function fieldError(field, message) {
	return { error: message, status: 422, fieldErrors: { [field]: [message] } };
}

/**
 * Creates provider-style immutable proof for a completed action.
 *
 * @param {string} event Provider event name.
 * @param {string} ticketId Ticket identifier.
 * @returns {Record<string, string>} Provider receipt.
 */
function createProviderReceipt(event, ticketId) {
	receiptSequence += 1;
	return { id: `rcpt-support-${receiptSequence}`, event, ticketId, provider: 'Relay Support API', createdAt: new Date().toISOString() };
}

/**
 * Returns a compact support queue row without conversation history.
 *
 * @param {Record<string, unknown>} ticket Stored ticket.
 * @returns {Record<string, unknown>} Ticket summary.
 */
function serializeTicketSummary(ticket) {
	return cloneValue({
		id: ticket.id,
		subject: ticket.subject,
		lastMessage: ticket.lastMessage,
		state: ticket.state,
		priority: ticket.priority,
		assigneeId: ticket.assigneeId,
		channel: ticket.channel,
		unreadCount: ticket.unreadCount,
		updatedAt: ticket.updatedAt,
		sla: ticket.sla,
		customer: { name: ticket.customer.name, initials: ticket.customer.initials, company: ticket.customer.company },
		hasFailedDelivery: ticket.messages.some((message) => message.status === 'failed'),
	});
}

/**
 * Returns a detached full ticket suitable for JSON responses.
 *
 * @param {Record<string, unknown>} ticket Stored ticket.
 * @returns {Record<string, unknown>} Serialized ticket.
 */
function serializeTicket(ticket) {
	return cloneValue(ticket);
}

/**
 * Sorts active attention work before other tickets, then by recency.
 *
 * @param {Record<string, unknown>} first First ticket.
 * @param {Record<string, unknown>} second Second ticket.
 * @returns {number} Sort position.
 */
function sortTickets(first, second) {
	if (first.state === 'resolved' && second.state !== 'resolved') return 1;
	if (second.state === 'resolved' && first.state !== 'resolved') return -1;
	if (needsAttention(first) !== needsAttention(second)) return needsAttention(first) ? -1 : 1;
	return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
}

/**
 * Resolves a catalog label for an option value.
 *
 * @param {Array<Record<string, unknown>>} options Catalog options.
 * @param {unknown} value Candidate value.
 * @returns {string} Option label or source value.
 */
function catalogLabel(options, value) {
	return String(options.find((option) => option.value === value)?.label || value || 'Unknown');
}

/**
 * Normalizes user-controlled text to a safe display length.
 *
 * @param {unknown} value Candidate text.
 * @param {number} maxLength Maximum length.
 * @returns {string} Normalized text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

/**
 * Creates a detached JSON-compatible value.
 *
 * @template T
 * @param {T} value Source value.
 * @returns {T} Detached clone.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}
