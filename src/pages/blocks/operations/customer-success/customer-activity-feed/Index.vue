<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import CustomerActivityFeed from './examples/CustomerActivityFeed.vue';
import CustomerActivityFeedSrc from './examples/CustomerActivityFeed.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Customer Activity Feed Block"
			tagline="A complete customer-success activity inbox with multi-source evidence, accountable follow-through, and provider-backed customer updates."
			tag="Customer success"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Account operations" title="Customer activity inbox">
				<Example
					:source="CustomerActivityFeedSrc"
					filename="CustomerActivityFeed.vue"
					presentation="iframe"
					frame-src="/blocks/operations/customer-success/customer-activity-feed/preview/CustomerActivityFeed"
					description="Use this as a complete account-operations section: triage customer signals, inspect immutable source evidence, create accountable work, log notes, send updates, and retain the provider receipts."
					default-open
					:preview-lines="18"
				>
					<CustomerActivityFeed />
				</Example>
			</DocSection>

			<DocSection eyebrow="Working journey" title="What this section proves">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The block is an API-backed app section, not a generated screenshot. It composes account selection, event filtering, chronological activity, an evidence inspector, a task queue, internal notes, and customer delivery into one responsive workflow.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Select an account through the rich <code>DomSelect</code> on mobile or the dense <code>DomAppListItem</code> account rail on larger screens.</li>
						<li>Filter the server-visible page, select an event, inspect source freshness, metadata, raw payload, event revision, and provider receipt.</li>
						<li>Mark exact event versions as reviewed and recover from stale workspace, account, event, or task revisions.</li>
						<li>Preview an immutable task, acknowledge its owner, priority, due date, and source evidence, then complete it with a durable receipt.</li>
						<li>Add internal notes and preview an exact customer update before the repository-local API records provider-style email or CRM delivery proof.</li>
						<li>Reload to prove process persistence, or reset the deterministic demo for another complete journey.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API contract" title="Repository-local routes">
				<CodeBlock lang="txt" filename="customer-activity-api.txt" :code="`GET  /api/block-demos/customer-activity/bootstrap
POST /api/block-demos/customer-activity/accounts/select
POST /api/block-demos/customer-activity/events/load-more
POST /api/block-demos/customer-activity/events/:eventId/review
POST /api/block-demos/customer-activity/tasks/preview
POST /api/block-demos/customer-activity/tasks
POST /api/block-demos/customer-activity/tasks/:taskId/complete
POST /api/block-demos/customer-activity/notes
POST /api/block-demos/customer-activity/updates/preview
POST /api/block-demos/customer-activity/updates
POST /api/block-demos/customer-activity/reset`" />
			</DocSection>

			<DocSection eyebrow="Event envelope" title="Keep evidence and actions separate">
				<CodeBlock lang="js" filename="customer-activity-event.js" :code="`{
	id: 'evt_1802',
	version: 3,
	accountId: 'acct_northstar',
	type: 'support',
	importance: 'high',
	occurredAt: '2026-08-02T14:24:00.000Z',
	source: 'Zendesk',
	sourceFreshness: 'Synced 2 minutes ago',
	receipt: 'zd_evt_4821_06',
	title: 'Export timeout escalated',
	summary: 'Two enterprise workspaces failed large exports.',
	impact: 'Renewal confidence could decline without a recovery ETA.',
	metadata: [
		{ label: 'Ticket', value: 'SUP-4821' },
		{ label: 'SLA', value: '4h remaining' }
	],
	rawData: {
		object: 'ticket.updated',
		status: 'escalated',
		delivery: { status: 'delivered', http_status: 200 }
	},
	allowedActions: ['review', 'task', 'update']
}`" />
			</DocSection>

			<DocSection eyebrow="Design references" title="Why this composition is different">
				<div class="grid gap-px overflow-hidden border border-border bg-border text-sm leading-6 md:grid-cols-3">
					<div class="bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">Intercom-style stream</h3>
						<p class="mt-2">The center pane uses a compact left-aligned chronology instead of stacked dashboard cards, keeping source, time, and customer impact scannable.</p>
					</div>
					<div class="bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">Stripe-style evidence</h3>
						<p class="mt-2">The inspector treats each incoming signal as an immutable versioned object with a source receipt, raw payload, and delivery state.</p>
					</div>
					<div class="bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">Focused mobile app</h3>
						<p class="mt-2">Feed, Detail, and Work destinations replace the previous 3,442px-long mobile stack, while desktop retains simultaneous context.</p>
					</div>
				</div>
			</DocSection>

			<DocSection eyebrow="Production boundary" title="Adopt the contract, replace the demo storage">
				<p class="text-sm leading-7 text-muted-fg">
					The demo API intentionally uses deterministic process memory. A production integration should add tenant-scoped persistence, identity and permission enforcement, queued source connectors, delivery retries and idempotency, cursor pagination, retention policy, and operational telemetry while preserving the exact-revision, preview, acknowledgement, and receipt contracts shown here.
				</p>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
