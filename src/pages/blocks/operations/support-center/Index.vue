<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import SupportTicketWorkspace from './examples/SupportTicketWorkspace.vue';
import SupportTicketWorkspaceSrc from './examples/SupportTicketWorkspace.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Support Center Block"
			tagline="A complete customer-support section with a live inbox, focused conversations, rich routing, provider delivery evidence, and a guarded ticket lifecycle."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations" title="Human support service desk">
				<Example
					:source="SupportTicketWorkspaceSrc"
					filename="SupportTicketWorkspace.vue"
					presentation="iframe"
					frame-src="/blocks/operations/support-center/preview/SupportTicketWorkspace"
					description="An Intercom- and Zendesk-inspired service desk backed by repository-local REST routes. Search saved inbox views, route tickets, send public replies or internal notes, recover failed delivery, and resolve or reopen real server state."
					default-open
					:preview-lines="14"
				>
					<SupportTicketWorkspace />
				</Example>
			</DocSection>

			<DocSection eyebrow="API contract" title="A working app section, not a screenshot">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when an app needs a human support console rather than a generic message viewer.
						The queue, ticket detail, message delivery, routing, and lifecycle all read and mutate through the demo API.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/support-center/workspace</code> returns saved-view catalogs, aggregate service health, and compact queue rows; <code>GET .../tickets/:ticketId</code> loads the full conversation only when selected.</li>
						<li><code>PATCH .../triage</code> changes assignee or priority with exact workspace and ticket revisions.</li>
						<li><code>POST .../messages</code> persists public replies with provider receipts or private internal notes; <code>POST .../messages/:messageId/retry</code> safely recovers a seeded failed delivery without duplicating the body.</li>
						<li><code>POST .../resolve</code> requires a structured outcome, verified note, acknowledgement, and successful message delivery; <code>POST .../reopen</code> restores the conversation.</li>
						<li>The demo store is intentionally process-local: mutations survive browser reloads while the server runs. Replace the in-memory map with your ticket database, transactional outbox, provider callbacks, and durable audit ledger in production.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Mutation" title="Exact-revision reply shape">
				<CodeBlock lang="js" filename="send-support-reply.js" :code="`const response = await fetch(
	'/api/block-demos/support-center/tickets/SUP-2048/messages',
	{
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			workspaceRevision: 1,
			ticketVersion: 1,
			mode: 'public',
			content: 'The domain policy is updated. Please resend both invites.'
		})
	}
);

const { ticket, tickets, summary } = await response.json();`" />
			</DocSection>

			<DocSection eyebrow="Design review" title="Why this composition is different">
				<div class="grid gap-5 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border-l-2 border-primary/40 pl-4">
						<h3 class="font-semibold text-canvas-fg">Intercom-style focus</h3>
						<p class="mt-2">Saved views and edge-to-edge queue rows make attention work scannable without wrapping every ticket in another card.</p>
					</div>
					<div class="border-l-2 border-primary/40 pl-4">
						<h3 class="font-semibold text-canvas-fg">Zendesk-style context</h3>
						<p class="mt-2">The customer and routing inspector stays adjacent on wide screens and becomes a focused Details destination when width is limited.</p>
					</div>
					<div class="border-l-2 border-primary/40 pl-4">
						<h3 class="font-semibold text-canvas-fg">Mobile behavior</h3>
						<p class="mt-2">Inbox, Conversation, and Details are separate app views, so a desktop queue never pushes the active customer below the fold.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
