const CADENCE_OPTIONS = [
	{ value: 'daily', label: 'Daily', description: 'Resets at midnight in the account timezone.' },
	{ value: 'weekly', label: 'Weekly', description: 'Resets every Monday at 00:00.' },
	{ value: 'monthly', label: 'Monthly', description: 'Resets on the first day of each month.' },
];

const MERCHANT_PROFILE_OPTIONS = [
	{ value: 'software-travel', label: 'Software and travel', description: 'SaaS, hosting, transport, and accommodation.' },
	{ value: 'software-only', label: 'Software only', description: 'Software, cloud, and digital services.' },
	{ value: 'business-general', label: 'General business', description: 'Most business purchases excluding restricted categories.' },
	{ value: 'subscriptions', label: 'Recurring subscriptions', description: 'Approved recurring software merchants only.' },
];

const DESTINATION_OPTIONS = [
	{ value: 'united-states', label: 'United States', description: 'USD card-present and online purchases.' },
	{ value: 'france', label: 'France', description: 'EUR card-present and online purchases.' },
	{ value: 'japan', label: 'Japan', description: 'JPY card-present and online purchases.' },
	{ value: 'singapore', label: 'Singapore', description: 'SGD card-present and online purchases.' },
];

const REPLACEMENT_REASON_OPTIONS = [
	{ value: 'lost', label: 'Card is lost', description: 'Freeze the old card and issue a new number.' },
	{ value: 'stolen', label: 'Card was stolen', description: 'Freeze immediately and flag the old credentials.' },
	{ value: 'damaged', label: 'Card is damaged', description: 'Keep the existing card active until activation.' },
	{ value: 'compromised', label: 'Details may be compromised', description: 'Invalidate the old credentials immediately.' },
];

const DELIVERY_OPTIONS = [
	{ value: 'standard', label: 'Standard · 3–5 working days', description: 'Tracked delivery at no additional cost.' },
	{ value: 'express', label: 'Express · next working day', description: 'Tracked courier delivery for £12.' },
];

const ACTIVITY_TYPE_OPTIONS = [
	{ value: 'all', label: 'All activity', description: 'Transactions and card-control events.' },
	{ value: 'transactions', label: 'Transactions', description: 'Authorizations, reversals, and refunds.' },
	{ value: 'controls', label: 'Control changes', description: 'Limits, status, travel, and security events.' },
];

const ACTIVITY_STATUS_OPTIONS = [
	{ value: 'all', label: 'Every status', description: 'Approved, declined, pending, and informational.' },
	{ value: 'approved', label: 'Approved', description: 'Completed authorizations and successful changes.' },
	{ value: 'declined', label: 'Declined', description: 'Blocked or rejected authorizations.' },
	{ value: 'pending', label: 'Pending', description: 'Actions still being processed.' },
];

const SENSITIVE_DETAILS = {
	'card-founder': { pan: '5274 9102 8401 2048', expiry: '08/29', cvc: '392', cardholder: 'MAYA CHEN' },
	'card-design': { pan: '5274 9102 3377 9182', expiry: '03/28', cvc: '144', cardholder: 'DESIGN OPERATIONS' },
	'card-vendor': { pan: '5274 9102 6618 7710', expiry: '11/27', cvc: '817', cardholder: 'FINANCE TEAM' },
};

let workspace = createInitialWorkspace();
let revealChallenges = new Map();

/**
 * Returns the card fleet, selected card, and rich control options.
 *
 * @param {string} [selectedCardId] Optional card to select.
 * @returns {Record<string, unknown>} Card operations bootstrap payload.
 */
export function getCardControlBootstrap(selectedCardId = '') {
	const selectedCard = findCard(selectedCardId) || workspace.cards[0];
	return success('Card controls loaded.', {
		workspace: serializeWorkspace(),
		cards: serializeCardList(),
		selectedCard: serializeCard(selectedCard),
		options: serializeOptions(),
	});
}

