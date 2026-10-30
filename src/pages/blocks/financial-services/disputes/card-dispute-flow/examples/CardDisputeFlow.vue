<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomEmptyState,
	DomJsonViewer,
	DomProgress,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const API_BASE = '/api/block-demos/card-dispute-flow';
const viewTabs = [
	{ key: 'transactions', label: 'Transactions' },
	{ key: 'claim', label: 'Claim' },
	{ key: 'evidence', label: 'Evidence' },
	{ key: 'case', label: 'Case' },
];

const loading = ref(true);
const actionKey = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const fieldErrors = ref({});
const workspace = ref(null);
const transactions = ref([]);
const activeTransaction = ref(null);
const options = ref({ reasons: [], evidenceTypes: [], caseStatuses: [] });
const activeView = ref('transactions');
const searchQuery = ref('');
const caseStatusFilter = ref('all');
const formSnapshot = ref('');
const evidenceDialogOpen = ref(false);
const protectionDialogOpen = ref(false);
const submitDialogOpen = ref(false);
const receiptDialogOpen = ref(false);
const receipt = ref(null);

const claimForm = reactive({
	reasonCode: 'unauthorized',
	statement: 'I do not recognize this charge and did not authorize the merchant to bill this card.',
	merchantContacted: false,
	cardInPossession: true,
	recognizesMerchant: false,
	requestedFreeze: true,
	requestedReplacement: false,
});

const evidenceForm = reactive({
	type: 'transaction_screenshot',
	reference: 'Aster statement 29 July.png',
	note: 'The unfamiliar subscription charge is highlighted.',
});

const protectionForm = reactive({
	freeze: true,
	replace: false,
	reason: 'Cardholder reported an unrecognized online purchase.',
});

const submissionAcknowledged = ref(false);

const filteredTransactions = computed(() => {
	const query = searchQuery.value.trim().toLowerCase();
	return transactions.value.filter((transaction) => {
		const matchesQuery = !query || `${transaction.merchant} ${transaction.descriptor} ${transaction.category}`.toLowerCase().includes(query);
		const matchesStatus = caseStatusFilter.value === 'all' || transaction.claimStatus === caseStatusFilter.value;
		return matchesQuery && matchesStatus;
	});
});
const claim = computed(() => activeTransaction.value?.claim || null);
const evidenceItems = computed(() => claim.value?.evidence || []);
const preflight = computed(() => claim.value?.preflight || null);
const preflightChecks = computed(() => preflight.value?.checks || []);
const passedChecks = computed(() => preflightChecks.value.filter((check) => check.status === 'passed').length);
const readinessPercent = computed(() => preflightChecks.value.length ? Math.round((passedChecks.value / preflightChecks.value.length) * 100) : 0);
const caseSubmission = computed(() => claim.value?.submission || null);
const currentReceipt = computed(() => activeTransaction.value?.latestReceipt || null);
const claimDirty = computed(() => formSnapshot.value !== serializeClaimForm());
const canEditClaim = computed(() => Boolean(activeTransaction.value?.capabilities?.canEdit));
const canRunPreflight = computed(() => Boolean(claim.value?.status === 'draft' && !claimDirty.value));
const canSubmit = computed(() => Boolean(preflight.value?.ready && preflight.value.revision === activeTransaction.value?.revision && !claimDirty.value));
const selectedReason = computed(() => options.value.reasons.find((option) => option.value === claimForm.reasonCode));

onMounted(loadBootstrap);

/**
 * Loads the dispute queue and selected transaction from the repository-local API.
 *
 * @returns {Promise<void>} Resolves after initial workspace hydration.
 */
async function loadBootstrap() {
	loading.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`${API_BASE}/bootstrap`);
		workspace.value = payload.workspace;
		transactions.value = payload.transactions || [];
		options.value = payload.options || options.value;
		applyTransaction(payload.selectedTransaction);
	} catch (error) {
		handleApiError(error);
	} finally {
		loading.value = false;
	}
}

/**
 * Loads one transaction and moves the working surface to its claim.
 *
 * @param {string} transactionId Stable transaction identifier.
 * @returns {Promise<void>} Resolves after the selection changes.
 */
async function selectTransaction(transactionId) {
	if (activeTransaction.value?.id === transactionId || actionKey.value) return;
	await performAction('select-transaction', async () => {
		const payload = await requestJson(`${API_BASE}/transactions/${transactionId}`);
		applyTransaction(payload.transaction);
		activeView.value = payload.transaction.claim?.status === 'submitted' ? 'case' : 'claim';
		successMessage.value = `${payload.transaction.merchant} selected.`;
	});
}

/**
 * Applies fresh server state and updates the compact queue row.
 *
 * @param {Record<string, unknown>} transaction Public transaction detail.
 * @returns {void}
 */
