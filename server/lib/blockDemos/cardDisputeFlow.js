const REASON_OPTIONS = [
	{ value: 'unauthorized', label: 'I do not recognize this charge', description: 'Treat the card credentials as potentially compromised.' },
	{ value: 'duplicate', label: 'I was charged twice', description: 'Compare the transaction with the original purchase.' },
	{ value: 'wrong_amount', label: 'The amount is wrong', description: 'Record the expected amount and merchant contact.' },
	{ value: 'not_received', label: 'Goods or service not received', description: 'Capture delivery promises and merchant correspondence.' },
	{ value: 'cancelled', label: 'I cancelled before renewal', description: 'Provide cancellation confirmation and merchant contact.' },
];

const EVIDENCE_TYPE_OPTIONS = [
	{ value: 'transaction_screenshot', label: 'Transaction screenshot', description: 'A statement or app view showing the disputed charge.' },
	{ value: 'merchant_correspondence', label: 'Merchant correspondence', description: 'Email, chat, or support conversation with the merchant.' },
	{ value: 'receipt', label: 'Receipt or order confirmation', description: 'The expected amount, goods, or service terms.' },
	{ value: 'cancellation_confirmation', label: 'Cancellation confirmation', description: 'Proof that renewal or service was cancelled.' },
	{ value: 'delivery_tracking', label: 'Delivery or tracking evidence', description: 'Carrier status, promised date, or non-delivery proof.' },
];

const CASE_STATUS_OPTIONS = [
	{ value: 'all', label: 'Every case', description: 'New transactions, drafts, and submitted disputes.' },
	{ value: 'needs_action', label: 'Needs action', description: 'Eligible transactions without a submitted case.' },
	{ value: 'draft', label: 'Draft', description: 'Started disputes that still need work.' },
	{ value: 'submitted', label: 'Submitted', description: 'Cases handed to dispute operations.' },
];

const NETWORK_REASON_CODES = {
	unauthorized: '10.4 · Other fraud — card absent',
	duplicate: '12.6.1 · Duplicate processing',
	wrong_amount: '12.5 · Incorrect amount',
	not_received: '13.1 · Merchandise or services not received',
	cancelled: '13.2 · Cancelled recurring transaction',
};

let workspace = createInitialWorkspace();

/**
 * Returns the dispute queue, selected transaction, and rich form options.
 *
 * @param {string} [selectedTransactionId] Optional transaction to select.
 * @returns {Record<string, unknown>} Dispute operations bootstrap response.
 */
export function getCardDisputeBootstrap(selectedTransactionId = '') {
	const transaction = findTransaction(selectedTransactionId) || workspace.transactions[0];
	return success('Dispute workspace loaded.', {
		workspace: serializeWorkspace(),
		transactions: serializeTransactionList(),
		selectedTransaction: serializeTransaction(transaction),
		options: serializeOptions(),
	});
}

/**
 * Returns one transaction with its current claim, evidence, checks, and receipts.
 *
 * @param {string} transactionId Stable transaction identifier.
 * @returns {Record<string, unknown>} Transaction detail response or not-found error.
 */
export function getCardDisputeTransaction(transactionId) {
	const transaction = findTransaction(transactionId);
	if (!transaction) return notFound('Transaction');
	return success('Transaction loaded.', { transaction: serializeTransaction(transaction) });
}

/**
 * Creates or updates a structured dispute draft at an exact transaction revision.
 *
 * @param {string} transactionId Stable transaction identifier.
 * @param {Record<string, unknown>} input Intake fields and expected revision.
 * @returns {Record<string, unknown>} Updated transaction or validation response.
 */