/**
 * Returns one card with policy, transaction, travel, and audit evidence.
 *
 * @param {string} cardId Stable card identifier.
 * @returns {Record<string, unknown>} Card detail response or not-found error.
 */
export function getCardControlCard(cardId) {
	const card = findCard(cardId);
	if (!card) return notFound('Card');
	return success('Card loaded.', { card: serializeCard(card) });
}

/**
 * Updates spend and authorization policy at an exact card revision.
 *
 * @param {string} cardId Stable card identifier.
 * @param {Record<string, unknown>} input Policy fields and expected revision.
 * @returns {Record<string, unknown>} Updated card response or validation error.
 */
export function updateCardControlPolicy(cardId, input = {}) {
	const card = findCard(cardId);
	if (!card) return notFound('Card');
	const editableError = requireEditableCard(card);
	if (editableError) return editableError;
	const revisionError = validateRevision(card, input.revision);
	if (revisionError) return revisionError;

	const limit = Number(input.limit);
	const cadence = String(input.cadence || '');
	const merchantProfile = String(input.merchantProfile || '');
	const controls = input.controls && typeof input.controls === 'object' ? input.controls : {};
	const fields = {};
	if (!Number.isFinite(limit) || limit < 100 || limit > card.policy.maxLimit) fields.limit = [`Use an amount between £100 and £${card.policy.maxLimit.toLocaleString('en-GB')}.`];
	if (Number.isFinite(limit) && limit < card.spent) fields.limit = [`The limit cannot be lower than the £${card.spent.toLocaleString('en-GB')} already spent this ${card.policy.cadence}.`];
	if (!CADENCE_OPTIONS.some((option) => option.value === cadence)) fields.cadence = ['Choose an available reset cadence.'];
	if (!MERCHANT_PROFILE_OPTIONS.some((option) => option.value === merchantProfile)) fields.merchantProfile = ['Choose an available merchant policy.'];
	for (const key of ['onlinePayments', 'contactless', 'atmWithdrawals', 'internationalPayments']) {
		if (typeof controls[key] !== 'boolean') fields[key] = ['Choose whether this control is enabled.'];
	}
	if (Object.keys(fields).length) return validation('Review the policy fields.', fields);

	const previousPolicy = structuredClone(card.policy);
	card.policy.limit = limit;
	card.policy.cadence = cadence;
	card.policy.merchantProfile = merchantProfile;
	card.policy.onlinePayments = controls.onlinePayments;
	card.policy.contactless = controls.contactless;
	card.policy.atmWithdrawals = controls.atmWithdrawals;
	card.policy.internationalPayments = controls.internationalPayments;
	advanceRevision(card);
	const receipt = createReceipt('card_policy_updated', card, {
		previousPolicy,
		policy: structuredClone(card.policy),
	});
	card.latestReceipt = receipt;
	appendEvent(card, 'Policy updated', `${labelFor(MERCHANT_PROFILE_OPTIONS, merchantProfile)} · £${limit.toLocaleString('en-GB')} ${cadence}.`, 'approved');
	return success('Card policy saved.', { card: serializeCard(card), receipt });
}

/**
 * Freezes or unfreezes a card with an auditable reason.
 *
 * @param {string} cardId Stable card identifier.
 * @param {Record<string, unknown>} input Status action, reason, and expected revision.
 * @returns {Record<string, unknown>} Updated card response or validation error.
 */
