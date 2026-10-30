import { createHash } from 'node:crypto';

const environmentOptions = Object.freeze([
	{ value: 'all', label: 'All environments', description: 'Production and staging runs.' },
	{ value: 'production', label: 'Production', description: 'Customer-facing executions.' },
	{ value: 'staging', label: 'Staging', description: 'Pre-release verification runs.' },
]);

const statusOptions = Object.freeze([
	{ value: 'all', label: 'All outcomes', description: 'Successful, warning, and failed runs.' },
	{ value: 'failed', label: 'Failed', description: 'Runs stopped by an error.' },
	{ value: 'warning', label: 'Needs review', description: 'Completed with a policy or quality warning.' },
	{ value: 'ok', label: 'Completed', description: 'Runs that completed without open issues.' },
]);

const spanTypeOptions = Object.freeze([
	{ value: 'all', label: 'All spans', description: 'Agents, models, tools, and guardrails.' },
	{ value: 'agent', label: 'Agent', description: 'Top-level orchestration spans.' },
	{ value: 'model', label: 'Model', description: 'Prompt and completion calls.' },
	{ value: 'tool', label: 'Tool', description: 'External reads and writes.' },
	{ value: 'guardrail', label: 'Guardrail', description: 'Policy and safety decisions.' },
]);

const ownerOptions = Object.freeze([
	{ value: 'unassigned', label: 'Unassigned', description: 'Leave in the shared observability queue.' },
	{ value: 'mara', label: 'Mara Singh', description: 'Support automation owner.' },
	{ value: 'eli', label: 'Eli Morgan', description: 'Trust and safety engineer.' },
	{ value: 'nora', label: 'Nora Bell', description: 'AI platform on-call.' },
]);

const reviewStateOptions = Object.freeze([
	{ value: 'open', label: 'Open', description: 'Waiting for an investigation owner.' },
	{ value: 'investigating', label: 'Investigating', description: 'Actively being diagnosed.' },
	{ value: 'resolved', label: 'Resolved', description: 'Reviewed with a recorded conclusion.' },
]);

const replayModeOptions = Object.freeze([
	{ value: 'from_span', label: 'Replay from span', description: 'Reuse successful parent context and resume at this span.' },
	{ value: 'full_run', label: 'Replay full run', description: 'Start again from the immutable original input.' },
]);

let runs = createInitialRuns();
let actionSequence = 504;
let accessSequence = 820;

/**
 * Returns the run queue and reusable rich-control options.
 *
 * @returns {Record<string, unknown>} Agent trace bootstrap payload.
 */
export function getAgentRunTraceBootstrap() {
	return cloneValue({
		workspace: {
			name: 'Northstar AI',
			area: 'Run observability',
			actor: 'Steve O’Brien',
			retention: '30 days',
		},
		options: {
			environments: environmentOptions,
			statuses: statusOptions,
			spanTypes: spanTypeOptions,
			owners: ownerOptions,
			reviewStates: reviewStateOptions,
			replayModes: replayModeOptions,
		},
		runs: serializeRunList(),
		defaultRunId: 'run-risk-review-4472',
	});
}

/**
 * Returns one complete run without privileged span payloads.
 *
 * @param {string} runId Run identifier.
 * @returns {Record<string, unknown>} Run detail or structured API error.
 */
export function getAgentRunTraceRun(runId) {
	const run = runs.get(String(runId || ''));
	if (!run) return notFound('Agent run');
	return success('', { run: serializeRun(run) });
}

/**
 * Returns a redacted payload and immutable access evidence for one span.
 *
 * @param {string} runId Run identifier.
 * @param {string} spanId Span identifier.
 * @returns {Record<string, unknown>} Redacted payload access result or API error.
 */
export function getAgentRunTracePayload(runId, spanId) {
	const run = runs.get(String(runId || ''));
	if (!run) return notFound('Agent run');
	const span = run.spans.find((item) => item.id === String(spanId || ''));
	if (!span) return notFound('Trace span');
	const accessedAt = new Date().toISOString();
	const accessId = `access-${++accessSequence}`;
	const payload = {
		input: cloneValue(span.input),
		output: cloneValue(span.output),
		redaction: cloneValue(span.redaction),
		metadata: {
			runId: run.id,
			spanId: span.id,
			promptVersion: run.promptVersion,
			traceRevision: run.revision,
		},
	};
	const access = {
		id: accessId,
		actor: 'Steve O’Brien',
		policy: 'trace-payload-redacted',
		accessedAt,
		proof: createProof({ accessId, runId: run.id, spanId: span.id, accessedAt }),
	};
	return success('Redacted payload loaded with access evidence.', { payload, access });
}

