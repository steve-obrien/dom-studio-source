<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomBadge,
	DomButton,
	DomConfirmationCodeInput,
	DomDialog,
	DomEmptyState,
	DomProgress,
	DomSelect,
	DomStatusPill,
	DomTextareaInput,
	DomToggle,
} from '@getdom/studio/vue';

const arrivalMethods = [
	{ label: 'Curbside pickup', value: 'curbside', description: 'Bring the order to the customer’s vehicle.' },
	{ label: 'Walk-up counter', value: 'walk-up', description: 'Meet the customer at the collection counter.' },
	{ label: 'Drive-through lane', value: 'drive-through', description: 'Use the dedicated pickup lane.' },
];

const pickupSpots = [
	{ label: 'Bay B2', value: 'B2', description: 'Closest bay to the chilled storage door.' },
	{ label: 'Bay B3', value: 'B3', description: 'Accessible curbside pickup bay.' },
	{ label: 'Front entrance', value: 'front-entrance', description: 'Meet beside the main store entrance.' },
	{ label: 'Inside counter', value: 'inside-counter', description: 'Customer is waiting at the collection desk.' },
];

const orders = ref([]);
const selectedOrderId = ref('ord_7831');
const order = ref(null);
const isLoading = ref(true);
const loadError = ref('');
const feedback = ref(null);
const arrivalDialogOpen = ref(false);
const verificationDialogOpen = ref(false);
const arrivalMethod = ref('curbside');
const pickupSpot = ref('B2');
const arrivalNote = ref('');
const pickupCode = ref('');
const idChecked = ref(false);
const contactless = ref(true);
const substitutionsAccepted = ref(false);
const isSavingArrival = ref(false);
const stagingItemId = ref('');
const isSavingVerification = ref(false);
const isCompleting = ref(false);
let orderRequestSequence = 0;

const orderOptions = computed(() => orders.value.map((item) => ({
	value: item.id,
	label: `Order ${item.number}`,
	description: `${item.customerName} · ${item.nextAction.label}`,
	openCheckCount: item.openCheckCount,
})));
const openChecks = computed(() => order.value?.checks?.filter((check) => !check.passed) || []);
const allItemsStaged = computed(() => order.value?.items?.every((item) => item.ready) || false);
const substitutionItems = computed(() => order.value?.items?.filter((item) => item.substitution) || []);
const isComplete = computed(() => order.value?.status === 'complete');
const verificationCodeRequired = computed(() => !order.value?.verification?.codeVerifiedAt);
const verificationCodeValid = computed(() => !verificationCodeRequired.value || /^\d{4}$/.test(pickupCode.value));
const verificationDraftDirty = computed(() => {
	if (!order.value) return false;
	return contactless.value !== order.value.preferences.contactless
		|| substitutionsAccepted.value !== order.value.preferences.substitutionsAccepted
		|| (order.value.verification.requiresIdCheck && idChecked.value !== Boolean(order.value.verification.idCheckedAt))
		|| (verificationCodeRequired.value && pickupCode.value.length > 0);
});
const arrivalDraftDirty = computed(() => {
	if (!order.value) return false;
	return arrivalMethod.value !== order.value.arrival.method
		|| pickupSpot.value !== order.value.arrival.spot
		|| arrivalNote.value.trim() !== order.value.arrival.note;
});
const primaryLabel = computed(() => order.value?.nextAction?.label || 'Review pickup');

watch(selectedOrderId, (orderId, previousOrderId) => {
	if (orderId && previousOrderId && orderId !== previousOrderId) void loadOrder(orderId);
});

onMounted(loadOrders);

/**
 * Requests JSON from the pickup handoff API and promotes failed responses
 * into ordinary errors for consistent UI recovery.
 *
 * @param {string} url API route.
 * @param {RequestInit} [options] Fetch options.
 * @returns {Promise<Record<string, unknown>>} Parsed response payload.
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
	if (!response.ok) throw new Error(payload.error || `Request failed with status ${response.status}.`);
	return payload;
}

/**
 * Loads the pickup queue before hydrating the initially selected order.
 *
 * @returns {Promise<void>}
 */
async function loadOrders() {
	isLoading.value = true;
	loadError.value = '';
	try {
		const payload = await requestJson('/api/block-demos/pickup-handoff/orders');
		orders.value = Array.isArray(payload.orders) ? payload.orders : [];
		if (!orders.value.length) throw new Error('No pickup orders are available.');
		if (!orders.value.some((item) => item.id === selectedOrderId.value)) selectedOrderId.value = orders.value[0].id;
		await loadOrder(selectedOrderId.value);
	} catch (error) {
		loadError.value = error instanceof Error ? error.message : 'Could not load the pickup queue.';
		isLoading.value = false;
	}
}

