<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
	DomAlert,
	DomAppBottomNav,
	DomAppShell,
	DomAppTopBar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomEmptyState,
	DomProgress,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/content-moderation';
const caseTabs = [
	{ key: 'content', label: 'Content' },
	{ key: 'context', label: 'Context' },
	{ key: 'audit', label: 'Audit' },
];

const workspace = ref(null);
const cases = ref([]);
const selectedCase = ref(null);
const catalogs = ref({ statuses: [], queues: [], actions: [], policies: [], appealActions: [] });
const loading = ref(true);
const caseLoading = ref(false);
const busyAction = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const fieldErrors = ref({});
const activeView = ref('case');
const caseTab = ref('content');
const statusFilter = ref('all');
const queueFilter = ref('all');
const searchQuery = ref('');
const noteDraft = ref('');
const previewVisible = ref(false);
const previewAcknowledged = ref(false);
const previewReceipt = ref(null);

const decisionDraft = reactive({
	action: 'remove_content',
	policyId: 'harassment',
	rationale: 'Repeated targeted degrading language meets the harassment threshold and prior warnings show a continuing pattern.',
	notifyAuthor: true,
	restrictThread: false,
});

const appealDraft = reactive({
	action: 'restore',
	rationale: 'The comment criticizes the migration event, does not target an individual, and includes positive context about the recovery team.',
});

const filteredCases = computed(() => {
	const query = searchQuery.value.trim().toLowerCase();
	return cases.value.filter((item) => {
		if (statusFilter.value !== 'all' && item.status !== statusFilter.value) return false;
		if (queueFilter.value !== 'all' && item.queue !== queueFilter.value) return false;
		if (!query) return true;
		return [item.title, item.id, item.contentType, item.queueLabel, item.statusLabel, item.assignedTo]
			.some((value) => String(value || '').toLowerCase().includes(query));
	});
});

const isAppeal = computed(() => Boolean(selectedCase.value?.appeal?.status === 'pending'));
const activePreview = computed(() => isAppeal.value ? selectedCase.value?.appeal?.preview : selectedCase.value?.preview);
const mobileNavigation = computed(() => [
	{ value: 'queue', label: 'Queue', badge: String(filteredCases.value.length) },
	{ value: 'case', label: 'Case', badge: selectedCase.value?.reportCount ? String(selectedCase.value.reportCount) : '' },
	{ value: 'decision', label: isAppeal.value ? 'Appeal' : 'Decision', badge: activePreview.value ? '1' : '' },
]);

onMounted(loadWorkspace);

/**
 * Loads queue summaries and then lazily opens the selected case.
 *
 * @param {boolean} clearMessages Whether visible feedback should be cleared.
 * @returns {Promise<void>}
 */
async function loadWorkspace(clearMessages = true) {
	if (clearMessages) clearFeedback();
	loading.value = true;
	try {
		const response = await fetch(`${apiBase}/bootstrap`);
		const data = await response.json();
		if (!response.ok) throw createRequestError(data, response.status);
		applyWorkspace(data);
		await loadCase(data.workspace.selectedCaseId, false);
	} catch (requestError) {
		errorMessage.value = requestError.message || 'Unable to load the moderation workspace.';
	} finally {
		loading.value = false;
	}
}

/**
 * Loads one full moderation case from the lazy detail endpoint.
 *
 * @param {string} caseId Stable moderation case identifier.
 * @param {boolean} [moveToCase=true] Whether to switch to the case view on compact screens.
 * @returns {Promise<void>}
 */
async function loadCase(caseId, moveToCase = true) {
	if (!caseId || (caseId === selectedCase.value?.id && !caseLoading.value)) {
		if (moveToCase) activeView.value = 'case';
		return;
	}
	clearFeedback();
	caseLoading.value = true;
	try {
		const response = await fetch(`${apiBase}/cases/${caseId}`);
		const data = await response.json();
		if (!response.ok) throw createRequestError(data, response.status);
		selectedCase.value = data.case;
		if (workspace.value) workspace.value.revision = data.workspaceRevision;
		syncDrafts(data.case);
		caseTab.value = 'content';
		previewReceipt.value = null;
		if (moveToCase) activeView.value = 'case';
	} catch (requestError) {
		errorMessage.value = requestError.message || 'Unable to load this moderation case.';
	} finally {
		caseLoading.value = false;
	}
}

