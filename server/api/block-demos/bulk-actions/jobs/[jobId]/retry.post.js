import { retryBulkActionResult } from '../../../../../lib/blockDemos/bulkActionOperations.js';

/**
 * Retries one safe-update conflict using the current source version.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = retryBulkActionResult(req.params.jobId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
