const allowedDropoffs = new Set(['reception', 'entrance', 'front-desk', 'call-on-arrival']);

const orderSeeds = [
	{
		id: 'ord_20482',
		number: 'GD-20482',
		customerName: 'Alex Morgan',
		status: 'out_for_delivery',
		statusLabel: 'Out for delivery',
		placedAt: '30 July 2026',
		activeCheckpointIndex: 2,
		etaLabel: 'Today, 16:35–16:50',
		etaShort: '16:35–16:50',
		address: '71 Great Portland Street, London W1W 7LR',
		items: [
			{ id: 'workspace-kit', name: 'Workspace starter kit', detail: 'Oak · 1 unit', price: 184 },
			{ id: 'cable-tray', name: 'Magnetic cable tray', detail: 'Black · 1 unit', price: 42 },
		],
		fulfilment: {
			carrier: 'Relay Courier',
			courierName: 'Nina Patel',
			courierInitials: 'NP',
			vehicle: 'Bike 42',
			distanceLabel: '2.1 km away',
			stopsAway: 2,
			lastUpdatedAt: '2 minutes ago',
			proofRequired: true,
		},
		instructions: {
			dropoff: 'reception',
			accessCode: '',
			contactless: true,
			note: 'Reception closes at 18:00.',
			updatedAt: 'Yesterday at 18:12',
		},
		exceptions: [
			{
				id: 'exc_access_code',
				type: 'access_code',
				title: 'Courier needs the entry code',
				description: 'Send it before Nina finishes the next stop to avoid a failed delivery.',
				severity: 'warning',
				actionRequired: true,
				resolved: false,
				dueLabel: 'Due before 16:32',
			},
		],
	},
	{
		id: 'ord_20477',
		number: 'GD-20477',
		customerName: 'Alex Morgan',
		status: 'in_transit',
		statusLabel: 'In transit',
		placedAt: '29 July 2026',
		activeCheckpointIndex: 1,
		etaLabel: 'Tomorrow, 09:00–11:00',
		etaShort: '09:00–11:00',
		address: '18 Rivington Street, London EC2A 3DU',
		items: [
			{ id: 'task-light', name: 'Adjustable task light', detail: 'Sand · 1 unit', price: 96 },
		],
		fulfilment: {
			carrier: 'Northline Parcel',
			courierName: 'Assigned tomorrow',
			courierInitials: 'NP',
			vehicle: 'Local route',
			distanceLabel: 'At regional hub',
			stopsAway: null,
			lastUpdatedAt: '14 minutes ago',
			proofRequired: false,
		},
		instructions: {
			dropoff: 'front-desk',
			accessCode: '',
			contactless: true,
			note: 'Use the commercial entrance on Rivington Street.',
			updatedAt: '30 July at 10:08',
		},
		exceptions: [],
	},
];

const checkpointTemplates = [
	{ key: 'confirmed', label: 'Order confirmed', detail: 'Payment accepted and fulfilment queued.', occurredAt: '12:04' },
	{ key: 'packed', label: 'Packed and dispatched', detail: 'The parcel was sealed and handed to the delivery network.', occurredAt: '13:18' },
	{ key: 'handoff', label: 'With your courier', detail: 'Your local courier collected the parcel for the final route.', occurredAt: '15:22' },
	{ key: 'nearby', label: 'Nearby', detail: 'Your courier is completing the previous stop.', occurredAt: '16:31' },
	{ key: 'delivered', label: 'Delivered', detail: 'Proof of delivery was recorded at the requested location.', occurredAt: '16:44' },
];

const orders = new Map(orderSeeds.map((seed) => [seed.id, createOrder(seed)]));
let activitySequence = 0;

/**
 * Lists delivery orders available to the tracker example.
 *
 * @returns {Array<object>} Order summaries for the rich order selector.
 */
export function listDeliveryTrackerOrders() {
	return [...orders.values()].map(serializeOrderSummary);
}

/**
 * Returns one complete customer-visible delivery resource.
 *
 * @param {string} orderId Delivery order identifier.
 * @returns {{ order?: object, error?: string, status?: number }} Delivery result.
 */
export function getDeliveryTrackerOrder(orderId) {
	const order = orders.get(String(orderId || ''));
	if (!order) return { error: 'Delivery order not found.', status: 404 };
	return { order: serializeOrder(order) };
}

/**
 * Validates and saves customer delivery instructions.
 *
 * @param {string} orderId Delivery order identifier.
 * @param {Record<string, unknown>} input Requested instruction changes.
 * @returns {{ order?: object, error?: string, status?: number }} Mutation result.
 */
