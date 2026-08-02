import { advanceUsagePolicyRollout } from '../../../lib/blockDemos/usageLimits.js';

/**
 * Advances the deterministic usage-policy rollout worker.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = advanceUsagePolicyRollout();
	if (result.error) res.status(result.status || 400);
	return result;
}
