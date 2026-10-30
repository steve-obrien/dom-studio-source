let idCounter = 1000;

/**
 * Creates an isolated in-memory API for the agent chat demos.
 *
 * @returns {Record<string, Function>} API methods consumed by the demo store.
 */
export function createAgentChatMockApi() {
	const state = createInitialState();

	/**
	 * Returns the conversation index and available agents.
	 *
	 * @returns {Promise<Record<string, unknown>>} Bootstrap response.
	 */
	async function bootstrap() {
		await wait(180);
		return {
			agents: clone(state.agents),
			conversations: clone(sortConversations(state.conversations)),
			meta: responseMeta('bootstrap'),
		};
	}

	/**
	 * Returns a single conversation and its messages.
	 *
	 * @param {{ conversationId: string }} request Conversation request.
	 * @returns {Promise<Record<string, unknown>>} Conversation response.
	 */
	async function getConversation(request) {
		await wait(220);
		const conversation = findConversation(state, request.conversationId);
		if (!conversation) throw new Error('Conversation not found.');
		return {
			conversation: clone(conversation),
			messages: clone(state.messagesByConversationId[conversation.id] || []),
			meta: responseMeta('get-conversation'),
		};
	}

	/**
	 * Creates a new conversation with an empty message list.
	 *
	 * @param {{ title?: string, agentId?: string }} request Create request.
	 * @returns {Promise<Record<string, unknown>>} Created conversation response.
	 */
	async function createConversation(request = {}) {
		await wait(260);
		const agent = state.agents.find((item) => item.id === request.agentId) || state.agents[0];
		const conversation = {
			id: nextId('conv'),
			title: request.title || 'New agent thread',
			summary: 'Fresh workspace for a focused agent exchange.',
			agentId: agent.id,
			status: 'idle',
			mode: 'text',
			labels: ['new'],
			unreadCount: 0,
			updatedAt: nowIso(),
		};
		state.conversations.unshift(conversation);
		state.messagesByConversationId[conversation.id] = [];
		return {
			conversation: clone(conversation),
			messages: [],
			meta: responseMeta('create-conversation'),
		};
	}

	/**
	 * Streams an assistant response as reasoning, tool calls, and text deltas.
	 *
	 * @param {Record<string, unknown>} request Stream request.
	 * @param {Record<string, Function>} handlers Stream callbacks.
	 * @returns {Promise<Record<string, unknown>>} Final stream response.
	 */
	async function streamMessage(request, handlers = {}) {
		const conversation = findConversation(state, request.conversationId);
		if (!conversation) throw new Error('Conversation not found.');

		conversation.status = 'streaming';
		conversation.mode = request.mode === 'audio' ? 'audio' : 'text';
		conversation.updatedAt = nowIso();

		const userMessage = request.userMessage || createUserMessage(request.content, request.mode);
		const assistantMessage = createAssistantMessage(conversation);
		appendMessage(state, conversation.id, userMessage);
		appendMessage(state, conversation.id, assistantMessage);

		handlers.onAssistantStart?.(clone(assistantMessage));
		await waitAndCheck(240, request.signal);

		const reasoningPart = {
			id: nextId('part'),
			type: 'reasoning',
			status: 'complete',
			text: 'I will inspect the current SEO context, run a lightweight tool lookup, then turn the result into a plan the user can edit.',
		};
		assistantMessage.parts.push(reasoningPart);
		handlers.onPart?.(assistantMessage.id, clone(reasoningPart));
		await waitAndCheck(360, request.signal);

		const keywordTool = {
			id: nextId('tool'),
			type: 'tool-call',
			name: 'keyword_research',
			label: 'Keyword research',
			status: 'running',
			args: {
				websiteId: 'site_flexai_demo',
				seed: request.content,
				limit: 4,
			},
			result: null,
		};
		assistantMessage.parts.push(keywordTool);
		handlers.onPart?.(assistantMessage.id, clone(keywordTool));
		await waitAndCheck(520, request.signal);

		keywordTool.status = 'complete';
		keywordTool.result = {
			keywords: [
				{ phrase: 'ai seo planner', volume: 1300, difficulty: 31 },
				{ phrase: 'agentic content workflow', volume: 260, difficulty: 24 },
				{ phrase: 'seo automation dashboard', volume: 590, difficulty: 38 },
			],
			recommendedIntent: 'commercial',
		};
		handlers.onPart?.(assistantMessage.id, clone(keywordTool));
		await waitAndCheck(320, request.signal);

		const weatherTool = {
			id: nextId('tool'),
			type: 'tool-call',
			name: 'get_weather',
			rendererKey: 'weather',
			label: 'Launch-day weather',
			status: 'complete',
			args: {
				location: 'London',
				date: '2026-07-03',
			},
			result: {
				location: 'London',
				condition: 'Bright intervals',
				temperatureC: 21,
				windMph: 8,
				confidence: 0.84,
				note: 'Use this only as demo tool data.',
			},
		};
		assistantMessage.parts.push(weatherTool);
		handlers.onPart?.(assistantMessage.id, clone(weatherTool));
		await waitAndCheck(260, request.signal);

		const textPart = {
			id: nextId('part'),
			type: 'text',
			status: 'streaming',
			text: '',
		};
		assistantMessage.parts.push(textPart);
		handlers.onPart?.(assistantMessage.id, clone(textPart));

		for (const chunk of responseChunks(request.content, request.mode)) {
			await waitAndCheck(130, request.signal);
			textPart.text += chunk;
			handlers.onTextDelta?.(assistantMessage.id, textPart.id, chunk);
		}

		textPart.status = 'complete';
		assistantMessage.status = 'complete';
		conversation.status = 'complete';
		conversation.summary = summaryFromPrompt(request.content);
		conversation.updatedAt = nowIso();
		handlers.onAssistantDone?.(clone(assistantMessage));

		return {
			conversation: clone(conversation),
			message: clone(assistantMessage),
			meta: responseMeta('stream-message'),
		};
	}

	return {
		bootstrap,
		getConversation,
		createConversation,
		streamMessage,
	};
}