/**
 * Saves ownership and investigation state with optimistic revision protection.
 *
 * @param {string} runId Run identifier.
 * @param {Record<string, unknown>} input Review fields and current revision.
 * @returns {Record<string, unknown>} Updated run or structured API error.
 */
export function updateAgentRunTraceReview(runId, input = {}) {
	const run = runs.get(String(runId || ''));
	if (!run) return notFound('Agent run');
	const revisionError = validateRevision(run, input.revision);
	if (revisionError) return revisionError;
	const ownerId = String(input.ownerId || '');
	const reviewState = String(input.reviewState || '');
	const fields = [];
	if (!ownerOptions.some((option) => option.value === ownerId)) fields.push({ field: 'ownerId', message: 'Choose an available investigation owner.' });
	if (!reviewStateOptions.some((option) => option.value === reviewState)) fields.push({ field: 'reviewState', message: 'Choose an available review state.' });
	if (reviewState === 'investigating' && ownerId === 'unassigned') fields.push({ field: 'ownerId', message: 'Assign an owner before starting an investigation.' });
	if (reviewState === 'resolved' && normalizeText(input.note, 240).length < 12) fields.push({ field: 'note', message: 'Add a conclusion of at least 12 characters before resolving.' });
	if (fields.length) return validation('Check the investigation handoff.', fields);
	const previousState = run.reviewState;
	run.ownerId = ownerId;
	run.reviewState = reviewState;
	run.revision += 1;
	run.updatedAt = new Date().toISOString();
	run.activity.unshift({
		id: `activity-${run.id}-${run.revision}`,
		label: 'Investigation updated',
		detail: `${labelFor(reviewStateOptions, reviewState)} · ${labelFor(ownerOptions, ownerId)}${input.note ? ` · ${normalizeText(input.note, 240)}` : ''}`,
		createdAt: run.updatedAt,
		actor: 'Steve O’Brien',
		previousState,
	});
	return success('Investigation ownership saved.', { run: serializeRun(run), runs: serializeRunList() });
}

/**
 * Creates a replay, eval case, or trace export with immutable receipt evidence.
 *
 * @param {string} runId Run identifier.
 * @param {Record<string, unknown>} input Action request and current revision.
 * @returns {Record<string, unknown>} Updated run and action receipt or API error.
 */
export function createAgentRunTraceAction(runId, input = {}) {
	const run = runs.get(String(runId || ''));
	if (!run) return notFound('Agent run');
	const revisionError = validateRevision(run, input.revision);
	if (revisionError) return revisionError;
	const action = String(input.action || '');
	const span = run.spans.find((item) => item.id === String(input.spanId || ''));
	const fields = [];
	if (!['replay', 'eval', 'export'].includes(action)) fields.push({ field: 'action', message: 'Choose replay, eval case, or export.' });
	if (!span) fields.push({ field: 'spanId', message: 'Choose a span from this run.' });
	if (action !== 'export' && normalizeText(input.reason, 240).length < 12) fields.push({ field: 'reason', message: 'Explain why this action is safe in at least 12 characters.' });
	if (action !== 'export' && input.acknowledged !== true) fields.push({ field: 'acknowledged', message: 'Confirm the selected revision, payload boundary, and action scope.' });
	if (action === 'replay' && !replayModeOptions.some((option) => option.value === input.mode)) fields.push({ field: 'mode', message: 'Choose a supported replay mode.' });
	if (action === 'replay' && span?.status === 'ok') fields.push({ field: 'spanId', message: 'Replay an open warning or failed span, not a completed span.' });
	if (fields.length) return validation('The trace action needs attention.', fields);

	const createdAt = new Date().toISOString();
	const actionId = `${action}-${++actionSequence}`;
	const receipt = {
		id: actionId,
		type: action,
		label: actionLabel(action),
		state: action === 'replay' ? 'queued' : 'created',
		runId: run.id,
		spanId: span.id,
		spanName: span.name,
		mode: action === 'replay' ? input.mode : null,
		reason: action === 'export' ? 'Operator requested a redacted trace export.' : normalizeText(input.reason, 240),
		actor: 'Steve O’Brien',
		promptVersion: run.promptVersion,
		sourceRevision: run.revision,
		createdAt,
		proof: createProof({ actionId, action, runId: run.id, spanId: span.id, revision: run.revision, createdAt }),
	};
	if (action === 'export') {
		receipt.filename = `${run.id}-redacted-trace.json`;
		receipt.export = {
			run: serializeRunSummary(run),
			spans: run.spans.map(serializeSpan),
			redactionPolicy: 'trace-payload-redacted',
		};
	}
	run.actions.unshift(receipt);
	run.revision += 1;
	run.updatedAt = createdAt;
	run.activity.unshift({
		id: `activity-${actionId}`,
		label: receipt.label,
		detail: `${span.name} · ${receipt.state} · source revision ${receipt.sourceRevision}`,
		createdAt,
		actor: receipt.actor,
	});
	return success(actionSuccessMessage(action), { receipt: cloneValue(receipt), run: serializeRun(run), runs: serializeRunList() });
}

