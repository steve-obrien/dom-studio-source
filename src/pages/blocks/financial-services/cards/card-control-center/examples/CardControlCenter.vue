<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomConfirmationCodeInput,
	DomDatePicker,
	DomDialog,
	DomEmptyState,
	DomJsonViewer,
	DomMoneyInput,
	DomProgress,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomToggle,
} from '@getdom/studio/vue';

const API_BASE = '/api/block-demos/card-control-center';
const viewTabs = [
	{ key: 'cards', label: 'Cards' },
	{ key: 'controls', label: 'Controls' },
	{ key: 'activity', label: 'Activity' },
];

const loading = ref(true);
const actionKey = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const fieldErrors = ref({});
const workspace = ref(null);
const cards = ref([]);
const activeCard = ref(null);
const options = ref({
	cadences: [],
	merchantProfiles: [],
	destinations: [],
	replacementReasons: [],
	deliverySpeeds: [],
	activityTypes: [],
	activityStatuses: [],
});
const activeView = ref('cards');
const activityType = ref('all');
const activityStatus = ref('all');
const statusDialogOpen = ref(false);
const travelDialogOpen = ref(false);
const revealDialogOpen = ref(false);
const replacementDialogOpen = ref(false);
const evidenceDialogOpen = ref(false);
const evidence = ref(null);
const revealChallenge = ref(null);
const revealCode = ref('');
const revealedDetails = ref(null);
const revealedUntil = ref('');

const policyForm = reactive({
	limit: '',
	cadence: 'monthly',
	merchantProfile: 'software-travel',
	controls: {
		onlinePayments: true,
		contactless: true,
		atmWithdrawals: false,
		internationalPayments: true,
	},
});

const statusForm = reactive({ action: 'freeze', reason: '' });
const travelForm = reactive({ destination: '', startsOn: '', endsOn: '', note: '' });
const replacementForm = reactive({ reason: '', delivery: '', note: '', acknowledged: false });

const spendPercent = computed(() => activeCard.value?.policyMeta?.percentUsed || 0);
const filteredActivity = computed(getFilteredActivity);
const currentReceipt = computed(() => activeCard.value?.latestReceipt || null);
const statusActionLabel = computed(() => (activeCard.value?.status === 'frozen' ? 'Unfreeze card' : 'Freeze card'));
const statusActionTone = computed(() => (activeCard.value?.status === 'frozen' ? 'primary' : 'danger'));
const policyDirty = computed(() => {
	if (!activeCard.value) return false;
	const policy = activeCard.value.policy;
	return Number(policyForm.limit) !== Number(policy.limit)
		|| policyForm.cadence !== policy.cadence
		|| policyForm.merchantProfile !== policy.merchantProfile
		|| policyForm.controls.onlinePayments !== policy.onlinePayments
		|| policyForm.controls.contactless !== policy.contactless
		|| policyForm.controls.atmWithdrawals !== policy.atmWithdrawals
		|| policyForm.controls.internationalPayments !== policy.internationalPayments;
});

onMounted(loadBootstrap);

/**
 * Loads the card fleet and selected card from the repository-local API.
 *
 * @returns {Promise<void>} Resolves after the initial workspace is ready.
 */
async function loadBootstrap() {
	loading.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`${API_BASE}/bootstrap`);
		applyBootstrap(payload);
	} catch (error) {
		handleApiError(error);
	} finally {
		loading.value = false;
	}
}

/**
 * Applies a complete bootstrap response to the workspace.
 *
 * @param {Record<string, unknown>} payload API bootstrap response.
 * @returns {void}
 */
function applyBootstrap(payload) {
	workspace.value = payload.workspace;
	cards.value = payload.cards || [];
	options.value = payload.options || options.value;
	applyCard(payload.selectedCard);
}

/**
 * Loads a selected card without discarding fleet-level state.
 *
 * @param {string} cardId Stable card identifier.
 * @returns {Promise<void>} Resolves after the card is selected.
 */
async function selectCard(cardId) {
	if (activeCard.value?.id === cardId || actionKey.value) return;
	await performAction('select-card', async () => {
		const payload = await requestJson(`${API_BASE}/cards/${cardId}`);
		applyCard(payload.card);
		activeView.value = 'cards';
		successMessage.value = `${payload.card.name} selected.`;
	});
}

/**
 * Applies fresh server card state and aligns all editing forms.
 *
 * @param {Record<string, unknown>} card Public card record.
 * @returns {void}
 */
function applyCard(card) {
	if (!card) return;
	activeCard.value = card;
	const index = cards.value.findIndex((candidate) => candidate.id === card.id);
	if (index >= 0) cards.value.splice(index, 1, {
		...cards.value[index],
		id: card.id,
		name: card.name,
		holder: card.holder,
		type: card.type,
		last4: card.last4,
		status: card.status,
		statusMeta: card.statusMeta,
		spent: card.spent,
		limit: card.policy.limit,
		currency: card.currency,
		revision: card.revision,
	});
	syncPolicyForm();
	fieldErrors.value = {};
}

