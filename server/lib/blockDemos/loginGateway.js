import { createHash } from 'node:crypto';

const account = Object.freeze({
	id: 'member-alex-morgan',
	name: 'Alex Morgan',
	email: 'alex@northstar.tools',
	initials: 'AM',
	role: 'Product lead',
	password: 'Studio2026!',
	mfaMethod: 'Authenticator app',
});

const workspaces = Object.freeze([
	{
		id: 'northstar-product',
		label: 'Northstar Product',
		description: 'Product, design, and engineering',
		role: 'Admin',
		path: '/workspace/northstar-product',
	},
	{
		id: 'northstar-labs',
		label: 'Northstar Labs',
		description: 'Experiments and early access',
		role: 'Member',
		path: '/workspace/northstar-labs',
	},
	{
		id: 'customer-advisory',
		label: 'Customer Advisory',
		description: 'Shared research workspace',
		role: 'Viewer',
		path: '/workspace/customer-advisory',
	},
]);

const challengeLifetimeMs = 10 * 60 * 1000;
const sessionLifetimeMs = 12 * 60 * 60 * 1000;
const rememberedSessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;
const lockoutLifetimeMs = 45 * 1000;
const maxPasswordAttempts = 3;
const maxChallengeAttempts = 5;

let challengeSequence = 120;
let sessionSequence = 40;
let state = createInitialState();

/**
 * Return product identity, demo credentials, authentication policy, and recent security context.
 *
 * @returns {Record<string, unknown>} Login gateway bootstrap payload.
 */
export function getLoginGatewayBootstrap() {
	purgeExpiredState();
	return cloneValue({
		brand: {
			name: 'Northstar',
			product: 'Product workspace',
			initials: 'NS',
		},
		demoCredentials: {
			email: account.email,
			password: account.password,
			mfaCode: '246810',
			passwordlessCode: '834219',
		},
		policy: {
			passwordAttempts: maxPasswordAttempts,
			challengeAttempts: maxChallengeAttempts,
			challengeMinutes: challengeLifetimeMs / 60000,
			rememberedDays: rememberedSessionLifetimeMs / 86400000,
		},
		security: {
			status: 'All systems operational',
			lastVerifiedAt: '2026-08-01T14:38:00.000Z',
			controls: [
				{ label: 'Single sign-on', value: 'Enforced for admins' },
				{ label: 'Session policy', value: '12 hours' },
				{ label: 'Device trust', value: 'Required off-network' },
			],
			recentAccess: [
				{ location: 'London, UK', device: 'Safari on macOS', relativeTime: '18 minutes ago', current: true },
				{ location: 'London, UK', device: 'Northstar desktop', relativeTime: 'Yesterday', current: false },
			],
		},
	});
}

/**
 * Validate an email and password before creating a second-factor challenge.
 *
 * @param {Record<string, unknown>} input Submitted credentials and remember-device preference.
 * @returns {Record<string, unknown>} Verification challenge or structured API error.
 */
export function beginPasswordLogin(input = {}) {
	purgeExpiredState();
	const email = normalizeEmail(input.email);
	const password = String(input.password || '');
	if (!isValidEmail(email)) return validation('Enter a valid work email.', [{ field: 'email', message: 'Use an address such as name@company.com.' }]);
	if (!password) return validation('Enter your password.', [{ field: 'password', message: 'Password is required.' }]);
	const attemptState = passwordAttemptFor(email);
	if (attemptState.lockedUntil && attemptState.lockedUntil > Date.now()) {
		return rateLimited('Too many sign-in attempts. Wait a moment before trying again.', attemptState.lockedUntil);
	}
	if (email !== account.email || password !== account.password) {
		attemptState.failures += 1;
		if (attemptState.failures >= maxPasswordAttempts) {
			attemptState.lockedUntil = Date.now() + lockoutLifetimeMs;
			return rateLimited('Sign-in is temporarily paused after three failed attempts.', attemptState.lockedUntil);
		}
		return unauthorized('Email or password is incorrect.', {
			attemptsRemaining: maxPasswordAttempts - attemptState.failures,
		});
	}
	attemptState.failures = 0;
	attemptState.lockedUntil = 0;
	const challenge = createChallenge({
		email,
		purpose: 'mfa',
		remember: input.remember === true,
		code: '246810',
	});
	return cloneValue({
		challenge: serializeChallenge(challenge),
		message: `Password accepted. Enter the six-digit code from your ${account.mfaMethod.toLowerCase()}.`,
	});
}