function applyTransaction(transaction) {
	if (!transaction) return;
	activeTransaction.value = transaction;
	const index = transactions.value.findIndex((candidate) => candidate.id === transaction.id);
	if (index >= 0) {
		transactions.value.splice(index, 1, {
			...transactions.value[index],
			revision: transaction.revision,
			claimStatus: transaction.claim?.status || (transaction.eligible ? 'needs_action' : 'not_eligible'),
			claimStatusMeta: transaction.claimStatusMeta,
			caseNumber: transaction.claim?.submission?.caseNumber || '',
		});
	}
	syncClaimForm();
	fieldErrors.value = {};
}

/**
 * Copies the server claim into the editable intake form.
 *
 * @returns {void}
 */
function syncClaimForm() {
	const source = activeTransaction.value?.claim;
	claimForm.reasonCode = source?.reasonCode || 'unauthorized';
	claimForm.statement = source?.statement || 'I do not recognize this charge and did not authorize the merchant to bill this card.';
	claimForm.merchantContacted = source?.merchantContacted ?? false;
	claimForm.cardInPossession = source?.cardInPossession ?? true;
	claimForm.recognizesMerchant = source?.recognizesMerchant ?? false;
	claimForm.requestedFreeze = source?.requestedFreeze ?? true;
	claimForm.requestedReplacement = source?.requestedReplacement ?? false;
	formSnapshot.value = source ? serializeClaimForm() : '';
}

/**
 * Returns a stable snapshot of the editable claim fields.
 *
 * @returns {string} Serialized form state.
 */
function serializeClaimForm() {
	return JSON.stringify({
		reasonCode: claimForm.reasonCode,
		statement: claimForm.statement,
		merchantContacted: claimForm.merchantContacted,
		cardInPossession: claimForm.cardInPossession,
		recognizesMerchant: claimForm.recognizesMerchant,
		requestedFreeze: claimForm.requestedFreeze,
		requestedReplacement: claimForm.requestedReplacement,
	});
}

/**
 * Persists the structured dispute intake at the current server revision.
 *
 * @returns {Promise<void>} Resolves after the draft is saved.
 */
async function saveClaim() {
	if (!activeTransaction.value || !canEditClaim.value) return;
	await performAction('save-claim', async () => {
		const payload = await requestJson(`${API_BASE}/transactions/${activeTransaction.value.id}/claim`, {
			method: 'PATCH',
			body: {
				revision: activeTransaction.value.revision,
				...JSON.parse(serializeClaimForm()),
			},
		});
		applyTransaction(payload.transaction);
		receipt.value = payload.receipt;
		successMessage.value = payload.message;
	});
}

/**
 * Opens the evidence dialog with a useful evidence suggestion.
 *
 * @returns {void}
 */
function openEvidenceDialog() {
	fieldErrors.value = {};
	evidenceForm.type = 'transaction_screenshot';
	evidenceForm.reference = 'Aster statement 29 July.png';
	evidenceForm.note = 'The unfamiliar subscription charge is highlighted.';
	evidenceDialogOpen.value = true;
}

/**
 * Adds a typed evidence record through the dispute API.
 *
 * @returns {Promise<void>} Resolves after evidence verification.
 */
async function addEvidence() {
	if (!activeTransaction.value) return;
	await performAction('add-evidence', async () => {
		const payload = await requestJson(`${API_BASE}/transactions/${activeTransaction.value.id}/evidence`, {
			method: 'POST',
			body: {
				revision: activeTransaction.value.revision,
				...evidenceForm,
			},
		});
		applyTransaction(payload.transaction);
		receipt.value = payload.receipt;
		evidenceDialogOpen.value = false;
		successMessage.value = payload.message;
	});
}

/**
 * Removes one evidence record from the current draft.
 *
 * @param {string} evidenceId Stable evidence identifier.
 * @returns {Promise<void>} Resolves after evidence removal.
 */
async function removeEvidence(evidenceId) {
	if (!activeTransaction.value) return;
	await performAction(`remove-${evidenceId}`, async () => {
		const payload = await requestJson(`${API_BASE}/transactions/${activeTransaction.value.id}/evidence/${evidenceId}`, {
			method: 'DELETE',
			body: { revision: activeTransaction.value.revision },
		});
		applyTransaction(payload.transaction);
		receipt.value = payload.receipt;
		successMessage.value = payload.message;
	});
}

/**
 * Runs the current draft through server-owned eligibility and evidence checks.
 *
 * @returns {Promise<void>} Resolves after the preflight decision.
 */
async function runPreflight() {
	if (!activeTransaction.value) return;
	if (claimDirty.value) {
		errorMessage.value = 'Save the current claim changes before running checks.';
		activeView.value = 'claim';
		return;
	}
	await performAction('preflight', async () => {
		const payload = await requestJson(`${API_BASE}/transactions/${activeTransaction.value.id}/preflight`, {
			method: 'POST',
			body: { revision: activeTransaction.value.revision },
		});
		applyTransaction(payload.transaction);
		receipt.value = payload.receipt;
		successMessage.value = payload.message;
	});
}

/**
 * Opens the immediate card-protection confirmation.
 *
 * @returns {void}
 */
