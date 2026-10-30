const REVIEWER = {
	id: 'reviewer-ella',
	name: 'Ella Morgan',
	initials: 'EM',
	role: 'Senior moderator',
};

const STATUS_OPTIONS = [
	{ value: 'all', label: 'All work', description: 'Every open, decided, and appealed case.' },
	{ value: 'needs_review', label: 'Needs review', description: 'Unclaimed reports and automated holds.' },
	{ value: 'in_review', label: 'In review', description: 'Cases currently owned by a moderator.' },
	{ value: 'escalated', label: 'Escalated', description: 'Cases waiting for a specialist.' },
	{ value: 'appeal_pending', label: 'Appeals', description: 'Enforcement decisions challenged by an author.' },
	{ value: 'decided', label: 'Decided', description: 'Completed moderation decisions.' },
];

const QUEUE_OPTIONS = [
	{ value: 'all', label: 'All queues', description: 'Community, marketplace, integrity, and appeals.' },
	{ value: 'community', label: 'Community', description: 'Member reports and conversation safety.' },
	{ value: 'marketplace', label: 'Marketplace', description: 'Listings, payment safety, and buyer reports.' },
	{ value: 'integrity', label: 'Integrity', description: 'Privacy, impersonation, and coordinated abuse.' },
	{ value: 'appeals', label: 'Appeals', description: 'Second-look enforcement review.' },
];

const ACTION_OPTIONS = [
	{ value: 'allow_content', label: 'Allow content', description: 'Release the hold without enforcement.' },
	{ value: 'warn_author', label: 'Warn author', description: 'Keep the content visible and issue guidance.' },
	{ value: 'restrict_content', label: 'Restrict content', description: 'Limit reach while preserving the record.' },
	{ value: 'remove_content', label: 'Remove content', description: 'Remove the item and notify the author.' },
	{ value: 'escalate', label: 'Escalate', description: 'Send the case to a policy specialist.' },
];

const POLICY_OPTIONS = [
	{ value: 'no_violation', label: 'No policy violation', description: 'Context does not meet an enforcement threshold.' },
	{ value: 'harassment', label: 'Harassment and bullying', description: 'Targeted degrading or intimidating language.' },
	{ value: 'fraud', label: 'Fraud and payment safety', description: 'Deceptive commerce or payment-bypass behavior.' },
	{ value: 'privacy', label: 'Privacy and personal information', description: 'Sharing or soliciting personal information.' },
	{ value: 'spam', label: 'Spam and manipulation', description: 'Repetitive, deceptive, or coordinated promotion.' },
];

const APPEAL_ACTION_OPTIONS = [
	{ value: 'uphold', label: 'Uphold decision', description: 'Keep the original enforcement in place.' },
	{ value: 'restore', label: 'Restore content', description: 'Reverse the decision and restore the item.' },
	{ value: 'modify', label: 'Modify enforcement', description: 'Replace removal with a warning and reach limit.' },
];

let workspace;

/**
 * Creates deterministic process-local moderation workspace state.
 *
 * @returns {Record<string, unknown>} Seeded moderation workspace.
 */
function createWorkspace() {
	return {
		revision: 17,
		sequence: 6100,
		name: 'Northstar Trust',
		serviceLevel: '14 minute median review',
		selectedCaseId: 'case-harassment-1048',
		cases: createCases(),
		lastReceipt: null,
	};
}

/**
 * Creates realistic moderation cases spanning first review and appeals.
 *
 * @returns {Array<Record<string, unknown>>} Seeded moderation cases.
 */
