import { decideBulkActionApproval } from '../../../../../lib/blockDemos/bulkActionOperations.js';

/**
 * Simulates the accountable reviewer deciding a batch preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = decideBulkActionApproval(req.params.approvalId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
