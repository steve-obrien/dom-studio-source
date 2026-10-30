import { createFeedbackResponse } from '../../../../../lib/blockDemos/feedbackBoard.js';

/**
 * Adds an internal note or public customer response to one feedback idea.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated feedback workspace or API error.
 */
export async function post(req, res) {
	const result = createFeedbackResponse(req.params.ideaId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