function createCases() {
	return [
		{
			id: 'case-harassment-1048',
			version: 3,
			status: 'needs_review',
			severity: 'high',
			queue: 'community',
			contentType: 'Comment',
			title: 'Targeted reply in launch thread',
			ageMinutes: 18,
			reportCount: 12,
			autoHeld: true,
			assignment: null,
			content: 'You are useless at this. Everyone would be better off if you got off the project and stopped embarrassing the team.',
			context: {
				surface: 'Checkout rollout feedback',
				parent: 'The new retry policy reduced failed payments in our first rollout cohort.',
				before: 'Can we compare the recovery rate with last week before we celebrate?',
				after: 'Please keep the thread focused on the rollout data.',
			},
			author: {
				id: 'usr-291',
				name: 'Maya K.',
				initials: 'MK',
				joinedAt: '2025-11-08',
				contributions: 184,
				priorActions: 2,
				note: 'Two warnings for targeted replies in the last 90 days.',
			},
			signals: [
				{ id: 'harassment', label: 'Harassment', confidence: 0.91, source: 'Text classifier', matched: true },
				{ id: 'threat', label: 'Threat', confidence: 0.18, source: 'Text classifier', matched: false },
				{ id: 'spam', label: 'Spam', confidence: 0.04, source: 'Behavior model', matched: false },
			],
			reports: [
				{ reason: 'Targeted harassment', count: 8 },
				{ reason: 'Bullying', count: 3 },
				{ reason: 'Other', count: 1 },
			],
			evidence: [
				{ label: 'Unique reporters', value: '9 members', detail: 'Three reports came from thread participants.' },
				{ label: 'Prior action', value: 'Warning · 59 days ago', detail: 'Previous targeted reply was removed after review.' },
				{ label: 'Distribution', value: 'Not reshared', detail: 'The reply is held and visible only to moderators.' },
			],
			notes: [],
			preview: null,
			decision: null,
			appeal: null,
			activity: [
				activity('evt-1048-3', 'Auto-hold applied', 'Text classifier crossed the harassment review threshold.', 'Safety classifier', '2026-08-02T09:42:00.000Z', 'warning'),
				activity('evt-1048-2', 'Report threshold reached', 'Twelve reports from nine unique members were grouped into one case.', 'Report service', '2026-08-02T09:39:00.000Z', 'info'),
				activity('evt-1048-1', 'First report received', 'A thread participant reported targeted harassment.', 'Community member', '2026-08-02T09:31:00.000Z', 'neutral'),
			],
		},
		{
			id: 'case-marketplace-1049',
			version: 2,
			status: 'needs_review',
			severity: 'medium',
			queue: 'marketplace',
			contentType: 'Listing',
			title: 'Off-platform payment request',
			ageMinutes: 44,
			reportCount: 5,
			autoHeld: true,
			assignment: null,
			content: 'Skip checkout and message the number ending 1429 for half price. Gift cards accepted and there are no platform fees.',
			context: {
				surface: 'Brand kit template bundle',
				parent: 'Digital asset listing · £68 · instant delivery',
				before: 'Includes logo, social, and presentation templates.',
				after: 'Listing was paused automatically before a transaction completed.',
			},
			author: {
				id: 'seller-882',
				name: 'Northline Studio',
				initials: 'NS',
				joinedAt: '2024-09-12',
				contributions: 38,
				priorActions: 0,
				note: 'Verified seller with no previous enforcement.',
			},
			signals: [
				{ id: 'fraud', label: 'Payment bypass', confidence: 0.88, source: 'Commerce rules', matched: true },
				{ id: 'spam', label: 'Spam', confidence: 0.31, source: 'Behavior model', matched: false },
				{ id: 'privacy', label: 'Personal information', confidence: 0.56, source: 'PII detector', matched: true },
			],
			reports: [
				{ reason: 'Payment outside platform', count: 4 },
				{ reason: 'Suspicious contact request', count: 1 },
			],
			evidence: [
				{ label: 'Checkout attempts', value: '0 completed', detail: 'The automated hold applied before payment.' },
				{ label: 'Contact pattern', value: 'Phone fragment', detail: 'A contact number was detected and masked.' },
				{ label: 'Seller history', value: '38 fulfilled orders', detail: 'No prior moderation actions.' },
			],
			notes: [],
			preview: null,
			decision: null,
			appeal: null,
			activity: [
				activity('evt-1049-2', 'Listing paused', 'Commerce rules held the listing before checkout.', 'Commerce rules', '2026-08-02T09:17:00.000Z', 'warning'),
				activity('evt-1049-1', 'Buyer report received', 'Buyer reported an off-platform payment request.', 'Marketplace member', '2026-08-02T09:14:00.000Z', 'neutral'),
			],
		},
		{
			id: 'case-privacy-1050',
			version: 4,
			status: 'escalated',
			severity: 'critical',
			queue: 'integrity',
			contentType: 'Post',
			title: 'Personal information in dispute post',
			ageMinutes: 71,
			reportCount: 3,
			autoHeld: true,
			assignment: { ...REVIEWER, assignedAt: '2026-08-02T09:02:00.000Z' },
			content: 'The organizer lives on Cedar Lane and their phone number ends 0182. Contact them directly if the refund does not arrive.',
			context: {
				surface: 'Event refund discussion',
				parent: 'Refund requests should go through the event support form.',
				before: 'Support confirmed that the payment batch is delayed.',
				after: 'The post is hidden while a privacy specialist reviews it.',
			},
			author: {
				id: 'usr-104',
				name: 'Owen R.',
				initials: 'OR',
				joinedAt: '2026-01-28',
				contributions: 52,
				priorActions: 0,
				note: 'No previous enforcement; information is partially masked in reviewer view.',
			},
			signals: [
				{ id: 'privacy', label: 'Personal information', confidence: 0.96, source: 'PII detector', matched: true },
				{ id: 'harassment', label: 'Harassment', confidence: 0.42, source: 'Text classifier', matched: false },
			],
			reports: [{ reason: 'Shares private information', count: 3 }],
			evidence: [
				{ label: 'PII detector', value: '2 entities', detail: 'Street and phone fragments were masked.' },
				{ label: 'Distribution', value: '14 impressions', detail: 'No reshares were detected before the hold.' },
			],
			notes: [
				{ id: 'note-1050-1', author: 'Ella Morgan', body: 'Escalated because the post combines location and direct-contact information.', createdAt: '2026-08-02T09:04:00.000Z' },
			],
			preview: null,
			decision: null,
			appeal: null,
			activity: [
				activity('evt-1050-2', 'Escalated to privacy', 'Location and contact fragments require specialist review.', 'Ella Morgan', '2026-08-02T09:04:00.000Z', 'danger'),
				activity('evt-1050-1', 'Post hidden', 'PII detector applied a temporary hold.', 'Integrity service', '2026-08-02T08:49:00.000Z', 'warning'),
			],
		},
		{
			id: 'case-appeal-1032',
			version: 6,
			status: 'appeal_pending',
			severity: 'medium',
			queue: 'appeals',
			contentType: 'Comment',
			title: 'Criticism removed as harassment',
			ageMinutes: 205,
			reportCount: 2,
			autoHeld: false,
			assignment: { ...REVIEWER, assignedAt: '2026-08-02T08:21:00.000Z' },
			content: 'This migration was a disaster, but the support team handled the rollback well and deserves credit for the recovery.',
			context: {
				surface: 'Service migration retrospective',
				parent: 'Please share constructive feedback on the migration window.',
				before: 'Several customers could not access reports for two hours.',
				after: 'The author says the comment criticized an event, not an individual.',
			},
			author: {
				id: 'usr-771',
				name: 'Priya S.',
				initials: 'PS',
				joinedAt: '2023-05-19',
				contributions: 640,
				priorActions: 0,
				note: 'Long-standing member with no previous moderation actions.',
			},
			signals: [
				{ id: 'harassment', label: 'Harassment', confidence: 0.54, source: 'Text classifier', matched: false },
				{ id: 'spam', label: 'Spam', confidence: 0.02, source: 'Behavior model', matched: false },
			],
			reports: [
				{ reason: 'Harassment', count: 1 },
				{ reason: 'Hostile language', count: 1 },
			],
			evidence: [
				{ label: 'Target', value: 'Project event', detail: 'No individual is named or directly addressed.' },
				{ label: 'Author history', value: 'No prior actions', detail: '640 contributions since May 2023.' },
				{ label: 'Positive context', value: 'Support team credited', detail: 'The second clause recognizes the recovery response.' },
			],
			notes: [],
			preview: null,
			decision: {
				id: 'decision-6092',
				action: 'remove_content',
				actionLabel: 'Remove content',
				policyId: 'harassment',
				policyLabel: 'Harassment and bullying',
				rationale: 'The opening language was interpreted as a targeted attack.',
				decidedBy: 'Moderator queue',
				decidedAt: '2026-08-02T07:16:00.000Z',
				auditReceipt: 'audit:mod-6092',
			},
			appeal: {
				id: 'appeal-204',
				version: 2,
				status: 'pending',
				reason: 'My comment described the migration and also praised the support team. It was not directed at a person.',
				submittedAt: '2026-08-02T08:18:00.000Z',
				preview: null,
				resolution: null,
			},
			activity: [
				activity('evt-1032-3', 'Appeal submitted', 'Author requested a second review of the harassment decision.', 'Appeals service', '2026-08-02T08:18:00.000Z', 'info'),
				activity('evt-1032-2', 'Content removed', 'Original reviewer applied harassment policy.', 'Moderator queue', '2026-08-02T07:16:00.000Z', 'warning'),
				activity('evt-1032-1', 'Two reports grouped', 'Reports were grouped into one review case.', 'Report service', '2026-08-02T07:03:00.000Z', 'neutral'),
			],
		},
	];
}

