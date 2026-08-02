<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomEmptyState,
	DomJsonViewer,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextDiff,
	DomTextInput,
} from '@getdom/studio/vue';

const mobileViews = [
	{ key: 'documents', label: 'Documents' },
	{ key: 'contract', label: 'Contract' },
	{ key: 'review', label: 'Review' },
];

const inspectorTabs = [
	{ key: 'findings', label: 'Findings' },
	{ key: 'approvals', label: 'Approvals' },
	{ key: 'evidence', label: 'Evidence' },
];

const bootstrap = ref(null);
const document = ref(null);
const loading = ref(true);
const busy = ref(false);
const activeDocumentId = ref('');
const activeSectionId = ref('');
const activeFindingId = ref('');
const activeMobileView = ref('contract');
const inspectorTab = ref('findings');
const searchQuery = ref('');
const lifecycleFilter = ref('all');
const findingTypeFilter = ref('all');
const successMessage = ref('');
const errorMessage = ref('');
const fieldErrors = ref({});
const latestReceipt = ref(null);
const decisionDialogOpen = ref(false);
const reviewerDialogOpen = ref(false);
const analysisDialogOpen = ref(false);
const releaseDialogOpen = ref(false);
const resetDialogOpen = ref(false);
const selectedReviewerId = ref('');
const analysisAcknowledged = ref(false);
const releaseAcknowledged = ref(false);

const decisionDraft = reactive({ decision: 'accepted', note: '', acknowledgedHighRisk: false });
const reviewerDraft = reactive({ decision: 'approved', note: '' });
const settingsDraft = reactive({ title: '', counterparty: '', policyPack: '', jurisdiction: '' });

const documentIsReleased = computed(() => document.value?.status === 'released');
const documentIsReady = computed(() => document.value?.status === 'ready');
const blockerCount = computed(() => document.value ? document.value.preflight.total - document.value.preflight.passed : 0);
const blockerLabel = computed(() => `${blockerCount.value} ${blockerCount.value === 1 ? 'gate' : 'gates'}`);
const pendingFindings = computed(() => document.value?.findings.filter((finding) => finding.state === 'pending') || []);
const activeSection = computed(() => document.value?.sections.find((section) => section.id === activeSectionId.value) || document.value?.sections[0] || null);
const activeFinding = computed(() => document.value?.findings.find((finding) => finding.id === activeFindingId.value) || document.value?.findings[0] || null);
const activeReviewer = computed(() => document.value?.reviewers.find((reviewer) => reviewer.id === selectedReviewerId.value) || null);
const sectionTabs = computed(() => document.value?.sections.map((section) => ({ key: section.id, label: `${section.number}. ${section.title}` })) || []);
const sectionFindings = computed(() => document.value?.findings.filter((finding) => finding.sectionId === activeSectionId.value) || []);
const visibleFindings = computed(() => document.value?.findings.filter((finding) => findingTypeFilter.value === 'all' || finding.type === findingTypeFilter.value) || []);
const filteredDocuments = computed(() => {
	if (!bootstrap.value) return [];
	const query = searchQuery.value.trim().toLowerCase();
	return bootstrap.value.documents.filter((item) => {
		const matchesLifecycle = lifecycleFilter.value === 'all' || item.status === lifecycleFilter.value;
		const matchesQuery = !query || `${item.title} ${item.counterparty}`.toLowerCase().includes(query);
		return matchesLifecycle && matchesQuery;
	});
});

watch(visibleFindings, syncVisibleFinding);

/**
 * Requests JSON and preserves structured API errors for the review UI.
 *
 * @param {string} url Request URL.
 * @param {RequestInit & { body?: Record<string, unknown> }} options Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed API response.
 */
async function requestJson(url, options = {}) {
	const request = { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } };
	if (request.body && typeof request.body !== 'string') request.body = JSON.stringify(request.body);
	const response = await fetch(url, request);
	const payload = await response.json();
	if (!response.ok || payload.error) {
		const error = new Error(payload.message || 'The document review request failed.');
		error.payload = payload;
		throw error;
	}
	return payload;
}

