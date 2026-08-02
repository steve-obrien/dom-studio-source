import { getDeliveryTrackerOrder } from '../../../lib/blockDemos/deliveryTracker.js';

/**
 * Returns one customer-visible delivery resource.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Delivery payload or API error.
 */
export async function get(req, res) {
	const result = getDeliveryTrackerOrder(req.params.orderId);
	if (result.error) res.status(result.status || 400);
	return result;
}