/**
 * Creates the initial agent, conversation, and message records.
 *
 * @returns {Record<string, unknown>} Mock database state.
 */
function createInitialState() {
	const agents = [
		{
			id: 'agent_seo',
			name: 'FlexAI SEO Agent',
			role: 'Plans SEO work from crawl data, keyword facts, and content opportunities.',
			status: 'online',
			model: 'gpt-4.1-mini',
			tools: ['keyword_research', 'crawl_summary', 'content_plan', 'get_weather'],
		},
		{
			id: 'agent_image',
			name: 'Image Brief Agent',
			role: 'Turns article context into structured creative prompts and stored image results.',
			status: 'ready',
			model: 'gpt-image-1',
			tools: ['image_brief', 'brand_assets', 'storage_lookup'],
		},
		{
			id: 'agent_support',
			name: 'Support Copilot',
			role: 'Summarizes customer threads and prepares operator handoffs.',
			status: 'review',
			model: 'gpt-4.1',
			tools: ['customer_lookup', 'ticket_history', 'handoff_note'],
		},
	];
	const conversations = [
		{
			id: 'conv_homepage_plan',
			title: 'Homepage ranking plan',
			summary: 'Keyword opportunity, weather tool demo, and a focused content-plan answer.',
			agentId: 'agent_seo',
			status: 'complete',
			mode: 'text',
			labels: ['seo', 'planning'],
			unreadCount: 0,
			updatedAt: '2026-07-03T09:15:00.000Z',
		},
		{
			id: 'conv_image_brief',
			title: 'Article image brief',
			summary: 'Draft a reusable article hero image prompt from stored brand assets.',
			agentId: 'agent_image',
			status: 'idle',
			mode: 'text',
			labels: ['images'],
			unreadCount: 2,
			updatedAt: '2026-07-02T16:35:00.000Z',
		},
		{
			id: 'conv_audio_handoff',
			title: 'Audio support handoff',
			summary: 'Switch between voice and text while preparing a support summary.',
			agentId: 'agent_support',
			status: 'waiting',
			mode: 'audio',
			labels: ['audio', 'support'],
			unreadCount: 0,
			updatedAt: '2026-07-01T11:20:00.000Z',
		},
	];
	const messagesByConversationId = {
		conv_homepage_plan: seedHomepageMessages(),
		conv_image_brief: seedImageMessages(),
		conv_audio_handoff: seedAudioMessages(),
	};
	return { agents, conversations, messagesByConversationId };
}

/**
 * Creates seed messages for the active SEO conversation.
 *
 * @returns {Array<Record<string, unknown>>} Message records.
 */
