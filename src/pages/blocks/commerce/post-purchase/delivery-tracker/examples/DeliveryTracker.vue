<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomBadge,
	DomButton,
	DomDialog,
	DomEmptyState,
	DomProgress,
	DomSelect,
	DomStatusPill,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const dropoffOptions = [
	{ label: 'Leave with reception', value: 'reception', description: 'The courier can hand the parcel to reception staff.' },
	{ label: 'Meet at the entrance', value: 'entrance', description: 'Meet the courier at the building entrance.' },
	{ label: 'Leave at the front desk', value: 'front-desk', description: 'Use the staffed front desk or concierge.' },
	{ label: 'Call on arrival', value: 'call-on-arrival', description: 'The courier must call before completing delivery.' },
];

const orders = ref([]);
const selectedOrderId = ref('ord_20482');
const order = ref(null);
const feedback = ref(null);
const loadError = ref('');
const instructionDialogOpen = ref(false);
const dialogMode = ref('instructions');
const dropoff = ref('reception');
const accessCode = ref('');
const deliveryNote = ref('');
const contactless = ref(true);
const isLoading = ref(true);
const isSaving = ref(false);
const isResolving = ref(false);
const isSyncing = ref(false);
let orderRequestSequence = 0;

const orderOptions = computed(() => orders.value.map((item) => ({
	value: item.id,
	label: `Order ${item.number}`,
	description: `${item.statusLabel} · ${item.etaLabel}`,
	actionRequiredCount: item.actionRequiredCount,
})));
const openException = computed(() => order.value?.openExceptions?.[0] || null);
const currentCheckpoint = computed(() => order.value?.activeCheckpoint || null);
const isDelivered = computed(() => order.value?.status === 'delivered');
const activeCheckpointIndex = computed(() => order.value?.activeCheckpointIndex || 0);
const dropoffLabel = computed(() => dropoffOptions.find((option) => option.value === order.value?.instructions?.dropoff)?.label || 'Not set');
const orderTotal = computed(() => (order.value?.items || []).reduce((total, item) => total + item.price, 0));
const accessCodeValid = computed(() => /^[A-Za-z0-9-]{4,12}$/.test(accessCode.value.trim()));
const instructionsDirty = computed(() => {
	if (!order.value) return false;
	return dropoff.value !== order.value.instructions.dropoff
		|| accessCode.value.trim() !== order.value.instructions.accessCode
		|| deliveryNote.value.trim() !== order.value.instructions.note
		|| contactless.value !== order.value.instructions.contactless;
});
const dialogTitle = computed(() => dialogMode.value === 'exception' ? 'Send the entry code' : 'Edit delivery instructions');
const dialogDescription = computed(() => dialogMode.value === 'exception'
	? 'We will send these instructions directly to the courier and clear the delivery blocker.'
	: 'Changes are validated by the order API and remain available after this preview reloads.');

watch(selectedOrderId, (orderId, previousOrderId) => {
	if (orderId && previousOrderId && orderId !== previousOrderId) loadOrder(orderId);
});

onMounted(loadOrders);

/**
 * Requests JSON from the delivery tracker API and promotes non-success
 * responses into ordinary JavaScript errors for consistent recovery UI.
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
 * Loads the order catalog before hydrating the initially selected delivery.
 *
 * @returns {Promise<void>}
 */
async function loadOrders() {
	isLoading.value = true;
	loadError.value = '';
	try {
		const payload = await requestJson('/api/block-demos/delivery-tracker/orders');
		orders.value = Array.isArray(payload.orders) ? payload.orders : [];
		if (!orders.value.length) throw new Error('No tracked deliveries are available.');
		if (!orders.value.some((item) => item.id === selectedOrderId.value)) {
			selectedOrderId.value = orders.value[0].id;
		}
		await loadOrder(selectedOrderId.value);
	} catch (error) {
		loadError.value = error instanceof Error ? error.message : 'Could not load your deliveries.';
		isLoading.value = false;
	}
}

/**
 * Loads one delivery while ignoring stale responses after a quick order switch.
 *
 * @param {string} orderId Canonical order identifier.
 * @returns {Promise<void>}
 */
async function loadOrder(orderId) {
	const requestSequence = ++orderRequestSequence;
	isLoading.value = true;
	loadError.value = '';
	feedback.value = null;
	try {
		const payload = await requestJson(`/api/block-demos/delivery-tracker/${encodeURIComponent(orderId)}`);
		if (requestSequence !== orderRequestSequence) return;
		applyOrder(payload.order);
	} catch (error) {
		if (requestSequence !== orderRequestSequence) return;
		loadError.value = error instanceof Error ? error.message : 'Could not load this delivery.';
	} finally {
		if (requestSequence === orderRequestSequence) isLoading.value = false;
	}
}

