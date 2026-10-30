<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomEmailInput,
	DomEmptyState,
	DomProgress,
	DomRadioGroup,
	DomSelect,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
} from '@getdom/studio/vue';

const stepTabs = [
	{ label: 'Items', key: 'items' },
	{ label: 'Resolution', key: 'resolution' },
	{ label: 'Return method', key: 'method' },
];

const reasonOptions = [
	{ label: 'Too large', value: 'too-large', description: 'Exchange or return for another size' },
	{ label: 'Too small', value: 'too-small', description: 'Exchange or return for another size' },
	{ label: 'Changed my mind', value: 'changed-mind', description: 'Standard return policy applies' },
	{ label: 'Arrived damaged', value: 'damaged', description: 'No return fee; inspection may be required' },
	{ label: 'Wrong item received', value: 'wrong-item', description: 'No return fee; replacement supported' },
];

const methodOptions = [
	{ label: 'DPD drop-off', value: 'drop-off', description: 'Free · label available immediately' },
	{ label: 'Carrier pickup', value: 'pickup', description: '£4 · choose a collection window by email' },
	{ label: 'Return in store', value: 'in-store', description: 'Free · no packaging or label needed' },
];

const orders = ref([]);
const selectedOrderId = ref('ord_10482');
const order = ref(null);
const activeStep = ref('items');
const selectedItemIds = ref([]);
const reasons = ref({});
const resolution = ref('exchange');
const exchangeOption = ref('');
const returnMethod = ref('drop-off');
const contactEmail = ref('');
const notes = ref('');
const conditionConfirmed = ref(false);
const loadError = ref('');
const actionError = ref('');
const reviewDialogOpen = ref(false);
const isLoading = ref(true);
const isSaving = ref(false);
const isSubmitting = ref(false);
let orderRequestSequence = 0;

const orderOptions = computed(() => orders.value.map((item) => ({
	...item,
	value: item.value || item.id,
	label: item.label || item.number,
})));
const eligibleItems = computed(() => order.value?.items.filter((item) => item.eligible) || []);
const selectedItems = computed(() => order.value?.items.filter((item) => selectedItemIds.value.includes(item.id)) || []);
const exchangeOptions = computed(() => selectedItems.value.length === 1 ? selectedItems.value[0].exchangeOptions : []);
const resolutionOptions = computed(() => [
	{
		label: 'Exchange',
		value: 'exchange',
		description: exchangeOptions.value.length ? 'Reserve another size for 48 hours' : 'Select one exchangeable item to continue',
		disabled: !exchangeOptions.value.length,
	},
	{ label: 'Refund', value: 'refund', description: `Return funds to ${order.value?.payment?.label || 'the original payment method'}` },
	{ label: 'Store credit', value: 'credit', description: 'Receive a 10% value bonus immediately after inspection' },
]);
const activeStepIndex = computed(() => Math.max(0, stepTabs.findIndex((step) => step.key === activeStep.value)));
const stepProgress = computed(() => ((activeStepIndex.value + 1) / stepTabs.length) * 100);
const itemStepReady = computed(() => selectedItems.value.length > 0 && selectedItems.value.every((item) => Boolean(reasons.value[item.id])));
const resolutionStepReady = computed(() => Boolean(resolution.value && (resolution.value !== 'exchange' || exchangeOptions.value.some((option) => option.value === exchangeOption.value))));
const methodStepReady = computed(() => Boolean(returnMethod.value && /^\S+@\S+\.\S+$/.test(contactEmail.value) && conditionConfirmed.value));
const currentStepReady = computed(() => ({
	items: itemStepReady.value,
	resolution: resolutionStepReady.value,
	method: methodStepReady.value,
}[activeStep.value]));
const selectedSubtotal = computed(() => selectedItems.value.reduce((total, item) => total + (item.price * item.quantity), 0));
const creditBonus = computed(() => resolution.value === 'credit' ? Math.round(selectedSubtotal.value * 0.1) : 0);
const restockingFee = computed(() => {
	const changedMind = selectedItems.value.some((item) => reasons.value[item.id] === 'changed-mind');
	return changedMind && resolution.value === 'refund' ? Math.round(selectedSubtotal.value * 0.08) : 0;
});
const estimatedTotal = computed(() => Math.max(0, selectedSubtotal.value + creditBonus.value - restockingFee.value));
const actionLabel = computed(() => {
	if (activeStep.value === 'items') return 'Continue to resolution';
	if (activeStep.value === 'resolution') return 'Continue to return method';
	return 'Review return';
});
const readinessChecks = computed(() => [
	{ label: 'Items and reasons', passed: itemStepReady.value },
	{ label: 'Resolution', passed: resolutionStepReady.value },
	{ label: 'Method and contact', passed: methodStepReady.value },
]);
const submittedReturn = computed(() => order.value?.submittedReturn || null);
const completedItems = computed(() => order.value?.items.filter((item) => order.value?.draft?.selectedItemIds.includes(item.id)) || []);