export function saveCardDisputeIntake(transactionId, input = {}) {
	const transaction = findTransaction(transactionId);
	if (!transaction) return notFound('Transaction');
	const editableError = requireEditableTransaction(transaction);
	if (editableError) return editableError;
	const revisionError = validateRevision(transaction, input.revision);
	if (revisionError) return revisionError;
	const reasonCode = String(input.reasonCode || '');
	const statement = String(input.statement || '').trim();
	const merchantContacted = input.merchantContacted;
	const cardInPossession = input.cardInPossession;
	const recognizesMerchant = input.recognizesMerchant;
	const requestedFreeze = input.requestedFreeze;
	const requestedReplacement = input.requestedReplacement;
	const fields = {};
	if (!REASON_OPTIONS.some((option) => option.value === reasonCode)) fields.reasonCode = ['Choose a supported dispute reason.'];
	if (statement.length < 40) fields.statement = ['Describe what happened in at least 40 characters.'];
	if (statement.length > 800) fields.statement = ['Keep the statement to 800 characters or fewer.'];
	if (typeof merchantContacted !== 'boolean') fields.merchantContacted = ['Choose whether the merchant was contacted.'];
	if (typeof cardInPossession !== 'boolean') fields.cardInPossession = ['Choose whether the card is still in your possession.'];
	if (typeof recognizesMerchant !== 'boolean') fields.recognizesMerchant = ['Choose whether the merchant is recognized.'];
	if (typeof requestedFreeze !== 'boolean') fields.requestedFreeze = ['Choose whether the card should be frozen.'];
	if (typeof requestedReplacement !== 'boolean') fields.requestedReplacement = ['Choose whether replacement is requested.'];
	if (Object.keys(fields).length) return validation('Review the dispute intake.', fields);

	const previousClaim = transaction.claim ? structuredClone(transaction.claim) : null;
	const evidence = transaction.claim?.evidence || [];
	const protection = transaction.claim?.protection || createProtectionState(transaction.cardStatus);
	transaction.claim = {
		id: transaction.claim?.id || `claim-${workspace.sequence++}`,
		status: 'draft',
		reasonCode,
		statement,
		merchantContacted,
		cardInPossession,
		recognizesMerchant,
		requestedFreeze,
		requestedReplacement,
		evidence,
		protection,
		preflight: null,
		submission: null,
		createdAt: transaction.claim?.createdAt || nowIso(),
		updatedAt: nowIso(),
	};
	advanceRevision(transaction);
	const receipt = createReceipt('dispute_intake_saved', transaction, {
		previousClaim,
		claim: serializeClaim(transaction.claim),
	});
	transaction.latestReceipt = receipt;
	appendEvent(transaction, 'Dispute intake saved', labelFor(REASON_OPTIONS, reasonCode), 'approved');
	return success('Dispute draft saved.', { transaction: serializeTransaction(transaction), receipt });
}

/**
 * Adds a typed evidence record and invalidates any stale preflight decision.
 *
 * @param {string} transactionId Stable transaction identifier.
 * @param {Record<string, unknown>} input Evidence metadata and expected revision.
 * @returns {Record<string, unknown>} Updated transaction or validation response.
 */
export function addCardDisputeEvidence(transactionId, input = {}) {
	const transaction = findTransaction(transactionId);
	if (!transaction) return notFound('Transaction');
	const editableError = requireEditableTransaction(transaction);
	if (editableError) return editableError;
	const claimError = requireDraftClaim(transaction);
	if (claimError) return claimError;
	const revisionError = validateRevision(transaction, input.revision);
	if (revisionError) return revisionError;
	const type = String(input.type || '');
	const reference = String(input.reference || '').trim();
	const note = String(input.note || '').trim();
	const fields = {};
	if (!EVIDENCE_TYPE_OPTIONS.some((option) => option.value === type)) fields.type = ['Choose a supported evidence type.'];
	if (reference.length < 4) fields.reference = ['Add a recognizable file or record reference.'];
	if (reference.length > 100) fields.reference = ['Keep the reference to 100 characters or fewer.'];
	if (note.length > 280) fields.note = ['Keep the note to 280 characters or fewer.'];
	if (Object.keys(fields).length) return validation('Review the evidence record.', fields);

	const evidence = {
		id: `evidence-${workspace.sequence++}`,
		type,
		typeLabel: labelFor(EVIDENCE_TYPE_OPTIONS, type),
		reference,
		note,
		status: 'verified',
		checksum: checksumFor(`${transaction.id}:${type}:${reference}`),
		createdAt: nowIso(),
		createdBy: workspace.actor,
	};
	transaction.claim.evidence.unshift(evidence);
	invalidatePreflight(transaction.claim);
	transaction.claim.updatedAt = nowIso();
	advanceRevision(transaction);
	const receipt = createReceipt('dispute_evidence_added', transaction, { evidence: structuredClone(evidence) });
	transaction.latestReceipt = receipt;
	appendEvent(transaction, 'Evidence verified', evidence.typeLabel, 'approved');
	return success('Evidence added to the draft.', { transaction: serializeTransaction(transaction), evidence, receipt });
}

/**
 * Removes one evidence record from an editable draft at an exact revision.
 *
 * @param {string} transactionId Stable transaction identifier.
 * @param {string} evidenceId Stable evidence identifier.
 * @param {Record<string, unknown>} input Expected transaction revision.
 * @returns {Record<string, unknown>} Updated transaction or validation response.
 */
