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
			tagline="A responsive prompt engineering workspace for testing LLM instructions against reusable eval cases before shipping an AI feature."
			tag="AI UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Developer Experience" title="AI prompt lab">
				<Example
					:source="AiPromptLabSrc"
					filename="AiPromptLab.vue"
					presentation="iframe"
					frame-src="/blocks/developer-experience/ai-prompt-lab/preview/AiPromptLab"
					description="Copy this into an AI feature console, internal model playground, prompt management screen, QA workbench, or customer-facing automation builder. Replace the local arrays with prompts, eval cases, model metrics, and run history from your backend."
					default-open
					:preview-lines="14"
				>
					<AiPromptLab />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when teams need to tune an AI workflow with practical product safeguards.
						It combines prompt editing, model controls, eval fixtures, output review, safety checks, cost signals, and run history in one copyable surface.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>evalCases</code> with fixtures from your product domain, including input variables, expected terms, risk level, and ground-truth notes.</li>
						<li>Connect the run action to your AI gateway or job API, then store prompt version, model, parameters, token counts, latency, and reviewer outcome.</li>
						<li>Persist prompt drafts separately from approved prompt versions so production traffic can stay pinned to a stable revision.</li>
						<li>Wire safety checks to policy validators, PII detectors, tool-call limits, eval assertions, and human review workflows before deployment.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended prompt run shape">
				<CodeBlock lang="js" filename="prompt-run.js" :code="`{
\tid: 'run_qa_1428',
\tpromptId: 'customer-reply-v7',
\tmodel: 'gpt-4.1-mini',
\tstatus: 'passed',
\tcaseId: 'refund_edge_case',
\tparameters: {
\t\ttemperature: 0.3,
\t\tmaxTokens: 650,
\t\tsafetyMode: true
\t},
\tmetrics: {
\t\tqualityScore: 91,
\t\tlatencyMs: 820,
\t\tinputTokens: 1240,
\t\toutputTokens: 312,
\t\testimatedCost: 0.018
\t},
\tchecks: [
\t\t{ label: 'Mentions refund window', status: 'passed' },
\t\t{ label: 'Avoids unsupported promise', status: 'passed' }
\t],
\toutput: 'Thanks for the order details...',
\treviewer: 'Maya Chen',
\tcreatedAt: '2026-06-10T10:42:00Z'
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Prompt versions</h3>
						<p class="mt-2">Save every approved prompt as an immutable version with model settings, variables, eval suite, and release notes.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Eval coverage</h3>
						<p class="mt-2">Keep regression cases close to real product failures: missing context, unsafe requests, angry customers, and ambiguous user intent.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include prompt diffing, dataset import, tool-call traces, approval gates, red-team case generation, and live A/B rollout controls.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
