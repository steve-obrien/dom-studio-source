import { previewModerationAppeal } from '../../../../../lib/blockDemos/contentModeration.js';

/**
 * Creates an immutable second-review preview for one appeal.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated moderation workspace with appeal preview or API error.
 */
export async function post(req, res) {
	const result = previewModerationAppeal(req.params.appealId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
