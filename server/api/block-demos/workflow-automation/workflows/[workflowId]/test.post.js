import { testWorkflowAutomation } from '../../../../../lib/blockDemos/workflowAutomation.js';

/**
 * Runs a side-effect-free sample event through the current workflow version.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Test trace and workflow evidence.
 */
export async function post(req, res) {
	const result = testWorkflowAutomation(req.params.workflowId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
