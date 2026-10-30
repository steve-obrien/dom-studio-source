const allowedArrivalMethods = new Set(['curbside', 'walk-up', 'drive-through']);
const allowedSpots = new Set(['B2', 'B3', 'front-entrance', 'inside-counter']);

const orders = new Map([
	createOrder({
		id: 'ord_7831',
		number: 'PU-7831',
		status: 'arrived',
		statusLabel: 'Customer arrived',
		pickupWindowLabel: 'Today · 16:30–17:00',
		waitMinutes: 7,
		customer: { name: 'Maya Chen', initials: 'MC', vehicle: 'Blue hatchback' },
		location: { name: 'Soho Market', address: '18 Broadwick Street, London W1F 8HS' },
		arrival: { method: 'curbside', spot: 'B2', note: 'Trunk is open for contactless loading.', updatedAt: '16:34' },
		verification: { expectedCode: '4821', codeVerifiedAt: null, requiresIdCheck: true, idCheckedAt: null },
		preferences: { contactless: true, substitutionsAccepted: false },
		items: [
			{ id: 'cold-bag', name: 'Chilled meal kit', detail: 'Dinner for two · Cold chain', quantity: 1, ready: true, statusLabel: 'Staged', note: 'Keep below 5°C until handoff.', restricted: false, substitution: null },
			{ id: 'oat-milk', name: 'Oat milk multipack', detail: '6 × 1L cartons', quantity: 2, ready: false, statusLabel: 'Needs staging', note: 'Original unavailable. Barista blend is reserved.', restricted: false, substitution: { name: 'Barista blend multipack', priceDifference: '+£0.70' } },
			{ id: 'mixer-case', name: 'Sparkling mixer case', detail: '12 × 250ml bottles · Restricted', quantity: 1, ready: true, statusLabel: 'Staged', note: 'Photo ID must be checked before loading.', restricted: true, substitution: null },
		],
		staff: { name: 'Jordan Ellis', initials: 'JE', role: 'Pickup lead' },
		events: [
			{ id: 'event-arrived', label: 'Customer checked in', detail: 'Curbside · Bay B2', actor: 'Maya Chen', time: '16:34' },
			{ id: 'event-cold', label: 'Cold bag staged', detail: 'Temperature label scanned', actor: 'Jordan Ellis', time: '16:29' },
			{ id: 'event-sub', label: 'Substitution reserved', detail: 'Barista blend held for approval', actor: 'Priya Rao', time: '16:21' },
		],
	}),
	createOrder({
		id: 'ord_7828',
		number: 'PU-7828',
		status: 'arrived',
		statusLabel: 'Customer arrived',
		pickupWindowLabel: 'Today · 16:15–16:45',
		waitMinutes: 3,
		customer: { name: 'Theo Brooks', initials: 'TB', vehicle: 'Walk-up customer' },
		location: { name: 'Soho Market', address: '18 Broadwick Street, London W1F 8HS' },
		arrival: { method: 'walk-up', spot: 'inside-counter', note: 'Waiting beside the collection sign.', updatedAt: '16:38' },
		verification: { expectedCode: '7316', codeVerifiedAt: null, requiresIdCheck: false, idCheckedAt: null },
		preferences: { contactless: false, substitutionsAccepted: true },
		items: [
			{ id: 'desk-organiser', name: 'Desk organiser set', detail: 'Natural oak · 1 set', quantity: 1, ready: true, statusLabel: 'Staged', note: 'Collection bag is behind counter two.', restricted: false, substitution: null },
		],
		staff: { name: 'Jordan Ellis', initials: 'JE', role: 'Pickup lead' },
		events: [
			{ id: 'event-arrived-7828', label: 'Customer checked in', detail: 'Walk-up · Inside counter', actor: 'Theo Brooks', time: '16:38' },
			{ id: 'event-ready-7828', label: 'Order staged', detail: '1 item ready at counter two', actor: 'Jordan Ellis', time: '16:26' },
		],
	}),
].map((order) => [order.id, order]));

let eventSequence = 0;

/**
 * Lists pickup orders available to the handoff example.
 *
 * @returns {Array<object>} Pickup order summaries.
 */
export function listPickupHandoffOrders() {
	return [...orders.values()].map(serializeOrderSummary);
}

/**
 * Returns one pickup order without its expected verification code.
 *
 * @param {string} orderId Pickup order identifier.
 * @returns {{ order?: object, error?: string, status?: number }} Pickup result.
 */