export function removeCardDisputeEvidence(transactionId, evidenceId, input = {}) {
	const transaction = findTransaction(transactionId);
	if (!transaction) return notFound('Transaction');
	const editableError = requireEditableTransaction(transaction);
	if (editableError) return editableError;
	const claimError = requireDraftClaim(transaction);
	if (claimError) return claimError;
	const revisionError = validateRevision(transaction, input.revision);
	if (revisionError) return revisionError;
	const index = transaction.claim.evidence.findIndex((item) => item.id === evidenceId);
	if (index < 0) return notFound('Evidence');
	const [evidence] = transaction.claim.evidence.splice(index, 1);
	invalidatePreflight(transaction.claim);
	transaction.claim.updatedAt = nowIso();
	advanceRevision(transaction);
	const receipt = createReceipt('dispute_evidence_removed', transaction, { evidence: structuredClone(evidence) });
	transaction.latestReceipt = receipt;
	appendEvent(transaction, 'Evidence removed', evidence.typeLabel, 'approved');
	return success('Evidence removed from the draft.', { transaction: serializeTransaction(transaction), receipt });
}

/**
 * Runs server-owned eligibility and evidence checks for the current draft revision.
 *
 * @param {string} transactionId Stable transaction identifier.
 * @param {Record<string, unknown>} input Expected transaction revision.
 * @returns {Record<string, unknown>} Preflight decision or validation response.
 */
export function runCardDisputePreflight(transactionId, input = {}) {
	const transaction = findTransaction(transactionId);
	if (!transaction) return notFound('Transaction');
	const editableError = requireEditableTransaction(transaction);
	if (editableError) return editableError;
	const claimError = requireDraftClaim(transaction);
	if (claimError) return claimError;
	const revisionError = validateRevision(transaction, input.revision);
	if (revisionError) return revisionError;
	const checks = buildPreflightChecks(transaction);
	const ready = checks.every((check) => check.status !== 'blocked');
	advanceRevision(transaction);
	transaction.claim.preflight = {
		id: `preflight-${workspace.sequence++}`,
		ready,
		checks,
		revision: transaction.revision,
		checkedAt: nowIso(),
		checkedBy: 'Dispute policy service',
	};
	transaction.claim.updatedAt = nowIso();
	const receipt = createReceipt('dispute_preflight_completed', transaction, {
		ready,
		checks: structuredClone(checks),
	});
	transaction.latestReceipt = receipt;
	appendEvent(transaction, ready ? 'Submission checks passed' : 'Submission checks blocked', `${checks.filter((check) => check.status === 'passed').length} of ${checks.length} checks passed.`, ready ? 'approved' : 'blocked');
	return success(ready ? 'The case is ready to submit.' : 'Resolve the blocked checks.', {
		transaction: serializeTransaction(transaction),
		preflight: structuredClone(transaction.claim.preflight),
		receipt,
	});
}

/**
 * Applies immediate card protection independently from network case submission.
 *
 * @param {string} transactionId Stable transaction identifier.
 * @param {Record<string, unknown>} input Protection choices, reason, and expected revision.
 * @returns {Record<string, unknown>} Updated transaction or validation response.
 */
export function protectCardForDispute(transactionId, input = {}) {
	const transaction = findTransaction(transactionId);
	if (!transaction) return notFound('Transaction');
	const revisionError = validateRevision(transaction, input.revision);
	if (revisionError) return revisionError;
	if (!transaction.claim) return validation('Start the dispute before protecting the card.', { claim: ['Save the dispute intake first.'] });
	const freeze = input.freeze;
	const replace = input.replace;
	const reason = String(input.reason || '').trim();
	const fields = {};
	if (typeof freeze !== 'boolean') fields.freeze = ['Choose whether to freeze the card.'];
	if (typeof replace !== 'boolean') fields.replace = ['Choose whether to replace the card.'];
	if (!freeze && !replace) fields.freeze = ['Choose at least one protection action.'];
	if (reason.length < 10) fields.reason = ['Explain the protection action in at least 10 characters.'];
	if (Object.keys(fields).length) return validation('Review the protection action.', fields);

	const previousProtection = structuredClone(transaction.claim.protection);
	transaction.cardStatus = freeze || replace ? 'frozen' : transaction.cardStatus;
	transaction.claim.protection = {
		status: replace ? 'replacement_requested' : 'frozen',
		cardStatus: transaction.cardStatus,
		freezeApplied: Boolean(freeze || replace),
		replacementRequested: Boolean(replace),
		reason,
		appliedAt: nowIso(),
		appliedBy: workspace.actor,
	};
	advanceRevision(transaction);
	if (transaction.claim.preflight) transaction.claim.preflight.revision = transaction.revision;
	const receipt = createReceipt(replace ? 'card_replacement_requested' : 'card_frozen_for_dispute', transaction, {
		previousProtection,
		protection: structuredClone(transaction.claim.protection),
	});
	transaction.latestReceipt = receipt;
	appendEvent(transaction, replace ? 'Replacement requested' : 'Card frozen', reason, 'approved');
	return success(replace ? 'The card is frozen and replacement is requested.' : 'The card is frozen immediately.', {
		transaction: serializeTransaction(transaction),
		receipt,
	});
}