export function updateCardControlStatus(cardId, input = {}) {
	const card = findCard(cardId);
	if (!card) return notFound('Card');
	const editableError = requireEditableCard(card);
	if (editableError) return editableError;
	const revisionError = validateRevision(card, input.revision);
	if (revisionError) return revisionError;

	const action = String(input.action || '');
	const reason = String(input.reason || '').trim();
	if (!['freeze', 'unfreeze'].includes(action)) return validation('Choose freeze or unfreeze.', { action: ['Choose a supported status action.'] });
	if (reason.length < 10) return validation('Add an auditable reason.', { reason: ['Explain the status change in at least 10 characters.'] });
	if (action === 'freeze' && card.status === 'frozen') return validation('This card is already frozen.', { action: ['Choose unfreeze to allow new authorizations.'] });
	if (action === 'unfreeze' && card.status !== 'frozen') return validation('This card is not frozen.', { action: ['Only frozen cards can be unfrozen.'] });

	const previousStatus = card.status;
	card.status = action === 'freeze' ? 'frozen' : 'active';
	card.statusReason = reason;
	advanceRevision(card);
	const receipt = createReceipt(action === 'freeze' ? 'card_frozen' : 'card_unfrozen', card, {
		previousStatus,
		status: card.status,
		reason,
	});
	card.latestReceipt = receipt;
	appendEvent(card, action === 'freeze' ? 'Card frozen' : 'Card unfrozen', reason, 'approved');
	return success(action === 'freeze' ? 'Card frozen immediately.' : 'Card unfrozen.', { card: serializeCard(card), receipt });
}

/**
 * Adds a dated travel notice to an issued card.
 *
 * @param {string} cardId Stable card identifier.
 * @param {Record<string, unknown>} input Destination, dates, note, and expected revision.
 * @returns {Record<string, unknown>} Updated card response or validation error.
 */
export function createCardTravelNotice(cardId, input = {}) {
	const card = findCard(cardId);
	if (!card) return notFound('Card');
	const editableError = requireEditableCard(card);
	if (editableError) return editableError;
	const revisionError = validateRevision(card, input.revision);
	if (revisionError) return revisionError;

	const destination = String(input.destination || '');
	const startsOn = String(input.startsOn || '');
	const endsOn = String(input.endsOn || '');
	const note = String(input.note || '').trim();
	const fields = {};
	if (!DESTINATION_OPTIONS.some((option) => option.value === destination)) fields.destination = ['Choose an available destination.'];
	if (!isIsoDate(startsOn)) fields.startsOn = ['Choose a valid start date.'];
	if (!isIsoDate(endsOn)) fields.endsOn = ['Choose a valid end date.'];
	if (isIsoDate(startsOn) && startsOn < '2026-08-02') fields.startsOn = ['Travel must start on or after 2 August 2026.'];
	if (isIsoDate(startsOn) && isIsoDate(endsOn) && endsOn < startsOn) fields.endsOn = ['The end date must be on or after the start date.'];
	if (isIsoDate(startsOn) && isIsoDate(endsOn) && daysBetween(startsOn, endsOn) > 90) fields.endsOn = ['Travel notices can cover at most 90 days.'];
	if (note.length > 240) fields.note = ['Keep the note to 240 characters or fewer.'];
	if (Object.keys(fields).length) return validation('Review the travel notice.', fields);

	const notice = {
		id: `travel-${workspace.sequence++}`,
		destination,
		destinationLabel: labelFor(DESTINATION_OPTIONS, destination),
		startsOn,
		endsOn,
		note,
		status: 'active',
		createdAt: nowIso(),
		createdBy: workspace.actor,
	};
	card.travelNotices.unshift(notice);
	advanceRevision(card);
	const receipt = createReceipt('travel_notice_created', card, { notice: structuredClone(notice) });
	card.latestReceipt = receipt;
	appendEvent(card, 'Travel notice added', `${notice.destinationLabel} · ${startsOn} to ${endsOn}.`, 'approved');
	return success('Travel notice added.', { card: serializeCard(card), notice, receipt });
}

/**
 * Starts a short-lived step-up challenge before revealing sensitive details.
 *
 * @param {string} cardId Stable card identifier.
 * @param {Record<string, unknown>} input Expected card revision.
 * @returns {Record<string, unknown>} Challenge handoff or validation error.
 */
