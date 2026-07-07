<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodePanel from '../../_layout/docs/CodePanel.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import DomAgentChatShell from './DomAgentChatShell.vue';
import DomAgentConversation from './DomAgentConversation.vue';
import DomAgentConversationList from './DomAgentConversationList.vue';
import DomAgentChatShellSrc from './DomAgentChatShell.vue?raw';
import DomAgentConversationSrc from './DomAgentConversation.vue?raw';
import DomAgentConversationListSrc from './DomAgentConversationList.vue?raw';
import AgentChatDemo from './examples/AgentChatDemo.vue';
import AgentChatDemoSrc from './examples/AgentChatDemo.vue?raw';
import StoreSrc from './examples/useAgentChatDemoStore.js?raw';
import MockApiSrc from './examples/agentChatMockApi.js?raw';
import WeatherToolCardSrc from './examples/WeatherToolCard.vue?raw';

const doc = DomAgentChatShell.__doc;

const messageShapeCode = `{
\tid: 'msg_assistant_1001',
\trole: 'assistant',
\tagentId: 'agent_seo',
\tstatus: 'streaming',
\tmode: 'text',
\tcreatedAt: '2026-07-03T09:10:12.000Z',
\tparts: [
\t\t{
\t\t\tid: 'part_reasoning',
\t\t\ttype: 'reasoning',
\t\t\tstatus: 'complete',
\t\t\ttext: 'Safe reasoning summary or stored trace label.'
\t\t},
\t\t{
\t\t\tid: 'tool_weather',
\t\t\ttype: 'tool-call',
\t\t\tname: 'get_weather',
\t\t\trendererKey: 'weather',
\t\t\tlabel: 'Launch-day weather',
\t\t\tstatus: 'complete',
\t\t\targs: { location: 'London' },
\t\t\tresult: { condition: 'Bright intervals', temperatureC: 21 }
\t\t},
\t\t{
\t\t\tid: 'part_answer',
\t\t\ttype: 'text',
\t\t\tstatus: 'streaming',
\t\t\ttext: 'The answer streams into this part.'
\t\t}
\t]
}`;

const streamEndpointCode = `GET /api/agent-chat/bootstrap
{
\tagents: [/* agent manifest rows */],
\tconversations: [/* conversation summaries */]
}

GET /api/agent-chat/conversations/:conversationId
{
\tconversation: { id, title, summary, agentId, status, mode },
\tmessages: [/* ordered message rows */]
}

POST /api/agent-chat/conversations/:conversationId/messages
{
\tcontent: 'Build a homepage ranking plan',
\tmode: 'text'
}

// Stream over SSE, WebSocket, fetch reader, or your queue bridge.
event: assistant.start
data: { message }

event: message.part
data: { messageId, part }

event: text.delta
data: { messageId, partId, delta }

event: assistant.done
data: { message, conversation }`;

const toolRendererCode = `<script setup>
import { DomAgentChatShell } from '@getdom/studio/vue';
import WeatherToolCard from './WeatherToolCard.vue';

const toolComponents = {
\tweather: WeatherToolCard,
\tget_weather: WeatherToolCard,
};
<\/script>

<template>
\t<DomAgentChatShell
\t\t:tool-components="toolComponents"
\t\t@tool-action="handleToolAction"
\t/>
</template>`;

const storeUsageCode = `import { defineAgentChatStore } from '@getdom/studio/vue';

export const useFlexAiAgentStore = defineAgentChatStore('flexai-agent', {
\tbaseUrl: '/api/agent-chat',
});

await store.load();
await store.selectConversation('conv_homepage_plan');
await store.sendMessage({
\tcontent: 'Build the next content plan from current website facts.',
\tmode: 'text',
});`;
</script>

