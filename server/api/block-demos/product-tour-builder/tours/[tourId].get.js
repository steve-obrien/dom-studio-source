import { getProductTour } from '../../../../lib/blockDemos/productTourBuilder.js';

/**
 * Returns one current product-tour draft.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Product tour or API error.
 */
export async function get(req, res) {
	const result = getProductTour(req.params.tourId);
	if (result.error) res.status(result.status || 400);
	return result;
}
