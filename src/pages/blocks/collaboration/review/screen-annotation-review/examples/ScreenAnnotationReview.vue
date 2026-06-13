<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomTabs, DomTextareaInput, DomToggle, DomTooltip } from '@getdom/studio/vue';

const tabs = [
	{ key: 'open', label: 'Open' },
	{ key: 'mine', label: 'Mine' },
	{ key: 'resolved', label: 'Resolved' },
	{ key: 'all', label: 'All' },
];

const reviewers = [
	{ id: 'maya', name: 'Maya Chen', role: 'Product', tone: 'bg-cyan-500' },
	{ id: 'oscar', name: 'Oscar Reed', role: 'Design', tone: 'bg-emerald-500' },
	{ id: 'nina', name: 'Nina Patel', role: 'QA', tone: 'bg-amber-500' },
	{ id: 'sam', name: 'Sam Torres', role: 'Engineering', tone: 'bg-rose-500' },
];

const annotations = ref([
	{
		id: 'ann-nav',
		number: 1,
		x: 18,
		y: 19,
		title: 'Navigation state is too subtle',
		target: 'Workspace switcher',
		status: 'open',
		priority: 'Medium',
		assignee: 'oscar',
		author: 'nina',
		updatedAt: '4 minutes ago',
		excerpt: 'The active workspace needs stronger contrast before this goes to enterprise customers.',
		comments: [
			{ id: 'c1', author: 'Nina Patel', time: '10:18', body: 'Active and hover states are hard to tell apart in dense navigation.' },
			{ id: 'c2', author: 'Oscar Reed', time: '10:22', body: 'I can raise the background and add an outline token.' },
		],
	},
	{
		id: 'ann-chart',
		number: 2,
		x: 49,
		y: 45,
		title: 'Chart tooltip needs source detail',
		target: 'Revenue trend chart',
		status: 'open',
		priority: 'High',
		assignee: 'sam',
		author: 'maya',
		updatedAt: '11 minutes ago',
		excerpt: 'Customers asked how forecast values are calculated. Add source and confidence range.',
		comments: [
			{ id: 'c3', author: 'Maya Chen', time: '10:03', body: 'Please include the attribution window and model confidence.' },
			{ id: 'c4', author: 'Sam Torres', time: '10:14', body: 'Backend already sends confidence. I will expose it in the tooltip payload.' },
		],
	},
	{
		id: 'ann-card',
		number: 3,
		x: 75,
		y: 30,
		title: 'Saved-card copy is ambiguous',
		target: 'Payment method card',
		status: 'open',
		priority: 'High',
		assignee: 'maya',
		author: 'oscar',
		updatedAt: '17 minutes ago',
		excerpt: 'The card says default but does not explain whether invoices or checkout sessions use it.',
		comments: [
			{ id: 'c5', author: 'Oscar Reed', time: '09:48', body: 'Copy should say this card is used for subscription renewals only.' },
		],
	},
	{
		id: 'ann-empty',
		number: 4,
		x: 32,
		y: 72,
		title: 'Resolved empty state polish',
		target: 'Tasks panel',
		status: 'resolved',
		priority: 'Low',
		assignee: 'nina',
		author: 'sam',
		updatedAt: 'Yesterday',
		excerpt: 'The no-tasks message now uses the approved launch checklist copy.',
		comments: [
			{ id: 'c6', author: 'Sam Torres', time: 'Yesterday', body: 'Updated in build 7. The screenshot is ready for final QA.' },
			{ id: 'c7', author: 'Nina Patel', time: 'Yesterday', body: 'Verified on desktop and mobile.' },
		],
	},
]);

const activeTab = ref('open');
const selectedId = ref('ann-chart');
const showPins = ref(true);
const compactPreview = ref(false);
const replyDraft = ref('I will update this before the release review.');
const justSaved = ref(false);

