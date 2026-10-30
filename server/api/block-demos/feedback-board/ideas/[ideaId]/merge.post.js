import { commitFeedbackMerge } from '../../../../../lib/blockDemos/feedbackBoard.js';

/**
 * Commits one acknowledged and exact feedback merge preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated feedback workspace or API error.
 */
export async function post(req, res) {
	const result = commitFeedbackMerge(req.params.ideaId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