/**
 * Create a passwordless email challenge for account recovery or normal sign-in.
 *
 * @param {Record<string, unknown>} input Email address and remember-device preference.
 * @returns {Record<string, unknown>} Passwordless challenge or structured API error.
 */
export function beginPasswordlessLogin(input = {}) {
	purgeExpiredState();
	const email = normalizeEmail(input.email);
	if (!isValidEmail(email)) return validation('Enter a valid work email.', [{ field: 'email', message: 'Use an address such as name@company.com.' }]);
	const validAccount = email === account.email;
	const challenge = createChallenge({
		email,
		purpose: 'passwordless',
		remember: input.remember === true,
		code: validAccount ? '834219' : '000000',
		validAccount,
	});
	return cloneValue({
		challenge: serializeChallenge(challenge),
		message: `If a Northstar account exists, a six-digit sign-in code was sent to ${maskEmail(email)}.`,
	});
}

/**
 * Verify a login challenge and create an authenticated process-local session.
 *
 * @param {string} challengeId Stable verification challenge identifier.
 * @param {Record<string, unknown>} input Submitted confirmation code.
 * @returns {Record<string, unknown>} Authenticated session or structured API error.
 */
export function verifyLoginChallenge(challengeId, input = {}) {
	purgeExpiredState();
	const challenge = state.challenges.get(String(challengeId || ''));
	if (!challenge) return gone('This sign-in code expired. Request a new one.', { code: 'challenge_expired' });
	if (challenge.consumedAt) return conflict('This sign-in code has already been used.', { code: 'challenge_consumed' });
	if (challenge.lockedAt) return rateLimited('This code was locked after too many attempts. Request a new one.', Date.now() + 1000);
	const code = String(input.code || '').replace(/\D/g, '').slice(0, 6);
	if (code.length !== 6) return validation('Enter all six digits.', [{ field: 'code', message: 'A complete six-digit code is required.' }]);
	if (!challenge.validAccount || code !== challenge.code) {
		challenge.attempts += 1;
		if (challenge.attempts >= maxChallengeAttempts) {
			challenge.lockedAt = new Date().toISOString();
			return rateLimited('This code was locked after five failed attempts. Request a new one.', Date.now() + 1000);
		}
		return validation('That code does not match.', [{
			field: 'code',
			message: `${maxChallengeAttempts - challenge.attempts} attempts remaining.`,
		}]);
	}
	challenge.consumedAt = new Date().toISOString();
	const session = createSession(challenge);
	return cloneValue({
		session: serializeSession(session),
		member: serializeAccount(),
		workspaces,
		receipt: buildSessionReceipt(session),
		message: 'Identity verified. Choose the workspace you want to open.',
	});
}

/**
 * Return a current authenticated session with member and workspace context.
 *
 * @param {string} sessionId Stable process-local session identifier.
 * @returns {Record<string, unknown>} Session payload or structured API error.
 */
export function getLoginSession(sessionId) {
	purgeExpiredState();
	const session = state.sessions.get(String(sessionId || ''));
	if (!session) return unauthorized('This session expired. Sign in again.', { code: 'session_expired' });
	return cloneValue({
		session: serializeSession(session),
		member: serializeAccount(),
		workspaces,
		receipt: buildSessionReceipt(session),
	});
}

/**
 * Select a workspace and produce an immutable handoff receipt for the app shell.
 *
 * @param {string} sessionId Authenticated session identifier.
 * @param {Record<string, unknown>} input Selected workspace identifier.
 * @returns {Record<string, unknown>} Workspace handoff payload or structured API error.
 */
export function handoffLoginSession(sessionId, input = {}) {
	purgeExpiredState();
	const session = state.sessions.get(String(sessionId || ''));
	if (!session) return unauthorized('This session expired. Sign in again.', { code: 'session_expired' });
	const workspace = workspaceById(input.workspaceId);
	if (!workspace) return validation('Choose a workspace you can access.', [{ field: 'workspaceId', message: 'Select one of your Northstar workspaces.' }]);
	session.workspaceId = workspace.id;
	session.status = 'ready';
	session.revision += 1;
	session.updatedAt = new Date().toISOString();
	return cloneValue({
		session: serializeSession(session),
		workspace,
		handoff: {
			path: workspace.path,
			issuedAt: session.updatedAt,
			proof: buildChecksum(['handoff', session.id, workspace.id, session.updatedAt, session.revision]),
		},
		receipt: buildSessionReceipt(session),
		message: `${workspace.label} is ready to open.`,
	});
}

