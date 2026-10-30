import { queueBulkActionJob } from '../../../lib/blockDemos/bulkActionOperations.js';

/**
 * Queues one approved immutable preview as a background job.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace with queued job or API error.
 */
export async function post(req, res) {
	const result = queueBulkActionJob(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
