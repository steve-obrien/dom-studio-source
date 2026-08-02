import { archiveNavigationItem } from '../../../../../lib/blockDemos/appNavigationBuilder.js';

/**
 * Archive one leaf navigation item with an audit reason.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated navigation draft or API error.
 */
export async function post(req, res) {
	const result = archiveNavigationItem(req.params.itemId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
