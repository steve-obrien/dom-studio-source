import { launchCustomerSuccessPlan } from '../../../lib/blockDemos/customerHealthWorkspace.js';

/**
 * Launches an acknowledged immutable success-plan preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace with active plan or API error.
 */
export async function post(req, res) {
	const result = launchCustomerSuccessPlan(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
