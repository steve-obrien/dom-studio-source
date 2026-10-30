const priorityOptions = [
	{ value: 'urgent', label: 'Urgent', description: 'Customer is blocked or at immediate risk.', tone: 'danger' },
	{ value: 'high', label: 'High', description: 'Respond inside the current support shift.', tone: 'warning' },
	{ value: 'normal', label: 'Normal', description: 'Handle in the standard support queue.', tone: 'info' },
	{ value: 'low', label: 'Low', description: 'Useful follow-up without a time-sensitive impact.', tone: 'neutral' },
];

const agents = [
	{
		id: 'general-support',
		name: 'Support copilot',
		initials: 'SC',
		role: 'General product guidance and customer-ready drafts',
		model: 'Atlas Mini',
		status: 'online',
		tone: 'success',
		tools: ['account.lookup', 'knowledge.search', 'draft.reply'],
	},
	{
		id: 'billing-specialist',
		name: 'Billing specialist',
		initials: 'BS',
		role: 'Invoices, refunds, credits, and subscription policy',
		model: 'Atlas Reasoning',
		status: 'online',
		tone: 'warning',
		tools: ['account.lookup', 'invoice.inspect', 'policy.search'],
	},
	{
		id: 'technical-specialist',
		name: 'Technical specialist',
		initials: 'TS',
		role: 'Imports, APIs, identity, and integration troubleshooting',
		model: 'Atlas Reasoning',
		status: 'online',
		tone: 'info',
		tools: ['logs.search', 'account.lookup', 'runbook.search'],
	},
];

