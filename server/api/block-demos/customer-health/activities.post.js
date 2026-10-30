import { logCustomerHealthActivity } from '../../../lib/blockDemos/customerHealthWorkspace.js';

/**
 * Adds a durable customer account timeline activity.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = logCustomerHealthActivity(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
