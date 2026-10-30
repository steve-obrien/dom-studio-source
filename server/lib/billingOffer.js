import { createBillingOffer } from '../../shared/billing.js';

export { getPriceForOffer } from '../../shared/billing.js';

/**
 * Resolves current USD prices independently of legacy GBP promotion values.
 *
 * @returns {{ individual: object, team: object, source: object }} Public offers.
 */
export function getBillingOffer() {
	return createBillingOffer(process.env.BILLING_PRICING_PHASE);
}

/**
 * Normalizes the licence selector accepted by the checkout route.
 *
 * @param {unknown} value Requested licence type.
 * @returns {'individual'|'team'} Supported licence type.
 */
export function normalizeLicence(value) {
	return value === 'team' ? 'team' : 'individual';
}

/**
 * Returns the public offer for the requested licence.
 *
 * @param {unknown} licence Requested licence type.
 * @returns {object} Current USD offer.
 */
export function getOfferForLicence(licence) {
	return getBillingOffer()[normalizeLicence(licence)];
}
