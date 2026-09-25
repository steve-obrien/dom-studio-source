<script>
/**
 * @typedef {object} AgentChatAgent
 * @property {string} id Stable agent id.
 * @property {string} name Human-readable agent name.
 * @property {string} [role] Agent role or specialty.
 * @property {string} [status] Agent availability label.
 * @property {string} [model] Model or runtime label.
 * @property {string} [avatarUrl] Optional avatar image URL.
 * @property {Array<string>} [tools] Tool names available to the agent.
 */

/**
 * @typedef {object} AgentChatConversation
 * @property {string} id Stable conversation id.
 * @property {string} title Display title.
 * @property {string} [summary] Short summary for the active thread.
 * @property {string} [agentId] Active agent id.
 * @property {'idle'|'streaming'|'waiting'|'error'|'complete'} [status] Conversation state.
 * @property {'text'|'audio'} [mode] Preferred input mode.
 * @property {string} [updatedAt] ISO timestamp.
 */

/**
 * @typedef {object} AgentChatMessagePart
 * @property {'text'|'reasoning'|'tool-call'|'tool-result'|'audio'|'handoff'} type Part renderer type.
 * @property {string} [id] Stable part id.
 * @property {string} [text] Text content for text and reasoning parts.
 * @property {string} [name] Tool or handoff name.
 * @property {string} [label] Human-readable part label.
 * @property {'queued'|'running'|'complete'|'error'|'cancelled'} [status] Part status.
 * @property {Record<string, unknown>} [args] Tool call arguments.
 * @property {Record<string, unknown>} [result] Tool call result.
 * @property {string} [rendererKey] Custom renderer lookup key.
 */

/**
 * @typedef {object} AgentChatMessage
 * @property {string} id Stable message id.
 * @property {'user'|'assistant'|'system'|'tool'} role Message author role.
 * @property {string} [agentId] Agent id for assistant-authored messages.
 * @property {string} [authorName] Display author override.
 * @property {string} [content] Plain text content.
 * @property {Array<AgentChatMessagePart>} [parts] Ordered message parts.
 * @property {'queued'|'streaming'|'complete'|'error'|'cancelled'} [status] Message state.
 * @property {'text'|'audio'} [mode] Message modality.
 * @property {string} [createdAt] ISO timestamp.
 */

export const agentConversationProps = {
	conversation: {
		type: Object,
		default: null,
		_edit: { description: 'Active conversation record. Used for the header, status, and empty state context.' },
	},
	messages: {
		type: Array,
		default: () => [],
		_edit: { description: 'Ordered conversation messages. Messages may contain text, reasoning, audio, handoff, and tool-call parts.' },
	},
	agents: {
		type: Array,
		default: () => [],
		_edit: { description: 'Agents that can author assistant messages or be displayed in the header.' },
	},
	modelValue: {
		type: String,
		default: '',
		_edit: { description: 'Controlled composer text.' },
	},
	mode: {
		type: String,
		default: 'text',
		validator: (value) => ['text', 'audio'].includes(value),
		_edit: { options: ['text', 'audio'], description: 'Active composer modality.' },
	},
	streaming: {
		type: Boolean,
		default: false,
		_edit: { description: 'Show the stop control and live status while the assistant response streams.' },
	},
	loading: {
		type: Boolean,
		default: false,
		_edit: { description: 'Show a loading state before conversation messages are available.' },
	},
	autoScroll: {
		type: Boolean,
		default: true,
		_edit: { description: 'Keep the scroller pinned to the bottom while new content arrives.' },
	},
	showHeader: {
		type: Boolean,
		default: true,
		_edit: { description: 'Render the built-in conversation header.' },
	},
	showFooter: {
		type: Boolean,
		default: true,
		_edit: { description: 'Render the built-in composer footer.' },
	},
	showReasoning: {
		type: Boolean,
		default: true,
		_edit: { description: 'Render reasoning summary parts when the supplied message data includes them.' },
	},
	placeholder: {
		type: String,
		default: 'Ask the agent to plan, inspect, or create...',
		_edit: { description: 'Composer placeholder text.' },
	},
	emptyText: {
		type: String,
		default: 'Select a conversation or start a new one.',
		_edit: { description: 'Message shown when there are no messages.' },
	},
	disabled: {
		type: Boolean,
		default: false,
		_edit: { description: 'Disable composer input and send controls.' },
	},
	toolComponents: {
		type: Object,
		default: () => ({}),
		_edit: { description: 'Component map keyed by tool rendererKey or tool name. Falls back to the generic tool card.' },
	},
	maxMessageWidth: {
		type: String,
		default: '48rem',
		_edit: { description: 'CSS max-width applied to the centered message column and composer.' },
	},
};
</script>

