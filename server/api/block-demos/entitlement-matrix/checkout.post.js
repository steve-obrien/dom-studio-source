import { createCheckoutPreview } from '../../../lib/blockDemos/entitlementMatrix.js';

/**
 * Creates a billing-provider checkout preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Checkout evidence or API error.
 */
export async function post(req, res) {
	const result = createCheckoutPreview(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