const conversations = new Map([
	createSeedConversation({
		id: 'northstar-refund',
		ticketId: 'SUP-1842',
		title: 'Refund request · Northstar',
		summary: 'Waiting on a policy-safe reply for the unused annual seats.',
		agentId: 'billing-specialist',
		status: 'waiting',
		ticketState: 'open',
		priority: 'high',
		unreadCount: 2,
		updatedAt: '2026-08-01T13:48:00.000Z',
		slaLabel: '42 min remaining',
		customer: {
			name: 'Maya Chen',
			initials: 'MC',
			company: 'Northstar Labs',
			email: 'maya@northstarlabs.example',
			plan: 'Scale annual',
			accountValue: '£18,400 ARR',
			locale: 'London · GMT+1',
		},
		activity: [
			createActivity('Maya Chen', 'Requested a partial refund', 'Eight seats were removed before the renewal date.', 'Today at 14:41'),
			createActivity('Nora Bell', 'Asked the billing copilot for a policy check', 'Refund policy and invoice history attached.', 'Today at 14:43'),
		],
		messages: [
			createUserMessage('northstar-user-1', 'Review the account and draft a concise response. We can credit unused seats, but do not promise a cash refund until Finance confirms.', '2026-08-01T13:43:00.000Z'),
			createAssistantMessage({
				id: 'northstar-assistant-1',
				agentId: 'billing-specialist',
				createdAt: '2026-08-01T13:44:00.000Z',
				reasoning: 'The account is inside its annual term. Policy allows a prorated service credit after seat reduction, while cash refunds need Finance approval.',
				tool: {
					name: 'invoice.inspect',
					label: 'Checked invoice and refund policy',
					args: { account: 'Northstar Labs', invoice: 'INV-8041' },
					result: { renewal: '2027-05-01', removedSeats: 8, eligibleCredit: '£1,240', cashRefund: 'finance-review' },
				},
				text: 'Here is a safe draft:\n\nHi Maya — I checked the seat change against your annual plan. We can apply a £1,240 service credit for the unused seats today. I have also sent the cash-refund request to Finance and will update you before the end of this support shift. Would the account credit work as a fallback?',
			}),
		],
	}),
	createSeedConversation({
		id: 'brightpath-sso',
		ticketId: 'SUP-1835',
		title: 'SSO setup · Brightpath',
		summary: 'A tested Entra ID checklist is ready to send.',
		agentId: 'technical-specialist',
		status: 'complete',
		ticketState: 'open',
		priority: 'normal',
		unreadCount: 0,
		updatedAt: '2026-08-01T12:20:00.000Z',
		slaLabel: 'On track · 3h remaining',
		customer: {
			name: 'Jon Bell',
			initials: 'JB',
			company: 'Brightpath Health',
			email: 'jon@brightpath.example',
			plan: 'Enterprise',
			accountValue: '£42,000 ARR',
			locale: 'Manchester · GMT+1',
		},
		activity: [
			createActivity('Technical specialist', 'Prepared the Entra ID checklist', 'Callback URL and attribute mapping were verified.', 'Today at 13:20'),
		],
		messages: [
			createUserMessage('brightpath-user-1', 'Use the tenant details to prepare a numbered Entra ID setup checklist. Call out the email claim mapping.', '2026-08-01T12:17:00.000Z'),
			createAssistantMessage({
				id: 'brightpath-assistant-1',
				agentId: 'technical-specialist',
				createdAt: '2026-08-01T12:20:00.000Z',
				reasoning: 'The callback URL and tenant domain are already verified. The only non-default step is mapping user.mail to the email claim.',
				tool: {
					name: 'runbook.search',
					label: 'Loaded the Entra ID runbook',
					args: { provider: 'entra-id', plan: 'enterprise' },
					result: { checklistVersion: '4.3', callbackVerified: true, requiredClaim: 'user.mail' },
				},
				text: 'The checklist is ready. It covers the enterprise application, callback URL, certificate, user.mail claim mapping, test group assignment, and a final sign-in verification before enforcement.',
			}),
		],
	}),
	createSeedConversation({
		id: 'acme-import',
		ticketId: 'SUP-1829',
		title: 'Import failure · Acme',
		summary: 'The log lookup failed and can be retried without losing the thread.',
		agentId: 'technical-specialist',
		status: 'error',
		ticketState: 'open',
		priority: 'urgent',
		unreadCount: 1,
		updatedAt: '2026-08-01T11:08:00.000Z',
		slaLabel: 'Breached by 12 min',
		customer: {
			name: 'Sam Rivera',
			initials: 'SR',
			company: 'Acme Logistics',
			email: 'sam@acmelogistics.example',
			plan: 'Scale monthly',
			accountValue: '£9,600 ARR',
			locale: 'Bristol · GMT+1',
		},
		activity: [
			createActivity('Technical specialist', 'Log lookup failed', 'The demo keeps the failed tool result so retry can be tested.', 'Today at 12:08'),
		],
		messages: [
			createUserMessage('acme-user-1', 'Find the first rejected CSV row and suggest the safest correction. Do not ask the customer to reformat the whole file.', '2026-08-01T11:07:00.000Z'),
			createAssistantMessage({
				id: 'acme-assistant-1',
				agentId: 'technical-specialist',
				createdAt: '2026-08-01T11:08:00.000Z',
				status: 'error',
				reasoning: 'The import identifier is valid, but the log service did not return the rejected row.',
				tool: {
					name: 'logs.search',
					label: 'Inspect rejected import row',
					status: 'error',
					args: { importId: 'imp_8421', firstFailure: true },
					result: { error: 'Log lookup timed out', retryable: true },
				},
				text: 'I could not inspect the rejected row because the log lookup timed out. Retry the tool call to continue from this point.',
			}),
		],
	}),
].map((conversation) => [conversation.id, conversation]));

let conversationSequence = 2100;
let messageSequence = 8400;

/**
 * Returns the complete support-copilot workspace bootstrap payload.
 *
 * @returns {{ agents: Array<object>, conversations: Array<object>, priorityOptions: Array<object> }} Workspace data.
 */
