import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { randomBytes, randomUUID } from 'node:crypto';
import knex from 'knex';
import config from '../../knexfile.js';
import { up as authSchema } from '../db/migrations/20260607190000_create_auth_foundation.js';
import { up as licenceSchema } from '../db/migrations/20260925180000_add_guest_licences.js';
import { up as repairLicenceTypes, down as retainLicenceTypes } from '../db/migrations/20260928150000_repair_licence_type_columns.js';
import { fulfillLicence, isLicenceCheckout, isCompletedLicence, licenceEmail, serializeLicence } from './licences.js';
import { consumeLicenceSignIn, hashEmailToken, requestLicenceSignIn } from './licenceAuth.js';
import { allowBillingMutation, billingClientAddress } from './billingHttp.js';
import { sendLicenceEmail } from './licenceEmail.js';

const integration = process.env.BILLING_TEST_MYSQL === '1';
const database = `getdom_billing_test_${process.pid}`;
const env = { STRIPE_INDIVIDUAL_USD_INTRO_PAYMENT_LINK_ID: 'plink_individual', STRIPE_TEAM_USD_INTRO_PAYMENT_LINK_ID: 'plink_team', STRIPE_LEGACY_PAYMENT_LINK_IDS: 'plink_legacy' };
let admin;
let db;
let messages = [];

/** Captures test mail locally; no email provider is contacted by this suite. */
async function send(message) { messages.push(message); }

/** Creates a Stripe-shaped payment from a configured, server-owned offer. */
function session(overrides = {}) {
	return {
		id: `cs_test_${randomBytes(20).toString('hex')}`, mode: 'payment', payment_status: 'paid',
		payment_link: 'plink_individual', metadata: { dom_studio_licence: 'individual' },
		currency: 'usd', amount_total: 9900,
		customer_details: { email: 'buyer@example.com', name: 'Example Buyer' },
		...overrides,
	};
}

/** Inserts test-only inbox proof, preserving the production hash-only storage boundary. */
async function proof(email = 'buyer@example.com', expiresAt = new Date(Date.now() + 60000)) {
	const token = randomBytes(32).toString('hex');
	await db('email_sign_in_tokens').insert({ token_hash: hashEmailToken(token), email, expires_at: expiresAt });
	return token;
}

before(async () => {
	if (!integration) return;
	const connection = typeof config.connection === 'string'
		? { host: new URL(config.connection).hostname, port: Number(new URL(config.connection).port || 3306), user: decodeURIComponent(new URL(config.connection).username), password: decodeURIComponent(new URL(config.connection).password) }
		: { ...config.connection };
	assert.ok(['localhost', '127.0.0.1', '::1'].includes(connection.host), 'Integration tests only connect to local MySQL.');
	delete connection.database;
	admin = knex({ client: 'mysql2', connection });
	await admin.raw('CREATE DATABASE ??', [database]);
	db = knex({ client: 'mysql2', connection: { ...connection, database } });
	await authSchema(db);
	await licenceSchema(db);
});

beforeEach(async () => {
	messages = [];
	if (!db) return;
	for (const table of ['email_sign_in_tokens', 'email_request_limits', 'stripe_checkout_sessions', 'entitlements', 'auth_identities', 'users']) await db(table).delete();
});

after(async () => {
	await db?.destroy();
	if (admin) {
		try { await admin.raw('DROP DATABASE IF EXISTS ??', [database]); }
		finally { await admin.destroy(); }
	}
});

