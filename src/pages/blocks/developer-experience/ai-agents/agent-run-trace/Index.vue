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
			tagline="A working agent-observability section with a trace queue, redacted payload access, investigation handoff, and receipt-backed replay, eval, and export actions."
			tag="AI agents"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Developer Experience / AI Agents" title="Agent run trace">
				<Example
					:source="AgentRunTraceSrc"
					filename="AgentRunTrace.vue"
					presentation="iframe"
					frame-src="/blocks/developer-experience/ai-agents/agent-run-trace/preview/AgentRunTrace"
					description="A Sentry- and LangSmith-inspired investigation workspace that uses DOM Studio controls and a repository API to turn a failed run into payload evidence, ownership, and an auditable next action."
					default-open
					:preview-lines="18"
				>
					<AgentRunTrace />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="Included API contract">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when an AI product needs a working investigation surface rather than a trace screenshot. The example ships with process-local state and focused endpoints so every important interaction can be exercised, reloaded, rejected, and recovered.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/agent-run-trace/bootstrap</code> returns the run queue and rich environment, outcome, span-type, ownership, review-state, and replay choices.</li>
						<li><code>GET .../runs/:runId</code> returns safe span metadata. <code>GET .../payload?spanId=...</code> is a separate lazy boundary that returns redacted content and immutable access proof.</li>
						<li><code>PATCH .../review</code> persists ownership and investigation state with optimistic revision checks and resolution-note validation.</li>
						<li><code>POST .../actions</code> validates issue selection, reason, acknowledgement, replay scope, and source revision before creating replay, eval, or redacted export evidence.</li>
						<li><code>POST /api/block-demos/agent-run-trace/reset</code> restores the seeded queue so conflict, validation, and recovery paths remain repeatable.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Action request shape">
				<CodeBlock lang="js" filename="trace-action.js" :code="`{
\trevision: 7,
\tspanId: 'risk-policy',
\taction: 'replay',
\tmode: 'from_span',
\treason: 'Retry after the policy service recovers.',
\tacknowledged: true
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Production adapter seams">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Trace storage</h3>
						<p class="mt-2">Replace the process-local map with parent-linked immutable spans. Keep list responses payload-free so filtering and pagination do not broaden data access.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Safety boundary</h3>
						<p class="mt-2">Connect payload access to authorization and audit storage. Preserve the separate access receipt even when your observability vendor already stores raw spans.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Queue adapter</h3>
						<p class="mt-2">Exchange demo action receipts for durable replay jobs, eval records, and object-storage exports while retaining source revision, actor, scope, reason, and proof.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
