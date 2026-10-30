const catalog = Object.freeze({
	views: [
		{ value: 'all', label: 'All feedback', description: 'Every active idea and customer signal.' },
		{ value: 'important', label: 'Important', description: 'Ideas with an important customer signal.' },
		{ value: 'enterprise', label: 'Enterprise', description: 'Feedback attached to enterprise accounts.' },
		{ value: 'stale', label: 'Needs follow-up', description: 'Active ideas without a recent product response.' },
	],
	statuses: [
		{ value: 'inbox', label: 'Inbox', description: 'New feedback awaiting product triage.', tone: 'neutral' },
		{ value: 'evaluating', label: 'Evaluating', description: 'The product team is gathering evidence.', tone: 'info' },
		{ value: 'planned', label: 'Planned', description: 'Accepted into a roadmap window.', tone: 'primary' },
		{ value: 'building', label: 'Building', description: 'Actively being implemented.', tone: 'warning' },
		{ value: 'shipped', label: 'Shipped', description: 'Delivered to customers.', tone: 'success' },
		{ value: 'declined', label: 'Declined', description: 'Closed with a recorded product decision.', tone: 'danger' },
	],
	publicStatuses: [
		{ value: 'open', label: 'Open', description: 'Visible without a public commitment.', tone: 'neutral' },
		{ value: 'under-review', label: 'Under review', description: 'Customers know the idea is being considered.', tone: 'info' },
		{ value: 'planned', label: 'Planned', description: 'Customers can see a roadmap commitment.', tone: 'primary' },
		{ value: 'in-progress', label: 'In progress', description: 'Customers can see active implementation.', tone: 'warning' },
		{ value: 'complete', label: 'Complete', description: 'Customers can see the delivered outcome.', tone: 'success' },
		{ value: 'closed', label: 'Closed', description: 'Customers can see that the idea will not proceed.', tone: 'danger' },
	],
	priorities: [
		{ value: 'low', label: 'Low', description: 'Useful signal without near-term urgency.', tone: 'neutral' },
		{ value: 'medium', label: 'Medium', description: 'Material demand to keep under review.', tone: 'info' },
		{ value: 'high', label: 'High', description: 'Strong customer impact or revenue evidence.', tone: 'warning' },
		{ value: 'critical', label: 'Critical', description: 'Immediate retention, compliance, or launch blocker.', tone: 'danger' },
	],
	owners: [
		{ value: 'usr_maya', label: 'Maya Chen', description: 'Product operations' },
		{ value: 'usr_lena', label: 'Lena Ortiz', description: 'Growth product' },
		{ value: 'usr_noah', label: 'Noah Williams', description: 'Platform product' },
		{ value: 'unassigned', label: 'Unassigned', description: 'Available for product triage' },
	],
	sources: [
		{ value: 'support', label: 'Support conversation', description: 'A customer request from the support desk.' },
		{ value: 'sales', label: 'Sales call', description: 'A request captured during a commercial conversation.' },
		{ value: 'research', label: 'Research session', description: 'Observed in structured product research.' },
		{ value: 'portal', label: 'Feedback portal', description: 'Submitted or voted on by a signed-in customer.' },
	],
	importance: [
		{ value: 'normal', label: 'Useful signal', description: 'A meaningful request without an explicit blocker.' },
		{ value: 'important', label: 'Important to customer', description: 'A committed need, blocker, or renewal concern.' },
	],
	visibility: [
		{ value: 'internal', label: 'Internal note', description: 'Visible only to the product and customer teams.' },
		{ value: 'public', label: 'Public response', description: 'Visible to portal users and eligible for notification.' },
	],
});

const currentOperator = Object.freeze({
	id: 'usr_maya',
	name: 'Maya Chen',
	initials: 'MC',
	role: 'Product operations lead',
});

let insightSequence = 8200;
let ideaSequence = 4100;
let eventSequence = 6300;
let receiptSequence = 9800;
let previewSequence = 3100;
let state = createInitialState();
const mergePreviews = new Map();

/**
 * Returns the complete feedback workspace with authoritative summary values.
 *
 * @returns {Record<string, unknown>} Feedback workspace payload.
 */
export function getFeedbackBoardWorkspace() {
	return serializeWorkspace();
}

/**
 * Captures one customer insight and either links it to an idea or creates a new idea.
 *
 * @param {Record<string, unknown>} input Insight form values and exact workspace revision.
 * @returns {Record<string, unknown>} Updated workspace or API error.
 */