export function getPickupHandoffOrder(orderId) {
	const order = findOrder(orderId);
	if (!order) return { error: 'Pickup order not found.', status: 404 };
	return { order: serializeOrder(order) };
}

/**
 * Validates and saves the customer's reported arrival location.
 *
 * @param {string} orderId Pickup order identifier.
 * @param {Record<string, unknown>} input Arrival changes.
 * @returns {{ order?: object, error?: string, status?: number }} Mutation result.
 */
export function updatePickupArrival(orderId, input = {}) {
	const order = findOrder(orderId);
	if (!order) return { error: 'Pickup order not found.', status: 404 };
	const mutationError = validateMutableOrder(order, input.revision);
	if (mutationError) return mutationError;

	const method = String(input.method ?? order.arrival.method);
	const spot = String(input.spot ?? order.arrival.spot);
	const note = String(input.note ?? order.arrival.note).trim();
	if (!allowedArrivalMethods.has(method)) return { error: 'Choose a supported arrival method.', status: 400 };
	if (!allowedSpots.has(spot)) return { error: 'Choose a supported pickup spot.', status: 400 };
	if (note.length > 180) return { error: 'Arrival notes must be 180 characters or fewer.', status: 400 };

	order.arrival = { method, spot, note, updatedAt: 'Just now' };
	order.revision += 1;
	order.events.unshift(createEvent('Arrival details updated', `${arrivalMethodLabel(method)} · ${spotLabel(spot)}`, order.staff.name));
	return { order: serializeOrder(order) };
}

/**
 * Marks one order item staged or returns it to preparation.
 *
 * @param {string} orderId Pickup order identifier.
 * @param {string} itemId Pickup item identifier.
 * @param {Record<string, unknown>} input Staging change.
 * @returns {{ order?: object, item?: object, error?: string, status?: number }} Mutation result.
 */
export function updatePickupItemStage(orderId, itemId, input = {}) {
	const order = findOrder(orderId);
	if (!order) return { error: 'Pickup order not found.', status: 404 };
	const mutationError = validateMutableOrder(order, input.revision);
	if (mutationError) return mutationError;
	const item = order.items.find((candidate) => candidate.id === itemId);
	if (!item) return { error: 'Pickup item not found.', status: 404 };

	item.ready = input.ready === undefined ? true : Boolean(input.ready);
	item.statusLabel = item.ready ? 'Staged' : 'Needs staging';
	order.revision += 1;
	order.events.unshift(createEvent(
		item.ready ? `${item.name} staged` : `${item.name} returned to preparation`,
		item.ready ? 'Ready for customer handoff' : 'Removed from the staged order',
		order.staff.name,
	));
	return { order: serializeOrder(order), item: clone(item) };
}

/**
 * Saves the customer handoff preferences and substitution decision.
 *
 * @param {string} orderId Pickup order identifier.
 * @param {Record<string, unknown>} input Preference changes.
 * @returns {{ order?: object, error?: string, status?: number }} Mutation result.
 */
export function updatePickupPreferences(orderId, input = {}) {
	const order = findOrder(orderId);
	if (!order) return { error: 'Pickup order not found.', status: 404 };
	const mutationError = validateMutableOrder(order, input.revision);
	if (mutationError) return mutationError;
	order.preferences = {
		contactless: input.contactless === undefined ? order.preferences.contactless : Boolean(input.contactless),
		substitutionsAccepted: input.substitutionsAccepted === undefined ? order.preferences.substitutionsAccepted : Boolean(input.substitutionsAccepted),
	};
	order.revision += 1;
	order.events.unshift(createEvent('Handoff preferences updated', preferenceEventDetail(order), order.customer.name));
	return { order: serializeOrder(order) };
}

/**
 * Verifies the customer's pickup code and any required photo ID check.
 *
 * @param {string} orderId Pickup order identifier.
 * @param {Record<string, unknown>} input Verification attempt.
 * @returns {{ order?: object, verification?: object, error?: string, status?: number }} Mutation result.
 */
