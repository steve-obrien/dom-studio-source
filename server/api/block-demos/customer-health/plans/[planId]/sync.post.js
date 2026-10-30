import { syncCustomerSuccessPlan } from '../../../../../lib/blockDemos/customerHealthWorkspace.js';

/**
 * Synchronizes an active success plan to the CRM adapter.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = syncCustomerSuccessPlan(req.params.planId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
