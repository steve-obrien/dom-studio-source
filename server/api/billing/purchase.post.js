import Stripe from 'stripe';
import { getDb } from '../../lib/db.js';
import { fulfillLicence, serializeLicence, isCompletedLicence } from '../../lib/licences.js';
import { allowBillingMutation } from '../../lib/billingHttp.js';

/**
 * Reconciles a Stripe return using its unguessable Checkout Session as purchase-view proof.
 * This capability exposes this purchase only and never creates or signs into an account.
 * Webhooks remain the durable fulfilment path when the buyer never returns to the website.
 *
 * @param {import('express').Request} req Incoming JSON request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Paid confirmation, pending state, or a safe error.
 */
export async function post(req, res) {
	if (!allowBillingMutation(req, res)) return { error: 'Please open your purchase confirmation on DOM Studio.' };
	const sessionId = req.body?.sessionId;
	if (typeof sessionId !== 'string' || !/^cs_(test_|live_)?[A-Za-z0-9]{20,240}$/.test(sessionId)) {
		res.status(400);
		return { error: 'This purchase link is not valid. Use your purchase email to recover your licence.' };
	}
	try {
		let purchase = await getDb()('stripe_checkout_sessions').where({ stripe_session_id: sessionId }).first();
		if (purchase?.payment_status === 'failed') return { status: 'failed' };
		if (!isCompletedLicence(purchase) || !purchase.licence_reference || (Number(purchase.amount_total) > 0 && !purchase.receipt_url)) {
			const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 1, timeout: 10000 });
			const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent.latest_charge'] });
			try {
				purchase = await fulfillLicence(session, 'return-reconciliation');
			} catch {
				// A persisted purchase remains downloadable while Stripe retries failed email delivery.
				purchase = await getDb()('stripe_checkout_sessions').where({ stripe_session_id: sessionId }).first();
			}
		}
		if (!purchase) {
			res.status(404);
			return { error: 'We could not find this DOM Studio purchase. Check your receipt or recover access using your purchase email.' };
		}
		return isCompletedLicence(purchase) ? { status: 'paid', licence: serializeLicence(purchase) }
			: { status: purchase.payment_status === 'failed' ? 'failed' : 'pending' };
	} catch {
		res.status(503);
		return { error: 'We could not load your purchase yet. Please try again shortly.' };
	}
}