export function getSupportCopilotBootstrap() {
	return {
		agents: cloneValue(agents),
		conversations: [...conversations.values()].sort(sortByUpdatedAt).map(serializeConversationSummary),
		priorityOptions: cloneValue(priorityOptions),
	};
}

/**
 * Returns one support conversation and its ordered message history.
 *
 * @param {string} conversationId Conversation identifier.
 * @returns {{ conversation?: object, messages?: Array<object>, error?: string, status?: number }} Conversation result.
 */
export function getSupportConversation(conversationId) {
	const conversation = conversations.get(String(conversationId || ''));
	if (!conversation) return { error: 'Support conversation not found.', status: 404 };
	conversation.unreadCount = 0;
	return serializeConversationResult(conversation);
}

/**
 * Creates a new support-copilot thread with a safe empty state.
 *
 * @param {Record<string, unknown>} input New conversation values.
 * @returns {{ conversation: object, messages: Array<object> }} Created conversation.
 */
export function createSupportConversation(input = {}) {
	conversationSequence += 1;
	const agentId = validAgentId(input.agentId) ? String(input.agentId) : agents[0].id;
	const conversation = createSeedConversation({
		id: `support-${conversationSequence}`,
		ticketId: `SUP-${conversationSequence}`,
		title: normalizeShortText(input.title, 'New support review', 80),
		summary: 'Start with a customer question or an internal handoff note.',
		agentId,
		status: 'waiting',
		ticketState: 'open',
		priority: 'normal',
		unreadCount: 0,
		updatedAt: new Date().toISOString(),
		slaLabel: 'New · 4h target',
		customer: {
			name: 'Unassigned customer',
			initials: 'UC',
			company: 'New conversation',
			email: 'Add customer context after triage',
			plan: 'Plan not loaded',
			accountValue: 'Not available',
			locale: 'Locale not loaded',
		},
		activity: [createActivity('Nora Bell', 'Started a support review', 'The thread is ready for customer context and a first prompt.', 'Just now')],
		messages: [],
	});
	conversations.set(conversation.id, conversation);
	return serializeConversationResult(conversation);
}

/**
 * Updates the agent and priority settings for one conversation.
 *
 * @param {string} conversationId Conversation identifier.
 * @param {Record<string, unknown>} input Settings mutation.
 * @returns {{ conversation?: object, error?: string, status?: number }} Updated conversation or API error.
 */
export function updateSupportConversationSettings(conversationId, input = {}) {
	const conversation = conversations.get(String(conversationId || ''));
	if (!conversation) return { error: 'Support conversation not found.', status: 404 };
	const revisionError = validateRevision(conversation, input.revision);
	if (revisionError) return revisionError;

	const updates = [];
	if (input.agentId !== undefined) {
		if (!validAgentId(input.agentId)) return { error: 'Choose an available support copilot.', status: 422 };
		conversation.agentId = String(input.agentId);
		updates.push(`Assigned ${agentLabel(conversation.agentId)}`);
	}
	if (input.priority !== undefined) {
		if (!priorityOptions.some((option) => option.value === input.priority)) return { error: 'Choose a supported priority.', status: 422 };
		conversation.priority = String(input.priority);
		updates.push(`Set ${conversation.priority} priority`);
	}
	if (!updates.length) return { error: 'No conversation settings were supplied.', status: 422 };

	touchConversation(conversation);
	conversation.activity.unshift(createActivity('Nora Bell', 'Updated conversation settings', updates.join(' · '), 'Just now'));
	return { conversation: serializeConversation(conversation) };
}

/**
 * Appends an operator prompt and a deterministic copilot response.
 *
 * @param {string} conversationId Conversation identifier.
 * @param {Record<string, unknown>} input Message payload.
 * @returns {{ conversation?: object, messages?: Array<object>, message?: object, error?: string, status?: number }} Message result.
 */