/**
 * Applies one complete API order and refreshes the editable instruction draft.
 *
 * @param {Record<string, unknown>} nextOrder API order payload.
 * @returns {void}
 */
function applyOrder(nextOrder) {
	order.value = nextOrder;
	dropoff.value = nextOrder.instructions.dropoff;
	accessCode.value = nextOrder.instructions.accessCode;
	deliveryNote.value = nextOrder.instructions.note;
	contactless.value = nextOrder.instructions.contactless;
	syncOrderSummary(nextOrder.orderSummary);
}

/**
 * Refreshes selector metadata after a delivery mutation.
 *
 * @param {Record<string, unknown>} summary Updated order summary.
 * @returns {void}
 */
function syncOrderSummary(summary) {
	orders.value = orders.value.map((item) => (item.id === summary.id ? { ...item, ...summary } : item));
}

/**
 * Opens the instruction dialog with a general or exception-resolution intent.
 *
 * @param {'instructions'|'exception'} mode Dialog workflow.
 * @returns {void}
 */
function openInstructions(mode = 'instructions') {
	dialogMode.value = mode;
	if (order.value) {
		dropoff.value = order.value.instructions.dropoff;
		accessCode.value = order.value.instructions.accessCode;
		deliveryNote.value = order.value.instructions.note;
		contactless.value = order.value.instructions.contactless;
	}
	feedback.value = null;
	instructionDialogOpen.value = true;
}

/**
 * Saves the current instruction draft through the order API.
 *
 * @returns {Promise<void>}
 */
async function saveInstructions() {
	if (!order.value || !instructionsDirty.value) return;
	isSaving.value = true;
	feedback.value = null;
	try {
		const payload = await requestJson(
			`/api/block-demos/delivery-tracker/${encodeURIComponent(selectedOrderId.value)}/instructions`,
			{
				method: 'PATCH',
				body: JSON.stringify(instructionPayload()),
			},
		);
		applyOrder(payload.order);
		instructionDialogOpen.value = false;
		feedback.value = {
			tone: 'success',
			title: 'Instructions updated',
			description: 'The courier now has your latest drop-off preference and delivery note.',
		};
	} catch (error) {
		feedback.value = {
			tone: 'danger',
			title: 'Instructions not saved',
			description: error instanceof Error ? error.message : 'Check the delivery details and try again.',
		};
	} finally {
		isSaving.value = false;
	}
}

/**
 * Sends the access-code resolution and updated instructions to the API.
 *
 * @returns {Promise<void>}
 */
async function resolveException() {
	if (!order.value || !openException.value || !accessCodeValid.value) return;
	isResolving.value = true;
	feedback.value = null;
	try {
		const payload = await requestJson(
			`/api/block-demos/delivery-tracker/${encodeURIComponent(selectedOrderId.value)}/exceptions/${encodeURIComponent(openException.value.id)}/resolve`,
			{
				method: 'POST',
				body: JSON.stringify(instructionPayload()),
			},
		);
		applyOrder(payload.order);
		instructionDialogOpen.value = false;
		feedback.value = {
			tone: 'success',
			title: 'Entry code sent',
			description: 'The blocker is cleared and the courier can complete the final route.',
		};
	} catch (error) {
		feedback.value = {
			tone: 'danger',
			title: 'Code not sent',
			description: error instanceof Error ? error.message : 'Check the access code and try again.',
		};
	} finally {
		isResolving.value = false;
	}
}

/**
 * Pulls the next deterministic carrier event from the server-owned tracker.
 *
 * @returns {Promise<void>}
 */
async function syncDelivery() {
	if (!order.value || isDelivered.value) return;
	isSyncing.value = true;
	feedback.value = null;
	try {
		const payload = await requestJson(
			`/api/block-demos/delivery-tracker/${encodeURIComponent(selectedOrderId.value)}/sync`,
			{
				method: 'POST',
				body: JSON.stringify({ revision: order.value.revision }),
			},
		);
		applyOrder(payload.order);
		feedback.value = {
			tone: 'success',
			title: 'Tracking refreshed',
			description: `${payload.checkpoint.label} is now the latest carrier update.`,
		};
	} catch (error) {
		feedback.value = {
			tone: 'warning',
			title: 'Tracking needs your attention',
			description: error instanceof Error ? error.message : 'Resolve the open delivery action and refresh again.',
		};
	} finally {
		isSyncing.value = false;
	}
}

