import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import knex from 'knex';
import config from '../../knexfile.js';
import { up, down } from '../db/migrations/20261112120000_create_access_click_daily.js';
import { classifyAccessClick, createAccessClickRecorder, incrementAccessClick } from './accessClicks.js';
import { accessClickDateRange, accessClickReportCsv, readAccessClickReport, summarizeAccessClicks } from './accessClickReport.js';

const instant = Date.parse('2026-11-12T23:45:00Z');
const chrome = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const publicOrigin = new URL(process.env.BILLING_PUBLIC_URL || 'https://getdom.studio').origin;

/**
 * Builds a native-link navigation without contacting Stripe or using real accounts.
 * @param {object} [headers] Request header overrides.
 * @returns {object} Express-shaped request with a documentation-only network address.
 */
function request(headers = {}) {
	return {
		method: 'GET', query: { licence: 'individual', source: 'get-full-access', placement: 'standard' },
		headers: {
			'user-agent': chrome, referer: `${publicOrigin}/components/button?email=private@example.com#secret`,
			'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document', 'sec-fetch-site': 'same-origin', 'sec-fetch-user': '?1',
			...headers,
		},
		socket: { remoteAddress: '192.0.2.1' },
	};
}

test('stores only allowlisted dimensions and discards private request details', () => {
	const req = request({ cookie: 'dom_studio_session=private', 'x-forwarded-for': '192.0.2.99' });
	req.query.from = '/auth/verify?token=private';
	assert.deepEqual(classifyAccessClick(req, instant), {
		day: '2026-11-12', placement: 'standard', section: 'components', device: 'desktop', browser: 'chrome', signal: 'user-activated',
	});
	assert.equal(classifyAccessClick(request({ referer: `${publicOrigin}/licence/private-token` }), instant).section, 'other');
	assert.equal(classifyAccessClick(request({ referer: `${publicOrigin}/` }), instant).section, 'home');
});

test('ignores non-CTA checkouts, HEAD probes, invalid tags and automated request types', () => {
	for (const changes of [
		{ method: 'HEAD' }, { method: 'POST' }, { query: { licence: 'individual' } },
		{ query: { licence: 'team', source: 'get-full-access', placement: 'standard' } },
		{ query: { licence: 'individual', source: ['get-full-access'], placement: 'standard' } },
		{ query: { licence: 'individual', source: 'get-full-access', placement: 'injected' } },
	]) assert.equal(classifyAccessClick({ ...request(), ...changes }, instant), null);
	for (const headers of [
		{ purpose: 'prefetch' }, { 'sec-purpose': 'prefetch;prerender' }, { 'x-moz': 'prefetch' },
		{ 'sec-fetch-mode': 'cors' }, { 'sec-fetch-dest': 'iframe' }, { 'sec-fetch-site': 'cross-site' },
		{ 'sec-fetch-site': 'none' }, { 'sec-fetch-user': '?0' }, { dnt: '1' }, { 'sec-gpc': '1' },
		{ referer: 'https://other.example/components' }, { referer: 'malformed' },
	]) assert.equal(classifyAccessClick(request(headers), instant), null, JSON.stringify(headers));
	for (const agent of ['', 'curl/8', `${chrome} Googlebot/2.1`, chrome.replace('Chrome', 'HeadlessChrome'), `${chrome} bingbot`, `${chrome} GPTBot`, `${chrome} facebookexternalhit`]) {
		assert.equal(classifyAccessClick(request({ 'user-agent': agent }), instant), null, agent);
	}
});

