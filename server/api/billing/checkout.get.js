import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { getAuthSession } from '../../lib/auth.js';
import { getOfferForLicence, normalizeLicence } from '../../lib/billingOffer.js';

const paymentLinkKeys = [
	'STRIPE_PAYMENT_LINK',
	'VITE_STRIPE_PAYMENT_LINK',
];

const licencePaymentLinkKeys = {
	individual: [
		'STRIPE_INDIVIDUAL_PAYMENT_LINK',
		'STRIPE_PAYMENT_LINK',
		'VITE_STRIPE_PAYMENT_LINK',
	],
	team: [
		'STRIPE_TEAM_PAYMENT_LINK',
		'STRIPE_PAYMENT_LINK',
		'VITE_STRIPE_PAYMENT_LINK',
	],
};

export async function get(req, res) {
	const licence = normalizeLicence(req.query?.licence);
	const paymentLink = getPaymentLink(licence);

	if (!paymentLink) {
		res.status(503);
		return {
			error: 'Stripe payment link is not configured yet.',
		};
	}

	const auth = await getAuthSession(req);
	if (!auth.isAuthenticated || !auth.user?.id) {
		const from = typeof req.query?.from === 'string' ? req.query.from : '/paywall';
		res.redirect(`/auth/sign-up?checkout=1&licence=${licence}&from=${encodeURIComponent(from)}`);
		return;
	}

	const checkoutUrl = new URL(paymentLink);
	const offer = getOfferForLicence(licence);
	checkoutUrl.searchParams.set('client_reference_id', `${auth.user.id}:${licence}`);
	if (auth.user.email) checkoutUrl.searchParams.set('prefilled_email', auth.user.email);
	if (offer.promotionCode) checkoutUrl.searchParams.set('prefilled_promo_code', offer.promotionCode);

	res.redirect(checkoutUrl.toString());
}

function getPaymentLink(licence = 'individual') {
	const keys = licencePaymentLinkKeys[licence] || paymentLinkKeys;

	for (const key of keys) {
		if (process.env[key]) return process.env[key];
	}

	const parsed = readDotEnv();
	for (const key of keys) {
		if (parsed[key]) return parsed[key];
	}

	return '';
}

function readDotEnv() {
	const envPath = path.join(process.cwd(), '.env');
	if (!fs.existsSync(envPath)) return {};
	return dotenv.parse(fs.readFileSync(envPath));
}
