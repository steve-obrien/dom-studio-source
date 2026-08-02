import { verifyMobileApprovalChallenge } from '../../../../../lib/blockDemos/mobileApprovalQueue.js';

/**
 * Verifies a device challenge and issues a single-use approval token.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Workspace and verified challenge or API error.
 */
export async function post(req, res) {
	const result = verifyMobileApprovalChallenge(req.params.requestId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
