<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomBadge,
	DomButton,
	DomCard,
	DomDialog,
	DomProgress,
	DomRadioGroup,
	DomSelect,
	DomStatusPill,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
	DomToggleButtonGroup,
	DomTooltip,
} from '@getdom/studio/vue';

const mobileViewOptions = [
	{ key: 'screen', value: 'screen', label: 'Review screen' },
	{ key: 'thread', value: 'thread', label: 'Selected thread' },
];

const versions = [
	{
		value: 'build-7',
		label: 'Build 7',
		description: 'Current checkout candidate with four review threads.',
		meta: 'Current',
	},
	{
		value: 'build-6',
		label: 'Build 6',
		description: 'Previous candidate retained for comparison and audit history.',
		meta: 'Previous',
	},
];

const reviewers = [
	{
		value: 'maya',
		label: 'Maya Chen',
		role: 'Product',
		initials: 'MC',
		description: 'Owns checkout language and release decisions.',
	},
	{
		value: 'oscar',
		label: 'Oscar Reed',
		role: 'Design',
		initials: 'OR',
		description: 'Owns interaction design and component consistency.',
	},
	{
		value: 'nina',
		label: 'Nina Patel',
		role: 'QA',
		initials: 'NP',
		description: 'Owns responsive and regression verification.',
	},
	{
		value: 'sam',
		label: 'Sam Torres',
		role: 'Engineering',
		initials: 'ST',
		description: 'Owns checkout data and implementation.',
	},
];

const targetOptions = [
	{
		value: 'navigation',
		label: 'Workspace navigation',
		description: 'Anchor feedback to the workspace and billing context.',
		x: 17,
		y: 12,
		mobileX: 18,
		mobileY: 9,
	},
	{
		value: 'payment',
		label: 'Payment method',
		description: 'Anchor feedback to the saved-card explanation.',
		x: 34,
		y: 64,
		mobileX: 52,
		mobileY: 48,
	},
	{
		value: 'summary',
		label: 'Order summary',
		description: 'Anchor feedback to totals, renewal terms, or confirmation.',
		x: 77,
		y: 40,
		mobileX: 72,
		mobileY: 79,
	},
];

const priorityOptions = [
	{ key: 'low', value: 'low', label: 'Low' },
	{ key: 'medium', value: 'medium', label: 'Medium' },
	{ key: 'high', value: 'high', label: 'High' },
];

const annotations = ref([
	{
		id: 'ann-nav',
		number: 1,
		x: 17,
		y: 12,
		mobileX: 18,
		mobileY: 9,
		title: 'Workspace state is too subtle',
		target: 'Workspace navigation',
		status: 'open',
		priority: 'medium',
		assignee: 'oscar',
		author: 'nina',
		updatedAt: '4 minutes ago',
		excerpt: 'The active workspace needs stronger contrast before this reaches enterprise customers.',
		comments: [
			{ id: 'c1', author: 'Nina Patel', initials: 'NP', time: '10:18', body: 'Active and hover states are hard to tell apart in dense navigation.' },
			{ id: 'c2', author: 'Oscar Reed', initials: 'OR', time: '10:22', body: 'I can raise the background and add the standard focus outline.' },
		],
	},
	{
		id: 'ann-summary',
		number: 2,
		x: 77,
		y: 40,
		mobileX: 72,
		mobileY: 79,
		title: 'Renewal terms need clearer context',
		target: 'Order summary',
		status: 'open',
		priority: 'high',
		assignee: 'sam',
		author: 'maya',
		updatedAt: '11 minutes ago',
		excerpt: 'The annual total is clear, but customers cannot tell when the next renewal is charged.',
		comments: [
			{ id: 'c3', author: 'Maya Chen', initials: 'MC', time: '10:03', body: 'Please include the renewal date and explain that the amount excludes usage overages.' },
			{ id: 'c4', author: 'Sam Torres', initials: 'ST', time: '10:14', body: 'The billing API already returns both values. I will expose them in this summary.' },
		],
	},
	{
		id: 'ann-card',
		number: 3,
		x: 34,
		y: 64,
		mobileX: 52,
		mobileY: 48,
		title: 'Saved-card copy is ambiguous',
		target: 'Payment method',
		status: 'open',
		priority: 'high',
		assignee: 'maya',
		author: 'oscar',
		updatedAt: '17 minutes ago',
		excerpt: 'The card says default but does not explain whether invoices or one-off checkout sessions use it.',
		comments: [
			{ id: 'c5', author: 'Oscar Reed', initials: 'OR', time: '09:48', body: 'Copy should say this card is used for subscription renewals only.' },
		],
	},
	{
		id: 'ann-promo',
		number: 4,
		x: 42,
		y: 82,
		mobileX: 48,
		mobileY: 62,
		title: 'Promotion-code empty state approved',
		target: 'Promotion code',
		status: 'resolved',
		priority: 'low',
		assignee: 'nina',
		author: 'sam',
		updatedAt: 'Yesterday',
		excerpt: 'The empty promotion-code state now uses the approved checkout language.',
		comments: [
			{ id: 'c6', author: 'Sam Torres', initials: 'ST', time: 'Yesterday', body: 'Updated in build 7 and ready for final QA.' },
			{ id: 'c7', author: 'Nina Patel', initials: 'NP', time: 'Yesterday', body: 'Verified at desktop and mobile widths.' },
		],
	},
]);

