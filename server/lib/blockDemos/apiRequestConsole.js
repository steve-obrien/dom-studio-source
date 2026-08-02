const environmentOptions = Object.freeze([
	{
		value: 'staging',
		label: 'Staging',
		description: 'Mirrored schema with isolated test records.',
		baseUrl: 'https://staging-api.northstar.example',
		status: 'Safe',
		tone: 'success',
		variables: [
			{ name: 'customer_id', value: 'cus_1842', secret: false },
			{ name: 'event_id', value: 'evt_2091', secret: false },
			{ name: 'API_KEY', value: '••••9A2C', secret: true },
		],
	},
	{
		value: 'production',
		label: 'Production',
		description: 'Live customer data with audited write protection.',
		baseUrl: 'https://api.northstar.example',
		status: 'Protected',
		tone: 'danger',
		variables: [
			{ name: 'customer_id', value: 'cus_1842', secret: false },
			{ name: 'event_id', value: 'evt_2091', secret: false },
			{ name: 'API_KEY', value: '••••71FD', secret: true },
		],
	},
	{
		value: 'local',
		label: 'Local tunnel',
		description: 'Developer sandbox forwarded through the proxy.',
		baseUrl: 'https://tunnel.northstar.example',
		status: 'Developer',
		tone: 'info',
		variables: [
			{ name: 'customer_id', value: 'cus_local', secret: false },
			{ name: 'event_id', value: 'evt_local', secret: false },
			{ name: 'API_KEY', value: '••••LOCAL', secret: true },
		],
	},
]);

const methodOptions = Object.freeze([
	{ value: 'GET', label: 'GET', description: 'Read a resource without changing it.' },
	{ value: 'POST', label: 'POST', description: 'Create a resource or command.' },
	{ value: 'PATCH', label: 'PATCH', description: 'Update part of a resource.' },
	{ value: 'DELETE', label: 'DELETE', description: 'Remove or schedule removal.' },
]);

const authOptions = Object.freeze([
	{ value: 'workspace-key', label: 'Workspace API key', description: 'Injected and redacted by the server proxy.' },
	{ value: 'oauth', label: 'OAuth session', description: 'Uses the current workspace authorization.' },
	{ value: 'none', label: 'No authentication', description: 'Useful for confirming protected responses.' },
]);

const collectionOptions = Object.freeze([
	{ value: 'billing', label: 'Billing', description: 'Invoices and payment operations.' },
	{ value: 'customers', label: 'Customers', description: 'Customer profiles and lifecycle data.' },
	{ value: 'operations', label: 'Operations', description: 'Events and platform commands.' },
]);

const visibilityOptions = Object.freeze([
	{ value: 'team', label: 'Team', description: 'Available to everyone in this workspace.' },
	{ value: 'private', label: 'Private', description: 'Visible only to the template owner.' },
]);

const scopeOptions = Object.freeze([
	{ value: 'customers:read', label: 'Read customers', description: 'Inspect customer profiles and metadata.', group: 'Customers' },
	{ value: 'customers:write', label: 'Write customers', description: 'Update contact and lifecycle fields.', group: 'Customers' },
	{ value: 'billing:read', label: 'Read billing', description: 'Inspect invoices and payment state.', group: 'Billing' },
	{ value: 'billing:write', label: 'Write billing', description: 'Create invoices and billing changes.', group: 'Billing' },
	{ value: 'events:replay', label: 'Replay events', description: 'Replay an event delivery.', group: 'Operations' },
	{ value: 'admin:command', label: 'Admin command', description: 'Run a protected operational command.', group: 'Administration' },
]);

let templateSequence = 120;
let runSequence = 8200;
let templates = createInitialTemplates();
let runs = createInitialRuns();

/**
 * Returns the complete API console workspace without secret material.
 *
 * @returns {Record<string, unknown>} Bootstrap options, templates, and recent runs.
 */
