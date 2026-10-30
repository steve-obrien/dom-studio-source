const currentOperator = {
	id: 'usr_maya',
	name: 'Maya Chen',
	initials: 'MC',
	role: 'Strategic customer success manager',
	permissions: ['activity:read', 'activity:review', 'task:create', 'task:update', 'note:create', 'update:send'],
};

const ownerCatalog = [
	{ value: 'usr_maya', label: 'Maya Chen', description: 'Strategic customer success manager' },
	{ value: 'usr_sam', label: 'Sam Rivera', description: 'Enterprise customer success manager' },
	{ value: 'usr_lena', label: 'Lena Ortiz', description: 'Healthcare customer success manager' },
];

const priorityCatalog = [
	{ value: 'urgent', label: 'Urgent', description: 'Act before the next customer or renewal milestone.' },
	{ value: 'high', label: 'High', description: 'Schedule within two business days.' },
	{ value: 'normal', label: 'Normal', description: 'Add to the account owner queue.' },
];

const channelCatalog = [
	{ value: 'email', label: 'Email', description: 'Send through the connected customer-success mailbox.' },
	{ value: 'crm', label: 'CRM note', description: 'Publish the update to the shared account timeline.' },
];

const typeCatalog = [
	{ value: 'all', label: 'All activity', description: 'Product, support, revenue, lifecycle, and team work.' },
	{ value: 'support', label: 'Support', description: 'Tickets, escalations, and incident recovery.' },
	{ value: 'product', label: 'Product', description: 'Usage, adoption, and expansion signals.' },
	{ value: 'revenue', label: 'Revenue', description: 'Renewal, billing, and commercial movement.' },
	{ value: 'lifecycle', label: 'Lifecycle', description: 'Customer messaging and relationship events.' },
	{ value: 'work', label: 'Team work', description: 'Tasks, notes, reviews, and outbound updates.' },
];

const accountSeeds = [
	{
		id: 'acct_northstar',
		version: 9,
		name: 'Northstar Labs',
		initials: 'NL',
		segment: 'Scale',
		ownerId: 'usr_maya',
		owner: 'Maya Chen',
		champion: 'Priya Shah, VP Finance',
		arr: 148000,
		renewalDate: '2026-09-18',
		daysToRenewal: 47,
		healthScore: 82,
		status: 'healthy',
		lastTouch: 'Today · 14:24',
		openRiskCount: 1,
	},
	{
		id: 'acct_atlas',
		version: 6,
		name: 'Atlas Retail Group',
		initials: 'AR',
		segment: 'Enterprise',
		ownerId: 'usr_sam',
		owner: 'Sam Rivera',
		champion: 'Jordan Lee, CIO',
		arr: 221000,
		renewalDate: '2026-08-22',
		daysToRenewal: 20,
		healthScore: 54,
		status: 'at-risk',
		lastTouch: 'Yesterday · 10:05',
		openRiskCount: 2,
	},
	{
		id: 'acct_zephyr',
		version: 7,
		name: 'Zephyr Health',
		initials: 'ZH',
		segment: 'Enterprise',
		ownerId: 'usr_lena',
		owner: 'Lena Ortiz',
		champion: 'Elena Ruiz, VP Operations',
		arr: 184000,
		renewalDate: '2026-10-03',
		daysToRenewal: 62,
		healthScore: 73,
		status: 'monitoring',
		lastTouch: '2 days ago',
		openRiskCount: 1,
	},
];

