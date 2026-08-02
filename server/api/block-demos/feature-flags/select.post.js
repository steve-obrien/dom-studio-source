import { selectFeatureFlagContext } from '../../../lib/blockDemos/featureFlagRelease.js';

/**
 * Selects one flag and environment using exact workspace state.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = selectFeatureFlagContext(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
