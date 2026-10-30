/**
 * Builds the public USD offer used by the website and checkout validation.
 *
 * @param {'introductory'|'regular'} [phase='introductory'] Active pricing phase.
 * @returns {{ individual: object, team: object, source: object }} Licence offers.
 */
export function createBillingOffer(phase = 'introductory') {
	const introductory = phase !== 'regular';
	const individual = createLicenceOffer('individual', 149, introductory ? 99 : null);
	const team = createLicenceOffer('team', 499, introductory ? 299 : null);

	return { individual, team, source: individual };
}

/**
 * Creates one public licence offer without exposing Stripe configuration.
 *
 * @param {'individual'|'team'} licence Licence type.
 * @param {number} originalPrice Regular price in US dollars.
 * @param {number|null} salePrice Introductory price, or null for regular pricing.
 * @returns {object} Serializable offer for SSR and client rendering.
 */
function createLicenceOffer(licence, originalPrice, salePrice) {
	return {
		licence,
		originalPrice,
		salePrice,
		currency: 'USD',
		offerLabel: salePrice === null ? '' : 'Introductory price',
	};
}

/**
 * Resolves the amount payable for an offer in major currency units.
 *
 * @param {{ salePrice: number|null, originalPrice: number }} offer Public offer.
 * @returns {number} Current one-time price.
 */
export function getPriceForOffer(offer) {
	return offer.salePrice ?? offer.originalPrice;
}

/**
 * Formats USD amounts consistently while leaving the currency label explicit.
 *
 * @param {number} amount Price in US dollars.
 * @returns {string} Dollar amount without unnecessary decimal places.
 */
export function formatBillingPrice(amount) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(amount);
}
