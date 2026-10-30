import { previewPackageImpact } from '../../../lib/blockDemos/entitlementMatrix.js';

/**
 * Calculates affected customers and breaking package changes.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Impact evidence or API error.
 */
export async function post(req, res) {
	const result = previewPackageImpact(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