const activeFilter = ref('open');
const selectedVersion = ref('build-7');
const selectedId = ref('ann-summary');
const mobileView = ref('screen');
const showPins = ref(true);
const replyDraft = ref('I will update this before the release review.');
const actionNotice = ref('');
const addDialogOpen = ref(false);
const newTitle = ref('Clarify checkout total hierarchy');
const newNote = ref('The annual total and renewal cadence compete for attention.');
const newTarget = ref('summary');
const newPriority = ref('medium');

const selectedAnnotation = computed(getSelectedAnnotation);
const openCount = computed(getOpenCount);
const resolvedCount = computed(getResolvedCount);
const highPriorityCount = computed(getHighPriorityCount);
const completionPercent = computed(getCompletionPercent);
const reviewStatus = computed(getReviewStatus);
const filterOptions = computed(getFilterOptions);
const visibleAnnotations = computed(getVisibleAnnotations);
const currentVersion = computed(getCurrentVersion);
const canSaveAnnotation = computed(getCanSaveAnnotation);

watch(activeFilter, syncFilterSelection);
watch(selectedVersion, announceVersionChange);

/**
 * Resolve the currently selected annotation with a safe fallback.
 *
 * @returns {object} Selected annotation record.
 */
function getSelectedAnnotation() {
	return annotations.value.find((annotation) => annotation.id === selectedId.value) || annotations.value[0];
}

/**
 * Count annotations that still require a decision.
 *
 * @returns {number} Open annotation count.
 */
function getOpenCount() {
	return annotations.value.filter((annotation) => annotation.status === 'open').length;
}

/**
 * Count annotations that have been resolved.
 *
 * @returns {number} Resolved annotation count.
 */
function getResolvedCount() {
	return annotations.value.filter((annotation) => annotation.status === 'resolved').length;
}

/**
 * Count high-priority annotations that remain open.
 *
 * @returns {number} Open high-priority annotation count.
 */
function getHighPriorityCount() {
	return annotations.value.filter((annotation) => annotation.status === 'open' && annotation.priority === 'high').length;
}

/**
 * Calculate review completion from resolved annotations.
 *
 * @returns {number} Completion percentage.
 */
function getCompletionPercent() {
	if (!annotations.value.length) return 100;
	return Math.round((resolvedCount.value / annotations.value.length) * 100);
}

/**
 * Resolve a short review status for the header.
 *
 * @returns {string} Human-readable review status.
 */
function getReviewStatus() {
	if (!openCount.value) return 'Ready to ship';
	if (highPriorityCount.value) return `${highPriorityCount.value} high priority`;
	return `${openCount.value} open threads`;
}

