const environmentOptions = [
	{ value: 'all', label: 'All environments', description: 'Production, staging, and development activity.' },
	{ value: 'production', label: 'Production', description: 'Customer-facing workspace activity.' },
	{ value: 'staging', label: 'Staging', description: 'Pre-release verification and test activity.' },
	{ value: 'development', label: 'Development', description: 'Local and sandbox activity.' },
];

const severityOptions = [
	{ value: 'all', label: 'All severity', description: 'Every indexed risk level.' },
	{ value: 'critical', label: 'Critical', description: 'Immediate security or policy investigation.' },
	{ value: 'high', label: 'High', description: 'Sensitive access or data changes.' },
	{ value: 'medium', label: 'Medium', description: 'Operational changes that may need review.' },
	{ value: 'low', label: 'Low', description: 'Routine administrative activity.' },
];

const outcomeOptions = [
	{ value: 'all', label: 'Any outcome', description: 'Successful, denied, and failed activity.' },
	{ value: 'success', label: 'Success', description: 'The requested action completed.' },
	{ value: 'denied', label: 'Denied', description: 'A policy or permission blocked the action.' },
	{ value: 'failed', label: 'Failed', description: 'The action started but did not complete.' },
];

const categoryOptions = [
	{ value: 'all', label: 'All categories', description: 'Every audit event category.' },
	{ value: 'access', label: 'Access', description: 'Membership, roles, and authentication.' },
	{ value: 'security', label: 'Security', description: 'Policy, sessions, keys, and controls.' },
	{ value: 'data', label: 'Data', description: 'Exports, retention, and record changes.' },
	{ value: 'billing', label: 'Billing', description: 'Invoices, credits, and subscriptions.' },
	{ value: 'integrations', label: 'Integrations', description: 'Webhooks and connected services.' },
	{ value: 'ai', label: 'AI actions', description: 'Agent approvals and automated decisions.' },
];

const timeOptions = [
	{ value: '24h', label: 'Last 24 hours', description: 'Recent activity for incident triage.' },
	{ value: '7d', label: 'Last 7 days', description: 'A complete operational week.' },
	{ value: '30d', label: 'Last 30 days', description: 'Monthly compliance review window.' },
	{ value: '90d', label: 'Last 90 days', description: 'Quarterly evidence window.' },
];

const savedViews = [
	{ id: 'view-high-risk', name: 'High-risk production', filters: { environment: 'production', severity: 'high', outcome: 'all', category: 'all', timeWindow: '30d', query: '' } },
	{ id: 'view-access', name: 'Access changes', filters: { environment: 'all', severity: 'all', outcome: 'all', category: 'access', timeWindow: '7d', query: '' } },
	{ id: 'view-failed-exports', name: 'Failed exports', filters: { environment: 'all', severity: 'all', outcome: 'failed', category: 'data', timeWindow: '90d', query: 'export' } },
];

const exportJobs = [];
const alertRules = [];
let viewSequence = 3;
let exportSequence = 240;
let alertSequence = 18;

