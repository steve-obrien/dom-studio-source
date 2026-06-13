<script setup>
import { computed, ref, watch } from 'vue';
import { DomButton, DomNativeSelect, DomTabs, DomTextareaInput, DomTextInput, DomToggle, DomTooltip } from '@getdom/studio/vue';

const sectionTabs = [
	{ key: 'overview', label: 'Overview' },
	{ key: 'scope', label: 'Scope' },
	{ key: 'timeline', label: 'Timeline' },
	{ key: 'pricing', label: 'Pricing' },
];

const statusOptions = [
	{ label: 'Draft', value: 'Draft' },
	{ label: 'Review', value: 'Review' },
	{ label: 'Approved', value: 'Approved' },
];

const sections = ref([
	{
		id: 'overview',
		title: 'Executive overview',
		status: 'Approved',
		owner: 'Maya Chen',
		body: 'Northstar Labs is ready to move its onboarding, customer health, and renewal workflows into a shared operating system. This proposal covers implementation, enablement, and the first migration milestone.',
	},
	{
		id: 'scope',
		title: 'Scope of work',
		status: 'Review',
		owner: 'Omar Reid',
		body: 'The delivery team will configure workspace roles, import the customer success pipeline, connect billing events, and build two workflow automations for launch readiness and renewal risk.',
	},
	{
		id: 'timeline',
		title: 'Timeline',
		status: 'Draft',
		owner: 'Nina Patel',
		body: 'Kickoff begins June 18. Phase one focuses on discovery and data import, phase two covers workflow setup, and phase three prepares the launch review and executive handoff.',
	},
	{
		id: 'pricing',
		title: 'Commercial terms',
		status: 'Review',
		owner: 'Ari Patel',
		body: 'The recommended package is the Growth implementation plan with an annual subscription, migration support, and two optional success workshops after launch.',
	},
]);

const comments = ref([
	{
		id: 'c1',
		sectionId: 'scope',
		author: 'Ari Patel',
		role: 'Finance',
		body: 'Confirm whether analytics migration is included or listed as a paid add-on.',
		open: true,
		time: '12 min ago',
	},
	{
		id: 'c2',
		sectionId: 'timeline',
		author: 'Maya Chen',
		role: 'Implementation',
		body: 'Add a dependency on customer data export before phase one is marked ready.',
		open: true,
		time: '24 min ago',
	},
	{
		id: 'c3',
		sectionId: 'overview',
		author: 'Nina Patel',
		role: 'Success',
		body: 'The customer approved this summary during the discovery call.',
		open: false,
		time: '1 hr ago',
	},
]);

const activeSectionId = ref('scope');
const documentTitle = ref('Northstar onboarding proposal');
const clientName = ref('Northstar Labs');
const reviewMode = ref(true);
const legalApproved = ref(false);
const pricingApproved = ref(true);
const brandApproved = ref(true);
const savedState = ref('Saved');
const selectedTemplate = ref('Implementation proposal');

const activeSection = computed(() => sections.value.find((section) => section.id === activeSectionId.value) || sections.value[0]);
const activeComments = computed(() => comments.value.filter((comment) => comment.sectionId === activeSectionId.value));
const openComments = computed(() => comments.value.filter((comment) => comment.open));
const approvedSections = computed(() => sections.value.filter((section) => section.status === 'Approved').length);
const wordCount = computed(() => sections.value.reduce((total, section) => total + section.body.trim().split(/\s+/).filter(Boolean).length, 0));
const approvalGates = computed(() => [
	{ label: 'All sections approved', complete: approvedSections.value === sections.value.length, detail: `${approvedSections.value} of ${sections.value.length}` },
	{ label: 'Comments resolved', complete: openComments.value.length === 0, detail: `${openComments.value.length} open` },
	{ label: 'Pricing approved', complete: pricingApproved.value, detail: pricingApproved.value ? 'Finance approved' : 'Waiting on finance' },
	{ label: 'Legal approved', complete: legalApproved.value, detail: legalApproved.value ? 'Legal approved' : 'Needs review' },
	{ label: 'Brand check', complete: brandApproved.value, detail: brandApproved.value ? 'Ready' : 'Needs polish' },
]);
const readinessPercent = computed(() => Math.round((approvalGates.value.filter((gate) => gate.complete).length / approvalGates.value.length) * 100));
const publishReady = computed(() => approvalGates.value.every((gate) => gate.complete));
const sectionStatusTone = computed(() => {
	if (activeSection.value.status === 'Approved') return 'bg-success/15 text-success';
	if (activeSection.value.status === 'Review') return 'bg-warning/15 text-warning';
	return 'bg-secondary text-muted-fg';
});
const publishLabel = computed(() => publishReady.value ? 'Publish proposal' : 'Review blockers');

