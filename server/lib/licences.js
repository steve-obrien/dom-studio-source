import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { getDb } from './db.js';
import { getCheckoutReference } from './billingCheckout.js';
import { getBillingOrigin, sendLicenceEmail } from './licenceEmail.js';

const licenceTerms = readFileSync(new URL('../../LICENSE.md', import.meta.url), 'utf8');

export const completedPaymentStatuses = ['paid', 'no_payment_required'];

/**
 * Identifies a durable licence whose payment or completed zero-cost checkout was verified.
 *
 * @param {object|undefined} purchase Stored purchase row.
 * @returns {boolean} Whether licence evidence and account access may be returned.
 */
export function isCompletedLicence(purchase) {
	return Boolean(purchase?.completed_at && completedPaymentStatuses.includes(purchase.payment_status));
}

/**
 * Normalises a purchaser address without accepting control characters or oversized input.
 *
 * @param {unknown} value User or Stripe email value.
 * @returns {string} Normalised email, or an empty string.
 */
export function licenceEmail(value) {
	const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
	return email.length <= 191 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

/**
 * Recognises configured licence Payment Links; browser-supplied references grant no access.
 * Previously recorded sessions and legacy authenticated purchases remain supported.
 *
 * @param {object} session Stripe-owned Checkout Session.
 * @param {object} [env=process.env] Server configuration.
 * @returns {boolean} Whether the session belongs to a configured new licence offer.
 */
export function isLicenceCheckout(session, env = process.env) {
	const licence = session.metadata?.dom_studio_licence;
	const link = typeof session.payment_link === 'string' ? session.payment_link : session.payment_link?.id;
	return ['individual', 'team'].includes(licence) && session.mode === 'payment'
		&& ['', '_INTRO'].some((phase) => Boolean(link) && link === env[`STRIPE_${licence.toUpperCase()}_USD${phase}_PAYMENT_LINK_ID`]);
}

/**
 * Records signed/retrieved Stripe evidence independently of an account. Retries preserve
 * the licence reference, original terms and cleared payment state. Email failure is thrown
 * after persistence so Stripe can retry delivery without losing or duplicating the licence.
 *
 * @param {object} session Verified Stripe Checkout Session.
 * @param {string} eventId Stripe event ID or reconciliation label.
 * @param {{ db?: import('knex').Knex, send?: Function, env?: object, occurredAt?: number }} [options] Infrastructure and signed event time.
 * @returns {Promise<object|null>} Durable purchase, or null for unrelated Stripe payments.
 */
export async function fulfillLicence(session, eventId, { db = getDb(), send = sendLicenceEmail, env = process.env, occurredAt } = {}) {
	const existing = await db('stripe_checkout_sessions').where({ stripe_session_id: session.id }).first();
	const reference = getCheckoutReference(session);
	const currentOffer = isLicenceCheckout(session, env);
	const paymentLink = typeof session.payment_link === 'string' ? session.payment_link : session.payment_link?.id;
	const legacyLinks = String(env.STRIPE_LEGACY_PAYMENT_LINK_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
	// Legacy links are explicitly allowlisted; an arbitrary GBP payment is not a licence.
	const legacyUser = !currentOffer && legacyLinks.includes(paymentLink) && reference.userId
		? await db('users').where({ id: reference.userId }).first() : null;
	if (!currentOffer && !existing && !legacyUser) return null;
	if (session.mode !== 'payment') return null;
	const email = licenceEmail(session.customer_details?.email || session.customer_email || legacyUser?.email);
	const legacyOwner = legacyUser?.email_verified_at && email === licenceEmail(legacyUser.email) ? legacyUser : null;
	if (!email && !existing?.purchaser_email) throw new Error('Paid licence is missing a purchaser email.');
	const charge = session.payment_intent?.latest_charge;
	const timestamp = Number(occurredAt || charge?.created || session.created);
	const paidAt = Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp * 1000) : new Date();
	const receipt = typeof charge === 'object' && /^https:\/\/pay\.stripe\.com\//.test(charge?.receipt_url || '') ? charge.receipt_url : null;
	const settled = session.payment_status === 'paid' || (session.payment_status === 'no_payment_required'
		&& session.status === 'complete' && session.amount_total === 0);
	const purchase = await db.transaction(async (trx) => {
		await trx('stripe_checkout_sessions').insert({
			stripe_session_id: session.id,
			user_id: legacyOwner?.id || null,
			stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
			client_reference_id: session.client_reference_id || null,
			licence_type: reference.licenceType,
			purchaser_email: email,
			purchaser_name: String(session.customer_details?.business_name || session.customer_details?.name || '').slice(0, 255),
			licence_reference: `DOM-${randomUUID().toUpperCase()}`,
			licence_terms: licenceTerms,
			terms_version: '1.0',
			payment_status: session.payment_status || 'unpaid',
			mode: session.mode,
			amount_total: session.amount_total ?? null,
			currency: session.currency || '',
			raw_event_id: eventId,
			receipt_url: receipt,
			completed_at: settled ? paidAt : null,
		}).onConflict('stripe_session_id').ignore();
		const row = await trx('stripe_checkout_sessions').where({ stripe_session_id: session.id }).forUpdate().first();
		const patch = {
			purchaser_email: row.purchaser_email || email,
			purchaser_name: row.purchaser_name || String(session.customer_details?.business_name || session.customer_details?.name || '').slice(0, 255),
			licence_reference: row.licence_reference || `DOM-${randomUUID().toUpperCase()}`,
			licence_terms: row.licence_terms || licenceTerms,
			terms_version: row.terms_version || '1.0',
			...(receipt ? { receipt_url: receipt } : {}),
			...(session.payment_status === 'failed' && !isCompletedLicence(row) ? { payment_status: 'failed' } : {}),
			...(settled ? { payment_status: session.payment_status, completed_at: row.completed_at || paidAt } : {}),
			updated_at: trx.fn.now(),
		};
		await trx('stripe_checkout_sessions').where({ id: row.id }).update(patch);
		const saved = await trx('stripe_checkout_sessions').where({ id: row.id }).first();
		if (isCompletedLicence(saved) && !saved.confirmation_text) {
			saved.confirmation_text = licenceConfirmation(saved);
			await trx('stripe_checkout_sessions').where({ id: saved.id }).update({ confirmation_text: saved.confirmation_text });
		}
		if (legacyOwner && isCompletedLicence(saved)) await grantLicenceAccess(trx, legacyOwner.id, saved.licence_type);
		return saved;
	});
	if (isCompletedLicence(purchase) && !purchase.confirmation_sent_at) {
		const confirmation = licenceConfirmation(purchase);
		await send({
			to: purchase.purchaser_email,
			subject: `Your DOM Studio ${purchase.licence_type} licence`,
			key: `licence-${purchase.licence_reference}`,
			text: `${confirmation}\n\nYour licence is valid without an account. To set up an account for source access, verify your purchase email at ${getBillingOrigin()}/licence.\n`,
			attachments: [{ filename: `${purchase.licence_reference}.txt`, content: Buffer.from(confirmation).toString('base64') }],
		});
		await db('stripe_checkout_sessions').where({ id: purchase.id }).update({ confirmation_sent_at: db.fn.now() });
	}
	return purchase;
}

/**
 * Grants source access in the caller's transaction without downgrading an existing Team licence.
 *
 * @param {import('knex').Knex.Transaction} trx Transaction holding the user's lock.
 * @param {string} userId Verified account ID.
 * @param {string} licenceType Purchased licence.
 * @returns {Promise<void>}
 */
export async function grantLicenceAccess(trx, userId, licenceType) {
	const user = await trx('users').where({ id: userId }).forUpdate().first();
	if (!user || user.suspended_at) return;
	await trx('users').where({ id: userId }).update({
		paid_at: user.paid_at || trx.fn.now(),
		licence_type: user.licence_type === 'team' || licenceType === 'team' ? 'team' : 'individual',
		updated_at: trx.fn.now(),
	});
	await trx('entitlements').insert({ user_id: userId, key: 'source', provider: 'stripe' })
		.onConflict(['user_id', 'key']).merge({ provider: 'stripe', expires_at: null });
}

/**
 * Serialises only purchaser-facing evidence; it never exposes account IDs or raw Stripe events.
 *
 * @param {object} purchase Durable purchase row.
 * @returns {object} Licence confirmation for its authorised viewer.
 */
export function serializeLicence(purchase) {
	return {
		reference: purchase.licence_reference,
		licence: purchase.licence_type,
		name: purchase.purchaser_name || '',
		email: purchase.purchaser_email,
		purchasedAt: purchase.completed_at,
		amount: purchase.amount_total,
		currency: purchase.currency,
		termsVersion: purchase.terms_version,
		receiptUrl: purchase.receipt_url || '',
		confirmation: licenceConfirmation(purchase),
	};
}

/**
 * Produces portable proof containing the purchase identity and a snapshot of its licence terms.
 * This is a purchase confirmation, not a tax invoice or runtime activation key.
 *
 * @param {object} purchase Paid purchase row.
 * @returns {string} Downloadable plain-text licence confirmation.
 */
export function licenceConfirmation(purchase) {
	if (purchase.confirmation_text) return purchase.confirmation_text;
	return [
		'DOM STUDIO — LICENCE CONFIRMATION',
		`Licence reference: ${purchase.licence_reference}`,
		`Licence: ${purchase.licence_type === 'team' ? 'Team' : 'Individual'}`,
		`Purchaser: ${purchase.purchaser_name || purchase.purchaser_email}`,
		`Email: ${purchase.purchaser_email}`,
		`Purchase date: ${new Date(purchase.completed_at).toISOString()}`,
		`Paid: ${(Number(purchase.amount_total) / 100).toFixed(2)} ${String(purchase.currency).toUpperCase()}`,
		`Stripe purchase: ${purchase.stripe_session_id}`,
		`Terms: DOM Studio Commercial License ${purchase.terms_version}`,
		'Perpetual use. All v1 updates included. Future major upgrades are optional.',
		'Keep this confirmation as proof of your licence. No activation key is required.',
		...(purchase.receipt_url ? [`Stripe receipt: ${purchase.receipt_url}`] : []),
		'', purchase.licence_terms,
	].join('\n');
}
