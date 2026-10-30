import { previewWorkflowAutomationRelease } from '../../../../../lib/blockDemos/workflowAutomation.js';

/**
 * Builds one immutable workflow release preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Release preview or API error.
 */
export async function post(req, res) {
	const result = previewWorkflowAutomationRelease(req.params.workflowId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
