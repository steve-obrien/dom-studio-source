<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomNativeSelect, DomPopover, DomRangeInput, DomTabs, DomToggle, DomTooltip } from '@getdom/studio/vue';

const modelOptions = [
	{ label: 'GPT-4.1 mini', value: 'GPT-4.1 mini' },
	{ label: 'GPT-4.1', value: 'GPT-4.1' },
	{ label: 'Reasoning fast', value: 'Reasoning fast' },
];

const toneOptions = [
	{ label: 'Supportive', value: 'Supportive' },
	{ label: 'Concise', value: 'Concise' },
	{ label: 'Technical', value: 'Technical' },
];

const tabs = [
	{ key: 'output', label: 'Output' },
	{ key: 'checks', label: 'Checks' },
	{ key: 'history', label: 'History' },
];

const evalCases = [
	{
		id: 'refund_edge_case',
		name: 'Refund edge case',
		segment: 'Commerce support',
		risk: 'Medium',
		score: 91,
		latency: 820,
		cost: '$0.018',
		input: 'Customer bought a seat add-on 33 days ago and asks for a refund after downgrading.',
		expected: ['States 30-day policy', 'Offers account credit', 'Avoids guaranteed refund'],
		output: 'Thanks for sharing the order details. The add-on is outside the 30-day refund window, so I cannot promise a cash refund. I can help apply account credit for the unused time or route this to billing review if there was a billing error.',
		history: [
			{ label: 'Passed billing policy eval', time: '2 minutes ago', actor: 'Prompt runner' },
			{ label: 'Tone tightened for support', time: 'Today 10:21', actor: 'Maya Chen' },
			{ label: 'Case added from ticket #4821', time: 'Yesterday', actor: 'Support QA' },
		],
	},
	{
		id: 'pii_redaction',
		name: 'PII redaction',
		segment: 'Trust workflow',
		risk: 'High',
		score: 86,
		latency: 940,
		cost: '$0.024',
		input: 'User pastes a support transcript containing an email address and phone number.',
		expected: ['Masks contact details', 'Keeps issue summary', 'Flags privacy policy'],
		output: 'The transcript includes contact details, so I have redacted them before summarizing. The customer reports login recovery failure after changing devices. Suggested next step: verify ownership through the approved account recovery flow.',
		history: [
			{ label: 'PII detector passed', time: '7 minutes ago', actor: 'Safety check' },
			{ label: 'Added privacy warning', time: 'Today 09:44', actor: 'Ari Grant' },
			{ label: 'Regression case promoted', time: 'Jun 09', actor: 'Trust team' },
		],
	},
	{
		id: 'developer_docs',
		name: 'Developer docs',
		segment: 'API onboarding',
		risk: 'Low',
		score: 94,
		latency: 690,
		cost: '$0.012',
		input: 'Developer asks how to retry failed webhook deliveries without duplicating events.',
		expected: ['Mentions idempotency key', 'Explains retry endpoint', 'Suggests delivery log'],
		output: 'Use the delivery log to find the failed event, then call the retry endpoint with the original delivery id. Keep your receiver idempotent by storing the event id before side effects run, so repeated deliveries are acknowledged without duplicating work.',
		history: [
			{ label: 'Docs assertion passed', time: '12 minutes ago', actor: 'Prompt runner' },
			{ label: 'Added idempotency requirement', time: 'Today 08:16', actor: 'Jon Bell' },
			{ label: 'Synced with webhook docs', time: 'Jun 08', actor: 'Docs bot' },
		],
	},
];

const selectedCaseId = ref(evalCases[0].id);
const selectedModel = ref(modelOptions[0].value);
const selectedTone = ref(toneOptions[0].value);
const temperature = ref(0.3);
const maxTokens = ref(650);
const safetyMode = ref(true);
const activeTab = ref('output');
const runCount = ref(14);
const promptDraft = ref(`You are a product support copilot.

Use the provided account, policy, and event context.
Answer with clear next steps and no unsupported promises.
Escalate when the request needs billing, trust, or legal review.`);
const systemGuardrails = ref('Never expose private identifiers. Avoid financial commitments unless the policy context explicitly permits them.');

