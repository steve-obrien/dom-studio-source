import { requestUsagePolicyApproval } from '../../../../lib/blockDemos/usageLimits.js';

/**
 * Requests finance approval for a guarded policy revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = requestUsagePolicyApproval(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
