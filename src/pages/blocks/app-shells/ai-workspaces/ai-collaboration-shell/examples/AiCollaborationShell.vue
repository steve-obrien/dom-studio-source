<script setup>
import { computed, ref } from 'vue';
import {
	DomAvatar,
	DomButton,
	DomCard,
	DomSelect,
	DomStatusPill,
	DomTabs,
	DomToggle,
	DomTooltip,
} from '@getdom/studio/vue';

const modeTabs = [
	{ key: 'brief', label: 'Brief' },
	{ key: 'plan', label: 'Plan' },
	{ key: 'review', label: 'Review' },
];

const agentOptions = [
	{
		label: 'Research copilot',
		value: 'research',
		description: 'Synthesizes account evidence and highlights unsupported claims.',
		initials: 'RC',
		role: 'Evidence synthesis',
		tone: 'info',
	},
	{
		label: 'Workflow assistant',
		value: 'workflow',
		description: 'Turns approved decisions into tasks and operational handoffs.',
		initials: 'WA',
		role: 'Task orchestration',
		tone: 'success',
	},
	{
		label: 'Customer strategist',
		value: 'customer',
		description: 'Drafts customer-safe recommendations from approved context.',
		initials: 'CS',
		role: 'Customer strategy',
		tone: 'warning',
	},
];

const workstreams = [
	{
		id: 'renewal-plan',
		label: 'Renewal rescue plan',
		stage: 'Human review',
		owner: 'Maya',
		confidence: 87,
		risk: 'Medium',
		status: 'Needs decision',
		description: 'Turn expansion notes, billing policy, and success signals into a customer-safe retention plan.',
	},
	{
		id: 'release-digest',
		label: 'Release digest',
		stage: 'Drafting',
		owner: 'Jon',
		confidence: 92,
		risk: 'Low',
		status: 'Ready to edit',
		description: 'Summarize shipped product changes for support, docs, and customer-facing updates.',
	},
	{
		id: 'policy-gap',
		label: 'Policy gap review',
		stage: 'Context check',
		owner: 'Ari',
		confidence: 74,
		risk: 'High',
		status: 'Source mismatch',
		description: 'Compare legal guidance with help-center copy before the assistant drafts new responses.',
	},
];

const workstreamOptions = workstreams.map((workstream) => ({
	...workstream,
	value: workstream.id,
	description: `${workstream.stage} with ${workstream.owner} / ${workstream.confidence}% confidence`,
}));

const contextSources = [
	{ id: 'crm-renewal-note', label: 'CRM renewal note', state: 'Fresh', detail: 'Updated 14 minutes ago' },
	{ id: 'billing-policy', label: 'Billing policy', state: 'Confirmed', detail: 'Reviewed by finance' },
	{ id: 'success-call', label: 'Success call transcript', state: 'Partial', detail: 'Speaker labels pending' },
	{ id: 'pricing-doc', label: 'Pricing doc', state: 'Stale', detail: 'Last changed Jun 02' },
];

const suggestions = [
	{
		id: 'sg-1',
		label: 'Add concession guardrail',
		body: 'Limit discount language to approved renewal bands and route exceptions to finance.',
		confidence: 87,
		effort: '2 min review',
		impact: 'Reduces unsupported promises',
		status: 'Proposed',
	},
	{
		id: 'sg-2',
		label: 'Ask for missing adoption signal',
		body: 'Request active-seat trend before writing the final customer note.',
		confidence: 79,
		effort: '4 min review',
		impact: 'Improves recommendation quality',
		status: 'Needs context',
	},
	{
		id: 'sg-3',
		label: 'Create follow-up task',
		body: 'Assign customer success a post-call checkpoint for expansion blockers.',
		confidence: 91,
		effort: '1 min review',
		impact: 'Keeps owner accountable',
		status: 'Ready',
	},
];

const approvals = [
	{ id: 'ap-1', label: 'Discount recommendation', reviewer: 'Finance', risk: 'Medium', state: 'Waiting' },
	{ id: 'ap-2', label: 'Customer-facing summary', reviewer: 'Maya', risk: 'Low', state: 'Approved' },
	{ id: 'ap-3', label: 'Policy exception', reviewer: 'Legal', risk: 'High', state: 'Blocked' },
];