test('supports Safari without an activation header and labels its weaker navigation signal', () => {
	const agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
	const result = classifyAccessClick(request({ 'user-agent': agent, 'sec-fetch-user': undefined }), instant);
	assert.equal(result.signal, 'navigation');
	assert.equal(result.device, 'mobile');
	assert.equal(result.browser, 'safari');
	const older = request({ 'user-agent': agent, 'sec-fetch-mode': undefined, 'sec-fetch-site': undefined, 'sec-fetch-dest': undefined, 'sec-fetch-user': undefined });
	assert.ok(classifyAccessClick(older, instant));
	delete older.headers.referer;
	assert.equal(classifyAccessClick(older, instant), null);
	assert.equal(classifyAccessClick(request({ referer: undefined }), instant).section, 'unknown');
});

test('classifies coarse device and browser families without keeping versions', () => {
	for (const [agent, device, browser] of [
		[`${chrome} Edg/140.0.0.0`, 'desktop', 'edge'],
		['Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0', 'desktop', 'firefox'],
		[chrome.replace('Macintosh; Intel Mac OS X 10_15_7', 'Linux; Android 13'), 'tablet', 'chrome'],
	]) {
		const result = classifyAccessClick(request({ 'user-agent': agent }), instant);
		assert.equal(result.device, device);
		assert.equal(result.browser, browser);
	}
});

test('debounces repeat clicks, bounds abuse, and resets the temporary address window', async () => {
	let time = instant;
	const saved = [];
	const record = createAccessClickRecorder({
		/** Supplies a deterministic rate-limit clock. */ now: () => time,
		/** Enables this isolated recorder. */ enabled: () => true,
		/** Captures only the aggregate, never the request. */ write: async (row) => { saved.push(row); },
	});
	assert.equal(await record(request()), true);
	assert.equal(await record(request({ 'x-forwarded-for': '192.0.2.2' })), false);
	for (let i = 1; i < 10; i += 1) { time += 2000; assert.equal(await record(request()), true); }
	time += 2000;
	assert.equal(await record(request()), false);
	time = instant + 60000;
	assert.equal(await record(request()), true);
	assert.equal(saved.length, 11);
	assert.equal(JSON.stringify(saved).includes('192.0.2.'), false);
});

test('disabling collection prevents all writes; failures are contained and briefly backed off', async () => {
	let writes = 0;
	let warnings = 0;
	let time = instant;
	/** Models an unavailable database without opening a connection. */
	async function failWrite() { writes += 1; throw new Error('SQL and private request data must not escape'); }
	const disabled = createAccessClickRecorder({
		/** Disables the recorder. */ enabled: () => false,
		write: failWrite,
	});
	assert.equal(await disabled(request()), false);
	assert.equal(writes, 0);
	const record = createAccessClickRecorder({
		/** Enables the isolated recorder. */ enabled: () => true,
		/** Supplies test time. */ now: () => time,
		/** Counts operational warnings. */ warn: () => { warnings += 1; },
		write: failWrite,
	});
	assert.equal(await record(request()), false);
	assert.equal(await record(request()), false);
	assert.equal(writes, 1);
	assert.equal(warnings, 1);
	time += 60000;
	assert.equal(await record(request()), false);
	assert.equal(writes, 2);
});

test('bounds outstanding writes rather than building an unbounded database queue', async () => {
	const releases = [];
	const record = createAccessClickRecorder({
		/** Enables the isolated recorder. */ enabled: () => true,
		/** Holds a write until explicitly released by the test. */ write: () => new Promise(resolve => releases.push(resolve)),
	});
	const pending = [];
	for (let i = 0; i < 4; i += 1) {
		const req = request();
		req.socket.remoteAddress = `192.0.2.${i + 1}`;
		pending.push(record(req));
	}
	const overflow = request();
	overflow.socket.remoteAddress = '192.0.2.99';
	assert.equal(await record(overflow), false);
	for (const release of releases) release();
	assert.deepEqual(await Promise.all(pending), [true, true, true, true]);
});

