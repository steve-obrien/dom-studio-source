<script>
export const agentChatShellProps = {
	conversations: {
		type: Array,
		default: () => [],
		_edit: { description: 'Conversation summaries for the sidebar.' },
	},
	conversation: {
		type: Object,
		default: null,
		_edit: { description: 'Active conversation record.' },
	},
	messages: {
		type: Array,
		default: () => [],
		_edit: { description: 'Messages for the active conversation.' },
	},
	agents: {
		type: Array,
		default: () => [],
		_edit: { description: 'Agents available to the chat shell.' },
	},
	activeConversationId: {
		type: String,
		default: '',
		_edit: { description: 'Selected conversation id.' },
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
		_edit: { options: ['text', 'audio'], description: 'Active composer mode.' },
	},
	search: {
		type: String,
		default: '',
		_edit: { description: 'Controlled sidebar search value.' },
	},
	streaming: {
		type: Boolean,
		default: false,
		_edit: { description: 'Whether the active assistant response is streaming.' },
	},
	loading: {
		type: Boolean,
		default: false,
		_edit: { description: 'Whether active conversation messages are loading.' },
	},
	sidebarOpen: {
		type: Boolean,
		default: true,
		_edit: { description: 'Controls the conversation sidebar visibility.' },
	},
	asideOpen: {
		type: Boolean,
		default: true,
		_edit: { description: 'Controls the contextual aside visibility.' },
	},
	sidebarSize: {
		type: Number,
		default: 300,
		_edit: { description: 'Resizable sidebar width in pixels.' },
	},
	asideSize: {
		type: Number,
		default: 340,
		_edit: { description: 'Resizable aside width in pixels.' },
	},
	minSidebar: {
		type: Number,
		default: 240,
		_edit: { description: 'Minimum sidebar width while open.' },
	},
	minConversation: {
		type: Number,
		default: 420,
		_edit: { description: 'Minimum center conversation width.' },
	},
	minAside: {
		type: Number,
		default: 280,
		_edit: { description: 'Minimum aside width while open.' },
	},
	toolComponents: {
		type: Object,
		default: () => ({}),
		_edit: { description: 'Tool renderer component map passed through to DomAgentConversation.' },
	},
	title: {
		type: String,
		default: 'Agent workspace',
		_edit: { description: 'Accessible label for the chat application shell.' },
	},
};
</script>

<script setup>
import { computed, useId } from 'vue';
import DomIconButton from '../../components/icon-button/DomIconButton.vue';
import DomSplitterPanel from '../../components/splitter-panel/DomSplitterPanel.vue';
import DomStatusPill from '../../visual/status-pill/DomStatusPill.vue';
import DomAgentConversation from './DomAgentConversation.vue';
import DomAgentConversationList from './DomAgentConversationList.vue';

defineOptions({
	__doc: {
		nav: { section: 'ai', primary: true },
		name: 'Agent chat shell',
		tag: '<DomAgentChatShell>',
		description: 'A three-pane AI chat application shell with a resizable conversation sidebar, scroll-contained conversation window, closable context aside, streaming tool calls, and audio/text handoff controls.',
		icon: 'M4 5h5v14H4V5Zm7 0h9v14h-9V5Zm2 3h5M13 12h5M13 16h3',
		events: [
			{ name: 'update:modelValue', payload: 'string', description: 'Passes composer updates from the conversation component.' },
			{ name: 'update:mode', payload: '\'text\' | \'audio\'', description: 'Passes audio/text mode changes from the conversation component.' },
			{ name: 'update:search', payload: 'string', description: 'Passes sidebar search updates.' },
			{ name: 'update:sidebarOpen', payload: 'boolean', description: 'Fired when the sidebar is opened or closed.' },
			{ name: 'update:asideOpen', payload: 'boolean', description: 'Fired when the aside is opened or closed.' },
			{ name: 'update:sidebarSize', payload: 'number', description: 'Fired when the sidebar splitter changes width.' },
			{ name: 'update:asideSize', payload: 'number', description: 'Fired when the aside splitter changes width.' },
			{ name: 'select-conversation', payload: 'conversation', description: 'Fired when a sidebar row is selected.' },
			{ name: 'new-conversation', payload: 'undefined', description: 'Fired when the sidebar new button is activated.' },
			{ name: 'submit', payload: '({ content, mode, conversation })', description: 'Fired when the composer submits.' },
			{ name: 'stop', payload: '({ conversation })', description: 'Fired when streaming is stopped.' },
			{ name: 'tool-action', payload: '({ action, tool, message })', description: 'Fired by generic or custom tool renderers.' },
		],
		slots: [
			{ name: 'sidebar', payload: '{ conversations, activeConversationId }', description: 'Replace the conversation sidebar.' },
			{ name: 'conversation', payload: '{ conversation, messages, activeAgent }', description: 'Replace the main conversation component.' },
			{ name: 'aside', payload: '{ conversation, activeAgent, toolParts }', description: 'Replace the contextual aside.' },
		],
	},
});