/**
 * Loads one pickup order while ignoring stale responses after quick switches.
 *
 * @param {string} orderId Pickup order identifier.
 * @returns {Promise<void>}
 */
async function loadOrder(orderId) {
	const requestSequence = ++orderRequestSequence;
	isLoading.value = true;
	loadError.value = '';
	feedback.value = null;
	try {
		const payload = await requestJson(`/api/block-demos/pickup-handoff/${encodeURIComponent(orderId)}`);
		if (requestSequence !== orderRequestSequence) return;
		applyOrder(payload.order);
	} catch (error) {
		if (requestSequence !== orderRequestSequence) return;
		loadError.value = error instanceof Error ? error.message : 'Could not load this pickup order.';
	} finally {
		if (requestSequence === orderRequestSequence) isLoading.value = false;
	}
}

/**
 * Applies a complete API order and synchronizes editable draft state.
 *
 * @param {Record<string, unknown>} nextOrder API order payload.
 * @returns {void}
 */
function applyOrder(nextOrder) {
	order.value = nextOrder;
	arrivalMethod.value = nextOrder.arrival.method;
	pickupSpot.value = nextOrder.arrival.spot;
	arrivalNote.value = nextOrder.arrival.note;
	contactless.value = nextOrder.preferences.contactless;
	substitutionsAccepted.value = nextOrder.preferences.substitutionsAccepted;
	idChecked.value = Boolean(nextOrder.verification.idCheckedAt);
	syncOrderSummary(nextOrder.orderSummary);
}

/**
 * Refreshes the selector metadata after a pickup mutation.
 *
 * @param {Record<string, unknown>} summary Updated order summary.
 * @returns {void}
 */
function syncOrderSummary(summary) {
	orders.value = orders.value.map((item) => (item.id === summary.id ? { ...item, ...summary } : item));
}

/**
 * Opens the arrival editor with the latest server-owned values.
 *
 * @returns {void}
 */
function openArrivalEditor() {
	if (!order.value || isComplete.value) return;
	arrivalMethod.value = order.value.arrival.method;
	pickupSpot.value = order.value.arrival.spot;
	arrivalNote.value = order.value.arrival.note;
	feedback.value = null;
	arrivalDialogOpen.value = true;
}

/**
 * Saves the customer's reported arrival method, spot, and note.
 *
 * @returns {Promise<void>}
 */
async function saveArrival() {
	if (!order.value || !arrivalDraftDirty.value) return;
	isSavingArrival.value = true;
	feedback.value = null;
	try {
		const payload = await requestJson(`/api/block-demos/pickup-handoff/${encodeURIComponent(selectedOrderId.value)}/arrival`, {
			method: 'PATCH',
			body: JSON.stringify({
				method: arrivalMethod.value,
				spot: pickupSpot.value,
				note: arrivalNote.value.trim(),
				revision: order.value.revision,
			}),
		});
		applyOrder(payload.order);
		arrivalDialogOpen.value = false;
		feedback.value = {
			tone: 'success',
			title: 'Arrival updated',
			description: 'The pickup team now has the customer’s latest location and loading note.',
		};
	} catch (error) {
		feedback.value = {
			tone: 'danger',
			title: 'Arrival not saved',
			description: error instanceof Error ? error.message : 'Check the arrival details and try again.',
		};
	} finally {
		isSavingArrival.value = false;
	}
}

/**
 * Toggles the staged state of one item through the pickup API.
 *
 * @param {Record<string, unknown>} item Pickup item.
 * @returns {Promise<void>}
 */
async function toggleItemStage(item) {
	if (!order.value || isComplete.value) return;
	stagingItemId.value = item.id;
	feedback.value = null;
	try {
		const payload = await requestJson(
			`/api/block-demos/pickup-handoff/${encodeURIComponent(selectedOrderId.value)}/items/${encodeURIComponent(item.id)}/stage`,
			{
				method: 'POST',
				body: JSON.stringify({ ready: !item.ready, revision: order.value.revision }),
			},
		);
		applyOrder(payload.order);
		feedback.value = {
			tone: 'success',
			title: item.ready ? 'Item returned to preparation' : 'Item staged',
			description: `${item.name} has been recorded in the live pickup order.`,
		};
	} catch (error) {
		feedback.value = {
			tone: 'danger',
			title: 'Item status not saved',
			description: error instanceof Error ? error.message : 'Refresh the order and try again.',
		};
	} finally {
		stagingItemId.value = '';
	}
}

