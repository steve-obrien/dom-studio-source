import { updateCustomerSuccessPlanTask } from '../../../../../../lib/blockDemos/customerHealthWorkspace.js';

/**
 * Completes one exact-version success-plan task.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = updateCustomerSuccessPlanTask(req.params.planId, req.params.taskId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
