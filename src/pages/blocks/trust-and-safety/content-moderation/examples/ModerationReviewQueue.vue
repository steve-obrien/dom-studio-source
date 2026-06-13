<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomNativeSelect, DomTextareaInput, DomToggle } from '@getdom/studio/vue';

const initialCases = [
	{
		id: 'mod-1048',
		title: 'Targeted comment in launch thread',
		type: 'Comment',
		status: 'Needs review',
		severity: 'High',
		queue: 'Community reports',
		reportCount: 12,
		age: '18 min',
		author: 'Maya K.',
		authorScore: 62,
		authorHistory: '2 prior warnings',
		content: 'This reply includes repeated targeted language toward another workspace member during a product launch discussion.',
		context: 'Thread: Checkout rollout feedback',
		recommendedAction: 'Remove content',
		policies: [
			{ label: 'Harassment', confidence: 86, matched: true },
			{ label: 'Personal data', confidence: 18, matched: false },
			{ label: 'Spam pattern', confidence: 12, matched: false },
		],
		evidence: ['12 member reports', 'Classifier match: harassment', 'Author warned on Jun 4'],
		activity: [
			{ label: 'Report threshold reached', detail: '12 reports from 9 unique members.', time: '09:58' },
			{ label: 'Classifier attached signal', detail: 'Harassment confidence increased to 86%.', time: '09:51' },
			{ label: 'First report received', detail: 'Reporter selected targeted abuse.', time: '09:40' },
		],
	},
	{
		id: 'mod-1049',
		title: 'Marketplace listing with off-platform payment request',
		type: 'Listing',
		status: 'Needs review',
		severity: 'Medium',
		queue: 'Marketplace',
		reportCount: 5,
		age: '44 min',
		author: 'Northline Studio',
		authorScore: 81,
		authorHistory: 'No prior actions',
		content: 'Listing description asks buyers to message a phone number for a lower price and avoid platform checkout.',
		context: 'Listing: Brand kit template bundle',
		recommendedAction: 'Request changes',
		policies: [
			{ label: 'Payment bypass', confidence: 78, matched: true },
			{ label: 'Spam pattern', confidence: 33, matched: false },
			{ label: 'Counterfeit goods', confidence: 8, matched: false },
		],
		evidence: ['5 buyer reports', 'Phone number detected', 'Checkout bypass phrase detected'],
		activity: [
			{ label: 'Seller listing paused', detail: 'Auto-hold applied while review is open.', time: '09:32' },
			{ label: 'Pattern detector ran', detail: 'Matched payment bypass terms.', time: '09:26' },
			{ label: 'Report submitted', detail: 'Buyer reported off-platform request.', time: '09:14' },
		],
	},
	{
		id: 'mod-1050',
		title: 'AI generated answer flagged for medical advice',
		type: 'AI output',
		status: 'Escalated',
		severity: 'Critical',
		queue: 'AI safety',
		reportCount: 3,
		age: '1 hr',
		author: 'Assistant run 87B2',
		authorScore: 48,
		authorHistory: 'Model policy review pending',
		content: 'Generated answer gives specific treatment instructions without asking the user to consult a licensed clinician.',
		context: 'Conversation: Symptom triage helper',
		recommendedAction: 'Escalate',
		policies: [
			{ label: 'Medical safety', confidence: 91, matched: true },
			{ label: 'Self-harm', confidence: 9, matched: false },
			{ label: 'Personal data', confidence: 22, matched: false },
		],
		evidence: ['3 reviewer reports', 'Sensitive domain detected', 'Guardrail missed final answer'],
		activity: [
			{ label: 'Escalation opened', detail: 'Sent to policy specialist queue.', time: '09:08' },
			{ label: 'Guardrail replay started', detail: 'Safety eval run queued.', time: '09:05' },
			{ label: 'Internal report added', detail: 'QA reviewer flagged unsafe advice.', time: '08:59' },
		],
	},
];

const statusOptions = [
	{ label: 'Needs review', value: 'Needs review' },
	{ label: 'Escalated', value: 'Escalated' },
	{ label: 'Actioned', value: 'Actioned' },
];

const decisionOptions = [
	{ label: 'Remove content', value: 'Remove content' },
	{ label: 'Request changes', value: 'Request changes' },
	{ label: 'Warn author', value: 'Warn author' },
	{ label: 'Escalate', value: 'Escalate' },
	{ label: 'No violation', value: 'No violation' },
];

const reasonOptions = [
	{ label: 'Harassment policy', value: 'Harassment policy' },
	{ label: 'Marketplace policy', value: 'Marketplace policy' },
	{ label: 'Medical safety policy', value: 'Medical safety policy' },
	{ label: 'Spam or manipulation', value: 'Spam or manipulation' },
	{ label: 'No policy violation', value: 'No policy violation' },
];

const cases = ref(initialCases.map((item) => ({ ...item })));
const selectedCaseId = ref('mod-1048');
const statusFilter = ref('Needs review');
const decision = ref('Remove content');
const reason = ref('Harassment policy');
const note = ref('Remove the comment and notify the author with policy guidance.');
const notifyAuthor = ref(true);
const lockThread = ref(false);
const lastSavedCaseId = ref('');

