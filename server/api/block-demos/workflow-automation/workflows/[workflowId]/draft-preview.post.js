import { previewWorkflowAutomationDraft } from '../../../../../lib/blockDemos/workflowAutomation.js';

/**
 * Validates and locks one exact workflow draft before persistence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Immutable draft preview or API error.
 */
export async function post(req, res) {
	const result = previewWorkflowAutomationDraft(req.params.workflowId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