export function sendSupportCopilotMessage(conversationId, input = {}) {
	const conversation = conversations.get(String(conversationId || ''));
	if (!conversation) return { error: 'Support conversation not found.', status: 404 };
	if (conversation.ticketState === 'resolved') return { error: 'Reopen the ticket before asking the copilot to continue.', status: 409 };
	if (conversation.status === 'error') return { error: 'Retry the failed tool call before adding another prompt.', status: 409 };
	const revisionError = validateRevision(conversation, input.revision);
	if (revisionError) return revisionError;

	const content = String(input.content || '').trim();
	if (!content) return { error: 'Write a prompt before sending.', status: 422 };
	if (content.length > 2000) return { error: 'Keep the demo prompt under 2,000 characters.', status: 422 };

	messageSequence += 1;
	const createdAt = new Date().toISOString();
	const userMessage = createUserMessage(`support-user-${messageSequence}`, content, createdAt, input.mode === 'audio' ? 'audio' : 'text');
	messageSequence += 1;
	const assistantMessage = buildAssistantReply(conversation, content, `support-assistant-${messageSequence}`, createdAt);
	conversation.messages.push(userMessage, assistantMessage);
	conversation.status = 'complete';
	conversation.summary = `Copilot prepared a ${agentTopic(conversation.agentId)} response for ${conversation.customer.name}.`;
	if (conversation.title === 'New support review') conversation.title = titleFromPrompt(content);
	conversation.activity.unshift(createActivity(agentLabel(conversation.agentId), 'Prepared a customer-ready draft', `Used ${assistantMessage.parts.find((part) => part.type === 'tool-call')?.label || 'support context'}.`, 'Just now'));
	touchConversation(conversation);
	return {
		...serializeConversationResult(conversation),
		message: cloneValue(assistantMessage),
	};
}

/**
 * Retries the most recent failed assistant tool call.
 *
 * @param {string} conversationId Conversation identifier.
 * @param {Record<string, unknown>} input Retry payload.
 * @returns {{ conversation?: object, messages?: Array<object>, message?: object, error?: string, status?: number }} Retry result.
 */
export function retrySupportCopilotMessage(conversationId, input = {}) {
	const conversation = conversations.get(String(conversationId || ''));
	if (!conversation) return { error: 'Support conversation not found.', status: 404 };
	const revisionError = validateRevision(conversation, input.revision);
	if (revisionError) return revisionError;
	const failedIndex = findLastFailedAssistantIndex(conversation.messages);
	if (failedIndex < 0) return { error: 'There is no failed copilot response to retry.', status: 409 };

	messageSequence += 1;
	const replacement = createAssistantMessage({
		id: `support-assistant-${messageSequence}`,
		agentId: conversation.agentId,
		createdAt: new Date().toISOString(),
		reasoning: 'The retry found row 184 as the first rejected record. Only the date field needs a local correction.',
		tool: {
			name: 'logs.search',
			label: 'Inspected rejected import row',
			args: { importId: 'imp_8421', firstFailure: true, retry: true },
			result: { row: 184, field: 'delivery_date', received: '31/08/26', expected: '2026-08-31', retryable: false },
		},
		text: 'The first rejected record is row 184. Its delivery_date uses 31/08/26, while this importer expects 2026-08-31. Ask Sam to correct that one cell and upload the same file again; the other rows passed validation.',
	});
	conversation.messages.splice(failedIndex, 1, replacement);
	conversation.status = 'complete';
	conversation.summary = 'The retry found one invalid date in row 184 and prepared a focused correction.';
	conversation.activity.unshift(createActivity('Technical specialist', 'Retried the failed log lookup', 'Found the first invalid date without asking for a full-file reformat.', 'Just now'));
	touchConversation(conversation);
	return {
		...serializeConversationResult(conversation),
		message: cloneValue(replacement),
	};
}

/**
 * Resolves an open support ticket while preserving its copilot history.
 *
 * @param {string} conversationId Conversation identifier.
 * @param {Record<string, unknown>} input Resolution payload.
 * @returns {{ conversation?: object, error?: string, status?: number }} Resolve result.
 */
