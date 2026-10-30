const allowedReasons = new Set(['too-large', 'too-small', 'changed-mind', 'damaged', 'wrong-item']);
const allowedResolutions = new Set(['exchange', 'refund', 'credit']);
const allowedMethods = new Set(['drop-off', 'pickup', 'in-store']);

const orders = new Map([
	createReturnOrder({
		id: 'ord_10482',
		number: 'ORD-10482',
		status: 'eligible',
		statusLabel: 'Return available',
		placedAt: 'May 24, 2026',
		deliveredAt: 'May 28, 2026',
		returnBy: 'Jun 27, 2026',
		windowDaysLeft: 18,
		customer: { name: 'Alex Morgan', email: 'alex@example.com' },
		payment: { label: 'Visa ending 4242', method: 'visa', last4: '4242' },
		items: [
			{
				id: 'linen-shirt',
				name: 'Linen camp collar shirt',
				variant: 'Sage · Medium',
				sku: 'LS-204-M-SGE',
				price: 84,
				quantity: 1,
				eligible: true,
				eligibilityLabel: 'Eligible until Jun 27',
				policyDetail: 'Unworn items with tags can be returned or exchanged.',
				exchangeOptions: [
					{ value: 'linen-shirt-small', label: 'Small', description: '3 in stock · dispatches tomorrow' },
					{ value: 'linen-shirt-large', label: 'Large', description: '8 in stock · dispatches tomorrow' },
					{ value: 'linen-shirt-xl', label: 'Extra large', description: '2 in stock · dispatches in 2 days' },
				],
			},
			{
				id: 'canvas-tote',
				name: 'Everyday canvas tote',
				variant: 'Natural',
				sku: 'CT-118-NAT',
				price: 38,
				quantity: 1,
				eligible: true,
				eligibilityLabel: 'Eligible until Jun 27',
				policyDetail: 'Unused accessories can be refunded or returned for credit.',
				exchangeOptions: [],
			},
			{
				id: 'archive-scarf',
				name: 'Archive silk scarf',
				variant: 'Limited edition',
				sku: 'AS-332-LTD',
				price: 62,
				quantity: 1,
				eligible: false,
				eligibilityLabel: 'Final sale',
				policyDetail: 'Limited-edition archive items are not returnable.',
				exchangeOptions: [],
			},
		],
		draft: {
			selectedItemIds: ['linen-shirt'],
			reasons: { 'linen-shirt': 'too-large' },
			resolution: 'exchange',
			exchangeOption: 'linen-shirt-large',
			returnMethod: 'drop-off',
			contactEmail: 'alex@example.com',
			notes: 'Please reserve one size larger if it is still available.',
			conditionConfirmed: true,
		},
		activity: [
			{ id: 'event-delivered-10482', label: 'Order delivered', detail: 'All items delivered by DPD.', time: 'May 28, 2026' },
			{ id: 'event-window-10482', label: 'Return window opened', detail: '30-day return period started after delivery.', time: 'May 28, 2026' },
		],
	}),
	createReturnOrder({
		id: 'ord_10398',
		number: 'ORD-10398',
		status: 'return-created',
		statusLabel: 'Return in transit',
		placedAt: 'Apr 30, 2026',
		deliveredAt: 'May 04, 2026',
		returnBy: 'Jun 03, 2026',
		windowDaysLeft: 0,
		customer: { name: 'Alex Morgan', email: 'alex@example.com' },
		payment: { label: 'Visa ending 4242', method: 'visa', last4: '4242' },
		items: [
			{
				id: 'ribbed-cardigan',
				name: 'Ribbed cotton cardigan',
				variant: 'Oat · Medium',
				sku: 'RC-441-M-OAT',
				price: 96,
				quantity: 1,
				eligible: true,
				eligibilityLabel: 'Returned',
				policyDetail: 'Return approved and scanned by the carrier.',
				exchangeOptions: [],
			},
		],
		draft: {
			selectedItemIds: ['ribbed-cardigan'],
			reasons: { 'ribbed-cardigan': 'too-small' },
			resolution: 'refund',
			exchangeOption: '',
			returnMethod: 'drop-off',
			contactEmail: 'alex@example.com',
			notes: '',
			conditionConfirmed: true,
		},
		submittedReturn: {
			id: 'ret_23984',
			number: 'RET-23984',
			status: 'in-transit',
			statusLabel: 'In transit to warehouse',
			submittedAt: 'May 18 at 14:26',
			resolutionLabel: 'Refund to Visa ending 4242',
			methodLabel: 'DPD drop-off',
			estimatedAmount: 96,
			labelReference: 'DPD-RET-849201',
			nextStep: 'Refund starts after the warehouse inspection.',
		},
		activity: [
			{ id: 'event-scan-10398', label: 'Parcel scanned by DPD', detail: 'Tracking DPD-RET-849201 is moving to the warehouse.', time: 'May 20, 2026' },
			{ id: 'event-created-10398', label: 'Return approved', detail: 'Drop-off label generated and emailed.', time: 'May 18, 2026' },
		],
	}),
].map((order) => [order.id, order]));