const events = [
	createEvent({
		id: 'evt_84201',
		createdAt: '2026-08-01T14:36:00.000Z',
		actor: ['Priya Shah', 'priya@tempo.example', 'PS', 'Workspace admin'],
		action: 'member.role.updated',
		description: 'Changed Jon Bell from Member to Admin',
		resource: ['Jon Bell', 'Member', 'usr_552'],
		category: 'access',
		environment: 'production',
		outcome: 'success',
		severity: 'high',
		request: ['req_7ae921', '203.0.113.24', 'London', 'Chrome 127 / macOS'],
		metadata: { reason: 'Temporary migration access', approvedBy: 'sec_approvals', ticket: 'IAM-482' },
		before: { role: 'Member', scopes: ['projects:read'] },
		after: { role: 'Admin', scopes: ['projects:read', 'projects:write', 'members:write'] },
		hold: { active: true, reason: 'Quarterly access review', placedBy: 'Avery Stone', placedAt: '2026-08-01T14:50:00.000Z' },
	}),
	createEvent({
		id: 'evt_84182',
		createdAt: '2026-08-01T13:12:00.000Z',
		actor: ['System policy', 'security@tempo.example', 'SP', 'Automated control'],
		action: 'session.mfa_challenge.failed',
		description: 'Blocked sign-in after repeated failed MFA challenges',
		resource: ['Ari Patel', 'Session', 'ses_91a'],
		category: 'security',
		environment: 'production',
		outcome: 'denied',
		severity: 'critical',
		request: ['req_e5c043', '198.51.100.18', 'Frankfurt', 'Firefox 128 / Windows'],
		metadata: { attempts: 5, rule: 'mfa_lockout', deviceTrust: 'untrusted', sessionRisk: 92 },
		before: { state: 'challenge', attempts: 4 },
		after: { state: 'blocked', attempts: 5 },
	}),
	createEvent({
		id: 'evt_84144',
		createdAt: '2026-08-01T11:48:00.000Z',
		actor: ['Maya Chen', 'maya@tempo.example', 'MC', 'Billing admin'],
		action: 'invoice.credit.applied',
		description: 'Applied a goodwill credit to the annual renewal invoice',
		resource: ['Acme renewal', 'Invoice', 'inv_21044'],
		category: 'billing',
		environment: 'production',
		outcome: 'success',
		severity: 'medium',
		request: ['req_44f120', '192.0.2.44', 'Dublin', 'Safari 18 / macOS'],
		metadata: { amount: 1200, currency: 'USD', approver: 'Deal desk', reason: 'Service recovery' },
		before: { amountDue: 48200, credits: 0 },
		after: { amountDue: 47000, credits: 1200 },
	}),
	createEvent({
		id: 'evt_84097',
		createdAt: '2026-08-01T10:22:00.000Z',
		actor: ['Jon Bell', 'jon@tempo.example', 'JB', 'Developer'],
		action: 'api_key.created',
		description: 'Created a production API key with write scopes',
		resource: ['Server import key', 'API key', 'key_c620'],
		category: 'security',
		environment: 'production',
		outcome: 'success',
		severity: 'high',
		request: ['req_c620ab', '203.0.113.88', 'London', 'Chrome 127 / macOS'],
		metadata: { scopes: ['customers:write', 'invoices:read'], expiresAt: '2026-11-01', rotationRequired: true },
		before: {},
		after: { status: 'active', prefix: 'tempo_live_7k2', scopes: ['customers:write', 'invoices:read'] },
	}),
	createEvent({
		id: 'evt_84041',
		createdAt: '2026-07-31T16:04:00.000Z',
		actor: ['Import worker', 'jobs@tempo.example', 'IW', 'Service account'],
		action: 'customer.export.failed',
		description: 'Customer CSV export failed schema validation',
		resource: ['Enterprise accounts export', 'Export job', 'exp_701'],
		category: 'data',
		environment: 'staging',
		outcome: 'failed',
		severity: 'medium',
		request: ['req_stage_881', '10.0.4.12', 'Internal', 'worker/export-v4'],
		metadata: { rows: 18402, error: 'missing required column: account_id', retryable: true },
		before: { state: 'processing', processedRows: 18402 },
		after: { state: 'failed', errorCode: 'SCHEMA_REQUIRED_COLUMN' },
	}),
	createEvent({
		id: 'evt_83988',
		createdAt: '2026-07-31T14:31:00.000Z',
		actor: ['Local tunnel', 'dev@tempo.example', 'LT', 'Development service'],
		action: 'webhook.endpoint.updated',
		description: 'Changed the development webhook URL for invoice events',
		resource: ['Checkout sandbox', 'Webhook', 'wh_dev_112'],
		category: 'integrations',
		environment: 'development',
		outcome: 'success',
		severity: 'low',
		request: ['req_dev_112', '127.0.0.1', 'Local', 'Tempo CLI 4.2'],
		metadata: { events: ['invoice.paid', 'invoice.payment_failed'], signingSecretRotated: true },
		before: { url: 'https://old-tunnel.example/hooks' },
		after: { url: 'https://new-tunnel.example/hooks' },
	}),
	createEvent({
		id: 'evt_83942',
		createdAt: '2026-07-31T12:12:00.000Z',
		actor: ['Avery Stone', 'avery@tempo.example', 'AS', 'Security admin'],
		action: 'policy.session_timeout.updated',
		description: 'Reduced the production session timeout to eight hours',
		resource: ['Default session policy', 'Security policy', 'pol_session'],
		category: 'security',
		environment: 'production',
		outcome: 'success',
		severity: 'medium',
		request: ['req_09ac42', '203.0.113.10', 'Manchester', 'Chrome 127 / macOS'],
		metadata: { ticket: 'SEC-204', appliesTo: 'all_members' },
		before: { timeoutHours: 24, idleTimeoutMinutes: 120 },
		after: { timeoutHours: 8, idleTimeoutMinutes: 60 },
	}),
	createEvent({
		id: 'evt_83876',
		createdAt: '2026-07-30T18:52:00.000Z',
		actor: ['Scout agent', 'agent@tempo.example', 'SA', 'AI service'],
		action: 'agent.refund.approval.requested',
		description: 'Escalated a refund above the autonomous approval limit',
		resource: ['Northstar refund', 'Agent run', 'run_0d21'],
		category: 'ai',
		environment: 'production',
		outcome: 'denied',
		severity: 'high',
		request: ['req_agent_221', '10.0.8.2', 'Internal', 'scout-agent/2.8'],
		metadata: { requestedAmount: 7800, currency: 'USD', autonomousLimit: 5000, escalation: 'finance_on_call' },
		before: { state: 'evaluating', confidence: 0.96 },
		after: { state: 'human_review', approvalId: 'apr_882' },
	}),
	createEvent({
		id: 'evt_83811',
		createdAt: '2026-07-30T15:07:00.000Z',
		actor: ['Noah Williams', 'noah@tempo.example', 'NW', 'Workspace owner'],
		action: 'sso.domain.verified',
		description: 'Verified the northstar.example SSO domain',
		resource: ['northstar.example', 'SSO domain', 'sso_dom_44'],
		category: 'access',
		environment: 'production',
		outcome: 'success',
		severity: 'medium',
		request: ['req_sso_441', '192.0.2.91', 'New York', 'Edge 127 / Windows'],
		metadata: { provider: 'Okta', method: 'dns_txt', tenant: 'northstar.okta.com' },
		before: { status: 'pending' },
		after: { status: 'verified', enforced: false },
	}),
	createEvent({
		id: 'evt_83768',
		createdAt: '2026-07-29T21:19:00.000Z',
		actor: ['Retention service', 'retention@tempo.example', 'RS', 'Automated control'],
		action: 'customer.records.deleted',
		description: 'Deleted expired sandbox customer records under policy',
		resource: ['Sandbox customer cohort', 'Retention batch', 'ret_771'],
		category: 'data',
		environment: 'development',
		outcome: 'success',
		severity: 'low',
		request: ['req_ret_771', '10.0.5.7', 'Internal', 'retention-service/3.1'],
		metadata: { records: 284, policy: 'sandbox_30_days', skippedLegalHolds: 3 },
		before: { eligibleRecords: 287 },
		after: { deletedRecords: 284, retainedRecords: 3 },
	}),
	createEvent({
		id: 'evt_83694',
		createdAt: '2026-07-29T14:02:00.000Z',
		actor: ['Priya Shah', 'priya@tempo.example', 'PS', 'Workspace admin'],
		action: 'member.invitation.revoked',
		description: 'Revoked an invitation after the role request changed',
		resource: ['Taylor Reed', 'Invitation', 'inv_882'],
		category: 'access',
		environment: 'production',
		outcome: 'success',
		severity: 'medium',
		request: ['req_inv_882', '203.0.113.24', 'London', 'Chrome 127 / macOS'],
		metadata: { reason: 'Role request changed', expiresAt: '2026-08-05' },
		before: { state: 'pending', role: 'Admin' },
		after: { state: 'revoked', role: 'Admin' },
	}),
	createEvent({
		id: 'evt_83621',
		createdAt: '2026-07-28T09:45:00.000Z',
		actor: ['Billing sync', 'billing@tempo.example', 'BS', 'Service account'],
		action: 'subscription.plan.updated',
		description: 'Moved the workspace to Enterprise annual billing',
		resource: ['Tempo workspace', 'Subscription', 'sub_enterprise'],
		category: 'billing',
		environment: 'production',
		outcome: 'success',
		severity: 'low',
		request: ['req_bill_721', '10.0.6.2', 'Internal', 'billing-sync/5.4'],
		metadata: { quote: 'qt_902', seats: 80, renewalAt: '2027-08-01' },
		before: { plan: 'Business', interval: 'monthly' },
		after: { plan: 'Enterprise', interval: 'annual' },
	}),
];