test('legacy schema repair restores fulfilment and claiming without losing existing licence types', { skip: !integration }, async () => {
	await db.schema.alterTable('users', (table) => table.dropColumn('licence_type'));
	await db.schema.alterTable('stripe_checkout_sessions', (table) => table.dropColumn('licence_type'));
	const userId = randomUUID();
	await db('users').insert({ id: userId, email: 'buyer@example.com', email_verified_at: db.fn.now() });
	await repairLicenceTypes(db);
	assert.equal((await db('users').where({ id: userId }).first()).licence_type, null);
	const purchase = await fulfillLicence(session({ metadata: { dom_studio_licence: 'team' }, payment_link: 'plink_team' }), 'evt_repaired', { db, send, env });
	await consumeLicenceSignIn(await proof(), { db });
	await repairLicenceTypes(db);
	await retainLicenceTypes(db);
	assert.equal((await db('users').where({ id: userId }).first()).licence_type, 'team');
	const saved = await db('stripe_checkout_sessions').where({ id: purchase.id }).first();
	assert.equal(saved.licence_type, 'team');
	assert.equal(saved.user_id, userId);
	assert.equal(saved.payment_status, 'paid');
	assert.equal((await db('entitlements').where({ user_id: userId, key: 'source' }).first()).provider, 'stripe');
	assert.equal(messages.length, 1);
});

test('licence schema repair completes a partial upgrade and preserves the existing column', { skip: !integration }, async () => {
	const userId = randomUUID();
	await db('users').insert({ id: userId, email: 'buyer@example.com', licence_type: 'team' });
	await db.schema.alterTable('stripe_checkout_sessions', (table) => table.dropColumn('licence_type'));
	await repairLicenceTypes(db);
	assert.equal(await db.schema.hasColumn('stripe_checkout_sessions', 'licence_type'), true);
	assert.equal((await db('users').where({ id: userId }).first()).licence_type, 'team');
});

test('only configured Stripe licence links identify new purchases', () => {
	assert.equal(isLicenceCheckout(session(), env), true);
	assert.equal(isLicenceCheckout(session({ payment_link: 'plink_unrelated' }), env), false);
	assert.equal(isLicenceCheckout(session({ metadata: { dom_studio_licence: 'team' } }), env), false);
	assert.equal(isLicenceCheckout(session({ mode: 'subscription' }), env), false);
	assert.equal(licenceEmail(' BUYER@example.com '), 'buyer@example.com');
	assert.equal(licenceEmail('buyer@example.com\nBcc:attacker@example.com'), '');
});

test('cross-origin and non-JSON account mutations are rejected', () => {
	const res = { setHeader() {}, status(value) { this.code = value; } };
	assert.equal(allowBillingMutation({ is: () => true, headers: { origin: 'https://attacker.example' } }, res), false);
	assert.equal(res.code, 403);
	assert.equal(allowBillingMutation({ is: () => false, headers: {} }, res), false);
	assert.equal(allowBillingMutation({ is: () => true, headers: {} }, res), true);
});

test('rate limits trust forwarding addresses only through explicitly configured proxies', () => {
	const previous = process.env.BILLING_TRUST_PROXY_IPS;
	process.env.BILLING_TRUST_PROXY_IPS = '127.0.0.1';
	try {
		assert.equal(billingClientAddress({ socket: { remoteAddress: '203.0.113.10' }, headers: { 'x-forwarded-for': '198.51.100.2' } }), '203.0.113.10');
		assert.equal(billingClientAddress({ socket: { remoteAddress: '::ffff:127.0.0.1' }, headers: { 'x-forwarded-for': '198.51.100.2, 203.0.113.10' } }), '203.0.113.10');
	} finally {
		if (previous === undefined) delete process.env.BILLING_TRUST_PROXY_IPS; else process.env.BILLING_TRUST_PROXY_IPS = previous;
	}
});

