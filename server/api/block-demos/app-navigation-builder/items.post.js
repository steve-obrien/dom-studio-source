import { createNavigationItem } from '../../../lib/blockDemos/appNavigationBuilder.js';

/**
 * Add a navigation item to the active draft.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated navigation draft or API error.
 */
export async function post(req, res) {
	const result = createNavigationItem(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
