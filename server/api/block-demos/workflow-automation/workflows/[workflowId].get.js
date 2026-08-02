import { getWorkflowAutomationWorkflow } from '../../../../lib/blockDemos/workflowAutomation.js';

/**
 * Returns one complete workflow definition and execution evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Workflow detail or API error.
 */
export async function get(req, res) {
	const result = getWorkflowAutomationWorkflow(req.params.workflowId);
	if (result.error) res.status(result.status || 400);
	return result;
}