function seedHomepageMessages() {
	return [
		{
			id: 'msg_home_user_1',
			role: 'user',
			content: 'Can you turn the latest crawl and keyword context into a homepage ranking plan?',
			status: 'complete',
			mode: 'text',
			createdAt: '2026-07-03T09:10:00.000Z',
		},
		{
			id: 'msg_home_assistant_1',
			role: 'assistant',
			agentId: 'agent_seo',
			status: 'complete',
			mode: 'text',
			createdAt: '2026-07-03T09:10:12.000Z',
			parts: [
				{
					id: 'part_reasoning_home',
					type: 'reasoning',
					status: 'complete',
					text: 'The answer needs ranked actions, not a raw audit dump. I will combine crawl issues, keyword opportunity, and one timely launch signal.',
				},
				{
					id: 'tool_keyword_seed',
					type: 'tool-call',
					name: 'keyword_research',
					label: 'Keyword research',
					status: 'complete',
					args: { websiteId: 'site_flexai_demo', limit: 3 },
					result: {
						keywords: [
							{ phrase: 'ai seo planner', volume: 1300, difficulty: 31 },
							{ phrase: 'automated seo workflow', volume: 720, difficulty: 35 },
							{ phrase: 'content plan generator', volume: 2100, difficulty: 42 },
						],
					},
				},
				{
					id: 'tool_weather_seed',
					type: 'tool-call',
					name: 'get_weather',
					rendererKey: 'weather',
					label: 'Launch-day weather',
					status: 'complete',
					args: { location: 'London', date: '2026-07-03' },
					result: {
						location: 'London',
						condition: 'Bright intervals',
						temperatureC: 21,
						windMph: 8,
						confidence: 0.84,
						note: 'Demo renderer for a weather tool result.',
					},
				},
				{
					id: 'part_home_answer',
					type: 'text',
					status: 'complete',
					text: 'Yes. I would lead with the "AI SEO planner" angle, then make the homepage prove three things quickly: crawl-backed recommendations, editable content plans, and safe agent actions.\n\nPriority one is a tighter first viewport claim. Priority two is a short workflow strip showing crawl, keyword, plan, and publish review. Priority three is a proof panel that shows stored tool calls instead of vague AI copy.',
				},
			],
		},
	];
}

/**
 * Creates seed messages for the image-brief conversation.
 *
 * @returns {Array<Record<string, unknown>>} Message records.
 */
function seedImageMessages() {
	return [
		{
			id: 'msg_image_user_1',
			role: 'user',
			content: 'Use the stored brand assets and make me an image direction for the AI SEO article.',
			status: 'complete',
			mode: 'text',
			createdAt: '2026-07-02T16:32:00.000Z',
		},
		{
			id: 'msg_image_assistant_1',
			role: 'assistant',
			agentId: 'agent_image',
			status: 'complete',
			mode: 'text',
			createdAt: '2026-07-02T16:32:18.000Z',
			parts: [
				{
					id: 'tool_assets_seed',
					type: 'tool-call',
					name: 'brand_assets',
					label: 'Brand asset lookup',
					status: 'complete',
					args: { websiteId: 'site_flexai_demo', kind: 'article-hero' },
					result: { images: 4, palette: ['canvas', 'primary', 'success'], preferredAspectRatio: '16:9' },
				},
				{
					id: 'part_image_answer',
					type: 'text',
					status: 'complete',
					text: 'Create a quiet operations-style hero: product dashboard on a laptop, keyword clusters visible as cards, and a small review queue panel. Keep it editorial, not sci-fi. Store the generated image result against the article so the browser never depends on a temporary blob URL.',
				},
			],
		},
	];
}

/**
 * Creates seed messages for the audio handoff conversation.
 *
 * @returns {Array<Record<string, unknown>>} Message records.
 */
function seedAudioMessages() {
	return [
		{
			id: 'msg_audio_user_1',
			role: 'user',
			content: 'I am switching to voice for this customer summary.',
			status: 'complete',
			mode: 'audio',
			createdAt: '2026-07-01T11:16:00.000Z',
			parts: [
				{
					id: 'part_audio_user',
					type: 'audio',
					label: 'Voice note',
					status: 'complete',
					text: 'Transcript: Customer needs a concise explanation of why their crawl report changed after deployment.',
				},
			],
		},
		{
			id: 'msg_audio_assistant_1',
			role: 'assistant',
			agentId: 'agent_support',
			status: 'complete',
			mode: 'text',
			createdAt: '2026-07-01T11:17:00.000Z',
			parts: [
				{
					id: 'part_handoff_seed',
					type: 'handoff',
					label: 'Text handoff ready',
					status: 'complete',
					text: 'I can keep the transcript attached and continue in text for editing.',
				},
				{
					id: 'part_audio_answer',
					type: 'text',
					status: 'complete',
					text: 'Draft: The crawl report changed because the deployment altered page metadata and internal links. The updated report reflects the live version now seen by search crawlers.',
				},
			],
		},
	];
}

/**
 * Creates a user message from submitted composer content.
 *
 * @param {string} content User content.
 * @param {'text'|'audio'} mode Message mode.
 * @returns {Record<string, unknown>} User message.
 */
