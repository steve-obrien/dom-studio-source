import { getAiPromptLabPrompt } from '../../../../lib/blockDemos/aiPromptLab.js';

/**
 * Returns one prompt version workspace.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Prompt detail or API error.
 */
export async function get(req, res) {
	const result = getAiPromptLabPrompt(req.params.promptId);
	if (result.error) res.status(result.status || 400);
	return result;
}
