<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import AgentRunTrace from './examples/AgentRunTrace.vue';
import AgentRunTraceSrc from './examples/AgentRunTrace.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Agent Run Trace Block"
			tagline="A copyable AI agent observability workspace for filtering nested spans, inspecting model and tool calls, and preparing retry decisions."
			tag="AI agents"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Developer Experience / AI Agents" title="Agent run trace">
				<Example
					:source="AgentRunTraceSrc"
					filename="AgentRunTrace.vue"
					presentation="iframe"
					frame-src="/blocks/developer-experience/ai-agents/agent-run-trace/preview/AgentRunTrace"
					description="Copy this into AI product dashboards, agent builders, evaluation tools, support debugging consoles, or internal developer platforms where teams need to understand what an agent did before retrying or shipping changes."
					default-open
					:preview-lines="18"
				>
					<AgentRunTrace />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when an AI application needs explainable execution history, not just a raw log stream.
						The pattern keeps run selection, span filters, nested trace structure, latency and cost signals, payload inspection, and retry policy decisions in one workflow.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace the local <code>runs</code> and <code>spans</code> arrays with trace data from your agent runtime, queue worker, eval service, or observability pipeline.</li>
						<li>Persist spans as immutable events with parent ids, timestamps, duration, token usage, cost, status, input, output, and redaction metadata.</li>
						<li>Fetch model and tool payloads lazily when the drawer opens if your traces contain sensitive or large data.</li>
						<li>Keep retry actions server-owned. The UI should submit a replay request with run id, span id, retry policy, operator identity, and reason.</li>
						<li>Connect the tag filters to trace attributes such as model, tool, tenant, environment, prompt version, safety policy, and eval suite.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended trace shape">
				<CodeBlock lang="js" filename="agent-trace.js" :code="`{
\trun: {
\t\tid: 'run_support_triage_2841',
\t\tappId: 'app_support_agent',
\t\tstatus: 'warning',
\t\tstartedAt: '2026-06-12T08:20:04Z',
\t\tdurationMs: 6840,
\t\tcostUsd: 0.183,
\t\tpromptVersion: 'support-triage-v17'
\t},
\tspans: [
\t\t{
\t\t\tid: 'span_tool_lookup_customer',
\t\t\tparentId: 'span_root',
\t\t\ttype: 'tool',
\t\t\tname: 'lookup_customer',
\t\t\tstatus: 'ok',
\t\t\tstartMs: 1480,
\t\t\tdurationMs: 620,
\t\t\tcostUsd: 0.002,
\t\t\tinput: { customerId: 'cus_1842' },
\t\t\toutput: { plan: 'Enterprise', risk: 'low' },
\t\t\tmetadata: {
\t\t\t\ttenantId: 'wrk_northstar',
\t\t\t\tredacted: true,
\t\t\t\tpromptVersion: 'support-triage-v17'
\t\t\t}
\t\t}
\t]
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Trace storage</h3>
						<p class="mt-2">Store the tree as parent-linked spans instead of nested JSON only. That makes server filtering, pagination, redaction, and partial payload loading easier.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Safety boundary</h3>
						<p class="mt-2">Treat the drawer as privileged. Redact customer data by default, and show who can view prompts, tool arguments, model responses, and replay controls.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include side-by-side trace diffs, eval case links, streaming spans, reusable cost chips, and a promoted trace waterfall primitive.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