/**
 * Build rich filter options with current result counts.
 *
 * @returns {Array<object>} Filter options for the thread query.
 */
function getFilterOptions() {
	return [
		{
			value: 'open',
			label: 'Open feedback',
			description: 'Threads that still require a decision or implementation.',
			meta: `${openCount.value}`,
		},
		{
			value: 'mine',
			label: 'Assigned to me',
			description: 'Open threads currently assigned to Maya Chen.',
			meta: `${annotations.value.filter((annotation) => annotation.status === 'open' && annotation.assignee === 'maya').length}`,
		},
		{
			value: 'resolved',
			label: 'Resolved',
			description: 'Accepted changes retained in the review history.',
			meta: `${resolvedCount.value}`,
		},
		{
			value: 'all',
			label: 'All feedback',
			description: 'Every annotation attached to this build.',
			meta: `${annotations.value.length}`,
		},
	];
}

/**
 * Filter annotations for the active review query.
 *
 * @returns {Array<object>} Visible annotation records.
 */
function getVisibleAnnotations() {
	return annotations.value.filter((annotation) => {
		if (activeFilter.value === 'open') return annotation.status === 'open';
		if (activeFilter.value === 'resolved') return annotation.status === 'resolved';
		if (activeFilter.value === 'mine') return annotation.assignee === 'maya' && annotation.status === 'open';
		return true;
	});
}

/**
 * Resolve the selected build metadata.
 *
 * @returns {object} Current version option.
 */
function getCurrentVersion() {
	return versions.find((version) => version.value === selectedVersion.value) || versions[0];
}

/**
 * Determine whether the add-annotation form has enough detail to save.
 *
 * @returns {boolean} True when the new annotation can be saved.
 */
function getCanSaveAnnotation() {
	return Boolean(newTitle.value.trim() && newNote.value.trim());
}

/**
 * Keep selection aligned with a filter that has visible results.
 *
 * @returns {void}
 */
function syncFilterSelection() {
	if (!visibleAnnotations.value.length) return;
	if (!visibleAnnotations.value.some((annotation) => annotation.id === selectedId.value)) {
		selectedId.value = visibleAnnotations.value[0].id;
	}
}

/**
 * Announce the build version shown in the review target.
 *
 * @returns {void}
 */
function announceVersionChange() {
	actionNotice.value = `${currentVersion.value.label} loaded with its preserved annotation context.`;
}

/**
 * Resolve a reviewer record by identifier.
 *
 * @param {string} reviewerId Reviewer identifier.
 * @returns {object} Matching reviewer record.
 */
function reviewerFor(reviewerId) {
	return reviewers.find((reviewer) => reviewer.value === reviewerId) || reviewers[0];
}

/**
 * Select a thread and move the compact layout to its discussion.
 *
 * @param {string} annotationId Annotation identifier.
 * @returns {void}
 */
function selectAnnotation(annotationId) {
	selectedId.value = annotationId;
	actionNotice.value = '';
	void showSelectedThread();
}

/**
 * Reveal the selected discussion and align it in compact viewports.
 *
 * @returns {Promise<void>}
 */
async function showSelectedThread() {
	mobileView.value = 'thread';
	await nextTick();
	if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches) {
		document.getElementById('selected-annotation-thread')?.scrollIntoView({ block: 'start' });
	}
}

/**
 * Return the semantic visual tone for an annotation.
 *
 * @param {object} annotation Annotation record.
 * @returns {string} DOM Studio tone.
 */
function toneForAnnotation(annotation) {
	if (annotation.status === 'resolved') return 'success';
	if (annotation.priority === 'high') return 'warning';
	return 'neutral';
}

/**
 * Return the semantic priority label for an annotation.
 *
 * @param {object} annotation Annotation record.
 * @returns {string} Readable priority or status label.
 */
function labelForAnnotation(annotation) {
	if (annotation.status === 'resolved') return 'Resolved';
	return `${annotation.priority.charAt(0).toUpperCase()}${annotation.priority.slice(1)} priority`;
}