/**
 * Opens the customer verification dialog with current preferences.
 *
 * @returns {void}
 */
function openVerification() {
	if (!order.value || isComplete.value) return;
	pickupCode.value = '';
	idChecked.value = Boolean(order.value.verification.idCheckedAt);
	contactless.value = order.value.preferences.contactless;
	substitutionsAccepted.value = order.value.preferences.substitutionsAccepted;
	feedback.value = null;
	verificationDialogOpen.value = true;
}

/**
 * Saves handoff preferences and verifies the customer in revision order.
 *
 * @returns {Promise<void>}
 */
async function saveVerification() {
	if (!order.value || !verificationCodeValid.value || !verificationDraftDirty.value) return;
	isSavingVerification.value = true;
	feedback.value = null;
	try {
		const draftCode = pickupCode.value;
		const draftIdChecked = idChecked.value;
		const draftContactless = contactless.value;
		const draftSubstitutionsAccepted = substitutionsAccepted.value;
		const preferencesChanged = draftContactless !== order.value.preferences.contactless
			|| draftSubstitutionsAccepted !== order.value.preferences.substitutionsAccepted;

		if (preferencesChanged) {
			const preferencesPayload = await requestJson(
				`/api/block-demos/pickup-handoff/${encodeURIComponent(selectedOrderId.value)}/preferences`,
				{
					method: 'PATCH',
					body: JSON.stringify({
						contactless: draftContactless,
						substitutionsAccepted: draftSubstitutionsAccepted,
						revision: order.value.revision,
					}),
				},
			);
			applyOrder(preferencesPayload.order);
		}

		const needsVerification = verificationCodeRequired.value
			|| (order.value.verification.requiresIdCheck && draftIdChecked && !order.value.verification.idCheckedAt);
		if (needsVerification) {
			const verificationPayload = await requestJson(
				`/api/block-demos/pickup-handoff/${encodeURIComponent(selectedOrderId.value)}/verify`,
				{
					method: 'POST',
					body: JSON.stringify({
						code: draftCode,
						idChecked: draftIdChecked,
						revision: order.value.revision,
					}),
				},
			);
			applyOrder(verificationPayload.order);
		}

		verificationDialogOpen.value = false;
		feedback.value = {
			tone: 'success',
			title: 'Customer checks saved',
			description: order.value.nextAction.key === 'complete-handoff'
				? 'Every required check has passed. The pickup can now be completed.'
				: 'The server recorded the verification details and updated the next action.',
		};
	} catch (error) {
		feedback.value = {
			tone: 'danger',
			title: 'Verification not saved',
			description: error instanceof Error ? error.message : 'Check the customer details and try again.',
		};
	} finally {
		isSavingVerification.value = false;
	}
}

/**
 * Completes the pickup through the server-owned readiness gate.
 *
 * @returns {Promise<void>}
 */
async function completePickup() {
	if (!order.value || isComplete.value) return;
	isCompleting.value = true;
	feedback.value = null;
	try {
		const payload = await requestJson(`/api/block-demos/pickup-handoff/${encodeURIComponent(selectedOrderId.value)}/complete`, {
			method: 'POST',
			body: JSON.stringify({ revision: order.value.revision }),
		});
		applyOrder(payload.order);
		feedback.value = {
			tone: 'success',
			title: 'Pickup completed',
			description: 'Final handoff proof is recorded and the order can no longer be changed.',
		};
	} catch (error) {
		feedback.value = {
			tone: 'warning',
			title: 'Pickup still has open checks',
			description: error instanceof Error ? error.message : 'Review the readiness checklist and try again.',
		};
	} finally {
		isCompleting.value = false;
	}
}

/**
 * Routes the persistent primary action to the current server-owned blocker.
 *
 * @returns {void}
 */
function handlePrimaryAction() {
	if (!order.value || isComplete.value) return;
	if (order.value.nextAction.key === 'arrival') {
		openArrivalEditor();
		return;
	}
	if (order.value.nextAction.key === 'items') {
		document.getElementById('pickup-items-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		feedback.value = {
			tone: 'warning',
			title: 'Stage every item',
			description: 'Use the item action below to record the remaining bag as ready.',
		};
		return;
	}
	if (order.value.nextAction.key === 'verification') {
		openVerification();
		return;
	}
	if (order.value.nextAction.key === 'complete-handoff') void completePickup();
}

