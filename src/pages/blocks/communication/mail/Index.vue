<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import MailClient from './examples/MailClient.vue';
import MailClientSrc from './examples/MailClient.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Mail Workspace Block"
			tagline="A working Superhuman- and Shortwave-inspired mail section with API-backed folders, conversation state, replies, composition, drafts, snooze, archive undo, and mobile navigation."
			tag="Reviewed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Communication" title="Inbox triage workspace">
				<Example
					:source="MailClientSrc"
					filename="MailClient.vue"
					presentation="iframe"
					frame-src="/blocks/communication/mail/preview/MailClient"
					description="Copy this working inbox section into a shared mailbox, customer-success tool, or internal operations product. The viewport-owned composition uses DOM Studio controls and repository-local APIs rather than prepared screenshot state."
					default-open
					:preview-lines="16"
					frame-flush-edges
				>
					<MailClient />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a team needs a real mail workflow rather than a screenshot of one.
						The dense desktop workspace supports rapid triage, while compact viewports switch cleanly between folders, conversation list, and a focused reader.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/mail/workspace</code> returns folders, counts, contacts, rich filter and snooze options, labels, and thread summaries; <code>GET .../threads/:threadId</code> returns the complete conversation.</li>
						<li><code>PATCH .../state</code> persists read, starred, and label state with optimistic revisions. The first open marks unread mail as read through the API.</li>
						<li><code>POST .../reply</code>, <code>POST .../snooze</code>, and <code>POST .../archive</code> mutate the real workflow. Archive returns a one-use token consumed by <code>POST .../restore</code>.</li>
						<li><code>POST /api/block-demos/mail/compose</code> validates recipients and message content, then creates a Sent conversation or persistent Draft.</li>
						<li>The process-local store survives reloads while the development server runs. Replace it with authenticated mailbox records, provider sync, durable jobs, idempotency, and an audit trail in production.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended mail payload">
				<CodeBlock lang="js" filename="mail-thread.js" :code="`{
	id: 'northstar-renewal',
	revision: 4,
	folder: 'inbox',
	subject: 'Contract renewal timing',
	unread: false,
	starred: true,
	labels: [
		{ value: 'vip', label: 'VIP', tone: 'warning' },
		{ value: 'finance', label: 'Finance', tone: 'success' }
	],
	participants: [
		{ name: 'Maya Chen', email: 'maya@northstar.example', initials: 'MC' }
	],
	messages: [
		{
			id: 'northstar-1',
			from: 'Maya Chen',
			email: 'maya@northstar.example',
			own: false,
			body: 'Could we hold the current price until Friday?',
			createdAt: '2026-08-01T13:58:00.000Z'
		}
	]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="border-t border-border pt-4">
						<h3 class="font-semibold text-canvas-fg">DOM Studio composition</h3>
						<p class="mt-2"><code>DomSplitterPanel</code> powers desktop resizing; <code>DomSelect</code>, <code>DomTagCombobox</code>, <code>DomDialog</code>, <code>DomDrawer</code>, and field components provide the working controls without a native select.</p>
					</div>
					<div class="border-t border-border pt-4">
						<h3 class="font-semibold text-canvas-fg">Responsive workflow</h3>
						<p class="mt-2">The block owns the iframe viewport. Desktop panes scroll independently; mobile uses focused list and reader states plus a folder drawer instead of stacking a full application screen vertically.</p>
					</div>
					<div class="border-t border-border pt-4">
						<h3 class="font-semibold text-canvas-fg">Production boundaries</h3>
						<p class="mt-2">Keep mailbox credentials, authorization, provider webhooks, send queues, attachment scanning, retention, and immutable delivery or audit evidence behind the API.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
