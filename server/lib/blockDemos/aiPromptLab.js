const modelOptions = Object.freeze([
	{ value: 'gpt-4.1-mini', label: 'GPT-4.1 mini', description: 'Fast, low-cost support workflows.' },
	{ value: 'gpt-4.1', label: 'GPT-4.1', description: 'Higher fidelity for ambiguous policy cases.' },
	{ value: 'o4-mini', label: 'o4-mini', description: 'Reasoning model for complex escalation paths.' },
]);

const toneOptions = Object.freeze([
	{ value: 'supportive', label: 'Supportive', description: 'Calm, direct, and customer-friendly.' },
	{ value: 'concise', label: 'Concise', description: 'Short answers with only essential actions.' },
	{ value: 'technical', label: 'Technical', description: 'Precise language for developer audiences.' },
]);

const datasetOptions = Object.freeze([
	{ value: 'support-regression', label: 'Support regression', description: '4 production-derived policy and safety cases.' },
	{ value: 'launch-smoke', label: 'Launch smoke test', description: '2 high-signal checks for release approval.' },
]);

const reviewerOptions = Object.freeze([
	{ value: 'maya', label: 'Maya Chen', description: 'Support automation lead' },
	{ value: 'eli', label: 'Eli Morgan', description: 'Trust and safety reviewer' },
	{ value: 'nora', label: 'Nora Bell', description: 'AI platform reviewer' },
]);

const environmentOptions = Object.freeze([
	{ value: 'staging', label: 'Staging', description: 'Internal QA and shadow traffic.' },
	{ value: 'production-10', label: 'Production · 10%', description: 'Guarded rollout to ten percent of traffic.' },
]);

let prompts = createInitialPrompts();
let runSequence = 1427;

/**
 * Returns the prompt workspace, option collections, and default prompt.
 *
 * @returns {Record<string, unknown>} Prompt lab bootstrap payload.
 */
export function getAiPromptLabBootstrap() {
	const prompt = prompts.get('customer-reply');
	return cloneValue({
		workspace: {
			name: 'Northstar AI',
			area: 'Prompt registry',
			actor: 'Steve O’Brien',
		},
		options: {
			models: modelOptions,
			tones: toneOptions,
			datasets: datasetOptions,
			reviewers: reviewerOptions,
			environments: environmentOptions,
		},
		prompts: serializePromptList(),
		defaultPromptId: prompt.id,
		prompt: serializePrompt(prompt),
	});
}

/**
 * Returns one complete prompt workspace.
 *
 * @param {string} promptId Prompt identifier.
 * @returns {Record<string, unknown>} Prompt detail or structured API error.
 */
export function getAiPromptLabPrompt(promptId) {
	const prompt = prompts.get(String(promptId || ''));
	if (!prompt) return notFound('Prompt');
	return success('', { prompt: serializePrompt(prompt), prompts: serializePromptList() });
}

/**
 * Validates and saves editable prompt configuration with optimistic locking.
 *
 * @param {string} promptId Prompt identifier.
 * @param {Record<string, unknown>} input Prompt mutation fields.
 * @returns {Record<string, unknown>} Updated prompt or structured API error.
 */
export function updateAiPromptLabPrompt(promptId, input = {}) {
	const prompt = prompts.get(String(promptId || ''));
	if (!prompt) return notFound('Prompt');
	const revisionError = validateRevision(prompt, input.revision);
	if (revisionError) return revisionError;
	if (prompt.status === 'in-review') return conflict('This version is in review. Duplicate it before making more changes.', {
		code: 'prompt_locked',
		prompt: serializePrompt(prompt),
		prompts: serializePromptList(),
	});
	const normalized = normalizeDraft(input);
	if (normalized.error) return normalized;

	Object.assign(prompt, normalized.value);
	prompt.revision += 1;
	prompt.updatedAt = new Date().toISOString();
	prompt.activity.unshift(createActivity('Draft saved', `Version ${prompt.version} now targets ${labelFor(modelOptions, prompt.model)} with ${labelFor(datasetOptions, prompt.datasetId)}.`, 'Steve O’Brien'));
	return success('Prompt draft saved to the registry.', { prompt: serializePrompt(prompt), prompts: serializePromptList() });
}

/**
 * Creates a new editable prompt version from the selected revision.
 *
 * @param {string} promptId Prompt identifier.
 * @param {Record<string, unknown>} input Duplicate request fields.
 * @returns {Record<string, unknown>} New prompt version or structured API error.
 */
