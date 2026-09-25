import Stripe from 'stripe';
import { getAuthSession } from '../../lib/auth.js';
import { getOfferForLicence, normalizeLicence } from '../../lib/billingOffer.js';
import { getPaymentLinkId, validatePaymentLink } from '../../lib/billingCheckout.js';

/**
 * Sends an authenticated buyer to a verified USD payment link for their licence.
 *
 * @param {import('express').Request} req Incoming checkout request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object|undefined>} Safe error response, or a checkout redirect.
 */
export async function get(req, res) {
	const licence = normalizeLicence(req.query?.licence);
	const auth = await getAuthSession(req);
	if (!auth.isAuthenticated || !auth.user?.id) {
		const from = typeof req.query?.from === 'string' ? req.query.from : '/paywall';
		res.redirect(`/auth/sign-up?checkout=1&licence=${licence}&from=${encodeURIComponent(from)}`);
		return;
	}

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
		checkoutUrl.searchParams.set('client_reference_id', `${auth.user.id}_${licence}`);
		if (auth.user.email) checkoutUrl.searchParams.set('prefilled_email', auth.user.email);
		res.redirect(checkoutUrl.toString());
	} catch (error) {
		console.error('DOM Studio checkout unavailable', { licence, code: error.code || 'payment_link_mismatch' });
		res.status(503);
		return { error: 'Checkout is temporarily unavailable. Please try again shortly.' };
	}
}