export function createFeedbackInsight(input = {}) {
	const conflict = validateWorkspaceRevision(input);
	if (conflict) return conflict;

	const ideaId = normalizeText(input.ideaId, 80) || 'new';
	const source = normalizeText(input.source, 40);
	const importance = normalizeText(input.importance, 40);
	const customer = normalizeText(input.customer, 120);
	const contact = normalizeEmail(input.contact);
	const quote = normalizeText(input.quote, 1200);
	const title = normalizeText(input.title, 160);
	const arr = Number(input.arr || 0);
	const tier = normalizeText(input.tier, 40) || 'Growth';
	const fieldErrors = {};

	if (!catalog.sources.some((option) => option.value === source)) fieldErrors.source = ['Choose where this feedback came from.'];
	if (!catalog.importance.some((option) => option.value === importance)) fieldErrors.importance = ['Choose the customer importance.'];
	if (customer.length < 2) fieldErrors.customer = ['Enter the customer or account name.'];
	if (!contact || !contact.includes('@')) fieldErrors.contact = ['Enter a valid customer email address.'];
	if (quote.length < 16) fieldErrors.quote = ['Capture at least 16 characters of customer context.'];
	if (!Number.isFinite(arr) || arr < 0 || arr > 10000000) fieldErrors.arr = ['Enter annual revenue between 0 and 10,000,000.'];
	if (ideaId === 'new' && title.length < 6) fieldErrors.title = ['Give the new idea a title of at least 6 characters.'];
	if (ideaId !== 'new' && !findIdea(ideaId)) fieldErrors.ideaId = ['Choose an available idea or create a new one.'];
	if (Object.keys(fieldErrors).length) return validationError(fieldErrors);

	let idea = findIdea(ideaId);
	if (!idea) {
		ideaSequence += 1;
		idea = {
			id: `idea_${ideaSequence}`,
			version: 1,
			title,
			summary: quote,
			topic: 'New feedback',
			status: 'inbox',
			publicStatus: 'open',
			priority: importance === 'important' ? 'high' : 'medium',
			ownerId: 'unassigned',
			createdAt: new Date().toISOString(),
			lastActivityAt: new Date().toISOString(),
			lastActivityLabel: 'Just now',
			trend: '+1 today',
			staleDays: 0,
			linkedWork: null,
			tags: ['Untriaged'],
			insights: [],
			responses: [],
			mergeHistory: [],
		};
		state.ideas.unshift(idea);
	}

	insightSequence += 1;
	const insight = {
		id: `insight_${insightSequence}`,
		customer,
		contact,
		tier,
		arr: Math.round(arr),
		source,
		sourceLabel: optionLabel(catalog.sources, source),
		quote,
		importance,
		important: importance === 'important',
		createdAt: new Date().toISOString(),
		time: 'Just now',
		createdBy: currentOperator.name,
	};
	idea.insights.unshift(insight);
	idea.version += 1;
	idea.lastActivityAt = insight.createdAt;
	idea.lastActivityLabel = 'Just now';
	idea.trend = `+${Math.max(1, idea.insights.filter((candidate) => candidate.time.includes('today') || candidate.time === 'Just now').length)} today`;
	appendEvent('Captured customer feedback', `${customer} · ${idea.title}`, 'success');
	touchWorkspace();

	return {
		...serializeWorkspace(),
		selectedIdeaId: idea.id,
		insight: cloneValue(insight),
		receipt: createReceipt('feedback.insight-captured', insight.id),
	};
}

/**
 * Updates the decision fields for one idea at an exact workspace and record version.
 *
 * @param {string} ideaId Idea identifier.
 * @param {Record<string, unknown>} input Decision values and optimistic revisions.
 * @returns {Record<string, unknown>} Updated workspace or API error.
 */
