<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import DomAgentChatShell from '../../data/agent-chat/DomAgentChatShell.vue';
import DomCard from '../../visual/card/DomCard.vue';
import WeatherToolCard from '../../data/agent-chat/examples/WeatherToolCard.vue';
import { useAgentChatDemoStore } from '../../data/agent-chat/examples/useAgentChatDemoStore.js';

/** The real agent chat on the homepage, answering from the docs demo's mock API. */
const store = useAgentChatDemoStore();
const { agents, conversations, activeConversationId, activeConversation, activeMessages, input, mode, search, loading, streaming, sidebarOpen, asideOpen, sidebarSize, asideSize } = storeToRefs(store);
const toolComponents = { weather: WeatherToolCard, get_weather: WeatherToolCard };

onMounted(() => {
	store.setAsideOpen(false);
	store.load();
});
</script>

<template>
	<DomCard padding="none" class="h-[640px] shadow-xl shadow-canvas-fg/5">
		<DomAgentChatShell
			class="rounded-none! border-0! shadow-none!"
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
			@new-conversation="store.createConversation({ title: 'New agent thread' })"
			@submit="store.sendMessage"
			@stop="store.stopStreaming"
			@tool-action="store.handleToolAction"
		/>
	</DomCard>
</template>
