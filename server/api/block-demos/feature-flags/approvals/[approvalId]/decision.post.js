import { decideFeatureFlagApproval } from '../../../../../lib/blockDemos/featureFlagRelease.js';

/**
 * Records the independent release manager's approval decision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = decideFeatureFlagApproval(req.params.approvalId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