onMounted(loadOrders);

/**
 * Requests JSON from the returns API and normalizes error responses.
 *
 * @param {string} url API route.
 * @param {RequestInit} [options] Fetch options.
 * @returns {Promise<Record<string, unknown>>} Parsed API payload.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		...options,
		headers: {
			Accept: 'application/json',
			...(options.body ? { 'Content-Type': 'application/json' } : {}),
			...(options.headers || {}),
		},
	});
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		const error = new Error(payload.error || `Request failed with status ${response.status}.`);
		error.blockers = payload.blockers || [];
		throw error;
	}
	return payload;
}

/**
 * Loads the customer order selector and the initially active return workflow.
 *
 * @returns {Promise<void>}
 */
async function loadOrders() {
	isLoading.value = true;
	loadError.value = '';
	try {
		const payload = await requestJson('/api/block-demos/returns-portal/orders');
		orders.value = Array.isArray(payload.orders) ? payload.orders : [];
		if (!orders.value.length) throw new Error('No returnable orders are available.');
		if (!orders.value.some((item) => (item.value || item.id) === selectedOrderId.value)) {
			selectedOrderId.value = orders.value[0].value || orders.value[0].id;
		}
		await loadOrder(selectedOrderId.value);
	} catch (error) {
		loadError.value = error instanceof Error ? error.message : 'Could not load return orders.';
		isLoading.value = false;
	}
}

/**
 * Loads one order while ignoring stale responses from quick selector changes.
 *
 * @param {string} orderId Order identifier.
 * @returns {Promise<void>}
 */
