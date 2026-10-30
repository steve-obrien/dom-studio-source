import { createHash, randomBytes } from 'node:crypto';

const environmentOptions = Object.freeze([
	{ value: 'all', label: 'All environments', description: 'Production, staging, and development credentials.' },
	{ value: 'production', label: 'Production', description: 'Customer data and live payment traffic.' },
	{ value: 'staging', label: 'Staging', description: 'Mirrored schemas with non-production data.' },
	{ value: 'development', label: 'Development', description: 'Local tools and developer sandboxes.' },
]);

const ownerOptions = Object.freeze([
	{ value: 'maya', label: 'Maya Chen', description: 'Payments platform' },
	{ value: 'jon', label: 'Jon Bell', description: 'Developer experience' },
	{ value: 'ari', label: 'Ari Grant', description: 'Application engineering' },
]);

const lifetimeOptions = Object.freeze([
	{ value: '30', label: '30 days', description: 'Recommended for production automation.' },
	{ value: '60', label: '60 days', description: 'Balanced rotation interval.' },
	{ value: '90', label: '90 days', description: 'Maximum policy lifetime.' },
]);

const overlapOptions = Object.freeze([
	{ value: '1', label: '1 hour overlap', description: 'For coordinated deploys with fast rollback.' },
	{ value: '24', label: '24 hour overlap', description: 'Recommended for production rotation.' },
	{ value: '72', label: '72 hour overlap', description: 'For distributed clients with slower rollout.' },
]);

const scopeCatalog = Object.freeze([
	{ value: 'customers:read', label: 'Read customers', description: 'List and inspect customer profiles.', group: 'Customers', risk: 'standard' },
	{ value: 'customers:write', label: 'Write customers', description: 'Create and update customer records.', group: 'Customers', risk: 'elevated' },
	{ value: 'billing:read', label: 'Read billing', description: 'View invoices, plans, and payment state.', group: 'Billing', risk: 'standard' },
	{ value: 'checkout:write', label: 'Create checkout', description: 'Create checkout sessions and payment links.', group: 'Billing', risk: 'elevated' },
	{ value: 'events:read', label: 'Read events', description: 'Inspect delivery logs and webhook attempts.', group: 'Events', risk: 'standard' },
	{ value: 'keys:admin', label: 'Manage API keys', description: 'Create, rotate, and revoke credentials.', group: 'Administration', risk: 'critical' },
]);

let keySequence = 843;
let auditSequence = 1210;
let keys = createInitialKeys();

/**
 * Returns the credential inventory, policy, and rich-control options.
 *
 * @returns {Record<string, unknown>} API key workspace bootstrap payload.
 */
export function getApiKeyManagementBootstrap() {
	const defaultKey = keys.get('key-live-checkout');
	return cloneValue({
		workspace: {
			name: 'Northstar Platform',
			area: 'Developer settings',
			actor: 'Steve O’Brien',
		},
		policy: {
			maxLifetimeDays: 90,
			productionOriginsRequired: true,
			rotationOverlapHours: 24,
			auditRetention: '1 year',
		},
		options: {
			environments: environmentOptions,
			owners: ownerOptions,
			lifetimes: lifetimeOptions,
			overlaps: overlapOptions,
			scopes: scopeCatalog,
		},
		keys: serializeKeyList(),
		defaultKeyId: defaultKey.id,
		key: serializeKey(defaultKey),
	});
}

/**
 * Returns one credential without secret material.
 *
 * @param {string} keyId Credential identifier.
 * @returns {Record<string, unknown>} Credential detail or structured API error.
 */
export function getApiKeyManagementKey(keyId) {
	const key = keys.get(String(keyId || ''));
	if (!key) return notFound('API key');
	return success('', { key: serializeKey(key), keys: serializeKeyList() });
}

/**
 * Creates a credential and returns its secret exactly once.
 *
 * @param {Record<string, unknown>} input Credential creation fields.
 * @returns {Record<string, unknown>} New credential and one-time secret receipt or API error.
 */