export function resolveSupportConversation(conversationId, input = {}) {
	const conversation = conversations.get(String(conversationId || ''));
	if (!conversation) return { error: 'Support conversation not found.', status: 404 };
	if (conversation.ticketState === 'resolved') return { error: 'This ticket is already resolved.', status: 409 };
	if (conversation.status === 'error') return { error: 'Retry the failed copilot response before resolving this ticket.', status: 409 };
	const revisionError = validateRevision(conversation, input.revision);
	if (revisionError) return revisionError;

	conversation.ticketState = 'resolved';
	conversation.status = 'complete';
	conversation.resolution = {
		resolvedBy: 'Nora Bell',
		resolvedAt: new Date().toISOString(),
		note: normalizeShortText(input.note, 'Customer response reviewed and ready to send.', 240),
	};
	conversation.summary = `Resolved · ${conversation.resolution.note}`;
	conversation.activity.unshift(createActivity('Nora Bell', 'Resolved the ticket', conversation.resolution.note, 'Just now'));
	touchConversation(conversation);
	return { conversation: serializeConversation(conversation) };
}

/**
 * Reopens a previously resolved support ticket.
 *
 * @param {string} conversationId Conversation identifier.
 * @param {Record<string, unknown>} input Reopen payload.
 * @returns {{ conversation?: object, error?: string, status?: number }} Reopen result.
 */
export function reopenSupportConversation(conversationId, input = {}) {
	const conversation = conversations.get(String(conversationId || ''));
	if (!conversation) return { error: 'Support conversation not found.', status: 404 };
	if (conversation.ticketState !== 'resolved') return { error: 'This ticket is already open.', status: 409 };
	const revisionError = validateRevision(conversation, input.revision);
	if (revisionError) return revisionError;

	conversation.ticketState = 'open';
	conversation.status = 'waiting';
	conversation.resolution = null;
	conversation.summary = 'Reopened for another customer follow-up.';
	conversation.activity.unshift(createActivity('Nora Bell', 'Reopened the ticket', 'The copilot thread is ready for another prompt.', 'Just now'));
	touchConversation(conversation);
	return { conversation: serializeConversation(conversation) };
}

/**
 * Creates a normalized conversation record for the process-local demo store.
 *
 * @param {Record<string, unknown>} input Seed values.
 * @returns {Record<string, unknown>} Conversation record.
 */
function createSeedConversation(input) {
	return {
		revision: 1,
		resolution: null,
		...input,
		messages: Array.isArray(input.messages) ? input.messages : [],
		activity: Array.isArray(input.activity) ? input.activity : [],
	};
}

/**
 * Creates an operator-authored chat message.
 *
 * @param {string} id Message identifier.
 * @param {string} content Message content.
 * @param {string} createdAt ISO timestamp.
 * @param {'text'|'audio'} mode Message mode.
 * @returns {Record<string, unknown>} Message record.
 */
function createUserMessage(id, content, createdAt, mode = 'text') {
	const message = {
		id,
		role: 'user',
		authorName: 'Nora Bell',
		content,
		status: 'complete',
		mode,
		createdAt,
	};
	if (mode === 'audio') {
		message.parts = [{ id: `${id}-audio`, type: 'audio', label: 'Voice handoff', status: 'complete', text: `Transcript: ${content}` }];
	}
	return message;
}

/**
 * Creates an assistant message with reasoning, tool evidence, and final text.
 *
 * @param {Record<string, unknown>} input Assistant message values.
 * @returns {Record<string, unknown>} Assistant message.
 */