export function createCardRevealChallenge(cardId, input = {}) {
	const card = findCard(cardId);
	if (!card) return notFound('Card');
	if (card.status === 'replacing') return validation('Card details are unavailable during replacement.', { card: ['Wait for the replacement card to be issued.'] });
	const revisionError = validateRevision(card, input.revision);
	if (revisionError) return revisionError;

	const challenge = {
		id: `challenge-${workspace.sequence++}`,
		cardId,
		code: '482731',
		destination: 'Authenticator ending 41',
		createdAt: nowIso(),
		expiresAt: isoMinutesFromNow(5),
		consumedAt: null,
	};
	revealChallenges.set(challenge.id, challenge);
	return success('Verification code sent.', {
		challenge: {
			id: challenge.id,
			destination: challenge.destination,
			expiresAt: challenge.expiresAt,
			demoCode: challenge.code,
		},
	});
}

/**
 * Confirms a reveal challenge and returns a short-lived sensitive payload.
 *
 * @param {string} cardId Stable card identifier.
 * @param {string} challengeId Stable challenge identifier.
 * @param {Record<string, unknown>} input Confirmation code and expected card revision.
 * @returns {Record<string, unknown>} Sensitive details or validation error.
 */
export function confirmCardRevealChallenge(cardId, challengeId, input = {}) {
	const card = findCard(cardId);
	if (!card) return notFound('Card');
	const revisionError = validateRevision(card, input.revision);
	if (revisionError) return revisionError;
	const challenge = revealChallenges.get(challengeId);
	if (!challenge || challenge.cardId !== cardId) return notFound('Reveal challenge');
	if (challenge.consumedAt) return validation('This verification code has already been used.', { code: ['Start a new verification challenge.'] });
	if (challenge.expiresAt < nowIso()) return validation('This verification code has expired.', { code: ['Start a new verification challenge.'] });
	if (String(input.code || '') !== challenge.code) return validation('The verification code is incorrect.', { code: ['Enter the six-digit demo code shown above.'] });

	challenge.consumedAt = nowIso();
	const revealedUntil = isoMinutesFromNow(2);
	advanceRevision(card);
	const receipt = createReceipt('card_details_revealed', card, {
		challengeId,
		revealedUntil,
		fields: ['pan', 'expiry', 'cvc', 'cardholder'],
	});
	card.latestReceipt = receipt;
	appendEvent(card, 'Card details revealed', 'Step-up verification passed · two-minute reveal window.', 'approved');
	return success('Card details revealed for two minutes.', {
		details: structuredClone(SENSITIVE_DETAILS[cardId]),
		revealedUntil,
		receipt,
		card: serializeCard(card),
	});
}

/**
 * Creates a replacement order and freezes vulnerable credentials when needed.
 *
 * @param {string} cardId Stable card identifier.
 * @param {Record<string, unknown>} input Replacement reason, delivery, acknowledgement, and revision.
 * @returns {Record<string, unknown>} Replacement receipt or validation error.
 */
export function replaceCardControlCard(cardId, input = {}) {
	const card = findCard(cardId);
	if (!card) return notFound('Card');
	const editableError = requireEditableCard(card);
	if (editableError) return editableError;
	const revisionError = validateRevision(card, input.revision);
	if (revisionError) return revisionError;

	const reason = String(input.reason || '');
	const delivery = String(input.delivery || '');
	const note = String(input.note || '').trim();
	const acknowledged = input.acknowledged === true;
	const fields = {};
	if (!REPLACEMENT_REASON_OPTIONS.some((option) => option.value === reason)) fields.reason = ['Choose why the card needs replacing.'];
	if (!DELIVERY_OPTIONS.some((option) => option.value === delivery)) fields.delivery = ['Choose a delivery speed.'];
	if (!acknowledged) fields.acknowledged = ['Confirm how the old card and wallet tokens will be handled.'];
	if (reason === 'compromised' && note.length < 10) fields.note = ['Add a short incident note for potentially compromised details.'];
	if (note.length > 300) fields.note = ['Keep the incident note to 300 characters or fewer.'];
	if (Object.keys(fields).length) return validation('Review the replacement request.', fields);

	const oldStatus = card.status;
	const replacement = {
		id: `replacement-${workspace.sequence++}`,
		reason,
		reasonLabel: labelFor(REPLACEMENT_REASON_OPTIONS, reason),
		delivery,
		deliveryLabel: labelFor(DELIVERY_OPTIONS, delivery),
		note,
		newLast4: String(5600 + workspace.sequence).slice(-4),
		status: 'ordered',
		expectedOn: delivery === 'express' ? '2026-08-03' : '2026-08-06',
		createdAt: nowIso(),
		createdBy: workspace.actor,
	};
	card.status = 'replacing';
	card.statusReason = replacement.reasonLabel;
	card.replacement = replacement;
	advanceRevision(card);
	const receipt = createReceipt('card_replacement_ordered', card, {
		oldStatus,
		oldLast4: card.last4,
		replacement: structuredClone(replacement),
		walletTokensSuspended: ['lost', 'stolen', 'compromised'].includes(reason),
	});
	card.latestReceipt = receipt;
	appendEvent(card, 'Replacement ordered', `${replacement.reasonLabel} · ${replacement.deliveryLabel}.`, 'pending');
	return success('Replacement card ordered.', { card: serializeCard(card), replacement, receipt });
}