/**
 * Revoke a current session and return a signed sign-out receipt.
 *
 * @param {string} sessionId Authenticated session identifier.
 * @returns {Record<string, unknown>} Sign-out confirmation or structured API error.
 */
export function revokeLoginSession(sessionId) {
	purgeExpiredState();
	const session = state.sessions.get(String(sessionId || ''));
	if (!session) return unauthorized('This session is already signed out or expired.', { code: 'session_expired' });
	const revokedAt = new Date().toISOString();
	state.sessions.delete(session.id);
	return {
		message: 'The demo session was signed out on this device.',
		revokedAt,
		proof: buildChecksum(['signout', session.id, revokedAt]),
	};
}

/**
 * Create the process-local login stores used by the demo API.
 *
 * @returns {{ challenges: Map<string, Record<string, unknown>>, sessions: Map<string, Record<string, unknown>>, passwordAttempts: Map<string, Record<string, number>> }} Empty login state.
 */
function createInitialState() {
	return {
		challenges: new Map(),
		sessions: new Map(),
		passwordAttempts: new Map(),
	};
}

/**
 * Create and persist one verification challenge.
 *
 * @param {{ email: string, purpose: string, remember: boolean, code: string, validAccount?: boolean }} input Challenge values.
 * @returns {Record<string, unknown>} Internal challenge record.
 */
function createChallenge(input) {
	const now = Date.now();
	const challenge = {
		id: `login-challenge-${++challengeSequence}`,
		email: input.email,
		purpose: input.purpose,
		remember: input.remember,
		code: input.code,
		validAccount: input.validAccount !== false,
		attempts: 0,
		createdAt: new Date(now).toISOString(),
		expiresAt: new Date(now + challengeLifetimeMs).toISOString(),
		consumedAt: null,
		lockedAt: null,
	};
	state.challenges.set(challenge.id, challenge);
	return challenge;
}

/**
 * Create a process-local session from a successful verification challenge.
 *
 * @param {Record<string, unknown>} challenge Consumed login challenge.
 * @returns {Record<string, unknown>} Internal session record.
 */
function createSession(challenge) {
	const now = Date.now();
	const session = {
		id: `northstar-session-${++sessionSequence}`,
		memberId: account.id,
		status: 'verified',
		method: challenge.purpose === 'mfa' ? 'Password + MFA' : 'Email sign-in code',
		remembered: challenge.remember,
		workspaceId: workspaces[0].id,
		revision: 1,
		createdAt: new Date(now).toISOString(),
		updatedAt: new Date(now).toISOString(),
		expiresAt: new Date(now + (challenge.remember ? rememberedSessionLifetimeMs : sessionLifetimeMs)).toISOString(),
	};
	state.sessions.set(session.id, session);
	return session;
}

/**
 * Serialize a challenge without exposing its verification code.
 *
 * @param {Record<string, unknown>} challenge Internal challenge record.
 * @returns {Record<string, unknown>} Public challenge payload.
 */
function serializeChallenge(challenge) {
	return {
		id: challenge.id,
		purpose: challenge.purpose,
		destination: challenge.purpose === 'mfa' ? account.mfaMethod : maskEmail(challenge.email),
		attemptsRemaining: maxChallengeAttempts - challenge.attempts,
		createdAt: challenge.createdAt,
		expiresAt: challenge.expiresAt,
	};
}

/**
 * Serialize an authenticated session for browser use.
 *
 * @param {Record<string, unknown>} session Internal session record.
 * @returns {Record<string, unknown>} Public session payload.
 */
function serializeSession(session) {
	return {
		id: session.id,
		status: session.status,
		method: session.method,
		remembered: session.remembered,
		workspaceId: session.workspaceId,
		revision: session.revision,
		createdAt: session.createdAt,
		updatedAt: session.updatedAt,
		expiresAt: session.expiresAt,
	};
}

/**
 * Serialize the demo member without password material.
 *
 * @returns {Record<string, unknown>} Public member identity.
 */
function serializeAccount() {
	return {
		id: account.id,
		name: account.name,
		email: account.email,
		initials: account.initials,
		role: account.role,
	};
}

/**
 * Build immutable proof for the current session state.
 *
 * @param {Record<string, unknown>} session Internal session record.
 * @returns {Record<string, unknown>} Receipt identifiers and checksum.
 */
function buildSessionReceipt(session) {
	return {
		id: `receipt-${session.id}`,
		issuedAt: session.updatedAt,
		checksum: buildChecksum([
			session.id,
			session.status,
			session.workspaceId,
			session.method,
			session.revision,
			session.updatedAt,
		]),
	};
}