export function createApiKey(input = {}) {
	const draft = normalizeCreateInput(input);
	if (draft.error) return draft;
	const createdAt = new Date().toISOString();
	const id = `key-${++keySequence}`;
	const secret = generateSecret(draft.value.environment);
	const prefix = secret.slice(0, 17);
	const key = {
		id,
		name: draft.value.name,
		prefix,
		environment: draft.value.environment,
		status: 'active',
		statusLabel: 'Active',
		statusTone: 'success',
		revision: 1,
		createdAt,
		lastUsedAt: null,
		expiresAt: addDays(createdAt, draft.value.lifetimeDays),
		ownerId: draft.value.ownerId,
		requests: 0,
		limit: limitForEnvironment(draft.value.environment),
		errorRate: 0,
		origins: draft.value.origins,
		scopes: draft.value.scopes,
		secretHash: hashSecret(secret),
		fingerprint: createFingerprint(secret),
		rotation: null,
		events: [createEvent('Key created', `${draft.value.scopes.length} scopes · ${draft.value.lifetimeDays} day lifetime`, 'Steve O’Brien')],
	};
	keys.set(id, key);
	return success('API key created. Copy the secret now; it cannot be shown again.', {
		key: serializeKey(key),
		keys: serializeKeyList(),
		secretReceipt: createSecretReceipt(key, secret, 'created'),
	});
}

/**
 * Saves scopes and allowed origins with optimistic revision protection.
 *
 * @param {string} keyId Credential identifier.
 * @param {Record<string, unknown>} input Permission fields and current revision.
 * @returns {Record<string, unknown>} Updated credential or structured API error.
 */
export function updateApiKeyPermissions(keyId, input = {}) {
	const key = keys.get(String(keyId || ''));
	if (!key) return notFound('API key');
	const revisionError = validateRevision(key, input.revision);
	if (revisionError) return revisionError;
	if (key.status === 'revoked') return conflict('Revoked credentials cannot be edited.', {
		code: 'api_key_revoked',
		key: serializeKey(key),
		keys: serializeKeyList(),
	});
	const permissionDraft = normalizePermissions(key.environment, input);
	if (permissionDraft.error) return permissionDraft;
	const previousScopes = key.scopes;
	key.scopes = permissionDraft.value.scopes;
	key.origins = permissionDraft.value.origins;
	key.revision += 1;
	key.events.unshift(createEvent(
		'Permissions updated',
		`${key.scopes.length} scopes · ${key.origins.length} allowed origins · ${scopeDelta(previousScopes, key.scopes)}`,
		'Steve O’Brien',
	));
	return success('Credential permissions saved.', { key: serializeKey(key), keys: serializeKeyList() });
}

/**
 * Creates replacement secret material with a bounded overlap window.
 *
 * @param {string} keyId Credential identifier.
 * @param {Record<string, unknown>} input Rotation reason, overlap, acknowledgement, and revision.
 * @returns {Record<string, unknown>} Rotating credential and one-time replacement secret or API error.
 */
export function rotateApiKey(keyId, input = {}) {
	const key = keys.get(String(keyId || ''));
	if (!key) return notFound('API key');
	const revisionError = validateRevision(key, input.revision);
	if (revisionError) return revisionError;
	if (key.status === 'revoked') return conflict('Revoked credentials cannot be rotated.', { code: 'api_key_revoked', key: serializeKey(key), keys: serializeKeyList() });
	if (key.status === 'rotating') return conflict('Complete the active rotation before creating another replacement.', { code: 'rotation_in_progress', key: serializeKey(key), keys: serializeKeyList() });
	const overlapHours = Number(input.overlapHours);
	const reason = normalizeText(input.reason, 320);
	const fields = [];
	if (!overlapOptions.some((option) => Number(option.value) === overlapHours)) fields.push({ field: 'overlapHours', message: 'Choose a supported overlap window.' });
	if (reason.length < 12) fields.push({ field: 'reason', message: 'Explain the rotation in at least 12 characters.' });
	if (input.acknowledged !== true) fields.push({ field: 'acknowledged', message: 'Confirm the replacement and overlap plan.' });
	if (fields.length) return validation('The rotation plan needs attention.', fields);

	const secret = generateSecret(key.environment);
	const rotatedAt = new Date().toISOString();
	const previousPrefix = key.prefix;
	key.prefix = secret.slice(0, 17);
	key.secretHash = hashSecret(secret);
	key.fingerprint = createFingerprint(secret);
	key.status = 'rotating';
	key.statusLabel = 'Rotating';
	key.statusTone = 'warning';
	key.rotation = {
		state: 'overlap',
		previousPrefix,
		replacementPrefix: key.prefix,
		overlapHours,
		overlapEndsAt: addHours(rotatedAt, overlapHours),
		reason,
		startedAt: rotatedAt,
		completedAt: null,
	};
	key.revision += 1;
	key.events.unshift(createEvent('Rotation started', `${overlapHours} hour overlap · ${reason}`, 'Steve O’Brien'));
	return success('Replacement credential created. Deploy it before ending the overlap.', {
		key: serializeKey(key),
		keys: serializeKeyList(),
		secretReceipt: createSecretReceipt(key, secret, 'rotated'),
	});
}

