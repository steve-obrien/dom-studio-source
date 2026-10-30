import { previewStatusSubscription } from '../../../lib/blockDemos/statusPage.js';

/**
 * Creates an immutable customer subscription preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Subscription preview or validation error.
 */
export async function post(req, res) {
	const result = previewStatusSubscription(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
