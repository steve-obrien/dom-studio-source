import assert from 'node:assert/strict';
import test from 'node:test';
import { createBillingOffer, getPriceForOffer } from '../../shared/billing.js';
import { getBillingOffer } from './billingOffer.js';
import { getCheckoutReference, getPaymentLinkId, validatePaymentLink } from './billingCheckout.js';

/**
 * Creates a Stripe-shaped response for a one-time licence checkout.
 *
 * @param {object} offer Advertised licence offer.
 * @returns {object} Expanded Stripe payment-link fixture.
 */
function paymentLink(offer) {
	const amount = getPriceForOffer(offer) * 100;
	return {
		active: true,
		url: 'https://buy.stripe.com/example',
		currency: 'usd',
		metadata: { dom_studio_licence: offer.licence },
		allow_promotion_codes: false,
		line_items: {
			has_more: false,
			data: [{
				quantity: 1,
				amount_subtotal: amount,
				price: { active: true, type: 'one_time', currency: 'usd', unit_amount: amount },
			}],
		},
	};
}

test('introductory and regular phases select matching prices and separate USD links', () => {
	const env = {
		STRIPE_PAYMENT_LINK: 'https://buy.stripe.com/legacy-gbp',
		STRIPE_INDIVIDUAL_USD_INTRO_PAYMENT_LINK_ID: 'plink_individual_intro',
		STRIPE_TEAM_USD_INTRO_PAYMENT_LINK_ID: 'plink_team_intro',
		STRIPE_INDIVIDUAL_USD_PAYMENT_LINK_ID: 'plink_individual_regular',
		STRIPE_TEAM_USD_PAYMENT_LINK_ID: 'plink_team_regular',
	};
	for (const [phase, expected] of [['introductory', [99, 299]], ['regular', [149, 499]]]) {
		const offers = createBillingOffer(phase);
		assert.deepEqual([getPriceForOffer(offers.individual), getPriceForOffer(offers.team)], expected);
		for (const licence of ['individual', 'team']) {
			const offer = offers[licence];
			assert.equal(getPaymentLinkId(offer, env), `plink_${licence}_${phase === 'regular' ? 'regular' : 'intro'}`);
			assert.equal(validatePaymentLink(paymentLink(offer), offer).hostname, 'buy.stripe.com');
		}
	}
});

test('legacy GBP and £1 environment settings cannot override USD offers or checkout', (t) => {
	const previous = { ...process.env };
	t.after(() => {
		for (const key of ['BILLING_PRICING_PHASE', 'BILLING_SOURCE_SALE_PRICE', 'STRIPE_PROMOTION_CODE']) {
			if (previous[key] === undefined) delete process.env[key];
			else process.env[key] = previous[key];
		}
	});
	process.env.BILLING_PRICING_PHASE = 'introductory';
	process.env.BILLING_SOURCE_SALE_PRICE = '1';
	process.env.STRIPE_PROMOTION_CODE = 'legacy-pound-offer';
	const offer = getBillingOffer().individual;
	assert.equal(offer.currency, 'USD');
	assert.equal(getPriceForOffer(offer), 99);
	assert.equal(getPaymentLinkId(offer, { STRIPE_PAYMENT_LINK: 'https://buy.stripe.com/legacy-gbp' }), '');
});

test('checkout rejects wrong amounts, GBP, recurring prices, and a different licence', () => {
	const offer = createBillingOffer().individual;
	for (const changes of [
		{ currency: 'gbp' },
		{ unit_amount: 100 },
		{ type: 'recurring' },
		{ active: false },
	]) {
		const link = paymentLink(offer);
		Object.assign(link.line_items.data[0].price, changes);
		assert.throws(() => validatePaymentLink(link, offer));
	}
	assert.throws(() => validatePaymentLink(paymentLink(createBillingOffer().team), offer));
	const wrongMetadata = paymentLink(offer);
	wrongMetadata.metadata.dom_studio_licence = 'team';
	assert.throws(() => validatePaymentLink(wrongMetadata, offer));
});

test('checkout rejects inactive links, discounts, extras, quantity changes, and unsafe URLs', () => {
	const offer = createBillingOffer().individual;
	for (const changes of [
		{ active: false },
		{ allow_promotion_codes: true },
		{ optional_items: [{ price: 'price_extra' }] },
		{ url: 'https://example.com/checkout' },
	]) {
		assert.throws(() => validatePaymentLink({ ...paymentLink(offer), ...changes }, offer));
	}
	const multiple = paymentLink(offer);
	multiple.line_items.data[0].quantity = 2;
	assert.throws(() => validatePaymentLink(multiple, offer));
	const adjustable = paymentLink(offer);
	adjustable.line_items.data[0].adjustable_quantity = { enabled: true };
	assert.throws(() => validatePaymentLink(adjustable, offer));
	const discounted = paymentLink(offer);
	discounted.line_items.data[0].amount_discount = 50;
	assert.throws(() => validatePaymentLink(discounted, offer));
	const extra = paymentLink(offer);
	extra.line_items.data.push(extra.line_items.data[0]);
	assert.throws(() => validatePaymentLink(extra, offer));
});

test('Stripe-owned licence metadata wins over a modified client reference', () => {
	assert.deepEqual(getCheckoutReference({
		client_reference_id: 'user-123_team',
		metadata: { dom_studio_licence: 'individual' },
	}), { userId: 'user-123', licenceType: 'individual' });
});

test('existing paid purchases retain legacy reference compatibility', () => {
	for (const reference of ['user-123', 'user-123_individual', 'user-123:individual']) {
		assert.deepEqual(getCheckoutReference({ client_reference_id: reference }), { userId: 'user-123', licenceType: 'individual' });
	}
	assert.deepEqual(getCheckoutReference({ client_reference_id: 'user-123_team' }), { userId: 'user-123', licenceType: 'team' });
});
