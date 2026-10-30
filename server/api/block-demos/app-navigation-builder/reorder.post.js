import { reorderNavigationItems } from '../../../lib/blockDemos/appNavigationBuilder.js';

/**
 * Persist a complete drag-and-drop or keyboard-reordered navigation tree.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated navigation draft or API error.
 */
export async function post(req, res) {
	const result = reorderNavigationItems(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
