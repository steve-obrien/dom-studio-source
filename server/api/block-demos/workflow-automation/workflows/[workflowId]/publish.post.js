import { publishWorkflowAutomation } from '../../../../../lib/blockDemos/workflowAutomation.js';

/**
 * Publishes one acknowledged workflow release from exact evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Published workflow and immutable receipt.
 */
export async function post(req, res) {
	const result = publishWorkflowAutomation(req.params.workflowId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