/**
 * Restores the deterministic card operations workspace.
 *
 * @returns {Record<string, unknown>} Fresh bootstrap response.
 */
export function resetCardControlWorkspace() {
	workspace = createInitialWorkspace();
	revealChallenges = new Map();
	return getCardControlBootstrap();
}

/**
 * Creates the deterministic process-local card fleet.
 *
 * @returns {Record<string, unknown>} Fresh card operations workspace.
 */
function createInitialWorkspace() {
	return {
		id: 'workspace-aster-business',
		name: 'Aster Business',
		actor: 'Maya Chen',
		role: 'Administrator',
		availableBalance: 18420,
		currency: 'GBP',
		sequence: 901,
		cards: [
			{
				id: 'card-founder', name: 'Founder card', holder: 'Maya Chen', type: 'Virtual', last4: '2048', expiry: '08/29', status: 'active', statusReason: '', revision: 7, currency: 'GBP', spent: 1840,
				policy: { limit: 3200, maxLimit: 25000, cadence: 'monthly', merchantProfile: 'software-travel', onlinePayments: true, contactless: true, atmWithdrawals: false, internationalPayments: true },
				travelNotices: [], replacement: null, latestReceipt: null,
				transactions: [
					{ id: 'txn-linear', merchant: 'Linear', category: 'Software', amount: 96, status: 'approved', occurredAt: isoMinutesAgo(37), location: 'Online · US' },
					{ id: 'txn-heathrow', merchant: 'Heathrow Express', category: 'Transport', amount: 27.5, status: 'approved', occurredAt: isoMinutesAgo(188), location: 'London · GB' },
					{ id: 'txn-cash', merchant: 'ATM 0381', category: 'Cash withdrawal', amount: 200, status: 'declined', occurredAt: isoMinutesAgo(490), location: 'London · GB' },
					{ id: 'txn-figma', merchant: 'Figma', category: 'Software', amount: 168, status: 'approved', occurredAt: isoMinutesAgo(1430), location: 'Online · US' },
				],
				events: [
					{ id: 'event-founder-1', title: 'ATM withdrawal declined', detail: 'Cash withdrawals are disabled by card policy.', actor: 'Authorization service', status: 'declined', createdAt: isoMinutesAgo(490) },
					{ id: 'event-founder-2', title: 'Limit updated', detail: 'Monthly limit changed from £2,500 to £3,200.', actor: 'Maya Chen', status: 'approved', createdAt: isoMinutesAgo(2880) },
				],
			},
			{
				id: 'card-design', name: 'Design operations', holder: 'Design Operations', type: 'Physical', last4: '9182', expiry: '03/28', status: 'frozen', statusReason: 'Quarterly tooling review in progress.', revision: 11, currency: 'GBP', spent: 620,
				policy: { limit: 1500, maxLimit: 10000, cadence: 'monthly', merchantProfile: 'software-only', onlinePayments: true, contactless: false, atmWithdrawals: false, internationalPayments: false },
				travelNotices: [], replacement: null,
				latestReceipt: { id: 'receipt-893', type: 'card_frozen', cardId: 'card-design', revision: 11, createdAt: isoMinutesAgo(75), actor: 'Maya Chen', evidence: { reason: 'Quarterly tooling review in progress.' } },
				transactions: [
					{ id: 'txn-notion', merchant: 'Notion', category: 'Software', amount: 85, status: 'approved', occurredAt: isoMinutesAgo(1520), location: 'Online · US' },
					{ id: 'txn-muji', merchant: 'Muji', category: 'Office supplies', amount: 74, status: 'declined', occurredAt: isoMinutesAgo(1700), location: 'London · GB' },
				],
				events: [{ id: 'event-design-1', title: 'Card frozen', detail: 'Quarterly tooling review in progress.', actor: 'Maya Chen', status: 'approved', createdAt: isoMinutesAgo(75) }],
			},
			{
				id: 'card-vendor', name: 'Cloud vendors', holder: 'Finance Team', type: 'Virtual', last4: '7710', expiry: '11/27', status: 'replacing', statusReason: 'Details may be compromised', revision: 16, currency: 'GBP', spent: 290,
				policy: { limit: 900, maxLimit: 15000, cadence: 'monthly', merchantProfile: 'subscriptions', onlinePayments: false, contactless: false, atmWithdrawals: false, internationalPayments: false },
				travelNotices: [],
				replacement: { id: 'replacement-889', reason: 'compromised', reasonLabel: 'Details may be compromised', delivery: 'express', deliveryLabel: 'Express · next working day', note: 'Unexpected authorization attempt from an unrecognized cloud reseller.', newLast4: '5631', status: 'ordered', expectedOn: '2026-08-03', createdAt: isoMinutesAgo(330), createdBy: 'Maya Chen' },
				latestReceipt: { id: 'receipt-890', type: 'card_replacement_ordered', cardId: 'card-vendor', revision: 16, createdAt: isoMinutesAgo(330), actor: 'Maya Chen', evidence: { oldLast4: '7710', newLast4: '5631', walletTokensSuspended: true } },
				transactions: [
					{ id: 'txn-aws', merchant: 'Amazon Web Services', category: 'Cloud hosting', amount: 290, status: 'approved', occurredAt: isoMinutesAgo(980), location: 'Online · IE' },
					{ id: 'txn-reseller', merchant: 'Cloud Market EU', category: 'Cloud reseller', amount: 440, status: 'declined', occurredAt: isoMinutesAgo(350), location: 'Online · NL' },
				],
				events: [{ id: 'event-vendor-1', title: 'Replacement ordered', detail: 'Compromised credentials · express delivery.', actor: 'Maya Chen', status: 'pending', createdAt: isoMinutesAgo(330) }],
			},
		],
	};
}