/**
 * Submits a preflight-approved claim and creates immutable case evidence.
 *
 * @param {string} transactionId Stable transaction identifier.
 * @param {Record<string, unknown>} input Acknowledgement and expected revision.
 * @returns {Record<string, unknown>} Submitted case or validation response.
 */
export function submitCardDispute(transactionId, input = {}) {
	const transaction = findTransaction(transactionId);
	if (!transaction) return notFound('Transaction');
	const editableError = requireEditableTransaction(transaction);
	if (editableError) return editableError;
	const claimError = requireDraftClaim(transaction);
	if (claimError) return claimError;
	const revisionError = validateRevision(transaction, input.revision);
	if (revisionError) return revisionError;
	if (input.acknowledged !== true) return validation('Confirm the dispute declaration.', { acknowledged: ['Confirm that the statement and evidence are accurate.'] });
	if (!transaction.claim.preflight?.ready || transaction.claim.preflight.revision !== transaction.revision) {
		return validation('Run the latest submission checks before filing.', { preflight: ['The current draft does not have a passing preflight.'] });
	}

	if ((transaction.claim.requestedFreeze || transaction.claim.requestedReplacement) && !transaction.claim.protection.freezeApplied) {
		transaction.cardStatus = 'frozen';
		transaction.claim.protection = {
			status: transaction.claim.requestedReplacement ? 'replacement_requested' : 'frozen',
			cardStatus: 'frozen',
			freezeApplied: true,
			replacementRequested: transaction.claim.requestedReplacement,
			reason: 'Applied automatically when the dispute was submitted.',
			appliedAt: nowIso(),
			appliedBy: 'Dispute submission service',
		};
	}
	const caseNumber = `DSP-26${workspace.sequence++}`;
	const provisionalCredit = getProvisionalCreditDecision(transaction);
	advanceRevision(transaction);
	transaction.claim.status = 'submitted';
	transaction.claim.submission = {
		caseNumber,
		status: 'submitted',
		networkReasonCode: NETWORK_REASON_CODES[transaction.claim.reasonCode],
		queue: routeForReason(transaction.claim.reasonCode),
		serviceLevel: transaction.claim.reasonCode === 'unauthorized' ? 'Fraud review · 24 hours' : 'Merchant response · 10 days',
		provisionalCredit,
		submittedAt: nowIso(),
		submittedBy: workspace.actor,
	};
	transaction.claim.updatedAt = nowIso();
	const receipt = createReceipt('card_dispute_submitted', transaction, {
		caseNumber,
		networkReasonCode: transaction.claim.submission.networkReasonCode,
		statementChecksum: checksumFor(transaction.claim.statement),
		evidenceChecksums: transaction.claim.evidence.map((item) => item.checksum),
		protection: structuredClone(transaction.claim.protection),
		provisionalCredit: structuredClone(provisionalCredit),
	});
	transaction.latestReceipt = receipt;
	transaction.claim.submission.receiptId = receipt.id;
	appendEvent(transaction, `${caseNumber} submitted`, `${transaction.claim.submission.queue} · ${transaction.claim.submission.networkReasonCode}.`, 'approved');
	return success('Dispute submitted to operations.', {
		transaction: serializeTransaction(transaction),
		case: structuredClone(transaction.claim.submission),
		receipt,
	});
}

/**
 * Restores the seeded dispute queue and lifecycle examples.
 *
 * @returns {Record<string, unknown>} Fresh bootstrap response.
 */
export function resetCardDisputeWorkspace() {
	workspace = createInitialWorkspace();
	return getCardDisputeBootstrap();
}

/**
 * Creates deterministic lifecycle examples for intake, draft, submitted, and ineligible states.
 *
 * @returns {Record<string, unknown>} Seeded dispute workspace.
 */
