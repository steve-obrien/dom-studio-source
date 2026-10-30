import { advanceBulkActionJob } from '../../../../../lib/blockDemos/bulkActionOperations.js';

/**
 * Advances a queued job through deterministic safe-update processing.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = advanceBulkActionJob(req.params.jobId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