/**
 * Restores the seeded trace queue and clears process-local action evidence.
 *
 * @returns {Record<string, unknown>} Fresh bootstrap and selected run payload.
 */
export function resetAgentRunTrace() {
	runs = createInitialRuns();
	actionSequence = 504;
	accessSequence = 820;
	return success('Trace workspace reset to the initial incident queue.', {
		...getAgentRunTraceBootstrap(),
		run: serializeRun(runs.get('run-risk-review-4472')),
	});
}

/**
 * Creates the complete seeded run map.
 *
 * @returns {Map<string, Record<string, unknown>>} Initial process-local run state.
 */
function createInitialRuns() {
	const entries = [
		createRun({
			id: 'run-risk-review-4472',
			title: 'Workspace risk review',
			agent: 'Trust workflow',
			environment: 'production',
			status: 'failed',
			statusLabel: 'Failed',
			statusTone: 'danger',
			startedAt: '2026-08-01T13:42:18.000Z',
			durationMs: 7210,
			costUsd: 0.211,
			tokenCount: 8300,
			promptVersion: 'workspace-risk-v31',
			reviewState: 'open',
			ownerId: 'unassigned',
			summary: 'A policy lookup timed out before the agent could allow or block a bulk invite campaign.',
			tags: ['trust', 'bulk-invite', 'timeout'],
			spans: createRiskSpans(),
		}),
		createRun({
			id: 'run-support-triage-2841',
			title: 'Support triage handoff',
			agent: 'Customer support agent',
			environment: 'production',
			status: 'warning',
			statusLabel: 'Needs review',
			statusTone: 'warning',
			startedAt: '2026-08-01T13:36:04.000Z',
			durationMs: 6840,
			costUsd: 0.183,
			tokenCount: 7800,
			promptVersion: 'support-triage-v17',
			reviewState: 'investigating',
			ownerId: 'mara',
			summary: 'PII redaction masked two fields before a customer-safe handoff entered the queue.',
			tags: ['support', 'handoff', 'redaction'],
			spans: createSupportSpans(),
		}),
		createRun({
			id: 'run-invoice-recovery-1918',
			title: 'Invoice recovery agent',
			agent: 'Billing operations',
			environment: 'staging',
			status: 'ok',
			statusLabel: 'Completed',
			statusTone: 'success',
			startedAt: '2026-08-01T13:20:47.000Z',
			durationMs: 4920,
			costUsd: 0.097,
			tokenCount: 4600,
			promptVersion: 'invoice-recovery-v9',
			reviewState: 'resolved',
			ownerId: 'nora',
			summary: 'The agent verified policy and prepared an approved recovery note without an open issue.',
			tags: ['billing', 'recovery'],
			spans: createInvoiceSpans(),
		}),
	];
	return new Map(entries.map((run) => [run.id, run]));
}

/**
 * Creates one mutable run record with shared revision and activity fields.
 *
 * @param {Record<string, unknown>} input Seed run fields.
 * @returns {Record<string, unknown>} Complete run record.
 */
function createRun(input) {
	return {
		...input,
		revision: 7,
		updatedAt: input.startedAt,
		actions: [],
		activity: [
			{
				id: `activity-${input.id}-created`,
				label: 'Run captured',
				detail: `${input.spans.length} immutable spans ingested from ${input.environment}.`,
				createdAt: input.startedAt,
				actor: 'Trace ingestion',
			},
		],
	};
}