/**
 * Creates one moderation activity record.
 *
 * @param {string} id Stable event identifier.
 * @param {string} title Activity title.
 * @param {string} detail Activity detail.
 * @param {string} actor Activity actor.
 * @param {string} createdAt ISO timestamp.
 * @param {string} tone Semantic DOM Studio tone.
 * @returns {Record<string, unknown>} Activity record.
 */
function activity(id, title, detail, actor, createdAt, tone) {
	return { id, title, detail, actor, createdAt, tone };
}

/**
 * Returns queue summaries, reviewer context, counts, and select catalogs.
 *
 * @returns {Record<string, unknown>} Moderation bootstrap payload.
 */
export function getModerationWorkspace() {
	return buildPayload();
}

/**
 * Returns one complete moderation case lazily.
 *
 * @param {string} caseId Stable case identifier.
 * @returns {Record<string, unknown>} Case detail or not-found response.
 */
export function getModerationCase(caseId) {
	const moderationCase = findCase(caseId);
	if (!moderationCase) return notFound('Moderation case');
	return {
		workspaceRevision: workspace.revision,
		case: publicCase(moderationCase),
	};
}

/**
 * Claims one open case for the seeded reviewer.
 *
 * @param {string} caseId Stable case identifier.
 * @param {Record<string, unknown>} input Exact revision payload.
 * @returns {Record<string, unknown>} Updated workspace or API error.
 */
