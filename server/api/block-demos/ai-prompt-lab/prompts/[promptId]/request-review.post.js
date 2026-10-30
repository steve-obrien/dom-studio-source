import { requestAiPromptLabReview } from '../../../../../lib/blockDemos/aiPromptLab.js';

/**
 * Runs release checks and hands a tested prompt to a reviewer.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Review handoff or API error.
 */
export async function post(req, res) {
	const result = requestAiPromptLabReview(req.params.promptId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