/**
 * Ends a rotation overlap after the replacement is confirmed in traffic.
 *
 * @param {string} keyId Credential identifier.
 * @param {Record<string, unknown>} input Completion acknowledgement and current revision.
 * @returns {Record<string, unknown>} Active credential or structured API error.
 */
export function completeApiKeyRotation(keyId, input = {}) {
	const key = keys.get(String(keyId || ''));
	if (!key) return notFound('API key');
	const revisionError = validateRevision(key, input.revision);
	if (revisionError) return revisionError;
	if (key.status !== 'rotating' || !key.rotation) return conflict('This credential has no active rotation overlap.', { code: 'rotation_not_active', key: serializeKey(key), keys: serializeKeyList() });
	if (input.acknowledged !== true) return validation('Confirm traffic has moved before disabling the previous credential.', [{ field: 'rotationComplete', message: 'Confirm the replacement is serving expected traffic.' }]);
	const completedAt = new Date().toISOString();
	key.status = 'active';
	key.statusLabel = 'Active';
	key.statusTone = 'success';
	key.rotation.state = 'completed';
	key.rotation.completedAt = completedAt;
	key.revision += 1;
	key.events.unshift(createEvent('Rotation completed', `Previous credential ${key.rotation.previousPrefix} disabled.`, 'Steve O’Brien'));
	return success('Rotation completed and the previous credential was disabled.', { key: serializeKey(key), keys: serializeKeyList() });
}

/**
 * Permanently revokes a credential after explicit operator confirmation.
 *
 * @param {string} keyId Credential identifier.
 * @param {Record<string, unknown>} input Revocation reason, acknowledgement, and current revision.
 * @returns {Record<string, unknown>} Revoked credential or structured API error.
 */
export function revokeApiKey(keyId, input = {}) {
	const key = keys.get(String(keyId || ''));
	if (!key) return notFound('API key');
	const revisionError = validateRevision(key, input.revision);
	if (revisionError) return revisionError;
	if (key.status === 'revoked') return conflict('This credential is already revoked.', { code: 'api_key_revoked', key: serializeKey(key), keys: serializeKeyList() });
	const reason = normalizeText(input.reason, 320);
	const fields = [];
	if (reason.length < 12) fields.push({ field: 'reason', message: 'Record a revocation reason of at least 12 characters.' });
	if (input.acknowledged !== true) fields.push({ field: 'acknowledged', message: 'Confirm applications using this credential will stop working.' });
	if (fields.length) return validation('Revocation needs explicit evidence.', fields);
	key.status = 'revoked';
	key.statusLabel = 'Revoked';
	key.statusTone = 'danger';
	key.revokedAt = new Date().toISOString();
	key.rotation = null;
	key.revision += 1;
	key.events.unshift(createEvent('Key revoked', reason, 'Steve O’Brien'));
	return success('API key revoked. Requests using it will now be rejected.', { key: serializeKey(key), keys: serializeKeyList() });
}

/**
 * Restores the seeded credential inventory and clears process-local receipts.
 *
 * @returns {Record<string, unknown>} Fresh API key workspace.
 */
export function resetApiKeyManagement() {
	keySequence = 843;
	auditSequence = 1210;
	keys = createInitialKeys();
	return success('API key workspace reset to the seeded inventory.', getApiKeyManagementBootstrap());
}