/**
 * Resolves a semantic status tone for a pickup state.
 *
 * @param {string} status Pickup status identifier.
 * @returns {string} DOM Studio semantic tone.
 */
function statusTone(status) {
	return { arrived: 'warning', complete: 'success' }[status] || 'neutral';
}
</script>

<template>
	<section class="min-h-screen bg-canvas text-canvas-fg" data-testid="pickup-handoff-block">
		<header class="border-b border-border bg-canvas">
			<div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Soho Market</p>
					<h1 class="mt-1 whitespace-nowrap text-xl font-semibold">Pickup desk</h1>
				</div>

				<DomSelect v-model="selectedOrderId" label="Active pickup" :options="orderOptions" width="min-w-[22rem]">
					<template #value="{ option }">
						<span class="flex min-w-0 items-center justify-between gap-3">
							<span class="truncate font-semibold">{{ option?.label || `Order ${order?.number || ''}` }}</span>
							<DomBadge v-if="order?.orderSummary?.openCheckCount" tone="warning" size="sm">{{ order.orderSummary.openCheckCount }} open</DomBadge>
						</span>
					</template>
					<template #option="{ option }">
						<span class="flex min-w-0 items-center justify-between gap-3">
							<span class="min-w-0">
								<span class="block truncate font-semibold">{{ option.label }}</span>
								<span class="block truncate text-xs opacity-75">{{ option.description }}</span>
							</span>
							<DomBadge v-if="option.openCheckCount" tone="warning" size="sm">{{ option.openCheckCount }}</DomBadge>
						</span>
					</template>
				</DomSelect>
			</div>
		</header>

		<main class="mx-auto max-w-6xl px-4 py-5 pb-28 sm:px-6 sm:py-8 lg:px-8 lg:pb-10">
			<DomAlert v-if="loadError" tone="danger" title="Pickup queue unavailable" :description="loadError">
				<template #actions>
					<DomButton variant="secondary" size="sm" @click="loadOrders">Try again</DomButton>
				</template>
			</DomAlert>

			<DomEmptyState v-else-if="isLoading && !order" title="Loading the pickup desk" description="Checking live arrival, preparation, and verification state." size="sm" />

			<div v-else-if="order" class="grid gap-9 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10">
				<div class="min-w-0">
					<section class="border-b border-border pb-7" aria-labelledby="pickup-status-heading">
						<div class="flex flex-wrap items-center gap-2">
							<DomStatusPill :tone="statusTone(order.status)" size="sm">{{ order.statusLabel }}</DomStatusPill>
							<span class="text-xs text-muted-fg">Order {{ order.number }} · {{ order.pickupWindowLabel }}</span>
						</div>

						<div class="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<p class="text-sm font-medium text-muted-fg">{{ isComplete ? 'Completed pickup' : 'Customer waiting' }}</p>
								<h2 id="pickup-status-heading" class="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">{{ isComplete ? 'Proof recorded' : `${order.waitMinutes} min` }}</h2>
							</div>
							<DomProgress class="max-w-sm" :value="order.progress" label="Handoff readiness" :tone="isComplete ? 'success' : 'primary'" show-value />
						</div>

						<div class="mt-6 flex items-start justify-between gap-4">
							<div class="flex min-w-0 items-center gap-3">
								<DomAvatar :name="order.customer.name" :initials="order.customer.initials" size="lg" />
								<div class="min-w-0">
									<p class="truncate font-semibold">{{ order.customer.name }}</p>
									<p class="mt-1 truncate text-sm text-muted-fg">{{ order.customer.vehicle }} · {{ order.arrival.note }}</p>
								</div>
							</div>
							<DomButton variant="secondary" size="sm" :disabled="isComplete" @click="openArrivalEditor">Edit arrival</DomButton>
						</div>
						<p class="mt-4 text-sm leading-6 text-muted-fg">{{ order.location.name }} · {{ order.location.address }} · {{ order.checks[0].detail }}</p>
					</section>

					<DomAlert
						v-if="!isComplete"
						class="mt-6"
						:tone="openChecks.length ? 'warning' : 'success'"
						:title="order.nextAction.label"
						:description="order.nextAction.description"
					>
						<template #actions>
							<DomButton size="sm" @click="handlePrimaryAction">{{ primaryLabel }}</DomButton>
						</template>
					</DomAlert>

					<DomAlert v-if="feedback" class="mt-6" :tone="feedback.tone" :title="feedback.title" :description="feedback.description" dismissible @dismiss="feedback = null" />

					<section v-if="order.proof" class="mt-6 lg:hidden" aria-labelledby="mobile-pickup-proof-heading">
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Handoff proof</p>
						<h2 id="mobile-pickup-proof-heading" class="mt-1 text-xl font-semibold">{{ order.proof.completedAt }}</h2>
						<dl class="mt-4 divide-y divide-border border-y border-border text-sm">
							<div class="flex justify-between gap-4 py-3"><dt class="text-muted-fg">Verification</dt><dd class="text-right font-medium">{{ order.proof.verificationMethod }}</dd></div>
							<div class="flex justify-between gap-4 py-3"><dt class="text-muted-fg">Handoff</dt><dd class="text-right font-medium">{{ order.proof.handoffMode }}</dd></div>
							<div class="flex justify-between gap-4 py-3"><dt class="text-muted-fg">Completed by</dt><dd class="text-right font-medium">{{ order.proof.staffName }}</dd></div>
						</dl>
					</section>

					<section class="mt-8 scroll-mt-6" aria-labelledby="pickup-items-heading">
						<div class="flex items-end justify-between gap-4">
							<div><p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Prepare order</p><h2 id="pickup-items-heading" class="mt-1 text-xl font-semibold">{{ order.items.length }} pickup {{ order.items.length === 1 ? 'item' : 'items' }}</h2></div>
							<DomStatusPill :tone="allItemsStaged ? 'success' : 'warning'" size="sm">{{ allItemsStaged ? 'All staged' : 'In preparation' }}</DomStatusPill>
						</div>

						<div class="mt-5 divide-y divide-border border-y border-border">
							<article v-for="item in order.items" :key="item.id" class="py-5">
								<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2"><h3 class="font-semibold">{{ item.name }}</h3><DomStatusPill :tone="item.ready ? 'success' : 'warning'" size="sm">{{ item.statusLabel }}</DomStatusPill></div>
										<p class="mt-1 text-sm text-muted-fg">{{ item.detail }} · Qty {{ item.quantity }}</p>
										<p class="mt-2 text-sm leading-6 text-muted-fg">{{ item.note }}</p>
										<div v-if="item.substitution" class="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-sm"><span class="font-semibold">Replacement:</span> {{ item.substitution.name }} · {{ item.substitution.priceDifference }}</div>
									</div>
									<DomButton
										v-if="!isComplete"
										variant="secondary"
										size="sm"
										:loading="stagingItemId === item.id"
										:aria-label="`${item.ready ? 'Return' : 'Mark'} ${item.name} ${item.ready ? 'to preparation' : 'as staged'}`"
										@click="toggleItemStage(item)"
									>{{ item.ready ? 'Return to prep' : 'Mark staged' }}</DomButton>
								</div>
							</article>
						</div>
					</section>

					<section class="mt-8" aria-labelledby="pickup-activity-heading">
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Live activity</p>
						<h2 id="pickup-activity-heading" class="mt-1 text-xl font-semibold">Latest handoff events</h2>
						<ol class="mt-4 divide-y divide-border border-y border-border">
							<li v-for="event in order.events.slice(0, 5)" :key="event.id" class="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 py-3 text-sm">
								<time class="font-medium text-muted-fg">{{ event.time }}</time>
								<div><p class="font-semibold">{{ event.label }}</p><p class="mt-1 leading-6 text-muted-fg">{{ event.detail }} · {{ event.actor }}</p></div>
							</li>
						</ol>
					</section>
				</div>

				<aside class="hidden lg:block lg:border-l lg:border-border lg:pl-8" aria-label="Pickup readiness">
					<div class="lg:sticky lg:top-6">
						<template v-if="order.proof">
							<DomAlert tone="success" title="Handoff proof recorded" :description="`${order.proof.completedAt} · ${order.proof.staffName}`" />
							<dl class="mt-5 divide-y divide-border border-y border-border text-sm">
								<div class="flex justify-between gap-4 py-3"><dt class="text-muted-fg">Verification</dt><dd class="text-right font-medium">{{ order.proof.verificationMethod }}</dd></div>
								<div class="flex justify-between gap-4 py-3"><dt class="text-muted-fg">Handoff</dt><dd class="text-right font-medium">{{ order.proof.handoffMode }}</dd></div>
								<div class="flex justify-between gap-4 py-3"><dt class="text-muted-fg">Location</dt><dd class="text-right font-medium">{{ order.proof.spot }}</dd></div>
							</dl>
						</template>

						<template v-else>
							<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Handoff checklist</p>
							<h2 class="mt-1 text-xl font-semibold">{{ openChecks.length }} {{ openChecks.length === 1 ? 'check' : 'checks' }} remaining</h2>
							<div class="mt-4 divide-y divide-border border-y border-border">
								<div v-for="check in order.checks" :key="check.key" class="flex items-start gap-3 py-3">
									<DomStatusPill :tone="check.passed ? 'success' : 'warning'" size="sm">{{ check.passed ? 'Done' : 'Open' }}</DomStatusPill>
									<div><p class="text-sm font-semibold">{{ check.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div>
								</div>
							</div>
							<div class="mt-5 flex items-center gap-3 border-b border-border pb-5"><DomAvatar :name="order.staff.name" :initials="order.staff.initials" size="md" /><div><p class="text-sm font-semibold">{{ order.staff.name }}</p><p class="text-xs text-muted-fg">{{ order.staff.role }}</p></div></div>
							<div class="mt-5 grid gap-2"><DomButton class="w-full" :loading="isCompleting" @click="handlePrimaryAction">{{ primaryLabel }}</DomButton><DomButton variant="secondary" class="w-full" @click="openVerification">Verification details</DomButton></div>
						</template>
					</div>
				</aside>
			</div>
		</main>

		<div v-if="order && !isComplete" class="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-canvas/95 px-4 py-3 backdrop-blur lg:hidden">
			<DomButton class="w-full" :loading="isCompleting" @click="handlePrimaryAction">{{ primaryLabel }}</DomButton>
		</div>

		<DomDialog v-model="arrivalDialogOpen" title="Update customer arrival" description="Save the exact pickup location so staff can stage and hand off the order." size="md">
			<form class="space-y-4" @submit.prevent="saveArrival">
				<DomSelect v-model="arrivalMethod" label="Arrival method" :options="arrivalMethods" width="min-w-[22rem]" />
				<DomSelect v-model="pickupSpot" label="Pickup spot" :options="pickupSpots" width="min-w-[22rem]" />
				<DomTextareaInput v-model="arrivalNote" label="Arrival note" placeholder="Vehicle, accessibility, or loading detail" :rows="3" />
			</form>
			<template #footer><DomButton variant="ghost" @click="arrivalDialogOpen = false">Cancel</DomButton><DomButton :loading="isSavingArrival" :disabled="!arrivalDraftDirty" @click="saveArrival">Save arrival</DomButton></template>
		</DomDialog>

		<DomDialog v-model="verificationDialogOpen" title="Verify customer and preferences" description="These checks are validated by the pickup API before staff can complete the handoff." size="md">
			<form class="space-y-4" @submit.prevent="saveVerification">
				<DomConfirmationCodeInput
					v-if="verificationCodeRequired"
					v-model="pickupCode"
					label="Four-digit pickup code"
					description="Ask the customer for the code shown in their order confirmation."
					:length="4"
					:separator-after="0"
					character-set="numeric"
				/>
				<DomAlert v-else tone="success" title="Pickup code verified" description="The code is already recorded for this order." />
				<div v-if="substitutionItems.length" class="border-y border-border py-4">
					<p class="text-sm font-semibold">{{ substitutionItems[0].substitution.name }}</p>
					<p class="mt-1 text-sm text-muted-fg">Replacement for {{ substitutionItems[0].name }} · {{ substitutionItems[0].substitution.priceDifference }}</p>
					<DomToggle v-model="substitutionsAccepted" class="mt-3" label="Customer accepts this substitution" />
				</div>
				<DomToggle v-if="order?.verification?.requiresIdCheck" v-model="idChecked" label="Photo ID checked" description="Confirm the customer meets the restricted-item requirement." />
				<DomToggle v-model="contactless" label="Use contactless loading" description="Place the order in the customer’s vehicle without a device handoff." />
			</form>
			<template #footer>
				<DomButton variant="ghost" @click="verificationDialogOpen = false">Cancel</DomButton>
				<DomButton :loading="isSavingVerification" :disabled="!verificationCodeValid || !verificationDraftDirty" @click="saveVerification">Save verification</DomButton>
			</template>
		</DomDialog>
	</section>
</template>
