import { updatePickupArrival } from '../../../../lib/blockDemos/pickupHandoff.js';

/**
 * Validates and saves the customer's pickup arrival details.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated pickup payload or API error.
 */
export async function patch(req, res) {
	const result = updatePickupArrival(req.params.orderId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