/**
 * Loads the seeded contract-review workspace from the repository-local API.
 *
 * @returns {Promise<void>}
 */
async function loadWorkspace() {
	loading.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/ai-document-review/bootstrap');
		bootstrap.value = result;
		activeDocumentId.value = result.defaultDocumentId;
		applyPayload(result, { sectionId: result.selectedSectionId, findingId: result.selectedFindingId });
	} catch (error) {
		handleRequestError(error);
	} finally {
		loading.value = false;
	}
}

/**
 * Loads one document from the server-backed review queue.
 *
 * @param {string} documentId Document identifier.
 * @returns {Promise<void>}
 */
async function selectDocument(documentId) {
	if (busy.value || documentId === activeDocumentId.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/ai-document-review/documents/${documentId}`);
		activeDocumentId.value = documentId;
		applyPayload(result, { sectionId: result.selectedSectionId, findingId: result.selectedFindingId });
		activeMobileView.value = 'contract';
		inspectorTab.value = result.document.status === 'released' ? 'evidence' : 'findings';
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Applies an API payload and keeps document, queue, selection, and drafts synchronized.
 *
 * @param {Record<string, unknown>} result Review API payload.
 * @param {{ sectionId?: string, findingId?: string }} selection Selection hints.
 * @returns {void}
 */
function applyPayload(result, selection = {}) {
	if (result.workspace && bootstrap.value) bootstrap.value.workspace = result.workspace;
	if (result.documents && bootstrap.value) bootstrap.value.documents = result.documents;
	if (result.document) document.value = result.document;
	if (!document.value) return;
	activeDocumentId.value = document.value.id;
	const requestedSection = selection.sectionId || activeSectionId.value;
	activeSectionId.value = document.value.sections.some((section) => section.id === requestedSection) ? requestedSection : document.value.sections[0]?.id || '';
	const requestedFinding = selection.findingId || activeFindingId.value;
	activeFindingId.value = document.value.findings.some((finding) => finding.id === requestedFinding) ? requestedFinding : document.value.findings.find((finding) => finding.state === 'pending')?.id || document.value.findings[0]?.id || '';
	latestReceipt.value = result.receipt || document.value.latestReceipt || document.value.releaseReceipt || null;
	syncSettingsDraft();
}

/**
 * Copies the server-owned document settings into editable controls.
 *
 * @returns {void}
 */
function syncSettingsDraft() {
	if (!document.value) return;
	Object.assign(settingsDraft, {
		title: document.value.title,
		counterparty: document.value.counterparty,
		policyPack: document.value.policyPack,
		jurisdiction: document.value.jurisdiction,
	});
}

/**
 * Keeps the active finding inside the selected finding-type filter.
 *
 * @param {Array<Record<string, unknown>>} findings Visible findings.
 * @returns {void}
 */
function syncVisibleFinding(findings) {
	if (!findings.length) return;
	if (!findings.some((finding) => finding.id === activeFindingId.value)) selectFinding(findings[0]);
}

/**
 * Selects a document clause and its first anchored finding.
 *
 * @param {string} sectionId Section identifier.
 * @returns {void}
 */
function selectSection(sectionId) {
	activeSectionId.value = sectionId;
	const firstFinding = document.value?.findings.find((finding) => finding.sectionId === sectionId);
	if (firstFinding) activeFindingId.value = firstFinding.id;
}

/**
 * Selects a finding and synchronizes the contract clause in view.
 *
 * @param {Record<string, unknown>} finding Finding record.
 * @returns {void}
 */
function selectFinding(finding) {
	activeFindingId.value = finding.id;
	activeSectionId.value = finding.sectionId;
}

/**
 * Runs a review mutation with shared feedback and conflict recovery.
 *
 * @param {string} url Request URL.
 * @param {RequestInit & { body?: Record<string, unknown> }} options Request options.
 * @param {string} success Success fallback.
 * @param {{ sectionId?: string, findingId?: string }} selection Selection hints.
 * @returns {Promise<Record<string, unknown> | null>} Mutation result.
 */
async function runMutation(url, options, success, selection = {}) {
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(url, options);
		applyPayload(result, selection);
		successMessage.value = result.message || success;
		return result;
	} catch (error) {
		handleRequestError(error);
		return null;
	} finally {
		busy.value = false;
	}
}

/**
 * Opens the human decision dialog for accept or dismiss.
 *
 * @param {'accepted'|'dismissed'} decision Requested decision.
 * @returns {void}
 */
function openDecisionDialog(decision) {
	decisionDraft.decision = decision;
	decisionDraft.note = '';
	decisionDraft.acknowledgedHighRisk = false;
	fieldErrors.value = {};
	decisionDialogOpen.value = true;
}

/**
 * Records a human finding decision at the exact review revision.
 *
 * @returns {Promise<void>}
 */
async function decideFinding() {
	if (!activeFinding.value) return;
	const findingId = activeFinding.value.id;
	const result = await runMutation(`/api/block-demos/ai-document-review/documents/${document.value.id}/findings/${findingId}/decision`, {
		method: 'POST',
		body: { revision: document.value.revision, ...decisionDraft },
	}, decisionDraft.decision === 'accepted' ? 'Finding accepted.' : 'Finding dismissed.', { findingId });
	if (result) decisionDialogOpen.value = false;
}

/**
 * Opens one required reviewer decision dialog.
 *
 * @param {Record<string, unknown>} reviewer Reviewer record.
 * @returns {void}
 */
function openReviewerDialog(reviewer) {
	selectedReviewerId.value = reviewer.id;
	reviewerDraft.decision = reviewer.status === 'approved' ? 'pending' : 'approved';
	reviewerDraft.note = reviewer.status === 'approved' ? 'Reopened for additional document review.' : '';
	fieldErrors.value = {};
	reviewerDialogOpen.value = true;
}

/**
 * Records or reopens one reviewer gate.
 *
 * @returns {Promise<void>}
 */
async function decideReviewer() {
	if (!activeReviewer.value) return;
	const result = await runMutation(`/api/block-demos/ai-document-review/documents/${document.value.id}/reviewers/${activeReviewer.value.id}/decision`, {
		method: 'POST',
		body: { revision: document.value.revision, ...reviewerDraft },
	}, 'Reviewer decision recorded.');
	if (result) reviewerDialogOpen.value = false;
}

/**
 * Persists document metadata and analysis policy inputs.
 *
 * @returns {Promise<void>}
 */
async function saveSettings() {
	await runMutation(`/api/block-demos/ai-document-review/documents/${document.value.id}/settings`, {
		method: 'PATCH',
		body: { revision: document.value.revision, ...settingsDraft },
	}, 'Document settings saved.');
}

/**
 * Runs a fresh deterministic analysis after explicit acknowledgement.
 *
 * @returns {Promise<void>}
 */
async function runAnalysis() {
	const result = await runMutation(`/api/block-demos/ai-document-review/documents/${document.value.id}/analysis`, {
		method: 'POST',
		body: { revision: document.value.revision, acknowledged: analysisAcknowledged.value },
	}, 'Fresh analysis completed.');
	if (result) {
		analysisDialogOpen.value = false;
		analysisAcknowledged.value = false;
		inspectorTab.value = 'findings';
	}
}

/**
 * Refreshes authoritative release gates from the server.
 *
 * @returns {Promise<void>}
 */
async function runPreflight() {
	await runMutation(`/api/block-demos/ai-document-review/documents/${document.value.id}/preflight`, { method: 'POST' }, 'Release gates refreshed.');
}

/**
 * Releases the reviewed document and stores immutable evidence.
 *
 * @returns {Promise<void>}
 */
async function releaseDocument() {
	const result = await runMutation(`/api/block-demos/ai-document-review/documents/${document.value.id}/release`, {
		method: 'POST',
		body: { revision: document.value.revision, acknowledged: releaseAcknowledged.value },
	}, 'Reviewed document released.');
	if (result) {
		releaseDialogOpen.value = false;
		releaseAcknowledged.value = false;
		inspectorTab.value = 'evidence';
		activeMobileView.value = 'review';
	}
}

/**
 * Creates a deterministic redline export receipt.
 *
 * @returns {Promise<void>}
 */
async function exportRedline() {
	const result = await runMutation(`/api/block-demos/ai-document-review/documents/${document.value.id}/export`, {
		method: 'POST',
		body: { revision: document.value.revision },
	}, 'Redline export created.');
	if (result) {
		inspectorTab.value = 'evidence';
		activeMobileView.value = 'review';
	}
}

/**
 * Restores the seeded review queue after explicit confirmation.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	const result = await runMutation('/api/block-demos/ai-document-review/reset', { method: 'POST' }, 'Review workspace reset.');
	if (result) {
		resetDialogOpen.value = false;
		findingTypeFilter.value = 'all';
		inspectorTab.value = 'findings';
		activeMobileView.value = 'contract';
	}
}

/**
 * Routes the header action to stale analysis, review gates, release, or export.
 *
 * @returns {void}
 */
function openPrimaryAction() {
	if (document.value.analysisStatus !== 'complete' || document.value.analysisRevision !== document.value.sourceRevision) {
		analysisAcknowledged.value = false;
		analysisDialogOpen.value = true;
		return;
	}
	if (documentIsReady.value) {
		releaseAcknowledged.value = false;
		releaseDialogOpen.value = true;
		return;
	}
	if (documentIsReleased.value) {
		exportRedline();
		return;
	}
	inspectorTab.value = pendingFindings.value.length ? 'findings' : 'approvals';
	activeMobileView.value = 'review';
}

/**
 * Applies structured API errors and current conflict payloads.
 *
 * @param {Error & { payload?: Record<string, unknown> }} error Request error.
 * @returns {void}
 */
function handleRequestError(error) {
	const payload = error.payload || {};
	errorMessage.value = payload.message || error.message || 'The document review request failed.';
	fieldErrors.value = Object.fromEntries((payload.fields || []).map((field) => [field.field, [field]]));
	if (payload.document) applyPayload(payload, { sectionId: activeSectionId.value, findingId: activeFindingId.value });
}

/**
 * Clears success, error, and field-level review feedback.
 *
 * @returns {void}
 */
function clearFeedback() {
	successMessage.value = '';
	errorMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Formats an ISO timestamp for compact review activity.
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
		<div v-if="loading" class="grid h-full place-items-center p-6"><div class="w-full max-w-4xl space-y-4"><DomSkeleton class="h-14 w-full" /><DomSkeleton class="h-96 w-full" /></div></div>

		<div v-else-if="document && bootstrap" class="flex h-full min-h-0 flex-col">
			<header class="shrink-0 border-b border-border bg-canvas px-4 py-3">
				<div class="flex items-center justify-between gap-4">
					<div class="min-w-0"><div class="flex items-center gap-2"><h1 class="truncate text-lg font-semibold tracking-tight">Contract review</h1><DomBadge tone="info">{{ bootstrap.workspace.inReviewCount }} active</DomBadge></div><p class="truncate text-xs text-muted-fg">{{ bootstrap.workspace.name }} · cited AI to human release</p></div>
					<div class="flex shrink-0 items-center gap-2"><DomButton class="hidden sm:inline-flex" size="sm" variant="ghost" @click="resetDialogOpen = true">Reset</DomButton><DomButton size="sm" :variant="documentIsReady || documentIsReleased ? 'primary' : 'secondary'" :loading="busy" @click="openPrimaryAction">{{ documentIsReleased ? 'Export redline' : documentIsReady ? 'Release review' : document.analysisStatus !== 'complete' || document.analysisRevision !== document.sourceRevision ? 'Run analysis' : blockerLabel }}</DomButton></div>
				</div>
			</header>

			<div class="shrink-0 border-b border-border min-[1120px]:hidden"><DomTabs v-model="activeMobileView" :tabs="mobileViews" /></div>
			<div v-if="successMessage || errorMessage" class="shrink-0 px-4 pt-3"><DomAlert :tone="errorMessage ? 'danger' : 'success'" variant="soft" :title="errorMessage ? 'Review needs attention' : 'Review updated'" :description="errorMessage || successMessage" /></div>

			<div class="grid min-h-0 flex-1 min-[1120px]:grid-cols-[16rem_minmax(0,1fr)_23rem]">
				<aside class="min-h-0 flex-col border-r border-border bg-secondary/25" :class="activeMobileView === 'documents' ? 'flex' : 'hidden min-[1120px]:flex'">
					<div class="shrink-0 space-y-3 border-b border-border p-3"><div class="flex items-center justify-between"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Review queue</p><p class="mt-1 text-sm font-medium">{{ bootstrap.workspace.documentCount }} documents</p></div><DomBadge>{{ bootstrap.workspace.releasedCount }} released</DomBadge></div><DomTextInput v-model="searchQuery" aria-label="Find document" placeholder="Title or counterparty" /><DomSelect v-model="lifecycleFilter" label="Lifecycle" :options="bootstrap.options.lifecycles"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div>
					<div class="min-h-0 flex-1 overflow-y-auto"><button v-for="item in filteredDocuments" :key="item.id" type="button" class="w-full border-b border-border px-4 py-4 text-left transition hover:bg-secondary" :class="item.id === document.id ? 'border-l-2 border-l-primary bg-canvas' : 'border-l-2 border-l-transparent'" @click="selectDocument(item.id)"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="truncate text-sm font-semibold">{{ item.title }}</p><p class="mt-1 truncate text-xs text-muted-fg">{{ item.counterparty }}</p></div><DomStatusPill :tone="item.statusTone" size="sm">{{ item.statusLabel }}</DomStatusPill></div><div class="mt-3 flex items-center justify-between text-xs text-muted-fg"><span>{{ item.pendingCount }} pending</span><span>{{ item.readinessScore }}% · rev {{ item.revision }}</span></div></button><DomEmptyState v-if="!filteredDocuments.length" title="No documents" description="Try another lifecycle or search term." /></div>
				</aside>

				<main class="min-h-0 min-w-0 flex-col bg-secondary/20" :class="activeMobileView === 'contract' ? 'flex' : 'hidden min-[1120px]:flex'">
					<div class="shrink-0 border-b border-border bg-canvas px-4 py-3"><div class="flex items-start justify-between gap-4"><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><h2 class="truncate text-xl font-semibold tracking-tight">{{ document.title }}</h2><DomStatusPill :tone="document.statusTone" size="sm">{{ document.statusLabel }}</DomStatusPill><DomBadge>rev {{ document.revision }}</DomBadge></div><p class="mt-1 truncate text-sm text-muted-fg">{{ document.counterparty }} · source v{{ document.sourceVersion }} · {{ document.policyPackLabel }}</p></div><DomButton size="sm" variant="secondary" @click="inspectorTab = 'approvals'; activeMobileView = 'review'">Release gates</DomButton></div><div class="mt-3 min-w-0 overflow-x-auto"><DomTabs :model-value="activeSectionId" :tabs="sectionTabs" @update:model-value="selectSection" /></div></div>

					<div class="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:p-7">
						<article v-if="activeSection" class="mx-auto min-h-full max-w-3xl border border-border bg-canvas px-5 py-8 shadow-sm sm:px-9 sm:py-10">
							<div class="border-b border-border pb-7"><div class="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-fg"><span>Contract clause · {{ activeSection.number }} of {{ document.sections.length }}</span><span>Clause v{{ activeSection.version }}</span></div><p class="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{{ activeSection.eyebrow }}</p><h3 class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{{ activeSection.title }}</h3><p class="mt-5 whitespace-pre-line text-base leading-8">{{ activeSection.body }}</p></div>
							<section class="pt-7"><div class="flex items-center justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Anchored findings</p><p class="mt-2 text-sm text-muted-fg">Each recommendation keeps its source, policy citation, model, and human outcome.</p></div><DomBadge :tone="activeSection.pendingCount ? 'warning' : 'success'">{{ activeSection.pendingCount }} pending</DomBadge></div><div v-if="sectionFindings.length" class="mt-5 divide-y divide-border border-y border-border"><button v-for="finding in sectionFindings" :key="finding.id" type="button" class="flex w-full items-start justify-between gap-4 py-4 text-left" @click="selectFinding(finding); inspectorTab = 'findings'; activeMobileView = 'review'"><div><p class="text-sm font-medium">{{ finding.label }}</p><p class="mt-1 text-xs text-muted-fg">{{ finding.citation }} · {{ finding.confidence }}% confidence</p></div><div class="flex shrink-0 items-center gap-2"><DomStatusPill :tone="finding.severityTone" size="sm">{{ finding.severityLabel }}</DomStatusPill><DomStatusPill :tone="finding.stateTone" size="sm">{{ finding.stateLabel }}</DomStatusPill></div></button></div><DomEmptyState v-else title="No findings in this clause" description="The analysis did not identify a policy or clarity issue here." /></section>
							<footer class="mt-8 border-t border-border pt-5 text-xs leading-5 text-muted-fg"><span class="font-medium text-canvas-fg">Analysis provenance:</span> {{ document.analysisId }} · {{ document.analysisModel }} · {{ document.promptVersion }} · source {{ document.sourceHash }}</footer>
						</article>
					</div>
				</main>

				<aside class="min-h-0 flex-col border-l border-border bg-canvas" :class="activeMobileView === 'review' ? 'flex' : 'hidden min-[1120px]:flex'">
					<div class="shrink-0 border-b border-border"><DomTabs v-model="inspectorTab" :tabs="inspectorTabs" /></div>
					<div class="min-h-0 flex-1 overflow-y-auto p-4">
						<div v-if="inspectorTab === 'findings'" class="space-y-5">
							<div class="flex items-end justify-between gap-3"><DomSelect v-model="findingTypeFilter" class="min-w-0 flex-1" label="Finding type" :options="bootstrap.options.findingTypes"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomBadge :tone="pendingFindings.length ? 'warning' : 'success'">{{ pendingFindings.length }} pending</DomBadge></div>
							<div class="divide-y divide-border border-y border-border"><button v-for="finding in visibleFindings" :key="finding.id" type="button" class="w-full py-3 text-left" :class="finding.id === activeFindingId ? 'text-primary' : ''" @click="selectFinding(finding)"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-medium">{{ finding.label }}</p><p class="mt-1 text-xs text-muted-fg">{{ finding.typeLabel }} · {{ finding.confidence }}%</p></div><DomStatusPill :tone="finding.stateTone" size="sm">{{ finding.stateLabel }}</DomStatusPill></div></button></div>
							<section v-if="activeFinding" class="border-y border-border py-4"><div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Active finding</p><h3 class="mt-2 text-lg font-semibold">{{ activeFinding.label }}</h3></div><DomStatusPill :tone="activeFinding.severityTone">{{ activeFinding.severityLabel }}</DomStatusPill></div><p class="mt-3 text-sm leading-6 text-muted-fg">{{ activeFinding.rationale }}</p><p class="mt-3 text-xs font-medium text-primary">{{ activeFinding.citation }}</p><div class="mt-4"><DomTextDiff :original="activeFinding.source" :proposed="activeFinding.proposed" original-label="Current clause" proposed-label="AI proposal" view="inline" format="text" /></div><div v-if="activeFinding.decisionNote" class="mt-4 border-l-2 border-primary pl-3"><p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Human evidence</p><p class="mt-1 text-sm leading-6">{{ activeFinding.decisionNote }}</p><p class="mt-1 text-xs text-muted-fg">{{ activeFinding.decidedBy }} · {{ formatTime(activeFinding.decidedAt) }}</p></div><div v-if="activeFinding.state === 'pending' && !documentIsReleased" class="mt-4 grid grid-cols-2 gap-2"><DomButton variant="secondary" @click="openDecisionDialog('dismissed')">Dismiss</DomButton><DomButton @click="openDecisionDialog('accepted')">Accept patch</DomButton></div></section>
						</div>

						<div v-else-if="inspectorTab === 'approvals'" class="space-y-7">
							<section><div class="flex items-start justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Release readiness</p><p class="mt-2 text-lg font-semibold">{{ document.preflight.ready ? 'Ready to release' : blockerLabel }}</p></div><DomBadge :tone="document.preflight.ready ? 'success' : 'warning'">{{ document.preflight.score }}%</DomBadge></div><div class="mt-4 divide-y divide-border border-y border-border"><div v-for="check in document.preflight.checks" :key="check.key" class="py-3"><div class="flex items-start justify-between gap-3"><p class="text-sm font-medium">{{ check.label }}</p><DomStatusPill :tone="check.done ? 'success' : 'warning'" size="sm">{{ check.done ? 'Pass' : 'Block' }}</DomStatusPill></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div></div><DomButton v-if="!documentIsReleased" class="mt-3 w-full" size="sm" variant="secondary" :loading="busy" @click="runPreflight">Run server preflight</DomButton></section>
							<section><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Required reviewers</p><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="reviewer in document.reviewers" :key="reviewer.id" class="flex items-start justify-between gap-4 py-3"><div><p class="text-sm font-medium">{{ reviewer.roleLabel }} · {{ reviewer.name }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ reviewer.note }}</p></div><div class="grid justify-items-end gap-2"><DomStatusPill :tone="reviewer.statusTone" size="sm">{{ reviewer.statusLabel }}</DomStatusPill><DomButton v-if="!documentIsReleased" size="sm" variant="ghost" @click="openReviewerDialog(reviewer)">{{ reviewer.status === 'approved' ? 'Reopen' : 'Approve' }}</DomButton></div></div></div></section>
							<section v-if="!documentIsReleased"><div class="flex items-center justify-between gap-3"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Review contract</p><DomButton size="sm" variant="ghost" @click="analysisAcknowledged = false; analysisDialogOpen = true">Run analysis</DomButton></div><div class="mt-3 grid gap-4"><DomTextInput v-model="settingsDraft.title" label="Document title" :errors="fieldErrors.title || []" /><DomTextInput v-model="settingsDraft.counterparty" label="Counterparty" :errors="fieldErrors.counterparty || []" /><DomSelect v-model="settingsDraft.policyPack" label="Policy pack" :options="bootstrap.options.policyPacks" :errors="fieldErrors.policyPack || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="settingsDraft.jurisdiction" label="Jurisdiction" :options="bootstrap.options.jurisdictions" :errors="fieldErrors.jurisdiction || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomButton size="sm" :loading="busy" @click="saveSettings">Save review contract</DomButton></div></section>
						</div>

						<div v-else class="space-y-7"><section v-if="latestReceipt"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Latest receipt</p><div class="mt-3"><DomJsonViewer :value="latestReceipt" title="Review evidence" /></div></section><section><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Analysis provenance</p><div class="mt-3 divide-y divide-border border-y border-border text-sm"><div class="py-3"><p class="font-medium">Analysis</p><p class="mt-1 text-xs text-muted-fg">{{ document.analysisId }} · {{ document.analysisModel }}</p></div><div class="py-3"><p class="font-medium">Prompt and source</p><p class="mt-1 break-all text-xs text-muted-fg">{{ document.promptVersion }} · {{ document.sourceHash }}</p></div><div class="py-3"><p class="font-medium">Policy contract</p><p class="mt-1 text-xs text-muted-fg">{{ document.policyPackLabel }} · {{ document.jurisdictionLabel }}</p></div></div></section><section><div class="flex items-center justify-between gap-3"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Immutable activity</p><DomButton size="sm" variant="ghost" :loading="busy" @click="exportRedline">Export redline</DomButton></div><div class="mt-3 divide-y divide-border border-y border-border"><div v-for="event in document.events" :key="event.id" class="py-3"><div class="flex items-start justify-between gap-3"><p class="text-sm font-medium">{{ event.title }}</p><span class="shrink-0 text-[11px] text-muted-fg">{{ formatTime(event.createdAt) }}</span></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p><p class="mt-1 text-[11px] text-muted-fg">{{ event.actor }}</p></div></div></section></div>
					</div>
				</aside>
			</div>

			<DomDialog v-model="decisionDialogOpen" :title="decisionDraft.decision === 'accepted' ? 'Accept AI clause patch?' : 'Dismiss this finding?'" :description="activeFinding ? `${activeFinding.label} · ${activeFinding.citation}` : ''"><div class="grid gap-4"><DomTextareaInput v-model="decisionDraft.note" label="Human decision evidence" :rows="4" :errors="fieldErrors.note || []" /><DomCheckbox v-if="activeFinding?.severity === 'high' && decisionDraft.decision === 'accepted'" v-model="decisionDraft.acknowledgedHighRisk" :errors="fieldErrors.acknowledgedHighRisk || []" label="I reviewed this high-risk replacement against the signed terms" description="The source clause is patched only after this explicit acknowledgement." /></div><template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :variant="decisionDraft.decision === 'accepted' ? 'primary' : 'secondary'" :loading="busy" @click="decideFinding">{{ decisionDraft.decision === 'accepted' ? 'Accept patch' : 'Record dismissal' }}</DomButton></template></DomDialog>

			<DomDialog v-model="reviewerDialogOpen" :title="reviewerDraft.decision === 'approved' ? `Approve ${activeReviewer?.roleLabel || 'review'}?` : `Reopen ${activeReviewer?.roleLabel || 'review'}?`" :description="activeReviewer ? `${activeReviewer.name} · exact review revision ${document.revision}` : ''"><DomTextareaInput v-model="reviewerDraft.note" label="Reviewer evidence" :rows="4" :errors="fieldErrors.note || []" /><template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :variant="reviewerDraft.decision === 'approved' ? 'primary' : 'danger'" :loading="busy" @click="decideReviewer">{{ reviewerDraft.decision === 'approved' ? 'Record approval' : 'Reopen review' }}</DomButton></template></DomDialog>

			<DomDialog v-model="analysisDialogOpen" title="Run a fresh AI analysis?" description="Replace current findings with a deterministic pass over this exact source revision and policy contract."><DomCheckbox v-model="analysisAcknowledged" :errors="fieldErrors.acknowledged || []" label="Replace the current finding set" description="Human decisions remain in the activity stream, but the active findings return to pending." /><template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :loading="busy" @click="runAnalysis">Run analysis</DomButton></template></DomDialog>

			<DomDialog v-model="releaseDialogOpen" title="Release this reviewed version?" :description="`Freeze source v${document.sourceVersion}, ${document.findings.length} human decisions, and ${document.reviewers.filter((reviewer) => reviewer.required).length} required approvals.`"><DomCheckbox v-model="releaseAcknowledged" :errors="fieldErrors.acknowledged || []" label="I verified the source, AI findings, and reviewer evidence" description="Release creates an immutable receipt and locks further review mutations." /><template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :loading="busy" @click="releaseDocument">Release reviewed version</DomButton></template></DomDialog>

			<DomDialog v-model="resetDialogOpen" title="Reset the review workspace?" description="Restore the three seeded lifecycle examples and discard this process-local demo session."><template #footer><DomButton variant="secondary" data-close>Keep workspace</DomButton><DomButton variant="danger" :loading="busy" @click="resetWorkspace">Reset workspace</DomButton></template></DomDialog>
		</div>
	</div>
</template>