async function loadOrder(orderId) {
	const requestSequence = ++orderRequestSequence;
	isLoading.value = true;
	loadError.value = '';
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/returns-portal/${encodeURIComponent(orderId)}`);
		if (requestSequence !== orderRequestSequence) return;
		applyOrder(payload.order);
	} catch (error) {
		if (requestSequence !== orderRequestSequence) return;
		loadError.value = error instanceof Error ? error.message : 'Could not load this return order.';
	} finally {
		if (requestSequence === orderRequestSequence) isLoading.value = false;
	}
}

/**
 * Applies a complete server order and hydrates the editable draft.
 *
 * @param {Record<string, unknown>} nextOrder Server return workflow.
 * @returns {void}
 */
function applyOrder(nextOrder) {
	order.value = nextOrder;
	selectedItemIds.value = [...(nextOrder.draft?.selectedItemIds || [])];
	reasons.value = { ...(nextOrder.draft?.reasons || {}) };
	resolution.value = nextOrder.draft?.resolution || 'refund';
	exchangeOption.value = nextOrder.draft?.exchangeOption || '';
	returnMethod.value = nextOrder.draft?.returnMethod || 'drop-off';
	contactEmail.value = nextOrder.draft?.contactEmail || nextOrder.customer?.email || '';
	notes.value = nextOrder.draft?.notes || '';
	conditionConfirmed.value = Boolean(nextOrder.draft?.conditionConfirmed);
	if (!nextOrder.submittedReturn) activeStep.value = 'items';
	syncOrderSummary(nextOrder);
}

/**
 * Refreshes the matching rich selector option after a mutation.
 *
 * @param {Record<string, unknown>} nextOrder Updated order.
 * @returns {void}
 */
function syncOrderSummary(nextOrder) {
	orders.value = orders.value.map((item) => {
		const itemId = item.value || item.id;
		return itemId === nextOrder.id
			? { ...item, status: nextOrder.status, statusLabel: nextOrder.statusLabel, returnNumber: nextOrder.submittedReturn?.number || '' }
			: item;
	});
}

/**
 * Switches the portal to another order from the rich selector.
 *
 * @param {string} orderId Selected order identifier.
 * @returns {void}
 */
function selectOrder(orderId) {
	selectedOrderId.value = orderId;
	loadOrder(orderId);
}

/**
 * Selects or removes an eligible order item from the draft.
 *
 * @param {object} item Order line item.
 * @param {boolean} checked Requested selection state.
 * @returns {void}
 */
function toggleItem(item, checked) {
	if (!item.eligible) return;
	if (checked) {
		selectedItemIds.value = [...new Set([...selectedItemIds.value, item.id])];
		if (!reasons.value[item.id]) reasons.value = { ...reasons.value, [item.id]: 'changed-mind' };
	} else {
		selectedItemIds.value = selectedItemIds.value.filter((itemId) => itemId !== item.id);
		const nextReasons = { ...reasons.value };
		delete nextReasons[item.id];
		reasons.value = nextReasons;
	}
	if (selectedItems.value.length !== 1 || !selectedItems.value[0]?.exchangeOptions.length) {
		if (resolution.value === 'exchange') resolution.value = 'refund';
		exchangeOption.value = '';
	}
	actionError.value = '';
}

/**
 * Updates the return reason for one selected line item.
 *
 * @param {string} itemId Line-item identifier.
 * @param {string} value Reason identifier.
 * @returns {void}
 */
function setReason(itemId, value) {
	reasons.value = { ...reasons.value, [itemId]: value };
	actionError.value = '';
}

/**
 * Applies resolution-dependent exchange defaults.
 *
 * @param {string} value Selected resolution.
 * @returns {void}
 */
function onResolutionChange(value) {
	resolution.value = value;
	if (value === 'exchange' && exchangeOptions.value.length && !exchangeOptions.value.some((option) => option.value === exchangeOption.value)) {
		exchangeOption.value = exchangeOptions.value[0].value;
	}
	if (value !== 'exchange') exchangeOption.value = '';
	actionError.value = '';
}

/**
 * Builds the complete revisioned return draft sent to the server.
 *
 * @returns {Record<string, unknown>} Draft API payload.
 */
function draftPayload() {
	return {
		revision: order.value.revision,
		selectedItemIds: [...selectedItemIds.value],
		reasons: { ...reasons.value },
		resolution: resolution.value,
		exchangeOption: exchangeOption.value,
		returnMethod: returnMethod.value,
		contactEmail: contactEmail.value,
		notes: notes.value,
		conditionConfirmed: conditionConfirmed.value,
	};
}

/**
 * Persists the current draft and returns the refreshed server workflow.
 *
 * @returns {Promise<Record<string, unknown>|null>} Updated order or null after failure.
 */
async function saveDraft() {
	if (!order.value || order.value.submittedReturn) return null;
	isSaving.value = true;
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/returns-portal/${encodeURIComponent(order.value.id)}/draft`, {
			method: 'PATCH',
			body: JSON.stringify(draftPayload()),
		});
		applyOrder(payload.order);
		return payload.order;
	} catch (error) {
		actionError.value = error instanceof Error ? error.message : 'Could not save the return draft.';
		return null;
	} finally {
		isSaving.value = false;
	}
}

/**
 * Saves the current step and advances or opens final review.
 *
 * @returns {Promise<void>}
 */