const selectedAnnotation = computed(() => annotations.value.find((annotation) => annotation.id === selectedId.value) || annotations.value[0]);
const openCount = computed(() => annotations.value.filter((annotation) => annotation.status === 'open').length);
const resolvedCount = computed(() => annotations.value.filter((annotation) => annotation.status === 'resolved').length);
const highPriorityCount = computed(() => annotations.value.filter((annotation) => annotation.status === 'open' && annotation.priority === 'High').length);
const visibleAnnotations = computed(() => annotations.value.filter((annotation) => {
	if (activeTab.value === 'open') return annotation.status === 'open';
	if (activeTab.value === 'resolved') return annotation.status === 'resolved';
	if (activeTab.value === 'mine') return annotation.assignee === 'maya' && annotation.status === 'open';
	return true;
}));
const selectedReviewer = computed(() => reviewerFor(selectedAnnotation.value.assignee));
const reviewStatus = computed(() => {
	if (!openCount.value) return 'Ready to ship';
	if (highPriorityCount.value) return `${highPriorityCount.value} high priority`;
	return `${openCount.value} open threads`;
});

function reviewerFor(id) {
	return reviewers.find((reviewer) => reviewer.id === id) || reviewers[0];
}

function selectAnnotation(id) {
	selectedId.value = id;
	justSaved.value = false;
}

function addReply() {
	const body = replyDraft.value.trim();
	if (!body) return;

	selectedAnnotation.value.comments.push({
		id: `c${Date.now()}`,
		author: 'Maya Chen',
		time: 'Now',
		body,
	});
	selectedAnnotation.value.updatedAt = 'Just now';
	replyDraft.value = '';
	justSaved.value = true;
}

function toggleResolved() {
	selectedAnnotation.value.status = selectedAnnotation.value.status === 'resolved' ? 'open' : 'resolved';
	selectedAnnotation.value.updatedAt = 'Just now';
	activeTab.value = selectedAnnotation.value.status === 'resolved' ? 'resolved' : 'open';
	justSaved.value = false;
}
</script>