export function updateDeliveryInstructions(orderId, input = {}) {
	const order = orders.get(String(orderId || ''));
	if (!order) return { error: 'Delivery order not found.', status: 404 };
	if (order.status === 'delivered') return { error: 'Delivery instructions cannot change after proof of delivery is recorded.', status: 409 };

	const revisionError = validateRevision(order, input.revision);
	if (revisionError) return revisionError;
	const normalized = normalizeInstructions(order.instructions, input);
	if (normalized.error) return normalized;

	order.instructions = {
		...normalized.value,
		updatedAt: 'Just now',
	};
	order.revision += 1;
	order.activityEvents.unshift(createActivityEvent('Delivery instructions updated', 'Alex Morgan'));
	return { order: serializeOrder(order) };
}

/**
 * Resolves one customer-actionable delivery exception.
 *
 * @param {string} orderId Delivery order identifier.
 * @param {string} exceptionId Exception identifier.
 * @param {Record<string, unknown>} input Resolution payload.
 * @returns {{ order?: object, exception?: object, error?: string, status?: number }} Mutation result.
 */
export function resolveDeliveryException(orderId, exceptionId, input = {}) {
	const order = orders.get(String(orderId || ''));
	if (!order) return { error: 'Delivery order not found.', status: 404 };

	const revisionError = validateRevision(order, input.revision);
	if (revisionError) return revisionError;
	const exception = order.exceptions.find((candidate) => candidate.id === exceptionId);
	if (!exception) return { error: 'Delivery exception not found.', status: 404 };
	if (exception.resolved) return { error: 'This delivery exception is already resolved.', status: 409 };
	const normalized = normalizeInstructions(order.instructions, input);
	if (normalized.error) return normalized;

	if (exception.type === 'access_code') {
		const accessCode = normalized.value.accessCode;
		if (!/^[A-Za-z0-9-]{4,12}$/.test(accessCode)) {
			return { error: 'Enter a 4–12 character access code using letters, numbers, or hyphens.', status: 400 };
		}
	}

	order.instructions = {
		...normalized.value,
		updatedAt: 'Just now',
	};
	exception.resolved = true;
	exception.resolvedAt = 'Just now';
	exception.resolvedBy = 'Alex Morgan';
	order.revision += 1;
	order.activityEvents.unshift(createActivityEvent(`${exception.title} resolved`, 'Alex Morgan'));
	return {
		order: serializeOrder(order),
		exception: clone(exception),
	};
}

/**
 * Pulls the next deterministic carrier scan into the customer tracker.
 *
 * @param {string} orderId Delivery order identifier.
 * @param {Record<string, unknown>} input Sync options.
 * @returns {{ order?: object, checkpoint?: object, error?: string, status?: number }} Sync result.
 */
export function syncDeliveryTrackerOrder(orderId, input = {}) {
	const order = orders.get(String(orderId || ''));
	if (!order) return { error: 'Delivery order not found.', status: 404 };

	const revisionError = validateRevision(order, input.revision);
	if (revisionError) return revisionError;
	if (order.status === 'delivered') return { error: 'This delivery already has final proof recorded.', status: 409 };
	const blockingException = order.exceptions.find((exception) => exception.actionRequired && !exception.resolved);
	if (blockingException) {
		return { error: `Resolve “${blockingException.title}” before the courier can complete this delivery.`, status: 409 };
	}

	order.activeCheckpointIndex = Math.min(order.activeCheckpointIndex + 1, checkpointTemplates.length - 1);
	const checkpoint = checkpointTemplates[order.activeCheckpointIndex];
	applyCheckpointState(order, checkpoint.key);
	order.revision += 1;
	order.activityEvents.unshift(createActivityEvent(`Carrier update: ${checkpoint.label}`, order.fulfilment.carrier));
	return {
		order: serializeOrder(order),
		checkpoint: clone(resolveCheckpoints(order)[order.activeCheckpointIndex]),
	};
}

/**
 * Creates the mutable store record for one seeded delivery order.
 *
 * @param {object} seed Delivery seed.
 * @returns {object} Mutable delivery order.
 */
function createOrder(seed) {
	return {
		...clone(seed),
		revision: 8,
		activityEvents: [
			{ id: `${seed.id}-courier`, label: 'Courier status updated', actor: seed.fulfilment.carrier, time: seed.fulfilment.lastUpdatedAt },
			{ id: `${seed.id}-instructions`, label: 'Delivery instructions confirmed', actor: seed.customerName, time: seed.instructions.updatedAt },
		],
	};
}

/**
 * Applies customer-visible fulfilment metadata for a carrier checkpoint.
 *
 * @param {object} order Mutable delivery order.
 * @param {string} checkpointKey Checkpoint identifier.
 * @returns {void}
 */
