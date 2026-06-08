import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { getAuthSession } from '../../lib/auth.js';

const paymentLinkKeys = [
	'STRIPE_PAYMENT_LINK',
	'VITE_STRIPE_PAYMENT_LINK',
];

export async function get(req, res) {
	const paymentLink = getPaymentLink();

	if (!paymentLink) {
		res.status(503);
		return {
			error: 'STRIPE_PAYMENT_LINK is not configured yet.',
		};
	}

	const auth = await getAuthSession(req);
	if (!auth.isAuthenticated || !auth.user?.id) {
		const from = typeof req.query?.from === 'string' ? req.query.from : '/paywall';
		res.redirect(`/auth/sign-up?checkout=1&from=${encodeURIComponent(from)}`);
		return;
	}

	const checkoutUrl = new URL(paymentLink);
	checkoutUrl.searchParams.set('client_reference_id', auth.user.id);
	if (auth.user.email) checkoutUrl.searchParams.set('prefilled_email', auth.user.email);

	res.redirect(checkoutUrl.toString());
}

function getPaymentLink() {
	for (const key of paymentLinkKeys) {
		if (process.env[key]) return process.env[key];
	}

	const parsed = readDotEnv();
	for (const key of paymentLinkKeys) {
		if (parsed[key]) return parsed[key];
	}

	return '';
}

function readDotEnv() {
	const envPath = path.join(process.cwd(), '.env');
	if (!fs.existsSync(envPath)) return {};
	return dotenv.parse(fs.readFileSync(envPath));
}