test('email transport supplies attachment and idempotency key without a real delivery', async (t) => {
	t.mock.method(globalThis, 'fetch', async (url, request) => {
		assert.equal(url, 'https://api.resend.com/emails');
		assert.equal(request.headers['Idempotency-Key'], 'test-message');
		assert.equal(JSON.parse(request.body).attachments[0].filename, 'licence.txt');
		return { ok: true };
	});
	const old = [process.env.RESEND_API_KEY, process.env.LICENCE_EMAIL_FROM];
	process.env.RESEND_API_KEY = 're_test_placeholder';
	process.env.LICENCE_EMAIL_FROM = 'DOM Studio <test@example.com>';
	try {
		await sendLicenceEmail({ to: 'buyer@example.com', subject: 'Test', text: 'Proof', key: 'test-message', attachments: [{ filename: 'licence.txt', content: 'UHJvb2Y=' }] });
	} finally {
		for (const [index, key] of ['RESEND_API_KEY', 'LICENCE_EMAIL_FROM'].entries()) {
			if (old[index] === undefined) delete process.env[key]; else process.env[key] = old[index];
		}
	}
});

test('guest payment produces durable proof without creating an account; retries keep its identity', { skip: !integration }, async () => {
	const checkout = session({ client_reference_id: `${randomUUID()}_team` });
	const first = await fulfillLicence(checkout, 'evt_first', { db, env, send });
	const second = await fulfillLicence(checkout, 'evt_retry', { db, env, send });
	assert.equal(first.user_id, null);
	assert.equal((await db('users')).length, 0);
	assert.equal((await db('entitlements')).length, 0);
	assert.equal(first.licence_type, 'individual');
	assert.equal(first.licence_reference, second.licence_reference);
	assert.equal(messages.length, 1);
	assert.match(Buffer.from(messages[0].attachments[0].content, 'base64').toString(), /Commercial License 1.0/);
	assert.match(serializeLicence(first).confirmation, /Example Buyer/);
	assert.equal((await db('stripe_checkout_sessions')).length, 1);
});

test('concurrent payment events share one licence and provider idempotency key', { skip: !integration }, async () => {
	const checkout = session();
	const rows = await Promise.all([fulfillLicence(checkout, 'evt_a', { db, env, send }), fulfillLicence(checkout, 'evt_b', { db, env, send })]);
	assert.equal(new Set(rows.map((row) => row.licence_reference)).size, 1);
	assert.equal(new Set(messages.map((message) => message.key)).size, 1);
	assert.equal(new Set(messages.map((message) => message.text)).size, 1);
});