function createAssistantMessage(input) {
	const status = input.status === 'error' ? 'error' : 'complete';
	return {
		id: input.id,
		role: 'assistant',
		agentId: input.agentId,
		status,
		createdAt: input.createdAt,
		parts: [
			{ id: `${input.id}-reasoning`, type: 'reasoning', status, text: input.reasoning },
			{
				id: `${input.id}-tool`,
				type: 'tool-call',
				rendererKey: 'support-context',
				status: input.tool.status || status,
				name: input.tool.name,
				label: input.tool.label,
				args: input.tool.args,
				result: input.tool.result,
			},
			{ id: `${input.id}-text`, type: 'text', status, text: input.text },
		],
	};
}

/**
 * Builds a deterministic copilot response from the selected specialist and ticket context.
 *
 * @param {Record<string, unknown>} conversation Active conversation.
 * @param {string} prompt Operator prompt.
 * @param {string} id Assistant message identifier.
 * @param {string} createdAt ISO timestamp.
 * @returns {Record<string, unknown>} Assistant message.
 */
function buildAssistantReply(conversation, prompt, id, createdAt) {
	const agentId = conversation.agentId;
	const tool = agentId === 'billing-specialist'
		? { name: 'policy.search', label: 'Checked billing policy', result: { policy: 'service-credit-first', financeApproval: 'cash-refund' } }
		: agentId === 'technical-specialist'
			? { name: 'runbook.search', label: 'Checked the technical runbook', result: { runbook: 'support-triage-v4', matchedSteps: 3 } }
			: { name: 'knowledge.search', label: 'Searched the support knowledge base', result: { articles: 4, bestMatch: 'customer-response-guidance' } };
	return createAssistantMessage({
		id,
		agentId,
		createdAt,
		reasoning: `I matched the request to ${conversation.customer.company}'s ${conversation.customer.plan} context and kept the response inside the selected specialist's authority.`,
		tool: {
			...tool,
			args: { ticketId: conversation.ticketId, query: prompt.slice(0, 120) },
		},
		text: buildReplyText(conversation, agentId),
	});
}

/**
 * Builds customer-ready response text for the selected agent specialty.
 *
 * @param {Record<string, unknown>} conversation Active conversation.
 * @param {string} agentId Selected agent identifier.
 * @returns {string} Draft response.
 */
function buildReplyText(conversation, agentId) {
	const firstName = String(conversation.customer.name || 'there').split(' ')[0];
	if (agentId === 'billing-specialist') {
		return `Hi ${firstName} — I reviewed the account and the billing policy attached to ${conversation.ticketId}. I can move the eligible account credit forward now, and I have separated any cash-refund request for Finance approval so I do not over-promise. I will keep this ticket open until that review is complete.`;
	}
	if (agentId === 'technical-specialist') {
		return `Hi ${firstName} — I checked the ticket against the current troubleshooting runbook. I have narrowed the next step to one reversible check, so you do not need to repeat the full setup. Please send the latest result here and I will continue from the same point.`;
	}
	return `Hi ${firstName} — thanks for the clear context. I reviewed the account and the relevant support guidance, and I have a focused next step ready. I will keep the thread open while we confirm the outcome, so you will not need to repeat anything.`;
}

/**
 * Returns a clone-safe serialized conversation without its message collection.
 *
 * @param {Record<string, unknown>} conversation Stored conversation.
 * @returns {Record<string, unknown>} Serialized conversation.
 */
function serializeConversation(conversation) {
	const { messages, ...record } = conversation;
	return cloneValue(record);
}

/**
 * Returns a compact conversation row for the agent-chat sidebar.
 *
 * @param {Record<string, unknown>} conversation Stored conversation.
 * @returns {Record<string, unknown>} Conversation summary.
 */
function serializeConversationSummary(conversation) {
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
		labels: [conversation.priority, conversation.customer.company, conversation.ticketState],
	};
}

/**
 * Returns the standard full-conversation API payload.
 *
 * @param {Record<string, unknown>} conversation Stored conversation.
 * @returns {{ conversation: object, messages: Array<object> }} Serialized result.
 */
