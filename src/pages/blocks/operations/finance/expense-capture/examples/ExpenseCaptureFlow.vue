<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomActionSheet,
	DomAlert,
	DomAppBottomNav,
	DomAppListItem,
	DomAppShell,
	DomAppTopBar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDatePicker,
	DomEmptyState,
	DomJsonViewer,
	DomMoneyInput,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/expense-capture';
const evidenceTabs = [
	{ key: 'evidence', label: 'Evidence' },
	{ key: 'activity', label: 'Activity' },
];
const receiptActions = [
	{ label: 'Re-run camera extraction', description: 'Create a fresh OCR receipt from the current image', value: 'camera' },
	{ label: 'Upload replacement file', description: 'Replace evidence and run verification again', value: 'upload' },
	{ label: 'Match an emailed receipt', description: 'Simulate provider email matching', value: 'email' },
];

const workspace = ref(null);
const selectedExpense = ref(null);
const expenses = ref([]);
const catalogs = ref({ categories: [], projects: [], paymentMethods: [] });
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const activeView = ref('details');
const evidenceTab = ref('evidence');
const receiptSheetOpen = ref(false);
const submitAcknowledged = ref(false);
const draftMerchant = ref('');
const draftAmount = ref('');
const draftSpentAt = ref('');
const draftCategoryId = ref('');
const draftProjectId = ref('');
const draftPaymentMethodId = ref('');
const draftTaxIncluded = ref(true);
const draftMemo = ref('');

const mobileNavigation = computed(() => [
	{ value: 'inbox', label: 'Inbox', badge: String(workspace.value?.counts?.needsAction || '') },
	{ value: 'details', label: 'Details' },
	{ value: 'checks', label: 'Checks', badge: selectedExpense.value?.blockers ? String(selectedExpense.value.blockers) : '' },
]);
const previewEvidence = computed(() => selectedExpense.value?.submission
	? {
		preview: selectedExpense.value.preview,
		submission: selectedExpense.value.submission,
	}
	: selectedExpense.value?.preview || null);
const receiptAlt = computed(() => selectedExpense.value
	? `${selectedExpense.value.merchant} receipt evidence for ${formatMoney(selectedExpense.value.amount, selectedExpense.value.currency)}`
	: 'Receipt evidence');
const nextStageLabel = computed(() => {
	if (selectedExpense.value?.submission?.status === 'awaiting_approval') return 'Record manager approval';
	if (selectedExpense.value?.submission?.status === 'approved') return selectedExpense.value.reimbursable ? 'Schedule reimbursement' : 'Export to NetSuite';
	return 'Workflow complete';
});
const submitLabel = computed(() => selectedExpense.value?.reimbursable ? 'Submit reimbursement' : 'Submit card expense');

onMounted(loadWorkspace);

/**
 * Loads the complete expense inbox from the repository-local API.
 *
 * @param {boolean} clearMessages Whether visible feedback should be cleared first.
 * @returns {Promise<void>}
 */
async function loadWorkspace(clearMessages = true) {
	if (clearMessages) clearFeedback();
	loading.value = true;
	try {
		const response = await fetch(`${apiBase}/bootstrap`);
		const data = await response.json();
		if (!response.ok) throw createRequestError(data, response.status);
		setWorkspace(data);
	} catch (requestError) {
		error.value = requestError.message || 'Unable to load the expense inbox.';
	} finally {
		loading.value = false;
	}
}

/**
 * Sends one JSON mutation and applies the authoritative workspace response.
 *
 * @param {string} path API path below the expense-capture base URL.
 * @param {Record<string, unknown>} body JSON request body.
 * @param {string} action Stable busy-state key.
 * @returns {Promise<Record<string, unknown> | null>} Updated payload or null after failure.
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
		setWorkspace(data);
		return data;
	} catch (requestError) {
		error.value = requestError.message || 'Expense action failed.';
		if (requestError.status === 409) await refreshAfterConflict();
		return null;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Reloads authoritative server state after an exact-revision conflict.
 *
 * @returns {Promise<void>}
 */
async function refreshAfterConflict() {
	try {
		const response = await fetch(`${apiBase}/bootstrap`);
		const data = await response.json();
		if (response.ok) setWorkspace(data);
	} catch {
		// Preserve the original conflict message when recovery also fails.
	}
}

/**
 * Replaces client state and aligns the detail editor with API evidence.
 *
 * @param {Record<string, unknown>} data Authoritative expense workspace.
 * @returns {void}
 */
