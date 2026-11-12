import { createHmac, randomBytes } from 'node:crypto';
import knex from 'knex';
import config from '../../knexfile.js';
import { billingClientAddress } from './billingHttp.js';
import { getBillingOrigin } from './licenceEmail.js';

const sections = new Set(['ai', 'blocks', 'components', 'charts', 'data', 'designer', 'dev', 'forms', 'headless', 'mobile', 'visual', 'theming', 'pricing', 'blog', 'releases', 'paywall']);
const botPattern = /bot|crawler|spider|headless|preview|fetcher|slurp|curl|wget|python|httpclient|scrapy|selenium|playwright|puppeteer|phantom|lighthouse|pagespeed|pingdom|uptime|monitor|facebookexternalhit/i;
let clickDb;

/**
 * Reduces an eligible checkout navigation to allowlisted, anonymous dimensions.
 * Request URLs, account cookies, addresses and raw user agents are never returned.
 * Fetch metadata is a heuristic: non-browser clients can forge these headers.
 *
 * @param {import('express').Request} req Incoming checkout request.
 * @param {number} [now] Server timestamp in milliseconds.
 * @returns {object|null} Daily counter dimensions, or null for excluded traffic.
 */
export function classifyAccessClick(req, now = Date.now()) {
	if (req.method !== 'GET' || req.query?.source !== 'get-full-access'
		|| req.query?.licence !== 'individual' || !['standard', 'compact'].includes(req.query?.placement)) return null;
	const headers = req.headers || {};
	if (headers.dnt === '1' || headers['sec-gpc'] === '1') return null;
	const purpose = `${headers.purpose || ''} ${headers['sec-purpose'] || ''} ${headers['x-purpose'] || ''} ${headers['x-moz'] || ''}`;
	if (/prefetch|prerender|preview/i.test(purpose)) return null;
	const agent = typeof headers['user-agent'] === 'string' ? headers['user-agent'].slice(0, 1024) : '';
	if (botPattern.test(agent) || !/Mozilla\/5\.0/.test(agent) || !/Chrome\/|Safari\/|Firefox\/|FxiOS\//.test(agent)) return null;
	if (headers['sec-fetch-mode'] && headers['sec-fetch-mode'] !== 'navigate') return null;
	if (headers['sec-fetch-dest'] && headers['sec-fetch-dest'] !== 'document') return null;
	if (headers['sec-fetch-site'] && headers['sec-fetch-site'] !== 'same-origin') return null;
	if (headers['sec-fetch-user'] && headers['sec-fetch-user'] !== '?1') return null;

	const origin = new URL(getBillingOrigin());
	const origins = new Set([origin.origin]);
	if (['getdom.studio', 'www.getdom.studio'].includes(origin.hostname)) {
		origins.add('https://getdom.studio');
		origins.add('https://www.getdom.studio');
	}
	let referringPage;
	if (headers.referer) {
		try { referringPage = new URL(headers.referer); } catch { return null; }
		if (!origins.has(referringPage.origin)) return null;
	}
	// A same-origin referrer also supports browsers without Fetch Metadata headers.
	if (!referringPage && !(headers['sec-fetch-site'] === 'same-origin'
		&& headers['sec-fetch-mode'] === 'navigate' && headers['sec-fetch-dest'] === 'document')) return null;
	const path = referringPage?.pathname;
	const firstSegment = path?.split('/')[1];
	const section = !path ? 'unknown' : path === '/' ? 'home' : sections.has(firstSegment) ? firstSegment : 'other';
	const device = /iPad|Tablet/i.test(agent) || (/Android/i.test(agent) && !/Mobile/i.test(agent))
		? 'tablet' : /Mobile|iPhone|iPod|Android/i.test(agent) ? 'mobile' : 'desktop';
	const browser = /Edg(?:e|A|iOS)?\//.test(agent) ? 'edge'
		: /OPR\/|Opera\//.test(agent) ? 'opera'
			: /Firefox\/|FxiOS\//.test(agent) ? 'firefox'
				: /Chrome\/|CriOS\//.test(agent) ? 'chrome'
					: /Safari\//.test(agent) ? 'safari' : 'other';
	return {
		day: new Date(now).toISOString().slice(0, 10),
		placement: req.query.placement, section, device, browser,
		signal: headers['sec-fetch-user'] === '?1' ? 'user-activated' : 'navigation',
	};
}

/**
 * Creates a bounded recorder whose failures never interrupt checkout.
 * A random, minute-lived HMAC key limits an address to ten clicks per minute,
 * with a two-second debounce. Neither the address nor its digest is persisted.
 * Limits are per server process, not a unique-person measurement.
 *
 * @param {{ write?: Function, now?: Function, enabled?: Function, warn?: Function }} [options] Injectable persistence and clock.
 * @returns {(req: import('express').Request) => Promise<boolean>} Best-effort recorder.
 */
export function createAccessClickRecorder({ write = incrementAccessClick, now = Date.now, enabled = accessClickTrackingEnabled, warn = warnAccessClickFailure } = {}) {
	const limits = new Map();
	let secret = randomBytes(32);
	let windowStart = now();
	let expiry;
	let pending = 0;
	let retryAfter = 0;

	/** Clears temporary abuse-limit keys and rotates their process-local secret. */
	function resetLimits() {
		clearTimeout(expiry);
		expiry = undefined;
		limits.clear();
		secret = randomBytes(32);
		windowStart = now();
	}

	/**
	 * Applies eligibility and bounded abuse checks before writing one aggregate.
	 * @param {import('express').Request} req Checkout request.
	 * @returns {Promise<boolean>} Whether persistence completed successfully.
	 */
	return async function record(req) {
		let writing = false;
		try {
			const timestamp = now();
			if (!enabled() || pending >= 4 || timestamp < retryAfter) return false;
			const dimensions = classifyAccessClick(req, timestamp);
			if (!dimensions) return false;
			if (timestamp - windowStart >= 60000) resetLimits();
			const address = billingClientAddress(req);
			if (address === 'unknown') return false;
			const key = createHmac('sha256', secret).update(address).digest('hex');
			const limit = limits.get(key);
			if (limit && (limit.count >= 10 || timestamp - limit.last < 2000)) return false;
			if (!limit && limits.size >= 10000) return false;
			limits.set(key, { count: (limit?.count || 0) + 1, last: timestamp });
			if (!expiry) {
				expiry = setTimeout(resetLimits, Math.max(1, 60000 - (timestamp - windowStart)));
				expiry.unref?.();
			}
			pending += 1;
			writing = true;
			await write(dimensions);
			return true;
		} catch (error) {
			retryAfter = now() + 60000;
			warn(error);
			return false;
		} finally {
			if (writing) pending -= 1;
		}
	};
}

/**
 * Enables production counters by default and requires an explicit local opt-in.
 * @returns {boolean} Whether this deployment should record clicks.
 */
function accessClickTrackingEnabled() {
	return process.env.ACCESS_CLICK_TRACKING === '1'
		|| (process.env.NODE_ENV === 'production' && process.env.ACCESS_CLICK_TRACKING !== '0');
}

/**
 * Logs a bounded operational error without SQL, request data or credentials.
 * @param {Error & { code?: string }} error Persistence/configuration failure.
 * @returns {void}
 */
function warnAccessClickFailure(error) {
	const code = /^[A-Z0-9_]{1,64}$/.test(error.code || '') ? error.code : 'recording_unavailable';
	console.warn('DOM Studio access-click recording unavailable; retrying in one minute.', { code });
}

/**
 * Atomically increments a counter using a small pool separate from account/checkout queries.
 * Pool acquisition and query timeouts bound work when the database is unavailable.
 * @param {object} dimensions Validated anonymous dimensions.
 * @param {import('knex').Knex} [db] Optional isolated integration-test connection.
 * @returns {Promise<void>} Resolves after the counter is durable.
 */
export async function incrementAccessClick(dimensions, db) {
	if (!db) {
		clickDb ||= knex({ ...config, pool: { min: 0, max: 2 }, acquireConnectionTimeout: 1000 });
		db = clickDb;
	}
	await db('access_click_daily').insert({ ...dimensions, clicks: 1 })
		.onConflict(['day', 'placement', 'section', 'device', 'browser', 'signal'])
		.merge({ clicks: db.raw('?? + 1', ['clicks']) }).timeout(1000);
}

export const recordAccessClick = createAccessClickRecorder();
