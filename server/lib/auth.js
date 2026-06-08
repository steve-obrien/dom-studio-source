import { createHmac, timingSafeEqual } from 'node:crypto';
import { findUserById, serializeUserSession } from './users.js';

export const authCookieName = 'dom_studio_session';

const defaultSession = Object.freeze({
	user: null,
	entitlements: [],
	isAuthenticated: false,
});

export async function getAuthSession(req) {
	const token = readCookie(req, authCookieName);
	const session = token ? verifySessionToken(token) : null;

	if (!session) return { ...defaultSession };

	const user = await findUserById(session.userId);
	if (!user || user.suspended_at) return { ...defaultSession };
	return serializeUserSession(user);
}

export function createSessionCookie({ userId } = {}) {
	const now = Math.floor(Date.now() / 1000);
	const maxAge = Number(process.env.AUTH_SESSION_MAX_AGE || 60 * 60 * 24 * 30);
	const payload = {
		userId: userId || '',
		iat: now,
		exp: now + maxAge,
	};
	const body = encodeBase64Url(JSON.stringify(payload));
	const signature = sign(body);

	return serializeCookie(authCookieName, `${body}.${signature}`, {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge,
	});
}

export function createExpiredSessionCookie() {
	return serializeCookie(authCookieName, '', {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: 0,
	});
}

export function hasEntitlement(session, entitlement) {
	if (!entitlement) return true;
	return Boolean(session?.entitlements?.includes(entitlement));
}

function verifySessionToken(token) {
	const [body, signature] = String(token || '').split('.');
	if (!body || !signature || !isValidSignature(body, signature)) return null;

	try {
		const payload = JSON.parse(decodeBase64Url(body));
		if (!payload.userId || payload.exp < Math.floor(Date.now() / 1000)) return null;
		return payload;
	} catch {
		return null;
	}
}

function isValidSignature(body, signature) {
	const expected = sign(body);
	const given = Buffer.from(signature);
	const actual = Buffer.from(expected);
	if (given.length !== actual.length) return false;
	return timingSafeEqual(given, actual);
}

function sign(value) {
	return createHmac('sha256', getAuthSecret()).update(value).digest('base64url');
}

function getAuthSecret() {
	return process.env.AUTH_SECRET || 'dom-studio-local-dev-secret';
}

function readCookie(req, name) {
	const cookieHeader = req.headers?.cookie || '';
	const cookies = cookieHeader.split(';').map((value) => value.trim());
	const prefix = `${name}=`;
	const match = cookies.find((value) => value.startsWith(prefix));
	return match ? decodeURIComponent(match.slice(prefix.length)) : '';
}

function serializeCookie(name, value, options = {}) {
	const parts = [`${name}=${encodeURIComponent(value)}`];

	if (options.maxAge != null) parts.push(`Max-Age=${options.maxAge}`);
	if (options.path) parts.push(`Path=${options.path}`);
	if (options.httpOnly) parts.push('HttpOnly');
	if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
	if (options.secure) parts.push('Secure');

	return parts.join('; ');
}

function encodeBase64Url(value) {
	return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value) {
	return Buffer.from(value, 'base64url').toString('utf8');
}
