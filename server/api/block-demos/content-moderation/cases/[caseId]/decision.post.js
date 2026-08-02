import { commitModerationDecision } from '../../../../../lib/blockDemos/contentModeration.js';

/**
 * Applies one exact moderation preview and returns immutable receipts.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated moderation workspace with receipts or API error.
 */
export async function post(req, res) {
	const result = commitModerationDecision(req.params.caseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