/**
 * Creates the failed trust-workflow span set.
 *
 * @returns {Array<Record<string, unknown>>} Ordered trace spans.
 */
function createRiskSpans() {
	return [
		span('risk-root', null, 'agent', 'Workspace risk review', 'failed', 'Failed', 0, 7210, 0.211, 8300, 'Orchestrates profile, risk scoring, and policy enforcement.', ['agent', 'trust'], { workspaceId: 'wrk_kite', action: 'bulk_invite' }, { stoppedAt: 'risk-policy', retryable: true }),
		span('risk-profile', 'risk-root', 'tool', 'load_workspace_profile', 'ok', 'Completed', 180, 840, 0.002, 0, 'Loads age, verified domain, seats, and invite velocity.', ['tool', 'workspace'], { workspaceId: 'wrk_kite' }, { seats: 42, domainVerified: false, inviteSpike: true }),
		span('risk-model', 'risk-root', 'model', 'Assess campaign risk', 'ok', 'Completed', 1240, 2860, 0.164, 6800, 'Scores invite behavior against known abuse patterns.', ['model', 'risk'], { model: 'atlas-reasoning', examples: 12 }, { riskScore: 78, recommendation: 'manual_review' }),
		span('risk-policy', 'risk-root', 'guardrail', 'moderation_policy_lookup', 'failed', 'Timed out', 4340, 2540, 0.031, 420, 'Policy service timeout stopped the enforcement decision.', ['guardrail', 'policy', 'timeout'], { policy: 'bulk-invite-v5', timeoutMs: 2400, workspaceDomain: '[REDACTED]' }, { error: 'policy_service_timeout', retryAfterMs: 30000 }),
	];
}

/**
 * Creates the warning support-workflow span set.
 *
 * @returns {Array<Record<string, unknown>>} Ordered trace spans.
 */
function createSupportSpans() {
	return [
		span('support-root', null, 'agent', 'Support triage agent', 'warning', 'Needs review', 0, 6840, 0.183, 7800, 'Routes an enterprise ticket and prepares a human handoff.', ['agent', 'support'], { ticketId: 'tic_9182', workspaceId: 'wrk_northstar' }, { queue: 'enterprise-success', escalation: true }),
		span('support-classify', 'support-root', 'model', 'Classify ticket intent', 'ok', 'Completed', 220, 1160, 0.044, 2100, 'Extracts billing impact and urgency from the ticket.', ['model', 'classification'], { model: 'atlas-mini', promptVersion: 'support-triage-v17' }, { intent: 'billing-access-risk', urgency: 'high', confidence: 0.89 }),
		span('support-lookup', 'support-root', 'tool', 'lookup_customer', 'ok', 'Completed', 1480, 620, 0.002, 0, 'Reads plan, renewal date, owner, and escalation state.', ['tool', 'crm'], { customerId: 'cus_northstar', include: ['plan', 'owner', 'risk'] }, { plan: 'Enterprise', renewal: '2027-07-01', owner: 'Ari Patel' }),
		span('support-guardrail', 'support-root', 'guardrail', 'PII redaction check', 'warning', 'Masked output', 2280, 780, 0.009, 840, 'Masks contract terms before shared-queue delivery.', ['guardrail', 'redaction'], { policy: 'customer-data-v4', fields: ['contractMinimum', 'billingEmail'] }, { maskedFields: 2, publishable: true }),
		span('support-draft', 'support-root', 'model', 'Draft human handoff', 'ok', 'Completed', 3280, 2440, 0.116, 4900, 'Writes the escalation summary and customer-safe next action.', ['model', 'handoff'], { model: 'atlas-reasoning', format: 'support_handoff' }, { sections: 4, action: 'assign_success_manager', confidence: 0.86 }),
		span('support-queue', 'support-root', 'tool', 'create_queue_item', 'ok', 'Completed', 5940, 510, 0.001, 0, 'Creates the queue item with masked context and audit data.', ['tool', 'queue'], { queue: 'enterprise-success', priority: 'high' }, { itemId: 'queue_7741', sla: '2h' }),
	];
}

