import { previewSprintIssueMove } from '../../../../../lib/blockDemos/sprintPlanning.js';

/**
 * Validates and locks an exact issue move before scope mutation.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Exact move preview or API error.
 */
export async function post(req, res) {
	const result = previewSprintIssueMove(req.params.issueId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