const eventSeeds = [
	createSeedEvent({
		id: 'evt_1802', accountId: 'acct_northstar', version: 3, type: 'support', importance: 'high', occurredAt: '2026-08-02T14:24:00.000Z', displayTime: 'Today · 14:24', source: 'Zendesk', sourceFreshness: 'Synced 2 minutes ago', title: 'Export timeout escalated', summary: 'Two enterprise workspaces failed large exports before the Friday stakeholder call.', impact: 'Renewal confidence could decline unless support publishes an owner and recovery ETA.', actor: 'Ari Patel · Support lead', receipt: 'zd_evt_4821_06', metadata: [{ label: 'Ticket', value: 'SUP-4821' }, { label: 'Workspace', value: 'Northstar EU' }, { label: 'SLA', value: '4h remaining' }], rawData: { object: 'ticket.updated', ticket_id: 'SUP-4821', priority: 'urgent', status: 'escalated', affected_workspaces: 2, delivery: { status: 'delivered', attempt: 1, http_status: 200 } }, allowedActions: ['review', 'task', 'update'],
	}),
	createSeedEvent({
		id: 'evt_1789', accountId: 'acct_northstar', version: 1, type: 'product', importance: 'positive', occurredAt: '2026-08-02T11:10:00.000Z', displayTime: 'Today · 11:10', source: 'Product analytics', sourceFreshness: 'Synced 8 minutes ago', title: 'Forecast report adoption jumped', summary: 'Nine finance managers opened the weekly forecast report 42 times.', impact: 'A credible expansion signal for the analytics add-on.', actor: 'Northstar finance workspace', receipt: 'usage_evt_1789', metadata: [{ label: 'Feature', value: 'Forecast reports' }, { label: 'Active users', value: '+18%' }, { label: 'Teams', value: 'Finance, RevOps' }], rawData: { object: 'feature.activity', feature_key: 'forecast_reports', active_users: 9, weekly_opens: 42, change_percent: 18 }, allowedActions: ['review', 'task', 'update'],
	}),
	createSeedEvent({
		id: 'evt_1772', accountId: 'acct_northstar', version: 2, type: 'revenue', importance: 'medium', occurredAt: '2026-08-02T09:18:00.000Z', displayTime: 'Today · 09:18', source: 'Salesforce', sourceFreshness: 'Synced 14 minutes ago', title: 'Procurement opened renewal quote', summary: 'The annual quote was viewed twice and the security addendum was downloaded.', impact: 'Commercial review is active; confirm budget timing with the champion.', actor: 'Northstar procurement', receipt: 'sf_evt_REN_2048', metadata: [{ label: 'Opportunity', value: 'REN-2048' }, { label: 'Stage', value: 'Legal review' }, { label: 'Close date', value: '18 Sep' }], rawData: { object: 'opportunity.updated', opportunity_id: 'REN-2048', stage: 'legal_review', quote_views: 2, addendum_downloaded: true }, allowedActions: ['review', 'task', 'update'],
	}),
	createSeedEvent({
		id: 'evt_1755', accountId: 'acct_northstar', version: 1, type: 'lifecycle', importance: 'positive', occurredAt: '2026-08-01T16:46:00.000Z', displayTime: 'Yesterday · 16:46', source: 'Customer.io', sourceFreshness: 'Synced yesterday', title: 'Champion opened analytics release note', summary: 'Priya opened the release note from the monthly product digest.', impact: 'Good timing for an add-on demonstration invite.', actor: 'Priya Shah', receipt: 'cio_evt_1755', metadata: [{ label: 'Campaign', value: 'August analytics digest' }, { label: 'CTA', value: 'View report builder' }, { label: 'Device', value: 'Desktop' }], rawData: { object: 'campaign.clicked', campaign_id: 'august_analytics_digest', person_id: 'priya_shah', cta: 'report_builder' }, allowedActions: ['review', 'task', 'update'],
	}),
	createSeedEvent({
		id: 'evt_1728', accountId: 'acct_northstar', version: 1, type: 'support', importance: 'low', occurredAt: '2026-07-31T13:04:00.000Z', displayTime: '31 Jul · 13:04', source: 'Zendesk', sourceFreshness: 'Synced 2 days ago', title: 'SSO configuration question resolved', summary: 'Support confirmed the metadata mapping and closed the request.', impact: 'No account risk remains.', actor: 'Inez Hart · Support', receipt: 'zd_evt_4792_02', metadata: [{ label: 'Ticket', value: 'SUP-4792' }, { label: 'Resolution', value: 'Configuration' }], rawData: { object: 'ticket.solved', ticket_id: 'SUP-4792', status: 'solved' }, allowedActions: ['review'],
	}),
	createSeedEvent({
		id: 'evt_1694', accountId: 'acct_northstar', version: 1, type: 'revenue', importance: 'medium', occurredAt: '2026-07-30T09:40:00.000Z', displayTime: '30 Jul · 09:40', source: 'Stripe Billing', sourceFreshness: 'Synced 3 days ago', title: 'Invoice paid on schedule', summary: 'The August platform invoice settled without collection intervention.', impact: 'Billing relationship remains healthy.', actor: 'Billing automation', receipt: 'evt_invoice_paid_1694', metadata: [{ label: 'Invoice', value: 'INV-9842' }, { label: 'Amount', value: '£12,333' }], rawData: { object: 'invoice.paid', invoice_id: 'INV-9842', amount_paid: 1233300, currency: 'gbp', pending_webhooks: 0 }, allowedActions: ['review'],
	}),
	createSeedEvent({
		id: 'evt_1661', accountId: 'acct_northstar', version: 1, type: 'lifecycle', importance: 'low', occurredAt: '2026-07-29T14:30:00.000Z', displayTime: '29 Jul · 14:30', source: 'CRM meeting', sourceFreshness: 'Entered 4 days ago', title: 'Renewal discovery meeting completed', summary: 'Priya confirmed finance reporting and data residency as decision criteria.', impact: 'Success plan should connect reporting value to renewal proof.', actor: 'Maya Chen', receipt: 'crm_meeting_1661', metadata: [{ label: 'Attendees', value: '4' }, { label: 'Next meeting', value: '8 Aug' }], rawData: { object: 'meeting.completed', attendee_count: 4, outcomes: ['reporting_value', 'data_residency'] }, allowedActions: ['review', 'task', 'update'],
	}),
	createSeedEvent({
		id: 'evt_1704', accountId: 'acct_atlas', version: 4, type: 'support', importance: 'high', occurredAt: '2026-08-01T10:05:00.000Z', displayTime: 'Yesterday · 10:05', source: 'Zendesk', sourceFreshness: 'Synced 6 minutes ago', title: 'Identity ticket reopened', summary: 'Store managers still cannot complete SSO setup for new regions.', impact: 'Rollout remains blocked for 31 stores before a near-term renewal.', actor: 'Jordan Lee', receipt: 'zd_evt_4760_09', metadata: [{ label: 'Ticket', value: 'SUP-4760' }, { label: 'Stores blocked', value: '31' }, { label: 'Owner', value: 'Platform support' }], rawData: { object: 'ticket.reopened', ticket_id: 'SUP-4760', blocked_stores: 31 }, allowedActions: ['review', 'task', 'update'],
	}),
	createSeedEvent({
		id: 'evt_1688', accountId: 'acct_atlas', version: 1, type: 'revenue', importance: 'high', occurredAt: '2026-07-31T15:20:00.000Z', displayTime: '31 Jul · 15:20', source: 'Salesforce', sourceFreshness: 'Synced 30 minutes ago', title: 'Renewal moved from commit to best case', summary: 'The opportunity forecast changed after the identity escalation.', impact: 'Executive recovery needs an accountable owner this week.', actor: 'Sam Rivera', receipt: 'sf_evt_1688', metadata: [{ label: 'Opportunity', value: 'REN-1994' }, { label: 'Prior forecast', value: 'Commit' }], rawData: { object: 'opportunity.updated', forecast_from: 'commit', forecast_to: 'best_case' }, allowedActions: ['review', 'task', 'update'],
	}),
	createSeedEvent({
		id: 'evt_1652', accountId: 'acct_zephyr', version: 2, type: 'product', importance: 'medium', occurredAt: '2026-08-01T13:32:00.000Z', displayTime: 'Yesterday · 13:32', source: 'Product analytics', sourceFreshness: 'Synced 18 minutes ago', title: 'Approvals workflow usage dipped', summary: 'Weekly active reviewers declined across three regional teams.', impact: 'Adoption needs monitoring before the October renewal.', actor: 'Clinical operations', receipt: 'usage_evt_1652', metadata: [{ label: 'Workflow', value: 'Approvals' }, { label: 'Change', value: '-12%' }, { label: 'Region', value: 'Europe' }], rawData: { object: 'feature.activity', feature_key: 'approvals', change_percent: -12, regions: 3 }, allowedActions: ['review', 'task', 'update'],
	}),
];