let returnSequence = 24018;
let activitySequence = 0;

/**
 * Lists orders available to the returns self-service example.
 *
 * @returns {Array<object>} Order summaries for the rich order selector.
 */
export function listReturnOrders() {
	return [...orders.values()].map(serializeOrderSummary);
}

/**
 * Returns one order, its current draft, eligibility, and return history.
 *
 * @param {string} orderId Order identifier.
 * @returns {{ order?: object, error?: string, status?: number }} Order result.
 */
export function getReturnOrder(orderId) {
	const order = findOrder(orderId);
	if (!order) return { error: 'Return order not found.', status: 404 };
	return { order: serializeOrder(order) };
}

/**
 * Validates and persists a complete return draft for an order.
 *
 * @param {string} orderId Order identifier.
 * @param {Record<string, unknown>} input Draft request.
 * @returns {{ order?: object, blockers?: Array<object>, error?: string, status?: number }} Draft mutation result.
 */
export function updateReturnDraft(orderId, input = {}) {
	const order = findOrder(orderId);
	if (!order) return { error: 'Return order not found.', status: 404 };
	if (order.submittedReturn) return { error: 'This order already has an active return request.', status: 409 };
	const revisionError = validateRevision(order, input.revision);
	if (revisionError) return revisionError;

	const normalized = normalizeDraft(order, input);
	if (normalized.error) return normalized;
	order.draft = normalized.draft;
	order.revision += 1;
	order.activity.unshift(createActivity('Return draft saved', draftActivityDetail(order)));
	return { order: serializeOrder(order), blockers: buildReadinessChecks(order).filter((check) => !check.passed) };
}

/**
 * Creates an approved return request after server-owned readiness checks pass.
 *
 * @param {string} orderId Order identifier.
 * @param {Record<string, unknown>} input Submission request.
 * @returns {{ order?: object, receipt?: object, blockers?: Array<object>, error?: string, status?: number }} Submission result.
 */
export function submitReturnRequest(orderId, input = {}) {
	const order = findOrder(orderId);
	if (!order) return { error: 'Return order not found.', status: 404 };
	if (order.submittedReturn) return { error: 'This order already has an active return request.', status: 409 };
	const revisionError = validateRevision(order, input.revision);
	if (revisionError) return revisionError;

	const blockers = buildReadinessChecks(order).filter((check) => !check.passed);
	if (blockers.length) return { error: 'Complete the required return details before submitting.', status: 422, blockers };
	returnSequence += 1;
	const estimate = buildEstimate(order);
	const submittedReturn = {
		id: `ret_${returnSequence}`,
		number: `RET-${returnSequence}`,
		status: 'approved',
		statusLabel: 'Return approved',
		submittedAt: 'Just now',
		resolutionLabel: resolutionLabel(order),
		methodLabel: methodLabel(order.draft.returnMethod),
		estimatedAmount: estimate.total,
		labelReference: `DPD-RET-${840000 + returnSequence}`,
		nextStep: nextStepLabel(order.draft.returnMethod, order.draft.resolution),
	};
	order.submittedReturn = submittedReturn;
	order.status = 'return-created';
	order.statusLabel = 'Return approved';
	order.revision += 1;
	order.activity.unshift(createActivity('Return approved', `${submittedReturn.number} · ${submittedReturn.methodLabel}`));
	return { order: serializeOrder(order), receipt: clone(submittedReturn) };
}

/**
 * Adds the process-owned revision to a return order seed.
 *
 * @param {object} seed Return order seed.
 * @returns {object} Mutable return order.
 */
function createReturnOrder(seed) {
	return { revision: 9, submittedReturn: null, ...clone(seed) };
}

/**
 * Finds one order from an arbitrary identifier.
 *
 * @param {string} orderId Order identifier.
 * @returns {object|null} Stored order or null.
 */
function findOrder(orderId) {
	return orders.get(String(orderId || '')) || null;
}

/**
 * Enforces optimistic revision matching for return mutations.
 *
 * @param {object} order Stored order.
 * @param {unknown} revision Client revision.
 * @returns {{ error: string, status: number } | null} Conflict response or null.
 */
function validateRevision(order, revision) {
	if (revision === undefined || revision === null) return { error: 'Return draft revision is required.', status: 400 };
	if (Number(revision) === order.revision) return null;
	return { error: 'Return details changed in another session. Reload before continuing.', status: 409 };
}