<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue';
import DomIconButton from '../../components/icon-button/DomIconButton.vue';
import DomTextareaComposer from '../../forms/textarea-composer/DomTextareaComposer.vue';
import DomToggleButtonGroup from '../../forms/toggle-button-group/DomToggleButtonGroup.vue';
import DomAvatar from '../../visual/avatar/DomAvatar.vue';
import DomEmptyState from '../../visual/empty-state/DomEmptyState.vue';
import DomSkeleton from '../../visual/skeleton/DomSkeleton.vue';
import DomStatusPill from '../../visual/status-pill/DomStatusPill.vue';

defineOptions({
	__doc: {
		nav: { section: 'ai' },
		name: 'Agent conversation',
		tag: '<DomAgentConversation>',
		description: 'A scroll-contained AI conversation surface with a fixed header, streaming messages, reasoning summaries, audio/text mode switching, tool-call rendering, and a composer footer.',
		icon: 'M5 7h14M5 12h10M5 17h6M18 15l3 3-3 3',
		events: [
			{ name: 'update:modelValue', payload: 'string', description: 'Fired when the composer text changes.' },
			{ name: 'update:mode', payload: '\'text\' | \'audio\'', description: 'Fired when the composer switches between text and audio mode.' },
			{ name: 'submit', payload: '({ content, mode, conversation })', description: 'Fired when the user submits the composer.' },
			{ name: 'stop', payload: '({ conversation })', description: 'Fired when the user stops an active stream.' },
			{ name: 'tool-action', payload: '({ action, tool, message })', description: 'Fired by generic and custom tool renderers for approvals, retries, and inspection.' },
			{ name: 'scroll-bottom', payload: '({ conversation })', description: 'Fired when the built-in jump-to-bottom control is used.' },
		],
		slots: [
			{ name: 'header-leading', payload: '{ conversation, activeAgent }', description: 'Controls shown before the title, useful for opening an app sidebar.' },
			{ name: 'header-actions', payload: '{ conversation, activeAgent, streaming }', description: 'Controls shown at the end of the header.' },
			{ name: 'message', payload: '{ message, activeAgent, parts }', description: 'Replace the full message renderer.' },
			{ name: 'tool', payload: '{ tool, message, component, action }', description: 'Replace generic tool rendering without supplying toolComponents.' },
			{ name: 'composer-attachments', payload: '{ mode, disabled, streaming }', description: 'Application-owned file, image, or context previews above the composer text.' },
			{ name: 'composer-leading', payload: '{ mode, setMode, disabled, streaming }', description: 'Controls at the start of the composer action row.' },
			{ name: 'composer-actions', payload: '{ mode, setMode, disabled, streaming }', description: 'Controls before the built-in submit or stop action.' },
			{ name: 'footer', payload: '{ value, mode, submit, setMode }', description: 'Replace the built-in composer footer.' },
			{ name: 'empty', description: 'Custom empty conversation state.' },
		],
		keyboard: [
			{ keys: 'Enter', action: 'Submit the composer.' },
			{ keys: 'Shift + Enter', action: 'Insert a new line.' },
		],
	},
});

const props = defineProps(agentConversationProps);
const emit = defineEmits([
	'update:modelValue',
	'update:mode',
	'submit',
	'stop',
	'tool-action',
	'scroll-bottom',
]);

const modeOptions = [
	{ label: 'Text', value: 'text' },
	{ label: 'Audio', value: 'audio' },
];

const scroller = ref(null);
const isPinnedToBottom = ref(true);
const titleId = useId();