function applyCheckpointState(order, checkpointKey) {
	order.fulfilment.lastUpdatedAt = 'Just now';
	if (checkpointKey === 'nearby') {
		order.status = 'out_for_delivery';
		order.statusLabel = 'Nearby';
		order.fulfilment.distanceLabel = '650 m away';
		order.fulfilment.stopsAway = 1;
		order.etaLabel = 'Today, 16:35–16:45';
		order.etaShort = '16:35–16:45';
	}
	if (checkpointKey === 'delivered') {
		order.status = 'delivered';
		order.statusLabel = 'Delivered';
		order.fulfilment.distanceLabel = 'Delivery complete';
		order.fulfilment.stopsAway = 0;
		order.etaLabel = 'Delivered today at 16:44';
		order.etaShort = 'Delivered 16:44';
		order.proof = {
			location: 'Reception',
			receivedBy: 'Ana',
			recordedAt: 'Today at 16:44',
		};
	}
}

/**
 * Validates and normalizes a delivery-instruction payload.
 *
 * @param {object} currentInstructions Current instruction state.
 * @param {Record<string, unknown>} input Requested instruction changes.
 * @returns {{ value?: object, error?: string, status?: number }} Validation result.
 */
function normalizeInstructions(currentInstructions, input) {
	const dropoff = String(input.dropoff ?? currentInstructions.dropoff);
	const accessCode = String(input.accessCode ?? currentInstructions.accessCode).trim();
	const note = String(input.note ?? currentInstructions.note).trim();
	const contactless = input.contactless === undefined ? currentInstructions.contactless : Boolean(input.contactless);

	if (!allowedDropoffs.has(dropoff)) return { error: 'Choose a supported drop-off preference.', status: 400 };
	if (accessCode && !/^[A-Za-z0-9-]{4,12}$/.test(accessCode)) {
		return { error: 'Access codes must contain 4–12 letters, numbers, or hyphens.', status: 400 };
	}
	if (note.length > 240) return { error: 'Delivery notes must be 240 characters or fewer.', status: 400 };

	return {
		value: {
			dropoff,
			accessCode,
			contactless,
			note,
		},
	};
}

/**
 * Resolves immutable checkpoint presentation from the active store index.
 *
 * @param {object} order Delivery order.
 * @returns {Array<object>} Customer-readable checkpoints.
 */
function resolveCheckpoints(order) {
	return checkpointTemplates.map((checkpoint, index) => ({
		...checkpoint,
		status: index < order.activeCheckpointIndex
			? 'complete'
			: index === order.activeCheckpointIndex
				? 'current'
				: 'upcoming',
		occurredAt: index <= order.activeCheckpointIndex ? checkpoint.occurredAt : null,
	}));
}

/**
 * Validates an optimistic order revision when one is supplied.
 *
 * @param {object} order Stored delivery order.
 * @param {unknown} revision Requested revision.
 * @returns {{ error: string, status: number } | null} Conflict response when stale.
 */
function validateRevision(order, revision) {
	if (revision === undefined || revision === null) return null;
	if (Number(revision) === order.revision) return null;
	return { error: 'Delivery details changed in another session. Reload before sending this update.', status: 409 };
}

/**
 * Serializes one order for the resource selector.
 *
 * @param {object} order Stored delivery order.
 * @returns {object} Order summary.
 */
function serializeOrderSummary(order) {
	return {
		id: order.id,
		number: order.number,
		status: order.status,
		statusLabel: order.statusLabel,
		etaLabel: order.etaLabel,
		itemCount: order.items.length,
		actionRequiredCount: order.exceptions.filter((exception) => exception.actionRequired && !exception.resolved).length,
	};
}

/**
 * Serializes an order without exposing mutable process-local references.
 *
 * @param {object} order Stored delivery order.
 * @returns {object} API-safe order payload.
 */
function serializeOrder(order) {
	return clone({
		...order,
		checkpoints: resolveCheckpoints(order),
		activeCheckpoint: resolveCheckpoints(order)[order.activeCheckpointIndex],
		progress: Math.round((order.activeCheckpointIndex / (checkpointTemplates.length - 1)) * 100),
		openExceptions: order.exceptions.filter((exception) => !exception.resolved),
		orderSummary: serializeOrderSummary(order),
		activityEvents: order.activityEvents.slice(0, 8),
	});
}

/**
 * Creates one process-local activity event for a demo API mutation.
 *
 * @param {string} label Event description.
 * @param {string} actor Event actor.
 * @returns {{ id: string, label: string, actor: string, time: string }} Activity event.
 */
function createActivityEvent(label, actor) {
	activitySequence += 1;
	return {
		id: `delivery-activity-${activitySequence}`,
		label,
		actor,
		time: 'Just now',
	};
}

/**
 * Creates a detached JSON-compatible copy of a demo record.
 *
 * @template T
 * @param {T} value Value to clone.
 * @returns {T} Detached copy.
 */
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}