/**
 * Build responsive normalized coordinate variables for a pin.
 *
 * @param {object} annotation Annotation record.
 * @returns {object} CSS custom properties for the pin position.
 */
function styleForPin(annotation) {
	return {
		'--pin-x': `${annotation.x}%`,
		'--pin-y': `${annotation.y}%`,
		'--pin-mobile-x': `${annotation.mobileX}%`,
		'--pin-mobile-y': `${annotation.mobileY}%`,
	};
}

/**
 * Build a complete accessible name for an annotation pin.
 *
 * @param {object} annotation Annotation record.
 * @returns {string} Accessible pin label.
 */
function labelForPin(annotation) {
	return `Pin ${annotation.number}: ${annotation.title}. ${labelForAnnotation(annotation)}.`;
}

/**
 * Add the reply draft to the selected annotation.
 *
 * @returns {void}
 */
function addReply() {
	const body = replyDraft.value.trim();
	if (!body) return;

	selectedAnnotation.value.comments.push({
		id: `comment-${Date.now()}`,
		author: 'Maya Chen',
		initials: 'MC',
		time: 'Now',
		body,
	});
	selectedAnnotation.value.updatedAt = 'Just now';
	replyDraft.value = '';
	actionNotice.value = `Reply added to pin ${selectedAnnotation.value.number}.`;
}

/**
 * Toggle the selected annotation between open and resolved states.
 *
 * @returns {void}
 */
function toggleResolved() {
	const nextStatus = selectedAnnotation.value.status === 'resolved' ? 'open' : 'resolved';
	selectedAnnotation.value.status = nextStatus;
	selectedAnnotation.value.updatedAt = 'Just now';
	activeFilter.value = nextStatus === 'resolved' ? 'resolved' : 'open';
	actionNotice.value = `Pin ${selectedAnnotation.value.number} ${nextStatus === 'resolved' ? 'resolved' : 'reopened'}.`;
}

/**
 * Open the new-annotation dialog with practical defaults.
 *
 * @returns {void}
 */
function openAddDialog() {
	newTitle.value = 'Clarify checkout total hierarchy';
	newNote.value = 'The annual total and renewal cadence compete for attention.';
	newTarget.value = 'summary';
	newPriority.value = 'medium';
	addDialogOpen.value = true;
}

/**
 * Save a new annotation at the selected target coordinates.
 *
 * @returns {void}
 */
function saveAnnotation() {
	if (!canSaveAnnotation.value) return;
	const target = targetOptions.find((option) => option.value === newTarget.value) || targetOptions[0];
	const nextNumber = Math.max(...annotations.value.map((annotation) => annotation.number)) + 1;
	const annotation = {
		id: `annotation-${Date.now()}`,
		number: nextNumber,
		x: target.x,
		y: target.y,
		mobileX: target.mobileX,
		mobileY: target.mobileY,
		title: newTitle.value.trim(),
		target: target.label,
		status: 'open',
		priority: newPriority.value,
		assignee: 'maya',
		author: 'maya',
		updatedAt: 'Just now',
		excerpt: newNote.value.trim(),
		comments: [
			{
				id: `comment-${Date.now()}`,
				author: 'Maya Chen',
				initials: 'MC',
				time: 'Now',
				body: newNote.value.trim(),
			},
		],
	};

	annotations.value.unshift(annotation);
	selectedId.value = annotation.id;
	activeFilter.value = 'open';
	addDialogOpen.value = false;
	actionNotice.value = `Pin ${annotation.number} added to ${annotation.target}.`;
	void showSelectedThread();
}

/**
 * Announce a copied review link for the example workflow.
 *
 * @returns {void}
 */
function copyReviewLink() {
	actionNotice.value = 'Review link copied for Build 7.';
}
</script>

