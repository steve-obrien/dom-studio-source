import { createCustomerActivityTask } from '../../../lib/blockDemos/customerActivityWorkspace.js';

/**
 * Creates an acknowledged follow-up task.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = createCustomerActivityTask(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