const filteredCases = computed(() => cases.value.filter((item) => statusFilter.value === 'All' || item.status === statusFilter.value));
const selectedCase = computed(() => cases.value.find((item) => item.id === selectedCaseId.value) || cases.value[0]);
const queueStats = computed(() => [
	{ label: 'Open cases', value: cases.value.filter((item) => item.status !== 'Actioned').length },
	{ label: 'Critical', value: cases.value.filter((item) => item.severity === 'Critical').length },
	{ label: 'Reports', value: cases.value.reduce((total, item) => total + item.reportCount, 0) },
]);
const readyChecks = computed(() => [
	{ label: 'Decision selected', passed: Boolean(decision.value) },
	{ label: 'Policy reason selected', passed: Boolean(reason.value) },
	{ label: 'Moderator note added', passed: note.value.trim().length >= 12 },
	{ label: 'Critical cases escalated or actioned', passed: selectedCase.value.severity !== 'Critical' || ['Escalate', 'Remove content'].includes(decision.value) },
]);
const canApplyDecision = computed(() => readyChecks.value.every((check) => check.passed));

function selectCase(item) {
	selectedCaseId.value = item.id;
	decision.value = item.recommendedAction;
	reason.value = reasonForCase(item);
	note.value = noteForCase(item);
	lastSavedCaseId.value = '';
}

function applyDecision() {
	if (!canApplyDecision.value) return;
	const item = selectedCase.value;
	item.status = decision.value === 'Escalate' ? 'Escalated' : 'Actioned';
	item.activity = [
		{
			label: `${decision.value} applied`,
			detail: `${reason.value}: ${note.value.trim()}`,
			time: 'Now',
		},
		...item.activity,
	];
	lastSavedCaseId.value = item.id;
}

function reasonForCase(item) {
	if (item.type === 'Listing') return 'Marketplace policy';
	if (item.type === 'AI output') return 'Medical safety policy';
	return 'Harassment policy';
}

