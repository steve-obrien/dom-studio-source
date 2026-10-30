import { syncDeliveryTrackerOrder } from '../../../../lib/blockDemos/deliveryTracker.js';

/**
 * Pulls the next deterministic carrier event into the demo tracker.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Refreshed delivery or server-owned conflict.
 */
export async function post(req, res) {
	const result = syncDeliveryTrackerOrder(req.params.orderId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