const activeAgent = computed(() => findAgentById(props.agents, props.conversation?.agentId));
const conversationTitle = computed(() => props.conversation?.title || activeAgent.value?.name || 'Agent conversation');
const conversationSummary = computed(() => props.conversation?.summary || activeAgent.value?.role || 'Ask, inspect, and continue the work in one thread.');
const statusTone = computed(() => statusToneFor(props.streaming ? 'streaming' : props.conversation?.status));
const visibleMessages = computed(() => props.messages.filter(isVisibleMessage));
const canSubmit = computed(() => !props.disabled && !props.streaming && props.modelValue.trim().length > 0);
const composerPlaceholder = computed(() => props.mode === 'audio' ? 'Describe what you want to say, or connect this to speech input...' : props.placeholder);
const columnStyle = computed(() => ({ maxWidth: props.maxMessageWidth }));
const shouldShowJumpButton = computed(() => !isPinnedToBottom.value && visibleMessages.value.length > 2);

watch(() => props.conversation?.id, async () => {
	await nextTick();
	scrollToBottom('auto');
});

watch(() => [visibleMessages.value.length, lastMessageSignature(visibleMessages.value)], async () => {
	if (!props.autoScroll || !isPinnedToBottom.value) return;
	await nextTick();
	scrollToBottom('smooth');
});

/**
 * Emits composer changes from the shared textarea composer.
 *
 * @param {string} value Controlled composer value.
 * @returns {void}
 */
function updateComposer(value) {
	emit('update:modelValue', value);
}

/**
 * Emits the current composer content if the component can submit.
 *
 * @returns {void}
 */
function submitComposer() {
	const content = props.modelValue.trim();
	if (!content || !canSubmit.value) return;
	emit('submit', {
		content,
		mode: props.mode,
		conversation: props.conversation,
	});
}

/**
 * Emits a stream stop request for the active conversation.
 *
 * @returns {void}
 */
function stopStreaming() {
	emit('stop', { conversation: props.conversation });
}

/**
 * Changes the active input mode.
 *
 * @param {'text'|'audio'} mode Input mode.
 * @returns {void}
 */
function setMode(mode) {
	emit('update:mode', mode === 'audio' ? 'audio' : 'text');
}

/**
 * Tracks whether the message list is close enough to the bottom for autoscroll.
 *
 * @returns {void}
 */
function updateScrollState() {
	const element = scroller.value;
	if (!element) return;
	isPinnedToBottom.value = element.scrollHeight - element.scrollTop - element.clientHeight < 96;
}

/**
 * Scrolls the message viewport to the latest message.
 *
 * @param {'auto'|'smooth'} behavior Browser scroll behavior.
 * @returns {void}
 */
function scrollToBottom(behavior = 'smooth') {
	const element = scroller.value;
	if (!element) return;
	element.scrollTo({ top: element.scrollHeight, behavior });
	isPinnedToBottom.value = true;
	emit('scroll-bottom', { conversation: props.conversation });
}

/**
 * Emits a generic action from a tool renderer.
 *
 * @param {string} action Action name.
 * @param {AgentChatMessagePart} tool Tool part.
 * @param {AgentChatMessage} message Parent message.
 * @returns {void}
 */
function emitToolAction(action, tool, message) {
	emit('tool-action', { action, tool, message });
}

/**
 * Returns the ordered parts for a message, falling back to plain text content.
 *
 * @param {AgentChatMessage} message Message record.
 * @returns {Array<AgentChatMessagePart>} Normalized parts.
 */
function partsForMessage(message) {
	if (Array.isArray(message.parts) && message.parts.length) return message.parts;
	if (!message.content) return [];
	return [{ type: 'text', text: message.content }];
}

/**
 * Returns text paragraphs that preserve blank-line breaks without HTML injection.
 *
 * @param {string} text Text content.
 * @returns {Array<string>} Paragraph strings.
 */
function textParagraphs(text) {
	return String(text || '')
		.split(/\n{2,}/)
		.map(trimText)
		.filter(Boolean);
}

/**
 * Resolves the Vue component for a tool part.
 *
 * @param {AgentChatMessagePart} tool Tool part.
 * @returns {object|Function|string|null} Custom renderer component.
 */
