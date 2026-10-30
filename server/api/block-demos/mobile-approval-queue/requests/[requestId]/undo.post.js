import { undoMobileApprovalDecision } from '../../../../../lib/blockDemos/mobileApprovalQueue.js';

/**
 * Reverses one eligible mobile decision during its undo window.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = undoMobileApprovalDecision(req.params.requestId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
