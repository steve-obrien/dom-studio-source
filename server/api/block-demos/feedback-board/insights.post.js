import { createFeedbackInsight } from '../../../lib/blockDemos/feedbackBoard.js';

/**
 * Captures one customer insight and links it to a product idea.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated feedback workspace or API error.
 */
export async function post(req, res) {
	const result = createFeedbackInsight(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
