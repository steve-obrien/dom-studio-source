<script setup>
import { computed, ref, watch } from 'vue';
import { DomButton, DomTabs, DomTextareaInput, DomToggle, DomTooltip } from '@getdom/studio/vue';

const reviewTabs = [
	{ key: 'all', label: 'All' },
	{ key: 'clarity', label: 'Clarity' },
	{ key: 'risk', label: 'Risk' },
	{ key: 'tone', label: 'Tone' },
];

const documentSections = ref([
	{
		id: 'overview',
		kicker: '1',
		title: 'Executive summary',
		body: 'Northstar Labs will use the platform to coordinate onboarding, customer health, and renewal planning across implementation and success teams.',
		status: 'Approved',
	},
	{
		id: 'security',
		kicker: '2',
		title: 'Security addendum',
		body: 'Customer data is processed according to the agreed data protection terms. The vendor shall use commercially reasonable efforts to keep the production environment available and monitored.',
		status: 'Needs review',
	},
	{
		id: 'support',
		kicker: '3',
		title: 'Support obligations',
		body: 'Priority support is available during business hours. Critical incidents are reviewed by the response team and communicated through the customer success owner.',
		status: 'Needs review',
	},
	{
		id: 'handoff',
		kicker: '4',
		title: 'Launch handoff',
		body: 'The implementation team will prepare the workspace, confirm training materials, and hand the account to customer success after the launch review.',
		status: 'Draft',
	},
]);

const suggestions = ref([
	{
		id: 'sug-security-plain',
		number: 1,
		sectionId: 'security',
		type: 'clarity',
		label: 'Plain language rewrite',
		severity: 'Medium',
		confidence: 92,
		source: 'vendor shall use commercially reasonable efforts',
		proposed: 'vendor will take reasonable steps',
		rationale: 'Makes the obligation easier for a customer to understand without changing the legal posture.',
		state: 'pending',
		owner: 'AI reviewer',
	},
	{
		id: 'sug-security-risk',
		number: 2,
		sectionId: 'security',
		type: 'risk',
		label: 'Availability qualifier',
		severity: 'High',
		confidence: 84,
		source: 'available and monitored',
		proposed: 'available, monitored, and measured against the service levels in the signed order form',
		rationale: 'Connects availability wording to the contracted SLA so the statement does not create a new promise.',
		state: 'pending',
		owner: 'Legal policy',
	},
	{
		id: 'sug-support-tone',
		number: 3,
		sectionId: 'support',
		type: 'tone',
		label: 'Warmer support language',
		severity: 'Low',
		confidence: 89,
		source: 'communicated through the customer success owner',
		proposed: 'shared with the named customer success owner and the customer contact listed on the account',
		rationale: 'Clarifies who receives updates and sounds more accountable to the customer.',
		state: 'pending',
		owner: 'CX style guide',
	},
	{
		id: 'sug-handoff-clarity',
		number: 4,
		sectionId: 'handoff',
		type: 'clarity',
		label: 'Launch exit criteria',
		severity: 'Medium',
		confidence: 87,
		source: 'after the launch review',
		proposed: 'after the launch review confirms admin training, billing setup, and first workflow activation',
		rationale: 'Turns an ambiguous handoff moment into concrete exit criteria for the implementation team.',
		state: 'pending',
		owner: 'Implementation playbook',
	},
]);

const activity = ref([
	{ label: 'AI review generated 4 suggestions', time: '6m ago' },
	{ label: 'Maya opened security addendum', time: '4m ago' },
	{ label: 'Legal policy pack matched 2 clauses', time: '2m ago' },
]);

const activeTab = ref('all');
const activeSuggestionId = ref(suggestions.value[0].id);
const showAccepted = ref(true);
const reviewerNote = ref('Apply clear wording where the legal obligation stays intact. Escalate anything that changes SLA commitments.');
const comparisonMode = ref(true);

const visibleSuggestions = computed(() => suggestions.value.filter((suggestion) => {
	const tabMatch = activeTab.value === 'all' || suggestion.type === activeTab.value;
	const stateMatch = showAccepted.value || suggestion.state === 'pending';

	return tabMatch && stateMatch;
}));

