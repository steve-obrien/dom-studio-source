import { advancePackageRollout } from '../../../lib/blockDemos/entitlementMatrix.js';

/**
 * Advances the deterministic entitlement rollout worker.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated rollout evidence or API error.
 */
export async function post(req, res) {
	const result = advancePackageRollout();
	if (result.error) res.status(result.status || 400);
	return result;
}