export function updateFeedbackIdea(ideaId, input = {}) {
	const idea = findIdea(ideaId);
	if (!idea) return { error: 'Feedback idea not found.', status: 404 };
	const conflict = validateIdeaMutation(idea, input);
	if (conflict) return conflict;

	const status = normalizeText(input.status, 40);
	const publicStatus = normalizeText(input.publicStatus, 40);
	const priority = normalizeText(input.priority, 40);
	const ownerId = normalizeText(input.ownerId, 80);
	const rationale = normalizeText(input.rationale, 1200);
	const fieldErrors = {};

	if (!catalog.statuses.some((option) => option.value === status)) fieldErrors.status = ['Choose an internal product status.'];
	if (!catalog.publicStatuses.some((option) => option.value === publicStatus)) fieldErrors.publicStatus = ['Choose a public status.'];
	if (!catalog.priorities.some((option) => option.value === priority)) fieldErrors.priority = ['Choose a product priority.'];
	if (!catalog.owners.some((option) => option.value === ownerId)) fieldErrors.ownerId = ['Choose an accountable owner.'];
	if (rationale.length < 18) fieldErrors.rationale = ['Record at least 18 characters explaining the product decision.'];
	if (status === 'planned' && !['planned', 'in-progress'].includes(publicStatus)) fieldErrors.publicStatus = ['Planned ideas must be visible as Planned or In progress.'];
	if (status === 'building' && publicStatus !== 'in-progress') fieldErrors.publicStatus = ['Building ideas must be public as In progress.'];
	if (status === 'shipped' && publicStatus !== 'complete') fieldErrors.publicStatus = ['Shipped ideas must be public as Complete.'];
	if (status === 'declined' && publicStatus !== 'closed') fieldErrors.publicStatus = ['Declined ideas must be public as Closed.'];
	if (['planned', 'building', 'shipped'].includes(status) && ownerId === 'unassigned') fieldErrors.ownerId = ['Committed work needs an accountable owner.'];
	if (Object.keys(fieldErrors).length) return validationError(fieldErrors);

	const previous = {
		status: idea.status,
		publicStatus: idea.publicStatus,
		priority: idea.priority,
		ownerId: idea.ownerId,
	};
	idea.status = status;
	idea.publicStatus = publicStatus;
	idea.priority = priority;
	idea.ownerId = ownerId;
	idea.version += 1;
	idea.lastActivityAt = new Date().toISOString();
	idea.lastActivityLabel = 'Just now';
	idea.responses.unshift({
		id: `decision_${idea.version}`,
		visibility: 'internal',
		message: rationale,
		actor: currentOperator.name,
		time: 'Just now',
		kind: 'decision',
	});
	appendEvent('Updated product decision', `${idea.title} · ${optionLabel(catalog.statuses, status)}`, 'info');
	touchWorkspace();

	return {
		...serializeWorkspace(),
		selectedIdeaId: idea.id,
		receipt: createReceipt('feedback.decision-updated', idea.id, { previous, next: { status, publicStatus, priority, ownerId } }),
	};
}

/**
 * Adds an internal note or public response and returns notification delivery evidence.
 *
 * @param {string} ideaId Idea identifier.
 * @param {Record<string, unknown>} input Response values and optimistic revisions.
 * @returns {Record<string, unknown>} Updated workspace or API error.
 */
export function createFeedbackResponse(ideaId, input = {}) {
	const idea = findIdea(ideaId);
	if (!idea) return { error: 'Feedback idea not found.', status: 404 };
	const conflict = validateIdeaMutation(idea, input);
	if (conflict) return conflict;

	const visibility = normalizeText(input.visibility, 40);
	const message = normalizeText(input.message, 2000);
	const notify = input.notify === true;
	const fieldErrors = {};

	if (!catalog.visibility.some((option) => option.value === visibility)) fieldErrors.visibility = ['Choose whether this is internal or public.'];
	if (message.length < 16) fieldErrors.message = ['Write at least 16 characters so the update has useful context.'];
	if (visibility === 'internal' && notify) fieldErrors.notify = ['Internal notes cannot notify customers.'];
	if (Object.keys(fieldErrors).length) return validationError(fieldErrors);

	const response = {
		id: `response_${idea.id}_${idea.version + 1}`,
		visibility,
		message,
		actor: currentOperator.name,
		time: 'Just now',
		kind: visibility === 'public' ? 'customer-update' : 'note',
		notification: visibility === 'public' && notify ? {
			status: 'delivered',
			recipients: uniqueContacts(idea.insights).length,
			receipt: createReceipt('feedback.customer-notified', idea.id),
		} : null,
	};
	idea.responses.unshift(response);
	idea.version += 1;
	idea.lastActivityAt = new Date().toISOString();
	idea.lastActivityLabel = 'Just now';
	appendEvent(visibility === 'public' ? 'Published customer response' : 'Added internal note', idea.title, visibility === 'public' ? 'success' : 'neutral');
	touchWorkspace();

	return {
		...serializeWorkspace(),
		selectedIdeaId: idea.id,
		response: cloneValue(response),
		receipt: createReceipt('feedback.response-created', response.id),
	};
}