function createUserMessage(content, mode = 'text') {
	const message = {
		id: nextId('msg_user'),
		role: 'user',
		content,
		status: 'complete',
		mode,
		createdAt: nowIso(),
	};
	if (mode === 'audio') {
		message.parts = [
			{
				id: nextId('part_audio'),
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
 * Creates an empty assistant message for a streaming response.
 *
 * @param {Record<string, unknown>} conversation Conversation record.
 * @returns {Record<string, unknown>} Assistant message.
 */
function createAssistantMessage(conversation) {
	return {
		id: nextId('msg_assistant'),
		role: 'assistant',
		agentId: conversation.agentId,
		status: 'streaming',
		mode: 'text',
		createdAt: nowIso(),
		parts: [],
	};
}

/**
 * Builds a streaming response chunk list.
 *
 * @param {string} prompt User prompt.
 * @param {'text'|'audio'} mode Composer mode.
 * @returns {Array<string>} Text chunks.
 */
function responseChunks(prompt, mode) {
	const prefix = mode === 'audio'
		? 'I kept the voice note as source context and switched the editable answer back to text. '
		: '';
	const text = `${prefix}Here is the practical next step: keep the agent answer grounded in stored website facts, show each tool call as inspectable UI, and let the operator approve the final plan before it changes production content.\n\nFor "${prompt}", I would save the conversation, the tool payloads, and the final recommendation as separate records so FlexAI can replay, audit, or render each part differently later.`;
	return text.match(/.{1,42}(\s|$)/g) || [text];
}

/**
 * Finds a conversation by id.
 *
 * @param {Record<string, unknown>} state Mock state.
 * @param {string} conversationId Conversation id.
 * @returns {Record<string, unknown>|undefined} Matching conversation.
 */
function findConversation(state, conversationId) {
	return state.conversations.find((conversation) => conversation.id === conversationId);
}

/**
 * Appends a message to a conversation if it is not already present.
 *
 * @param {Record<string, unknown>} state Mock state.
 * @param {string} conversationId Conversation id.
 * @param {Record<string, unknown>} message Message record.
 * @returns {void}
 */
function appendMessage(state, conversationId, message) {
	const messages = state.messagesByConversationId[conversationId] || [];
	if (!messages.some((item) => item.id === message.id)) messages.push(message);
	state.messagesByConversationId[conversationId] = messages;
}

/**
 * Sorts conversations with the newest updated item first.
 *
 * @param {Array<Record<string, unknown>>} conversations Conversation records.
 * @returns {Array<Record<string, unknown>>} Sorted records.
 */
function sortConversations(conversations) {
	return [...conversations].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Creates response metadata for an API action.
 *
 * @param {string} action Action label.
 * @returns {Record<string, unknown>} Metadata object.
 */
function responseMeta(action) {
	return {
		action,
		requestedAt: nowIso(),
	};
}

/**
 * Creates a short conversation summary from a prompt.
 *
 * @param {string} prompt User prompt.
 * @returns {string} Summary text.
 */
function summaryFromPrompt(prompt) {
	const trimmed = String(prompt || '').trim();
	if (!trimmed) return 'Agent response completed.';
	return trimmed.length > 86 ? `${trimmed.slice(0, 83)}...` : trimmed;
}

/**
 * Waits for a duration and aborts if the signal has been cancelled.
 *
 * @param {number} ms Delay in milliseconds.
 * @param {AbortSignal} signal Abort signal.
 * @returns {Promise<void>} Resolves after the delay.
 */
async function waitAndCheck(ms, signal) {
	await wait(ms);
	if (signal?.aborted) throw abortError();
}

/**
 * Waits for a duration.
 *
 * @param {number} ms Delay in milliseconds.
 * @returns {Promise<void>} Resolves after the delay.
 */
function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/**
 * Creates a DOM-style abort error.
 *
 * @returns {Error} Abort error.
 */
function abortError() {
	const error = new Error('The agent response was stopped.');
	error.name = 'AbortError';
	return error;
}

/**
 * Returns an ISO timestamp for the current time.
 *
 * @returns {string} ISO timestamp.
 */
function nowIso() {
	return new Date().toISOString();
}

/**
 * Creates a stable demo id.
 *
 * @param {string} prefix ID prefix.
 * @returns {string} Stable id.
 */
function nextId(prefix) {
	idCounter += 1;
	return `${prefix}_${idCounter}`;
}

/**
 * Clones JSON-safe mock data.
 *
 * @param {unknown} value Source value.
 * @returns {unknown} Cloned value.
 */
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}