const props = defineProps(agentChatShellProps);
const emit = defineEmits([
	'update:modelValue',
	'update:mode',
	'update:search',
	'update:sidebarOpen',
	'update:asideOpen',
	'update:sidebarSize',
	'update:asideSize',
	'select-conversation',
	'new-conversation',
	'submit',
	'stop',
	'tool-action',
]);

const shellId = useId();

const activeAgent = computed(() => findAgentById(props.agents, props.conversation?.agentId));
const toolParts = computed(() => collectToolParts(props.messages));
const sidebarSizeValue = computed(() => props.sidebarOpen ? props.sidebarSize : 0);
const sidebarMinimum = computed(() => props.sidebarOpen ? props.minSidebar : 0);
const asideMinimum = computed(() => props.asideOpen ? props.minAside : 0);

/**
 * Emits a sidebar visibility update.
 *
 * @param {boolean} value Visibility state.
 * @returns {void}
 */
function setSidebarOpen(value) {
	emit('update:sidebarOpen', Boolean(value));
}

/**
 * Emits an aside visibility update.
 *
 * @param {boolean} value Visibility state.
 * @returns {void}
 */
function setAsideOpen(value) {
	emit('update:asideOpen', Boolean(value));
}

/**
 * Toggles the conversation sidebar.
 *
 * @returns {void}
 */
function toggleSidebar() {
	setSidebarOpen(!props.sidebarOpen);
}

/**
 * Toggles the contextual aside.
 *
 * @returns {void}
 */
function toggleAside() {
	setAsideOpen(!props.asideOpen);
}

/**
 * Emits a sidebar size update from the splitter.
 *
 * @param {number} value Sidebar width in pixels.
 * @returns {void}
 */
function updateSidebarSize(value) {
	if (!props.sidebarOpen) return;
	emit('update:sidebarSize', value);
}

/**
 * Emits an aside size update from the splitter.
 *
 * @param {number} value Aside width in pixels.
 * @returns {void}
 */
function updateAsideSize(value) {
	if (!props.asideOpen) return;
	emit('update:asideSize', value);
}

/**
 * Passes a selected conversation up to the shell owner.
 *
 * @param {Record<string, unknown>} conversation Conversation record.
 * @returns {void}
 */
function selectConversation(conversation) {
	emit('select-conversation', conversation);
}

/**
 * Passes a new conversation request to the shell owner.
 *
 * @returns {void}
 */
function createConversation() {
	emit('new-conversation');
}

/**
 * Emits a composer value update.
 *
 * @param {string} value Composer value.
 * @returns {void}
 */
function updateComposer(value) {
	emit('update:modelValue', value);
}

/**
 * Emits a composer mode update.
 *
 * @param {'text'|'audio'} value Composer mode.
 * @returns {void}
 */
function updateMode(value) {
	emit('update:mode', value);
}

/**
 * Emits a sidebar search update.
 *
 * @param {string} value Search value.
 * @returns {void}
 */
function updateSearch(value) {
	emit('update:search', value);
}

/**
 * Passes a composer submit event to the shell owner.
 *
 * @param {Record<string, unknown>} payload Submit payload.
 * @returns {void}
 */
function submitMessage(payload) {
	emit('submit', payload);
}

/**
 * Passes a streaming stop event to the shell owner.
 *
 * @param {Record<string, unknown>} payload Stop payload.
 * @returns {void}
 */
function stopStreaming(payload) {
	emit('stop', payload);
}

/**
 * Passes a tool action event to the shell owner.
 *
 * @param {Record<string, unknown>} payload Tool action payload.
 * @returns {void}
 */
function emitToolAction(payload) {
	emit('tool-action', payload);
}

/**
 * Finds an agent by id.
 *
 * @param {Array<Record<string, unknown>>} agents Agent collection.
 * @param {string} id Agent id.
 * @returns {Record<string, unknown>|null} Matching agent.
 */
function findAgentById(agents, id) {
	return agents.find((agent) => agent.id === id) || null;
}

/**
 * Collects tool-call and tool-result parts from message data.
 *
 * @param {Array<Record<string, unknown>>} messages Message collection.
 * @returns {Array<Record<string, unknown>>} Tool parts.
 */
