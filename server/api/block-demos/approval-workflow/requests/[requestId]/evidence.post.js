import { verifyApprovalEvidence } from '../../../../../lib/blockDemos/approvalWorkflow.js';

/**
 * Verifies one missing evidence item for a blocked approval request.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = verifyApprovalEvidence(req.params.requestId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