/**
 * Serializes workspace-level identity and balance information.
 *
 * @returns {Record<string, unknown>} Public workspace summary.
 */
function serializeWorkspace() {
	return {
		id: workspace.id,
		name: workspace.name,
		actor: workspace.actor,
		role: workspace.role,
		availableBalance: workspace.availableBalance,
		currency: workspace.currency,
		cardCount: workspace.cards.length,
	};
}

/**
 * Returns rich option lists used by DOM Studio selectors.
 *
 * @returns {Record<string, Array<Record<string, string>>>} Selector options.
 */
function serializeOptions() {
	return {
		cadences: structuredClone(CADENCE_OPTIONS),
		merchantProfiles: structuredClone(MERCHANT_PROFILE_OPTIONS),
		destinations: structuredClone(DESTINATION_OPTIONS),
		replacementReasons: structuredClone(REPLACEMENT_REASON_OPTIONS),
		deliverySpeeds: structuredClone(DELIVERY_OPTIONS),
		activityTypes: structuredClone(ACTIVITY_TYPE_OPTIONS),
		activityStatuses: structuredClone(ACTIVITY_STATUS_OPTIONS),
	};
}

/**
 * Serializes every card into a compact rail record.
 *
 * @returns {Array<Record<string, unknown>>} Card rail records.
 */
