<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import Example from '../../../_layout/docs/Example.vue';
import AiPromptLab from './examples/AiPromptLab.vue';
import AiPromptLabSrc from './examples/AiPromptLab.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="AI Prompt Lab Block"
			tagline="A working prompt registry for saving exact revisions, running reusable eval datasets, comparing output, and handing tested evidence to a reviewer."
			tag="AI UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Developer Experience" title="AI prompt lab">
				<Example
					:source="AiPromptLabSrc"
					filename="AiPromptLab.vue"
					presentation="iframe"
					frame-src="/blocks/developer-experience/ai-prompt-lab/preview/AiPromptLab"
					description="This is a complete prompt experimentation section rather than a static dashboard. The included API saves prompt revisions, rejects stale writes, evaluates registered cases, stores run evidence, validates review gates, and supports a safe demo reset."
					default-open
					:preview-lines="14"
				>
					<AiPromptLab />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when a team needs a reproducible path from prompt edit to release review.
						It keeps the dataset, saved prompt revision, evaluation evidence, reviewer, and target environment connected instead of presenting unrelated metrics.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><code>GET /api/block-demos/ai-prompt-lab/bootstrap</code> returns rich select options, registered cases, version history, and the default prompt.</li>
						<li><code>PATCH /prompts/:promptId</code> validates and saves an exact revision; stale revisions return current recovery state with HTTP 409.</li>
						<li><code>POST /runs</code> evaluates the saved revision and returns per-case output, assertion evidence, latency, cost, and suite score.</li>
						<li><code>POST /prompts/:promptId/request-review</code> enforces a current passing run, human reviewer, note, environment, and explicit acknowledgement.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Prompt run contract">
				<CodeBlock lang="js" filename="prompt-run.js" :code="`{
\tid: 'run-1428',
\tpromptVersion: 7,
\tpromptRevision: 8,
\tstatus: 'passed',
\tscore: 94,
\tlatencyMs: 742,
\tcostUsd: 0.046,
\tcaseCount: 4,
\tpassedCount: 4,
\tcases: [{
\t\tid: 'refund-edge-case',
\t\tstatus: 'passed',
\t\tscore: 96,
\t\tchecks: [
\t\t\t{ label: 'States the 30-day policy', status: 'passed' },
\t\t\t{ label: 'Avoids a guaranteed refund', status: 'passed' }
\t\t],
\t\tbaseline: 'The add-on is outside the refund window...',
\t\toutput: 'The seat add-on is outside the 30-day window...'
\t}],
\tcreatedAt: '2026-08-01T14:12:00Z'
}`" />
			</DocSection>

			<DocSection eyebrow="Production" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Storage adapter</h3>
						<p class="mt-2">The demo API keeps state in process memory. Replace the store with durable prompt, version, run, case, assertion, and review records while preserving the response contracts.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Execution adapter</h3>
						<p class="mt-2">Swap the deterministic runner for your model gateway or queue. Keep prompt revision, dataset version, model parameters, token usage, and assertion evidence immutable.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Release adapter</h3>
						<p class="mt-2">Connect the review receipt to your deployment service. Production traffic should remain pinned to an immutable approved version until rollout policy succeeds.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
