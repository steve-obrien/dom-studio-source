import { updatePickupItemStage } from '../../../../../../lib/blockDemos/pickupHandoff.js';

/**
 * Marks one pickup item staged or returned to preparation.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated pickup payload or API error.
 */
export async function post(req, res) {
	const result = updatePickupItemStage(req.params.orderId, req.params.itemId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