export function verifyPickupCustomer(orderId, input = {}) {
	const order = findOrder(orderId);
	if (!order) return { error: 'Pickup order not found.', status: 404 };
	const mutationError = validateMutableOrder(order, input.revision);
	if (mutationError) return mutationError;

	const code = String(input.code || '').trim();
	const codeAlreadyVerified = Boolean(order.verification.codeVerifiedAt);
	if (!codeAlreadyVerified && !/^\d{4}$/.test(code)) return { error: 'Enter the four-digit pickup code.', status: 400 };
	if (!codeAlreadyVerified && code !== order.verification.expectedCode) return { error: 'That pickup code does not match this order.', status: 400 };

	order.verification.codeVerifiedAt ||= 'Just now';
	if (order.verification.requiresIdCheck && input.idChecked) order.verification.idCheckedAt = 'Just now';
	order.revision += 1;
	order.events.unshift(createEvent(
		'Customer verified',
		order.verification.idCheckedAt ? 'Pickup code and photo ID confirmed' : 'Pickup code confirmed',
		order.staff.name,
	));
	return { order: serializeOrder(order), verification: serializeVerification(order.verification) };
}

/**
 * Completes a pickup only when every readiness check passes.
 *
 * @param {string} orderId Pickup order identifier.
 * @param {Record<string, unknown>} input Completion request.
 * @returns {{ order?: object, proof?: object, blockers?: Array<object>, error?: string, status?: number }} Completion result.
 */
export function completePickupHandoff(orderId, input = {}) {
	const order = findOrder(orderId);
	if (!order) return { error: 'Pickup order not found.', status: 404 };
	const mutationError = validateMutableOrder(order, input.revision);
	if (mutationError) return mutationError;

	const blockers = buildChecks(order).filter((check) => !check.passed);
	if (blockers.length) return { error: 'This pickup still has required checks to complete.', status: 409, blockers };

	order.status = 'complete';
	order.statusLabel = 'Handoff complete';
	order.waitMinutes = 0;
	order.proof = {
		completedAt: 'Today at 16:44',
		staffName: order.staff.name,
		verificationMethod: order.verification.requiresIdCheck ? 'Pickup code and photo ID' : 'Pickup code',
		handoffMode: order.preferences.contactless ? 'Contactless loading' : 'Staff handoff',
		spot: spotLabel(order.arrival.spot),
	};
	order.revision += 1;
	order.events.unshift(createEvent('Pickup completed', `${order.proof.handoffMode} · ${order.proof.spot}`, order.staff.name));
	return { order: serializeOrder(order), proof: clone(order.proof) };
}

/**
 * Creates a mutable pickup order from a seed record.
 *
 * @param {object} seed Pickup seed.
 * @returns {object} Mutable pickup order.
 */
function createOrder(seed) {
	return { ...clone(seed), revision: 12, proof: null };
}

/**
 * Looks up a pickup order from an arbitrary identifier.
 *
 * @param {string} orderId Pickup order identifier.
 * @returns {object|null} Stored order or null.
 */
function findOrder(orderId) {
	return orders.get(String(orderId || '')) || null;
}

/**
 * Guards a revisioned pickup mutation and completed orders.
 *
 * @param {object} order Stored pickup order.
 * @param {unknown} revision Requested revision.
 * @returns {{ error: string, status: number } | null} Conflict response when mutation is unsafe.
 */
function validateMutableOrder(order, revision) {
	if (order.status === 'complete') return { error: 'This pickup already has final handoff proof.', status: 409 };
	if (revision === undefined || revision === null || Number(revision) === order.revision) return null;
	return { error: 'Pickup details changed in another session. Reload before sending this update.', status: 409 };
}

/**
 * Builds server-owned handoff readiness checks for an order.
 *
 * @param {object} order Stored pickup order.
 * @returns {Array<{ key: string, label: string, detail: string, passed: boolean }>} Readiness checks.
 */
function buildChecks(order) {
	const hasSubstitution = order.items.some((item) => item.substitution);
	const hasRestrictedItem = order.items.some((item) => item.restricted);
	const stagedCount = order.items.filter((item) => item.ready).length;
	return [
		{ key: 'arrival', label: 'Arrival recorded', detail: `${arrivalMethodLabel(order.arrival.method)} · ${spotLabel(order.arrival.spot)}`, passed: Boolean(order.arrival.method && order.arrival.spot) },
		{ key: 'items', label: 'Items staged', detail: `${stagedCount} of ${order.items.length} ready`, passed: stagedCount === order.items.length },
		{ key: 'substitutions', label: 'Substitution decision', detail: hasSubstitution ? order.preferences.substitutionsAccepted ? 'Customer accepted the replacement' : 'Customer approval required' : 'No substitutions in this order', passed: !hasSubstitution || order.preferences.substitutionsAccepted },
		{ key: 'code', label: 'Pickup code', detail: order.verification.codeVerifiedAt ? 'Verified by pickup lead' : 'Four-digit code required', passed: Boolean(order.verification.codeVerifiedAt) },
		{ key: 'identity', label: 'Restricted item check', detail: hasRestrictedItem ? order.verification.idCheckedAt ? 'Photo ID checked' : 'Photo ID must be checked' : 'No restricted items', passed: !hasRestrictedItem || Boolean(order.verification.idCheckedAt) },
	];
}

