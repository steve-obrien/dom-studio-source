import { previewFeedbackMerge } from '../../../../../lib/blockDemos/feedbackBoard.js';

/**
 * Creates an immutable preview for combining two feedback ideas.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Merge preview or API error.
 */
export async function post(req, res) {
	const result = previewFeedbackMerge(req.params.ideaId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
