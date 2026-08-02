import { saveWorkflowAutomationDraft } from '../../../../../lib/blockDemos/workflowAutomation.js';

/**
 * Saves one acknowledged exact workflow draft.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workflow and draft receipt.
 */
export async function post(req, res) {
	const result = saveWorkflowAutomationDraft(req.params.workflowId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
