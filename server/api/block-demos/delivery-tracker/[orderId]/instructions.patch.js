import { updateDeliveryInstructions } from '../../../../lib/blockDemos/deliveryTracker.js';

/**
 * Validates and saves customer delivery instructions.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated delivery payload or API error.
 */
export async function patch(req, res) {
	const result = updateDeliveryInstructions(req.params.orderId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
