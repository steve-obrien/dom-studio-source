import { previewFeatureFlagChange } from '../../../../lib/blockDemos/featureFlagRelease.js';

/**
 * Creates an immutable rollout and targeting change preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Workspace with release preview or API error.
 */
export async function post(req, res) {
	const result = previewFeatureFlagChange(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
