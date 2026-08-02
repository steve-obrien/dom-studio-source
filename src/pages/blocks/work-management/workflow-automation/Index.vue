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
			tagline="A working automation operations section with versioned drafts, side-effect-free execution traces, exact release checks, and immutable API receipts."
			tag="API-backed"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Work Management" title="Workflow automation operations">
				<Example
					:source="WorkflowAutomationBuilderSrc"
					filename="WorkflowAutomationBuilder.vue"
					presentation="iframe"
					frame-src="/blocks/work-management/workflow-automation/preview/WorkflowAutomationBuilder"
					description="A Zapier-, n8n-, and Workato-inspired automation operations room backed by repository-local APIs. It persists drafts and releases in process, rejects stale revisions, validates server-owned catalogs, produces safe test traces with zero side effects, and retains audit and runtime receipts."
					default-open
					:preview-lines="14"
				>
					<WorkflowAutomationBuilder />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>Use this block when automation authors need to move from a draft rule to defensible production evidence. The composer, safe-test trace, and exact release boundary are separate responsive destinations instead of a full desktop screen scaled into an iframe.</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>The repository-local API owns workflow definitions, option catalogs, workspace revisions, workflow versions, validation, and persistence.</li>
						<li><code>DomSelect</code> renders every trigger, owner, rule, action, fixture, and throttle choice with contextual option content.</li>
						<li>Draft preview and release preview endpoints lock exact checksums before acknowledgement-gated writes.</li>
						<li>Safe tests evaluate server fixtures and connection health, return step-level JSON evidence, and execute zero provider side effects.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="API" title="Exact mutation contract">
				<CodeBlock lang="js" filename="workflow-release.js" :code="`const preview = await api.post('/workflows/trial-rescue/release-preview', {
	workspaceRevision: 22,
	workflowVersion: 12
})

const result = await api.post('/workflows/trial-rescue/publish', {
	workspaceRevision: preview.workspaceRevision,
	workflowVersion: preview.workflowVersion,
	previewChecksum: preview.checksum,
	acknowledged: true
})

// result.receipt retains audit, runtime, test, and release checksums.`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Event catalog</h3>
						<p class="mt-2">Drive rich trigger, condition, operator, value, action, and destination selects from a server-owned typed catalog.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Safe tests</h3>
						<p class="mt-2">Run server fixtures through the production condition grammar while replacing every external effect with recorded simulation evidence.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Release boundary</h3>
						<p class="mt-2">Reject stale revisions and require a passing current test, healthy connections, explicit owner, throttle, enabled action, and exact acknowledgement.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