<template>
	<div class="w-full max-w-7xl overflow-hidden rounded-lg border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-4 py-4 sm:px-6">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Collaborative review</p>
					<h3 class="mt-2 text-2xl font-semibold tracking-tight">Checkout redesign annotations</h3>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
						Review a screen with spatial comment pins, focused discussion, and a clean resolution workflow for teams shipping app interfaces.
					</p>
				</div>
				<div class="grid grid-cols-3 gap-2 text-center sm:min-w-[25rem]">
					<div class="rounded-lg border border-border bg-canvas px-3 py-2">
						<p class="text-xs text-muted-fg">Open</p>
						<p class="mt-1 text-lg font-semibold">{{ openCount }}</p>
					</div>
					<div class="rounded-lg border border-border bg-canvas px-3 py-2">
						<p class="text-xs text-muted-fg">Resolved</p>
						<p class="mt-1 text-lg font-semibold">{{ resolvedCount }}</p>
					</div>
					<div class="rounded-lg border border-border bg-canvas px-3 py-2">
						<p class="text-xs text-muted-fg">Status</p>
						<p class="mt-1 truncate text-sm font-semibold">{{ reviewStatus }}</p>
					</div>
				</div>
			</div>
		</header>

		<div class="grid lg:grid-cols-[minmax(0,1fr)_23rem]">
			<main class="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
				<div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
					<div class="flex flex-wrap items-center gap-2">
						<DomTabs v-model="activeTab" :tabs="tabs" />
						<span class="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-fg">
							{{ visibleAnnotations.length }} visible
						</span>
					</div>
					<div class="flex flex-wrap items-center gap-3">
						<label class="flex items-center gap-2 text-sm text-muted-fg">
							<span>Pins</span>
							<DomToggle v-model="showPins" aria-label="Show annotation pins" />
						</label>
						<label class="flex items-center gap-2 text-sm text-muted-fg">
							<span>Compact</span>
							<DomToggle v-model="compactPreview" aria-label="Use compact preview" />
						</label>
						<DomTooltip text="New pins can be created from your screenshot or preview coordinate system.">
							<DomButton size="sm">Add pin</DomButton>
						</DomTooltip>
					</div>
				</div>

				<section class="bg-secondary/35 p-4 sm:p-6">
					<div
						class="relative mx-auto overflow-hidden rounded-lg border border-border bg-canvas shadow-xl shadow-black/10"
						:class="compactPreview ? 'max-w-3xl' : 'max-w-5xl'"
					>
						<div class="flex items-center justify-between border-b border-border px-4 py-3">
							<div class="flex items-center gap-2">
								<span class="h-3 w-3 rounded-full bg-danger/70"></span>
								<span class="h-3 w-3 rounded-full bg-warning/70"></span>
								<span class="h-3 w-3 rounded-full bg-success/70"></span>
							</div>
							<p class="truncate text-xs font-semibold text-muted-fg">checkout-summary-v7.preview</p>
							<span class="rounded-full bg-success/15 px-2 py-1 text-[11px] font-semibold text-success">Synced</span>
						</div>

						<div class="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.20),transparent_28%),radial-gradient(circle_at_86%_16%,rgba(16,185,129,0.18),transparent_26%),linear-gradient(135deg,rgba(248,250,252,1),rgba(241,245,249,0.86))] p-4 sm:p-6">
							<div class="grid h-full grid-cols-[1fr_2.2fr] gap-4">
								<div class="rounded-lg border border-slate-200 bg-white/82 p-3 shadow-sm">
									<div class="h-7 rounded bg-slate-900"></div>
									<div class="mt-5 space-y-2">
										<div class="h-3 w-3/4 rounded bg-slate-300"></div>
										<div class="h-3 w-1/2 rounded bg-slate-200"></div>
										<div class="h-8 rounded bg-cyan-100"></div>
									</div>
									<div class="mt-6 space-y-3">
										<div class="h-12 rounded border border-slate-200 bg-white"></div>
										<div class="h-12 rounded border border-slate-200 bg-white"></div>
										<div class="h-12 rounded border border-slate-200 bg-white"></div>
									</div>
								</div>

								<div class="grid gap-4">
									<div class="grid grid-cols-3 gap-4">
										<div class="rounded-lg border border-slate-200 bg-white/88 p-3 shadow-sm">
											<div class="h-3 w-16 rounded bg-slate-200"></div>
											<div class="mt-4 h-7 w-20 rounded bg-slate-800"></div>
										</div>
										<div class="rounded-lg border border-slate-200 bg-white/88 p-3 shadow-sm">
											<div class="h-3 w-16 rounded bg-slate-200"></div>
											<div class="mt-4 h-7 w-24 rounded bg-emerald-400"></div>
										</div>
										<div class="rounded-lg border border-slate-200 bg-white/88 p-3 shadow-sm">
											<div class="h-3 w-16 rounded bg-slate-200"></div>
											<div class="mt-4 h-7 w-20 rounded bg-cyan-400"></div>
										</div>
									</div>
									<div class="grid min-h-0 grid-cols-[1.4fr_1fr] gap-4">
										<div class="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm">
											<div class="flex h-full items-end gap-2">
												<span class="h-[35%] flex-1 rounded-t bg-cyan-200"></span>
												<span class="h-[52%] flex-1 rounded-t bg-cyan-300"></span>
												<span class="h-[45%] flex-1 rounded-t bg-cyan-200"></span>
												<span class="h-[72%] flex-1 rounded-t bg-cyan-500"></span>
												<span class="h-[61%] flex-1 rounded-t bg-cyan-300"></span>
												<span class="h-[84%] flex-1 rounded-t bg-slate-800"></span>
											</div>
										</div>
										<div class="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm">
											<div class="h-8 rounded bg-slate-900"></div>
											<div class="mt-4 space-y-2">
												<div class="h-3 rounded bg-slate-200"></div>
												<div class="h-3 w-5/6 rounded bg-slate-200"></div>
												<div class="h-10 rounded bg-emerald-100"></div>
												<div class="h-10 rounded bg-cyan-100"></div>
											</div>
										</div>
									</div>
									<div class="grid grid-cols-2 gap-4">
										<div class="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm">
											<div class="h-3 w-24 rounded bg-slate-200"></div>
											<div class="mt-4 h-14 rounded bg-slate-100"></div>
										</div>
										<div class="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm">
											<div class="h-3 w-24 rounded bg-slate-200"></div>
											<div class="mt-4 h-14 rounded bg-slate-100"></div>
										</div>
									</div>
								</div>
							</div>

							<button
								v-for="annotation in visibleAnnotations"
								v-show="showPins"
								:key="annotation.id"
								type="button"
								class="absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-xs font-bold shadow-lg transition hover:scale-105"
								:class="[
									selectedId === annotation.id ? 'border-primary bg-primary text-primary-fg ring-4 ring-primary/20' : annotation.status === 'resolved' ? 'border-success bg-success text-success-fg' : 'border-canvas bg-warning text-warning-fg',
								]"
								:style="{ left: `${annotation.x}%`, top: `${annotation.y}%` }"
								@click="selectAnnotation(annotation.id)"
							>
								{{ annotation.number }}
							</button>
						</div>
					</div>
				</section>

				<section class="grid gap-3 border-t border-border px-4 py-4 sm:grid-cols-3 sm:px-6">
					<button
						v-for="annotation in visibleAnnotations.slice(0, 3)"
						:key="annotation.id"
						type="button"
						class="rounded-lg border border-border p-3 text-left transition hover:bg-secondary/60"
						:class="selectedId === annotation.id ? 'bg-secondary ring-2 ring-primary/20' : 'bg-canvas'"
						@click="selectAnnotation(annotation.id)"
					>
						<div class="flex items-center justify-between gap-3">
							<span class="text-xs font-semibold text-muted-fg">Pin {{ annotation.number }}</span>
							<span
								class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
								:class="annotation.status === 'resolved' ? 'bg-success/15 text-success' : annotation.priority === 'High' ? 'bg-warning/15 text-warning' : 'bg-secondary text-muted-fg'"
							>
								{{ annotation.status === 'resolved' ? 'Resolved' : annotation.priority }}
							</span>
						</div>
						<p class="mt-2 line-clamp-2 text-sm font-semibold">{{ annotation.title }}</p>
						<p class="mt-2 text-xs text-muted-fg">{{ annotation.updatedAt }}</p>
					</button>
				</section>
			</main>

			<aside class="min-w-0 bg-canvas">
				<div class="border-b border-border px-4 py-4 sm:px-5">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Selected thread</p>
							<h4 class="mt-2 text-lg font-semibold tracking-tight">{{ selectedAnnotation.title }}</h4>
						</div>
						<span
							class="rounded-full px-2 py-1 text-xs font-semibold"
							:class="selectedAnnotation.status === 'resolved' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
						>
							{{ selectedAnnotation.status }}
						</span>
					</div>
					<p class="mt-3 text-sm leading-6 text-muted-fg">{{ selectedAnnotation.excerpt }}</p>
					<div class="mt-4 grid grid-cols-2 gap-3 text-sm">
						<div class="rounded-lg bg-secondary/70 p-3">
							<p class="text-xs text-muted-fg">Target</p>
							<p class="mt-1 font-semibold">{{ selectedAnnotation.target }}</p>
						</div>
						<div class="rounded-lg bg-secondary/70 p-3">
							<p class="text-xs text-muted-fg">Assignee</p>
							<div class="mt-1 flex items-center gap-2">
								<span class="h-2.5 w-2.5 rounded-full" :class="selectedReviewer.tone"></span>
								<p class="truncate font-semibold">{{ selectedReviewer.name }}</p>
							</div>
						</div>
					</div>
				</div>

				<div class="max-h-[31rem] space-y-3 overflow-auto px-4 py-4 sm:px-5">
					<article
						v-for="comment in selectedAnnotation.comments"
						:key="comment.id"
						class="rounded-lg border border-border bg-secondary/35 p-3"
					>
						<div class="flex items-center justify-between gap-3">
							<p class="text-sm font-semibold">{{ comment.author }}</p>
							<span class="text-xs text-muted-fg">{{ comment.time }}</span>
						</div>
						<p class="mt-2 text-sm leading-6 text-muted-fg">{{ comment.body }}</p>
					</article>
				</div>

				<div class="border-t border-border p-4 sm:p-5">
					<DomTextareaInput
						v-model="replyDraft"
						label="Reply"
						:rows="4"
						placeholder="Add a decision, implementation note, or QA follow-up."
					/>
					<div class="mt-3 flex flex-col gap-2 sm:flex-row">
						<DomButton class="flex-1" :disabled="!replyDraft.trim()" @click="addReply">
							{{ justSaved ? 'Reply added' : 'Add reply' }}
						</DomButton>
						<DomButton variant="secondary" class="flex-1" @click="toggleResolved">
							{{ selectedAnnotation.status === 'resolved' ? 'Reopen' : 'Resolve' }}
						</DomButton>
					</div>
					<p class="mt-3 text-xs leading-5 text-muted-fg">
						Every reply and status change should become an immutable review event tied to the screen version.
					</p>
				</div>
			</aside>
		</div>
	</div>
</template>