export function getApiRequestConsoleBootstrap() {
	const defaultTemplate = templates.get('template-create-invoice');
	return cloneValue({
		workspace: {
			name: 'Northstar Platform',
			actor: 'Steve O’Brien',
			proxy: 'EU West · audit capture enabled',
		},
		policy: {
			productionWritesRequireAcknowledgement: true,
			credentials: 'Server-injected and redacted',
			historyRetention: '30 days',
		},
		options: {
			environments: environmentOptions,
			methods: methodOptions,
			auth: authOptions,
			collections: collectionOptions,
			visibility: visibilityOptions,
			scopes: scopeOptions,
		},
		templates: serializeTemplates(),
		runs: serializeRuns(),
		defaultTemplateId: defaultTemplate.id,
		template: serializeTemplate(defaultTemplate),
		run: serializeRun(runs[0]),
	});
}

/**
 * Returns one saved request template.
 *
 * @param {string} templateId Template identifier.
 * @returns {Record<string, unknown>} Template result or API error.
 */
export function getApiRequestConsoleTemplate(templateId) {
	const template = templates.get(String(templateId || ''));
	if (!template) return notFound('Request template');
	return success('', { template: serializeTemplate(template), templates: serializeTemplates() });
}

/**
 * Creates a reusable request template.
 *
 * @param {Record<string, unknown>} input Request template fields.
 * @returns {Record<string, unknown>} Created template or validation error.
 */
export function createApiRequestConsoleTemplate(input = {}) {
	const normalized = normalizeTemplate(input);
	if (normalized.error) return normalized;
	const now = new Date().toISOString();
	const template = {
		...normalized.value,
		id: `template-${++templateSequence}`,
		revision: 1,
		owner: 'Steve O’Brien',
		updatedAt: now,
		lastRun: null,
	};
	templates.set(template.id, template);
	return success('Request template saved.', { template: serializeTemplate(template), templates: serializeTemplates() }, 201);
}

/**
 * Updates a saved template with optimistic revision protection.
 *
 * @param {string} templateId Template identifier.
 * @param {Record<string, unknown>} input Request template fields and revision.
 * @returns {Record<string, unknown>} Updated template or API error.
 */
export function updateApiRequestConsoleTemplate(templateId, input = {}) {
	const template = templates.get(String(templateId || ''));
	if (!template) return notFound('Request template');
	if (Number(input.revision) !== template.revision) {
		return conflict('This template changed in another session. Reload the server copy before saving.', {
			code: 'template_revision_conflict',
			template: serializeTemplate(template),
			templates: serializeTemplates(),
		});
	}
	const normalized = normalizeTemplate(input);
	if (normalized.error) return normalized;
	Object.assign(template, normalized.value, {
		revision: template.revision + 1,
		updatedAt: new Date().toISOString(),
	});
	return success('Template changes saved.', { template: serializeTemplate(template), templates: serializeTemplates() });
}

/**
 * Executes a deterministic server-proxied request and records immutable evidence.
 *
 * @param {Record<string, unknown>} input Request draft and safety acknowledgement.
 * @returns {Record<string, unknown>} Recorded run or validation error.
 */
export function executeApiRequestConsoleRun(input = {}) {
	const normalized = normalizeRun(input);
	if (normalized.error) return normalized;
	const request = normalized.value;
	const outcome = resolveOutcome(request);
	const now = new Date().toISOString();
	const id = `run-${++runSequence}`;
	const requestId = `req_${runSequence.toString(36).toUpperCase()}N`;
	const run = {
		id,
		requestId,
		templateId: request.templateId,
		method: request.method,
		environmentId: request.environmentId,
		path: request.path,
		resolvedPath: request.resolvedPath,
		authMode: request.authMode,
		scopes: request.scopes,
		headers: redactHeaders(request.headers),
		body: request.body,
		timeoutMs: request.timeoutMs,
		status: outcome.status,
		statusLabel: outcome.statusLabel,
		statusTone: outcome.statusTone,
		latencyMs: outcome.latencyMs,
		ranAt: now,
		response: {
			body: outcome.body,
			headers: {
				'content-type': 'application/json',
				'x-request-id': requestId,
				'x-ratelimit-limit': '1000',
				'x-ratelimit-remaining': String(Math.max(1, 977 - (runs.length * 3))),
				'x-proxy-region': 'eu-west-1',
			},
		},
		timeline: createTimeline(request, outcome, requestId),
	};
	runs.unshift(run);
	runs = runs.slice(0, 30);
	if (request.templateId && templates.has(request.templateId)) {
		templates.get(request.templateId).lastRun = {
			id,
			status: run.status,
			latencyMs: run.latencyMs,
			ranAt: now,
		};
	}
	return success(outcome.message, { run: serializeRun(run), runs: serializeRuns(), templates: serializeTemplates() }, 201);
}

