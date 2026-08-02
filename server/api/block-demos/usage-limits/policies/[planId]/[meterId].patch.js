import { updateUsagePolicy } from '../../../../../lib/blockDemos/usageLimits.js';

/**
 * Saves one revisioned plan and meter policy.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function patch(req, res) {
	const result = updateUsagePolicy(req.params.planId, req.params.meterId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
