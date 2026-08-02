import { sendCustomerActivityUpdate } from '../../../lib/blockDemos/customerActivityWorkspace.js';

/**
 * Sends an acknowledged customer update through its provider route.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = sendCustomerActivityUpdate(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