export function claimModerationCase(caseId, input) {
	const moderationCase = findCase(caseId);
	if (!moderationCase) return notFound('Moderation case');
	const exact = exactCase(moderationCase, input);
	if (exact) return exact;
	if (moderationCase.assignment && moderationCase.assignment.id !== REVIEWER.id) return conflict('This case is already assigned to another reviewer.');
	if (!['needs_review', 'in_review'].includes(moderationCase.status)) return validation('This case cannot be claimed from its current state.', { case: ['Choose a case that still needs first review.'] });

	moderationCase.assignment = { ...REVIEWER, assignedAt: nowIso() };
	moderationCase.status = 'in_review';
	moderationCase.activity.unshift(activity(nextId('evt'), 'Case claimed', 'Review ownership and the exact case version were recorded.', REVIEWER.name, nowIso(), 'info'));
	bump(moderationCase);
	return mutationPayload(moderationCase, 'Case claimed for review.');
}

/**
 * Adds an internal note without changing the enforcement decision.
 *
 * @param {string} caseId Stable case identifier.
 * @param {Record<string, unknown>} input Exact revision and note payload.
 * @returns {Record<string, unknown>} Updated workspace or API error.
 */
export function addModerationNote(caseId, input) {
	const moderationCase = findCase(caseId);
	if (!moderationCase) return notFound('Moderation case');
	const exact = exactCase(moderationCase, input);
	if (exact) return exact;
	if (moderationCase.assignment?.id !== REVIEWER.id) return validation('Claim this case before adding an internal note.', { case: ['A reviewer must own the case.'] });
	const body = String(input.body || '').trim();
	if (body.length < 12) return validation('Add enough detail for another reviewer to understand the note.', { body: ['Use at least 12 characters.'] });

	moderationCase.notes.unshift({ id: nextId('note'), author: REVIEWER.name, body, createdAt: nowIso() });
	moderationCase.activity.unshift(activity(nextId('evt'), 'Internal note added', body, REVIEWER.name, nowIso(), 'neutral'));
	bump(moderationCase);
	return mutationPayload(moderationCase, 'Internal note recorded.');
}

/**
 * Creates an immutable preview for a first-review decision.
 *
 * @param {string} caseId Stable case identifier.
 * @param {Record<string, unknown>} input Exact revision and decision draft.
 * @returns {Record<string, unknown>} Updated workspace with preview or API error.
 */
export function previewModerationDecision(caseId, input) {
	const moderationCase = findCase(caseId);
	if (!moderationCase) return notFound('Moderation case');
	const exact = exactCase(moderationCase, input);
	if (exact) return exact;
	if (moderationCase.assignment?.id !== REVIEWER.id) return validation('Claim this case before making a decision.', { case: ['A reviewer must own the case.'] });
	if (!['in_review', 'escalated'].includes(moderationCase.status)) return validation('This case is not open for a first-review decision.', { case: ['Choose an in-review or escalated case.'] });

	const draft = normalizeDecision(input);
	const fields = validateDecision(moderationCase, draft);
	if (Object.keys(fields).length) return validation('Review the decision fields before creating a preview.', fields);

	bump(moderationCase);
	moderationCase.preview = createDecisionPreview(moderationCase, draft);
	return mutationPayload(moderationCase, 'Exact decision preview created.');
}

/**
 * Commits an exact decision preview and creates delivery and audit receipts.
 *
 * @param {string} caseId Stable case identifier.
 * @param {Record<string, unknown>} input Exact preview commitment.
 * @returns {Record<string, unknown>} Updated workspace with receipt or API error.
 */
export function commitModerationDecision(caseId, input) {
	const moderationCase = findCase(caseId);
	if (!moderationCase) return notFound('Moderation case');
	const exact = exactCase(moderationCase, input);
	if (exact) return exact;
	const preview = moderationCase.preview;
	if (!preview || preview.checksum !== String(input.previewChecksum || '')) return conflict('The decision preview is missing or stale. Create a new exact preview.');
	if (preview.requiresAcknowledgement && input.acknowledged !== true) return validation('Acknowledge the enforcement effects before applying this decision.', { acknowledged: ['Confirm the exact enforcement and notification effects.'] });

	const receipt = {
		id: nextId('decision'),
		auditReceipt: nextId('audit:mod'),
		deliveryReceipt: preview.notifyAuthor ? nextId('notify:author') : 'notification:skipped',
		checksum: preview.checksum,
		createdAt: nowIso(),
	};
	moderationCase.decision = {
		id: receipt.id,
		action: preview.action,
		actionLabel: preview.actionLabel,
		policyId: preview.policyId,
		policyLabel: preview.policyLabel,
		rationale: preview.rationale,
		decidedBy: REVIEWER.name,
		decidedAt: receipt.createdAt,
		auditReceipt: receipt.auditReceipt,
	};
	moderationCase.status = preview.action === 'escalate' ? 'escalated' : 'decided';
	moderationCase.activity.unshift(activity(nextId('evt'), `${preview.actionLabel} applied`, `${preview.policyLabel}. ${preview.rationale}`, REVIEWER.name, receipt.createdAt, preview.action === 'allow_content' ? 'success' : preview.action === 'escalate' ? 'info' : 'warning'));
	moderationCase.preview = null;
	bump(moderationCase);
	workspace.lastReceipt = receipt;
	return mutationPayload(moderationCase, `${moderationCase.decision.actionLabel} recorded.`, { decisionReceipt: receipt });
}