/**
 * Creates an immutable preview for combining a duplicate idea into the selected idea.
 *
 * @param {string} ideaId Destination idea identifier.
 * @param {Record<string, unknown>} input Duplicate identifier and optimistic revisions.
 * @returns {Record<string, unknown>} Merge preview or API error.
 */
export function previewFeedbackMerge(ideaId, input = {}) {
	const idea = findIdea(ideaId);
	if (!idea) return { error: 'Feedback idea not found.', status: 404 };
	const conflict = validateIdeaMutation(idea, input);
	if (conflict) return conflict;

	const duplicate = findIdea(normalizeText(input.duplicateId, 80));
	if (!duplicate || duplicate.id === idea.id) return validationError({ duplicateId: ['Choose a different idea to merge.'] });

	previewSequence += 1;
	const preview = {
		id: `merge_preview_${previewSequence}`,
		destinationId: idea.id,
		destinationVersion: idea.version,
		duplicateId: duplicate.id,
		duplicateVersion: duplicate.version,
		workspaceRevision: state.revision,
		destinationTitle: idea.title,
		duplicateTitle: duplicate.title,
		insightsMoved: duplicate.insights.length,
		responsesMoved: duplicate.responses.length,
		combinedCustomers: uniqueCustomers([...idea.insights, ...duplicate.insights]).length,
		combinedRevenue: totalRevenue([...idea.insights, ...duplicate.insights]),
		createdAt: new Date().toISOString(),
	};
	mergePreviews.set(preview.id, preview);
	return { preview: cloneValue(preview) };
}

/**
 * Commits one exact merge preview and retains a merge receipt on the destination idea.
 *
 * @param {string} ideaId Destination idea identifier.
 * @param {Record<string, unknown>} input Preview acknowledgement and optimistic revisions.
 * @returns {Record<string, unknown>} Updated workspace or API error.
 */
export function commitFeedbackMerge(ideaId, input = {}) {
	const idea = findIdea(ideaId);
	if (!idea) return { error: 'Feedback idea not found.', status: 404 };
	const preview = mergePreviews.get(normalizeText(input.previewId, 100));
	if (!preview || preview.destinationId !== idea.id) return { error: 'Create a fresh merge preview before combining ideas.', status: 409 };
	const duplicate = findIdea(preview.duplicateId);
	if (!duplicate) return { error: 'The duplicate idea is no longer available.', status: 409, conflict: true };
	if (input.acknowledged !== true) return validationError({ acknowledged: ['Confirm that the duplicate idea will be removed from the active board.'] });
	if (preview.workspaceRevision !== state.revision || preview.destinationVersion !== idea.version || preview.duplicateVersion !== duplicate.version) {
		return { error: 'This merge preview is stale. Review both ideas again before merging.', status: 409, conflict: true };
	}

	const receipt = createReceipt('feedback.ideas-merged', idea.id, { duplicateId: duplicate.id });
	idea.insights = [...duplicate.insights, ...idea.insights];
	idea.responses = [...duplicate.responses, ...idea.responses];
	idea.tags = [...new Set([...idea.tags, ...duplicate.tags])];
	idea.version += 1;
	idea.lastActivityAt = new Date().toISOString();
	idea.lastActivityLabel = 'Just now';
	idea.mergeHistory.unshift({
		id: receipt.id,
		title: duplicate.title,
		insightsMoved: duplicate.insights.length,
		actor: currentOperator.name,
		time: 'Just now',
	});
	state.ideas = state.ideas.filter((candidate) => candidate.id !== duplicate.id);
	mergePreviews.delete(preview.id);
	appendEvent('Merged duplicate feedback', `${duplicate.title} → ${idea.title}`, 'warning');
	touchWorkspace();

	return { ...serializeWorkspace(), selectedIdeaId: idea.id, receipt };
}

/**
 * Restores the deterministic feedback workspace for another demo run.
 *
 * @returns {Record<string, unknown>} Reset feedback workspace.
 */
export function resetFeedbackBoardWorkspace() {
	state = createInitialState();
	mergePreviews.clear();
	return serializeWorkspace();
}

/**
 * Creates the deterministic feedback workspace seed.
 *
 * @returns {Record<string, unknown>} Initial mutable state.
 */
