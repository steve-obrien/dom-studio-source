const defaultIndividualPrice = 149;
const defaultTeamPrice = 499;

export function getBillingOffer() {
	const individualOriginalPrice = getNumberEnv('BILLING_INDIVIDUAL_PRICE', getNumberEnv('BILLING_SOURCE_PRICE', defaultIndividualPrice));
	const individualSalePrice = getNumberEnv('BILLING_INDIVIDUAL_SALE_PRICE', getNumberEnv('BILLING_SOURCE_SALE_PRICE', null));
	const individualPromotionCode = String(process.env.STRIPE_INDIVIDUAL_PROMOTION_CODE || process.env.STRIPE_PROMOTION_CODE || '').trim();
	const hasIndividualPromotion = Boolean(
		individualPromotionCode
		&& individualSalePrice
		&& individualSalePrice > 0
		&& individualSalePrice < individualOriginalPrice,
	);

	const teamOriginalPrice = getNumberEnv('BILLING_TEAM_PRICE', defaultTeamPrice);
	const teamSalePrice = getNumberEnv('BILLING_TEAM_SALE_PRICE', null);
	const teamPromotionCode = String(process.env.STRIPE_TEAM_PROMOTION_CODE || '').trim();
	const hasTeamPromotion = Boolean(
		teamPromotionCode
		&& teamSalePrice
		&& teamSalePrice > 0
		&& teamSalePrice < teamOriginalPrice,
	);

	const individual = {
		originalPrice: individualOriginalPrice,
		salePrice: hasIndividualPromotion ? individualSalePrice : null,
		currency: 'GBP',
		promotionCode: hasIndividualPromotion ? individualPromotionCode : '',
		offerLabel: hasIndividualPromotion ? String(process.env.BILLING_INDIVIDUAL_OFFER_LABEL || process.env.BILLING_SOURCE_OFFER_LABEL || 'Limited offer').trim() : '',
	};

	const team = {
		originalPrice: teamOriginalPrice,
		salePrice: hasTeamPromotion ? teamSalePrice : null,
		currency: 'GBP',
		promotionCode: hasTeamPromotion ? teamPromotionCode : '',
		offerLabel: hasTeamPromotion ? String(process.env.BILLING_TEAM_OFFER_LABEL || 'Limited offer').trim() : '',
	};

	return {
		individual,
		team,
		// Source is kept as a compatibility alias while the UI moves to licence language.
		source: individual,
	};
}

export function normalizeLicence(value) {
	return value === 'team' ? 'team' : 'individual';
}

export function getOfferForLicence(licence) {
	return getBillingOffer()[normalizeLicence(licence)];
}

export function getPriceForOffer(offer) {
	return offer.salePrice || offer.originalPrice;
}

function getNumberEnv(key, fallback) {
	const value = process.env[key];
	if (value === undefined || value === '') return fallback;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}