/**
 * Returns workspace context, rich filter controls, saved views, and recent jobs.
 *
 * @returns {Record<string, unknown>} Audit explorer bootstrap payload.
 */
export function getAuditLogBootstrap() {
	return {
		workspace: { id: 'wrk_tempo', name: 'Tempo', plan: 'Enterprise' },
		currentUser: { name: 'Avery Stone', email: 'avery@tempo.example', initials: 'AS', role: 'Security admin' },
		controls: {
			environments: cloneValue(environmentOptions),
			severities: cloneValue(severityOptions),
			outcomes: cloneValue(outcomeOptions),
			categories: cloneValue(categoryOptions),
			timeWindows: cloneValue(timeOptions),
		},
		savedViews: cloneValue(savedViews),
		recentExports: cloneValue(exportJobs.slice(0, 3)),
		alertRules: cloneValue(alertRules.slice(0, 3)),
		indexedAt: new Date(Date.now() - 42000).toISOString(),
	};
}

/**
 * Filters and paginates audit records on the server-owned dataset.
 *
 * @param {Record<string, unknown>} input Query and pagination values.
 * @returns {Record<string, unknown>} Matching audit summaries and aggregate statistics.
 */
export function queryAuditEvents(input = {}) {
	const pageSize = clampNumber(input.pageSize, 1, 20, 6);
	const page = clampNumber(input.page, 1, 1000, 1);
	const filters = normalizeFilters(input);
	const query = filters.query.toLowerCase();
	const matches = events.filter((event) => {
		if (!matchesTimeWindow(event.createdAt, filters.timeWindow)) return false;
		if (filters.environment !== 'all' && event.environment !== filters.environment) return false;
		if (filters.severity !== 'all' && event.severity !== filters.severity) return false;
		if (filters.outcome !== 'all' && event.outcome !== filters.outcome) return false;
		if (filters.category !== 'all' && event.category !== filters.category) return false;
		if (!query) return true;
		return [event.id, event.actor.name, event.actor.email, event.action, event.description, event.resource.name, event.resource.id, event.request.id, event.request.ip]
			.join(' ')
			.toLowerCase()
			.includes(query);
	});
	const total = matches.length;
	const pageCount = Math.max(1, Math.ceil(total / pageSize));
	const safePage = Math.min(page, pageCount);
	const offset = (safePage - 1) * pageSize;
	const successCount = matches.filter((event) => event.outcome === 'success').length;

	return {
		queryId: `qry_${Date.now().toString(36)}`,
		filters,
		events: matches.slice(offset, offset + pageSize).map(serializeEventSummary),
		page: safePage,
		pageSize,
		pageCount,
		total,
		stats: {
			critical: matches.filter((event) => event.severity === 'critical').length,
			highRisk: matches.filter((event) => ['critical', 'high'].includes(event.severity)).length,
			onHold: matches.filter((event) => event.hold.active).length,
			successRate: total ? Math.round((successCount / total) * 100) : 0,
		},
		indexedAt: new Date(Date.now() - 42000).toISOString(),
	};
}

