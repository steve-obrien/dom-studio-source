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
			tagline="A responsive customer timeline for reviewing lifecycle events, filtering account activity, expanding event context, and choosing the next customer-success action."
			tag="Customer success"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Timeline" title="Customer activity feed">
				<Example
					:source="CustomerActivityFeedSrc"
					filename="CustomerActivityFeed.vue"
					presentation="iframe"
					frame-src="/blocks/operations/customer-success/customer-activity-feed/preview/CustomerActivityFeed"
					description="Copy this into customer success, support, sales, lifecycle, billing, or product analytics apps where teams need a readable account timeline with filters, event context, and action planning."
					default-open
					:preview-lines="18"
				>
					<CustomerActivityFeed />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a team needs one chronological surface for account events: product usage spikes, support escalations, billing changes, lifecycle messages, notes, meetings, and renewal updates.
						The feed keeps the current account summary visible while event rows expand inline, so users can inspect context without leaving the timeline.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>activityEvents</code> with events from your warehouse, CRM, help desk, billing provider, and product analytics pipeline.</li>
						<li>Normalize all events to a shared envelope with type, source, actor, occurred time, importance, account impact, and a compact metadata list.</li>
						<li>Store notes and follow-up tasks separately from immutable system events, but render them in the same chronological feed for operator context.</li>
						<li>Keep permission checks server-side. Sensitive billing, security, and support metadata should only be returned for users with the right account role.</li>
						<li>Connect the action buttons to your CRM task API, support ticket routes, lifecycle campaign builder, or internal playbook runner.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended activity event payload">
				<CodeBlock lang="js" filename="customer-activity-event.js" :code="`{
\taccount: {
\t\tid: 'acct_northstar',
\t\tname: 'Northstar Labs',
\t\tsegment: 'Scale',
\t\townerId: 'usr_maya',
\t\trenewalAt: '2026-09-18T00:00:00Z',
\t\thealthScore: 82
\t},
\tevents: [
\t\t{
\t\t\tid: 'evt_1802',
\t\t\ttype: 'support',
\t\t\tsource: 'Help desk',
\t\t\ttitle: 'Export timeout escalated',
\t\t\tdescription: 'Customer reported failed exports on two enterprise workspaces.',
\t\t\tactor: { id: 'usr_ari', name: 'Ari Patel', role: 'Support lead' },
\t\t\toccurredAt: '2026-06-11T14:24:00Z',
\t\t\timportance: 'high',
\t\t\timpact: 'Renewal risk if unresolved by Friday',
\t\t\tmetadata: [
\t\t\t\t{ label: 'Ticket', value: 'SUP-4821' },
\t\t\t\t{ label: 'Workspace', value: 'Northstar EU' }
\t\t\t],
\t\t\tnextActions: ['Open support ticket', 'Create owner task']
\t\t}
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Event ingestion</h3>
						<p class="mt-2">Use an append-only event model and denormalize display fields at write time. Timeline reads should stay fast, stable, and easy to paginate.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Action routing</h3>
						<p class="mt-2">Map each event type to allowed actions from the server so users only see task, campaign, ticket, or playbook actions they can perform.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include infinite scroll, saved filters, account mentions, event deduping, AI summaries, and bidirectional CRM sync.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