const activeSuggestion = computed(() => {
	return suggestions.value.find((suggestion) => suggestion.id === activeSuggestionId.value)
		|| visibleSuggestions.value[0]
		|| suggestions.value[0];
});

const activeSection = computed(() => {
	return documentSections.value.find((section) => section.id === activeSuggestion.value.sectionId) || documentSections.value[0];
});

const pendingSuggestions = computed(() => suggestions.value.filter((suggestion) => suggestion.state === 'pending'));
const acceptedSuggestions = computed(() => suggestions.value.filter((suggestion) => suggestion.state === 'accepted'));
const dismissedSuggestions = computed(() => suggestions.value.filter((suggestion) => suggestion.state === 'dismissed'));
const reviewProgress = computed(() => Math.round(((acceptedSuggestions.value.length + dismissedSuggestions.value.length) / suggestions.value.length) * 100));
const highRiskOpen = computed(() => suggestions.value.some((suggestion) => suggestion.severity === 'High' && suggestion.state === 'pending'));
const readyToPublish = computed(() => pendingSuggestions.value.length === 0 && !highRiskOpen.value);
const decisionLabel = computed(() => {
	if (readyToPublish.value) return 'Review complete';
	if (highRiskOpen.value) return 'High-risk suggestion open';
	return `${pendingSuggestions.value.length} suggestions left`;
});

watch(visibleSuggestions, (items) => {
	if (!items.length) return;
	if (!items.some((suggestion) => suggestion.id === activeSuggestionId.value)) {
		activeSuggestionId.value = items[0].id;
	}
});

function setActiveSuggestion(suggestion) {
	activeSuggestionId.value = suggestion.id;
}

function acceptSuggestion() {
	updateSuggestionState('accepted');
}

function dismissSuggestion() {
	updateSuggestionState('dismissed');
}

function restoreSuggestion(suggestion) {
	suggestion.state = 'pending';
	activeSuggestionId.value = suggestion.id;
	activity.value = [
		{ label: `Restored ${suggestion.label}`, time: 'Just now' },
		...activity.value,
	];
}

function updateSuggestionState(state) {
	const suggestion = activeSuggestion.value;
	suggestion.state = state;

	if (state === 'accepted') {
		const section = documentSections.value.find((item) => item.id === suggestion.sectionId);
		if (section) {
			section.body = section.body.replace(suggestion.source, suggestion.proposed);
			section.status = 'Reviewed';
		}
	}

	activity.value = [
		{ label: `${state === 'accepted' ? 'Accepted' : 'Dismissed'} ${suggestion.label}`, time: 'Just now' },
		...activity.value,
	];

	const nextPending = visibleSuggestions.value.find((item) => item.state === 'pending' && item.id !== suggestion.id);
	if (nextPending) activeSuggestionId.value = nextPending.id;
}

function sectionSuggestions(sectionId) {
	return suggestions.value.filter((suggestion) => suggestion.sectionId === sectionId);
}

function suggestionClasses(suggestion) {
	if (suggestion.id === activeSuggestion.value.id) return 'border-primary/70 bg-primary/10 shadow-lg shadow-primary/10';
	if (suggestion.state === 'accepted') return 'border-emerald-500/40 bg-emerald-500/10';
	if (suggestion.state === 'dismissed') return 'border-border bg-secondary/60 opacity-70';
	return 'border-border bg-background hover:border-primary/40';
}

function severityClasses(severity) {
	return {
		High: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
		Medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
		Low: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
	}[severity] || 'bg-secondary text-muted-fg';
}