function toolComponentFor(tool) {
	if (!tool || typeof tool !== 'object') return null;
	return props.toolComponents[tool.rendererKey] || props.toolComponents[tool.name] || null;
}

/**
 * Returns a compact JSON string for tool arguments or results.
 *
 * @param {unknown} value Value to serialize.
 * @returns {string} Pretty JSON.
 */
function formatJson(value) {
	if (value == null) return '{}';
	try {
		return JSON.stringify(value, null, '\t');
	} catch {
		return String(value);
	}
}

/**
 * Resolves the visible author name for a message.
 *
 * @param {AgentChatMessage} message Message record.
 * @returns {string} Display name.
 */
function authorName(message) {
	if (message.authorName) return message.authorName;
	if (message.role === 'user') return 'You';
	if (message.role === 'system') return 'System';
	return findAgentById(props.agents, message.agentId)?.name || activeAgent.value?.name || 'Assistant';
}

/**
 * Resolves the timestamp label for a message.
 *
 * @param {AgentChatMessage} message Message record.
 * @returns {string} Locale time label.
 */
function messageTime(message) {
	if (!message.createdAt) return '';
	const date = new Date(message.createdAt);
	if (Number.isNaN(date.getTime())) return '';
	return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);
}

/**
 * Checks whether a message should align as user-authored content.
 *
 * @param {AgentChatMessage} message Message record.
 * @returns {boolean} True for user messages.
 */
function isUserMessage(message) {
	return message.role === 'user';
}

/**
 * Checks whether a message contains a streaming status.
 *
 * @param {AgentChatMessage} message Message record.
 * @returns {boolean} True while the message is streaming.
 */
function isStreamingMessage(message) {
	return message.status === 'streaming';
}

/**
 * Returns accessible text for a tool status.
 *
 * @param {string} status Tool status.
 * @returns {string} Status label.
 */
function toolStatusLabel(status) {
	return {
		queued: 'Queued',
		running: 'Running',
		complete: 'Complete',
		error: 'Error',
		cancelled: 'Cancelled',
	}[status] || 'Ready';
}

/**
 * Returns the status pill tone for a tool part.
 *
 * @param {string} status Tool status.
 * @returns {'neutral'|'info'|'success'|'danger'} Status pill tone.
 */
function toolStatusTone(status) {
	return {
		running: 'info',
		complete: 'success',
		error: 'danger',
	}[status] || 'neutral';
}

/**
 * Resolves the avatar image for a message author.
 *
 * @param {AgentChatMessage} message Message record.
 * @returns {string} Avatar URL.
 */
function avatarUrl(message) {
	return (findAgentById(props.agents, message.agentId) || activeAgent.value)?.avatarUrl || '';
}

/**
 * Finds an agent by id from the supplied agent collection.
 *
 * @param {Array<AgentChatAgent>} agents Agent collection.
 * @param {string} id Agent id.
 * @returns {AgentChatAgent|null} Matching agent.
 */
function findAgentById(agents, id) {
	return agents.find((agent) => agent.id === id) || null;
}

/**
 * Checks whether a message should be rendered.
 *
 * @param {AgentChatMessage} message Message record.
 * @returns {boolean} True when the message has an id and visible role.
 */
function isVisibleMessage(message) {
	return Boolean(message?.id && ['user', 'assistant', 'system', 'tool'].includes(message.role));
}

/**
 * Returns a stable signature for the last message content.
 *
 * @param {Array<AgentChatMessage>} messages Message collection.
 * @returns {string} Last message signature.
 */
function lastMessageSignature(messages) {
	const message = messages[messages.length - 1];
	if (!message) return '';
	return `${message.id}:${message.status}:${JSON.stringify(message.parts || message.content || '')}`;
}

/**
 * Resolves a status tone for the header status pill.
 *
 * @param {string} status Conversation status.
 * @returns {'neutral'|'info'|'success'|'warning'|'danger'} Status pill tone.
 */
function statusToneFor(status) {
	return {
		streaming: 'info',
		waiting: 'warning',
		error: 'danger',
		complete: 'success',
	}[status] || 'neutral';
}