function setWorkspace(data) {
	workspace.value = data.workspace;
	expenses.value = data.expenses || [];
	selectedExpense.value = data.selectedExpense || null;
	catalogs.value = data.catalogs || { categories: [], projects: [], paymentMethods: [] };
	if (selectedExpense.value) setDraft(selectedExpense.value);
	if (!selectedExpense.value?.preview) submitAcknowledged.value = false;
}

/**
 * Copies one selected expense into editable DOM Studio fields.
 *
 * @param {Record<string, unknown>} expense Selected expense.
 * @returns {void}
 */
function setDraft(expense) {
	draftMerchant.value = expense.merchant || '';
	draftAmount.value = String(expense.amount ?? '');
	draftSpentAt.value = expense.spentAt || '';
	draftCategoryId.value = expense.categoryId || '';
	draftProjectId.value = expense.projectId || '';
	draftPaymentMethodId.value = expense.paymentMethodId || '';
	draftTaxIncluded.value = Boolean(expense.taxIncluded);
	draftMemo.value = expense.memo || '';
}

/**
 * Selects an expense from the inbox at the current workspace revision.
 *
 * @param {string} expenseId Stable expense identifier.
 * @returns {Promise<void>}
 */
async function selectExpense(expenseId) {
	if (!workspace.value || expenseId === selectedExpense.value?.id || busyAction.value) return;
	const data = await mutateWorkspace('/select', {
		revision: workspace.value.revision,
		expenseId,
	}, 'select-expense');
	if (data) {
		activeView.value = 'details';
		evidenceTab.value = 'evidence';
		notice.value = `${data.selectedExpense.merchant} opened at version ${data.selectedExpense.version}.`;
	}
}

/**
 * Saves the current editable fields and asks the API to re-evaluate policy.
 *
 * @returns {Promise<void>}
 */
async function saveDetails() {
	if (!workspace.value || !selectedExpense.value) return;
	const data = await mutateWorkspace(`/expenses/${selectedExpense.value.id}/details`, {
		revision: workspace.value.revision,
		expenseVersion: selectedExpense.value.version,
		merchant: draftMerchant.value,
		amount: draftAmount.value,
		spentAt: draftSpentAt.value,
		categoryId: draftCategoryId.value,
		projectId: draftProjectId.value,
		paymentMethodId: draftPaymentMethodId.value,
		taxIncluded: draftTaxIncluded.value,
		memo: draftMemo.value,
	}, 'save-details');
	if (data) notice.value = `Version ${data.selectedExpense.version} saved and policy re-evaluated.`;
}

/**
 * Re-runs receipt extraction through one simulated provider source.
 *
 * @param {string} source Receipt source.
 * @returns {Promise<void>}
 */
async function refreshReceipt(source) {
	receiptSheetOpen.value = false;
	if (!workspace.value || !selectedExpense.value) return;
	const data = await mutateWorkspace(`/expenses/${selectedExpense.value.id}/receipt/refresh`, {
		revision: workspace.value.revision,
		expenseVersion: selectedExpense.value.version,
		source,
	}, 'refresh-receipt');
	if (data) {
		activeView.value = 'checks';
		notice.value = `${data.selectedExpense.receipt.providerReceipt} verified the receipt at ${data.selectedExpense.receipt.confidence}% confidence.`;
	}
}

/**
 * Applies the suggested card transaction match.
 *
 * @returns {Promise<void>}
 */
async function confirmTransactionMatch() {
	if (!workspace.value || !selectedExpense.value) return;
	const data = await mutateWorkspace(`/expenses/${selectedExpense.value.id}/match`, {
		revision: workspace.value.revision,
		expenseVersion: selectedExpense.value.version,
	}, 'confirm-match');
	if (data) notice.value = `${data.selectedExpense.transactionMatch.id} is now authoritative payment evidence.`;
}

/**
 * Creates an immutable preview after server-owned policy checks pass.
 *
 * @returns {Promise<void>}
 */
async function previewSubmission() {
	if (!workspace.value || !selectedExpense.value) return;
	const data = await mutateWorkspace(`/expenses/${selectedExpense.value.id}/preview`, {
		revision: workspace.value.revision,
		expenseVersion: selectedExpense.value.version,
	}, 'preview-submission');
	if (data) {
		activeView.value = 'checks';
		evidenceTab.value = 'evidence';
		notice.value = `${data.selectedExpense.preview.checksum} locked the submission route.`;
	}
}