/**
 * Builds the shared API payload for instruction and exception mutations.
 *
 * @returns {{ dropoff: string, accessCode: string, note: string, contactless: boolean, revision: number }} Instruction payload.
 */
function instructionPayload() {
	return {
		dropoff: dropoff.value,
		accessCode: accessCode.value.trim(),
		note: deliveryNote.value.trim(),
		contactless: contactless.value,
		revision: order.value.revision,
	};
}

/**
 * Resolves a status tone for an order or checkpoint state.
 *
 * @param {string} status Status identifier.
 * @returns {string} DOM Studio semantic tone.
 */
function statusTone(status) {
	return {
		delivered: 'success',
		complete: 'success',
		current: 'primary',
		out_for_delivery: 'primary',
		in_transit: 'info',
		upcoming: 'neutral',
	}[status] || 'neutral';
}

/**
 * Returns a compact checkpoint label for the five-column mobile progress row.
 *
 * @param {string} checkpointKey Checkpoint identifier.
 * @param {string} fallback Full checkpoint label.
 * @returns {string} Short customer-readable label.
 */
function checkpointCompactLabel(checkpointKey, fallback) {
	return {
		confirmed: 'Confirmed',
		packed: 'Packed',
		handoff: 'Courier',
		nearby: 'Nearby',
		delivered: 'Delivered',
	}[checkpointKey] || fallback;
}

/**
 * Formats a whole-value price in pounds sterling.
 *
 * @param {number} value Monetary value.
 * @returns {string} Localized currency value.
 */
function formatCurrency(value) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		maximumFractionDigits: 0,
	}).format(value || 0);
}
</script>

