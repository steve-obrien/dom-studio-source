import { logCustomerActivityNote } from '../../../lib/blockDemos/customerActivityWorkspace.js';

/**
 * Adds a durable internal account note.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = logCustomerActivityNote(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
