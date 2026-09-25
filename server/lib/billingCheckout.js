import { getPriceForOffer } from '../../shared/billing.js';

/**
 * Selects an explicit USD payment link without falling back to legacy GBP links.
 *
 * @param {object} offer Current public licence offer.
 * @param {object} [env=process.env] Server configuration.
 * @returns {string} Stripe payment-link ID, or an empty string when unconfigured.
 */
export function getPaymentLinkId(offer, env = process.env) {
	const phase = offer.salePrice === null ? '' : '_INTRO';
	const key = `STRIPE_${offer.licence.toUpperCase()}_USD${phase}_PAYMENT_LINK_ID`;
	return String(env[key] || '').trim();
}

/**
 * Verifies that Stripe will sell the advertised one-time licence at its USD price.
 *
 * @param {object} link Stripe payment link with expanded line_items.
 * @param {object} offer Current public licence offer.
 * @returns {URL} Verified Stripe-hosted checkout URL.
 * @throws {Error} When the link is inactive, mismatched, or allows another offer.
 */
export function validatePaymentLink(link, offer) {
	const items = link.line_items?.data || [];
	const item = items[0];
	const price = item?.price;
	const amount = Math.round(getPriceForOffer(offer) * 100);
	const url = new URL(link.url);

	if (!link.active || link.line_items?.has_more || items.length !== 1
		|| item.quantity !== 1 || item.adjustable_quantity?.enabled || item.amount_discount > 0
		|| !price?.active || price.type !== 'one_time'
		|| price.currency !== 'usd' || price.unit_amount !== amount
		|| item.amount_subtotal !== amount || link.currency !== 'usd'
		|| link.metadata?.dom_studio_licence !== offer.licence
		|| link.allow_promotion_codes || link.optional_items?.length
		|| url.protocol !== 'https:' || url.hostname !== 'buy.stripe.com') {
		throw new Error('Stripe payment link does not match the advertised DOM Studio offer.');
	}

	return url;
}

/**
 * Resolves fulfilment identity, preferring Stripe-owned licence metadata.
 *
 * Legacy references remain supported so earlier GBP purchases retain access.
 *
 * @param {object} session Signed Stripe Checkout Session payload.
 * @returns {{ userId: string, licenceType: 'individual'|'team' }} Purchase identity.
 */
export function getCheckoutReference(session) {
	const reference = String(session.client_reference_id || '');
	const separator = reference.includes(':') ? reference.indexOf(':') : reference.lastIndexOf('_');
	const userId = separator > 0 ? reference.slice(0, separator) : reference;
	const legacyLicence = separator > 0 ? reference.slice(separator + 1) : 'individual';
	const licence = session.metadata?.dom_studio_licence || legacyLicence;

	return { userId, licenceType: licence === 'team' ? 'team' : 'individual' };
}
