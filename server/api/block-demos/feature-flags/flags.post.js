import { createFeatureFlag } from '../../../lib/blockDemos/featureFlagRelease.js';

/**
 * Creates a disabled feature flag across every environment.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = createFeatureFlag(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
