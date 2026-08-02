import { validateProductTour } from '../../../../../lib/blockDemos/productTourBuilder.js';

/**
 * Runs server-owned launch checks for a product-tour draft.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Validation results or API error.
 */
export async function post(req, res) {
	const result = validateProductTour(req.params.tourId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