const activity = [
	{ id: 'a1', actor: 'Assistant', label: 'Matched renewal risk to playbook section 4.2', time: 'Now' },
	{ id: 'a2', actor: 'Maya', label: 'Pinned billing policy as required context', time: '6 min ago' },
	{ id: 'a3', actor: 'Assistant', label: 'Drafted three retention plan options', time: '11 min ago' },
	{ id: 'a4', actor: 'Ari', label: 'Flagged stale pricing document', time: '18 min ago' },
];

const selectedWorkstreamId = ref(workstreams[0].id);
const selectedAgent = ref(agentOptions[0].value);
const activeMode = ref('plan');
const autonomyEnabled = ref(false);
const suggestionDrafts = ref(suggestions.map((suggestion) => ({ ...suggestion })));
const runNumber = ref(24);
const runStatus = ref('Run 24 / review active');

const selectedWorkstream = computed(() => (
	workstreams.find((workstream) => workstream.id === selectedWorkstreamId.value) || workstreams[0]
));
const activeAgent = computed(() => (
	agentOptions.find((agent) => agent.value === selectedAgent.value) || agentOptions[0]
));
const acceptedSuggestions = computed(() => suggestionDrafts.value.filter((suggestion) => (
	['Accepted', 'Applied'].includes(suggestion.status)
)).length);
const waitingApprovals = computed(() => approvals.filter((approval) => approval.state === 'Waiting').length);
const contextHealth = computed(() => `${contextSources.filter((source) => source.state !== 'Stale').length}/${contextSources.length}`);

/**
 * Select a workstream and open the mode that best matches its current stage.
 *
 * @param {{ id: string, stage: string }} workstream Workstream selected from the desktop rail.
 * @returns {void}
 */
function selectWorkstream(workstream) {
	selectedWorkstreamId.value = workstream.id;
	activeMode.value = workstream.stage === 'Context check' ? 'brief' : 'plan';
}

/**
 * Select a workstream from the responsive rich select control.
 *
 * @param {string} workstreamId Workstream identifier emitted by DomSelect.
 * @returns {void}
 */
function selectWorkstreamById(workstreamId) {
	const workstream = workstreams.find((item) => item.id === workstreamId);
	if (workstream) selectWorkstream(workstream);
}

/**
 * Accept a model suggestion and move the workspace into human review mode.
 *
 * @param {{ status: string }} suggestion Mutable suggestion record selected by the reviewer.
 * @returns {void}
 */
function acceptSuggestion(suggestion) {
	suggestion.status = 'Accepted';
	runStatus.value = 'Suggestion accepted / review required';
	activeMode.value = 'review';
}

/**
 * Apply every accepted suggestion to the current collaboration run.
 *
 * @returns {void}
 */
function applyAcceptedSuggestions() {
	suggestionDrafts.value.forEach((suggestion) => {
		if (suggestion.status === 'Accepted') suggestion.status = 'Applied';
	});
	runStatus.value = 'Approved changes applied';
	activeMode.value = 'review';
}

/**
 * Restore the original suggestion states for the active workstream.
 *
 * @returns {void}
 */
function resetSuggestions() {
	suggestionDrafts.value = suggestions.map((suggestion) => ({ ...suggestion }));
	runStatus.value = `Run ${runNumber.value} / review active`;
	activeMode.value = 'plan';
}

/**
 * Start a fresh collaboration run using the currently selected agent.
 *
 * @returns {void}
 */
function startNewRun() {
	runNumber.value += 1;
	resetSuggestions();
	runStatus.value = `Run ${runNumber.value} / context check`;
	activeMode.value = 'brief';
}

/**
 * Map a risk label to a semantic DOM Studio status tone.
 *
 * @param {string} risk Risk label to represent.
 * @returns {'success'|'warning'|'danger'|'neutral'} Semantic status tone.
 */
function riskTone(risk) {
	return {
		High: 'danger',
		Medium: 'warning',
		Low: 'success',
	}[risk] || 'neutral';
}

/**
 * Map a source state to a semantic DOM Studio status tone.
 *
 * @param {string} state Context source state.
 * @returns {'success'|'primary'|'warning'|'danger'|'neutral'} Semantic status tone.
 */
function sourceTone(state) {
	return {
		Fresh: 'success',
		Confirmed: 'primary',
		Partial: 'warning',
		Stale: 'danger',
	}[state] || 'neutral';
}