const selectedCase = computed(() => evalCases.find((item) => item.id === selectedCaseId.value) || evalCases[0]);
const selectedIndex = computed(() => evalCases.findIndex((item) => item.id === selectedCase.value.id));
const passRate = computed(() => Math.round(evalCases.reduce((total, item) => total + item.score, 0) / evalCases.length));
const totalCost = computed(() => `$${evalCases.reduce((total, item) => total + Number(item.cost.replace('$', '')), 0).toFixed(3)}`);
const averageLatency = computed(() => Math.round(evalCases.reduce((total, item) => total + item.latency, 0) / evalCases.length));
const outputTone = computed(() => selectedTone.value.toLowerCase());
const readinessChecks = computed(() => [
	{ label: 'All required variables mapped', passed: true },
	{ label: 'Safety guardrails enabled', passed: safetyMode.value },
	{ label: 'Regression suite above 85%', passed: passRate.value >= 85 },
	{ label: 'Output under token budget', passed: maxTokens.value >= 500 },
]);
const passedChecks = computed(() => readinessChecks.value.filter((check) => check.passed).length);
const generatedOutput = computed(() => {
	return `${selectedCase.value.output}\n\nTone: ${outputTone.value}. Model: ${selectedModel.value}. Run #${runCount.value}.`;
});

function selectCase(testCase) {
	selectedCaseId.value = testCase.id;
	activeTab.value = 'output';
}

function runPrompt() {
	runCount.value += 1;
	activeTab.value = 'output';
}

function caseClasses(testCase) {
	return testCase.id === selectedCase.value.id
		? 'border-primary/60 bg-primary/5'
		: 'border-border bg-canvas hover:border-primary/40';
}

