import { getAuthSession } from '../../lib/auth.js';
import { getDb } from '../../lib/db.js';
import { serializeLicence, completedPaymentStatuses } from '../../lib/licences.js';
import { privateBillingResponse } from '../../lib/billingHttp.js';

/**
 * Returns licence evidence linked to the signed-in account, never by a supplied email.
 *
 * @param {import('express').Request} req Incoming request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Owned licence confirmations.
 */
export async function get(req, res) {
	privateBillingResponse(res);
	const auth = await getAuthSession(req);
	if (!auth.isAuthenticated) {
		res.status(401);
		return { error: 'Sign in to view your licences.' };
	}
	const rows = await getDb()('stripe_checkout_sessions').where({ user_id: auth.user.id })
		.whereIn('payment_status', completedPaymentStatuses).whereNotNull('completed_at')
		.whereNotNull('licence_reference').orderBy('completed_at', 'desc');
	return { licences: rows.map(serializeLicence) };
}