/**
 * Returns full immutable evidence for one audit event.
 *
 * @param {string} eventId Audit event identifier.
 * @returns {Record<string, unknown>} Full event detail or an API error.
 */
export function getAuditEvent(eventId) {
	const event = findEvent(eventId);
	if (!event) return notFound();
	return { event: cloneValue(event) };
}

/**
 * Places or releases a legal hold with optimistic revision protection.
 *
 * @param {string} eventId Audit event identifier.
 * @param {Record<string, unknown>} input Hold mutation request.
 * @returns {Record<string, unknown>} Updated event detail or validation error.
 */
export function updateAuditEventHold(eventId, input = {}) {
	const event = findEvent(eventId);
	if (!event) return notFound();
	if (Number(input.revision) !== event.revision) return { error: 'This event changed while you were reviewing it. Refresh the evidence and try again.', status: 409 };
	const active = Boolean(input.active);
	const reason = normalizeText(input.reason, 180);
	if (active && reason.length < 8) return { error: 'Add a legal hold reason with at least 8 characters.', status: 422 };
	event.hold = active
		? { active: true, reason, placedBy: 'Avery Stone', placedAt: new Date().toISOString() }
		: { active: false, reason: '', placedBy: '', placedAt: '' };
	event.revision += 1;
	return { event: cloneValue(event), message: active ? 'Legal hold placed. This evidence is excluded from retention deletion.' : 'Legal hold released.' };
}