function openProtectionDialog() {
	if (!claim.value) {
		errorMessage.value = 'Save the dispute intake before protecting the card.';
		activeView.value = 'claim';
		return;
	}
	protectionForm.freeze = true;
	protectionForm.replace = Boolean(claimForm.requestedReplacement);
	protectionForm.reason = 'Cardholder reported an unrecognized online purchase.';
	fieldErrors.value = {};
	protectionDialogOpen.value = true;
}

/**
 * Applies immediate freeze or replacement protection through the API.
 *
 * @returns {Promise<void>} Resolves after card protection is applied.
 */
async function applyProtection() {
	if (!activeTransaction.value) return;
	await performAction('protection', async () => {
		const payload = await requestJson(`${API_BASE}/transactions/${activeTransaction.value.id}/protection`, {
			method: 'POST',
			body: {
				revision: activeTransaction.value.revision,
				...protectionForm,
			},
		});
		applyTransaction(payload.transaction);
		receipt.value = payload.receipt;
		protectionDialogOpen.value = false;
		successMessage.value = payload.message;
	});
}

/**
 * Opens the final declaration when current server checks allow submission.
 *
 * @returns {void}
 */
function openSubmitDialog() {
	if (!canSubmit.value) {
		errorMessage.value = 'Run passing submission checks for the current draft first.';
		return;
	}
	submissionAcknowledged.value = false;
	fieldErrors.value = {};
	submitDialogOpen.value = true;
}

/**
 * Submits the dispute and locks its statement and evidence snapshot.
 *
 * @returns {Promise<void>} Resolves after case creation.
 */
async function submitDispute() {
	if (!activeTransaction.value) return;
	await performAction('submit', async () => {
		const payload = await requestJson(`${API_BASE}/transactions/${activeTransaction.value.id}/submit`, {
			method: 'POST',
			body: {
				revision: activeTransaction.value.revision,
				acknowledged: submissionAcknowledged.value,
			},
		});
		applyTransaction(payload.transaction);
		receipt.value = payload.receipt;
		submitDialogOpen.value = false;
		activeView.value = 'case';
		successMessage.value = payload.message;
	});
}

/**
 * Opens a server mutation receipt in the DOM Studio JSON viewer.
 *
 * @param {Record<string, unknown>} value Receipt to inspect.
 * @returns {void}
 */
function inspectReceipt(value) {
	if (!value) return;
	receipt.value = value;
	receiptDialogOpen.value = true;
}

/**
 * Restores all seeded lifecycle examples.
 *
 * @returns {Promise<void>} Resolves after reset.
 */
async function resetDemo() {
	await performAction('reset', async () => {
		const payload = await requestJson(`${API_BASE}/reset`, { method: 'POST' });
		workspace.value = payload.workspace;
		transactions.value = payload.transactions || [];
		options.value = payload.options || options.value;
		applyTransaction(payload.selectedTransaction);
		activeView.value = 'transactions';
		searchQuery.value = '';
		caseStatusFilter.value = 'all';
		evidenceDialogOpen.value = false;
		protectionDialogOpen.value = false;
		submitDialogOpen.value = false;
		receiptDialogOpen.value = false;
		successMessage.value = 'Demo dispute queue restored.';
	});
}

/**
 * Runs a request with shared busy, validation, and feedback handling.
 *
 * @param {string} key Stable action key.
 * @param {() => Promise<void>} work Request callback.
 * @returns {Promise<void>} Resolves after the callback finishes.
 */
async function performAction(key, work) {
	if (actionKey.value) return;
	actionKey.value = key;
	clearFeedback();
	try {
		await work();
	} catch (error) {
		handleApiError(error);
	} finally {
		actionKey.value = '';
	}
}

/**
 * Calls the block API and attaches structured response data to failures.
 *
 * @param {string} url API URL.
 * @param {{method?: string, body?: Record<string, unknown>}} [optionsInput] Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed API response.
 */
async function requestJson(url, optionsInput = {}) {
	const response = await fetch(url, {
		method: optionsInput.method || 'GET',
		headers: optionsInput.body ? { 'Content-Type': 'application/json' } : undefined,
		body: optionsInput.body ? JSON.stringify(optionsInput.body) : undefined,
	});
	const payload = await response.json();
	if (!response.ok || payload.error) {
		const error = new Error(payload.message || 'The request could not be completed.');
		error.payload = payload;
		error.status = response.status;
		throw error;
	}
	return payload;
}

/**
 * Maps API validation and conflict responses into recoverable UI state.
 *
 * @param {Error & {payload?: Record<string, unknown>, status?: number}} error Request failure.
 * @returns {void}
 */
function handleApiError(error) {
	const payload = error?.payload || {};
	errorMessage.value = payload.message || error?.message || 'Something went wrong.';
	fieldErrors.value = payload.fields || {};
	if (payload.error === 'revision_conflict' && payload.transaction) {
		applyTransaction(payload.transaction);
		errorMessage.value = `${payload.message} Fresh server state has been loaded.`;
	}
}

/**
 * Clears global and field-level feedback before an action.
 *
 * @returns {void}
 */