function collectToolParts(messages) {
	const tools = [];
	for (const message of messages) {
		for (const part of Array.isArray(message.parts) ? message.parts : []) {
			if (part.type === 'tool-call' || part.type === 'tool-result') {
				tools.push({ ...part, messageId: message.id });
			}
		}
	}
	return tools;
}

/**
 * Resolves the label shown for an active agent.
 *
 * @returns {string} Agent label.
 */
function activeAgentLabel() {
	return activeAgent.value?.name || 'No agent selected';
}

/**
 * Resolves the model label shown in the aside.
 *
 * @returns {string} Model label.
 */
function activeModelLabel() {
	return activeAgent.value?.model || 'Runtime not set';
}

/**
 * Resolves a status tone for the active conversation.
 *
 * @returns {'neutral'|'info'|'success'|'warning'|'danger'} Status tone.
 */
function conversationStatusTone() {
	return {
		streaming: 'info',
		waiting: 'warning',
		error: 'danger',
		complete: 'success',
	}[props.streaming ? 'streaming' : props.conversation?.status] || 'neutral';
}
</script>

<template>
	<section
		:id="shellId"
		class="h-full min-h-0 w-full min-w-0 overflow-hidden rounded-lg border border-border bg-canvas text-canvas-fg shadow-sm"
		:aria-label="title"
	>
		<div class="hidden h-full min-h-0 md:block">
			<DomSplitterPanel
				class="h-full min-h-0"
				:start-size="sidebarSizeValue"
				:end-size="asideSize"
				:min-start="sidebarMinimum"
				:min-main="minConversation"
				:min-end="asideMinimum"
				:handle-size="8"
				handle-class="transition hover:bg-border/70 data-[dragging=true]:bg-ring/30"
				@update:start-size="updateSidebarSize"
				@update:end-size="updateAsideSize"
			>
				<template #start>
					<slot name="sidebar" :conversations="conversations" :active-conversation-id="activeConversationId">
						<DomAgentConversationList
							v-if="sidebarOpen"
							class="h-full"
							:conversations="conversations"
							:agents="agents"
							:active-conversation-id="activeConversationId"
							:search="search"
							@update:search="updateSearch"
							@select="selectConversation"
							@new="createConversation"
						/>
					</slot>
				</template>

				<slot name="conversation" :conversation="conversation" :messages="messages" :active-agent="activeAgent">
					<DomAgentConversation
						class="h-full rounded-none border-0 shadow-none"
						:conversation="conversation"
						:messages="messages"
						:agents="agents"
						:model-value="modelValue"
						:mode="mode"
						:streaming="streaming"
						:loading="loading"
						:tool-components="toolComponents"
						@update:model-value="updateComposer"
						@update:mode="updateMode"
						@submit="submitMessage"
						@stop="stopStreaming"
						@tool-action="emitToolAction"
					>
						<template #header-leading="{ conversation: headerConversation, activeAgent: headerAgent }">
							<DomIconButton
								:label="sidebarOpen ? 'Close conversations' : 'Open conversations'"
								size="sm"
								variant="ghost"
								:active="sidebarOpen"
								icon="M4 5h6v14H4V5Zm10 2h6M14 12h6M14 17h4"
								@click="toggleSidebar"
							/>
							<span class="sr-only">{{ headerConversation?.title || headerAgent?.name }}</span>
						</template>
						<template #header-actions>
							<DomIconButton
								:label="asideOpen ? 'Close context panel' : 'Open context panel'"
								size="sm"
								variant="ghost"
								:active="asideOpen"
								icon="M5 6h14M5 12h14M5 18h14"
								@click="toggleAside"
							/>
						</template>
					</DomAgentConversation>
				</slot>

				<template v-if="asideOpen" #end>
					<slot name="aside" :conversation="conversation" :active-agent="activeAgent" :tool-parts="toolParts">
						<aside class="flex h-full min-h-0 flex-col bg-canvas">
							<header class="shrink-0 border-b border-border bg-secondary/25 p-4">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="text-xs font-semibold uppercase text-muted-fg">Agent context</p>
										<h2 class="mt-1 truncate text-sm font-semibold text-canvas-fg">{{ activeAgentLabel() }}</h2>
									</div>
									<DomIconButton label="Close context panel" size="sm" variant="ghost" icon="M6 6l12 12M18 6 6 18" @click="setAsideOpen(false)" />
								</div>
							</header>
							<div class="min-h-0 flex-1 overflow-y-auto p-4">
								<div class="rounded-lg border border-border bg-secondary/25 p-4">
									<p class="text-xs font-semibold text-muted-fg">Runtime</p>
									<p class="mt-1 text-sm font-semibold text-canvas-fg">{{ activeModelLabel() }}</p>
									<p class="mt-2 text-sm leading-6 text-muted-fg">{{ activeAgent?.role || 'Connect an agent to show instructions, tools, and memory context here.' }}</p>
								</div>

								<div class="mt-4 rounded-lg border border-border p-4">
									<div class="flex items-center justify-between gap-3">
										<p class="text-xs font-semibold uppercase text-muted-fg">Conversation</p>
										<DomStatusPill size="sm" :tone="conversationStatusTone()">{{ streaming ? 'streaming' : (conversation?.status || 'idle') }}</DomStatusPill>
									</div>
									<dl class="mt-3 grid grid-cols-2 gap-3 text-sm">
										<div>
											<dt class="text-xs text-muted-fg">Messages</dt>
											<dd class="font-semibold text-canvas-fg">{{ messages.length }}</dd>
										</div>
										<div>
											<dt class="text-xs text-muted-fg">Tools</dt>
											<dd class="font-semibold text-canvas-fg">{{ toolParts.length }}</dd>
										</div>
									</dl>
								</div>

								<div class="mt-4 rounded-lg border border-border p-4">
									<p class="text-xs font-semibold uppercase text-muted-fg">Tool calls</p>
									<div v-if="toolParts.length" class="mt-3 space-y-2">
										<div
											v-for="tool in toolParts"
											:key="`${tool.messageId}-${tool.id || tool.name}`"
											class="rounded-md border border-border bg-secondary/25 p-3"
										>
											<div class="flex items-start justify-between gap-2">
												<p class="min-w-0 truncate text-sm font-semibold text-canvas-fg">{{ tool.label || tool.name }}</p>
												<span class="shrink-0 text-xs text-muted-fg">{{ tool.status || 'ready' }}</span>
											</div>
											<p class="mt-1 truncate text-xs text-muted-fg">{{ tool.name }}</p>
										</div>
									</div>
									<p v-else class="mt-3 text-sm leading-6 text-muted-fg">Tool activity appears here as the agent works.</p>
								</div>

								<div class="mt-4 rounded-lg border border-border p-4">
									<p class="text-xs font-semibold uppercase text-muted-fg">Available tools</p>
									<div v-if="activeAgent?.tools?.length" class="mt-3 flex flex-wrap gap-2">
										<span
											v-for="tool in activeAgent.tools"
											:key="tool"
											class="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-muted-fg"
										>
											{{ tool }}
										</span>
									</div>
									<p v-else class="mt-3 text-sm leading-6 text-muted-fg">No tool manifest supplied.</p>
								</div>
							</div>
						</aside>
					</slot>
				</template>
			</DomSplitterPanel>
		</div>

		<div class="flex h-full min-h-0 flex-col md:hidden">
			<div v-if="sidebarOpen" class="max-h-64 shrink-0 overflow-hidden border-b border-border">
				<DomAgentConversationList
					class="h-64"
					:conversations="conversations"
					:agents="agents"
					:active-conversation-id="activeConversationId"
					:search="search"
					@update:search="updateSearch"
					@select="selectConversation"
					@new="createConversation"
				/>
			</div>
			<DomAgentConversation
				class="min-h-0 flex-1 rounded-none border-0 shadow-none"
				:conversation="conversation"
				:messages="messages"
				:agents="agents"
				:model-value="modelValue"
				:mode="mode"
				:streaming="streaming"
				:loading="loading"
				:tool-components="toolComponents"
				@update:model-value="updateComposer"
				@update:mode="updateMode"
				@submit="submitMessage"
				@stop="stopStreaming"
				@tool-action="emitToolAction"
			>
				<template #header-leading>
					<DomIconButton
						:label="sidebarOpen ? 'Close conversations' : 'Open conversations'"
						size="sm"
						variant="ghost"
						:active="sidebarOpen"
						icon="M4 5h6v14H4V5Zm10 2h6M14 12h6M14 17h4"
						@click="toggleSidebar"
					/>
				</template>
				<template #header-actions>
					<DomIconButton
						:label="asideOpen ? 'Close context panel' : 'Open context panel'"
						size="sm"
						variant="ghost"
						:active="asideOpen"
						icon="M5 6h14M5 12h14M5 18h14"
						@click="toggleAside"
					/>
				</template>
			</DomAgentConversation>
		</div>
	</section>
</template>
