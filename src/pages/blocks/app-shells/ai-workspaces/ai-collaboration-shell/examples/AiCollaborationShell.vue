<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomNativeSelect, DomTabs, DomToggle, DomTooltip } from '@getdom/studio/vue';

const modeTabs = [
	{ key: 'brief', label: 'Brief' },
	{ key: 'plan', label: 'Plan' },
	{ key: 'review', label: 'Review' },
];

const agentOptions = [
	{ label: 'Research copilot', value: 'research' },
	{ label: 'Workflow assistant', value: 'workflow' },
	{ label: 'Customer strategist', value: 'customer' },
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
		effort: '2 min',
		impact: 'Reduces unsupported promises',
		status: 'Proposed',
	},
	{
		id: 'sg-2',
		label: 'Ask for missing adoption signal',
		body: 'Request active-seat trend before writing the final customer note.',
		confidence: 79,
		effort: '4 min',
		impact: 'Improves recommendation quality',
		status: 'Needs context',
	},
	{
		id: 'sg-3',
		label: 'Create follow-up task',
		body: 'Assign customer success a post-call checkpoint for expansion blockers.',
		confidence: 91,
		effort: '1 min',
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

const selectedWorkstream = computed(() => (
	workstreams.find((workstream) => workstream.id === selectedWorkstreamId.value) || workstreams[0]
));

const acceptedSuggestions = computed(() => suggestionDrafts.value.filter((suggestion) => suggestion.status === 'Accepted').length);
const waitingApprovals = computed(() => approvals.filter((approval) => approval.state === 'Waiting').length);
const contextHealth = computed(() => `${contextSources.filter((source) => source.state !== 'Stale').length}/${contextSources.length}`);
const activeAgentLabel = computed(() => agentOptions.find((agent) => agent.value === selectedAgent.value)?.label || agentOptions[0].label);

function selectWorkstream(workstream) {
	selectedWorkstreamId.value = workstream.id;
	activeMode.value = workstream.stage === 'Context check' ? 'brief' : 'plan';
}

function acceptSuggestion(suggestion) {
	suggestion.status = 'Accepted';
	activeMode.value = 'review';
}

function resetSuggestions() {
	suggestionDrafts.value = suggestions.map((suggestion) => ({ ...suggestion }));
	activeMode.value = 'plan';
}

function riskClass(risk) {
	return {
		High: 'bg-destructive/15 text-destructive',
		Medium: 'bg-warning/15 text-warning',
		Low: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
	}[risk] || 'bg-secondary text-muted-fg';
}

function sourceClass(state) {
	return {
		Fresh: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		Confirmed: 'bg-primary/15 text-primary',
		Partial: 'bg-warning/15 text-warning',
		Stale: 'bg-destructive/15 text-destructive',
	}[state] || 'bg-secondary text-muted-fg';
}

function workstreamClass(workstream) {
	return workstream.id === selectedWorkstream.value.id
		? 'border-primary/60 bg-primary/5'
		: 'border-border bg-background hover:border-primary/40';
}
</script>

<template>
	<div class="min-h-screen bg-background text-fg">
		<header class="border-b border-border skin-raised">
			<div class="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
				<div class="min-w-0">
					<p class="text-xs font-semibold uppercase text-muted-fg">AI workspace</p>
					<div class="mt-1 flex flex-wrap items-center gap-3">
						<h3 class="text-xl font-semibold">Human review room</h3>
						<span class="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
							{{ activeAgentLabel }}
						</span>
					</div>
					<p class="mt-1 max-w-3xl text-sm leading-6 text-muted-fg">
						Coordinate shared context, model suggestions, reviewer decisions, and applied changes for supervised AI work.
					</p>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<label class="min-w-48 text-sm font-medium">
						<span class="sr-only">Agent mode</span>
						<DomNativeSelect v-model="selectedAgent" :options="agentOptions" class="w-full" />
					</label>
					<DomTooltip text="Allows low-risk accepted suggestions to become draft changes automatically.">
						<label class="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium">
							<DomToggle v-model="autonomyEnabled" />
							Autonomy
						</label>
					</DomTooltip>
					<DomButton size="sm">
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						</svg>
						New run
					</DomButton>
				</div>
			</div>
		</header>

		<section class="border-b border-border bg-secondary/40 px-4 py-3">
			<div class="grid gap-3 sm:grid-cols-3">
				<div class="rounded-lg border border-border bg-background px-4 py-3">
					<p class="text-xs font-medium text-muted-fg">Accepted suggestions</p>
					<p class="mt-1 text-2xl font-semibold">{{ acceptedSuggestions }}/{{ suggestionDrafts.length }}</p>
				</div>
				<div class="rounded-lg border border-border bg-background px-4 py-3">
					<p class="text-xs font-medium text-muted-fg">Context health</p>
					<p class="mt-1 text-2xl font-semibold">{{ contextHealth }}</p>
				</div>
				<div class="rounded-lg border border-border bg-background px-4 py-3">
					<p class="text-xs font-medium text-muted-fg">Approvals waiting</p>
					<p class="mt-1 text-2xl font-semibold">{{ waitingApprovals }}</p>
				</div>
			</div>
		</section>

		<main class="space-y-4 p-4">
			<section class="rounded-xl border border-border bg-background">
				<div class="grid gap-0 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
					<div class="border-b border-border p-4 xl:border-b-0 xl:border-r">
						<div class="flex items-center justify-between gap-3">
							<div>
								<h4 class="font-semibold">Workstreams</h4>
								<p class="mt-1 text-sm text-muted-fg">Active collaboration threads</p>
							</div>
							<span class="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-muted-fg">
								{{ workstreams.length }}
							</span>
						</div>

						<div class="mt-4 grid gap-2">
							<button
								v-for="workstream in workstreams"
								:key="workstream.id"
								type="button"
								class="rounded-lg border p-3 text-left transition"
								:class="workstreamClass(workstream)"
								@click="selectWorkstream(workstream)"
							>
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="truncate text-sm font-semibold">{{ workstream.label }}</p>
										<p class="mt-1 text-xs text-muted-fg">{{ workstream.stage }} / {{ workstream.owner }}</p>
									</div>
									<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="riskClass(workstream.risk)">
										{{ workstream.risk }}
									</span>
								</div>
								<p class="mt-3 text-sm leading-6 text-muted-fg">{{ workstream.description }}</p>
								<div class="mt-3 flex items-center gap-3">
									<div class="h-1.5 flex-1 rounded-full bg-secondary">
										<div class="h-full rounded-full bg-primary" :style="{ width: `${workstream.confidence}%` }" />
									</div>
									<span class="text-xs font-medium text-muted-fg">{{ workstream.confidence }}%</span>
								</div>
							</button>
						</div>
					</div>

					<div class="p-4">
						<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
							<div class="min-w-0">
								<p class="text-sm font-medium text-muted-fg">{{ selectedWorkstream.status }}</p>
								<h4 class="mt-1 text-2xl font-semibold">{{ selectedWorkstream.label }}</h4>
								<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">{{ selectedWorkstream.description }}</p>
							</div>
							<div class="flex flex-wrap gap-2">
								<DomButton variant="ghost" size="sm" @click="resetSuggestions">Reset</DomButton>
								<DomButton size="sm">Apply approved</DomButton>
							</div>
						</div>

						<div class="mt-5">
							<DomTabs v-model="activeMode" :tabs="modeTabs">
								<template #brief>
									<div class="grid gap-3 md:grid-cols-2">
										<div
											v-for="source in contextSources"
											:key="source.id"
											class="rounded-lg border border-border bg-background p-3"
										>
											<div class="flex items-start justify-between gap-3">
												<div>
													<p class="text-sm font-semibold">{{ source.label }}</p>
													<p class="mt-1 text-xs text-muted-fg">{{ source.detail }}</p>
												</div>
												<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="sourceClass(source.state)">
													{{ source.state }}
												</span>
											</div>
										</div>
									</div>
								</template>

								<template #plan>
									<div class="grid gap-3 lg:grid-cols-3">
										<article
											v-for="suggestion in suggestionDrafts"
											:key="suggestion.id"
											class="flex min-h-64 flex-col rounded-lg border border-border bg-background p-4"
										>
											<div class="flex items-start justify-between gap-3">
												<div>
													<p class="text-sm font-semibold">{{ suggestion.label }}</p>
													<p class="mt-1 text-xs text-muted-fg">{{ suggestion.status }}</p>
												</div>
												<span class="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-fg">
													{{ suggestion.confidence }}%
												</span>
											</div>
											<p class="mt-4 flex-1 text-sm leading-6 text-muted-fg">{{ suggestion.body }}</p>
											<div class="mt-4 border-t border-border pt-3">
												<p class="text-xs font-medium text-muted-fg">{{ suggestion.impact }}</p>
												<div class="mt-3 flex items-center justify-between gap-2">
													<span class="text-xs text-muted-fg">{{ suggestion.effort }}</span>
													<DomButton
														size="sm"
														:variant="suggestion.status === 'Accepted' ? 'secondary' : 'primary'"
														@click="acceptSuggestion(suggestion)"
													>
														{{ suggestion.status === 'Accepted' ? 'Accepted' : 'Accept' }}
													</DomButton>
												</div>
											</div>
										</article>
									</div>
								</template>

								<template #review>
									<div class="grid gap-3 md:grid-cols-3">
										<div
											v-for="approval in approvals"
											:key="approval.id"
											class="rounded-lg border border-border bg-background p-4"
										>
											<div class="flex items-start justify-between gap-3">
												<div>
													<p class="text-sm font-semibold">{{ approval.label }}</p>
													<p class="mt-1 text-xs text-muted-fg">{{ approval.reviewer }}</p>
												</div>
												<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="riskClass(approval.risk)">
													{{ approval.risk }}
												</span>
											</div>
											<p class="mt-5 text-2xl font-semibold">{{ approval.state }}</p>
										</div>
									</div>
								</template>
							</DomTabs>
						</div>
					</div>
				</div>
			</section>

			<section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
				<div class="rounded-xl border border-border bg-background p-4">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h4 class="font-semibold">Collaboration timeline</h4>
							<p class="mt-1 text-sm text-muted-fg">Model actions and human decisions</p>
						</div>
						<DomButton variant="ghost" size="sm">Export log</DomButton>
					</div>

					<div class="mt-4 grid gap-3 md:grid-cols-2">
						<div
							v-for="event in activity"
							:key="event.id"
							class="rounded-lg border border-border bg-secondary/30 p-3"
						>
							<div class="flex items-start justify-between gap-3">
								<p class="text-sm font-semibold">{{ event.actor }}</p>
								<span class="text-xs text-muted-fg">{{ event.time }}</span>
							</div>
							<p class="mt-2 text-sm leading-6 text-muted-fg">{{ event.label }}</p>
						</div>
					</div>
				</div>

				<div class="rounded-xl border border-border bg-background p-4">
					<h4 class="font-semibold">Decision contract</h4>
					<div class="mt-4 space-y-3 text-sm">
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Low-risk drafts</span>
							<span class="font-medium">{{ autonomyEnabled ? 'Auto-stage' : 'Manual' }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Medium-risk changes</span>
							<span class="font-medium">Reviewer required</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">High-risk changes</span>
							<span class="font-medium">Blocked</span>
						</div>
					</div>
					<div class="mt-5 rounded-lg border border-border bg-secondary/40 p-3">
						<p class="text-sm font-semibold">Current handoff</p>
						<p class="mt-2 text-sm leading-6 text-muted-fg">
							Assistant can propose edits. Maya approves customer-facing copy. Legal owns policy exceptions.
						</p>
					</div>
				</div>
			</section>
		</main>
	</div>
</template>
