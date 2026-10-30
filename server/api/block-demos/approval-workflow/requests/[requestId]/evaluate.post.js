import { evaluateApprovalRequest } from '../../../../../lib/blockDemos/approvalWorkflow.js';

/**
 * Evaluates the current request against its authoritative approval policy.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = evaluateApprovalRequest(req.params.requestId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