/**
 * Copies server-owned policy fields into the editable DOM Studio controls.
 *
 * @returns {void}
 */
function syncPolicyForm() {
	if (!activeCard.value) return;
	const policy = activeCard.value.policy;
	policyForm.limit = String(policy.limit);
	policyForm.cadence = policy.cadence;
	policyForm.merchantProfile = policy.merchantProfile;
	policyForm.controls.onlinePayments = policy.onlinePayments;
	policyForm.controls.contactless = policy.contactless;
	policyForm.controls.atmWithdrawals = policy.atmWithdrawals;
	policyForm.controls.internationalPayments = policy.internationalPayments;
}

/**
 * Persists the current spend and authorization policy.
 *
 * @returns {Promise<void>} Resolves after the policy update finishes.
 */
async function savePolicy() {
	if (!activeCard.value || !policyDirty.value) return;
	await performAction('save-policy', async () => {
		const payload = await requestJson(`${API_BASE}/cards/${activeCard.value.id}/policy`, {
			method: 'PATCH',
			body: {
				revision: activeCard.value.revision,
				limit: Number(policyForm.limit),
				cadence: policyForm.cadence,
				merchantProfile: policyForm.merchantProfile,
				controls: { ...policyForm.controls },
			},
		});
		applyCard(payload.card);
		evidence.value = payload.receipt;
		successMessage.value = payload.message;
	});
}

/**
 * Opens the freeze or unfreeze confirmation with a sensible default reason.
 *
 * @returns {void}
 */
function openStatusDialog() {
	if (!activeCard.value?.capabilities.canEdit) return;
	statusForm.action = activeCard.value.status === 'frozen' ? 'unfreeze' : 'freeze';
	statusForm.reason = statusForm.action === 'freeze'
		? 'Cardholder requested an immediate temporary block.'
		: 'Cardholder confirmed the card is secure and ready to use.';
	fieldErrors.value = {};
	statusDialogOpen.value = true;
}

/**
 * Submits an auditable freeze or unfreeze request.
 *
 * @returns {Promise<void>} Resolves after the status mutation finishes.
 */
async function submitStatus() {
	await performAction('status', async () => {
		const payload = await requestJson(`${API_BASE}/cards/${activeCard.value.id}/status`, {
			method: 'POST',
			body: {
				revision: activeCard.value.revision,
				action: statusForm.action,
				reason: statusForm.reason,
			},
		});
		applyCard(payload.card);
		evidence.value = payload.receipt;
		statusDialogOpen.value = false;
		successMessage.value = payload.message;
	});
}

/**
 * Opens a fresh travel notice form.
 *
 * @returns {void}
 */
function openTravelDialog() {
	if (!activeCard.value?.capabilities.canEdit) return;
	travelForm.destination = options.value.destinations[0]?.value || '';
	travelForm.startsOn = '2026-08-12';
	travelForm.endsOn = '2026-08-18';
	travelForm.note = '';
	fieldErrors.value = {};
	travelDialogOpen.value = true;
}

/**
 * Persists a dated travel notice through the API.
 *
 * @returns {Promise<void>} Resolves after the travel notice is created.
 */
async function submitTravelNotice() {
	await performAction('travel', async () => {
		const payload = await requestJson(`${API_BASE}/cards/${activeCard.value.id}/travel-notices`, {
			method: 'POST',
			body: {
				revision: activeCard.value.revision,
				...travelForm,
			},
		});
		applyCard(payload.card);
		evidence.value = payload.receipt;
		travelDialogOpen.value = false;
		successMessage.value = payload.message;
	});
}

/**
 * Opens the secure details flow in its initial challenge state.
 *
 * @returns {void}
 */
function openRevealDialog() {
	if (!activeCard.value?.capabilities.canReveal) return;
	revealChallenge.value = null;
	revealCode.value = '';
	revealedDetails.value = null;
	revealedUntil.value = '';
	fieldErrors.value = {};
	revealDialogOpen.value = true;
}

/**
 * Requests a server-owned one-time verification challenge.
 *
 * @returns {Promise<void>} Resolves after the challenge is created.
 */
async function startRevealChallenge() {
	await performAction('reveal-start', async () => {
		const payload = await requestJson(`${API_BASE}/cards/${activeCard.value.id}/reveal-challenges`, {
			method: 'POST',
			body: { revision: activeCard.value.revision },
		});
		revealChallenge.value = payload.challenge;
		revealCode.value = '';
		successMessage.value = payload.message;
	});
}

/**
 * Confirms the one-time code and shows short-lived card details.
 *
 * @returns {Promise<void>} Resolves after verification finishes.
 */
async function confirmRevealChallenge() {
	if (!revealChallenge.value) return;
	await performAction('reveal-confirm', async () => {
		const payload = await requestJson(`${API_BASE}/cards/${activeCard.value.id}/reveal-challenges/${revealChallenge.value.id}`, {
			method: 'POST',
			body: {
				revision: activeCard.value.revision,
				code: revealCode.value,
			},
		});
		revealedDetails.value = payload.details;
		revealedUntil.value = payload.revealedUntil;
		evidence.value = payload.receipt;
		applyCard(payload.card);
		successMessage.value = payload.message;
	});
}