/**
 * Normalizes and validates a complete return draft payload.
 *
 * @param {object} order Stored order.
 * @param {Record<string, unknown>} input Draft request.
 * @returns {{ draft?: object, error?: string, status?: number }} Normalized draft or error.
 */
function normalizeDraft(order, input) {
	const selectedItemIds = Array.isArray(input.selectedItemIds)
		? [...new Set(input.selectedItemIds.map((itemId) => String(itemId)))]
		: [];
	const selectedItems = order.items.filter((item) => selectedItemIds.includes(item.id));
	if (!selectedItemIds.length) return { error: 'Select at least one item to return.', status: 400 };
	if (selectedItems.length !== selectedItemIds.length) return { error: 'One or more selected order items do not exist.', status: 400 };
	if (selectedItems.some((item) => !item.eligible)) return { error: 'Final-sale items cannot be added to this return.', status: 400 };

	const reasons = normalizeReasons(selectedItemIds, input.reasons);
	if (!reasons) return { error: 'Choose a supported reason for every selected item.', status: 400 };
	const resolution = String(input.resolution || '');
	if (!allowedResolutions.has(resolution)) return { error: 'Choose exchange, refund, or store credit.', status: 400 };
	const returnMethod = String(input.returnMethod || '');
	if (!allowedMethods.has(returnMethod)) return { error: 'Choose a supported return method.', status: 400 };
	const exchangeOption = String(input.exchangeOption || '');
	if (resolution === 'exchange' && !exchangeOptionIsAvailable(selectedItems, exchangeOption)) {
		return { error: 'Choose an in-stock exchange size for the selected item.', status: 400 };
	}
	const contactEmail = String(input.contactEmail || '').trim();
	if (!/^\S+@\S+\.\S+$/.test(contactEmail)) return { error: 'Enter a valid contact email.', status: 400 };
	const notes = String(input.notes || '').trim();
	if (notes.length > 300) return { error: 'Return notes must be 300 characters or fewer.', status: 400 };

	return {
		draft: {
			selectedItemIds,
			reasons,
			resolution,
			exchangeOption: resolution === 'exchange' ? exchangeOption : '',
			returnMethod,
			contactEmail,
			notes,
			conditionConfirmed: Boolean(input.conditionConfirmed),
		},
	};
}

/**
 * Validates one reason per selected line item.
 *
 * @param {string[]} selectedItemIds Selected line-item identifiers.
 * @param {unknown} value Candidate reason record.
 * @returns {Record<string, string>|null} Normalized reasons or null.
 */
function normalizeReasons(selectedItemIds, value) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
	const reasons = {};
	for (const itemId of selectedItemIds) {
		const reason = String(value[itemId] || '');
		if (!allowedReasons.has(reason)) return null;
		reasons[itemId] = reason;
	}
	return reasons;
}

/**
 * Checks that an exchange option belongs to exactly one selected product.
 *
 * @param {Array<object>} selectedItems Selected line items.
 * @param {string} exchangeOption Candidate exchange option.
 * @returns {boolean} True when the option is available.
 */
function exchangeOptionIsAvailable(selectedItems, exchangeOption) {
	if (selectedItems.length !== 1) return false;
	return selectedItems[0].exchangeOptions.some((option) => option.value === exchangeOption);
}

/**
 * Builds server-owned submission readiness checks.
 *
 * @param {object} order Stored return order.
 * @returns {Array<{ key: string, label: string, detail: string, passed: boolean }>} Readiness checks.
 */
function buildReadinessChecks(order) {
	const selectedItems = order.items.filter((item) => order.draft.selectedItemIds.includes(item.id));
	const reasonsComplete = selectedItems.every((item) => allowedReasons.has(order.draft.reasons[item.id]));
	const exchangeReady = order.draft.resolution !== 'exchange' || exchangeOptionIsAvailable(selectedItems, order.draft.exchangeOption);
	return [
		{ key: 'items', label: 'Eligible items selected', detail: `${selectedItems.length} ${selectedItems.length === 1 ? 'item' : 'items'} selected`, passed: selectedItems.length > 0 && selectedItems.every((item) => item.eligible) },
		{ key: 'reasons', label: 'Return reasons complete', detail: reasonsComplete ? 'Every item has a reason' : 'Choose a reason for every item', passed: reasonsComplete },
		{ key: 'resolution', label: 'Resolution ready', detail: exchangeReady ? resolutionLabel(order) : 'Choose an in-stock exchange size', passed: allowedResolutions.has(order.draft.resolution) && exchangeReady },
		{ key: 'method', label: 'Return method chosen', detail: methodLabel(order.draft.returnMethod), passed: allowedMethods.has(order.draft.returnMethod) },
		{ key: 'contact', label: 'Contact email valid', detail: order.draft.contactEmail, passed: /^\S+@\S+\.\S+$/.test(order.draft.contactEmail) },
		{ key: 'condition', label: 'Item condition confirmed', detail: order.draft.conditionConfirmed ? 'Customer confirmed returnable condition' : 'Confirmation required', passed: order.draft.conditionConfirmed },
	];
}

