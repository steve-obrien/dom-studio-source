import { publishProductTour } from '../../../../../lib/blockDemos/productTourBuilder.js';

/**
 * Schedules a validated product tour and returns publication proof.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Publication receipt or API error.
 */
export async function post(req, res) {
	const result = publishProductTour(req.params.tourId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
