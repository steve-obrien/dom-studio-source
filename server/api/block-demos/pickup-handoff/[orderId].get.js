import { getPickupHandoffOrder } from '../../../lib/blockDemos/pickupHandoff.js';

/**
 * Returns one staff-visible pickup order resource.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Pickup payload or API error.
 */
export async function get(req, res) {
	const result = getPickupHandoffOrder(req.params.orderId);
	if (result.error) res.status(result.status || 400);
	return result;
}