/**
 * Sends one JSON mutation and applies the authoritative response.
 *
 * @param {string} path API path below the moderation base URL.
 * @param {Record<string, unknown>} body JSON request body.
 * @param {string} action Stable busy-state key.
 * @returns {Promise<Record<string, unknown>|null>} Updated payload or null after failure.
 */
async function mutateWorkspace(path, body, action) {
	clearFeedback();
	busyAction.value = action;
	try {
		const response = await fetch(`${apiBase}${path}`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body),
		});
		const data = await response.json();
		if (!response.ok) throw createRequestError(data, response.status);
		applyWorkspace(data);
		if (data.selectedCase) {
			selectedCase.value = data.selectedCase;
			syncDrafts(data.selectedCase);
		}
		return data;
	} catch (requestError) {
		errorMessage.value = requestError.message || 'Moderation action failed.';
		fieldErrors.value = requestError.fields || {};
		if (requestError.status === 409) await reloadAfterConflict();
		return null;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Reloads authoritative queue and selected-case state after a conflict.
 *
 * @returns {Promise<void>}
 */
async function reloadAfterConflict() {
	const caseId = selectedCase.value?.id;
	try {
		const response = await fetch(`${apiBase}/bootstrap`);
		const data = await response.json();
		if (!response.ok) return;
		applyWorkspace(data);
		if (caseId) await loadCase(caseId, false);
	} catch {
		// Preserve the original conflict message when recovery also fails.
	}
}

/**
 * Applies workspace summaries and select catalogs from an API response.
 *
 * @param {Record<string, unknown>} data Moderation API payload.
 * @returns {void}
 */
function applyWorkspace(data) {
	workspace.value = data.workspace;
	cases.value = data.cases || [];
	catalogs.value = data.catalogs || { statuses: [], queues: [], actions: [], policies: [], appealActions: [] };
}

/**
 * Aligns decision drafts with the selected case without copying server previews.
 *
 * @param {Record<string, unknown>} moderationCase Selected moderation case.
 * @returns {void}
 */
function syncDrafts(moderationCase) {
	noteDraft.value = '';
	previewAcknowledged.value = false;
	if (moderationCase.appeal?.status === 'pending') {
		appealDraft.action = 'restore';
		appealDraft.rationale = 'The comment criticizes the migration event, does not target an individual, and includes positive context about the recovery team.';
		return;
	}
	const defaults = {
		community: {
			action: 'remove_content',
			policyId: 'harassment',
			rationale: 'Repeated targeted degrading language meets the harassment threshold and prior warnings show a continuing pattern.',
		},
		marketplace: {
			action: 'restrict_content',
			policyId: 'fraud',
			rationale: 'The listing asks buyers to bypass checkout and use an unprotected payment method, creating a clear payment-safety risk.',
		},
		integrity: {
			action: 'escalate',
			policyId: 'privacy',
			rationale: 'Location and direct-contact fragments create a serious privacy risk that requires specialist confirmation.',
		},
	}[moderationCase.queue] || {
		action: 'allow_content',
		policyId: 'no_violation',
		rationale: 'The available evidence does not meet a policy enforcement threshold.',
	};
	decisionDraft.action = defaults.action;
	decisionDraft.policyId = defaults.policyId;
	decisionDraft.rationale = defaults.rationale;
	decisionDraft.notifyAuthor = true;
	decisionDraft.restrictThread = false;
}

/**
 * Claims the selected case for the current reviewer.
 *
 * @returns {Promise<void>}
 */
async function claimCase() {
	if (!workspace.value || !selectedCase.value) return;
	const data = await mutateWorkspace(`/cases/${selectedCase.value.id}/claim`, exactCasePayload(), 'claim-case');
	if (data) successMessage.value = `${data.selectedCase.id} is now assigned to ${data.workspace.reviewer.name}.`;
}

/**
 * Adds an internal note to the exact selected-case version.
 *
 * @returns {Promise<void>}
 */
async function addNote() {
	if (!workspace.value || !selectedCase.value) return;
	const data = await mutateWorkspace(`/cases/${selectedCase.value.id}/notes`, {
		...exactCasePayload(),
		body: noteDraft.value,
	}, 'add-note');
	if (data) {
		noteDraft.value = '';
		successMessage.value = 'Internal note added to the immutable case timeline.';
	}
}

/**
 * Creates an exact first-review decision preview.
 *
 * @returns {Promise<void>}
 */
async function previewDecision() {
	if (!workspace.value || !selectedCase.value) return;
	previewReceipt.value = null;
	const data = await mutateWorkspace(`/cases/${selectedCase.value.id}/decision-preview`, {
		...exactCasePayload(),
		...decisionDraft,
	}, 'preview-decision');
	if (data) {
		previewVisible.value = true;
		previewAcknowledged.value = !data.selectedCase.preview.requiresAcknowledgement;
		successMessage.value = `${data.selectedCase.preview.checksum} locked the exact decision.`;
	}
}

/**
 * Creates an exact second-review preview for the selected appeal.
 *
 * @returns {Promise<void>}
 */
async function previewAppeal() {
	if (!workspace.value || !selectedCase.value?.appeal) return;
	previewReceipt.value = null;
	const data = await mutateWorkspace(`/appeals/${selectedCase.value.appeal.id}/decision-preview`, {
		...exactAppealPayload(),
		...appealDraft,
	}, 'preview-appeal');
	if (data) {
		previewVisible.value = true;
		previewAcknowledged.value = false;
		successMessage.value = `${data.selectedCase.appeal.preview.checksum} locked the second review.`;
	}
}

/**
 * Commits the active first-review or appeal preview.
 *
 * @returns {Promise<void>}
 */
async function commitPreview() {
	if (!workspace.value || !selectedCase.value || !activePreview.value) return;
	const path = isAppeal.value
		? `/appeals/${selectedCase.value.appeal.id}/decision`
		: `/cases/${selectedCase.value.id}/decision`;
	const body = {
		...(isAppeal.value ? exactAppealPayload() : exactCasePayload()),
		previewChecksum: activePreview.value.checksum,
		acknowledged: previewAcknowledged.value,
	};
	const data = await mutateWorkspace(path, body, isAppeal.value ? 'commit-appeal' : 'commit-decision');
	if (data) {
		previewReceipt.value = data.appealReceipt || data.decisionReceipt;
		previewVisible.value = false;
		previewAcknowledged.value = false;
		successMessage.value = `${previewReceipt.value.auditReceipt} preserved the final decision.`;
	}
}

/**
 * Restores the deterministic moderation workspace.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	const data = await mutateWorkspace('/reset', {}, 'reset-workspace');
	if (!data) return;
	selectedCase.value = null;
	previewVisible.value = false;
	previewReceipt.value = null;
	statusFilter.value = 'all';
	queueFilter.value = 'all';
	searchQuery.value = '';
	await loadCase(data.workspace.selectedCaseId, false);
	activeView.value = 'case';
	successMessage.value = 'Moderation queue restored to the seeded state.';
}

/**
 * Returns exact workspace and case revision fields for mutations.
 *
 * @returns {{revision: number, caseVersion: number}} Exact revision payload.
 */
function exactCasePayload() {
	return {
		revision: workspace.value.revision,
		caseVersion: selectedCase.value.version,
	};
}

/**
 * Returns exact workspace, case, and appeal revision fields.
 *
 * @returns {{revision: number, caseVersion: number, appealVersion: number}} Exact appeal payload.
 */
function exactAppealPayload() {
	return {
		...exactCasePayload(),
		appealVersion: selectedCase.value.appeal.version,
	};
}

/**
 * Clears visible feedback and structured field errors.
 *
 * @returns {void}
 */
function clearFeedback() {
	errorMessage.value = '';
	successMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Returns from the exact preview to the editable decision draft.
 *
 * @returns {void}
 */
function editDecision() {
	previewVisible.value = false;
	previewAcknowledged.value = false;
	previewReceipt.value = null;
}

/**
 * Creates an Error carrying HTTP status and structured field messages.
 *
 * @param {Record<string, unknown>} data Error payload.
 * @param {number} status HTTP status.
 * @returns {Error & {status: number, fields?: Record<string, string[]>}} Request error.
 */
function createRequestError(data, status) {
	const fieldMessages = Object.values(data.fields || {}).flat().join(' ');
	const requestError = new Error([data.message, fieldMessages].filter(Boolean).join(' ') || `Request failed with status ${status}.`);
	requestError.status = status;
	requestError.fields = data.fields || {};
	return requestError;
}

/**
 * Returns a DOM Studio tone for a case severity.
 *
 * @param {string} severity Case severity.
 * @returns {string} Semantic tone.
 */
function severityTone(severity) {
	if (severity === 'critical') return 'danger';
	if (severity === 'high') return 'warning';
	if (severity === 'medium') return 'info';
	return 'neutral';
}

/**
 * Returns a DOM Studio tone for a moderation status.
 *
 * @param {string} status Moderation status.
 * @returns {string} Semantic tone.
 */
function statusTone(status) {
	if (status === 'decided') return 'success';
	if (status === 'appeal_pending') return 'warning';
	if (status === 'escalated') return 'danger';
	if (status === 'in_review') return 'info';
	return 'neutral';
}

/**
 * Formats an ISO timestamp for the review timeline.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Localized date and time.
 */
function formatTime(value) {
	if (!value) return '';
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}
</script>

<template>
	<DomAppShell variant="app" class="!h-dvh bg-canvas text-canvas-fg">
		<template #top>
			<DomAppTopBar
				title="Safety desk"
				:subtitle="workspace ? `${workspace.counts.open} open · ${workspace.serviceLevel}` : 'Moderation operations'"
			>
				<template #leading>
					<div class="grid size-9 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-fg" aria-hidden="true">TS</div>
				</template>
				<template #trailing>
					<DomBadge v-if="workspace" class="!hidden sm:!inline-flex" tone="neutral" variant="outline">r{{ workspace.revision }}</DomBadge>
					<DomButton class="!hidden sm:!inline-flex" size="sm" variant="secondary" :loading="busyAction === 'reset-workspace'" @click="resetWorkspace">Reset demo</DomButton>
				</template>
			</DomAppTopBar>
		</template>

		<div class="relative h-full min-h-0 overflow-hidden">
			<div v-if="errorMessage || successMessage" class="absolute inset-x-3 top-3 z-20 mx-auto max-w-2xl">
				<DomAlert v-if="errorMessage" tone="danger" variant="toast" title="Review action needs attention" :description="errorMessage" dismissible @dismiss="errorMessage = ''" />
				<DomAlert v-else tone="success" variant="toast" title="Moderation workspace updated" :description="successMessage" dismissible @dismiss="successMessage = ''" />
			</div>

			<div v-if="loading" class="grid h-full xl:grid-cols-[19rem_minmax(0,1fr)_22rem]">
				<div v-for="column in 3" :key="column" class="space-y-3 border-r border-border p-4 last:border-r-0">
					<DomSkeleton height="h-10" width="w-2/3" />
					<DomSkeleton v-for="row in 6" :key="row" height="h-16" />
				</div>
			</div>

			<DomEmptyState v-else-if="!workspace || !selectedCase" title="Moderation workspace unavailable" description="Reload the repository-local API to restore the review queue.">
				<DomButton @click="loadWorkspace">Reload workspace</DomButton>
			</DomEmptyState>

			<div v-else class="grid h-full min-h-0 grid-cols-1 overflow-hidden xl:grid-cols-[19rem_minmax(0,1fr)_22rem]">
				<aside
					class="h-full min-h-0 overflow-y-auto border-r border-border bg-muted/10"
					:class="activeView === 'queue' ? 'block' : 'hidden xl:block'"
					aria-label="Moderation queue"
				>
					<div class="grid grid-cols-4 border-b border-border text-center">
						<div class="px-2 py-3"><p class="text-[10px] text-muted-fg">Open</p><p class="mt-1 text-lg font-semibold">{{ workspace.counts.open }}</p></div>
						<div class="border-l border-border px-2 py-3"><p class="text-[10px] text-muted-fg">Unassigned</p><p class="mt-1 text-lg font-semibold">{{ workspace.counts.unassigned }}</p></div>
						<div class="border-l border-border px-2 py-3"><p class="text-[10px] text-muted-fg">Appeals</p><p class="mt-1 text-lg font-semibold">{{ workspace.counts.appeals }}</p></div>
						<div class="border-l border-border px-2 py-3"><p class="text-[10px] text-muted-fg">High risk</p><p class="mt-1 text-lg font-semibold">{{ workspace.counts.highRisk }}</p></div>
					</div>
					<div class="grid gap-3 border-b border-border p-3">
						<DomTextInput v-model="searchQuery" label="Search cases" placeholder="Title, id, queue, owner…" />
						<div class="grid grid-cols-2 gap-2">
							<DomSelect v-model="statusFilter" label="Status" :options="catalogs.statuses" width="min-w-[16rem]" />
							<DomSelect v-model="queueFilter" label="Queue" :options="catalogs.queues" width="min-w-[16rem]" />
						</div>
					</div>
					<div v-if="filteredCases.length" class="divide-y divide-border">
						<button
							v-for="item in filteredCases"
							:key="item.id"
							type="button"
							class="w-full border-l-2 px-4 py-4 text-left transition hover:bg-secondary/45 focus-visible:outline-2 focus-visible:outline-ring"
							:class="item.id === selectedCase.id ? 'border-l-primary bg-secondary/55' : 'border-l-transparent'"
							@click="loadCase(item.id)"
						>
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="text-sm font-semibold leading-5">{{ item.title }}</p>
									<p class="mt-1 font-mono text-[10px] text-muted-fg">{{ item.id }} · {{ item.ageLabel }}</p>
								</div>
								<DomBadge :tone="severityTone(item.severity)" size="sm">{{ item.severityLabel }}</DomBadge>
							</div>
							<div class="mt-3 flex items-center justify-between gap-3">
								<DomStatusPill :tone="statusTone(item.status)" size="sm">{{ item.statusLabel }}</DomStatusPill>
								<p class="text-[11px] text-muted-fg">{{ item.reportCount }} reports</p>
							</div>
						</button>
					</div>
					<DomEmptyState v-else compact title="No matching cases" description="Adjust the queue, status, or search filters." />
					<div class="p-3 sm:hidden">
						<DomButton class="w-full" variant="ghost" :loading="busyAction === 'reset-workspace'" @click="resetWorkspace">Reset demo</DomButton>
					</div>
				</aside>

				<main
					class="flex h-full min-h-0 flex-col overflow-hidden"
					:class="activeView === 'case' ? 'flex' : 'hidden xl:flex'"
					aria-labelledby="moderation-case-heading"
				>
					<div v-if="caseLoading" class="grid h-full place-items-center p-6">
						<div class="w-full max-w-xl space-y-4"><DomSkeleton height="h-8" width="w-2/3" /><DomSkeleton height="h-28" /><DomSkeleton height="h-52" /></div>
					</div>
					<template v-else>
						<header class="shrink-0 border-b border-border px-4 py-4 sm:px-6">
							<div class="flex flex-wrap items-start justify-between gap-4">
								<div class="min-w-0 flex-1">
									<div class="flex flex-wrap items-center gap-2">
										<DomBadge :tone="severityTone(selectedCase.severity)">{{ selectedCase.severityLabel }}</DomBadge>
										<DomStatusPill :tone="statusTone(selectedCase.status)" size="sm">{{ selectedCase.statusLabel }}</DomStatusPill>
										<DomBadge tone="neutral" variant="outline">v{{ selectedCase.version }}</DomBadge>
									</div>
									<h1 id="moderation-case-heading" class="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{{ selectedCase.title }}</h1>
									<p class="mt-2 text-sm text-muted-fg">{{ selectedCase.queueLabel }} · {{ selectedCase.contentType }} · {{ selectedCase.reportCount }} grouped reports · {{ selectedCase.ageLabel }}</p>
								</div>
								<div class="shrink-0 text-right">
									<p class="text-xs text-muted-fg">Reviewer</p>
									<p class="mt-1 text-sm font-semibold">{{ selectedCase.assignment?.name || 'Unassigned' }}</p>
									<DomButton v-if="selectedCase.capabilities.canClaim" class="mt-3" size="sm" :loading="busyAction === 'claim-case'" @click="claimCase">Claim case</DomButton>
								</div>
							</div>
						</header>

						<DomTabs v-model="caseTab" :tabs="caseTabs" variant="page" fill class="min-h-0 flex-1">
							<template #content>
								<div class="h-full min-h-0 overflow-y-auto">
									<section class="border-b border-border px-4 py-5 sm:px-6" aria-labelledby="reported-content-heading">
										<div class="flex items-center justify-between gap-3">
											<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Reported content</p>
											<DomBadge v-if="selectedCase.autoHeld" tone="warning" variant="soft">Held from distribution</DomBadge>
										</div>
										<blockquote id="reported-content-heading" class="mt-4 border-l-4 border-warning bg-warning/8 px-5 py-4 text-base leading-7 sm:text-lg">
											{{ selectedCase.content }}
										</blockquote>
										<div class="mt-4 grid gap-3 text-sm sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
											<div class="flex items-center gap-3">
												<div class="grid size-9 place-items-center rounded-full bg-secondary text-xs font-bold" aria-hidden="true">{{ selectedCase.author.initials }}</div>
												<div><p class="font-semibold">{{ selectedCase.author.name }}</p><p class="text-xs text-muted-fg">{{ selectedCase.author.contributions }} contributions</p></div>
											</div>
											<p class="leading-6 text-muted-fg sm:text-right">{{ selectedCase.context.surface }}</p>
										</div>
									</section>

									<section class="grid gap-0 xl:grid-cols-2">
										<div class="border-b border-border px-4 py-5 sm:px-6 xl:border-b-0 xl:border-r">
											<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Grouped reports</p>
											<div class="mt-3 divide-y divide-border border-y border-border">
												<div v-for="report in selectedCase.reports" :key="report.reason" class="flex items-center justify-between gap-4 py-3">
													<p class="text-sm font-medium">{{ report.reason }}</p>
													<DomBadge tone="neutral" variant="outline">{{ report.count }}</DomBadge>
												</div>
											</div>
										</div>
										<div class="px-4 py-5 sm:px-6">
											<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Machine signals are evidence, not verdicts</p>
											<div class="mt-4 space-y-4">
												<div v-for="signal in selectedCase.signals" :key="signal.id">
													<div class="flex items-center justify-between gap-3 text-sm"><p class="font-medium">{{ signal.label }}</p><p class="font-mono text-xs" :class="signal.matched ? 'text-warning' : 'text-muted-fg'">{{ Math.round(signal.confidence * 100) }}%</p></div>
													<DomProgress class="mt-2" :value="Math.round(signal.confidence * 100)" size="sm" :tone="signal.matched ? 'warning' : 'neutral'" />
													<p class="mt-1 text-[11px] text-muted-fg">{{ signal.source }}</p>
												</div>
											</div>
										</div>
									</section>
								</div>
							</template>

							<template #context>
								<div class="h-full min-h-0 overflow-y-auto px-4 py-5 sm:px-6">
									<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
										<section>
											<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Conversation context</p>
											<div class="mt-3 divide-y divide-border border-y border-border text-sm leading-6">
												<div class="py-4"><p class="text-xs font-semibold text-muted-fg">Parent</p><p class="mt-1">{{ selectedCase.context.parent }}</p></div>
												<div class="py-4"><p class="text-xs font-semibold text-muted-fg">Previous reply</p><p class="mt-1">{{ selectedCase.context.before }}</p></div>
												<div class="border-l-4 border-warning bg-warning/8 px-4 py-4"><p class="text-xs font-semibold text-muted-fg">Reported item</p><p class="mt-1">{{ selectedCase.content }}</p></div>
												<div class="py-4"><p class="text-xs font-semibold text-muted-fg">Following reply</p><p class="mt-1">{{ selectedCase.context.after }}</p></div>
											</div>
										</section>
										<aside>
											<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Author context</p>
											<dl class="mt-3 divide-y divide-border border-y border-border text-sm">
												<div class="py-3"><dt class="text-xs text-muted-fg">Member since</dt><dd class="mt-1 font-semibold">{{ selectedCase.author.joinedAt }}</dd></div>
												<div class="py-3"><dt class="text-xs text-muted-fg">Contributions</dt><dd class="mt-1 font-semibold">{{ selectedCase.author.contributions }}</dd></div>
												<div class="py-3"><dt class="text-xs text-muted-fg">Prior actions</dt><dd class="mt-1 font-semibold">{{ selectedCase.author.priorActions }}</dd></div>
											</dl>
											<p class="mt-4 text-sm leading-6 text-muted-fg">{{ selectedCase.author.note }}</p>
										</aside>
									</div>
									<section class="mt-6">
										<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Evidence summary</p>
										<div class="mt-3 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
											<div v-for="item in selectedCase.evidence" :key="item.label" class="bg-canvas p-4">
												<p class="text-xs text-muted-fg">{{ item.label }}</p><p class="mt-1 text-sm font-semibold">{{ item.value }}</p><p class="mt-2 text-xs leading-5 text-muted-fg">{{ item.detail }}</p>
											</div>
										</div>
									</section>
								</div>
							</template>

							<template #audit>
								<div class="h-full min-h-0 overflow-y-auto px-4 py-5 sm:px-6">
									<section v-if="selectedCase.capabilities.canNote" class="border-b border-border pb-5">
										<div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
											<DomTextareaInput v-model="noteDraft" label="Internal note" description="Visible to moderators and retained with the case." :rows="3" :errors="fieldErrors.body || []" />
											<DomButton :loading="busyAction === 'add-note'" @click="addNote">Add note</DomButton>
										</div>
									</section>
									<section class="mt-1">
										<div v-for="event in selectedCase.activity" :key="event.id" class="grid grid-cols-[6rem_minmax(0,1fr)] gap-4 border-b border-border py-4 last:border-b-0">
											<p class="font-mono text-[11px] text-muted-fg">{{ formatTime(event.createdAt) }}</p>
											<div><div class="flex items-center gap-2"><DomStatusPill :tone="event.tone" label="" size="sm" /><p class="text-sm font-semibold">{{ event.title }}</p></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p><p class="mt-2 text-[11px] text-muted-fg">{{ event.actor }}</p></div>
										</div>
									</section>
								</div>
							</template>
						</DomTabs>
					</template>
				</main>

				<aside
					class="flex h-full min-h-0 flex-col overflow-hidden border-l border-border bg-muted/10"
					:class="activeView === 'decision' ? 'flex' : 'hidden xl:flex'"
					aria-label="Moderation decision"
				>
					<div class="shrink-0 border-b border-border px-4 py-4">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ previewReceipt ? 'Immutable evidence' : isAppeal ? 'Second review' : 'Policy decision' }}</p>
						<h2 class="mt-1 text-lg font-semibold">{{ previewReceipt ? 'Decision receipt' : activePreview && previewVisible ? 'Review exact outcome' : isAppeal ? 'Resolve appeal' : 'Decide this case' }}</h2>
						<p class="mt-2 text-xs leading-5 text-muted-fg">{{ previewReceipt ? 'Provider and audit receipts confirm the committed outcome.' : activePreview && previewVisible ? 'The server locked this exact case version, policy basis, enforcement, and notification route.' : isAppeal ? 'Compare the author appeal with the original decision and current evidence.' : 'Preview the exact policy basis, enforcement effects, author notice, and audit evidence before applying.' }}</p>
					</div>

					<div class="min-h-0 flex-1 overflow-y-auto p-4">
						<template v-if="previewReceipt">
							<DomAlert tone="success" title="Immutable decision recorded" :description="`${previewReceipt.auditReceipt} preserved the review and ${previewReceipt.deliveryReceipt} recorded author delivery.`" />
							<dl class="mt-5 divide-y divide-border border-y border-border text-sm">
								<div class="py-3"><dt class="text-xs text-muted-fg">Decision</dt><dd class="mt-1 font-mono text-xs">{{ previewReceipt.id }}</dd></div>
								<div class="py-3"><dt class="text-xs text-muted-fg">Audit</dt><dd class="mt-1 font-mono text-xs">{{ previewReceipt.auditReceipt }}</dd></div>
								<div class="py-3"><dt class="text-xs text-muted-fg">Delivery</dt><dd class="mt-1 font-mono text-xs">{{ previewReceipt.deliveryReceipt }}</dd></div>
								<div class="py-3"><dt class="text-xs text-muted-fg">Checksum</dt><dd class="mt-1 truncate font-mono text-xs">{{ previewReceipt.checksum }}</dd></div>
							</dl>
						</template>

						<template v-else-if="activePreview && previewVisible">
							<div class="flex flex-wrap items-center gap-2">
								<DomStatusPill tone="warning" size="sm">{{ activePreview.actionLabel }}</DomStatusPill>
								<DomBadge v-if="activePreview.policyLabel" tone="neutral" variant="outline">{{ activePreview.policyLabel }}</DomBadge>
							</div>
							<p class="mt-3 text-sm leading-6">{{ activePreview.rationale }}</p>
							<p class="mt-2 truncate font-mono text-[11px] text-muted-fg">{{ activePreview.checksum }} · case v{{ activePreview.caseVersion }}</p>
							<section class="mt-5 border-y border-border py-4">
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Enforcement effects</p>
								<ul class="mt-3 space-y-2 text-sm"><li v-for="effect in activePreview.effects" :key="effect" class="flex gap-2"><span class="mt-2 size-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true"></span><span>{{ effect }}</span></li></ul>
							</section>
							<section class="border-b border-border py-4">
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Readiness</p>
								<div class="mt-3 space-y-3"><div v-for="check in activePreview.qualityChecks" :key="check.label" class="flex items-center justify-between gap-3 text-sm"><span>{{ check.label }}</span><DomStatusPill :tone="check.passed ? 'success' : 'danger'" size="sm">{{ check.passed ? 'Passed' : 'Blocked' }}</DomStatusPill></div></div>
							</section>
							<DomCheckbox v-model="previewAcknowledged" class="mt-4" label="Apply this exact outcome" description="I reviewed the policy basis, enforcement effects, author notification, and immutable case version." :errors="fieldErrors.acknowledged || []" />
							<DomButton class="mt-4 w-full" :disabled="!previewAcknowledged" :loading="busyAction === 'commit-decision' || busyAction === 'commit-appeal'" @click="commitPreview">Apply decision</DomButton>
							<DomButton class="mt-2 w-full" variant="ghost" @click="editDecision">Back to draft</DomButton>
						</template>

						<template v-else-if="isAppeal">
							<DomAlert tone="warning" variant="soft" title="Author appeal" :description="selectedCase.appeal.reason" />
							<div class="mt-4 border-y border-border py-4 text-sm">
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Original decision</p>
								<p class="mt-2 font-semibold">{{ selectedCase.decision.actionLabel }}</p>
								<p class="mt-1 text-xs text-muted-fg">{{ selectedCase.decision.policyLabel }} · {{ selectedCase.decision.decidedBy }}</p>
								<p class="mt-3 text-xs leading-5 text-muted-fg">{{ selectedCase.decision.rationale }}</p>
							</div>
							<div class="mt-4 grid gap-4">
								<DomSelect v-model="appealDraft.action" label="Appeal outcome" :options="catalogs.appealActions" :errors="fieldErrors.action || []">
									<template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template>
								</DomSelect>
								<DomTextareaInput v-model="appealDraft.rationale" label="Second-review rationale" description="Explain how the appeal and context affect the original decision." :rows="6" :errors="fieldErrors.rationale || []" />
								<DomButton :loading="busyAction === 'preview-appeal'" :disabled="!selectedCase.capabilities.canReviewAppeal" @click="previewAppeal">Review appeal outcome</DomButton>
							</div>
						</template>

						<template v-else-if="selectedCase.capabilities.canDecide">
							<div class="grid gap-4">
								<DomSelect v-model="decisionDraft.action" label="Action" :options="catalogs.actions" :errors="fieldErrors.action || []">
									<template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template>
								</DomSelect>
								<DomSelect v-model="decisionDraft.policyId" label="Policy basis" :options="catalogs.policies" :errors="fieldErrors.policyId || []" searchable>
									<template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template>
								</DomSelect>
								<DomTextareaInput v-model="decisionDraft.rationale" label="Reviewer rationale" description="Connect the evidence to the selected policy threshold." :rows="6" :errors="fieldErrors.rationale || []" />
								<div class="divide-y divide-border border-y border-border">
									<div class="py-3"><DomToggle v-model="decisionDraft.notifyAuthor" label="Notify author" description="Send the policy basis and appeal route." /></div>
									<div class="py-3"><DomToggle v-model="decisionDraft.restrictThread" label="Lock source thread" description="Prevent new replies after enforcement." /></div>
								</div>
								<DomButton :loading="busyAction === 'preview-decision'" @click="previewDecision">Review exact decision</DomButton>
							</div>
						</template>

						<template v-else-if="selectedCase.capabilities.canClaim">
							<DomEmptyState compact title="Claim before deciding" description="Review ownership prevents two moderators from applying conflicting actions.">
								<DomButton :loading="busyAction === 'claim-case'" @click="claimCase">Claim case</DomButton>
							</DomEmptyState>
						</template>

						<template v-else>
							<DomAlert :tone="selectedCase.status === 'decided' ? 'success' : 'info'" :title="selectedCase.status === 'decided' ? 'Decision recorded' : 'Waiting for specialist'" :description="selectedCase.decision ? `${selectedCase.decision.actionLabel} · ${selectedCase.decision.policyLabel} · ${selectedCase.decision.auditReceipt}` : 'This case remains held while the specialist queue reviews the evidence.'" />
							<dl v-if="selectedCase.decision" class="mt-4 divide-y divide-border border-y border-border text-sm">
								<div class="py-3"><dt class="text-xs text-muted-fg">Decided by</dt><dd class="mt-1 font-semibold">{{ selectedCase.decision.decidedBy }}</dd></div>
								<div class="py-3"><dt class="text-xs text-muted-fg">Current effect</dt><dd class="mt-1 font-semibold">{{ selectedCase.decision.currentEffect || selectedCase.decision.actionLabel }}</dd></div>
								<div class="py-3"><dt class="text-xs text-muted-fg">Audit receipt</dt><dd class="mt-1 font-mono text-xs">{{ selectedCase.decision.auditReceipt }}</dd></div>
							</dl>
						</template>
					</div>
				</aside>
			</div>
		</div>

		<template #bottom>
			<DomAppBottomNav v-model="activeView" :items="mobileNavigation" class="xl:hidden" />
		</template>
	</DomAppShell>
</template>