function serializeCardList() {
	return workspace.cards.map(serializeCardSummary);
}

/**
 * Serializes one card for fleet navigation.
 *
 * @param {Record<string, unknown>} card Internal card record.
 * @returns {Record<string, unknown>} Public card summary.
 */
function serializeCardSummary(card) {
	return {
		id: card.id,
		name: card.name,
		holder: card.holder,
		type: card.type,
		last4: card.last4,
		status: card.status,
		statusMeta: statusMeta(card.status),
		spent: card.spent,
		limit: card.policy.limit,
		currency: card.currency,
		revision: card.revision,
	};
}

/**
 * Serializes a card without exposing stored sensitive details.
 *
 * @param {Record<string, unknown>} card Internal card record.
 * @returns {Record<string, unknown>} Public card detail record.
 */
function serializeCard(card) {
	return {
		...serializeCardSummary(card),
		expiry: card.expiry,
		statusReason: card.statusReason,
		policy: structuredClone(card.policy),
		policyMeta: {
			cadenceLabel: labelFor(CADENCE_OPTIONS, card.policy.cadence),
			merchantProfileLabel: labelFor(MERCHANT_PROFILE_OPTIONS, card.policy.merchantProfile),
			percentUsed: Math.min(100, Math.round((card.spent / Math.max(1, card.policy.limit)) * 100)),
			remaining: Math.max(0, card.policy.limit - card.spent),
		},
		travelNotices: structuredClone(card.travelNotices),
		replacement: structuredClone(card.replacement),
		transactions: structuredClone(card.transactions),
		events: structuredClone(card.events),
		latestReceipt: structuredClone(card.latestReceipt),
		capabilities: {
			canEdit: card.status !== 'replacing',
			canReveal: card.status !== 'replacing',
			canReplace: card.status !== 'replacing',
			canFreeze: card.status === 'active',
			canUnfreeze: card.status === 'frozen',
		},
	};
}

/**
 * Finds a card by its stable identifier.
 *
 * @param {string} cardId Stable card identifier.
 * @returns {Record<string, unknown>|null} Matching card or null.
 */
function findCard(cardId) {
	return workspace.cards.find((card) => card.id === cardId) || null;
}

/**
 * Prevents policy and lifecycle mutations while replacement is underway.
 *
 * @param {Record<string, unknown>} card Internal card record.
 * @returns {Record<string, unknown>|null} Validation error or null.
 */
function requireEditableCard(card) {
	if (card.status !== 'replacing') return null;
	return validation('This card is being replaced.', { card: ['Wait for the replacement lifecycle to complete before changing controls.'] });
}

/**
 * Validates optimistic card revisions.
 *
 * @param {Record<string, unknown>} card Internal card record.
 * @param {unknown} revision Submitted revision.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function validateRevision(card, revision) {
	if (Number(revision) === card.revision) return null;
	return conflict('This card changed in another session.', { card: serializeCard(card) });
}

/**
 * Advances a card revision and update timestamp.
 *
 * @param {Record<string, unknown>} card Internal card record.
 * @returns {void}
 */
function advanceRevision(card) {
	card.revision += 1;
	card.updatedAt = nowIso();
}

/**
 * Appends a normalized audit event to a card.
 *
 * @param {Record<string, unknown>} card Internal card record.
 * @param {string} title Event title.
 * @param {string} detail Event detail.
 * @param {string} status Event status.
 * @returns {void}
 */
function appendEvent(card, title, detail, status) {
	card.events.unshift({
		id: `event-${workspace.sequence++}`,
		title,
		detail,
		actor: workspace.actor,
		status,
		createdAt: nowIso(),
	});
}

