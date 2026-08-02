import { previewCustomerActivityUpdate } from '../../../../lib/blockDemos/customerActivityWorkspace.js';

/**
 * Creates an immutable outbound customer-update preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Workspace with update preview or API error.
 */
export async function post(req, res) {
	const result = previewCustomerActivityUpdate(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