/**
 * Returns one immutable request run.
 *
 * @param {string} runId Run identifier.
 * @returns {Record<string, unknown>} Run result or API error.
 */
export function getApiRequestConsoleRun(runId) {
	const run = runs.find((item) => item.id === String(runId || ''));
	if (!run) return notFound('Request run');
	return success('', { run: serializeRun(run), runs: serializeRuns() });
}

/**
 * Restores the seeded templates and request history.
 *
 * @returns {Record<string, unknown>} Fresh API console workspace.
 */
export function resetApiRequestConsole() {
	templateSequence = 120;
	runSequence = 8200;
	templates = createInitialTemplates();
	runs = createInitialRuns();
	return success('API request console reset to the seeded workspace.', getApiRequestConsoleBootstrap());
}

/**
 * Creates the seeded request templates.
 *
 * @returns {Map<string, Record<string, unknown>>} Initial template map.
 */
function createInitialTemplates() {
	return new Map([
		createTemplate({
			id: 'template-create-invoice',
			name: 'Create invoice',
			description: 'Create a draft invoice for an existing customer.',
			collectionId: 'billing',
			visibility: 'team',
			method: 'POST',
			environmentId: 'staging',
			path: '/v1/invoices',
			authMode: 'workspace-key',
			scopes: ['billing:write', 'customers:read'],
			headers: '{\n\t"Content-Type": "application/json",\n\t"Idempotency-Key": "invoice-{{customer_id}}"\n}',
			body: '{\n\t"customerId": "{{customer_id}}",\n\t"collectionMethod": "send_invoice",\n\t"daysUntilDue": 14,\n\t"lineItems": [{ "priceId": "price_growth", "quantity": 3 }]\n}',
			timeoutMs: 4500,
		}),
		createTemplate({
			id: 'template-lookup-customer',
			name: 'Lookup customer',
			description: 'Inspect a customer profile and billing state.',
			collectionId: 'customers',
			visibility: 'team',
			method: 'GET',
			environmentId: 'staging',
			path: '/v1/customers/{{customer_id}}',
			authMode: 'workspace-key',
			scopes: ['customers:read'],
			headers: '{\n\t"Accept": "application/json"\n}',
			body: '{}',
			timeoutMs: 3000,
		}),
		createTemplate({
			id: 'template-replay-event',
			name: 'Replay event',
			description: 'Replay a webhook delivery after the receiver is fixed.',
			collectionId: 'operations',
			visibility: 'private',
			method: 'POST',
			environmentId: 'staging',
			path: '/v1/events/{{event_id}}/replay',
			authMode: 'oauth',
			scopes: ['events:replay'],
			headers: '{\n\t"Content-Type": "application/json"\n}',
			body: '{\n\t"endpointId": "we_platform",\n\t"reason": "Receiver fix confirmed by support"\n}',
			timeoutMs: 5000,
		}),
		createTemplate({
			id: 'template-update-customer',
			name: 'Update customer',
			description: 'Patch customer lifecycle metadata.',
			collectionId: 'customers',
			visibility: 'team',
			method: 'PATCH',
			environmentId: 'staging',
			path: '/v1/customers/{{customer_id}}',
			authMode: 'workspace-key',
			scopes: ['customers:write'],
			headers: '{\n\t"Content-Type": "application/json"\n}',
			body: '{\n\t"lifecycle": "active",\n\t"supportTier": "priority"\n}',
			timeoutMs: 3500,
		}),
	]);
}

/**
 * Creates one normalized template record.
 *
 * @param {Record<string, unknown>} input Seed values.
 * @returns {[string, Record<string, unknown>]} Map entry.
 */
function createTemplate(input) {
	return [input.id, {
		...input,
		revision: 1,
		owner: input.visibility === 'private' ? 'Steve O’Brien' : 'Developer Platform',
		updatedAt: '2026-08-01T09:40:00.000Z',
		lastRun: null,
	}];
}