function clearFeedback() {
	errorMessage.value = '';
	successMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Formats a monetary amount for the active transaction currency.
 *
 * @param {number} value Monetary amount.
 * @returns {string} Formatted currency.
 */
function formatMoney(value) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: activeTransaction.value?.currency || 'GBP',
		minimumFractionDigits: Number(value) % 1 ? 2 : 0,
		maximumFractionDigits: 2,
	}).format(Number(value) || 0);
}

/**
 * Formats a transaction timestamp for compact queue copy.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Localized date and time.
 */
function formatDateTime(value) {
	if (!value) return '—';
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}

/**
 * Formats an ISO date for deadline copy.
 *
 * @param {string} value ISO calendar date.
 * @returns {string} Localized date.
 */
function formatDate(value) {
	if (!value) return 'Not available';
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00Z`));
}

/**
 * Maps event status to a DOM Studio status-pill tone.
 *
 * @param {string} status Event status.
 * @returns {string} Semantic tone.
 */
function eventTone(status) {
	if (status === 'approved') return 'success';
	if (status === 'blocked') return 'danger';
	return 'warning';
}
</script>

<template>
	<div class="flex h-dvh w-full flex-col overflow-hidden bg-canvas text-canvas-fg">
		<header class="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-3">
			<div class="min-w-0">
				<div class="flex items-center gap-2">
					<h1 class="truncate text-base font-semibold">{{ workspace?.name || 'Dispute operations' }}</h1>
					<DomBadge tone="neutral" variant="outline">{{ workspace?.transactionCount || 0 }} charges</DomBadge>
				</div>
				<p class="truncate text-xs text-muted-fg">{{ workspace?.actor }} · {{ workspace?.role }}</p>
			</div>
			<div class="flex shrink-0 items-center gap-2">
				<span class="hidden text-xs text-muted-fg sm:inline">API-backed demo</span>
				<DomButton size="sm" variant="secondary" :loading="actionKey === 'reset'" @click="resetDemo">Reset demo</DomButton>
			</div>
		</header>

		<div v-if="loading" class="grid min-h-0 flex-1 gap-px bg-border min-[760px]:grid-cols-[18rem_minmax(0,1fr)] min-[1120px]:grid-cols-[18rem_minmax(0,1fr)_20rem]">
			<div v-for="panel in 3" :key="panel" class="space-y-4 bg-canvas p-4" :class="panel === 1 ? 'hidden min-[760px]:block' : panel === 3 ? 'hidden min-[1120px]:block' : ''">
				<DomSkeleton class="h-8 w-2/3" />
				<DomSkeleton class="h-24 w-full" />
				<DomSkeleton class="h-20 w-full" />
				<DomSkeleton class="h-20 w-full" />
			</div>
		</div>

		<main v-else-if="activeTransaction" class="grid min-h-0 flex-1 min-[760px]:grid-cols-[18rem_minmax(0,1fr)] min-[1120px]:grid-cols-[18rem_minmax(0,1fr)_20rem]">
			<aside class="hidden min-h-0 border-r border-border min-[760px]:flex min-[760px]:flex-col">
				<div class="space-y-3 border-b border-border p-4">
					<DomTextInput v-model="searchQuery" label="Search transactions" hide-label placeholder="Merchant or descriptor" />
					<DomSelect v-model="caseStatusFilter" label="Case status" hide-label :options="options.caseStatuses" />
				</div>
				<div class="min-h-0 flex-1 overflow-y-auto">
					<button
						v-for="transaction in filteredTransactions"
						:key="transaction.id"
						type="button"
						class="w-full border-b border-border px-4 py-3 text-left transition hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
						:class="transaction.id === activeTransaction.id && 'bg-secondary'"
						:aria-current="transaction.id === activeTransaction.id ? 'true' : undefined"
						@click="selectTransaction(transaction.id)"
					>
						<span class="flex items-start justify-between gap-3">
							<span class="min-w-0">
								<span class="block truncate text-sm font-semibold">{{ transaction.merchant }}</span>
								<span class="mt-0.5 block truncate text-xs text-muted-fg">{{ transaction.category }} · {{ formatDateTime(transaction.postedAt) }}</span>
							</span>
							<span class="shrink-0 text-sm font-semibold">{{ formatMoney(transaction.amount) }}</span>
						</span>
						<span class="mt-3 flex items-center justify-between gap-3">
							<DomStatusPill :tone="transaction.claimStatusMeta.tone" :label="transaction.claimStatusMeta.label" size="sm" />
							<span class="text-xs text-muted-fg">r{{ transaction.revision }}</span>
						</span>
					</button>
					<DomEmptyState v-if="!filteredTransactions.length" title="No matching charges" description="Change the rich status filter or search text." />
				</div>
				<div class="border-t border-border p-4 text-xs leading-5 text-muted-fg">
					Eligibility and network filing rules are resolved by the server before submission.
				</div>
			</aside>

			<section class="flex min-h-0 min-w-0 flex-col border-r border-border">
				<div class="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-3">
					<div class="min-w-0">
						<div class="flex items-center gap-2">
							<h2 class="truncate text-base font-semibold">{{ activeTransaction.merchant }}</h2>
							<DomStatusPill :tone="activeTransaction.claimStatusMeta.tone" :label="activeTransaction.claimStatusMeta.label" size="sm" />
						</div>
						<p class="truncate text-xs text-muted-fg">{{ activeTransaction.descriptor }} · {{ activeTransaction.cardName }} •••• {{ activeTransaction.cardLast4 }} · revision {{ activeTransaction.revision }}</p>
					</div>
					<DomButton class="hidden min-[1120px]:inline-flex" size="sm" variant="secondary" :disabled="!currentReceipt" @click="inspectReceipt(currentReceipt)">Evidence</DomButton>
				</div>

				<div v-if="errorMessage || successMessage" class="shrink-0 px-4 pt-3">
					<DomAlert v-if="errorMessage" tone="danger" :title="errorMessage" :icon="false" />
					<DomAlert v-else tone="success" :title="successMessage" :icon="false" />
				</div>

				<DomTabs v-model="activeView" :tabs="viewTabs" variant="page" fill>
					<template #transactions>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="border-b border-border p-4 min-[760px]:hidden">
								<div class="grid gap-3 sm:grid-cols-2">
									<DomTextInput v-model="searchQuery" label="Search transactions" placeholder="Merchant or descriptor" />
									<DomSelect v-model="caseStatusFilter" label="Case status" :options="options.caseStatuses" />
								</div>
							</div>
							<div class="divide-y divide-border min-[760px]:hidden">
								<button v-for="transaction in filteredTransactions" :key="transaction.id" type="button" class="flex w-full items-start justify-between gap-4 px-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" @click="selectTransaction(transaction.id)">
									<span class="min-w-0"><span class="block truncate text-sm font-semibold">{{ transaction.merchant }}</span><span class="mt-1 block truncate text-xs text-muted-fg">{{ transaction.descriptor }} · {{ formatDateTime(transaction.postedAt) }}</span><DomStatusPill class="mt-2" :tone="transaction.claimStatusMeta.tone" :label="transaction.claimStatusMeta.label" size="sm" /></span>
									<span class="shrink-0 text-sm font-semibold">{{ formatMoney(transaction.amount) }}</span>
								</button>
							</div>

							<div class="mx-auto max-w-4xl p-4 sm:p-6">
								<div class="grid gap-6 min-[900px]:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
									<section>
										<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Selected charge</p>
										<p class="mt-3 text-3xl font-semibold tracking-tight">{{ formatMoney(activeTransaction.amount) }}</p>
										<h3 class="mt-4 text-xl font-semibold">{{ activeTransaction.merchant }}</h3>
										<p class="mt-1 text-sm text-muted-fg">{{ activeTransaction.descriptor }} · {{ activeTransaction.category }}</p>
										<dl class="mt-6 divide-y divide-border border-y border-border text-sm">
											<div class="flex items-center justify-between gap-4 py-3"><dt class="text-muted-fg">Posted</dt><dd class="font-medium">{{ formatDateTime(activeTransaction.postedAt) }}</dd></div>
											<div class="flex items-center justify-between gap-4 py-3"><dt class="text-muted-fg">Card</dt><dd class="font-medium">{{ activeTransaction.cardName }} •••• {{ activeTransaction.cardLast4 }}</dd></div>
											<div class="flex items-center justify-between gap-4 py-3"><dt class="text-muted-fg">Filing deadline</dt><dd class="font-medium">{{ formatDate(activeTransaction.deadline) }}</dd></div>
											<div class="flex items-center justify-between gap-4 py-3"><dt class="text-muted-fg">Card status</dt><dd class="font-medium capitalize">{{ activeTransaction.cardStatus }}</dd></div>
										</dl>
									</section>

									<section class="border-l-2 pl-4" :class="activeTransaction.eligible ? 'border-success' : 'border-warning'">
										<DomBadge :tone="activeTransaction.eligible ? 'success' : 'warning'" variant="outline">{{ activeTransaction.eligible ? 'Eligible now' : 'Not eligible yet' }}</DomBadge>
										<h3 class="mt-3 text-lg font-semibold">{{ activeTransaction.eligible ? 'Start with a structured claim' : 'Wait for the transaction to post' }}</h3>
										<p class="mt-2 text-sm leading-6 text-muted-fg">{{ activeTransaction.eligible ? 'The server has confirmed the network window. Capture the reason, statement, evidence, and protection decision before filing.' : 'Pending authorizations can still reverse or change amount. The API blocks dispute intake until posting.' }}</p>
										<DomButton class="mt-5" :disabled="!activeTransaction.eligible" @click="activeView = 'claim'">{{ claim ? 'Continue claim' : 'Start dispute' }}</DomButton>
									</section>
								</div>
							</div>
						</div>
					</template>

					<template #claim>
						<form class="min-h-0 flex-1 overflow-y-auto" @submit.prevent="saveClaim">
							<div class="mx-auto max-w-3xl p-4 sm:p-6">
								<div class="flex items-start justify-between gap-4 border-b border-border pb-4">
									<div><h3 class="text-lg font-semibold">Dispute intake</h3><p class="mt-1 text-sm text-muted-fg">Structured answers map directly to eligibility and network evidence.</p></div>
									<DomBadge :tone="claimDirty ? 'warning' : 'success'" variant="outline">{{ claimDirty ? 'Unsaved' : 'Synced' }}</DomBadge>
								</div>

								<DomAlert v-if="!activeTransaction.eligible" class="mt-4" tone="warning" title="This transaction is not ready for dispute intake" description="Only posted transactions inside the server-owned filing window can be edited." />
								<DomAlert v-else-if="claim?.status === 'submitted'" class="mt-4" tone="info" title="Submitted evidence is immutable" description="Open the Case view to inspect the filing receipt and operations handoff." />

								<div class="mt-6 grid gap-5">
									<DomSelect v-model="claimForm.reasonCode" label="What happened?" :options="options.reasons" :errors="fieldErrors.reasonCode || []" :disabled="!canEditClaim">
										<template #option="{ option }"><span><span class="block font-medium">{{ option.label }}</span><span class="block text-xs text-muted-fg">{{ option.description }}</span></span></template>
									</DomSelect>
									<DomTextareaInput v-model="claimForm.statement" label="Customer statement" description="Include dates, contact attempts, order numbers, and why the charge should be disputed." :rows="5" :errors="fieldErrors.statement || []" :disabled="!canEditClaim" />
								</div>

								<div class="mt-7">
									<h4 class="text-sm font-semibold">Structured answers</h4>
									<div class="mt-2 divide-y divide-border border-y border-border">
										<DomToggle v-model="claimForm.cardInPossession" class="flex w-full flex-row-reverse justify-between py-4" label="Card is still with me" description="Helps distinguish credential compromise from a lost card." :disabled="!canEditClaim" />
										<DomToggle v-model="claimForm.recognizesMerchant" class="flex w-full flex-row-reverse justify-between py-4" label="Merchant is recognized" description="Useful for amount, duplicate, cancellation, or fulfilment issues." :disabled="!canEditClaim" />
										<DomToggle v-model="claimForm.merchantContacted" class="flex w-full flex-row-reverse justify-between py-4" label="Merchant was contacted" description="Required for some merchant-service dispute reasons." :disabled="!canEditClaim" />
									</div>
								</div>

								<div class="mt-7">
									<h4 class="text-sm font-semibold">Protection requested at submission</h4>
									<div class="mt-2 divide-y divide-border border-y border-border">
										<DomToggle v-model="claimForm.requestedFreeze" class="flex w-full flex-row-reverse justify-between py-4" label="Freeze the card" description="Block new authorizations when this claim is filed." :disabled="!canEditClaim" />
										<DomToggle v-model="claimForm.requestedReplacement" class="flex w-full flex-row-reverse justify-between py-4" label="Request replacement" description="Issue new credentials for suspected compromise." :disabled="!canEditClaim" />
									</div>
								</div>

								<div class="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
									<p class="text-xs text-muted-fg">{{ selectedReason?.description }}</p>
									<div class="flex gap-2"><DomButton type="button" variant="ghost" :disabled="!claimDirty" @click="syncClaimForm">Discard</DomButton><DomButton type="submit" :loading="actionKey === 'save-claim'" :disabled="!canEditClaim || !claimDirty">Save draft</DomButton></div>
								</div>
							</div>
						</form>
					</template>

					<template #evidence>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="mx-auto max-w-3xl p-4 sm:p-6">
								<div class="flex items-start justify-between gap-4 border-b border-border pb-4">
									<div><h3 class="text-lg font-semibold">Evidence packet</h3><p class="mt-1 text-sm text-muted-fg">Verified metadata represents the files sent to dispute operations.</p></div>
									<DomButton size="sm" :disabled="!activeTransaction.capabilities.canAddEvidence" @click="openEvidenceDialog">Add evidence</DomButton>
								</div>

								<div v-if="evidenceItems.length" class="mt-4 divide-y divide-border border-y border-border">
									<article v-for="item in evidenceItems" :key="item.id" class="flex items-start justify-between gap-4 py-4">
										<div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><h4 class="text-sm font-semibold">{{ item.typeLabel }}</h4><DomStatusPill tone="success" :label="item.status" size="sm" /></div><p class="mt-1 truncate text-sm text-muted-fg">{{ item.reference }}</p><p v-if="item.note" class="mt-1 text-xs leading-5 text-muted-fg">{{ item.note }}</p><p class="mt-2 font-mono text-[11px] text-muted-fg">{{ item.checksum }}</p></div>
										<DomButton size="sm" variant="ghost" :loading="actionKey === `remove-${item.id}`" :disabled="!activeTransaction.capabilities.canAddEvidence" @click="removeEvidence(item.id)">Remove</DomButton>
									</article>
								</div>
								<DomEmptyState v-else class="mt-8" title="No evidence attached" description="Add at least one verified evidence record before running submission checks."><template #actions><DomButton :disabled="!activeTransaction.capabilities.canAddEvidence" @click="openEvidenceDialog">Add first evidence</DomButton></template></DomEmptyState>

								<DomAlert class="mt-6" tone="info" title="Production evidence boundary" description="Real files belong in private object storage with malware scanning, redaction, retention, and immutable checksums. This demo models the complete metadata contract." />
							</div>
						</div>
					</template>

					<template #case>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="mx-auto max-w-4xl p-4 sm:p-6">
								<template v-if="caseSubmission">
									<div class="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
										<div><p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Submitted case</p><h3 class="mt-2 text-3xl font-semibold tracking-tight">{{ caseSubmission.caseNumber }}</h3><p class="mt-2 text-sm text-muted-fg">{{ caseSubmission.queue }} · {{ formatDateTime(caseSubmission.submittedAt) }}</p></div>
										<DomStatusPill tone="success" label="Submitted" />
									</div>

									<div class="mt-6 grid gap-6 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(16rem,0.75fr)]">
										<section><h4 class="text-sm font-semibold">Network handoff</h4><dl class="mt-3 divide-y divide-border border-y border-border text-sm"><div class="py-3"><dt class="text-xs text-muted-fg">Reason code</dt><dd class="mt-1 font-medium">{{ caseSubmission.networkReasonCode }}</dd></div><div class="py-3"><dt class="text-xs text-muted-fg">Service level</dt><dd class="mt-1 font-medium">{{ caseSubmission.serviceLevel }}</dd></div><div class="py-3"><dt class="text-xs text-muted-fg">Evidence locked</dt><dd class="mt-1 font-medium">{{ evidenceItems.length }} verified item{{ evidenceItems.length === 1 ? '' : 's' }}</dd></div><div class="py-3"><dt class="text-xs text-muted-fg">Card protection</dt><dd class="mt-1 font-medium capitalize">{{ claim.protection.status.replaceAll('_', ' ') }}</dd></div></dl></section>
										<section class="border-l-2 border-success pl-4"><DomBadge :tone="caseSubmission.provisionalCredit.status === 'issued' ? 'success' : 'warning'" variant="outline">{{ caseSubmission.provisionalCredit.status.replaceAll('_', ' ') }}</DomBadge><h4 class="mt-3 text-lg font-semibold">{{ caseSubmission.provisionalCredit.status === 'issued' ? `${formatMoney(caseSubmission.provisionalCredit.amount)} credited` : 'Operations decision required' }}</h4><p class="mt-2 text-sm leading-6 text-muted-fg">{{ caseSubmission.provisionalCredit.reason }}</p><DomButton class="mt-5" size="sm" variant="secondary" :disabled="!currentReceipt" @click="inspectReceipt(currentReceipt)">Inspect filing receipt</DomButton></section>
									</div>
								</template>

								<DomEmptyState v-else title="No submitted case yet" description="Save the claim, add evidence, run server checks, and confirm the declaration before filing."><template #actions><DomButton variant="secondary" @click="activeView = 'claim'">Review claim</DomButton><DomButton :disabled="!canSubmit" @click="openSubmitDialog">Submit dispute</DomButton></template></DomEmptyState>
							</div>
						</div>
					</template>
				</DomTabs>
			</section>

			<aside class="hidden min-h-0 overflow-y-auto min-[1120px]:block">
				<div class="space-y-6 p-4">
					<section>
						<div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Submission readiness</p><p class="mt-1 text-sm font-semibold">{{ preflight ? `${passedChecks} of ${preflightChecks.length} checks` : 'Not checked' }}</p></div><DomBadge :tone="preflight?.ready ? 'success' : 'neutral'" variant="outline">{{ preflight?.ready ? 'Ready' : `${readinessPercent}%` }}</DomBadge></div>
						<DomProgress class="mt-3" :value="readinessPercent" :show-label="false" label="Submission readiness" :tone="preflight?.ready ? 'success' : 'primary'" />
						<div class="mt-4 grid gap-2"><DomButton class="justify-center" variant="secondary" :loading="actionKey === 'preflight'" :disabled="!canRunPreflight" @click="runPreflight">Run submission checks</DomButton><DomButton class="justify-center" :loading="actionKey === 'submit'" :disabled="!canSubmit" @click="openSubmitDialog">Submit dispute</DomButton></div>
					</section>

					<section v-if="preflightChecks.length" class="border-t border-border pt-5">
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Server checks</p>
						<div class="mt-3 divide-y divide-border border-y border-border">
							<div v-for="check in preflightChecks" :key="check.key" class="py-3"><div class="flex items-center justify-between gap-3"><p class="text-sm font-medium">{{ check.label }}</p><DomStatusPill :tone="check.status === 'passed' ? 'success' : 'danger'" :label="check.status" size="sm" /></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div>
						</div>
					</section>

					<section class="border-t border-border pt-5">
						<div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Card protection</p><p class="mt-1 text-sm font-semibold capitalize">{{ claim?.protection?.status?.replaceAll('_', ' ') || 'Not configured' }}</p></div><DomStatusPill :tone="activeTransaction.cardStatus === 'frozen' ? 'warning' : 'success'" :label="activeTransaction.cardStatus" size="sm" /></div>
						<DomButton class="mt-3 w-full justify-center" size="sm" variant="secondary" :disabled="!claim || claim?.protection?.freezeApplied" @click="openProtectionDialog">Protect card now</DomButton>
					</section>

					<section class="border-t border-border pt-5">
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Activity</p>
						<div class="mt-3 space-y-4"><div v-for="event in activeTransaction.events.slice(0, 4)" :key="event.id"><div class="flex items-start justify-between gap-3"><p class="text-sm font-medium">{{ event.title }}</p><DomStatusPill :tone="eventTone(event.status)" :label="event.status" size="sm" /></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p><p class="mt-1 text-[11px] text-muted-fg">{{ formatDateTime(event.createdAt) }}</p></div></div>
					</section>

					<section v-if="currentReceipt" class="border-t border-border pt-5"><p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Latest evidence</p><p class="mt-2 text-sm font-medium">{{ currentReceipt.type.replaceAll('_', ' ') }}</p><p class="mt-1 text-xs text-muted-fg">Revision {{ currentReceipt.revision }} · {{ formatDateTime(currentReceipt.createdAt) }}</p><DomButton class="mt-3" size="sm" variant="secondary" @click="inspectReceipt(currentReceipt)">Inspect receipt</DomButton></section>
				</div>
			</aside>
		</main>

		<DomDialog v-model="evidenceDialogOpen" title="Add evidence" description="Create a verified evidence record for the current dispute draft.">
			<div class="grid gap-4">
				<DomSelect v-model="evidenceForm.type" label="Evidence type" :options="options.evidenceTypes" :errors="fieldErrors.type || []"><template #option="{ option }"><span><span class="block font-medium">{{ option.label }}</span><span class="block text-xs text-muted-fg">{{ option.description }}</span></span></template></DomSelect>
				<DomTextInput v-model="evidenceForm.reference" label="File or record reference" :errors="fieldErrors.reference || []" />
				<DomTextareaInput v-model="evidenceForm.note" label="Evidence note" :rows="3" :errors="fieldErrors.note || []" />
			</div>
			<template #footer><DomButton variant="ghost" data-close>Cancel</DomButton><DomButton :loading="actionKey === 'add-evidence'" @click="addEvidence">Verify and add</DomButton></template>
		</DomDialog>

		<DomDialog v-model="protectionDialogOpen" title="Protect this card" :description="`${activeTransaction?.cardName} •••• ${activeTransaction?.cardLast4}`">
			<DomAlert tone="warning" :icon="false" title="New authorizations can stop immediately" description="Replacement also freezes the current credentials and starts a separate issuance lifecycle." />
			<div class="mt-4 divide-y divide-border border-y border-border"><DomToggle v-model="protectionForm.freeze" class="flex w-full flex-row-reverse justify-between py-4" label="Freeze the card" description="Block new card authorizations now." /><DomToggle v-model="protectionForm.replace" class="flex w-full flex-row-reverse justify-between py-4" label="Request replacement" description="Issue new card credentials after fraud review." /></div>
			<DomTextareaInput v-model="protectionForm.reason" class="mt-4" label="Audit reason" :rows="3" :errors="fieldErrors.reason || []" />
			<template #footer><DomButton variant="ghost" data-close>Cancel</DomButton><DomButton variant="danger" :loading="actionKey === 'protection'" @click="applyProtection">Apply protection</DomButton></template>
		</DomDialog>

		<DomDialog v-model="submitDialogOpen" title="Submit dispute" :description="`File ${formatMoney(activeTransaction?.amount)} at ${activeTransaction?.merchant}.`">
			<div class="divide-y divide-border border-y border-border text-sm"><div class="flex items-start justify-between gap-4 py-3"><span class="text-muted-fg">Reason</span><span class="max-w-64 text-right font-medium">{{ selectedReason?.label }}</span></div><div class="flex items-start justify-between gap-4 py-3"><span class="text-muted-fg">Evidence</span><span class="font-medium">{{ evidenceItems.length }} verified item{{ evidenceItems.length === 1 ? '' : 's' }}</span></div><div class="flex items-start justify-between gap-4 py-3"><span class="text-muted-fg">Protection</span><span class="font-medium">{{ claimForm.requestedReplacement ? 'Freeze and replace' : claimForm.requestedFreeze ? 'Freeze card' : 'No action' }}</span></div></div>
			<DomCheckbox v-model="submissionAcknowledged" class="mt-5" label="I confirm the statement and evidence are accurate and can be submitted to dispute operations." :errors="fieldErrors.acknowledged || []" />
			<template #footer><DomButton variant="ghost" data-close>Keep editing</DomButton><DomButton :loading="actionKey === 'submit'" @click="submitDispute">Submit dispute</DomButton></template>
		</DomDialog>

		<DomDialog v-model="receiptDialogOpen" title="Mutation evidence" description="Immutable receipt returned by the repository-local dispute API."><DomJsonViewer :value="receipt || {}" :expanded-depth="3" /><template #footer><DomButton data-close>Done</DomButton></template></DomDialog>
	</div>
</template>