test('validates inclusive UTC windows across year boundaries and leap days', () => {
	assert.deepEqual(accessClickDateRange({ days: 3 }, new Date('2027-01-02T23:30:00Z')), { from: '2026-12-31', to: '2027-01-02' });
	assert.deepEqual(accessClickDateRange({ from: '2024-02-29', to: '2024-03-01' }), { from: '2024-02-29', to: '2024-03-01' });
	for (const options of [{ days: 0 }, { days: 367 }, { days: 'NaN' }, { from: '2026-11-12' }, { from: '2026-02-29', to: '2026-03-01' }, { from: '2026-11-12', to: '2026-11-01' }, { days: 3, from: '2026-11-10', to: '2026-11-12' }]) {
		assert.throws(() => accessClickDateRange(options));
	}
});

test('reports consistent totals, empty days, date boundaries and CSV', () => {
	const dimensions = classifyAccessClick(request(), instant);
	const report = summarizeAccessClicks([
		{ ...dimensions, day: '2026-11-10', clicks: '2' },
		{ ...dimensions, placement: 'compact', device: 'mobile', clicks: 3 },
		{ ...dimensions, day: '2026-11-13', clicks: 20 },
	], { from: '2026-11-10', to: '2026-11-12' });
	assert.equal(report.total, 5);
	assert.deepEqual(report.daily, [{ day: '2026-11-10', clicks: 2 }, { day: '2026-11-11', clicks: 0 }, { day: '2026-11-12', clicks: 3 }]);
	assert.deepEqual(report.breakdowns.device, [{ value: 'mobile', clicks: 3 }, { value: 'desktop', clicks: 2 }]);
	assert.equal(accessClickReportCsv(report).split('\n').length, 4);
	assert.match(accessClickReportCsv(report), /^day,placement,section,device,browser,signal,clicks\n/);
	assert.equal(summarizeAccessClicks([], { from: '2026-11-12', to: '2026-11-12' }).total, 0);
});

const integration = process.env.ACCESS_CLICKS_TEST_MYSQL === '1';
const database = `getdom_access_clicks_test_${process.pid}`;
let admin;
let db;

before(async () => {
	if (!integration) return;
	const connection = typeof config.connection === 'string'
		? { host: new URL(config.connection).hostname, port: Number(new URL(config.connection).port || 3306), user: decodeURIComponent(new URL(config.connection).username), password: decodeURIComponent(new URL(config.connection).password) }
		: { ...config.connection };
	assert.ok(['localhost', '127.0.0.1', '::1'].includes(connection.host), 'Tests may only connect to local MySQL.');
	delete connection.database;
	admin = knex({ client: 'mysql2', connection });
	await admin.raw('CREATE DATABASE ??', [database]);
	db = knex({ client: 'mysql2', connection: { ...connection, database } });
	await up(db);
});

after(async () => {
	await db?.destroy();
	if (admin) {
		try { await admin.raw('DROP DATABASE IF EXISTS ??', [database]); }
		finally { await admin.destroy(); }
	}
});

test('MySQL atomically counts concurrent clicks and reports through the real schema', { skip: !integration }, async () => {
	const row = classifyAccessClick(request(), instant);
	const writes = [];
	for (let i = 0; i < 40; i += 1) writes.push(incrementAccessClick(row, db));
	await Promise.all(writes);
	await incrementAccessClick({ ...row, day: '2026-11-11', placement: 'compact', device: 'mobile' }, db);
	const report = await readAccessClickReport(db, { from: '2026-11-10', to: '2026-11-12' });
	assert.equal(report.total, 41);
	assert.equal(report.rows.length, 2);
	assert.deepEqual(report.daily.map(day => day.clicks), [0, 1, 40]);
	assert.equal((await readAccessClickReport(db, { from: '2026-11-11', to: '2026-11-11' })).total, 1);
	await down(db);
	await assert.rejects(readAccessClickReport(db, { from: '2026-11-12', to: '2026-11-12' }));
	await up(db);
	assert.equal((await readAccessClickReport(db, { from: '2026-11-12', to: '2026-11-12' })).total, 0);
});