/**
 * Creates an immutable second-review preview for an appeal.
 *
 * @param {string} appealId Stable appeal identifier.
 * @param {Record<string, unknown>} input Exact revision and appeal draft.
 * @returns {Record<string, unknown>} Updated workspace with appeal preview or API error.
 */
export function previewModerationAppeal(appealId, input) {
	const moderationCase = findAppealCase(appealId);
	if (!moderationCase) return notFound('Appeal');
	const exact = exactAppeal(moderationCase, input);
	if (exact) return exact;
	const draft = normalizeAppealDecision(input);
	const fields = validateAppealDecision(draft);
	if (Object.keys(fields).length) return validation('Review the appeal decision before creating a preview.', fields);

	bump(moderationCase);
	moderationCase.appeal.version += 1;
	moderationCase.appeal.preview = createAppealPreview(moderationCase, draft);
	return mutationPayload(moderationCase, 'Exact appeal preview created.');
}

/**
 * Commits an exact appeal outcome and preserves the original decision.
 *
 * @param {string} appealId Stable appeal identifier.
 * @param {Record<string, unknown>} input Exact preview commitment.
 * @returns {Record<string, unknown>} Updated workspace with appeal receipt or API error.
 */
export function commitModerationAppeal(appealId, input) {
	const moderationCase = findAppealCase(appealId);
	if (!moderationCase) return notFound('Appeal');
	const exact = exactAppeal(moderationCase, input);
	if (exact) return exact;
	const preview = moderationCase.appeal.preview;
	if (!preview || preview.checksum !== String(input.previewChecksum || '')) return conflict('The appeal preview is missing or stale. Create a new second-review preview.');
	if (input.acknowledged !== true) return validation('Acknowledge the appeal outcome before applying it.', { acknowledged: ['Confirm the author notification and enforcement change.'] });

	const receipt = {
		id: nextId('appeal-resolution'),
		auditReceipt: nextId('audit:appeal'),
		deliveryReceipt: nextId('notify:appeal'),
		checksum: preview.checksum,
		createdAt: nowIso(),
	};
	moderationCase.appeal.status = 'resolved';
	moderationCase.appeal.resolution = {
		id: receipt.id,
		action: preview.action,
		actionLabel: preview.actionLabel,
		rationale: preview.rationale,
		resolvedBy: REVIEWER.name,
		resolvedAt: receipt.createdAt,
		auditReceipt: receipt.auditReceipt,
	};
	moderationCase.appeal.preview = null;
	moderationCase.status = 'decided';
	if (preview.action === 'restore') moderationCase.decision.currentEffect = 'Content restored';
	if (preview.action === 'modify') moderationCase.decision.currentEffect = 'Warning and limited distribution';
	if (preview.action === 'uphold') moderationCase.decision.currentEffect = 'Removal upheld';
	moderationCase.activity.unshift(activity(nextId('evt'), preview.actionLabel, preview.rationale, REVIEWER.name, receipt.createdAt, preview.action === 'restore' ? 'success' : 'info'));
	bump(moderationCase);
	moderationCase.appeal.version += 1;
	workspace.lastReceipt = receipt;
	return mutationPayload(moderationCase, `${preview.actionLabel} recorded.`, { appealReceipt: receipt });
}

/**
 * Restores deterministic moderation demo state.
 *
 * @returns {Record<string, unknown>} Reset workspace payload.
 */
export function resetModerationWorkspace() {
	workspace = createWorkspace();
	return buildPayload();
}

/**
 * Builds the workspace bootstrap payload.
 *
 * @returns {Record<string, unknown>} Queue summaries and catalogs.
 */
function buildPayload() {
	const cases = workspace.cases.map(caseSummary);
	return {
		workspace: {
			name: workspace.name,
			revision: workspace.revision,
			serviceLevel: workspace.serviceLevel,
			selectedCaseId: workspace.selectedCaseId,
			reviewer: REVIEWER,
			counts: {
				open: cases.filter((item) => ['needs_review', 'in_review', 'escalated'].includes(item.status)).length,
				unassigned: cases.filter((item) => item.status === 'needs_review' && !item.assignedTo).length,
				appeals: cases.filter((item) => item.status === 'appeal_pending').length,
				highRisk: cases.filter((item) => ['high', 'critical'].includes(item.severity) && item.status !== 'decided').length,
			},
		},
		cases,
		catalogs: {
			statuses: STATUS_OPTIONS,
			queues: QUEUE_OPTIONS,
			actions: ACTION_OPTIONS,
			policies: POLICY_OPTIONS,
			appealActions: APPEAL_ACTION_OPTIONS,
		},
		lastReceipt: clone(workspace.lastReceipt),
	};
}

