<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomEmailInput,
	DomEmptyState,
	DomJsonViewer,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextInput,
} from '@getdom/studio/vue';

const mobileViews = [
	{ key: 'proposals', label: 'Proposals' },
	{ key: 'content', label: 'Content' },
	{ key: 'details', label: 'Details' },
];

const inspectorTabs = [
	{ key: 'review', label: 'Review' },
	{ key: 'commercials', label: 'Commercials' },
	{ key: 'activity', label: 'Activity' },
];

const bootstrap = ref(null);
const proposal = ref(null);
const loading = ref(true);
const busy = ref(false);
const activeProposalId = ref('');
const activeSectionId = ref('');
const activeMobileView = ref('content');
const inspectorTab = ref('review');
const searchQuery = ref('');
const lifecycleFilter = ref('all');
const successMessage = ref('');
const errorMessage = ref('');
const fieldErrors = ref({});
const latestReceipt = ref(null);
const resolveDialogOpen = ref(false);
const reviewerDialogOpen = ref(false);
const pricingDialogOpen = ref(false);
const sendDialogOpen = ref(false);
const viewDialogOpen = ref(false);
const acceptDialogOpen = ref(false);
const resetDialogOpen = ref(false);
const selectedCommentId = ref('');
const selectedReviewerId = ref('');
const sendAcknowledged = ref(false);
const viewAcknowledged = ref(false);

const sectionDraft = reactive({ title: '', body: '', status: 'draft' });
const settingsDraft = reactive({ title: '', clientName: '', clientEmail: '', template: 'implementation', currency: 'GBP', validUntil: '' });
const resolveDraft = reactive({ resolution: '' });
const reviewerDraft = reactive({ decision: 'approved', note: '' });
const pricingDraft = reactive({ name: '', description: '', quantity: '1', unitAmount: '' });
const acceptDraft = reactive({ signerName: '', acknowledged: false });

const proposalIsDraft = computed(() => proposal.value?.status === 'draft');
const proposalIsSent = computed(() => proposal.value?.status === 'sent');
const proposalIsAccepted = computed(() => proposal.value?.status === 'accepted');
const blockerCount = computed(() => proposal.value ? proposal.value.preflight.total - proposal.value.preflight.passed : 0);
const blockerLabel = computed(() => `${blockerCount.value} ${blockerCount.value === 1 ? 'blocker' : 'blockers'}`);
const activeSection = computed(() => proposal.value?.sections.find((section) => section.id === activeSectionId.value) || proposal.value?.sections[0] || null);
const activeComment = computed(() => proposal.value?.comments.find((comment) => comment.id === selectedCommentId.value) || null);
const activeReviewer = computed(() => proposal.value?.reviewers.find((reviewer) => reviewer.id === selectedReviewerId.value) || null);
const openComments = computed(() => proposal.value?.comments.filter((comment) => comment.state === 'open') || []);
const proposalWordCount = computed(() => proposal.value?.sections.reduce((total, section) => total + section.wordCount, 0) || 0);
const sectionTabs = computed(() => proposal.value?.sections.map((section) => ({ key: section.id, label: section.title })) || []);
const filteredProposals = computed(() => {
	if (!bootstrap.value) return [];
	const query = searchQuery.value.trim().toLowerCase();
	return bootstrap.value.proposals.filter((item) => {
		const matchesLifecycle = lifecycleFilter.value === 'all' || item.status === lifecycleFilter.value;
		const matchesQuery = !query || `${item.title} ${item.clientName}`.toLowerCase().includes(query);
		return matchesLifecycle && matchesQuery;
	});
});

/**
 * Requests JSON and exposes structured API errors to the editor.
 *
 * @param {string} url Request URL.
 * @param {RequestInit & { body?: Record<string, unknown> }} options Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed JSON response.
 */
async function requestJson(url, options = {}) {
	const request = { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } };
	if (request.body && typeof request.body !== 'string') request.body = JSON.stringify(request.body);
	const response = await fetch(url, request);
	const payload = await response.json();
	if (!response.ok || payload.error) {
		const error = new Error(payload.message || 'The proposal request failed.');
		error.payload = payload;
		throw error;
	}
	return payload;
}

/**
 * Loads the seeded proposal workspace from the repository-local API.
 *
 * @returns {Promise<void>}
 */