function createInitialState() {
	return {
		revision: 12,
		updatedAt: '2026-08-02T08:42:00.000Z',
		board: {
			id: 'board_product-feedback',
			name: 'Product feedback',
			description: 'Customer evidence connected to product decisions.',
			portalUrl: 'feedback.acme.test',
		},
		ideas: createIdeaSeeds(),
		events: [
			{ id: 'event_6300', label: 'Linked enterprise insight', detail: 'Zephyr Health · Export audit logs to CSV', actor: 'CRM sync', time: '18 minutes ago', tone: 'info' },
			{ id: 'event_6299', label: 'Published status update', detail: 'Bulk invite from CSV · Planned', actor: 'Lena Ortiz', time: 'Yesterday', tone: 'success' },
			{ id: 'event_6298', label: 'Flagged important request', detail: 'Northstar Finance · Slack SLA alerts', actor: 'Sam Rivera', time: 'Jul 31', tone: 'warning' },
		],
	};
}

/**
 * Returns realistic product ideas and their attached customer evidence.
 *
 * @returns {Array<Record<string, unknown>>} Seed idea records.
 */
function createIdeaSeeds() {
	return [
		{
			id: 'idea_audit_exports', version: 8, title: 'Export audit logs to CSV', summary: 'Security admins need portable audit evidence for vendor reviews, access checks, and compliance submissions.', topic: 'Compliance', status: 'evaluating', publicStatus: 'under-review', priority: 'high', ownerId: 'usr_maya', createdAt: '2026-06-10T10:20:00.000Z', lastActivityAt: '2026-08-02T08:24:00.000Z', lastActivityLabel: '18m', trend: '+3 this week', staleDays: 0, linkedWork: { key: 'SEC-218', label: 'Audit export service', state: 'Discovery' }, tags: ['Compliance', 'Admin'],
			insights: [
				{ id: 'insight_8199', customer: 'Zephyr Health', contact: 'elena@zephyr.test', tier: 'Enterprise', arr: 92000, source: 'sales', sourceLabel: 'Sales call', quote: 'Our quarterly access review is still a manual copy-and-paste exercise. CSV would remove two days of work.', importance: 'important', important: true, createdAt: '2026-08-02T08:24:00.000Z', time: '18m', createdBy: 'Sam Rivera' },
				{ id: 'insight_8178', customer: 'Arcadia Health', contact: 'maya@arcadia.test', tier: 'Enterprise', arr: 76000, source: 'support', sourceLabel: 'Support conversation', quote: 'The security team cannot complete its vendor review without a portable log of workspace changes.', importance: 'important', important: true, createdAt: '2026-07-30T13:40:00.000Z', time: '3d', createdBy: 'Support sync' },
				{ id: 'insight_8124', customer: 'Northstar Labs', contact: 'jo@northstar.test', tier: 'Scale', arr: 48000, source: 'research', sourceLabel: 'Research session', quote: 'We need to filter by actor and date, then download exactly what is on screen.', importance: 'normal', important: false, createdAt: '2026-07-22T09:30:00.000Z', time: 'Jul 22', createdBy: 'Maya Chen' },
				{ id: 'insight_8061', customer: 'Harbor Retail', contact: 'ops@harbor.test', tier: 'Growth', arr: 34000, source: 'portal', sourceLabel: 'Feedback portal', quote: 'Please include IP address and event type columns in the export.', importance: 'normal', important: false, createdAt: '2026-07-11T15:20:00.000Z', time: 'Jul 11', createdBy: 'Portal' },
				{ id: 'insight_8018', customer: 'Brightdesk', contact: 'security@brightdesk.test', tier: 'Trial', arr: 0, source: 'sales', sourceLabel: 'Sales call', quote: 'Audit export is part of our security sign-off before the pilot can expand.', importance: 'important', important: true, createdAt: '2026-06-28T11:00:00.000Z', time: 'Jun 28', createdBy: 'Lena Ortiz' },
			],
			responses: [
				{ id: 'response_audit_1', visibility: 'public', message: 'We are validating export fields, permissions, and retention requirements with compliance-heavy teams.', actor: 'Maya Chen', time: 'Jul 30', kind: 'customer-update', notification: { status: 'delivered', recipients: 5, receipt: { id: 'receipt_9772', event: 'feedback.customer-notified' } } },
				{ id: 'decision_audit_1', visibility: 'internal', message: 'Keep this in discovery until field-level permissions are agreed with Security.', actor: 'Maya Chen', time: 'Jul 24', kind: 'decision' },
			],
			mergeHistory: [],
		},
		{
			id: 'idea_bulk_invites', version: 6, title: 'Bulk invite teammates from CSV', summary: 'Workspace owners want to onboard a department without entering each teammate individually.', topic: 'Workspace', status: 'planned', publicStatus: 'planned', priority: 'medium', ownerId: 'usr_lena', createdAt: '2026-05-14T09:00:00.000Z', lastActivityAt: '2026-08-01T15:05:00.000Z', lastActivityLabel: 'Yesterday', trend: '+8 this month', staleDays: 1, linkedWork: { key: 'GRO-94', label: 'Bulk workspace onboarding', state: 'Planned' }, tags: ['Onboarding', 'Growth'],
			insights: [
				{ id: 'insight_8180', customer: 'Blackbird Media', contact: 'it@blackbird.test', tier: 'Scale', arr: 44000, source: 'support', sourceLabel: 'Support conversation', quote: 'Inviting 65 editors individually made the rollout feel much less enterprise-ready.', importance: 'important', important: true, createdAt: '2026-08-01T15:05:00.000Z', time: 'Yesterday', createdBy: 'Support sync' },
				{ id: 'insight_8103', customer: 'Fieldstone', contact: 'ops@fieldstone.test', tier: 'Growth', arr: 28000, source: 'research', sourceLabel: 'Research session', quote: 'Let us map email, name, team, and role before confirming the import.', importance: 'normal', important: false, createdAt: '2026-07-19T12:00:00.000Z', time: 'Jul 19', createdBy: 'Lena Ortiz' },
				{ id: 'insight_8032', customer: 'Atlas Retail', contact: 'jordan@atlas.test', tier: 'Enterprise', arr: 54000, source: 'sales', sourceLabel: 'Sales call', quote: 'A CSV import is the only realistic way to roll out across 14 regional teams.', importance: 'important', important: true, createdAt: '2026-07-03T10:20:00.000Z', time: 'Jul 3', createdBy: 'Sam Rivera' },
			],
			responses: [{ id: 'response_bulk_1', visibility: 'public', message: 'Bulk invitations are planned with column mapping, validation, and a review step before delivery.', actor: 'Lena Ortiz', time: 'Yesterday', kind: 'customer-update', notification: { status: 'delivered', recipients: 3, receipt: { id: 'receipt_9760', event: 'feedback.customer-notified' } } }],
			mergeHistory: [],
		},
		{
			id: 'idea_sla_slack', version: 4, title: 'SLA breach alerts in Slack', summary: 'Support leaders need an early warning before response targets are missed for priority customers.', topic: 'Support', status: 'inbox', publicStatus: 'open', priority: 'high', ownerId: 'unassigned', createdAt: '2026-07-05T14:30:00.000Z', lastActivityAt: '2026-07-31T08:50:00.000Z', lastActivityLabel: '2d', trend: '+4 this week', staleDays: 2, linkedWork: null, tags: ['Alerts', 'Support'],
			insights: [
				{ id: 'insight_8171', customer: 'Northstar Finance', contact: 'priya@northstar.test', tier: 'Enterprise', arr: 76000, source: 'support', sourceLabel: 'Support conversation', quote: 'We learned about a missed P1 target in the weekly report. The team needs a warning while there is still time to act.', importance: 'important', important: true, createdAt: '2026-07-31T08:50:00.000Z', time: '2d', createdBy: 'Sam Rivera' },
				{ id: 'insight_8092', customer: 'Kiteworks', contact: 'service@kiteworks.test', tier: 'Scale', arr: 39000, source: 'portal', sourceLabel: 'Feedback portal', quote: 'A channel-level alert with owner and remaining time would prevent constant dashboard checking.', importance: 'normal', important: false, createdAt: '2026-07-16T09:10:00.000Z', time: 'Jul 16', createdBy: 'Portal' },
			],
			responses: [], mergeHistory: [],
		},
		{
			id: 'idea_custom_roles', version: 3, title: 'Custom workspace role templates', summary: 'Larger accounts want repeatable permission sets for finance, support, and contractors.', topic: 'Permissions', status: 'evaluating', publicStatus: 'under-review', priority: 'medium', ownerId: 'usr_noah', createdAt: '2026-06-18T10:00:00.000Z', lastActivityAt: '2026-07-12T10:20:00.000Z', lastActivityLabel: '3w', trend: '+2 this month', staleDays: 21, linkedWork: { key: 'PLT-73', label: 'Role policy model', state: 'Research' }, tags: ['Permissions', 'Enterprise'],
			insights: [
				{ id: 'insight_8048', customer: 'Mercury Travel', contact: 'admin@mercury.test', tier: 'Enterprise', arr: 118000, source: 'sales', sourceLabel: 'Sales call', quote: 'Contractors should reuse an approved role instead of rebuilding permissions each time.', importance: 'important', important: true, createdAt: '2026-07-12T10:20:00.000Z', time: 'Jul 12', createdBy: 'Sam Rivera' },
				{ id: 'insight_8004', customer: 'Paper Street', contact: 'finance@paperstreet.test', tier: 'Growth', arr: 22000, source: 'research', sourceLabel: 'Research session', quote: 'Our finance role needs billing and exports, but no workspace administration.', importance: 'normal', important: false, createdAt: '2026-06-20T11:00:00.000Z', time: 'Jun 20', createdBy: 'Maya Chen' },
			],
			responses: [{ id: 'decision_roles_1', visibility: 'internal', message: 'Validate whether templates or composable permission policies solve the broader need.', actor: 'Noah Williams', time: 'Jul 12', kind: 'decision' }], mergeHistory: [],
		},
		{
			id: 'idea_audit_download', version: 2, title: 'Download workspace activity as CSV', summary: 'A likely duplicate of audit log exports captured through the public portal.', topic: 'Compliance', status: 'inbox', publicStatus: 'open', priority: 'low', ownerId: 'unassigned', createdAt: '2026-07-28T16:40:00.000Z', lastActivityAt: '2026-07-28T16:40:00.000Z', lastActivityLabel: '5d', trend: '+1 this week', staleDays: 5, linkedWork: null, tags: ['Possible duplicate'],
			insights: [{ id: 'insight_8160', customer: 'Orchid Labs', contact: 'admin@orchid.test', tier: 'Growth', arr: 18000, source: 'portal', sourceLabel: 'Feedback portal', quote: 'Can I download workspace activity into a spreadsheet for our monthly review?', importance: 'normal', important: false, createdAt: '2026-07-28T16:40:00.000Z', time: '5d', createdBy: 'Portal' }],
			responses: [], mergeHistory: [],
		},
	];
}