async function continueReturn() {
	if (!currentStepReady.value) {
		actionError.value = stepErrorMessage(activeStep.value);
		return;
	}
	const currentStep = activeStep.value;
	const savedOrder = await saveDraft();
	if (!savedOrder) return;
	if (currentStep === 'items') activeStep.value = 'resolution';
	else if (currentStep === 'resolution') activeStep.value = 'method';
	else reviewDialogOpen.value = true;
}

/**
 * Returns to the previous guided step.
 *
 * @returns {void}
 */
function previousStep() {
	activeStep.value = stepTabs[Math.max(0, activeStepIndex.value - 1)].key;
	actionError.value = '';
}

/**
 * Submits the saved draft and applies immutable return proof.
 *
 * @returns {Promise<void>}
 */
async function submitReturn() {
	if (!order.value) return;
	isSubmitting.value = true;
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/returns-portal/${encodeURIComponent(order.value.id)}/submit`, {
			method: 'POST',
			body: JSON.stringify({ revision: order.value.revision }),
		});
		applyOrder(payload.order);
		reviewDialogOpen.value = false;
	} catch (error) {
		actionError.value = error instanceof Error ? error.message : 'Could not create the return request.';
	} finally {
		isSubmitting.value = false;
	}
}

/**
 * Downloads a simple label handoff file for the approved demo return.
 *
 * @returns {void}
 */
function downloadLabel() {
	if (!submittedReturn.value) return;
	const body = [
		`Return ${submittedReturn.value.number}`,
		`Label reference: ${submittedReturn.value.labelReference}`,
		`Order: ${order.value.number}`,
		`Method: ${submittedReturn.value.methodLabel}`,
		'Attach this reference to the sealed parcel before drop-off.',
	].join('\n');
	const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }));
	const link = document.createElement('a');
	link.href = url;
	link.download = `${submittedReturn.value.number}-return-label.txt`;
	link.click();
	URL.revokeObjectURL(url);
}

/**
 * Returns concise guidance for an incomplete guided step.
 *
 * @param {string} step Step identifier.
 * @returns {string} Recovery message.
 */
function stepErrorMessage(step) {
	if (step === 'items') return 'Select an eligible item and choose a reason for each selection.';
	if (step === 'resolution') return 'Choose a resolution and an in-stock size when exchanging.';
	return 'Choose a return method, enter a valid email, and confirm item condition.';
}

/**
 * Formats a GBP amount without decimal places.
 *
 * @param {number} value Amount in pounds.
 * @returns {string} Localized amount.
 */
function money(value) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		maximumFractionDigits: 0,
	}).format(Number(value || 0));
}

/**
 * Resolves the semantic status tone for an order or return.
 *
 * @param {string} status Status identifier.
 * @returns {string} DOM Studio status tone.
 */
function statusTone(status) {
	return {
		eligible: 'success',
		'return-created': 'primary',
		approved: 'success',
		'in-transit': 'primary',
	}[status] || 'neutral';
}

/**
 * Formats a return method for the live summary.
 *
 * @param {string} method Method identifier.
 * @returns {string} Human-readable method.
 */
function returnMethodLabel(method) {
	return methodOptions.find((option) => option.value === method)?.label || 'Choose a method';
}

/**
 * Formats the selected resolution for the live summary.
 *
 * @returns {string} Human-readable resolution.
 */
function resolutionLabel() {
	if (resolution.value === 'refund') return `Refund to ${order.value?.payment?.label || 'original payment'}`;
	if (resolution.value === 'credit') return 'Store credit +10%';
	const option = exchangeOptions.value.find((item) => item.value === exchangeOption.value);
	return option ? `Exchange for ${option.label}` : 'Exchange';
}
</script>

<template>
	<section class="relative flex h-dvh min-h-[36rem] w-full flex-col overflow-hidden bg-canvas text-canvas-fg" data-testid="returns-portal-block">
		<header class="shrink-0 border-b border-border bg-canvas">
			<div class="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Self-service returns</p>
						<DomStatusPill v-if="order" :tone="statusTone(order.status)" :label="order.statusLabel" size="sm" />
					</div>
					<h1 class="mt-1 truncate text-xl font-semibold">{{ submittedReturn ? submittedReturn.number : `Return ${order?.number || ''}` }}</h1>
					<p v-if="order && !submittedReturn" class="mt-1 text-sm text-muted-fg">Delivered {{ order.deliveredAt }} · {{ order.windowDaysLeft }} days left</p>
					<p v-else-if="submittedReturn" class="mt-1 text-sm text-muted-fg">{{ submittedReturn.nextStep }}</p>
				</div>

				<DomSelect
					:model-value="selectedOrderId"
					label="Order"
					:options="orderOptions"
					width="min-w-[21rem]"
					@update:model-value="selectOrder"
				>
					<template #value="{ option }">
						<span class="flex min-w-0 items-center justify-between gap-3">
							<span class="min-w-0">
								<span class="block truncate font-semibold">{{ option?.label }}</span>
								<span class="block truncate text-xs text-muted-fg">{{ option?.description }}</span>
							</span>
							<DomBadge v-if="option?.returnNumber" tone="primary" size="sm">{{ option.returnNumber }}</DomBadge>
						</span>
					</template>
					<template #option="{ option }">
						<span class="flex min-w-0 items-start justify-between gap-3">
							<span class="min-w-0">
								<span class="block truncate font-semibold">{{ option.label }}</span>
								<span class="mt-1 block text-xs opacity-75">{{ option.description }}</span>
							</span>
							<DomStatusPill :tone="statusTone(option.status)" :label="option.statusLabel" size="sm" />
						</span>
					</template>
				</DomSelect>
			</div>
		</header>

		<div v-if="loadError" class="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
			<DomAlert tone="danger" title="Returns are unavailable" :description="loadError">
				<template #actions>
					<DomButton variant="secondary" size="sm" @click="loadOrders">Try again</DomButton>
				</template>
			</DomAlert>
		</div>

		<DomEmptyState
			v-else-if="isLoading && !order"
			class="m-auto"
			title="Loading your return options"
			description="Checking order eligibility, exchange stock, and refund policy."
			size="sm"
		/>

		<template v-else-if="order">
			<main v-if="submittedReturn" class="min-h-0 flex-1 overflow-y-auto">
				<div class="mx-auto grid w-full max-w-5xl gap-8 px-4 py-6 pb-24 sm:px-6 sm:py-10 md:grid-cols-[minmax(0,1fr)_19rem] lg:px-8">
					<div class="min-w-0">
						<div class="border-b border-border pb-7">
							<DomStatusPill :tone="statusTone(submittedReturn.status)" :label="submittedReturn.statusLabel" />
							<h2 class="mt-4 text-2xl font-semibold tracking-tight">Your return is ready</h2>
							<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">{{ submittedReturn.nextStep }}</p>
							<div class="mt-5 flex flex-wrap gap-2">
								<DomButton v-if="order.draft.returnMethod === 'drop-off'" @click="downloadLabel">Download return label</DomButton>
								<DomButton variant="secondary" @click="loadOrder(order.id)">Refresh tracking</DomButton>
							</div>
						</div>

						<section class="border-b border-border py-7" aria-labelledby="return-items-heading">
							<h2 id="return-items-heading" class="text-base font-semibold">Items in this return</h2>
							<div class="mt-4 divide-y divide-border border-y border-border">
								<div v-for="item in completedItems" :key="item.id" class="flex items-start justify-between gap-4 py-4">
									<div>
										<p class="font-medium">{{ item.name }}</p>
										<p class="mt-1 text-sm text-muted-fg">{{ item.variant }} · {{ item.sku }}</p>
									</div>
									<p class="shrink-0 font-semibold">{{ money(item.price) }}</p>
								</div>
							</div>
						</section>

						<section class="py-7" aria-labelledby="return-activity-heading">
							<h2 id="return-activity-heading" class="text-base font-semibold">Return activity</h2>
							<ol class="mt-5 space-y-5">
								<li v-for="event in order.activity" :key="event.id" class="grid grid-cols-[0.75rem_minmax(0,1fr)] gap-3 text-sm">
									<span class="mt-1.5 size-2 rounded-full bg-primary" aria-hidden="true"></span>
									<div>
										<p class="font-medium">{{ event.label }}</p>
										<p class="mt-1 leading-6 text-muted-fg">{{ event.detail }}</p>
										<p class="mt-1 text-xs text-muted-fg">{{ event.time }}</p>
									</div>
								</li>
							</ol>
						</section>
					</div>

					<aside class="border-t border-border pt-6 md:border-l md:border-t-0 md:pl-7 md:pt-0">
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Return number</p>
						<p class="mt-2 text-xl font-semibold">{{ submittedReturn.number }}</p>
						<dl class="mt-6 divide-y divide-border text-sm">
							<div class="py-3">
								<dt class="text-muted-fg">Resolution</dt>
								<dd class="mt-1 font-medium">{{ submittedReturn.resolutionLabel }}</dd>
							</div>
							<div class="py-3">
								<dt class="text-muted-fg">Return method</dt>
								<dd class="mt-1 font-medium">{{ submittedReturn.methodLabel }}</dd>
							</div>
							<div class="py-3">
								<dt class="text-muted-fg">Estimated value</dt>
								<dd class="mt-1 font-medium">{{ money(submittedReturn.estimatedAmount) }}</dd>
							</div>
							<div class="py-3">
								<dt class="text-muted-fg">Label reference</dt>
								<dd class="mt-1 break-all font-medium">{{ submittedReturn.labelReference }}</dd>
							</div>
						</dl>
					</aside>
				</div>
			</main>

			<template v-else>
				<div class="shrink-0 border-b border-border px-4 py-3 sm:px-6 lg:px-8">
					<div class="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div class="min-w-0 flex-1">
							<DomProgress :value="stepProgress" label="Return setup progress" size="sm" :show-label="false" />
							<p class="mt-2 text-xs font-medium text-muted-fg">Step {{ activeStepIndex + 1 }} of 3 · Draft saved only when you continue</p>
						</div>
						<DomTabs v-model="activeStep" :tabs="stepTabs" variant="pill" class="[&>div:last-child]:hidden" />
					</div>
				</div>

				<div class="min-h-0 flex-1 overflow-y-auto md:grid md:grid-cols-[minmax(0,1fr)_20rem] md:overflow-hidden">
					<div class="min-w-0 px-4 py-5 pb-28 sm:px-6 md:overflow-y-auto md:pb-8 lg:px-8">
						<div class="mx-auto max-w-3xl">
							<DomAlert
								v-if="actionError"
								class="mb-5"
								tone="danger"
								title="Return details need attention"
								:description="actionError"
								dismissible
								@dismiss="actionError = ''"
							/>

							<section v-if="activeStep === 'items'" aria-labelledby="choose-items-heading">
								<div class="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
									<div>
										<h2 id="choose-items-heading" class="text-lg font-semibold">What are you returning?</h2>
										<p class="mt-1 text-sm text-muted-fg">Choose a reason for every selected item.</p>
									</div>
									<DomBadge tone="neutral">{{ selectedItems.length }} of {{ eligibleItems.length }} selected</DomBadge>
								</div>

								<div class="divide-y divide-border">
									<div
										v-for="item in order.items"
										:key="item.id"
										class="border-l-2 py-4 pl-3 transition sm:py-5 sm:pl-4"
										:class="selectedItemIds.includes(item.id) ? 'border-l-primary bg-primary/5' : 'border-l-transparent'"
									>
										<div class="flex items-start justify-between gap-4">
											<DomCheckbox
												:model-value="selectedItemIds.includes(item.id)"
												:label="item.name"
												:description="`${item.variant} · ${item.sku}`"
												:disabled="!item.eligible"
												@update:model-value="toggleItem(item, $event)"
											/>
											<div class="shrink-0 text-right">
												<p class="font-semibold">{{ money(item.price) }}</p>
												<DomStatusPill class="mt-2" :tone="item.eligible ? 'success' : 'warning'" :label="item.eligibilityLabel" size="sm" />
											</div>
										</div>
										<p class="mt-3 text-xs leading-5 text-muted-fg sm:ml-7">{{ item.policyDetail }}</p>
										<DomSelect
											v-if="selectedItemIds.includes(item.id)"
											class="mt-4 sm:ml-7"
											:model-value="reasons[item.id]"
											label="Return reason"
											:options="reasonOptions"
											width="min-w-[22rem]"
											@update:model-value="setReason(item.id, $event)"
										>
											<template #option="{ option }">
												<span class="block">
													<span class="block font-medium">{{ option.label }}</span>
													<span class="mt-1 block text-xs opacity-75">{{ option.description }}</span>
												</span>
											</template>
										</DomSelect>
									</div>
								</div>
							</section>

							<section v-else-if="activeStep === 'resolution'" aria-labelledby="resolution-heading">
								<div class="border-b border-border pb-4">
									<h2 id="resolution-heading" class="text-lg font-semibold">How should we make this right?</h2>
									<p class="mt-1 text-sm text-muted-fg">Your estimate updates before anything is submitted.</p>
								</div>

								<div class="py-5">
									<DomRadioGroup
										:model-value="resolution"
										label="Preferred resolution"
										:options="resolutionOptions"
										orientation="vertical"
										@update:model-value="onResolutionChange"
									/>

									<DomSelect
										v-if="resolution === 'exchange'"
										v-model="exchangeOption"
										class="mt-5"
										label="Replacement size"
										:options="exchangeOptions"
										width="min-w-[22rem]"
									>
										<template #option="{ option }">
											<span class="block">
												<span class="block font-medium">{{ option.label }}</span>
												<span class="mt-1 block text-xs opacity-75">{{ option.description }}</span>
											</span>
										</template>
									</DomSelect>
								</div>

								<div class="border-t border-border py-5 text-sm">
									<div class="flex items-center justify-between gap-4 py-2">
										<span class="text-muted-fg">Selected item value</span>
										<span class="font-medium">{{ money(selectedSubtotal) }}</span>
									</div>
									<div v-if="creditBonus" class="flex items-center justify-between gap-4 py-2 text-success">
										<span>Store-credit bonus</span>
										<span class="font-medium">+{{ money(creditBonus) }}</span>
									</div>
									<div v-if="restockingFee" class="flex items-center justify-between gap-4 py-2 text-warning">
										<span>Estimated restocking fee</span>
										<span class="font-medium">-{{ money(restockingFee) }}</span>
									</div>
									<div class="mt-2 flex items-center justify-between gap-4 border-t border-border pt-4 text-base">
										<span class="font-medium">Estimated value</span>
										<span class="font-semibold">{{ money(estimatedTotal) }}</span>
									</div>
								</div>
							</section>

							<section v-else aria-labelledby="method-heading">
								<div class="border-b border-border pb-4">
									<h2 id="method-heading" class="text-lg font-semibold">Choose a return method</h2>
									<p class="mt-1 text-sm text-muted-fg">Instructions arrive after the request is approved.</p>
								</div>

								<div class="space-y-5 py-5">
									<DomRadioGroup v-model="returnMethod" label="Return method" :options="methodOptions" orientation="vertical" />
									<DomEmailInput v-model="contactEmail" label="Contact email" autocomplete="email" required />
									<DomTextareaInput
										v-model="notes"
										label="Notes for the returns team"
										placeholder="Add sizing, defect, pickup, or packaging details."
										:rows="3"
									/>
									<div class="border-y border-border py-4">
										<DomCheckbox
											v-model="conditionConfirmed"
											label="Items are unused and in returnable condition"
											description="Damaged or worn items may need inspection before approval."
										/>
									</div>
								</div>
							</section>
						</div>
					</div>

					<aside class="hidden min-h-0 overflow-y-auto border-l border-border bg-secondary/20 p-6 md:block">
						<div class="sticky top-0">
							<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Return summary</p>
							<div class="mt-4 flex items-end justify-between gap-3">
								<div>
									<p class="text-sm text-muted-fg">Estimated value</p>
									<p class="mt-1 text-2xl font-semibold">{{ money(estimatedTotal) }}</p>
								</div>
								<DomBadge tone="neutral">{{ selectedItems.length }} {{ selectedItems.length === 1 ? 'item' : 'items' }}</DomBadge>
							</div>

							<dl class="mt-5 divide-y divide-border text-sm">
								<div class="py-3">
									<dt class="text-muted-fg">Resolution</dt>
									<dd class="mt-1 font-medium">{{ resolutionLabel() }}</dd>
								</div>
								<div class="py-3">
									<dt class="text-muted-fg">Method</dt>
									<dd class="mt-1 font-medium">{{ returnMethodLabel(returnMethod) }}</dd>
								</div>
								<div class="py-3">
									<dt class="text-muted-fg">Return by</dt>
									<dd class="mt-1 font-medium">{{ order.returnBy }}</dd>
								</div>
							</dl>

							<div class="mt-5 space-y-3 border-t border-border pt-5">
								<div v-for="check in readinessChecks" :key="check.label" class="flex items-center justify-between gap-3 text-sm">
									<span class="text-muted-fg">{{ check.label }}</span>
									<DomStatusPill :tone="check.passed ? 'success' : 'neutral'" :label="check.passed ? 'Ready' : 'Open'" size="sm" />
								</div>
							</div>

							<div class="mt-6 flex gap-2">
								<DomButton v-if="activeStep !== 'items'" variant="secondary" @click="previousStep">Back</DomButton>
								<DomButton class="flex-1" :disabled="!currentStepReady" :loading="isSaving" @click="continueReturn">{{ actionLabel }}</DomButton>
							</div>
						</div>
					</aside>
				</div>

				<div class="absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t border-border bg-canvas/95 px-4 py-3 backdrop-blur md:hidden">
					<DomButton v-if="activeStep !== 'items'" variant="secondary" @click="previousStep">Back</DomButton>
					<DomButton class="flex-1" :disabled="!currentStepReady" :loading="isSaving" @click="continueReturn">{{ actionLabel }}</DomButton>
				</div>
			</template>
		</template>

		<DomDialog
			v-model="reviewDialogOpen"
			title="Submit this return?"
			description="The server will run eligibility, exchange-stock, contact, and condition checks before creating the return."
		>
			<div class="space-y-4 text-sm">
				<div class="flex items-start justify-between gap-4 border-b border-border pb-4">
					<div>
						<p class="font-semibold">{{ selectedItems.length }} {{ selectedItems.length === 1 ? 'item' : 'items' }} · {{ resolutionLabel() }}</p>
						<p class="mt-1 text-muted-fg">{{ returnMethodLabel(returnMethod) }} · {{ contactEmail }}</p>
					</div>
					<p class="shrink-0 text-lg font-semibold">{{ money(estimatedTotal) }}</p>
				</div>
				<div class="space-y-3">
					<div v-for="check in order?.checks || []" :key="check.key" class="flex items-start justify-between gap-4">
						<div>
							<p class="font-medium">{{ check.label }}</p>
							<p class="mt-1 text-xs text-muted-fg">{{ check.detail }}</p>
						</div>
						<DomStatusPill :tone="check.passed ? 'success' : 'warning'" :label="check.passed ? 'Ready' : 'Required'" size="sm" />
					</div>
				</div>
				<DomAlert v-if="actionError" tone="danger" title="Return not submitted" :description="actionError" />
			</div>

			<template #footer>
				<DomButton variant="secondary" data-close>Keep editing</DomButton>
				<DomButton :loading="isSubmitting" @click="submitReturn">Submit return</DomButton>
			</template>
		</DomDialog>
	</section>
</template>
