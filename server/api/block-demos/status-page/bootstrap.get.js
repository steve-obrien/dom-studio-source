import { getStatusPageWorkspace } from '../../../lib/blockDemos/statusPage.js';

/**
 * Returns the public status-page workspace for one region.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Status-page workspace or API error.
 */
export async function get(req, res) {
	const result = getStatusPageWorkspace(req.query.region);
	if (result.error) res.status(result.status || 400);
	return result;
}