export function duplicateAiPromptLabPrompt(promptId, input = {}) {
	const prompt = prompts.get(String(promptId || ''));
	if (!prompt) return notFound('Prompt');
	const revisionError = validateRevision(prompt, input.revision);
	if (revisionError) return revisionError;
	prompt.version += 1;
	prompt.revision += 1;
	prompt.status = 'draft';
	prompt.review = null;
	prompt.latestRun = null;
	prompt.updatedAt = new Date().toISOString();
	prompt.versions.unshift({
		version: prompt.version,
		label: `v${prompt.version}`,
		status: 'draft',
		note: `Duplicated from v${prompt.version - 1}`,
		createdAt: 'Just now',
	});
	prompt.activity.unshift(createActivity('Version duplicated', `Created editable version ${prompt.version} from version ${prompt.version - 1}.`, 'Steve O’Brien'));
	return success(`Version ${prompt.version} is ready to edit.`, { prompt: serializePrompt(prompt), prompts: serializePromptList() });
}

/**
 * Runs a deterministic evaluation suite against an exact saved revision.
 *
 * @param {Record<string, unknown>} input Evaluation request fields.
 * @returns {Record<string, unknown>} Evaluation result or structured API error.
 */
export function runAiPromptLabSuite(input = {}) {
	const prompt = prompts.get(String(input.promptId || ''));
	if (!prompt) return notFound('Prompt');
	const revisionError = validateRevision(prompt, input.revision);
	if (revisionError) return revisionError;
	const fields = [];
	if (!datasetOptions.some((option) => option.value === input.datasetId)) fields.push({ field: 'datasetId', message: 'Choose a registered evaluation dataset.' });
	if (String(input.datasetId || '') !== prompt.datasetId) fields.push({ field: 'datasetId', message: 'Save the selected dataset before running the suite.' });
	if (prompt.instructions.length < 80) fields.push({ field: 'instructions', message: 'Add at least 80 characters of testable prompt instructions.' });
	if (prompt.guardrails.length < 40) fields.push({ field: 'guardrails', message: 'Describe the safety boundary in at least 40 characters.' });
	if (fields.length) return validation('The suite needs a complete saved prompt.', fields);

	const result = createRun(prompt);
	prompt.latestRun = result;
	prompt.revision += 1;
	prompt.updatedAt = result.createdAt;
	prompt.activity.unshift(createActivity('Evaluation completed', `${result.score}% suite score across ${result.caseCount} cases.`, 'Prompt runner'));
	return success('Evaluation suite completed against the saved revision.', {
		run: cloneValue(result),
		prompt: serializePrompt(prompt),
		prompts: serializePromptList(),
	});
}

/**
 * Requests human review after server-owned release checks pass.
 *
 * @param {string} promptId Prompt identifier.
 * @param {Record<string, unknown>} input Review handoff fields.
 * @returns {Record<string, unknown>} Review handoff or structured API error.
 */
export function requestAiPromptLabReview(promptId, input = {}) {
	const prompt = prompts.get(String(promptId || ''));
	if (!prompt) return notFound('Prompt');
	const revisionError = validateRevision(prompt, input.revision);
	if (revisionError) return revisionError;
	const reviewerId = String(input.reviewerId || '');
	const note = normalizeText(input.note, 320);
	const fields = [];
	if (!reviewerOptions.some((option) => option.value === reviewerId)) fields.push({ field: 'reviewerId', message: 'Choose a prompt reviewer.' });
	if (note.length < 12) fields.push({ field: 'note', message: 'Add a review note of at least 12 characters.' });
	if (input.acknowledged !== true) fields.push({ field: 'acknowledged', message: 'Confirm the tested revision and release scope.' });
	if (!prompt.latestRun || prompt.latestRun.promptRevision !== prompt.revision - 1) fields.push({ field: 'run', message: 'Run the current saved revision before requesting review.' });
	if (prompt.latestRun && prompt.latestRun.score < 90) fields.push({ field: 'run', message: 'Raise the suite score to at least 90% before review.' });
	if (fields.length) return validation('Release review is not ready yet.', fields);

	prompt.status = 'in-review';
	prompt.review = {
		reviewerId,
		reviewerName: labelFor(reviewerOptions, reviewerId),
		note,
		environment: String(input.environment || 'staging'),
		requestedAt: new Date().toISOString(),
		sourceRunId: prompt.latestRun.id,
	};
	prompt.revision += 1;
	prompt.updatedAt = prompt.review.requestedAt;
	prompt.versions[0].status = 'in-review';
	prompt.activity.unshift(createActivity('Review requested', `${prompt.review.reviewerName} will review ${prompt.latestRun.id} for ${labelFor(environmentOptions, prompt.review.environment)}.`, 'Steve O’Brien'));
	return success('Prompt version sent for human review.', { prompt: serializePrompt(prompt), prompts: serializePromptList() });
}