function stateClasses(state) {
	return {
		accepted: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		dismissed: 'bg-secondary text-muted-fg',
		pending: 'bg-primary/10 text-primary',
	}[state] || 'bg-secondary text-muted-fg';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-[2rem] border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border bg-background/95 px-4 py-4 sm:px-6">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">
						<span>AI document review</span>
						<span class="h-1 w-1 rounded-full bg-muted-fg/50"></span>
						<span>{{ decisionLabel }}</span>
					</div>
					<h3 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Security addendum review</h3>
				</div>

				<div class="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-[24rem]">
					<div class="rounded-2xl bg-secondary p-3">
						<p class="text-lg font-semibold text-fg">{{ pendingSuggestions.length }}</p>
						<p class="mt-1 text-muted-fg">Pending</p>
					</div>
					<div class="rounded-2xl bg-secondary p-3">
						<p class="text-lg font-semibold text-fg">{{ acceptedSuggestions.length }}</p>
						<p class="mt-1 text-muted-fg">Accepted</p>
					</div>
					<div class="rounded-2xl bg-secondary p-3">
						<p class="text-lg font-semibold text-fg">{{ reviewProgress }}%</p>
						<p class="mt-1 text-muted-fg">Reviewed</p>
					</div>
				</div>
			</div>
		</header>

		<section class="grid min-h-[46rem] gap-0 xl:grid-cols-[minmax(0,1fr)_24rem]">
			<main class="min-w-0 bg-[linear-gradient(180deg,hsl(var(--secondary)/.65),hsl(var(--background)))] px-3 py-5 sm:px-6 lg:px-8">
				<div class="mx-auto max-w-4xl">
					<div class="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-background/90 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
						<div class="min-w-0">
							<p class="text-sm font-semibold">Northstar Labs contract packet</p>
							<p class="mt-1 text-xs text-muted-fg">Version 12. Legal policy pack matched against customer-facing copy.</p>
						</div>
						<div class="flex flex-wrap items-center gap-2">
							<DomTooltip content="Show source and proposed text together in the active suggestion card.">
								<label class="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm font-medium">
									<span>Compare</span>
									<DomToggle v-model="comparisonMode" aria-label="Comparison mode" />
								</label>
							</DomTooltip>
							<DomButton variant="secondary">Export redline</DomButton>
							<DomButton :variant="readyToPublish ? 'primary' : 'secondary'">
								{{ readyToPublish ? 'Mark reviewed' : 'Resolve suggestions' }}
							</DomButton>
						</div>
					</div>

					<article class="rounded-[1.75rem] border border-border bg-background px-5 py-7 shadow-xl shadow-black/5 sm:px-10 sm:py-9">
						<div class="mb-8 border-b border-border pb-6">
							<p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg">Customer agreement</p>
							<h4 class="mt-3 text-3xl font-semibold tracking-tight">Security and launch addendum</h4>
							<p class="mt-3 max-w-2xl text-sm leading-7 text-muted-fg">
								AI suggestions are shown as reviewable annotations. Accepted edits update this working copy and remain visible in the review event stream.
							</p>
						</div>

						<div class="space-y-8">
							<section v-for="section in documentSections" :key="section.id" class="group relative">
								<div class="flex items-start gap-4">
									<div class="mt-1 hidden size-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-muted-fg sm:grid">
										{{ section.kicker }}
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex flex-wrap items-center gap-2">
											<h5 class="text-lg font-semibold">{{ section.title }}</h5>
											<span class="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-fg">{{ section.status }}</span>
										</div>
										<p class="mt-3 text-base leading-8 text-fg/90">{{ section.body }}</p>
										<div v-if="sectionSuggestions(section.id).length" class="mt-4 flex flex-wrap gap-2">
											<button
												v-for="suggestion in sectionSuggestions(section.id)"
												:key="suggestion.id"
												type="button"
												class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
												:class="suggestionClasses(suggestion)"
												@click="setActiveSuggestion(suggestion)"
											>
												<span class="grid size-5 place-items-center rounded-full bg-background">{{ suggestion.number }}</span>
												<span>{{ suggestion.label }}</span>
											</button>
										</div>
									</div>
								</div>
							</section>
						</div>
					</article>
				</div>
			</main>

			<aside class="border-t border-border bg-background p-4 xl:border-l xl:border-t-0 xl:p-5">
				<div class="sticky top-4 space-y-4">
					<div class="overflow-x-auto pb-1">
						<DomTabs v-model="activeTab" :tabs="reviewTabs">
							<template #all><span class="sr-only">All suggestions</span></template>
							<template #clarity><span class="sr-only">Clarity suggestions</span></template>
							<template #risk><span class="sr-only">Risk suggestions</span></template>
							<template #tone><span class="sr-only">Tone suggestions</span></template>
						</DomTabs>
					</div>

					<label class="flex items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/60 p-3 text-sm">
						<span class="font-medium">Show accepted and dismissed</span>
						<DomToggle v-model="showAccepted" aria-label="Show accepted and dismissed suggestions" />
					</label>

					<div class="space-y-2">
						<button
							v-for="suggestion in visibleSuggestions"
							:key="suggestion.id"
							type="button"
							class="w-full rounded-2xl border p-3 text-left transition"
							:class="suggestionClasses(suggestion)"
							@click="setActiveSuggestion(suggestion)"
						>
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="text-sm font-semibold">{{ suggestion.label }}</p>
									<p class="mt-1 text-xs text-muted-fg">{{ suggestion.owner }} / {{ suggestion.confidence }}% confidence</p>
								</div>
								<span class="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold" :class="stateClasses(suggestion.state)">
									{{ suggestion.state }}
								</span>
							</div>
						</button>
					</div>

					<div class="rounded-[1.5rem] border border-border bg-background p-4 shadow-lg shadow-black/5">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Active suggestion</p>
								<h4 class="mt-2 text-lg font-semibold">{{ activeSuggestion.label }}</h4>
							</div>
							<span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="severityClasses(activeSuggestion.severity)">
								{{ activeSuggestion.severity }}
							</span>
						</div>

						<div class="mt-4 space-y-3 text-sm">
							<div v-if="comparisonMode" class="rounded-2xl bg-secondary p-3">
								<p class="text-xs font-semibold uppercase text-muted-fg">Original</p>
								<p class="mt-2 leading-6 line-through decoration-destructive/70 decoration-2">{{ activeSuggestion.source }}</p>
							</div>
							<div class="rounded-2xl bg-primary/10 p-3 text-primary">
								<p class="text-xs font-semibold uppercase">Proposed</p>
								<p class="mt-2 leading-6">{{ activeSuggestion.proposed }}</p>
							</div>
							<div class="rounded-2xl bg-secondary p-3">
								<p class="text-xs font-semibold uppercase text-muted-fg">Why AI suggested this</p>
								<p class="mt-2 leading-6 text-muted-fg">{{ activeSuggestion.rationale }}</p>
							</div>
						</div>

						<div class="mt-4">
							<label class="text-sm font-medium" for="review-note">Reviewer note</label>
							<DomTextareaInput id="review-note" v-model="reviewerNote" class="mt-2" rows="4" />
						</div>

						<div v-if="activeSuggestion.state === 'pending'" class="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
							<DomButton variant="secondary" @click="dismissSuggestion">Dismiss</DomButton>
							<DomButton variant="primary" @click="acceptSuggestion">Accept suggestion</DomButton>
						</div>
						<DomButton v-else class="mt-4 w-full" variant="secondary" @click="restoreSuggestion(activeSuggestion)">
							Restore to pending
						</DomButton>
					</div>

					<div class="rounded-[1.5rem] border border-border bg-secondary/50 p-4">
						<div class="flex items-center justify-between gap-3">
							<h4 class="text-sm font-semibold">Review activity</h4>
							<span class="text-xs text-muted-fg">{{ dismissedSuggestions.length }} dismissed</span>
						</div>
						<div class="mt-3 space-y-3">
							<div v-for="item in activity.slice(0, 4)" :key="`${item.label}-${item.time}`" class="flex gap-3 text-sm">
								<span class="mt-1.5 size-2 rounded-full bg-primary"></span>
								<p class="min-w-0 flex-1">
									<span class="block font-medium">{{ item.label }}</span>
									<span class="text-xs text-muted-fg">{{ item.time }}</span>
								</p>
							</div>
						</div>
					</div>
				</div>
			</aside>
		</section>
	</div>
</template>
