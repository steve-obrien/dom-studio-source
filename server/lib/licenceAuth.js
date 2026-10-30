import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { getDb } from './db.js';
import { licenceEmail, grantLicenceAccess, completedPaymentStatuses } from './licences.js';
import { getBillingOrigin, sendLicenceEmail } from './licenceEmail.js';

/**
 * Hashes tokens and rate-limit identities so raw credentials and addresses are not stored there.
 *
 * @param {string} value Secret or bucket identity.
 * @returns {string} SHA-256 digest.
 */
export function hashEmailToken(value) {
	return createHash('sha256').update(value).digest('hex');
}

/**
 * Atomically enforces shared limits across processes and removes expired rate-limit buckets.
 *
 * @param {import('knex').Knex} db Database connection.
 * @param {string} identity Address or client bucket identity.
 * @param {number} maximum Maximum requests per window.
 * @param {number} windowMs Fixed window size in milliseconds.
 * @returns {Promise<boolean>} Whether this attempt is allowed.
 */
async function takeEmailLimit(db, identity, maximum, windowMs) {
	const window = Math.floor(Date.now() / windowMs);
	const bucket = hashEmailToken(`${identity}:${window}`);
	await db('email_request_limits').where('expires_at', '<', new Date()).delete();
	return db.transaction(async (trx) => {
		await trx('email_request_limits').insert({ bucket, attempts: 0, expires_at: new Date((window + 1) * windowMs) }).onConflict('bucket').ignore();
		const row = await trx('email_request_limits').where({ bucket }).forUpdate().first();
		if (row.attempts >= maximum) return false;
		await trx('email_request_limits').where({ bucket }).increment('attempts', 1);
		return true;
	});
}

/**
 * Sends a short-lived sign-in link only to an existing account or a paid purchaser.
 * Callers always return the same public response, including unknown and throttled emails.
 *
 * @param {string} address Requested email.
 * @param {string} client Trusted connection identity; forwarded headers are not trusted here.
 * @param {{ db?: import('knex').Knex, send?: Function }} [options] Infrastructure dependencies.
 * @returns {Promise<void>}
 */
export async function requestLicenceSignIn(address, client, { db = getDb(), send = sendLicenceEmail } = {}) {
	const email = licenceEmail(address);
	if (!await takeEmailLimit(db, `client:${client}`, 30, 3600000)) return;
	if (!email || !await takeEmailLimit(db, `email:${email}`, 5, 3600000)
		|| !await takeEmailLimit(db, `cooldown:${email}`, 1, 60000)) return;
	const user = await db('users').where({ email }).first();
	const purchase = await db('stripe_checkout_sessions').where({ purchaser_email: email })
		.whereIn('payment_status', completedPaymentStatuses).whereNotNull('completed_at').first();
	if ((!user && !purchase) || user?.suspended_at) return;
	await db('email_sign_in_tokens').where('expires_at', '<', new Date()).delete();
	const token = randomBytes(32).toString('hex');
	const tokenHash = hashEmailToken(token);
	await db('email_sign_in_tokens').insert({ token_hash: tokenHash, email, expires_at: new Date(Date.now() + 20 * 60000) });
	await send({
		to: email,
		subject: 'Your DOM Studio sign-in link',
		key: `sign-in-${tokenHash}`,
		text: `Verify your email and continue to DOM Studio:\n\n${getBillingOrigin()}/auth/verify#token=${token}\n\nThis link expires in 20 minutes and can be used once. If you purchased a licence, continuing creates or signs you into your account and links your purchase. If you did not request this, ignore this email.`,
	});
}

/**
 * Consumes proof of inbox ownership once, then claims paid licences in the same transaction.
 * Unverified password registrations are reset and their sessions revoked to prevent someone
 * registering a buyer's email before purchase from retaining access to the claimed licence.
 *
 * @param {string} token Raw email token from the explicit verification action.
 * @param {{ db?: import('knex').Knex }} [options] Database dependency.
 * @returns {Promise<object|null>} Verified account, or null for expired/used/invalid proof.
 */
export async function consumeLicenceSignIn(token, { db = getDb() } = {}) {
	if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return null;
	return db.transaction(async (trx) => {
		const proof = await trx('email_sign_in_tokens').where({ token_hash: hashEmailToken(token) }).forUpdate().first();
		if (!proof || proof.used_at || new Date(proof.expires_at).getTime() <= Date.now()) return null;
		await trx('users').insert({ id: randomUUID(), email: proof.email }).onConflict('email').ignore();
		const user = await trx('users').where({ email: proof.email }).forUpdate().first();
		if (user.suspended_at) return null;
		await trx('email_sign_in_tokens').where({ token_hash: proof.token_hash }).update({ used_at: trx.fn.now() });
		if (!user.email_verified_at) {
			await trx('users').where({ id: user.id }).update({ password_hash: null, session_version: Number(user.session_version || 0) + 1 });
			await trx('auth_identities').where({ user_id: user.id, provider: 'password' }).delete();
		}
		await trx('users').where({ id: user.id }).update({ email_verified_at: trx.fn.now(), failed_login_attempts: 0, updated_at: trx.fn.now() });
		const purchases = await trx('stripe_checkout_sessions')
			.where({ purchaser_email: proof.email }).whereIn('payment_status', completedPaymentStatuses).whereNotNull('completed_at')
			.where((query) => query.whereNull('user_id').orWhere('user_id', user.id))
			.forUpdate();
		if (purchases.length) {
			await trx('stripe_checkout_sessions').whereIn('id', purchases.map((purchase) => purchase.id)).update({ user_id: user.id });
			await grantLicenceAccess(trx, user.id, purchases.some((purchase) => purchase.licence_type === 'team') ? 'team' : 'individual');
		}
		return trx('users').where({ id: user.id }).first();
	});
}