/**
 * Builds a mutation response containing bootstrap and selected detail.
 *
 * @param {Record<string, unknown>} moderationCase Updated moderation case.
 * @param {string} message Human-readable mutation result.
 * @param {Record<string, unknown>} [extra={}] Extra receipts.
 * @returns {Record<string, unknown>} Authoritative mutation payload.
 */
function mutationPayload(moderationCase, message, extra = {}) {
	workspace.selectedCaseId = moderationCase.id;
	return {
		...buildPayload(),
		selectedCase: publicCase(moderationCase),
		message,
		...extra,
	};
}

/**
 * Returns compact queue metadata for one case.
 *
 * @param {Record<string, unknown>} moderationCase Moderation case.
 * @returns {Record<string, unknown>} Queue summary.
 */
function caseSummary(moderationCase) {
	return {
		id: moderationCase.id,
		version: moderationCase.version,
		status: moderationCase.status,
		statusLabel: labelFor(STATUS_OPTIONS, moderationCase.status),
		severity: moderationCase.severity,
		severityLabel: capitalize(moderationCase.severity),
		queue: moderationCase.queue,
		queueLabel: labelFor(QUEUE_OPTIONS, moderationCase.queue),
		contentType: moderationCase.contentType,
		title: moderationCase.title,
		ageLabel: ageLabel(moderationCase.ageMinutes),
		reportCount: moderationCase.reportCount,
		assignedTo: moderationCase.assignment?.name || '',
		hasAppeal: Boolean(moderationCase.appeal?.status === 'pending'),
	};
}

/**
 * Returns the complete public case record and server-owned capabilities.
 *
 * @param {Record<string, unknown>} moderationCase Internal moderation case.
 * @returns {Record<string, unknown>} Public moderation case.
 */
function publicCase(moderationCase) {
	return {
		...clone(moderationCase),
		...caseSummary(moderationCase),
		capabilities: {
			canClaim: !moderationCase.assignment && moderationCase.status === 'needs_review',
			canNote: moderationCase.assignment?.id === REVIEWER.id && !['decided'].includes(moderationCase.status),
			canDecide: moderationCase.assignment?.id === REVIEWER.id && ['in_review', 'escalated'].includes(moderationCase.status),
			canReviewAppeal: moderationCase.assignment?.id === REVIEWER.id && moderationCase.status === 'appeal_pending' && moderationCase.appeal?.status === 'pending',
		},
	};
}

/**
 * Normalizes a first-review decision draft.
 *
 * @param {Record<string, unknown>} input Raw decision payload.
 * @returns {Record<string, unknown>} Normalized decision draft.
 */
function normalizeDecision(input) {
	return {
		action: String(input.action || ''),
		policyId: String(input.policyId || ''),
		rationale: String(input.rationale || '').trim(),
		notifyAuthor: input.notifyAuthor !== false,
		restrictThread: input.restrictThread === true,
	};
}

/**
 * Validates a first-review decision against case risk.
 *
 * @param {Record<string, unknown>} moderationCase Moderation case.
 * @param {Record<string, unknown>} draft Normalized decision draft.
 * @returns {Record<string, string[]>} Field errors.
 */
function validateDecision(moderationCase, draft) {
	const fields = {};
	if (!ACTION_OPTIONS.some((option) => option.value === draft.action)) fields.action = ['Choose a listed decision.'];
	if (!POLICY_OPTIONS.some((option) => option.value === draft.policyId)) fields.policyId = ['Choose a listed policy basis.'];
	if (draft.rationale.length < 20) fields.rationale = ['Explain the evidence and policy basis in at least 20 characters.'];
	if (draft.action === 'allow_content' && draft.policyId !== 'no_violation') fields.policyId = ['Allowing content requires No policy violation.'];
	if (draft.action && draft.action !== 'allow_content' && draft.policyId === 'no_violation') fields.policyId = ['Enforcement requires a policy violation.'];
	if (moderationCase.severity === 'critical' && !['remove_content', 'escalate'].includes(draft.action)) fields.action = ['Critical cases must be removed or escalated.'];
	return fields;
}

/**
 * Creates the exact first-review preview and consequence summary.
 *
 * @param {Record<string, unknown>} moderationCase Moderation case.
 * @param {Record<string, unknown>} draft Validated decision draft.
 * @returns {Record<string, unknown>} Immutable decision preview.
 */
