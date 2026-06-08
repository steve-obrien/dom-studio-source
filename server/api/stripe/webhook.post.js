import Stripe from 'stripe';
import { getDb } from '../../lib/db.js';
import { markUserPaid, normalizeLicenceType } from '../../lib/users.js';

export const config = {
	body: 'raw',
};

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

	if (event.type === 'checkout.session.completed') {
		await fulfillCheckoutSession(event.data.object, event.id);
	}

	return { received: true };
}

async function fulfillCheckoutSession(session, eventId) {
	const reference = parseClientReference(session.client_reference_id);
	const userId = reference.userId;
	if (!userId) return;

	await getDb()('stripe_checkout_sessions')
		.insert({
			user_id: userId,
			stripe_session_id: session.id,
			stripe_customer_id: stringifyStripeId(session.customer),
			client_reference_id: session.client_reference_id || userId,
			licence_type: reference.licenceType,
			payment_status: session.payment_status || '',
			mode: session.mode || '',
			amount_total: session.amount_total || null,
			currency: session.currency || '',
			raw_event_id: eventId,
			completed_at: getDb().fn.now(),
		})
		.onConflict('stripe_session_id')
		.merge({
			user_id: userId,
			stripe_customer_id: stringifyStripeId(session.customer),
			licence_type: reference.licenceType,
			payment_status: session.payment_status || '',
			raw_event_id: eventId,
			completed_at: getDb().fn.now(),
			updated_at: getDb().fn.now(),
	});

	if (session.payment_status === 'paid') {
		await markUserPaid(userId, reference.licenceType);
	}
}

function parseClientReference(value) {
	const [userId = '', licenceType = 'individual'] = String(value || '').split(':');

	return {
		userId,
		licenceType: normalizeLicenceType(licenceType),
	};
}

function stringifyStripeId(value) {
	if (!value) return '';
	if (typeof value === 'string') return value;
	return value.id || '';
}
