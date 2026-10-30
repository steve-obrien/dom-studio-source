import { moveSprintIssue } from '../../../../../lib/blockDemos/sprintPlanning.js';

/**
 * Commits one acknowledged issue move from an exact preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace, issue, and move receipt.
 */
export async function post(req, res) {
	const result = moveSprintIssue(req.params.issueId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
