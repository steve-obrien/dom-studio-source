import { updateFeedbackIdea } from '../../../../lib/blockDemos/feedbackBoard.js';

/**
 * Updates one product decision against exact workspace and idea versions.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated feedback workspace or API error.
 */
export async function patch(req, res) {
	const result = updateFeedbackIdea(req.params.ideaId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