<template>
	<section class="min-h-dvh w-full bg-secondary/25 text-canvas-fg">
		<header class="border-b border-border bg-canvas">
			<div class="mx-auto flex w-full max-w-[100rem] flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Collaborative review</p>
						<DomStatusPill tone="success" size="sm">Synced</DomStatusPill>
					</div>
					<h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Checkout redesign annotations</h1>
					<p class="mt-2 hidden max-w-3xl text-sm leading-6 text-muted-fg sm:block">
						Review the live checkout candidate, keep feedback anchored to each responsive target, and move one thread from question to decision.
					</p>
					<div class="mt-3 flex flex-wrap gap-2">
						<DomBadge tone="neutral">{{ openCount }} open</DomBadge>
						<DomBadge :tone="highPriorityCount ? 'warning' : 'success'">{{ reviewStatus }}</DomBadge>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-2">
					<DomButton variant="secondary" @click="copyReviewLink">Copy review link</DomButton>
					<DomButton @click="openAddDialog">Add annotation</DomButton>
				</div>
			</div>

			<div class="mx-auto grid w-full max-w-[100rem] gap-2 px-4 pb-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
				<DomProgress
					:value="completionPercent"
					label="Review completion"
					:tone="openCount ? 'warning' : 'success'"
					:show-label="false"
				/>
				<p class="text-xs text-muted-fg">{{ resolvedCount }} of {{ annotations.length }} threads resolved</p>
			</div>
		</header>

		<main class="mx-auto w-full max-w-[100rem] space-y-4 px-4 py-4 sm:px-6 sm:py-5">
			<DomAlert
				v-if="actionNotice"
				tone="success"
				title="Review updated"
				:description="actionNotice"
				dismissible
				@dismiss="actionNotice = ''"
			/>

			<div class="xl:hidden">
				<DomToggleButtonGroup
					v-model="mobileView"
					:options="mobileViewOptions"
					label="Review view"
					chrome="none"
					variant="switch"
				/>
			</div>

			<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_23rem]">
				<section
					class="min-w-0"
					:class="mobileView === 'screen' ? 'block' : 'hidden xl:block'"
				>
					<DomCard padding="p-4 sm:p-5">
						<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.55fr)_auto] lg:items-end">
							<DomSelect
								v-model="activeFilter"
								label="Thread filter"
								:options="filterOptions"
								width="min-w-[20rem]"
							>
								<template #value="{ option }">
									<span class="flex min-w-0 items-center justify-between gap-3">
										<span class="truncate font-medium">{{ option?.label }}</span>
										<DomBadge tone="neutral" size="sm">{{ option?.meta }}</DomBadge>
									</span>
								</template>
								<template #option="{ option, selected }">
									<span class="block">
										<span class="flex items-center justify-between gap-3">
											<span class="font-medium">{{ option.label }}</span>
											<DomBadge :tone="selected ? 'success' : 'neutral'" size="sm">
												{{ selected ? 'Selected' : option.meta }}
											</DomBadge>
										</span>
										<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ option.description }}</span>
									</span>
								</template>
							</DomSelect>

							<div class="hidden sm:block">
								<DomSelect
									v-model="selectedVersion"
									label="Reviewed build"
									:options="versions"
									width="min-w-[17rem]"
								>
									<template #value="{ option }">
										<span class="flex min-w-0 items-center justify-between gap-3">
											<span class="truncate font-medium">{{ option?.label }}</span>
											<DomBadge tone="neutral" size="sm">{{ option?.meta }}</DomBadge>
										</span>
									</template>
									<template #option="{ option, selected }">
										<span class="block">
											<span class="flex items-center justify-between gap-3">
												<span class="font-medium">{{ option.label }}</span>
												<DomBadge :tone="selected ? 'success' : 'neutral'" size="sm">
													{{ selected ? 'Selected' : option.meta }}
												</DomBadge>
											</span>
											<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ option.description }}</span>
										</span>
									</template>
								</DomSelect>
							</div>

							<DomToggle
								v-model="showPins"
								label="Pins"
								description="Show annotations"
								size="sm"
							/>
						</div>
					</DomCard>

					<div class="mt-4 overflow-hidden rounded-xl border border-border bg-canvas shadow-sm">
						<div class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
							<div>
								<p class="text-sm font-semibold">Checkout summary</p>
								<p class="mt-0.5 text-xs text-muted-fg">{{ currentVersion.label }} · responsive preview</p>
							</div>
							<div class="flex items-center gap-2">
								<DomBadge tone="neutral" size="sm">1440 × 960 source</DomBadge>
								<DomStatusPill tone="success" size="sm">Ready for review</DomStatusPill>
							</div>
						</div>

						<div class="relative bg-secondary/35 p-3 sm:p-5" aria-label="Checkout summary review target">
							<div class="rounded-xl border border-border bg-canvas p-3 shadow-sm sm:p-5">
								<div class="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
									<div>
										<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Atlas Studio</p>
										<p class="mt-1 text-sm font-semibold">Workspace / Billing</p>
									</div>
									<DomBadge tone="primary">Annual upgrade</DomBadge>
								</div>

								<div class="grid gap-4 pt-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(15rem,0.75fr)]">
									<div class="min-w-0 space-y-4">
										<section class="border-b border-border pb-4">
											<div class="flex items-start justify-between gap-3">
												<div>
													<p class="text-sm font-semibold">DOM Studio Enterprise</p>
													<p class="mt-1 text-xs leading-5 text-muted-fg">20 editor seats · annual billing</p>
												</div>
												<DomBadge tone="neutral">£9,600 / year</DomBadge>
											</div>
											<dl class="mt-4 grid gap-2 text-xs text-muted-fg sm:grid-cols-2">
												<div class="flex justify-between gap-2">
													<dt>Source access</dt>
													<dd class="font-medium text-canvas-fg">Included</dd>
												</div>
												<div class="flex justify-between gap-2">
													<dt>Support</dt>
													<dd class="font-medium text-canvas-fg">Priority</dd>
												</div>
											</dl>
										</section>

										<section class="border-b border-border pb-4">
											<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Payment method</p>
											<div class="mt-3 flex flex-wrap items-center justify-between gap-3">
												<div>
													<p class="text-sm font-semibold">Visa ending 4242</p>
													<p class="mt-1 text-xs text-muted-fg">Default card for subscription renewals</p>
												</div>
												<DomButton variant="secondary" size="sm">Change</DomButton>
											</div>
										</section>

										<section>
											<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Promotion code</p>
											<div class="mt-3 flex flex-wrap items-center justify-between gap-3">
												<p class="text-sm text-muted-fg">No promotion code applied.</p>
												<DomButton variant="ghost" size="sm">Add code</DomButton>
											</div>
										</section>
									</div>

									<aside class="rounded-xl border border-border bg-secondary/45 p-4">
										<p class="text-sm font-semibold">Order summary</p>
										<dl class="mt-4 divide-y divide-border text-sm">
											<div class="flex justify-between gap-3 py-3">
												<dt class="text-muted-fg">Annual plan</dt>
												<dd class="font-medium">£9,600</dd>
											</div>
											<div class="flex justify-between gap-3 py-3">
												<dt class="text-muted-fg">VAT</dt>
												<dd class="font-medium">£1,920</dd>
											</div>
											<div class="flex justify-between gap-3 py-3 text-base">
												<dt class="font-semibold">Due today</dt>
												<dd class="font-semibold">£11,520</dd>
											</div>
										</dl>
										<p class="mt-3 text-xs leading-5 text-muted-fg">Renews 29 July 2027. Usage overages are billed monthly.</p>
										<DomButton class="mt-4 w-full">Confirm annual plan</DomButton>
									</aside>
								</div>
							</div>

							<DomTooltip
								v-for="annotation in visibleAnnotations"
								:key="annotation.id"
								:text="annotation.title"
							>
								<button
									v-show="showPins"
									type="button"
									class="annotation-pin absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-xs font-bold shadow-lg transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
									:class="selectedId === annotation.id ? 'border-primary bg-primary text-primary-fg ring-4 ring-primary/20' : annotation.status === 'resolved' ? 'border-success bg-success text-success-fg' : 'border-canvas bg-warning text-warning-fg'"
									:style="styleForPin(annotation)"
									:aria-label="labelForPin(annotation)"
									:aria-pressed="selectedId === annotation.id"
									@click="selectAnnotation(annotation.id)"
								>
									{{ annotation.number }}
								</button>
							</DomTooltip>
						</div>
					</div>

					<DomCard class="mt-4" padding="p-0">
						<div class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
							<div>
								<h2 class="text-sm font-semibold">Visible annotations</h2>
								<p class="mt-0.5 text-xs text-muted-fg">{{ visibleAnnotations.length }} threads match this filter</p>
							</div>
							<DomButton variant="secondary" size="sm" @click="openAddDialog">Add annotation</DomButton>
						</div>

						<div v-if="visibleAnnotations.length" class="divide-y divide-border">
							<button
								v-for="annotation in visibleAnnotations"
								:key="`${annotation.id}-row`"
								type="button"
								class="grid w-full gap-2 px-4 py-3 text-left transition hover:bg-secondary/45 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
								:class="selectedId === annotation.id ? 'bg-primary/5' : ''"
								@click="selectAnnotation(annotation.id)"
							>
								<span class="grid size-7 place-items-center rounded-full bg-secondary text-xs font-semibold">{{ annotation.number }}</span>
								<span class="min-w-0">
									<span class="block truncate text-sm font-semibold">{{ annotation.title }}</span>
									<span class="mt-1 block truncate text-xs text-muted-fg">{{ annotation.target }} · {{ reviewerFor(annotation.assignee).label }} · {{ annotation.updatedAt }}</span>
								</span>
								<DomStatusPill :tone="toneForAnnotation(annotation)" size="sm">{{ labelForAnnotation(annotation) }}</DomStatusPill>
							</button>
						</div>

						<div v-else class="p-6 text-center">
							<p class="text-sm font-semibold">No annotations match this filter</p>
							<p class="mt-1 text-sm text-muted-fg">Choose another filter or add a new annotation.</p>
						</div>
					</DomCard>
				</section>

				<aside
					id="selected-annotation-thread"
					class="min-w-0"
					:class="mobileView === 'thread' ? 'block' : 'hidden xl:block'"
				>
					<DomCard class="xl:sticky xl:top-4" padding="p-0">
						<div class="border-b border-border p-4">
							<div class="mb-3 xl:hidden">
								<DomButton variant="secondary" size="sm" @click="mobileView = 'screen'">Back to screen</DomButton>
							</div>
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Pin {{ selectedAnnotation.number }}</p>
									<h2 class="mt-2 text-lg font-semibold tracking-tight">{{ selectedAnnotation.title }}</h2>
								</div>
								<DomStatusPill :tone="toneForAnnotation(selectedAnnotation)" size="sm">
									{{ selectedAnnotation.status === 'resolved' ? 'Resolved' : 'Open' }}
								</DomStatusPill>
							</div>
							<p class="mt-3 text-sm leading-6 text-muted-fg">{{ selectedAnnotation.excerpt }}</p>
							<div class="mt-4 flex flex-wrap gap-2">
								<DomBadge tone="neutral">{{ selectedAnnotation.target }}</DomBadge>
								<DomBadge :tone="toneForAnnotation(selectedAnnotation)">{{ labelForAnnotation(selectedAnnotation) }}</DomBadge>
							</div>
						</div>

						<div class="border-b border-border p-4">
							<DomSelect
								v-model="selectedAnnotation.assignee"
								label="Assignee"
								:options="reviewers"
								width="min-w-[19rem]"
							>
								<template #value="{ option }">
									<span class="flex min-w-0 items-center gap-2">
										<DomAvatar :name="option?.label" :initials="option?.initials" size="xs" />
										<span class="min-w-0 flex-1 truncate font-medium">{{ option?.label }}</span>
										<DomBadge tone="neutral" size="sm">{{ option?.role }}</DomBadge>
									</span>
								</template>
								<template #option="{ option, selected }">
									<span class="flex items-start gap-3">
										<DomAvatar :name="option.label" :initials="option.initials" size="sm" />
										<span class="min-w-0 flex-1">
											<span class="flex items-center justify-between gap-2">
												<span class="font-medium">{{ option.label }}</span>
												<DomBadge :tone="selected ? 'success' : 'neutral'" size="sm">
													{{ selected ? 'Selected' : option.role }}
												</DomBadge>
											</span>
											<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ option.description }}</span>
										</span>
									</span>
								</template>
							</DomSelect>
						</div>

						<div class="max-h-[18rem] divide-y divide-border overflow-auto">
							<article
								v-for="comment in selectedAnnotation.comments"
								:key="comment.id"
								class="flex gap-3 p-4"
							>
								<DomAvatar :name="comment.author" :initials="comment.initials" size="xs" />
								<div class="min-w-0 flex-1">
									<div class="flex items-center justify-between gap-3">
										<p class="text-sm font-semibold">{{ comment.author }}</p>
										<time class="text-xs text-muted-fg">{{ comment.time }}</time>
									</div>
									<p class="mt-2 text-sm leading-6 text-muted-fg">{{ comment.body }}</p>
								</div>
							</article>
						</div>

						<div class="border-t border-border p-4">
							<DomTextareaInput
								v-model="replyDraft"
								label="Reply"
								:rows="3"
								placeholder="Add a decision, implementation note, or QA follow-up."
							/>
							<div class="mt-3 grid grid-cols-2 gap-2">
								<DomButton :disabled="!replyDraft.trim()" @click="addReply">Add reply</DomButton>
								<DomButton variant="secondary" @click="toggleResolved">
									{{ selectedAnnotation.status === 'resolved' ? 'Reopen' : 'Resolve' }}
								</DomButton>
							</div>
							<p class="mt-3 text-xs leading-5 text-muted-fg">
								Persist replies, assignments, and status changes as immutable review events.
							</p>
						</div>
					</DomCard>
				</aside>
			</div>
		</main>

		<DomDialog
			v-model="addDialogOpen"
			title="Add checkout annotation"
			description="Capture a specific review question and anchor it to a stable target in Build 7."
			size="lg"
		>
			<div class="grid gap-4">
				<DomTextInput
					v-model="newTitle"
					label="Annotation title"
					description="Name the decision the team needs to make."
				/>
				<DomTextareaInput
					v-model="newNote"
					label="Review note"
					description="Include the evidence, risk, or expected change."
					:rows="3"
				/>
				<DomRadioGroup v-model="newTarget" :options="targetOptions" label="Target">
					<template #option="{ option }">
						<div class="min-w-0">
							<p class="font-medium text-canvas-fg">{{ option.label }}</p>
							<p class="mt-1 text-xs leading-5 text-muted-fg">{{ option.description }}</p>
						</div>
					</template>
				</DomRadioGroup>
				<div>
					<p class="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Priority</p>
					<DomToggleButtonGroup
						v-model="newPriority"
						:options="priorityOptions"
						label="Priority"
						chrome="none"
						variant="switch"
					/>
				</div>
				<DomAlert
					tone="neutral"
					title="Integration boundary"
					description="Persist the target id, responsive target variant, normalized coordinates, author, assignee, priority, and source build through your review API."
					:icon="false"
				/>
			</div>
			<template #footer>
				<DomButton data-close variant="secondary">Cancel</DomButton>
				<DomButton :disabled="!canSaveAnnotation" @click="saveAnnotation">Add annotation</DomButton>
			</template>
		</DomDialog>
	</section>
</template>

<style scoped>
.annotation-pin {
	left: var(--pin-mobile-x);
	top: var(--pin-mobile-y);
}

@media (min-width: 640px) {
	.annotation-pin {
		left: var(--pin-x);
		top: var(--pin-y);
	}
}
</style>
