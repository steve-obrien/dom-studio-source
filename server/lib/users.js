import { randomUUID } from 'node:crypto';
import { getDb } from './db.js';
import { hashPassword, verifyPassword } from './passwords.js';

export const maxFailedLoginAttempts = 20;

export async function findUserById(id) {
	if (!id) return null;
	return getDb()('users').where({ id }).first();
}

export async function findUserByEmail(email) {
	const normalizedEmail = normalizeEmail(email);
	if (!normalizedEmail) return null;
	return getDb()('users').where({ email: normalizedEmail }).first();
}

export async function getUserEntitlements(userId) {
	if (!userId) return [];
	const now = new Date();
	const rows = await getDb()('entitlements')
		.where({ user_id: userId })
		.where((builder) => {
			builder.whereNull('expires_at').orWhere('expires_at', '>', now);
		})
		.select('key');

	return rows.map((row) => row.key);
}

export async function createEmailUser({ email, password, name = '' } = {}) {
	const normalizedEmail = normalizeEmail(email);
	if (!normalizedEmail) {
		throw new Error('Enter a valid email address.');
	}

	if (!password || password.length < 8) {
		throw new Error('Password must be at least 8 characters.');
	}

	const existing = await findUserByEmail(normalizedEmail);
	if (existing) {
		throw new Error('An account already exists for this email.');
	}

	const user = {
		id: randomUUID(),
		email: normalizedEmail,
		name: String(name || '').trim() || null,
		password_hash: await hashPassword(password),
	};

	await getDb()('users').insert(user);
	await getDb()('auth_identities').insert({
		user_id: user.id,
		provider: 'password',
		provider_user_id: normalizedEmail,
		email: normalizedEmail,
	});

	return findUserById(user.id);
}

export async function authenticateEmailUser({ email, password } = {}) {
	const user = await findUserByEmail(email);
	if (!user?.password_hash) {
		return {
			error: 'invalid_credentials',
			user: null,
		};
	}

	if (user.suspended_at) {
		return {
			error: 'account_suspended',
			user: null,
		};
	}

	const valid = await verifyPassword(password || '', user.password_hash);
	if (!valid) {
		await recordFailedLogin(user);
		return {
			error: 'invalid_credentials',
			user: null,
		};
	}

	await resetFailedLogins(user.id);

	return {
		error: null,
		user: await findUserById(user.id),
	};
}

export async function recordFailedLogin(user) {
	if (!user?.id) return;

	await getDb()('users')
		.where({ id: user.id })
		.update({
			failed_login_attempts: getDb().raw('failed_login_attempts + 1'),
			suspended_at: getDb().raw(
				'CASE WHEN failed_login_attempts + 1 > ? THEN COALESCE(suspended_at, CURRENT_TIMESTAMP) ELSE suspended_at END',
				[maxFailedLoginAttempts],
			),
			last_failed_login_at: getDb().fn.now(),
			updated_at: getDb().fn.now(),
		});
}

export async function resetFailedLogins(userId) {
	if (!userId) return;

	await getDb()('users')
		.where({ id: userId })
		.update({
			failed_login_attempts: 0,
			last_failed_login_at: null,
			updated_at: getDb().fn.now(),
		});
}

export async function grantEntitlement(userId, key, provider = 'manual') {
	if (!userId || !key) return;

	await getDb()('entitlements')
		.insert({
			user_id: userId,
			key,
			provider,
		})
		.onConflict(['user_id', 'key'])
		.merge({
			provider,
			expires_at: null,
			granted_at: getDb().fn.now(),
		});
}

export async function markUserPaid(userId) {
	if (!userId) return;
	await getDb()('users')
		.where({ id: userId })
		.update({
			paid_at: getDb().fn.now(),
			updated_at: getDb().fn.now(),
		});
	await grantEntitlement(userId, 'source', 'stripe');
}

export async function serializeUserSession(user) {
	if (!user) {
		return {
			user: null,
			entitlements: [],
			isAuthenticated: false,
		};
	}

	return {
		user: {
			id: user.id,
			email: user.email,
			name: user.name || '',
		},
		entitlements: await getUserEntitlements(user.id),
		isAuthenticated: true,
	};
}

export function normalizeEmail(email) {
	const value = String(email || '').trim().toLowerCase();
	if (!value || !value.includes('@')) return '';
	return value;
}