/**
 * Opens a replacement order with default delivery settings.
 *
 * @returns {void}
 */
function openReplacementDialog() {
	if (!activeCard.value?.capabilities.canReplace) return;
	replacementForm.reason = options.value.replacementReasons[0]?.value || '';
	replacementForm.delivery = options.value.deliverySpeeds[0]?.value || '';
	replacementForm.note = '';
	replacementForm.acknowledged = false;
	fieldErrors.value = {};
	replacementDialogOpen.value = true;
}

/**
 * Orders a replacement card with lifecycle evidence.
 *
 * @returns {Promise<void>} Resolves after the replacement request finishes.
 */
async function submitReplacement() {
	await performAction('replacement', async () => {
		const payload = await requestJson(`${API_BASE}/cards/${activeCard.value.id}/replacement`, {
			method: 'POST',
			body: {
				revision: activeCard.value.revision,
				...replacementForm,
			},
		});
		applyCard(payload.card);
		evidence.value = payload.receipt;
		replacementDialogOpen.value = false;
		successMessage.value = payload.message;
	});
}

/**
 * Opens the latest immutable mutation evidence in a JSON inspector.
 *
 * @param {Record<string, unknown>} receipt Receipt to inspect.
 * @returns {void}
 */
function showEvidence(receipt) {
	if (!receipt) return;
	evidence.value = receipt;
	evidenceDialogOpen.value = true;
}

/**
 * Restores the seeded fleet and clears transient dialogs.
 *
 * @returns {Promise<void>} Resolves after the workspace is restored.
 */
async function resetDemo() {
	await performAction('reset', async () => {
		const payload = await requestJson(`${API_BASE}/reset`, { method: 'POST' });
		applyBootstrap(payload);
		activeView.value = 'cards';
		statusDialogOpen.value = false;
		travelDialogOpen.value = false;
		revealDialogOpen.value = false;
		replacementDialogOpen.value = false;
		evidenceDialogOpen.value = false;
		successMessage.value = 'Demo workspace restored.';
	});
}

/**
 * Runs a mutation with shared request, validation, and busy-state handling.
 *
 * @param {string} key Stable action key.
 * @param {() => Promise<void>} work Mutation callback.
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
	if (payload.error === 'revision_conflict' && payload.card) {
		applyCard(payload.card);
		errorMessage.value = `${payload.message} Fresh server state has been loaded.`;
	}
}

/**
 * Clears global and field-level feedback before a new action.
 *
 * @returns {void}
 */
function clearFeedback() {
	errorMessage.value = '';
	successMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Builds the combined and filtered activity feed.
 *
 * @returns {Array<Record<string, unknown>>} Sorted activity rows.
 */
function getFilteredActivity() {
	if (!activeCard.value) return [];
	const transactions = activeCard.value.transactions.map((transaction) => ({
		...transaction,
		kind: 'transactions',
		title: transaction.merchant,
		detail: `${transaction.category} · ${transaction.location}`,
		createdAt: transaction.occurredAt,
	}));
	const controls = activeCard.value.events.map((event) => ({ ...event, kind: 'controls' }));
	return [...transactions, ...controls]
		.filter((item) => activityType.value === 'all' || item.kind === activityType.value)
		.filter((item) => activityStatus.value === 'all' || item.status === activityStatus.value)
		.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

/**
 * Formats a GBP amount without fractional pence when unnecessary.
 *
 * @param {number} value Monetary amount.
 * @returns {string} Formatted currency.
 */
function formatMoney(value) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: activeCard.value?.currency || 'GBP',
		minimumFractionDigits: Number(value) % 1 ? 2 : 0,
		maximumFractionDigits: 2,
	}).format(Number(value) || 0);
}

/**
 * Formats a timestamp for compact activity rows.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Local date and time.
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
 * Formats an ISO calendar date for product copy.
 *
 * @param {string} value ISO date.
 * @returns {string} Localized calendar date.
 */
