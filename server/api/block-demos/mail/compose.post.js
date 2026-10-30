import { composeMailThread } from '../../../lib/blockDemos/mailWorkspace.js';

/**
 * Sends a new mail conversation or persists it as a draft.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Created mail thread or API error.
 */
export async function post(req, res) {
	const result = composeMailThread(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
