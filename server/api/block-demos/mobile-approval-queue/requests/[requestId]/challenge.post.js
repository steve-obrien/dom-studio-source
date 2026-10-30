import { createMobileApprovalChallenge } from '../../../../../lib/blockDemos/mobileApprovalQueue.js';

/**
 * Creates a trusted-device challenge for a high-risk mobile decision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Workspace and challenge details or API error.
 */
export async function post(req, res) {
	const result = createMobileApprovalChallenge(req.params.requestId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
