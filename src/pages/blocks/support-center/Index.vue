<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Example from '../../_layout/docs/Example.vue';
import SupportTicketWorkspace from './examples/SupportTicketWorkspace.vue';
import SupportTicketWorkspaceSrc from './examples/SupportTicketWorkspace.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Support Center Block"
			tagline="A responsive customer support workspace for triaging tickets, reviewing account context, drafting replies, and closing common operational loops."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Operations" title="Support ticket workspace">
				<Example
					:source="SupportTicketWorkspaceSrc"
					filename="SupportTicketWorkspace.vue"
					description="Copy this into a helpdesk, CRM, admin panel, or customer success app. Replace the local arrays with ticket, account, message, and SLA data from your API."
					default-open
					:preview-lines="14"
				>
					<SupportTicketWorkspace />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when an app needs a focused support console rather than a generic inbox.
						It combines the high-value pieces teams usually need on one screen: queue priority, SLA state,
						customer health, conversation history, internal checklist, and a reply composer.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>tickets</code> with records from your support system or backend queue.</li>
						<li>Map <code>selectedTicket</code> to the active route, query string, or selected table row in your app shell.</li>
						<li>Send the composer content to your message endpoint, then append the sent message to the conversation list.</li>
						<li>Connect the checklist actions to macros, internal notes, assignee updates, and close-ticket workflows.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended ticket shape">
				<CodeBlock lang="js" filename="support-ticket.js" :code="`{
\tid: 'T-2048',
\tsubject: 'Cannot invite the design team',
\tcustomer: 'Northstar Labs',
\tcontact: 'Priya Shah',
\tplan: 'Scale',
\tstatus: 'Waiting on support',
\tpriority: 'High',
\tsla: '42m left',
\ttags: ['access', 'workspace'],
\tmessages: [
\t\t{ author: 'Priya Shah', role: 'Customer', time: '09:24', body: 'The invite button fails for two teammates.' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Queue logic</h3>
						<p class="mt-2">Keep sort and filter state outside the block when tickets come from server pagination.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Reply workflow</h3>
						<p class="mt-2">Swap the textarea for your rich text editor if you support templates, variables, or attachments.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Mobile behavior</h3>
						<p class="mt-2">The queue stacks above the detail view on small screens, keeping the selected ticket visible first.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