/**
 * Creates immutable-looking demo evidence for a server mutation.
 *
 * @param {string} type Receipt type.
 * @param {Record<string, unknown>} card Internal card record.
 * @param {Record<string, unknown>} evidence Receipt evidence.
 * @returns {Record<string, unknown>} Receipt payload.
 */
function createReceipt(type, card, evidence) {
	return {
		id: `receipt-${workspace.sequence++}`,
		type,
		cardId: card.id,
		revision: card.revision,
		createdAt: nowIso(),
		actor: workspace.actor,
		evidence,
	};
}

/**
 * Resolves an option label for a stored value.
 *
 * @param {Array<Record<string, string>>} options Available options.
 * @param {string} value Stored value.
 * @returns {string} Matching label or raw value.
 */
function labelFor(options, value) {
	return options.find((option) => option.value === value)?.label || value;
}

/**
 * Returns semantic presentation metadata for a card state.
 *
 * @param {string} status Stored card state.
 * @returns {{label: string, tone: string}} Status presentation metadata.
 */
function statusMeta(status) {
	return {
		active: { label: 'Active', tone: 'success' },
		frozen: { label: 'Frozen', tone: 'danger' },
		replacing: { label: 'Replacing', tone: 'warning' },
	}[status] || { label: status, tone: 'neutral' };
}

/**
 * Confirms a value is a real ISO calendar date.
 *
 * @param {string} value Candidate date.
 * @returns {boolean} Whether the date is valid.
 */
function isIsoDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
	const [year, month, day] = value.split('-').map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * Counts full calendar days between ISO dates.
 *
 * @param {string} startsOn Start date.
 * @param {string} endsOn End date.
 * @returns {number} Inclusive range difference in days.
 */
function daysBetween(startsOn, endsOn) {
	return Math.round((Date.parse(`${endsOn}T00:00:00Z`) - Date.parse(`${startsOn}T00:00:00Z`)) / 86400000);
}

/**
 * Returns an ISO timestamp a number of minutes in the past.
 *
 * @param {number} minutes Minutes before now.
 * @returns {string} ISO timestamp.
 */
function isoMinutesAgo(minutes) {
	return new Date(Date.now() - minutes * 60000).toISOString();
}

/**
 * Returns an ISO timestamp a number of minutes in the future.
 *
 * @param {number} minutes Minutes after now.
 * @returns {string} ISO timestamp.
 */
function isoMinutesFromNow(minutes) {
	return new Date(Date.now() + minutes * 60000).toISOString();
}

/**
 * Returns the current ISO timestamp.
 *
 * @returns {string} ISO timestamp.
 */
function nowIso() {
	return new Date().toISOString();
}

/**
 * Wraps a successful payload in the demo API contract.
 *
 * @param {string} message Human-readable success message.
 * @param {Record<string, unknown>} [payload] Response fields.
 * @returns {Record<string, unknown>} Success response.
 */
function success(message, payload = {}) {
	return { ok: true, message, ...payload };
}

/**
 * Creates a structured validation response.
 *
 * @param {string} message Human-readable validation summary.
 * @param {Record<string, string[]>} fields Field-level errors.
 * @returns {Record<string, unknown>} Validation response.
 */
function validation(message, fields) {
	return { ok: false, error: 'validation_error', status: 422, message, fields };
}

/**
 * Creates an optimistic concurrency response.
 *
 * @param {string} message Human-readable conflict summary.
 * @param {Record<string, unknown>} [payload] Fresh server state.
 * @returns {Record<string, unknown>} Conflict response.
 */
function conflict(message, payload = {}) {
	return { ok: false, error: 'revision_conflict', status: 409, message, ...payload };
}

/**
 * Creates a resource-not-found response.
 *
 * @param {string} resource Resource label.
 * @returns {Record<string, unknown>} Not-found response.
 */
function notFound(resource) {
	return { ok: false, error: 'not_found', status: 404, message: `${resource} not found.` };
}