function formatDate(value) {
	if (!value) return '—';
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00Z`));
}

/**
 * Resolves a semantic status tone for activity rows.
 *
 * @param {string} status Activity status.
 * @returns {string} DOM Studio tone.
 */
function activityTone(status) {
	return { approved: 'success', declined: 'danger', pending: 'warning' }[status] || 'neutral';
}
</script>

<template>
	<div class="flex h-dvh w-full min-w-0 flex-col overflow-hidden bg-canvas text-canvas-fg">
		<header class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
			<div class="min-w-0">
				<div class="flex items-center gap-2">
					<h1 class="truncate text-sm font-semibold">Aster card operations</h1>
					<DomBadge v-if="workspace" tone="neutral" variant="outline" size="sm">{{ workspace.cardCount }} cards</DomBadge>
				</div>
				<p class="truncate text-xs text-muted-fg">{{ workspace ? `${workspace.actor} · ${workspace.role}` : 'Loading workspace' }}</p>
			</div>
			<div class="flex shrink-0 items-center gap-2">
				<span class="hidden text-xs text-muted-fg sm:inline">API-backed demo</span>
				<DomButton size="sm" variant="secondary" :loading="actionKey === 'reset'" @click="resetDemo">Reset demo</DomButton>
			</div>
		</header>

		<div v-if="loading" class="grid min-h-0 flex-1 gap-px bg-border min-[760px]:grid-cols-[17rem_minmax(0,1fr)] min-[1120px]:grid-cols-[17rem_minmax(0,1fr)_20rem]">
			<div v-for="panel in 3" :key="panel" class="space-y-4 bg-canvas p-4" :class="panel === 1 ? 'hidden min-[760px]:block' : panel === 3 ? 'hidden min-[1120px]:block' : ''">
				<DomSkeleton class="h-8 w-2/3" />
				<DomSkeleton class="h-32 w-full" />
				<DomSkeleton class="h-16 w-full" />
				<DomSkeleton class="h-16 w-full" />
			</div>
		</div>

		<main v-else-if="activeCard" class="grid min-h-0 flex-1 min-[760px]:grid-cols-[17rem_minmax(0,1fr)] min-[1120px]:grid-cols-[17rem_minmax(0,1fr)_20rem]">
			<aside class="hidden min-h-0 border-r border-border min-[760px]:flex min-[760px]:flex-col">
				<div class="border-b border-border p-4">
					<p class="text-xs font-medium text-muted-fg">Available balance</p>
					<p class="mt-1 text-2xl font-semibold tracking-tight">{{ formatMoney(workspace.availableBalance) }}</p>
				</div>
				<div class="min-h-0 flex-1 overflow-y-auto">
					<button
						v-for="card in cards"
						:key="card.id"
						type="button"
						class="w-full border-b border-border px-4 py-3 text-left transition hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
						:class="card.id === activeCard.id && 'bg-secondary'"
						:aria-current="card.id === activeCard.id ? 'true' : undefined"
						@click="selectCard(card.id)"
					>
						<span class="flex items-start justify-between gap-3">
							<span class="min-w-0">
								<span class="block truncate text-sm font-semibold">{{ card.name }}</span>
								<span class="mt-0.5 block text-xs text-muted-fg">{{ card.type }} · •••• {{ card.last4 }}</span>
							</span>
							<DomStatusPill :tone="card.statusMeta.tone" :label="card.statusMeta.label" size="sm" />
						</span>
						<span class="mt-3 flex items-center justify-between text-xs text-muted-fg">
							<span>{{ formatMoney(card.spent) }} spent</span>
							<span>{{ formatMoney(card.limit) }} limit</span>
						</span>
					</button>
				</div>
				<div class="border-t border-border p-4 text-xs leading-5 text-muted-fg">
					Controls are revisioned and processor-authorized before the UI changes.
				</div>
			</aside>

			<section class="flex min-h-0 min-w-0 flex-col border-r border-border">
				<div class="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-3">
					<div class="min-w-0">
						<div class="flex items-center gap-2">
							<h2 class="truncate text-base font-semibold">{{ activeCard.name }}</h2>
							<DomStatusPill :tone="activeCard.statusMeta.tone" :label="activeCard.statusMeta.label" size="sm" />
						</div>
						<p class="truncate text-xs text-muted-fg">{{ activeCard.holder }} · {{ activeCard.type }} •••• {{ activeCard.last4 }} · revision {{ activeCard.revision }}</p>
					</div>
					<DomButton class="hidden min-[1120px]:inline-flex" size="sm" variant="secondary" :disabled="!currentReceipt" @click="showEvidence(currentReceipt)">Evidence</DomButton>
				</div>

				<div v-if="errorMessage || successMessage" class="shrink-0 px-4 pt-3">
					<DomAlert v-if="errorMessage" tone="danger" :title="errorMessage" :icon="false" />
					<DomAlert v-else tone="success" :title="successMessage" :icon="false" />
				</div>

				<DomTabs v-model="activeView" :tabs="viewTabs" variant="page" fill>
					<template #cards>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="border-b border-border min-[760px]:hidden">
								<p class="px-4 pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-fg">Card fleet</p>
								<div class="flex snap-x gap-3 overflow-x-auto px-4 pb-4">
									<button
										v-for="card in cards"
										:key="card.id"
										type="button"
										class="w-52 shrink-0 snap-start border border-border bg-canvas p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										:class="card.id === activeCard.id && 'border-primary bg-primary/5'"
										@click="selectCard(card.id)"
									>
										<span class="flex items-start justify-between gap-2">
											<span class="truncate text-sm font-semibold">{{ card.name }}</span>
											<DomStatusPill :tone="card.statusMeta.tone" :label="card.statusMeta.label" size="sm" />
										</span>
										<span class="mt-3 block text-xs text-muted-fg">•••• {{ card.last4 }} · {{ formatMoney(card.spent) }} spent</span>
									</button>
								</div>
							</div>

							<div class="grid gap-6 p-4 min-[900px]:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
								<div class="space-y-4">
									<section class="aspect-[1.58/1] w-full max-w-md overflow-hidden rounded-2xl bg-canvas-fg p-5 text-canvas shadow-lg">
										<div class="flex h-full flex-col justify-between">
											<div class="flex items-start justify-between gap-4">
												<div>
													<p class="text-xs font-semibold tracking-[0.18em] text-canvas/60">ASTER BUSINESS</p>
													<p class="mt-2 text-lg font-semibold">{{ activeCard.name }}</p>
												</div>
												<DomBadge :tone="activeCard.statusMeta.tone" variant="solid" size="sm">{{ activeCard.statusMeta.label }}</DomBadge>
											</div>
											<div>
												<p class="font-mono text-xl tracking-[0.24em]">•••• {{ activeCard.last4 }}</p>
												<div class="mt-3 flex items-end justify-between gap-4 text-xs text-canvas/70">
													<span>{{ activeCard.holder }}</span>
													<span>EXP {{ activeCard.expiry }}</span>
												</div>
											</div>
										</div>
									</section>

									<div class="grid grid-cols-3 divide-x divide-border border-y border-border py-3 text-center">
										<div class="px-2">
											<p class="text-xs text-muted-fg">Spent</p>
											<p class="mt-1 text-sm font-semibold">{{ formatMoney(activeCard.spent) }}</p>
										</div>
										<div class="px-2">
											<p class="text-xs text-muted-fg">Available</p>
											<p class="mt-1 text-sm font-semibold">{{ formatMoney(activeCard.policyMeta.remaining) }}</p>
										</div>
										<div class="px-2">
											<p class="text-xs text-muted-fg">Cadence</p>
											<p class="mt-1 text-sm font-semibold">{{ activeCard.policyMeta.cadenceLabel }}</p>
										</div>
									</div>

									<div class="min-[1120px]:hidden">
										<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-fg">Card actions</p>
										<div class="grid grid-cols-2 gap-2">
											<DomButton :variant="statusActionTone" :disabled="!activeCard.capabilities.canEdit" @click="openStatusDialog">{{ statusActionLabel }}</DomButton>
											<DomButton variant="secondary" :disabled="!activeCard.capabilities.canReveal" @click="openRevealDialog">Reveal details</DomButton>
											<DomButton variant="secondary" :disabled="!activeCard.capabilities.canEdit" @click="openTravelDialog">Travel notice</DomButton>
											<DomButton variant="secondary" :disabled="!activeCard.capabilities.canReplace" @click="openReplacementDialog">Replace card</DomButton>
										</div>
									</div>
								</div>

								<div class="min-w-0 space-y-6">
									<section>
										<div class="flex items-center justify-between gap-4">
											<div>
												<p class="text-sm font-semibold">Current spend</p>
												<p class="text-xs text-muted-fg">{{ activeCard.policyMeta.merchantProfileLabel }}</p>
											</div>
											<DomBadge tone="neutral" variant="outline">{{ spendPercent }}%</DomBadge>
										</div>
										<DomProgress class="mt-3" :value="spendPercent" :show-label="false" label="Spend limit used" :tone="spendPercent > 85 ? 'warning' : 'primary'" />
										<p class="mt-2 text-xs text-muted-fg">{{ formatMoney(activeCard.spent) }} of {{ formatMoney(activeCard.policy.limit) }} used this {{ activeCard.policy.cadence }}.</p>
									</section>

									<section v-if="activeCard.replacement" class="border-l-2 border-warning pl-4">
										<div class="flex items-center justify-between gap-3">
											<h3 class="text-sm font-semibold">Replacement in progress</h3>
											<DomStatusPill tone="warning" label="Ordered" size="sm" />
										</div>
										<p class="mt-1 text-sm text-muted-fg">New card •••• {{ activeCard.replacement.newLast4 }} is expected {{ formatDate(activeCard.replacement.expectedOn) }}.</p>
									</section>

									<section v-if="activeCard.travelNotices.length">
										<h3 class="text-sm font-semibold">Travel coverage</h3>
										<div v-for="notice in activeCard.travelNotices" :key="notice.id" class="mt-3 border-l-2 border-primary pl-4">
											<p class="text-sm font-medium">{{ notice.destinationLabel }}</p>
											<p class="text-xs text-muted-fg">{{ formatDate(notice.startsOn) }} – {{ formatDate(notice.endsOn) }}</p>
										</div>
									</section>

									<section>
										<div class="flex items-center justify-between gap-3">
											<h3 class="text-sm font-semibold">Recent transactions</h3>
											<DomButton size="sm" variant="ghost" @click="activeView = 'activity'">View all</DomButton>
										</div>
										<div class="mt-2 divide-y divide-border border-y border-border">
											<div v-for="transaction in activeCard.transactions.slice(0, 3)" :key="transaction.id" class="flex items-center justify-between gap-4 py-3">
												<div class="min-w-0">
													<p class="truncate text-sm font-medium">{{ transaction.merchant }}</p>
													<p class="truncate text-xs text-muted-fg">{{ transaction.category }} · {{ formatDateTime(transaction.occurredAt) }}</p>
												</div>
												<div class="shrink-0 text-right">
													<p class="text-sm font-semibold">{{ formatMoney(transaction.amount) }}</p>
													<DomStatusPill :tone="activityTone(transaction.status)" :label="transaction.status" size="sm" />
												</div>
											</div>
										</div>
									</section>
								</div>
							</div>
						</div>
					</template>

					<template #controls>
						<form class="min-h-0 flex-1 overflow-y-auto" @submit.prevent="savePolicy">
							<div class="mx-auto max-w-3xl p-4 sm:p-6">
								<div class="flex items-start justify-between gap-4 border-b border-border pb-4">
									<div>
										<h3 class="text-lg font-semibold">Authorization policy</h3>
										<p class="mt-1 text-sm text-muted-fg">Changes are validated against current spend and the card’s server-owned limit ceiling.</p>
									</div>
									<DomBadge :tone="policyDirty ? 'warning' : 'success'" variant="outline">{{ policyDirty ? 'Unsaved' : 'Synced' }}</DomBadge>
								</div>

								<DomAlert v-if="!activeCard.capabilities.canEdit" class="mt-4" tone="warning" title="Controls locked during replacement" description="The old credentials cannot be edited while the new card is being issued." />

								<div class="mt-6 grid gap-4 sm:grid-cols-2">
									<DomMoneyInput v-model="policyForm.limit" label="Spend limit" currency="GBP" :min="100" :max="activeCard.policy.maxLimit" :step="50" :errors="fieldErrors.limit || []" />
									<DomSelect v-model="policyForm.cadence" label="Reset cadence" :options="options.cadences" :errors="fieldErrors.cadence || []" />
									<DomSelect v-model="policyForm.merchantProfile" class="sm:col-span-2" label="Merchant policy" :options="options.merchantProfiles" :errors="fieldErrors.merchantProfile || []">
										<template #option="{ option }">
											<span class="min-w-0">
												<span class="block font-medium">{{ option.label }}</span>
												<span class="block text-xs text-muted-fg">{{ option.description }}</span>
											</span>
										</template>
									</DomSelect>
								</div>

								<div class="mt-7">
									<h4 class="text-sm font-semibold">Authorization controls</h4>
									<div class="mt-2 divide-y divide-border border-y border-border">
										<DomToggle v-model="policyForm.controls.onlinePayments" class="flex w-full flex-row-reverse justify-between py-4" label="Online payments" description="Web and in-app merchant authorizations." :disabled="!activeCard.capabilities.canEdit" />
										<DomToggle v-model="policyForm.controls.contactless" class="flex w-full flex-row-reverse justify-between py-4" label="Contactless" description="Tap-to-pay card-present purchases." :disabled="!activeCard.capabilities.canEdit" />
										<DomToggle v-model="policyForm.controls.atmWithdrawals" class="flex w-full flex-row-reverse justify-between py-4" label="Cash withdrawals" description="ATM access, subject to processor risk checks." :disabled="!activeCard.capabilities.canEdit" />
										<DomToggle v-model="policyForm.controls.internationalPayments" class="flex w-full flex-row-reverse justify-between py-4" label="International payments" description="Authorizations outside the account country." :disabled="!activeCard.capabilities.canEdit" />
									</div>
								</div>

								<div class="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
									<DomButton type="button" variant="ghost" :disabled="!policyDirty" @click="syncPolicyForm">Discard changes</DomButton>
									<DomButton type="submit" :loading="actionKey === 'save-policy'" :disabled="!policyDirty || !activeCard.capabilities.canEdit">Save policy</DomButton>
								</div>
							</div>
						</form>
					</template>

					<template #activity>
						<div class="min-h-0 flex-1 overflow-y-auto">
							<div class="sticky top-0 z-10 grid gap-3 border-b border-border bg-canvas p-4 sm:grid-cols-2">
								<DomSelect v-model="activityType" label="Activity type" :options="options.activityTypes" />
								<DomSelect v-model="activityStatus" label="Status" :options="options.activityStatuses" />
							</div>
							<div v-if="filteredActivity.length" class="divide-y divide-border">
								<article v-for="item in filteredActivity" :key="`${item.kind}-${item.id}`" class="flex items-start justify-between gap-4 px-4 py-4 sm:px-6">
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<h3 class="text-sm font-semibold">{{ item.title }}</h3>
											<DomBadge tone="neutral" variant="outline" size="sm">{{ item.kind === 'transactions' ? 'Transaction' : 'Control' }}</DomBadge>
										</div>
										<p class="mt-1 text-sm text-muted-fg">{{ item.detail }}</p>
										<p class="mt-1 text-xs text-muted-fg">{{ item.actor || activeCard.holder }} · {{ formatDateTime(item.createdAt) }}</p>
									</div>
									<div class="shrink-0 text-right">
										<p v-if="item.amount != null" class="mb-1 text-sm font-semibold">{{ formatMoney(item.amount) }}</p>
										<DomStatusPill :tone="activityTone(item.status)" :label="item.status" size="sm" />
									</div>
								</article>
							</div>
							<DomEmptyState v-else title="No matching activity" description="Change the rich activity filters to see another part of the card history." />
						</div>
					</template>
				</DomTabs>
			</section>

			<aside class="hidden min-h-0 overflow-y-auto min-[1120px]:block">
				<div class="space-y-6 p-4">
					<section>
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Card actions</p>
						<div class="mt-3 grid gap-2">
							<DomButton class="justify-center" :variant="statusActionTone" :disabled="!activeCard.capabilities.canEdit" @click="openStatusDialog">{{ statusActionLabel }}</DomButton>
							<DomButton class="justify-center" variant="secondary" :disabled="!activeCard.capabilities.canReveal" @click="openRevealDialog">Reveal details</DomButton>
							<DomButton class="justify-center" variant="secondary" :disabled="!activeCard.capabilities.canEdit" @click="openTravelDialog">Add travel notice</DomButton>
							<DomButton class="justify-center" variant="secondary" :disabled="!activeCard.capabilities.canReplace" @click="openReplacementDialog">Replace card</DomButton>
						</div>
					</section>

					<section class="border-t border-border pt-5">
						<div class="flex items-center justify-between gap-3">
							<div>
								<p class="text-sm font-semibold">{{ formatMoney(activeCard.policyMeta.remaining) }} available</p>
								<p class="text-xs text-muted-fg">{{ activeCard.policyMeta.cadenceLabel }} limit</p>
							</div>
							<DomBadge tone="neutral" variant="outline">{{ spendPercent }}%</DomBadge>
						</div>
						<DomProgress class="mt-3" :value="spendPercent" :show-label="false" label="Spend limit used" />
					</section>

					<section class="border-t border-border pt-5">
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Policy snapshot</p>
						<dl class="mt-3 divide-y divide-border text-sm">
							<div class="flex items-center justify-between gap-3 py-2"><dt class="text-muted-fg">Merchant policy</dt><dd class="max-w-40 text-right font-medium">{{ activeCard.policyMeta.merchantProfileLabel }}</dd></div>
							<div class="flex items-center justify-between gap-3 py-2"><dt class="text-muted-fg">Online</dt><dd class="font-medium">{{ activeCard.policy.onlinePayments ? 'Allowed' : 'Blocked' }}</dd></div>
							<div class="flex items-center justify-between gap-3 py-2"><dt class="text-muted-fg">Contactless</dt><dd class="font-medium">{{ activeCard.policy.contactless ? 'Allowed' : 'Blocked' }}</dd></div>
							<div class="flex items-center justify-between gap-3 py-2"><dt class="text-muted-fg">ATM</dt><dd class="font-medium">{{ activeCard.policy.atmWithdrawals ? 'Allowed' : 'Blocked' }}</dd></div>
							<div class="flex items-center justify-between gap-3 py-2"><dt class="text-muted-fg">International</dt><dd class="font-medium">{{ activeCard.policy.internationalPayments ? 'Allowed' : 'Blocked' }}</dd></div>
						</dl>
						<DomButton class="mt-3 w-full justify-center" size="sm" variant="ghost" @click="activeView = 'controls'">Edit controls</DomButton>
					</section>

					<section v-if="currentReceipt" class="border-t border-border pt-5">
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Latest evidence</p>
						<p class="mt-2 text-sm font-medium">{{ currentReceipt.type.replaceAll('_', ' ') }}</p>
						<p class="mt-1 text-xs text-muted-fg">Revision {{ currentReceipt.revision }} · {{ formatDateTime(currentReceipt.createdAt) }}</p>
						<DomButton class="mt-3" size="sm" variant="secondary" @click="showEvidence(currentReceipt)">Inspect receipt</DomButton>
					</section>
				</div>
			</aside>
		</main>

		<DomDialog v-model="statusDialogOpen" :title="statusActionLabel" :description="`${activeCard?.name} •••• ${activeCard?.last4}`">
			<DomAlert :tone="statusForm.action === 'freeze' ? 'warning' : 'info'" :icon="false" :title="statusForm.action === 'freeze' ? 'New authorizations will stop immediately' : 'New authorizations will be allowed again'" />
			<DomTextareaInput v-model="statusForm.reason" class="mt-4" label="Audit reason" :rows="3" :errors="fieldErrors.reason || []" />
			<template #footer>
				<DomButton variant="ghost" data-close>Cancel</DomButton>
				<DomButton :variant="statusActionTone" :loading="actionKey === 'status'" @click="submitStatus">{{ statusActionLabel }}</DomButton>
			</template>
		</DomDialog>

		<DomDialog v-model="travelDialogOpen" title="Add travel notice" :description="`Help ${activeCard?.holder} avoid false declines abroad.`">
			<div class="grid gap-4 sm:grid-cols-2">
				<DomSelect v-model="travelForm.destination" class="sm:col-span-2" label="Destination" :options="options.destinations" :errors="fieldErrors.destination || []">
					<template #option="{ option }">
						<span><span class="block font-medium">{{ option.label }}</span><span class="block text-xs text-muted-fg">{{ option.description }}</span></span>
					</template>
				</DomSelect>
				<DomDatePicker v-model="travelForm.startsOn" label="Starts" :errors="fieldErrors.startsOn || []" :calendar-props="{ min: '2026-08-02', max: '2027-12-31' }" />
				<DomDatePicker v-model="travelForm.endsOn" label="Ends" :errors="fieldErrors.endsOn || []" :calendar-props="{ min: travelForm.startsOn || '2026-08-02', max: '2027-12-31' }" />
				<DomTextareaInput v-model="travelForm.note" class="sm:col-span-2" label="Optional note" :rows="3" :errors="fieldErrors.note || []" placeholder="Purpose, contact, or itinerary context" />
			</div>
			<template #footer>
				<DomButton variant="ghost" data-close>Cancel</DomButton>
				<DomButton :loading="actionKey === 'travel'" @click="submitTravelNotice">Add notice</DomButton>
			</template>
		</DomDialog>

		<DomDialog v-model="revealDialogOpen" title="Reveal card details" description="Sensitive fields use a short-lived, single-use step-up challenge.">
			<div v-if="revealedDetails" class="space-y-4">
				<DomAlert tone="success" :icon="false" title="Verified for two minutes" :description="`Details expire ${formatDateTime(revealedUntil)}.`" />
				<div class="rounded-xl bg-canvas-fg p-5 font-mono text-canvas">
					<p class="text-lg tracking-wider">{{ revealedDetails.pan }}</p>
					<div class="mt-5 flex items-end justify-between gap-4 text-sm">
						<span>{{ revealedDetails.cardholder }}</span>
						<span>EXP {{ revealedDetails.expiry }} · CVC {{ revealedDetails.cvc }}</span>
					</div>
				</div>
			</div>
			<div v-else-if="revealChallenge" class="space-y-4">
				<DomAlert tone="info" :icon="false" title="Demo verification code" :description="`${revealChallenge.demoCode} · sent to ${revealChallenge.destination}`" />
				<DomConfirmationCodeInput v-model="revealCode" label="Six-digit verification code" character-set="numeric" :length="6" :separator-after="3" :errors="fieldErrors.code || []" />
			</div>
			<div v-else>
				<DomAlert tone="warning" :icon="false" title="Step-up verification required" description="The API will issue a five-minute, single-use challenge. Sensitive values are never returned in the bootstrap payload." />
			</div>
			<template #footer>
				<DomButton variant="ghost" data-close>Close</DomButton>
				<DomButton v-if="!revealChallenge && !revealedDetails" :loading="actionKey === 'reveal-start'" @click="startRevealChallenge">Send verification code</DomButton>
				<DomButton v-else-if="!revealedDetails" :loading="actionKey === 'reveal-confirm'" :disabled="revealCode.length !== 6" @click="confirmRevealChallenge">Verify and reveal</DomButton>
			</template>
		</DomDialog>

		<DomDialog v-model="replacementDialogOpen" title="Replace card" :description="`Order a new number for ${activeCard?.name}.`">
			<DomAlert tone="warning" :icon="false" title="Replacement changes the credential lifecycle" description="Lost, stolen, and compromised reasons freeze the old credentials immediately. Damaged cards remain active until the new card is activated." />
			<div class="mt-4 grid gap-4">
				<DomSelect v-model="replacementForm.reason" label="Reason" :options="options.replacementReasons" :errors="fieldErrors.reason || []">
					<template #option="{ option }"><span><span class="block font-medium">{{ option.label }}</span><span class="block text-xs text-muted-fg">{{ option.description }}</span></span></template>
				</DomSelect>
				<DomSelect v-model="replacementForm.delivery" label="Delivery" :options="options.deliverySpeeds" :errors="fieldErrors.delivery || []">
					<template #option="{ option }"><span><span class="block font-medium">{{ option.label }}</span><span class="block text-xs text-muted-fg">{{ option.description }}</span></span></template>
				</DomSelect>
				<DomTextareaInput v-model="replacementForm.note" label="Incident note" :rows="3" :errors="fieldErrors.note || []" placeholder="Add useful context for fraud and support teams" />
				<DomCheckbox v-model="replacementForm.acknowledged" label="I understand how the old card and wallet tokens will be handled." :errors="fieldErrors.acknowledged || []" />
			</div>
			<template #footer>
				<DomButton variant="ghost" data-close>Cancel</DomButton>
				<DomButton variant="danger" :loading="actionKey === 'replacement'" @click="submitReplacement">Order replacement</DomButton>
			</template>
		</DomDialog>

		<DomDialog v-model="evidenceDialogOpen" title="Mutation evidence" description="Receipt returned by the repository-local card API.">
			<DomJsonViewer :value="evidence || {}" :expanded-depth="3" />
			<template #footer><DomButton data-close>Done</DomButton></template>
		</DomDialog>
	</div>
</template>
