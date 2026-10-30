import { getBillingOrigin } from './licenceEmail.js';
import { isIP } from 'node:net';

/**
 * Resolves the first untrusted client hop through explicitly configured reverse proxies.
 * Arbitrary forwarding headers cannot bypass rate limits from a direct connection.
 *
 * @param {import('express').Request} req Incoming request.
 * @returns {string} Client address for shared rate limits.
 */
export function billingClientAddress(req) {
	const trusted = new Set(String(process.env.BILLING_TRUST_PROXY_IPS || '').split(',').map((value) => value.trim()).filter(Boolean));
	let address = String(req.socket?.remoteAddress || 'unknown').replace(/^::ffff:/, '');
	const hops = String(req.headers['x-forwarded-for'] || '').split(',').map((value) => value.trim()).reverse();
	for (const hop of hops) {
		if (!trusted.has(address) || !isIP(hop)) break;
		address = hop.replace(/^::ffff:/, '');
	}
	return address;
}

/**
 * Marks purchase and authentication responses private and non-indexable.
 *
 * @param {import('express').Response} res Outgoing response.
 * @returns {void}
 */
export function privateBillingResponse(res) {
	res.setHeader('Cache-Control', 'no-store');
	res.setHeader('Referrer-Policy', 'no-referrer');
	res.setHeader('X-Robots-Tag', 'noindex, nofollow');
}

/**
 * Requires JSON and the configured origin for browser mutations to prevent login CSRF.
 *
 * @param {import('express').Request} req Incoming request.
 * @param {import('express').Response} res Outgoing response.
 * @returns {boolean} Whether processing may continue.
 */
export function allowBillingMutation(req, res) {
	privateBillingResponse(res);
	if (!req.is('application/json') || req.headers['sec-fetch-site'] === 'cross-site'
		|| (req.headers.origin && req.headers.origin !== getBillingOrigin())) {
		res.status(403);
		return false;
	}
	return true;
}