/**
 * Creates seeded immutable request history.
 *
 * @returns {Array<Record<string, unknown>>} Initial run list.
 */
function createInitialRuns() {
	return [
		createSeedRun('run-8199', 'template-create-invoice', 'POST', '/v1/invoices', 201, 286, '2026-08-01T10:44:00.000Z'),
		createSeedRun('run-8198', 'template-lookup-customer', 'GET', '/v1/customers/cus_1842', 200, 118, '2026-08-01T09:18:00.000Z'),
		createSeedRun('run-8197', 'template-replay-event', 'POST', '/v1/events/evt_2091/replay', 202, 342, '2026-07-31T16:06:00.000Z'),
	];
}

/**
 * Creates a compact seeded run with safe response evidence.
 *
 * @param {string} id Run identifier.
 * @param {string} templateId Template identifier.
 * @param {string} method HTTP method.
 * @param {string} path Resolved request path.
 * @param {number} status HTTP status.
 * @param {number} latencyMs Deterministic latency.
 * @param {string} ranAt ISO timestamp.
 * @returns {Record<string, unknown>} Seed run.
 */
function createSeedRun(id, templateId, method, path, status, latencyMs, ranAt) {
	const requestId = `req_${id.replace('run-', '')}N`;
	const template = templates.get(templateId);
	return {
		id,
		requestId,
		templateId,
		method,
		environmentId: 'staging',
		path,
		resolvedPath: path,
		authMode: 'workspace-key',
		scopes: [...(template?.scopes || [])],
		headers: { Authorization: '[redacted]' },
		body: {},
		timeoutMs: 4500,
		status,
		statusLabel: `${status} ${status === 201 ? 'Created' : status === 202 ? 'Accepted' : 'OK'}`,
		statusTone: 'success',
		latencyMs,
		ranAt,
		response: {
			body: { ok: true, object: status === 201 ? 'invoice' : status === 202 ? 'event_replay' : 'customer', id: status === 201 ? 'in_4928' : status === 202 ? 'replay_440' : 'cus_1842' },
			headers: { 'content-type': 'application/json', 'x-request-id': requestId, 'x-ratelimit-remaining': '977', 'x-proxy-region': 'eu-west-1' },
		},
		timeline: [
			{ label: 'Validated request', detail: 'Schema and registered variables accepted.', duration: '12ms', status: 'complete' },
			{ label: 'Authorized scopes', detail: 'Server-owned credential policy accepted.', duration: '34ms', status: 'complete' },
			{ label: 'Proxied request', detail: 'Dispatched through the audited EU edge.', duration: `${latencyMs - 64}ms`, status: 'complete' },
			{ label: 'Stored immutable run', detail: `Recorded as ${requestId}.`, duration: '18ms', status: 'complete' },
		],
	};
}

/**
 * Validates and normalizes saved template fields.
 *
 * @param {Record<string, unknown>} input Candidate template fields.
 * @returns {Record<string, unknown>} Normalized value or validation error.
 */
function normalizeTemplate(input) {
	const run = normalizeRun(input, { allowProductionWrite: true });
	const fields = run.error ? [...(run.fields || [])] : [];
	const name = normalizeText(input.name, 80);
	const description = normalizeText(input.description, 240);
	const collectionId = String(input.collectionId || '');
	const visibility = String(input.visibility || '');
	if (name.length < 3) fields.push({ field: 'name', message: 'Name the template with at least 3 characters.' });
	if (description.length < 12) fields.push({ field: 'description', message: 'Explain when teammates should use this request.' });
	if (!collectionOptions.some((option) => option.value === collectionId)) fields.push({ field: 'collectionId', message: 'Choose a registered collection.' });
	if (!visibilityOptions.some((option) => option.value === visibility)) fields.push({ field: 'visibility', message: 'Choose team or private visibility.' });
	if (fields.length) return validation('The request template needs attention.', fields);
	return {
		value: {
			...run.value,
			name,
			description,
			collectionId,
			visibility,
			templateId: undefined,
			productionAcknowledged: undefined,
			resolvedPath: undefined,
		},
	};
}