function riskClasses(risk) {
	return {
		High: 'bg-destructive/15 text-destructive',
		Medium: 'bg-warning/15 text-warning',
		Low: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
	}[risk] || 'bg-secondary text-muted-fg';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-4 py-4 sm:px-5">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">AI feature workbench</p>
					<h3 class="mt-1 text-xl font-semibold tracking-tight">Prompt lab</h3>
					<p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">
						Tune a prompt, run realistic product cases, and check quality before publishing a new model-backed workflow.
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<DomTooltip text="Copies this prompt version for rollback or review.">
						<DomButton variant="ghost" size="sm">Duplicate</DomButton>
					</DomTooltip>
					<DomButton size="sm" @click="runPrompt">
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M8 5v14l11-7L8 5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
						</svg>
						Run suite
					</DomButton>
				</div>
			</div>

			<div class="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
				<div>
					<p class="text-xs font-medium text-muted-fg">Suite score</p>
					<p class="mt-1 text-2xl font-semibold">{{ passRate }}%</p>
				</div>
				<div>
					<p class="text-xs font-medium text-muted-fg">Avg latency</p>
					<p class="mt-1 text-2xl font-semibold">{{ averageLatency }}ms</p>
				</div>
				<div>
					<p class="text-xs font-medium text-muted-fg">Estimated cost</p>
					<p class="mt-1 text-2xl font-semibold">{{ totalCost }}</p>
				</div>
			</div>
		</header>

		<div class="grid min-h-[48rem] lg:grid-cols-[18rem_minmax(0,1fr)_21rem]">
			<aside class="border-b border-border skin-card p-3 lg:border-b-0 lg:border-r">
				<div class="flex items-center justify-between gap-3 px-1 pb-3">
					<div>
						<h4 class="text-sm font-semibold">Eval cases</h4>
						<p class="mt-1 text-xs text-muted-fg">{{ evalCases.length }} regression checks</p>
					</div>
					<span class="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-muted-fg">{{ selectedIndex + 1 }}/{{ evalCases.length }}</span>
				</div>

				<div class="space-y-2">
					<button
						v-for="testCase in evalCases"
						:key="testCase.id"
						type="button"
						class="w-full rounded-lg border p-3 text-left transition"
						:class="caseClasses(testCase)"
						@click="selectCase(testCase)"
					>
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<p class="truncate text-sm font-semibold">{{ testCase.name }}</p>
								<p class="mt-1 text-xs text-muted-fg">{{ testCase.segment }}</p>
							</div>
							<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="riskClasses(testCase.risk)">
								{{ testCase.risk }}
							</span>
						</div>
						<div class="mt-3 h-1.5 rounded-full bg-secondary">
							<div class="h-full rounded-full bg-primary" :style="{ width: `${testCase.score}%` }" />
						</div>
						<p class="mt-2 text-xs text-muted-fg">{{ testCase.score }} quality score</p>
					</button>
				</div>
			</aside>

			<main class="min-w-0 border-b border-border lg:border-b-0">
				<div class="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
					<section class="border-b border-border p-4 sm:p-5 lg:border-b-0 lg:border-r">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div>
								<h4 class="font-semibold">Prompt draft</h4>
								<p class="mt-1 text-sm text-muted-fg">Version 7, edited for support escalation.</p>
							</div>
							<DomPopover width="w-[19rem]" padding="p-0" label="Variables">
								<template #trigger>
									<DomButton variant="ghost" size="sm">Variables</DomButton>
								</template>
								<div class="divide-y divide-border text-sm">
									<div class="p-3">
										<p class="font-semibold">Available variables</p>
										<p class="mt-1 text-xs leading-5 text-muted-fg">Use these tokens in the prompt body.</p>
									</div>
									<div class="space-y-2 p-3 font-mono text-xs">
										<p>{customer.name}</p>
										<p>{account.plan}</p>
										<p>{policy.refund_window}</p>
										<p>{recent_events}</p>
									</div>
								</div>
							</DomPopover>
						</div>

						<label class="mt-4 block text-sm font-medium">
							Instructions
							<textarea
								v-model="promptDraft"
								class="mt-2 min-h-56 w-full resize-none rounded-xl border border-border bg-canvas p-3 font-mono text-sm leading-6 outline-none transition focus:border-primary"
								spellcheck="false"
							/>
						</label>

						<label class="mt-4 block text-sm font-medium">
							System guardrails
							<textarea
								v-model="systemGuardrails"
								class="mt-2 min-h-28 w-full resize-none rounded-xl border border-border bg-canvas p-3 text-sm leading-6 outline-none transition focus:border-primary"
							/>
						</label>

						<div class="mt-4 grid gap-3 sm:grid-cols-2">
							<label class="block text-sm font-medium">
								Model
								<DomNativeSelect v-model="selectedModel" :options="modelOptions" class="mt-2 w-full" />
							</label>
							<label class="block text-sm font-medium">
								Tone
								<DomNativeSelect v-model="selectedTone" :options="toneOptions" class="mt-2 w-full" />
							</label>
						</div>

						<div class="mt-4 grid gap-4 sm:grid-cols-2">
							<DomRangeInput v-model="temperature" label="Temperature" :min="0" :max="1" :step="0.1" />
							<DomRangeInput v-model="maxTokens" label="Max tokens" :min="250" :max="1000" :step="50" />
						</div>
					</section>

					<section class="p-4 sm:p-5">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<h4 class="font-semibold">{{ selectedCase.name }}</h4>
								<p class="mt-1 text-sm leading-6 text-muted-fg">{{ selectedCase.input }}</p>
							</div>
							<span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="riskClasses(selectedCase.risk)">
								{{ selectedCase.risk }} risk
							</span>
						</div>

						<div class="mt-4 border-b border-border">
							<DomTabs v-model="activeTab" :tabs="tabs" />
						</div>

						<div v-if="activeTab === 'output'" class="pt-4">
							<div class="rounded-xl border border-border bg-secondary/40 p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Generated answer</p>
								<p class="mt-3 whitespace-pre-line text-sm leading-7">{{ generatedOutput }}</p>
							</div>

							<div class="mt-4 grid gap-3 sm:grid-cols-3">
								<div class="rounded-lg border border-border p-3">
									<p class="text-xs text-muted-fg">Quality</p>
									<p class="mt-1 text-lg font-semibold">{{ selectedCase.score }}%</p>
								</div>
								<div class="rounded-lg border border-border p-3">
									<p class="text-xs text-muted-fg">Latency</p>
									<p class="mt-1 text-lg font-semibold">{{ selectedCase.latency }}ms</p>
								</div>
								<div class="rounded-lg border border-border p-3">
									<p class="text-xs text-muted-fg">Cost</p>
									<p class="mt-1 text-lg font-semibold">{{ selectedCase.cost }}</p>
								</div>
							</div>
						</div>

						<div v-else-if="activeTab === 'checks'" class="pt-4">
							<div class="divide-y divide-border rounded-xl border border-border">
								<div
									v-for="term in selectedCase.expected"
									:key="term"
									class="flex items-center justify-between gap-3 p-3"
								>
									<span class="text-sm font-medium">{{ term }}</span>
									<span class="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Passed</span>
								</div>
							</div>

							<div class="mt-4 rounded-xl border border-border bg-secondary/40 p-4">
								<div class="flex items-center justify-between gap-3">
									<div>
										<h5 class="text-sm font-semibold">Safety mode</h5>
										<p class="mt-1 text-xs leading-5 text-muted-fg">Blocks unsafe claims, exposed identifiers, and unsupported tool calls.</p>
									</div>
									<DomToggle v-model="safetyMode" aria-label="Toggle safety mode" />
								</div>
							</div>
						</div>

						<div v-else class="divide-y divide-border pt-2">
							<div
								v-for="event in selectedCase.history"
								:key="`${event.label}-${event.time}`"
								class="flex items-start justify-between gap-3 py-3"
							>
								<div>
									<p class="text-sm font-medium">{{ event.label }}</p>
									<p class="mt-1 text-xs text-muted-fg">{{ event.actor }}</p>
								</div>
								<p class="shrink-0 text-xs text-muted-fg">{{ event.time }}</p>
							</div>
						</div>
					</section>
				</div>
			</main>

			<aside class="skin-card p-4 lg:border-l">
				<div class="rounded-xl border border-border bg-canvas p-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<h4 class="font-semibold">Release readiness</h4>
							<p class="mt-1 text-xs text-muted-fg">{{ passedChecks }}/{{ readinessChecks.length }} checks passed</p>
						</div>
						<span class="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">Draft</span>
					</div>

					<div class="mt-4 space-y-3">
						<div
							v-for="check in readinessChecks"
							:key="check.label"
							class="flex items-start gap-3"
						>
							<span
								class="mt-1 size-2.5 rounded-full"
								:class="check.passed ? 'bg-emerald-500' : 'bg-warning'"
							/>
							<p class="text-sm leading-5" :class="check.passed ? 'text-canvas-fg' : 'text-muted-fg'">{{ check.label }}</p>
						</div>
					</div>

					<div class="mt-4 grid grid-cols-2 gap-2">
						<DomButton variant="ghost" size="sm">Save draft</DomButton>
						<DomButton size="sm">Request review</DomButton>
					</div>
				</div>

				<div class="mt-4 rounded-xl border border-border bg-canvas p-4">
					<h4 class="font-semibold">Deployment target</h4>
					<div class="mt-3 space-y-3 text-sm">
						<div class="flex justify-between gap-3">
							<span class="text-muted-fg">Environment</span>
							<span class="font-medium">Staging</span>
						</div>
						<div class="flex justify-between gap-3">
							<span class="text-muted-fg">Traffic</span>
							<span class="font-medium">10%</span>
						</div>
						<div class="flex justify-between gap-3">
							<span class="text-muted-fg">Owner</span>
							<span class="font-medium">AI Platform</span>
						</div>
					</div>
				</div>

				<div class="mt-4 rounded-xl border border-border bg-canvas p-4">
					<h4 class="font-semibold">Run notes</h4>
					<p class="mt-2 text-sm leading-6 text-muted-fg">
						Compare this output with support policy and recent failed tickets before promoting the prompt version.
					</p>
				</div>
			</aside>
		</div>
	</div>
</template>