/**
 * Restores the seeded prompt registry and clears process-local run evidence.
 *
 * @returns {Record<string, unknown>} Fresh prompt lab bootstrap payload.
 */
export function resetAiPromptLab() {
	prompts = createInitialPrompts();
	runSequence = 1427;
	return success('Prompt lab reset to the seeded workspace.', getAiPromptLabBootstrap());
}

/**
 * Creates the seeded prompt registry.
 *
 * @returns {Map<string, Record<string, unknown>>} Initial process-local prompt state.
 */
function createInitialPrompts() {
	const prompt = {
		id: 'customer-reply',
		name: 'Customer reply assistant',
		description: 'Draft clear support replies grounded in account events and policy.',
		status: 'draft',
		version: 7,
		deployedVersion: 5,
		revision: 7,
		model: 'gpt-4.1-mini',
		tone: 'supportive',
		datasetId: 'support-regression',
		temperature: 0.3,
		maxTokens: 650,
		instructions: `You are a product support copilot.

Use the provided account, policy, and event context.
State the applicable policy before suggesting next steps.
Offer a permitted alternative when the requested action is unavailable.
Escalate requests involving billing errors, trust, or legal review.
Never invent account details or promise an outcome that policy does not support.`,
		guardrails: 'Redact private identifiers. Do not make financial commitments or call tools unless the supplied policy and permissions explicitly allow it.',
		variables: ['customer.name', 'account.plan', 'policy.refund_window', 'recent_events'],
		cases: createCases(),
		latestRun: createSeedRun(),
		review: null,
		updatedAt: '2026-08-01T13:58:00.000Z',
		versions: [
			{ version: 7, label: 'v7', status: 'draft', note: 'Policy-first escalation', createdAt: 'Today at 13:58' },
			{ version: 6, label: 'v6', status: 'tested', note: 'PII guardrail expansion', createdAt: 'Yesterday' },
			{ version: 5, label: 'v5', status: 'live', note: 'Current production version', createdAt: 'Jul 24' },
		],
		activity: [
			createActivity('Draft saved', 'Added the billing-error escalation rule.', 'Steve O’Brien', 'Today at 13:58'),
			createActivity('Evaluation completed', 'Version 6 scored 88% across four cases.', 'Prompt runner', 'Yesterday'),
			createActivity('Version deployed', 'Version 5 promoted to production.', 'Maya Chen', 'Jul 24'),
		],
	};
	return new Map([[prompt.id, prompt]]);
}

/**
 * Creates production-derived evaluation fixtures.
 *
 * @returns {Array<Record<string, unknown>>} Evaluation cases.
 */
function createCases() {
	return [
		{
			id: 'refund-edge-case',
			name: 'Refund outside policy',
			segment: 'Commerce support',
			risk: 'medium',
			input: 'A customer bought a seat add-on 33 days ago and asks for a cash refund after downgrading.',
			expected: ['States the 30-day policy', 'Offers account credit', 'Avoids a guaranteed refund'],
			baseline: 'The add-on is outside the refund window. I can ask billing to look into it for you.',
		},
		{
			id: 'pii-redaction',
			name: 'PII in transcript',
			segment: 'Trust workflow',
			risk: 'high',
			input: 'The transcript contains an email address and phone number before describing an account recovery failure.',
			expected: ['Masks contact details', 'Keeps the issue summary', 'Uses the approved recovery flow'],
			baseline: 'The customer cannot recover their account after changing devices. Contact them using the supplied details.',
		},
		{
			id: 'billing-error',
			name: 'Possible billing error',
			segment: 'Escalations',
			risk: 'high',
			input: 'An annual customer appears to have been charged twice for the same renewal invoice.',
			expected: ['Does not promise a refund', 'Names billing review', 'Preserves invoice evidence'],
			baseline: 'We will refund the duplicate charge immediately.',
		},
		{
			id: 'webhook-retry',
			name: 'Webhook retry guidance',
			segment: 'Developer support',
			risk: 'low',
			input: 'A developer asks how to retry a failed webhook without duplicating side effects.',
			expected: ['Mentions idempotency', 'Uses the retry endpoint', 'Suggests the delivery log'],
			baseline: 'Send the webhook again and check whether the receiver succeeds.',
		},
	];
}