function createInitialWorkspace() {
	const seededAt = nowIso();
	return {
		id: 'workspace-aster-disputes',
		name: 'Aster dispute operations',
		actor: 'Maya Chen',
		role: 'Account administrator',
		accountBalance: 18420,
		currency: 'GBP',
		sequence: 4100,
		transactions: [
			{
				id: 'txn-luma-cloud',
				merchant: 'Luma Cloud Services',
				descriptor: 'LUMA*CLOUD PRO',
				category: 'Software',
				amount: 128.4,
				currency: 'GBP',
				cardName: 'Founder card',
				cardLast4: '2048',
				cardStatus: 'active',
				postedAt: '2026-07-29T09:42:00.000Z',
				status: 'posted',
				eligible: true,
				deadline: '2026-11-24',
				revision: 5,
				claim: null,
				latestReceipt: null,
				events: [
					createEvent('event-luma-1', 'Transaction posted', 'Card-not-present purchase cleared.', 'approved', '2026-07-29T09:42:00.000Z'),
					createEvent('event-luma-2', 'Dispute window checked', 'The transaction can enter dispute intake.', 'approved', seededAt),
				],
			},
			{
				id: 'txn-harbor-market',
				merchant: 'Harbor Market',
				descriptor: 'HARBOR MARKET 018',
				category: 'Groceries',
				amount: 42.16,
				currency: 'GBP',
				cardName: 'Design operations',
				cardLast4: '9182',
				cardStatus: 'active',
				postedAt: '2026-07-28T18:11:00.000Z',
				status: 'posted',
				eligible: true,
				deadline: '2026-11-23',
				revision: 9,
				claim: {
					id: 'claim-harbor',
					status: 'draft',
					reasonCode: 'duplicate',
					statement: 'The same grocery purchase appears twice on the card statement within two minutes.',
					merchantContacted: true,
					cardInPossession: true,
					recognizesMerchant: true,
					requestedFreeze: false,
					requestedReplacement: false,
					evidence: [createEvidence('evidence-harbor-1', 'receipt', 'Harbor receipt 49218.pdf', 'Original till receipt for £42.16.', seededAt)],
					protection: createProtectionState('active'),
					preflight: null,
					submission: null,
					createdAt: '2026-07-31T12:05:00.000Z',
					updatedAt: seededAt,
				},
				latestReceipt: null,
				events: [createEvent('event-harbor-1', 'Draft started', 'Duplicate charge intake saved.', 'approved', seededAt)],
			},
			{
				id: 'txn-nova-stay',
				merchant: 'Nova Stay',
				descriptor: 'NOVA STAY DEPOSIT',
				category: 'Travel',
				amount: 246,
				currency: 'GBP',
				cardName: 'Founder card',
				cardLast4: '2048',
				cardStatus: 'frozen',
				postedAt: '2026-07-17T08:20:00.000Z',
				status: 'posted',
				eligible: true,
				deadline: '2026-11-12',
				revision: 15,
				claim: createSubmittedClaim(seededAt),
				latestReceipt: {
					id: 'receipt-nova-submit',
					type: 'card_dispute_submitted',
					transactionId: 'txn-nova-stay',
					revision: 15,
					createdAt: '2026-07-31T09:30:00.000Z',
					createdBy: 'Maya Chen',
					data: { caseNumber: 'DSP-263841', networkReasonCode: NETWORK_REASON_CODES.not_received },
				},
				events: [
					createEvent('event-nova-1', 'DSP-263841 submitted', 'Merchant services review · evidence locked.', 'approved', '2026-07-31T09:30:00.000Z'),
					createEvent('event-nova-2', 'Merchant response requested', 'Response due within 10 days.', 'pending', seededAt),
				],
			},
			{
				id: 'txn-railpass',
				merchant: 'RailPass UK',
				descriptor: 'RAILPASS PENDING',
				category: 'Transport',
				amount: 18.9,
				currency: 'GBP',
				cardName: 'Founder card',
				cardLast4: '2048',
				cardStatus: 'active',
				postedAt: '2026-08-01T16:04:00.000Z',
				status: 'pending',
				eligible: false,
				deadline: '',
				revision: 3,
				claim: null,
				latestReceipt: null,
				events: [createEvent('event-rail-1', 'Authorization pending', 'Wait for the merchant to complete or reverse the charge.', 'pending', seededAt)],
			},
		],
	};
}

/**
 * Creates the seeded submitted Nova Stay case.
 *
 * @param {string} seededAt Deterministic current timestamp.
 * @returns {Record<string, unknown>} Submitted claim record.
 */
function createSubmittedClaim(seededAt) {
	return {
		id: 'claim-nova',
		status: 'submitted',
		reasonCode: 'not_received',
		statement: 'The hotel cancelled the reservation but has not returned the deposit after two written requests.',
		merchantContacted: true,
		cardInPossession: true,
		recognizesMerchant: true,
		requestedFreeze: false,
		requestedReplacement: false,
		evidence: [
			createEvidence('evidence-nova-1', 'merchant_correspondence', 'Nova cancellation thread.eml', 'Two refund requests and the merchant cancellation.', seededAt),
			createEvidence('evidence-nova-2', 'receipt', 'Nova booking NVS-8824.pdf', 'Original refundable booking terms.', seededAt),
		],
		protection: createProtectionState('frozen'),
		preflight: {
			id: 'preflight-nova',
			ready: true,
			checks: [],
			revision: 14,
			checkedAt: '2026-07-31T09:28:00.000Z',
			checkedBy: 'Dispute policy service',
		},
		submission: {
			caseNumber: 'DSP-263841',
			status: 'submitted',
			networkReasonCode: NETWORK_REASON_CODES.not_received,
			queue: routeForReason('not_received'),
			serviceLevel: 'Merchant response · 10 days',
			provisionalCredit: { status: 'review_required', amount: 0, currency: 'GBP', reason: 'Merchant-service disputes require an operations decision.' },
			submittedAt: '2026-07-31T09:30:00.000Z',
			submittedBy: 'Maya Chen',
			receiptId: 'receipt-nova-submit',
		},
		createdAt: '2026-07-30T14:12:00.000Z',
		updatedAt: seededAt,
	};
}

