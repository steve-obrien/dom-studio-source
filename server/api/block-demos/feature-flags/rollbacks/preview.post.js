import { previewFeatureFlagRollback } from '../../../../lib/blockDemos/featureFlagRelease.js';

/**
 * Creates immutable evidence for restoring the previous configuration.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Workspace with rollback preview or API error.
 */
export async function post(req, res) {
	const result = previewFeatureFlagRollback(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