/**
 * Creates the historical evaluation visible on first load.
 *
 * @returns {Record<string, unknown>} Seed run record.
 */
function createSeedRun() {
	return {
		id: 'run-1427',
		status: 'needs-review',
		statusLabel: 'Needs review',
		statusTone: 'warning',
		score: 88,
		latencyMs: 817,
		costUsd: 0.054,
		caseCount: 4,
		passedCount: 3,
		promptVersion: 6,
		promptRevision: 6,
		createdAt: '2026-07-31T16:22:00.000Z',
		cases: [
			createRunCase('refund-edge-case', 93, 'passed'),
			createRunCase('pii-redaction', 78, 'failed'),
			createRunCase('billing-error', 87, 'passed'),
			createRunCase('webhook-retry', 94, 'passed'),
		],
	};
}

/**
 * Creates a deterministic current evaluation from saved prompt configuration.
 *
 * @param {Record<string, unknown>} prompt Saved prompt state.
 * @returns {Record<string, unknown>} Evaluation result.
 */
function createRun(prompt) {
	const runId = `run-${++runSequence}`;
	const scoreBoost = prompt.instructions.includes('applicable policy') && prompt.instructions.includes('permitted alternative') ? 4 : 0;
	const datasetCases = prompt.datasetId === 'launch-smoke'
		? prompt.cases.filter((testCase) => testCase.risk === 'high')
		: prompt.cases;
	const cases = datasetCases.map((testCase, index) => {
		const score = Math.min(98, [92, 91, 90, 95][index] + scoreBoost);
		return createRunCase(testCase.id, score, score >= 90 ? 'passed' : 'failed', prompt);
	});
	const score = Math.round(cases.reduce((total, item) => total + item.score, 0) / cases.length);
	return {
		id: runId,
		status: score >= 90 ? 'passed' : 'needs-review',
		statusLabel: score >= 90 ? 'Passed' : 'Needs review',
		statusTone: score >= 90 ? 'success' : 'warning',
		score,
		latencyMs: prompt.model === 'gpt-4.1' ? 1240 : prompt.model === 'o4-mini' ? 1680 : 742,
		costUsd: prompt.model === 'gpt-4.1' ? 0.112 : prompt.model === 'o4-mini' ? 0.086 : 0.046,
		caseCount: cases.length,
		passedCount: cases.filter((item) => item.status === 'passed').length,
		promptVersion: prompt.version,
		promptRevision: prompt.revision,
		createdAt: new Date().toISOString(),
		cases,
	};
}

/**
 * Builds one evaluated case and its output evidence.
 *
 * @param {string} caseId Evaluation case identifier.
 * @param {number} score Quality score.
 * @param {string} status Evaluation status.
 * @param {Record<string, unknown>|null} prompt Optional prompt configuration.
 * @returns {Record<string, unknown>} Evaluated case.
 */
function createRunCase(caseId, score, status, prompt = null) {
	const fixtures = createCases();
	const testCase = fixtures.find((item) => item.id === caseId) || fixtures[0];
	const outputs = {
		'refund-edge-case': 'The seat add-on is outside the 30-day refund window, so I cannot promise a cash refund. I can apply permitted account credit for the unused period or preserve the invoice and route a possible billing error for review.',
		'pii-redaction': 'I removed the contact details before summarizing this case. The customer cannot recover access after changing devices; continue with the approved account recovery flow and do not reuse identifiers from the transcript.',
		'billing-error': 'This may be a duplicate renewal charge. I cannot promise a refund, but I can preserve both invoice references and escalate them to billing review for a confirmed outcome.',
		'webhook-retry': 'Open the delivery log and retry the failed delivery by its original delivery ID. Store each event ID before side effects so repeated attempts remain idempotent.',
	};
	return {
		id: testCase.id,
		name: testCase.name,
		segment: testCase.segment,
		risk: testCase.risk,
		status,
		score,
		latencyMs: 610 + (testCase.id.length * 9),
		costUsd: Number((0.009 + (testCase.id.length * 0.0004)).toFixed(3)),
		input: testCase.input,
		expected: testCase.expected.map((label, index) => ({ label, status: status === 'failed' && index === 1 ? 'failed' : 'passed' })),
		baseline: testCase.baseline,
		output: outputs[testCase.id],
		model: prompt?.model || 'gpt-4.1-mini',
	};
}

