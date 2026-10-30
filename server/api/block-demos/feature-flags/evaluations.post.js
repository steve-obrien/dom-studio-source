import { evaluateFeatureFlagContext } from '../../../lib/blockDemos/featureFlagRelease.js';

/**
 * Evaluates one test context against live or previewed targeting.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Workspace with evaluation evidence or API error.
 */
export async function post(req, res) {
	const result = evaluateFeatureFlagContext(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
