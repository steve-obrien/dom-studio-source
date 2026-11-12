import Stripe from 'stripe';
import { getAuthSession } from '../../lib/auth.js';
import { getOfferForLicence, normalizeLicence } from '../../lib/billingOffer.js';
import { getPaymentLinkId, validatePaymentLink } from '../../lib/billingCheckout.js';
import { getBillingOrigin } from '../../lib/licenceEmail.js';
import { privateBillingResponse } from '../../lib/billingHttp.js';
import { recordAccessClick } from '../../lib/accessClicks.js';

/**
 * Sends a guest or signed-in buyer straight to a verified licence Payment Link.
 * Email delivery is handled after purchase and must not block the Stripe redirect.
 *
 * @param {import('express').Request} req Incoming checkout request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object|undefined>} Safe error response, or a checkout redirect.
 */
export async function get(req, res) {
	const licence = normalizeLicence(req.query?.licence);
	privateBillingResponse(res);
	// Analytics must not delay checkout, including during database failures.
	void recordAccessClick(req);
	const auth = await getAuthSession(req);

	const offer = getOfferForLicence(licence);
	const paymentLinkId = getPaymentLinkId(offer);
	const apiKey = process.env.STRIPE_SECRET_KEY;
	if (!paymentLinkId || !apiKey) {
		res.status(503);
		return { error: 'Checkout is temporarily unavailable. Please try again shortly.' };
	}

	try {
		const stripe = new Stripe(apiKey, { maxNetworkRetries: 1, timeout: 10000 });
		const link = await stripe.paymentLinks.retrieve(paymentLinkId, { expand: ['line_items'] });
		const checkoutUrl = validatePaymentLink(link, offer);
		const expectedReturn = `${getBillingOrigin()}/licence/thanks?session_id={CHECKOUT_SESSION_ID}`;
		if (link.after_completion?.type !== 'redirect' || link.after_completion.redirect?.url !== expectedReturn) {
			throw new Error('Payment Link confirmation redirect is not configured.');
		}
		checkoutUrl.searchParams.delete('client_reference_id');
		if (auth.user?.email) checkoutUrl.searchParams.set('prefilled_email', auth.user.email);
		res.redirect(checkoutUrl.toString());
	} catch (error) {
		console.error('DOM Studio checkout unavailable', { licence, code: error.code || 'payment_link_mismatch' });
		res.status(503);
		return { error: 'Checkout is temporarily unavailable. Please try again shortly.' };
	}
}