const templateOptions = [
	{ label: 'Implementation proposal', value: 'Implementation proposal' },
	{ label: 'Renewal plan', value: 'Renewal plan' },
	{ label: 'Statement of work', value: 'Statement of work' },
];

watch([documentTitle, clientName, selectedTemplate], () => {
	savedState.value = 'Unsaved';
});

function saveDraft() {
	savedState.value = 'Saved';
}

function updateSectionStatus(value) {
	activeSection.value.status = value;
	savedState.value = 'Unsaved';
}

function updateSectionBody(value) {
	activeSection.value.body = value;
	savedState.value = 'Unsaved';
}

function resolveComment(comment) {
	comment.open = !comment.open;
	savedState.value = 'Unsaved';
}

function jumpToBlocker() {
	const firstSectionNeedingReview = sections.value.find((section) => section.status !== 'Approved');
	if (firstSectionNeedingReview) {
		activeSectionId.value = firstSectionNeedingReview.id;
		return;
	}

	if (openComments.value[0]) activeSectionId.value = openComments.value[0].sectionId;
}
</script>

<template>
	<div class="w-full bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,.16),transparent_34%),linear-gradient(180deg,hsl(var(--secondary)),hsl(var(--canvas)))] px-3 py-5 text-canvas-fg sm:px-6 lg:px-8">
		<section class="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-border bg-canvas shadow-2xl shadow-black/10">
			<header class="border-b border-border bg-canvas/95 px-4 py-4 backdrop-blur sm:px-5">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div class="min-w-0">
						<div class="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">
							<span>Proposal editor</span>
							<span class="h-1 w-1 rounded-full bg-muted-fg/50"></span>
							<span>{{ savedState }}</span>
						</div>
						<div class="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1.25fr)_minmax(10rem,.75fr)]">
							<DomTextInput v-model="documentTitle" aria-label="Document title" />
							<DomTextInput v-model="clientName" aria-label="Client name" />
						</div>
					</div>

					<div class="flex flex-wrap items-center gap-2">
						<DomNativeSelect v-model="selectedTemplate" aria-label="Template" :options="templateOptions" />
						<DomButton variant="secondary" @click="saveDraft">Save draft</DomButton>
						<DomButton :variant="publishReady ? 'primary' : 'secondary'" @click="publishReady ? saveDraft() : jumpToBlocker()">
							{{ publishLabel }}
						</DomButton>
					</div>
				</div>

				<div class="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
					<div class="min-w-0 overflow-x-auto pb-1">
						<DomTabs v-model="activeSectionId" :tabs="sectionTabs" />
					</div>
					<div class="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-fg">
						<span class="rounded-full bg-secondary px-3 py-1.5">{{ wordCount }} words</span>
						<span class="rounded-full px-3 py-1.5" :class="sectionStatusTone">{{ activeSection.status }}</span>
						<span class="rounded-full bg-primary/10 px-3 py-1.5 text-primary">{{ readinessPercent }}% ready</span>
					</div>
				</div>
			</header>

			<div class="grid gap-0 xl:grid-cols-[minmax(0,1fr)_22rem]">
				<main class="min-w-0 bg-secondary/35 px-3 py-4 sm:px-5 lg:px-8">
					<div class="mx-auto max-w-4xl">
						<div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-canvas/90 p-3 shadow-sm">
							<div class="flex flex-wrap items-center gap-1.5">
								<DomTooltip content="Bold">
									<button type="button" class="grid size-9 place-items-center rounded-xl border border-border bg-canvas font-bold text-canvas-fg transition hover:bg-secondary">B</button>
								</DomTooltip>
								<DomTooltip content="Italic">
									<button type="button" class="grid size-9 place-items-center rounded-xl border border-border bg-canvas italic text-canvas-fg transition hover:bg-secondary">I</button>
								</DomTooltip>
								<DomTooltip content="Bulleted list">
									<button type="button" class="grid size-9 place-items-center rounded-xl border border-border bg-canvas text-canvas-fg transition hover:bg-secondary" aria-label="Bulleted list">
										<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
											<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
										</svg>
									</button>
								</DomTooltip>
								<DomTooltip content="Insert comment">
									<button type="button" class="grid size-9 place-items-center rounded-xl border border-border bg-canvas text-canvas-fg transition hover:bg-secondary" aria-label="Insert comment">
										<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
											<path d="M7 8h10M7 12h6M5 20l3-3h9a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
										</svg>
									</button>
								</DomTooltip>
							</div>
							<div class="flex items-center gap-3 rounded-xl bg-secondary px-3 py-2">
								<span class="text-sm font-medium">Review mode</span>
								<DomToggle v-model="reviewMode" aria-label="Review mode" />
							</div>
						</div>

						<article class="min-h-[42rem] rounded-[1.75rem] border border-border bg-canvas px-5 py-6 shadow-xl shadow-black/5 sm:px-10 sm:py-9">
							<div class="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
								<div class="min-w-0">
									<p class="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{{ clientName }}</p>
									<h2 class="mt-2 text-3xl font-semibold tracking-tight text-canvas-fg sm:text-4xl">{{ documentTitle }}</h2>
									<p class="mt-3 max-w-2xl text-sm leading-6 text-muted-fg">Prepared by DOM implementation team for launch planning, migration support, and success enablement.</p>
								</div>
								<div class="rounded-2xl border border-border bg-secondary/50 p-3 text-sm">
									<p class="font-semibold">{{ selectedTemplate }}</p>
									<p class="mt-1 text-muted-fg">Owner: {{ activeSection.owner }}</p>
								</div>
							</div>

							<div class="mt-8 grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
								<nav class="grid content-start gap-2">
									<button
										v-for="section in sections"
										:key="section.id"
										type="button"
										class="rounded-2xl border px-3 py-3 text-left transition"
										:class="section.id === activeSectionId ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-canvas hover:bg-secondary'"
										@click="activeSectionId = section.id"
									>
										<span class="block text-sm font-semibold">{{ section.title }}</span>
										<span class="mt-1 block text-xs text-muted-fg">{{ section.status }}</span>
									</button>
								</nav>

								<section class="min-w-0">
									<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										<div>
											<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Editing section</p>
											<h3 class="mt-1 text-2xl font-semibold tracking-tight">{{ activeSection.title }}</h3>
										</div>
										<DomNativeSelect
											:model-value="activeSection.status"
											aria-label="Section status"
											:options="statusOptions"
											@update:model-value="updateSectionStatus"
										/>
									</div>

									<div class="mt-5">
										<DomTextareaInput
											:model-value="activeSection.body"
											label="Section draft"
											:rows="9"
											placeholder="Write this proposal section"
											@update:model-value="updateSectionBody"
										/>
									</div>

									<div v-if="reviewMode" class="mt-5 grid gap-3">
										<div
											v-for="comment in activeComments"
											:key="comment.id"
											class="rounded-2xl border border-border p-4"
											:class="comment.open ? 'bg-warning/10' : 'bg-success/10'"
										>
											<div class="flex items-start justify-between gap-3">
												<div class="min-w-0">
													<p class="font-semibold">{{ comment.author }}</p>
													<p class="text-xs text-muted-fg">{{ comment.role }} / {{ comment.time }}</p>
												</div>
												<button
													type="button"
													class="rounded-full px-3 py-1 text-xs font-semibold"
													:class="comment.open ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'"
													@click="resolveComment(comment)"
												>
													{{ comment.open ? 'Open' : 'Resolved' }}
												</button>
											</div>
											<p class="mt-3 text-sm leading-6 text-canvas-fg">{{ comment.body }}</p>
										</div>
									</div>
								</section>
							</div>
						</article>
					</div>
				</main>

				<aside class="border-t border-border bg-canvas p-4 xl:border-l xl:border-t-0 xl:p-5">
					<div class="sticky top-4 grid gap-4">
						<section class="rounded-2xl border border-border p-4">
							<div class="flex items-center justify-between gap-4">
								<div>
									<p class="text-sm font-semibold">Publish readiness</p>
									<p class="mt-1 text-xs text-muted-fg">{{ readinessPercent }}% of approval gates complete</p>
								</div>
								<div class="grid size-14 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{{ readinessPercent }}%</div>
							</div>
							<div class="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
								<div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${readinessPercent}%` }"></div>
							</div>
							<div class="mt-4 grid gap-2">
								<div v-for="gate in approvalGates" :key="gate.label" class="flex items-start gap-3 rounded-xl bg-secondary/55 p-3">
									<span class="mt-0.5 grid size-5 place-items-center rounded-full" :class="gate.complete ? 'bg-success text-canvas' : 'bg-warning/20 text-warning'">
										<svg v-if="gate.complete" viewBox="0 0 24 24" class="size-3.5" fill="none" aria-hidden="true">
											<path d="m5 12 4 4L19 6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
										</svg>
										<span v-else class="size-1.5 rounded-full bg-current"></span>
									</span>
									<span class="min-w-0">
										<span class="block text-sm font-medium">{{ gate.label }}</span>
										<span class="text-xs text-muted-fg">{{ gate.detail }}</span>
									</span>
								</div>
							</div>
						</section>

						<section class="rounded-2xl border border-border p-4">
							<h4 class="font-semibold">Approval switches</h4>
							<div class="mt-4 grid gap-3">
								<label class="flex items-center justify-between gap-3 rounded-xl bg-secondary/55 p-3">
									<span>
										<span class="block text-sm font-medium">Pricing</span>
										<span class="text-xs text-muted-fg">Finance confirmed terms</span>
									</span>
									<DomToggle v-model="pricingApproved" aria-label="Pricing approved" />
								</label>
								<label class="flex items-center justify-between gap-3 rounded-xl bg-secondary/55 p-3">
									<span>
										<span class="block text-sm font-medium">Legal</span>
										<span class="text-xs text-muted-fg">No contract blockers</span>
									</span>
									<DomToggle v-model="legalApproved" aria-label="Legal approved" />
								</label>
								<label class="flex items-center justify-between gap-3 rounded-xl bg-secondary/55 p-3">
									<span>
										<span class="block text-sm font-medium">Brand</span>
										<span class="text-xs text-muted-fg">Voice and formatting checked</span>
									</span>
									<DomToggle v-model="brandApproved" aria-label="Brand approved" />
								</label>
							</div>
						</section>

						<section class="rounded-2xl border border-border p-4">
							<div class="flex items-center justify-between gap-3">
								<h4 class="font-semibold">Open comments</h4>
								<span class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">{{ openComments.length }}</span>
							</div>
							<div class="mt-3 grid gap-2">
								<button
									v-for="comment in openComments"
									:key="comment.id"
									type="button"
									class="rounded-xl border border-border p-3 text-left text-sm transition hover:bg-secondary"
									@click="activeSectionId = comment.sectionId"
								>
									<span class="block font-medium">{{ sections.find((section) => section.id === comment.sectionId)?.title }}</span>
									<span class="mt-1 line-clamp-2 block text-xs leading-5 text-muted-fg">{{ comment.body }}</span>
								</button>
								<p v-if="!openComments.length" class="rounded-xl bg-success/10 p-3 text-sm text-success">All comments are resolved.</p>
							</div>
						</section>
					</div>
				</aside>
			</div>
		</section>
	</div>
</template>
