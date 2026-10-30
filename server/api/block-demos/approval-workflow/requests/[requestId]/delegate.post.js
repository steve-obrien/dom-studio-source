import { delegateApprovalRequest } from '../../../../../lib/blockDemos/approvalWorkflow.js';

/**
 * Delegates the current approval step to an eligible reviewer.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = delegateApprovalRequest(req.params.requestId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