/**
 * Creates a typed seeded evidence record.
 *
 * @param {string} id Stable evidence identifier.
 * @param {string} type Evidence type.
 * @param {string} reference File or record reference.
 * @param {string} note Evidence note.
 * @param {string} createdAt ISO timestamp.
 * @returns {Record<string, unknown>} Evidence record.
 */
function createEvidence(id, type, reference, note, createdAt) {
	return {
		id,
		type,
		typeLabel: labelFor(EVIDENCE_TYPE_OPTIONS, type),
		reference,
		note,
		status: 'verified',
		checksum: checksumFor(`${id}:${reference}`),
		createdAt,
		createdBy: 'Maya Chen',
	};
}

/**
 * Creates a normalized card-protection record.
 *
 * @param {string} cardStatus Current card status.
 * @returns {Record<string, unknown>} Card-protection state.
 */
function createProtectionState(cardStatus) {
	return {
		status: cardStatus === 'frozen' ? 'frozen' : 'not_applied',
		cardStatus,
		freezeApplied: cardStatus === 'frozen',
		replacementRequested: false,
		reason: '',
		appliedAt: null,
		appliedBy: null,
	};
}

/**
 * Creates a timeline event.
 *
 * @param {string} id Stable event identifier.
 * @param {string} title Event title.
 * @param {string} detail Event detail.
 * @param {string} status Event status.
 * @param {string} createdAt ISO timestamp.
 * @returns {Record<string, unknown>} Timeline event.
 */
function createEvent(id, title, detail, status, createdAt) {
	return { id, title, detail, status, createdAt, actor: status === 'pending' ? 'Network service' : 'Maya Chen' };
}

/**
 * Builds the current server-owned eligibility and evidence checks.
 *
 * @param {Record<string, unknown>} transaction Transaction and claim state.
 * @returns {Array<Record<string, unknown>>} Ordered preflight checks.
 */
function buildPreflightChecks(transaction) {
	const claim = transaction.claim;
	const requiresMerchantContact = ['wrong_amount', 'not_received', 'cancelled'].includes(claim.reasonCode);
	const requiredEvidenceType = claim.reasonCode === 'cancelled'
		? 'cancellation_confirmation'
		: claim.reasonCode === 'not_received'
			? 'merchant_correspondence'
			: '';
	return [
		createCheck('eligibility', 'Transaction eligible', transaction.eligible && transaction.status === 'posted', transaction.eligible ? `File by ${transaction.deadline}.` : 'Only posted transactions inside the network window can be disputed.'),
		createCheck('statement', 'Customer statement', claim.statement.length >= 40, `${claim.statement.length} characters captured.`),
		createCheck('evidence', 'Evidence verified', claim.evidence.length > 0, claim.evidence.length ? `${claim.evidence.length} verified item${claim.evidence.length === 1 ? '' : 's'}.` : 'Add at least one evidence record.'),
		createCheck('merchant', 'Merchant contact', !requiresMerchantContact || claim.merchantContacted, requiresMerchantContact ? 'Required for this reason.' : 'Not required for this reason.'),
		createCheck('reason_evidence', 'Reason-specific proof', !requiredEvidenceType || claim.evidence.some((item) => item.type === requiredEvidenceType), requiredEvidenceType ? `Requires ${labelFor(EVIDENCE_TYPE_OPTIONS, requiredEvidenceType).toLowerCase()}.` : 'No additional proof type is required.'),
		createCheck('card_protection', 'Card protection choice', claim.requestedFreeze || claim.requestedReplacement || claim.reasonCode !== 'unauthorized', claim.reasonCode === 'unauthorized' ? 'Choose freeze or replacement for suspected compromise.' : 'Optional for this dispute reason.'),
	];
}

/**
 * Creates one preflight check.
 *
 * @param {string} key Stable check key.
 * @param {string} label Human label.
 * @param {boolean} passed Whether the check passed.
 * @param {string} detail Supporting detail.
 * @returns {Record<string, unknown>} Preflight check.
 */
function createCheck(key, label, passed, detail) {
	return { key, label, detail, status: passed ? 'passed' : 'blocked' };
}

/**
 * Returns the provisional-credit decision for a submitted case.
 *
 * @param {Record<string, unknown>} transaction Submitted transaction candidate.
 * @returns {Record<string, unknown>} Credit decision.
 */
function getProvisionalCreditDecision(transaction) {
	const eligible = transaction.claim.reasonCode === 'unauthorized' && transaction.amount <= 250;
	return eligible
		? { status: 'issued', amount: transaction.amount, currency: transaction.currency, reason: 'Eligible unauthorized transaction below the instant-credit threshold.' }
		: { status: 'review_required', amount: 0, currency: transaction.currency, reason: 'Operations review is required before a credit decision.' };
}