function serializeConversationResult(conversation) {
	return {
		conversation: serializeConversation(conversation),
		messages: cloneValue(conversation.messages),
	};
}

/**
 * Validates a client revision against the process-local record.
 *
 * @param {Record<string, unknown>} conversation Stored conversation.
 * @param {unknown} revision Client revision.
 * @returns {{ error: string, status: number }|null} Conflict result or null.
 */
function validateRevision(conversation, revision) {
	if (Number(revision) === Number(conversation.revision)) return null;
	return { error: 'This support thread changed in another view. Reload it before continuing.', status: 409 };
}

/**
 * Advances the conversation revision and update time.
 *
 * @param {Record<string, unknown>} conversation Stored conversation.
 * @returns {void}
 */
function touchConversation(conversation) {
	conversation.revision += 1;
	conversation.updatedAt = new Date().toISOString();
	conversation.unreadCount = 0;
}

/**
 * Returns whether an agent identifier exists in the demo catalog.
 *
 * @param {unknown} agentId Candidate agent identifier.
 * @returns {boolean} True for a supported agent.
 */
function validAgentId(agentId) {
	return agents.some((agent) => agent.id === String(agentId || ''));
}

/**
 * Returns the display name for an agent identifier.
 *
 * @param {string} agentId Agent identifier.
 * @returns {string} Agent label.
 */
function agentLabel(agentId) {
	return agents.find((agent) => agent.id === agentId)?.name || 'Support copilot';
}

/**
 * Returns a short specialty phrase for conversation summaries.
 *
 * @param {string} agentId Agent identifier.
 * @returns {string} Specialty phrase.
 */
function agentTopic(agentId) {
	if (agentId === 'billing-specialist') return 'billing-safe';
	if (agentId === 'technical-specialist') return 'runbook-backed';
	return 'knowledge-backed';
}

/**
 * Finds the final failed assistant message in a message collection.
 *
 * @param {Array<Record<string, unknown>>} messages Conversation messages.
 * @returns {number} Failed message index or -1.
 */
function findLastFailedAssistantIndex(messages) {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		if (messages[index].role === 'assistant' && messages[index].status === 'error') return index;
	}
	return -1;
}

/**
 * Creates an activity timeline record.
 *
 * @param {string} actor Activity actor.
 * @param {string} action Activity title.
 * @param {string} detail Activity detail.
 * @param {string} time Display time.
 * @returns {Record<string, string>} Activity record.
 */
function createActivity(actor, action, detail, time) {
	return {
		id: `activity-${Math.random().toString(36).slice(2, 10)}`,
		actor,
		action,
		detail,
		time,
	};
}

/**
 * Normalizes short user-controlled text with a fallback and length ceiling.
 *
 * @param {unknown} value Candidate text.
 * @param {string} fallback Fallback text.
 * @param {number} maxLength Maximum length.
 * @returns {string} Normalized text.
 */
function normalizeShortText(value, fallback, maxLength) {
	const text = String(value || '').trim().replace(/\s+/g, ' ');
	return (text || fallback).slice(0, maxLength);
}

/**
 * Creates a readable conversation title from the first prompt.
 *
 * @param {string} prompt Source prompt.
 * @returns {string} Conversation title.
 */
function titleFromPrompt(prompt) {
	const normalized = normalizeShortText(prompt, 'New support review', 52);
	return normalized.length > 48 ? `${normalized.slice(0, 45)}...` : normalized;
}

/**
 * Sorts conversations from most recently updated to oldest.
 *
 * @param {Record<string, unknown>} first First conversation.
 * @param {Record<string, unknown>} second Second conversation.
 * @returns {number} Sort position.
 */
function sortByUpdatedAt(first, second) {
	return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
}

/**
 * Creates a detached JSON-compatible value for API responses.
 *
 * @template T
 * @param {T} value Source value.
 * @returns {T} Detached clone.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}