function noteForCase(item) {
	if (item.type === 'Listing') return 'Pause the listing and ask the seller to remove off-platform payment instructions.';
	if (item.type === 'AI output') return 'Escalate to policy specialist and keep the answer hidden while guardrail replay runs.';
	return 'Remove the comment and notify the author with policy guidance.';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-4 py-4 sm:px-6">
			<div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Moderation queue</p>
					<h3 class="mt-1 text-2xl font-semibold tracking-tight">Trust and safety review</h3>
					<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">
						Triage reported content, inspect policy signals, and apply consistent decisions with an audit trail.
					</p>
				</div>
				<div class="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-canvas text-center">
					<div v-for="stat in queueStats" :key="stat.label" class="px-4 py-3">
						<p class="text-xl font-semibold">{{ stat.value }}</p>
						<p class="mt-1 text-xs font-medium text-muted-fg">{{ stat.label }}</p>
					</div>
				</div>
			</div>
		</header>

		<div class="grid min-h-[760px] lg:grid-cols-[18rem_minmax(0,1fr)_22rem]">
			<aside class="border-b border-border skin-card lg:border-b-0 lg:border-r">
				<div class="border-b border-border p-4">
					<DomNativeSelect
						v-model="statusFilter"
						label="Queue filter"
						:options="[{ label: 'All cases', value: 'All' }, ...statusOptions]"
					/>
				</div>
				<div class="divide-y divide-border">
					<button
						v-for="item in filteredCases"
						:key="item.id"
						type="button"
						class="grid w-full gap-2 px-4 py-4 text-left transition hover:bg-secondary/70"
						:class="selectedCaseId === item.id ? 'bg-primary/10' : ''"
						@click="selectCase(item)"
					>
						<span class="flex items-start justify-between gap-3">
							<span class="min-w-0 font-semibold leading-5">{{ item.title }}</span>
							<span
								class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold"
								:class="{
									'bg-destructive/15 text-destructive': item.severity === 'Critical',
									'bg-warning/15 text-warning': item.severity === 'High',
									'bg-secondary text-muted-fg': item.severity === 'Medium',
								}"
							>
								{{ item.severity }}
							</span>
						</span>
						<span class="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-fg">
							<span>{{ item.type }}</span>
							<span aria-hidden="true">/</span>
							<span>{{ item.reportCount }} reports</span>
							<span aria-hidden="true">/</span>
							<span>{{ item.age }}</span>
						</span>
					</button>
				</div>
			</aside>

			<main class="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
				<section class="border-b border-border p-4 sm:p-6">
					<div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
						<div>
							<div class="flex flex-wrap items-center gap-2">
								<span class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg">{{ selectedCase.queue }}</span>
								<span class="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{{ selectedCase.status }}</span>
								<span class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg">{{ selectedCase.id }}</span>
							</div>
							<h4 class="mt-3 text-xl font-semibold tracking-tight">{{ selectedCase.title }}</h4>
							<p class="mt-2 text-sm leading-6 text-muted-fg">{{ selectedCase.context }}</p>
						</div>
						<div class="rounded-2xl bg-secondary/60 px-4 py-3 text-sm">
							<p class="font-semibold">Recommended action</p>
							<p class="mt-1 text-muted-fg">{{ selectedCase.recommendedAction }}</p>
						</div>
					</div>
				</section>

				<section class="grid gap-0 xl:grid-cols-[minmax(0,1fr)_18rem]">
					<div class="border-b border-border p-4 sm:p-6 xl:border-b-0 xl:border-r">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Content preview</p>
						<div class="mt-4 rounded-2xl bg-secondary/50 p-5">
							<p class="text-base leading-7">{{ selectedCase.content }}</p>
						</div>

						<div class="mt-6 grid gap-4 sm:grid-cols-2">
							<div class="rounded-2xl border border-border p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Author</p>
								<p class="mt-2 font-semibold">{{ selectedCase.author }}</p>
								<p class="mt-1 text-sm text-muted-fg">{{ selectedCase.authorHistory }}</p>
								<div class="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
									<div class="h-full rounded-full bg-primary" :style="{ width: `${selectedCase.authorScore}%` }"></div>
								</div>
								<p class="mt-2 text-xs text-muted-fg">Trust score {{ selectedCase.authorScore }}%</p>
							</div>
							<div class="rounded-2xl border border-border p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Evidence</p>
								<ul class="mt-3 grid gap-2 text-sm text-muted-fg">
									<li v-for="item in selectedCase.evidence" :key="item" class="flex gap-2">
										<span class="mt-2 size-1.5 shrink-0 rounded-full bg-primary"></span>
										<span>{{ item }}</span>
									</li>
								</ul>
							</div>
						</div>
					</div>

					<aside class="p-4 sm:p-6">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Policy signals</p>
						<div class="mt-4 grid gap-4">
							<div v-for="policy in selectedCase.policies" :key="policy.label">
								<div class="flex items-center justify-between gap-3 text-sm">
									<span class="font-medium">{{ policy.label }}</span>
									<span :class="policy.matched ? 'text-warning' : 'text-muted-fg'">{{ policy.confidence }}%</span>
								</div>
								<div class="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
									<div
										class="h-full rounded-full"
										:class="policy.matched ? 'bg-warning' : 'bg-muted-fg/40'"
										:style="{ width: `${policy.confidence}%` }"
									></div>
								</div>
							</div>
						</div>
					</aside>
				</section>

				<section class="border-t border-border p-4 sm:p-6">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Activity</p>
							<h4 class="mt-1 font-semibold">Case timeline</h4>
						</div>
						<span v-if="lastSavedCaseId === selectedCase.id" class="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
							Decision saved
						</span>
					</div>
					<div class="mt-4 divide-y divide-border">
						<div v-for="event in selectedCase.activity" :key="`${event.label}-${event.time}`" class="grid gap-1 py-3 sm:grid-cols-[4rem_minmax(0,1fr)]">
							<span class="text-xs font-semibold text-muted-fg">{{ event.time }}</span>
							<span>
								<span class="block text-sm font-semibold">{{ event.label }}</span>
								<span class="mt-1 block text-sm leading-6 text-muted-fg">{{ event.detail }}</span>
							</span>
						</div>
					</div>
				</section>
			</main>

			<aside class="skin-card">
				<section class="border-b border-border p-4 sm:p-6">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Decision</p>
					<div class="mt-4 grid gap-4">
						<DomNativeSelect v-model="decision" label="Action" :options="decisionOptions" />
						<DomNativeSelect v-model="reason" label="Policy reason" :options="reasonOptions" />
						<DomTextareaInput
							v-model="note"
							label="Moderator note"
							placeholder="Explain the evidence and policy basis for this decision."
							:rows="5"
						/>
						<div class="grid gap-3 rounded-2xl bg-canvas p-4">
							<DomToggle
								v-model="notifyAuthor"
								label="Notify author"
								description="Send a policy notice after the decision is saved."
							/>
							<DomToggle
								v-model="lockThread"
								label="Lock discussion"
								description="Prevent new replies while this case is active."
							/>
						</div>
					</div>
				</section>

				<section class="border-b border-border p-4 sm:p-6">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Safety checks</p>
					<div class="mt-4 grid gap-3">
						<div v-for="check in readyChecks" :key="check.label" class="flex items-start gap-3 text-sm">
							<span
								class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold"
								:class="check.passed ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
							>
								{{ check.passed ? 'OK' : '!' }}
							</span>
							<span class="leading-6 text-muted-fg">{{ check.label }}</span>
						</div>
					</div>
				</section>

				<section class="grid gap-3 p-4 sm:p-6">
					<DomButton :disabled="!canApplyDecision" class="w-full" @click="applyDecision">
						Apply decision
					</DomButton>
					<DomButton variant="secondary" class="w-full">
						Assign to specialist
					</DomButton>
					<DomButton variant="ghost" class="w-full">
						Open source item
					</DomButton>
				</section>
			</aside>
		</div>
	</div>
</template>
