import { createStatusSubscription } from '../../../lib/blockDemos/statusPage.js';

/**
 * Creates a pending subscription from an exact preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Pending subscription and delivery receipt or API error.
 */
export async function post(req, res) {
	const result = createStatusSubscription(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
