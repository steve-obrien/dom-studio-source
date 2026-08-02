import { verifyStatusSubscription } from '../../../../../lib/blockDemos/statusPage.js';

/**
 * Verifies one pending status subscription.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Active subscription and receipt or API error.
 */
export async function post(req, res) {
	const result = verifyStatusSubscription(req.params.subscriptionId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