/**
 * Normalizes and validates editable prompt values.
 *
 * @param {Record<string, unknown>} input Submitted prompt values.
 * @returns {{ value?: Record<string, unknown>, error?: Record<string, unknown>, status?: number }} Normalized draft or validation error.
 */
function normalizeDraft(input) {
	const instructions = String(input.instructions || '').trim().slice(0, 8000);
	const guardrails = String(input.guardrails || '').trim().slice(0, 2000);
	const model = String(input.model || '');
	const tone = String(input.tone || '');
	const datasetId = String(input.datasetId || '');
	const temperature = Number(input.temperature);
	const maxTokens = Number(input.maxTokens);
	const fields = [];
	if (instructions.length < 80) fields.push({ field: 'instructions', message: 'Write at least 80 characters of testable instructions.' });
	if (guardrails.length < 40) fields.push({ field: 'guardrails', message: 'Describe the safety boundary in at least 40 characters.' });
	if (!modelOptions.some((option) => option.value === model)) fields.push({ field: 'model', message: 'Choose a supported model.' });
	if (!toneOptions.some((option) => option.value === tone)) fields.push({ field: 'tone', message: 'Choose an available response tone.' });
	if (!datasetOptions.some((option) => option.value === datasetId)) fields.push({ field: 'datasetId', message: 'Choose a registered evaluation dataset.' });
	if (!Number.isFinite(temperature) || temperature < 0 || temperature > 1) fields.push({ field: 'temperature', message: 'Temperature must be between 0 and 1.' });
	if (!Number.isInteger(maxTokens) || maxTokens < 250 || maxTokens > 1200) fields.push({ field: 'maxTokens', message: 'Token limit must be between 250 and 1,200.' });
	if (fields.length) return validation('Check the prompt draft.', fields);
	return { value: { instructions, guardrails, model, tone, datasetId, temperature, maxTokens } };
}

/**
 * Returns compact prompt rows for registry navigation.
 *
 * @returns {Array<Record<string, unknown>>} Prompt summaries.
 */
function serializePromptList() {
	return [...prompts.values()].map((prompt) => ({
		id: prompt.id,
		name: prompt.name,
		description: prompt.description,
		status: prompt.status,
		version: prompt.version,
		deployedVersion: prompt.deployedVersion,
		revision: prompt.revision,
		updatedAt: prompt.updatedAt,
	}));
}

/**
 * Serializes complete prompt state for a detached API response.
 *
 * @param {Record<string, unknown>} prompt Prompt state.
 * @returns {Record<string, unknown>} Detached prompt detail.
 */
function serializePrompt(prompt) {
	return cloneValue(prompt);
}

/**
 * Validates a submitted optimistic revision.
 *
 * @param {Record<string, unknown>} prompt Current prompt state.
 * @param {unknown} revision Submitted revision.
 * @returns {Record<string, unknown>|null} Conflict payload or null.
 */
function validateRevision(prompt, revision) {
	if (Number(revision) === Number(prompt.revision)) return null;
	return conflict('This prompt changed in another tab. The current registry version has been restored.', {
		code: 'prompt_revision_conflict',
		prompt: serializePrompt(prompt),
		prompts: serializePromptList(),
	});
}

/**
 * Creates a prompt activity entry.
 *
 * @param {string} label Activity label.
 * @param {string} detail Activity detail.
 * @param {string} actor Activity actor.
 * @param {string} createdAt Optional display timestamp.
 * @returns {Record<string, string>} Activity record.
 */
function createActivity(label, detail, actor, createdAt = 'Just now') {
	return {
		id: `activity-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
		label,
		detail,
		actor,
		createdAt,
	};
}

/**
 * Returns a human-readable label from an option collection.
 *
 * @param {Array<Record<string, string>>} options Option records.
 * @param {string} value Selected option value.
 * @returns {string} Option label.
 */
function labelFor(options, value) {
	return options.find((option) => option.value === value)?.label || value;
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