/**
 * Serializes one pickup order for the rich order selector.
 *
 * @param {object} order Stored pickup order.
 * @returns {object} Order summary.
 */
function serializeOrderSummary(order) {
	const checks = buildChecks(order);
	return {
		id: order.id,
		number: order.number,
		customerName: order.customer.name,
		status: order.status,
		statusLabel: order.statusLabel,
		waitMinutes: order.waitMinutes,
		openCheckCount: checks.filter((check) => !check.passed).length,
		nextAction: nextAction(checks, order.status),
	};
}

/**
 * Serializes a complete pickup order without the expected pickup code.
 *
 * @param {object} order Stored pickup order.
 * @returns {object} API-safe order payload.
 */
function serializeOrder(order) {
	const checks = buildChecks(order);
	return clone({
		...order,
		verification: serializeVerification(order.verification),
		checks,
		progress: Math.round((checks.filter((check) => check.passed).length / checks.length) * 100),
		nextAction: nextAction(checks, order.status),
		orderSummary: serializeOrderSummary(order),
		events: order.events.slice(0, 10),
	});
}

/**
 * Removes the server-owned expected pickup code from verification state.
 *
 * @param {object} verification Stored verification state.
 * @returns {object} Customer-safe verification state.
 */
function serializeVerification(verification) {
	return { codeVerifiedAt: verification.codeVerifiedAt, requiresIdCheck: verification.requiresIdCheck, idCheckedAt: verification.idCheckedAt };
}

/**
 * Resolves the next staff action from the first incomplete readiness check.
 *
 * @param {Array<object>} checks Readiness checks.
 * @param {string} status Pickup status.
 * @returns {{ key: string, label: string, description: string }} Next action.
 */
function nextAction(checks, status) {
	if (status === 'complete') return { key: 'complete', label: 'Handoff complete', description: 'Final proof is recorded for this pickup.' };
	const openCheck = checks.find((check) => !check.passed);
	if (!openCheck) return { key: 'complete-handoff', label: 'Complete handoff', description: 'Every required check is ready.' };
	return {
		arrival: { key: 'arrival', label: 'Record arrival', description: 'Confirm how and where the customer is waiting.' },
		items: { key: 'items', label: 'Stage remaining items', description: 'Prepare every item before customer verification.' },
		substitutions: { key: 'verification', label: 'Review substitution', description: 'Record the customer decision before loading.' },
		code: { key: 'verification', label: 'Verify customer', description: 'Enter the four-digit pickup code.' },
		identity: { key: 'verification', label: 'Confirm photo ID', description: 'Complete the restricted-item check.' },
	}[openCheck.key];
}

/**
 * Formats an arrival method for customer-visible copy.
 *
 * @param {string} method Arrival method identifier.
 * @returns {string} Arrival method label.
 */
function arrivalMethodLabel(method) {
	return { curbside: 'Curbside', 'walk-up': 'Walk-up counter', 'drive-through': 'Drive-through' }[method] || method;
}

/**
 * Formats a pickup spot for customer-visible copy.
 *
 * @param {string} spot Pickup spot identifier.
 * @returns {string} Pickup spot label.
 */
function spotLabel(spot) {
	return { B2: 'Bay B2', B3: 'Bay B3', 'front-entrance': 'Front entrance', 'inside-counter': 'Inside counter' }[spot] || spot;
}

/**
 * Builds preference copy for the activity timeline.
 *
 * @param {object} order Stored pickup order.
 * @returns {string} Preference event detail.
 */
function preferenceEventDetail(order) {
	return `${order.preferences.contactless ? 'Contactless loading' : 'Staff handoff'} · ${order.preferences.substitutionsAccepted ? 'substitution accepted' : 'substitution pending'}`;
}

/**
 * Creates one process-local pickup activity event.
 *
 * @param {string} label Event label.
 * @param {string} detail Event detail.
 * @param {string} actor Event actor.
 * @returns {{ id: string, label: string, detail: string, actor: string, time: string }} Activity event.
 */
function createEvent(label, detail, actor) {
	eventSequence += 1;
	return { id: `pickup-event-${eventSequence}`, label, detail, actor, time: 'Just now' };
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