/**
 * Creates the seeded credential inventory.
 *
 * @returns {Map<string, Record<string, unknown>>} Initial process-local key state.
 */
function createInitialKeys() {
	return new Map([
		createKey({
			id: 'key-live-checkout',
			name: 'Production checkout',
			prefix: 'dom_live_9f2a',
			environment: 'production',
			ownerId: 'maya',
			createdAt: '2026-05-18T09:20:00.000Z',
			lastUsedAt: '2026-08-01T18:52:00.000Z',
			expiresAt: '2026-08-18T09:20:00.000Z',
			requests: 48200,
			limit: 75000,
			errorRate: 0.04,
			origins: ['https://app.northstar.example', 'https://checkout.northstar.example'],
			scopes: ['customers:read', 'checkout:write', 'billing:read', 'events:read'],
			events: [
				createEvent('Checkout session created', 'Authorized checkout:write from the production edge.', 'Production API', '2 minutes ago'),
				createEvent('Allowed origin added', 'https://checkout.northstar.example', 'Maya Chen', 'Today at 09:42'),
				createEvent('Key rotated', 'Previous credential disabled after 24 hour overlap.', 'Security bot', 'May 18'),
			],
		}),
		createKey({
			id: 'key-live-analytics',
			name: 'Warehouse export',
			prefix: 'dom_live_b13d',
			environment: 'production',
			ownerId: 'maya',
			createdAt: '2026-06-11T10:00:00.000Z',
			lastUsedAt: '2026-08-01T16:25:00.000Z',
			expiresAt: '2026-09-09T10:00:00.000Z',
			requests: 21940,
			limit: 50000,
			errorRate: 0.01,
			origins: ['https://warehouse.northstar.example'],
			scopes: ['customers:read', 'billing:read', 'events:read'],
			events: [createEvent('Export completed', '18,420 records read.', 'Warehouse worker', 'Today at 16:25')],
		}),
		createKey({
			id: 'key-stage-integrations',
			name: 'Staging integrations',
			prefix: 'dom_test_a81c',
			environment: 'staging',
			ownerId: 'jon',
			createdAt: '2026-06-02T11:20:00.000Z',
			lastUsedAt: '2026-08-01T18:23:00.000Z',
			expiresAt: '2026-09-02T11:20:00.000Z',
			requests: 11840,
			limit: 25000,
			errorRate: 0.22,
			origins: ['https://staging.northstar.example'],
			scopes: ['customers:read', 'customers:write', 'events:read'],
			events: [createEvent('Webhook replay requested', 'Replay accepted in staging.', 'Jon Bell', '31 minutes ago')],
		}),
		createKey({
			id: 'key-dev-cli',
			name: 'Local CLI tooling',
			prefix: 'dom_dev_44bc',
			environment: 'development',
			ownerId: 'ari',
			status: 'review',
			statusLabel: 'Review',
			statusTone: 'warning',
			createdAt: '2026-04-26T08:10:00.000Z',
			lastUsedAt: '2026-07-26T12:45:00.000Z',
			expiresAt: '2026-08-06T08:10:00.000Z',
			requests: 2400,
			limit: 10000,
			errorRate: 1.18,
			origins: ['http://localhost:5173'],
			scopes: ['customers:read', 'events:read'],
			events: [createEvent('Expiration reminder sent', 'Rotate or revoke before Aug 06.', 'Security bot', 'Today at 08:00')],
		}),
	]);
}

/**
 * Creates one seeded credential tuple.
 *
 * @param {Record<string, unknown>} input Credential fixture.
 * @returns {[string, Record<string, unknown>]} Map entry.
 */
function createKey(input) {
	const key = {
		status: 'active',
		statusLabel: 'Active',
		statusTone: 'success',
		revision: 4,
		rotation: null,
		revokedAt: null,
		secretHash: hashSecret(`${input.prefix}-seed-secret`),
		fingerprint: createFingerprint(`${input.prefix}-seed-secret`),
		...input,
	};
	return [key.id, key];
}

