<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import AssistantChat from './examples/AssistantChat.vue';
import AssistantChatSrc from './examples/AssistantChat.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Chat Block"
			tagline="A working Intercom- and Zendesk-inspired support copilot with an API-backed queue, specialist routing, tool evidence, recovery, and ticket resolution."
			tag="Reviewed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Communication" title="Support copilot workspace">
				<Example
					:source="AssistantChatSrc"
					filename="AssistantChat.vue"
					presentation="iframe"
					frame-src="/blocks/communication/chat/preview/AssistantChat"
					description="Copy this working support section into a customer operations product. DOM Studio's agent-chat components provide the application shell while repository-local APIs persist queue, routing, message, retry, and resolution state."
					default-open
					:preview-lines="16"
					frame-flush-edges
				>
					<AssistantChat />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when support operators need a durable AI working thread beside real customer and ticket context.
						It demonstrates conversation navigation, rich specialist and priority selection, evidence-bearing tool calls, recoverable failures, and an explicit resolve/reopen workflow.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/support-copilot/bootstrap</code> returns available agents, queue summaries, and priority options; <code>GET .../conversations/:conversationId</code> returns the full thread.</li>
						<li><code>POST .../conversations</code> creates a new working thread and <code>POST .../messages</code> persists an operator prompt plus a deterministic copilot response with reasoning and tool evidence.</li>
						<li><code>PATCH .../settings</code> uses optimistic revisions for specialist and priority changes. Rich <code>DomSelect</code> controls surface descriptions, models, identity, and semantic status.</li>
						<li><code>POST .../retry</code>, <code>POST .../resolve</code>, and <code>POST .../reopen</code> enforce recovery and ticket lifecycle rules on the server instead of changing presentation-only state.</li>
						<li>The process-local demo store survives reloads while the development server is running. Replace it with authenticated tickets, durable messages, model execution, and audited tool adapters in production.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended conversation payload">
				<CodeBlock lang="js" filename="support-conversation.js" :code="`{
	id: 'northstar-refund',
	ticketId: 'SUP-1842',
	revision: 4,
	title: 'Refund request · Northstar',
	status: 'complete',
	ticketState: 'open',
	priority: 'high',
	agentId: 'billing-specialist',
	customer: {
		name: 'Maya Chen',
		company: 'Northstar Labs',
		plan: 'Scale annual',
		accountValue: '£18,400 ARR'
	},
	messages: [
		{ role: 'user', content: 'Draft a policy-safe response.' },
		{
			role: 'assistant',
			parts: [
				{ type: 'reasoning', text: 'Policy summary...' },
				{ type: 'tool-call', name: 'invoice.inspect', status: 'complete' },
				{ type: 'text', text: 'Customer-ready draft...' }
			]
		}
	]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border-t border-border pt-4">
						<h3 class="font-semibold text-canvas-fg">Agent chat composition</h3>
						<p class="mt-2"><code>DomAgentChatShell</code>, <code>DomAgentConversationList</code>, and a custom tool renderer provide the working surface without recreating message, composer, splitter, or mobile navigation behaviour.</p>
					</div>
					<div class="border-t border-border pt-4">
						<h3 class="font-semibold text-canvas-fg">Responsive context</h3>
						<p class="mt-2">The desktop context rail becomes a <code>DomDrawer</code> on compact viewports. The block owns the full iframe viewport, so every pane scrolls inside a stable application frame.</p>
					</div>
					<div class="border-t border-border pt-4">
						<h3 class="font-semibold text-canvas-fg">Production boundaries</h3>
						<p class="mt-2">Keep model credentials, ticket authorization, tool policy, audit logs, idempotency, and durable storage behind the API. The browser should receive only scoped context and reviewable results.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