const taskSeeds = [
	{
		id: 'task_3101',
		version: 2,
		accountId: 'acct_northstar',
		eventId: 'evt_1802',
		title: 'Prepare stakeholder renewal brief',
		detail: 'Connect current account signals to the decisions needed in the Friday stakeholder call.',
		ownerId: 'usr_maya',
		owner: 'Maya Chen',
		priority: 'urgent',
		dueDate: '2026-08-04',
		status: 'open',
		createdAt: 'Today · 14:32',
		receipt: 'task_receipt_3101',
		completionReceipt: null,
		completionNote: '',
	},
];

let sequence = 4200;
let customerActivityState = createState();

/**
 * Returns the complete customer activity workspace.
 *
 * @returns {object} Accounts, visible events, work queue, catalogs, and exact revisions.
 */
export function getCustomerActivityWorkspace() {
	return serializeWorkspace();
}

/**
 * Restores the deterministic customer activity demo.
 *
 * @returns {object} Reset workspace.
 */
export function resetCustomerActivityWorkspace() {
	sequence = 4200;
	customerActivityState = createState();
	return serializeWorkspace();
}

/**
 * Persists the selected account using the exact workspace revision.
 *
 * @param {object} input Account selection and revision.
 * @returns {object} Updated workspace or API error.
 */