/**
 * Validates and normalizes an executable request draft.
 *
 * @param {Record<string, unknown>} input Candidate request fields.
 * @param {{ allowProductionWrite?: boolean }} options Normalization options.
 * @returns {Record<string, unknown>} Normalized value or validation error.
 */
function normalizeRun(input, options = {}) {
	const fields = [];
	const method = String(input.method || '').toUpperCase();
	const environmentId = String(input.environmentId || '');
	const environment = environmentOptions.find((option) => option.value === environmentId);
	const path = normalizeText(input.path, 280);
	const authMode = String(input.authMode || '');
	const scopes = uniqueStrings(input.scopes);
	const timeoutMs = Number(input.timeoutMs);
	if (!methodOptions.some((option) => option.value === method)) fields.push({ field: 'method', message: 'Choose a supported HTTP method.' });
	if (!environment) fields.push({ field: 'environmentId', message: 'Choose a registered environment.' });
	if (!path.startsWith('/v1/')) fields.push({ field: 'path', message: 'Use an allowlisted path beginning with /v1/.' });
	if (!authOptions.some((option) => option.value === authMode)) fields.push({ field: 'authMode', message: 'Choose a supported authorization mode.' });
	if (!Number.isFinite(timeoutMs) || timeoutMs < 1000 || timeoutMs > 10000) fields.push({ field: 'timeoutMs', message: 'Set a timeout between 1,000 and 10,000ms.' });
	const invalidScopes = scopes.filter((scope) => !scopeOptions.some((option) => option.value === scope));
	if (invalidScopes.length) fields.push({ field: 'scopes', message: `Unknown scope: ${invalidScopes[0]}.` });
	const headers = parseJsonObject(input.headers, 'headers', fields);
	const body = parseJsonObject(input.body, 'body', fields);
	const variables = [...path.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)].map((match) => match[1]);
	const knownVariables = new Set((environment?.variables || []).map((variable) => variable.name));
	const unknownVariable = variables.find((variable) => !knownVariables.has(variable));
	if (unknownVariable) fields.push({ field: 'path', message: `Variable {{${unknownVariable}}} is not registered in this environment.` });
	if (!options.allowProductionWrite && environmentId === 'production' && method !== 'GET' && input.productionAcknowledged !== true) {
		fields.push({ field: 'productionAcknowledged', message: 'Confirm the production write and audit trail before sending.' });
	}
	if (fields.length) return validation('The request could not be dispatched.', fields);
	const resolvedPath = resolveVariables(path, environment.variables);
	return {
		value: {
			templateId: templates.has(String(input.templateId || '')) ? String(input.templateId) : null,
			method,
			environmentId,
			path,
			resolvedPath,
			authMode,
			scopes,
			headers: resolveVariables(headers, environment.variables),
			body: resolveVariables(body, environment.variables),
			timeoutMs,
			productionAcknowledged: input.productionAcknowledged === true,
		},
	};
}

/**
 * Resolves registered environment variables without exposing secret values.
 *
 * @param {unknown} value String, array, or object containing template variables.
 * @param {Array<Record<string, unknown>>} variables Registered environment variables.
 * @returns {unknown} Resolved value with secret placeholders kept safe.
 */
function resolveVariables(value, variables) {
	if (typeof value === 'string') {
		return value.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, name) => {
			const variable = variables.find((item) => item.name === name);
			return variable?.secret ? '[secure]' : String(variable?.value || '');
		});
	}
	if (Array.isArray(value)) return value.map((item) => resolveVariables(item, variables));
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveVariables(item, variables)]));
	}
	return value;
}

/**
 * Resolves a deterministic upstream response from the registered endpoint catalog.
 *
 * @param {Record<string, unknown>} request Normalized request.
 * @returns {Record<string, unknown>} Response outcome.
 */