/**
 * Calculates the server-owned return estimate.
 *
 * @param {object} order Stored return order.
 * @returns {{ subtotal: number, bonus: number, fee: number, total: number, currency: string }} Refund or credit estimate.
 */
function buildEstimate(order) {
	const selectedItems = order.items.filter((item) => order.draft.selectedItemIds.includes(item.id));
	const subtotal = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
	const bonus = order.draft.resolution === 'credit' ? Math.round(subtotal * 0.1) : 0;
	const changedMind = selectedItems.some((item) => order.draft.reasons[item.id] === 'changed-mind');
	const fee = changedMind && order.draft.resolution === 'refund' ? Math.round(subtotal * 0.08) : 0;
	return { subtotal, bonus, fee, total: Math.max(0, subtotal + bonus - fee), currency: 'GBP' };
}

/**
 * Formats the selected resolution for customer-facing proof.
 *
 * @param {object} order Stored order.
 * @returns {string} Resolution label.
 */
function resolutionLabel(order) {
	if (order.draft.resolution === 'refund') return `Refund to ${order.payment.label}`;
	if (order.draft.resolution === 'credit') return 'Store credit with 10% bonus';
	const selectedItems = order.items.filter((item) => order.draft.selectedItemIds.includes(item.id));
	const exchangeOption = selectedItems[0]?.exchangeOptions.find((option) => option.value === order.draft.exchangeOption);
	return exchangeOption ? `Exchange for ${exchangeOption.label}` : 'Exchange';
}

/**
 * Formats a return method value.
 *
 * @param {string} method Return method.
 * @returns {string} Customer-facing method label.
 */
function methodLabel(method) {
	return {
		'drop-off': 'DPD drop-off',
		pickup: 'Carrier pickup',
		'in-store': 'Return in store',
	}[method] || 'Return method required';
}

/**
 * Describes the next step after a return is approved.
 *
 * @param {string} method Return method.
 * @param {string} resolution Resolution type.
 * @returns {string} Next-step guidance.
 */
function nextStepLabel(method, resolution) {
	if (method === 'pickup') return 'The carrier will confirm the collection window by email.';
	if (method === 'in-store') return 'Show the return number at any store within 7 days.';
	if (resolution === 'exchange') return 'Download the label and drop off the parcel within 7 days; replacement stock is reserved for 48 hours.';
	return 'Download the label and drop off the parcel within 7 days.';
}

/**
 * Summarizes the current draft for activity history.
 *
 * @param {object} order Stored return order.
 * @returns {string} Activity detail.
 */
function draftActivityDetail(order) {
	return `${order.draft.selectedItemIds.length} ${order.draft.selectedItemIds.length === 1 ? 'item' : 'items'} · ${resolutionLabel(order)} · ${methodLabel(order.draft.returnMethod)}`;
}

/**
 * Serializes a compact order selector row.
 *
 * @param {object} order Stored order.
 * @returns {object} Order summary.
 */
function serializeOrderSummary(order) {
	return {
		value: order.id,
		label: order.number,
		description: `${order.items.length} ${order.items.length === 1 ? 'item' : 'items'} · Delivered ${order.deliveredAt}`,
		status: order.status,
		statusLabel: order.statusLabel,
		returnNumber: order.submittedReturn?.number || '',
	};
}

/**
 * Serializes a complete return order without mutable references.
 *
 * @param {object} order Stored order.
 * @returns {object} Client-safe return workflow.
 */
function serializeOrder(order) {
	return clone({
		...serializeOrderSummary(order),
		id: order.id,
		number: order.number,
		placedAt: order.placedAt,
		deliveredAt: order.deliveredAt,
		returnBy: order.returnBy,
		windowDaysLeft: order.windowDaysLeft,
		customer: order.customer,
		payment: order.payment,
		items: order.items,
		draft: order.draft,
		revision: order.revision,
		checks: buildReadinessChecks(order),
		estimate: buildEstimate(order),
		submittedReturn: order.submittedReturn,
		activity: order.activity.slice(0, 8),
	});
}

/**
 * Creates a recent activity record.
 *
 * @param {string} label Activity title.
 * @param {string} detail Supporting detail.
 * @returns {object} Activity record.
 */
function createActivity(label, detail) {
	activitySequence += 1;
	return { id: `return_activity_${activitySequence}`, label, detail, time: 'Just now' };
}

/**
 * Deep-clones JSON-safe demo data.
 *
 * @template T
 * @param {T} value Value to clone.
 * @returns {T} Detached clone.
 */
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}