export function selectCustomerActivityAccount(input = {}) {
	const revisionResult = requireRevision(input.revision);
	if (revisionResult) return revisionResult;
	const account = findAccount(input.accountId);
	if (!account) return error('The selected customer account no longer exists.', 404);
	customerActivityState.selectedAccountId = account.id;
	customerActivityState.taskPreview = null;
	customerActivityState.updatePreview = null;
	commitState('Account selection changed');
	return serializeWorkspace();
}

/**
 * Increases the server-owned event page for one account.
 *
 * @param {object} input Exact workspace and account versions.
 * @returns {object} Updated workspace or API error.
 */
export function loadMoreCustomerActivity(input = {}) {
	const revisionResult = requireRevision(input.revision);
	if (revisionResult) return revisionResult;
	const account = findAccount(input.accountId);
	if (!account) return error('The customer account no longer exists.', 404);
	if (Number(input.accountVersion) !== account.version) return error(`Account changed from version ${input.accountVersion} to ${account.version}. Refresh before loading more.`, 409);
	const total = eventsForAccount(account.id).length;
	const current = customerActivityState.visibleCounts[account.id] || 4;
	if (current >= total) return error('All available account activity is already loaded.', 409);
	customerActivityState.visibleCounts[account.id] = Math.min(total, current + 3);
	commitState('Older customer activity loaded');
	return serializeWorkspace();
}

/**
 * Marks an exact event version as reviewed by the current operator.
 *
 * @param {string} eventId Event identifier.
 * @param {object} input Exact workspace, account, and event versions.
 * @returns {object} Updated workspace or API error.
 */
export function reviewCustomerActivityEvent(eventId, input = {}) {
	const context = requireEventContext(eventId, input);
	if (context.error) return context;
	if (context.event.reviewedAt) return error('This event has already been reviewed.', 409);
	context.event.reviewedAt = 'Just now';
	context.event.reviewedBy = currentOperator.name;
	context.event.reviewReceipt = nextId('review_receipt');
	context.event.version += 1;
	context.account.version += 1;
	commitState('Customer activity reviewed');
	return serializeWorkspace();
}

/**
 * Creates an immutable follow-up task preview from one event.
 *
 * @param {object} input Task configuration and exact evidence versions.
 * @returns {object} Updated workspace with a task preview or API error.
 */
