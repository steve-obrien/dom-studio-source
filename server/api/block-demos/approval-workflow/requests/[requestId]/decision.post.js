import { decideApprovalRequest } from '../../../../../lib/blockDemos/approvalWorkflow.js';

/**
 * Records one structured approval decision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = decideApprovalRequest(req.params.requestId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
