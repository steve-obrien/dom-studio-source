import { previewCustomerActivityTask } from '../../../../lib/blockDemos/customerActivityWorkspace.js';

/**
 * Creates an immutable follow-up task preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Workspace with task preview or API error.
 */
export async function post(req, res) {
	const result = previewCustomerActivityTask(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
