import { updateNavigationItem } from '../../../../lib/blockDemos/appNavigationBuilder.js';

/**
 * Save editable metadata for one navigation item.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated navigation draft or API error.
 */
export async function patch(req, res) {
	const result = updateNavigationItem(req.params.itemId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
