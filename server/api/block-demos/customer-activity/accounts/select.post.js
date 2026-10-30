import { selectCustomerActivityAccount } from '../../../../lib/blockDemos/customerActivityWorkspace.js';

/**
 * Persists the selected customer account.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = selectCustomerActivityAccount(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
