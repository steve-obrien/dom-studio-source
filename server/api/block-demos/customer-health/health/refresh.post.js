import { refreshCustomerHealthScore } from '../../../../lib/blockDemos/customerHealthWorkspace.js';

/**
 * Recalculates health after verified recovery work.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = refreshCustomerHealthScore(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