export function previewCustomerActivityTask(input = {}) {
	const context = requireEventContext(input.eventId, input);
	if (context.error) return context;
	const owner = findOwner(input.ownerId);
	if (!owner) return error('Choose an available task owner.', 422);
	if (!priorityCatalog.some((option) => option.value === input.priority)) return error('Choose a supported task priority.', 422);
	if (String(input.title || '').trim().length < 5) return error('Task title must contain at least 5 characters.', 422);
	if (String(input.detail || '').trim().length < 12) return error('Task detail must contain at least 12 characters.', 422);
	if (!/^2026-\d{2}-\d{2}$/.test(String(input.dueDate || ''))) return error('Choose a valid 2026 due date.', 422);
	if (input.dueDate > context.account.renewalDate) return error('The follow-up task must be due before the account renewal.', 422);
	customerActivityState.taskPreview = {
		id: nextId('task_preview'),
		receipt: nextId('task_preview_receipt'),
		workspaceRevision: customerActivityState.revision + 1,
		accountId: context.account.id,
		accountVersion: context.account.version,
		eventId: context.event.id,
		eventVersion: context.event.version,
		title: input.title.trim(),
		detail: input.detail.trim(),
		ownerId: owner.value,
		owner: owner.label,
		priority: input.priority,
		dueDate: input.dueDate,
		checks: [
			createCheck('permission', 'Task permission', 'passed', `${currentOperator.name} can create customer-success tasks.`),
			createCheck('evidence', 'Source evidence', 'passed', `${context.event.receipt} is locked at event version ${context.event.version}.`),
			createCheck('renewal', 'Renewal window', 'passed', `Task is due before ${context.account.renewalDate}.`),
		],
	};
	commitState('Follow-up task previewed');
	return serializeWorkspace();
}

/**
 * Creates an acknowledged task from the exact immutable preview.
 *
 * @param {object} input Preview identifier, revision, and acknowledgement.
 * @returns {object} Updated workspace or API error.
 */
export function createCustomerActivityTask(input = {}) {
	const revisionResult = requireRevision(input.revision);
	if (revisionResult) return revisionResult;
	const preview = customerActivityState.taskPreview;
	if (!preview || preview.id !== input.previewId) return error('The task preview expired. Create a new preview.', 409);
	if (!input.acknowledged) return error('Acknowledge the owner, due date, and source evidence before creating the task.', 422);
	const account = findAccount(preview.accountId);
	const event = findEvent(preview.eventId);
	if (!account || !event || account.version !== preview.accountVersion || event.version !== preview.eventVersion) return error('The account or event changed after preview. Refresh and preview the task again.', 409);
	const task = {
		id: nextId('task'),
		version: 1,
		accountId: account.id,
		eventId: event.id,
		title: preview.title,
		detail: preview.detail,
		ownerId: preview.ownerId,
		owner: preview.owner,
		priority: preview.priority,
		dueDate: preview.dueDate,
		status: 'open',
		createdAt: 'Just now',
		receipt: nextId('task_receipt'),
		completionReceipt: null,
		completionNote: '',
	};
	customerActivityState.tasks.unshift(task);
	account.version += 1;
	event.version += 1;
	event.actionStatus = 'Task created';
	customerActivityState.events.unshift(createGeneratedEvent(account.id, 'work', 'high', 'Follow-up task created', `${task.owner} owns “${task.title}” due ${task.dueDate}.`, task.receipt));
	customerActivityState.visibleCounts[account.id] = (customerActivityState.visibleCounts[account.id] || 4) + 1;
	customerActivityState.taskPreview = null;
	commitState('Follow-up task created');
	return serializeWorkspace();
}

/**
 * Completes one exact task with durable evidence.
 *
 * @param {string} taskId Task identifier.
 * @param {object} input Exact task and workspace revisions plus completion note.
 * @returns {object} Updated workspace or API error.
 */
export function completeCustomerActivityTask(taskId, input = {}) {
	const revisionResult = requireRevision(input.revision);
	if (revisionResult) return revisionResult;
	const task = customerActivityState.tasks.find((item) => item.id === taskId);
	if (!task) return error('The follow-up task no longer exists.', 404);
	if (Number(input.taskVersion) !== task.version) return error(`Task changed from version ${input.taskVersion} to ${task.version}. Refresh before completing it.`, 409);
	if (task.status === 'completed') return error('This task is already complete.', 409);
	if (String(input.note || '').trim().length < 12) return error('Add a completion note with at least 12 characters.', 422);
	const account = findAccount(task.accountId);
	if (!account) return error('The task account no longer exists.', 404);
	task.status = 'completed';
	task.completionNote = input.note.trim();
	task.completionReceipt = nextId('task_completion_receipt');
	task.version += 1;
	account.version += 1;
	customerActivityState.events.unshift(createGeneratedEvent(account.id, 'work', 'positive', 'Follow-up task completed', task.completionNote, task.completionReceipt));
	customerActivityState.visibleCounts[account.id] = (customerActivityState.visibleCounts[account.id] || 4) + 1;
	commitState('Follow-up task completed');
	return serializeWorkspace();
}

