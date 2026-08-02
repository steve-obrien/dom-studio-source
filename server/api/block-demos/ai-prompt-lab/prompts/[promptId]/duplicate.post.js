import { duplicateAiPromptLabPrompt } from '../../../../../lib/blockDemos/aiPromptLab.js';

/**
 * Duplicates the selected prompt version into a new editable version.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} New prompt version or API error.
 */
export async function post(req, res) {
	const result = duplicateAiPromptLabPrompt(req.params.promptId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