/**
 * Serializes the current state and calculates board-level product signals.
 *
 * @returns {Record<string, unknown>} Public workspace response.
 */
function serializeWorkspace() {
	const ideas = state.ideas.map(serializeIdea);
	const allInsights = state.ideas.flatMap((idea) => idea.insights);
	return {
		revision: state.revision,
		updatedAt: state.updatedAt,
		board: cloneValue(state.board),
		currentOperator: cloneValue(currentOperator),
		catalog: cloneValue(catalog),
		summary: {
			activeIdeas: state.ideas.filter((idea) => !['shipped', 'declined'].includes(idea.status)).length,
			customerSignals: allInsights.length,
			importantSignals: allInsights.filter((insight) => insight.important).length,
			influencedRevenue: totalRevenue(allInsights),
			needsFollowUp: state.ideas.filter((idea) => idea.staleDays >= 14).length,
		},
		ideas,
		events: cloneValue(state.events),
	};
}

/**
 * Enriches one idea with calculated customer and revenue evidence.
 *
 * @param {Record<string, unknown>} idea Mutable idea record.
 * @returns {Record<string, unknown>} Serialized idea.
 */
function serializeIdea(idea) {
	return {
		...cloneValue(idea),
		customerCount: uniqueCustomers(idea.insights).length,
		contactCount: uniqueContacts(idea.insights).length,
		influencedRevenue: totalRevenue(idea.insights),
		importantCount: idea.insights.filter((insight) => insight.important).length,
		owner: optionLabel(catalog.owners, idea.ownerId),
		statusLabel: optionLabel(catalog.statuses, idea.status),
		publicStatusLabel: optionLabel(catalog.publicStatuses, idea.publicStatus),
		priorityLabel: optionLabel(catalog.priorities, idea.priority),
		capabilities: {
			canDecide: true,
			canRespond: true,
			canMerge: state.ideas.length > 1,
		},
	};
}