<template>
	<DomStudioLayout>
		<DocPage
			:name="doc.name"
			tagline="A resizable AI chat shell for conversations, tools, and text or audio handoff."
			tag="Agent chat"
		>
			<div id="agent-chat-demo" class="scroll-mt-24">
				<DocSection eyebrow="Demo" title="Store-backed agent workspace">
					<Example
						:source="AgentChatDemoSrc"
						filename="AgentChatDemo.vue"
						description="A Pinia setup store drives conversation loading, sidebar selection, closable split panels, streaming assistant parts, text/audio mode switching, and custom tool-call rendering."
						:preview-lines="0"
					>
						<AgentChatDemo />
					</Example>
				</DocSection>
			</div>

			<DocSection eyebrow="Architecture" title="Reusable component split">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">Shell</h3>
						<p class="mt-2">
							<code class="text-canvas-fg">DomAgentChatShell</code> composes the sidebar, conversation, and aside using split panels. Apps can use it full screen or replace any pane with slots.
						</p>
					</div>
					<div class="rounded-lg border border-border bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">Conversation</h3>
						<p class="mt-2">
							<code class="text-canvas-fg">DomAgentConversation</code> owns the header, scroll-contained message viewport, composer footer, autoscroll, and tool rendering.
						</p>
					</div>
					<div class="rounded-lg border border-border bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">List</h3>
						<p class="mt-2">
							<code class="text-canvas-fg">DomAgentConversationList</code> is a dedicated conversation picker for full app shells, popovers, drawers, and focused chat panels.
						</p>
					</div>
				</div>
			</DocSection>

			<DocSection eyebrow="Data contract" title="Message parts">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The conversation component renders ordered message parts. Text, audio, handoff, reasoning summaries, tool calls, and tool results can appear in one assistant message while a stream is still active.
					</p>
					<p>
						Use <code class="text-canvas-fg">reasoning</code> parts for safe reasoning summaries or product-owned traces. Keep hidden model reasoning private unless your backend intentionally stores a reviewed trace that users are allowed to inspect.
					</p>
				</div>
				<CodePanel
					class="mt-5 overflow-hidden rounded-lg border border-border"
					:source="messageShapeCode"
					:preview-lines="0"
					:default-open="false"
					:border-top="false"
					filename="agent-message.js"
					lang="js"
				/>
			</DocSection>

			<DocSection eyebrow="API" title="Streaming endpoint shape">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The demo API uses callbacks so it can run in the docs without infrastructure. A production endpoint can deliver the same events over SSE, a WebSocket, a fetch stream, or a queue worker bridge.
					</p>
					<p>
						Tool calls are ordinary message parts. If the frontend has no renderer for a tool, the conversation uses the generic argument/result card. If a renderer exists, it receives the full tool part and parent message.
					</p>
				</div>
				<CodePanel
					class="mt-5 overflow-hidden rounded-lg border border-border"
					:source="streamEndpointCode"
					:preview-lines="0"
					:default-open="false"
					:border-top="false"
					filename="agent-chat-api.txt"
					lang="txt"
				/>
			</DocSection>

			<DocSection eyebrow="Custom tools" title="Renderer map">
				<div class="grid gap-4 lg:grid-cols-2">
					<CodePanel
						class="overflow-hidden rounded-lg border border-border"
						:source="toolRendererCode"
						:preview-lines="0"
						:default-open="false"
						:border-top="false"
						filename="tool-renderers.vue"
						lang="vue"
					/>
					<CodePanel
						class="overflow-hidden rounded-lg border border-border"
						:source="WeatherToolCardSrc"
						:preview-lines="0"
						:default-open="false"
						:border-top="false"
						filename="WeatherToolCard.vue"
						lang="vue"
					/>
				</div>
			</DocSection>

			<DocSection eyebrow="Store" title="Pinia integration">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">
					The exported store factory keeps the component transport-free. It owns active conversation state, panel state, composer state, stream cancellation, and request logging, while your API adapter owns persistence and streaming transport.
				</p>
				<CodePanel
					class="mt-5 overflow-hidden rounded-lg border border-border"
					:source="storeUsageCode"
					:preview-lines="0"
					:default-open="false"
					:border-top="false"
					filename="useFlexAiAgentStore.js"
					lang="js"
				/>
				<div class="mt-4 grid gap-4 lg:grid-cols-2">
					<CodePanel
						class="overflow-hidden rounded-lg border border-border"
						:source="StoreSrc"
						:preview-lines="0"
						:default-open="false"
						:border-top="false"
						filename="useAgentChatDemoStore.js"
						lang="js"
					/>
					<CodePanel
						class="overflow-hidden rounded-lg border border-border"
						:source="MockApiSrc"
						:preview-lines="0"
						:default-open="false"
						:border-top="false"
						filename="agentChatMockApi.js"
						lang="js"
					/>
				</div>
			</DocSection>

			<DocSection title="Reference">
				<div id="dom-agent-chat-shell" class="scroll-mt-24">
					<ComponentProps :component="DomAgentChatShell" :source="DomAgentChatShellSrc" />
					<ComponentEvents :component="DomAgentChatShell" :source="DomAgentChatShellSrc" />
					<ComponentSlots :component="DomAgentChatShell" :source="DomAgentChatShellSrc" />
				</div>
				<div id="dom-agent-conversation" class="mt-8 scroll-mt-24">
					<h3 class="mb-4 text-base font-semibold text-canvas-fg">DomAgentConversation</h3>
					<ComponentProps :component="DomAgentConversation" :source="DomAgentConversationSrc" />
					<ComponentEvents :component="DomAgentConversation" :source="DomAgentConversationSrc" />
					<ComponentSlots :component="DomAgentConversation" :source="DomAgentConversationSrc" />
				</div>
				<div id="dom-agent-conversation-list" class="mt-8 scroll-mt-24">
					<h3 class="mb-4 text-base font-semibold text-canvas-fg">DomAgentConversationList</h3>
					<ComponentProps :component="DomAgentConversationList" :source="DomAgentConversationListSrc" />
					<ComponentEvents :component="DomAgentConversationList" :source="DomAgentConversationListSrc" />
					<ComponentSlots :component="DomAgentConversationList" :source="DomAgentConversationListSrc" />
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
