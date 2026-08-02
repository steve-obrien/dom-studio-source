import { previewUsagePolicyImpact } from '../../../lib/blockDemos/usageLimits.js';

/**
 * Calculates forecast, customer, billing, and interruption impact.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = previewUsagePolicyImpact(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