test('completed free orders issue proof and can be claimed once through email', { skip: !integration }, async () => {
	const checkout = session({ payment_status: 'no_payment_required', status: 'complete', amount_total: 0, payment_intent: null });
	const purchase = await fulfillLicence(checkout, 'evt_free', { db, env, send });
	assert.equal(isCompletedLicence(purchase), true);
	assert.equal(purchase.receipt_url, null);
	assert.match(serializeLicence(purchase).confirmation, /Paid: 0.00 USD/);
	assert.equal(messages.length, 1);
	await requestLicenceSignIn('buyer@example.com', 'free-order-test', { db, send });
	assert.equal(messages.length, 2);
	const token = messages[1].text.match(/#token=([a-f0-9]{64})/)[1];
	const user = await consumeLicenceSignIn(token, { db });
	assert.ok(user.email_verified_at);
	assert.equal((await db('entitlements').where({ user_id: user.id, key: 'source' })).length, 1);
	assert.equal(await consumeLicenceSignIn(token, { db }), null);
	const late = await fulfillLicence({ ...checkout, payment_status: 'failed' }, 'evt_late_failure', { db, env, send });
	assert.equal(late.payment_status, 'no_payment_required');
	assert.equal(late.licence_reference, purchase.licence_reference);
	assert.equal(messages.length, 2);
});

test('open or nonzero no-payment-required sessions do not grant licences', { skip: !integration }, async () => {
	for (const overrides of [{ status: 'open', amount_total: 0 }, { status: 'complete', amount_total: 9900 }]) {
		const purchase = await fulfillLicence(session({ payment_status: 'no_payment_required', ...overrides }), 'evt_incomplete', { db, env, send });
		assert.equal(isCompletedLicence(purchase), false);
		assert.equal(purchase.confirmation_text, null);
	}
	await requestLicenceSignIn('buyer@example.com', 'incomplete-order-test', { db, send });
	assert.equal(messages.length, 0);
	assert.equal((await db('email_sign_in_tokens')).length, 0);
});

test('delayed payments grant nothing until paid; late unpaid events cannot reverse fulfilment', { skip: !integration }, async () => {
	const checkout = session({ payment_status: 'unpaid' });
	await fulfillLicence(checkout, 'evt_pending', { db, env, send });
	assert.equal(messages.length, 0);
	assert.equal((await db('stripe_checkout_sessions').first()).completed_at, null);
	await fulfillLicence({ ...checkout, payment_status: 'paid' }, 'evt_settled', { db, env, send });
	const row = await fulfillLicence(checkout, 'evt_late', { db, env, send });
	assert.equal(row.payment_status, 'paid');
	assert.equal(messages.length, 1);
});

test('email failure leaves the paid licence recoverable and retryable', { skip: !integration }, async () => {
	const checkout = session();
	await assert.rejects(fulfillLicence(checkout, 'evt_fail', { db, env, send: async () => { throw new Error('Mail unavailable'); } }));
	const saved = await db('stripe_checkout_sessions').first();
	assert.equal(saved.payment_status, 'paid');
	assert.equal(saved.confirmation_sent_at, null);
	const retry = await fulfillLicence(checkout, 'evt_retry', { db, env, send });
	assert.equal(retry.licence_reference, saved.licence_reference);
	assert.equal(messages.length, 1);
});

test('failed delayed payments never issue a licence or send a confirmation', { skip: !integration }, async () => {
	const checkout = session({ payment_status: 'unpaid' });
	await fulfillLicence(checkout, 'evt_pending', { db, env, send });
	await fulfillLicence({ ...checkout, payment_status: 'failed' }, 'evt_failed', { db, env, send });
	const row = await fulfillLicence(checkout, 'evt_late_pending', { db, env, send });
	assert.equal(row.payment_status, 'failed');
	assert.equal(row.confirmation_text, null);
	assert.equal(messages.length, 0);
	assert.equal((await db('entitlements')).length, 0);
});

test('purchase proof uses the signed payment date rather than the webhook retry date', { skip: !integration }, async () => {
	const checkout = session();
	const occurredAt = 1760000000;
	const row = await fulfillLicence(checkout, 'evt_delayed_delivery', { db, env, send, occurredAt });
	assert.equal(new Date(row.completed_at).getTime(), occurredAt * 1000);
	const retry = await fulfillLicence(checkout, 'evt_retry', { db, env, send, occurredAt: occurredAt + 86400 });
	assert.equal(new Date(retry.completed_at).getTime(), occurredAt * 1000);
});

test('unrelated Stripe payments cannot create licences', { skip: !integration }, async () => {
	assert.equal(await fulfillLicence(session({ payment_link: 'plink_unrelated' }), 'evt_unrelated', { db, env, send }), null);
	assert.equal((await db('stripe_checkout_sessions')).length, 0);
});

test('only inbox proof links purchases; a different email and forged reference cannot claim them', { skip: !integration }, async () => {
	await fulfillLicence(session(), 'evt_paid', { db, env, send });
	const other = await consumeLicenceSignIn(await proof('other@example.com'), { db });
	assert.equal((await db('entitlements').where({ user_id: other.id })).length, 0);
	const token = await proof();
	const user = await consumeLicenceSignIn(token, { db });
	assert.ok(user.email_verified_at);
	assert.equal(user.licence_type, 'individual');
	assert.equal((await db('stripe_checkout_sessions').first()).user_id, user.id);
	assert.equal((await db('entitlements').where({ user_id: user.id })).length, 1);
	assert.equal(await consumeLicenceSignIn(token, { db }), null);
});

test('expired and concurrent verification tokens cannot be reused', { skip: !integration }, async () => {
	assert.equal(await consumeLicenceSignIn(await proof('expired@example.com', new Date(Date.now() - 1000)), { db }), null);
	const token = await proof();
	const users = await Promise.all([consumeLicenceSignIn(token, { db }), consumeLicenceSignIn(token, { db })]);
	assert.equal(users.filter(Boolean).length, 1);
	assert.equal((await db('users')).length, 1);
});

test('claiming an unverified registration revokes its password and existing sessions', { skip: !integration }, async () => {
	const id = randomUUID();
	await db('users').insert({ id, email: 'buyer@example.com', password_hash: 'attacker-password-hash', session_version: 0 });
	await db('auth_identities').insert({ user_id: id, provider: 'password', provider_user_id: 'buyer@example.com' });
	await fulfillLicence(session(), 'evt_paid', { db, env, send });
	const user = await consumeLicenceSignIn(await proof(), { db });
	assert.equal(user.id, id);
	assert.equal(user.password_hash, null);
	assert.equal(user.session_version, 1);
	assert.equal((await db('auth_identities')).length, 0);
});

test('verified accounts retain passwords and Team access when claiming another Individual licence', { skip: !integration }, async () => {
	const id = randomUUID();
	await db('users').insert({ id, email: 'buyer@example.com', password_hash: 'existing-password-hash', email_verified_at: new Date(), licence_type: 'team' });
	await fulfillLicence(session(), 'evt_paid', { db, env, send });
	const user = await consumeLicenceSignIn(await proof(), { db });
	assert.equal(user.id, id);
	assert.equal(user.password_hash, 'existing-password-hash');
	assert.equal(user.session_version, 0);
	assert.equal(user.licence_type, 'team');
});

test('requesting links is generic, hash-only, rate-limited, and skips suspended accounts', { skip: !integration }, async () => {
	await requestLicenceSignIn('missing@example.com', 'local-test', { db, send });
	assert.equal(messages.length, 0);
	await fulfillLicence(session(), 'evt_paid', { db, env, send });
	messages = [];
	await requestLicenceSignIn('buyer@example.com', 'local-test', { db, send });
	await requestLicenceSignIn('buyer@example.com', 'local-test', { db, send });
	assert.equal(messages.length, 1);
	const token = messages[0].text.match(/#token=([a-f0-9]+)/)[1];
	assert.equal((await db('email_sign_in_tokens').first()).token_hash, hashEmailToken(token));
	const user = await consumeLicenceSignIn(token, { db });
	await db('users').where({ id: user.id }).update({ suspended_at: new Date() });
	assert.equal(await consumeLicenceSignIn(await proof(), { db }), null);
});

test('configured legacy GBP purchases preserve access for verified owners', { skip: !integration }, async () => {
	const id = randomUUID();
	await db('users').insert({ id, email: 'buyer@example.com', email_verified_at: new Date() });
	await fulfillLicence(session({ currency: 'gbp', amount_total: 100, payment_link: 'plink_legacy', client_reference_id: `${id}_team`, metadata: {} }), 'evt_legacy', { db, env, send });
	assert.equal((await db('users').first()).licence_type, 'team');
	assert.equal((await db('entitlements').first()).user_id, id);
});

test('legacy buyer-editable references cannot grant access to an unverified registration', { skip: !integration }, async () => {
	const id = randomUUID();
	await db('users').insert({ id, email: 'buyer@example.com' });
	const checkout = session({ currency: 'gbp', amount_total: 100, payment_link: 'plink_legacy', client_reference_id: `${id}_individual`, metadata: {} });
	await fulfillLicence(checkout, 'evt_legacy', { db, env, send });
	assert.equal((await db('stripe_checkout_sessions').first()).user_id, null);
	assert.equal((await db('entitlements')).length, 0);
	const user = await consumeLicenceSignIn(await proof(), { db });
	assert.equal(user.id, id);
	assert.equal(user.licence_type, 'individual');
	assert.equal(await fulfillLicence({ ...checkout, id: 'cs_unrelated', payment_link: 'plink_unrelated' }, 'evt_unrelated', { db, env, send }), null);
});
