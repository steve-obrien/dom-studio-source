import assert from 'node:assert/strict';
import test from 'node:test';
import Stripe from 'stripe';
import { get as checkout } from '../api/billing/checkout.get.js';
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

test('checkout allows customer-entered promotion codes without changing the advertised base price', () => {
	const offer = createBillingOffer().individual;
	assert.equal(validatePaymentLink({ ...paymentLink(offer), allow_promotion_codes: true }, offer).hostname, 'buy.stripe.com');
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

test('guest checkout goes directly to Stripe and requires the correct confirmation destination', async (t) => {
	const keys = ['STRIPE_SECRET_KEY', 'RESEND_API_KEY', 'LICENCE_EMAIL_FROM', 'STRIPE_INDIVIDUAL_USD_INTRO_PAYMENT_LINK_ID', 'BILLING_PUBLIC_URL', 'BILLING_PRICING_PHASE'];
	const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
	t.after(() => {
		for (const key of keys) {
			if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
		}
	});
	Object.assign(process.env, {
		STRIPE_SECRET_KEY: 'sk_test_placeholder', RESEND_API_KEY: 're_test_placeholder', LICENCE_EMAIL_FROM: 'licences@example.com',
		STRIPE_INDIVIDUAL_USD_INTRO_PAYMENT_LINK_ID: 'plink_individual', BILLING_PUBLIC_URL: 'https://getdom.studio', BILLING_PRICING_PHASE: 'introductory',
	});
	let link = paymentLink(createBillingOffer().individual);
	link.after_completion = { type: 'redirect', redirect: { url: 'https://getdom.studio/licence/thanks?session_id={CHECKOUT_SESSION_ID}' } };
	t.mock.method(Stripe.resources.PaymentLinks.prototype, 'retrieve', async (id) => {
		assert.equal(id, 'plink_individual');
		return link;
	});
	t.mock.method(console, 'error', () => {});
	const req = { headers: {}, query: { licence: 'individual' } };
	const res = { setHeader() {}, status(code) { this.code = code; }, redirect(url) { this.url = url; } };
	await checkout(req, res);
	assert.equal(new URL(res.url).hostname, 'buy.stripe.com');
	assert.equal(new URL(res.url).searchParams.has('client_reference_id'), false);
	delete res.url;
	link.after_completion.redirect.url = 'https://getdom.studio/auth/sign-up';
	assert.match((await checkout(req, res)).error, /temporarily unavailable/);
	assert.equal(res.code, 503);
	assert.equal(res.url, undefined);
});

test('both licence checkout redirects work without email configuration in either pricing phase', async (t) => {
	const keys = [
		'STRIPE_SECRET_KEY', 'RESEND_API_KEY', 'LICENCE_EMAIL_FROM', 'BILLING_PUBLIC_URL', 'BILLING_PRICING_PHASE',
		'STRIPE_INDIVIDUAL_USD_INTRO_PAYMENT_LINK_ID', 'STRIPE_TEAM_USD_INTRO_PAYMENT_LINK_ID',
		'STRIPE_INDIVIDUAL_USD_PAYMENT_LINK_ID', 'STRIPE_TEAM_USD_PAYMENT_LINK_ID',
	];
	const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
	t.after(() => {
		for (const key of keys) {
			if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
		}
	});
	Object.assign(process.env, {
		STRIPE_SECRET_KEY: 'sk_test_placeholder', BILLING_PUBLIC_URL: 'https://getdom.studio',
		STRIPE_INDIVIDUAL_USD_INTRO_PAYMENT_LINK_ID: 'plink_individual_intro', STRIPE_TEAM_USD_INTRO_PAYMENT_LINK_ID: 'plink_team_intro',
		STRIPE_INDIVIDUAL_USD_PAYMENT_LINK_ID: 'plink_individual_regular', STRIPE_TEAM_USD_PAYMENT_LINK_ID: 'plink_team_regular',
	});
	delete process.env.RESEND_API_KEY;
	delete process.env.LICENCE_EMAIL_FROM;
	let expectedId;
	let link;
	let requests = 0;
	t.mock.method(Stripe.resources.PaymentLinks.prototype, 'retrieve', async (id) => {
		requests += 1;
		assert.equal(id, expectedId);
		return link;
	});
	for (const phase of ['introductory', 'regular']) {
		process.env.BILLING_PRICING_PHASE = phase;
		for (const licence of ['individual', 'team']) {
			const offer = createBillingOffer(phase)[licence];
			expectedId = `plink_${licence}_${phase === 'regular' ? 'regular' : 'intro'}`;
			link = paymentLink(offer);
			link.url = `https://buy.stripe.com/${licence}_${phase}`;
			link.after_completion = { type: 'redirect', redirect: { url: 'https://getdom.studio/licence/thanks?session_id={CHECKOUT_SESSION_ID}' } };
			const res = {
				/** Records response headers for checkout privacy assertions. */
				setHeader(name, value) { this[name] = value; },
				/** Records an HTTP error status without issuing a real response. */
				status(code) { this.code = code; },
				/** Captures the verified Stripe destination without creating a payment. */
				redirect(url) { this.url = url; },
			};
			await checkout({ headers: {}, query: { licence } }, res);
			assert.equal(res.url, link.url);
			assert.equal(res.code, undefined);
			assert.equal(res['Cache-Control'], 'no-store');
			delete res.url;
			process.env.STRIPE_SECRET_KEY = '';
			assert.match((await checkout({ headers: {}, query: { licence } }, res)).error, /temporarily unavailable/);
			assert.equal(res.code, 503);
			assert.equal(res.url, undefined);
			process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
		}
	}
	assert.equal(requests, 4);
});
