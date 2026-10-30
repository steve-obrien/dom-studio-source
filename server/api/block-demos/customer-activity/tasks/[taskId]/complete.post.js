import { completeCustomerActivityTask } from '../../../../../lib/blockDemos/customerActivityWorkspace.js';

/**
 * Completes one exact follow-up task with evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = completeCustomerActivityTask(req.params.taskId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
