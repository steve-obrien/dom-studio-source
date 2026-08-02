import { runAiPromptLabSuite } from '../../../lib/blockDemos/aiPromptLab.js';

/**
 * Runs the registered dataset against an exact saved prompt revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Evaluation result or API error.
 */
export async function post(req, res) {
	const result = runAiPromptLabSuite(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