async function loadWorkspace() {
	loading.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/proposal-editor/bootstrap');
		bootstrap.value = result;
		activeProposalId.value = result.defaultProposalId;
		applyPayload(result, { sectionId: result.selectedSectionId });
	} catch (error) {
		handleRequestError(error);
	} finally {
		loading.value = false;
	}
}

/**
 * Selects and loads one proposal from the server.
 *
 * @param {string} proposalId Proposal identifier.
 * @returns {Promise<void>}
 */
async function selectProposal(proposalId) {
	if (busy.value || proposalId === activeProposalId.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/proposal-editor/proposals/${proposalId}`);
		activeProposalId.value = proposalId;
		applyPayload(result, { sectionId: result.selectedSectionId });
		activeMobileView.value = 'content';
		inspectorTab.value = result.proposal.status === 'accepted' ? 'activity' : 'review';
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Applies an API proposal payload and synchronizes editable drafts.
 *
 * @param {Record<string, unknown>} result Proposal API payload.
 * @param {{ sectionId?: string }} selection Optional section selection.
 * @returns {void}
 */
function applyPayload(result, selection = {}) {
	if (result.workspace && bootstrap.value) bootstrap.value.workspace = result.workspace;
	if (result.proposals && bootstrap.value) bootstrap.value.proposals = result.proposals;
	if (result.proposal) proposal.value = result.proposal;
	if (!proposal.value) return;
	activeProposalId.value = proposal.value.id;
	const requestedSection = selection.sectionId || activeSectionId.value;
	activeSectionId.value = proposal.value.sections.some((section) => section.id === requestedSection) ? requestedSection : proposal.value.sections[0]?.id || '';
	latestReceipt.value = result.receipt || proposal.value.latestReceipt || proposal.value.acceptanceReceipt || null;
	syncDrafts();
}

/**
 * Synchronizes section and delivery form drafts from the active proposal.
 *
 * @returns {void}
 */
function syncDrafts() {
	if (!proposal.value) return;
	Object.assign(settingsDraft, {
		title: proposal.value.title,
		clientName: proposal.value.clientName,
		clientEmail: proposal.value.clientEmail,
		template: proposal.value.template,
		currency: proposal.value.currency,
		validUntil: proposal.value.validUntil,
	});
	if (activeSection.value) Object.assign(sectionDraft, { title: activeSection.value.title, body: activeSection.value.body, status: activeSection.value.status });
}

/**
 * Selects a proposal section and refreshes its editable draft.
 *
 * @param {string} sectionId Section identifier.
 * @returns {void}
 */
function selectSection(sectionId) {
	activeSectionId.value = sectionId;
	syncDrafts();
}

/**
 * Runs a proposal mutation with shared feedback and conflict recovery.
 *
 * @param {string} url Request URL.
 * @param {RequestInit & { body?: Record<string, unknown> }} options Request options.
 * @param {string} success Success message.
 * @param {{ sectionId?: string }} selection Optional selection.
 * @returns {Promise<Record<string, unknown> | null>} Mutation result.
 */
async function runMutation(url, options, success, selection = {}) {
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(url, options);
		applyPayload(result, selection);
		successMessage.value = success || result.message;
		return result;
	} catch (error) {
		handleRequestError(error);
		return null;
	} finally {
		busy.value = false;
	}
}

/**
 * Saves the active proposal section at the current revision.
 *
 * @returns {Promise<void>}
 */
async function saveSection() {
	await runMutation(
		`/api/block-demos/proposal-editor/proposals/${proposal.value.id}/sections/${activeSection.value.id}`,
		{ method: 'PATCH', body: { ...sectionDraft, revision: proposal.value.revision } },
		'Proposal section saved.',
		{ sectionId: activeSection.value.id },
	);
}

/**
 * Saves the active proposal delivery settings at the current revision.
 *
 * @returns {Promise<void>}
 */
async function saveSettings() {
	await runMutation(
		`/api/block-demos/proposal-editor/proposals/${proposal.value.id}/settings`,
		{ method: 'PATCH', body: { ...settingsDraft, revision: proposal.value.revision } },
		'Proposal delivery contract saved.',
	);
}

/**
 * Opens the anchored-comment resolution dialog.
 *
 * @param {Record<string, unknown>} comment Comment record.
 * @returns {void}
 */
function openResolveDialog(comment) {
	selectedCommentId.value = comment.id;
	resolveDraft.resolution = '';
	clearFeedback();
	resolveDialogOpen.value = true;
}

/**
 * Resolves the selected anchored review comment.
 *
 * @returns {Promise<void>}
 */
async function resolveComment() {
	const result = await runMutation(
		`/api/block-demos/proposal-editor/proposals/${proposal.value.id}/comments/${activeComment.value.id}/resolve`,
		{ method: 'POST', body: { ...resolveDraft, revision: proposal.value.revision } },
		'Review comment resolved.',
		{ sectionId: activeComment.value.sectionId },
	);
	if (result) resolveDialogOpen.value = false;
}

/**
 * Opens the reviewer decision dialog for an approval or reopen action.
 *
 * @param {Record<string, unknown>} reviewer Reviewer record.
 * @returns {void}
 */
function openReviewerDialog(reviewer) {
	selectedReviewerId.value = reviewer.id;
	reviewerDraft.decision = reviewer.status === 'approved' ? 'pending' : 'approved';
	reviewerDraft.note = '';
	clearFeedback();
	reviewerDialogOpen.value = true;
}

/**
 * Records the selected reviewer decision.
 *
 * @returns {Promise<void>}
 */
async function decideReviewer() {
	const result = await runMutation(
		`/api/block-demos/proposal-editor/proposals/${proposal.value.id}/reviewers/${activeReviewer.value.id}/decision`,
		{ method: 'POST', body: { ...reviewerDraft, revision: proposal.value.revision } },
		reviewerDraft.decision === 'approved' ? 'Reviewer approval recorded.' : 'Reviewer approval reopened.',
	);
	if (result) reviewerDialogOpen.value = false;
}

/**
 * Adds a commercial line item to the draft proposal.
 *
 * @returns {Promise<void>}
 */
async function addPricingItem() {
	const result = await runMutation(
		`/api/block-demos/proposal-editor/proposals/${proposal.value.id}/pricing`,
		{ method: 'POST', body: { ...pricingDraft, quantity: Number(pricingDraft.quantity), unitAmount: Number(pricingDraft.unitAmount), revision: proposal.value.revision } },
		'Commercial line item added.',
	);
	if (result) {
		pricingDialogOpen.value = false;
		Object.assign(pricingDraft, { name: '', description: '', quantity: '1', unitAmount: '' });
	}
}

/**
 * Removes one commercial line item from the draft proposal.
 *
 * @param {string} itemId Pricing item identifier.
 * @returns {Promise<void>}
 */
async function removePricingItem(itemId) {
	await runMutation(
		`/api/block-demos/proposal-editor/proposals/${proposal.value.id}/pricing/${itemId}`,
		{ method: 'DELETE', body: { revision: proposal.value.revision } },
		'Commercial line item removed.',
	);
}

/**
 * Refreshes server-owned send readiness.
 *
 * @returns {Promise<void>}
 */
async function runPreflight() {
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/proposal-editor/proposals/${proposal.value.id}/preflight`, { method: 'POST' });
		proposal.value.preflight = result.preflight;
		successMessage.value = `${result.preflight.passed} of ${result.preflight.total} server checks pass.`;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Sends the ready proposal to its client delivery address.
 *
 * @returns {Promise<void>}
 */
async function sendProposal() {
	const result = await runMutation(
		`/api/block-demos/proposal-editor/proposals/${proposal.value.id}/send`,
		{ method: 'POST', body: { revision: proposal.value.revision, acknowledged: sendAcknowledged.value } },
		'Proposal sent to the client.',
	);
	if (result) {
		sendDialogOpen.value = false;
		sendAcknowledged.value = false;
		inspectorTab.value = 'activity';
		activeMobileView.value = 'details';
	}
}

/**
 * Records a deterministic client-view callback.
 *
 * @returns {Promise<void>}
 */
async function recordClientView() {
	const result = await runMutation(
		`/api/block-demos/proposal-editor/proposals/${proposal.value.id}/view`,
		{ method: 'POST', body: { revision: proposal.value.revision, acknowledged: viewAcknowledged.value } },
		'Client view callback recorded.',
	);
	if (result) {
		viewDialogOpen.value = false;
		viewAcknowledged.value = false;
		inspectorTab.value = 'activity';
		activeMobileView.value = 'details';
	}
}

/**
 * Records deterministic client acceptance and immutable evidence.
 *
 * @returns {Promise<void>}
 */
async function acceptProposal() {
	const result = await runMutation(
		`/api/block-demos/proposal-editor/proposals/${proposal.value.id}/accept`,
		{ method: 'POST', body: { ...acceptDraft, revision: proposal.value.revision } },
		'Client acceptance recorded.',
	);
	if (result) {
		acceptDialogOpen.value = false;
		inspectorTab.value = 'activity';
		activeMobileView.value = 'details';
	}
}

/**
 * Restores the seeded proposal workspace.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/proposal-editor/reset', { method: 'POST' });
		bootstrap.value = result;
		activeProposalId.value = result.defaultProposalId;
		activeMobileView.value = 'content';
		inspectorTab.value = 'review';
		latestReceipt.value = null;
		applyPayload(result, { sectionId: result.selectedSectionId });
		resetDialogOpen.value = false;
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Opens the relevant blocker or the final send confirmation.
 *
 * @returns {void}
 */
function openPrimaryAction() {
	if (proposal.value.preflight.ready) {
		sendDialogOpen.value = true;
		return;
	}
	inspectorTab.value = 'review';
	activeMobileView.value = 'details';
}

/**
 * Maps structured API failures into visible field and conflict feedback.
 *
 * @param {Error & { payload?: Record<string, unknown> }} error Request error.
 * @returns {void}
 */
function handleRequestError(error) {
	const payload = error.payload || {};
	errorMessage.value = payload.message || error.message || 'The proposal request failed.';
	fieldErrors.value = Object.fromEntries((payload.fields || []).map((field) => [field.field, [field]]));
	if (payload.proposal) applyPayload(payload, { sectionId: activeSectionId.value });
}

/**
 * Clears success, error, and field-level feedback.
 *
 * @returns {void}
 */
function clearFeedback() {
	successMessage.value = '';
	errorMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Formats a timestamp for compact proposal activity.
 *
 * @param {string | null} value ISO timestamp.
 * @returns {string} Human-readable timestamp.
 */
function formatTime(value) {
	if (!value) return 'Not yet';
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

onMounted(loadWorkspace);
</script>

<template>
	<div class="h-dvh w-full overflow-hidden bg-canvas text-canvas-fg">
		<div v-if="loading" class="grid h-full place-items-center p-6"><div class="w-full max-w-3xl space-y-4"><DomSkeleton class="h-14 w-full" /><DomSkeleton class="h-96 w-full" /></div></div>

		<div v-else-if="proposal && bootstrap" class="flex h-full min-h-0 flex-col">
			<header class="shrink-0 border-b border-border bg-canvas px-4 py-3">
				<div class="flex items-center justify-between gap-4">
					<div class="min-w-0"><div class="flex items-center gap-2"><h1 class="truncate text-lg font-semibold tracking-tight">Proposal room</h1><DomBadge tone="info">{{ bootstrap.workspace.sentCount }} live</DomBadge></div><p class="truncate text-xs text-muted-fg">{{ bootstrap.workspace.name }} · authoring to client acceptance</p></div>
					<div class="flex shrink-0 items-center gap-2">
						<DomButton class="hidden sm:inline-flex" size="sm" variant="ghost" @click="resetDialogOpen = true">Reset</DomButton>
						<DomButton v-if="proposalIsDraft" size="sm" :variant="proposal.preflight.ready ? 'primary' : 'secondary'" @click="openPrimaryAction">{{ proposal.preflight.ready ? 'Review & send' : blockerLabel }}</DomButton>
						<DomButton v-else-if="proposalIsSent && !proposal.viewedAt" size="sm" @click="viewDialogOpen = true">Record view</DomButton>
						<DomButton v-else-if="proposalIsSent" size="sm" @click="acceptDialogOpen = true">Accept proposal</DomButton>
						<DomButton v-else size="sm" @click="inspectorTab = 'activity'; activeMobileView = 'details'">Receipt</DomButton>
					</div>
				</div>
			</header>

			<div class="shrink-0 border-b border-border min-[1120px]:hidden"><DomTabs v-model="activeMobileView" :tabs="mobileViews" /></div>

			<div v-if="successMessage || errorMessage" class="shrink-0 px-4 pt-3"><DomAlert :tone="errorMessage ? 'danger' : 'success'" variant="soft" :title="errorMessage ? 'Proposal needs attention' : 'Proposal updated'" :description="errorMessage || successMessage" /></div>

			<div class="grid min-h-0 flex-1 min-[1120px]:grid-cols-[17rem_minmax(0,1fr)_22rem]">
				<aside class="min-h-0 flex-col border-r border-border bg-secondary/25" :class="activeMobileView === 'proposals' ? 'flex' : 'hidden min-[1120px]:flex'">
					<div class="shrink-0 space-y-3 border-b border-border p-3"><div class="flex items-center justify-between"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Proposals</p><p class="mt-1 text-sm font-medium">{{ bootstrap.workspace.proposalCount }} in workspace</p></div><DomBadge>{{ bootstrap.workspace.acceptedCount }} accepted</DomBadge></div><DomTextInput v-model="searchQuery" aria-label="Find proposal" placeholder="Title or client" /><DomSelect v-model="lifecycleFilter" label="Lifecycle" :options="bootstrap.options.lifecycles"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div>
					<div class="min-h-0 flex-1 overflow-y-auto"><button v-for="item in filteredProposals" :key="item.id" type="button" class="w-full border-b border-border px-4 py-4 text-left transition hover:bg-secondary" :class="item.id === proposal.id ? 'border-l-2 border-l-primary bg-canvas' : 'border-l-2 border-l-transparent'" @click="selectProposal(item.id)"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="truncate text-sm font-semibold">{{ item.title }}</p><p class="mt-1 truncate text-xs text-muted-fg">{{ item.clientName }}</p></div><DomStatusPill :tone="item.statusTone" size="sm">{{ item.statusLabel }}</DomStatusPill></div><div class="mt-3 flex items-center justify-between text-xs text-muted-fg"><span>{{ item.formattedAmount }}</span><span>rev {{ item.revision }}</span></div></button><DomEmptyState v-if="!filteredProposals.length" title="No proposals" description="Try another lifecycle or search term." /></div>
				</aside>

				<main class="min-h-0 min-w-0 flex-col bg-secondary/20" :class="activeMobileView === 'content' ? 'flex' : 'hidden min-[1120px]:flex'">
					<div class="shrink-0 border-b border-border bg-canvas px-4 py-3"><div class="flex items-start justify-between gap-4"><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><h2 class="truncate text-xl font-semibold tracking-tight">{{ proposal.title }}</h2><DomStatusPill :tone="proposal.statusTone" size="sm">{{ proposal.statusLabel }}</DomStatusPill><DomBadge>rev {{ proposal.revision }}</DomBadge></div><p class="mt-1 truncate text-sm text-muted-fg">{{ proposal.clientName }} · {{ proposal.formattedTotal }} · {{ proposalWordCount }} words</p></div><DomButton size="sm" variant="secondary" @click="inspectorTab = 'commercials'; activeMobileView = 'details'">Commercials</DomButton></div><div class="mt-3 min-w-0 overflow-x-auto"><DomTabs :model-value="activeSectionId" :tabs="sectionTabs" @update:model-value="selectSection" /></div></div>

					<div class="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:p-7">
						<article class="mx-auto min-h-full max-w-3xl border border-border bg-canvas px-5 py-8 shadow-sm sm:px-10 sm:py-10">
							<div class="border-b border-border pb-7"><div class="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><span>Proposal · {{ proposal.clientName }}</span><span>{{ proposal.templateLabel }}</span></div><h3 class="mt-5 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{{ proposal.title }}</h3><p class="mt-4 max-w-2xl text-sm leading-6 text-muted-fg">Prepared by {{ bootstrap.workspace.name }} for a clear path from decision to delivery. Valid for acceptance until {{ proposal.validUntil }}.</p></div>

							<div v-if="activeSection" class="py-8"><div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ activeSection.eyebrow }}</p><p v-if="!proposalIsDraft" class="mt-2 text-2xl font-semibold">{{ activeSection.title }}</p></div><DomStatusPill :tone="activeSection.statusTone">{{ activeSection.statusLabel }}</DomStatusPill></div>
								<div v-if="proposalIsDraft" class="mt-5 grid gap-4"><div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]"><DomTextInput v-model="sectionDraft.title" label="Section title" :errors="fieldErrors.title || []" /><DomSelect v-model="sectionDraft.status" label="Section status" :options="bootstrap.options.sectionStatuses" :errors="fieldErrors.status || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div><DomTextareaInput v-model="sectionDraft.body" label="Client-facing copy" :rows="10" :errors="fieldErrors.body || []" /><div class="flex items-center justify-between border-t border-border pt-4"><p class="text-xs text-muted-fg">{{ activeSection.wordCount }} words · owner {{ activeSection.owner }}</p><DomButton size="sm" :loading="busy" @click="saveSection">Save section</DomButton></div></div>
								<div v-else class="mt-6"><p class="whitespace-pre-line text-base leading-8 text-canvas-fg">{{ activeSection.body }}</p><div class="mt-8 border-y border-border py-4 text-xs text-muted-fg">Approved client copy · {{ activeSection.wordCount }} words · owner {{ activeSection.owner }}</div></div>
							</div>

							<div class="border-t border-border pt-7"><div class="flex items-end justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Investment</p><p class="mt-2 text-sm text-muted-fg">{{ proposal.pricingItems.length }} commercial items</p></div><p class="text-2xl font-semibold">{{ proposal.formattedTotal }}</p></div><div class="mt-5 divide-y divide-border border-y border-border"><div v-for="item in proposal.pricingItems" :key="item.id" class="flex items-start justify-between gap-5 py-4"><div><p class="text-sm font-medium">{{ item.name }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.description }}</p></div><p class="shrink-0 text-sm font-semibold">{{ item.formattedLineTotal }}</p></div></div></div>
						</article>
					</div>
				</main>

				<aside class="min-h-0 flex-col border-l border-border bg-canvas" :class="activeMobileView === 'details' ? 'flex' : 'hidden min-[1120px]:flex'">
					<div class="shrink-0 border-b border-border"><DomTabs v-model="inspectorTab" :tabs="inspectorTabs" /></div>
					<div class="min-h-0 flex-1 overflow-y-auto p-4">
						<div v-if="inspectorTab === 'review'" class="space-y-7">
							<section><div class="flex items-start justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Send readiness</p><p class="mt-2 text-lg font-semibold">{{ proposal.preflight.ready ? 'Ready for client' : blockerLabel }}</p></div><DomBadge :tone="proposal.preflight.ready ? 'success' : 'warning'">{{ proposal.preflight.score }}%</DomBadge></div><div class="mt-4 divide-y divide-border border-y border-border"><div v-for="check in proposal.preflight.checks" :key="check.key" class="py-3"><div class="flex items-center justify-between gap-3"><p class="text-sm font-medium">{{ check.label }}</p><DomStatusPill :tone="check.done ? 'success' : 'warning'" size="sm">{{ check.done ? 'Pass' : 'Block' }}</DomStatusPill></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div></div><DomButton v-if="proposalIsDraft" class="mt-3 w-full" size="sm" variant="secondary" :loading="busy" @click="runPreflight">Run server preflight</DomButton></section>

							<section><div class="flex items-center justify-between"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Review comments</p><DomBadge :tone="openComments.length ? 'warning' : 'success'">{{ openComments.length }} open</DomBadge></div><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="comment in proposal.comments" :key="comment.id" class="py-3"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-medium">{{ comment.anchorLabel }}</p><p class="mt-1 text-xs text-muted-fg">{{ comment.author }} · {{ comment.role }}</p></div><DomStatusPill :tone="comment.statusTone" size="sm">{{ comment.statusLabel }}</DomStatusPill></div><p class="mt-2 text-sm leading-6">{{ comment.body }}</p><p v-if="comment.resolution" class="mt-2 text-xs leading-5 text-success">{{ comment.resolution }}</p><DomButton v-if="proposalIsDraft && comment.state === 'open'" class="mt-3" size="sm" variant="secondary" @click="openResolveDialog(comment)">Resolve comment</DomButton></div></div></section>

							<section><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Required reviewers</p><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="reviewer in proposal.reviewers" :key="reviewer.id" class="flex items-start justify-between gap-4 py-3"><div><p class="text-sm font-medium">{{ reviewer.roleLabel }} · {{ reviewer.name }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ reviewer.note }}</p></div><div class="grid justify-items-end gap-2"><DomStatusPill :tone="reviewer.statusTone" size="sm">{{ reviewer.statusLabel }}</DomStatusPill><DomButton v-if="proposalIsDraft" size="sm" variant="ghost" @click="openReviewerDialog(reviewer)">{{ reviewer.status === 'approved' ? 'Reopen' : 'Approve' }}</DomButton></div></div></div></section>

							<section v-if="proposalIsDraft"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Delivery contract</p><div class="mt-3 grid gap-4"><DomTextInput v-model="settingsDraft.title" label="Proposal title" :errors="fieldErrors.title || []" /><DomTextInput v-model="settingsDraft.clientName" label="Client name" :errors="fieldErrors.clientName || []" /><DomEmailInput v-model="settingsDraft.clientEmail" label="Client email" :errors="fieldErrors.clientEmail || []" /><DomSelect v-model="settingsDraft.template" label="Template" :options="bootstrap.options.templates" :errors="fieldErrors.template || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="settingsDraft.currency" label="Currency" :options="bootstrap.options.currencies" :errors="fieldErrors.currency || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomTextInput v-model="settingsDraft.validUntil" type="date" label="Valid until" :errors="fieldErrors.validUntil || []" /><DomButton size="sm" :loading="busy" @click="saveSettings">Save delivery contract</DomButton></div></section>
						</div>

						<div v-else-if="inspectorTab === 'commercials'" class="space-y-6"><section><div class="flex items-end justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Commercial total</p><p class="mt-2 text-2xl font-semibold">{{ proposal.formattedTotal }}</p></div><DomButton v-if="proposalIsDraft" size="sm" @click="pricingDialogOpen = true">Add item</DomButton></div><div class="mt-4 divide-y divide-border border-y border-border"><div v-for="item in proposal.pricingItems" :key="item.id" class="py-4"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-medium">{{ item.name }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.description }}</p></div><p class="shrink-0 text-sm font-semibold">{{ item.formattedLineTotal }}</p></div><div class="mt-2 flex items-center justify-between text-xs text-muted-fg"><span>{{ item.quantity }} × {{ item.formattedUnitAmount }}</span><DomButton v-if="proposalIsDraft" size="sm" variant="ghost" @click="removePricingItem(item.id)">Remove</DomButton></div></div></div></section><DomAlert tone="info" variant="soft" title="Commercial evidence" description="The send receipt freezes this exact revision, currency, and total for client acceptance." /></div>

						<div v-else class="space-y-7"><section v-if="latestReceipt"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Latest receipt</p><div class="mt-3"><DomJsonViewer :value="latestReceipt" title="Delivery evidence" /></div></section><section v-if="proposalIsSent"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Client delivery</p><div class="mt-3 divide-y divide-border border-y border-border"><div class="py-3"><p class="text-sm font-medium">Sent</p><p class="mt-1 text-xs text-muted-fg">{{ formatTime(proposal.sentAt) }} · {{ proposal.clientEmail }}</p></div><div class="py-3"><p class="text-sm font-medium">Client views</p><p class="mt-1 text-xs text-muted-fg">{{ proposal.viewCount }} {{ proposal.viewCount === 1 ? 'view' : 'views' }} · first {{ formatTime(proposal.viewedAt) }}</p></div></div></section><section v-if="proposalIsAccepted"><DomAlert tone="success" variant="soft" title="Client accepted" :description="`${proposal.acceptedBy} accepted ${proposal.formattedTotal} on ${formatTime(proposal.acceptedAt)}.`" /></section><section><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Immutable activity</p><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="event in proposal.events" :key="event.id" class="py-3"><div class="flex items-start justify-between gap-3"><p class="text-sm font-medium">{{ event.title }}</p><span class="shrink-0 text-[11px] text-muted-fg">{{ formatTime(event.createdAt) }}</span></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p><p class="mt-1 text-[11px] text-muted-fg">{{ event.actor }}</p></div></div></section></div>
					</div>
				</aside>
			</div>

			<DomDialog v-model="resolveDialogOpen" title="Resolve review comment" :description="activeComment?.anchorLabel || ''"><DomTextareaInput v-model="resolveDraft.resolution" label="Resolution evidence" :rows="4" :errors="fieldErrors.resolution || []" /><template #footer><DomButton variant="secondary" data-close>Keep open</DomButton><DomButton :loading="busy" @click="resolveComment">Resolve comment</DomButton></template></DomDialog>

			<DomDialog v-model="reviewerDialogOpen" :title="reviewerDraft.decision === 'approved' ? `Approve ${activeReviewer?.roleLabel || 'review'}` : `Reopen ${activeReviewer?.roleLabel || 'review'}`" :description="activeReviewer ? `${activeReviewer.name} · exact proposal revision ${proposal.revision}` : ''"><DomTextareaInput v-model="reviewerDraft.note" label="Decision evidence" :rows="4" :errors="fieldErrors.note || []" /><template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :variant="reviewerDraft.decision === 'approved' ? 'primary' : 'danger'" :loading="busy" @click="decideReviewer">{{ reviewerDraft.decision === 'approved' ? 'Record approval' : 'Reopen approval' }}</DomButton></template></DomDialog>

			<DomDialog v-model="pricingDialogOpen" title="Add commercial line item" description="The server validates minor-unit amounts and recalculates the client total."><div class="grid gap-4"><DomTextInput v-model="pricingDraft.name" label="Item name" :errors="fieldErrors.name || []" /><DomTextareaInput v-model="pricingDraft.description" label="Description" :rows="3" :errors="fieldErrors.description || []" /><div class="grid gap-4 sm:grid-cols-2"><DomTextInput v-model="pricingDraft.quantity" type="number" label="Quantity" :errors="fieldErrors.quantity || []" /><DomTextInput v-model="pricingDraft.unitAmount" type="number" label="Unit amount · minor units" :errors="fieldErrors.unitAmount || []" /></div></div><template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :loading="busy" @click="addPricingItem">Add item</DomButton></template></DomDialog>

			<DomDialog v-model="sendDialogOpen" title="Send proposal to the client?" :description="`${proposal.clientName} · ${proposal.clientEmail} · ${proposal.formattedTotal}`"><DomAlert :tone="proposal.preflight.ready ? 'success' : 'warning'" variant="soft" :title="proposal.preflight.ready ? 'Server preflight is ready' : 'Blocking checks remain'" :description="`${proposal.preflight.passed} of ${proposal.preflight.total} checks pass at revision ${proposal.revision}.`" /><div class="mt-4 divide-y divide-border border-y border-border"><div v-for="check in proposal.preflight.checks" :key="check.key" class="flex items-center justify-between gap-3 py-3"><p class="text-sm">{{ check.label }}</p><DomStatusPill :tone="check.done ? 'success' : 'warning'" size="sm">{{ check.done ? 'Pass' : 'Block' }}</DomStatusPill></div></div><div class="mt-4"><DomCheckbox v-model="sendAcknowledged" label="I verified the client, content, approvals, and commercials" description="Sending freezes this proposal revision and creates a live client URL." :errors="fieldErrors.acknowledged || []" /></div><template #footer><DomButton variant="secondary" data-close>Keep draft</DomButton><DomButton :disabled="!proposal.preflight.ready" :loading="busy" @click="sendProposal">Send proposal</DomButton></template></DomDialog>

			<DomDialog v-model="viewDialogOpen" title="Record a client view?" description="This deterministic callback represents the client opening the delivered proposal."><DomAlert tone="info" variant="soft" title="Demo client callback" description="No tracking pixel or personal device data is collected. Only time, recipient, and view count are stored." /><div class="mt-4 border-y border-border py-4"><DomCheckbox v-model="viewAcknowledged" label="Accept the deterministic client-view callback" description="The proposal remains awaiting client acceptance." :errors="fieldErrors.acknowledged || []" /></div><template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :loading="busy" @click="recordClientView">Record view</DomButton></template></DomDialog>

			<DomDialog v-model="acceptDialogOpen" title="Accept this proposal?" description="Create immutable evidence for the client, commercial total, and frozen proposal revision."><DomTextInput v-model="acceptDraft.signerName" label="Accepting client" :errors="fieldErrors.signerName || []" /><div class="mt-4 border-y border-border py-4"><DomCheckbox v-model="acceptDraft.acknowledged" label="Accept the deterministic client-acceptance callback" description="This records client acceptance without collecting a signature image." :errors="fieldErrors.acknowledged || []" /></div><template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :loading="busy" @click="acceptProposal">Record acceptance</DomButton></template></DomDialog>

			<DomDialog v-model="resetDialogOpen" title="Reset proposal room?" description="This clears process-local edits, approvals, delivery callbacks, and receipts, then restores the seeded workspace."><template #footer><DomButton variant="secondary" data-close>Keep workspace</DomButton><DomButton variant="danger" :loading="busy" @click="resetWorkspace">Reset demo</DomButton></template></DomDialog>
		</div>

		<DomEmptyState v-else class="h-full" title="Proposal workspace unavailable" description="Reload the preview to retry the repository-local bootstrap API." />
	</div>
</template>