/**
 * Read or initialize the failed-password record for one normalized email.
 *
 * @param {string} email Normalized email address.
 * @returns {{ failures: number, lockedUntil: number }} Mutable attempt record.
 */
function passwordAttemptFor(email) {
	if (!state.passwordAttempts.has(email)) {
		state.passwordAttempts.set(email, { failures: 0, lockedUntil: 0 });
	}
	return state.passwordAttempts.get(email);
}

/**
 * Remove expired challenges, sessions, and password lockouts.
 *
 * @returns {void}
 */
function purgeExpiredState() {
	const now = Date.now();
	for (const [id, challenge] of state.challenges) {
		if (Date.parse(challenge.expiresAt) <= now) state.challenges.delete(id);
	}
	for (const [id, session] of state.sessions) {
		if (Date.parse(session.expiresAt) <= now) state.sessions.delete(id);
	}
	for (const attempt of state.passwordAttempts.values()) {
		if (attempt.lockedUntil && attempt.lockedUntil <= now) {
			attempt.failures = 0;
			attempt.lockedUntil = 0;
		}
	}
}

/**
 * Find a workspace membership by its stable identifier.
 *
 * @param {unknown} workspaceId Candidate workspace identifier.
 * @returns {Record<string, unknown>|null} Matching workspace or null.
 */
function workspaceById(workspaceId) {
	return workspaces.find((workspace) => workspace.id === String(workspaceId || '')) || null;
}

/**
 * Normalize an email address for stable account comparisons.
 *
 * @param {unknown} value Candidate email value.
 * @returns {string} Lowercase trimmed email address.
 */
function normalizeEmail(value) {
	return String(value || '').trim().toLowerCase();
}

/**
 * Test the basic shape of an email address.
 *
 * @param {string} value Normalized email address.
 * @returns {boolean} True when the email has a valid local and domain shape.
 */
function isValidEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Mask an email address while keeping enough context for code delivery.
 *
 * @param {string} email Normalized email address.
 * @returns {string} Privacy-safe destination label.
 */
function maskEmail(email) {
	const [local = '', domain = ''] = email.split('@');
	const prefix = local.slice(0, 2);
	return `${prefix}${'*'.repeat(Math.max(2, local.length - 2))}@${domain}`;
}

/**
 * Build a short deterministic checksum from receipt fields.
 *
 * @param {Array<unknown>} values Ordered receipt values.
 * @returns {string} Sixteen-character SHA-256 prefix.
 */
function buildChecksum(values) {
	return createHash('sha256').update(values.join('|')).digest('hex').slice(0, 16);
}

/**
 * Clone a serializable payload before returning it to a caller.
 *
 * @param {unknown} value Serializable value.
 * @returns {any} Detached JSON value.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}

/**
 * Build a validation error response.
 *
 * @param {string} message Human-readable guidance.
 * @param {Array<Record<string, string>>} fields Optional field errors.
 * @returns {Record<string, unknown>} Validation error payload.
 */
function validation(message, fields = []) {
	return { status: 422, error: { code: 'validation_error', message, fields } };
}

/**
 * Build an unauthorized response.
 *
 * @param {string} message Human-readable guidance.
 * @param {Record<string, unknown>} details Optional error metadata.
 * @returns {Record<string, unknown>} Unauthorized error payload.
 */
function unauthorized(message, details = {}) {
	return { status: 401, error: { code: details.code || 'unauthorized', message, ...details } };
}

/**
 * Build a conflict response.
 *
 * @param {string} message Human-readable guidance.
 * @param {Record<string, unknown>} details Optional conflict metadata.
 * @returns {Record<string, unknown>} Conflict error payload.
 */
function conflict(message, details = {}) {
	return { status: 409, error: { code: details.code || 'conflict', message, ...details } };
}

/**
 * Build an expired-resource response.
 *
 * @param {string} message Human-readable guidance.
 * @param {Record<string, unknown>} details Optional expiry metadata.
 * @returns {Record<string, unknown>} Gone error payload.
 */
function gone(message, details = {}) {
	return { status: 410, error: { code: details.code || 'gone', message, ...details } };
}

/**
 * Build a rate-limit response with a retry timestamp.
 *
 * @param {string} message Human-readable guidance.
 * @param {number} retryAt Epoch time when another attempt is allowed.
 * @returns {Record<string, unknown>} Rate-limit error payload.
 */
function rateLimited(message, retryAt) {
	return {
		status: 429,
		error: {
			code: 'rate_limited',
			message,
			retryAt: new Date(retryAt).toISOString(),
		},
	};
}
