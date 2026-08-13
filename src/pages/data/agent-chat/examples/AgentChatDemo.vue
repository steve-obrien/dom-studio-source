<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import DomAgentChatShell from '../DomAgentChatShell.vue';
import DomButton from '../../../components/button/DomButton.vue';
import DomStatusPill from '../../../visual/status-pill/DomStatusPill.vue';
import WeatherToolCard from './WeatherToolCard.vue';
import { useAgentChatDemoStore } from './useAgentChatDemoStore.js';

const store = useAgentChatDemoStore();
const {
	agents,
	conversations,
	activeConversationId,
	activeConversation,
	activeMessages,
	activeAgent,
	input,
	mode,
	search,
	loading,
	streaming,
	sidebarOpen,
	asideOpen,
	sidebarSize,
	asideSize,
	requestLog,
	lastRequest,
	lastResponse,
} = storeToRefs(store);

const toolComponents = {
	weather: WeatherToolCard,
	get_weather: WeatherToolCard,
};
const lastRequestPreview = computed(() => formatJson(lastRequest.value?.payload || {}));
const lastResponsePreview = computed(() => formatJson(lastResponse.value || {}));

onMounted(loadDemo);

/**
 * Loads the initial demo data.
 *
 * @returns {void}
 */
function loadDemo() {
	store.load();
}

/**
 * Selects a conversation from the shell sidebar.
 *
 * @param {Record<string, unknown>} conversation Conversation summary.
 * @returns {void}
 */
function selectConversation(conversation) {
	store.selectConversation(conversation);
}

/**
 * Creates a new conversation through the demo store.
 *
 * @returns {void}
 */
function createConversation() {
	store.createConversation({ title: 'New FlexAI agent thread' });
}

/**
 * Sends a prompt through the demo store.
 *
 * @param {{ content: string, mode: 'text'|'audio' }} payload Submit payload.
 * @returns {void}
 */
function submitMessage(payload) {
	store.sendMessage(payload);
}

/**
 * Serializes API payload previews.
 *
 * @param {unknown} value Value to serialize.
 * @returns {string} JSON preview.
 */
function formatJson(value) {
	try {
		return JSON.stringify(value || {}, null, '\t');
	} catch {
		return String(value);
	}
}
</script>

<template>
	<div class="w-full min-w-0 space-y-4">
		<div class="h-[720px] min-h-[620px] w-full min-w-0 overflow-hidden rounded-lg border border-border bg-secondary/20 p-2">
			<DomAgentChatShell
				:model-value="input"
				:conversations="conversations"
				:conversation="activeConversation"
				:messages="activeMessages"
				:agents="agents"
				:active-conversation-id="activeConversationId"
				:mode="mode"
				:search="search"
				:loading="loading"
				:streaming="streaming"
				:sidebar-open="sidebarOpen"
				:aside-open="asideOpen"
				:sidebar-size="sidebarSize"
				:aside-size="asideSize"
				:tool-components="toolComponents"
				@update:model-value="store.setInput"
				@update:mode="store.setMode"
				@update:search="store.setSearch"
				@update:sidebar-open="store.setSidebarOpen"
				@update:aside-open="store.setAsideOpen"
				@update:sidebar-size="store.setSidebarSize"
				@update:aside-size="store.setAsideSize"
				@select-conversation="selectConversation"
				@new-conversation="createConversation"
				@submit="submitMessage"
				@stop="store.stopStreaming"
				@tool-action="store.handleToolAction"
			/>
		</div>

		<div class="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
			<div class="rounded-lg border border-border bg-canvas p-4">
				<div class="flex items-start justify-between gap-3">
					<div>
						<p class="text-xs font-semibold uppercase text-muted-fg">Demo API</p>
						<h3 class="mt-1 text-sm font-semibold text-canvas-fg">Last request and response</h3>
					</div>
					<DomStatusPill size="sm" :tone="streaming ? 'info' : 'neutral'">{{ streaming ? 'streaming' : 'idle' }}</DomStatusPill>
				</div>
				<div class="mt-4 grid gap-3 md:grid-cols-2">
					<div class="min-w-0">
						<p class="mb-2 text-xs font-semibold text-muted-fg">Request</p>
						<pre class="max-h-56 overflow-auto rounded-md border border-border bg-secondary/25 p-3 text-xs leading-5 text-muted-fg">{{ lastRequestPreview }}</pre>
					</div>
					<div class="min-w-0">
						<p class="mb-2 text-xs font-semibold text-muted-fg">Response</p>
						<pre class="max-h-56 overflow-auto rounded-md border border-border bg-secondary/25 p-3 text-xs leading-5 text-muted-fg">{{ lastResponsePreview }}</pre>
					</div>
				</div>
			</div>

			<div class="rounded-lg border border-border bg-canvas p-4">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="text-xs font-semibold uppercase text-muted-fg">Active agent</p>
						<h3 class="mt-1 truncate text-sm font-semibold text-canvas-fg">{{ activeAgent?.name || 'Loading agent' }}</h3>
					</div>
					<DomButton size="sm" variant="secondary" :disabled="streaming" @click="store.setMode(mode === 'audio' ? 'text' : 'audio')">
						{{ mode === 'audio' ? 'Use text' : 'Use audio' }}
					</DomButton>
				</div>
				<p class="mt-3 text-sm leading-6 text-muted-fg">{{ activeAgent?.role || 'The selected conversation controls this panel.' }}</p>
				<div class="mt-4 flex flex-wrap gap-2">
					<span
						v-for="tool in activeAgent?.tools || []"
						:key="tool"
						class="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-muted-fg"
					>
						{{ tool }}
					</span>
				</div>
			</div>
		</div>

		<div class="min-w-0 rounded-lg border border-border bg-canvas p-4">
			<p class="text-xs font-semibold uppercase text-muted-fg">Request log</p>
			<div class="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
				<div
					v-for="entry in requestLog"
					:key="entry.id"
					class="rounded-md border border-border bg-secondary/25 p-3"
				>
					<div class="flex items-center justify-between gap-2">
						<p class="truncate text-xs font-semibold text-canvas-fg">{{ entry.method }} {{ entry.url }}</p>
						<span class="text-[11px] text-muted-fg">{{ entry.status }}</span>
					</div>
					<p class="mt-1 truncate text-[11px] text-muted-fg">{{ entry.requestedAt }}</p>
				</div>
			</div>
		</div>
	</div>
</template>