/**
 * Creates the successful billing-workflow span set.
 *
 * @returns {Array<Record<string, unknown>>} Ordered trace spans.
 */
function createInvoiceSpans() {
	return [
		span('invoice-root', null, 'agent', 'Invoice recovery agent', 'ok', 'Completed', 0, 4920, 0.097, 4600, 'Reviews an overdue invoice and prepares a finance-safe action.', ['agent', 'billing'], { invoiceId: 'in_2048', workspaceId: 'wrk_boreal' }, { recommendation: 'send_manager_note', confidence: 0.91 }),
		span('invoice-load', 'invoice-root', 'tool', 'get_invoice_state', 'ok', 'Completed', 260, 530, 0.001, 0, 'Checks balance, dunning state, payment method, and credits.', ['tool', 'billing-api'], { invoiceId: 'in_2048' }, { balance: 2280, dunning: 'paused', credits: 400 }),
		span('invoice-policy', 'invoice-root', 'guardrail', 'Collections policy', 'ok', 'Passed', 940, 480, 0.006, 620, 'Confirms outreach is permitted for this tier and invoice age.', ['guardrail', 'finance'], { policy: 'collections-v2', invoiceAgeDays: 18 }, { permitted: true, tone: 'collaborative' }),
		span('invoice-compose', 'invoice-root', 'model', 'Compose recovery note', 'ok', 'Completed', 1540, 2200, 0.086, 3900, 'Drafts a payment-resolution note with approved language.', ['model', 'copy'], { model: 'atlas-mini', promptVersion: 'invoice-recovery-v9' }, { tone: 'helpful', links: 2, approvalRequired: false }),
	];
}

/**
 * Creates a normalized trace span and its default redaction metadata.
 *
 * @param {string} id Span identifier.
 * @param {string|null} parentId Parent span identifier.
 * @param {string} type Span type.
 * @param {string} name Human-readable name.
 * @param {string} status Machine status.
 * @param {string} statusLabel Visible status.
 * @param {number} startMs Start offset.
 * @param {number} durationMs Duration.
 * @param {number} costUsd Estimated cost.
 * @param {number} tokens Token count.
 * @param {string} summary Span summary.
 * @param {Array<string>} tags Search tags.
 * @param {Record<string, unknown>} input Redacted input.
 * @param {Record<string, unknown>} output Redacted output.
 * @returns {Record<string, unknown>} Complete trace span.
 */
function span(id, parentId, type, name, status, statusLabel, startMs, durationMs, costUsd, tokens, summary, tags, input, output) {
	return {
		id,
		parentId,
		type,
		name,
		status,
		statusLabel,
		statusTone: status === 'failed' ? 'danger' : status === 'warning' ? 'warning' : 'success',
		startMs,
		durationMs,
		costUsd,
		tokens,
		summary,
		tags,
		input,
		output,
		redaction: {
			state: 'redacted',
			policy: 'customer-data-v4',
			maskedFields: JSON.stringify(input).includes('[REDACTED]') ? 1 : 0,
		},
	};
}

/**
 * Serializes all run summaries in reverse chronological order.
 *
 * @returns {Array<Record<string, unknown>>} Run queue.
 */
function serializeRunList() {
	return [...runs.values()].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)).map(serializeRunSummary);
}

/**
 * Serializes one run for the trace workspace.
 *
 * @param {Record<string, unknown>} run Mutable run record.
 * @returns {Record<string, unknown>} Public run detail.
 */
function serializeRun(run) {
	return cloneValue({
		...serializeRunSummary(run),
		spans: run.spans.map(serializeSpan),
		actions: run.actions,
		activity: run.activity,
	});
}

/**
 * Serializes one compact run summary.
 *
 * @param {Record<string, unknown>} run Mutable run record.
 * @returns {Record<string, unknown>} Public run summary.
 */
function serializeRunSummary(run) {
	const issueCount = run.spans.filter((item) => item.status !== 'ok').length;
	const criticalSpan = run.spans.reduce((longest, item) => item.durationMs > longest.durationMs ? item : longest, run.spans[0]);
	return {
		id: run.id,
		title: run.title,
		agent: run.agent,
		environment: run.environment,
		status: run.status,
		statusLabel: run.statusLabel,
		statusTone: run.statusTone,
		startedAt: run.startedAt,
		updatedAt: run.updatedAt,
		durationMs: run.durationMs,
		costUsd: run.costUsd,
		tokenCount: run.tokenCount,
		promptVersion: run.promptVersion,
		revision: run.revision,
		reviewState: run.reviewState,
		ownerId: run.ownerId,
		summary: run.summary,
		tags: run.tags,
		spanCount: run.spans.length,
		issueCount,
		criticalSpan: criticalSpan?.name || '',
		actionCount: run.actions.length,
	};
}