/**
 * Adds a durable internal note to the selected account timeline.
 *
 * @param {object} input Exact versions, title, and note body.
 * @returns {object} Updated workspace or API error.
 */
export function logCustomerActivityNote(input = {}) {
	const revisionResult = requireRevision(input.revision);
	if (revisionResult) return revisionResult;
	const account = findAccount(input.accountId);
	if (!account) return error('The customer account no longer exists.', 404);
	if (Number(input.accountVersion) !== account.version) return error(`Account changed from version ${input.accountVersion} to ${account.version}. Refresh before saving the note.`, 409);
	if (String(input.title || '').trim().length < 5) return error('Note title must contain at least 5 characters.', 422);
	if (String(input.body || '').trim().length < 12) return error('Internal note must contain at least 12 characters.', 422);
	const receipt = nextId('note_receipt');
	account.version += 1;
	customerActivityState.events.unshift(createGeneratedEvent(account.id, 'work', 'low', input.title.trim(), input.body.trim(), receipt));
	customerActivityState.visibleCounts[account.id] = (customerActivityState.visibleCounts[account.id] || 4) + 1;
	commitState('Internal account note saved');
	return serializeWorkspace();
}

/**
 * Creates an immutable outbound customer-update preview.
 *
 * @param {object} input Message, channel, and exact evidence versions.
 * @returns {object} Updated workspace with outbound preview or API error.
 */
export function previewCustomerActivityUpdate(input = {}) {
	const context = requireEventContext(input.eventId, input);
	if (context.error) return context;
	if (!channelCatalog.some((option) => option.value === input.channel)) return error('Choose a supported delivery channel.', 422);
	if (String(input.recipient || '').trim().length < 5) return error('Add a valid customer recipient.', 422);
	if (String(input.subject || '').trim().length < 5) return error('Message subject must contain at least 5 characters.', 422);
	if (String(input.body || '').trim().length < 20) return error('Customer update must contain at least 20 characters.', 422);
	customerActivityState.updatePreview = {
		id: nextId('update_preview'),
		receipt: nextId('update_preview_receipt'),
		workspaceRevision: customerActivityState.revision + 1,
		accountId: context.account.id,
		accountVersion: context.account.version,
		eventId: context.event.id,
		eventVersion: context.event.version,
		channel: input.channel,
		recipient: input.recipient.trim(),
		subject: input.subject.trim(),
		body: input.body.trim(),
		checks: [
			createCheck('recipient', 'Recipient', 'passed', `${input.recipient.trim()} is attached to ${context.account.name}.`),
			createCheck('evidence', 'Source event', 'passed', `${context.event.receipt} is locked at version ${context.event.version}.`),
			createCheck('delivery', 'Provider route', 'passed', input.channel === 'email' ? 'Customer-success mailbox is connected.' : 'CRM timeline adapter is available.'),
		],
	};
	commitState('Customer update previewed');
	return serializeWorkspace();
}

/**
 * Sends an acknowledged customer update through the previewed provider route.
 *
 * @param {object} input Preview identifier, revision, and acknowledgement.
 * @returns {object} Updated workspace or API error.
 */
export function sendCustomerActivityUpdate(input = {}) {
	const revisionResult = requireRevision(input.revision);
	if (revisionResult) return revisionResult;
	const preview = customerActivityState.updatePreview;
	if (!preview || preview.id !== input.previewId) return error('The customer update preview expired. Create a new preview.', 409);
	if (!input.acknowledged) return error('Acknowledge the recipient, message, and source evidence before sending.', 422);
	const account = findAccount(preview.accountId);
	const event = findEvent(preview.eventId);
	if (!account || !event || account.version !== preview.accountVersion || event.version !== preview.eventVersion) return error('The account or event changed after preview. Refresh and preview the update again.', 409);
	const providerReceipt = nextId(preview.channel === 'email' ? 'mail_delivery' : 'crm_write');
	account.version += 1;
	account.lastTouch = 'Just now';
	event.version += 1;
	event.reviewedAt = event.reviewedAt || 'Just now';
	event.reviewedBy = event.reviewedBy || currentOperator.name;
	event.reviewReceipt = event.reviewReceipt || nextId('review_receipt');
	event.actionStatus = 'Customer updated';
	customerActivityState.events.unshift(createGeneratedEvent(account.id, 'work', 'positive', `Customer update sent: ${preview.subject}`, `${preview.channel === 'email' ? 'Email' : 'CRM update'} delivered to ${preview.recipient}.`, providerReceipt));
	customerActivityState.visibleCounts[account.id] = (customerActivityState.visibleCounts[account.id] || 4) + 1;
	customerActivityState.lastDelivery = { id: providerReceipt, channel: preview.channel, recipient: preview.recipient, status: 'delivered', deliveredAt: 'Just now', sourceEventId: event.id, previewReceipt: preview.receipt };
	customerActivityState.updatePreview = null;
	commitState('Customer update delivered');
	return serializeWorkspace();
}