/**
 * Rejects changes to ineligible or already-submitted transactions.
 *
 * @param {Record<string, unknown>} transaction Transaction record.
 * @returns {Record<string, unknown> | null} Validation response when locked.
 */
function requireEditableTransaction(transaction) {
	if (!transaction.eligible || transaction.status !== 'posted') return validation('This transaction cannot enter dispute intake yet.', { transaction: ['Wait until the transaction posts or choose another eligible charge.'] });
	if (transaction.claim?.status === 'submitted') return validation('This dispute is already submitted.', { claim: ['Submitted evidence and statements are immutable.'] });
	return null;
}

/**
 * Requires an existing editable claim draft.
 *
 * @param {Record<string, unknown>} transaction Transaction record.
 * @returns {Record<string, unknown> | null} Validation response when missing.
 */
function requireDraftClaim(transaction) {
	if (!transaction.claim) return validation('Start the dispute intake first.', { claim: ['Save a reason and statement before continuing.'] });
	if (transaction.claim.status !== 'draft') return validation('Submitted disputes cannot be edited.', { claim: ['Choose a draft transaction to continue editing.'] });
	return null;
}

/**
 * Rejects stale writes and includes fresh server state for recovery.
 *
 * @param {Record<string, unknown>} transaction Transaction record.
 * @param {unknown} revision Expected revision.
 * @returns {Record<string, unknown> | null} Conflict response when stale.
 */
function validateRevision(transaction, revision) {
	if (Number(revision) === transaction.revision) return null;
	return {
		error: 'revision_conflict',
		status: 409,
		message: `The transaction changed at revision ${transaction.revision}.`,
		transaction: serializeTransaction(transaction),
	};
}

/**
 * Clears a preflight decision after claim content changes.
 *
 * @param {Record<string, unknown>} claim Claim record.
 * @returns {void}
 */
function invalidatePreflight(claim) {
	claim.preflight = null;
}

/**
 * Advances the optimistic revision counter.
 *
 * @param {Record<string, unknown>} transaction Transaction record.
 * @returns {void}
 */
function advanceRevision(transaction) {
	transaction.revision += 1;
}

/**
 * Adds an auditable event to a transaction timeline.
 *
 * @param {Record<string, unknown>} transaction Transaction record.
 * @param {string} title Event title.
 * @param {string} detail Event detail.
 * @param {string} status Event status.
 * @returns {void}
 */
function appendEvent(transaction, title, detail, status) {
	transaction.events.unshift({
		id: `event-${workspace.sequence++}`,
		title,
		detail,
		status,
		createdAt: nowIso(),
		actor: workspace.actor,
	});
}

/**
 * Creates an immutable mutation receipt.
 *
 * @param {string} type Receipt type.
 * @param {Record<string, unknown>} transaction Transaction record.
 * @param {Record<string, unknown>} data Receipt evidence.
 * @returns {Record<string, unknown>} Mutation receipt.
 */
function createReceipt(type, transaction, data) {
	return {
		id: `receipt-${workspace.sequence++}`,
		type,
		transactionId: transaction.id,
		revision: transaction.revision,
		createdAt: nowIso(),
		createdBy: workspace.actor,
		data,
	};
}

/**
 * Returns a workspace summary without mutable transaction details.
 *
 * @returns {Record<string, unknown>} Workspace summary.
 */
function serializeWorkspace() {
	return {
		id: workspace.id,
		name: workspace.name,
		actor: workspace.actor,
		role: workspace.role,
		accountBalance: workspace.accountBalance,
		currency: workspace.currency,
		transactionCount: workspace.transactions.length,
		openCases: workspace.transactions.filter((transaction) => transaction.claim?.status === 'submitted').length,
		drafts: workspace.transactions.filter((transaction) => transaction.claim?.status === 'draft').length,
	};
}

/**
 * Serializes compact transaction rows for the queue.
 *
 * @returns {Array<Record<string, unknown>>} Transaction summaries.
 */
function serializeTransactionList() {
	return workspace.transactions.map((transaction) => ({
		id: transaction.id,
		merchant: transaction.merchant,
		descriptor: transaction.descriptor,
		category: transaction.category,
		amount: transaction.amount,
		currency: transaction.currency,
		postedAt: transaction.postedAt,
		status: transaction.status,
		eligible: transaction.eligible,
		deadline: transaction.deadline,
		revision: transaction.revision,
		claimStatus: transaction.claim?.status || (transaction.eligible ? 'needs_action' : 'not_eligible'),
		claimStatusMeta: getClaimStatusMeta(transaction),
		caseNumber: transaction.claim?.submission?.caseNumber || '',
	}));
}

