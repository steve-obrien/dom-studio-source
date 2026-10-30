import Stripe from 'stripe';
import { fulfillLicence } from '../../lib/licences.js';

export const config = {
	body: 'raw',
};

/**
 * Verifies Stripe events and fulfils completed or subsequently settled purchases.
 *
 * @param {import('express').Request} req Raw webhook request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Webhook acknowledgement or safe verification error.
 */
export async function post(req, res) {
	const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
	const apiKey = process.env.STRIPE_SECRET_KEY || '';

	if (!secret || !apiKey) {
		res.status(503);
		return { error: 'Stripe webhook is not configured.' };
	}

	const stripe = new Stripe(apiKey);
	let event;

	try {
		event = stripe.webhooks.constructEvent(
			req.body,
			req.headers['stripe-signature'],
			secret,
		);
	} catch (error) {
		res.status(400);
		return { error: `Webhook signature failed: ${error.message}` };
	}

	if (['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed'].includes(event.type)) {
		try {
			const session = event.type === 'checkout.session.async_payment_failed'
				? { ...event.data.object, payment_status: 'failed' } : event.data.object;
			await fulfillLicence(session, event.id, { occurredAt: event.created });
		} catch {
			console.error('DOM Studio licence fulfilment needs a retry', { eventId: event.id });
			res.status(500);
			return { error: 'Licence fulfilment is temporarily unavailable.' };
		}
	}

	return { received: true };
}