/**
 * Creates a fresh deterministic state object.
 *
 * @returns {object} Initial workspace state.
 */
function createState() {
	return {
		revision: 31,
		selectedAccountId: 'acct_northstar',
		accounts: clone(accountSeeds),
		events: clone(eventSeeds),
		tasks: clone(taskSeeds),
		visibleCounts: { acct_northstar: 4, acct_atlas: 2, acct_zephyr: 1 },
		taskPreview: null,
		updatePreview: null,
		lastDelivery: null,
		updatedAt: 'Today · 14:32',
	};
}

/**
 * Serializes selected account events, work, options, and portfolio state.
 *
 * @returns {object} JSON-safe workspace response.
 */
function serializeWorkspace() {
	const selectedAccount = findAccount(customerActivityState.selectedAccountId) || customerActivityState.accounts[0];
	const allEvents = eventsForAccount(selectedAccount.id);
	const visibleCount = customerActivityState.visibleCounts[selectedAccount.id] || 4;
	const visibleEvents = allEvents.slice(0, visibleCount);
	const selectedTasks = customerActivityState.tasks.filter((task) => task.accountId === selectedAccount.id);
	return clone({
		revision: customerActivityState.revision,
		updatedAt: customerActivityState.updatedAt,
		currentOperator,
		selectedAccountId: selectedAccount.id,
		accounts: customerActivityState.accounts.map((account) => ({
			...account,
			eventCount: eventsForAccount(account.id).length,
			unreviewedCount: eventsForAccount(account.id).filter((event) => !event.reviewedAt).length,
			openTaskCount: customerActivityState.tasks.filter((task) => task.accountId === account.id && task.status === 'open').length,
		})),
		selectedAccount,
		events: visibleEvents,
		eventPage: { visible: visibleEvents.length, total: allEvents.length, canLoadMore: visibleEvents.length < allEvents.length },
		tasks: selectedTasks,
		taskPreview: customerActivityState.taskPreview,
		updatePreview: customerActivityState.updatePreview,
		lastDelivery: customerActivityState.lastDelivery,
		summary: {
			totalEvents: allEvents.length,
			unreviewed: allEvents.filter((event) => !event.reviewedAt).length,
			highPriority: allEvents.filter((event) => event.importance === 'high').length,
			openTasks: selectedTasks.filter((task) => task.status === 'open').length,
		},
		catalog: { owners: ownerCatalog, priorities: priorityCatalog, channels: channelCatalog, eventTypes: typeCatalog },
	});
}

/**
 * Validates exact workspace, account, and event versions.
 *
 * @param {string} eventId Event identifier.
 * @param {object} input Expected revisions.
 * @returns {object} Event context or API error.
 */
function requireEventContext(eventId, input) {
	const revisionResult = requireRevision(input.revision);
	if (revisionResult) return revisionResult;
	const event = findEvent(eventId);
	if (!event) return error('The customer activity event no longer exists.', 404);
	const account = findAccount(event.accountId);
	if (!account) return error('The event account no longer exists.', 404);
	if (input.accountId && input.accountId !== account.id) return error('The event does not belong to the selected account.', 422);
	if (Number(input.accountVersion) !== account.version) return error(`Account changed from version ${input.accountVersion} to ${account.version}. Refresh before continuing.`, 409);
	if (Number(input.eventVersion) !== event.version) return error(`Event changed from version ${input.eventVersion} to ${event.version}. Refresh before continuing.`, 409);
	return { account, event };
}

