import { updateAiPromptLabPrompt } from '../../../../lib/blockDemos/aiPromptLab.js';

/**
 * Validates and saves an exact prompt revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated prompt or API error.
 */
export async function patch(req, res) {
	const result = updateAiPromptLabPrompt(req.params.promptId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