/**
 * Normalizes and validates credential creation fields.
 *
 * @param {Record<string, unknown>} input Submitted creation fields.
 * @returns {{ value?: Record<string, unknown>, error?: Record<string, unknown>, status?: number }} Normalized input or validation error.
 */
function normalizeCreateInput(input) {
	const name = normalizeText(input.name, 80);
	const environment = String(input.environment || '');
	const ownerId = String(input.ownerId || '');
	const lifetimeDays = Number(input.lifetimeDays);
	const permissions = normalizePermissions(environment, input);
	const fields = permissions.error?.fields ? [...permissions.error.fields] : [];
	if (name.length < 3) fields.push({ field: 'name', message: 'Name the application or workload using this credential.' });
	if (!environmentOptions.some((option) => option.value === environment && option.value !== 'all')) fields.push({ field: 'environment', message: 'Choose a credential environment.' });
	if (!ownerOptions.some((option) => option.value === ownerId)) fields.push({ field: 'ownerId', message: 'Choose an accountable owner.' });
	if (!lifetimeOptions.some((option) => Number(option.value) === lifetimeDays)) fields.push({ field: 'lifetimeDays', message: 'Choose a policy-approved lifetime.' });
	if (input.acknowledged !== true) fields.push({ field: 'acknowledged', message: 'Confirm you will store the one-time secret securely.' });
	if (fields.length) return validation('Check the new credential details.', dedupeFields(fields));
	return { value: { name, environment, ownerId, lifetimeDays, ...permissions.value } };
}

/**
 * Normalizes scopes and network origins against credential policy.
 *
 * @param {string} environment Credential environment.
 * @param {Record<string, unknown>} input Permission fields.
 * @returns {{ value?: { scopes: string[], origins: string[] }, error?: Record<string, unknown>, status?: number }} Normalized permissions or validation error.
 */
function normalizePermissions(environment, input) {
	const scopes = Array.isArray(input.scopes) ? [...new Set(input.scopes.map(String))] : [];
	const origins = Array.isArray(input.origins) ? [...new Set(input.origins.map((value) => normalizeOrigin(value)).filter(Boolean))] : [];
	const fields = [];
	if (!scopes.length) fields.push({ field: 'scopes', message: 'Choose at least one permission scope.' });
	if (scopes.some((scope) => !scopeCatalog.some((option) => option.value === scope))) fields.push({ field: 'scopes', message: 'Remove unregistered permission scopes.' });
	if (environment === 'production' && !origins.length) fields.push({ field: 'origins', message: 'Add at least one HTTPS production origin.' });
	if (environment === 'production' && origins.some((origin) => !origin.startsWith('https://'))) fields.push({ field: 'origins', message: 'Production origins must use HTTPS.' });
	if (origins.length > 8) fields.push({ field: 'origins', message: 'Use eight or fewer allowed origins.' });
	if (scopes.includes('keys:admin') && input.adminAcknowledged !== true) fields.push({ field: 'adminAcknowledged', message: 'Confirm the credential can manage other API keys.' });
	if (fields.length) return validation('Check credential permissions.', fields);
	return { value: { scopes, origins } };
}

/**
 * Validates an optimistic credential revision.
 *
 * @param {Record<string, unknown>} key Current credential.
 * @param {unknown} revision Submitted revision.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function validateRevision(key, revision) {
	if (Number(revision) === Number(key.revision)) return null;
	return conflict('This credential changed in another tab. The current server version has been restored.', {
		code: 'api_key_revision_conflict',
		key: serializeKey(key),
		keys: serializeKeyList(),
	});
}

/**
 * Returns summaries for inventory navigation.
 *
 * @returns {Array<Record<string, unknown>>} Credential summaries.
 */
function serializeKeyList() {
	return [...keys.values()].map((key) => ({
		id: key.id,
		name: key.name,
		prefix: key.prefix,
		environment: key.environment,
		status: key.status,
		statusLabel: key.statusLabel,
		statusTone: key.statusTone,
		revision: key.revision,
		ownerId: key.ownerId,
		lastUsedAt: key.lastUsedAt,
		expiresAt: key.expiresAt,
		requests: key.requests,
		limit: key.limit,
	}));
}

