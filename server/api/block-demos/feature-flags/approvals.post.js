import { requestFeatureFlagApproval } from '../../../lib/blockDemos/featureFlagRelease.js';

/**
 * Requests independent production approval for a release preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Workspace with approval request or API error.
 */
export async function post(req, res) {
	const result = requestFeatureFlagApproval(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