/**
 * Advances the workspace revision and freshness marker.
 *
 * @param {string} action Human-readable mutation label.
 * @returns {void}
 */
function commitState(action) {
	customerActivityState.revision += 1;
	customerActivityState.updatedAt = `Just now · ${action}`;
}

/**
 * Requires a mutation to target the current workspace revision.
 *
 * @param {number|string} revision Client revision.
 * @returns {object|null} Conflict response or null.
 */
function requireRevision(revision) {
	const received = Number(revision);
	if (!Number.isFinite(received) || received !== customerActivityState.revision) return error(`Workspace changed from revision ${revision} to ${customerActivityState.revision}. Refresh and try again.`, 409);
	return null;
}

/**
 * Returns one account by identifier.
 *
 * @param {string} accountId Account identifier.
 * @returns {object|null} Matching account.
 */
function findAccount(accountId) {
	return customerActivityState.accounts.find((account) => account.id === accountId) || null;
}

/**
 * Returns one activity event by identifier.
 *
 * @param {string} eventId Event identifier.
 * @returns {object|null} Matching event.
 */
function findEvent(eventId) {
	return customerActivityState.events.find((event) => event.id === eventId) || null;
}

/**
 * Returns one owner option by identifier.
 *
 * @param {string} ownerId Owner identifier.
 * @returns {object|null} Matching owner.
 */
function findOwner(ownerId) {
	return ownerCatalog.find((owner) => owner.value === ownerId) || null;
}

/**
 * Returns one account's events in reverse chronological order.
 *
 * @param {string} accountId Account identifier.
 * @returns {object[]} Ordered events.
 */
function eventsForAccount(accountId) {
	return customerActivityState.events
		.filter((event) => event.accountId === accountId)
		.sort((left, right) => String(right.occurredAt).localeCompare(String(left.occurredAt)));
}

/**
 * Creates a normalized immutable seed event.
 *
 * @param {object} input Event fields.
 * @returns {object} Normalized event.
 */
function createSeedEvent(input) {
	return {
		...input,
		reviewedAt: null,
		reviewedBy: null,
		reviewReceipt: null,
		actionStatus: '',
	};
}

/**
 * Creates a generated team-work event from a successful mutation.
 *
 * @param {string} accountId Account identifier.
 * @param {string} type Event type.
 * @param {string} importance Event importance.
 * @param {string} title Event title.
 * @param {string} summary Event summary.
 * @param {string} receipt Durable source receipt.
 * @returns {object} Generated timeline event.
 */
function createGeneratedEvent(accountId, type, importance, title, summary, receipt) {
	return createSeedEvent({
		id: nextId('evt'),
		accountId,
		version: 1,
		type,
		importance,
		occurredAt: `2026-08-02T23:59:59.${String(sequence % 1000).padStart(3, '0')}Z`,
		displayTime: 'Just now',
		source: 'Customer success workspace',
		sourceFreshness: 'Written just now',
		title,
		summary,
		impact: 'The activity is now part of the official account record.',
		actor: currentOperator.name,
		receipt,
		metadata: [{ label: 'Operator', value: currentOperator.name }, { label: 'Receipt', value: receipt }],
		rawData: { object: `customer_success.${type}`, receipt, operator_id: currentOperator.id, status: 'committed' },
		allowedActions: ['review'],
	});
}

/**
 * Creates a server-owned readiness check.
 *
 * @param {string} id Check identifier.
 * @param {string} label Human-readable label.
 * @param {string} state Check state.
 * @param {string} detail Check evidence.
 * @returns {object} Preview check.
 */
function createCheck(id, label, state, detail) {
	return { id, label, state, detail };
}

/**
 * Produces the next deterministic identifier.
 *
 * @param {string} prefix Identifier prefix.
 * @returns {string} New identifier.
 */
function nextId(prefix) {
	sequence += 1;
	return `${prefix}_${sequence}`;
}

/**
 * Creates a consistent API error response.
 *
 * @param {string} message User-facing error message.
 * @param {number} status HTTP status.
 * @returns {object} Error payload.
 */
function error(message, status) {
	return { error: message, status };
}

/**
 * Clones JSON-safe demo state.
 *
 * @param {unknown} value Source value.
 * @returns {any} Deep clone.
 */
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}
