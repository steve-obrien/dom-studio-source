import { requestBulkActionApproval } from '../../../../lib/blockDemos/bulkActionOperations.js';

/**
 * Routes a sensitive impact preview to its accountable reviewer.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace with pending approval or API error.
 */
export async function post(req, res) {
	const result = requestBulkActionApproval(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