/**
 * Persists a reusable named server-side investigation view.
 *
 * @param {Record<string, unknown>} input Saved view request.
 * @returns {Record<string, unknown>} Created view or validation error.
 */
export function createAuditSavedView(input = {}) {
	const name = normalizeText(input.name, 60);
	if (name.length < 3) return { error: 'Give this saved view a name with at least 3 characters.', status: 422 };
	if (savedViews.some((view) => view.name.toLowerCase() === name.toLowerCase())) return { error: 'A saved view with this name already exists.', status: 422 };
	viewSequence += 1;
	const view = { id: `view-${viewSequence}`, name, filters: normalizeFilters(input.filters || {}) };
	savedViews.unshift(view);
	return { view: cloneValue(view), message: `Saved “${name}” for this workspace.` };
}

/**
 * Creates a compliance export job and records the proof returned to the UI.
 *
 * @param {Record<string, unknown>} input Export configuration and active filters.
 * @returns {Record<string, unknown>} Export job proof or validation error.
 */
export function createAuditExport(input = {}) {
	const format = ['csv', 'json'].includes(String(input.format)) ? String(input.format) : '';
	if (!format) return { error: 'Choose CSV or JSON for the export.', status: 422 };
	if (input.includeSensitive && !input.acknowledgedSensitive) return { error: 'Confirm that this export may contain sensitive identity and request metadata.', status: 422 };
	const result = queryAuditEvents({ ...(input.filters || {}), page: 1, pageSize: 20 });
	if (!result.total) return { error: 'No matching audit events are available to export.', status: 422 };
	exportSequence += 1;
	const job = {
		id: `exp_${exportSequence}`,
		filename: `tempo-audit-${exportSequence}.${format}`,
		format,
		status: 'ready',
		eventCount: result.total,
		includeSensitive: Boolean(input.includeSensitive),
		checksum: `sha256:${(Date.now() + exportSequence).toString(16).padStart(16, '0')}`,
		createdBy: 'Avery Stone',
		createdAt: new Date().toISOString(),
	};
	exportJobs.unshift(job);
	return { job: cloneValue(job), message: `${job.eventCount} events exported with verification checksum.` };
}

/**
 * Creates a working alert rule from the current investigation context.
 *
 * @param {Record<string, unknown>} input Alert rule configuration.
 * @returns {Record<string, unknown>} Created alert rule or validation error.
 */
export function createAuditAlertRule(input = {}) {
	const name = normalizeText(input.name, 60);
	const channel = normalizeText(input.channel, 120);
	const threshold = clampNumber(input.threshold, 1, 100, 0);
	if (name.length < 3) return { error: 'Give the alert rule a name with at least 3 characters.', status: 422 };
	if (!channel.includes('@') && !channel.startsWith('#')) return { error: 'Use an email address or a channel beginning with #.', status: 422 };
	if (!threshold) return { error: 'Set a threshold between 1 and 100 events.', status: 422 };
	alertSequence += 1;
	const rule = {
		id: `rule_${alertSequence}`,
		name,
		channel,
		threshold,
		window: '15 minutes',
		severity: normalizeOptionValue(input.severity, severityOptions, 'high'),
		enabled: true,
		createdAt: new Date().toISOString(),
	};
	alertRules.unshift(rule);
	return { rule: cloneValue(rule), message: `Alert rule “${name}” is now monitoring audit traffic.` };
}

/**
 * Creates a normalized event record from compact seed values.
 *
 * @param {Record<string, unknown>} input Compact seed event.
 * @returns {Record<string, unknown>} Complete audit event record.
 */