/**
 * Submits the exact previewed expense after acknowledgement.
 *
 * @returns {Promise<void>}
 */
async function submitExpense() {
	if (!workspace.value || !selectedExpense.value?.preview) return;
	const data = await mutateWorkspace(`/expenses/${selectedExpense.value.id}/submit`, {
		revision: workspace.value.revision,
		expenseVersion: selectedExpense.value.version,
		previewChecksum: selectedExpense.value.preview.checksum,
		acknowledged: submitAcknowledged.value,
	}, 'submit-expense');
	if (data) {
		submitAcknowledged.value = false;
		notice.value = `${data.selectedExpense.submission.id} is awaiting ${data.selectedExpense.submission.approver}.`;
	}
}

/**
 * Advances manager approval or final accounting settlement by one step.
 *
 * @returns {Promise<void>}
 */
async function advanceExpenseWorkflow() {
	if (!workspace.value || !selectedExpense.value) return;
	const data = await mutateWorkspace(`/expenses/${selectedExpense.value.id}/advance`, {
		revision: workspace.value.revision,
		expenseVersion: selectedExpense.value.version,
	}, 'advance-expense');
	if (data) notice.value = data.message;
}

/**
 * Restores the deterministic demo workspace.
 *
 * @returns {Promise<void>}
 */
async function resetDemo() {
	const data = await mutateWorkspace('/reset', {}, 'reset-demo');
	if (data) {
		activeView.value = 'details';
		evidenceTab.value = 'evidence';
		notice.value = 'Expense inbox restored to its initial state.';
	}
}

/**
 * Applies one action selected from the receipt action sheet.
 *
 * @param {{value?: string}} action Selected action.
 * @returns {void}
 */
function handleReceiptAction(action) {
	if (action?.value) refreshReceipt(action.value);
}

/**
 * Clears visible success and error feedback.
 *
 * @returns {void}
 */
function clearFeedback() {
	error.value = '';
	notice.value = '';
}

/**
 * Creates an Error carrying response status and field messages.
 *
 * @param {Record<string, unknown>} data Error payload.
 * @param {number} status HTTP status.
 * @returns {Error & {status: number}} Request error.
 */
function createRequestError(data, status) {
	const fieldMessages = Object.values(data.fields || {}).flat().join(' ');
	const requestError = new Error([data.message, fieldMessages].filter(Boolean).join(' ') || `Request failed with status ${status}.`);
	requestError.status = status;
	return requestError;
}

/**
 * Formats a money amount for the selected currency.
 *
 * @param {number|string} amount Numeric amount.
 * @param {string} currency ISO currency code.
 * @returns {string} Localized money string.
 */
function formatMoney(amount, currency = 'GBP') {
	return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(Number(amount || 0));
}

/**
 * Formats an ISO date for compact expense rows.
 *
 * @param {string} value ISO date.
 * @returns {string} Human date.
 */