/**
 * Removes privileged payload data from a span list response.
 *
 * @param {Record<string, unknown>} item Mutable span.
 * @returns {Record<string, unknown>} Safe span metadata.
 */
function serializeSpan(item) {
	return {
		id: item.id,
		parentId: item.parentId,
		type: item.type,
		name: item.name,
		status: item.status,
		statusLabel: item.statusLabel,
		statusTone: item.statusTone,
		startMs: item.startMs,
		durationMs: item.durationMs,
		costUsd: item.costUsd,
		tokens: item.tokens,
		summary: item.summary,
		tags: item.tags,
		payloadState: 'available_redacted',
	};
}

/**
 * Validates an optimistic run revision.
 *
 * @param {Record<string, unknown>} run Current run.
 * @param {unknown} revision Submitted revision.
 * @returns {Record<string, unknown>|null} Conflict payload or null.
 */
function validateRevision(run, revision) {
	if (Number(revision) === Number(run.revision)) return null;
	return conflict('This trace changed in another tab. The latest run has been returned.', {
		code: 'trace_revision_conflict',
		run: serializeRun(run),
		runs: serializeRunList(),
	});
}

/**
 * Returns a label from a reusable option collection.
 *
 * @param {Array<Record<string, string>>} options Options to search.
 * @param {string} value Selected value.
 * @returns {string} Human-readable label.
 */
function labelFor(options, value) {
	return options.find((option) => option.value === value)?.label || value;
}

/**
 * Returns the visible label for an immutable trace action.
 *
 * @param {string} action Action key.
 * @returns {string} Action label.
 */
function actionLabel(action) {
	return { replay: 'Replay queued', eval: 'Eval case created', export: 'Trace export created' }[action] || 'Trace action created';
}

/**
 * Returns user guidance for a successful trace action.
 *
 * @param {string} action Action key.
 * @returns {string} Success message.
 */
function actionSuccessMessage(action) {
	return {
		replay: 'Replay queued with source revision and operator evidence.',
		eval: 'Regression eval case created from the selected span.',
		export: 'Redacted trace export created with immutable proof.',
	}[action] || 'Trace action created.';
}

/**
 * Normalizes bounded single-line text.
 *
 * @param {unknown} value Raw value.
 * @param {number} maxLength Maximum length.
 * @returns {string} Normalized text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/**
 * Creates a deterministic evidence hash.
 *
 * @param {Record<string, unknown>} value Evidence input.
 * @returns {string} SHA-256 proof.
 */
function createProof(value) {
	return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/**
 * Clones JSON-safe demo data before returning it to callers.
 *
 * @template T
 * @param {T} value Value to clone.
 * @returns {T} Detached clone.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}

/**
 * Creates a successful API payload.
 *
 * @param {string} message User-facing message.
 * @param {Record<string, unknown>} payload Additional response values.
 * @returns {Record<string, unknown>} Success payload.
 */
function success(message, payload = {}) {
	return { ok: true, ...(message ? { message } : {}), ...payload };
}

/**
 * Creates a validation API payload.
 *
 * @param {string} message User-facing message.
 * @param {Array<Record<string, string>>} fields Field errors.
 * @returns {Record<string, unknown>} Validation error.
 */
function validation(message, fields) {
	return { error: { code: 'validation_error', message, fields }, status: 422 };
}

/**
 * Creates a conflict API payload.
 *
 * @param {string} message User-facing message.
 * @param {Record<string, unknown>} payload Recovery state.
 * @returns {Record<string, unknown>} Conflict error.
 */
function conflict(message, payload = {}) {
	return { error: { code: payload.code || 'conflict', message, ...payload }, status: 409 };
}

/**
 * Creates a not-found API payload.
 *
 * @param {string} resource Resource label.
 * @returns {Record<string, unknown>} Not-found error.
 */
function notFound(resource) {
	return { error: { code: 'not_found', message: `${resource} not found.` }, status: 404 };
}