function createEvent(input) {
	return {
		id: input.id,
		createdAt: input.createdAt,
		actor: { name: input.actor[0], email: input.actor[1], initials: input.actor[2], role: input.actor[3] },
		action: input.action,
		description: input.description,
		resource: { name: input.resource[0], type: input.resource[1], id: input.resource[2] },
		category: input.category,
		environment: input.environment,
		outcome: input.outcome,
		severity: input.severity,
		request: { id: input.request[0], ip: input.request[1], region: input.request[2], userAgent: input.request[3] },
		metadata: input.metadata,
		before: input.before,
		after: input.after,
		hold: input.hold || { active: false, reason: '', placedBy: '', placedAt: '' },
		revision: 1,
	};
}

/**
 * Returns the list-oriented subset of a full event record.
 *
 * @param {Record<string, unknown>} event Full audit event.
 * @returns {Record<string, unknown>} Audit event summary.
 */
function serializeEventSummary(event) {
	return {
		id: event.id,
		createdAt: event.createdAt,
		actor: cloneValue(event.actor),
		action: event.action,
		description: event.description,
		resource: cloneValue(event.resource),
		category: event.category,
		environment: event.environment,
		outcome: event.outcome,
		severity: event.severity,
		requestId: event.request.id,
		onHold: event.hold.active,
	};
}

/**
 * Normalizes supported filter fields and free-text search.
 *
 * @param {Record<string, unknown>} input Candidate filter values.
 * @returns {Record<string, string>} Supported filters.
 */
function normalizeFilters(input) {
	return {
		query: normalizeText(input.query, 180),
		environment: normalizeOptionValue(input.environment, environmentOptions, 'all'),
		severity: normalizeOptionValue(input.severity, severityOptions, 'all'),
		outcome: normalizeOptionValue(input.outcome, outcomeOptions, 'all'),
		category: normalizeOptionValue(input.category, categoryOptions, 'all'),
		timeWindow: normalizeOptionValue(input.timeWindow, timeOptions, '7d'),
	};
}

/**
 * Checks whether an event belongs to the requested rolling evidence window.
 *
 * The newest seeded event is used as the deterministic demo clock so examples
 * remain useful when copied or tested at a later date.
 *
 * @param {string} createdAt Event timestamp.
 * @param {string} timeWindow Supported time window value.
 * @returns {boolean} Whether the event falls inside the window.
 */
function matchesTimeWindow(createdAt, timeWindow) {
	const windowDays = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 }[timeWindow] || 7;
	const demoNow = new Date(events[0].createdAt).getTime();
	const eventTime = new Date(createdAt).getTime();
	return demoNow - eventTime <= windowDays * 24 * 60 * 60 * 1000;
}

/**
 * Resolves a candidate value against a supported option list.
 *
 * @param {unknown} value Candidate option value.
 * @param {Array<{value: string}>} options Supported option records.
 * @param {string} fallback Fallback value.
 * @returns {string} Valid option value.
 */
function normalizeOptionValue(value, options, fallback) {
	const candidate = String(value || '');
	return options.some((option) => option.value === candidate) ? candidate : fallback;
}

/**
 * Finds one audit event without exposing the mutable backing record.
 *
 * @param {string} eventId Audit event identifier.
 * @returns {Record<string, unknown>|undefined} Matching event.
 */
function findEvent(eventId) {
	return events.find((event) => event.id === String(eventId));
}

/**
 * Produces a standard not-found API response.
 *
 * @returns {{error: string, status: number}} Not-found response.
 */
function notFound() {
	return { error: 'Audit event not found.', status: 404 };
}

/**
 * Trims user-authored text to a bounded length.
 *
 * @param {unknown} value Candidate text value.
 * @param {number} maxLength Maximum returned length.
 * @returns {string} Normalized text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').trim().slice(0, maxLength);
}

/**
 * Converts a candidate number into a bounded integer.
 *
 * @param {unknown} value Candidate numeric value.
 * @param {number} minimum Minimum value.
 * @param {number} maximum Maximum value.
 * @param {number} fallback Fallback value.
 * @returns {number} Bounded integer.
 */
function clampNumber(value, minimum, maximum, fallback) {
	const number = Math.floor(Number(value));
	if (!Number.isFinite(number)) return fallback;
	return Math.min(maximum, Math.max(minimum, number));
}

/**
 * Clones JSON-safe demo state before returning it to an API consumer.
 *
 * @param {unknown} value Serializable value.
 * @returns {unknown} Detached clone.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}