function formatDate(value) {
	if (!value) return '';
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00Z`));
}

/**
 * Returns status-pill tone for a policy check.
 *
 * @param {string} status Policy status.
 * @returns {string} Semantic tone.
 */
function policyTone(status) {
	if (status === 'passed') return 'success';
	if (status === 'warning') return 'warning';
	return 'danger';
}
</script>

<template>
	<DomAppShell variant="app" class="!h-dvh">
		<template #top>
			<DomAppTopBar title="Spend inbox" :subtitle="selectedExpense ? `${selectedExpense.merchant} · ${formatMoney(selectedExpense.amount, selectedExpense.currency)}` : 'Receipt capture'">
				<template #leading>
					<div class="grid size-9 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-fg" aria-hidden="true">FX</div>
				</template>
				<template #trailing>
					<DomBadge v-if="workspace" tone="neutral" variant="soft">r{{ workspace.revision }}</DomBadge>
					<DomButton size="sm" variant="secondary" :loading="busyAction === 'reset-demo'" @click="resetDemo">Reset</DomButton>
				</template>
			</DomAppTopBar>
		</template>

		<div class="flex h-full min-h-0 flex-col overflow-hidden">
			<div v-if="error || notice" class="absolute inset-x-3 top-3 z-10 mx-auto max-w-2xl">
				<DomAlert v-if="error" tone="danger" variant="toast" title="Expense action failed" :description="error" dismissible @dismiss="error = ''" />
				<DomAlert v-else tone="success" variant="toast" title="Expense updated" :description="notice" dismissible @dismiss="notice = ''" />
			</div>

			<div v-if="loading" class="grid h-full gap-0 lg:grid-cols-[17rem_minmax(0,1fr)_21rem]">
				<div v-for="index in 3" :key="index" class="space-y-4 border-r border-border p-4 last:border-r-0">
					<DomSkeleton height="h-8" width="w-2/3" />
					<DomSkeleton v-for="row in 5" :key="row" height="h-16" />
				</div>
			</div>

			<div v-else-if="workspace && selectedExpense" class="grid h-full min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[17rem_minmax(0,1fr)_21rem]">
				<aside class="h-full min-h-0 overflow-y-auto border-r border-border" :class="activeView === 'inbox' ? 'block' : 'hidden lg:block'" aria-label="Expense inbox">
					<div class="border-b border-border px-4 py-4">
						<div class="flex items-end justify-between gap-3">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Needs attention</p>
								<p class="mt-1 text-2xl font-semibold">{{ workspace.counts.needsAction }}</p>
							</div>
							<DomStatusPill tone="warning" label="Open" size="sm" />
						</div>
						<p class="mt-3 text-xs leading-5 text-muted-fg">Receipts, card matches, coding, and reimbursement drafts in one queue.</p>
					</div>
					<DomAppListItem
						v-for="expense in expenses"
						:key="expense.id"
						:label="expense.merchant"
						:description="`${formatDate(expense.spentAt)} · ${formatMoney(expense.amount, expense.currency)}`"
						:meta="expense.statusMeta.label"
						:selected="expense.id === selectedExpense.id"
						@click="selectExpense(expense.id)"
					>
						<template #icon>
							<span class="text-sm font-semibold">{{ expense.merchant.slice(0, 2).toUpperCase() }}</span>
						</template>
						<template #trailing>
							<div class="flex items-center gap-1">
								<DomBadge v-if="expense.blockers" tone="danger" size="sm">{{ expense.blockers }}</DomBadge>
								<DomBadge v-else-if="expense.warnings" tone="warning" size="sm">{{ expense.warnings }}</DomBadge>
							</div>
						</template>
					</DomAppListItem>
				</aside>

				<section class="flex h-full min-h-0 flex-col overflow-hidden" :class="activeView === 'details' ? 'flex' : 'hidden lg:flex'" aria-labelledby="expense-details-heading">
					<header class="shrink-0 border-b border-border px-4 py-4 sm:px-6">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<DomStatusPill :tone="selectedExpense.statusMeta.tone" :label="selectedExpense.statusMeta.label" size="sm" />
									<DomBadge tone="neutral" variant="soft">v{{ selectedExpense.version }}</DomBadge>
									<DomBadge v-if="selectedExpense.warnings" tone="warning" variant="soft">{{ selectedExpense.warnings }} policy note</DomBadge>
								</div>
								<h2 id="expense-details-heading" class="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{{ selectedExpense.merchant }}</h2>
								<p class="mt-1 text-sm text-muted-fg">{{ selectedExpense.id }} · captured by {{ workspace.actor.name }}</p>
							</div>
							<p class="text-2xl font-semibold tracking-tight">{{ formatMoney(selectedExpense.amount, selectedExpense.currency) }}</p>
						</div>
					</header>

					<div class="min-h-0 flex-1 overflow-y-auto">
						<section class="border-b border-border bg-secondary/25 px-4 py-4 sm:px-6" aria-labelledby="transaction-match-heading">
							<div class="flex flex-wrap items-center justify-between gap-3">
								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ selectedExpense.transactionMatch.status === 'matched' ? 'Matched payment evidence' : 'Suggested payment evidence' }}</p>
									<h3 id="transaction-match-heading" class="mt-1 text-sm font-semibold">{{ selectedExpense.transactionMatch.id || 'Employee-funded expense' }}</h3>
									<p class="mt-1 text-xs text-muted-fg">
										<span v-if="selectedExpense.transactionMatch.id">{{ selectedExpense.transactionMatch.score }}% match · {{ selectedExpense.transactionMatch.merchant }} · card {{ selectedExpense.transactionMatch.cardLast4 }}</span>
										<span v-else>No company-card match is required for this route.</span>
									</p>
								</div>
								<DomButton
									v-if="selectedExpense.capabilities.canConfirmMatch"
									size="sm"
									:loading="busyAction === 'confirm-match'"
									@click="confirmTransactionMatch"
								>Confirm card match</DomButton>
								<DomStatusPill v-else :tone="selectedExpense.transactionMatch.status === 'matched' ? 'success' : 'neutral'" :label="selectedExpense.transactionMatch.status === 'matched' ? 'Matched' : 'Not required'" size="sm" />
							</div>
						</section>

						<form class="grid gap-5 px-4 py-5 sm:grid-cols-2 sm:px-6" @submit.prevent="saveDetails">
							<DomTextInput v-model="draftMerchant" label="Merchant" :disabled="!selectedExpense.capabilities.canEdit" />
							<DomMoneyInput v-model="draftAmount" label="Total" currency="GBP" :disabled="!selectedExpense.capabilities.canEdit" />
							<DomDatePicker v-model="draftSpentAt" label="Purchase date" date-format="dd/mm/yyyy" :disabled="!selectedExpense.capabilities.canEdit" />
							<DomSelect v-model="draftCategoryId" label="Category" :options="catalogs.categories" searchable :disabled="!selectedExpense.capabilities.canEdit" />
							<DomSelect v-model="draftProjectId" label="Project" :options="catalogs.projects" searchable :disabled="!selectedExpense.capabilities.canEdit" />
							<DomSelect v-model="draftPaymentMethodId" label="Payment method" :options="catalogs.paymentMethods" :disabled="!selectedExpense.capabilities.canEdit" />
							<div class="sm:col-span-2">
								<DomToggle v-model="draftTaxIncluded" label="VAT included" description="Keep receipt tax evidence with the accounting entry." :disabled="!selectedExpense.capabilities.canEdit" />
							</div>
							<div class="sm:col-span-2">
								<DomTextareaInput v-model="draftMemo" label="Business purpose" description="Give the approver enough context to understand who benefited and why." :rows="3" :disabled="!selectedExpense.capabilities.canEdit" />
							</div>
						</form>
					</div>

					<footer class="shrink-0 border-t border-border bg-canvas px-4 py-3 sm:px-6">
						<div v-if="selectedExpense.capabilities.canEdit" class="flex flex-wrap justify-end gap-2">
							<DomButton variant="secondary" :loading="busyAction === 'save-details'" @click="saveDetails">Save details</DomButton>
							<DomButton :loading="busyAction === 'preview-submission'" @click="previewSubmission">Review submission</DomButton>
						</div>
						<div v-else class="flex items-center justify-between gap-3">
							<p class="text-xs text-muted-fg">Editing is locked after submission.</p>
							<DomButton v-if="selectedExpense.capabilities.canAdvance" :loading="busyAction === 'advance-expense'" @click="advanceExpenseWorkflow">{{ nextStageLabel }}</DomButton>
						</div>
					</footer>
				</section>

				<aside class="flex h-full min-h-0 flex-col overflow-hidden border-l border-border" :class="activeView === 'checks' ? 'flex' : 'hidden lg:flex'" aria-label="Receipt and policy evidence">
					<div class="relative h-64 shrink-0 overflow-hidden border-b border-border bg-secondary/50 lg:h-[42%] lg:min-h-64">
						<img
							v-if="selectedExpense.receipt?.url"
							:src="selectedExpense.receipt.url"
							:alt="receiptAlt"
							class="h-full w-full object-cover object-center"
						/>
						<DomEmptyState
							v-else
							class="m-4"
							size="sm"
							:title="selectedExpense.receipt ? 'PDF receipt retained' : 'Receipt required'"
							:description="selectedExpense.receipt ? `${selectedExpense.receipt.filename} is verified and retained as provider evidence.` : 'Attach receipt evidence before this expense can be submitted.'"
						/>
						<div v-if="selectedExpense.receipt" class="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-xl border border-white/20 bg-black/70 px-3 py-2 text-white backdrop-blur">
							<div class="min-w-0">
								<p class="truncate text-xs font-semibold">{{ selectedExpense.receipt.filename }}</p>
								<p class="mt-0.5 text-[11px] text-white/70">{{ selectedExpense.receipt.confidence }}% OCR · {{ selectedExpense.receipt.providerReceipt }}</p>
							</div>
							<DomButton size="sm" variant="secondary" :disabled="!selectedExpense.capabilities.canEdit" @click="receiptSheetOpen = true">Receipt</DomButton>
						</div>
					</div>

					<DomTabs v-model="evidenceTab" :tabs="evidenceTabs" variant="page" fill class="min-h-0 flex-1">
						<template #evidence>
							<div class="h-full min-h-0 overflow-y-auto p-4">
								<div class="flex items-center justify-between gap-3">
									<div>
										<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Policy engine</p>
										<p class="mt-1 text-sm font-semibold">{{ selectedExpense.blockers ? `${selectedExpense.blockers} ${selectedExpense.blockers === 1 ? 'blocker' : 'blockers'}` : 'Ready for review' }}</p>
									</div>
									<DomStatusPill :tone="selectedExpense.blockers ? 'danger' : selectedExpense.warnings ? 'warning' : 'success'" :label="selectedExpense.blockers ? 'Blocked' : selectedExpense.warnings ? 'Review' : 'Passed'" size="sm" />
								</div>

								<div class="mt-4 divide-y divide-border border-y border-border">
									<div v-for="check in selectedExpense.policyChecks" :key="check.key" class="flex gap-3 py-3">
										<DomStatusPill :tone="policyTone(check.status)" :label="check.status" size="sm" class="mt-0.5" />
										<div class="min-w-0">
											<p class="text-sm font-semibold">{{ check.label }}</p>
											<p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p>
										</div>
									</div>
								</div>

								<div v-if="selectedExpense.preview" class="mt-5 border-t border-border pt-5">
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Immutable route</p>
									<p class="mt-2 text-sm font-semibold">{{ selectedExpense.preview.route }}</p>
									<dl class="mt-3 divide-y divide-border text-xs">
										<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Approver</dt><dd class="text-right font-semibold">{{ selectedExpense.preview.approver }}</dd></div>
										<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Payout</dt><dd class="text-right font-semibold">{{ selectedExpense.preview.payout }}</dd></div>
										<div class="flex justify-between gap-3 py-2"><dt class="text-muted-fg">Checksum</dt><dd class="max-w-44 truncate text-right font-mono">{{ selectedExpense.preview.checksum }}</dd></div>
									</dl>
									<DomCheckbox
										v-if="selectedExpense.capabilities.canSubmit"
										v-model="submitAcknowledged"
										class="mt-4"
										label="Submit this exact route"
										:description="selectedExpense.preview.payout"
									/>
									<DomButton
										v-if="selectedExpense.capabilities.canSubmit"
										class="mt-4 w-full"
										:disabled="!submitAcknowledged"
										:loading="busyAction === 'submit-expense'"
										@click="submitExpense"
									>{{ submitLabel }}</DomButton>
								</div>

								<div v-if="selectedExpense.submission" class="mt-5">
									<DomAlert
										:tone="selectedExpense.submission.status === 'awaiting_approval' ? 'info' : 'success'"
										:title="selectedExpense.statusMeta.label"
										:description="`${selectedExpense.submission.id} · ${selectedExpense.submission.providerReceipt}`"
									>
										<template v-if="selectedExpense.capabilities.canAdvance" #actions>
											<DomButton size="sm" :loading="busyAction === 'advance-expense'" @click="advanceExpenseWorkflow">{{ nextStageLabel }}</DomButton>
										</template>
									</DomAlert>
									<DomJsonViewer class="mt-4" :value="previewEvidence" title="Workflow evidence" :filename="`${selectedExpense.id}-evidence.json`" density="compact" :preview-lines="10" />
								</div>
							</div>
						</template>

						<template #activity>
							<div class="h-full min-h-0 overflow-y-auto p-4">
								<div v-for="item in selectedExpense.activity" :key="item.id" class="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-b border-border py-4 first:pt-0 last:border-b-0">
									<DomStatusPill :tone="item.tone" label="" size="sm" class="mt-0.5" />
									<div>
										<p class="text-sm font-semibold">{{ item.title }}</p>
										<p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.detail }}</p>
										<p class="mt-2 text-[11px] text-muted-fg">{{ item.actor }}</p>
									</div>
								</div>
							</div>
						</template>
					</DomTabs>
				</aside>
			</div>
		</div>

		<template #bottom>
			<DomAppBottomNav v-model="activeView" :items="mobileNavigation" class="lg:hidden" />
		</template>

		<template #overlay>
			<DomActionSheet
				v-model="receiptSheetOpen"
				title="Receipt evidence"
				description="Re-run the deterministic evidence pipeline through a supported source."
				:actions="receiptActions"
				@select="handleReceiptAction"
			/>
		</template>
	</DomAppShell>
</template>
