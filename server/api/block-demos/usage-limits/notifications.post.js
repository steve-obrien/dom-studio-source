import { testUsagePolicyNotifications } from '../../../lib/blockDemos/usageLimits.js';

/**
 * Sends a deterministic threshold-notification test.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = testUsagePolicyNotifications(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