/**
 * Validates one mutation against the current workspace revision.
 *
 * @param {Record<string, unknown>} input Mutation input.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function validateWorkspaceRevision(input) {
	if (Number(input.revision) !== state.revision) {
		return { error: 'The feedback board changed since it was loaded. Review the latest workspace and try again.', status: 409, conflict: true, revision: state.revision };
	}
	return null;
}

/**
 * Validates workspace and idea versions for one optimistic mutation.
 *
 * @param {Record<string, unknown>} idea Mutable idea record.
 * @param {Record<string, unknown>} input Mutation input.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function validateIdeaMutation(idea, input) {
	const workspaceConflict = validateWorkspaceRevision(input);
	if (workspaceConflict) return workspaceConflict;
	if (Number(input.ideaVersion) !== idea.version) {
		return { error: 'This idea changed while you were reviewing it. Reload its latest evidence before saving.', status: 409, conflict: true, ideaVersion: idea.version };
	}
	return null;
}

/**
 * Finds one mutable idea by identifier.
 *
 * @param {string} ideaId Idea identifier.
 * @returns {Record<string, unknown>|null} Matching idea or null.
 */
function findIdea(ideaId) {
	return state.ideas.find((idea) => idea.id === ideaId) || null;
}

/**
 * Appends one compact board activity event.
 *
 * @param {string} label Event label.
 * @param {string} detail Event detail.
 * @param {string} tone Semantic event tone.
 * @returns {void}
 */
