import { rollbackFeatureFlag } from '../../../lib/blockDemos/featureFlagRelease.js';

/**
 * Restores the exact previous feature-flag configuration.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace with rollback proof or API error.
 */
export async function post(req, res) {
	const result = rollbackFeatureFlag(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
