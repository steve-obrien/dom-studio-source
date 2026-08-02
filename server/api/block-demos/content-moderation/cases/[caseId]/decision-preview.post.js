import { previewModerationDecision } from '../../../../../lib/blockDemos/contentModeration.js';

/**
 * Creates an immutable preview for one moderation decision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated moderation workspace with preview or API error.
 */
export async function post(req, res) {
	const result = previewModerationDecision(req.params.caseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
