import { updateProductTourSettings } from '../../../../../lib/blockDemos/productTourBuilder.js';

/**
 * Saves tour-level goal, audience, trigger, and schedule settings.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated tour or API error.
 */
export async function patch(req, res) {
	const result = updateProductTourSettings(req.params.tourId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