/**
 * Removes secret hashes before returning complete credential state.
 *
 * @param {Record<string, unknown>} key Credential state.
 * @returns {Record<string, unknown>} Safe credential payload.
 */
function serializeKey(key) {
	const { secretHash, ...safeKey } = key;
	return cloneValue(safeKey);
}

/**
 * Creates a one-time secret delivery receipt.
 *
 * @param {Record<string, unknown>} key Credential state.
 * @param {string} secret Full secret shown once.
 * @param {string} action Creation or rotation action.
 * @returns {Record<string, unknown>} One-time secret receipt.
 */
function createSecretReceipt(key, secret, action) {
	return {
		id: `secret-receipt-${++auditSequence}`,
		action,
		keyId: key.id,
		prefix: key.prefix,
		fingerprint: key.fingerprint,
		secret,
		createdAt: new Date().toISOString(),
		message: 'This secret is available in this response only.',
	};
}

/**
 * Creates an audit event.
 *
 * @param {string} label Event label.
 * @param {string} detail Event detail.
 * @param {string} actor Event actor.
 * @param {string} time Optional display time.
 * @returns {Record<string, string>} Audit event.
 */
function createEvent(label, detail, actor, time = 'Just now') {
	return { id: `event-${++auditSequence}`, label, detail, actor, time };
}

/**
 * Generates a secret with an environment-specific prefix.
 *
 * @param {string} environment Credential environment.
 * @returns {string} Full one-time credential secret.
 */
function generateSecret(environment) {
	const marker = { production: 'live', staging: 'test', development: 'dev' }[environment] || 'test';
	return `dom_${marker}_${randomBytes(22).toString('base64url')}`;
}

/**
 * Hashes a secret before process-local storage.
 *
 * @param {string} secret Secret material.
 * @returns {string} SHA-256 hash.
 */
function hashSecret(secret) {
	return createHash('sha256').update(secret).digest('hex');
}

/**
 * Creates a short verification fingerprint.
 *
 * @param {string} secret Secret material.
 * @returns {string} Grouped fingerprint.
 */
function createFingerprint(secret) {
	const digest = createHash('sha256').update(secret).digest('hex').slice(0, 16).toUpperCase();
	return digest.match(/.{1,4}/g).join(':');
}

/**
 * Returns an ISO timestamp after a day offset.
 *
 * @param {string} value Starting timestamp.
 * @param {number} days Day offset.
 * @returns {string} Offset timestamp.
 */
function addDays(value, days) {
	return new Date(new Date(value).getTime() + (Number(days) * 86400000)).toISOString();
}

/**
 * Returns an ISO timestamp after an hour offset.
 *
 * @param {string} value Starting timestamp.
 * @param {number} hours Hour offset.
 * @returns {string} Offset timestamp.
 */
function addHours(value, hours) {
	return new Date(new Date(value).getTime() + (Number(hours) * 3600000)).toISOString();
}

/**
 * Returns an environment-specific monthly request ceiling.
 *
 * @param {string} environment Credential environment.
 * @returns {number} Monthly request ceiling.
 */
function limitForEnvironment(environment) {
	return { production: 75000, staging: 25000, development: 10000 }[environment] || 10000;
}

/**
 * Summarizes added and removed scopes for audit evidence.
 *
 * @param {string[]} previous Previous scopes.
 * @param {string[]} current Current scopes.
 * @returns {string} Scope delta label.
 */
function scopeDelta(previous, current) {
	const added = current.filter((scope) => !previous.includes(scope)).length;
	const removed = previous.filter((scope) => !current.includes(scope)).length;
	return `${added} added · ${removed} removed`;
}

/**
 * Normalizes an allowed origin to its URL origin.
 *
 * @param {unknown} value Raw origin.
 * @returns {string} Normalized origin or empty string.
 */
function normalizeOrigin(value) {
	try {
		return new URL(String(value || '').trim()).origin;
	} catch {
		return '';
	}
}

/**
 * Removes duplicate field errors.
 *
 * @param {Array<Record<string, string>>} fields Field errors.
 * @returns {Array<Record<string, string>>} Unique field errors.
 */
function dedupeFields(fields) {
	const seen = new Set();
	return fields.filter((field) => {
		const key = `${field.field}:${field.message}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
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
