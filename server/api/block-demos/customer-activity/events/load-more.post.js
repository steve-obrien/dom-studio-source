import { loadMoreCustomerActivity } from '../../../../lib/blockDemos/customerActivityWorkspace.js';

/**
 * Loads the next server-owned page of customer activity.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = loadMoreCustomerActivity(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
