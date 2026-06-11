<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import WorkflowAutomationBuilder from './examples/WorkflowAutomationBuilder.vue';
import WorkflowAutomationBuilderSrc from './examples/WorkflowAutomationBuilder.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Workflow Automation Block"
			tagline="A responsive rule builder for configuring product automations with triggers, conditions, actions, test runs, and release checks."
			tag="Workflow UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Work Management" title="Workflow automation builder">
				<Example
					:source="WorkflowAutomationBuilderSrc"
					filename="WorkflowAutomationBuilder.vue"
					presentation="iframe"
					frame-src="/blocks/work-management/workflow-automation/preview/WorkflowAutomationBuilder"
					description="Copy this into a SaaS admin console, CRM, support workspace, lifecycle tool, or internal operations product. Replace the local automation arrays with workflow definitions, event schemas, audience data, and execution logs from your backend."
					default-open
					:preview-lines="14"
				>
					<WorkflowAutomationBuilder />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when users need a practical Zapier-style composer inside your app.
						It keeps rule selection, trigger setup, condition logic, action sequencing, sample testing, and safety checks in one reusable workflow surface.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>automations</code> with workflow definitions from your API, including trigger, conditions, actions, owner, status, and execution metrics.</li>
						<li>Back the trigger and condition option lists with your event catalog so users can only choose supported fields and operators.</li>
						<li>Persist changes as drafts first, then publish only after backend validation confirms permissions, rate limits, and action configuration.</li>
						<li>Wire <code>runTest</code> to a dry-run endpoint that returns matched records, skipped steps, generated payloads, and action errors without executing side effects.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended workflow shape">
				<CodeBlock lang="js" filename="workflow-automation.js" :code="`{
\tid: 'trial-rescue',
\tname: 'Trial rescue sequence',
\tstatus: 'Active',
\towner: 'Lifecycle team',
\ttrigger: 'Trial becomes inactive',
\taudience: 'Self-serve trials',
\tthrottleHours: 24,
\tenabled: true,
\tconditions: [
\t\t{ id: 'cond_plan', field: 'Plan fit', operator: 'is', value: 'Growth' },
\t\t{ id: 'cond_activity', field: 'Last active', operator: 'older than', value: '5 days' }
\t],
\tactions: [
\t\t{ id: 'act_email', type: 'Send email', detail: 'Nudge template', enabled: true },
\t\t{ id: 'act_task', type: 'Create task', detail: 'Owner follow-up', enabled: true }
\t],
\tmetrics: { runs: 1240, successRate: '98.8%', savedHours: '42h' },
\thistory: [
\t\t{ label: 'Template updated', actor: 'Maya Chen', time: 'Today 10:18' }
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Event schema</h3>
						<p class="mt-2">Drive trigger, condition, and variable menus from a typed event catalog so published rules stay valid after schema changes.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Dry runs</h3>
						<p class="mt-2">Run samples through backend evaluation before publishing. Show matched records, skipped actions, throttles, and missing permissions.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include reusable condition rows, action connectors, branch logic, approvals, and execution observability.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
