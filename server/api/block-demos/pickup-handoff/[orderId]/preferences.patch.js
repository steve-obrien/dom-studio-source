import { updatePickupPreferences } from '../../../../lib/blockDemos/pickupHandoff.js';

/**
 * Saves contactless-loading and substitution preferences.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated pickup payload or API error.
 */
export async function patch(req, res) {
	const result = updatePickupPreferences(req.params.orderId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