/**
 * Map a suggestion state to a semantic DOM Studio status tone.
 *
 * @param {string} state Suggestion workflow state.
 * @returns {'success'|'primary'|'warning'|'info'|'neutral'} Semantic status tone.
 */
function suggestionTone(state) {
	return {
		Accepted: 'success',
		Applied: 'primary',
		'Needs context': 'warning',
		Ready: 'info',
	}[state] || 'neutral';
}

/**
 * Map an approval state to a semantic DOM Studio status tone.
 *
 * @param {string} state Approval workflow state.
 * @returns {'success'|'warning'|'danger'|'neutral'} Semantic status tone.
 */
function approvalTone(state) {
	return {
		Approved: 'success',
		Waiting: 'warning',
		Blocked: 'danger',
	}[state] || 'neutral';
}
</script>

<template>
	<div class="min-h-screen bg-secondary/30 text-canvas-fg">
		<header class="border-b border-border bg-canvas">
			<div class="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">AI workspace / supervised changes</p>
						<DomStatusPill tone="success" :label="runStatus" size="sm" pulse />
					</div>
					<h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Human review room</h1>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
						Review evidence, approve model suggestions, and keep every applied change accountable.
					</p>
				</div>

				<div class="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[36rem]">
					<DomSelect
						v-model="selectedAgent"
						:options="agentOptions"
						label="Active agent"
						width="min-w-[20rem]"
						class="w-full"
					>
						<template #value>
							<span class="flex min-w-0 items-center gap-2">
								<DomAvatar :name="activeAgent.label" :initials="activeAgent.initials" size="xs" />
								<span class="truncate font-medium">{{ activeAgent.label }}</span>
								<DomStatusPill :tone="activeAgent.tone" :label="activeAgent.role" size="sm" />
							</span>
						</template>
						<template #option="{ option, selected }">
							<span class="flex items-start gap-3">
								<DomAvatar :name="option.label" :initials="option.initials" size="sm" />
								<span class="min-w-0 flex-1">
									<span class="flex flex-wrap items-center gap-2">
										<span class="font-medium">{{ option.label }}</span>
										<DomStatusPill :tone="option.tone" :label="option.role" size="sm" />
									</span>
									<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ option.description }}</span>
									<span v-if="selected" class="mt-2 block text-xs font-medium text-primary">Active agent</span>
								</span>
							</span>
						</template>
					</DomSelect>

					<div class="flex flex-wrap items-center gap-2">
						<DomTooltip text="Allows accepted low-risk suggestions to become staged drafts automatically.">
							<label class="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-canvas px-3 text-sm font-medium">
								<DomToggle v-model="autonomyEnabled" />
								Autonomy
							</label>
						</DomTooltip>
						<DomButton size="sm" @click="startNewRun">New run</DomButton>
					</div>
				</div>
			</div>
		</header>

		<section class="border-b border-border bg-canvas" aria-label="Workspace summary">
			<dl class="mx-auto grid w-full max-w-screen-2xl grid-cols-3 divide-x divide-border px-4 sm:px-6 lg:px-8">
				<div class="py-3 pr-3 sm:py-4">
					<dt class="text-[11px] font-medium leading-4 text-muted-fg sm:text-xs">Accepted</dt>
					<dd class="mt-1 text-lg font-semibold tabular-nums sm:text-xl">{{ acceptedSuggestions }}/{{ suggestionDrafts.length }}</dd>
				</div>
				<div class="px-3 py-3 sm:py-4">
					<dt class="text-[11px] font-medium leading-4 text-muted-fg sm:text-xs">Context health</dt>
					<dd class="mt-1 text-lg font-semibold tabular-nums sm:text-xl">{{ contextHealth }}</dd>
				</div>
				<div class="py-3 pl-3 sm:py-4">
					<dt class="text-[11px] font-medium leading-4 text-muted-fg sm:text-xs">Waiting</dt>
					<dd class="mt-1 text-lg font-semibold tabular-nums sm:text-xl">{{ waitingApprovals }}</dd>
				</div>
			</dl>
		</section>

		<main class="mx-auto grid w-full max-w-screen-2xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:px-8 lg:py-8">
			<DomCard as="aside" padding="none" class="hidden lg:sticky lg:top-4 lg:block" aria-labelledby="workstreams-heading">
				<div class="border-b border-border p-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<h2 id="workstreams-heading" class="font-semibold">Workstreams</h2>
							<p class="mt-1 text-xs text-muted-fg">{{ workstreams.length }} active review threads</p>
						</div>
						<DomStatusPill tone="neutral" :label="String(workstreams.length)" size="sm" :dot="false" />
					</div>
				</div>

				<nav class="divide-y divide-border" aria-label="AI collaboration workstreams">
					<button
						v-for="workstream in workstreams"
						:key="workstream.id"
						type="button"
						class="w-full border-l-2 px-4 py-4 text-left transition"
						:class="workstream.id === selectedWorkstream.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-secondary/50'"
						:aria-pressed="workstream.id === selectedWorkstream.id"
						@click="selectWorkstream(workstream)"
					>
						<span class="flex items-start justify-between gap-2">
							<span class="min-w-0">
								<span class="block truncate text-sm font-semibold">{{ workstream.label }}</span>
								<span class="mt-1 block text-xs text-muted-fg">{{ workstream.stage }} / {{ workstream.owner }}</span>
							</span>
							<DomStatusPill :tone="riskTone(workstream.risk)" :label="workstream.risk" size="sm" />
						</span>
						<span class="mt-3 flex items-center gap-2 text-xs text-muted-fg">
							<span class="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
								<span class="block h-full rounded-full bg-primary" :style="{ width: `${workstream.confidence}%` }"></span>
							</span>
							{{ workstream.confidence }}%
						</span>
					</button>
				</nav>
			</DomCard>

			<div class="min-w-0 space-y-5">
				<div class="lg:hidden">
					<DomSelect
						v-model="selectedWorkstreamId"
						:options="workstreamOptions"
						label="Workstream"
						width="min-w-[18rem]"
						class="w-full"
						@update:model-value="selectWorkstreamById"
					>
						<template #value>
							<span class="flex min-w-0 flex-1 items-center justify-between gap-3">
								<span class="truncate font-medium">{{ selectedWorkstream.label }}</span>
								<DomStatusPill :tone="riskTone(selectedWorkstream.risk)" :label="selectedWorkstream.risk" size="sm" />
							</span>
						</template>
						<template #option="{ option }">
							<span class="block min-w-0">
								<span class="flex items-center justify-between gap-3">
									<span class="font-medium">{{ option.label }}</span>
									<DomStatusPill :tone="riskTone(option.risk)" :label="option.risk" size="sm" />
								</span>
								<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ option.description }}</span>
							</span>
						</template>
					</DomSelect>
				</div>

				<DomCard as="section" padding="none" aria-labelledby="active-workstream-heading">
					<div class="flex flex-col gap-4 border-b border-border p-4 sm:p-6 md:flex-row md:items-start md:justify-between">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<DomStatusPill :tone="riskTone(selectedWorkstream.risk)" :label="selectedWorkstream.risk + ' risk'" size="sm" />
								<p class="text-xs font-medium text-muted-fg">{{ selectedWorkstream.status }}</p>
							</div>
							<h2 id="active-workstream-heading" class="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{{ selectedWorkstream.label }}</h2>
							<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">{{ selectedWorkstream.description }}</p>
						</div>
						<div class="flex flex-wrap gap-2">
							<DomButton variant="ghost" size="sm" @click="resetSuggestions">Reset</DomButton>
							<DomButton size="sm" :disabled="acceptedSuggestions === 0" @click="applyAcceptedSuggestions">Apply accepted</DomButton>
						</div>
					</div>

					<div class="p-4 sm:p-6">
						<DomTabs v-model="activeMode" :tabs="modeTabs">
							<template #brief>
								<ul class="divide-y divide-border border-y border-border">
									<li v-for="source in contextSources" :key="source.id" class="flex items-start justify-between gap-4 py-4">
										<div>
											<p class="text-sm font-semibold">{{ source.label }}</p>
											<p class="mt-1 text-xs text-muted-fg">{{ source.detail }}</p>
										</div>
										<DomStatusPill :tone="sourceTone(source.state)" :label="source.state" size="sm" />
									</li>
								</ul>
							</template>

							<template #plan>
								<ul class="divide-y divide-border border-y border-border">
									<li v-for="suggestion in suggestionDrafts" :key="suggestion.id" class="grid gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
										<div class="min-w-0">
											<div class="flex flex-wrap items-center gap-2">
												<h3 class="text-sm font-semibold">{{ suggestion.label }}</h3>
												<DomStatusPill :tone="suggestionTone(suggestion.status)" :label="suggestion.status" size="sm" />
												<span class="text-xs font-medium text-muted-fg">{{ suggestion.confidence }}% confidence</span>
											</div>
											<p class="mt-2 text-sm leading-6 text-muted-fg">{{ suggestion.body }}</p>
											<p class="mt-2 text-xs text-muted-fg">{{ suggestion.impact }} / {{ suggestion.effort }}</p>
										</div>
										<DomButton
											size="sm"
											:variant="['Accepted', 'Applied'].includes(suggestion.status) ? 'secondary' : 'primary'"
											:disabled="['Accepted', 'Applied'].includes(suggestion.status)"
											@click="acceptSuggestion(suggestion)"
										>
											{{ suggestion.status === 'Applied' ? 'Applied' : suggestion.status === 'Accepted' ? 'Accepted' : 'Accept' }}
										</DomButton>
									</li>
								</ul>
							</template>

							<template #review>
								<ul class="divide-y divide-border border-y border-border">
									<li v-for="approval in approvals" :key="approval.id" class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
										<div>
											<p class="text-sm font-semibold">{{ approval.label }}</p>
											<p class="mt-1 text-xs text-muted-fg">Reviewer / {{ approval.reviewer }}</p>
										</div>
										<div class="flex items-center gap-2">
											<DomStatusPill :tone="riskTone(approval.risk)" :label="approval.risk + ' risk'" size="sm" />
											<DomStatusPill :tone="approvalTone(approval.state)" :label="approval.state" size="sm" />
										</div>
									</li>
								</ul>
							</template>
						</DomTabs>
					</div>
				</DomCard>

				<div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
					<DomCard as="section" padding="none" aria-labelledby="timeline-heading">
						<div class="border-b border-border p-4 sm:px-6">
							<h2 id="timeline-heading" class="font-semibold">Collaboration timeline</h2>
							<p class="mt-1 text-xs text-muted-fg">Model actions and human decisions</p>
						</div>
						<ol class="divide-y divide-border px-4 sm:px-6">
							<li v-for="event in activity" :key="event.id" class="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 py-3 text-sm sm:grid-cols-[5rem_minmax(0,1fr)_auto]">
								<p class="font-semibold">{{ event.actor }}</p>
								<p class="leading-6 text-muted-fg">{{ event.label }}</p>
								<time class="col-start-2 text-xs text-muted-fg sm:col-auto">{{ event.time }}</time>
							</li>
						</ol>
					</DomCard>

					<DomCard as="section" padding="none" aria-labelledby="decision-contract-heading">
						<div class="border-b border-border p-4 sm:px-6">
							<h2 id="decision-contract-heading" class="font-semibold">Decision contract</h2>
							<p class="mt-1 text-xs text-muted-fg">What the agent can change</p>
						</div>
						<dl class="divide-y divide-border px-4 text-sm sm:px-6">
							<div class="flex items-center justify-between gap-3 py-3">
								<dt class="text-muted-fg">Low-risk drafts</dt>
								<dd><DomStatusPill :tone="autonomyEnabled ? 'success' : 'neutral'" :label="autonomyEnabled ? 'Auto-stage' : 'Manual'" size="sm" /></dd>
							</div>
							<div class="flex items-center justify-between gap-3 py-3">
								<dt class="text-muted-fg">Medium risk</dt>
								<dd><DomStatusPill tone="warning" label="Reviewer" size="sm" /></dd>
							</div>
							<div class="flex items-center justify-between gap-3 py-3">
								<dt class="text-muted-fg">High risk</dt>
								<dd><DomStatusPill tone="danger" label="Blocked" size="sm" /></dd>
							</div>
						</dl>
						<p class="border-t border-border bg-secondary/40 p-4 text-xs leading-5 text-muted-fg sm:px-6">
							Maya approves customer-facing copy. Legal owns policy exceptions.
						</p>
					</DomCard>
				</div>
			</div>
		</main>
	</div>
</template>
