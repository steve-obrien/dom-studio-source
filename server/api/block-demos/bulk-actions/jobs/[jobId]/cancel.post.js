import { cancelBulkActionJob } from '../../../../../lib/blockDemos/bulkActionOperations.js';

/**
 * Cancels a queued job before it processes any account.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = cancelBulkActionJob(req.params.jobId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