function resolveOutcome(request) {
	const endpoint = matchEndpoint(request.method, request.resolvedPath);
	if (request.authMode === 'none') return responseOutcome(401, 74, { error: 'authentication_required', message: 'This endpoint requires a workspace credential.' });
	if (!endpoint) return responseOutcome(404, 96, { error: 'endpoint_not_registered', message: 'The proxy allowlist has no matching endpoint.' });
	const missingScope = endpoint.scopes.find((scope) => !request.scopes.includes(scope));
	if (missingScope) return responseOutcome(403, 82, { error: 'scope_missing', message: `Add ${missingScope} before dispatching this request.` });
	if (request.timeoutMs < endpoint.latencyMs) return responseOutcome(504, request.timeoutMs, { error: 'proxy_timeout', message: `The ${request.timeoutMs}ms timeout expired before the upstream response.` });
	return responseOutcome(endpoint.status, endpoint.latencyMs, endpoint.body(request));
}

/**
 * Finds a registered deterministic endpoint.
 *
 * @param {string} method HTTP method.
 * @param {string} path Resolved path.
 * @returns {Record<string, unknown> | null} Endpoint definition.
 */
function matchEndpoint(method, path) {
	const endpoints = [
		{ method: 'GET', pattern: /^\/v1\/customers\/(cus_[a-zA-Z0-9]+)$/, scopes: ['customers:read'], status: 200, latencyMs: 118, body: () => ({ id: 'cus_1842', object: 'customer', name: 'Northstar Labs', lifecycle: 'active', balance: 0 }) },
		{ method: 'POST', pattern: /^\/v1\/invoices$/, scopes: ['billing:write', 'customers:read'], status: 201, latencyMs: 286, body: () => ({ id: 'in_4928', object: 'invoice', status: 'draft', amountDue: 14700, currency: 'GBP' }) },
		{ method: 'POST', pattern: /^\/v1\/events\/(evt_[a-zA-Z0-9]+)\/replay$/, scopes: ['events:replay'], status: 202, latencyMs: 1342, body: () => ({ id: 'replay_440', object: 'event_replay', status: 'queued', attempt: 2 }) },
		{ method: 'PATCH', pattern: /^\/v1\/customers\/(cus_[a-zA-Z0-9]+)$/, scopes: ['customers:write'], status: 200, latencyMs: 204, body: () => ({ id: 'cus_1842', object: 'customer', lifecycle: 'active', supportTier: 'priority' }) },
		{ method: 'DELETE', pattern: /^\/v1\/customers\/(cus_[a-zA-Z0-9]+)$/, scopes: ['admin:command'], status: 202, latencyMs: 412, body: () => ({ id: 'cus_1842', object: 'customer_deletion', status: 'scheduled' }) },
	];
	return endpoints.find((endpoint) => endpoint.method === method && endpoint.pattern.test(path)) || null;
}

/**
 * Creates response metadata for a simulated upstream result.
 *
 * @param {number} status HTTP status.
 * @param {number} latencyMs Response latency.
 * @param {Record<string, unknown>} body Response body.
 * @returns {Record<string, unknown>} Response outcome.
 */
function responseOutcome(status, latencyMs, body) {
	const label = status === 200 ? 'OK' : status === 201 ? 'Created' : status === 202 ? 'Accepted' : status === 401 ? 'Unauthorized' : status === 403 ? 'Forbidden' : status === 404 ? 'Not found' : 'Gateway timeout';
	return {
		status,
		statusLabel: `${status} ${label}`,
		statusTone: status < 400 ? 'success' : status === 504 ? 'warning' : 'danger',
		latencyMs,
		body,
		message: status < 400 ? 'Request completed through the audited proxy.' : `Upstream response captured: ${status} ${label}.`,
	};
}

/**
 * Creates evidence stages for a completed request.
 *
 * @param {Record<string, unknown>} request Normalized request.
 * @param {Record<string, unknown>} outcome Response outcome.
 * @param {string} requestId Request identifier.
 * @returns {Array<Record<string, string>>} Timeline stages.
 */
function createTimeline(request, outcome, requestId) {
	return [
		{ label: 'Validated request', detail: 'JSON, path, timeout, and variables accepted.', duration: '12ms', status: 'complete' },
		{ label: 'Applied server authorization', detail: request.authMode === 'none' ? 'No credential requested.' : `${request.authMode} applied without exposing secret material.`, duration: '34ms', status: outcome.status === 401 ? 'warning' : 'complete' },
		{ label: 'Proxied upstream request', detail: `Received ${outcome.statusLabel} through the audited EU edge.`, duration: `${Math.max(1, outcome.latencyMs - 64)}ms`, status: outcome.status >= 400 ? 'warning' : 'complete' },
		{ label: 'Stored immutable run', detail: `Recorded as ${requestId} for support and security review.`, duration: '18ms', status: 'complete' },
	];
}