/**
 * Trims text while preserving a function reference for array mapping.
 *
 * @param {string} value Source text.
 * @returns {string} Trimmed text.
 */
function trimText(value) {
	return String(value || '').trim();
}
</script>


<template>
	<section
		class="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-canvas text-canvas-fg shadow-sm"
		:aria-labelledby="titleId"
	>
		<header v-if="showHeader" class="flex h-14 shrink-0 items-center gap-2 border-b border-border/70 px-3 sm:px-4">
			<slot name="header-leading" :conversation="conversation" :active-agent="activeAgent" />
			<div class="min-w-0 flex-1">
				<div class="flex min-w-0 items-center gap-2">
					<h2 :id="titleId" class="truncate text-sm font-semibold tracking-tight text-canvas-fg">{{ conversationTitle }}</h2>
					<DomStatusPill class="hidden shrink-0 capitalize sm:inline-flex" size="sm" :tone="statusTone" :pulse="streaming">{{ streaming ? 'Streaming' : (conversation?.status || 'Idle') }}</DomStatusPill>
				</div>
				<p class="truncate text-xs text-muted-fg">{{ conversationSummary }}</p>
			</div>
			<div class="flex shrink-0 items-center gap-1.5">
				<DomToggleButtonGroup
					:model-value="mode"
					:options="modeOptions"
					:chrome="false"
					label="Input mode"
					size="sm"
					variant="switch"
					@update:model-value="setMode"
				/>
				<slot name="header-actions" :conversation="conversation" :active-agent="activeAgent" :streaming="streaming" />
			</div>
		</header>

		<div
			ref="scroller"
			class="min-h-0 flex-1 overflow-y-auto"
			@scroll.passive="updateScrollState"
		>
			<div class="mx-auto flex min-h-full w-full flex-col px-4 py-6 sm:px-6" :style="columnStyle">
				<div v-if="loading" class="mt-auto flex flex-col gap-8">
					<div v-for="index in 2" :key="index" class="flex flex-col gap-8">
						<DomSkeleton class="ml-auto h-10 w-2/5 rounded-2xl" />
						<div class="flex gap-3">
							<DomSkeleton variant="circle" width="2rem" height="2rem" class="shrink-0" />
							<DomSkeleton class="flex-1" variant="text" :lines="3" />
						</div>
					</div>
				</div>

				<slot v-else-if="!visibleMessages.length" name="empty">
					<div class="flex flex-1 items-center justify-center">
						<DomEmptyState
							class="w-full max-w-sm border-transparent bg-transparent"
							size="sm"
							title="No messages yet"
							:description="emptyText"
							icon="M7 8h10M7 12h6m-9 8 2.6-3H18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14Z"
						/>
					</div>
				</slot>

				<div v-else class="flex flex-col gap-7">
					<article
						v-for="message in visibleMessages"
						:key="message.id"
						class="flex min-w-0 gap-3"
						:class="isUserMessage(message) ? 'justify-end' : 'justify-start'"
					>
						<DomAvatar
							v-if="!isUserMessage(message)"
							class="mt-0.5 hidden sm:inline-grid"
							size="sm"
							shape="rounded"
							:src="avatarUrl(message)"
							:name="authorName(message)"
						/>

						<slot name="message" :message="message" :active-agent="activeAgent" :parts="partsForMessage(message)">
							<div
								class="flex min-w-0 flex-col"
								:class="isUserMessage(message) ? 'max-w-[85%] items-end' : 'flex-1'"
							>
								<div v-if="!isUserMessage(message)" class="mb-1 flex h-6 items-center gap-2 text-xs">
									<span class="font-semibold text-canvas-fg">{{ authorName(message) }}</span>
									<span v-if="messageTime(message)" class="text-muted-fg">{{ messageTime(message) }}</span>
								</div>

								<div
									class="min-w-0 space-y-3 text-sm"
									:class="isUserMessage(message)
										? 'rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 leading-6 text-secondary-fg'
										: 'leading-7 text-canvas-fg'"
								>
									<template v-for="(part, index) in partsForMessage(message)" :key="part.id || `${message.id}-${index}`">
										<div v-if="part.type === 'text'" class="space-y-3">
											<p v-for="paragraph in textParagraphs(part.text)" :key="paragraph" class="whitespace-pre-wrap">{{ paragraph }}</p>
										</div>

										<details
											v-else-if="part.type === 'reasoning' && showReasoning"
											class="group/reasoning"
											:open="part.open"
										>
											<summary class="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md text-xs font-medium text-muted-fg transition hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
												<svg viewBox="0 0 24 24" class="size-3.5" fill="none" aria-hidden="true">
													<path d="M12 3v3m0 12v3M3 12h3m12 0h3M6.3 6.3l2.1 2.1m7.2 7.2 2.1 2.1m0-11.4-2.1 2.1m-7.2 7.2-2.1 2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
												</svg>
												Reasoning
												<svg viewBox="0 0 24 24" class="size-3.5 transition group-open/reasoning:rotate-90" fill="none" aria-hidden="true">
													<path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
												</svg>
											</summary>
											<p class="mt-2 whitespace-pre-wrap border-l-2 border-border pl-3 text-xs leading-5 text-muted-fg">{{ part.text }}</p>
										</details>

										<div v-else-if="part.type === 'audio'" class="flex items-center gap-3 rounded-xl bg-secondary/70 p-2.5 pr-4 text-secondary-fg">
											<span class="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-fg">
												<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
													<path d="M12 4a3 3 0 0 0-3 3v5a3 3 0 1 0 6 0V7a3 3 0 0 0-3-3Zm-6 8a6 6 0 0 0 12 0m-6 6v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
												</svg>
											</span>
											<div class="min-w-0 flex-1">
												<p class="text-xs font-medium">{{ part.label || 'Audio message' }}</p>
												<div class="mt-1 flex h-5 items-center gap-0.5" aria-hidden="true">
													<span v-for="bar in 28" :key="bar" class="w-0.5 rounded-full bg-current opacity-40" :style="{ height: `${4 + ((bar * 7) % 16)}px` }"></span>
												</div>
												<p v-if="part.text" class="mt-1 text-xs leading-5 text-muted-fg">{{ part.text }}</p>
											</div>
										</div>

										<div
											v-else-if="part.type === 'tool-call' || part.type === 'tool-result'"
											class="overflow-hidden rounded-xl border border-border bg-canvas text-canvas-fg shadow-xs"
										>
											<slot
												name="tool"
												:tool="part"
												:message="message"
												:component="toolComponentFor(part)"
												:action="(action) => emitToolAction(action, part, message)"
											>
												<component
													:is="toolComponentFor(part)"
													v-if="toolComponentFor(part)"
													:tool="part"
													:message="message"
													:result="part.result"
													@action="emitToolAction($event, part, message)"
												/>
												<details v-else class="group/tool">
													<summary class="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 transition hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
														<span class="grid size-7 shrink-0 place-items-center rounded-lg bg-secondary text-muted-fg">
															<svg viewBox="0 0 24 24" class="size-3.5" fill="none" aria-hidden="true">
																<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8V20h3.2l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.3-.7-.7-2.3 2.5-2.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
															</svg>
														</span>
														<span class="min-w-0 flex-1">
															<span class="block truncate text-sm font-medium leading-5">{{ part.label || part.name || 'Tool call' }}</span>
															<span class="block truncate font-mono text-[11px] leading-4 text-muted-fg">{{ part.name || 'tool' }}</span>
														</span>
														<DomStatusPill class="shrink-0" size="sm" :tone="toolStatusTone(part.status)" :pulse="part.status === 'running'">{{ toolStatusLabel(part.status) }}</DomStatusPill>
														<svg viewBox="0 0 24 24" class="size-4 shrink-0 text-muted-fg transition group-open/tool:rotate-90" fill="none" aria-hidden="true">
															<path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
														</svg>
													</summary>
													<div class="grid gap-3 border-t border-border bg-secondary/30 p-3 md:grid-cols-2">
														<div class="min-w-0">
															<p class="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-fg">Arguments</p>
															<pre class="max-h-40 overflow-auto rounded-lg bg-canvas p-2.5 font-mono text-xs leading-5 text-muted-fg ring-1 ring-border">{{ formatJson(part.args) }}</pre>
														</div>
														<div class="min-w-0">
															<p class="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-fg">Result</p>
															<pre class="max-h-40 overflow-auto rounded-lg bg-canvas p-2.5 font-mono text-xs leading-5 text-muted-fg ring-1 ring-border">{{ formatJson(part.result) }}</pre>
														</div>
													</div>
												</details>
											</slot>
										</div>

										<div v-else-if="part.type === 'handoff'" class="flex gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5">
											<svg viewBox="0 0 24 24" class="mt-0.5 size-4 shrink-0 text-warning" fill="none" aria-hidden="true">
												<path d="M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3-3m-3 3 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
											</svg>
											<div class="min-w-0">
												<p class="text-xs font-semibold text-canvas-fg">{{ part.label || 'Agent handoff' }}</p>
												<p class="mt-0.5 text-xs leading-5 text-muted-fg">{{ part.text }}</p>
											</div>
										</div>
									</template>

									<div v-if="isStreamingMessage(message)" class="flex h-6 items-center gap-1 text-muted-fg" role="status" aria-label="Assistant is typing">
										<span class="size-1.5 animate-pulse rounded-full bg-current"></span>
										<span class="size-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]"></span>
										<span class="size-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]"></span>
									</div>
								</div>

								<span v-if="isUserMessage(message) && messageTime(message)" class="mt-1 px-1 text-[11px] text-muted-fg">{{ messageTime(message) }}</span>
							</div>
						</slot>
					</article>
				</div>
			</div>
		</div>

		<div v-if="shouldShowJumpButton" class="pointer-events-none relative">
			<DomIconButton
				class="pointer-events-auto absolute bottom-3 left-1/2 z-10 -translate-x-1/2 shadow-md"
				label="Jump to latest message"
				size="sm"
				variant="secondary"
				icon="M12 5v14M18 13l-6 6-6-6"
				@click="scrollToBottom('smooth')"
			/>
		</div>

		<footer v-if="showFooter" class="relative shrink-0 px-3 pb-3 sm:px-4 sm:pb-4 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-6 before:bg-linear-to-t before:from-canvas before:to-transparent">
			<slot name="footer" :value="modelValue" :mode="mode" :submit="submitComposer" :set-mode="setMode">
				<div class="mx-auto w-full [--skin-input-shadow:var(--shadow-md)] [&_.skin-input]:rounded-2xl" :style="columnStyle">
					<DomTextareaComposer
						:model-value="modelValue"
						:placeholder="composerPlaceholder"
						:disabled="disabled || streaming"
						:submit-disabled="!canSubmit"
						:show-submit="!streaming"
						:rows="1"
						:max-rows="8"
						:chrome="false"
						@update:model-value="updateComposer"
						@submit="submitComposer"
					>
						<template v-if="$slots['composer-attachments']" #attachments>
							<slot name="composer-attachments" :mode="mode" :disabled="disabled" :streaming="streaming" />
						</template>
						<template v-if="$slots['composer-leading']" #leading>
							<slot name="composer-leading" :mode="mode" :set-mode="setMode" :disabled="disabled" :streaming="streaming" />
						</template>
						<template #actions>
							<slot name="composer-actions" :mode="mode" :set-mode="setMode" :disabled="disabled" :streaming="streaming" />
							<DomIconButton
								v-if="streaming"
								label="Stop streaming"
								variant="danger"
								icon="M8 8h8v8H8z"
								@click="stopStreaming"
							/>
						</template>
					</DomTextareaComposer>
					<div class="mt-2 flex items-center justify-between gap-2 px-2 text-[11px] text-muted-fg">
						<span class="hidden truncate sm:inline">{{ mode === 'audio' ? 'Audio handoff ready' : 'Enter to send · Shift + Enter for a new line' }}</span>
						<span v-if="activeAgent?.model" class="ml-auto shrink-0 whitespace-nowrap font-mono">{{ activeAgent.model }}</span>
					</div>
				</div>
			</slot>
		</footer>
	</section>
</template>