function createDecisionPreview(moderationCase, draft) {
	const actionLabel = labelFor(ACTION_OPTIONS, draft.action);
	const policyLabel = labelFor(POLICY_OPTIONS, draft.policyId);
	const effects = decisionEffects(draft);
	const checksum = checksumFor([workspace.revision, moderationCase.id, moderationCase.version, draft.action, draft.policyId, draft.rationale, draft.notifyAuthor, draft.restrictThread].join('|'));
	return {
		id: nextId('preview'),
		caseVersion: moderationCase.version,
		workspaceRevision: workspace.revision,
		checksum,
		action: draft.action,
		actionLabel,
		policyId: draft.policyId,
		policyLabel,
		rationale: draft.rationale,
		notifyAuthor: draft.notifyAuthor,
		restrictThread: draft.restrictThread,
		requiresAcknowledgement: ['remove_content', 'restrict_content', 'escalate'].includes(draft.action),
		effects,
		qualityChecks: [
			{ label: 'Reviewer owns the case', passed: moderationCase.assignment?.id === REVIEWER.id },
			{ label: 'Policy basis selected', passed: draft.policyId !== '' },
			{ label: 'Rationale is audit-ready', passed: draft.rationale.length >= 20 },
			{ label: 'Critical-risk gate satisfied', passed: moderationCase.severity !== 'critical' || ['remove_content', 'escalate'].includes(draft.action) },
		],
		createdAt: nowIso(),
	};
}

/**
 * Returns human-readable effects for one enforcement draft.
 *
 * @param {Record<string, unknown>} draft Normalized decision draft.
 * @returns {Array<string>} Decision effects.
 */
function decisionEffects(draft) {
	const effects = {
		allow_content: ['Release the moderation hold', 'Restore normal distribution', 'Close grouped reports without enforcement'],
		warn_author: ['Keep the content visible', 'Record an author warning', 'Close grouped reports'],
		restrict_content: ['Keep the content available by direct link', 'Remove it from recommendations', 'Record an enforcement action'],
		remove_content: ['Remove the content from member view', 'Preserve evidence for appeal', 'Record an enforcement action'],
		escalate: ['Keep the temporary hold active', 'Route the case to a policy specialist', 'Preserve current reviewer evidence'],
	}[draft.action] || [];
	if (draft.restrictThread) effects.push('Lock new replies on the source thread');
	effects.push(draft.notifyAuthor ? 'Send the author a policy notice' : 'Do not send an author notice');
	return effects;
}

/**
 * Normalizes an appeal outcome draft.
 *
 * @param {Record<string, unknown>} input Raw appeal payload.
 * @returns {Record<string, unknown>} Normalized appeal decision.
 */
function normalizeAppealDecision(input) {
	return {
		action: String(input.action || ''),
		rationale: String(input.rationale || '').trim(),
	};
}

/**
 * Validates an appeal outcome draft.
 *
 * @param {Record<string, unknown>} draft Normalized appeal decision.
 * @returns {Record<string, string[]>} Field errors.
 */
function validateAppealDecision(draft) {
	const fields = {};
	if (!APPEAL_ACTION_OPTIONS.some((option) => option.value === draft.action)) fields.action = ['Choose a listed appeal outcome.'];
	if (draft.rationale.length < 20) fields.rationale = ['Explain why the second review changes or upholds enforcement.'];
	return fields;
}

/**
 * Creates an exact appeal preview with enforcement differences.
 *
 * @param {Record<string, unknown>} moderationCase Appeal case.
 * @param {Record<string, unknown>} draft Validated appeal draft.
 * @returns {Record<string, unknown>} Immutable appeal preview.
 */
function createAppealPreview(moderationCase, draft) {
	const actionLabel = labelFor(APPEAL_ACTION_OPTIONS, draft.action);
	const effects = {
		uphold: ['Keep the original removal', 'Notify the author that the appeal was not accepted', 'Close the appeal'],
		restore: ['Restore the comment', 'Reverse the removal in the enforcement record', 'Notify the author that the appeal succeeded'],
		modify: ['Restore the comment with limited distribution', 'Replace removal with a warning', 'Notify the author of the modified outcome'],
	}[draft.action] || [];
	return {
		id: nextId('appeal-preview'),
		appealVersion: moderationCase.appeal.version,
		caseVersion: moderationCase.version,
		workspaceRevision: workspace.revision,
		checksum: checksumFor([workspace.revision, moderationCase.id, moderationCase.version, moderationCase.appeal.version, draft.action, draft.rationale].join('|')),
		action: draft.action,
		actionLabel,
		rationale: draft.rationale,
		effects,
		qualityChecks: [
			{ label: 'Original decision preserved', passed: Boolean(moderationCase.decision?.auditReceipt) },
			{ label: 'Author appeal considered', passed: Boolean(moderationCase.appeal.reason) },
			{ label: 'Second-review rationale recorded', passed: draft.rationale.length >= 20 },
		],
		createdAt: nowIso(),
	};
}