<template>
	<section class="min-h-screen bg-canvas text-canvas-fg" data-testid="delivery-tracker-block">
		<header class="border-b border-border bg-canvas">
			<div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">DOM Supply</p>
					<h1 class="mt-1 whitespace-nowrap text-xl font-semibold">Track your delivery</h1>
				</div>

				<DomSelect
					v-model="selectedOrderId"
					label="Delivery order"
					:options="orderOptions"
					width="min-w-[22rem]"
				>
					<template #value="{ option }">
						<span class="flex min-w-0 items-center justify-between gap-3">
							<span class="truncate font-semibold">{{ option?.label || `Order ${order?.number || ''}` }}</span>
							<DomBadge v-if="order?.orderSummary?.actionRequiredCount" tone="warning" size="sm">Action needed</DomBadge>
						</span>
					</template>
					<template #option="{ option }">
						<span class="flex min-w-0 items-center justify-between gap-3">
							<span class="min-w-0">
								<span class="block truncate font-semibold">{{ option.label }}</span>
								<span class="block truncate text-xs opacity-75">{{ option.description }}</span>
							</span>
							<DomBadge v-if="option.actionRequiredCount" tone="warning" size="sm">{{ option.actionRequiredCount }}</DomBadge>
						</span>
					</template>
				</DomSelect>
			</div>
		</header>

		<main class="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
			<DomAlert
				v-if="loadError"
				tone="danger"
				title="Tracking unavailable"
				:description="loadError"
			>
				<template #actions>
					<DomButton variant="secondary" size="sm" @click="loadOrders">Try again</DomButton>
				</template>
			</DomAlert>

			<DomEmptyState
				v-else-if="isLoading && !order"
				title="Loading your delivery"
				description="Checking the latest courier status and customer instructions."
				size="sm"
			/>

			<div v-else-if="order" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
				<div class="min-w-0">
					<section aria-labelledby="delivery-status-heading">
						<div class="flex flex-wrap items-center gap-2">
							<DomStatusPill :tone="statusTone(order.status)" size="sm">{{ order.statusLabel }}</DomStatusPill>
							<span class="text-xs text-muted-fg">Updated {{ order.fulfilment.lastUpdatedAt }}</span>
						</div>

						<p class="mt-5 text-sm font-medium text-muted-fg">{{ isDelivered ? 'Delivery complete' : 'Estimated arrival' }}</p>
						<h2 id="delivery-status-heading" class="mt-1 text-3xl font-semibold tracking-tight sm:text-5xl">{{ order.etaLabel }}</h2>
						<p class="mt-3 max-w-2xl text-sm leading-6 text-muted-fg sm:text-base">
							<template v-if="isDelivered">Your order was left at {{ order.proof.location.toLowerCase() }} and received by {{ order.proof.receivedBy }}.</template>
							<template v-else-if="order.fulfilment.stopsAway">{{ order.fulfilment.courierName }} is {{ order.fulfilment.stopsAway }} {{ order.fulfilment.stopsAway === 1 ? 'stop' : 'stops' }} away · {{ order.fulfilment.distanceLabel }}.</template>
							<template v-else>{{ order.fulfilment.distanceLabel }} · A local courier will be assigned before the final route.</template>
						</p>

						<DomProgress
							class="mt-6"
							:value="order.progress"
							label="Delivery progress"
							:tone="isDelivered ? 'success' : 'primary'"
							:size="isDelivered ? 'md' : 'sm'"
							:show-value="false"
						/>

						<ol class="mt-3 grid grid-cols-5 gap-2" aria-label="Delivery checkpoints">
							<li v-for="(checkpoint, index) in order.checkpoints" :key="checkpoint.key" class="min-w-0">
								<span
									class="block text-[9px] font-semibold tracking-tight sm:text-xs sm:tracking-normal"
									:class="index <= activeCheckpointIndex ? 'text-canvas-fg' : 'text-muted-fg'"
									:title="checkpoint.label"
								>
									{{ checkpointCompactLabel(checkpoint.key, checkpoint.label) }}
								</span>
							</li>
						</ol>
					</section>

					<DomAlert
						v-if="openException"
						class="mt-6"
						tone="warning"
						:title="openException.title"
						:description="`${openException.description} ${openException.dueLabel}.`"
					>
						<template #actions>
							<DomButton size="sm" @click="openInstructions('exception')">Add entry code</DomButton>
						</template>
					</DomAlert>

					<DomAlert
						v-if="feedback"
						class="mt-6"
						:tone="feedback.tone"
						:title="feedback.title"
						:description="feedback.description"
						dismissible
						@dismiss="feedback = null"
					/>

					<section class="mt-7 border-y border-border py-5" aria-label="Courier and tracking actions">
						<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div class="flex min-w-0 items-center gap-3">
								<DomAvatar :name="order.fulfilment.courierName" :initials="order.fulfilment.courierInitials" size="lg" />
								<div class="min-w-0">
									<p class="truncate font-semibold">{{ order.fulfilment.courierName }}</p>
									<p class="truncate text-sm text-muted-fg">{{ order.fulfilment.carrier }} · {{ order.fulfilment.vehicle }}</p>
								</div>
							</div>

							<div class="flex flex-wrap gap-2">
								<DomButton variant="secondary" size="sm" :disabled="isDelivered" @click="openInstructions('instructions')">Edit instructions</DomButton>
								<DomButton size="sm" :loading="isSyncing" :disabled="isDelivered" @click="syncDelivery">
									{{ isDelivered ? 'Delivery complete' : 'Refresh tracking' }}
								</DomButton>
							</div>
						</div>
					</section>

					<section class="mt-8" aria-labelledby="timeline-heading">
						<div class="flex items-end justify-between gap-4">
							<div>
								<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Shipment history</p>
								<h2 id="timeline-heading" class="mt-1 text-xl font-semibold">{{ currentCheckpoint.label }}</h2>
							</div>
							<DomBadge :tone="openException ? 'warning' : 'success'">{{ openException ? 'Action required' : 'On track' }}</DomBadge>
						</div>

						<ol class="mt-5 divide-y divide-border border-y border-border">
							<li v-for="checkpoint in [...order.checkpoints].reverse()" :key="checkpoint.key" class="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 py-4">
								<DomStatusPill :tone="statusTone(checkpoint.status)" size="sm">{{ checkpoint.status === 'current' ? 'Now' : checkpoint.status === 'complete' ? 'Done' : 'Next' }}</DomStatusPill>
								<div>
									<p class="font-semibold">{{ checkpoint.label }}</p>
									<p class="mt-1 text-sm leading-6 text-muted-fg">{{ checkpoint.detail }}</p>
								</div>
								<time class="text-xs font-medium text-muted-fg">{{ checkpoint.occurredAt || 'Pending' }}</time>
							</li>
						</ol>
					</section>

					<section class="mt-8 lg:hidden" aria-labelledby="mobile-order-heading">
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Order details</p>
						<h2 id="mobile-order-heading" class="mt-1 text-xl font-semibold">{{ order.items.length }} {{ order.items.length === 1 ? 'item' : 'items' }} · {{ formatCurrency(orderTotal) }}</h2>
						<div class="mt-4 divide-y divide-border border-y border-border">
							<div v-for="item in order.items" :key="item.id" class="flex items-start justify-between gap-4 py-3 text-sm">
								<div>
									<p class="font-semibold">{{ item.name }}</p>
									<p class="mt-1 text-muted-fg">{{ item.detail }}</p>
								</div>
								<span class="font-medium">{{ formatCurrency(item.price) }}</span>
							</div>
						</div>
						<p class="mt-4 text-sm leading-6 text-muted-fg">{{ order.address }}</p>
					</section>
				</div>

				<aside class="hidden border-l border-border pl-8 lg:block" aria-label="Delivery details">
					<section>
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Your instructions</p>
								<h2 class="mt-1 text-lg font-semibold">{{ dropoffLabel }}</h2>
							</div>
							<DomStatusPill tone="success" size="sm">Saved</DomStatusPill>
						</div>
						<p class="mt-3 text-sm leading-6 text-muted-fg">{{ order.instructions.note || 'No additional note.' }}</p>
						<dl class="mt-4 space-y-3 text-sm">
							<div class="flex justify-between gap-4">
								<dt class="text-muted-fg">Entry code</dt>
								<dd class="font-medium">{{ order.instructions.accessCode || 'Not provided' }}</dd>
							</div>
							<div class="flex justify-between gap-4">
								<dt class="text-muted-fg">Contactless</dt>
								<dd class="font-medium">{{ order.instructions.contactless ? 'Allowed' : 'Handoff required' }}</dd>
							</div>
						</dl>
						<DomButton class="mt-5 w-full" variant="secondary" size="sm" :disabled="isDelivered" @click="openInstructions('instructions')">Edit instructions</DomButton>
					</section>

					<section class="mt-7 border-t border-border pt-6">
						<div class="flex items-end justify-between gap-3">
							<div>
								<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Order details</p>
								<h2 class="mt-1 text-lg font-semibold">{{ order.items.length }} {{ order.items.length === 1 ? 'item' : 'items' }}</h2>
							</div>
							<span class="font-semibold">{{ formatCurrency(orderTotal) }}</span>
						</div>

						<div class="mt-4 divide-y divide-border border-y border-border">
							<div v-for="item in order.items" :key="item.id" class="py-3 text-sm">
								<p class="font-semibold">{{ item.name }}</p>
								<div class="mt-1 flex justify-between gap-4 text-muted-fg">
									<span>{{ item.detail }}</span>
									<span>{{ formatCurrency(item.price) }}</span>
								</div>
							</div>
						</div>
						<p class="mt-4 text-sm leading-6 text-muted-fg">{{ order.address }}</p>
					</section>

					<section v-if="order.proof" class="mt-7 border-t border-border pt-6">
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Proof of delivery</p>
						<p class="mt-2 font-semibold">Received by {{ order.proof.receivedBy }}</p>
						<p class="mt-1 text-sm text-muted-fg">{{ order.proof.location }} · {{ order.proof.recordedAt }}</p>
					</section>
				</aside>
			</div>
		</main>

		<DomDialog
			v-model="instructionDialogOpen"
			:title="dialogTitle"
			:description="dialogDescription"
			size="md"
		>
			<form class="space-y-4" @submit.prevent="dialogMode === 'exception' ? resolveException() : saveInstructions()">
				<DomSelect v-model="dropoff" label="Drop-off preference" :options="dropoffOptions" width="min-w-[22rem]" />
				<DomTextInput
					v-model="accessCode"
					label="Entry or access code"
					placeholder="For example 2048"
					:description="dialogMode === 'exception' ? 'Required to clear the current courier blocker.' : 'Optional. Shared only with the delivery team.'"
				/>
				<DomTextareaInput
					v-model="deliveryNote"
					label="Delivery note"
					placeholder="Reception details, safe place, or contact instructions"
					:rows="3"
				/>
				<div class="border-y border-border py-3">
					<DomToggle v-model="contactless" label="Allow contactless delivery" description="The courier can complete delivery without a face-to-face handoff." />
				</div>
			</form>

			<template #footer>
				<DomButton variant="ghost" @click="instructionDialogOpen = false">Cancel</DomButton>
				<DomButton
					v-if="dialogMode === 'exception'"
					:loading="isResolving"
					:disabled="!accessCodeValid"
					@click="resolveException"
				>
					Send code &amp; resolve
				</DomButton>
				<DomButton v-else :loading="isSaving" :disabled="!instructionsDirty" @click="saveInstructions">Save instructions</DomButton>
			</template>
		</DomDialog>
	</section>
</template>