/**
 * Serializes one transaction with all non-sensitive dispute state.
 *
 * @param {Record<string, unknown>} transaction Transaction record.
 * @returns {Record<string, unknown>} Public transaction detail.
 */
function serializeTransaction(transaction) {
	return {
		id: transaction.id,
		merchant: transaction.merchant,
		descriptor: transaction.descriptor,
		category: transaction.category,
		amount: transaction.amount,
		currency: transaction.currency,
		cardName: transaction.cardName,
		cardLast4: transaction.cardLast4,
		cardStatus: transaction.cardStatus,
		postedAt: transaction.postedAt,
		status: transaction.status,
		eligible: transaction.eligible,
		deadline: transaction.deadline,
		revision: transaction.revision,
		claimStatusMeta: getClaimStatusMeta(transaction),
		claim: serializeClaim(transaction.claim),
		events: structuredClone(transaction.events),
		latestReceipt: transaction.latestReceipt ? structuredClone(transaction.latestReceipt) : null,
		capabilities: {
			canEdit: transaction.eligible && transaction.status === 'posted' && transaction.claim?.status !== 'submitted',
			canAddEvidence: transaction.claim?.status === 'draft',
			canSubmit: transaction.claim?.status === 'draft',
			canProtect: Boolean(transaction.claim),
		},
	};
}

/**
 * Serializes a claim or returns null for untouched transactions.
 *
 * @param {Record<string, unknown> | null} claim Claim record.
 * @returns {Record<string, unknown> | null} Public claim record.
 */
function serializeClaim(claim) {
	if (!claim) return null;
	return structuredClone(claim);
}

/**
 * Returns display metadata for a transaction's dispute lifecycle.
 *
 * @param {Record<string, unknown>} transaction Transaction record.
 * @returns {{label: string, tone: string}} Status metadata.
 */
function getClaimStatusMeta(transaction) {
	if (!transaction.eligible) return { label: 'Not eligible', tone: 'neutral' };
	if (transaction.claim?.status === 'submitted') return { label: 'Submitted', tone: 'success' };
	if (transaction.claim?.status === 'draft') return { label: 'Draft', tone: 'warning' };
	return { label: 'Needs action', tone: 'danger' };
}

/**
 * Returns rich selector options used by the dispute workspace.
 *
 * @returns {Record<string, unknown>} Rich selector options.
 */
function serializeOptions() {
	return {
		reasons: structuredClone(REASON_OPTIONS),
		evidenceTypes: structuredClone(EVIDENCE_TYPE_OPTIONS),
		caseStatuses: structuredClone(CASE_STATUS_OPTIONS),
	};
}

/**
 * Finds a transaction by stable identifier.
 *
 * @param {string} transactionId Stable transaction identifier.
 * @returns {Record<string, unknown> | null} Matching transaction.
 */
function findTransaction(transactionId) {
	return workspace.transactions.find((transaction) => transaction.id === transactionId) || null;
}

/**
 * Maps a dispute reason to its operations queue.
 *
 * @param {string} reasonCode Dispute reason.
 * @returns {string} Operations queue label.
 */
function routeForReason(reasonCode) {
	if (reasonCode === 'unauthorized') return 'Fraud operations';
	if (['duplicate', 'wrong_amount'].includes(reasonCode)) return 'Billing dispute';
	return 'Merchant services review';
}

/**
 * Finds a display label for an option value.
 *
 * @param {Array<{value: string, label: string}>} options Option records.
 * @param {string} value Option value.
 * @returns {string} Matching label or original value.
 */
function labelFor(options, value) {
	return options.find((option) => option.value === value)?.label || value;
}

/**
 * Creates a deterministic short checksum for demo evidence.
 *
 * @param {string} value Input value.
 * @returns {string} Demo checksum.
 */
function checksumFor(value) {
	let hash = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return `sha256:demo-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Returns an ISO timestamp for demo mutations.
 *
 * @returns {string} ISO timestamp.
 */
function nowIso() {
	return new Date().toISOString();
}

/**
 * Creates a successful API response.
 *
 * @param {string} message Human message.
 * @param {Record<string, unknown>} data Response data.
 * @returns {Record<string, unknown>} Success response.
 */
function success(message, data = {}) {
	return { ok: true, message, ...data };
}

/**
 * Creates a structured validation response.
 *
 * @param {string} message Human message.
 * @param {Record<string, string[]>} fields Field errors.
 * @returns {Record<string, unknown>} Validation response.
 */
function validation(message, fields = {}) {
	return { error: 'validation_error', status: 422, message, fields };
}

/**
 * Creates a not-found response.
 *
 * @param {string} label Missing record label.
 * @returns {Record<string, unknown>} Not-found response.
 */
function notFound(label) {
	return { error: 'not_found', status: 404, message: `${label} not found.` };
}
