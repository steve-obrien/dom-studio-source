import { createProductTourPreview } from '../../../../../lib/blockDemos/productTourBuilder.js';

/**
 * Creates an expiring preview session for the current draft revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Preview session proof or API error.
 */
export async function post(req, res) {
	const result = createProductTourPreview(req.params.tourId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