/**
 * Checks exact workspace and case revisions before mutation.
 *
 * @param {Record<string, unknown>} moderationCase Moderation case.
 * @param {Record<string, unknown>} input Exact revision payload.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function exactCase(moderationCase, input) {
	if (Number(input.revision) !== workspace.revision) return conflict(`Workspace revision changed from ${input.revision} to ${workspace.revision}. Reload the queue.`);
	if (Number(input.caseVersion) !== moderationCase.version) return conflict(`Case version changed from ${input.caseVersion} to ${moderationCase.version}. Reload the case.`);
	return null;
}

/**
 * Checks exact workspace, case, and appeal versions before mutation.
 *
 * @param {Record<string, unknown>} moderationCase Appeal case.
 * @param {Record<string, unknown>} input Exact revision payload.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function exactAppeal(moderationCase, input) {
	const caseConflict = exactCase(moderationCase, input);
	if (caseConflict) return caseConflict;
	if (Number(input.appealVersion) !== moderationCase.appeal.version) return conflict(`Appeal version changed from ${input.appealVersion} to ${moderationCase.appeal.version}. Reload the appeal.`);
	if (moderationCase.appeal.status !== 'pending') return conflict('This appeal has already been resolved.');
	return null;
}

/**
 * Increments workspace and case revisions after a successful mutation.
 *
 * @param {Record<string, unknown>} moderationCase Updated case.
 * @returns {void}
 */
function bump(moderationCase) {
	workspace.revision += 1;
	moderationCase.version += 1;
}

/**
 * Finds a moderation case by stable identifier.
 *
 * @param {string} caseId Stable case identifier.
 * @returns {Record<string, unknown>|null} Matching case.
 */
function findCase(caseId) {
	return workspace.cases.find((item) => item.id === String(caseId || '')) || null;
}

/**
 * Finds the moderation case containing one appeal.
 *
 * @param {string} appealId Stable appeal identifier.
 * @returns {Record<string, unknown>|null} Matching case.
 */
function findAppealCase(appealId) {
	return workspace.cases.find((item) => item.appeal?.id === String(appealId || '')) || null;
}

/**
 * Resolves a label from one option catalog.
 *
 * @param {Array<Record<string, unknown>>} options Option catalog.
 * @param {string} value Option value.
 * @returns {string} Option label or original value.
 */
function labelFor(options, value) {
	return options.find((option) => option.value === value)?.label || value;
}

/**
 * Formats minutes as compact queue age copy.
 *
 * @param {number} minutes Age in minutes.
 * @returns {string} Compact age label.
 */
function ageLabel(minutes) {
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	const remaining = minutes % 60;
	return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

/**
 * Capitalizes one label fragment.
 *
 * @param {string} value Source value.
 * @returns {string} Capitalized label.
 */
function capitalize(value) {
	return value ? `${value[0].toUpperCase()}${value.slice(1)}` : '';
}

/**
 * Returns a deterministic timestamp for demo events.
 *
 * @returns {string} ISO timestamp.
 */
function nowIso() {
	return new Date(Date.UTC(2026, 7, 2, 10, 0, 0) + (workspace.sequence - 6100) * 1000).toISOString();
}

/**
 * Creates a deterministic identifier and advances the demo sequence.
 *
 * @param {string} prefix Identifier prefix.
 * @returns {string} Stable demo identifier.
 */
function nextId(prefix) {
	workspace.sequence += 1;
	return `${prefix}-${workspace.sequence}`;
}

/**
 * Creates a stable demo checksum.
 *
 * @param {string} value Checksum input.
 * @returns {string} Demo checksum.
 */
function checksumFor(value) {
	let hash = 2166136261;
	for (const character of value) {
		hash ^= character.charCodeAt(0);
		hash = Math.imul(hash, 16777619);
	}
	return `sha256:demo-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Clones JSON-compatible demo data.
 *
 * @param {unknown} value Value to clone.
 * @returns {unknown} Deep-cloned value.
 */
function clone(value) {
	if (value === undefined) return undefined;
	return JSON.parse(JSON.stringify(value));
}

/**
 * Creates a structured validation response.
 *
 * @param {string} message Validation message.
 * @param {Record<string, string[]>} fields Field errors.
 * @returns {Record<string, unknown>} Validation response.
 */
function validation(message, fields) {
	return { error: 'validation_failed', status: 422, message, fields };
}

/**
 * Creates a structured revision-conflict response.
 *
 * @param {string} message Conflict message.
 * @returns {Record<string, unknown>} Conflict response.
 */
function conflict(message) {
	return { error: 'revision_conflict', status: 409, message };
}

/**
 * Creates a structured not-found response.
 *
 * @param {string} resource Resource label.
 * @returns {Record<string, unknown>} Not-found response.
 */
function notFound(resource) {
	return { error: 'not_found', status: 404, message: `${resource} not found.` };
}

workspace = createWorkspace();