/**
 * Parses a JSON object while attaching field-specific validation evidence.
 *
 * @param {unknown} value Candidate JSON source.
 * @param {string} field Field name.
 * @param {Array<Record<string, string>>} fields Validation collection.
 * @returns {Record<string, unknown>} Parsed object or empty object.
 */
function parseJsonObject(value, field, fields) {
	if (value && typeof value === 'object' && !Array.isArray(value)) return cloneValue(value);
	try {
		const parsed = JSON.parse(String(value || '{}'));
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Use a JSON object.');
		return parsed;
	} catch (error) {
		fields.push({ field, message: error.message || 'Enter valid JSON.' });
		return {};
	}
}

/**
 * Redacts browser-provided authorization fields before storage.
 *
 * @param {Record<string, unknown>} headers Request headers.
 * @returns {Record<string, unknown>} Safe request headers.
 */
function redactHeaders(headers) {
	return Object.fromEntries(Object.entries(headers).map(([name, value]) => [name, name.toLowerCase() === 'authorization' ? '[redacted]' : value]));
}

/**
 * Serializes templates in most-recent-first order.
 *
 * @returns {Array<Record<string, unknown>>} Safe template list.
 */
function serializeTemplates() {
	return [...templates.values()].sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt))).map(serializeTemplate);
}

/**
 * Serializes one template.
 *
 * @param {Record<string, unknown>} template Internal template.
 * @returns {Record<string, unknown>} Safe template copy.
 */
function serializeTemplate(template) {
	return cloneValue(template);
}

/**
 * Serializes recent request runs.
 *
 * @returns {Array<Record<string, unknown>>} Safe run list.
 */
function serializeRuns() {
	return runs.map(serializeRun);
}

/**
 * Serializes one immutable run.
 *
 * @param {Record<string, unknown>} run Internal run.
 * @returns {Record<string, unknown>} Safe run copy.
 */
function serializeRun(run) {
	return cloneValue(run);
}

/**
 * Creates a successful API result.
 *
 * @param {string} message User-facing message.
 * @param {Record<string, unknown>} data Result data.
 * @param {number} status HTTP status.
 * @returns {Record<string, unknown>} API result.
 */
function success(message, data = {}, status = 200) {
	return { ok: true, status, message, ...data };
}

/**
 * Creates a structured validation error.
 *
 * @param {string} message User-facing message.
 * @param {Array<Record<string, string>>} fields Field errors.
 * @returns {Record<string, unknown>} API error.
 */
function validation(message, fields) {
	return { ok: false, error: 'validation_error', status: 422, message, fields };
}

/**
 * Creates a structured revision conflict.
 *
 * @param {string} message User-facing message.
 * @param {Record<string, unknown>} data Conflict evidence.
 * @returns {Record<string, unknown>} API error.
 */
function conflict(message, data = {}) {
	return { ok: false, error: 'conflict', status: 409, message, ...data };
}

/**
 * Creates a structured not-found result.
 *
 * @param {string} noun Missing resource noun.
 * @returns {Record<string, unknown>} API error.
 */
function notFound(noun) {
	return { ok: false, error: 'not_found', status: 404, message: `${noun} was not found.` };
}

/**
 * Normalizes text to a bounded trimmed string.
 *
 * @param {unknown} value Candidate text.
 * @param {number} maxLength Maximum length.
 * @returns {string} Normalized text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').trim().slice(0, maxLength);
}

/**
 * Returns unique, non-empty string values.
 *
 * @param {unknown} value Candidate array.
 * @returns {string[]} Unique strings.
 */
function uniqueStrings(value) {
	if (!Array.isArray(value)) return [];
	return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
}

/**
 * Creates a detached JSON-safe value.
 *
 * @template T
 * @param {T} value Source value.
 * @returns {T} Detached value.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}