function appendEvent(label, detail, tone) {
	eventSequence += 1;
	state.events.unshift({ id: `event_${eventSequence}`, label, detail, actor: currentOperator.name, time: 'Just now', tone });
	state.events = state.events.slice(0, 8);
}

/**
 * Increments the workspace revision and update timestamp.
 *
 * @returns {void}
 */
function touchWorkspace() {
	state.revision += 1;
	state.updatedAt = new Date().toISOString();
}

/**
 * Creates a provider-style immutable action receipt.
 *
 * @param {string} event Stable receipt event.
 * @param {string} subjectId Receipt subject identifier.
 * @param {Record<string, unknown>} [details] Optional receipt detail.
 * @returns {Record<string, unknown>} Receipt payload.
 */
function createReceipt(event, subjectId, details = {}) {
	receiptSequence += 1;
	return { id: `receipt_${receiptSequence}`, event, subjectId, actor: currentOperator.name, createdAt: new Date().toISOString(), ...cloneValue(details) };
}

/**
 * Creates a consistent field-validation API response.
 *
 * @param {Record<string, string[]>} fieldErrors Field-specific messages.
 * @returns {Record<string, unknown>} Validation response.
 */
function validationError(fieldErrors) {
	return { error: 'Review the highlighted feedback fields.', status: 422, fieldErrors };
}

/**
 * Returns unique customer names from a set of insights.
 *
 * @param {Array<Record<string, unknown>>} insights Customer insights.
 * @returns {string[]} Unique customer names.
 */
function uniqueCustomers(insights) {
	return [...new Set(insights.map((insight) => String(insight.customer)))];
}

/**
 * Returns unique customer contacts from a set of insights.
 *
 * @param {Array<Record<string, unknown>>} insights Customer insights.
 * @returns {string[]} Unique email contacts.
 */
function uniqueContacts(insights) {
	return [...new Set(insights.map((insight) => String(insight.contact)).filter(Boolean))];
}

/**
 * Sums influenced annual revenue without double-counting a customer.
 *
 * @param {Array<Record<string, unknown>>} insights Customer insights.
 * @returns {number} Unique-customer revenue total.
 */
function totalRevenue(insights) {
	const values = new Map();
	insights.forEach((insight) => values.set(String(insight.customer), Math.max(values.get(String(insight.customer)) || 0, Number(insight.arr || 0))));
	return [...values.values()].reduce((total, value) => total + value, 0);
}

/**
 * Looks up a human label in a value-label option catalog.
 *
 * @param {Array<Record<string, unknown>>} options Option records.
 * @param {string} value Selected value.
 * @returns {string} Matching label or raw value.
 */
function optionLabel(options, value) {
	return options.find((option) => option.value === value)?.label || value;
}

/**
 * Normalizes arbitrary text into a bounded single value.
 *
 * @param {unknown} value Input value.
 * @param {number} maxLength Maximum result length.
 * @returns {string} Normalized text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

/**
 * Normalizes one email address for identity comparison.
 *
 * @param {unknown} value Email input.
 * @returns {string} Lowercase email address.
 */
function normalizeEmail(value) {
	return normalizeText(value, 180).toLowerCase();
}

/**
 * Creates a JSON-safe copy of one value.
 *
 * @template T
 * @param {T} value Source value.
 * @returns {T} Cloned value.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}
