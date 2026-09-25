<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import DomAgentChatShell from '../data/agent-chat/DomAgentChatShell.vue';
import WeatherToolCard from '../data/agent-chat/examples/WeatherToolCard.vue';
import { useAgentChatDemoStore } from '../data/agent-chat/examples/useAgentChatDemoStore.js';

const store = useAgentChatDemoStore();
const { input, conversations, activeConversation, activeMessages, agents, activeConversationId, mode, search, loading, streaming, sidebarOpen, asideOpen, sidebarSize, asideSize } = storeToRefs(store);
const toolComponents = { weather: WeatherToolCard, get_weather: WeatherToolCard };

/** Loads deterministic conversations from the example's local mock API. @returns {void} */
function loadDemo() { store.load(); }
/** Creates a local demo conversation without a remote AI request. @returns {void} */
function createConversation() { store.createConversation({ title: 'My next great idea' }); }

onMounted(loadDemo);
</script>

<template>
	<div class="h-[36rem] min-w-0">
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
				@select-conversation="store.selectConversation"
				@new-conversation="createConversation"
				@submit="store.sendMessage"
				@stop="store.stopStreaming"
				@tool-action="store.handleToolAction"
			/>
	</div>
</template>
